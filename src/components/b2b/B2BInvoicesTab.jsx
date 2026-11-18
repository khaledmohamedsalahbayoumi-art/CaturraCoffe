import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileText,
  Plus,
  Search,
  DollarSign,
  RotateCcw,
  Receipt,
  Phone,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Truck,
  Printer,
  X,
  CreditCard,
  Building2,
  Coffee,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Layers,
  ChevronDown,
  Eye
} from 'lucide-react';
import { ReturnInvoiceModal } from '../ReturnInvoiceModal';
import { normalizeArabic, normalizePhone } from '../../utils/numberEnforcer';
import { B2BCustomerAutocomplete } from './B2BCustomerAutocomplete';

// 🟢 Authentic WhatsApp SVG Icon Component
const WhatsAppIcon = ({ size = 16, color = '#25D366' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    style={{ display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, color }}
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c-.001 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.711 1.456h.005c6.554 0 11.89-5.336 11.893-11.893a11.82 11.82 0 00-3.48-8.414z" />
  </svg>
);

export const B2BInvoicesTab = ({ onOpenInvoiceModal }) => {
  const {
    invoices = [],
    createB2BDirectInvoice,
    returnB2BInvoice,
    settleCustomerDebt,
    products = [],
    customers = [],
    b2bRequests = [],
    treasuryAccounts = [],
    language = 'ar',
    isRtl = true
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'debt' | 'paid' | 'returned'

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [invoiceToReturn, setInvoiceToReturn] = useState(null);
  const [invoiceToSettle, setInvoiceToSettle] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  // Filter for B2B invoices only
  const b2bInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const isDirectB2B = inv.isB2B || inv.source === 'b2b' || inv.standingOrderId;
      const isCafeCustomer = (inv.customerName || '').includes('كافيه') || (inv.customerName || '').includes('روستري') || (inv.customerName || '').includes('فندق');
      return isDirectB2B || isCafeCustomer;
    });
  }, [invoices]);

  // Statistics
  const stats = useMemo(() => {
    const totalCount = b2bInvoices.length;
    const activeInvoices = b2bInvoices.filter(i => i.status !== 'returned' && i.status !== 'cancelled');

    const totalSales = activeInvoices.reduce((sum, i) => sum + Number(i.total || 0), 0);
    const totalCollected = activeInvoices.reduce((sum, i) => sum + Number(i.paidAmount || 0), 0);
    const totalDebt = activeInvoices.reduce((sum, i) => sum + Number(i.remainingDebt || 0), 0);
    const returnedCount = b2bInvoices.filter(i => i.status === 'returned').length;

    return { totalCount, totalSales, totalCollected, totalDebt, returnedCount };
  }, [b2bInvoices]);

  // Filtered list
  const filteredInvoices = useMemo(() => {
    return b2bInvoices.filter(inv => {
      // Search
      if (searchQuery.trim()) {
        const q = normalizeArabic(searchQuery.trim().toLowerCase());
        const invNum = (inv.invoiceNumber || '').toLowerCase();
        const custName = normalizeArabic(inv.customerName || '').toLowerCase();
        const custPhone = normalizePhone(inv.customerPhone || '');
        if (!invNum.includes(q) && !custName.includes(q) && !custPhone.includes(normalizePhone(q))) {
          return false;
        }
      }

      // Status
      if (statusFilter === 'debt') {
        const hasDebt = (Number(inv.remainingDebt) || 0) > 0 && inv.status !== 'returned' && inv.status !== 'cancelled';
        if (!hasDebt) return false;
      } else if (statusFilter === 'paid') {
        if (inv.status !== 'paid' && (Number(inv.remainingDebt) || 0) > 0) return false;
      } else if (statusFilter === 'returned') {
        if (inv.status !== 'returned') return false;
      }

      return true;
    });
  }, [b2bInvoices, searchQuery, statusFilter]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            backgroundColor: '#1b0d07',
            backgroundImage: 'linear-gradient(135deg, #2a1309 0%, #160803 100%)',
            border: '2px solid #d97706',
            color: '#fef3c7',
            padding: '12px 24px',
            borderRadius: '12px',
            boxShadow: '0 12px 36px rgba(0,0,0,0.8), 0 0 20px rgba(217, 119, 6, 0.4)',
            fontSize: '0.92rem',
            fontWeight: '900',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Sparkles size={18} color="#f59e0b" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 📊 1. FINANCIAL KPI METRICS 📊 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(37, 18, 10, 0.9) 0%, rgba(26, 11, 5, 0.9) 100%)',
            border: '1px solid rgba(212, 163, 115, 0.25)',
            borderRadius: '16px',
            padding: '16px 20px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: '#d4a373', fontWeight: '800' }}>إجمالي مبيعات الجملة B2B</span>
            <Receipt size={20} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#ffffff', marginTop: '8px' }}>
            {stats.totalSales.toLocaleString()} <span style={{ fontSize: '0.85rem', color: '#aaa' }}>ج.م</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#38bdf8', marginTop: '4px' }}>
            من واقع {stats.totalCount} فاتورة توريد كافيهات
          </div>
        </div>

        <div
          style={{
            background: stats.totalDebt > 0
              ? 'linear-gradient(135deg, rgba(127, 29, 29, 0.3) 0%, rgba(37, 18, 10, 0.9) 100%)'
              : 'linear-gradient(135deg, rgba(37, 18, 10, 0.9) 0%, rgba(26, 11, 5, 0.9) 100%)',
            border: stats.totalDebt > 0 ? '1.5px solid #f59e0b' : '1px solid rgba(212, 163, 115, 0.25)',
            borderRadius: '16px',
            padding: '16px 20px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: stats.totalDebt > 0 ? '#fed7aa' : '#d4a373', fontWeight: '800' }}>
              مديونيات الكافيهات الآجلة (المتبقي)
            </span>
            <DollarSign size={20} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#f59e0b', marginTop: '8px' }}>
            {stats.totalDebt.toLocaleString()} <span style={{ fontSize: '0.85rem', color: '#aaa' }}>ج.م</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#fed7aa', marginTop: '4px' }}>
            مستحقات آجلة قيد التحصيل طرف الشركاء
          </div>
        </div>

        <div
          style={{
            background: 'linear-gradient(135deg, rgba(37, 18, 10, 0.9) 0%, rgba(26, 11, 5, 0.9) 100%)',
            border: '1px solid rgba(212, 163, 115, 0.25)',
            borderRadius: '16px',
            padding: '16px 20px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: '#d4a373', fontWeight: '800' }}>التحصيل الفعلي بالخزينة</span>
            <CheckCircle2 size={20} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#10b981', marginTop: '8px' }}>
            {stats.totalCollected.toLocaleString()} <span style={{ fontSize: '0.85rem', color: '#aaa' }}>ج.م</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#10b981', marginTop: '4px' }}>
            مبالغ مودعة ومثبتة بحسابات الخزينة
          </div>
        </div>

        <div
          style={{
            background: 'linear-gradient(135deg, rgba(37, 18, 10, 0.9) 0%, rgba(26, 11, 5, 0.9) 100%)',
            border: '1px solid rgba(212, 163, 115, 0.25)',
            borderRadius: '16px',
            padding: '16px 20px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: '#d4a373', fontWeight: '800' }}>فواتير المرتجع (B2B)</span>
            <RotateCcw size={20} color="#c084fc" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '900', color: stats.returnedCount > 0 ? '#c084fc' : '#ffffff', marginTop: '8px' }}>
            {stats.returnedCount} <span style={{ fontSize: '0.85rem', color: '#aaa' }}>مرتجع</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#c084fc', marginTop: '4px' }}>
            تم استرداد الكميات للمخزون وتسوية الحسابات
          </div>
        </div>
      </div>

      {/* 🔍 2. TOOLBAR & FILTERS 🔍 */}
      <div
        style={{
          background: 'rgba(26, 11, 5, 0.85)',
          border: '1px solid rgba(212, 163, 115, 0.25)',
          borderRadius: '16px',
          padding: '16px 20px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '14px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 320px' }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
            <Search
              size={18}
              color="#d4a373"
              style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              placeholder="بحث برقم الفاتورة، اسم الكافيه، أو الهاتف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 40px 10px 14px',
                background: 'rgba(0, 0, 0, 0.4)',
                border: '1px solid rgba(212, 163, 115, 0.3)',
                borderRadius: '10px',
                color: '#ffffff',
                fontSize: '0.88rem',
                outline: 'none'
              }}
            />
          </div>

          {/* Status Buttons */}
          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setStatusFilter('all')}
              style={{
                background: statusFilter === 'all' ? '#d97706' : 'rgba(255,255,255,0.06)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '0.82rem',
                fontWeight: '800',
                cursor: 'pointer'
              }}
            >
              الكل ({stats.totalCount})
            </button>
            <button
              onClick={() => setStatusFilter('debt')}
              style={{
                background: statusFilter === 'debt' ? '#f59e0b' : 'rgba(245, 158, 11, 0.15)',
                color: statusFilter === 'debt' ? '#110502' : '#fed7aa',
                border: statusFilter === 'debt' ? 'none' : '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '0.82rem',
                fontWeight: '900',
                cursor: 'pointer'
              }}
            >
              مديونيات آجلة ⚠️
            </button>
            <button
              onClick={() => setStatusFilter('paid')}
              style={{
                background: statusFilter === 'paid' ? '#10b981' : 'rgba(255,255,255,0.06)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '0.82rem',
                fontWeight: '800',
                cursor: 'pointer'
              }}
            >
              مدفوعة بالكامل
            </button>
            <button
              onClick={() => setStatusFilter('returned')}
              style={{
                background: statusFilter === 'returned' ? '#c084fc' : 'rgba(192, 132, 252, 0.15)',
                color: statusFilter === 'returned' ? '#110502' : '#e9d5ff',
                border: statusFilter === 'returned' ? 'none' : '1px solid rgba(192, 132, 252, 0.3)',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '0.82rem',
                fontWeight: '900',
                cursor: 'pointer'
              }}
            >
              المرتجع ({stats.returnedCount})
            </button>
          </div>
        </div>

        {/* Issue B2B Invoice Direct Button */}
        <button
          onClick={() => setIsCreateModalOpen(true)}
          style={{
            background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
            color: '#ffffff',
            border: '1.5px solid #f59e0b',
            borderRadius: '12px',
            padding: '10px 20px',
            fontSize: '0.88rem',
            fontWeight: '900',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 6px 20px rgba(217, 119, 6, 0.35)'
          }}
        >
          <Plus size={18} />
          <span>+ إصدار فاتورة توريد B2B مباشرة</span>
        </button>
      </div>

      {/* 📜 3. INVOICES TABLE / LIST 📜 */}
      {filteredInvoices.length === 0 ? (
        <div
          style={{
            background: 'rgba(26, 11, 5, 0.7)',
            borderRadius: '16px',
            border: '1px dashed rgba(212, 163, 115, 0.3)',
            padding: '48px 24px',
            textAlign: 'center',
            color: '#d4a373'
          }}
        >
          <Receipt size={44} style={{ opacity: 0.5, marginBottom: '12px' }} />
          <h3 style={{ margin: '0 0 8px', color: '#ffffff', fontWeight: '800' }}>لا توجد فواتير توريد B2B مطابقة للبحث</h3>
          <p style={{ margin: 0, fontSize: '0.88rem' }}>
            يمكنك إصدار فاتورة جديدة أو ضبط فلاتر البحث أعلاه.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filteredInvoices.map(inv => {
            const isReturned = inv.status === 'returned';
            const remainingDebt = Number(inv.remainingDebt || 0);
            const hasDebt = remainingDebt > 0 && !isReturned;
            const paidAmount = Number(inv.paidAmount || 0);
            const total = Number(inv.total || 0);

            return (
              <div
                key={inv.id}
                style={{
                  background: 'linear-gradient(135deg, rgba(37, 18, 10, 0.95) 0%, rgba(26, 11, 5, 0.97) 100%)',
                  borderRadius: '16px',
                  border: isReturned
                    ? '1.5px solid #c084fc'
                    : (hasDebt ? '1.5px solid #f59e0b' : '1px solid rgba(212, 163, 115, 0.3)'),
                  boxShadow: hasDebt ? '0 8px 24px rgba(245, 158, 11, 0.2)' : '0 6px 18px rgba(0,0,0,0.4)',
                  padding: '18px 22px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px'
                }}
              >
                {/* Left: Invoice Number, Client & Date */}
                <div style={{ minWidth: '240px', flex: '1 1 280px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        background: 'rgba(217, 119, 6, 0.2)',
                        color: '#fbbf24',
                        border: '1px solid rgba(217, 119, 6, 0.4)',
                        borderRadius: '6px',
                        padding: '2px 8px',
                        fontSize: '0.74rem',
                        fontWeight: '900'
                      }}
                    >
                      {inv.invoiceNumber}
                    </span>

                    {/* Status Badge */}
                    {isReturned ? (
                      <span style={{ background: 'rgba(192, 132, 252, 0.2)', color: '#c084fc', border: '1px solid #c084fc', borderRadius: '6px', padding: '2px 8px', fontSize: '0.72rem', fontWeight: '900' }}>
                        🔄 مرتجع كامل B2B
                      </span>
                    ) : inv.status === 'partially_returned' ? (
                      <span style={{ background: 'rgba(217, 119, 6, 0.2)', color: '#fbbf24', border: '1px solid #f59e0b', borderRadius: '6px', padding: '2px 8px', fontSize: '0.72rem', fontWeight: '900' }}>
                        🔄 مرتجع جزئي B2B
                      </span>
                    ) : hasDebt ? (
                      <span style={{ background: 'rgba(245, 158, 11, 0.2)', color: '#fbbf24', border: '1px solid #f59e0b', borderRadius: '6px', padding: '2px 8px', fontSize: '0.72rem', fontWeight: '900' }}>
                        ⚠️ دفع جزئي / آجل (مديونية)
                      </span>
                    ) : (
                      <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: '1px solid #10b981', borderRadius: '6px', padding: '2px 8px', fontSize: '0.72rem', fontWeight: '900' }}>
                        ✓ مدفوع بالكامل
                      </span>
                    )}

                    {inv.standingOrderId && (
                      <span style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '6px', padding: '2px 8px', fontSize: '0.72rem', fontWeight: '800' }}>
                        توريد دوري
                      </span>
                    )}
                  </div>

                  <h3 style={{ margin: '6px 0 0', fontSize: '1.1rem', fontWeight: '900', color: '#ffffff' }}>
                    {inv.customerName || 'عميل جملة'}
                  </h3>

                  <div style={{ fontSize: '0.8rem', color: '#d4a373', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>📅 {inv.date}</span>
                    {inv.customerPhone && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        • 📞 {inv.customerPhone}
                      </span>
                    )}
                  </div>
                </div>

                {/* Middle: Items Summary */}
                <div style={{ flex: '2 1 320px', background: 'rgba(0, 0, 0, 0.25)', padding: '10px 14px', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                  <div style={{ fontSize: '0.76rem', color: '#aaa', fontWeight: '800', marginBottom: '4px' }}>
                    الأصناف الموردة:
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#f5ebe1', lineHeight: 1.5 }}>
                    {(inv.items || []).map((it, idx) => (
                      <span key={idx}>
                        {it.name || it.productName} ({it.qty} {it.unitType === 'weight' ? 'كجم' : 'وحدة'})
                        {idx < inv.items.length - 1 ? ' • ' : ''}
                      </span>
                    ))}
                  </div>
                  {isReturned && inv.returnReason && (
                    <div style={{ fontSize: '0.76rem', color: '#c084fc', marginTop: '4px', fontWeight: '800' }}>
                      سبب الإرجاع: {inv.returnReason}
                    </div>
                  )}
                </div>

                {/* Right: Financial Details */}
                <div style={{ textAlign: 'left', minWidth: '170px' }}>
                  <div style={{ fontSize: '0.78rem', color: '#aaa' }}>إجمالي الفاتورة:</div>
                  <div style={{ fontSize: '1.25rem', fontWeight: '900', color: '#ffffff' }}>
                    {total.toLocaleString()} ج.م
                  </div>

                  <div style={{ fontSize: '0.78rem', marginTop: '4px' }}>
                    <span style={{ color: '#34d399' }}>المدفوع: {paidAmount.toLocaleString()} ج.م</span>
                    {hasDebt && (
                      <span style={{ color: '#f59e0b', marginRight: '8px', fontWeight: '900' }}>
                        • متبقي: {remainingDebt.toLocaleString()} ج.م
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* View/Print Invoice */}
                  <button
                    onClick={() => {
                      if (onOpenInvoiceModal) {
                        onOpenInvoiceModal(inv);
                      }
                    }}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(212, 163, 115, 0.3)',
                      color: '#f5ebe1',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '0.82rem',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                    title="معاينة وطباعة الفاتورة الرسمية"
                  >
                    <Eye size={15} color="#fbbf24" />
                    <span>معاينة الفاتورة</span>
                  </button>

                  {/* Settle Debt Button */}
                  {hasDebt && (
                    <button
                      onClick={() => setInvoiceToSettle(inv)}
                      style={{
                        background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 14px',
                        fontSize: '0.82rem',
                        fontWeight: '900',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
                      }}
                      title="تحصيل وسداد جزء أو كامل المديونية"
                    >
                      <DollarSign size={15} />
                      <span>سداد مديونية</span>
                    </button>
                  )}

                  {/* Return B2B Button */}
                  {!isReturned && (
                    <button
                      onClick={() => setInvoiceToReturn(inv)}
                      style={{
                        background: 'rgba(192, 132, 252, 0.15)',
                        border: '1px solid #c084fc',
                        color: '#c084fc',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        fontSize: '0.82rem',
                        fontWeight: '800',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                      title="تسجيل مرتجع بضاعة وإعادة المخزون وتسوية الحسابات"
                    >
                      <RotateCcw size={15} />
                      <span>مرتجع B2B</span>
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* 🚀 MODAL: CREATE DIRECT B2B INVOICE 🚀 */}
      {isCreateModalOpen && (
        <CreateDirectB2BInvoiceModal
          products={products}
          customers={customers}
          b2bRequests={b2bRequests}
          treasuryAccounts={treasuryAccounts}
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={(payload) => {
            const newInv = createB2BDirectInvoice(payload);
            setIsCreateModalOpen(false);
            showToast(`تم إصدار فاتورة توريد B2B #${newInv?.invoiceNumber || ''} وخصم المخزون بنجاح!`);
            if (newInv && onOpenInvoiceModal) {
              onOpenInvoiceModal(newInv);
            }
          }}
        />
      )}

      {/* 🔄 MODAL: RETURN B2B INVOICE (المرتجع وإعادة المخزون وتسوية المالية) 🔄 */}
      {invoiceToReturn && (
        <ReturnInvoiceModal
          invoice={invoiceToReturn}
          treasuryAccounts={treasuryAccounts}
          onClose={() => setInvoiceToReturn(null)}
          onConfirmReturn={(reason, refundOptions, itemsToReturn) => {
            const success = returnB2BInvoice(invoiceToReturn.id, reason, refundOptions, itemsToReturn);
            setInvoiceToReturn(null);
            if (success) {
              showToast(`تم تسجيل مرتجع الفاتورة #${invoiceToReturn.invoiceNumber} وإعادة الكميات للمخزون بنجاح! 🔄`);
            }
          }}
        />
      )}

      {/* 💵 MODAL: SETTLE B2B DEBT (سداد جزء من المديونية في الخزينة) 💵 */}
      {invoiceToSettle && (
        <SettleB2BDebtModal
          invoice={invoiceToSettle}
          treasuryAccounts={treasuryAccounts}
          onClose={() => setInvoiceToSettle(null)}
          onSettle={(amount, method, accountId, notes) => {
            settleCustomerDebt(invoiceToSettle.customerId, amount, method, notes, invoiceToSettle.id, accountId);
            setInvoiceToSettle(null);
            showToast(`تم تسجيل سداد مبلغ ${amount.toLocaleString()} ج.م في الخزينة وتخفيض مديونية الكافيه ✅`);
          }}
        />
      )}

    </div>
  );
};

// -------------------------------------------------------------
// CREATE DIRECT B2B INVOICE MODAL
// -------------------------------------------------------------
const CreateDirectB2BInvoiceModal = ({ products, customers, b2bRequests = [], treasuryAccounts, onClose, onCreate }) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('deferred');
  const [paidAmount, setPaidAmount] = useState('0');
  const [discount, setDiscount] = useState('0');
  const [notes, setNotes] = useState('');

  const [items, setItems] = useState([
    {
      productId: products[0]?.id || 'prod-1',
      name: products[0]?.name || 'بن مختص',
      unitType: products[0]?.unitType || 'weight',
      weightGram: products[0]?.unitType === 'weight' ? 1000 : undefined,
      qty: 10,
      price: products[0]?.pricePerKg || 1050,
      total: 10500
    }
  ]);

  const handleAddItem = () => {
    const prod = products[0];
    if (!prod) return;
    setItems([
      ...items,
      {
        productId: prod.id,
        name: prod.name,
        unitType: prod.unitType || 'weight',
        weightGram: prod.unitType === 'weight' ? 1000 : undefined,
        qty: 5,
        price: prod.pricePerKg || prod.sellingPrice || 1000,
        total: (prod.pricePerKg || prod.sellingPrice || 1000) * 5
      }
    ]);
  };

  const handleItemChange = (idx, field, val) => {
    const updated = [...items];
    const cur = { ...updated[idx], [field]: val };

    if (field === 'productId') {
      const p = products.find(prod => prod.id === val);
      if (p) {
        cur.name = p.name;
        cur.unitType = p.unitType || 'weight';
        cur.price = p.pricePerKg || p.sellingPrice || 1000;
      }
    }

    const qty = Number(cur.qty || 1);
    const unitPrice = Number(cur.price || 0);
    cur.total = qty * unitPrice;

    updated[idx] = cur;
    setItems(updated);
  };

  const handleRemoveItem = (idx) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const subtotal = items.reduce((sum, it) => sum + Number(it.total || 0), 0);
  const total = Math.max(0, subtotal - Number(discount || 0));

  const numPaid = paymentMethod === 'cash' || paymentMethod === 'instapay'
    ? total
    : Math.min(total, Math.max(0, Number(paidAmount || 0)));
  const remainingDebt = Math.max(0, total - numPaid);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert('يرجى تحديد أو كتابة اسم الكافيه / العميل!');
      return;
    }

    // Format items for createSale so weight deduction works in grams
    const formattedItems = items.map(item => ({
      productId: item.productId,
      name: `${item.name} (${item.qty} ${item.unitType === 'weight' ? 'كجم' : 'قطعة'})`,
      unitType: item.unitType || 'weight',
      weightGram: item.unitType === 'weight' ? (item.weightGram || 1000) * Number(item.qty || 1) : undefined,
      price: Number(item.total),
      qty: 1
    }));

    onCreate({
      items: formattedItems,
      customerName,
      customerPhone,
      customerAddress,
      discount: Number(discount || 0),
      paymentMethod,
      paidAmount: numPaid,
      notes
    });
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(6px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        style={{
          background: '#1a0b05',
          backgroundImage: 'linear-gradient(135deg, #2a1309 0%, #150702 100%)',
          border: '2px solid #d97706',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 60px rgba(0,0,0,0.9), 0 0 30px rgba(217, 119, 6, 0.25)',
          color: '#f5ebe1'
        }}
      >
        {/* Header */}
        <div
          style={{
            background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
            padding: '20px 24px',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Receipt size={24} />
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '900' }}>
              إصدار فاتورة مبيعات وتوريد جملة (B2B)
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'rgba(0,0,0,0.2)', border: 'none', color: '#ffffff', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Quick Select Customer or enter name */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#d4a373', display: 'block', marginBottom: '4px', fontWeight: '800' }}>
                اسم الكافيه / العميل *
              </label>
              <B2BCustomerAutocomplete
                value={customerName}
                onChange={(val) => setCustomerName(val)}
                onSelectCustomer={(cust) => {
                  setCustomerName(cust.companyName);
                  if (cust.phone) setCustomerPhone(cust.phone);
                  if (cust.address || cust.city) {
                    setCustomerAddress(`${cust.city || ''} ${cust.address ? `• ${cust.address}` : ''}`.trim());
                  }
                  // Auto load customer's preferred products if available
                  if (Array.isArray(cust.preferredProducts) && cust.preferredProducts.length > 0) {
                    const matchedItems = cust.preferredProducts.map(pIdOrName => {
                      const p = (products || []).find(prod =>
                        prod.id === pIdOrName ||
                        (prod.name && prod.name.toLowerCase().includes(String(pIdOrName).toLowerCase())) ||
                        (prod.nameEn && prod.nameEn.toLowerCase().includes(String(pIdOrName).toLowerCase()))
                      );
                      if (!p) return null;
                      const unitPrice = p.wholesalePricePerKg || p.pricePerKg || (p.sellingPrice * 4) || 1000;
                      const isPiece = p.unitType === 'piece';
                      const defaultQty = isPiece ? 2 : 5;
                      return {
                        productId: p.id,
                        name: p.name,
                        unitType: p.unitType || 'weight',
                        weightGram: isPiece ? undefined : 1000,
                        qty: defaultQty,
                        price: unitPrice,
                        total: defaultQty * unitPrice
                      };
                    }).filter(Boolean);
                    if (matchedItems.length > 0) {
                      setItems(matchedItems);
                    }
                  }
                }}
                customers={customers}
                b2bRequests={b2bRequests}
                placeholder="ابحث عن كافيه مسجل أو اكتب كافيه جديد..."
                theme="dark"
                inputStyle={{
                  padding: '9px 38px 9px 12px',
                  background: '#110502',
                  border: '1px solid rgba(212, 163, 115, 0.3)',
                  borderRadius: '8px',
                  color: '#ffffff',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: '#d4a373', display: 'block', marginBottom: '4px', fontWeight: '800' }}>
                رقم الهاتف للتواصل والفاتورة
              </label>
              <input
                type="text"
                placeholder="010XXXXXXXX"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', background: '#110502', border: '1px solid rgba(212, 163, 115, 0.3)', borderRadius: '8px', color: '#ffffff', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          {/* Delivery Address */}
          <div>
            <label style={{ fontSize: '0.8rem', color: '#d4a373', display: 'block', marginBottom: '4px', fontWeight: '800' }}>
              عنوان التسليم / الفرع
            </label>
            <input
              type="text"
              placeholder="مثال: التجمع الخامس - التسعين الشمالي..."
              value={customerAddress}
              onChange={(e) => setCustomerAddress(e.target.value)}
              style={{ width: '100%', padding: '9px 12px', background: '#110502', border: '1px solid rgba(212, 163, 115, 0.3)', borderRadius: '8px', color: '#ffffff', fontSize: '0.85rem' }}
            />
          </div>

          {/* Items Table */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontSize: '0.84rem', color: '#d4a373', fontWeight: '800' }}>
                📦 الأصناف والأوزان المطلوبة (تُخصم من المخزون فورياً):
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                style={{ background: 'rgba(217, 119, 6, 0.2)', border: '1px solid #d97706', color: '#fbbf24', borderRadius: '6px', padding: '4px 10px', fontSize: '0.78rem', fontWeight: '800', cursor: 'pointer' }}
              >
                + إضافة صنف
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {items.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: '10px',
                    padding: '10px 12px',
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 1fr auto',
                    gap: '8px',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <select
                      value={item.productId}
                      onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                      style={{ width: '100%', padding: '7px 8px', background: '#110502', border: '1px solid rgba(212, 163, 115, 0.3)', borderRadius: '6px', color: '#ffffff', fontSize: '0.8rem' }}
                    >
                      {products.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} (رصيد: {p.unitType === 'weight' ? (p.stockGram ? p.stockGram / 1000 : p.stock) : p.stock} {p.unitType === 'weight' ? 'كجم' : 'قطعة'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <input
                      type="number"
                      min="1"
                      placeholder="الكمية"
                      value={item.qty}
                      onChange={(e) => handleItemChange(idx, 'qty', e.target.value)}
                      style={{ width: '100%', padding: '7px 8px', background: '#110502', border: '1px solid rgba(212, 163, 115, 0.3)', borderRadius: '6px', color: '#ffffff', fontSize: '0.8rem' }}
                    />
                  </div>

                  <div>
                    <input
                      type="number"
                      min="0"
                      placeholder="سعر الكيلو/الوحدة"
                      value={item.price}
                      onChange={(e) => handleItemChange(idx, 'price', e.target.value)}
                      style={{ width: '100%', padding: '7px 8px', background: '#110502', border: '1px solid rgba(212, 163, 115, 0.3)', borderRadius: '6px', color: '#ffffff', fontSize: '0.8rem' }}
                    />
                  </div>

                  <div style={{ color: '#34d399', fontWeight: '900', fontSize: '0.85rem', textAlign: 'center' }}>
                    {Number(item.total || 0).toLocaleString()} ج.م
                  </div>

                  <div>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Mode & Debt calculation */}
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(212, 163, 115, 0.25)',
              borderRadius: '14px',
              padding: '16px'
            }}
          >
            <div style={{ fontSize: '0.84rem', color: '#d4a373', fontWeight: '800', marginBottom: '10px' }}>
              💳 طريقة الدفع والمديونية الآجلة:
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#aaa', display: 'block', marginBottom: '4px' }}>
                  طريقة السداد
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', background: '#110502', border: '1px solid #d4a373', borderRadius: '8px', color: '#ffffff', fontSize: '0.85rem' }}
                >
                  <option value="deferred">دفع آجل / جزء مقدم والباقي مديونية</option>
                  <option value="cash">كاش كامل (الخزينة الرئيسية)</option>
                  <option value="instapay">تحويل إنستاباي كامل</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#aaa', display: 'block', marginBottom: '4px' }}>
                  المدفوع كاش الآن (المقدم)
                </label>
                <input
                  type="number"
                  min="0"
                  max={total}
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  disabled={paymentMethod === 'cash' || paymentMethod === 'instapay'}
                  style={{ width: '100%', padding: '8px 12px', background: '#110502', border: '1px solid #d4a373', borderRadius: '8px', color: '#ffffff', fontSize: '0.85rem' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#aaa', display: 'block', marginBottom: '4px' }}>
                  خصم خاص (ج.م)
                </label>
                <input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', background: '#110502', border: '1px solid rgba(212, 163, 115, 0.3)', borderRadius: '8px', color: '#ffffff', fontSize: '0.85rem' }}
                />
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                borderRadius: '8px',
                padding: '10px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.85rem'
              }}
            >
              <div>
                <span style={{ color: '#aaa' }}>إجمالي الفاتورة: </span>
                <strong style={{ color: '#ffffff' }}>{total.toLocaleString()} ج.م</strong>
              </div>
              <div>
                <span style={{ color: '#34d399' }}>المدفوع للخزينة: </span>
                <strong style={{ color: '#34d399' }}>{numPaid.toLocaleString()} ج.م</strong>
              </div>
              <div>
                <span style={{ color: '#fbbf24' }}>المديونية المتبقية: </span>
                <strong style={{ color: '#fbbf24' }}>{remainingDebt.toLocaleString()} ج.م</strong>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label style={{ fontSize: '0.8rem', color: '#aaa', display: 'block', marginBottom: '4px' }}>
              ملاحظات الفاتورة
            </label>
            <input
              type="text"
              placeholder="مثال: فاتورة توريد كافيه - شحنة فورية"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', background: '#110502', border: '1px solid rgba(212, 163, 115, 0.3)', borderRadius: '8px', color: '#ffffff', fontSize: '0.85rem' }}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(212, 163, 115, 0.3)', color: '#f5ebe1', borderRadius: '10px', padding: '10px 18px', fontWeight: '800', cursor: 'pointer' }}
            >
              إلغاء
            </button>
            <button
              type="submit"
              style={{ background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)', color: '#ffffff', border: 'none', borderRadius: '10px', padding: '10px 24px', fontWeight: '900', fontSize: '0.92rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <CheckCircle2 size={18} />
              <span>إصدار الفاتورة وخصم المخزون 📦</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// RETURN B2B MODAL (إرجاع البضاعة واسترداد المخزون وتسوية الحسابات)
// -------------------------------------------------------------
const ReturnB2BModal = ReturnInvoiceModal;

// -------------------------------------------------------------
// SETTLE B2B DEBT MODAL (سداد مديونية في الخزينة)
// -------------------------------------------------------------
const SettleB2BDebtModal = ({ invoice, treasuryAccounts, onClose, onSettle }) => {
  const remainingDebt = Number(invoice.remainingDebt || 0);
  const [amount, setAmount] = useState(String(remainingDebt));
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [accountId, setAccountId] = useState(treasuryAccounts[0]?.id || 'acc-cash-main');
  const [notes, setNotes] = useState(`سداد مديونية فاتورة توريد B2B #${invoice.invoiceNumber}`);

  const numAmount = Math.max(0, Number(amount || 0));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (numAmount <= 0) {
      alert('يرجى إدخال مبلغ سداد أكبر من الصفر!');
      return;
    }
    onSettle(numAmount, paymentMethod, accountId, notes);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(6px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        style={{
          background: '#1a0b05',
          backgroundImage: 'linear-gradient(135deg, #102315 0%, #06150a 100%)',
          border: '2px solid #10b981',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '520px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.9), 0 0 30px rgba(16, 185, 129, 0.25)',
          color: '#f5ebe1',
          overflow: 'hidden'
        }}
      >
        <div
          style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            padding: '20px 24px',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <DollarSign size={24} />
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '900' }}>
                سداد مديونية فاتورة #{invoice.invoiceNumber}
              </h2>
              <div style={{ fontSize: '0.82rem', opacity: 0.95 }}>
                العميل: {invoice.customerName}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'rgba(0,0,0,0.2)', border: 'none', color: '#ffffff', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div style={{ background: 'rgba(255, 255, 255, 0.05)', borderRadius: '12px', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#d4a373' }}>إجمالي المديونية الحالية:</span>
            <span style={{ color: '#fbbf24', fontSize: '1.2rem', fontWeight: '900' }}>
              {remainingDebt.toLocaleString()} ج.م
            </span>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: '#34d399', display: 'block', marginBottom: '4px', fontWeight: '800' }}>
              المبلغ المدفوع الآن (ج.م) *
            </label>
            <input
              type="number"
              min="1"
              max={remainingDebt}
              required
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', background: '#110502', border: '1.5px solid #10b981', borderRadius: '8px', color: '#ffffff', fontSize: '1.1rem', fontWeight: '900' }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#aaa', display: 'block', marginBottom: '4px' }}>
                طريقة التحصيل
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', background: '#110502', border: '1px solid rgba(212, 163, 115, 0.3)', borderRadius: '8px', color: '#ffffff', fontSize: '0.85rem' }}
              >
                <option value="cash">كاش (نقدي)</option>
                <option value="instapay">إنستاباي (InstaPay)</option>
                <option value="bank">تحويل بنكي</option>
                <option value="wallet">محفظة إلكترونية</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: '#aaa', display: 'block', marginBottom: '4px' }}>
                إيداع في حساب الخزينة
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', background: '#110502', border: '1px solid rgba(212, 163, 115, 0.3)', borderRadius: '8px', color: '#ffffff', fontSize: '0.85rem' }}
              >
                {treasuryAccounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label style={{ fontSize: '0.8rem', color: '#aaa', display: 'block', marginBottom: '4px' }}>
              ملاحظات السند
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', background: '#110502', border: '1px solid rgba(212, 163, 115, 0.3)', borderRadius: '8px', color: '#ffffff', fontSize: '0.85rem' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(212, 163, 115, 0.3)', color: '#f5ebe1', borderRadius: '10px', padding: '10px 18px', fontWeight: '800', cursor: 'pointer' }}
            >
              إلغاء
            </button>
            <button
              type="submit"
              style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#ffffff', border: 'none', borderRadius: '10px', padding: '10px 24px', fontWeight: '900', fontSize: '0.92rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)' }}
            >
              <CheckCircle2 size={18} />
              <span>تأكيد استلام المبلغ وإيداعه بالخزينة</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
