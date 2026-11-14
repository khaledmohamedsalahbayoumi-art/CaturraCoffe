import React, { useState } from 'react';
import { 
  Sparkles, 
  Flame, 
  Copy, 
  Check, 
  Coffee, 
  Truck, 
  Tag, 
  Percent, 
  ExternalLink
} from 'lucide-react';
import { playNotificationSound, vibratePhone } from '../utils/notifications';

export const TvOffersTicker = ({
  contactInfo,
  onActionClick,
  onDismiss,
  language = 'ar'
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  if (contactInfo?.bannerEnabled === false) {
    return null;
  }

  const isEn = language === 'en';
  const promoCode = (contactInfo?.promoCode || 'CATURRA10').toUpperCase();
  const promoPercent = Number(contactInfo?.promoDiscountPercent || 10);

  const handleCopyCode = (e, code = promoCode) => {
    e.stopPropagation();
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(code);
      }
      setCopiedCode(code);
      playNotificationSound();
      vibratePhone([80, 50, 80]);
      setTimeout(() => setCopiedCode(null), 2500);
    } catch {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2500);
    }
  };

  const theme = contactInfo?.bannerTheme || 'gold';
  const badgeText = isEn
    ? (contactInfo?.bannerBadgeEn || 'Caturra Exclusive Offers 🔥')
    : (contactInfo?.bannerBadge || 'عروض كاتورا الحصرية 🔥');

  const mainAnnouncement = isEn
    ? (contactInfo?.bannerTextEn || '🚚 Fast nationwide shipping across Egypt in 24-48 hrs | Fresh artisan coffee beans micro-roasted daily ✨')
    : (contactInfo?.bannerText || '🚚 شحن سريع لكافة المحافظات خلال 24-48 ساعة | حبوب بن طازجة محمصة بحرفية عالية ✨');

  const actionText = isEn
    ? (contactInfo?.bannerLinkTextEn || 'Browse Lots & Gear')
    : (contactInfo?.bannerLinkText || 'تصفح المحاصيل');

  // Array of items to scroll in the TV news ticker
  const tickerItems = [
    {
      id: 'main-announcement',
      icon: <Sparkles size={14} className="tv-ticker-item-icon" />,
      text: mainAnnouncement,
      isPrimary: true
    },
    {
      id: 'promo-code',
      icon: <Percent size={14} className="tv-ticker-item-icon" />,
      text: (
        <span>
          {isEn ? `Extra ${promoPercent}% Off Code: ` : `كود خصم ${promoPercent}% إضافي: `}
          <button
            type="button"
            onClick={(e) => handleCopyCode(e, promoCode)}
            className="tv-ticker-code-btn"
            title={isEn ? 'Click to copy promo code' : 'انقر لنسخ الكود'}
          >
            {promoCode}
            {copiedCode === promoCode ? (
              <span className="tv-ticker-copied-tag">
                <Check size={11} strokeWidth={3} /> {isEn ? 'Copied' : 'تم النسخ'}
              </span>
            ) : (
              <Copy size={11} />
            )}
          </button>
        </span>
      )
    },
    {
      id: 'fresh-roast',
      icon: <Flame size={14} className="tv-ticker-item-icon" />,
      text: isEn
        ? 'Fresh weekly batches micro-roasted to 100% certified specialty standards'
        : 'حمص طازج أسبوعياً بأعلى بروفايلات التحميص العالمية المعتمدة 100%'
    },
    {
      id: 'free-shipping',
      icon: <Truck size={14} className="tv-ticker-item-icon" />,
      text: isEn
        ? 'Free nationwide shipping across Egypt on orders over 500 EGP'
        : 'شحن مجاني لكافة محافظات مصر للطلبات التي تزيد عن 500 جنيه'
    },
    {
      id: 'custom-grind',
      icon: <Coffee size={14} className="tv-ticker-item-icon" />,
      text: isEn
        ? 'Precision weight in grams & complimentary customized grind calibration'
        : 'إمكانية تحديد وزن البن بالجرام ودرجة الطحن مجاناً بدقة متناهية'
    },
    {
      id: 'free-samples',
      icon: <Tag size={14} className="tv-ticker-item-icon" />,
      text: isEn
        ? 'Complimentary tasting samples & special gifts with every coffee gear order'
        : 'عينات بن تجريبية وهدايا خاصة مع كل طلبية أدوات تحضير قهوة'
    }
  ];

  // Repeat items to ensure sequence is wider than any screen (> 3500px) with ZERO gaps
  const fullSequenceItems = [
    ...tickerItems,
    ...tickerItems,
    ...tickerItems
  ];

  return (
    <div 
      className={`store-tv-ticker-container theme-${theme}`}
      role="region"
      aria-label={isEn ? 'Promotional Offers Ticker' : 'شريط العروض الترويجي المتحرك'}
    >
      {/* 🔴 1. LIVE TV BADGE (شارة البث المباشر / العروض التلفزيونية الثابتة على اليمين) */}
      <div className="tv-ticker-badge-zone">
        <span className="tv-ticker-live-beacon" aria-hidden="true">
          <span className="tv-ticker-live-dot"></span>
          <span className="tv-ticker-live-ring"></span>
        </span>
        <span className="tv-ticker-badge-title">
          {badgeText}
        </span>
        <div className="tv-ticker-badge-edge-cut" aria-hidden="true"></div>
      </div>

      {/* 📜 2. CONTINUOUS GAPLESS TICKER TRACK (شريط الأخبار التلفزيوني المتحرك بدون أي فراغات) */}
      <div 
        className={`tv-ticker-viewport ${isPaused ? 'is-paused' : ''}`}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className="tv-ticker-track">
          {/* Sequence A */}
          <div className="tv-ticker-sequence">
            {fullSequenceItems.map((item, idx) => (
              <div 
                key={`seqA-${item.id}-${idx}`} 
                className={`tv-ticker-item ${item.isPrimary ? 'primary-item' : ''}`}
                dir={isEn ? 'ltr' : 'rtl'}
              >
                <span className="tv-ticker-item-bullet" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="tv-ticker-item-text">
                  {item.text}
                </span>
                <span className="tv-ticker-separator" aria-hidden="true">✦</span>
              </div>
            ))}
          </div>

          {/* Sequence B (identical clone for 100% gapless infinite loop) */}
          <div className="tv-ticker-sequence" aria-hidden="true">
            {fullSequenceItems.map((item, idx) => (
              <div 
                key={`seqB-${item.id}-${idx}`} 
                className={`tv-ticker-item ${item.isPrimary ? 'primary-item' : ''}`}
                dir={isEn ? 'ltr' : 'rtl'}
              >
                <span className="tv-ticker-item-bullet" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="tv-ticker-item-text">
                  {item.text}
                </span>
                <span className="tv-ticker-separator" aria-hidden="true">✦</span>
              </div>
            ))}
          </div>
        </div>

        {/* Subtle Fade Masks at edges */}
        <div className="tv-ticker-fade-right" aria-hidden="true"></div>
        <div className="tv-ticker-fade-left" aria-hidden="true"></div>
      </div>

      {/* ⚡ 3. CONTROLS & ACTION ZONE */}
      {actionText && onActionClick && (
        <div className="tv-ticker-actions-zone">
          <button
            type="button"
            onClick={onActionClick}
            className="tv-ticker-cta-btn"
            title={actionText}
          >
            <span>{actionText}</span>
            <span className="tv-ticker-cta-arrow">↓</span>
          </button>
        </div>
      )}
    </div>
  );
};
