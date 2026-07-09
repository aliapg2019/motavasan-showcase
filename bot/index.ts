import TelegramBot from 'node-telegram-bot-api';
import type { InlineKeyboardButton, Message } from 'node-telegram-bot-api';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const bot = new TelegramBot(process.env.BOT_TOKEN!, { polling: true });

// Link preview disabled for cleaner output
const NO_PREVIEW = { link_preview_options: { is_disabled: true } };

// In-memory session state for /new flow
interface NewFlowState {
  step: 'product_name' | 'category' | 'price' | 'audience' | 'tone' | 'goal' | 'done';
  data: {
    productName?: string;
    category?: string;
    price?: string;
    audience?: string;
    tone?: string;
    goal?: string;
  };
}
const flows = new Map<number, NewFlowState>();

console.log('[bot] محتواسان bot started — polling for updates...');

// === /start ===
bot.onText(/^\/start/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    await getOrCreateUser(msg);
    await bot.sendMessage(
      chatId,
      [
        '👋 سلام ' + (msg.from?.first_name ? `${msg.from.first_name} عزیز` : '') + '!',
        '',
        'به ربات *محتواسان* خوش آمدید 🎨',
        '',
        'با این ربات می‌توانید محتوای بازاریابی فارسی تولید کنید:',
        '• کپشن اینستاگرام',
        '• استوری ۵ اسلایدی',
        '• اسکریپت ریلز',
        '• متن تبلیغاتی',
        '• هشتگ هدفمند',
        '',
        '📖 *دستورات ربات:*',
        '/new — تولید محتوای جدید',
        '/history — مشاهده تولیدهای اخیر',
        '/usage — نمایش سهمیه باقی‌مانده',
        '/brand — مدیریت پروفایل برند',
        '/help — راهنمای کامل',
      ].join('\n'),
      { parse_mode: 'Markdown' }
    );
  } catch (err) {
    console.error('[bot] /start error:', err);
    await bot.sendMessage(chatId, '⚠️ خطایی رخ داد. لطفاً دوباره /start بفرستید.');
  }
});

// === /help ===
bot.onText(/^\/help/, async (msg) => {
  const chatId = msg.chat.id;
  await bot.sendMessage(
    chatId,
    [
      '📖 *راهنمای ربات محتواسان*',
      '',
      '*/new* — شروع تولید محتوای جدید',
      'روی مرحله‌به‌مرحله نام محصول، دسته‌بندی، قیمت، مخاطب، لحن و هدف را وارد می‌کنید.',
      '',
      '*/history* — مشاهده ۵ تولید اخیر',
      'با دکمه‌های inline می‌توانید هر تولید را به‌صورت کامل ببینید.',
      '',
      '*/usage* — نمایش سهمیه باقی‌مانده',
      'پلن فعلی و تعداد تولیدهای امروز را نشان می‌دهد.',
      '',
      '*/brand* — مدیریت پروفایل برند',
      'لیست پروفایل‌ها و انتخاب پروفایل فعال برای تولید.',
      '',
      '*/cancel* — لغو فرآیند جاری',
      'در هر زمان می‌توانید فرآیند /new را لغو کنید.',
      '',
      '💡 *نکته:* تولیدهای شما هم در سایت و هم ربات از سهمیه مشترک کسر می‌شوند.',
    ].join('\n'),
    { parse_mode: 'Markdown' }
  );
});

// === /new ===
bot.onText(/^\/new/, async (msg) => {
  const chatId = msg.chat.id;
  flows.set(chatId, { step: 'product_name', data: {} });
  await bot.sendMessage(
    chatId,
    '🎨 *تولید محتوای جدید*\n\nلطفاً *نام محصول* خود را وارد کنید:',
    { parse_mode: 'Markdown' }
  );
});

// === /cancel ===
bot.onText(/^\/cancel/, async (msg) => {
  const chatId = msg.chat.id;
  if (flows.has(chatId)) {
    flows.delete(chatId);
    await bot.sendMessage(chatId, '✅ فرآیند لغو شد. برای شروع دوباره /new بفرستید.');
  } else {
    await bot.sendMessage(chatId, 'هیچ فرآیندی فعال نیست که لغو شود.');
  }
});

