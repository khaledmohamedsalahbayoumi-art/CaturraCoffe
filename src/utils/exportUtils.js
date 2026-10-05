// Excel / CSV Export Utilities with UTF-8 BOM for 100% Arabic Excel Compatibility

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
      inv.paymentMethod === 'instapay' ? 'إنستاباي' : 'آجل';

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
  const brandNameEn = contactInfo?.brandNameEn || 'CATURRA SPECIALTY COFFEE';
  const commercialRegister = contactInfo?.commercialRegister || '148920';
  const taxNumber = contactInfo?.taxNumber || '582-934-211';
  const address = contactInfo?.address || 'القاهرة - مصر';
  const dateStr = new Date().toLocaleString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const totalDebts = customers.reduce((sum, c) => sum + (Number(c.debt) || 0), 0);
  const totalPurchases = customers.reduce((sum, c) => sum + (Number(c.totalPurchases) || 0), 0);
  const customersWithDebt = customers.filter(c => (Number(c.debt) || 0) > 0).length;

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('يرجى السماح بالنوافذ المنبثقة (Popups) للمتصفح لتصدير وحفظ ملف الـ PDF');
    return;
  }

  const rowsHtml = customers.map((c, idx) => `
    <tr>
      <td style="text-align: center; color: #64748b; font-weight: 700;">${idx + 1}</td>
      <td style="font-weight: 800; color: #0f172a;">${c.name || 'عميل نقدي'}</td>
      <td dir="ltr" style="text-align: right; color: #334155;">${c.phone || '-'}</td>
      <td style="color: #475569;">${c.address || c.city || '-'}</td>
      <td style="text-align: center; font-weight: 700;">${c.ordersCount || 0}</td>
      <td style="font-weight: 800; color: #047857;">${(Number(c.totalPurchases) || 0).toLocaleString('en-US')} ج.م</td>
      <td style="font-weight: 800; color: ${(Number(c.debt) || 0) > 0 ? '#dc2626' : '#16a34a'};">
        ${(Number(c.debt) || 0) > 0 ? `${(Number(c.debt) || 0).toLocaleString('en-US')} ج.م` : 'خالص ✓'}
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
        <div>نظام كاتورا لإدارة المحامص والمقاهي المختصة (Caturra Coffee ERP) ☕</div>
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
  const dateStr = new Date().toLocaleString('ar-EG', {
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
      <td style="font-size: 11px;">${inv.paymentMethod === 'cash' ? 'نقدي' : inv.paymentMethod === 'card' ? 'فيزا' : inv.paymentMethod === 'instapay' ? 'إنستاباي' : 'آجل'}</td>
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
        * { box-sizing: border-box; margin: 0; padding: 0; }
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
        <div>نظام كاتورا لإدارة المحامص والمقاهي المختصة ☕</div>
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
  const brandNameEn = contactInfo?.brandNameEn || 'CATURRA SPECIALTY COFFEE';
  const commercialRegister = contactInfo?.commercialRegister || '148920';
  const taxNumber = contactInfo?.taxNumber || '582-934-211';
  const address = contactInfo?.address || 'القاهرة - مصر';
  const dateStr = summary.auditDate || new Date().toLocaleString('ar-EG', {
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
        <div>نظام كاتورا لإدارة المحامص والمخازن (Caturra ERP) • مستخرج آلياً ☕</div>
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
