// lib/authMiddleware.ts
// Middleware to extract and verify Supabase JWT from Authorization header
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/app/api/lib/supabaseAdmin';

export interface AuthenticatedRequest extends NextRequest {
  userId?: string;
  userEmail?: string;
}

export async function withAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
  req: NextRequest
): Promise<NextResponse> {
  const authHeader = req.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verify the JWT using Supabase
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data.user) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }

    // Create an authenticated request with user info
    const authReq = req as AuthenticatedRequest;
    authReq.userId = data.user.id;
    authReq.userEmail = data.user.email;

    return handler(authReq);
  } catch (err) {
    console.error('Auth error:', err);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
  }
}
