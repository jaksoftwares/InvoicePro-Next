// app/api/media/index.ts
// GET: List user's media assets
// POST: Store Cloudinary upload metadata after successful upload
// POST with ?action=sign-upload: Generate Cloudinary upload signature
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/authMiddleware';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import crypto from 'crypto';

const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || '';
const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || '';
const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';

interface MediaCreateBody {
  publicId: string;
  url: string;
  format?: string;
  resourceType?: string;
  bytes?: number;
  width?: number;
  height?: number;
  businessProfileId?: string;
  invoiceId?: string;
}

interface MediaAssetRow {
  id: string;
  user_id: string;
  public_id: string;
  url: string;
  format: string | null;
  resource_type: string;
  bytes: number | null;
  width: number | null;
  height: number | null;
  business_profile_id: string | null;
  invoice_id: string | null;
  created_at: string;
}

function transformMediaToFrontend(row: MediaAssetRow) {
  return {
    id: row.id,
    userId: row.user_id,
    publicId: row.public_id,
    url: row.url,
    format: row.format,
    resourceType: row.resource_type,
    bytes: row.bytes,
    width: row.width,
    height: row.height,
    businessProfileId: row.business_profile_id,
    invoiceId: row.invoice_id,
    createdAt: row.created_at,
  };
}

async function listMedia(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('media_assets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching media:', error);
    return NextResponse.json(
      { error: 'Failed to fetch media' },
      { status: 500 }
    );
  }

  const media = (data || []).map(transformMediaToFrontend);
  return NextResponse.json({ media });
}

async function storeMedia(userId: string, body: MediaCreateBody) {
  if (!body.publicId || !body.url) {
    return NextResponse.json(
      { error: 'Missing publicId or url' },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from('media_assets')
    .insert({
      user_id: userId,
      public_id: body.publicId,
      url: body.url,
      format: body.format || null,
      resource_type: body.resourceType || 'image',
      bytes: body.bytes || null,
      width: body.width || null,
      height: body.height || null,
      business_profile_id: body.businessProfileId || null,
      invoice_id: body.invoiceId || null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error storing media:', error);
    return NextResponse.json(
      { error: 'Failed to store media' },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { media: transformMediaToFrontend(data as MediaAssetRow) },
    { status: 201 }
  );
}

async function signUpload(userId: string, body: { folder?: string; resourceType?: string }) {
  const { folder = 'invoicepro', resourceType = 'image' } = body || {};

  if (!CLOUDINARY_API_SECRET || !CLOUDINARY_API_KEY || !CLOUDINARY_CLOUD_NAME) {
    return NextResponse.json(
      { error: 'Cloudinary not configured' },
      { status: 500 }
    );
  }

  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folderPath = `${folder}/${userId.substring(0, 8)}`;

    const paramsToSign = {
      folder: folderPath,
      timestamp,
    };

    const sortedParams = Object.keys(paramsToSign)
      .sort()
      .map((key) => `${key}=${paramsToSign[key as keyof typeof paramsToSign]}`)
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
    return NextResponse.json(
      { error: 'Failed to generate upload signature' },
      { status: 500 }
    );
  }
}

async function handleRequest(req: NextRequest, userId: string) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  if (req.method === 'POST' && action === 'sign-upload') {
    const body = await req.json().catch(() => ({}));
    return signUpload(userId, body);
  }

  switch (req.method) {
    case 'GET':
      return listMedia(userId);
    case 'POST': {
      const body = await req.json().catch(() => ({}));
      return storeMedia(userId, body as MediaCreateBody);
    }
    default:
      return NextResponse.json(
        { error: 'Method not allowed' },
        { status: 405 }
      );
  }
}

async function GET(request: NextRequest) {
  return withAuth((req, userId) => handleRequest(req, userId))(request);
}

async function POST(request: NextRequest) {
  return withAuth((req, userId) => handleRequest(req, userId))(request);
}

export { GET, POST };
