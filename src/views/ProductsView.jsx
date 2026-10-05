import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Plus,
  Search,
  Tag,
  Package,
  Edit2,
  Trash2,
  TrendingUp,
  AlertCircle,
  Image,
  DollarSign,
  Coffee,
  Check,
  Scale,
  Sparkles,
  Layers,
  X
} from 'lucide-react';

export const ProductsView = () => {
  const {
    products,
    categories,
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    name: '',
    nameEn: '',
    category: 'coffee',
    unitType: 'weight', // 'weight' (جرام / كجم) | 'piece' (قطعة)
    pricePerKg: 1280,
    costPerKg: 760,
    costPrice: 190,
    sellingPrice: 320,
    stock: 25,
    stockGram: 25000,
    minStockAlert: 5,
    image: '/caturra_ethiopia.jpg',
    roastLevel: 'تحميص متوسط',
    notes: '',
    weight: '250g',
    description: '',
    expiryDate: '2027-06-30',
    barcode: ''
  });

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (p.barcode && p.barcode.includes(searchQuery));
    return matchesCategory && matchesSearch;
  });

  // Open modal for new product
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      nameEn: '',
      category: categories[1]?.id || 'coffee',
      unitType: 'weight',
      pricePerKg: 1200,
      costPerKg: 700,
      costPrice: 175,
      sellingPrice: 300,
      stock: 20,
      stockGram: 20000,
      minStockAlert: 5,
      image: '/caturra_ethiopia.jpg',
      roastLevel: 'تحميص متوسط',
      notes: '',
      weight: '250g',
      description: '',
      expiryDate: '2027-06-30',
      barcode: `${Math.floor(622100000000 + Math.random() * 999999)}`
    });
    setIsAddModalOpen(true);
  };

  // Open modal for edit product
  const handleOpenEdit = (prod) => {
    setEditingProduct(prod);
    const isWeight = prod.unitType === 'weight' || prod.category === 'coffee';
    setFormData({
      ...prod,
      unitType: isWeight ? 'weight' : 'piece',
      pricePerKg: prod.pricePerKg || (prod.sellingPrice * 4),
      costPerKg: prod.costPerKg || (prod.costPrice * 4),
      costPrice: prod.costPrice,
      sellingPrice: prod.sellingPrice,
      stock: prod.stock,
      stockGram: prod.stockGram || (prod.stock * 1000)
    });
    setIsAddModalOpen(true);
  };

  // Handle Form Submit
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) {
      alert('يرجى كتابة اسم المنتج');
      return;
    }

    const isWeight = formData.unitType === 'weight';
    let payload = { ...formData };

    if (isWeight) {
      const pKg = Number(formData.pricePerKg) || 0;
      const cKg = Number(formData.costPerKg) || 0;
      const stKg = Number(formData.stock) || 0;
      payload = {
        ...payload,
        unitType: 'weight',
        pricePerKg: pKg,
        costPerKg: cKg,
        sellingPrice: Math.round(pKg / 4), // 250g default package
        costPrice: Math.round(cKg / 4),
        stock: stKg,
        stockGram: stKg * 1000
      };
    } else {
      payload = {
        ...payload,
        unitType: 'piece',
        pricePerKg: undefined,
        costPerKg: undefined,
        sellingPrice: Number(formData.sellingPrice) || 0,
        costPrice: Number(formData.costPrice) || 0,
        stock: Number(formData.stock) || 0,
        stockGram: 0
      };
    }

    if (editingProduct) {
      updateProduct(editingProduct.id, payload);
    } else {
      addProduct(payload);
    }
    setIsAddModalOpen(false);
  };

  // Add new category
  const handleAddCategorySubmit = (e) => {
    e.preventDefault();
    if (newCatName.trim()) {
      addCategory(newCatName.trim());
      setNewCatName('');
      setIsAddCategoryOpen(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      
      {/* Top Action Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', right: '12px', top: '12px' }} />
            <input
              type="text"
              placeholder="بحث بالاسم، الباركود، الكود..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ paddingRight: '38px', height: '42px', borderRadius: '10px' }}
            />
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            إجمالي الأصناف: <strong>{products.length}</strong>
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setIsAddCategoryOpen(true)}
            className="btn btn-outline"
            style={{ height: '42px' }}
          >
            <Tag size={16} />
            <span>+ إضافة تصنيف</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="btn btn-primary"
            style={{ height: '42px' }}
          >
            <Plus size={18} />
            <span>إضافة صنف جديد (بالوزن أو العدد)</span>
          </button>
        </div>
      </div>

      {/* Category Pills Filter */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`btn ${selectedCategory === cat.id ? 'btn-primary' : 'btn-outline'}`}
            style={{
              padding: '6px 16px',
              fontSize: '0.88rem',
              borderRadius: '20px',
              whiteSpace: 'nowrap'
            }}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Products Grid Display */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
          gap: '20px'
        }}
      >
        {filteredProducts.map((prod) => {
          const isOutOfStock = prod.stock <= 0;
          const isLowStock = prod.stock <= prod.minStockAlert;
          const isWeight = prod.unitType === 'weight' || prod.category === 'coffee';
          
          const profit = prod.sellingPrice - prod.costPrice;
          const profitPercent = prod.costPrice > 0 ? Math.round((profit / prod.costPrice) * 100) : 0;

          return (
            <div
              key={prod.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                position: 'relative',
                transition: 'transform 180ms ease, box-shadow 180ms ease'
              }}
            >
              {/* Product Image & Badges */}
              <div
                style={{
                  width: '100%',
                  height: '180px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  position: 'relative',
                  backgroundColor: '#f1f5f9'
                }}
              >
                <img
                  src={prod.image || '/caturra_ethiopia.jpg'}
                  alt={prod.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />

                {/* Stock Badge */}
                <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                  {isOutOfStock ? (
                    <span className="badge badge-danger">نفذ من المخزن!</span>
                  ) : isLowStock ? (
                    <span className="badge badge-warning">
                      مخزون منخفض ({prod.stock} {isWeight ? 'كجم' : 'ق'})
                    </span>
                  ) : (
                    <span className="badge badge-mint">
                      {isWeight
                        ? `${prod.stock} كجم (${(prod.stockGram || prod.stock * 1000).toLocaleString()} جم)`
                        : `${prod.stock} قطعة متوفرة`}
                    </span>
                  )}
                </div>

                {/* Unit Type Indicator */}
                <div style={{ position: 'absolute', top: '10px', left: '10px' }}>
                  <span
                    style={{
                      background: isWeight ? 'rgba(11, 128, 79, 0.9)' : 'rgba(30, 41, 59, 0.85)',
                      backdropFilter: 'blur(4px)',
                      color: '#ffffff',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: '800',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {isWeight ? <Scale size={12} /> : <Package size={12} />}
                    <span>{isWeight ? 'معايرة بالجرام' : 'بالقطعة'}</span>
                  </span>
                </div>

                {/* Category Badge */}
                <div style={{ position: 'absolute', bottom: '10px', right: '10px' }}>
                  <span
                    style={{
                      background: 'rgba(15, 23, 42, 0.75)',
                      backdropFilter: 'blur(4px)',
                      color: '#ffffff',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '0.72rem',
                      fontWeight: '600'
                    }}
                  >
                    {categories.find(c => c.id === prod.category)?.name || prod.category}
                  </span>
                </div>
              </div>

              {/* Title & SKU */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    {prod.sku}
                  </span>
                  {prod.barcode && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--mint-700)', fontWeight: '600' }}>
                      #{prod.barcode}
                    </span>
                  )}
                </div>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', color: 'var(--text-main)', marginTop: '4px', lineHeight: '1.4' }}>
                  {prod.name}
                </h3>
                {prod.notes && (
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    ✨ {prod.notes}
                  </p>
                )}
              </div>

              {/* Financial Box: Cost vs Selling vs Profit */}
              <div
                style={{
                  background: 'var(--mint-50)',
                  border: '1px solid var(--border-mint)',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '6px',
                  textAlign: 'center'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {isWeight ? 'تكلفة الكيلو' : 'التكلفة'}
                  </div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#475569' }}>
                    {isWeight ? (prod.costPerKg || prod.costPrice * 4) : prod.costPrice} ج.م
                  </div>
                </div>

                <div style={{ borderRight: '1px solid var(--border-mint)', borderLeft: '1px solid var(--border-mint)' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--mint-800)' }}>
                    {isWeight ? 'سعر الكيلو' : 'سعر البيع'}
                  </div>
                  <div style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--mint-700)' }}>
                    {isWeight ? (prod.pricePerKg || prod.sellingPrice * 4) : prod.sellingPrice} ج.م
                  </div>
                  {isWeight && (
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                      ({prod.sellingPrice} ج.م / 250جم)
                    </div>
                  )}
                </div>

                <div>
                  <div style={{ fontSize: '0.72rem', color: '#16a34a' }}>هامش الربح</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#16a34a' }}>
                    +{profit} ({profitPercent}%)
                  </div>
                </div>
              </div>

              {/* Expiry Date info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                <span>الصلاحية: {prod.expiryDate || 'غير محدد'}</span>
                <span>المبيعات: {prod.salesCount || 0} طلب</span>
              </div>

              {/* Actions Footer */}
              <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '6px' }}>
                <button
                  onClick={() => handleOpenEdit(prod)}
                  className="btn btn-outline"
                  style={{ flex: 1, padding: '7px 10px', fontSize: '0.82rem' }}
                >
                  <Edit2 size={14} />
                  <span>تعديل الصنف</span>
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`هل أنت متأكد من حذف الصنف "${prod.name}"؟`)) {
                      deleteProduct(prod.id);
                    }
                  }}
                  className="btn btn-danger"
                  style={{ padding: '7px 10px', fontSize: '0.82rem' }}
                  title="حذف الصنف"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', background: '#ffffff', borderRadius: '16px', border: '1.5px dashed var(--border-light)' }}>
          <Package size={48} color="var(--mint-400)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>لم يتم العثور على أي أصناف</h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            جرب تغيير معيار البحث أو أضف صنفاً جديداً الآن.
          </p>
          <button onClick={handleOpenAdd} className="btn btn-primary" style={{ marginTop: '14px' }}>
            <Plus size={16} />
            <span>إضافة صنف جديد</span>
          </button>
        </div>
      )}

      {/* MODAL: ADD / EDIT PRODUCT WITH WEIGHT VS PIECE CALIBRATION */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: '660px', padding: '24px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '14px', marginBottom: '18px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--mint-900)' }}>
                {editingProduct ? 'تعديل بيانات المنتج والمعايرة' : 'إضافة صنف جديد للمنظومة (بالوزن أو العدد)'}
              </h2>
              <button onClick={() => setIsAddModalOpen(false)} className="btn-icon" style={{ width: '32px', height: '32px' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* ⚖️ UNIT TYPE SELECTOR (WEIGHT VS PIECE) ⚖️ */}
              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid var(--border-mint)' }}>
                <label className="form-label" style={{ fontWeight: '800', color: 'var(--mint-950)', marginBottom: '8px', display: 'block' }}>
                  طريقة إدخال ومعايرة وبيع الصنف:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, unitType: 'weight' })}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: formData.unitType === 'weight' ? '2px solid var(--mint-600)' : '1px solid var(--border-light)',
                      background: formData.unitType === 'weight' ? 'var(--mint-100)' : '#ffffff',
                      color: formData.unitType === 'weight' ? 'var(--mint-950)' : 'var(--text-main)',
                      fontWeight: '800',
                      fontSize: '0.86rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      textAlign: 'right'
                    }}
                  >
                    <Scale size={20} color="var(--mint-700)" />
                    <div>
                      <div>بالوزن (جرام / كيلوجرام)</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--mint-700)', fontWeight: '600' }}>مخصص للبن والمحاصيل بالجرام</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, unitType: 'piece' })}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: formData.unitType === 'piece' ? '2px solid var(--mint-600)' : '1px solid var(--border-light)',
                      background: formData.unitType === 'piece' ? 'var(--mint-100)' : '#ffffff',
                      color: formData.unitType === 'piece' ? 'var(--mint-950)' : 'var(--text-main)',
                      fontWeight: '800',
                      fontSize: '0.86rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      textAlign: 'right'
                    }}
                  >
                    <Package size={20} color="var(--mint-700)" />
                    <div>
                      <div>بالعدد (قطعة / طقم)</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600' }}>للأدوات والأكواب والسيروب</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Basic Info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '14px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">اسم المنتج باللغة العربية *</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: إثيوبيا يرجاشيفي فاخر"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">التصنيف *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="form-select"
                  >
                    {categories.filter(c => c.id !== 'all').map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dynamic Pricing & Stock based on Weight vs Piece */}
              {formData.unitType === 'weight' ? (
                /* WEIGHT MODE */
                <div style={{ background: 'var(--mint-50)', padding: '14px', borderRadius: '12px', border: '1.5px solid var(--border-mint)' }}>
                  <div style={{ fontSize: '0.84rem', fontWeight: '800', color: 'var(--mint-900)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Scale size={16} />
                    <span>تسعير ومعايرة البن بالكيلوجرام والجرام:</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ color: 'var(--text-secondary)' }}>سعر تكلفة الكيلو (ج.م) *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="1"
                        placeholder="760"
                        value={formData.costPerKg}
                        onChange={(e) => setFormData({ ...formData, costPerKg: e.target.value })}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ color: 'var(--mint-800)', fontWeight: '800' }}>سعر بيع الكيلو (ج.م) *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="1"
                        placeholder="1280"
                        value={formData.pricePerKg}
                        onChange={(e) => setFormData({ ...formData, pricePerKg: e.target.value })}
                        className="form-input"
                        style={{ borderColor: 'var(--mint-400)', fontWeight: '800' }}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">الكمية بالمخزن (بالـ كجم) *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.5"
                        placeholder="35"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                        className="form-input"
                      />
                    </div>
                  </div>

                  {/* Weight Proportional Helper */}
                  <div style={{ marginTop: '10px', display: 'flex', gap: '8px', flexWrap: 'wrap', fontSize: '0.74rem', color: 'var(--mint-800)', background: '#ffffff', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-mint)' }}>
                    <span>💡 <strong>المعايرة التلقائية للأوزان:</strong></span>
                    <span>100جم: {Math.round(Number(formData.pricePerKg || 0) * 0.1)} ج.م</span>
                    <span>•</span>
                    <span>ربع كيلو (250جم): {Math.round(Number(formData.pricePerKg || 0) * 0.25)} ج.م</span>
                    <span>•</span>
                    <span>300جم: {Math.round(Number(formData.pricePerKg || 0) * 0.3)} ج.م</span>
                    <span>•</span>
                    <span>نصف كيلو (500جم): {Math.round(Number(formData.pricePerKg || 0) * 0.5)} ج.م</span>
                    <span>•</span>
                    <span>المخزون بالجرامات: {((Number(formData.stock) || 0) * 1000).toLocaleString()} جرام</span>
                  </div>
                </div>
              ) : (
                /* PIECE MODE */
                <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                  <div style={{ fontSize: '0.84rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Package size={16} />
                    <span>تسعير القطعة الواحدة:</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ color: 'var(--text-secondary)' }}>سعر تكلفة القطعة (ج.م) *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.5"
                        placeholder="180"
                        value={formData.costPrice}
                        onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ color: 'var(--mint-800)', fontWeight: '800' }}>سعر بيع القطعة (ج.م) *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.5"
                        placeholder="320"
                        value={formData.sellingPrice}
                        onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                        className="form-input"
                        style={{ borderColor: 'var(--mint-400)', fontWeight: '800' }}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">الكمية المتوفرة (قطع) *</label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="1"
                        placeholder="25"
                        value={formData.stock}
                        onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                        className="form-input"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Barcode & Expiry & Min Alert */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">الباركود (Barcode)</label>
                  <input
                    type="text"
                    placeholder="622100..."
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">حد تنبيه المخزون المنخفض ({formData.unitType === 'weight' ? 'كجم' : 'قطع'})</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="5"
                    value={formData.minStockAlert}
                    onChange={(e) => setFormData({ ...formData, minStockAlert: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">تاريخ انتهاء الصلاحية</label>
                  <input
                    type="date"
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Image URL & Notes */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">صورة المنتج</label>
                  <input
                    type="text"
                    placeholder="/caturra_ethiopia.jpg"
                    value={formData.image}
                    onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">إيحاءات أو ملاحظات</label>
                  <input
                    type="text"
                    placeholder="ياسمين، توت بري، شوكولاتة داكنة..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn btn-outline"
                  style={{ flex: 1, height: '44px' }}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 2, height: '44px', fontWeight: '800' }}
                >
                  {editingProduct ? 'حفظ التعديلات' : 'إضافة الصنف للنظام والمخازن'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD CATEGORY */}
      {isAddCategoryOpen && (
        <div className="modal-overlay" onClick={() => setIsAddCategoryOpen(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: '420px', padding: '24px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--mint-900)', margin: 0 }}>
                إضافة تصنيف جديد
              </h3>
              <button onClick={() => setIsAddCategoryOpen(false)} className="btn-icon">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddCategorySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">اسم التصنيف الجديد</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: مشروبات باردة، كبسولات..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="form-input"
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddCategoryOpen(false)}
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                >
                  إلغاء
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  حفظ التصنيف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
