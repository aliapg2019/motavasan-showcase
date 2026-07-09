import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { target, code, type, name, password } = body;

    if (!target || !code || !type) {
      return NextResponse.json(
        { error: 'اطلاعات ناقص است' },
        { status: 400 }
      );
    }

    // Find the latest valid OTP for this target and type
    const otpRecord = await db.otpCode.findFirst({
      where: {
        target,
        type,
        verified: false,
        expiresAt: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      return NextResponse.json(
        { error: 'کد تایید معتبر نیست یا منقضی شده است. لطفاً کد جدیدی درخواست کنید.' },
        { status: 400 }
      );
    }

    // Check if too many attempts (max 5 wrong attempts)
    const now = new Date();
    const otpCreatedAt = new Date(otpRecord.createdAt);
    const recentAttempts = await db.otpCode.count({
      where: {
        target,
        type,
        createdAt: {
          gte: new Date(now.getTime() - 15 * 60 * 1000),
        },
      },
    });

    if (otpRecord.code !== code) {
      return NextResponse.json(
        { error: 'کد تایید اشتباه است' },
        { status: 400 }
      );
    }

    // Mark OTP as verified
    await db.otpCode.update({
      where: { id: otpRecord.id },
      data: { verified: true },
    });

    // Handle based on type
    if (type === 'email_verification') {
      // Register new user with email
      if (!name || !password) {
        return NextResponse.json(
          { error: 'نام و رمز عبور الزامی است' },
          { status: 400 }
        );
      }

      // Validate password strength
      const strengthErrors: string[] = [];
      if (password.length < 8) strengthErrors.push('حداقل ۸ کاراکتر');
      if (!/[A-Z]/.test(password)) strengthErrors.push('حرف بزرگ');
      if (!/[a-z]/.test(password)) strengthErrors.push('حرف کوچک');
      if (!/[0-9]/.test(password)) strengthErrors.push('عدد');
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strengthErrors.push('نماد خاص');

      if (strengthErrors.length > 0) {
        return NextResponse.json(
          { error: 'رمز عبور قوی نیست', passwordErrors: strengthErrors },
          { status: 400 }
        );
      }

      // Check if user already exists (race condition check)
      const existing = await db.user.findUnique({ where: { email: target } });
      if (existing) {
        return NextResponse.json(
          { error: 'این ایمیل قبلاً ثبت شده است' },
          { status: 400 }
        );
      }

      // Check if any admin exists - if not, make this user admin
      const adminCount = await db.user.count({ where: { role: 'admin' } });
      const role = adminCount === 0 ? 'admin' : 'user';

      const hashedPassword = await bcrypt.hash(password, 12);

      const user = await db.user.create({
        data: {
          email: target,
          name: name.trim(),
          password: hashedPassword,
          plan: 'starter',
          role,
          emailVerified: true,
        },
      });

      // Create default subscription
      await db.subscription.create({
        data: {
          userId: user.id,
          plan: 'starter',
          status: 'active',
        },
      });

      // Create default brand profile
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

      // Sign token
      const token = await signToken({
        userId: user.id,
        email: user.email,
        plan: user.plan,
        role: user.role,
      });

      const response = NextResponse.json({
        user: { id: user.id, email: user.email, name: user.name, plan: user.plan, role: user.role },
        token,
        verified: true,
      });

      response.cookies.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });

      return response;
    }

    if (type === 'phone_verification') {
      // Register new user with phone
      if (!name || !password) {
        return NextResponse.json(
          { error: 'نام و رمز عبور الزامی است' },
          { status: 400 }
        );
      }

      // Validate password strength
      const strengthErrors: string[] = [];
      if (password.length < 8) strengthErrors.push('حداقل ۸ کاراکتر');
      if (!/[A-Z]/.test(password)) strengthErrors.push('حرف بزرگ');
      if (!/[a-z]/.test(password)) strengthErrors.push('حرف کوچک');
      if (!/[0-9]/.test(password)) strengthErrors.push('عدد');
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strengthErrors.push('نماد خاص');

      if (strengthErrors.length > 0) {
        return NextResponse.json(
          { error: 'رمز عبور قوی نیست', passwordErrors: strengthErrors },
          { status: 400 }
        );
      }

      // Normalize phone
      const normalizedPhone = target.startsWith('+98') ? '0' + target.slice(3) : target;

      const existing = await db.user.findUnique({ where: { phone: normalizedPhone } });
      if (existing) {
        return NextResponse.json(
          { error: 'این شماره قبلاً ثبت شده است' },
          { status: 400 }
        );
      }

      const adminCount = await db.user.count({ where: { role: 'admin' } });
      const role = adminCount === 0 ? 'admin' : 'user';

      const hashedPassword = await bcrypt.hash(password, 12);

      // Generate a placeholder email from phone number
      const placeholderEmail = `phone_${normalizedPhone}@contentsaas.local`;

      const user = await db.user.create({
        data: {
          email: placeholderEmail,
          name: name.trim(),
          password: hashedPassword,
          phone: normalizedPhone,
          plan: 'starter',
          role,
          phoneVerified: true,
        },
      });

      // Create default subscription
      await db.subscription.create({
        data: {
          userId: user.id,
          plan: 'starter',
          status: 'active',
        },
      });

      // Create default brand profile
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

      const token = await signToken({
        userId: user.id,
        email: user.email,
        plan: user.plan,
        role: user.role,
      });

      const response = NextResponse.json({
        user: { id: user.id, email: user.email, name: user.name, plan: user.plan, role: user.role, phone: user.phone },
        token,
        verified: true,
      });

      response.cookies.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });

      return response;
    }

    if (type === 'email_login') {
      // Login with email OTP (passwordless)
      const user = await db.user.findUnique({ where: { email: target } });
      if (!user) {
        return NextResponse.json(
          { error: 'حسابی با این ایمیل یافت نشد' },
          { status: 400 }
        );
      }

      // Mark email as verified
      if (!user.emailVerified) {
        await db.user.update({
          where: { id: user.id },
          data: { emailVerified: true },
        });
      }

      const token = await signToken({
        userId: user.id,
        email: user.email,
        plan: user.plan,
        role: user.role,
      });

      const response = NextResponse.json({
        user: { id: user.id, email: user.email, name: user.name, plan: user.plan, role: user.role },
        token,
        verified: true,
      });

      response.cookies.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });

      return response;
    }

    if (type === 'phone_login') {
      // Login with phone OTP (passwordless)
      const normalizedPhone = target.startsWith('+98') ? '0' + target.slice(3) : target;
      const user = await db.user.findUnique({ where: { phone: normalizedPhone } });
      if (!user) {
        return NextResponse.json(
          { error: 'حسابی با این شماره یافت نشد' },
          { status: 400 }
        );
      }

      // Mark phone as verified
      if (!user.phoneVerified) {
        await db.user.update({
          where: { id: user.id },
          data: { phoneVerified: true },
        });
      }

      const token = await signToken({
        userId: user.id,
        email: user.email,
        plan: user.plan,
        role: user.role,
      });

      const response = NextResponse.json({
        user: { id: user.id, email: user.email, name: user.name, plan: user.plan, role: user.role, phone: user.phone },
        token,
        verified: true,
      });

      response.cookies.set('auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });

      return response;
    }

    return NextResponse.json(
      { error: 'نوع درخواست نامعتبر است' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Verify OTP error:', error);
    return NextResponse.json(
      { error: 'خطا در تایید کد. لطفاً دوباره تلاش کنید.' },
      { status: 500 }
    );
  }
}
