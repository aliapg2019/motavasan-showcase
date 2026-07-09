import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Check if any admin exists (public, no auth required)
export async function GET() {
  try {
    const adminCount = await db.user.count({ where: { role: 'admin' } });
    return NextResponse.json({ hasAdmin: adminCount > 0 });
  } catch (error) {
    console.error('Check admin error:', error);
    return NextResponse.json({ hasAdmin: true }); // Default to true for safety
  }
}
