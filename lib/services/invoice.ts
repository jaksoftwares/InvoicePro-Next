// lib/services/invoice.ts
// Invoice database operations
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { Invoice, InvoiceItem, InvoiceHistory } from '@/types';

export type InvoiceRow = {
  id: string;
  user_id: string;
  invoice_number: string;
  business_profile_id: string;
  client_name: string;
  client_email: string;
  client_phone: string | null;
  client_address: string | null;
  client_city: string | null;
  client_state: string | null;
  client_zip_code: string | null;
  client_country: string | null;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  discount_rate: number;
  discount_amount: number;
  total: number;
  notes: string | null;
  terms: string | null;
  due_date: string | null;
  issue_date: string | null;
  status: string;
  template: string | null;
  currency: string | null;
  created_at: string;
  updated_at: string;
  invoice_items?: InvoiceItemRow[];
  business_profiles?: BusinessProfileRow | null;
};

export type InvoiceItemRow = {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  created_at: string;
  updated_at: string;
};

type BusinessProfileRow = {
  id: string;
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

export type HistoryRow = {
  id: string;
  invoice_id: string;
  user_id: string;
  action: string;
  previous_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  status_from: string | null;
  status_to: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
};

export function toInvoice(row: InvoiceRow): Invoice {
  const items: InvoiceItem[] = (row.invoice_items || []).map((item) => toInvoiceItem(item as InvoiceItemRow));

  const bp = row.business_profiles;
  const businessProfile = bp ? {
    id: bp.id,
    userId: '',
    name: bp.name,
    email: bp.email,
    phone: bp.phone || '',
    address: bp.address || '',
    city: bp.city || '',
    state: bp.state || '',
    zipCode: bp.zip_code || '',
    country: bp.country || '',
    website: bp.website || '',
    logoUrl: bp.logo_url || '',
    logo: bp.logo_url || '',
    taxNumber: bp.tax_number || '',
    createdAt: new Date(bp.created_at),
    updatedAt: new Date(bp.updated_at),
  } : undefined;

  return {
    id: row.id,
    userId: row.user_id,
    invoiceNumber: row.invoice_number,
    businessProfileId: row.business_profile_id,
    businessProfile,
    clientName: row.client_name,
    clientEmail: row.client_email,
    clientPhone: row.client_phone || '',
    clientAddress: row.client_address || '',
    clientCity: row.client_city || '',
    clientState: row.client_state || '',
    clientZipCode: row.client_zip_code || '',
    clientCountry: row.client_country || '',
    items,
    subtotal: Number(row.subtotal),
    taxRate: Number(row.tax_rate),
    taxAmount: Number(row.tax_amount),
    discountRate: Number(row.discount_rate),
    discountAmount: Number(row.discount_amount),
    total: Number(row.total),
    notes: row.notes || '',
    terms: row.terms || '',
    dueDate: new Date(row.due_date || new Date()),
    issueDate: new Date(row.issue_date || new Date()),
    status: row.status as Invoice['status'],
    template: row.template as Invoice['template'],
    currency: row.currency || 'USD',
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function toInvoiceItem(row: InvoiceItemRow): InvoiceItem {
  return {
    id: row.id,
    invoiceId: row.invoice_id,
    description: row.description,
    quantity: Number(row.quantity),
    rate: Number(row.rate),
    amount: Number(row.amount),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function toHistory(row: HistoryRow): InvoiceHistory {
  return {
    id: row.id,
    invoiceId: row.invoice_id,
    userId: row.user_id,
    action: row.action as InvoiceHistory['action'],
    previousData: row.previous_data || undefined,
    newData: row.new_data || undefined,
    statusFrom: row.status_from || undefined,
    statusTo: row.status_to || undefined,
    metadata: row.metadata || undefined,
    createdAt: new Date(row.created_at),
  };
}

export async function listInvoices(userId: string, status?: string) {
  let query = supabaseAdmin
    .from('invoices')
    .select('*, invoice_items(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (status && status !== 'all') query = query.eq('status', status);
  const { data, error } = await query;
  if (error) throw error;
  return (data as InvoiceRow[]).map(toInvoice);
}

export async function getInvoice(userId: string, id: string) {
  const { data, error } = await supabaseAdmin
    .from('invoices')
    .select('*, invoice_items(*), business_profiles(*)')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error || !data) throw new Error('Invoice not found');
  return toInvoice(data as InvoiceRow);
}

export async function createInvoice(userId: string, body: Record<string, unknown>) {
  const { data, error } = await supabaseAdmin
    .from('invoices')
    .insert({
      user_id: userId,
      business_profile_id: body.businessProfileId,
      invoice_number: body.invoiceNumber,
      client_name: body.clientName,
      client_email: body.clientEmail,
      client_phone: body.clientPhone || null,
      client_address: body.clientAddress || null,
      client_city: body.clientCity || null,
      client_state: body.clientState || null,
      client_zip_code: body.clientZipCode || null,
      client_country: body.clientCountry || null,
      subtotal: body.subtotal || 0,
      tax_rate: body.taxRate || 0,
      tax_amount: body.taxAmount || 0,
      discount_rate: body.discountRate || 0,
      discount_amount: body.discountAmount || 0,
      total: body.total || 0,
      notes: body.notes || null,
      terms: body.terms || null,
      due_date: body.dueDate,
      issue_date: body.issueDate,
      status: body.status || 'draft',
      template: body.template || 'modern',
      currency: body.currency || 'USD',
    })
    .select()
    .single();

  if (error) throw error;

  const items = body.items as Array<{ description: string; quantity?: number; rate?: number; amount?: number }> | undefined;
  if (items?.length) {
    await supabaseAdmin.from('invoice_items').insert(
      items.map((item) => ({
        invoice_id: data.id,
        description: item.description,
        quantity: item.quantity || 1,
        rate: item.rate || 0,
        amount: item.amount || 0,
      }))
    );
  }

  return getInvoice(userId, data.id);
}

export async function updateInvoice(userId: string, id: string, body: Record<string, unknown>) {
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  const fieldMap: Record<string, string> = {
    businessProfileId: 'business_profile_id', invoiceNumber: 'invoice_number',
    clientName: 'client_name', clientEmail: 'client_email', clientPhone: 'client_phone',
    clientAddress: 'client_address', clientCity: 'client_city', clientState: 'client_state',
    clientZipCode: 'client_zip_code', clientCountry: 'client_country',
    subTotal: 'subtotal', taxRate: 'tax_rate', taxAmount: 'tax_amount',
    discountRate: 'discount_rate', discountAmount: 'discount_amount',
    dueDate: 'due_date', issueDate: 'issue_date', defaultTemplate: 'default_template',
    defaultNotes: 'default_notes', defaultTerms: 'default_terms', defaultDueDays: 'default_due_days',
  };

  Object.keys(body).forEach((key) => {
    if (key !== 'items') {
      const snakeKey = fieldMap[key] || key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      updateData[snakeKey] = (body as Record<string, unknown>)[key];
    }
  });

  const { error } = await supabaseAdmin
    .from('invoices')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;

  if (body.items !== undefined) {
    await supabaseAdmin.from('invoice_items').delete().eq('invoice_id', id);
    const items = body.items as Array<{ description: string; quantity?: number; rate?: number; amount?: number }>;
    if (items.length) {
      await supabaseAdmin.from('invoice_items').insert(
        items.map((item) => ({
          invoice_id: id,
          description: item.description,
          quantity: item.quantity || 1,
          rate: item.rate || 0,
          amount: item.amount || 0,
        }))
      );
    }
  }

  return getInvoice(userId, id);
}

export async function deleteInvoice(userId: string, id: string) {
  await supabaseAdmin.from('invoice_items').delete().eq('invoice_id', id);
  const { error } = await supabaseAdmin.from('invoices').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
}

export async function getInvoiceItems(userId: string, invoiceId: string) {
  const { data, error } = await supabaseAdmin
    .from('invoice_items')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return (data || []).map(toInvoiceItem);
}

export async function createInvoiceItem(userId: string, invoiceId: string, body: Record<string, unknown>) {
  const { data, error } = await supabaseAdmin
    .from('invoice_items')
    .insert({
      invoice_id: invoiceId,
      description: body.description,
      quantity: body.quantity || 1,
      rate: body.rate || 0,
      amount: body.amount || (Number(body.quantity || 1) * Number(body.rate || 0)),
    })
    .select()
    .single();

  if (error) throw error;
  return toInvoiceItem(data as InvoiceItemRow);
}

export async function updateInvoiceItem(userId: string, invoiceId: string, itemId: string, body: Record<string, unknown>) {
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body.description === 'string') updateData.description = body.description;
  if (typeof body.quantity === 'number') {
    updateData.quantity = body.quantity;
    updateData.amount = body.quantity * (typeof body.rate === 'number' ? body.rate : 0);
  }
  if (typeof body.rate === 'number') {
    updateData.rate = body.rate;
    updateData.amount = body.rate * (typeof body.quantity === 'number' ? body.quantity : 1);
  }
  if (typeof body.amount === 'number') updateData.amount = body.amount;

  const { data, error } = await supabaseAdmin
    .from('invoice_items')
    .update(updateData)
    .eq('id', itemId)
    .eq('invoice_id', invoiceId)
    .select()
    .single();

  if (error || !data) throw new Error('Invoice item not found');
  return toInvoiceItem(data as InvoiceItemRow);
}

export async function deleteInvoiceItem(userId: string, invoiceId: string, itemId: string) {
  const { error } = await supabaseAdmin.from('invoice_items').delete().eq('id', itemId).eq('invoice_id', invoiceId);
  if (error) throw error;
}

export async function getInvoiceHistory(userId: string, invoiceId: string) {
  const { data, error } = await supabaseAdmin
    .from('invoice_history')
    .select('*')
    .eq('invoice_id', invoiceId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(toHistory);
}

export async function verifyInvoiceOwnership(userId: string, invoiceId: string) {
  const { data } = await supabaseAdmin.from('invoices').select('id').eq('id', invoiceId).eq('user_id', userId).single();
  return !!data;
}
