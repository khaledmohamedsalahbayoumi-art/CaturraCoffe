// WhatsApp helper utilities for Caturra Specialty Coffee
export const STORE_WHATSAPP_NUMBER = '201033144498';

export const formatWhatsAppNumber = (phone) => {
  if (!phone || phone === '01000000000' || phone === '201000000000') return '201033144498';
  let cleaned = String(phone).replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0020')) cleaned = cleaned.substring(2);
  if (cleaned.startsWith('01')) cleaned = '20' + cleaned;
  if (!cleaned.startsWith('20') && (cleaned.length === 10 || cleaned.length === 11) && cleaned.startsWith('1')) cleaned = '20' + cleaned;
  return cleaned || '201033144498';
};

export const generateWhatsAppOrderUrl = (invoice, storeNumber = STORE_WHATSAPP_NUMBER) => {
  const itemsDetails = (invoice.items || []).map((it, idx) => {
    const extraParts = [];
    if (it.weightLabel) extraParts.push(it.weightLabel);
    else if (it.weightGram) extraParts.push(`${it.weightGram}ج`);
    if (it.grind && it.grind !== 'حبوب كاملة') extraParts.push(`طحن: ${it.grind}`);
    const extraStr = extraParts.length > 0 ? ` (${extraParts.join(' - ')})` : '';
    return `${idx + 1}. *${it.name}*${extraStr}\n   الكمية: ${it.qty} × ${it.price} ج.م = ${it.total || (it.price * it.qty)} ج.م`;
  }).join('\n');

  let paymentLabel = 'الدفع عند الاستلام (كاش)';
  if (invoice.paymentMethod === 'instapay') {
    paymentLabel = 'إنستاباي (InstaPay)';
  } else if (invoice.paymentMethod === 'wallet') {
    paymentLabel = 'محفظة إلكترونية (فودافون كاش / كاش المحمول)';
  }

  let transferNoteStr = '';
  if (invoice.transferSenderPhone) {
    transferNoteStr += `\n📲 *رقم الموبايل المحول منه:* ${invoice.transferSenderPhone}`;
  }
  if (invoice.transferReceipt) {
    transferNoteStr += `\n📸 *إشعار التحويل:* تم إرفاق صورة الاسكرين شوت وتضمينها داخل ملف الفاتورة الرسمي.`;
  } else if (invoice.paymentMethod === 'instapay' || invoice.paymentMethod === 'wallet') {
    transferNoteStr += `\n📸 *مرفق:* تم إتمام التحويل المالي وسأرسل صورة إشعار التحويل الآن.`;
  }

  const baseOrigin = typeof window !== 'undefined' ? (window.location.origin || '') : '';
  const safeInvNum = invoice.invoiceNumber || 'INV-2026';
  const safeFileName = String(safeInvNum).replace(/[^a-zA-Z0-9_-]/g, '_');
  const invoiceImageUrl = `${baseOrigin}/invoices/${safeFileName}.jpg`;
  const onlineInvoiceUrl = `${baseOrigin}/?invoice=${safeInvNum}`;

  const message = 
`*طلب جديد من متجر كاتورا للقهوة المختصة 🌿☕*
--------------------------------
📋 *رقم الطلب / الفاتورة:* ${invoice.invoiceNumber}
📅 *التاريخ:* ${invoice.date || 'الآن'}
👤 *اسم العميل:* ${invoice.customerName}
📱 *رقم الموبايل:* ${invoice.customerPhone}
📍 *العنوان:* ${invoice.customerAddress || 'القاهرة'}
💳 *طريقة الدفع:* ${paymentLabel}${transferNoteStr}
--------------------------------
🛒 *قائمة الأصناف المطلوبة:*
${itemsDetails}
--------------------------------
💰 *إجمالي الفاتورة:* ${invoice.total} ج.م

🖼️ *رابط صورة الفاتورة الرسمية (JPG):*
${invoiceImageUrl}

🌐 *رابط تتبع الفاتورة وإشعار التحويل أونلاين:*
${onlineInvoiceUrl}
--------------------------------
📄 *ملف الفاتورة الرسمي (PDF):* تم استخراج ملف الفاتورة ويمكنك معاينته مباشرة عبر الروابط أعلاه
⏳ *حالة الطلب:* طلب مسجل بانتظار التأكيد والتجهيز

برجاء تأكيد استلام الطلب وتحديد موعد الشحن والتوصيل. شكراً لكم!`;

  const cleanNum = formatWhatsAppNumber(storeNumber);
  return cleanNum 
    ? `https://wa.me/${cleanNum}?text=${encodeURIComponent(message)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
};
