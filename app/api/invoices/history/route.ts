// app/api/invoices/history/route.ts
// GET: Fetch invoice history for an invoice
import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/authMiddleware';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

interface HistoryRow {
  id: string;
  invoice_id: string;
  user_id: string;
  action: string;
  previous_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  status_from: string | null;
  status_to: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

function transformHistoryToFrontend(row: HistoryRow) {
  return {
    id: row.id,
    invoiceId: row.invoice_id,
    userId: row.user_id,
    action: row.action,
    previousData: row.previous_data,
    newData: row.new_data,
    statusFrom: row.status_from,
    statusTo: row.status_to,
    metadata: row.metadata,
    createdAt: row.created_at,
  };
}

async function getHistory(userId: string, invoiceId: string) {
  const { data, error } = await supabaseAdmin
    .from('invoice_history')
    .select('*')
    .eq('invoice_id', invoiceId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching invoice history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoice history' },
      { status: 500 }
    );
  }

  const history = (data || []).map(transformHistoryToFrontend);
  return NextResponse.json({ history });
}

async function handleRequest(req: NextRequest, userId: string) {
  const { searchParams } = new URL(req.url);
  const invoiceId = searchParams.get('invoiceId');

  if (!invoiceId) {
    return NextResponse.json(
      { error: 'Missing invoiceId parameter' },
      { status: 400 }
    );
  }

  if (req.method === 'GET') {
    return getHistory(userId, invoiceId);
  }

  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

async function GET(request: NextRequest) {
  return withAuth((req, userId) => handleRequest(req, userId))(request);
}

export { GET };
