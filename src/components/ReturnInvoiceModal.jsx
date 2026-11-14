import React, { useState, useMemo } from 'react';
import { RotateCcw, X, AlertCircle, CheckCircle, Package, DollarSign, Wallet, ShieldCheck, Minus, Plus } from 'lucide-react';

/**
 * 🔄 ReturnInvoiceModal
 * مودال احترافي لتسجيل مرتجع مبيعات (صنف واحد أو أصناف متعددة أو كميات محددة)
 * مع إعادة الكميات فوراً للمخزن وتسوية المالية (خصم من المديونية أو رد نقدي من الخزينة)
 */
export const ReturnInvoiceModal = ({
  invoice,
  treasuryAccounts = [],
  onClose,
  onConfirmReturn
}) => {
  const invoiceItems = useMemo(() => (invoice && Array.isArray(invoice.items)) ? invoice.items : [], [invoice]);
  const remainingDebt = Number(invoice?.remainingDebt || 0);
  const paidAmount = Number(invoice?.paidAmount || (Number(invoice?.total || 0) - remainingDebt) || 0);

  // Initialize selected state for each item
  const [itemSelections, setItemSelections] = useState(() => {
    const init = {};
    invoiceItems.forEach((it, idx) => {
      const alreadyReturned = Number(it.returnedQty || 0);
      const originalQty = Number(it.qty || 1);
      const maxReturnable = Math.max(0, originalQty - alreadyReturned);
      init[idx] = {
        selected: maxReturnable > 0,
        qtyToReturn: maxReturnable > 0 ? maxReturnable : 0
      };
    });
    return init;
  });

  const [returnReason, setReturnReason] = useState('طلب العميل استرجاع الصنف');
  // 'debt_first' | 'cash'
  const [settlementMode, setSettlementMode] = useState(remainingDebt > 0 ? 'debt_first' : 'cash');
  const [refundAccountId, setRefundAccountId] = useState(treasuryAccounts[0]?.id || 'acc-cash-main');

  // Compute items being returned and their refund totals
  const processedReturns = useMemo(() => {
    return invoiceItems.map((it, idx) => {
      const sel = itemSelections[idx];
      const alreadyReturned = Number(it.returnedQty || 0);
      const originalQty = Number(it.qty || 1);
      const maxReturnable = Math.max(0, originalQty - alreadyReturned);
      const unitPrice = Number(it.unitPrice || it.price || (Number(it.total || 0) / originalQty) || 0);
      const qtyToReturn = sel?.selected ? Math.min(Math.max(1, Number(sel.qtyToReturn || 1)), maxReturnable) : 0;
      const refundAmount = qtyToReturn * unitPrice;

      return {
        ...it,
        originalIndex: idx,
        alreadyReturned,
        maxReturnable,
        unitPrice,
        qtyToReturn,
        refundAmount,
        isSelected: Boolean(sel?.selected && maxReturnable > 0)
      };
    });
  }, [invoiceItems, itemSelections]);

  const activeReturns = processedReturns.filter(it => it.isSelected && it.qtyToReturn > 0);
  const totalRefundAmount = activeReturns.reduce((sum, it) => sum + it.refundAmount, 0);

  // Financial distribution
  const { debtDeduction, cashRefund } = useMemo(() => {
    if (totalRefundAmount <= 0) return { debtDeduction: 0, cashRefund: 0 };

    if (settlementMode === 'debt_first') {
      const deduction = Math.min(totalRefundAmount, remainingDebt);
      const excess = totalRefundAmount - deduction;
      return {
        debtDeduction: deduction,
        cashRefund: excess
      };
    } else {
      return {
        debtDeduction: 0,
        cashRefund: totalRefundAmount
      };
    }
  }, [totalRefundAmount, settlementMode, remainingDebt]);

  const handleToggleItem = (idx) => {
    setItemSelections(prev => {
      const current = prev[idx] || {};
      const maxReturnable = processedReturns[idx]?.maxReturnable || 0;
      if (maxReturnable <= 0) return prev;
      return {
        ...prev,
        [idx]: {
          selected: !current.selected,
          qtyToReturn: current.qtyToReturn > 0 ? current.qtyToReturn : maxReturnable
        }
      };
    });
  };

  const handleQtyChange = (idx, delta) => {
    setItemSelections(prev => {
      const current = prev[idx] || {};
      const maxReturnable = processedReturns[idx]?.maxReturnable || 1;
      const currentQty = Number(current.qtyToReturn || 1);
      const newQty = Math.max(1, Math.min(maxReturnable, currentQty + delta));
      return {
        ...prev,
        [idx]: {
          ...current,
          selected: true,
          qtyToReturn: newQty
        }
      };
    });
  };

  const handleSelectAll = (select) => {
    setItemSelections(prev => {
      const next = { ...prev };
      invoiceItems.forEach((it, idx) => {
        const maxReturnable = Math.max(0, Number(it.qty || 1) - Number(it.returnedQty || 0));
        if (maxReturnable > 0) {
          next[idx] = {
            selected: select,
            qtyToReturn: maxReturnable
          };
        }
      });
      return next;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (activeReturns.length === 0) {
      alert('يرجى تحديد منتج واحد على الأقل لإرجاعه!');
      return;
    }

    const payloadItems = activeReturns.map(it => ({
      productId: it.productId,
      name: it.name,
      unitType: it.unitType,
      weightGram: it.weightGram,
      unitPrice: it.unitPrice,
      qtyToReturn: it.qtyToReturn,
      refundAmount: it.refundAmount
    }));

    onConfirmReturn(
      returnReason,
      {
        settlementMode,
        debtDeduction,
        cashRefund,
        refundCashExcess: cashRefund > 0,
        accountId: refundAccountId
      },
      payloadItems
    );
  };

  if (!invoice) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 7, 3, 0.88)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 100000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#1b0e07',
          backgroundImage: 'linear-gradient(135deg, #251209 0%, #150904 100%)',
          border: '1.5px solid #d4a373',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 65px rgba(0, 0, 0, 0.9), 0 0 35px rgba(192, 132, 252, 0.2)',
          color: '#f5ebe1',
          overflow: 'hidden'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #7e22ce 0%, #581c87 100%)',
            padding: '18px 24px',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.15)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <RotateCcw size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.18rem', fontWeight: '900' }}>
                تسجيل مرتجع فاتورة #{invoice.invoiceNumber}
              </h3>
              <div style={{ fontSize: '0.82rem', opacity: 0.92, marginTop: '2px' }}>
                العميل: <strong>{invoice.customerName || 'عميل نقدي'}</strong> • إجمالي الفاتورة: {(Number(invoice.total) || 0).toLocaleString()} ج.م
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              color: '#ffffff',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '22px 24px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px'
          }}
        >
          {/* Header Action Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ fontWeight: '900', fontSize: '0.96rem', color: '#EDD9BD', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Package size={18} style={{ color: '#c084fc' }} />
              <span>حدد الأصناف والكمية المراد إرجاعها للمخزن:</span>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => handleSelectAll(true)}
                style={{
                  background: 'rgba(192, 132, 252, 0.15)',
                  border: '1px solid rgba(192, 132, 252, 0.35)',
                  color: '#e9d5ff',
                  borderRadius: '8px',
                  padding: '4px 10px',
                  fontSize: '0.74rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                تحديد الكل
              </button>
              <button
                type="button"
                onClick={() => handleSelectAll(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  color: '#d4a373',
                  borderRadius: '8px',
                  padding: '4px 10px',
                  fontSize: '0.74rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                إلغاء التحديد
              </button>
            </div>
          </div>

          {/* Items List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {processedReturns.map((item) => {
              const isFullyReturned = item.maxReturnable <= 0;

              return (
                <div
                  key={item.originalIndex}
                  style={{
                    background: item.isSelected
                      ? 'rgba(126, 34, 206, 0.15)'
                      : (isFullyReturned ? 'rgba(0, 0, 0, 0.25)' : 'rgba(0, 0, 0, 0.45)'),
                    border: item.isSelected
                      ? '1.5px solid #a855f7'
                      : (isFullyReturned ? '1px dashed #555' : '1px solid rgba(212, 163, 115, 0.25)'),
                    borderRadius: '16px',
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '14px',
                    opacity: isFullyReturned ? 0.6 : 1,
                    transition: 'all 0.2s ease'
                  }}
                >
                  {/* Left: Checkbox & Product Info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                    <input
                      type="checkbox"
                      disabled={isFullyReturned}
                      checked={item.isSelected}
                      onChange={() => handleToggleItem(item.originalIndex)}
                      style={{
                        width: '20px',
                        height: '20px',
                        accentColor: '#9333ea',
                        cursor: isFullyReturned ? 'not-allowed' : 'pointer',
                        flexShrink: 0
                      }}
                    />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: '800', fontSize: '0.98rem', color: '#ffffff' }}>
                          {item.name}
                        </span>
                        {item.unitType === 'weight' && item.weightGram && (
                          <span style={{ fontSize: '0.72rem', background: '#3b2014', color: '#EDD9BD', padding: '2px 6px', borderRadius: '6px' }}>
                            {item.weightGram >= 1000 ? `${item.weightGram / 1000} كجم` : `${item.weightGram} جم`}
                          </span>
                        )}
                        {item.alreadyReturned > 0 && (
                          <span style={{ fontSize: '0.72rem', background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '2px 6px', borderRadius: '6px' }}>
                            أُرجع منه مسبقاً: {item.alreadyReturned}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#d4a373', marginTop: '3px' }}>
                        الكمية الأصلية: <strong>{item.qty || 1}</strong> • المتبقي بالفاتورة: <strong>{item.maxReturnable}</strong> • سعر الوحدة: <strong>{item.unitPrice.toLocaleString()} ج.م</strong>
                      </div>
                    </div>
                  </div>

                  {/* Right: Quantity Stepper & Subtotal */}
                  {!isFullyReturned ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
                      {/* Stepper */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          background: '#0e0502',
                          borderRadius: '10px',
                          border: '1px solid rgba(192, 132, 252, 0.4)',
                          overflow: 'hidden'
                        }}
                      >
                        <button
                          type="button"
                          disabled={!item.isSelected || item.qtyToReturn <= 1}
                          onClick={() => handleQtyChange(item.originalIndex, -1)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ffffff',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: (!item.isSelected || item.qtyToReturn <= 1) ? 'not-allowed' : 'pointer',
                            opacity: (!item.isSelected || item.qtyToReturn <= 1) ? 0.4 : 1
                          }}
                        >
                          <Minus size={14} />
                        </button>
                        <span
                          style={{
                            minWidth: '36px',
                            textAlign: 'center',
                            fontWeight: '900',
                            fontSize: '0.95rem',
                            color: '#e9d5ff'
                          }}
                        >
                          {item.qtyToReturn}
                        </span>
                        <button
                          type="button"
                          disabled={!item.isSelected || item.qtyToReturn >= item.maxReturnable}
                          onClick={() => handleQtyChange(item.originalIndex, 1)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ffffff',
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: (!item.isSelected || item.qtyToReturn >= item.maxReturnable) ? 'not-allowed' : 'pointer',
                            opacity: (!item.isSelected || item.qtyToReturn >= item.maxReturnable) ? 0.4 : 1
                          }}
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      {/* Subtotal Refund */}
                      <div style={{ textAlign: 'left', minWidth: '95px' }}>
                        <div style={{ fontSize: '0.98rem', fontWeight: '900', color: item.isSelected ? '#4ade80' : '#888' }}>
                          {item.refundAmount.toLocaleString()} ج.م
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#aaa' }}>
                          قيمة المسترجع
                        </div>
                      </div>
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.78rem', color: '#999', fontStyle: 'italic' }}>
                      تم إرجاع كامل الصنف
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Live Refund Summary Box */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(37, 18, 10, 0.9) 0%, rgba(20, 10, 5, 0.95) 100%)',
              border: '1.5px solid #d4a373',
              borderRadius: '16px',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(212, 163, 115, 0.25)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <DollarSign size={20} style={{ color: '#4ade80' }} />
                <span style={{ fontWeight: '800', fontSize: '0.95rem' }}>إجمالي القيمة المستردة للمرتجع:</span>
              </div>
              <div style={{ fontSize: '1.35rem', fontWeight: '900', color: '#4ade80' }}>
                {totalRefundAmount.toLocaleString()} <span style={{ fontSize: '0.85rem', color: '#EDD9BD' }}>ج.م</span>
              </div>
            </div>

            {/* Financial Settlement Choice */}
            {remainingDebt > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: '800', color: '#fbbf24', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Wallet size={16} />
                  <span>طريقة تسوية المرتجع (يوجد مديونية متبقية على الفاتورة قدرها {remainingDebt.toLocaleString()} ج.م):</span>
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
                  <label
                    style={{
                      background: settlementMode === 'debt_first' ? 'rgba(245, 158, 11, 0.15)' : 'rgba(0,0,0,0.3)',
                      border: settlementMode === 'debt_first' ? '1.5px solid #f59e0b' : '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      padding: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px'
                    }}
                  >
                    <input
                      type="radio"
                      name="settlementMode"
                      checked={settlementMode === 'debt_first'}
                      onChange={() => setSettlementMode('debt_first')}
                      style={{ marginTop: '3px', accentColor: '#f59e0b' }}
                    />
                    <div>
                      <div style={{ fontWeight: '800', fontSize: '0.88rem', color: '#fbbf24' }}>
                        خصم من مديونية الفاتورة أولاً
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#ccc', marginTop: '2px' }}>
                        {debtDeduction > 0 && `سيتم خصم ${debtDeduction.toLocaleString()} ج.م من المديونية`}
                        {cashRefund > 0 && `، ورد باقي المبلغ (${cashRefund.toLocaleString()} ج.م) كاش.`}
                      </div>
                    </div>
                  </label>

                  <label
                    style={{
                      background: settlementMode === 'cash' ? 'rgba(74, 222, 128, 0.15)' : 'rgba(0,0,0,0.3)',
                      border: settlementMode === 'cash' ? '1.5px solid #4ade80' : '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      padding: '12px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '10px'
                    }}
                  >
                    <input
                      type="radio"
                      name="settlementMode"
                      checked={settlementMode === 'cash'}
                      onChange={() => setSettlementMode('cash')}
                      style={{ marginTop: '3px', accentColor: '#4ade80' }}
                    />
                    <div>
                      <div style={{ fontWeight: '800', fontSize: '0.88rem', color: '#4ade80' }}>
                        رد نقدي فوري بالكامل من الخزينة
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#ccc', marginTop: '2px' }}>
                        رد كامل المبلغ ({totalRefundAmount.toLocaleString()} ج.م) كاش للعميل دون المساس بالمديونية.
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#86efac' }}>
                <CheckCircle size={16} />
                <span>الفاتورة مسددة بالكامل — سيتم رد المبلغ نقداً من الخزينة لحساب العميل.</span>
              </div>
            )}

            {/* Treasury Account Selection if Cash is being refunded */}
            {cashRefund > 0 && (
              <div style={{ background: 'rgba(0, 0, 0, 0.35)', border: '1px solid rgba(74, 222, 128, 0.3)', borderRadius: '12px', padding: '12px 14px' }}>
                <label style={{ fontSize: '0.8rem', color: '#4ade80', display: 'block', marginBottom: '6px', fontWeight: '800' }}>
                  اختر حساب الخزينة / المحفظة لخصم المرتجع النقدي ({cashRefund.toLocaleString()} ج.م):
                </label>
                <select
                  value={refundAccountId}
                  onChange={(e) => setRefundAccountId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: '#120703',
                    border: '1.5px solid #4ade80',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '0.85rem'
                  }}
                >
                  {treasuryAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({acc.type === 'cash' ? 'خزينة كاش' : acc.type === 'instapay' ? 'إنستاباي' : 'محفظة'})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Real-time What Will Happen Box */}
          <div
            style={{
              background: 'rgba(192, 132, 252, 0.08)',
              border: '1px solid rgba(192, 132, 252, 0.3)',
              borderRadius: '14px',
              padding: '12px 16px',
              fontSize: '0.82rem',
              lineHeight: 1.6
            }}
          >
            <div style={{ fontWeight: '900', color: '#e9d5ff', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={16} />
              <span>ماذا يحدث فور تأكيد المرتجع؟</span>
            </div>
            <div>
              • <strong>المخزون:</strong> ستتم زيادة رصيد المنتجات والتشغيلات فورياً بمقدار الكميات المرتجعة ({activeReturns.map(a => `${a.name} × ${a.qtyToReturn}`).join('، ') || 'لا يوجد'}).
            </div>
            <div>
              • <strong>المالية:</strong> {debtDeduction > 0 && `سيتم تخفيض مديونية العميل بمبلغ ${debtDeduction.toLocaleString()} ج.م.`} {cashRefund > 0 && `سيتم خصم رد نقدي بمبلغ ${cashRefund.toLocaleString()} ج.م من حساب الخزينة المحدد.`}
            </div>
          </div>

          {/* Return Reason */}
          <div>
            <label style={{ fontSize: '0.82rem', color: '#d4a373', display: 'block', marginBottom: '5px', fontWeight: '800' }}>
              سبب المرتجع *
            </label>
            <textarea
              required
              rows="2"
              value={returnReason}
              onChange={(e) => setReturnReason(e.target.value)}
              placeholder="اكتب سبب إرجاع الصنف بالتفصيل..."
              style={{
                width: '100%',
                padding: '10px 12px',
                background: '#0d0401',
                border: '1px solid rgba(212, 163, 115, 0.3)',
                borderRadius: '10px',
                color: '#ffffff',
                fontSize: '0.85rem',
                resize: 'vertical'
              }}
            />
          </div>

          {/* Footer Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(212, 163, 115, 0.3)',
                color: '#f5ebe1',
                borderRadius: '10px',
                padding: '10px 18px',
                fontWeight: '800',
                cursor: 'pointer'
              }}
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={activeReturns.length === 0}
              style={{
                background: activeReturns.length === 0
                  ? '#555'
                  : 'linear-gradient(135deg, #9333ea 0%, #7e22ce 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 24px',
                fontWeight: '900',
                fontSize: '0.92rem',
                cursor: activeReturns.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: activeReturns.length === 0 ? 'none' : '0 8px 24px rgba(147, 51, 234, 0.45)'
              }}
            >
              <RotateCcw size={18} />
              <span>تأكيد المرتجع وإعادة المخزون ({totalRefundAmount.toLocaleString()} ج.م) 🔄</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
