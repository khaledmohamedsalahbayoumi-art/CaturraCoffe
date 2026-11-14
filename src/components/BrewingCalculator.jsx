import React, { useState } from 'react';
import {
  Coffee,
  Droplets,
  Flame,
  Clock,
  Sliders,
  Send,
  Copy,
  Check,
  Sparkles,
  Info
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { playNotificationSound } from '../utils/notifications';

const BREW_METHODS = [
  {
    id: 'v60',
    name: { ar: 'V60 / فلتر', en: 'V60 / Pour-over' },
    icon: '🏺',
    defaultRatio: 15,
    defaultCoffee: 18,
    temp: { ar: '91° - 93° مئوية', en: '91° - 93° C' },
    grind: { ar: 'متوسط خشن (أقرب لرمل البحر)', en: 'Medium-coarse (sea sand consistency)' },
    time: { ar: '2:30 - 2:50 دقيقة', en: '2:30 - 2:50 mins' },
    description: {
      ar: 'يبرز الإيحاءات العطرية والفاكهية بنقاء فائق وقوام خفيف إلى متوسط.',
      en: 'Highlights floral and fruity notes with high clarity and light to medium body.'
    }
  },
  {
    id: 'chemex',
    name: { ar: 'كيمكس (Chemex)', en: 'Chemex' },
    icon: '⚗️',
    defaultRatio: 16,
    defaultCoffee: 25,
    temp: { ar: '92° - 94° مئوية', en: '92° - 94° C' },
    grind: { ar: 'خشن متوسط متناسق', en: 'Medium-coarse consistent' },
    time: { ar: '3:30 - 4:15 دقيقة', en: '3:30 - 4:15 mins' },
    description: {
      ar: 'فلاتر سميكة تمنح كوباً فائق النقاء وخالياً تماماً من الرواسب والزيوت.',
      en: 'Thick filters produce an ultra-clean cup free of sediment and oils.'
    }
  },
  {
    id: 'aeropress',
    name: { ar: 'إيروبرس (Aeropress)', en: 'Aeropress' },
    icon: '🧪',
    defaultRatio: 13,
    defaultCoffee: 15,
    temp: { ar: '85° - 88° مئوية', en: '85° - 88° C' },
    grind: { ar: 'متوسط ناعم (أخشن قليلاً من الإسبريسو)', en: 'Medium-fine (slightly coarser than espresso)' },
    time: { ar: '1:30 - 2:00 دقيقة', en: '1:30 - 2:00 mins' },
    description: {
      ar: 'قوام غني ونكهات مركزة مع حمضية ناعمة جداً وسرعة استخلاص مذهلة.',
      en: 'Rich body and concentrated flavors with very smooth acidity and fast brew.'
    }
  },
  {
    id: 'frenchpress',
    name: { ar: 'فرينش بريس (French Press)', en: 'French Press' },
    icon: '🫖',
    defaultRatio: 14,
    defaultCoffee: 20,
    temp: { ar: '93° - 95° مئوية', en: '93° - 95° C' },
    grind: { ar: 'خشن (مثل ملح البحر الخشن)', en: 'Coarse (coarse sea salt texture)' },
    time: { ar: '4:00 دقائق نقع', en: '4:00 mins steep' },
    description: {
      ar: 'طريقة نقع كامل تمنح قواماً ثقيلاً ممتلئاً بنكهات الشوكولاتة والمكسرات.',
      en: 'Full immersion brewing delivering a heavy body loaded with chocolate & nutty flavors.'
    }
  },
  {
    id: 'espresso',
    name: { ar: 'إسبريسو (Espresso)', en: 'Espresso' },
    icon: '⚡',
    defaultRatio: 2,
    defaultCoffee: 18,
    temp: { ar: '92° - 94° مئوية', en: '92° - 94° C' },
    grind: { ar: 'ناعم جداً ومضغوط بمكبس (Tamper)', en: 'Fine & tamped (espresso grind)' },
    time: { ar: '25 - 30 ثانية', en: '25 - 30 seconds' },
    description: {
      ar: 'مستخلص مكثف بضغط 9 بار مع كريما ذهبية غنية، أساس اللاتيه والكابتشينو.',
      en: 'Concentrated 9-bar shot with thick golden crema, the base for latte and cappuccino.'
    }
  },
  {
    id: 'coldbrew',
    name: { ar: 'كولد برو (Cold Brew)', en: 'Cold Brew' },
    icon: '🧊',
    defaultRatio: 8,
    defaultCoffee: 50,
    temp: { ar: 'ماء بارد أو حرارة الغرفة', en: 'Cold water or room temp' },
    grind: { ar: 'خشن جداً', en: 'Extra coarse' },
    time: { ar: '16 - 24 ساعة نقع بالثلاجة', en: '16 - 24 hours in fridge' },
    description: {
      ar: 'استخلاص بطيء على البارد ينتج قهوة منخفضة الحمضية وحلاوة طبيعية عالية.',
      en: 'Slow cold immersion yielding ultra-low acidity and high natural sweetness.'
    }
  },
  {
    id: 'turkish',
    name: { ar: 'قهوة تركي (كنكة)', en: 'Turkish Coffee (Cezve)' },
    icon: '🏺',
    defaultRatio: 10,
    defaultCoffee: 10,
    temp: { ar: 'تسخين هادئ على نار خفيفة', en: 'Gentle low heat' },
    grind: { ar: 'فائق النعومة (بودرة كالدقيق)', en: 'Extra-fine powder (flour texture)' },
    time: { ar: '2:00 - 3:00 دقائق حتى تكوين الوش', en: '2:00 - 3:00 mins until crema forms' },
    description: {
      ar: 'القهوة الكلاسيكية بوجه غني وقوام ثقيل ومذاق فواح.',
      en: 'Classic method with rich foam, full body, and aromatic taste.'
    }
  }
];

export const BrewingCalculator = ({ onSendRecipeToChat }) => {
  const { language = 'ar', isRtl = true } = useApp();
  const isEn = language === 'en';

  const [selectedMethodId, setSelectedMethodId] = useState('v60');
  const method = BREW_METHODS.find(m => m.id === selectedMethodId) || BREW_METHODS[0];

  const methodName = typeof method.name === 'object' ? (method.name[language] || method.name.ar) : method.name;
  const methodTemp = typeof method.temp === 'object' ? (method.temp[language] || method.temp.ar) : method.temp;
  const methodGrind = typeof method.grind === 'object' ? (method.grind[language] || method.grind.ar) : method.grind;
  const methodTime = typeof method.time === 'object' ? (method.time[language] || method.time.ar) : method.time;

  const [coffeeGrams, setCoffeeGrams] = useState(method.defaultCoffee);
  const [ratio, setRatio] = useState(method.defaultRatio);
  const [copied, setCopied] = useState(false);

  // When method changes, sync defaults
  const handleSelectMethod = (mId) => {
    const found = BREW_METHODS.find(m => m.id === mId) || BREW_METHODS[0];
    setSelectedMethodId(mId);
    setRatio(found.defaultRatio);
    setCoffeeGrams(found.defaultCoffee);
  };

  // Water amount = coffee * ratio
  const totalWater = Math.round(coffeeGrams * ratio);

  // Cup presets (approx 250ml per cup)
  const handleSetCups = (cupsCount) => {
    const targetWater = cupsCount * (method.id === 'espresso' ? 40 : 250);
    const calculatedCoffee = Math.round((targetWater / ratio) * 10) / 10;
    setCoffeeGrams(calculatedCoffee);
  };

  // Pouring schedule breakdown
  const bloomWater = method.id === 'v60' || method.id === 'chemex' ? Math.round(coffeeGrams * 2.5) : 0;
  const remainingWater = totalWater - bloomWater;
  const pour1 = Math.round(remainingWater / 2);
  const pour2 = remainingWater - pour1;

  const generateRecipeSummaryText = () => {
    let stepsText = '';
    if (method.id === 'v60' || method.id === 'chemex') {
      stepsText = isEn ? `
💧 **Pouring Schedule:**
1. **Blooming:** Pour ${bloomWater} ml and wait 40 seconds.
2. **Pour 1:** Gentle spiral pour up to ${bloomWater + pour1} ml.
3. **Pour 2:** Steady center pour up to final weight (${totalWater} ml).` : `
💧 **خطوات الصب:**
1. **الترطيب (Blooming):** صب ${bloomWater} مل ماء وانتظر 40 ثانية.
2. **الصبة الأولى:** صب حركة دائرية هادئة حتى ${bloomWater + pour1} مل.
3. **الصبة الثانية:** صب بهدوء حتى الوصول للوزن النهائي (${totalWater} مل).`;
    }

    if (isEn) {
      return `📖 **Custom ${methodName} Recipe by Caturra:**
- ⚖️ **Coffee Dose:** ${coffeeGrams} g
- 💧 **Total Water:** ${totalWater} ml
- 🎯 **Ratio:** 1:${ratio}
- 🌡️ **Water Temp:** ${methodTemp}
- ⚙️ **Grind Size:** ${methodGrind}
- ⏱️ **Estimated Time:** ${methodTime}${stepsText}
✨ *Enjoy your balanced & fragrant cup of specialty coffee!* ✨`;
    }

    return `📖 **وصفة استخلاص ${methodName} المخصصة من كاتورا:**
- ⚖️ **كمية البن:** ${coffeeGrams} جرام
- 💧 **كمية الماء الكلية:** ${totalWater} مل
- 🎯 **النسبة (Ratio):** 1:${ratio}
- 🌡️ **درجة حرارة الماء:** ${methodTemp}
- ⚙️ **درجة الطحن:** ${methodGrind}
- ⏱️ **الوقت المقدر:** ${methodTime}${stepsText}
✨ *استمتع بكوب قهوة مختصة متوازن وفواح!* ✨`;
  };

  const handleCopyRecipe = () => {
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(generateRecipeSummaryText());
      }
      setCopied(true);
      playNotificationSound();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSendToChat = () => {
    if (onSendRecipeToChat) {
      onSendRecipeToChat(generateRecipeSummaryText());
      playNotificationSound();
    }
  };

  return (
    <div className="store-brewing-calc" style={{ padding: '14px', color: '#4A3220', fontSize: '0.86rem', direction: isRtl ? 'rtl' : 'ltr' }}>
      
      {/* 1. Method Selector Carousel */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontSize: '0.78rem', color: '#96663B', fontWeight: '800', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          <Coffee size={14} />
          <span>{isEn ? 'Select Brew Method:' : 'اختر أداة التحضير:'}</span>
        </div>
        <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '6px', scrollbarWidth: 'none' }}>
          {BREW_METHODS.map(m => {
            const isSelected = m.id === selectedMethodId;
            const itemMethodName = typeof m.name === 'object' ? (m.name[language] || m.name.ar) : m.name;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => handleSelectMethod(m.id)}
                style={{
                  background: isSelected ? 'linear-gradient(135deg, #96663B 0%, #7A5230 100%)' : '#FFF8EE',
                  border: isSelected ? '1.5px solid #EDD9BD' : '1px solid #EDD9BD',
                  color: isSelected ? '#ffffff' : '#4A3220',
                  padding: '7px 12px',
                  borderRadius: '10px',
                  fontSize: '0.76rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                  boxShadow: isSelected ? '0 3px 10px rgba(150, 102, 59, 0.3)' : 'none'
                }}
              >
                <span>{m.icon}</span>
                <span>{itemMethodName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Cup Presets */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', background: '#FFF8EE', padding: '8px 12px', borderRadius: '10px', border: '1px solid #EDD9BD' }}>
        <span style={{ fontSize: '0.76rem', color: '#8A654C', fontWeight: '700' }}>
          {isEn ? 'Cup Presets:' : 'أكواب جاهزة:'}
        </span>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[1, 2, 3].map(cups => (
            <button
              key={cups}
              type="button"
              onClick={() => handleSetCups(cups)}
              style={{
                background: '#FFFDF9',
                border: '1px solid #EDD9BD',
                color: '#4A3220',
                padding: '3px 10px',
                borderRadius: '6px',
                fontSize: '0.74rem',
                fontWeight: '800',
                cursor: 'pointer'
              }}
            >
              {isEn ? `${cups} ${cups === 1 ? 'Cup' : 'Cups'}` : (cups === 1 ? '1 كوب' : cups === 2 ? 'كوبين' : `${cups} أكواب`)}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Interactive Dose & Ratio Sliders */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
        
        {/* Coffee Dose Input */}
        <div style={{ background: '#FFFDF9', padding: '10px', borderRadius: '12px', border: '1px solid #EDD9BD' }}>
          <label style={{ display: 'block', fontSize: '0.74rem', color: '#96663B', fontWeight: '800', marginBottom: '4px' }}>
            {isEn ? '⚖️ Coffee Dose (g):' : '⚖️ وزن البن (جرام):'}
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              type="number"
              min="5"
              max="200"
              step="0.5"
              value={coffeeGrams}
              onChange={(e) => setCoffeeGrams(Math.max(1, parseFloat(e.target.value) || 1))}
              style={{
                width: '100%',
                background: '#FFF8EE',
                border: '1.5px solid #EDD9BD',
                color: '#4A3220',
                padding: '6px 8px',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '900',
                textAlign: 'center'
              }}
            />
            <span style={{ fontSize: '0.78rem', color: '#8A654C', fontWeight: '700' }}>
              {isEn ? 'g' : 'ج'}
            </span>
          </div>
        </div>

        {/* Target Ratio Input */}
        <div style={{ background: '#FFFDF9', padding: '10px', borderRadius: '12px', border: '1px solid #EDD9BD' }}>
          <label style={{ display: 'block', fontSize: '0.74rem', color: '#96663B', fontWeight: '800', marginBottom: '4px' }}>
            {isEn ? '🎯 Brew Ratio:' : '🎯 النسبة (Ratio):'}
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: '800', color: '#8A654C' }}>1 :</span>
            <input
              type="number"
              min="1"
              max="25"
              step="1"
              value={ratio}
              onChange={(e) => setRatio(Math.max(1, parseFloat(e.target.value) || 1))}
              style={{
                width: '100%',
                background: '#FFF8EE',
                border: '1.5px solid #EDD9BD',
                color: '#4A3220',
                padding: '6px 8px',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '900',
                textAlign: 'center'
              }}
            />
          </div>
        </div>

      </div>

      {/* 4. Calculated Outputs Dashboard */}
      <div style={{
        background: '#FFF8EE',
        border: '1.5px solid #EDD9BD',
        borderRadius: '14px',
        padding: '12px',
        marginBottom: '14px',
        boxShadow: 'var(--h-shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px dashed #EDD9BD', paddingBottom: '8px', marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#2f5675', fontWeight: '800' }}>
            <Droplets size={16} />
            <span>{isEn ? 'Required Water:' : 'كمية الماء المطلوبة:'}</span>
          </div>
          <span style={{ fontSize: '1.15rem', fontWeight: '900', color: '#2f5675' }}>
            {isEn ? `${totalWater} ml (g)` : `${totalWater} مل (g)`}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.78rem' }}>
          <div>
            <span style={{ color: '#8A654C' }}>{isEn ? '🌡️ Water Temp: ' : '🌡️ حرارة الماء: '}</span>
            <strong style={{ color: '#4A3220' }}>{methodTemp}</strong>
          </div>
          <div>
            <span style={{ color: '#8A654C' }}>{isEn ? '⏱️ Brew Time: ' : '⏱️ الوقت: '}</span>
            <strong style={{ color: '#4A3220' }}>{methodTime}</strong>
          </div>
        </div>

        <div style={{ fontSize: '0.78rem', marginTop: '6px' }}>
          <span style={{ color: '#8A654C' }}>{isEn ? '⚙️ Grind Size: ' : '⚙️ درجة الطحن: '}</span>
          <strong style={{ color: '#96663B' }}>{methodGrind}</strong>
        </div>

        {/* V60 / Chemex Pour steps breakdown */}
        {(method.id === 'v60' || method.id === 'chemex') && (
          <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #EDD9BD', fontSize: '0.76rem', color: '#5C3D2E' }}>
            <div style={{ fontWeight: '800', color: '#96663B', marginBottom: '4px' }}>
              {isEn ? '📋 Pouring Schedule:' : '📋 تسلسل الصب:'}
            </div>
            <div>
              • {isEn ? `Bloom: ` : `ترطيب: `}
              <strong>{bloomWater} {isEn ? 'ml' : 'مل'}</strong> {isEn ? '(wait 40s)' : '(انتظر 40 ثانية)'}
            </div>
            <div>
              • {isEn ? `Pour 1: up to ` : `صبة 1: حتى `}
              <strong>{bloomWater + pour1} {isEn ? 'ml' : 'مل'}</strong>
            </div>
            <div>
              • {isEn ? `Pour 2: up to final ` : `صبة 2: حتى `}
              <strong>{totalWater} {isEn ? 'ml' : 'مل'}</strong>
            </div>
          </div>
        )}
      </div>

      {/* 5. Action Buttons */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="button"
          onClick={handleSendToChat}
          style={{
            flex: 1,
            background: 'linear-gradient(135deg, #96663B 0%, #7A5230 100%)',
            border: 'none',
            color: '#ffffff',
            padding: '9px 12px',
            borderRadius: '10px',
            fontSize: '0.78rem',
            fontWeight: '800',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            boxShadow: '0 3px 10px rgba(150, 102, 59, 0.25)'
          }}
        >
          <Send size={14} style={{ transform: isRtl ? 'rotate(180deg)' : 'none' }} />
          <span>{isEn ? 'Send Recipe to Chat' : 'إرسال الوصفة للشات'}</span>
        </button>

        <button
          type="button"
          onClick={handleCopyRecipe}
          style={{
            background: '#FFFDF9',
            border: '1.5px solid #EDD9BD',
            color: '#4A3220',
            padding: '9px 12px',
            borderRadius: '10px',
            fontSize: '0.78rem',
            fontWeight: '700',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
          title={isEn ? 'Copy recipe to clipboard' : 'نسخ الوصفة للحافظة'}
        >
          {copied ? <Check size={14} color="#5B8C5A" /> : <Copy size={14} />}
          <span>{copied ? (isEn ? 'Copied!' : 'تم النسخ') : (isEn ? 'Copy' : 'نسخ')}</span>
        </button>
      </div>

    </div>
  );
};
