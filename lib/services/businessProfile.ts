// lib/services/businessProfile.ts
// Business profile database operations
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { BusinessProfile } from '@/types';

export type BusinessProfileRow = {
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

export function toBusinessProfile(row: BusinessProfileRow): BusinessProfile {
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

export async function listProfiles(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('business_profiles')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data ?? []).map(toBusinessProfile);
}

export async function getProfile(userId: string, id: string) {
  const { data, error } = await supabaseAdmin
    .from('business_profiles')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error || !data) throw new Error('Business profile not found');
  return toBusinessProfile(data as BusinessProfileRow);
}

export async function createProfile(userId: string, body: Record<string, unknown>) {
  const { data, error } = await supabaseAdmin
    .from('business_profiles')
    .insert({
      user_id: userId,
      name: body.name,
      email: body.email,
      phone: body.phone || null,
      address: body.address || null,
      city: body.city || null,
      state: body.state || null,
      zip_code: body.zipCode || null,
      country: body.country || null,
      website: body.website || null,
      logo_url: body.logoUrl || null,
      tax_number: body.taxNumber || null,
    })
    .select()
    .single();

  if (error) throw error;
  return toBusinessProfile(data as BusinessProfileRow);
}

export async function updateProfile(userId: string, id: string, body: Record<string, unknown>) {
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const fieldMap: Record<string, string> = {
    name: 'name', email: 'email', phone: 'phone', address: 'address',
    city: 'city', state: 'state', zipCode: 'zip_code', country: 'country',
    website: 'website', logoUrl: 'logo_url', taxNumber: 'tax_number',
  };

  for (const [key, dbKey] of Object.entries(fieldMap)) {
    if (key in body && body[key] !== undefined) updateData[dbKey] = body[key];
  }

  const { data, error } = await supabaseAdmin
    .from('business_profiles')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error || !data) throw new Error('Business profile not found');
  return toBusinessProfile(data as BusinessProfileRow);
}

export async function deleteProfile(userId: string, id: string) {
  const { error } = await supabaseAdmin
    .from('business_profiles')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;
}