// === /usage ===
bot.onText(/^\/usage/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const user = await getOrCreateUser(msg);
    const info = await getUsageInfo(user.id);
    await bot.sendMessage(
      chatId,
      [
        '📊 *سهمیه شما*',
        '',
        `*پلن:* ${info.planLabel}`,
        `*تولید امروز:* ${info.todayCount} از ${info.limitLabel}`,
        `*باقی‌مانده:* ${info.remainingLabel}`,
      ].join('\n'),
      { parse_mode: 'Markdown' }
    );
  } catch (err) {
    console.error('[bot] /usage error:', err);
    await bot.sendMessage(chatId, '⚠️ خطا در دریافت اطلاعات سهمیه.');
  }
});

// === /history ===
bot.onText(/^\/history/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const user = await getOrCreateUser(msg);
    const recent = await prisma.generation.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    if (recent.length === 0) {
      await bot.sendMessage(chatId, '📭 هنوز تولیدی ندارید. با /new شروع کنید!');
      return;
    }

    const keyboard: InlineKeyboardButton[][] = recent.map((g, i) => [
      {
        text: `${i + 1}. ${g.productName} — ${g.category}`,
        callback_data: `view:${g.id}`,
      },
    ]);

    await bot.sendMessage(
      chatId,
      '📚 *۵ تولید اخیر شما*\n\nبرای مشاهده کامل روی هر کدام کلیک کنید:',
      { parse_mode: 'Markdown', reply_markup: { inline_keyboard: keyboard } }
    );
  } catch (err) {
    console.error('[bot] /history error:', err);
    await bot.sendMessage(chatId, '⚠️ خطا در دریافت تاریخچه.');
  }
});

// === /brand ===
bot.onText(/^\/brand/, async (msg) => {
  const chatId = msg.chat.id;
  try {
    const user = await getOrCreateUser(msg);
    const profiles = await prisma.brandProfile.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
    });

    if (profiles.length === 0) {
      await bot.sendMessage(chatId, '📭 هنوز پروفایل برندی ندارید. در سایت می‌توانید بسازید.');
      return;
    }

    const tgAuth = await prisma.telegramAuth.findUnique({
      where: { chatId: String(chatId) },
    });

    const keyboard: InlineKeyboardButton[][] = profiles.map((p) => [
      {
        text: (tgAuth?.activeBrandProfileId === p.id ? '✅ ' : '') + p.name,
        callback_data: `setbrand:${p.id}`,
      },
    ]);

    await bot.sendMessage(
      chatId,
      '🎨 *پروفایل‌های برند*\n\nبرای انتخاب پروفایل فعال روی آن کلیک کنید:',
      { parse_mode: 'Markdown', reply_markup: { inline_keyboard: keyboard } }
    );
  } catch (err) {
    console.error('[bot] /brand error:', err);
    await bot.sendMessage(chatId, '⚠️ خطا در دریافت پروفایل‌ها.');
  }
});

// === Inline button handlers ===
bot.on('callback_query', async (query) => {
  const chatId = query.message?.chat.id;
  if (!chatId) return;
  const data = query.data || '';

  try {
    if (data.startsWith('cat:')) {
      await handleCategorySelection(chatId, data.slice(4));
    } else if (data.startsWith('tone:')) {
      await handleToneSelection(chatId, data.slice(5));
    } else if (data.startsWith('goal:')) {
      await handleGoalSelection(chatId, data.slice(5));
    } else if (data.startsWith('view:')) {
      await handleViewGeneration(chatId, data.slice(5));
    } else if (data.startsWith('setbrand:')) {
      await handleSetBrand(chatId, data.slice(9));
    } else if (data === 'skip_price') {
      await handlePriceSkip(chatId);
    } else if (data === 'skip_audience') {
      await handleAudienceSkip(chatId);
    }
    await bot.answerCallbackQuery(query.id);
  } catch (err) {
    console.error('[bot] callback error:', err);
    await bot.answerCallbackQuery(query.id, { text: 'خطایی رخ داد' });
  }
});

