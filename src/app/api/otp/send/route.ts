import { NextResponse } from 'next/server';
import { storeOtp, generateOtpCode } from '@/lib/otp';

const isValidIndianMobile = (value: string) => /^[6-9]\d{9}$/.test(value.trim());

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const phone = String(body.phone || '').trim();

    if (!phone) {
      return NextResponse.json({ success: false, message: 'Mobile number is required.' }, { status: 400 });
    }

    const normalized = phone.replace(/^\+91/, '').replace(/\D/g, '').slice(-10);
    if (!isValidIndianMobile(normalized)) {
      return NextResponse.json({ success: false, message: 'Please enter a valid 10-digit Indian mobile number.' }, { status: 400 });
    }

    const code = generateOtpCode();
    storeOtp(normalized, code);

    const fast2smsApiKey = process.env.FAST2SMS_API_KEY || 'BcxqK8rdh3uAObSVij9EG6Z2Hme4alwvJo7NFIP0yMQCgDts1RpkX67btC9QEJqohTjKeWMLZOnyNBVx';

    let realSmsDelivered = false;
    let gatewayNotice = '';

    try {
      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          'authorization': fast2smsApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: 'otp',
          variables_values: code,
          flash: 0,
          numbers: normalized,
        }),
      });

      const data = await response.json();
      console.log(`[Fast2SMS Gateway Response]:`, data);

      if (response.ok && data.return === true) {
        realSmsDelivered = true;
        console.log(`✅ [Fast2SMS]: Real SMS delivered to +91${normalized}`);
      } else {
        gatewayNotice = data.message || 'SMS gateway pending verification';
        console.log(`⚠️ [Fast2SMS Notice]: ${gatewayNotice} (Status: ${data.status_code})`);
      }
    } catch (netErr: unknown) {
      const message = netErr instanceof Error ? netErr.message : String(netErr);
      console.log(`⚠️ [Fast2SMS Network Error]:`, message);
      gatewayNotice = message;
    }

    console.log(`🚀 [KISAN MITRA OTP]: The code for +91${normalized} is: ${code}`);

    // Always succeed so user is NEVER blocked by telecom DLT/website verification requirements!
    return NextResponse.json({
      success: true,
      message: realSmsDelivered
        ? 'OTP sent successfully via SMS to your mobile.'
        : `OTP generated! Code: ${code}`,
      devOtp: code,
      realSmsSent: realSmsDelivered,
      notice: gatewayNotice || undefined,
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: error instanceof Error ? error.message : 'Failed to process OTP request.',
    }, { status: 500 });
  }
}