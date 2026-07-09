// Persian Marketing Prompt Engine
// Builds dynamic prompts optimized for Persian language and Iranian market behavior

export interface GenerationInput {
  productName: string;
  category: string;
  price?: string;
  audience?: string;
  tone: string;
  goal: string;
  templateType: string;
  brandProfile?: {
    name: string;
    tone: string;
    formality: string;
    emojiLevel: string;
    slangLevel: string;
  };
  // Advanced parameters
  advanced?: boolean;
  contentLength?: string;
  platform?: string;
  ctaType?: string;
  customInstructions?: string;
  competitorName?: string;
  uniqueSellingPoint?: string;
  includeStoryStrategy?: boolean;
  includeSEOKeywords?: boolean;
  includeCallToAction?: boolean;
  emotionTrigger?: string;
  targetScenario?: string;
  hashtagCount?: number;
  captionCount?: number;
}

const TONE_INSTRUCTIONS: Record<string, string> = {
  formal: 'از لحن رسمی و محترمانه استفاده کن. جملات ساختاریافته و حرفه‌ای باشند.',
  informal: 'از لحن صمیمی و دوستانه استفاده کن. مثل یک دوست که محصول را پیشنهاد می‌دهد.',
  luxury: 'از لحن لوکس و خاص استفاده کن. کلمات نشان‌دهنده کیفیت بالا و منحصربفرد بودن باشند.',
  friendly: 'از لحن گرم و صمیمی استفاده کن. مخاطب را مثل یک آشنا خطاب قرار بده.',
  aggressive: 'از لحن فروش قوی و فوری استفاده کن. حس فوریت و ضرورت خرید ایجاد کن.',
  persuasive: 'از لحن متقاعدکننده استفاده کن. با استدلال منطقی و احساسی مخاطب را متقاعد کن.',
  educational: 'از لحن آموزشی و راهنما استفاده کن. مخاطب را با اطلاعات مفید آشنا کن.',
  emotional: 'از لحن احساسی و عمیق استفاده کن. به احساسات مخاطب توجه ویژه داشته باش.',
  humorous: 'از لحن طنز و بامزه استفاده کن. مخاطب را بخندان و در عین حال به محصول علاقه‌مند کن.',
};

const GOAL_INSTRUCTIONS: Record<string, string> = {
  sell: 'هدف اصلی فروش مستقیم است. روی مزایای محصول و دلیل خرید تمرکز کن. CTA قوی برای خرید داشته باش.',
  inform: 'هدف اطلاع‌رسانی است. ویژگی‌ها و مشخصات محصول را کامل توضیح بده.',
  promote: 'هدف تبلیغ و برندسازی است. روی هویت برند و ارزش پیشنهادی تمرکز کن.',
  discount: 'هدف تبلیغ تخفیف است. روی صرفه‌جویی و محدودیت زمانی تاکید کن. حس فوریت ایجاد کن.',
  engagement: 'هدف ایجاد تعامل و کامنت است. سوالات درگیرکننده بپرس و مخاطب را به مشارکت تشویق کن.',
  awareness: 'هدف آگاهی از برند است. روی معرفی برند، ارزش‌ها و ماموریت آن تمرکز کن.',
  loyalty: 'هدف حفظ مشتری فعلی است. روی مزایای خرید مجدد، وفاداری و جایزه تمرکز کن.',
  viral: 'هدف ویرال شدن محتواست. محتوای خلاقانه، جنجالی یا بسیار جذاب تولید کن که احتمال به اشتراک‌گذاری بالایی داشته باشد.',
};

