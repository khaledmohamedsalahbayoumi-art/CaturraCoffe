// Initial seed data for Caturra Specialty Coffee ERP & Store - مصري 100%
export const initialCategories = [
  { id: 'all', name: 'الكل' },
  { id: 'coffee', name: 'بن مختص' },
  { id: 'tools', name: 'أدوات التحضير' },
  { id: 'accessories', name: 'أكواب وإكسسوارات' },
  { id: 'boxes', name: 'بوكسات وهدايا' },
  { id: 'syrups', name: 'نكهات وسيروب' },
];

export const initialProducts = [
  {
    id: 'prod-1',
    name: 'إثيوبيا يرجاشيفي - كبسولة النكهات',
    nameEn: 'Ethiopia Yirgacheffe Specialty',
    category: 'coffee',
    sku: 'CAT-ETH-01',
    barcode: '622100100001',
    unitType: 'weight', // 'weight' (جرام / كجم) | 'piece' (قطعة)
    pricePerKg: 1280,   // سعر الكيلو
    costPerKg: 760,     // تكلفة الكيلو
    costPrice: 190,     // تكلفة ربع كيلو (250g)
    sellingPrice: 320,  // سعر ربع كيلو (250g)
    stockGram: 35000,   // 35,000 جرام = 35 كيلو
    stock: 35,          // بالكيلو
    minStockAlert: 5,   // بالـ كجم
    image: '/caturra_ethiopia.jpg',
    origin: 'إثيوبيا - منطقة يرجاشيفي',
    roastLevel: 'تحميص متوسط خفيف',
    notes: 'ياسمين، توت بري، حمضيات ناعمة',
    weight: '250g',
    description: 'محصول إثيوبي فاخر بمعالجة مجففة يبرز الإيحاءات الزهرية والفاكهية الفاخرة.',
    expiryDate: '2027-02-15',
    entryDate: '2026-08-10',
    salesCount: 142
  },
  {
    id: 'prod-2',
    name: 'كولومبيا سوبريمو ويلا',
    nameEn: 'Colombia Supremo Huila',
    category: 'coffee',
    sku: 'CAT-COL-02',
    barcode: '622100100002',
    unitType: 'weight',
    pricePerKg: 1120,
    costPerKg: 640,
    costPrice: 160,
    sellingPrice: 280,
    stockGram: 28000, // 28 كيلو
    stock: 28,
    minStockAlert: 5,
    image: '/caturra_colombia.jpg',
    origin: 'كولومبيا - مقاطعة ويلا',
    roastLevel: 'تحميص متوسط',
    notes: 'حمضيات، سكر بني، كراميل متوازن',
    weight: '250g',
    description: 'محصول كولومبي متوازن القوام مثالي لمشروبات الإسبريسو ومشروبات الحليب.',
    expiryDate: '2027-03-20',
    entryDate: '2026-08-15',
    salesCount: 189
  },
  {
    id: 'prod-3',
    name: 'طقم تحضير V60 متكامل مع سيرفر وقمع سيراميك',
    nameEn: 'Caturra V60 Ceramic Pour-over Set',
    category: 'tools',
    sku: 'CAT-TOOL-01',
    barcode: '622100200001',
    unitType: 'piece',
    costPrice: 450,
    sellingPrice: 790,
    stock: 15,
    stockGram: 0,
    minStockAlert: 5,
    image: '/v60_set.jpg',
    origin: 'اليابان / تايوان',
    roastLevel: 'أدوات تقطير',
    notes: 'قمع سيراميك أخضر أنيق، سيرفر زجاجي 600 مل، 100 فلتر ورقي',
    weight: 'طقم كامل',
    description: 'طقم V60 الفاخر بلون الأخضر المميز لعلامة كاتورا لاستخلاص نقي ومتناسق.',
    expiryDate: '2030-01-01',
    entryDate: '2026-07-01',
    salesCount: 65
  },
  {
    id: 'prod-4',
    name: 'مطحنة بن يدوية دقيقة بتروس ستانلس ستيل',
    nameEn: 'Precision Manual Coffee Grinder',
    category: 'tools',
    sku: 'CAT-TOOL-02',
    barcode: '622100200002',
    unitType: 'piece',
    costPrice: 650,
    sellingPrice: 1150,
    stock: 4, // Low stock alert!
    stockGram: 0,
    minStockAlert: 6,
    image: '/v60_set.jpg',
    origin: 'ألمانيا / الصين',
    roastLevel: 'معدات طحن',
    notes: 'تروس مخروطية حادة 38 مم من الفولاذ',
    weight: '650g',
    description: 'طحن فائق الدقة ومتناسق من الإسبريسو وحتى الفرنش برس مع درجات طحن مرقمة.',
    expiryDate: '2030-01-01',
    entryDate: '2026-07-10',
    salesCount: 48
  },
  {
    id: 'prod-5',
    name: 'خلطة إسبريسو كاتورا هاوس بليند',
    nameEn: 'Caturra Signature Espresso Blend',
    category: 'coffee',
    sku: 'CAT-BLD-03',
    barcode: '622100100003',
    unitType: 'weight',
    pricePerKg: 1240,
    costPerKg: 700,
    costPrice: 175,
    sellingPrice: 310,
    stockGram: 4500, // 4.5 كجم فقط (مخزون حرج!)
    stock: 4.5,
    minStockAlert: 10,
    image: '/caturra_espresso.jpg',
    origin: 'مزيج البرازيل وكولومبيا وإثيوبيا',
    roastLevel: 'تحميص متوسط داكن',
    notes: 'شوكولاتة حليبية، فانيليا، قوام غني وكريما كثيفة',
    weight: '250g',
    description: 'الخلطة الخاصة لكاتورا لإسبريسو حريري متوازن مع اللاتيه والفلات وايت.',
    expiryDate: '2026-11-20', // Near expiry
    entryDate: '2026-06-01',
    salesCount: 220
  },
  {
    id: 'prod-6',
    name: 'سيروب فانيليا مدغشقر الطبيعي',
    nameEn: 'Madagascar Vanilla Syrup',
    category: 'syrups',
    sku: 'CAT-SYR-01',
    barcode: '622100300001',
    unitType: 'piece',
    costPrice: 120,
    sellingPrice: 220,
    stock: 22,
    stockGram: 0,
    minStockAlert: 6,
    image: '/caturra_syrup.jpg',
    origin: 'فرنسا',
    roastLevel: 'نكهات طبيعية',
    notes: 'فانيليا طبيعية نقية 100%',
    weight: '750ml',
    description: 'سيروب محلى بقصب السكر الطبيعي ونكهة الفانيليا العطرية للمشروبات الباردة والساخنة.',
    expiryDate: '2027-08-30',
    entryDate: '2026-08-01',
    salesCount: 37
  },
  {
    id: 'prod-7',
    name: 'بوكس تذوق محاصيل كاتورا الفاخرة (4 محاصيل)',
    nameEn: 'Caturra Specialty Tasting Gift Box',
    category: 'boxes',
    sku: 'CAT-BOX-01',
    barcode: '622100400001',
    unitType: 'piece',
    costPrice: 480,
    sellingPrice: 850,
    stock: 14,
    stockGram: 0,
    minStockAlert: 5,
    image: '/caturra_gift_box.jpg',
    origin: 'محاصيل مختارة عالمياً',
    roastLevel: 'تشكيلة متنوعة',
    notes: 'إثيوبيا، كولومبيا، جواتيمالا، كينيا',
    weight: '4x100g',
    description: 'هدية راقية في تغليف كاتورا الأخضر والأبيض تشمل 4 أكياس تذوق لخبراء القهوة.',
    expiryDate: '2027-01-10',
    entryDate: '2026-08-20',
    salesCount: 89
  }
];

