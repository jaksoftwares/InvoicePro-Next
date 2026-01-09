// app/api/business-profiles/index.ts
// Handles all CRUD operations for business profiles.
// GET /api/business-profiles -> list all profiles
// POST /api/business-profiles -> create a new profile

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/authMiddleware';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { BusinessProfile } from '@/types';

type BusinessProfileRow = {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  country: string | null;
  website: string | null;
  logo_url: string | null;
  tax_number: string | null;
  created_at: string;
  updated_at: string;
};

function toFrontend(row: BusinessProfileRow): BusinessProfile {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    email: row.email,
    phone: row.phone || '',
    address: row.address || '',
    city: row.city || '',
    state: row.state || '',
    zipCode: row.zip_code || '',
    country: row.country || '',
    website: row.website || '',
    logoUrl: row.logo_url || '',
    logo: row.logo_url || '',
    taxNumber: row.tax_number || '',
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

async function listProfiles(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('business_profiles')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching business profiles:', error);
    return NextResponse.json({ error: 'Failed to fetch business profiles' }, { status: 500 });
  }

  const rows = (data ?? []) as unknown as BusinessProfileRow[];
  const profiles = rows.map(toFrontend);
  return NextResponse.json({ profiles }, { status: 200 });
}

async function createProfile(userId: string, body: Record<string, unknown>) {
  const name = typeof body.name === 'string' ? body.name : undefined;
  const email = typeof body.email === 'string' ? body.email : undefined;
  const phone = typeof body.phone === 'string' ? body.phone : null;
  const address = typeof body.address === 'string' ? body.address : null;
  const city = typeof body.city === 'string' ? body.city : null;
  const state = typeof body.state === 'string' ? body.state : null;
  const zipCode = typeof body.zipCode === 'string' ? body.zipCode : null;
  const country = typeof body.country === 'string' ? body.country : null;
  const website = typeof body.website === 'string' ? body.website : null;
  const logoUrl = typeof body.logoUrl === 'string' ? body.logoUrl : null;
  const taxNumber = typeof body.taxNumber === 'string' ? body.taxNumber : null;

  if (!name || !email) {
    return NextResponse.json({ error: 'Missing required fields: name, email' }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from('business_profiles')
    .insert({
      user_id: userId,
      name,
      email,
      phone,
      address,
      city,
      state,
      zip_code: zipCode,
      country,
      website,
      logo_url: logoUrl,
      tax_number: taxNumber,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating business profile:', error);
    return NextResponse.json({ error: 'Failed to create business profile' }, { status: 500 });
  }

  return NextResponse.json({ profile: toFrontend(data as BusinessProfileRow) }, { status: 201 });
}

async function handleRequest(req: NextRequest, userId: string) {
  if (req.method === 'GET') {
    return listProfiles(userId);
  }

  if (req.method === 'POST') {
    const body = await req.json().catch(() => ({}));
    return createProfile(userId, body);
  }

  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

async function GET(request: NextRequest) {
  return withAuth((req, userId) => handleRequest(req, userId))(request);
}

async function POST(request: NextRequest) {
  return withAuth((req, userId) => handleRequest(req, userId))(request);
}

export { GET, POST };