const TEMPLATE_INSTRUCTIONS: Record<string, string> = {
  general: 'محتوای عمومی و همه‌کاره تولید کن.',
  discount: 'کمپین تخفیف طراحی کن. درصد تخفیف، محدودیت زمانی و حس فوریت داشته باش. از کلماتی مثل "فرصت محدود"، "فقط امروز"، "پیشنهاد ویژه" استفاده کن.',
  launch: 'محتوای معرفی محصول جدید تولید کن. روی نوآوری و اولین بودن تاکید کن. حس کنجکاوی ایجاد کن.',
  seasonal: 'کمپین فصلی طراحی کن. مناسب مناسبت‌های ایرانی مثل نوروز، یلدا، رمضان و... باشد.',
  urgency: 'محتوای با حس فوریت تولید کن. از تکنیک‌های کمیابی و محدودیت استفاده کن. "آخرین تعداد"، "تمام شدن موجودی" و...',
  luxury: 'محتوای لوکس و خاص تولید کن. روی کیفیت برتر، منحصربفرد بودن و تجربه خاص تمرکز کن.',
  budget: 'محتوای اقتصادی تولید کن. روی قیمت مناسب، ارزش خرید و مقایسه با رقبا تمرکز کن.',
};

const PLATFORM_INSTRUCTIONS: Record<string, string> = {
  instagram: 'محتوا مخصوص اینستاگرام باشد. از هشتگ، ایموجی و CTA مناسب اینستاگرام استفاده کن. کپشن‌ها برای فید اینستاگرام بهینه باشند.',
  telegram: 'محتوا مخصوص تلگرام باشد. متن‌ها ساختاریافته با بولت‌پوینت و لینک باشند. مناسب کانال‌های تلگرامی.',
  twitter: 'محتوا مخصوص توییتر باشد. متن‌ها کوتاه و تاثیرگذار باشند (زیر ۲۸۰ کاراکتر). مناسب توییت فارسی.',
  linkedin: 'محتوا مخصوص لینکدین باشد. لحن حرفه‌ای و تجاری داشته باشد. مناسب پست‌های لینکدین.',
  whatsapp: 'محتوا مخصوص واتساپ باشد. متن‌ها کوتاه و مستقیم باشند. مناسب ارسال پیام خصوصی.',
  all: 'محتوا برای همه پلتفرم‌ها مناسب باشد. همه‌کاره و انعطاف‌پذیر تولید کن.',
};

const CTA_INSTRUCTIONS: Record<string, string> = {
  link: 'دعوت به اقدام: کلیک روی لینک بایو',
  dm: 'دعوت به اقدام: ارسال دایرکت',
  comment: 'دعوت به اقدام: کامنت گذاشتن',
  call: 'دعوت به اقدام: تماس تلفنی',
  save: 'دعوت به اقدام: ذخیره پست',
  share: 'دعوت به اقدام: به اشتراک‌گذاری با دوستان',
  follow: 'دعوت به اقدام: فالو پیج',
};

const LENGTH_INSTRUCTIONS: Record<string, string> = {
  short: 'محتوا کوتاه و مختصر باشد. کپشن‌ها ۱-۲ خط، تبلیغ کوتاه و مستقیم.',
  medium: 'محتوا با طول متوسط باشد. کپشن‌ها ۳-۵ خط، توضیحات مناسب.',
  long: 'محتوا مفصل و جامع باشد. کپشن‌ها ۶ خط یا بیشتر، جزئیات کامل.',
};

const PERSIAN_MARKETING_PSYCHOLOGY = `
قوانین روانشناسی فروش در بازار ایران:
- از حس اعتماد و اطمینان استفاده کن (تضمین کیفیت، مرجوعی رایگان)
- از اصل کمیابی بهره ببر (تعداد محدود، زمان محدود)
- از اثر اجتماعی استفاده کن (خریداران قبلی، محبوبیت محصول)
- از حس تعلق و هویت ایرانی استفاده کن (ساخت ایران، مناسب سلیقه ایرانی)
- CTA واضح و مستقیم داشته باش (لینک بایو، دایرکت بده، کامنت بزن)
- از سوالات درگیرکننده استفاده کن (آیا شما هم این مشکل رو داری؟)
- قیمت‌گذاری را هوشمند ارائه بده (مقایسه، ارزش روز، تخفیف واقعی)
`;

