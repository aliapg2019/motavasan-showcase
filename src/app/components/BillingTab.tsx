'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard, Check, AlertTriangle, RefreshCw, ChevronDown,
  ChevronUp, Calendar, Activity, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { User as UserType, UsageData, Plan, SubscriptionDetail, Invoice } from './shared/types';
import { authFetch, saveAuth, getPlanLabel, formatDate, formatNumber, getDaysRemaining } from './shared/helpers';
import { FEATURE_COMPARISON, BILLING_FAQ } from './shared/constants';
import { useToast } from '@/hooks/use-toast';

interface BillingTabProps {
  user: User;
  usage: UsageData | null;
  onUserUpdate: (user: UserType) => void;
}

export default function BillingTab({ user, usage, onUserUpdate }: BillingTabProps) {
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [upgrading, setUpgrading] = useState(false);
  const [confirmPlan, setConfirmPlan] = useState<string | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionDetail | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [showComparison, setShowComparison] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    fetch('/api/billing/plans').then(r => r.json()).then(d => setPlans(d.plans || []));
    // Fetch subscription details
    authFetch('/api/subscription/detail').then(r => {
      if (r.ok) return r.json();
      return null;
    }).then(data => {
      if (data) setSubscription(data);
    }).catch(() => {});

    // Simulated invoices
    if (user.plan !== 'starter') {
      const now = new Date();
      setInvoices([
        { id: '1', planName: getPlanLabel(user.plan), amount: user.plan === 'pro' ? 149000 : 399000, date: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(), status: 'paid' },
        { id: '2', planName: 'استارتر', amount: 0, date: new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString(), status: 'paid' },
      ]);
    }
  }, [user.plan]);

  const handleUpgrade = async (planId: string) => {
    setUpgrading(true);
    try {
      const res = await authFetch('/api/subscriptions/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: 'خطا', description: data.error || 'خطا در ارتقا', variant: 'destructive' });
        return;
      }
      saveAuth(data.token, data.user);
      onUserUpdate(data.user);
      setConfirmPlan(null);
      toast({ title: 'ارتقا موفق!', description: `طرح شما به ${getPlanLabel(planId)} ارتقا یافت` });
    } catch {
      toast({ title: 'خطا', description: 'خطا در اتصال به سرور', variant: 'destructive' });
    } finally {
      setUpgrading(false);
    }
  };

  const handleCancel = async () => {
    setUpgrading(true);
    try {
      const res = await authFetch('/api/subscriptions/cancel', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        toast({ title: 'خطا', description: data.error || 'خطا در لغو', variant: 'destructive' });
        return;
      }
      saveAuth(data.token, data.user);
      onUserUpdate(data.user);
      setShowCancelDialog(false);
      toast({ title: 'اشتراک لغو شد', description: 'طرح شما به استارتر برگشت' });
    } catch {
      toast({ title: 'خطا', description: 'خطا در اتصال به سرور', variant: 'destructive' });
    } finally {
      setUpgrading(false);
    }
  };

  const dailyLimit = usage?.plan === 'starter' ? 5 : usage?.plan === 'pro' ? 50 : -1;
  const usagePercent = dailyLimit > 0 ? ((usage?.todayUsage || 0) / dailyLimit) * 100 : 0;
  const daysRemaining = getDaysRemaining(subscription?.endDate);
  const yearlyDiscount = 0.2;

  const getPriceDisplay = (plan: Plan) => {
    if (plan.priceNum === 0) return plan.price;
    if (billingPeriod === 'yearly') {
      const yearly = Math.round(plan.priceNum * 12 * (1 - yearlyDiscount));
      return `${formatNumber(yearly)} تومان/سال`;
    }
    return plan.price;
  };

  return (
    <div className="space-y-6">
      {/* Current Plan Status */}
      <div className="glass-card rounded-2xl">
        <CardContent className="p-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center shadow-lg">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">طرح فعلی شما</p>
                <div className="flex items-center gap-2">
                  <p className="text-xl font-bold gradient-text">{getPlanLabel(user.plan)}</p>
                  {user.plan !== 'starter' && (
                    <Badge className="bg-gradient-to-l from-emerald-500 to-teal-500 text-white border-0 text-[10px]">فعال</Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              {/* Usage stats */}
              {dailyLimit > 0 && (
                <div className="text-center">
                  <p className="text-[10px] text-gray-400 mb-1">استفاده امروز</p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold">{usage?.todayUsage || 0} / {dailyLimit}</span>
                  </div>
                  <Progress value={Math.min(usagePercent, 100)} className="h-1.5 w-20 mt-1" />
                </div>
              )}
              {subscription && daysRemaining > 0 && (
                <div className="text-center">
                  <p className="text-[10px] text-gray-400 mb-1">روز باقیمانده</p>
                  <span className="text-sm font-bold">{formatNumber(daysRemaining)} روز</span>
                </div>
              )}
              {user.plan !== 'starter' && (
                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-900/10 h-8 text-xs" onClick={() => setShowCancelDialog(true)}>
                  لغو اشتراک
                </Button>
              )}
            </div>
          </div>

          {/* Subscription details row */}
          {subscription && (
            <>
              <Separator className="my-4" />
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-[10px] text-gray-400">تاریخ شروع</p>
                  <p className="text-xs font-medium mt-0.5">{formatDate(subscription.startDate)}</p>
                </div>
                {subscription.endDate && (
                  <div>
                    <p className="text-[10px] text-gray-400">تاریخ اتمام</p>
                    <p className="text-xs font-medium mt-0.5">{formatDate(subscription.endDate)}</p>
                  </div>
                )}
                <div>
                  <p className="text-[10px] text-gray-400">وضعیت</p>
                  <Badge variant="outline" className="text-[10px] mt-0.5 text-emerald-600">
                    {subscription.status === 'active' ? 'فعال' : 'لغو شده'}
                  </Badge>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400">صورت‌حساب بعدی</p>
                  <p className="text-xs font-medium mt-0.5">
                    {subscription.endDate ? formatDate(subscription.endDate) : '-'}
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </div>

      {/* Billing Period Toggle */}
      <div className="flex items-center justify-center gap-3">
        <span className={`text-sm ${billingPeriod === 'monthly' ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-500'}`}>ماهانه</span>
        <button
          onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
          className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${billingPeriod === 'yearly' ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}
        >
          <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200 ${billingPeriod === 'yearly' ? 'left-0.5' : 'right-0.5'}`} />
        </button>
        <span className={`text-sm ${billingPeriod === 'yearly' ? 'font-semibold text-gray-900 dark:text-white' : 'text-gray-500'}`}>
          سالانه
          <Badge className="mr-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-[9px] border-0">۲۰٪ تخفیف</Badge>
        </span>
      </div>

      {/* Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map(plan => {
          const isCurrent = user.plan === plan.id;
          return (
            <div key={plan.id} className={`relative rounded-2xl overflow-hidden transition-all duration-300 ${plan.popular ? 'scale-[1.02]' : ''}`}>
              {plan.popular && (
                <div className="absolute -top-0 left-0 right-0 h-1 popular-badge" />
              )}
              <div className={`glass-card rounded-2xl h-full flex flex-col ${plan.popular ? 'border-violet-200/50 dark:border-violet-700/30' : ''} ${isCurrent ? 'ring-2 ring-emerald-400' : ''}`}>
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <Badge className="popular-badge text-white border-0 shadow-lg shadow-violet-200/50 px-3 text-[10px]">محبوب‌ترین</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2 pt-6">
                  <CardTitle className="text-base">{plan.name}</CardTitle>
                  <p className="text-xl font-bold gradient-text-premium mt-1">{getPriceDisplay(plan)}</p>
                  {billingPeriod === 'yearly' && plan.priceNum > 0 && (
                    <p className="text-[10px] text-gray-400 line-through">{plan.price}</p>
                  )}
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-2">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0">
                          <Check className="h-2.5 w-2.5 text-white" />
                        </div>
                        {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="pt-2 pb-4">
                  {isCurrent ? (
                    <Button className="w-full bg-gray-100 dark:bg-white/5 text-gray-500 cursor-default" variant="outline" disabled>
                      <Check className="h-4 w-4 ml-1" />
                      طرح فعلی
                    </Button>
                  ) : (
                    <Button
                      className={`w-full font-medium text-sm ${plan.popular ? 'btn-gradient text-white' : 'bg-gray-900 hover:bg-gray-800 text-white dark:bg-white dark:text-gray-900 dark:hover:bg-gray-100'}`}
                      onClick={() => setConfirmPlan(plan.id)}
                      disabled={upgrading}
                    >
                      ارتقا به {plan.name}
                    </Button>
                  )}
                </CardFooter>
              </div>
            </div>
          );
        })}
      </div>

      {/* Feature Comparison */}
      <div>
        <button
          onClick={() => setShowComparison(!showComparison)}
          className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          مقایسه کامل ویژگی‌ها
          {showComparison ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
        {showComparison && (
          <div className="mt-3 glass-card rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/3">
                    <th className="text-right p-3 font-medium text-gray-500 min-w-[140px]">ویژگی</th>
                    <th className="text-center p-3 font-medium text-gray-500">استارتر</th>
                    <th className="text-center p-3 font-medium text-violet-600">حرفه‌ای</th>
                    <th className="text-center p-3 font-medium text-amber-600">تجاری</th>
                  </tr>
                </thead>
                <tbody>
                  {FEATURE_COMPARISON.map((row, i) => (
                    <tr key={i} className="border-b border-gray-50 dark:border-white/3 last:border-0">
                      <td className="p-3 font-medium text-xs">{row.feature}</td>
                      <td className="p-3 text-center text-xs">
                        {typeof row.starter === 'boolean' ? (
                          row.starter ? <Check className="h-4 w-4 text-emerald-500 mx-auto" /> : <span className="text-gray-300">—</span>
                        ) : row.starter}
                      </td>
                      <td className="p-3 text-center text-xs bg-violet-50/30 dark:bg-violet-900/5">
                        {typeof row.pro === 'boolean' ? (
                          row.pro ? <Check className="h-4 w-4 text-emerald-500 mx-auto" /> : <span className="text-gray-300">—</span>
                        ) : row.pro}
                      </td>
                      <td className="p-3 text-center text-xs bg-amber-50/30 dark:bg-amber-900/5">
                        {typeof row.business === 'boolean' ? (
                          row.business ? <Check className="h-4 w-4 text-emerald-500 mx-auto" /> : <span className="text-gray-300">—</span>
                        ) : row.business}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Invoice History */}
      {invoices.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            تاریخچه صورت‌حساب
          </h3>
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/3">
                    <th className="text-right p-3 font-medium text-gray-500">طرح</th>
                    <th className="text-right p-3 font-medium text-gray-500">مبلغ</th>
                    <th className="text-right p-3 font-medium text-gray-500">تاریخ</th>
                    <th className="text-right p-3 font-medium text-gray-500">وضعیت</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(inv => (
                    <tr key={inv.id} className="border-b border-gray-50 dark:border-white/3 last:border-0">
                      <td className="p-3 font-medium text-xs">{inv.planName}</td>
                      <td className="p-3 text-xs">{inv.amount > 0 ? `${formatNumber(inv.amount)} تومان` : 'رایگان'}</td>
                      <td className="p-3 text-xs text-gray-500">{formatDate(inv.date)}</td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-200">
                          {inv.status === 'paid' ? 'پرداخت شده' : 'در انتظار'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* FAQ */}
      <div>
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">سوالات متداول</h3>
        <div className="space-y-2">
          {BILLING_FAQ.map((faq, i) => (
            <div key={i} className="glass-card rounded-xl overflow-hidden">
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                className="w-full p-4 flex items-center justify-between text-right"
              >
                <span className="text-sm font-medium">{faq.q}</span>
                {openFaq === i ? <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" /> : <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />}
              </button>
              {openFaq === i && (
                <div className="px-4 pb-4 text-sm text-gray-500 dark:text-gray-400 leading-7">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Upgrade Confirmation Dialog */}
      <Dialog open={!!confirmPlan} onOpenChange={() => setConfirmPlan(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تایید ارتقا طرح</DialogTitle>
            <DialogDescription>
              آیا مطمئن هستید که می‌خواهید طرح خود را به {confirmPlan && getPlanLabel(confirmPlan)} ارتقا دهید؟
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmPlan(null)}>انصراف</Button>
            <Button className="btn-gradient text-white" onClick={() => confirmPlan && handleUpgrade(confirmPlan)} disabled={upgrading}>
              {upgrading ? <RefreshCw className="h-4 w-4 animate-spin ml-2" /> : null}
              تایید ارتقا
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              لغو اشتراک
            </DialogTitle>
            <DialogDescription>
              آیا مطمئن هستید؟ با لغو اشتراک، طرح شما به استارتر برگردانده می‌شود و دسترسی به امکانات حرفه‌ای از بین می‌رود.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>انصراف</Button>
            <Button variant="destructive" onClick={handleCancel} disabled={upgrading}>
              {upgrading ? <RefreshCw className="h-4 w-4 animate-spin ml-2" /> : null}
              لغو اشتراک
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
