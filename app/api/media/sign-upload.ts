// app/api/media/sign-upload.ts
// POST: Generate Cloudinary upload signature for secure uploads
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import crypto from 'crypto';

const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || '';
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || '';
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';

async function handler(req: AuthenticatedRequest): Promise<NextResponse> {
  const body = await req.json().catch(() => ({}));
  const { folder = 'invoicepro', resourceType = 'image' } = body;
  const userId = req.userId!;

  if (!CLOUDINARY_API_SECRET || !CLOUDINARY_API_KEY || !CLOUDINARY_CLOUD_NAME) {
    return NextResponse.json({ error: 'Cloudinary not configured' }, { status: 500 });
  }

  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folderPath = `${folder}/${userId.substring(0, 8)}`;

    // Parameters to sign (must be in alphabetical order)
    const paramsToSign = {
      folder: folderPath,
      timestamp,
    };

    // Create signature
    const sortedParams = Object.keys(paramsToSign)
      .sort()
      .map(key => `${key}=${paramsToSign[key as keyof typeof paramsToSign]}`)
      .join('&');

    const signature = crypto
      .createHash('sha1')
      .update(sortedParams + CLOUDINARY_API_SECRET)
      .digest('hex');

    return NextResponse.json({
      cloudName: CLOUDINARY_CLOUD_NAME,
      apiKey: CLOUDINARY_API_KEY,
      timestamp,
      signature,
      folder: folderPath,
      resourceType,
    });

  } catch (error) {
    console.error('Error generating upload signature:', error);
    return NextResponse.json({ error: 'Failed to generate upload signature' }, { status: 500 });
  }
}

async function POST(request: NextRequest) {
  return withAuth((req) => handler(req as AuthenticatedRequest))(request);
}

export { POST };