export const initialCustomers = [
  {
    id: 'cust-1',
    name: 'أحمد الشناوي',
    phone: '01012345678',
    email: 'ahmed.shennawy@gmail.com',
    city: 'القاهرة',
    address: 'التجمع الخامس - شارع التسعين الشمالي',
    totalOrders: 6,
    totalSpent: 4850,
    debt: 0, // No debt
    notes: 'عميل دائم، يفضل تحضير V60 محاصيل إثيوبية مجففة',
    createdAt: '2026-05-10'
  },
  {
    id: 'cust-2',
    name: 'سارة خالد المنصور',
    phone: '01123456789',
    email: 'sara.mansour@gmail.com',
    city: 'الجيزة',
    address: 'الشيخ زايد - كمبوند بيفرلي هيلز',
    totalOrders: 4,
    totalSpent: 2650,
    debt: 580, // Has debt!
    notes: 'طلبت فاتورة آجلة بانتظار تحويل إنستاباي (InstaPay)',
    createdAt: '2026-06-12'
  },
  {
    id: 'cust-3',
    name: 'كريم عبدالفتاح',
    phone: '01234567890',
    email: 'karim.fattah@gmail.com',
    city: 'الإسكندرية',
    address: 'سموحة - طريق 14 مايو',
    totalOrders: 3,
    totalSpent: 1980,
    debt: 0,
    notes: 'مهتم بأدوات الطحن ومكائن الإسبريسو المنزلية',
    createdAt: '2026-07-01'
  },
  {
    id: 'cust-4',
    name: 'كافيه أروما بالمعادي (عميل جملة)',
    phone: '01555667788',
    email: 'aroma.maadi@gmail.com',
    city: 'القاهرة',
    address: 'المعادي - شارع دجلة 233',
    totalOrders: 8,
    totalSpent: 18400,
    debt: 2850, // Has outstanding debt
    notes: 'يشتري بن حبوب ومستلزمات باريستا دورياً بالفاتورة',
    createdAt: '2026-04-15'
  }
];

