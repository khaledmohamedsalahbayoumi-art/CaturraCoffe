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
  X,
  Wallet
} from 'lucide-react';

export const AccountsView = () => {
  const {
    invoices,
    purchases,
    expenses,
    addExpense,
    updateExpense,
    deleteExpense,
    treasuryAccounts,
    treasuryTransactions,
    getTreasuryAccountBalance,
    confirmDialog
  } = useApp();

  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [expenseTypeFilter, setExpenseTypeFilter] = useState('all'); // 'all' | 'cash' | 'waste'

  // New Expense Form
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    category: 'إيجار',
    amount: '',
    accountId: 'acc-cash-main',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const selectedAcc = treasuryAccounts.find(a => a.id === expenseForm.accountId) || treasuryAccounts[0];
  const selectedAccBalance = selectedAcc ? getTreasuryAccountBalance(selectedAcc.id) : 0;
  const isInsufficient = Number(expenseForm.amount) > 0 && Number(expenseForm.amount) > selectedAccBalance && expenseForm.accountId !== 'none';

  // Custom date range filtering logic
  const filterByDate = (itemDate) => {
    if (!itemDate) return true;
    const dateOnly = itemDate.substring(0, 10);
    if (customStartDate && dateOnly < customStartDate) return false;
    if (customEndDate && dateOnly > customEndDate) return false;
    return true;
  };

  const filteredInvoices = invoices.filter(i => filterByDate(i.date) && i.status !== 'cancelled' && i.trackingStatus !== 'cancelled');
  const filteredPurchases = purchases.filter(p => filterByDate(p.date));
  const filteredExpenses = expenses.filter(e => filterByDate(e.date));

  // Stock waste and audit deficit breakdown
  const stockLossExpenses = filteredExpenses.filter(e =>
    e.category === 'هالك وتالف مخزون' || e.category === 'عجز جرد مخزني' || e.category === 'هالك ومخزون' || e.referenceType === 'stock_waste' || e.referenceType === 'inventory_audit_deficit' || e.accountId === 'none'
  );
  const totalStockLoss = stockLossExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

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
      accountId: treasuryAccounts[0]?.id || 'acc-cash-main',
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
          background: '#FFFDF9',
          borderRadius: '16px',
          border: '1.5px solid #EDD9BD',
          boxShadow: '0 4px 20px rgba(74, 50, 32, 0.08)',
          padding: '12px 18px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px'
        }}
      >
        {/* Right side: Custom Date Range Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#96663B',
              fontWeight: '800',
              fontSize: '0.86rem',
              background: '#FFF8EE',
              padding: '6px 12px',
              borderRadius: '10px',
              border: '1px solid #EDD9BD'
            }}
          >
            <Calendar size={17} style={{ color: '#96663B' }} />
            <span>نطاق مخصص:</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#FFF8EE',
              border: '1px solid #EDD9BD',
              borderRadius: '10px',
              padding: '4px 10px'
            }}
          >
            <label
              htmlFor="customStartDate"
              onClick={() => { try { document.getElementById('customStartDate')?.showPicker(); } catch (_) {} }}
              style={{ fontSize: '0.82rem', color: '#4A3220', fontWeight: '800', cursor: 'pointer' }}
            >
              من:
            </label>
            <input
              id="customStartDate"
              type="date"
              value={customStartDate}
              onChange={e => setCustomStartDate(e.target.value)}
              onClick={e => { try { e.target.showPicker(); } catch (_) {} }}
              onFocus={e => { try { e.target.showPicker(); } catch (_) {} }}
              className="form-input"
              style={{
                width: '135px',
                height: '34px',
                fontSize: '0.84rem',
                padding: '2px 8px',
                borderRadius: '8px',
                background: '#FFFDF9',
                border: '1px solid #EDD9BD',
                color: '#4A3220',
                cursor: 'pointer'
              }}
            />
            <label
              htmlFor="customEndDate"
              onClick={() => { try { document.getElementById('customEndDate')?.showPicker(); } catch (_) {} }}
              style={{ fontSize: '0.82rem', color: '#4A3220', fontWeight: '800', cursor: 'pointer' }}
            >
              إلى:
            </label>
            <input
              id="customEndDate"
              type="date"
              value={customEndDate}
              onChange={e => setCustomEndDate(e.target.value)}
              onClick={e => { try { e.target.showPicker(); } catch (_) {} }}
              onFocus={e => { try { e.target.showPicker(); } catch (_) {} }}
              className="form-input"
              style={{
                width: '135px',
                height: '34px',
                fontSize: '0.84rem',
                padding: '2px 8px',
                borderRadius: '8px',
                background: '#FFFDF9',
                border: '1px solid #EDD9BD',
                color: '#4A3220',
                cursor: 'pointer'
              }}
            />
            {(customStartDate || customEndDate) && (
              <button
                onClick={() => {
                  setCustomStartDate('');
                  setCustomEndDate('');
                }}
                style={{
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.35)',
                  borderRadius: '6px',
                  color: '#fca5a5',
                  cursor: 'pointer',
                  fontSize: '0.74rem',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '3px 8px'
                }}
                title="مسح التاريخ"
              >
                <X size={13} />
                <span>مسح</span>
              </button>
            )}
          </div>
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
              border: compareMode ? '1.5px solid #96663B' : '1px solid #EDD9BD',
              background: compareMode ? 'linear-gradient(135deg, #96663B 0%, #7A5230 100%)' : '#FFF8EE',
              color: compareMode ? '#FFFDF9' : '#6B4A2E',
              fontWeight: '800',
              fontSize: '0.84rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 200ms',
              boxShadow: compareMode ? '0 2px 10px rgba(150, 102, 59, 0.25)' : 'none'
            }}
            title="مقارنة مؤشرات الأداء الحالية بالفترة السابقة"
          >
            <BarChart3 size={16} style={{ color: compareMode ? '#FFFDF9' : '#6B4A2E' }} />
            <span>مقارنة الفترات السابقة</span>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: compareMode ? '#4ade80' : '#64748b',
                boxShadow: compareMode ? '0 0 8px #4ade80' : 'none',
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
              boxShadow: '0 4px 14px rgba(194, 123, 56, 0.35)'
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
            <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>المصروفات والخسائر التشغيلية</span>
            <span className="badge badge-warning">{filteredExpenses.length} بنود</span>
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: '800', color: '#b45309', marginTop: '8px' }}>
            {totalExpenses.toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>ج.م</span>
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            {totalStockLoss > 0 ? (
              <span style={{ color: '#b45309', fontWeight: '700' }}>
                منها {totalStockLoss.toLocaleString()} ج.م هالك وعجز مخزني دفتري
              </span>
            ) : (
              'إيجار، كهرباء، تسويق، هالك بضاعة'
            )}
          </div>
        </div>

        {/* Net Profit */}
        <div
          className="card"
          style={{
            padding: '20px',
            borderLeft: `4px solid ${netProfit >= 0 ? '#16a34a' : '#dc2626'}`,
            background: netProfit >= 0 ? '#FFFDF9' : 'rgba(239, 68, 68, 0.08)',
            border: `1px solid ${netProfit >= 0 ? '#EDD9BD' : 'rgba(239, 68, 68, 0.35)'}`
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.84rem', fontWeight: '700', color: netProfit >= 0 ? '#4A3220' : '#dc2626' }}>
              صافي الربح الفعلي (Net Profit)
            </span>
            <span className={`badge ${netProfit >= 0 ? 'badge-mint' : 'badge-danger'}`}>
              هامش: {profitMargin}%
            </span>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '900', color: netProfit >= 0 ? '#16a34a' : '#ef4444', marginTop: '8px' }}>
            {netProfit >= 0 ? `+${netProfit.toLocaleString()}` : netProfit.toLocaleString()} <span style={{ fontSize: '0.9rem', fontWeight: '600' }}>ج.م</span>
          </div>
          {compareMode && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '6px', fontSize: '0.78rem', color: profitGrowth >= 0 ? '#16a34a' : '#ef4444' }}>
              {profitGrowth >= 0 ? <ArrowUpRight size={15} /> : <ArrowDownRight size={15} />}
              <span>{Math.abs(profitGrowth)}% نمو صافي الأرباح</span>
            </div>
          )}
        </div>

      </div>

      {/* COMPARISON BAR / VISUAL SECTION (When enabled) */}
      {compareMode && (
        <div className="card" style={{ padding: '20px', background: '#FFFDF9', border: '1.5px dashed #EDD9BD' }}>
          <h4 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#4A3220', marginBottom: '12px' }}>
            📊 ملخص المقارنة بين الفترتين
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', fontSize: '0.88rem' }}>
            <div style={{ background: '#FFF8EE', border: '1px solid #EDD9BD', padding: '12px', borderRadius: '10px' }}>
              <div style={{ color: 'var(--text-muted)' }}>المبيعات الحالية vs السابقة</div>
              <div style={{ fontWeight: '800', fontSize: '1.1rem', color: '#96663B', marginTop: '4px' }}>
                {totalSales.toLocaleString()} ج.م <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>مقابل {prevSales.toLocaleString()} ج.م</span>
              </div>
            </div>
            <div style={{ background: '#FFF8EE', border: '1px solid #EDD9BD', padding: '12px', borderRadius: '10px' }}>
              <div style={{ color: 'var(--text-muted)' }}>المصروفات والمشتريات vs السابقة</div>
              <div style={{ fontWeight: '800', fontSize: '1.1rem', color: '#b45309', marginTop: '4px' }}>
                {(totalPurchases + totalExpenses).toLocaleString()} ج.م <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>مقابل {(prevPurchases + prevExpenses).toLocaleString()} ج.م</span>
              </div>
            </div>
            <div style={{ background: '#FFF8EE', border: '1px solid #EDD9BD', padding: '12px', borderRadius: '10px' }}>
              <div style={{ color: 'var(--text-muted)' }}>الفارق في صافي الأرباح</div>
              <div style={{ fontWeight: '800', fontSize: '1.1rem', color: (netProfit - prevNetProfit) >= 0 ? '#16a34a' : '#ef4444', marginTop: '4px' }}>
                {(netProfit - prevNetProfit) >= 0 ? `+${(netProfit - prevNetProfit).toLocaleString()}` : (netProfit - prevNetProfit).toLocaleString()} ج.م
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EXPENSES MANAGEMENT TABLE */}
      <div className="card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: 'var(--text-main)' }}>
              سجل المصروفات والخسائر التشغيلية
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              المصروفات النثرية والتشغيلية وقيود إهلاك وعجز المخزون المخصومة من الأرباح
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            {/* Quick Type Filter Tabs */}
            <div style={{ display: 'flex', background: '#FFF8EE', border: '1px solid #EDD9BD', borderRadius: '10px', padding: '3px', gap: '3px' }}>
              <button
                type="button"
                onClick={() => setExpenseTypeFilter('all')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  background: expenseTypeFilter === 'all' ? 'linear-gradient(135deg, #96663B 0%, #7A5230 100%)' : 'transparent',
                  color: expenseTypeFilter === 'all' ? '#FFFDF9' : '#6B4A2E',
                  boxShadow: expenseTypeFilter === 'all' ? '0 2px 8px rgba(150, 102, 59, 0.25)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                الكل ({filteredExpenses.length})
              </button>
              <button
                type="button"
                onClick={() => setExpenseTypeFilter('cash')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  background: expenseTypeFilter === 'cash' ? 'linear-gradient(135deg, #96663B 0%, #7A5230 100%)' : 'transparent',
                  color: expenseTypeFilter === 'cash' ? '#FFFDF9' : '#6B4A2E',
                  boxShadow: expenseTypeFilter === 'cash' ? '0 2px 8px rgba(150, 102, 59, 0.25)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                نقدية ({filteredExpenses.length - stockLossExpenses.length})
              </button>
              <button
                type="button"
                onClick={() => setExpenseTypeFilter('waste')}
                style={{
                  padding: '6px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.8rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  background: expenseTypeFilter === 'waste' ? 'linear-gradient(135deg, #d97706 0%, #b45309 100%)' : 'transparent',
                  color: expenseTypeFilter === 'waste' ? '#ffffff' : '#6B4A2E',
                  boxShadow: expenseTypeFilter === 'waste' ? '0 2px 8px rgba(217, 119, 6, 0.35)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                هالك وجرد ({stockLossExpenses.length})
              </button>
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
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>بند المصروف</th>
                <th>التصنيف</th>
                <th>الخزينة المسحوب منها</th>
                <th>التاريخ</th>
                <th>المبلغ</th>
                <th>الملاحظات</th>
                <th style={{ textAlign: 'center' }}>إجراء</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses
                .filter(exp => {
                  const isWaste = exp.category === 'هالك وتالف مخزون' || exp.category === 'عجز جرد مخزني' || exp.category === 'هالك ومخزون' || exp.referenceType === 'stock_waste' || exp.referenceType === 'inventory_audit_deficit' || exp.accountId === 'none';
                  if (expenseTypeFilter === 'cash') return !isWaste;
                  if (expenseTypeFilter === 'waste') return isWaste;
                  return true;
                })
                .map((exp) => {
                  const isWaste = exp.category === 'هالك وتالف مخزون' || 
                                  exp.category === 'عجز جرد مخزني' || 
                                  exp.category === 'هالك ومخزون' || 
                                  exp.referenceType === 'stock_waste' || 
                                  exp.referenceType === 'inventory_audit_deficit' || 
                                  exp.accountId === 'none';

                  // Robust lookup from accountId, associated transaction, or default treasury account
                  const relatedTx = (treasuryTransactions || []).find(tx => tx.expenseId === exp.id || tx.id === `tx-exp-${exp.id}`);
                  const resolvedAccountId = (exp.accountId && exp.accountId !== 'none')
                    ? exp.accountId
                    : (relatedTx?.fromAccountId || (!isWaste ? (exp.category === 'تسويق' ? 'acc-instapay-main' : (treasuryAccounts[0]?.id || 'acc-cash-main')) : 'none'));

                  const fromAccount = resolvedAccountId !== 'none'
                    ? (treasuryAccounts.find(a => a.id === resolvedAccountId) || { name: exp.accountName || 'الخزينة الرئيسية (درج الكاش)', color: 'var(--mint-800)' })
                    : null;

                  return (
                    <tr key={exp.id}>
                      <td>
                        <strong style={{ color: 'var(--text-main)' }}>{exp.title}</strong>
                      </td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            fontSize: '0.76rem',
                            background: isWaste ? '#fef3c7' : 'rgba(5, 150, 105, 0.12)',
                            color: isWaste ? '#92400e' : 'var(--mint-900)',
                            border: isWaste ? '1px solid #fde68a' : '1px solid var(--border-mint)'
                          }}
                        >
                          {exp.category}
                        </span>
                      </td>
                      <td>
                        {isWaste ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.76rem',
                              fontWeight: '700',
                              color: '#9a3412',
                              background: '#fff7ed',
                              border: '1px solid #fed7aa',
                              padding: '3px 8px',
                              borderRadius: '6px'
                            }}
                            title="تسوية مخزنية غير نقدية"
                          >
                            قيد خسائر دفتري
                          </span>
                        ) : (
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                            <select
                              value={resolvedAccountId}
                              onChange={(e) => {
                                const newAccId = e.target.value;
                                const accObj = treasuryAccounts.find(a => a.id === newAccId);
                                updateExpense(exp.id, {
                                  accountId: newAccId,
                                  accountName: accObj ? accObj.name : ''
                                });
                              }}
                              style={{
                                padding: '4px 8px',
                                borderRadius: '8px',
                                fontSize: '0.78rem',
                                fontWeight: '700',
                                border: '1px solid rgba(5, 150, 105, 0.25)',
                                background: 'rgba(5, 150, 105, 0.08)',
                                color: 'var(--mint-950)',
                                cursor: 'pointer',
                                outline: 'none'
                              }}
                              title="الخزينة المسحوب منها - يمكنك التغيير في أي وقت"
                            >
                              {treasuryAccounts.map(acc => (
                                <option key={acc.id} value={acc.id}>
                                  💼 {acc.name}
                                </option>
                              ))}
                              <option value="none">قيد خسائر دفتري (بدون خصم)</option>
                            </select>
                          </div>
                        )}
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
                        onClick={async () => {
                          const ok = await confirmDialog({
                            title: 'حذف المصروف',
                            message: `هل أنت متأكد من حذف مصروف "${exp.title}"؟`,
                            details: `المبلغ: ${exp.amount?.toLocaleString()} ج.م • البند: ${exp.category}`,
                            confirmText: 'نعم، حذف المصروف',
                            cancelText: 'إلغاء',
                            type: 'danger'
                          });
                          if (ok) {
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
                );
              })}
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
                    onChange={e => {
                      const newCat = e.target.value;
                      const isLoss = newCat === 'هالك وتالف مخزون' || newCat === 'عجز جرد مخزني';
                      setExpenseForm({
                        ...expenseForm,
                        category: newCat,
                        accountId: isLoss ? 'none' : (expenseForm.accountId === 'none' ? (treasuryAccounts[0]?.id || 'acc-cash-main') : expenseForm.accountId)
                      });
                    }}
                    className="form-select"
                  >
                    <option value="إيجار">إيجار</option>
                    <option value="كهرباء ومياه">كهرباء ومياه</option>
                    <option value="تغليف ومطبوعات">تغليف ومطبوعات</option>
                    <option value="تسويق">تسويق وإعلانات</option>
                    <option value="رواتب">رواتب ومكافآت</option>
                    <option value="صيانة">صيانة وأجهزة</option>
                    <option value="هالك وتالف مخزون">هالك وتالف مخزون (قيد دفتري)</option>
                    <option value="عجز جرد مخزني">عجز جرد مخزني (قيد دفتري)</option>
                    <option value="نثريات">نثريات وأخرى</option>
                  </select>
                </div>
              </div>

              {/* الخزينة المسحوب منها */}
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Wallet size={15} color="var(--mint-700)" />
                    <span>الخزينة / الحساب المسحوب منه المصروف *</span>
                  </span>
                  {selectedAcc && expenseForm.accountId !== 'none' && (
                    <span style={{ fontSize: '0.78rem', color: isInsufficient ? '#dc2626' : 'var(--mint-700)', fontWeight: '700' }}>
                      الرصيد المتاح: {selectedAccBalance.toLocaleString()} ج.م
                    </span>
                  )}
                </label>
                <select
                  required
                  value={expenseForm.accountId}
                  onChange={e => setExpenseForm({ ...expenseForm, accountId: e.target.value })}
                  className="form-select"
                  style={{ fontWeight: '700' }}
                >
                  {treasuryAccounts.map(acc => {
                    const bal = getTreasuryAccountBalance(acc.id);
                    return (
                      <option key={acc.id} value={acc.id}>
                        {acc.name} (الرصيد: {bal.toLocaleString()} ج.م)
                      </option>
                    );
                  })}
                  <option value="none">بدون خصم من الخزائن (قيد دفتري فقط)</option>
                </select>
                {isInsufficient && (
                  <div style={{ fontSize: '0.78rem', color: '#dc2626', marginTop: '4px', fontWeight: '700' }}>
                    ⚠️ تنبيه: مبلغ المصروف ({Number(expenseForm.amount).toLocaleString()} ج.م) يتجاوز الرصيد المتوفر بالخزينة ({selectedAccBalance.toLocaleString()} ج.م).
                  </div>
                )}
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
