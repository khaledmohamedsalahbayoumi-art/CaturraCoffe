import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Repeat,
  Plus,
  Search,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  Phone,
  MapPin,
  Coffee,
  Sparkles,
  Trash2,
  Edit3,
  Play,
  Pause,
  Printer,
  ChevronDown,
  ChevronUp,
  X,
  Send,
  DollarSign,
  Package,
  Layers,
  ArrowRight,
  Eye,
  FileText
} from 'lucide-react';
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

export const B2BStandingOrdersTab = ({ onOpenInvoiceModal }) => {
  const {
    b2bStandingOrders = [],
    dueStandingOrders = [],
    dueStandingOrdersCount = 0,
    addB2BStandingOrder,
    updateB2BStandingOrder,
    deleteB2BStandingOrder,
    fulfillB2BStandingOrder,
    products = [],
    customers = [],
    b2bRequests = [],
    invoices = [],
    language = 'ar',
    isRtl = true,
    confirmDialog
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'due' | 'active' | 'paused'
  const [expandedHistoryId, setExpandedHistoryId] = useState(null);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [orderToFulfill, setOrderToFulfill] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // 👁️ Open Invoice Modal for Standing Order (finds real invoice or creates preview)
  const handlePreviewStandingOrderInvoice = (order) => {
    // 1. Check if there is an existing invoice for this standing order
    const matchingInv = (invoices || []).find(inv =>
      inv.standingOrderId === order.id ||
      (order.refCode && inv.b2bRefCode === order.refCode)
    );
    if (matchingInv && onOpenInvoiceModal) {
      onOpenInvoiceModal(matchingInv);
      return;
    }

    // 2. Otherwise generate preview invoice of the recurring order
    const orderInvoice = {
      id: `so-inv-${order.id}`,
      invoiceNumber: `ST-ORD-${order.refCode || order.id.slice(-4)}`,
      date: order.nextDeliveryDate || new Date().toISOString().split('T')[0],
      customerId: order.customerId,
      customerName: order.companyName,
      customerPhone: order.phone,
      customerAddress: order.address || 'مقر الكافيه',
      source: 'b2b',
      isB2B: true,
      b2bRefCode: order.refCode,
      standingOrderId: order.id,
      items: (order.items || []).map(it => ({
        productId: it.productId,
        name: it.productName,
        qty: it.qty,
        unitPrice: it.unitPrice,
        total: it.total || (it.qty * it.unitPrice),
        unitType: it.unitType || 'weight',
        weightGram: it.weightGram || 1000
      })),
      subtotal: Number(order.totalAmount || 0),
      discount: 0,
      total: Number(order.totalAmount || 0),
      paidAmount: Number(order.defaultDownPayment || 0),
      remainingDebt: Math.max(0, Number(order.totalAmount || 0) - Number(order.defaultDownPayment || 0)),
      paymentMethod: Number(order.defaultDownPayment || 0) > 0 ? 'partial' : 'deferred',
      status: 'pending',
      trackingStatus: 'processing',
      cashierName: 'مسؤول العقود والتوريد الدوري B2B',
      orderNotes: `عقد توريد دوري (${order.deliveryFrequency === 'weekly' ? 'أسبوعي' : order.deliveryFrequency === 'biweekly' ? 'نصف شهري' : 'شهري'}) #${order.refCode || ''} | ${order.notes || ''}`
    };

    if (onOpenInvoiceModal) {
      onOpenInvoiceModal(orderInvoice);
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const frequencyLabels = {
    weekly: { ar: 'أسبوعي (كل 7 أيام)', en: 'Weekly (Every 7 days)', days: 7, badge: '📅 أسبوعي' },
    biweekly: { ar: 'نصف شهري (كل 14 يوم)', en: 'Bi-Weekly (Every 14 days)', days: 14, badge: '📦 نصف شهري' },
    monthly: { ar: 'شهري (كل 30 يوم)', en: 'Monthly (Every 30 days)', days: 30, badge: '🗓️ شهري' },
    custom: { ar: 'مخصص', en: 'Custom', days: 7, badge: '⚙️ دورة مخصصة' }
  };

  // KPIs
  const stats = useMemo(() => {
    const total = b2bStandingOrders.length;
    const activeCount = b2bStandingOrders.filter(o => o.status === 'active').length;
    const dueCount = dueStandingOrdersCount;

    // Estimate monthly volume in KG
    const monthlyTotalKg = b2bStandingOrders
      .filter(o => o.status === 'active')
      .reduce((sum, order) => {
        const orderKg = (order.items || []).reduce((itemSum, item) => {
          const qty = Number(item.qty || 1);
          const kg = item.unitType === 'weight' ? (Number(item.weightGram || 1000) / 1000) * qty : qty;
          return itemSum + kg;
        }, 0);

        let multiplier = 4; // weekly
        if (order.frequency === 'biweekly') multiplier = 2;
        else if (order.frequency === 'monthly') multiplier = 1;
        else if (order.frequency === 'custom') multiplier = Math.round(30 / (Number(order.customDays) || 7));

        return sum + (orderKg * multiplier);
      }, 0);

    // Estimate monthly revenue
    const monthlyRevenue = b2bStandingOrders
      .filter(o => o.status === 'active')
      .reduce((sum, order) => {
        const orderVal = Number(order.totalAmount || 0);
        let multiplier = 4;
        if (order.frequency === 'biweekly') multiplier = 2;
        else if (order.frequency === 'monthly') multiplier = 1;
        else if (order.frequency === 'custom') multiplier = Math.round(30 / (Number(order.customDays) || 7));
        return sum + (orderVal * multiplier);
      }, 0);

    return { total, activeCount, dueCount, monthlyTotalKg: Math.round(monthlyTotalKg), monthlyRevenue };
  }, [b2bStandingOrders, dueStandingOrdersCount]);

  // Filtered Orders
  const filteredOrders = useMemo(() => {
    return b2bStandingOrders.filter(order => {
      // Search
      if (searchQuery.trim()) {
        const q = normalizeArabic(searchQuery.trim().toLowerCase());
        const nameMatch = normalizeArabic(order.companyName || '').toLowerCase().includes(q);
        const contactMatch = normalizeArabic(order.contactName || '').toLowerCase().includes(q);
        const refMatch = (order.refCode || '').toLowerCase().includes(q);
        const phoneMatch = normalizePhone(order.phone || '').includes(normalizePhone(q));
        if (!nameMatch && !contactMatch && !refMatch && !phoneMatch) return false;
      }

      // Status
      if (statusFilter === 'due') {
        const isDue = order.status === 'active' && order.nextDeliveryDate && order.nextDeliveryDate <= todayStr;
        if (!isDue) return false;
      } else if (statusFilter === 'active') {
        if (order.status !== 'active') return false;
      } else if (statusFilter === 'paused') {
        if (order.status !== 'paused') return false;
      }

      return true;
    });
  }, [b2bStandingOrders, searchQuery, statusFilter, todayStr]);

  // Toggle active/paused status
  const handleToggleStatus = (order) => {
    const nextStatus = order.status === 'active' ? 'paused' : 'active';
    updateB2BStandingOrder(order.id, { status: nextStatus });
    showToast(nextStatus === 'active' ? 'تم تفعيل العقد الدوري بنجاح ▶️' : 'تم إيقاف العقد مؤقتاً ⏸️');
  };

  // WhatsApp reminder message
  const handleSendWhatsAppReminder = (order) => {
    const cleanPhone = normalizePhone(order.phone || '');
    if (!cleanPhone) {
      alert('لا يوجد رقم هاتف مسجل لهذا الكافيه!');
      return;
    }
    const intlPhone = cleanPhone.startsWith('0') ? '2' + cleanPhone : cleanPhone;
    const itemsSummary = (order.items || []).map(i => `• ${i.productName} (${i.qty} كجم)`).join('\n');
    const msg = `تحياتنا من محمصة كاتورا للقهوة المختصة ☕\n\nنود تذكيركم بموعد توريد دفعتكم الدورية الثابتة المجدولة اليوم (${order.companyName}):\n${itemsSummary}\nإجمالي الشحنة: ${Number(order.totalAmount || 0).toLocaleString()} ج.م\n\nفريق التحميص يجهز شحنتكم الآن للانطلاق! هل هناك أي تعديل مطلوب في كمية هذا الأسبوع؟`;
    window.open(`https://wa.me/${intlPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

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

      {/* 🚨 1. URGENT DELIVERY DUE BANNER (حاجة تفكرني ب ده) 🚨 */}
      {dueStandingOrders.length > 0 && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(127, 29, 29, 0.95) 0%, rgba(69, 10, 10, 0.98) 100%)',
            border: '2px solid #ef4444',
            borderRadius: '20px',
            padding: '20px 24px',
            boxShadow: '0 12px 35px rgba(239, 68, 68, 0.35)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            animation: 'pulse 2s infinite'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '14px',
                  background: 'rgba(239, 68, 68, 0.25)',
                  border: '1.5px solid #ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Clock size={26} color="#fca5a5" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.18rem', fontWeight: '900', color: '#ffffff' }}>
                  🚨 تنبيه التوريدات المجدولة: لديك ({dueStandingOrders.length}) طلبية دورية مستحقة التسليم اليوم للكافيهات الشريكة!
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#fca5a5' }}>
                  حان موعد تجهيز البن وشحن الطلبيات الثابتة. يمكنك تنفيذ التوريد بضغطة زر واحدة لخصم المخزون وتسجيل المديونية تلقائياً.
                </p>
              </div>
            </div>
            <button
              onClick={() => setStatusFilter('due')}
              style={{
                background: '#ffffff',
                color: '#991b1b',
                border: 'none',
                borderRadius: '10px',
                padding: '8px 16px',
                fontWeight: '900',
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>عرض المستحق الآن فقط</span>
              <ArrowRight size={16} />
            </button>
          </div>

          {/* Quick fulfillment cards in banner */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
            {dueStandingOrders.map(order => (
              <div
                key={order.id}
                style={{
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid rgba(252, 165, 165, 0.4)',
                  borderRadius: '14px',
                  padding: '14px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ fontWeight: '900', fontSize: '0.98rem', color: '#ffffff' }}>
                    {order.companyName}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#fecaca', marginTop: '3px' }}>
                    {order.city} • هاتف: {order.phone}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#fed7aa', marginTop: '4px', fontWeight: '800' }}>
                    📦 الكمية: {(order.items || []).map(i => `${i.qty} كجم ${i.productName}`).join(' + ')}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <button
                    onClick={() => setOrderToFulfill(order)}
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '7px 12px',
                      fontWeight: '900',
                      fontSize: '0.82rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <Truck size={14} />
                    <span>تنفيذ التوريد 🚀</span>
                  </button>

                  <button
                    onClick={() => handleSendWhatsAppReminder(order)}
                    style={{
                      background: 'rgba(37, 211, 102, 0.15)',
                      border: '1px solid #25D366',
                      color: '#25D366',
                      borderRadius: '8px',
                      padding: '5px 10px',
                      fontWeight: '800',
                      fontSize: '0.76rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <WhatsAppIcon size={13} />
                    <span>تذكير واتساب</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 📊 2. KPI METRICS CARDS 📊 */}
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
            <span style={{ fontSize: '0.85rem', color: '#d4a373', fontWeight: '800' }}>العقود الدورية النشطة</span>
            <Repeat size={20} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#ffffff', marginTop: '8px' }}>
            {stats.activeCount} <span style={{ fontSize: '0.9rem', color: '#888' }}>/ {stats.total} منشأة</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#10b981', marginTop: '4px' }}>
            عقود شراكة منتظمة مع كافيهات وفنادق
          </div>
        </div>

        <div
          style={{
            background: stats.dueCount > 0
              ? 'linear-gradient(135deg, rgba(127, 29, 29, 0.3) 0%, rgba(37, 18, 10, 0.9) 100%)'
              : 'linear-gradient(135deg, rgba(37, 18, 10, 0.9) 0%, rgba(26, 11, 5, 0.9) 100%)',
            border: stats.dueCount > 0 ? '1.5px solid #ef4444' : '1px solid rgba(212, 163, 115, 0.25)',
            borderRadius: '16px',
            padding: '16px 20px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: stats.dueCount > 0 ? '#fca5a5' : '#d4a373', fontWeight: '800' }}>
              توريدات مستحقة اليوم ⏰
            </span>
            <Clock size={20} color={stats.dueCount > 0 ? '#ef4444' : '#f59e0b'} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '900', color: stats.dueCount > 0 ? '#ef4444' : '#ffffff', marginTop: '8px' }}>
            {stats.dueCount} <span style={{ fontSize: '0.9rem', color: '#888' }}>طلبية</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: stats.dueCount > 0 ? '#fca5a5' : '#aaa', marginTop: '4px' }}>
            {stats.dueCount > 0 ? 'تحتاج لتجهيز الشحن الفوري' : 'لا توجد دفعات متأخرة اليوم'}
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
            <span style={{ fontSize: '0.85rem', color: '#d4a373', fontWeight: '800' }}>حجم التوريد الشهري التقديري</span>
            <Coffee size={20} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#ffffff', marginTop: '8px' }}>
            {stats.monthlyTotalKg} <span style={{ fontSize: '0.95rem', color: '#f59e0b' }}>كجم/شهر</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#aaa', marginTop: '4px' }}>
            إجمالي استهلاك الكافيهات المتعاقدة
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
            <span style={{ fontSize: '0.85rem', color: '#d4a373', fontWeight: '800' }}>إيراد التوريد الشهري المتوقع</span>
            <DollarSign size={20} color="#34d399" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '900', color: '#34d399', marginTop: '8px' }}>
            {stats.monthlyRevenue.toLocaleString()} <span style={{ fontSize: '0.85rem', color: '#aaa' }}>ج.م</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#34d399', marginTop: '4px' }}>
            إيراد دوري مضمون بعقود مستقرة
          </div>
        </div>
      </div>

      {/* 🔍 3. TOOLBAR & FILTER BAR 🔍 */}
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
          <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
            <Search
              size={18}
              color="#d4a373"
              style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)' }}
            />
            <input
              type="text"
              placeholder="بحث باسم الكافيه، المسؤول، الهاتف، أو الكود..."
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

          {/* Status Filter Buttons */}
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
              الكل ({stats.total})
            </button>
            <button
              onClick={() => setStatusFilter('due')}
              style={{
                background: statusFilter === 'due' ? '#ef4444' : 'rgba(239, 68, 68, 0.15)',
                color: statusFilter === 'due' ? '#ffffff' : '#fca5a5',
                border: statusFilter === 'due' ? 'none' : '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '0.82rem',
                fontWeight: '900',
                cursor: 'pointer'
              }}
            >
              مستحق اليوم ⏰ ({stats.dueCount})
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              style={{
                background: statusFilter === 'active' ? '#10b981' : 'rgba(255,255,255,0.06)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '0.82rem',
                fontWeight: '800',
                cursor: 'pointer'
              }}
            >
              النشطة ({stats.activeCount})
            </button>
          </div>
        </div>

        {/* Create Standing Order Button */}
        <button
          onClick={() => {
            setEditingOrder(null);
            setIsCreateModalOpen(true);
          }}
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
          <span>+ إنشاء عقد دوري ثابت لكافيه</span>
        </button>
      </div>

      {/* 📦 4. STANDING ORDERS CARDS LIST 📦 */}
      {filteredOrders.length === 0 ? (
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
          <Repeat size={44} style={{ opacity: 0.5, marginBottom: '12px' }} />
          <h3 style={{ margin: '0 0 8px', color: '#ffffff', fontWeight: '800' }}>لا توجد طلبيات دورية مطابقة للبحث</h3>
          <p style={{ margin: 0, fontSize: '0.88rem' }}>
            يمكنك إنشاء عقد دوري ثابت جديد لكافيه أو ضبط فلاتر البحث أعلاه.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '16px' }}>
          {filteredOrders.map(order => {
            const isDue = order.status === 'active' && order.nextDeliveryDate && order.nextDeliveryDate <= todayStr;
            const isPaused = order.status === 'paused';
            const historyCount = (order.history || []).length;
            const isHistoryExpanded = expandedHistoryId === order.id;

            return (
              <div
                key={order.id}
                style={{
                  background: 'linear-gradient(135deg, rgba(37, 18, 10, 0.95) 0%, rgba(26, 11, 5, 0.97) 100%)',
                  borderRadius: '20px',
                  border: isDue
                    ? '2px solid #ef4444'
                    : (isPaused ? '1.5px solid rgba(150, 150, 150, 0.3)' : '1.5px solid rgba(212, 163, 115, 0.3)'),
                  boxShadow: isDue
                    ? '0 12px 32px rgba(239, 68, 68, 0.25)'
                    : '0 8px 24px rgba(0,0,0,0.5)',
                  padding: '22px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  position: 'relative'
                }}
              >
                {/* Header: Company, Ref & Frequency */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span
                        style={{
                          background: 'rgba(217, 119, 6, 0.2)',
                          color: '#fbbf24',
                          border: '1px solid rgba(217, 119, 6, 0.4)',
                          borderRadius: '6px',
                          padding: '2px 8px',
                          fontSize: '0.72rem',
                          fontWeight: '900'
                        }}
                      >
                        {order.refCode}
                      </span>
                      <span
                        style={{
                          background: isPaused ? 'rgba(156, 163, 175, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                          color: isPaused ? '#9ca3af' : '#34d399',
                          border: isPaused ? '1px solid #9ca3af' : '1px solid #10b981',
                          borderRadius: '6px',
                          padding: '2px 8px',
                          fontSize: '0.72rem',
                          fontWeight: '900'
                        }}
                      >
                        {isPaused ? '⏸️ متوقف مؤقتاً' : '▶️ نشط ومنتظم'}
                      </span>
                      <span
                        style={{
                          background: 'rgba(56, 189, 248, 0.15)',
                          color: '#38bdf8',
                          border: '1px solid rgba(56, 189, 248, 0.4)',
                          borderRadius: '6px',
                          padding: '2px 8px',
                          fontSize: '0.72rem',
                          fontWeight: '800'
                        }}
                      >
                        {frequencyLabels[order.frequency]?.badge || 'دوري'}
                      </span>
                    </div>

                    <h3 style={{ margin: '8px 0 0', fontSize: '1.18rem', fontWeight: '900', color: '#ffffff' }}>
                      {order.companyName}
                    </h3>
                    <div style={{ fontSize: '0.84rem', color: '#d4a373', marginTop: '3px' }}>
                      {order.contactName && <span>المسؤول: {order.contactName} • </span>}
                      <span>{order.city} {order.address ? `(${order.address})` : ''}</span>
                    </div>
                  </div>

                  {/* Delivery Status Indicator */}
                  <div>
                    {isDue ? (
                      <div
                        style={{
                          background: '#ef4444',
                          color: '#ffffff',
                          padding: '6px 12px',
                          borderRadius: '10px',
                          fontWeight: '900',
                          fontSize: '0.78rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)'
                        }}
                      >
                        <Clock size={14} />
                        <span>مستحق اليوم! ⏰</span>
                      </div>
                    ) : (
                      <div
                        style={{
                          background: 'rgba(255,255,255,0.06)',
                          border: '1px solid rgba(212, 163, 115, 0.3)',
                          color: '#d4a373',
                          padding: '6px 12px',
                          borderRadius: '10px',
                          fontWeight: '800',
                          fontSize: '0.78rem',
                          textAlign: 'center'
                        }}
                      >
                        <div>الموعد القادم:</div>
                        <div style={{ color: '#ffffff', fontWeight: '900', marginTop: '2px' }}>
                          {order.nextDeliveryDate || 'غير محدد'}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Products / Items in contract */}
                <div
                  style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    borderRadius: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    padding: '12px 14px'
                  }}
                >
                  <div style={{ fontSize: '0.78rem', color: '#aaa', fontWeight: '800', marginBottom: '8px' }}>
                    📦 تشكيلة وأوزان التوريد الثابتة:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {(order.items || []).map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '0.84rem',
                          borderBottom: idx < order.items.length - 1 ? '1px dashed rgba(255,255,255,0.06)' : 'none',
                          paddingBottom: idx < order.items.length - 1 ? '6px' : '0'
                        }}
                      >
                        <div style={{ color: '#ffffff', fontWeight: '800' }}>
                          ☕ {item.productName}
                        </div>
                        <div style={{ color: '#fbbf24', fontWeight: '900' }}>
                          {item.qty} {item.unitType === 'weight' ? 'كجم' : 'قطعة'} × {Number(item.unitPrice || 0).toLocaleString()} = {Number(item.total || (item.qty * item.unitPrice)).toLocaleString()} ج.م
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Financial terms summary */}
                  <div
                    style={{
                      marginTop: '10px',
                      paddingTop: '8px',
                      borderTop: '1px solid rgba(255,255,255,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.85rem'
                    }}
                  >
                    <div>
                      <span style={{ color: '#d4a373' }}>إجمالي الدفعة: </span>
                      <strong style={{ color: '#34d399', fontSize: '0.98rem' }}>
                        {Number(order.totalAmount || 0).toLocaleString()} ج.م
                      </strong>
                    </div>

                    <div style={{ fontSize: '0.78rem', color: '#fed7aa' }}>
                      {Number(order.defaultDownPayment || 0) > 0 ? (
                        <span>
                          (مقدم: {Number(order.defaultDownPayment).toLocaleString()} ج.م • متبقي آجل: {Math.max(0, Number(order.totalAmount || 0) - Number(order.defaultDownPayment)).toLocaleString()} ج.م)
                        </span>
                      ) : (
                        <span>(سداد آجل بالكامل)</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Notes if any */}
                {order.notes && (
                  <div style={{ fontSize: '0.8rem', color: '#d4a373', background: 'rgba(217, 119, 6, 0.08)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(217, 119, 6, 0.2)' }}>
                    💡 <strong>ملاحظات:</strong> {order.notes}
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                  {/* Primary Fulfillment Action */}
                  <button
                    onClick={() => setOrderToFulfill(order)}
                    style={{
                      background: isDue
                        ? 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)'
                        : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '9px 16px',
                      fontWeight: '900',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: isDue ? '0 6px 16px rgba(239, 68, 68, 0.4)' : '0 6px 16px rgba(16, 185, 129, 0.3)'
                    }}
                  >
                    <Truck size={16} />
                    <span>{isDue ? 'تنفيذ التوريد المستحق الآن 🚀' : 'تنفيذ وتوريد دفعة 📦'}</span>
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {/* Preview Invoice / Contract */}
                    <button
                      onClick={() => handlePreviewStandingOrderInvoice(order)}
                      style={{
                        background: 'linear-gradient(135deg, #3d1f10 0%, #251209 100%)',
                        border: '1.5px solid #d4a373',
                        color: '#ffffff',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontSize: '0.8rem',
                        fontWeight: '800',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
                      }}
                      title="معاينة وطباعة فاتورة وعقد التوريد الدوري"
                    >
                      <Eye size={14} color="#fbbf24" />
                      <span>معاينة الفاتورة</span>
                    </button>

                    {/* WhatsApp */}
                    <button
                      onClick={() => handleSendWhatsAppReminder(order)}
                      style={{
                        background: 'rgba(37, 211, 102, 0.15)',
                        border: '1px solid #25D366',
                        color: '#25D366',
                        borderRadius: '8px',
                        padding: '8px 10px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.8rem',
                        fontWeight: '800'
                      }}
                      title="مراسلة وتذكير الكافيه بالواتساب"
                    >
                      <WhatsAppIcon size={14} />
                      <span>واتساب</span>
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => {
                        setEditingOrder(order);
                        setIsCreateModalOpen(true);
                      }}
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(212, 163, 115, 0.3)',
                        color: '#f5ebe1',
                        borderRadius: '8px',
                        padding: '8px 10px',
                        cursor: 'pointer'
                      }}
                      title="تعديل العقد"
                    >
                      <Edit3 size={15} />
                    </button>

                    {/* Pause/Resume */}
                    <button
                      onClick={() => handleToggleStatus(order)}
                      style={{
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(212, 163, 115, 0.3)',
                        color: isPaused ? '#10b981' : '#f59e0b',
                        borderRadius: '8px',
                        padding: '8px 10px',
                        cursor: 'pointer'
                      }}
                      title={isPaused ? 'استئناف العقد' : 'إيقاف مؤقت'}
                    >
                      {isPaused ? <Play size={15} /> : <Pause size={15} />}
                    </button>

                    {/* Delete */}
                    <button
                      onClick={async () => {
                        const ok = await confirmDialog({
                          title: language === 'en' ? 'Delete Standing Contract' : 'حذف العقد الدوري',
                          message: language === 'en'
                            ? `Are you sure you want to delete standing contract for "${order.companyName}"?`
                            : `هل أنت متأكد من حذف العقد الدوري لـ "${order.companyName}"؟`,
                          details: language === 'en'
                            ? 'All scheduled automatic deliveries for this client will be cancelled.'
                            : 'سيتم إلغاء جدول التوريدات الدورية التلقائية المرتبطة بهذا العقد نهائياً.',
                          type: 'danger',
                          confirmText: language === 'en' ? 'Delete' : 'نعم، احذف',
                          cancelText: language === 'en' ? 'Cancel' : 'إلغاء'
                        });
                        if (ok) {
                          deleteB2BStandingOrder(order.id);
                          showToast(language === 'en' ? 'Contract deleted' : 'تم حذف العقد الدوري بنجاح');
                        }
                      }}
                      style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#ef4444',
                        borderRadius: '8px',
                        padding: '8px 10px',
                        cursor: 'pointer'
                      }}
                      title="حذف العقد"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* History Accordion Trigger */}
                {historyCount > 0 && (
                  <div style={{ borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '8px' }}>
                    <button
                      onClick={() => setExpandedHistoryId(isHistoryExpanded ? null : order.id)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: '#d4a373',
                        fontSize: '0.78rem',
                        fontWeight: '800',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: '4px 0'
                      }}
                    >
                      <span>📜 سجل التوريدات السابقة المنفذة ({historyCount} دفعة)</span>
                      {isHistoryExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {isHistoryExpanded && (
                      <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {(order.history || []).map(hist => (
                          <div
                            key={hist.id}
                            style={{
                              background: 'rgba(0, 0, 0, 0.4)',
                              borderRadius: '8px',
                              padding: '8px 12px',
                              fontSize: '0.76rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              borderRight: '3px solid #10b981'
                            }}
                          >
                            <div>
                              <div style={{ color: '#ffffff', fontWeight: '800' }}>
                                📅 {hist.deliveryDate} • فاتورة #{hist.invoiceNumber}
                              </div>
                              <div style={{ color: '#aaa', marginTop: '2px' }}>
                                {hist.note || 'تم توريد الشحنة بنجاح'}
                              </div>
                            </div>
                            <div style={{ textAlign: 'left', fontWeight: '900', color: '#34d399' }}>
                              {Number(hist.amount || 0).toLocaleString()} ج.م
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 🚀 MODAL: FULFILL STANDING ORDER (تنفيذ التوريد وخصم المخزون والمالية) 🚀 */}
      {orderToFulfill && (
        <FulfillOrderModal
          order={orderToFulfill}
          products={products}
          onClose={() => setOrderToFulfill(null)}
          onFulfill={(overrideData) => {
            const newInvoice = fulfillB2BStandingOrder(orderToFulfill.id, overrideData);
            setOrderToFulfill(null);
            showToast(`تم تنفيذ التوريد بنجاح! صدرت فاتورة #${newInvoice?.invoiceNumber || ''} وخصم المخزون`);
            if (newInvoice && onOpenInvoiceModal) {
              onOpenInvoiceModal(newInvoice);
            }
          }}
        />
      )}

      {/* ✏️ MODAL: CREATE / EDIT STANDING ORDER ✏️ */}
      {isCreateModalOpen && (
        <CreateStandingOrderModal
          initialOrder={editingOrder}
          products={products}
          customers={customers}
          b2bRequests={b2bRequests}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingOrder(null);
          }}
          onSave={(orderData) => {
            if (editingOrder) {
              updateB2BStandingOrder(editingOrder.id, orderData);
              showToast('تم تحديث العقد الدوري بنجاح ✅');
            } else {
              addB2BStandingOrder(orderData);
              showToast('تم إنشاء العقد الدوري الثابت بنجاح 🎉');
            }
            setIsCreateModalOpen(false);
            setEditingOrder(null);
          }}
        />
      )}

    </div>
  );
};

