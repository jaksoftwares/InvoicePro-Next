// app/api/invoices/history/route.ts
// GET: Get invoice history
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/authMiddleware';
import { getInvoiceHistory } from '@/lib/services/invoice';

export async function GET(request: NextRequest) {
  return withAuth(async (req, userId) => {
    const { searchParams } = new URL(request.url);
    const invoiceId = searchParams.get('invoiceId');
    if (!invoiceId) return NextResponse.json({ error: 'Missing invoiceId' }, { status: 400 });
    try {
      const history = await getInvoiceHistory(userId, invoiceId);
      return NextResponse.json({ history });
    } catch {
      return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
    }
  })(request);
}
