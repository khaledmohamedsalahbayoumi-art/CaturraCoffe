import React, { useState } from 'react';
import {
  Coffee,
  Shield,
  Truck,
  Award,
  Package,
  Sparkles,
  Phone,
  Send,
  MessageCircle,
  CheckCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  Sliders,
  Scale,
  Building,
  User,
  Mail,
  MapPin,
  Check,
  Zap,
  Tag
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { STORE_WHATSAPP_NUMBER, formatWhatsAppNumber } from '../utils/whatsapp';

export const StoreB2BView = ({ onNavigateToStore }) => {
  const { language, t, isRtl, contactInfo, addB2BRequest } = useApp();

  const activeWhatsApp = contactInfo?.whatsapp || STORE_WHATSAPP_NUMBER;
  const cleanStoreWhatsApp = formatWhatsAppNumber(activeWhatsApp);
  const activePhone = contactInfo?.phone || '01033144498';
  const activeEmail = contactInfo?.email || 'wholesale@caturracoffee.com';

  const [formData, setFormData] = useState({
    companyName: '',
    contactName: '',
    phone: '',
    email: '',
    city: '',
    businessType: 'specialty_cafe',
    monthlyVolume: '25-50',
    privateLabel: false,
    monthlyContract: true,
    extractionSupport: true,
    notes: ''
  });

  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [submittedRef, setSubmittedRef] = useState('');

  const cityOptions = [
    { id: 'cairo', ar: 'القاهرة', en: 'Cairo' },
    { id: 'giza', ar: 'الجيزة', en: 'Giza' },
    { id: 'alex', ar: 'الإسكندرية', en: 'Alexandria' },
    { id: 'mansoura', ar: 'الدقهلية (المنصورة)', en: 'Dakahlia (Mansoura)' },
    { id: 'gharbia', ar: 'الغربية (طنطا)', en: 'Gharbia (Tanta)' },
    { id: 'north_coast', ar: 'الساحل الشمالي / مطروح', en: 'North Coast / Matrouh' },
    { id: 'red_sea', ar: 'البحر الأحمر (الغردقة / الجونة)', en: 'Red Sea (Hurghada / El Gouna)' },
    { id: 'sinai', ar: 'جنوب سيناء (شرم الشيخ / دهب)', en: 'South Sinai (Sharm El Sheikh / Dahab)' },
    { id: 'other', ar: 'محافظات أخرى (شحن مباشر)', en: 'Other Governorates (Direct Delivery)' }
  ];

  const businessTypes = [
    { id: 'specialty_cafe', ar: 'كافيه مختص (Specialty Coffee)', en: 'Specialty Coffee Shop' },
    { id: 'commercial_cafe', ar: 'كافيه تجاري / كوفي كورنر', en: 'Commercial Café / Coffee Corner' },
    { id: 'restaurant_hotel', ar: 'مطعم / فندق وضيافة', en: 'Restaurant / Hotel / Hospitality' },
    { id: 'office_corporate', ar: 'شركة / مقر ومكتب أعمال', en: 'Corporate / Office' },
    { id: 'new_brand', ar: 'براند قهوة جديد (Private Label)', en: 'New Coffee Brand (Private Label)' },
    { id: 'other', ar: 'نشاط تجاري آخر', en: 'Other Business Type' }
  ];

  const volumeOptions = [
    { id: '10-25', ar: '10 - 25 كجم شهرياً (بداية مثالية)', en: '10 - 25 kg / month (Ideal Start)' },
    { id: '25-50', ar: '25 - 50 كجم شهرياً (كافيه متوسط)', en: '25 - 50 kg / month (Medium Café)' },
    { id: '50-100', ar: '50 - 100 كجم شهرياً (كافيه نشط)', en: '50 - 100 kg / month (Busy Café)' },
    { id: '100+', ar: 'أكثر من 100 كجم شهرياً (سلاسل وتوريد ضخم)', en: '100+ kg / month (Multi-branch / High Volume)' }
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const buildWhatsAppText = (customRef) => {
    const typeLabel = businessTypes.find(b => b.id === formData.businessType)?.[language] || formData.businessType;
    const volLabel = volumeOptions.find(v => v.id === formData.monthlyVolume)?.[language] || formData.monthlyVolume;

    const extras = [];
    if (formData.privateLabel) extras.push(language === 'ar' ? '• أرغب بتعبئة بأكياسي الخاصة (Private Label)' : '• Private Label requested');
    if (formData.monthlyContract) extras.push(language === 'ar' ? '• أرغب في عقد توريد شهري منتظم' : '• Monthly supply contract requested');
    if (formData.extractionSupport) extras.push(language === 'ar' ? '• أحتاج دعماً فني لضبط الاستخلاص وتدريب الباريستا' : '• Dial-in support requested');

    return language === 'ar'
      ? `*طلب عرض سعر جملة وتوريد لكافيه (B2B) ☕📦*\n` +
        (customRef ? `• *كود الطلب المرجعي:* ${customRef}\n` : '') +
        `• *المنشأة / الكافيه:* ${formData.companyName}\n` +
        `• *المسؤول:* ${formData.contactName || 'غير محدد'}\n` +
        `• *الهاتف:* ${formData.phone}\n` +
        `• *البريد:* ${formData.email || 'غير محدد'}\n` +
        `• *المدينة / المحافظة:* ${formData.city}\n` +
        `• *نوع النشاط:* ${typeLabel}\n` +
        `• *الاستهلاك التقديري:* ${volLabel}\n` +
        (extras.length > 0 ? `\n*المتطلبات الإضافية:*\n${extras.join('\n')}\n` : '') +
        (formData.notes.trim() ? `\n*ملاحظات إضافية:*\n${formData.notes}\n` : '') +
        `\n_مرسل عبر متجر محمصة كاتورا الرسمي_`
      : `*B2B Wholesale & Roasting Inquiry ☕📦*\n` +
        (customRef ? `• *Reference Code:* ${customRef}\n` : '') +
        `• *Company / Café:* ${formData.companyName}\n` +
        `• *Contact Person:* ${formData.contactName || 'N/A'}\n` +
        `• *Phone:* ${formData.phone}\n` +
        `• *Email:* ${formData.email || 'N/A'}\n` +
        `• *City / Region:* ${formData.city}\n` +
        `• *Business Type:* ${typeLabel}\n` +
        `• *Estimated Volume:* ${volLabel}\n` +
        (extras.length > 0 ? `\n*Requirements:*\n${extras.join('\n')}\n` : '') +
        (formData.notes.trim() ? `\n*Notes:*\n${formData.notes}\n` : '') +
        `\n_Sent via Caturra Specialty Coffee Online Platform_`;
  };

  const handleSendViaWhatsApp = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!formData.companyName.trim() || !formData.phone.trim()) {
      alert(language === 'ar' ? 'يرجى كتابة اسم المنشأة ورقم الهاتف للتواصل أولاً' : 'Please provide company name and phone number first.');
      return;
    }

    const refCode = submittedRef || `CAT-B2B-${Math.floor(1000 + Math.random() * 9000)}`;
    if (!submittedRef) {
      setSubmittedRef(refCode);
      if (typeof addB2BRequest === 'function') {
        addB2BRequest({ ...formData, refCode });
      }
    }
    setSubmittedSuccess(true);

    const waText = buildWhatsAppText(refCode);
    const waUrl = `https://wa.me/${cleanStoreWhatsApp}?text=${encodeURIComponent(waText)}`;
    window.open(waUrl, '_blank');
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formData.companyName.trim() || !formData.phone.trim()) {
      alert(language === 'ar' ? 'يرجى كتابة اسم المنشأة ورقم الهاتف أولاً' : 'Please provide company name and phone number first.');
      return;
    }

    const refCode = `CAT-B2B-${Math.floor(1000 + Math.random() * 9000)}`;
    setSubmittedRef(refCode);
    setSubmittedSuccess(true);

    // Save inquiry directly into ERP Dashboard and trigger sound/toast notifications
    if (typeof addB2BRequest === 'function') {
      addB2BRequest({ ...formData, refCode });
    }

    window.scrollTo({ top: (document.getElementById('b2b-form-section')?.offsetTop || 0) - 80, behavior: 'smooth' });

    // Instantly launch WhatsApp with complete inquiry & reference code
    const waText = buildWhatsAppText(refCode);
    const waUrl = `https://wa.me/${cleanStoreWhatsApp}?text=${encodeURIComponent(waText)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <section className="store-b2b-page" style={{ color: '#4A3220', minHeight: '100vh', padding: 0, overflowX: 'hidden' }}>

      {/* 🌟 1. HERO B2B INTRO BANNER (Full-width, full-screen height, vivid coffee image) 🌟 */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          minHeight: 'calc(100vh - 72px)',
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#0c0502',
          borderBottom: '1.5px solid rgba(212, 163, 115, 0.28)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.75)',
          overflow: 'hidden',
          marginBottom: '64px'
        }}
      >
        {/* Background Image Layer from Coffee.html - Highly Visible & Vivid */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 0,
            pointerEvents: 'none',
            overflow: 'hidden'
          }}
        >
          <video
            autoPlay
            loop
            muted
            playsInline
            poster="/caturra_wholesale_hero.jpg"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              opacity: 0.98,
              filter: 'contrast(1.08) brightness(1.02)'
            }}
          >
            <source src="/caturra_wholesale_video.mp4" type="video/mp4" />
            <img
              src="/caturra_wholesale_hero.jpg"
              alt="Caturra Coffee Wholesale Beans"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />
          </video>
          {/* Transparent minimal gradient for pure video clarity while preserving text contrast */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: isRtl
                ? 'linear-gradient(270deg, rgba(14, 6, 2, 0.82) 0%, rgba(18, 8, 3, 0.52) 38%, rgba(14, 6, 2, 0.08) 75%, transparent 100%)'
                : 'linear-gradient(90deg, rgba(14, 6, 2, 0.82) 0%, rgba(18, 8, 3, 0.52) 38%, rgba(14, 6, 2, 0.08) 75%, transparent 100%)'
            }}
          />
          {/* Subtle top & bottom edge blend */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(to bottom, rgba(10, 4, 1, 0.25) 0%, transparent 15%, transparent 85%, rgba(10, 4, 1, 0.9) 100%)'
            }}
          />
        </div>

        {/* Subtle Ambient Glow */}
        <div
          style={{
            position: 'absolute',
            top: '-60px',
            left: isRtl ? 'auto' : '-60px',
            right: isRtl ? '-60px' : 'auto',
            width: '450px',
            height: '450px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(212, 163, 115, 0.2) 0%, transparent 70%)',
            pointerEvents: 'none',
            filter: 'blur(40px)',
            zIndex: 1
          }}
        />

        <div
          style={{
            position: 'relative',
            zIndex: 2,
            width: '100%',
            maxWidth: '1240px',
            margin: '0 auto',
            padding: '70px 24px'
          }}
        >
          <div style={{ maxWidth: '820px' }}>
            {/* Eyebrow Pill */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '7px 16px',
                borderRadius: '9999px',
                background: 'rgba(25, 10, 5, 0.75)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(212, 163, 115, 0.45)',
                color: '#e6b87d',
                fontSize: '0.84rem',
                fontWeight: '800',
                letterSpacing: '0.5px',
                marginBottom: '20px',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)'
              }}
            >
              <Sparkles size={14} color="#e6b87d" />
              <span>{t('b2bEyebrow')}</span>
            </div>

            {/* Main Heading */}
            <h1
              style={{
                fontSize: 'clamp(2.4rem, 5.5vw, 3.8rem)',
                fontWeight: '900',
                color: '#ffffff',
                lineHeight: '1.18',
                margin: '0 0 18px',
                letterSpacing: '-0.5px',
                textShadow: '0 3px 20px rgba(0, 0, 0, 0.95), 0 1px 4px rgba(0, 0, 0, 0.8)'
              }}
            >
              {t('b2bTitle')}
            </h1>

            {/* Subtitle */}
            <p
              style={{
                fontSize: 'clamp(1.05rem, 2.2vw, 1.24rem)',
                color: '#eedcd0',
                lineHeight: '1.9',
                margin: '0 0 34px',
                maxWidth: '780px',
                textShadow: '0 2px 14px rgba(0, 0, 0, 0.95)'
              }}
            >
              {t('b2bSubtitle')}
            </p>

            {/* Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
              <a
                href="#b2b-form-section"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #96663B 0%, #7A5230 100%)',
                  color: '#ffffff',
                  padding: '14px 28px',
                  borderRadius: '14px',
                  fontWeight: '800',
                  fontSize: '0.98rem',
                  textDecoration: 'none',
                  boxShadow: '0 8px 24px rgba(150, 102, 59, 0.35)',
                  transition: 'all 0.2s ease'
                }}
              >
                <Send size={18} />
                <span>{t('b2bCtaQuote')}</span>
              </a>

              <a
                href={`https://wa.me/${cleanStoreWhatsApp}?text=${encodeURIComponent(language === 'ar' ? 'مرحباً، أود الاستفسار عن تفاصيل وأسعار توريد القهوة بالجملة للكافيهات (B2B) ☕' : 'Hello, I would like to inquire about wholesale coffee supply for my café (B2B) ☕')}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(37, 211, 102, 0.22)',
                  backdropFilter: 'blur(8px)',
                  color: '#4ade80',
                  border: '1.5px solid rgba(74, 222, 128, 0.55)',
                  padding: '14px 24px',
                  borderRadius: '14px',
                  fontWeight: '800',
                  fontSize: '0.98rem',
                  textDecoration: 'none',
                  boxShadow: '0 6px 20px rgba(37, 211, 102, 0.25)',
                  transition: 'all 0.2s ease'
                }}
              >
                <MessageCircle size={18} />
                <span>{t('b2bCtaWhatsApp')}</span>
              </a>

              {onNavigateToStore && (
                <button
                  type="button"
                  onClick={onNavigateToStore}
                  style={{
                    background: 'rgba(25, 10, 5, 0.65)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(212, 163, 115, 0.45)',
                    color: '#e6b87d',
                    padding: '14px 22px',
                    borderRadius: '14px',
                    fontWeight: '700',
                    fontSize: '0.94rem',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.35)'
                  }}
                >
                  <Coffee size={16} />
                  <span>{language === 'ar' ? 'معاينة منتجات المتجر' : 'Browse Retail Store'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content container for Sections 2 to 6 */}
      <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 20px 80px' }}>

        {/* 🌟 2. WHAT WE OFFER - THREE SERVICES (ثلاث خدمات بلا تعقيد) 🌟 */}
        <div style={{ marginBottom: '56px' }}>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.92rem',
                color: '#96663B',
                fontWeight: '800',
                letterSpacing: '0.5px',
                background: 'rgba(150, 102, 59, 0.12)',
                padding: '6px 18px',
                borderRadius: '9999px',
                border: '1px solid rgba(150, 102, 59, 0.28)',
                marginBottom: '10px'
              }}
            >
              {t('b2bServicesSub')}
            </span>
            <h2
              style={{
                fontSize: 'clamp(1.9rem, 4vw, 2.6rem)',
                fontWeight: '900',
                color: '#2C1810',
                margin: '6px 0 0',
                letterSpacing: '-0.5px',
                lineHeight: '1.25'
              }}
            >
              {t('b2bServicesTitle')}
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
              gap: '20px'
            }}
          >
            {/* Service 1 */}
            <div
              style={{
                background: '#FFFDF9',
                borderRadius: '22px',
                padding: '30px 24px',
                border: '1.5px solid #EDD9BD',
                boxShadow: 'var(--h-shadow-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                transition: 'transform 0.2s ease'
              }}
            >
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '16px',
                  background: '#FFF8EE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #EDD9BD'
                }}
              >
                <Coffee size={28} color="#96663B" />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#4A3220' }}>
                {t('b2bSrv1Title')}
              </h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#5C3D2E', lineHeight: '1.8' }}>
                {t('b2bSrv1Desc')}
              </p>
              <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px dashed #EDD9BD', fontSize: '0.8rem', color: '#96663B', fontWeight: '700' }}>
                ✓ {language === 'ar' ? 'درجات طحن مخصصة أو حبوب كاملة' : 'Custom grind sizes or whole bean'}
              </div>
            </div>

            {/* Service 2 */}
            <div
              style={{
                background: '#FFFDF9',
                borderRadius: '22px',
                padding: '30px 24px',
                border: '1.5px solid #EDD9BD',
                boxShadow: 'var(--h-shadow-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                position: 'relative'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: '16px',
                  left: isRtl ? 'auto' : '16px',
                  right: isRtl ? '16px' : 'auto',
                  background: 'rgba(196, 154, 92, 0.2)',
                  border: '1px solid #C49A5C',
                  color: '#96663B',
                  padding: '2px 10px',
                  borderRadius: '9999px',
                  fontSize: '0.72rem',
                  fontWeight: '800'
                }}
              >
                HOT ★
              </div>
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '16px',
                  background: '#FFF8EE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #EDD9BD'
                }}
              >
                <Tag size={28} color="#96663B" />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#4A3220' }}>
                {t('b2bSrv2Title')}
              </h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#5C3D2E', lineHeight: '1.8' }}>
                {t('b2bSrv2Desc')}
              </p>
              <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px dashed #EDD9BD', fontSize: '0.8rem', color: '#96663B', fontWeight: '700' }}>
                ✓ {language === 'ar' ? 'بدون أي تكاليف إضافية على التحميص والتعبئة' : 'Zero extra roasting/packing fee'}
              </div>
            </div>

            {/* Service 3 */}
            <div
              style={{
                background: '#FFFDF9',
                borderRadius: '22px',
                padding: '30px 24px',
                border: '1.5px solid #EDD9BD',
                boxShadow: 'var(--h-shadow-md)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px'
              }}
            >
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '16px',
                  background: '#FFF8EE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #EDD9BD'
                }}
              >
                <Zap size={28} color="#96663B" />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#4A3220' }}>
                {t('b2bSrv3Title')}
              </h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#5C3D2E', lineHeight: '1.8' }}>
                {t('b2bSrv3Desc')}
              </p>
              <div style={{ marginTop: 'auto', paddingTop: '12px', borderTop: '1px dashed #EDD9BD', fontSize: '0.8rem', color: '#96663B', fontWeight: '700' }}>
                ✓ {language === 'ar' ? 'خصومات شهرية دورية وتثبيت أسعار' : 'Guaranteed volume tiers & price stability'}
              </div>
            </div>
          </div>
        </div>

        {/* 🌟 3. GUARANTEE SECTION (بديل العينات - ضمان يغنيك عنها) 🌟 */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1f0d06 0%, #291209 100%)',
            borderRadius: '26px',
            padding: '38px 28px',
            border: '1.5px solid rgba(212, 163, 115, 0.35)',
            boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
            marginBottom: '56px'
          }}
        >
          <div style={{ maxWidth: '820px', marginBottom: '28px' }}>
            <span style={{ fontSize: '0.8rem', color: '#e6b87d', fontWeight: '800', letterSpacing: '1px' }}>
              {t('b2bGuaranteeBadge')}
            </span>
            <h2 style={{ fontSize: 'clamp(1.5rem, 3.2vw, 2.1rem)', fontWeight: '900', color: '#ffffff', margin: '6px 0 10px' }}>
              {t('b2bGuaranteeTitle')}
            </h2>
            <p style={{ margin: 0, fontSize: '0.94rem', color: '#d6c4b6', lineHeight: '1.8' }}>
              {t('b2bGuaranteeSub')}
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px'
            }}
          >
            {/* Guarantee 1 (Main) */}
            <div
              style={{
                gridColumn: '1 / -1',
                background: 'linear-gradient(135deg, rgba(212, 163, 115, 0.15) 0%, rgba(194, 123, 56, 0.12) 100%)',
                border: '1.5px solid rgba(212, 163, 115, 0.5)',
                borderRadius: '18px',
                padding: '22px 20px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '14px'
              }}
            >
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: '#96663B',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Shield size={22} />
              </div>
              <div>
                <h4 style={{ margin: '0 0 6px', fontSize: '1.1rem', fontWeight: '800', color: '#ffd79e' }}>
                  {t('b2bGuar1Title')}
                </h4>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#f5ebe1', lineHeight: '1.8' }}>
                  {t('b2bGuar1Desc')}
                </p>
              </div>
            </div>

            {/* Guarantee 2 */}
            <div
              style={{
                background: 'rgba(25, 10, 5, 0.65)',
                border: '1px solid rgba(212, 163, 115, 0.25)',
                borderRadius: '16px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sliders size={20} color="#e6b87d" />
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: '#ffffff' }}>
                  {t('b2bGuar2Title')}
                </h4>
              </div>
              <p style={{ margin: 0, fontSize: '0.86rem', color: '#c4b0a1', lineHeight: '1.75' }}>
                {t('b2bGuar2Desc')}
              </p>
            </div>

            {/* Guarantee 3 */}
            <div
              style={{
                background: 'rgba(25, 10, 5, 0.65)',
                border: '1px solid rgba(212, 163, 115, 0.25)',
                borderRadius: '16px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Scale size={20} color="#e6b87d" />
                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: '#ffffff' }}>
                  {t('b2bGuar3Title')}
                </h4>
              </div>
              <p style={{ margin: 0, fontSize: '0.86rem', color: '#c4b0a1', lineHeight: '1.75' }}>
                {t('b2bGuar3Desc')}
              </p>
            </div>
          </div>
        </div>

        {/* 🌟 4. THE 4-STEP PROCESS (أربع خطوات من الطلب إلى الاستلام) 🌟 */}
        <div style={{ marginBottom: '56px' }}>
          <div style={{ textAlign: 'center', marginBottom: '36px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.92rem',
                color: '#96663B',
                fontWeight: '800',
                letterSpacing: '0.5px',
                background: 'rgba(150, 102, 59, 0.12)',
                padding: '6px 18px',
                borderRadius: '9999px',
                border: '1px solid rgba(150, 102, 59, 0.28)',
                marginBottom: '10px'
              }}
            >
              {t('b2bProcessBadge')}
            </span>
            <h2
              style={{
                fontSize: 'clamp(1.9rem, 4vw, 2.6rem)',
                fontWeight: '900',
                color: '#2C1810',
                margin: '6px 0 0',
                letterSpacing: '-0.5px',
                lineHeight: '1.25'
              }}
            >
              {t('b2bProcessTitle')}
            </h2>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '16px'
            }}
          >
            {[
              { num: t('b2bStep1Num'), title: t('b2bStep1Title'), desc: t('b2bStep1Desc') },
              { num: t('b2bStep2Num'), title: t('b2bStep2Title'), desc: t('b2bStep2Desc') },
              { num: t('b2bStep3Num'), title: t('b2bStep3Title'), desc: t('b2bStep3Desc') },
              { num: t('b2bStep4Num'), title: t('b2bStep4Title'), desc: t('b2bStep4Desc') }
            ].map((step, idx) => (
              <div
                key={idx}
                style={{
                  background: 'linear-gradient(135deg, #24120a 0%, #351a0f 100%)',
                  border: '1.5px solid rgba(212, 163, 115, 0.35)',
                  borderRadius: '20px',
                  padding: '24px 20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)'
                }}
              >
                <div style={{ fontSize: '1.15rem', color: '#e6b87d', fontWeight: '900' }}>
                  {step.num}
                </div>
                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: '#ffffff' }}>
                  {step.title}
                </h4>
                <p style={{ margin: 0, fontSize: '0.86rem', color: '#c4b0a1', lineHeight: '1.7' }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 🌟 5. INTERACTIVE B2B QUOTE REQUEST FORM (نموذج طلب التسعير) 🌟 */}
        <div
          id="b2b-form-section"
          style={{
            background: 'linear-gradient(135deg, #2C1810 0%, #4A3220 100%)',
            borderRadius: '28px',
            padding: '40px 30px',
            border: '1.5px solid #EDD9BD',
            boxShadow: '0 20px 50px rgba(44, 24, 16, 0.35)',
            position: 'relative'
          }}
        >
          <div style={{ maxWidth: '780px', margin: '0 auto', textAlign: 'center', marginBottom: '32px' }}>
            <span style={{ fontSize: '0.84rem', color: '#C49A5C', fontWeight: '800', letterSpacing: '1px' }}>
              {t('b2bFormBadge')}
            </span>
            <h2 style={{ fontSize: 'clamp(1.7rem, 3.8vw, 2.3rem)', fontWeight: '900', color: '#ffffff', margin: '6px 0 10px' }}>
              {t('b2bFormTitle')}
            </h2>
            <p style={{ margin: 0, fontSize: '0.94rem', color: '#EDD9BD', lineHeight: '1.8' }}>
              {t('b2bFormSub')}
            </p>
          </div>

          {/* Submission Success Alert */}
          {submittedSuccess && (
            <div
              style={{
                maxWidth: '680px',
                margin: '0 auto 32px',
                background: 'rgba(91, 140, 90, 0.2)',
                border: '1.5px solid #5B8C5A',
                borderRadius: '16px',
                padding: '20px',
                textAlign: 'center',
                animation: 'fadeIn 0.3s ease'
              }}
            >
              <CheckCircle size={36} color="#86efac" style={{ margin: '0 auto 10px' }} />
              <h3 style={{ margin: '0 0 6px', color: '#86efac', fontSize: '1.2rem', fontWeight: '800' }}>
                {language === 'ar' ? 'تم استلام طلب التسعير بنجاح!' : 'Quote Request Received Successfully!'}
              </h3>
              <p style={{ margin: '0 0 14px', color: '#f5ebe1', fontSize: '0.9rem', lineHeight: '1.7' }}>
                {language === 'ar'
                  ? `شكراً لاهتمامك بمحاصيل كاتورا. كود طلبك المرجعي هو (${submittedRef}). سيتواصل معك مدير حسابات الجملة عبر واتساب خلال ساعات قليلة.`
                  : `Thank you for your interest in Caturra lots. Your reference code is (${submittedRef}). Our wholesale account manager will contact you shortly.`}
              </p>
              <button
                type="button"
                onClick={handleSendViaWhatsApp}
                style={{
                  background: '#25D366',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 20px',
                  fontWeight: '800',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <MessageCircle size={16} />
                <span>{language === 'ar' ? 'متابعة سريعة عبر واتساب الآن' : 'Fast Follow-up on WhatsApp'}</span>
              </button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleFormSubmit} style={{ maxWidth: '780px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {/* Company Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: '#EDD9BD', marginBottom: '6px' }}>
                  {t('b2bCompanyLabel')}
                </label>
                <div style={{ position: 'relative' }}>
                  <Building size={16} color="#C49A5C" style={{ position: 'absolute', right: isRtl ? '12px' : 'auto', left: isRtl ? 'auto' : '12px', top: '13px' }} />
                  <input
                    type="text"
                    name="companyName"
                    required
                    value={formData.companyName}
                    onChange={handleChange}
                    placeholder={language === 'ar' ? 'مثال: كافيه أروما، فندق جراند، إلخ...' : 'e.g., Aroma Café, Grand Hotel...'}
                    style={{
                      width: '100%',
                      padding: isRtl ? '11px 38px 11px 14px' : '11px 14px 11px 38px',
                      background: '#FFFDF9',
                      border: '1.5px solid #EDD9BD',
                      borderRadius: '12px',
                      color: '#4A3220',
                      fontSize: '0.9rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Contact Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: '#EDD9BD', marginBottom: '6px' }}>
                  {t('b2bContactLabel')}
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={16} color="#C49A5C" style={{ position: 'absolute', right: isRtl ? '12px' : 'auto', left: isRtl ? 'auto' : '12px', top: '13px' }} />
                  <input
                    type="text"
                    name="contactName"
                    required
                    value={formData.contactName}
                    onChange={handleChange}
                    placeholder={language === 'ar' ? 'اسم المدير أو مسؤول المشتريات' : 'Manager / Buyer Name'}
                    style={{
                      width: '100%',
                      padding: isRtl ? '11px 38px 11px 14px' : '11px 14px 11px 38px',
                      background: '#FFFDF9',
                      border: '1.5px solid #EDD9BD',
                      borderRadius: '12px',
                      color: '#4A3220',
                      fontSize: '0.9rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {/* Phone (WhatsApp) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: '#EDD9BD', marginBottom: '6px' }}>
                  {t('b2bPhoneLabel')}
                </label>
                <div style={{ position: 'relative' }}>
                  <Phone size={16} color="#C49A5C" style={{ position: 'absolute', right: isRtl ? '12px' : 'auto', left: isRtl ? 'auto' : '12px', top: '13px' }} />
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="010XXXXXXXX"
                    style={{
                      width: '100%',
                      padding: isRtl ? '11px 38px 11px 14px' : '11px 14px 11px 38px',
                      background: '#FFFDF9',
                      border: '1.5px solid #EDD9BD',
                      borderRadius: '12px',
                      color: '#4A3220',
                      fontSize: '0.9rem',
                      direction: 'ltr',
                      textAlign: isRtl ? 'right' : 'left',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: '#EDD9BD', marginBottom: '6px' }}>
                  {t('b2bEmailLabel')}
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={16} color="#C49A5C" style={{ position: 'absolute', right: isRtl ? '12px' : 'auto', left: isRtl ? 'auto' : '12px', top: '13px' }} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="cafe@example.com"
                    style={{
                      width: '100%',
                      padding: isRtl ? '11px 38px 11px 14px' : '11px 14px 11px 38px',
                      background: '#FFFDF9',
                      border: '1.5px solid #EDD9BD',
                      borderRadius: '12px',
                      color: '#4A3220',
                      fontSize: '0.9rem',
                      direction: 'ltr',
                      textAlign: isRtl ? 'right' : 'left',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              {/* City / Governorate */}
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: '#EDD9BD', marginBottom: '6px' }}>
                  {t('b2bCityLabel')}
                </label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={16} color="#C49A5C" style={{ position: 'absolute', right: isRtl ? '12px' : 'auto', left: isRtl ? 'auto' : '12px', top: '13px', pointerEvents: 'none' }} />
                  <input
                    type="text"
                    name="city"
                    required
                    list="b2b-cities-datalist"
                    placeholder={language === 'en' ? 'e.g. Cairo, Giza, Alexandria, Mansoura...' : 'اكتب اسم المحافظة أو المدينة هنا...'}
                    value={formData.city}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: isRtl ? '11px 38px 11px 14px' : '11px 14px 11px 38px',
                      background: '#FFFDF9',
                      border: '1.5px solid #EDD9BD',
                      borderRadius: '12px',
                      color: '#4A3220',
                      fontSize: '0.9rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <datalist id="b2b-cities-datalist">
                    {cityOptions.map(c => (
                      <option key={c.id} value={c[language]} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Business Type */}
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: '#EDD9BD', marginBottom: '6px' }}>
                  {t('b2bTypeLabel')}
                </label>
                <select
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    background: '#FFFDF9',
                    border: '1.5px solid #EDD9BD',
                    borderRadius: '12px',
                    color: '#4A3220',
                    fontSize: '0.9rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    cursor: 'pointer'
                  }}
                >
                  {businessTypes.map(b => (
                    <option key={b.id} value={b.id} style={{ background: '#FFFDF9', color: '#4A3220' }}>
                      {b[language]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Estimated Monthly Volume */}
            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: '#EDD9BD', marginBottom: '6px' }}>
                {t('b2bVolLabel')}
              </label>
              <select
                name="monthlyVolume"
                value={formData.monthlyVolume}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  background: '#FFFDF9',
                  border: '1.5px solid #EDD9BD',
                  borderRadius: '12px',
                  color: '#4A3220',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  cursor: 'pointer'
                }}
              >
                {volumeOptions.map(v => (
                  <option key={v.id} value={v.id} style={{ background: '#FFFDF9', color: '#4A3220' }}>
                    {v[language]}
                  </option>
                ))}
              </select>
            </div>

            {/* Additional Checkbox Options */}
            <div
              style={{
                background: 'rgba(255, 253, 249, 0.08)',
                padding: '16px',
                borderRadius: '14px',
                border: '1px solid rgba(237, 217, 189, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.88rem' }}>
                <input
                  type="checkbox"
                  name="privateLabel"
                  checked={formData.privateLabel}
                  onChange={handleChange}
                  style={{ width: '18px', height: '18px', accentColor: '#96663B', cursor: 'pointer' }}
                />
                <span style={{ color: '#FFFDF9' }}>🏷️ {t('b2bPlOpt')}</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.88rem' }}>
                <input
                  type="checkbox"
                  name="monthlyContract"
                  checked={formData.monthlyContract}
                  onChange={handleChange}
                  style={{ width: '18px', height: '18px', accentColor: '#96663B', cursor: 'pointer' }}
                />
                <span style={{ color: '#FFFDF9' }}>🔁 {t('b2bContractOpt')}</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.88rem' }}>
                <input
                  type="checkbox"
                  name="extractionSupport"
                  checked={formData.extractionSupport}
                  onChange={handleChange}
                  style={{ width: '18px', height: '18px', accentColor: '#96663B', cursor: 'pointer' }}
                />
                <span style={{ color: '#FFFDF9' }}>🎯 {t('b2bSupportOpt')}</span>
              </label>
            </div>

            {/* Notes */}
            <div>
              <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: '#EDD9BD', marginBottom: '6px' }}>
                {t('b2bNotesLabel')}
              </label>
              <textarea
                name="notes"
                rows="3"
                value={formData.notes}
                onChange={handleChange}
                placeholder={language === 'ar' ? 'حدد إن كان لديك محاصيل معينة مفضلة (إثيوبي، كولومبي، برازيلي) أو مواصفات خاصة...' : 'Mention any specific origin preferences or special notes...'}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  background: '#FFFDF9',
                  border: '1.5px solid #EDD9BD',
                  borderRadius: '12px',
                  color: '#4A3220',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'vertical'
                }}
              />
            </div>

            {/* Unified Submit Action */}
            <div style={{ marginTop: '12px' }}>
              <button
                type="submit"
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #5B8C5A 0%, #3d6a3c 45%, #96663B 100%)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '16px',
                  padding: '16px 24px',
                  fontSize: '1rem',
                  fontWeight: '900',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  boxShadow: '0 8px 25px rgba(91, 140, 90, 0.4), 0 2px 10px rgba(150, 102, 59, 0.3)',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 12px 30px rgba(91, 140, 90, 0.5), 0 4px 15px rgba(150, 102, 59, 0.4)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(91, 140, 90, 0.4), 0 2px 10px rgba(150, 102, 59, 0.3)';
                }}
              >
                <MessageCircle size={22} color="#ffffff" />
                <span>{t('b2bUnifiedSubmitBtn')}</span>
                <Send size={18} color="#ffffff" style={{ transform: isRtl ? 'rotate(180deg)' : 'none' }} />
              </button>
            </div>
          </form>
        </div>

        {/* 🌟 6. FOOTER CONTACT QUICK BAR 🌟 */}
        <div
          style={{
            marginTop: '40px',
            textAlign: 'center',
            padding: '24px',
            background: '#FFF8EE',
            borderRadius: '18px',
            border: '1px solid #EDD9BD',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around',
            flexWrap: 'wrap',
            gap: '16px',
            boxShadow: 'var(--h-shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Phone size={18} color="#96663B" />
            <span style={{ fontSize: '0.88rem', color: '#5C3D2E' }}>
              {language === 'ar' ? 'مبيعات الجملة المباشرة:' : 'Direct Wholesale Sales:'}{' '}
              <strong style={{ color: '#4A3220', direction: 'ltr', display: 'inline-block' }}>{activePhone}</strong>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Mail size={18} color="#96663B" />
            <span style={{ fontSize: '0.88rem', color: '#5C3D2E' }}>
              {language === 'ar' ? 'البريد الإلكتروني:' : 'Wholesale Email:'}{' '}
              <strong style={{ color: '#4A3220' }}>{activeEmail}</strong>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MapPin size={18} color="#96663B" />
            <span style={{ fontSize: '0.88rem', color: '#5C3D2E' }}>
              {language === 'ar' ? 'المقر والمحمصة:' : 'Roastery HQ:'}{' '}
              <strong style={{ color: '#4A3220' }}>{language === 'ar' ? 'القاهرة، مصر' : 'Cairo, Egypt'}</strong>
            </span>
          </div>
        </div>

      </div>
    </section>
  );
};
