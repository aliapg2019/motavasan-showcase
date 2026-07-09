'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles, MessageSquare, FileText, Zap, TrendingUp, Hash,
  Check, ArrowLeft, Star, Users, BarChart3, Shield, Clock,
  Palette, CreditCard, ChevronDown, Play, Globe, Cpu, Target,
  Heart, Eye, Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface LandingPageProps {
  onShowAuth: () => void;
}

// Counter animation hook
function useCounter(end: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
        }
      },
      { threshold: 0.3 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    let startTime: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [started, end, duration]);

  return { count, ref };
}

const FEATURES = [
  {
    icon: MessageSquare,
    title: 'کپشن اینستاگرام',
    desc: 'کپشن‌های فروشی و حرفه‌ای فارسی که مخاطب را به خرید ترغیب می‌کند. با لحن برند شما، هدفمند و جذاب.',
    color: 'from-emerald-400 to-teal-500',
  },
  {
    icon: FileText,
    title: 'استوری ۵ اسلایدی',
    desc: 'استوری‌های کامل و جذاب با روایت منظم. هر اسلاید با هدف مشخص طراحی می‌شود تا نرخ تبدیل را افزایش دهد.',
    color: 'from-violet-400 to-purple-500',
  },
  {
    icon: Zap,
    title: 'اسکریپت ریلز',
    desc: 'سناریو ویدیو با قلاب (Hook) قدرتمند، بدنه جذاب و فراخوان به اقدام (CTA) حرفه‌ای.',
    color: 'from-amber-400 to-orange-500',
  },
  {
    icon: TrendingUp,
    title: 'متن تبلیغاتی',
    desc: 'متن‌های تبلیغاتی کوتاه و بلند با رعایت اصول کپی‌رایتینگ فروش برای پلتفرم‌های مختلف.',
    color: 'from-pink-400 to-rose-500',
  },
  {
    icon: Hash,
    title: 'هشتگ هدفمند',
    desc: 'مجموعه هشتگ‌های مرتبط و تحقیق‌شده فارسی و انگلیسی برای افزایش دسترسی و رشد ارگانیک.',
    color: 'from-cyan-400 to-blue-500',
  },
  {
    icon: Palette,
    title: 'صدای برند',
    desc: 'لحن اختصاصی کسب‌وکار شما در تمام محتواها اعمال می‌شود. رسمی، دوستانه، لوکس یا تهاجمی.',
    color: 'from-teal-400 to-emerald-500',
  },
];

const TESTIMONIALS = [
  {
    name: 'سارا محمدی',
    role: 'فروشگاه لباس آنلاین',
    text: 'از وقتی محتواسان رو شروع کردم، فروش اینستاگرامی‌ام ۳ برابر شده. کپشن‌ها واقعا فروشی هستن!',
    rating: 5,
  },
  {
    name: 'علی رضایی',
    role: 'دیجیتال مارکتر',
    text: 'بهترین ابزار تولید محتوای فارسی که تا حالا استفاده کردم. کیفیت محتوا خیلی بالاتر از ChatGPT خامه.',
    rating: 5,
  },
  {
    name: 'مینا کریمی',
    role: 'صاحب برند آرایشی',
    text: 'لحن برندم رو تنظیم کردم و حالا همه محتواها دقیقا همون‌طوری هستن که می‌خوام. فوق‌العادست!',
    rating: 5,
  },
];

