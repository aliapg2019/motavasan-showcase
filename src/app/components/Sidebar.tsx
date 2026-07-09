'use client';

import React, { useState, useEffect } from 'react';
import {
  Home, Sparkles, Clock, Palette, CreditCard, Shield, LogOut,
  Settings, HelpCircle, MessageSquare, Crown, KeyRound
} from 'lucide-react';
import { User } from './shared/types';
import { getPlanLabel, authFetch, saveAuth } from './shared/helpers';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle
} from '@/components/ui/dialog';

const ICON_MAP: Record<string, React.ElementType> = {
  Home, Sparkles, Clock, Palette, CreditCard, Shield, KeyRound,
};

interface SidebarProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
  user: User;
  onLogout: () => void;
  collapsed: boolean;
  onToggle: () => void;
  onUserUpdate: (user: User) => void;
}

export default function Sidebar({ activeTab, onNavigate, user, onLogout, collapsed, onToggle, onUserUpdate }: SidebarProps) {
  const isAdmin = user.role === 'admin';
  const { toast } = useToast();
  const [hasAdmin, setHasAdmin] = useState(true); // Default true to avoid flash
  const [claimingAdmin, setClaimingAdmin] = useState(false);
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [setupKey, setSetupKey] = useState('');

  // Check if any admin exists
  useEffect(() => {
    if (isAdmin) return; // No need to check if already admin
    fetch('/api/auth/check-admin')
      .then(r => r.json())
      .then(data => setHasAdmin(data.hasAdmin))
      .catch(() => setHasAdmin(true));
  }, [isAdmin]);

  const handleClaimAdmin = async (key?: string) => {
    setClaimingAdmin(true);
    try {
      const res = await authFetch('/api/auth/claim-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(key ? { setupKey: key } : {}),
      });
      const data = await res.json();
      if (res.ok) {
        saveAuth(data.token, data.user);
        onUserUpdate(data.user);
        toast({ title: 'ادمین شدید!', description: 'حساب شما با موفقیت به ادمین ارتقا یافت' });
        setHasAdmin(true);
        setShowSetupDialog(false);
        setSetupKey('');
      } else {
        toast({ title: 'خطا', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'خطا در ارتقای حساب', variant: 'destructive' });
    } finally {
      setClaimingAdmin(false);
    }
  };

  const mainItems = [
    { id: 'dashboard', label: 'داشبورد', icon: 'Home' },
    { id: 'generator', label: 'تولید محتوا', icon: 'Sparkles' },
    { id: 'history', label: 'تاریخچه', icon: 'Clock' },
    { id: 'brand-voice', label: 'صدای برند', icon: 'Palette' },
    { id: 'billing', label: 'اشتراک', icon: 'CreditCard' },
    { id: 'change-password', label: 'تغییر رمز عبور', icon: 'KeyRound' },
  ];

  const adminItems = [
    { id: 'admin', label: 'پنل مدیریت', icon: 'Shield' },
  ];

  // On desktop (lg+), always show labels since sidebar is 260px wide
  // On mobile, only show labels when not collapsed
  const showLabels = true; // Always show on desktop; mobile overlay handles itself

  return (
    <>
      {/* Mobile overlay */}
      {!collapsed && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm"
          onClick={onToggle}
        />
      )}

      <aside
        className={`
          fixed top-0 right-0 h-full z-50
          bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl
          border-l border-gray-200/50 dark:border-white/5
          transition-all duration-300 ease-in-out
          flex flex-col
          ${collapsed ? 'w-0 lg:w-[260px] overflow-hidden lg:overflow-visible' : 'w-[260px]'}
          lg:relative lg:z-10
        `}
      >
        {/* Logo area */}
        <div className="h-16 flex items-center px-4 border-b border-gray-100 dark:border-white/5 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-violet-600 flex items-center justify-center shadow-lg shadow-emerald-200/30 dark:shadow-emerald-900/30 shrink-0 overflow-hidden">
              <img src="/logo.svg" alt="محتواسان" className="w-full h-full p-1" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm font-bold gradient-text truncate">محتواسان</h1>
              <p className="text-[10px] text-gray-400 truncate">AI Content Generator</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2 overflow-y-auto custom-scrollbar">
          <div className="space-y-0.5">
            {mainItems.map(item => {
              const Icon = ICON_MAP[item.icon] || Home;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onNavigate(item.id);
                    if (window.innerWidth < 1024) onToggle();
                  }}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                    text-sm font-medium transition-all duration-200
                    ${isActive
                      ? 'bg-gradient-to-l from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 text-emerald-700 dark:text-emerald-300 sidebar-item-active'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-200'
                    }
                  `}
                >
                  <Icon className={`h-[18px] w-[18px] shrink-0 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : ''}`} />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>

          {isAdmin && (
            <>
              <div className="my-3 mx-3 border-t border-gray-100 dark:border-white/5" />
              <div className="space-y-0.5">
                {adminItems.map(item => {
                  const Icon = ICON_MAP[item.icon] || Home;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.id);
                        if (window.innerWidth < 1024) onToggle();
                      }}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                        text-sm font-medium transition-all duration-200
                        ${isActive
                          ? 'bg-gradient-to-l from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 text-violet-700 dark:text-violet-300 sidebar-item-active'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-200'
                        }
                      `}
                    >
                      <Icon className={`h-[18px] w-[18px] shrink-0 ${isActive ? 'text-violet-600 dark:text-violet-400' : ''}`} />
                      <span className="truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* Help & Support link */}
          <div className="my-3 mx-3 border-t border-gray-100 dark:border-white/5" />
          <div className="space-y-0.5">
            <button
              onClick={() => {
                onNavigate('support');
                if (window.innerWidth < 1024) onToggle();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                activeTab === 'support'
                  ? 'bg-gradient-to-l from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 text-cyan-700 dark:text-cyan-300'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              <HelpCircle className={`h-[18px] w-[18px] shrink-0 ${activeTab === 'support' ? 'text-cyan-600 dark:text-cyan-400' : ''}`} />
              <span className="truncate">راهنما و پشتیبانی</span>
            </button>

            {/* Claim Admin button - shown when user is not admin */}
            {!isAdmin && (
              <button
                onClick={() => {
                  if (!hasAdmin) {
                    handleClaimAdmin();
                  } else {
                    setShowSetupDialog(true);
                  }
                }}
                disabled={claimingAdmin}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 bg-gradient-to-l from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 text-amber-700 dark:text-amber-300 hover:from-amber-100 hover:to-orange-100 dark:hover:from-amber-900/30 dark:hover:to-orange-900/30 border border-amber-200/50 dark:border-amber-700/30"
              >
                <Crown className={`h-[18px] w-[18px] shrink-0 ${claimingAdmin ? 'animate-pulse' : ''}`} />
                <span className="truncate">
                  {claimingAdmin ? 'در حال ارتقا...' : 'دریافت دسترسی ادمین'}
                </span>
              </button>
            )}
          </div>
        </nav>

        {/* User section */}
        <div className="border-t border-gray-100 dark:border-white/5 p-3 shrink-0">
          <div className="mb-3 p-3 rounded-xl bg-gray-50 dark:bg-white/5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                {user.name?.charAt(0) || '?'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-gray-400 truncate">
                  طرح {getPlanLabel(user.plan)}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-gray-500 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200"
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" />
            <span>خروج</span>
          </button>
        </div>
      </aside>

      {/* Setup Key Dialog */}
      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              دریافت دسترسی ادمین
            </DialogTitle>
            <DialogDescription>
              یک ادمین در سیستم وجود دارد. برای دریافت دسترسی ادمین، کلید تنظیمات را وارد کنید.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">کلید تنظیمات</label>
              <Input
                type="password"
                placeholder="کلید تنظیمات را وارد کنید..."
                value={setupKey}
                onChange={e => setSetupKey(e.target.value)}
                className="h-9"
                dir="ltr"
              />
              <p className="text-xs text-gray-400 mt-1.5">کلید تنظیمات در متغیر ADMIN_SETUP_KEY تنظیم شده است</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowSetupDialog(false)} className="h-9">
              انصراف
            </Button>
            <Button
              onClick={() => handleClaimAdmin(setupKey)}
              disabled={claimingAdmin || !setupKey.trim()}
              className="btn-gradient text-white h-9 gap-1.5"
            >
              {claimingAdmin ? 'در حال ارتقا...' : 'ارتقا به ادمین'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
