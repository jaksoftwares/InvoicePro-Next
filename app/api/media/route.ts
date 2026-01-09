// app/api/media/route.ts
// GET: List media, POST: Store media or sign upload
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/authMiddleware';
import { listMedia, storeMedia, generateUploadSignature } from '@/lib/services/media';

export async function GET(request: NextRequest) {
  return withAuth(async (req, userId) => {
    try {
      const media = await listMedia(userId);
      return NextResponse.json({ media });
    } catch {
      return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 });
    }
  })(request);
}

export async function POST(request: NextRequest) {
  return withAuth(async (req, userId) => {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    try {
      if (action === 'sign-upload') {
        const body = await req.json().catch(() => ({}));
        const signature = generateUploadSignature(userId, body.folder, body.resourceType);
        return NextResponse.json(signature);
      }
      const body = await req.json().catch(() => ({}));
      const media = await storeMedia(userId, body);
      return NextResponse.json({ media }, { status: 201 });
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Failed to process request' }, { status: 500 });
    }
  })(request);
}
