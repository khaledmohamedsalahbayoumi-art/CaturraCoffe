import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { formatWhatsAppNumber } from '../utils/whatsapp';
import { initialBrewingGuides } from '../data/initialData';
import {
  Phone,
  MessageCircle,
  MapPin,
  Share2,
  Building,
  Save,
  RotateCcw,
  Eye,
  CheckCircle,
  Sparkles,
  ExternalLink,
  Shield,
  Coffee,
  Globe,
  Megaphone,
  Copy,
  Check,
  Store,
  Bot,
  Zap,
  Plus,
  Trash2,
  Thermometer,
  Timer,
  Scale,
  BarChart3
} from 'lucide-react';
import { testGeminiApiKey } from '../utils/geminiAi';
import { calculateStoreStats, formatStatNumber } from '../utils/storeStats';

export const StoreSettingsView = () => {
  const {
    contactInfo,
    updateContactInfo,
    resetContactInfo,
    setViewMode,
    confirmDialog,
    brewingGuides = {},
    updateBrewingGuide,
    resetBrewingGuides,
    products = [],
    invoices = [],
    academyArticles = []
  } = useApp();
  const [copiedKey, setCopiedKey] = useState('');

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://yourdomain.com';
  const storeUrl = `${currentOrigin}/`;
  const adminUrl = `${currentOrigin}/caturra`;

  const handleCopyUrl = (url, key) => {
    try {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(''), 2000);
      }
    } catch {
      // ignore
    }
  };

  // Local form state initialized from current contactInfo
  const [formData, setFormData] = useState({
    brandNameAr: contactInfo?.brandNameAr || 'كاتورا للقهوة المختصة',
    brandNameEn: contactInfo?.brandNameEn || 'CATURRA COFFEE & ROASTER',
    phone: contactInfo?.phone || '01012345678',
    whatsapp: contactInfo?.whatsapp || '01000000000',
    instapayPhone: contactInfo?.instapayPhone || contactInfo?.instapayAccount || '01033144498',
    vodafoneCash: contactInfo?.vodafoneCash || '01033144498',
    email: contactInfo?.email || 'contact@caturracoffee.com',
    address: contactInfo?.address || 'القاهرة، مصر الجديدة - شارع الثورة، بالقرب من محطة الأهرام',
    workingHours: contactInfo?.workingHours || 'يومياً من 8:00 صباحاً حتى 12:00 منتصف الليل',
    shippingInfo: contactInfo?.shippingInfo || 'شحن لجميع المحافظات خلال 24-48 ساعة 🚚',
    instagram: contactInfo?.instagram || 'https://instagram.com',
    facebook: contactInfo?.facebook || 'https://facebook.com',
    tiktok: contactInfo?.tiktok || 'https://tiktok.com',
    aboutUs: contactInfo?.aboutUs || '',
    storyTag: contactInfo?.storyTag || 'من نحن • شغف البن المختص',
    storySubtitle: contactInfo?.storySubtitle || 'محمصة كاتورا للقهوة المختصة',
    aboutStoryP1: contactInfo?.aboutStoryP1 || contactInfo?.aboutUs || 'في محمصة كاتورا للقهوة المختصة، بدأنا بشغف حقيقي لاستكشاف سحر البن وأسراره العميقة. نؤمن بأن كل حبة بن تحمل في طياتها حكاية فريدة تبدأ من سفوح الجبال وأعالي مزارع البن العالمية في إثيوبيا، كولومبيا، جواتيمالا، والبرازيل وصولاً إلى فنجانك اليومي.',
    aboutStoryP2: contactInfo?.aboutStoryP2 || 'ننتقي محاصيلنا بعناية فائقة ونحمصها محلياً بحرفية وفق بروفايلات تحميص دقيقة ومتوازنة لتكشف عن أرقى النوتات العطرية والنكهات الغنية، لنمنح عشاق القهوة في مصر تجربة حسية استثنائية تأسر الحواس في كل رشفة.',
    commercialRegister: contactInfo?.commercialRegister || '148920',
    taxNumber: contactInfo?.taxNumber || '582-934-211',
    bannerEnabled: contactInfo?.bannerEnabled !== undefined ? contactInfo.bannerEnabled : false,
    bannerText: contactInfo?.bannerText || 'شحن مجاني لكافة محافظات مصر للطلبات التي تزيد عن 500 جنيه | استخدم كود CATURRA10 لخصم 10%',
    bannerBadge: contactInfo?.bannerBadge || 'عرض حصري 🔥',
    bannerTheme: contactInfo?.bannerTheme || 'mint',
    bannerLinkText: contactInfo?.bannerLinkText || 'تسوق الآن ⚡',
    promoCode: contactInfo?.promoCode || 'CATURRA10',
    promoDiscountPercent: contactInfo?.promoDiscountPercent || 10,
    geminiApiKey: contactInfo?.geminiApiKey || '',
    // Live Storefront Statistics Settings
    statsAutoCalc: contactInfo?.statsAutoCalc !== undefined ? contactInfo.statsAutoCalc : true,
    statsBaseCups: contactInfo?.statsBaseCups !== undefined ? contactInfo.statsBaseCups : 20000,
    foundingYear: contactInfo?.foundingYear || 2021,
    statsCerts: contactInfo?.statsCerts !== undefined ? contactInfo.statsCerts : 3,
    statsBranches: contactInfo?.statsBranches !== undefined ? contactInfo.statsBranches : 2,
    statsAcademy: contactInfo?.statsAcademy !== undefined ? contactInfo.statsAcademy : 1,
    customStatLots: contactInfo?.customStatLots || '',
    customStatYears: contactInfo?.customStatYears || '',
    customStatCerts: contactInfo?.customStatCerts || '',
    customStatBranches: contactInfo?.customStatBranches || '',
    customStatAcademy: contactInfo?.customStatAcademy || '',
    customStatArabica: contactInfo?.customStatArabica || '100%',
    customStatCups: contactInfo?.customStatCups || ''
  });

  // Calculate live preview statistics based on form data and actual catalog/invoice records
  const previewStats = calculateStoreStats({
    products,
    invoices,
    contactInfo: formData,
    academyArticles
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'contact' | 'social' | 'brand'
  const [isTestingGemini, setIsTestingGemini] = useState(false);
  const [geminiTestStatus, setGeminiTestStatus] = useState(null);
  const [showGeminiKey, setShowGeminiKey] = useState(false);

  useEffect(() => {
    if (contactInfo && Object.keys(contactInfo).length > 0) {
      setFormData(prev => ({
        ...prev,
        ...contactInfo
      }));
    }
  }, [contactInfo]);

  // ☕ Brewing Guides Management State
  const [selectedBrewingMethod, setSelectedBrewingMethod] = useState('v60'); // 'v60' | 'espresso' | 'french_press' | 'whole_beans'
  const [brewingGuideSuccess, setBrewingGuideSuccess] = useState(false);
  const [activeGuideEdit, setActiveGuideEdit] = useState(() => (brewingGuides?.v60 || initialBrewingGuides?.v60 || {}));
  const [showBrewingPreview, setShowBrewingPreview] = useState(false);

  useEffect(() => {
    const current = (brewingGuides && brewingGuides[selectedBrewingMethod]) || initialBrewingGuides?.[selectedBrewingMethod] || {};
    setActiveGuideEdit(JSON.parse(JSON.stringify(current)));
  }, [selectedBrewingMethod, brewingGuides]);

  const handleBrewingFieldChange = (field, value) => {
    setActiveGuideEdit(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleStepChange = (index, field, value) => {
    setActiveGuideEdit(prev => {
      const steps = [...(prev?.steps || [])];
      steps[index] = { ...steps[index], [field]: value };
      return { ...prev, steps };
    });
  };

  const handleAddStep = () => {
    setActiveGuideEdit(prev => {
      const steps = [...(prev?.steps || [])];
      steps.push({
        step: steps.length + 1,
        title: `الخطوة ${steps.length + 1}`,
        desc: ''
      });
      return { ...prev, steps };
    });
  };

  const handleRemoveStep = (index) => {
    setActiveGuideEdit(prev => {
      const steps = prev?.steps?.filter((_, i) => i !== index).map((s, idx) => ({ ...s, step: idx + 1 })) || [];
      return { ...prev, steps };
    });
  };

  const handleSaveBrewingGuide = (e) => {
    e?.preventDefault();
    if (!activeGuideEdit) return;
    updateBrewingGuide(selectedBrewingMethod, activeGuideEdit);
    setBrewingGuideSuccess(true);
    setTimeout(() => setBrewingGuideSuccess(false), 3500);
  };

  const handleResetAllBrewingGuides = async () => {
    const ok = await confirmDialog({
      title: 'استعادة وصفات التحضير الافتراضية',
      message: 'هل تريد بالتأكيد استعادة جميع وصفات التحضير إلى القيم الاحترافية الافتراضية المعتمدة لكاتورا؟',
      details: 'سيتم استرجاع نسب الاستخلاص ودرجات الحرارة والخطوات ونصائح الباريستا لجميع درجات الطحن (V60، إسبريسو، فرنش برس، وحبوب كاملة).',
      confirmText: 'نعم، استعادة الافتراضي',
      cancelText: 'إلغاء',
      type: 'warning'
    });
    if (!ok) return;
    resetBrewingGuides();
    const restored = initialBrewingGuides?.[selectedBrewingMethod] || {};
    setActiveGuideEdit(JSON.parse(JSON.stringify(restored)));
    setBrewingGuideSuccess(true);
    setTimeout(() => setBrewingGuideSuccess(false), 3500);
  };

  const handleTestGemini = async () => {
    if (!formData.geminiApiKey?.trim()) {
      setGeminiTestStatus({ success: false, error: 'يرجى كتابة أو لصق مفتاح API أولاً' });
      return;
    }
    setIsTestingGemini(true);
    setGeminiTestStatus(null);
    const result = await testGeminiApiKey(formData.geminiApiKey);
    setIsTestingGemini(false);
    setGeminiTestStatus(result);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = (e) => {
    e?.preventDefault();
    const cleanTransferPhone = formData.instapayPhone?.trim() || '01033144498';
    updateContactInfo({
      ...formData,
      instapayPhone: cleanTransferPhone,
      instapayAccount: cleanTransferPhone,
      vodafoneCash: cleanTransferPhone
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 4000);
  };

  const handleReset = async () => {
    const ok = await confirmDialog({
      title: 'استعادة الإعدادات الافتراضية',
      message: 'هل تريد بالتأكيد استعادة بيانات التواصل الافتراضية للعلامة التجارية؟',
      details: 'سيتم استرجاع أرقام الهاتف والإيميل والعناوين الافتراضية لمحمصة كاتورا.',
      confirmText: 'نعم، استعادة الافتراضي',
      cancelText: 'إلغاء',
      type: 'warning'
    });
    if (!ok) return;

    resetContactInfo();
      // Also update local form state to default
      setFormData({
        brandNameAr: 'كاتورا للقهوة المختصة',
        brandNameEn: 'CATURRA COFFEE & ROASTER',
        phone: '01012345678',
        whatsapp: '01000000000',
        instapayPhone: '01033144498',
        vodafoneCash: '01033144498',
        email: 'contact@caturracoffee.com',
        address: 'القاهرة، مصر الجديدة - شارع الثورة، بالقرب من محطة الأهرام',
        workingHours: 'يومياً من 8:00 صباحاً حتى 12:00 منتصف الليل',
        shippingInfo: 'شحن لجميع المحافظات خلال 24-48 ساعة 🚚',
        instagram: 'https://instagram.com',
        facebook: 'https://facebook.com',
        tiktok: 'https://tiktok.com',
        aboutUs: 'كاتورا (Caturra) محمصة ومتجر قهوة مختصة مصري 100%. نؤمن بأن كل حبة بن تروي قصة فريدة. ننتقي بعناية أفضل المحاصيل الخضراء من مزارع إثيوبيا، كولومبيا، والبرازيل، ونحمصها بدرجات متوازنة لإبراز النكهات العطرية والإيحاءات الفاكهية والزهرية الفاخرة بدون أي إضافات صناعية.',
        storyTag: 'من نحن • شغف البن المختص',
        storySubtitle: 'محمصة كاتورا للقهوة المختصة',
        aboutStoryP1: 'في محمصة كاتورا للقهوة المختصة، بدأنا بشغف حقيقي لاستكشاف سحر البن وأسراره العميقة. نؤمن بأن كل حبة بن تحمل في طياتها حكاية فريدة تبدأ من سفوح الجبال وأعالي مزارع البن العالمية في إثيوبيا، كولومبيا، جواتيمالا، والبرازيل وصولاً إلى فنجانك اليومي.',
        aboutStoryP2: 'ننتقي محاصيلنا بعناية فائقة ونحمصها محلياً بحرفية وفق بروفايلات تحميص دقيقة ومتوازنة لتكشف عن أرقى النوتات العطرية والنكهات الغنية، لنمنح عشاق القهوة في مصر تجربة حسية استثنائية تأسر الحواس في كل رشفة.',
        commercialRegister: '148920',
        taxNumber: '582-934-211',
        bannerEnabled: true,
        bannerText: 'شحن مجاني لكافة محافظات مصر للطلبات التي تزيد عن 500 جنيه | استخدم كود CATURRA10 لخصم 10%',
        bannerBadge: 'عرض حصري 🔥',
        bannerTheme: 'mint',
        bannerLinkText: 'تسوق الآن ⚡',
        promoCode: 'CATURRA10',
        promoDiscountPercent: 10,
        statsAutoCalc: true,
        statsBaseCups: 20000,
        foundingYear: 2021,
        statsCerts: 3,
        statsBranches: 2,
        statsAcademy: 1,
        customStatLots: '',
        customStatYears: '',
        customStatCerts: '',
        customStatBranches: '',
        customStatAcademy: '',
        customStatArabica: '100%',
        customStatCups: ''
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
  };

  const formattedWhatsApp = formatWhatsAppNumber(formData.whatsapp);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', paddingBottom: '60px' }}>
      
      {/* Top Header Bar */}
      <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--mint-700), var(--mint-900))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 12px rgba(11, 128, 79, 0.25)'
            }}>
              <Globe size={22} />
            </div>
            <div>
              <h1 className="view-title" style={{ margin: 0, fontSize: '1.5rem', fontWeight: '900', color: 'var(--mint-950)' }}>
                بيانات التواصل وإعدادات المتجر
              </h1>
              <p className="view-subtitle" style={{ margin: '4px 0 0', fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                تحكم كامل في أرقام الهواتف، محادثات الواتساب، العناوين، وروابط السوشيال ميديا المعروضة لعملائك
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <a
            href="/"
            onClick={(e) => {
              if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
                e.preventDefault();
                setViewMode('client');
              }
            }}
            className="btn btn-outline"
            style={{
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              borderColor: 'var(--mint-300)',
              color: 'var(--mint-800)',
              background: '#ffffff',
              fontWeight: '700'
            }}
            title="الانتقال لعرض المتجر كعميل لمعاينة البيانات المحدثة"
          >
            <Eye size={17} />
            <span>معاينة المتجر كعميل</span>
          </a>

          <button
            type="button"
            onClick={handleReset}
            className="btn btn-outline"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              borderColor: '#e2e8f0',
              color: '#64748b'
            }}
            title="استرجاع البيانات الافتراضية"
          >
            <RotateCcw size={16} />
            <span>استعادة الافتراضي</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="btn btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 24px',
              fontWeight: '800',
              boxShadow: '0 4px 14px rgba(11, 128, 79, 0.35)'
            }}
          >
            <Save size={18} />
            <span>حفظ كافة التعديلات 💾</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {savedSuccess && (
        <div
          style={{
            background: 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
            border: '1.5px solid #6ee7b7',
            borderRadius: '14px',
            padding: '14px 20px',
            marginBottom: '22px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#065f46',
            boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)',
            animation: 'fadeIn 0.3s ease-in-out'
          }}
        >
          <CheckCircle size={22} color="#059669" />
          <div style={{ flex: 1 }}>
            <strong style={{ fontSize: '0.98rem' }}>تم حفظ التعديلات بنجاح!</strong>
            <p style={{ margin: '2px 0 0', fontSize: '0.84rem', color: '#047857' }}>
              تم تطبيق كافة بيانات التواصل المحدثة وتظهر الآن فوراً في واجهة المتجر، أسفل الفوتر، وفي إيصالات الفواتير.
            </p>
          </div>
          <a
            href="/"
            onClick={(e) => {
              if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
                e.preventDefault();
                setViewMode('client');
              }
            }}
            style={{
              textDecoration: 'none',
              background: '#059669',
              color: '#ffffff',
              border: 'none',
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            مشاهدة في المتجر
          </a>
        </div>
      )}

      {/* 🌐 Domain & Links Card (روابط المنظومة على الدومين) 🌐 */}
      <div
        style={{
          background: 'linear-gradient(135deg, #022c22 0%, #064e3b 100%)',
          borderRadius: '16px',
          padding: '20px',
          color: '#ffffff',
          boxShadow: '0 8px 24px rgba(2, 44, 34, 0.25)',
          border: '1px solid rgba(52, 211, 153, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          marginBottom: '4px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: 'rgba(52, 211, 153, 0.2)',
              borderRadius: '10px',
              padding: '8px',
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Globe size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: '#ffffff' }}>
                روابط المتجر ولوحة التحكم على الدومين
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#a7f3d0' }}>
                المتجر ولوحة الإدارة مربوطان معاً على نفس قاعدة البيانات المشتركة بشكل فوري وتلقائي
              </p>
            </div>
          </div>
          <span style={{
            background: 'rgba(52, 211, 153, 0.15)',
            border: '1px solid rgba(52, 211, 153, 0.4)',
            color: '#34d399',
            padding: '4px 10px',
            borderRadius: '20px',
            fontSize: '0.74rem',
            fontWeight: '800'
          }}>
            ⚡ تزامن لحظي Realtime
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
          
          {/* Storefront Link */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '12px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#93c5fd', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Store size={15} />
                <span>رابط متجر العملاء (Storefront)</span>
              </span>
              <span style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>للجمهور والمشترين</span>
            </div>
            <div style={{
              background: 'rgba(0, 0, 0, 0.25)',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '0.86rem',
              fontWeight: '700',
              fontFamily: 'monospace',
              direction: 'ltr',
              color: '#38bdf8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              overflow: 'hidden'
            }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{storeUrl}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => handleCopyUrl(storeUrl, 'store')}
                  style={{
                    background: copiedKey === 'store' ? '#059669' : 'rgba(255, 255, 255, 0.15)',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#ffffff',
                    padding: '4px 8px',
                    fontSize: '0.74rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="نسخ رابط المتجر"
                >
                  {copiedKey === 'store' ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedKey === 'store' ? 'تم النسخ!' : 'نسخ'}</span>
                </button>
                <a
                  href="/"
                  onClick={(e) => {
                    if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
                      e.preventDefault();
                      setViewMode('client');
                    }
                  }}
                  style={{
                    color: '#a7f3d0',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px',
                    cursor: 'pointer'
                  }}
                  title="زيارة المتجر"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </div>

          {/* Admin Dashboard Link */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '12px',
            padding: '12px 14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#fde047', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Shield size={15} />
                <span>رابط لوحة التحكم والإدارة (ERP & POS)</span>
              </span>
              <span style={{ fontSize: '0.7rem', color: '#cbd5e1' }}>للإدارة والموظفين</span>
            </div>
            <div style={{
              background: 'rgba(0, 0, 0, 0.25)',
              padding: '8px 12px',
              borderRadius: '8px',
              fontSize: '0.86rem',
              fontWeight: '700',
              fontFamily: 'monospace',
              direction: 'ltr',
              color: '#facc15',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              overflow: 'hidden'
            }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{adminUrl}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => handleCopyUrl(adminUrl, 'admin')}
                  style={{
                    background: copiedKey === 'admin' ? '#059669' : 'rgba(255, 255, 255, 0.15)',
                    border: 'none',
                    borderRadius: '6px',
                    color: '#ffffff',
                    padding: '4px 8px',
                    fontSize: '0.74rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                  title="نسخ رابط لوحة الإدارة"
                >
                  {copiedKey === 'admin' ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedKey === 'admin' ? 'تم النسخ!' : 'نسخ'}</span>
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
          
          {/* CARD 0: شريط الإعلانات الترويجية أعلى المتجر (Full Width) */}
          <div className="card" style={{ gridColumn: '1 / -1', background: '#ffffff', borderRadius: '18px', border: '1.5px solid var(--mint-300)', overflow: 'hidden', boxShadow: '0 4px 20px rgba(4, 136, 75, 0.08)' }}>
            <div style={{
              padding: '16px 22px',
              borderBottom: '1px solid var(--border-light)',
              background: 'linear-gradient(135deg, var(--mint-50) 0%, #f0fdf4 100%)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '11px',
                  background: 'linear-gradient(135deg, var(--mint-600), var(--mint-800))',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 3px 10px rgba(4, 136, 75, 0.25)'
                }}>
                  <Megaphone size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '900', color: 'var(--mint-950)' }}>
                    📢 شريط الإعلانات الترويجية العاجلة أعلى المتجر (Top Announcement Banner)
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    شريط متحرك أعلى كافة صفحات المتجر لإبراز كود الخصم، عروض الشحن المجاني، أو التنبيهات الخاصة
                  </span>
                </div>
              </div>

              {/* Banner Active Toggle */}
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none', background: '#ffffff', padding: '6px 14px', borderRadius: '10px', border: '1.5px solid ' + (formData.bannerEnabled ? 'var(--mint-500)' : '#e2e8f0'), boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
                <span style={{ fontWeight: '800', fontSize: '0.86rem', color: formData.bannerEnabled ? 'var(--mint-800)' : 'var(--text-muted)' }}>
                  {formData.bannerEnabled ? '✅ الشريط مفعل ويعمل' : '⏸️ الشريط معطل مؤقتاً'}
                </span>
                <input
                  type="checkbox"
                  name="bannerEnabled"
                  checked={!!formData.bannerEnabled}
                  onChange={handleChange}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--mint-600)' }}
                />
              </label>
            </div>

            <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              
              {/* Row 1: Banner Main Message */}
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '6px' }}>
                  💬 نص الإعلان أو العرض الترويجي:
                </label>
                <input
                  type="text"
                  name="bannerText"
                  value={formData.bannerText}
                  onChange={handleChange}
                  placeholder="مثال: شحن مجاني لكافة محافظات مصر للطلبات التي تزيد عن 500 جنيه | استخدم كود CATURRA10"
                  className="form-input"
                  style={{ fontSize: '0.94rem', fontWeight: '700' }}
                />
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  يمكنك وضع عروض الخصومات، رسائل الشحن المجاني، مواعيد الإجازات، أو التنبيهات العاجلة للزبائن.
                </div>
              </div>

              {/* Row 2: Badge + Button Text */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
                    🏷️ نص الشارة البارزة (Badge):
                  </label>
                  <input
                    type="text"
                    name="bannerBadge"
                    value={formData.bannerBadge}
                    onChange={handleChange}
                    placeholder="مثال: عرض حصري 🔥 أو خصم خاص ✨"
                    className="form-input"
                    style={{ fontSize: '0.9rem', fontWeight: '700' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
                    🔘 نص زر التوجيه / الشراء:
                  </label>
                  <input
                    type="text"
                    name="bannerLinkText"
                    value={formData.bannerLinkText}
                    onChange={handleChange}
                    placeholder="مثال: تسوق الآن ⚡ أو احصل على العرض"
                    className="form-input"
                    style={{ fontSize: '0.9rem', fontWeight: '700' }}
                  />
                </div>
              </div>

              {/* Row 2.5: Promo Code & Discount Percent */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', background: 'rgba(212, 163, 115, 0.08)', padding: '14px 16px', borderRadius: '12px', border: '1px dashed rgba(212, 163, 115, 0.3)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '6px' }}>
                    🏷️ كود الخصم الترويجي للعملاء (Promo Code):
                  </label>
                  <input
                    type="text"
                    name="promoCode"
                    value={formData.promoCode}
                    onChange={e => setFormData(prev => ({ ...prev, promoCode: e.target.value.toUpperCase() }))}
                    placeholder="مثال: CATURRA10"
                    className="form-input"
                    style={{ fontSize: '0.92rem', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}
                  />
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    هذا الكود هو الذي يكتبه العميل في شاشة إتمام الطلب (Checkout) ليحصل على الخصم.
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '6px' }}>
                    🔢 نسبة الخصم المئوية (%):
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="number"
                      name="promoDiscountPercent"
                      min="1"
                      max="100"
                      value={formData.promoDiscountPercent}
                      onChange={handleChange}
                      placeholder="10"
                      className="form-input"
                      style={{ fontSize: '0.92rem', fontWeight: '800', width: '100px' }}
                    />
                    <span style={{ fontWeight: '800', color: 'var(--mint-700)' }}>% خصم من إجمالي الفاتورة</span>
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    يتم خصم هذه النسبة تلقائياً وتحديث المبلغ المطلوب تحويله في إنستاباي ومحافظ الكاش.
                  </div>
                </div>
              </div>

              {/* Row 3: Color Theme Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px' }}>
                  🎨 نمط الألوان المفضل (Banner Theme):
                </label>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {[
                    { id: 'mint', label: '🌿 زمردي ملكي (Emerald)', bg: 'linear-gradient(90deg, #064e3b 0%, #047857 50%, #065f46 100%)', text: '#ffffff' },
                    { id: 'gold', label: '🍯 كراميل ذهبي (Gold)', bg: 'linear-gradient(90deg, #78350f 0%, #b45309 50%, #92400e 100%)', text: '#fef3c7' },
                    { id: 'dark', label: '🌑 أسود أوبسيديان (Luxury Dark)', bg: 'linear-gradient(90deg, #090d16 0%, #1e293b 50%, #0f172a 100%)', text: '#f8fafc' },
                    { id: 'crimson', label: '🔥 أحمر ياقوتي (Flash Sale)', bg: 'linear-gradient(90deg, #881337 0%, #be123c 50%, #9f1239 100%)', text: '#ffe4e6' }
                  ].map(theme => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, bannerTheme: theme.id }))}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '10px',
                        background: theme.bg,
                        color: theme.text,
                        border: formData.bannerTheme === theme.id ? '2.5px solid #ffffff' : '1px solid transparent',
                        outline: formData.bannerTheme === theme.id ? '2.5px solid var(--mint-600)' : 'none',
                        cursor: 'pointer',
                        fontWeight: '700',
                        fontSize: '0.82rem',
                        boxShadow: formData.bannerTheme === theme.id ? '0 4px 12px rgba(0,0,0,0.2)' : 'none',
                        transition: 'all 180ms ease'
                      }}
                    >
                      {theme.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 4: Live Banner Preview Box */}
              <div style={{ marginTop: '4px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: '700', display: 'block', marginBottom: '6px' }}>
                  معاينة حية لشكل الشريط كما سيظهر للعميل في أعلى صفحة المتجر:
                </span>
                <div style={{
                  borderRadius: '12px',
                  padding: '10px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '10px',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
                  opacity: formData.bannerEnabled ? 1 : 0.45,
                  background:
                    formData.bannerTheme === 'gold' ? 'linear-gradient(90deg, #78350f 0%, #b45309 50%, #92400e 100%)' :
                    formData.bannerTheme === 'dark' ? 'linear-gradient(90deg, #090d16 0%, #1e293b 50%, #0f172a 100%)' :
                    formData.bannerTheme === 'crimson' ? 'linear-gradient(90deg, #881337 0%, #be123c 50%, #9f1239 100%)' :
                    'linear-gradient(90deg, #064e3b 0%, #047857 50%, #065f46 100%)',
                  color: '#ffffff',
                  transition: 'all 200ms ease'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '240px' }}>
                    {formData.bannerBadge && (
                      <span style={{
                        background: 'rgba(255,255,255,0.22)',
                        backdropFilter: 'blur(4px)',
                        padding: '2px 10px',
                        borderRadius: '20px',
                        fontSize: '0.74rem',
                        fontWeight: '800',
                        letterSpacing: '0.3px',
                        whiteSpace: 'nowrap'
                      }}>
                        {formData.bannerBadge}
                      </span>
                    )}
                    <span style={{ fontSize: '0.84rem', fontWeight: '600' }}>
                      {formData.bannerText || 'نص الإعلان الترويجي...'}
                    </span>
                  </div>
                  {formData.bannerLinkText && (
                    <span style={{
                      background: '#ffffff',
                      color:
                        formData.bannerTheme === 'gold' ? '#78350f' :
                        formData.bannerTheme === 'dark' ? '#0f172a' :
                        formData.bannerTheme === 'crimson' ? '#881337' :
                        '#064e3b',
                      padding: '4px 12px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: '800',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                    }}>
                      {formData.bannerLinkText}
                    </span>
                  )}
                </div>
                {!formData.bannerEnabled && (
                  <span style={{ fontSize: '0.75rem', color: '#ef4444', fontWeight: '700', marginTop: '4px', display: 'block' }}>
                    ⚠️ تنبيه: الشريط حالياً معطل ولن يظهر للعملاء حتى تفعله وتقوم بالضغط على حفظ.
                  </span>
                )}
              </div>

            </div>
          </div>

          {/* ☕ CARD: إدارة أدلة ووصفات التحضير الموصى بها (Brewing Guides & Grind Recipes) ☕ */}
          <div className="card" style={{
            gridColumn: '1 / -1',
            background: '#FFFDF9',
            borderRadius: '18px',
            border: '1.5px solid #EDD9BD',
            overflow: 'hidden',
            boxShadow: '0 6px 24px rgba(74, 50, 32, 0.08)'
          }}>
            <div style={{
              padding: '18px 24px',
              borderBottom: '1px solid #EDD9BD',
              background: 'linear-gradient(135deg, #2C1810 0%, #4A3220 100%)',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '14px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #96663B 0%, #7A5230 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  boxShadow: '0 4px 12px rgba(150, 102, 59, 0.35)'
                }}>
                  <Coffee size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.12rem', fontWeight: '900', color: '#FFF8EE' }}>
                    ☕ إدارة وتخصيص أدلة ووصفات التحضير (Brewing Recipes & Grind Guides)
                  </h3>
                  <span style={{ fontSize: '0.82rem', color: '#EDD9BD' }}>
                    تخصيص وصفات الباريستا التلقائية التي تظهر للعميل فور اختياره لدرجة الطحن في صفحة المنتج (النسب، الحرارة، الوقت، الخطوات، ونصائح الباريستا)
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={handleResetAllBrewingGuides}
                  className="btn btn-outline"
                  style={{
                    background: 'rgba(255, 255, 255, 0.08)',
                    borderColor: 'rgba(237, 217, 189, 0.4)',
                    color: '#EDD9BD',
                    fontSize: '0.82rem',
                    fontWeight: '700',
                    padding: '6px 14px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  title="استعادة كافة وصفات التحضير إلى القيم الاحترافية الافتراضية"
                >
                  <RotateCcw size={14} />
                  <span>استعادة الوصفات الافتراضية</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowBrewingPreview(prev => !prev)}
                  style={{
                    background: showBrewingPreview ? '#96663B' : 'rgba(255, 255, 255, 0.12)',
                    border: '1px solid #EDD9BD',
                    color: '#ffffff',
                    borderRadius: '8px',
                    padding: '6px 14px',
                    fontSize: '0.82rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Eye size={14} />
                  <span>{showBrewingPreview ? 'إخفاء المعاينة الحية' : 'معاينة نافذة العميل'}</span>
                </button>
              </div>
            </div>

            {brewingGuideSuccess && (
              <div style={{
                background: '#ecfdf5',
                borderBottom: '1px solid #a7f3d0',
                padding: '10px 24px',
                color: '#065f46',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '0.86rem',
                fontWeight: '700'
              }}>
                <CheckCircle size={18} color="#059669" />
                <span>تم حفظ وتحديث وصفة التحضير بنجاح! تنعكس التعديلات فوراً على المتجر عند اختيار درجة الطحن.</span>
              </div>
            )}

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '22px' }}>
              
              {/* Method Selector Tabs */}
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '800', color: '#4A3220', marginBottom: '8px' }}>
                  🎯 اختر طريقة التحضير / درجة الطحن المراد تعديل وصفتها:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                  {[
                    { id: 'v60', icon: '☕', name: 'تقطير V60 / فلتر ترشيح', grind: 'V60 / فلتر' },
                    { id: 'espresso', icon: '⚡', name: 'استخلاص الإسبريسو المركز', grind: 'إسبريسو' },
                    { id: 'french_press', icon: '🧊', name: 'فرنش برس وكولد برو (نقع)', grind: 'فرنش برس' },
                    { id: 'whole_beans', icon: '🌾', name: 'حبوب كاملة (الحفظ والراحة)', grind: 'حبوب كاملة' }
                  ].map(m => {
                    const isSelected = selectedBrewingMethod === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setSelectedBrewingMethod(m.id)}
                        style={{
                          padding: '12px 14px',
                          borderRadius: '12px',
                          border: isSelected ? '2px solid #96663B' : '1px solid #EDD9BD',
                          background: isSelected ? 'linear-gradient(135deg, #2C1810 0%, #4A3220 100%)' : '#FFFDF9',
                          color: isSelected ? '#FFF8EE' : '#5C3D2E',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          textAlign: 'right',
                          transition: 'all 0.2s ease',
                          boxShadow: isSelected ? '0 4px 14px rgba(150, 102, 59, 0.2)' : 'none'
                        }}
                      >
                        <span style={{ fontSize: '1.4rem' }}>{m.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <strong style={{ display: 'block', fontSize: '0.88rem', color: isSelected ? '#C49A5C' : '#4A3220' }}>
                            {m.name}
                          </strong>
                          <span style={{ fontSize: '0.74rem', color: isSelected ? '#EDD9BD' : '#8A654C' }}>
                            مرتبطة بخيار: {m.grind}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Active Method Form Body */}
              {activeGuideEdit && (
                <div style={{
                  background: '#FFF8EE',
                  borderRadius: '14px',
                  border: '1.5px solid #EDD9BD',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '18px'
                }}>
                  {/* Row 1: Method Names */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '800', color: '#4A3220', marginBottom: '6px' }}>
                        🏷️ عنوان طريقة التحضير (بالعربية):
                      </label>
                      <input
                        type="text"
                        value={activeGuideEdit.methodName || ''}
                        onChange={e => handleBrewingFieldChange('methodName', e.target.value)}
                        placeholder="مثال: تقطير V60 / فلتر ترشيح"
                        className="form-input"
                        style={{ fontWeight: '700' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '800', color: '#4A3220', marginBottom: '6px' }}>
                        🌐 Method Title (English):
                      </label>
                      <input
                        type="text"
                        value={activeGuideEdit.methodNameEn || ''}
                        onChange={e => handleBrewingFieldChange('methodNameEn', e.target.value)}
                        placeholder="e.g. V60 Pour-over / Filter Drip"
                        className="form-input"
                        style={{ fontWeight: '700', direction: 'ltr' }}
                      />
                    </div>
                  </div>

                  {/* Row 2: Four Key Parameters Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                    <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: '10px', border: '1px solid #ebd9c8' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: '800', color: '#8c4718', marginBottom: '6px' }}>
                        <Scale size={14} />
                        <span>نسبة الاستخلاص (Ratio):</span>
                      </label>
                      <input
                        type="text"
                        value={activeGuideEdit.ratio || ''}
                        onChange={e => handleBrewingFieldChange('ratio', e.target.value)}
                        placeholder="مثال: 1:15"
                        className="form-input"
                        style={{ fontWeight: '800', fontSize: '0.92rem', textAlign: 'center' }}
                      />
                    </div>

                    <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: '10px', border: '1px solid #ebd9c8' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: '800', color: '#8c4718', marginBottom: '6px' }}>
                        <Thermometer size={14} />
                        <span>حرارة الماء (Temp):</span>
                      </label>
                      <input
                        type="text"
                        value={activeGuideEdit.waterTemp || ''}
                        onChange={e => handleBrewingFieldChange('waterTemp', e.target.value)}
                        placeholder="مثال: 91°C - 93°C"
                        className="form-input"
                        style={{ fontWeight: '800', fontSize: '0.92rem', textAlign: 'center' }}
                      />
                    </div>

                    <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: '10px', border: '1px solid #ebd9c8' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: '800', color: '#8c4718', marginBottom: '6px' }}>
                        <Timer size={14} />
                        <span>وقت التحضير (Time):</span>
                      </label>
                      <input
                        type="text"
                        value={activeGuideEdit.brewTime || ''}
                        onChange={e => handleBrewingFieldChange('brewTime', e.target.value)}
                        placeholder="مثال: 2:30 - 2:45 دقيقة"
                        className="form-input"
                        style={{ fontWeight: '800', fontSize: '0.92rem', textAlign: 'center' }}
                      />
                    </div>

                    <div style={{ background: '#ffffff', padding: '12px 14px', borderRadius: '10px', border: '1px solid #ebd9c8' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: '800', color: '#8c4718', marginBottom: '6px' }}>
                        <Coffee size={14} />
                        <span>الجرعة الموصى بها:</span>
                      </label>
                      <input
                        type="text"
                        value={activeGuideEdit.coffeeDose || ''}
                        onChange={e => handleBrewingFieldChange('coffeeDose', e.target.value)}
                        placeholder="مثال: 20 جم بن"
                        className="form-input"
                        style={{ fontWeight: '800', fontSize: '0.92rem', textAlign: 'center' }}
                      />
                    </div>
                  </div>

                  {/* Row 3: Water Total & Grind Size Description */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '800', color: '#4A3220', marginBottom: '6px' }}>
                        💧 كمية الماء الإجمالية:
                      </label>
                      <input
                        type="text"
                        value={activeGuideEdit.waterTotal || ''}
                        onChange={e => handleBrewingFieldChange('waterTotal', e.target.value)}
                        placeholder="مثال: 300 مل ماء"
                        className="form-input"
                        style={{ fontWeight: '700' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '800', color: '#4A3220', marginBottom: '6px' }}>
                        ⚙️ وصف ملمس ودرجة الطحن:
                      </label>
                      <input
                        type="text"
                        value={activeGuideEdit.grindSizeLabel || ''}
                        onChange={e => handleBrewingFieldChange('grindSizeLabel', e.target.value)}
                        placeholder="مثال: متوسطة النعومة (مثل حبات ملح البحر الخشن)"
                        className="form-input"
                        style={{ fontWeight: '700' }}
                      />
                    </div>
                  </div>

                  {/* Row 4: Barista Tip */}
                  <div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.86rem', fontWeight: '800', color: '#96663B', marginBottom: '6px' }}>
                      <span>💡 نصيحة الباريستا الذهبية (Barista Pro Tip):</span>
                    </label>
                    <textarea
                      rows={2}
                      value={activeGuideEdit.baristaTip || ''}
                      onChange={e => handleBrewingFieldChange('baristaTip', e.target.value)}
                      placeholder="اكتب نصيحة الباريستا الاحترافية لإبراز أفضل نكهات هذا الاستخلاص..."
                      className="form-input"
                      style={{
                        fontWeight: '600',
                        fontSize: '0.88rem',
                        lineHeight: '1.6',
                        background: '#FFF8EE',
                        border: '1.5px solid #EDD9BD',
                        color: '#4A3220'
                      }}
                    />
                  </div>

                  {/* Row 5: Sequential Steps Editor */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                      <label style={{ fontSize: '0.86rem', fontWeight: '800', color: '#4A3220', margin: 0 }}>
                        📋 خطوات التحضير المتسلسلة (Brewing Steps):
                      </label>
                      <button
                        type="button"
                        onClick={handleAddStep}
                        style={{
                          background: '#FFFDF9',
                          border: '1px solid #EDD9BD',
                          color: '#96663B',
                          borderRadius: '8px',
                          padding: '4px 12px',
                          fontSize: '0.78rem',
                          fontWeight: '800',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Plus size={13} />
                        <span>إضافة خطوة جديدة</span>
                      </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {(activeGuideEdit.steps || []).map((stepItem, idx) => (
                        <div
                          key={idx}
                          style={{
                            background: '#FFFDF9',
                            borderRadius: '10px',
                            border: '1px solid #EDD9BD',
                            padding: '12px 14px',
                            display: 'flex',
                            gap: '12px',
                            alignItems: 'flex-start'
                          }}
                        >
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #2C1810 0%, #4A3220 100%)',
                            color: '#C49A5C',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: '900',
                            fontSize: '0.84rem',
                            flexShrink: 0,
                            marginTop: '4px'
                          }}>
                            {idx + 1}
                          </div>
                          
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <input
                              type="text"
                              value={stepItem.title || ''}
                              onChange={e => handleStepChange(idx, 'title', e.target.value)}
                              placeholder={`عنوان الخطوة ${idx + 1} (مثال: الترطيب الأولي Blooming)`}
                              className="form-input"
                              style={{ fontWeight: '700', fontSize: '0.88rem' }}
                            />
                            <textarea
                              rows={2}
                              value={stepItem.desc || ''}
                              onChange={e => handleStepChange(idx, 'desc', e.target.value)}
                              placeholder={`تفاصيل الخطوة ${idx + 1} (كمية الماء، الثواني، وطريقة الصب...)`}
                              className="form-input"
                              style={{ fontSize: '0.84rem', lineHeight: '1.5' }}
                            />
                          </div>

                          {(activeGuideEdit.steps || []).length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveStep(idx)}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#ef4444',
                                cursor: 'pointer',
                                padding: '4px',
                                flexShrink: 0
                              }}
                              title="حذف هذه الخطوة"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Save Guide Button */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', marginTop: '6px', borderTop: '1px solid #EDD9BD', paddingTop: '14px' }}>
                    <button
                      type="button"
                      onClick={handleSaveBrewingGuide}
                      className="btn btn-primary"
                      style={{
                        padding: '10px 24px',
                        fontWeight: '800',
                        fontSize: '0.9rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'linear-gradient(135deg, #96663B 0%, #7A5230 100%)',
                        border: 'none',
                        boxShadow: '0 4px 12px rgba(150, 102, 59, 0.35)'
                      }}
                    >
                      <Save size={16} />
                      <span>حفظ وصفة ({activeGuideEdit.methodName || selectedBrewingMethod}) 💾</span>
                    </button>
                  </div>

                </div>
              )}

              {/* Live Preview Card */}
              {showBrewingPreview && activeGuideEdit && (
                <div style={{
                  background: 'linear-gradient(135deg, #2C1810 0%, #4A3220 100%)',
                  borderRadius: '16px',
                  border: '1.5px solid #EDD9BD',
                  padding: '20px',
                  color: '#FFF8EE',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    left: '12px',
                    background: 'rgba(196, 154, 92, 0.25)',
                    border: '1px solid #C49A5C',
                    color: '#EDD9BD',
                    padding: '2px 8px',
                    borderRadius: '6px',
                    fontSize: '0.72rem',
                    fontWeight: '800'
                  }}>
                    معاينة حية لنافذة العميل 📱
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#4A3220', border: '1px solid #EDD9BD', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#C49A5C' }}>
                      <Coffee size={18} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '900', color: '#FFF8EE' }}>
                        {activeGuideEdit.methodName || 'طريقة التحضير'}
                      </h4>
                      <span style={{ fontSize: '0.76rem', color: '#EDD9BD' }}>
                        دليل ووصفة التحضير الموصى بها لمحصول البن المختار
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px', marginBottom: '14px' }}>
                    <div style={{ background: 'rgba(255, 253, 249, 0.1)', padding: '8px 10px', borderRadius: '8px', border: '1px solid #EDD9BD', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: '#EDD9BD', display: 'block' }}>نسبة الاستخلاص</span>
                      <strong style={{ fontSize: '0.9rem', color: '#C49A5C' }}>{activeGuideEdit.ratio || '-'}</strong>
                    </div>
                    <div style={{ background: 'rgba(255, 253, 249, 0.1)', padding: '8px 10px', borderRadius: '8px', border: '1px solid #EDD9BD', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: '#EDD9BD', display: 'block' }}>حرارة الماء</span>
                      <strong style={{ fontSize: '0.9rem', color: '#C49A5C' }}>{activeGuideEdit.waterTemp || '-'}</strong>
                    </div>
                    <div style={{ background: 'rgba(255, 253, 249, 0.1)', padding: '8px 10px', borderRadius: '8px', border: '1px solid #EDD9BD', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: '#EDD9BD', display: 'block' }}>وقت التحضير</span>
                      <strong style={{ fontSize: '0.9rem', color: '#C49A5C' }}>{activeGuideEdit.brewTime || '-'}</strong>
                    </div>
                    <div style={{ background: 'rgba(255, 253, 249, 0.1)', padding: '8px 10px', borderRadius: '8px', border: '1px solid #EDD9BD', textAlign: 'center' }}>
                      <span style={{ fontSize: '0.72rem', color: '#EDD9BD', display: 'block' }}>الجرعة والماء</span>
                      <strong style={{ fontSize: '0.85rem', color: '#C49A5C' }}>{activeGuideEdit.coffeeDose || ''} / {activeGuideEdit.waterTotal || ''}</strong>
                    </div>
                  </div>

                  {activeGuideEdit.baristaTip && (
                    <div style={{ background: 'rgba(217, 119, 6, 0.15)', border: '1px solid rgba(217, 119, 6, 0.35)', borderRadius: '8px', padding: '8px 12px', fontSize: '0.78rem', color: '#fef3c7', lineHeight: '1.5' }}>
                      💡 <strong>نصيحة الباريستا:</strong> {activeGuideEdit.baristaTip}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

          {/* 🤖 CARD: إعدادات مساعد كاتورا الذكي (Google Gemini AI) 🤖 */}
          <div className="card" style={{
            background: '#ffffff',
            borderRadius: '18px',
            border: '1.5px solid ' + (formData.geminiApiKey ? 'rgba(56, 189, 248, 0.5)' : 'var(--border-light)'),
            overflow: 'hidden',
            boxShadow: '0 4px 18px rgba(0,0,0,0.05)'
          }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-light)',
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #0284c7, #38bdf8)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(56, 189, 248, 0.35)'
                }}>
                  <Bot size={22} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '900', color: '#ffffff' }}>
                      🤖 ربط مساعد كاتورا بـ Google Gemini AI
                    </h3>
                    <span style={{
                      background: formData.geminiApiKey ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255,255,255,0.15)',
                      color: formData.geminiApiKey ? '#7dd3fc' : '#cbd5e1',
                      border: '1px solid ' + (formData.geminiApiKey ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255,255,255,0.2)'),
                      padding: '2px 8px',
                      borderRadius: '9999px',
                      fontSize: '0.72rem',
                      fontWeight: '800'
                    }}>
                      {formData.geminiApiKey ? '⚡ متصل بـ Gemini 2.0' : 'وضع الباريستا المحلي'}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                    ربط المساعد بذكاء اصطناعي حقيقي من Google للإجابة عن أسئلة الزبائن وترشيح القهوة بذكاء فائق
                  </span>
                </div>
              </div>

              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  color: '#e2e8f0',
                  textDecoration: 'none',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  padding: '6px 14px',
                  borderRadius: '10px',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'background 0.15s'
                }}
              >
                <span>احصل على مفتاح مجاني (AI Studio)</span>
                <ExternalLink size={13} />
              </a>
            </div>

            <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '6px' }}>
                  🔑 مفتاح Google Gemini API Key:
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <input
                      type={showGeminiKey ? 'text' : 'password'}
                      name="geminiApiKey"
                      value={formData.geminiApiKey}
                      onChange={handleChange}
                      placeholder="الصق مفتاح API الخاص بك هنا (يبدأ بـ AIzaSy...)"
                      className="form-input"
                      style={{
                        fontSize: '0.92rem',
                        fontWeight: '700',
                        fontFamily: 'monospace',
                        letterSpacing: showGeminiKey ? 'normal' : '2px',
                        paddingLeft: '40px'
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowGeminiKey(prev => !prev)}
                      style={{
                        position: 'absolute',
                        left: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        padding: '4px'
                      }}
                      title={showGeminiKey ? 'إخفاء' : 'إظهار'}
                    >
                      <Eye size={17} />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleTestGemini}
                    disabled={isTestingGemini || !formData.geminiApiKey}
                    style={{
                      background: isTestingGemini ? '#94a3b8' : 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                      border: 'none',
                      color: '#ffffff',
                      padding: '8px 18px',
                      borderRadius: '10px',
                      fontSize: '0.84rem',
                      fontWeight: '800',
                      cursor: isTestingGemini || !formData.geminiApiKey ? 'default' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)'
                    }}
                  >
                    <Zap size={15} />
                    <span>{isTestingGemini ? 'جاري الفحص...' : 'اختبار الاتصال ⚡'}</span>
                  </button>
                </div>

                {/* Gemini Test Feedback Message */}
                {geminiTestStatus && (
                  <div style={{
                    marginTop: '10px',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    fontSize: '0.82rem',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    background: geminiTestStatus.success ? '#ecfdf5' : '#fef2f2',
                    border: '1px solid ' + (geminiTestStatus.success ? '#6ee7b7' : '#fca5a5'),
                    color: geminiTestStatus.success ? '#065f46' : '#991b1b'
                  }}>
                    {geminiTestStatus.success ? (
                      <>
                        <CheckCircle size={16} color="#059669" />
                        <span>✅ الاتصال بـ Google Gemini 2.0 ناجح وسريع! سيعمل المساعد بكامل ذكائه الآن.</span>
                      </>
                    ) : (
                      <>
                        <span style={{ fontSize: '1rem' }}>⚠️</span>
                        <span>فشل الاتصال: {geminiTestStatus.error}</span>
                      </>
                    )}
                  </div>
                )}

                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: '1.5' }}>
                  💡 <strong>ملاحظة:</strong> المفتاح مجاني بالكامل من Google AI Studio. بمجرد إدخاله، سيتحول مساعد كاتورا الذكي للعمل بنموذج <strong>Gemini 2.0 Flash</strong> الفائق الذكاء، مع حفظ خريطة منتجات وأسعار وتفاصيل كاتورا تلقائياً. في حال عدم إدخال مفتاح، يستمر المساعد بالعمل عبر محرك كاتورا الذكي المحلي.
                </div>
              </div>
            </div>
          </div>

          {/* CARD 1: الاتصال المباشر والواتساب */}
          <div className="card" style={{ background: '#ffffff', borderRadius: '18px', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-light)',
              background: 'var(--mint-50)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'rgba(34, 197, 94, 0.15)',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Phone size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: 'var(--mint-950)' }}>
                  بيانات الاتصال المباشر والواتساب
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>أرقام التواصل التي يتصل أو يراسل عليها الزبائن</span>
              </div>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Phone Field */}
              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.86rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
                  <span>📞 رقم الهاتف المباشر (للاتصال):</span>
                  {formData.phone && (
                    <a
                      href={`tel:${formData.phone}`}
                      style={{ fontSize: '0.75rem', color: '#2563eb', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                    >
                      تجربة الاتصال <ExternalLink size={12} />
                    </a>
                  )}
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="مثال: 01012345678"
                    className="form-input"
                    style={{ direction: 'ltr', textAlign: 'left', fontWeight: '700', fontSize: '0.95rem' }}
                  />
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  يظهر في قسم "تواصل معنا" بالفوتر، ويسمح للعميل بالاتصال بالهاتف فور الضغط عليه.
                </div>
              </div>

              {/* WhatsApp Field */}
              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.86rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#15803d' }}>
                    <MessageCircle size={16} color="#16a34a" />
                    رقم الواتساب الرسمي (WhatsApp):
                  </span>
                  {formData.whatsapp && (
                    <a
                      href={`https://wa.me/${formattedWhatsApp}?text=${encodeURIComponent('تجربة محادثة واتساب من لوحة إدارة كاتورا')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.75rem', color: '#16a34a', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: '700' }}
                    >
                      تجربة فتح واتساب <ExternalLink size={12} />
                    </a>
                  )}
                </label>
                <input
                  type="text"
                  name="whatsapp"
                  value={formData.whatsapp}
                  onChange={handleChange}
                  placeholder="مثال: 01000000000 أو 201000000000"
                  className="form-input"
                  style={{ direction: 'ltr', textAlign: 'left', fontWeight: '700', fontSize: '0.95rem', borderColor: '#86efac' }}
                />
                <div style={{ fontSize: '0.74rem', color: '#15803d', marginTop: '4px' }}>
                  ⚡ هام: يستقبل هذا الرقم رسائل طلبات سلة الشراء تلقائياً من المتجر. الصيغة المدعومة: 010... أو 2010...
                </div>
              </div>

              {/* InstaPay & Mobile Wallets Transfer Destination Phone */}
              <div style={{
                background: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
                border: '1.5px solid #c084fc',
                borderRadius: '14px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem', fontWeight: '800', color: '#581c87', marginBottom: '2px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Sparkles size={16} color="#7c3aed" />
                    رقم التحويل لإنستاباي والمحافظ الإلكترونية (بدل الحساب):
                  </span>
                  <span style={{ fontSize: '0.74rem', background: '#7c3aed', color: '#ffffff', padding: '2px 8px', borderRadius: '6px', fontWeight: '800' }}>
                    يظهر للعملاء في السلة
                  </span>
                </label>
                <input
                  type="text"
                  name="instapayPhone"
                  value={formData.instapayPhone || ''}
                  onChange={handleChange}
                  placeholder="01033144498"
                  className="form-input"
                  style={{ direction: 'ltr', textAlign: 'left', fontWeight: '800', fontSize: '1rem', borderColor: '#a78bfa', background: '#ffffff', color: '#0f172a' }}
                />
                <div style={{ fontSize: '0.76rem', color: '#6b21a8', lineHeight: '1.45', fontWeight: '600' }}>
                  ⚡ هذا هو رقم الموبايل الذي يظهر للعملاء في نافذة إتمام الطلب (Checkout) ليقوموا بالتحويل عليه بدلاً من عنوان الحساب القديم. تم تعيينه: <strong>01033144498</strong> مع إمكانية تعديله وحفظه هنا في أي وقت.
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.86rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
                  <span>✉️ البريد الإلكتروني (Email):</span>
                  {formData.email && (
                    <a
                      href={`mailto:${formData.email}`}
                      style={{ fontSize: '0.75rem', color: '#d97706', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                    >
                      تجربة الإيميل <ExternalLink size={12} />
                    </a>
                  )}
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="مثال: contact@caturracoffee.com"
                  className="form-input"
                  style={{ direction: 'ltr', textAlign: 'left', fontWeight: '600', fontSize: '0.92rem' }}
                />
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  يظهر في الفوتر لمراسلات الأعمال وطلبات الجملة.
                </div>
              </div>

            </div>
          </div>

          {/* CARD 2: العنوان ومواعيد العمل وخدمة الشحن */}
          <div className="card" style={{ background: '#ffffff', borderRadius: '18px', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-light)',
              background: 'var(--mint-50)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'rgba(59, 130, 246, 0.15)',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <MapPin size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: 'var(--mint-950)' }}>
                  العنوان، المواعيد وخدمة الشحن
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>مقر المحمصة وتفاصيل استقبال واستلام الطلبات</span>
              </div>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Address Field */}
              <div>
                <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
                  📍 عنوان مقر المحمصة والمتجر:
                </label>
                <textarea
                  name="address"
                  rows={2}
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="مثال: القاهرة، مصر الجديدة - شارع الثورة، بالقرب من محطة الأهرام"
                  className="form-input"
                  style={{ fontSize: '0.9rem', lineHeight: '1.5' }}
                />
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  العنوان المعروض في عمود العنوان بالفوتر وعلى رأس الفواتير.
                </div>
              </div>

              {/* Working Hours */}
              <div>
                <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
                  ⏰ مواعيد وساعات العمل والخدمة:
                </label>
                <input
                  type="text"
                  name="workingHours"
                  value={formData.workingHours}
                  onChange={handleChange}
                  placeholder="مثال: يومياً من 8:00 صباحاً حتى 12:00 منتصف الليل"
                  className="form-input"
                  style={{ fontSize: '0.9rem', fontWeight: '600' }}
                />
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  تنبيه العملاء بأوقات فتح المحل واستقبال استفساراتهم.
                </div>
              </div>

              {/* Shipping info note */}
              <div>
                <label style={{ display: 'block', fontSize: '0.86rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
                  🚚 ملحوظة خدمة الشحن والتوصيل:
                </label>
                <input
                  type="text"
                  name="shippingInfo"
                  value={formData.shippingInfo}
                  onChange={handleChange}
                  placeholder="مثال: شحن لجميع المحافظات خلال 24-48 ساعة 🚚"
                  className="form-input"
                  style={{ fontSize: '0.9rem', fontWeight: '600' }}
                />
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  تظهر في الفوتر لزيادة ثقة العملاء وسرعة الطلب.
                </div>
              </div>

            </div>
          </div>

          {/* CARD 3: صفحات التواصل الاجتماعي */}
          <div className="card" style={{ background: '#ffffff', borderRadius: '18px', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-light)',
              background: 'var(--mint-50)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'rgba(236, 72, 153, 0.15)',
                color: '#db2777',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Share2 size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: 'var(--mint-950)' }}>
                  روابط صفحات السوشيال ميديا
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>أزرار المتابعة لحسابات كاتورا في الفوتر</span>
              </div>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* Instagram */}
              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.86rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ color: '#e1306c' }}>📸</span> رابط إنستجرام (Instagram):
                  </span>
                  {formData.instagram && (
                    <a
                      href={formData.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.75rem', color: '#e1306c', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                    >
                      زيارة الحساب <ExternalLink size={12} />
                    </a>
                  )}
                </label>
                <input
                  type="url"
                  name="instagram"
                  value={formData.instagram}
                  onChange={handleChange}
                  placeholder="https://instagram.com/your_profile"
                  className="form-input"
                  style={{ direction: 'ltr', textAlign: 'left', fontSize: '0.88rem' }}
                />
              </div>

              {/* Facebook */}
              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.86rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ color: '#1877f2' }}>📘</span> رابط صفحة فيسبوك (Facebook):
                  </span>
                  {formData.facebook && (
                    <a
                      href={formData.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.75rem', color: '#1877f2', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                    >
                      زيارة الصفحة <ExternalLink size={12} />
                    </a>
                  )}
                </label>
                <input
                  type="url"
                  name="facebook"
                  value={formData.facebook}
                  onChange={handleChange}
                  placeholder="https://facebook.com/your_page"
                  className="form-input"
                  style={{ direction: 'ltr', textAlign: 'left', fontSize: '0.88rem' }}
                />
              </div>

              {/* TikTok */}
              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.86rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ color: '#00f2fe' }}>🎵</span> رابط حساب تيك توك (TikTok):
                  </span>
                  {formData.tiktok && (
                    <a
                      href={formData.tiktok}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '0.75rem', color: '#0f172a', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                    >
                      زيارة الحساب <ExternalLink size={12} />
                    </a>
                  )}
                </label>
                <input
                  type="url"
                  name="tiktok"
                  value={formData.tiktok}
                  onChange={handleChange}
                  placeholder="https://tiktok.com/@your_channel"
                  className="form-input"
                  style={{ direction: 'ltr', textAlign: 'left', fontSize: '0.88rem' }}
                />
              </div>

            </div>
          </div>

          {/* CARD 4: العلامة التجارية والفواتير ونبذة من نحن */}
          <div className="card" style={{ background: '#ffffff', borderRadius: '18px', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-light)',
              background: 'var(--mint-50)',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Building size={18} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: 'var(--mint-950)' }}>
                  بيانات الفاتورة ونبذة "من نحن"
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>السجل التجاري، البطاقة الضريبية، وقصة البراند</span>
              </div>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              {/* CR & Tax Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
                    السجل التجاري (CR):
                  </label>
                  <input
                    type="text"
                    name="commercialRegister"
                    value={formData.commercialRegister}
                    onChange={handleChange}
                    placeholder="148920"
                    className="form-input"
                    style={{ direction: 'ltr', textAlign: 'center', fontWeight: '700', fontSize: '0.9rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
                    البطاقة الضريبية:
                  </label>
                  <input
                    type="text"
                    name="taxNumber"
                    value={formData.taxNumber}
                    onChange={handleChange}
                    placeholder="582-934-211"
                    className="form-input"
                    style={{ direction: 'ltr', textAlign: 'center', fontWeight: '700', fontSize: '0.9rem' }}
                  />
                </div>
              </div>

              {/* Brand Names */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
                    الاسم بالعربية:
                  </label>
                  <input
                    type="text"
                    name="brandNameAr"
                    value={formData.brandNameAr}
                    onChange={handleChange}
                    placeholder="كاتورا للقهوة المختصة"
                    className="form-input"
                    style={{ fontSize: '0.88rem', fontWeight: '700' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
                    الاسم بالإنجليزية:
                  </label>
                  <input
                    type="text"
                    name="brandNameEn"
                    value={formData.brandNameEn}
                    onChange={handleChange}
                    placeholder="CATURRA COFFEE & ROASTER"
                    className="form-input"
                    style={{ direction: 'ltr', textAlign: 'left', fontSize: '0.84rem', fontWeight: '700' }}
                  />
                </div>
              </div>

              {/* About Us & Complete Roastery Story */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'rgba(196, 154, 92, 0.08)', padding: '20px', borderRadius: '16px', border: '1.5px solid rgba(196, 154, 92, 0.35)', marginTop: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} color="#96663B" />
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '800', color: '#4A3220' }}>
                    قصة العلامة التجارية وقسم "من نحن" الكامل (About Us Story)
                  </h4>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
                    نبذة سريعة عن المحمصة (تظهر في فوتر المتجر وبطاقات النبذة السريعة):
                  </label>
                  <textarea
                    name="aboutUs"
                    rows={2}
                    value={formData.aboutUs}
                    onChange={handleChange}
                    placeholder="اكتب نبذة مختصرة عن قصة كاتورا ومصادر المحاصيل الفاخرة..."
                    className="form-input"
                    style={{ fontSize: '0.85rem', lineHeight: '1.6' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
                      شارة / بادئة قسم من نحن (Story Tag):
                    </label>
                    <input
                      type="text"
                      name="storyTag"
                      value={formData.storyTag}
                      onChange={handleChange}
                      placeholder="من نحن • شغف البن المختص"
                      className="form-input"
                      style={{ fontSize: '0.85rem' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
                      عنوان قصة المحمصة (Story Subtitle):
                    </label>
                    <input
                      type="text"
                      name="storySubtitle"
                      value={formData.storySubtitle}
                      onChange={handleChange}
                      placeholder="محمصة كاتورا للقهوة المختصة"
                      className="form-input"
                      style={{ fontSize: '0.85rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
                    نص قصة المحمصة - الفقرة الأولى (تظهر في قسم من نحن بالموقع):
                  </label>
                  <textarea
                    name="aboutStoryP1"
                    rows={3}
                    value={formData.aboutStoryP1}
                    onChange={handleChange}
                    placeholder="في محمصة كاتورا للقهوة المختصة، بدأنا بشغف حقيقي لاستكشاف سحر البن..."
                    className="form-input"
                    style={{ fontSize: '0.85rem', lineHeight: '1.6' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
                    نص قصة المحمصة - الفقرة الثانية:
                  </label>
                  <textarea
                    name="aboutStoryP2"
                    rows={3}
                    value={formData.aboutStoryP2}
                    onChange={handleChange}
                    placeholder="ننتقي محاصيلنا بعناية فائقة ونحمصها محلياً بحرفية وفق بروفايلات تحميص دقيقة..."
                    className="form-input"
                    style={{ fontSize: '0.85rem', lineHeight: '1.6' }}
                  />
                </div>
              </div>

            </div>
          </div>

          {/* 📊 Card: شريط إحصائيات وأرقام المتجر المباشرة */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{
              padding: '16px 22px',
              borderBottom: '1px solid var(--border-light)',
              background: 'linear-gradient(135deg, #2b1d16 0%, #1a100b 100%)',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '11px',
                  background: 'linear-gradient(135deg, #d4a373, #a66a38)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 3px 10px rgba(166, 106, 56, 0.35)'
                }}>
                  <BarChart3 size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '900', color: '#ffffff' }}>
                    📊 شريط إحصائيات وأرقام المحمصة (Live Stats Banner)
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: '#e5d5c5' }}>
                    شريط الأرقام البارز في قسم "عن كاتورا" - يقرأ تلقائياً من مبيعات وفواتير ومحاصيل المتجر
                  </span>
                </div>
              </div>

              {/* Auto Calc Toggle Switch */}
              <label style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                userSelect: 'none',
                background: 'rgba(255, 255, 255, 0.12)',
                padding: '6px 14px',
                borderRadius: '10px',
                border: '1.5px solid ' + (formData.statsAutoCalc ? '#d4a373' : 'rgba(255, 255, 255, 0.2)'),
                boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
              }}>
                <span style={{ fontWeight: '800', fontSize: '0.84rem', color: formData.statsAutoCalc ? '#fde047' : '#cbd5e1' }}>
                  {formData.statsAutoCalc ? '⚡ الحساب التلقائي الحي مفعل' : '⏸️ إدخال يدوي مخصص'}
                </span>
                <input
                  type="checkbox"
                  name="statsAutoCalc"
                  checked={!!formData.statsAutoCalc}
                  onChange={handleChange}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#d4a373' }}
                />
              </label>
            </div>

            <div style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Explanatory Info Alert */}
              <div style={{
                background: '#fefce8',
                border: '1px solid #fef08a',
                borderRadius: '12px',
                padding: '12px 16px',
                fontSize: '0.82rem',
                color: '#854d0e',
                lineHeight: '1.6',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px'
              }}>
                <Sparkles size={18} color="#ca8a04" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>كيف يعمل الحساب التلقائي الذكي؟</strong>
                  <div style={{ marginTop: '3px' }}>
                    • <strong>فنجان قُدّم بشغف:</strong> يجمع الفناجين التأسيسية للمحمصة مع عدد الفناجين المحسوبة تلقائياً من كمية الجرامات والعبوات المباعة في فواتير المتجر (حوالي 18 جرام لكل فنجان قهوة).<br />
                    • <strong>محصول وسلالة عالمية:</strong> يحسب عدد محاصيل القهوة النشطة والمتوفرة بالمتجر حالياً ({products.filter(p => p.category === 'coffee' || p.category === 'specialty' || p.category === 'espresso' || p.isBlend || p.coffeeOrigin).length} محصول).<br />
                    • <strong>سنوات من الريادة:</strong> تحسب ديناميكياً بناءً على سنة التأسيس ({new Date().getFullYear()} - {formData.foundingYear || 2021} = {Math.max(5, new Date().getFullYear() - (formData.foundingYear || 2021))} سنوات).
                  </div>
                </div>
              </div>

              {/* Foundational Settings Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '16px' }}>
                
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
                    ☕ رصيد الفناجين التأسيسي (Base Cups):
                  </label>
                  <input
                    type="number"
                    name="statsBaseCups"
                    value={formData.statsBaseCups}
                    onChange={handleChange}
                    placeholder="20000"
                    className="form-input"
                    style={{ fontSize: '0.9rem', fontWeight: '700' }}
                  />
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    الفناجين السابقة وتُضاف تلقائياً لمبيعات الموقع (+{previewStats.raw.soldCups} فنجان مباع حالياً).
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
                    📅 سنة التأسيس (Founding Year):
                  </label>
                  <input
                    type="number"
                    name="foundingYear"
                    value={formData.foundingYear}
                    onChange={handleChange}
                    placeholder="2021"
                    className="form-input"
                    style={{ fontSize: '0.9rem', fontWeight: '700' }}
                  />
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    تحسب سنوات الريادة تلقائياً: {previewStats.displayYears}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
                    🏆 شهادات الجودة الدولية (SCA / Q-Grader):
                  </label>
                  <input
                    type="number"
                    name="statsCerts"
                    value={formData.statsCerts}
                    onChange={handleChange}
                    placeholder="3"
                    className="form-input"
                    style={{ fontSize: '0.9rem', fontWeight: '700' }}
                  />
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    تظهر: {previewStats.displayCerts} شهادات جودة
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
                    📍 المقرات والفروع (Branches):
                  </label>
                  <input
                    type="number"
                    name="statsBranches"
                    value={formData.statsBranches}
                    onChange={handleChange}
                    placeholder="2"
                    className="form-input"
                    style={{ fontSize: '0.9rem', fontWeight: '700' }}
                  />
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    تظهر: {previewStats.displayBranches} مقر وفرع
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
                    🎓 أكاديمية تدريب معتمدة:
                  </label>
                  <input
                    type="number"
                    name="statsAcademy"
                    value={formData.statsAcademy}
                    onChange={handleChange}
                    placeholder="1"
                    className="form-input"
                    style={{ fontSize: '0.9rem', fontWeight: '700' }}
                  />
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    تظهر: {previewStats.displayAcademy} أكاديمية معتمدة
                  </div>
                </div>

              </div>

              {/* Optional Custom Overrides Collapsible / Section */}
              <div style={{
                background: '#f8fafc',
                border: '1px dashed #cbd5e1',
                borderRadius: '12px',
                padding: '16px',
                marginTop: '6px'
              }}>
                <div style={{ fontSize: '0.88rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>✏️ تخصيص يدوي مباشر للأرقام (اختياري - اتركه فارغاً للحساب التلقائي):</span>
                </div>
                <p style={{ margin: '0 0 14px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  في حال رغبتك في تثبيت نصوص مخصصة تظهر للعملاء بغض النظر عن الحساب التلقائي، يمكنك ملء الخانات أدناه:
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      تخصيص المحاصيل (بدلاً من {previewStats.raw.lots}+):
                    </label>
                    <input
                      type="text"
                      name="customStatLots"
                      value={formData.customStatLots}
                      onChange={handleChange}
                      placeholder={formData.statsAutoCalc ? `تلقائي (${previewStats.displayLots})` : '+12'}
                      className="form-input"
                      style={{ fontSize: '0.84rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      تخصيص الفناجين (بدلاً من {formatStatNumber(previewStats.raw.totalCups)}):
                    </label>
                    <input
                      type="text"
                      name="customStatCups"
                      value={formData.customStatCups}
                      onChange={handleChange}
                      placeholder={formData.statsAutoCalc ? `تلقائي (${previewStats.displayCups})` : '+20k'}
                      className="form-input"
                      style={{ fontSize: '0.84rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      تخصيص سنوات الريادة:
                    </label>
                    <input
                      type="text"
                      name="customStatYears"
                      value={formData.customStatYears}
                      onChange={handleChange}
                      placeholder={previewStats.displayYears}
                      className="form-input"
                      style={{ fontSize: '0.84rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: '700', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      تخصيص نسبة الأرابيكا:
                    </label>
                    <input
                      type="text"
                      name="customStatArabica"
                      value={formData.customStatArabica}
                      onChange={handleChange}
                      placeholder="100%"
                      className="form-input"
                      style={{ fontSize: '0.84rem' }}
                    />
                  </div>
                </div>
              </div>

              {/* Live Preview of the Stats Banner */}
              <div style={{ marginTop: '10px' }}>
                <div style={{ fontSize: '0.86rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Eye size={16} color="var(--mint-700)" />
                  <span>معاينة حية لشريط الإحصائيات كما يظهر للعملاء في المتجر:</span>
                </div>

                <div style={{
                  background: 'linear-gradient(135deg, #24160f 0%, #170d08 100%)',
                  borderRadius: '16px',
                  padding: '24px 20px',
                  color: '#ffffff',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
                  border: '1px solid rgba(212, 163, 115, 0.25)',
                  overflowX: 'auto'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-around',
                    flexWrap: 'wrap',
                    gap: '20px',
                    textAlign: 'center'
                  }}>
                    <div>
                      <div style={{ fontSize: '1.7rem', fontWeight: '900', color: '#d4a373', fontFamily: 'system-ui' }}>
                        {previewStats.displayLots}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '4px' }}>
                        محصول وسلالة عالمية
                      </div>
                    </div>

                    <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.1)' }} />

                    <div>
                      <div style={{ fontSize: '1.7rem', fontWeight: '900', color: '#d4a373', fontFamily: 'system-ui' }}>
                        {previewStats.displayYears}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '4px' }}>
                        سنوات من الريادة
                      </div>
                    </div>

                    <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.1)' }} />

                    <div>
                      <div style={{ fontSize: '1.7rem', fontWeight: '900', color: '#d4a373', fontFamily: 'system-ui' }}>
                        {previewStats.displayCerts}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '4px' }}>
                        شهادات جودة دولية
                      </div>
                    </div>

                    <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.1)' }} />

                    <div>
                      <div style={{ fontSize: '1.7rem', fontWeight: '900', color: '#d4a373', fontFamily: 'system-ui' }}>
                        {previewStats.displayBranches}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '4px' }}>
                        مقر وفرع لخدمتكم
                      </div>
                    </div>

                    <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.1)' }} />

                    <div>
                      <div style={{ fontSize: '1.7rem', fontWeight: '900', color: '#d4a373', fontFamily: 'system-ui' }}>
                        {previewStats.displayAcademy}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '4px' }}>
                        أكاديمية تدريب معتمدة
                      </div>
                    </div>

                    <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.1)' }} />

                    <div>
                      <div style={{ fontSize: '1.7rem', fontWeight: '900', color: '#d4a373', fontFamily: 'system-ui' }}>
                        {previewStats.displayArabica}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '4px' }}>
                        أرابيكا مختصة نقية
                      </div>
                    </div>

                    <div style={{ width: '1px', height: '40px', background: 'rgba(255,255,255,0.1)' }} />

                    <div>
                      <div style={{ fontSize: '1.7rem', fontWeight: '900', color: '#d4a373', fontFamily: 'system-ui' }}>
                        {previewStats.displayCups}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '4px' }}>
                        فنجان قُدّم بشغف
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Live Interactive Footer Preview Box */}
        <div style={{ marginTop: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} color="var(--mint-700)" />
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: '800', color: 'var(--mint-950)' }}>
                معاينة حية لشكل فوتر المتجر (Live Preview)
              </h3>
            </div>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              تحديث فوري أثناء الكتابة
            </span>
          </div>

          <div style={{
            background: 'linear-gradient(135deg, #091e14 0%, #06150e 100%)',
            borderRadius: '20px',
            padding: '24px 26px',
            color: '#ffffff',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
            border: '1px solid rgba(74, 222, 128, 0.2)'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '22px' }}>
              
              {/* Col 1 */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4ade80', fontWeight: '800', fontSize: '0.94rem', marginBottom: '8px' }}>
                  <Coffee size={16} />
                  <span>من نحن</span>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#cbd5e1', lineHeight: '1.6', margin: 0 }}>
                  {formData.aboutUs || 'نبذة عن العلامة التجارية...'}
                </p>
              </div>

              {/* Col 2 */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4ade80', fontWeight: '800', fontSize: '0.94rem', marginBottom: '8px' }}>
                  <MapPin size={16} />
                  <span>العنوان والمواعيد</span>
                </div>
                <div style={{ fontSize: '0.8rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div><strong>المقر:</strong> {formData.address}</div>
                  <div><strong>ساعات العمل:</strong> {formData.workingHours}</div>
                  <div style={{ color: '#86efac' }}><strong>الشحن:</strong> {formData.shippingInfo}</div>
                </div>
              </div>

              {/* Col 3 */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4ade80', fontWeight: '800', fontSize: '0.94rem', marginBottom: '8px' }}>
                  <Phone size={16} />
                  <span>تواصل معنا</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem' }}>
                  <div style={{ background: 'rgba(255,255,255,0.08)', padding: '6px 10px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#94a3b8' }}>هاتف مباشر:</span>
                    <strong style={{ direction: 'ltr', color: '#ffffff' }}>{formData.phone}</strong>
                  </div>
                  <div style={{ background: 'rgba(34, 197, 94, 0.15)', padding: '6px 10px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid rgba(74, 222, 128, 0.3)' }}>
                    <span style={{ color: '#86efac' }}>واتساب:</span>
                    <strong style={{ direction: 'ltr', color: '#4ade80' }}>{formData.whatsapp}</strong>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.08)', padding: '6px 10px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#94a3b8' }}>البريد:</span>
                    <span style={{ direction: 'ltr', color: '#cbd5e1', fontSize: '0.78rem' }}>{formData.email}</span>
                  </div>
                </div>
              </div>

              {/* Col 4 */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4ade80', fontWeight: '800', fontSize: '0.94rem', marginBottom: '8px' }}>
                  <Share2 size={16} />
                  <span>السوشيال ميديا والفاتورة</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <div style={{ background: 'rgba(225, 48, 108, 0.2)', padding: '6px 10px', borderRadius: '8px', fontSize: '0.76rem', color: '#f472b6', fontWeight: '700' }}>
                    إنستجرام
                  </div>
                  <div style={{ background: 'rgba(24, 119, 242, 0.2)', padding: '6px 10px', borderRadius: '8px', fontSize: '0.76rem', color: '#60a5fa', fontWeight: '700' }}>
                    فيسبوك
                  </div>
                  <div style={{ background: 'rgba(0, 242, 254, 0.2)', padding: '6px 10px', borderRadius: '8px', fontSize: '0.76rem', color: '#67e8f9', fontWeight: '700' }}>
                    تيك توك
                  </div>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#94a3b8', borderTop: '1px dashed rgba(255,255,255,0.15)', paddingTop: '8px' }}>
                  سجل تجاري: {formData.commercialRegister} | بطاقة ضريبية: {formData.taxNumber}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Bottom Sticky Save Floating Bar */}
        <div style={{
          position: 'sticky',
          bottom: '16px',
          marginTop: '26px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1.5px solid var(--border-mint)',
          borderRadius: '16px',
          padding: '12px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
          zIndex: 30
        }}>
          <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
            💡 <strong>تلميح:</strong> سيتم حفظ كافة التغييرات على الفور وتنعكس على المتجر دون الحاجة لإعادة تشغيل النظام.
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{
              padding: '10px 28px',
              fontSize: '0.94rem',
              fontWeight: '800',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(11, 128, 79, 0.35)'
            }}
          >
            <Save size={18} />
            <span>حفظ بيانات التواصل الآن 💾</span>
          </button>
        </div>

      </form>
    </div>
  );
};
