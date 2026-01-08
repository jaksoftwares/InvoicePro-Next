import { PDFDocument } from 'pdf-lib';
import { Invoice } from '../types';
import { format } from 'date-fns';

const formatCurrency = (amount: number, currency: string) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
};

// Template generators with simplified inline styles (same as client-side)
const templates: Record<string, (invoice: Invoice) => string> = {
  modern: (invoice) => `
    <div style="font-family: system-ui, -apple-system, sans-serif; width: 794px; min-height: 1123px; padding: 32px; background: white; box-sizing: border-box;">
      <div style="background: linear-gradient(to right, #2563eb, #4338ca); color: white; padding: 24px; margin: -32px -32px 32px -32px; border-radius: 8px 8px 0 0;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div style="display: flex; align-items: center; gap: 16px;">
            ${invoice.businessProfile.logo ? `<img src="${invoice.businessProfile.logo}" alt="Logo" style="height: 48px; width: 48px; object-fit: contain; background: white; padding: 8px; border-radius: 8px;">` : ''}
            <div>
              <h1 style="margin: 0; font-size: 24px; font-weight: bold;">${invoice.businessProfile.name}</h1>
              <p style="margin: 4px 0 0 0; font-size: 14px; color: #bfdbfe;">${invoice.businessProfile.email}</p>
            </div>
          </div>
          <div style="text-align: right;">
            <h2 style="margin: 0; font-size: 32px; font-weight: bold;">INVOICE</h2>
            <p style="margin: 4px 0 0 0; font-size: 18px; color: #bfdbfe;">#${invoice.invoiceNumber}</p>
          </div>
        </div>
      </div>

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

      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 32px; margin-bottom: 32px;">
        <div>
          <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #111827; border-bottom: 2px solid #2563eb; padding-bottom: 8px;">From</h3>
          <div style="font-size: 14px; color: #374151; line-height: 1.6;">
            <p style="margin: 0; font-weight: 600; color: #111827;">${invoice.businessProfile.name}</p>
            <p style="margin: 0;">${invoice.businessProfile.address}</p>
            <p style="margin: 0;">${invoice.businessProfile.city}, ${invoice.businessProfile.state} ${invoice.businessProfile.zipCode}</p>
            <p style="margin: 0;">${invoice.businessProfile.country}</p>
            <p style="margin: 0; color: #2563eb;">${invoice.businessProfile.email}</p>
            <p style="margin: 0;">${invoice.businessProfile.phone}</p>
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
  `,

  // Add more templates as needed (minimal, classic, professional, corporate, elegant, creative)
  // For brevity, using modern template as fallback
  minimal: (invoice) => templates.modern(invoice),
  classic: (invoice) => templates.modern(invoice),
  professional: (invoice) => templates.modern(invoice),
  corporate: (invoice) => templates.modern(invoice),
  elegant: (invoice) => templates.modern(invoice),
  creative: (invoice) => templates.modern(invoice),
};

