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
  ExternalLink,
  CreditCard,
  Lock,
  GraduationCap,
  BookOpen
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
    openNotificationSettings,
    academyArticles = []
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
  const [isAcademyPageOpen, setIsAcademyPageOpen] = useState(false);
  const [academySearchQuery, setAcademySearchQuery] = useState('');
  const [selectedAcademyArticle, setSelectedAcademyArticle] = useState(null);
  const [academyCategoryFilter, setAcademyCategoryFilter] = useState('all');

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
    paymentMethod: 'cash',
    cardNumber: '',
    cardHolder: '',
    cardExpiry: '',
    cardCvv: ''
  });

  const handleCardNumberChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.match(/.{1,4}/g)?.join(' ') || raw;
    setCustForm(prev => ({ ...prev, cardNumber: formatted }));
  };

  const handleCardExpiryChange = (e) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 2) {
      raw = raw.slice(0, 2) + '/' + raw.slice(2);
    }
    setCustForm(prev => ({ ...prev, cardExpiry: raw }));
  };

  const handleCardCvvChange = (e) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCustForm(prev => ({ ...prev, cardCvv: raw }));
  };

  const getCardBrand = (num = '') => {
    const clean = num.replace(/\s+/g, '');
    if (clean.startsWith('4')) return 'visa';
    if (/^(5[1-5]|2[2-7])/.test(clean)) return 'mastercard';
    if (/^3[47]/.test(clean)) return 'amex';
    return 'generic';
  };

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

    if (custForm.paymentMethod === 'card') {
      const cleanCard = (custForm.cardNumber || '').replace(/\s+/g, '');
      if (cleanCard.length < 16) {
        alert('يرجى إدخال رقم بطاقة فيزا / ماستركارد صحيح مكون من 16 رقماً');
        return;
      }
      if (!custForm.cardExpiry || custForm.cardExpiry.length < 5) {
        alert('يرجى إدخال تاريخ انتهاء البطاقة بصيغة (MM/YY)');
        return;
      }
      if (!custForm.cardCvv || custForm.cardCvv.length < 3) {
        alert('يرجى إدخال رمز الأمان (CVV) المكون من 3 أرقام خلف البطاقة');
        return;
      }
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
      paymentDetails: custForm.paymentMethod === 'card' ? {
        cardType: (custForm.cardNumber || '').replace(/\s+/g, '').startsWith('5') ? 'Mastercard' : 'Visa',
        last4: (custForm.cardNumber || '').replace(/\s+/g, '').slice(-4),
        cardHolder: custForm.cardHolder || custForm.name
      } : null,
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

            {/* Academy / Back to Store Button in Header */}
            {isAcademyPageOpen ? (
              <button
                onClick={() => {
                  setIsAcademyPageOpen(false);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="btn btn-primary"
                style={{
                  height: '38px',
                  padding: '0 14px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontWeight: '800',
                  fontSize: '0.84rem',
                  borderRadius: '10px'
                }}
                title="العودة لمتجر القهوة والتسوق"
              >
                <Coffee size={17} />
                <span>العودة للمتجر 🛍️</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setIsAcademyPageOpen(true);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="btn btn-outline"
                style={{
                  height: '38px',
                  padding: '0 12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'linear-gradient(135deg, #fffbeb 0%, #ffffff 100%)',
                  borderColor: '#f59e0b',
                  color: '#b45309',
                  fontWeight: '800',
                  fontSize: '0.82rem',
                  borderRadius: '10px'
                }}
                title="أكاديمية كاتورا للقهوة المختصة (صفحة مستقلة)"
              >
                <GraduationCap size={17} style={{ color: '#d97706' }} />
                <span className="btn-text-hide">الأكاديمية</span>
              </button>
            )}

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

      {!isAcademyPageOpen && (
        <>
          {/* HERO BANNER (Full-width background image with overlay text) */}
          <section
        className="store-hero-banner"
        style={{
          position: 'relative',
          width: '100%',
          minHeight: '440px',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          backgroundImage: `linear-gradient(to left, rgba(1, 28, 16, 0.94) 0%, rgba(2, 42, 24, 0.86) 42%, rgba(1, 25, 14, 0.6) 72%, rgba(0, 18, 9, 0.35) 100%), url('/caturra_hero.jpg?v=2')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 38%',
          backgroundRepeat: 'no-repeat',
          color: '#ffffff',
          boxSizing: 'border-box'
        }}
      >
        {/* Subtle decorative glow overlay */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 85% 50%, rgba(34, 203, 124, 0.15) 0%, transparent 60%)',
            pointerEvents: 'none'
          }}
        />

        <div className="store-hero-content-container">
          <div className="store-hero-text-block">
            
            {/* Badge */}
            <span className="store-hero-badge">
              <Sparkles size={14} color="#4ade80" />
              <span>محاصيل بن مختص طازجة مع حمص يومي بمعايير عالمية</span>
            </span>

            {/* Title */}
            <h1 className="store-hero-title">
              اكتشف رحلة النكهات الاستثنائية مع قهوة كاتورا
            </h1>

            {/* Paragraph */}
            <p className="store-hero-desc">
              محاصيل مختارة بعناية من أفضل مزارع إثيوبيا، كولومبيا، والبرازيل، مع إمكانية تحديد وزن البن بدقة بالجرام ودرجة الطحن لتناسب ذوقك وأدواتك.
            </p>

            {/* Action Buttons */}
            <div className="store-hero-actions">
              <a
                href="#products-section"
                className="btn btn-primary store-hero-cta"
              >
                <span>تصفح المحاصيل والأدوات</span>
                <span style={{ fontSize: '1rem' }}>↓</span>
              </a>
              
              <div className="store-hero-perk">
                <Shield size={16} color="#86efac" />
                <span>شحن سريع لجميع المحافظات 🚚</span>
              </div>
            </div>

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
        </>
      )}

      {/* 🎓 DEDICATED ACADEMY FULL PAGE (صفحة الأكاديمية المستقلة) 🎓 */}
      {isAcademyPageOpen && (
        <div className="store-academy-standalone-page">
          
          {/* Academy Hero Section with Cinematic Background Image */}
          <section
            className="academy-standalone-hero"
            style={{
              position: 'relative',
              width: '100%',
              minHeight: '440px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              backgroundImage: `linear-gradient(to bottom, rgba(1, 28, 16, 0.88) 0%, rgba(2, 42, 24, 0.8) 50%, rgba(1, 20, 12, 0.92) 100%), url('/caturra_academy_hero.jpg')`,
              backgroundSize: 'cover',
              backgroundPosition: 'center 35%',
              backgroundRepeat: 'no-repeat',
              color: '#ffffff',
              padding: '64px 20px 56px',
              borderBottom: '4px solid #d97706',
              boxSizing: 'border-box'
            }}
          >
            {/* Subtle atmospheric glow */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'radial-gradient(ellipse at 50% 40%, rgba(217, 119, 6, 0.15) 0%, transparent 70%)',
                pointerEvents: 'none'
              }}
            />

            <div style={{ maxWidth: '960px', margin: '0 auto', textAlign: 'center', position: 'relative', zIndex: 2 }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(217, 119, 6, 0.25)',
                color: '#fbbf24',
                border: '1px solid rgba(251, 191, 36, 0.4)',
                padding: '6px 18px',
                borderRadius: '9999px',
                fontSize: '0.86rem',
                fontWeight: '800',
                marginBottom: '16px'
              }}>
                <GraduationCap size={20} />
                <span>أكاديمية كاتورا للقهوة المختصة • Caturra Specialty Coffee Academy</span>
              </div>

              <h1 style={{ fontSize: '2.4rem', fontWeight: '900', margin: '0 0 14px', lineHeight: '1.25', textShadow: '0 3px 14px rgba(0,0,0,0.8)' }}>
                أسرار وفنون عالم القهوة المختصة بين يديك
              </h1>

              <p style={{ fontSize: '1.02rem', color: '#e2e8f0', maxWidth: '720px', margin: '0 auto 28px', lineHeight: '1.7', textShadow: '0 2px 8px rgba(0,0,0,0.7)' }}>
                دليلك الاحترافي الشامل: تعلم وصفات التقطير بالميزان، أسرار درجات الطحن لكل أداة، معالجات حبوب البن، وفنون تبخير الحليب ورسم اللاتيه مع خبراء وباريستا كاتورا.
              </p>

              {/* Academy Search & Back to Store */}
              <div style={{ maxWidth: '620px', margin: '0 auto', display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '260px' }}>
                  <Search size={18} style={{ position: 'absolute', right: '14px', top: '14px', color: '#cbd5e1' }} />
                  <input
                    type="text"
                    placeholder="ابحث في مقالات ووصفات الأكاديمية..."
                    value={academySearchQuery}
                    onChange={e => setAcademySearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 42px 12px 36px',
                      borderRadius: '12px',
                      border: '1px solid rgba(255,255,255,0.3)',
                      background: 'rgba(0, 0, 0, 0.45)',
                      color: '#ffffff',
                      fontSize: '0.94rem',
                      backdropFilter: 'blur(10px)',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  {academySearchQuery && (
                    <button
                      onClick={() => setAcademySearchQuery('')}
                      style={{ position: 'absolute', left: '12px', top: '12px', background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer' }}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>

                <button
                  onClick={() => {
                    setIsAcademyPageOpen(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="btn btn-primary"
                  style={{
                    padding: '12px 20px',
                    borderRadius: '12px',
                    fontWeight: '800',
                    fontSize: '0.92rem',
                    whiteSpace: 'nowrap',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Coffee size={18} />
                  <span>العودة لمتجر القهوة 🛍️</span>
                </button>
              </div>
            </div>
          </section>

          {/* Academy Main Content Body */}
          <main style={{ maxWidth: '1240px', margin: '0 auto', padding: '40px 20px 70px' }}>
            
            {/* Category Filter Pills */}
            <div className="store-academy-filters" style={{ marginBottom: '32px' }}>
              {[
                { id: 'all', label: 'جميع الدروس والمقالات' },
                { id: 'brewing', label: 'طرق التحضير والتقطير ☕' },
                { id: 'grind', label: 'درجات الطحن والمطاحن ⚙️' },
                { id: 'beans', label: 'المحاصيل والمعالجات 🌱' },
                { id: 'barista', label: 'مهارات الباريستا واللاتيه 🥛' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setAcademyCategoryFilter(cat.id)}
                  className={`store-academy-filter-btn ${academyCategoryFilter === cat.id ? 'active' : ''}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Articles Grid */}
            {(() => {
              const filtered = (academyArticles || []).filter(art => {
                const matchCategory = academyCategoryFilter === 'all' || art.category === academyCategoryFilter;
                const matchQuery = !academySearchQuery.trim() ||
                  art.title.toLowerCase().includes(academySearchQuery.toLowerCase()) ||
                  (art.summary && art.summary.toLowerCase().includes(academySearchQuery.toLowerCase())) ||
                  (art.content && art.content.toLowerCase().includes(academySearchQuery.toLowerCase()));
                return matchCategory && matchQuery;
              });

              if (filtered.length === 0) {
                return (
                  <div style={{ textAlign: 'center', padding: '60px 20px', background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', margin: '20px 0' }}>
                    <BookOpen size={48} style={{ color: '#d97706', marginBottom: '12px' }} />
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#1e293b', margin: '0 0 6px' }}>لم يتم العثور على مقالات مطابقة</h3>
                    <p style={{ color: '#64748b', fontSize: '0.9rem', margin: '0 0 16px' }}>جرب البحث بكلمة أخرى أو اختر تصنيفاً مختلفاً</p>
                    <button
                      onClick={() => { setAcademySearchQuery(''); setAcademyCategoryFilter('all'); }}
                      className="btn btn-outline"
                      style={{ fontSize: '0.85rem' }}
                    >
                      إعادة ضبط التصفية
                    </button>
                  </div>
                );
              }

              return (
                <div className="store-academy-grid">
                  {filtered.map(article => (
                    <article
                      key={article.id}
                      className="academy-card"
                      onClick={() => setSelectedAcademyArticle(article)}
                    >
                      <div className="academy-card-img-wrap">
                        <img
                          src={article.image || '/caturra_espresso_bag_1791023273322.jpg'}
                          alt={article.title}
                          className="academy-card-img"
                          loading="lazy"
                        />
                        <span className="academy-card-level-badge">
                          {article.level || 'لجميع المستويات'}
                        </span>
                        <span className="academy-card-cat-badge">
                          {article.category === 'brewing' ? 'طرق تحضير' :
                           article.category === 'grind' ? 'درجات طحن' :
                           article.category === 'beans' ? 'محاصيل ومعالجة' : 'مهارات باريستا'}
                        </span>
                      </div>

                      <div className="academy-card-body">
                        <div className="academy-card-meta">
                          <span className="academy-meta-item">
                            <Clock size={13} />
                            <span>{article.readTime || '4 دقائق قراءة'}</span>
                          </span>
                          <span className="academy-meta-item">
                            <Award size={13} />
                            <span>{article.author || 'خبراء كاتورا'}</span>
                          </span>
                        </div>

                        <h3 className="academy-card-title">{article.title}</h3>
                        <p className="academy-card-summary">{article.summary}</p>

                        <div className="academy-card-footer">
                          <span className="academy-read-more-btn">
                            <span>قراءة الدليل والوصفة</span>
                            <ChevronLeft size={16} />
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              );
            })()}

            {/* Quick Shop Callout Banner */}
            <div className="academy-cta-banner">
              <div className="academy-cta-content">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontWeight: '800', marginBottom: '6px' }}>
                  <Sparkles size={18} />
                  <span>جرّب ما تعلمته الآن بأفضل مذاق</span>
                </div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '900', color: '#ffffff' }}>
                  جاهز لتحضير كوبك المميز بحبوب كاتورا؟
                </h3>
                <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem' }}>
                  اختر حبوبك المحمصة طازجاً وحدد درجة الطحن التي تناسب أداتك، وسنوصلها لك في أسرع وقت.
                </p>
              </div>
              <button
                onClick={() => {
                  setIsAcademyPageOpen(false);
                  window.scrollTo({ top: 380, behavior: 'smooth' });
                }}
                className="academy-cta-btn"
              >
                <Coffee size={18} />
                <span>العودة لمتجر الحبوب والمحاصيل 🛍️</span>
              </button>
            </div>

          </main>
        </div>
      )}

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

            {/* Column 5: أكاديمية القهوة (Coffee Academy) */}
            <div className="store-footer-col">
              <h3 className="store-footer-title">
                <GraduationCap size={18} color="#4ade80" />
                <span>أكاديمية كاتورا</span>
              </h3>
              
              <p style={{ fontSize: '0.84rem', lineHeight: '1.6', color: '#cbd5e1', marginBottom: '12px' }}>
                دليلك التعليمي المجاني لتعلم أسرار القهوة المختصة، درجات الطحن، وطرق التقطير باحترافية.
              </p>

              {/* Direct Button to Open Dedicated Academy Page */}
              <button
                type="button"
                onClick={() => {
                  setIsAcademyPageOpen(true);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="store-footer-action-link"
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, rgba(217, 119, 6, 0.25) 0%, rgba(5, 150, 105, 0.2) 100%)',
                  border: '1px solid rgba(217, 119, 6, 0.45)',
                  cursor: 'pointer',
                  marginBottom: '14px',
                  textAlign: 'right'
                }}
              >
                <div className="store-footer-icon-wrap" style={{ background: 'rgba(217, 119, 6, 0.3)', color: '#fbbf24' }}>
                  <GraduationCap size={17} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.72rem', color: '#fde68a', fontWeight: '700' }}>محتوى تعليمي وباريستا</div>
                  <div style={{ fontWeight: '900', color: '#ffffff', fontSize: '0.9rem' }}>دخول صفحة الأكاديمية 🎓 ←</div>
                </div>
              </button>

              {/* Quick Links to Featured Articles */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px' }}>
                <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginBottom: '6px', fontWeight: '700' }}>دروس مختارة:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {(academyArticles || []).slice(0, 4).map(art => (
                    <div
                      key={art.id}
                      onClick={() => {
                        setIsAcademyPageOpen(true);
                        setSelectedAcademyArticle(art);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      style={{
                        fontSize: '0.8rem',
                        color: '#cbd5e1',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 180ms ease'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.color = '#4ade80';
                        e.currentTarget.style.paddingRight = '4px';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.color = '#cbd5e1';
                        e.currentTarget.style.paddingRight = '0px';
                      }}
                    >
                      <span style={{ color: '#d97706', fontSize: '0.75rem' }}>☕</span>
                      <span>{art.title}</span>
                    </div>
                  ))}
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
                    <span>بطاقة بنكية / فيزا 💳</span>
                  </label>
                </div>
              </div>

              {/* 💳 DYNAMIC CREDIT CARD FORM (يظهر عند اختيار بطاقة بنكية / فيزا) 💳 */}
              {custForm.paymentMethod === 'card' && (
                <div
                  className="store-card-payment-box"
                  style={{
                    background: 'linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%)',
                    border: '1.5px solid var(--border-mint)',
                    borderRadius: '16px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    animation: 'fadeIn 250ms ease'
                  }}
                >
                  {/* Interactive Virtual Card Preview */}
                  <div
                    style={{
                      background: 'linear-gradient(135deg, #022e1b 0%, #064e3b 50%, #011f12 100%)',
                      borderRadius: '14px',
                      padding: '16px 18px',
                      color: '#ffffff',
                      boxShadow: '0 8px 24px rgba(2, 46, 27, 0.25)',
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      minHeight: '170px'
                    }}
                  >
                    {/* Background watermarks */}
                    <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(34, 203, 124, 0.08)', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', left: '-30px', top: '-30px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.05)', pointerEvents: 'none' }} />

                    {/* Card Top: Logo & Brand Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img src="/caturra_logo.jpg" alt="Caturra" style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#fff' }} />
                        <span style={{ fontSize: '0.85rem', fontWeight: '800', letterSpacing: '0.5px', color: '#86efac' }}>CATURRA PAY</span>
                      </div>
                      
                      {/* Brand Logo (Visa or Mastercard) */}
                      {getCardBrand(custForm.cardNumber) === 'mastercard' ? (
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#eb001b' }} />
                          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#f79e1b', marginLeft: '-10px', opacity: 0.88 }} />
                        </div>
                      ) : (
                        <div style={{ fontWeight: '900', fontStyle: 'italic', fontSize: '1.35rem', color: '#ffffff', letterSpacing: '2px' }}>
                          VISA
                        </div>
                      )}
                    </div>

                    {/* Chip & Contactless */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '8px 0' }}>
                      <div style={{ width: '36px', height: '26px', borderRadius: '5px', background: 'linear-gradient(135deg, #fcd34d 0%, #d97706 100%)', border: '1px solid #b45309' }} />
                      <span style={{ fontSize: '1rem', opacity: 0.7 }}>🛜</span>
                    </div>

                    {/* Card Number */}
                    <div style={{
                      fontSize: '1.25rem',
                      fontFamily: 'monospace',
                      letterSpacing: '2.5px',
                      color: '#ffffff',
                      fontWeight: '700',
                      direction: 'ltr',
                      textAlign: 'left'
                    }}>
                      {custForm.cardNumber || '•••• •••• •••• ••••'}
                    </div>

                    {/* Cardholder & Expiry */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '6px' }}>
                      <div>
                        <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>حامل البطاقة</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#e2e8f0', textTransform: 'uppercase', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {custForm.cardHolder || custForm.name || 'CARDHOLDER NAME'}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right', direction: 'ltr' }}>
                        <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase' }}>ينتهي في</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#e2e8f0' }}>
                          {custForm.cardExpiry || 'MM/YY'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Form Inputs */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '2px' }}>
                    
                    {/* Card Number Input */}
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: '800' }}>
                        رقم البطاقة (16 رقماً) *
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="0000 0000 0000 0000"
                          value={custForm.cardNumber}
                          onChange={handleCardNumberChange}
                          maxLength={19}
                          className="form-input"
                          style={{
                            direction: 'ltr',
                            textAlign: 'left',
                            fontSize: '0.96rem',
                            fontWeight: '700',
                            paddingLeft: '40px',
                            letterSpacing: '1px'
                          }}
                        />
                        <CreditCard
                          size={18}
                          style={{
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--mint-700)'
                          }}
                        />
                      </div>
                    </div>

                    {/* Cardholder Name Input */}
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: '800' }}>
                        الاسم كما هو مدون على البطاقة *
                      </label>
                      <input
                        type="text"
                        placeholder="مثال: MOHAMED AHMED"
                        value={custForm.cardHolder}
                        onChange={e => setCustForm({ ...custForm, cardHolder: e.target.value.toUpperCase() })}
                        className="form-input"
                        style={{ fontSize: '0.88rem', fontWeight: '700' }}
                      />
                    </div>

                    {/* Expiry & CVV Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      
                      {/* Expiry */}
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: '800' }}>
                          تاريخ الانتهاء *
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="MM/YY"
                          value={custForm.cardExpiry}
                          onChange={handleCardExpiryChange}
                          maxLength={5}
                          className="form-input"
                          style={{ direction: 'ltr', textAlign: 'center', fontWeight: '700' }}
                        />
                      </div>

                      {/* CVV */}
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontSize: '0.82rem', fontWeight: '800', display: 'flex', justifyContent: 'space-between' }}>
                          <span>رمز الأمان (CVV) *</span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>3 أرقام خلف الكارت</span>
                        </label>
                        <div style={{ position: 'relative' }}>
                          <input
                            type="password"
                            inputMode="numeric"
                            placeholder="•••"
                            value={custForm.cardCvv}
                            onChange={handleCardCvvChange}
                            maxLength={4}
                            className="form-input"
                            style={{ direction: 'ltr', textAlign: 'center', fontWeight: '800', paddingLeft: '32px' }}
                          />
                          <Lock
                            size={16}
                            style={{
                              position: 'absolute',
                              left: '10px',
                              top: '50%',
                              transform: 'translateY(-50%)',
                              color: 'var(--text-muted)'
                            }}
                          />
                        </div>
                      </div>

                    </div>

                    {/* Security Notice */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: 'rgba(34, 197, 94, 0.1)',
                      border: '1px solid rgba(34, 197, 94, 0.25)',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '0.76rem',
                      color: 'var(--mint-900)'
                    }}>
                      <Shield size={16} color="var(--mint-700)" style={{ flexShrink: 0 }} />
                      <span>معاملة مشفرة وآمنة 100% بنظام الحماية البنكي الثلاثي (3D Secure).</span>
                    </div>

                  </div>
                </div>
              )}

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
                    style={{
                      flex: 2,
                      padding: '12px',
                      fontWeight: '800',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    {custForm.paymentMethod === 'card' ? (
                      <>
                        <Lock size={16} />
                        <span>دفع {cartTotal.toLocaleString()} ج.م وتأكيد الطلب 💳</span>
                      </>
                    ) : (
                      <span>تأكيد وإرسال الطلب الآن ☕</span>
                    )}
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

      {/* 📖 ACADEMY ARTICLE READING MODAL (مودال قراءة مقالات الأكاديمية للعميل) 📖 */}
      {selectedAcademyArticle && (
        <div
          className="modal-backdrop"
          onClick={() => setSelectedAcademyArticle(null)}
          style={{ zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
        >
          <div
            className="modal-card academy-reader-modal"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '780px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              padding: 0,
              borderRadius: '24px',
              border: '1px solid rgba(217, 119, 6, 0.25)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)'
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 22px',
                borderBottom: '1px solid var(--border-light)',
                background: '#ffffff'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  background: '#fef3c7',
                  color: '#d97706',
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <GraduationCap size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: '900', fontSize: '1.05rem', color: 'var(--mint-950)' }}>
                    أكاديمية كاتورا للقهوة المختصة
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#6b7280' }}>
                    دروس ووصفات باريستا معتمدة
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedAcademyArticle(null)}
                className="btn btn-outline"
                style={{ width: '36px', height: '36px', padding: 0, borderRadius: '50%', color: '#6b7280' }}
                aria-label="إغلاق"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              {/* Cover Hero Image */}
              <div style={{
                position: 'relative',
                borderRadius: '16px',
                overflow: 'hidden',
                height: '240px',
                marginBottom: '20px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
              }}>
                <img
                  src={selectedAcademyArticle.image}
                  alt={selectedAcademyArticle.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  padding: '20px'
                }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <span style={{
                      background: 'rgba(217, 119, 6, 0.9)',
                      color: '#ffffff',
                      padding: '3px 10px',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: '800'
                    }}>
                      {selectedAcademyArticle.level}
                    </span>
                    <span style={{
                      background: 'rgba(5, 150, 105, 0.9)',
                      color: '#ffffff',
                      padding: '3px 10px',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: '800'
                    }}>
                      {selectedAcademyArticle.category === 'brewing' ? 'طرق تحضير' :
                       selectedAcademyArticle.category === 'grind' ? 'درجات طحن' :
                       selectedAcademyArticle.category === 'beans' ? 'محاصيل ومعالجة' : 'مهارات باريستا'}
                    </span>
                  </div>

                  <h1 style={{ color: '#ffffff', fontSize: '1.45rem', fontWeight: '900', margin: '0 0 8px', lineHeight: '1.3' }}>
                    {selectedAcademyArticle.title}
                  </h1>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'rgba(255,255,255,0.85)', fontSize: '0.8rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Clock size={14} />
                      {selectedAcademyArticle.readTime}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Award size={14} />
                      {selectedAcademyArticle.author}
                    </span>
                  </div>
                </div>
              </div>

              {/* Summary lead */}
              <div style={{
                background: '#f8fafc',
                borderRight: '4px solid #d97706',
                padding: '14px 18px',
                borderRadius: '8px',
                fontSize: '0.98rem',
                color: '#334155',
                lineHeight: '1.6',
                fontWeight: '600',
                marginBottom: '20px'
              }}>
                {selectedAcademyArticle.summary}
              </div>

              {/* Content Formatted */}
              <div className="academy-modal-content" style={{ fontSize: '0.96rem', lineHeight: '1.8', color: '#1e293b' }}>
                {selectedAcademyArticle.content.split('\n\n').map((block, i) => {
                  if (block.startsWith('### ')) {
                    return (
                      <h3 key={i} style={{ color: '#0f172a', fontWeight: '800', fontSize: '1.18rem', margin: '22px 0 10px', borderBottom: '2px solid #f1f5f9', paddingBottom: '6px' }}>
                        {block.replace('### ', '')}
                      </h3>
                    );
                  } else if (block.startsWith('## ')) {
                    return (
                      <h2 key={i} style={{ color: '#0f172a', fontWeight: '900', fontSize: '1.3rem', margin: '26px 0 12px' }}>
                        {block.replace('## ', '')}
                      </h2>
                    );
                  } else if (block.startsWith('💡') || block.startsWith('📌') || block.startsWith('⚠️')) {
                    return (
                      <div key={i} style={{
                        background: '#fffbeb',
                        border: '1px solid #fde68a',
                        borderRadius: '12px',
                        padding: '14px 16px',
                        margin: '16px 0',
                        color: '#92400e',
                        fontWeight: '600'
                      }}>
                        {block}
                      </div>
                    );
                  } else {
                    return (
                      <p key={i} style={{ margin: '0 0 14px', whiteSpace: 'pre-line' }}>
                        {block}
                      </p>
                    );
                  }
                })}
              </div>
            </div>

            {/* Modal Actions */}
            <div
              style={{
                display: 'flex',
                gap: '12px',
                padding: '16px 24px',
                borderTop: '1px solid var(--border-light)',
                background: '#f8fafc'
              }}
            >
              <button
                onClick={() => {
                  setSelectedAcademyArticle(null);
                  window.scrollTo({ top: 380, behavior: 'smooth' });
                }}
                className="btn btn-primary"
                style={{ flex: 1, padding: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <Coffee size={18} />
                <span>تسوق حبوب مناسبة لهذا التحضير ☕</span>
              </button>

              <button
                onClick={() => setSelectedAcademyArticle(null)}
                className="btn btn-outline"
                style={{ padding: '12px 24px', fontWeight: '700' }}
              >
                إغلاق
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