const PLANS = [
  {
    name: 'استارتر',
    nameEn: 'Starter',
    price: 'رایگان',
    priceDetail: 'بر همیشه',
    features: [
      '۵ تولید محتوا در روز',
      'قالب‌های پایه',
      '۱ پروفایل برند',
      'تاریخچه ۷ روزه',
      'پشتیبانی ایمیل',
    ],
    popular: false,
    cta: 'شروع رایگان',
    color: 'from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700',
    btnClass: 'bg-gray-800 hover:bg-gray-900 dark:bg-gray-200 dark:hover:bg-gray-100 text-white dark:text-gray-900',
  },
  {
    name: 'حرفه‌ای',
    nameEn: 'Pro',
    price: '۲۹۰,۰۰۰',
    priceDetail: 'تومان / ماهانه',
    features: [
      '۵۰ تولید محتوا در روز',
      'تمام قالب‌ها',
      '۵ پروفایل برند',
      'تاریخچه نامحدود',
      'حالت پیشرفته AI',
      'تولید ایمیل مارکتینگ',
      'خروجی فایل',
      'پشتیبانی اولویت‌دار',
    ],
    popular: true,
    cta: 'شروع دوره آزمایشی',
    color: 'from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20',
    btnClass: 'btn-gradient text-white',
  },
  {
    name: 'تجاری',
    nameEn: 'Business',
    price: '۴۹۰,۰۰۰',
    priceDetail: 'تومان / ماهانه',
    features: [
      'تولید نامحدود',
      'قالب‌های سفارشی',
      'پروفایل برند نامحدود',
      'تاریخچه نامحدود',
      'تمام امکانات حرفه‌ای',
      'دسترسی تیمی',
      'API اختصاصی',
      'تولید انبوه',
      'پشتیبانی ۲۴/۷',
    ],
    popular: false,
    cta: 'تماس با فروش',
    color: 'from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20',
    btnClass: 'bg-violet-600 hover:bg-violet-700 text-white',
  },
];

const FAQ_ITEMS = [
  {
    q: 'محتواسان چه تفاوتی با ChatGPT دارد؟',
    a: 'محتواسان مخصوص بازار ایران و فروش آنلاین طراحی شده است. پرامپت‌ها بهینه‌سازی شده‌اند، لحن فارسی طبیعی‌تر است، هشتگ‌های مرتبط فارسی پیشنهاد می‌دهد، صدای برند شما را حفظ می‌کند و قالب‌های آماده برای انواع محتوا دارد. همچنین نیاز به مهارت پرامپت‌نویسی ندارید.',
  },
  {
    q: 'آیا محتوای تولید شده یکتا است؟',
    a: 'بله، هر محتوا به صورت اختصاصی برای شما تولید می‌شود. سیستم از آخرین تکنیک‌های هوش مصنوعی استفاده می‌کند و محتوای کپی یا تکراری تولید نمی‌کند.',
  },
  {
    q: 'آیا می‌توانم قبل از پرداخت تست کنم؟',
    a: 'بله! طرح استارتر کاملاً رایگان است و بدون نیاز به کارت بانکی می‌توانید پلتفرم را تست کنید. ۵ تولید محتوا رایگان در روز خواهید داشت.',
  },
  {
    q: 'آیا محتواها از نظر سئو بهینه هستند؟',
    a: 'بله، محتواها با رعایت اصول سئو و کلمات کلیدی مرتبط تولید می‌شوند. همچنین هشتگ‌های هدفمند برای افزایش دسترسی ارگانیک پیشنهاد می‌شود.',
  },
  {
    q: 'چگونه می‌توانم اشتراک را لغو کنم؟',
    a: 'در هر زمانی از بخش اشتراک در پنل کاربری می‌توانید طرح خود را لغو کنید. تا پایان دوره فعلی به امکانات دسترسی خواهید داشت.',
  },
];

