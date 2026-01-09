// lib/services/settings.ts
// User settings database operations
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { UserSettings } from '@/types';

export type SettingsRow = {
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
};

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

export function toSettings(row: SettingsRow): UserSettings {
  return {
    id: row.id || '',
    userId: row.user_id || '',
    currency: row.currency || 'USD',
    taxRate: Number(row.tax_rate) || 0,
    language: row.language || 'en',
    dateFormat: row.date_format || 'MM/dd/yyyy',
    defaultTemplate: row.default_template as UserSettings['defaultTemplate'],
    defaultNotes: row.default_notes || '',
    defaultTerms: row.default_terms || '',
    defaultDueDays: Number(row.default_due_days) || 30,
    createdAt: row.created_at ? new Date(row.created_at) : new Date(),
    updatedAt: row.updated_at ? new Date(row.updated_at) : new Date(),
  };
}

export async function getSettings(userId: string) {
  const { data, error } = await supabaseAdmin
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    const { data: newSettings, error: createError } = await supabaseAdmin
      .from('user_settings')
      .insert({ user_id: userId, ...DEFAULT_SETTINGS })
      .select()
      .single();

    if (createError) return toSettings(DEFAULT_SETTINGS);
    return toSettings(newSettings as SettingsRow);
  }

  return toSettings(data as SettingsRow);
}

export async function updateSettings(userId: string, body: Record<string, unknown>) {
  const updateData: Partial<SettingsRow> = { updated_at: new Date().toISOString() };
  const fieldMap: Record<string, keyof SettingsRow> = {
    currency: 'currency', taxRate: 'tax_rate', language: 'language',
    dateFormat: 'date_format', defaultTemplate: 'default_template',
    defaultNotes: 'default_notes', defaultTerms: 'default_terms', defaultDueDays: 'default_due_days',
  };

  for (const [key, dbKey] of Object.entries(fieldMap)) {
    if (key in body && body[key] !== undefined) updateData[dbKey] = body[key] as never;
  }

  const { data: existing } = await supabaseAdmin.from('user_settings').select('id').eq('user_id', userId).single();

  let result;
  if (existing) {
    const { data, error } = await supabaseAdmin
      .from('user_settings')
      .update(updateData)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    result = data as SettingsRow;
  } else {
    const { data, error } = await supabaseAdmin
      .from('user_settings')
      .insert({ user_id: userId, ...DEFAULT_SETTINGS, ...updateData })
      .select()
      .single();

    if (error) throw error;
    result = data as SettingsRow;
  }

  return toSettings(result);
}
