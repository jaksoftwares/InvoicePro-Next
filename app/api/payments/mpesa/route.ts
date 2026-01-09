// app/api/payments/mpesa/route.ts
// POST: Subscribe (STK Push), Callback (webhook), Status check
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/authMiddleware';
import {
  getMpesaToken, generateTimestamp, generatePassword, MPESA_CONFIG,
  initiateStkPush, findPaymentEvent, recordPaymentSuccess, recordPaymentFailure,
  activateSubscription, getPaymentStatus, extractCallbackMetadata,
} from '@/lib/services/mpesa';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

async function handleSubscribe(req: NextRequest): Promise<NextResponse> {
  const body = await req.json().catch(() => ({}));
  const { planId, phoneNumber } = body;
  const userId = (req as NextRequest & { userId?: string }).userId!;
  if (!planId || !phoneNumber) return NextResponse.json({ error: 'Missing planId or phoneNumber' }, { status: 400 });

  const cleanPhone = phoneNumber.replace(/\D/g, '');
  if (!cleanPhone.match(/^254\d{9}$/)) return NextResponse.json({ error: 'Invalid phone format. Use 2547XXXXXXXX' }, { status: 400 });

  const { data: plan, error: planError } = await supabaseAdmin.from('plans').select('*').eq('id', planId).single();
  if (planError || !plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });

  const amount = Math.ceil(plan.price_cents / 100);
  const authToken = await getMpesaToken();
  if (!authToken) return NextResponse.json({ error: 'M-Pesa auth failed' }, { status: 500 });

  const timestamp = generateTimestamp();
  const password = generatePassword(timestamp);
  const stkResponse = await fetch(`${MPESA_CONFIG.baseUrl}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      BusinessShortCode: MPESA_CONFIG.shortcode, Password: password, Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline', Amount: amount, PartyA: cleanPhone,
      PartyB: MPESA_CONFIG.shortcode, PhoneNumber: cleanPhone, CallBackURL: MPESA_CONFIG.callbackUrl,
      AccountReference: `${MPESA_CONFIG.accountReference}_${userId.substring(0, 8)}`,
      TransactionDesc: MPESA_CONFIG.transactionDesc,
    }),
  });

  const stkResult = await stkResponse.json();
  if (stkResult.ResponseCode !== '0') return NextResponse.json({ error: 'STK Push failed', details: stkResult.ResponseDescription }, { status: 400 });

  await initiateStkPush(userId, cleanPhone, amount, stkResult.CheckoutRequestID, stkResult.MerchantRequestID, planId);
  return NextResponse.json({ status: 'pending', message: 'STK Push initiated', checkoutRequestId: stkResult.CheckoutRequestID });
}

async function handleCallback(req: NextRequest): Promise<NextResponse> {
  const body = await req.json().catch(() => ({}));
  const callback = body.Body?.stkCallback;
  if (!callback) return NextResponse.json({ ResultCode: 1, ResultDesc: 'Invalid callback' }, { status: 400 });

  const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } = callback;
  const paymentEvent = await findPaymentEvent(CheckoutRequestID);
  if (!paymentEvent) return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });

  const userId = paymentEvent.user_id;
  if (ResultCode === 0) {
    const metadata = extractCallbackMetadata(CallbackMetadata?.Item || []);
    await recordPaymentSuccess(userId, CheckoutRequestID, { ...metadata, planId: paymentEvent.payload?.planId });
    await activateSubscription(userId, paymentEvent.payload?.planId as string, metadata.mpesaReceiptNumber as string);
  } else {
    await recordPaymentFailure(userId, CheckoutRequestID, { resultCode: ResultCode, resultDesc: ResultDesc, planId: paymentEvent.payload?.planId });
  }

  return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
}

async function handleStatus(req: NextRequest): Promise<NextResponse> {
  const body = await req.json().catch(() => ({}));
  const { checkoutRequestId } = body;
  if (!checkoutRequestId) return NextResponse.json({ error: 'Missing checkoutRequestId' }, { status: 400 });

  const cachedStatus = await getPaymentStatus(checkoutRequestId);
  if (cachedStatus) return NextResponse.json(cachedStatus);

  const authToken = await getMpesaToken();
  if (!authToken) return NextResponse.json({ status: 'pending', message: 'Waiting for confirmation' });

  const timestamp = generateTimestamp();
  const password = generatePassword(timestamp);
  const queryResponse = await fetch(`${MPESA_CONFIG.baseUrl}/mpesa/stkpushquery/v1/query`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${authToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ BusinessShortCode: MPESA_CONFIG.shortcode, Password: password, Timestamp: timestamp, CheckoutRequestID: checkoutRequestId }),
  });

  const queryResult = await queryResponse.json();
  if (queryResult.ResultCode === '0') return NextResponse.json({ status: 'completed', message: 'Payment successful' });
  if (queryResult.ResultCode) return NextResponse.json({ status: 'failed', message: queryResult.ResultDesc || 'Payment failed' });
  return NextResponse.json({ status: 'pending', message: 'Payment is being processed' });
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'callback') return handleCallback(request);
  if (action === 'subscribe') return withAuth(() => handleSubscribe(request))(request);
  if (action === 'status') return withAuth(() => handleStatus(request))(request);

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