function buildEmojiInstruction(level: string): string {
  switch (level) {
    case 'none': return 'از هیچ ایموجی استفاده نکن.';
    case 'minimal': return 'حداکثر ۱-۲ ایموجی در کل متن استفاده کن.';
    case 'moderate': return 'به اندازه مناسب از ایموجی استفاده کن (۳-۵ تا در هر بخش).';
    case 'heavy': return 'از ایموجی‌های فراوان و جذاب استفاده کن. متن باید پرانرژی و رنگارنگ باشد.';
    default: return 'به اندازه مناسب از ایموجی استفاده کن.';
  }
}

function buildSlangInstruction(level: string): string {
  switch (level) {
    case 'none': return 'از اصطلاحات عامیانه استفاده نکن. زبان معیار و فارسی رسمی باشد.';
    case 'light': return 'از اصطلاحات رایج و سبک فارسی محاوره‌ای استفاده کن (مثل "راستی"، "ببین").';
    case 'moderate': return 'از اصطلاحات و واژگان محاوره‌ای رایج بازار ایران استفاده کن (مثل "گرون‌تر از این"، "قیمت رو باور نمی‌کنی").';
    case 'heavy': return 'از اصطلاحات خیلی عامیانه و زبان کوچه و بازار استفاده کن (مثل "بدجور"، "خفن"، "فوق‌العاده").';
    default: return 'از اصطلاحات رایج فارسی محاوره‌ای استفاده کن.';
  }
}

