'use client';

import { createContactSender } from '@/lib/contact-sender';
import { useUiText } from '@/i18n/useUiText';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader2, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { usePathname } from 'next/navigation';

interface PageContext {
  type: 'product' | 'supplier' | 'general';
  productName?: string;
  productId?: string;
  supplierName?: string;
  supplierId?: string;
}

interface ConversationRequest {
  id: string; status: string;
  supplier_profiles: { company_name: string } | null;
  products: { name: string } | null;
}

interface ActiveConversation {
  requestId: string;
  supplierName: string;
  productName?: string;
}

export default function FloatingChatButton() {
  const ui = useUiText();
  const [sendGeneral] = useState(() => createContactSender('/api/contact'));
  const [sendSupplier] = useState(() => createContactSender('/api/contact/supplier'));
  const [isOpen, setIsOpen] = useState(false);
  const user = useAuthStore(s => s.user);
  const [formError, setFormError] = useState('');
  const [contextLoading, setContextLoading] = useState(false);
  const [activeConversations, setActiveConversations] = useState<ActiveConversation[]>([]);
  const [pageContext, setPageContext] = useState<PageContext>({ type: 'general' });
  const [formState, setFormState] = useState<'form' | 'sending' | 'success'>('form');
  const [formData, setFormData] = useState({ name: '', contact: '', message: '' });
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    if (user) fetchConversations(user.id, controller.signal);
    else { setActiveConversations([]); setFormData({ name: '', contact: '', message: '' }); }
    return () => controller.abort();
  }, [user]);

  useEffect(() => {
    const controller = new AbortController();
    const productMatch = pathname?.match(/^\/products\/([^/]+)$/);
    const supplierMatch = pathname?.match(/^\/suppliers\/([^/]+)$/);
    setPageContext({ type: 'general' }); setFormError('');
    if (!productMatch && !supplierMatch) { setContextLoading(false); return; }
    setContextLoading(true);
    const url = productMatch ? `/api/products/${productMatch[1]}` : `/api/suppliers/${supplierMatch![1]}`;
    fetch(url, { signal: controller.signal }).then(async res => {
      if (!res.ok) throw new Error('Contextul paginii nu a putut fi încărcat.');
      const data = await res.json();
      const supplier = data.product?.supplier || data.supplier;
      if (!supplier?.id) throw new Error('Furnizor indisponibil.');
      setPageContext({ type: productMatch ? 'product' : 'supplier', productId: data.product?.id, productName: data.product?.name, supplierId: supplier.id, supplierName: supplier.company_name });
      setFormData(previous => ({ ...previous, message: productMatch ? `Bună ziua! Sunt interesat(ă) de ${data.product.name}.` : 'Bună ziua! Aș dori detalii despre produsele dumneavoastră.' }));
    }).catch(error => { if (!controller.signal.aborted) setFormError(error.message); })
      .finally(() => { if (!controller.signal.aborted) setContextLoading(false); });
    return () => controller.abort();
  }, [pathname]);

  async function fetchConversations(userId: string, signal: AbortSignal) {
    try {
      const res = await fetch('/api/client/dashboard', { signal });
      if (res.ok) {
        const data: { contactRequests?: ConversationRequest[] } = await res.json();
        if (data.contactRequests) {
          const active = data.contactRequests
            .filter((cr) => cr.status === 'replied' || cr.status === 'viewed')
            .slice(0, 3)
            .map((cr) => ({
              requestId: cr.id,
              supplierName: cr.supplier_profiles?.company_name || 'Furnizor',
              productName: cr.products?.name || undefined,
            }));
          if (!signal.aborted) setActiveConversations(active);
        }
      }
    } catch {}
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name || !formData.contact || !formData.message) return;

    setFormState('sending');

    try {
      const body = { name: formData.name, email: formData.contact, message: formData.message, supplierId: pageContext.supplierId, productId: pageContext.productId, subject: 'Contact rapid - Gym Builder' };
      if (/^\/(products|suppliers)\/[^/]+$/.test(pathname || '') && !pageContext.supplierId) throw new Error('Furnizor indisponibil. Reîncarcă pagina.');
      const res = await (pageContext.supplierId ? sendSupplier : sendGeneral)(body);
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Mesajul nu a putut fi trimis.');
      setFormState('success'); setFormError('');
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Eroare de conexiune.');
      setFormState('form');
    }
  }

  function navigateToChat(requestId: string) {
    // Navigate to client dashboard with chat open
    window.location.href = `/client/dashboard?chat=${requestId}`;
    setIsOpen(false);
  }

  // Pre-fill name and contact if user is logged in
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: prev.name || user.name || '',
        contact: prev.contact || user.email || '',
      }));
    }
  }, [user]);

  useEffect(() => {
    if (!isOpen) return;
    function handleOutside(e: PointerEvent) {
      const target = e.target as Node;
      if (!panelRef.current?.contains(target) && !triggerRef.current?.contains(target)) setIsOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setIsOpen(false); triggerRef.current?.focus(); }
    }
    document.addEventListener('pointerdown', handleOutside);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('pointerdown', handleOutside);
      document.removeEventListener('keydown', handleKey);
    };
  }, [isOpen]);

  // Determine if we should show conversations or form
  const hasActiveChats = user && activeConversations.length > 0;
  const showConversationsList = hasActiveChats && pageContext.type === 'general';

  return (
    <>
      {/* Floating Button */}
      <button
        ref={triggerRef}
        aria-expanded={isOpen}
        aria-controls="quick-contact"
        onClick={() => setIsOpen(open => !open)}
        className={`fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] right-4 sm:right-6 z-[60] w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          isOpen
            ? 'bg-anthracite-800 border border-anthracite-600 rotate-0'
            : 'bg-gold-400 hover:bg-gold-300 hover:scale-105 active:scale-95'
        }`}
        aria-label={ui(isOpen ? 'Închide chat' : 'Chat rapid')}
      >
        {isOpen ? (
          <X className="w-5 h-5 text-white" />
        ) : (
          <MessageCircle className="w-6 h-6 text-anthracite-950" />
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          id="quick-contact"
          role="region"
          aria-label={ui("Contact rapid")}
          className="fixed bottom-[calc(max(1.5rem,env(safe-area-inset-bottom))+4.5rem)] right-4 sm:right-6 z-[60] flex flex-col w-[calc(100vw-2rem)] max-w-[340px] max-h-[min(480px,calc(100dvh-7rem-env(safe-area-inset-bottom)))] bg-anthracite-900 border border-anthracite-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          {/* Header */}
          <div className="shrink-0 bg-anthracite-800 px-4 py-3 border-b border-anthracite-700">
            <h3 className="text-sm font-semibold text-white">
              {pageContext.type === 'product' && ui('💬 Întreabă despre produs')}
              {pageContext.type === 'supplier' && ui('💬 Contactează furnizorul')}
              {pageContext.type === 'general' && `💬 ${ui('Contact rapid')}`}
            </h3>
            <p className="text-xs text-anthracite-400 mt-0.5">
              {pageContext.type === 'product' && pageContext.productName && (
                <span className="truncate block">{pageContext.productName}</span>
              )}
              {pageContext.type === 'supplier' && pageContext.supplierName && (
                <span className="truncate block">{pageContext.supplierName}</span>
              )}
              {pageContext.type === 'general' && ui('Răspundem în maxim 24h')}
            </p>
          </div>

          {/* Content */}
          <div className="p-4 min-h-0 overflow-y-auto overscroll-contain">
            {/* Show active conversations if on general page and user has chats */}
            {showConversationsList && (
              <div className="mb-4">
                <p className="text-xs text-anthracite-400 uppercase tracking-wider mb-2 font-medium">
                  {ui("Conversații active")}</p>
                <div className="space-y-2">
                  {activeConversations.map((conv) => (
                    <button
                      key={conv.requestId}
                      onClick={() => navigateToChat(conv.requestId)}
                      className="w-full text-left px-3 py-2.5 bg-anthracite-800 hover:bg-anthracite-750 border border-anthracite-700 hover:border-gold-400/30 rounded-xl transition-colors group"
                    >
                      <p className="text-sm text-white font-medium group-hover:text-gold-400 transition-colors truncate">
                        {conv.supplierName}
                      </p>
                      {conv.productName && (
                        <p className="text-xs text-anthracite-400 truncate mt-0.5">
                          Re: {conv.productName}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
                <div className="border-t border-anthracite-700 my-3" />
                <p className="text-xs text-anthracite-400 uppercase tracking-wider mb-2 font-medium">
                  {ui("Mesaj nou")}</p>
              </div>
            )}

            {/* Success State */}
            {formState === 'success' && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mb-3">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                </div>
                <p className="text-sm font-medium text-white">{ui("Mesaj trimis!")}</p>
                <p className="text-xs text-anthracite-400 mt-1">
                  {ui("Vei primi un răspuns în cel mai scurt timp.")}</p>
              </div>
            )}

            {formError && <p role="alert" className="text-sm text-red-400 mb-3">{ui(formError)}</p>}
            {/* Form */}
            {formState !== 'success' && (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <input
                    type="text"
                    placeholder={ui("Numele tău")} aria-label={ui("Numele tău")}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-anthracite-800 border border-anthracite-700 rounded-lg text-base sm:text-sm text-white placeholder:text-anthracite-500 focus:outline-none focus:border-gold-400/50 transition-colors"
                    required
                  />
                </div>
                <div>
                  <input
                    type="email" placeholder="Email" aria-label="Email"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    className="w-full px-3 py-2 bg-anthracite-800 border border-anthracite-700 rounded-lg text-base sm:text-sm text-white placeholder:text-anthracite-500 focus:outline-none focus:border-gold-400/50 transition-colors"
                    required
                  />
                </div>
                <div>
                  <textarea
                    placeholder={ui("Mesajul tău...")} aria-label={ui("Mesaj")} maxLength={5000}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 bg-anthracite-800 border border-anthracite-700 rounded-lg text-base sm:text-sm text-white placeholder:text-anthracite-500 focus:outline-none focus:border-gold-400/50 transition-colors resize-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={formState === 'sending' || contextLoading}
                  className="w-full min-h-11 flex items-center justify-center gap-2 px-4 py-2.5 bg-gold-400 hover:bg-gold-300 text-anthracite-950 font-semibold text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {formState === 'sending' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {ui("Se trimite...")}</>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      {ui("Trimite mesajul")}</>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
