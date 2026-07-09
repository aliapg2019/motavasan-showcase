import { NextResponse } from 'next/server';
import { PLANS } from '@/lib/templates';

export async function GET() {
  return NextResponse.json({ plans: PLANS });
}
