// app/api/invoices/[id]/items/route.ts
// CRUD operations for invoice items
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/authMiddleware';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

interface InvoiceItemRow {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  created_at: string;
  updated_at: string;
}

function transformItemToFrontend(row: InvoiceItemRow) {
  return {
    id: row.id,
    invoiceId: row.invoice_id,
    description: row.description,
    quantity: Number(row.quantity),
    rate: Number(row.rate),
    amount: Number(row.amount),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function getItems(userId: string, invoiceId: string) {
  // First verify the invoice belongs to the user
  const { data: invoice } = await supabaseAdmin
    .from('invoices')
    .select('id')
    .eq('id', invoiceId)
    .eq('user_id', userId)
    .single();

  if (!invoice) {
    return NextResponse.json(
      { error: 'Invoice not found' },
      { status: 404 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from('invoice_items')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching invoice items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoice items' },
      { status: 500 }
    );
  }

  const items = (data || []).map(transformItemToFrontend);
  return NextResponse.json({ items });
}

async function createItem(userId: string, invoiceId: string, body: Record<string, unknown>) {
  // First verify the invoice belongs to the user
  const { data: invoice } = await supabaseAdmin
    .from('invoices')
    .select('id')
    .eq('id', invoiceId)
    .eq('user_id', userId)
    .single();

  if (!invoice) {
    return NextResponse.json(
      { error: 'Invoice not found' },
      { status: 404 }
    );
  }

  const description = typeof body.description === 'string' ? body.description : undefined;
  const quantity = typeof body.quantity === 'number' ? body.quantity : 1;
  const rate = typeof body.rate === 'number' ? body.rate : 0;
  const amount = typeof body.amount === 'number' ? body.amount : quantity * rate;

  if (!description) {
    return NextResponse.json(
      { error: 'Missing required field: description' },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from('invoice_items')
    .insert({
      invoice_id: invoiceId,
      description,
      quantity,
      rate,
      amount,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating invoice item:', error);
    return NextResponse.json(
      { error: 'Failed to create invoice item' },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { item: transformItemToFrontend(data as InvoiceItemRow) },
    { status: 201 }
  );
}

async function handleRequest(req: NextRequest, userId: string) {
  const { searchParams } = new URL(req.url);
  const invoiceId = searchParams.get('id');

  if (!invoiceId) {
    return NextResponse.json(
      { error: 'Missing invoice ID' },
      { status: 400 }
    );
  }

  switch (req.method) {
    case 'GET':
      return getItems(userId, invoiceId);
    case 'POST': {
      const body = await req.json().catch(() => ({}));
      return createItem(userId, invoiceId, body);
    }
    default:
      return NextResponse.json(
        { error: 'Method not allowed' },
        { status: 405 }
      );
  }
}

async function GET(request: NextRequest) {
  return withAuth((req, userId) => handleRequest(req, userId))(request);
}

async function POST(request: NextRequest) {
  return withAuth((req, userId) => handleRequest(req, userId))(request);
}

export { GET, POST };
