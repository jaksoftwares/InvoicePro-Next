// app/api/plans/route.ts
// GET: List all plans (public)
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

type PlanRow = { id: string; name: string; description: string | null; price_cents: number; currency: string; interval: string; features: Record<string, unknown> | null };

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin.from('plans').select('*').order('price_cents', { ascending: true });
    if (error) throw error;
    const plans = (data as PlanRow[]).map((plan) => ({
      id: plan.id, name: plan.name, description: plan.description, priceCents: plan.price_cents,
      currency: plan.currency, interval: plan.interval, features: plan.features || {},
    }));
    return NextResponse.json({ plans });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch plans' }, { status: 500 });
  }
}
