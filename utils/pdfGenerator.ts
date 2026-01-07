import html2canvas from 'html2canvas';
import { Invoice } from '../types';
import { format } from 'date-fns';

// Helper to convert any color string to a safe RGB format
const toSafeColor = (color: string): string => {
  if (!color || color === 'transparent' || color === 'rgba(0, 0, 0, 0)') {
    return 'transparent';
  }
  // If already in rgb/rgba format, return as-is
  if (color.startsWith('rgb')) {
    return color;
  }
  // If it's a hex color, return as-is (jsPDF can handle hex)
  if (color.startsWith('#')) {
    return color;
  }
  // For named colors or other formats, let the browser resolve them
  return color;
};

// More aggressive color cleanup for the clone
const cleanupColors = (root: HTMLElement) => {
  const allElements = [root, ...Array.from(root.querySelectorAll('*'))] as HTMLElement[];
  
  for (const el of allElements) {
    const style = el.style;
    
    // List of color-related properties to clean
    const colorProps = [
      'color', 'backgroundColor', 'background', 'borderColor', 
      'borderTopColor', 'borderRightColor', 'borderBottomColor', 'borderLeftColor',
      'outlineColor', 'textDecorationColor', 'columnRuleColor',
      'webkitTextFillColor', 'webkitBorderAfterColor', 'webkitBorderBeforeColor',
      'webkitBorderStartColor', 'boxShadow', 'textShadow'
    ];
    
    for (const prop of colorProps) {
      const value = style.getPropertyValue(prop);
      if (value && (value.includes('lab(') || value.includes('oklab(') || 
            value.includes('lch(') || value.includes('oklch(') ||
            value.includes('color(') || value.includes('color-mix('))) {
        // Set to a safe default
        if (prop === 'boxShadow' || prop === 'textShadow') {
          style.setProperty(prop, 'none', 'important');
        } else if (prop === 'background') {
          style.setProperty(prop, 'transparent', 'important');
        } else {
          style.setProperty(prop, '', 'important');
        }
      }
    }
    
    // Remove any style attributes that might contain problematic colors
    if (el.hasAttribute('style')) {
      let styleAttr = el.getAttribute('style') || '';
      if (styleAttr.includes('lab(') || styleAttr.includes('oklab(') ||
          styleAttr.includes('lch(') || styleAttr.includes('oklch(')) {
        // Strip the problematic style properties
        styleAttr = styleAttr.replace(/[^;]+lab\([^)]+\)[^;]*;?/g, '');
        styleAttr = styleAttr.replace(/[^;]+oklab\([^)]+\)[^;]*;?/g, '');
        styleAttr = styleAttr.replace(/[^;]+lch\([^)]+\)[^;]*;?/g, '');
        styleAttr = styleAttr.replace(/[^;]+oklch\([^)]+\)[^;]*;?/g, '');
        styleAttr = styleAttr.replace(/[^;]+color\([^)]+\)[^;]*;?/g, '');
        el.setAttribute('style', styleAttr);
      }
    }
  }
};

// Copy only color-related computed styles from source -> target to avoid
// newer color functions like lab() leaking into canvas rendering.
const copySafeComputedColors = (sourceRoot: HTMLElement, targetRoot: HTMLElement) => {
  const srcNodes = [sourceRoot, ...Array.from(sourceRoot.querySelectorAll('*'))] as HTMLElement[];
  const tgtNodes = [targetRoot, ...Array.from(targetRoot.querySelectorAll('*'))] as HTMLElement[];

  for (let i = 0; i < srcNodes.length && i < tgtNodes.length; i++) {
    try {
      const src = srcNodes[i];
      const tgt = tgtNodes[i];
      const comp = window.getComputedStyle(src);

      // Set only the common color-related properties (these are returned
      // as resolved rgb/rgba values in modern browsers, avoiding lab()).
      tgt.style.color = comp.color || '';
      tgt.style.backgroundColor = comp.backgroundColor || 'transparent';
      tgt.style.borderTopColor = comp.borderTopColor || '';
      tgt.style.borderRightColor = comp.borderRightColor || '';
      tgt.style.borderBottomColor = comp.borderBottomColor || '';
      tgt.style.borderLeftColor = comp.borderLeftColor || '';
      tgt.style.outlineColor = comp.outlineColor || '';
      tgt.style.boxShadow = 'none';
      tgt.style.backgroundImage = 'none';

      // SVG fills/strokes
      if (tgt instanceof SVGElement) {
        const fill = comp.fill || comp.color || '';
        const stroke = comp.stroke || '';
        if (fill) tgt.setAttribute('fill', fill);
        if (stroke) tgt.setAttribute('stroke', stroke);
      }
    } catch (e) {
      // Best-effort: skip nodes that throw for any reason
      // (cross-origin images, etc.).
      // eslint-disable-next-line no-console
      console.debug('copySafeComputedColors skip node', e);
    }
  }
};

