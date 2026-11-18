import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Users,
  Search,
  UserPlus,
  DollarSign,
  FileText,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  ChevronLeft,
  X,
  Award,
  Crown,
  TrendingDown,
  Sparkles,
  MessageCircle,
  Building2,
  Handshake,
  Edit3,
  Plus,
  Receipt,
  Eye,
  Check,
  Save,
  Briefcase,
  Coffee,
  Package,
  Trash2
} from 'lucide-react';
import { DebtSettlementModal } from '../components/DebtSettlementModal';
import { CustomerProductSelector } from '../components/CustomerProductSelector';
import { exportCustomersToPdf } from '../utils/exportUtils';
import { normalizeArabic, normalizePhone } from '../utils/numberEnforcer';

// 🟢 Authentic WhatsApp SVG Icon Component
const WhatsAppIcon = ({ size = 15, color = '#25D366' }) => (
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

// 📱 WhatsApp Click-to-Chat Link Generator
const getWhatsAppUrl = (phone, name = '', isPromo = false) => {
  if (!phone) return '#';
  let clean = phone.toString().replace(/[^0-9]/g, '');
  if (!clean) return '#';

  if (clean.startsWith('002')) {
    clean = clean.slice(2);
  } else if (clean.startsWith('020') && clean.length >= 12) {
    clean = clean.slice(1);
  } else if (clean.startsWith('01') && clean.length === 11) {
    clean = '20' + clean.slice(1);
  } else if (!clean.startsWith('20') && clean.length === 10 && clean.startsWith('1')) {
    clean = '20' + clean;
  }

  const message = isPromo
    ? `أهلاً بك يا ${name || 'عميلنا العزيز'} من محمصة ومطحنة كاتورا ☕\nاشتقنا لزيارتك! يسعدنا تقديم كود خصم خاص 10% على طلبك القادم: CATURRA10`
    : `مرحباً ${name || 'عميلنا العزيز'}، معك إدارة محمصة ومطحنة كاتورا ☕\nنتشرف بالتواصل معك!`;

  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
};

export const CustomersView = () => {
  const {
    customers,
    products,
    invoices,
    openInvoiceModal,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    confirmDialog,
    settleCustomerDebt,
    contactInfo,
    setActiveTab,
    setPosPreselectedCustomer
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all'); // 'all' | 'top' | 'low' | 'withDebt' | 'noDebt'
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [debtModalCustomer, setDebtModalCustomer] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);

  const [newCustData, setNewCustData] = useState({
    companyName: '',
    name: '',
    phone: '',
    email: '',
    city: 'القاهرة',
    address: '',
    accountType: 'b2b', // 'b2b' | 'b2c'
    businessType: 'specialty_cafe',
    monthlyVolume: '25 - 50 كجم شهرياً',
    preferredProducts: [],
    notes: '',
    debt: 0
  });

  const [editCustData, setEditCustData] = useState({
    companyName: '',
    contactName: '',
    name: '',
    phone: '',
    email: '',
    city: '',
    address: '',
    isB2B: false,
    businessType: 'specialty_cafe',
    monthlyVolume: '25 - 50 كجم شهرياً',
    preferredProducts: [],
    notes: ''
  });

  const handleOpenCustomer = (cust) => {
    setIsEditingCustomer(false);

    // Resolve customer's preferred products (could be IDs or legacy text names)
    let resolvedProductIds = [];
    if (Array.isArray(cust.preferredProducts) && cust.preferredProducts.length > 0) {
      resolvedProductIds = cust.preferredProducts.map(item => {
        if (typeof item === 'string') {
          const directMatch = (products || []).find(p => p.id === item);
          if (directMatch) return directMatch.id;
          const nameMatch = (products || []).find(p =>
            (p?.name && p.name.toLowerCase().includes(item.toLowerCase())) ||
            (p?.nameEn && p.nameEn.toLowerCase().includes(item.toLowerCase()))
          );
          return nameMatch ? nameMatch.id : item;
        }
        return item?.id || item;
      }).filter(Boolean);
    }

    // If preferred products empty, extract from legacy notes if present
    if (resolvedProductIds.length === 0 && cust.notes && cust.notes.includes('Products:')) {
      const match = cust.notes.match(/Products:\s*([^|\n]+)/i);
      if (match && match[1]) {
        const itemNames = match[1].split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
        itemNames.forEach(name => {
          const matchedProd = (products || []).find(p =>
            (p?.name && p.name.toLowerCase().includes(name)) ||
            (p?.nameEn && p.nameEn.toLowerCase().includes(name)) ||
            (name.includes('brazil') && p.id.includes('brazil')) ||
            (name.includes('colomb') && p.id.includes('colomb')) ||
            (name.includes('turkish') && p.id.includes('turkish')) ||
            (name.includes('hazelnut') && p.id.includes('hazelnut')) ||
            (name.includes('filter') && p.id.includes('filter')) ||
            (name.includes('paper') && p.id.includes('paper'))
          );
          if (matchedProd && !resolvedProductIds.includes(matchedProd.id)) {
            resolvedProductIds.push(matchedProd.id);
          }
        });
      }
    }

    // Clean notes from previous concatenated text strings
    let cleanNotes = (cust.notes || '');
    cleanNotes = cleanNotes.replace(/\|\s*Products:.*$/i, '').trim();
    cleanNotes = cleanNotes.replace(/Products:.*$/i, '').trim();
    if (cleanNotes.startsWith('B2B Client:') || cleanNotes.includes('B2B Client:')) {
      cleanNotes = '';
    }

    const updatedCustomer = {
      ...cust,
      preferredProducts: resolvedProductIds,
      notes: cleanNotes
    };

    setSelectedCustomer(updatedCustomer);

    // Auto-persist cleaned state if changed
    if (cust.notes !== cleanNotes || (cust.preferredProducts || []).length !== resolvedProductIds.length) {
      updateCustomer(cust.id, {
        preferredProducts: resolvedProductIds,
        notes: cleanNotes
      });
    }

    setEditCustData({
      companyName: cust.companyName || (cust.isB2B ? cust.name : ''),
      contactName: cust.contactName || (cust.isB2B ? '' : cust.name),
      name: cust.name || '',
      phone: cust.phone || '',
      email: cust.email || '',
      city: cust.city || 'القاهرة',
      address: cust.address || '',
      isB2B: Boolean(cust.isB2B),
      businessType: cust.businessType || 'specialty_cafe',
      monthlyVolume: cust.monthlyVolume || '25 - 50 كجم شهرياً',
      preferredProducts: resolvedProductIds,
      notes: cleanNotes
    });
  };

  const handleSaveEditSubmit = (e) => {
    e.preventDefault();
    if (!editCustData.phone) {
      alert('يرجى ملء رقم الموبايل');
      return;
    }
    const isB2B = Boolean(editCustData.isB2B);
    const company = (editCustData.companyName || '').trim();
    const contact = (editCustData.contactName || editCustData.name || '').trim();
    const computedName = isB2B
      ? (company ? (contact ? `${company} (${contact})` : company) : contact)
      : (contact || company || 'عميل');

    const updated = updateCustomer(activeCustomer.id, {
      name: computedName,
      companyName: company,
      contactName: contact,
      phone: editCustData.phone,
      email: editCustData.email,
      city: editCustData.city,
      address: editCustData.address,
      isB2B,
      businessType: editCustData.businessType,
      monthlyVolume: editCustData.monthlyVolume,
      preferredProducts: editCustData.preferredProducts || [],
      notes: editCustData.notes
    });

    setIsEditingCustomer(false);
    if (updated) {
      setSelectedCustomer(updated);
    }
  };

  const handleDeleteCustomer = async (cust) => {
    if (!cust) return;
    const custDisplayName = cust.companyName
      ? (cust.contactName && cust.companyName !== cust.contactName ? `${cust.companyName} (${cust.contactName})` : cust.companyName)
      : (cust.name || 'هذا العميل');
    const hasDebt = Number(cust.debt || 0) > 0;

    const ok = await confirmDialog({
      title: 'حذف العميل',
      message: `هل أنت متأكد من رغبتك في مسح العميل "${custDisplayName}" نهائياً من سجل العملاء؟`,
      details: hasDebt
        ? `⚠️ تنبيه هام: هذا العميل مسجل عليه مديونية حالية بقيمة ${Number(cust.debt).toLocaleString()} ج.م!`
        : 'سيتم مسح بيانات العميل بالكامل من قائمة وسجلات العملاء.',
      type: 'danger',
      confirmText: 'نعم، مسح العميل',
      cancelText: 'تراجع وإلغاء'
    });

    if (ok) {
      deleteCustomer(cust.id);
      if (selectedCustomer && (selectedCustomer.id === cust.id || String(selectedCustomer.id) === String(cust.id))) {
        setSelectedCustomer(null);
        setIsEditingCustomer(false);
      }
    }
  };

  // Calculate customer metrics dynamically from both profile and sales invoices
  const customersWithMetrics = useMemo(() => {
    return (customers || []).map(c => {
      const custInvoices = (invoices || []).filter(inv =>
        inv.status !== 'cancelled' &&
        inv.status !== 'returned' &&
        inv.trackingStatus !== 'cancelled' &&
        ((inv.customerId && (inv.customerId === c.id || String(inv.customerId) === String(c.id))) ||
        (c.phone && normalizePhone(inv.customerPhone) === normalizePhone(c.phone) && c.phone !== '') ||
        (c.name && normalizeArabic(inv.customerName) === normalizeArabic(c.name) && normalizeArabic(c.name) !== normalizeArabic('عميل صالة نقدي')))
      );

      const invDebt = custInvoices.reduce((sum, inv) => sum + (Number(inv.remainingDebt) || 0), 0);
      const invSpent = custInvoices.reduce((sum, inv) => sum + (Number(inv.finalTotal || inv.total) || 0), 0);
      const invOrders = custInvoices.length;

      // Effective metrics accurately reflect active non-cancelled invoices + any manual opening values
      const baseDebt = Number(c.openingDebt || 0);
      const baseSpent = Number(c.openingSpent || 0);
      const baseOrders = Number(c.openingOrders || 0);

      const effectiveDebt = Math.max(0, baseDebt + invDebt);
      const effectiveSpent = Math.max(0, baseSpent + invSpent);
      const effectiveOrders = Math.max(0, baseOrders + invOrders);

      return {
        ...c,
        invoices: custInvoices,
        debt: effectiveDebt,
        totalSpent: effectiveSpent,
        totalOrders: effectiveOrders
      };
    });
  }, [customers, invoices]);

  // Classification helpers for loyalty & engagement
  const isTopCustomer = (cust) => {
    return (cust.totalOrders >= 2 || cust.totalSpent >= 1000);
  };

  const isLowCustomer = (cust) => {
    return (cust.totalOrders <= 1 && cust.totalSpent <= 600);
  };

  // Top Engaged Customers (Most orders & spending)
  const topEngagedCustomers = useMemo(() => {
    return [...customersWithMetrics]
      .filter(c => (c.totalOrders > 0 || c.totalSpent > 0))
      .sort((a, b) => {
        if (b.totalOrders !== a.totalOrders) {
          return b.totalOrders - a.totalOrders;
        }
        return b.totalSpent - a.totalSpent;
      });
  }, [customersWithMetrics]);

  // Low Engagement / Inactive Customers (1 order or lowest spend)
  const lowEngagementCustomers = useMemo(() => {
    return [...customersWithMetrics]
      .filter(c => (c.totalOrders <= 1 && c.totalSpent <= 600))
      .sort((a, b) => {
        if (a.totalOrders !== b.totalOrders) {
          return b.totalOrders - a.totalOrders;
        }
        return a.totalSpent - b.totalSpent;
      });
  }, [customersWithMetrics]);

  // Filter Customers
  const filteredCustomers = useMemo(() => {
    return customersWithMetrics.filter(c => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.companyName && c.companyName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        c.phone.includes(searchQuery) ||
        (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()));

      let matchesCategory = true;
      if (filterCategory === 'top') {
        matchesCategory = isTopCustomer(c);
      } else if (filterCategory === 'low') {
        matchesCategory = isLowCustomer(c);
      } else if (filterCategory === 'withDebt') {
        matchesCategory = Number(c?.debt || 0) > 0;
      } else if (filterCategory === 'noDebt') {
        matchesCategory = Number(c?.debt || 0) === 0;
      }

      return matchesSearch && matchesCategory;
    });
  }, [customersWithMetrics, searchQuery, filterCategory]);

  // Handle Add Customer Submit
  const handleAddSubmit = (e) => {
    e.preventDefault();
    const isB2B = newCustData.accountType === 'b2b';
    const company = (newCustData.companyName || '').trim();
    const contact = (newCustData.name || '').trim();

    if (isB2B && !company && !contact) {
      alert('يرجى كتابة اسم المكان أو اسم المسؤول ورقم الموبايل');
      return;
    }
    if (!isB2B && !contact) {
      alert('يرجى كتابة اسم العميل ورقم الموبايل');
      return;
    }
    if (!newCustData.phone) {
      alert('يرجى كتابة رقم الموبايل');
      return;
    }

    const mainName = isB2B
      ? (company ? (contact ? `${company} (${contact})` : company) : contact)
      : (contact || company || 'عميل');

    const created = addCustomer({
      name: mainName,
      companyName: company,
      contactName: contact,
      phone: newCustData.phone,
      email: newCustData.email,
      city: newCustData.city,
      address: newCustData.address,
      preferredProducts: newCustData.preferredProducts || [],
      notes: newCustData.notes,
      debt: Number(newCustData.debt || 0),
      isB2B,
      businessType: newCustData.businessType,
      monthlyVolume: newCustData.monthlyVolume
    });

    setIsAddModalOpen(false);
    handleOpenCustomer(created);
    setNewCustData({
      companyName: '',
      name: '',
      phone: '',
      email: '',
      city: 'القاهرة',
      address: '',
      accountType: 'b2b',
      businessType: 'specialty_cafe',
      monthlyVolume: '25 - 50 كجم شهرياً',
      notes: '',
      debt: 0
    });
  };

  // Get Invoices for selected customer
  const activeCustomer = useMemo(() => {
    if (!selectedCustomer) return null;
    return customersWithMetrics.find(c => c.id === selectedCustomer.id) || selectedCustomer;
  }, [customersWithMetrics, selectedCustomer]);

  const customerInvoices = activeCustomer?.invoices || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      
      {/* 👑 CUSTOMER ENGAGEMENT & LOYALTY INSIGHTS SECTION 👑 */}
      <div
        className="card"
        style={{
          background: '#FFFDF9',
          border: '1.5px solid #EDD9BD',
          borderRadius: '16px',
          padding: '20px 22px',
          boxShadow: '0 8px 30px rgba(74, 50, 32, 0.08)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(251, 191, 36, 0.16)', border: '1px solid rgba(251, 191, 36, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Award size={20} color="#fbbf24" />
              </div>
              <h3 style={{ fontSize: '1.18rem', fontWeight: '800', color: '#f5ebe1', margin: 0 }}>
                تحليل نشاط وولاء العملاء (Customer Loyalty Insights)
              </h3>
            </div>
            <p style={{ fontSize: '0.82rem', color: '#a89080', margin: '4px 0 0 0' }}>
              تعرف على كبار العملاء الأكثر إقبالاً لتكريمهم، والعملاء الأقل تعاملاً لإعادة تنشيطهم بعروض واتساب
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ background: 'rgba(251, 191, 36, 0.15)', border: '1px solid rgba(251, 191, 36, 0.35)', color: '#fbbf24', padding: '4px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '800' }}>
              ⭐ كبار العملاء: {customersWithMetrics.filter(isTopCustomer).length}
            </span>
            <span style={{ background: 'rgba(148, 163, 184, 0.15)', border: '1px solid rgba(148, 163, 184, 0.3)', color: '#cbd5e1', padding: '4px 12px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '800' }}>
              💤 بحاجة لتنشيط: {customersWithMetrics.filter(isLowCustomer).length}
            </span>
          </div>
        </div>

        {/* 2 Comparison Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
          
          {/* TOP ENGAGED CUSTOMERS CARD */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(50, 24, 12, 0.9) 0%, rgba(32, 14, 8, 0.95) 100%)',
              border: '1.5px solid rgba(251, 191, 36, 0.35)',
              borderRadius: '14px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Crown size={18} color="#fbbf24" />
                <strong style={{ fontSize: '0.98rem', color: '#fef3c7' }}>العملاء الأكثر تعاملاً (VIP & Loyal)</strong>
              </div>
              <span style={{ fontSize: '0.74rem', color: '#fbbf24', background: 'rgba(251, 191, 36, 0.15)', padding: '3px 8px', borderRadius: '6px', fontWeight: '800' }}>
                أعلى ولاء وإنفاق
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {topEngagedCustomers.slice(0, 4).map((c, idx) => (
                <div
                  key={c.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    background: 'rgba(20, 8, 4, 0.8)',
                    border: '1px solid rgba(251, 191, 36, 0.2)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: idx === 0 ? '#C49A5C' : idx === 1 ? '#94a3b8' : idx === 2 ? '#96663B' : '#EDD9BD',
                        color: idx === 0 ? '#2C1810' : idx === 1 ? '#0f172a' : '#ffffff',
                        fontWeight: '800',
                        fontSize: '0.78rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {idx + 1}
                    </div>
                    <div>
                      <div style={{ fontWeight: '800', fontSize: '0.88rem', color: '#ffffff' }}>{c.name}</div>
                      <div style={{ fontSize: '0.74rem', color: '#a89080' }}>
                        <span style={{ color: '#e6b87d', fontWeight: '700' }}>{c.totalOrders} طلبات</span> • <strong style={{ color: '#4ade80' }}>{c.totalSpent.toLocaleString()} ج.م</strong>
                      </div>
                    </div>
                  </div>

                  {c.phone && (
                    <a
                      href={getWhatsAppUrl(c.phone, c.name, false)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`مراسلة شكر أو تقدير لـ ${c.name} على واتساب`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        background: '#25D366',
                        color: '#ffffff',
                        fontSize: '0.74rem',
                        fontWeight: '700',
                        textDecoration: 'none',
                        boxShadow: '0 2px 6px rgba(37, 211, 102, 0.35)'
                      }}
                    >
                      <WhatsAppIcon size={13} color="#ffffff" />
                      <span>واتساب</span>
                    </a>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => setFilterCategory('top')}
              style={{
                marginTop: '4px',
                padding: '6px',
                borderRadius: '8px',
                border: '1px dashed rgba(251, 191, 36, 0.4)',
                background: 'transparent',
                color: '#fbbf24',
                fontSize: '0.78rem',
                fontWeight: '700',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              عرض جميع الأكثر تعاملاً في الجدول ↓
            </button>
          </div>

          {/* LOW ENGAGEMENT CUSTOMERS CARD */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(38, 22, 14, 0.9) 0%, rgba(26, 12, 8, 0.95) 100%)',
              border: '1.5px solid rgba(212, 163, 115, 0.25)',
              borderRadius: '14px',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <TrendingDown size={18} color="#94a3b8" />
                <strong style={{ fontSize: '0.98rem', color: '#e2e8f0' }}>العملاء الأقل تعاملاً (فرص التنشيط)</strong>
              </div>
              <span style={{ fontSize: '0.74rem', color: '#cbd5e1', background: 'rgba(148, 163, 184, 0.15)', padding: '3px 8px', borderRadius: '6px', fontWeight: '800' }}>
                طلب واحد أو قليل
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {lowEngagementCustomers.slice(0, 4).map((c) => (
                <div
                  key={c.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    background: 'rgba(20, 8, 4, 0.8)',
                    border: '1px solid rgba(212, 163, 115, 0.18)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        width: '26px',
                        height: '26px',
                        borderRadius: '50%',
                        background: 'rgba(148, 163, 184, 0.2)',
                        color: '#94a3b8',
                        fontWeight: '800',
                        fontSize: '0.78rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {c.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontWeight: '800', fontSize: '0.88rem', color: '#f5ebe1' }}>{c.name}</div>
                      <div style={{ fontSize: '0.74rem', color: '#a89080' }}>
                        {c.totalOrders === 0 ? 'لم يطلب بعد' : 'طلب واحد فقط'} • <strong style={{ color: '#d4a373' }}>{c.totalSpent} ج.م</strong>
                      </div>
                    </div>
                  </div>

                  {c.phone && (
                    <a
                      href={getWhatsAppUrl(c.phone, c.name, true)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`إرسال كود خصم ترويجي لـ ${c.name} عبر واتساب لتشجيعه على الشراء`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '4px 10px',
                        borderRadius: '8px',
                        background: 'rgba(37, 211, 102, 0.16)',
                        border: '1px solid rgba(37, 211, 102, 0.45)',
                        color: '#25D366',
                        fontSize: '0.74rem',
                        fontWeight: '700',
                        textDecoration: 'none'
                      }}
                    >
                      <WhatsAppIcon size={13} color="#25D366" />
                      <span>إرسال كود خصم</span>
                    </a>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => setFilterCategory('low')}
              style={{
                marginTop: '4px',
                padding: '6px',
                borderRadius: '8px',
                border: '1px dashed rgba(212, 163, 115, 0.35)',
                background: 'transparent',
                color: '#d4a373',
                fontSize: '0.78rem',
                fontWeight: '700',
                cursor: 'pointer',
                textAlign: 'center'
              }}
            >
              عرض جميع الأقل تعاملاً في الجدول ↓
            </button>
          </div>

        </div>
      </div>

      {/* Top Search & Filter Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '280px' }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', right: '12px', top: '12px' }} />
            <input
              type="text"
              placeholder="بحث بالاسم، رقم الموبايل، الإيميل..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ paddingRight: '38px', height: '42px', borderRadius: '10px' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setFilterCategory('all')}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: filterCategory === 'all' ? '1.5px solid #96663B' : '1px solid #EDD9BD',
                background: filterCategory === 'all' ? 'linear-gradient(135deg, #96663B, #7A5230)' : '#FFF8EE',
                color: filterCategory === 'all' ? '#FFFDF9' : '#6B4A2E',
                fontWeight: '700',
                fontSize: '0.84rem',
                cursor: 'pointer'
              }}
            >
              جميع العملاء ({customersWithMetrics.length})
            </button>
            <button
              onClick={() => setFilterCategory('top')}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: filterCategory === 'top' ? '1.5px solid #C49A5C' : '1px solid #EDD9BD',
                background: filterCategory === 'top' ? 'linear-gradient(135deg, #C49A5C, #96663B)' : '#FFF8EE',
                color: filterCategory === 'top' ? '#FFFDF9' : '#6B4A2E',
                fontWeight: '700',
                fontSize: '0.84rem',
                cursor: 'pointer'
              }}
            >
              ⭐ الأكثر تعاملاً VIP ({customersWithMetrics.filter(isTopCustomer).length})
            </button>
            <button
              onClick={() => setFilterCategory('low')}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: filterCategory === 'low' ? '1.5px solid #94a3b8' : '1px solid #EDD9BD',
                background: filterCategory === 'low' ? 'linear-gradient(135deg, #64748b, #475569)' : '#FFF8EE',
                color: filterCategory === 'low' ? '#ffffff' : '#6B4A2E',
                fontWeight: '700',
                fontSize: '0.84rem',
                cursor: 'pointer'
              }}
            >
              💤 الأقل تعاملاً ({customersWithMetrics.filter(isLowCustomer).length})
            </button>
            <button
              onClick={() => setFilterCategory('withDebt')}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: filterCategory === 'withDebt' ? '1.5px solid #ef4444' : '1px solid #EDD9BD',
                background: filterCategory === 'withDebt' ? 'linear-gradient(135deg, #dc2626, #b91c1c)' : '#FFF8EE',
                color: filterCategory === 'withDebt' ? '#ffffff' : '#6B4A2E',
                fontWeight: '700',
                fontSize: '0.84rem',
                cursor: 'pointer'
              }}
            >
              عليهم مديونية ({(customersWithMetrics || []).filter(c => Number(c?.debt || 0) > 0).length})
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={() => exportCustomersToPdf(filteredCustomers, contactInfo)}
            className="btn btn-outline"
            style={{ 
              height: '42px', 
              gap: '8px', 
              borderColor: '#ef4444', 
              color: '#b91c1c', 
              background: '#fef2f2',
              fontWeight: '800'
            }}
            title="تصدير كشف العملاء المفلتر إلى ملف PDF جاهز للحفظ والطباعة"
          >
            <FileText size={18} color="#dc2626" />
            <span>تصدير PDF ({filteredCustomers.length})</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn btn-primary"
            style={{ height: '42px' }}
          >
            <UserPlus size={18} />
            <span>إضافة عميل جديد</span>
          </button>
        </div>
      </div>

      {/* Customers Table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>اسم العميل</th>
              <th>رقم الموبايل</th>
              <th>المدينة / المنطقة</th>
              <th>عدد الطلبات</th>
              <th>إجمالي المشتريات</th>
              <th>حالة المديونية</th>
              <th>الإجراء</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((cust) => {
              const isSelected = selectedCustomer?.id === cust.id;
              return (
                <tr
                  key={cust.id}
                  onClick={() => handleOpenCustomer(cust)}
                  style={{
                    cursor: 'pointer',
                    background: isSelected ? 'var(--mint-50)' : undefined
                  }}
                >
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          background: cust.isB2B ? 'rgba(217, 119, 6, 0.15)' : (Number(cust?.debt || 0) > 0 ? '#fee2e2' : 'var(--mint-100)'),
                          border: cust.isB2B ? '1.5px solid rgba(217, 119, 6, 0.35)' : undefined,
                          color: cust.isB2B ? '#b45309' : (Number(cust?.debt || 0) > 0 ? '#dc2626' : 'var(--mint-800)'),
                          fontWeight: '800',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.92rem',
                          flexShrink: 0
                        }}
                      >
                        {cust.isB2B ? '☕' : (cust.companyName || cust.name).charAt(0)}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <strong style={{ color: 'var(--text-main)', fontSize: '0.94rem' }}>
                            {cust.companyName || cust.name}
                          </strong>
                          {cust.isB2B && (
                            <span
                              style={{
                                background: '#fef3c7',
                                border: '1px solid #fde68a',
                                color: '#92400e',
                                fontSize: '0.68rem',
                                fontWeight: '800',
                                padding: '1px 6px',
                                borderRadius: '10px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '3px'
                              }}
                            >
                              <Building2 size={10} />
                              B2B
                            </span>
                          )}
                          {isTopCustomer(cust) && (
                            <span
                              style={{
                                background: 'rgba(251, 191, 36, 0.18)',
                                border: '1px solid rgba(251, 191, 36, 0.4)',
                                color: '#fbbf24',
                                fontSize: '0.68rem',
                                fontWeight: '800',
                                padding: '1px 6px',
                                borderRadius: '10px'
                              }}
                            >
                              ⭐ VIP
                            </span>
                          )}
                          {isLowCustomer(cust) && (
                            <span
                              style={{
                                background: 'rgba(148, 163, 184, 0.14)',
                                border: '1px solid rgba(148, 163, 184, 0.3)',
                                color: '#94a3b8',
                                fontSize: '0.68rem',
                                fontWeight: '600',
                                padding: '1px 6px',
                                borderRadius: '10px'
                              }}
                            >
                              محدود
                            </span>
                          )}
                        </div>
                        {cust.companyName && cust.contactName && cust.companyName !== cust.contactName && (
                          <div style={{ fontSize: '0.76rem', color: '#6F4E37', fontWeight: '700', marginTop: '1px' }}>
                            المسؤول: {cust.contactName}
                          </div>
                        )}
                        {cust.email && (
                          <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{cust.email}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                      <span dir="ltr" style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
                        {cust.phone || '-'}
                      </span>
                      {cust.phone && (
                        <a
                          href={getWhatsAppUrl(cust.phone, cust.name, isLowCustomer(cust))}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          title={`مراسلة ${cust.name} على واتساب`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '20px',
                            background: 'rgba(37, 211, 102, 0.16)',
                            border: '1px solid rgba(37, 211, 102, 0.45)',
                            color: '#25D366',
                            fontSize: '0.74rem',
                            fontWeight: '700',
                            textDecoration: 'none',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#25D366';
                            e.currentTarget.style.color = '#ffffff';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                            e.currentTarget.style.boxShadow = '0 3px 10px rgba(37, 211, 102, 0.4)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(37, 211, 102, 0.16)';
                            e.currentTarget.style.color = '#25D366';
                            e.currentTarget.style.transform = 'none';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <WhatsAppIcon size={13} />
                          <span>واتس</span>
                        </a>
                      )}
                    </div>
                  </td>
                  <td style={{ fontSize: '0.86rem' }}>
                    {cust.city || 'القاهرة'}
                  </td>
                  <td style={{ fontWeight: '700', color: 'var(--text-secondary)' }}>
                    {cust.totalOrders || 0} طلب
                  </td>
                  <td>
                    <strong style={{ color: '#4ade80' }}>
                      {(cust.totalSpent || 0).toLocaleString()} ج.م
                    </strong>
                  </td>
                  <td>
                    {Number(cust?.debt || 0) > 0 ? (
                      <span
                        className="badge badge-danger"
                        style={{ cursor: 'pointer', transition: 'transform 0.15s ease' }}
                        title="اضغط لتسجيل سداد المديونية"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDebtModalCustomer(cust);
                        }}
                      >
                        عليه مديونية: {cust.debt} ج.م ⚡
                      </span>
                    ) : (
                      <span className="badge badge-mint">
                        خالي من المديونية ✓
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenCustomer(cust);
                        }}
                        className="btn btn-outline"
                        style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                      >
                        عرض الملف والفواتير
                      </button>
                      {Number(cust?.debt || 0) > 0 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDebtModalCustomer(cust);
                          }}
                          className="btn btn-primary"
                          style={{ padding: '6px 10px', fontSize: '0.8rem', background: '#dc2626', borderColor: '#dc2626' }}
                          title="سداد مديونية العميل"
                        >
                          <DollarSign size={14} />
                          <span>سداد</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteCustomer(cust);
                        }}
                        className="btn btn-outline"
                        style={{
                          padding: '6px 10px',
                          fontSize: '0.8rem',
                          borderColor: '#fee2e2',
                          background: '#fff1f2',
                          color: '#dc2626',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                        title="مسح العميل"
                      >
                        <Trash2 size={14} />
                        <span>مسح</span>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredCustomers.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            لم يتم العثور على أي عملاء مطابقين للبحث.
          </div>
        )}
      </div>

      {/* CUSTOMER PROFILE MODAL (CENTERED POPUP OVERLAY) */}
      {activeCustomer && (
        <div
          className="modal-overlay"
          onClick={() => {
            setSelectedCustomer(null);
            setIsEditingCustomer(false);
          }}
          style={{ zIndex: 1050 }}
        >
          <div
            className="modal-content"
            style={{
              maxWidth: '600px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              maxHeight: '90vh',
              overflowY: 'auto',
              background: '#ffffff',
              borderRadius: '16px',
              border: '1.5px solid #E8D5C4',
              boxShadow: '0 20px 45px rgba(45, 24, 16, 0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1.5px solid #F0E6DD', paddingBottom: '14px' }}>
              <div style={{ flex: 1, paddingRight: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  {activeCustomer.isB2B ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#FEF3C7', color: '#92400E', border: '1px solid #FCD34D', padding: '3px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '800' }}>
                      <Building2 size={13} />
                      عميل جملة وشراكة (B2B)
                    </span>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0', padding: '3px 10px', borderRadius: '20px', fontSize: '0.78rem', fontWeight: '800' }}>
                      <Users size={13} />
                      عميل قطاعي / تجزئة (B2C)
                    </span>
                  )}
                  {activeCustomer.b2bRefCode && (
                    <span style={{ fontSize: '0.74rem', background: '#F5F0EB', color: '#6F4E37', border: '1px solid #E8D5C4', padding: '2px 8px', borderRadius: '8px', fontWeight: '700' }}>
                      #{activeCustomer.b2bRefCode}
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: '1.35rem', fontWeight: '900', color: '#2D1810', margin: 0, lineHeight: '1.3' }}>
                  {activeCustomer.companyName || activeCustomer.name}
                </h3>
                {activeCustomer.companyName && activeCustomer.contactName && activeCustomer.companyName !== activeCustomer.contactName && (
                  <div style={{ fontSize: '0.88rem', color: '#6F4E37', fontWeight: '700', marginTop: '3px' }}>
                    المسؤول: {activeCustomer.contactName}
                  </div>
                )}
                <div style={{ fontSize: '0.76rem', color: '#8C7A6B', marginTop: '3px' }}>
                  تاريخ التسجيل: {activeCustomer.createdAt || '2026-10-19'}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setIsEditingCustomer(prev => !prev)}
                  className="btn btn-outline"
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.82rem',
                    borderRadius: '8px',
                    borderColor: isEditingCustomer ? '#dc2626' : '#6F4E37',
                    color: isEditingCustomer ? '#dc2626' : '#6F4E37',
                    fontWeight: '700',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                  title={isEditingCustomer ? 'إلغاء التعديل والعودة للعرض' : 'تعديل بيانات العميل'}
                >
                  <Edit3 size={14} />
                  <span>{isEditingCustomer ? 'إلغاء التعديل' : 'تعديل البيانات'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteCustomer(activeCustomer)}
                  className="btn btn-outline"
                  style={{
                    padding: '6px 12px',
                    fontSize: '0.82rem',
                    borderRadius: '8px',
                    borderColor: '#fee2e2',
                    background: '#fff1f2',
                    color: '#dc2626',
                    fontWeight: '700',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    cursor: 'pointer'
                  }}
                  title="مسح العميل نهائياً"
                >
                  <Trash2 size={14} />
                  <span>مسح العميل</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedCustomer(null);
                    setIsEditingCustomer(false);
                  }}
                  className="btn-icon"
                  style={{ width: '32px', height: '32px', borderRadius: '8px' }}
                  title="إغلاق"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* If in EDIT MODE */}
            {isEditingCustomer ? (
              <form onSubmit={handleSaveEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Account Type Selector (B2B vs B2C) */}
                <div style={{ background: '#FAF7F2', border: '1.5px solid #E8D5C4', borderRadius: '12px', padding: '12px' }}>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: '#2D1810', marginBottom: '8px' }}>
                    نوع التعامل المالي والتجاري *
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => setEditCustData(prev => ({ ...prev, isB2B: true }))}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: editCustData.isB2B ? '2px solid #8B5E34' : '1.5px solid #D6C7B8',
                        background: editCustData.isB2B ? '#FEF3C7' : '#ffffff',
                        color: editCustData.isB2B ? '#92400E' : '#6B7280',
                        fontWeight: '800',
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Building2 size={16} />
                      <span>B2B (جملة وشراكات)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditCustData(prev => ({ ...prev, isB2B: false }))}
                      style={{
                        padding: '10px 14px',
                        borderRadius: '10px',
                        border: !editCustData.isB2B ? '2px solid #059669' : '1.5px solid #D6C7B8',
                        background: !editCustData.isB2B ? '#ECFDF5' : '#ffffff',
                        color: !editCustData.isB2B ? '#065F46' : '#6B7280',
                        fontWeight: '800',
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Users size={16} />
                      <span>B2C (قطاعي / أفراد)</span>
                    </button>
                  </div>
                </div>

                {/* Place Name */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: '800', color: '#2D1810' }}>
                    {editCustData.isB2B ? 'اسم المكان / المنشأة (كافيه، مطعم، شركة...) *' : 'اسم المكان / اللقب (اختياري)'}
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: Doba Bear أو كافيه أروما"
                    value={editCustData.companyName}
                    onChange={e => setEditCustData({ ...editCustData, companyName: e.target.value })}
                    className="form-input"
                    style={{ background: '#FAF7F2', borderColor: '#D6C7B8' }}
                  />
                </div>

                {/* Contact Name */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: '800', color: '#2D1810' }}>
                    {editCustData.isB2B ? 'اسم المسؤول / المشتريات' : 'اسم العميل الكامل *'}
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: يوسف فكري"
                    value={editCustData.contactName}
                    onChange={e => setEditCustData({ ...editCustData, contactName: e.target.value })}
                    className="form-input"
                    style={{ background: '#FAF7F2', borderColor: '#D6C7B8' }}
                  />
                </div>

                {/* Phone & Email */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: '800', color: '#2D1810' }}>رقم الموبايل *</label>
                    <input
                      type="tel"
                      required
                      placeholder="01XXXXXXXXX"
                      value={editCustData.phone}
                      onChange={e => setEditCustData({ ...editCustData, phone: e.target.value })}
                      className="form-input"
                      style={{ background: '#FAF7F2', borderColor: '#D6C7B8' }}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: '800', color: '#2D1810' }}>البريد الإلكتروني</label>
                    <input
                      type="email"
                      placeholder="client@mail.com"
                      value={editCustData.email}
                      onChange={e => setEditCustData({ ...editCustData, email: e.target.value })}
                      className="form-input"
                      style={{ background: '#FAF7F2', borderColor: '#D6C7B8' }}
                    />
                  </div>
                </div>

                {/* City & Address */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: '800', color: '#2D1810' }}>المدينة / المحافظة</label>
                    <input
                      type="text"
                      placeholder="شبين الكوم، القاهرة..."
                      value={editCustData.city}
                      onChange={e => setEditCustData({ ...editCustData, city: e.target.value })}
                      className="form-input"
                      style={{ background: '#FAF7F2', borderColor: '#D6C7B8' }}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: '800', color: '#2D1810' }}>العنوان بالتفصيل والفرع</label>
                    <input
                      type="text"
                      placeholder="فرع شبين، شارع الجلاء..."
                      value={editCustData.address}
                      onChange={e => setEditCustData({ ...editCustData, address: e.target.value })}
                      className="form-input"
                      style={{ background: '#FAF7F2', borderColor: '#D6C7B8' }}
                    />
                  </div>
                </div>

                {/* 📦 Dedicated Products Selection 📦 */}
                <CustomerProductSelector
                  products={products}
                  selectedProductIds={editCustData.preferredProducts || []}
                  onChange={(ids) => setEditCustData(prev => ({ ...prev, preferredProducts: ids }))}
                />

                {/* Clean General Notes */}
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: '800', color: '#2D1810' }}>
                    ملاحظات إضافية عن العميل والتوريد (اختياري)
                  </label>
                  <textarea
                    rows="2"
                    placeholder="مواعيد التوريد، نوع الطحنة، شروط الدفع، أو أي تفاصيل خاصة..."
                    value={editCustData.notes}
                    onChange={e => setEditCustData({ ...editCustData, notes: e.target.value })}
                    className="form-textarea"
                    style={{ background: '#FAF7F2', borderColor: '#D6C7B8' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px', borderTop: '1px solid #F0E6DD', paddingTop: '14px' }}>
                  <button
                    type="button"
                    onClick={() => setIsEditingCustomer(false)}
                    className="btn btn-outline"
                    style={{ padding: '8px 18px', borderRadius: '8px' }}
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{
                      padding: '8px 22px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #059669, #047857)',
                      borderColor: '#059669',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Save size={16} />
                    <span>حفظ التعديلات</span>
                  </button>
                </div>
              </form>
            ) : (
              /* VIEW MODE */
              <>
                {/* Contact Details Card (Clean, Warm, High Contrast) */}
                <div
                  style={{
                    background: '#FFFDF9',
                    border: '1.5px solid #E8D5C4',
                    padding: '16px 18px',
                    borderRadius: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    boxShadow: '0 4px 15px rgba(69, 44, 26, 0.04)'
                  }}
                >
                  {/* Phone & WhatsApp */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', borderBottom: '1px solid #F4EAE0', paddingBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#F5ECE3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Phone size={16} color="#6F4E37" />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.74rem', color: '#8C7A6B', fontWeight: '700' }}>رقم الموبايل:</div>
                        <strong dir="ltr" style={{ color: '#1F2937', fontSize: '1rem', fontWeight: '800' }}>
                          {activeCustomer.phone || '-'}
                        </strong>
                      </div>
                    </div>

                    {activeCustomer.phone && (
                      <a
                        href={getWhatsAppUrl(activeCustomer.phone, activeCustomer.companyName || activeCustomer.name, isLowCustomer(activeCustomer))}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 14px',
                          borderRadius: '8px',
                          background: '#25D366',
                          color: '#ffffff',
                          fontSize: '0.82rem',
                          fontWeight: '800',
                          textDecoration: 'none',
                          boxShadow: '0 3px 10px rgba(37, 211, 102, 0.35)',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <WhatsAppIcon size={16} color="#ffffff" />
                        <span>مراسلة عبر واتساب</span>
                      </a>
                    )}
                  </div>

                  {/* Email & City/Address */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
                    {activeCustomer.email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Mail size={15} color="#8C7A6B" />
                        <div>
                          <div style={{ fontSize: '0.72rem', color: '#8C7A6B' }}>البريد:</div>
                          <span style={{ color: '#1F2937', fontWeight: '700', fontSize: '0.86rem' }}>{activeCustomer.email}</span>
                        </div>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={15} color="#8C7A6B" />
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#8C7A6B' }}>المنطقة / الفرع / العنوان:</div>
                        <span style={{ color: '#1F2937', fontWeight: '700', fontSize: '0.86rem' }}>
                          {activeCustomer.city || 'القاهرة'} {activeCustomer.address ? `• ${activeCustomer.address}` : ''}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Clean Notes Box */}
                  {activeCustomer.notes && !activeCustomer.notes.startsWith('B2B Client:') && !activeCustomer.notes.includes('Products:') && (
                    <div
                      style={{
                        background: '#FEF9EE',
                        border: '1.5px solid #FDE68A',
                        borderRadius: '10px',
                        padding: '10px 14px',
                        marginTop: '2px'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#92400E', fontWeight: '800', fontSize: '0.8rem', marginBottom: '4px' }}>
                        <span>📝</span>
                        <span>ملاحظات إضافية عن العميل والتوريد:</span>
                      </div>
                      <div style={{ color: '#451A03', fontSize: '0.86rem', lineHeight: '1.6', fontWeight: '600' }}>
                        {activeCustomer.notes}
                      </div>
                    </div>
                  )}
                </div>

                {/* 📦 Dedicated Contracted / Preferred Products Card in View Mode 📦 */}
                <CustomerProductSelector
                  products={products}
                  selectedProductIds={activeCustomer.preferredProducts || []}
                  readOnly={true}
                  onOpenEdit={() => setIsEditingCustomer(true)}
                />

                {/* Financial Status Card */}
                <div
                  style={{
                    background: Number(activeCustomer?.debt || 0) > 0 ? '#FFF5F5' : '#F0FDF4',
                    border: Number(activeCustomer?.debt || 0) > 0 ? '1.5px solid #FECACA' : '1.5px solid #BBF7D0',
                    borderRadius: '14px',
                    padding: '14px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: '800', color: Number(activeCustomer?.debt || 0) > 0 ? '#991B1B' : '#166534' }}>
                      {Number(activeCustomer?.debt || 0) > 0 ? '⚠️ المديونية المستحقة على العميل:' : 'حالة الحساب المالي:'}
                    </span>
                    <span style={{ fontSize: '1.3rem', fontWeight: '900', color: Number(activeCustomer?.debt || 0) > 0 ? '#DC2626' : '#16A34A' }}>
                      {Number(activeCustomer?.debt || 0) > 0 ? `${Number(activeCustomer?.debt || 0).toLocaleString()} ج.م` : 'خالي من الديون ✓'}
                    </span>
                  </div>

                  {Number(activeCustomer?.debt || 0) > 0 && (
                    <button
                      onClick={() => setDebtModalCustomer(activeCustomer)}
                      className="btn btn-primary"
                      style={{ width: '100%', marginTop: '4px', padding: '9px 14px', borderRadius: '10px', background: '#DC2626', borderColor: '#DC2626' }}
                    >
                      <DollarSign size={16} />
                      <span>تسجيل سداد مديونية (كامل أو جزء)</span>
                    </button>
                  )}
                </div>

                {/* Customer Invoices Section with NEW ORDER BUTTON */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Receipt size={18} color="#6F4E37" />
                      <h4 style={{ fontSize: '1rem', fontWeight: '900', color: '#2D1810', margin: 0 }}>
                        سجل فواتير وطلبات العميل ({customerInvoices.length})
                      </h4>
                    </div>

                    {/* Direct New Invoice / Order Button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (setPosPreselectedCustomer) {
                          setPosPreselectedCustomer(activeCustomer);
                        }
                        setSelectedCustomer(null);
                        setIsEditingCustomer(false);
                        if (setActiveTab) {
                          setActiveTab('pos');
                        }
                      }}
                      className="btn btn-primary"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 14px',
                        fontSize: '0.82rem',
                        fontWeight: '800',
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #8B5E34, #6F4E37)',
                        borderColor: '#6F4E37',
                        color: '#ffffff',
                        boxShadow: '0 2px 8px rgba(111, 78, 55, 0.25)'
                      }}
                      title="فتح الكاشير وبدء فاتورة جديدة لهذا العميل مباشرة"
                    >
                      <Plus size={15} />
                      <span>+ فاتورة / أوردر جديد</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '230px', overflowY: 'auto' }}>
                    {customerInvoices.length === 0 ? (
                      <div
                        style={{
                          fontSize: '0.86rem',
                          color: '#6B7280',
                          textAlign: 'center',
                          padding: '24px 16px',
                          background: '#FAF7F2',
                          borderRadius: '12px',
                          border: '1.5px dashed #D6C7B8'
                        }}
                      >
                        <Receipt size={24} color="#A89080" style={{ margin: '0 auto 8px auto', display: 'block' }} />
                        <div style={{ fontWeight: '700', color: '#4A3220', marginBottom: '4px' }}>لا توجد فواتير مسجلة بعد لهذا العميل</div>
                        <div style={{ fontSize: '0.78rem', color: '#8C7A6B', marginBottom: '10px' }}>
                          العميل مسجل في قاعدة البيانات بدون أي مديونية أو طلبات سابقة.
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (setPosPreselectedCustomer) {
                              setPosPreselectedCustomer(activeCustomer);
                            }
                            setSelectedCustomer(null);
                            setIsEditingCustomer(false);
                            if (setActiveTab) {
                              setActiveTab('pos');
                            }
                          }}
                          className="btn btn-outline"
                          style={{
                            fontSize: '0.8rem',
                            padding: '6px 14px',
                            fontWeight: '800',
                            borderColor: '#8B5E34',
                            color: '#8B5E34'
                          }}
                        >
                          + عمل أول فاتورة للعميل في الكاشير
                        </button>
                      </div>
                    ) : (
                      customerInvoices.map((inv) => (
                        <div
                          key={inv.id}
                          onClick={() => openInvoiceModal(inv)}
                          style={{
                            padding: '12px 14px',
                            borderRadius: '10px',
                            background: '#FFFDF9',
                            border: '1.5px solid #E8D5C4',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                            transition: 'all 150ms ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = '#8B5E34';
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(111, 78, 55, 0.12)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = '#E8D5C4';
                            e.currentTarget.style.boxShadow = 'none';
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: '800', fontSize: '0.9rem', color: '#6F4E37', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{inv.invoiceNumber}</span>
                              {inv.isB2B && (
                                <span style={{ fontSize: '0.68rem', background: '#FEF3C7', color: '#92400E', padding: '1px 5px', borderRadius: '6px', fontWeight: '800' }}>
                                  B2B
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.76rem', color: '#6B7280', marginTop: '2px' }}>
                              {inv.date} | {(inv.items || []).length} أصناف
                            </div>
                          </div>

                          <div style={{ textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div>
                              <div style={{ fontWeight: '900', fontSize: '0.96rem', color: '#059669' }}>
                                {(Number(inv.total) || 0).toLocaleString()} ج.م
                              </div>
                              <span
                                className={`badge ${inv.status === 'paid' ? 'badge-mint' : 'badge-danger'}`}
                                style={{ fontSize: '0.7rem', padding: '1px 7px', fontWeight: '700' }}
                              >
                                {inv.status === 'paid' ? 'مدفوعة ✓' : 'آجلة ⚡'}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openInvoiceModal(inv);
                              }}
                              className="btn btn-outline"
                              style={{ padding: '5px 10px', fontSize: '0.76rem', borderRadius: '6px' }}
                              title="معاينة وطباعة الفاتورة"
                            >
                              <Eye size={13} />
                              <span>معاينة</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Footer Buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', borderTop: '1px solid #F0E6DD', paddingTop: '14px' }}>
                  <button
                    type="button"
                    onClick={() => setIsEditingCustomer(true)}
                    className="btn btn-outline"
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontWeight: '700',
                      color: '#6F4E37',
                      borderColor: '#D6C7B8'
                    }}
                  >
                    <Edit3 size={15} />
                    <span>تعديل بيانات العميل</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCustomer(null);
                      setIsEditingCustomer(false);
                    }}
                    className="btn btn-outline"
                    style={{ padding: '8px 22px', borderRadius: '8px' }}
                  >
                    إغلاق النافذة
                  </button>
                </div>
              </>
            )}

          </div>
        </div>
      )}

      {/* ADD CUSTOMER MODAL */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div
            className="modal-content"
            style={{
              maxWidth: '540px',
              padding: '24px',
              borderRadius: '16px',
              background: '#ffffff',
              border: '1.5px solid #E8D5C4',
              boxShadow: '0 20px 45px rgba(45, 24, 16, 0.2)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1.5px solid #F0E6DD', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#2D1810', margin: 0 }}>
                  إضافة عميل جديد لدليل كاتورا
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#8C7A6B', margin: '3px 0 0 0' }}>
                  تسجيل بيانات المنشأة أو العميل وربطها بنظام التوريد
                </p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="btn-icon" style={{ width: '32px', height: '32px', borderRadius: '8px' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Account Type Selector (B2B vs B2C) */}
              <div style={{ background: '#FAF7F2', border: '1.5px solid #E8D5C4', borderRadius: '12px', padding: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: '#2D1810', marginBottom: '8px' }}>
                  نوع التعامل *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setNewCustData(prev => ({ ...prev, accountType: 'b2b' }))}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: newCustData.accountType === 'b2b' ? '2px solid #8B5E34' : '1.5px solid #D6C7B8',
                      background: newCustData.accountType === 'b2b' ? '#FEF3C7' : '#ffffff',
                      color: newCustData.accountType === 'b2b' ? '#92400E' : '#6B7280',
                      fontWeight: '800',
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Building2 size={16} />
                    <span>B2B (جملة وشراكات)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewCustData(prev => ({ ...prev, accountType: 'b2c' }))}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '10px',
                      border: newCustData.accountType === 'b2c' ? '2px solid #059669' : '1.5px solid #D6C7B8',
                      background: newCustData.accountType === 'b2c' ? '#ECFDF5' : '#ffffff',
                      color: newCustData.accountType === 'b2c' ? '#065F46' : '#6B7280',
                      fontWeight: '800',
                      fontSize: '0.88rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <Users size={16} />
                    <span>B2C (قطاعي / أفراد)</span>
                  </button>
                </div>
              </div>

              {/* Place Name (Always Above Contact Name as Requested) */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: '800', color: '#2D1810' }}>
                  {newCustData.accountType === 'b2b' ? 'اسم المكان / المنشأة (كافيه، مطعم، شركة...) *' : 'اسم المكان / اللقب (اختياري)'}
                </label>
                <input
                  type="text"
                  placeholder="مثال: Doba Bear أو كافيه أروما"
                  value={newCustData.companyName}
                  onChange={e => setNewCustData({ ...newCustData, companyName: e.target.value })}
                  className="form-input"
                  style={{ background: '#FAF7F2', borderColor: '#D6C7B8' }}
                />
              </div>

              {/* Contact Person Name */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: '800', color: '#2D1810' }}>
                  {newCustData.accountType === 'b2b' ? 'اسم المسؤول / المشتريات' : 'الاسم الكامل *'}
                </label>
                <input
                  type="text"
                  placeholder="مثال: يوسف فكري أو يوسف النجار"
                  value={newCustData.name}
                  onChange={e => setNewCustData({ ...newCustData, name: e.target.value })}
                  className="form-input"
                  style={{ background: '#FAF7F2', borderColor: '#D6C7B8' }}
                />
              </div>

              {/* Phone & Email */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: '800', color: '#2D1810' }}>رقم الموبايل *</label>
                  <input
                    type="tel"
                    required
                    placeholder="01XXXXXXXXX"
                    value={newCustData.phone}
                    onChange={e => setNewCustData({ ...newCustData, phone: e.target.value })}
                    className="form-input"
                    style={{ background: '#FAF7F2', borderColor: '#D6C7B8' }}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: '800', color: '#2D1810' }}>البريد الإلكتروني</label>
                  <input
                    type="email"
                    placeholder="client@mail.com"
                    value={newCustData.email}
                    onChange={e => setNewCustData({ ...newCustData, email: e.target.value })}
                    className="form-input"
                    style={{ background: '#FAF7F2', borderColor: '#D6C7B8' }}
                  />
                </div>
              </div>

              {/* City & Address */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: '800', color: '#2D1810' }}>المدينة / المحافظة</label>
                  <input
                    type="text"
                    placeholder="شبين الكوم، القاهرة..."
                    value={newCustData.city}
                    onChange={e => setNewCustData({ ...newCustData, city: e.target.value })}
                    className="form-input"
                    style={{ background: '#FAF7F2', borderColor: '#D6C7B8' }}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: '800', color: '#2D1810' }}>العنوان بالتفصيل والفرع</label>
                  <input
                    type="text"
                    placeholder="فرع شبين، شارع الجلاء..."
                    value={newCustData.address}
                    onChange={e => setNewCustData({ ...newCustData, address: e.target.value })}
                    className="form-input"
                    style={{ background: '#FAF7F2', borderColor: '#D6C7B8' }}
                  />
                </div>
              </div>

              {/* B2B Extra Details (Volume & Business Type) */}
              {newCustData.accountType === 'b2b' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: '800', color: '#2D1810' }}>الحجم الشهري المتوقع</label>
                    <select
                      value={newCustData.monthlyVolume}
                      onChange={e => setNewCustData({ ...newCustData, monthlyVolume: e.target.value })}
                      className="form-input"
                      style={{ background: '#FAF7F2', borderColor: '#D6C7B8' }}
                    >
                      <option value="10 - 25 كجم شهرياً">10 - 25 كجم شهرياً</option>
                      <option value="25 - 50 كجم شهرياً">25 - 50 كجم شهرياً</option>
                      <option value="30 - 50 كجم شهرياً">30 - 50 كجم شهرياً</option>
                      <option value="50 - 100 كجم شهرياً">50 - 100 كجم شهرياً</option>
                      <option value="+100 كجم شهرياً">+100 كجم شهرياً</option>
                    </select>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: '800', color: '#2D1810' }}>نوع النشاط</label>
                    <select
                      value={newCustData.businessType}
                      onChange={e => setNewCustData({ ...newCustData, businessType: e.target.value })}
                      className="form-input"
                      style={{ background: '#FAF7F2', borderColor: '#D6C7B8' }}
                    >
                      <option value="specialty_cafe">كافيه مختص (Specialty Cafe)</option>
                      <option value="restaurant">مطعم وكافيه</option>
                      <option value="hotel">فندق ومنتجع</option>
                      <option value="corporate">شركة / مكتب</option>
                      <option value="roaster">محمصة / إعادة تعبئة</option>
                    </select>
                  </div>
                </div>
              )}

              {/* 📦 Dedicated Products Selection 📦 */}
              <CustomerProductSelector
                products={products}
                selectedProductIds={newCustData.preferredProducts || []}
                onChange={(ids) => setNewCustData(prev => ({ ...prev, preferredProducts: ids }))}
              />

              {/* Clean General Notes */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: '800', color: '#2D1810' }}>
                  ملاحظات إضافية عن العميل والتوريد (اختياري)
                </label>
                <textarea
                  rows="2"
                  placeholder="مواعيد التوريد، نوع الطحنة، شروط الدفع، أو أي تفاصيل خاصة..."
                  value={newCustData.notes}
                  onChange={e => setNewCustData({ ...newCustData, notes: e.target.value })}
                  className="form-textarea"
                  style={{ background: '#FAF7F2', borderColor: '#D6C7B8' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px', borderTop: '1px solid #F0E6DD', paddingTop: '14px' }}>
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-outline" style={{ borderRadius: '8px' }}>
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #8B5E34, #6F4E37)',
                    borderColor: '#6F4E37'
                  }}
                >
                  حفظ العميل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Debt Settlement Modal */}
      {Boolean(debtModalCustomer) && (
        <DebtSettlementModal
          isOpen={!!debtModalCustomer}
          onClose={() => setDebtModalCustomer(null)}
          customer={debtModalCustomer}
          onSuccess={(paidAmt, meta) => {
            settleCustomerDebt(
              debtModalCustomer.id,
              paidAmt,
              meta?.paymentMethod || 'cash',
              meta?.notes || '',
              null,
              meta?.targetAccountId
            );
            if (selectedCustomer && selectedCustomer.id === debtModalCustomer.id) {
              setSelectedCustomer(prev => ({
                ...prev,
                debt: Math.max(0, (Number(prev?.debt) || 0) - paidAmt)
              }));
            }
          }}
        />
      )}

    </div>
  );
};
