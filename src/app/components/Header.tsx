'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Menu, Bell, Moon, Sun, Sparkles, User, Settings, LogOut, CreditCard, ChevronLeft, X, Check, Info, KeyRound } from 'lucide-react';
import { User as UserType, UsageData } from './shared/types';
import { getPlanLabel, formatNumber, formatDate, getRelativeTime } from './shared/helpers';
import { authFetch, clearAuth } from './shared/helpers';

interface Notification {
  id: string;
  type: 'plan' | 'system' | 'usage' | 'update';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

interface HeaderProps {
  user: UserType;
  usage: UsageData | null;
  onToggleSidebar: () => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onNavigate?: (tab: string) => void;
  onLogout?: () => void;
}

export default function Header({ user, usage, onToggleSidebar, darkMode, onToggleDarkMode, onNavigate, onLogout }: HeaderProps) {
  const [showProfile, setShowProfile] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const dailyLimit = usage?.plan === 'starter' ? 5 : usage?.plan === 'pro' ? 50 : -1;
  const usagePercent = dailyLimit > 0 ? ((usage?.todayUsage || 0) / dailyLimit) * 100 : 0;
  const remaining = dailyLimit > 0 ? Math.max(0, dailyLimit - (usage?.todayUsage || 0)) : -1;
  const unreadCount = notifications.filter(n => !n.read).length;

  // Generate notifications based on user state using useMemo
  const initialNotifications = useMemo<Notification[]>(() => {
    const notifs: Notification[] = [
      {
        id: '1',
        type: 'system',
        title: 'خوش آمدید!',
        message: 'به محتواسان خوش آمدید. اولین محتوای خود را تولید کنید.',
        read: false,
        createdAt: new Date().toISOString(),
      },
    ];

    if (user.plan === 'starter') {
      notifs.push({
        id: '2',
        type: 'plan',
        title: 'ارتقا به طرح حرفه‌ای',
        message: 'با طرح حرفه‌ای، تولید محتوای نامحدود و امکانات پیشرفته داشته باشید.',
        read: false,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      });
    }

    if (usage && usage.plan === 'starter' && (usage.todayUsage || 0) >= 3) {
      notifs.push({
        id: '3',
        type: 'usage',
        title: 'محدودیت روزانه نزدیک است',
        message: `شما ${remaining} تولید روزانه باقیمانده دارید. طرح خود را ارتقا دهید.`,
        read: false,
        createdAt: new Date(Date.now() - 7200000).toISOString(),
      });
    }

    notifs.push({
      id: '4',
      type: 'update',
      title: 'قابلیت جدید: تولید پیشرفته',
      message: 'حالا می‌توانید با تنظیمات پیشرفته، محتوای دقیق‌تر و حرفه‌ای‌تر تولید کنید.',
      read: false,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    });

    return notifs;
  }, [user.plan, usage?.plan, usage?.todayUsage, remaining]);

  // Sync with memoized notifications
  useEffect(() => {
    setNotifications(initialNotifications);
  }, [initialNotifications]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'plan': return <CreditCard className="h-3.5 w-3.5 text-violet-500" />;
      case 'usage': return <Sparkles className="h-3.5 w-3.5 text-amber-500" />;
      case 'update': return <Info className="h-3.5 w-3.5 text-cyan-500" />;
      default: return <Bell className="h-3.5 w-3.5 text-emerald-500" />;
    }
  };

