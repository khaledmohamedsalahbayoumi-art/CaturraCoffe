import React, { useState } from 'react';
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
  X
} from 'lucide-react';
import { DebtSettlementModal } from '../components/DebtSettlementModal';
import { exportCustomersToPdf } from '../utils/exportUtils';

export const CustomersView = () => {
  const {
    customers,
    invoices,
    openInvoiceModal,
    addCustomer,
    updateCustomer,
    settleCustomerDebt,
    contactInfo
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterDebt, setFilterDebt] = useState('all'); // 'all' | 'withDebt' | 'noDebt'
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [debtModalCustomer, setDebtModalCustomer] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCustData, setNewCustData] = useState({
    name: '',
    phone: '',
    email: '',
    city: 'القاهرة',
    address: '',
    notes: '',
    debt: 0
  });

  // Filter Customers
  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.phone.includes(searchQuery) ||
                          (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDebt = filterDebt === 'all' || (filterDebt === 'withDebt' ? c.debt > 0 : c.debt === 0);
    return matchesSearch && matchesDebt;
  });

  // Handle Add Customer Submit
  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newCustData.name || !newCustData.phone) {
      alert('يرجى ملء اسم ورقم موبايل العميل');
      return;
    }
    const created = addCustomer(newCustData);
    setIsAddModalOpen(false);
    setSelectedCustomer(created);
    setNewCustData({
      name: '',
      phone: '',
      email: '',
      city: 'القاهرة',
      address: '',
      notes: '',
      debt: 0
    });
  };

  // Get Invoices for selected customer
  const customerInvoices = selectedCustomer
    ? invoices.filter(inv => inv.customerId === selectedCustomer.id || inv.customerPhone === selectedCustomer.phone)
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
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

          <div style={{ display: 'flex', gap: '6px' }}>
            <button
              onClick={() => setFilterDebt('all')}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: filterDebt === 'all' ? '1.5px solid var(--mint-600)' : '1px solid var(--border-light)',
                background: filterDebt === 'all' ? 'var(--mint-600)' : '#ffffff',
                color: filterDebt === 'all' ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: '700',
                fontSize: '0.84rem',
                cursor: 'pointer'
              }}
            >
              جميع العملاء ({customers.length})
            </button>
            <button
              onClick={() => setFilterDebt('withDebt')}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: filterDebt === 'withDebt' ? '1.5px solid #ef4444' : '1px solid var(--border-light)',
                background: filterDebt === 'withDebt' ? '#fef2f2' : '#ffffff',
                color: filterDebt === 'withDebt' ? '#991b1b' : 'var(--text-secondary)',
                fontWeight: '700',
                fontSize: '0.84rem',
                cursor: 'pointer'
              }}
            >
              عليهم مديونية ({customers.filter(c => c.debt > 0).length})
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

      {/* Customers List & Selected Customer Details Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedCustomer ? '1fr 440px' : '1fr', gap: '20px', alignItems: 'start' }}>
        
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
                    onClick={() => setSelectedCustomer(cust)}
                    style={{
                      cursor: 'pointer',
                      background: isSelected ? 'var(--mint-50)' : undefined
                    }}
                  >
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: cust.debt > 0 ? '#fee2e2' : 'var(--mint-100)',
                            color: cust.debt > 0 ? '#dc2626' : 'var(--mint-800)',
                            fontWeight: '800',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.9rem'
                          }}
                        >
                          {cust.name.charAt(0)}
                        </div>
                        <div>
                          <strong style={{ color: 'var(--text-main)' }}>{cust.name}</strong>
                          {cust.email && (
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>{cust.email}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td dir="ltr" style={{ fontSize: '0.86rem', color: 'var(--text-secondary)' }}>
                      {cust.phone}
                    </td>
                    <td style={{ fontSize: '0.86rem' }}>
                      {cust.city || 'القاهرة'}
                    </td>
                    <td style={{ fontWeight: '700', color: 'var(--text-secondary)' }}>
                      {cust.totalOrders || 0} طلب
                    </td>
                    <td>
                      <strong style={{ color: 'var(--mint-900)' }}>
                        {cust.totalSpent || 0} ج.م
                      </strong>
                    </td>
                    <td>
                      {cust.debt > 0 ? (
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
                            setSelectedCustomer(cust);
                          }}
                          className="btn btn-outline"
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        >
                          عرض الملف والفواتير
                        </button>
                        {cust.debt > 0 && (
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

        {/* CUSTOMER PROFILE DRAWER / PANEL */}
        {selectedCustomer && (
          <div
            className="card"
            style={{
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              border: '1.5px solid var(--border-mint)',
              position: 'sticky',
              top: '90px'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className="badge badge-mint" style={{ marginBottom: '6px' }}>ملف العميل</span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--mint-900)' }}>
                  {selectedCustomer.name}
                </h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  مسجل منذ: {selectedCustomer.createdAt || '2026-05-01'}
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="btn-icon"
                style={{ width: '32px', height: '32px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Contact Details */}
            <div style={{ background: '#f8fafc', padding: '14px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.86rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Phone size={15} color="var(--mint-600)" />
                <span style={{ color: 'var(--text-muted)' }}>الموبايل:</span>
                <strong dir="ltr">{selectedCustomer.phone}</strong>
              </div>
              {selectedCustomer.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Mail size={15} color="var(--mint-600)" />
                  <span style={{ color: 'var(--text-muted)' }}>البريد:</span>
                  <span>{selectedCustomer.email}</span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={15} color="var(--mint-600)" />
                <span style={{ color: 'var(--text-muted)' }}>المنطقة / العنوان:</span>
                <span>{selectedCustomer.city} {selectedCustomer.address ? `- ${selectedCustomer.address}` : ''}</span>
              </div>
              {selectedCustomer.notes && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '4px', borderTop: '1px dashed var(--border-light)', paddingTop: '6px' }}>
                  📝 {selectedCustomer.notes}
                </div>
              )}
            </div>

            {/* Debt & Financial Status */}
            <div
              style={{
                background: selectedCustomer.debt > 0 ? '#fff5f5' : 'var(--mint-50)',
                border: selectedCustomer.debt > 0 ? '1.5px solid #fecaca' : '1.5px solid var(--border-mint)',
                borderRadius: '14px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.86rem', fontWeight: '700', color: selectedCustomer.debt > 0 ? '#991b1b' : 'var(--mint-800)' }}>
                  {selectedCustomer.debt > 0 ? '⚠️ المديونية المستحقة على العميل:' : 'حالة الحساب المالي:'}
                </span>
                <span style={{ fontSize: '1.25rem', fontWeight: '800', color: selectedCustomer.debt > 0 ? '#dc2626' : '#16a34a' }}>
                  {selectedCustomer.debt > 0 ? `${selectedCustomer.debt} ج.م` : 'خالي من الديون ✓'}
                </span>
              </div>

              {selectedCustomer.debt > 0 && (
                <button
                  onClick={() => setDebtModalCustomer(selectedCustomer)}
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '6px', padding: '10px 14px', borderRadius: '12px' }}
                >
                  <DollarSign size={16} />
                  <span>تسجيل سداد مديونية (كامل أو جزء)</span>
                </button>
              )}
            </div>

            {/* Customer Invoices Section */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: '800', color: 'var(--text-main)' }}>
                  سجل فواتير ومشتريات العميل ({customerInvoices.length})
                </h4>
                <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>اضغط لمعاينة الأصناف</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
                {customerInvoices.length === 0 ? (
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', padding: '16px' }}>
                    لا توجد فواتير مسجلة بعد لهذا العميل.
                  </div>
                ) : (
                  customerInvoices.map((inv) => (
                    <div
                      key={inv.id}
                      onClick={() => openInvoiceModal(inv)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '10px',
                        background: '#ffffff',
                        border: '1px solid var(--border-light)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        cursor: 'pointer',
                        transition: 'all 150ms ease'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: '700', fontSize: '0.86rem', color: 'var(--mint-900)' }}>
                          {inv.invoiceNumber}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          {inv.date} | {inv.items.length} أصناف
                        </div>
                      </div>

                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontWeight: '800', fontSize: '0.92rem', color: 'var(--text-main)' }}>
                          {inv.total} ج.م
                        </div>
                        <span className={`badge ${inv.status === 'paid' ? 'badge-mint' : 'badge-danger'}`} style={{ fontSize: '0.68rem', padding: '1px 6px' }}>
                          {inv.status === 'paid' ? 'مدفوعة' : 'آجلة'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* ADD CUSTOMER MODAL */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '520px', padding: '24px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--mint-900)' }}>
                إضافة عميل جديد لدليل كاتورا
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="btn-icon" style={{ width: '30px', height: '30px' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">الاسم الكامل *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: يوسف النجار"
                  value={newCustData.name}
                  onChange={e => setNewCustData({ ...newCustData, name: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">رقم الموبايل *</label>
                  <input
                    type="tel"
                    required
                    placeholder="01XXXXXXXXX"
                    value={newCustData.phone}
                    onChange={e => setNewCustData({ ...newCustData, phone: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">البريد الإلكتروني</label>
                  <input
                    type="email"
                    placeholder="client@mail.com"
                    value={newCustData.email}
                    onChange={e => setNewCustData({ ...newCustData, email: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">المدينة / المحافظة</label>
                  <input
                    type="text"
                    placeholder="القاهرة، الجيزة، الإسكندرية..."
                    value={newCustData.city}
                    onChange={e => setNewCustData({ ...newCustData, city: e.target.value })}
                    className="form-input"
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">العنوان بالتفصيل</label>
                  <input
                    type="text"
                    placeholder="المنطقة، الشارع، المبنى"
                    value={newCustData.address}
                    onChange={e => setNewCustData({ ...newCustData, address: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">ملاحظات عن العميل</label>
                <textarea
                  rows="2"
                  placeholder="مفضلات القهوة، طريقة التحضير..."
                  value={newCustData.notes}
                  onChange={e => setNewCustData({ ...newCustData, notes: e.target.value })}
                  className="form-textarea"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-outline">
                  إلغاء
                </button>
                <button type="submit" className="btn btn-primary">
                  حفظ العميل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Debt Settlement Modal */}
      <DebtSettlementModal
        isOpen={!!debtModalCustomer}
        onClose={() => setDebtModalCustomer(null)}
        customer={debtModalCustomer}
        onSuccess={(paidAmt) => {
          settleCustomerDebt(debtModalCustomer.id, paidAmt);
          if (selectedCustomer && selectedCustomer.id === debtModalCustomer.id) {
            setSelectedCustomer(prev => ({
              ...prev,
              debt: Math.max(0, prev.debt - paidAmt)
            }));
          }
        }}
      />

    </div>
  );
};
