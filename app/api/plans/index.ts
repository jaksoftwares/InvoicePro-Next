// app/api/plans/index.ts
// GET: List all subscription plans (public endpoint)
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

type PlanRow = {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  currency: string;
  interval: string;
  features: Record<string, unknown> | null;
};

async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from('plans')
      .select('*')
      .order('price_cents', { ascending: true });

    if (error) {
      console.error('Error fetching plans:', error);
      return NextResponse.json(
        { error: 'Failed to fetch plans' },
        { status: 500 }
      );
    }

    const plans = (data as PlanRow[]).map((plan) => ({
      id: plan.id,
      name: plan.name,
      description: plan.description,
      priceCents: plan.price_cents,
      currency: plan.currency,
      interval: plan.interval,
      features: plan.features || {},
    }));

    return NextResponse.json({ plans });
  } catch (error) {
    console.error('Error fetching plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch plans' },
      { status: 500 }
    );
  }
}

export { GET };