// -------------------------------------------------------------
// FULFILL MODAL (تنفيذ وتأكيد الشحنة الدورية مع فحص المخزون والمالية)
// -------------------------------------------------------------
const FulfillOrderModal = ({ order, products, onClose, onFulfill }) => {
  const [paymentMethod, setPaymentMethod] = useState(order.preferredPaymentMethod || 'deferred');
  const [paidAmount, setPaidAmount] = useState(order.defaultDownPayment !== undefined ? String(order.defaultDownPayment) : '0');
  const [deliveryNotes, setDeliveryNotes] = useState(`توريد دوري منتظم #${order.refCode} - ${order.companyName}`);

  const total = Number(order.totalAmount || 0);
  const numPaid = Math.min(total, Math.max(0, Number(paidAmount || 0)));
  const remainingDebt = Math.max(0, total - numPaid);

  // Check inventory availability for items in this contract
  const inventoryCheck = useMemo(() => {
    return (order.items || []).map(item => {
      const prod = products.find(p => p.id === item.productId);
      const reqKg = item.unitType === 'weight' ? (Number(item.weightGram || 1000) / 1000) * Number(item.qty || 1) : Number(item.qty || 1);
      const availableKg = prod ? (prod.unitType === 'weight' ? (prod.stockGram !== undefined ? prod.stockGram / 1000 : prod.stock) : prod.stock) : 0;
      const isEnough = availableKg >= reqKg;

      return {
        ...item,
        reqKg,
        availableKg: Math.round(availableKg * 10) / 10,
        isEnough
      };
    });
  }, [order.items, products]);

  const hasShortage = inventoryCheck.some(i => !i.isEnough);

  const handleSubmit = (e) => {
    e.preventDefault();
    onFulfill({
      paymentMethod,
      paidAmount: numPaid,
      notes: deliveryNotes
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
          border: '2px solid #10b981',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '560px',
          boxShadow: '0 24px 60px rgba(0,0,0,0.9), 0 0 30px rgba(16, 185, 129, 0.25)',
          color: '#f5ebe1',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
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
            <Truck size={24} />
            <div>
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '900' }}>
                تنفيذ وإصدار توريد دوري #{order.refCode}
              </h2>
              <div style={{ fontSize: '0.82rem', opacity: 0.95 }}>
                العميل: {order.companyName} ({order.city})
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

        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Inventory Verification Alert */}
          <div
            style={{
              background: hasShortage ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              border: hasShortage ? '1px solid #ef4444' : '1px solid #10b981',
              borderRadius: '14px',
              padding: '14px 16px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '900', color: hasShortage ? '#fca5a5' : '#34d399', fontSize: '0.88rem' }}>
              {hasShortage ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
              <span>{hasShortage ? 'تنبيه: عجز في رصيد المخزن لبعض الأصناف!' : 'فحص المخزون: جميع الكميات متوفرة بالمستودع وجاهزة للخصم ✅'}</span>
            </div>

            <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {inventoryCheck.map((it, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: '#ffffff' }}>• {it.productName}: مطلوب {it.reqKg} كجم</span>
                  <span style={{ color: it.isEnough ? '#34d399' : '#ef4444', fontWeight: '800' }}>
                    المتاح: {it.availableKg} كجم {it.isEnough ? '✓' : '(عجز!)'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Breakdown (Paid vs Debt) */}
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(212, 163, 115, 0.25)',
              borderRadius: '14px',
              padding: '16px'
            }}
          >
            <div style={{ fontSize: '0.84rem', color: '#d4a373', fontWeight: '800', marginBottom: '10px' }}>
              💳 التسوية المالية وطريقة الدفع:
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#aaa', display: 'block', marginBottom: '4px' }}>
                  طريقة التحصيل
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: '#110502',
                    border: '1px solid #d4a373',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '0.85rem'
                  }}
                >
                  <option value="deferred">دفع آجل / جزء مقدم والباقي مديونية</option>
                  <option value="cash">كاش كامل (الخزينة الرئيسية)</option>
                  <option value="instapay">تحويل إنستاباي كامل</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#aaa', display: 'block', marginBottom: '4px' }}>
                  المبلغ المدفوع كاش الآن (المقدم)
                </label>
                <input
                  type="number"
                  min="0"
                  max={total}
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(e.target.value)}
                  disabled={paymentMethod === 'cash' || paymentMethod === 'instapay'}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    background: '#110502',
                    border: '1px solid #d4a373',
                    borderRadius: '8px',
                    color: '#ffffff',
                    fontSize: '0.85rem'
                  }}
                />
              </div>
            </div>

            {/* Calculations Box */}
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
                <span style={{ color: '#fbbf24' }}>المديونية الآجلة: </span>
                <strong style={{ color: '#fbbf24' }}>{remainingDebt.toLocaleString()} ج.م</strong>
              </div>
            </div>
          </div>

          {/* Delivery Note */}
          <div>
            <label style={{ fontSize: '0.8rem', color: '#aaa', display: 'block', marginBottom: '4px' }}>
              ملاحظة على الفاتورة وشحنة اليوم
            </label>
            <input
              type="text"
              value={deliveryNotes}
              onChange={(e) => setDeliveryNotes(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                background: '#110502',
                border: '1px solid rgba(212, 163, 115, 0.3)',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '0.85rem'
              }}
            />
          </div>

          {/* Automatic Advancement Notice */}
          <div style={{ fontSize: '0.78rem', color: '#d4a373', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', padding: '8px 12px', borderRadius: '8px' }}>
            ℹ️ عند تأكيد التوريد، سيقوم النظام تلقائياً بترحيل موعد التوريد القادم للدفعة التالية ({order.frequency === 'weekly' ? 'بعد 7 أيام' : order.frequency === 'biweekly' ? 'بعد 14 يوم' : 'بعد شهر'}).
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(212, 163, 115, 0.3)',
                color: '#f5ebe1',
                borderRadius: '10px',
                padding: '10px 18px',
                fontWeight: '800',
                cursor: 'pointer'
              }}
            >
              إلغاء
            </button>
            <button
              type="submit"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                padding: '10px 24px',
                fontWeight: '900',
                fontSize: '0.92rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)'
              }}
            >
              <Truck size={18} />
              <span>تأكيد التوريد وخصم المخزون 🚀</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// -------------------------------------------------------------
