import QRCode from 'qrcode';

/**
 * Returns a direct tracking & verification URL for this invoice.
 */
export const getInvoiceTrackingUrl = (invoice) => {
  if (typeof window === 'undefined') return '';
  const origin = window.location.origin;
  const path = window.location.pathname;
  const invNumber = invoice?.invoiceNumber || invoice?.id || '';
  return `${origin}${path}?track=${encodeURIComponent(invNumber)}`;
};

/**
 * Returns structured Egyptian / Arab tax electronic invoice verification text.
 */
export const getInvoiceTaxPayload = (invoice, contactInfo) => {
  const seller = contactInfo?.brandNameAr || 'كاتورا للقهوة المختصة';
  const taxId = contactInfo?.taxNumber || '582-934-211';
  const cr = contactInfo?.commercialRegister || '148920';
  const timestamp = invoice?.date || new Date().toLocaleDateString('ar-EG');
  const total = Number(invoice?.total || 0).toFixed(2);
  const vat = (Number(invoice?.total || 0) * 0.14 / 1.14).toFixed(2); // 14% Egyptian VAT
  const paid = Number(invoice?.paidAmount || 0).toFixed(2);
  const remaining = Number(invoice?.remainingDebt || 0).toFixed(2);

  return [
    `فاتورة إلكترونية معتمدة - ${seller}`,
    `رقم الفاتورة: ${invoice?.invoiceNumber || 'N/A'}`,
    `التاريخ: ${timestamp}`,
    `س.ت: ${cr} | ب.ض: ${taxId}`,
    `العميل: ${invoice?.customerName || 'عميل نقدي'}`,
    `الإجمالي: ${total} ج.م (الضريبة 14%: ${vat} ج.م)`,
    `المدفوع: ${paid} ج.م | المتبقي: ${remaining} ج.م`,
    `كود التحقق الرقمي: CAT-${String(invoice?.id || invoice?.invoiceNumber || '').slice(-6).toUpperCase()}`
  ].join('\n');
};

/**
 * Generates high-resolution base64 PNG Data URL for a given text.
 */
export const generateInvoiceQrDataUrl = async (text, options = {}) => {
  if (!text) return '';
  try {
    return await QRCode.toDataURL(text, {
      width: options.width || 220,
      margin: options.margin !== undefined ? options.margin : 1,
      color: {
        dark: options.darkColor || '#000000',
        light: options.lightColor || '#ffffff',
      },
      errorCorrectionLevel: options.errorCorrectionLevel || 'M',
    });
  } catch (err) {
    console.error('Error generating QR code:', err);
    return '';
  }
};
