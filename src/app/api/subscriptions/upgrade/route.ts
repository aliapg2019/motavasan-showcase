import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest, signToken } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'احراز هویت نشده' }, { status: 401 });
    }

    const body = await request.json();
    const { planId } = body;

    // اعتبارسنجی طرح
    const validPlans = ['starter', 'pro', 'business'];
    if (!planId || !validPlans.includes(planId)) {
      return NextResponse.json({ error: 'طرح نامعتبر است' }, { status: 400 });
    }

    // بروزرسانی طرح کاربر
    const user = await db.user.update({
      where: { id: session.userId },
      data: { plan: planId },
    });

    // بروزرسانی یا ایجاد اشتراک
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    await db.subscription.upsert({
      where: { userId: session.userId },
      update: {
        plan: planId,
        status: 'active',
        startDate: new Date(),
        endDate,
      },
      create: {
        userId: session.userId,
        plan: planId,
        status: 'active',
        startDate: new Date(),
        endDate,
      },
    });

    // ایجاد توکن جدید با طرح بروز شده
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
    console.error('Upgrade error:', error);
    return NextResponse.json({ error: 'خطا در ارتقای اشتراک' }, { status: 500 });
  }
}