// Since we can't use html2canvas on the server, we'll create a simple PDF
// using pdf-lib with basic text rendering
export async function generateInvoicePDFBuffer(invoice: Invoice): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 size in points
  
  const { width, height } = page.getSize();
  
  // Set up fonts
  const helveticaFont = await pdfDoc.embedFont('Helvetica');
  const helveticaBold = await pdfDoc.embedFont('Helvetica-Bold');
  
  let y = height - 50;
  
  // Header
  page.drawRectangle({
    x: 50,
    y: y - 100,
    width: 495,
    height: 80,
    color: 0x2563eb as any, // Blue
  });
  
  page.drawText(invoice.businessProfile.name, {
    x: 60,
    y: y - 40,
    size: 20,
    font: helveticaBold,
    color: 0xffffff as any,
  });
  
  page.drawText(`Invoice #${invoice.invoiceNumber}`, {
    x: 450,
    y: y - 40,
    size: 16,
    font: helveticaBold,
    color: 0xffffff as any,
  });
  
  y -= 130;
  
  // Invoice details
  const details = [
    { label: 'Issue Date', value: format(new Date(invoice.issueDate), 'MMM dd, yyyy') },
    { label: 'Due Date', value: format(new Date(invoice.dueDate), 'MMM dd, yyyy') },
    { label: 'Total', value: formatCurrency(invoice.total, invoice.currency) },
  ];
  
  details.forEach((detail, i) => {
    const x = 50 + (i * 165);
    page.drawRectangle({
      x,
      y: y - 50,
      width: 155,
      height: 40,
      color: 0xf3f4f6 as any,
    });
    page.drawText(detail.label, {
      x: x + 10,
      y: y - 20,
      size: 8,
      font: helveticaFont,
      color: 0x6b7280 as any,
    });
    page.drawText(detail.value, {
      x: x + 10,
      y: y - 35,
      size: 12,
      font: helveticaBold,
      color: 0x111827 as any,
    });
  });
  
  y -= 80;
  
  // From/To addresses
  page.drawText('From:', {
    x: 50,
    y,
    size: 10,
    font: helveticaBold,
    color: 0x111827 as any,
  });
  y -= 15;
  page.drawText(invoice.businessProfile.name, {
    x: 50,
    y,
    size: 10,
    font: helveticaFont,
    color: 0x111827 as any,
  });
  y -= 12;
  page.drawText(`${invoice.businessProfile.address}`, {
    x: 50,
    y,
    size: 9,
    font: helveticaFont,
    color: 0x6b7280 as any,
  });
  y -= 12;
  page.drawText(`${invoice.businessProfile.city}, ${invoice.businessProfile.state} ${invoice.businessProfile.zipCode}`, {
    x: 50,
    y,
    size: 9,
    font: helveticaFont,
    color: 0x6b7280 as any,
  });
  y -= 12;
  page.drawText(invoice.businessProfile.email, {
    x: 50,
    y,
    size: 9,
    font: helveticaFont,
    color: 0x2563eb as any,
  });
  
  y -= 30;
  
  page.drawText('Bill To:', {
    x: 50,
    y,
    size: 10,
    font: helveticaBold,
    color: 0x111827 as any,
  });
  y -= 15;
  page.drawText(invoice.clientName, {
    x: 50,
    y,
    size: 10,
    font: helveticaFont,
    color: 0x111827 as any,
  });
  y -= 12;
  page.drawText(invoice.clientAddress, {
    x: 50,
    y,
    size: 9,
    font: helveticaFont,
    color: 0x6b7280 as any,
  });
  y -= 12;
  page.drawText(`${invoice.clientCity}, ${invoice.clientState} ${invoice.clientZipCode}`, {
    x: 50,
    y,
    size: 9,
    font: helveticaFont,
    color: 0x6b7280 as any,
  });
  y -= 12;
  page.drawText(invoice.clientEmail, {
    x: 50,
    y,
    size: 9,
    font: helveticaFont,
    color: 0x4f46e5 as any,
  });
  
  y -= 40;
  
  // Items table header
  page.drawRectangle({
    x: 50,
    y: y - 30,
    width: 495,
    height: 25,
    color: 0x2563eb as any,
  });
  page.drawText('Description', {
    x: 55,
    y: y - 18,
    size: 9,
    font: helveticaBold,
    color: 0xffffff as any,
  });
  page.drawText('Qty', {
    x: 350,
    y: y - 18,
    size: 9,
    font: helveticaBold,
    color: 0xffffff as any,
  });
  page.drawText('Rate', {
    x: 420,
    y: y - 18,
    size: 9,
    font: helveticaBold,
    color: 0xffffff as any,
  });
  page.drawText('Amount', {
    x: 490,
    y: y - 18,
    size: 9,
    font: helveticaBold,
    color: 0xffffff as any,
  });
  
  y -= 30;
  
  // Items
  invoice.items.forEach((item, index) => {
    const bgColor = index % 2 === 0 ? 0xffffff as any : 0xf9fafb as any;
    if (bgColor !== 0xffffff) {
      page.drawRectangle({
        x: 50,
        y: y - 25,
        width: 495,
        height: 25,
        color: bgColor,
      });
    }
    page.drawText(item.description.substring(0, 35), {
      x: 55,
      y: y - 18,
      size: 9,
      font: helveticaFont,
      color: 0x111827 as any,
    });
    page.drawText(item.quantity.toString(), {
      x: 360,
      y: y - 18,
      size: 9,
      font: helveticaFont,
      color: 0x111827 as any,
    });
    page.drawText(formatCurrency(item.rate, invoice.currency), {
      x: 420,
      y: y - 18,
      size: 9,
      font: helveticaFont,
      color: 0x111827 as any,
    });
    page.drawText(formatCurrency(item.amount, invoice.currency), {
      x: 485,
      y: y - 18,
      size: 9,
      font: helveticaFont,
      color: 0x111827 as any,
    });
    y -= 25;
  });
  
  y -= 30;
  
  // Totals
  const totalsX = 350;
  page.drawText('Subtotal:', {
    x: totalsX,
    y,
    size: 10,
    font: helveticaFont,
    color: 0x6b7280 as any,
  });
  page.drawText(formatCurrency(invoice.subtotal, invoice.currency), {
    x: 480,
    y,
    size: 10,
    font: helveticaFont,
    color: 0x111827 as any,
  });
  y -= 15;
  
  if (invoice.discountAmount > 0) {
    page.drawText(`Discount (${invoice.discountRate}%):`, {
      x: totalsX,
      y,
      size: 10,
      font: helveticaFont,
      color: 0x6b7280 as any,
    });
    page.drawText(`-${formatCurrency(invoice.discountAmount, invoice.currency)}`, {
      x: 480,
      y,
      size: 10,
      font: helveticaFont,
      color: 0xdc2626 as any,
    });
    y -= 15;
  }
  
  if (invoice.taxAmount > 0) {
    page.drawText(`Tax (${invoice.taxRate}%):`, {
      x: totalsX,
      y,
      size: 10,
      font: helveticaFont,
      color: 0x6b7280 as any,
    });
    page.drawText(formatCurrency(invoice.taxAmount, invoice.currency), {
      x: 480,
      y,
      size: 10,
      font: helveticaFont,
      color: 0x111827 as any,
    });
    y -= 15;
  }
  
  page.drawText('Total:', {
    x: totalsX,
    y,
    size: 14,
    font: helveticaBold,
    color: 0x111827 as any,
  });
  page.drawText(formatCurrency(invoice.total, invoice.currency), {
    x: 480,
    y,
    size: 14,
    font: helveticaBold,
    color: 0x2563eb as any,
  });
  
  return await pdfDoc.save();
}