export const initialInvoices = [
  {
    id: 'inv-1001',
    invoiceNumber: 'INV-2026-0101',
    date: '2026-09-28 14:30',
    customerId: 'cust-1',
    customerName: 'أحمد الشناوي',
    customerPhone: '01012345678',
    items: [
      { productId: 'prod-1', name: 'إثيوبيا يرجاشيفي - (500 جرام)', unitType: 'weight', weightGram: 500, price: 640, costPrice: 380, qty: 1, total: 640 },
      { productId: 'prod-3', name: 'طقم تحضير V60 متكامل مع سيرفر وقمع سيراميك', unitType: 'piece', price: 790, costPrice: 450, qty: 1, total: 790 }
    ],
    subtotal: 1430,
    tax: 0,
    discount: 50,
    total: 1380,
    paidAmount: 1380,
    remainingDebt: 0,
    paymentMethod: 'card',
    status: 'paid',
    source: 'pos',
    cashierName: 'محمد أحمد (الكاشير)'
  },
  {
    id: 'inv-1002',
    invoiceNumber: 'INV-2026-0102',
    date: '2026-09-29 18:15',
    customerId: 'cust-2',
    customerName: 'سارة خالد المنصور',
    customerPhone: '01123456789',
    items: [
      { productId: 'prod-2', name: 'كولومبيا سوبريمو ويلا - (500 جرام)', unitType: 'weight', weightGram: 500, price: 560, costPrice: 320, qty: 1, total: 560 },
      { productId: 'prod-6', name: 'سيروب فانيليا مدغشقر الطبيعي', unitType: 'piece', price: 220, costPrice: 120, qty: 1, total: 220 }
    ],
    subtotal: 780,
    tax: 0,
    discount: 0,
    total: 780,
    paidAmount: 200,
    remainingDebt: 580,
    paymentMethod: 'deferred',
    status: 'partial',
    source: 'pos',
    cashierName: 'محمد أحمد (الكاشير)'
  },
  {
    id: 'inv-1003',
    invoiceNumber: 'INV-2026-0103',
    date: '2026-09-30 11:20',
    customerId: 'cust-4',
    customerName: 'كافيه أروما بالمعادي (عميل جملة)',
    customerPhone: '01555667788',
    items: [
      { productId: 'prod-5', name: 'خلطة إسبريسو كاتورا هاوس بليند - (2.5 كجم)', unitType: 'weight', weightGram: 2500, price: 3100, costPrice: 1750, qty: 1, total: 3100 },
      { productId: 'prod-2', name: 'كولومبيا سوبريمو ويلا - (1.25 كجم)', unitType: 'weight', weightGram: 1250, price: 1400, costPrice: 800, qty: 1, total: 1400 }
    ],
    subtotal: 4500,
    tax: 0,
    discount: 250,
    total: 4250,
    paidAmount: 1400,
    remainingDebt: 2850,
    paymentMethod: 'deferred',
    status: 'partial',
    source: 'pos',
    cashierName: 'أحمد الإدارة (المالك)'
  }
];

