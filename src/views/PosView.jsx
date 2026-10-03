import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  User,
  Phone,
  CreditCard,
  DollarSign,
  Clock,
  Printer,
  CheckCircle,
  Tag,
  Coffee,
  AlertTriangle,
  UserPlus,
  Percent,
  Smartphone,
  Sparkles,
  Scale,
  Package,
  Layers,
  X,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';

export const PosView = () => {
  const {
    products,
    categories,
    customers,
    createSale,
    openInvoiceModal,
    addCustomer
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Mobile View State
  const [mobileTab, setMobileTab] = useState('catalog'); // 'catalog' | 'cart'
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Cart State: items have unique id, productId, name, unitType, weightGram, weightLabel, grind, price, qty, etc.
  const [cart, setCart] = useState([]);

  // Weight Calibration Modal State
  const [calibratingProduct, setCalibratingProduct] = useState(null);
  const [selectedWeight, setSelectedWeight] = useState(250); // grams
  const [customWeightInput, setCustomWeightInput] = useState('');
  const [selectedGrind, setSelectedGrind] = useState('حبوب كاملة');
  const [packageCount, setPackageCount] = useState(1);

  // Direct Customer Registration in POS
  const [customerNameInput, setCustomerNameInput] = useState('');
  const [customerPhoneInput, setCustomerPhoneInput] = useState('');
  const [selectedExistingCustomerId, setSelectedExistingCustomerId] = useState(null);
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);

  // Billing & Payment
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' | 'card' | 'instapay' | 'deferred'
  const [paidAmountInput, setPaidAmountInput] = useState('');
  const [discountInput, setDiscountInput] = useState(0);

  // Filter products for POS
  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesQuery = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (p.barcode && p.barcode.includes(searchQuery)) ||
                         (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesQuery;
  });

  // Customer suggestions filter
  const customerSuggestions = (customerNameInput.trim() || customerPhoneInput.trim())
    ? customers.filter(c =>
        c.name.toLowerCase().includes(customerNameInput.toLowerCase()) ||
        c.phone.includes(customerPhoneInput)
      )
    : [];

  const handleSelectSuggestedCustomer = (cust) => {
    setCustomerNameInput(cust.name);
    setCustomerPhoneInput(cust.phone);
    setSelectedExistingCustomerId(cust.id);
    setShowCustomerSuggestions(false);
  };

  const handleClearCustomer = () => {
    setCustomerNameInput('');
    setCustomerPhoneInput('');
    setSelectedExistingCustomerId(null);
  };

  // Open Weight Calibration Modal for coffee or products sold by weight
  const openWeightModal = (product) => {
    setCalibratingProduct(product);
    setSelectedWeight(250); // Default 250g
    setCustomWeightInput('');
    setSelectedGrind('حبوب كاملة');
    setPackageCount(1);
  };

  // When clicking on a product card
  const handleProductClick = (product) => {
    if (product.stock <= 0) {
      alert('عذراً، هذا المنتج غير متوفر حالياً في المخزن!');
      return;
    }

    if (product.unitType === 'weight' || product.category === 'coffee') {
      openWeightModal(product);
    } else {
      // Add standard piece item to cart
      addPieceToCart(product);
    }
  };

  // Add piece product to cart
  const addPieceToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === product.id && item.unitType === 'piece');
      if (existing) {
        if (existing.qty >= product.stock) {
          alert(`أقصى كمية متوفرة في المخزن هي ${product.stock} قطعة`);
          return prev;
        }
        return prev.map(item =>
          item.cartItemId === existing.cartItemId ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [
        ...prev,
        {
          cartItemId: `item-pc-${product.id}`,
          productId: product.id,
          name: product.name,
          unitType: 'piece',
          price: product.sellingPrice,
          costPrice: product.costPrice,
          qty: 1,
          image: product.image,
          stock: product.stock
        }
      ];
    });
  };

  // Confirm and add calibrated weight item to cart
  const handleConfirmWeight = () => {
    if (!calibratingProduct) return;

    const grams = Number(customWeightInput) > 0 ? Number(customWeightInput) : Number(selectedWeight);
    if (grams <= 0) {
      alert('يرجى تحديد وزن صحيح بالجرام');
      return;
    }

    const availableGrams = calibratingProduct.stockGram || (calibratingProduct.stock * 1000);
    const totalRequiredGrams = grams * packageCount;

    if (totalRequiredGrams > availableGrams) {
      alert(`الوزن المطلوب (${totalRequiredGrams.toLocaleString()} جرام) يتجاوز المخزون المتاح (${availableGrams.toLocaleString()} جرام)!`);
      return;
    }

    // Price calculation: pricePerKg * (grams / 1000)
    const pricePerKg = Number(calibratingProduct.pricePerKg) || (Number(calibratingProduct.sellingPrice || 0) * 4);
    const costPerKg = Number(calibratingProduct.costPerKg) || (Number(calibratingProduct.costPrice || 0) * 4);
    const packagePrice = Math.round(pricePerKg * (grams / 1000));
    const packageCost = Math.round(costPerKg * (grams / 1000));

    const weightLabel = grams >= 1000 ? `${grams / 1000} كيلو` : `${grams} جرام`;
    const cartItemId = `item-wt-${calibratingProduct.id}-${grams}-${selectedGrind}`;

    setCart(prev => {
      const existing = prev.find(item => item.cartItemId === cartItemId);
      if (existing) {
        const newQty = existing.qty + packageCount;
        if (newQty * grams > availableGrams) {
          alert('الكمية الإجمالية تتجاوز المخزون المتاح!');
          return prev;
        }
        return prev.map(item =>
          item.cartItemId === cartItemId ? { ...item, qty: newQty } : item
        );
      }
      return [
        ...prev,
        {
          cartItemId,
          productId: calibratingProduct.id,
          name: calibratingProduct.name,
          unitType: 'weight',
          weightGram: grams,
          weightLabel: weightLabel,
          grind: selectedGrind,
          price: packagePrice,
          costPrice: packageCost,
          qty: packageCount,
          image: calibratingProduct.image,
          stock: calibratingProduct.stock,
          stockGram: availableGrams
        }
      ];
    });

    setCalibratingProduct(null);
  };

  // Update quantity in cart
  const updateQty = (cartItemId, delta) => {
    setCart(prev => {
      return prev
        .map(item => {
          if (item.cartItemId === cartItemId) {
            const newQty = item.qty + delta;
            if (item.unitType === 'weight') {
              const totalGrams = newQty * item.weightGram;
              if (totalGrams > item.stockGram) {
                alert(`أقصى كمية متوفرة في المخزن هي ${(item.stockGram).toLocaleString()} جرام`);
                return item;
              }
            } else if (newQty > item.stock) {
              alert(`أقصى كمية متوفرة في المخزن هي ${item.stock}`);
              return item;
            }
            return { ...item, qty: newQty };
          }
          return item;
        })
        .filter(item => item.qty > 0);
    });
  };

  // Remove from cart
  const removeFromCart = (cartItemId) => {
    setCart(prev => prev.filter(item => item.cartItemId !== cartItemId));
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const totalCartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const discount = Math.min(subtotal, Number(discountInput) || 0);
  const grandTotal = Math.max(0, subtotal - discount);

  // Remaining debt if deferred
  const paidVal = paymentMethod === 'deferred' 
    ? (paidAmountInput === '' ? 0 : Number(paidAmountInput))
    : grandTotal;
  const remainingDebt = Math.max(0, grandTotal - paidVal);

  // Submit Sale & Print Invoice
  const handleCheckout = () => {
    if (cart.length === 0) {
      alert('السلة فارغة! يرجى إضافة منتجات أولاً.');
      return;
    }

    // Determine Customer Info
    const cleanName = customerNameInput.trim();
    const cleanPhone = customerPhoneInput.trim();

    if (paymentMethod === 'deferred' && !cleanName && !cleanPhone) {
      alert('تنبيه: لإصدار فاتورة آجلة (على الحساب)، يجب كتابة اسم ورقم العميل لتسجيل المديونية عليه.');
      return;
    }

    let customerIdToLink = selectedExistingCustomerId;
    let finalCustomerName = cleanName || 'عميل صالة نقدي';
    let finalCustomerPhone = cleanPhone;

    // If new customer details entered, auto-register in customers database!
    if (!customerIdToLink && (cleanName || cleanPhone)) {
      const match = customers.find(c => c.phone === cleanPhone && cleanPhone !== '');
      if (match) {
        customerIdToLink = match.id;
        finalCustomerName = match.name;
      } else {
        const newlyCreated = addCustomer({
          name: cleanName || `عميل (${cleanPhone})`,
          phone: cleanPhone,
          city: 'القاهرة',
          address: '',
          notes: 'تم تسجيله تلقائياً من شاشة الكاشير (POS)'
        });
        customerIdToLink = newlyCreated.id;
        finalCustomerName = newlyCreated.name;
      }
    }

    const salePayload = {
      items: cart.map(item => ({
        productId: item.productId,
        name: item.name,
        unitType: item.unitType,
        weightGram: item.weightGram,
        weightLabel: item.weightLabel,
        grind: item.grind,
        price: item.price,
        costPrice: item.costPrice,
        qty: item.qty,
        total: item.price * item.qty
      })),
      customerId: customerIdToLink,
      customerName: finalCustomerName,
      customerPhone: finalCustomerPhone,
      discount: discount,
      paymentMethod: paymentMethod,
      paidAmount: paidVal,
      source: 'pos'
    };

    const newInvoice = createSale(salePayload);

    // Reset Cart & Cashier Inputs
    setCart([]);
    setDiscountInput(0);
    setPaidAmountInput('');
    setCustomerNameInput('');
    setCustomerPhoneInput('');
    setSelectedExistingCustomerId(null);
    setPaymentMethod('cash');
    setMobileTab('catalog');

    // Open Printable Invoice Modal Immediately
    openInvoiceModal(newInvoice);
  };

  // Preset weight buttons definition
  const presetWeights = [
    { label: '100 جرام', grams: 100 },
    { label: '250 جرام (ربع)', grams: 250 },
    { label: '300 جرام', grams: 300 },
    { label: '500 جرام (نصف)', grams: 500 },
    { label: '750 جرام', grams: 750 },
    { label: '1000 جرام (1 كجم)', grams: 1000 }
  ];

  // Grinds definition
  const grindOptions = [
    { id: 'حبوب كاملة', label: '🫘 حبوب كاملة (بدون طحن)' },
    { id: 'إسبريسو', label: '☕ إسبريسو ناعم' },
    { id: 'V60 / فلتر', label: '💧 V60 / فلتر متوسط' },
    { id: 'تركي ناعم', label: '🫖 تركي ناعم جداً' },
    { id: 'فرنش برس', label: '🧉 فرنش برس / كولد برو' }
  ];

  // Current weight and price calculation for modal
  const modalActiveGrams = Number(customWeightInput) > 0 ? Number(customWeightInput) : Number(selectedWeight);
  const modalPricePerKg = calibratingProduct 
    ? (Number(calibratingProduct.pricePerKg) || (Number(calibratingProduct.sellingPrice || 0) * 4))
    : 0;
  const modalCalculatedPrice = Math.round(modalPricePerKg * (modalActiveGrams / 1000));
  const modalTotalCalculated = modalCalculatedPrice * packageCount;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      
      {/* 📱 Mobile Segmented Tab Switcher (Visible on mobile/tablet) */}
      <div className="pos-mobile-tabs-bar">
        <button
          type="button"
          onClick={() => setMobileTab('catalog')}
          className={`pos-mobile-tab-btn ${mobileTab === 'catalog' ? 'active' : ''}`}
        >
          <Coffee size={17} />
          <span>الأصناف ({filteredProducts.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('cart')}
          className={`pos-mobile-tab-btn ${mobileTab === 'cart' ? 'active' : ''}`}
          style={{ position: 'relative' }}
        >
          <ShoppingCart size={17} />
          <span>كاشير الفاتورة</span>
          {totalCartCount > 0 && (
            <span
              style={{
                background: mobileTab === 'cart' ? '#ffffff' : 'var(--mint-600)',
                color: mobileTab === 'cart' ? 'var(--mint-800)' : '#ffffff',
                padding: '2px 8px',
                borderRadius: '9999px',
                fontSize: '0.74rem',
                fontWeight: '900',
                border: mobileTab === 'cart' ? '1px solid var(--mint-200)' : 'none'
              }}
            >
              {totalCartCount}
            </span>
          )}
        </button>
      </div>

      {/* Main Layout Container */}
      <div className="pos-layout">
        
        {/* LEFT: PRODUCTS CATALOG & SEARCH */}
        <div
          className="pos-catalog-column"
          style={{
            display: (!isMobile || mobileTab === 'catalog') ? 'flex' : 'none',
            flexDirection: 'column',
            gap: '14px'
          }}
        >
          {/* Search & Categories */}
          <div
            style={{
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? '8px' : '12px',
              alignItems: isMobile ? 'stretch' : 'center'
            }}
          >
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', right: '14px', top: '12px' }} />
              <input
                type="text"
                placeholder="بحث باسم البن، الأداة، الباركود..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input"
                style={{
                  paddingRight: '40px',
                  paddingLeft: searchQuery ? '36px' : '14px',
                  height: '42px',
                  borderRadius: '12px',
                  fontSize: '0.9rem'
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '11px',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: 0
                  }}
                  title="مسح البحث"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            <div
              style={{
                display: 'flex',
                gap: '8px',
                overflowX: 'auto',
                paddingBottom: '4px',
                width: isMobile ? '100%' : 'auto',
                scrollbarWidth: 'none',
                WebkitOverflowScrolling: 'touch'
              }}
            >
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`btn ${selectedCategory === cat.id ? 'btn-primary' : 'btn-outline'}`}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '10px',
                    fontSize: '0.82rem',
                    whiteSpace: 'nowrap',
                    flexShrink: 0
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Cards Grid */}
          <div className="pos-products-grid-container">
          {filteredProducts.map((prod) => {
            const isOutOfStock = prod.stock <= 0;
            const isWeight = prod.unitType === 'weight' || prod.category === 'coffee';
            const inCartItems = cart.filter(c => c.productId === prod.id);
            const totalInCartQty = inCartItems.reduce((sum, it) => sum + it.qty, 0);

            return (
              <div
                key={prod.id}
                onClick={() => !isOutOfStock && handleProductClick(prod)}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '14px',
                  border: totalInCartQty > 0 ? '2px solid var(--mint-500)' : '1px solid var(--border-light)',
                  boxShadow: totalInCartQty > 0 ? '0 4px 14px rgba(11,128,79,0.18)' : 'var(--shadow-sm)',
                  padding: isMobile ? '8px' : '10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: isMobile ? '6px' : '8px',
                  cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                  opacity: isOutOfStock ? 0.55 : 1,
                  position: 'relative',
                  transition: 'all 150ms ease'
                }}
              >
                {/* Image & Type Badge */}
                <div style={{ width: '100%', height: isMobile ? '95px' : '110px', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
                  <img
                    src={prod.image || '/caturra_ethiopia.jpg'}
                    alt={prod.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />

                  {/* Weight / Piece indicator pill */}
                  <span
                    style={{
                      position: 'absolute',
                      top: '6px',
                      right: '6px',
                      background: isWeight ? 'rgba(11, 128, 79, 0.9)' : 'rgba(30, 41, 59, 0.85)',
                      backdropFilter: 'blur(3px)',
                      color: '#ffffff',
                      fontSize: '0.68rem',
                      padding: '2px 7px',
                      borderRadius: '6px',
                      fontWeight: '800',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {isWeight ? <Scale size={11} /> : <Package size={11} />}
                    <span>{isWeight ? 'بالوزن / جرام' : 'بالقطعة'}</span>
                  </span>

                  {totalInCartQty > 0 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '6px',
                        left: '6px',
                        background: 'var(--mint-600)',
                        color: '#ffffff',
                        fontWeight: '800',
                        fontSize: '0.78rem',
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '2px solid #ffffff'
                      }}
                    >
                      {totalInCartQty}
                    </div>
                  )}

                  {/* Stock pill */}
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '6px',
                      right: '6px',
                      background: 'rgba(12, 28, 21, 0.85)',
                      backdropFilter: 'blur(3px)',
                      color: '#ffffff',
                      fontSize: '0.68rem',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: '700'
                    }}
                  >
                    {isWeight
                      ? `مخزن: ${prod.stock} كجم`
                      : `مخزن: ${prod.stock} ق`}
                  </span>
                </div>

                {/* Details */}
                <div>
                  <h4 style={{ fontSize: '0.86rem', fontWeight: '700', color: 'var(--text-main)', lineHeight: '1.3', height: '36px', overflow: 'hidden' }}>
                    {prod.name}
                  </h4>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '6px' }}>
                    <div>
                      {isWeight ? (
                        <>
                          <div style={{ fontSize: '0.98rem', fontWeight: '900', color: 'var(--mint-700)' }}>
                            {prod.pricePerKg || (prod.sellingPrice * 4)} ج.م <span style={{ fontSize: '0.72rem', fontWeight: '600' }}>/ كجم</span>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {prod.sellingPrice} ج.م / 250جم
                          </div>
                        </>
                      ) : (
                        <div style={{ fontSize: '1rem', fontWeight: '900', color: 'var(--mint-700)' }}>
                          {prod.sellingPrice} ج.م
                        </div>
                      )}
                    </div>

                    <button
                      className="btn-icon"
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '8px',
                        background: isWeight ? 'var(--mint-600)' : 'var(--mint-50)',
                        borderColor: isWeight ? 'var(--mint-600)' : 'var(--mint-300)',
                        color: isWeight ? '#ffffff' : 'var(--mint-800)'
                      }}
                      title={isWeight ? 'معايرة واختيار الوزن بالجرام' : 'إضافة قطعة للسلة'}
                    >
                      {isWeight ? <Scale size={16} /> : <Plus size={16} />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* 📱 Mobile Floating Checkout Bar (visible when browsing products on mobile) */}
        {isMobile && cart.length > 0 && (
          <div
            className="pos-mobile-floating-bar"
            onClick={() => setMobileTab('cart')}
            style={{ cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ position: 'relative' }}>
                <ShoppingCart size={22} color="#ffffff" />
                <span
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-8px',
                    background: '#ef4444',
                    color: '#ffffff',
                    fontSize: '0.68rem',
                    fontWeight: '900',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #024526'
                  }}
                >
                  {totalCartCount}
                </span>
              </div>
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: '800' }}>مراجعة الفاتورة والدفع</div>
                <div style={{ fontSize: '0.72rem', opacity: 0.9 }}>{cart.length} أصناف بالسلة ({totalCartCount} قطعة/عبوة)</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '1.05rem', fontWeight: '900', color: '#86efac' }}>{grandTotal} ج.م</span>
              <ArrowLeft size={18} />
            </div>
          </div>
        )}
      </div>

      {/* RIGHT: POS CASHIER & CUSTOMER & BILLING PANEL */}
      <div
        className="pos-cart-panel"
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '18px',
          border: '1px solid var(--border-light)',
          boxShadow: 'var(--shadow-md)',
          display: (!isMobile || mobileTab === 'cart') ? 'flex' : 'none',
          flexDirection: 'column',
          maxHeight: isMobile ? 'none' : 'calc(100vh - 120px)',
          overflow: 'hidden'
        }}
      >
        {/* Cart Header */}
        <div
          style={{
            padding: '14px 18px',
            borderBottom: '1px solid var(--border-light)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--mint-50)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShoppingCart size={20} color="var(--mint-700)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--mint-900)' }}>
              كاشير الفاتورة السريعة
            </h3>
          </div>
          <span className="badge badge-mint">{cart.length} أصناف</span>
        </div>

        {/* 📱 Mobile Return Button to browse more products */}
        {isMobile && (
          <button
            type="button"
            onClick={() => setMobileTab('catalog')}
            className="btn btn-outline"
            style={{
              margin: '10px 14px 2px 14px',
              padding: '8px 12px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontWeight: '800',
              fontSize: '0.84rem',
              borderColor: 'var(--mint-300)',
              color: 'var(--mint-900)',
              background: 'var(--mint-50)'
            }}
          >
            <ArrowRight size={16} />
            <span>العودة لاختيار أصناف أخرى من القائمة</span>
          </button>
        )}

        {/* 🌟 DIRECT CUSTOMER REGISTRATION BOX IN CASHIER 🌟 */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-mint)', background: 'linear-gradient(180deg, var(--mint-50) 0%, #ffffff 100%)', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: '800', color: 'var(--mint-900)' }}>
              <User size={15} color="var(--mint-600)" />
              <span>بيانات العميل (يُسجل بقاعدة العملاء ويظهر بالفاتورة):</span>
            </div>
            {(customerNameInput || customerPhoneInput) && (
              <button
                onClick={handleClearCustomer}
                style={{ background: 'none', border: 'none', color: '#dc2626', fontSize: '0.74rem', cursor: 'pointer', fontWeight: '700' }}
              >
                مسح / عميل صالة
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <input
                type="text"
                placeholder="اسم العميل (مثال: أحمد الشناوي)"
                value={customerNameInput}
                onChange={(e) => {
                  setCustomerNameInput(e.target.value);
                  setSelectedExistingCustomerId(null);
                  setShowCustomerSuggestions(true);
                }}
                onFocus={() => setShowCustomerSuggestions(true)}
                className="form-input"
                style={{ fontSize: '0.82rem', padding: '6px 10px', height: '36px', borderRadius: '8px' }}
              />
            </div>

            <div>
              <input
                type="tel"
                placeholder="رقم الموبايل (01XXXXXXXXX)"
                value={customerPhoneInput}
                onChange={(e) => {
                  setCustomerPhoneInput(e.target.value);
                  setSelectedExistingCustomerId(null);
                  setShowCustomerSuggestions(true);
                }}
                onFocus={() => setShowCustomerSuggestions(true)}
                className="form-input"
                style={{ fontSize: '0.82rem', padding: '6px 10px', height: '36px', borderRadius: '8px' }}
              />
            </div>
          </div>

          {/* Autocomplete Dropdown if matching existing customer */}
          {showCustomerSuggestions && customerSuggestions.length > 0 && (
            <div
              style={{
                position: 'absolute',
                top: '90px',
                right: '16px',
                left: '16px',
                background: '#ffffff',
                border: '1.5px solid var(--mint-400)',
                borderRadius: '10px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                zIndex: 100,
                maxHeight: '160px',
                overflowY: 'auto'
              }}
            >
              <div style={{ padding: '6px 10px', fontSize: '0.72rem', color: 'var(--text-muted)', background: '#f8fafc', borderBottom: '1px solid var(--border-light)' }}>
                عملاء مطابقون في قاعدة البيانات (اضغط للاختيار):
              </div>
              {customerSuggestions.map(cust => (
                <div
                  key={cust.id}
                  onClick={() => handleSelectSuggestedCustomer(cust)}
                  style={{
                    padding: '8px 12px',
                    borderBottom: '1px solid #f1f5f9',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.82rem'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--mint-50)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <div>
                    <strong>{cust.name}</strong> - <span dir="ltr">{cust.phone}</span>
                  </div>
                  {cust.debt > 0 ? (
                    <span className="badge badge-danger" style={{ fontSize: '0.68rem' }}>عليه: {cust.debt} ج.م</span>
                  ) : (
                    <span className="badge badge-mint" style={{ fontSize: '0.68rem' }}>مسجل</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Status info if selected */}
          {selectedExistingCustomerId && (
            <div style={{ marginTop: '6px', fontSize: '0.76rem', color: 'var(--mint-800)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle size={13} color="var(--mint-600)" />
              <span>عميل مسجل مسبقاً بقاعدة البيانات ومربوط بالفاتورة ✓</span>
            </div>
          )}
        </div>

        {/* Cart Items List */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}
        >
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)' }}>
              <Coffee size={36} color="var(--mint-300)" style={{ margin: '0 auto 8px' }} />
              <p style={{ fontSize: '0.85rem' }}>اختر أصنافاً من القائمة لبدء الفاتورة</p>
              <p style={{ fontSize: '0.75rem', color: 'var(--mint-700)' }}>يمكنك وزن البن بالجرام (250، 300، 500، 1 كجم) بدقة</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.cartItemId}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '9px 11px',
                  borderRadius: '10px',
                  background: item.unitType === 'weight' ? '#f4fbf7' : '#f8fafc',
                  border: item.unitType === 'weight' ? '1px solid var(--border-mint)' : '1px solid var(--border-light)'
                }}
              >
                <div style={{ flex: 1, overflow: 'hidden', paddingLeft: '8px' }}>
                  <div style={{ fontWeight: '700', fontSize: '0.85rem', color: 'var(--text-main)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {item.name}
                  </div>
                  
                  {/* Weight info badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px', flexWrap: 'wrap' }}>
                    {item.unitType === 'weight' ? (
                      <>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: '800',
                            color: 'var(--mint-800)',
                            background: 'var(--mint-100)',
                            padding: '1px 6px',
                            borderRadius: '4px'
                          }}
                        >
                          ⚖️ {item.weightLabel || `${item.weightGram} جرام`}
                        </span>
                        {item.grind && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                            ({item.grind})
                          </span>
                        )}
                      </>
                    ) : (
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        📦 بالقطعة
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '0.78rem', color: 'var(--mint-700)', fontWeight: '700', marginTop: '3px' }}>
                    {item.price} ج.م × {item.qty} {item.unitType === 'weight' ? 'عبوة' : 'ق'} = {item.price * item.qty} ج.م
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    onClick={() => updateQty(item.cartItemId, -1)}
                    className="btn-icon"
                    style={{ width: '26px', height: '26px', borderRadius: '6px' }}
                  >
                    <Minus size={13} />
                  </button>
                  <span style={{ fontWeight: '800', fontSize: '0.88rem', minWidth: '18px', textAlign: 'center' }}>
                    {item.qty}
                  </span>
                  <button
                    onClick={() => updateQty(item.cartItemId, 1)}
                    className="btn-icon"
                    style={{ width: '26px', height: '26px', borderRadius: '6px', backgroundColor: 'var(--mint-50)', color: 'var(--mint-800)' }}
                  >
                    <Plus size={13} />
                  </button>
                  <button
                    onClick={() => removeFromCart(item.cartItemId)}
                    style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '4px' }}
                    title="حذف من السلة"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Calculations & Egyptian Payment Methods */}
        <div style={{ borderTop: '1px solid var(--border-light)', padding: '12px 16px', background: '#fafbfc' }}>
          
          {/* Discount input */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>خصم نقدي (جنيه):</span>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={discountInput || ''}
              onChange={(e) => setDiscountInput(Number(e.target.value))}
              style={{ width: '80px', padding: '3px 8px', borderRadius: '6px', border: '1px solid var(--border-light)', fontSize: '0.85rem', textAlign: 'center' }}
            />
          </div>

          {/* Subtotal & Grand Total */}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
            <span>المجموع:</span>
            <span>{subtotal} ج.م</span>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: '900', color: 'var(--mint-900)', borderTop: '1px dashed var(--border-light)', paddingTop: '6px', marginBottom: '10px' }}>
            <span>الإجمالي المطلوب:</span>
            <span>{grandTotal} ج.م</span>
          </div>

          {/* Egyptian Payment Method Selector */}
          <div style={{ marginBottom: '10px' }}>
            <div style={{ fontSize: '0.76rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '5px' }}>
              طريقة الدفع:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setPaymentMethod('cash')}
                style={{
                  padding: '7px 4px',
                  borderRadius: '8px',
                  border: paymentMethod === 'cash' ? '2px solid var(--mint-600)' : '1px solid var(--border-light)',
                  background: paymentMethod === 'cash' ? 'var(--mint-50)' : '#ffffff',
                  color: paymentMethod === 'cash' ? 'var(--mint-900)' : 'var(--text-secondary)',
                  fontWeight: '700',
                  fontSize: '0.78rem',
                  cursor: 'pointer'
                }}
              >
                💵 نقدي (كاش)
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('card')}
                style={{
                  padding: '7px 4px',
                  borderRadius: '8px',
                  border: paymentMethod === 'card' ? '2px solid var(--mint-600)' : '1px solid var(--border-light)',
                  background: paymentMethod === 'card' ? 'var(--mint-50)' : '#ffffff',
                  color: paymentMethod === 'card' ? 'var(--mint-900)' : 'var(--text-secondary)',
                  fontWeight: '700',
                  fontSize: '0.78rem',
                  cursor: 'pointer'
                }}
              >
                💳 فيزا / ميزة
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('instapay')}
                style={{
                  padding: '7px 4px',
                  borderRadius: '8px',
                  border: paymentMethod === 'instapay' ? '2px solid #ea580c' : '1px solid var(--border-light)',
                  background: paymentMethod === 'instapay' ? '#fff7ed' : '#ffffff',
                  color: paymentMethod === 'instapay' ? '#c2410c' : 'var(--text-secondary)',
                  fontWeight: '700',
                  fontSize: '0.78rem',
                  cursor: 'pointer'
                }}
              >
                ⚡ إنستاباي / محفظة
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('deferred')}
                style={{
                  padding: '7px 4px',
                  borderRadius: '8px',
                  border: paymentMethod === 'deferred' ? '2px solid #ef4444' : '1px solid var(--border-light)',
                  background: paymentMethod === 'deferred' ? '#fef2f2' : '#ffffff',
                  color: paymentMethod === 'deferred' ? '#b91c1c' : 'var(--text-secondary)',
                  fontWeight: '700',
                  fontSize: '0.78rem',
                  cursor: 'pointer'
                }}
              >
                📝 آجل (على الحساب)
              </button>
            </div>
          </div>

          {/* If deferred payment selected, show Paid now vs remaining debt */}
          {paymentMethod === 'deferred' && (
            <div style={{ background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: '8px', padding: '8px 10px', marginBottom: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '0.76rem', color: '#9b2c2c', fontWeight: '700' }}>المسدد نقداً الآن:</span>
                <input
                  type="number"
                  min="0"
                  max={grandTotal}
                  placeholder="0"
                  value={paidAmountInput}
                  onChange={(e) => setPaidAmountInput(e.target.value)}
                  style={{ width: '80px', padding: '3px 6px', borderRadius: '4px', border: '1px solid #feb2b2', fontSize: '0.8rem', textAlign: 'center' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#c53030', fontWeight: '800' }}>
                <span>المتبقي كمديونية على العميل:</span>
                <span>{remainingDebt} ج.م</span>
              </div>
            </div>
          )}

          {/* Checkout & Instant Receipt Button */}
          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '1rem',
              fontWeight: '800',
              borderRadius: '12px',
              opacity: cart.length === 0 ? 0.6 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(11, 128, 79, 0.25)'
            }}
          >
            <Printer size={18} />
            <span>إتمام البيع وطباعة الفاتورة ({grandTotal} ج.م)</span>
          </button>
        </div>
      </div>
      </div> {/* /pos-layout */}

      {/* ⚖️ MODAL: WEIGHT & GRAM CALIBRATION SELECTOR ⚖️ */}
      {calibratingProduct && (
        <div className="modal-overlay" onClick={() => setCalibratingProduct(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: '580px', width: '95%', padding: isMobile ? '16px' : '24px', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '14px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'var(--mint-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Scale size={24} color="var(--mint-700)" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--mint-950)', margin: 0 }}>
                    معايرة وزن البن بالجرام
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {calibratingProduct.name}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setCalibratingProduct(null)}
                className="btn-icon"
                style={{ width: '32px', height: '32px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Product Summary Banner */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: '12px',
                background: 'var(--mint-50)',
                border: '1px solid var(--border-mint)',
                marginBottom: '16px'
              }}
            >
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--mint-800)', fontWeight: '700' }}>
                  سعر الكيلو الأساسي: <strong>{modalPricePerKg} ج.م</strong>
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  المخزون المتوفر بالمستودع: <strong>{(calibratingProduct.stockGram || calibratingProduct.stock * 1000).toLocaleString()} جرام</strong> ({calibratingProduct.stock} كجم)
                </div>
              </div>
              <img
                src={calibratingProduct.image || '/caturra_ethiopia.jpg'}
                alt={calibratingProduct.name}
                style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover' }}
              />
            </div>

            {/* 1. Quick Preset Weights (250g, 300g, 500g, 1kg etc.) */}
            <div style={{ marginBottom: '16px' }}>
              <label className="form-label" style={{ fontWeight: '800', color: 'var(--mint-950)', marginBottom: '8px', display: 'block' }}>
                اختر الوزن المطلوب بالجرام:
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: '8px' }}>
                {presetWeights.map(w => {
                  const isSelected = selectedWeight === w.grams && !customWeightInput;
                  return (
                    <button
                      key={w.grams}
                      type="button"
                      onClick={() => {
                        setSelectedWeight(w.grams);
                        setCustomWeightInput('');
                      }}
                      style={{
                        padding: '10px 8px',
                        borderRadius: '10px',
                        border: isSelected ? '2px solid var(--mint-600)' : '1px solid var(--border-light)',
                        background: isSelected ? 'var(--mint-100)' : '#ffffff',
                        color: isSelected ? 'var(--mint-950)' : 'var(--text-main)',
                        fontWeight: isSelected ? '800' : '600',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 120ms ease'
                      }}
                    >
                      <div>{w.label}</div>
                      <div style={{ fontSize: '0.74rem', color: isSelected ? 'var(--mint-700)' : 'var(--text-muted)', marginTop: '2px' }}>
                        {Math.round(modalPricePerKg * (w.grams / 1000))} ج.م
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Custom Gram Input */}
            <div style={{ marginBottom: '16px', background: '#f8fafc', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: '700', color: 'var(--text-secondary)' }}>
                  أو اكتب وزناً مخصصاً بالجرام (مثال: 150، 350، 400 جرام):
                </span>
                {customWeightInput && (
                  <span style={{ fontSize: '0.74rem', color: 'var(--mint-700)', fontWeight: '700' }}>مخصص نشط</span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => {
                    const current = Number(customWeightInput) || selectedWeight;
                    const next = Math.max(50, current - 25);
                    setCustomWeightInput(String(next));
                  }}
                  className="btn btn-outline"
                  style={{ padding: '6px 12px', height: '38px', borderRadius: '8px' }}
                >
                  - 25 جم
                </button>

                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    type="number"
                    min="10"
                    step="5"
                    placeholder="اكتب عدد الجرامات هنا..."
                    value={customWeightInput}
                    onChange={(e) => setCustomWeightInput(e.target.value)}
                    className="form-input"
                    style={{ height: '38px', borderRadius: '8px', textAlign: 'center', fontWeight: '800', fontSize: '0.95rem' }}
                  />
                  <span style={{ position: 'absolute', left: '12px', top: '10px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    جرام
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const current = Number(customWeightInput) || selectedWeight;
                    const next = current + 25;
                    setCustomWeightInput(String(next));
                  }}
                  className="btn btn-outline"
                  style={{ padding: '6px 12px', height: '38px', borderRadius: '8px' }}
                >
                  + 25 جم
                </button>
              </div>
            </div>

            {/* 3. Coffee Grind Degree Option */}
            <div style={{ marginBottom: '16px' }}>
              <label className="form-label" style={{ fontWeight: '800', color: 'var(--mint-950)', marginBottom: '8px', display: 'block' }}>
                درجة الطحن (اختياري للعميل):
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px' }}>
                {grindOptions.map(g => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedGrind(g.id)}
                    style={{
                      padding: '7px 10px',
                      borderRadius: '8px',
                      border: selectedGrind === g.id ? '2px solid var(--mint-600)' : '1px solid var(--border-light)',
                      background: selectedGrind === g.id ? 'var(--mint-50)' : '#ffffff',
                      color: selectedGrind === g.id ? 'var(--mint-950)' : 'var(--text-main)',
                      fontWeight: selectedGrind === g.id ? '700' : '500',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      textAlign: 'right'
                    }}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 4. Number of Packages Counter & Total Calculated */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 14px',
                borderRadius: '12px',
                background: 'var(--mint-100)',
                border: '1.5px solid var(--mint-400)',
                marginBottom: '18px'
              }}
            >
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--mint-800)' }}>عدد الأكياس / العبوات:</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setPackageCount(Math.max(1, packageCount - 1))}
                    className="btn-icon"
                    style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#ffffff' }}
                  >
                    <Minus size={14} />
                  </button>
                  <span style={{ fontWeight: '800', fontSize: '1rem', minWidth: '24px', textAlign: 'center' }}>
                    {packageCount}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPackageCount(packageCount + 1)}
                    className="btn-icon"
                    style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#ffffff' }}
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--mint-800)' }}>
                  إجمالي الوزن: <strong>{(modalActiveGrams * packageCount).toLocaleString()} جرام</strong>
                </div>
                <div style={{ fontSize: '1.3rem', fontWeight: '900', color: 'var(--mint-950)' }}>
                  {modalTotalCalculated} ج.م
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setCalibratingProduct(null)}
                className="btn btn-outline"
                style={{ flex: 1, padding: '10px' }}
              >
                إلغاء
              </button>
              <button
                type="button"
                onClick={handleConfirmWeight}
                className="btn btn-primary"
                style={{ flex: 2, padding: '10px', fontSize: '0.95rem', fontWeight: '800' }}
              >
                إضافة للفاتورة ({modalActiveGrams} جرام × {packageCount})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
