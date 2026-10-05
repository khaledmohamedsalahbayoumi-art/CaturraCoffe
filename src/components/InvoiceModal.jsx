import React, { useRef } from 'react';
import { useApp } from '../context/AppContext';
import { InvoiceQrCode } from './InvoiceQrCode';
import { 
  Printer, 
  Share2, 
  X, 
  CheckCircle, 
  AlertCircle, 
  MessageSquare, 
  Coffee,
  Calendar,
  User,
  CreditCard,
  DollarSign
} from 'lucide-react';

export const InvoiceModal = () => {
  const { isInvoiceModalOpen, activeInvoiceForModal, closeInvoiceModal, contactInfo } = useApp();
  const printAreaRef = useRef(null);

  if (!isInvoiceModalOpen || !activeInvoiceForModal) return null;

  const inv = activeInvoiceForModal;

  // Handle direct print
  const handlePrint = () => {
    window.print();
  };

  // WhatsApp share link generator (Egyptian Prefix +20)
  const handleWhatsAppShare = () => {
    let phone = inv.customerPhone ? inv.customerPhone.replace(/[^0-9]/g, '') : '';
    if (phone.startsWith('0')) {
      phone = '20' + phone.substring(1);
    } else if (phone && !phone.startsWith('20')) {
      phone = '20' + phone;
    }

    const itemsList = inv.items.map(it => `• ${it.name} (${it.qty}x) = ${it.total || (it.price * it.qty)} ج.م`).join('\n');
    const brandTitle = contactInfo?.brandNameAr || 'كاتورا للقهوة المختصة';
    const message = 
`☕ *فاتورة شراء من ${brandTitle}* 🌿
━━━━━━━━━━━━━━━━━━━━
📄 *رقم الفاتورة:* ${inv.invoiceNumber}
📅 *التاريخ:* ${inv.date}
👤 *العميل:* ${inv.customerName}
📱 *الموبايل:* ${inv.customerPhone || 'غير مسجل'}
━━━━━━━━━━━━━━━━━━━━
🛍️ *تفاصيل المشتريات:*
${itemsList}
━━━━━━━━━━━━━━━━━━━━
💰 *الإجمالي:* ${inv.total} ج.م
💵 *المدفوع:* ${inv.paidAmount} ج.م
${inv.remainingDebt > 0 ? `⚠️ *المتبقي (آجل / على الحساب):* ${inv.remainingDebt} ج.م\n` : '✅ *حالة السداد: مدفوع بالكامل*\n'}
نشكرك لاختيارك قهوة كاتورا المختصة! يسعدنا دائماً خدمتك. ✨`;

    const encodedMsg = encodeURIComponent(message);
    const waUrl = phone ? `https://wa.me/${phone}?text=${encodedMsg}` : `https://api.whatsapp.com/send?text=${encodedMsg}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="modal-overlay" onClick={closeInvoiceModal}>
      <div 
        className="modal-content invoice-modal-container"
        style={{
          maxWidth: '580px',
          maxHeight: '92vh',
          height: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '0',
          overflow: 'hidden',
          borderRadius: '20px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Actions Toolbar (Hidden on print) */}
        <div className="no-print" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '14px 20px',
          background: 'var(--mint-50)',
          borderBottom: '1px solid var(--border-mint)',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: '800', color: 'var(--mint-900)', fontSize: '1rem' }}>
              معاينة الفاتورة #{inv.invoiceNumber}
            </span>
            <span
              className={`badge ${
                inv.status === 'pending'
                  ? 'badge-warning'
                  : inv.status === 'paid'
                  ? 'badge-mint'
                  : inv.status === 'partial'
                  ? 'badge-warning'
                  : 'badge-danger'
              }`}
              style={{
                background: inv.status === 'pending' ? '#fef3c7' : undefined,
                color: inv.status === 'pending' ? '#92400e' : undefined,
                border: inv.status === 'pending' ? '1px solid #fde68a' : undefined,
                fontWeight: '800'
              }}
            >
              {inv.status === 'pending'
                ? 'طلب معلق (أونلاين)'
                : inv.status === 'paid'
                ? 'مدفوعة بالكامل'
                : inv.status === 'partial'
                ? 'مدفوعة جزئياً'
                : inv.status === 'cancelled'
                ? 'ملغية'
                : 'آجلة غير مسددة'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              onClick={handleWhatsAppShare} 
              className="btn btn-outline"
              style={{ padding: '6px 12px', fontSize: '0.85rem', color: '#16a34a', borderColor: '#86efac' }}
              title="إرسال الفاتورة عبر واتساب"
            >
              <MessageSquare size={16} />
              واتساب
            </button>
            <button 
              onClick={handlePrint} 
              className="btn btn-primary"
              style={{ padding: '6px 14px', fontSize: '0.85rem' }}
              title="طباعة إيصال الفاتورة"
            >
              <Printer size={16} />
              طباعة
            </button>
            <button 
              onClick={closeInvoiceModal} 
              className="btn-icon" 
              style={{ width: '32px', height: '32px' }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Receipt Paper (Scrollable) */}
        <div 
          ref={printAreaRef}
          className="invoice-receipt print-only-container"
          style={{
            padding: '24px 24px 32px',
            background: '#ffffff',
            color: '#1e293b',
            fontFamily: "'Cairo', sans-serif",
            overflowY: 'auto',
            flex: 1
          }}
        >
          {/* Header with Caturra Brand Logo */}
          <div style={{ textAlign: 'center', marginBottom: '20px', borderBottom: '2px dashed var(--border-light)', paddingBottom: '16px' }}>
            <img 
              src="/caturra_logo.jpg" 
              alt="Caturra Coffee Logo" 
              style={{ 
                width: '76px', 
                height: '76px', 
                borderRadius: '50%', 
                objectFit: 'cover', 
                margin: '0 auto 8px',
                border: '2px solid var(--mint-500)',
                boxShadow: '0 2px 8px rgba(11,128,79,0.2)'
              }} 
            />
            <h2 style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--mint-900)', margin: '0' }}>
              {contactInfo?.brandNameAr || 'كاتورا للقهوة المختصة'}
            </h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--mint-700)', fontWeight: '700', marginTop: '2px' }}>
              {contactInfo?.brandNameEn || 'CATURRA SPECIALTY COFFEE ROASTERS'}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              سجل تجاري: {contactInfo?.commercialRegister || '148920'} | بطاقة ضريبية: {contactInfo?.taxNumber || '582-934-211'} | {contactInfo?.address || 'القاهرة - مصر'}
            </div>
          </div>

          {/* Invoice Meta Grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 1fr', 
            gap: '8px', 
            fontSize: '0.85rem', 
            background: 'var(--mint-50)', 
            padding: '12px 14px', 
            borderRadius: '10px', 
            marginBottom: '18px',
            border: '1px solid var(--border-mint)'
          }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>رقم الفاتورة: </span>
              <strong style={{ color: 'var(--mint-900)' }}>{inv.invoiceNumber}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>التاريخ: </span>
              <strong>{inv.date}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>العميل: </span>
              <strong>{inv.customerName}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>الموبايل: </span>
              <span dir="ltr"><strong>{inv.customerPhone || 'غير مسجل'}</strong></span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>طريقة الدفع: </span>
              <strong>
                {inv.paymentMethod === 'cash' ? 'نقدي (Cash)' : inv.paymentMethod === 'card' ? 'فيزا / ميزة (Card)' : inv.paymentMethod === 'instapay' ? 'إنستاباي (InstaPay)' : 'آجل (على الحساب)'}
              </strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>الكاشير: </span>
              <span>{inv.cashierName || 'نظام كاتورا'}</span>
            </div>
            {inv.customerAddress && (
              <div style={{ gridColumn: 'span 2', marginTop: '2px', borderTop: '1px dashed var(--border-mint)', paddingTop: '6px' }}>
                <span style={{ color: 'var(--text-muted)' }}>عنوان التوصيل: </span>
                <strong style={{ color: 'var(--mint-800)' }}>{inv.customerAddress}</strong>
              </div>
            )}
          </div>

          {/* Items Table */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', marginBottom: '18px' }}>
            <thead>
              <tr style={{ borderBottom: '1.5px solid var(--border-light)', color: 'var(--text-secondary)' }}>
                <th style={{ textAlign: 'right', padding: '8px 4px', fontWeight: '700' }}>الصنف</th>
                <th style={{ textAlign: 'center', padding: '8px 4px', fontWeight: '700' }}>الكمية</th>
                <th style={{ textAlign: 'center', padding: '8px 4px', fontWeight: '700' }}>السعر</th>
                <th style={{ textAlign: 'left', padding: '8px 4px', fontWeight: '700' }}>المجموع</th>
              </tr>
            </thead>
            <tbody>
              {inv.items.map((item, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '9px 4px', fontWeight: '600' }}>
                    <div>{item.name}</div>
                    {item.weightGram ? (
                      <div style={{ fontSize: '0.74rem', color: 'var(--mint-700)', fontWeight: '500' }}>
                        الوزن: <strong>{item.weightLabel || `${item.weightGram} جرام`}</strong>
                        {item.grind ? ` • طحن: ${item.grind}` : ''}
                      </div>
                    ) : null}
                  </td>
                  <td style={{ textAlign: 'center', padding: '9px 4px' }}>
                    {item.qty} {item.unitType === 'weight' ? 'عبوة' : 'ق'}
                  </td>
                  <td style={{ textAlign: 'center', padding: '9px 4px' }}>
                    {item.price} ج.م
                  </td>
                  <td style={{ textAlign: 'left', padding: '9px 4px', fontWeight: '700', color: 'var(--mint-800)' }}>
                    {item.total || (item.price * item.qty)} ج.م
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Breakdown */}
          <div style={{ 
            borderTop: '2px dashed var(--border-light)', 
            paddingTop: '12px', 
            fontSize: '0.9rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>المجموع الفرعي:</span>
              <span>{inv.subtotal || inv.total} ج.م</span>
            </div>

            {inv.discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
                <span>الخصم الممنوح:</span>
                <span>-{inv.discount} ج.م</span>
              </div>
            )}

            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              fontSize: '1.2rem', 
              fontWeight: '900', 
              color: 'var(--mint-900)',
              background: 'var(--mint-50)',
              padding: '8px 12px',
              borderRadius: '8px',
              marginTop: '4px',
              border: '1px solid var(--border-mint)'
            }}>
              <span>الإجمالي الكلي:</span>
              <span>{inv.total} ج.م</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-main)', marginTop: '4px' }}>
              <span>المبلغ المدفوع:</span>
              <strong style={{ color: '#16a34a' }}>{inv.paidAmount} ج.م</strong>
            </div>

            {inv.status === 'pending' ? (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                color: '#92400e', 
                fontWeight: '700',
                background: '#fef3c7',
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #fde68a',
                marginTop: '6px'
              }}>
                <span>حالة التحصيل:</span>
                <span>بانتظار التأكيد والاستلام عند التوصيل</span>
              </div>
            ) : inv.remainingDebt > 0 ? (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                color: '#dc2626', 
                fontWeight: '700',
                background: '#fee2e2',
                padding: '8px 12px',
                borderRadius: '8px',
                marginTop: '6px'
              }}>
                <span>المتبقي (مديونية مسجلة على العميل):</span>
                <span>{inv.remainingDebt} ج.م</span>
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a', fontSize: '0.85rem', marginTop: '6px' }}>
                <span>حالة الحساب:</span>
                <span>مكتمل الدفع بالكامل ✓</span>
              </div>
            )}
          </div>

          {/* Dynamic Invoice QR Code & Verification */}
          <div style={{ 
            marginTop: '22px', 
            borderTop: '1px solid var(--border-light)', 
            paddingTop: '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px'
          }}>
            <InvoiceQrCode 
              invoice={inv} 
              contactInfo={contactInfo} 
              size={115} 
              showControls={true}
            />

            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              فاتورة إلكترونية معتمدة - جمهورية مصر العربية 🇪🇬
            </div>
            <div style={{ fontSize: '0.88rem', fontWeight: '800', color: 'var(--mint-700)', marginTop: '2px' }}>
              نتمنى لك تجربة تذوق استثنائية مع كاتورا ☕
            </div>
          </div>

          {/* Bottom Actions Helper (Hidden on print) */}
          <div className="no-print" style={{ display: 'flex', gap: '10px', marginTop: '22px' }}>
            <button
              onClick={closeInvoiceModal}
              className="btn btn-outline"
              style={{ flex: 1, padding: '10px', fontWeight: '700' }}
            >
              إغلاق النافذة
            </button>
            <button
              onClick={handlePrint}
              className="btn btn-primary"
              style={{ flex: 1, padding: '10px', fontWeight: '800' }}
            >
              <Printer size={16} />
              <span>طباعة الإيصال</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
