import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';

// GET - Get user's support messages
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'احراز هویت نشده' }, { status: 401 });
    }

    const messages = await db.supportMessage.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Support GET error:', error);
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 });
  }
}

// POST - Create a new support message
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'احراز هویت نشده' }, { status: 401 });
    }

    const body = await request.json();
    const { subject, message, category = 'general' } = body;

    if (!subject || !message) {
      return NextResponse.json({ error: 'موضوع و پیام الزامی است' }, { status: 400 });
    }

    const supportMessage = await db.supportMessage.create({
      data: {
        userId: session.userId,
        subject,
        message,
        category,
      },
    });

    return NextResponse.json({ message: supportMessage }, { status: 201 });
  } catch (error) {
    console.error('Support POST error:', error);
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 });
  }
}
