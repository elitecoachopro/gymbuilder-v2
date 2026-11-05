'use client';
import { useEffect, useRef, useState } from 'react';
import { mergeChatMessages, type ChatMessage } from '@/lib/chat-sync';
import { Loader2, Send } from 'lucide-react';
import { useUiText } from '@/i18n/useUiText';
export default function RequestChat({ requestId, userRole }: { requestId: string; userRole: 'client' | 'supplier' }) {
  return <ChatSession key={requestId} requestId={requestId} userRole={userRole} />;
}

function ChatSession({ requestId, userRole }: { requestId: string; userRole: 'client' | 'supplier' }) {
  const ui = useUiText();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [syncError, setSyncError] = useState('');
  const [paused, setPaused] = useState(false);
  const messageList = useRef<HTMLDivElement>(null);
  const followLatest = useRef(true);

  useEffect(() => {
    let disposed = false;
    let pending = false;
    let failures = 0;
    let terminal = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let controller: AbortController | undefined;
    const active = () => document.visibilityState !== 'hidden' && navigator.onLine;

    async function fetchMessages() {
      clearTimeout(timer);
      setPaused(!active());
      if (!active()) setLoading(false);
      if (disposed || pending || terminal || !active()) return;
      pending = true;
      controller = new AbortController();
      const timeout = setTimeout(() => controller?.abort(), 12000);
      try {
        const res = await fetch(`/api/messages?request_id=${encodeURIComponent(requestId)}`, { signal: controller.signal, cache: 'no-store' });
        if (!res.ok) {
          terminal = [401, 403, 404].includes(res.status);
          throw new Error(terminal ? 'Accesul la conversație nu mai este disponibil. Autentifică-te din nou.' : 'Mesajele nu au putut fi actualizate. Reîncercăm automat.');
        }
        const data = await res.json();
        if (!Array.isArray(data.messages)) throw new Error('Răspuns invalid. Reîncercăm automat.');
        if (!disposed) {
          setMessages(previous => mergeChatMessages(previous, data.messages));
          setSyncError('');
          failures = 0;
        }
      } catch (error) {
        if (!disposed) {
          failures += 1;
          setSyncError(error instanceof Error && error.name !== 'AbortError' ? error.message : 'Conexiunea a expirat. Reîncercăm automat.');
        }
      } finally {
        clearTimeout(timeout);
        pending = false;
        if (!disposed) {
          setLoading(false);
          if (!terminal && active()) timer = setTimeout(fetchMessages, Math.min(30000, 5000 * 2 ** Math.min(failures, 3)));
        }
      }
    }
    function resume() {
      clearTimeout(timer);
      setPaused(!active());
      if (active()) void fetchMessages();
    }
    void fetchMessages();
    document.addEventListener('visibilitychange', resume);
    window.addEventListener('focus', resume);
    window.addEventListener('online', resume);
    window.addEventListener('offline', resume);
    return () => {
      disposed = true;
      clearTimeout(timer);
      controller?.abort();
      document.removeEventListener('visibilitychange', resume);
      window.removeEventListener('focus', resume);
      window.removeEventListener('online', resume);
      window.removeEventListener('offline', resume);
    };
  }, [requestId, refresh]);

  useEffect(() => {
    if (followLatest.current && messageList.current) messageList.current.scrollTop = messageList.current.scrollHeight;
  }, [messages]);

  async function handleSend() {
    if (!newMessage.trim() || sending || loading) return;
    setSending(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id: requestId, content: newMessage.trim() }),
      });
      if (!res.ok) throw new Error();
      if (res.ok) {
        const data = await res.json();
        setChatError('');
        followLatest.current = true;
        setMessages(prev => mergeChatMessages(prev, [data.message]));
        setNewMessage('');
      }
    } catch { setChatError('Mesajul nu a fost trimis. Textul a fost păstrat; încearcă din nou.'); } finally { setSending(false); }
  }

  if (loading) {
    return (
      <div className="mt-3 ml-0 sm:ml-12 flex items-center gap-2 text-xs text-anthracite-400">
        <Loader2 className="w-3 h-3 animate-spin" /> {ui("Se încarcă mesajele...")}</div>
    );
  }

  return (
    <div className="mt-3 ml-0 sm:ml-12 border border-anthracite-700 rounded-lg overflow-hidden">
      {(chatError || syncError) && <p role="alert" className="p-3 text-red-300">{ui(chatError || syncError)}</p>}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 border-b border-anthracite-700"><p role="status" className="text-xs text-anthracite-300">{ui(paused ? 'Actualizare întreruptă cât timp ești offline sau aplicația este în fundal.' : syncError ? 'Conexiune întreruptă' : 'Actualizare automată activă')}</p><button className="min-h-11 px-3 text-gold-400 disabled:opacity-50" disabled={sending || loading} onClick={() => setRefresh(n => n + 1)}>{ui('Reîncarcă mesajele')}</button></div>
      {/* Messages list */}
      <div ref={messageList} role="log" aria-label={ui("Mesajele conversației")} aria-live="polite" aria-relevant="additions" onScroll={() => { const el = messageList.current; if (el) followLatest.current = el.scrollHeight - el.scrollTop - el.clientHeight < 64; }} className="max-h-80 overflow-y-auto p-3 space-y-2 bg-anthracite-900/50">
        {messages.length === 0 && !chatError && !syncError ? (
          <p className="text-xs text-anthracite-500 text-center py-4">{ui("Niciun mesaj încă. Începe conversația!")}</p>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender_type === userRole;
            return (
              <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[75%] rounded-lg px-3 py-2 ${
                  isOwn
                    ? 'bg-gold-400/10 border border-gold-400/30'
                    : 'bg-anthracite-700 border border-anthracite-600'
                }`}>
                  <p className={`text-xs font-medium mb-0.5 break-words ${isOwn ? 'text-gold-400' : 'text-blue-400'}`}>
                    {msg.sender_name}
                  </p>
                  <p className="text-sm text-white whitespace-pre-wrap break-words">{msg.content}</p>
                  <p className="text-[10px] text-anthracite-500 mt-1">
                    {new Date(msg.created_at).toLocaleString(ui('ro-RO'), { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
      {/* Composer */}
      <div className="flex items-center gap-2 p-2 border-t border-anthracite-700 bg-anthracite-800">
        <input
          aria-label={ui("Mesaj nou")} maxLength={5000}
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder={ui("Scrie un mesaj...")}
          className="flex-1 min-w-0 min-h-11 bg-anthracite-900 border border-anthracite-600 rounded-lg px-3 py-2 text-base sm:text-sm text-white placeholder:text-anthracite-500 focus:outline-none focus:border-gold-400"
          disabled={sending}
        />
        <button
          aria-label={ui("Trimite mesajul")}
          onClick={handleSend}
          disabled={sending || !newMessage.trim()}
          className="bg-gold-400 text-anthracite-950 min-h-11 min-w-11 p-2 rounded-lg hover:bg-gold-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}
