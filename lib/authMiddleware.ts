// lib/authMiddleware.ts
// Middleware to extract and verify Supabase JWT from Authorization header
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

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
