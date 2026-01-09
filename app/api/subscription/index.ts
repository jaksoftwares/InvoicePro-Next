// app/api/subscription/index.ts
// GET: Fetch current user's subscription
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

async function getSubscription(req: AuthenticatedRequest): Promise<NextResponse> {
  const userId = req.userId!;

  const { data, error } = await supabaseAdmin
    .from('subscriptions')
    .select('*, plans(*)')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    // No subscription found
    return NextResponse.json({ subscription: null });
  }

  const subscription = {
    id: data.id,
    planId: data.plan_id,
    plan: data.plans ? {
      id: data.plans.id,
      name: data.plans.name,
      description: data.plans.description,
      priceCents: data.plans.price_cents,
      currency: data.plans.currency,
      interval: data.plans.interval,
      features: data.plans.features || {},
    } : null,
    status: data.status,
    mpesaReceiptNumber: data.mpesa_receipt_number || null,
    currentPeriodStart: data.current_period_start,
    currentPeriodEnd: data.current_period_end,
    cancelAt: data.cancel_at,
    canceledAt: data.canceled_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };

  return NextResponse.json({ subscription });
}

async function GET(request: NextRequest) {
  return withAuth((req) => getSubscription(req as AuthenticatedRequest))(request);
}

export { GET };
