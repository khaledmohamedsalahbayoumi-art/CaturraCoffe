import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ShoppingBag,
  Plus,
  Trash2,
  Calendar,
  DollarSign,
  Package,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  Image,
  ArrowRight,
  Eye,
  Scale,
  X
} from 'lucide-react';

export const PurchasesView = () => {
  const {
    purchases,
    products,
    categories,
    addPurchaseInvoice
  } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // New Purchase Invoice Form State
  const [supplierName, setSupplierName] = useState('');
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [paymentChoice, setPaymentChoice] = useState('full'); // 'full' | 'partial'
  const [customPaidAmount, setCustomPaidAmount] = useState('');

  // Items rows
  const [items, setItems] = useState([
    {
      productId: '',
      name: '',
      unitType: 'weight', // 'weight' | 'piece'
      category: 'coffee',
      costPrice: '',
      suggestedSellingPrice: '',
      qty: 10,
      entryDate: new Date().toISOString().split('T')[0],
      expiryDate: '2027-06-30',
      image: '/caturra_ethiopia.jpg'
    }
  ]);

  // Handle item row change
  const handleItemChange = (index, field, value) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };

      // If user selected existing product, prefill info
      if (field === 'productId') {
        const prod = products.find(p => p.id === value);
        if (prod) {
          const isWeight = prod.unitType === 'weight' || prod.category === 'coffee';
          updated[index].name = prod.name;
          updated[index].category = prod.category;
          updated[index].unitType = isWeight ? 'weight' : 'piece';
          updated[index].costPrice = isWeight ? (prod.costPerKg || prod.costPrice * 4) : prod.costPrice;
          updated[index].suggestedSellingPrice = isWeight ? (prod.pricePerKg || prod.sellingPrice * 4) : prod.sellingPrice;
          updated[index].image = prod.image;
        }
      }
      return updated;
    });
  };

  // Add new item row
  const addItemRow = () => {
    setItems(prev => [
      ...prev,
      {
        productId: '',
        name: '',
        unitType: 'weight',
        category: 'coffee',
        costPrice: '',
        suggestedSellingPrice: '',
        qty: 10,
        entryDate: new Date().toISOString().split('T')[0],
        expiryDate: '2027-06-30',
        image: '/caturra_ethiopia.jpg'
      }
    ]);
  };

  // Remove item row
  const removeItemRow = (index) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  // Calculate invoice total
  const totalAmount = items.reduce((sum, item) => sum + (Number(item.costPrice || 0) * Number(item.qty || 0)), 0);
  const paidAmount = paymentChoice === 'full' ? totalAmount : (Number(customPaidAmount) || 0);
  const remainingAmount = Math.max(0, totalAmount - paidAmount);

  // Submit Purchase Invoice
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!supplierName) {
      alert('يرجى تحديد اسم المورد');
      return;
    }

    const invalidItem = items.find(it => !it.name || !it.costPrice || !it.qty);
    if (invalidItem) {
      alert('يرجى إكمال بيانات كافة الأصناف (الاسم، التكلفة، والكمية)');
      return;
    }

    addPurchaseInvoice({
      supplierName,
      invoiceNumber: supplierInvoiceNo || `PUR-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      date: invoiceDate,
      items,
      paidAmount,
      notes
    });

    alert('تم حفظ فاتورة المشتريات وترحيل الأصناف بنجاح للمخزن والمنتجات والمتجر!');
    setIsAddModalOpen(false);

    // Reset Form
    setSupplierName('');
    setSupplierInvoiceNo('');
    setNotes('');
    setPaymentChoice('full');
    setCustomPaidAmount('');
    setItems([
      {
        productId: '',
        name: '',
        unitType: 'weight',
        category: 'coffee',
        costPrice: '',
        suggestedSellingPrice: '',
        qty: 10,
        entryDate: new Date().toISOString().split('T')[0],
        expiryDate: '2027-06-30',
        image: '/caturra_ethiopia.jpg'
      }
    ]);
  };

  // Filter purchases
  const filteredPurchases = purchases.filter(p =>
    p.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Top Action Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ position: 'relative', width: '300px' }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', right: '12px', top: '12px' }} />
          <input
            type="text"
            placeholder="بحث بالمورد أو رقم الفاتورة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ paddingRight: '38px', height: '42px', borderRadius: '10px' }}
          />
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn btn-primary"
          style={{ height: '42px' }}
        >
          <Plus size={18} />
          <span>+ إضافة فاتورة مشتريات وتوريد مخزون</span>
        </button>
      </div>

      {/* Purchases History Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>رقم الفاتورة</th>
              <th>المورد</th>
              <th>تاريخ التوريد</th>
              <th>الأصناف والكميات</th>
              <th>إجمالي الفاتورة</th>
              <th>المدفوع للمورد</th>
              <th>المتبقي (آجل)</th>
              <th>الحالة</th>
              <th style={{ textAlign: 'center' }}>معاينة</th>
            </tr>
          </thead>
          <tbody>
            {filteredPurchases.map((pur) => (
              <tr key={pur.id}>
                <td>
                  <strong style={{ color: 'var(--mint-900)' }}>{pur.invoiceNumber}</strong>
                </td>
                <td>
                  <strong style={{ color: 'var(--text-main)' }}>{pur.supplierName}</strong>
                </td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.86rem' }}>
                  {pur.date}
                </td>
                <td style={{ fontSize: '0.84rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {pur.items.map((it, idx) => (
                      <span key={idx} style={{ color: 'var(--text-secondary)' }}>
                        • {it.name} ({it.qty} وحدة)
                      </span>
                    ))}
                  </div>
                </td>
                <td>
                  <strong style={{ fontSize: '0.98rem', color: 'var(--mint-900)' }}>
                    {pur.totalAmount} ج.م
                  </strong>
                </td>
                <td style={{ color: '#16a34a', fontWeight: '700' }}>
                  {pur.paidAmount} ج.م
                </td>
                <td>
                  {pur.remainingAmount > 0 ? (
                    <span style={{ color: '#dc2626', fontWeight: '700' }}>
                      {pur.remainingAmount} ج.م
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>0 ج.م</span>
                  )}
                </td>
                <td>
                  <span className={`badge ${pur.paymentStatus === 'paid' ? 'badge-mint' : 'badge-warning'}`}>
                    {pur.paymentStatus === 'paid' ? 'مسددة بالكامل' : 'سداد جزئي / آجل'}
                  </span>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <button
                    onClick={() => setSelectedPurchase(pur)}
                    className="btn btn-outline"
                    style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                  >
                    <Eye size={14} />
                    <span>التفاصيل</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredPurchases.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            لا توجد فواتير مشتريات مسجلة حالياً.
          </div>
        )}
      </div>

      {/* MODAL: ADD PURCHASE INVOICE */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div
            className="modal-content purchase-modal-container"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '14px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--mint-900)' }}>
                  إضافة فاتورة مشتريات جديدة
                </h3>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                  الأصناف ستضاف وتحدث في المنتجات والمخزن وتواريخ الصلاحية تلقائياً
                </p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="btn-icon" style={{ width: '32px', height: '32px' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Header Info */}
              <div className="purchase-header-grid">
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">اسم المورد / الشركة *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: شركة النيل لاستيراد البن الأخضر"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">رقم فاتورة المورد</label>
                  <input
                    type="text"
                    placeholder="PUR-00..."
                    value={supplierInvoiceNo}
                    onChange={(e) => setSupplierInvoiceNo(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">تاريخ الفاتورة والتوريد</label>
                  <input
                    type="date"
                    required
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Items Section */}
              <div className="purchase-items-box">
                <div className="purchase-items-header">
                  <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--mint-900)', margin: 0 }}>
                    أصناف الفاتورة والتكلفة وسعر البيع
                  </h4>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="btn btn-outline"
                    style={{ padding: '6px 12px', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Plus size={14} />
                    <span>+ إضافة صنف آخر</span>
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {items.map((item, idx) => (
                    <div key={idx} className="purchase-item-card">
                      {/* Row Header with Unit Type Switch & Delete action */}
                      <div className="purchase-item-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--mint-900)' }}>
                            الصنف رقم {idx + 1}
                          </span>
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItemRow(idx)}
                              style={{
                                background: '#fef2f2',
                                color: '#ef4444',
                                border: '1px solid #fecaca',
                                borderRadius: '6px',
                                padding: '3px 8px',
                                fontSize: '0.74rem',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                cursor: 'pointer',
                                fontWeight: '700'
                              }}
                              title="حذف هذا الصنف"
                            >
                              <Trash2 size={13} />
                              <span>حذف الصنف</span>
                            </button>
                          )}
                        </div>
                        
                        <div className="purchase-unit-toggle">
                          <button
                            type="button"
                            onClick={() => handleItemChange(idx, 'unitType', 'weight')}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '6px',
                              border: item.unitType === 'weight' ? '1.5px solid var(--mint-600)' : '1px solid var(--border-light)',
                              background: item.unitType === 'weight' ? 'var(--mint-100)' : '#ffffff',
                              color: item.unitType === 'weight' ? 'var(--mint-950)' : 'var(--text-muted)',
                              fontWeight: '700',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            ⚖️ بالوزن (كجم / جرام)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleItemChange(idx, 'unitType', 'piece')}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '6px',
                              border: item.unitType === 'piece' ? '1.5px solid var(--mint-600)' : '1px solid var(--border-light)',
                              background: item.unitType === 'piece' ? 'var(--mint-100)' : '#ffffff',
                              color: item.unitType === 'piece' ? 'var(--mint-950)' : 'var(--text-muted)',
                              fontWeight: '700',
                              fontSize: '0.75rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            📦 بالعدد (قطعة)
                          </button>
                        </div>
                      </div>

                      {/* Main Item fields */}
                      <div className="purchase-item-main-grid">
                        <div>
                          <label className="form-label" style={{ fontSize: '0.78rem' }}>اختر منتج حالي أو اكتب جديداً</label>
                          <select
                            value={item.productId}
                            onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                            className="form-select"
                            style={{ padding: '6px 10px', height: '38px', fontSize: '0.84rem' }}
                          >
                            <option value="">-- صنف جديد (اكتب اسمه أدناه) --</option>
                            {products.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.unitType === 'weight' ? `${p.stock} كجم` : `${p.stock} قطعة`} متوفر)
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="form-label" style={{ fontSize: '0.78rem' }}>اسم الصنف *</label>
                          <input
                            type="text"
                            required
                            placeholder="اسم المنتج"
                            value={item.name}
                            onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                            className="form-input"
                            style={{ padding: '6px 10px', height: '38px', fontSize: '0.84rem' }}
                          />
                        </div>

                        <div>
                          <label className="form-label" style={{ fontSize: '0.78rem' }}>
                            {item.unitType === 'weight' ? 'الكمية (بالـ كجم) *' : 'الكمية الموردة (قطع) *'}
                          </label>
                          <input
                            type="number"
                            required
                            min="0.5"
                            step={item.unitType === 'weight' ? '0.5' : '1'}
                            value={item.qty}
                            onChange={(e) => handleItemChange(idx, 'qty', Number(e.target.value))}
                            className="form-input"
                            style={{ padding: '6px 10px', height: '38px', fontSize: '0.84rem' }}
                          />
                          {item.unitType === 'weight' && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--mint-700)', marginTop: '2px', fontWeight: '600' }}>
                              (= {((Number(item.qty) || 0) * 1000).toLocaleString()} جرام)
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Pricing & Expiry Grid */}
                      <div className="purchase-item-pricing-grid">
                        <div>
                          <label className="form-label" style={{ fontSize: '0.76rem' }}>
                            {item.unitType === 'weight' ? 'تكلفة الكيلو (ج.م) *' : 'تكلفة القطعة (ج.م) *'}
                          </label>
                          <input
                            type="number"
                            required
                            min="0"
                            step="0.5"
                            placeholder="180"
                            value={item.costPrice}
                            onChange={(e) => handleItemChange(idx, 'costPrice', e.target.value)}
                            className="form-input"
                            style={{ padding: '6px 8px', height: '36px', fontSize: '0.84rem' }}
                          />
                        </div>

                        <div>
                          <label className="form-label" style={{ fontSize: '0.76rem', color: 'var(--mint-800)', fontWeight: '700' }}>
                            {item.unitType === 'weight' ? 'سعر بيع الكيلو (ج.م) *' : 'سعر بيع القطعة (ج.م) *'}
                          </label>
                          <input
                            type="number"
                            required
                            min="0"
                            step="0.5"
                            placeholder="320"
                            value={item.suggestedSellingPrice}
                            onChange={(e) => handleItemChange(idx, 'suggestedSellingPrice', e.target.value)}
                            className="form-input"
                            style={{ padding: '6px 8px', height: '36px', fontSize: '0.84rem', borderColor: 'var(--mint-400)', fontWeight: '700' }}
                          />
                        </div>

                        <div>
                          <label className="form-label" style={{ fontSize: '0.76rem' }}>تاريخ الصلاحية</label>
                          <input
                            type="date"
                            value={item.expiryDate}
                            onChange={(e) => handleItemChange(idx, 'expiryDate', e.target.value)}
                            className="form-input"
                            style={{ padding: '6px 8px', height: '36px', fontSize: '0.84rem' }}
                          />
                        </div>

                        <div>
                          <label className="form-label" style={{ fontSize: '0.76rem' }}>تاريخ دخول المخزن</label>
                          <input
                            type="date"
                            value={item.entryDate}
                            onChange={(e) => handleItemChange(idx, 'entryDate', e.target.value)}
                            className="form-input"
                            style={{ padding: '6px 8px', height: '36px', fontSize: '0.84rem' }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Settlement Options */}
              <div className="purchase-payment-card">
                <div className="purchase-payment-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.86rem', color: 'var(--text-muted)', fontWeight: '600' }}>إجمالي الفاتورة:</span>
                    <span style={{ fontWeight: '900', fontSize: '1.25rem', color: 'var(--mint-900)' }}>
                      {totalAmount.toLocaleString()} ج.م
                    </span>
                  </div>
                  
                  {/* Full vs Partial toggle */}
                  <div className="purchase-payment-toggle">
                    <button
                      type="button"
                      onClick={() => setPaymentChoice('full')}
                      className={`btn ${paymentChoice === 'full' ? 'btn-primary' : 'btn-outline'}`}
                      style={{ padding: '7px 14px', fontSize: '0.82rem', borderRadius: '8px' }}
                    >
                      سداد الفاتورة بالكامل
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentChoice('partial')}
                      className={`btn ${paymentChoice === 'partial' ? 'btn-primary' : 'btn-outline'}`}
                      style={{ padding: '7px 14px', fontSize: '0.82rem', borderRadius: '8px' }}
                    >
                      سداد جزء وتأجيل الباقي
                    </button>
                  </div>
                </div>

                {paymentChoice === 'partial' && (
                  <div className="purchase-partial-row">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#92400e' }}>
                        المبلغ المدفوع للمورد الآن (ج.م):
                      </label>
                      <input
                        type="number"
                        min="0"
                        max={totalAmount}
                        placeholder="0"
                        value={customPaidAmount}
                        onChange={(e) => setCustomPaidAmount(e.target.value)}
                        className="form-input"
                        style={{ maxWidth: '180px', height: '36px' }}
                      />
                    </div>
                    <div style={{ fontSize: '0.88rem', color: '#b45309', fontWeight: '700', padding: '6px 12px', background: 'rgba(255,255,255,0.7)', borderRadius: '8px', border: '1px solid #fde68a' }}>
                      المتبقي كمديونية للمورد: <span style={{ color: '#dc2626', fontSize: '1.05rem', fontWeight: '900' }}>{remainingAmount.toLocaleString()} ج.م</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Notes */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">ملاحظات الفاتورة</label>
                <input
                  type="text"
                  placeholder="ملاحظات الشحن، الجودة..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="form-input"
                />
              </div>

              {/* Submit Buttons */}
              <div className="purchase-modal-footer">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-outline" style={{ minHeight: '44px' }}>
                  إلغاء
                </button>
                <button type="submit" className="btn btn-primary" style={{ minHeight: '44px', padding: '10px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                  <CheckCircle size={18} />
                  <span>حفظ الفاتورة وترحيلها للمخزن والمنتجات</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* DETAIL MODAL FOR SELECTED PURCHASE */}
      {selectedPurchase && (
        <div className="modal-overlay" onClick={() => setSelectedPurchase(null)}>
          <div className="modal-content" style={{ maxWidth: '580px', padding: '24px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--mint-900)' }}>
                تفاصيل فاتورة المشتريات #{selectedPurchase.invoiceNumber}
              </h3>
              <button onClick={() => setSelectedPurchase(null)} className="btn-icon" style={{ width: '30px', height: '30px' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', fontSize: '0.88rem' }}>
                <div>المورد: <strong>{selectedPurchase.supplierName}</strong></div>
                <div>التاريخ: <strong>{selectedPurchase.date}</strong></div>
                {selectedPurchase.notes && <div>ملاحظات: {selectedPurchase.notes}</div>}
              </div>

              <h4 style={{ fontSize: '0.92rem', fontWeight: '700', marginTop: '6px' }}>الأصناف الموردة:</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {selectedPurchase.items.map((it, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--mint-50)', borderRadius: '8px', fontSize: '0.85rem' }}>
                    <div>
                      <strong>{it.name}</strong> ({it.qty} وحدة)
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>صلاحية: {it.expiryDate}</div>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div>التكلفة: {it.costPrice} ج.م</div>
                      <div style={{ color: 'var(--mint-700)', fontWeight: '700' }}>المجموع: {it.costPrice * it.qty} ج.م</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px dashed var(--border-light)', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontWeight: '800', fontSize: '1.05rem', color: 'var(--mint-900)' }}>
                <span>الإجمالي الكلي:</span>
                <span>{selectedPurchase.totalAmount} ج.م</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#16a34a' }}>
                <span>المدفوع:</span>
                <span>{selectedPurchase.paidAmount} ج.م</span>
              </div>
              {selectedPurchase.remainingAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#dc2626', fontWeight: '700' }}>
                  <span>المتبقي للمورد:</span>
                  <span>{selectedPurchase.remainingAmount} ج.م</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
