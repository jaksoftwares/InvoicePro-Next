// app/api/business-profiles/route.ts
// GET: List profiles, POST: Create profile
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/authMiddleware';
import { listProfiles, createProfile } from '@/lib/services/businessProfile';

export async function GET(request: NextRequest) {
  return withAuth(async (req, userId) => {
    try {
      const profiles = await listProfiles(userId);
      return NextResponse.json({ profiles });
    } catch {
      return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 });
    }
  })(request);
}

export async function POST(request: NextRequest) {
  return withAuth(async (req, userId) => {
    try {
      const body = await req.json().catch(() => ({}));
      if (!body.name || !body.email) {
        return NextResponse.json({ error: 'Missing required fields: name, email' }, { status: 400 });
      }
      const profile = await createProfile(userId, body);
      return NextResponse.json({ profile }, { status: 201 });
    } catch {
      return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 });
    }
  })(request);
}
