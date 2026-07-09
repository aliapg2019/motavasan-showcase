import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'احراز هویت نشده' }, { status: 401 });
    }

    const subscription = await db.subscription.findUnique({
      where: { userId: session.userId },
    });

    if (!subscription) {
      return NextResponse.json({
        plan: session.plan,
        status: 'active',
        startDate: new Date().toISOString(),
        endDate: null,
        daysRemaining: 0,
      });
    }

    const daysRemaining = subscription.endDate
      ? Math.max(0, Math.ceil((new Date(subscription.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : 0;

    return NextResponse.json({
      plan: subscription.plan,
      status: subscription.status,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      daysRemaining,
    });
  } catch (error) {
    console.error('Subscription detail error:', error);
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 });
  }
}
