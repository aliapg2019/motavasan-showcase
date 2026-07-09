import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';
import { sendEmail, generateOtpEmailHtml } from '@/lib/email';
import { sendSms, generateOtpSmsText } from '@/lib/sms';

// Generate a 6-digit OTP code
function generateOtpCode(): string {
  return crypto.randomInt(100000, 999999).toString();
}

// Rate limiting: max 3 OTP requests per target per 10 minutes
const OTP_RATE_LIMIT = 3;
const OTP_RATE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { target, type } = body; // target = email or phone, type = 'email_verification' | 'phone_verification' | 'email_login' | 'phone_login'

    if (!target || !type) {
      return NextResponse.json(
        { error: 'اطلاعات ناقص است' },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = ['email_verification', 'phone_verification', 'email_login', 'phone_login'];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: 'نوع درخواست نامعتبر است' },
        { status: 400 }
      );
    }

    // Validate target format
    if (type.includes('email')) {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(target)) {
        return NextResponse.json(
          { error: 'فرمت ایمیل معتبر نیست' },
          { status: 400 }
        );
      }
    } else {
      // Iranian phone number: 09xxxxxxxxx or +989xxxxxxxxx
      const phoneRegex = /^(\+98|0)9\d{9}$/;
      if (!phoneRegex.test(target)) {
        return NextResponse.json(
          { error: 'فرمت شماره موبایل معتبر نیست. مثال: 09123456789' },
          { status: 400 }
        );
      }
    }

    // Rate limiting check
    const recentOtps = await db.otpCode.findMany({
      where: {
        target,
        createdAt: {
          gte: new Date(Date.now() - OTP_RATE_WINDOW_MS),
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (recentOtps.length >= OTP_RATE_LIMIT) {
      return NextResponse.json(
        { error: 'تعداد درخواست کد تایید بیش از حد مجاز است. لطفاً ۱۰ دقیقه صبر کنید.' },
        { status: 429 }
      );
    }

    // For registration types, check if user already exists
    if (type === 'email_verification' || type === 'email_login') {
      const existingUser = await db.user.findUnique({ where: { email: target } });
      if (type === 'email_verification' && existingUser) {
        return NextResponse.json(
          { error: 'این ایمیل قبلاً ثبت شده است. لطفاً وارد شوید.' },
          { status: 400 }
        );
      }
      if (type === 'email_login' && !existingUser) {
        return NextResponse.json(
          { error: 'حسابی با این ایمیل یافت نشد. لطفاً ثبت‌نام کنید.' },
          { status: 400 }
        );
      }
    }

    if (type === 'phone_verification' || type === 'phone_login') {
      // Normalize phone number
      const normalizedPhone = target.startsWith('+98') ? '0' + target.slice(3) : target;
      const existingUser = await db.user.findUnique({ where: { phone: normalizedPhone } });
      if (type === 'phone_verification' && existingUser) {
        return NextResponse.json(
          { error: 'این شماره موبایل قبلاً ثبت شده است. لطفاً وارد شوید.' },
          { status: 400 }
        );
      }
      if (type === 'phone_login' && !existingUser) {
        return NextResponse.json(
          { error: 'حسابی با این شماره یافت نشد. لطفاً ثبت‌نام کنید.' },
          { status: 400 }
        );
      }
    }

    // Invalidate previous unused OTPs for this target and type
    await db.otpCode.updateMany({
      where: {
        target,
        type,
        verified: false,
        expiresAt: { gte: new Date() },
      },
      data: { expiresAt: new Date(0) }, // Expire immediately
    });

    // Generate new OTP
    const code = generateOtpCode();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

    // Find user ID if exists
    let userId: string | null = null;
    if (type.includes('email')) {
      const user = await db.user.findUnique({ where: { email: target } });
      userId = user?.id || null;
    } else {
      const normalizedPhone = target.startsWith('+98') ? '0' + target.slice(3) : target;
      const user = await db.user.findUnique({ where: { phone: normalizedPhone } });
      userId = user?.id || null;
    }

    // Store OTP in database
    await db.otpCode.create({
      data: {
        userId,
        target,
        code,
        type,
        expiresAt,
      },
    });

    // Send OTP via appropriate channel
    if (type.includes('email')) {
      // ===== EMAIL OTP =====
      // Email sending is controlled by EMAIL_ENABLED env variable
      // When disabled (default), OTP is only logged and returned in dev mode
      // When enabled (production with hosting), actual email is sent
      const emailSent = await sendEmail({
        to: target,
        subject: 'کد تایید محتواسان',
        html: generateOtpEmailHtml(code, 5),
        text: `کد تایید شما: ${code} - این کد تا ۵ دقیقه معتبر است`,
      });

      if (emailSent) {
        console.log(`[OTP EMAIL SENT] To: ${target}, Type: ${type}`);
      } else {
        console.log(`[OTP EMAIL NOT SENT] To: ${target}, Code: ${code}, Type: ${type} - Email disabled or misconfigured`);
      }
    } else {
      // ===== SMS OTP =====
      // SMS sending is controlled by SMS_ENABLED env variable
      // When disabled (default), OTP is only logged and returned in dev mode
      // When enabled (with Melipayamak API key), actual SMS is sent
      const normalizedPhone = target.startsWith('+98') ? '0' + target.slice(3) : target;
      const smsResult = await sendSms(normalizedPhone, generateOtpSmsText(code));

      if (smsResult.success) {
        console.log(`[OTP SMS SENT] To: ${normalizedPhone}, Type: ${type}`);
      } else {
        console.log(`[OTP SMS NOT SENT] To: ${normalizedPhone}, Code: ${code}, Type: ${type} - SMS disabled or misconfigured`);
      }
    }

    // In development, return the OTP code so it can be displayed for testing
    const isDev = process.env.NODE_ENV !== 'production';

    return NextResponse.json({
      message: type.includes('email')
        ? 'کد تایید به ایمیل شما ارسال شد'
        : 'کد تایید به شماره موبایل شما پیامک شد',
      expiresIn: 300, // 5 minutes in seconds
      ...(isDev ? { _dev_code: code } : {}), // Only in development
    });
  } catch (error) {
    console.error('Send OTP error:', error);
    return NextResponse.json(
      { error: 'خطا در ارسال کد تایید. لطفاً دوباره تلاش کنید.' },
      { status: 500 }
    );
  }
}
