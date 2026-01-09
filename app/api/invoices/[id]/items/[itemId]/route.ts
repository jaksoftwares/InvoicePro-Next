// app/api/invoices/[id]/items/[itemId]/route.ts
// PUT: Update item, DELETE: Delete item
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/authMiddleware';
import { updateInvoiceItem, deleteInvoiceItem, verifyInvoiceOwnership } from '@/lib/services/invoice';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  return withAuth(async (req, userId) => {
    const { id: invoiceId, itemId } = await params;
    try {
      const isValid = await verifyInvoiceOwnership(userId, invoiceId);
      if (!isValid) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      const body = await req.json().catch(() => ({}));
      const item = await updateInvoiceItem(userId, invoiceId, itemId, body);
      return NextResponse.json({ item });
    } catch {
      return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
    }
  })(request);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  return withAuth(async (req, userId) => {
    const { id: invoiceId, itemId } = await params;
    try {
      const isValid = await verifyInvoiceOwnership(userId, invoiceId);
      if (!isValid) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      await deleteInvoiceItem(userId, invoiceId, itemId);
      return NextResponse.json({ success: true });
    } catch {
      return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
    }
  })(request);
}
