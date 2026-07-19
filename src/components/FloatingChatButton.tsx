'use client';

import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader2, CheckCircle } from 'lucide-react';
import { usePathname } from 'next/navigation';

interface PageContext {
  type: 'product' | 'supplier' | 'general';
  productName?: string;
  productId?: string;
  supplierName?: string;
  supplierId?: string;
}

interface ActiveConversation {
  requestId: string;
  supplierName: string;
  productName?: string;
}

export default function FloatingChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<{ id: string; full_name: string; email: string } | null>(null);
  const [activeConversations, setActiveConversations] = useState<ActiveConversation[]>([]);
  const [pageContext, setPageContext] = useState<PageContext>({ type: 'general' });
  const [formState, setFormState] = useState<'form' | 'sending' | 'success'>('form');
  const [formData, setFormData] = useState({ name: '', contact: '', message: '' });
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);

  // Check user session
  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
            // Fetch active conversations for logged-in user
            fetchConversations(data.user.id);
          }
        }
      } catch {}
    }
    checkSession();
  }, []);

  // Detect page context from URL and page content
  useEffect(() => {
    detectPageContext();
  }, [pathname]);

  function detectPageContext() {
    // Product page: /products/[id]
    const productMatch = pathname.match(/^\/products\/([^/]+)$/);
    if (productMatch) {
      // Try to get product name from page title or DOM
      const productName = document.querySelector('h1')?.textContent || 'acest produs';
      const supplierEl = document.querySelector('[data-supplier-id]');
      setPageContext({
        type: 'product',
        productId: productMatch[1],
        productName,
        supplierId: supplierEl?.getAttribute('data-supplier-id') || undefined,
        supplierName: supplierEl?.getAttribute('data-supplier-name') || undefined,
      });
      setFormData(prev => ({
        ...prev,
        message: `Bună ziua! Sunt interesat(ă) de ${productName}. Aș dori mai multe detalii.`
      }));
      return;
    }

    // Supplier page: /suppliers/[id]
    const supplierMatch = pathname.match(/^\/suppliers\/([^/]+)$/);
    if (supplierMatch) {
      const supplierName = document.querySelector('h1')?.textContent || 'acest furnizor';
      setPageContext({
        type: 'supplier',
        supplierId: supplierMatch[1],
        supplierName,
      });
      setFormData(prev => ({
        ...prev,
        message: `Bună ziua! Aș dori să discut despre produsele dumneavoastră.`
      }));
      return;
    }

    // General page
    setPageContext({ type: 'general' });
    setFormData(prev => ({
      ...prev,
      message: ''
    }));
  }

  async function fetchConversations(userId: string) {
    try {
      const res = await fetch('/api/client/dashboard');
      if (res.ok) {
        const data = await res.json();
        if (data.contactRequests) {
          const active = data.contactRequests
            .filter((cr: any) => cr.status === 'replied' || cr.status === 'viewed')
            .slice(0, 3)
            .map((cr: any) => ({
              requestId: cr.id,
              supplierName: cr.supplier_profiles?.company_name || 'Furnizor',
              productName: cr.products?.name || undefined,
            }));
          setActiveConversations(active);
        }
      }
    } catch {}
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formData.name || !formData.contact || !formData.message) return;

    setFormState('sending');

    try {
      // Use the existing contact/supplier API
      const body: any = {
        name: formData.name,
        email: formData.contact.includes('@') ? formData.contact : undefined,
        phone: !formData.contact.includes('@') ? formData.contact : undefined,
        message: formData.message,
      };

      // If we have supplier context, send to that supplier
      if (pageContext.supplierId) {
        body.supplierId = pageContext.supplierId;
        if (pageContext.productId) {
          body.productId = pageContext.productId;
        }
        const res = await fetch('/api/contact/supplier', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          setFormState('success');
          setTimeout(() => {
            setFormState('form');
            setIsOpen(false);
          }, 3000);
          return;
        }
      }

      // General contact (no specific supplier)
      body.subject = 'Contact rapid - GymBuilder';
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setFormState('success');
        setTimeout(() => {
          setFormState('form');
          setIsOpen(false);
        }, 3000);
      } else {
        setFormState('form');
      }
    } catch {
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
        name: prev.name || user.full_name || '',
        contact: prev.contact || user.email || '',
      }));
    }
  }, [user]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Determine if we should show conversations or form
  const hasActiveChats = user && activeConversations.length > 0;
  const showConversationsList = hasActiveChats && pageContext.type === 'general';

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-[60] w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ${
          isOpen
            ? 'bg-anthracite-800 border border-anthracite-600 rotate-0'
            : 'bg-gold-400 hover:bg-gold-300 hover:scale-105 active:scale-95'
        }`}
        aria-label={isOpen ? 'Închide chat' : 'Chat rapid'}
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
          className="fixed bottom-24 right-6 z-[60] w-[340px] max-h-[480px] bg-anthracite-900 border border-anthracite-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          {/* Header */}
          <div className="bg-anthracite-800 px-4 py-3 border-b border-anthracite-700">
            <h3 className="text-sm font-semibold text-white">
              {pageContext.type === 'product' && '💬 Întreabă despre produs'}
              {pageContext.type === 'supplier' && '💬 Contactează furnizorul'}
              {pageContext.type === 'general' && '💬 Contact rapid'}
            </h3>
            <p className="text-xs text-anthracite-400 mt-0.5">
              {pageContext.type === 'product' && pageContext.productName && (
                <span className="truncate block">{pageContext.productName}</span>
              )}
              {pageContext.type === 'supplier' && pageContext.supplierName && (
                <span className="truncate block">{pageContext.supplierName}</span>
              )}
              {pageContext.type === 'general' && 'Răspundem în maxim 24h'}
            </p>
          </div>

          {/* Content */}
          <div className="p-4 overflow-y-auto max-h-[380px]">
            {/* Show active conversations if on general page and user has chats */}
            {showConversationsList && (
              <div className="mb-4">
                <p className="text-xs text-anthracite-400 uppercase tracking-wider mb-2 font-medium">
                  Conversații active
                </p>
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
                  Mesaj nou
                </p>
              </div>
            )}

            {/* Success State */}
            {formState === 'success' && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mb-3">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                </div>
                <p className="text-sm font-medium text-white">Mesaj trimis!</p>
                <p className="text-xs text-anthracite-400 mt-1">
                  Vei primi un răspuns în cel mai scurt timp.
                </p>
              </div>
            )}

            {/* Form */}
            {formState !== 'success' && (
              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <input
                    type="text"
                    placeholder="Numele tău"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-anthracite-800 border border-anthracite-700 rounded-lg text-sm text-white placeholder:text-anthracite-500 focus:outline-none focus:border-gold-400/50 transition-colors"
                    required
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Email sau telefon"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    className="w-full px-3 py-2 bg-anthracite-800 border border-anthracite-700 rounded-lg text-sm text-white placeholder:text-anthracite-500 focus:outline-none focus:border-gold-400/50 transition-colors"
                    required
                  />
                </div>
                <div>
                  <textarea
                    placeholder="Mesajul tău..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 bg-anthracite-800 border border-anthracite-700 rounded-lg text-sm text-white placeholder:text-anthracite-500 focus:outline-none focus:border-gold-400/50 transition-colors resize-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={formState === 'sending'}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gold-400 hover:bg-gold-300 text-anthracite-950 font-semibold text-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {formState === 'sending' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Se trimite...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Trimite mesajul
                    </>
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