export const initialPurchases = [
  {
    id: 'pur-101',
    invoiceNumber: 'PUR-2026-0042',
    supplierName: 'شركة النيل لاستيراد البن الأخضر والمحاصيل',
    date: '2026-09-15',
    items: [
      {
        productId: 'prod-1',
        name: 'إثيوبيا يرجاشيفي - كبسولة النكهات',
        unitType: 'weight',
        qty: 60, // 60 كجم
        weightGram: 60000,
        costPrice: 190,
        costPerKg: 760,
        suggestedSellingPrice: 320,
        expiryDate: '2027-02-15',
        entryDate: '2026-09-15',
        image: '/caturra_ethiopia.jpg'
      },
      {
        productId: 'prod-2',
        name: 'كولومبيا سوبريمو ويلا',
        unitType: 'weight',
        qty: 40, // 40 كجم
        weightGram: 40000,
        costPrice: 160,
        costPerKg: 640,
        suggestedSellingPrice: 280,
        expiryDate: '2027-03-20',
        entryDate: '2026-09-15',
        image: '/caturra_colombia.jpg'
      }
    ],
    totalAmount: 17800,
    paidAmount: 17800,
    remainingAmount: 0,
    paymentStatus: 'paid',
    notes: 'شحنة محاصيل خضراء واصلة ميناء الإسكندرية'
  },
  {
    id: 'pur-102',
    invoiceNumber: 'PUR-2026-0043',
    supplierName: 'مؤسسة الأهرام لمعدات وتجهيزات القهوة',
    date: '2026-09-22',
    items: [
      {
        productId: 'prod-3',
        name: 'طقم تحضير V60 متكامل مع سيرفر وقمع سيراميك',
        unitType: 'piece',
        qty: 20,
        costPrice: 450,
        suggestedSellingPrice: 790,
        expiryDate: '2030-01-01',
        entryDate: '2026-09-22',
        image: '/v60_set.jpg'
      }
    ],
    totalAmount: 9000,
    paidAmount: 5000,
    remainingAmount: 4000,
    paymentStatus: 'partial',
    notes: 'دفعة أولى 5000 جنيه والباقي مؤجل لنهاية الشهر'
  }
];

