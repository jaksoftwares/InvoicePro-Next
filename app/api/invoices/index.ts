// app/api/invoices/index.ts
// Handles all CRUD operations for invoices.
// GET /api/invoices -> list all invoices
// POST /api/invoices -> create a new invoice
// GET /api/invoices?id={id} -> get a single invoice
// PUT /api/invoices?id={id} -> update an invoice
// DELETE /api/invoices?id={id} -> delete an invoice

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/authMiddleware';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

interface InvoiceItemInput {
  description: string;
  quantity?: number;
  rate?: number;
  amount?: number;
}

interface InvoiceCreateBody {
  businessProfileId: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  clientAddress?: string;
  clientCity?: string;
  clientState?: string;
  clientZipCode?: string;
  clientCountry?: string;
  subtotal?: number;
  taxRate?: number;
  taxAmount?: number;
  discountRate?: number;
  discountAmount?: number;
  total?: number;
  notes?: string;
  terms?: string;
  dueDate?: string;
  issueDate?: string;
  status?: string;
  template?: string;
  currency?: string;
  items?: InvoiceItemInput[];
}

interface InvoiceUpdateBody extends InvoiceCreateBody {}

interface InvoiceRow {
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
  invoice_items: Array<{
    id: string;
    description: string;
    quantity: number;
    rate: number;
    amount: number;
  }> | null;
  business_profiles: {
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
  } | null;
}

function transformInvoiceToFrontend(row: InvoiceRow) {
  const items = (row.invoice_items || []).map((item) => ({
    id: item.id,
    description: item.description,
    quantity: Number(item.quantity),
    rate: Number(item.rate),
    amount: Number(item.amount),
  }));

  let businessProfile = undefined;
  if (row.business_profiles) {
    const bp = row.business_profiles;
    businessProfile = {
      id: bp.id,
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
      createdAt: bp.created_at,
      updatedAt: bp.updated_at,
    };
  }

  return {
    id: row.id,
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
    dueDate: row.due_date,
    issueDate: row.issue_date,
    status: row.status,
    template: row.template,
    currency: row.currency,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function listInvoices(userId: string, status?: string, search?: string) {
  let query = supabaseAdmin
    .from('invoices')
    .select('*, invoice_items(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }

  let invoices = (data as InvoiceRow[]).map(transformInvoiceToFrontend);

  if (search) {
    const searchLower = search.toLowerCase();
    invoices = invoices.filter(
      (inv) =>
        inv.invoiceNumber.toLowerCase().includes(searchLower) ||
        inv.clientName.toLowerCase().includes(searchLower) ||
        inv.clientEmail.toLowerCase().includes(searchLower)
    );
  }

  return NextResponse.json({ invoices });
}

async function createInvoice(userId: string, body: InvoiceCreateBody) {
  const { data: invoice, error: invoiceError } = await supabaseAdmin
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

  if (invoiceError || !invoice) {
    console.error('Error creating invoice:', invoiceError);
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    );
  }

  if (body.items && body.items.length > 0) {
    const itemsToInsert = body.items.map((item) => ({
      invoice_id: invoice.id,
      description: item.description,
      quantity: item.quantity || 1,
      rate: item.rate || 0,
      amount: item.amount || 0,
    }));

    const { error: itemsError } = await supabaseAdmin
      .from('invoice_items')
      .insert(itemsToInsert);

    if (itemsError) {
      console.error('Error creating invoice items:', itemsError);
    }
  }

  const { data: completeInvoice } = await supabaseAdmin
    .from('invoices')
    .select('*, invoice_items(*)')
    .eq('id', invoice.id)
    .single();

  return NextResponse.json(
    { invoice: transformInvoiceToFrontend((completeInvoice || invoice) as InvoiceRow) },
    { status: 201 }
  );
}

async function getInvoice(userId: string, id: string) {
  const { data, error } = await supabaseAdmin
    .from('invoices')
    .select('*, invoice_items(*), business_profiles(*)')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: 'Invoice not found' },
      { status: 404 }
    );
  }

  return NextResponse.json(
    { invoice: transformInvoiceToFrontend(data as InvoiceRow) }
  );
}

