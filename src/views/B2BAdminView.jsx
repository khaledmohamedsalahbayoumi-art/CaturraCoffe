import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Handshake,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Building2,
  Coffee,
  CheckCircle2,
  Clock,
  Sparkles,
  FileText,
  Printer,
  Download,
  Trash2,
  Copy,
  ExternalLink,
  ChevronRight,
  MessageSquare,
  BadgeCheck,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Tag,
  X,
  Layers,
  Send,
  Repeat,
  Receipt,
  RotateCcw,
  DollarSign,
  Eye
} from 'lucide-react';
import { normalizeArabic, normalizePhone } from '../utils/numberEnforcer';
import { B2BStandingOrdersTab } from '../components/b2b/B2BStandingOrdersTab';
import { B2BInvoicesTab } from '../components/b2b/B2BInvoicesTab';
import { B2BCustomerAutocomplete } from '../components/b2b/B2BCustomerAutocomplete';
import { CustomerProductSelector } from '../components/CustomerProductSelector';
import { exportB2BReportPdf } from '../utils/exportUtils';

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

export const B2BAdminView = () => {
  const {
    b2bRequests = [],
    addB2BRequest,
    updateB2BStatus,
    updateB2BLead,
    addB2BInternalNote,
    deleteB2BRequest,
    convertB2BToCustomer,
    markB2BAsRead,
    products = [],
    customers = [],
    currentUser,
    contactInfo,
    b2bStandingOrders = [],
    dueStandingOrdersCount = 0,
    openInvoiceModal,
    invoices = [],
    language,
    isRtl,
    confirmDialog
  } = useApp();

  const [b2bSubTab, setB2bSubTab] = useState('standing'); // 'standing' | 'invoices' | 'leads'
  const [activeStage, setActiveStage] = useState('all'); // 'all' | 'new' | 'contacted' | 'cupping' | 'contracted' | 'cancelled'
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [volumeFilter, setVolumeFilter] = useState('all');
  const [businessTypeFilter, setBusinessTypeFilter] = useState('all');

  // Modals state
  const [selectedLeadForNotes, setSelectedLeadForNotes] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedLeadForQuote, setSelectedLeadForQuote] = useState(null);
  const [newNoteInput, setNewNoteInput] = useState('');
  const [copiedRef, setCopiedRef] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // New Lead Form State
  const [newLeadForm, setNewLeadForm] = useState({
    companyName: '',
    contactName: '',
    phone: '',
    email: '',
    city: 'القاهرة',
    businessType: 'كافيه مختص (Specialty)',
    monthlyVolume: '25 - 50 كجم شهرياً',
    privateLabel: false,
    monthlyContract: true,
    extractionSupport: true,
    preferredProducts: [],
    quotedAmount: '',
    notes: ''
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  const handleCopy = (text, ref) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedRef(ref);
      showToast(language === 'en' ? `Copied code: ${ref}` : `تم نسخ الكود: ${ref}`);
      setTimeout(() => setCopiedRef(''), 2500);
    }
  };

  // 👁️ Open Invoice Modal for B2B Lead (finds existing invoice or builds Proforma B2B Order invoice)
  const handlePreviewLeadInvoice = (lead) => {
    // 1. Check if a real invoice already exists for this lead
    const existingInv = (invoices || []).find(inv =>
      (inv.b2bRefCode && inv.b2bRefCode === lead.refCode) ||
      (lead.convertedCustomerId && (inv.customerId === lead.convertedCustomerId || String(inv.customerId) === String(lead.convertedCustomerId))) ||
      (lead.phone && normalizePhone(inv.customerPhone) === normalizePhone(lead.phone)) ||
      (inv.customerName && normalizeArabic(inv.customerName) === normalizeArabic(lead.companyName))
    );

    if (existingInv) {
      openInvoiceModal(existingInv);
      return;
    }

    // 2. Otherwise generate official Proforma B2B Order Invoice from the lead's partnership request
    const volumeKg = Number(String(lead.monthlyVolume || '25').split('-')[0]) || 25;
    const totalQuote = Number(lead.quotedAmount || (volumeKg * 550));
    const pricePerKg = Math.round(totalQuote / volumeKg);

    const leadInvoice = {
      id: `b2b-lead-inv-${lead.id}`,
      invoiceNumber: `ORD-${lead.refCode || lead.id.slice(-4)}`,
      date: lead.createdAt ? String(lead.createdAt).split(' ')[0] : new Date().toISOString().split('T')[0],
      customerId: lead.convertedCustomerId || null,
      customerName: lead.companyName,
      customerPhone: lead.phone,
      customerAddress: `${lead.city || 'مصر'} • نشاط: ${businessTypeLabels[lead.businessType]?.[language] || lead.businessType || 'كافيه'}`,
      source: 'b2b',
      isB2B: true,
      b2bRefCode: lead.refCode,
      items: Array.isArray(lead.items) && lead.items.length > 0
        ? lead.items
        : [
            {
              productId: 'prod-b2b-volume',
              name: `توريد بن جملة كافيهات (${volumeLabels[lead.monthlyVolume]?.[language] || lead.monthlyVolume || 'شهري'} كجم)${lead.privateLabel ? ' • براند خاص (Private Label)' : ''}`,
              qty: volumeKg,
              unitPrice: pricePerKg,
              total: totalQuote,
              unitType: 'weight',
              weightGram: 1000
            }
          ],
      subtotal: totalQuote,
      discount: 0,
      total: totalQuote,
      paidAmount: lead.status === 'contracted' ? totalQuote : 0,
      remainingDebt: lead.status === 'contracted' ? 0 : totalQuote,
      paymentMethod: lead.monthlyContract ? 'deferred' : 'cash',
      status: lead.status === 'contracted' ? 'paid' : 'pending',
      trackingStatus: lead.status === 'contracted' ? 'delivered' : 'processing',
      cashierName: 'مسؤول مبيعات وشراكات B2B',
      orderNotes: `طلب شراكة وتوريد كود #${lead.refCode} | ${lead.notes || 'طلب توريد قهوة مختصة دوري لكافيه'} ${lead.extractionSupport ? '• يشمل دعم وضبط استخلاص الباريستا' : ''}`
    };

    openInvoiceModal(leadInvoice);
  };

  const businessTypeLabels = {
    specialty_cafe: { ar: 'كافيه مختص (Specialty)', en: 'Specialty Coffee Shop' },
    commercial_cafe: { ar: 'كافيه تجاري / كورنر', en: 'Commercial Café' },
    restaurant_hotel: { ar: 'مطعم / فندق وضيافة', en: 'Hotel / Restaurant' },
    office_corporate: { ar: 'شركة / مقر أعمال', en: 'Corporate Office' },
    new_brand: { ar: 'براند قهوة (Private Label)', en: 'Private Label Brand' },
    other: { ar: 'نشاط تجاري آخر', en: 'Other Business' }
  };

  const volumeLabels = {
    '10-25': { ar: '10 - 25 كجم/شهر', en: '10 - 25 kg/mo', kgMin: 15 },
    '25-50': { ar: '25 - 50 كجم/شهر', en: '25 - 50 kg/mo', kgMin: 35 },
    '50-100': { ar: '50 - 100 كجم/شهر', en: '50 - 100 kg/mo', kgMin: 75 },
    '100+': { ar: 'أكثر من 100 كجم/شهر', en: '100+ kg/mo', kgMin: 120 },
    '10 - 25 كجم شهرياً': { ar: '10 - 25 كجم/شهر', en: '10 - 25 kg/mo', kgMin: 15 },
    '25 - 50 كجم شهرياً': { ar: '25 - 50 كجم/شهر', en: '25 - 50 kg/mo', kgMin: 35 },
    '50 - 100 كجم شهرياً': { ar: '50 - 100 كجم/شهر', en: '50 - 100 kg/mo', kgMin: 75 },
    'أكثر من 100 كجم شهرياً': { ar: 'أكثر من 100 كجم/شهر', en: '100+ kg/mo', kgMin: 120 }
  };

  const getEstimatedKg = (volStr) => {
    if (!volStr) return 25;
    if (volumeLabels[volStr]?.kgMin) return volumeLabels[volStr].kgMin;
    const match = String(volStr).match(/\d+/);
    return match ? parseInt(match[0], 10) : 25;
  };

  const statusConfig = {
    new: {
      label: language === 'en' ? 'New Lead' : 'جديد (لم يتم الرد)',
      color: '#fbbf24',
      bg: 'rgba(251, 191, 36, 0.15)',
      border: 'rgba(251, 191, 36, 0.4)',
      badge: '🟡'
    },
    contacted: {
      label: language === 'en' ? 'Quoted / Contacted' : 'تم التواصل وعرض السعر',
      color: '#38bdf8',
      bg: 'rgba(56, 189, 248, 0.15)',
      border: 'rgba(56, 189, 248, 0.4)',
      badge: '🔵'
    },
    cupping: {
      label: language === 'en' ? 'Cupping & Dial-in' : 'جلسة تذوق وضبط استخلاص',
      color: '#c084fc',
      bg: 'rgba(192, 132, 252, 0.15)',
      border: 'rgba(192, 132, 252, 0.4)',
      badge: '🟣'
    },
    contracted: {
      label: language === 'en' ? 'Contracted Partner' : 'شريك معتمد (تم التعاقد)',
      color: '#34d399',
      bg: 'rgba(52, 211, 153, 0.18)',
      border: 'rgba(52, 211, 153, 0.5)',
      badge: '🟢'
    },
    cancelled: {
      label: language === 'en' ? 'Closed / Lost' : 'ملغي / غير مهتم',
      color: '#94a3b8',
      bg: 'rgba(148, 163, 184, 0.15)',
      border: 'rgba(148, 163, 184, 0.3)',
      badge: '⚪'
    }
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const total = b2bRequests.length;
    const newCount = b2bRequests.filter(l => l.status === 'new').length;
    const contactedCount = b2bRequests.filter(l => l.status === 'contacted').length;
    const cuppingCount = b2bRequests.filter(l => l.status === 'cupping').length;
    const contractedCount = b2bRequests.filter(l => l.status === 'contracted').length;

    // Approximate total monthly coffee volume demand in KG
    const totalEstKg = b2bRequests.reduce((sum, l) => {
      const vol = getEstimatedKg(l.monthlyVolume);
      return sum + (l.status !== 'cancelled' ? vol : 0);
    }, 0);

    // Approximate total contracted monthly revenue
    const totalContractedRevenue = b2bRequests
      .filter(l => l.status === 'contracted')
      .reduce((sum, l) => sum + (Number(l.quotedAmount) || (getEstimatedKg(l.monthlyVolume) * 550)), 0);

    return {
      total,
      newCount,
      contactedCount,
      cuppingCount,
      contractedCount,
      totalEstKg,
      totalContractedRevenue
    };
  }, [b2bRequests]);

  // Filtering
  const filteredLeads = useMemo(() => {
    return b2bRequests.filter(lead => {
      // Stage filter
      if (activeStage !== 'all' && lead.status !== activeStage) return false;

      // City filter
      if (cityFilter !== 'all' && normalizeArabic(lead.city || '') !== normalizeArabic(cityFilter)) return false;

      // Volume filter
      if (volumeFilter !== 'all') {
        const leadVol = String(lead.monthlyVolume || '').toLowerCase();
        const fVol = String(volumeFilter).toLowerCase();
        if (leadVol !== fVol && !leadVol.includes(fVol)) return false;
      }

      // Business type filter
      if (businessTypeFilter !== 'all') {
        const leadType = String(lead.businessType || '').toLowerCase();
        const fType = String(businessTypeFilter).toLowerCase();
        const localizedType = String(businessTypeLabels[lead.businessType]?.[language] || '').toLowerCase();
        if (leadType !== fType && !leadType.includes(fType) && !localizedType.includes(fType)) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const normQuery = normalizeArabic(query);
        const nameMatch = normalizeArabic(lead.companyName || '').includes(normQuery);
        const contactMatch = normalizeArabic(lead.contactName || '').includes(normQuery);
        const phoneMatch = normalizePhone(lead.phone || '').includes(normalizePhone(query));
        const refMatch = (lead.refCode || '').toLowerCase().includes(query);
        const notesMatch = normalizeArabic(lead.notes || '').includes(normQuery);
        return nameMatch || contactMatch || phoneMatch || refMatch || notesMatch;
      }

      return true;
    });
  }, [b2bRequests, activeStage, cityFilter, volumeFilter, businessTypeFilter, searchQuery]);

  // WhatsApp Click-to-Chat builder
  const buildWhatsAppChatUrl = (lead) => {
    if (!lead || !lead.phone) return '#';
    let clean = lead.phone.toString().replace(/[^0-9]/g, '');
    if (!clean) return '#';

    if (clean.startsWith('002')) clean = clean.slice(2);
    else if (clean.startsWith('020') && clean.length >= 12) clean = clean.slice(1);
    else if (clean.startsWith('01') && clean.length === 11) clean = '20' + clean.slice(1);
    else if (!clean.startsWith('20') && clean.length === 10 && clean.startsWith('1')) clean = '20' + clean;

    const greeting = language === 'ar'
      ? `أهلاً بحضرتك أ/ ${lead.contactName || lead.companyName}، معك إدارة محمصة ومطحنة كاتورا للقهوة المختصة ☕\nبخصوص طلب الشراكة والتوريد الخاص بـ "${lead.companyName}" (كود المتابعة: ${lead.refCode}).\nيسعدنا جداً التعاون معكم وتقديم أفضل خيارات البن المحمص طازجاً، هل يناسب حضرتك مناقشة قائمة الأسعار المخصصة وجدولة جلسة تذوق؟`
      : `Hello ${lead.contactName || lead.companyName}, this is Caturra Coffee Roastery ☕.\nRegarding your wholesale & partnership inquiry for "${lead.companyName}" (Ref: ${lead.refCode}).\nWe'd love to discuss our fresh roasted wholesale profiles and schedule a cupping session!`;

    return `https://wa.me/${clean}?text=${encodeURIComponent(greeting)}`;
  };

  const handleConvertLead = (leadId) => {
    const targetLead = b2bRequests.find(l => l.id === leadId);
    if (!targetLead) return;

    const customer = convertB2BToCustomer(leadId);
    if (customer) {
      showToast(language === 'en' ? `Successfully converted to Wholesale Customer: ${customer.name}!` : `تم تحويل "${targetLead.companyName}" بنجاح إلى عميل جملة معتمد بالـ ERP! 🌟`);
    }
  };

  const handleAddNoteSubmit = (e) => {
    e.preventDefault();
    if (!newNoteInput.trim() || !selectedLeadForNotes) return;
    addB2BInternalNote(selectedLeadForNotes.id, newNoteInput.trim());
    setNewNoteInput('');
    // refresh selected lead reference
    const updated = b2bRequests.find(l => l.id === selectedLeadForNotes.id);
    if (updated) setSelectedLeadForNotes(updated);
    showToast(language === 'en' ? 'Roastery note added successfully' : 'تمت إضافة ملاحظة المتابعة بنجاح ✓');
  };

  const handleCreateNewLead = (e) => {
    e.preventDefault();
    if (!newLeadForm.companyName.trim() || !newLeadForm.phone.trim()) {
      alert(language === 'en' ? 'Company name and phone are required.' : 'يرجى كتابة اسم المنشأة ورقم الهاتف أولاً.');
      return;
    }

    const created = addB2BRequest({
      ...newLeadForm,
      refCode: `CAT-B2B-${Math.floor(1000 + Math.random() * 9000)}`
    });

    setIsAddModalOpen(false);
    setNewLeadForm({
      companyName: '',
      contactName: '',
      phone: '',
      email: '',
      city: 'القاهرة',
      businessType: 'كافيه مختص (Specialty)',
      monthlyVolume: '25 - 50 كجم شهرياً',
      privateLabel: false,
      monthlyContract: true,
      extractionSupport: true,
      preferredProducts: [],
      quotedAmount: '',
      notes: ''
    });

    showToast(language === 'en' ? `Lead created #${created.refCode}` : `تم تسجيل الشريك الجديد #${created.refCode} بنجاح 🎉`);
  };

  const handleExportPdf = () => {
    const b2bInvoices = invoices.filter(inv => {
      const isDirectB2B = inv.isB2B || inv.source === 'b2b' || inv.standingOrderId;
      const isCafeCustomer = (inv.customerName || '').includes('كافيه') || (inv.customerName || '').includes('روستري') || (inv.customerName || '').includes('فندق');
      return isDirectB2B || isCafeCustomer;
    });

    const success = exportB2BReportPdf({
      subTab: b2bSubTab,
      leads: filteredLeads,
      standingOrders: b2bStandingOrders,
      invoices: b2bInvoices,
      contactInfo,
      language,
      autoPrint: true,
      onNotification: (msg) => showToast(msg)
    });

    if (success) {
      showToast(language === 'en' ? 'PDF report ready for saving/printing 📄' : 'تم تجهيز كشف البيانات بصيغة PDF للحفظ والطباعة 📄');
    }
  };

  const handlePrintData = () => {
    const b2bInvoices = invoices.filter(inv => {
      const isDirectB2B = inv.isB2B || inv.source === 'b2b' || inv.standingOrderId;
      const isCafeCustomer = (inv.customerName || '').includes('كافيه') || (inv.customerName || '').includes('روستري') || (inv.customerName || '').includes('فندق');
      return isDirectB2B || isCafeCustomer;
    });

    const success = exportB2BReportPdf({
      subTab: b2bSubTab,
      leads: filteredLeads,
      standingOrders: b2bStandingOrders,
      invoices: b2bInvoices,
      contactInfo,
      language,
      autoPrint: true,
      onNotification: (msg) => showToast(msg)
    });

    if (success) {
      showToast(language === 'en' ? 'Opening clean data print preview 🖨️' : 'جاري فتح نافذة طباعة كشف البيانات فقط 🖨️');
    }
  };

  const exportToCsv = () => {
    if (filteredLeads.length === 0) {
      showToast(language === 'en' ? 'No leads to export.' : 'لا توجد بيانات لتصديرها.');
      return;
    }

    const headers = ['الكود المرجعي', 'اسم المنشأة', 'المسؤول', 'الهاتف', 'المدينة', 'نوع النشاط', 'الاستهلاك الشهري', 'علامة خاصة', 'عقد شهري', 'دعم باريستا', 'الحالة', 'قيمة العرض التقديرية', 'تاريخ الطلب'];
    const rows = filteredLeads.map(l => [
      l.refCode,
      `"${l.companyName || ''}"`,
      `"${l.contactName || ''}"`,
      `'${l.phone || ''}`,
      `"${l.city || ''}"`,
      `"${businessTypeLabels[l.businessType]?.[language] || l.businessType}"`,
      `"${volumeLabels[l.monthlyVolume]?.[language] || l.monthlyVolume}"`,
      l.privateLabel ? 'نعم' : 'لا',
      l.monthlyContract ? 'نعم' : 'لا',
      l.extractionSupport ? 'نعم' : 'لا',
      `"${statusConfig[l.status]?.label || l.status}"`,
      l.quotedAmount || 0,
      l.createdAt || ''
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `caturra_b2b_partnerships_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    showToast(language === 'en' ? 'CSV Export downloaded' : 'تم تنزيل كشف الشراكات بصيغة CSV بنجاح 📥');
  };

  return (
    <div className="b2b-admin-container" style={{ color: '#f5ebe1', minHeight: '100%', paddingBottom: '60px' }}>
      
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
            gap: '8px',
            animation: 'slideDown 200ms ease'
          }}
        >
          <Sparkles size={18} color="#f59e0b" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 🌟 1. EXECUTIVE BANNER & TOOLBAR 🌟 */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(37, 18, 10, 0.96) 0%, rgba(26, 11, 5, 0.98) 100%)',
          borderRadius: '24px',
          border: '1.5px solid rgba(212, 163, 115, 0.35)',
          padding: '24px 28px',
          marginBottom: '24px',
          boxShadow: '0 16px 40px rgba(0,0,0,0.6)',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '18px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '58px',
              height: '58px',
              borderRadius: '18px',
              background: 'linear-gradient(135deg, #96663B 0%, #7A5230 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(150, 102, 59, 0.45)',
              border: '2px solid rgba(255, 255, 255, 0.2)'
            }}
          >
            <Handshake size={32} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.45rem', fontWeight: '900', color: '#ffffff', margin: 0 }}>
                {language === 'en' ? 'B2B Wholesale Partnerships' : 'مبيعات الجملة والشركات (B2B)'}
              </h1>
              <span
                style={{
                  background: 'rgba(217, 119, 6, 0.2)',
                  border: '1px solid #d97706',
                  color: '#fbbf24',
                  fontSize: '0.72rem',
                  fontWeight: '900',
                  padding: '3px 10px',
                  borderRadius: '20px'
                }}
              >
                {language === 'en' ? 'Executive Roastery CRM' : 'نظام إدارة عقود المحمصة'}
              </span>
            </div>
            <p style={{ margin: '6px 0 0', fontSize: '0.88rem', color: '#d4a373', opacity: 0.95 }}>
              {language === 'en'
                ? 'Manage wholesale leads, private label roasting, volume contracts & barista dial-in support.'
                : 'متابعة استفسارات قطاع الأعمال، عروض الأسعار، عقود التوريد الشهرية، وطلبات الـ Private Label.'}
            </p>
          </div>
        </div>

        {/* Toolbar Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setIsAddModalOpen(true)}
            style={{
              background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
              color: '#ffffff',
              border: '1.5px solid #f59e0b',
              borderRadius: '12px',
              padding: '10px 18px',
              fontSize: '0.88rem',
              fontWeight: '900',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 6px 18px rgba(217, 119, 6, 0.35)',
              transition: 'all 0.15s ease'
            }}
          >
            <Plus size={18} />
            <span>{language === 'en' ? 'Add Lead Manually' : 'تسجيل شريك / طلب جملة يدوياً'}</span>
          </button>

          {/* 📄 PDF Export Button */}
          <button
            onClick={handleExportPdf}
            style={{
              background: 'linear-gradient(135deg, rgba(217, 119, 6, 0.25) 0%, rgba(180, 83, 9, 0.25) 100%)',
              color: '#fef3c7',
              border: '1.5px solid #d97706',
              borderRadius: '12px',
              padding: '10px 16px',
              fontSize: '0.86rem',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              boxShadow: '0 4px 12px rgba(217, 119, 6, 0.2)',
              transition: 'all 0.15s ease'
            }}
            title="تصدير كشف البيانات وحفظه بصيغة PDF الرسمية"
          >
            <FileText size={16} color="#fbbf24" />
            <span>{language === 'en' ? 'Export PDF' : 'تصدير كشف PDF'}</span>
          </button>

          {/* 🖨️ Clean Data-Only Print Button */}
          <button
            onClick={handlePrintData}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#f5ebe1',
              border: '1px solid rgba(212, 163, 115, 0.3)',
              borderRadius: '12px',
              padding: '10px 15px',
              fontSize: '0.86rem',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              transition: 'all 0.15s ease'
            }}
            title="طباعة كشف البيانات والتقرير فقط (A4)"
          >
            <Printer size={16} color="#d4a373" />
            <span>{language === 'en' ? 'Print Data' : 'طباعة'}</span>
          </button>

          {/* 📊 CSV / Excel Backup */}
          <button
            onClick={exportToCsv}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              color: '#d4a373',
              border: '1px solid rgba(212, 163, 115, 0.2)',
              borderRadius: '12px',
              padding: '10px 12px',
              fontSize: '0.8rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '5px'
            }}
            title="تصدير ملف Excel / CSV"
          >
            <Download size={14} color="#d4a373" />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* 🌟 SUB-MODULE NAVIGATION TABS (الطلبيات الدورية / فواتير التوريد والمديونيات / إدارة الشركاء) 🌟 */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '24px',
          borderBottom: '2px solid rgba(212, 163, 115, 0.25)',
          paddingBottom: '14px',
          flexWrap: 'wrap'
        }}
      >
        <button
          onClick={() => setB2bSubTab('standing')}
          style={{
            background: b2bSubTab === 'standing'
              ? 'linear-gradient(135deg, #d97706 0%, #b45309 100%)'
              : 'rgba(255, 255, 255, 0.06)',
            color: '#ffffff',
            border: b2bSubTab === 'standing' ? '1.5px solid #f59e0b' : '1px solid rgba(212, 163, 115, 0.25)',
            borderRadius: '14px',
            padding: '12px 22px',
            fontSize: '0.94rem',
            fontWeight: '900',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: b2bSubTab === 'standing' ? '0 8px 24px rgba(217, 119, 6, 0.35)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <Repeat size={18} />
          <span>الطلبيات الدورية الثابتة وعقود التوريد</span>
          {dueStandingOrdersCount > 0 && (
            <span
              style={{
                background: '#ef4444',
                color: '#ffffff',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '0.74rem',
                fontWeight: '900',
                boxShadow: '0 0 10px rgba(239, 68, 68, 0.6)'
              }}
            >
              {dueStandingOrdersCount} توريد مستحق ⏰
            </span>
          )}
        </button>

        <button
          onClick={() => setB2bSubTab('invoices')}
          style={{
            background: b2bSubTab === 'invoices'
              ? 'linear-gradient(135deg, #d97706 0%, #b45309 100%)'
              : 'rgba(255, 255, 255, 0.06)',
            color: '#ffffff',
            border: b2bSubTab === 'invoices' ? '1.5px solid #f59e0b' : '1px solid rgba(212, 163, 115, 0.25)',
            borderRadius: '14px',
            padding: '12px 22px',
            fontSize: '0.94rem',
            fontWeight: '900',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: b2bSubTab === 'invoices' ? '0 8px 24px rgba(217, 119, 6, 0.35)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <Receipt size={18} />
          <span>سجل فواتير التوريد والمديونيات والمرتجع</span>
        </button>

        <button
          onClick={() => setB2bSubTab('leads')}
          style={{
            background: b2bSubTab === 'leads'
              ? 'linear-gradient(135deg, #d97706 0%, #b45309 100%)'
              : 'rgba(255, 255, 255, 0.06)',
            color: '#ffffff',
            border: b2bSubTab === 'leads' ? '1.5px solid #f59e0b' : '1px solid rgba(212, 163, 115, 0.25)',
            borderRadius: '14px',
            padding: '12px 22px',
            fontSize: '0.94rem',
            fontWeight: '900',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: b2bSubTab === 'leads' ? '0 8px 24px rgba(217, 119, 6, 0.35)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <Handshake size={18} />
          <span>طلبات الشراكة وعروض الأسعار (CRM) ({b2bRequests.length})</span>
        </button>
      </div>

      {/* 🔁 RENDER TAB 1: STANDING RECURRING ORDERS 🔁 */}
      {b2bSubTab === 'standing' && (
        <B2BStandingOrdersTab onOpenInvoiceModal={openInvoiceModal} />
      )}

      {/* 🧾 RENDER TAB 2: INVOICES, DEBT & RETURNS 🧾 */}
      {b2bSubTab === 'invoices' && (
        <B2BInvoicesTab onOpenInvoiceModal={openInvoiceModal} />
      )}

      {/* 👥 RENDER TAB 3: LEADS CRM PIPELINE 👥 */}
      {b2bSubTab === 'leads' && (
        <>
      {/* 🌟 2. EXECUTIVE KPI CARDS (5 METRICS) 🌟 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '16px',
          marginBottom: '26px'
        }}
      >
        {/* Card 1: Total Leads */}
        <div
          onClick={() => setActiveStage('all')}
          style={{
            background: 'linear-gradient(135deg, #241108 0%, #170904 100%)',
            border: activeStage === 'all' ? '2px solid #d97706' : '1px solid rgba(212, 163, 115, 0.25)',
            borderRadius: '18px',
            padding: '18px 20px',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.84rem', color: '#EDD9BD', fontWeight: '800' }}>
              {language === 'en' ? 'Total Partnerships' : 'إجمالي الشركاء والطلبات'}
            </span>
            <Building2 size={20} color="#96663B" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: '900', color: '#ffffff' }}>
            {stats.total}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#9ca3af', marginTop: '4px' }}>
            {language === 'en' ? 'Specialty cafes & brands' : 'كافيهات ومحامص وبراندات'}
          </div>
        </div>

        {/* Card 2: New Inquiries */}
        <div
          onClick={() => setActiveStage('new')}
          style={{
            background: 'linear-gradient(135deg, #2c1507 0%, #1a0a03 100%)',
            border: activeStage === 'new' ? '2px solid #fbbf24' : '1.5px solid rgba(251, 191, 36, 0.35)',
            borderRadius: '18px',
            padding: '18px 20px',
            cursor: 'pointer',
            boxShadow: stats.newCount > 0 ? '0 8px 24px rgba(251, 191, 36, 0.2)' : '0 8px 24px rgba(0,0,0,0.4)',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.84rem', color: '#fde68a', fontWeight: '800' }}>
              {language === 'en' ? 'New Inquiries' : 'طلبات جديدة (مطلوب رد)'}
            </span>
            <span style={{ fontSize: '1.1rem' }}>🟡</span>
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: '900', color: '#fbbf24' }}>
            {stats.newCount}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#fef08a', marginTop: '4px' }}>
            {stats.newCount > 0 ? (language === 'en' ? 'Awaiting initial contact' : 'بانتظار التواصل المبدئي') : (language === 'en' ? 'All contacted ✓' : 'تم الرد على كافة الطلبات ✓')}
          </div>
        </div>

        {/* Card 3: Quoted & Cupping */}
        <div
          onClick={() => setActiveStage('contacted')}
          style={{
            background: 'linear-gradient(135deg, #182333 0%, #0d1522 100%)',
            border: activeStage === 'contacted' ? '2px solid #38bdf8' : '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '18px',
            padding: '18px 20px',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.84rem', color: '#bae6fd', fontWeight: '800' }}>
              {language === 'en' ? 'Quotes in Progress' : 'عروض أسعار قيد المتابعة'}
            </span>
            <FileText size={20} color="#38bdf8" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: '900', color: '#38bdf8' }}>
            {stats.contactedCount + stats.cuppingCount}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#7dd3fc', marginTop: '4px' }}>
            {stats.cuppingCount} {language === 'en' ? 'scheduled for cupping' : 'جلسات تذوق واستخلاص'}
          </div>
        </div>

        {/* Card 4: Contracted Official Partners */}
        <div
          onClick={() => setActiveStage('contracted')}
          style={{
            background: 'linear-gradient(135deg, #10291d 0%, #08170f 100%)',
            border: activeStage === 'contracted' ? '2px solid #34d399' : '1px solid rgba(52, 211, 153, 0.35)',
            borderRadius: '18px',
            padding: '18px 20px',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(52, 211, 153, 0.15)',
            transition: 'all 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.84rem', color: '#a7f3d0', fontWeight: '800' }}>
              {language === 'en' ? 'Contracted Partners' : 'شركاء معتمدون رسمياً'}
            </span>
            <BadgeCheck size={22} color="#34d399" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: '900', color: '#34d399' }}>
            {stats.contractedCount}
          </div>
          <div style={{ fontSize: '0.74rem', color: '#6ee7b7', marginTop: '4px' }}>
            {language === 'en' ? 'Active recurring supply contracts' : 'عقود توريد شهرية نشطة'}
          </div>
        </div>

        {/* Card 5: Est. Monthly Coffee Demand */}
        <div
          style={{
            background: 'linear-gradient(135deg, #301708 0%, #1c0b03 100%)',
            border: '1.5px solid #d97706',
            borderRadius: '18px',
            padding: '18px 20px',
            boxShadow: '0 8px 24px rgba(217, 119, 6, 0.25)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontSize: '0.84rem', color: '#fde68a', fontWeight: '800' }}>
              {language === 'en' ? 'Est. Monthly Demand' : 'الطلب الشهري التقديري'}
            </span>
            <Coffee size={20} color="#f59e0b" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: '900', color: '#fbbf24' }}>
            {stats.totalEstKg}+ <span style={{ fontSize: '1.05rem', fontWeight: '800' }}>كجم/شهر</span>
          </div>
          <div style={{ fontSize: '0.74rem', color: '#fde68a', marginTop: '4px' }}>
            {stats.totalContractedRevenue > 0 && `~ ${stats.totalContractedRevenue.toLocaleString()} ج.م عقود`}
          </div>
        </div>
      </div>

      {/* 🌟 3. PIPELINE STAGE TABS & ADVANCED FILTERS 🌟 */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(32, 15, 8, 0.95) 0%, rgba(22, 9, 4, 0.98) 100%)',
          borderRadius: '20px',
          border: '1px solid rgba(212, 163, 115, 0.25)',
          padding: '18px 20px',
          marginBottom: '20px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
        }}
      >
        {/* Stage Filter Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '12px', borderBottom: '1px solid rgba(212, 163, 115, 0.15)', marginBottom: '16px' }}>
          {[
            { id: 'all', label: language === 'en' ? 'All Leads' : 'كافة الطلبات', count: stats.total, badge: null },
            { id: 'new', label: language === 'en' ? 'New Leads' : 'جديد', count: stats.newCount, badge: '🟡' },
            { id: 'contacted', label: language === 'en' ? 'Quoted' : 'تم التواصل وعرض السعر', count: stats.contactedCount, badge: '🔵' },
            { id: 'cupping', label: language === 'en' ? 'Cupping & Dial-in' : 'جلسة كابنج وتذوق', count: stats.cuppingCount, badge: '🟣' },
            { id: 'contracted', label: language === 'en' ? 'Contracted' : 'شركاء معتمدون', count: stats.contractedCount, badge: '🟢' },
            { id: 'cancelled', label: language === 'en' ? 'Closed' : 'ملغي / غير مهتم', count: b2bRequests.filter(l => l.status === 'cancelled').length, badge: '⚪' }
          ].map(tab => {
            const isActive = activeStage === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveStage(tab.id)}
                style={{
                  background: isActive ? '#96663B' : 'rgba(255, 255, 255, 0.06)',
                  color: isActive ? '#ffffff' : '#e5e7eb',
                  border: isActive ? '1.5px solid #C49A5C' : '1px solid rgba(237, 217, 189, 0.2)',
                  borderRadius: '12px',
                  padding: '8px 16px',
                  fontSize: '0.84rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.badge && <span>{tab.badge}</span>}
                <span>{tab.label}</span>
                <span
                  style={{
                    fontSize: '0.72rem',
                    background: isActive ? '#1b0d07' : 'rgba(0,0,0,0.3)',
                    color: isActive ? '#fbbf24' : '#d4a373',
                    padding: '1px 7px',
                    borderRadius: '10px',
                    fontWeight: '900'
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search & Filter Dropdowns Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          {/* Live Search */}
          <div style={{ position: 'relative' }}>
            <Search size={18} color="#d4a373" style={{ position: 'absolute', top: '12px', right: isRtl ? '12px' : 'auto', left: isRtl ? 'auto' : '12px' }} />
            <input
              type="text"
              placeholder={language === 'en' ? 'Search cafe, phone, ref...' : 'بحث باسم الكافيه، المسؤول، الهاتف، أو الكود...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                background: 'rgba(15, 6, 3, 0.85)',
                border: '1.5px solid rgba(212, 163, 115, 0.3)',
                borderRadius: '12px',
                padding: isRtl ? '10px 40px 10px 12px' : '10px 12px 10px 40px',
                color: '#ffffff',
                fontSize: '0.86rem',
                outline: 'none'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', top: '10px', left: isRtl ? '10px' : 'auto', right: isRtl ? 'auto' : '10px', background: 'none', border: 'none', color: '#9ca3af', cursor: 'pointer' }}
              >
                ✕
              </button>
            )}
          </div>

          {/* City Filter */}
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            style={{
              background: 'rgba(15, 6, 3, 0.85)',
              border: '1.5px solid rgba(212, 163, 115, 0.3)',
              borderRadius: '12px',
              padding: '10px 12px',
              color: '#ffffff',
              fontSize: '0.86rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all">📍 {language === 'en' ? 'All Governorates' : 'كافة المحافظات والمدن'}</option>
            {Array.from(new Set([
              'القاهرة',
              'الجيزة',
              'الإسكندرية',
              'الدقهلية (المنصورة)',
              'الغربية (طنطا)',
              'الساحل الشمالي / مطروح',
              'البحر الأحمر (الغردقة / الجونة)',
              'جنوب سيناء (شرم الشيخ / دهب)',
              ...b2bRequests.map(r => r.city).filter(Boolean)
            ])).map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>

          {/* Monthly Volume Filter */}
          <select
            value={volumeFilter}
            onChange={(e) => setVolumeFilter(e.target.value)}
            style={{
              background: 'rgba(15, 6, 3, 0.85)',
              border: '1.5px solid rgba(212, 163, 115, 0.3)',
              borderRadius: '12px',
              padding: '10px 12px',
              color: '#ffffff',
              fontSize: '0.86rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all">📦 {language === 'en' ? 'All Volumes' : 'كافة أحجام الاستهلاك'}</option>
            <option value="10-25">10 - 25 كجم/شهر</option>
            <option value="25-50">25 - 50 كجم/شهر</option>
            <option value="50-100">50 - 100 كجم/شهر</option>
            <option value="100+">أكثر من 100 كجم/شهر</option>
          </select>

          {/* Business Type Filter */}
          <select
            value={businessTypeFilter}
            onChange={(e) => setBusinessTypeFilter(e.target.value)}
            style={{
              background: 'rgba(15, 6, 3, 0.85)',
              border: '1.5px solid rgba(212, 163, 115, 0.3)',
              borderRadius: '12px',
              padding: '10px 12px',
              color: '#ffffff',
              fontSize: '0.86rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="all">☕ {language === 'en' ? 'All Business Types' : 'كافة أنشطة المنشآت'}</option>
            <option value="specialty_cafe">كافيه مختص (Specialty)</option>
            <option value="commercial_cafe">كافيه تجاري / كورنر</option>
            <option value="restaurant_hotel">مطعم / فندق وضيافة</option>
            <option value="office_corporate">شركة / مقر أعمال</option>
            <option value="new_brand">براند قهوة (Private Label)</option>
            <option value="other">نشاط تجاري آخر</option>
          </select>
        </div>
      </div>

      {/* 🌟 4. LEADS DATA TABLE 🌟 */}
      {filteredLeads.length === 0 ? (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(32, 15, 8, 0.9) 0%, rgba(20, 8, 3, 0.95) 100%)',
            borderRadius: '20px',
            border: '1px dashed rgba(212, 163, 115, 0.3)',
            padding: '60px 20px',
            textAlign: 'center',
            color: '#d4a373'
          }}
        >
          <Coffee size={48} color="#96663B" style={{ marginBottom: '14px', opacity: 0.8 }} />
          <h3 style={{ color: '#ffffff', fontSize: '1.15rem', fontWeight: '800', margin: '0 0 8px' }}>
            {language === 'en' ? 'No partnership inquiries found' : 'لا توجد طلبات شراكة مطابقة للفلاتر'}
          </h3>
          <p style={{ margin: 0, fontSize: '0.86rem', opacity: 0.85 }}>
            {language === 'en'
              ? 'Try adjusting your search criteria or add a new wholesale lead manually.'
              : 'جرب تعديل خيارات البحث أو قم بتسجيل شريك كافيه جديد يدوياً.'}
          </p>
          <button
            onClick={() => {
              setActiveStage('all');
              setCityFilter('all');
              setVolumeFilter('all');
              setBusinessTypeFilter('all');
              setSearchQuery('');
            }}
            style={{
              marginTop: '16px',
              background: 'rgba(150, 102, 59, 0.15)',
              border: '1px solid #96663B',
              color: '#EDD9BD',
              borderRadius: '10px',
              padding: '6px 16px',
              fontSize: '0.82rem',
              fontWeight: '800',
              cursor: 'pointer'
            }}
          >
            {language === 'en' ? 'Reset Filters ✕' : 'إعادة ضبط الفلاتر ✕'}
          </button>
        </div>
      ) : (
        <div
          className="card"
          style={{
            padding: 0,
            overflow: 'hidden',
            border: '1.5px solid #EDD9BD',
            borderRadius: '16px',
            background: '#FFFDF9',
            boxShadow: '0 4px 20px rgba(74, 50, 32, 0.08)'
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: isRtl ? 'right' : 'left', fontSize: '0.86rem' }}>
              <thead>
                <tr style={{ background: '#FFF8EE', borderBottom: '2px solid #EDD9BD' }}>
                  <th style={{ padding: '14px 16px', fontWeight: '900', color: '#4A3220', whiteSpace: 'nowrap' }}>كود المتابعة</th>
                  <th style={{ padding: '14px 16px', fontWeight: '900', color: '#4A3220', whiteSpace: 'nowrap' }}>المنشأة والنشاط</th>
                  <th style={{ padding: '14px 16px', fontWeight: '900', color: '#4A3220', whiteSpace: 'nowrap' }}>المسؤول والتواصل</th>
                  <th style={{ padding: '14px 16px', fontWeight: '900', color: '#4A3220', whiteSpace: 'nowrap' }}>الاستهلاك والخدمات</th>
                  <th style={{ padding: '14px 16px', fontWeight: '900', color: '#4A3220', whiteSpace: 'nowrap' }}>التاريخ</th>
                  <th style={{ padding: '14px 16px', fontWeight: '900', color: '#4A3220', whiteSpace: 'nowrap' }}>مرحلة المتابعة</th>
                  <th style={{ padding: '14px 16px', fontWeight: '900', color: '#4A3220', textAlign: 'center', whiteSpace: 'nowrap' }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead, idx) => {
                  const isNew = lead.status === 'new';
                  const statusThemes = {
                    new: { bg: '#FEF3C7', color: '#92400E', border: '#F59E0B' },
                    contacted: { bg: '#E0F2FE', color: '#0369A1', border: '#38BDF8' },
                    cupping: { bg: '#F3E8FF', color: '#6B21A8', border: '#C084FC' },
                    contracted: { bg: '#DCFCE7', color: '#166534', border: '#22C55E' },
                    cancelled: { bg: '#F1F5F9', color: '#475569', border: '#94A3B8' }
                  };
                  const curSt = statusThemes[lead.status] || statusThemes.new;

                  return (
                    <tr
                      key={lead.id}
                      style={{
                        borderBottom: '1px solid #EDD9BD',
                        background: isNew ? 'rgba(217, 119, 6, 0.05)' : (idx % 2 === 0 ? '#FFFDF9' : '#FFFBF4'),
                        transition: 'background 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#FFF4E5'}
                      onMouseLeave={(e) => e.currentTarget.style.background = isNew ? 'rgba(217, 119, 6, 0.05)' : (idx % 2 === 0 ? '#FFFDF9' : '#FFFBF4')}
                    >
                      {/* 1. Reference Code */}
                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            onClick={() => handleCopy(lead.refCode, lead.refCode)}
                            style={{
                              background: '#FFF8EE',
                              border: '1.5px solid #C49A5C',
                              color: '#96663B',
                              fontFamily: 'monospace',
                              fontWeight: '900',
                              fontSize: '0.82rem',
                              padding: '3px 9px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              boxShadow: '0 1px 3px rgba(74, 50, 32, 0.08)'
                            }}
                            title="اضغط لنسخ الكود"
                          >
                            <span>{lead.refCode}</span>
                            <Copy size={12} color="#96663B" />
                          </span>
                        </div>
                        {lead.convertedCustomerId && (
                          <div style={{ marginTop: '4px' }}>
                            <span style={{ fontSize: '0.7rem', background: '#DCFCE7', color: '#166534', border: '1px solid #86EFAC', padding: '1px 6px', borderRadius: '4px', fontWeight: '800' }}>
                              عميل ERP معتمد ✓
                            </span>
                          </div>
                        )}
                      </td>

                      {/* 2. Company & Business Type */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: '900', color: '#2C1810', fontSize: '0.98rem' }}>
                          {lead.companyName}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              fontSize: '0.74rem',
                              background: '#FFF8EE',
                              border: '1px solid #EDD9BD',
                              color: '#7A5230',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              fontWeight: '800'
                            }}
                          >
                            {businessTypeLabels[lead.businessType]?.[language] || lead.businessType}
                          </span>
                          <span style={{ fontSize: '0.76rem', color: '#8A654C', fontWeight: '700' }}>
                            📍 {lead.city}
                          </span>
                        </div>
                      </td>

                      {/* 3. Contact & Phone */}
                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: '800', color: '#4A3220', fontSize: '0.92rem' }}>
                          {lead.contactName || (language === 'en' ? 'Unspecified' : 'غير محدد')}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                          <a
                            href={`tel:${lead.phone}`}
                            dir="ltr"
                            style={{
                              color: '#0284c7',
                              textDecoration: 'none',
                              fontSize: '0.84rem',
                              fontFamily: 'monospace',
                              fontWeight: '800',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Phone size={12} color="#0284c7" />
                            <span>{lead.phone}</span>
                          </a>
                          {lead.email && (
                            <span style={{ fontSize: '0.74rem', color: '#8A654C' }}>
                              • {lead.email}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 4. Volume & Extra Requirements */}
                      <td style={{ padding: '14px 16px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#FEF3C7', border: '1px solid #F59E0B', color: '#92400E', fontWeight: '900', fontSize: '0.8rem', padding: '3px 10px', borderRadius: '8px' }}>
                          <span>📦</span>
                          <span>{volumeLabels[lead.monthlyVolume]?.[language] || lead.monthlyVolume}</span>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginTop: '6px' }}>
                          {lead.privateLabel && (
                            <span style={{ fontSize: '0.7rem', background: '#F3E8FF', color: '#6B21A8', border: '1px solid #C084FC', padding: '2px 7px', borderRadius: '5px', fontWeight: '800' }}>
                              🏷️ براند خاص
                            </span>
                          )}
                          {lead.monthlyContract && (
                            <span style={{ fontSize: '0.7rem', background: '#DCFCE7', color: '#166534', border: '1px solid #86EFAC', padding: '2px 7px', borderRadius: '5px', fontWeight: '800' }}>
                              📜 عقد شهري
                            </span>
                          )}
                          {lead.extractionSupport && (
                            <span style={{ fontSize: '0.7rem', background: '#E0F2FE', color: '#075985', border: '1px solid #7DD3FC', padding: '2px 7px', borderRadius: '5px', fontWeight: '800' }}>
                              ☕ ضبط استخلاص
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 5. Date */}
                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                        <span style={{ fontSize: '0.82rem', color: '#7A5230', fontWeight: '700' }} dir="ltr">
                          {lead.createdAt}
                        </span>
                      </td>

                      {/* 6. Pipeline Status Selector */}
                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                        <select
                          value={lead.status}
                          onChange={(e) => {
                            updateB2BStatus(lead.id, e.target.value);
                            showToast(language === 'en' ? `Updated status to: ${statusConfig[e.target.value]?.label}` : `تم تحديث حالة الشريك: ${statusConfig[e.target.value]?.label}`);
                          }}
                          style={{
                            background: curSt.bg,
                            border: `1.5px solid ${curSt.border}`,
                            color: curSt.color,
                            fontWeight: '900',
                            fontSize: '0.8rem',
                            padding: '6px 12px',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            outline: 'none',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
                          }}
                        >
                          <option value="new">🟡 جديد (لم يتم الرد)</option>
                          <option value="contacted">🔵 تم التواصل وعرض السعر</option>
                          <option value="cupping">🟣 جلسة كابنج وتذوق</option>
                          <option value="contracted">🟢 شريك معتمد (تم التعاقد)</option>
                          <option value="cancelled">⚪ ملغي / غير مهتم</option>
                        </select>
                      </td>

                      {/* 7. Quick Actions */}
                      <td style={{ padding: '14px 16px', whiteSpace: 'nowrap', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          {/* WhatsApp Chat Button */}
                          <a
                            href={buildWhatsAppChatUrl(lead)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '8px',
                              padding: '6px 11px',
                              fontSize: '0.78rem',
                              fontWeight: '800',
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              boxShadow: '0 2px 6px rgba(16, 185, 129, 0.25)'
                            }}
                            title="فتح محادثة واتساب مجهزة بالرد الاحترافي"
                          >
                            <WhatsAppIcon size={14} color="#ffffff" />
                            <span>واتساب</span>
                          </a>

                          {/* Notes & Follow-up History */}
                          <button
                            onClick={() => {
                              setSelectedLeadForNotes(lead);
                              markB2BAsRead(lead.id);
                            }}
                            style={{
                              background: '#FFF8EE',
                              border: '1.5px solid #EDD9BD',
                              color: '#7A5230',
                              borderRadius: '8px',
                              padding: '6px 11px',
                              fontSize: '0.78rem',
                              fontWeight: '800',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                            title="ملاحظات المحمصة ومراحل المتابعة"
                          >
                            <MessageSquare size={13} color="#96663B" />
                            <span>المتابعة ({lead.internalNotes?.length || 0})</span>
                          </button>

                          {/* 👁️ Preview Invoice / Order Button */}
                          <button
                            onClick={() => handlePreviewLeadInvoice(lead)}
                            style={{
                              background: 'linear-gradient(135deg, #96663B 0%, #7A5230 100%)',
                              border: '1px solid #7A5230',
                              color: '#ffffff',
                              borderRadius: '8px',
                              padding: '6px 12px',
                              fontSize: '0.78rem',
                              fontWeight: '800',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '5px',
                              boxShadow: '0 2px 6px rgba(150, 102, 59, 0.25)'
                            }}
                            title="معاينة وطباعة الفاتورة وتفاصيل الطلب الرسمية"
                          >
                            <Eye size={14} color="#ffffff" />
                            <span>معاينة الفاتورة</span>
                          </button>

                          {/* Convert to Wholesale Customer */}
                          {!lead.convertedCustomerId ? (
                            <button
                              onClick={() => handleConvertLead(lead.id)}
                              style={{
                                background: '#ECFDF5',
                                border: '1.5px solid #10B981',
                                color: '#065F46',
                                borderRadius: '8px',
                                padding: '6px 11px',
                                fontSize: '0.78rem',
                                fontWeight: '900',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                boxShadow: '0 2px 6px rgba(16, 185, 129, 0.15)'
                              }}
                              title="تحويل مباشر إلى عميل جملة معتمد في قاعدة بيانات الـ ERP"
                            >
                              <BadgeCheck size={14} color="#059669" />
                              <span>تحويل لعميل ERP</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setSelectedLeadForQuote(lead);
                              }}
                              style={{
                                background: '#FFF8EE',
                                border: '1.5px solid #EDD9BD',
                                color: '#96663B',
                                borderRadius: '8px',
                                padding: '6px 11px',
                                fontSize: '0.78rem',
                                fontWeight: '800',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              title="عرض وطباعة عرض سعر رسمي مختوم"
                            >
                              <FileText size={13} color="#96663B" />
                              <span>عرض سعر</span>
                            </button>
                          )}

                          {/* Delete */}
                          <button
                            onClick={async () => {
                              const ok = await confirmDialog({
                                title: language === 'en' ? 'Delete Partnership Lead' : 'حذف طلب الشراكة',
                                message: language === 'en'
                                  ? `Are you sure you want to delete lead for "${lead.companyName}"?`
                                  : `هل أنت متأكد من حذف طلب الشراكة الخاص بـ "${lead.companyName}"؟`,
                                details: language === 'en'
                                  ? 'This will permanently remove the lead record from B2B requests.'
                                  : 'سيتم مسح بيانات طلب الشراكة نهائياً من سجل طلبات الجملة.',
                                type: 'danger',
                                confirmText: language === 'en' ? 'Delete' : 'نعم، احذف',
                                cancelText: language === 'en' ? 'Cancel' : 'إلغاء'
                              });
                              if (ok) {
                                deleteB2BRequest(lead.id);
                                showToast(language === 'en' ? 'Lead deleted' : 'تم حذف الطلب بنجاح');
                              }
                            }}
                            style={{
                              background: '#FEF2F2',
                              border: '1.5px solid #FCA5A5',
                              color: '#DC2626',
                              padding: '6px 8px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              transition: 'all 0.15s ease'
                            }}
                            title="حذف"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      </>
      )}

      {/* 🌟 MODAL 1: LEAD DETAILS & ROASTERY FOLLOW-UP LOG MODAL 🌟 */}
      {selectedLeadForNotes && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setSelectedLeadForNotes(null)}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #241108 0%, #150803 100%)',
              border: '2px solid rgba(212, 163, 115, 0.4)',
              borderRadius: '24px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 60px rgba(0,0,0,0.9), 0 0 30px rgba(212, 163, 115, 0.15)',
              padding: '28px',
              color: '#f5ebe1'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', borderBottom: '1px solid rgba(212, 163, 115, 0.25)', paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '900', color: '#ffffff' }}>
                    {selectedLeadForNotes.companyName}
                  </h3>
                  <span style={{ fontSize: '0.74rem', background: 'rgba(217, 119, 6, 0.25)', border: '1px solid #d97706', color: '#fbbf24', padding: '2px 8px', borderRadius: '6px', fontWeight: '900' }}>
                    #{selectedLeadForNotes.refCode}
                  </span>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#d4a373' }}>
                  {selectedLeadForNotes.contactName ? `${selectedLeadForNotes.contactName} • ` : ''}{selectedLeadForNotes.city} • هاتف: {selectedLeadForNotes.phone}
                </p>
              </div>
              <button
                onClick={() => setSelectedLeadForNotes(null)}
                style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            {/* Inquiry Details Summary */}
            <div style={{ background: 'rgba(10, 4, 2, 0.65)', border: '1px solid rgba(212, 163, 115, 0.2)', borderRadius: '16px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', fontSize: '0.84rem' }}>
                <div>
                  <span style={{ color: '#d4a373' }}>نوع المنشأة: </span>
                  <span style={{ fontWeight: '800', color: '#ffffff' }}>{businessTypeLabels[selectedLeadForNotes.businessType]?.[language] || selectedLeadForNotes.businessType}</span>
                </div>
                <div>
                  <span style={{ color: '#d4a373' }}>الاستهلاك المتوقع: </span>
                  <span style={{ fontWeight: '800', color: '#fbbf24' }}>{volumeLabels[selectedLeadForNotes.monthlyVolume]?.[language] || selectedLeadForNotes.monthlyVolume}</span>
                </div>
                <div>
                  <span style={{ color: '#d4a373' }}>البريد الإلكتروني: </span>
                  <span style={{ fontWeight: '800', color: '#ffffff' }}>{selectedLeadForNotes.email || 'غير مسجل'}</span>
                </div>
                <div>
                  <span style={{ color: '#d4a373' }}>حالة الشراكة: </span>
                  <span style={{ fontWeight: '900', color: statusConfig[selectedLeadForNotes.status]?.color }}>{statusConfig[selectedLeadForNotes.status]?.label}</span>
                </div>
              </div>

              {selectedLeadForNotes.notes && (
                <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed rgba(212, 163, 115, 0.2)', fontSize: '0.84rem' }}>
                  <span style={{ color: '#d4a373', fontWeight: '800' }}>ملاحظات العميل: </span>
                  <span style={{ color: '#fef08a' }}>{selectedLeadForNotes.notes}</span>
                </div>
              )}
            </div>

            {/* Quoted Amount In EGP Editor */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(217, 119, 6, 0.1)', border: '1px solid rgba(217, 119, 6, 0.3)', borderRadius: '14px', padding: '12px 16px', marginBottom: '20px' }}>
              <Tag size={18} color="#f59e0b" />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#fde68a' }}>
                  القيمة التقديرية لعرض السعر / التوريد الشهري (ج.م):
                </div>
                <div style={{ fontSize: '0.74rem', color: '#d4a373' }}>
                  تساعد في حساب إجمالي حجم العقود المتوقعة في تقارير المبيعات
                </div>
              </div>
              <input
                type="number"
                defaultValue={selectedLeadForNotes.quotedAmount || ''}
                onBlur={(e) => {
                  updateB2BLead(selectedLeadForNotes.id, { quotedAmount: Number(e.target.value) || 0 });
                  showToast('تم حفظ قيمة عرض السعر بنجاح ✓');
                }}
                placeholder="مثال: 45000"
                style={{
                  width: '130px',
                  background: '#2C1810',
                  border: '1.5px solid #C49A5C',
                  color: '#EDD9BD',
                  fontWeight: '900',
                  padding: '8px 10px',
                  borderRadius: '10px',
                  fontSize: '0.9rem',
                  outline: 'none',
                  textAlign: 'center'
                }}
              />
            </div>

            {/* Contracted Products & Brewing Tools */}
            <div style={{ marginBottom: '20px' }}>
              <CustomerProductSelector
                products={products}
                selectedProductIds={selectedLeadForNotes.preferredProducts || []}
                readOnly={true}
              />
            </div>

            {/* Roastery Internal Notes Timeline */}
            <h4 style={{ margin: '0 0 12px', fontSize: '0.96rem', fontWeight: '900', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MessageSquare size={16} color="#96663B" />
              <span>سجل المتابعة وملاحظات فريق المحمصة ({selectedLeadForNotes.internalNotes?.length || 0})</span>
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '200px', overflowY: 'auto', marginBottom: '20px', paddingRight: '4px' }}>
              {(!selectedLeadForNotes.internalNotes || selectedLeadForNotes.internalNotes.length === 0) ? (
                <div style={{ textAlign: 'center', padding: '16px', color: '#9ca3af', fontSize: '0.82rem', background: 'rgba(0,0,0,0.3)', borderRadius: '10px' }}>
                  لا توجد ملاحظات داخلية مسجلة بعد. اكتب أول ملاحظة بالأسفل!
                </div>
              ) : (
                selectedLeadForNotes.internalNotes.map(note => (
                  <div
                    key={note.id}
                    style={{
                      background: 'rgba(0, 0, 0, 0.45)',
                      border: '1px solid rgba(237, 217, 189, 0.2)',
                      borderRadius: '12px',
                      padding: '10px 14px',
                      fontSize: '0.84rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px', fontSize: '0.72rem', color: '#EDD9BD' }}>
                      <span style={{ fontWeight: '800', color: '#C49A5C' }}>👤 {note.author || 'فريق المحمصة'}</span>
                      <span>🕒 {note.date}</span>
                    </div>
                    <div style={{ color: '#ffffff', lineHeight: 1.5 }}>
                      {note.text}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add New Note Input Form */}
            <form onSubmit={handleAddNoteSubmit} style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <input
                type="text"
                placeholder="اكتب ملاحظة متابعة جديدة (مثال: تم الاتفاق على موعد جلسة التذوق يوم الثلاثاء القادم)..."
                value={newNoteInput}
                onChange={(e) => setNewNoteInput(e.target.value)}
                style={{
                  flex: 1,
                  background: '#2C1810',
                  border: '1.5px solid #EDD9BD',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  color: '#ffffff',
                  fontSize: '0.84rem',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                style={{
                  background: 'linear-gradient(135deg, #96663B 0%, #7A5230 100%)',
                  border: 'none',
                  color: '#ffffff',
                  borderRadius: '12px',
                  padding: '10px 18px',
                  fontWeight: '800',
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Send size={15} />
                <span>إضافة</span>
              </button>
            </form>

            {/* Footer Quick Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid rgba(212, 163, 115, 0.2)', paddingTop: '16px' }}>
              <a
                href={buildWhatsAppChatUrl(selectedLeadForNotes)}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: '#128C7E',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '8px 16px',
                  fontSize: '0.82rem',
                  fontWeight: '800',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <WhatsAppIcon size={15} color="#ffffff" />
                <span>محادثة واتساب</span>
              </a>

              {!selectedLeadForNotes.convertedCustomerId && (
                <button
                  onClick={() => {
                    handleConvertLead(selectedLeadForNotes.id);
                    setSelectedLeadForNotes(null);
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                    border: '1.5px solid #10b981',
                    color: '#ffffff',
                    borderRadius: '10px',
                    padding: '8px 16px',
                    fontSize: '0.82rem',
                    fontWeight: '900',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <BadgeCheck size={16} />
                  <span>تحويل لعميل جملة في الـ ERP</span>
                </button>
              )}

              <button
                onClick={() => setSelectedLeadForNotes(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(212, 163, 115, 0.3)',
                  color: '#e5e7eb',
                  borderRadius: '10px',
                  padding: '8px 16px',
                  fontSize: '0.82rem',
                  fontWeight: '800',
                  cursor: 'pointer'
                }}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 MODAL 2: MANUAL LEAD ENTRY MODAL 🌟 */}
      {isAddModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            style={{
              background: 'linear-gradient(135deg, #241108 0%, #150803 100%)',
              border: '2px solid rgba(212, 163, 115, 0.4)',
              borderRadius: '24px',
              maxWidth: '640px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 60px rgba(0,0,0,0.9)',
              padding: '28px',
              color: '#f5ebe1'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(212, 163, 115, 0.25)', paddingBottom: '14px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Plus size={22} color="#f59e0b" />
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '900', color: '#ffffff' }}>
                  {language === 'en' ? 'Register New B2B Lead / Cafe' : 'تسجيل شريك كافيه أو طلب جملة جديد'}
                </h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: '1.5rem', cursor: 'pointer' }}>
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewLead} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: '#EDD9BD', marginBottom: '6px' }}>
                    اسم المنشأة / الكافيه *
                  </label>
                  <B2BCustomerAutocomplete
                    value={newLeadForm.companyName}
                    onChange={(val) => setNewLeadForm(prev => ({ ...prev, companyName: val }))}
                    onSelectCustomer={(cust) => {
                      setNewLeadForm(prev => ({
                        ...prev,
                        companyName: cust.companyName,
                        contactName: cust.contactName || prev.contactName,
                        phone: cust.phone || prev.phone,
                        email: cust.email || prev.email,
                        city: cust.city || prev.city,
                        businessType: cust.businessType || prev.businessType,
                        monthlyVolume: cust.monthlyVolume || prev.monthlyVolume,
                        notes: cust.notes || prev.notes
                      }));
                    }}
                    customers={customers}
                    b2bRequests={b2bRequests}
                    placeholder="ابحث عن كافيه أو اكتب كافيه جديد..."
                    theme="dark"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: '#EDD9BD', marginBottom: '6px' }}>
                    اسم المسؤول / جهة الاتصال
                  </label>
                  <input
                    type="text"
                    placeholder="مثال: أ. أحمد ممدوح (مدير التشغيل)"
                    value={newLeadForm.contactName}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, contactName: e.target.value })}
                    style={{ width: '100%', background: '#2C1810', border: '1.5px solid #EDD9BD', borderRadius: '10px', padding: '10px 12px', color: '#ffffff', fontSize: '0.88rem', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: '#EDD9BD', marginBottom: '6px' }}>
                    رقم الهاتف / واتساب *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="010XXXXXXXX"
                    value={newLeadForm.phone}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, phone: e.target.value })}
                    style={{ width: '100%', background: '#2C1810', border: '1.5px solid #EDD9BD', borderRadius: '10px', padding: '10px 12px', color: '#ffffff', fontSize: '0.88rem', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: '#EDD9BD', marginBottom: '6px' }}>
                    البريد الإلكتروني (اختياري)
                  </label>
                  <input
                    type="email"
                    placeholder="manager@cafe.com"
                    value={newLeadForm.email}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, email: e.target.value })}
                    style={{ width: '100%', background: '#2C1810', border: '1.5px solid #EDD9BD', borderRadius: '10px', padding: '10px 12px', color: '#ffffff', fontSize: '0.88rem', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: '#EDD9BD', marginBottom: '6px' }}>
                    المدينة / المحافظة
                  </label>
                  <input
                    type="text"
                    list="b2b-lead-cities"
                    placeholder="اكتب المدينة أو اختر..."
                    value={newLeadForm.city}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, city: e.target.value })}
                    onFocus={(e) => e.target.select()}
                    style={{
                      width: '100%',
                      background: '#2C1810',
                      border: '1.5px solid #EDD9BD',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      color: '#ffffff',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <datalist id="b2b-lead-cities">
                    <option value="القاهرة" />
                    <option value="الجيزة" />
                    <option value="الإسكندرية" />
                    <option value="الدقهلية (المنصورة)" />
                    <option value="الغربية (طنطا)" />
                    <option value="الساحل الشمالي / مطروح" />
                    <option value="البحر الأحمر (الغردقة / الجونة)" />
                    <option value="جنوب سيناء (شرم / دهب)" />
                  </datalist>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: '#EDD9BD', marginBottom: '6px' }}>
                    نوع النشاط
                  </label>
                  <input
                    type="text"
                    list="b2b-lead-types"
                    placeholder="اكتب نوع النشاط أو اختر..."
                    value={newLeadForm.businessType}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, businessType: e.target.value })}
                    onFocus={(e) => e.target.select()}
                    style={{
                      width: '100%',
                      background: '#2C1810',
                      border: '1.5px solid #EDD9BD',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      color: '#ffffff',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <datalist id="b2b-lead-types">
                    <option value="كافيه مختص (Specialty)" />
                    <option value="كافيه تجاري / كورنر" />
                    <option value="مطعم / فندق وضيافة" />
                    <option value="شركة / مقر أعمال" />
                    <option value="براند قهوة (Private Label)" />
                    <option value="نشاط آخر" />
                  </datalist>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: '#EDD9BD', marginBottom: '6px' }}>
                    الاستهلاك الشهري التقديري
                  </label>
                  <input
                    type="text"
                    list="b2b-lead-volumes"
                    placeholder="اكتب الاستهلاك (مثال: 50 كجم) أو اختر..."
                    value={newLeadForm.monthlyVolume}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, monthlyVolume: e.target.value })}
                    onFocus={(e) => e.target.select()}
                    style={{
                      width: '100%',
                      background: '#2C1810',
                      border: '1.5px solid #EDD9BD',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      color: '#ffffff',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <datalist id="b2b-lead-volumes">
                    <option value="10 - 25 كجم شهرياً" />
                    <option value="25 - 50 كجم شهرياً" />
                    <option value="50 - 100 كجم شهرياً" />
                    <option value="أكثر من 100 كجم شهرياً" />
                  </datalist>
                </div>
              </div>

              {/* Requirement Checkboxes */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', background: 'rgba(0,0,0,0.3)', padding: '12px 14px', borderRadius: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={newLeadForm.privateLabel}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, privateLabel: e.target.checked })}
                  />
                  <span>🏷️ طباعة براند خاص (Private Label)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={newLeadForm.monthlyContract}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, monthlyContract: e.target.checked })}
                  />
                  <span>📜 عقد توريد شهري منتظم</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.84rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={newLeadForm.extractionSupport}
                    onChange={(e) => setNewLeadForm({ ...newLeadForm, extractionSupport: e.target.checked })}
                  />
                  <span>☕ دعم فني وضبط استخلاص</span>
                </label>
              </div>

              {/* 📦 Contracted Products & Brewing Tools Selector 📦 */}
              <CustomerProductSelector
                products={products}
                selectedProductIds={newLeadForm.preferredProducts || []}
                onChange={(ids) => setNewLeadForm(prev => ({ ...prev, preferredProducts: ids }))}
              />

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: '800', color: '#EDD9BD', marginBottom: '6px' }}>
                  ملاحظات إضافية أو تفضيلات المحاصيل
                </label>
                <textarea
                  rows={3}
                  placeholder="مثال: يفضلون محاصيل معالجة مجففة للإسبريسو، ويرغبون في استلام عينة كابنج بمقر الكافيه..."
                  value={newLeadForm.notes}
                  onChange={(e) => setNewLeadForm({ ...newLeadForm, notes: e.target.value })}
                  style={{ width: '100%', background: '#2C1810', border: '1.5px solid #EDD9BD', borderRadius: '10px', padding: '10px 12px', color: '#ffffff', fontSize: '0.88rem', outline: 'none', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', borderTop: '1px solid rgba(237, 217, 189, 0.2)', paddingTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{ background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(212, 163, 115, 0.3)', color: '#e5e7eb', borderRadius: '10px', padding: '10px 18px', fontSize: '0.84rem', fontWeight: '800', cursor: 'pointer' }}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  style={{ background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)', border: 'none', color: '#ffffff', borderRadius: '10px', padding: '10px 22px', fontSize: '0.88rem', fontWeight: '900', cursor: 'pointer', boxShadow: '0 4px 14px rgba(217, 119, 6, 0.4)' }}
                >
                  حفظ الشريك وتسجيل الكود ✓
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🌟 MODAL 3: OFFICIAL PRINTABLE B2B QUOTATION PREVIEW 🌟 */}
      {selectedLeadForQuote && (
        <div
          className="modal-overlay quotation-print-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setSelectedLeadForQuote(null)}
        >
          <div
            className="modal-content invoice-modal-container"
            style={{
              background: '#ffffff',
              color: '#1a1a1a',
              borderRadius: '20px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              boxShadow: '0 25px 60px rgba(0,0,0,0.9)',
              padding: '36px 32px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with Caturra Roastery Stamp */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #2C1810', paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <h2 style={{ margin: 0, color: '#2C1810', fontSize: '1.4rem', fontWeight: '900' }}>
                  محمصة ومطحنة كاتورا للقهوة المختصة
                </h2>
                <div style={{ fontSize: '0.78rem', color: '#666', marginTop: '4px' }}>
                  Caturra Coffee & Roasters • سجل تجاري: 148920 • بطاقة ضريبية: 582-934-211
                </div>
                <div style={{ fontSize: '0.78rem', color: '#666', marginTop: '2px' }}>
                  {contactInfo?.address || 'القاهرة، مصر الجديدة'} • هاتف المبيعات: {contactInfo?.phone || '01033144498'}
                </div>
              </div>
              <div style={{ textAlign: isRtl ? 'left' : 'right' }}>
                <span style={{ display: 'inline-block', background: 'linear-gradient(135deg, #2C1810 0%, #4A3220 100%)', color: '#FFF8EE', fontWeight: '900', padding: '4px 10px', borderRadius: '6px', fontSize: '0.82rem' }}>
                  عرض سعر وتوريد جملة (B2B)
                </span>
                <div style={{ fontSize: '0.78rem', color: '#555', marginTop: '6px', fontFamily: 'monospace' }}>
                  الكود: {selectedLeadForQuote.refCode}
                </div>
                <div style={{ fontSize: '0.74rem', color: '#777', marginTop: '2px' }}>
                  التاريخ: {new Date().toLocaleDateString('ar-EG')}
                </div>
              </div>
            </div>

            {/* Recipient Details */}
            <div style={{ background: '#FFF8EE', borderRadius: '12px', padding: '14px 18px', border: '1px solid #EDD9BD', marginBottom: '20px', fontSize: '0.86rem' }}>
              <div style={{ fontWeight: '900', color: '#4A3220', fontSize: '1rem', marginBottom: '4px' }}>
                السادة / {selectedLeadForQuote.companyName} المحترمون
              </div>
              <div style={{ color: '#555' }}>
                عناية: {selectedLeadForQuote.contactName || 'السيد مدير المشتريات والتشغيل'} • المدينة: {selectedLeadForQuote.city}
              </div>
              <div style={{ color: '#555' }}>
                النشاط: {businessTypeLabels[selectedLeadForQuote.businessType]?.ar || selectedLeadForQuote.businessType} • الهاتف: {selectedLeadForQuote.phone}
              </div>
            </div>

            {/* Wholesale Price Schedule */}
            <h4 style={{ margin: '0 0 10px', fontSize: '0.94rem', fontWeight: '900', color: '#4A3220' }}>
              جدول تسعير المحاصيل المختارة (أكياس 1 كجم بصمام حفظ النكهة):
            </h4>

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem', marginBottom: '20px' }}>
              <thead>
                <tr style={{ background: 'linear-gradient(135deg, #2C1810 0%, #4A3220 100%)', color: '#ffffff', textAlign: isRtl ? 'right' : 'left' }}>
                  <th style={{ padding: '8px 10px' }}>الصنف / المحصول</th>
                  <th style={{ padding: '8px 10px' }}>المعالجة والإيحاءات</th>
                  <th style={{ padding: '8px 10px' }}>الاستهلاك</th>
                  <th style={{ padding: '8px 10px', textAlign: 'center' }}>سعر الكيلو بالجملة</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #e5e5e5' }}>
                  <td style={{ padding: '10px 10px', fontWeight: '800' }}>مزيج كاتورا الذهبي للإسبريسو</td>
                  <td style={{ padding: '10px 10px', color: '#666' }}>شوكولاتة داكنة، كراميل، مكسرات محمصة (قوام كريمي كثيف)</td>
                  <td style={{ padding: '10px 10px' }}>إسبريسو ولاتيه</td>
                  <td style={{ padding: '10px 10px', fontWeight: '900', color: '#5B8C5A', textAlign: 'center' }}>840 ج.م / كجم</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e5e5e5' }}>
                  <td style={{ padding: '10px 10px', fontWeight: '800' }}>كولومبيا ويلا سوبريمو (Single Origin)</td>
                  <td style={{ padding: '10px 10px', color: '#666' }}>مغسولة: حمضيات لطيفة، سكر بني، شوكولاتة بالحليب</td>
                  <td style={{ padding: '10px 10px' }}>إسبريسو وفلتر</td>
                  <td style={{ padding: '10px 10px', fontWeight: '900', color: '#5B8C5A', textAlign: 'center' }}>980 ج.م / كجم</td>
                </tr>
                <tr style={{ borderBottom: '1px solid #e5e5e5' }}>
                  <td style={{ padding: '10px 10px', fontWeight: '800' }}>إثيوبيا يرجاشيفي مجففة (Specialty)</td>
                  <td style={{ padding: '10px 10px', color: '#666' }}>مجففة: ياسمين، توت، دراق، فاكهية عطرية فاخرة</td>
                  <td style={{ padding: '10px 10px' }}>V60 وتقطير</td>
                  <td style={{ padding: '10px 10px', fontWeight: '900', color: '#5B8C5A', textAlign: 'center' }}>1,150 ج.م / كجم</td>
                </tr>
              </tbody>
            </table>

            {/* Terms & Guarantees */}
            <div style={{ background: '#FFFDF9', border: '1px solid #EDD9BD', borderRadius: '10px', padding: '12px 16px', fontSize: '0.78rem', color: '#444', lineHeight: 1.6, marginBottom: '24px' }}>
              <div style={{ fontWeight: '900', color: '#4A3220', marginBottom: '4px' }}>شروط وضمانات التوريد الرسمية من كاتورا:</div>
              <div>• <strong>التحميص الطازج:</strong> يُحمّص البن طازجاً بعد تأكيد الطلب بحد أقصى 24-48 ساعة قبل الشحن.</div>
              <div>• <strong>ضمان الاسترجاع:</strong> حق استرجاع الأكياس المغلقة خلال 7 أيام من الاستلام حال عدم مطابقة البروفايل للعينات المتفق عليها.</div>
              <div>• <strong>شروط السداد:</strong> تحويل فوري عبر إنستاباي أو حساب البنك، أو تسهيل آجل بنكي بعد استكمال دورة الفواتير الأولى.</div>
              {selectedLeadForQuote.extractionSupport && <div>• <strong>الدعم الفني:</strong> تشمل الشراكة زيارة شهرية لمهندس تحميص كاتورا لضبط طاحونة ومكينة الإسبريسو وتدريب الباريستا.</div>}
            </div>

            {/* Signatures & Stamp */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '2px dashed #ccc', paddingTop: '16px' }}>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#666' }}>توقيع وقبول ممثل المنشأة:</div>
                <div style={{ height: '36px' }}></div>
                <div style={{ fontSize: '0.76rem', color: '#999' }}>الاسم والختم: ............................</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#4A3220' }}>إدارة مبيعات الجملة - محمصة كاتورا</div>
                <div style={{ marginTop: '6px', display: 'inline-block', border: '2px solid #96663B', borderRadius: '50%', width: '60px', height: '60px', lineHeight: '56px', color: '#96663B', fontWeight: '900', fontSize: '0.7rem' }}>
                  ختم معتمد
                </div>
              </div>
            </div>

            {/* Print Modal Footer */}
            <div className="no-print" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={() => setSelectedLeadForQuote(null)}
                style={{ background: '#eee', border: '1px solid #ccc', color: '#333', borderRadius: '8px', padding: '8px 16px', fontWeight: '800', cursor: 'pointer' }}
              >
                إغلاق
              </button>
              <button
                onClick={() => window.print()}
                style={{ background: 'linear-gradient(135deg, #96663B 0%, #7A5230 100%)', border: 'none', color: '#ffffff', borderRadius: '8px', padding: '8px 20px', fontWeight: '900', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Printer size={16} />
                <span>طباعة عرض السعر</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
