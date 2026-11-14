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
  DollarSign,
  FileText
} from 'lucide-react';
import { sendInvoicePdfToWhatsApp, downloadInvoicePdf } from '../utils/exportUtils';

export const InvoiceModal = () => {
  const { isInvoiceModalOpen, activeInvoiceForModal, closeInvoiceModal, contactInfo, invoices = [] } = useApp();
  const printAreaRef = useRef(null);

  if (!isInvoiceModalOpen || !activeInvoiceForModal) return null;

  // Resolve live invoice from context so payment updates reflect immediately
  const inv = (invoices || []).find(i => 
    i.id === activeInvoiceForModal.id || 
    i.invoiceNumber === activeInvoiceForModal.invoiceNumber
  ) || activeInvoiceForModal;

  // Handle direct print - Isolates ONLY the invoice receipt so the background page is never printed!
  const handlePrint = () => {
    if (!printAreaRef.current) {
      window.print();
      return;
    }

    let printFrame = document.getElementById('receipt-print-frame');
    if (!printFrame) {
      printFrame = document.createElement('iframe');
      printFrame.id = 'receipt-print-frame';
      printFrame.style.position = 'fixed';
      printFrame.style.right = '0';
      printFrame.style.bottom = '0';
      printFrame.style.width = '0';
      printFrame.style.height = '0';
      printFrame.style.border = 'none';
      printFrame.style.zIndex = '-9999';
      document.body.appendChild(printFrame);
    }

    const doc = printFrame.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html dir="ltr" lang="en">
      <head>
        <meta charset="utf-8">
        <title>Order #${inv.invoiceNumber} - Caturra Coffee Roasters</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&family=Outfit:wght@400;600;700;800&display=swap" rel="stylesheet">
        <style>
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-variant-numeric: tabular-nums lining-nums;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body {
            font-family: 'Outfit', 'Cairo', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            direction: ltr;
            background: #ffffff !important;
            color: #242721 !important;
            padding: 0;
            margin: 0;
            font-size: 13px;
          }
          @page {
            size: A4 portrait;
            margin: 10mm 12mm;
          }
          .no-print {
            display: none !important;
          }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          img {
            max-width: 100%;
          }
        </style>
      </head>
      <body>
        <div style="max-width: 680px; margin: 0 auto; background: #ffffff;">
          ${printAreaRef.current.innerHTML}
        </div>
      </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      printFrame.contentWindow.focus();
      printFrame.contentWindow.print();
    }, 280);
  };

  // Send genuine PDF file to WhatsApp directly
  const handleWhatsAppShare = async () => {
    let phone = inv.customerPhone ? inv.customerPhone.replace(/[^0-9]/g, '') : '';
    if (phone.startsWith('0')) {
      phone = '20' + phone.substring(1);
    } else if (phone && !phone.startsWith('20')) {
      phone = '20' + phone;
    }
    await sendInvoicePdfToWhatsApp(inv, contactInfo, phone);
  };

  const orderDateFormatted = inv.date ? (inv.date.includes(' ') ? inv.date.split(' ')[0] : inv.date) : new Date().toLocaleDateString('en-US');
  const deliveryDateFormatted = inv.deliveryDate || orderDateFormatted;
  const accountManagerName = inv.cashierName || 'Omar Saad';

  return (
    <div className="modal-overlay" onClick={closeInvoiceModal} style={{ zIndex: 1200 }}>
      <div 
        className="modal-content invoice-modal-container"
        style={{
          maxWidth: '740px',
          maxHeight: '94vh',
          height: '94vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '0',
          overflow: 'hidden',
          borderRadius: '24px',
          boxShadow: '0 25px 70px rgba(0, 0, 0, 0.45)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Actions Toolbar (Hidden on print) */}
        <div className="no-print" style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 22px',
          background: '#f8f7f4',
          borderBottom: '1px solid #e7e5df',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontWeight: '800', color: '#32362f', fontSize: '0.98rem' }}>
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
              onClick={() => downloadInvoicePdf(inv, contactInfo)} 
              className="btn btn-outline"
              style={{ padding: '6px 14px', fontSize: '0.85rem', color: '#505342', borderColor: '#c9c7bf', background: '#ffffff' }}
              title="تحميل ملف الفاتورة PDF على جهازك"
            >
              <FileText size={16} />
              <span>تحميل PDF</span>
            </button>
            <button 
              onClick={handleWhatsAppShare} 
              className="btn btn-outline"
              style={{ padding: '6px 14px', fontSize: '0.85rem', color: '#16a34a', borderColor: '#86efac', background: '#ffffff' }}
              title="إرسال ملف الفاتورة PDF عبر واتساب"
            >
              <MessageSquare size={16} />
              <span>واتساب</span>
            </button>
            <button 
              onClick={handlePrint} 
              className="btn btn-primary"
              style={{ padding: '6px 16px', fontSize: '0.85rem', background: '#505342', borderColor: '#505342' }}
              title="طباعة الفاتورة"
            >
              <Printer size={16} />
              <span>طباعة</span>
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

        {/* Printable Receipt Paper (Scrollable, Styled exactly like Bonds Image) */}
        <div 
          ref={printAreaRef}
          className="invoice-receipt print-only-container"
          dir="ltr"
          style={{
            position: 'relative',
            padding: '36px 40px 30px',
            background: '#ffffff',
            color: '#242721',
            fontFamily: "'Outfit', 'Cairo', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            overflowY: 'auto',
            flex: 1,
            boxSizing: 'border-box'
          }}
        >
          {/* Top Subtle Organic Wave Background */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '95px',
            overflow: 'hidden',
            pointerEvents: 'none',
            zIndex: 0
          }}>
            <svg viewBox="0 0 1000 120" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
              <path d="M0,0 L1000,0 L1000,45 Q750,85 500,55 Q250,25 0,65 Z" fill="#f4f3ef"/>
            </svg>
          </div>

          {/* Top Header Row: Logo & Roastery Name (Left) + Country & Tax ID (Right) */}
          <div style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start'
          }}>
            {/* Brand Logo & Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <img 
                src="/caturra_logo.jpg" 
                alt="Caturra Coffee Roasters" 
                style={{ 
                  width: '52px', 
                  height: '52px', 
                  borderRadius: '50%', 
                  objectFit: 'cover', 
                  border: '1.5px solid #dcdad3',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                }} 
              />
              <div>
                <div style={{
                  fontSize: '25px',
                  fontWeight: '800',
                  letterSpacing: '-0.5px',
                  color: '#262923',
                  lineHeight: '1.05'
                }}>
                  caturra
                </div>
                <div style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  letterSpacing: '1.4px',
                  color: '#6e7069',
                  textTransform: 'lowercase',
                  marginTop: '3px'
                }}>
                  coffee roasters
                </div>
              </div>
            </div>

            {/* Country & Tax ID */}
            <div style={{ textAlign: 'right', fontSize: '12.5px', color: '#464942', lineHeight: '1.55' }}>
              <div style={{ fontWeight: '700', color: '#242721', fontSize: '13.5px' }}>Egypt</div>
              <div>Tax ID: <strong style={{ color: '#242721' }}>{contactInfo?.taxNumber || '582-934-211'}</strong></div>
              <div style={{ fontSize: '11px', color: '#7a7c75' }}>Reg: {contactInfo?.commercialRegister || '148920'}</div>
            </div>
          </div>

          {/* Customer / Client Name */}
          <div style={{ position: 'relative', zIndex: 1, marginTop: '38px', marginBottom: '4px' }}>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#242721' }}>
              {inv.customerName || (contactInfo?.brandNameAr ? 'عميل نقدي' : 'Retail Customer')}
            </div>
            {inv.customerPhone && (
              <div style={{ fontSize: '12px', color: '#6f716a', marginTop: '2px' }}>
                {inv.customerPhone}
              </div>
            )}
          </div>

          {/* Order Title */}
          <h1 style={{
            position: 'relative',
            zIndex: 1,
            fontSize: '28px',
            fontWeight: '700',
            color: '#242721',
            margin: '4px 0 18px',
            letterSpacing: '-0.5px'
          }}>
            Order # {inv.invoiceNumber}
          </h1>

          {/* Order Meta Pill Card (Rounded light-beige container) */}
          <div style={{
            position: 'relative',
            zIndex: 1,
            background: '#ebe9e2',
            borderRadius: '12px',
            padding: '16px 22px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '12px 20px',
            marginBottom: '26px'
          }}>
            <div>
              <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#242721', marginBottom: '3px' }}>
                Order Date
              </div>
              <div style={{ fontSize: '13px', color: '#464942', fontWeight: '500' }}>
                {orderDateFormatted}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#242721', marginBottom: '3px' }}>
                Delivery Date
              </div>
              <div style={{ fontSize: '13px', color: '#464942', fontWeight: '500' }}>
                {deliveryDateFormatted}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#242721', marginBottom: '3px' }}>
                Account Manager
              </div>
              <div style={{ fontSize: '13px', color: '#464942', fontWeight: '500' }}>
                {accountManagerName}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '12.5px', fontWeight: '700', color: '#242721', marginBottom: '3px' }}>
                Payment Method
              </div>
              <div style={{ fontSize: '13px', color: '#464942', fontWeight: '500' }}>
                {inv.paymentMethod === 'cash' 
                  ? 'Cash' 
                  : inv.paymentMethod === 'card' 
                    ? 'Card / Visa' 
                    : inv.paymentMethod === 'instapay' 
                      ? 'InstaPay' 
                      : inv.paymentMethod === 'wallet' 
                        ? 'E-Wallet' 
                        : 'On Account'}
              </div>
            </div>
          </div>

          {/* Items Table with Dark Olive-Coffee Header and Rounded Top Corners */}
          <div style={{
            position: 'relative',
            zIndex: 1,
            border: '1px solid #dcdad1',
            borderRadius: '8px 8px 0 0',
            overflow: 'hidden',
            background: '#ffffff'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#505342', color: '#ffffff' }}>
                  <th style={{ textAlign: 'left', padding: '12px 16px', fontWeight: '700', fontSize: '13px' }}>
                    Description
                  </th>
                  <th style={{ textAlign: 'center', padding: '12px 14px', fontWeight: '700', fontSize: '13px', width: '110px' }}>
                    Quantity
                  </th>
                  <th style={{ textAlign: 'center', padding: '12px 14px', fontWeight: '700', fontSize: '13px', width: '110px' }}>
                    Unit Price
                  </th>
                  <th style={{ textAlign: 'right', padding: '12px 16px', fontWeight: '700', fontSize: '13px', width: '130px' }}>
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {(inv.items || []).map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #e5e3dc' }}>
                    <td style={{ padding: '12px 16px', color: '#242721', fontWeight: '600' }}>
                      <div>{item.name}</div>
                      {(item.weightLabel || item.weightGram || item.grind) && (
                        <div style={{ fontSize: '11px', color: '#73756e', marginTop: '3px', fontWeight: '500' }}>
                          {item.weightLabel || (item.weightGram ? `${item.weightGram}g` : '')}
                          {item.grind ? ` • ${item.grind}` : ''}
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'center', padding: '12px 14px', color: '#444741' }}>
                      {Number(item.qty).toFixed(2)} Units
                    </td>
                    <td style={{ textAlign: 'center', padding: '12px 14px', color: '#444741' }}>
                      {(Number(item.price) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td style={{ textAlign: 'right', padding: '12px 16px', color: '#242721', fontWeight: '700' }}>
                      {((Number(item.price) || 0) * (Number(item.qty) || 1)).toLocaleString('en-US', { minimumFractionDigits: 2 })} LE
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Floating Total Bar attached to table right bottom */}
          <div style={{
            position: 'relative',
            zIndex: 1,
            display: 'flex',
            justifyContent: 'flex-end',
            marginTop: '-1px'
          }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '24px',
              background: '#505342',
              color: '#ffffff',
              padding: '10px 22px',
              borderRadius: '0 0 8px 8px',
              fontWeight: '700',
              fontSize: '14px',
              minWidth: '240px'
            }}>
              <span>Total</span>
              <span style={{ fontSize: '15px', fontWeight: '800' }}>
                {(Number(inv.total) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} LE
              </span>
            </div>
          </div>

          {/* Subtotal & Discount breakdown if applicable */}
          {((Number(inv.discount) || 0) > 0 || (inv.subtotal && inv.subtotal !== inv.total)) && (
            <div style={{
              position: 'relative',
              zIndex: 1,
              marginTop: '10px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              gap: '4px',
              fontSize: '12px',
              color: '#6e7069'
            }}>
              {inv.subtotal && (
                <div>Subtotal: <strong>{(Number(inv.subtotal)).toLocaleString('en-US', { minimumFractionDigits: 2 })} LE</strong></div>
              )}
              {Number(inv.discount) > 0 && (
                <div style={{ color: '#dc2626' }}>Discount: <strong>-{(Number(inv.discount)).toLocaleString('en-US', { minimumFractionDigits: 2 })} LE</strong></div>
              )}
            </div>
          )}

          {/* Transfer Receipt ScreenShot (if uploaded by online customer) */}
          {inv.transferReceipt && (
            <div style={{
              position: 'relative',
              zIndex: 1,
              marginTop: '22px',
              padding: '14px 18px',
              background: '#faf9f6',
              border: '1px dashed #c8c5bc',
              borderRadius: '10px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: '#505342' }}>
                  📸 Attached Customer Transfer Proof (Screen Shot):
                </span>
                {inv.transferSenderPhone && (
                  <span style={{ fontSize: '11px', color: '#047857', fontWeight: '700' }}>
                    Sender: {inv.transferSenderPhone}
                  </span>
                )}
              </div>
              <a href={inv.transferReceipt} target="_blank" rel="noreferrer">
                <img
                  src={inv.transferReceipt}
                  alt="Payment transfer proof"
                  style={{ maxHeight: '160px', maxWidth: '100%', objectFit: 'contain', borderRadius: '6px', border: '1px solid #e0dfd7' }}
                />
              </a>
            </div>
          )}

          {/* Footer: Company & Bank Details (Left) + Verification QR Code (Right) */}
          <div style={{
            position: 'relative',
            zIndex: 1,
            marginTop: '44px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '24px'
          }}>
            {/* Bank and Company info */}
            <div style={{ fontSize: '12.5px', color: '#444741', lineHeight: '1.9' }}>
              <div><strong>Company Name :</strong> Caturra For Coffee Products</div>
              <div><strong>Bank Name :</strong> Commercial International Bank (CIB)</div>
              <div><strong>Bank Account No.:</strong> 100069514264 (EGP)</div>
              <div><strong>TAX No.:</strong> {contactInfo?.taxNumber || '582-934-211'}</div>
              {inv.customerAddress && <div><strong>Delivery Address :</strong> {inv.customerAddress}</div>}
            </div>

            {/* Electronic Invoice QR Code & Verification */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '6px'
            }}>
              <InvoiceQrCode 
                invoice={inv} 
                contactInfo={contactInfo} 
                size={94} 
                showControls={false}
              />
              <div style={{ fontSize: '10.5px', color: '#7a7c75', textAlign: 'center' }}>
                Scan to verify invoice
              </div>
              <div style={{ fontSize: '9.5px', color: '#9da098', fontWeight: '600' }}>
                Official Electronic Invoice • Egypt
              </div>
            </div>
          </div>

          {/* Bottom Subtle Organic Wave Background */}
          <div style={{
            position: 'relative',
            width: '100%',
            height: '70px',
            marginTop: '20px',
            overflow: 'hidden',
            pointerEvents: 'none'
          }}>
            <svg viewBox="0 0 1000 120" preserveAspectRatio="none" style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: '60px' }}>
              <path d="M0,70 Q250,20 500,55 Q750,90 1000,40 L1000,120 L0,120 Z" fill="#f4f3ef"/>
            </svg>
          </div>

          {/* Bottom Actions Helper (Hidden on print) */}
          <div className="no-print" style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
            <button
              onClick={closeInvoiceModal}
              className="btn btn-outline"
              style={{ flex: 1, padding: '10px', fontWeight: '700', borderColor: '#dcdad1', color: '#505342' }}
            >
              إغلاق النافذة
            </button>
            <button
              onClick={handlePrint}
              className="btn btn-primary"
              style={{ flex: 1, padding: '10px', fontWeight: '800', background: '#505342', borderColor: '#505342' }}
            >
              <Printer size={16} />
              <span>طباعة الإيصال (A4)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