async function updateInvoice(userId: string, id: string, body: InvoiceUpdateBody) {
  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

  // Map camelCase to snake_case
  const fieldMappings: Record<string, string> = {
    businessProfileId: 'business_profile_id',
    invoiceNumber: 'invoice_number',
    clientName: 'client_name',
    clientEmail: 'client_email',
    clientPhone: 'client_phone',
    clientAddress: 'client_address',
    clientCity: 'client_city',
    clientState: 'client_state',
    clientZipCode: 'client_zip_code',
    clientCountry: 'client_country',
    subTotal: 'subtotal',
    taxRate: 'tax_rate',
    taxAmount: 'tax_amount',
    discountRate: 'discount_rate',
    discountAmount: 'discount_amount',
    dueDate: 'due_date',
    issueDate: 'issue_date',
    defaultTemplate: 'default_template',
    defaultNotes: 'default_notes',
    defaultTerms: 'default_terms',
    defaultDueDays: 'default_due_days',
  };

  Object.keys(body).forEach((key) => {
    if (key !== 'items') {
      const snakeKey = fieldMappings[key] || key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      updateData[snakeKey] = (body as unknown as Record<string, unknown>)[key];
    }
  });

  const { error: updateError } = await supabaseAdmin
    .from('invoices')
    .update(updateData)
    .eq('id', id)
    .eq('user_id', userId);

  if (updateError) {
    console.error('Error updating invoice:', updateError);
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    );
  }

  if (body.items !== undefined) {
    await supabaseAdmin
      .from('invoice_items')
      .delete()
      .eq('invoice_id', id);

    if (body.items.length > 0) {
      const itemsToInsert = body.items.map((item) => ({
        invoice_id: id,
        description: item.description,
        quantity: item.quantity || 1,
        rate: item.rate || 0,
        amount: item.amount || 0,
      }));

      await supabaseAdmin.from('invoice_items').insert(itemsToInsert);
    }
  }

  const { data: updatedInvoice } = await supabaseAdmin
    .from('invoices')
    .select('*, invoice_items(*)')
    .eq('id', id)
    .single();

  return NextResponse.json(
    { invoice: transformInvoiceToFrontend(updatedInvoice as InvoiceRow) }
  );
}

async function deleteInvoice(userId: string, id: string) {
  await supabaseAdmin
    .from('invoice_items')
    .delete()
    .eq('invoice_id', id);

  const { error } = await supabaseAdmin
    .from('invoices')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json(
      { error: 'Failed to delete invoice' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}

async function handleRequest(req: NextRequest, userId: string) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const status = searchParams.get('status');
  const search = searchParams.get('search');

  if (id) {
    switch (req.method) {
      case 'GET':
        return getInvoice(userId, id);
      case 'PUT': {
        const body = await req.json().catch(() => ({}));
        return updateInvoice(userId, id, body as InvoiceUpdateBody);
      }
      case 'DELETE':
        return deleteInvoice(userId, id);
      default:
        return NextResponse.json(
          { error: 'Method not allowed for this resource' },
          { status: 405 }
        );
    }
  } else {
    switch (req.method) {
      case 'GET':
        return listInvoices(userId, status || undefined, search || undefined);
      case 'POST': {
        const body = await req.json().catch(() => ({}));
        return createInvoice(userId, body as InvoiceCreateBody);
      }
      default:
        return NextResponse.json(
          { error: 'Method not allowed' },
          { status: 405 }
        );
    }
  }
}

async function GET(request: NextRequest) {
  return withAuth((req, userId) => handleRequest(req, userId))(request);
}

async function POST(request: NextRequest) {
  return withAuth((req, userId) => handleRequest(req, userId))(request);
}

async function PUT(request: NextRequest) {
  return withAuth((req, userId) => handleRequest(req, userId))(request);
}

async function DELETE(request: NextRequest) {
  return withAuth((req, userId) => handleRequest(req, userId))(request);
}

export { GET, POST, PUT, DELETE };