// === Text message handler (for flow inputs) ===
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  if (!msg.text || msg.text.startsWith('/')) return;

  const flow = flows.get(chatId);
  if (!flow) return;

  try {
    if (flow.step === 'product_name') {
      flow.data.productName = msg.text.trim();
      flow.step = 'category';
      await askCategory(chatId);
    } else if (flow.step === 'price') {
      flow.data.price = msg.text.trim();
      flow.step = 'audience';
      await askAudience(chatId);
    } else if (flow.step === 'audience') {
      flow.data.audience = msg.text.trim();
      flow.step = 'tone';
      await askTone(chatId);
    }
  } catch (err) {
    console.error('[bot] message handler error:', err);
    await bot.sendMessage(chatId, '⚠️ خطایی رخ داد. دوباره تلاش کنید یا /cancel بفرستید.');
  }
});

// === Flow step handlers ===
async function askCategory(chatId: number) {
  const keyboard: InlineKeyboardButton[][] = [
    [{ text: '💄 زیبایی و آرایشی', callback_data: 'cat:زیبایی' }],
    [{ text: '👕 پوشاک و مد', callback_data: 'cat:پوشاک' }],
    [{ text: '🍔 غذا و رستوران', callback_data: 'cat:غذا' }],
    [{ text: '📱 دیجیتال و موبایل', callback_data: 'cat:دیجیتال' }],
    [{ text: '🏠 خانه و دکوراسیون', callback_data: 'cat:خانه' }],
    [{ text: '💊 سلامت و پزشکی', callback_data: 'cat:سلامت' }],
    [{ text: '🎓 آموزشی', callback_data: 'cat:آموزشی' }],
    [{ text: '📦 سایر', callback_data: 'cat:سایر' }],
  ];
  await bot.sendMessage(
    chatId,
    '🏷 *دسته‌بندی محصول*\n\nلطفاً یکی را انتخاب کنید:',
    { parse_mode: 'Markdown', reply_markup: { inline_keyboard: keyboard } }
  );
}

async function handleCategorySelection(chatId: number, category: string) {
  const flow = flows.get(chatId);
  if (!flow || flow.step !== 'category') return;
  flow.data.category = category;
  flow.step = 'price';
  await bot.sendMessage(
    chatId,
    '💰 *قیمت محصول*\n\nقیمت را وارد کنید (مثلاً: ۱۵۰,۰۰۰ تومان) یا /skip برای رد کردن:',
    {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: [[{ text: '⏭ رد کردن', callback_data: 'skip_price' }]] },
    }
  );
}

async function handlePriceSkip(chatId: number) {
  const flow = flows.get(chatId);
  if (!flow || flow.step !== 'price') return;
  flow.step = 'audience';
  await askAudience(chatId);
}

async function askAudience(chatId: number) {
  await bot.sendMessage(
    chatId,
    '🎯 *مخاطب هدف*\n\nمخاطب هدف را وارد کنید (مثلاً: زنان ۲۰ تا ۳۵ ساله) یا /skip:',
    {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: [[{ text: '⏭ رد کردن', callback_data: 'skip_audience' }]] },
    }
  );
}

async function handleAudienceSkip(chatId: number) {
  const flow = flows.get(chatId);
  if (!flow || flow.step !== 'audience') return;
  flow.step = 'tone';
  await askTone(chatId);
}

async function askTone(chatId: number) {
  const keyboard: InlineKeyboardButton[][] = [
    [
      { text: '😊 صمیمی', callback_data: 'tone:friendly' },
      { text: '🎩 رسمی', callback_data: 'tone:formal' },
    ],
    [
      { text: '💎 لوکس', callback_data: 'tone:luxury' },
      { text: '🔥 تهاجمی', callback_data: 'tone:aggressive' },
    ],
    [
      { text: '🎓 آموزشی', callback_data: 'tone:educational' },
      { text: '😊 طنز', callback_data: 'tone:humorous' },
    ],
  ];
  await bot.sendMessage(
    chatId,
    '🎭 *لحن محتوا*\n\nلطفاً یک لحن انتخاب کنید:',
    { parse_mode: 'Markdown', reply_markup: { inline_keyboard: keyboard } }
  );
}

