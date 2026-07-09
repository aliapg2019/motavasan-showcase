import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'احراز هویت نشده' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, tone, formality, emojiLevel, slangLevel, isActive } = body;

    const existing = await db.brandProfile.findFirst({
      where: { id, userId: session.userId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'یافت نشد' }, { status: 404 });
    }

    const profile = await db.brandProfile.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(tone && { tone }),
        ...(formality && { formality }),
        ...(emojiLevel && { emojiLevel }),
        ...(slangLevel && { slangLevel }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Update brand profile error:', error);
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'احراز هویت نشده' }, { status: 401 });
    }

    const { id } = await params;
    const existing = await db.brandProfile.findFirst({
      where: { id, userId: session.userId },
    });

    if (!existing) {
      return NextResponse.json({ error: 'یافت نشد' }, { status: 404 });
    }

    await db.brandProfile.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete brand profile error:', error);
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 });
  }
}
