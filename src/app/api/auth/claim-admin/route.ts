import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, signToken } from '@/lib/auth';
import { db } from '@/lib/db';

// POST - Claim admin role
// Works in two modes:
// 1. No admin exists in the system -> any user can claim admin
// 2. Admin exists but user provides correct setup key -> can still claim admin
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'احراز هویت نشده' }, { status: 401 });
    }

    // Check if user is already admin
    if (session.role === 'admin') {
      return NextResponse.json({ error: 'شما قبلاً ادمین هستید' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const { setupKey } = body;

    // Check if any admin exists
    const adminCount = await db.user.count({ where: { role: 'admin' } });
    const setupKeyEnv = process.env.ADMIN_SETUP_KEY || 'admin-setup-2024';

    if (adminCount > 0) {
      // Admin exists - need setup key to override
      if (!setupKey || setupKey !== setupKeyEnv) {
        return NextResponse.json(
          { error: 'یک ادمین در سیستم وجود دارد. برای دریافت دسترسی ادمین، کلید تنظیمات را وارد کنید یا با مدیر سیستم تماس بگیرید.' },
          { status: 403 }
        );
      }
    }

    // Promote user to admin
    const user = await db.user.update({
      where: { id: session.userId },
      data: { role: 'admin' },
      select: { id: true, email: true, name: true, plan: true, role: true },
    });

    // Sign new token with admin role
    const token = await signToken({
      userId: user.id,
      email: user.email,
      plan: user.plan,
      role: user.role,
    });

    const response = NextResponse.json({
      user,
      token,
      message: 'حساب شما با موفقیت به ادمین ارتقا یافت!',
    });

    // Update cookie
    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Claim admin error:', error);
    return NextResponse.json(
      { error: 'خطا در ارتقای حساب. لطفاً دوباره تلاش کنید.' },
      { status: 500 }
    );
  }
}
