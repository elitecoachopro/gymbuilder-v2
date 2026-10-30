'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/store/auth';
import { activateEditorDraftOwner, clearEditorDrafts, EDITOR_DRAFT_LOGOUT, latestEditorDraft, removeEditorDraft, saveEditorDraft, type EditorDraft } from '@/lib/gym-editor-draft';
import type { EditorSnapshot } from '@/lib/gym-editor-history';

type Options = EditorSnapshot & { projectId: string | null; savedFingerprint: string; dirty: boolean; onOwnerChange: () => void };
type Status = 'checking' | 'idle' | 'saving' | 'saved' | 'error' | 'signed-out';

export function useEditorDraft(options: Options) {
  const user = useAuthStore(state => state.user), loading = useAuthStore(state => state.isLoading);
  const owner = loading ? null : user?.id ?? 'guest';
  const ownerRef = useRef<string | null>(null), previousOwner = useRef<string | null>(null);
  const optionsRef = useRef(options); optionsRef.current = options;
  const generation = useRef(0), ended = useRef(false);
  const [readyOwner, setReadyOwner] = useState<string | null>(null), [candidate, setCandidate] = useState<EditorDraft | null>(null);
  const needsCleanCheckpoint = useRef(false);
  const [status, setStatus] = useState<Status>('checking'), [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;
    generation.current++;
    ownerRef.current = owner;
    setReadyOwner(null); setCandidate(null); setUpdatedAt(null); needsCleanCheckpoint.current = false;
    if (!owner) return;
    ended.current = false;
    if (previousOwner.current && previousOwner.current !== owner) optionsRef.current.onOwnerChange();
    previousOwner.current = owner;
    activateEditorDraftOwner(owner);
    setStatus('checking');
    const wanted = new URLSearchParams(window.location.search).get('id') ?? undefined;
    latestEditorDraft(owner, wanted).then(draft => {
      if (cancelled || ended.current) return;
      setCandidate(draft); setReadyOwner(draft ? null : owner); setStatus('idle');
    }).catch(() => { if (!cancelled && !ended.current) setStatus('error'); });
    return () => { cancelled = true; ownerRef.current = null; };
  }, [owner, retry]);

  useEffect(() => {
    const logout = (account: string) => {
      if (account !== ownerRef.current) return;
      ended.current = true; generation.current++;
      setReadyOwner(null); setCandidate(null); setUpdatedAt(null); needsCleanCheckpoint.current = false; setStatus('checking');
      optionsRef.current.onOwnerChange();
      void clearEditorDrafts(account, false).then(() => { if (ended.current && ownerRef.current === account) setStatus('signed-out'); }).catch(() => { if (ownerRef.current === account) setStatus('error'); });
    };
    const local = (event: Event) => logout((event as CustomEvent<string>).detail);
    const remote = (event: StorageEvent) => {
      if (event.key !== EDITOR_DRAFT_LOGOUT || !event.newValue) return;
      try { const value = JSON.parse(event.newValue); if (typeof value.owner === 'string') logout(value.owner); } catch {}
    };
    window.addEventListener(EDITOR_DRAFT_LOGOUT, local);
    window.addEventListener('storage', remote);
    return () => { window.removeEventListener(EDITOR_DRAFT_LOGOUT, local); window.removeEventListener('storage', remote); };
  }, []);

  useEffect(() => {
    if (!owner || readyOwner !== owner || ended.current || (!options.dirty && !needsCleanCheckpoint.current)) return;
    needsCleanCheckpoint.current = options.dirty;
    const current = ++generation.current;
    const draft: EditorDraft = { version: 1, owner, projectId: options.projectId, document: options.document, storey: options.storey, savedFingerprint: options.savedFingerprint, updatedAt: Date.now() };
    setStatus('saving');
    saveEditorDraft(draft).then(() => {
      if (current !== generation.current || ownerRef.current !== owner || ended.current) return;
      setUpdatedAt(options.dirty ? draft.updatedAt : null); setStatus(options.dirty ? 'saved' : 'idle');
    }).catch(() => { if (current === generation.current && !ended.current) setStatus('error'); });
  }, [owner, readyOwner, options.document, options.storey, options.projectId, options.savedFingerprint, options.dirty]);

  const accept = () => {
    if (!candidate || candidate.owner !== ownerRef.current || ended.current) return null;
    setCandidate(null); setReadyOwner(candidate.owner); return candidate;
  };
  const dismiss = async () => {
    if (!candidate) return;
    try { await removeEditorDraft(candidate.owner, candidate.projectId, JSON.stringify(candidate.document)); }
    catch { if (ownerRef.current === candidate.owner && !ended.current) setStatus('error'); }
    if (ownerRef.current !== candidate.owner || ended.current) return;
    setCandidate(null); setReadyOwner(candidate.owner);
  };
  const markSaved = async (projectId: string | null, fingerprint: string) => {
    const account = ownerRef.current;
    if (!account || ended.current) return;
    const current = ++generation.current;
    try {
      await removeEditorDraft(account, projectId, fingerprint);
      if (current === generation.current && ownerRef.current === account && !ended.current) { setStatus('idle'); setUpdatedAt(null); }
    } catch { if (current === generation.current && ownerRef.current === account && !ended.current) setStatus('error'); }
  };
  return { candidate, status, updatedAt, accept, dismiss, markSaved, retry: () => setRetry(value => value + 1) };
}
