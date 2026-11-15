// Google Gemini AI Client for Caturra Specialty Coffee Barista
// Connects to Gemini 2.0 Flash / 1.5 Flash via official REST API

export const testGeminiApiKey = async (apiKey) => {
  if (!apiKey || !apiKey.trim()) {
    return { success: false, error: 'يرجى إدخال مفتاح API أولاً' };
  }

  const cleanKey = apiKey.trim();
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${cleanKey}`;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'مرحبا، للتجربة فقط أجب بكلمة واحدة: متصل' }] }],
        generationConfig: { maxOutputTokens: 20 }
      })
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      const msg = errData?.error?.message || `خطأ ${response.status}: تأكد من صحة المفتاح`;
      return { success: false, error: msg };
    }

    const data = await response.json();
    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return { success: true, reply };
  } catch (err) {
    return { success: false, error: 'تعذر الاتصال بـ Google Gemini (تحقق من اتصال الإنترنت)' };
  }
};

export const askGeminiBarista = async ({
  prompt,
  history = [],
  apiKey,
  products = [],
  contactInfo = {},
  language = 'ar'
}) => {
  const activeKey = apiKey || (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_GEMINI_API_KEY : '');
  if (!activeKey || !activeKey.trim()) {
    return null; // Signals fallback to local engine
  }

  const cleanKey = activeKey.trim();

  // Prepare condensed product inventory for Gemini context
  const catalogSummary = (products || []).slice(0, 15).map(p => ({
    name: p.name,
    category: p.category,
    price: language === 'en' ? `${p.sellingPrice} EGP` : `${p.sellingPrice} ج.م`,
    origin: p.origin || '',
    notes: p.notes || '',
    desc: p.description || ''
  }));

  const isEn = language === 'en';

  const systemInstructionText = isEn
    ? `You are "Caturra AI Assistant", the expert specialty coffee connoisseur and virtual assistant for "Caturra Specialty Coffee" (محمصة ومتجر كاتورا للقهوة المختصة) in Egypt.

Identity & Personality:
- Professional, warm, hospitable, and conversational Egyptian specialty coffee barista.
- Highly knowledgeable in coffee genetics, origins, processing methods (washed, natural, anaerobic), roast profiles, grind sizes, and extraction ratios.
- Conversational & Interactive: If the customer chats casually (e.g., says "hey", "tell me", "excuse me"), answer warmly and naturally (e.g., "Go ahead! I'm listening, how can I help you today? ☕✨").

Caturra Available In-Stock Catalog:
${JSON.stringify(catalogSummary, null, 2)}

Store Operational Details:
- Shipping: Fast delivery all across Egypt (Cairo & Giza: 24-48h, other governorates: 2-3 business days). Free delivery on orders over 500 EGP.
- Payment Methods: Cash on Delivery (COD), InstaPay, Bank Cards (Visa/Mastercard/Meeza).
- Free Grinding: 100% free custom grind for any brew method (V60, Espresso, French Press, Turkish, Chemex, Cold Brew) or whole beans.
- Discount Code: "CATURRA10" for 10% off.
- Order Tracking: Customer can track shipment anytime by providing their invoice number or phone number.
- Weights: 250g, 300g, 500g, 1000g, or any custom weight in grams.

CRITICAL RULES:
1. Interactive & Natural: Never give robotic, repetitive answers. Listen and react specifically to what the user asked.
2. Un-Stocked / Other Coffee Origins (Geisha, Yemen, Blue Mountain, Kenya AA, Costa Rica, Guatemala, Sumatra, Hawaii Kona, Decaf, etc.):
   - If asked about ANY coffee bean, origin, or variety that is NOT in Caturra's available catalog:
     1) Thoroughly describe what this coffee is (origin, famous flavor notes, altitude, processing, why people love it).
     2) Clearly and politely state at the end that it is currently OUT OF STOCK / NOT AVAILABLE at Caturra right now:
        "⚠️ **Note:** This origin/crop is currently not available at Caturra."
     3) Proactively suggest the closest in-stock match from Caturra's catalog (e.g. recommend Ethiopia Yirgacheffe if they asked about Geisha or Kenya; recommend Colombia Supremo or Caturra House Blend if they asked about chocolate/nutty profiles).
3. Brewing & Recipes: Always give exact brew ratios (e.g., 1:15 or 1:16 for V60, 1:2 for espresso), water temperature in °C, and steps.`
    : `أنت "مساعد كاتورا الذكي (Caturra AI Assistant)"، خبير القهوة المختصة والمساعد الذكي لمحمصة ومتجر "كاتورا للقهوة المختصة (Caturra Specialty Coffee)" في مصر.

هويتك وشخصيتك وأسلوبك:
- باريستا مصري محترف، شغوف جداً، ودود، لبق، ومرحب للغاية. تتحدث بأسلوب دافئ وحيوي ولهجة مصرية مهذبة أو عربية مبسطة راقية.
- تستخدم إيموجيات معبرة عن القهوة (☕، 🌿، ✨، 🫘).
- تفاعلي وطبيعي: ترد على كلام العميل وتحياته باحترافية وتلقائية، وليس بإجابات محفوظة. إذا قال العميل كلمة دارجة مثل: "بقولك" أو "بقولك ايه" رد فوراً بلباقة: "اتفضل يا فندم معاك، أؤمرني! ☕✨ إيه اللي في بالك ومحتاج تسأل عنه؟". وإذا قال "سلام عليكم"، "صباح الخير"، "مساء الورد"، "شكراً"، "معلش"، رد عليه بود حقيقي.

