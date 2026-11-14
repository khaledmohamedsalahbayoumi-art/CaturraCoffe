// Excel / CSV & PDF Export Utilities with UTF-8 BOM and jsPDF/html2canvas for 100% Arabic Compatibility
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { formatWhatsAppNumber, STORE_WHATSAPP_NUMBER } from './whatsapp';

/**
 * Generic CSV Exporter
 * @param {string} filename - Output filename (e.g. 'caturra_invoices.csv')
 * @param {Array<string>} headers - Array of column header names in Arabic
 * @param {Array<Array<any>>} rows - 2D Array of row data
 */
export const exportToCsv = (filename, headers, rows) => {
  if (!rows || !rows.length) {
    alert('لا توجد بيانات متاحة للتصدير');
    return;
  }

  // Escape helper for CSV cells (with CSV Formula Injection defense)
  const formatCell = (val) => {
    if (val === null || val === undefined) return '""';
    let str = String(val).trim();
    // Neutralize formula injection if field starts with dangerous formula prefixes (=, +, -, @)
    if (/^[=+\-@\t\r]/.test(str)) {
      str = "'" + str;
    }
    // If cell contains commas, newlines, or double quotes, escape it
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      str = str.replace(/"/g, '""');
    }
    return `"${str}"`;
  };

  const headerLine = headers.map(formatCell).join(',');
  const rowLines = rows.map(row => row.map(formatCell).join(',')).join('\r\n');
  
  // \uFEFF is the UTF-8 Byte Order Mark (BOM) - crucial for Arabic Excel to render properly
  const csvContent = '\uFEFF' + headerLine + '\r\n' + rowLines;

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export Invoices & Orders to Excel CSV
 */
export const exportInvoicesToCsv = (invoices) => {
  const headers = [
    'رقم الفاتورة',
    'التاريخ والوقت',
    'اسم العميل',
    'رقم الموبايل',
    'العنوان',
    'طريقة الدفع',
    'حالة الدفع',
    'حالة الطلب والشحن',
    'الإجمالي (ج.م)',
    'المدفوع (ج.م)',
    'المتبقي (ج.م)',
    'عدد الأصناف',
    'تفاصيل المنتجات'
  ];

  const rows = invoices.map(inv => {
    const itemsSummary = (inv.items || [])
      .map(it => `${it.name} (${it.qty}x)`)
      .join(' | ');

    const paymentLabel = 
      inv.paymentMethod === 'cash' ? 'نقدي (Cash)' :
      inv.paymentMethod === 'card' ? 'فيزا / ميزة' :
      inv.paymentMethod === 'instapay' ? 'إنستاباي' :
      inv.paymentMethod === 'split' ? (inv.splitPayment ? `مختلط (كاش: ${inv.splitPayment.cash} | محفظة: ${inv.splitPayment.instapay})` : 'مختلط (كاش + محفظة)') : 'آجل';

    const statusLabel = 
      inv.status === 'paid' ? 'مدفوعة' :
      inv.status === 'pending' ? 'طلب معلق' :
      inv.status === 'partial' ? 'مدفوعة جزئياً' :
      inv.status === 'cancelled' ? 'ملغية' : 'آجلة غير مسددة';

    const trackingLabel = 
      inv.trackingStatus === 'delivered' ? 'تم التوصيل' :
      inv.trackingStatus === 'shipped' ? 'جاري الشحن' :
      inv.trackingStatus === 'processing' ? 'قيد التحميص والتجهيز' :
      inv.trackingStatus === 'cancelled' ? 'ملغي' : 'تم استلام الطلب';

    return [
      inv.invoiceNumber || '',
      inv.date || '',
      inv.customerName || 'عميل نقدي',
      inv.customerPhone || '',
      inv.customerAddress || '',
      paymentLabel,
      statusLabel,
      trackingLabel,
      inv.total || 0,
      inv.paidAmount || 0,
      inv.remainingDebt || 0,
      inv.items?.length || 0,
      itemsSummary
    ];
  });

  exportToCsv('فواتير_وطلبات_كاتورا', headers, rows);
};

/**
 * Export Products & Inventory to Excel CSV
 */
export const exportProductsToCsv = (products, categories = []) => {
  const headers = [
    'كود الصنف (SKU)',
    'الاسم بالعربية',
    'الاسم بالإنجليزية',
    'التصنيف',
    'نوع الوحدة',
    'الرصيد المتاح',
    'سعر البيع (ج.م)',
    'سعر التكلفة (ج.م)',
    'قيمة المخزون الإجمالية (ج.م)',
    'المنشأ / بلد المحصول',
    'درجة التحميص',
    'تاريخ الصلاحية'
  ];

  const catMap = Object.fromEntries(categories.map(c => [c.id, c.name]));

  const rows = products.map(p => {
    const isWeight = p.unitType === 'weight';
    const stockDisplay = isWeight ? `${p.stock} كجم (${p.stockGram || p.stock * 1000}ج)` : `${p.stock} قطعة`;
    const costUnit = isWeight ? (p.costPerKg || p.costPrice * 4) : p.costPrice;
    const priceUnit = isWeight ? (p.pricePerKg || p.sellingPrice * 4) : p.sellingPrice;
    const totalValuation = Math.round((Number(p.stock) || 0) * (Number(costUnit) || 0));

    return [
      p.sku || '',
      p.name || '',
      p.nameEn || '',
      catMap[p.category] || p.category || '',
      isWeight ? 'بالوزن (جرام/كجم)' : 'بالقطعة',
      stockDisplay,
      priceUnit,
      costUnit,
      totalValuation,
      p.origin || '',
      p.roastLevel || '',
      p.expiryDate || ''
    ];
  });

  exportToCsv('جرد_مخزون_منتجات_كاتورا', headers, rows);
};

/**
 * Generate a pre-filled Excel/CSV template for inventory updates
 */
export const exportInventoryTemplate = (products = [], categories = []) => {
  const headers = [
    'كود الصنف (SKU)',
    'اسم المنتج (Product Name)',
    'الاسم بالإنجليزية (English Name)',
    'التصنيف (Category)',
    'نوع الوحدة (Unit: كجم / قطعة)',
    'الكمية في المخزن (Stock)',
    'سعر التكلفة (Cost Price)',
    'سعر البيع قطاعي (Selling Price)',
    'سعر بيع الجملة B2B (Wholesale Price)',
    'حد التنبيه الأدنى (Min Stock Alert)',
    'بلد المنشأ (Origin)'
  ];

  // Pre-fill existing products so the user can easily update quantities or add new rows
  const rows = (products || []).map(p => {
    const isWeight = p.unitType === 'weight' || p.category === 'specialty' || p.category === 'classic_blends' || p.category === 'filter' || p.category === 'espresso' || p.category === 'coffee';
    const unitLabel = isWeight ? 'كجم' : 'قطعة';
    const stockQty = p.stock !== undefined ? p.stock : (p.stockGram ? p.stockGram / 1000 : 0);
    const costUnit = isWeight ? (p.costPerKg || (p.costPrice ? p.costPrice * 4 : 0)) : (p.costPrice || 0);
    const priceUnit = isWeight ? (p.pricePerKg || (p.sellingPrice ? p.sellingPrice * 4 : 0)) : (p.sellingPrice || 0);
    const wholesaleUnit = isWeight ? (p.wholesalePricePerKg || Math.round(priceUnit * 0.8)) : (p.wholesalePrice || Math.round(priceUnit * 0.85));

    return [
      p.sku || `CAT-${p.id?.slice(-4) || ''}`,
      p.name || '',
      p.nameEn || '',
      p.category || 'specialty',
      unitLabel,
      stockQty,
      costUnit,
      priceUnit,
      wholesaleUnit,
      p.minStockAlert || 5,
      p.coffeeOrigin?.country || p.origin || ''
    ];
  });

  exportToCsv('نموذج_إكسيل_تحديث_المخزون_كاتورا', headers, rows);
};

/**
 * Convert an already-parsed 2D matrix of spreadsheet rows (header row + data rows)
 * into normalized inventory items for importInventoryBatch.
 */
export const parseInventoryRows = (rawRows) => {
  if (!Array.isArray(rawRows) || rawRows.length < 2) return [];

  // Filter completely blank rows while preserving row structure
  const nonEmptyRows = rawRows.filter(
    r => Array.isArray(r) && r.some(cell => String(cell ?? '').trim() !== '')
  );
  if (nonEmptyRows.length < 2) return [];

  const headerCells = nonEmptyRows[0].map(c => String(c ?? '').trim());
  const headers = headerCells.map(h => h.toLowerCase().replace(/['"]/g, '').trim());

  // Priority-ordered header finder: checks keywords in order so specific matches beat generic ones,
  // and respects excluded substrings (e.g. priceCol must not match 'cost price' or 'wholesale').
  const findCol = (keywords, excluded = []) => {
    for (const k of keywords) {
      const idx = headers.findIndex(h =>
        h.includes(k.toLowerCase()) && !excluded.some(ex => h.includes(ex.toLowerCase()))
      );
      if (idx !== -1) return idx;
    }
    return -1;
  };

  const getTemplateFallback = (matchedIdx, fallbackIdx) => {
    if (matchedIdx !== -1) return matchedIdx;
    return headers.length >= 10 && headers.length > fallbackIdx ? fallbackIdx : -1;
  };

  const skuCol = getTemplateFallback(
    findCol(['sku', 'كود', 'رمز', 'باركود', 'barcode', 'code']),
    0
  );
  let nameCol = getTemplateFallback(
    findCol(
      ['اسم المنتج', 'product name', 'الاسم بالعربية', 'اسم الصنف', 'الصنف', 'المنتج', 'الاسم', 'name', 'product', 'item', 'title', 'صنف'],
      ['english', 'إنجليز', 'انجليز', 'name en', 'nameen']
    ),
    1
  );
  if (nameCol === -1) {
    nameCol = skuCol === 0 && headers.length > 1 ? 1 : 0;
  }

  const nameEnCol = getTemplateFallback(
    findCol(['الاسم بالإنجليزية', 'الاسم الانجليزي', 'اسم إنجليزي', 'english name', 'name en', 'nameen', 'english']),
    2
  );
  const catCol = getTemplateFallback(
    findCol(['التصنيف', 'تصنيف', 'الفئة', 'فئة', 'القسم', 'قسم', 'category', 'النوع', 'type']),
    3
  );
  const unitCol = getTemplateFallback(
    findCol(['نوع الوحدة', 'الوحدة', 'وحدة', 'unit']),
    4
  );
  const stockCol = getTemplateFallback(
    findCol(['الكمية', 'كمية', 'المخزون', 'مخزون', 'الرصيد', 'رصيد', 'الموجود', 'متاح', 'stock', 'qty', 'quantity', 'balance', 'count']),
    5
  );
  const costCol = getTemplateFallback(
    findCol(['سعر التكلفة', 'تكلفة', 'شراء', 'cost price', 'cost']),
    6
  );
  const priceCol = getTemplateFallback(
    findCol(
      ['سعر البيع', 'سعر قطاعي', 'قطاعي', 'selling price', 'selling', 'retail', 'بيع', 'سعر', 'price'],
      ['تكلفة', 'cost', 'جملة', 'wholesale', 'b2b', 'شراء']
    ),
    7
  );
  const wholesaleCol = getTemplateFallback(
    findCol(['جملة', 'wholesale', 'b2b']),
    8
  );
  const minAlertCol = getTemplateFallback(
    findCol(['حد التنبيه', 'تنبيه', 'حد أدنى', 'حد ادنى', 'حد', 'min', 'أدنى', 'alert']),
    9
  );
  const originCol = getTemplateFallback(
    findCol(['بلد المنشأ', 'منشأ', 'بلد', 'دولة', 'origin', 'country']),
    10
  );
  const notesCol = findCol(['نكهات', 'إيحاءات', 'ايحاءات', 'ملاحظات', 'وصف', 'notes', 'flavor', 'description']);

  // Helper to parse numbers (supports ASCII digits, Eastern Arabic ٠-٩, Persian ۰-۹, Arabic decimal ٫)
  const parseNum = (val, fallback = 0) => {
    if (val === null || val === undefined || val === '') return fallback;
    if (typeof val === 'number') return Number.isFinite(val) ? val : fallback;
    const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    let str = String(val)
      .replace(/[٠-٩]/g, d => String(arabicDigits.indexOf(d)))
      .replace(/[۰-۹]/g, d => String(persianDigits.indexOf(d)))
      .replace(/٫/g, '.')
      .replace(/٬/g, '')
      .trim();
    // Strip thousand-separator commas while keeping decimal dot
    str = str.replace(/,(?=\d{3}(?:[,.]|$))/g, '').replace(',', '.');
    str = str.replace(/[^0-9.-]/g, '');
    const num = parseFloat(str);
    return Number.isFinite(num) ? num : fallback;
  };

  const items = [];
  for (let i = 1; i < nonEmptyRows.length; i++) {
    const row = nonEmptyRows[i].map(c => String(c ?? '').trim());
    if (!row || row.length === 0 || row.every(c => !c)) continue;

    const sku = (skuCol !== -1 ? row[skuCol] : '') || '';
    let name = (nameCol !== -1 ? row[nameCol] : '') || '';
    const nameEn = (nameEnCol !== -1 ? row[nameEnCol] : '') || '';
    if (!name && nameEn) name = nameEn;
    if (!name && !sku) continue;

    const rawCategory = ((catCol !== -1 ? row[catCol] : '') || '').trim();
    const rawUnit = ((unitCol !== -1 ? row[unitCol] : '') || '').trim();
    const rawStock = stockCol !== -1 ? row[stockCol] : '';
    const rawCost = costCol !== -1 ? row[costCol] : '';
    const rawPrice = priceCol !== -1 ? row[priceCol] : '';
    const rawWholesale = wholesaleCol !== -1 ? row[wholesaleCol] : '';
    const rawMin = minAlertCol !== -1 ? row[minAlertCol] : '';
    const rawOrigin = ((originCol !== -1 ? row[originCol] : '') || '').trim();
    const rawNotes = ((notesCol !== -1 ? row[notesCol] : '') || '').trim();

    // Normalize category while keeping custom rawCategory if unknown
    const catLower = rawCategory.toLowerCase();
    let category = '';
    if (catLower.includes('مخمر') || catLower.includes('تخمير') || catLower.includes('fermented')) {
      category = 'fermented';
    } else if (catLower.includes('كلاسيك') || catLower.includes('تركي') || catLower.includes('فرنساوي') || catLower.includes('توليف') || catLower.includes('classic') || catLower === 'coffee' || catLower.includes('blend')) {
      category = 'classic_blends';
    } else if (catLower.includes('مختص') || catLower.includes('specialty') || catLower.includes('espresso') || catLower.includes('إسبريسو') || catLower.includes('اسبريسو') || catLower.includes('filter') || catLower.includes('فلتر')) {
      category = 'specialty';
    } else if (catLower.includes('tool') || catLower.includes('أدوات') || catLower.includes('ادوات') || catLower.includes('تحضير')) {
      category = 'tools';
    } else if (catLower.includes('أكواب') || catLower.includes('اكواب') || catLower.includes('accessories') || catLower.includes('اكسسوارات') || catLower.includes('إكسسوار')) {
      category = 'accessories';
    } else if (catLower.includes('بوكس') || catLower.includes('box') || catLower.includes('هدايا') || catLower.includes('gift')) {
      category = 'boxes';
    } else if (rawCategory) {
      category = rawCategory;
    }

    // Normalize unit type cleanly
    const unitLower = rawUnit.toLowerCase();
    const hasPieceUnit = ['piece', 'قطعة', 'قطعه', 'عدد', 'حبة', 'علبة', 'علبه', 'بوكس', 'box', 'كيس', 'باكت', 'عبوة', 'زجاجة', 'كوب', 'pcs', 'pc', 'unit']
      .some(k => unitLower.includes(k));
    const hasWeightUnit = ['كجم', 'كيلو', 'kg', 'وزن', 'weight', 'جرام', 'جم', 'gram']
      .some(k => unitLower.includes(k));

    let unitType = 'weight';
    if (hasPieceUnit && !hasWeightUnit) {
      unitType = 'piece';
    } else if (hasWeightUnit) {
      unitType = 'weight';
    } else if (['tools', 'accessories', 'boxes'].includes(category)) {
      unitType = 'piece';
    }

    if (!category) {
      category = unitType === 'piece' ? 'tools' : 'specialty';
    }

    const stock = Math.max(0, parseNum(rawStock, 0));
    const costPrice = Math.max(0, parseNum(rawCost, 0));
    const sellingPrice = Math.max(0, parseNum(rawPrice, 0));
    const wholesalePrice = Math.max(0, parseNum(rawWholesale, Math.round(sellingPrice * 0.8)));
    const minAlert = Math.max(1, parseNum(rawMin, 5));

    items.push({
      sku: sku.trim(),
      name: (name || sku).trim(),
      nameEn: nameEn.trim(),
      category,
      rawCategory,
      unitType,
      stock,
      costPrice,
      sellingPrice,
      wholesalePrice,
      minAlert,
      origin: rawOrigin,
      notes: rawNotes
    });
  }

  return items;
};

/**
 * Parse an uploaded inventory CSV / TSV text content
 * Supports comma, semicolon, tab, and handles Arabic numerals and quotes
 */
export const parseInventoryCsv = (content) => {
  if (!content || typeof content !== 'string') return [];

  // Remove UTF-8 BOM if present
  const cleanContent = content.charCodeAt(0) === 0xFEFF ? content.slice(1) : content;

  // Split into non-empty lines
  const rawLines = cleanContent.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (rawLines.length < 2) return [];

  // Detect delimiter from header line (check comma, semicolon, tab)
  const headerLine = rawLines[0];
  let delimiter = ',';
  if (headerLine.includes('\t') && headerLine.split('\t').length >= headerLine.split(',').length) {
    delimiter = '\t';
  } else if (headerLine.includes(';') && headerLine.split(';').length > headerLine.split(',').length) {
    delimiter = ';';
  }

  const parseLine = (line) => {
    const result = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(cur.trim());
        cur = '';
      } else {
        cur += char;
      }
    }
    result.push(cur.trim());
    return result;
  };

  const rows = rawLines.map(parseLine);
  return parseInventoryRows(rows);
};

// Convert Excel column letters (e.g. "A", "AA") to 0-based column index
const colLettersToIndex = (letters) => {
  let idx = 0;
  for (let i = 0; i < letters.length; i++) {
    idx = idx * 26 + (letters.charCodeAt(i) - 64);
  }
  return idx - 1;
};

// Inflate a raw deflate stream inside an XLSX (ZIP) archive using native browser DecompressionStream
const inflateDeflateRaw = async (compressedBytes) => {
  if (typeof DecompressionStream === 'undefined') {
    throw new Error('المتصفح الحالي لا يدعم فك ضغط ملفات XLSX مباشرة. يرجى حفظ الملف بصيغة CSV.');
  }
  const ds = new DecompressionStream('deflate-raw');
  const writer = ds.writable.getWriter();
  writer.write(compressedBytes);
  writer.close();
  const ab = await new Response(ds.readable).arrayBuffer();
  return new TextDecoder('utf-8').decode(ab);
};

// Read entries needed from an XLSX ZIP archive via Central Directory
const parseXlsxBuffer = async (arrayBuffer) => {
  const bytes = new Uint8Array(arrayBuffer);
  const view = new DataView(arrayBuffer);

  // Locate End of Central Directory (PK\x05\x06) scanning backwards from end
  let eocdOffset = -1;
  const minOffset = Math.max(0, bytes.length - 65558);
  for (let i = bytes.length - 22; i >= minOffset; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset === -1) {
    throw new Error('ملف XLSX غير صالح أو تالف.');
  }

  const cdOffset = view.getUint32(eocdOffset + 16, true);
  const totalEntries = view.getUint16(eocdOffset + 10, true);
  const dec = new TextDecoder('utf-8');

  const files = new Map();
  let ptr = cdOffset;
  for (let e = 0; e < totalEntries && ptr + 46 <= bytes.length; e++) {
    if (view.getUint32(ptr, true) !== 0x02014b50) break;
    const method = view.getUint16(ptr + 10, true);
    const compressedSize = view.getUint32(ptr + 20, true);
    const nameLen = view.getUint16(ptr + 28, true);
    const extraLen = view.getUint16(ptr + 30, true);
    const commentLen = view.getUint16(ptr + 32, true);
    const localHeaderOffset = view.getUint32(ptr + 42, true);
    const fileName = dec.decode(bytes.subarray(ptr + 46, ptr + 46 + nameLen));
    ptr += 46 + nameLen + extraLen + commentLen;

    if (
      fileName === 'xl/sharedStrings.xml' ||
      fileName === 'xl/workbook.xml' ||
      fileName === 'xl/_rels/workbook.xml.rels' ||
      /^xl\/worksheets\/sheet\d*\.xml$/i.test(fileName)
    ) {
      files.set(fileName, { method, compressedSize, localHeaderOffset });
    }
  }

  const readZipEntryText = async (entryName) => {
    const info = files.get(entryName);
    if (!info) return null;
    const lh = info.localHeaderOffset;
    if (view.getUint32(lh, true) !== 0x04034b50) return null;
    const fnLen = view.getUint16(lh + 26, true);
    const exLen = view.getUint16(lh + 28, true);
    const dataStart = lh + 30 + fnLen + exLen;
    const slice = bytes.subarray(dataStart, dataStart + info.compressedSize);
    if (info.method === 0) return dec.decode(slice);
    if (info.method === 8) return await inflateDeflateRaw(slice);
    throw new Error(`طريقة ضغط غير مدعومة (${info.method}) داخل ملف XLSX`);
  };

  const parseXml = (xmlText) => new DOMParser().parseFromString(xmlText, 'text/xml');

  // 1. Read shared strings table if present
  const sharedStrings = [];
  const ssXml = await readZipEntryText('xl/sharedStrings.xml');
  if (ssXml) {
    const ssDoc = parseXml(ssXml);
    const siNodes = ssDoc.getElementsByTagName('si');
    for (let i = 0; i < siNodes.length; i++) {
      const tNodes = siNodes[i].getElementsByTagName('t');
      let val = '';
      for (let j = 0; j < tNodes.length; j++) {
        val += tNodes[j].textContent || '';
      }
      sharedStrings.push(val);
    }
  }

  // 2. Find first worksheet XML path (respect workbook.xml if possible, else sheet1.xml)
  let sheetPath = 'xl/worksheets/sheet1.xml';
  if (!files.has(sheetPath)) {
    const firstSheet = Array.from(files.keys()).find(k => /^xl\/worksheets\/sheet/i.test(k));
    if (firstSheet) sheetPath = firstSheet;
  }
  const sheetXml = await readZipEntryText(sheetPath);
  if (!sheetXml) return [];

  const sheetDoc = parseXml(sheetXml);
  const rowNodes = sheetDoc.getElementsByTagName('row');
  const rows = [];

  for (let r = 0; r < rowNodes.length; r++) {
    const cells = rowNodes[r].getElementsByTagName('c');
    const rowArr = [];
    for (let c = 0; c < cells.length; c++) {
      const cell = cells[c];
      const ref = cell.getAttribute('r') || '';
      const colMatch = ref.match(/^([A-Z]+)/i);
      const colIdx = colMatch ? colLettersToIndex(colMatch[1].toUpperCase()) : c;
      while (rowArr.length <= colIdx) rowArr.push('');

      const t = cell.getAttribute('t');
      let value = '';
      if (t === 's') {
        const vNode = cell.getElementsByTagName('v')[0];
        const idx = vNode ? parseInt(vNode.textContent || '', 10) : -1;
        value = idx >= 0 && idx < sharedStrings.length ? sharedStrings[idx] : '';
      } else if (t === 'inlineStr') {
        const tNodes = cell.getElementsByTagName('t');
        for (let k = 0; k < tNodes.length; k++) value += tNodes[k].textContent || '';
      } else {
        const vNode = cell.getElementsByTagName('v')[0];
        value = vNode ? (vNode.textContent || '') : '';
      }
      rowArr[colIdx] = String(value).trim();
    }
    rows.push(rowArr);
  }

  return parseInventoryRows(rows);
};

/**
 * Unified async spreadsheet file parser for inventory & product imports.
 * Supports .xlsx, HTML/XML .xls, .csv (UTF-8 & Windows-1256 Arabic), .tsv, and .txt.
 */
export const parseInventoryFile = async (file) => {
  if (!file) return [];
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const fileName = (file.name || '').toLowerCase();

  // Check ZIP / XLSX magic header ('PK') or .xlsx extension
  const isZip = bytes.length >= 2 && bytes[0] === 0x50 && bytes[1] === 0x4b;
  if (isZip || fileName.endsWith('.xlsx')) {
    return await parseXlsxBuffer(buffer);
  }

  // Decode text as UTF-8, falling back to Windows-1256 for Arabic Excel CSV files
  let text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
  if (text.includes('\uFFFD')) {
    try {
      text = new TextDecoder('windows-1256').decode(bytes);
    } catch {
      // Keep UTF-8 decoded text if windows-1256 is unavailable
    }
  }
  const trimmed = text.replace(/^\uFEFF/, '').trim();

  // Check for HTML-table .xls or SpreadsheetML .xml exported by Excel
  if (trimmed.startsWith('<') && (/<table[\s>]/i.test(trimmed) || /<Row[\s>]/i.test(trimmed))) {
    const rows = [];
    if (/<Row[\s>]/i.test(trimmed) && !/<tr[\s>]/i.test(trimmed)) {
      const xmlDoc = new DOMParser().parseFromString(trimmed, 'text/xml');
      const rowEls = xmlDoc.getElementsByTagName('Row');
      for (let i = 0; i < rowEls.length; i++) {
        const cellEls = rowEls[i].getElementsByTagName('Cell');
        const rArr = [];
        for (let j = 0; j < cellEls.length; j++) {
          const idxAttr = cellEls[j].getAttribute('ss:Index') || cellEls[j].getAttribute('Index');
          if (idxAttr) {
            const target = parseInt(idxAttr, 10) - 1;
            while (rArr.length < target) rArr.push('');
          }
          rArr.push((cellEls[j].textContent || '').trim());
        }
        rows.push(rArr);
      }
    } else {
      const htmlDoc = new DOMParser().parseFromString(trimmed, 'text/html');
      const trEls = htmlDoc.querySelectorAll('tr');
      trEls.forEach(tr => {
        const cells = Array.from(tr.querySelectorAll('th, td')).map(td => (td.textContent || '').trim());
        if (cells.length > 0) rows.push(cells);
      });
    }
    if (rows.length >= 2) {
      return parseInventoryRows(rows);
    }
  }

  return parseInventoryCsv(trimmed);
};

/**
 * Export Customers & Debts to Excel CSV
 */
export const exportCustomersToCsv = (customers) => {
  const headers = [
    'اسم العميل',
    'رقم الهاتف',
    'العنوان',
    'المديونية الحالية (ج.م)',
    'إجمالي المشتريات (ج.م)',
    'عدد الفواتير والطلبات',
    'ملاحظات الحساب'
  ];

  const rows = customers.map(c => [
    c.name || '',
    c.phone || '',
    c.address || '',
    c.debt || 0,
    c.totalPurchases || 0,
    c.ordersCount || 0,
    c.notes || ''
  ]);

  exportToCsv('كشف_عملاء_ومديونيات_كاتورا', headers, rows);
};

/**
 * Export Financials Summary to Excel CSV
 */
export const exportFinancialsToCsv = ({ totalRevenue, totalExpenses, netProfit, expensesList }) => {
  const headers = [
    'تاريخ المصروف',
    'بيان وبند المصروف',
    'التصنيف',
    'المبلغ (ج.م)',
    'ملاحظات'
  ];

  const rows = (expensesList || []).map(exp => [
    exp.date || '',
    exp.title || '',
    exp.category || '',
    exp.amount || 0,
    exp.notes || ''
  ]);

  // Append Financial Summary at the bottom
  rows.push(['---', '---', '---', '---', '---']);
  rows.push(['الإجمالي العام', 'إجمالي الإيرادات والمبيعات', '', totalRevenue || 0, 'شامل كل المبيعات']);
  rows.push(['الإجمالي العام', 'إجمالي المصروفات التشغيلية', '', totalExpenses || 0, 'شامل المصروفات']);
  rows.push(['صافي الأرباح', 'صافي الربح التقديري', '', netProfit || 0, 'المبيعات - المصروفات']);

  exportToCsv('التقرير_المالي_الشامل_كاتورا', headers, rows);
};

/**
 * Export Customers to a printable & downloadable PDF report
 */
export const exportCustomersToPdf = (customers, contactInfo = {}) => {
  if (!customers || !customers.length) {
    alert('لا توجد بيانات عملاء متاحة للتصدير');
    return;
  }

  const brandName = contactInfo?.brandNameAr || 'كاتورا للقهوة المختصة';
  const brandNameEn = contactInfo?.brandNameEn || 'CATURRA COFFEE & ROASTER';
  const commercialRegister = contactInfo?.commercialRegister || '148920';
  const taxNumber = contactInfo?.taxNumber || '582-934-211';
  const address = contactInfo?.address || 'القاهرة - مصر';
  const dateStr = new Date().toLocaleString('ar-EG-u-nu-latn', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const totalDebts = (customers || []).reduce((sum, c) => sum + (Number(c?.debt) || 0), 0);
  const totalPurchases = (customers || []).reduce((sum, c) => sum + (Number(c?.totalPurchases) || 0), 0);
  const customersWithDebt = (customers || []).filter(c => (Number(c?.debt) || 0) > 0).length;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('يرجى السماح بالنوافذ المنبثقة (Popups) للمتصفح لتصدير وحفظ ملف الـ PDF');
    return;
  }

  const rowsHtml = (customers || []).map((c, idx) => `
    <tr>
      <td style="text-align: center; color: #64748b; font-weight: 700;">${idx + 1}</td>
      <td style="font-weight: 800; color: #0f172a;">${c?.name || 'عميل نقدي'}</td>
      <td dir="ltr" style="text-align: right; color: #334155;">${c?.phone || '-'}</td>
      <td style="color: #475569;">${c?.address || c?.city || '-'}</td>
      <td style="text-align: center; font-weight: 700;">${c?.ordersCount || 0}</td>
      <td style="font-weight: 800; color: #047857;">${(Number(c?.totalPurchases) || 0).toLocaleString('en-US')} ج.م</td>
      <td style="font-weight: 800; color: ${(Number(c?.debt) || 0) > 0 ? '#dc2626' : '#16a34a'};">
        ${(Number(c?.debt) || 0) > 0 ? `${(Number(c?.debt) || 0).toLocaleString('en-US')} ج.م` : 'خالص ✓'}
      </td>
      <td style="color: #64748b; font-size: 11px;">${c.notes || '-'}</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير كشف العملاء - ${brandName}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
      <style>
        @page {
          size: A4 portrait;
          margin: 12mm;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-variant-numeric: tabular-nums lining-nums;
        }
        body {
          font-family: 'Cairo', sans-serif;
          color: #0f172a;
          background: #ffffff;
          padding: 24px;
          direction: rtl;
        }
        .no-print-bar {
          background: linear-gradient(135deg, #065f46 0%, #047857 100%);
          color: #ffffff;
          padding: 14px 24px;
          border-radius: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          box-shadow: 0 4px 12px rgba(6, 95, 70, 0.15);
        }
        .btn-action {
          border: none;
          padding: 8px 18px;
          border-radius: 8px;
          font-weight: 800;
          font-family: inherit;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.2s;
        }
        .btn-pdf {
          background: #ffffff;
          color: #065f46;
          margin-left: 8px;
        }
        .btn-close {
          background: rgba(255,255,255,0.18);
          color: #ffffff;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2.5px solid #059669;
          padding-bottom: 16px;
          margin-bottom: 20px;
        }
        .header-title h1 {
          font-size: 24px;
          font-weight: 900;
          color: #065f46;
          margin-bottom: 2px;
        }
        .header-title h2 {
          font-size: 14px;
          color: #059669;
          font-weight: 700;
        }
        .header-meta {
          text-align: left;
          font-size: 11px;
          color: #64748b;
          line-height: 1.6;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 22px;
        }
        .summary-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 12px 14px;
          text-align: center;
        }
        .summary-card.green {
          background: #ecfdf5;
          border-color: #a7f3d0;
        }
        .summary-card.red {
          background: #fef2f2;
          border-color: #fecaca;
        }
        .summary-title {
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          margin-bottom: 4px;
        }
        .summary-val {
          font-size: 18px;
          font-weight: 900;
          color: #0f172a;
        }
        .summary-card.green .summary-val {
          color: #047857;
        }
        .summary-card.red .summary-val {
          color: #dc2626;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11.5px;
          margin-bottom: 24px;
        }
        th {
          background: #f1f5f9;
          color: #334155;
          font-weight: 800;
          padding: 10px 8px;
          text-align: right;
          border: 1px solid #cbd5e1;
        }
        td {
          padding: 8px;
          border: 1px solid #e2e8f0;
          text-align: right;
          vertical-align: middle;
        }
        tr:nth-child(even) {
          background: #fafafa;
        }
        .footer {
          border-top: 1px solid #e2e8f0;
          padding-top: 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 11px;
          color: #64748b;
        }
        @media print {
          .no-print-bar {
            display: none !important;
          }
          body {
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="no-print-bar">
        <div style="font-weight: 800; font-size: 14px;">
          📄 تقرير كشف وحسابات العملاء (PDF) - جاهز للحفظ أو الطباعة
        </div>
        <div>
          <button class="btn-action btn-pdf" onclick="window.print()">حفظ كملف PDF / طباعة 🖨️</button>
          <button class="btn-action btn-close" onclick="window.close()">إغلاق ✕</button>
        </div>
      </div>

      <div class="header">
        <div class="header-title">
          <h1>${brandName}</h1>
          <h2>كشف حسابات وسجل العملاء الشامل</h2>
          <div style="font-size: 11px; color: #64748b; margin-top: 4px;">${brandNameEn}</div>
        </div>
        <div class="header-meta">
          <div><strong>تاريخ التصدير:</strong> ${dateStr}</div>
          <div><strong>السجل التجاري:</strong> ${commercialRegister} | <strong>البطاقة الضريبية:</strong> ${taxNumber}</div>
          <div><strong>الفرع / العنوان:</strong> ${address}</div>
        </div>
      </div>

      <div class="summary-grid">
        <div class="summary-card">
          <div class="summary-title">إجمالي العملاء بالكشف</div>
          <div class="summary-val">${customers.length} عميل</div>
        </div>
        <div class="summary-card green">
          <div class="summary-title">إجمالي قيمة المشتريات</div>
          <div class="summary-val">${totalPurchases.toLocaleString('en-US')} ج.م</div>
        </div>
        <div class="summary-card red">
          <div class="summary-title">إجمالي المديونيات المستحقة</div>
          <div class="summary-val">${totalDebts.toLocaleString('en-US')} ج.م</div>
        </div>
        <div class="summary-card">
          <div class="summary-title">عملاء عليهم مديونية</div>
          <div class="summary-val">${customersWithDebt} عميل</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 32px; text-align: center;">#</th>
            <th>اسم العميل</th>
            <th>رقم الموبايل</th>
            <th>العنوان</th>
            <th style="text-align: center; width: 60px;">الطلبات</th>
            <th>إجمالي المشتريات</th>
            <th>المديونية</th>
            <th>ملاحظات</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div class="footer">
        <div>نظام كاتورا لإدارة المحامص والمقاهي المختصة (Caturra Coffee ERP)</div>
        <div>صفحة معتمدة إلكترونياً</div>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 450);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};

/**
 * Generate a genuine A4 PDF Blob & File for an invoice, including full item specifications
 * and customer payment transfer screenshot embedded directly.
 */
export const generateInvoicePdfBlob = async (invoice, contactInfo = {}) => {
  if (!invoice) throw new Error('لا توجد بيانات فاتورة');

  const brandName = contactInfo?.brandNameAr || 'كاتورا للقهوة المختصة';
  const commercialRegister = contactInfo?.commercialRegister || '148920';
  const taxNumber = contactInfo?.taxNumber || '582-934-211';
  const phone = contactInfo?.phone || contactInfo?.whatsapp || '01033144498';

  const orderDateFormatted = invoice.date ? (invoice.date.includes(' ') ? invoice.date.split(' ')[0] : invoice.date) : new Date().toLocaleDateString('en-US');
  const deliveryDateFormatted = invoice.deliveryDate || orderDateFormatted;
  const accountManagerName = invoice.cashierName || 'Omar Saad';

  const itemsRows = (invoice.items || []).map((it) => {
    const extra = [];
    if (it.weightLabel) extra.push(it.weightLabel);
    else if (it.weightGram) extra.push(`${it.weightGram}g`);
    if (it.grind && it.grind !== 'حبوب كاملة') extra.push(it.grind);
    const details = extra.length > 0 ? `<div style="font-size: 11px; color: #73756e; margin-top: 3px; font-weight: 500;">${extra.join(' • ')}</div>` : '';

    return `
      <tr style="border-bottom: 1px solid #e5e3dc; background: #ffffff;">
        <td style="padding: 12px 16px; color: #242721; font-weight: 600;">
          <div>${it.name}</div>
          ${details}
        </td>
        <td style="text-align: center; padding: 12px 14px; color: #444741;">${Number(it.qty).toFixed(2)} Units</td>
        <td style="text-align: center; padding: 12px 14px; color: #444741;">${(Number(it.price) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
        <td style="text-align: right; padding: 12px 16px; color: #242721; font-weight: 700;">${((Number(it.price) || 0) * (Number(it.qty) || 1)).toLocaleString('en-US', { minimumFractionDigits: 2 })} LE</td>
      </tr>
    `;
  }).join('');

  let paymentMethodLabel = 'Cash';
  if (invoice.paymentMethod === 'instapay') paymentMethodLabel = 'InstaPay';
  else if (invoice.paymentMethod === 'wallet') paymentMethodLabel = 'E-Wallet';
  else if (invoice.paymentMethod === 'card') paymentMethodLabel = 'Card / Visa';
  else if (invoice.paymentMethod === 'split') paymentMethodLabel = 'Split (Cash + Wallet)';

  const receiptSection = invoice.transferReceipt ? `
    <div style="margin-top: 22px; padding: 14px 18px; background: #faf9f6; border: 1px dashed #c8c5bc; border-radius: 10px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span style="font-size: 12px; font-weight: 700; color: #505342;">📸 Attached Customer Transfer Proof (Screen Shot):</span>
        ${invoice.transferSenderPhone ? `<span style="font-size: 11px; color: #047857; font-weight: 700;">Sender: ${invoice.transferSenderPhone}</span>` : ''}
      </div>
      <div style="text-align: center;">
        <img src="${invoice.transferReceipt}" alt="Payment transfer proof" crossOrigin="anonymous" style="max-height: 220px; max-width: 100%; object-fit: contain; border-radius: 6px; border: 1px solid #e0dfd7;" />
      </div>
    </div>
  ` : '';

  const htmlContent = `
    <div style="position: relative; width: 720px; padding: 40px 42px 36px; background: #ffffff; font-family: 'Outfit', 'Cairo', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; direction: ltr; color: #242721; box-sizing: border-box;">
      
      <!-- Top Organic Wave -->
      <div style="position: absolute; top: 0; left: 0; right: 0; height: 95px; overflow: hidden; pointer-events: none; z-index: 0;">
        <svg viewBox="0 0 1000 120" preserveAspectRatio="none" style="width: 100%; height: 100%;">
          <path d="M0,0 L1000,0 L1000,45 Q750,85 500,55 Q250,25 0,65 Z" fill="#f4f3ef"/>
        </svg>
      </div>

      <!-- Top Header Row -->
      <div style="position: relative; z-index: 1; display: flex; justify-content: space-between; align-items: flex-start;">
        <div style="display: flex; alignItems: center; gap: 14px;">
          <img src="/caturra_logo.jpg" alt="Caturra Coffee Roasters" style="width: 52px; height: 52px; border-radius: 50%; object-fit: cover; border: 1.5px solid #dcdad3;" crossOrigin="anonymous" />
          <div>
            <div style="font-size: 25px; font-weight: 800; letter-spacing: -0.5px; color: #262923; line-height: 1.05;">caturra</div>
            <div style="font-size: 11px; font-weight: 600; letter-spacing: 1.4px; color: #6e7069; text-transform: lowercase; margin-top: 3px;">coffee roasters</div>
          </div>
        </div>
        <div style="text-align: right; font-size: 12.5px; color: #464942; line-height: 1.55;">
          <div style="font-weight: 700; color: #242721; font-size: 13.5px;">Egypt</div>
          <div>Tax ID: <strong style="color: #242721;">${taxNumber}</strong></div>
          <div style="font-size: 11px; color: #7a7c75;">Reg: ${commercialRegister}</div>
        </div>
      </div>

      <!-- Customer / Client Name -->
      <div style="position: relative; z-index: 1; margin-top: 38px; margin-bottom: 4px;">
        <div style="font-size: 15px; font-weight: 700; color: #242721;">${invoice.customerName || 'Retail Customer'}</div>
        ${invoice.customerPhone ? `<div style="font-size: 12px; color: #6f716a; margin-top: 2px;">${invoice.customerPhone}</div>` : ''}
      </div>

      <!-- Order Title -->
      <h1 style="position: relative; z-index: 1; font-size: 28px; font-weight: 700; color: #242721; margin: 4px 0 18px; letter-spacing: -0.5px;">
        Order # ${invoice.invoiceNumber}
      </h1>

      <!-- Meta Pill Block -->
      <div style="position: relative; z-index: 1; background: #ebe9e2; border-radius: 12px; padding: 16px 22px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px 20px; margin-bottom: 26px;">
        <div>
          <div style="font-size: 12.5px; font-weight: 700; color: #242721; margin-bottom: 3px;">Order Date</div>
          <div style="font-size: 13px; color: #464942; font-weight: 500;">${orderDateFormatted}</div>
        </div>
        <div>
          <div style="font-size: 12.5px; font-weight: 700; color: #242721; margin-bottom: 3px;">Delivery Date</div>
          <div style="font-size: 13px; color: #464942; font-weight: 500;">${deliveryDateFormatted}</div>
        </div>
        <div>
          <div style="font-size: 12.5px; font-weight: 700; color: #242721; margin-bottom: 3px;">Account Manager</div>
          <div style="font-size: 13px; color: #464942; font-weight: 500;">${accountManagerName}</div>
        </div>
        <div>
          <div style="font-size: 12.5px; font-weight: 700; color: #242721; margin-bottom: 3px;">Payment Method</div>
          <div style="font-size: 13px; color: #464942; font-weight: 500;">${paymentMethodLabel}</div>
        </div>
      </div>

      <!-- Items Table with Dark Olive Header -->
      <div style="position: relative; z-index: 1; border: 1px solid #dcdad1; border-radius: 8px 8px 0 0; overflow: hidden; background: #ffffff;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="background: #505342; color: #ffffff;">
              <th style="text-align: left; padding: 12px 16px; font-weight: 700; font-size: 13px;">Description</th>
              <th style="text-align: center; padding: 12px 14px; font-weight: 700; font-size: 13px; width: 110px;">Quantity</th>
              <th style="text-align: center; padding: 12px 14px; font-weight: 700; font-size: 13px; width: 110px;">Unit Price</th>
              <th style="text-align: right; padding: 12px 16px; font-weight: 700; font-size: 13px; width: 130px;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>
      </div>

      <!-- Floating Total Bar -->
      <div style="position: relative; z-index: 1; display: flex; justify-content: flex-end; margin-top: -1px;">
        <div style="display: inline-flex; align-items: center; justify-content: space-between; gap: 24px; background: #505342; color: #ffffff; padding: 10px 22px; border-radius: 0 0 8px 8px; font-weight: 700; font-size: 14px; min-width: 240px;">
          <span>Total</span>
          <span style="font-size: 15px; font-weight: 800;">${(Number(invoice.total) || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} LE</span>
        </div>
      </div>

      ${receiptSection}

      <!-- Footer: Company Info & Banking -->
      <div style="position: relative; z-index: 1; margin-top: 44px; display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 24px;">
        <div style="font-size: 12.5px; color: #444741; line-height: 1.9;">
          <div><strong>Company Name :</strong> Caturra For Coffee Products</div>
          <div><strong>Bank Name :</strong> Commercial International Bank (CIB)</div>
          <div><strong>Bank Account No.:</strong> 100069514264 (EGP)</div>
          <div><strong>TAX No.:</strong> ${taxNumber}</div>
          ${invoice.customerAddress ? `<div><strong>Delivery Address :</strong> ${invoice.customerAddress}</div>` : ''}
        </div>
        <div style="text-align: right; font-size: 11px; color: #7a7c75; line-height: 1.6;">
          <div style="font-weight: 700; color: #242721;">Caturra Specialty Coffee Roastery</div>
          <div>Cairo, Egypt • Tel: ${phone}</div>
          <div>Official Electronic Invoice</div>
        </div>
      </div>

      <!-- Bottom Organic Wave -->
      <div style="position: relative; width: 100%; height: 70px; margin-top: 20px; overflow: hidden; pointer-events: none;">
        <svg viewBox="0 0 1000 120" preserveAspectRatio="none" style="position: absolute; bottom: 0; left: 0; width: 100%; height: 60px;">
          <path d="M0,70 Q250,20 500,55 Q750,90 1000,40 L1000,120 L0,120 Z" fill="#f4f3ef"/>
        </svg>
      </div>
    </div>
  `;

  // Render into offscreen DOM element
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '0';
  container.style.width = '760px';
  container.style.zIndex = '-9999';
  container.style.backgroundColor = '#ffffff';
  container.innerHTML = htmlContent;
  document.body.appendChild(container);

  // Wait for any images to complete loading
  const images = Array.from(container.querySelectorAll('img'));
  if (images.length > 0) {
    await Promise.all(
      images.map(img => {
        if (img.complete && img.naturalHeight !== 0) return Promise.resolve();
        return new Promise(resolve => {
          img.onload = resolve;
          img.onerror = resolve;
          setTimeout(resolve, 300);
        });
      })
    );
  }

  try {
    const canvas = await html2canvas(container, {
      scale: 1.5,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });

    const pdf = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4',
      compress: true
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const imgData = canvas.toDataURL('image/jpeg', 0.90);

    if (imgHeight <= pageHeight) {
      pdf.addImage(imgData, 'JPEG', 0, 0, imgWidth, imgHeight);
    } else {
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
    }

    const blob = pdf.output('blob');
    const fileName = `فاتورة_كاتورا_${invoice.invoiceNumber || 'طلب'}.pdf`;
    const file = new File([blob], fileName, { type: 'application/pdf' });

    return { blob, file, fileName, pdf, canvas };
  } finally {
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
  }
};

/**
 * Download invoice directly as a real PDF file
 */
export const downloadInvoicePdf = async (invoice, contactInfo = {}) => {
  const { blob, fileName } = await generateInvoicePdfBlob(invoice, contactInfo);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
  return { fileName };
};

/**
 * Export invoice as PDF (downloads the real .pdf file)
 */
export const exportSingleInvoicePdf = async (invoice, contactInfo = {}) => {
  return await downloadInvoicePdf(invoice, contactInfo);
};

/**
 * Send real PDF document to the configured store WhatsApp chat DIRECTLY!
 * - Directly opens the exact WhatsApp chat of the configured store number (e.g. 01033144498)
 * - Automatically triggers download of the official PDF file to device
 * - Copies invoice image to clipboard so user can press Ctrl+V in WhatsApp chat to paste receipt
 */
export const sendInvoicePdfToWhatsApp = async (invoice, contactInfo = {}, targetPhone = null) => {
  if (!invoice) return;

  try {
    const { blob, fileName, canvas } = await generateInvoicePdfBlob(invoice, contactInfo);
    const storePhone = targetPhone 
      ? formatWhatsAppNumber(targetPhone) 
      : formatWhatsAppNumber(contactInfo?.whatsapp || contactInfo?.phone || STORE_WHATSAPP_NUMBER);

    // 1. Automatically download the official PDF invoice file to device
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);

    // 2. Upload invoice JPG image to server for public viewing & copy to clipboard
    const baseOrigin = typeof window !== 'undefined' ? (window.location.origin || '') : '';
    const safeInvNum = invoice.invoiceNumber || 'INV-2026';
    const safeFileName = String(safeInvNum).replace(/[^a-zA-Z0-9_-]/g, '_');
    const invoiceImageUrl = `${baseOrigin}/invoices/${safeFileName}.jpg`;
    const onlineInvoiceUrl = `${baseOrigin}/?invoice=${safeInvNum}`;

    if (canvas) {
      try {
        const imgData = canvas.toDataURL('image/jpeg', 0.90);
        await fetch('/api/upload-invoice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            invoiceNumber: safeInvNum,
            imageData: imgData,
            invoice: invoice
          })
        }).catch(() => {});
      } catch (err) {
        console.warn('Invoice image upload error:', err);
      }

      if (typeof navigator !== 'undefined' && navigator.clipboard && window.ClipboardItem) {
        try {
          canvas.toBlob(async (imageBlob) => {
            if (imageBlob) {
              try {
                await navigator.clipboard.write([
                  new window.ClipboardItem({ 'image/png': imageBlob })
                ]);
              } catch (e) {
                // ignore clipboard error
              }
            }
          }, 'image/png');
        } catch (e) {
          // ignore
        }
      }
    }

    // 3. Construct clean order details text for the WhatsApp chat
    let paymentMethodLabel = 'الدفع عند الاستلام (كاش)';
    if (invoice.paymentMethod === 'instapay') paymentMethodLabel = 'إنستاباي (InstaPay)';
    else if (invoice.paymentMethod === 'wallet') paymentMethodLabel = 'محفظة إلكترونية (فودافون كاش / كاش المحمول)';
    else if (invoice.paymentMethod === 'card') paymentMethodLabel = 'بطاقة بنكية';

    let transferNoteStr = '';
    if (invoice.transferSenderPhone) {
      transferNoteStr += `\n📲 *رقم المحول منه:* ${invoice.transferSenderPhone}`;
    }
    if (invoice.transferReceipt) {
      transferNoteStr += `\n📸 *إشعار التحويل:* تم إرفاقه وتوثيقه داخل ملف وصورة الفاتورة`;
    }

    const itemsSummary = (invoice.items || []).map((it, idx) => {
      const extra = [];
      if (it.weightLabel) extra.push(it.weightLabel);
      else if (it.weightGram) extra.push(`${it.weightGram}ج`);
      if (it.grind && it.grind !== 'حبوب كاملة') extra.push(`طحن: ${it.grind}`);
      const extraStr = extra.length > 0 ? ` (${extra.join(' - ')})` : '';
      return `${idx + 1}. *${it.name}*${extraStr} × ${it.qty}`;
    }).join('\n');

    const msg = 
`*طلب جديد من متجر كاتورا للقهوة المختصة 🌿☕*
━━━━━━━━━━━━━━━━━━━━
📋 *رقم الفاتورة:* ${invoice.invoiceNumber}
📅 *التاريخ:* ${invoice.date || 'الآن'}
👤 *اسم العميل:* ${invoice.customerName}
📱 *رقم الموبايل:* ${invoice.customerPhone || '—'}
📍 *العنوان:* ${invoice.customerAddress || 'القاهرة'}
💳 *طريقة الدفع:* ${paymentMethodLabel}${transferNoteStr}
━━━━━━━━━━━━━━━━━━━━
🛒 *قائمة الأصناف:*
${itemsSummary}
━━━━━━━━━━━━━━━━━━━━
${Number(invoice.discount || 0) > 0 ? `🏷️ *الخصم (${invoice.promoCode || 'كود خصم'}):* -${invoice.discount} ج.م\n` : ''}💰 *إجمالي الفاتورة المطلوب:* ${invoice.total} ج.م

🖼️ *رابط صورة الفاتورة الرسمية (JPG):*
${invoiceImageUrl}

🌐 *رابط عرض وتتبع الفاتورة أونلاين:*
${onlineInvoiceUrl}
━━━━━━━━━━━━━━━━━━━━
📄 *ملف الفاتورة الرسمي (PDF):*
تم حفظ ملف الفاتورة "${fileName}" على جهازي ويمكنك معاينته أو تحميله مباشرة من الروابط أعلاه 📎`;

    // 4. Open the exact WhatsApp chat directly to the configured number
    const waUrl = `https://wa.me/${storePhone}?text=${encodeURIComponent(msg)}`;
    
    const isMobile = typeof navigator !== 'undefined' && /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    if (isMobile) {
      window.location.href = waUrl;
    } else {
      const waWin = window.open(waUrl, '_blank');
      if (!waWin || waWin.closed || typeof waWin.closed === 'undefined') {
        window.location.href = waUrl;
      }
    }

    return { success: true, method: 'direct_whatsapp', fileName };
  } catch (err) {
    console.error('sendInvoicePdfToWhatsApp error:', err);
    const storePhone = targetPhone 
      ? formatWhatsAppNumber(targetPhone) 
      : formatWhatsAppNumber(contactInfo?.whatsapp || contactInfo?.phone || STORE_WHATSAPP_NUMBER);
    const waUrl = `https://wa.me/${storePhone}?text=${encodeURIComponent(`فاتورة طلب كاتورا #${invoice.invoiceNumber}`)}`;
    window.open(waUrl, '_blank');
    return { success: false, error: err };
  }
};


/**
 * Export Invoices to a printable & downloadable PDF report
 */
export const exportInvoicesToPdf = (invoices, contactInfo = {}) => {
  if (!invoices || !invoices.length) {
    alert('لا توجد فواتير متاحة للتصدير');
    return;
  }

  const brandName = contactInfo?.brandNameAr || 'كاتورا للقهوة المختصة';
  const commercialRegister = contactInfo?.commercialRegister || '148920';
  const taxNumber = contactInfo?.taxNumber || '582-934-211';
  const address = contactInfo?.address || 'القاهرة - مصر';
  const dateStr = new Date().toLocaleString('ar-EG-u-nu-latn', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const totalSales = invoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
  const totalPaid = invoices.reduce((sum, inv) => sum + (Number(inv.paidAmount) || 0), 0);
  const totalRemaining = invoices.reduce((sum, inv) => sum + (Number(inv.remainingDebt) || 0), 0);

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('يرجى السماح بالنوافذ المنبثقة للمتصفح لتصدير ملف الـ PDF');
    return;
  }

  const rowsHtml = invoices.map((inv, idx) => `
    <tr>
      <td style="text-align: center; color: #64748b;">${idx + 1}</td>
      <td style="font-weight: 800; color: #065f46;">${inv.invoiceNumber}</td>
      <td style="font-size: 11px;">${inv.date}</td>
      <td style="font-weight: 700;">${inv.customerName || 'عميل نقدي'}</td>
      <td style="font-size: 11px;">${inv.paymentMethod === 'cash' ? 'نقدي' : inv.paymentMethod === 'card' ? 'فيزا' : inv.paymentMethod === 'instapay' ? 'إنستاباي' : inv.paymentMethod === 'split' ? 'كاش + محفظة' : 'آجل'}</td>
      <td style="font-weight: 800;">${(Number(inv.total) || 0).toLocaleString('en-US')} ج.م</td>
      <td style="color: #16a34a; font-weight: 700;">${(Number(inv.paidAmount) || 0).toLocaleString('en-US')} ج.م</td>
      <td style="color: ${(Number(inv.remainingDebt) || 0) > 0 ? '#dc2626' : '#64748b'}; font-weight: 700;">
        ${(Number(inv.remainingDebt) || 0) > 0 ? `${(Number(inv.remainingDebt) || 0).toLocaleString('en-US')} ج.م` : '0'}
      </td>
      <td style="font-size: 11px;">${inv.status === 'paid' ? 'مدفوعة' : inv.status === 'pending' ? 'معلق' : inv.status === 'partial' ? 'جزئي' : 'غير مسددة'}</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>كشف الفواتير والمبيعات - ${brandName}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
      <style>
        @page { size: A4 portrait; margin: 12mm; }
        * { box-sizing: border-box; margin: 0; padding: 0; font-variant-numeric: tabular-nums lining-nums; }
        body { font-family: 'Cairo', sans-serif; color: #0f172a; padding: 24px; direction: rtl; }
        .no-print-bar { background: linear-gradient(135deg, #065f46 0%, #047857 100%); color: #fff; padding: 14px 24px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .btn-action { border: none; padding: 8px 18px; border-radius: 8px; font-weight: 800; font-family: inherit; cursor: pointer; font-size: 13px; }
        .btn-pdf { background: #fff; color: #065f46; margin-left: 8px; }
        .btn-close { background: rgba(255,255,255,0.18); color: #fff; }
        .header { display: flex; justify-content: space-between; border-bottom: 2.5px solid #059669; padding-bottom: 16px; margin-bottom: 20px; }
        .header h1 { font-size: 24px; font-weight: 900; color: #065f46; }
        .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 22px; }
        .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; text-align: center; }
        .card.green { background: #ecfdf5; border-color: #a7f3d0; color: #047857; }
        .card.red { background: #fef2f2; border-color: #fecaca; color: #dc2626; }
        .val { font-size: 18px; font-weight: 900; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 24px; }
        th { background: #f1f5f9; color: #334155; font-weight: 800; padding: 10px 8px; text-align: right; border: 1px solid #cbd5e1; }
        td { padding: 8px; border: 1px solid #e2e8f0; text-align: right; }
        tr:nth-child(even) { background: #fafafa; }
        .footer { border-top: 1px solid #e2e8f0; padding-top: 14px; display: flex; justify-content: space-between; font-size: 11px; color: #64748b; }
        @media print { .no-print-bar { display: none !important; } body { padding: 0; } }
      </style>
    </head>
    <body>
      <div class="no-print-bar">
        <div style="font-weight: 800;">📄 كشف الفواتير والمبيعات (PDF) - جاهز للطباعة أو الحفظ</div>
        <div>
          <button class="btn-action btn-pdf" onclick="window.print()">حفظ كملف PDF / طباعة 🖨️</button>
          <button class="btn-action btn-close" onclick="window.close()">إغلاق ✕</button>
        </div>
      </div>
      <div class="header">
        <div>
          <h1>${brandName}</h1>
          <h2 style="font-size: 14px; color: #059669; font-weight: 700;">كشف سجل الفواتير والمبيعات</h2>
        </div>
        <div style="font-size: 11px; color: #64748b; line-height: 1.6;">
          <div>تاريخ التقرير: ${dateStr}</div>
          <div>س.ت: ${commercialRegister} | ب.ض: ${taxNumber}</div>
        </div>
      </div>
      <div class="summary-grid">
        <div class="card"><div style="font-size: 11px; color: #64748b;">عدد الفواتير</div><div class="val">${invoices.length}</div></div>
        <div class="card green"><div style="font-size: 11px;">إجمالي المبيعات</div><div class="val">${totalSales.toLocaleString('en-US')} ج.م</div></div>
        <div class="card green"><div style="font-size: 11px;">المبلغ المحصل</div><div class="val">${totalPaid.toLocaleString('en-US')} ج.م</div></div>
        <div class="card red"><div style="font-size: 11px;">المتبقي والآجل</div><div class="val">${totalRemaining.toLocaleString('en-US')} ج.م</div></div>
      </div>
      <table>
        <thead>
          <tr>
            <th style="width: 30px; text-align: center;">#</th>
            <th>رقم الفاتورة</th>
            <th>التاريخ</th>
            <th>العميل</th>
            <th>الدفع</th>
            <th>الإجمالي</th>
            <th>المدفوع</th>
            <th>المتبقي</th>
            <th>الحالة</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
      <div class="footer">
        <div>نظام كاتورا لإدارة المحامص والمقاهي المختصة</div>
        <div>تقرير معتمد</div>
      </div>
      <script>
        window.onload = function() { setTimeout(function() { window.print(); }, 450); };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};

/**
 * Export Physical Stock Inventory Audit to a printable & downloadable PDF report
 */
export const exportStockAuditToPdf = ({ auditItems = [], summary = {}, contactInfo = {} }) => {
  if (!auditItems || !auditItems.length) {
    alert('لا توجد أصناف أو بيانات جرد متاحة للتصدير');
    return;
  }

  const brandName = contactInfo?.brandNameAr || 'كاتورا للقهوة المختصة';
  const brandNameEn = contactInfo?.brandNameEn || 'CATURRA COFFEE & ROASTER';
  const commercialRegister = contactInfo?.commercialRegister || '148920';
  const taxNumber = contactInfo?.taxNumber || '582-934-211';
  const address = contactInfo?.address || 'القاهرة - مصر';
  const dateStr = summary.auditDate || new Date().toLocaleString('ar-EG-u-nu-latn', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  const auditorName = summary.auditorName || 'مسؤول المخزن والجرد';

  const totalItems = auditItems.length;
  const matchedCount = auditItems.filter(it => it.diff === 0).length;
  const deficitCount = auditItems.filter(it => it.diff < 0).length;
  const surplusCount = auditItems.filter(it => it.diff > 0).length;
  const netDiffValue = auditItems.reduce((sum, it) => sum + (it.diffValue || 0), 0);

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('يرجى السماح بالنوافذ المنبثقة للمتصفح لتصدير وحفظ تقرير الـ PDF');
    return;
  }

  const rowsHtml = auditItems.map((item, idx) => {
    const isDeficit = item.diff < 0;
    const isSurplus = item.diff > 0;
    const diffColor = isDeficit ? '#dc2626' : (isSurplus ? '#0284c7' : '#16a34a');
    const statusText = isDeficit 
      ? `عجز (${Math.abs(item.diff)})` 
      : (isSurplus ? `زيادة (+${item.diff})` : 'مطابق ✓');

    return `
      <tr>
        <td style="text-align: center; color: #64748b; font-weight: 700;">${idx + 1}</td>
        <td style="font-family: monospace; font-weight: 700; color: #0f172a;">${item.sku || '-'}</td>
        <td style="font-weight: 800; color: #065f46;">
          ${item.name}
          <div style="font-size: 10px; color: #64748b; font-weight: 500;">
            ${item.unitType === 'weight' ? 'بالوزن (كجم)' : 'بالقطعة'} • ${item.categoryName || ''}
          </div>
        </td>
        <td style="text-align: center; font-weight: 800; background: #f8fafc;">
          ${item.systemStock} ${item.unitType === 'weight' ? 'كجم' : 'ق'}
        </td>
        <td style="text-align: center; font-weight: 800; color: #0f172a; background: #f1f5f9;">
          ${item.actualStock} ${item.unitType === 'weight' ? 'كجم' : 'ق'}
        </td>
        <td style="text-align: center; font-weight: 800; color: ${diffColor};">
          ${item.diff > 0 ? `+${item.diff}` : item.diff}
        </td>
        <td style="text-align: center; font-weight: 700; font-size: 10.5px; color: ${diffColor};">
          ${statusText}
        </td>
        <td style="text-align: center; font-weight: 600;">
          ${(Number(item.costPrice) || 0).toLocaleString('en-US')} ج.م
        </td>
        <td style="text-align: center; font-weight: 800; color: ${diffColor};">
          ${(item.diffValue || 0) > 0 ? `+${(item.diffValue || 0).toLocaleString('en-US')}` : (item.diffValue || 0).toLocaleString('en-US')} ج.م
        </td>
        <td style="font-size: 10.5px; color: #64748b;">
          ${item.notes || '-'}
        </td>
      </tr>
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>محضر جرد المخزن الفعلي - ${brandName}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
      <style>
        @page { size: A4 landscape; margin: 10mm; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Cairo', sans-serif; color: #0f172a; padding: 20px; direction: rtl; }
        .no-print-bar { background: linear-gradient(135deg, #065f46 0%, #047857 100%); color: #fff; padding: 12px 20px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .btn-action { border: none; padding: 8px 18px; border-radius: 8px; font-weight: 800; font-family: inherit; cursor: pointer; font-size: 13px; }
        .btn-pdf { background: #fff; color: #065f46; margin-left: 8px; }
        .btn-close { background: rgba(255,255,255,0.18); color: #fff; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2.5px solid #059669; padding-bottom: 14px; margin-bottom: 16px; }
        .header-title h1 { font-size: 22px; font-weight: 900; color: #065f46; }
        .header-title h2 { font-size: 13px; color: #059669; font-weight: 700; }
        .header-meta { text-align: left; font-size: 11px; color: #64748b; line-height: 1.6; }
        .summary-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 18px; }
        .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; text-align: center; }
        .card.green { background: #ecfdf5; border-color: #a7f3d0; }
        .card.red { background: #fef2f2; border-color: #fecaca; }
        .card.blue { background: #f0f9ff; border-color: #bae6fd; }
        .card-label { font-size: 10.5px; font-weight: 700; color: #64748b; margin-bottom: 3px; }
        .card-val { font-size: 16px; font-weight: 900; color: #0f172a; }
        .card.green .card-val { color: #047857; }
        .card.red .card-val { color: #dc2626; }
        .card.blue .card-val { color: #0284c7; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px; }
        th { background: #f1f5f9; color: #334155; font-weight: 800; padding: 8px 6px; text-align: right; border: 1px solid #cbd5e1; }
        td { padding: 7px 6px; border: 1px solid #e2e8f0; text-align: right; vertical-align: middle; }
        tr:nth-child(even) { background: #fafafa; }
        .signatures { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; margin-top: 28px; padding-top: 14px; border-top: 1.5px dashed #cbd5e1; }
        .sig-box { text-align: center; font-size: 11.5px; color: #334155; }
        .sig-line { margin-top: 40px; border-top: 1px solid #94a3b8; width: 80%; margin-left: auto; margin-right: auto; padding-top: 4px; font-size: 10px; color: #64748b; }
        .footer { margin-top: 16px; font-size: 10.5px; color: #94a3b8; display: flex; justify-content: space-between; }
        @media print { .no-print-bar { display: none !important; } body { padding: 0; } }
      </style>
    </head>
    <body>
      <div class="no-print-bar">
        <div style="font-weight: 800; font-size: 13.5px;">
          📄 محضر جرد المخزن الفعلي (PDF) - جاهز للطباعة أو الحفظ كملف رسمي
        </div>
        <div>
          <button class="btn-action btn-pdf" onclick="window.print()">حفظ كملف PDF / طباعة 🖨️</button>
          <button class="btn-action btn-close" onclick="window.close()">إغلاق ✕</button>
        </div>
      </div>

      <div class="header">
        <div class="header-title">
          <h1>${brandName}</h1>
          <h2>محضر جرد المخزون الفعلي ومطابقة الأرصدة المستودعية</h2>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">${brandNameEn}</div>
        </div>
        <div class="header-meta">
          <div><strong>تاريخ وتوقيت الجرد:</strong> ${dateStr}</div>
          <div><strong>القائم بالجرد:</strong> ${auditorName}</div>
          <div><strong>س.ت:</strong> ${commercialRegister} | <strong>ب.ض:</strong> ${taxNumber}</div>
        </div>
      </div>

      <div class="summary-grid">
        <div class="card">
          <div class="card-label">إجمالي الأصناف المجرودة</div>
          <div class="card-val">${totalItems} صنف</div>
        </div>
        <div class="card green">
          <div class="card-label">أصناف مطابقة تماماً (✓)</div>
          <div class="card-val">${matchedCount} صنف</div>
        </div>
        <div class="card red">
          <div class="card-label">أصناف بها عجز (نقص)</div>
          <div class="card-val">${deficitCount} صنف</div>
        </div>
        <div class="card blue">
          <div class="card-label">أصناف بها زيادة (فائض)</div>
          <div class="card-val">${surplusCount} صنف</div>
        </div>
        <div class="card ${netDiffValue < 0 ? 'red' : (netDiffValue > 0 ? 'blue' : 'green')}">
          <div class="card-label">صافي الفارق المالي</div>
          <div class="card-val">${netDiffValue > 0 ? `+${netDiffValue.toLocaleString('en-US')}` : netDiffValue.toLocaleString('en-US')} ج.م</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 28px; text-align: center;">#</th>
            <th style="width: 75px;">كود الصنف</th>
            <th>اسم الصنف / المنتج</th>
            <th style="text-align: center; width: 75px;">الرصيد الدفتري</th>
            <th style="text-align: center; width: 75px;">الجرد الفعلي</th>
            <th style="text-align: center; width: 65px;">الفارق</th>
            <th style="text-align: center; width: 85px;">حالة البند</th>
            <th style="text-align: center; width: 75px;">تكلفة الوحدة</th>
            <th style="text-align: center; width: 85px;">قيمة الفارق</th>
            <th>ملاحظات وتبريرات الجرد</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div class="signatures">
        <div class="sig-box">
          <strong>القائم بأعمال الجرد</strong>
          <div style="font-size: 11px; margin-top: 2px;">${auditorName}</div>
          <div class="sig-line">التوقيع والتاريخ</div>
        </div>
        <div class="sig-box">
          <strong>أمين المستودع والمخزن</strong>
          <div style="font-size: 11px; margin-top: 2px;">إقرار بالاستلام ومطابقة الكميات</div>
          <div class="sig-line">التوقيع والتاريخ</div>
        </div>
        <div class="sig-box">
          <strong>المدير المالي / الإدارة العامة</strong>
          <div style="font-size: 11px; margin-top: 2px;">اعتماد محضر الجرد والتسوية</div>
          <div class="sig-line">الختم والاعتماد</div>
        </div>
      </div>

      <div class="footer">
        <div>نظام كاتورا لإدارة المحامص والمخازن (Caturra ERP) • مستخرج آلياً</div>
        <div>صفحة رسمية معتمدة</div>
      </div>

      <script>
        window.onload = function() { setTimeout(function() { window.print(); }, 450); };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};

/**
 * Export Physical Stock Inventory Audit to CSV Excel
 */
export const exportStockAuditToCsv = (auditItems = []) => {
  const headers = [
    'كود الصنف (SKU)',
    'اسم المنتج',
    'التصنيف',
    'نوع الوحدة',
    'الرصيد الدفتري (النظام)',
    'الجرد الفعلي المحصور',
    'الفارق (الكمية)',
    'حالة الجرد',
    'تكلفة الوحدة (ج.م)',
    'قيمة الفارق المالي (ج.م)',
    'ملاحظات الجرد'
  ];

  const rows = auditItems.map(it => [
    it.sku || '',
    it.name || '',
    it.categoryName || '',
    it.unitType === 'weight' ? 'بالوزن (كجم)' : 'بالقطعة',
    it.systemStock || 0,
    it.actualStock || 0,
    it.diff || 0,
    it.diff === 0 ? 'مطابق' : (it.diff < 0 ? `عجز (${Math.abs(it.diff)})` : `زيادة (+${it.diff})`),
    it.costPrice || 0,
    it.diffValue || 0,
    it.notes || ''
  ]);

  exportToCsv('محضر_جرد_المخزن_الفعلي_كاتورا', headers, rows);
};

/**
 * Export a Single Supplier Account Statement & Invoices to PDF
 */
export const exportSupplierStatementPdf = (supplier, supplierPurchases = [], contactInfo = {}) => {
  if (!supplier) return;

  const brandName = contactInfo?.brandNameAr || 'كاتورا للقهوة المختصة';
  const commercialRegister = contactInfo?.commercialRegister || '148920';
  const taxNumber = contactInfo?.taxNumber || '582-934-211';
  const address = contactInfo?.address || 'القاهرة - مصر';
  const phone = contactInfo?.phone || '+20 100 000 0000';
  const dateStr = new Date().toLocaleString('ar-EG-u-nu-latn', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const totalPurchases = supplierPurchases.reduce((sum, p) => sum + (Number(p.totalAmount) || 0), 0);
  const totalPaid = supplierPurchases.reduce((sum, p) => sum + (Number(p.paidAmount) || 0), 0);
  const totalDebt = supplierPurchases.reduce((sum, p) => sum + (Number(p.remainingAmount) || 0), 0);

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('يرجى السماح بالنوافذ المنبثقة (Popups) للمتصفح لتحميل ملف الـ PDF');
    return;
  }

  const rowsHtml = supplierPurchases.map((pur, idx) => {
    const itemsText = (pur.items || []).map(it => `${it.name} (${it.qty})`).join('، ');
    const statusText = pur.paymentStatus === 'paid' ? 'مسددة بالكامل' : (pur.paymentStatus === 'partial' ? 'سداد جزئي' : 'غير مسددة (آجل)');
    const statusColor = pur.paymentStatus === 'paid' ? '#047857' : (pur.paymentStatus === 'partial' ? '#b45309' : '#dc2626');
    const statusBg = pur.paymentStatus === 'paid' ? '#ecfdf5' : (pur.paymentStatus === 'partial' ? '#fffbeb' : '#fef2f2');

    return `
      <tr>
        <td style="text-align: center; color: #64748b; font-weight: 700;">${idx + 1}</td>
        <td style="font-weight: 800; color: #065f46;">${pur.invoiceNumber}</td>
        <td style="color: #475569; font-size: 11px;">${pur.date}</td>
        <td style="font-size: 11px; color: #334155; max-width: 200px;">${itemsText || '-'}</td>
        <td style="font-weight: 800; text-align: left;">${(Number(pur.totalAmount) || 0).toLocaleString('en-US')} ج.م</td>
        <td style="color: #047857; font-weight: 700; text-align: left;">${(Number(pur.paidAmount) || 0).toLocaleString('en-US')} ج.م</td>
        <td style="color: ${(Number(pur.remainingAmount) || 0) > 0 ? '#dc2626' : '#64748b'}; font-weight: 800; text-align: left;">
          ${(Number(pur.remainingAmount) || 0) > 0 ? `${(Number(pur.remainingAmount) || 0).toLocaleString('en-US')} ج.م` : '0 ج.م'}
        </td>
        <td style="text-align: center;">
          <span style="background: ${statusBg}; color: ${statusColor}; padding: 3px 8px; border-radius: 6px; font-weight: 700; font-size: 10px;">
            ${statusText}
          </span>
        </td>
      </tr>
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>كشف حساب مورد - ${supplier.name}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
      <style>
        @page { size: A4 portrait; margin: 12mm; }
        * { box-sizing: border-box; margin: 0; padding: 0; font-variant-numeric: tabular-nums lining-nums; }
        body { font-family: 'Cairo', sans-serif; color: #0f172a; padding: 24px; direction: rtl; }
        .no-print-bar { background: linear-gradient(135deg, #065f46 0%, #047857 100%); color: #fff; padding: 14px 24px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; box-shadow: 0 4px 12px rgba(6, 95, 70, 0.15); }
        .btn-action { border: none; padding: 8px 18px; border-radius: 8px; font-weight: 800; font-family: inherit; cursor: pointer; font-size: 13px; }
        .btn-pdf { background: #fff; color: #065f46; margin-left: 8px; }
        .btn-close { background: rgba(255,255,255,0.2); color: #fff; }
        .header { display: flex; justify-content: space-between; border-bottom: 2.5px solid #059669; padding-bottom: 16px; margin-bottom: 20px; }
        .header h1 { font-size: 22px; font-weight: 900; color: #065f46; }
        .header h2 { font-size: 15px; color: #059669; font-weight: 700; margin-top: 4px; }
        .supplier-info-box { background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 20px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; font-size: 12px; }
        .info-item { display: flex; flex-direction: column; gap: 3px; }
        .info-label { color: #64748b; font-size: 11px; font-weight: 700; }
        .info-val { color: #0f172a; font-weight: 800; }
        .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 22px; }
        .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px; text-align: center; }
        .card.green { background: #ecfdf5; border-color: #a7f3d0; color: #047857; }
        .card.red { background: #fef2f2; border-color: #fecaca; color: #dc2626; }
        .val { font-size: 18px; font-weight: 900; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 24px; }
        th { background: #f1f5f9; color: #334155; font-weight: 800; padding: 10px 8px; text-align: right; border: 1px solid #cbd5e1; }
        td { padding: 9px 8px; border: 1px solid #e2e8f0; }
        tr:nth-child(even) { background: #fafafa; }
        .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 36px; padding-top: 20px; border-top: 1px dashed #cbd5e1; }
        .sig-box { text-align: center; }
        .sig-line { margin-top: 45px; border-top: 1.5px solid #94a3b8; width: 70%; margin-left: auto; margin-right: auto; padding-top: 6px; font-size: 11px; color: #64748b; }
        .footer { border-top: 1px solid #e2e8f0; padding-top: 14px; margin-top: 24px; display: flex; justify-content: space-between; font-size: 11px; color: #64748b; }
        @media print { .no-print-bar { display: none !important; } body { padding: 0; } }
      </style>
    </head>
    <body>
      <div class="no-print-bar">
        <div style="font-weight: 800;">📄 كشف حساب مورد تفصيلي (PDF) - جاهز للطباعة أو الحفظ</div>
        <div>
          <button class="btn-action btn-pdf" onclick="window.print()">حفظ كملف PDF / طباعة 🖨️</button>
          <button class="btn-action btn-close" onclick="window.close()">إغلاق ✕</button>
        </div>
      </div>

      <div class="header">
        <div>
          <h1>${brandName}</h1>
          <h2>كشف حساب وفواتير المورد</h2>
        </div>
        <div style="font-size: 11px; color: #64748b; line-height: 1.6; text-align: left;">
          <div>تاريخ الإصدار: ${dateStr}</div>
          <div>س.ت: ${commercialRegister} | ب.ض: ${taxNumber}</div>
          <div>العنوان: ${address}</div>
        </div>
      </div>

      <div class="supplier-info-box">
        <div class="info-item">
          <span class="info-label">اسم المورد / الشركة:</span>
          <span class="info-val">${supplier.name}</span>
        </div>
        <div class="info-item">
          <span class="info-label">جهة الاتصال / المسؤول:</span>
          <span class="info-val">${supplier.contactPerson || '-'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">رقم الهاتف:</span>
          <span class="info-val" dir="ltr" style="text-align: right;">${supplier.phone || '-'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">تصنيف التوريد:</span>
          <span class="info-val">${supplier.category || 'مورد عام'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">العنوان / المدينة:</span>
          <span class="info-val">${supplier.address || supplier.city || '-'}</span>
        </div>
        <div class="info-item">
          <span class="info-label">الرقم الضريبي:</span>
          <span class="info-val">${supplier.taxNumber || '-'}</span>
        </div>
      </div>

      <div class="summary-grid">
        <div class="card">
          <div style="font-size: 11px; color: #64748b;">عدد الفواتير المسجلة</div>
          <div class="val">${supplierPurchases.length}</div>
        </div>
        <div class="card">
          <div style="font-size: 11px; color: #0284c7;">إجمالي قيمة التوريدات</div>
          <div class="val" style="color: #0369a1;">${totalPurchases.toLocaleString('en-US')} ج.م</div>
        </div>
        <div class="card green">
          <div style="font-size: 11px;">المبلغ المسدد للمورد</div>
          <div class="val">${totalPaid.toLocaleString('en-US')} ج.م</div>
        </div>
        <div class="card red">
          <div style="font-size: 11px;">صافي المديونية المتبقية</div>
          <div class="val">${totalDebt.toLocaleString('en-US')} ج.م</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 30px; text-align: center;">#</th>
            <th>رقم الفاتورة</th>
            <th>التاريخ</th>
            <th>الأصناف الموردة</th>
            <th style="text-align: left;">إجمالي الفاتورة</th>
            <th style="text-align: left;">المدفوع</th>
            <th style="text-align: left;">المتبقي (مديونية)</th>
            <th style="text-align: center;">حالة السداد</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml || '<tr><td colspan="8" style="text-align: center; padding: 20px; color: #94a3b8;">لا توجد فواتير توريد مسجلة لهذا المورد</td></tr>'}
        </tbody>
      </table>

      <div class="signatures">
        <div class="sig-box">
          <div style="font-weight: 800; font-size: 12px; color: #334155;">إدارة الحسابات والمشتريات (${brandName})</div>
          <div class="sig-line">التوقيع والاعتماد</div>
        </div>
        <div class="sig-box">
          <div style="font-weight: 800; font-size: 12px; color: #334155;">إقرار استلام ومطابقة رصيد المورد (${supplier.name})</div>
          <div class="sig-line">توقيع المستلم / المندوب والختم</div>
        </div>
      </div>

      <div class="footer">
        <div>نظام كاتورا لإدارة المحامص والمقاهي المختصة (Caturra Coffee ERP)</div>
        <div>كشف حساب معتمد إلكترونياً</div>
      </div>

      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 450);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};

/**
 * Export All Suppliers Directory & Debts Report to PDF
 */
export const exportAllSuppliersPdf = (suppliers = [], purchases = [], contactInfo = {}) => {
  if (!suppliers || !suppliers.length) {
    alert('لا توجد بيانات موردين متاحة للتصدير');
    return;
  }

  const brandName = contactInfo?.brandNameAr || 'كاتورا للقهوة المختصة';
  const commercialRegister = contactInfo?.commercialRegister || '148920';
  const taxNumber = contactInfo?.taxNumber || '582-934-211';
  const dateStr = new Date().toLocaleString('ar-EG-u-nu-latn', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  let grandTotalPurchases = 0;
  let grandTotalPaid = 0;
  let grandTotalDebt = 0;
  let suppliersWithDebtCount = 0;

  const rowsHtml = suppliers.map((sup, idx) => {
    const supPurchases = purchases.filter(p => (p.supplierName || '').trim().toLowerCase() === sup.name.trim().toLowerCase());
    const totalP = supPurchases.reduce((s, p) => s + (Number(p.totalAmount) || 0), 0);
    const paidP = supPurchases.reduce((s, p) => s + (Number(p.paidAmount) || 0), 0);
    const debtP = supPurchases.reduce((s, p) => s + (Number(p.remainingAmount) || 0), 0);

    grandTotalPurchases += totalP;
    grandTotalPaid += paidP;
    grandTotalDebt += debtP;
    if (debtP > 0) suppliersWithDebtCount++;

    return `
      <tr>
        <td style="text-align: center; color: #64748b; font-weight: 700;">${idx + 1}</td>
        <td style="font-weight: 800; color: #0f172a;">${sup.name}</td>
        <td dir="ltr" style="text-align: right; color: #334155;">${sup.phone || '-'}</td>
        <td style="color: #475569;">${sup.category || 'مورد عام'}</td>
        <td style="text-align: center; font-weight: 700;">${supPurchases.length}</td>
        <td style="font-weight: 800; color: #0369a1; text-align: left;">${totalP.toLocaleString('en-US')} ج.م</td>
        <td style="font-weight: 700; color: #047857; text-align: left;">${paidP.toLocaleString('en-US')} ج.م</td>
        <td style="font-weight: 800; color: ${debtP > 0 ? '#dc2626' : '#16a34a'}; text-align: left;">
          ${debtP > 0 ? `${debtP.toLocaleString('en-US')} ج.م` : 'خالص ✓'}
        </td>
      </tr>
    `;
  }).join('');

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('يرجى السماح بالنوافذ المنبثقة (Popups) للمتصفح لتحميل ملف الـ PDF');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>تقرير كشف الموردين والمديونيات - ${brandName}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
      <style>
        @page { size: A4 landscape; margin: 10mm; }
        * { box-sizing: border-box; margin: 0; padding: 0; font-variant-numeric: tabular-nums lining-nums; }
        body { font-family: 'Cairo', sans-serif; color: #0f172a; padding: 20px; direction: rtl; }
        .no-print-bar { background: linear-gradient(135deg, #065f46 0%, #047857 100%); color: #fff; padding: 14px 24px; border-radius: 12px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .btn-action { border: none; padding: 8px 18px; border-radius: 8px; font-weight: 800; font-family: inherit; cursor: pointer; font-size: 13px; }
        .btn-pdf { background: #fff; color: #065f46; margin-left: 8px; }
        .btn-close { background: rgba(255,255,255,0.2); color: #fff; }
        .header { display: flex; justify-content: space-between; border-bottom: 2.5px solid #059669; padding-bottom: 14px; margin-bottom: 18px; }
        .header h1 { font-size: 22px; font-weight: 900; color: #065f46; }
        .summary-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-bottom: 20px; }
        .card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 10px; text-align: center; }
        .card.green { background: #ecfdf5; border-color: #a7f3d0; color: #047857; }
        .card.red { background: #fef2f2; border-color: #fecaca; color: #dc2626; }
        .val { font-size: 16px; font-weight: 900; margin-top: 3px; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; margin-bottom: 20px; }
        th { background: #f1f5f9; color: #334155; font-weight: 800; padding: 9px 8px; text-align: right; border: 1px solid #cbd5e1; }
        td { padding: 8px; border: 1px solid #e2e8f0; }
        tr:nth-child(even) { background: #fafafa; }
        .footer { border-top: 1px solid #e2e8f0; padding-top: 12px; display: flex; justify-content: space-between; font-size: 11px; color: #64748b; }
        @media print { .no-print-bar { display: none !important; } body { padding: 0; } }
      </style>
    </head>
    <body>
      <div class="no-print-bar">
        <div style="font-weight: 800;">📄 تقرير الموردين وحسابات الآجل (PDF) - جاهز للطباعة أو الحفظ</div>
        <div>
          <button class="btn-action btn-pdf" onclick="window.print()">حفظ كملف PDF / طباعة 🖨️</button>
          <button class="btn-action btn-close" onclick="window.close()">إغلاق ✕</button>
        </div>
      </div>

      <div class="header">
        <div>
          <h1>${brandName}</h1>
          <h2 style="font-size: 14px; color: #059669; font-weight: 700;">دليل الموردين الشامل وموقف المديونيات</h2>
        </div>
        <div style="font-size: 11px; color: #64748b; line-height: 1.5; text-align: left;">
          <div>تاريخ التقرير: ${dateStr}</div>
          <div>س.ت: ${commercialRegister} | ب.ض: ${taxNumber}</div>
        </div>
      </div>

      <div class="summary-grid">
        <div class="card"><div style="font-size: 11px; color: #64748b;">إجمالي الموردين</div><div class="val">${suppliers.length} مورد</div></div>
        <div class="card"><div style="font-size: 11px; color: #0284c7;">إجمالي المشتريات</div><div class="val" style="color: #0369a1;">${grandTotalPurchases.toLocaleString('en-US')} ج.م</div></div>
        <div class="card green"><div style="font-size: 11px;">إجمالي المسدد</div><div class="val">${grandTotalPaid.toLocaleString('en-US')} ج.م</div></div>
        <div class="card red"><div style="font-size: 11px;">إجمالي المديونيات المستحقة</div><div class="val">${grandTotalDebt.toLocaleString('en-US')} ج.م</div></div>
        <div class="card"><div style="font-size: 11px; color: #d97706;">موردين لهم مديونية</div><div class="val" style="color: #b45309;">${suppliersWithDebtCount}</div></div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 30px; text-align: center;">#</th>
            <th>اسم المورد</th>
            <th>رقم الهاتف</th>
            <th>التصنيف</th>
            <th style="text-align: center; width: 60px;">الفواتير</th>
            <th style="text-align: left;">إجمالي التوريدات</th>
            <th style="text-align: left;">المسدد</th>
            <th style="text-align: left;">المديونية</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>

      <div class="footer">
        <div>نظام كاتورا لإدارة المحامص والمقاهي المختصة (Caturra Coffee ERP)</div>
        <div>صفحة معتمدة إلكترونياً</div>
      </div>

      <script>
        window.onload = function() { setTimeout(function() { window.print(); }, 450); };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};

/**
 * Print a Professional Purchase / Supplier Invoice to PDF
 */
export const printPurchaseInvoice = (purchase, contactInfo = {}) => {
  if (!purchase) return;

  const brandName = contactInfo?.brandNameAr || 'كاتورا للقهوة المختصة';
  const commercialRegister = contactInfo?.commercialRegister || '148920';
  const taxNumber = contactInfo?.taxNumber || '582-934-211';
  const address = contactInfo?.address || 'القاهرة - مصر';
  const phone = contactInfo?.phone || '+20 100 000 0000';

  const itemsHtml = (purchase.items || []).map((it, idx) => `
    <tr>
      <td style="text-align: center; color: #64748b;">${idx + 1}</td>
      <td style="font-weight: 800; color: #0f172a;">${it.name}</td>
      <td style="text-align: center;">${it.unitType === 'weight' ? 'كجم (وزن)' : 'قطعة'}</td>
      <td style="text-align: center; font-weight: 700;">${it.qty}</td>
      <td style="text-align: left;">${(Number(it.costPrice) || 0).toLocaleString('en-US')} ج.م</td>
      <td style="text-align: left; font-weight: 800; color: #047857;">${((Number(it.costPrice) || 0) * (Number(it.qty) || 0)).toLocaleString('en-US')} ج.م</td>
      <td style="text-align: center; font-size: 11px; color: #64748b;">${it.expiryDate || '-'}</td>
    </tr>
  `).join('');

  const paymentsHtml = (purchase.payments && purchase.payments.length > 0) ? `
    <div style="margin-top: 18px; margin-bottom: 18px;">
      <h3 style="font-size: 13px; font-weight: 800; color: #334155; margin-bottom: 8px;">سجل الدفعات المسددة لهذه الفاتورة:</h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
        <thead>
          <tr style="background: #f8fafc;">
            <th style="padding: 6px; border: 1px solid #e2e8f0; text-align: right;">التاريخ</th>
            <th style="padding: 6px; border: 1px solid #e2e8f0; text-align: left;">المبلغ</th>
            <th style="padding: 6px; border: 1px solid #e2e8f0; text-align: right;">طريقة الدفع</th>
            <th style="padding: 6px; border: 1px solid #e2e8f0; text-align: right;">ملاحظات</th>
          </tr>
        </thead>
        <tbody>
          ${purchase.payments.map(pay => `
            <tr>
              <td style="padding: 6px; border: 1px solid #e2e8f0;">${pay.date}</td>
              <td style="padding: 6px; border: 1px solid #e2e8f0; text-align: left; font-weight: 700; color: #047857;">${Number(pay.amount).toLocaleString('en-US')} ج.م</td>
              <td style="padding: 6px; border: 1px solid #e2e8f0;">${pay.paymentMethod === 'cash' ? 'نقدي (كاش)' : pay.paymentMethod === 'instapay' ? 'إنستاباي / محفظة' : 'تحويل بنكي'}</td>
              <td style="padding: 6px; border: 1px solid #e2e8f0; color: #64748b;">${pay.notes || '-'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  ` : '';

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('يرجى السماح بالنوافذ المنبثقة (Popups) للمتصفح لطباعة الفاتورة');
    return;
  }

  const html = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>فاتورة توريد مشتريات #${purchase.invoiceNumber}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
      <style>
        @page { size: A4 portrait; margin: 12mm; }
        * { box-sizing: border-box; margin: 0; padding: 0; font-variant-numeric: tabular-nums lining-nums; }
        body { font-family: 'Cairo', sans-serif; color: #0f172a; padding: 24px; direction: rtl; }
        .no-print-bar { background: linear-gradient(135deg, #065f46 0%, #047857 100%); color: #fff; padding: 12px 20px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .btn-action { border: none; padding: 8px 16px; border-radius: 8px; font-weight: 800; font-family: inherit; cursor: pointer; font-size: 13px; }
        .btn-print { background: #fff; color: #065f46; margin-left: 8px; }
        .btn-close { background: rgba(255,255,255,0.2); color: #fff; }
        .invoice-card { border: 1.5px solid #cbd5e1; border-radius: 12px; padding: 24px; }
        .header { display: flex; justify-content: space-between; border-bottom: 2px solid #059669; padding-bottom: 14px; margin-bottom: 18px; }
        .header h1 { font-size: 22px; font-weight: 900; color: #065f46; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; background: #f8fafc; padding: 14px; border-radius: 10px; margin-bottom: 20px; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 20px; }
        th { background: #f1f5f9; color: #334155; font-weight: 800; padding: 9px 8px; text-align: right; border: 1px solid #cbd5e1; }
        td { padding: 9px 8px; border: 1px solid #e2e8f0; }
        tr:nth-child(even) { background: #fafafa; }
        .totals-box { width: 280px; margin-right: auto; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 10px; padding: 12px; font-size: 12px; }
        .total-row { display: flex; justify-content: space-between; margin-bottom: 6px; }
        .total-row.final { border-top: 1.5px solid #cbd5e1; padding-top: 8px; font-size: 14px; font-weight: 900; color: #065f46; }
        .signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 36px; padding-top: 20px; border-top: 1px dashed #cbd5e1; }
        .sig-box { text-align: center; }
        .sig-line { margin-top: 40px; border-top: 1.5px solid #94a3b8; width: 70%; margin-left: auto; margin-right: auto; padding-top: 6px; font-size: 11px; color: #64748b; }
        @media print { .no-print-bar { display: none !important; } body { padding: 0; } }
      </style>
    </head>
    <body>
      <div class="no-print-bar">
        <div style="font-weight: 800;">🖨️ فاتورة توريد مشتريات #${purchase.invoiceNumber} - جاهزة للطباعة / الحفظ</div>
        <div>
          <button class="btn-action btn-print" onclick="window.print()">طباعة الفاتورة / PDF 🖨️</button>
          <button class="btn-action btn-close" onclick="window.close()">إغلاق ✕</button>
        </div>
      </div>

      <div class="invoice-card">
        <div class="header">
          <div>
            <h1>${brandName}</h1>
            <div style="font-size: 13px; color: #059669; font-weight: 700; margin-top: 4px;">إذن استلام وتوريد بضاعة / فاتورة مشتريات</div>
          </div>
          <div style="text-align: left; font-size: 12px; color: #64748b;">
            <div style="font-weight: 900; font-size: 14px; color: #065f46;">رقم الفاتورة: #${purchase.invoiceNumber}</div>
            <div>تاريخ الفاتورة: ${purchase.date}</div>
            <div>س.ت: ${commercialRegister} | ب.ض: ${taxNumber}</div>
          </div>
        </div>

        <div class="info-grid">
          <div>
            <div>المورد: <strong style="color: #0f172a;">${purchase.supplierName}</strong></div>
            <div style="margin-top: 4px; color: #64748b;">ملاحظات الفاتورة: ${purchase.notes || 'لا توجد'}</div>
          </div>
          <div style="text-align: left;">
            <div>حالة السداد: <strong style="color: ${purchase.paymentStatus === 'paid' ? '#047857' : (purchase.paymentStatus === 'partial' ? '#b45309' : '#dc2626')};">${purchase.paymentStatus === 'paid' ? 'مدفوعة بالكامل' : (purchase.paymentStatus === 'partial' ? 'سداد جزئي' : 'آجلة / غير مسددة')}</strong></div>
            <div style="margin-top: 4px; color: #64748b;">مستلم الشحنة: قسم الاستلام والمخازن</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 30px; text-align: center;">#</th>
              <th>بيان الصنف المورد</th>
              <th style="text-align: center;">نوع الوحدة</th>
              <th style="text-align: center;">الكمية</th>
              <th style="text-align: left;">سعر التكلفة</th>
              <th style="text-align: left;">إجمالي التكلفة</th>
              <th style="text-align: center;">تاريخ الصلاحية</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        ${paymentsHtml}

        <div class="totals-box">
          <div class="total-row">
            <span>إجمالي الفاتورة:</span>
            <strong>${(Number(purchase.totalAmount) || 0).toLocaleString('en-US')} ج.م</strong>
          </div>
          <div class="total-row" style="color: #047857;">
            <span>المبلغ المدفوع للمورد:</span>
            <strong>${(Number(purchase.paidAmount) || 0).toLocaleString('en-US')} ج.م</strong>
          </div>
          <div class="total-row final" style="color: ${(Number(purchase.remainingAmount) || 0) > 0 ? '#dc2626' : '#047857'};">
            <span>المتبقي (مديونية المورد):</span>
            <span>${(Number(purchase.remainingAmount) || 0).toLocaleString('en-US')} ج.م</span>
          </div>
        </div>

        <div class="signatures">
          <div class="sig-box">
            <div style="font-weight: 800; font-size: 12px; color: #334155;">مسؤول الاستلام والمخازن</div>
            <div class="sig-line">الاسم والتوقيع</div>
          </div>
          <div class="sig-box">
            <div style="font-weight: 800; font-size: 12px; color: #334155;">المورد / مندوب التوريد</div>
            <div class="sig-line">توقيع المندوب والختم</div>
          </div>
        </div>
      </div>

      <script>
        window.onload = function() { setTimeout(function() { window.print(); }, 450); };
      </script>
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
};

/**
 * Export Suppliers to CSV
 */
export const exportSuppliersToCsv = (suppliers = [], purchases = []) => {
  const headers = [
    'كود المورد',
    'اسم المورد',
    'جهة الاتصال',
    'رقم الهاتف',
    'البريد الإلكتروني',
    'المدينة',
    'العنوان',
    'التصنيف',
    'الرقم الضريبي',
    'عدد الفواتير',
    'إجمالي التوريدات (ج.م)',
    'إجمالي المسدد (ج.م)',
    'المديونية الحالية (ج.م)',
    'ملاحظات'
  ];

  const rows = suppliers.map(sup => {
    const supPurchases = purchases.filter(p => (p.supplierName || '').trim().toLowerCase() === sup.name.trim().toLowerCase());
    const totalP = supPurchases.reduce((s, p) => s + (Number(p.totalAmount) || 0), 0);
    const paidP = supPurchases.reduce((s, p) => s + (Number(p.paidAmount) || 0), 0);
    const debtP = supPurchases.reduce((s, p) => s + (Number(p.remainingAmount) || 0), 0);

    return [
      sup.id || '',
      sup.name || '',
      sup.contactPerson || '',
      sup.phone || '',
      sup.email || '',
      sup.city || '',
      sup.address || '',
      sup.category || '',
      sup.taxNumber || '',
      supPurchases.length,
      totalP,
      paidP,
      debtP,
      sup.notes || ''
    ];
  });

  exportToCsv('سجل_الموردين_والحسابات_كاتورا', headers, rows);
};

/**
 * Export B2B Wholesale Report (Leads CRM, Standing Orders, or Invoices) to a clean,
 * corporate A4 PDF report, isolated from dashboard chrome for pristine printing and saving.
 */
export const exportB2BReportPdf = ({
  subTab = 'leads',
  leads = [],
  standingOrders = [],
  invoices = [],
  contactInfo = {},
  language = 'ar',
  autoPrint = false,
  onNotification = null
}) => {
  const brandName = contactInfo?.brandNameAr || 'كاتورا للقهوة المختصة';
  const brandNameEn = contactInfo?.brandNameEn || 'CATURRA COFFEE & ROASTER';
  const commercialRegister = contactInfo?.commercialRegister || '148920';
  const taxNumber = contactInfo?.taxNumber || '582-934-211';
  const phone = contactInfo?.phone || contactInfo?.whatsapp || '01033144498';
  const address = contactInfo?.address || 'القاهرة - جمهورية مصر العربية';
  const dateStr = new Date().toLocaleString('ar-EG-u-nu-latn', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  const fileDate = new Date().toISOString().slice(0, 10);

  // Check data
  if (subTab === 'leads' && (!leads || leads.length === 0)) {
    if (onNotification) onNotification(language === 'en' ? 'No leads available to export' : 'لا توجد بيانات شراكات متاحة للتصدير');
    return false;
  }
  if (subTab === 'standing' && (!standingOrders || standingOrders.length === 0)) {
    if (onNotification) onNotification(language === 'en' ? 'No standing orders available to export' : 'لا توجد عقود توريد دورية متاحة للتصدير');
    return false;
  }
  if (subTab === 'invoices' && (!invoices || invoices.length === 0)) {
    if (onNotification) onNotification(language === 'en' ? 'No invoices available to export' : 'لا توجد فواتير توريد متاحة للتصدير');
    return false;
  }

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    if (onNotification) onNotification(language === 'en' ? 'Please allow browser popups to export & print PDF' : 'يرجى السماح بالنوافذ المنبثقة (Popups) للمتصفح لتصدير وطباعة ملف الـ PDF');
    return false;
  }

  let reportTitle = '';
  let defaultFileName = '';
  let kpiCardsHtml = '';
  let tableHeadersHtml = '';
  let tableRowsHtml = '';

  const businessTypeLabels = {
    specialty_cafe: 'كافيه مختص (Specialty)',
    commercial_cafe: 'كافيه تجاري / كورنر',
    restaurant_hotel: 'مطعم / فندق وضيافة',
    office_corporate: 'شركة / مقر أعمال',
    new_brand: 'براند قهوة (Private Label)',
    other: 'نشاط تجاري آخر'
  };

  const statusLabels = {
    new: { label: 'جديد (لم يتم الرد)', color: '#d97706', bg: '#fef3c7' },
    contacted: { label: 'تم التواصل وعرض السعر', color: '#0284c7', bg: '#e0f2fe' },
    cupping: { label: 'جلسة تذوق وضبط استخلاص', color: '#9333ea', bg: '#f3e8ff' },
    contracted: { label: 'شريك معتمد (تم التعاقد)', color: '#059669', bg: '#d1fae5' },
    cancelled: { label: 'ملغي / غير مهتم', color: '#64748b', bg: '#f1f5f9' }
  };

  if (subTab === 'leads') {
    reportTitle = 'كشف طلبات وشراكات مبيعات الجملة (B2B CRM Pipeline)';
    defaultFileName = `كشف_شراكات_الجملة_كاتورا_${fileDate}`;

    const totalLeads = leads.length;
    const contractedCount = leads.filter(l => l.status === 'contracted').length;
    const totalEstKg = leads.reduce((sum, l) => {
      const match = String(l.monthlyVolume || '').match(/\d+/);
      return sum + (match ? parseInt(match[0], 10) : 25);
    }, 0);
    const totalQuoted = leads.reduce((sum, l) => sum + (Number(l.quotedAmount) || 0), 0);

    kpiCardsHtml = `
      <div class="card">
        <div class="card-label">إجمالي الشركاء والطلبات</div>
        <div class="card-value">${totalLeads} طلب / شريك</div>
      </div>
      <div class="card amber">
        <div class="card-label">الاستهلاك الشهري التقديري</div>
        <div class="card-value">${totalEstKg.toLocaleString('en-US')} كجم / شهر</div>
      </div>
      <div class="card green">
        <div class="card-label">عقود معتمدة (تم التعاقد)</div>
        <div class="card-value">${contractedCount} شريك معتمد</div>
      </div>
      <div class="card blue">
        <div class="card-label">إجمالي العروض التقديرية</div>
        <div class="card-value">${totalQuoted.toLocaleString('en-US')} ج.م</div>
      </div>
    `;

    tableHeadersHtml = `
      <tr>
        <th style="width: 30px; text-align: center;">#</th>
        <th style="width: 85px;">كود الشريك</th>
        <th>اسم المنشأة / الكافيه</th>
        <th>المسؤول</th>
        <th style="width: 95px;">رقم الهاتف</th>
        <th>المدينة</th>
        <th>نوع النشاط</th>
        <th>الاستهلاك</th>
        <th>المواصفات المطلوبة</th>
        <th style="text-align: center;">الحالة</th>
        <th style="text-align: left;">العرض التقديري</th>
        <th style="width: 75px; text-align: center;">التاريخ</th>
      </tr>
    `;

    tableRowsHtml = leads.map((l, idx) => {
      const st = statusLabels[l.status] || { label: l.status || '-', color: '#334155', bg: '#f1f5f9' };
      const feats = [];
      if (l.privateLabel) feats.push('علامة خاصة');
      if (l.monthlyContract) feats.push('عقد دوري');
      if (l.extractionSupport) feats.push('دعم استخلاص');

      return `
        <tr>
          <td style="text-align: center; color: #64748b; font-weight: 700;">${idx + 1}</td>
          <td style="font-family: monospace; font-weight: 800; color: #92400e;">${l.refCode || '-'}</td>
          <td style="font-weight: 800; color: #0f172a;">${l.companyName || '-'}</td>
          <td style="color: #334155;">${l.contactName || '-'}</td>
          <td dir="ltr" style="text-align: right; color: #475569; font-weight: 600;">${l.phone || '-'}</td>
          <td>${l.city || '-'}</td>
          <td>${businessTypeLabels[l.businessType] || l.businessType || '-'}</td>
          <td style="font-weight: 700; color: #b45309;">${l.monthlyVolume || '-'}</td>
          <td style="font-size: 10px; color: #64748b;">${feats.length ? feats.join(' • ') : 'توريد عام'}</td>
          <td style="text-align: center;">
            <span style="display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 800; color: ${st.color}; background: ${st.bg}; border: 1px solid ${st.color}33;">
              ${st.label}
            </span>
          </td>
          <td style="text-align: left; font-weight: 800; color: #047857;">${l.quotedAmount ? `${Number(l.quotedAmount).toLocaleString('en-US')} ج.م` : '-'}</td>
          <td style="text-align: center; font-size: 10px; color: #64748b;">${l.createdAt ? l.createdAt.split('T')[0] : '-'}</td>
        </tr>
      `;
    }).join('');
  } else if (subTab === 'standing') {
    reportTitle = 'كشف عقود التوريد والطلبيات الدورية الثابتة (B2B Standing Orders)';
    defaultFileName = `كشف_عقود_التوريد_الدورية_كاتورا_${fileDate}`;

    const totalOrders = standingOrders.length;
    const activeOrders = standingOrders.filter(o => o.status === 'active').length;
    const today = new Date().toISOString().split('T')[0];
    const dueOrders = standingOrders.filter(o => o.status === 'active' && o.nextDeliveryDate && o.nextDeliveryDate <= today).length;
    const totalRevenue = standingOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

    kpiCardsHtml = `
      <div class="card">
        <div class="card-label">إجمالي عقود التوريد</div>
        <div class="card-value">${totalOrders} عقد مسجل</div>
      </div>
      <div class="card green">
        <div class="card-label">العقود النشطة سارية التوريد</div>
        <div class="card-value">${activeOrders} عقد نشط</div>
      </div>
      <div class="card ${dueOrders > 0 ? 'red' : 'green'}">
        <div class="card-label">توريدات مستحقة التنفيذ</div>
        <div class="card-value">${dueOrders} توريد مستحق</div>
      </div>
      <div class="card amber">
        <div class="card-label">قيمة التوريدات للدورة الواحدة</div>
        <div class="card-value">${totalRevenue.toLocaleString('en-US')} ج.م</div>
      </div>
    `;

    tableHeadersHtml = `
      <tr>
        <th style="width: 30px; text-align: center;">#</th>
        <th style="width: 90px;">كود العقد</th>
        <th>اسم الشريك / الكافيه</th>
        <th style="width: 95px;">الهاتف</th>
        <th>المدينة</th>
        <th>دورية التوريد</th>
        <th style="text-align: center;">التوريد القادم</th>
        <th>الأصناف والكميات</th>
        <th style="text-align: left;">قيمة الشحنة</th>
        <th style="text-align: center; width: 75px;">الحالة</th>
      </tr>
    `;

    tableRowsHtml = standingOrders.map((o, idx) => {
      const freqLabel = o.deliveryFrequency === 'weekly' ? 'أسبوعي (كل 7 أيام)' : o.deliveryFrequency === 'biweekly' ? 'نصف شهري (كل 14 يوم)' : 'شهري';
      const itemsStr = (o.items || []).map(i => `${i.name || 'بن'} (${i.qty || 1})`).join('، ') || 'توريد بن دوري';
      const isActive = o.status === 'active';
      const isDue = isActive && o.nextDeliveryDate && o.nextDeliveryDate <= today;

      return `
        <tr>
          <td style="text-align: center; color: #64748b; font-weight: 700;">${idx + 1}</td>
          <td style="font-family: monospace; font-weight: 800; color: #92400e;">${o.refCode || '-'}</td>
          <td style="font-weight: 800; color: #0f172a;">${o.customerName || '-'}</td>
          <td dir="ltr" style="text-align: right; color: #475569; font-weight: 600;">${o.customerPhone || '-'}</td>
          <td>${o.city || '-'}</td>
          <td style="font-weight: 600;">${freqLabel}</td>
          <td style="text-align: center; font-weight: 700; color: ${isDue ? '#dc2626' : '#0f172a'};">
            ${o.nextDeliveryDate || '-'} ${isDue ? '⏰' : ''}
          </td>
          <td style="font-size: 11px; color: #475569; max-width: 220px;">${itemsStr}</td>
          <td style="text-align: left; font-weight: 800; color: #047857;">${(Number(o.totalAmount) || 0).toLocaleString('en-US')} ج.م</td>
          <td style="text-align: center;">
            <span style="display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 800; color: ${isActive ? '#047857' : '#94a3b8'}; background: ${isActive ? '#ecfdf5' : '#f1f5f9'}; border: 1px solid ${isActive ? '#a7f3d0' : '#cbd5e1'};">
              ${isActive ? 'نشط ساري' : 'موقوف'}
            </span>
          </td>
        </tr>
      `;
    }).join('');
  } else if (subTab === 'invoices') {
    reportTitle = 'كشف سجل فواتير التوريد والمديونيات (B2B Wholesale Invoices)';
    defaultFileName = `كشف_فواتير_الجملة_والمديونيات_كاتورا_${fileDate}`;

    const totalCount = invoices.length;
    const totalSales = invoices.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);
    const totalCollected = invoices.reduce((sum, inv) => sum + (Number(inv.paidAmount) || 0), 0);
    const totalDebt = invoices.reduce((sum, inv) => sum + (Number(inv.remainingDebt) || 0), 0);

    kpiCardsHtml = `
      <div class="card">
        <div class="card-label">إجمالي الفواتير الصادرة</div>
        <div class="card-value">${totalCount} فاتورة</div>
      </div>
      <div class="card blue">
        <div class="card-label">إجمالي مبيعات التوريد</div>
        <div class="card-value">${totalSales.toLocaleString('en-US')} ج.م</div>
      </div>
      <div class="card green">
        <div class="card-label">إجمالي المسدد والمحصل</div>
        <div class="card-value">${totalCollected.toLocaleString('en-US')} ج.م</div>
      </div>
      <div class="card ${totalDebt > 0 ? 'red' : 'green'}">
        <div class="card-label">إجمالي المديونيات المستحقة</div>
        <div class="card-value">${totalDebt.toLocaleString('en-US')} ج.م</div>
      </div>
    `;

    tableHeadersHtml = `
      <tr>
        <th style="width: 30px; text-align: center;">#</th>
        <th style="width: 90px;">رقم الفاتورة</th>
        <th>اسم العميل / الكافيه</th>
        <th style="width: 95px;">الهاتف</th>
        <th style="width: 85px; text-align: center;">التاريخ</th>
        <th>طريقة السداد</th>
        <th style="text-align: left;">إجمالي الفاتورة</th>
        <th style="text-align: left;">المسدد</th>
        <th style="text-align: left;">المتبقي (مديونية)</th>
        <th style="text-align: center; width: 80px;">الحالة</th>
      </tr>
    `;

    tableRowsHtml = invoices.map((inv, idx) => {
      const debt = Number(inv.remainingDebt) || 0;
      let payLabel = 'نقدي';
      if (inv.paymentMethod === 'card') payLabel = 'فيزا / بنك';
      else if (inv.paymentMethod === 'instapay') payLabel = 'إنستاباي';
      else if (inv.paymentMethod === 'split') payLabel = 'سداد مركب';
      else if (inv.paymentMethod === 'partial') payLabel = 'دفعة مقدمة';
      else if (inv.paymentMethod === 'deferred') payLabel = 'آجل';

      return `
        <tr>
          <td style="text-align: center; color: #64748b; font-weight: 700;">${idx + 1}</td>
          <td style="font-family: monospace; font-weight: 800; color: #92400e;">${inv.invoiceNumber || '-'}</td>
          <td style="font-weight: 800; color: #0f172a;">${inv.customerName || 'عميل جملة'}</td>
          <td dir="ltr" style="text-align: right; color: #475569; font-weight: 600;">${inv.customerPhone || '-'}</td>
          <td style="text-align: center; font-size: 10px; color: #64748b;">${inv.date ? inv.date.split(' ')[0] : '-'}</td>
          <td style="font-size: 11px;">${payLabel}</td>
          <td style="text-align: left; font-weight: 800; color: #0f172a;">${(Number(inv.total) || 0).toLocaleString('en-US')} ج.م</td>
          <td style="text-align: left; font-weight: 700; color: #047857;">${(Number(inv.paidAmount) || 0).toLocaleString('en-US')} ج.م</td>
          <td style="text-align: left; font-weight: 800; color: ${debt > 0 ? '#dc2626' : '#16a34a'};">
            ${debt > 0 ? `${debt.toLocaleString('en-US')} ج.م` : 'خالص ✓'}
          </td>
          <td style="text-align: center;">
            <span style="display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 800; color: ${inv.status === 'paid' ? '#047857' : debt > 0 ? '#b45309' : '#64748b'}; background: ${inv.status === 'paid' ? '#ecfdf5' : '#fef3c7'};">
              ${inv.status === 'paid' ? 'مدفوعة' : inv.status === 'returned' ? 'مرتجعة' : 'غير مسددة'}
            </span>
          </td>
        </tr>
      `;
    }).join('');
  }

  const html = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>${defaultFileName}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
      <style>
        @page {
          size: A4 landscape;
          margin: 10mm;
        }
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-variant-numeric: tabular-nums lining-nums;
        }
        body {
          font-family: 'Cairo', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          color: #0f172a;
          background: #ffffff;
          padding: 16px 20px;
          direction: rtl;
        }
        .no-print-bar {
          background: linear-gradient(135deg, #78350f 0%, #92400e 50%, #b45309 100%);
          color: #ffffff;
          padding: 12px 20px;
          border-radius: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 18px;
          box-shadow: 0 4px 14px rgba(120, 53, 15, 0.2);
        }
        .btn-action {
          border: none;
          padding: 7px 16px;
          border-radius: 8px;
          font-weight: 800;
          font-family: inherit;
          cursor: pointer;
          font-size: 13px;
          transition: all 0.15s ease;
        }
        .btn-pdf {
          background: #ffffff;
          color: #78350f;
          margin-left: 8px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.15);
        }
        .btn-close {
          background: rgba(255,255,255,0.22);
          color: #ffffff;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2.5px solid #92400e;
          padding-bottom: 14px;
          margin-bottom: 16px;
        }
        .header-logo-block {
          display: flex;
          align-items: center;
          gap: 14px;
        }
        .header-logo {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #b45309;
        }
        .header-title h1 {
          font-size: 21px;
          font-weight: 900;
          color: #78350f;
          line-height: 1.15;
        }
        .header-title h2 {
          font-size: 13px;
          color: #b45309;
          font-weight: 700;
          margin-top: 3px;
        }
        .header-title .en-sub {
          font-size: 10.5px;
          color: #64748b;
          letter-spacing: 0.5px;
        }
        .header-meta {
          text-align: left;
          font-size: 11px;
          color: #475569;
          line-height: 1.6;
        }
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 10px;
          margin-bottom: 18px;
        }
        .card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 10px 12px;
          text-align: center;
        }
        .card.amber { background: #fffbeb; border-color: #fde68a; }
        .card.green { background: #ecfdf5; border-color: #a7f3d0; }
        .card.blue { background: #f0f9ff; border-color: #bae6fd; }
        .card.red { background: #fef2f2; border-color: #fecaca; }
        .card-label {
          font-size: 10.5px;
          font-weight: 700;
          color: #64748b;
          margin-bottom: 3px;
        }
        .card-value {
          font-size: 15px;
          font-weight: 900;
          color: #0f172a;
        }
        .card.amber .card-value { color: #b45309; }
        .card.green .card-value { color: #047857; }
        .card.blue .card-value { color: #0284c7; }
        .card.red .card-value { color: #dc2626; }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
          margin-bottom: 18px;
        }
        thead {
          display: table-header-group;
        }
        tr {
          page-break-inside: avoid;
        }
        th {
          background: #f1f5f9;
          color: #1e293b;
          font-weight: 800;
          padding: 8px 6px;
          text-align: right;
          border: 1px solid #cbd5e1;
          font-size: 10.5px;
        }
        td {
          padding: 7px 6px;
          border: 1px solid #e2e8f0;
          text-align: right;
          vertical-align: middle;
        }
        tr:nth-child(even) {
          background: #fafafa;
        }
        .doc-signatures {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 18px;
          padding: 12px 18px;
          border: 1px dashed #cbd5e1;
          border-radius: 8px;
          font-size: 11px;
        }
        .footer {
          border-top: 1px solid #e2e8f0;
          padding-top: 10px;
          margin-top: 14px;
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: #64748b;
        }
        @media print {
          .no-print-bar {
            display: none !important;
          }
          body {
            padding: 0;
            background: #ffffff !important;
          }
        }
      </style>
    </head>
    <body>
      <div class="no-print-bar">
        <div style="font-weight: 800; font-size: 13.5px; display: flex; align-items: center; gap: 8px;">
          <span>📄</span>
          <span>${reportTitle} - جاهز للحفظ كملف PDF أو الطباعة</span>
        </div>
        <div>
          <button class="btn-action btn-pdf" onclick="window.print()">حفظ كملف PDF / طباعة 🖨️</button>
          <button class="btn-action btn-close" onclick="window.close()">إغلاق ✕</button>
        </div>
      </div>

      <div class="header">
        <div class="header-logo-block">
          <img src="/caturra_logo.jpg" alt="Logo" class="header-logo" onerror="this.style.display='none'">
          <div class="header-title">
            <h1>${brandName}</h1>
            <h2>${reportTitle}</h2>
            <div class="en-sub">${brandNameEn} • B2B Executive Operations</div>
          </div>
        </div>
        <div class="header-meta">
          <div><strong>تاريخ التصدير:</strong> ${dateStr}</div>
          <div><strong>السجل التجاري:</strong> ${commercialRegister} | <strong>البطاقة الضريبية:</strong> ${taxNumber}</div>
          <div><strong>الفرع / العنوان:</strong> ${address} | <strong>هاتف:</strong> ${phone}</div>
        </div>
      </div>

      <div class="summary-grid">
        ${kpiCardsHtml}
      </div>

      <table>
        <thead>
          ${tableHeadersHtml}
        </thead>
        <tbody>
          ${tableRowsHtml}
        </tbody>
      </table>

      <div class="doc-signatures">
        <div>
          <div style="font-weight: 800; color: #475569;">توقيع وقبول ممثل المنشأة / العميل:</div>
          <div style="margin-top: 24px; color: #94a3b8;">الاسم والختم: ........................................</div>
        </div>
        <div style="text-align: center;">
          <div style="font-weight: 800; color: #78350f;">إدارة مبيعات الجملة والشراكات - محمصة كاتورا</div>
          <div style="margin-top: 4px; display: inline-block; border: 2px dashed #b45309; border-radius: 50%; width: 56px; height: 56px; line-height: 52px; color: #92400e; font-weight: 900; font-size: 9px;">
            ختم معتمد
          </div>
        </div>
      </div>

      <div class="footer">
        <div>نظام كاتورا لإدارة المحامص والمقاهي المختصة (Caturra Coffee ERP)</div>
        <div>وثيقة رسمية معتمدة إلكترونياً • صفحة 1 من 1</div>
      </div>

      ${autoPrint ? `
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 350);
        };
      </script>
      ` : ''}
    </body>
    </html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  return true;
};


