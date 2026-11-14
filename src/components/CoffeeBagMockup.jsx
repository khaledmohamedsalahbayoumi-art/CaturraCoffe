import React from 'react';

// Country flag and badge mapping helper
export const getCountryMeta = (country = '') => {
  const c = (country || '').toLowerCase().trim();
  if (c.includes('colombia') || c.includes('كولومبيا') || c.includes('كولومبي')) return { flag: '🇨🇴', code: 'COLOMBIA', nameAr: 'كولومبيا', color: '#FCD116', bgImage: '/bags/bag_espresso_landscape.jpg' };
  if (c.includes('ethiopia') || c.includes('إثيوبيا') || c.includes('إثيوبي')) return { flag: '🇪🇹', code: 'ETHIOPIA', nameAr: 'إثيوبيا', color: '#009A44', bgImage: '/caturra_ethiopia.jpg' };
  if (c.includes('brazil') || c.includes('البرازيل') || c.includes('برازيل') || c.includes('برازيلي')) return { flag: '🇧🇷', code: 'BRAZIL', nameAr: 'البرازيل', color: '#009C3B', bgImage: '/bags/bag_espresso_landscape.jpg' };
  if (c.includes('kenya') || c.includes('كينيا') || c.includes('كيني')) return { flag: '🇰🇪', code: 'KENYA', nameAr: 'كينيا', color: '#BB0000', bgImage: '/bags/bag_espresso_landscape.jpg' };
  if (c.includes('guatemala') || c.includes('جواتيمالا')) return { flag: '🇬🇹', code: 'GUATEMALA', nameAr: 'جواتيمالا', color: '#4997D0', bgImage: '/bags/bag_espresso_landscape.jpg' };
  if (c.includes('costa') || c.includes('كوستاريكا')) return { flag: '🇨🇷', code: 'COSTA RICA', nameAr: 'كوستاريكا', color: '#002B7F', bgImage: '/bags/bag_espresso_landscape.jpg' };
  if (c.includes('panama') || c.includes('بنما')) return { flag: '🇵🇦', code: 'PANAMA', nameAr: 'بنما', color: '#D21034', bgImage: '/bags/bag_espresso_landscape.jpg' };
  if (c.includes('jamaica') || c.includes('جامايكا')) return { flag: '🇯🇲', code: 'JAMAICA', nameAr: 'جامايكا', color: '#009B3A', bgImage: '/bags/bag_espresso_landscape.jpg' };
  if (c.includes('indonesia') || c.includes('sumatra') || c.includes('سومطرة')) return { flag: '🇮🇩', code: 'INDONESIA', nameAr: 'إندونيسيا', color: '#CE1126', bgImage: '/bags/bag_espresso_landscape.jpg' };
  if (c.includes('rwanda') || c.includes('رواندا')) return { flag: '🇷🇼', code: 'RWANDA', nameAr: 'رواندا', color: '#00A1DE', bgImage: '/bags/bag_espresso_landscape.jpg' };
  if (c.includes('peru') || c.includes('بيرو')) return { flag: '🇵🇪', code: 'PERU', nameAr: 'بيرو', color: '#D91023', bgImage: '/bags/bag_espresso_landscape.jpg' };
  if (c.includes('yemen') || c.includes('اليمن')) return { flag: '🇾🇪', code: 'YEMEN', nameAr: 'اليمن', color: '#CE1126', bgImage: '/bags/bag_espresso_landscape.jpg' };
  if (c.includes('blend') || c.includes('هاوس') || c.includes('توليفة') || c.includes('تركي') || c.includes('فرنساوي')) return { flag: '☕', code: 'CATURRA BLEND', nameAr: 'توليفة كاتورا', color: '#8B5E34', bgImage: '/bags/bag_espresso_landscape.jpg' };
  return { flag: '☕', code: country.toUpperCase() || 'CATURRA', nameAr: country || 'كاتورا', color: '#8B5E34', bgImage: '/bags/bag_espresso_landscape.jpg' };
};

