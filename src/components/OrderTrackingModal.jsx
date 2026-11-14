import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatWhatsAppNumber } from '../utils/whatsapp';
import {
  Search,
  Package,
  Clock,
  CheckCircle,
  Truck,
  Coffee,
  X,
  MapPin,
  Phone,
  AlertCircle,
  MessageCircle,
  Calendar,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Printer
} from 'lucide-react';

export const OrderTrackingModal = ({ isOpen, onClose, initialInvoiceId = null, initialInvoiceNumber = '' }) => {
  const { invoices = [], contactInfo, t = (k) => k, language = 'ar', isRtl = true, formatPrice = (p) => `${p} ج.م` } = useApp();

  const [searchQuery, setSearchQuery] = useState(initialInvoiceNumber || '');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  // Sync initial invoice if provided
  useEffect(() => {
    if (initialInvoiceId) {
      const found = invoices.find(inv => inv.id === initialInvoiceId);
      if (found) {
        setSelectedInvoice(found);
        setSearchQuery(found.invoiceNumber);
        setHasSearched(true);
      }
    } else if (initialInvoiceNumber) {
      setSearchQuery(initialInvoiceNumber);
      handleSearch(initialInvoiceNumber);
    } else {
      // When opened without an invoice, keep clean for user to search
      setSelectedInvoice(null);
      setSearchQuery('');
      setHasSearched(false);
    }
  }, [initialInvoiceId, initialInvoiceNumber, isOpen]);

  if (!isOpen) return null;

  const handleSearch = (queryToUse) => {
    const q = (queryToUse !== undefined ? queryToUse : searchQuery).trim().toLowerCase();
    if (!q) {
      setSelectedInvoice(null);
      setHasSearched(true);
      return;
    }

    const cleanDigits = q.replace(/[^0-9]/g, '');

    const found = invoices.find(inv => {
      const invNum = (inv.invoiceNumber || '').toLowerCase();
      const phone = (inv.customerPhone || '').replace(/[^0-9]/g, '');
      const custName = (inv.customerName || '').toLowerCase();

      return invNum.includes(q) ||
             (cleanDigits && invNum.includes(cleanDigits)) ||
             (cleanDigits && phone.includes(cleanDigits)) ||
             custName.includes(q);
    });

    setSelectedInvoice(found || null);
    setHasSearched(true);
  };

  // Determine current step index (0: received, 1: processing, 2: shipped, 3: delivered)
  const getStepIndex = (status) => {
    switch (status) {
      case 'received': return 0;
      case 'processing': return 1;
      case 'shipped': return 2;
      case 'delivered': return 3;
      case 'cancelled': return -1;
      default: return 0;
    }
  };

  const currentStatus = selectedInvoice?.trackingStatus || (selectedInvoice?.status === 'paid' ? 'delivered' : 'received');
  const currentStep = getStepIndex(currentStatus);

  const steps = [
    {
      id: 'received',
      title: t('step1Title'),
      desc: t('step1Desc'),
      icon: Package
    },
    {
      id: 'processing',
      title: t('step2Title'),
      desc: t('step2Desc'),
      icon: Coffee
    },
    {
      id: 'shipped',
      title: t('step3Title'),
      desc: t('step3Desc'),
      icon: Truck
    },
    {
      id: 'delivered',
      title: t('step4Title'),
      desc: t('step4Desc'),
      icon: CheckCircle
    }
  ];

  const roasteryWhatsApp = formatWhatsAppNumber(contactInfo?.whatsapp || '01000000000');

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '680px',
          width: '95%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          padding: 0,
          borderRadius: '24px',
          overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(74, 50, 32, 0.25)',
          background: '#FFFDF9',
          border: '1.5px solid #EDD9BD'
        }}
      >
        {/* Header Bar */}
        <div
          style={{
            padding: '18px 24px',
            background: 'linear-gradient(135deg, #2C1810 0%, #4A3220 100%)',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderBottom: '1px solid #EDD9BD'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(196, 154, 92, 0.2)',
                color: '#C49A5C',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(196, 154, 92, 0.35)'
              }}
            >
              <Truck size={22} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '900', color: '#FFFDF9' }}>
                {t('trackingModalTitle')}
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#EDD9BD' }}>
                {t('trackingModalSub')}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="btn-icon"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#ffffff',
              border: 'none'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Bar Container */}
        <div
          style={{
            padding: '16px 24px',
            background: 'var(--mint-50)',
            borderBottom: '1px solid var(--border-mint)'
          }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            style={{ display: 'flex', gap: '10px' }}
          >
            <div style={{ position: 'relative', flex: 1 }}>
              <Search
                size={18}
                color="var(--mint-700)"
                style={{
                  position: 'absolute',
                  [isRtl ? 'right' : 'left']: '14px',
                  top: '13px'
                }}
              />
              <input
                type="text"
                placeholder={t('trackingSearchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input"
                style={{
                  paddingRight: isRtl ? '42px' : '14px',
                  paddingLeft: isRtl ? '14px' : '42px',
                  height: '44px',
                  borderRadius: '12px',
                  fontSize: '0.92rem',
                  fontWeight: '600'
                }}
              />
            </div>
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                height: '44px',
                padding: '0 22px',
                borderRadius: '12px',
                fontWeight: '800'
              }}
            >
              <span>{t('trackingSearchBtn')}</span>
            </button>
          </form>
        </div>

        {/* Content Body (Scrollable) */}
        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          
          {/* Case 1: Order Found */}
          {selectedInvoice ? (
            <div>
              {/* Order Meta Header Card */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #2C1810 0%, #4A3220 100%)',
                  border: '1.5px solid #EDD9BD',
                  borderRadius: '16px',
                  padding: '16px 20px',
                  marginBottom: '24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#e6b87d', fontWeight: '700' }}>
                    {t('trackingOrderConfirmedNumber')}
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#f5ebe1' }}>
                    {selectedInvoice.invoiceNumber}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#c4b0a1', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Calendar size={13} color="#e6b87d" />
                    <span>{t('trackingOrderDate')} {selectedInvoice.date}</span>
                  </div>
                </div>

                <div style={{ textAlign: isRtl ? 'left' : 'right' }}>
                  <span
                    className={`badge ${
                      currentStatus === 'delivered' ? 'badge-mint' :
                      currentStatus === 'shipped' ? 'badge-mint' :
                      currentStatus === 'processing' ? 'badge-warning' :
                      currentStatus === 'cancelled' ? 'badge-danger' : 'badge-warning'
                    }`}
                    style={{
                      fontSize: '0.88rem',
                      padding: '6px 14px',
                      fontWeight: '800',
                      borderRadius: '10px'
                    }}
                  >
                    {currentStatus === 'delivered' ? t('trackingStatusDelivered') :
                     currentStatus === 'shipped' ? t('trackingStatusShipped') :
                     currentStatus === 'processing' ? t('trackingStatusProcessing') :
                     currentStatus === 'cancelled' ? t('trackingStatusCancelled') : t('trackingStatusReceived')}
                  </span>
                  <div style={{ fontSize: '0.8rem', color: '#e6b87d', fontWeight: '700', marginTop: '4px' }}>
                    {t('orderTotalLabel')} {formatPrice(selectedInvoice.total, language)} ({selectedInvoice.paymentMethod === 'cash' ? t('codName') : t('trackingPaid')})
                  </div>
                </div>
              </div>

              {/* Cancelled State Warning Banner */}
              {currentStatus === 'cancelled' && (
                <div
                  style={{
                    background: '#fef2f2',
                    border: '1.5px solid #fca5a5',
                    borderRadius: '14px',
                    padding: '14px 18px',
                    marginBottom: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    color: '#991b1b'
                  }}
                >
                  <AlertCircle size={22} color="#dc2626" />
                  <div>
                    <strong>{t('trackingCancelledBannerTitle')}</strong>
                    <p style={{ margin: '2px 0 0', fontSize: '0.82rem' }}>
                      {t('trackingCancelledBannerDesc')}
                    </p>
                  </div>
                </div>
              )}

              {/* Visual Stepper Bar */}
              {currentStatus !== 'cancelled' && (
                <div style={{ marginBottom: '28px' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '16px' }}>
                    {t('trackingStepsTitle')}
                  </h3>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      position: 'relative',
                      gap: '8px'
                    }}
                  >
                    {steps.map((st, idx) => {
                      const isCompleted = idx <= currentStep;
                      const isCurrent = idx === currentStep;
                      const Icon = st.icon;

                      return (
                        <div
                          key={st.id}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            position: 'relative',
                            zIndex: 2
                          }}
                        >
                          {/* Step Icon Circle */}
                          <div
                            style={{
                              width: '44px',
                              height: '44px',
                              borderRadius: '50%',
                              background: isCompleted ? 'linear-gradient(135deg, #96663B, #7A5230)' : '#FFF8EE',
                              color: isCompleted ? '#ffffff' : '#94a3b8',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: isCurrent ? '0 0 0 4px rgba(150, 102, 59, 0.25)' : 'none',
                              transition: 'all 0.3s ease',
                              border: isCompleted ? 'none' : '2px dashed #EDD9BD'
                            }}
                          >
                            <Icon size={20} />
                          </div>

                          {/* Step Label */}
                          <div
                            style={{
                              marginTop: '8px',
                              fontSize: '0.82rem',
                              fontWeight: isCurrent ? '900' : isCompleted ? '700' : '600',
                              color: isCurrent ? '#96663B' : isCompleted ? '#4A3220' : '#8A654C'
                            }}
                          >
                            {st.title}
                          </div>

                          <div
                            style={{
                              fontSize: '0.68rem',
                              color: isCompleted ? '#5C3D2E' : '#8A654C',
                              marginTop: '2px',
                              lineHeight: '1.3'
                            }}
                          >
                            {st.desc}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Customer & Delivery Address Card */}
              <div
                className="card"
                style={{
                  padding: '16px',
                  borderRadius: '16px',
                  marginBottom: '18px',
                  background: '#FFF8EE',
                  border: '1px solid #EDD9BD'
                }}
              >
                <div style={{ fontSize: '0.86rem', fontWeight: '800', color: 'var(--mint-950)', marginBottom: '10px' }}>
                  {t('trackingCustomerDetails')}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', fontSize: '0.82rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>{t('trackingCustName')} </span>
                    <strong>{selectedInvoice.customerName}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>{t('trackingCustPhone')} </span>
                    <strong dir="ltr">{selectedInvoice.customerPhone || (language === 'en' ? 'Not registered' : 'غير مسجل')}</strong>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <span style={{ color: 'var(--text-muted)' }}>{t('trackingCustAddress')} </span>
                    <strong>{selectedInvoice.customerAddress || (language === 'en' ? 'Store Pickup' : 'القاهرة - استلام المحمصة')}</strong>
                  </div>
                </div>
              </div>

              {/* Items List in this Order */}
              <div
                className="card"
                style={{
                  padding: '16px',
                  borderRadius: '16px',
                  marginBottom: '20px',
                  border: '1px solid var(--border-light)'
                }}
              >
                <div style={{ fontSize: '0.86rem', fontWeight: '800', color: 'var(--mint-950)', marginBottom: '12px' }}>
                  {t('trackingOrderSummary')} ({selectedInvoice.items?.length || 0})
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {(selectedInvoice.items || []).map((it, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '10px 12px',
                        background: '#f8fafc',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px',
                            background: 'var(--mint-100)',
                            color: 'var(--mint-800)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.78rem',
                            fontWeight: '800'
                          }}
                        >
                          {it.qty}x
                        </div>
                        <div>
                          <div style={{ fontSize: '0.88rem', fontWeight: '700', color: 'var(--text-main)' }}>
                            {it.name}
                          </div>
                          {(it.weightLabel || it.grind) && (
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {it.weightLabel || (it.weightGram ? `${it.weightGram}g` : '')} {it.grind ? `• ${it.grind}` : ''}
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ fontWeight: '800', color: 'var(--mint-900)', fontSize: '0.92rem' }}>
                        {formatPrice(it.total || (it.price * it.qty), language)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons: WhatsApp Roastery Support */}
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <a
                  href={`https://wa.me/${roasteryWhatsApp}?text=${encodeURIComponent(language === 'en' ? `Hello Caturra, I would like to inquire about my order #${selectedInvoice.invoiceNumber}` : `مرحباً كاتورا للقهوة المختصة، أود الاستفسار عن حالة طلبي رقم: ${selectedInvoice.invoiceNumber}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline"
                  style={{
                    flex: 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    borderColor: '#EDD9BD',
                    color: '#96663B',
                    padding: '10px',
                    fontWeight: '700'
                  }}
                >
                  <MessageCircle size={18} />
                  <span>{t('trackingSupportChat')}</span>
                </a>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn btn-outline"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 18px',
                    borderColor: '#cbd5e1',
                    color: '#475569'
                  }}
                >
                  <Printer size={16} />
                  <span>{language === 'en' ? 'Print Tracking Info' : 'طباعة بيانات التتبع'}</span>
                </button>
              </div>

            </div>
          ) : hasSearched ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: '#fef2f2',
                  color: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px'
                }}
              >
                <AlertCircle size={32} />
              </div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 6px' }}>
                {t('trackingNoOrderTitle')}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto 18px', lineHeight: '1.5' }}>
                {t('trackingNoOrderDesc')}
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedInvoice(null);
                    setHasSearched(false);
                  }}
                  className="btn btn-outline"
                  style={{ padding: '8px 20px', fontWeight: '700' }}
                >
                  {language === 'en' ? 'Reset Search' : 'إعادة البحث'}
                </button>
                <a
                  href={`https://wa.me/${roasteryWhatsApp}?text=${encodeURIComponent(language === 'en' ? 'Hello Caturra, I would like to inquire about my order.' : 'مرحباً كاتورا للقهوة المختصة، أود الاستفسار عن حالة طلبي.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-primary"
                  style={{ padding: '8px 20px', fontWeight: '700', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <MessageCircle size={16} />
                  <span>{language === 'en' ? 'Contact WhatsApp' : 'تواصل معنا واتساب'}</span>
                </a>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'var(--mint-50)',
                  color: 'var(--mint-600)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  border: '1px solid var(--border-mint)'
                }}
              >
                <Package size={30} />
              </div>
              <h3 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '1.1rem', fontWeight: '800', color: 'var(--text-main)', margin: '0 0 6px' }}>
                <Coffee size={18} color="#96663B" />
                <span>{t('trackingInvoicePrompt')}</span>
              </h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto', lineHeight: '1.6' }}>
                {t('trackingInvoicePromptSub')}
              </p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
