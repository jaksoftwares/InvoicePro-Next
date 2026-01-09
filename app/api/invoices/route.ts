// app/api/invoices/route.ts
// GET: List invoices, POST: Create invoice
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/authMiddleware';
import { listInvoices, createInvoice } from '@/lib/services/invoice';

export async function GET(request: NextRequest) {
  return withAuth(async (req, userId) => {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;
    try {
      const invoices = await listInvoices(userId, status);
      return NextResponse.json({ invoices });
    } catch {
      return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
    }
  })(request);
}

export async function POST(request: NextRequest) {
  return withAuth(async (req, userId) => {
    try {
      const body = await req.json().catch(() => ({}));
      const invoice = await createInvoice(userId, body);
      return NextResponse.json({ invoice }, { status: 201 });
    } catch {
      return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
    }
  })(request);
}
