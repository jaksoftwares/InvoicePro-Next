// lib/services/mpesa.ts
// M-Pesa payment operations
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const MPESA_CONFIG = {
  baseUrl: process.env.MPESA_BASE_URL || 'https://sandbox.safaricom.co.ke',
  consumerKey: process.env.MPESA_CONSUMER_KEY || '',
  consumerSecret: process.env.MPESA_CONSUMER_SECRET || '',
  shortcode: process.env.MPESA_SHORTCODE || '174379',
  passkey: process.env.MPESA_PASSKEY || '',
  callbackUrl: process.env.MPESA_CALLBACK_URL || '',
  accountReference: process.env.MPESA_ACCOUNT_REFERENCE || 'InvoicePro',
  transactionDesc: process.env.MPESA_TRANSACTION_DESC || 'Subscription Payment',
};

export async function getMpesaToken(): Promise<string | null> {
  try {
    const auth = Buffer.from(`${MPESA_CONFIG.consumerKey}:${MPESA_CONFIG.consumerSecret}`).toString('base64');
    const response = await fetch(
      `${MPESA_CONFIG.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      { headers: { Authorization: `Basic ${auth}` } }
    );
    const data = await response.json();
    return data.access_token || null;
  } catch {
    return null;
  }
}

export function generateTimestamp(): string {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
}

export function generatePassword(timestamp: string): string {
  return Buffer.from(`${MPESA_CONFIG.shortcode}${MPESA_CONFIG.passkey}${timestamp}`).toString('base64');
}

export async function initiateStkPush(userId: string, phoneNumber: string, amount: number, checkoutRequestId: string, merchantRequestId: string, planId: string) {
  await supabaseAdmin.from('payment_events').insert({
    user_id: userId,
    mpesa_event_id: checkoutRequestId,
    type: 'mpesa.stkpush.initiated',
    payload: { planId, phoneNumber, amount, checkoutRequestId, merchantRequestId },
  });
}

export async function recordPaymentSuccess(userId: string, checkoutRequestId: string, payload: Record<string, unknown>) {
  await supabaseAdmin.from('payment_events').insert({
    user_id: userId,
    mpesa_event_id: `${checkoutRequestId}_success`,
    type: 'mpesa.payment.success',
    payload,
  });
}

export async function recordPaymentFailure(userId: string, checkoutRequestId: string, payload: Record<string, unknown>) {
  await supabaseAdmin.from('payment_events').insert({
    user_id: userId,
    mpesa_event_id: `${checkoutRequestId}_failed`,
    type: 'mpesa.payment.failed',
    payload,
  });
}

export async function findPaymentEvent(checkoutRequestId: string) {
  const { data } = await supabaseAdmin
    .from('payment_events')
    .select('*')
    .eq('mpesa_event_id', checkoutRequestId)
    .eq('type', 'mpesa.stkpush.initiated')
    .single();

  return data;
}

export async function activateSubscription(userId: string, planId: string, mpesaReceiptNumber: string) {
  const now = new Date();
  const { data: plan } = await supabaseAdmin.from('plans').select('interval').eq('id', planId).single();
  const periodEnd = new Date(now);
  if (plan?.interval === 'year') periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  else periodEnd.setMonth(periodEnd.getMonth() + 1);

  const { data: existing } = await supabaseAdmin.from('subscriptions').select('id').eq('user_id', userId).single();

  if (existing) {
    await supabaseAdmin.from('subscriptions').update({
      plan_id: planId,
      status: 'active',
      mpesa_receipt_number: mpesaReceiptNumber,
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      canceled_at: null,
      cancel_at: null,
      updated_at: now.toISOString(),
    }).eq('user_id', userId);
  } else {
    await supabaseAdmin.from('subscriptions').insert({
      user_id: userId,
      plan_id: planId,
      status: 'active',
      mpesa_receipt_number: mpesaReceiptNumber,
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
    });
  }
}

export async function getPaymentStatus(checkoutRequestId: string) {
  const { data: successEvent } = await supabaseAdmin
    .from('payment_events')
    .select('*')
    .eq('mpesa_event_id', `${checkoutRequestId}_success`)
    .single();

  if (successEvent) return { status: 'completed', message: 'Payment successful', receiptNumber: successEvent.payload?.mpesaReceiptNumber };

  const { data: failedEvent } = await supabaseAdmin
    .from('payment_events')
    .select('*')
    .eq('mpesa_event_id', `${checkoutRequestId}_failed`)
    .single();

  if (failedEvent) return { status: 'failed', message: failedEvent.payload?.resultDesc || 'Payment failed' };

  return null;
}

export function extractCallbackMetadata(metadata: Array<{ Name: string; Value?: string | number }>) {
  return {
    amount: metadata.find((i) => i.Name === 'Amount')?.Value,
    mpesaReceiptNumber: metadata.find((i) => i.Name === 'MpesaReceiptNumber')?.Value,
    transactionDate: metadata.find((i) => i.Name === 'TransactionDate')?.Value,
    phoneNumber: metadata.find((i) => i.Name === 'PhoneNumber')?.Value,
  };
}

export { MPESA_CONFIG };
