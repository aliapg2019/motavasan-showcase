'use client';

import React, { useState, useMemo } from 'react';
import { Lock, Eye, EyeOff, RefreshCw, CheckCircle2, XCircle, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { authFetch } from './shared/helpers';

function checkPasswordStrength(password: string) {
  const checks = [
    { label: 'حداقل ۸ کاراکتر', test: password.length >= 8 },
    { label: 'حرف بزرگ انگلیسی', test: /[A-Z]/.test(password) },
    { label: 'حرف کوچک انگلیسی', test: /[a-z]/.test(password) },
    { label: 'عدد', test: /[0-9]/.test(password) },
    { label: 'نماد خاص (!@#$%...)', test: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) },
  ];
  const passed = checks.filter(c => c.test).length;
  const score = (passed / checks.length) * 100;
  let level = 'خیلی ضعیف';
  let color = 'bg-red-500';
  if (score >= 80) { level = 'قوی'; color = 'bg-emerald-500'; }
  else if (score >= 60) { level = 'متوسط'; color = 'bg-amber-500'; }
  else if (score >= 40) { level = 'ضعیف'; color = 'bg-orange-500'; }
  return { checks, passed, score, level, color };
}

export default function ChangePasswordTab() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { toast } = useToast();

  const passwordStrength = useMemo(() => checkPasswordStrength(newPassword), [newPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Client-side validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('تمام فیلدها الزامی است');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('رمز عبور جدید و تأیید آن مطابقت ندارند');
      return;
    }

    if (passwordStrength.score < 80) {
      setError('رمز عبور جدید به اندازه کافی قوی نیست. تمام شرایط را رعایت کنید.');
      return;
    }

    setLoading(true);

    try {
      const res = await authFetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'خطایی رخ داد');
        return;
      }

      setSuccess(data.message || 'رمز عبور با موفقیت تغییر کرد');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast({ title: 'رمز عبور تغییر کرد!', description: 'رمز عبور شما با موفقیت به‌روزرسانی شد' });
    } catch {
      setError('خطا در اتصال به سرور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-200/30 dark:shadow-violet-900/30">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div>
          <h2 className="text-lg font-bold">تغییر رمز عبور</h2>
          <p className="text-sm text-gray-500">رمز عبور خود را برای امنیت بیشتر به‌روز کنید</p>
        </div>
      </div>

      {/* Form */}
      <div className="glass-card rounded-2xl p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Password */}
          <div className="space-y-1.5">
            <Label htmlFor="currentPassword">رمز عبور فعلی</Label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                placeholder="رمز عبور فعلی خود را وارد کنید"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="pr-10 pl-10 input-glow h-10"
                dir="ltr"
                required
              />
              <button
                type="button"
                className="absolute left-3 top-1/2 -translate-y-1/2"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-1.5">
            <Label htmlFor="newPassword">رمز عبور جدید</Label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                placeholder="رمز عبور جدید"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pr-10 pl-10 input-glow h-10"
                dir="ltr"
                required
              />
              <button
                type="button"
                className="absolute left-3 top-1/2 -translate-y-1/2"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
              </button>
            </div>

            {/* Strength indicator */}
            {newPassword.length > 0 && (
              <div className="space-y-2 mt-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color}`}
                      style={{ width: `${passwordStrength.score}%` }}
                    />
                  </div>
                  <span className={`text-xs font-medium ${
                    passwordStrength.score >= 80 ? 'text-emerald-600' :
                    passwordStrength.score >= 60 ? 'text-amber-600' :
                    passwordStrength.score >= 40 ? 'text-orange-600' : 'text-red-600'
                  }`}>
                    {passwordStrength.level}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {passwordStrength.checks.map((check, i) => (
                    <div key={i} className="flex items-center gap-1 text-[11px]">
                      {check.test ? (
                        <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                      ) : (
                        <XCircle className="h-3 w-3 text-gray-300 dark:text-gray-600 shrink-0" />
                      )}
                      <span className={check.test ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400'}>
                        {check.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm New Password */}
          <div className="space-y-1.5">
            <Label htmlFor="confirmNewPassword">تأیید رمز عبور جدید</Label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="confirmNewPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="تکرار رمز عبور جدید"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pr-10 pl-10 input-glow h-10"
                dir="ltr"
                required
              />
              <button
                type="button"
                className="absolute left-3 top-1/2 -translate-y-1/2"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
              </button>
            </div>
            {confirmPassword && newPassword && confirmPassword !== newPassword && (
              <p className="text-xs text-red-500 flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                رمز عبور مطابقت ندارد
              </p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-800/30">
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="text-sm text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-100 dark:border-emerald-800/30 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {success}
            </div>
          )}

          {/* Submit */}
          <Button
            type="submit"
            className="w-full btn-gradient text-white h-11 font-medium"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                در حال تغییر رمز عبور...
              </span>
            ) : 'تغییر رمز عبور'}
          </Button>
        </form>

        {/* Security tips */}
        <div className="mt-5 p-3 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100/50 dark:border-amber-800/20">
          <p className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-1.5">نکات امنیتی:</p>
          <ul className="text-xs text-amber-600/80 dark:text-amber-400/80 space-y-1">
            <li>- از رمز عبور یکسان در چند سایت استفاده نکنید</li>
            <li>- رمز عبور خود را دوره‌ای تغییر دهید</li>
            <li>- رمز عبور خود را با هیچ‌کس به اشتراک نگذارید</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