export default function LandingPage({ onShowAuth }: LandingPageProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const stats1 = useCounter(1200, 2000);
  const stats2 = useCounter(50000, 2500);
  const stats3 = useCounter(98, 1500);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('contentgen_darkmode');
    if (stored === 'true' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDark = () => {
    setDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('contentgen_darkmode', String(next));
      if (next) document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      {/* ===== NAVBAR ===== */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-violet-600 flex items-center justify-center shadow-lg shadow-emerald-200/30 dark:shadow-emerald-900/30 overflow-hidden">
                <img src="/logo.svg" alt="محتواسان" className="w-full h-full p-1" />
              </div>
              <span className="text-lg font-bold gradient-text">محتواسان</span>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={toggleDark} className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                {darkMode ? <Star className="h-4 w-4 text-amber-500" /> : <Star className="h-4 w-4 text-gray-400" />}
              </button>
              <Button variant="ghost" onClick={onShowAuth} className="text-sm">
                ورود
              </Button>
              <Button onClick={onShowAuth} className="btn-gradient text-white text-sm h-9 px-5">
                شروع رایگان
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* ===== HERO SECTION ===== */}
      <section className="pt-28 pb-16 lg:pt-36 lg:pb-24 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
          <div className="floating-shape w-3 h-3 bg-emerald-400/20 top-[20%] right-[15%]" />
          <div className="floating-shape w-5 h-5 bg-violet-400/15 top-[40%] right-[70%]" />
          <div className="floating-shape w-4 h-4 bg-teal-400/20 top-[65%] right-[30%]" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200/50 dark:border-emerald-700/30 mb-6">
              <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-300">پلتفرم شماره ۱ تولید محتوای فارسی با هوش مصنوعی</span>
            </div>

            {/* Heading - SEO optimized H1 */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight mb-6">
              <span className="gradient-text">تولید محتوای فروشی</span>
              <br />
              <span className="text-gray-900 dark:text-white">فارسی با هوش مصنوعی</span>
            </h1>

            {/* Subheading */}
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 leading-8 mb-8 max-w-2xl mx-auto">
              کپشن اینستاگرام، استوری، ریلز و متن تبلیغاتی حرفه‌ای در چند ثانیه.
              ویژه فروشندگان آنلاین ایران با لحن اختصاصی برند شما.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
              <Button
                onClick={onShowAuth}
                className="btn-gradient text-white h-12 px-8 text-base font-semibold shadow-lg shadow-emerald-200/40 dark:shadow-emerald-900/40"
              >
                شروع رایگان - بدون کارت بانکی
                <ArrowLeft className="h-4 w-4 mr-1" />
              </Button>
              <Button
                variant="outline"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="h-12 px-8 text-base border-gray-200 dark:border-white/10"
              >
                مشاهده امکانات
              </Button>
            </div>

            {/* Trust signals */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-emerald-500" />
                <span>بدون نیاز به کارت بانکی</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-emerald-500" />
                <span>لحن اختصاصی برند</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="h-4 w-4 text-emerald-500" />
                <span>محتوای ۱۰۰٪ فارسی</span>
              </div>
            </div>

            {/* Demo preview */}
            <div className="mt-12 relative">
              <div className="glass-card rounded-2xl p-6 lg:p-8 max-w-3xl mx-auto">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400" />
                  <span className="text-xs text-gray-400 mr-2">محتواسان</span>
                </div>
                <div className="space-y-3 text-right" dir="rtl">
                  <div className="flex items-start gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">ش</div>
                    <div className="bg-gray-50 dark:bg-zinc-800 rounded-xl rounded-tr-none px-4 py-2.5 text-sm leading-7 max-w-md">
                      <p className="font-semibold text-emerald-700 dark:text-emerald-300 mb-1">کپشن اینستاگرام - کیف چرمی</p>
                      <p>حق با کیفت! کیف چرمی اصل با طراحی مینیمال و زیبا. کیفیت بالا، قیمت مناسب. همین الان سفارش بده و از ارسال رایگان لذت ببر!</p>
                      <p className="text-xs text-gray-400 mt-1">#کیف_چرمی #فروش_آنلاین #اکسسوری_زنانه</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">AI</div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl rounded-tr-none px-4 py-2.5 text-sm leading-7 max-w-md border border-emerald-100 dark:border-emerald-800/30">
                      <p className="font-semibold mb-1">۳ کپشن تولید شد!</p>
                      <p>کپشن فروشی با لحن دوستانه، استوری ۵ اسلایدی و ۱۵ هشتگ هدفمند هم آماده‌ست</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== STATS ===== */}
      <section className="py-12 bg-gray-50/50 dark:bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div ref={stats1.ref}>
              <p className="text-3xl sm:text-4xl font-black gradient-text">{stats1.count.toLocaleString('fa-IR')}+</p>
              <p className="text-sm text-gray-500 mt-1">کاربر فعال</p>
            </div>
            <div ref={stats2.ref}>
              <p className="text-3xl sm:text-4xl font-black gradient-text">{stats2.count.toLocaleString('fa-IR')}+</p>
              <p className="text-sm text-gray-500 mt-1">محتوا تولید شده</p>
            </div>
            <div ref={stats3.ref}>
              <p className="text-3xl sm:text-4xl font-black gradient-text">{stats3.count}%</p>
              <p className="text-sm text-gray-500 mt-1">رضایت کاربران</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black mb-4">
              همه ابزارهایی که برای <span className="gradient-text">تولید محتوای فروشی</span> نیاز دارید
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-lg max-w-2xl mx-auto">
              از کپشن اینستاگرام تا اسکریپت ریلز، هر نوع محتوایی که برای رشد کسب‌وکار آنلاین خود نیاز دارید
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature, i) => (
              <div
                key={i}
                className="group glass-card rounded-2xl p-6 hover:shadow-xl transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-bold mb-2">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-7">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="py-20 lg:py-28 bg-gray-50/50 dark:bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black mb-4">
              فقط ۳ قدم تا <span className="gradient-text">محتوای حرفه‌ای</span>
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-lg">بدون نیاز به مهارت پرامپت‌نویسی یا دانش فنی</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '۱',
                icon: Target,
                title: 'مشخص کنید',
                desc: 'نام محصول، دسته‌بندی و هدف محتوا را وارد کنید. مخاطب هدفتان را انتخاب کنید.',
              },
              {
                step: '۲',
                icon: Cpu,
                title: 'هوش مصنوعی تولید کند',
                desc: 'AI با توجه به لحن برند شما، محتوای حرفه‌ای و فروشی تولید می‌کند.',
              },
              {
                step: '۳',
                icon: Eye,
                title: 'انتشار دهید',
                desc: 'محتوا را کپی کنید و مستقیماً در اینستاگرام، واتساپ یا سایت منتشر کنید.',
              },
            ].map((item, i) => (
              <div key={i} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-200/30 dark:shadow-emerald-900/30 mb-4">
                  <span className="text-white text-2xl font-black">{item.step}</span>
                </div>
                <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-7">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== WHY US ===== */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-black mb-6">
                چرا <span className="gradient-text">محتواسان</span>؟
              </h2>
              <p className="text-gray-600 dark:text-gray-300 text-lg leading-8 mb-8">
                ما فقط یک ربات AI نیستیم. محتواسان با درک عمیق از بازار ایران و نیازهای فروشندگان آنلاین طراحی شده است.
              </p>
              <div className="space-y-4">
                {[
                  { icon: Globe, text: 'محتوای ۱۰۰٪ فارسی طبیعی، نه ترجمه ماشینی' },
                  { icon: Palette, text: 'لحن اختصاصی برند شما در تمام محتواها' },
                  { icon: Target, text: 'پرامپت‌های بهینه‌سازی شده برای فروش' },
                  { icon: Shield, text: 'محتوای یکتا و غیرتکراری' },
                  { icon: Layers, text: 'قالب‌های متنوع برای هر نوع محتوا' },
                  { icon: BarChart3, text: 'هشتگ‌های هدفمند فارسی و انگلیسی' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
                      <item.icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <p className="text-gray-700 dark:text-gray-200 font-medium">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card rounded-2xl p-8">
              <div className="space-y-4">
                {[
                  { label: 'کیفیت محتوای فارسی', value: 95 },
                  { label: 'لحن برند اختصاصی', value: 98 },
                  { label: 'نرخ تبدیل محتوا', value: 87 },
                  { label: 'رضایت کاربران', value: 96 },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium">{item.label}</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">{item.value}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-l from-emerald-500 to-teal-400 transition-all duration-1000"
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="pricing" className="py-20 lg:py-28 bg-gray-50/50 dark:bg-white/[0.02]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black mb-4">
              طرح‌های <span className="gradient-text">اشتراک</span>
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-lg">از رایگان شروع کنید و هر زمان ارتقا دهید</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {PLANS.map((plan, i) => (
              <div
                key={i}
                className={`relative rounded-2xl p-6 bg-gradient-to-b ${plan.color} border ${
                  plan.popular
                    ? 'border-emerald-300 dark:border-emerald-700 shadow-xl shadow-emerald-100/50 dark:shadow-emerald-900/20 scale-[1.02]'
                    : 'border-gray-200 dark:border-white/5'
                } transition-all duration-300`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 inset-x-0 flex justify-center">
                    <span className="popular-badge text-white text-xs font-bold px-4 py-1 rounded-full">محبوب‌ترین</span>
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
                  <p className="text-xs text-gray-400 mb-3">{plan.nameEn}</p>
                  <p className="text-3xl font-black">{plan.price}</p>
                  <p className="text-xs text-gray-500 mt-1">{plan.priceDetail}</p>
                </div>
                <ul className="space-y-2.5 mb-6">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={onShowAuth}
                  className={`w-full h-11 font-medium ${plan.btnClass}`}
                >
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIALS ===== */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black mb-4">
              نظر <span className="gradient-text">کاربران</span> ما
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-lg">بیش از ۱,۲۰۰ فروشنده آنلاین به ما اعتماد کرده‌اند</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="glass-card rounded-2xl p-6">
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-700 dark:text-gray-200 text-sm leading-7 mb-4">{t.text}</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-sm">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="py-20 lg:py-28 bg-gray-50/50 dark:bg-white/[0.02]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black mb-4">
              سوالات <span className="gradient-text">متداول</span>
            </h2>
          </div>

          <div className="space-y-3">
            {FAQ_ITEMS.map((faq, i) => (
              <div
                key={i}
                className="glass-card rounded-xl overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-right"
                >
                  <span className="font-medium text-sm">{faq.q}</span>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 text-sm text-gray-600 dark:text-gray-300 leading-7">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="welcome-banner rounded-3xl p-8 lg:p-16 text-center text-white relative overflow-hidden">
            <h2 className="text-3xl sm:text-4xl font-black mb-4 relative z-10">
              همین الان شروع کنید!
            </h2>
            <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto relative z-10">
              بدون نیاز به کارت بانکی، ۵ محتوای رایگان در روز تولید کنید و رشد کسب‌وکارتان را تجربه کنید.
            </p>
            <Button
              onClick={onShowAuth}
              className="bg-white text-emerald-700 hover:bg-gray-100 h-12 px-8 text-base font-bold shadow-xl relative z-10"
            >
              شروع رایگان
              <ArrowLeft className="h-4 w-4 mr-1" />
            </Button>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="py-12 border-t border-gray-100 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2.5 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 via-teal-500 to-violet-600 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <span className="font-bold gradient-text">محتواسان</span>
              </div>
              <p className="text-sm text-gray-500 leading-7 max-w-md">
                پلتفرم تولید محتوای هوشمند فارسی با هوش مصنوعی. ویژه کسب‌وکارهای آنلاین ایران.
                کپشن، استوری، ریلز و متن تبلیغاتی حرفه‌ای در چند ثانیه.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">محصولات</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>تولید محتوا</li>
                <li>صدای برند</li>
                <li>قالب‌ها</li>
                <li>API</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-3">پشتیبانی</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li>راهنما</li>
                <li>تماس با ما</li>
                <li>سوالات متداول</li>
                <li>بلاگ</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-100 dark:border-white/5 text-center text-xs text-gray-400">
            تمامی حقوق محفوظ است &copy; محتواسان ۱۴۰۴
          </div>
        </div>
      </footer>
    </div>
  );
}
