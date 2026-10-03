import React, { useState, useEffect } from 'react';
import {
  Bell,
  Volume2,
  VolumeX,
  Send,
  CheckCircle,
  AlertTriangle,
  Smartphone,
  X,
  Sparkles,
  Info,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  Zap
} from 'lucide-react';
import {
  playNotificationSound,
  requestPushPermission,
  sendSystemNotification,
  sendTelegramAlert
} from '../utils/notifications';

export const NotificationSettingsModal = ({ isOpen, onClose }) => {
  const [permission, setPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'unsupported'
  );

  const [soundEnabled, setSoundEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('caturra_sound_enabled') !== 'false';
    }
    return true;
  });

  const [tgEnabled, setTgEnabled] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('caturra_telegram_enabled') === 'true';
    }
    return false;
  });

  const [tgToken, setTgToken] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('caturra_telegram_token') || '';
    }
    return '';
  });

  const [tgChatId, setTgChatId] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('caturra_telegram_chat_id') || '';
    }
    return '';
  });

  const [testStatus, setTestStatus] = useState(null);
  const [tgTestStatus, setTgTestStatus] = useState(null);
  const [showTgGuide, setShowTgGuide] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const res = await requestPushPermission();
    setPermission(res);
    if (res === 'granted') {
      sendSystemNotification({
        title: 'تم تفعيل إشعارات كاتورا بنجاح! ☕🎉',
        body: 'ستصلك الآن تنبيهات الطلبات الجديدة ونواقص المخزون فوراً على هاتفك.'
      });
      setTestStatus('تم تفعيل الإشعارات بنجاح وإرسال إشعار تجريبي!');
    } else if (res === 'denied') {
      setTestStatus('تم رفض الإذن. يمكنك تفعيله من إعدادات المتصفح لموقع كاتورا.');
    }
  };

  const handleSendTestPush = () => {
    playNotificationSound();
    const sent = sendSystemNotification({
      title: 'طلب جديد تجريبي #1092 🛒🌿',
      body: 'طلب جديد من العميل أحمد سامي - إثيوبيا يرجاشيفي (500ج) بقيمة 640 ج.م'
    });
    if (sent) {
      setTestStatus('✅ تم إرسال إشعار تجريبي لهاتفك بنجاح!');
    } else {
      setTestStatus('⚠️ يرجى الضغط أولاً على "تفعيل الإشعارات" والسماح للمتصفح.');
    }
    setTimeout(() => setTestStatus(null), 5000);
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('caturra_sound_enabled', String(next));
    if (next) {
      playNotificationSound();
    }
  };

  const handleSaveTelegram = () => {
    localStorage.setItem('caturra_telegram_enabled', String(tgEnabled));
    localStorage.setItem('caturra_telegram_token', tgToken.trim());
    localStorage.setItem('caturra_telegram_chat_id', tgChatId.trim());
  };

  const handleTestTelegram = async () => {
    handleSaveTelegram();
    setTgTestStatus('loading');
    const res = await sendTelegramAlert(
      `🔔 *إشعار تجريبي من منظومة كاتورا للقهوة المختصة ☕*\n━━━━━━━━━━━━━━━━━━━━\nتم ربط هاتفك بنجاح! ستصلك هنا كل تفاصيل الطلبات الجديدة والأصناف وتنبيهات المخزون فوراً وبشكل مجاني على مدار 24 ساعة. ✨`,
      { botToken: tgToken, chatId: tgChatId, enabled: true }
    );

    if (res.success) {
      setTgTestStatus('success');
    } else {
      setTgTestStatus('error');
    }
    setTimeout(() => setTgTestStatus(null), 6000);
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 120 }}>
      <div
        className="modal-content"
        style={{
          maxWidth: '520px',
          width: 'calc(100% - 24px)',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '24px',
          borderRadius: '20px',
          boxSizing: 'border-box'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '14px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--mint-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Smartphone size={22} color="var(--mint-700)" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--mint-950)', margin: 0 }}>
                إعدادات إشعارات الهاتف الفورية 📱
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--mint-700)', margin: '2px 0 0' }}>
                تلقي إشعارات الطلبات وتنبيهات المخزون مباشرة على موبايلك
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-icon" style={{ width: '32px', height: '32px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Section 1: Browser & Device Web Push */}
        <div style={{ background: '#f8fafc', border: '1.5px solid var(--border-light)', borderRadius: '16px', padding: '16px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bell size={18} color="var(--mint-700)" />
              <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)' }}>إشعارات المتصفح والهاتف (Push Alerts)</strong>
            </div>
            <span
              style={{
                fontSize: '0.74rem',
                fontWeight: '800',
                padding: '3px 10px',
                borderRadius: '9999px',
                backgroundColor: permission === 'granted' ? '#dcfce7' : (permission === 'denied' ? '#fee2e2' : '#fef3c7'),
                color: permission === 'granted' ? '#166534' : (permission === 'denied' ? '#991b1b' : '#92400e')
              }}
            >
              {permission === 'granted' ? 'مفعلة على الهاتف ✅' : (permission === 'denied' ? 'محظورة بالمتصفح ❌' : 'بانتظار السماح ⏳')}
            </span>
          </div>

          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: '1.5', margin: '0 0 12px' }}>
            تظهر لك نافذة إشعار منبثقة على شاشة الهاتف فور وصول أي طلب جديد أو نقص في مخزون القهوة.
          </p>

          {/* Important iOS Tip Box */}
          <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '10px 12px', marginBottom: '14px', fontSize: '0.78rem', color: '#92400e', lineHeight: '1.5' }}>
            <div style={{ fontWeight: '800', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>🍎 لمستخدمي هواتف الآيفون (iPhone):</span>
            </div>
            <div>
              متصفح Safari يمنع ظهور الإشعارات خارج المتصفح (على شاشة القفل) إلا إذا قمت بالضغط على زر المشاركة ⎋ ثم اختيار <strong>"إضافة إلى الشاشة الرئيسية (Add to Home Screen)"</strong>.
              <br />
              💡 <strong>الحل الأسهل والأضمن 100%:</strong> فعّل <strong>إشعارات تلجرام</strong> بالأسفل لتصلك رنة ورسالة بكل طلب في جيبك مباشرة حتى لو المتصفح مقفول!
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {permission !== 'granted' ? (
              <button
                onClick={handleRequestPermission}
                className="btn btn-primary"
                style={{ fontSize: '0.85rem', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Bell size={15} />
                <span>تفعيل إشعارات الهاتف الآن</span>
              </button>
            ) : (
              <button
                onClick={handleSendTestPush}
                className="btn btn-outline"
                style={{ fontSize: '0.85rem', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '6px', background: '#ffffff' }}
              >
                <Zap size={15} color="var(--mint-600)" />
                <span>إرسال إشعار تجريبي لهاتفي 📱</span>
              </button>
            )}

            <button
              onClick={() => {
                playNotificationSound();
                setTestStatus('🔊 تم تشغيل رنة التنبيه المميزة!');
                setTimeout(() => setTestStatus(null), 3000);
              }}
              className="btn btn-outline"
              style={{ fontSize: '0.82rem', padding: '8px 12px', background: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Volume2 size={15} />
              <span>تجربة رنة التنبيه 🔔</span>
            </button>
          </div>

          {testStatus && (
            <div style={{ marginTop: '10px', fontSize: '0.8rem', color: 'var(--mint-800)', fontWeight: '700', background: 'var(--mint-50)', padding: '6px 12px', borderRadius: '8px' }}>
              {testStatus}
            </div>
          )}
        </div>

        {/* Section 2: Sound Chime Toggle */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#ffffff', border: '1.5px solid var(--border-light)', borderRadius: '14px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {soundEnabled ? <Volume2 size={20} color="var(--mint-700)" /> : <VolumeX size={20} color="#94a3b8" />}
            <div>
              <div style={{ fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-main)' }}>نغمة التنبيه الصوتية (Audio Chime)</div>
              <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>رنة مميزة عند وصول طلب جديد أو فتح إشعار</div>
            </div>
          </div>
          <button
            onClick={handleToggleSound}
            style={{
              width: '46px',
              height: '26px',
              borderRadius: '9999px',
              background: soundEnabled ? 'var(--mint-600)' : '#cbd5e1',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background 200ms ease'
            }}
          >
            <div
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: '#ffffff',
                position: 'absolute',
                top: '3px',
                right: soundEnabled ? '23px' : '3px',
                transition: 'right 200ms ease',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}
            />
          </button>
        </div>

        {/* Section 3: Telegram Bot Instant Phone Alerts (Guaranteed 24/7 background) */}
        <div style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)', border: '1.5px solid #bae6fd', borderRadius: '16px', padding: '16px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Send size={18} color="#0284c7" />
              <strong style={{ fontSize: '0.95rem', color: '#0369a1' }}>
                إشعارات تلجرام المباشرة على الموبايل (موصى به 🌟)
              </strong>
            </div>
            <button
              onClick={() => {
                const next = !tgEnabled;
                setTgEnabled(next);
                localStorage.setItem('caturra_telegram_enabled', String(next));
              }}
              style={{
                fontSize: '0.78rem',
                fontWeight: '800',
                padding: '4px 12px',
                borderRadius: '9999px',
                border: 'none',
                background: tgEnabled ? '#0284c7' : '#94a3b8',
                color: '#ffffff',
                cursor: 'pointer'
              }}
            >
              {tgEnabled ? 'مفعل ✅' : 'معطل ❌'}
            </button>
          </div>

          <p style={{ fontSize: '0.8rem', color: '#0c4a6e', lineHeight: '1.5', margin: '0 0 12px' }}>
            <strong>أفضل ميزة لأصحاب المتاجر:</strong> يرسل لك إشعاراً فورياً على تطبيق تلجرام في موبايلك بتفاصيل كل طلب واسم العميل والسعر حتى لو كان متصفح الموقع مغلقاً تماماً!
          </p>

          {/* Config Fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#0369a1', display: 'block', marginBottom: '4px' }}>
                توكن بوت تلجرام (Bot Token):
              </label>
              <input
                type="text"
                placeholder="مثال: 7123456789:AAH78xyz..."
                value={tgToken}
                onChange={e => {
                  setTgToken(e.target.value);
                  localStorage.setItem('caturra_telegram_token', e.target.value.trim());
                }}
                className="form-input"
                style={{ height: '36px', fontSize: '0.82rem', background: '#ffffff', borderRadius: '8px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: '700', color: '#0369a1', display: 'block', marginBottom: '4px' }}>
                معرّف المحادثة الخاص بك (Chat ID):
              </label>
              <input
                type="text"
                placeholder="مثال: 123456789"
                value={tgChatId}
                onChange={e => {
                  setTgChatId(e.target.value);
                  localStorage.setItem('caturra_telegram_chat_id', e.target.value.trim());
                }}
                className="form-input"
                style={{ height: '36px', fontSize: '0.82rem', background: '#ffffff', borderRadius: '8px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setShowTgGuide(!showTgGuide)}
                style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '0.76rem', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'underline' }}
              >
                <Info size={14} />
                <span>كيف أحصل على البوت والـ ID مجاناً في 30 ثانية؟</span>
              </button>

              <button
                type="button"
                onClick={handleTestTelegram}
                disabled={!tgToken || !tgChatId || tgTestStatus === 'loading'}
                className="btn btn-primary"
                style={{ background: '#0284c7', borderColor: '#0284c7', fontSize: '0.8rem', padding: '6px 14px' }}
              >
                {tgTestStatus === 'loading' ? 'جاري الإرسال...' : 'إرسال رسالة تجريبية 🚀'}
              </button>
            </div>

            {/* Quick Step Guide */}
            {showTgGuide && (
              <div style={{ background: '#ffffff', padding: '12px', borderRadius: '10px', fontSize: '0.78rem', color: '#334155', lineHeight: '1.6', border: '1px solid #bae6fd', marginTop: '8px' }}>
                <div style={{ fontWeight: '800', color: '#0284c7', marginBottom: '6px' }}>خطوات الربط المجانية في دقيقة واحدة:</div>
                <ol style={{ paddingRight: '18px', margin: 0 }}>
                  <li>افتح تطبيق تلجرام وابحث عن بوت: <strong>@BotFather</strong></li>
                  <li>أرسل له أمر <code>/newbot</code> واختر اسماً لبوتك ليمنحك الـ <strong>API Token</strong> مباشرة.</li>
                  <li>لمعرفة رقم الـ Chat ID الخاص بك، ابحث في تلجرام عن <strong>@userinfobot</strong> واضغط Start سيعطيك رقم الـ ID فوراً.</li>
                  <li>الصق الكودين هنا واضغط "إرسال رسالة تجريبية" لتصلك الإشعارات على موبايلك دائماً!</li>
                </ol>
              </div>
            )}

            {tgTestStatus === 'success' && (
              <div style={{ background: '#dcfce7', color: '#166534', padding: '8px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700' }}>
                🎉 تم إرسال رسالة تجريبية بنجاح إلى هاتفك على تلجرام! تفقد تطبيق تلجرام الآن.
              </div>
            )}

            {tgTestStatus === 'error' && (
              <div style={{ background: '#fee2e2', color: '#991b1b', padding: '8px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: '700' }}>
                ❌ تعذر الإرسال. تأكد من صحة التوكن والـ Chat ID، وأنك قمت بالضغط على زر Start في المحادثة مع بوتك في تلجرام أولاً.
              </div>
            )}
          </div>
        </div>

        {/* Section 4: iOS Home Screen Tip */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', background: 'var(--mint-50)', padding: '12px 14px', borderRadius: '12px', border: '1px solid var(--border-mint)' }}>
          <Sparkles size={18} color="var(--mint-700)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: '0.78rem', color: 'var(--mint-900)', lineHeight: '1.5' }}>
            <strong>نصيحة لمستخدمي هواتف iPhone (iOS):</strong>
            <div>
              لأفضل تجربة إشعارات على شاشة القفل، افتح الموقع في متصفح Safari، ثم اضغط زر المشاركة ⎋ واختر <strong>"إضافة إلى الشاشة الرئيسية (Add to Home Screen)"</strong> ليعمل المتجر كتطبيق أصلي على هاتفك!
            </div>
          </div>
        </div>

        {/* Bottom Done Button */}
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={() => {
              handleSaveTelegram();
              onClose();
            }}
            className="btn btn-primary"
            style={{ width: '100%', padding: '10px', fontSize: '0.95rem', fontWeight: '800' }}
          >
            حفظ الإعدادات وإغلاق النافذة
          </button>
        </div>
      </div>
    </div>
  );
};
