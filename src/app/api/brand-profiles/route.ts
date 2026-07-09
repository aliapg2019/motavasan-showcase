import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'احراز هویت نشده' }, { status: 401 });
    }

    const profiles = await db.brandProfile.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ profiles });
  } catch (error) {
    console.error('Brand profiles error:', error);
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'احراز هویت نشده' }, { status: 401 });
    }

    const body = await request.json();
    const { name, tone, formality, emojiLevel, slangLevel } = body;

    if (!name) {
      return NextResponse.json({ error: 'نام پروفایل الزامی است' }, { status: 400 });
    }

    const profile = await db.brandProfile.create({
      data: {
        userId: session.userId,
        name,
        tone: tone || 'friendly',
        formality: formality || 'semi-formal',
        emojiLevel: emojiLevel || 'moderate',
        slangLevel: slangLevel || 'light',
        isActive: true,
      },
    });

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Create brand profile error:', error);
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 });
  }
}
