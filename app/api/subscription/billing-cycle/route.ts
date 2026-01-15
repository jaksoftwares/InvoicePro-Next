// app/api/subscription/billing-cycle/route.ts
// POST: Process billing cycle resets (should be called by cron job)
import { NextRequest, NextResponse } from 'next/server';
import { processBillingCycleResets } from '@/lib/services/subscription';

export async function POST(request: NextRequest) {
  try {
    // This should be secured with proper authentication for cron jobs
    // For now, allowing it without auth for simplicity
    await processBillingCycleResets();
    return NextResponse.json({ success: true, message: 'Billing cycle resets processed' });
  } catch (error: unknown) {
    console.error('Error processing billing cycle resets:', error);
    const message = error instanceof Error ? error.message : 'Failed to process billing cycle resets';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}