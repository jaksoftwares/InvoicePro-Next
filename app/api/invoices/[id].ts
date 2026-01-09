// app/api/invoices/[id].ts
// DELETE: Delete an invoice
import { NextRequest, NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/authMiddleware';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

async function deleteInvoice(req: AuthenticatedRequest): Promise<NextResponse> {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing invoice ID' }, { status: 400 });
  }

  const userId = req.userId!;

  const { error } = await supabaseAdmin
    .from('invoices')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 });
  }

  return NextResponse.json({ success: true }, { status: 200 });
}

async function DELETE(request: NextRequest) {
  return withAuth((req) => deleteInvoice(req as AuthenticatedRequest))(request);
}

export { DELETE };