export const generateInvoicePDF = async (invoice: Invoice, elementId: string): Promise<void> => {
  const element = document.getElementById(elementId);

  if (!element) {
    throw new Error('Invoice element not found');
  }

  // Wait briefly for fonts and styles to settle
  await new Promise(resolve => setTimeout(resolve, 500));

  // Create off-screen wrapper with forced sRGB color space
  const wrapper = document.createElement('div');
  const wrapperStyle = wrapper.style as unknown as Record<string, string>;
  wrapperStyle.colorSpace = 'sRGB';
  wrapperStyle.webkitColorSpace = 'sRGB';
  wrapperStyle.forcedColorAdjust = 'none';
  wrapperStyle.position = 'fixed';
  wrapperStyle.left = '-9999px';
  wrapperStyle.top = '-9999px';
  wrapperStyle.zIndex = '-999999';
  wrapperStyle.backgroundColor = '#ffffff';

  const clone = element.cloneNode(true) as HTMLElement;
  
  // First, aggressively clean all colors from the clone
  cleanupColors(clone);
  
  wrapper.appendChild(clone);
  document.body.appendChild(wrapper);

  try {
    // Then copy computed safe colors on top
    copySafeComputedColors(element as HTMLElement, clone);

    // Force sRGB on wrapper for html2canvas
    const wrapperStyle = wrapper.style as unknown as Record<string, string>;
    const cloneStyle = clone.style as unknown as Record<string, string>;
    wrapperStyle.colorSpace = 'sRGB';
    cloneStyle.colorSpace = 'sRGB';

    // Render with html2canvas
    const canvas = await html2canvas(wrapper, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false,
      imageTimeout: 30000,
    });

    // Convert canvas to image data
    const imgData = canvas.toDataURL('image/png');

    // Dynamically import jspdf to avoid SSR issues and keep bundle small
    const { jsPDF } = await import('jspdf');

    // Create PDF and fit the canvas image into A4 while preserving aspect ratio
    const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
    const renderWidth = imgWidth * ratio;
    const renderHeight = imgHeight * ratio;

    const marginX = (pageWidth - renderWidth) / 2;
    const marginY = (pageHeight - renderHeight) / 2;

    // If image is larger than a single page height, split across pages
    if (renderHeight <= pageHeight) {
      pdf.addImage(imgData, 'PNG', marginX, marginY, renderWidth, renderHeight);
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
        ctx.drawImage(canvas, 0, sliceY, imgWidth, tmpCanvas.height, 0, 0, imgWidth, tmpCanvas.height);
        const sliceData = tmpCanvas.toDataURL('image/png');
        const sliceRenderHeight = tmpCanvas.height * ratio;
        pdf.addImage(sliceData, 'PNG', marginX, marginY, renderWidth, sliceRenderHeight);
        sliceY += tmpCanvas.height;
        if (sliceY < imgHeight) pdf.addPage();
      }
    }

    const fileName = `invoice-${invoice.invoiceNumber}-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
    pdf.save(fileName);

  } catch (error) {
    throw new Error(`Failed to export invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    // Ensure wrapper is removed
    if (wrapper.parentNode) {
      wrapper.parentNode.removeChild(wrapper);
    }
  }
};
