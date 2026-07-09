// SMS via Melipayamak (ملی‌پیامک). Set SMS_ENABLED=true and MELIPAYAMAK_*
// env vars to activate. Docs: https://github.com/Melipayamak/NodeJS


// Check if SMS is enabled via environment variable
const isSmsEnabled = process.env.SMS_ENABLED === 'true';

interface SmsResult {
  success: boolean;
  message: string;
  recId?: string;
}

/**
 * Send SMS via Melipayamak API
 * 
 * @param receptor - Phone number in format 09123456789
 * @param message - SMS text content
 * @returns SmsResult with success status
 */
export async function sendSms(receptor: string, message: string): Promise<SmsResult> {
  // If SMS is not enabled, log and return
  if (!isSmsEnabled) {
    console.log(`[SMS DISABLED] To: ${receptor}, Message: ${message}`);
    console.log(`[SMS DISABLED] Set SMS_ENABLED=true in .env to enable SMS sending`);
    return { success: false, message: 'SMS service is not enabled' };
  }

  const apiKey = process.env.MELIPAYAMAK_API_KEY;
  const sender = process.env.MELIPAYAMAK_SENDER;

  if (!apiKey || !sender) {
    console.error('[SMS ERROR] Melipayamak configuration is incomplete. Set MELIPAYAMAK_API_KEY and MELIPAYAMAK_SENDER in .env');
    return { success: false, message: 'SMS configuration incomplete' };
  }

  try {
    // Normalize phone number for Melipayamak (needs format: 09123456789)
    const normalizedReceptor = receptor.startsWith('+98') 
      ? '0' + receptor.slice(3) 
      : receptor;

    // Method 1: Melipayamak REST API (simple send)
    const response = await fetch('https://rest.payamak-panel.com/api/SendSMS/SendSMS', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: apiKey.split('|')[0] || apiKey, // Some APIs use username|password format
        password: apiKey.split('|')[1] || '',
        from: sender,
        to: normalizedReceptor,
        text: message,
        isFlash: false,
      }),
    });

    const data = await response.json();

    if (data.RetStatus === 1 || data.StrRetStatus === 'Ok') {
      console.log(`[SMS SENT] To: ${normalizedReceptor}, RecId: ${data.RecId || 'N/A'}`);
      return { success: true, message: 'SMS sent successfully', recId: data.RecId };
    } else {
      console.error('[SMS ERROR] Melipayamak returned error:', data);
      return { success: false, message: 'SMS provider returned error' };
    }

    // Method 2: OTP template (more reliable for OTP, uncomment if needed)
    // Uncomment this block and comment out Method 1 if you have an OTP template:
    /*
    const templateId = process.env.MELIPAYAMAK_OTP_TEMPLATE_ID;
    if (templateId) {
      const otpResponse = await fetch('https://rest.payamak-panel.com/api/SendSMS/BaseServiceNumber', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: apiKey.split('|')[0] || apiKey,
          password: apiKey.split('|')[1] || '',
          from: sender,
          to: normalizedReceptor,
          bodyId: templateId,
          text: message.replace(/[^0-9]/g, ''), // Just the OTP code number
        }),
      });
      const otpData = await otpResponse.json();
      if (otpData.RetStatus === 1) {
        return { success: true, message: 'OTP SMS sent via template', recId: otpData.RecId };
      }
    }
    */
  } catch (error) {
    console.error('[SMS ERROR] Failed to send SMS:', error);
    return { success: false, message: 'Failed to connect to SMS provider' };
  }
}

/**
 * Generate OTP SMS text (Persian)
 */
export function generateOtpSmsText(code: string): string {
  return `محتواسان\nکد تایید شما: ${code}\nاین کد تا ۵ دقیقه معتبر است`;
}