async function handleToneSelection(chatId: number, tone: string) {
  const flow = flows.get(chatId);
  if (!flow || flow.step !== 'tone') return;
  flow.data.tone = tone;
  flow.step = 'goal';
  await askGoal(chatId);
}

async function askGoal(chatId: number) {
  const keyboard: InlineKeyboardButton[][] = [
    [
      { text: '🛒 فروش مستقیم', callback_data: 'goal:sell' },
      { text: '📢 اطلاع‌رسانی', callback_data: 'goal:inform' },
    ],
    [
      { text: '🚀 رونمایی محصول', callback_data: 'goal:launch' },
      { text: '🤝 اعتمادسازی', callback_data: 'goal:trust' },
    ],
  ];
  await bot.sendMessage(
    chatId,
    '🎯 *هدف محتوا*\n\nهدف اصلی این محتوا چیست؟',
    { parse_mode: 'Markdown', reply_markup: { inline_keyboard: keyboard } }
  );
}

async function handleGoalSelection(chatId: number, goal: string) {
  const flow = flows.get(chatId);
  if (!flow || flow.step !== 'goal') return;
  flow.data.goal = goal;
  flow.step = 'done';
  await runGeneration(chatId);
}

// === Generation flow ===
async function runGeneration(chatId: number) {
  const flow = flows.get(chatId);
  if (!flow) return;

  try {
    const user = await getOrCreateUserByChatId(chatId);
    if (!user) {
      await bot.sendMessage(chatId, '⚠️ ابتدا /start بفرستید.');
      flows.delete(chatId);
      return;
    }

    // Check quota
    const info = await getUsageInfo(user.id);
    if (info.limit > 0 && info.todayCount >= info.limit) {
      await bot.sendMessage(
        chatId,
        `⚠️ سهمیه روزانه شما تمام شده است.\n\n*پلن:* ${info.planLabel}\n*تولید امروز:* ${info.todayCount} از ${info.limit}\n\nبرای ارتقا به سایت مراجعه کنید.`,
        { parse_mode: 'Markdown' }
      );
      flows.delete(chatId);
      return;
    }

    // Loading message
    const loadingMsg = await bot.sendMessage(
      chatId,
      '⏳ *در حال تولید محتوا...*\n\nلطفاً چند ثانیه صبر کنید.',
      { parse_mode: 'Markdown' }
    );

    const { buildPrompt } = await import('../src/lib/prompt-engine');
    const { chatComplete, isAIConfigured } = await import('../src/lib/ai');

    if (!isAIConfigured()) {
      await bot.editMessageText('⚠️ سرویس هوش مصنوعی پیکربندی نشده است.', {
        chat_id: chatId,
        message_id: loadingMsg.message_id,
      });
      flows.delete(chatId);
      return;
    }

    // Get active brand profile
    const tgAuth = await prisma.telegramAuth.findUnique({
      where: { chatId: String(chatId) },
    });
    let brandProfile;
    if (tgAuth?.activeBrandProfileId) {
      brandProfile = await prisma.brandProfile.findUnique({
        where: { id: tgAuth.activeBrandProfileId },
      });
    }

    const prompt = buildPrompt({
      productName: flow.data.productName!,
      category: flow.data.category!,
      price: flow.data.price,
      audience: flow.data.audience,
      tone: flow.data.tone || 'friendly',
      goal: flow.data.goal || 'sell',
      templateType: 'general',
      brandProfile: brandProfile || undefined,
    } as any);

    const result = await chatComplete([
      { role: 'system', content: 'تو یک متخصص تولید محتوای بازاریابی فارسی هستی. فقط JSON معتبر تولید کن.' },
      { role: 'user', content: prompt },
    ]);

    let parsed: any;
    try {
      parsed = JSON.parse(result.content);
    } catch {
      const match = result.content.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        throw new Error('Invalid AI response format');
      }
    }

    const generation = await prisma.generation.create({
      data: {
        userId: user.id,
        productName: flow.data.productName!,
        category: flow.data.category!,
        price: flow.data.price || null,
        audience: flow.data.audience || null,
        tone: flow.data.tone || 'friendly',
        goal: flow.data.goal || 'sell',
        templateType: 'general',
        brandProfileId: tgAuth?.activeBrandProfileId || null,
        result: JSON.stringify(parsed),
      },
    });

    await prisma.usageLog.create({
      data: {
        userId: user.id,
        action: 'generate',
        tokens: result.tokens,
      },
    });

    await bot.deleteMessage(chatId, loadingMsg.message_id).catch(() => {});

    await sendFormattedResult(chatId, generation.id, parsed, {
      productName: flow.data.productName!,
      tokens: result.tokens,
    });

    flows.delete(chatId);
  } catch (err: any) {
    console.error('[bot] generation error:', err);
    await bot.sendMessage(
      chatId,
      `⚠️ خطا در تولید محتوا: ${err.message || 'نامشخص'}\n\nدوباره با /new تلاش کنید.`
    );
    flows.delete(chatId);
  }
}