export const CountryFlagBadge = ({ country = '', size = 11 }) => {
  const meta = getCountryMeta(country);
  const code = (meta.code || '').toUpperCase();
  if (code.includes('COLOMBIA')) {
    return (
      <span style={{ display: 'inline-flex', width: `${size * 1.5}px`, height: `${size}px`, borderRadius: '2px', overflow: 'hidden', border: '0.8px solid rgba(255,255,255,0.4)', verticalAlign: 'middle', flexDirection: 'column', flexShrink: 0 }}>
        <span style={{ height: '50%', background: '#FCD116' }} />
        <span style={{ height: '25%', background: '#003893' }} />
        <span style={{ height: '25%', background: '#CE1126' }} />
      </span>
    );
  }
  if (code.includes('BRAZIL')) {
    return (
      <span style={{ display: 'inline-flex', width: `${size * 1.5}px`, height: `${size}px`, borderRadius: '2px', overflow: 'hidden', border: '0.8px solid rgba(255,255,255,0.4)', verticalAlign: 'middle', background: '#009739', position: 'relative', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ width: `${size * 0.9}px`, height: `${size * 0.6}px`, background: '#FEDD00', transform: 'rotate(45deg)' }} />
        <span style={{ width: `${size * 0.45}px`, height: `${size * 0.45}px`, borderRadius: '50%', background: '#012169', position: 'absolute' }} />
      </span>
    );
  }
  return <span style={{ fontSize: `${size}px`, lineHeight: 1 }}>{meta.flag}</span>;
};

