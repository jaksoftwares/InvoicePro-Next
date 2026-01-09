import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/authMiddleware';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { BusinessProfile } from '@/types';

// Database row type (snake_case)
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

// Transform DB row to frontend type (camelCase)
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

// Allowed update fields
type UpdateFields = Partial<Pick<BusinessProfile, 
  'name' | 'email' | 'phone' | 'address' | 'city' | 'state' | 
  'zipCode' | 'country' | 'website' | 'logoUrl' | 'taxNumber'
>>;

async function getProfile(userId: string, id: string) {
  const { data, error } = await supabaseAdmin
    .from('business_profiles')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Business profile not found' }, { status: 404 });
  }

  return NextResponse.json({ profile: toFrontend(data as BusinessProfileRow) }, { status: 200 });
}

async function updateProfile(userId: string, id: string, body: UpdateFields) {
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  
  // Map camelCase to snake_case
  const fieldMap: Record<string, string> = {
    name: 'name', email: 'email', phone: 'phone', address: 'address',
    city: 'city', state: 'state', zipCode: 'zip_code', country: 'country',
    website: 'website', logoUrl: 'logo_url', taxNumber: 'tax_number',
  };

  for (const [key, dbKey] of Object.entries(fieldMap)) {
    if (key in body && body[key as keyof UpdateFields] !== undefined) {
      updateData[dbKey] = body[key as keyof UpdateFields];
    }
  }

  const { data, error } = await supabaseAdmin
    .from('business_profiles')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating business profile:', error);
    return NextResponse.json({ error: 'Failed to update business profile' }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ error: 'Business profile not found' }, { status: 404 });
  }

  return NextResponse.json({ profile: toFrontend(data as BusinessProfileRow) }, { status: 200 });
}

async function deleteProfile(userId: string, id: string) {
  const { error } = await supabaseAdmin
    .from('business_profiles')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting business profile:', error);
    return NextResponse.json({ error: 'Failed to delete business profile' }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}

async function handleRequest(req: NextRequest, userId: string, id: string) {
  if (req.method === 'GET') return getProfile(userId, id);
  if (req.method === 'PUT') {
    const body = await req.json().catch(() => ({}));
    return updateProfile(userId, id, body as UpdateFields);
  }
  if (req.method === 'DELETE') return deleteProfile(userId, id);
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}

async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth((req, userId) => handleRequest(req, userId, params.id))(request);
}

async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth((req, userId) => handleRequest(req, userId, params.id))(request);
}

async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return withAuth((req, userId) => handleRequest(req, userId, params.id))(request);
}

export { GET, PUT, DELETE };
