'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare, Send, Clock, CheckCircle, Plus, RefreshCw,
  HelpCircle, Mail, ChevronDown, ChevronUp, AlertCircle
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
import { authFetch, formatDate, getRelativeTime } from './shared/helpers';
import { useToast } from '@/hooks/use-toast';

interface SupportMessage {
  id: string;
  subject: string;
  message: string;
  category: string;
  status: string;
  reply: string | null;
  repliedAt: string | null;
  createdAt: string;
}

const SUPPORT_CATEGORIES = [
  { value: 'general', label: 'عمومی' },
  { value: 'technical', label: 'مشکل فنی' },
  { value: 'billing', label: 'مالی و اشتراک' },
  { value: 'feature_request', label: 'درخواست ویژگی' },
  { value: 'bug_report', label: 'گزارش خطا' },
];

const FAQ_ITEMS = [
  {
    q: 'چگونه محتوای جدید تولید کنم؟',
    a: 'از بخش «تولید محتوا» در منوی کناری، اطلاعات محصول خود را وارد کنید و روی دکمه تولید کلیک کنید. هوش مصنوعی به صورت خودکار محتوای مناسب را تولید می‌کند.',
  },
  {
    q: 'محدودیت تولید محتوای من چقدر است؟',
    a: 'طرح استارتر: ۵ تولید در روز، طرح حرفه‌ای: ۵۰ تولید در روز، طرح تجاری: نامحدود. می‌توانید از بخش اشتراک طرح خود را ارتقا دهید.',
  },
  {
    q: 'صدای برند چیست و چگونه کار می‌کند؟',
    a: 'صدای برند به شما اجازه می‌دهد لحن، رسمیت و سبک محتوای تولیدی را شخصی‌سازی کنید. از بخش «صدای برند» می‌توانید پروفایل‌های مختلف بسازید.',
  },
  {
    q: 'آیا می‌توانم طرح اشتراک را تغییر دهم؟',
    a: 'بله، در هر زمانی از بخش «اشتراک» می‌توانید طرح خود را ارتقا یا تنزل دهید.',
  },
  {
    q: 'حالت پیشرفته چیست؟',
    a: 'حالت پیشرفته امکانات اضافه‌ای مثل تعیین احساسات، مزیت رقابتی، استراتژی داستان‌سرایی و کلمات کلیدی سئو را فراهم می‌کند. کاربران طرح رایگان فقط یک بار می‌توانند از آن استفاده کنند.',
  },
  {
    q: 'چگونه از پشتیبانی کمک بگیرم؟',
    a: 'همینجا روی دکمه «ارسال پیام جدید» کلیک کنید و موضوع و توضیح مشکل خود را بنویسید. تیم پشتیبانی در اسرع وقت پاسخ خواهد داد.',
  },
];

