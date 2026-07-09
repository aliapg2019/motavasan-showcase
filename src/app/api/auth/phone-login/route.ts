import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';

// Login with phone + password (alternative to OTP)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, password } = body;

    if (!phone || !password) {
      return NextResponse.json(
        { error: 'شماره موبایل و رمز عبور الزامی است' },
        { status: 400 }
      );
    }

    // Normalize phone number
    const normalizedPhone = phone.startsWith('+98') ? '0' + phone.slice(3) : phone;

    // Validate phone format
    const phoneRegex = /^0\d{10}$/;
    if (!phoneRegex.test(normalizedPhone)) {
      return NextResponse.json(
        { error: 'فرمت شماره موبایل معتبر نیست' },
        { status: 400 }
      );
    }

    // Find user by phone
    const user = await db.user.findUnique({ where: { phone: normalizedPhone } });
    if (!user) {
      return NextResponse.json(
        { error: 'شماره موبایل یا رمز عبور اشتباه است' },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: 'شماره موبایل یا رمز عبور اشتباه است' },
        { status: 401 }
      );
    }

    // Sign token
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
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Phone login error:', error);
    return NextResponse.json(
      { error: 'خطا در ورود. لطفاً دوباره تلاش کنید.' },
      { status: 500 }
    );
  }
}
