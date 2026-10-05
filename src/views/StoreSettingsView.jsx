import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatWhatsAppNumber } from '../utils/whatsapp';
import {
  Phone,
  MessageCircle,
  Mail,
  MapPin,
  Clock,
  Truck,
  Share2,
  Building,
  Save,
  RotateCcw,
  Eye,
  CheckCircle,
  Sparkles,
  HelpCircle,
  ExternalLink,
  Shield,
  Coffee,
  Globe,
  Megaphone
} from 'lucide-react';

export const StoreSettingsView = () => {
  const { contactInfo, updateContactInfo, resetContactInfo, setViewMode } = useApp();

  // Local form state initialized from current contactInfo
  const [formData, setFormData] = useState({
    brandNameAr: contactInfo?.brandNameAr || 'كاتورا للقهوة المختصة',
    brandNameEn: contactInfo?.brandNameEn || 'CATURRA SPECIALTY COFFEE ROASTERS',
    phone: contactInfo?.phone || '01012345678',
    whatsapp: contactInfo?.whatsapp || '01000000000',
    email: contactInfo?.email || 'contact@caturracoffee.com',
    address: contactInfo?.address || 'القاهرة، مصر الجديدة - شارع الثورة، بالقرب من محطة الأهرام',
    workingHours: contactInfo?.workingHours || 'يومياً من 8:00 صباحاً حتى 12:00 منتصف الليل',
    shippingInfo: contactInfo?.shippingInfo || 'شحن لجميع المحافظات خلال 24-48 ساعة 🚚',
    instagram: contactInfo?.instagram || 'https://instagram.com',
    facebook: contactInfo?.facebook || 'https://facebook.com',
    tiktok: contactInfo?.tiktok || 'https://tiktok.com',
    aboutUs: contactInfo?.aboutUs || '',
    commercialRegister: contactInfo?.commercialRegister || '148920',
    taxNumber: contactInfo?.taxNumber || '582-934-211',
    bannerEnabled: contactInfo?.bannerEnabled !== undefined ? contactInfo.bannerEnabled : true,
    bannerText: contactInfo?.bannerText || 'شحن مجاني لكافة محافظات مصر للطلبات التي تزيد عن 500 جنيه | استخدم كود CATURRA10 لخصم 10%',
    bannerBadge: contactInfo?.bannerBadge || 'عرض حصري ☕',
    bannerTheme: contactInfo?.bannerTheme || 'mint',
    bannerLinkText: contactInfo?.bannerLinkText || 'تسوق الآن ⚡'
  });

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'contact' | 'social' | 'brand'

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = (e) => {
    e?.preventDefault();
    updateContactInfo(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
    }, 4000);
  };

  const handleReset = () => {
    if (window.confirm('هل تريد بالتأكيد استعادة بيانات التواصل الافتراضية للعلامة التجارية؟')) {
      resetContactInfo();
      // Also update local form state to default
      setFormData({
        brandNameAr: 'كاتورا للقهوة المختصة',
        brandNameEn: 'CATURRA SPECIALTY COFFEE ROASTERS',
        phone: '01012345678',
        whatsapp: '01000000000',
        email: 'contact@caturracoffee.com',
        address: 'القاهرة، مصر الجديدة - شارع الثورة، بالقرب من محطة الأهرام',
        workingHours: 'يومياً من 8:00 صباحاً حتى 12:00 منتصف الليل',
        shippingInfo: 'شحن لجميع المحافظات خلال 24-48 ساعة 🚚',
        instagram: 'https://instagram.com',
        facebook: 'https://facebook.com',
        tiktok: 'https://tiktok.com',
        aboutUs: 'كاتورا (Caturra) محمصة ومتجر قهوة مختصة مصري 100%. نؤمن بأن كل حبة بن تروي قصة فريدة. ننتقي بعناية أفضل المحاصيل الخضراء من مزارع إثيوبيا، كولومبيا، والبرازيل، ونحمصها بدرجات متوازنة لإبراز النكهات العطرية والإيحاءات الفاكهية والزهرية الفاخرة بدون أي إضافات صناعية.',
        commercialRegister: '148920',
        taxNumber: '582-934-211',
        bannerEnabled: true,
        bannerText: 'شحن مجاني لكافة محافظات مصر للطلبات التي تزيد عن 500 جنيه | استخدم كود CATURRA10 لخصم 10%',
        bannerBadge: 'عرض حصري ☕',
        bannerTheme: 'mint',
        bannerLinkText: 'تسوق الآن ⚡'
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
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
          <button
            type="button"
            onClick={() => setViewMode('client')}
            className="btn btn-outline"
            style={{
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
          </button>

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
          <button
            type="button"
            onClick={() => setViewMode('client')}
            style={{
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
            مشاهدة في المتجر ↗
          </button>
        </div>
      )}

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
                    placeholder="مثال: عرض حصري ☕ أو خصم خاص 🔥"
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
                    placeholder="CATURRA SPECIALTY COFFEE"
                    className="form-input"
                    style={{ direction: 'ltr', textAlign: 'left', fontSize: '0.84rem', fontWeight: '700' }}
                  />
                </div>
              </div>

              {/* About Us */}
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '6px' }}>
                  نبذة "من نحن" في فوتر المتجر:
                </label>
                <textarea
                  name="aboutUs"
                  rows={3}
                  value={formData.aboutUs}
                  onChange={handleChange}
                  placeholder="اكتب قصة كاتورا المختصة ومصادر المحاصيل الفاخرة..."
                  className="form-input"
                  style={{ fontSize: '0.85rem', lineHeight: '1.6' }}
                />
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
