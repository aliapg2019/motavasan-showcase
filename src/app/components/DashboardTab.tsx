'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles, Zap, TrendingUp, Star, ArrowLeft, FileText,
  AlertTriangle, MessageSquare, Hash, Palette, CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { User, UsageData, Generation } from './shared/types';
import { authFetch, getCategoryLabel, getPlanLabel, formatDate, formatNumber, getRelativeTime } from './shared/helpers';
import { GOALS } from './shared/constants';

interface DashboardTabProps {
  user: User;
  usage: UsageData | null;
  onNavigate: (tab: string) => void;
}

const QUICK_ACTIONS = [
  { id: 'generator', icon: Sparkles, label: 'تولید محتوا', color: 'from-emerald-400 to-teal-500' },
  { id: 'brand-voice', icon: Palette, label: 'صدای برند', color: 'from-violet-400 to-purple-500' },
  { id: 'history', icon: FileText, label: 'تاریخچه', color: 'from-amber-400 to-orange-500' },
  { id: 'billing', icon: CreditCard, label: 'اشتراک', color: 'from-cyan-400 to-teal-500' },
];

export default function DashboardTab({ user, usage, onNavigate }: DashboardTabProps) {
  const [recentGens, setRecentGens] = useState<Generation[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  useEffect(() => {
    authFetch('/api/generations?limit=5')
      .then(res => res.json())
      .then(data => {
        setRecentGens(data.generations || []);
        setLoadingRecent(false);
      })
      .catch(() => setLoadingRecent(false));
  }, []);

  const dailyLimit = usage?.plan === 'starter' ? 5 : usage?.plan === 'pro' ? 50 : -1;
  const usagePercent = dailyLimit > 0 ? ((usage?.todayUsage || 0) / dailyLimit) * 100 : 0;
  const remaining = dailyLimit > 0 ? Math.max(0, dailyLimit - (usage?.todayUsage || 0)) : -1;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="welcome-banner rounded-2xl p-6 lg:p-8 text-white relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl lg:text-3xl font-bold mb-2">سلام {user.name}! 👋</h2>
            <p className="text-white/80 mb-0">امروز چه محتوایی می‌خوای تولید کنی؟</p>
          </div>
          <Button
            onClick={() => onNavigate('generator')}
            className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm border border-white/20 font-medium shrink-0"
          >
            <Sparkles className="h-4 w-4 ml-2" />
            تولید محتوای جدید
          </Button>
        </div>
        {/* Mini sparkline decoration */}
        <div className="absolute left-4 bottom-4 opacity-20">
          <svg width="120" height="40" viewBox="0 0 120 40">
            <polyline fill="none" stroke="white" strokeWidth="2" points="0,35 20,28 40,30 60,15 80,20 100,8 120,12" />
          </svg>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-md">
                <Zap className="h-5 w-5 text-white" />
              </div>
              {dailyLimit > 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  usagePercent >= 80 ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {remaining > 0 ? `${formatNumber(remaining)} باقیمانده` : 'تمام شده'}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">تولید امروز</p>
            <div className="flex items-end gap-1">
              <p className="text-2xl font-bold animate-count-up">{usage?.todayUsage || 0}</p>
              {dailyLimit > 0 && <p className="text-sm text-gray-400 mb-0.5">/ {dailyLimit}</p>}
            </div>
            {dailyLimit > 0 && (
              <Progress value={Math.min(usagePercent, 100)} className="h-1.5 mt-3" />
            )}
          </CardContent>
        </div>

        <div className="glass-card rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center shadow-md">
                <TrendingUp className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                کل
              </span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">کل تولیدها</p>
            <p className="text-2xl font-bold animate-count-up">{formatNumber(usage?.totalGenerations || 0)}</p>
          </CardContent>
        </div>

        <div className="glass-card rounded-xl">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-teal-600 flex items-center justify-center shadow-md">
                <Star className="h-5 w-5 text-white" />
              </div>
              {user.plan !== 'pro' && user.plan !== 'business' && (
                <button
                  onClick={() => onNavigate('billing')}
                  className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 hover:bg-amber-200 transition-colors cursor-pointer"
                >
                  ارتقا
                </button>
              )}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">طرح فعلی</p>
            <p className="text-2xl font-bold">{getPlanLabel(usage?.plan || 'starter')}</p>
          </CardContent>
        </div>
      </div>

      {/* Usage warning */}
      {dailyLimit > 0 && usagePercent >= 80 && (
        <div className="rounded-xl p-4 bg-gradient-to-l from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 border border-amber-200/50 dark:border-amber-800/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">به محدودیت روزانه نزدیک شدید</p>
            <p className="text-xs text-amber-600 dark:text-amber-400">با ارتقا به طرح حرفه‌ای، تولید محتوای نامحدود داشته باشید</p>
          </div>
          <Button size="sm" className="btn-gradient text-white shrink-0" onClick={() => onNavigate('billing')}>
            ارتقا
          </Button>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">دسترسی سریع</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {QUICK_ACTIONS.map(action => (
            <button
              key={action.id}
              onClick={() => onNavigate(action.id)}
              className="glass-card rounded-xl p-4 flex flex-col items-center gap-2 transition-all duration-200 hover:shadow-md group"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}>
                <action.icon className="h-5 w-5 text-white" />
              </div>
              <span className="text-xs font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activity Timeline */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">آخرین فعالیت‌ها</h3>
          <Button variant="ghost" size="sm" onClick={() => onNavigate('history')} className="text-xs">
            مشاهده همه
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
          </Button>
        </div>
        {loadingRecent ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full rounded-xl shimmer" />)}
          </div>
        ) : recentGens.length === 0 ? (
          <div className="glass-card rounded-xl">
            <CardContent className="p-8 text-center text-gray-400">
              <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="mb-1">هنوز محتوایی تولید نکردید</p>
              <p className="text-sm mb-4">اولین محتوای خود را تولید کنید</p>
              <Button className="btn-gradient text-white" onClick={() => onNavigate('generator')}>
                شروع تولید محتوا
              </Button>
            </CardContent>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute right-[17px] top-2 bottom-2 w-px bg-gray-200 dark:bg-white/5" />
            <div className="space-y-1">
              {recentGens.map((gen, i) => (
                <button
                  key={gen.id}
                  onClick={() => onNavigate('history')}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/3 transition-colors text-right group"
                >
                  {/* Timeline dot */}
                  <div className={`w-[9px] h-[9px] rounded-full shrink-0 z-10 ring-4 ring-white dark:ring-zinc-950 ${
                    i === 0 ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium truncate">{gen.productName}</p>
                      <Badge variant="secondary" className="text-[10px] shrink-0 bg-violet-50 text-violet-700 dark:bg-violet-900/20 dark:text-violet-300">
                        {GOALS.find(g => g.value === gen.goal)?.label || gen.goal}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {getCategoryLabel(gen.category)} • {getRelativeTime(gen.createdAt)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
