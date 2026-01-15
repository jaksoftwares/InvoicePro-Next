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

export async function activateSubscription(userId: string, checkoutRequestId: string, planId: string, mpesaReceiptNumber: string, amount: number, phoneNumber: string) {
  const { activateSubscription: activate, getUserSubscription, logAuditEvent } = await import('./subscription');

  // Check if this is a renewal payment (checkoutRequestId starts with 'renewal_')
  const isRenewal = checkoutRequestId.startsWith('renewal_');

  // Insert into mpesa_payments table
  await supabaseAdmin.from('mpesa_payments').insert({
    user_id: userId,
    plan_id: planId,
    phone_number: phoneNumber,
    amount: amount,
    currency: 'KES',
    checkout_request_id: checkoutRequestId,
    mpesa_receipt_number: mpesaReceiptNumber,
    status: 'completed',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (isRenewal) {
    // Handle renewal: extend the billing cycle
    const subscription = await getUserSubscription(userId);
    if (!subscription) throw new Error('Subscription not found for renewal');

    const now = new Date();
    const nextBillingDate = new Date(subscription.nextBillingAt || now);

    // Extend the billing cycle
    if (subscription.billingInterval === 'year') {
      nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
    } else {
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    }

    await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'active',
        current_period_end: nextBillingDate.toISOString(),
        next_billing_at: nextBillingDate.toISOString(),
        last_payment_at: now.toISOString(),
        payment_status: 'paid',
        suspended_at: null,
        updated_at: now.toISOString(),
      })
      .eq('user_id', userId);

    await logAuditEvent(userId, 'billing.renewal_completed', 'subscription', undefined, {
      planId,
      amount,
      mpesaReceiptNumber,
      nextBillingAt: nextBillingDate.toISOString(),
    });

    return await getUserSubscription(userId);
  } else {
    // Handle initial activation
    return await activate(userId, planId, mpesaReceiptNumber);
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
