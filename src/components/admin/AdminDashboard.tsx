'use client';
import type { Database } from '@/types/database.generated';
import Modal from '@/components/Modal';

import { logoutClient } from '@/lib/logout-client';
import { useUiText } from '@/i18n/useUiText';

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { Shield, Users, Package, BarChart3, CheckCircle, XCircle, Loader2, Bell, Globe, Calendar, Mail, Building2, Star, MessageSquare, LogOut, BadgeCheck, Send, Newspaper, Eye, Phone, MapPin, CreditCard, Clock, Inbox, Camera } from 'lucide-react';
import { useRouter } from 'next/navigation';
import NotificationBell from '@/components/NotificationBell';

interface Supplier {
  id: string;
  user_id: string;
  company_name: string;
  country: string;
  city: string;
  website: string | null;
  phone: string | null;
  description: string | null;
  status: string;
  plan: string;
  requested_plan?: string | null;
  verified: boolean;
  created_at: string;
  full_name: string;
  email: string;
  verification_photos?: string[];
}

interface ReviewItem {
  id: string;
  client_name: string;
  client_email: string;
  rating: number;
  title: string;
  body: string | null;
  verified: boolean;
  created_at: string;
  supplier_profiles: { id: string; company_name: string };
}

type ContactMessage = Database['public']['Tables']['contact_messages']['Row'];
type NewsletterSubscriber = Database['public']['Tables']['newsletter_subscribers']['Row'];
type AdminContactRequest = Pick<Database['public']['Tables']['contact_requests']['Row'], 'id' | 'client_name' | 'client_email' | 'client_phone' | 'message' | 'product_id' | 'supplier_id' | 'status' | 'created_at' | 'viewed_at'> & { supplier_name: string };

const sidebarLinks = [
  { href: '/admin', label: 'Dashboard', icon: BarChart3, active: true },
  { href: '/suppliers', label: 'Catalog furnizori', icon: Building2, active: false },
  { href: '/products', label: 'Catalog produse', icon: Package, active: false },
];

