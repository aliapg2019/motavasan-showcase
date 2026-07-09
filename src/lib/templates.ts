// Predefined templates for the Template System

export interface TemplateData {
  name: string;
  nameFa: string;
  type: string;
  description: string;
  descriptionFa: string;
  promptTemplate: string;
}

export const TEMPLATES: TemplateData[] = [
  {
    name: 'General Marketing',
    nameFa: 'بازاریابی عمومی',
    type: 'general',
    description: 'General marketing content for any product',
    descriptionFa: 'محتوای بازاریابی عمومی برای هر محصولی',
    promptTemplate: 'محتوای بازاریابی عمومی و جذاب برای محصول تولید کن.',
  },
  {
    name: 'Discount Campaign',
    nameFa: 'کمپین تخفیف',
    type: 'discount',
    description: 'Discount and sale campaign content',
    descriptionFa: 'محتوای کمپین تخفیف و حراج',
    promptTemplate: 'کمپین تخفیف ویژه طراحی کن. روی صرفه‌جویی مشتری و محدودیت زمانی تاکید کن. از اصل فوریت و کمیابی استفاده کن.',
  },
  {
    name: 'Product Launch',
    nameFa: 'معرفی محصول جدید',
    type: 'launch',
    description: 'New product launch announcement',
    descriptionFa: 'اعلام معرفی محصول جدید',
    promptTemplate: 'محتوای معرفی محصول جدید تولید کن. روی نوآوری، اولین بودن و ویژگی‌های منحصربفرد تاکید کن. حس کنجکاوی و هیجان ایجاد کن.',
  },
  {
    name: 'Seasonal Sales',
    nameFa: 'فروش فصلی',
    type: 'seasonal',
    description: 'Seasonal and holiday sale content',
    descriptionFa: 'محتوای فروش فصلی و مناسبتی',
    promptTemplate: 'کمپین فروش فصلی طراحی کن. مناسب مناسبت‌های ایرانی مثل نوروز، یلدا، رمضان، سیزده‌بدرو... باشد. حس تعلق و سنت ایرانی ایجاد کن.',
  },
  {
    name: 'Urgency Marketing',
    nameFa: 'بازاریابی فوریتی',
    type: 'urgency',
    description: 'Urgency and scarcity based marketing',
    descriptionFa: 'بازاریابی مبتنی بر فوریت و کمیابی',
    promptTemplate: 'محتوای با حس فوریت شدید تولید کن. از تکنیک‌های کمیابی استفاده کن: "آخرین تعداد"، "فقط X تا مانده"، "فردا دیگه نیست". مشتری باید همین الان اقدام کنه.',
  },
  {
    name: 'Luxury Branding',
    nameFa: 'برندینگ لوکس',
    type: 'luxury',
    description: 'Luxury brand positioning content',
    descriptionFa: 'محتوای جایگاه‌یابی برند لوکس',
    promptTemplate: 'محتوای لوکس و خاص تولید کن. روی کیفیت برتر، منحصربفرد بودن، تجربه خاص و تمایز تمرکز کن. از کلمات نشان‌دهنده کیفیت و اصالت استفاده کن.',
  },
  {
    name: 'Budget Selling',
    nameFa: 'فروش اقتصادی',
    type: 'budget',
    description: 'Budget-friendly selling content',
    descriptionFa: 'محتوای فروش با قیمت اقتصادی',
    promptTemplate: 'محتوای اقتصادی و مقرون‌به‌صرفه تولید کن. روی بهترین قیمت، ارزش خرید، مقایسه با رقبا و صرفه‌جویی مشتری تمرکز کن. "بهترین کیفیت با کمترین قیمت" پیام اصلی باشد.',
  },
];

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

export const PLANS = [
  {
    id: 'starter',
    name: 'استارتر',
    nameEn: 'Starter',
    price: 'رایگان',
    priceNum: 0,
    features: [
      '۵ تولید محتوا در روز',
      '۱ استفاده رایگان پیشرفته',
      'قالب‌های پایه',
      'تاریخچه ۷ روزه',
      'پشتیبانی ایمیل',
    ],
    limits: { dailyGenerations: 5, templates: ['general', 'discount'], historyDays: 7 },
  },
  {
    id: 'pro',
    name: 'حرفه‌ای',
    nameEn: 'Pro',
    price: '۱۴۹,۰۰۰ تومان/ماه',
    priceNum: 149000,
    popular: true,
    features: [
      '۵۰ تولید محتوا در روز',
      'حالت پیشرفته نامحدود',
      'تمام قالب‌ها',
      'سیستم صدای برند',
      'تاریخچه نامحدود',
      'خروجی فایل',
      'پشتیبانی اولویت‌دار',
    ],
    limits: { dailyGenerations: 50, templates: 'all', historyDays: -1 },
  },
  {
    id: 'business',
    name: 'تجاری',
    nameEn: 'Business',
    price: '۳۹۹,۰۰۰ تومان/ماه',
    priceNum: 399000,
    features: [
      'تولید محتوای نامحدود',
      'حالت پیشرفته نامحدود',
      'تمام ویژگی‌های حرفه‌ای',
      'دسترسی تیمی',
      'API اختصاصی',
      'تولید انبوه',
      'برند پروفایل نامحدود',
      'پشتیبانی ۲۴/۷',
    ],
    limits: { dailyGenerations: -1, templates: 'all', historyDays: -1 },
  },
];
