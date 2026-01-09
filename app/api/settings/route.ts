// app/api/settings/route.ts
// GET: Get settings, PUT: Update settings
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/authMiddleware';
import { getSettings, updateSettings } from '@/lib/services/settings';

export async function GET(request: NextRequest) {
  return withAuth(async (req, userId) => {
    try {
      const settings = await getSettings(userId);
      return NextResponse.json({ settings });
    } catch {
      return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
  })(request);
}

export async function PUT(request: NextRequest) {
  return withAuth(async (req, userId) => {
    try {
      const body = await req.json().catch(() => ({}));
      const settings = await updateSettings(userId, body);
      return NextResponse.json({ settings });
    } catch {
      return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
  })(request);
}
