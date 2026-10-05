// WhatsApp helper utilities for Caturra Specialty Coffee
export const STORE_WHATSAPP_NUMBER = '201000000000';

export const formatWhatsAppNumber = (phone) => {
  if (!phone) return '201000000000';
  let cleaned = String(phone).replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0020')) cleaned = cleaned.substring(2);
  if (cleaned.startsWith('01')) cleaned = '20' + cleaned;
  if (!cleaned.startsWith('20') && (cleaned.length === 10 || cleaned.length === 11) && cleaned.startsWith('1')) cleaned = '20' + cleaned;
  return cleaned;
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

  const paymentLabel = invoice.paymentMethod === 'cash' 
    ? 'الدفع عند الاستلام (كاش)' 
    : 'إنستاباي / فيزا';

  const message = 
`*طلب جديد من متجر كاتورا للقهوة المختصة 🌿☕*
━━━━━━━━━━━━━━━━━━━━
📋 *رقم الطلب / الفاتورة:* ${invoice.invoiceNumber}
📅 *التاريخ:* ${invoice.date || 'الآن'}
👤 *اسم العميل:* ${invoice.customerName}
📱 *رقم الموبايل:* ${invoice.customerPhone}
📍 *العنوان:* ${invoice.customerAddress || 'القاهرة'}
💳 *طريقة الدفع المفضلة:* ${paymentLabel}
━━━━━━━━━━━━━━━━━━━━
🛒 *قائمة الأصناف المطلوبة:*
${itemsDetails}
━━━━━━━━━━━━━━━━━━━━
💰 *إجمالي الفاتورة:* ${invoice.total} ج.م
⏳ *حالة الطلب:* طلب معلق بانتظار التأكيد والتجهيز

برجاء تأكيد استلام الطلب وتحديد موعد الشحن والتوصيل. شكراً لكم!`;

  const cleanNum = formatWhatsAppNumber(storeNumber);
  return cleanNum 
    ? `https://wa.me/${cleanNum}?text=${encodeURIComponent(message)}`
    : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
};
