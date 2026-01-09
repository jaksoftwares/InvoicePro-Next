// app/api/invoices/[id]/route.ts
// GET: Get invoice, PUT: Update invoice, DELETE: Delete invoice
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/authMiddleware';
import { getInvoice, updateInvoice, deleteInvoice } from '@/lib/services/invoice';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (req, userId) => {
    const { id } = await params;
    try {
      const invoice = await getInvoice(userId, id);
      return NextResponse.json({ invoice });
    } catch {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
  })(request);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (req, userId) => {
    const { id } = await params;
    try {
      const body = await req.json().catch(() => ({}));
      const invoice = await updateInvoice(userId, id, body);
      return NextResponse.json({ invoice });
    } catch {
      return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
    }
  })(request);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (req, userId) => {
    const { id } = await params;
    try {
      await deleteInvoice(userId, id);
      return NextResponse.json({ success: true });
    } catch {
      return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 });
    }
  })(request);
}
