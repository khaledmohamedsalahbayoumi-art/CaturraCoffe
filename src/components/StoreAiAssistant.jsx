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
  Check,
  Calculator,
  Search,
  Package,
  Clock,
  MapPin,
  ChevronRight,
  Zap
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { askGeminiBarista } from '../utils/geminiAi';
import { BrewingCalculator } from './BrewingCalculator';
import { playNotificationSound, vibratePhone } from '../utils/notifications';

export const StoreAiAssistant = ({
  products = [],
  onSelectProduct,
  isOpen,
  setIsOpen,
  hasCart = false
}) => {
  const {
    invoices = [],
    contactInfo,
    openTrackingModal,
    openInvoiceModal,
    language = 'ar',
    isRtl = true,
    formatPrice
  } = useApp();

  const isEn = language === 'en';

  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const activeIsOpen = isOpen !== undefined ? isOpen : internalIsOpen;
  const toggleOpen = (val) => {
    if (setIsOpen) setIsOpen(val);
    setInternalIsOpen(val);
  };

  // Active view inside the assistant: 'chat' | 'calculator'
  const [activeTab, setActiveTab] = useState('chat');

  const [messages, setMessages] = useState(() => [
    {
      id: 1,
      sender: 'bot',
      text: language === 'en'
        ? 'Welcome to Caturra Specialty Coffee! ✨🌿\nI am **Caturra AI Barista**, your guide to exceptional beans, brew ratio calculations, and order tracking. How can I assist you today?'
        : 'مرحباً بك في كاتورا للقهوة المختصة! ✨🌿\nأنا **باريستا كاتورا الذكي (AI)**، خبيرك لاختيار محاصيل البن الفاخرة، حساب نسب الاستخلاص، ومتابعة شحناتك. كيف يمكنني مساعدتك اليوم؟',
      products: [],
      invoice: null,
      time: language === 'en' ? 'Now' : 'الآن'
    }
  ]);

  // Synchronize initial welcome message when switching language
  useEffect(() => {
    setMessages(prev => {
      if (prev.length === 1 && prev[0].id === 1) {
        return [
          {
            id: 1,
            sender: 'bot',
            text: isEn
              ? 'Welcome to Caturra Specialty Coffee! ✨🌿\nI am **Caturra AI Barista**, your guide to exceptional beans, brew ratio calculations, and order tracking. How can I assist you today?'
              : 'مرحباً بك في كاتورا للقهوة المختصة! ✨🌿\nأنا **باريستا كاتورا الذكي (AI)**، خبيرك لاختيار محاصيل البن الفاخرة، حساب نسب الاستخلاص، ومتابعة شحناتك. كيف يمكنني مساعدتك اليوم؟',
            products: [],
            invoice: null,
            time: isEn ? 'Now' : 'الآن'
          }
        ];
      }
      return prev;
    });
  }, [isEn]);

  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [showPromoBadge, setShowPromoBadge] = useState(true);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const hasGeminiKey = Boolean(contactInfo?.geminiApiKey?.trim() || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GEMINI_API_KEY));

  // Quick preset questions for instant answers
  const quickQuestions = language === 'en' ? [
    { label: '🧮 Brew Ratio Calculator', action: 'open_calc' },
    { label: '📦 Track My Order by Invoice', query: 'I want to track my order and shipment' },
    { label: '✨ Coffee Recommendation for V60', query: 'Recommend the best single origin for pour-over and V60' },
    { label: '🍫 Espresso & Milk Drinks Selection', query: 'Best coffee lot for espresso and rich latte' },
    { label: '⚖️ Weight & Custom Grind Options', query: 'How do I choose coffee weight and grind size?' },
    { label: '🚚 Shipping Times & Delivery', query: 'What are the delivery times and shipping costs?' },
    { label: '💳 Payment Methods', query: 'What payment methods are available?' }
  ] : [
    { label: '🧮 حاسبة استخلاص القهوة (Ratio Calculator)', action: 'open_calc' },
    { label: '📦 تتبع حالة طلبي بالفاتورة', query: 'أريد تتبع حالة طلبي وشحنتي' },
    { label: '✨ ترشيح بن للـ V60 والفلتر', query: 'اقترح لي أفضل محصول قهوة مناسب للتقطير والـ V60' },
    { label: '🍫 محصول للإسبريسو ومشروبات الحليب', query: 'أفضل بن مناسب للإسبريسو واللاتيه بقوام غني' },
    { label: '⚖️ تحديد الوزن ودرجة الطحن', query: 'كيف أحدد وزن البن ودرجة الطحن عند الشراء؟' },
    { label: '🚚 مدة وتكلفة الشحن والمحافظات', query: 'ما هي مواعيد الشحن وتكلفته لجميع المحافظات؟' },
    { label: '💳 طرق الدفع المتاحة', query: 'ما هي طرق الدفع المتوفرة في المتجر؟' }
  ];

  // Helper to find invoice match for order tracking
  const findInvoiceMatch = (query) => {
    if (!query || typeof query !== 'string') return null;
    const cleanQ = query.toLowerCase().replace(/[^a-z0-9\u0621-\u064A]/gi, '');
    if (!cleanQ) return null;

    // 1. Try matching invoice number or ID directly
    for (const inv of (invoices || [])) {
      const invNum = (inv.invoiceNumber || '').toLowerCase().replace(/[^a-z0-9]/gi, '');
      const invId = (inv.id || '').toLowerCase().replace(/[^a-z0-9]/gi, '');
      const custPhone = (inv.customerPhone || inv.phone || '').replace(/[^0-9]/g, '');

      if (invNum && (cleanQ.includes(invNum) || invNum.includes(cleanQ))) return inv;
      if (invId && (cleanQ.includes(invId) || invId.includes(cleanQ))) return inv;
      if (custPhone && custPhone.length >= 8 && cleanQ.includes(custPhone)) return inv;
    }

    // 2. Try sequence of digits
    const digitsMatch = query.match(/\d+/g);
    if (digitsMatch) {
      for (const seq of digitsMatch) {
        if (seq.length >= 2) {
          const matched = (invoices || []).find(inv => {
            const num = (inv.invoiceNumber || '').toLowerCase();
            const phone = (inv.customerPhone || inv.phone || '');
            return num.includes(seq) || phone.includes(seq);
          });
          if (matched) return matched;
        }
      }
    }

    return null;
  };

  // Normalize Arabic text for resilient intent and keyword matching
  const normalizeAr = (str) => {
    if (!str || typeof str !== 'string') return '';
    return str
      .toLowerCase()
      .replace(/[أإآ]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/ى/g, 'ي')
      .replace(/[\u064B-\u065F]/g, '') // remove arabic tashkeel diacritics
      .trim();
  };

  // Comprehensive Knowledge Base of World Specialty Coffee Origins & Varieties (Un-stocked / Catalog Alternatives)
  const UNSTOCKED_COFFEES = [
    {
      id: 'geisha',
      triggers: ['جيشا', 'جشا', 'قيشا', 'geisha', 'gesha', 'باناما', 'بنما'],
      name: 'بن جيشا الفاخر (Panama / Colombia Geisha)',
      profile: 'سلالة الجييشا هي جوهرة تاج القهوة المختصة وأغلاها في مزادات القهوة العالمية. تمتاز بتعقيد عطري مذهل يجمع بين أزهار الياسمين، زهر البرتقال، والبرغموت، مع حمضية ناعمة ورقيقة تشبه الشاي الأبيض وقوام حريري خفيف حائز على تقييمات تفوق 90+ نقطة.',
      profileEn: 'Geisha (Gesha) is the crown jewel of specialty coffee, globally renowned for its ethereal jasmine florals, bergamot, delicate peach notes, and tea-like silky body.',
      statusText: 'هذا المحصول غير متوفر لدينا في كاتورا حالياً.',
      statusTextEn: 'This crop is currently out of stock at Caturra.',
      reason: 'كبديل متوفر لدينا يمنحك تجربة زهرية فاخرة بنكهات الياسمين والتوت البري والحمضية الناعمة، أنصحك بشدة بـ **إثيوبيا يرجاشيفي (كبسولة النكهات)**!',
      reasonEn: 'As the closest in-stock alternative with bright jasmine florals and delicate berry notes, we highly recommend our **Ethiopia Yirgacheffe**!',
      altProductId: 'prod-1'
    },
    {
      id: 'yemen',
      triggers: ['يمني', 'يمن', 'مطري', 'حرازي', 'اسماعيلي', 'yemen', 'mokha', 'مخاوي'],
      name: 'البن اليمني التراثي (المطري / الحرازي / بني مطر)',
      profile: 'من أعرق وأندر أصول القهوة في تاريخ البشرية (ميناء المخا التاريخي)، يُزرع على مدرجات جبال اليمن الشاهقة بارتفاعات تفوق 2200 متر بطرق عضوية قديمة ويجفف على أسطح المنازل. يمتاز بقوام كثيف مخملي وإيحاءات الشوكولاتة الداكنة المعقدة، التين المجفف، التوابل الشرقية، ولمسة نبيذية مميزة.',
      profileEn: 'Yemeni coffee (Mokha/Matari/Harazi) is one of the most ancient coffee origins, grown on high mountain terraces above 2200m. It is celebrated for its heavy velvety body, dark cocoa, dried figs, and warm exotic spices.',
      statusText: 'هذا المحصول التراثي غير متوفر لدينا في كاتورا حالياً.',
      statusTextEn: 'This heirloom crop is currently out of stock at Caturra.',
      reason: 'للحصول على قوام كثيف وغني بنكهات الشوكولاتة والمكسرات والكراميل العميقة التي تميز البن اليمني، فإن **كولومبيا سوبريمو ويلا** أو **خلطة إسبريسو كاتورا هاوس بليند** سيعطيانك نفس الإحساس الكلاسيكي الدافئ!',
      reasonEn: 'For a rich body and deep cocoa/caramel undertones reminiscent of Yemeni lots, our **Colombia Supremo** or **Caturra House Blend** are prime matches!',
      altProductId: 'prod-2'
    },
    {
      id: 'kenya',
      triggers: ['كينيا', 'كيني', 'kenya', 'sl28', 'sl34'],
      name: 'بن كينيا المختص (Kenya AA - SL28/SL34)',
      profile: 'أيقونة القهوة في شرق أفريقيا؛ يزرع على سفوح جبل كينيا في تربة بركانية غنية وبارتفاعات شاهقة. يشتهر عالمياً بحمضيته الفسفورية الساطعة ونقاء نكهاته الفريدة التي تذكرنا بالكشمش الأسود (Blackcurrant)، الطماطم الكرزية، والجريب فروت مع معالجة مغسولة مزدوجة شهيرة.',
      profileEn: 'Kenya AA is famed for its vibrant phosphoric acidity, blackcurrant, juicy berries, and sparkling citrus cup clarity.',
      statusText: 'محصول كينيا AA غير متوفر لدينا في كاتورا حالياً.',
      statusTextEn: 'Kenya AA is currently not in stock at Caturra.',
      reason: 'للحصول على حمضية فاكهية مشرقة ونقاء كوب استثنائي لأدوات الفلتر والـ V60، نرشح لك بقوة محصول **إثيوبيا يرجاشيفي** كأقرب بديل فاكهي ساطع!',
      reasonEn: 'For bright fruity acidity and crystal-clear cup profile in V60, we recommend **Ethiopia Yirgacheffe**!',
      altProductId: 'prod-1'
    },
    {
      id: 'blue_mountain',
      triggers: ['بلو ماونتن', 'جامايكا', 'blue mountain', 'jamaica'],
      name: 'بن جامايكا بلو ماونتن (Jamaica Blue Mountain)',
      profile: 'يزرع في قمم الجبال الزرقاء بجامايكا في أجواء ضبابية باردة؛ يعتبر من أشهر وأندر أنواع القهوة الكلاسيكية. يتميز بنعومة فائقة وخلو شبه تام من أي مرارة، مع توازن معتدل جداً ونكهات هادئة من المكسرات والكاكاو الخفيف.',
      profileEn: 'Jamaica Blue Mountain is celebrated for its supreme smoothness, lack of bitterness, balanced sweetness, and subtle cocoa/nut undertones.',
      statusText: 'هذا المحصول غير متوفر لدينا في كاتورا حالياً.',
      statusTextEn: 'Jamaica Blue Mountain is currently not available at Caturra.',
      reason: 'لتجربة فنجان ناعم ومتوازن وخالٍ من المرارة بنكهات السكر البني والكراميل المتناغم، نرشح لك **كولومبيا سوبريمو ويلا** كأفضل بديل ناعم ومتزن!',
      reasonEn: 'For silky smoothness, zero bitterness, and delicate caramel sweetness, try **Colombia Supremo Huila**!',
      altProductId: 'prod-2'
    },
    {
      id: 'costa_rica',
      triggers: ['كوستاريكا', 'كوستاريكي', 'costa rica', 'تارازو', 'tarrazu'],
      name: 'بن كوستاريكا تارازو (Costa Rica Honey/Washed)',
      profile: 'كوستاريكا رائدة المعالجة العسلية (Honey Process) في أمريكا الوسطى، يمتاز محصولها بنكهات التفاح الأخضر والعسل وحلاوة قصب السكر مع قوام متوازن وحمضية لطيفة منعشة.',
      profileEn: 'Costa Rica beans are renowned for honey processing, crisp green apple, sugarcane sweetness, and balanced acidity.',
      statusText: 'محصول كوستاريكا غير متوفر كمنتج مستقل حالياً في كاتورا.',
      statusTextEn: 'Costa Rica is currently out of stock as a standalone offering.',
      reason: 'كبديل متوازن بالحلاوة الطبيعية والنقاء، يمكنك تجربة **كولومبيا سوبريمو ويلا** أو **إثيوبيا يرجاشيفي**!',
      reasonEn: 'Try our **Colombia Supremo** or **Ethiopia Yirgacheffe** for harmonious sweetness and balanced fruitiness.',
      altProductId: 'prod-2'
    },
    {
      id: 'guatemala',
      triggers: ['جواتيمالا', 'غواتيمالا', 'جواتيمالي', 'غواتيمالي', 'guatemala', 'انتيجوا', 'antigua'],
      name: 'بن جواتيمالا أنتيجوا البركاني (Guatemala)',
      profile: 'ينمو محاطاً بثلاثة براكين شاهقة في وادي أنتيجوا؛ يمتاز بنكهات الشوكولاتة الداكنة، التفاح، والكراميل مع لمحة توابل مدخنة خفيفة وقوام متماسك.',
      profileEn: 'Guatemala Antigua grows in nutrient-dense volcanic soil, delivering rich chocolate, red apple, sweet caramel, and faint smoky spice nuances.',
      statusText: 'محصول جواتيمالا غير متوفر ككيس منفرد حالياً (لكنه متوفر ضمن بوكس التذوق الرباعي الفاخر!).',
      statusTextEn: 'Guatemala is currently not available as a single bag (though featured inside our 4-origin Tasting Gift Box!).',
      reason: 'يمكنك الحصول عليه فوراً ضمن **بوكس تذوق محاصيل كاتورا الفاخرة (4 محاصيل)**، أو اختيار **كولومبيا سوبريمو** كبديل فردي متقارب جداً!',
      reasonEn: 'Available inside our **Caturra Tasting Gift Box (4 harvests)** or grab **Colombia Supremo** as an individual single-origin bag!',
      altProductId: 'prod-7'
    },
    {
      id: 'sumatra',
      triggers: ['سومطره', 'سومطرة', 'اندونيسي', 'إندونيسي', 'sumatra', 'mandheling', 'ماندلينج'],
      name: 'بن سومطرة ماندلينج الإندونيسي (Sumatra Mandheling)',
      profile: 'يعالج بالطريقة الرطبة التقليدية (Giling Basah)؛ يتميز بقوام ثقيل جداً (Heavy Body)، حمضية منخفضة للغاية، ونكهات عشبية وترابية وتوابل خشبية مميزة تلائم الإسبريسو الكلاسيكي ومشروبات الحليب.',
      profileEn: 'Sumatra Mandheling undergoes traditional wet-hulling, resulting in an exceptionally full body, low acidity, and earthy herbal spice complexity.',
      statusText: 'هذا المحصول غير متوفر لدينا في كاتورا حالياً.',
      statusTextEn: 'Sumatra beans are currently not in stock at Caturra.',
      reason: 'إذا كنت تبحث عن قوام ثقيل وكريما كثيفة غنية بدون أي حموضة لمشروبات الحليب، فإن **خلطة إسبريسو كاتورا هاوس بليند** خيارك المثالي!',
      reasonEn: 'If you desire dense crema, full body, and zero sourness for lattes, our **Caturra House Blend** is built for you!',
      altProductId: 'prod-5'
    },
    {
      id: 'hawaii_kona',
      triggers: ['كونا', 'هاواي', 'kona', 'hawaii'],
      name: 'بن هاواي كونا البركاني (Hawaii Kona)',
      profile: 'يزرع على منحدرات بركان ماونا لوا في هاواي؛ يتميز بنكهات الزبدة والمكسرات المحمصة مع حلاوة كراميل خفيفة ونعومة فائقة وسعر عالمي مرتفع.',
      profileEn: 'Hawaii Kona grows on the volcanic slopes of Mauna Loa, prized for its buttery nuttiness, delicate brown sugar, and mellow finish.',
      statusText: 'هذا المحصول النادر غير متوفر لدينا في كاتورا حالياً.',
      statusTextEn: 'Hawaii Kona is currently out of stock at Caturra.',
      reason: 'كبديل متوازن وناعم بالمكسرات والكراميل، ننصحك بمحصول **كولومبيا سوبريمو ويلا**.',
      reasonEn: 'For balanced sweetness and nutty caramel undertones, try **Colombia Supremo Huila**!',
      altProductId: 'prod-2'
    },
    {
      id: 'rwanda_burundi',
      triggers: ['رواندا', 'رواندي', 'بوروندي', 'rwanda', 'burundi'],
      name: 'محاصيل رواندا وبوروندي (Great Lakes Africa)',
      profile: 'محاصيل جبلية رائعة تنمو على ارتفاعات تفوق 1800 متر؛ تشتهر بنكهات الشاي الأسود والبرغموت والتين والبرتقال وقوام حريري ناعم.',
      profileEn: 'Rwanda and Burundi specialty beans boast sweet black tea, bergamot, orange marmalade, and delicate figs.',
      statusText: 'هذا المحصول غير متوفر لدينا في كاتورا حالياً.',
      statusTextEn: 'Rwanda/Burundi harvests are currently not in stock.',
      reason: 'كبديل أفريقي ممتاز بإيحاءات زهرية وفاكهية نقية، أنصحك بـ **إثيوبيا يرجاشيفي**!',
      reasonEn: 'Try our **Ethiopia Yirgacheffe** for floral and fruit-forward African elegance.',
      altProductId: 'prod-1'
    },
    {
      id: 'decaf',
      triggers: ['ديكاف', 'دي كاف', 'خالي كافيين', 'بدون كافيين', 'منزوع الكافيين', 'decaf', 'decafe'],
      name: 'القهوة منزوعة الكافيين (Decaf Specialty Coffee)',
      profile: 'قهوة مختصة تتم إزالة 99.9% من الكافيين منها بطرق طبيعية تماماً (مثل Swiss Water أو نقع قصب السكر الطبيعي) دون استخدام مواد كيميائية ضارة، لتحتفظ بالنكهة الغنية بدون أي تأثير منبه.',
      profileEn: 'Specialty Decaf coffee naturally removes 99.9% of caffeine via Swiss Water or sugarcane ethyl acetate processes without altering delicate flavor complexity.',
      statusText: 'القهوة منزوعة الكافيين غير متوفرة في كاتورا حالياً (ونعمل على توفيرها قريباً جداً في الدفعات القادمة بإذن الله!).',
      statusTextEn: 'Decaf beans are currently not in stock at Caturra (coming soon!).',
      reason: 'في حال رغبت بقهوة خفيفة التأثير على النوم، ننصحك باستخلاص V60 خفيف وسريع من **إثيوبيا يرجاشيفي** لتقليل نسبة الكافيين المستخلص!',
      reasonEn: 'In the meantime, a fast pour-over extraction of **Ethiopia Yirgacheffe** yields a refreshing, gentle cup.',
      altProductId: 'prod-1'
    },
    {
      id: 'green_coffee',
      triggers: ['قهوه خضراء', 'قهوة خضراء', 'بن اخضر', 'بن أخضر', 'تخسيس', 'green coffee'],
      name: 'القهوة الخضراء (حبوب البن الخام غير المحمصة)',
      profile: 'حبوب البن الخام قبل التحميص؛ تكون غنية بحمض الكلوروجينيك ومضادات الأكسدة وتستخدم غالباً في وصفات التخسيس.',
      profileEn: 'Unroasted raw green coffee beans, high in chlorogenic acid and antioxidants, commonly sought for wellness and weight loss.',
      statusText: 'غير متوفرة حالياً في كاتورا، حيث ينصب تركيزنا الحرفي على تحميص القهوة المختصة الفاخرة للشرب والاستمتاع بالنكهات.',
      statusTextEn: 'Raw green coffee is currently not available at Caturra.',
      reason: 'إذا كنت تبحث عن قهوة طبيعية خفيفة وصحية 100% بدون أي إضافات، فجميع محاصيلنا أرابيكا مختصة 100% ونقية تماماً!',
      reasonEn: 'All our roasted coffees are 100% Specialty Arabica, completely pure with zero additives.',
      altProductId: 'prod-1'
    },
    {
      id: 'capsules_nespresso',
      triggers: ['كبسولات', 'نسبريسو', 'كبسوله', 'كبسولة', 'nespresso', 'capsule'],
      name: 'كبسولات القهوة الجاهزة (Nespresso Pods)',
      profile: 'كبسولات ألومنيوم معبأة مسبقاً مخصصة لماكينات نسبريسو السريعة.',
      profileEn: 'Pre-packaged aluminum capsules compatible with Nespresso machines.',
      statusText: 'لا نبيع كبسولات جاهزة معبأة حالياً في المتجر.',
      statusTextEn: 'We do not sell pre-packaged sealed capsules.',
      reason: 'ولكن يسعدنا جداً أن نقوم بـ **طحن أي محصول قهوة تختاره بدرجة طحن فائقة الدقة مخصصة للكبسولات القابلة لإعادة التعبئة (Reusable Pods)** مجاناً 100%! جرّب **خلطة إسبريسو كاتورا هاوس بليند** لتحصل على وش ذهبي ونكهة أقوى وأنقى من الكبسولات الجاهزة!',
      reasonEn: 'However, we grind any beans to precise pod caliber for reusable capsules 100% free! We recommend our **Caturra House Blend**.',
      altProductId: 'prod-5'
    },
    {
      id: 'robusta',
      triggers: ['روبوستا', 'روبستا', 'robusta', 'بن فيتنامي', 'فيتنامي', 'بن تجاري'],
      name: 'حبوب بن الروبوستا (Robusta Coffee)',
      profile: 'الروبوستا سلالة تجارية تنمو على ارتفاعات منخفضة، تحتوي على ضعف نسبة الكافيين ومرارة خشنة، وتستخدم في القهوة التجارية الرخيصة لتكوين كريما مصطنعة.',
      profileEn: 'Robusta is a commercial variety grown at low elevations, carrying double caffeine, rubbery bitterness, and heavy artificial crema.',
      statusText: 'غير متوفرة في كاتورا إطلاقاً، لأننا نلتزم بتقديم أرابيكا مختصة 100% (100% Specialty Arabica) حفاظاً على صحة المعدة ونقاء المذاق.',
      statusTextEn: 'Never sold at Caturra. We strictly source 100% Specialty Grade Arabica.',
      reason: 'إذا كنت تبحث عن كريما كثيفة وقوام قوي للإسبريسو ومشروبات الحليب بدون مرارة مؤذية، فإن **خلطة إسبريسو كاتورا هاوس بليند** تمنحك كريما ذهبية غنية مع شوكولاتة وفانيليا بنقاء 100%!',
      reasonEn: 'For intense body and thick crema without harsh bitterness, our **Caturra House Blend** delivers the ultimate experience!',
      altProductId: 'prod-5'
    },
    {
      id: 'brazil',
      triggers: ['برازيلي', 'برازيل', 'سيرادو', 'سانتوس', 'brazil', 'cerrado'],
      name: 'بن البرازيل (سيرادو / سانتوس)',
      profile: 'البرازيل أكبر منتج للقهوة في العالم؛ يشتهر البن البرازيلي الكلاسيكي بإيحاءات الفول السوداني، البندق المحمص، الكاكاو، والحمضية المنخفضة جداً مع قوام كريمي ثقيل.',
      profileEn: 'Brazil Cerrado/Santos is famous for roasted hazelnuts, low acidity, milk chocolate, and creamy heavy body.',
      statusText: 'البن البرازيلي غير متوفر ككيس فردي منفصل حالياً في كاتورا.',
      statusTextEn: 'Brazil is currently not sold as an individual single origin.',
      reason: 'لكنه متوفر لدينا كعنصر رئيسي وأساسي داخل **خلطة إسبريسو كاتورا هاوس بليند** ليمنحك الكريما الذهبية الكثيفة ونكهة الشوكولاتة بالحليب والمكسرات!',
      reasonEn: 'It is the core component inside our best-selling **Caturra House Blend** for rich crema and nutty chocolate notes!',
      altProductId: 'prod-5'
    }
  ];

  // Advanced Local Barista Intelligence Engine (v2.0)
  const generateLocalAiReply = (userQuery, history = []) => {
    const rawQ = userQuery.trim();
    const q = normalizeAr(rawQ);

    // ==========================================
    // 0. ORDER TRACKING & INVOICE SEARCH
    // ==========================================
    if (
      q.includes('تتبع') || q.includes('شحن') || q.includes('فاتوره') || q.includes('طلبي') ||
      q.includes('اين طلبي') || q.includes('فين طلبي') || q.includes('وصل لفين') || q.includes('inv-') ||
      q.includes('track') || q.includes('order') || q.includes('invoice') || q.includes('shipment')
    ) {
      const matchedInv = findInvoiceMatch(rawQ);
      if (matchedInv) {
        return {
          text: isEn
            ? `Found your order successfully! 📦✨\nHere are the live shipment details for invoice **#${matchedInv.invoiceNumber}** for **${matchedInv.customerName || 'Caturra Customer'}**:`
            : `عثرت على طلبك بنجاح! 📦✨\nإليك تفاصيل الشحنة الحية للفاتورة **#${matchedInv.invoiceNumber}** باسم **${matchedInv.customerName || 'عميل كاتورا'}**:`,
          invoice: matchedInv,
          products: []
        };
      }

      if (!rawQ.match(/[0-9]/)) {
        return {
          text: isEn
            ? `To track your shipment live, please enter your **Invoice Number** (e.g. INV-2026-001 or digits) or your registered **Phone Number**, and I will pull up your shipment progress immediately! 🔍📦`
            : `لتتبع شحنتك لايف فوراً، يرجى كتابة **رقم الفاتورة** (مثال: INV-2026-001 أو الأرقام فقط) أو **رقم هاتفك** المسجل به الطلب، وسأعرض لك خط سير المندوب فوراً! 🔍📦`,
          invoice: null,
          products: []
        };
      }
    }

    // ==========================================
    // 1. CONVERSATIONAL EGYPTIAN ARABIC (بقولك، اتفضل، تحيات وود)
    // ==========================================

    // User says: "بقولك" / "بقولك ايه" / "بقولك يا باشا" / "بقولك يا كابتن"
    if (
      q.startsWith('بقولك') || q === 'بقولك' || q.includes('بقولك ايه') ||
      q.includes('بقولك يا') || q.includes('اقولك')
    ) {
      return {
        text: isEn
          ? `Go ahead! I am all ears and ready to assist you. ☕✨\nWhat's on your mind? Are you looking for a coffee bean recommendation, brewing ratios, or checking on your order?`
          : `اتفضل يا فندم معاك وسامعك، أؤمرني! ☕✨\nإيه اللي في بالك ومحتاج تسأل عنه؟ ترشيح محصول قهوة، وصفة استخلاص، ولا استفسار عن طلبك؟`,
        products: products.slice(0, 2)
      };
    }

    // User says: "معلش" / "سؤال بعد اذنك" / "استفسار" / "سؤال بس"
    if (
      q.includes('معلش') || q.includes('سؤال بعد اذنك') || q.includes('استفسار بعد اذنك') ||
      q.includes('سؤال بس') || q.includes('عايز اسال') || q.includes('عايز اعرف')
    ) {
      return {
        text: isEn
          ? `No problem at all! Please feel free to ask anything. I am here to help you find the perfect coffee, brew guide, or answer any questions! 🌿☕`
          : `ولا يهمك يا فندم مفيش معلش خالص! اتفضل اسأل براحتك جداً، أنا في خدمتك وجاهز أجاوبك على أي تفصيلة تخص القهوة، التحضير، أو متجر كاتورا 🌿☕`,
        products: []
      };
    }

    // Islamic / Arabic Greetings: "سلام عليكم" / "السلام عليكم"
    if (q.includes('سلام عليكم') || q.includes('السلام عليكم') || q.includes('سلامو عليكم')) {
      return {
        text: isEn
          ? `Peace be upon you! Welcome to Caturra Specialty Coffee. 🌿✨ How may I serve you today?`
          : `وعليكم السلام ورحمة الله وبركاته! 🌿 يا هلا بيك في كاتورا للقهوة المختصة، نورتنا يا فندم.\nكيف أقدر أساعدك النهارده؟ تحب نرشحلك محصول مميز لمزاجك، ولا نساعدك في وصفة تحضير؟ ☕`,
        products: products.slice(0, 2)
      };
    }

    // Morning Greetings: "صباح الخير" / "صباح الفل" / "صباح الورد"
    if (q.includes('صباح الخير') || q.includes('صباح الفل') || q.includes('صباح الورد') || q.includes('صباح النور') || q.includes('صباحك')) {
      return {
        text: isEn
          ? `Good morning! ☕✨ Nothing starts the day better than a fresh cup of specialty coffee. How can I help you brew your morning cup today?`
          : `صباح الفل والياسمين وريحة القهوة الطازة! ☕✨\nمفيش أحسن من فنجان قهوة مختصة مضبوط يبدأ بيه اليوم. جاهز أساعدك تختار فنجانك أو تظبط وصفتك، أؤمرني يا فندم!`,
        products: products.slice(0, 2)
      };
    }

    // Evening Greetings: "مساء الخير" / "مساء الفل" / "مساء النور"
    if (q.includes('مساء الخير') || q.includes('مساء الفل') || q.includes('مساء الورد') || q.includes('مساء النور') || q.includes('مساك')) {
      return {
        text: isEn
          ? `Good evening! 🌿✨ Looking for a delicious evening brew or need assistance with your coffee gear? I am at your service!`
          : `مساء الورد والروقان يا فندم! 🌿✨\nمنور كاتورا. بتدور على فنجان قهوة يروق مزاجك لباقي السهرة، ولا محتاج مساعدة في أداة تحضير أو تتبع طلب؟`,
        products: products.slice(0, 2)
      };
    }

    // Friendly How-are-you: "ازيك" / "عامل ايه" / "اخبارك" / "إيه الأخبار"
    if (q.includes('ازيك') || q.includes('عامل ايه') || q.includes('اخبارك') || q.includes('ايه الاخبار') || q.includes('كيف حالك')) {
      return {
        text: isEn
          ? `I'm doing great and fully energized to assist you! ☕ How are you doing? How can I help with your specialty coffee journey today?`
          : `الحمد لله كله تمام وفي أتم الاستعداد لخدمتك! ☕\nطمني عنك يا فندم يا رب تكون بأحسن حال ومزاجك رايق. أؤمرني، محتاج أي ترشيح أو مساعدة في اختيار قهوتك؟`,
        products: []
      };
    }

    // Appreciation: "شكراً" / "تسلم" / "حبيبي" / "الله يخليك" / "ألف شكر"
    if (
      q.includes('شكرا') || q.includes('تسلم') || q.includes('حبيبي') ||
      q.includes('الله يخليك') || q.includes('ربنا يباركلك') || q.includes('الف شكر') ||
      q.includes('كتر خيرك') || q.includes('thanks') || q.includes('thank you')
    ) {
      return {
        text: isEn
          ? `You are very welcome! ❤️ It is my absolute pleasure to assist. Feel free to ask whenever you need anything coffee-related. Enjoy every sip! ☕✨`
          : `الشكر لله يا غالي! دايماً تحت أمرك وفي خدمتك ❤️\nماتترددش تسألني في أي وقت لو حبيت تظبط أي فنجان قهوة أو تستفسر عن أي حاجة. بالهنا والشفا دائماً! ☕✨`,
        products: []
      };
    }

    // Acknowledgements: "تمام" / "ماشي" / "أوك" / "اوكي" / "فهمت"
    if (q === 'تمام' || q === 'ماشي' || q === 'اوك' || q === 'اوكي' || q === 'تمام شكرا' || q === 'فهمت' || q === 'حلو') {
      return {
        text: isEn
          ? `Awesome! Let me know whenever you need anything else. Have a wonderful coffee-filled day! ☕🌿`
          : `تمام جداً وعلى راسي يا فندم! لو احتجت أي مساعدة تانية أو خطوة في تأكيد طلبك، أنا معاك هنا في الشات دايماً. يومك جميل برائحة القهوة! ☕🌿`,
        products: []
      };
    }

    // Identity: "مين انت" / "انت مين" / "انت روبوت" / "انت انسان"
    if (q.includes('مين انت') || q.includes('انت مين') || q.includes('انت انسان') || q.includes('انت روبوت') || q.includes('بتعمل ايه') || q.includes('وظيفتك')) {
      return {
        text: isEn
          ? `I am **Caturra AI Barista** 🤖☕!\nA virtual specialty coffee connoisseur trained on coffee genetics, roast chemistry, precision extraction ratios, and Caturra's live store inventory to be your personalized guide to the ultimate coffee experience in Egypt.`
          : `أنا **باريستا كاتورا الذكي (Caturra AI Barista)** 🤖☕!\nباريستا افتراضي وخبير مدرب على كل أسرار القهوة المختصة، السلالات، المعالجات، نسب الاستخلاص الدقيقة، ومخزون متجر كاتورا عشان أكون رفيقك ومرشدك لأحسن تجربة قهوة في مصر. كيف تحب نبدأ؟`,
        products: products.slice(0, 2)
      };
    }

    // ==========================================
    // 2. UN-STOCKED WORLD COFFEE ORIGINS & VARIETIES
    // (جيشا، يمني مطري، كينيا AA، بلو ماونتن، كوستاريكا، جواتيمالا، سومطرة، هاواي كونا، رواندا، ديكاف، إلخ)
    // ==========================================
    const matchedUnstocked = UNSTOCKED_COFFEES.find(item =>
      item.triggers.some(trig => q.includes(normalizeAr(trig)))
    );

    if (matchedUnstocked) {
      const altProduct = products.find(p => p.id === matchedUnstocked.altProductId) || products.find(p => p.category === 'coffee');
      const attachedProducts = altProduct ? [altProduct] : [];

      if (isEn) {
        return {
          text: `### ☕ Specialty Coffee Insight: **${matchedUnstocked.name}**\n\n` +
            `${matchedUnstocked.profileEn}\n\n` +
            `---\n\n` +
            `⚠️ **Note:** ${matchedUnstocked.statusTextEn}\n\n` +
            `✨ **Barista Recommendation:**\n${matchedUnstocked.reasonEn}`,
          products: attachedProducts
        };
      }

      return {
        text: `### ☕ معلومات وخبرة الباريستا عن: **${matchedUnstocked.name}**\n\n` +
          `${matchedUnstocked.profile}\n\n` +
          `---\n\n` +
          `⚠️ **تنويه المتجر:** ${matchedUnstocked.statusText}\n\n` +
          `✨ **ترشيح الباريستا البديل:**\n${matchedUnstocked.reason}`,
        products: attachedProducts
      };
    }

    // General pattern catch for unknown/un-stocked origins: e.g. "عندكم بن [اسم]" أو "في بن [اسم]"
    if (
      (q.includes('عندكم بن') || q.includes('في بن') || q.includes('متوفر بن') || q.includes('عندكم قهوه') || q.includes('عندكم قهوة')) &&
      !q.includes('اثيوبيا') && !q.includes('كولومبيا') && !q.includes('هاوس')
    ) {
      const coffeeList = products.filter(p => p.category === 'coffee').slice(0, 3);
      return {
        text: isEn
          ? `Thank you for your interest! Regarding this specific harvest, it is **currently not available at Caturra**.\n\nHowever, we pride ourselves on curating the finest 100% Specialty Arabica harvests directly imported and freshly roasted in Egypt. Here are our top available single-origin lots with their flavor profiles:`
          : `أهلاً بك يا فندم! بخصوص هذا المحصول تحديداً، فهو **غير متوفر لدينا في كاتورا حالياً**.\n\nولكننا نوفر لك تشكيلة استثنائية من أرقى محاصيل القهوة المختصة (أرابيكا 100%) المستوردة مباشرة والمحمصة طازجة بأعلى معايير الجودة:\n\n1. **إثيوبيا يرجاشيفي:** إيحاءات ياسمين وتوت بري وحمضيات ناعمة للـ V60.\n2. **كولومبيا سوبريمو ويلا:** قوام متماسك، شوكولاتة وسكر بني وكراميل متوازن.\n3. **خلطة إسبريسو كاتورا هاوس بليند:** مزيج غني بالكريما والشوكولاتة لمشروبات الحليب.\n\nيمكنك اختيار أي منها بالوزن ودرجة الطحن المفضلة لديك مجاناً! ☕✨`,
        products: coffeeList
      };
    }

    // ==========================================
    // 3. BREWING METHODS & PRECISE RECIPES
    // (V60, Espresso, French Press, Moka Pot, Cold Brew, Turkish, Chemex, AeroPress)
    // ==========================================

    // V60 & Pour-Over
    if (
      q.includes('v60') || q.includes('تقطير') || q.includes('فلتر') ||
      q.includes('بور اوفر') || q.includes('كيمكس') || q.includes('chemex') || q.includes('pour over')
    ) {
      const ethProduct = products.find(p => p.id === 'prod-1') || products.find(p => p.category === 'coffee');
      const v60Tool = products.find(p => p.id === 'prod-3');
      const matched = [ethProduct, v60Tool].filter(Boolean);

      return {
        text: isEn
          ? `### 🌿 Golden V60 Pour-Over Recipe & Guide:\n\n` +
            `• **Brew Ratio:** 1:15 to 1:16 (18g coffee to 280g water).\n` +
            `• **Water Temp:** 91°C – 93°C (let boiled water rest for 45s).\n` +
            `• **Grind Size:** Medium-coarse (like kosher sea salt).\n\n` +
            `**Pouring Stages:**\n` +
            `1. **Blooming:** Pour 45g water in spiral motion. Wait 40 seconds to release CO2 degassing.\n` +
            `2. **Second Pour:** Pour steadily up to 160g water in concentric circles.\n` +
            `3. **Final Pour:** Gently pour up to 280g. Total drawdown time: 2:30 – 2:45 minutes.\n\n` +
            `✨ **Top Bean Recommendation:** **Ethiopia Yirgacheffe** for dazzling jasmine and berry sweetness!`
          : `### 🌿 وصفة وطريقة استخلاص V60 الاحترافية:\n\n` +
            `• **النسبة الذهبية (Ratio):** 1:15 أو 1:16 (18 جرام بن يقابلها 280 مل ماء).\n` +
            `• **حرارة الماء:** 91°C – 93°C (اترك الماء يهدأ 45 ثانية بعد الغليان).\n` +
            `• **درجة الطحن:** متوسط خشن (أقرب لحبات ملح البحر الخشن).\n\n` +
            `**مراحل الصب بالتفصيل:**\n` +
            `1. **الترطيب (Blooming):** صب 45 مل ماء بحركات دائرية هادئة وانتظر 40 ثانية لإخراج غازات التحميص.\n` +
            `2. **الصبة الثانية:** صب بهدوء حتى تصل لـ 160 مل بحركات حلزونية من المركز للخارج.\n` +
            `3. **الصبة الأخيرة:** استكمل حتى 280 مل. إجمالي وقت التحضير: من 2:30 إلى 2:45 دقيقة.\n\n` +
            `✨ **أفضل محصول مرشح:** **إثيوبيا يرجاشيفي** لإبراز نوتات الياسمين والتوت البري المنعشة! يتوفر لدينا أيضاً **طقم تحضير V60 متكامل**.`,
        products: matched
      };
    }

    // Espresso, Latte, & Milk Drinks
    if (
      q.includes('اسبريسو') || q.includes('لاتيه') || q.includes('كابتشينو') ||
      q.includes('حليب') || q.includes('فلات وايت') || q.includes('espresso') ||
      q.includes('latte') || q.includes('flat white') || q.includes('كريما')
    ) {
      const blendProduct = products.find(p => p.id === 'prod-5');
      const colProduct = products.find(p => p.id === 'prod-2');
      const matched = [blendProduct, colProduct].filter(Boolean);

      return {
        text: isEn
          ? `### ☕ Master Espresso & Milk Drinks Calibration:\n\n` +
            `• **Dose & Yield:** 18g coffee in double basket → 36g espresso yield (1:2 ratio).\n` +
            `• **Extraction Time:** 26 – 30 seconds at 9 bar pressure.\n` +
            `• **Water Temp:** 92°C – 94°C.\n` +
            `• **Tamping:** Firm, perfectly level 15kg tamp.\n\n` +
            `🥛 **For Lattes & Flat Whites:** Steam whole milk to 60°C–65°C for glossy microfoam.\n\n` +
            `✨ **Top Pick:** **Caturra House Blend** (hazelnut, milk chocolate, thick hazel crema) or **Colombia Supremo**!`
          : `### ☕ معايرة الإسبريسو ومشروبات الحليب الاحترافية:\n\n` +
            `• **النسبة والجرعة:** 18 جرام بن في الباسكت المزدوج ← تستخلص 36 مل إسبريسو (نسبة 1:2).\n` +
            `• **وقت الاستخلاص:** من 26 إلى 30 ثانية تحت ضغط 9 بار.\n` +
            `• **حرارة الاستخلاص:** 92°C – 94°C.\n` +
            `• **الكبس (Tamping):** كبس متساوي ومستوٍ تماماً بقوة متوازنة.\n\n` +
            `🥛 **لمشروبات الحليب (لاتيه، فلات وايت، كابتشينو):** تبخير الحليب لدرجة 60°C–65°C للحصول على رغوة مخملية (Microfoam) حريرية.\n\n` +
            `✨ **أفضل محصول مرشح:** **خلطة إسبريسو كاتورا هاوس بليند** (شوكولاتة وفانيليا وكريما كثيفة) أو **كولومبيا سوبريمو**!`,
        products: matched
      };
    }

    // French Press
    if (q.includes('فرينش بريس') || q.includes('فرنش بريس') || q.includes('french press')) {
      return {
        text: isEn
          ? `### 🫖 French Press Brewing Guide:\n\n` +
            `• **Ratio:** 1:15 (20g coffee to 300ml water).\n` +
            `• **Grind Size:** Extra coarse (like sea salt crystals).\n` +
            `• **Water Temp:** 94°C.\n` +
            `• **Steep Time:** Pour all water, place lid, and steep for 4 minutes.\n` +
            `• **Pro Barista Tip:** At 4 minutes, stir crust gently, skim top foam, wait 1 more minute, then plunge slowly for a clean, full-bodied cup without grit!`
          : `### 🫖 طريقة تحضير الفرينش بريس (French Press) باحتراف:\n\n` +
            `• **النسبة:** 1:15 (20 جرام بن لكل 300 مل ماء).\n` +
            `• **درجة الطحن:** خشن جداً (أقرب لبلورات الملح الصخري الخشن).\n` +
            `• **حرارة الماء:** 94°C.\n` +
            `• **مدة النقع:** صب الماء بالكامل، غطِ الإبريق، واتركه ينقع لمدة 4 دقائق.\n` +
            `• **سر الباريستا:** بعد مرور 4 دقائق، قلّب القشرة العلوية بالملعقة وأزل الرغوة البيضاء، ثم انزل بالمكبس ببطء شديد لتحصل على قوام ممتلئ غني وخالٍ تماماً من الرواسب!`,
        products: products.slice(0, 2)
      };
    }

    // Moka Pot / موكا بوت
    if (q.includes('موكا بوت') || q.includes('موكابوت') || q.includes('moka pot') || q.includes('بريكو')) {
      return {
        text: isEn
          ? `### ☕ Moka Pot Perfect Stovetop Guide:\n\n` +
            `• **Golden Secret:** Fill bottom chamber with **already boiling water** up to safety valve to avoid scorching the beans.\n` +
            `• **Grind Size:** Medium-fine (slightly coarser than espresso).\n` +
            `• **Basket:** Fill flush without packing/tamping.\n` +
            `• **Heat:** Low heat with lid open. Remove immediately once blonde honey-colored foam emerges!`
          : `### ☕ أسرار تحضير إبريق الموكا بوت (Moka Pot) بدون مرارة:\n\n` +
            `• **السر الذهبي:** املأ الخزان السفلي بـ **ماء ساخن مغلي مسبقاً** حتى أسفل صمام الأمان؛ هذا يحمي البن من الاحتراق بنار البوتاجاز!\n` +
            `• **درجة الطحن:** ناعم متوسط (أنعم من الفلتر وأخشن من الإسبريسو).\n` +
            `• **وضع البن:** املأ القمع وسوّ السطح بيدك بدون أي ضغط أو كبس.\n` +
            `• **التسوية:** نار شمعة هادئة جداً، وارفع الإبريق عن النار فور تدفق الرغوة الذهبية الشقراء مباشرة وضع قاعدته تحت ماء الصنبور لإيقاف الاستخلاص!`,
        products: products.slice(0, 2)
      };
    }

    // Cold Brew / كولد برو
    if (q.includes('كولد برو') || q.includes('استخلاص بارد') || q.includes('cold brew')) {
      return {
        text: isEn
          ? `### 🧊 Signature Cold Brew Recipe:\n\n` +
            `• **Ratio (Concentrate):** 1:8 (e.g. 100g coarse coffee to 800ml cold filtered water).\n` +
            `• **Grind Size:** Extra coarse.\n` +
            `• **Steeping Time:** 14 – 18 hours chilled inside the refrigerator.\n` +
            `• **Filtering:** Filter through paper filter or fine mesh.\n` +
            `• **Serving:** Serve over clear ice cubes, dilute 1:1 with cold water or fresh milk!`
          : `### 🧊 وصفة الكولد برو (الاستخلاص البارد) المنعش:\n\n` +
            `• **النسبة (مركز):** 1:8 (مثال: 100 جرام بن خشن لكل 800 مل ماء بارد مفلتر).\n` +
            `• **درجة الطحن:** طحن خشن جداً.\n` +
            `• **مدة النقع:** من 14 إلى 18 ساعة داخل الثلاجة.\n` +
            `• **التصفية:** صَفِّ القهوة باستخدام فلتر ورقي للحصول على سائل نقي كريستالي.\n` +
            `• **التقديم:** قدّمه فوق مكعبات الثلج، وخففه بنسبة 1:1 بالماء البارد أو الحليب الطازج لنكهة حريرية بدون أي حموضة أو مرارة!`,
        products: products.slice(0, 2)
      };
    }

    // Turkish Coffee / قهوة تركي
    if (q.includes('تركي') || q.includes('قهوه تركي') || q.includes('قهوة تركي') || q.includes('وش') || q.includes('turkish')) {
      return {
        text: isEn
          ? `### 🇹🇷 Traditional Turkish Coffee with Thick Crema Crown:\n\n` +
            `• **Coffee Dose:** 7g to 8g extra-fine powder per 65-70ml cold water.\n` +
            `• **Pre-Stir:** Stir coffee, cold water, and sugar thoroughly outside heat until fully dissolved.\n` +
            `• **Cooking:** Place on ultra-low flame (candle-like heat) without stirring.\n` +
            `• **The Crown:** Lift right before boiling as the thick velvety crema rises to preserve the iconic crown!`
          : `### 🇹🇷 أصول القهوة التركي المظبوطة بالوش السميك:\n\n` +
            `• **المقادير:** 7 إلى 8 جرام بن فائق النعومة (بودرة) لكل فنجان (65-70 مل) ماء بارد.\n` +
            `• **التقليب المسبق:** قلّب البن والماء والسكر جيداً خارج النار حتى يذوب تماماً.\n` +
            `• **التسوية:** ضع الكنكة على نار شمعة هادئة جداً بدون أي تقليب إطلاقاً.\n` +
            `• **الوش الذهبي:** ارفع الكنكة فور بدء ارتفاع الوش الكريمي وقبل أن تغلي القهوة، وصب أول نصف في الفنجان ثم أعد الكنكة لثانية وصب الباقي لضمان وش كثيف لا يسقط!`,
        products: products.slice(0, 2)
      };
    }

    // ==========================================
    // 4. COFFEE SCIENCE & PROCESSES
    // (المعالجة المجففة vs المغسولة vs العسلية، أرابيكا vs روبوستا، حفظ البن)
    // ==========================================

    // Natural vs Washed vs Honey
    if (
      q.includes('معالجه') || q.includes('معالجة') || q.includes('مجففه') ||
      q.includes('مجففة') || q.includes('مغسوله') || q.includes('مغسولة') ||
      q.includes('عسليه') || q.includes('عسلية') || q.includes('لاهوائيه') || q.includes('لاهوائية')
    ) {
      return {
        text: isEn
          ? `### 🔬 Coffee Processing Methods Explained:\n\n` +
            `1. **Natural (Dry) Process:** The entire coffee cherry dries under the sun with skin and pulp intact. This infuses intense natural sweetness, berry notes, and full velvety body (like our **Ethiopia Yirgacheffe**).\n\n` +
            `2. **Washed (Wet) Process:** Skin and pulp are depulped, fermented in clean water, and washed clean before drying. Produces an ultra-clean cup with bright, articulate citrus acidity and clarity (like our **Colombia Supremo**).\n\n` +
            `3. **Honey Process:** Skin is removed, but sticky sweet mucilage remains during drying. A magnificent hybrid of washed clarity and natural fruity sweetness!\n\n` +
            `4. **Anaerobic Fermentation:** Sealed in oxygen-free tanks, developing intense exotic tropical notes and winey complexity.`
          : `### 🔬 أسرار معالجات القهوة والفرق بينها:\n\n` +
            `1. **المعالجة المجففة (Natural):** تُجفف حبة البن بكرزتها كاملة تحت أشعة الشمس لأسابيع. تمتص الحبة سكريات الكرزة فتمنحك قواماً ممتلئاً، حلاوة عالية، وإيحاءات الفواكه الناضجة والتوت البري (مثل **إثيوبيا يرجاشيفي** لدينا).\n\n` +
            `2. **المعالجة المغسولة (Washed):** يُنزع لحم الكرزة وتُغسل الحبوب وتتخمر بالماء النقي قبل التجفيف. النتيجة: كوب فائق النقاء (Clean Cup) بحمضية زاهية ومشرقة وإبراز خالص لخصائص التربة (مثل **كولومبيا سوبريمو** لدينا).\n\n` +
            `3. **المعالجة العسلية (Honey Process):** يُنزع القشر الخارجي ويُترك جزء من الصمغ السكري اللزج أثناء التجفيف؛ فتجمع بين حلاوة المجفف ونقاء المغسول المتوازن!\n\n` +
            `4. **التخمير اللاهوائي (Anaerobic):** تخمير الحبوب في براميل محكمة خالية من الأكسجين لإنتاج إيحاءات استوائية ونبيذية فريدة وجريئة.`,
        products: products.slice(0, 2)
      };
    }

    // Arabica vs Robusta
    if (q.includes('ارابيكا') || q.includes('أرابيكا') || q.includes('روبوستا') || q.includes('روبستا')) {
      return {
        text: isEn
          ? `### 🌿 Arabica vs. Robusta Beans:\n\n` +
            `• **100% Arabica:** Grown at high elevations (1000m – 2200m). Rich in natural sugars, complex floral and fruity notes, gentle caffeine content (1.2%), and very gentle on the stomach. **All Caturra coffees are 100% Specialty Arabica!**\n\n` +
            `• **Robusta:** Grown in lowlands, holds double the caffeine (2.4%), high harsh bitterness, and rubbery finish. Mostly used in cheap commercial blends.\n\n` +
            `We never compromise: only pure, hand-picked Specialty Arabica is roasted at Caturra!`
          : `### 🌿 الفرق الجوهري بين الأرابيكا والروبوستا:\n\n` +
            `• **الأرابيكا (Arabica 100%):** تنمو على قمم الجبال الشاهقة (1000 – 2200 متر). غنية بالسكريات والزيوت الطبيعية المعقدة، ذات إيحاءات زهرية وفاكهية وشوكولاتة راقية، ونسبة كافيين معتدلة وخفيفة جداً على المعدة. **جميع محاصيل متجر كاتورا أرابيكا مختصة 100%!**\n\n` +
            `• **الروبوستا (Robusta):** تنمو في المناطق المنخفضة، تحتوي على ضعف نسبة الكافيين ومرارة حادة خشنة، وتستخدم في الخلطات التجارية الرخيصة.\n\n` +
            `في كاتورا، نلتزم بالجودة الفائقة دون أي مساومة لتقديم قهوة نقية تليق بذوقك! ☕✨`,
        products: products.slice(0, 2)
      };
    }

    // Roast Levels (درجات التحميص)
    if (q.includes('تحميص') || q.includes('فاتح') || q.includes('وسط') || q.includes('غامق') || q.includes('roast')) {
      return {
        text: isEn
          ? `### 🔥 Roast Profiles at Caturra:\n\n` +
            `• **Light / Light-Medium Roast:** Preserves the delicate terroir, jasmine florals, and sparkling fruity acidity (our **Ethiopia Yirgacheffe**).\n` +
            `• **Medium Roast:** Balanced body, sweet caramelization, milk chocolate, and smooth finish (our **Colombia Supremo**).\n` +
            `• **Medium-Dark Roast:** Heavy velvety body, dark cocoa, hazelnut, dense crema for espresso and milk drinks (our **Caturra House Blend**).\n\n` +
            `We never over-roast to black charcoal; our roasting highlights the intrinsic sweetness of the bean!`
          : `### 🔥 بروفايلات ودرجات التحميص في محمصة كاتورا:\n\n` +
            `• **تحميص متوسط خفيف (Light-Medium):** يحافظ على الخصائص الطبيعية للمزرعة، الزهور، والحمضية الفاكهية المنعشة (محصول **إثيوبيا يرجاشيفي**).\n` +
            `• **تحميص متوسط (Medium):** التوازن المثالي بين الكرملة السكرية، الشوكولاتة، والقوام السلس (محصول **كولومبيا سوبريمو ويلا**).\n` +
            `• **تحميص متوسط داكن (Medium-Dark):** قوام ثقيل مخملي، شوكولاتة داكنة وبندق، وكريما ذهبية كثيفة تدوم للإسبريسو ومشروبات الحليب (محصول **كاتورا هاوس بليند**).\n\n` +
            `في كاتورا لا نحمص البن لدرجة الحرق الأسود أبداً، بل نبرز الحلاوة الطبيعية الحقيقية للحبة! 🫘✨`,
        products: products.slice(0, 3)
      };
    }

    // Coffee Preservation & Freshness (حفظ القهوة ونضارتها)
    if (q.includes('حفظ') || q.includes('تخزين') || q.includes('تاريخ التحميص') || q.includes('صلاحيه') || q.includes('صلاحية') || q.includes('فريزر') || q.includes('ثلاجه') || q.includes('ثلاجة')) {
      return {
        text: isEn
          ? `### 🫘 How to Store Specialty Coffee Freshness:\n\n` +
            `1. **Keep in Original Valve Bag:** Our triple-layer bags feature a one-way degassing valve that releases CO2 while blocking oxygen from entering.\n` +
            `2. **Dark & Dry Pantry:** Store at cool room temperature away from heat, direct sunlight, and moisture.\n` +
            `3. **NEVER Freeze or Refrigerate Once Opened:** Condensation ruins aromatic oils and coffee beans absorb food smells like a sponge!\n` +
            `4. **Peak Flavor Window:** Best enjoyed between 7 to 60 days from the roast date after proper degassing.`
          : `### 🫘 الطريقة الصحيحة لحفظ القهوة المختصة ونضارتها:\n\n` +
            `1. **احفظها في كيسها الأصلي:** أكياس كاتورا مزودة بصمام تنفيس أحادي الاتجاه (One-way Valve) يطرد غاز ثاني أكسيد الكربون ويمنع دخول الأكسجين.\n` +
            `2. **مكان جاف ومعتم:** احفظ الكيس محكم الإغلاق في دولاب المطبخ بدرجة حرارة الغرفة، بعيداً عن حرارة البوتاجاز وأشعة الشمس المباشرة.\n` +
            `3. **تجنب الثلاجة والفريزر بعد الفتح تماماً:** رطوبة التبريد تدمر الزيوت العطرية، وحبوب البن تمتص روائح الأطعمة كالإسفنج!\n` +
            `4. **ذروة النكهة:** يفضل شرب القهوة بعد راحة أسبوع من تاريخ التحميص (فترة Degassing) وحتى شهرين إلى 3 أشهر.`,
        products: []
      };
    }

    // Acidity / حمضية القهوة
    if (q.includes('حمضيه') || q.includes('حمضية') || q.includes('حموضه') || q.includes('حموضة') || q.includes('acidity')) {
      return {
        text: isEn
          ? `### 🍋 Understanding Specialty Coffee Acidity:\n\n` +
            `Acidity in specialty coffee is **NOT** stomach acid or sourness! It is the lively, crisp fruitiness (like green apple, berries, or sweet orange) that indicates high altitude and premium Arabica quality.\n\n` +
            `• If you **love** fruity citrus sparkle → Choose **Ethiopia Yirgacheffe**.\n` +
            `• If you prefer **low acidity** and rich chocolate/nuts → Choose **Colombia Supremo** or **Caturra House Blend**!`
          : `### 🍋 ما هي حمضية القهوة المختصة؟\n\n` +
            `حمضية القهوة المختصة (Acidity) **ليست** حموضة حرقان معدة أو طعم لاذع منفر! بل هي إشراقة وانتعاش فاكهي طبيعي (يشبه قرمشة التفاح أو حلاوة البرتقال والتوت) يدلك على أن المحصول زُرع على ارتفاعات جبلية شاهقة تفوق 1800 متر.\n\n` +
            `• إذا كنت **عاشقاً للحمضية الفاكهية والزهور** ← خيارك هو **إثيوبيا يرجاشيفي**.\n` +
            `• إذا كنت **تفضل قهوة هادئة بدون أي حموضة وبنكهة شوكولاتة وكراميل** ← خيارك هو **كولومبيا سوبريمو** أو **كاتورا هاوس بليند**!`,
        products: products.slice(0, 2)
      };
    }

    // ==========================================
    // 5. STORE SERVICES, PRICES, SHIPPING & LOGISTICS
    // ==========================================

    // Brewing Calculator trigger
    if (q.includes('حاسبه') || q.includes('حاسبة') || q.includes('نسبه') || q.includes('نسبة') || q.includes('ratio') || q.includes('جرام بن') || q.includes('احسب') || q.includes('calc') || q.includes('brew')) {
      return {
        text: isEn
          ? `I opened the **Interactive Brewing & Ratio Calculator** for you! 🧮✨\nSelect your brewing method (V60, Chemex, Espresso...) and cups count to calculate exact coffee dose, water, and temperatures. You can also tap the "🧮 Brew Calculator" tab at the top anytime!`
          : `لقد فتحت لك **حاسبة استخلاص ونسب القهوة التفاعلية**! 🧮✨\nيمكنك تحديد أداة التحضير (V60، كيمكس، إسبريسو...) وعدد الأكواب لمعرفة كمية البن والماء وحرارة التحضير بدقة متناهية. يمكنك أيضاً الضغط على تبويب "🧮 حاسبة الاستخلاص" بالأعلى في أي وقت!`,
        products: [],
        openCalc: true
      };
    }

    // Price Inquiries
    if (
      q.includes('بكم') || q.includes('بكام') || q.includes('كام') || q.includes('سعر') ||
      q.includes('اسعار') || q.includes('أسعار') || q.includes('price') || q.includes('cost') ||
      q.includes('how much')
    ) {
      const coffeeList = products.filter(p => p.category === 'coffee').slice(0, 3);
      return {
        text: isEn
          ? `Here are current prices for our specialty harvests (250g bag):\n\n${coffeeList.map(p => `• **${p.name}:** ${p.sellingPrice} EGP`).join('\n')}\n\nYou can also enter any custom weight in grams with free custom grind on every order!`
          : `أهلاً بك! إليك أسعار أبرز محاصيل القهوة المختصة الفاخرة لدينا حالياً (سعر العبوة 250 جرام "ربع كيلو"):\n\n${coffeeList.map(p => `• **${p.name}:** ${p.sellingPrice} ج.م`).join('\n')}\n\nكما يتوفر لدينا **طقم تحضير V60 متكامل** بسعر 790 ج.م، و**مطحنة بن يدوية دقيقة** بـ 1150 ج.م، و**بوكس التذوق الرباعي** بـ 850 ج.م!\nتستطيع تحديد أي وزن بالجرام واختيار درجة الطحن لأداتك مجاناً 100%! ☕✨`,
        products: coffeeList
      };
    }

    // Weight & Grinding
    if (q.includes('وزن') || q.includes('جرام') || q.includes('كيلو') || q.includes('طحن') || q.includes('مطحون') || q.includes('حبوب') || q.includes('weight') || q.includes('grind')) {
      return {
        text: isEn
          ? `At Caturra, you have complete control over customizing your coffee: ⚖️🫘\n\n1. **Weight Choices:** Choose 250g, 300g, 500g, 1000g, or enter any custom weight in grams for dynamic pricing!\n2. **Free Custom Grind (100% Free):** Whole bean, Espresso fine, V60 medium, Turkish extra-fine, French press coarse.\n\nClick any product card to calibrate before adding to cart!`
          : `في متجر كاتورا، نتيح لك حرية كاملة لتخصيص قهوتك بدقة: ⚖️🫘\n\n1. **تحديد الوزن:**\n- أوزان جاهزة: 250 جرام (ربع كيلو)، 300ج، 500ج (نصف كيلو)، 1000ج (كيلو).\n- أو اكتب أي وزن مخصص بالجرام كما تحب وسيتم احتساب السعر آلياً بدقة!\n\n2. **اختيار درجة الطحن (مجاناً 100%):**\n- حبوب كاملة (لحفظ النضارة).\n- إسبريسو ناعم.\n- V60 / فلتر متوسط.\n- قهوة تركي فائق النعومة.\n- فرنش برس / كولد برو خشن.\n\nفقط اضغط على المنتج الذي تريده وستظهر لك شاشة المعايرة فوراً!`,
        products: []
      };
    }

    // Shipping & Delivery
    if (q.includes('شحن') || q.includes('توصيل') || q.includes('مدة') || q.includes('محافظات') || q.includes('قاهره') || q.includes('قاهرة') || q.includes('اسكندريه') || q.includes('إسكندرية') || q.includes('shipping')) {
      return {
        text: isEn
          ? `Fast delivery across Egypt 🇪🇬📦:\n\n• **Cairo & Giza:** Within 24 to 48 hours.\n• **Alexandria & Delta:** 2 to 3 business days.\n• **Upper Egypt & Red Sea:** 3 business days.\n• **Free Shipping:** On all orders above 500 EGP!\n\nAll coffee is shipped in triple-layered valve bags flushed to seal in aroma and peak freshness!`
          : `الشحن والتوصيل في كاتورا سريع ومتاح لجميع محافظات جمهورية مصر العربية 🇪🇬📦:\n\n• **القاهرة والجيزة:** التوصيل خلال 24 إلى 48 ساعة كحد أقصى.\n• **الإسكندرية والوجه البحري والقناة:** التوصيل خلال 2 إلى 3 أيام عمل.\n• **الصعيد وباقي المحافظات:** التوصيل خلال 3 أيام عمل.\n• **الشحن مجاني:** لكافة الطلبات التي تزيد عن 500 جنيه!\n\nيتم تغليف القهوة في أكياس صمام تنفيس ثلاثية الطبقات مفرغة من الهواء لضمان النضارة التامة!`,
        products: []
      };
    }

    // Payment Methods & Discount
    if (q.includes('دفع') || q.includes('طرق الدفع') || q.includes('كاش') || q.includes('انستاباي') || q.includes('إنستاباي') || q.includes('فيزا') || q.includes('خصم') || q.includes('كود') || q.includes('كوبون')) {
      return {
        text: isEn
          ? `We offer easy, secure payment methods 💳⚡:\n\n1. **Cash on Delivery (COD):** Pay upon delivery.\n2. **InstaPay:** Instant transfer to our verified account.\n3. **Vodafone Cash:** Fast mobile wallet transfer.\n\n🎁 **Exclusive Discount:** Use promo code **CATURRA10** at checkout for 10% off!`
          : `نوفر لك خيارات دفع متعددة وسهلة تناسبك 💳⚡:\n\n1. **الدفع عند الاستلام (كاش):** تدفع لمندوب الشحن عند استلام وتفقد طلبك.\n2. **إنستاباي (InstaPay):** تحويل فوري ومباشر مع تأكيد سريع.\n3. **فودافون كاش:** تحويل فوري عبر المحفظة الإلكترونية.\n\n🎁 **كود خصم حصري:** استخدم كود الخصم **CATURRA10** في خطوة تأكيد الطلب لتحصل على خصم 10% إضافي فوري!`,
        products: []
      };
    }

    // Direct Contact (الهاتف والواتساب)
    if (q.includes('تواصل') || q.includes('واتس') || q.includes('رقم') || q.includes('تليفون') || q.includes('هاتف') || q.includes('خدمه عملاء') || q.includes('خدمة عملاء')) {
      const phone = contactInfo?.phone || '01033144498';
      const whatsapp = contactInfo?.whatsapp || '01033144498';
      return {
        text: isEn
          ? `We are delighted to speak with you! 📞✨\n\n• **Customer Service Phone:** ${phone}\n• **WhatsApp Direct:** ${whatsapp}\n\nOur team is available daily from 9:00 AM to 11:00 PM to assist you with any inquiries or custom orders.`
          : `يسعدنا جداً تواصلك معنا في أي وقت! 📞✨\n\n• **هاتف خدمة العملاء:** ${phone}\n• **واتساب مباشر:** ${whatsapp}\n\nفريق كاتورا متواجد يومياً من 9:00 صباحاً وحتى 11:00 مساءً للرد على جميع استفساراتكم أو تجهيز الطلبات الخاصة!`,
        products: []
      };
    }

    // ==========================================
    // 6. INVENTORY PRODUCT SEARCH
    // ==========================================
    const matches = products.filter(p => {
      const pName = normalizeAr(p.name);
      const pOrigin = normalizeAr(p.origin);
      const pNotes = normalizeAr(p.notes);
      const pDesc = normalizeAr(p.description);
      return pName.includes(q) || pOrigin.includes(q) || pNotes.includes(q) || pDesc.includes(q);
    });

    if (matches.length > 0) {
      return {
        text: isEn
          ? `Found ${matches.length} matching item(s) for "${rawQ}":\n\nHere are our top available selections with details and prices. Click any product to calibrate weight and grind!`
          : `وجدت لك ${matches.length} منتج يناسب بحثك عن "${rawQ}":\n\nإليك أفضل الخيارات المتوفرة لدينا حالياً مع أسعارها وتفاصيلها. يمكنك الضغط على أي منتج لمعايرته وإضافته لسلتك فوراً!`,
        products: matches.slice(0, 3)
      };
    }

    // ==========================================
    // 7. DEFAULT INTELLIGENT FALLBACK
    // ==========================================
    return {
      text: isEn
        ? `I am delighted to help! As your Caturra AI Barista, feel free to ask me about:\n\n• Exploring world specialty coffee origins (Ethiopia, Colombia, Yemen, Geisha, Kenya).\n• Exact extraction recipes and ratios (V60, Espresso, French Press, Cold Brew).\n• Calibrating custom weights in grams and free grind sizes for your machine.\n• Live shipment tracking via invoice number or phone number.\n\nWhat would you like to explore today? ☕✨`
        : `يسعدني جداً الإجابة على استفسارك يا فندم! بصفتي باريستا كاتورا الذكي، أنا في خدمتك دائماً لمساعدتك في:\n\n• ترشيح محاصيل القهوة المختصة المناسبة لذوقك وأداتك (V60، إسبريسو، فرينش بريس، تركي).\n• تفاصيل ومعلومات أي محصول بن عالمي (مثل الجيشا، البن اليمني، كينيا، كولومبيا، إثيوبيا).\n• الوصفات الدقيقة ونسب الاستخلاص ومراحل الصب والحرارة.\n• تتبع شحنتك لحظة بلحظة برقم الفاتورة أو الهاتف.\n\nإيه اللي تحب نبدأ بيه أو محتاج تسأل عنه؟ ☕✨`,
      products: products.slice(0, 2)
    };
  };

  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || input).trim();
    if (!query) return;

    // Check if query is looking for an invoice directly
    const invoiceMatch = findInvoiceMatch(query);

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: query,
      time: new Date().toLocaleTimeString(isEn ? 'en-US' : 'ar-EG-u-nu-latn', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);
    playNotificationSound();

    let replyData = null;

    // 1. If user provided a specific invoice match or tracking search, handle locally with tracking card
    if (invoiceMatch) {
      replyData = {
        text: isEn
          ? `Found your order successfully! 📦✨\nHere are the shipment details for invoice **#${invoiceMatch.invoiceNumber}** for **${invoiceMatch.customerName || 'Caturra Customer'}**:`
          : `عثرت على طلبك بنجاح! 📦✨\nإليك تفاصيل الشحنة الخاصة بالفاتورة **#${invoiceMatch.invoiceNumber}** باسم **${invoiceMatch.customerName || 'عميل كاتورا'}**:`,
        invoice: invoiceMatch,
        products: []
      };
    } 
    // 2. Otherwise try Google Gemini API if key is available
    else if (hasGeminiKey) {
      try {
        const geminiRes = await askGeminiBarista({
          prompt: query,
          history: messages,
          apiKey: contactInfo?.geminiApiKey,
          products,
          contactInfo,
          language
        });

        if (geminiRes && geminiRes.text) {
          replyData = geminiRes;
        }
      } catch (err) {
        console.warn('Gemini call fallback to local:', err);
      }
    }

    // 3. Fallback to Local AI Engine if no Gemini reply
    if (!replyData) {
      replyData = generateLocalAiReply(query, messages);
    }

    setTimeout(() => {
      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: replyData?.text || (isEn ? 'How can I assist you further with our specialty coffee lots?' : 'كيف يمكنني مساعدتك أكثر بخصوص محاصيل القهوة المختصة؟'),
        products: replyData?.products || [],
        invoice: replyData?.invoice || null,
        isGemini: Boolean(replyData?.isGemini),
        time: new Date().toLocaleTimeString(isEn ? 'en-US' : 'ar-EG-u-nu-latn', { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
      vibratePhone([60, 40, 60]);

      if (replyData?.openCalc) {
        setTimeout(() => setActiveTab('calculator'), 800);
      }

      if (!activeIsOpen) setHasUnread(true);
    }, 450);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 1,
        sender: 'bot',
        text: isEn
          ? 'Conversation reset! ✨🌿\nI am Caturra AI Barista, ready to assist you with coffee recommendations, brew ratios, or tracking your shipments.'
          : 'تمت إعادة ضبط المحادثة! ✨🌿\nأنا باريستا كاتورا الذكي جاهز لمساعدتك في أي استفسار، حساب نسب الاستخلاص، أو تتبع طلباتك.',
        products: [],
        invoice: null,
        time: isEn ? 'Now' : 'الآن'
      }
    ]);
  };

  // Called when recipe is sent from the BrewingCalculator component
  const handleRecipeReceivedFromCalc = (recipeText) => {
    setActiveTab('chat');
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: isEn ? 'Custom extraction recipe request 🧮✨' : 'طلب حساب وصفة استخلاص مخصصة 🧮✨',
      time: new Date().toLocaleTimeString(isEn ? 'en-US' : 'ar-EG-u-nu-latn', { hour: '2-digit', minute: '2-digit' })
    };
    const botMsg = {
      id: Date.now() + 1,
      sender: 'bot',
      text: recipeText,
      products: [],
      time: new Date().toLocaleTimeString(isEn ? 'en-US' : 'ar-EG-u-nu-latn', { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg, botMsg]);
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
            className="store-ai-speech-bubble"
            style={{
              background: 'linear-gradient(135deg, #2C1810 0%, #4A3220 100%)',
              color: '#ffffff',
              padding: '8px 12px',
              borderRadius: '14px',
              boxShadow: '0 8px 20px rgba(44, 24, 16, 0.25)',
              border: '1px solid #EDD9BD',
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
              <Sparkles size={13} style={{ color: '#C49A5C' }} />
            </div>
            <div style={{ lineHeight: '1.3', textAlign: isRtl ? 'right' : 'left' }}>
              <div style={{ fontSize: '0.66rem', color: '#EDD9BD' }}>
                {isEn ? 'Caturra AI Barista' : 'باريستا كاتورا الذكي (AI)'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                <span>{isEn ? 'Need help or track order?' : 'محتاج مساعدة أو تتبع طلبك؟'}</span>
                <Coffee size={13} color="#C49A5C" />
              </div>
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
              title={isEn ? 'Dismiss' : 'إغلاق التنبيه'}
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
                background: '#4A3220',
                transform: 'rotate(45deg)',
                borderBottom: '1px solid #EDD9BD',
                borderRight: '1px solid #EDD9BD'
              }}
            />
          </div>
        )}

        {/* MAIN CAPSULE LAUNCHER BUTTON */}
        <button
          onClick={() => {
            toggleOpen(!activeIsOpen);
            setShowPromoBadge(false);
          }}
          className="store-ai-launcher-btn"
          style={{
            background: 'linear-gradient(135deg, #2C1810 0%, #4A3220 100%)',
            color: '#FFFDF9',
            border: '1.5px solid #EDD9BD',
            borderRadius: '9999px',
            padding: activeIsOpen ? '8px' : '7px 14px',
            boxShadow: '0 6px 20px rgba(44, 24, 16, 0.3), 0 0 12px rgba(196, 154, 92, 0.25)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: '800',
            fontSize: '0.78rem',
            transition: 'all 250ms cubic-bezier(0.4, 0, 0.2, 1)',
            transform: activeIsOpen ? 'scale(0.95)' : 'scale(1)'
          }}
          title={activeIsOpen
            ? (isEn ? 'Close Assistant' : 'إغلاق المساعد')
            : (isEn ? 'Chat with Caturra AI Barista' : 'تحدث مع باريستا كاتورا الذكي')}
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
                    background: hasGeminiKey ? '#60a5fa' : '#C49A5C',
                    boxShadow: `0 0 6px ${hasGeminiKey ? '#60a5fa' : '#C49A5C'}`,
                    border: '1.5px solid #2C1810'
                  }}
                />
              </div>
              <span>
                {isEn
                  ? `Caturra AI Barista ${hasGeminiKey ? '(Gemini AI)' : '(AI)'}`
                  : `مساعد كاتورا الذكي ${hasGeminiKey ? '(Gemini AI)' : '(AI)'}`}
              </span>
              <Sparkles size={13} style={{ color: '#C49A5C' }} />
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
            width: 'min(420px, calc(100vw - 32px))',
            height: 'min(620px, calc(100vh - 90px))',
            background: '#FFFDF9',
            borderRadius: '24px',
            boxShadow: '0 20px 50px rgba(74, 50, 32, 0.25), 0 0 25px rgba(196, 154, 92, 0.15)',
            zIndex: 95,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'slideUp 250ms cubic-bezier(0.16, 1, 0.3, 1)',
            border: '1.5px solid #EDD9BD',
            direction: isRtl ? 'rtl' : 'ltr'
          }}
        >
          {/* 1. CHAT HEADER */}
          <div
            style={{
              background: 'linear-gradient(135deg, #2C1810 0%, #4A3220 100%)',
              color: '#ffffff',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 4px 15px rgba(44, 24, 16, 0.25)',
              borderBottom: '1px solid #EDD9BD'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'rgba(196, 154, 92, 0.2)',
                  backdropFilter: 'blur(8px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1.5px solid rgba(196, 154, 92, 0.4)',
                  position: 'relative',
                  flexShrink: 0
                }}
              >
                <Bot size={22} style={{ color: '#FFFDF9' }} />
                <span
                  style={{
                    position: 'absolute',
                    bottom: '-2px',
                    left: '-2px',
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: hasGeminiKey ? '#38bdf8' : '#C49A5C',
                    boxShadow: `0 0 8px ${hasGeminiKey ? '#38bdf8' : '#C49A5C'}`,
                    border: '2px solid #2C1810'
                  }}
                  title={isEn ? 'Online' : 'متصل الآن'}
                />
              </div>

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: '900', color: '#FFFDF9' }}>
                    {isEn ? 'Caturra AI Barista' : 'باريستا كاتورا الذكي'}
                  </h4>
                  <span
                    style={{
                      background: hasGeminiKey ? 'rgba(56, 189, 248, 0.2)' : 'rgba(196, 154, 92, 0.25)',
                      color: hasGeminiKey ? '#7dd3fc' : '#EDD9BD',
                      border: `1px solid ${hasGeminiKey ? 'rgba(56, 189, 248, 0.4)' : 'rgba(196, 154, 92, 0.4)'}`,
                      padding: '1px 6px',
                      borderRadius: '9999px',
                      fontSize: '0.64rem',
                      fontWeight: '800'
                    }}
                  >
                    {hasGeminiKey ? 'Gemini 2.0 AI ⚡' : 'AI Agent'}
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', color: '#EDD9BD', marginTop: '2px' }}>
                  {isEn ? 'Specialty Coffee Guide & Order Tracking' : 'خبير القهوة المختصة وتتبع الطلبات'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {/* Reset Chat */}
              <button
                onClick={handleResetChat}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: '#FFFDF9',
                  width: '30px',
                  height: '30px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title={isEn ? 'Reset Conversation' : 'إعادة ضبط المحادثة'}
              >
                <RotateCcw size={15} />
              </button>

              {/* Close */}
              <button
                onClick={() => toggleOpen(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  color: '#FFFDF9',
                  width: '30px',
                  height: '30px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title={isEn ? 'Minimize' : 'تصغير'}
              >
                <ChevronDown size={17} />
              </button>
            </div>
          </div>

          {/* 2. TOP VIEW TABS (المحادثة vs حاسبة الاستخلاص) */}
          <div
            style={{
              display: 'flex',
              background: '#FFF8EE',
              borderBottom: '1px solid #EDD9BD',
              padding: '4px 8px',
              gap: '6px'
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('chat')}
              style={{
                flex: 1,
                background: activeTab === 'chat' ? '#FFFDF9' : 'transparent',
                border: activeTab === 'chat' ? '1px solid #EDD9BD' : '1px solid transparent',
                color: activeTab === 'chat' ? '#96663B' : '#8A654C',
                padding: '6px 10px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.15s'
              }}
            >
              <MessageCircle size={14} />
              <span>{isEn ? 'Chat & Inquiries' : 'المحادثة والاستفسارات'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('calculator')}
              style={{
                flex: 1,
                background: activeTab === 'calculator' ? '#FFFDF9' : 'transparent',
                border: activeTab === 'calculator' ? '1px solid #EDD9BD' : '1px solid transparent',
                color: activeTab === 'calculator' ? '#96663B' : '#8A654C',
                padding: '6px 10px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                transition: 'all 0.15s'
              }}
            >
              <Calculator size={14} />
              <span>{isEn ? '🧮 Brew Calculator' : '🧮 حاسبة الاستخلاص'}</span>
            </button>
          </div>

          {/* 3. MAIN BODY (CHAT OR CALCULATOR) */}
          {activeTab === 'calculator' ? (
            <div style={{ flex: 1, overflowY: 'auto', background: '#FFFDF9' }}>
              <BrewingCalculator onSendRecipeToChat={handleRecipeReceivedFromCalc} />
            </div>
          ) : (
            <>
              {/* CHAT MESSAGES CONTAINER */}
              <div
                style={{
                  flex: 1,
                  padding: '14px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  background: '#FFFDF9'
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
                        maxWidth: '90%',
                        padding: '11px 15px',
                        borderRadius: msg.sender === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                        background: msg.sender === 'user'
                          ? 'linear-gradient(135deg, #96663B 0%, #7A5230 100%)'
                          : '#FFF8EE',
                        color: msg.sender === 'user' ? '#ffffff' : '#4A3220',
                        boxShadow: msg.sender === 'user'
                          ? '0 3px 12px rgba(150, 102, 59, 0.25)'
                          : '0 3px 12px rgba(74, 50, 32, 0.08)',
                        border: msg.sender === 'user' ? 'none' : '1.5px solid #EDD9BD',
                        fontSize: '0.86rem',
                        lineHeight: '1.65',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      }}
                    >
                      {/* Markdown-style bold rendering */}
                      {msg.text.split('\n').map((line, i) => (
                        <div key={i} style={{ marginBottom: line === '' ? '6px' : '2px' }}>
                          {line.split('**').map((part, pIdx) =>
                            pIdx % 2 === 1 ? (
                              <strong key={pIdx} style={{ color: msg.sender === 'user' ? '#ffffff' : '#96663B' }}>
                                {part}
                              </strong>
                            ) : (
                              part
                            )
                          )}
                        </div>
                      ))}

                      {/* 📦 INTERACTIVE ORDER TRACKING CARD IN CHAT 📦 */}
                      {msg.invoice && (
                        <div
                          style={{
                            marginTop: '12px',
                            background: '#FFF8EE',
                            border: '1.5px solid #EDD9BD',
                            borderRadius: '14px',
                            padding: '12px',
                            boxShadow: 'var(--h-shadow-sm)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', borderBottom: '1px dashed #EDD9BD', paddingBottom: '6px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Package size={16} color="#96663B" />
                              <strong style={{ color: '#4A3220', fontSize: '0.86rem' }}>
                                {isEn ? `Invoice #${msg.invoice.invoiceNumber}` : `فاتورة #${msg.invoice.invoiceNumber}`}
                              </strong>
                            </div>
                            <span style={{ fontSize: '0.74rem', color: '#8A654C' }}>
                              {msg.invoice.createdAt ? new Date(msg.invoice.createdAt).toLocaleDateString(isEn ? 'en-US' : 'ar-EG') : (isEn ? 'Today' : 'اليوم')}
                            </span>
                          </div>

                          {/* Customer & Total Info */}
                          <div style={{ fontSize: '0.78rem', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#5C3D2E' }}>
                              {isEn ? 'Customer: ' : 'العميل: '}
                              <strong>{msg.invoice.customerName || (isEn ? 'Caturra Customer' : 'عميل كاتورا')}</strong>
                            </span>
                            <span style={{ color: '#5B8C5A', fontWeight: '800' }}>
                              {formatPrice ? formatPrice(msg.invoice.finalTotal || msg.invoice.total, language) : (isEn ? `${msg.invoice.finalTotal || msg.invoice.total} EGP` : `${msg.invoice.finalTotal || msg.invoice.total} ج.م`)}
                            </span>
                          </div>

                          {/* Stepper Status Progress */}
                          <div style={{ margin: '10px 0', background: '#FFFDF9', borderRadius: '10px', padding: '8px 10px', border: '1px solid #EDD9BD' }}>
                            <div style={{ fontSize: '0.72rem', color: '#8A654C', marginBottom: '6px', fontWeight: '700' }}>
                              {isEn ? 'Current Order Status:' : 'حالة الطلب الحالية:'}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '4px' }}>
                              {[
                                { label: isEn ? 'Received' : 'استلام', code: 'received' },
                                { label: isEn ? 'Roasting' : 'تجهيز', code: 'processing' },
                                { label: isEn ? 'Shipped' : 'شحن', code: 'shipped' },
                                { label: isEn ? 'Delivered' : 'تسليم', code: 'delivered' }
                              ].map((step, sIdx) => {
                                const currentStatus = msg.invoice.orderStatus || msg.invoice.status || 'received';
                                const statusIdx = currentStatus === 'delivered' ? 3 : currentStatus === 'shipped' ? 2 : currentStatus === 'processing' ? 1 : 0;
                                const isPassed = sIdx <= statusIdx;
                                const isCurrent = sIdx === statusIdx;

                                return (
                                  <div key={step.code} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                                    <div style={{
                                      width: '18px',
                                      height: '18px',
                                      borderRadius: '50%',
                                      background: isPassed ? '#5B8C5A' : '#EDD9BD',
                                      color: isPassed ? '#ffffff' : '#8A654C',
                                      fontSize: '0.65rem',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontWeight: '900',
                                      border: isCurrent ? '2px solid #3d6a3c' : '1px solid #EDD9BD'
                                    }}>
                                      {isPassed ? '✓' : sIdx + 1}
                                    </div>
                                    <span style={{ fontSize: '0.66rem', color: isPassed ? '#3d6a3c' : '#8A654C', marginTop: '2px', fontWeight: '700' }}>
                                      {step.label}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Quick action button to open full tracking modal */}
                          {openTrackingModal && (
                            <button
                              type="button"
                              onClick={() => {
                                openTrackingModal(msg.invoice.id, msg.invoice.invoiceNumber);
                                toggleOpen(false);
                              }}
                              style={{
                                width: '100%',
                                background: 'linear-gradient(135deg, #5B8C5A 0%, #3d6a3c 100%)',
                                border: 'none',
                                color: '#ffffff',
                                borderRadius: '8px',
                                padding: '6px 10px',
                                fontSize: '0.74rem',
                                fontWeight: '800',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                marginTop: '6px'
                              }}
                            >
                              <Truck size={13} />
                              <span>{isEn ? 'Detailed Tracking & Courier Route' : 'تتبع الشحنة بالتفصيل وموقع المندوب'}</span>
                            </button>
                          )}
                        </div>
                      )}

                      {/* RECOMMENDED PRODUCTS PREVIEW CARDS */}
                      {msg.products && msg.products.length > 0 && (
                        <div
                          style={{
                            marginTop: '10px',
                            paddingTop: '8px',
                            borderTop: '1px dashed #EDD9BD',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                          }}
                        >
                          <div
                            style={{
                              fontSize: '0.74rem',
                              fontWeight: '800',
                              color: '#96663B',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px'
                            }}
                          >
                            <Sparkles size={13} />
                            <span>{isEn ? 'Instant Recommendations:' : 'ترشيحات فورية من المتجر:'}</span>
                          </div>

                          {msg.products.map(prod => (
                            <div
                              key={prod.id}
                              style={{
                                background: '#FFFDF9',
                                borderRadius: '12px',
                                padding: '8px 10px',
                                border: '1px solid #EDD9BD',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '10px',
                                boxShadow: 'var(--h-shadow-sm)'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <img
                                  src={prod.image || '/caturra_ethiopia.jpg'}
                                  alt={prod.name}
                                  style={{
                                    width: '38px',
                                    height: '38px',
                                    borderRadius: '8px',
                                    objectFit: 'cover',
                                    border: '1px solid #EDD9BD'
                                  }}
                                  onError={(e) => { e.target.src = '/caturra_ethiopia.jpg'; }}
                                />
                                <div>
                                  <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#4A3220', lineHeight: '1.3' }}>
                                    {prod.name}
                                  </div>
                                  <div style={{ fontSize: '0.72rem', color: '#96663B', fontWeight: '800' }}>
                                    {formatPrice ? formatPrice(prod.sellingPrice, language) : (isEn ? `${prod.sellingPrice} EGP` : `${prod.sellingPrice} ج.م`)} {prod.unitType === 'weight' ? (isEn ? '/ 250g' : '/ 250ج') : ''}
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
                                    background: 'linear-gradient(135deg, #96663B 0%, #7A5230 100%)',
                                    border: 'none',
                                    color: '#ffffff',
                                    borderRadius: '8px',
                                    padding: '5px 9px',
                                    fontSize: '0.72rem',
                                    fontWeight: '800',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    whiteSpace: 'nowrap'
                                  }}
                                  title={isEn ? 'Calibrate & Add to Cart' : 'معايرة وإضافة للسلة'}
                                >
                                  <ShoppingBag size={12} />
                                  <span>{isEn ? 'Order Now' : 'اطلب الآن'}</span>
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Timestamp & Model badge */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', margin: '0 4px' }}>
                      <span style={{ fontSize: '0.66rem', color: '#8A654C' }}>
                        {msg.time}
                      </span>
                      {msg.isGemini && (
                        <span style={{ fontSize: '0.62rem', color: '#38bdf8', fontWeight: '700' }}>
                          ⚡ Gemini AI
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {/* TYPING INDICATOR */}
                {isTyping && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px' }}>
                    <div
                      style={{
                        background: '#FFF8EE',
                        padding: '7px 12px',
                        borderRadius: '14px',
                        border: '1px solid #EDD9BD',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <Bot size={13} style={{ color: '#96663B' }} />
                      <span style={{ fontSize: '0.76rem', color: '#5C3D2E' }}>
                        {isEn ? 'Caturra Barista is typing...' : 'باريستا كاتورا يكتب...'}
                      </span>
                      <div style={{ display: 'flex', gap: '3px' }}>
                        <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#96663B', animation: 'pulseGlow 1s infinite' }} />
                        <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#96663B', animation: 'pulseGlow 1s infinite 200ms' }} />
                        <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#96663B', animation: 'pulseGlow 1s infinite 400ms' }} />
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* QUICK PROMPT PILLS */}
              <div
                style={{
                  padding: '8px 12px',
                  background: '#FFF8EE',
                  borderTop: '1px solid #EDD9BD',
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
                    onClick={() => {
                      if (q.action === 'open_calc') {
                        setActiveTab('calculator');
                      } else {
                        handleSendMessage(q.query);
                      }
                    }}
                    style={{
                      background: q.action === 'open_calc' ? 'linear-gradient(135deg, #96663B 0%, #7A5230 100%)' : '#FFFDF9',
                      border: '1px solid #EDD9BD',
                      color: q.action === 'open_calc' ? '#ffffff' : '#4A3220',
                      borderRadius: '9999px',
                      padding: '4px 10px',
                      fontSize: '0.74rem',
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
                  padding: '10px 12px',
                  background: '#FFF8EE',
                  borderTop: '1px solid #EDD9BD',
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
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (input.trim()) handleSendMessage();
                    }
                  }}
                  placeholder={isEn ? 'Ask about any bean or enter invoice # to track...' : 'اسأل عن أي محصول، أو اكتب رقم الفاتورة لتتبع طلبك...'}
                  style={{
                    flex: 1,
                    padding: '9px 12px',
                    borderRadius: '12px',
                    border: '1.5px solid #EDD9BD',
                    outline: 'none',
                    fontSize: '0.84rem',
                    fontFamily: 'inherit',
                    background: '#FFFDF9',
                    color: '#4A3220'
                  }}
                />

                <button
                  type="submit"
                  disabled={!input.trim()}
                  onClick={(e) => {
                    e.preventDefault();
                    if (input.trim()) handleSendMessage();
                  }}
                  style={{
                    background: input.trim()
                      ? 'linear-gradient(135deg, #96663B 0%, #7A5230 100%)'
                      : '#EDD9BD',
                    color: input.trim() ? '#ffffff' : '#8A654C',
                    border: 'none',
                    borderRadius: '12px',
                    width: '38px',
                    height: '38px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: input.trim() ? 'pointer' : 'default',
                    transition: 'all 150ms',
                    flexShrink: 0
                  }}
                  title={isEn ? 'Send' : 'إرسال'}
                >
                  <Send size={16} style={{ transform: isRtl ? 'rotate(180deg)' : 'none' }} />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
};
