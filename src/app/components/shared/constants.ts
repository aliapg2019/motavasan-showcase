// shared constants
export const CATEGORIES = [
  { value: 'fashion', label: 'مد و پوشاک' },
  { value: 'beauty', label: 'زیبایی و آرایشی' },
  { value: 'food', label: 'غذا و خوراکی' },
  { value: 'electronics', label: 'الکترونیک و دیجیتال' },
  { value: 'home', label: 'خانه و دکوراسیون' },
  { value: 'sports', label: 'ورزش و سلامت' },
  { value: 'kids', label: 'کودک و نوزاد' },
  { value: 'book', label: 'کتاب و فرهنگ' },
  { value: 'car', label: 'خودرو و لوازم' },
  { value: 'handmade', label: 'دستی و هنری' },
  { value: 'digital', label: 'محصولات دیجیتال' },
  { value: 'service', label: 'خدمات' },
  { value: 'other', label: 'سایر' },
];

export const TONES = [
  { value: 'formal', label: 'رسمی' },
  { value: 'informal', label: 'غیررسمی' },
  { value: 'luxury', label: 'لوکس' },
  { value: 'friendly', label: 'دوستانه' },
  { value: 'aggressive', label: 'تهاجمی' },
];

export const GOALS = [
  { value: 'sell', label: 'فروش' },
  { value: 'inform', label: 'اطلاع‌رسانی' },
  { value: 'promote', label: 'تبلیغ' },
  { value: 'discount', label: 'تخفیف' },
];

export const TEMPLATE_TYPES = [
  { value: 'general', label: 'عمومی' },
  { value: 'discount', label: 'تخفیف' },
  { value: 'launch', label: 'معرفی محصول' },
  { value: 'seasonal', label: 'فصلی' },
  { value: 'urgency', label: 'فوریتی' },
  { value: 'luxury', label: 'لوکس' },
  { value: 'budget', label: 'اقتصادی' },
];

export const EMOJI_LEVELS = [
  { value: 'none', label: 'بدون ایموجی' },
  { value: 'minimal', label: 'کم' },
  { value: 'moderate', label: 'متوسط' },
  { value: 'heavy', label: 'زیاد' },
];

export const SLANG_LEVELS = [
  { value: 'none', label: 'بدون عامیانه' },
  { value: 'light', label: 'سبک' },
  { value: 'moderate', label: 'متوسط' },
  { value: 'heavy', label: 'زیاد' },
];

export const FORMALITY_LEVELS = [
  { value: 'formal', label: 'رسمی' },
  { value: 'semi-formal', label: 'نیمه‌رسمی' },
  { value: 'informal', label: 'غیررسمی' },
];

// Feature comparison for plans
export const FEATURE_COMPARISON = [
  { feature: 'تولید محتوا در روز', starter: '۵', pro: '۵۰', business: 'نامحدود' },
  { feature: 'حالت پیشرفته', starter: '۱ بار رایگان', pro: true, business: true },
  { feature: 'قالب‌های محتوا', starter: 'پایه', pro: 'همه', business: 'همه + سفارشی' },
  { feature: 'سیستم صدای برند', starter: false, pro: true, business: true },
  { feature: 'تاریخچه تولیدها', starter: '۷ روز', pro: 'نامحدود', business: 'نامحدود' },
  { feature: 'خروجی فایل', starter: false, pro: true, business: true },
  { feature: 'دسترسی تیمی', starter: false, pro: false, business: true },
  { feature: 'API اختصاصی', starter: false, pro: false, business: true },
  { feature: 'تولید انبوه', starter: false, pro: false, business: true },
  { feature: 'پروفایل برند', starter: '۱', pro: '۵', business: 'نامحدود' },
  { feature: 'پشتیبانی', starter: 'ایمیل', pro: 'اولویت‌دار', business: '۲۴/۷' },
];

// FAQ items for billing
export const BILLING_FAQ = [
  {
    q: 'آیا می‌توانم طرح خود را تغییر دهم؟',
    a: 'بله، در هر زمانی می‌توانید طرح خود را ارتقا یا تنزل دهید. در صورت ارتقا، تفاوت قیمت به صورت روزشمار محاسبه می‌شود.',
  },
  {
    q: 'آیا دوره آزمایشی رایگان وجود دارد؟',
    a: 'بله، طرح استارتر به صورت رایگان در دسترس است و نیازی به کارت بانکی ندارید. می‌توانید قبل از ارتقا، پلتفرم را تست کنید.',
  },
  {
    q: 'چگونه می‌توانم اشتراک را لغو کنم؟',
    a: 'در هر زمانی از بخش اشتراک می‌توانید طرح خود را لغو کنید. بعد از لغو، تا پایان دوره فعلی به امکانات دسترسی خواهید داشت.',
  },
  {
    q: 'آیا پرداخت امن است؟',
    a: 'بله، تمام پرداخت‌ها از طریق درگاه‌های معتبر بانکی با رمزنگاری SSL انجام می‌شود.',
  },
  {
    q: 'آیا تخفیف سالانه وجود دارد؟',
    a: 'بله! با خرید اشتراک سالانه ۲۰٪ تخفیف دریافت می‌کنید.',
  },
];

// Sidebar navigation items
export const SIDEBAR_ITEMS = [
  { id: 'dashboard', label: 'داشبورد', icon: 'Home' },
  { id: 'generator', label: 'تولید محتوا', icon: 'Sparkles' },
  { id: 'history', label: 'تاریخچه', icon: 'Clock' },
  { id: 'brand-voice', label: 'صدای برند', icon: 'Palette' },
  { id: 'billing', label: 'اشتراک', icon: 'CreditCard' },
];

export const ADMIN_SIDEBAR_ITEMS = [
  { id: 'dashboard', label: 'داشبورد', icon: 'Home' },
  { id: 'generator', label: 'تولید محتوا', icon: 'Sparkles' },
  { id: 'history', label: 'تاریخچه', icon: 'Clock' },
  { id: 'brand-voice', label: 'صدای برند', icon: 'Palette' },
  { id: 'billing', label: 'اشتراک', icon: 'CreditCard' },
  { id: 'admin', label: 'پنل مدیریت', icon: 'Shield' },
];
