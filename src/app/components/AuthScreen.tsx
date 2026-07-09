'use client';

import React, { useState, useMemo } from 'react';
import {
  Sparkles, Mail, Lock, User, Eye, EyeOff, RefreshCw,
  MessageSquare, Hash, Zap, TrendingUp, FileText, Check,
  ArrowRight, AlertCircle, CheckCircle2, XCircle, KeyRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { User as UserType } from './shared/types';
import { saveAuth } from './shared/helpers';

// ====== OTP/Phone imports - re-enable when activating OTP features ======
// import { Phone, MessageCircle, Timer, ShieldCheck } from 'lucide-react';

interface AuthScreenProps {
  onLogin: (user: UserType) => void;
}

const FEATURES = [
  { icon: MessageSquare, title: 'کپشن اینستاگرام', desc: 'کپشن‌های فروشی حرفه‌ای' },
  { icon: FileText, title: 'استوری ۵ اسلایدی', desc: 'استوری‌های جذاب و کامل' },
  { icon: Zap, title: 'اسکریپت ریلز', desc: 'سناریو ویدیو با قلاب و CTA' },
  { icon: TrendingUp, title: 'متن تبلیغاتی', desc: 'تبلیغ کوتاه و بلند' },
  { icon: Hash, title: 'هشتگ هدفمند', desc: 'هشتگ‌های مرتبط فارسی' },
  { icon: Sparkles, title: 'صدای برند', desc: 'لحن اختصاصی کسب‌وکار' },
];

// Password strength checker
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

type AuthMode = 'login' | 'register' | 'forgot-password' | 'reset-password';
// ====== OTP modes - re-enable when SMS/email OTP is activated ======
// | 'otp-email-login' | 'otp-email-register' | 'otp-phone-login' | 'otp-phone-register'
// | 'otp-verify'

export default function AuthScreen({ onLogin }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // ====== OTP state variables - re-enable when activating OTP features ======
  // const [phone, setPhone] = useState('');
  // const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  // const [otpTarget, setOtpTarget] = useState('');
  // const [otpType, setOtpType] = useState('');
  // const [otpExpiry, setOtpExpiry] = useState(0);
  // const [otpCountdown, setOtpCountdown] = useState(0);
  // const [canResend, setCanResend] = useState(false);
  // const [devOtpCode, setDevOtpCode] = useState('');
  // const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { toast } = useToast();
  const passwordStrength = useMemo(() => checkPasswordStrength(password), [password]);

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError('');
    setSuccessMessage('');
    if (newMode === 'login') {
      setPassword('');
      setConfirmPassword('');
      setResetToken('');
    }
  };

  // Traditional login/register submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (mode === 'register') {
        if (password !== confirmPassword) {
          setError('رمز عبور و تأیید آن مطابقت ندارند');
          return;
        }
        if (passwordStrength.score < 80) {
          setError('رمز عبور به اندازه کافی قوی نیست. تمام شرایط را رعایت کنید.');
          return;
        }

        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name, password }),
        });
        const data = await res.json();

        if (!res.ok) {
          if (data.passwordErrors) {
            setError('رمز عبور قوی نیست: ' + data.passwordErrors.join('، '));
          } else {
            setError(data.error || 'خطایی رخ داد');
          }
          return;
        }

        if (data.token) {
          saveAuth(data.token, data.user);
        }
        onLogin(data.user);
        toast({ title: 'ثبت‌نام موفق!', description: `خوش آمدید ${data.user.name}` });

      } else if (mode === 'login') {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });
        const data = await res.json();

        if (!res.ok) {
          if (data.locked) {
            setError(data.error);
          } else if (data.remainingAttempts !== undefined) {
            setError(`${data.error} (${data.remainingAttempts} تلاش باقیمانده)`);
          } else {
            setError(data.error || 'خطایی رخ داد');
          }
          return;
        }

        if (data.token) {
          saveAuth(data.token, data.user);
        }
        onLogin(data.user);
        toast({ title: 'ورود موفق!', description: `خوش آمدید ${data.user.name}` });

      } else if (mode === 'forgot-password') {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'خطایی رخ داد');
          return;
        }

        setSuccessMessage(data.message);
        if (data._dev_resetToken) {
          setResetToken(data._dev_resetToken);
          setMode('reset-password');
          setPassword('');
          setConfirmPassword('');
        }

      } else if (mode === 'reset-password') {
        if (password !== confirmPassword) {
          setError('رمز عبور و تأیید آن مطابقت ندارند');
          return;
        }
        if (passwordStrength.score < 80) {
          setError('رمز عبور به اندازه کافی قوی نیست.');
          return;
        }

        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: resetToken, newPassword: password, confirmPassword }),
        });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || 'خطایی رخ داد');
          return;
        }

        setSuccessMessage(data.message);
        setMode('login');
        setPassword('');
        setConfirmPassword('');
        setResetToken('');
        toast({ title: 'رمز عبور بازنشانی شد!', description: 'اکنون می‌توانید وارد حساب خود شوید' });
      }
    } catch {
      setError('خطا در اتصال به سرور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen animated-gradient-bg p-4 relative overflow-hidden">
      {/* Floating shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="floating-shape w-4 h-4 bg-emerald-400/20 top-[15%] right-[10%]" />
        <div className="floating-shape w-6 h-6 bg-violet-400/15 top-[60%] right-[75%]" />
        <div className="floating-shape w-3 h-3 bg-teal-400/20 top-[30%] right-[50%]" />
        <div className="floating-shape w-5 h-5 bg-pink-400/10 top-[75%] right-[25%]" />
        <div className="floating-shape w-4 h-4 bg-cyan-400/15 top-[45%] right-[85%]" />
      </div>

      <div className="max-w-5xl mx-auto flex flex-col lg:flex-row items-center justify-center min-h-screen gap-8 lg:gap-16 relative z-10">
        {/* Feature Showcase - Left side on desktop */}
        <div className="hidden lg:block flex-1 max-w-md">
          <div className="text-left mb-8">
            <h1 className="text-4xl font-extrabold mb-3">
              <span className="gradient-text">محتواسان</span>
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg leading-8">
              تولید محتوای فروشی فارسی با هوش مصنوعی برای کسب‌وکارهای آنلاین ایران
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {FEATURES.map((feature, i) => (
              <div
                key={i}
                className="glass-card rounded-xl p-3 transition-all duration-300 hover:shadow-md"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="flex items-start gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0">
                    <feature.icon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{feature.title}</p>
                    <p className="text-xs text-gray-500">{feature.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Social proof */}
          <div className="mt-6 flex items-center gap-3 px-1">
            <div className="flex -space-x-2 space-x-reverse">
              {['از', 'به', 'رب'].map((c, i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-zinc-800 bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold">
                  {c}
                </div>
              ))}
            </div>
            <div>
              <p className="text-sm font-medium">+۱,۲۰۰ کاربر فعال</p>
              <p className="text-xs text-gray-400">به محتواسان اعتماد کرده‌اند</p>
            </div>
          </div>
        </div>

        {/* Auth Card */}
        <div className="w-full max-w-md">
          {/* Mobile header */}
          <div className="lg:hidden text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-violet-600 shadow-lg shadow-emerald-200/50 mb-3 animate-subtle-bounce overflow-hidden">
              <img src="/logo.svg" alt="محتواسان" className="w-full h-full p-2" />
            </div>
            <h1 className="text-2xl font-bold mb-1">
              <span className="gradient-text">محتواسان</span>
            </h1>
            <p className="text-gray-500 text-sm">تولید محتوای فروشی فارسی با هوش مصنوعی</p>
          </div>

          <div className="glass-card rounded-2xl p-1">
            <div className="rounded-xl overflow-hidden">

              {/* ====== LOGIN / REGISTER / FORGOT-PASSWORD / RESET-PASSWORD MODES ====== */}
              <>
                {/* Tab switcher - only show for login/register */}
                {(mode === 'login' || mode === 'register') && (
                  <div className="p-4 pb-0">
                    <div className="flex bg-gray-100/80 dark:bg-white/5 rounded-xl p-1">
                      <button
                        className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 ${
                          mode === 'login' ? 'bg-white dark:bg-zinc-800 shadow-md text-gray-900 dark:text-white' : 'text-gray-500'
                        }`}
                        onClick={() => switchMode('login')}
                      >
                        ورود
                      </button>
                      <button
                        className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 ${
                          mode === 'register' ? 'bg-white dark:bg-zinc-800 shadow-md text-gray-900 dark:text-white' : 'text-gray-500'
                        }`}
                        onClick={() => switchMode('register')}
                      >
                        ثبت‌نام
                      </button>
                    </div>
                  </div>
                )}

                {/* Forgot Password Header */}
                {mode === 'forgot-password' && (
                  <div className="p-4 pb-0">
                    <button
                      onClick={() => switchMode('login')}
                      className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-2"
                    >
                      <ArrowRight className="h-4 w-4" />
                      بازگشت به ورود
                    </button>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center">
                        <KeyRound className="h-4 w-4 text-white" />
                      </div>
                      <h2 className="text-lg font-bold">فراموشی رمز عبور</h2>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">ایمیل خود را وارد کنید تا لینک بازنشانی ارسال شود</p>
                  </div>
                )}

                {/* Reset Password Header */}
                {mode === 'reset-password' && (
                  <div className="p-4 pb-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                        <Lock className="h-4 w-4 text-white" />
                      </div>
                      <h2 className="text-lg font-bold">بازنشانی رمز عبور</h2>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">رمز عبور جدید خود را وارد کنید</p>
                  </div>
                )}

                {/* Form */}
                <div className="p-4">
                  {successMessage && (
                    <div className="mb-4 text-sm text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-lg border border-emerald-100 dark:border-emerald-800/30 flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>{successMessage}</span>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-3">
                    {/* Name field - register only */}
                    {mode === 'register' && (
                      <div className="space-y-1.5">
                        <Label htmlFor="name" className="text-sm">نام</Label>
                        <div className="relative">
                          <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="name"
                            placeholder="نام شما"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="pr-10 input-glow transition-all h-10"
                            required={mode === 'register'}
                          />
                        </div>
                      </div>
                    )}

                    {/* Email field - login, register, forgot-password */}
                    {(mode === 'login' || mode === 'register' || mode === 'forgot-password') && (
                      <div className="space-y-1.5">
                        <Label htmlFor="email" className="text-sm">ایمیل</Label>
                        <div className="relative">
                          <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="email"
                            type="email"
                            placeholder="example@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pr-10 input-glow transition-all h-10"
                            dir="ltr"
                            required
                          />
                        </div>
                      </div>
                    )}

                    {/* Password field */}
                    {(mode === 'login' || mode === 'register' || mode === 'reset-password') && (
                      <div className="space-y-1.5">
                        <Label htmlFor="password" className="text-sm">
                          {mode === 'reset-password' ? 'رمز عبور جدید' : 'رمز عبور'}
                        </Label>
                        <div className="relative">
                          <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder={mode === 'reset-password' ? 'رمز عبور جدید' : 'رمز عبور'}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pr-10 pl-10 input-glow transition-all h-10"
                            dir="ltr"
                            required
                          />
                          <button
                            type="button"
                            className="absolute left-3 top-1/2 -translate-y-1/2"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                          </button>
                        </div>

                        {/* Password strength indicator - register & reset */}
                        {(mode === 'register' || mode === 'reset-password') && password.length > 0 && (
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
                    )}

                    {/* Confirm Password */}
                    {(mode === 'register' || mode === 'reset-password') && (
                      <div className="space-y-1.5">
                        <Label htmlFor="confirmPassword" className="text-sm">تأیید رمز عبور</Label>
                        <div className="relative">
                          <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            id="confirmPassword"
                            type={showConfirmPassword ? 'text' : 'password'}
                            placeholder="تکرار رمز عبور"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="pr-10 pl-10 input-glow transition-all h-10"
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
                        {confirmPassword && password && confirmPassword !== password && (
                          <p className="text-xs text-red-500 flex items-center gap-1">
                            <XCircle className="h-3 w-3" />
                            رمز عبور مطابقت ندارد
                          </p>
                        )}
                        {confirmPassword && password && confirmPassword === password && (
                          <p className="text-xs text-emerald-500 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            رمز عبور مطابقت دارد
                          </p>
                        )}
                      </div>
                    )}

                    {error && (
                      <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-800/30 flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}

                    {/* Submit button */}
                    <Button
                      type="submit"
                      className="w-full btn-gradient text-white h-11 font-medium"
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          لطفاً صبر کنید...
                        </span>
                      ) : mode === 'login' ? 'ورود' :
                        mode === 'register' ? 'ثبت‌نام' :
                        mode === 'forgot-password' ? 'ارسال لینک بازنشانی' :
                        'بازنشانی رمز عبور'}
                    </Button>
                  </form>

                  {/* ====== Login extras ====== */}
                  {mode === 'login' && (
                    <div className="mt-3 text-center">
                      <button
                        onClick={() => switchMode('forgot-password')}
                        className="text-sm text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors"
                      >
                        رمز عبور خود را فراموش کرده‌اید؟
                      </button>
                    </div>
                  )}

                  {/* ====== Register extras ====== */}
                  {mode === 'register' && (
                    <div className="mt-4 p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100/50 dark:border-emerald-800/20">
                      <p className="text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5" />
                        طرح استارتر رایگان - بدون نیاز به کارت بانکی
                      </p>
                    </div>
                  )}
                </div>
              </>

              {/* ====== OTP & Phone modes are DISABLED ======
                  To re-enable when SMS/email OTP is activated, add back these sections:
                  1. OTP verify mode rendering (renderOtpVerify)
                  2. Phone login mode (otp-phone-login)
                  3. Phone register mode (otp-phone-register)
                  4. OTP login buttons in login section
                  5. OTP register buttons in register section
                  6. OTP state variables and functions
              ====== END DISABLED ====== */}

            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-4">
            مناسب فروشندگان اینستاگرامی، واتساپی و فروشگاه‌های آنلاین
          </p>
        </div>
      </div>
    </div>
  );
}
