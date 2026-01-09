// app/api/subscription/route.ts
// GET: Get user subscription
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/authMiddleware';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

type SubscriptionRow = { id: string; user_id: string; plan_id: string; status: string; current_period_start: string | null; current_period_end: string | null; mpesa_receipt_number: string | null; created_at: string; updated_at: string };
type PlanRow = { id: string; name: string; description: string | null; price_cents: number; currency: string; interval: string };

export async function GET(request: NextRequest) {
  return withAuth(async (req, userId) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('subscriptions')
        .select('*, plans(*)')
        .eq('user_id', userId)
        .single();

      if (error || !data) return NextResponse.json({ subscription: null });

      const sub = data as SubscriptionRow & { plans: PlanRow };
      const subscription = {
        id: sub.id,
        userId: sub.user_id,
        planId: sub.plan_id,
        plan: sub.plans ? { id: sub.plans.id, name: sub.plans.name, description: sub.plans.description, priceCents: sub.plans.price_cents, currency: sub.plans.currency, interval: sub.plans.interval } : null,
        status: sub.status,
        currentPeriodStart: sub.current_period_start,
        currentPeriodEnd: sub.current_period_end,
        mpesaReceiptNumber: sub.mpesa_receipt_number,
        createdAt: sub.created_at,
        updatedAt: sub.updated_at,
      };

      return NextResponse.json({ subscription });
    } catch {
      return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
    }
  })(request);
}
