import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Wallet,
  CheckCircle2,
  X,
  AlertTriangle,
  CreditCard,
  Banknote,
  Smartphone,
  User
} from 'lucide-react';
import { playNotificationSound, vibratePhone } from '../utils/notifications';

export const DebtSettlementModal = ({
  isOpen,
  onClose,
  customer,
  initialAmount,
  invoiceNumber,
  onSuccess
}) => {
  if (!isOpen || !customer) return null;

  const totalDebt = Number(customer.debt || 0);

  const [amount, setAmount] = useState(() => {
    if (initialAmount && Number(initialAmount) > 0) {
      return String(Math.min(Number(initialAmount), totalDebt));
    }
    return String(totalDebt);
  });

  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' | 'instapay' | 'bank'
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  useEffect(() => {
    if (initialAmount && Number(initialAmount) > 0) {
      setAmount(String(Math.min(Number(initialAmount), totalDebt)));
    } else {
      setAmount(String(totalDebt));
    }
    setNotes('');
    setShowSuccessToast(false);
  }, [customer, initialAmount, totalDebt]);

  const numAmount = parseFloat(amount) || 0;
  const isOverpaid = numAmount > totalDebt;
  const isValidAmount = numAmount > 0 && !isOverpaid;
  const remainingDebt = Math.max(0, Math.round((totalDebt - numAmount) * 100) / 100);

  const handlePreset = (fraction) => {
    const val = Math.round(totalDebt * fraction);
    setAmount(String(val));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValidAmount || isSubmitting) return;

    setIsSubmitting(true);

    try {
      if (onSuccess) {
        onSuccess(numAmount, {
          paymentMethod,
          notes,
          remainingDebt,
          customer
        });
      }

      playNotificationSound();
      vibratePhone([60, 40, 100]);

      setShowSuccessToast(true);

      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 700);
    } catch (err) {
      console.error('Error settling debt:', err);
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        zIndex: 1100,
        padding: '12px',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div
        className="modal-content"
        style={{
          maxWidth: '480px',
          width: '100%',
          maxHeight: 'min(92vh, 720px)',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '20px',
          padding: '0',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(4, 30, 20, 0.35)',
          border: '1.5px solid var(--border-mint)',
          background: '#ffffff'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 1. Modal Header (Pinned at Top, crisp white text) */}
        <div
          style={{
            padding: '15px 18px',
            background: 'linear-gradient(135deg, #054f30 0%, #032b1a 100%)',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(16, 185, 129, 0.4)',
                flexShrink: 0
              }}
            >
              <Wallet size={20} color="#ffffff" />
            </div>
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: '1.08rem',
                  fontWeight: '800',
                  color: '#ffffff',
                  letterSpacing: '-0.2px'
                }}
              >
                تسجيل سداد مديونية
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.74rem', color: '#a7f3d0' }}>
                تحصيل مستحقات وتحديث حساب العميل
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn-icon"
            style={{
              background: 'rgba(255, 255, 255, 0.16)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            title="إغلاق"
          >
            <X size={18} />
          </button>
        </div>

        {/* 2. Modal Form (Flex layout with scrollable body + pinned footer) */}
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: '1 1 auto',
            minHeight: 0,
            overflow: 'hidden'
          }}
        >
          {/* Scrollable Form Content */}
          <div
            style={{
              padding: '16px 18px',
              overflowY: 'auto',
              flex: '1 1 auto',
              WebkitOverflowScrolling: 'touch',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            {/* Customer Info Card */}
            <div
              style={{
                background: 'var(--mint-50)',
                border: '1px solid var(--border-mint)',
                borderRadius: '12px',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                <div
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    background: 'var(--mint-200)',
                    color: 'var(--mint-950)',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.9rem',
                    flexShrink: 0
                  }}
                >
                  {customer.name?.charAt(0) || <User size={16} />}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: '800',
                      fontSize: '0.92rem',
                      color: 'var(--mint-950)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                  >
                    {customer.name}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--mint-800)', direction: 'ltr', textAlign: 'right' }}>
                    {customer.phone || 'بدون رقم هاتف'}
                  </div>
                </div>
              </div>

              {invoiceNumber && (
                <span
                  style={{
                    background: '#ffffff',
                    border: '1px solid var(--mint-300)',
                    padding: '3px 8px',
                    borderRadius: '8px',
                    fontSize: '0.72rem',
                    fontWeight: '700',
                    color: 'var(--mint-800)',
                    flexShrink: 0
                  }}
                >
                  فاتورة #{invoiceNumber}
                </span>
              )}
            </div>

            {/* Current Debt Highlight */}
            <div
              style={{
                background: '#fef2f2',
                border: '1.5px solid #fecaca',
                borderRadius: '12px',
                padding: '11px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={17} color="#dc2626" />
                <span style={{ fontSize: '0.84rem', fontWeight: '700', color: '#991b1b' }}>
                  إجمالي المديونية المستحقة:
                </span>
              </div>
              <span
                style={{
                  fontSize: '1.2rem',
                  fontWeight: '900',
                  color: '#dc2626'
                }}
              >
                {totalDebt.toLocaleString()} ج.م
              </span>
            </div>

            {/* Quick Preset Buttons */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--mint-900)', display: 'block', marginBottom: '6px' }}>
                اختصارات سريعة للمبلغ:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => handlePreset(1)}
                  style={{
                    padding: '7px 4px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    border: numAmount === totalDebt ? '1.5px solid var(--mint-600)' : '1px solid var(--border-light)',
                    background: numAmount === totalDebt ? 'var(--mint-100)' : '#ffffff',
                    color: numAmount === totalDebt ? 'var(--mint-950)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  كامل المبلغ (100%)
                </button>
                <button
                  type="button"
                  onClick={() => handlePreset(0.5)}
                  style={{
                    padding: '7px 4px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    border: numAmount === Math.round(totalDebt * 0.5) ? '1.5px solid var(--mint-600)' : '1px solid var(--border-light)',
                    background: numAmount === Math.round(totalDebt * 0.5) ? 'var(--mint-100)' : '#ffffff',
                    color: numAmount === Math.round(totalDebt * 0.5) ? 'var(--mint-950)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  سداد النصف (50%)
                </button>
                <button
                  type="button"
                  onClick={() => handlePreset(0.25)}
                  style={{
                    padding: '7px 4px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    border: numAmount === Math.round(totalDebt * 0.25) ? '1.5px solid var(--mint-600)' : '1px solid var(--border-light)',
                    background: numAmount === Math.round(totalDebt * 0.25) ? 'var(--mint-100)' : '#ffffff',
                    color: numAmount === Math.round(totalDebt * 0.25) ? 'var(--mint-950)' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  سداد الربع (25%)
                </button>
              </div>
            </div>

            {/* Amount Input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" style={{ margin: 0, fontSize: '0.84rem' }}>
                  المبلغ المسدد الآن:
                </label>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  (الحد الأقصى: {totalDebt} ج.م)
                </span>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  min="1"
                  max={totalDebt}
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="أدخل المبلغ المسدد..."
                  className="form-input"
                  style={{
                    fontSize: '1.2rem',
                    fontWeight: '800',
                    paddingLeft: '50px',
                    height: '44px',
                    borderRadius: '10px',
                    borderColor: isOverpaid ? '#ef4444' : undefined
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontWeight: '800',
                    color: 'var(--mint-800)',
                    fontSize: '0.9rem'
                  }}
                >
                  ج.م
                </span>
              </div>

              {/* Validation / Balance Preview */}
              {isOverpaid ? (
                <div style={{ fontSize: '0.76rem', color: '#dc2626', fontWeight: '700' }}>
                  ⚠️ المبلغ المدخل أكبر من إجمالي المديونية ({totalDebt} ج.م)!
                </div>
              ) : numAmount > 0 ? (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: remainingDebt === 0 ? '#ecfdf5' : '#fffbeb',
                    border: `1px solid ${remainingDebt === 0 ? '#a7f3d0' : '#fde68a'}`,
                    borderRadius: '8px',
                    padding: '6px 10px',
                    fontSize: '0.8rem'
                  }}
                >
                  <span style={{ fontWeight: '700', color: remainingDebt === 0 ? '#065f46' : '#92400e' }}>
                    {remainingDebt === 0 ? '✓ سيتم تصفية المديونية بالكامل' : 'المتبقي بعد هذا السداد:'}
                  </span>
                  <span style={{ fontWeight: '800', color: remainingDebt === 0 ? '#059669' : '#b45309' }}>
                    {remainingDebt} ج.م
                  </span>
                </div>
              ) : null}
            </div>

            {/* Payment Method Selector */}
            <div>
              <label style={{ fontSize: '0.8rem', fontWeight: '700', color: 'var(--mint-900)', display: 'block', marginBottom: '6px' }}>
                طريقة التحصيل / الدفع:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px' }}>
                <div
                  onClick={() => setPaymentMethod('cash')}
                  style={{
                    border: paymentMethod === 'cash' ? '2px solid var(--mint-600)' : '1px solid var(--border-light)',
                    background: paymentMethod === 'cash' ? 'var(--mint-50)' : '#ffffff',
                    borderRadius: '10px',
                    padding: '8px 6px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Banknote size={18} color={paymentMethod === 'cash' ? 'var(--mint-700)' : 'var(--text-muted)'} style={{ margin: '0 auto 2px' }} />
                  <div style={{ fontSize: '0.78rem', fontWeight: '800', color: paymentMethod === 'cash' ? 'var(--mint-950)' : 'var(--text-secondary)' }}>
                    كاش (نقدي)
                  </div>
                </div>

                <div
                  onClick={() => setPaymentMethod('instapay')}
                  style={{
                    border: paymentMethod === 'instapay' ? '2px solid #7c3aed' : '1px solid var(--border-light)',
                    background: paymentMethod === 'instapay' ? '#f5f3ff' : '#ffffff',
                    borderRadius: '10px',
                    padding: '8px 6px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Smartphone size={18} color={paymentMethod === 'instapay' ? '#7c3aed' : 'var(--text-muted)'} style={{ margin: '0 auto 2px' }} />
                  <div style={{ fontSize: '0.78rem', fontWeight: '800', color: paymentMethod === 'instapay' ? '#5b21b6' : 'var(--text-secondary)' }}>
                    إنستاباي
                  </div>
                </div>

                <div
                  onClick={() => setPaymentMethod('bank')}
                  style={{
                    border: paymentMethod === 'bank' ? '2px solid #0284c7' : '1px solid var(--border-light)',
                    background: paymentMethod === 'bank' ? '#f0f9ff' : '#ffffff',
                    borderRadius: '10px',
                    padding: '8px 6px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <CreditCard size={18} color={paymentMethod === 'bank' ? '#0284c7' : 'var(--text-muted)'} style={{ margin: '0 auto 2px' }} />
                  <div style={{ fontSize: '0.78rem', fontWeight: '800', color: paymentMethod === 'bank' ? '#0369a1' : 'var(--text-secondary)' }}>
                    تحويل / فيزا
                  </div>
                </div>
              </div>
            </div>

            {/* Notes (Optional) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label className="form-label" style={{ margin: 0, fontSize: '0.78rem' }}>
                ملاحظات أو رقم مرجع التحويل (اختياري):
              </label>
              <input
                type="text"
                placeholder="مثال: تحويل إنستاباي، تم الاستلام في فرع المعادي..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="form-input"
                style={{ fontSize: '0.82rem', height: '36px', borderRadius: '8px' }}
              />
            </div>
          </div>

          {/* 3. Sticky Action Buttons (Always Visible at Bottom!) */}
          <div
            style={{
              padding: '12px 18px',
              background: '#ffffff',
              borderTop: '1px solid var(--border-light)',
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
              flexShrink: 0,
              boxShadow: '0 -4px 14px rgba(0,0,0,0.05)'
            }}
          >
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
              disabled={isSubmitting}
              style={{
                padding: '9px 16px',
                borderRadius: '10px',
                flex: '1',
                height: '42px',
                fontWeight: '700'
              }}
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={!isValidAmount || isSubmitting}
              className="btn btn-primary"
              style={{
                padding: '9px 18px',
                borderRadius: '10px',
                flex: '2',
                height: '42px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                opacity: (!isValidAmount || isSubmitting) ? 0.6 : 1,
                cursor: (!isValidAmount || isSubmitting) ? 'not-allowed' : 'pointer'
              }}
            >
              {showSuccessToast ? (
                <>
                  <CheckCircle2 size={18} />
                  <span>تم التسجيل بنجاح!</span>
                </>
              ) : (
                <>
                  <DollarSign size={18} />
                  <span>تأكيد استلام {isValidAmount ? `${numAmount} ج.م` : 'المبلغ'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
