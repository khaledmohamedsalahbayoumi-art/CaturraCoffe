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
  X,
  Printer,
  Landmark,
  Wallet
} from 'lucide-react';
import { printPurchaseInvoice } from '../utils/exportUtils';
import { toLatinDigits } from '../utils/numberEnforcer';

export const PurchasesView = () => {
  const {
    purchases,
    products,
    categories,
    suppliers = [],
    contactInfo,
    addPurchaseInvoice,
    treasuryAccounts = [],
    getTreasuryAccountBalance
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
  const [selectedTreasuryId, setSelectedTreasuryId] = useState('');

  const selectedTreasuryAccount = treasuryAccounts.find(a => a.id === selectedTreasuryId) ||
    treasuryAccounts.find(a => a.isDefault) ||
    treasuryAccounts[0] ||
    { id: 'acc-cash-main', name: 'الخزينة الرئيسية (درج الكاش)', type: 'cash' };

  const selectedAccountBalance = getTreasuryAccountBalance ? getTreasuryAccountBalance(selectedTreasuryAccount.id) : 0;

  // Items rows
  const [items, setItems] = useState([
    {
      productId: '',
      name: '',
      unitType: 'weight', // 'weight' | 'piece'
      category: 'specialty',
      costPrice: '',
      suggestedSellingPrice: '',
      qty: '10',
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
          const isWeight = prod.unitType === 'weight' || prod.category === 'specialty' || prod.category === 'classic_blends' || prod.category === 'coffee' || prod.category === 'espresso' || prod.category === 'filter';
          updated[index].name = prod.name;
          updated[index].category = prod.category;
          updated[index].unitType = isWeight ? 'weight' : 'piece';
          updated[index].costPrice = String(isWeight ? (prod.costPerKg || prod.costPrice * 4) : prod.costPrice);
          updated[index].suggestedSellingPrice = String(isWeight ? (prod.pricePerKg || prod.sellingPrice * 4) : prod.sellingPrice);
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
        category: 'specialty',
        costPrice: '',
        suggestedSellingPrice: '',
        qty: '10',
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

    const invalidItem = items.find(it => !it.name || !it.costPrice || Number(it.qty || 0) <= 0);
    if (invalidItem) {
      alert('يرجى إكمال بيانات كافة الأصناف (الاسم، التكلفة، والكمية أكبر من صفر)');
      return;
    }

    addPurchaseInvoice({
      supplierName,
      invoiceNumber: supplierInvoiceNo || `PUR-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      date: invoiceDate,
      items: items.map(it => ({
        ...it,
        costPrice: Number(it.costPrice || 0),
        suggestedSellingPrice: Number(it.suggestedSellingPrice || 0),
        qty: Number(it.qty || 1)
      })),
      paidAmount,
      paymentMethod: selectedTreasuryAccount.type || 'cash',
      treasuryAccountId: selectedTreasuryAccount.id,
      notes
    });

    if (paidAmount > 0) {
      alert(`تم حفظ فاتورة المشتريات وترحيل الأصناف للمخزن، وتم خصم مبلغ (${paidAmount.toLocaleString()} ج.م) بنجاح من "${selectedTreasuryAccount.name}".`);
    } else {
      alert('تم حفظ فاتورة المشتريات كفاتورة آجلة وترحيل الأصناف بنجاح للمخزن، وتسجيل المديونية لصالح المورد.');
    }
    setIsAddModalOpen(false);

    // Reset Form
    setSupplierName('');
    setSupplierInvoiceNo('');
    setNotes('');
    setPaymentChoice('full');
    setCustomPaidAmount('');
    setSelectedTreasuryId(treasuryAccounts.find(a => a.isDefault)?.id || treasuryAccounts[0]?.id || 'acc-cash-main');
    setItems([
      {
        productId: '',
        name: '',
        unitType: 'weight',
        category: 'specialty',
        costPrice: '',
        suggestedSellingPrice: '',
        qty: '10',
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #EDD9BD', paddingBottom: '14px', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#4A3220', display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
                  <ShoppingBag size={22} color="#96663B" />
                  <span>إضافة فاتورة مشتريات جديدة</span>
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#6B4A2E', margin: '4px 0 0' }}>
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
                  <label className="form-label" style={{ color: '#4A3220', fontWeight: '700' }}>اسم المورد / الشركة *</label>
                  <input
                    type="text"
                    required
                    list="purchases-suppliers-list"
                    placeholder="مثال: شركة النيل لاستيراد البن الأخضر"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    className="form-input"
                  />
                  <datalist id="purchases-suppliers-list">
                    {(suppliers || []).map(s => (
                      <option key={s.id} value={s.name}>{s.category ? `(${s.category})` : ''}</option>
                    ))}
                  </datalist>
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ color: '#4A3220', fontWeight: '700' }}>رقم فاتورة المورد</label>
                  <input
                    type="text"
                    placeholder="PUR-00..."
                    value={supplierInvoiceNo}
                    onChange={(e) => setSupplierInvoiceNo(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ color: '#4A3220', fontWeight: '700' }}>تاريخ الفاتورة والتوريد</label>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Package size={18} color="#96663B" />
                    <h4 style={{ fontSize: '0.98rem', fontWeight: '800', color: '#4A3220', margin: 0 }}>
                      أصناف الفاتورة والتكلفة وسعر البيع
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="btn btn-outline"
                    style={{
                      padding: '7px 14px',
                      fontSize: '0.82rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      background: 'rgba(150, 102, 59, 0.1)',
                      borderColor: '#96663B',
                      color: '#96663B',
                      fontWeight: '700',
                      borderRadius: '8px'
                    }}
                  >
                    <Plus size={14} color="#96663B" />
                    <span>+ إضافة صنف آخر</span>
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {items.map((item, idx) => (
                    <div key={idx} className="purchase-item-card">
                      {/* Row Header with Unit Type Switch & Delete action */}
                      <div className="purchase-item-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '0.88rem', fontWeight: '800', color: '#4A3220' }}>
                            الصنف رقم {idx + 1}
                          </span>
                          {items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItemRow(idx)}
                              style={{
                                background: 'rgba(239, 68, 68, 0.15)',
                                color: '#dc2626',
                                border: '1px solid rgba(239, 68, 68, 0.35)',
                                borderRadius: '6px',
                                padding: '3px 10px',
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
                              padding: '6px 12px',
                              borderRadius: '8px',
                              border: item.unitType === 'weight' ? '1.5px solid #96663B' : '1px solid #EDD9BD',
                              background: item.unitType === 'weight' ? 'linear-gradient(135deg, #96663B 0%, #7A5230 100%)' : '#FFF8EE',
                              color: item.unitType === 'weight' ? '#ffffff' : '#6B4A2E',
                              fontWeight: '800',
                              fontSize: '0.76rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: item.unitType === 'weight' ? '0 2px 8px rgba(150, 102, 59, 0.25)' : 'none',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            ⚖️ بالوزن (كجم / جرام)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleItemChange(idx, 'unitType', 'piece')}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              border: item.unitType === 'piece' ? '1.5px solid #96663B' : '1px solid #EDD9BD',
                              background: item.unitType === 'piece' ? 'linear-gradient(135deg, #96663B 0%, #7A5230 100%)' : '#FFF8EE',
                              color: item.unitType === 'piece' ? '#ffffff' : '#6B4A2E',
                              fontWeight: '800',
                              fontSize: '0.76rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: item.unitType === 'piece' ? '0 2px 8px rgba(150, 102, 59, 0.25)' : 'none',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            📦 بالعدد (قطعة)
                          </button>
                        </div>
                      </div>

                      {/* Main Item fields */}
                      <div className="purchase-item-main-grid">
                        <div>
                          <label className="form-label" style={{ fontSize: '0.78rem', color: '#4A3220', fontWeight: '700' }}>اختر منتج حالي أو اكتب جديداً</label>
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
                          <label className="form-label" style={{ fontSize: '0.78rem', color: '#4A3220', fontWeight: '700' }}>اسم الصنف *</label>
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
                          <label className="form-label" style={{ fontSize: '0.78rem', color: '#4A3220', fontWeight: '700' }}>
                            {item.unitType === 'weight' ? 'الكمية (بالـ كجم) *' : 'الكمية الموردة (قطع) *'}
                          </label>
                          <input
                            type="text"
                            inputMode="decimal"
                            dir="ltr"
                            required
                            placeholder={item.unitType === 'weight' ? 'مثال: 25' : 'مثال: 10'}
                            value={item.qty === undefined || item.qty === null ? '' : item.qty}
                            onChange={(e) => {
                              const clean = toLatinDigits(e.target.value);
                              if (clean === '' || /^\d*\.?\d*$/.test(clean)) {
                                handleItemChange(idx, 'qty', clean);
                              }
                            }}
                            className="form-input"
                            style={{ padding: '6px 10px', height: '38px', fontSize: '0.88rem', fontWeight: '700' }}
                          />
                          {item.unitType === 'weight' && (
                            <div style={{ fontSize: '0.7rem', color: '#96663B', marginTop: '2px', fontWeight: '700' }}>
                              (= {((Number(item.qty) || 0) * 1000).toLocaleString()} جرام)
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Pricing & Expiry Grid */}
                      <div className="purchase-item-pricing-grid">
                        <div>
                          <label className="form-label" style={{ fontSize: '0.76rem', color: '#4A3220', fontWeight: '700' }}>
                            {item.unitType === 'weight' ? 'تكلفة الكيلو (ج.م) *' : 'تكلفة القطعة (ج.م) *'}
                          </label>
                          <input
                            type="text"
                            inputMode="decimal"
                            dir="ltr"
                            required
                            placeholder="180"
                            value={item.costPrice === undefined || item.costPrice === null ? '' : item.costPrice}
                            onChange={(e) => {
                              const clean = toLatinDigits(e.target.value);
                              if (clean === '' || /^\d*\.?\d*$/.test(clean)) {
                                handleItemChange(idx, 'costPrice', clean);
                              }
                            }}
                            className="form-input"
                            style={{ padding: '6px 8px', height: '36px', fontSize: '0.88rem', fontWeight: '700' }}
                          />
                        </div>

                        <div>
                          <label className="form-label" style={{ fontSize: '0.76rem', color: '#4A3220', fontWeight: '800' }}>
                            {item.unitType === 'weight' ? 'سعر بيع الكيلو (ج.م) *' : 'سعر بيع القطعة (ج.م) *'}
                          </label>
                          <input
                            type="text"
                            inputMode="decimal"
                            dir="ltr"
                            required
                            placeholder="320"
                            value={item.suggestedSellingPrice === undefined || item.suggestedSellingPrice === null ? '' : item.suggestedSellingPrice}
                            onChange={(e) => {
                              const clean = toLatinDigits(e.target.value);
                              if (clean === '' || /^\d*\.?\d*$/.test(clean)) {
                                handleItemChange(idx, 'suggestedSellingPrice', clean);
                              }
                            }}
                            className="form-input"
                            style={{ padding: '6px 8px', height: '36px', fontSize: '0.88rem', borderColor: '#96663B', fontWeight: '800' }}
                          />
                        </div>

                        <div>
                          <label className="form-label" style={{ fontSize: '0.76rem', color: '#6B4A2E' }}>تاريخ الصلاحية</label>
                          <input
                            type="date"
                            value={item.expiryDate}
                            onChange={(e) => handleItemChange(idx, 'expiryDate', e.target.value)}
                            className="form-input"
                            style={{ padding: '6px 8px', height: '36px', fontSize: '0.84rem' }}
                          />
                        </div>

                        <div>
                          <label className="form-label" style={{ fontSize: '0.76rem', color: '#6B4A2E' }}>تاريخ دخول المخزن</label>
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.9rem', color: '#6B4A2E', fontWeight: '700' }}>إجمالي الفاتورة:</span>
                    <span style={{ fontWeight: '900', fontSize: '1.4rem', color: '#96663B' }}>
                      {totalAmount.toLocaleString()} ج.م
                    </span>
                  </div>
                  
                  {/* Full vs Partial toggle */}
                  <div className="purchase-payment-toggle">
                    <button
                      type="button"
                      onClick={() => setPaymentChoice('full')}
                      style={{
                        padding: '8px 16px',
                        fontSize: '0.84rem',
                        borderRadius: '8px',
                        fontWeight: '800',
                        cursor: 'pointer',
                        border: paymentChoice === 'full' ? '1.5px solid #96663B' : '1px solid #EDD9BD',
                        background: paymentChoice === 'full' ? 'linear-gradient(135deg, #96663B 0%, #7A5230 100%)' : '#FFF8EE',
                        color: paymentChoice === 'full' ? '#ffffff' : '#6B4A2E',
                        boxShadow: paymentChoice === 'full' ? '0 3px 12px rgba(150, 102, 59, 0.25)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      سداد الفاتورة بالكامل
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentChoice('partial')}
                      style={{
                        padding: '8px 16px',
                        fontSize: '0.84rem',
                        borderRadius: '8px',
                        fontWeight: '800',
                        cursor: 'pointer',
                        border: paymentChoice === 'partial' ? '1.5px solid #96663B' : '1px solid #EDD9BD',
                        background: paymentChoice === 'partial' ? 'linear-gradient(135deg, #96663B 0%, #7A5230 100%)' : '#FFF8EE',
                        color: paymentChoice === 'partial' ? '#ffffff' : '#6B4A2E',
                        boxShadow: paymentChoice === 'partial' ? '0 3px 12px rgba(150, 102, 59, 0.25)' : 'none',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      سداد جزء وتأجيل الباقي
                    </button>
                  </div>
                </div>

                {paymentChoice === 'partial' && (
                  <div className="purchase-partial-row" style={{ marginTop: '12px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                      <label style={{ fontSize: '0.82rem', fontWeight: '800', color: '#4A3220' }}>
                        المبلغ المدفوع للمورد الآن (ج.م):
                      </label>
                      <input
                        type="text"
                        inputMode="decimal"
                        dir="ltr"
                        placeholder="0"
                        value={customPaidAmount}
                        onChange={(e) => {
                          const clean = toLatinDigits(e.target.value);
                          if (clean === '' || /^\d*\.?\d*$/.test(clean)) {
                            setCustomPaidAmount(clean);
                          }
                        }}
                        className="form-input"
                        style={{ maxWidth: '180px', height: '36px', fontWeight: '800' }}
                      />
                    </div>
                    <div style={{ fontSize: '0.88rem', color: '#4A3220', fontWeight: '700', padding: '8px 14px', background: 'rgba(220, 38, 38, 0.08)', borderRadius: '8px', border: '1px solid rgba(220, 38, 38, 0.25)' }}>
                      المتبقي كمديونية للمورد: <span style={{ color: '#ef4444', fontSize: '1.1rem', fontWeight: '900' }}>{remainingAmount.toLocaleString()} ج.م</span>
                    </div>
                  </div>
                )}

                {/* 🏦 Treasury Account Selection & Deduction Block */}
                <div style={{
                  marginTop: '16px',
                  paddingTop: '14px',
                  borderTop: '1.5px dashed #EDD9BD',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <label style={{ fontSize: '0.86rem', fontWeight: '800', color: '#4A3220', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                      <Landmark size={18} color="#96663B" />
                      <span>الخزينة المسحوب منها المبلغ للسداد: *</span>
                    </label>

                    {selectedTreasuryAccount && (
                      <span style={{
                        fontSize: '0.8rem',
                        fontWeight: '700',
                        color: selectedAccountBalance >= paidAmount ? '#15803D' : '#DC2626',
                        background: selectedAccountBalance >= paidAmount ? '#F0FDF4' : '#FEF2F2',
                        border: `1px solid ${selectedAccountBalance >= paidAmount ? '#BBF7D0' : '#FECACA'}`,
                        padding: '3px 10px',
                        borderRadius: '20px'
                      }}>
                        الرصيد المتاح بالخزينة: {selectedAccountBalance.toLocaleString()} ج.م
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <select
                      value={selectedTreasuryId || selectedTreasuryAccount.id}
                      onChange={(e) => setSelectedTreasuryId(e.target.value)}
                      className="form-select"
                      style={{
                        flex: '1',
                        minWidth: '260px',
                        height: '42px',
                        fontSize: '0.88rem',
                        fontWeight: '700',
                        borderColor: '#EDD9BD',
                        background: '#FFFDF9'
                      }}
                    >
                      {treasuryAccounts.map((acc) => {
                        const accBal = getTreasuryAccountBalance ? getTreasuryAccountBalance(acc.id) : 0;
                        const icon = acc.type === 'cash' ? '💵' : (acc.type === 'instapay' ? '⚡' : (acc.type === 'wallet' ? '📱' : '🏦'));
                        return (
                          <option key={acc.id} value={acc.id}>
                            {icon} {acc.name} — (الرصيد الحالي: {accBal.toLocaleString()} ج.م)
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Deduction Status Note */}
                  {paidAmount > 0 ? (
                    <div style={{
                      fontSize: '0.82rem',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      background: selectedAccountBalance >= paidAmount ? '#F0FDF4' : '#FFFBEB',
                      border: `1px solid ${selectedAccountBalance >= paidAmount ? '#86EFAC' : '#FDE68A'}`,
                      color: selectedAccountBalance >= paidAmount ? '#166534' : '#92400E',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: '900' }}>✓</span>
                        <span>
                          سيتم خصم مبلغ <strong>{paidAmount.toLocaleString()} ج.م</strong> فوراً من <strong>{selectedTreasuryAccount.name}</strong> وتسجيل قيد سحب معتمد في سجل الخزينة.
                        </span>
                      </div>
                      {selectedAccountBalance < paidAmount && (
                        <div style={{ color: '#DC2626', fontWeight: '800', marginTop: '2px' }}>
                          ⚠️ تنبيه: المبلغ المطلوب سداده ({paidAmount.toLocaleString()} ج.م) أكبر من الرصيد المتوفر حالياً ({selectedAccountBalance.toLocaleString()} ج.م).
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{
                      fontSize: '0.82rem',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      color: '#64748B'
                    }}>
                      ℹ️ الفاتورة مسجلة كسداد آجل بالكامل (المبلغ المدفوع 0 ج.م) — لن يتم الخصم من الخزينة وسيتم قيد كامل الفاتورة كمديونية لصالح المورد لحين سدادها لاحقاً.
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ color: '#4A3220', fontWeight: '700' }}>ملاحظات الفاتورة</label>
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
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-outline" style={{ minHeight: '44px', color: '#6B4A2E', borderColor: '#EDD9BD' }}>
                  إلغاء
                </button>
                <button type="submit" className="btn btn-primary" style={{ minHeight: '44px', padding: '10px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: '800' }}>
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
          <div className="modal-content purchase-modal-container" style={{ maxWidth: '580px', padding: '24px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #EDD9BD', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#4A3220', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingBag size={20} color="#96663B" />
                <span>تفاصيل فاتورة المشتريات #{selectedPurchase.invoiceNumber}</span>
              </h3>
              <button onClick={() => setSelectedPurchase(null)} className="btn-icon" style={{ width: '30px', height: '30px' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ background: '#FFF8EE', border: '1px solid #EDD9BD', padding: '12px', borderRadius: '10px', fontSize: '0.88rem', color: '#4A3220' }}>
                <div>المورد: <strong style={{ color: '#96663B' }}>{selectedPurchase.supplierName}</strong></div>
                <div style={{ marginTop: '4px' }}>التاريخ: <strong style={{ color: '#6B4A2E' }}>{selectedPurchase.date}</strong></div>
                {selectedPurchase.notes && <div style={{ marginTop: '4px', color: '#8A654C' }}>ملاحظات: {selectedPurchase.notes}</div>}
              </div>

              <h4 style={{ fontSize: '0.92rem', fontWeight: '800', color: '#4A3220', margin: '6px 0 0' }}>الأصناف الموردة:</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {selectedPurchase.items.map((it, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: '#FFF8EE', border: '1px solid #EDD9BD', borderRadius: '8px', fontSize: '0.85rem' }}>
                    <div>
                      <strong style={{ color: '#4A3220' }}>{it.name}</strong> <span style={{ color: '#6B4A2E' }}>({it.qty} وحدة)</span>
                      <div style={{ fontSize: '0.74rem', color: '#8A654C', marginTop: '2px' }}>صلاحية: {it.expiryDate}</div>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ color: '#6B4A2E' }}>التكلفة: {it.costPrice} ج.م</div>
                      <div style={{ color: '#96663B', fontWeight: '800' }}>المجموع: {it.costPrice * it.qty} ج.م</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px dashed #EDD9BD', paddingTop: '10px', display: 'flex', justifyContent: 'space-between', fontWeight: '900', fontSize: '1.1rem', color: '#96663B' }}>
                <span>الإجمالي الكلي:</span>
                <span>{selectedPurchase.totalAmount} ج.م</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#5B8C5A', fontWeight: '700' }}>
                <span>المدفوع:</span>
                <span>{selectedPurchase.paidAmount} ج.م</span>
              </div>
              {selectedPurchase.paidAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: '#6B4A2E' }}>
                  <span>الخزينة المسحوب منها:</span>
                  <span style={{ fontWeight: '800', color: '#96663B' }}>
                    {treasuryAccounts.find(a => a.id === selectedPurchase.treasuryAccountId)?.name ||
                      (selectedPurchase.paymentMethod === 'instapay' ? 'حساب إنستاباي' : (selectedPurchase.paymentMethod === 'wallet' ? 'محفظة فودافون كاش' : 'الخزينة الرئيسية (درج الكاش)'))}
                  </span>
                </div>
              )}
              {selectedPurchase.remainingAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: '#ef4444', fontWeight: '800' }}>
                  <span>المتبقي للمورد:</span>
                  <span>{selectedPurchase.remainingAmount} ج.م</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', borderTop: '1px solid #EDD9BD', paddingTop: '14px' }}>
                <button
                  type="button"
                  onClick={() => printPurchaseInvoice(selectedPurchase, contactInfo)}
                  className="btn btn-primary"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', fontWeight: '700' }}
                >
                  <Printer size={15} />
                  <span>طباعة الفاتورة كـ PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPurchase(null)}
                  className="btn btn-outline"
                  style={{ color: '#6B4A2E', borderColor: '#EDD9BD' }}
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
