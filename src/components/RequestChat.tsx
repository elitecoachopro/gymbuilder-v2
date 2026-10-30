'use client';
import { useEffect, useState } from 'react';
import { Loader2, Send } from 'lucide-react';
import { useUiText } from '@/i18n/useUiText';
export default function RequestChat({ requestId, userRole }: { requestId: string; userRole: 'client' | 'supplier' }) {
  const ui = useUiText();
  const [messages, setMessages] = useState<{ id: string; sender_type: string; sender_name: string; content: string; created_at: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [chatError, setChatError] = useState('');
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setChatError('');
    async function fetchMessages() {
      try {
        const res = await fetch(`/api/messages?request_id=${requestId}`, { signal: controller.signal });
        if (!res.ok) throw new Error();
        if (res.ok) {
          const data = await res.json();
          if (!controller.signal.aborted) setMessages(data.messages || []);
        }
      } catch { if (!controller.signal.aborted) setChatError('Mesajele nu au putut fi încărcate.'); } finally { if (!controller.signal.aborted) setLoading(false); }
    }
    fetchMessages();
    return () => controller.abort();
  }, [requestId, refresh]);

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
        setMessages(prev => [...prev, data.message]);
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
      {chatError && <p role="alert" className="p-3 text-red-300">{ui(chatError)}</p>}
      <button className="min-h-11 px-3 text-gold-400 disabled:opacity-50" disabled={sending || loading} onClick={() => setRefresh(n => n + 1)}>{ui('Reîncarcă mesajele')}</button>
      {/* Messages list */}
      <div className="max-h-64 overflow-y-auto p-3 space-y-2 bg-anthracite-900/50">
        {messages.length === 0 && !chatError ? (
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
                  <p className={`text-[10px] font-medium mb-0.5 ${isOwn ? 'text-gold-400' : 'text-blue-400'}`}>
                    {msg.sender_name}
                  </p>
                  <p className="text-sm text-white whitespace-pre-wrap">{msg.content}</p>
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
          className="flex-1 min-w-0 min-h-11 bg-anthracite-900 border border-anthracite-600 rounded-lg px-3 py-2 text-sm text-white placeholder:text-anthracite-500 focus:outline-none focus:border-gold-400"
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