  return (
    <header className="h-16 border-b border-gray-100 dark:border-white/5 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl flex items-center justify-between px-4 lg:px-6 shrink-0 sticky top-0 z-30">
      {/* Right side - Menu & Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
        >
          <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />
        </button>
        <div className="hidden sm:flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center overflow-hidden">
            <img src="/logo.svg" alt="محتواسان" className="w-full h-full p-0.5" />
          </div>
          <span className="text-sm font-semibold gradient-text">محتواسان</span>
        </div>
      </div>

      {/* Left side - Actions */}
      <div className="flex items-center gap-2">
        {/* Usage indicator */}
        {dailyLimit > 0 && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-white/5 text-xs">
            <span className="text-gray-500 dark:text-gray-400">
              {remaining > 0 ? `${formatNumber(remaining)} تولید باقیمانده` : 'محدودیت تمام شده'}
            </span>
            <div className="w-16 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  usagePercent >= 80 ? 'bg-red-500' : usagePercent >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(usagePercent, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Plan badge */}
        <div className="hidden md:flex items-center px-3 py-1.5 rounded-xl bg-gradient-to-l from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 text-xs font-medium text-emerald-700 dark:text-emerald-300">
          {getPlanLabel(user.plan)}
        </div>

        {/* Dark mode toggle */}
        <button
          onClick={onToggleDarkMode}
          className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          title={darkMode ? 'حالت روشن' : 'حالت تاریک'}
        >
          {darkMode ? (
            <Sun className="h-[18px] w-[18px] text-amber-500" />
          ) : (
            <Moon className="h-[18px] w-[18px] text-gray-500" />
          )}
        </button>

        {/* Notification bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/5 transition-colors relative"
          >
            <Bell className="h-[18px] w-[18px] text-gray-500 dark:text-gray-400" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center px-1">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notification Dropdown */}
          {showNotifications && (
            <div className="absolute left-0 top-full mt-2 w-80 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-gray-100 dark:border-white/10 z-50 overflow-hidden">
              <div className="flex items-center justify-between p-3 border-b border-gray-100 dark:border-white/5">
                <h3 className="text-sm font-semibold">اعلان‌ها</h3>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="text-[10px] text-emerald-600 hover:text-emerald-700 font-medium">
                    خواندن همه
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto custom-scrollbar">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-gray-400 text-sm">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    اعلانی وجود ندارد
                  </div>
                ) : (
                  notifications.map(notif => (
                    <button
                      key={notif.id}
                      onClick={() => markAsRead(notif.id)}
                      className={`w-full text-right p-3 hover:bg-gray-50 dark:hover:bg-white/3 transition-colors border-b border-gray-50 dark:border-white/3 last:border-0 ${
                        !notif.read ? 'bg-emerald-50/30 dark:bg-emerald-900/5' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="mt-0.5 shrink-0">{getNotifIcon(notif.type)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-medium truncate">{notif.title}</p>
                            {!notif.read && (
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-5 line-clamp-2">{notif.message}</p>
                          <p className="text-[10px] text-gray-400 mt-1">{getRelativeTime(notif.createdAt)}</p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
              {notifications.some(n => n.type === 'plan') && (
                <div className="p-2 border-t border-gray-100 dark:border-white/5">
                  <button
                    onClick={() => { setShowNotifications(false); onNavigate?.('billing'); }}
                    className="w-full text-center text-xs font-medium text-emerald-600 hover:text-emerald-700 py-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-colors"
                  >
                    مشاهده طرح‌ها
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Avatar / Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfile(!showProfile)}
            className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-bold hover:ring-2 hover:ring-emerald-300 hover:ring-offset-2 dark:hover:ring-offset-zinc-900 transition-all"
          >
            {user.name?.charAt(0) || '?'}
          </button>

          {/* Profile Dropdown */}
          {showProfile && (
            <div className="absolute left-0 top-full mt-2 w-64 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-gray-100 dark:border-white/10 z-50 overflow-hidden">
              {/* User info */}
              <div className="p-4 border-b border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                    {user.name?.charAt(0) || '?'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{user.name}</p>
                    <p className="text-xs text-gray-400 truncate" dir="ltr">{user.email}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-gray-400">طرح فعلی:</span>
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                    {getPlanLabel(user.plan)}
                  </span>
                </div>
              </div>

              {/* Menu items */}
              <div className="py-1">
                <button
                  onClick={() => { setShowProfile(false); onNavigate?.('dashboard'); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <User className="h-4 w-4" />
                  داشبورد
                </button>
                <button
                  onClick={() => { setShowProfile(false); onNavigate?.('billing'); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <CreditCard className="h-4 w-4" />
                  مدیریت اشتراک
                </button>
                <button
                  onClick={() => { setShowProfile(false); onNavigate?.('brand-voice'); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  تنظیمات برند
                </button>
                <button
                  onClick={() => { setShowProfile(false); onNavigate?.('change-password'); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  <KeyRound className="h-4 w-4" />
                  تغییر رمز عبور
                </button>
              </div>

              {/* Logout */}
              <div className="border-t border-gray-100 dark:border-white/5 py-1">
                <button
                  onClick={() => { setShowProfile(false); onLogout?.(); }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  خروج از حساب
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
