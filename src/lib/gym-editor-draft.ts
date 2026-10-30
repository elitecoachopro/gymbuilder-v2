import { z } from 'zod';
import { spaceSchema, validateSpace } from './gym-space.ts';

const draftSchema = z.object({
  version: z.literal(1), owner: z.string().min(1).max(200), projectId: z.string().min(1).max(200).nullable(),
  savedFingerprint: z.string(), updatedAt: z.number().finite().nonnegative(), storey: z.union([z.literal(0), z.literal(1)]),
  document: z.object({ name: z.string().max(120), height: z.number().min(2).max(30), budget: z.number().positive().max(99999999).nullable(), brief: z.string().max(6000), space: spaceSchema }).strict(),
}).strict();
export type EditorDraft = z.infer<typeof draftSchema>;
export const EDITOR_DRAFT_LOGOUT = 'gymbuilder-editor-logout';

export function readEditorDraft(value: unknown, owner: string): EditorDraft | null {
  const parsed = draftSchema.safeParse(value);
  if (!parsed.success || parsed.data.owner !== owner) return null;
  const draft = parsed.data;
  if ((draft.storey === 1 && !draft.document.space.upperFloor) || validateSpace(draft.document.space, draft.document.height, draft.document.budget)) return null;
  return draft;
}

export const isRecoverableEditorDraft = (draft: EditorDraft) => JSON.stringify(draft.document) !== draft.savedFingerprint;

export class DraftWriteQueue {
  private pending: Promise<void> = Promise.resolve();
  private sink: (draft: EditorDraft) => Promise<void>;
  constructor(sink: (draft: EditorDraft) => Promise<void>) { this.sink = sink; }
  write(draft: EditorDraft): Promise<void> {
    const snapshot = structuredClone(draft);
    const next = this.pending.then(() => this.sink(snapshot));
    this.pending = next.catch(() => {});
    return next;
  }
  settled() { return this.pending; }
}

const blockedOwners = new Set<string>();
const key = (owner: string, projectId: string | null) => JSON.stringify([owner, projectId]);

async function database(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') throw new Error('Local storage unavailable');
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('gymbuilder-editor', 1);
    let blocked = false;
    request.onupgradeneeded = () => { request.result.createObjectStore('drafts').createIndex('owner', 'owner'); };
    request.onblocked = () => { blocked = true; reject(new Error('Local storage blocked')); };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      if (blocked) { db.close(); return; }
      db.onversionchange = () => db.close();
      resolve(db);
    };
  });
}

async function transact<T>(mode: IDBTransactionMode, work: (store: IDBObjectStore, result: (value: T) => void) => void): Promise<T> {
  const db = await database();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction('drafts', mode);
      let value: T;
      tx.oncomplete = () => resolve(value);
      tx.onabort = () => reject(tx.error ?? new Error('Local storage transaction aborted'));
      tx.onerror = () => {};
      try { work(tx.objectStore('drafts'), result => { value = result; }); }
      catch (error) { tx.abort(); reject(error); }
    });
  } finally { db.close(); }
}

const writer = new DraftWriteQueue(async draft => {
  if (blockedOwners.has(draft.owner)) return;
  await transact<void>('readwrite', store => { store.put(draft, key(draft.owner, draft.projectId)); });
});
export const saveEditorDraft = (draft: EditorDraft) => writer.write(draft);
export const activateEditorDraftOwner = (owner: string) => { blockedOwners.delete(owner); };

export async function latestEditorDraft(owner: string, projectId?: string): Promise<EditorDraft | null> {
  const records = await transact<unknown[]>('readonly', (store, result) => {
    const request = store.index('owner').getAll(owner);
    request.onsuccess = () => result(request.result);
  });
  const valid = records.map(record => readEditorDraft(record, owner));
  if (valid.some(record => !record)) throw new Error('Incompatible local draft');
  return valid.filter((record): record is EditorDraft => !!record && isRecoverableEditorDraft(record) && (projectId === undefined || record.projectId === projectId)).sort((a, b) => b.updatedAt - a.updatedAt)[0] ?? null;
}

export async function removeEditorDraft(owner: string, projectId: string | null, documentFingerprint: string): Promise<void> {
  await writer.settled();
  await transact<void>('readwrite', store => {
    const request = store.get(key(owner, projectId));
    request.onsuccess = () => {
      const record = readEditorDraft(request.result, owner);
      if (record && JSON.stringify(record.document) === documentFingerprint) store.delete(key(owner, projectId));
    };
  });
}

export async function clearEditorDrafts(owner: string, notify = true): Promise<void> {
  blockedOwners.add(owner);
  if (notify && typeof window !== 'undefined') {
    const value = JSON.stringify({ owner, at: Date.now() });
    window.dispatchEvent(new CustomEvent(EDITOR_DRAFT_LOGOUT, { detail: owner }));
    try { localStorage.setItem(EDITOR_DRAFT_LOGOUT, value); } catch {}
  }
  await writer.settled();
  await transact<void>('readwrite', store => {
    const request = store.index('owner').getAllKeys(owner);
    request.onsuccess = () => { for (const id of request.result) store.delete(id); };
  });
}
