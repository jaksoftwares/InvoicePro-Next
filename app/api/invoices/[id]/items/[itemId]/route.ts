// app/api/invoices/[id]/items/[itemId]/route.ts
// Update and delete individual invoice items
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

async function updateItem(userId: string, invoiceId: string, itemId: string, body: Record<string, unknown>) {
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

  // Verify the item exists
  const { data: existingItem } = await supabaseAdmin
    .from('invoice_items')
    .select('*')
    .eq('id', itemId)
    .eq('invoice_id', invoiceId)
    .single();

  if (!existingItem) {
    return NextResponse.json(
      { error: 'Invoice item not found' },
      { status: 404 }
    );
  }

  const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (typeof body.description === 'string') updateData.description = body.description;
  if (typeof body.quantity === 'number') {
    updateData.quantity = body.quantity;
    // Recalculate amount if rate is available
    const rate = typeof body.rate === 'number' ? body.rate : Number(existingItem.rate);
    updateData.amount = body.quantity * rate;
  }
  if (typeof body.rate === 'number') {
    updateData.rate = body.rate;
    // Recalculate amount if quantity is available
    const quantity = typeof body.quantity === 'number' ? body.quantity : Number(existingItem.quantity);
    updateData.amount = body.rate * quantity;
  }
  if (typeof body.amount === 'number') updateData.amount = body.amount;

  const { data, error } = await supabaseAdmin
    .from('invoice_items')
    .update(updateData)
    .eq('id', itemId)
    .eq('invoice_id', invoiceId)
    .select()
    .single();

  if (error) {
    console.error('Error updating invoice item:', error);
    return NextResponse.json(
      { error: 'Failed to update invoice item' },
      { status: 500 }
    );
  }

  return NextResponse.json({ item: transformItemToFrontend(data as InvoiceItemRow) });
}

async function deleteItem(userId: string, invoiceId: string, itemId: string) {
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

  const { error } = await supabaseAdmin
    .from('invoice_items')
    .delete()
    .eq('id', itemId)
    .eq('invoice_id', invoiceId);

  if (error) {
    console.error('Error deleting invoice item:', error);
    return NextResponse.json(
      { error: 'Failed to delete invoice item' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}

async function handleRequest(req: NextRequest, userId: string, params: { id: string; itemId: string }) {
  const invoiceId = params.id;
  const itemId = params.itemId;

  switch (req.method) {
    case 'PUT': {
      const body = await req.json().catch(() => ({}));
      return updateItem(userId, invoiceId, itemId, body);
    }
    case 'DELETE':
      return deleteItem(userId, invoiceId, itemId);
    default:
      return NextResponse.json(
        { error: 'Method not allowed' },
        { status: 405 }
      );
  }
}

async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  return withAuth(async (req, userId) => {
    return await handleRequest(req, userId, params);
  })(request);
}

async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; itemId: string } }
) {
  return withAuth(async (req, userId) => {
    return await handleRequest(req, userId, params);
  })(request);
}

export { PUT, DELETE };
