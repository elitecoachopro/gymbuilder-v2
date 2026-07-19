'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { Menu, X, LayoutDashboard, LogOut, ChevronDown, User, UserPlus, Dumbbell } from 'lucide-react';
import { useClientTranslations } from '@/i18n/client';
import LanguageSwitcher from '@/components/LanguageSwitcher';

interface SessionUser {
  id: string;
  full_name: string;
  role: string;
}

export default function GlobalHeader() {
  const { t } = useClientTranslations('nav');
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { href: '/products?condition=new', label: t('equipment') },
    { href: '/products?condition=used', label: 'Second-Hand' },
    { href: '/consultation', label: t('consultation') },
    { href: '/blog', label: t('blog') },
    { href: '/contact', label: t('contact') },
  ];
  const [user, setUser] = useState<SessionUser | null>(null);
  const [userDropdown, setUserDropdown] = useState(false);
  const [registerDropdown, setRegisterDropdown] = useState(false);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const registerDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user) setUser(data.user);
        }
      } catch {}
    }
    checkSession();
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setUserDropdown(false);
      }
      if (registerDropdownRef.current && !registerDropdownRef.current.contains(e.target as Node)) {
        setRegisterDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function getDashboardLink() {
    if (!user) return '/login';
    if (user.role === 'admin') return '/admin';
    if (user.role === 'supplier') return '/supplier/dashboard';
    return '/client/dashboard';
  }

  async function handleLogout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      window.location.href = '/';
    } catch {}
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-anthracite-950/90 backdrop-blur-xl border-b border-anthracite-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center flex-shrink-0 relative z-10">
            <Image
              src="/logo.png"
              alt="GymBuilder - Build Your Gym"
              width={140}
              height={61}
              className="h-10 w-auto sm:h-11 md:h-12 object-contain"
              priority
            />
          </Link>

          {/* Desktop Navigation - Center */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm text-anthracite-300 hover:text-white hover:bg-anthracite-800/50 rounded-lg transition-colors font-medium"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions - Right */}
          <div className="hidden lg:flex items-center gap-2">
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
                  <span className="max-w-[120px] truncate">{user.full_name}</span>
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
                      Logout
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
                <div className="relative" ref={registerDropdownRef}>
                  <button
                    onClick={() => setRegisterDropdown(!registerDropdown)}
                    className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gold-400 text-anthracite-950 font-bold rounded-lg hover:bg-gold-300 transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    {t('register')}
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${registerDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {registerDropdown && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-anthracite-900 border border-anthracite-700 rounded-xl shadow-xl py-2 z-50">
                      <Link
                        href="/register/client"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-anthracite-200 hover:text-white hover:bg-anthracite-800 transition-colors"
                        onClick={() => setRegisterDropdown(false)}
                      >
                        <User className="w-4 h-4 text-blue-400" />
                        {t('registerClient')}
                      </Link>
                      <Link
                        href="/register/supplier"
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-anthracite-200 hover:text-white hover:bg-anthracite-800 transition-colors"
                        onClick={() => setRegisterDropdown(false)}
                      >
                        <Dumbbell className="w-4 h-4 text-gold-400" />
                        {t('registerSupplier')}
                      </Link>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 text-anthracite-300 hover:text-white"
            aria-label="Meniu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden bg-anthracite-900 border-b border-anthracite-700 max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="px-4 py-4 space-y-1">
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

            <div className="pt-3 mt-3 border-t border-anthracite-700 space-y-1">
              {user ? (
                <>
                  <div className="px-4 py-2 text-xs text-anthracite-500 uppercase tracking-wider">
                    {user.full_name}
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
                    Logout
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
                  <Link
                    href="/register/supplier"
                    className="flex items-center gap-3 px-4 py-3 text-anthracite-200 hover:text-white hover:bg-anthracite-800 rounded-lg transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    <Dumbbell className="w-4 h-4 text-gold-400" />
                    {t('registerSupplier')}
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
