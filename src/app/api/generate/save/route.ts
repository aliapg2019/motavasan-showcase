import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';

// Plan limits (must match /api/generate)
const PLAN_LIMITS: Record<string, number> = {
  starter: 5,
  pro: 50,
  business: -1, // unlimited
};

/**
 * POST /api/generate/save
 * ============================================
 * Persists a generation result that was produced client-side via Puter.js.
 *
 * The client flow is:
 *   1. POST /api/generate         → server builds prompt + checks rate limit
 *   2. window.puter.ai.chat(...)   → client calls Puter AI directly (user pays)
 *   3. POST /api/generate/save     → client sends parsed result, server saves
 *
 * We re-check the rate limit here to prevent a race condition where the user
 * fires off many parallel AI requests after passing the prepare check.
 *
 * Request body: {
 *   productName, category, price?, audience?,
 *   tone, goal, templateType, brandProfileId?,
 *   advanced: boolean,
 *   result: { captions, stories, reels_script, ads, hashtags },
 *   tokens?: number  // optional token usage from Puter response
 * }
 *
 * Response: { id, createdAt }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'احراز هویت نشده' }, { status: 401 });
    }

    const body = await request.json();
    const {
      productName,
      category,
      price,
      audience,
      tone = 'friendly',
      goal = 'sell',
      templateType = 'general',
      brandProfileId,
      advanced = false,
      result,
      tokens = 0,
    } = body;

    if (!productName || !category) {
      return NextResponse.json(
        { error: 'نام محصول و دسته‌بندی الزامی است' },
        { status: 400 }
      );
    }

    if (!result || typeof result !== 'object') {
      return NextResponse.json(
        { error: 'نتیجه تولید محتوا نامعتبر است' },
        { status: 400 }
      );
    }

    // Re-check usage limits (race-condition guard)
    const dailyLimit = PLAN_LIMITS[session.plan] || PLAN_LIMITS.starter;
    if (dailyLimit > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayGenerations = await db.usageLog.count({
        where: {
          userId: session.userId,
          action: 'generate',
          createdAt: { gte: today },
        },
      });
      if (todayGenerations >= dailyLimit) {
        return NextResponse.json(
          {
            error: `محدودیت روزانه طرح شما (${dailyLimit} تولید) تمام شده. طرح خود را ارتقا دهید.`,
            limitReached: true,
          },
          { status: 429 }
        );
      }
    }

    // Save generation
    const generation = await db.generation.create({
      data: {
        userId: session.userId,
        productName,
        category,
        price: price || null,
        audience: audience || null,
        tone,
        goal,
        templateType,
        brandProfileId:
          brandProfileId && brandProfileId !== 'none' ? brandProfileId : null,
        result: JSON.stringify(result),
      },
    });

    // Log usage
    await db.usageLog.create({
      data: {
        userId: session.userId,
        action: advanced ? 'generate_advanced' : 'generate',
        tokens: tokens || 0,
      },
    });

    return NextResponse.json({
      id: generation.id,
      createdAt: generation.createdAt,
    });
  } catch (error) {
    console.error('Generate (save) error:', error);
    return NextResponse.json(
      { error: 'خطا در ذخیره محتوا. لطفاً دوباره تلاش کنید.' },
      { status: 500 }
    );
  }
}