// === View generation by ID (from /history) ===
async function handleViewGeneration(chatId: number, genId: string) {
  try {
    const user = await getOrCreateUserByChatId(chatId);
    if (!user) return;

    const gen = await prisma.generation.findFirst({
      where: { id: genId, userId: user.id },
    });
    if (!gen) {
      await bot.sendMessage(chatId, '❌ این تولید یافت نشد.');
      return;
    }

    const parsed = JSON.parse(gen.result);
    await sendFormattedResult(chatId, gen.id, parsed, {
      productName: gen.productName,
      date: gen.createdAt,
    });
  } catch (err) {
    console.error('[bot] view error:', err);
    await bot.sendMessage(chatId, '⚠️ خطا در نمایش تولید.');
  }
}

// === Set active brand profile ===
async function handleSetBrand(chatId: number, brandId: string) {
  try {
    await prisma.telegramAuth.update({
      where: { chatId: String(chatId) },
      data: { activeBrandProfileId: brandId },
    });
    const brand = await prisma.brandProfile.findUnique({ where: { id: brandId } });
    await bot.sendMessage(chatId, `✅ پروفایل فعال شد: *${brand?.name}*`, {
      parse_mode: 'Markdown',
    });
  } catch (err) {
    console.error('[bot] setbrand error:', err);
    await bot.sendMessage(chatId, '⚠️ خطا در تنظیم پروفایل برند.');
  }
}

// === Helpers ===
async function getOrCreateUser(msg: Message) {
  const chatId = msg.chat.id;
  const from = msg.from!;
  const existing = await prisma.telegramAuth.findUnique({
    where: { chatId: String(chatId) },
    include: { user: true },
  });
  if (existing) return existing.user;

  // First user becomes admin
  const adminCount = await prisma.user.count({ where: { role: 'admin' } });
  const role = adminCount === 0 ? 'admin' : 'user';

  const placeholderEmail = `tg_${chatId}@motavasan.local`;
  const user = await prisma.user.create({
    data: {
      email: placeholderEmail,
      name: [from.first_name, from.last_name].filter(Boolean).join(' ') || `Telegram ${chatId}`,
      password: await bcrypt.hash(`tg_${chatId}_no_login`, 12),
      plan: 'starter',
      role,
    },
  });

  await prisma.subscription.create({
    data: { userId: user.id, plan: 'starter', status: 'active' },
  });

  await prisma.brandProfile.create({
    data: {
      userId: user.id,
      name: 'پروفایل پیش‌فرض',
      tone: 'friendly',
      formality: 'semi-formal',
      emojiLevel: 'moderate',
      slangLevel: 'light',
      isActive: true,
    },
  });

  const tgAuth = await prisma.telegramAuth.create({
    data: {
      userId: user.id,
      chatId: String(chatId),
      telegramId: String(from.id),
      username: from.username || null,
      firstName: from.first_name || null,
      lastName: from.last_name || null,
    },
    include: { user: true },
  });

  return tgAuth.user;
}

async function getOrCreateUserByChatId(chatId: number) {
  const existing = await prisma.telegramAuth.findUnique({
    where: { chatId: String(chatId) },
    include: { user: true },
  });
  return existing?.user || null;
}

