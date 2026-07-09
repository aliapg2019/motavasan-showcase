# محتواسان

پلتفرم تولید محتوای فارسی با هوش مصنوعی برای کسب‌وکارهای آنلاین ایرانی.
شامل کپشن اینستاگرام، استوری، اسکریپت ریلز، تبلیغات و هشتگ.

[English](#english) | [نصب و راه‌اندازی](#نصب-و-راه‌اندازی)

---

## معرفی

محتواسان یک اپلیکیشن وب است که با دریافت اطلاعات محصول (نام، دسته‌بندی، قیمت،
مخاطب هدف) و ترجیحات برند (لحن، فرمالیته، میزان ایموجی و عامیانه)، محتوای
بازاریابی فارسی تولید می‌کند. خروجی به صورت JSON ساختاریافته شامل چند کپشن،
استوری، اسکریپت ریلز، متن تبلیغ و لیست هشتگ است.

مدل زبانی پیش‌فرض: GLM-4.5-Flash از طریق اندپوینت OpenAI-compatible شرکت
ZAI / BigModel. این مدل پشتیبانی خوبی از زبان فارسی دارد و هزینه توکن آن
مناسب است.

---

## امکانات

- **تولید محتوای چندکاناله**: کپشن، استوری، اسکریپت ریلز، متن تبلیغ، هشتگ
- **پروفایل برند**: تعریف لحن، فرمالیته، سطح ایموجی و عامیانه برای هر برند
- **قالب‌های بازاریابی**: تخفیف، رونمایی، فصلی، فوریت، لوکس، اقتصادی
- **احراز هویت**: ثبت‌نام با ایمیل/شماره، ورود با OTP، بازیابی رمز عبور
- **امنیت ضدایمیل‌فیک**: بلاک‌لیست ۱۰۰۰+ دامنه موقت + تشخیص dot trick جیمیل
- **پلن‌ها و سهمیه**: پلن رایگان (۵ در روز)، Pro (۵۰ در روز)، Business (نامحدود)
- **پنل ادمین**: مدیریت کاربران، آمار، تیکت‌های پشتیبانی
- **تاریخچه تولیدها**: جستجو، فیلتر و ذخیره نسخه‌ها
- **پشتیبانی**: سیستم تیکت داخلی

---

## تکنولوژی‌ها

| لایه | تکنولوژی |
|------|----------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Framer Motion |
| Backend | Next.js API Routes, Prisma ORM, SQLite |
| Auth | JWT (jose) + bcryptjs, OTP via email/SMS |
| AI | GLM-4.5-Flash via OpenAI-compatible REST endpoint |
| Email/SMS | Nodemailer + MeliPayamak (اختیاری) |
| Deployment | Node.js standalone + Caddy/Nginx + PM2 |

---

## نصب و راه‌اندازی

### پیش‌نیازها

- Node.js 20+ و npm
- یک کلید API از [ZAI / BigModel](https://z.ai/manage-apikey/apikey-list)

### مراحل

```bash
# 1. نصب وابستگی‌ها
npm install

# 2. کپی فایل env نمونه
cp .env.example .env
# ویرایش .env و قرار دادن ZAI_API_KEY و JWT_SECRET

# 3. ساخت دیتابیس
npx prisma db push

# 4. اجرای پروژه در حالت توسعه
npm run dev
```

سپس به `http://localhost:3000` بروید.

### متغیرهای محیطی

| متغیر | توضیح | اجباری |
|-------|-------|--------|
| `DATABASE_URL` | مسیر فایل SQLite | بله |
| `ZAI_API_KEY` | کلید API سرویس هوش مصنوعی | بله |
| `ZAI_MODEL` | نام مدل (پیش‌فرض: glm-4.5-flash) | خیر |
| `ZAI_ENDPOINT` | اندپوینت API (پیش‌فرض تنظیم شده) | خیر |
| `JWT_SECRET` | رشته تصادفی حداقل ۳۲ کاراکتر | بله |
| `APP_URL` | آدرس کامل اپ (برای لینک ایمیل/SMS) | خیر |
| `SMTP_*` | تنظیمات سرور ایمیل | خیر |
| `MELIPAYAMAK_*` | تنظیمات سرویس پیامک | خیر |

تولید JWT_SECRET:

```bash
openssl rand -hex 32
```

### بیلد_production

```bash
npm run build
npm start
```

خروجی standalone در `.next/standalone/` قرار می‌گیرد که قابل کپی به سرور است.

---

## ساختار پروژه

```
.
├── prisma/
│   └── schema.prisma          # اسکیمای دیتابیس
├── public/
│   ├── logo.svg               # لوگوی برند
│   ├── logo-full.svg          # لوگوی افقی با تایپوگرافی
│   └── favicon.svg
├── src/
│   ├── app/
│   │   ├── api/               # API Routes
│   │   │   ├── auth/          # login, register, OTP, password reset
│   │   │   ├── generate/      # endpoint اصلی تولید محتوا
│   │   │   ├── generations/   # تاریخچه
│   │   │   ├── brand-profiles/
│   │   │   ├── templates/
│   │   │   ├── billing/
│   │   │   ├── subscriptions/
│   │   │   ├── usage/
│   │   │   ├── admin/
│   │   │   └── support/
│   │   ├── components/        # کامپوننت‌های صفحه
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/ui/         # کامپوننت‌های shadcn/ui
│   ├── hooks/
│   └── lib/
│       ├── ai.ts              # لایه ارتباط با ZAI/GLM
│       ├── auth.ts            # JWT helpers
│       ├── db.ts              # Prisma client
│       ├── prompt-engine.ts   # موتور ساخت پرامپت فارسی
│       ├── email-validator.ts # بلاک‌لیست ایمیل موقت
│       ├── email.ts           # ارسال ایمیل
│       ├── sms.ts             # ارسال پیامک
│       ├── templates.ts       # قالب‌های بازاریابی
│       └── utils.ts
├── Caddyfile                  # نمونه کانفیگ Caddy برای پروداکشن
├── .env.example
└── package.json
```

---

## مدل‌های دیتابیس

- **User** — حساب کاربری، پلن، نقش (user/admin)
- **Subscription** — اشتراک فعال
- **Generation** — هر بار تولید محتوا
- **BrandProfile** — پروفایل برند با تنظیمات لحن
- **Template** — قالب‌های بازاریابی از پیش تعریف‌شده
- **UsageLog** — لاگ مصرف توکن
- **SupportMessage** — تیکت پشتیبانی
- **PasswordResetToken** / **OtpCode** / **LoginAttempt** — امنیت و احراز هویت

---

## دیپلوی

### با Caddy + PM2 (توصیه‌شده)

```bash
# روی سرور:
npm install -g pm2
npm run build
pm2 start .next/standalone/server.js --name motavasan
pm2 save
pm2 startup
```

نمونه `Caddyfile` برای پراکسی روی پورت ۸۰:

```caddy
:80 {
    reverse_proxy localhost:3000
}
```

برای دامنه واقعی، خط اول را به `yourdomain.com` تغییر دهید تا Caddy به‌طور
خودکار SSL بگیرد.

---

## ربات تلگرام

پروژه شامل یک ربات تلگرام است که از همون دیتابیس و هوش مصنوعی سایت استفاده
می‌کنه. کاربران می‌تونن از طریق تلگرام هم محتوای بازاریابی تولید کنن.

### پیش‌نیازها

- یک توکن ربات از [@BotFather](https://t.me/BotFather) (`/newbot`)
- تنظیم `BOT_TOKEN` در فایل `.env`

### اجرای ربات

```bash
# در محیط توسعه
npm run bot

# در پروداکشن (با PM2)
npm run build
npx tsc bot/index.ts --outDir bot/dist
pm2 start bot/dist/index.js --name motavasan-bot
pm2 save
```

### دستورات ربات

| دستور | کاربرد |
|-------|--------|
| `/start` | معرفی + ثبت‌نام خودکار |
| `/new` | شروع فرآیند تولید محتوا (مرحله‌به‌مرحله) |
| `/history` | نمایش ۵ تولید اخیر با دکمه‌های inline |
| `/usage` | نمایش سهمیه باقی‌مانده و پلن |
| `/brand` | مدیریت پروفایل‌های برند |
| `/help` | راهنمای کامل |
| `/cancel` | لغو فرآیند جاری |

### معماری ربات

```
┌──────────────────┐     ┌──────────────────┐
│   Telegram API   │────▶│   bot/index.ts   │
│   (long polling) │◀────│  (Node.js bot)   │
└──────────────────┘     └────────┬─────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │  Prisma (shared SQLite) │
                    │  + lib/ai.ts (GLM)      │
                    │  + lib/prompt-engine.ts │
                    └─────────────────────────┘
```

ربات و سایت همون دیتابیس و سهمیه رو اشتراک می‌گذارن. هر کاربر تلگرام
به‌صورت خودکار یک اکانت با ایمیل `tg_{chatId}@motavasan.local` می‌سازه و
اولین کاربر ادمین می‌شه.

---

## امنیت

- رمز عبور با bcryptjs هش می‌شود
- JWT با HS256، انقضای ۷ روز
- بلاک‌لیست ایمیل‌های موقت برای جلوگیری از ثبت‌نام فیک
- تشخیص Gmail dot trick و plus aliasing
- rate limit روی API تولید محتوا (بر اساس پلن کاربر)
- کلید API هوش مصنوعی فقط روی سرور استفاده می‌شود — هرگز به کلاینت نمی‌رود

---

## لایسنس

این پروژه متعلق به صاحب آن است و استفاده از سورس کد بدون اجازه ممنوع است.

---

## English

A Persian-language AI content generation SaaS for Iranian online businesses.
Accepts product info (name, category, price, audience) and brand voice
preferences, then returns structured marketing content: Instagram captions,
stories, reels scripts, ads, and hashtags.

**Stack**: Next.js 16, React 19, TypeScript, Tailwind 4, shadcn/ui, Prisma,
SQLite, JWT, GLM-4.5-Flash (via OpenAI-compatible endpoint).

See the Persian section above for installation and configuration. Key points:

1. `npm install && cp .env.example .env`
2. Set `ZAI_API_KEY` (from https://z.ai/manage-apikey/apikey-list) and a random
   `JWT_SECRET` (>=32 chars)
3. `npx prisma db push`
4. `npm run dev` → http://localhost:3000
