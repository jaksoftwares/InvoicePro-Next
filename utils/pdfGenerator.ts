import html2canvas from 'html2canvas';
import { Invoice, BusinessProfile } from '../types';
import { format } from 'date-fns';
import { PDFDocument } from 'pdf-lib';

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
};

// Helper to safely get business profile with fallback
const getBp = (invoice: Invoice): BusinessProfile => {
  return invoice.businessProfile || {
    id: '',
    userId: '',
    name: 'Your Business',
    email: 'business@example.com',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

// Template generators with simplified inline styles
const templates: Record<string, (invoice: Invoice) => string> = {
  modern: (invoice) => {
    const bp = getBp(invoice);
    return `
    <div style="font-family: system-ui, -apple-system, sans-serif; width: 794px; min-height: 1123px; padding: 32px; background: white; box-sizing: border-box;">
      <!-- Header with gradient effect using solid color -->
      <div style="background: linear-gradient(to right, #2563eb, #4338ca); color: white; padding: 24px; margin: -32px -32px 32px -32px; border-radius: 8px 8px 0 0;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div style="display: flex; align-items: center; gap: 16px;">
            ${bp.logo ? `<img src="${bp.logo}" alt="Logo" style="height: 48px; width: 48px; object-fit: contain; background: white; padding: 8px; border-radius: 8px;">` : ''}
            <div>
              <h1 style="margin: 0; font-size: 24px; font-weight: bold;">${bp.name}</h1>
              <p style="margin: 4px 0 0 0; font-size: 14px; color: #bfdbfe;">${bp.email}</p>
            </div>
          </div>
          <div style="text-align: right;">
            <h2 style="margin: 0; font-size: 32px; font-weight: bold;">INVOICE</h2>
            <p style="margin: 4px 0 0 0; font-size: 18px; color: #bfdbfe;">#${invoice.invoiceNumber}</p>
          </div>
        </div>
      </div>

      <!-- Invoice Details -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px;">
        <div style="background: #eff6ff; padding: 16px; border-radius: 8px; border-left: 4px solid #2563eb;">
          <h3 style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #1e40af; text-transform: uppercase;">Issue Date</h3>
          <p style="margin: 0; font-size: 16px; font-weight: 500; color: #111827;">${format(new Date(invoice.issueDate), 'MMM dd, yyyy')}</p>
        </div>
        <div style="background: #eef2ff; padding: 16px; border-radius: 8px; border-left: 4px solid #4f46e5;">
          <h3 style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #3730a3; text-transform: uppercase;">Due Date</h3>
          <p style="margin: 0; font-size: 16px; font-weight: 500; color: #111827;">${format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</p>
        </div>
        <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; border-left: 4px solid #16a34a;">
          <h3 style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #166534; text-transform: uppercase;">Amount Due</h3>
          <p style="margin: 0; font-size: 16px; font-weight: 700; color: #16a34a;">${formatCurrency(invoice.total, invoice.currency)}</p>
        </div>
      </div>

      <!-- Addresses -->
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 32px; margin-bottom: 32px;">
        <div>
          <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #111827; border-bottom: 2px solid #2563eb; padding-bottom: 8px;">From</h3>
          <div style="font-size: 14px; color: #374151; line-height: 1.6;">
            <p style="margin: 0; font-weight: 600; color: #111827;">${bp.name}</p>
            <p style="margin: 0;">${bp.address}</p>
            <p style="margin: 0;">${bp.city}, ${bp.state} ${bp.zipCode}</p>
            <p style="margin: 0;">${bp.country}</p>
            <p style="margin: 0; color: #2563eb;">${bp.email}</p>
            <p style="margin: 0;">${bp.phone}</p>
          </div>
        </div>
        <div>
          <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #111827; border-bottom: 2px solid #4f46e5; padding-bottom: 8px;">Bill To</h3>
          <div style="font-size: 14px; color: #374151; line-height: 1.6;">
            <p style="margin: 0; font-weight: 600; color: #111827;">${invoice.clientName}</p>
            <p style="margin: 0;">${invoice.clientAddress}</p>
            <p style="margin: 0;">${invoice.clientCity}, ${invoice.clientState} ${invoice.clientZipCode}</p>
            <p style="margin: 0;">${invoice.clientCountry}</p>
            <p style="margin: 0; color: #4f46e5;">${invoice.clientEmail}</p>
            ${invoice.clientPhone ? `<p style="margin: 0;">${invoice.clientPhone}</p>` : ''}
          </div>
        </div>
      </div>

      <!-- Items Table -->
      <div style="margin-bottom: 32px;">
        <table style="width: 100%; border-collapse: collapse; background: white; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 16px 8px; text-align: left; font-size: 12px; font-weight: 600; color: #111827; border-bottom: 2px solid #e5e7eb;">Description</th>
              <th style="padding: 16px 8px; text-align: center; font-size: 12px; font-weight: 600; color: #111827; border-bottom: 2px solid #e5e7eb;">Qty</th>
              <th style="padding: 16px 8px; text-align: right; font-size: 12px; font-weight: 600; color: #111827; border-bottom: 2px solid #e5e7eb;">Rate</th>
              <th style="padding: 16px 8px; text-align: right; font-size: 12px; font-weight: 600; color: #111827; border-bottom: 2px solid #e5e7eb;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map((item, index) => `
              <tr style="background: ${index % 2 === 0 ? 'white' : '#f9fafb'}; border-bottom: 1px solid #e5e7eb;">
                <td style="padding: 16px 8px; font-size: 14px; color: #111827;">${item.description}</td>
                <td style="padding: 16px 8px; font-size: 14px; text-align: center; color: #111827;">${item.quantity}</td>
                <td style="padding: 16px 8px; font-size: 14px; text-align: right; color: #111827;">${formatCurrency(item.rate, invoice.currency)}</td>
                <td style="padding: 16px 8px; font-size: 14px; text-align: right; font-weight: 500; color: #111827;">${formatCurrency(item.amount, invoice.currency)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Totals -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: 32px;">
        <div style="width: 300px; background: #f9fafb; padding: 24px; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px;">
            <span style="color: #6b7280;">Subtotal:</span>
            <span style="font-weight: 500; color: #111827;">${formatCurrency(invoice.subtotal, invoice.currency)}</span>
          </div>
          ${invoice.discountAmount > 0 ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px;">
            <span style="color: #6b7280;">Discount (${invoice.discountRate}%):</span>
            <span style="font-weight: 500; color: #dc2626;">-${formatCurrency(invoice.discountAmount, invoice.currency)}</span>
          </div>
          ` : ''}
          ${invoice.taxAmount > 0 ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px;">
            <span style="color: #6b7280;">Tax (${invoice.taxRate}%):</span>
            <span style="font-weight: 500; color: #111827;">${formatCurrency(invoice.taxAmount, invoice.currency)}</span>
          </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; padding-top: 12px; border-top: 2px solid #d1d5db;">
            <span style="font-size: 18px; font-weight: bold; color: #111827;">Total:</span>
            <span style="font-size: 18px; font-weight: bold; color: #2563eb;">${formatCurrency(invoice.total, invoice.currency)}</span>
          </div>
        </div>
      </div>

      <!-- Notes -->
      ${invoice.notes || invoice.terms ? `
      <div style="border-top: 2px solid #e5e7eb; padding-top: 24px;">
        ${invoice.notes ? `
        <div style="margin-bottom: 16px;">
          <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #111827;">Notes:</h4>
          <p style="margin: 0; font-size: 14px; color: #4b5563; line-height: 1.6;">${invoice.notes}</p>
        </div>
        ` : ''}
        ${invoice.terms ? `
        <div>
          <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #111827;">Terms & Conditions:</h4>
          <p style="margin: 0; font-size: 14px; color: #4b5563; line-height: 1.6;">${invoice.terms}</p>
        </div>
        ` : ''}
      </div>
      ` : ''}
    </div>
    `;
  },

  classic: (invoice) => {
    const bp = getBp(invoice);
    return `
    <div style="font-family: Georgia, serif; width: 794px; min-height: 1123px; padding: 32px; background: white; box-sizing: border-box;">
      <!-- Elegant Header -->
      <div style="text-align: center; margin-bottom: 32px; border-bottom: 4px solid #1f2937; padding-bottom: 24px;">
        ${bp.logo ? `<img src="${bp.logo}" alt="Logo" style="height: 80px; width: 80px; object-fit: contain; border: 2px solid #d1d5db; border-radius: 50%; padding: 8px; margin-bottom: 16px;">` : ''}
        <h1 style="margin: 0 0 8px 0; font-size: 28px; font-weight: bold; color: #1f2937;">${bp.name}</h1>
        <div style="font-size: 14px; color: #6b7280; line-height: 1.6;">
          <p style="margin: 0;">${bp.address}</p>
          <p style="margin: 0;">${bp.city}, ${bp.state} ${bp.zipCode}</p>
          <p style="margin: 0;">${bp.phone} | ${bp.email}</p>
        </div>
      </div>

      <!-- Invoice Title -->
      <div style="text-align: center; margin-bottom: 32px;">
        <h2 style="margin: 0 0 8px 0; font-size: 36px; font-weight: bold; color: #1f2937;">INVOICE</h2>
        <p style="margin: 0; font-size: 20px; color: #6b7280;">#${invoice.invoiceNumber}</p>
      </div>

      <!-- Invoice Details -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px;">
        <div style="border: 2px solid #d1d5db; padding: 16px; text-align: center;">
          <h3 style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #1f2937; text-transform: uppercase;">Issue Date</h3>
          <p style="margin: 0; font-size: 16px; font-weight: 500;">${format(new Date(invoice.issueDate), 'MMMM dd, yyyy')}</p>
        </div>
        <div style="border: 2px solid #d1d5db; padding: 16px; text-align: center;">
          <h3 style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #1f2937; text-transform: uppercase;">Due Date</h3>
          <p style="margin: 0; font-size: 16px; font-weight: 500;">${format(new Date(invoice.dueDate), 'MMMM dd, yyyy')}</p>
        </div>
        <div style="border: 2px solid #1f2937; background: #1f2937; color: white; padding: 16px; text-align: center;">
          <h3 style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; text-transform: uppercase;">Amount Due</h3>
          <p style="margin: 0; font-size: 16px; font-weight: bold;">${formatCurrency(invoice.total, invoice.currency)}</p>
        </div>
      </div>

      <!-- Addresses -->
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 32px; margin-bottom: 32px;">
        <div style="border: 2px solid #d1d5db; padding: 24px;">
          <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #1f2937; text-decoration: underline; text-decoration-thickness: 2px;">Bill From:</h3>
          <div style="font-size: 14px; color: #374151; line-height: 1.8;">
            <p style="margin: 0; font-weight: 600; color: #111827;">${bp.name}</p>
            <p style="margin: 0;">${bp.address}</p>
            <p style="margin: 0;">${bp.city}, ${bp.state} ${bp.zipCode}</p>
            <p style="margin: 0;">${bp.country}</p>
            <p style="margin: 0;">${bp.email}</p>
            <p style="margin: 0;">${bp.phone}</p>
          </div>
        </div>
        <div style="border: 2px solid #d1d5db; padding: 24px;">
          <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #1f2937; text-decoration: underline; text-decoration-thickness: 2px;">Bill To:</h3>
          <div style="font-size: 14px; color: #374151; line-height: 1.8;">
            <p style="margin: 0; font-weight: 600; color: #111827;">${invoice.clientName}</p>
            <p style="margin: 0;">${invoice.clientAddress}</p>
            <p style="margin: 0;">${invoice.clientCity}, ${invoice.clientState} ${invoice.clientZipCode}</p>
            <p style="margin: 0;">${invoice.clientCountry}</p>
            <p style="margin: 0;">${invoice.clientEmail}</p>
            ${invoice.clientPhone ? `<p style="margin: 0;">${invoice.clientPhone}</p>` : ''}
          </div>
        </div>
      </div>

      <!-- Items Table -->
      <div style="margin-bottom: 32px;">
        <table style="width: 100%; border: 4px solid #1f2937; border-collapse: collapse;">
          <thead>
            <tr style="background: #1f2937; color: white;">
              <th style="border: 2px solid #1f2937; padding: 12px 8px; text-align: left; font-size: 12px; font-weight: bold;">Description</th>
              <th style="border: 2px solid #1f2937; padding: 12px 8px; text-align: center; font-size: 12px; font-weight: bold;">Quantity</th>
              <th style="border: 2px solid #1f2937; padding: 12px 8px; text-align: right; font-size: 12px; font-weight: bold;">Rate</th>
              <th style="border: 2px solid #1f2937; padding: 12px 8px; text-align: right; font-size: 12px; font-weight: bold;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map((item, index) => `
              <tr style="background: ${index % 2 === 0 ? 'white' : '#f3f4f6'}; border-bottom: 2px solid #d1d5db;">
                <td style="border: 2px solid #d1d5db; padding: 12px 8px; font-size: 14px; color: #111827;">${item.description}</td>
                <td style="border: 2px solid #d1d5db; padding: 12px 8px; text-align: center; font-size: 14px; color: #111827;">${item.quantity}</td>
                <td style="border: 2px solid #d1d5db; padding: 12px 8px; text-align: right; font-size: 14px; color: #111827;">${formatCurrency(item.rate, invoice.currency)}</td>
                <td style="border: 2px solid #d1d5db; padding: 12px 8px; text-align: right; font-size: 14px; font-weight: 500; color: #111827;">${formatCurrency(item.amount, invoice.currency)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Totals -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: 32px;">
        <div style="width: 300px; border: 4px solid #1f2937;">
          <div style="background: #f3f4f6; padding: 16px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px;">
              <span style="font-weight: 500; color: #1f2937;">Subtotal:</span>
              <span style="font-weight: bold;">${formatCurrency(invoice.subtotal, invoice.currency)}</span>
            </div>
            ${invoice.discountAmount > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px;">
              <span style="font-weight: 500; color: #1f2937;">Discount:</span>
              <span style="font-weight: bold;">-${formatCurrency(invoice.discountAmount, invoice.currency)}</span>
            </div>
            ` : ''}
            ${invoice.taxAmount > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px;">
              <span style="font-weight: 500; color: #1f2937;">Tax:</span>
              <span style="font-weight: bold;">${formatCurrency(invoice.taxAmount, invoice.currency)}</span>
            </div>
            ` : ''}
          </div>
          <div style="background: #1f2937; color: white; padding: 16px;">
            <div style="display: flex; justify-content: space-between;">
              <span style="font-size: 18px; font-weight: bold;">TOTAL:</span>
              <span style="font-size: 18px; font-weight: bold;">${formatCurrency(invoice.total, invoice.currency)}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Notes -->
      ${invoice.notes || invoice.terms ? `
      <div style="border-top: 4px solid #1f2937; padding-top: 24px;">
        ${invoice.notes ? `
        <div style="border: 2px solid #d1d5db; padding: 16px; margin-bottom: 16px;">
          <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #1f2937; text-decoration: underline;">Notes:</h4>
          <p style="margin: 0; font-size: 14px; color: #4b5563; line-height: 1.6;">${invoice.notes}</p>
        </div>
        ` : ''}
        ${invoice.terms ? `
        <div style="border: 2px solid #d1d5db; padding: 16px;">
          <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #1f2937; text-decoration: underline;">Terms & Conditions:</h4>
          <p style="margin: 0; font-size: 14px; color: #4b5563; line-height: 1.6;">${invoice.terms}</p>
        </div>
        ` : ''}
      </div>
      ` : ''}
    </div>
    `;
  },

  minimal: (invoice) => {
    const bp = getBp(invoice);
    return `
    <div style="font-family: Inter, system-ui, sans-serif; width: 794px; min-height: 1123px; padding: 32px; background: white; box-sizing: border-box;">
      <!-- Clean Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 48px; padding-bottom: 24px; border-bottom: 1px solid #e5e7eb;">
        <div style="display: flex; align-items: center; gap: 16px;">
          ${bp.logo ? `<img src="${bp.logo}" alt="Logo" style="height: 64px; width: 64px; object-fit: contain;">` : ''}
          <div>
            <h1 style="margin: 0; font-size: 24px; font-weight: 300; color: #111827;">${bp.name}</h1>
            <p style="margin: 4px 0 0 0; font-size: 14px; color: #9ca3af;">${bp.email}</p>
          </div>
        </div>
        <div style="text-align: right;">
          <h2 style="margin: 0; font-size: 36px; font-weight: 100; color: #111827;">Invoice</h2>
          <p style="margin: 4px 0 0 0; font-size: 14px; color: #9ca3af;">#${invoice.invoiceNumber}</p>
        </div>
      </div>

      <!-- Minimal Info Grid -->
      <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 32px; margin-bottom: 48px;">
        <div>
          <p style="margin: 0 0 4px 0; font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em;">Issue Date</p>
          <p style="margin: 0; font-size: 14px; font-weight: 500; color: #111827;">${format(new Date(invoice.issueDate), 'MMM dd, yyyy')}</p>
        </div>
        <div>
          <p style="margin: 0 0 4px 0; font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em;">Due Date</p>
          <p style="margin: 0; font-size: 14px; font-weight: 500; color: #111827;">${format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</p>
        </div>
        <div>
          <p style="margin: 0 0 4px 0; font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em;">Status</p>
          <p style="margin: 0; font-size: 14px; font-weight: 500; color: #111827; text-transform: capitalize;">${invoice.status}</p>
        </div>
        <div>
          <p style="margin: 0 0 4px 0; font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em;">Total</p>
          <p style="margin: 0; font-size: 18px; font-weight: 600; color: #111827;">${formatCurrency(invoice.total, invoice.currency)}</p>
        </div>
      </div>

      <!-- Addresses -->
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 48px; margin-bottom: 48px;">
        <div>
          <p style="margin: 0 0 12px 0; font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em;">From</p>
          <div style="font-size: 14px; color: #374151; line-height: 1.6;">
            <p style="margin: 0; font-weight: 500; color: #111827;">${bp.name}</p>
            <p style="margin: 0;">${bp.address}</p>
            <p style="margin: 0;">${bp.city}, ${bp.state} ${bp.zipCode}</p>
            <p style="margin: 0;">${bp.country}</p>
            <p style="margin: 0; color: #9ca3af;">${bp.phone}</p>
          </div>
        </div>
        <div>
          <p style="margin: 0 0 12px 0; font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em;">To</p>
          <div style="font-size: 14px; color: #374151; line-height: 1.6;">
            <p style="margin: 0; font-weight: 500; color: #111827;">${invoice.clientName}</p>
            <p style="margin: 0;">${invoice.clientAddress}</p>
            <p style="margin: 0;">${invoice.clientCity}, ${invoice.clientState} ${invoice.clientZipCode}</p>
            <p style="margin: 0;">${invoice.clientCountry}</p>
            <p style="margin: 0; color: #9ca3af;">${invoice.clientEmail}</p>
          </div>
        </div>
      </div>

      <!-- Items List -->
      <div style="margin-bottom: 48px;">
        <div style="display: grid; grid-template-columns: 6fr 2fr 2fr 2fr; gap: 16px; padding-bottom: 8px; border-bottom: 1px solid #e5e7eb;">
          <p style="margin: 0; font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em;">Description</p>
          <p style="margin: 0; font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; text-align: center;">Qty</p>
          <p style="margin: 0; font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; text-align: right;">Rate</p>
          <p style="margin: 0; font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em; text-align: right;">Amount</p>
        </div>
        ${invoice.items.map(item => `
          <div style="display: grid; grid-template-columns: 6fr 2fr 2fr 2fr; gap: 16px; padding: 12px 0; border-bottom: 1px solid #f3f4f6;">
            <p style="margin: 0; font-size: 14px; font-weight: 500; color: #111827;">${item.description}</p>
            <p style="margin: 0; font-size: 14px; color: #374151; text-align: center;">${item.quantity}</p>
            <p style="margin: 0; font-size: 14px; color: #374151; text-align: right;">${formatCurrency(item.rate, invoice.currency)}</p>
            <p style="margin: 0; font-size: 14px; font-weight: 500; color: #111827; text-align: right;">${formatCurrency(item.amount, invoice.currency)}</p>
          </div>
        `).join('')}
      </div>

      <!-- Totals -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: 48px;">
        <div style="width: 250px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px;">
            <span style="color: #9ca3af;">Subtotal</span>
            <span style="font-weight: 500; color: #111827;">${formatCurrency(invoice.subtotal, invoice.currency)}</span>
          </div>
          ${invoice.discountAmount > 0 ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px;">
            <span style="color: #9ca3af;">Discount</span>
            <span style="font-weight: 500; color: #111827;">-${formatCurrency(invoice.discountAmount, invoice.currency)}</span>
          </div>
          ` : ''}
          ${invoice.taxAmount > 0 ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px;">
            <span style="color: #9ca3af;">Tax</span>
            <span style="font-weight: 500; color: #111827;">${formatCurrency(invoice.taxAmount, invoice.currency)}</span>
          </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; padding-top: 12px; border-top: 1px solid #e5e7eb;">
            <span style="font-size: 18px; font-weight: 300; color: #111827;">Total</span>
            <span style="font-size: 18px; font-weight: 600; color: #111827;">${formatCurrency(invoice.total, invoice.currency)}</span>
          </div>
        </div>
      </div>

      <!-- Notes -->
      ${invoice.notes || invoice.terms ? `
      <div style="border-top: 1px solid #e5e7eb; padding-top: 24px;">
        ${invoice.notes ? `
        <div style="margin-bottom: 16px;">
          <p style="margin: 0 0 8px 0; font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em;">Notes</p>
          <p style="margin: 0; font-size: 14px; color: #4b5563; line-height: 1.6;">${invoice.notes}</p>
        </div>
        ` : ''}
        ${invoice.terms ? `
        <div>
          <p style="margin: 0 0 8px 0; font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em;">Terms</p>
          <p style="margin: 0; font-size: 14px; color: #4b5563; line-height: 1.6;">${invoice.terms}</p>
        </div>
        ` : ''}
      </div>
      ` : ''}
    </div>
    `;
  },

  professional: (invoice) => {
    const bp = getBp(invoice);
    return `
    <div style="font-family: Helvetica, Arial, sans-serif; width: 794px; min-height: 1123px; padding: 32px; background: white; box-sizing: border-box;">
      <!-- Professional Header -->
      <div style="border-bottom: 4px solid #2563eb; padding-bottom: 24px; margin-bottom: 32px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div style="display: flex; align-items: center; gap: 24px;">
            ${bp.logo ? `<img src="${bp.logo}" alt="Logo" style="height: 80px; width: 80px; object-fit: contain; border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px;">` : ''}
            <div>
              <h1 style="margin: 0; font-size: 28px; font-weight: bold; color: #1f2937;">${bp.name}</h1>
              <div style="margin-top: 8px; font-size: 14px; color: #6b7280; line-height: 1.6;">
                <p style="margin: 0;">${bp.address}</p>
                <p style="margin: 0;">${bp.city}, ${bp.state} ${bp.zipCode}</p>
                <p style="margin: 0;">Tel: ${bp.phone} | Email: ${bp.email}</p>
              </div>
            </div>
          </div>
          <div style="text-align: right;">
            <h2 style="margin: 0; font-size: 28px; font-weight: bold; color: #2563eb;">INVOICE</h2>
            <div style="background: #eff6ff; padding: 12px; border-radius: 8px; margin-top: 8px;">
              <p style="margin: 0 0 4px 0; font-size: 12px; color: #6b7280;">Invoice Number</p>
              <p style="margin: 0; font-size: 18px; font-weight: bold; color: #111827;">#${invoice.invoiceNumber}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Invoice Information -->
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 32px; margin-bottom: 32px;">
        <div>
          <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: bold; color: #1f2937; background: #f3f4f6; padding: 12px; border-radius: 8px;">BILL TO</h3>
          <div style="font-size: 14px; color: #374151; line-height: 1.8;">
            <p style="margin: 0; font-weight: bold; color: #111827; font-size: 18px;">${invoice.clientName}</p>
            <p style="margin: 0;">${invoice.clientAddress}</p>
            <p style="margin: 0;">${invoice.clientCity}, ${invoice.clientState} ${invoice.clientZipCode}</p>
            <p style="margin: 0;">${invoice.clientCountry}</p>
            <p style="margin: 0; color: #2563eb; font-weight: 500;">${invoice.clientEmail}</p>
            ${invoice.clientPhone ? `<p style="margin: 0;">${invoice.clientPhone}</p>` : ''}
          </div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 16px;">
            <div style="background: #eff6ff; padding: 16px; border-radius: 8px;">
              <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;">
                <div>
                  <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 600; color: #2563eb; text-transform: uppercase;">Issue Date</p>
                  <p style="margin: 0; font-size: 14px; font-weight: 500; color: #111827;">${format(new Date(invoice.issueDate), 'MMM dd, yyyy')}</p>
                </div>
                <div>
                  <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 600; color: #4f46e5; text-transform: uppercase;">Due Date</p>
                  <p style="margin: 0; font-size: 14px; font-weight: 500; color: #111827;">${format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</p>
                </div>
              </div>
            </div>
            <div style="background: #f0fdf4; padding: 16px; border-radius: 8px; border-left: 4px solid #16a34a;">
              <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 600; color: #166534; text-transform: uppercase;">Total Amount Due</p>
              <p style="margin: 0; font-size: 24px; font-weight: bold; color: #16a34a;">${formatCurrency(invoice.total, invoice.currency)}</p>
            </div>
          </div>
      </div>

      <!-- Items Table -->
      <div style="margin-bottom: 32px;">
        <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: bold; color: #1f2937;">INVOICE DETAILS</h3>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #d1d5db;">
          <thead>
            <tr style="background: #2563eb; color: white;">
              <th style="border: 1px solid #d1d5db; padding: 12px 8px; text-align: left; font-size: 12px; font-weight: bold;">DESCRIPTION</th>
              <th style="border: 1px solid #d1d5db; padding: 12px 8px; text-align: center; font-size: 12px; font-weight: bold;">QTY</th>
              <th style="border: 1px solid #d1d5db; padding: 12px 8px; text-align: right; font-size: 12px; font-weight: bold;">RATE</th>
              <th style="border: 1px solid #d1d5db; padding: 12px 8px; text-align: right; font-size: 12px; font-weight: bold;">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map((item, index) => `
              <tr style="background: ${index % 2 === 0 ? 'white' : '#f9fafb'};">
                <td style="border: 1px solid #d1d5db; padding: 12px 8px; font-size: 14px; color: #111827;">${item.description}</td>
                <td style="border: 1px solid #d1d5db; padding: 12px 8px; text-align: center; font-size: 14px; color: #111827;">${item.quantity}</td>
                <td style="border: 1px solid #d1d5db; padding: 12px 8px; text-align: right; font-size: 14px; color: #111827;">${formatCurrency(item.rate, invoice.currency)}</td>
                <td style="border: 1px solid #d1d5db; padding: 12px 8px; text-align: right; font-size: 14px; font-weight: 500; color: #111827;">${formatCurrency(item.amount, invoice.currency)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Totals -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: 32px;">
        <div style="width: 300px;">
          <div style="background: #f3f4f6; border: 1px solid #d1d5db; border-radius: 8px; overflow: hidden;">
            <div style="padding: 16px;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px;">
                <span style="font-weight: 500; color: #374151;">Subtotal:</span>
                <span style="font-weight: 500; color: #111827;">${formatCurrency(invoice.subtotal, invoice.currency)}</span>
              </div>
              ${invoice.discountAmount > 0 ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px;">
                <span style="font-weight: 500; color: #374151;">Discount (${invoice.discountRate}%):</span>
                <span style="font-weight: 500; color: #dc2626;">-${formatCurrency(invoice.discountAmount, invoice.currency)}</span>
              </div>
              ` : ''}
              ${invoice.taxAmount > 0 ? `
              <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px;">
                <span style="font-weight: 500; color: #374151;">Tax (${invoice.taxRate}%):</span>
                <span style="font-weight: 500; color: #111827;">${formatCurrency(invoice.taxAmount, invoice.currency)}</span>
              </div>
              ` : ''}
            </div>
            <div style="background: #2563eb; color: white; padding: 16px;">
              <div style="display: flex; justify-content: space-between;">
                <span style="font-size: 18px; font-weight: bold;">TOTAL:</span>
                <span style="font-size: 18px; font-weight: bold;">${formatCurrency(invoice.total, invoice.currency)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Notes -->
      ${invoice.notes || invoice.terms ? `
      <div style="border-top: 2px solid #1f2937; padding-top: 24px;">
        ${invoice.notes ? `
        <div style="border: 2px solid #d1d5db; padding: 16px; margin-bottom: 16px;">
          <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #111827; background: #f3f4f6; padding: 8px; margin: -16px -16px 16px -16px;">Notes:</h4>
          <p style="margin: 0; font-size: 14px; color: #4b5563; line-height: 1.6;">${invoice.notes}</p>
        </div>
        ` : ''}
        ${invoice.terms ? `
        <div style="border: 2px solid #d1d5db; padding: 16px;">
          <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #111827; background: #f3f4f6; padding: 8px; margin: -16px -16px 16px -16px;">Terms & Conditions:</h4>
          <p style="margin: 0; font-size: 14px; color: #4b5563; line-height: 1.6;">${invoice.terms}</p>
        </div>
        ` : ''}
      </div>
      ` : ''}
    </div>
    `;
  },

  corporate: (invoice) => {
    const bp = getBp(invoice);
    return `
    <div style="font-family: 'Times New Roman', serif; width: 794px; min-height: 1123px; padding: 32px; background: white; box-sizing: border-box;">
      <!-- Corporate Header -->
      <div style="background: #111827; color: white; padding: 24px; margin: -32px -32px 32px -32px;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 16px;">
            ${bp.logo ? `<div style="background: white; padding: 8px; border-radius: 4px;"><img src="${bp.logo}" alt="Logo" style="height: 64px; width: 64px; object-fit: contain;"></div>` : ''}
            <div>
              <h1 style="margin: 0; font-size: 24px; font-weight: bold;">${bp.name}</h1>
              <p style="margin: 4px 0 0 0; font-size: 14px; color: #9ca3af;">${bp.email}</p>
            </div>
          </div>
          <div style="text-align: right;">
            <h2 style="margin: 0; font-size: 36px; font-weight: bold;">INVOICE</h2>
            <p style="margin: 4px 0 0 0; font-size: 20px; color: #9ca3af;">#${invoice.invoiceNumber}</p>
          </div>
        </div>
      </div>

      <!-- Corporate Info -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px;">
        <div style="background: #f3f4f6; padding: 16px; border-left: 4px solid #111827;">
          <h3 style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #111827; text-transform: uppercase;">Invoice Date</h3>
          <p style="margin: 0; font-size: 16px; font-weight: 500;">${format(new Date(invoice.issueDate), 'MMMM dd, yyyy')}</p>
        </div>
        <div style="background: #f3f4f6; padding: 16px; border-left: 4px solid #111827;">
          <h3 style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #111827; text-transform: uppercase;">Payment Due</h3>
          <p style="margin: 0; font-size: 16px; font-weight: 500;">${format(new Date(invoice.dueDate), 'MMMM dd, yyyy')}</p>
        </div>
        <div style="background: #111827; color: white; padding: 16px;">
          <h3 style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; text-transform: uppercase;">Amount Due</h3>
          <p style="margin: 0; font-size: 20px; font-weight: bold;">${formatCurrency(invoice.total, invoice.currency)}</p>
        </div>
      </div>

      <!-- Addresses -->
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 32px; margin-bottom: 32px;">
        <div style="border: 1px solid #d1d5db; padding: 24px;">
          <h3 style="margin: -24px -24px 16px -24px; font-size: 16px; font-weight: bold; color: white; background: #111827; padding: 8px 24px;">FROM</h3>
          <div style="font-size: 14px; color: #374151; line-height: 1.8; margin-top: 16px;">
            <p style="margin: 0; font-weight: 600; color: #111827;">${bp.name}</p>
            <p style="margin: 0;">${bp.address}</p>
            <p style="margin: 0;">${bp.city}, ${bp.state} ${bp.zipCode}</p>
            <p style="margin: 0;">${bp.country}</p>
            <p style="margin: 0;">${bp.email}</p>
            <p style="margin: 0;">${bp.phone}</p>
          </div>
        </div>
        <div style="border: 1px solid #d1d5db; padding: 24px;">
          <h3 style="margin: -24px -24px 16px -24px; font-size: 16px; font-weight: bold; color: white; background: #111827; padding: 8px 24px;">TO</h3>
          <div style="font-size: 14px; color: #374151; line-height: 1.8; margin-top: 16px;">
            <p style="margin: 0; font-weight: 600; color: #111827;">${invoice.clientName}</p>
            <p style="margin: 0;">${invoice.clientAddress}</p>
            <p style="margin: 0;">${invoice.clientCity}, ${invoice.clientState} ${invoice.clientZipCode}</p>
            <p style="margin: 0;">${invoice.clientCountry}</p>
            <p style="margin: 0;">${invoice.clientEmail}</p>
            ${invoice.clientPhone ? `<p style="margin: 0;">${invoice.clientPhone}</p>` : ''}
          </div>
        </div>
      </div>

      <!-- Items Table -->
      <div style="margin-bottom: 32px;">
        <table style="width: 100%; border: 2px solid #111827; border-collapse: collapse;">
          <thead>
            <tr style="background: #111827; color: white;">
              <th style="border: 2px solid #111827; padding: 12px 8px; text-align: left; font-size: 12px; font-weight: bold;">DESCRIPTION</th>
              <th style="border: 2px solid #111827; padding: 12px 8px; text-align: center; font-size: 12px; font-weight: bold;">QTY</th>
              <th style="border: 2px solid #111827; padding: 12px 8px; text-align: right; font-size: 12px; font-weight: bold;">RATE</th>
              <th style="border: 2px solid #111827; padding: 12px 8px; text-align: right; font-size: 12px; font-weight: bold;">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map((item, index) => `
              <tr style="background: ${index % 2 === 0 ? 'white' : '#f3f4f6'};">
                <td style="border: 2px solid #d1d5db; padding: 12px 8px; font-size: 14px; color: #111827;">${item.description}</td>
                <td style="border: 2px solid #d1d5db; padding: 12px 8px; text-align: center; font-size: 14px; color: #111827;">${item.quantity}</td>
                <td style="border: 2px solid #d1d5db; padding: 12px 8px; text-align: right; font-size: 14px; color: #111827;">${formatCurrency(item.rate, invoice.currency)}</td>
                <td style="border: 2px solid #d1d5db; padding: 12px 8px; text-align: right; font-size: 14px; font-weight: 500; color: #111827;">${formatCurrency(item.amount, invoice.currency)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <!-- Totals -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: 32px;">
        <div style="width: 300px; border: 2px solid #111827;">
          <div style="background: #f3f4f6; padding: 16px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px;">
              <span style="font-weight: bold; color: #111827;">SUBTOTAL:</span>
              <span style="font-weight: bold;">${formatCurrency(invoice.subtotal, invoice.currency)}</span>
            </div>
            ${invoice.discountAmount > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px;">
              <span style="font-weight: bold; color: #111827;">DISCOUNT:</span>
              <span style="font-weight: bold;">-${formatCurrency(invoice.discountAmount, invoice.currency)}</span>
            </div>
            ` : ''}
            ${invoice.taxAmount > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px;">
              <span style="font-weight: bold; color: #111827;">TAX:</span>
              <span style="font-weight: bold;">${formatCurrency(invoice.taxAmount, invoice.currency)}</span>
            </div>
            ` : ''}
          </div>
          <div style="background: #111827; color: white; padding: 16px;">
            <div style="display: flex; justify-content: space-between;">
              <span style="font-size: 18px; font-weight: bold;">TOTAL:</span>
              <span style="font-size: 18px; font-weight: bold;">${formatCurrency(invoice.total, invoice.currency)}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Notes -->
      ${invoice.notes || invoice.terms ? `
      <div style="border-top: 2px solid #111827; padding-top: 24px;">
        ${invoice.notes ? `
        <div style="border: 1px solid #d1d5db; padding: 16px; margin-bottom: 16px;">
          <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #111827; background: #f3f4f6; padding: 8px; margin: -16px -16px 16px -16px;">NOTES</h4>
          <p style="margin: 0; font-size: 14px; color: #4b5563; line-height: 1.6;">${invoice.notes}</p>
        </div>
        ` : ''}
        ${invoice.terms ? `
        <div style="border: 1px solid #d1d5db; padding: 16px;">
          <h4 style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #111827; background: #f3f4f6; padding: 8px; margin: -16px -16px 16px -16px;">TERMS & CONDITIONS</h4>
          <p style="margin: 0; font-size: 14px; color: #4b5563; line-height: 1.6;">${invoice.terms}</p>
        </div>
        ` : ''}
      </div>
      ` : ''}
    </div>
    `;
  },

  elegant: (invoice) => {
    const bp = getBp(invoice);
    return `
    <div style="font-family: 'Playfair Display', Georgia, serif; width: 794px; min-height: 1123px; padding: 32px; background: white; box-sizing: border-box;">
      <!-- Elegant Header -->
      <div style="text-align: center; margin-bottom: 48px; border-bottom: 1px solid #d1d5db; padding-bottom: 32px;">
        ${bp.logo ? `<img src="${bp.logo}" alt="Logo" style="height: 96px; width: 96px; object-fit: contain; border: 4px solid #e5e7eb; border-radius: 50%; padding: 12px; margin-bottom: 24px;">` : ''}
        <h1 style="margin: 0 0 12px 0; font-size: 36px; font-weight: bold; color: #1f2937;">${bp.name}</h1>
        <div style="font-size: 14px; color: #6b7280; line-height: 1.8; font-style: italic;">
          <p style="margin: 0;">${bp.address}</p>
          <p style="margin: 0;">${bp.city}, ${bp.state} ${bp.zipCode}</p>
          <p style="margin: 0;">${bp.phone} • ${bp.email}</p>
        </div>
      </div>

      <!-- Invoice Title -->
      <div style="text-align: center; margin-bottom: 40px;">
        <h2 style="margin: 0 0 16px 0; font-size: 48px; font-weight: 300; color: #4b5563;">Invoice</h2>
        <div style="display: inline-block; background: #f3f4f6; padding: 12px 24px; border-radius: 9999px;">
          <p style="margin: 0; font-size: 18px; font-weight: 500; color: #1f2937;">#${invoice.invoiceNumber}</p>
        </div>
      </div>

      <!-- Date Section -->
      <div style="display: flex; justify-content: center; gap: 32px; margin-bottom: 48px;">
        <div style="background: #f9fafb; padding: 24px; border-radius: 8px; border: 1px solid #e5e7eb; text-align: center; min-width: 150px;">
          <p style="margin: 0 0 8px 0; font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.1em;">Issue Date</p>
          <p style="margin: 0; font-size: 16px; font-weight: 500; color: #1f2937;">${format(new Date(invoice.issueDate), 'MMMM dd, yyyy')}</p>
        </div>
        <div style="background: #f9fafb; padding: 24px; border-radius: 8px; border: 1px solid #e5e7eb; text-align: center; min-width: 150px;">
          <p style="margin: 0 0 8px 0; font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.1em;">Due Date</p>
          <p style="margin: 0; font-size: 16px; font-weight: 500; color: #1f2937;">${format(new Date(invoice.dueDate), 'MMMM dd, yyyy')}</p>
        </div>
        <div style="background: #1f2937; color: white; padding: 24px; border-radius: 8px; text-align: center; min-width: 150px;">
          <p style="margin: 0 0 8px 0; font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.1em;">Amount Due</p>
          <p style="margin: 0; font-size: 20px; font-weight: bold;">${formatCurrency(invoice.total, invoice.currency)}</p>
        </div>
      </div>

      <!-- Client Info -->
      <div style="text-align: center; margin-bottom: 48px;">
        <h3 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 300; color: #4b5563;">Billed To</h3>
        <div style="display: inline-block; text-align: left; background: #f9fafb; padding: 24px; border-radius: 8px; border: 1px solid #e5e7eb;">
          <div style="font-size: 14px; color: #374151; line-height: 1.8;">
            <p style="margin: 0; font-size: 18px; font-weight: 500; color: #111827;">${invoice.clientName}</p>
            <p style="margin: 0;">${invoice.clientAddress}</p>
            <p style="margin: 0;">${invoice.clientCity}, ${invoice.clientState} ${invoice.clientZipCode}</p>
            <p style="margin: 0;">${invoice.clientCountry}</p>
            <p style="margin: 0; color: #6b7280; font-style: italic;">${invoice.clientEmail}</p>
            ${invoice.clientPhone ? `<p style="margin: 0;">${invoice.clientPhone}</p>` : ''}
          </div>
        </div>
      </div>

      <!-- Items -->
      <div style="margin-bottom: 48px;">
        <h3 style="margin: 0 0 24px 0; font-size: 24px; font-weight: 300; color: #4b5563; text-align: center;">Services Provided</h3>
        <div style="border-bottom: 1px solid #e5e7eb;">
          ${invoice.items.map(item => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px; border-bottom: 1px solid #f3f4f6;">
              <div style="flex: 1;">
                <p style="margin: 0; font-size: 16px; font-weight: 500; color: #111827;">${item.description}</p>
                <p style="margin: 4px 0 0 0; font-size: 14px; color: #6b7280;">Quantity: ${item.quantity} × ${formatCurrency(item.rate, invoice.currency)}</p>
              </div>
              <div style="text-align: right;">
                <p style="margin: 0; font-size: 16px; font-weight: 500; color: #111827;">${formatCurrency(item.amount, invoice.currency)}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Totals -->
      <div style="display: flex; justify-content: center; margin-bottom: 48px;">
        <div style="width: 300px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">
          <div style="padding: 24px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px;">
              <span style="color: #6b7280;">Subtotal</span>
              <span style="font-weight: 500; color: #111827;">${formatCurrency(invoice.subtotal, invoice.currency)}</span>
            </div>
            ${invoice.discountAmount > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px;">
              <span style="color: #6b7280;">Discount</span>
              <span style="font-weight: 500; color: #111827;">-${formatCurrency(invoice.discountAmount, invoice.currency)}</span>
            </div>
            ` : ''}
            ${invoice.taxAmount > 0 ? `
            <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px;">
              <span style="color: #6b7280;">Tax</span>
              <span style="font-weight: 500; color: #111827;">${formatCurrency(invoice.taxAmount, invoice.currency)}</span>
            </div>
            ` : ''}
          </div>
          <div style="background: #1f2937; color: white; padding: 24px;">
            <div style="display: flex; justify-content: space-between;">
              <span style="font-size: 20px; font-weight: 300;">Total</span>
              <span style="font-size: 20px; font-weight: bold;">${formatCurrency(invoice.total, invoice.currency)}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Notes -->
      ${invoice.notes || invoice.terms ? `
      <div style="border-top: 1px solid #d1d5db; padding-top: 32px;">
        ${invoice.notes ? `
        <div style="text-align: center; margin-bottom: 24px;">
          <h4 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 300; color: #4b5563;">Notes</h4>
          <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.8; font-style: italic; max-width: 600px; margin: 0 auto;">${invoice.notes}</p>
        </div>
        ` : ''}
        ${invoice.terms ? `
        <div style="text-align: center;">
          <h4 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 300; color: #4b5563;">Terms & Conditions</h4>
          <p style="margin: 0; font-size: 14px; color: #6b7280; line-height: 1.8; max-width: 600px; margin: 0 auto;">${invoice.terms}</p>
        </div>
        ` : ''}
      </div>
      ` : ''}
    </div>
    `;
  },

  creative: (invoice) => {
    const bp = getBp(invoice);
    return `
    <div style="font-family: Poppin, system-ui, sans-serif; width: 794px; min-height: 1123px; padding: 32px; background: white; box-sizing: border-box;">
      <!-- Creative Header -->
      <div style="position: relative; margin-bottom: 48px;">
        <div style="position: absolute; inset: 0; background: linear-gradient(to right, #a855f7, #ec4899, #ef4444); border-radius: 16px; transform: rotate(1deg);"></div>
        <div style="position: relative; background: white; padding: 32px; border-radius: 16px; border: 2px solid #f3f4f6;">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div style="display: flex; align-items: center; gap: 24px;">
              ${bp.logo ? `<div style="background: linear-gradient(to bottom right, #ddd6fe, #fce7f3); padding: 12px; border-radius: 12px;"><img src="${bp.logo}" alt="Logo" style="height: 64px; width: 64px; object-fit: contain;"></div>` : ''}
              <div>
                <h1 style="margin: 0; font-size: 28px; font-weight: bold; background: linear-gradient(to right, #9333ea, #db2777); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${bp.name}</h1>
                <p style="margin: 4px 0 0 0; font-size: 14px; color: #6b7280;">${bp.email}</p>
              </div>
            </div>
            <div style="text-align: right;">
              <h2 style="margin: 0; font-size: 36px; font-weight: bold; color: #1f2937;">INVOICE</h2>
              <div style="background: linear-gradient(to right, #a855f7, #ec4899); color: white; padding: 8px 16px; border-radius: 9999px; margin-top: 8px;">
                <p style="margin: 0; font-size: 14px; font-weight: 500;">#${invoice.invoiceNumber}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Info Cards -->
      <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-bottom: 48px;">
        <div style="background: linear-gradient(to bottom right, #eff6ff, #dbeafe); padding: 24px; border-radius: 16px; border-left: 4px solid #3b82f6;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="background: #3b82f6; color: white; padding: 8px; border-radius: 8px;">
              <svg style="width: 20px; height: 20px;" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" /></svg>
            </div>
            <div>
              <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 600; color: #1e40af; text-transform: uppercase;">Issue Date</p>
              <p style="margin: 0; font-size: 14px; font-weight: bold; color: #111827;">${format(new Date(invoice.issueDate), 'MMM dd, yyyy')}</p>
            </div>
          </div>
        </div>
        <div style="background: linear-gradient(to bottom right, #fff7ed, #ffedd5); padding: 24px; border-radius: 16px; border-left: 4px solid #f97316;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="background: #f97316; color: white; padding: 8px; border-radius: 8px;">
              <svg style="width: 20px; height: 20px;" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" /></svg>
            </div>
            <div>
              <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 600; color: #9a3412; text-transform: uppercase;">Due Date</p>
              <p style="margin: 0; font-size: 14px; font-weight: bold; color: #111827;">${format(new Date(invoice.dueDate), 'MMM dd, yyyy')}</p>
            </div>
          </div>
        </div>
        <div style="background: linear-gradient(to bottom right, #f0fdf4, #dcfce7); padding: 24px; border-radius: 16px; border-left: 4px solid #22c55e;">
          <div style="display: flex; align-items: center; gap: 12px;">
            <div style="background: #22c55e; color: white; padding: 8px; border-radius: 8px;">
              <svg style="width: 20px; height: 20px;" fill="currentColor" viewBox="0 0 20 20"><path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" /><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm-6-8a6 6 0 1112 0 6 6 0 01-12 0z" clipRule="evenodd" /></svg>
            </div>
            <div>
              <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 600; color: #166534; text-transform: uppercase;">Total</p>
              <p style="margin: 0; font-size: 18px; font-weight: bold; color: #16a34a;">${formatCurrency(invoice.total, invoice.currency)}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Client Info -->
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 32px; margin-bottom: 48px;">
        <div style="background: #f9fafb; padding: 24px; border-radius: 16px;">
          <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: bold; color: #1f2937; display: flex; align-items: center;">
            <span style="background: #a855f7; color: white; padding: 8px; border-radius: 8px; margin-right: 12px;">
              <svg style="width: 20px; height: 20px;" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2v.01h12V6H4zm0 2v6h12V8H4z" clipRule="evenodd" /></svg>
            </span>
            From
          </h3>
          <div style="font-size: 14px; color: #374151; line-height: 1.8;">
            <p style="margin: 0; font-weight: 600; color: #111827;">${bp.name}</p>
            <p style="margin: 0;">${bp.address}</p>
            <p style="margin: 0;">${bp.city}, ${bp.state} ${bp.zipCode}</p>
            <p style="margin: 0;">${bp.country}</p>
            <p style="margin: 0; color: #a855f7;">${bp.email}</p>
            <p style="margin: 0;">${bp.phone}</p>
          </div>
        </div>
        <div style="background: #fdf2f8; padding: 24px; border-radius: 16px;">
          <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: bold; color: #1f2937; display: flex; align-items: center;">
            <span style="background: #ec4899; color: white; padding: 8px; border-radius: 8px; margin-right: 12px;">
              <svg style="width: 20px; height: 20px;" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
            </span>
            To
          </h3>
          <div style="font-size: 14px; color: #374151; line-height: 1.8;">
            <p style="margin: 0; font-weight: 600; color: #111827;">${invoice.clientName}</p>
            <p style="margin: 0;">${invoice.clientAddress}</p>
            <p style="margin: 0;">${invoice.clientCity}, ${invoice.clientState} ${invoice.clientZipCode}</p>
            <p style="margin: 0;">${invoice.clientCountry}</p>
            <p style="margin: 0; color: #ec4899;">${invoice.clientEmail}</p>
            ${invoice.clientPhone ? `<p style="margin: 0;">${invoice.clientPhone}</p>` : ''}
          </div>
        </div>
      </div>

      <!-- Items -->
      <div style="margin-bottom: 48px;">
        <h3 style="margin: 0 0 24px 0; font-size: 24px; font-weight: bold; color: #1f2937; text-align: center;">Invoice Items</h3>
        <div style="background: #f9fafb; padding: 24px; border-radius: 16px; border: 1px solid #e5e7eb;">
          ${invoice.items.map(item => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px; background: white; border-radius: 12px; margin-bottom: 12px; border: 1px solid #e5e7eb;">
              <div style="flex: 1;">
                <h4 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #111827;">${item.description}</h4>
                <div style="display: flex; gap: 16px;">
                  <span style="background: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 9999px; font-size: 12px;">Qty: ${item.quantity}</span>
                  <span style="background: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 9999px; font-size: 12px;">Rate: ${formatCurrency(item.rate, invoice.currency)}</span>
                </div>
              </div>
              <div style="text-align: right;">
                <p style="margin: 0; font-size: 20px; font-weight: bold; background: linear-gradient(to right, #9333ea, #db2777); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${formatCurrency(item.amount, invoice.currency)}</p>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Totals -->
      <div style="display: flex; justify-content: flex-end; margin-bottom: 48px;">
        <div style="width: 300px; background: linear-gradient(to bottom right, #f5f3ff, #fce7f3); padding: 24px; border-radius: 16px; border: 1px solid #e5e7eb;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px;">
            <span style="color: #6b7280;">Subtotal</span>
            <span style="font-weight: 500; color: #111827;">${formatCurrency(invoice.subtotal, invoice.currency)}</span>
          </div>
          ${invoice.discountAmount > 0 ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px;">
            <span style="color: #6b7280;">Discount</span>
            <span style="font-weight: 500; color: #dc2626;">-${formatCurrency(invoice.discountAmount, invoice.currency)}</span>
          </div>
          ` : ''}
          ${invoice.taxAmount > 0 ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px;">
            <span style="color: #6b7280;">Tax</span>
            <span style="font-weight: 500; color: #111827;">${formatCurrency(invoice.taxAmount, invoice.currency)}</span>
          </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; padding-top: 16px; border-top: 2px solid #e5e7eb;">
            <span style="font-size: 20px; font-weight: bold; color: #111827;">Total</span>
            <span style="font-size: 20px; font-weight: bold; background: linear-gradient(to right, #9333ea, #db2777); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${formatCurrency(invoice.total, invoice.currency)}</span>
          </div>
        </div>
      </div>

      <!-- Notes -->
      ${invoice.notes || invoice.terms ? `
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px;">
        ${invoice.notes ? `
        <div style="background: linear-gradient(to right, #fef3c7, #ffedd5); padding: 24px; border-radius: 16px; border-left: 4px solid #eab308;">
          <h4 style="margin: 0 0 12px 0; font-size: 16px; font-weight: bold; color: #854d0e; display: flex; align-items: center;">
            <svg style="width: 20px; height: 20px; margin-right: 8px;" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
            Notes
          </h4>
          <p style="margin: 0; font-size: 14px; color: #713f12; line-height: 1.6;">${invoice.notes}</p>
        </div>
        ` : ''}
        ${invoice.terms ? `
        <div style="background: linear-gradient(to right, #dbeafe, #e0e7ff); padding: 24px; border-radius: 16px; border-left: 4px solid #3b82f6;">
          <h4 style="margin: 0 0 12px 0; font-size: 16px; font-weight: bold; color: #1e40af; display: flex; align-items: center;">
            <svg style="width: 20px; height: 20px; margin-right: 8px;" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4 4a2 2 0 002-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" /></svg>
            Terms & Conditions
          </h4>
          <p style="margin: 0; font-size: 14px; color: #3730a3; line-height: 1.6;">${invoice.terms}</p>
        </div>
        ` : ''}
      </div>
      ` : ''}
    </div>
    `;
  },
};

export const generateInvoicePDF = async (invoice: Invoice, elementId: string): Promise<void> => {
  try {
    // Validate invoice data
    if (!invoice || !invoice.businessProfile) {
      throw new Error('Invalid invoice data: missing business profile');
    }

    // Use the selected template or default to modern
    const templateId = invoice.template || 'modern';
    const templateFn = templates[templateId] || templates.modern;
    
    // Generate template HTML
    let templateHTML = templateFn(invoice);
    
    // Pre-process the template HTML to remove any problematic color functions
    templateHTML = templateHTML
      .replace(/style="([^"]*?)lab\([^)]+\)/gi, 'style="$1"')
      .replace(/style="([^"]*?)lch\([^)]+\)/gi, 'style="$1"')
      .replace(/style="([^"]*?)oklch\([^)]+\)/gi, 'style="$1"')
      .replace(/style="([^"]*?)p3\([^)]+\)/gi, 'style="$1"')
      .replace(/style="([^"]*?)color\([^)]+\)/gi, 'style="$1"')
      .replace(/style="([^"]*?)oklab\([^)]+\)/gi, 'style="$1"')
      .replace(/style="([^"]*?)hwb\([^)]+\)/gi, 'style="$1"')
      .replace(/style="([^"]*?)light-dark\([^)]+\)/gi, 'style="$1"');

    // Create a hidden container for PDF generation
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.zIndex = '-999999';
    container.style.width = '794px';
    container.style.minHeight = '1123px';
    container.style.backgroundColor = '#ffffff';
    container.style.colorScheme = 'light only';
    container.style.overflow = 'visible';
    
    // Create inner HTML container
    const innerContainer = document.createElement('div');
    innerContainer.innerHTML = templateHTML;
    innerContainer.style.width = '794px';
    innerContainer.style.backgroundColor = '#ffffff';
    
    // Add inline styles to override any Tailwind classes
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      * {
        all: initial !important;
        font-family: system-ui, -apple-system, sans-serif !important;
        color: #111827 !important;
        box-sizing: border-box !important;
      }
      
      body, html {
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        height: 100% !important;
      }
      
      div {
        box-sizing: border-box !important;
      }
      
      table {
        border-collapse: collapse !important;
      }
      
      td, th {
        box-sizing: border-box !important;
      }
    `;
    innerContainer.appendChild(styleElement);
    container.appendChild(innerContainer);
    
    document.body.appendChild(container);

    let canvas: HTMLCanvasElement | null = null;
    try {
      // Wait for any images to load
      const images = innerContainer.querySelectorAll('img');
      await Promise.all(Array.from(images).map(img => {
        return new Promise<void>((resolve) => {
          if (img.complete) {
            resolve();
          } else {
            img.onload = () => resolve();
            img.onerror = () => {
              // Replace broken images with a placeholder
              img.style.display = 'none';
              const placeholder = document.createElement('div');
              placeholder.style.cssText = 'display: inline-block; width: 48px; height: 48px; background: #e5e7eb; border-radius: 4px;';
              if (img.parentNode) {
                img.parentNode.insertBefore(placeholder, img);
              }
              img.remove();
              resolve();
            };
            // Set crossOrigin to handle CORS
            if (img.src.startsWith('http')) {
              img.crossOrigin = 'anonymous';
            }
          }
        });
      }));

      // Render with html2canvas with simplified options
      canvas = await html2canvas(innerContainer, {
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        imageTimeout: 10000,
        ignoreElements: (element) => element.tagName === 'svg' || element.tagName === 'STYLE',
        windowWidth: 794,
        scrollX: 0,
        scrollY: 0,
      });

      // Convert canvas to image data
      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      // Use pdf-lib to create PDF
      const pdfDoc = await PDFDocument.create();
      
      // A4 size in points: 595 x 842
      const pageWidth = 595;
      const pageHeight = 842;

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
      const renderWidth = imgWidth * ratio;
      const renderHeight = imgHeight * ratio;

      const marginX = (pageWidth - renderWidth) / 2;
      const marginY = (pageHeight - renderHeight) / 2;

      // If image is larger than a single page height, split across pages
      if (renderHeight <= pageHeight) {
        const page = pdfDoc.addPage([pageWidth, pageHeight]);
        const pngImage = await pdfDoc.embedJpg(imgData);
        page.drawImage(pngImage, {
          x: marginX,
          y: marginY,
          width: renderWidth,
          height: renderHeight,
        });
      } else {
        // Add as multiple pages
        const pageImgHeightPx = Math.floor(pageHeight / ratio);
        let sliceY = 0;

        while (sliceY < imgHeight) {
          const tmpCanvas = document.createElement('canvas');
          tmpCanvas.width = imgWidth;
          tmpCanvas.height = Math.min(pageImgHeightPx, imgHeight - sliceY);
          const ctx = tmpCanvas.getContext('2d');
          if (!ctx) break;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, tmpCanvas.width, tmpCanvas.height);
          ctx.drawImage(canvas, 0, sliceY, imgWidth, tmpCanvas.height, 0, 0, imgWidth, tmpCanvas.height);
          const sliceData = tmpCanvas.toDataURL('image/jpeg', 0.95);
          const sliceRenderHeight = tmpCanvas.height * ratio;
          
          const page = pdfDoc.addPage([pageWidth, pageHeight]);
          const jpgImage = await pdfDoc.embedJpg(sliceData);
          page.drawImage(jpgImage, {
            x: marginX,
            y: marginY,
            width: renderWidth,
            height: sliceRenderHeight,
          });
          
          sliceY += tmpCanvas.height;
        }
      }

      const pdfBytes = await pdfDoc.save();
      
      // Create blob and download
      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const fileName = `invoice-${invoice.invoiceNumber}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

    } catch (error) {
      throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      // Ensure container is removed
      if (container && container.parentNode) {
        container.parentNode.removeChild(container);
      }
    }
  } catch (error) {
    throw error;
  }
};
