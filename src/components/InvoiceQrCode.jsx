import React, { useState, useEffect } from 'react';
import { generateInvoiceQrDataUrl, getInvoiceTrackingUrl, getInvoiceTaxPayload } from '../utils/qrCodeGenerator';
import { QrCode, ExternalLink, Download, Check, ShieldCheck, RefreshCw } from 'lucide-react';

export const InvoiceQrCode = ({
  invoice,
  contactInfo,
  size = 110,
  showControls = true,
  className = ''
}) => {
  const [qrType, setQrType] = useState('url'); // 'url' | 'tax'
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    if (!invoice) return;

    setLoading(true);
    const content = qrType === 'url' 
      ? getInvoiceTrackingUrl(invoice)
      : getInvoiceTaxPayload(invoice, contactInfo);

    generateInvoiceQrDataUrl(content, {
      width: Math.max(size * 2, 220),
      margin: 1,
      darkColor: '#000000',
      lightColor: '#ffffff',
      errorCorrectionLevel: 'M'
    }).then((dataUrl) => {
      if (isCurrent) {
        setQrDataUrl(dataUrl);
        setLoading(false);
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [invoice, contactInfo, qrType, size]);

  const handleDownload = () => {
    if (!qrDataUrl) return;
    const a = document.createElement('a');
    a.href = qrDataUrl;
    a.download = `QR_${invoice?.invoiceNumber || 'invoice'}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleCopyLink = () => {
    const url = getInvoiceTrackingUrl(invoice);
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!invoice) return null;

  return (
    <div 
      className={`invoice-qr-component ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
        textAlign: 'center'
      }}
    >
      {/* Toggle Controls (Hidden on Print) */}
      {showControls && (
        <div 
          className="no-print"
          style={{
            display: 'flex',
            gap: '4px',
            background: 'var(--mint-50)',
            padding: '3px',
            borderRadius: '20px',
            marginBottom: '4px',
            border: '1px solid var(--border-mint)'
          }}
        >
          <button
            type="button"
            onClick={() => setQrType('url')}
            style={{
              padding: '3px 10px',
              fontSize: '0.72rem',
              borderRadius: '16px',
              border: 'none',
              background: qrType === 'url' ? 'var(--mint-600)' : 'transparent',
              color: qrType === 'url' ? '#ffffff' : 'var(--mint-900)',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            رابط التتبع الذكي
          </button>
          <button
            type="button"
            onClick={() => setQrType('tax')}
            style={{
              padding: '3px 10px',
              fontSize: '0.72rem',
              borderRadius: '16px',
              border: 'none',
              background: qrType === 'tax' ? 'var(--mint-600)' : 'transparent',
              color: qrType === 'tax' ? '#ffffff' : 'var(--mint-900)',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            البيانات الضريبية
          </button>
        </div>
      )}

      {/* The QR Image Container */}
      <div 
        style={{
          width: `${size}px`,
          height: `${size}px`,
          background: '#ffffff',
          borderRadius: '8px',
          border: '1.5px solid #000000',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
          position: 'relative'
        }}
      >
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
            <RefreshCw size={20} className="spin" color="var(--mint-600)" />
          </div>
        ) : qrDataUrl ? (
          <img 
            src={qrDataUrl} 
            alt={`QR Code ${invoice.invoiceNumber}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block'
            }}
          />
        ) : (
          <div style={{ fontSize: '0.7rem', color: '#dc2626' }}>خطأ في التوليد</div>
        )}
      </div>

      {/* QR Meta / Caption */}
      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px', lineHeight: '1.3' }}>
        <span>امسح الرمز بكاميرا الهاتف للتحقق وتتبع الطلب</span>
        <div style={{ fontWeight: '700', color: 'var(--mint-800)', fontSize: '0.72rem' }}>
          #{invoice.invoiceNumber}
        </div>
      </div>

      {/* Quick Action Helpers (Hidden on print) */}
      {showControls && (
        <div 
          className="no-print" 
          style={{ 
            display: 'flex', 
            gap: '8px', 
            alignItems: 'center', 
            marginTop: '2px',
            fontSize: '0.72rem' 
          }}
        >
          <button
            type="button"
            onClick={handleCopyLink}
            className="btn btn-outline"
            style={{
              padding: '2px 8px',
              fontSize: '0.72rem',
              borderRadius: '6px',
              gap: '4px',
              display: 'inline-flex',
              alignItems: 'center',
              borderColor: 'var(--border-mint)'
            }}
            title="نسخ رابط التحقق المباشر"
          >
            {copied ? <Check size={12} color="#16a34a" /> : <ExternalLink size={12} />}
            <span>{copied ? 'تم النسخ!' : 'نسخ الرابط'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="btn btn-outline"
            style={{
              padding: '2px 8px',
              fontSize: '0.72rem',
              borderRadius: '6px',
              gap: '4px',
              display: 'inline-flex',
              alignItems: 'center',
              borderColor: 'var(--border-mint)'
            }}
            title="تحميل صورة الـ QR بجودة عالية"
          >
            <Download size={12} />
            <span>حفظ QR</span>
          </button>
        </div>
      )}
    </div>
  );
};

export const InvoiceMiniQr = ({ invoice, size = 36, onClick }) => {
  const [dataUrl, setDataUrl] = useState('');

  useEffect(() => {
    let active = true;
    if (!invoice) return;
    const url = getInvoiceTrackingUrl(invoice);
    generateInvoiceQrDataUrl(url, {
      width: 90,
      margin: 1,
      darkColor: '#000000',
      lightColor: '#ffffff',
      errorCorrectionLevel: 'L'
    }).then(res => {
      if (active) setDataUrl(res);
    });
    return () => { active = false; };
  }, [invoice]);

  if (!dataUrl) {
    return (
      <div 
        onClick={onClick}
        style={{ 
          width: `${size}px`, 
          height: `${size}px`, 
          background: 'var(--mint-50)', 
          border: '1px solid var(--border-mint)',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer'
        }}
        title="معاينة رمز QR الفاتورة"
      >
        <QrCode size={16} color="var(--mint-700)" />
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      style={{
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2px',
        background: '#ffffff',
        border: '1.5px solid var(--border-mint)',
        borderRadius: '6px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        transition: 'transform 0.15s ease-in-out, box-shadow 0.15s ease-in-out'
      }}
      title="انقر لمعاينة وطباعة الفاتورة ورمز QR المعتمد"
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.2)';
        e.currentTarget.style.boxShadow = '0 4px 10px rgba(0,0,0,0.15)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.06)';
      }}
    >
      <img 
        src={dataUrl} 
        alt={`QR ${invoice?.invoiceNumber}`} 
        style={{ width: `${size}px`, height: `${size}px`, display: 'block', borderRadius: '4px' }} 
      />
    </div>
  );
};

