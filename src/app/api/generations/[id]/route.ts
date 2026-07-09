import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'احراز هویت نشده' }, { status: 401 });
    }

    const { id } = await params;
    const generation = await db.generation.findFirst({
      where: { id, userId: session.userId },
    });

    if (!generation) {
      return NextResponse.json({ error: 'یافت نشد' }, { status: 404 });
    }

    return NextResponse.json({
      ...generation,
      result: JSON.parse(generation.result),
    });
  } catch (error) {
    console.error('Get generation error:', error);
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
    const generation = await db.generation.findFirst({
      where: { id, userId: session.userId },
    });

    if (!generation) {
      return NextResponse.json({ error: 'یافت نشد' }, { status: 404 });
    }

    await db.generation.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete generation error:', error);
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 });
  }
}
