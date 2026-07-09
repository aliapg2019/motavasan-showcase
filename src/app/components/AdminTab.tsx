'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield, Users, BarChart3, Zap, TrendingUp, Search, RefreshCw,
  CreditCard, KeyRound, Trash2, AlertTriangle, Settings, Database,
  Eye, Download, ChevronDown, Activity, MessageSquare, Send,
  Mail, Clock, CheckCircle, XCircle, Filter, Reply, UserCheck,
  UserX, Ban, Star, Zap as ZapIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CardContent } from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AdminUser, AdminStats } from './shared/types';
import { authFetch, getPlanLabel, formatDate, formatNumber, getPlanBadgeClass } from './shared/helpers';
import { useToast } from '@/hooks/use-toast';

// Simple bar chart
function SimpleBarChart({ data, labels, color }: { data: number[]; labels: string[]; color: string }) {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-2 h-32">
      {data.map((val, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <span className="text-[9px] text-gray-400">{formatNumber(val)}</span>
          <div
            className="w-full rounded-t-md transition-all duration-500"
            style={{
              height: `${(val / max) * 100}%`,
              minHeight: '4px',
              background: `linear-gradient(to top, ${color}40, ${color})`,
            }}
          />
          <span className="text-[9px] text-gray-400">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}

// Simple pie chart
function SimplePieChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;

  const segments = data.reduce<(typeof data[number] & { startAngle: number; angle: number })[]>((acc, d, i) => {
    const angle = (d.value / total) * 360;
    const startAngle = i === 0 ? 0 : acc[i - 1].startAngle + acc[i - 1].angle;
    acc.push({ ...d, startAngle, angle });
    return acc;
  }, []);

  const getCoordinates = (angle: number, radius: number) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: 50 + radius * Math.cos(rad), y: 50 + radius * Math.sin(rad) };
  };

  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 100 100" className="w-24 h-24">
        {segments.map((seg, i) => {
          if (seg.angle >= 360) {
            return <circle key={i} cx="50" cy="50" r="40" fill={seg.color} />;
          }
          const start = getCoordinates(seg.startAngle, 40);
          const end = getCoordinates(seg.startAngle + seg.angle, 40);
          const largeArc = seg.angle > 180 ? 1 : 0;
          const d = `M 50 50 L ${start.x} ${start.y} A 40 40 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
          return <path key={i} d={d} fill={seg.color} />;
        })}
      </svg>
      <div className="space-y-1">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: d.color }} />
            <span>{d.label}</span>
            <span className="text-gray-400">({formatNumber(d.value)})</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Mini chart
function MiniChart({ data, color, height = 40 }: { data: number[]; color: string; height?: number }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 120;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="inline-block">
      <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
    </svg>
  );
}

interface SupportMessage {
  id: string;
  userId: string;
  subject: string;
  message: string;
  category: string;
  status: string;
  reply: string | null;
  repliedAt: string | null;
  createdAt: string;
  user: { id: string; name: string | null; email: string; plan: string };
}

export default function AdminTab() {
  const { toast } = useToast();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('all');
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [editPlan, setEditPlan] = useState('');
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [resetPwdUserId, setResetPwdUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [viewUser, setViewUser] = useState<AdminUser | null>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'support' | 'settings'>('dashboard');

  // Support state
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>([]);
  const [loadingSupport, setLoadingSupport] = useState(false);
  const [supportFilter, setSupportFilter] = useState('all');
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [viewMessage, setViewMessage] = useState<SupportMessage | null>(null);

  // Simulated chart data
  const [chartData] = useState({
    userGrowth: [3, 5, 8, 12, 15, 20, 24, 30, 35, 42, 50, 58],
    generationGrowth: [10, 25, 40, 55, 80, 110, 140, 180, 220, 280, 350, 420],
    revenueGrowth: [0, 149000, 298000, 447000, 745000, 894000, 1192000, 1490000, 1788000, 2086000, 2384000, 2682000],
    months: ['فرو', 'ارد', 'خرد', 'تیر', 'مرد', 'شهر', 'مهر', 'آبا', 'آذر', 'دی', 'بهم', 'اسف'],
  });

  useEffect(() => {
    authFetch('/api/admin/stats')
      .then(r => r.json())
      .then(data => { setStats(data); setLoadingStats(false); })
      .catch(() => setLoadingStats(false));
  }, []);

  const fetchUsers = useCallback(() => {
    setLoadingUsers(true);
    let url = `/api/admin/users?page=${page}&search=${search}`;
    authFetch(url)
      .then(r => r.json())
      .then(data => {
        let filtered = data.users || [];
        if (planFilter !== 'all') {
          filtered = filtered.filter((u: AdminUser) => u.plan === planFilter);
        }
        setUsers(filtered);
        setTotalUsers(data.total || 0);
        setLoadingUsers(false);
      })
      .catch(() => setLoadingUsers(false));
  }, [page, search, planFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const fetchSupport = useCallback(() => {
    setLoadingSupport(true);
    authFetch(`/api/admin/support?status=${supportFilter}`)
      .then(r => r.json())
      .then(data => {
        setSupportMessages(data.messages || []);
        setLoadingSupport(false);
      })
      .catch(() => setLoadingSupport(false));
  }, [supportFilter]);

  useEffect(() => {
    if (activeTab === 'support') fetchSupport();
  }, [activeTab, fetchSupport]);

  const handlePlanChange = async () => {
    if (!editUser) return;
    setActionLoading(true);
    try {
      const res = await authFetch(`/api/admin/users/${editUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: editPlan }),
      });
      if (res.ok) {
        toast({ title: 'بروزرسانی شد!', description: `طرح کاربر به ${getPlanLabel(editPlan)} تغییر کرد` });
        setEditUser(null);
        fetchUsers();
      } else {
        const data = await res.json();
        toast({ title: 'خطا', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'خطا', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, role: string) => {
    try {
      const res = await authFetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      if (res.ok) { toast({ title: 'نقش تغییر کرد!' }); fetchUsers(); }
    } catch { toast({ title: 'خطا', variant: 'destructive' }); }
  };

  const handleDelete = async () => {
    if (!deleteUserId) return;
    setActionLoading(true);
    try {
      const res = await authFetch(`/api/admin/users/${deleteUserId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) { toast({ title: 'کاربر حذف شد' }); setDeleteUserId(null); fetchUsers(); }
      else { toast({ title: 'خطا', description: data.error, variant: 'destructive' }); }
    } catch { toast({ title: 'خطا', variant: 'destructive' }); }
    finally { setActionLoading(false); }
  };

  const handleResetPassword = async () => {
    if (!resetPwdUserId || !newPassword) return;
    setActionLoading(true);
    try {
      const res = await authFetch(`/api/admin/users/${resetPwdUserId}/reset-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ newPassword }),
      });
      if (res.ok) { toast({ title: 'رمز عبور بازنشانی شد!' }); setResetPwdUserId(null); setNewPassword(''); }
      else { const data = await res.json(); toast({ title: 'خطا', description: data.error, variant: 'destructive' }); }
    } catch { toast({ title: 'خطا', variant: 'destructive' }); }
    finally { setActionLoading(false); }
  };

  const handleReplySupport = async () => {
    if (!replyToId || !replyText) return;
    setActionLoading(true);
    try {
      const res = await authFetch('/api/admin/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId: replyToId, reply: replyText }),
      });
      if (res.ok) {
        toast({ title: 'پاسخ ارسال شد!' });
        setReplyToId(null);
        setReplyText('');
        fetchSupport();
      } else {
        const data = await res.json();
        toast({ title: 'خطا', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'خطا', variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleExportCSV = () => {
    const headers = 'نام,ایمیل,طرح,نقش,تعداد تولید,تاریخ عضویت\n';
    const rows = users.map(u =>
      `${u.name || ''},${u.email},${getPlanLabel(u.plan)},${u.role === 'admin' ? 'ادمین' : 'کاربر'},${u._count.generations},${formatDate(u.createdAt)}`
    ).join('\n');
    const blob = new Blob(['\uFEFF' + headers + rows], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users-export.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'خروجی CSV دریافت شد' });
  };

  const toggleSelectUser = (id: string) => {
    const next = new Set(selectedUsers);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedUsers(next);
  };

  const planColors: Record<string, string> = { starter: '#6b7280', pro: '#8b5cf6', business: '#f59e0b' };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open': return <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px]">باز</Badge>;
      case 'in_progress': return <Badge className="bg-blue-100 text-blue-700 border-0 text-[10px]">در بررسی</Badge>;
      case 'replied': return <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px]">پاسخ داده شده</Badge>;
      case 'closed': return <Badge className="bg-gray-100 text-gray-600 border-0 text-[10px]">بسته شده</Badge>;
      default: return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'technical': return 'فنی';
      case 'billing': return 'مالی';
      case 'feature_request': return 'درخواست ویژگی';
      default: return 'عمومی';
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center shadow-lg">
            <Shield className="h-4.5 w-4.5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold">پنل مدیریت</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">مدیریت کاربران، پشتیبانی و مشاهده آمار پلتفرم</p>
          </div>
        </div>
        {/* Sub-tabs */}
        <div className="flex bg-gray-100/80 dark:bg-white/5 rounded-lg p-0.5">
          {[
            { id: 'dashboard' as const, label: 'داشبورد', icon: BarChart3 },
            { id: 'users' as const, label: 'کاربران', icon: Users },
            { id: 'support' as const, label: 'پشتیبانی', icon: MessageSquare },
            { id: 'settings' as const, label: 'تنظیمات', icon: Settings },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeTab === tab.id ? 'bg-white dark:bg-zinc-800 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'
              }`}
            >
              <tab.icon className="h-3.5 w-3.5" />
              {tab.label}
              {tab.id === 'support' && supportMessages.filter(m => m.status === 'open').length > 0 && (
                <span className="bg-red-500 text-white text-[8px] rounded-full w-4 h-4 flex items-center justify-center">
                  {supportMessages.filter(m => m.status === 'open').length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Dashboard sub-tab */}
      {activeTab === 'dashboard' && (
        <>
          {loadingStats ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 rounded-xl shimmer" />)}
            </div>
          ) : stats ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="glass-card rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">کل کاربران</p>
                      <p className="text-xl font-bold">{formatNumber(stats.totalUsers)}</p>
                      <p className="text-[10px] text-emerald-500 flex items-center gap-0.5 mt-0.5">
                        <TrendingUp className="h-2.5 w-2.5" /> +۱۲٪ این هفته
                      </p>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </CardContent>
              </div>
              <div className="glass-card rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">کل تولیدها</p>
                      <p className="text-xl font-bold">{formatNumber(stats.totalGenerations)}</p>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center">
                      <BarChart3 className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </CardContent>
              </div>
              <div className="glass-card rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">تولید امروز</p>
                      <p className="text-xl font-bold">{formatNumber(stats.generationsToday)}</p>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center">
                      <Zap className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </CardContent>
              </div>
              <div className="glass-card rounded-xl">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">درآمد ماهانه</p>
                      <p className="text-lg font-bold">{formatNumber(stats.revenueEstimate)} <span className="text-[10px] text-gray-400">تومان</span></p>
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-white" />
                    </div>
                  </div>
                </CardContent>
              </div>
            </div>
          ) : null}

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="glass-card rounded-xl">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4 text-emerald-500" />
                  رشد کاربران
                </h3>
                <SimpleBarChart data={chartData.userGrowth} labels={chartData.months} color="#10b981" />
              </CardContent>
            </div>
            <div className="glass-card rounded-xl">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-violet-500" />
                  رشد تولید محتوا
                </h3>
                <SimpleBarChart data={chartData.generationGrowth} labels={chartData.months} color="#8b5cf6" />
              </CardContent>
            </div>
            <div className="glass-card rounded-xl">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-amber-500" />
                  توزیع طرح‌ها
                </h3>
                {stats && (
                  <SimplePieChart data={Object.entries(stats.planStats).map(([plan, count]) => ({
                    label: getPlanLabel(plan),
                    value: count,
                    color: planColors[plan] || '#6b7280',
                  }))} />
                )}
              </CardContent>
            </div>
            <div className="glass-card rounded-xl">
              <CardContent className="p-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-orange-500" />
                  روند درآمد
                </h3>
                <MiniChart data={chartData.revenueGrowth.map(v => v / 1000)} color="#f59e0b" height={80} />
                <p className="text-xs text-gray-400 mt-2">مبالغ بر حسب هزار تومان</p>
              </CardContent>
            </div>
          </div>

          {/* Plan Limits Info */}
          <div className="glass-card rounded-xl">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Shield className="h-4 w-4 text-gray-500" />
                محدودیت‌های طرح‌ها
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/3 border border-gray-100 dark:border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-gray-400 flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold">S</span>
                    </div>
                    <span className="text-sm font-medium">استارتر (رایگان)</span>
                  </div>
                  <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                    <li>• ۵ تولید محتوا در روز</li>
                    <li>• ۱ بار استفاده پیشرفته رایگان</li>
                    <li>• قالب‌های پایه</li>
                    <li>• ۱ پروفایل برند</li>
                  </ul>
                </div>
                <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-900/10 border border-violet-100 dark:border-violet-700/20">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-violet-500 flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold">P</span>
                    </div>
                    <span className="text-sm font-medium">حرفه‌ای</span>
                  </div>
                  <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                    <li>• ۵۰ تولید محتوا در روز</li>
                    <li>• حالت پیشرفته نامحدود</li>
                    <li>• همه قالب‌ها</li>
                    <li>• ۵ پروفایل برند</li>
                  </ul>
                </div>
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-700/20">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                      <span className="text-white text-[10px] font-bold">B</span>
                    </div>
                    <span className="text-sm font-medium">تجاری</span>
                  </div>
                  <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                    <li>• تولید نامحدود</li>
                    <li>• حالت پیشرفته نامحدود</li>
                    <li>• همه + قالب‌های سفارشی</li>
                    <li>• پروفایل برند نامحدود</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </div>
        </>
      )}

      {/* Users sub-tab */}
      {activeTab === 'users' && (
        <>
          {/* Search & filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="جستجوی کاربر..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="pr-10 input-glow transition-all h-9 text-sm" />
            </div>
            <Select value={planFilter} onValueChange={v => { setPlanFilter(v); setPage(1); }}>
              <SelectTrigger className="w-28 h-9 text-xs">
                <SelectValue placeholder="همه طرح‌ها" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه طرح‌ها</SelectItem>
                <SelectItem value="starter">استارتر</SelectItem>
                <SelectItem value="pro">حرفه‌ای</SelectItem>
                <SelectItem value="business">تجاری</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchUsers} size="icon" className="h-9 w-9 shrink-0">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={handleExportCSV} className="h-9 text-xs shrink-0">
              <Download className="h-3.5 w-3.5 ml-1" />
              خروجی CSV
            </Button>
          </div>

          {/* Bulk actions */}
          {selectedUsers.size > 0 && (
            <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/30">
              <span className="text-xs text-amber-700 dark:text-amber-300">{formatNumber(selectedUsers.size)} کاربر انتخاب شده</span>
              <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => setSelectedUsers(new Set())}>
                لغو انتخاب
              </Button>
            </div>
          )}

          {/* Users table */}
          {loadingUsers ? (
            <div className="space-y-2">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-12 w-full rounded-xl shimmer" />)}</div>
          ) : (
            <div className="glass-card rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/3">
                      <th className="p-3 w-8">
                        <input type="checkbox" className="rounded" onChange={e => {
                          if (e.target.checked) setSelectedUsers(new Set(users.map(u => u.id)));
                          else setSelectedUsers(new Set());
                        }} />
                      </th>
                      <th className="text-right p-3 font-medium text-gray-500 text-xs">نام</th>
                      <th className="text-right p-3 font-medium text-gray-500 text-xs">ایمیل / موبایل</th>
                      <th className="text-right p-3 font-medium text-gray-500 text-xs">وضعیت</th>
                      <th className="text-right p-3 font-medium text-gray-500 text-xs">طرح</th>
                      <th className="text-right p-3 font-medium text-gray-500 text-xs">نقش</th>
                      <th className="text-right p-3 font-medium text-gray-500 text-xs">تولیدها</th>
                      <th className="text-right p-3 font-medium text-gray-500 text-xs">عملیات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u.id} className="border-b border-gray-50 dark:border-white/3 last:border-0 hover:bg-gray-50/30 dark:hover:bg-white/3 transition-colors">
                        <td className="p-3">
                          <input type="checkbox" className="rounded" checked={selectedUsers.has(u.id)} onChange={() => toggleSelectUser(u.id)} />
                        </td>
                        <td className="p-3 font-medium text-xs cursor-pointer hover:text-emerald-600" onClick={() => setViewUser(u)}>{u.name || '-'}</td>
                        <td className="p-3 text-gray-500 text-xs">
                          <div dir="ltr" className="text-[11px]">{u.email}</div>
                          {u.phone && <div dir="ltr" className="text-[10px] text-gray-400">{u.phone}</div>}
                        </td>
                        <td className="p-3">
                          <div className="flex flex-col gap-0.5">
                            {u.emailVerified ? (
                              <Badge className="text-[9px] bg-emerald-50 text-emerald-600 border-0">ایمیل تایید شده</Badge>
                            ) : (
                              <Badge className="text-[9px] bg-amber-50 text-amber-600 border-0">ایمیل تایید نشده</Badge>
                            )}
                            {u.phone && (u.phoneVerified ? (
                              <Badge className="text-[9px] bg-emerald-50 text-emerald-600 border-0">موبایل تایید شده</Badge>
                            ) : (
                              <Badge className="text-[9px] bg-amber-50 text-amber-600 border-0">موبایل تایید نشده</Badge>
                            ))}
                          </div>
                        </td>
                        <td className="p-3">
                          <Badge className={`text-[10px] ${getPlanBadgeClass(u.plan)}`}>{getPlanLabel(u.plan)}</Badge>
                        </td>
                        <td className="p-3">
                          <Select value={u.role} onValueChange={v => handleRoleChange(u.id, v)}>
                            <SelectTrigger className="w-24 h-7 text-[10px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">کاربر</SelectItem>
                              <SelectItem value="admin">ادمین</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-3 text-xs">{formatNumber(u._count.generations)}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-0.5">
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title="مشاهده" onClick={() => setViewUser(u)}>
                              <Eye className="h-3 w-3 text-gray-400" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title="تغییر طرح" onClick={() => { setEditUser(u); setEditPlan(u.plan); }}>
                              <CreditCard className="h-3 w-3 text-violet-500" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title="بازنشانی رمز" onClick={() => { setResetPwdUserId(u.id); setNewPassword(''); }}>
                              <KeyRound className="h-3 w-3 text-amber-500" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0" title="حذف" onClick={() => setDeleteUserId(u.id)}>
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {totalUsers > 20 && (
                <div className="p-2 border-t border-gray-100 dark:border-white/5 flex items-center justify-center gap-2">
                  <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)} className="h-7 text-xs">قبلی</Button>
                  <span className="text-xs text-gray-500">صفحه {page}</span>
                  <Button variant="outline" size="sm" disabled={users.length < 20} onClick={() => setPage(p => p + 1)} className="h-7 text-xs">بعدی</Button>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Support sub-tab */}
      {activeTab === 'support' && (
        <>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 bg-gray-100/80 dark:bg-white/5 rounded-lg p-0.5">
              {[
                { value: 'all', label: 'همه' },
                { value: 'open', label: 'باز' },
                { value: 'replied', label: 'پاسخ داده شده' },
                { value: 'closed', label: 'بسته شده' },
              ].map(f => (
                <button
                  key={f.value}
                  onClick={() => setSupportFilter(f.value)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                    supportFilter === f.value ? 'bg-white dark:bg-zinc-800 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex-1" />
            <Button variant="outline" onClick={fetchSupport} size="icon" className="h-9 w-9 shrink-0">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>

          {loadingSupport ? (
            <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl shimmer" />)}</div>
          ) : supportMessages.length === 0 ? (
            <div className="glass-card rounded-xl p-8 text-center">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
              <p className="text-gray-500 dark:text-gray-400">هیچ پیام پشتیبانی وجود ندارد</p>
            </div>
          ) : (
            <div className="space-y-3">
              {supportMessages.map(msg => (
                <div key={msg.id} className="glass-card rounded-xl overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          {getStatusBadge(msg.status)}
                          <Badge variant="outline" className="text-[10px]">{getCategoryLabel(msg.category)}</Badge>
                          <span className="text-[10px] text-gray-400">{formatDate(msg.createdAt)}</span>
                        </div>
                        <h4 className="text-sm font-medium mb-1">{msg.subject}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{msg.message}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-[8px] font-bold">
                            {msg.user.name?.charAt(0) || '?'}
                          </div>
                          <span className="text-[11px] text-gray-500">{msg.user.name || msg.user.email}</span>
                          <span className="text-[10px] text-gray-400" dir="ltr">{msg.user.email}</span>
                          <Badge className={`text-[9px] ${getPlanBadgeClass(msg.user.plan)}`}>{getPlanLabel(msg.user.plan)}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="مشاهده" onClick={() => setViewMessage(msg)}>
                          <Eye className="h-3.5 w-3.5 text-gray-400" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" title="پاسخ" onClick={() => { setReplyToId(msg.id); setReplyText(''); }}>
                          <Reply className="h-3.5 w-3.5 text-emerald-500" />
                        </Button>
                      </div>
                    </div>

                    {/* Reply shown inline */}
                    {msg.reply && (
                      <div className="mt-3 p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30">
                        <div className="flex items-center gap-1.5 mb-1">
                          <CheckCircle className="h-3 w-3 text-emerald-500" />
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">پاسخ پشتیبانی</span>
                          {msg.repliedAt && <span className="text-[9px] text-gray-400 mr-2">{formatDate(msg.repliedAt)}</span>}
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-300 leading-5">{msg.reply}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Settings sub-tab */}
      {activeTab === 'settings' && (
        <div className="space-y-4">
          <div className="glass-card rounded-xl">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Settings className="h-4 w-4 text-gray-500" />
                تنظیمات پلتفرم
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">محدودیت روزانه طرح استارتر</Label>
                    <Input type="number" defaultValue={5} className="h-9 mt-1.5" />
                  </div>
                  <div>
                    <Label className="text-sm">محدودیت روزانه طرح حرفه‌ای</Label>
                    <Input type="number" defaultValue={50} className="h-9 mt-1.5" />
                  </div>
                  <div>
                    <Label className="text-sm">قیمت طرح حرفه‌ای (تومان)</Label>
                    <Input type="number" defaultValue={149000} className="h-9 mt-1.5" />
                  </div>
                  <div>
                    <Label className="text-sm">قیمت طرح تجاری (تومان)</Label>
                    <Input type="number" defaultValue={399000} className="h-9 mt-1.5" />
                  </div>
                  <div>
                    <Label className="text-sm">تخفیف سالانه (%)</Label>
                    <Input type="number" defaultValue={20} className="h-9 mt-1.5" />
                  </div>
                  <div>
                    <Label className="text-sm">استفاده رایگان پیشرفته (طرح استارتر)</Label>
                    <Input type="number" defaultValue={1} className="h-9 mt-1.5" />
                  </div>
                </div>
                <Button className="btn-gradient text-white h-9 text-sm">ذخیره تنظیمات</Button>
              </div>
            </CardContent>
          </div>

          <div className="glass-card rounded-xl">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Database className="h-4 w-4 text-gray-500" />
                سلامت سیستم
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/10">
                  <p className="text-[10px] text-gray-500 mb-1">پایگاه داده</p>
                  <Badge variant="outline" className="text-emerald-600 border-emerald-200 text-[10px]">فعال</Badge>
                </div>
                <div className="text-center p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/10">
                  <p className="text-[10px] text-gray-500 mb-1">API هوش مصنوعی</p>
                  <Badge variant="outline" className="text-emerald-600 border-emerald-200 text-[10px]">فعال</Badge>
                </div>
                <div className="text-center p-3 rounded-xl bg-gray-50 dark:bg-white/3">
                  <p className="text-[10px] text-gray-500 mb-1">حجم دیتابیس</p>
                  <span className="text-xs font-medium">۲.۴ مگابایت</span>
                </div>
                <div className="text-center p-3 rounded-xl bg-gray-50 dark:bg-white/3">
                  <p className="text-[10px] text-gray-500 mb-1">درخواست امروز</p>
                  <span className="text-xs font-medium">{stats ? formatNumber(stats.generationsToday) : '-'}</span>
                </div>
              </div>
            </CardContent>
          </div>

          {/* Admin Access Info */}
          <div className="glass-card rounded-xl">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Shield className="h-4 w-4 text-gray-500" />
                راهنمای دسترسی ادمین
              </h3>
              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30">
                  <p className="font-medium text-emerald-700 dark:text-emerald-300 mb-1">نحوه دسترسی به پنل ادمین:</p>
                  <ul className="space-y-1.5 text-xs">
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-200 dark:bg-emerald-800 flex items-center justify-center text-[10px] font-bold text-emerald-700 dark:text-emerald-300">۱</span>
                      اولین کاربری که ثبت‌نام می‌کند، به صورت خودکار نقش ادمین دریافت می‌کند
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-200 dark:bg-emerald-800 flex items-center justify-center text-[10px] font-bold text-emerald-700 dark:text-emerald-300">۲</span>
                      منوی «پنل مدیریت» فقط برای کاربران با نقش ادمین در منوی کناری نمایش داده می‌شود
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-200 dark:bg-emerald-800 flex items-center justify-center text-[10px] font-bold text-emerald-700 dark:text-emerald-300">۳</span>
                      می‌توانید از بخش مدیریت کاربران، نقش هر کاربر را به ادمین تغییر دهید
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-200 dark:bg-emerald-800 flex items-center justify-center text-[10px] font-bold text-emerald-700 dark:text-emerald-300">۴</span>
                      از بخش پشتیبانی می‌توانید به پیام‌های کاربران پاسخ دهید
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </div>
        </div>
      )}

      {/* User detail dialog */}
      <Dialog open={!!viewUser} onOpenChange={() => setViewUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>جزئیات کاربر</DialogTitle>
          </DialogHeader>
          {viewUser && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold">
                  {viewUser.name?.charAt(0) || '?'}
                </div>
                <div>
                  <p className="font-medium">{viewUser.name || '-'}</p>
                  <p className="text-sm text-gray-500" dir="ltr">{viewUser.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-400">طرح:</span> <Badge className={`text-[10px] ${getPlanBadgeClass(viewUser.plan)}`}>{getPlanLabel(viewUser.plan)}</Badge></div>
                <div><span className="text-gray-400">نقش:</span> {viewUser.role === 'admin' ? 'ادمین' : 'کاربر'}</div>
                <div><span className="text-gray-400">تعداد تولید:</span> {formatNumber(viewUser._count.generations)}</div>
                <div><span className="text-gray-400">پروفایل برند:</span> {formatNumber(viewUser._count.brandProfiles)}</div>
                <div><span className="text-gray-400">تاریخ عضویت:</span> {formatDate(viewUser.createdAt)}</div>
                {viewUser.subscription?.endDate && (
                  <div><span className="text-gray-400">اتمام اشتراک:</span> {formatDate(viewUser.subscription.endDate)}</div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View message dialog */}
      <Dialog open={!!viewMessage} onOpenChange={() => setViewMessage(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-emerald-500" />
              جزئیات پیام پشتیبانی
            </DialogTitle>
          </DialogHeader>
          {viewMessage && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {getStatusBadge(viewMessage.status)}
                <Badge variant="outline" className="text-[10px]">{getCategoryLabel(viewMessage.category)}</Badge>
                <span className="text-xs text-gray-400">{formatDate(viewMessage.createdAt)}</span>
              </div>
              <div>
                <p className="text-sm font-medium mb-1">{viewMessage.subject}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-6 whitespace-pre-wrap">{viewMessage.message}</p>
              </div>
              <Separator />
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-[10px] font-bold">
                  {viewMessage.user.name?.charAt(0) || '?'}
                </div>
                <span>{viewMessage.user.name}</span>
                <span dir="ltr">{viewMessage.user.email}</span>
                <Badge className={`text-[9px] ${getPlanBadgeClass(viewMessage.user.plan)}`}>{getPlanLabel(viewMessage.user.plan)}</Badge>
              </div>
              {viewMessage.reply && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30">
                  <div className="flex items-center gap-1.5 mb-1">
                    <CheckCircle className="h-3 w-3 text-emerald-500" />
                    <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">پاسخ شما</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-6 whitespace-pre-wrap">{viewMessage.reply}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reply dialog */}
      <Dialog open={!!replyToId} onOpenChange={() => { setReplyToId(null); setReplyText(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Reply className="h-5 w-5 text-emerald-500" />
              پاسخ به پیام پشتیبانی
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              placeholder="پاسخ خود را اینجا بنویسید..."
              value={replyText}
              onChange={e => setReplyText(e.target.value)}
              className="min-h-[120px] input-glow transition-all resize-y"
              rows={4}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setReplyToId(null); setReplyText(''); }}>انصراف</Button>
            <Button className="btn-gradient text-white" onClick={handleReplySupport} disabled={actionLoading || !replyText.trim()}>
              {actionLoading ? <RefreshCw className="h-4 w-4 animate-spin ml-2" /> : <Send className="h-4 w-4 ml-2" />}
              ارسال پاسخ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit plan dialog */}
      <Dialog open={!!editUser} onOpenChange={() => setEditUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تغییر طرح کاربر</DialogTitle>
            <DialogDescription>تغییر طرح {editUser?.name || editUser?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Select value={editPlan} onValueChange={setEditPlan}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="starter">استارتر (۵ تولید/روز)</SelectItem>
                <SelectItem value="pro">حرفه‌ای (۵۰ تولید/روز)</SelectItem>
                <SelectItem value="business">تجاری (نامحدود)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setEditUser(null)}>انصراف</Button>
            <Button className="btn-gradient text-white" onClick={handlePlanChange} disabled={actionLoading}>
              {actionLoading ? <RefreshCw className="h-4 w-4 animate-spin ml-2" /> : null}
              ذخیره
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              حذف کاربر
            </DialogTitle>
            <DialogDescription>آیا مطمئن هستید؟ این عمل غیرقابل بازگشت است.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteUserId(null)}>انصراف</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={actionLoading}>
              {actionLoading ? <RefreshCw className="h-4 w-4 animate-spin ml-2" /> : null}
              حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset password dialog */}
      <Dialog open={!!resetPwdUserId} onOpenChange={() => { setResetPwdUserId(null); setNewPassword(''); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-amber-500" />
              بازنشانی رمز عبور
            </DialogTitle>
            <DialogDescription>رمز عبور جدید (حداقل ۶ کاراکتر)</DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Input type="text" placeholder="رمز عبور جدید" value={newPassword} onChange={e => setNewPassword(e.target.value)} dir="ltr" minLength={6} className="input-glow transition-all h-9" />
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setResetPwdUserId(null); setNewPassword(''); }}>انصراف</Button>
            <Button className="btn-gradient text-white" onClick={handleResetPassword} disabled={actionLoading || newPassword.length < 6}>
              {actionLoading ? <RefreshCw className="h-4 w-4 animate-spin ml-2" /> : null}
              بازنشانی
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Label({ className, children }: { className?: string; children: React.ReactNode }) {
  return <label className={`text-sm font-medium ${className}`}>{children}</label>;
}
