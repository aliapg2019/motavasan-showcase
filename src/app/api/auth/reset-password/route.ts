import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// Password strength validation (same as change-password)
function validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('رمز عبور باید حداقل ۸ کاراکتر باشد');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('رمز عبور باید حداقل یک حرف بزرگ انگلیسی داشته باشد');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('رمز عبور باید حداقل یک حرف کوچک انگلیسی داشته باشد');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('رمز عبور باید حداقل یک عدد داشته باشد');
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('رمز عبور باید حداقل یک نماد خاص (!@#$%...) داشته باشد');
  }

  return { valid: errors.length === 0, errors };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, newPassword, confirmPassword } = body;

    if (!token || !newPassword || !confirmPassword) {
      return NextResponse.json(
        { error: 'تمام فیلدها الزامی است' },
        { status: 400 }
      );
    }

    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: 'رمز عبور جدید و تأیید آن مطابقت ندارند' },
        { status: 400 }
      );
    }

    // Validate password strength
    const strengthCheck = validatePasswordStrength(newPassword);
    if (!strengthCheck.valid) {
      return NextResponse.json(
        { error: strengthCheck.errors[0], allErrors: strengthCheck.errors },
        { status: 400 }
      );
    }

    // Hash the provided token to compare with stored hash
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find the reset token
    const resetToken = await db.passwordResetToken.findUnique({
      where: { token: hashedToken },
    });

    if (!resetToken) {
      return NextResponse.json(
        { error: 'لینک بازنشانی نامعتبر است' },
        { status: 400 }
      );
    }

    // Check if token is already used
    if (resetToken.used) {
      return NextResponse.json(
        { error: 'این لینک بازنشانی قبلاً استفاده شده است. لطفاً درخواست جدیدی ارسال کنید.' },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (new Date() > resetToken.expiresAt) {
      return NextResponse.json(
        { error: 'لینک بازنشانی منقضی شده است. لطفاً درخواست جدیدی ارسال کنید.' },
        { status: 400 }
      );
    }

    // Get user
    const user = await db.user.findUnique({
      where: { id: resetToken.userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'کاربر یافت نشد' },
        { status: 404 }
      );
    }

    // Hash new password with higher salt rounds
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update user password
    await db.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Mark token as used
    await db.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    });

    // Invalidate all other reset tokens for this user
    await db.passwordResetToken.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    // Log the password reset as a successful login attempt
    await db.loginAttempt.create({
      data: {
        userId: user.id,
        email: user.email,
        success: true,
      },
    });

    return NextResponse.json({
      message: 'رمز عبور با موفقیت بازنشانی شد. اکنون می‌توانید وارد حساب خود شوید.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json(
      { error: 'خطا در بازنشانی رمز عبور. لطفاً دوباره تلاش کنید.' },
      { status: 500 }
    );
  }
}
