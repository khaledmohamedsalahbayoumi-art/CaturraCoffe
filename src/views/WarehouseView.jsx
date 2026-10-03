import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Warehouse as WarehouseIcon,
  Search,
  AlertTriangle,
  Clock,
  CheckCircle,
  Package,
  Calendar,
  Layers,
  Trash2,
  TrendingDown,
  X
} from 'lucide-react';

export const WarehouseView = () => {
  const {
    batches,
    products,
    nearExpiryBatches,
    lowStockAlerts,
    recordStockWaste,
    setActiveTab
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'expiring' | 'low' | 'good'
  const [wasteModalBatch, setWasteModalBatch] = useState(null);
  const [wasteQty, setWasteQty] = useState(1);
  const [wasteReason, setWasteReason] = useState('انتهاء صلاحية');

  // Filter batches
  const filteredBatches = batches.filter(b => {
    const matchesSearch = b.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          b.batchCode.toLowerCase().includes(searchQuery.toLowerCase());
    
    const isExpiring = nearExpiryBatches.some(nb => nb.id === b.id);
    const isLow = b.quantity <= 5;
    
    if (statusFilter === 'expiring') return matchesSearch && isExpiring;
    if (statusFilter === 'low') return matchesSearch && isLow;
    if (statusFilter === 'good') return matchesSearch && !isExpiring && !isLow;
    return matchesSearch;
  });

  // Handle Waste submission
  const handleWasteSubmit = (e) => {
    e.preventDefault();
    if (!wasteModalBatch) return;
    recordStockWaste(wasteModalBatch.id, Number(wasteQty), wasteReason);
    alert(`تم تسجيل إهلاك (${wasteQty}) وحدة من تشغيلة "${wasteModalBatch.batchCode}" وخصمها من المخزن.`);
    setWasteModalBatch(null);
    setWasteQty(1);
  };

  // Warehouse total metrics
  const totalStockUnits = batches.reduce((sum, b) => sum + Number(b.quantity || 0), 0);
  const totalStockValue = batches.reduce((sum, b) => sum + (Number(b.quantity || 0) * Number(b.costPrice || 0)), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Warehouse KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="card" style={{ padding: '18px 22px', borderLeft: '4px solid var(--mint-600)' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>إجمالي الوحدات في المخزن</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--text-main)', marginTop: '4px' }}>
            {totalStockUnits} <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>قطعة / كيس</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--mint-700)', marginTop: '4px' }}>
            موزعة على {batches.length} تشغيلة ودفعات
          </div>
        </div>

        <div className="card" style={{ padding: '18px 22px', borderLeft: '4px solid #0369a1' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>القيمة المالية للمخزون (بسعر التكلفة)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0369a1', marginTop: '4px' }}>
            {totalStockValue.toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>ج.م</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            أصول البضاعة الحالية بالمستودع
          </div>
        </div>

        <div className="card" style={{ padding: '18px 22px', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>دفعات قاربت على الانتهاء</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#b45309', marginTop: '4px' }}>
            {nearExpiryBatches.length} <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>دفعات</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#b45309', marginTop: '4px' }}>
            تحتاج لعروض ترويجية وتنشيط
          </div>
        </div>

        <div className="card" style={{ padding: '18px 22px', borderLeft: '4px solid #ef4444' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>أصناف تحت حد الطلب (نواقص)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#dc2626', marginTop: '4px' }}>
            {lowStockAlerts.length} <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>أصناف</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#dc2626', marginTop: '4px' }}>
            تحتاج إلى أوامر توريد ومشتريات
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', right: '12px', top: '12px' }} />
          <input
            type="text"
            placeholder="بحث باسم الصنف أو كود التشغيلة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ paddingRight: '38px', height: '42px', borderRadius: '10px' }}
          />
        </div>

        {/* Filter Buttons */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setStatusFilter('all')}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: statusFilter === 'all' ? '1.5px solid var(--mint-600)' : '1px solid var(--border-light)',
              background: statusFilter === 'all' ? 'var(--mint-600)' : '#ffffff',
              color: statusFilter === 'all' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: '700',
              fontSize: '0.84rem',
              cursor: 'pointer'
            }}
          >
            جميع الدفعات ({batches.length})
          </button>

          <button
            onClick={() => setStatusFilter('good')}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: statusFilter === 'good' ? '1.5px solid #16a34a' : '1px solid var(--border-light)',
              background: statusFilter === 'good' ? '#ecfdf5' : '#ffffff',
              color: statusFilter === 'good' ? '#054f30' : 'var(--text-secondary)',
              fontWeight: '700',
              fontSize: '0.84rem',
              cursor: 'pointer'
            }}
          >
            دفعات سليمة ومستقرة
          </button>

          <button
            onClick={() => setStatusFilter('expiring')}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: statusFilter === 'expiring' ? '1.5px solid #f59e0b' : '1px solid var(--border-light)',
              background: statusFilter === 'expiring' ? '#fffbeb' : '#ffffff',
              color: statusFilter === 'expiring' ? '#92400e' : 'var(--text-secondary)',
              fontWeight: '700',
              fontSize: '0.84rem',
              cursor: 'pointer'
            }}
          >
            ⚠️ قرب انتهاء الصلاحية ({nearExpiryBatches.length})
          </button>

          <button
            onClick={() => setStatusFilter('low')}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: statusFilter === 'low' ? '1.5px solid #ef4444' : '1px solid var(--border-light)',
              background: statusFilter === 'low' ? '#fef2f2' : '#ffffff',
              color: statusFilter === 'low' ? '#991b1b' : 'var(--text-secondary)',
              fontWeight: '700',
              fontSize: '0.84rem',
              cursor: 'pointer'
            }}
          >
            🚨 مخزون حرج / شارف على النفاد
          </button>
        </div>
      </div>

      {/* Batches Data Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>كود التشغيلة (Batch)</th>
              <th>اسم الصنف والمنتج</th>
              <th>تاريخ دخول المخزن</th>
              <th>تاريخ الصلاحية</th>
              <th>الكمية المتوفرة بالمخزن</th>
              <th>تكلفة الوحدة</th>
              <th>إجمالي القيمة</th>
              <th>حالة التشغيلة والتنبيهات</th>
              <th style={{ textAlign: 'center' }}>تسجيل تالف / هالك</th>
            </tr>
          </thead>
          <tbody>
            {filteredBatches.map((batch) => {
              const isNearExpiry = nearExpiryBatches.some(nb => nb.id === batch.id);
              const isCriticalLow = batch.quantity <= 5;
              const isDepleted = batch.quantity <= 0;

              return (
                <tr key={batch.id}>
                  <td>
                    <strong style={{ fontFamily: 'monospace', color: 'var(--mint-900)' }}>
                      {batch.batchCode}
                    </strong>
                  </td>
                  <td>
                    <strong style={{ color: 'var(--text-main)' }}>{batch.productName}</strong>
                  </td>
                  <td style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                    {batch.entryDate}
                  </td>
                  <td style={{ fontSize: '0.84rem', color: isNearExpiry ? '#dc2626' : 'var(--text-main)', fontWeight: isNearExpiry ? '700' : '500' }}>
                    {batch.expiryDate}
                    {isNearExpiry && (
                      <div style={{ fontSize: '0.72rem', color: '#b45309' }}>
                        ⚠️ يقترب من الانتهاء
                      </div>
                    )}
                  </td>
                  <td>
                    <strong style={{ fontSize: '1rem', color: isCriticalLow ? '#dc2626' : 'var(--mint-800)' }}>
                      {batch.quantity}
                    </strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}> وحدة</span>
                  </td>
                  <td style={{ fontSize: '0.86rem' }}>
                    {batch.costPrice} ج.م
                  </td>
                  <td>
                    <strong style={{ color: 'var(--mint-900)' }}>
                      {(batch.quantity * batch.costPrice).toLocaleString()} ج.م
                    </strong>
                  </td>
                  <td>
                    {isDepleted ? (
                      <span className="badge badge-danger">نفذت الدفعة</span>
                    ) : isNearExpiry ? (
                      <span className="badge badge-warning">تنبيه صلاحية</span>
                    ) : isCriticalLow ? (
                      <span className="badge badge-danger">مخزون حرج</span>
                    ) : (
                      <span className="badge badge-mint">سليم ومتاح</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => setWasteModalBatch(batch)}
                      disabled={isDepleted}
                      className="btn btn-outline"
                      style={{ padding: '6px 10px', fontSize: '0.78rem', color: '#dc2626', borderColor: '#fca5a5' }}
                      title="تسجيل تلفيات أو هالك"
                    >
                      <Trash2 size={14} />
                      <span>تسجيل هالك</span>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredBatches.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            لم يتم العثور على أي تشغيلات مطابقة.
          </div>
        )}
      </div>

      {/* MODAL: RECORD STOCK WASTE */}
      {wasteModalBatch && (
        <div className="modal-overlay" onClick={() => setWasteModalBatch(null)}>
          <div className="modal-content" style={{ maxWidth: '440px', padding: '24px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#dc2626' }}>
                تسجيل هالك / تالف من المخزن
              </h3>
              <button onClick={() => setWasteModalBatch(null)} className="btn-icon" style={{ width: '30px', height: '30px' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleWasteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: '#fef2f2', padding: '12px', borderRadius: '10px', border: '1px solid #fed7d7' }}>
                <div style={{ fontWeight: '700', fontSize: '0.9rem', color: '#991b1b' }}>
                  {wasteModalBatch.productName}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#b91c1c', marginTop: '2px' }}>
                  كود التشغيلة: {wasteModalBatch.batchCode} | الكمية الحالية: {wasteModalBatch.quantity}
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">الكمية التالفة / المراد إهلاكها *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={wasteModalBatch.quantity}
                  value={wasteQty}
                  onChange={e => setWasteQty(e.target.value)}
                  className="form-input"
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">سبب الإهلاك والتلف *</label>
                <select
                  value={wasteReason}
                  onChange={e => setWasteReason(e.target.value)}
                  className="form-select"
                >
                  <option value="انتهاء صلاحية">انتهاء صلاحية</option>
                  <option value="تلف أثناء النقل أو التخزين">تلف أثناء النقل أو التخزين</option>
                  <option value="كسر في الأدوات الزجاجية">كسر في الأدوات الزجاجية</option>
                  <option value="فحص جودة وتذوق مخبري">فحص جودة وتذوق مخبري (كابينج)</option>
                  <option value="أخرى">أسباب أخرى</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button type="button" onClick={() => setWasteModalBatch(null)} className="btn btn-outline">
                  إلغاء
                </button>
                <button type="submit" className="btn btn-danger">
                  تأكيد الخصم من المخزن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
