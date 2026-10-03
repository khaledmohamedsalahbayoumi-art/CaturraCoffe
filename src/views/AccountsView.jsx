import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Plus,
  Trash2,
  Calendar,
  Filter,
  BarChart3,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  X
} from 'lucide-react';

export const AccountsView = () => {
  const {
    invoices,
    purchases,
    expenses,
    addExpense,
    deleteExpense
  } = useApp();

  const [dateFilterMode, setDateFilterMode] = useState('month'); // 'all' | 'today' | 'month' | 'year' | 'custom'
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [compareMode, setCompareMode] = useState(false);

  // New Expense Form
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    category: 'إيجار',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Date filtering logic
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentMonthStr = todayStr.substring(0, 7); // YYYY-MM
  const currentYearStr = todayStr.substring(0, 4);  // YYYY

  const filterByDate = (itemDate) => {
    if (!itemDate) return true;
    if (dateFilterMode === 'all') return true;
    if (dateFilterMode === 'today') return itemDate.startsWith(todayStr);
    if (dateFilterMode === 'month') return itemDate.startsWith(currentMonthStr);
    if (dateFilterMode === 'year') return itemDate.startsWith(currentYearStr);
    if (dateFilterMode === 'custom') {
      if (customStartDate && itemDate < customStartDate) return false;
      if (customEndDate && itemDate > customEndDate) return false;
      return true;
    }
    return true;
  };

  const filteredInvoices = invoices.filter(i => filterByDate(i.date));
  const filteredPurchases = purchases.filter(p => filterByDate(p.date));
  const filteredExpenses = expenses.filter(e => filterByDate(e.date));

  // Totals for filtered period
  const totalSales = filteredInvoices.reduce((sum, i) => sum + Number(i.total || 0), 0);
  const totalPurchases = filteredPurchases.reduce((sum, p) => sum + Number(p.totalAmount || 0), 0);
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  const netProfit = totalSales - (totalPurchases + totalExpenses);
  const profitMargin = totalSales > 0 ? Math.round((netProfit / totalSales) * 100) : 0;

  // Comparison mock/baseline
  const prevSales = Math.round(totalSales * 0.85);
  const prevPurchases = Math.round(totalPurchases * 0.9);
  const prevExpenses = Math.round(totalExpenses * 0.95);
  const prevNetProfit = prevSales - (prevPurchases + prevExpenses);
  const salesGrowth = prevSales > 0 ? Math.round(((totalSales - prevSales) / prevSales) * 100) : 0;
  const profitGrowth = prevNetProfit !== 0 ? Math.round(((netProfit - prevNetProfit) / Math.abs(prevNetProfit)) * 100) : 0;

  // Handle Add Expense
  const handleAddExpenseSubmit = (e) => {
    e.preventDefault();
    if (!expenseForm.title || !expenseForm.amount) {
      alert('يرجى ملء تفاصيل المصروف والمبلغ');
      return;
    }
    addExpense(expenseForm);
    setIsAddExpenseModalOpen(false);
    setExpenseForm({
      title: '',
      category: 'إيجار',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      notes: ''
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      
      {/* Top Filter and Comparison Controls Toolbar */}
      <div
        className="card"
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid var(--border-mint)',
          boxShadow: '0 4px 18px rgba(4, 136, 75, 0.06)',
          padding: '12px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px'
        }}
      >
        {/* Right side: Filter label & Unified Segmented Control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--mint-900)', fontWeight: '800', fontSize: '0.86rem' }}>
            <Calendar size={17} style={{ color: 'var(--mint-600)' }} />
            <span>الفترة الزمنية:</span>
          </div>

          {/* Unified Segmented Pill Bar */}
          <div
            style={{
              background: '#f1f5f9',
              padding: '4px',
              borderRadius: '12px',
              display: 'inline-flex',
              alignItems: 'center',
              border: '1px solid #e2e8f0',
              gap: '3px'
            }}
          >
            {[
              { id: 'all', label: 'جميع الفترات' },
              { id: 'today', label: 'اليوم' },
              { id: 'month', label: 'هذا الشهر' },
              { id: 'year', label: 'هذا العام' },
              { id: 'custom', label: 'نطاق مخصص 🗓️' }
            ].map(tab => {
              const isActive = dateFilterMode === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setDateFilterMode(tab.id)}
                  style={{
                    border: 'none',
                    borderRadius: '9px',
                    padding: '7px 14px',
                    fontSize: '0.84rem',
                    fontWeight: isActive ? '800' : '600',
                    cursor: 'pointer',
                    transition: 'all 180ms cubic-bezier(0.4, 0, 0.2, 1)',
                    background: isActive
                      ? 'linear-gradient(135deg, var(--mint-600) 0%, var(--mint-700) 100%)'
                      : 'transparent',
                    color: isActive ? '#ffffff' : 'var(--text-secondary)',
                    boxShadow: isActive ? '0 2px 8px rgba(4, 136, 75, 0.35)' : 'none'
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Custom Date Range Picker Box */}
          {dateFilterMode === 'custom' && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: 'var(--mint-50)',
                border: '1.5px solid var(--mint-300)',
                borderRadius: '10px',
                padding: '4px 10px',
                animation: 'slideUp 200ms ease'
              }}
            >
              <span style={{ fontSize: '0.78rem', color: 'var(--mint-800)', fontWeight: '700' }}>من:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={e => setCustomStartDate(e.target.value)}
                className="form-input"
                style={{ width: '135px', height: '32px', fontSize: '0.8rem', padding: '2px 8px', borderRadius: '6px' }}
              />
              <span style={{ fontSize: '0.78rem', color: 'var(--mint-800)', fontWeight: '700' }}>إلى:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={e => setCustomEndDate(e.target.value)}
                className="form-input"
                style={{ width: '135px', height: '32px', fontSize: '0.8rem', padding: '2px 8px', borderRadius: '6px' }}
              />
              {(customStartDate || customEndDate) && (
                <button
                  onClick={() => {
                    setCustomStartDate('');
                    setCustomEndDate('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#dc2626',
                    cursor: 'pointer',
                    fontSize: '0.74rem',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="مسح التاريخ"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Left side: Compare Mode Toggle & Add Expense Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Comparison Mode Toggle */}
          <button
            onClick={() => setCompareMode(!compareMode)}
            style={{
              height: '40px',
              padding: '0 16px',
              borderRadius: '11px',
              border: compareMode ? '1.5px solid var(--mint-500)' : '1px solid var(--border-light)',
              background: compareMode ? 'var(--mint-50)' : '#ffffff',
              color: compareMode ? 'var(--mint-900)' : 'var(--text-secondary)',
              fontWeight: '800',
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 200ms',
              boxShadow: compareMode ? '0 2px 10px rgba(4, 136, 75, 0.15)' : 'none'
            }}
            title="مقارنة مؤشرات الأداء الحالية بالفترة السابقة"
          >
            <BarChart3 size={16} style={{ color: compareMode ? 'var(--mint-600)' : 'var(--text-muted)' }} />
            <span>مقارنة الفترات السابقة</span>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: compareMode ? '#16a34a' : '#cbd5e1',
                boxShadow: compareMode ? '0 0 8px #16a34a' : 'none',
                transition: 'all 200ms'
              }}
            />
          </button>

          {/* Add Expense Action Button */}
          <button
            onClick={() => setIsAddExpenseModalOpen(true)}
            className="btn btn-primary"
            style={{
              height: '40px',
              padding: '0 16px',
              borderRadius: '11px',
              fontSize: '0.86rem',
              fontWeight: '800',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(4, 136, 75, 0.25)'
            }}
          >
            <Plus size={16} />
            <span>تسجيل مصروف تشغيلي</span>
          </button>
        </div>
      </div>

      {/* Main KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px' }}>
        
        {/* Sales */}
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid var(--mint-600)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>إجمالي المبيعات (الإيرادات)</span>
            <span className="badge badge-mint">{filteredInvoices.length} فواتير</span>
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: '800', color: 'var(--mint-800)', marginTop: '8px' }}>
            {totalSales.toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>ج.م</span>
          </div>
          {compareMode && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontSize: '0.78rem', color: salesGrowth >= 0 ? '#16a34a' : '#dc2626' }}>
              {salesGrowth >= 0 ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}
              <span>{Math.abs(salesGrowth)}% مقارنة بالفترة السابقة ({prevSales} ج.م)</span>
            </div>
          )}
        </div>

        {/* Purchases */}
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid #0284c7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>إجمالي المشتريات والتوريد</span>
            <span className="badge badge-blue">{filteredPurchases.length} توريدات</span>
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: '800', color: '#0369a1', marginTop: '8px' }}>
            {totalPurchases.toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>ج.م</span>
          </div>
          {compareMode && (
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px' }}>
              الفترة السابقة: {prevPurchases.toLocaleString()} ج.م
            </div>
          )}
        </div>

        {/* Operating Expenses */}
        <div className="card" style={{ padding: '20px', borderLeft: '4px solid #d97706' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>المصروفات التشغيلية</span>
            <span className="badge badge-warning">{filteredExpenses.length} بنود</span>
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: '800', color: '#b45309', marginTop: '8px' }}>
            {totalExpenses.toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>ج.م</span>
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            إيجار، كهرباء، تسويق، مطبوعات
          </div>
        </div>

        {/* Net Profit */}
        <div
          className="card"
          style={{
            padding: '20px',
            borderLeft: `4px solid ${netProfit >= 0 ? '#16a34a' : '#dc2626'}`,
            background: netProfit >= 0 ? 'linear-gradient(135deg, var(--mint-50) 0%, #ffffff 100%)' : '#fff5f5'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: '700', color: netProfit >= 0 ? 'var(--mint-900)' : '#991b1b' }}>
              صافي الربح الفعلي (Net Profit)
            </span>
            <span className={`badge ${netProfit >= 0 ? 'badge-mint' : 'badge-danger'}`}>
              هامش: {profitMargin}%
            </span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '900', color: netProfit >= 0 ? '#16a34a' : '#dc2626', marginTop: '8px' }}>
            {netProfit >= 0 ? `+${netProfit.toLocaleString()}` : netProfit.toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>ج.م</span>
          </div>
          {compareMode && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontSize: '0.78rem', color: profitGrowth >= 0 ? '#16a34a' : '#dc2626' }}>
              {profitGrowth >= 0 ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}
              <span>{Math.abs(profitGrowth)}% نمو صافي الأرباح</span>
            </div>
          )}
        </div>

      </div>

      {/* COMPARISON BAR / VISUAL SECTION (When enabled) */}
      {compareMode && (
        <div className="card" style={{ padding: '20px', background: 'var(--mint-50)', border: '1.5px dashed var(--mint-400)' }}>
          <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: 'var(--mint-900)', marginBottom: '12px' }}>
            📊 ملخص المقارنة بين الفترتين
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', fontSize: '0.88rem' }}>
            <div style={{ background: '#ffffff', padding: '12px', borderRadius: '10px' }}>
              <div style={{ color: 'var(--text-muted)' }}>المبيعات الحالية vs السابقة</div>
              <div style={{ fontWeight: '800', fontSize: '1.1rem', color: 'var(--mint-800)', marginTop: '4px' }}>
                {totalSales.toLocaleString()} ج.م <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>مقابل {prevSales.toLocaleString()} ج.م</span>
              </div>
            </div>
            <div style={{ background: '#ffffff', padding: '12px', borderRadius: '10px' }}>
              <div style={{ color: 'var(--text-muted)' }}>المصروفات والمشتريات vs السابقة</div>
              <div style={{ fontWeight: '800', fontSize: '1.1rem', color: '#b45309', marginTop: '4px' }}>
                {(totalPurchases + totalExpenses).toLocaleString()} ج.م <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>مقابل {(prevPurchases + prevExpenses).toLocaleString()} ج.م</span>
              </div>
            </div>
            <div style={{ background: '#ffffff', padding: '12px', borderRadius: '10px' }}>
              <div style={{ color: 'var(--text-muted)' }}>الفارق في صافي الأرباح</div>
              <div style={{ fontWeight: '800', fontSize: '1.1rem', color: (netProfit - prevNetProfit) >= 0 ? '#16a34a' : '#dc2626', marginTop: '4px' }}>
                {(netProfit - prevNetProfit) >= 0 ? `+${(netProfit - prevNetProfit).toLocaleString()}` : (netProfit - prevNetProfit).toLocaleString()} ج.م
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EXPENSES MANAGEMENT TABLE */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)' }}>
              سجل المصروفات التشغيلية
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              جميع المصروفات النثرية والتشغيلية المخصومة من الأرباح
            </p>
          </div>
          <button
            onClick={() => setIsAddExpenseModalOpen(true)}
            className="btn btn-outline"
            style={{ padding: '6px 14px', fontSize: '0.84rem' }}
          >
            <Plus size={15} />
            <span>إضافة مصروف</span>
          </button>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>بند المصروف</th>
                <th>التصنيف</th>
                <th>التاريخ</th>
                <th>المبلغ</th>
                <th>الملاحظات</th>
                <th style={{ textAlign: 'center' }}>إجراء</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((exp) => (
                <tr key={exp.id}>
                  <td>
                    <strong style={{ color: 'var(--text-main)' }}>{exp.title}</strong>
                  </td>
                  <td>
                    <span className="badge badge-mint" style={{ fontSize: '0.76rem' }}>
                      {exp.category}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                    {exp.date}
                  </td>
                  <td>
                    <strong style={{ color: '#dc2626', fontSize: '0.95rem' }}>
                      -{exp.amount.toLocaleString()} ج.م
                    </strong>
                  </td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    {exp.notes || '-'}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      onClick={() => {
                        if (window.confirm(`هل أنت متأكد من حذف مصروف "${exp.title}"؟`)) {
                          deleteExpense(exp.id);
                        }
                      }}
                      style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '4px' }}
                      title="حذف المصروف"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredExpenses.length === 0 && (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
              لا توجد مصروفات مسجلة في هذه الفترة المحددة.
            </div>
          )}
        </div>
      </div>

      {/* MODAL: ADD EXPENSE */}
      {isAddExpenseModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddExpenseModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '480px', padding: '24px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--mint-900)' }}>
                تسجيل مصروف تشغيلي جديد
              </h3>
              <button onClick={() => setIsAddExpenseModalOpen(false)} className="btn-icon" style={{ width: '30px', height: '30px' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddExpenseSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">وصف / بيان المصروف *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: فاتورة كهرباء المحمصة، تغليف كراتين..."
                  value={expenseForm.title}
                  onChange={e => setExpenseForm({ ...expenseForm, title: e.target.value })}
                  className="form-input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">المبلغ (ج.م) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    step="0.5"
                    placeholder="500"
                    value={expenseForm.amount}
                    onChange={e => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">التصنيف *</label>
                  <select
                    value={expenseForm.category}
                    onChange={e => setExpenseForm({ ...expenseForm, category: e.target.value })}
                    className="form-select"
                  >
                    <option value="إيجار">إيجار</option>
                    <option value="كهرباء ومياه">كهرباء ومياه</option>
                    <option value="تغليف ومطبوعات">تغليف ومطبوعات</option>
                    <option value="تسويق">تسويق وإعلانات</option>
                    <option value="رواتب">رواتب ومكافآت</option>
                    <option value="صيانة">صيانة وأجهزة</option>
                    <option value="نثريات">نثريات وأخرى</option>
                  </select>
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">تاريخ الصرف</label>
                <input
                  type="date"
                  required
                  value={expenseForm.date}
                  onChange={e => setExpenseForm({ ...expenseForm, date: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">ملاحظات إضافية</label>
                <textarea
                  rows="2"
                  placeholder="رقم الحوالة، المستلم..."
                  value={expenseForm.notes}
                  onChange={e => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                  className="form-textarea"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
                <button type="button" onClick={() => setIsAddExpenseModalOpen(false)} className="btn btn-outline">
                  إلغاء
                </button>
                <button type="submit" className="btn btn-primary">
                  حفظ وتحديث الحسابات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