export default function SupportTab() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  // New message form
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('general');

  // FAQ
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const fetchMessages = useCallback(() => {
    setLoading(true);
    authFetch('/api/support')
      .then(r => r.json())
      .then(data => {
        setMessages(data.messages || []);
        setLoading(false);
      })
      .catch(() => {
        toast({ title: 'خطا در بارگذاری پیام‌ها', variant: 'destructive' });
        setLoading(false);
      });
  }, [toast]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const handleSend = async () => {
    if (!subject.trim() || !message.trim()) {
      toast({ title: 'موضوع و پیام الزامی است', variant: 'destructive' });
      return;
    }
    setSending(true);
    try {
      const res = await authFetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message, category }),
      });
      if (res.ok) {
        toast({ title: 'پیام شما ارسال شد!', description: 'تیم پشتیبانی در اسرع وقت پاسخ خواهد داد.' });
        setShowNewMessage(false);
        setSubject('');
        setMessage('');
        setCategory('general');
        fetchMessages();
      } else {
        const data = await res.json();
        toast({ title: 'خطا', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'خطا در ارسال پیام', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open': return <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px]">در انتظار بررسی</Badge>;
      case 'in_progress': return <Badge className="bg-blue-100 text-blue-700 border-0 text-[10px]">در حال بررسی</Badge>;
      case 'replied': return <Badge className="bg-emerald-100 text-emerald-700 border-0 text-[10px]">پاسخ داده شده</Badge>;
      case 'closed': return <Badge className="bg-gray-100 text-gray-600 border-0 text-[10px]">بسته شده</Badge>;
      default: return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
    }
  };

  const getCategoryLabel = (cat: string) => {
    return SUPPORT_CATEGORIES.find(c => c.value === cat)?.label || cat;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg">
            <MessageSquare className="h-4.5 w-4.5 text-white" />
          </div>
          <div>
            <h2 className="text-base font-bold">راهنما و پشتیبانی</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">سوالات متداول و ارسال تیکت پشتیبانی</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={fetchMessages} size="icon" className="h-9 w-9 shrink-0">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => setShowNewMessage(true)} className="btn-gradient text-white h-9 text-sm gap-1.5">
            <Send className="h-3.5 w-3.5" />
            ارسال پیام جدید
          </Button>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="glass-card rounded-xl">
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <HelpCircle className="h-4 w-4 text-cyan-500" />
            سوالات متداول
          </h3>
          <div className="space-y-2">
            {FAQ_ITEMS.map((faq, i) => (
              <div key={i} className="rounded-xl border border-gray-100 dark:border-white/5 overflow-hidden">
                <button
                  onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-3 text-right hover:bg-gray-50 dark:hover:bg-white/3 transition-colors"
                >
                  <span className="text-sm font-medium">{faq.q}</span>
                  {expandedFaq === i ? (
                    <ChevronUp className="h-4 w-4 text-gray-400 shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400 shrink-0" />
                  )}
                </button>
                {expandedFaq === i && (
                  <div className="px-3 pb-3 pt-0">
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-6">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </div>

      {/* Tickets Section */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Mail className="h-4 w-4 text-violet-500" />
            تیکت‌های پشتیبانی
            {messages.filter(m => m.status === 'open').length > 0 && (
              <Badge className="bg-amber-100 text-amber-700 border-0 text-[10px]">
                {messages.filter(m => m.status === 'open').length} باز
              </Badge>
            )}
          </h3>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full rounded-xl shimmer" />)}
          </div>
        ) : messages.length === 0 ? (
          <div className="glass-card rounded-xl p-8 text-center">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">هنوز تیکتی ارسال نکرده‌اید</p>
            <p className="text-xs text-gray-400 mt-1">اگر سوال یا مشکلی دارید، روی دکمه «ارسال پیام جدید» کلیک کنید</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map(msg => (
              <div key={msg.id} className="glass-card rounded-xl overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        {getStatusBadge(msg.status)}
                        <Badge variant="outline" className="text-[10px]">{getCategoryLabel(msg.category)}</Badge>
                        <span className="text-[10px] text-gray-400">{getRelativeTime(msg.createdAt)}</span>
                      </div>
                      <h4
                        className="text-sm font-medium mb-1 cursor-pointer hover:text-emerald-600 transition-colors"
                        onClick={() => setExpandedId(expandedId === msg.id ? null : msg.id)}
                      >
                        {msg.subject}
                      </h4>
                      {(expandedId === msg.id || !msg.reply) && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-5">{msg.message}</p>
                      )}
                    </div>
                    <button
                      onClick={() => setExpandedId(expandedId === msg.id ? null : msg.id)}
                      className="shrink-0 p-1 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
                    >
                      {expandedId === msg.id ? (
                        <ChevronUp className="h-4 w-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>

                  {/* Reply from support */}
                  {msg.reply && expandedId === msg.id && (
                    <div className="mt-3 p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <CheckCircle className="h-3 w-3 text-emerald-500" />
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">پاسخ پشتیبانی</span>
                        {msg.repliedAt && (
                          <span className="text-[9px] text-gray-400 mr-2">{formatDate(msg.repliedAt)}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-300 leading-5">{msg.reply}</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Message Dialog */}
      <Dialog open={showNewMessage} onOpenChange={setShowNewMessage}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-cyan-500" />
              ارسال تیکت پشتیبانی
            </DialogTitle>
            <DialogDescription>
              مشکل یا سوال خود را شرح دهید تا تیم پشتیبانی پاسخ دهد.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">دسته‌بندی</label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORT_CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">موضوع</label>
              <Input
                placeholder="مثلاً: مشکل در تولید محتوا"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="h-9"
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-1.5 block">توضیحات</label>
              <Textarea
                placeholder="مشکل یا سوال خود را به طور کامل شرح دهید..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowNewMessage(false)} className="h-9">
              انصراف
            </Button>
            <Button onClick={handleSend} disabled={sending || !subject.trim() || !message.trim()} className="btn-gradient text-white h-9 gap-1.5">
              {sending ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              ارسال پیام
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