// CREATE / EDIT STANDING ORDER MODAL
// -------------------------------------------------------------
const CreateStandingOrderModal = ({ initialOrder, products, customers, b2bRequests, onClose, onSave }) => {
  const [companyName, setCompanyName] = useState(initialOrder?.companyName || '');
  const [contactName, setContactName] = useState(initialOrder?.contactName || '');
  const [phone, setPhone] = useState(initialOrder?.phone || '');
  const [city, setCity] = useState(initialOrder?.city || 'القاهرة');
  const [address, setAddress] = useState(initialOrder?.address || '');
  const [frequency, setFrequency] = useState(initialOrder?.frequency || 'weekly');
  const [customDays, setCustomDays] = useState(initialOrder?.customDays || 7);
  const [nextDeliveryDate, setNextDeliveryDate] = useState(initialOrder?.nextDeliveryDate || new Date().toISOString().split('T')[0]);
  const [defaultDownPayment, setDefaultDownPayment] = useState(initialOrder?.defaultDownPayment !== undefined ? String(initialOrder.defaultDownPayment) : '0');
  const [preferredPaymentMethod, setPreferredPaymentMethod] = useState(initialOrder?.preferredPaymentMethod || 'deferred');
  const [notes, setNotes] = useState(initialOrder?.notes || '');

  // Products selection table
  const [items, setItems] = useState(
    initialOrder?.items && initialOrder.items.length > 0
      ? initialOrder.items
      : [
          {
            productId: products[0]?.id || 'prod-1',
            productName: products[0]?.name || 'بن مختص',
            unitType: 'weight',
            weightGram: 1000,
            qty: 10,
            unitPrice: products[0]?.pricePerKg || 1050,
            total: 10500
          }
        ]
  );

  const calculateTotal = (currentItems) => {
    return currentItems.reduce((sum, it) => sum + Number(it.total || 0), 0);
  };

  const handleAddItem = () => {
    const prod = products[0];
    if (!prod) return;
    const newItem = {
      productId: prod.id,
      productName: prod.name,
      unitType: prod.unitType || 'weight',
      weightGram: prod.unitType === 'weight' ? 1000 : undefined,
      qty: 5,
      unitPrice: prod.pricePerKg || prod.sellingPrice || 1000,
      total: (prod.pricePerKg || prod.sellingPrice || 1000) * 5
    };
    setItems([...items, newItem]);
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    const current = { ...updated[index], [field]: value };

    if (field === 'productId') {
      const prod = products.find(p => p.id === value);
      if (prod) {
        current.productName = prod.name;
        current.unitType = prod.unitType || 'weight';
        current.unitPrice = prod.pricePerKg || prod.sellingPrice || 1000;
      }
    }

    const qty = Number(current.qty || 1);
    const unitPrice = Number(current.unitPrice || 0);
    current.total = qty * unitPrice;

    updated[index] = current;
    setItems(updated);
  };

  const handleRemoveItem = (index) => {
    if (items.length <= 1) {
      alert('يجب أن يحتوي العقد الدوري على صنف واحد على الأقل');
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const totalAmount = calculateTotal(items);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!companyName.trim()) {
      alert('يرجى كتابة اسم الكافيه أو المنشأة!');
      return;
    }
    if (!phone.trim()) {
      alert('يرجى كتابة رقم هاتف التواصل!');
      return;
    }

    onSave({
      companyName,
      contactName,
      phone,
      city,
      address,
      frequency,
      customDays: Number(customDays || 7),
      nextDeliveryDate,
      items,
      totalAmount,
      preferredPaymentMethod,
      defaultDownPayment: Number(defaultDownPayment || 0),
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
            <Repeat size={24} />
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '900' }}>
              {initialOrder ? 'تعديل العقد الدوري الثابت' : 'إنشاء عقد توريد دوري ثابت جديد لكافيه (B2B)'}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'rgba(0,0,0,0.2)', border: 'none', color: '#ffffff', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Cafe & Client Info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#d4a373', display: 'block', marginBottom: '4px', fontWeight: '800' }}>
                اسم الكافيه / المنشأة *
              </label>
              <B2BCustomerAutocomplete
                value={companyName}
                onChange={(val) => setCompanyName(val)}
                onSelectCustomer={(cust) => {
                  setCompanyName(cust.companyName);
                  if (cust.contactName) setContactName(cust.contactName);
                  if (cust.phone) setPhone(cust.phone);
                  if (cust.city) setCity(cust.city);
                  if (cust.address) setAddress(cust.address);
                  // Auto load customer's contracted / preferred products!
                  if (Array.isArray(cust.preferredProducts) && cust.preferredProducts.length > 0) {
                    const matchedItems = cust.preferredProducts.map(pIdOrName => {
                      const p = (products || []).find(prod =>
                        prod.id === pIdOrName ||
                        prod.name.toLowerCase().includes(String(pIdOrName).toLowerCase()) ||
                        (prod.nameEn && prod.nameEn.toLowerCase().includes(String(pIdOrName).toLowerCase()))
                      );
                      if (!p) return null;
                      const unitPrice = p.wholesalePricePerKg || p.pricePerKg || (p.sellingPrice * 4) || 1000;
                      const isPiece = p.unitType === 'piece';
                      const defaultQty = isPiece ? 2 : 5;
                      return {
                        productId: p.id,
                        productName: p.name,
                        unitType: p.unitType || 'weight',
                        weightGram: isPiece ? undefined : 1000,
                        qty: defaultQty,
                        unitPrice: unitPrice,
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
                المسؤول / الشيف باريستا
              </label>
              <input
                type="text"
                placeholder="مثال: م. أحمد عبد الرحمن"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', background: '#110502', border: '1px solid rgba(212, 163, 115, 0.3)', borderRadius: '8px', color: '#ffffff', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#d4a373', display: 'block', marginBottom: '4px', fontWeight: '800' }}>
                رقم الهاتف / الواتساب *
              </label>
              <input
                type="text"
                required
                placeholder="010XXXXXXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', background: '#110502', border: '1px solid rgba(212, 163, 115, 0.3)', borderRadius: '8px', color: '#ffffff', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: '#d4a373', display: 'block', marginBottom: '4px', fontWeight: '800' }}>
                المدينة
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', background: '#110502', border: '1px solid rgba(212, 163, 115, 0.3)', borderRadius: '8px', color: '#ffffff', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: '#d4a373', display: 'block', marginBottom: '4px', fontWeight: '800' }}>
                العنوان ومقر الكافيه
              </label>
              <input
                type="text"
                placeholder="الفرع أو المول..."
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', background: '#110502', border: '1px solid rgba(212, 163, 115, 0.3)', borderRadius: '8px', color: '#ffffff', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          {/* Recurrence Schedule */}
          <div
            style={{
              background: 'rgba(0, 0, 0, 0.35)',
              border: '1px solid rgba(212, 163, 115, 0.25)',
              borderRadius: '14px',
              padding: '14px 16px',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px'
            }}
          >
            <div>
              <label style={{ fontSize: '0.8rem', color: '#fbbf24', display: 'block', marginBottom: '4px', fontWeight: '800' }}>
                🔄 تكرار التوريد الدوري
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', background: '#110502', border: '1px solid #d4a373', borderRadius: '8px', color: '#ffffff', fontSize: '0.85rem' }}
              >
                <option value="weekly">أسبوعي (كل 7 أيام)</option>
                <option value="biweekly">نصف شهري (كل 14 يوم)</option>
                <option value="monthly">شهري (كل 30 يوم)</option>
                <option value="custom">مخصص (عدد أيام محدد)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: '#fbbf24', display: 'block', marginBottom: '4px', fontWeight: '800' }}>
                📅 موعد التوريد القادم الأول
              </label>
              <input
                type="date"
                required
                value={nextDeliveryDate}
                onChange={(e) => setNextDeliveryDate(e.target.value)}
                style={{ width: '100%', padding: '9px 12px', background: '#110502', border: '1px solid #d4a373', borderRadius: '8px', color: '#ffffff', fontSize: '0.85rem' }}
              />
            </div>
          </div>

          {/* Products List */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label style={{ fontSize: '0.84rem', color: '#d4a373', fontWeight: '800' }}>
                ☕ أصناف وكميات التوريد الثابتة:
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                style={{ background: 'rgba(217, 119, 6, 0.2)', border: '1px solid #d97706', color: '#fbbf24', borderRadius: '6px', padding: '4px 10px', fontSize: '0.78rem', fontWeight: '800', cursor: 'pointer' }}
              >
                + إضافة صنف آخر
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
                          {p.name} ({p.unitType === 'weight' ? 'بالكيلو' : 'بالقطعة'})
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
                      placeholder="سعر الجملة"
                      value={item.unitPrice}
                      onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
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
                      title="حذف الصنف"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Total Batch Calculation */}
            <div
              style={{
                marginTop: '10px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid #10b981',
                borderRadius: '10px',
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: '#ffffff'
              }}
            >
              <span style={{ fontWeight: '800', fontSize: '0.9rem' }}>إجمالي قيمة الدفعة الواحدة:</span>
              <span style={{ fontWeight: '900', fontSize: '1.2rem', color: '#34d399' }}>
                {totalAmount.toLocaleString()} ج.م
              </span>
            </div>
          </div>

          {/* Payment Terms & Notes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '0.8rem', color: '#aaa', display: 'block', marginBottom: '4px' }}>
                المقدم الافتراضي عند كل تسليم (كاش)
              </label>
              <input
                type="number"
                min="0"
                value={defaultDownPayment}
                onChange={(e) => setDefaultDownPayment(e.target.value)}
                placeholder="0 = آجل كامل"
                style={{ width: '100%', padding: '8px 12px', background: '#110502', border: '1px solid rgba(212, 163, 115, 0.3)', borderRadius: '8px', color: '#ffffff', fontSize: '0.85rem' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.8rem', color: '#aaa', display: 'block', marginBottom: '4px' }}>
                ملاحظات وتعليمات الشحن والتحميص
              </label>
              <input
                type="text"
                placeholder="مثال: تسليم صباح كل أربعاء، طحن خشن للفلتر..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', background: '#110502', border: '1px solid rgba(212, 163, 115, 0.3)', borderRadius: '8px', color: '#ffffff', fontSize: '0.85rem' }}
              />
            </div>
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
              <span>{initialOrder ? 'حفظ التعديلات' : 'إنشاء العقد وتثبيت التوريد'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