// Precise Vector Line Icons for Green Sticker
const PinIcon = ({ size = 10, color = '#A7F3D0' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const LeafIcon = ({ size = 10, color = '#A7F3D0' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M11 20A7 7 0 0 1 4 13c0-4.4 3.6-8 8-8 1.5 0 2.9.4 4.1 1.1L18 4l2 2-2.1 1.9C18.6 9.1 19 10.5 19 12a7 7 0 0 1-7 7l-1 1z" />
    <path d="M11 20v-7" />
  </svg>
);

const ProcessIcon = ({ size = 10, color = '#A7F3D0' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41" />
  </svg>
);

const CupIcon = ({ size = 10, color = '#A7F3D0' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
    <line x1="6" y1="1" x2="6" y2="4" />
    <line x1="10" y1="1" x2="10" y2="4" />
    <line x1="14" y1="1" x2="14" y2="4" />
  </svg>
);

export const getCountryArtwork = (country = '', fallback = '/bags/bag_espresso_landscape.jpg') => {
  const meta = getCountryMeta(country);
  return meta.bgImage || fallback;
};

// Caturra Logo with dual coffee leaves and red cherry
export const CaturraBrandLogo = ({ size = 'md', light = false }) => {
  const isSm = size === 'sm';
  const isLg = size === 'lg';
  const fontSize = isSm ? '0.95rem' : isLg ? '1.5rem' : '1.18rem';
  const subSize = isSm ? '0.52rem' : isLg ? '0.74rem' : '0.62rem';
  const textColor = light ? '#FFFFFF' : '#231815';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', userSelect: 'none' }}>
      {/* Leaves & Red Cherry Icon */}
      <div style={{ position: 'relative', width: isSm ? '22px' : isLg ? '36px' : '28px', height: isSm ? '14px' : isLg ? '22px' : '18px', marginBottom: '2px' }}>
        <svg viewBox="0 0 36 24" fill="none" style={{ width: '100%', height: '100%' }}>
          {/* Left leaf */}
          <path d="M18 16 C12 12, 4 10, 2 5 C8 4, 15 8, 18 16 Z" fill="#2E5A36" />
          {/* Right leaf */}
          <path d="M18 16 C24 12, 32 10, 34 5 C28 4, 21 8, 18 16 Z" fill="#3D7547" />
          {/* Red coffee cherry */}
          <circle cx="18" cy="18" r="4.5" fill="#C4161C" />
          <circle cx="16.5" cy="16.5" r="1.3" fill="#FFFFFF" opacity="0.6" />
        </svg>
      </div>

      <div style={{
        fontFamily: "'Playfair Display', 'Cinzel', 'Times New Roman', serif",
        fontWeight: '900',
        fontSize,
        letterSpacing: isSm ? '2px' : '3.5px',
        color: textColor,
        lineHeight: 1,
        textTransform: 'uppercase'
      }}>
        CATURRA
      </div>
      <div style={{
        fontFamily: "'Montserrat', 'Inter', sans-serif",
        fontWeight: '700',
        fontSize: subSize,
        letterSpacing: isSm ? '1.5px' : '2.5px',
        color: light ? '#E0E7DE' : '#5C4033',
        textTransform: 'uppercase',
        marginTop: '2px'
      }}>
        SPECIALTY COFFEE
      </div>
    </div>
  );
};

// Coffee Branch Botanical Sketch (Line art)
const BotanicalBranchSketch = ({ color = '#FFFFFF', opacity = 0.85, width = 60, height = 75 }) => (
  <svg width={width} height={height} viewBox="0 0 80 100" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ opacity }}>
    {/* Main stem */}
    <path d="M40 95 C40 60, 42 35, 40 5" />
    {/* Left leaves */}
    <path d="M40 70 C22 68, 12 55, 10 40 C24 45, 34 56, 40 70 Z" fill={color} fillOpacity="0.08" />
    <path d="M40 45 C20 40, 15 25, 18 12 C30 18, 36 30, 40 45 Z" fill={color} fillOpacity="0.08" />
    {/* Right leaves */}
    <path d="M40 60 C58 58, 68 45, 70 30 C56 35, 46 46, 40 60 Z" fill={color} fillOpacity="0.08" />
    <path d="M40 32 C58 28, 65 14, 60 2 C48 8, 44 20, 40 32 Z" fill={color} fillOpacity="0.08" />
    {/* Coffee cherries */}
    <circle cx="37" cy="55" r="4.5" fill={color} fillOpacity="0.3" />
    <circle cx="44" cy="58" r="4" fill={color} fillOpacity="0.3" />
    <circle cx="41" cy="48" r="4" fill={color} fillOpacity="0.3" />
  </svg>
);

// Roast Level Dots Indicator
export const RoastDots = ({ level = 'Medium' }) => {
  const lvl = (level || '').toLowerCase();
  let filled = 3;
  if (lvl.includes('light') && !lvl.includes('medium')) filled = 2;
  else if (lvl.includes('light') && lvl.includes('medium')) filled = 2.5;
  else if (lvl.includes('dark')) filled = 4;
  else if (lvl.includes('medium')) filled = 3;

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
      {[1, 2, 3, 4, 5].map(idx => (
        <span
          key={idx}
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: idx <= filled ? '#2D1810' : idx - 0.5 === filled ? 'linear-gradient(90deg, #2D1810 50%, #D1D5DB 50%)' : '#D1D5DB',
            display: 'inline-block'
          }}
        />
      ))}
    </div>
  );
};

/**
 * ☕ CoffeeBagMockup Component
 * Renders the authentic Caturra Coffee Bag:
 * - 'landscape': For Espresso recommended coffees (Wide pouch, scenic banner on top, cream label + forest green spec card on bottom)
 * - 'vertical': For Filter / Pour-over coffees (Tall standing pouch, green side gusset, central artwork, green badge label)
 */
