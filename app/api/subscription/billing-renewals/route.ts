// app/api/subscription/billing-renewals/route.ts
// POST: Process billing renewals (should be called by cron job)
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getUserSubscription, suspendSubscription, logAuditEvent } from '@/lib/services/subscription';
import { initiateStkPush } from '@/lib/services/mpesa';

export async function POST(request: NextRequest) {
  try {
    const now = new Date();

    // Find subscriptions due for renewal (next_billing_at <= now and status = active)
    const { data: subscriptions, error } = await supabaseAdmin
      .from('subscriptions')
      .select('user_id, plan_id, mpesa_phone_number, billing_interval')
      .eq('status', 'active')
      .lte('next_billing_at', now.toISOString());

    if (error) throw error;

    const results = { processed: 0, successful: 0, failed: 0 };

    for (const sub of subscriptions || []) {
      try {
        results.processed++;

        // Get plan details
        const { data: plan } = await supabaseAdmin
          .from('plans')
          .select('price_cents')
          .eq('id', sub.plan_id)
          .single();

        if (!plan || plan.price_cents === 0) continue; // Skip free plans

        const amount = Math.ceil(plan.price_cents / 100);

        // Trigger MPesa STK push for renewal
        await initiateStkPush(
          sub.user_id,
          sub.mpesa_phone_number || '',
          amount,
          `renewal_${Date.now()}_${sub.user_id.substring(0, 8)}`,
          `renewal_${Date.now()}`,
          sub.plan_id
        );

        // Set status to past_due (will be updated on payment success)
        await supabaseAdmin
          .from('subscriptions')
          .update({
            status: 'past_due',
            updated_at: now.toISOString(),
          })
          .eq('user_id', sub.user_id);

        await logAuditEvent(sub.user_id, 'billing.renewal_initiated', 'subscription', undefined, {
          planId: sub.plan_id,
          amount,
          billingInterval: sub.billing_interval,
        });

        results.successful++;
      } catch (err) {
        console.error(`Failed to process renewal for user ${sub.user_id}:`, err);
        results.failed++;
      }
    }

    // Check for subscriptions that have been past_due for more than grace period (e.g., 7 days)
    const gracePeriodEnd = new Date(now);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() - 7);

    const { data: pastDueSubscriptions } = await supabaseAdmin
      .from('subscriptions')
      .select('user_id')
      .eq('status', 'past_due')
      .lt('updated_at', gracePeriodEnd.toISOString());

    for (const pastDueSub of pastDueSubscriptions || []) {
      await suspendSubscription(pastDueSub.user_id);
    }

    return NextResponse.json({
      success: true,
      message: 'Billing renewals processed',
      results,
      suspended: pastDueSubscriptions?.length || 0,
    });
  } catch (error: unknown) {
    console.error('Error processing billing renewals:', error);
    const message = error instanceof Error ? error.message : 'Failed to process billing renewals';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}