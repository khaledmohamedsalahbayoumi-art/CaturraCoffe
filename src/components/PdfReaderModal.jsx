import React, { useMemo, useEffect } from 'react';
import { X, Download, ExternalLink, FileText, AlertCircle } from 'lucide-react';
import { createPdfBlobUrl, downloadPdfFile, openPdfInNewTab } from '../utils/pdfStorage';

export const PdfReaderModal = ({ isOpen, onClose, pdf, title }) => {
  if (!isOpen || !pdf) return null;

  const blobUrl = useMemo(() => {
    return createPdfBlobUrl(pdf);
  }, [pdf]);

  // Clean up blob url on unmount if it was generated
  useEffect(() => {
    return () => {
      if (blobUrl && blobUrl.startsWith('blob:')) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);

  const pdfName = pdf.name || `${title || 'دليل-كاتورا'}.pdf`;

  return (
    <div
      className="modal-overlay"
      style={{
        zIndex: 99999,
        background: 'rgba(5, 15, 10, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        className="modal-content"
        style={{
          width: '95vw',
          maxWidth: '1100px',
          height: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: '0',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          background: '#ffffff',
          border: '1px solid rgba(255,255,255,0.2)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div
          style={{
            padding: '16px 22px',
            background: 'linear-gradient(135deg, #022c19 0%, #064e3b 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.2)',
                color: '#f87171',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                border: '1px solid rgba(239, 68, 68, 0.3)'
              }}
            >
              <FileText size={22} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span
                  style={{
                    fontSize: '0.72rem',
                    background: '#dc2626',
                    color: '#ffffff',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontWeight: '900',
                    letterSpacing: '0.5px'
                  }}
                >
                  PDF
                </span>
                <h3
                  style={{
                    margin: 0,
                    fontSize: '1.05rem',
                    fontWeight: '800',
                    color: '#ffffff',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {title || pdfName}
                </h3>
              </div>
              <p
                style={{
                  margin: '3px 0 0',
                  fontSize: '0.78rem',
                  color: '#a7f3d0',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {pdfName} {pdf.size ? `• (${pdf.size})` : ''}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button
              onClick={() => openPdfInNewTab(pdf)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.12)',
                color: '#ffffff',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '10px',
                padding: '8px 14px',
                fontSize: '0.82rem',
                fontWeight: '700',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              title="فتح في نافذة كاملة"
            >
              <ExternalLink size={15} />
              <span className="hide-on-mobile">نافذة كاملة</span>
            </button>

            <button
              onClick={() => downloadPdfFile(pdf)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: 'var(--mint-600, #059669)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '8px 16px',
                fontSize: '0.82rem',
                fontWeight: '800',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              title="تحميل الملف إلى جهازك"
            >
              <Download size={15} />
              <span>تحميل</span>
            </button>

            <button
              onClick={onClose}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
                border: 'none',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                marginRight: '4px'
              }}
              title="إغلاق"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Viewer Body */}
        <div style={{ flex: 1, position: 'relative', background: '#525659', display: 'flex', flexDirection: 'column' }}>
          {blobUrl ? (
            <iframe
              src={blobUrl}
              title={pdfName}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                flex: 1
              }}
            />
          ) : (
            <div
              style={{
                margin: 'auto',
                textAlign: 'center',
                color: '#ffffff',
                padding: '30px',
                background: 'rgba(0,0,0,0.4)',
                borderRadius: '16px',
                maxWidth: '400px'
              }}
            >
              <AlertCircle size={48} style={{ color: '#f87171', margin: '0 auto 12px' }} />
              <h4 style={{ margin: '0 0 8px', fontSize: '1.1rem' }}>تعذر عرض ملف الـ PDF مباشرة</h4>
              <p style={{ fontSize: '0.85rem', color: '#cbd5e1', margin: '0 0 16px' }}>
                يمكنك تحميل الملف أو فتحه في نافذة المتصفح الرئيسية.
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button
                  onClick={() => openPdfInNewTab(pdf)}
                  className="btn btn-outline"
                  style={{ color: '#ffffff', borderColor: '#ffffff' }}
                >
                  فتح في نافذة جديدة
                </button>
                <button
                  onClick={() => downloadPdfFile(pdf)}
                  className="btn btn-primary"
                >
                  تحميل الملف
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
