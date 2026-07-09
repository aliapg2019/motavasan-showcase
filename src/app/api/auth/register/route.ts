import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';
import { validateEmailSecurity, normalizeEmail } from '@/lib/email-validator';

const MAX_REGISTRATIONS_PER_IP = 3;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_PER_DOMAIN = 5;
const DOMAIN_RATE_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('رمز عبور باید حداقل ۸ کاراکتر باشد');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('حداقل یک حرف بزرگ انگلیسی (A-Z)');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('حداقل یک حرف کوچک انگلیسی (a-z)');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('حداقل یک عدد (0-9)');
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('حداقل یک نماد خاص (!@#$%...)');
  }

  const commonPasswords = ['12345678', 'password', 'Password1', 'qwerty123', 'Aa123456', 'Pass1234', 'Password123'];
  if (commonPasswords.some(cp => password.toLowerCase() === cp.toLowerCase())) {
    errors.push('این رمز عبور بسیار رایج است. لطفاً رمز عبور قوی‌تر انتخاب کنید');
  }

  return { valid: errors.length === 0, errors };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, password, phone } = body;

    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';

    if (!email || !password) {
      return NextResponse.json(
        { error: 'ایمیل و رمز عبور الزامی است' },
        { status: 400 }
      );
    }

    if (!name || name.trim().length < 2) {
      return NextResponse.json(
        { error: 'نام باید حداقل ۲ کاراکتر باشد' },
        { status: 400 }
      );
    }

    const emailValidation = validateEmailSecurity(email);
    if (!emailValidation.isValid) {
      return NextResponse.json(
        { error: emailValidation.reason },
        { status: 400 }
      );
    }

    // Normalize to catch Gmail dot tricks: test@gmail.com == t.e.s.t@gmail.com
    const normalizedEmail = normalizeEmail(email);

    // Rate limit by IP using the loginAttempt table
    const recentAttemptsByIp = await db.loginAttempt.count({
      where: {
        ip: clientIp,
        success: true,
        createdAt: {
          gte: new Date(Date.now() - RATE_WINDOW_MS),
        },
      },
    });

    if (recentAttemptsByIp >= MAX_REGISTRATIONS_PER_IP) {
      return NextResponse.json(
        { error: 'تعداد ثبت‌نام از این دستگاه بیش از حد مجاز است. لطفاً بعداً تلاش کنید.' },
        { status: 429 }
      );
    }

    // Rate limit by email domain
    const emailDomain = email.split('@')[1]?.toLowerCase();
    if (emailDomain) {
      const recentDomainRegistrations = await db.user.count({
        where: {
          email: { endsWith: `@${emailDomain}` },
          createdAt: {
            gte: new Date(Date.now() - DOMAIN_RATE_WINDOW_MS),
          },
        },
      });

      if (recentDomainRegistrations >= MAX_PER_DOMAIN) {
        return NextResponse.json(
          { error: 'تعداد ثبت‌نام با این دامنه ایمیل بیش از حد مجاز است.' },
          { status: 429 }
        );
      }
    }

    if (phone) {
      const phoneRegex = /^(\+98|0)9\d{9}$/;
      if (!phoneRegex.test(phone)) {
        return NextResponse.json(
          { error: 'فرمت شماره موبایل معتبر نیست' },
          { status: 400 }
        );
      }
      const normalizedPhone = phone.startsWith('+98') ? '0' + phone.slice(3) : phone;
      const existingPhone = await db.user.findUnique({ where: { phone: normalizedPhone } });
      if (existingPhone) {
        return NextResponse.json(
          { error: 'این شماره موبایل قبلاً ثبت شده است' },
          { status: 400 }
        );
      }
    }

    const strengthCheck = validatePasswordStrength(password);
    if (!strengthCheck.valid) {
      return NextResponse.json(
        { error: 'رمز عبور به اندازه کافی قوی نیست', passwordErrors: strengthCheck.errors },
        { status: 400 }
      );
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: 'این ایمیل قبلاً ثبت شده است' },
        { status: 400 }
      );
    }

    // Check normalized email duplicates (catches Gmail dot tricks)
    if (normalizedEmail !== email.toLowerCase()) {
      const allUsers = await db.user.findMany({
        where: {
          email: { contains: normalizedEmail.split('@')[0] },
        },
        select: { email: true },
      });

      for (const user of allUsers) {
        if (normalizeEmail(user.email) === normalizedEmail) {
          return NextResponse.json(
            { error: 'این ایمیل قبلاً ثبت شده است' },
            { status: 400 }
          );
        }
      }
    }

    // First registered user becomes admin
    const adminCount = await db.user.count({ where: { role: 'admin' } });
    const role = adminCount === 0 ? 'admin' : 'user';

    const hashedPassword = await bcrypt.hash(password, 12);

    const normalizedPhone = phone ? (phone.startsWith('+98') ? '0' + phone.slice(3) : phone) : null;
    const user = await db.user.create({
      data: {
        email: email.toLowerCase().trim(),
        name: name.trim(),
        password: hashedPassword,
        phone: normalizedPhone,
        plan: 'starter',
        role,
      },
    });

    await db.subscription.create({
      data: {
        userId: user.id,
        plan: 'starter',
        status: 'active',
      },
    });

    await db.brandProfile.create({
      data: {
        userId: user.id,
        name: 'پروفایل پیش‌فرض',
        tone: 'friendly',
        formality: 'semi-formal',
        emojiLevel: 'moderate',
        slangLevel: 'light',
        isActive: true,
      },
    });

    await db.loginAttempt.create({
      data: {
        userId: user.id,
        email: user.email,
        success: true,
        ip: clientIp,
      },
    });

    const token = await signToken({
      userId: user.id,
      email: user.email,
      plan: user.plan,
      role: user.role,
    });

    const response = NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, plan: user.plan, role: user.role, phone: user.phone },
      token,
    });

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: 'خطا در ثبت‌نام. لطفاً دوباره تلاش کنید.' },
      { status: 500 }
    );
  }
}
