// lib/authMiddleware.ts
// Middleware to extract and verify Supabase JWT from Authorization header
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { getUserSubscription } from '@/lib/services/subscription';

export interface AuthenticatedRequest extends NextRequest {
  userId?: string;
  userEmail?: string;
}

// Higher-order function that wraps a handler with auth verification
export function withAuth(
  handler: (req: AuthenticatedRequest, userId: string) => Promise<NextResponse>
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const authHeader = req.headers.get('authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];

    try {
      const { data, error } = await supabaseAdmin.auth.getUser(token);

      if (error || !data.user) {
        return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
      }

      const authReq = req as AuthenticatedRequest;
      authReq.userId = data.user.id;
      authReq.userEmail = data.user.email;

      return handler(authReq, data.user.id);
    } catch (err) {
      console.error('Auth error:', err);
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
    }
  };
}

// Higher-order function that requires an active subscription
export function withSubscription(
  handler: (req: AuthenticatedRequest, userId: string) => Promise<NextResponse>
) {
  return withAuth(async (req, userId) => {
    const subscription = await getUserSubscription(userId);

    if (!subscription || subscription.status !== 'active') {
      return NextResponse.json({ error: 'Active subscription required' }, { status: 403 });
    }

    return handler(req, userId);
  });
}

// Higher-order function that allows access if user has active subscription or is within limits
export function withSubscriptionOrLimits(
  handler: (req: AuthenticatedRequest, userId: string) => Promise<NextResponse>
) {
  return withAuth(async (req, userId) => {
    const subscription = await getUserSubscription(userId);

    // Block suspended users
    if (subscription && subscription.status === 'suspended') {
      return NextResponse.json({ error: 'Account suspended due to payment issues' }, { status: 403 });
    }

    // If user has active subscription, allow access
    if (subscription && subscription.status === 'active') {
      return handler(req, userId);
    }

    // For users without active subscription, check if they're within free limits
    // This will be checked in the individual service functions
    return handler(req, userId);
  });
}
