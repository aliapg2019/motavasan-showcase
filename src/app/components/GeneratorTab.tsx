'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles, RefreshCw, Copy, Download, MessageSquare, FileText,
  Zap, TrendingUp, Hash, AlertTriangle, ChevronLeft, ChevronRight,
  Wand2, Sliders, Crown, Lock, Star, Target, Lightbulb, PenTool,
  BookOpen, Mic, Layers, Globe, Check
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  CardContent, CardDescription, CardHeader, CardTitle
} from '@/components/ui/card';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { User as UserType, UsageData, GeneratedContent, Template, BrandProfile } from './shared/types';
import { authFetch, copyToClipboard, getCategoryLabel, formatNumber, getPlanLabel } from './shared/helpers';
import { CATEGORIES, TONES, GOALS, TEMPLATE_TYPES } from './shared/constants';
import { useToast } from '@/hooks/use-toast';

// Plan limits configuration
const PLAN_LIMITS: Record<string, { daily: number; advanced: boolean; advancedFreeUses: number; label: string }> = {
  starter: { daily: 5, advanced: false, advancedFreeUses: 1, label: 'استارتر' },
  pro: { daily: 50, advanced: true, advancedFreeUses: -1, label: 'حرفه‌ای' },
  business: { daily: -1, advanced: true, advancedFreeUses: -1, label: 'تجاری' },
};

// Advanced options
const ADVANCED_TONES = [
  { value: 'formal', label: 'رسمی' },
  { value: 'informal', label: 'غیررسمی' },
  { value: 'luxury', label: 'لوکس' },
  { value: 'friendly', label: 'دوستانه' },
  { value: 'aggressive', label: 'تهاجمی' },
  { value: 'persuasive', label: 'متقاعدکننده' },
  { value: 'educational', label: 'آموزشی' },
  { value: 'emotional', label: 'احساسی' },
  { value: 'humorous', label: 'طنز' },
];

const ADVANCED_GOALS = [
  { value: 'sell', label: 'فروش مستقیم' },
  { value: 'inform', label: 'اطلاع‌رسانی' },
  { value: 'promote', label: 'تبلیغ و برندسازی' },
  { value: 'discount', label: 'تخفیف و کمپین' },
  { value: 'engagement', label: 'تعامل و کامنت' },
  { value: 'awareness', label: 'آگاهی از برند' },
  { value: 'loyalty', label: 'حفظ مشتری' },
  { value: 'viral', label: 'ویرال شدن' },
];

const CONTENT_LENGTHS = [
  { value: 'short', label: 'کوتاه (۱-۲ خط)' },
  { value: 'medium', label: 'متوسط (۳-۵ خط)' },
  { value: 'long', label: 'بلند (۶+ خط)' },
];

const PLATFORMS = [
  { value: 'instagram', label: 'اینستاگرام' },
  { value: 'telegram', label: 'تلگرام' },
  { value: 'twitter', label: 'توییتر/ایکس' },
  { value: 'linkedin', label: 'لینکدین' },
  { value: 'whatsapp', label: 'واتساپ' },
  { value: 'all', label: 'همه پلتفرم‌ها' },
];

const CTA_TYPES = [
  { value: 'link', label: 'لینک بایو' },
  { value: 'dm', label: 'دایرکت بده' },
  { value: 'comment', label: 'کامنت بزن' },
  { value: 'call', label: 'تماس بگیر' },
  { value: 'save', label: 'ذخیره کن' },
  { value: 'share', label: 'به اشتراک بگذار' },
  { value: 'follow', label: 'فالو کن' },
];

interface GeneratorTabProps {
  user: User;
  usage: UsageData | null;
  onNavigate: (tab: string) => void;
}

const STEPS = [
  { id: 1, label: 'اطلاعات محصول' },
  { id: 2, label: 'تنظیمات محتوا' },
  { id: 3, label: 'نتیجه' },
];

