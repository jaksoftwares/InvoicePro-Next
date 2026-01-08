"use client";
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { Invoice } from '../../types';
import { storageUtils } from '../../utils/storage';
import { getAccessToken } from '../../lib/supabase';
import InvoiceTemplate from './InvoiceTemplates';
import { Download, ArrowLeft } from 'lucide-react';
import { generateInvoicePDF } from '../../utils/pdfGenerator';
import SEO from '../SEO';

const InvoiceView: React.FC = () => {
  const params = useParams();
  const id = params?.id as string | undefined;
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) {
      setError('No invoice ID provided.');
      setLoading(false);
      return;
    }
    const inv = storageUtils.getInvoiceById(id);
    if (!inv) {
      setError('Invoice not found.');
    } else {
      setInvoice(inv);
    }
    setLoading(false);
  }, [id]);

  const handleDownloadPDF = async () => {
    if (!invoice) return;
    
    try {
      // Get auth token
      const token = await getAccessToken();
      
      // Try server-side API first
      const response = await fetch(`/api/invoices/${invoice.id}/pdf`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      
      if (response.ok) {
        // Server-side generation succeeded
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const fileName = `invoice-${invoice.invoiceNumber}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return;
      }
      
      // API not available or auth failed - use client-side generation
      console.warn('Server-side PDF generation not available, using client-side generation');
      await generateInvoicePDF(invoice, 'invoice-view-preview');
    } catch (error) {
      console.error('PDF generation error:', error);
      // Fallback to client-side PDF generation
      try {
        await generateInvoicePDF(invoice, 'invoice-view-preview');
      } catch (clientError) {
        console.error('Client-side PDF generation also failed:', clientError);
        alert('Failed to download invoice. Please try again.');
      }
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-600">{error}</div>;
  if (!invoice) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <SEO
        title={`Invoice #${invoice.invoiceNumber} | InvoicePro`}
        description={`View details for invoice #${invoice.invoiceNumber}`}
        canonical={typeof window !== 'undefined' ? window.location.href : ''}
        keywords="view invoice, invoice details, InvoicePro"
        image="/logo192.png"
        type="article"
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </button>
          <button
            onClick={handleDownloadPDF}
            className="inline-flex items-center px-4 py-2 border border-blue-600 text-blue-700 font-semibold rounded-lg shadow-sm hover:bg-blue-50 transition-colors"
          >
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </button>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div
              id="invoice-view-preview"
              className="w-full max-w-[794px] mx-auto bg-white"
              style={{ minHeight: '400px', width: '100%', height: 'auto', boxSizing: 'border-box', overflow: 'auto' }}
            >
              <InvoiceTemplate invoice={invoice} templateId={invoice.template || 'modern'} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceView;
