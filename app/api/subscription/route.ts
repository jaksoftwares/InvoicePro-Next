// app/api/subscription/route.ts
// GET: Get user subscription
// POST: Create subscription
// PUT: Update subscription (change plan)
// DELETE: Cancel subscription
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/authMiddleware';
import {
  getUserSubscription,
  createSubscription,
  changePlan,
  cancelSubscription,
  getUsageCounters,
} from '@/lib/services/subscription';

export async function GET(request: NextRequest) {
  return withAuth(async (req, userId) => {
    try {
      const subscription = await getUserSubscription(userId);
      const usageCounters = await getUsageCounters(userId);

      return NextResponse.json({
        subscription,
        usageCounters,
      });
    } catch (error) {
      console.error('Error fetching subscription:', error);
      return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
    }
  })(request);
}

export async function POST(request: NextRequest) {
  return withAuth(async (req, userId) => {
    try {
      const body = await req.json();
      const { planId, mpesaPhoneNumber } = body;

      if (!planId) {
        return NextResponse.json({ error: 'planId is required' }, { status: 400 });
      }

      const subscription = await createSubscription(userId, planId, mpesaPhoneNumber);

      return NextResponse.json({ subscription }, { status: 201 });
    } catch (error: unknown) {
      console.error('Error creating subscription:', error);
      const message = error instanceof Error ? error.message : 'Failed to create subscription';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  })(request);
}

export async function PUT(request: NextRequest) {
  return withAuth(async (req, userId) => {
    try {
      const body = await req.json();
      const { planId } = body;

      if (!planId) {
        return NextResponse.json({ error: 'planId is required' }, { status: 400 });
      }

      const subscription = await changePlan(userId, planId);

      return NextResponse.json({ subscription });
    } catch (error: unknown) {
      console.error('Error changing plan:', error);
      const message = error instanceof Error ? error.message : 'Failed to change plan';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  })(request);
}

export async function DELETE(request: NextRequest) {
  return withAuth(async (req, userId) => {
    try {
      const { searchParams } = new URL(request.url);
      const cancelAtPeriodEnd = searchParams.get('cancelAtPeriodEnd') !== 'false';

      const subscription = await cancelSubscription(userId, cancelAtPeriodEnd);

      return NextResponse.json({ subscription });
    } catch (error: unknown) {
      console.error('Error canceling subscription:', error);
      const message = error instanceof Error ? error.message : 'Failed to cancel subscription';
      return NextResponse.json({ error: message }, { status: 500 });
    }
  })(request);
}
