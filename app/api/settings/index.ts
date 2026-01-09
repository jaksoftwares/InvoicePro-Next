// app/api/settings/index.ts
// GET: Fetch user settings (creates default if none exist)
// PUT: Update user settings
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/authMiddleware';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

const DEFAULT_SETTINGS = {
  currency: 'USD',
  tax_rate: 0,
  language: 'en',
  date_format: 'MM/dd/yyyy',
  default_template: 'modern',
  default_notes: '',
  default_terms: '',
  default_due_days: 30,
};

interface SettingsUpdateBody {
  currency?: string;
  taxRate?: number;
  language?: string;
  dateFormat?: string;
  defaultTemplate?: string;
  defaultNotes?: string;
  defaultTerms?: string;
  defaultDueDays?: number;
}

interface SettingsRow {
  id?: string;
  user_id?: string;
  currency: string;
  tax_rate: number;
  language: string;
  date_format: string;
  default_template: string;
  default_notes: string;
  default_terms: string;
  default_due_days: number;
  created_at?: string;
  updated_at?: string;
}

function transformSettingsToFrontend(row: SettingsRow) {
  return {
    currency: row.currency || 'USD',
    taxRate: Number(row.tax_rate) || 0,
    language: row.language || 'en',
    dateFormat: row.date_format || 'MM/dd/yyyy',
    defaultTemplate: row.default_template || 'modern',
    defaultNotes: row.default_notes || '',
    defaultTerms: row.default_terms || '',
    defaultDueDays: Number(row.default_due_days) || 30,
  };
}

async function getSettings(userId: string) {
  const response = await supabaseAdmin
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  let { data } = response;
  const { error } = response;

  // If no settings exist, create default
  if (error || !data) {
    const { data: newSettings, error: createError } = await supabaseAdmin
      .from('user_settings')
      .insert({
        user_id: userId,
        ...DEFAULT_SETTINGS,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating default settings:', createError);
      // Return defaults anyway
      return NextResponse.json({ settings: transformSettingsToFrontend(DEFAULT_SETTINGS) });
    }

    data = newSettings as SettingsRow;
  }

  return NextResponse.json({ settings: transformSettingsToFrontend(data as SettingsRow) });
}

async function updateSettings(userId: string, body: SettingsUpdateBody) {
  const updateData: Partial<SettingsRow> = { updated_at: new Date().toISOString() };

  if (body.currency !== undefined) updateData.currency = body.currency;
  if (body.taxRate !== undefined) updateData.tax_rate = body.taxRate;
  if (body.language !== undefined) updateData.language = body.language;
  if (body.dateFormat !== undefined) updateData.date_format = body.dateFormat;
  if (body.defaultTemplate !== undefined) updateData.default_template = body.defaultTemplate;
  if (body.defaultNotes !== undefined) updateData.default_notes = body.defaultNotes;
  if (body.defaultTerms !== undefined) updateData.default_terms = body.defaultTerms;
  if (body.defaultDueDays !== undefined) updateData.default_due_days = body.defaultDueDays;

  // Upsert: update if exists, insert if not
  const { data: existing } = await supabaseAdmin
    .from('user_settings')
    .select('id')
    .eq('user_id', userId)
    .single();

  let result;
  if (existing) {
    const { data, error } = await supabaseAdmin
      .from('user_settings')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error updating settings:', error);
      return NextResponse.json(
        { error: 'Failed to update settings' },
        { status: 500 }
      );
    }
    result = data as SettingsRow;
  } else {
    const { data, error } = await supabaseAdmin
      .from('user_settings')
      .insert({
        user_id: userId,
        ...DEFAULT_SETTINGS,
        ...updateData,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating settings:', error);
      return NextResponse.json(
        { error: 'Failed to create settings' },
        { status: 500 }
      );
    }
    result = data as SettingsRow;
  }

  return NextResponse.json({ settings: transformSettingsToFrontend(result) });
}

async function handleRequest(req: NextRequest, userId: string) {
  if (req.method === 'GET') {
    return getSettings(userId);
  }

  if (req.method === 'PUT') {
    const body = await req.json().catch(() => ({}));
    return updateSettings(userId, body as SettingsUpdateBody);
  }

  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

async function GET(request: NextRequest) {
  return withAuth((req, userId) => handleRequest(req, userId))(request);
}

async function PUT(request: NextRequest) {
  return withAuth((req, userId) => handleRequest(req, userId))(request);
}

export { GET, PUT };
