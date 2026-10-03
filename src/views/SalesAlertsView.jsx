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
          className="card"
          style={{
            background: 'linear-gradient(135deg, #fff5f5 0%, #ffffff 100%)',
            border: '1.5px solid #fecaca',
            borderRadius: '16px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={20} color="#dc2626" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#991b1b' }}>
                  تنبيهات نقص المخزون ({lowStockAlerts.length})
                </h3>
                <div style={{ fontSize: '0.78rem', color: '#b91c1c' }}>أصناف وصلت للحد الحرج وتوشك على النفاد</div>
              </div>
            </div>
            <span className="badge badge-danger">مخزون حرج</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '180px', overflowY: 'auto' }}>
            {lowStockAlerts.length === 0 ? (
              <div style={{ fontSize: '0.84rem', color: '#16a34a', padding: '10px 0' }}>
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
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: '#ffffff',
                    border: '1px solid #fed7d7'
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '0.86rem', color: '#1e293b' }}>{prod.name}</strong>
                    <div style={{ fontSize: '0.74rem', color: '#dc2626' }}>
                      المتبقي بالمخزن: <strong>{prod.stock}</strong> وحدة (حد التنبيه: {prod.minStockAlert})
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab('purchases')}
                    className="btn btn-outline"
                    style={{ padding: '4px 10px', fontSize: '0.78rem', borderColor: '#fca5a5', color: '#dc2626' }}
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
          className="card"
          style={{
            background: 'linear-gradient(135deg, #fffbeb 0%, #ffffff 100%)',
            border: '1.5px solid #fde68a',
            borderRadius: '16px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={20} color="#b45309" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#92400e' }}>
                  تنبيه الركود وخطر الهالك ({nearExpiryBatches.length + slowMovers.length})
                </h3>
                <div style={{ fontSize: '0.78rem', color: '#b45309' }}>دفعات تقترب من الصلاحية أو أصناف بطيئة البيع</div>
              </div>
            </div>
            <span className="badge badge-warning">توصية عروض</span>
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
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: '#ffffff',
                    border: '1px solid #fef08a'
                  }}
                >
                  <div>
                    <strong style={{ fontSize: '0.86rem', color: '#1e293b' }}>{b.productName}</strong>
                    <div style={{ fontSize: '0.74rem', color: '#b45309' }}>
                      انتهاء الصلاحية: <strong>{b.expiryDate}</strong> | الكمية: {b.quantity}
                    </div>
                  </div>
                  {matchedProd && (
                    <button
                      onClick={() => setPromoModalProduct(matchedProd)}
                      className="btn btn-primary"
                      style={{ padding: '4px 10px', fontSize: '0.76rem', background: '#d97706', borderColor: '#b45309' }}
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
                  padding: '8px 12px',
                  borderRadius: '8px',
                  background: '#ffffff',
                  border: '1px solid #fef08a'
                }}
              >
                <div>
                  <strong style={{ fontSize: '0.86rem', color: '#1e293b' }}>{prod.name}</strong>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    صنف راكد (مبيعات منخفضة: {prod.salesCount || 0} طلب) | المخزون: {prod.stock}
                  </div>
                </div>
                <button
                  onClick={() => setPromoModalProduct(prod)}
                  className="btn btn-outline"
                  style={{ padding: '4px 10px', fontSize: '0.76rem', borderColor: '#f59e0b', color: '#b45309' }}
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
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={22} color="var(--mint-600)" />
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--mint-900)' }}>
                الأصناف الأكثر مبيعاً في كاتورا (Top Sellers)
              </h3>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              ترتيب الأصناف بحسب الإقبال وحجم المبيعات والأرباح الناتجة
            </p>
          </div>
          <span className="badge badge-mint">بيانات فورية</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {topSellers.map((prod, index) => {
            const revenue = (prod.salesCount || 0) * prod.sellingPrice;
            const profit = (prod.salesCount || 0) * (prod.sellingPrice - prod.costPrice);

            return (
              <div
                key={prod.id}
                style={{
                  padding: '16px',
                  borderRadius: '14px',
                  background: index === 0 ? 'linear-gradient(135deg, var(--mint-50) 0%, #ffffff 100%)' : '#fafbfc',
                  border: index === 0 ? '1.5px solid var(--mint-400)' : '1px solid var(--border-light)',
                  position: 'relative'
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
                    backgroundColor: index === 0 ? '#fbbf24' : index === 1 ? '#94a3b8' : index === 2 ? '#b45309' : 'var(--mint-200)',
                    color: '#ffffff',
                    fontWeight: '800',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                  }}
                >
                  {index + 1}
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <img
                    src={prod.image || '/caturra_ethiopia.jpg'}
                    alt={prod.name}
                    style={{ width: '56px', height: '56px', borderRadius: '10px', objectFit: 'cover', border: '1px solid var(--border-light)' }}
                  />
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.74rem', color: 'var(--mint-700)', fontWeight: '700' }}>
                      المرتبة {index + 1}
                    </div>
                    <h4 style={{ fontSize: '0.92rem', fontWeight: '800', color: 'var(--text-main)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                      {prod.name}
                    </h4>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      تم بيع: <strong style={{ color: 'var(--mint-800)' }}>{prod.salesCount || 0}</strong> وحدة
                    </div>
                  </div>
                </div>

                {/* Financial Breakdown */}
                <div
                  style={{
                    marginTop: '12px',
                    paddingTop: '10px',
                    borderTop: '1px dashed var(--border-light)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.8rem'
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>إيرادات: </span>
                    <strong style={{ color: 'var(--text-main)' }}>{revenue.toLocaleString()} ج.م</strong>
                  </div>
                  <div>
                    <span style={{ color: '#16a34a' }}>الأرباح: </span>
                    <strong style={{ color: '#16a34a' }}>+{profit.toLocaleString()} ج.م</strong>
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
          <div className="modal-content" style={{ maxWidth: '440px', padding: '24px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Zap size={20} color="#d97706" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--mint-900)' }}>
                  إنشاء عرض ترويجي فوري للصنف
                </h3>
              </div>
              <button onClick={() => setPromoModalProduct(null)} className="btn-icon" style={{ width: '30px', height: '30px' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleApplyPromo} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px' }}>
                <div style={{ fontWeight: '700', fontSize: '0.92rem' }}>{promoModalProduct.name}</div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  السعر الحالي: <strong>{promoModalProduct.sellingPrice} ج.م</strong> | التكلفة: {promoModalProduct.costPrice} ج.م
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">نسبة الخصم المئوية المراد تطبيقها (%)</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  {[10, 15, 20, 30].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setPromoPercent(val)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '8px',
                        border: promoPercent === val ? '2px solid var(--mint-600)' : '1px solid var(--border-light)',
                        background: promoPercent === val ? 'var(--mint-100)' : '#ffffff',
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
                    style={{ width: '80px', height: '36px', textAlign: 'center' }}
                  />
                </div>
              </div>

              {/* Price Preview */}
              <div style={{ background: 'var(--mint-50)', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-mint)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                  <span>السعر المخفض الجديد:</span>
                  <strong style={{ color: 'var(--mint-700)', fontSize: '1.1rem' }}>
                    {Math.round(promoModalProduct.sellingPrice * (1 - promoPercent / 100))} ج.م
                  </strong>
                </div>
                <div style={{ fontSize: '0.74rem', color: '#16a34a', marginTop: '2px' }}>
                  هامش الربح بعد الخصم: +{Math.round((promoModalProduct.sellingPrice * (1 - promoPercent / 100)) - promoModalProduct.costPrice)} ج.م
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button type="button" onClick={() => setPromoModalProduct(null)} className="btn btn-outline">
                  إلغاء
                </button>
                <button type="submit" className="btn btn-primary">
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
