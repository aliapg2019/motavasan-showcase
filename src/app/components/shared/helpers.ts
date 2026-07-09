// shared helpers
import { User } from './types';
import { CATEGORIES } from './constants';

// auth helpers
const TOKEN_KEY = 'contentgen_token';
const USER_KEY = 'contentgen_user';

export function saveAuth(token: string, user: User) {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch { /* SSR safe */ }
}

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch { return null; }
}

export function getStoredUser(): User | null {
  try {
    const u = localStorage.getItem(USER_KEY);
    return u ? JSON.parse(u) : null;
  } catch { return null; }
}

export function clearAuth() {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch { /* SSR safe */ }
}

export function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getStoredToken();
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(url, { ...options, headers });
}

// utility helpers
export function copyToClipboard(text: string) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text);
  } else {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  }
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fa-IR');
}

export function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getCategoryLabel(val: string) {
  return CATEGORIES.find(c => c.value === val)?.label || val;
}

export function getPlanLabel(plan: string) {
  return plan === 'starter' ? 'استارتر' : plan === 'pro' ? 'حرفه‌ای' : 'تجاری';
}

export function formatNumber(num: number) {
  return num.toLocaleString('fa-IR');
}

export function getPlanColor(plan: string) {
  switch (plan) {
    case 'pro': return 'from-violet-400 to-violet-600';
    case 'business': return 'from-amber-400 to-orange-500';
    default: return 'from-gray-400 to-gray-600';
  }
}

export function getPlanBadgeClass(plan: string) {
  switch (plan) {
    case 'pro': return 'bg-violet-100 text-violet-700 border-violet-200';
    case 'business': return 'bg-amber-100 text-amber-700 border-amber-200';
    default: return 'bg-gray-100 text-gray-600';
  }
}

export function getDaysRemaining(endDate: string | null | undefined): number {
  if (!endDate) return 0;
  const end = new Date(endDate);
  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'همین الان';
  if (diffMins < 60) return `${diffMins} دقیقه پیش`;
  if (diffHours < 24) return `${diffHours} ساعت پیش`;
  if (diffDays < 7) return `${diffDays} روز پیش`;
  return formatDate(dateStr);
}
