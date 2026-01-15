// app/api/subscription/billing-history/route.ts
// GET: Get user's billing history
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/authMiddleware';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: NextRequest) {
  return withAuth(async (req, userId) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('mpesa_payments')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const payments = (data || []).map(payment => ({
        id: payment.id,
        userId: payment.user_id,
        subscriptionId: payment.subscription_id,
        planId: payment.plan_id,
        phoneNumber: payment.phone_number,
        amount: payment.amount,
        currency: payment.currency,
        checkoutRequestId: payment.checkout_request_id,
        merchantRequestId: payment.merchant_request_id,
        mpesaReceiptNumber: payment.mpesa_receipt_number,
        status: payment.status,
        rawCallback: payment.raw_callback,
        createdAt: payment.created_at,
        updatedAt: payment.updated_at,
      }));

      return NextResponse.json({ payments });
    } catch (error: unknown) {
      console.error('Error fetching billing history:', error);
      const message = error instanceof Error ? error.message : 'Failed to fetch billing history';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  })(request);
}