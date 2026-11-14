import React, { useState, useMemo } from 'react';
import { Search, Check, Coffee, Package, Scale, X, Sparkles, Wrench, Layers, Tag } from 'lucide-react';
import { getCountryMeta } from './CoffeeBagMockup';

/**
 * 📦 CustomerProductSelector Component
 * Allows selecting contracted B2B products and brewing tools for a customer/lead
 * with search, full category filtering (Espresso, Filter, Tools & Gear, Coffee blends),
 * wholesale pricing display (per kg or per piece), and clean readOnly badges.
 */
export const CustomerProductSelector = ({
  products = [],
  selectedProductIds = [],
  onChange = () => {},
  readOnly = false,
  onOpenEdit = null
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all'); // 'all' | 'espresso' | 'filter' | 'tools' | 'coffee' | 'selected'

  // Helper: Detect if a product is a brewing tool/gear/accessory
  const isToolProduct = (p) => {
    if (!p) return false;
    const cat = (p.category || '').toLowerCase();
    const unit = (p.unitType || '').toLowerCase();
    return cat === 'tools' || cat === 'accessories' || cat === 'boxes' || unit === 'piece';
  };

  // Helper: Get correct display price and unit
  const getProductPriceInfo = (p) => {
    if (!p) return { price: 0, unitLabel: 'ج.م', isPiece: false };
    const isPiece = isToolProduct(p);
    const price = isPiece
      ? (p.wholesalePricePerKg || p.wholesalePrice || p.sellingPrice || 0)
      : (p.wholesalePricePerKg || p.pricePerKg || (p.sellingPrice ? p.sellingPrice * 4 : 0));
    const unitLabel = isPiece ? 'ج.م / قطعة' : 'ج.م / كجم';
    return { price, unitLabel, isPiece };
  };

  // Helper: Get appropriate icon for item
  const getProductIcon = (p) => {
    if (!p) return '📦';
    if (isToolProduct(p)) return '🛠️';
    if (p.category === 'coffee') return '🫘';
    if (p.category === 'espresso' || p.bagVariant === 'landscape') return '☕';
    if (p.category === 'filter' || p.bagVariant === 'vertical') return '💧';
    if (p.category === 'boxes') return '🎁';
    return '📦';
  };

  // Normalize selected IDs
  const currentSelectedSet = useMemo(() => {
    const set = new Set();
    (selectedProductIds || []).forEach(item => {
      if (typeof item === 'string') {
        set.add(item);
        // Also match by product name if legacy text passed
        const match = products.find(p => p.id === item || p.name === item || p.nameEn === item);
        if (match) set.add(match.id);
      } else if (item && item.id) {
        set.add(item.id);
      }
    });
    return set;
  }, [selectedProductIds, products]);

  // Selected products objects
  const selectedProductsList = useMemo(() => {
    return products.filter(p => currentSelectedSet.has(p.id));
  }, [products, currentSelectedSet]);

  // Dynamic category counts across ALL products
  const categoryCounts = useMemo(() => {
    let espresso = 0;
    let filter = 0;
    let tools = 0;
    let coffee = 0;

    products.forEach(p => {
      if (isToolProduct(p)) {
        tools++;
      } else {
        if (p.category === 'espresso' || p.bagVariant === 'landscape') {
          espresso++;
        }
        if (p.category === 'filter' || p.bagVariant === 'vertical') {
          filter++;
        }
        if (p.category === 'coffee' || p.isBlend || p.subCategory === 'blend') {
          coffee++;
        }
      }
    });

    return {
      all: products.length,
      espresso,
      filter,
      tools,
      coffee,
      selected: currentSelectedSet.size
    };
  }, [products, currentSelectedSet]);

  // Filtered products for selection & display
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Category filter
      if (activeCategory === 'espresso') {
        const isEsp = !isToolProduct(p) && (p.category === 'espresso' || p.bagVariant === 'landscape');
        if (!isEsp) return false;
      } else if (activeCategory === 'filter') {
        const isFilt = !isToolProduct(p) && (p.category === 'filter' || p.bagVariant === 'vertical');
        if (!isFilt) return false;
      } else if (activeCategory === 'tools') {
        if (!isToolProduct(p)) return false;
      } else if (activeCategory === 'coffee') {
        const isCoffeeOrBlend = p.category === 'coffee' || p.isBlend === true || p.subCategory === 'blend';
        if (!isCoffeeOrBlend) return false;
      } else if (activeCategory === 'selected') {
        if (!currentSelectedSet.has(p.id)) return false;
      }

      // Search query
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;

      const name = (p.name || '').toLowerCase();
      const nameEn = (p.nameEn || '').toLowerCase();
      const country = (p.coffeeOrigin?.country || p.country || '').toLowerCase();
      const notes = (p.notes || '').toLowerCase();
      const notesAr = (p.notesAr || '').toLowerCase();
      const desc = (p.description || '').toLowerCase();
      const cat = (p.category || '').toLowerCase();

      return (
        name.includes(q) ||
        nameEn.includes(q) ||
        country.includes(q) ||
        notes.includes(q) ||
        notesAr.includes(q) ||
        desc.includes(q) ||
        cat.includes(q)
      );
    });
  }, [products, activeCategory, searchQuery, currentSelectedSet]);

  const toggleProduct = (prodId) => {
    if (readOnly) return;
    const nextSet = new Set(currentSelectedSet);
    if (nextSet.has(prodId)) {
      nextSet.delete(prodId);
    } else {
      nextSet.add(prodId);
    }
    onChange(Array.from(nextSet));
  };

  const handleSelectAll = () => {
    if (readOnly) return;
    const allIds = products.map(p => p.id);
    onChange(allIds);
  };

  const handleClearAll = () => {
    if (readOnly) return;
    onChange([]);
  };

  // ----------------------------------------------------
  // READ-ONLY VIEW MODE (For Customer Profile View Modal)
  // ----------------------------------------------------
  if (readOnly) {
    return (
      <div
        style={{
          background: '#FFFDF9',
          border: '1.5px solid #E8D5C4',
          borderRadius: '14px',
          padding: '14px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Coffee size={18} color="#6F4E37" />
            <strong style={{ fontSize: '0.94rem', color: '#2D1810' }}>
              الأصناف والمنتجات والأدوات المعتمدة للعميل ({selectedProductsList.length})
            </strong>
          </div>

          {onOpenEdit && (
            <button
              type="button"
              onClick={onOpenEdit}
              className="btn btn-outline"
              style={{
                padding: '4px 12px',
                fontSize: '0.76rem',
                borderRadius: '8px',
                color: '#6F4E37',
                borderColor: '#D6C7B8',
                fontWeight: '800'
              }}
            >
              تعديل الأصناف
            </button>
          )}
        </div>

        {selectedProductsList.length === 0 ? (
          <div
            style={{
              fontSize: '0.82rem',
              color: '#8C7A6B',
              padding: '14px',
              textAlign: 'center',
              background: '#FAF7F2',
              borderRadius: '10px',
              border: '1.5px dashed #D6C7B8'
            }}
          >
            لم يتم تحديد قائمة أصناف معتمدة لهذا العميل بعد. يمكنك تحديد الأصناف والأدوات التي يسحبها بالضغط على "تعديل البيانات".
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
              gap: '8px',
              maxHeight: '240px',
              overflowY: 'auto',
              paddingRight: '2px'
            }}
          >
            {selectedProductsList.map((prod) => {
              const country = prod.coffeeOrigin?.country || prod.country;
              const meta = country ? getCountryMeta(country) : null;
              const isTool = isToolProduct(prod);
              const icon = getProductIcon(prod);
              const { price, unitLabel } = getProductPriceInfo(prod);

              return (
                <div
                  key={prod.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: isTool ? '#F0F9FF' : '#FEF9EE',
                    border: isTool ? '1.5px solid #BAE6FD' : '1.5px solid #FDE68A',
                    padding: '8px 10px',
                    borderRadius: '10px',
                    boxShadow: '0 2px 5px rgba(69, 44, 26, 0.04)'
                  }}
                >
                  <span style={{ fontSize: '1.15rem' }}>{icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: '800',
                        fontSize: '0.84rem',
                        color: isTool ? '#0369A1' : '#451A03',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                      title={prod.name || prod.nameEn}
                    >
                      {prod.name || prod.nameEn}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: isTool ? '#0284C7' : '#92400E', fontWeight: '700', marginTop: '1px' }}>
                      {isTool ? (
                        <span style={{ background: '#E0F2FE', padding: '1px 5px', borderRadius: '4px' }}>أداة تحضير</span>
                      ) : (
                        meta && <span>{meta.flag}</span>
                      )}
                      <span>{Number(price).toLocaleString()} {unitLabel}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ----------------------------------------------------
  // INTERACTIVE EDIT / SELECTOR MODE (For Forms)
  // ----------------------------------------------------
  return (
    <div
      style={{
        background: '#FAF7F2',
        border: '1.5px solid #E8D5C4',
        borderRadius: '14px',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}
    >
      {/* Header with Title and Quick Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div>
          <label style={{ fontSize: '0.86rem', fontWeight: '900', color: '#2D1810', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Coffee size={16} color="#8B5E34" />
            <span>الأصناف والمنتجات والأدوات المعتمدة للعميل:</span>
          </label>
          <span style={{ fontSize: '0.76rem', color: '#8C7A6B' }}>
            حدد المنتجات وحبوب البن وأدوات التحضير (Tools) التي يسحبها العميل لربطها بملفه وطلباته
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={handleSelectAll}
            className="btn btn-outline"
            style={{ padding: '4px 10px', fontSize: '0.74rem', borderRadius: '8px', color: '#153825', borderColor: '#A7F3D0', background: '#ECFDF5', fontWeight: '800' }}
          >
            تحديد الكل ({products.length})
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className="btn btn-outline"
            style={{ padding: '4px 10px', fontSize: '0.74rem', borderRadius: '8px', color: '#DC2626', borderColor: '#FECACA', background: '#FEF2F2', fontWeight: '800' }}
          >
            مسح التحديد
          </button>
        </div>
      </div>

      {/* Category Pills & Search Bar */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Tab: All Products & Tools */}
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            style={{
              padding: '5px 12px',
              borderRadius: '14px',
              fontSize: '0.76rem',
              fontWeight: '800',
              border: activeCategory === 'all' ? '1.5px solid #8B5E34' : '1px solid #D6C7B8',
              background: activeCategory === 'all' ? '#8B5E34' : '#ffffff',
              color: activeCategory === 'all' ? '#ffffff' : '#6F4E37',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            الكل ({products.length})
          </button>

          {/* Tab: Tools & Brewing Gear (Requested by user) */}
          <button
            type="button"
            onClick={() => setActiveCategory('tools')}
            style={{
              padding: '5px 12px',
              borderRadius: '14px',
              fontSize: '0.76rem',
              fontWeight: '800',
              border: activeCategory === 'tools' ? '1.5px solid #0284C7' : '1px solid #BAE6FD',
              background: activeCategory === 'tools' ? '#0284C7' : '#F0F9FF',
              color: activeCategory === 'tools' ? '#ffffff' : '#0369A1',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.15s ease'
            }}
          >
            <span>🛠️ أدوات وتولز</span>
            <span>({categoryCounts.tools})</span>
          </button>

          {/* Tab: Espresso */}
          <button
            type="button"
            onClick={() => setActiveCategory('espresso')}
            style={{
              padding: '5px 12px',
              borderRadius: '14px',
              fontSize: '0.76rem',
              fontWeight: '800',
              border: activeCategory === 'espresso' ? '1.5px solid #B45309' : '1px solid #D6C7B8',
              background: activeCategory === 'espresso' ? '#B45309' : '#FEF3C7',
              color: activeCategory === 'espresso' ? '#ffffff' : '#92400E',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            ☕ إسبريسو ({categoryCounts.espresso})
          </button>

          {/* Tab: Filter & Pour Over */}
          <button
            type="button"
            onClick={() => setActiveCategory('filter')}
            style={{
              padding: '5px 12px',
              borderRadius: '14px',
              fontSize: '0.76rem',
              fontWeight: '800',
              border: activeCategory === 'filter' ? '1.5px solid #059669' : '1px solid #D6C7B8',
              background: activeCategory === 'filter' ? '#059669' : '#ECFDF5',
              color: activeCategory === 'filter' ? '#ffffff' : '#065F46',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            💧 فلتر وبور أوفر ({categoryCounts.filter})
          </button>

          {/* Tab: Traditional Coffee / Blends (if exists) */}
          {categoryCounts.coffee > 0 && (
            <button
              type="button"
              onClick={() => setActiveCategory('coffee')}
              style={{
                padding: '5px 12px',
                borderRadius: '14px',
                fontSize: '0.76rem',
                fontWeight: '800',
                border: activeCategory === 'coffee' ? '1.5px solid #78350F' : '1px solid #D6C7B8',
                background: activeCategory === 'coffee' ? '#78350F' : '#ffffff',
                color: activeCategory === 'coffee' ? '#ffffff' : '#78350F',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              🫘 بن وتوليفات ({categoryCounts.coffee})
            </button>
          )}

          {/* Tab: Selected Only */}
          <button
            type="button"
            onClick={() => setActiveCategory('selected')}
            style={{
              padding: '5px 12px',
              borderRadius: '14px',
              fontSize: '0.76rem',
              fontWeight: '800',
              border: activeCategory === 'selected' ? '1.5px solid #10B981' : '1px solid #D6C7B8',
              background: activeCategory === 'selected' ? '#10B981' : '#ffffff',
              color: activeCategory === 'selected' ? '#ffffff' : '#065F46',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            ✓ المحددة فقط ({currentSelectedSet.size})
          </button>
        </div>

        {/* Quick Search Input */}
        <div style={{ position: 'relative', width: '200px' }}>
          <Search size={14} color="#8C7A6B" style={{ position: 'absolute', right: '8px', top: '9px' }} />
          <input
            type="text"
            placeholder="بحث في المنتجات والتولز..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{
              paddingRight: '28px',
              height: '32px',
              fontSize: '0.78rem',
              borderRadius: '8px',
              background: '#ffffff',
              borderColor: '#D6C7B8'
            }}
          />
        </div>
      </div>

      {/* Selectable Products Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '8px',
          maxHeight: '250px',
          overflowY: 'auto',
          paddingRight: '4px',
          background: '#ffffff',
          padding: '10px',
          borderRadius: '10px',
          border: '1px solid #E8D5C4'
        }}
      >
        {filteredProducts.map((prod) => {
          const isSelected = currentSelectedSet.has(prod.id);
          const isTool = isToolProduct(prod);
          const icon = getProductIcon(prod);
          const country = prod.coffeeOrigin?.country || prod.country;
          const meta = country ? getCountryMeta(country) : null;
          const { price, unitLabel, isPiece } = getProductPriceInfo(prod);

          const subtitle = isTool
            ? (prod.notesAr || prod.notes || 'أداة تحضير ومعدات باريستا')
            : (meta ? `${meta.flag} ${prod.coffeeOrigin?.variety || prod.variety || country || ''}` : (prod.notesAr || prod.notes || 'بن محمص مختص'));

          return (
            <div
              key={prod.id}
              onClick={() => toggleProduct(prod.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 10px',
                borderRadius: '8px',
                cursor: 'pointer',
                border: isSelected ? '1.5px solid #059669' : (isTool ? '1px solid #BAE6FD' : '1px solid #E5E7EB'),
                background: isSelected ? '#F0FDF4' : (isTool ? '#F8FAFC' : '#FAFAFA'),
                transition: 'all 0.15s ease',
                userSelect: 'none'
              }}
            >
              {/* Checkbox circle */}
              <div
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  border: isSelected ? '2px solid #059669' : '1.5px solid #9CA3AF',
                  background: isSelected ? '#059669' : '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                {isSelected && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
              </div>

              {/* Product Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span style={{ fontSize: '0.85rem' }}>{icon}</span>
                  <span
                    style={{
                      fontWeight: isSelected ? '800' : '700',
                      fontSize: '0.82rem',
                      color: isSelected ? '#065F46' : (isTool ? '#0369A1' : '#2D1810'),
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                    title={prod.name || prod.nameEn}
                  >
                    {prod.name || prod.nameEn}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#6B7280', marginTop: '2px', gap: '4px' }}>
                  <span
                    style={{
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      maxWidth: '120px',
                      color: isTool ? '#0284C7' : '#6B7280'
                    }}
                  >
                    {subtitle}
                  </span>
                  <strong style={{ color: isSelected ? '#059669' : '#8B5E34', whiteSpace: 'nowrap' }}>
                    {Number(price).toLocaleString()} {isPiece ? 'ج.م' : 'ج.م'}
                  </strong>
                </div>
              </div>
            </div>
          );
        })}

        {filteredProducts.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '16px', color: '#8C7A6B', fontSize: '0.82rem' }}>
            لم يتم العثور على أي منتج أو أداة مطابقة للبحث في هذا التصنيف.
          </div>
        )}
      </div>

      {/* Footer Counter */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem', color: '#6F4E37', fontWeight: '700' }}>
        <span>
          تم تحديد <strong>{currentSelectedSet.size}</strong> من إجمالي <strong>{products.length}</strong> منتج وأداة لهذا العميل
        </span>
        {currentSelectedSet.size > 0 && (
          <span style={{ color: '#059669' }}>
            ✓ جاهزة للربط مع فواتير وأوردرات العميل
          </span>
        )}
      </div>
    </div>
  );
};
