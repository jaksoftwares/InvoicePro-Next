"use client";
import React, { useEffect, useState, useRef } from 'react';
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
  const [isDownloading, setIsDownloading] = useState(false);
  const [showInvoice, setShowInvoice] = useState(true);
  const invoiceRef = useRef<HTMLDivElement>(null);

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

  const handleDownloadPDF = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!invoice || isDownloading) return;
    
    setIsDownloading(true);
    setShowInvoice(false);
    
    try {
      // Get auth token
      const token = await getAccessToken();
      
      // Try server-side API first
      const response = await fetch(`/api/invoices/${invoice.id}/pdf`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      
      // Check if response is a valid PDF by content type
      const contentType = response.headers.get('content-type') || '';
      
      if (response.ok && (contentType.includes('application/pdf') || contentType.includes('application/octet-stream'))) {
        // Server-side generation succeeded - download the PDF
        const blob = await response.blob();
        
        // Verify blob is actually a PDF
        if (blob.type.includes('pdf') || blob.size > 0) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          const fileName = `invoice-${invoice.invoiceNumber}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          setIsDownloading(false);
          setShowInvoice(true);
          return;
        }
      }
      
      // If not a valid PDF response, fall back to client-side generation
      await generateInvoicePDF(invoice, 'invoice-view-preview');
    } catch {
      // Fallback to client-side PDF generation on any error
      try {
        await generateInvoicePDF(invoice, 'invoice-view-preview');
      } catch {
        // Silently fail
      }
    } finally {
      setIsDownloading(false);
      setShowInvoice(true);
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
            type="button"
            onClick={handleDownloadPDF}
            disabled={!invoice || isDownloading}
            className="inline-flex items-center px-4 py-2 border border-blue-600 text-blue-700 font-semibold rounded-lg shadow-sm hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDownloading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Downloading...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </>
            )}
          </button>
        </div>
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            {/* Hidden container for PDF generation - always rendered but offscreen */}
            <div
              id="invoice-view-preview"
              className="fixed left-[-9999px] top-0 w-[794px] bg-white"
              style={{ visibility: 'hidden' }}
              ref={invoiceRef}
            >
              <InvoiceTemplate invoice={invoice} templateId={invoice.template || 'modern'} />
            </div>
            {/* Visible invoice preview - hidden during PDF generation */}
            {showInvoice && (
              <div className="w-full max-w-[794px] mx-auto bg-white">
                <InvoiceTemplate invoice={invoice} templateId={invoice.template || 'modern'} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceView;
