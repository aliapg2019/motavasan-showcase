import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'احراز هویت نشده' }, { status: 401 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayUsage, totalUsage, totalGenerations] = await Promise.all([
      db.usageLog.count({
        where: {
          userId: session.userId,
          action: 'generate',
          createdAt: { gte: today },
        },
      }),
      db.usageLog.count({
        where: { userId: session.userId },
      }),
      db.generation.count({
        where: { userId: session.userId },
      }),
    ]);

    return NextResponse.json({
      todayUsage,
      totalUsage,
      totalGenerations,
      plan: session.plan,
    });
  } catch (error) {
    console.error('Usage error:', error);
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 });
  }
}
