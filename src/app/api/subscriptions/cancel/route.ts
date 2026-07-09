import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, signToken } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'احراز هویت نشده' }, { status: 401 });
    }

    // بروزرسانی طرح کاربر به استارتر
    const user = await db.user.update({
      where: { id: session.userId },
      data: { plan: 'starter' },
    });

    // بروزرسانی وضعیت اشتراک به لغو شده
    await db.subscription.updateMany({
      where: { userId: session.userId, status: 'active' },
      data: { status: 'cancelled' },
    });

    // ایجاد توکن جدید
    const token = await signToken({
      userId: user.id,
      email: user.email,
      plan: user.plan,
      role: user.role,
    });

    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, plan: user.plan, role: user.role },
      token,
    });
  } catch (error) {
    console.error('Cancel error:', error);
    return NextResponse.json({ error: 'خطا در لغو اشتراک' }, { status: 500 });
  }
}
