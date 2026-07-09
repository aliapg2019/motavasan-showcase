# محتواسان

> پلتفرم تولید محتوای فارسی با هوش مصنوعی برای کسب‌وکارهای آنلاین ایرانی

<p align="center">
  <img src="public/logo-full.svg" alt="محتواسان" width="320" />
</p>

---

## درباره پروژه

محتواسان یک SaaS برای تولید محتوای بازاریابی فارسی است. کسب‌وکارها اطلاعات
محصول و ترجیحات برندشان را وارد می‌کنند و پلتفرم به‌صورت خودکار کپشن
اینستاگرام، استوری، اسکریپت ریلز، متن تبلیغ و هشتگ تولید می‌کند.

مدل زبانی پیش‌فرض: **GLM-4.5-Flash** از طریق اندپوینت OpenAI-compatible شرکت
ZAI / BigModel. این مدل پشتیبانی خوبی از زبان فارسی دارد و هزینه توکن آن
مناسب است.

🌐 **دموی زنده**: به‌زودی روی دامنه اختصاصی

---

## امکانات کلیدی

- 🎯 **تولید محتوای چندکاناله** — کپشن، استوری، ریلز، تبلیغ، هشتگ در یک درخواست
- 🎨 **پروفایل برند** — تعریف لحن، فرمالیته، میزان ایموجی و عامیانه برای هر برند
- 📋 **قالب‌های بازاریابی** — تخفیف، رونمایی، فصلی، فوریت، لوکس، اقتصادی
- 🔐 **احراز هویت کامل** — ثبت‌نام با ایمیل/شماره، ورود با OTP، بازیابی رمز
- 🛡️ **امنیت ضدایمیل‌فیک** — بلاک‌لیست ۱۰۰۰+ دامنه موقت + تشخیص dot trick جیمیل
- 💳 **سیستم پلن** — رایگان (۵/روز)، Pro (۵۰/روز)، Business (نامحدود)
- 👨‍💼 **پنل ادمین** — مدیریت کاربران، آمار، تیکت‌های پشتیبانی
- 📚 **تاریخچه تولیدها** — جستجو، فیلتر و ذخیره نسخه‌ها

---

## تکنولوژی‌ها

| لایه | تکنولوژی |
|------|----------|
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Framer Motion |
| Backend | Next.js API Routes, Prisma ORM, SQLite |
| Auth | JWT (jose) + bcryptjs, OTP via email/SMS |
| AI | GLM-4.5-Flash via OpenAI-compatible REST endpoint |
| Email/SMS | Nodemailer + Melipayamak (اختیاری) |
| Deployment | Node.js standalone + Caddy + PM2 |

---

## معماری

```
┌──────────────────────────────────────────────────────┐
│                      Client (RTL UI)                  │
│         Next.js App Router + React 19 + Tailwind 4    │
└──────────────────────┬───────────────────────────────┘
                       │ HTTPS / JWT
┌──────────────────────▼───────────────────────────────┐
│                  Next.js API Routes                   │
│   /api/auth   /api/generate   /api/billing   /api/... │
└──────┬─────────────────────┬──────────────────────────┘
       │                     │
       ▼                     ▼
┌─────────────┐     ┌──────────────────┐
│  Prisma ORM │     │   AI Provider    │
│   SQLite    │     │  GLM-4.5-Flash   │
└─────────────┘     │  (OpenAI-compat) │
                    └──────────────────┘
```

---

## ساختار پروژه

```
.
├── prisma/
│   └── schema.prisma              # اسکیمای دیتابیس
├── public/
│   ├── logo.svg                   # لوگوی برند
│   ├── logo-full.svg              # لوگوی افقی با تایپوگرافی
│   └── favicon.svg
├── src/
│   ├── app/
│   │   ├── api/                   # API Routes
│   │   │   ├── auth/              # login, register, OTP, password reset
│   │   │   ├── generate/          # endpoint تولید محتوا
│   │   │   ├── generations/       # تاریخچه
│   │   │   ├── brand-profiles/    # پروفایل‌های برند
│   │   │   ├── templates/         # قالب‌ها
│   │   │   ├── billing/           # پلن و صورتحساب
│   │   │   ├── subscriptions/     # اشتراک
│   │   │   ├── usage/             # لاگ مصرف
│   │   │   ├── admin/             # پنل ادمین
│   │   │   └── support/           # تیکت پشتیبانی
│   │   ├── components/            # کامپوننت‌های صفحه
│   │   │   ├── AuthScreen.tsx
│   │   │   ├── DashboardTab.tsx
│   │   │   ├── GeneratorTab.tsx
│   │   │   ├── HistoryTab.tsx
│   │   │   ├── BrandVoiceTab.tsx
│   │   │   ├── BillingTab.tsx
│   │   │   ├── SupportTab.tsx
│   │   │   ├── AdminTab.tsx
│   │   │   ├── LandingPage.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Header.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/ui/             # کامپوننت‌های shadcn/ui
│   ├── hooks/
│   └── lib/
│       ├── ai.ts                  # لایه ارتباط با GLM
│       ├── auth.ts                # JWT helpers
│       ├── db.ts                  # Prisma client
│       ├── prompt-engine.ts       # موتور ساخت پرامپت فارسی
│       ├── email-validator.ts     # بلاک‌لیست ایمیل موقت
│       ├── email.ts               # ارسال ایمیل
│       ├── sms.ts                 # ارسال پیامک
│       ├── templates.ts           # قالب‌های بازاریابی
│       └── utils.ts
├── Caddyfile                      # نمونه کانفیگ Caddy
├── .env.example                   # نمونه متغیرهای محیطی
└── package.json
```

