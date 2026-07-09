import { NextRequest, NextResponse } from 'next/server';
import { getSessionFromRequest } from '@/lib/auth';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

// Password strength validation
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

  // Check for common weak passwords
  const commonPasswords = ['12345678', 'password', 'Password1', 'qwerty123', 'Aa123456', 'Pass1234'];
  if (commonPasswords.some(cp => password.toLowerCase() === cp.toLowerCase())) {
    errors.push('این رمز عبور بسیار رایج است. لطفاً رمز عبور قوی‌تر انتخاب کنید');
  }

  return { valid: errors.length === 0, errors };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: 'احراز هویت نشده' }, { status: 401 });
    }

    const body = await request.json();
    const { currentPassword, newPassword, confirmPassword } = body;

    // Validate inputs
    if (!currentPassword || !newPassword || !confirmPassword) {
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

    // Validate new password strength
    const strengthCheck = validatePasswordStrength(newPassword);
    if (!strengthCheck.valid) {
      return NextResponse.json(
        { error: strengthCheck.errors[0], allErrors: strengthCheck.errors },
        { status: 400 }
      );
    }

    // Get user with password
    const user = await db.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: 'رمز عبور فعلی اشتباه است' },
        { status: 401 }
      );
    }

    // Check new password is different from current
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return NextResponse.json(
        { error: 'رمز عبور جدید باید با رمز عبور فعلی متفاوت باشد' },
        { status: 400 }
      );
    }

    // Hash new password with higher salt rounds for better security
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await db.user.update({
      where: { id: session.userId },
      data: { password: hashedPassword },
    });

    // Invalidate all password reset tokens for this user
    await db.passwordResetToken.updateMany({
      where: { userId: session.userId, used: false },
      data: { used: true },
    });

    return NextResponse.json({
      message: 'رمز عبور با موفقیت تغییر کرد',
    });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { error: 'خطا در تغییر رمز عبور. لطفاً دوباره تلاش کنید.' },
      { status: 500 }
    );
  }
}
