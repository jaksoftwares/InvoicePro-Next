import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/authMiddleware';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { Invoice } from '@/types';

type InvoiceRow = {
  id: string;
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
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObject = Record<string, any>;

function transformInvoiceToFrontend(row: InvoiceRow): AnyObject {
  const items = (row.invoice_items || []).map((item) => ({
    id: item.id,
    description: item.description,
    quantity: Number(item.quantity),
    rate: Number(item.rate),
    amount: Number(item.amount),
  }));

  const bp = row.business_profiles;
  const businessProfile = {
    id: bp?.id || '',
    name: bp?.name || '',
    email: bp?.email || '',
    phone: bp?.phone || '',
    address: bp?.address || '',
    city: bp?.city || '',
    state: bp?.state || '',
    zipCode: bp?.zip_code || '',
    country: bp?.country || '',
    website: bp?.website || '',
    logoUrl: bp?.logo_url || '',
    logo: bp?.logo_url || '',
    taxNumber: bp?.tax_number || '',
    createdAt: new Date(bp?.created_at || new Date()),
    updatedAt: new Date(bp?.updated_at || new Date()),
  };

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
    dueDate: new Date(row.due_date || new Date()),
    issueDate: new Date(row.issue_date || new Date()),
    status: row.status || 'draft',
    template: row.template || 'modern',
    currency: row.currency || 'USD',
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

async function handlePdfRequest(userId: string, id: string): Promise<NextResponse> {
  try {
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Missing invoice ID' }, { status: 400 });
    }

    // Try to fetch from Supabase
    const { data, error } = await supabaseAdmin
      .from('invoices')
      .select('*, invoice_items(*), business_profiles(*)')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return NextResponse.json({ 
        error: 'Invoice not found in database. Please ensure the invoice is saved to the database before downloading PDF.',
        notFound: true
      }, { status: 404 });
    }

    const invoice = transformInvoiceToFrontend(data as unknown as InvoiceRow);

    // Get the template function from the server-side generator
    const { generateInvoicePDFBuffer } = await import('@/utils/pdfGeneratorServer');
    const pdfBuffer = await generateInvoicePDFBuffer(invoice as unknown as Invoice);
    
    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}

async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withAuth((req, userId) => handlePdfRequest(userId, params.id))(request);
}

export { GET };
