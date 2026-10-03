import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Sparkles,
  Send,
  X,
  RotateCcw,
  Coffee,
  HelpCircle,
  Truck,
  CreditCard,
  Scale,
  ShoppingBag,
  ExternalLink,
  ChevronDown,
  MessageCircle,
  Award,
  Flame,
  Check
} from 'lucide-react';

export const StoreAiAssistant = ({
  products = [],
  onSelectProduct,
  isOpen,
  setIsOpen,
  hasCart = false
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const activeIsOpen = isOpen !== undefined ? isOpen : internalIsOpen;
  const toggleOpen = (val) => {
    if (setIsOpen) setIsOpen(val);
    setInternalIsOpen(val);
  };

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'مرحباً بك في كاتورا للقهوة المختصة! ☕✨\nأنا **باريستا كاتورا الذكي (AI)**، خبيرك لاختيار محاصيل البن الفاخرة، درجات الطحن، وأدوات التحضير المناسبة لذوقك. كيف يمكنني مساعدتك اليوم؟',
      products: [],
      time: 'الآن'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [showPromoBadge, setShowPromoBadge] = useState(true);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (activeIsOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
      setHasUnread(false);
    }
  }, [messages, activeIsOpen]);

  // Initial welcome bubble timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowPromoBadge(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  // Quick preset questions for instant answers
  const quickQuestions = [
    { label: '☕ ترشيح بن للـ V60 والفلتر', query: 'اقترح لي أفضل محصول قهوة مناسب للتقطير والـ V60' },
    { label: '🍫 محصول للإسبريسو ومشروبات الحليب', query: 'أفضل بن مناسب للإسبريسو واللاتيه بقوام غني' },
    { label: '⚖️ تحديد الوزن ودرجة الطحن', query: 'كيف أحدد وزن البن ودرجة الطحن عند الشراء؟' },
    { label: '🚚 مدة وتكلفة الشحن والمحافظات', query: 'ما هي مواعيد الشحن وتكلفته لجميع المحافظات؟' },
    { label: '💳 طرق الدفع المتاحة', query: 'ما هي طرق الدفع المتوفرة في المتجر؟' },
    { label: '🎁 أطقم التحضير وبوكسات الهدايا', query: 'أريد أدوات تحضير قهوة أو بوكس تذوق هدية' },
    { label: '📖 وصفة استخلاص V60 المثالية', query: 'ما هي أفضل وصفة ونسب لتحضير قهوة V60 في المنزل؟' }
  ];

  // AI Logic & Knowledge Engine
  const generateAiReply = (userQuery) => {
    const q = userQuery.toLowerCase().trim();

    // 1. V60 & Pour-over Coffee Recommendations
    if (q.includes('v60') || q.includes('تقطير') || q.includes('فلتر') || q.includes('فاكهي') || q.includes('حمضي') || q.includes('يرجاشيفي')) {
      const ethProduct = products.find(p => p.id === 'prod-1') || products.find(p => p.category === 'coffee');
      const v60Tool = products.find(p => p.id === 'prod-3');
      const matched = [ethProduct, v60Tool].filter(Boolean);

      return {
        text: `لتحضير قهوة V60 استثنائية، خياري الأول لك هو **إثيوبيا يرجاشيفي (كبسولة النكهات)**! 🇪🇹✨\n\n- **الإيحاءات:** ياسمين، توت بري، حمضيات ناعمة.\n- **المعالجة:** مجففة تمنح قواماً متوازناً وحلاوة طبيعية.\n- **درجة التحميص:** متوسط خفيف يبرز النكهات الزهرية.\n- **درجة الطحن المقترحة:** طحن متوسط خشن (أقرب لرمل البحر).\n\nكما يتوفر لدينا **طقم تحضير V60 متكامل** مع قمع سيراميك بلون كاتورا الأخضر الفاخر وسيرفر زجاجي وفلاتر!`,
        products: matched
      };
    }

    // 2. Espresso, Latte, & Milk Drinks
    if (q.includes('إسبريسو') || q.includes('اسبريسو') || q.includes('espresso') || q.includes('لاتيه') || q.includes('كابتشينو') || q.includes('حليب') || q.includes('فلات وايت') || q.includes('شوكولاتة') || q.includes('كراميل')) {
      const colProduct = products.find(p => p.id === 'prod-2');
      const blendProduct = products.find(p => p.id === 'prod-5');
      const matched = [blendProduct, colProduct].filter(Boolean);

      return {
        text: `لعشاق الإسبريسو ومشروبات الحليب (لاتيه، فلات وايت)، أنصحك باثنين من أفضل محاصيلنا:\n\n1. **خلطة إسبريسو كاتورا هاوس بليند:** مزيج برازيلي كولومبي إثيوبي بنكهات الشوكولاتة بالحليب والفانيليا، مع كريما ذهبية كثيفة تدوم.\n2. **كولومبيا سوبريمو ويلا:** قوام متماسك، إيحاءات شوكولاتة داكنة ومكسرات محمصة.\n\nتستطيع طلب أي منهما مطحوناً جاهزاً للإسبريسو أو كحبوب كاملة! ☕🍫`,
        products: matched
      };
    }

    // 3. Weight & Grinding Calibration
    if (q.includes('وزن') || q.includes('جرام') || q.includes('كيلو') || q.includes('طحن') || q.includes('مطحون') || q.includes('حبوب')) {
      return {
        text: `في متجر كاتورا، نتيح لك حرية كاملة لتخصيص قهوتك بدقة: ⚖️🫘\n\n1. **تحديد الوزن:**\n- يمكنك اختيار أوزان جاهزة (250 جرام "ربع كيلو"، 300ج، 500ج "نصف كيلو"، أو 1000ج "كيلو").\n- أو كتابة أي وزن مخصص بالجرام كما تحب وسيتم احتساب السعر آلياً بدقة!\n\n2. **اختيار درجة الطحن (مجاناً 100%):**\n- حبوب كاملة (للحفاظ على أقصى درجات النضارة).\n- إسبريسو ناعم.\n- V60 / فلتر متوسط.\n- قهوة تركي فائق النعومة.\n- فرنش برس / كولد برو خشن.\n\nفقط اضغط على المنتج الذي تريده وستظهر لك شاشة المعايرة فوراً!`,
        products: []
      };
    }

    // 4. Shipping, Delivery & Cities
    if (q.includes('شحن') || q.includes('توصيل') || q.includes('وقت') || q.includes('مدة') || q.includes('محافظات') || q.includes('قاهرة') || q.includes('إسكندرية') || q.includes('اسكندرية')) {
      return {
        text: `الشحن والتوصيل في كاتورا سريع ومتاح لجميع محافظات جمهورية مصر العربية 🇪🇬📦:\n\n- **القاهرة والجيزة:** التوصيل خلال 24 إلى 48 ساعة كحد أقصى.\n- **الإسكندرية والوجه البحري والقناة:** التوصيل خلال 2 إلى 3 أيام عمل.\n- **الصعيد وباقي المحافظات:** التوصيل خلال 3 أيام عمل.\n\nيتم تغليف القهوة في أكياس صمام تنفيس ثلاثية الطبقات مفرغة من الهواء لضمان وصولها بنضارة تامة كأنها خرجت للتو من المحمصة!`,
        products: []
      };
    }

    // 5. Payment Methods
    if (q.includes('دفع') || q.includes('طرق الدفع') || q.includes('كاش') || q.includes('إنستاباي') || q.includes('انستاباي') || q.includes('instapay') || q.includes('فيزا') || q.includes('visa') || q.includes('كارت')) {
      return {
        text: `نوفر لك خيارات دفع متعددة وسهلة تناسبك 💳⚡:\n\n1. **الدفع عند الاستلام (كاش):** تدفع لمندوب الشحن عند استلام وتفقد طلبك.\n2. **إنستاباي (InstaPay):** تحويل فوري ومباشر مع تأكيد سريع.\n3. **البطاقات البنكية (فيزا / ماستركارد / ميزة):** دفع إلكتروني آمن ومحمي 100%.\n\nتستطيع اختيار وسيلة الدفع المفضلة في خطوة تأكيد الطلب بنقرة واحدة!`,
        products: []
      };
    }

    // 6. Tools, Grinders & Gift Boxes
    if (q.includes('أداة') || q.includes('أدوات') || q.includes('طقم') || q.includes('مطحنة') || q.includes('سيروب') || q.includes('بوكس') || q.includes('هدية') || q.includes('box')) {
      const toolProds = products.filter(p => p.category === 'tools' || p.category === 'boxes');
      return {
        text: `لدينا تشكيلة ممتازة من أدوات الباريستا وبوكسات التذوق الفاخرة 🎁🛠️:\n\n- **طقم تحضير V60 متكامل:** قمع سيراميك فاخر وسيرفر زجاجي وفلاتر.\n- **مطحنة بن يدوية دقيقة:** بتروس ستانلس ستيل مخروطية 38 مم لطحن متناسق بدون إجهاد.\n- **بوكس تذوق محاصيل كاتورا:** يحتوي على 4 محاصيل عالمية مختارة في تغليف هدية راقٍ.\n\nتصفح منتجات الأدوات أدناه ويمكنك إضافتها مباشرة لسلتك!`,
        products: toolProds.slice(0, 3)
      };
    }

    // 7. V60 Brewing Recipe & Tips
    if (q.includes('طريقة') || q.includes('وصفة') || q.includes('تحضير') || q.includes('استخلاص') || q.includes('حرارة') || q.includes('نسبة')) {
      return {
        text: `إليك وصفة باريستا كاتورا الذهبية لتحضير كوب V60 متوازن ونقي: ☕✨\n\n- **النسبة (Ratio):** 1:15 (18 جرام بن إلى 270 مل ماء).\n- **حرارة الماء:** 90° - 92° مئوية.\n- **خطوات الصب:**\n  1. **الترطيب (Blooming):** صب 45 مل ماء وانتظر 35-40 ثانية لتفتيح مسام القهوة وإطلاق الغازات.\n  2. **الصبة الأولى:** صب بهدوء في حركة دائرية حتى 150 مل.\n  3. **الصبة الثانية والأخيرة:** صب حتى تصل إلى 270 مل.\n  4. **زمن الاستخلاص الكلي:** بين 2:30 و 2:50 دقيقة.\n\nاستمتع بكوب قهوة فواح يبرز كل تفاصيل المحصول!`,
        products: []
      };
    }

    // 8. General search in product inventory by name/origin/notes
    const matches = products.filter(p => 
      p.name.toLowerCase().includes(q) ||
      (p.origin && p.origin.toLowerCase().includes(q)) ||
      (p.notes && p.notes.toLowerCase().includes(q)) ||
      (p.description && p.description.toLowerCase().includes(q))
    );

    if (matches.length > 0) {
      return {
        text: `وجدت لك ${matches.length} منتج يناسب بحثك عن "${userQuery}":\n\nإليك أفضل الخيارات المتوفرة لدينا حالياً مع أسعارها وتفاصيلها. يمكنك الضغط على أي منتج لمعايرته وإضافته لسلتك فوراً!`,
        products: matches.slice(0, 3)
      };
    }

    // 9. Greetings & Polite chat
    if (q.includes('أهلا') || q.includes('اهلا') || q.includes('مرحبا') || q.includes('سلام') || q.includes('صباح') || q.includes('مساء') || q.includes('هاي') || q.includes('ازيك') || q.includes('عامل ايه')) {
      return {
        text: `أهلاً وسهلاً بك في كاتورا للقهوة المختصة! 🌿☕ يسعدني جداً وجودك.\n\nهل تفضل قهوة فلتر وتقطير فاكهية؟ أم تبحث عن محصول إسبريسو كلاسيكي غني بالشوكولاتة والكراميل؟ اسألني وسأرشح لك الأنسب فوراً!`,
        products: products.slice(0, 2)
      };
    }

    // 10. Default Smart Helpful Fallback
    return {
      text: `يسعدني جداً الإجابة على استفسارك! بصفتي باريستا كاتورا الذكي، يمكنني مساعدتك في:\n\n- ترشيح محاصيل البن الأنسب لطريقة تحضيرك (V60، إسبريسو، فرنش برس، تركي).\n- توضيح طرق الشحن للمحافظات ووسائل الدفع المتاحة.\n- شرح خيارات تحديد الوزن الدقيق ودرجات الطحن المجانية.\n\nما هو المحصول أو المشروب المفضل لديك لأساعدك باختياره؟`,
      products: products.slice(0, 2)
    };
  };

  const handleSendMessage = (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Realistic typing delay for AI response
    setTimeout(() => {
      const response = generateAiReply(query);
      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: response.text,
        products: response.products || [],
        time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
      if (!activeIsOpen) setHasUnread(true);
    }, 600);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 1,
        sender: 'bot',
        text: 'تمت إعادة ضبط المحادثة! ☕✨\nأنا باريستا كاتورا الذكي جاهز لمساعدتك في أي استفسار عن منتجاتنا وتوصيات القهوة المختصة.',
        products: [],
        time: 'الآن'
      }
    ]);
  };

  return (
    <>
      {/* 🌟 FLOATING TRIGGER LAUNCHER BUTTON 🌟 */}
      <div
        className="store-ai-launcher"
        style={{
          position: 'fixed',
          bottom: hasCart ? '74px' : '16px',
          left: '16px',
          zIndex: 90,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: '8px',
          transition: 'bottom 200ms ease'
        }}
      >
        {/* PROMO / WELCOME SPEECH BUBBLE (When closed) */}
        {!activeIsOpen && showPromoBadge && (
          <div
            onClick={() => {
              toggleOpen(true);
              setShowPromoBadge(false);
            }}
            style={{
              background: 'linear-gradient(135deg, #013b20 0%, #04884b 100%)',
              color: '#ffffff',
              padding: '8px 12px',
              borderRadius: '14px',
              boxShadow: '0 8px 20px rgba(2, 83, 45, 0.3)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              fontSize: '0.76rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              maxWidth: '220px',
              animation: 'slideUp 300ms ease-out',
              backdropFilter: 'blur(8px)',
              position: 'relative'
            }}
          >
            <div
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Sparkles size={13} style={{ color: '#fed7aa' }} />
            </div>
            <div style={{ lineHeight: '1.3' }}>
              <div style={{ fontSize: '0.66rem', color: 'var(--mint-200)' }}>باريستا كاتورا الذكي (AI)</div>
              <div>محتاج مساعدة في اختيار قهوتك؟ ☕</div>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowPromoBadge(false);
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'rgba(255,255,255,0.7)',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex'
              }}
              title="إغلاق التنبيه"
            >
              <X size={12} />
            </button>

            {/* Bubble arrow pointing down to launcher */}
            <div
              style={{
                position: 'absolute',
                bottom: '-5px',
                left: '22px',
                width: '10px',
                height: '10px',
                background: '#04884b',
                transform: 'rotate(45deg)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.2)',
                borderRight: '1px solid rgba(255, 255, 255, 0.2)'
              }}
            />
          </div>
        )}

        {/* MAIN CIRCULAR / CAPSULE LAUNCHER BUTTON */}
        <button
          onClick={() => {
            toggleOpen(!activeIsOpen);
            setShowPromoBadge(false);
          }}
          style={{
            background: 'linear-gradient(135deg, #02532d 0%, #04884b 60%, #0ab267 100%)',
            color: '#ffffff',
            border: '1.5px solid rgba(255, 255, 255, 0.35)',
            borderRadius: '9999px',
            padding: activeIsOpen ? '8px' : '7px 14px',
            boxShadow: '0 6px 20px rgba(2, 83, 45, 0.35)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: '800',
            fontSize: '0.78rem',
            transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
            transform: activeIsOpen ? 'scale(0.95)' : 'scale(1)'
          }}
          title={activeIsOpen ? 'إغلاق المساعد' : 'تحدث مع باريستا كاتورا الذكي'}
        >
          {activeIsOpen ? (
            <X size={18} />
          ) : (
            <>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Bot size={17} />
                <span
                  style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: '#22cb7c',
                    boxShadow: '0 0 6px #22cb7c',
                    border: '1.5px solid #ffffff'
                  }}
                />
              </div>
              <span>مساعد كاتورا الذكي (AI)</span>
              <Sparkles size={13} style={{ color: '#fed7aa' }} />
            </>
          )}

          {/* Unread indicator */}
          {!activeIsOpen && hasUnread && (
            <span
              style={{
                position: 'absolute',
                top: '-3px',
                right: '-3px',
                background: '#dc2626',
                color: '#ffffff',
                borderRadius: '50%',
                width: '16px',
                height: '16px',
                fontSize: '0.62rem',
                fontWeight: '900',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1.5px solid #ffffff'
              }}
            >
              1
            </span>
          )}
        </button>
      </div>

      {/* 🌟 EXPANDED CHAT DIALOG WINDOW 🌟 */}
      {activeIsOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '68px',
            left: '18px',
            width: 'min(400px, calc(100vw - 32px))',
            height: 'min(580px, calc(100vh - 100px))',
            background: '#ffffff',
            borderRadius: '24px',
            boxShadow: '0 20px 50px rgba(0, 36, 19, 0.3), 0 0 0 1px rgba(4, 136, 75, 0.25)',
            zIndex: 95,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'slideUp 250ms cubic-bezier(0.16, 1, 0.3, 1)',
            border: '1px solid var(--border-mint)'
          }}
        >
          {/* CHAT HEADER */}
          <div
            style={{
              background: 'linear-gradient(135deg, #013b20 0%, #02532d 50%, #04884b 100%)',
              color: '#ffffff',
              padding: '16px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.15)',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '14px',
                  background: 'rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(8px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1.5px solid rgba(255, 255, 255, 0.3)',
                  position: 'relative',
                  flexShrink: 0
                }}
              >
                <Bot size={24} style={{ color: '#ffffff' }} />
                <span
                  style={{
                    position: 'absolute',
                    bottom: '-2px',
                    left: '-2px',
                    width: '11px',
                    height: '11px',
                    borderRadius: '50%',
                    background: '#22cb7c',
                    boxShadow: '0 0 10px #22cb7c',
                    border: '2px solid #013b20'
                  }}
                  title="متصل الآن"
                />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '900', color: '#ffffff' }}>
                    باريستا كاتورا الذكي
                  </h4>
                  <span
                    style={{
                      background: 'rgba(34, 203, 124, 0.25)',
                      color: '#96ecc0',
                      border: '1px solid rgba(34, 203, 124, 0.4)',
                      padding: '2px 7px',
                      borderRadius: '9999px',
                      fontSize: '0.66rem',
                      fontWeight: '800'
                    }}
                  >
                    AI Agent
                  </span>
                </div>
                <div style={{ fontSize: '0.74rem', color: 'rgba(255, 255, 255, 0.8)', marginTop: '2px' }}>
                  خبير القهوة المختصة والمساعد الفوري
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {/* Reset Chat button */}
              <button
                onClick={handleResetChat}
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  border: 'none',
                  color: '#ffffff',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 150ms'
                }}
                title="إعادة ضبط المحادثة"
              >
                <RotateCcw size={16} />
              </button>

              {/* Close / Minimize button */}
              <button
                onClick={() => toggleOpen(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  border: 'none',
                  color: '#ffffff',
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'background 150ms'
                }}
                title="تصغير"
              >
                <ChevronDown size={18} />
              </button>
            </div>
          </div>

          {/* CHAT MESSAGES CONTAINER */}
          <div
            style={{
              flex: 1,
              padding: '16px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              background: '#f8faf9'
            }}
          >
            {messages.map(msg => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  gap: '4px'
                }}
              >
                {/* Bubble */}
                <div
                  style={{
                    maxWidth: '88%',
                    padding: '12px 16px',
                    borderRadius: msg.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    background: msg.sender === 'user'
                      ? 'linear-gradient(135deg, var(--mint-600) 0%, var(--mint-700) 100%)'
                      : '#ffffff',
                    color: msg.sender === 'user' ? '#ffffff' : 'var(--text-main)',
                    boxShadow: msg.sender === 'user'
                      ? '0 3px 12px rgba(4, 136, 75, 0.25)'
                      : '0 2px 8px rgba(0, 0, 0, 0.06)',
                    border: msg.sender === 'user' ? 'none' : '1px solid var(--border-light)',
                    fontSize: '0.88rem',
                    lineHeight: '1.65',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}
                >
                  {/* Markdown-style bold rendering */}
                  {msg.text.split('\n').map((line, i) => (
                    <div key={i} style={{ marginBottom: line === '' ? '8px' : '2px' }}>
                      {line.split('**').map((part, pIdx) =>
                        pIdx % 2 === 1 ? (
                          <strong key={pIdx} style={{ color: msg.sender === 'user' ? '#ffffff' : 'var(--mint-800)' }}>
                            {part}
                          </strong>
                        ) : (
                          part
                        )
                      )}
                    </div>
                  ))}

                  {/* RECOMMENDED PRODUCTS PREVIEW CARDS */}
                  {msg.products && msg.products.length > 0 && (
                    <div
                      style={{
                        marginTop: '12px',
                        paddingTop: '10px',
                        borderTop: '1px dashed var(--border-mint)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
                      }}
                    >
                      <div
                        style={{
                          fontSize: '0.76rem',
                          fontWeight: '800',
                          color: 'var(--mint-700)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        <Sparkles size={13} />
                        <span>ترشيحات فورية من المتجر:</span>
                      </div>

                      {msg.products.map(prod => (
                        <div
                          key={prod.id}
                          style={{
                            background: '#ffffff',
                            borderRadius: '12px',
                            padding: '10px',
                            border: '1px solid var(--border-mint)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '10px',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img
                              src={prod.image || '/caturra_ethiopia.jpg'}
                              alt={prod.name}
                              style={{
                                width: '42px',
                                height: '42px',
                                borderRadius: '8px',
                                objectFit: 'cover',
                                border: '1px solid var(--border-light)'
                              }}
                              onError={(e) => { e.target.src = '/caturra_ethiopia.jpg'; }}
                            />
                            <div>
                              <div style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--mint-950)', lineHeight: '1.3' }}>
                                {prod.name}
                              </div>
                              <div style={{ fontSize: '0.74rem', color: 'var(--mint-600)', fontWeight: '700' }}>
                                {prod.sellingPrice} ج.م {prod.unitType === 'weight' ? '/ 250g' : ''}
                              </div>
                            </div>
                          </div>

                          {onSelectProduct && (
                            <button
                              onClick={() => {
                                onSelectProduct(prod);
                                toggleOpen(false);
                              }}
                              style={{
                                background: 'var(--mint-50)',
                                border: '1px solid var(--mint-400)',
                                color: 'var(--mint-800)',
                                borderRadius: '8px',
                                padding: '6px 10px',
                                fontSize: '0.74rem',
                                fontWeight: '800',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                whiteSpace: 'nowrap',
                                transition: 'all 150ms'
                              }}
                              title="معايرة وإضافة للسلة"
                            >
                              <ShoppingBag size={13} />
                              <span>اطلب الآن</span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Message Timestamp */}
                <span
                  style={{
                    fontSize: '0.68rem',
                    color: 'var(--text-muted)',
                    margin: '0 4px'
                  }}
                >
                  {msg.time}
                </span>
              </div>
            ))}

            {/* TYPING INDICATOR */}
            {isTyping && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px' }}>
                <div
                  style={{
                    background: '#ffffff',
                    padding: '8px 14px',
                    borderRadius: '16px',
                    border: '1px solid var(--border-light)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <Bot size={14} style={{ color: 'var(--mint-600)' }} />
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>باريستا كاتورا يكتب...</span>
                  <div style={{ display: 'flex', gap: '3px', marginLeft: '4px' }}>
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--mint-600)', animation: 'pulseGlow 1s infinite' }} />
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--mint-600)', animation: 'pulseGlow 1s infinite 200ms' }} />
                    <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--mint-600)', animation: 'pulseGlow 1s infinite 400ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* QUICK PROMPT PILLS (CHIPS) */}
          <div
            style={{
              padding: '10px 14px',
              background: '#ffffff',
              borderTop: '1px solid var(--border-light)',
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
              scrollbarWidth: 'none'
            }}
          >
            {quickQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q.query)}
                style={{
                  background: 'var(--mint-50)',
                  border: '1px solid var(--mint-200)',
                  color: 'var(--mint-800)',
                  borderRadius: '9999px',
                  padding: '5px 12px',
                  fontSize: '0.75rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 150ms'
                }}
              >
                {q.label}
              </button>
            ))}
          </div>

          {/* INPUT FORM */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            style={{
              padding: '12px 14px',
              background: '#ffffff',
              borderTop: '1px solid var(--border-mint)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="اسأل باريستا كاتورا عن أي محصول، طريقة تحضير، أو شحن..."
              style={{
                flex: 1,
                padding: '10px 14px',
                borderRadius: '12px',
                border: '1px solid var(--border-light)',
                outline: 'none',
                fontSize: '0.86rem',
                fontFamily: 'inherit',
                background: '#f9fbf9',
                color: 'var(--text-main)'
              }}
            />

            <button
              type="submit"
              disabled={!input.trim()}
              style={{
                background: input.trim()
                  ? 'linear-gradient(135deg, var(--mint-500) 0%, var(--mint-600) 100%)'
                  : 'var(--border-light)',
                color: input.trim() ? '#ffffff' : 'var(--text-muted)',
                border: 'none',
                borderRadius: '12px',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: input.trim() ? 'pointer' : 'default',
                transition: 'all 150ms',
                flexShrink: 0
              }}
              title="إرسال"
            >
              <Send size={18} style={{ transform: 'rotate(180deg)' }} />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
