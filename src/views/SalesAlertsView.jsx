import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  TrendingUp,
  AlertTriangle,
  Clock,
  Sparkles,
  Tag,
  ArrowRight,
  Package,
  ShoppingBag,
  Award,
  Zap,
  CheckCircle,
  Percent,
  X
} from 'lucide-react';

export const SalesAlertsView = () => {
  const {
    products,
    batches,
    invoices,
    lowStockAlerts,
    nearExpiryBatches,
    applyPromoDiscount,
    setActiveTab
  } = useApp();

  const [promoModalProduct, setPromoModalProduct] = useState(null);
  const [promoPercent, setPromoPercent] = useState(20);

  // Calculate Top Selling Products
  const sortedBySales = [...products].sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));
  const topSellers = sortedBySales.slice(0, 5);

  // Slow-moving products (products with stock > 0 but low salesCount)
  const slowMovers = products.filter(p => p.stock > 5 && (p.salesCount || 0) < 50);

  // Handle apply promo
  const handleApplyPromo = (e) => {
    e.preventDefault();
    if (!promoModalProduct) return;
    applyPromoDiscount(promoModalProduct.id, Number(promoPercent));
    alert(`تم تطبيق خصم ${promoPercent}% بنجاح على "${promoModalProduct.name}". سيظهر السعر الجديد وعلامة العرض الترويجي في نقطة البيع ومتجر العملاء فوراً!`);
    setPromoModalProduct(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* SMART ALERT BANNERS SECTION */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
        
        {/* Low Stock Urgent Alert Card */}
        <div
          className="card sales-alert-urgent-card"
          style={{
            background: 'linear-gradient(135deg, rgba(46, 16, 12, 0.92) 0%, rgba(32, 12, 8, 0.98) 100%)',
            border: '1.5px solid rgba(239, 68, 68, 0.35)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5), 0 0 16px rgba(239, 68, 68, 0.08)',
            borderRadius: '16px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.16)', border: '1px solid rgba(239, 68, 68, 0.32)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={20} color="#f87171" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#fecaca', margin: 0 }}>
                  تنبيهات نقص المخزون ({lowStockAlerts.length})
                </h3>
                <div style={{ fontSize: '0.78rem', color: '#fca5a5', marginTop: '2px' }}>أصناف وصلت للحد الحرج وتوشك على النفاد</div>
              </div>
            </div>
            <span style={{
              background: 'rgba(239, 68, 68, 0.18)',
              border: '1px solid rgba(239, 68, 68, 0.45)',
              color: '#fca5a5',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: '800'
            }}>
              مخزون حرج
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
            {lowStockAlerts.length === 0 ? (
              <div style={{ fontSize: '0.84rem', color: '#4ade80', padding: '10px 0', textAlign: 'center' }}>
                ✓ جميع الأصناف متوفرة بكميات كافية وآمنة في المخزن.
              </div>
            ) : (
              lowStockAlerts.map(prod => (
                <div
                  key={prod.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    background: 'rgba(20, 8, 4, 0.85)',
                    border: '1px solid rgba(239, 68, 68, 0.22)'
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '0.88rem', color: '#f5ebe1' }}>{prod.name}</strong>
                    <div style={{ fontSize: '0.76rem', color: '#f87171', marginTop: '2px' }}>
                      المتبقي بالمخزن: <strong style={{ color: '#ffffff' }}>{prod.stock}</strong> وحدة (حد التنبيه: {prod.minStockAlert})
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('purchases')}
                    className="btn btn-outline"
                    style={{
                      padding: '5px 12px',
                      fontSize: '0.78rem',
                      fontWeight: '700',
                      borderColor: 'rgba(239, 68, 68, 0.45)',
                      color: '#fca5a5',
                      background: 'rgba(239, 68, 68, 0.12)',
                      borderRadius: '8px'
                    }}
                  >
                    طلب توريد
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Slow Moving & Expiry Risk Card (Smart Promo Launcher) */}
        <div
          className="card sales-alert-warning-card"
          style={{
            background: 'linear-gradient(135deg, rgba(46, 26, 12, 0.92) 0%, rgba(32, 16, 8, 0.98) 100%)',
            border: '1.5px solid rgba(245, 158, 11, 0.35)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.5), 0 0 16px rgba(245, 158, 11, 0.08)',
            borderRadius: '16px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.16)', border: '1px solid rgba(245, 158, 11, 0.32)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={20} color="#fbbf24" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#fef3c7', margin: 0 }}>
                  تنبيه الركود وخطر الهالك ({nearExpiryBatches.length + slowMovers.length})
                </h3>
                <div style={{ fontSize: '0.78rem', color: '#fde68a', marginTop: '2px' }}>دفعات تقترب من الصلاحية أو أصناف بطيئة البيع</div>
              </div>
            </div>
            <span style={{
              background: 'rgba(245, 158, 11, 0.18)',
              border: '1px solid rgba(245, 158, 11, 0.45)',
              color: '#fbbf24',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: '800'
            }}>
              توصية عروض
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
            {nearExpiryBatches.map(b => {
              const matchedProd = products.find(p => p.id === b.productId);
              return (
                <div
                  key={b.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    background: 'rgba(20, 8, 4, 0.85)',
                    border: '1px solid rgba(245, 158, 11, 0.22)'
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '0.88rem', color: '#f5ebe1' }}>{b.productName}</strong>
                    <div style={{ fontSize: '0.76rem', color: '#fbbf24', marginTop: '2px' }}>
                      انتهاء الصلاحية: <strong style={{ color: '#ffffff' }}>{b.expiryDate}</strong> | الكمية: {b.quantity}
                    </div>
                  </div>
                  {matchedProd && (
                    <button
                      onClick={() => setPromoModalProduct(matchedProd)}
                      className="btn btn-primary"
                      style={{
                        padding: '5px 12px',
                        fontSize: '0.76rem',
                        fontWeight: '700',
                        background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                        border: '1px solid #f59e0b',
                        color: '#ffffff',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Zap size={13} />
                      <span>عمل عرض وتخفيض</span>
                    </button>
                  )}
                </div>
              );
            })}

            {slowMovers.map(prod => (
              <div
                key={prod.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '9px 12px',
                  borderRadius: '10px',
                  background: 'rgba(20, 8, 4, 0.85)',
                  border: '1px solid rgba(212, 163, 115, 0.2)'
                }}
              >
                <div>
                  <strong style={{ fontSize: '0.88rem', color: '#f5ebe1' }}>{prod.name}</strong>
                  <div style={{ fontSize: '0.76rem', color: '#a89080', marginTop: '2px' }}>
                    صنف راكد (مبيعات منخفضة: {prod.salesCount || 0} طلب) | المخزون: {prod.stock}
                  </div>
                </div>
                <button
                  onClick={() => setPromoModalProduct(prod)}
                  className="btn btn-outline"
                  style={{
                    padding: '5px 12px',
                    fontSize: '0.76rem',
                    fontWeight: '700',
                    borderColor: 'rgba(245, 158, 11, 0.45)',
                    color: '#fbbf24',
                    background: 'rgba(245, 158, 11, 0.12)',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Tag size={13} />
                  <span>تنشيط بعرض ترويجي</span>
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* TOP SELLING PRODUCTS SECTION */}
      <div
        className="card top-sellers-main-card"
        style={{
          padding: '24px',
          background: '#FFFDF9',
          border: '1.5px solid #EDD9BD',
          borderRadius: '16px',
          boxShadow: '0 8px 30px rgba(74, 50, 32, 0.08)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(251, 191, 36, 0.15)', border: '1px solid rgba(251, 191, 36, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Award size={20} color="#fbbf24" />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#f5ebe1', margin: 0 }}>
                الأصناف الأكثر مبيعاً في كاتورا (Top Sellers)
              </h3>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#a89080', marginTop: '4px', margin: 0 }}>
              ترتيب الأصناف بحسب الإقبال وحجم المبيعات والأرباح الناتجة
            </p>
          </div>
          <span style={{
            background: 'rgba(194, 123, 56, 0.18)',
            border: '1px solid rgba(212, 163, 115, 0.35)',
            color: '#e6b87d',
            padding: '5px 14px',
            borderRadius: '20px',
            fontSize: '0.78rem',
            fontWeight: '800'
          }}>
            بيانات فورية
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {topSellers.map((prod, index) => {
            const revenue = (prod.salesCount || 0) * prod.sellingPrice;
            const profit = (prod.salesCount || 0) * (prod.sellingPrice - prod.costPrice);

            return (
              <div
                key={prod.id}
                className="top-seller-product-card"
                style={{
                  padding: '16px',
                  borderRadius: '14px',
                  background: index === 0
                    ? 'linear-gradient(135deg, rgba(62, 30, 16, 0.95) 0%, rgba(38, 18, 9, 0.98) 100%)'
                    : 'linear-gradient(135deg, rgba(38, 18, 10, 0.88) 0%, rgba(26, 11, 6, 0.92) 100%)',
                  border: index === 0
                    ? '1.5px solid rgba(251, 191, 36, 0.48)'
                    : '1px solid rgba(212, 163, 115, 0.2)',
                  boxShadow: index === 0
                    ? '0 8px 24px rgba(0, 0, 0, 0.5), 0 0 16px rgba(251, 191, 36, 0.12)'
                    : '0 4px 16px rgba(0, 0, 0, 0.4)',
                  position: 'relative',
                  transition: 'transform 0.2s, box-shadow 0.2s'
                }}
              >
                {/* Ranking Medal */}
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: index === 0
                      ? 'linear-gradient(135deg, #fbbf24, #d97706)'
                      : index === 1
                      ? 'linear-gradient(135deg, #e2e8f0, #94a3b8)'
                      : index === 2
                      ? 'linear-gradient(135deg, #d97706, #92400e)'
                      : 'rgba(212, 163, 115, 0.2)',
                    color: index === 0 ? '#1a0a04' : index === 1 ? '#0f172a' : '#ffffff',
                    border: (index === 0 || index === 1 || index === 2) ? 'none' : '1px solid rgba(212, 163, 115, 0.3)',
                    fontWeight: '800',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: index === 0 ? '0 2px 8px rgba(251, 191, 36, 0.5)' : '0 2px 6px rgba(0, 0, 0, 0.35)'
                  }}
                >
                  {index + 1}
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <img
                    src={prod.image || '/caturra_ethiopia.jpg'}
                    alt={prod.name}
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '10px',
                      objectFit: 'cover',
                      border: '1px solid rgba(212, 163, 115, 0.22)'
                    }}
                  />
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.74rem', color: '#e6b87d', fontWeight: '800' }}>
                      المرتبة {index + 1}
                    </div>
                    <h4 style={{
                      fontSize: '0.94rem',
                      fontWeight: '800',
                      color: '#ffffff',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      margin: '2px 0 0 0'
                    }}>
                      {prod.name}
                    </h4>
                    <div style={{ fontSize: '0.8rem', color: '#d4a373', marginTop: '3px' }}>
                      تم بيع: <strong style={{ color: '#ffffff' }}>{prod.salesCount || 0}</strong> وحدة
                    </div>
                  </div>
                </div>

                {/* Financial Breakdown */}
                <div
                  style={{
                    marginTop: '12px',
                    paddingTop: '10px',
                    borderTop: '1px dashed rgba(212, 163, 115, 0.2)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.8rem'
                  }}
                >
                  <div>
                    <span style={{ color: '#a89080' }}>إيرادات: </span>
                    <strong style={{ color: '#f5ebe1' }}>{revenue.toLocaleString()} ج.م</strong>
                  </div>
                  <div>
                    <span style={{ color: '#4ade80' }}>الأرباح: </span>
                    <strong style={{ color: '#4ade80', fontWeight: '800' }}>+{profit.toLocaleString()} ج.م</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* PROMO DISCOUNT MODAL */}
      {promoModalProduct && (
        <div className="modal-overlay" onClick={() => setPromoModalProduct(null)}>
          <div
            className="modal-content"
            style={{
              maxWidth: '440px',
              padding: '24px',
              background: '#FFFDF9',
              border: '1.5px solid #EDD9BD',
              borderRadius: '16px',
              boxShadow: '0 16px 48px rgba(74, 50, 32, 0.15)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #EDD9BD', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={20} color="#96663B" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#4A3220', margin: 0 }}>
                  إنشاء عرض ترويجي فوري للصنف
                </h3>
              </div>
              <button onClick={() => setPromoModalProduct(null)} className="btn-icon" style={{ width: '30px', height: '30px', color: '#96663B' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleApplyPromo} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: '#FFF8EE', border: '1px solid #EDD9BD', padding: '12px', borderRadius: '10px' }}>
                <div style={{ fontWeight: '800', fontSize: '0.94rem', color: '#4A3220' }}>{promoModalProduct.name}</div>
                <div style={{ fontSize: '0.82rem', color: '#6B4A2E', marginTop: '4px' }}>
                  السعر الحالي: <strong style={{ color: '#4A3220' }}>{promoModalProduct.sellingPrice} ج.م</strong> | التكلفة: <strong style={{ color: '#4A3220' }}>{promoModalProduct.costPrice} ج.م</strong>
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ color: '#4A3220', fontWeight: '700' }}>نسبة الخصم المئوية المراد تطبيقها (%)</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '6px' }}>
                  {[10, 15, 20, 30].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setPromoPercent(val)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '8px',
                        border: promoPercent === val ? '1.5px solid #96663B' : '1px solid #EDD9BD',
                        background: promoPercent === val ? 'linear-gradient(135deg, #96663B 0%, #7A5230 100%)' : '#FFF8EE',
                        color: promoPercent === val ? '#FFFDF9' : '#4A3220',
                        fontWeight: '700',
                        fontSize: '0.85rem',
                        cursor: 'pointer'
                      }}
                    >
                      {val}%
                    </button>
                  ))}
                  <input
                    type="number"
                    min="1"
                    max="90"
                    value={promoPercent}
                    onChange={e => setPromoPercent(Number(e.target.value))}
                    className="form-input"
                    style={{ width: '80px', height: '36px', textAlign: 'center', background: '#FFFDF9', color: '#4A3220', border: '1px solid #EDD9BD' }}
                  />
                </div>
              </div>

              {/* Price Preview */}
              <div style={{ background: '#FFF8EE', padding: '12px 14px', borderRadius: '10px', border: '1px solid #EDD9BD' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                  <span style={{ color: '#6B4A2E' }}>السعر المخفض الجديد:</span>
                  <strong style={{ color: '#96663B', fontSize: '1.1rem' }}>
                    {Math.round(promoModalProduct.sellingPrice * (1 - promoPercent / 100))} ج.م
                  </strong>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#3d6a3c', marginTop: '3px', fontWeight: '700' }}>
                  هامش الربح بعد الخصم: +{Math.round((promoModalProduct.sellingPrice * (1 - promoPercent / 100)) - promoModalProduct.costPrice)} ج.م
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button type="button" onClick={() => setPromoModalProduct(null)} className="btn btn-outline" style={{ borderColor: '#EDD9BD', color: '#6B4A2E' }}>
                  إلغاء
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #96663B 0%, #7A5230 100%)', border: 'none' }}>
                  <CheckCircle size={16} />
                  <span>تفعيل العرض في المتجر والـ POS فوراً</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