قائمة منتجات متجر كاتورا المتوفرة حالياً في المخزن:
${JSON.stringify(catalogSummary, null, 2)}

معلومات المتجر الفعلية والخدمات:
- الشحن: شحن سريع لكافة محافظات مصر (القاهرة والجيزة: 24-48 ساعة، باقي المحافظات: 2-3 أيام عمل). شحن مجاني لأي طلب يتجاوز 500 جنيه.
- طرق الدفع: دفع عند الاستلام (كاش)، إنستاباي (InstaPay)، ومحافظ فودافون كاش.
- درجات الطحن: الطحن مجاني 100% لأي أداة (V60، إسبريسو، تركي، فرينش بريس، كيمكس، كولد برو) أو حبوب كاملة.
- كود الخصم الحصري: كود "CATURRA10" لخصم 10% إضافي.
- تتبع الشحنات: يمكن للعميل كتابة رقم الفاتورة (مثلاً INV-001) أو رقم هاتفه لعرض بطاقة التتبع الحية.
- الأوزان المتاحة: 250 جم، 300 جم، 500 جم، 1000 جم، أو أي وزن بالجرام يحدده العميل.

قواعد ذهبية ملزمة (مهمة جداً):
1. الرد الفعلي على الأسئلة: لا تكرر إجابات ثابتة أو محفوظة. أجب بدقة على السؤال المطروح سواء كان عن طرق التحضير، درجات التحميص، المعالجات (مجففة/مغسولة)، الحموضة، أو حفظ البن.
2. قاعدة الاستفسار عن محاصيل أو أنواع بن غير متوفرة بالمتجر (مثل: بن جيشا Geisha، بن يمني / مطري، كينيا AA، جامايكا بلو ماونتن، كوستاريكا، جواتيمالا، سومطرة، هاواي كونا، بن خالي كافيين Decaf، بن أخضر، كبسولات نسبريسو، بن روبوستا):
   - إذا سأل العميل عن أي محصول أو نوع بن غير موجود في قائمة المنتجات المتوفرة لكاتورا:
     أولاً: اشرح له تفاصيل هذا المحصول بإسهاب وبراعة باريستا خبير (موطنه، سلالته، إيحاءاته ونكهاته، أسلوب معالجته، وسر شهرته).
     ثانياً: وضّح له في نهاية الإجابة بكل لباقة ووضوح أنه غير متوفر حالياً في متجر كاتورا:
     "⚠️ **تنويه:** هذا المحصول غير متوفر لدينا في كاتورا حالياً."
     ثالثاً: رشح له البديل الأقرب المتوفر حالياً في كاتورا ووضح له وجه الشبه (مثلاً: رشح "إثيوبيا يرجاشيفي" لمن يسأل عن الجيشا أو كينيا لطابعهما الزهري والفاكهي الساحر؛ ورشح "كولومبيا سوبريمو" أو "كاتورا هاوس بليند" لمن يسأل عن إيحاءات الشوكولاتة والتوابل والقوام الكثيف).
3. وصفات الاستخلاص: زود العميل بالنسب الدقيقة (Brew Ratio)، درجة حرارة الماء، وحجم الطحنة، ومراحل الصب بالتفصيل.`;

  // Build conversational turns for Gemini
  const formattedContents = [];

  // Recent history (last 6 messages max to preserve token limits)
  const recentHistory = (history || []).slice(-6);
  recentHistory.forEach(m => {
    if (m.text && typeof m.text === 'string') {
      formattedContents.push({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      });
    }
  });

  // Add the current prompt
  formattedContents.push({
    role: 'user',
    parts: [{ text: prompt }]
  });

  const requestBody = {
    contents: formattedContents,
    systemInstruction: {
      parts: [{ text: systemInstructionText }]
    },
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 600
    }
  };

  // Primary model: gemini-2.0-flash, Fallback: gemini-1.5-flash
  const models = ['gemini-2.0-flash', 'gemini-1.5-flash'];

  for (const modelName of models) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${cleanKey}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (res.ok) {
        const data = await res.json();
        const replyText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (replyText) {
          // Detect matching products mentioned in Gemini's response
          const matchedProducts = (products || []).filter(p => {
            const nameLower = (p.name || '').toLowerCase();
            const originLower = (p.origin || '').toLowerCase();
            return (
              (nameLower.length > 3 && replyText.toLowerCase().includes(nameLower)) ||
              (originLower.length > 3 && replyText.toLowerCase().includes(originLower))
            );
          }).slice(0, 3);

          return {
            text: replyText,
            products: matchedProducts,
            isGemini: true,
            model: modelName
          };
        }
      }
    } catch (err) {
      console.warn(`Gemini API attempt with ${modelName} failed:`, err);
    }
  }

  return null; // Fallback to local engine
};
