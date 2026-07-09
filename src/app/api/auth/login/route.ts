import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';

// Rate limiting configuration
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'ایمیل و رمز عبور الزامی است' },
        { status: 400 }
      );
    }

    // Check rate limiting - count recent failed attempts
    const recentFailedAttempts = await db.loginAttempt.findMany({
      where: {
        email,
        success: false,
        createdAt: {
          gte: new Date(Date.now() - LOCKOUT_MINUTES * 60 * 1000),
        },
      },
      orderBy: { createdAt: 'desc' },
      take: MAX_FAILED_ATTEMPTS,
    });

    if (recentFailedAttempts.length >= MAX_FAILED_ATTEMPTS) {
      const lastAttempt = recentFailedAttempts[0];
      const timeSinceLastAttempt = Date.now() - new Date(lastAttempt.createdAt).getTime();
      const remainingMinutes = Math.ceil((LOCKOUT_MINUTES * 60 * 1000 - timeSinceLastAttempt) / 60000);

      return NextResponse.json(
        {
          error: `حساب شما به دلیل تلاش‌های ناموفق متوالی موقتاً قفل شده است. لطفاً ${remainingMinutes} دقیقه صبر کنید.`,
          locked: true,
          remainingMinutes,
        },
        { status: 429 }
      );
    }

    // Find user
    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      // Log failed attempt (don't reveal user doesn't exist)
      await db.loginAttempt.create({
        data: {
          email,
          success: false,
          ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        },
      });

      return NextResponse.json(
        { error: 'ایمیل یا رمز عبور اشتباه است' },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      // Log failed attempt
      await db.loginAttempt.create({
        data: {
          userId: user.id,
          email: user.email,
          success: false,
          ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
        },
      });

      // Count remaining attempts
      const totalFailed = recentFailedAttempts.length + 1;
      const remainingAttempts = MAX_FAILED_ATTEMPTS - totalFailed;

      return NextResponse.json(
        {
          error: 'ایمیل یا رمز عبور اشتباه است',
          remainingAttempts: remainingAttempts > 0 ? remainingAttempts : 0,
        },
        { status: 401 }
      );
    }

    // Log successful attempt
    await db.loginAttempt.create({
      data: {
        userId: user.id,
        email: user.email,
        success: true,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || null,
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
    });

    // Set cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'خطا در ورود. لطفاً دوباره تلاش کنید.' },
      { status: 500 }
    );
  }
}