export default function GeneratorTab({ user, usage, onNavigate }: GeneratorTabProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [brandProfiles, setBrandProfiles] = useState<BrandProfile[]>([]);
  const [result, setResult] = useState<GeneratedContent | null>(null);
  const [generationId, setGenerationId] = useState<string | null>(null);
  const [activeResultTab, setActiveResultTab] = useState('captions');
  const [currentStep, setCurrentStep] = useState(1);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [advancedFreeUsesLeft, setAdvancedFreeUsesLeft] = useState(1);

  // Basic form state
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [audience, setAudience] = useState('');
  const [tone, setTone] = useState('friendly');
  const [goal, setGoal] = useState('sell');
  const [templateType, setTemplateType] = useState('general');
  const [brandProfileId, setBrandProfileId] = useState('');

  // Advanced form state
  const [advancedTone, setAdvancedTone] = useState('');
  const [advancedGoal, setAdvancedGoal] = useState('');
  const [contentLength, setContentLength] = useState('medium');
  const [platform, setPlatform] = useState('instagram');
  const [ctaType, setCtaType] = useState('link');
  const [customInstructions, setCustomInstructions] = useState('');
  const [competitorName, setCompetitorName] = useState('');
  const [uniqueSellingPoint, setUniqueSellingPoint] = useState('');
  const [includeStoryStrategy, setIncludeStoryStrategy] = useState(false);
  const [includeSEOKeywords, setIncludeSEOKeywords] = useState(false);
  const [includeCallToAction, setIncludeCallToAction] = useState(true);
  const [emotionTrigger, setEmotionTrigger] = useState('');
  const [targetScenario, setTargetScenario] = useState('');
  const [hashtagCount, setHashtagCount] = useState('15');
  const [captionCount, setCaptionCount] = useState('3');

  // Plan info
  const planConfig = PLAN_LIMITS[user.plan] || PLAN_LIMITS.starter;
  const dailyLimit = planConfig.daily;
  const usagePercent = dailyLimit > 0 ? ((usage?.todayUsage || 0) / dailyLimit) * 100 : 0;
  const remaining = dailyLimit > 0 ? Math.max(0, dailyLimit - (usage?.todayUsage || 0)) : -1;
  const isAdvancedEnabled = planConfig.advanced || advancedFreeUsesLeft > 0;

  useEffect(() => {
    authFetch('/api/templates').then(r => r.json()).then(d => setTemplates(d.templates || []));
    authFetch('/api/brand-profiles').then(r => r.json()).then(d => setBrandProfiles(d.profiles || []));
    // Load advanced free uses from localStorage
    try {
      const stored = localStorage.getItem(`adv_free_${user.id}`);
      if (stored !== null) {
        setAdvancedFreeUsesLeft(parseInt(stored, 10));
      }
    } catch {}
  }, [user.id]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName || !category) {
      toast({ title: 'خطا', description: 'نام محصول و دسته‌بندی الزامی است', variant: 'destructive' });
      return;
    }

    // Check limit before calling API
    if (dailyLimit > 0 && remaining <= 0) {
      toast({ title: 'محدودیت', description: `محدودیت روزانه طرح ${planConfig.label} تمام شده. لطفاً طرح خود را ارتقا دهید.`, variant: 'destructive' });
      return;
    }

    // Check advanced mode access
    if (showAdvanced && !planConfig.advanced && advancedFreeUsesLeft <= 0) {
      setShowUpgradeDialog(true);
      return;
    }

    setLoading(true);
    setResult(null);
    setCurrentStep(3);
    try {
      const body: Record<string, unknown> = {
        productName,
        category,
        price: price || undefined,
        audience: audience || undefined,
        tone: showAdvanced && advancedTone ? advancedTone : tone,
        goal: showAdvanced && advancedGoal ? advancedGoal : goal,
        templateType,
        brandProfileId: brandProfileId || undefined,
        advanced: showAdvanced,
      };

      // Add advanced parameters
      if (showAdvanced) {
        body.contentLength = contentLength;
        body.platform = platform;
        body.ctaType = ctaType;
        body.customInstructions = customInstructions || undefined;
        body.competitorName = competitorName || undefined;
        body.uniqueSellingPoint = uniqueSellingPoint || undefined;
        body.includeStoryStrategy = includeStoryStrategy;
        body.includeSEOKeywords = includeSEOKeywords;
        body.includeCallToAction = includeCallToAction;
        body.emotionTrigger = emotionTrigger || undefined;
        body.targetScenario = targetScenario || undefined;
        body.hashtagCount = parseInt(hashtagCount, 10) || 15;
        body.captionCount = parseInt(captionCount, 10) || 3;
      }

      // ---- Single server-side call: builds prompt, calls ZAI, persists ----
      const res = await authFetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.limitReached) {
          toast({ title: 'محدودیت', description: data.error, variant: 'destructive' });
        } else {
          toast({ title: 'خطا', description: data.error || 'خطا در تولید محتوا', variant: 'destructive' });
        }
        setCurrentStep(2);
        return;
      }

      setResult(data.result);
      setGenerationId(data.id);

      // Decrement advanced free uses for starter plan
      if (showAdvanced && !planConfig.advanced) {
        const newCount = advancedFreeUsesLeft - 1;
        setAdvancedFreeUsesLeft(newCount);
        try {
          localStorage.setItem(`adv_free_${user.id}`, String(newCount));
        } catch {}
        toast({ title: 'محتوا تولید شد!', description: `شما ${newCount} استفاده رایگان پیشرفته باقیمانده دارید` });
      } else {
        toast({ title: 'محتوا تولید شد!', description: 'محتوای شما با موفقیت آماده شد' });
      }
    } catch {
      toast({ title: 'خطا', description: 'خطا در تولید محتوا', variant: 'destructive' });
      setCurrentStep(2);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    copyToClipboard(text);
    toast({ title: 'کپی شد!', description: `${label} در کلیپ‌بورد کپی شد` });
  };

  const handleExport = () => {
    if (!result) return;
    let text = `محتوای تولید شده برای: ${productName}\nدسته‌بندی: ${getCategoryLabel(category)}\n`;
    if (showAdvanced) text += `پلتفرم: ${PLATFORMS.find(p => p.value === platform)?.label}\n`;
    text += `\n=== کپشن اینستاگرام ===\n`;
    result.captions.forEach((c, i) => { text += `\nکپشن ${i + 1}:\n${c}\n`; });
    text += `\n=== استوری ===\n`;
    result.stories.forEach((s, i) => { text += `اسلاید ${i + 1}: ${s}\n`; });
    text += `\n=== اسکریپت ریلز ===\nقلاب: ${result.reels_script.hook}\nبدنه: ${result.reels_script.body}\nCTA: ${result.reels_script.cta}\n`;
    text += `\n=== تبلیغ ===\nکوتاه: ${result.ads.short}\nبلند: ${result.ads.long}\n`;
    text += `\n=== هشتگ‌ها ===\n${result.hashtags.map(h => `#${h}`).join(' ')}\n`;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `content-${productName}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: 'خروجی دریافت شد!' });
  };

  const resultTabs = [
    { id: 'captions', label: 'کپشن', icon: MessageSquare },
    { id: 'stories', label: 'استوری', icon: FileText },
    { id: 'reels', label: 'ریلز', icon: Zap },
    { id: 'ads', label: 'تبلیغ', icon: TrendingUp },
    { id: 'hashtags', label: 'هشتگ', icon: Hash },
  ];

  return (
    <div className="space-y-5">
      {/* Usage bar */}
      {dailyLimit > 0 && (
        <div className="glass-card rounded-xl">
          <CardContent className="p-3">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-gray-500 dark:text-gray-400">مصرف امروز (طرح {planConfig.label})</span>
              <span className="font-medium">
                {formatNumber(usage?.todayUsage || 0)} از {dailyLimit === -1 ? 'نامحدود' : formatNumber(dailyLimit)}
                {remaining >= 0 && <span className="text-gray-400 mr-1">({formatNumber(remaining)} باقیمانده)</span>}
              </span>
            </div>
            <Progress value={Math.min(usagePercent, 100)} className="h-2" />
          </CardContent>
        </div>
      )}

      {/* Step Progress Indicator */}
      <div className="glass-card rounded-xl">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            {STEPS.map((step, i) => (
              <React.Fragment key={step.id}>
                <button
                  onClick={() => {
                    if (step.id < currentStep || (step.id === 1 && !result)) setCurrentStep(step.id);
                    if (step.id === 3 && result) setCurrentStep(3);
                  }}
                  className={`flex items-center gap-2 transition-all ${
                    currentStep === step.id ? 'opacity-100' : currentStep > step.id ? 'opacity-70' : 'opacity-40'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    currentStep === step.id
                      ? 'bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-md'
                      : currentStep > step.id
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300'
                      : 'bg-gray-100 dark:bg-white/5 text-gray-400'
                  }`}>
                    {currentStep > step.id ? '✓' : step.id}
                  </div>
                  <span className="text-sm font-medium hidden sm:inline">{step.label}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-3 rounded-full transition-all ${
                    currentStep > step.id ? 'bg-emerald-400' : 'bg-gray-200 dark:bg-white/5'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </CardContent>
      </div>

      {/* Step 1: Product Info */}
      {currentStep === 1 && (
        <div className="glass-card rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              اطلاعات محصول
            </CardTitle>
            <CardDescription>مشخصات اصلی محصول خود را وارد کنید</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">نام محصول *</Label>
                <Input
                  placeholder="مثلاً: کرم مرطوب‌کننده روژ"
                  value={productName}
                  onChange={e => setProductName(e.target.value)}
                  className="input-glow transition-all h-10"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">دسته‌بندی *</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger className="input-glow transition-all h-10"><SelectValue placeholder="انتخاب دسته‌بندی" /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">قیمت (تومان)</Label>
                <Input placeholder="مثلاً: ۱۵۰,۰۰۰" value={price} onChange={e => setPrice(e.target.value)} className="input-glow transition-all h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">مخاطب هدف</Label>
                <Input placeholder="مثلاً: زنان ۲۰ تا ۳۵ ساله" value={audience} onChange={e => setAudience(e.target.value)} className="input-glow transition-all h-10" />
              </div>
            </div>

            {/* Advanced Mode Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-l from-violet-50 to-purple-50 dark:from-violet-900/10 dark:to-purple-900/10 border border-violet-200/30 dark:border-violet-700/20">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center">
                  <Wand2 className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium">حالت پیشرفته</p>
                    {!planConfig.advanced && (
                      <Badge variant="outline" className="text-[9px] border-violet-300 text-violet-600 dark:text-violet-400">
                        <Crown className="h-2.5 w-2.5 ml-0.5" />
                        پلن پولی
                      </Badge>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    {!planConfig.advanced
                      ? `${advancedFreeUsesLeft} استفاده رایگان باقیمانده`
                      : 'تنظیمات حرفه‌ای تولید محتوا'}
                  </p>
                </div>
              </div>
              <Switch
                checked={showAdvanced}
                onCheckedChange={(checked) => {
                  if (checked && !planConfig.advanced && advancedFreeUsesLeft <= 0) {
                    setShowUpgradeDialog(true);
                    return;
                  }
                  setShowAdvanced(checked);
                }}
              />
            </div>

            <div className="flex justify-start">
              <Button
                onClick={() => setCurrentStep(2)}
                disabled={!productName || !category}
                className="btn-gradient text-white"
              >
                مرحله بعد
                <ChevronLeft className="h-4 w-4 mr-1" />
              </Button>
            </div>
          </CardContent>
        </div>
      )}

      {/* Step 2: Content Settings */}
      {currentStep === 2 && (
        <div className="glass-card rounded-2xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              تنظیمات محتوا
              {showAdvanced && (
                <Badge className="bg-gradient-to-l from-violet-500 to-purple-500 text-white border-0 text-[10px]">
                  <Wand2 className="h-2.5 w-2.5 ml-0.5" />
                  پیشرفته
                </Badge>
              )}
            </CardTitle>
            <CardDescription>لحن، هدف و قالب محتوا را تعیین کنید</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGenerate} className="space-y-5">
              {/* Basic Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">لحن</Label>
                  <Select value={showAdvanced && advancedTone ? advancedTone : tone} onValueChange={v => {
                    if (showAdvanced) setAdvancedTone(v);
                    else setTone(v);
                  }}>
                    <SelectTrigger className="input-glow transition-all h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(showAdvanced ? ADVANCED_TONES : TONES).map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">هدف</Label>
                  <Select value={showAdvanced && advancedGoal ? advancedGoal : goal} onValueChange={v => {
                    if (showAdvanced) setAdvancedGoal(v);
                    else setGoal(v);
                  }}>
                    <SelectTrigger className="input-glow transition-all h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(showAdvanced ? ADVANCED_GOALS : GOALS).map(g => <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">قالب</Label>
                  <Select value={templateType} onValueChange={setTemplateType}>
                    <SelectTrigger className="input-glow transition-all h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TEMPLATE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm font-medium">پروفایل برند</Label>
                  <Select value={brandProfileId} onValueChange={setBrandProfileId}>
                    <SelectTrigger className="input-glow transition-all h-10"><SelectValue placeholder="بدون پروفایل" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">بدون پروفایل</SelectItem>
                      {brandProfiles.map(bp => <SelectItem key={bp.id} value={bp.id}>{bp.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Advanced Settings */}
              {showAdvanced && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Sliders className="h-4 w-4 text-violet-500" />
                      تنظیمات پیشرفته
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium flex items-center gap-1.5">
                          <Globe className="h-3.5 w-3.5 text-gray-400" />
                          پلتفرم هدف
                        </Label>
                        <Select value={platform} onValueChange={setPlatform}>
                          <SelectTrigger className="input-glow transition-all h-10"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {PLATFORMS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium flex items-center gap-1.5">
                          <Layers className="h-3.5 w-3.5 text-gray-400" />
                          طول محتوا
                        </Label>
                        <Select value={contentLength} onValueChange={setContentLength}>
                          <SelectTrigger className="input-glow transition-all h-10"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {CONTENT_LENGTHS.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium flex items-center gap-1.5">
                          <Target className="h-3.5 w-3.5 text-gray-400" />
                          نوع دعوت به اقدام (CTA)
                        </Label>
                        <Select value={ctaType} onValueChange={setCtaType}>
                          <SelectTrigger className="input-glow transition-all h-10"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {CTA_TYPES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium">تعداد کپشن</Label>
                        <Select value={captionCount} onValueChange={setCaptionCount}>
                          <SelectTrigger className="input-glow transition-all h-10"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">۱ کپشن</SelectItem>
                            <SelectItem value="3">۳ کپشن</SelectItem>
                            <SelectItem value="5">۵ کپشن</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium">تعداد هشتگ</Label>
                        <Select value={hashtagCount} onValueChange={setHashtagCount}>
                          <SelectTrigger className="input-glow transition-all h-10"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">۱۰ هشتگ</SelectItem>
                            <SelectItem value="15">۱۵ هشتگ</SelectItem>
                            <SelectItem value="20">۲۰ هشتگ</SelectItem>
                            <SelectItem value="30">۳۰ هشتگ</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium flex items-center gap-1.5">
                          <Lightbulb className="h-3.5 w-3.5 text-gray-400" />
                          محرک احساسی
                        </Label>
                        <Input
                          placeholder="مثلاً: حس اعتماد، حس تفاخر، ترس از دست دادن"
                          value={emotionTrigger}
                          onChange={e => setEmotionTrigger(e.target.value)}
                          className="input-glow transition-all h-10"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium flex items-center gap-1.5">
                          <Star className="h-3.5 w-3.5 text-gray-400" />
                          نقطه تمایز محصول
                        </Label>
                        <Input
                          placeholder="مثلاً: ساخت ایران، ارگانیک، ۲ سال گارانتی"
                          value={uniqueSellingPoint}
                          onChange={e => setUniqueSellingPoint(e.target.value)}
                          className="input-glow transition-all h-10"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-sm font-medium flex items-center gap-1.5">
                          <PenTool className="h-3.5 w-3.5 text-gray-400" />
                          سناریو/بستر استفاده
                        </Label>
                        <Input
                          placeholder="مثلاً: شب یلدا، روز مادر، عید نوروز"
                          value={targetScenario}
                          onChange={e => setTargetScenario(e.target.value)}
                          className="input-glow transition-all h-10"
                        />
                      </div>
                    </div>

                    {/* Toggle Options */}
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-white/3">
                        <span className="text-xs font-medium">استراتژی استوری</span>
                        <Switch checked={includeStoryStrategy} onCheckedChange={setIncludeStoryStrategy} />
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-white/3">
                        <span className="text-xs font-medium">کلمات کلیدی SEO</span>
                        <Switch checked={includeSEOKeywords} onCheckedChange={setIncludeSEOKeywords} />
                      </div>
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-white/3">
                        <span className="text-xs font-medium">CTA اختصاصی</span>
                        <Switch checked={includeCallToAction} onCheckedChange={setIncludeCallToAction} />
                      </div>
                    </div>

                    {/* Custom Instructions */}
                    <div className="mt-4 space-y-1.5">
                      <Label className="text-sm font-medium flex items-center gap-1.5">
                        <BookOpen className="h-3.5 w-3.5 text-gray-400" />
                        دستورالعمل سفارشی
                      </Label>
                      <Textarea
                        placeholder="هر دستورالعمل خاصی که می‌خواهید هوش مصنوعی رعایت کند را اینجا بنویسید... مثلاً: از کلمه 'فقط' زیاد استفاده کن، از مثال واقعی استفاده کن، مقایسه با رقبا داشته باش"
                        value={customInstructions}
                        onChange={e => setCustomInstructions(e.target.value)}
                        className="input-glow transition-all min-h-[80px] resize-y"
                        rows={3}
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setCurrentStep(1)}>
                  <ChevronRight className="h-4 w-4 ml-1" />
                  مرحله قبل
                </Button>
                <Button
                  type="submit"
                  className="flex-1 btn-gradient text-white h-11 font-medium"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      در حال تولید محتوا...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5" />
                      {showAdvanced ? 'تولید محتوای پیشرفته' : 'تولید محتوا'}
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </div>
      )}

      {/* Step 3: Loading / Results */}
      {currentStep === 3 && (
        <>
          {loading && (
            <div className="glass-card rounded-2xl">
              <CardContent className="p-12 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 mb-4">
                  <Sparkles className="h-8 w-8 text-white animate-pulse" />
                </div>
                <h3 className="text-lg font-bold mb-2">در حال تولید محتوا...</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {showAdvanced ? 'هوش مصنوعی با تنظیمات پیشرفته در حال تولید محتوای شماست.' : 'لطفاً چند لحظه صبر کنید. هوش مصنوعی در حال تولید محتوای شماست.'}
                </p>
                <div className="w-48 mx-auto h-1.5 rounded-full bg-gray-200 dark:bg-white/5 overflow-hidden">
                  <div className="h-full bg-gradient-to-l from-emerald-400 to-teal-500 rounded-full animate-pulse" style={{ width: '70%' }} />
                </div>
              </CardContent>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-5">
              {/* Header */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="sm" onClick={() => { setCurrentStep(2); setResult(null); }}>
                    <ChevronRight className="h-4 w-4 ml-1" />
                    تولید جدید
                  </Button>
                  <h2 className="text-lg font-bold gradient-text">نتیجه تولید محتوا</h2>
                  {showAdvanced && (
                    <Badge className="bg-gradient-to-l from-violet-500 to-purple-500 text-white border-0 text-[10px]">
                      <Wand2 className="h-2.5 w-2.5 ml-0.5" />
                      پیشرفته
                    </Badge>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="h-4 w-4 ml-1.5" />
                  خروجی فایل
                </Button>
              </div>

              {/* Result Tabs */}
              <div className="glass-card rounded-xl">
                <div className="flex border-b border-gray-100 dark:border-white/5 overflow-x-auto">
                  {resultTabs.map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveResultTab(tab.id)}
                      className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${
                        activeResultTab === tab.id
                          ? 'border-emerald-500 text-emerald-700 dark:text-emerald-300'
                          : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                      }`}
                    >
                      <tab.icon className="h-3.5 w-3.5" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                <div className="p-4">
                  {/* Captions */}
                  {activeResultTab === 'captions' && (
                    <div className="space-y-3">
                      {result.captions.map((caption, i) => (
                        <div key={i} className="rounded-xl p-4 relative group border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <Badge variant="outline" className="text-[10px]">کپشن {i + 1}</Badge>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleCopy(caption, `کپشن ${i + 1}`)}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                          <p className="whitespace-pre-wrap text-sm leading-7">{caption}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Stories */}
                  {activeResultTab === 'stories' && (
                    <div className="flex gap-3 overflow-x-auto pb-2">
                      {result.stories.map((story, i) => (
                        <div key={i} className="min-w-[150px] w-36 h-56 bg-gradient-to-b from-violet-500 via-purple-500 to-pink-500 rounded-xl flex flex-col items-center justify-center p-3 relative group cursor-pointer shadow-lg" onClick={() => handleCopy(story, `استوری ${i + 1}`)}>
                          <div className="absolute top-2 right-2 bg-white/20 rounded-full w-6 h-6 flex items-center justify-center text-white text-xs font-bold">{i + 1}</div>
                          <p className="text-white text-xs text-center leading-5">{story}</p>
                          <Copy className="absolute bottom-2 left-2 h-3 w-3 text-white/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Reels */}
                  {activeResultTab === 'reels' && (
                    <div className="space-y-3">
                      <div className="rounded-xl p-4 border border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/10 relative group">
                        <Badge className="mb-2 bg-gradient-to-l from-red-500 to-rose-500 text-white border-0">قلاب (Hook)</Badge>
                        <p className="whitespace-pre-wrap text-sm leading-7">{result.reels_script.hook}</p>
                        <Button variant="ghost" size="sm" className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 h-7 w-7 p-0" onClick={() => handleCopy(result.reels_script.hook, 'قلاب')}>
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="rounded-xl p-4 border border-blue-100 dark:border-blue-900/30 bg-blue-50/50 dark:bg-blue-900/10 relative group">
                        <Badge className="mb-2 bg-gradient-to-l from-blue-500 to-indigo-500 text-white border-0">بدنه</Badge>
                        <p className="whitespace-pre-wrap text-sm leading-7">{result.reels_script.body}</p>
                        <Button variant="ghost" size="sm" className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 h-7 w-7 p-0" onClick={() => handleCopy(result.reels_script.body, 'بدنه')}>
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="rounded-xl p-4 border border-emerald-100 dark:border-emerald-900/30 bg-emerald-50/50 dark:bg-emerald-900/10 relative group">
                        <Badge className="mb-2 bg-gradient-to-l from-emerald-500 to-teal-500 text-white border-0">CTA</Badge>
                        <p className="whitespace-pre-wrap text-sm leading-7">{result.reels_script.cta}</p>
                        <Button variant="ghost" size="sm" className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 h-7 w-7 p-0" onClick={() => handleCopy(result.reels_script.cta, 'CTA')}>
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Ads */}
                  {activeResultTab === 'ads' && (
                    <div className="space-y-3">
                      <div className="rounded-xl p-4 border border-gray-100 dark:border-white/5 relative group">
                        <Badge variant="outline" className="mb-2">کوتاه</Badge>
                        <p className="whitespace-pre-wrap text-sm leading-7">{result.ads.short}</p>
                        <Button variant="ghost" size="sm" className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 h-7 w-7 p-0" onClick={() => handleCopy(result.ads.short, 'تبلیغ کوتاه')}>
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                      <div className="rounded-xl p-4 border border-gray-100 dark:border-white/5 relative group">
                        <Badge variant="outline" className="mb-2">بلند</Badge>
                        <p className="whitespace-pre-wrap text-sm leading-7">{result.ads.long}</p>
                        <Button variant="ghost" size="sm" className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 h-7 w-7 p-0" onClick={() => handleCopy(result.ads.long, 'تبلیغ بلند')}>
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Hashtags */}
                  {activeResultTab === 'hashtags' && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm text-gray-500">{result.hashtags.length} هشتگ</span>
                        <Button variant="outline" size="sm" onClick={() => handleCopy(result.hashtags.map(h => `#${h}`).join(' '), 'هشتگ‌ها')}>
                          <Copy className="h-3.5 w-3.5 ml-1" />
                          کپی همه
                        </Button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {result.hashtags.map((tag, i) => (
                          <Badge key={i} variant="secondary" className="cursor-pointer hover:bg-emerald-100 hover:text-emerald-700 transition-all" onClick={() => handleCopy(`#${tag}`, `#${tag}`)}>
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Limit reached upgrade prompt */}
      {dailyLimit > 0 && remaining <= 0 && !loading && !result && (
        <div className="glass-card rounded-2xl">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
              <AlertTriangle className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-lg font-bold mb-2">محدودیت روزانه طرح {planConfig.label} تمام شده</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">با ارتقا به طرح حرفه‌ای، ۵۰ تولید روزانه و با طرح تجاری تولید نامحدود داشته باشید</p>
            <Button className="btn-gradient text-white" onClick={() => onNavigate('billing')}>
              ارتقا به طرح حرفه‌ای
            </Button>
          </CardContent>
        </div>
      )}

      {/* Upgrade Dialog for Advanced Mode */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              دسترسی به حالت پیشرفته
            </DialogTitle>
            <DialogDescription>
              حالت پیشرفته فقط برای طرح‌های حرفه‌ای و تجاری در دسترس است. طرح استارتر فقط ۱ بار استفاده رایگان از این قابلیت دارد.
            </DialogDescription>
          </DialogHeader>
          <div className="py-3 space-y-3">
            <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-900/10 border border-violet-200/30 dark:border-violet-700/20">
              <h4 className="text-sm font-semibold mb-2">ویژگی‌های حالت پیشرفته:</h4>
              <ul className="space-y-1.5">
                {[
                  'انتخاب پلتفرم هدف',
                  'تنظیم طول محتوا',
                  'نوع CTA اختصاصی',
                  'محرک احساسی و روانشناسی',
                  'نقطه تمایز محصول',
                  'دستورالعمل سفارشی',
                  'استراتژی استوری و SEO',
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs">
                    <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowUpgradeDialog(false)}>بستن</Button>
            <Button className="btn-gradient text-white" onClick={() => { setShowUpgradeDialog(false); onNavigate('billing'); }}>
              ارتقا به طرح حرفه‌ای
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
