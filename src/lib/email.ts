import nodemailer from 'nodemailer';

/**
 * Email Configuration Module
 * 
 * ===== ACTIVE INSTRUCTION FOR DEPLOYMENT =====
 * To enable email sending on your hosting:
 * 
 * 1. Set these environment variables in your hosting panel or .env file:
 *    - SMTP_HOST: Your mail server (e.g., mail.yourdomain.com)
 *    - SMTP_PORT: Port (usually 465 for SSL, 587 for TLS)
 *    - SMTP_USER: Email address (e.g., noreply@yourdomain.com)
 *    - SMTP_PASS: Email password
 *    - SMTP_FROM: Sender name and email (e.g., "محتواسان <noreply@yourdomain.com>")
 *    - EMAIL_ENABLED: Set to "true" to enable email sending
 * 
 * 2. Most cPanel/DirectAdmin hostings provide SMTP access:
 *    - Create an email account in cPanel (e.g., noreply@yourdomain.com)
 *    - Use the SMTP credentials below
 *    - Host: mail.yourdomain.com (or your server's hostname)
 *    - Port: 465 (SSL) or 587 (STARTTLS)
 * 
 * 3. For better deliverability, configure SPF, DKIM, and DMARC records
 *    in your domain's DNS settings.
 * ===== END DEPLOYMENT INSTRUCTIONS =====
 */

// Check if email is enabled via environment variable
const isEmailEnabled = process.env.EMAIL_ENABLED === 'true';

// Create transporter only if SMTP config is available
function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
    tls: {
      // Do not fail on invalid certs (common on shared hosting)
      rejectUnauthorized: false,
    },
  });
}

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email
 * Returns true if email was sent successfully, false otherwise
 */
export async function sendEmail({ to, subject, html, text }: EmailOptions): Promise<boolean> {
  // If email is not enabled, log and return
  if (!isEmailEnabled) {
    console.log(`[EMAIL DISABLED] To: ${to}, Subject: ${subject}`);
    console.log(`[EMAIL DISABLED] Set EMAIL_ENABLED=true in .env to enable email sending`);
    return false;
  }

  const transporter = createTransporter();
  if (!transporter) {
    console.error('[EMAIL ERROR] SMTP configuration is incomplete. Set SMTP_HOST, SMTP_USER, SMTP_PASS in .env');
    return false;
  }

  const from = process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@localhost';

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
      text: text || '',
    });

    console.log(`[EMAIL SENT] To: ${to}, Subject: ${subject}, MessageId: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('[EMAIL ERROR] Failed to send email:', error);
    return false;
  }
}

/**
 * Generate OTP email HTML template (Persian)
 */
export function generateOtpEmailHtml(code: string, expiresInMinutes: number = 5): string {
  return `
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;700&display=swap');
    body { font-family: 'Vazirmatn', Tahoma, Arial, sans-serif; direction: rtl; background: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 480px; margin: 20px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #10b981, #14b8a6, #8b5cf6); padding: 28px 24px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 13px; }
    .content { padding: 28px 24px; text-align: center; }
    .otp-label { color: #6b7280; font-size: 14px; margin-bottom: 12px; }
    .otp-code { font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #10b981; background: #ecfdf5; padding: 16px 24px; border-radius: 12px; display: inline-block; direction: ltr; margin: 8px 0 16px; }
    .expiry { color: #9ca3af; font-size: 12px; margin-top: 16px; }
    .footer { padding: 16px 24px; text-align: center; border-top: 1px solid #f3f4f6; }
    .footer p { color: #9ca3af; font-size: 11px; margin: 4px 0; }
    .warning { color: #ef4444; font-size: 12px; margin-top: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>محتواسان</h1>
      <p>کد تایید هویت</p>
    </div>
    <div class="content">
      <p class="otp-label">کد تایید شما:</p>
      <div class="otp-code">${code}</div>
      <p class="expiry">این کد تا ${expiresInMinutes} دقیقه معتبر است</p>
      <p class="warning">اگر شما این درخواست را ارسال نکرده‌اید، این ایمیل را نادیده بگیرید.</p>
    </div>
    <div class="footer">
      <p>محتواسان - تولید محتوای فروشی فارسی با هوش مصنوعی</p>
      <p>این ایمیل به صورت خودکار ارسال شده است. لطفاً پاسخ ندهید.</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generate Password Reset email HTML template (Persian)
 */
export function generateResetPasswordHtml(resetLink: string): string {
  return `
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;700&display=swap');
    body { font-family: 'Vazirmatn', Tahoma, Arial, sans-serif; direction: rtl; background: #f5f5f5; margin: 0; padding: 0; }
    .container { max-width: 480px; margin: 20px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
    .header { background: linear-gradient(135deg, #8b5cf6, #a855f7); padding: 28px 24px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 20px; font-weight: 700; }
    .header p { color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 13px; }
    .content { padding: 28px 24px; text-align: center; }
    .reset-btn { display: inline-block; background: linear-gradient(135deg, #8b5cf6, #a855f7); color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 10px; font-size: 15px; font-weight: 700; margin: 16px 0; }
    .or-link { color: #6b7280; font-size: 12px; margin-top: 12px; }
    .or-link a { color: #8b5cf6; word-break: break-all; direction: ltr; }
    .expiry { color: #9ca3af; font-size: 12px; margin-top: 16px; }
    .footer { padding: 16px 24px; text-align: center; border-top: 1px solid #f3f4f6; }
    .footer p { color: #9ca3af; font-size: 11px; margin: 4px 0; }
    .warning { color: #ef4444; font-size: 12px; margin-top: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>محتواسان</h1>
      <p>بازنشانی رمز عبور</p>
    </div>
    <div class="content">
      <p>برای بازنشانی رمز عبور خود، روی دکمه زیر کلیک کنید:</p>
      <a href="${resetLink}" class="reset-btn">بازنشانی رمز عبور</a>
      <p class="or-link">اگر دکمه کار نکرد، لینک زیر را در مرورگر کپی کنید:<br><a href="${resetLink}">${resetLink}</a></p>
      <p class="expiry">این لینک تا ۱ ساعت معتبر است</p>
      <p class="warning">اگر شما این درخواست را ارسال نکرده‌اید، این ایمیل را نادیده بگیرید.</p>
    </div>
    <div class="footer">
      <p>محتواسان - تولید محتوای فروشی فارسی با هوش مصنوعی</p>
      <p>این ایمیل به صورت خودکار ارسال شده است. لطفاً پاسخ ندهید.</p>
    </div>
  </div>
</body>
</html>`;
}
