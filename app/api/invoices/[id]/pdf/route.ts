// app/api/invoices/[id]/pdf/route.ts
// GET: Generate PDF for invoice
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/authMiddleware';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import type { Invoice, InvoiceItem, BusinessProfile } from '@/types';

interface InvoiceItemRow {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

interface BusinessProfileRow {
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
}

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
  invoice_items?: InvoiceItemRow[];
  business_profiles?: BusinessProfileRow | null;
}

function toInvoice(row: InvoiceRow): Invoice {
  const items: InvoiceItem[] = (row.invoice_items || []).map((item) => ({
    id: item.id,
    invoiceId: item.invoice_id,
    description: item.description,
    quantity: Number(item.quantity),
    rate: Number(item.rate),
    amount: Number(item.amount),
  }));

  const bp = row.business_profiles;
  const businessProfile: BusinessProfile | undefined = bp ? {
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (req, userId) => {
    const { id } = await params;
    try {
      const { data, error } = await supabaseAdmin
        .from('invoices')
        .select('*, invoice_items(*), business_profiles(*)')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      }

      const invoice = toInvoice(data as InvoiceRow);
      const { generateInvoicePDFBuffer } = await import('@/utils/pdfGeneratorServer');
      const pdfBuffer = await generateInvoicePDFBuffer(invoice);

      return new NextResponse(pdfBuffer as unknown as BodyInit, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
          'Content-Length': pdfBuffer.length.toString(),
        },
      });
    } catch {
      return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
    }
  })(request);
}