export const initialBatches = [
  {
    id: 'bat-1',
    productId: 'prod-1',
    productName: 'إثيوبيا يرجاشيفي - كبسولة النكهات',
    batchCode: 'BAT-ETH-202609',
    unitType: 'weight',
    entryDate: '2026-08-10',
    expiryDate: '2027-02-15',
    quantity: 35, // 35 كجم
    quantityGram: 35000,
    costPrice: 760, // لكل كجم
    status: 'good'
  },
  {
    id: 'bat-2',
    productId: 'prod-2',
    productName: 'كولومبيا سوبريمو ويلا',
    batchCode: 'BAT-COL-202609',
    unitType: 'weight',
    entryDate: '2026-08-15',
    expiryDate: '2027-03-20',
    quantity: 28, // 28 كجم
    quantityGram: 28000,
    costPrice: 640,
    status: 'good'
  },
  {
    id: 'bat-3',
    productId: 'prod-5',
    productName: 'خلطة إسبريسو كاتورا هاوس بليند',
    batchCode: 'BAT-BLD-202606',
    unitType: 'weight',
    entryDate: '2026-06-01',
    expiryDate: '2026-11-20', // Close to expiry
    quantity: 4.5, // 4.5 كجم
    quantityGram: 4500,
    costPrice: 700,
    status: 'expiring_soon'
  },
  {
    id: 'bat-4',
    productId: 'prod-4',
    productName: 'مطحنة بن يدوية دقيقة بتروس ستانلس ستيل',
    batchCode: 'BAT-GRN-202607',
    unitType: 'piece',
    entryDate: '2026-07-10',
    expiryDate: '2030-01-01',
    quantity: 4,
    costPrice: 650,
    status: 'good'
  },
  {
    id: 'bat-5',
    productId: 'prod-3',
    productName: 'طقم تحضير V60 متكامل مع سيرفر وقمع سيراميك',
    batchCode: 'BAT-V60-202607',
    unitType: 'piece',
    entryDate: '2026-07-01',
    expiryDate: '2030-01-01',
    quantity: 15,
    costPrice: 450,
    status: 'good'
  }
];

export const initialExpenses = [
  {
    id: 'exp-1',
    title: 'إيجار مقر المحمصة والمعرض بالتجمع الخامس',
    category: 'إيجار',
    amount: 18000,
    date: '2026-09-01',
    notes: 'تحويل بنكي دوري'
  },
  {
    id: 'exp-2',
    title: 'طباعة وتوريد أكياس وكراتين كاتورا الفاخرة',
    category: 'تغليف ومطبوعات',
    amount: 4500,
    date: '2026-09-05',
    notes: 'مطبعة الألوان - العبور'
  },
  {
    id: 'exp-3',
    title: 'فاتورة الكهرباء والمياه والغاز للمحمصة',
    category: 'كهرباء ومياه',
    amount: 3200,
    date: '2026-09-12',
    notes: 'سداد فوري فوري'
  },
  {
    id: 'exp-4',
    title: 'حملة إعلانات ممولة فيسبوك وإنستجرام وتيك توك',
    category: 'تسويق',
    amount: 5000,
    date: '2026-09-18',
    notes: 'استهداف عشاق القهوة المختصة في القاهرة والإسكندرية والشيخ زايد'
  }
];