export function buildPrompt(input: GenerationInput): string {
  const toneInstruction = TONE_INSTRUCTIONS[input.tone] || TONE_INSTRUCTIONS.friendly;
  const goalInstruction = GOAL_INSTRUCTIONS[input.goal] || GOAL_INSTRUCTIONS.sell;
  const templateInstruction = TEMPLATE_INSTRUCTIONS[input.templateType] || TEMPLATE_INSTRUCTIONS.general;

  let brandInstruction = '';
  if (input.brandProfile) {
    brandInstruction = `
تنظیمات برند: ${input.brandProfile.name}
- لحن برند: ${input.brandProfile.tone}
- رسمیت: ${input.brandProfile.formality}
${buildEmojiInstruction(input.brandProfile.emojiLevel)}
${buildSlangInstruction(input.brandProfile.slangLevel)}
`;
  }

  const priceContext = input.price ? `قیمت محصول: ${input.price} تومان` : '';
  const audienceContext = input.audience ? `مخاطب هدف: ${input.audience}` : '';

  // Advanced mode instructions
  let advancedInstructions = '';
  if (input.advanced) {
    advancedInstructions = '\n=== تنظیمات پیشرفته ===\n';

    if (input.platform && PLATFORM_INSTRUCTIONS[input.platform]) {
      advancedInstructions += `\nپلتفرم هدف: ${PLATFORM_INSTRUCTIONS[input.platform]}\n`;
    }

    if (input.contentLength && LENGTH_INSTRUCTIONS[input.contentLength]) {
      advancedInstructions += `\nطول محتوا: ${LENGTH_INSTRUCTIONS[input.contentLength]}\n`;
    }

    if (input.ctaType && CTA_INSTRUCTIONS[input.ctaType]) {
      advancedInstructions += `\n${CTA_INSTRUCTIONS[input.ctaType]}\n`;
    }

    if (input.emotionTrigger) {
      advancedInstructions += `\nمحرک احساسی: روی "${input.emotionTrigger}" در محتوا تمرکز کن و این احساس را در مخاطب بیدار کن.\n`;
    }

    if (input.uniqueSellingPoint) {
      advancedInstructions += `\nنقطه تمایز محصول: "${input.uniqueSellingPoint}" - این ویژگی منحصربفرد را در محتوا برجسته کن.\n`;
    }

    if (input.competitorName) {
      advancedInstructions += `\nمقایسه با رقبا: به طور غیرمستقیم با "${input.competitorName}" مقایسه کن و مزایای محصول خود را نشان بده.\n`;
    }

    if (input.targetScenario) {
      advancedInstructions += `\nسناریو/بستر: محتوا مناسب "${input.targetScenario}" باشد.\n`;
    }

    if (input.includeStoryStrategy) {
      advancedInstructions += `\nاستراتژی استوری: برای بخش stories، یک داستان ۵ اسلایدی منسجم با سیر داستانی تولید کن (شروع → مشکل → راه‌حل → نتیجه → CTA).\n`;
    }

    if (input.includeSEOKeywords) {
      advancedInstructions += `\nکلمات کلیدی SEO: در کپشن‌ها و هشتگ‌ها از کلمات کلیدی مرتبط با محصول و دسته‌بندی استفاده کن که برای جستجوی اینستاگرام و گوگل بهینه باشند.\n`;
    }

    if (!input.includeCallToAction) {
      advancedInstructions += `\nبدون CTA: این بار دعوت به اقدام صریح اضافه نکن. محتوا بیشتر اطلاع‌رسانی و برندسازی باشد.\n`;
    }

    if (input.customInstructions) {
      advancedInstructions += `\nدستورالعمل سفارشی کاربر: ${input.customInstructions}\n`;
    }

    advancedInstructions += `\nتعداد کپشن: ${input.captionCount || 3} کپشن تولید کن.\n`;
    advancedInstructions += `تعداد هشتگ: ${input.hashtagCount || 15} هشتگ تولید کن.\n`;
  }

  const captionCountStr = input.advanced ? (input.captionCount || 3) : 3;
  const hashtagCountStr = input.advanced ? (input.hashtagCount || 15) : 15;

  return `تو یک متخصص تولید محتوای فروش و بازاریابی دیجیتال برای بازار ایران هستی. محتوایی که تولید می‌کنی باید حتماً فارسی، طبیعی و متقاعدکننده باشد.
${input.advanced ? '\nاین یک درخواست تولید محتوای پیشرفته است. با دقت تمام تنظیمات سفارشی کاربر را رعایت کن و محتوای حرفه‌ای‌تر و دقیق‌تر تولید کن.\n' : ''}
${PERSIAN_MARKETING_PSYCHOLOGY}

اطلاعات محصول:
- نام محصول: ${input.productName}
- دسته‌بندی: ${input.category}
${priceContext}
${audienceContext}

دستورالعمل لحن: ${toneInstruction}
دستورالعمل هدف: ${goalInstruction}
دستورالعمل قالب: ${templateInstruction}
${brandInstruction}
${advancedInstructions}

قوانین مهم:
1. محتوا حتماً به زبان فارسی باشد
2. از لحن طبیعی و غیررباتی استفاده کن
3. هر بخش باید CTA (دعوت به اقدام) واضح داشته باشد
4. از هشتگ‌های فارسی و انگلیسی مرتبط استفاده کن
5. متن‌ها برای اینستاگرام و شبکه‌های اجتماعی ایران بهینه باشند
6. از تکنیک‌های روانشناسی فروش ایرانی استفاده کن
7. محتوا نباید عمومی و کلیشه‌ای باشد، بلکه خاص و جذاب باشد

خروجی را حتماً به صورت JSON با ساختار زیر تولید کن:
{
  "captions": ["کپشن اول (حداقل ۳ خط)", "کپشن دوم (حداقل ۳ خط)", "کپشن سوم (حداقل ۳ خط)"],
  "stories": ["متن اسلاید ۱", "متن اسلاید ۲", "متن اسلاید ۳", "متن اسلاید ۴", "متن اسلاید ۵"],
  "reels_script": {
    "hook": "قلاب اولیه (جملات اول ویدیو که توجه را جلب می‌کند)",
    "body": "بدنه اصلی اسکریپت ریلز",
    "cta": "دعوت به اقدام پایان ویدیو"
  },
  "ads": {
    "short": "متن تبلیغ کوتاه (۱-۲ خط)",
    "long": "متن تبلیغ بلند (۴-۶ خط)"
  },
  "hashtags": ["هشتگ۱", "هشتگ۲", ...]
}

دقت کن ${captionCountStr} کپشن و ${hashtagCountStr} هشتگ تولید کنی.

فقط JSON خروجی بده، هیچ متن اضافه‌ای ننویس.`;
}
