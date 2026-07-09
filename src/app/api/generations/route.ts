import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'احراز هویت نشده' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    const where: any = { userId: session.userId };
    if (search) {
      where.OR = [
        { productName: { contains: search } },
        { category: { contains: search } },
      ];
    }

    const [generations, total] = await Promise.all([
      db.generation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      db.generation.count({ where }),
    ]);

    return NextResponse.json({
      generations: generations.map((g) => ({
        ...g,
        result: JSON.parse(g.result),
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error('Generations list error:', error);
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 });
  }
}
