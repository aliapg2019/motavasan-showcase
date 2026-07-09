import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import crypto from 'crypto';
import { sendEmail, generateResetPasswordHtml } from '@/lib/email';

// Rate limiting: track requests per email to prevent abuse
const resetRequests = new Map<string, { count: number; lastRequest: number }>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS_PER_WINDOW = 3;

// ===== DEPLOYMENT CONFIG =====
// The base URL for password reset links
// In production, set NEXT_PUBLIC_APP_URL in .env (e.g., https://yourdomain.com)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'ایمیل الزامی است' },
        { status: 400 }
      );
    }

    // Rate limiting check
    const now = Date.now();
    const rateData = resetRequests.get(email);
    if (rateData) {
      if (now - rateData.lastRequest < RATE_LIMIT_WINDOW && rateData.count >= MAX_REQUESTS_PER_WINDOW) {
        return NextResponse.json(
          { error: 'تعداد درخواست‌های بازنشانی رمز عبور بیش از حد مجاز است. لطفاً ۱۵ دقیقه صبر کنید.' },
          { status: 429 }
        );
      }
      if (now - rateData.lastRequest >= RATE_LIMIT_WINDOW) {
        resetRequests.set(email, { count: 1, lastRequest: now });
      } else {
        resetRequests.set(email, { count: rateData.count + 1, lastRequest: now });
      }
    } else {
      resetRequests.set(email, { count: 1, lastRequest: now });
    }

    // Always return the same response to prevent email enumeration
    const genericResponse = NextResponse.json({
      message: 'اگر این ایمیل در سیستم ثبت شده باشد، لینک بازنشانی رمز عبور ارسال خواهد شد',
    });

    // Check if user exists
    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal that user doesn't exist
      return genericResponse;
    }

    // Invalidate all previous unused reset tokens for this user
    await db.passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    // Generate a secure random token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Token expires in 1 hour
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Store token in database
    await db.passwordResetToken.create({
      data: {
        userId: user.id,
        token: hashedToken,
        expiresAt,
        used: false,
      },
    });

    // Generate the reset link for the client
    const resetLink = `${APP_URL}/reset-password?token=${resetToken}`;

    // ===== EMAIL SENDING =====
    // Email sending is controlled by EMAIL_ENABLED env variable
    // When disabled (default), reset link is only logged
    // When enabled (production with hosting), actual email is sent
    const emailSent = await sendEmail({
      to: email,
      subject: 'بازنشانی رمز عبور - محتواسان',
      html: generateResetPasswordHtml(resetLink),
      text: `برای بازنشانی رمز عبور روی لینک زیر کلیک کنید: ${resetLink}`,
    });

    if (emailSent) {
      console.log(`[RESET EMAIL SENT] To: ${email}`);
    } else {
      console.log(`[RESET EMAIL NOT SENT] To: ${email} - Email disabled or misconfigured`);
      console.log(`[DEV] Password reset link for ${email}: ${resetLink}`);
    }

    return NextResponse.json({
      message: 'اگر این ایمیل در سیستم ثبت شده باشد، لینک بازنشانی رمز عبور ارسال خواهد شد',
      // In development, return the token for testing
      // IMPORTANT: Remove _dev fields in production
      ...(process.env.NODE_ENV !== 'production' ? {
        _dev_resetToken: resetToken,
        _dev_resetLink: resetLink,
      } : {}),
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { error: 'خطا در پردازش درخواست. لطفاً دوباره تلاش کنید.' },
      { status: 500 }
    );
  }
}