export const initialUsers = [
  {
    id: 'usr-owner',
    username: 'owner',
    password: '123',
    fullName: 'أحمد الإدارة (المالك الرئيسي)',
    role: 'owner',
    roleLabel: 'المالك والمشرف العام',
    phone: '01011122334',
    email: 'owner@caturra.coffee',
    isOwner: true, // CANNOT BE DELETED
    status: 'active',
    avatar: '👑',
    permissions: {
      products: true,
      pos: true,
      invoices: true,
      customers: true,
      purchases: true,
      sales: true,
      warehouse: true,
      accounts: true,
      users: true
    }
  },
  {
    id: 'usr-manager',
    username: 'manager',
    password: '123',
    fullName: 'مصطفى كمال',
    role: 'manager',
    roleLabel: 'مدير العمليات والفروع',
    phone: '01144433221',
    email: 'mostafa@caturra.coffee',
    isOwner: false,
    status: 'active',
    avatar: '👨‍💼',
    permissions: {
      products: true,
      pos: true,
      invoices: true,
      customers: true,
      purchases: true,
      sales: true,
      warehouse: true,
      accounts: true,
      users: false
    }
  },
  {
    id: 'usr-cashier',
    username: 'cashier',
    password: '123',
    fullName: 'محمد أحمد السعيد',
    role: 'cashier',
    roleLabel: 'أخصائي مبيعات وكاشير',
    phone: '01299988776',
    email: 'cashier@caturra.coffee',
    isOwner: false,
    status: 'active',
    avatar: '🧑‍💻',
    permissions: {
      products: false,
      pos: true,
      invoices: true,
      customers: true,
      purchases: false,
      sales: false,
      warehouse: false,
      accounts: false,
      users: false
    }
  },
  {
    id: 'usr-inventory',
    username: 'warehouse',
    password: '123',
    fullName: 'عمر القاضي',
    role: 'inventory',
    roleLabel: 'أمين المستودع والمخزون',
    phone: '01577766554',
    email: 'omar@caturra.coffee',
    isOwner: false,
    status: 'active',
    avatar: '📦',
    permissions: {
      products: true,
      pos: false,
      invoices: false,
      customers: false,
      purchases: true,
      sales: false,
      warehouse: true,
      accounts: false,
      users: false
    }
  }
];

