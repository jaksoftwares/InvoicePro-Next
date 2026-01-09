// app/api/invoices/[id]/items/route.ts
// GET: List items, POST: Create item
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/authMiddleware';
import { getInvoiceItems, createInvoiceItem, verifyInvoiceOwnership } from '@/lib/services/invoice';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (req, userId) => {
    const { id } = await params;
    try {
      const isValid = await verifyInvoiceOwnership(userId, id);
      if (!isValid) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      const items = await getInvoiceItems(userId, id);
      return NextResponse.json({ items });
    } catch {
      return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
    }
  })(request);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return withAuth(async (req, userId) => {
    const { id } = await params;
    try {
      const isValid = await verifyInvoiceOwnership(userId, id);
      if (!isValid) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
      const body = await req.json().catch(() => ({}));
      if (!body.description) return NextResponse.json({ error: 'Missing description' }, { status: 400 });
      const item = await createInvoiceItem(userId, id, body);
      return NextResponse.json({ item }, { status: 201 });
    } catch {
      return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
    }
  })(request);
}
