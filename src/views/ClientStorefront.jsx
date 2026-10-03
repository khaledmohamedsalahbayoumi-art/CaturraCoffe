import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ShoppingBag,
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Coffee,
  CheckCircle,
  Shield,
  ArrowRight,
  Store,
  Sparkles,
  Phone,
  MapPin,
  MessageSquare,
  Printer,
  ChevronLeft,
  Scale,
  Home,
  X,
  Bot,
  Bell,
  Mail,
  Clock,
  Award,
  MessageCircle,
  ExternalLink
} from 'lucide-react';
import { StoreAiAssistant } from '../components/StoreAiAssistant';
import { STORE_WHATSAPP_NUMBER, generateWhatsAppOrderUrl } from '../utils/whatsapp';

export const ClientStorefront = () => {
  const {
    products,
    categories,
    createSale,
    openInvoiceModal,
    setViewMode,
    openNotificationSettings
  } = useApp();

  const [hasEnteredStore, setHasEnteredStore] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      if (p.get('entered') === 'true' || p.get('store') === 'true') return true;
    }
    return true; // default into store directly for smooth customer experience
  });
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);

  const handleProductSelectFromAi = (product) => {
    setHasEnteredStore(true);
    handleProductCardAction(product);
  };

  // Customer Weight Calibration Modal State
  const [calibratingProduct, setCalibratingProduct] = useState(null);
  const [selectedWeight, setSelectedWeight] = useState(250); // grams
  const [customWeightInput, setCustomWeightInput] = useState('');
  const [selectedGrind, setSelectedGrind] = useState('حبوب كاملة');
  const [packageCount, setPackageCount] = useState(1);

  // Customer Checkout Form
  const [custForm, setCustForm] = useState({
    name: '',
    phone: '',
    city: 'القاهرة',
    address: '',
    notes: '',
    paymentMethod: 'cash'
  });

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesQuery = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (p.notes && p.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         (p.origin && p.origin.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCat && matchesQuery;
  });

  // Open weight selection modal for customer
  const handleProductCardAction = (product) => {
    if (product.stock <= 0) {
      alert('عذراً، هذا المنتج نفذت كميته مؤقتاً.');
      return;
    }

    if (product.unitType === 'weight' || product.category === 'coffee') {
      setCalibratingProduct(product);
      setSelectedWeight(250);
      setCustomWeightInput('');
      setSelectedGrind('حبوب كاملة');
      setPackageCount(1);
    } else {
      // Add standard piece product
      addPieceToCart(product);
    }
  };

  const addPieceToCart = (product) => {
    const cartItemId = `cart-pc-${product.id}`;
    setCart(prev => {
      const existing = prev.find(item => item.cartItemId === cartItemId);
      if (existing) {
        if (existing.qty >= product.stock) {
          alert('وصلت لأقصى كمية متوفرة في المخزن لهذا المنتج.');
          return prev;
        }
        return prev.map(item =>
          item.cartItemId === cartItemId ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [
        ...prev,
        {
          cartItemId,
          productId: product.id,
          name: product.name,
          unitType: 'piece',
          price: product.sellingPrice,
          costPrice: product.costPrice,
          image: product.image,
          qty: 1,
          stock: product.stock
        }
      ];
    });
    setIsCartOpen(true);
  };

  // Confirm custom weight from modal and add to cart
  const handleConfirmStorefrontWeight = () => {
    if (!calibratingProduct) return;

    const grams = Number(customWeightInput) > 0 ? Number(customWeightInput) : Number(selectedWeight);
    if (grams <= 0) {
      alert('يرجى اختيار وزن صحيح');
      return;
    }

    const pricePerKg = Number(calibratingProduct.pricePerKg) || (Number(calibratingProduct.sellingPrice || 0) * 4);
    const costPerKg = Number(calibratingProduct.costPerKg) || (Number(calibratingProduct.costPrice || 0) * 4);
    const packagePrice = Math.round(pricePerKg * (grams / 1000));
    const packageCost = Math.round(costPerKg * (grams / 1000));

    const weightLabel = grams >= 1000 ? `${grams / 1000} كجم` : `${grams} جرام`;
    const cartItemId = `cart-wt-${calibratingProduct.id}-${grams}-${selectedGrind}`;

    setCart(prev => {
      const existing = prev.find(item => item.cartItemId === cartItemId);
      if (existing) {
        return prev.map(item =>
          item.cartItemId === cartItemId ? { ...item, qty: item.qty + packageCount } : item
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
          image: calibratingProduct.image,
          qty: packageCount,
          stock: calibratingProduct.stock
        }
      ];
    });

    setCalibratingProduct(null);
    setIsCartOpen(true);
  };

  const updateCartQty = (cartItemId, delta) => {
    setCart(prev =>
      prev
        .map(item => {
          if (item.cartItemId === cartItemId) {
            const newQty = item.qty + delta;
            return { ...item, qty: newQty };
          }
          return item;
        })
        .filter(item => item.qty > 0)
    );
  };

  const removeFromCart = (cartItemId) => {
    setCart(prev => prev.filter(item => item.cartItemId !== cartItemId));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const totalCartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  // Submit Order
  const handleCheckoutSubmit = (e, sendViaWhatsApp = false) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!custForm.name || !custForm.phone) {
      alert('يرجى كتابة الاسم ورقم الموبايل لتوصيل الطلب');
      return;
    }

    const salePayload = {
      items: cart.map(it => ({
        productId: it.productId,
        name: it.name,
        unitType: it.unitType || 'piece',
        weightGram: it.weightGram,
        weightLabel: it.weightLabel,
        grind: it.grind,
        price: it.price,
        costPrice: it.costPrice,
        qty: it.qty,
        total: it.price * it.qty
      })),
      customerName: custForm.name,
      customerPhone: custForm.phone,
      customerAddress: `${custForm.city} - ${custForm.address}`,
      paymentMethod: custForm.paymentMethod,
      paidAmount: custForm.paymentMethod === 'card' ? cartTotal : 0,
      source: 'online',
      status: 'pending' // Enters Admin ERP as a pending order
    };

    const newInvoice = createSale(salePayload);
    setCompletedOrder(newInvoice);
    setCart([]);
    setIsCheckoutOpen(false);

    if (sendViaWhatsApp) {
      const waUrl = generateWhatsAppOrderUrl(newInvoice, STORE_WHATSAPP_NUMBER);
      window.open(waUrl, '_blank');
    }
  };

  // Preset weights
  const presetWeights = [
    { label: '250 جرام (ربع كيلو)', grams: 250 },
    { label: '300 جرام', grams: 300 },
    { label: '500 جرام (نصف كيلو)', grams: 500 },
    { label: '1000 جرام (1 كجم)', grams: 1000 }
  ];

  const grindOptions = [
    { id: 'حبوب كاملة', label: '🫘 حبوب كاملة (بدون طحن)' },
    { id: 'إسبريسو', label: '☕ إسبريسو ناعم' },
    { id: 'V60 / فلتر', label: '💧 تقطير V60 / فلتر' },
    { id: 'تركي ناعم', label: '🫖 قهوة تركي ناعمة' },
    { id: 'فرنش برس', label: '🧉 فرنش برس / كولد برو' }
  ];

  // Active grams calculation for modal
  const modalActiveGrams = Number(customWeightInput) > 0 ? Number(customWeightInput) : Number(selectedWeight);
  const modalPricePerKg = calibratingProduct 
    ? (Number(calibratingProduct.pricePerKg) || (Number(calibratingProduct.sellingPrice || 0) * 4))
    : 0;
  const modalCalculatedPrice = Math.round(modalPricePerKg * (modalActiveGrams / 1000));
  const modalTotalCalculated = modalCalculatedPrice * packageCount;

  // 🌟 WELCOME INTRO SPLASH SCREEN (شاشة البداية مع زر الدخول بالمنتصف) 🌟
  if (!hasEnteredStore) {
    return (
      <div
        className="welcome-splash-screen"
        style={{
          minHeight: '100vh',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          alignItems: 'center',
          position: 'relative',
          overflow: 'hidden',
          padding: '24px',
          backgroundImage: `radial-gradient(ellipse at 50% 35%, rgba(4, 136, 75, 0.42) 0%, rgba(2, 40, 22, 0.88) 45%, rgba(0, 18, 9, 0.98) 100%), url('/caturra_hero.jpg?v=2')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'scroll',
          color: '#ffffff',
          textAlign: 'center',
          animation: 'fadeIn 350ms ease-out'
        }}
      >
        {/* TOP BAR */}
        <div
          className="welcome-splash-top"
          style={{
            width: '100%',
            maxWidth: '1200px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            zIndex: 10,
            gap: '8px'
          }}
        >
          {/* Country / Brand Badge */}
          <div
            className="welcome-splash-badge"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '9999px',
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              fontSize: '0.82rem',
              color: 'var(--mint-200)',
              fontWeight: '700'
            }}
          >
            <span>🇪🇬</span>
            <span>كاتورا للقهوة المختصة</span>
          </div>

          {/* Quick link to Admin ERP */}
          <button
            onClick={() => setViewMode('admin')}
            className="welcome-splash-erp"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '9999px',
              background: 'rgba(255, 255, 255, 0.12)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.22)',
              color: '#ffffff',
              fontSize: '0.8rem',
              fontWeight: '700',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap'
            }}
            title="دخول لوحة تحكم الإدارة ونقاط البيع"
          >
            <Store size={15} color="var(--mint-300)" />
            <span>لوحة الإدارة (ERP)</span>
          </button>
        </div>

        {/* CENTER CONTENT */}
        <div
          style={{
            maxWidth: '740px',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '22px',
            zIndex: 10,
            margin: 'auto 0',
            padding: '20px 0'
          }}
        >
          {/* Glowing Brand Logo with Floating Animation */}
          <div
            style={{
              animation: 'floatSlow 4s ease-in-out infinite',
              display: 'inline-flex',
              padding: '8px',
              borderRadius: '32px',
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(10, 178, 103, 0.2) 100%)',
              backdropFilter: 'blur(12px)',
              border: '2px solid var(--mint-300)',
              boxShadow: '0 0 45px rgba(10, 178, 103, 0.55), inset 0 0 20px rgba(255, 255, 255, 0.25)'
            }}
          >
            <img
              src="/caturra_logo.jpg"
              alt="Caturra Specialty Coffee"
              style={{
                width: '105px',
                height: '105px',
                borderRadius: '26px',
                objectFit: 'cover'
              }}
            />
          </div>

          {/* Subtitle Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 20px',
              borderRadius: '9999px',
              background: 'rgba(4, 136, 75, 0.4)',
              backdropFilter: 'blur(8px)',
              border: '1.5px solid rgba(150, 236, 192, 0.4)',
              fontSize: '0.9rem',
              fontWeight: '700',
              color: 'var(--mint-200)'
            }}
          >
            <Sparkles size={16} />
            <span>تحميص طازج يومياً • أرقى محاصيل القهوة المختصة</span>
          </div>

          {/* Main Title */}
          <h1
            style={{
              fontSize: 'clamp(2.3rem, 5vw, 3.6rem)',
              fontWeight: '900',
              lineHeight: '1.2',
              margin: 0,
              color: '#ffffff',
              textShadow: '0 4px 25px rgba(0, 0, 0, 0.7)'
            }}
          >
            مرحباً بكم في متجر كاتورا
          </h1>

          {/* Description */}
          <p
            style={{
              fontSize: 'clamp(0.98rem, 2vw, 1.18rem)',
              color: 'rgba(235, 248, 241, 0.92)',
              lineHeight: '1.75',
              margin: 0,
              maxWidth: '620px',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.5)'
            }}
          >
            عالم متكامل لعشاق القهوة الفاخرة، مع إمكانية تحديد وزن البن بدقة بالجرام ودرجة الطحن لتناسب ذوقك وأدوات تحضيرك مع شحن سريع لكافة المحافظات.
          </p>

          {/* 🌟 THE CENTER ENTER BUTTON (الزر اللي في النص لفتح الاستور) 🌟 */}
          <div style={{ marginTop: '12px' }}>
            <button
              onClick={() => setHasEnteredStore(true)}
              className="welcome-enter-btn"
            >
              <span>دخول المتجر وتصفح المنتجات</span>
              <ArrowRight size={22} style={{ transform: 'rotate(180deg)' }} />
            </button>
          </div>

          {/* Feature Highlights Pills Grid */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              gap: '10px',
              marginTop: '14px',
              maxWidth: '700px'
            }}
          >
            {[
              { icon: '🫘', title: 'محاصيل فردية المنشأ مختارة' },
              { icon: '⚖️', title: 'تحديد وزن البن بالجرام (250ج، 500ج، 1كج)' },
              { icon: '☕', title: 'طحن فوري مجاني مخصص لأداتك' },
              { icon: '⚡', title: 'دفع سهل (كاش، إنستاباي، ميزة، فيزا)' }
            ].map((f, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '7px 14px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.08)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  fontSize: '0.82rem',
                  fontWeight: '600',
                  color: 'rgba(255, 255, 255, 0.95)'
                }}
              >
                <span>{f.icon}</span>
                <span>{f.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* BOTTOM FOOTER */}
        <div
          style={{
            zIndex: 10,
            fontSize: '0.78rem',
            color: 'rgba(255, 255, 255, 0.55)',
            letterSpacing: '0.5px'
          }}
        >
          © 2026 كاتورا للقهوة المختصة (Caturra Specialty Coffee) • جميع الحقوق محفوظة
        </div>

        {/* AI Barista Bot Available on Splash Screen */}
        <StoreAiAssistant
          products={products}
          onSelectProduct={handleProductSelectFromAi}
          isOpen={isAiAssistantOpen}
          setIsOpen={setIsAiAssistantOpen}
        />
      </div>
    );
  }

  return (
    <div className="storefront-page">
      
      {/* STORE HEADER */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          background: 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid var(--border-mint)',
          zIndex: 40,
          padding: '10px 14px',
          width: '100%',
          maxWidth: '100%',
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}
      >
        <div className="store-header-container">
          
          {/* Logo & Brand (Click to return to welcome intro) */}
          <div
            onClick={() => setHasEnteredStore(false)}
            className="store-header-brand"
            title="العودة للشاشة الترحيبية"
          >
            <img
              src="/caturra_logo.jpg"
              alt="Caturra Coffee"
              style={{ width: '42px', height: '42px', borderRadius: '12px', objectFit: 'cover', border: '2px solid var(--mint-400)' }}
            />
            <div>
              <div className="brand-title" style={{ fontSize: '1.15rem', fontWeight: '900', color: 'var(--mint-950)', lineHeight: '1.2' }}>
                كاتورا للقهوة المختصة
              </div>
              <div className="brand-sub" style={{ fontSize: '0.74rem', color: 'var(--mint-700)', fontWeight: '600' }}>
                Caturra Specialty Coffee • متجر الذواقة
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="store-header-actions">
            {/* Return to Welcome Splash Screen */}
            <button
              onClick={() => setHasEnteredStore(false)}
              className="btn btn-outline"
              style={{
                height: '38px',
                width: '38px',
                padding: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '10px',
                borderColor: 'var(--mint-400)',
                background: 'var(--mint-50)',
                color: 'var(--mint-700)'
              }}
              title="الرئيسية (العودة للشاشة الترحيبية)"
            >
              <Home size={18} />
            </button>

            {/* Phone Notifications Settings Trigger */}
            <button
              onClick={openNotificationSettings}
              className="btn btn-outline"
              style={{
                height: '38px',
                width: '38px',
                padding: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '10px',
                borderColor: 'var(--mint-400)',
                background: 'var(--mint-50)',
                color: 'var(--mint-800)'
              }}
              title="تفعيل وضبط إشعارات الهاتف 🔔"
            >
              <Bell size={17} />
            </button>

            {/* Link to Admin ERP */}
            <button
              onClick={() => setViewMode('admin')}
              className="btn btn-outline"
              style={{ height: '38px', padding: '0 12px', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              title="دخول لوحة تحكم الإدارة ونقاط البيع"
            >
              <Store size={15} />
              <span className="btn-text-hide">لوحة الإدارة</span>
            </button>

            {/* AI Assistant Trigger Button in Header */}
            <button
              onClick={() => setIsAiAssistantOpen(prev => !prev)}
              className="btn btn-outline"
              style={{
                height: '38px',
                padding: '0 12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'linear-gradient(135deg, var(--mint-50) 0%, #ffffff 100%)',
                borderColor: 'var(--mint-400)',
                color: 'var(--mint-800)',
                fontWeight: '800',
                fontSize: '0.82rem',
                borderRadius: '10px'
              }}
              title="تحدث مع باريستا كاتورا الذكي (AI)"
            >
              <Bot size={17} style={{ color: 'var(--mint-600)' }} />
              <span className="btn-text-hide">باريستا (AI)</span>
              <Sparkles size={13} style={{ color: '#b45309' }} />
            </button>

            {/* Shopping Cart Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="btn btn-primary"
              style={{ height: '38px', padding: '0 14px', position: 'relative', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <ShoppingCart size={17} />
              <span className="btn-text-hide">السلة</span>
              {totalCartCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-5px',
                    left: '-5px',
                    background: '#dc2626',
                    color: '#ffffff',
                    borderRadius: '50%',
                    width: '19px',
                    height: '19px',
                    fontSize: '0.7rem',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #ffffff'
                  }}
                >
                  {totalCartCount}
                </span>
              )}
            </button>
          </div>

        </div>
      </header>

      {/* HERO BANNER */}
      <section
        style={{
          position: 'relative',
          padding: '30px 16px',
          background: 'linear-gradient(135deg, var(--mint-950) 0%, var(--mint-900) 50%, var(--mint-800) 100%)',
          color: '#ffffff',
          overflow: 'hidden',
          width: '100%',
          maxWidth: '100%',
          boxSizing: 'border-box'
        }}
      >
        <div className="store-hero-grid">
          <div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(5px)',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '0.78rem',
                fontWeight: '700',
                marginBottom: '14px',
                color: 'var(--mint-200)'
              }}
            >
              <Sparkles size={14} />
              محاصيل بن مختص طازجة مع حمص يومي بمعايير عالمية
            </span>

            <h1 style={{ fontSize: 'clamp(1.5rem, 5vw, 2.4rem)', fontWeight: '900', lineHeight: '1.25', margin: '0 0 14px', color: '#ffffff' }}>
              اكتشف رحلة النكهات الاستثنائية مع قهوة كاتورا
            </h1>

            <p style={{ fontSize: '0.92rem', color: 'var(--mint-100)', lineHeight: '1.65', margin: '0 0 20px', maxWidth: '520px' }}>
              محاصيل مختارة بعناية من أفضل مزارع إثيوبيا، كولومبيا، والبرازيل، مع إمكانية تحديد وزن البن بدقة بالجرام ودرجة الطحن لتناسب ذوقك وأدواتك.
            </p>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <a
                href="#products-section"
                className="btn btn-primary"
                style={{
                  backgroundColor: '#ffffff',
                  color: 'var(--mint-900)',
                  fontWeight: '800',
                  padding: '10px 20px',
                  borderRadius: '12px',
                  fontSize: '0.9rem'
                }}
              >
                تصفح المحاصيل والأدوات ↓
              </a>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--mint-200)', fontSize: '0.84rem' }}>
                <Shield size={16} />
                <span>شحن سريع لجميع المحافظات</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', width: '100%', maxWidth: '100%' }}>
            <img
              src="/caturra_hero.jpg?v=2"
              alt="Caturra Coffee"
              className="store-hero-img"
            />
          </div>
        </div>
      </section>

      {/* MAIN CATALOG */}
      <main id="products-section">
        
        {/* Search & Category Filter */}
        <div className="store-filter-bar">
          
          <div className="store-categories-scroll">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`btn ${selectedCategory === cat.id ? 'btn-primary' : 'btn-outline'}`}
                style={{
                  borderRadius: '20px',
                  padding: '6px 16px',
                  fontSize: '0.85rem',
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="store-search-box">
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', right: '14px', top: '12px' }} />
            <input
              type="text"
              placeholder="ابحث عن قهوتك المفضلة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ paddingRight: '40px', height: '42px', borderRadius: '12px', width: '100%' }}
            />
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="store-products-grid">
          {filteredProducts.map((prod) => {
            const isOutOfStock = prod.stock <= 0;
            const isWeight = prod.unitType === 'weight' || prod.category === 'coffee';

            return (
              <div
                key={prod.id}
                className="card store-product-card"
              >
                {/* Image */}
                <div style={{ width: '100%', height: '190px', borderRadius: '12px', overflow: 'hidden', position: 'relative', background: '#f1f5f9' }}>
                  <img
                    src={prod.image || '/caturra_ethiopia.jpg'}
                    alt={prod.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />

                  {/* Weight / Piece badge */}
                  <span
                    style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      background: isWeight ? 'rgba(11, 128, 79, 0.92)' : 'rgba(30, 41, 59, 0.88)',
                      backdropFilter: 'blur(4px)',
                      color: '#ffffff',
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontSize: '0.72rem',
                      fontWeight: '800',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    {isWeight ? <Scale size={13} /> : <Coffee size={13} />}
                    <span>{isWeight ? 'تحديد الوزن بالجرام' : 'بالقطعة'}</span>
                  </span>

                  {isOutOfStock && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(0,0,0,0.6)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#ffffff',
                        fontWeight: '800',
                        fontSize: '1.1rem'
                      }}
                    >
                      نفذت الكمية حالياً
                    </div>
                  )}
                </div>

                {/* Info */}
                <div>
                  {prod.origin && (
                    <div style={{ fontSize: '0.76rem', color: 'var(--mint-700)', fontWeight: '700' }}>
                      📍 {prod.origin}
                    </div>
                  )}
                  <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--text-main)', marginTop: '4px', lineHeight: '1.3' }}>
                    {prod.name}
                  </h3>
                  {prod.notes && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      الإيحاءات: {prod.notes}
                    </div>
                  )}
                </div>

                {/* Price & Action */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto', paddingTop: '10px', borderTop: '1px solid var(--border-light)', gap: '8px' }}>
                  <div style={{ flex: 1 }}>
                    {isWeight ? (
                      <>
                        <div style={{ fontSize: '1.2rem', fontWeight: '900', color: 'var(--mint-800)' }}>
                          {prod.pricePerKg || (prod.sellingPrice * 4)} <span style={{ fontSize: '0.72rem', fontWeight: '600' }}>ج.م / كجم</span>
                        </div>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block' }}>
                          يبدأ من {prod.sellingPrice} ج.م (250جم)
                        </span>
                      </>
                    ) : (
                      <div style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--mint-800)' }}>
                        {prod.sellingPrice} <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>ج.م</span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleProductCardAction(prod)}
                    disabled={isOutOfStock}
                    className="btn btn-primary"
                    style={{
                      padding: '8px 14px',
                      borderRadius: '10px',
                      opacity: isOutOfStock ? 0.5 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '0.82rem',
                      fontWeight: '800',
                      flexShrink: 0
                    }}
                  >
                    {isWeight ? <Scale size={15} /> : <Plus size={15} />}
                    <span>{isWeight ? 'تحديد الوزن' : 'أضف للسلة'}</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      </main>

      {/* 🌟 LUXURY STORE FOOTER (من نحن - العنوان - تواصل معنا - السوشيال ميديا) 🌟 */}
      <footer className="store-footer" id="store-footer">
        <div className="store-footer-container">
          
          {/* Brand & Trust Header Strip */}
          <div className="store-footer-brand-strip">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <img
                src="/caturra_logo.jpg"
                alt="Caturra Logo"
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  border: '2px solid rgba(34, 203, 124, 0.4)',
                  padding: '2px',
                  background: '#ffffff'
                }}
              />
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: '900', color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span>كاتورا للقهوة المختصة</span>
                  <span style={{ fontSize: '0.78rem', background: 'rgba(34, 203, 124, 0.2)', color: '#4ade80', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(74, 222, 128, 0.3)' }}>
                    Caturra Specialty Coffee
                  </span>
                </h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.86rem', color: '#a7f3d0' }}>
                  أصالة التحميص المختص وتجربة استثنائية من قلب المحاصيل العالمية إلى فنجانك ☕
                </p>
              </div>
            </div>

            {/* Trust Pills */}
            <div className="store-footer-trust-pills">
              <span className="trust-pill"><Award size={14} color="#4ade80" /> بن أرابيكا مختص 100%</span>
              <span className="trust-pill"><Sparkles size={14} color="#4ade80" /> تحميص طازج دوري</span>
              <span className="trust-pill"><Shield size={14} color="#4ade80" /> جودة معتمدة ومضمونة</span>
            </div>
          </div>

          {/* Main Footer 4-Column Grid */}
          <div className="store-footer-grid">
            
            {/* Column 1: من نحن (About Us) */}
            <div className="store-footer-col">
              <h3 className="store-footer-title">
                <Coffee size={18} color="#4ade80" />
                <span>من نحن</span>
              </h3>
              <p style={{ fontSize: '0.88rem', lineHeight: '1.7', color: '#cbd5e1', marginBottom: '14px' }}>
                <strong>كاتورا (Caturra)</strong> محمصة ومتجر قهوة مختصة مصري 100%. نؤمن بأن كل حبة بن تروي قصة فريدة. ننتقي بعناية أفضل المحاصيل الخضراء من مزارع إثيوبيا، كولومبيا، والبرازيل، ونحمصها بدرجات متوازنة لإبراز النكهات العطرية والإيحاءات الفاكهية والزهرية الفاخرة بدون أي إضافات صناعية.
              </p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.06)', padding: '6px 12px', borderRadius: '10px', fontSize: '0.78rem', color: '#86efac', border: '1px solid rgba(134,239,172,0.2)' }}>
                <span>🌱 تحميص محلي بحرفية عالمية</span>
              </div>
            </div>

            {/* Column 2: العنوان ومواعيد العمل (Address & Hours) */}
            <div className="store-footer-col">
              <h3 className="store-footer-title">
                <MapPin size={18} color="#4ade80" />
                <span>العنوان ومواعيد العمل</span>
              </h3>
              
              <div className="store-footer-info-item">
                <div className="store-footer-icon-wrap">
                  <MapPin size={16} />
                </div>
                <div>
                  <div style={{ fontWeight: '700', color: '#ffffff', fontSize: '0.88rem' }}>مقر المحمصة والمتجر:</div>
                  <div style={{ color: '#cbd5e1', fontSize: '0.82rem', marginTop: '2px' }}>
                    القاهرة، مصر الجديدة - شارع الثورة، بالقرب من محطة الأهرام
                  </div>
                </div>
              </div>

              <div className="store-footer-info-item" style={{ marginTop: '12px' }}>
                <div className="store-footer-icon-wrap">
                  <Clock size={16} />
                </div>
                <div>
                  <div style={{ fontWeight: '700', color: '#ffffff', fontSize: '0.88rem' }}>ساعات العمل والخدمة:</div>
                  <div style={{ color: '#cbd5e1', fontSize: '0.82rem', marginTop: '2px' }}>
                    يومياً من 8:00 صباحاً حتى 12:00 منتصف الليل
                  </div>
                </div>
              </div>

              <div className="store-footer-info-item" style={{ marginTop: '12px' }}>
                <div className="store-footer-icon-wrap">
                  <Shield size={16} />
                </div>
                <div>
                  <div style={{ fontWeight: '700', color: '#ffffff', fontSize: '0.88rem' }}>خدمة الشحن والتوصيل:</div>
                  <div style={{ color: '#cbd5e1', fontSize: '0.82rem', marginTop: '2px' }}>
                    شحن لجميع المحافظات خلال 24-48 ساعة 🚚
                  </div>
                </div>
              </div>
            </div>

            {/* Column 3: تواصل معنا (Contact Us) */}
            <div className="store-footer-col">
              <h3 className="store-footer-title">
                <Phone size={18} color="#4ade80" />
                <span>تواصل معنا</span>
              </h3>

              {/* Direct Call */}
              <a
                href="tel:01012345678"
                className="store-footer-action-link"
              >
                <div className="store-footer-icon-wrap" style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa' }}>
                  <Phone size={16} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>الاتصال الهاتفي المباشر</div>
                  <div style={{ fontWeight: '800', color: '#ffffff', fontSize: '0.92rem', direction: 'ltr', textAlign: 'right' }}>01012345678</div>
                </div>
              </a>

              {/* Direct WhatsApp */}
              <a
                href={`https://wa.me/${STORE_WHATSAPP_NUMBER.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('مرحباً كاتورا للقهوة المختصة، أود الاستفسار عن منتجاتكم وطلبات القهوة.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="store-footer-action-link"
                style={{ marginTop: '10px' }}
              >
                <div className="store-footer-icon-wrap" style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#4ade80' }}>
                  <MessageCircle size={16} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>محادثة واتساب فورية</div>
                  <div style={{ fontWeight: '800', color: '#4ade80', fontSize: '0.88rem' }}>تواصل عبر واتساب 💬</div>
                </div>
              </a>

              {/* Email */}
              <a
                href="mailto:contact@caturracoffee.com"
                className="store-footer-action-link"
                style={{ marginTop: '10px' }}
              >
                <div className="store-footer-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24' }}>
                  <Mail size={16} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>البريد الإلكتروني للطلبات</div>
                  <div style={{ fontWeight: '700', color: '#ffffff', fontSize: '0.84rem' }}>contact@caturracoffee.com</div>
                </div>
              </a>
            </div>

            {/* Column 4: السوشيال ميديا وروابط المتجر (Social Media) */}
            <div className="store-footer-col">
              <h3 className="store-footer-title">
                <Sparkles size={18} color="#4ade80" />
                <span>تابعنا على السوشيال ميديا</span>
              </h3>
              
              <p style={{ fontSize: '0.82rem', color: '#94a3b8', marginBottom: '14px' }}>
                تابع أحدث المحاصيل، عروض التحميص الحصرية، وطرق تحضير القهوة المختصة:
              </p>

              {/* Social Icons Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '16px' }}>
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="store-footer-social-card"
                  style={{ '--hover-color': '#e1306c' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
                  </svg>
                  <span>إنستجرام</span>
                </a>

                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="store-footer-social-card"
                  style={{ '--hover-color': '#1877f2' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                  </svg>
                  <span>فيسبوك</span>
                </a>

                <a
                  href="https://tiktok.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="store-footer-social-card"
                  style={{ '--hover-color': '#00f2fe' }}
                >
                  <span style={{ fontWeight: '900', fontSize: '1rem', lineHeight: '1' }}>♪</span>
                  <span>تيك توك</span>
                </a>

                <a
                  href={`https://wa.me/${STORE_WHATSAPP_NUMBER.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="store-footer-social-card"
                  style={{ '--hover-color': '#25d366' }}
                >
                  <MessageSquare size={18} />
                  <span>واتساب</span>
                </a>
              </div>

              {/* Quick Navigation Links */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px' }}>
                <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginBottom: '6px', fontWeight: '700' }}>أقسام تهمك:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('coffee');
                      window.scrollTo({ top: 380, behavior: 'smooth' });
                    }}
                    className="store-footer-tag"
                  >
                    بن مختص
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('tools');
                      window.scrollTo({ top: 380, behavior: 'smooth' });
                    }}
                    className="store-footer-tag"
                  >
                    أدوات V60
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('boxes');
                      window.scrollTo({ top: 380, behavior: 'smooth' });
                    }}
                    className="store-footer-tag"
                  >
                    بوكسات الهدايا
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Footer Bottom Bar */}
          <div className="store-footer-bottom">
            <div style={{ fontSize: '0.84rem', color: '#94a3b8' }}>
              جميع الحقوق محفوظة © {new Date().getFullYear()} <strong>كاتورا للقهوة المختصة (Caturra Coffee)</strong> • صُنع بكل شغف في مصر 🇪🇬
            </div>

            {/* Accepted Payment Badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.74rem', color: '#64748b' }}>وسائل الدفع المقبولة:</span>
              <span className="payment-chip">InstaPay</span>
              <span className="payment-chip">فودافون كاش</span>
              <span className="payment-chip">فيزا / ماستركارد</span>
              <span className="payment-chip">الدفع عند الاستلام</span>
            </div>
          </div>

        </div>
      </footer>

      {/* ⚖️ CUSTOMER WEIGHT & GRIND SELECTION MODAL ⚖️ */}
      {calibratingProduct && (
        <div className="modal-overlay" onClick={() => setCalibratingProduct(null)}>
          <div
            className="modal-content store-calibration-modal"
            style={{ maxWidth: '540px', padding: '22px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Scale size={22} color="var(--mint-700)" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--mint-950)', margin: 0 }}>
                  تخصيص وزن البن ودرجة الطحن
                </h3>
              </div>
              <button onClick={() => setCalibratingProduct(null)} className="btn-icon">
                <X size={18} />
              </button>
            </div>

            {/* Product Summary */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--mint-50)', padding: '10px 14px', borderRadius: '12px', marginBottom: '16px' }}>
              <img
                src={calibratingProduct.image || '/caturra_ethiopia.jpg'}
                alt={calibratingProduct.name}
                style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }}
              />
              <div>
                <div style={{ fontWeight: '800', fontSize: '0.95rem', color: 'var(--mint-950)' }}>
                  {calibratingProduct.name}
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--mint-700)' }}>
                  سعر الكيلو: <strong>{modalPricePerKg} ج.م</strong>
                </div>
              </div>
            </div>

            {/* Weight Choices */}
            <div style={{ marginBottom: '16px' }}>
              <label className="form-label" style={{ fontWeight: '800', color: 'var(--mint-950)', marginBottom: '8px', display: 'block' }}>
                اختر وزن العبوة:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
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
                        padding: '10px',
                        borderRadius: '10px',
                        border: isSelected ? '2px solid var(--mint-600)' : '1px solid var(--border-light)',
                        background: isSelected ? 'var(--mint-100)' : '#ffffff',
                        color: isSelected ? 'var(--mint-950)' : 'var(--text-main)',
                        fontWeight: isSelected ? '800' : '600',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        textAlign: 'right'
                      }}
                    >
                      <div>{w.label}</div>
                      <div style={{ fontSize: '0.75rem', color: isSelected ? 'var(--mint-700)' : 'var(--text-muted)' }}>
                        {Math.round(modalPricePerKg * (w.grams / 1000))} ج.م
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Weight Input */}
            <div style={{ marginBottom: '16px', background: '#f8fafc', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-light)' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)', display: 'block', marginBottom: '6px' }}>
                أو اكتب وزناً مخصصاً بالجرام (مثال: 350، 400 جرام):
              </span>
              <div style={{ position: 'relative' }}>
                <input
                  type="number"
                  min="50"
                  step="10"
                  placeholder="اكتب عدد الجرامات هنا..."
                  value={customWeightInput}
                  onChange={(e) => setCustomWeightInput(e.target.value)}
                  className="form-input"
                  style={{ height: '38px', borderRadius: '8px', textAlign: 'center', fontWeight: '700' }}
                />
                <span style={{ position: 'absolute', left: '12px', top: '10px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  جرام
                </span>
              </div>
            </div>

            {/* Grind Degree */}
            <div style={{ marginBottom: '16px' }}>
              <label className="form-label" style={{ fontWeight: '800', color: 'var(--mint-950)', marginBottom: '8px', display: 'block' }}>
                اختر درجة الطحن المطلوبة:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                {grindOptions.map(g => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedGrind(g.id)}
                    style={{
                      padding: '8px 10px',
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

            {/* Total & Add Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--mint-100)', padding: '12px 14px', borderRadius: '12px', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--mint-800)' }}>
                  الوزن: <strong>{modalActiveGrams} جرام</strong> • الطحن: <strong>{selectedGrind}</strong>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--mint-950)' }}>
                  {modalCalculatedPrice} ج.م
                </div>
              </div>

              <button
                type="button"
                onClick={handleConfirmStorefrontWeight}
                className="btn btn-primary"
                style={{ padding: '10px 20px', fontWeight: '800', borderRadius: '10px' }}
              >
                إضافة للسلة 🛍️
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SHOPPING CART DRAWER */}
      {isCartOpen && (
        <div className="modal-overlay" onClick={() => setIsCartOpen(false)}>
          <div
            className="modal-content"
            style={{
              position: 'fixed',
              left: 0,
              top: 0,
              bottom: 0,
              width: '420px',
              maxWidth: '100%',
              borderRadius: '0',
              height: '100vh',
              maxHeight: '100vh',
              display: 'flex',
              flexDirection: 'column',
              padding: '0',
              margin: '0',
              animation: 'slideUp 200ms ease'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ padding: '20px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--mint-50)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingCart size={22} color="var(--mint-700)" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--mint-900)' }}>
                  سلة المشتريات ({cart.length})
                </h3>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="btn-icon" style={{ width: '32px', height: '32px' }}>
                <X size={18} />
              </button>
            </div>

            {/* Cart Items */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
                  <ShoppingBag size={48} color="var(--mint-300)" style={{ margin: '0 auto 12px' }} />
                  <p style={{ fontWeight: '700' }}>سلتك فارغة حالياً</p>
                  <p style={{ fontSize: '0.82rem', marginTop: '4px' }}>تصفح منتجاتنا وأضف قهوتك المفضلة</p>
                </div>
              ) : (
                cart.map(item => (
                  <div
                    key={item.cartItemId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px',
                      background: item.unitType === 'weight' ? '#f4fbf7' : '#f8fafc',
                      borderRadius: '12px',
                      border: item.unitType === 'weight' ? '1px solid var(--border-mint)' : '1px solid var(--border-light)'
                    }}
                  >
                    <img
                      src={item.image || '/caturra_ethiopia.jpg'}
                      alt={item.name}
                      style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover' }}
                    />
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div style={{ fontWeight: '700', fontSize: '0.88rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                        {item.name}
                      </div>
                      
                      {item.unitType === 'weight' && (
                        <div style={{ fontSize: '0.74rem', color: 'var(--mint-700)', fontWeight: '600' }}>
                          ⚖️ {item.weightLabel || `${item.weightGram} جرام`} {item.grind ? `• ${item.grind}` : ''}
                        </div>
                      )}

                      <div style={{ fontSize: '0.8rem', color: 'var(--mint-800)', fontWeight: '700', marginTop: '2px' }}>
                        {item.price} ج.م × {item.qty} = {item.price * item.qty} ج.م
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button onClick={() => updateCartQty(item.cartItemId, -1)} className="btn-icon" style={{ width: '26px', height: '26px' }}>
                        <Minus size={12} />
                      </button>
                      <span style={{ fontWeight: '800', minWidth: '18px', textAlign: 'center' }}>{item.qty}</span>
                      <button onClick={() => updateCartQty(item.cartItemId, 1)} className="btn-icon" style={{ width: '26px', height: '26px', background: 'var(--mint-100)' }}>
                        <Plus size={12} />
                      </button>
                      <button onClick={() => removeFromCart(item.cartItemId)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '4px' }}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer & Checkout */}
            {cart.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border-light)', padding: '20px', background: '#fafbfc' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: '900', color: 'var(--mint-900)', marginBottom: '14px' }}>
                  <span>الإجمالي:</span>
                  <span>{cartTotal.toLocaleString()} ج.م</span>
                </div>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckoutOpen(true);
                  }}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px', fontSize: '1rem', fontWeight: '800' }}
                >
                  متابعة الطلب والدفع ←
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* CHECKOUT MODAL */}
      {isCheckoutOpen && (
        <div className="modal-overlay" onClick={() => setIsCheckoutOpen(false)}>
          <div className="modal-content store-checkout-modal" style={{ maxWidth: '520px', padding: '22px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--mint-900)' }}>
                إتمام الطلب وتحديد عنوان التوصيل
              </h3>
              <button onClick={() => setIsCheckoutOpen(false)} className="btn-icon" style={{ width: '30px', height: '30px' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCheckoutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">الاسم بالكامل *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: محمد السعيد"
                  value={custForm.name}
                  onChange={e => setCustForm({ ...custForm, name: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="store-checkout-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">رقم الموبايل *</label>
                  <input
                    type="tel"
                    required
                    placeholder="01XXXXXXXXX"
                    value={custForm.phone}
                    onChange={e => setCustForm({ ...custForm, phone: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">المحافظة / المدينة *</label>
                  <select
                    value={custForm.city}
                    onChange={e => setCustForm({ ...custForm, city: e.target.value })}
                    className="form-select"
                  >
                    <option value="القاهرة">القاهرة</option>
                    <option value="الجيزة">الجيزة</option>
                    <option value="الإسكندرية">الإسكندرية</option>
                    <option value="القليوبية">القليوبية</option>
                    <option value="الشرقية">الشرقية</option>
                    <option value="الدقهلية">الدقهلية</option>
                    <option value="باقي المحافظات">باقي المحافظات</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">العنوان بالتفصيل (المنطقة والشارع)</label>
                <input
                  type="text"
                  placeholder="مثال: المعادي - شارع اللاسلكي - عمارة 15"
                  value={custForm.address}
                  onChange={e => setCustForm({ ...custForm, address: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">طريقة الدفع المفضلة</label>
                <div className="store-payment-methods" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px',
                      borderRadius: '10px',
                      border: custForm.paymentMethod === 'cash' ? '2px solid var(--mint-600)' : '1px solid var(--border-light)',
                      background: custForm.paymentMethod === 'cash' ? 'var(--mint-50)' : '#ffffff',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: '700'
                    }}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash"
                      checked={custForm.paymentMethod === 'cash'}
                      onChange={() => setCustForm({ ...custForm, paymentMethod: 'cash' })}
                    />
                    <span>الدفع عند الاستلام (كاش)</span>
                  </label>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px',
                      borderRadius: '10px',
                      border: custForm.paymentMethod === 'card' ? '2px solid var(--mint-600)' : '1px solid var(--border-light)',
                      background: custForm.paymentMethod === 'card' ? 'var(--mint-50)' : '#ffffff',
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      fontWeight: '700'
                    }}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={custForm.paymentMethod === 'card'}
                      onChange={() => setCustForm({ ...custForm, paymentMethod: 'card' })}
                    />
                    <span>إنستاباي / فيزا</span>
                  </label>
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', fontWeight: '800' }}>
                <span>إجمالي الطلب:</span>
                <span style={{ color: 'var(--mint-800)', fontSize: '1.1rem' }}>{cartTotal.toLocaleString()} ج.م</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setIsCheckoutOpen(false)}
                    className="btn btn-outline"
                    style={{ flex: 1 }}
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ flex: 2, padding: '12px', fontWeight: '800' }}
                  >
                    تأكيد وإرسال الطلب الآن ☕
                  </button>
                </div>

                {/* Direct WhatsApp Order Submit */}
                <button
                  type="button"
                  onClick={(e) => handleCheckoutSubmit(e, true)}
                  style={{
                    background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px',
                    fontWeight: '800',
                    fontSize: '0.92rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(22, 163, 74, 0.3)',
                    transition: 'all 150ms'
                  }}
                  title="تأكيد الطلب وإرسال نسخته مباشرة عبر واتساب"
                >
                  <MessageSquare size={18} />
                  <span>تأكيد وإرسال الطلب عبر واتساب 💬</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* COMPLETED ORDER MODAL */}
      {completedOrder && (
        <div className="modal-overlay" onClick={() => setCompletedOrder(null)}>
          <div className="modal-content" style={{ maxWidth: '480px', padding: '28px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--mint-100)', color: 'var(--mint-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle size={36} />
            </div>

            <h3 style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--mint-950)', margin: '0 0 8px' }}>
              تم استلام طلبك بنجاح!
            </h3>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#fef3c7',
              color: '#92400e',
              border: '1px solid #fde68a',
              padding: '5px 14px',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              fontWeight: '800',
              margin: '0 auto 14px'
            }}>
              <span>⏳ حالة الطلب: طلب معلق بانتظار تأكيد الإدارة والتجهيز</span>
            </div>
            
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: '0 0 16px' }}>
              شكراً لاختيارك قهوة كاتورا المختصة. رقم فاتورتك هو <strong>{completedOrder.invoiceNumber}</strong>. تم تسجيل طلبك في نظام الإدارة كطلب معلق، ويمكنك إرسال تفاصيل الفاتورة مباشرة عبر واتساب لتسريع التأكيد والتوصيل.
            </p>

            {/* Direct WhatsApp Share Button */}
            <button
              onClick={() => {
                const waUrl = generateWhatsAppOrderUrl(completedOrder, STORE_WHATSAPP_NUMBER);
                window.open(waUrl, '_blank');
              }}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '12px',
                fontWeight: '800',
                fontSize: '0.94rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '14px',
                boxShadow: '0 4px 14px rgba(22, 163, 74, 0.3)'
              }}
            >
              <MessageSquare size={18} />
              <span>إرسال تفاصيل الطلب عبر واتساب 💬</span>
            </button>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => {
                  const inv = completedOrder;
                  setCompletedOrder(null);
                  openInvoiceModal(inv);
                }}
                className="btn btn-outline"
                style={{ flex: 1 }}
              >
                <Printer size={16} />
                <span>عرض الفاتورة</span>
              </button>

              <button
                onClick={() => setCompletedOrder(null)}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                العودة للتسوق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🛒 FLOATING MOBILE CART BAR (شريط سلة المشتريات العائم ع الموبايل) 🛒 */}
      {totalCartCount > 0 && !isCartOpen && !isCheckoutOpen && (
        <div
          className="store-mobile-cart-bar"
          onClick={() => setIsCartOpen(true)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: '#22cb7c',
              color: '#012a17',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '900',
              fontSize: '0.84rem'
            }}>
              {totalCartCount}
            </div>
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: '800' }}>سلة المشتريات</div>
              <div style={{ fontSize: '0.74rem', color: '#96ecc0' }}>{cartTotal.toLocaleString()} ج.م</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.86rem', fontWeight: '800', color: '#22cb7c' }}>
            <span>عرض السلة والدفع</span>
            <ArrowRight size={16} style={{ transform: 'rotate(180deg)' }} />
          </div>
        </div>
      )}

      {/* 🌟 AI BARISTA ASSISTANT BOT WIDGET 🌟 */}
      <StoreAiAssistant
        products={products}
        onSelectProduct={handleProductSelectFromAi}
        isOpen={isAiAssistantOpen}
        setIsOpen={setIsAiAssistantOpen}
        hasCart={totalCartCount > 0}
      />

    </div>
  );
};
