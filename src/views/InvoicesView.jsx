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
  QrCode
} from 'lucide-react';
import { DebtSettlementModal } from '../components/DebtSettlementModal';
import { InvoiceMiniQr } from '../components/InvoiceQrCode';
import { exportInvoicesToPdf } from '../utils/exportUtils';

export const InvoicesView = () => {
  const {
    invoices,
    customers,
    openInvoiceModal,
    settleCustomerDebt,
    pendingOrdersCount,
    confirmPendingOrder,
    cancelPendingOrder,
    openTrackingModal,
    updateInvoiceTrackingStatus,
    contactInfo
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('');
  const [settlingInvoice, setSettleInvoice] = useState(null);

  // Filter invoices
  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (inv.customerPhone && inv.customerPhone.includes(searchQuery));
    const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
    const matchesDate = !dateFilter || inv.date.startsWith(dateFilter);
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
    const itemsList = inv.items.map(it => `• ${it.name} (${it.qty}x)`).join('\n');
    const msg = `مرحباً ${inv.customerName}، إليك تفاصيل فاتورتك من كاتورا للقهوة المختصة:\nرقم الفاتورة: ${inv.invoiceNumber}\nالتاريخ: ${inv.date}\nالمنتجات:\n${itemsList}\nالإجمالي: ${inv.total} ج.م\nالمدفوع: ${inv.paidAmount} ج.م\nالمتبقي: ${inv.remainingDebt} ج.م\nشكراً لزيارتك كاتورا! ☕`;
    const encoded = encodeURIComponent(msg);
    const url = phone ? `https://wa.me/${phone}?text=${encoded}` : `https://api.whatsapp.com/send?text=${encoded}`;
    window.open(url, '_blank');
  };

  // Total metrics
  const totalSales = invoices.reduce((sum, inv) => sum + inv.total, 0);
  const totalCollected = invoices.reduce((sum, inv) => sum + inv.paidAmount, 0);
  const totalOutstanding = invoices.reduce((sum, inv) => sum + inv.remainingDebt, 0);

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
                    {inv.paymentMethod === 'cash' ? '💵 نقدي' : inv.paymentMethod === 'card' ? '💳 فيزا' : inv.paymentMethod === 'instapay' ? '📱 إنستاباي' : '⏳ آجل'}
                  </span>
                </td>
                <td style={{ fontSize: '0.82rem' }}>
                  {inv.items.length} أصناف ({inv.items.reduce((s, i) => s + i.qty, 0)} قطعة)
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
                        : inv.status === 'partial'
                        ? 'badge-warning'
                        : 'badge-danger'
                    }`}
                    style={{
                      fontWeight: '800',
                      background: inv.status === 'pending' ? '#fef3c7' : undefined,
                      color: inv.status === 'pending' ? '#92400e' : undefined,
                      border: inv.status === 'pending' ? '1px solid #fde68a' : undefined
                    }}
                  >
                    {inv.status === 'pending'
                      ? '⏳ معلق (أونلاين)'
                      : inv.status === 'paid'
                      ? 'مدفوع'
                      : inv.status === 'cancelled'
                      ? 'ملغي'
                      : inv.status === 'partial'
                      ? 'جزئي'
                      : 'غير مسدد'}
                  </span>
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
                    <option value="processing">☕ قيد التحميص والتجهيز</option>
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
                        onClick={() => {
                          if (confirm(`تأكيد وقبول الطلب رقم ${inv.invoiceNumber} للعميل ${inv.customerName}؟`)) {
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
                      style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                      title="معاينة وطباعة الفاتورة"
                    >
                      <Printer size={15} />
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

                    {/* Cancel Button for pending orders */}
                    {inv.status === 'pending' && (
                      <button
                        onClick={() => {
                          if (confirm(`هل أنت متأكد من إلغاء هذا الطلب وإعادة الكميات للمخزن؟`)) {
                            cancelPendingOrder(inv.id);
                          }
                        }}
                        className="btn btn-outline"
                        style={{ padding: '6px 8px', fontSize: '0.78rem', color: '#dc2626', borderColor: '#fca5a5' }}
                        title="إلغاء الطلب واسترجاع المخزون"
                      >
                        <XCircle size={14} />
                      </button>
                    )}

                    {inv.status !== 'pending' && inv.remainingDebt > 0 && inv.customerId && (
                      <button
                        onClick={() => {
                          const cust = (customers || []).find(c => c.id === inv.customerId) || {
                            id: inv.customerId,
                            name: inv.customerName,
                            phone: inv.customerPhone,
                            debt: inv.remainingDebt
                          };
                          setSettleInvoice({
                            customer: cust,
                            invoiceNumber: inv.invoiceNumber,
                            amount: inv.remainingDebt
                          });
                        }}
                        className="btn btn-primary"
                        style={{ padding: '6px 10px', fontSize: '0.78rem' }}
                        title="سداد مديونية"
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
      <DebtSettlementModal
        isOpen={!!settlingInvoice}
        onClose={() => setSettleInvoice(null)}
        customer={settlingInvoice?.customer}
        invoiceNumber={settlingInvoice?.invoiceNumber}
        initialAmount={settlingInvoice?.amount}
        onSuccess={(paidAmt) => {
          if (settlingInvoice?.customer?.id) {
            settleCustomerDebt(settlingInvoice.customer.id, paidAmt);
          }
        }}
      />

    </div>
  );
};
