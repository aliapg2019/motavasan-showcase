import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { plan, role, name } = body;

    const updateData: Record<string, string> = {};
    if (plan) updateData.plan = plan;
    if (role) updateData.role = role;
    if (name) updateData.name = name;

    const user = await db.user.update({
      where: { id },
      data: updateData,
      select: { id: true, email: true, name: true, plan: true, role: true },
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Admin update user error:', error);
    return NextResponse.json({ error: 'خطا در بروزرسانی کاربر' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: 'دسترسی غیرمجاز' }, { status: 403 });
    }

    const { id } = await params;

    // جلوگیری از حذف خود ادمین
    if (id === session.userId) {
      return NextResponse.json({ error: 'نمی‌توانید حساب خود را حذف کنید' }, { status: 400 });
    }

    await db.user.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Admin delete user error:', error);
    return NextResponse.json({ error: 'خطا در حذف کاربر' }, { status: 500 });
  }
}
