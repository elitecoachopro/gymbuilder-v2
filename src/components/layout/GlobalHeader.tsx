'use client';


import { useUiText } from '@/i18n/useUiText';
import Link from 'next/link';
import { logoutClient } from '@/lib/logout-client';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { Menu, X, LayoutDashboard, LogOut, ChevronDown, User, Dumbbell, Box, Zap } from 'lucide-react';
import { useClientTranslations } from '@/i18n/client';
import CartIcon from '@/components/CartIcon';
import LanguageSwitcher from '@/components/LanguageSwitcher';


export default function GlobalHeader() {
  const { t, locale } = useClientTranslations('nav');
  const ui = useUiText();
  const [isOpen, setIsOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);

  const navLinks = [
    { href: '/products', label: ui('Echipamente') },
    { href: '/suppliers', label: locale === 'en' ? 'Suppliers' : 'Furnizori' },
    { href: '/configurator/studio', label: locale === 'en' ? 'Design your gym' : 'Proiectează sala' },
    { href: '/construieste-sala', label: locale === 'en' ? 'Gym services' : 'Servicii pentru sală' },
    { href: '/#super-pret', label: locale === 'en' ? 'Super Price' : 'Super Preț' },
  ];
  const offerLinks = [
    { href: '/products?condition=used', label: t('usedEquipment') },
    { href: '/pricing', label: locale === 'en' ? 'Pricing and promotions' : 'Prețuri și promovare' },
  ];
  const supportLinks = [
    { href: '/consultation', label: t('consultation') },
    { href: '/cum-functioneaza', label: locale === 'en' ? 'How it works' : 'Cum funcționează' },
    { href: '/contact', label: t('contact') },
    { href: '/blog', label: t('blog') },
  ];
  const user = useAuthStore(s => s.user);
  const setUser = useAuthStore(s => s.setUser);
  const pathname = usePathname();
  const [userDropdown, setUserDropdown] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/me', { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          if (!controller.signal.aborted) setUser(data.user ? { ...data.user, name: data.user.full_name } : null);
        }
      } catch {}
    }
    checkSession();
    localStorage.removeItem('session_token');
    return () => controller.abort();
  }, [pathname, setUser]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setUserDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setIsOpen(false);
    setUserDropdown(false);
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const desktop = window.matchMedia('(min-width: 1280px)');
    const closeOnDesktop = () => { if (desktop.matches) setIsOpen(false); };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { setIsOpen(false); mobileMenuButtonRef.current?.focus(); }
    };
    const closeOutside = (event: Event) => {
      if (!mobileMenuRef.current?.contains(event.target as Node) && !mobileMenuButtonRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('focusin', closeOutside);
    desktop.addEventListener('change', closeOnDesktop);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('focusin', closeOutside);
      desktop.removeEventListener('change', closeOnDesktop);
    };
  }, [isOpen]);

  function getDashboardLink() {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'supplier') return '/supplier/dashboard';
    return '/client/dashboard';
  }

  async function handleLogout() {
    try {
      await logoutClient();
      window.location.href = '/';
    } catch { window.alert(ui('Deconectarea nu a reușit. Încearcă din nou.')); }
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-anthracite-950/90 backdrop-blur-xl border-b border-anthracite-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center flex-shrink-0 relative z-10">
            <Image
              src="/logo-bold-v2.png"
              alt="Gym Builder"
              width={1120}
              height={488}
              className="h-14 w-auto sm:h-16 object-contain rounded"
              priority
            />
          </Link>

          {/* Desktop Navigation - Center */}
          <nav aria-label={ui("Navigare principală")} className="hidden xl:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={pathname === link.href ? 'page' : undefined}
                className="min-h-11 inline-flex items-center px-2 py-2 text-xs whitespace-nowrap text-anthracite-300 hover:text-white hover:bg-anthracite-800/50 rounded-lg transition-colors font-medium"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions - Right */}
          <div className="hidden xl:flex items-center gap-2">
            <LanguageSwitcher />
            {user ? (
              <div className="relative" ref={userDropdownRef}>
                <button
                  onClick={() => setUserDropdown(!userDropdown)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-anthracite-200 hover:text-white hover:bg-anthracite-800/50 rounded-lg transition-colors font-medium"
                >
                  <div className="w-7 h-7 rounded-full bg-gold-400/20 flex items-center justify-center">
                    <User className="w-4 h-4 text-gold-400" />
                  </div>
                  <span className="max-w-[120px] truncate">{user.name}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${userDropdown ? 'rotate-180' : ''}`} />
                </button>
                {userDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-anthracite-900 border border-anthracite-700 rounded-xl shadow-xl py-2 z-50">
                    <Link
                      href={getDashboardLink()}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-anthracite-200 hover:text-white hover:bg-anthracite-800 transition-colors"
                      onClick={() => setUserDropdown(false)}
                    >
                      <LayoutDashboard className="w-4 h-4 text-gold-400" />
                      {t('dashboard')}
                    </Link>
                    <div className="border-t border-anthracite-700 my-1" />
                    <button
                      onClick={() => { handleLogout(); setUserDropdown(false); }}
                      className="flex items-center gap-3 px-4 py-2.5 text-sm text-anthracite-400 hover:text-red-400 hover:bg-anthracite-800 transition-colors w-full text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      {t('logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm text-anthracite-200 hover:text-white hover:bg-anthracite-800/50 rounded-lg transition-colors font-medium"
                >
                  {t('login')}
                </Link>
                <Link href="/register/supplier" className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-gold-400 px-4 py-2 text-sm font-bold text-anthracite-950 hover:bg-gold-300">
                  <Dumbbell aria-hidden="true" className="h-4 w-4" />
                  {locale === 'en' ? 'Become a supplier' : 'Devino furnizor'}
                </Link>
              </>
            )}
          </div>

          <CartIcon />
          {/* Mobile Menu Button */}
          <div className="xl:hidden"><LanguageSwitcher /></div>
          <button
            ref={mobileMenuButtonRef}
            onClick={() => setIsOpen(!isOpen)}
            className="xl:hidden min-h-11 min-w-11 flex items-center justify-center p-2 text-anthracite-300 hover:text-white"
            aria-label={ui(isOpen ? 'Închide meniul' : 'Deschide meniul')}
            aria-expanded={isOpen}
            aria-controls="mobile-navigation"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      <nav aria-label={locale === 'en' ? 'Quick links' : 'Acces rapid'} className="xl:hidden grid grid-cols-3 divide-x divide-gold-400/20 border-t border-gold-400/20 bg-anthracite-900">
        <Link href="/products" onClick={() => setIsOpen(false)} className="flex min-h-12 items-center justify-center gap-2 px-2 text-xs sm:text-sm font-semibold text-gold-300 hover:bg-anthracite-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-400">
          <Dumbbell className="h-5 w-5 shrink-0" aria-hidden="true" />{ui('Echipamente')}
        </Link>
        <Link href="/configurator/studio" onClick={() => setIsOpen(false)} className="flex min-h-12 items-center gap-1 px-2 text-xs sm:text-sm font-semibold text-gold-300 hover:bg-anthracite-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-400">
          <Box className="hidden h-5 w-5 shrink-0 sm:block" aria-hidden="true" />
          {ui('Configurator 3D')}

        </Link>
        <Link href="/#super-pret" onClick={() => setIsOpen(false)} className="flex min-h-12 items-center gap-1 px-2 text-xs sm:text-sm font-semibold text-gold-300 hover:bg-anthracite-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold-400">
          <Zap className="h-5 w-5" aria-hidden="true" />
          {locale === 'en' ? 'Super Price' : 'Super Preț'}

        </Link>
      </nav>

      {/* Mobile Menu */}
      {isOpen && (
        <div ref={mobileMenuRef} id="mobile-navigation" role="navigation" aria-label={ui("Navigare principală")} className="xl:hidden bg-anthracite-900 border-b border-anthracite-700 max-h-[calc(100dvh-8rem)] overflow-y-auto overscroll-contain">
          <div className="px-4 py-4 space-y-1">
            {!user && <Link href="/register/supplier" onClick={() => setIsOpen(false)} className="mb-3 flex min-h-12 items-center justify-center gap-2 rounded-lg bg-gold-400 px-4 font-bold text-anthracite-950 hover:bg-gold-300"><Dumbbell aria-hidden="true" className="h-5 w-5" />{locale === 'en' ? 'Become a supplier' : 'Devino furnizor'}</Link>}
            <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-anthracite-300">{locale === 'en' ? 'Find and plan' : 'Caută și planifică'}</p>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-4 py-3 text-anthracite-200 hover:text-white hover:bg-anthracite-800 rounded-lg transition-colors font-medium"
                onClick={() => setIsOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            <div className="border-t border-anthracite-700 pt-3 mt-3">
              <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-anthracite-300">{locale === 'en' ? 'Offers and plans' : 'Oferte și planuri'}</p>
              {offerLinks.map(link => <Link key={link.href} href={link.href} onClick={() => setIsOpen(false)} className="block min-h-11 rounded-lg px-4 py-3 text-sm text-anthracite-300 hover:bg-anthracite-800 hover:text-white">{link.label}</Link>)}
            </div>
            <div className="border-t border-anthracite-700 pt-3 mt-3">
              <p className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-anthracite-300">{locale === 'en' ? 'Help and information' : 'Ajutor și informații'}</p>
              {supportLinks.map(link => <Link key={link.href} href={link.href} onClick={() => setIsOpen(false)} className="block min-h-11 rounded-lg px-4 py-3 text-sm text-anthracite-300 hover:bg-anthracite-800 hover:text-white">{link.label}</Link>)}
            </div>
            <div className="pt-3 mt-3 border-t border-anthracite-700 space-y-1">
              {user ? (
                <>
                  <div className="px-4 py-2 text-xs text-anthracite-500 uppercase tracking-wider">
                    {user.name}
                  </div>
                  <Link
                    href={getDashboardLink()}
                    className="flex items-center gap-3 px-4 py-3 text-anthracite-200 hover:text-white hover:bg-anthracite-800 rounded-lg transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <LayoutDashboard className="w-4 h-4 text-gold-400" />
                    {t('dashboard')}
                  </Link>
                  <button
                    onClick={() => { handleLogout(); setIsOpen(false); }}
                    className="flex items-center gap-3 px-4 py-3 text-anthracite-400 hover:text-red-400 hover:bg-anthracite-800 rounded-lg transition-colors w-full text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    {t('logout')}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="flex items-center gap-3 px-4 py-3 text-anthracite-200 hover:text-white hover:bg-anthracite-800 rounded-lg transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    {t('login')}
                  </Link>
                  <div className="px-4 py-2 text-xs text-anthracite-500 uppercase tracking-wider">
                    {t('register')}
                  </div>
                  <Link
                    href="/register/client"
                    className="flex items-center gap-3 px-4 py-3 text-anthracite-200 hover:text-white hover:bg-anthracite-800 rounded-lg transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <User className="w-4 h-4 text-blue-400" />
                    {t('registerClient')}
                  </Link>

                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
