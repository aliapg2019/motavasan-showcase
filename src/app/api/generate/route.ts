import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import { buildPrompt } from '@/lib/prompt-engine';
import { chatComplete, isAIConfigured } from '@/lib/ai';

// Plan limits
const PLAN_LIMITS: Record<string, number> = {
  starter: 5,
  pro: 50,
  business: -1, // unlimited
};

const SYSTEM_MESSAGE =
  'تو یک متخصص تولید محتوای بازاریابی فارسی هستی. فقط JSON معتبر تولید کن.';

/**
 * POST /api/generate
 * Auth -> validate -> check plan limit -> build prompt -> call AI -> persist -> return.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'احراز هویت نشده' }, { status: 401 });
    }

    // Fail fast if the AI provider isn't configured.
    if (!isAIConfigured()) {
      return NextResponse.json(
        {
          error:
            'سرویس تولید محتوا پیکربندی نشده است. لطفاً کلید API هوش مصنوعی (ZAI_API_KEY) را در فایل .env قرار دهید.',
        },
        { status: 503 }
      );
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
      // Advanced parameters
      contentLength,
      platform,
      ctaType,
      customInstructions,
      competitorName,
      uniqueSellingPoint,
      includeStoryStrategy,
      includeSEOKeywords,
      includeCallToAction = true,
      emotionTrigger,
      targetScenario,
      hashtagCount = 15,
      captionCount = 3,
    } = body;

    if (!productName || !category) {
      return NextResponse.json(
        { error: 'نام محصول و دسته‌بندی الزامی است' },
        { status: 400 }
      );
    }

    // Check usage limits based on plan
    const dailyLimit = PLAN_LIMITS[session.plan] || PLAN_LIMITS.starter;
    let todayGenerations = 0;
    if (dailyLimit > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      todayGenerations = await db.usageLog.count({
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

    // Get brand profile if specified
    let brandProfile = undefined;
    if (brandProfileId && brandProfileId !== 'none') {
      const bp = await db.brandProfile.findFirst({
        where: { id: brandProfileId, userId: session.userId },
      });
      if (bp) {
        brandProfile = {
          name: bp.name,
          tone: bp.tone,
          formality: bp.formality,
          emojiLevel: bp.emojiLevel,
          slangLevel: bp.slangLevel,
        };
      }
    }

    // Build prompt
    const prompt = buildPrompt({
      productName,
      category,
      price,
      audience,
      tone,
      goal,
      templateType,
      brandProfile,
      advanced,
      contentLength,
      platform,
      ctaType,
      customInstructions,
      competitorName,
      uniqueSellingPoint,
      includeStoryStrategy,
      includeSEOKeywords,
      includeCallToAction,
      emotionTrigger,
      targetScenario,
      hashtagCount,
      captionCount,
    });

    // Call ZAI (GLM-4.5-Flash) — server-side, OpenAI-compatible API
    let aiContent: string;
    let aiTokens = 0;
    try {
      const ai = await chatComplete(
        [
          { role: 'system', content: SYSTEM_MESSAGE },
          { role: 'user', content: prompt },
        ],
        {
          temperature: advanced ? 0.85 : 0.8,
          maxTokens: advanced ? 3000 : 2000,
        }
      );
      aiContent = ai.content;
      aiTokens = ai.tokens;
    } catch (err: unknown) {
      console.error('ZAI call failed:', err);
      const e = err as { status?: number; message?: string };
      const status = e?.status;
      const message = String(e?.message || '');
      let msg = 'خطا در ارتباط با سرویس هوش مصنوعی. لطفاً دوباره تلاش کنید.';
      let httpStatus = 502;
      // ZAI returns 401 for invalid API key, 403 for permission/region issues,
      // 429 (code 1113) for quota exhaustion, 400 for bad request.
      if (status === 401) {
        msg =
          'کلید API هوش مصنوعی (ZAI_API_KEY) نامعتبر است. لطفاً کلید معتبری از https://z.ai/manage-apikey/apikey-list بگیرید.';
      } else if (status === 403) {
        msg =
          'دسترسی به API مسدود شده است. حساب یا کلید خود را در پنل ZAI بررسی کنید.';
      } else if (
        status === 429 ||
        message.includes('quota') ||
        message.includes('余额不足') ||
        message.includes('1113')
      ) {
        msg =
          'سهمیه‌ی حساب هوش مصنوعی تمام شده است. لطفاً در پنل ZAI حساب خود را شارژ کنید.';
        httpStatus = 429;
      }
      return NextResponse.json({ error: msg }, { status: httpStatus });
    }

    // Parse the JSON the model was asked to produce
    let parsedResult: unknown;
    try {
      const jsonMatch = aiContent.match(/\{[\s\S]*\}/);
      parsedResult = jsonMatch
        ? JSON.parse(jsonMatch[0])
        : JSON.parse(aiContent);
    } catch {
      // Fall back to a minimal object so we don't lose the AI output entirely.
      parsedResult = {
        captions: [aiContent.substring(0, 200)],
        stories: ['محتوای تولید شده'],
        reels_script: { hook: '', body: '', cta: '' },
        ads: { short: '', long: '' },
        hashtags: [],
      };
    }

    // Persist
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
        result: JSON.stringify(parsedResult),
      },
    });

    await db.usageLog.create({
      data: {
        userId: session.userId,
        action: advanced ? 'generate_advanced' : 'generate',
        tokens: aiTokens || 0,
      },
    });

    return NextResponse.json({
      id: generation.id,
      createdAt: generation.createdAt,
      result: parsedResult,
      tokens: aiTokens,
      remaining: dailyLimit === -1 ? -1 : dailyLimit - (todayGenerations + 1),
    });
  } catch (error) {
    console.error('Generate error:', error);
    return NextResponse.json(
      { error: 'خطا در تولید محتوا. لطفاً دوباره تلاش کنید.' },
      { status: 500 }
    );
  }
}
