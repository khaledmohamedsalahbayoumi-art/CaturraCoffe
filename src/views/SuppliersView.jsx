import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Truck,
  Search,
  Plus,
  DollarSign,
  FileText,
  Phone,
  Mail,
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Eye,
  Printer,
  FileDown,
  ChevronLeft,
  X,
  Edit3,
  Trash2,
  Building,
  CreditCard,
  MessageCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import {
  exportSupplierStatementPdf,
  exportAllSuppliersPdf,
  printPurchaseInvoice
} from '../utils/exportUtils';
import { CustomerProductSelector } from '../components/CustomerProductSelector';

export const SuppliersView = () => {
  const {
    suppliers = [],
    purchases = [],
    products = [],
    addSupplier,
    updateSupplier,
    deleteSupplier,
    paySupplierInvoice,
    contactInfo,
    setActiveTab,
    confirmDialog
  } = useApp();

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDebt, setFilterDebt] = useState('all'); // 'all' | 'withDebt' | 'noDebt'
  const [selectedSupplierId, setSelectedSupplierId] = useState(null);

  // Modals
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [detailInvoice, setDetailInvoice] = useState(null);
  const [paymentModalInvoice, setPaymentModalInvoice] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash'); // 'cash' | 'instapay' | 'bank'
  const [paymentNotes, setPaymentNotes] = useState('');

  // Supplier Form
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    city: 'القاهرة',
    address: '',
    category: 'بن أخضر خام',
    taxNumber: '',
    suppliedProducts: [],
    notes: ''
  });

  // Calculate supplier metrics map
  const suppliersWithMetrics = useMemo(() => {
    return suppliers.map(sup => {
      const supPurchases = purchases.filter(p => (p.supplierName || '').trim().toLowerCase() === sup.name.trim().toLowerCase());
      const totalPurchases = supPurchases.reduce((sum, p) => sum + (Number(p.totalAmount) || 0), 0);
      const totalPaid = supPurchases.reduce((sum, p) => sum + (Number(p.paidAmount) || 0), 0);
      const totalDebt = supPurchases.reduce((sum, p) => sum + (Number(p.remainingAmount) || 0), 0);

      return {
        ...sup,
        purchases: supPurchases,
        invoicesCount: supPurchases.length,
        totalPurchases,
        totalPaid,
        totalDebt
      };
    });
  }, [suppliers, purchases]);

  // KPIs
  const totalSuppliersCount = suppliers.length;
  const grandPurchases = suppliersWithMetrics.reduce((sum, s) => sum + s.totalPurchases, 0);
  const grandPaid = suppliersWithMetrics.reduce((sum, s) => sum + s.totalPaid, 0);
  const grandDebt = suppliersWithMetrics.reduce((sum, s) => sum + s.totalDebt, 0);
  const suppliersWithDebtCount = suppliersWithMetrics.filter(s => s.totalDebt > 0).length;

  // Filtered Suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliersWithMetrics.filter(s => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.contactPerson && s.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.phone && s.phone.includes(searchQuery)) ||
        (s.category && s.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.city && s.city.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesDebt =
        filterDebt === 'all' ||
        (filterDebt === 'withDebt' ? s.totalDebt > 0 : s.totalDebt === 0);

      return matchesSearch && matchesDebt;
    });
  }, [suppliersWithMetrics, searchQuery, filterDebt]);

  // Current selected supplier
  const activeSupplier = useMemo(() => {
    return suppliersWithMetrics.find(s => s.id === selectedSupplierId) || null;
  }, [suppliersWithMetrics, selectedSupplierId]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setSupplierForm({
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      city: 'القاهرة',
      address: '',
      category: 'بن أخضر خام',
      taxNumber: '',
      suppliedProducts: [],
      notes: ''
    });
    setIsAddEditModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (sup, e) => {
    if (e) e.stopPropagation();
    setEditingSupplier(sup);
    setSupplierForm({
      name: sup.name || '',
      contactPerson: sup.contactPerson || '',
      phone: sup.phone || '',
      email: sup.email || '',
      city: sup.city || 'القاهرة',
      address: sup.address || '',
      category: sup.category || 'بن أخضر خام',
      taxNumber: sup.taxNumber || '',
      suppliedProducts: sup.suppliedProducts || [],
      notes: sup.notes || ''
    });
    setIsAddEditModalOpen(true);
  };

  // Submit Add / Edit Supplier
  const handleSupplierFormSubmit = (e) => {
    e.preventDefault();
    if (!supplierForm.name.trim()) {
      alert('يرجى إدخال اسم المورد أو الشركة');
      return;
    }

    if (editingSupplier) {
      updateSupplier(editingSupplier.id, supplierForm);
      alert('تم تحديث بيانات المورد بنجاح');
    } else {
      addSupplier(supplierForm);
      alert('تمت إضافة المورد الجديد بنجاح');
    }
    setIsAddEditModalOpen(false);
  };

  // Delete Supplier
  const handleDeleteSupplier = async (sup, e) => {
    if (e) e.stopPropagation();
    const hasInvoices = sup.invoicesCount > 0;
    const ok = await confirmDialog({
      title: 'حذف المورد',
      message: hasInvoices
        ? `المورد (${sup.name}) لديه ${sup.invoicesCount} فواتير مسجلة بالنظام. هل أنت متأكد من الحذف؟`
        : `هل أنت متأكد من حذف المورد (${sup.name})؟`,
      details: hasInvoices ? '⚠️ سيتم حذف المورد مع بقاء الفواتير المسجلة في الأرشيف.' : '',
      confirmText: 'نعم، حذف المورد',
      cancelText: 'إلغاء',
      type: 'danger'
    });

    if (!ok) return;

    deleteSupplier(sup.id);
    if (selectedSupplierId === sup.id) {
      setSelectedSupplierId(null);
    }
  };

  // Open Payment Modal for Invoice
  const handleOpenPaymentModal = (invoice, e) => {
    if (e) e.stopPropagation();
    setPaymentModalInvoice(invoice);
    setPaymentAmount(String(invoice.remainingAmount || ''));
    setPaymentMethod('cash');
    setPaymentNotes('');
  };

  // Submit Invoice Payment
  const handleSubmitPayment = (e) => {
    e.preventDefault();
    const amountNum = Number(paymentAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('يرجى إدخال مبلغ سداد صحيح أكبر من الصفر');
      return;
    }
    if (amountNum > paymentModalInvoice.remainingAmount) {
      alert(`المبلغ المدخل (${amountNum} ج.م) أكبر من المتبقي على الفاتورة (${paymentModalInvoice.remainingAmount} ج.م)`);
      return;
    }

    paySupplierInvoice(paymentModalInvoice.id, amountNum, paymentMethod, paymentNotes);
    alert(`تم تسجيل سداد دفعة بمبلغ ${amountNum.toLocaleString()} ج.م بنجاح وتحديث مديونية المورد!`);
    setPaymentModalInvoice(null);

    // If detail modal is also open on this invoice, update it
    if (detailInvoice && detailInvoice.id === paymentModalInvoice.id) {
      const updatedPur = purchases.find(p => p.id === paymentModalInvoice.id);
      if (updatedPur) {
        setDetailInvoice(updatedPur);
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      
      {/* KPI Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        
        {/* Total Suppliers */}
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid #96663B', background: '#FFFDF9', border: '1px solid #EDD9BD', boxShadow: 'var(--h-shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.84rem', color: '#8A654C' }}>إجمالي الموردين والشركات</span>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#FFF8EE', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#96663B', border: '1px solid #EDD9BD' }}>
              <Truck size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '900', color: '#4A3220', marginTop: '8px' }}>
            {totalSuppliersCount} <span style={{ fontSize: '0.86rem', fontWeight: '600', color: '#8A654C' }}>موردين</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#8A654C', marginTop: '6px' }}>
            محاصيل خضراء، معدات قهوة، تغليف
          </div>
        </div>

        {/* Total Purchases from Suppliers */}
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid #0284c7', background: '#FFFDF9', border: '1px solid #EDD9BD', boxShadow: 'var(--h-shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.84rem', color: '#8A654C' }}>إجمالي المشتريات والتوريدات</span>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#f0f9ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7', border: '1px solid #bae6fd' }}>
              <FileText size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '900', color: '#0284c7', marginTop: '8px' }}>
            {grandPurchases.toLocaleString()} <span style={{ fontSize: '0.86rem', fontWeight: '600', color: '#8A654C' }}>ج.م</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#8A654C', marginTop: '6px' }}>
            إجمالي كافة فواتير التوريد المسجلة
          </div>
        </div>

        {/* Total Paid to Suppliers */}
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid #5B8C5A', background: '#FFFDF9', border: '1px solid #EDD9BD', boxShadow: 'var(--h-shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.84rem', color: '#8A654C' }}>المبالغ المسددة للموردين</span>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#5B8C5A', border: '1px solid #bbf7d0' }}>
              <CheckCircle size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '900', color: '#5B8C5A', marginTop: '8px' }}>
            {grandPaid.toLocaleString()} <span style={{ fontSize: '0.86rem', fontWeight: '600', color: '#8A654C' }}>ج.م</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#3d6a3c', marginTop: '6px', fontWeight: '700' }}>
            دفوعات نقدية ومحافظ مسددة
          </div>
        </div>

        {/* Total Outstanding Debts to Suppliers */}
        <div
          className="card"
          style={{
            padding: '20px',
            borderLeft: `4px solid ${grandDebt > 0 ? '#dc2626' : '#5B8C5A'}`,
            background: '#FFFDF9',
            border: '1px solid #EDD9BD',
            boxShadow: 'var(--h-shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: '700', color: grandDebt > 0 ? '#dc2626' : '#8A654C' }}>
              إجمالي المديونيات المستحقة للموردين
            </span>
            <span className={`badge ${grandDebt > 0 ? 'badge-danger' : 'badge-mint'}`}>
              {suppliersWithDebtCount > 0 ? `${suppliersWithDebtCount} موردين آجل` : 'خالص ✓'}
            </span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '900', color: grandDebt > 0 ? '#dc2626' : '#5B8C5A', marginTop: '8px' }}>
            {grandDebt.toLocaleString()} <span style={{ fontSize: '0.86rem', fontWeight: '600', color: '#8A654C' }}>ج.م</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: grandDebt > 0 ? '#dc2626' : '#3d6a3c', marginTop: '6px', fontWeight: '700' }}>
            {grandDebt > 0 ? 'مبالغ مستحقة السداد للموردين' : 'جميع حسابات الموردين مسددة'}
          </div>
        </div>

      </div>

      {/* Main Content Area: Split View or Detail View */}
      {activeSupplier ? (
        /* ================= DETAIL VIEW FOR SELECTED SUPPLIER ================= */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Back Navigation Bar & Supplier Actions */}
          <div
            className="card"
            style={{
              padding: '16px 20px',
              borderRadius: '16px',
              border: '1px solid var(--border-mint)',
              background: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <button
                onClick={() => setSelectedSupplierId(null)}
                className="btn btn-outline"
                style={{ height: '38px', padding: '0 14px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <ArrowRight size={16} />
                <span>العودة لدليل الموردين</span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--mint-50)', color: 'var(--mint-800)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Truck size={22} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: '900', color: 'var(--mint-900)', margin: 0 }}>
                    {activeSupplier.name}
                  </h2>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
                    <span className="badge badge-mint">{activeSupplier.category}</span>
                    {activeSupplier.contactPerson && <span>المسؤول: {activeSupplier.contactPerson}</span>}
                    {activeSupplier.city && <span>• {activeSupplier.city}</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Export & Actions for this supplier */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {activeSupplier.phone && (
                <a
                  href={`https://wa.me/2${activeSupplier.phone.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-outline"
                  style={{ height: '38px', padding: '0 12px', borderRadius: '10px', color: '#16a34a', borderColor: '#bbf7d0', background: '#f0fdf4', display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
                >
                  <MessageCircle size={16} />
                  <span>واتساب</span>
                </a>
              )}

              {/* Export Supplier Statement PDF */}
              <button
                onClick={() => exportSupplierStatementPdf(activeSupplier, activeSupplier.purchases, contactInfo)}
                className="btn btn-outline"
                style={{ height: '38px', padding: '0 14px', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#ecfdf5', borderColor: '#a7f3d0', color: 'var(--mint-800)', fontWeight: '800' }}
                title="تصدير كشف حساب مورد تفصيلي جاهز للطباعة أو الحفظ كـ PDF"
              >
                <FileDown size={16} />
                <span>تصدير كشف الحساب PDF</span>
              </button>

              {/* Edit Supplier */}
              <button
                onClick={(e) => handleOpenEdit(activeSupplier, e)}
                className="btn btn-outline"
                style={{ height: '38px', padding: '0 12px', borderRadius: '10px' }}
              >
                <Edit3 size={15} />
                <span>تعديل البيانات</span>
              </button>
            </div>
          </div>

          {/* Supplier Info & Financial Snapshot Box */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            
            {/* Contact & Registration Info */}
            <div className="card" style={{ padding: '18px', background: '#ffffff', borderRadius: '14px', border: '1px solid var(--border-mint)' }}>
              <h3 style={{ fontSize: '0.92rem', fontWeight: '800', color: 'var(--mint-900)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building size={16} style={{ color: 'var(--mint-600)' }} />
                <span>بيانات التواصل والملف الضريبي</span>
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.86rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>رقم الهاتف / الموبايل:</span>
                  <strong dir="ltr" style={{ color: 'var(--mint-900)' }}>{activeSupplier.phone || 'غير مسجل'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>البريد الإلكتروني:</span>
                  <span>{activeSupplier.email || 'غير مسجل'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>العنوان / المستودع:</span>
                  <span>{activeSupplier.address || activeSupplier.city || 'غير محدد'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
                  <span style={{ color: 'var(--text-muted)' }}>الرقم الضريبي:</span>
                  <span>{activeSupplier.taxNumber || 'غير مسجل'}</span>
                </div>
                {activeSupplier.notes && (
                  <div style={{ marginTop: '4px', background: 'var(--mint-50)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.82rem', color: 'var(--mint-900)' }}>
                    <strong>ملاحظات:</strong> {activeSupplier.notes}
                  </div>
                )}
              </div>
            </div>

            {/* Supplied Products & Tools */}
            <CustomerProductSelector
              products={products}
              selectedProductIds={activeSupplier.suppliedProducts || []}
              readOnly={true}
              onOpenEdit={() => handleOpenEdit(activeSupplier)}
            />

            {/* Financial Status for this Supplier */}
            <div className="card" style={{ padding: '18px', background: '#ffffff', borderRadius: '14px', border: '1px solid var(--border-mint)' }}>
              <h3 style={{ fontSize: '0.92rem', fontWeight: '800', color: 'var(--mint-900)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <DollarSign size={16} style={{ color: 'var(--mint-600)' }} />
                <span>الموقف المالي وحساب الآجل</span>
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center' }}>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>إجمالي التوريدات</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: '900', color: '#0369a1', marginTop: '4px' }}>
                    {activeSupplier.totalPurchases.toLocaleString()} ج.م
                  </div>
                </div>
                <div style={{ background: '#ecfdf5', padding: '12px', borderRadius: '10px' }}>
                  <div style={{ fontSize: '0.74rem', color: '#047857' }}>المبلغ المسدد</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: '900', color: '#15803d', marginTop: '4px' }}>
                    {activeSupplier.totalPaid.toLocaleString()} ج.م
                  </div>
                </div>
                <div style={{ background: activeSupplier.totalDebt > 0 ? '#fef2f2' : '#f0fdf4', padding: '12px', borderRadius: '10px', border: activeSupplier.totalDebt > 0 ? '1px solid #fecaca' : 'none' }}>
                  <div style={{ fontSize: '0.74rem', color: activeSupplier.totalDebt > 0 ? '#b91c1c' : '#16a34a' }}>المديونية المتبقية</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: '900', color: activeSupplier.totalDebt > 0 ? '#dc2626' : '#16a34a', marginTop: '4px' }}>
                    {activeSupplier.totalDebt.toLocaleString()} ج.م
                  </div>
                </div>
              </div>

              {activeSupplier.totalDebt > 0 && (
                <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '8px', background: '#fffbeb', border: '1px solid #fde68a', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: '#92400e' }}>
                  <AlertTriangle size={16} />
                  <span>توجد مديونية مستحقة لصالح هذا المورد. يمكنك سداد دفعات جزئية أو كاملة مباشرة من الفواتير بالأسفل.</span>
                </div>
              )}
            </div>

          </div>

          {/* Supplier Invoices Table */}
          <div className="card" style={{ padding: '20px', borderRadius: '16px', background: '#ffffff', border: '1px solid var(--border-mint)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--mint-900)' }}>
                  سجل فواتير التوريد الخاصة بالمورد ({activeSupplier.purchases.length} فاتورة)
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  يمكنك سداد دفعات جزئية من أي فاتورة، معاينة الأصناف، وطباعتها
                </span>
              </div>
            </div>

            <div className="table-responsive">
              <table className="table" style={{ width: '100%', fontSize: '0.88rem' }}>
                <thead>
                  <tr>
                    <th>رقم الفاتورة</th>
                    <th>التاريخ</th>
                    <th>الأصناف والكميات</th>
                    <th>إجمالي الفاتورة</th>
                    <th>المسدد</th>
                    <th>المتبقي (مديونية)</th>
                    <th>حالة السداد</th>
                    <th style={{ textAlign: 'center' }}>إجراءات الفاتورة</th>
                  </tr>
                </thead>
                <tbody>
                  {activeSupplier.purchases.map(pur => (
                    <tr key={pur.id}>
                      <td>
                        <strong style={{ color: 'var(--mint-900)' }}>{pur.invoiceNumber}</strong>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.84rem' }}>
                        {pur.date}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          {(pur.items || []).slice(0, 2).map((it, idx) => (
                            <span key={idx}>• {it.name} ({it.qty} {it.unitType === 'weight' ? 'كجم' : 'ق'})</span>
                          ))}
                          {(pur.items || []).length > 2 && (
                            <span style={{ fontSize: '0.74rem', color: 'var(--mint-700)', fontWeight: '700' }}>
                              + {(pur.items || []).length - 2} أصناف أخرى
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <strong style={{ color: 'var(--mint-900)' }}>
                          {Number(pur.totalAmount || 0).toLocaleString()} ج.م
                        </strong>
                      </td>
                      <td style={{ color: '#16a34a', fontWeight: '700' }}>
                        {Number(pur.paidAmount || 0).toLocaleString()} ج.م
                      </td>
                      <td>
                        {Number(pur.remainingAmount || 0) > 0 ? (
                          <span style={{ color: '#dc2626', fontWeight: '800' }}>
                            {Number(pur.remainingAmount).toLocaleString()} ج.م
                          </span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>0 ج.م</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${pur.paymentStatus === 'paid' ? 'badge-mint' : (pur.paymentStatus === 'partial' ? 'badge-warning' : 'badge-danger')}`}>
                          {pur.paymentStatus === 'paid' ? 'مسددة بالكامل' : (pur.paymentStatus === 'partial' ? 'سداد جزئي' : 'آجلة / غير مسددة')}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          
                          {/* Settle partial/full payment button */}
                          {Number(pur.remainingAmount || 0) > 0 && (
                            <button
                              onClick={(e) => handleOpenPaymentModal(pur, e)}
                              className="btn btn-primary"
                              style={{ padding: '5px 10px', fontSize: '0.76rem', borderRadius: '7px', display: 'flex', alignItems: 'center', gap: '4px' }}
                              title="تسجيل دفعة سداد نقدية أو محفظة لهذه الفاتورة"
                            >
                              <CreditCard size={13} />
                              <span>سداد دفعة</span>
                            </button>
                          )}

                          {/* Preview Invoice items */}
                          <button
                            onClick={() => setDetailInvoice(pur)}
                            className="btn btn-outline"
                            style={{ padding: '5px 10px', fontSize: '0.76rem', borderRadius: '7px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            title="معاينة كافة أصناف وتفاصيل الفاتورة"
                          >
                            <Eye size={13} />
                            <span>معاينة</span>
                          </button>

                          {/* Print Invoice */}
                          <button
                            onClick={() => printPurchaseInvoice(pur, contactInfo)}
                            className="btn btn-outline"
                            style={{ padding: '5px 10px', fontSize: '0.76rem', borderRadius: '7px', display: 'flex', alignItems: 'center', gap: '4px' }}
                            title="طباعة فاتورة التوريد كـ PDF"
                          >
                            <Printer size={13} />
                            <span>طباعة</span>
                          </button>

                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {activeSupplier.purchases.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  لا توجد فواتير توريد مسجلة لهذا المورد حتى الآن. يمكنك إدخال فاتورة من صفحة المشتريات والتوريد.
                </div>
              )}
            </div>
          </div>

        </div>
      ) : (
        /* ================= LIST VIEW: ALL SUPPLIERS ================= */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Action & Filter Toolbar */}
          <div
            className="card"
            style={{
              padding: '14px 18px',
              borderRadius: '16px',
              background: '#ffffff',
              border: '1px solid var(--border-mint)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}
          >
            {/* Search Input */}
            <div style={{ position: 'relative', width: '280px' }}>
              <Search size={17} color="var(--text-muted)" style={{ position: 'absolute', right: '12px', top: '12px' }} />
              <input
                type="text"
                placeholder="بحث باسم المورد، الهاتف، التصنيف..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input"
                style={{ paddingRight: '36px', height: '40px', borderRadius: '10px' }}
              />
            </div>

            {/* Filter Pills (All / With Debt / Settled) */}
            <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: '4px', borderRadius: '12px', border: '1px solid #e2e8f0', gap: '4px' }}>
              <button
                onClick={() => setFilterDebt('all')}
                style={{
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 14px',
                  fontSize: '0.82rem',
                  fontWeight: filterDebt === 'all' ? '800' : '600',
                  cursor: 'pointer',
                  background: filterDebt === 'all' ? 'var(--mint-600)' : 'transparent',
                  color: filterDebt === 'all' ? '#fff' : 'var(--text-secondary)'
                }}
              >
                كافة الموردين ({suppliers.length})
              </button>
              <button
                onClick={() => setFilterDebt('withDebt')}
                style={{
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 14px',
                  fontSize: '0.82rem',
                  fontWeight: filterDebt === 'withDebt' ? '800' : '600',
                  cursor: 'pointer',
                  background: filterDebt === 'withDebt' ? '#dc2626' : 'transparent',
                  color: filterDebt === 'withDebt' ? '#fff' : 'var(--text-secondary)'
                }}
              >
                علينا مديونية آجلة ({suppliersWithDebtCount})
              </button>
              <button
                onClick={() => setFilterDebt('noDebt')}
                style={{
                  border: 'none',
                  borderRadius: '8px',
                  padding: '6px 14px',
                  fontSize: '0.82rem',
                  fontWeight: filterDebt === 'noDebt' ? '800' : '600',
                  cursor: 'pointer',
                  background: filterDebt === 'noDebt' ? '#16a34a' : 'transparent',
                  color: filterDebt === 'noDebt' ? '#fff' : 'var(--text-secondary)'
                }}
              >
                حسابات خالصة ({suppliers.length - suppliersWithDebtCount})
              </button>
            </div>

            {/* Actions: Export PDF, CSV, Add Supplier */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <button
                onClick={() => exportAllSuppliersPdf(suppliers, purchases, contactInfo)}
                className="btn btn-outline"
                style={{ height: '40px', padding: '0 14px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800', background: '#ecfdf5', borderColor: '#a7f3d0', color: 'var(--mint-800)' }}
                title="تصدير كشف شامل لكافة الموردين والمديونيات كملف PDF"
              >
                <FileDown size={16} />
                <span>تصدير كشف PDF</span>
              </button>

              <button
                onClick={handleOpenAdd}
                className="btn btn-primary"
                style={{ height: '40px', padding: '0 16px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '800' }}
              >
                <Plus size={16} />
                <span>إضافة مورد جديد</span>
              </button>
            </div>
          </div>

          {/* Suppliers Cards Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {filteredSuppliers.map(sup => (
              <div
                key={sup.id}
                className="card"
                onClick={() => setSelectedSupplierId(sup.id)}
                style={{
                  padding: '20px',
                  borderRadius: '16px',
                  background: '#ffffff',
                  border: sup.totalDebt > 0 ? '1.5px solid #fecaca' : '1px solid var(--border-mint)',
                  boxShadow: '0 4px 14px rgba(4, 136, 75, 0.05)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '14px'
                }}
              >
                {/* Supplier Header */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--mint-50)', color: 'var(--mint-800)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Truck size={22} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.05rem', fontWeight: '900', color: 'var(--mint-900)', margin: 0 }}>
                          {sup.name}
                        </h3>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {sup.contactPerson ? `المسؤول: ${sup.contactPerson}` : (sup.city || 'مورد بن معتمد')}
                        </div>
                      </div>
                    </div>

                    <span className={`badge ${sup.totalDebt > 0 ? 'badge-danger' : 'badge-mint'}`}>
                      {sup.totalDebt > 0 ? `مديونية: ${sup.totalDebt.toLocaleString()} ج.م` : 'خالص ✓'}
                    </span>
                  </div>

                  {/* Supplier Category & Contact */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', flexWrap: 'wrap', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    <span className="badge badge-mint">{sup.category || 'عام'}</span>
                    {sup.phone && (
                      <span dir="ltr" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '700' }}>
                        <Phone size={13} style={{ color: 'var(--mint-600)' }} />
                        {sup.phone}
                      </span>
                    )}
                    {sup.city && (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <MapPin size={13} style={{ color: 'var(--mint-600)' }} />
                        {sup.city}
                      </span>
                    )}
                  </div>
                </div>

                {/* Financial Overview inside Card */}
                <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>الفواتير: </span>
                    <strong>{sup.invoicesCount}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>المشتريات: </span>
                    <strong style={{ color: '#0369a1' }}>{sup.totalPurchases.toLocaleString()} ج.م</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>المسدد: </span>
                    <strong style={{ color: '#16a34a' }}>{sup.totalPaid.toLocaleString()} ج.م</strong>
                  </div>
                </div>

                {/* Card Action Buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                  <button
                    onClick={() => setSelectedSupplierId(sup.id)}
                    className="btn btn-outline"
                    style={{ padding: '6px 14px', fontSize: '0.82rem', borderRadius: '8px', color: 'var(--mint-800)', borderColor: 'var(--mint-300)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Eye size={14} />
                    <span>عرض الفواتير وكشف الحساب</span>
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button
                      onClick={(e) => handleOpenEdit(sup, e)}
                      className="btn-icon"
                      style={{ width: '32px', height: '32px', borderRadius: '8px' }}
                      title="تعديل بيانات المورد"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      onClick={(e) => handleDeleteSupplier(sup, e)}
                      className="btn-icon"
                      style={{ width: '32px', height: '32px', borderRadius: '8px', color: '#dc2626' }}
                      title="حذف المورد"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>

          {filteredSuppliers.length === 0 && (
            <div style={{ textAlign: 'center', padding: '50px', background: '#ffffff', borderRadius: '16px', border: '1px solid var(--border-mint)', color: 'var(--text-muted)' }}>
              <Truck size={42} style={{ color: 'var(--mint-400)', marginBottom: '12px' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--mint-900)' }}>لا يوجد موردين مطابقين للبحث</h3>
              <p style={{ fontSize: '0.86rem', marginTop: '6px' }}>يمكنك إضافة مورد جديد بالنقر على زر "إضافة مورد جديد" بالأعلى.</p>
            </div>
          )}

        </div>
      )}

      {/* ================= MODAL: ADD / EDIT SUPPLIER ================= */}
      {isAddEditModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddEditModalOpen(false)}>
          <div
            className="modal-content"
            style={{
              maxWidth: '560px',
              padding: '26px 28px',
              borderRadius: '20px',
              background: '#ffffff',
              border: '1.5px solid #E8D5C4',
              boxShadow: '0 25px 60px rgba(45, 24, 16, 0.25)',
              maxHeight: '92vh',
              overflowY: 'auto'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', borderBottom: '1.5px solid #F0E6DD', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#FEF3C7', border: '1.5px solid #FDE68A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#92400E' }}>
                  <Truck size={22} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: '900', color: '#2D1810', margin: 0 }}>
                    {editingSupplier ? 'تعديل بيانات المورد' : 'إضافة مورد جديد لقائمة التوريد'}
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#8C7A6B', margin: '3px 0 0 0' }}>
                    تسجيل بيانات شركة التوريد أو المستورد وربطها بسجلات المشتريات والمستودع
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsAddEditModalOpen(false)}
                className="btn-icon"
                style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#FAF7F2', border: '1px solid #E8D5C4', color: '#6F4E37', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSupplierFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Category Selector Card (Like B2B/B2C in Customer Form) */}
              <div style={{ background: '#FAF7F2', border: '1.5px solid #E8D5C4', borderRadius: '14px', padding: '12px 14px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '800', color: '#2D1810', marginBottom: '8px' }}>
                  تصنيف ونشاط التوريد *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                  {[
                    { id: 'بن أخضر خام', label: 'بن أخضر ومحاصيل', icon: '☕' },
                    { id: 'معدات وأدوات قهوة', label: 'معدات وأدوات ترشيح', icon: '🛠️' },
                    { id: 'تغليف ومطبوعات', label: 'أكياس وتغليف وصمامات', icon: '📦' },
                    { id: 'خدمات ولوجستيات', label: 'شحن وخدمات لوجستية', icon: '🚚' },
                    { id: 'مورد عام', label: 'مورد عام وخدمات', icon: '🏢' }
                  ].map(cat => {
                    const isSelected = supplierForm.category === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSupplierForm(prev => ({ ...prev, category: cat.id }))}
                        style={{
                          padding: '9px 10px',
                          borderRadius: '10px',
                          border: isSelected ? '2px solid #8B5E34' : '1.5px solid #D6C7B8',
                          background: isSelected ? '#FEF3C7' : '#ffffff',
                          color: isSelected ? '#92400E' : '#6B7280',
                          fontWeight: isSelected ? '900' : '700',
                          fontSize: '0.82rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          boxShadow: isSelected ? '0 2px 6px rgba(139, 94, 52, 0.15)' : 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Company / Supplier Name */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: '800', color: '#2D1810' }}>اسم الشركة أو المورد *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: شركة النيل لاستيراد البن الأخضر والمحاصيل أو San Rais"
                  value={supplierForm.name}
                  onChange={e => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  className="form-input"
                  style={{ background: '#FAF7F2', borderColor: '#D6C7B8', borderRadius: '10px' }}
                />
              </div>

              {/* Contact Person & Phone */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: '800', color: '#2D1810' }}>المسؤول / جهة الاتصال</label>
                  <input
                    type="text"
                    placeholder="مثال: م. طارق العسقلاني"
                    value={supplierForm.contactPerson}
                    onChange={e => setSupplierForm({ ...supplierForm, contactPerson: e.target.value })}
                    className="form-input"
                    style={{ background: '#FAF7F2', borderColor: '#D6C7B8', borderRadius: '10px' }}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: '800', color: '#2D1810' }}>رقم الهاتف / الموبايل</label>
                  <input
                    type="text"
                    dir="ltr"
                    placeholder="01XXXXXXXXX"
                    value={supplierForm.phone}
                    onChange={e => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                    className="form-input"
                    style={{ background: '#FAF7F2', borderColor: '#D6C7B8', borderRadius: '10px' }}
                  />
                </div>
              </div>

              {/* City & Detailed Address */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: '800', color: '#2D1810' }}>المدينة / المحافظة</label>
                  <input
                    type="text"
                    placeholder="القاهرة، الإسكندرية..."
                    value={supplierForm.city}
                    onChange={e => setSupplierForm({ ...supplierForm, city: e.target.value })}
                    className="form-input"
                    style={{ background: '#FAF7F2', borderColor: '#D6C7B8', borderRadius: '10px' }}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: '800', color: '#2D1810' }}>العنوان والمستودع بالتفصيل</label>
                  <input
                    type="text"
                    placeholder="الميناء، المنطقة الصناعية، الشارع..."
                    value={supplierForm.address}
                    onChange={e => setSupplierForm({ ...supplierForm, address: e.target.value })}
                    className="form-input"
                    style={{ background: '#FAF7F2', borderColor: '#D6C7B8', borderRadius: '10px' }}
                  />
                </div>
              </div>

              {/* Email & Tax Number */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: '800', color: '#2D1810' }}>البريد الإلكتروني</label>
                  <input
                    type="email"
                    dir="ltr"
                    placeholder="supplier@domain.com"
                    value={supplierForm.email}
                    onChange={e => setSupplierForm({ ...supplierForm, email: e.target.value })}
                    className="form-input"
                    style={{ background: '#FAF7F2', borderColor: '#D6C7B8', borderRadius: '10px' }}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: '800', color: '#2D1810' }}>الرقم الضريبي (اختياري)</label>
                  <input
                    type="text"
                    placeholder="582-934-211"
                    value={supplierForm.taxNumber}
                    onChange={e => setSupplierForm({ ...supplierForm, taxNumber: e.target.value })}
                    className="form-input"
                    style={{ background: '#FAF7F2', borderColor: '#D6C7B8', borderRadius: '10px' }}
                  />
                </div>
              </div>

              {/* 📦 Dedicated Products Selection (Same as Customer Form!) 📦 */}
              <CustomerProductSelector
                products={products}
                selectedProductIds={supplierForm.suppliedProducts || []}
                onChange={(ids) => setSupplierForm(prev => ({ ...prev, suppliedProducts: ids }))}
              />

              {/* Supply Notes & Terms */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: '800', color: '#2D1810' }}>ملاحظات وشروط التوريد (اختياري)</label>
                <textarea
                  rows="2"
                  placeholder="أوقات التوريد، تسهيلات الدفع، جودة المحاصيل، فترات السماح..."
                  value={supplierForm.notes}
                  onChange={e => setSupplierForm({ ...supplierForm, notes: e.target.value })}
                  className="form-textarea"
                  style={{ background: '#FAF7F2', borderColor: '#D6C7B8', borderRadius: '10px', resize: 'vertical' }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px', borderTop: '1.5px solid #F0E6DD', paddingTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="btn btn-outline"
                  style={{ borderRadius: '10px', padding: '10px 20px', fontWeight: '800', borderColor: '#D6C7B8', color: '#6F4E37' }}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    borderRadius: '10px',
                    padding: '10px 26px',
                    background: 'linear-gradient(135deg, #8B5E34, #6F4E37)',
                    borderColor: '#6F4E37',
                    color: '#ffffff',
                    fontWeight: '900',
                    boxShadow: '0 4px 14px rgba(111, 78, 55, 0.35)'
                  }}
                >
                  {editingSupplier ? 'حفظ تعديلات المورد ✓' : 'حفظ وإضافة المورد ✓'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: PARTIAL / FULL PAYMENT ON INVOICE ================= */}
      {paymentModalInvoice && (
        <div className="modal-overlay" onClick={() => setPaymentModalInvoice(null)}>
          <div className="modal-content" style={{ maxWidth: '480px', padding: '24px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CreditCard size={19} style={{ color: '#16a34a' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--mint-900)', margin: 0 }}>
                  تسجيل دفعة سداد لفاتورة #{paymentModalInvoice.invoiceNumber}
                </h3>
              </div>
              <button onClick={() => setPaymentModalInvoice(null)} className="btn-icon">
                <X size={16} />
              </button>
            </div>

            <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '10px', marginBottom: '16px', fontSize: '0.86rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>المورد:</span>
                <strong>{paymentModalInvoice.supplierName}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>إجمالي قيمة الفاتورة:</span>
                <strong style={{ color: 'var(--mint-900)' }}>{paymentModalInvoice.totalAmount.toLocaleString()} ج.م</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>المسدد حتى الآن:</span>
                <strong style={{ color: '#16a34a' }}>{paymentModalInvoice.paidAmount.toLocaleString()} ج.م</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px dashed #cbd5e1', paddingTop: '6px', marginTop: '6px' }}>
                <span style={{ color: '#dc2626', fontWeight: '700' }}>المتبقي كمديونية:</span>
                <strong style={{ color: '#dc2626', fontSize: '1.05rem' }}>{paymentModalInvoice.remainingAmount.toLocaleString()} ج.م</strong>
              </div>
            </div>

            <form onSubmit={handleSubmitPayment} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              <div className="form-group" style={{ margin: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <label className="form-label" style={{ fontWeight: '700', margin: 0 }}>مبلغ الدفعة المسددة (ج.م) *</label>
                  <button
                    type="button"
                    onClick={() => setPaymentAmount(String(paymentModalInvoice.remainingAmount))}
                    style={{ background: 'none', border: 'none', color: 'var(--mint-700)', fontSize: '0.78rem', fontWeight: '800', cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    سداد المتبقي كاملاً ({paymentModalInvoice.remainingAmount} ج.م)
                  </button>
                </div>
                <input
                  type="number"
                  required
                  min="1"
                  max={paymentModalInvoice.remainingAmount}
                  step="any"
                  placeholder="0.00"
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(e.target.value)}
                  className="form-input"
                  style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--mint-900)' }}
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: '700' }}>طريقة سداد الدفعة</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {[
                    { id: 'cash', label: 'نقدي (كاش)' },
                    { id: 'instapay', label: 'إنستاباي / محفظة' },
                    { id: 'bank', label: 'تحويل بنكي' }
                  ].map(method => (
                    <button
                      key={method.id}
                      type="button"
                      onClick={() => setPaymentMethod(method.id)}
                      style={{
                        padding: '8px',
                        borderRadius: '8px',
                        border: paymentMethod === method.id ? '2px solid var(--mint-600)' : '1px solid #cbd5e1',
                        background: paymentMethod === method.id ? 'var(--mint-50)' : '#fff',
                        color: paymentMethod === method.id ? 'var(--mint-900)' : 'var(--text-secondary)',
                        fontWeight: paymentMethod === method.id ? '800' : '600',
                        fontSize: '0.8rem',
                        cursor: 'pointer'
                      }}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">ملاحظات السداد (اختياري)</label>
                <input
                  type="text"
                  placeholder="مثال: سداد نقدي للمندوب / رقم إيصال إنستاباي..."
                  value={paymentNotes}
                  onChange={e => setPaymentNotes(e.target.value)}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px', borderTop: '1px solid var(--border-light)', paddingTop: '14px' }}>
                <button type="button" onClick={() => setPaymentModalInvoice(null)} className="btn btn-outline">
                  إلغاء
                </button>
                <button type="submit" className="btn btn-primary" style={{ padding: '9px 24px', fontWeight: '800' }}>
                  تأكيد سداد الدفعة
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: INVOICE ITEMS & DETAILS PREVIEW ================= */}
      {detailInvoice && (
        <div className="modal-overlay" onClick={() => setDetailInvoice(null)}>
          <div className="modal-content" style={{ maxWidth: '600px', padding: '24px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={20} style={{ color: 'var(--mint-600)' }} />
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--mint-900)', margin: 0 }}>
                  تفاصيل فاتورة التوريد #{detailInvoice.invoiceNumber}
                </h3>
              </div>
              <button onClick={() => setDetailInvoice(null)} className="btn-icon">
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              <div style={{ background: '#f8fafc', padding: '12px 16px', borderRadius: '12px', fontSize: '0.86rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div>المورد: <strong>{detailInvoice.supplierName}</strong></div>
                <div>تاريخ الفاتورة: <strong>{detailInvoice.date}</strong></div>
                <div>
                  حالة السداد: 
                  <span className={`badge ${detailInvoice.paymentStatus === 'paid' ? 'badge-mint' : (detailInvoice.paymentStatus === 'partial' ? 'badge-warning' : 'badge-danger')}`} style={{ marginRight: '6px' }}>
                    {detailInvoice.paymentStatus === 'paid' ? 'مسددة بالكامل' : (detailInvoice.paymentStatus === 'partial' ? 'سداد جزئي' : 'آجلة')}
                  </span>
                </div>
                {detailInvoice.notes && <div>ملاحظات: {detailInvoice.notes}</div>}
              </div>

              <h4 style={{ fontSize: '0.92rem', fontWeight: '800', color: 'var(--mint-900)', margin: '4px 0 0 0' }}>
                الأصناف الموردة بالفاتورة:
              </h4>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
                {(detailInvoice.items || []).map((it, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 14px',
                      background: 'var(--mint-50)',
                      borderRadius: '10px',
                      fontSize: '0.86rem'
                    }}
                  >
                    <div>
                      <strong style={{ color: 'var(--mint-900)' }}>{it.name}</strong>
                      <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        الكمية: {it.qty} {it.unitType === 'weight' ? 'كجم' : 'قطعة'} {it.expiryDate ? `• صلاحية: ${it.expiryDate}` : ''}
                      </div>
                    </div>
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>التكلفة: {it.costPrice} ج.م</div>
                      <div style={{ fontWeight: '800', color: 'var(--mint-800)', fontSize: '0.95rem' }}>
                        {((Number(it.costPrice) || 0) * (Number(it.qty) || 0)).toLocaleString()} ج.م
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Payments History on this invoice */}
              {detailInvoice.payments && detailInvoice.payments.length > 0 && (
                <div>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: '800', color: '#1e293b', marginBottom: '6px' }}>
                    سجل الدفعات المسددة:
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {detailInvoice.payments.map((p, pIdx) => (
                      <div key={pIdx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#f1f5f9', borderRadius: '6px', fontSize: '0.8rem' }}>
                        <span>{p.date} • {p.paymentMethod === 'cash' ? 'نقدي' : p.paymentMethod === 'instapay' ? 'إنستاباي' : 'تحويل'} ({p.notes || 'سداد'})</span>
                        <strong style={{ color: '#16a34a' }}>{Number(p.amount).toLocaleString()} ج.م</strong>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Financial Totals */}
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem', marginBottom: '4px' }}>
                  <span>إجمالي الفاتورة:</span>
                  <strong style={{ color: 'var(--mint-900)' }}>{Number(detailInvoice.totalAmount).toLocaleString()} ج.م</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.92rem', color: '#16a34a', marginBottom: '4px' }}>
                  <span>المبلغ المسدد:</span>
                  <strong>{Number(detailInvoice.paidAmount).toLocaleString()} ج.م</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: '900', borderTop: '1px solid #cbd5e1', paddingTop: '6px', color: Number(detailInvoice.remainingAmount) > 0 ? '#dc2626' : '#16a34a' }}>
                  <span>المتبقي (المديونية):</span>
                  <span>{Number(detailInvoice.remainingAmount).toLocaleString()} ج.م</span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                {Number(detailInvoice.remainingAmount || 0) > 0 ? (
                  <button
                    onClick={() => {
                      const cur = detailInvoice;
                      setDetailInvoice(null);
                      handleOpenPaymentModal(cur);
                    }}
                    className="btn btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <CreditCard size={15} />
                    <span>سداد دفعة جديدة</span>
                  </button>
                ) : (
                  <span style={{ fontSize: '0.85rem', color: '#16a34a', fontWeight: '800' }}>✓ الفاتورة مسددة بالكامل</span>
                )}

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => printPurchaseInvoice(detailInvoice, contactInfo)}
                    className="btn btn-outline"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Printer size={15} />
                    <span>طباعة الفاتورة</span>
                  </button>
                  <button onClick={() => setDetailInvoice(null)} className="btn btn-outline">
                    إغلاق
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
};
