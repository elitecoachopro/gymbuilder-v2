'use client';
import { useState } from 'react';
import RequestChat from '../../../../src/components/RequestChat';
import { LocaleProvider } from '../../../../src/i18n/LocaleProvider';
export default function ChatCheck() {
  const [mode, setMode] = useState({ failGet: false, failPost: false, slowPost: false });
  const [busy, setBusy] = useState(false);
  async function toggle(key: keyof typeof mode) {
    setBusy(true);
    const next = { ...mode, [key]: !mode[key] };
    try {
      const result = await fetch('/api/chat-fixture', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(next) });
      if (result.ok) setMode(next);
    } finally { setBusy(false); }
  }
  return <LocaleProvider initialLocale="ro"><main className="p-5 max-w-2xl mx-auto text-white"><h1>Verificare conversații · date fictive</h1>
    <div className="flex flex-wrap gap-3 py-5">{(['failGet', 'failPost', 'slowPost'] as const).map(key => <button className="min-h-11 rounded border p-3" key={key} aria-pressed={mode[key]} disabled={busy} onClick={() => toggle(key)}>{key}</button>)}</div>
    <RequestChat requestId="fixture-request" userRole="client" />
  </main></LocaleProvider>;
}
