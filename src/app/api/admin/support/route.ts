import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';

// GET - List all support messages
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';

    const where: Record<string, unknown> = {};
    if (status !== 'all') {
      where.status = status;
    }

    const messages = await db.supportMessage.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, plan: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const total = await db.supportMessage.count({ where });

    return NextResponse.json({ messages, total });
  } catch (error) {
    console.error('Admin support GET error:', error);
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 });
  }
}

// POST - Reply to a support message
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 });
    }

    const body = await request.json();
    const { messageId, reply } = body;

    if (!messageId || !reply) {
      return NextResponse.json({ error: 'شناسه پیام و پاسخ الزامی است' }, { status: 400 });
    }

    const message = await db.supportMessage.update({
      where: { id: messageId },
      data: {
        status: 'replied',
        reply,
        repliedAt: new Date(),
        repliedBy: session.userId,
      },
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Admin support POST error:', error);
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 });
  }
}