---

## مدل‌های دیتابیس

| مدل | کاربرد |
|-----|--------|
| `User` | حساب کاربری، پلن، نقش (user/admin) |
| `Subscription` | اشتراک فعال کاربر |
| `Generation` | هر بار تولید محتوا |
| `BrandProfile` | پروفایل برند با تنظیمات لحن |
| `Template` | قالب‌های بازاریابی از پیش تعریف‌شده |
| `UsageLog` | لاگ مصرف توکن |
| `SupportMessage` | تیکت پشتیبانی |
| `PasswordResetToken` / `OtpCode` / `LoginAttempt` | امنیت و احراز هویت |

---

## نصب و راه‌اندازی

### پیش‌نیازها

- Node.js 20+ و npm
- یک کلید API از [ZAI / BigModel](https://z.ai/manage-apikey/apikey-list)

### مراحل

```bash
# 1. کلون پروژه
git clone https://github.com/aliapg2019/motavasan-showcase.git
cd motavasan-showcase

# 2. نصب وابستگی‌ها
npm install

# 3. کپی فایل env نمونه
cp .env.example .env
# ویرایش .env و قرار دادن ZAI_API_KEY و JWT_SECRET

# 4. ساخت دیتابیس
npx prisma db push

# 5. اجرای پروژه در حالت توسعه
npm run dev
```

سپس به `http://localhost:3000` بروید.

### متغیرهای محیطی

| متغیر | توضیح | اجباری |
|-------|-------|--------|
| `DATABASE_URL` | مسیر فایل SQLite | بله |
| `ZAI_API_KEY` | کلید API سرویس هوش مصنوعی | بله |
| `ZAI_MODEL` | نام مدل (پیش‌فرض: glm-4.5-flash) | خیر |
| `JWT_SECRET` | رشته تصادفی حداقل ۳۲ کاراکتر | بله |
| `APP_URL` | آدرس کامل اپ (برای لینک ایمیل/SMS) | خیر |
| `SMTP_*` | تنظیمات سرور ایمیل | خیر |
| `MELIPAYAMAK_*` | تنظیمات سرویس پیامک | خیر |

تولید JWT_SECRET:

```bash
openssl rand -hex 32
```

---

## جریان تولید محتوا

```
1. کاربر فرم تولید را پر می‌کند (نام محصول، دسته، قیمت، مخاطب، لحن)
       │
       ▼
2. POST /api/generate  →  احراز هویت JWT + بررسی سهمیه پلن
       │
       ▼
3. prompt-engine.ts پرامپت فارسی می‌سازد بر اساس ورودی + پروفایل برند
       │
       ▼
4. lib/ai.ts درخواست به GLM-4.5-Flash (thinking disabled)
       │
       ▼
5. پاسخ JSON پارس می‌شود: { captions, stories, reels_script, ads, hashtags }
       │
       ▼
6. در دیتابیس ذخیره می‌شود + UsageLog برای شمارش توکن
       │
       ▼
7. نتیجه به کلاینت برمی‌گردد + تعداد باقی‌مانده از سهمیه
```

---

## دیپلوی

### با Caddy + PM2

```bash
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

## امنیت

- رمز عبور با bcryptjs هش می‌شود (salt rounds: 12)
- JWT با HS256، انقضای ۷ روز
- بلاک‌لیست ایمیل‌های موقت برای جلوگیری از ثبت‌نام فیک
- تشخیص Gmail dot trick و plus aliasing
- rate limit روی API تولید محتوا (بر اساس پلن کاربر)
- کلید API هوش مصنوعی فقط روی سرور استفاده می‌شود — هرگز به کلاینت نمی‌رود

---

## لایسنس

© 2025 محتواسان. تمام حقوق محفوظ است.

این پروژه به‌صورت سورس‌باز منتشر شده اما استفاده تجاری و کپی‌برداری بدون
اجازه ممنوع است. برای همکاری یا سوال از طریق گیت‌هاب تماس بگیرید.