export const CoffeeBagMockup = ({
  product,
  size = 'md', // 'sm' (card), 'md' (preview), 'lg' (modal zoom)
  forceVariant = null, // 'landscape' | 'vertical' | null (uses product.bagVariant or recommends)
  interactive = false,
  onZoom = null
}) => {
  if (!product) return null;

  // Default to the official Caturra horizontal pouch (the exact bag in the photo) for all coffee products
  const variant = forceVariant || 'landscape';

  const countryName = product.coffeeOrigin?.country || product.country || product.origin || product.nameEn || product.name || '';
  const countryMeta = getCountryMeta(countryName);

  // Variety inference matching roastery catalog
  let variety = product.coffeeOrigin?.variety || product.variety || '';
  if (!variety) {
    if (countryMeta.code === 'COLOMBIA') variety = 'CATURRA';
    else if (countryMeta.code === 'ETHIOPIA') variety = 'HEIRLOOM';
    else if (countryMeta.code === 'BRAZIL') variety = 'BOURBON / CATUAÍ';
    else if (countryMeta.code === 'GUATEMALA') variety = 'BOURBON / CATURRA';
    else if (countryMeta.code === 'COSTA RICA') variety = 'CATURRA / CATUAÍ';
    else if (countryMeta.code === 'PANAMA') variety = 'GEISHA';
    else variety = 'CATURRA SPECIALTY';
  }

  // Process inference
  let process = product.coffeeOrigin?.process || product.process || '';
  if (!process) {
    if (countryMeta.code === 'COLOMBIA') process = 'WASHED';
    else if (countryMeta.code === 'ETHIOPIA') process = 'NATURAL';
    else if (countryMeta.code === 'BRAZIL') process = 'NATURAL';
    else process = 'WASHED';
  }

  const notes = product.sensoryProfile?.flavorNotes || product.tastingNotes || product.notes || product.flavorNotes || 'Citrus, Brown Sugar, Caramel, Balanced';
  const roast = product.roastingProfile?.roastLevel || product.roastLevel || 'Medium Roast';
  const weight = product.weight || '250g';

  // Sizing definitions
  const scale = size === 'xs' ? 0.44 : size === 'card' ? 0.52 : size === 'sm' ? 0.68 : size === 'modal' ? 1.05 : size === 'lg' ? 1.25 : 1;

  // Scenic artwork image
  const customArtwork = product.image && (product.image.startsWith('data:') || product.image.includes('/caturra_') || product.image.includes('/bags/'))
    ? product.image
    : countryMeta.bgImage;

  // ----------------------------------------------------
  // 1. LANDSCAPE BAG (ESPRESSO)
  // ----------------------------------------------------
  if (variant === 'landscape') {
    const width = Math.round(440 * scale);
    const height = Math.round(290 * scale);

    return (
      <div
        onClick={interactive && onZoom ? () => onZoom(product) : undefined}
        style={{
          width: `${width}px`,
          height: `${height}px`,
          borderRadius: `${14 * scale}px`,
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#FAF5ED',
          boxShadow: '0 18px 38px rgba(35, 24, 21, 0.22), 0 4px 12px rgba(0,0,0,0.08)',
          border: '1.5px solid #E6D9C8',
          cursor: interactive ? 'pointer' : 'default',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          userSelect: 'none',
          margin: '0 auto'
        }}
        className="caturra-bag-mockup-landscape"
        title={interactive ? 'اضغط لتكبير ومعاينة تصميم الكيس' : undefined}
      >
        {/* Top Pouch Zipper Seal Bar */}
        <div
          style={{
            height: `${22 * scale}px`,
            background: 'linear-gradient(180deg, #EBE1D2 0%, #D6C8B5 50%, #C7B7A2 100%)',
            borderBottom: '1px solid #B09F8A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: `0 ${12 * scale}px`,
            position: 'relative',
            zIndex: 3
          }}
        >
          {/* Rope loop anchor on left ear */}
          <div
            style={{
              position: 'absolute',
              left: `${-8 * scale}px`,
              top: `${4 * scale}px`,
              width: `${18 * scale}px`,
              height: `${28 * scale}px`,
              borderRadius: '50%',
              border: `${2.5 * scale}px dashed #5C3A21`,
              transform: 'rotate(-25deg)',
              boxShadow: '-1px 2px 4px rgba(0,0,0,0.25)',
              background: 'repeating-linear-gradient(45deg, #4A2E1B, #4A2E1B 3px, #8A6E55 3px, #8A6E55 6px)'
            }}
          />
          {/* Zipper embossed ridge dots */}
          <div style={{ width: '100%', height: '2px', borderTop: '1.5px dotted #8C7A6B', opacity: 0.65 }} />
          {/* Tear notch */}
          <div style={{ position: 'absolute', right: `${10 * scale}px`, width: `${6 * scale}px`, height: `${4 * scale}px`, background: '#A89985', borderRadius: '0 0 3px 3px' }} />
        </div>

        {/* Top Scenic Banner: Mountain Landscape & Coffee Plantation */}
        <div
          style={{
            height: `${125 * scale}px`,
            position: 'relative',
            overflow: 'hidden',
            background: 'linear-gradient(180deg, #D4E4E6 0%, #B8CED2 40%, #769E68 85%, #4F7744 100%)'
          }}
        >
          {/* Backdrop Image if available */}
          <img
            src={customArtwork || '/bags/bag_espresso_landscape.jpg'}
            alt="Caturra Landscape"
            style={{
              width: '100%',
              height: '240%',
              objectFit: 'cover',
              objectPosition: 'top center',
              position: 'absolute',
              top: `-${15 * scale}px`,
              left: 0,
              filter: 'contrast(1.04) saturate(1.06)'
            }}
            onError={(e) => {
              // Fallback to stylized CSS landscape if image fails
              e.currentTarget.style.display = 'none';
            }}
          />

          {/* Subtle gradient vignette to blend with bottom label */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: `${28 * scale}px`,
              background: 'linear-gradient(180deg, transparent 0%, rgba(250, 245, 237, 0.95) 100%)'
            }}
          />
        </div>

        {/* Bottom Section: Warm Cream Textured Panel */}
        <div
          style={{
            flex: 1,
            background: '#FAF5ED',
            padding: `${10 * scale}px ${14 * scale}px`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'relative',
            zIndex: 2
          }}
        >
          {/* Subtle background botanical floral watermark */}
          <div
            style={{
              position: 'absolute',
              left: `${8 * scale}px`,
              bottom: `${4 * scale}px`,
              opacity: 0.05,
              pointerEvents: 'none'
            }}
          >
            <BotanicalBranchSketch color="#2D1810" width={140 * scale} height={140 * scale} />
          </div>

          {/* Left Column: Brand Logo & 100% Arabica Seal */}
          <div style={{ flex: '0 0 42%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', zIndex: 2 }}>
            <div style={{ transform: `scale(${scale * 0.95})`, transformOrigin: 'top left' }}>
              <CaturraBrandLogo size="md" />
            </div>

            {/* Arabic Crop Name if present */}
            {product.name && (
              <div style={{
                fontSize: `${10.5 * scale}px`,
                fontWeight: '900',
                color: '#2C1810',
                margin: `${2 * scale}px 0`,
                lineHeight: 1.25,
                textShadow: '0 1px 2px rgba(255,255,255,0.7)'
              }}>
                {product.name}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: `${6 * scale}px`, marginTop: 'auto', paddingTop: `${4 * scale}px` }}>
              {/* Mountain icon */}
              <svg width={18 * scale} height={16 * scale} viewBox="0 0 24 20" fill="none">
                <path d="M12 2L2 19H22L12 2Z" fill="#1B382B" />
                <path d="M12 2L7 11L12 8L17 11L12 2Z" fill="#FAF5ED" />
              </svg>
              <div style={{ fontSize: `${7.2 * scale}px`, fontWeight: '800', color: '#1B382B', lineHeight: 1.15, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                <div>100% ARABICA CAFÉ</div>
                <div style={{ color: '#6F4E37', fontWeight: '700' }}>SINGLE ORIGIN SPECIALTY</div>
              </div>
            </div>
          </div>

          {/* Right Column: Forest Green Specifications Card (الاستيكر الأخضر المطابق للكيس الحقيقي) */}
          <div
            style={{
              flex: '0 0 56%',
              background: '#11271B',
              borderRadius: `${10 * scale}px`,
              padding: `${8 * scale}px ${10 * scale}px`,
              color: '#FFFFFF',
              boxShadow: '0 8px 20px rgba(10, 24, 16, 0.35)',
              border: '1.2px solid rgba(255, 255, 255, 0.16)',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: `${8 * scale}px`,
              height: '100%',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Left side of Green Sticker: Crisp White Botanical Coffee Branch Sketch */}
            <div style={{ flex: '0 0 28%', display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.95 }}>
              <BotanicalBranchSketch color="#FFFFFF" width={48 * scale} height={92 * scale} opacity={0.92} />
            </div>

            {/* Right side of Green Sticker: Header + Attributes Table */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
              {/* Header: CATURRA SPECIALTY COFFEE */}
              <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.22)', paddingBottom: `${3 * scale}px`, marginBottom: `${3 * scale}px` }}>
                <div style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: `${11 * scale}px`,
                  fontWeight: '900',
                  color: '#FFFFFF',
                  letterSpacing: '1.6px',
                  lineHeight: 1
                }}>
                  CATURRA
                </div>
                <div style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontSize: `${5.8 * scale}px`,
                  fontWeight: '800',
                  color: '#D4AF37',
                  letterSpacing: '2px',
                  textTransform: 'uppercase',
                  marginTop: '1.5px'
                }}>
                  SPECIALTY COFFEE
                </div>
              </div>

              {/* Rows matching exact bag */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: `${3.2 * scale}px`, fontSize: `${7.4 * scale}px`, lineHeight: 1.25 }}>
                {/* 📍 ORIGIN */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: `${3 * scale}px`, fontSize: `${6.8 * scale}px`, fontWeight: '800', color: '#9AE6B4', letterSpacing: '0.4px' }}>
                    <PinIcon size={8.5 * scale} color="#9AE6B4" />
                    <span>ORIGIN</span>
                  </span>
                  <span style={{ fontSize: `${8 * scale}px`, fontWeight: '900', color: '#FFFFFF', display: 'inline-flex', alignItems: 'center', gap: `${4 * scale}px`, textTransform: 'uppercase' }}>
                    <span>{countryMeta.code}</span>
                    <CountryFlagBadge country={countryMeta.code} size={9.5 * scale} />
                  </span>
                </div>

                {/* 🌱 VARIETY */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: `${3 * scale}px`, fontSize: `${6.8 * scale}px`, fontWeight: '800', color: '#9AE6B4', letterSpacing: '0.4px' }}>
                    <LeafIcon size={8.5 * scale} color="#9AE6B4" />
                    <span>VARIETY</span>
                  </span>
                  <span style={{ fontSize: `${7.8 * scale}px`, fontWeight: '800', color: '#FFFFFF', textTransform: 'uppercase' }}>
                    {variety}
                  </span>
                </div>

                {/* ⚙️ PROCESS */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: `${3 * scale}px`, fontSize: `${6.8 * scale}px`, fontWeight: '800', color: '#9AE6B4', letterSpacing: '0.4px' }}>
                    <ProcessIcon size={8.5 * scale} color="#9AE6B4" />
                    <span>PROCESS</span>
                  </span>
                  <span style={{ fontSize: `${7.8 * scale}px`, fontWeight: '900', color: '#FFFFFF', textTransform: 'uppercase' }}>
                    {process}
                  </span>
                </div>

                {/* ☕ TASTING NOTES */}
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: `${4 * scale}px` }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: `${3 * scale}px`, fontSize: `${6.8 * scale}px`, fontWeight: '800', color: '#9AE6B4', letterSpacing: '0.4px', flexShrink: 0 }}>
                    <CupIcon size={8.5 * scale} color="#9AE6B4" />
                    <span>TASTING NOTES</span>
                  </span>
                  <span style={{
                    fontSize: `${7.4 * scale}px`,
                    fontWeight: '700',
                    color: '#F4ECE1',
                    textAlign: 'right',
                    lineHeight: 1.25,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {notes}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Right Net Weight on Cream Bag Face (Just like in the photo) */}
          <div style={{
            position: 'absolute',
            bottom: `${5 * scale}px`,
            right: `${16 * scale}px`,
            fontSize: `${8.5 * scale}px`,
            fontWeight: '800',
            color: '#3B2314',
            letterSpacing: '0.4px',
            fontFamily: "'Montserrat', sans-serif",
            zIndex: 3
          }}>
            {weight.includes('Wt.') ? weight : `Net. Wt. (${weight})`}
          </div>
        </div>

        {/* Realistic Pouch Gloss & Lighting Overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.02) 40%, rgba(0,0,0,0.06) 100%)',
            pointerEvents: 'none',
            borderRadius: `${14 * scale}px`
          }}
        />
      </div>
    );
  }

  // ----------------------------------------------------
  // 2. VERTICAL STAND-UP POUCH (FILTER / POUR OVER)
  // ----------------------------------------------------
  const width = Math.round(290 * scale);
  const height = Math.round(410 * scale);
  const sideWidth = Math.round(42 * scale);

  return (
    <div
      onClick={interactive && onZoom ? () => onZoom(product) : undefined}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        borderRadius: `${12 * scale}px`,
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'row',
        backgroundColor: '#F8F4EC',
        boxShadow: '0 20px 42px rgba(30, 20, 16, 0.24), 0 5px 15px rgba(0,0,0,0.08)',
        border: '1.5px solid #E4D7C5',
        cursor: interactive ? 'pointer' : 'default',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        userSelect: 'none',
        margin: '0 auto'
      }}
      className="caturra-bag-mockup-vertical"
      title={interactive ? 'اضغط لتكبير ومعاينة تصميم الكيس' : undefined}
    >
      {/* Left Folded Gusset: Deep Forest Green with Vertical Typo */}
      <div
        style={{
          width: `${sideWidth}px`,
          background: 'linear-gradient(180deg, #153825 0%, #0F281B 60%, #081B11 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: `${12 * scale}px 0`,
          color: '#FFFFFF',
          borderRight: '1px solid rgba(0,0,0,0.3)',
          boxShadow: 'inset -3px 0 6px rgba(0,0,0,0.25)',
          position: 'relative',
          zIndex: 3
        }}
      >
        <BotanicalBranchSketch color="#6EE7B7" width={28 * scale} height={50 * scale} opacity={0.65} />

        <div
          style={{
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: '900',
            fontSize: `${7.8 * scale}px`,
            letterSpacing: '2px',
            color: '#A7F3D0',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap'
          }}
        >
          GOOD COFFEE BETTER DAYS
        </div>

        {/* Mountain Icon on gusset base */}
        <div style={{ opacity: 0.7 }}>
          <svg width={14 * scale} height={12 * scale} viewBox="0 0 24 20" fill="none">
            <path d="M12 2L2 19H22L12 2Z" fill="#A7F3D0" />
          </svg>
        </div>
      </div>

      {/* Main Front Face of Pouch */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          background: '#FAF6ED',
          position: 'relative'
        }}
      >
        {/* Top Pouch Zipper Seal */}
        <div
          style={{
            height: `${18 * scale}px`,
            background: 'linear-gradient(180deg, #EBE0D0 0%, #D8CABB 50%, #C9B9A6 100%)',
            borderBottom: '1px solid #B5A490',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: `0 ${10 * scale}px`,
            zIndex: 3
          }}
        >
          <div style={{ width: '100%', height: '1.5px', borderTop: '1.5px dotted #8C7A6B', opacity: 0.6 }} />
        </div>

        {/* Top Branding Section */}
        <div style={{ padding: `${8 * scale}px 0 ${6 * scale}px 0`, textAlign: 'center', background: '#FAF6ED', zIndex: 2 }}>
          <div style={{ transform: `scale(${scale * 0.92})`, transformOrigin: 'top center' }}>
            <CaturraBrandLogo size="md" />
          </div>
        </div>

        {/* Central Illustrated Mountain & Coffee Farm Artwork */}
        <div
          style={{
            height: `${135 * scale}px`,
            position: 'relative',
            overflow: 'hidden',
            borderTop: '1px solid #E5D7C5',
            borderBottom: '1px solid #E5D7C5'
          }}
        >
          <img
            src={customArtwork || '/bags/bag_filter_vertical.jpg'}
            alt="Caturra Coffee Farm"
            style={{
              width: '100%',
              height: '190%',
              objectFit: 'cover',
              objectPosition: 'center 40%',
              position: 'absolute',
              top: `-${25 * scale}px`,
              left: 0,
              filter: 'contrast(1.05) saturate(1.08)'
            }}
            onError={(e) => {
              // Fallback to landscape image cropped vertically
              e.currentTarget.src = '/bags/bag_filter_vertical.jpg';
            }}
          />

          {/* Fade transition at bottom */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: `${16 * scale}px`,
              background: 'linear-gradient(180deg, transparent 0%, rgba(250, 246, 237, 0.9) 100%)'
            }}
          />
        </div>

        {/* Bottom Section: Prominent Dark Green Label Badge & Sensory Info */}
        <div
          style={{
            flex: 1,
            background: '#FAF6ED',
            padding: `${8 * scale}px ${12 * scale}px`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            zIndex: 2
          }}
        >
          {/* Central Forest Green Badge */}
          <div
            style={{
              background: 'linear-gradient(135deg, #153825 0%, #0E291B 100%)',
              borderRadius: `${8 * scale}px`,
              padding: `${8 * scale}px ${10 * scale}px`,
              color: '#FFFFFF',
              textAlign: 'center',
              boxShadow: '0 4px 12px rgba(15, 40, 27, 0.22)',
              border: '1px solid rgba(255, 255, 255, 0.12)'
            }}
          >
            <div style={{ fontSize: `${6.8 * scale}px`, letterSpacing: '1.5px', color: '#86EFAC', fontWeight: '800', textTransform: 'uppercase' }}>
              {countryMeta.flag} {countryMeta.code}
            </div>
            {product.name && (
              <div style={{
                fontSize: `${11 * scale}px`,
                fontWeight: '900',
                color: '#FFF8EE',
                marginTop: '2px'
              }}>
                {product.name}
              </div>
            )}
            <h3
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: `${12.5 * scale}px`,
                fontWeight: '900',
                color: '#FFFFFF',
                margin: '1px 0 1px 0',
                letterSpacing: '0.6px',
                lineHeight: 1.2
              }}
            >
              {product.nameEn || product.name}
            </h3>
            <div style={{ fontSize: `${6.8 * scale}px`, letterSpacing: '1px', color: '#D1FAE5', fontWeight: '700', textTransform: 'uppercase', display: 'flex', justifyContent: 'center', gap: '5px', marginTop: '2px' }}>
              <span>{process}</span>
              <span>•</span>
              <span>{variety}</span>
            </div>
          </div>

          {/* Roast Level & Flavor Notes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: `${4 * scale}px`, margin: `${4 * scale}px 0` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: `${7.8 * scale}px`, color: '#374151' }}>
              <span style={{ fontWeight: '800', textTransform: 'uppercase', color: '#1B382B' }}>{roast}</span>
              <RoastDots level={roast} />
            </div>

            <div
              style={{
                fontSize: `${7.6 * scale}px`,
                color: '#4A3427',
                fontWeight: '700',
                lineHeight: 1.3,
                textAlign: 'center',
                background: '#F0E7D8',
                padding: `${4 * scale}px ${6 * scale}px`,
                borderRadius: `${5 * scale}px`,
                border: '1px solid #E2D4C0'
              }}
            >
              ✨ {notes}
            </div>
          </div>

          {/* Bottom Footer Specs */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: `${2 * scale}px`, borderTop: '1px solid #EBDDCB' }}>
            <div style={{ fontSize: `${7 * scale}px`, fontWeight: '800', color: '#1B382B', textTransform: 'uppercase' }}>
              100% ARABICA CAFÉ
            </div>
            <div style={{ fontSize: `${7.5 * scale}px`, fontWeight: '900', color: '#1B382B' }}>
              250g
            </div>
          </div>
        </div>

        {/* Lighting Glare Overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.01) 50%, rgba(0,0,0,0.05) 100%)',
            pointerEvents: 'none'
          }}
        />
      </div>
    </div>
  );
};
