import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Search,
  FileText,
  Printer,
  Share2,
  CheckCircle,
  Clock,
  AlertCircle,
  Filter,
  DollarSign,
  Calendar,
  MessageSquare,
  Package,
  Check,
  XCircle,
  Truck,
  QrCode,
  Eye,
  Image,
  Download,
  ExternalLink,
  Upload,
  UploadCloud,
  RefreshCw,
  RotateCcw,
  X
} from 'lucide-react';
import { ReturnInvoiceModal } from '../components/ReturnInvoiceModal';
import { DebtSettlementModal } from '../components/DebtSettlementModal';
import { InvoiceMiniQr } from '../components/InvoiceQrCode';
import { exportInvoicesToPdf } from '../utils/exportUtils';
import { normalizeArabic, normalizePhone } from '../utils/numberEnforcer';

export const InvoicesView = () => {
  const {
    invoices,
    customers,
    openInvoiceModal,
    settleCustomerDebt,
    pendingOrdersCount,
    confirmPendingOrder,
    cancelInvoice,
    cancelPendingOrder,
    openTrackingModal,
    updateInvoiceTrackingStatus,
    updateInvoiceReceipt,
    contactInfo,
    confirmDialog,
    returnInvoiceItems,
    treasuryAccounts = []
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [settlingInvoice, setSettleInvoice] = useState(null);
  const [viewingReceiptInvoice, setViewingReceiptInvoice] = useState(null);
  const [invoiceToReturn, setInvoiceToReturn] = useState(null);

  // Directly attach or update the real screenshot image for an invoice
  const handleReceiptFileSelection = (invoiceId, file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const rawBase64 = event.target.result;
      const img = new window.Image();
      img.onload = () => {
        try {
          const maxDim = 1200;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          updateInvoiceReceipt(invoiceId, compressed, file.name);
          if (viewingReceiptInvoice && viewingReceiptInvoice.id === invoiceId) {
            setViewingReceiptInvoice(prev => ({ ...prev, transferReceipt: compressed, transferReceiptFileName: file.name }));
          }
        } catch {
          updateInvoiceReceipt(invoiceId, rawBase64, file.name);
          if (viewingReceiptInvoice && viewingReceiptInvoice.id === invoiceId) {
            setViewingReceiptInvoice(prev => ({ ...prev, transferReceipt: rawBase64, transferReceiptFileName: file.name }));
          }
        }
      };
      img.onerror = () => {
        updateInvoiceReceipt(invoiceId, rawBase64, file.name);
        if (viewingReceiptInvoice && viewingReceiptInvoice.id === invoiceId) {
          setViewingReceiptInvoice(prev => ({ ...prev, transferReceipt: rawBase64, transferReceiptFileName: file.name }));
        }
      };
      img.src = rawBase64;
    };
    reader.readAsDataURL(file);
  };

  // Filter invoices
  const filteredInvoices = invoices.filter(inv => {
    if (!inv) return false;
    const invNum = (inv.invoiceNumber || '').toLowerCase();
    const custName = (inv.customerName || '').toLowerCase();
    const custPhone = String(inv.customerPhone || '');
    const q = (searchQuery || '').toLowerCase();
    const matchesSearch = invNum.includes(q) || custName.includes(q) || custPhone.includes(q);
    const matchesStatus = statusFilter === 'all'
      ? true
      : statusFilter === 'returned'
      ? (inv.status === 'returned' || inv.status === 'partially_returned')
      : inv.status === statusFilter;
    const matchesDate = !dateFilter || (Boolean(inv.date) && inv.date.startsWith(dateFilter));
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Direct WhatsApp helper (Egyptian Prefix +20)
  const sendWhatsApp = (inv) => {
    let phone = inv.customerPhone ? inv.customerPhone.replace(/[^0-9]/g, '') : '';
    if (phone.startsWith('0')) {
      phone = '20' + phone.substring(1);
    } else if (phone && !phone.startsWith('20')) {
      phone = '20' + phone;
    }
    const itemsList = Array.isArray(inv.items) ? inv.items.map(it => `• ${it.name} (${it.qty}x)`).join('\n') : '';
    const msg = `مرحباً ${inv.customerName || ''}، إليك تفاصيل فاتورتك من كاتورا للقهوة المختصة:\nرقم الفاتورة: ${inv.invoiceNumber || ''}\nالتاريخ: ${inv.date || ''}\nالمنتجات:\n${itemsList}\nالإجمالي: ${inv.total || 0} ج.م\nالمدفوع: ${inv.paidAmount || 0} ج.م\nالمتبقي: ${inv.remainingDebt || 0} ج.م\nشكراً لزيارتك كاتورا! ☕`;
    const encoded = encodeURIComponent(msg);
    const url = phone ? `https://wa.me/${phone}?text=${encoded}` : `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank');
  };

  // Total metrics
  const totalSales = invoices.reduce((sum, inv) => sum + (Number(inv?.total) || 0), 0);
  const totalCollected = invoices.reduce((sum, inv) => sum + (Number(inv?.paidAmount) || 0), 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + (Number(inv?.remainingDebt) || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Pending Orders Alert Banner */}
      {pendingOrdersCount > 0 && (
        <div
          style={{
            background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
            border: '2px solid #f59e0b',
            borderRadius: '16px',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            boxShadow: '0 4px 16px rgba(245, 158, 11, 0.18)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: '#f59e0b',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Package size={22} />
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: '800', color: '#92400e' }}>
                يوجد ({pendingOrdersCount}) طلبات أونلاين جديدة معلقة بانتظار التأكيد والتجهيز! 📦
              </div>
              <div style={{ fontSize: '0.82rem', color: '#78350f', marginTop: '2px' }}>
                وردت من المتجر الإلكتروني. يمكنك تأكيد الطلب، إلغاؤه مع استرجاع المخزون، أو التواصل مع العميل عبر واتساب.
              </div>
            </div>
          </div>

          <button
            onClick={() => setStatusFilter('pending')}
            className="btn"
            style={{
              background: '#f59e0b',
              color: '#ffffff',
              fontWeight: '800',
              padding: '8px 18px',
              borderRadius: '10px',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            عرض الطلبات المعلقة فقط ({pendingOrdersCount}) ←
          </button>
        </div>
      )}

      {/* Top Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid var(--mint-600)' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>إجمالي الفواتير الصادرة</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: 'var(--text-main)', marginTop: '4px' }}>
            {invoices.length} <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>فاتورة</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--mint-700)', marginTop: '4px' }}>
            بقيمة: {totalSales.toLocaleString()} ج.م
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #16a34a' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>المبالغ المحصلة (كاش وإنستاباي وفيزا)</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#16a34a', marginTop: '4px' }}>
            {totalCollected.toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>ج.م</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            تم استلامها وإيداعها في الصندوق والبنك
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>إجمالي المديونيات الآجلة</div>
          <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#b45309', marginTop: '4px' }}>
            {totalOutstanding.toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>ج.م</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#b45309', marginTop: '4px' }}>
            مستحقة لدى العملاء بانتظار التحصيل
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', right: '12px', top: '12px' }} />
            <input
              type="text"
              placeholder="بحث برقم الفاتورة، اسم العميل، الهاتف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ paddingRight: '38px', height: '42px', borderRadius: '10px' }}
            />
          </div>

          {/* Date Picker */}
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="form-input"
            style={{ width: '160px', height: '42px', borderRadius: '10px' }}
          />

          {dateFilter && (
            <button onClick={() => setDateFilter('')} className="btn btn-outline" style={{ height: '42px', padding: '0 12px' }}>
              إلغاء التاريخ
            </button>
          )}
        </div>

        {/* Status Filter Buttons */}
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setStatusFilter('all')}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: statusFilter === 'all' ? '1.5px solid var(--mint-600)' : '1px solid var(--border-light)',
              background: statusFilter === 'all' ? 'var(--mint-600)' : '#ffffff',
              color: statusFilter === 'all' ? '#ffffff' : 'var(--text-secondary)',
              fontWeight: '700',
              fontSize: '0.84rem',
              cursor: 'pointer'
            }}
          >
            الكل ({invoices.length})
          </button>

          {/* Pending Orders Filter Button */}
          <button
            onClick={() => setStatusFilter('pending')}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: statusFilter === 'pending' ? '1.5px solid #f59e0b' : '1px solid var(--border-light)',
              background: statusFilter === 'pending' ? '#f59e0b' : '#fffbeb',
              color: statusFilter === 'pending' ? '#ffffff' : '#b45309',
              fontWeight: '800',
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>طلبات معلقة</span>
            {pendingOrdersCount > 0 && (
              <span
                style={{
                  background: statusFilter === 'pending' ? '#ffffff' : '#f59e0b',
                  color: statusFilter === 'pending' ? '#b45309' : '#ffffff',
                  padding: '1px 6px',
                  borderRadius: '9999px',
                  fontSize: '0.72rem',
                  fontWeight: '900'
                }}
              >
                {pendingOrdersCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setStatusFilter('paid')}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: statusFilter === 'paid' ? '1.5px solid #16a34a' : '1px solid var(--border-light)',
              background: statusFilter === 'paid' ? '#ecfdf5' : '#ffffff',
              color: statusFilter === 'paid' ? '#054f30' : 'var(--text-secondary)',
              fontWeight: '700',
              fontSize: '0.84rem',
              cursor: 'pointer'
            }}
          >
            مدفوع بالكامل
          </button>
          <button
            onClick={() => setStatusFilter('partial')}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: statusFilter === 'partial' ? '1.5px solid #f59e0b' : '1px solid var(--border-light)',
              background: statusFilter === 'partial' ? '#fffbeb' : '#ffffff',
              color: statusFilter === 'partial' ? '#92400e' : 'var(--text-secondary)',
              fontWeight: '700',
              fontSize: '0.84rem',
              cursor: 'pointer'
            }}
          >
            مدفوع جزئياً
          </button>
          <button
            onClick={() => setStatusFilter('unpaid')}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: statusFilter === 'unpaid' ? '1.5px solid #ef4444' : '1px solid var(--border-light)',
              background: statusFilter === 'unpaid' ? '#fef2f2' : '#ffffff',
              color: statusFilter === 'unpaid' ? '#991b1b' : 'var(--text-secondary)',
              fontWeight: '700',
              fontSize: '0.84rem',
              cursor: 'pointer'
            }}
          >
            آجل / على الحساب
          </button>
          <button
            onClick={() => setStatusFilter('returned')}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: statusFilter === 'returned' ? '1.5px solid #9333ea' : '1px solid var(--border-light)',
              background: statusFilter === 'returned' ? '#f5f3ff' : '#ffffff',
              color: statusFilter === 'returned' ? '#6b21a8' : 'var(--text-secondary)',
              fontWeight: '700',
              fontSize: '0.84rem',
              cursor: 'pointer'
            }}
          >
            المرتجع 🔄
          </button>

          {/* PDF Export Button */}
          <button
            onClick={() => exportInvoicesToPdf(filteredInvoices, contactInfo)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '1.5px solid #ef4444',
              background: '#fef2f2',
              color: '#b91c1c',
              fontWeight: '800',
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
            title="تصدير الفواتير المعروضة إلى تقرير PDF جاهز للطباعة والحفظ"
          >
            <FileText size={16} color="#dc2626" />
            <span>تصدير PDF 📄</span>
          </button>
        </div>
      </div>

      {/* Invoices Data Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>رقم الفاتورة</th>
              <th style={{ textAlign: 'center', width: '70px' }}>رمز QR</th>
              <th>التاريخ والوقت</th>
              <th>العميل</th>
              <th>طريقة الدفع</th>
              <th>الأصناف</th>
              <th>الإجمالي</th>
              <th>المدفوع</th>
              <th>المتبقي</th>
              <th>الحالة</th>
              <th style={{ textAlign: 'center', minWidth: '95px' }}>📸 إشعار التحويل</th>
              <th>حالة الشحن والتتبع</th>
              <th style={{ textAlign: 'center' }}>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.map((inv) => (
              <tr key={inv.id}>
                <td>
                  <strong style={{ color: 'var(--mint-900)' }}>{inv.invoiceNumber}</strong>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                    بواسطة: {inv.cashierName || 'الكاشير'}
                  </div>
                </td>
                <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                  <InvoiceMiniQr 
                    invoice={inv} 
                    size={34} 
                    onClick={() => openInvoiceModal(inv)} 
                  />
                </td>
                <td style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                  {inv.date}
                </td>
                <td>
                  <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>
                    {inv.customerName}
                  </div>
                  {inv.customerPhone && (
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }} dir="ltr">
                      {inv.customerPhone}
                    </div>
                  )}
                  {inv.customerAddress && (
                    <div style={{ fontSize: '0.72rem', color: 'var(--mint-700)', marginTop: '2px' }}>
                      📍 {inv.customerAddress}
                    </div>
                  )}
                </td>
                <td>
                  <span className="badge badge-mint" style={{ fontSize: '0.74rem' }}>
                    {inv.paymentMethod === 'cash' ? '💵 نقدي' : inv.paymentMethod === 'card' ? '💳 فيزا' : inv.paymentMethod === 'instapay' ? '📱 إنستاباي' : inv.paymentMethod === 'split' ? '⚡💵 كاش + محفظة' : '⏳ آجل'}
                  </span>
                  {inv.splitPayment && (
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                      كاش: {inv.splitPayment.cash} | محفظة: {inv.splitPayment.instapay}
                    </div>
                  )}
                </td>
                <td style={{ fontSize: '0.82rem' }}>
                  {Array.isArray(inv.items) ? `${inv.items.length} أصناف (${inv.items.reduce((s, i) => s + (Number(i.qty) || 0), 0)} قطعة)` : '—'}
                </td>
                <td>
                  <strong style={{ fontSize: '0.98rem', color: 'var(--mint-900)' }}>
                    {inv.total} ج.م
                  </strong>
                </td>
                <td style={{ color: '#16a34a', fontWeight: '700' }}>
                  {inv.paidAmount} ج.م
                </td>
                <td>
                  {inv.remainingDebt > 0 ? (
                    <span style={{ color: '#dc2626', fontWeight: '700' }}>
                      {inv.remainingDebt} ج.م
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>0 ج.م</span>
                  )}
                </td>
                <td>
                  <span
                    className={`badge ${
                      inv.status === 'pending'
                        ? 'badge-warning'
                        : inv.status === 'paid'
                        ? 'badge-mint'
                        : inv.status === 'cancelled'
                        ? 'badge-danger'
                        : inv.status === 'returned'
                        ? 'badge-purple'
                        : inv.status === 'partially_returned'
                        ? 'badge-warning'
                        : inv.status === 'partial'
                        ? 'badge-warning'
                        : 'badge-danger'
                    }`}
                    style={{
                      fontWeight: '800',
                      background: inv.status === 'pending'
                        ? '#fef3c7'
                        : inv.status === 'returned'
                        ? 'rgba(147, 51, 234, 0.15)'
                        : inv.status === 'partially_returned'
                        ? 'rgba(245, 158, 11, 0.15)'
                        : undefined,
                      color: inv.status === 'pending'
                        ? '#92400e'
                        : inv.status === 'returned'
                        ? '#9333ea'
                        : inv.status === 'partially_returned'
                        ? '#b45309'
                        : undefined,
                      border: inv.status === 'pending'
                        ? '1px solid #fde68a'
                        : inv.status === 'returned'
                        ? '1px solid rgba(147, 51, 234, 0.35)'
                        : inv.status === 'partially_returned'
                        ? '1px solid rgba(245, 158, 11, 0.35)'
                        : undefined
                    }}
                  >
                    {inv.status === 'pending'
                      ? '⏳ معلق (أونلاين)'
                      : inv.status === 'paid'
                      ? 'مدفوع'
                      : inv.status === 'cancelled'
                      ? 'ملغي'
                      : inv.status === 'returned'
                      ? '🔄 مرتجع كامل'
                      : inv.status === 'partially_returned'
                      ? '🔄 مرتجع جزئي'
                      : inv.status === 'partial'
                      ? 'جزئي'
                      : 'غير مسدد'}
                  </span>
                </td>

                {/* 📸 إشعار التحويل (الاسكرين شوت) - يظهر قبل حالة الشحن والتتبع 📸 */}
                <td style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                  {inv.transferReceipt ? (
                    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                      <button
                        type="button"
                        onClick={() => setViewingReceiptInvoice(inv)}
                        title="انقر لمعاينة وتكبير إشعار التحويل 🔍"
                        style={{
                          position: 'relative',
                          padding: 0,
                          border: '2px solid #EDD9BD',
                          borderRadius: '10px',
                          overflow: 'hidden',
                          width: '46px',
                          height: '46px',
                          cursor: 'pointer',
                          background: '#FFF8EE',
                          boxShadow: '0 3px 10px rgba(74, 50, 32, 0.12)',
                          display: 'block',
                          transition: 'transform 0.2s ease, border-color 0.2s ease'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.transform = 'scale(1.08)';
                          e.currentTarget.style.borderColor = '#96663B';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.borderColor = '#EDD9BD';
                        }}
                      >
                        <img
                          src={inv.transferReceipt}
                          alt="إشعار التحويل"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'rgba(0, 0, 0, 0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#ffffff'
                          }}
                        >
                          <Eye size={15} />
                        </div>
                      </button>
                      {inv.transferSenderPhone ? (
                        <span style={{ fontSize: '0.68rem', color: '#e6b87d', fontWeight: '800', lineHeight: 1 }} dir="ltr">
                          {inv.transferSenderPhone}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                          إشعار مرفق
                        </span>
                      )}
                    </div>
                  ) : (
                    <label
                      title="رفع صورة إشعار التحويل الأصلية للطلب"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '4px 8px',
                        background: '#FFFDF9',
                        border: '1px dashed #96663B',
                        borderRadius: '8px',
                        color: '#96663B',
                        fontSize: '0.72rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = '#FFF8EE';
                        e.currentTarget.style.borderColor = '#7A5230';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = '#FFFDF9';
                        e.currentTarget.style.borderColor = '#96663B';
                      }}
                    >
                      <Upload size={12} />
                      <span>رفع إشعار</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => handleReceiptFileSelection(inv.id, e.target.files?.[0])}
                        style={{ display: 'none' }}
                      />
                    </label>
                  )}
                </td>

                {/* Shipping & Tracking Status Dropdown */}
                <td>
                  <select
                    value={inv.trackingStatus || (inv.status === 'paid' ? 'delivered' : 'received')}
                    onChange={(e) => updateInvoiceTrackingStatus(inv.id, e.target.value)}
                    style={{
                      padding: '5px 8px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: '700',
                      border: '1px solid var(--border-mint)',
                      background: '#ffffff',
                      color: 'var(--mint-950)',
                      cursor: 'pointer'
                    }}
                    title="تحديث حالة الشحن والتجهيز مباشرة"
                  >
                    <option value="received">📋 تم الاستلام</option>
                    <option value="processing">🔥 قيد التحميص والتجهيز</option>
                    <option value="shipped">🚚 جاري الشحن والتوصيل</option>
                    <option value="delivered">✨ تم التوصيل بنجاح</option>
                    <option value="cancelled">❌ ملغي</option>
                  </select>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    {/* Confirm Button for pending online orders */}
                    {inv.status === 'pending' && (
                      <button
                        onClick={async () => {
                          const ok = await confirmDialog({
                            title: 'تأكيد وقبول الطلب',
                            message: `هل أنت متأكد من تأكيد وقبول الطلب رقم (${inv.invoiceNumber}) للعميل \"${inv.customerName}\"؟`,
                            details: 'سيتم تحويل حالة الطلب إلى معتمد وجاهز للتجهيز والشحن.',
                            confirmText: 'نعم، اعتماد وقبول الطلب',
                            cancelText: 'تراجع',
                            type: 'success'
                          });
                          if (ok) {
                            confirmPendingOrder(inv.id);
                          }
                        }}
                        className="btn btn-primary"
                        style={{ padding: '6px 10px', fontSize: '0.78rem', background: '#16a34a', borderColor: '#16a34a' }}
                        title="تأكيد وقبول الطلب"
                      >
                        <Check size={14} />
                        <span>تأكيد</span>
                      </button>
                    )}

                    {/* Order Tracking Preview */}
                    <button
                      onClick={() => openTrackingModal(inv.invoiceNumber)}
                      className="btn btn-outline"
                      style={{ padding: '6px 10px', fontSize: '0.8rem', color: '#0284c7', borderColor: '#7dd3fc' }}
                      title="عرض شاشة التتبع والمسار"
                    >
                      <Truck size={15} />
                    </button>

                    {/* QR Code Quick View */}
                    <button
                      onClick={() => openInvoiceModal(inv)}
                      className="btn btn-outline"
                      style={{ padding: '6px 10px', fontSize: '0.8rem', color: 'var(--mint-700)', borderColor: 'var(--border-mint)' }}
                      title="عرض رمز QR للفاتورة"
                    >
                      <QrCode size={15} />
                    </button>

                    <button
                      onClick={() => openInvoiceModal(inv)}
                      className="btn btn-outline"
                      style={{ padding: '6px 10px', fontSize: '0.8rem', color: '#96663B', borderColor: '#d4a373', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '800' }}
                      title="معاينة وطباعة الفاتورة"
                    >
                      <Eye size={15} />
                      <span style={{ fontSize: '0.74rem' }}>معاينة</span>
                    </button>
                    
                    <button
                      onClick={() => sendWhatsApp(inv)}
                      className="btn btn-outline"
                      style={{ padding: '6px 10px', fontSize: '0.8rem', color: '#16a34a', borderColor: '#86efac' }}
                      title="إرسال عبر واتساب"
                    >
                      <MessageSquare size={15} />
                      {inv.status === 'pending' && <span style={{ fontSize: '0.74rem' }}>متابعة</span>}
                    </button>

                    {/* Return Button (مرتجع صنف أو كميات محددة) */}
                    {inv.status !== 'cancelled' && inv.status !== 'returned' && (
                      <button
                        onClick={() => setInvoiceToReturn(inv)}
                        className="btn btn-outline"
                        style={{ padding: '6px 8px', fontSize: '0.78rem', color: '#9333ea', borderColor: '#d8b4fe', display: 'flex', alignItems: 'center', gap: '3px' }}
                        title="تسجيل مرتجع صنف أو كمية معينة من الفاتورة وإعادة المخزون"
                      >
                        <RotateCcw size={14} />
                        <span style={{ fontSize: '0.74rem' }}>مرتجع</span>
                      </button>
                    )}

                    {/* Cancel Button for any active invoice / order */}
                    {inv.status !== 'cancelled' && (
                      <button
                        onClick={async () => {
                          const ok = await confirmDialog({
                            title: 'إلغاء الفاتورة / الطلب',
                            message: `هل أنت متأكد من إلغاء الفاتورة رقم (${inv.invoiceNumber})؟`,
                            details: `العميل: ${inv.customerName} • المبلغ: ${(inv.finalTotal || inv.total || 0).toLocaleString()} ج.م • سيتم تصفير المديونية بالكامل، واسترجاع الكميات للمخزن، وحذف تأثيرها تماماً من الخزائن والعملاء.`,
                            confirmText: 'نعم، إلغاء الفاتورة',
                            cancelText: 'إبقاء الفاتورة',
                            type: 'danger'
                          });
                          if (ok) {
                            cancelInvoice(inv.id);
                          }
                        }}
                        className="btn btn-outline"
                        style={{ padding: '6px 8px', fontSize: '0.78rem', color: '#dc2626', borderColor: '#fca5a5' }}
                        title="إلغاء الفاتورة بالكامل (استرجاع المخزون والخزينة والمديونية)"
                      >
                        <XCircle size={14} />
                        <span style={{ fontSize: '0.74rem', marginRight: '2px' }}>إلغاء</span>
                      </button>
                    )}

                    {inv.status !== 'pending' && inv.status !== 'cancelled' && (Number(inv.remainingDebt) || 0) > 0 && (
                      <button
                        onClick={() => {
                          const cust = (customers || []).find(c =>
                            (inv.customerId && (c.id === inv.customerId || String(c.id) === String(inv.customerId))) ||
                            (inv.customerPhone && normalizePhone(c.phone) === normalizePhone(inv.customerPhone) && c.phone !== '') ||
                            (inv.customerName && c.name && normalizeArabic(c.name) === normalizeArabic(inv.customerName))
                          ) || {
                            id: inv.customerId || null,
                            name: inv.customerName || 'عميل',
                            phone: inv.customerPhone || '',
                            debt: Number(inv.remainingDebt) || 0
                          };
                          setSettleInvoice({
                            id: inv.id,
                            customer: cust,
                            invoiceNumber: inv.invoiceNumber,
                            amount: Number(inv.remainingDebt) || 0
                          });
                        }}
                        className="btn btn-primary"
                        style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                        title="سداد مديونية الفاتورة"
                      >
                        سداد
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredInvoices.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            لم يتم العثور على أي فواتير مطابقة لخيارات البحث.
          </div>
        )}
      </div>

      {/* Debt Settlement Modal */}
      {Boolean(settlingInvoice) && (
        <DebtSettlementModal
          isOpen={!!settlingInvoice}
          onClose={() => setSettleInvoice(null)}
          customer={settlingInvoice?.customer}
          invoiceNumber={settlingInvoice?.invoiceNumber}
          initialAmount={settlingInvoice?.amount}
          onSuccess={(paidAmt, meta) => {
            settleCustomerDebt(
              settlingInvoice?.customer?.id,
              paidAmt,
              meta?.paymentMethod || 'cash',
              meta?.notes || '',
              settlingInvoice?.id,
              meta?.targetAccountId
            );
          }}
        />
      )}

      {/* 📸 RECEIPT SCREENSHOT PREVIEW MODAL 📸 */}
      {viewingReceiptInvoice && (
        <div
          className="modal-overlay"
          onClick={() => setViewingReceiptInvoice(null)}
          style={{ zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <div
            className="modal-content"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '560px',
              width: '95%',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              background: '#FFFDF9',
              border: '1.5px solid #EDD9BD',
              borderRadius: '20px',
              overflow: 'hidden',
              boxShadow: '0 25px 60px rgba(74, 50, 32, 0.2)',
              padding: 0
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 20px',
                background: 'linear-gradient(135deg, #2C1810 0%, #4A3220 100%)',
                borderBottom: '1px solid #EDD9BD',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: '#FFFDF9'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFDF9'
                  }}
                >
                  <Image size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: '#FFFDF9' }}>
                    إشعار التحويل • فاتورة #{viewingReceiptInvoice.invoiceNumber}
                  </h3>
                  <div style={{ fontSize: '0.76rem', color: '#EDD9BD', marginTop: '2px' }}>
                    العميل: {viewingReceiptInvoice.customerName} ({viewingReceiptInvoice.customerPhone || 'بدون هاتف'})
                  </div>
                </div>
              </div>
              <button
                onClick={() => setViewingReceiptInvoice(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFDF9',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body: Details Strip + Image */}
            <div style={{ padding: '16px 20px', overflowY: 'auto' }}>
              {/* Payment Details Quick Strip */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                  gap: '10px',
                  padding: '12px',
                  borderRadius: '12px',
                  background: '#FFF8EE',
                  border: '1px solid #EDD9BD',
                  marginBottom: '14px',
                  fontSize: '0.82rem'
                }}
              >
                <div>
                  <div style={{ color: '#6B4A2E', fontSize: '0.72rem' }}>طريقة الدفع:</div>
                  <strong style={{ color: '#96663B' }}>
                    {viewingReceiptInvoice.paymentMethod === 'instapay'
                      ? '⚡ إنستاباي (InstaPay)'
                      : viewingReceiptInvoice.paymentMethod === 'wallet'
                      ? '📱 محفظة إلكترونية'
                      : viewingReceiptInvoice.paymentMethod}
                  </strong>
                </div>
                <div>
                  <div style={{ color: '#6B4A2E', fontSize: '0.72rem' }}>إجمالي الفاتورة:</div>
                  <strong style={{ color: '#4A3220' }}>{viewingReceiptInvoice.total} ج.م</strong>
                </div>
                {viewingReceiptInvoice.transferSenderPhone && (
                  <div>
                    <div style={{ color: '#6B4A2E', fontSize: '0.72rem' }}>رقم المحول منه:</div>
                    <strong style={{ color: '#3d6a3c' }} dir="ltr">
                      {viewingReceiptInvoice.transferSenderPhone}
                    </strong>
                  </div>
                )}
                <div>
                  <div style={{ color: '#6B4A2E', fontSize: '0.72rem' }}>تاريخ الطلب:</div>
                  <strong style={{ color: '#4A3220' }}>{viewingReceiptInvoice.date}</strong>
                </div>
              </div>

              {/* Full Image Box or Upload Card */}
              <div
                style={{
                  borderRadius: '14px',
                  overflow: 'hidden',
                  border: '1.5px solid #EDD9BD',
                  background: '#F5E6D0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: '260px',
                  maxHeight: '480px'
                }}
              >
                {viewingReceiptInvoice.transferReceipt ? (
                  <img
                    src={viewingReceiptInvoice.transferReceipt}
                    alt="إشعار التحويل الكامل"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '480px',
                      objectFit: 'contain',
                      display: 'block'
                    }}
                  />
                ) : (
                  <div
                    style={{
                      padding: '36px 20px',
                      textAlign: 'center',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px'
                    }}
                  >
                    <div
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: '#FFF8EE',
                        border: '1px solid #EDD9BD',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#96663B'
                      }}
                    >
                      <UploadCloud size={28} />
                    </div>
                    <div>
                      <div style={{ color: '#4A3220', fontSize: '0.94rem', fontWeight: '800' }}>
                        لا توجد صورة إشعار مرفقة حالياً
                      </div>
                      <div style={{ color: '#6B4A2E', fontSize: '0.78rem', marginTop: '4px' }}>
                        يمكنك اختيار ورفع صورة الإشعار الأصلية (الاسكرين شوت) للطلب الآن
                      </div>
                    </div>
                    <label
                      className="btn btn-primary"
                      style={{
                        cursor: 'pointer',
                        padding: '10px 20px',
                        borderRadius: '10px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '0.85rem',
                        fontWeight: '700',
                        marginTop: '6px'
                      }}
                    >
                      <Upload size={16} />
                      <span>اختيار ورفع الاسكرين شوت 📎</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={e => handleReceiptFileSelection(viewingReceiptInvoice.id, e.target.files?.[0])}
                        style={{ display: 'none' }}
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer: Actions */}
            <div
              style={{
                padding: '12px 20px',
                background: '#FFF8EE',
                borderTop: '1px solid #EDD9BD',
                display: 'flex',
                justifyContent: 'space-between',
                gap: '10px',
                flexWrap: 'wrap',
                alignItems: 'center'
              }}
            >
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {viewingReceiptInvoice.transferReceipt && (
                  <>
                    <a
                      href={viewingReceiptInvoice.transferReceipt}
                      download={`receipt_${viewingReceiptInvoice.invoiceNumber}.png`}
                      className="btn btn-secondary"
                      style={{
                        fontSize: '0.82rem',
                        padding: '8px 14px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        borderRadius: '8px'
                      }}
                    >
                      <Download size={15} />
                      <span>تحميل الصورة</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        const win = window.open();
                        win.document.write(`<img src="${viewingReceiptInvoice.transferReceipt}" style="max-width:100%;height:auto;display:block;margin:auto;" />`);
                      }}
                      className="btn btn-secondary"
                      style={{
                        fontSize: '0.82rem',
                        padding: '8px 14px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        borderRadius: '8px'
                      }}
                    >
                      <ExternalLink size={15} />
                      <span>فتح في نافذة كاملة</span>
                    </button>
                  </>
                )}

                {/* Option to change/replace with real screenshot */}
                <label
                  className="btn btn-secondary"
                  style={{
                    fontSize: '0.82rem',
                    padding: '8px 14px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: '#381a10',
                    color: '#fbbf24',
                    borderColor: '#d4a373'
                  }}
                  title="رفع أو استبدال صورة الإشعار بالاسكرين شوت الحقيقي"
                >
                  <Upload size={15} />
                  <span>{viewingReceiptInvoice.transferReceipt ? 'تغيير / رفع صورة أخرى 📸' : 'رفع الاسكرين شوت 📎'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => handleReceiptFileSelection(viewingReceiptInvoice.id, e.target.files?.[0])}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              <button
                type="button"
                onClick={() => setViewingReceiptInvoice(null)}
                className="btn btn-primary"
                style={{
                  fontSize: '0.84rem',
                  padding: '8px 20px',
                  borderRadius: '8px',
                  fontWeight: '700'
                }}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔄 MODAL: RETURN INVOICE ITEMS (مرتجع صنف أو كمية) 🔄 */}
      {invoiceToReturn && (
        <ReturnInvoiceModal
          invoice={invoiceToReturn}
          treasuryAccounts={treasuryAccounts}
          onClose={() => setInvoiceToReturn(null)}
          onConfirmReturn={(reason, refundOptions, itemsToReturn) => {
            const success = returnInvoiceItems(invoiceToReturn.id, reason, refundOptions, itemsToReturn);
            setInvoiceToReturn(null);
            if (success) {
              // Dialog alert confirmation
              confirmDialog({
                title: 'تم تسجيل المرتجع بنجاح! 🔄',
                message: `تم إرجاع الأصناف للمخزن وتحديث الأرصدة والمالية بنجاح للفاتورة #${invoiceToReturn.invoiceNumber}`,
                details: `السبب: ${reason || 'مرتجع بضاعة'} • تم خصم/رد القيمة وتعديل المخزون فورياً.`,
                confirmText: 'حسناً',
                cancelText: '',
                type: 'success'
              });
            }
          }}
        />
      )}

    </div>
  );
};
