import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/authMiddleware';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

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

type BusinessProfileFrontend = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  website: string;
  logoUrl: string;
  logo: string;
  taxNumber: string;
  createdAt: string;
  updatedAt: string;
};

function transformProfileToFrontend(row: BusinessProfileRow): BusinessProfileFrontend {
  return {
    id: row.id,
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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getProfile(userId: string, id: string) {
  const { data, error } = await supabaseAdmin
    .from('business_profiles')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: 'Business profile not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(
    { profile: transformProfileToFrontend(data as unknown as BusinessProfileRow) },
    { status: 200 }
  );
}

async function updateProfile(userId: string, id: string, body: Record<string, unknown>) {
  const updateData: Partial<BusinessProfileRow> & { updated_at: string } = {
    updated_at: new Date().toISOString(),
  };

  if (typeof body.name === 'string') updateData.name = body.name;
  if (typeof body.email === 'string') updateData.email = body.email;
  if (typeof body.phone === 'string' || body.phone === null) updateData.phone = body.phone as string | null;
  if (typeof body.address === 'string' || body.address === null)
    updateData.address = body.address as string | null;
  if (typeof body.city === 'string' || body.city === null) updateData.city = body.city as string | null;
  if (typeof body.state === 'string' || body.state === null) updateData.state = body.state as string | null;
  if (typeof body.zipCode === 'string' || body.zipCode === null)
    updateData.zip_code = body.zipCode as string | null;
  if (typeof body.country === 'string' || body.country === null) updateData.country = body.country as string | null;
  if (typeof body.website === 'string' || body.website === null) updateData.website = body.website as string | null;
  if (typeof body.logoUrl === 'string' || body.logoUrl === null)
    updateData.logo_url = body.logoUrl as string | null;
  if (typeof body.taxNumber === 'string' || body.taxNumber === null)
    updateData.tax_number = body.taxNumber as string | null;

  const { data, error } = await supabaseAdmin
    .from('business_profiles')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    console.error('Error updating business profile:', error);
    return NextResponse.json(
      { error: 'Failed to update business profile' },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: 'Business profile not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(
    { profile: transformProfileToFrontend(data as unknown as BusinessProfileRow) },
    { status: 200 }
  );
}

async function deleteProfile(userId: string, id: string) {
  const { error } = await supabaseAdmin
    .from('business_profiles')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting business profile:', error);
    return NextResponse.json(
      { error: 'Failed to delete business profile' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true }, { status: 200 });
}

async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (userId: string) => {
    return await getProfile(userId, params.id);
  })(request);
}

async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (userId: string) => {
    const body = await request.json().catch(() => ({}));
    return await updateProfile(userId, params.id, body);
  })(request);
}

async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth(async (userId: string) => {
    return await deleteProfile(userId, params.id);
  })(request);
}

export { GET, PUT, DELETE };