export default function AdminDashboard() {
  const ui = useUiText();
  const router = useRouter();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [logoutLoading, setLogoutLoading] = useState(false);

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await logoutClient();
      router.push('/login');
    } catch { window.alert(ui('Deconectarea nu a reușit. Încearcă din nou.')); } finally { setLogoutLoading(false); }
  };
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [adminSection, setAdminSection] = useState<'suppliers' | 'reviews' | 'newsletter' | 'contact' | 'cereri'>('suppliers');
  // Contact messages states
  const [contactMessages, setContactMessages] = useState<ContactMessage[]>([]);
  const [contactLoading, setContactLoading] = useState(false);
  const [contactReplyId, setContactReplyId] = useState<string | null>(null);
  const [contactReplyText, setContactReplyText] = useState('');
  const [contactReplySending, setContactReplySending] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [contactUnreadCount, setContactUnreadCount] = useState(0);
  const [reviewsList, setReviewsList] = useState<ReviewItem[]>([]);
  const [allRequests, setAllRequests] = useState<AdminContactRequest[]>([]);
  const [allRequestsLoading, setAllRequestsLoading] = useState(false);
  const [requestPage, setRequestPage] = useState(1);
  const [requestHasNext, setRequestHasNext] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [allRequestsTotal, setAllRequestsTotal] = useState(0);
  const [allRequestsCount, setAllRequestsCount] = useState(0);
  const [reviewsPendingCount, setReviewsPendingCount] = useState(0);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewActionLoading, setReviewActionLoading] = useState<string | null>(null);

  // Newsletter states
  const [newsletterStats, setNewsletterStats] = useState<{ total: number; active: number; unsubscribed: number } | null>(null);
  const [newsletterSubscribers, setNewsletterSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterSubject, setNewsletterSubject] = useState('');
  const [newsletterContent, setNewsletterContent] = useState('');
  const [newsletterSending, setNewsletterSending] = useState(false);
  const [viewProfileModal, setViewProfileModal] = useState<Supplier | null>(null);

  const showToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    setToast(msg);
    setToastType(type);
    setTimeout(() => setToast(''), 5000);
  }, []);





  // Handle hash-based navigation for notifications (initial + hashchange)
  useEffect(() => {
    function handleHash() {
      const hash = window.location.hash;
      if (hash.startsWith('#contact')) {
        setAdminSection('contact');
        fetchContactMessages();
        // Extract message ID from hash like #contact-uuid
        const msgId = hash.replace('#contact-', '').replace('#contact', '');
        if (msgId && msgId.length > 10) {
          setHighlightedMessageId(msgId);
          // Scroll to the message after data loads
          setTimeout(() => {
            const el = document.getElementById(`contact-msg-${msgId}`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              el.classList.add('ring-2', 'ring-gold-400');
              setTimeout(() => el.classList.remove('ring-2', 'ring-gold-400'), 3000);
            }
          }, 800);
        }
      }
    }
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  async function fetchReviews() {
    setReviewsLoading(true);
    setLoadError('');
    try {
      const res = await fetch('/api/admin/reviews?status=unverified');
      if (!res.ok) throw new Error();
      if (res.ok) {
        const data = await res.json();
        setReviewsList(data.reviews || []);
        setReviewsPendingCount(data.pendingCount || 0);
      }
    } catch { setLoadError('Datele secțiunii nu au putut fi încărcate. Încearcă din nou.'); }
    setReviewsLoading(false);
  }

  async function handleReviewAction(reviewId: string, action: 'approve' | 'reject') {
    setReviewActionLoading(reviewId);
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewId, action }),
      });
      if (res.ok) {
        const data = await res.json();
        showToast(data.message);
        setReviewsList(prev => prev.filter(r => r.id !== reviewId));
        setReviewsPendingCount(prev => Math.max(0, prev - 1));
      } else {
        showToast('Eroare.', 'error');
      }
    } catch {
      showToast('Eroare de conexiune.', 'error');
    }
    setReviewActionLoading(null);
  }

  const fetchSuppliers = useCallback(async (status: string, signal?: AbortSignal) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/suppliers?status=${status}`, { signal });
      if (signal?.aborted) return;
      if (res.ok) {
        const data = await res.json();
        if (signal?.aborted) return;
        setSuppliers(data.suppliers || []);
        setPendingCount(data.pendingCount || 0);
      } else if (res.status === 403) {
        showToast('Acces interzis. Trebuie să fii admin.', 'error');
      } else {
        showToast('Eroare la încărcarea datelor.', 'error');
      }
    } catch {
      if (!signal?.aborted) showToast('Eroare de conexiune.', 'error');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    const controller = new AbortController();
    fetchSuppliers(activeTab, controller.signal);
    return () => controller.abort();
  }, [activeTab, fetchSuppliers]);

  async function fetchNewsletter() {
    setNewsletterLoading(true);
    setLoadError('');
    try {
      const res = await fetch('/api/admin/newsletter');
      if (!res.ok) throw new Error();
      if (res.ok) {
        const data = await res.json();
        setNewsletterStats(data.stats);
        setNewsletterSubscribers(data.subscribers || []);
      }
    } catch { setLoadError('Datele secțiunii nu au putut fi încărcate. Încearcă din nou.'); } finally { setNewsletterLoading(false); }
  }

  async function fetchContactMessages() {
    setContactLoading(true);
    setLoadError('');
    try {
      const res = await fetch('/api/admin/contact-messages', { credentials: 'include' });
      if (!res.ok) throw new Error();
      if (res.ok) {
        const data = await res.json();
        setContactMessages(data.messages || []);
        setContactUnreadCount((data.messages || []).filter((m: ContactMessage) => m.status === 'unread').length);
      }
    } catch { setLoadError('Datele secțiunii nu au putut fi încărcate. Încearcă din nou.'); } finally { setContactLoading(false); }
  }

  async function markContactRead(id: string, status: 'read' | 'unread') {
    try {
      const res = await fetch('/api/admin/contact-messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id, status }),
      });
      if (res.ok) {
        setContactMessages(prev => prev.map(m => m.id === id ? { ...m, status } : m));
        setContactUnreadCount(prev => status === 'read' ? prev - 1 : prev + 1);
        showToast(status === 'read' ? 'Marcat ca citit' : 'Marcat ca necitit');
      }
    } catch { showToast('Eroare', 'error'); }
  }

  async function sendContactReply(id: string) {
    if (!contactReplyText.trim()) return;
    setContactReplySending(true);
    try {
      const res = await fetch('/api/admin/contact-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id, reply: contactReplyText }),
      });
      if (res.ok) {
        showToast('Răspuns trimis cu succes!');
        setContactReplyId(null);
        setContactReplyText('');
        setContactMessages(prev => prev.map(m => m.id === id ? { ...m, status: 'replied', admin_reply: contactReplyText, replied_at: new Date().toISOString() } : m));
        setContactUnreadCount(prev => Math.max(0, prev - 1));
      } else {
        const data = await res.json();
        showToast(data.error || 'Eroare la trimitere', 'error');
      }
    } catch { showToast('Eroare la trimitere', 'error'); }
    setContactReplySending(false);
  }

  const fetchAllRequests = useCallback(async () => {
    setAllRequestsLoading(true);
    setLoadError('');
    try {
      const res = await fetch(`/api/admin/contact-requests?page=${requestPage}`, { credentials: 'include' });
      if (!res.ok) throw new Error();
      if (res.ok) {
        const data = await res.json();
        setAllRequests(data.requests || []);
        setRequestHasNext(data.pagination?.hasNext === true);
        setAllRequestsTotal(data.total || 0);
        setAllRequestsCount(data.pendingTotal || 0);
      }
    } catch { setLoadError('Datele secțiunii nu au putut fi încărcate. Încearcă din nou.'); } finally { setAllRequestsLoading(false); }
  }, [requestPage]);

  useEffect(() => {
    if (adminSection === 'reviews') void fetchReviews();
    if (adminSection === 'contact') void fetchContactMessages();
    if (adminSection === 'cereri') void fetchAllRequests();
  }, [adminSection, fetchAllRequests]);

  async function sendNewsletter() {
    if (!newsletterSubject.trim() || !newsletterContent.trim()) {
      showToast('Subiectul și conținutul sunt obligatorii.', 'error');
      return;
    }
    setNewsletterSending(true);
    try {
      const res = await fetch('/api/admin/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject: newsletterSubject.trim(), content: newsletterContent.trim() }),
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Newsletter trimis!', 'success');
        setNewsletterSubject('');
        setNewsletterContent('');
      } else {
        showToast(data.error || 'Eroare la trimitere.', 'error');
      }
    } catch {
      showToast('Eroare de conexiune.', 'error');
    } finally {
      setNewsletterSending(false);
    }
  }

  async function handleAction(supplierId: string, action: 'approve' | 'reject', reason?: string) {
    setActionLoading(supplierId);
    try {
      const res = await fetch('/api/admin/suppliers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ supplierId, action, reason }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast(data.message);
        setSuppliers(prev => prev.filter(s => s.id !== supplierId));
        setPendingCount(data.pendingCount ?? Math.max(0, pendingCount - 1));
        setRejectModal(null);
        setRejectReason('');
      } else {
        showToast(data.error || 'Eroare.', 'error');
      }
    } catch {
      showToast('Eroare de conexiune.', 'error');
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <main className="min-h-screen bg-anthracite-950">
      {loadError && <div role="alert" className="m-4 rounded-xl border border-red-400/30 p-4"><p>{ui(loadError)}</p><button className="btn-secondary mt-3" onClick={() => { if (adminSection === 'cereri') void fetchAllRequests(); else if (adminSection === 'contact') void fetchContactMessages(); else if (adminSection === 'reviews') void fetchReviews(); else void fetchNewsletter(); }}>{ui('Reîncearcă')}</button></div>}
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-lg shadow-lg text-sm animate-fade-in border max-w-md ${
          toastType === 'success'
            ? 'bg-anthracite-800 border-gold-400/30 text-gold-400'
            : 'bg-anthracite-800 border-red-400/30 text-red-400'
        }`}>
          {ui(toast)}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <Modal label={ui("Respinge Furnizor")} onClose={() => { setRejectModal(null); }}>
          <div className="bg-anthracite-800 border border-anthracite-700 rounded-2xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-white mb-2">{ui("Respinge Furnizor")}</h3>
            <p className="text-sm text-anthracite-300 mb-4">
              {ui("Opțional, adaugă un motiv care va fi trimis furnizorului prin email.")}</p>
            <textarea
              className="w-full bg-anthracite-900 border border-anthracite-600 rounded-lg p-3 text-sm text-white placeholder-anthracite-500 resize-none h-24 focus:outline-none focus:border-gold-400/50"
              placeholder={ui("Motiv respingere (opțional)...")}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setRejectModal(null); setRejectReason(''); }}
                className="flex-1 py-2.5 px-4 rounded-lg border border-anthracite-600 text-anthracite-300 hover:text-white text-sm font-medium transition-colors"
              >
                {ui("Anulează")}</button>
              <button
                onClick={() => handleAction(rejectModal, 'reject', rejectReason || undefined)}
                disabled={actionLoading === rejectModal}
                className="flex-1 py-2.5 px-4 rounded-lg bg-red-500 text-white hover:bg-red-600 text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {actionLoading === rejectModal ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                {ui("Respinge")}</button>
            </div>
          </div>
        </Modal>
      )}

      {/* View Profile Modal */}
      {viewProfileModal && (
        <Modal label={ui("Profil Furnizor")} onClose={() => { setViewProfileModal(null); }}>
          <div className="bg-anthracite-800 border border-anthracite-700 rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">{ui("Profil Furnizor")}</h3>
              <button aria-label={ui("Închide")}
                onClick={() => setViewProfileModal(null)}
                className="text-anthracite-400 hover:text-white transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Company Name */}
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-gold-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-anthracite-400 uppercase tracking-wide">{ui("Nume Companie")}</p>
                  <p className="text-white font-semibold">{viewProfileModal.company_name}</p>
                </div>
              </div>

              {/* Contact Person */}
              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 text-gold-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-anthracite-400 uppercase tracking-wide">{ui("Persoană de Contact")}</p>
                  <p className="text-white">{viewProfileModal.full_name || 'N/A'}</p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-gold-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-anthracite-400 uppercase tracking-wide">Email</p>
                  <p className="text-white">{viewProfileModal.email || 'N/A'}</p>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gold-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-anthracite-400 uppercase tracking-wide">{ui("Telefon")}</p>
                  <p className="text-white">{viewProfileModal.phone || 'N/A'}</p>
                </div>
              </div>

              {/* Website */}
              <div className="flex items-start gap-3">
                <Globe className="w-5 h-5 text-gold-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-anthracite-400 uppercase tracking-wide">Website</p>
                  {viewProfileModal.website ? (
                    <a href={viewProfileModal.website} target="_blank" rel="noopener noreferrer" className="text-gold-400 hover:underline">
                      {viewProfileModal.website}
                    </a>
                  ) : (
                    <p className="text-anthracite-400">N/A</p>
                  )}
                </div>
              </div>

              {/* Location */}
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gold-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-anthracite-400 uppercase tracking-wide">{ui("Locație")}</p>
                  <p className="text-white">
                    {viewProfileModal.city}{ui(viewProfileModal.city && viewProfileModal.country ? ', ' : '')}{viewProfileModal.country || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Plan */}
              <div className="flex items-start gap-3">
                <CreditCard className="w-5 h-5 text-gold-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-anthracite-400 uppercase tracking-wide">Plan</p>
                  <p className="text-white capitalize">{viewProfileModal.plan || 'N/A'}</p>{viewProfileModal.requested_plan && viewProfileModal.requested_plan !== viewProfileModal.plan && <p className="text-xs text-anthracite-400 mt-1">{ui('Pachet solicitat')}: {viewProfileModal.requested_plan}</p>}
                </div>
              </div>

              {/* Registration Date */}
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-gold-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-anthracite-400 uppercase tracking-wide">{ui("Data Înregistrării")}</p>
                  <p className="text-white">{ui(new Date(viewProfileModal.created_at).toLocaleDateString(ui('ro-RO'), { year: 'numeric', month: 'long', day: 'numeric' }))}</p>
                </div>
              </div>

              {/* Status */}
              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-gold-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs text-anthracite-400 uppercase tracking-wide">Status</p>
                  <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium ${
                    viewProfileModal.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                    viewProfileModal.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                    'bg-red-500/10 text-red-400 border border-red-500/30'
                  }`}>
                    {ui(viewProfileModal.status === 'pending' ? 'În așteptare' : viewProfileModal.status === 'approved' ? 'Aprobat' : 'Respins')}
                  </span>
                  {viewProfileModal.verified && (
                    <span className="ml-2 inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-blue-500/10 text-blue-400 border border-blue-500/30">
                      <BadgeCheck className="w-3.5 h-3.5" /> {ui("Verificat")}</span>
                  )}
                </div>
              </div>

              {/* Description */}
             {viewProfileModal.description && (
               <div className="flex items-start gap-3">
                 <MessageSquare className="w-5 h-5 text-gold-400 mt-0.5 flex-shrink-0" />
                 <div>
                   <p className="text-xs text-anthracite-400 uppercase tracking-wide">{ui("Descriere")}</p>
                   <p className="text-sm text-anthracite-200 mt-1">{viewProfileModal.description}</p>
                 </div>
               </div>
              )}
            </div>

            {/* Verification Photos */}
            {viewProfileModal.verification_photos && viewProfileModal.verification_photos.length > 0 && (
              <div className="mt-4 pt-4 border-t border-anthracite-700">
                <div className="flex items-center gap-2 mb-3">
                  <Camera className="w-5 h-5 text-gold-400" />
                  <p className="text-xs text-anthracite-400 uppercase tracking-wide">{ui("Poze de verificare (")}{viewProfileModal.verification_photos.length})</p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {viewProfileModal.verification_photos.map((url, idx) => (
                    <a key={idx} href={url} target="_blank" rel="noopener noreferrer" className="block aspect-square rounded-lg overflow-hidden border border-anthracite-700 hover:border-gold-400 transition-colors">
                      <img src={url} alt={ui(`Verificare ${idx + 1}`)} className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* No verification photos warning */}
            {(!viewProfileModal.verification_photos || viewProfileModal.verification_photos.length === 0) && viewProfileModal.status === 'pending' && (
              <div className="mt-4 pt-4 border-t border-anthracite-700">
                <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                  <Camera className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <p className="text-xs text-amber-400">{ui("Acest furnizor nu a încărcat poze de verificare (cont creat înainte de implementarea acestei funcții).")}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6 pt-4 border-t border-anthracite-700">
              <button
                onClick={() => setViewProfileModal(null)}
                className="flex-1 py-2.5 px-4 rounded-lg border border-anthracite-600 text-anthracite-300 hover:text-white text-sm font-medium transition-colors"
              >
                {ui("Închide")}</button>
              {viewProfileModal.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      handleAction(viewProfileModal.id, 'approve');
                      setViewProfileModal(null);
                    }}
                    disabled={actionLoading === viewProfileModal.id}
                    className="flex-1 py-2.5 px-4 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    {ui("Aprobă")}</button>
                  <button
                    onClick={() => {
                      setViewProfileModal(null);
                      setRejectModal(viewProfileModal.id);
                    }}
                    disabled={actionLoading === viewProfileModal.id}
                    className="flex-1 py-2.5 px-4 rounded-lg bg-red-500 text-white hover:bg-red-600 text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    {ui("Respinge")}</button>
                </>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Sidebar */}
      <aside className="fixed left-0 top-[var(--app-header-height)] bottom-0 w-64 bg-anthracite-900 border-r border-anthracite-800 p-6 hidden lg:block overflow-y-auto">

        <nav className="space-y-1">
          {sidebarLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm ${
                  link.active
                    ? 'bg-gold-400/10 text-gold-400 font-medium'
                    : 'text-anthracite-300 hover:text-white hover:bg-anthracite-800'
                }`}
              >
                <link.icon className="w-4 h-4" /> {link.label}
                {link.label === 'Dashboard' && pendingCount > 0 && (
                  <span className="ml-auto bg-amber-500 text-anthracite-950 text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                    {pendingCount}
                  </span>
                )}
              </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64 p-6 md:p-8">
        <div className="max-w-5xl mx-auto">
          {/* Header with pending badge */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-anthracite-400 text-sm mt-1">{ui("Gestionează furnizorii și platforma")}</p>
            </div>
            <div className="flex items-center gap-3">
              <NotificationBell />
              {pendingCount > 0 && (
                <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-4 py-2">
                  <Bell className="w-4 h-4 text-amber-400" />
                  <span className="text-sm font-medium text-amber-400">{pendingCount} pending</span>
                </div>
              )}
              <button
                onClick={handleLogout}
                disabled={logoutLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-anthracite-700 text-anthracite-300 hover:text-red-400 hover:border-red-400/30 text-sm font-medium transition-colors disabled:opacity-50"
              >
                <LogOut className="w-4 h-4" />
                {ui(logoutLoading ? 'Se deconectează...' : 'Logout')}
              </button>
            </div>
          </div>

          {/* Section Switch */}
          <div className="flex gap-1 bg-anthracite-900 rounded-lg p-1 mb-6 w-full sm:w-fit overflow-x-auto">
            <button
              onClick={() => setAdminSection('suppliers')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                adminSection === 'suppliers'
                  ? 'bg-anthracite-700 text-gold-400'
                  : 'text-anthracite-400 hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4" /> {ui("Furnizori")}{pendingCount > 0 && (
                <span className="bg-amber-500 text-anthracite-950 text-xs font-bold px-1.5 py-0.5 rounded-full">{pendingCount}</span>
              )}
            </button>
            <button
              onClick={() => setAdminSection('reviews')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                adminSection === 'reviews'
                  ? 'bg-anthracite-700 text-gold-400'
                  : 'text-anthracite-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-4 h-4" /> {ui("Recenzii")}{reviewsPendingCount > 0 && (
                <span className="bg-amber-500 text-anthracite-950 text-xs font-bold px-1.5 py-0.5 rounded-full">{reviewsPendingCount}</span>
              )}
            </button>
            <button
              onClick={() => { setAdminSection('newsletter'); fetchNewsletter(); }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                adminSection === 'newsletter'
                  ? 'bg-anthracite-700 text-gold-400'
                  : 'text-anthracite-400 hover:text-white'
              }`}
            >
              <Newspaper className="w-4 h-4" /> Newsletter
            </button>
            <button
              onClick={() => { setAdminSection('contact'); fetchContactMessages(); }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                adminSection === 'contact'
                  ? 'bg-anthracite-700 text-gold-400'
                  : 'text-anthracite-400 hover:text-white'
              }`}
            >
              <Mail className="w-4 h-4" /> {ui("Mesaje Contact")}{contactUnreadCount > 0 && (
                <span className="bg-amber-500 text-anthracite-950 text-xs font-bold px-1.5 py-0.5 rounded-full">{contactUnreadCount}</span>
              )}
            </button>
            <button
              onClick={() => { setAdminSection('cereri'); fetchAllRequests(); }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                adminSection === 'cereri'
                  ? 'bg-anthracite-700 text-gold-400'
                  : 'text-anthracite-400 hover:text-white'
              }`}
            >
              <Inbox className="w-4 h-4" /> {ui("Cereri Furnizori")}{allRequestsCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">{allRequestsCount}</span>
              )}
            </button>
          </div>

          {adminSection === 'cereri' ? (
            /* Cereri Furnizori Section - ALL contact_requests from all suppliers */
            <div>
              {allRequestsLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-gold-400 animate-spin mb-4" />
                  <p className="text-anthracite-400 text-sm">{ui("Se încarcă cererile...")}</p>
                </div>
              ) : allRequests.length === 0 && !loadError ? (
                <div className="text-center py-20">
                  <Inbox className="w-16 h-16 text-anthracite-600 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-white mb-2">{ui("Nicio cerere")}</h2>
                  <p className="text-anthracite-400 text-sm">{ui("Nu există cereri de ofertă încă.")}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <nav className="flex flex-wrap items-center gap-3 mb-4" aria-label={ui('Pagini cereri')}><button className="btn-secondary" disabled={requestPage === 1} onClick={() => setRequestPage(p => p - 1)}>{ui('Pagina anterioară')}</button><span>{ui('Pagina')} {requestPage}</span><button className="btn-secondary" disabled={!requestHasNext} onClick={() => setRequestPage(p => p + 1)}>{ui('Pagina următoare')}</button></nav>
                  <p className="text-anthracite-400 text-sm mb-4">{allRequestsTotal} {ui("cereri totale • ")}{allRequestsCount} {ui("noi")}</p>
                  {allRequests.map((req) => (
                    <div key={req.id} className={`bg-anthracite-800 border rounded-xl p-4 sm:p-6 ${req.status === 'sent' ? 'border-red-500/30' : req.status === 'replied' || req.status === 'completed' ? 'border-emerald-500/30' : 'border-anthracite-700'}`}>
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <span className="font-semibold text-white">{req.client_name}</span>
                            <a href={`mailto:${req.client_email}`} className="text-sm text-gold-400 hover:underline">{req.client_email}</a>
                            {req.client_phone && <span className="text-xs text-anthracite-400"><Phone className="w-3 h-3 inline mr-1" />{req.client_phone}</span>}
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${req.status === 'sent' ? 'bg-red-500/10 text-red-400 border border-red-500/30' : req.status === 'replied' || req.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'}`}>
                              {ui(req.status === 'sent' ? 'Nou' : req.status === 'viewed' ? 'Văzut' : req.status === 'replied' ? 'Răspuns' : req.status)}
                            </span>
                          </div>
                          <p className="text-xs text-anthracite-400 mb-1">
                            <strong className="text-anthracite-300">{ui("Furnizor:")}</strong> {req.supplier_name}
                          </p>
                          <p className="text-xs text-anthracite-500">
                            <Clock className="w-3.5 h-3.5 inline mr-1" />
                            {req.created_at ? new Date(req.created_at).toLocaleString(ui('ro-RO'), { timeZone: 'Europe/Bucharest' }) : '—'}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 p-3 bg-anthracite-900/50 rounded-lg border border-anthracite-700/50">
                        <p className="text-sm text-anthracite-200 whitespace-pre-wrap">{req.message}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : adminSection === 'contact' ? (
            /* Contact Messages Section */
            <div>
              {contactLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-gold-400 animate-spin mb-4" />
                  <p className="text-anthracite-400 text-sm">{ui("Se încarcă mesajele...")}</p>
                </div>
              ) : contactMessages.length === 0 ? (
                <div className="text-center py-20">
                  <Mail className="w-16 h-16 text-anthracite-600 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-white mb-2">{ui("Niciun mesaj de contact")}</h2>
                  <p className="text-anthracite-400 text-sm">{ui("Nu ai primit încă mesaje prin formularul de contact.")}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-anthracite-400 text-sm mb-4">{contactMessages.length} {ui("mesaje totale • ")}{contactUnreadCount} {ui("necitite")}</p>
                  {contactMessages.map((msg) => (
                    <div
                      key={msg.id}
                      id={`contact-msg-${msg.id}`}
                      className={`bg-anthracite-800 border rounded-xl p-4 sm:p-6 transition-all duration-300 ${
                        msg.status === 'unread'
                          ? 'border-gold-400/50 bg-anthracite-800/80'
                          : msg.status === 'replied'
                          ? 'border-emerald-500/30'
                          : 'border-anthracite-700'
                      } ${highlightedMessageId === msg.id ? 'ring-2 ring-gold-400 ring-offset-2 ring-offset-anthracite-950' : ''}`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <span className="font-semibold text-white">{msg.name}</span>
                            <a href={`mailto:${msg.email}`} className="text-sm text-gold-400 hover:underline">{msg.email}</a>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              msg.status === 'unread'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                : msg.status === 'replied'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-anthracite-600/30 text-anthracite-400 border border-anthracite-600'
                            }`}>
                              {ui(msg.status === 'unread' ? 'Necitit' : msg.status === 'replied' ? 'Răspuns' : 'Citit')}
                            </span>
                          </div>
                          <p className="text-sm text-anthracite-400 mb-2">
                            <strong className="text-anthracite-300">{ui("Subiect:")}</strong> {msg.subject}
                          </p>
                          <p className="text-sm text-anthracite-300 mb-1">
                            <Clock className="w-3.5 h-3.5 inline mr-1" />
                            {msg.created_at ? new Date(msg.created_at).toLocaleString(ui('ro-RO'), { timeZone: 'Europe/Bucharest' }) : '—'}
                          </p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          {msg.status === 'unread' ? (
                            <button
                              onClick={() => markContactRead(msg.id, 'read')}
                              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-anthracite-700 text-anthracite-300 hover:text-white border border-anthracite-600 hover:border-anthracite-500 transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5 inline mr-1" /> {ui("Marchează citit")}</button>
                          ) : msg.status === 'read' ? (
                            <button
                              onClick={() => markContactRead(msg.id, 'unread')}
                              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-anthracite-700 text-anthracite-300 hover:text-white border border-anthracite-600 hover:border-anthracite-500 transition-colors"
                            >
                              {ui("Marchează necitit")}</button>
                          ) : null}
                        </div>
                      </div>
                      {/* Full message */}
                      <div className="mt-4 p-4 bg-anthracite-900/50 rounded-lg border border-anthracite-700/50">
                        <p className="text-sm text-anthracite-200 whitespace-pre-wrap">{msg.message}</p>
                      </div>
                      {/* Admin reply if exists */}
                      {msg.admin_reply && (
                        <div className="mt-3 p-4 bg-emerald-500/5 rounded-lg border border-emerald-500/20">
                          <p className="text-xs text-emerald-400 font-medium mb-1">{ui("Răspunsul tău (")}{ui(msg.replied_at ? new Date(msg.replied_at).toLocaleString(ui('ro-RO'), { timeZone: 'Europe/Bucharest' }) : '')}):</p>
                          <p className="text-sm text-anthracite-200 whitespace-pre-wrap">{msg.admin_reply}</p>
                        </div>
                      )}
                      {/* Reply form */}
                      {msg.status !== 'replied' && (
                        <div className="mt-4">
                          {contactReplyId === msg.id ? (
                            <div className="space-y-3">
                              <textarea
                                value={contactReplyText}
                                onChange={(e) => setContactReplyText(e.target.value)}
                                placeholder={ui("Scrie răspunsul tău aici...")}
                                className="w-full px-4 py-3 bg-anthracite-900 border border-anthracite-600 rounded-lg text-white text-sm placeholder-anthracite-500 focus:outline-none focus:border-gold-400 resize-none"
                                rows={4}
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => sendContactReply(msg.id)}
                                  disabled={contactReplySending || !contactReplyText.trim()}
                                  className="px-4 py-2 text-sm font-medium rounded-lg bg-gold-500 text-anthracite-950 hover:bg-gold-400 disabled:opacity-50 transition-colors flex items-center gap-2"
                                >
                                  <Send className="w-3.5 h-3.5" />
                                  {ui(contactReplySending ? 'Se trimite...' : 'Trimite răspuns')}
                                </button>
                                <button
                                  onClick={() => { setContactReplyId(null); setContactReplyText(''); }}
                                  className="px-4 py-2 text-sm font-medium rounded-lg border border-anthracite-600 text-anthracite-400 hover:text-white transition-colors"
                                >
                                  {ui("Anulează")}</button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setContactReplyId(msg.id); setContactReplyText(''); }}
                              className="px-4 py-2 text-sm font-medium rounded-lg border border-gold-400/30 text-gold-400 hover:bg-gold-400/10 transition-colors flex items-center gap-2"
                            >
                              <Send className="w-3.5 h-3.5" /> {ui("Răspunde")}</button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : adminSection === 'newsletter' ? (
            /* Newsletter Section */
            <NewsletterSection
              stats={newsletterStats}
              subscribers={newsletterSubscribers}
              loading={newsletterLoading}
              subject={newsletterSubject}
              setSubject={setNewsletterSubject}
              content={newsletterContent}
              setContent={setNewsletterContent}
              sending={newsletterSending}
              onSend={sendNewsletter}
            />
          ) : adminSection === 'reviews' ? (
            /* Reviews Moderation */
            <div>
              {reviewsLoading ? (
                <div className="flex flex-col items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-gold-400 animate-spin mb-4" />
                  <p className="text-anthracite-400 text-sm">{ui("Se încarcă recenziile...")}</p>
                </div>
              ) : reviewsList.length === 0 ? (
                <div className="text-center py-20">
                  <MessageSquare className="w-16 h-16 text-anthracite-600 mx-auto mb-4" />
                  <h2 className="text-xl font-semibold text-white mb-2">{ui("Nicio recenzie de moderat")}</h2>
                  <p className="text-anthracite-400 text-sm">{ui("Toate recenziile au fost procesate.")}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviewsList.map((review) => (
                    <div key={review.id} className="bg-anthracite-800 border border-anthracite-700 rounded-xl p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <div className="flex">
                              {[1,2,3,4,5].map(s => (
                                <Star key={s} className={`w-4 h-4 ${s <= review.rating ? 'text-gold-400 fill-gold-400' : 'text-anthracite-600'}`} />
                              ))}
                            </div>
                            <h3 className="text-base font-semibold text-white">{review.title}</h3>
                          </div>
                          {review.body && <p className="text-sm text-anthracite-300 mb-3">{review.body}</p>}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-anthracite-400">
                            <span>{ui("De: ")}<span className="text-white">{review.client_name}</span> ({review.client_email})</span>
                            <span>{ui("Furnizor: ")}<span className="text-gold-400">{review.supplier_profiles?.company_name}</span></span>
                            <span>{ui(new Date(review.created_at).toLocaleDateString(ui('ro-RO')))}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button
                            onClick={() => handleReviewAction(review.id, 'approve')}
                            disabled={reviewActionLoading === review.id}
                            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                          >
                            {reviewActionLoading === review.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                            {ui("Aprobă")}</button>
                          <button
                            onClick={() => handleReviewAction(review.id, 'reject')}
                            disabled={reviewActionLoading === review.id}
                            className="flex items-center gap-1.5 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50"
                          >
                            <XCircle className="w-4 h-4" />
                            {ui("Șterge")}</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
          /* Suppliers Section */
          <>
          {/* Tabs */}
          <div className="flex gap-1 bg-anthracite-900 rounded-lg p-1 mb-6 w-full sm:w-fit overflow-x-auto">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                activeTab === 'pending'
                  ? 'bg-anthracite-700 text-gold-400'
                  : 'text-anthracite-400 hover:text-white'
              }`}
            >
              Pending
              {pendingCount > 0 && (
                <span className="bg-amber-500 text-anthracite-950 text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                  {pendingCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('approved')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'approved'
                  ? 'bg-anthracite-700 text-emerald-400'
                  : 'text-anthracite-400 hover:text-white'
              }`}
            >
              {ui("Aprobați")}</button>
            <button
              onClick={() => setActiveTab('rejected')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'rejected'
                  ? 'bg-anthracite-700 text-red-400'
                  : 'text-anthracite-400 hover:text-white'
              }`}
            >
              {ui("Respinși")}</button>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-gold-400 animate-spin mb-4" />
              <p className="text-anthracite-400 text-sm">{ui("Se încarcă furnizorii...")}</p>
            </div>
          ) : suppliers.length === 0 ? (
            <div className="text-center py-20">
              <Users className="w-16 h-16 text-anthracite-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-white mb-2">
                {ui(activeTab === 'pending' ? 'Niciun furnizor pending' :
                 activeTab === 'approved' ? 'Niciun furnizor aprobat' : 'Niciun furnizor respins')}
              </h2>
              <p className="text-anthracite-400 text-sm">
                {ui(activeTab === 'pending' ? 'Toate cererile au fost procesate.' : 'Nu există furnizori cu acest status.')}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {suppliers.map((supplier) => (
                <div key={supplier.id} className="bg-anthracite-800 border border-anthracite-700 rounded-xl p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    {/* Supplier Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <Building2 className="w-5 h-5 text-gold-400 flex-shrink-0" />
                        <h3 className="text-lg font-semibold text-white">{supplier.company_name}</h3>
                        {supplier.verified && (
                          <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-blue-500/10 text-blue-400 border border-blue-500/30">
                            <BadgeCheck className="w-3.5 h-3.5" /> {ui("Verificat")}</span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          supplier.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                          supplier.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' :
                          'bg-red-500/10 text-red-400 border border-red-500/30'
                        }`}>
                          {ui(supplier.status)}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                        <div className="flex items-center gap-2 text-sm text-anthracite-300">
                          <Mail className="w-3.5 h-3.5 text-anthracite-500" />
                          <span>{supplier.email || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-anthracite-300">
                          <Users className="w-3.5 h-3.5 text-anthracite-500" />
                          <span>{supplier.full_name || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-anthracite-300">
                          <Globe className="w-3.5 h-3.5 text-anthracite-500" />
                          <span>{supplier.city}{ui(supplier.city && supplier.country ? ', ' : '')}{supplier.country}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-anthracite-300">
                          <Calendar className="w-3.5 h-3.5 text-anthracite-500" />
                          <span>{ui(new Date(supplier.created_at).toLocaleDateString(ui('ro-RO')))}</span>
                        </div>
                      </div>

                      {supplier.description && (
                        <p className="text-sm text-anthracite-400 mt-3 line-clamp-2">{supplier.description}</p>
                      )}

                      {supplier.website && (
                        <a href={supplier.website} target="_blank" rel="noopener noreferrer" className="text-xs text-gold-400 hover:underline mt-2 inline-block">
                          {supplier.website}
                        </a>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 flex-shrink-0 flex-wrap border-t border-anthracite-700 sm:border-0 pt-3 sm:pt-0">
                      <button
                        onClick={() => setViewProfileModal(supplier)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 rounded-lg text-sm font-medium hover:bg-indigo-500/20 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        {ui("Vizualizează profil")}</button>
                    {activeTab === 'approved' && (
                      <>
                        <button
                          onClick={async () => {
                            setActionLoading(supplier.id);
                            try {
                              const res = await fetch('/api/admin/suppliers', {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ supplierId: supplier.id, action: supplier.verified ? 'unverify' : 'verify' }),
                              });
                              const data = await res.json();
                              if (res.ok) {
                                showToast(data.message);
                                setSuppliers(prev => prev.map(s => s.id === supplier.id ? { ...s, verified: !s.verified } : s));
                              } else {
                                showToast(data.error || 'Eroare.', 'error');
                              }
                            } catch { showToast('Eroare de conexiune.', 'error'); }
                            finally { setActionLoading(null); }
                          }}
                          disabled={actionLoading === supplier.id}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                            supplier.verified
                              ? 'bg-anthracite-700 border border-anthracite-600 text-anthracite-300 hover:text-white'
                              : 'bg-blue-500/10 border border-blue-500/30 text-blue-400 hover:bg-blue-500/20'
                          }`}
                        >
                          {actionLoading === supplier.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <BadgeCheck className="w-4 h-4" />
                          )}
                          {ui(supplier.verified ? 'Revocă Verificare' : 'Marchează ca Verificat')}
                        </button>
                      </>
                    )}
                    {activeTab === 'pending' && (
                      <>
                        <button
                          onClick={() => handleAction(supplier.id, 'approve')}
                          disabled={actionLoading === supplier.id}
                          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-500/20 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === supplier.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          {ui("Aprobă")}</button>
                        <button
                          onClick={() => setRejectModal(supplier.id)}
                          disabled={actionLoading === supplier.id}
                          className="flex items-center gap-1.5 px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4" />
                          {ui("Respinge")}</button>
                      </>
                    )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          </>
          )}
        </div>
      </div>
    </main>
  );
}

function NewsletterSection({
  stats,
  subscribers,
  loading,
  subject,
  setSubject,
  content,
  setContent,
  sending,
  onSend,
}: {
  stats: { total: number; active: number; unsubscribed: number } | null;
  subscribers: NewsletterSubscriber[];
  loading: boolean;
  subject: string;
  setSubject: (v: string) => void;
  content: string;
  setContent: (v: string) => void;
  sending: boolean;
  onSend: () => void;
}) {
  const ui = useUiText();
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-gold-400 animate-spin mb-4" />
        <p className="text-anthracite-400 text-sm">{ui("Se încarcă datele newsletter...")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-anthracite-800 border border-anthracite-700 rounded-xl p-5">
            <p className="text-anthracite-400 text-xs uppercase tracking-wider mb-1">{ui("Total Abonați")}</p>
            <p className="text-2xl font-bold text-white">{stats.total}</p>
          </div>
          <div className="bg-anthracite-800 border border-anthracite-700 rounded-xl p-5">
            <p className="text-anthracite-400 text-xs uppercase tracking-wider mb-1">{ui("Activi")}</p>
            <p className="text-2xl font-bold text-emerald-400">{stats.active}</p>
          </div>
          <div className="bg-anthracite-800 border border-anthracite-700 rounded-xl p-5">
            <p className="text-anthracite-400 text-xs uppercase tracking-wider mb-1">{ui("Dezabonați")}</p>
            <p className="text-2xl font-bold text-red-400">{stats.unsubscribed}</p>
          </div>
        </div>
      )}

      {/* Send Newsletter */}
      <div className="bg-anthracite-800 border border-anthracite-700 rounded-xl p-6">
        <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
          <Send className="w-5 h-5 text-gold-400" />
          {ui("Trimite Newsletter")}</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="field-dashboardadmin-59001" className="text-anthracite-400 text-sm mb-1 block">{ui("Subiect")}</label>
            <input id="field-dashboardadmin-59001"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex: Echipamente noi disponibile pe Gym Builder"
              className="w-full bg-anthracite-900 border border-anthracite-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder:text-anthracite-500 focus:outline-none focus:border-gold-400 transition-colors"
            />
          </div>
          <div>
            <label htmlFor="field-dashboardadmin-59556" className="text-anthracite-400 text-sm mb-1 block">{ui("Conținut")}</label>
            <textarea id="field-dashboardadmin-59556"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={ui("Scrie conținutul email-ului aici...")}
              rows={8}
              className="w-full bg-anthracite-900 border border-anthracite-700 rounded-lg px-4 py-3 text-sm text-white placeholder:text-anthracite-500 focus:outline-none focus:border-gold-400 transition-colors resize-y"
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-anthracite-500 text-xs">
              {ui("Va fi trimis către ")}{stats?.active || 0} {ui("abonați activi.")}</p>
            <button
              onClick={onSend}
              disabled={sending || !subject.trim() || !content.trim()}
              className="bg-gold-400 text-anthracite-950 px-6 py-2.5 rounded-lg font-semibold text-sm hover:bg-gold-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {ui(sending ? 'Se trimite...' : 'Trimite Newsletter')}
            </button>
          </div>
        </div>
      </div>

      {/* Subscribers List */}
      <div className="bg-anthracite-800 border border-anthracite-700 rounded-xl p-6">
        <h3 className="text-white font-semibold text-lg mb-4 flex items-center gap-2">
          <Users className="w-5 h-5 text-gold-400" />
          {ui("Lista Abonaților (")}{subscribers.length})
        </h3>
        {subscribers.length === 0 ? (
          <p className="text-anthracite-500 text-sm text-center py-8">{ui("Nu există abonați încă.")}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-anthracite-700">
                  <th className="text-left text-anthracite-400 font-medium py-2 px-3">Email</th>
                  <th className="text-left text-anthracite-400 font-medium py-2 px-3">Status</th>
                  <th className="text-left text-anthracite-400 font-medium py-2 px-3">{ui("Data abonării")}</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((sub) => (
                  <tr key={sub.id} className="border-b border-anthracite-700/50">
                    <td className="py-2.5 px-3 text-white">{sub.email}</td>
                    <td className="py-2.5 px-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        sub.status === 'active'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-red-500/10 text-red-400 border border-red-500/30'
                      }`}>
                        {ui(sub.status === 'active' ? 'Activ' : 'Dezabonat')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-anthracite-400">
                      {ui(new Date(sub.subscribed_at).toLocaleDateString(ui('ro-RO')))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