export const initialAcademyArticles = [
  {
    id: 'acad-1',
    title: 'دليل استخلاص V60 الذهبي: معادلة النقاء والتوازن',
    titleEn: 'Ultimate V60 Pour-Over Brewing Guide',
    category: 'brewing',
    categoryLabel: 'طرق التحضير',
    level: 'مبتدئ إلى متوسط',
    readTime: '4 دقائق',
    image: '/v60_set.jpg',
    author: 'كابتن باريستا كاتورا',
    date: '2026-09-28',
    summary: 'تعلم كيفية تحضير فنجان V60 مثالي مع ضبط نسبة القهوة للماء (Ratio 1:16)، حرارة 92 مئوية، ومراحل الصب الثلاث للحصول على نقاء استثنائي.',
    featured: true,
    pdfFile: {
      id: 'pdf-sample-v60',
      name: 'دليل-استخلاص-V60-كاتورا.pdf',
      size: '1.2 MB',
      sizeBytes: 850,
      data: 'data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCA2MTIgNzkyXSAvQ29udGVudHMgNCAwIFIgL1Jlc291cmNlcyA8PCAvRm9udCA8PCAvRjEgNSAwIFIgPj4gPj4gPj4KZW5kb2JqCjQgMCBvYmoKPDwgL0xlbmd0aCA1MzggPj4Kc3RyZWFtCkJUIC9GMSAyMiBUZiA1MCA3MjAgVGQgKENhdHVycmEgU3BlY2lhbHR5IENvZmZlZSBBY2FkZW15KSBUaiAvRjEgMTYgVGYgMCAtMzUgVGQgKFY2MCBQb3VyLU92ZXIgUmVjaXBlICYgRXh0cmFjdGlvbiBHdWlkZSkgVGogL0YxIDEyIFRmIDAgLTM1IFRkIChDb2ZmZWU6IDE4ZyBTcGVjaWFsdHkgRnJlc2ggQmVhbnMgfCBXYXRlcjogMzAwbWwgQCA5MkMgfCBSYXRpbzogMToxNi42KSBUaiAwIC0yNSBUZCAoU3RlcCAxOiBCbG9vbSB3aXRoIDUwbWwgd2F0ZXIgZm9yIDQwIHNlY29uZHMgdG8gcmVsZWFzZSBuYXR1cmFsIGdhc2VzLikgVGogMCAtMjUgVGQgKFN0ZXAgMjogU21vb3RoIHNwaXJhbCBwb3VyIHVwIHRvIDE4MG1sIGZvY3VzaW5nIG9uIGNlbnRlciBmbG93LikgVGogMCAtMjUgVGQgKFN0ZXAgMzogRmluYWwgcG91ciB0byAzMDBtbC4gVG90YWwgYnJldyB0aW1lOiAyOjQ1IG1pbnV0ZXMuKSBUaiAwIC0zNSBUZCAoQ2F0dXJyYSBTcGVjaWFsdHkgQ29mZmVlIC0gQ2Fpcm8sIEVneXB0IHwgd3d3LmNhdHVycmEtY29mZmVlLmNvbSkgVGogRVQKZW5kc3RyZWFtCmVuZG9iago1IDAgb2JqCjw8IC9UeXBlIC9Gb250IC9TdWJ0eXBlIC9UeXBlMSAvQmFzZUZvbnQgL0hlbHZldGljYS1Cb2xkID4+CmVuZG9iagp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMDkgMDAwMDAgbiAKMDAwMDAwMDA1OCAwMDAwMCBuIAowMDAwMDAwMTE1IDAwMDAwIG4gCjAwMDAwMDAyNDQgMDAwMDAgbiAKMDAwMDAwMDMwMCAwMDAwMCBuIAp0cmFpbGVyCjw8IC9TaXplIDYgL1Jvb3QgMSAwIFIgPj4Kc3RhcnR4cmVmCjQwMAolJUVPRg==',
      uploadedAt: '2026-09-28'
    },
    content: `### الأدوات المطلوبة:
- 18 جرام بن مختص إثيوبي أو كولومبي طازج التحميص
- 300 مل ماء نقي بدرجة حرارة 91-93°C
- قمع V60 سيراميك وفلتر ورقي مغسول
- ميزان رقمي مزود بمؤقت ومطحنة حبوب يدوية

### خطوات التحضير العملية:
1. **الترطيب الأولي (Bloom):** صب 50 مل ماء بحركة دائرية هادئة وانتظر 40 ثانية للسماح للغازات الطبيعية بالخروج وإبراز الإيحاءات العطرية.
2. **الصبة الثانية (Extraction):** صب بهدوء حتى تصل إلى 180 مل مع التركيز في منتصف القمع بدون ملامسة حواف الفلتر.
3. **الصبة النهائية (Finish):** أكمل الصب بسلاسة حتى 300 مل، ثم حرك السيرفر حركة خفيفة لضمان استخلاص متكافئ لكافة حبيبات القهوة.
4. **وقت الاستخلاص الإجمالي:** يجب أن ينتهي بين دقيقتين ونصف إلى 3 دقائق للحصول على نقاء فاكهي وزهري ساحر.`
  },
  {
    id: 'acad-2',
    title: 'أسرار ضبط درجات الطحن: مفتاح توازن الإسبريسو والتقطير',
    titleEn: 'Coffee Grind Size Mastery Guide',
    category: 'grinding',
    categoryLabel: 'طحن ومعايرة',
    level: 'جميع المستويات',
    readTime: '5 دقائق',
    image: '/caturra_espresso.jpg',
    author: 'رئيس قسم التحميص',
    date: '2026-09-25',
    summary: 'كيف يؤثر حجم حبيبات البن على سرعة الاستخلاص، وكيف تكتشف عيوب الاستخلاص الناقص أو الزائد وتعالجها بنفسك في المنزل.',
    featured: true,
    content: `### القاعدة الذهبية للطحن:
درجة الطحن هي العامل رقم 1 في التحكم بزمن ملامسة الماء للقهوة:
- **طحن ناعم جداً (Fine):** مخصص للإسبريسو والقهوة التركية لمقاومة ضغط المضخة واستخلاص الكريما الكثيفة.
- **طحن متوسط (Medium):** لأقماع V60، الكيمكس، وفلاتر التقطير الورقية لتدفق متوازن.
- **طحن خشن (Coarse):** للفرنش برس والكولد برو (التخمير البارد على مدار 16-24 ساعة).

### كيف تعرف أن الطحنة تحتاج تعديل؟
- إذا كان طعم القهوة لاذعاً وحامضاً جداً وتدفقت بسرعة فائقة: طحنتك خشنة أكثر من اللازم (استخلاص ناقص Under-extracted).
- إذا كان الطعم مراً وجافاً واستغرق وقتاً طويلاً: طحنتك ناعمة جداً سببت انسداد المسام (استخلاص زائد Over-extracted).`
  },
  {
    id: 'acad-3',
    title: 'الفرق بين المعالجة المجففة (Natural) والمغسولة (Washed)',
    titleEn: 'Natural vs Washed Coffee Processing',
    category: 'origins',
    categoryLabel: 'المحاصيل والمعالجة',
    level: 'محبي القهوة',
    readTime: '3 دقائق',
    image: '/caturra_ethiopia.jpg',
    author: 'أكاديمية كاتورا',
    date: '2026-09-20',
    summary: 'اكتشف كيف تحدد طريقة معالجة كرزة البن بعد قطفها من المزرعة مستوى حلاوة القهوة وقوامها ونقاء نكهاتها في فنجانك.',
    featured: false,
    content: `### 1. المعالجة المجففة (Natural Process):
يتم تجفيف كرزات القهوة كاملة تحت أشعة الشمس فوق أسرة تجفيف مرتفعة مع لبها وقشرتها لأسابيع. تنتقل سكريات الفاكهة الطبيعية إلى حبة البن، مما يمنحها قواماً ممتلئاً وحلاوة تشبه التوت، الفراولة، والشوكولاتة الفاخرة.

### 2. المعالجة المغسولة (Washed Process):
تُزال القشرة واللب فوراً بالماء النقي وتُخمر الحبوب لإزالة المادة الهلامية ثم تُجفف. تمتاز بنقاء فائق، حموضة منعشة واضحة، وإيحاءات زهرية نقية كياسمين إثيوبيا والحمضيات الخفيفة.`
  },
  {
    id: 'acad-4',
    title: 'فن تبخير الحليب ورسم اللاتيه آرت (Latte Art) المنزلي',
    titleEn: 'Milk Steaming & Latte Art Mastery',
    category: 'barista',
    categoryLabel: 'مهارات الباريستا',
    level: 'متوسط',
    readTime: '4 دقائق',
    image: '/caturra_logo.jpg',
    author: 'مدرب الأكاديمية',
    date: '2026-09-15',
    summary: 'خطوات تكوين الميكروفوم المخملي اللامع (Microfoam) ودرجة الحرارة المثالية (60-65°C) لرسم القلب والروزيتّا باحترافية.',
    featured: false,
    content: `### مفاتيح الحليب المثالي:
1. **برودة الحليب:** استخدم حليب كامل الدسم بارداً جداً من الثلاجة مباشرة (4°C).
2. **إدخال الهواء (Stretching):** ضع فوهة عصا التبخير أسفل سطح الحليب مباشرة لمدة 3-5 ثوانٍ حتى تسمع صوت احتكاك ناعم كتمزيق الورق.
3. **الدوران والتجانس (Rolling):** انزل الفوهة قليلاً للأسفل وخلق دوامة هوائية لدمج الفقاعات وتحويلها لقوام كريمي ناعم يشبه الطلاء السائل.
4. **الحرارة:** أوقف التبخير عند 60-65°C حتى لا تفقد سكريات اللاكتوز حلاوتها الطبيعية.`
  }
];

// Initial Contact and Storefront Settings
export const initialContactInfo = {
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
  // Top Announcement Banner Settings
  bannerEnabled: true,
  bannerText: '🚚 شحن سريع لكافة المحافظات خلال 24-48 ساعة | حبوب بن طازجة محمصة بحرفية عالية ☕',
  bannerBadge: 'عرض حصري',
  bannerTheme: 'mint', // 'mint' | 'gold' | 'dark' | 'crimson'
  bannerLinkText: 'تصفح المحاصيل'
};

