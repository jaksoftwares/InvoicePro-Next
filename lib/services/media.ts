// lib/services/media.ts
// Media assets database operations
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { MediaAsset } from '@/types';
import crypto from 'crypto';

export type MediaRow = {
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
};

export function toMedia(row: MediaRow): MediaAsset {
  return {
    id: row.id,
    userId: row.user_id,
    publicId: row.public_id,
    url: row.url,
    format: row.format || undefined,
    resourceType: row.resource_type || undefined,
    bytes: row.bytes || undefined,
    width: row.width || undefined,
    height: row.height || undefined,
    businessProfileId: row.business_profile_id || undefined,
    invoiceId: row.invoice_id || undefined,
    createdAt: new Date(row.created_at),
  };
}

export async function listMedia(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('media_assets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(toMedia);
}

export async function storeMedia(userId: string, body: Record<string, unknown>) {
  if (!body.publicId || !body.url) throw new Error('Missing publicId or url');

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

  if (error) throw error;
  return toMedia(data as MediaRow);
}

export function generateUploadSignature(userId: string, folder?: string, resourceType?: string) {
  const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET || '';
  const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY || '';
  const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || '';

  if (!CLOUDINARY_API_SECRET || !CLOUDINARY_API_KEY || !CLOUDINARY_CLOUD_NAME) {
    throw new Error('Cloudinary not configured');
  }

  const timestamp = Math.round(new Date().getTime() / 1000);
  const folderPath = `${folder || 'invoicepro'}/${userId.substring(0, 8)}`;

  const paramsToSign = { folder: folderPath, timestamp };
  const sortedParams = Object.keys(paramsToSign)
    .sort()
    .map((key) => `${key}=${paramsToSign[key as keyof typeof paramsToSign]}`)
    .join('&');

  const signature = crypto.createHash('sha1').update(sortedParams + CLOUDINARY_API_SECRET).digest('hex');

  return {
    cloudName: CLOUDINARY_CLOUD_NAME,
    apiKey: CLOUDINARY_API_KEY,
    timestamp,
    signature,
    folder: folderPath,
    resourceType: resourceType || 'image',
  };
}
