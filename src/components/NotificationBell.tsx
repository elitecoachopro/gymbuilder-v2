'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, MessageSquare, Star, ShieldCheck, Package, X } from 'lucide-react';
import Link from 'next/link';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ notificationId }),
      });
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const markAllRead = async () => {
    setLoading(true);
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    setIsOpen(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'new_request': return <MessageSquare className="w-4 h-4 text-blue-400" />;
      case 'reply_received': return <Check className="w-4 h-4 text-emerald-400" />;
      case 'review_new': return <Star className="w-4 h-4 text-gold-400" />;
      case 'supplier_approved': return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      case 'product_approved': return <Package className="w-4 h-4 text-blue-400" />;
      default: return <Bell className="w-4 h-4 text-anthracite-400" />;
    }
  };

  const timeAgo = (dateStr: string) => {
    const now = new Date().getTime();
    const date = new Date(dateStr).getTime();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'Acum';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}z`;
    return new Date(dateStr).toLocaleDateString('ro-RO');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-anthracite-700/50 transition-colors"
        aria-label="Notificări"
      >
        <Bell className="w-5 h-5 text-anthracite-300 hover:text-white transition-colors" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-anthracite-800 border border-anthracite-700 rounded-xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-anthracite-700">
            <h3 className="text-sm font-semibold text-white">Notificări</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  disabled={loading}
                  className="text-xs text-gold-400 hover:text-gold-300 flex items-center gap-1 transition-colors disabled:opacity-50"
                >
                  <CheckCheck className="w-3 h-3" />
                  Marchează toate
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-anthracite-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="w-8 h-8 text-anthracite-600 mx-auto mb-2" />
                <p className="text-sm text-anthracite-400">Nicio notificare</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const content = (
                  <div
                    className={`flex items-start gap-3 px-4 py-3 hover:bg-anthracite-700/50 transition-colors cursor-pointer border-b border-anthracite-700/50 last:border-0 ${
                      !notification.is_read ? 'bg-anthracite-750/30' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="w-8 h-8 rounded-full bg-anthracite-700 flex items-center justify-center shrink-0 mt-0.5">
                      {getIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm leading-tight ${!notification.is_read ? 'text-white font-medium' : 'text-anthracite-300'}`}>
                          {notification.title}
                        </p>
                        {!notification.is_read && (
                          <span className="w-2 h-2 bg-blue-400 rounded-full shrink-0 mt-1.5"></span>
                        )}
                      </div>
                      {notification.message && (
                        <p className="text-xs text-anthracite-400 mt-0.5 line-clamp-1">{notification.message}</p>
                      )}
                      <p className="text-xs text-anthracite-500 mt-1">{timeAgo(notification.created_at)}</p>
                    </div>
                  </div>
                );

                if (notification.link) {
                  return (
                    <Link key={notification.id} href={notification.link}>
                      {content}
                    </Link>
                  );
                }
                return <div key={notification.id}>{content}</div>;
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
