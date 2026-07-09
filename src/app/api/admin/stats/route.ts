import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalGenerations,
      generationsToday,
      usersByPlan,
    ] = await Promise.all([
      db.user.count(),
      db.generation.count(),
      db.generation.count({
        where: { createdAt: { gte: today } },
      }),
      db.user.groupBy({
        by: ['plan'],
        _count: { plan: true },
      }),
    ]);

    // تخمین درآمد بر اساس طرح‌ها
    const planPrices: Record<string, number> = { starter: 0, pro: 149000, business: 399000 };
    let revenueEstimate = 0;
    const planStats: Record<string, number> = {};
    for (const item of usersByPlan) {
      planStats[item.plan] = item._count.plan;
      revenueEstimate += (planPrices[item.plan] || 0) * item._count.plan;
    }

    return NextResponse.json({
      totalUsers,
      totalGenerations,
      generationsToday,
      planStats,
      revenueEstimate,
    });
  } catch (error) {
    console.error('Admin stats error:', error);
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 });
  }
}