async function getUsageInfo(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const plan = user?.plan || 'starter';

  const limits: Record<string, number> = {
    starter: 5,
    pro: 50,
    business: -1,
  };
  const limit = limits[plan] || 5;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayCount = await prisma.usageLog.count({
    where: {
      userId,
      action: { in: ['generate', 'generate_advanced'] },
      createdAt: { gte: today },
    },
  });

  const planLabels: Record<string, string> = {
    starter: '🆓 رایگان (۵ در روز)',
    pro: '💎 Pro (۵۰ در روز)',
    business: '👑 Business (نامحدود)',
  };

  return {
    plan,
    limit,
    todayCount,
    planLabel: planLabels[plan] || plan,
    limitLabel: limit === -1 ? 'نامحدود' : String(limit),
    remainingLabel: limit === -1 ? 'نامحدود' : String(Math.max(0, limit - todayCount)),
  };
}

// === Beautiful output formatter ===
async function sendFormattedResult(
  chatId: number,
  genId: string,
  data: any,
  meta: { productName: string; tokens?: number; date?: Date }
) {
  const header =
    `✨ *محتوای تولیدشده*\n\n` +
    `📦 محصول: *${meta.productName}*\n` +
    (meta.tokens ? `⚡️ توکن مصرفی: ${meta.tokens}\n` : '') +
    (meta.date ? `🕒 ${meta.date.toLocaleDateString('fa-IR')}\n` : '') +
    `\n🆔 ${genId.slice(-8)}`;

  await bot.sendMessage(chatId, header, { parse_mode: 'Markdown' });

  if (data.captions?.length) {
    await bot.sendMessage(chatId, '📝 *کپشن‌ها*', { parse_mode: 'Markdown' });
    for (let i = 0; i < data.captions.length; i++) {
      await bot.sendMessage(
        chatId,
        `${data.captions[i]}\n\n— کپشن ${i + 1} از ${data.captions.length}`,
        NO_PREVIEW
      );
    }
  }

  if (data.stories?.length) {
    await bot.sendMessage(chatId, '📖 *استوری‌ها*', { parse_mode: 'Markdown' });
    for (let i = 0; i < data.stories.length; i++) {
      const story = data.stories[i];
      const text = typeof story === 'string' ? story : story.text || JSON.stringify(story);
      await bot.sendMessage(
        chatId,
        `${text}\n\n— اسلاید ${i + 1} از ${data.stories.length}`,
        NO_PREVIEW
      );
    }
  }

  if (data.reels_script) {
    await bot.sendMessage(chatId, '🎬 *اسکریپت ریلز*', { parse_mode: 'Markdown' });
    const script = typeof data.reels_script === 'string'
      ? data.reels_script
      : JSON.stringify(data.reels_script, null, 2);
    await bot.sendMessage(chatId, script, NO_PREVIEW);
  }

  if (data.ads?.length) {
    await bot.sendMessage(chatId, '📢 *متن تبلیغاتی*', { parse_mode: 'Markdown' });
    for (let i = 0; i < data.ads.length; i++) {
      await bot.sendMessage(
        chatId,
        `${data.ads[i]}\n\n— تبلیغ ${i + 1} از ${data.ads.length}`,
        NO_PREVIEW
      );
    }
  } else if (data.ad) {
    await bot.sendMessage(chatId, '📢 *متن تبلیغاتی*', { parse_mode: 'Markdown' });
    await bot.sendMessage(chatId, data.ad, NO_PREVIEW);
  }

  if (data.hashtags?.length) {
    await bot.sendMessage(chatId, '#️⃣ *هشتگ‌ها*', { parse_mode: 'Markdown' });
    const hashtagText = data.hashtags.map((h: string) => `#${h.replace(/^#/, '')}`).join(' ');
    await bot.sendMessage(chatId, hashtagText, NO_PREVIEW);
  }

  await bot.sendMessage(
    chatId,
    '✅ تمام شد!\n\nبرای تولید جدید /new بفرستید.',
    { parse_mode: 'Markdown' }
  );
}

// === Graceful shutdown ===
process.on('SIGINT', async () => {
  console.log('\n[bot] shutting down...');
  await prisma.$disconnect();
  bot.stopPolling();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n[bot] SIGTERM received, shutting down...');
  await prisma.$disconnect();
  bot.stopPolling();
  process.exit(0);
});
