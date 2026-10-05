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
  X,
  ClipboardCheck,
  FileText,
  Check,
  RotateCcw,
  Sparkles,
  Plus,
  Minus
} from 'lucide-react';
import { exportStockAuditToPdf } from '../utils/exportUtils';

export const WarehouseView = () => {
  const {
    batches = [],
    products = [],
    categories = [],
    nearExpiryBatches = [],
    lowStockAlerts = [],
    recordStockWaste,
    reconcileInventoryAudit,
    contactInfo,
    currentUser,
    setActiveTab
  } = useApp();

  // Top Section Switcher: 'batches' | 'audit'
  const [activeWarehouseTab, setActiveWarehouseTab] = useState('batches');

  // Batches Tab State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'expiring' | 'low' | 'good'
  const [wasteModalBatch, setWasteModalBatch] = useState(null);
  const [wasteQty, setWasteQty] = useState(1);
  const [wasteReason, setWasteReason] = useState('انتهاء صلاحية');

  // Physical Inventory Audit Tab State
  const [auditCounts, setAuditCounts] = useState({});
  const [auditNotes, setAuditNotes] = useState({});
  const [auditorName, setAuditorName] = useState(() => currentUser?.name || 'مسؤول المخزن والجرد');
  const [auditFilter, setAuditFilter] = useState('all'); // 'all' | 'discrepancy' | 'deficit' | 'surplus' | 'match'
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [auditSavedSuccess, setAuditSavedSuccess] = useState(false);

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

  // Categories lookup map
  const catMap = Object.fromEntries(categories.map(c => [c.id, c.name]));

  // Audit Calculations
  const auditItems = products.map(p => {
    const systemStock = Number(p.stock) || 0;
    const actualStock = auditCounts[p.id] !== undefined ? Number(auditCounts[p.id]) : systemStock;
    const diff = Number((actualStock - systemStock).toFixed(2));
    const isWeight = p.unitType === 'weight';
    const costPrice = Number(isWeight ? (p.costPerKg || (p.costPrice * 4)) : p.costPrice) || 0;
    const diffValue = Math.round(diff * costPrice);

    return {
      id: p.id,
      sku: p.sku || `SKU-${p.id}`,
      name: p.name,
      nameEn: p.nameEn,
      categoryName: catMap[p.category] || p.category || 'عام',
      unitType: p.unitType,
      systemStock,
      actualStock,
      diff,
      costPrice,
      diffValue,
      notes: auditNotes[p.id] || '',
      status: diff === 0 ? 'match' : (diff < 0 ? 'deficit' : 'surplus')
    };
  });

  // Filtered audit items
  const filteredAuditItems = auditItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
                          item.sku.toLowerCase().includes(auditSearchQuery.toLowerCase());
    if (auditFilter === 'discrepancy') return matchesSearch && item.diff !== 0;
    if (auditFilter === 'deficit') return matchesSearch && item.diff < 0;
    if (auditFilter === 'surplus') return matchesSearch && item.diff > 0;
    if (auditFilter === 'match') return matchesSearch && item.diff === 0;
    return matchesSearch;
  });

  // Audit Summary KPIs
  const totalAuditItems = auditItems.length;
  const auditMatchedCount = auditItems.filter(i => i.diff === 0).length;
  const auditDeficitCount = auditItems.filter(i => i.diff < 0).length;
  const auditSurplusCount = auditItems.filter(i => i.diff > 0).length;
  const auditDiscrepancyCount = auditDeficitCount + auditSurplusCount;
  const totalAuditDiffValue = auditItems.reduce((sum, i) => sum + i.diffValue, 0);

  // Handle Count input changes
  const handleCountChange = (productId, val) => {
    const num = Math.max(0, Number(val) || 0);
    setAuditCounts(prev => ({ ...prev, [productId]: num }));
    setAuditSavedSuccess(false);
  };

  const handleStepCount = (productId, currentActual, delta) => {
    const nextVal = Math.max(0, Number((currentActual + delta).toFixed(2)));
    handleCountChange(productId, nextVal);
  };

  const handleQuickMatch = (productId, systemStock) => {
    setAuditCounts(prev => ({ ...prev, [productId]: systemStock }));
    setAuditSavedSuccess(false);
  };

  const handleMatchAll = () => {
    const reset = {};
    products.forEach(p => {
      reset[p.id] = Number(p.stock) || 0;
    });
    setAuditCounts(reset);
    setAuditSavedSuccess(false);
  };

  // Reconcile and save audit to actual system stock
  const handleReconcileStock = () => {
    if (window.confirm(`هل أنت متأكد من اعتماد وتسوية الجرد الفعلي؟\nسيتم تحديث أرصدة النظام بالكميات المجرودة فوراً.`)) {
      if (reconcileInventoryAudit) {
        reconcileInventoryAudit(auditItems);
      }
      setAuditSavedSuccess(true);
      setTimeout(() => setAuditSavedSuccess(false), 5000);
    }
  };

  // Export Audit to PDF
  const handleExportAuditPdf = () => {
    exportStockAuditToPdf({
      auditItems: filteredAuditItems,
      summary: {
        auditorName,
        auditDate: new Date().toLocaleString('ar-EG'),
        totalItems: totalAuditItems,
        matchedCount: auditMatchedCount,
        deficitCount: auditDeficitCount,
        surplusCount: auditSurplusCount,
        totalDiffValue: totalAuditDiffValue
      },
      contactInfo
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Warehouse Section Switcher */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '2px solid var(--border-light)',
        paddingBottom: '14px',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => setActiveWarehouseTab('batches')}
            style={{
              padding: '10px 20px',
              borderRadius: '12px',
              border: activeWarehouseTab === 'batches' ? '2px solid var(--mint-600)' : '1px solid var(--border-light)',
              background: activeWarehouseTab === 'batches' ? 'var(--mint-600)' : '#ffffff',
              color: activeWarehouseTab === 'batches' ? '#ffffff' : 'var(--text-main)',
              fontWeight: '800',
              fontSize: '0.9rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: activeWarehouseTab === 'batches' ? '0 3px 10px rgba(11,128,79,0.2)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <Layers size={18} />
            <span>تشغيل ومتابعة الدفعات والصلاحيات</span>
            <span style={{
              background: activeWarehouseTab === 'batches' ? 'rgba(255,255,255,0.25)' : 'var(--mint-100)',
              color: activeWarehouseTab === 'batches' ? '#ffffff' : 'var(--mint-800)',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '0.74rem'
            }}>
              {batches.length}
            </span>
          </button>

          <button
            onClick={() => setActiveWarehouseTab('audit')}
            style={{
              padding: '10px 20px',
              borderRadius: '12px',
              border: activeWarehouseTab === 'audit' ? '2px solid #0284c7' : '1px solid var(--border-light)',
              background: activeWarehouseTab === 'audit' ? '#0284c7' : '#ffffff',
              color: activeWarehouseTab === 'audit' ? '#ffffff' : 'var(--text-main)',
              fontWeight: '800',
              fontSize: '0.9rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              boxShadow: activeWarehouseTab === 'audit' ? '0 3px 10px rgba(2,132,199,0.25)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            <ClipboardCheck size={18} />
            <span>محضر جرد المخزن الفعلي ومطابقة الأرصدة 📋</span>
            <span style={{
              background: activeWarehouseTab === 'audit' ? 'rgba(255,255,255,0.25)' : '#e0f2fe',
              color: activeWarehouseTab === 'audit' ? '#ffffff' : '#0369a1',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '0.74rem'
            }}>
              {products.length} صنف
            </span>
          </button>
        </div>

        {activeWarehouseTab === 'audit' && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={handleExportAuditPdf}
              className="btn btn-outline"
              style={{
                height: '42px',
                padding: '0 18px',
                borderColor: '#ef4444',
                color: '#b91c1c',
                background: '#fef2f2',
                fontWeight: '800',
                fontSize: '0.86rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 2px 6px rgba(239,68,68,0.1)'
              }}
              title="تصدير كشف محضر الجرد الفعلي إلى ملف PDF رسمي معتمد"
            >
              <FileText size={18} color="#dc2626" />
              <span>تصدير كشف الجرد PDF 📄</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================== */}
      {/* SECTION 1: PHYSICAL INVENTORY AUDIT (جزء جرد المخزن الفعلي) */}
      {/* ========================================================== */}
      {activeWarehouseTab === 'audit' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Success Reconcile Banner */}
          {auditSavedSuccess && (
            <div style={{
              background: '#ecfdf5',
              border: '2px solid #10b981',
              borderRadius: '12px',
              padding: '14px 20px',
              color: '#065f46',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 4px 12px rgba(16,185,129,0.15)'
            }}>
              <CheckCircle size={22} color="#10b981" />
              <span>تم اعتماد محضر الجرد بنجاح وتسوية أرصدة المخزن والنظام بالأرقام الفعلية المجرودة!</span>
            </div>
          )}

          {/* Audit Top KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #64748b' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700' }}>إجمالي الأصناف المجرودة</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '900', color: 'var(--text-main)', marginTop: '4px' }}>
                {totalAuditItems} <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>صنف</span>
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                جميع المنتجات المسجلة
              </div>
            </div>

            <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #16a34a' }}>
              <div style={{ fontSize: '0.8rem', color: '#166534', fontWeight: '700' }}>أصناف مطابقة تماماً (✓)</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#16a34a', marginTop: '4px' }}>
                {auditMatchedCount} <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>صنف</span>
              </div>
              <div style={{ fontSize: '0.74rem', color: '#166534', marginTop: '2px' }}>
                نسبة دقة: {totalAuditItems > 0 ? Math.round((auditMatchedCount / totalAuditItems) * 100) : 0}%
              </div>
            </div>

            <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #dc2626' }}>
              <div style={{ fontSize: '0.8rem', color: '#991b1b', fontWeight: '700' }}>أصناف بها عجز (نقص)</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#dc2626', marginTop: '4px' }}>
                {auditDeficitCount} <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>أصناف</span>
              </div>
              <div style={{ fontSize: '0.74rem', color: '#991b1b', marginTop: '2px' }}>
                الفعلي أقل من الدفتري
              </div>
            </div>

            <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #0284c7' }}>
              <div style={{ fontSize: '0.8rem', color: '#0369a1', fontWeight: '700' }}>أصناف بها زيادة (فائض)</div>
              <div style={{ fontSize: '1.5rem', fontWeight: '900', color: '#0284c7', marginTop: '4px' }}>
                {auditSurplusCount} <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>أصناف</span>
              </div>
              <div style={{ fontSize: '0.74rem', color: '#0369a1', marginTop: '2px' }}>
                الفعلي أكثر من الدفتري
              </div>
            </div>

            <div className="card" style={{ padding: '16px 20px', borderLeft: `4px solid ${totalAuditDiffValue < 0 ? '#dc2626' : (totalAuditDiffValue > 0 ? '#0284c7' : '#16a34a')}` }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '700' }}>صافي الفارق المالي</div>
              <div style={{ 
                fontSize: '1.5rem', 
                fontWeight: '900', 
                color: totalAuditDiffValue < 0 ? '#dc2626' : (totalAuditDiffValue > 0 ? '#0284c7' : '#16a34a'), 
                marginTop: '4px' 
              }}>
                {totalAuditDiffValue > 0 ? `+${totalAuditDiffValue.toLocaleString()}` : totalAuditDiffValue.toLocaleString()} 
                <span style={{ fontSize: '0.85rem', fontWeight: '500' }}> ج.م</span>
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {totalAuditDiffValue < 0 ? 'عجز مالي يستلزم تدقيق' : (totalAuditDiffValue > 0 ? 'فائض مخزني إيجابي' : 'مطابقة مالية تامة')}
              </div>
            </div>
          </div>

          {/* Auditor Bar & Batch Controls */}
          <div style={{
            background: 'var(--mint-50)',
            border: '1px solid var(--border-mint)',
            borderRadius: '14px',
            padding: '14px 18px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: '800', fontSize: '0.88rem', color: 'var(--mint-950)' }}>
                👤 القائم بأعمال الجرد:
              </span>
              <input
                type="text"
                value={auditorName}
                onChange={e => setAuditorName(e.target.value)}
                placeholder="اسم مسؤول الجرد..."
                className="form-input"
                style={{ height: '36px', width: '220px', fontSize: '0.85rem', borderRadius: '8px' }}
              />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                📅 {new Date().toLocaleDateString('ar-EG')}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={handleMatchAll}
                className="btn btn-outline"
                style={{ height: '36px', fontSize: '0.8rem', gap: '6px', background: '#ffffff' }}
                title="تعبئة حقول الجرد الفعلي بالرصيد الدفتري الحالي"
              >
                <RotateCcw size={14} />
                <span>إعادة ضبط للأرصدة الدفترية</span>
              </button>

              <button
                type="button"
                onClick={handleReconcileStock}
                className="btn btn-primary"
                style={{ height: '36px', fontSize: '0.84rem', gap: '6px', background: '#059669', borderColor: '#059669' }}
                title="اعتماد وتحديث كميات المخزن بالنظام بناءً على الجرد الفعلي"
              >
                <Check size={16} />
                <span>اعتماد وتسوية الجرد الدفتري ✓</span>
              </button>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ position: 'relative', width: '320px' }}>
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', right: '12px', top: '12px' }} />
              <input
                type="text"
                placeholder="بحث باسم الصنف أو كود الـ SKU..."
                value={auditSearchQuery}
                onChange={(e) => setAuditSearchQuery(e.target.value)}
                className="form-input"
                style={{ paddingRight: '38px', height: '40px', borderRadius: '10px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setAuditFilter('all')}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: auditFilter === 'all' ? '1.5px solid var(--mint-600)' : '1px solid var(--border-light)',
                  background: auditFilter === 'all' ? 'var(--mint-600)' : '#ffffff',
                  color: auditFilter === 'all' ? '#ffffff' : 'var(--text-secondary)',
                  fontWeight: '700',
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                الكل ({auditItems.length})
              </button>

              <button
                onClick={() => setAuditFilter('discrepancy')}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: auditFilter === 'discrepancy' ? '1.5px solid #d97706' : '1px solid var(--border-light)',
                  background: auditFilter === 'discrepancy' ? '#fffbeb' : '#ffffff',
                  color: auditFilter === 'discrepancy' ? '#b45309' : 'var(--text-secondary)',
                  fontWeight: '700',
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                ⚠️ بها فروقات ({auditDiscrepancyCount})
              </button>

              <button
                onClick={() => setAuditFilter('deficit')}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: auditFilter === 'deficit' ? '1.5px solid #ef4444' : '1px solid var(--border-light)',
                  background: auditFilter === 'deficit' ? '#fef2f2' : '#ffffff',
                  color: auditFilter === 'deficit' ? '#dc2626' : 'var(--text-secondary)',
                  fontWeight: '700',
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                🚨 عجز فقط ({auditDeficitCount})
              </button>

              <button
                onClick={() => setAuditFilter('surplus')}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: auditFilter === 'surplus' ? '1.5px solid #0284c7' : '1px solid var(--border-light)',
                  background: auditFilter === 'surplus' ? '#f0f9ff' : '#ffffff',
                  color: auditFilter === 'surplus' ? '#0369a1' : 'var(--text-secondary)',
                  fontWeight: '700',
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                ⬆️ زيادة فقط ({auditSurplusCount})
              </button>

              <button
                onClick={() => setAuditFilter('match')}
                style={{
                  padding: '7px 14px',
                  borderRadius: '8px',
                  border: auditFilter === 'match' ? '1.5px solid #16a34a' : '1px solid var(--border-light)',
                  background: auditFilter === 'match' ? '#ecfdf5' : '#ffffff',
                  color: auditFilter === 'match' ? '#047857' : 'var(--text-secondary)',
                  fontWeight: '700',
                  fontSize: '0.82rem',
                  cursor: 'pointer'
                }}
              >
                ✓ مطابق ({auditMatchedCount})
              </button>
            </div>
          </div>

          {/* Audit Data Table */}
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '40px', textAlign: 'center' }}>#</th>
                  <th>كود الصنف (SKU)</th>
                  <th>اسم المنتج والتصنيف</th>
                  <th style={{ textAlign: 'center' }}>الرصيد الدفتري</th>
                  <th style={{ textAlign: 'center', width: '210px' }}>الجرد الفعلي المحصور</th>
                  <th style={{ textAlign: 'center' }}>الفارق</th>
                  <th style={{ textAlign: 'center' }}>حالة البند</th>
                  <th style={{ textAlign: 'center' }}>سعر التكلفة</th>
                  <th style={{ textAlign: 'center' }}>قيمة الفارق</th>
                  <th>ملاحظات وتبريرات الجرد</th>
                </tr>
              </thead>
              <tbody>
                {filteredAuditItems.map((item, idx) => {
                  const isDeficit = item.diff < 0;
                  const isSurplus = item.diff > 0;
                  const isMatch = item.diff === 0;

                  return (
                    <tr 
                      key={item.id}
                      style={{
                        background: isDeficit ? '#fff5f5' : (isSurplus ? '#f0f9ff' : undefined)
                      }}
                    >
                      <td style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                        {idx + 1}
                      </td>

                      <td>
                        <strong style={{ fontFamily: 'monospace', color: 'var(--mint-900)' }}>
                          {item.sku}
                        </strong>
                      </td>

                      <td>
                        <div style={{ fontWeight: '800', color: 'var(--text-main)' }}>
                          {item.name}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {item.unitType === 'weight' ? '⚖️ بالوزن (كجم)' : '📦 بالقطعة'} • {item.categoryName}
                        </div>
                      </td>

                      <td style={{ textAlign: 'center', fontWeight: '800', fontSize: '0.96rem', background: '#f8fafc' }}>
                        {item.systemStock} <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.unitType === 'weight' ? 'كجم' : 'ق'}</span>
                      </td>

                      {/* Actual Count Input with Step Buttons */}
                      <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <button
                            type="button"
                            onClick={() => handleStepCount(item.id, item.actualStock, -1)}
                            style={{
                              width: '26px',
                              height: '32px',
                              borderRadius: '6px',
                              border: '1px solid var(--border-light)',
                              background: '#ffffff',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="إنقاص 1"
                          >
                            <Minus size={13} />
                          </button>

                          <input
                            type="number"
                            min="0"
                            step={item.unitType === 'weight' ? '0.25' : '1'}
                            value={item.actualStock}
                            onChange={(e) => handleCountChange(item.id, e.target.value)}
                            style={{
                              width: '74px',
                              height: '32px',
                              textAlign: 'center',
                              fontWeight: '900',
                              fontSize: '0.95rem',
                              borderRadius: '6px',
                              border: isDeficit ? '2px solid #ef4444' : (isSurplus ? '2px solid #0284c7' : '1.5px solid #10b981'),
                              background: '#ffffff',
                              color: isDeficit ? '#b91c1c' : (isSurplus ? '#0369a1' : '#047857')
                            }}
                          />

                          <button
                            type="button"
                            onClick={() => handleStepCount(item.id, item.actualStock, 1)}
                            style={{
                              width: '26px',
                              height: '32px',
                              borderRadius: '6px',
                              border: '1px solid var(--border-light)',
                              background: '#ffffff',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="زيادة 1"
                          >
                            <Plus size={13} />
                          </button>

                          {!isMatch && (
                            <button
                              type="button"
                              onClick={() => handleQuickMatch(item.id, item.systemStock)}
                              style={{
                                padding: '4px 6px',
                                fontSize: '0.68rem',
                                borderRadius: '6px',
                                border: '1px solid #10b981',
                                background: '#ecfdf5',
                                color: '#047857',
                                cursor: 'pointer',
                                fontWeight: '700'
                              }}
                              title="مطابقة الفعلي مع الرصيد الدفتري"
                            >
                              مطابقة
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Variance / Discrepancy */}
                      <td style={{ textAlign: 'center' }}>
                        <strong style={{ 
                          fontSize: '1rem',
                          color: isDeficit ? '#dc2626' : (isSurplus ? '#0284c7' : '#16a34a')
                        }}>
                          {item.diff > 0 ? `+${item.diff}` : item.diff}
                        </strong>
                      </td>

                      {/* Status Badge */}
                      <td style={{ textAlign: 'center' }}>
                        {isMatch ? (
                          <span className="badge badge-mint" style={{ fontSize: '0.74rem' }}>مطابق ✓</span>
                        ) : isDeficit ? (
                          <span className="badge badge-danger" style={{ fontSize: '0.74rem' }}>عجز ({Math.abs(item.diff)})</span>
                        ) : (
                          <span className="badge" style={{ fontSize: '0.74rem', background: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd' }}>
                            زيادة (+{item.diff})
                          </span>
                        )}
                      </td>

                      <td style={{ textAlign: 'center', fontSize: '0.84rem' }}>
                        {item.costPrice} ج.م
                      </td>

                      {/* Discrepancy Financial Valuation */}
                      <td style={{ textAlign: 'center' }}>
                        <strong style={{ 
                          color: isDeficit ? '#dc2626' : (isSurplus ? '#0284c7' : 'var(--text-muted)'),
                          fontSize: '0.88rem'
                        }}>
                          {item.diffValue > 0 ? `+${item.diffValue.toLocaleString()}` : item.diffValue.toLocaleString()} ج.م
                        </strong>
                      </td>

                      {/* Notes Input */}
                      <td>
                        <input
                          type="text"
                          placeholder="ملاحظات الجرد أو سبب الفارق..."
                          value={item.notes}
                          onChange={(e) => {
                            const val = e.target.value;
                            setAuditNotes(prev => ({ ...prev, [item.id]: val }));
                          }}
                          className="form-input"
                          style={{ height: '32px', fontSize: '0.78rem', borderRadius: '6px', minWidth: '160px' }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* SECTION 2: BATCHES & SHELF LIFE (تشغيل ومتابعة الدفعات)   */}
      {/* ========================================================== */}
      {activeWarehouseTab === 'batches' && (
        <>
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
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
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
                          style={{
                            padding: '6px 12px',
                            fontSize: '0.78rem',
                            color: isDepleted ? '#94a3b8' : '#dc2626',
                            borderColor: isDepleted ? '#e2e8f0' : '#fca5a5'
                          }}
                          title="تسجيل كمية تالفة أو منتهية الصلاحية"
                        >
                          <Trash2 size={14} />
                          <span>إهلاك</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

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
