import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Wallet,
  Banknote,
  Zap,
  ArrowRightLeft,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Filter,
  Calendar,
  Building2,
  Smartphone,
  CheckCircle,
  FileText,
  Printer,
  Trash2,
  Edit2,
  X,
  ExternalLink,
  DollarSign,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

export const TreasuryView = () => {
  const {
    invoices,
    openInvoiceModal,
    treasuryAccounts,
    addTreasuryAccount,
    updateTreasuryAccount,
    deleteTreasuryAccount,
    treasuryTransactions,
    addTreasuryTransaction,
    deleteTreasuryTransaction,
    getTreasuryAccountBalance,
    contactInfo,
    confirmDialog,
    resetAllFinancials
  } = useApp();

  // Active Sub-Tab: 'ledger' (Unified Transactions Ledger) | 'accounts' (Accounts & Drawers) | 'invoices' (Sales Invoices)
  const [activeSubTab, setActiveSubTab] = useState('ledger');

  // Unified Ledger Filters
  const [accountFilter, setAccountFilter] = useState('all'); // 'all' | accountId
  const [categoryFilter, setCategoryFilter] = useState('all'); // 'all' | 'sales' | 'customer_debt' | 'supplier' | 'expense' | 'transfer'
  const [dateFilter, setDateFilter] = useState('all'); // 'all' | 'today' | 'month'
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isAddAccountModalOpen, setIsAddAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferType, setTransferType] = useState('transfer'); // 'transfer' | 'deposit' | 'withdrawal'

  // Form: Account
  const [accountForm, setAccountForm] = useState({
    name: '',
    type: 'instapay', // 'instapay' | 'wallet' | 'cash' | 'bank' | 'other'
    accountNumber: '',
    openingBalance: '',
    notes: '',
    color: '#ea580c'
  });

  // Form: Transfer / Deposit / Withdrawal
  const [transferForm, setTransferForm] = useState({
    fromAccountId: 'acc-cash-main',
    toAccountId: 'acc-instapay-main',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Date filtering helper
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentMonthStr = todayStr.substring(0, 7);

  const matchDate = (dateStr) => {
    if (!dateStr || dateFilter === 'all') return true;
    if (dateFilter === 'today') return dateStr.startsWith(todayStr);
    if (dateFilter === 'month') return dateStr.startsWith(currentMonthStr);
    return true;
  };

  // 1. REAL-TIME BALANCES & TOTAL LIQUIDITY (Pure Accounting Truth)
  const totalTreasuryLiquidity = useMemo(() => {
    return treasuryAccounts.reduce((sum, acc) => sum + getTreasuryAccountBalance(acc.id), 0);
  }, [treasuryAccounts, getTreasuryAccountBalance]);

  const cashBalance = getTreasuryAccountBalance('acc-cash-main');
  const instapayBalance = getTreasuryAccountBalance('acc-instapay-main');
  const otherAccountsBalance = useMemo(() => {
    return treasuryAccounts
      .filter(a => a.id !== 'acc-cash-main' && a.id !== 'acc-instapay-main')
      .reduce((sum, acc) => sum + getTreasuryAccountBalance(acc.id), 0);
  }, [treasuryAccounts, getTreasuryAccountBalance]);

  // 2. PERIOD CASH FLOW (Inflows, Outflows, Net Movement for selected date)
  const periodTransactions = useMemo(() => {
    return treasuryTransactions.filter(tx => matchDate(tx.date));
  }, [treasuryTransactions, dateFilter]);

  const periodInflow = useMemo(() => {
    return periodTransactions
      .filter(tx => tx.type === 'deposit')
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  }, [periodTransactions]);

  const periodOutflow = useMemo(() => {
    return periodTransactions
      .filter(tx => tx.type === 'withdrawal')
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  }, [periodTransactions]);

  const periodNetFlow = periodInflow - periodOutflow;

  // 3. UNIFIED TRANSACTIONS FILTERING
  const filteredTransactions = useMemo(() => {
    return treasuryTransactions.filter(tx => {
      // 1. Account Filter
      if (accountFilter !== 'all') {
        const matchesFrom = tx.fromAccountId === accountFilter;
        const matchesTo = tx.toAccountId === accountFilter;
        if (!matchesFrom && !matchesTo) return false;
      }

      // 2. Date Filter
      if (!matchDate(tx.date)) return false;

      // 3. Category / Movement Type Filter
      if (categoryFilter === 'sales') {
        const isSale = (tx.category || '').includes('مبيعات') || (tx.category || '').includes('دفعة مقدمة');
        if (!isSale) return false;
      } else if (categoryFilter === 'customer_debt') {
        const isCust = (tx.category || '').includes('مديونية عميل') || (tx.category || '').includes('تحصيل');
        if (!isCust) return false;
      } else if (categoryFilter === 'supplier') {
        const isSup = (tx.category || '').includes('مورد') || (tx.category || '').includes('مشتريات');
        if (!isSup) return false;
      } else if (categoryFilter === 'expense') {
        const isExp = (tx.category || '').includes('مصروف');
        if (!isExp) return false;
      } else if (categoryFilter === 'transfer') {
        if (tx.type !== 'transfer' && !(tx.category || '').includes('تحويل')) return false;
      }

      // 4. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const desc = (tx.description || '').toLowerCase();
        const cat = (tx.category || '').toLowerCase();
        const by = (tx.performedBy || '').toLowerCase();
        if (!desc.includes(q) && !cat.includes(q) && !by.includes(q)) return false;
      }

      return true;
    });
  }, [treasuryTransactions, accountFilter, categoryFilter, dateFilter, searchQuery]);

  // Handle Account Form Submit
  const handleAccountSubmit = (e) => {
    e.preventDefault();
    if (!accountForm.name.trim()) {
      alert('يرجى كتابة اسم الحساب أو المحفظة');
      return;
    }

    if (editingAccount) {
      updateTreasuryAccount(editingAccount.id, {
        name: accountForm.name.trim(),
        type: accountForm.type,
        accountNumber: accountForm.accountNumber.trim(),
        openingBalance: Number(accountForm.openingBalance) || 0,
        notes: accountForm.notes.trim(),
        color: accountForm.color
      });
      setEditingAccount(null);
    } else {
      addTreasuryAccount({
        name: accountForm.name.trim(),
        type: accountForm.type,
        accountNumber: accountForm.accountNumber.trim(),
        openingBalance: Number(accountForm.openingBalance) || 0,
        notes: accountForm.notes.trim(),
        color: accountForm.color
      });
    }

    setIsAddAccountModalOpen(false);
    setAccountForm({
      name: '',
      type: 'instapay',
      accountNumber: '',
      openingBalance: '',
      notes: '',
      color: '#ea580c'
    });
  };

  // Open Edit Account Modal
  const openEditAccount = (acc) => {
    setEditingAccount(acc);
    setAccountForm({
      name: acc.name,
      type: acc.type,
      accountNumber: acc.accountNumber || '',
      openingBalance: String(acc.openingBalance || 0),
      notes: acc.notes || '',
      color: acc.color || '#ea580c'
    });
    setIsAddAccountModalOpen(true);
  };

  // Handle Transfer / Deposit Submit
  const handleTransferSubmit = (e) => {
    e.preventDefault();
    const amt = Number(transferForm.amount);
    if (!amt || amt <= 0) {
      alert('يرجى إدخال مبلغ صحيح أكبر من الصفر');
      return;
    }

    if (transferType === 'transfer' && transferForm.fromAccountId === transferForm.toAccountId) {
      alert('لا يمكن التحويل لنفس الحساب! يرجى اختيار حسابين مختلفين.');
      return;
    }

    const fromAcc = treasuryAccounts.find(a => a.id === transferForm.fromAccountId);
    const toAcc = treasuryAccounts.find(a => a.id === transferForm.toAccountId);

    let catName = 'تحويل بين الخزن';
    if (transferType === 'deposit') catName = 'إيداع نقدي';
    if (transferType === 'withdrawal') catName = 'سحب نقدي';

    let desc = transferForm.description.trim();
    if (!desc) {
      if (transferType === 'transfer') desc = `تحويل من ${fromAcc?.name || 'حساب'} إلى ${toAcc?.name || 'حساب'}`;
      if (transferType === 'deposit') desc = `إيداع نقدية في ${toAcc?.name || 'حساب'}`;
      if (transferType === 'withdrawal') desc = `سحب نقدية من ${fromAcc?.name || 'حساب'}`;
    }

    addTreasuryTransaction({
      type: transferType,
      fromAccountId: transferType === 'deposit' ? null : transferForm.fromAccountId,
      toAccountId: transferType === 'withdrawal' ? null : transferForm.toAccountId,
      amount: amt,
      category: catName,
      description: desc,
      date: `${transferForm.date} ${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`
    });

    setIsTransferModalOpen(false);
    setTransferForm({
      fromAccountId: 'acc-cash-main',
      toAccountId: 'acc-instapay-main',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const handleResetAllFinancials = async () => {
    const ok = await confirmDialog({
      title: 'تصفير الخزن وإلغاء كافة المعاملات المالية؟',
      message: 'سيتم مسح كافة حركات الخزينة، المصروفات، فواتير المبيعات والمشتريات، وتصفير أرصدة جميع الخزن إلى 0.00 ج.م للبدء بإدخال البيانات الصحيحة الفعلية. هل أنت متأكد من المتابعة؟',
      confirmText: 'نعم، صفر جميع الخزن والمعاملات',
      cancelText: 'إلغاء',
      danger: true
    });
    if (ok) {
      resetAllFinancials();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Header & Main Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: '900', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Wallet size={26} color="#96663B" />
            <span>الخزينة وكشف الحساب الموحد</span>
          </h2>
          <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            كشف حساب النقدية الموحد، تحصيلات المبيعات اللحظية، سدادات الموردين والعملاء، والأرصدة الفعلية في الخزائن والمحافظ.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={handleResetAllFinancials}
            style={{
              height: '42px',
              padding: '0 16px',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1.5px solid rgba(239, 68, 68, 0.45)',
              color: '#ef4444',
              borderRadius: '12px',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.1)',
              transition: 'all 0.15s ease'
            }}
            title="تصفير الخزن ومسح كافة المعاملات المالية للبدء ببيانات صحيحة"
          >
            <Trash2 size={16} />
            <span>تصفير الخزن والمعاملات 🗑️</span>
          </button>
          <button
            onClick={() => {
              setTransferType('transfer');
              setIsTransferModalOpen(true);
            }}
            style={{
              height: '42px',
              padding: '0 16px',
              background: '#2C1810',
              border: '1.5px solid #C49A5C',
              color: '#FFFDF9',
              borderRadius: '12px',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 8px rgba(44, 24, 16, 0.18)',
              transition: 'all 0.15s ease'
            }}
          >
            <ArrowRightLeft size={16} color="#E5BA73" />
            <span>تحويل بين الخزن</span>
          </button>

          <button
            onClick={() => {
              setTransferType('deposit');
              setIsTransferModalOpen(true);
            }}
            style={{
              height: '42px',
              padding: '0 16px',
              background: '#2C1810',
              border: '1.5px solid #C49A5C',
              color: '#FFFDF9',
              borderRadius: '12px',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 8px rgba(44, 24, 16, 0.18)',
              transition: 'all 0.15s ease'
            }}
          >
            <Plus size={16} color="#E5BA73" />
            <span>إيداع / سحب نقدية</span>
          </button>

          <button
            onClick={() => {
              setEditingAccount(null);
              setAccountForm({
                name: '',
                type: 'instapay',
                accountNumber: '',
                openingBalance: '',
                notes: '',
                color: '#ea580c'
              });
              setIsAddAccountModalOpen(true);
            }}
            style={{
              height: '42px',
              padding: '0 18px',
              background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
              border: '1.5px solid #f59e0b',
              color: '#ffffff',
              borderRadius: '12px',
              fontWeight: '900',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 4px 14px rgba(217, 119, 6, 0.35)',
              transition: 'all 0.15s ease'
            }}
          >
            <Plus size={18} />
            <span>إضافة حساب / محفظة</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards (Real-time Financial Truth) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        
        {/* Total Liquidity */}
        <div style={{ padding: '20px', borderRadius: '18px', border: '1.5px solid rgba(212, 163, 115, 0.35)', borderLeft: '4px solid #f59e0b', background: 'linear-gradient(135deg, #2a140a 0%, #1a0b05 100%)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.84rem', color: '#d4a373', fontWeight: '800' }}>إجمالي السيولة المتاحة</span>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(217, 119, 6, 0.2)', border: '1px solid rgba(217, 119, 6, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Wallet size={20} color="#fbbf24" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '900', color: totalTreasuryLiquidity >= 0 ? '#fbbf24' : '#ef4444', marginTop: '8px' }}>
            {totalTreasuryLiquidity.toLocaleString()} <span style={{ fontSize: '0.95rem', fontWeight: '600' }}>ج.م</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#c4b0a1', marginTop: '4px', fontWeight: '700' }}>
            موزعة على {treasuryAccounts.length} خزائن ومحافظ
          </div>
        </div>

        {/* Cash Vault */}
        <div style={{ padding: '20px', borderRadius: '18px', border: '1px solid rgba(212, 163, 115, 0.25)', borderLeft: '4px solid #059669', background: 'linear-gradient(135deg, #241108 0%, #170904 100%)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.84rem', color: '#d4a373', fontWeight: '800' }}>خزينة النقدية (درج الكاش)</span>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(5, 150, 105, 0.2)', border: '1px solid rgba(5, 150, 105, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Banknote size={20} color="#34d399" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '900', color: cashBalance >= 0 ? '#34d399' : '#ef4444', marginTop: '8px' }}>
            {cashBalance.toLocaleString()} <span style={{ fontSize: '0.95rem', fontWeight: '600' }}>ج.م</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#c4b0a1', marginTop: '4px' }}>
            الرصيد الفعلي في درج الصالة حالياً
          </div>
        </div>

        {/* InstaPay & Wallets */}
        <div style={{ padding: '20px', borderRadius: '18px', border: '1px solid rgba(212, 163, 115, 0.25)', borderLeft: '4px solid #ea580c', background: 'linear-gradient(135deg, #281208 0%, #170904 100%)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.84rem', color: '#d4a373', fontWeight: '800' }}>إنستاباي (InstaPay)</span>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(234, 88, 12, 0.2)', border: '1px solid rgba(234, 88, 12, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={20} color="#fb923c" />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '900', color: instapayBalance >= 0 ? '#fb923c' : '#ef4444', marginTop: '8px' }}>
            {instapayBalance.toLocaleString()} <span style={{ fontSize: '0.95rem', fontWeight: '600' }}>ج.م</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#c4b0a1', marginTop: '4px' }}>
            الرصيد الفعلي بحساب إنستاباي
          </div>
        </div>

        {/* Period Cash Flow Indicator */}
        <div style={{ padding: '20px', borderRadius: '18px', border: '1px solid rgba(212, 163, 115, 0.25)', borderLeft: '4px solid #0284c7', background: 'linear-gradient(135deg, #1b162b 0%, #110d1c 100%)', boxShadow: '0 8px 24px rgba(0,0,0,0.4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.84rem', color: '#d4a373', fontWeight: '800' }}>
              حركة التدفق للفترة ({dateFilter === 'today' ? 'اليوم' : dateFilter === 'month' ? 'هذا الشهر' : 'الكل'})
            </span>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(2, 132, 199, 0.2)', border: '1px solid rgba(2, 132, 199, 0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {periodNetFlow >= 0 ? <TrendingUp size={20} color="#38bdf8" /> : <TrendingDown size={20} color="#ef4444" />}
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: '900', color: periodNetFlow >= 0 ? '#34d399' : '#ef4444', marginTop: '8px' }}>
            {periodNetFlow >= 0 ? `+${periodNetFlow.toLocaleString()}` : periodNetFlow.toLocaleString()} <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>ج.م صافي</span>
          </div>
          <div style={{ fontSize: '0.76rem', color: '#c4b0a1', marginTop: '4px', display: 'flex', gap: '8px' }}>
            <span style={{ color: '#34d399', fontWeight: '700' }}>وارد: +{periodInflow.toLocaleString()}</span>
            <span>•</span>
            <span style={{ color: '#ef4444', fontWeight: '700' }}>صادر: -{periodOutflow.toLocaleString()}</span>
          </div>
        </div>

      </div>

      {/* Main Sub-Navigation Tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', borderBottom: '1.5px solid rgba(212, 163, 115, 0.2)', paddingBottom: '12px' }}>
        
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveSubTab('ledger')}
            style={{
              padding: '8px 20px',
              fontSize: '0.88rem',
              borderRadius: '12px',
              fontWeight: '800',
              cursor: 'pointer',
              background: activeSubTab === 'ledger' ? 'linear-gradient(135deg, #96663B 0%, #7A5230 100%)' : '#FFF8EE',
              border: activeSubTab === 'ledger' ? '1.5px solid #96663B' : '1px solid #EDD9BD',
              color: activeSubTab === 'ledger' ? '#FFFDF9' : '#6B4A2E',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: activeSubTab === 'ledger' ? '0 4px 12px rgba(150, 102, 59, 0.25)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <FileText size={16} />
            <span>كشف حركة الخزينة الموحد ({treasuryTransactions.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('accounts')}
            style={{
              padding: '8px 20px',
              fontSize: '0.88rem',
              borderRadius: '12px',
              fontWeight: '800',
              cursor: 'pointer',
              background: activeSubTab === 'accounts' ? 'linear-gradient(135deg, #96663B 0%, #7A5230 100%)' : '#FFF8EE',
              border: activeSubTab === 'accounts' ? '1.5px solid #96663B' : '1px solid #EDD9BD',
              color: activeSubTab === 'accounts' ? '#FFFDF9' : '#6B4A2E',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: activeSubTab === 'accounts' ? '0 4px 12px rgba(150, 102, 59, 0.25)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <Wallet size={16} />
            <span>الخزائن والمحافظ ({treasuryAccounts.length})</span>
          </button>
        </div>

        {/* Global Date Filter Period */}
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span style={{ fontSize: '0.78rem', color: '#6B4A2E' }}>فترة التقرير:</span>
          {['all', 'month', 'today'].map((period) => (
            <button
              key={period}
              onClick={() => setDateFilter(period)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: '700',
                border: dateFilter === period ? '1.5px solid #96663B' : '1px solid #EDD9BD',
                background: dateFilter === period ? 'linear-gradient(135deg, #96663B 0%, #7A5230 100%)' : '#FFF8EE',
                color: dateFilter === period ? '#FFFDF9' : '#6B4A2E',
                cursor: 'pointer',
                boxShadow: dateFilter === period ? '0 2px 8px rgba(150, 102, 59, 0.25)' : 'none'
              }}
            >
              {period === 'all' ? 'جميع الفترات' : period === 'month' ? 'هذا الشهر' : 'اليوم'}
            </button>
          ))}
        </div>

      </div>

      {/* ========================================================= */}
      {/* TAB 1: UNIFIED TRANSACTIONS LEDGER (The Single Source of Truth) */}
      {/* ========================================================= */}
      {activeSubTab === 'ledger' && (
        <div style={{ background: '#FFFDF9', border: '1.5px solid #EDD9BD', borderRadius: '20px', padding: '24px', boxShadow: '0 8px 30px rgba(74, 50, 32, 0.08)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Quick Filters Toolbar */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            
            {/* Account Quick Pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.8rem', color: '#6B4A2E', fontWeight: '700' }}>الحساب:</span>
              <button
                type="button"
                onClick={() => setAccountFilter('all')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: '700',
                  border: accountFilter === 'all' ? '1.5px solid #96663B' : '1px solid #EDD9BD',
                  background: accountFilter === 'all' ? 'linear-gradient(135deg, #96663B 0%, #7A5230 100%)' : '#FFF8EE',
                  color: accountFilter === 'all' ? '#FFFDF9' : '#6B4A2E',
                  cursor: 'pointer',
                  boxShadow: accountFilter === 'all' ? '0 2px 8px rgba(150, 102, 59, 0.25)' : 'none'
                }}
              >
                الكل
              </button>
              {treasuryAccounts.map(acc => (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => setAccountFilter(acc.id)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '8px',
                    fontSize: '0.78rem',
                    fontWeight: '700',
                    border: accountFilter === acc.id ? '1.5px solid #96663B' : '1px solid #EDD9BD',
                    background: accountFilter === acc.id ? 'linear-gradient(135deg, #96663B 0%, #7A5230 100%)' : '#FFF8EE',
                    color: accountFilter === acc.id ? '#FFFDF9' : '#6B4A2E',
                    cursor: 'pointer',
                    boxShadow: accountFilter === acc.id ? '0 2px 8px rgba(150, 102, 59, 0.25)' : 'none'
                  }}
                >
                  {acc.name}
                </button>
              ))}
            </div>

            {/* Movement Category Filter Tabs */}
            <div style={{ display: 'flex', background: '#FFF8EE', border: '1px solid #EDD9BD', borderRadius: '10px', padding: '3px', gap: '3px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setCategoryFilter('all')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '7px',
                  border: 'none',
                  fontSize: '0.76rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  background: categoryFilter === 'all' ? 'linear-gradient(135deg, #96663B 0%, #7A5230 100%)' : 'transparent',
                  color: categoryFilter === 'all' ? '#FFFDF9' : '#6B4A2E',
                  boxShadow: categoryFilter === 'all' ? '0 2px 8px rgba(150, 102, 59, 0.25)' : 'none'
                }}
              >
                الكل
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('sales')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '7px',
                  border: 'none',
                  fontSize: '0.76rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  background: categoryFilter === 'sales' ? 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)' : 'transparent',
                  color: categoryFilter === 'sales' ? '#ffffff' : '#6B4A2E',
                  boxShadow: categoryFilter === 'sales' ? '0 2px 8px rgba(22, 163, 74, 0.35)' : 'none'
                }}
              >
                🟢 مبيعات POS
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('customer_debt')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '7px',
                  border: 'none',
                  fontSize: '0.76rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  background: categoryFilter === 'customer_debt' ? 'linear-gradient(135deg, #059669 0%, #047857 100%)' : 'transparent',
                  color: categoryFilter === 'customer_debt' ? '#ffffff' : '#6B4A2E',
                  boxShadow: categoryFilter === 'customer_debt' ? '0 2px 8px rgba(5, 150, 105, 0.35)' : 'none'
                }}
              >
                🟢 تحصيل مديونية عملاء
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('supplier')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '7px',
                  border: 'none',
                  fontSize: '0.76rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  background: categoryFilter === 'supplier' ? 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)' : 'transparent',
                  color: categoryFilter === 'supplier' ? '#ffffff' : '#6B4A2E',
                  boxShadow: categoryFilter === 'supplier' ? '0 2px 8px rgba(220, 38, 38, 0.35)' : 'none'
                }}
              >
                🔴 سداد دفعات موردين
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('expense')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '7px',
                  border: 'none',
                  fontSize: '0.76rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  background: categoryFilter === 'expense' ? 'linear-gradient(135deg, #d97706 0%, #b45309 100%)' : 'transparent',
                  color: categoryFilter === 'expense' ? '#ffffff' : '#6B4A2E',
                  boxShadow: categoryFilter === 'expense' ? '0 2px 8px rgba(217, 119, 6, 0.35)' : 'none'
                }}
              >
                🔴 مصروفات
              </button>
              <button
                type="button"
                onClick={() => setCategoryFilter('transfer')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '7px',
                  border: 'none',
                  fontSize: '0.76rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  background: categoryFilter === 'transfer' ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : 'transparent',
                  color: categoryFilter === 'transfer' ? '#ffffff' : '#6B4A2E',
                  boxShadow: categoryFilter === 'transfer' ? '0 2px 8px rgba(2, 132, 199, 0.35)' : 'none'
                }}
              >
                🔵 تحويلات الخزن
              </button>
            </div>

          </div>

          {/* Search Bar */}
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', right: '12px', top: '13px', color: '#8C6542' }} />
            <input
              type="text"
              placeholder="بحث في الحركات (برقم الفاتورة، اسم العميل، اسم المورد، الوصف أو المسؤول)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                paddingRight: '38px',
                height: '42px',
                fontSize: '0.88rem',
                background: '#FFF8EE',
                border: '1.5px solid #EDD9BD',
                borderRadius: '12px',
                color: '#2C1810',
                fontWeight: '600',
                outline: 'none'
              }}
            />
          </div>

          {/* Unified Ledger Data Table */}
          <div className="data-table-container" style={{ border: '1px solid #EDD9BD', borderRadius: '14px', overflow: 'hidden' }}>
            <table className="data-table">
              <thead>
                <tr style={{ background: '#2C1810', color: '#F5E6D0' }}>
                  <th style={{ color: '#F5E6D0' }}>التاريخ والوقت</th>
                  <th style={{ color: '#F5E6D0' }}>نوع الحركة</th>
                  <th style={{ color: '#F5E6D0' }}>الحساب / الخزينة</th>
                  <th style={{ color: '#F5E6D0' }}>البيان والتفاصيل</th>
                  <th style={{ color: '#F5E6D0' }}>المبلغ</th>
                  <th style={{ color: '#F5E6D0' }}>المسؤول</th>
                  <th style={{ textAlign: 'center', color: '#F5E6D0' }}>إجراء</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => {
                  const fromAcc = treasuryAccounts.find(a => a.id === tx.fromAccountId);
                  const toAcc = treasuryAccounts.find(a => a.id === tx.toAccountId);
                  const isDeposit = tx.type === 'deposit';
                  const isWithdrawal = tx.type === 'withdrawal';
                  const isTransfer = tx.type === 'transfer';

                  return (
                    <tr key={tx.id} style={{ borderBottom: '1px solid #EDD9BD' }}>
                      <td style={{ fontSize: '0.84rem', color: '#4A3220', fontWeight: '700', whiteSpace: 'nowrap' }}>
                        {tx.date}
                      </td>

                      <td>
                        <span
                          className="badge"
                          style={{
                            fontSize: '0.76rem',
                            fontWeight: '800',
                            background: isDeposit ? 'rgba(5, 150, 105, 0.14)' : isWithdrawal ? 'rgba(220, 38, 38, 0.14)' : 'rgba(2, 132, 199, 0.14)',
                            color: isDeposit ? '#047857' : isWithdrawal ? '#b91c1c' : '#0369a1',
                            border: `1px solid ${isDeposit ? 'rgba(5, 150, 105, 0.4)' : isWithdrawal ? 'rgba(220, 38, 38, 0.4)' : 'rgba(2, 132, 199, 0.4)'}`
                          }}
                        >
                          {isDeposit ? '📥 وارد للخزينة' : isWithdrawal ? '📤 صادر من الخزينة' : '⇄ تحويل بين الخزن'}
                          {tx.category && ` (${tx.category})`}
                        </span>
                      </td>

                      <td>
                        {isTransfer ? (
                          <div style={{ fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span style={{ color: '#b91c1c', fontWeight: '800' }}>{fromAcc?.name || 'حساب'}</span>
                            <ArrowRightLeft size={11} color="#8C6542" />
                            <span style={{ color: '#047857', fontWeight: '800' }}>{toAcc?.name || 'حساب'}</span>
                          </div>
                        ) : isDeposit ? (
                          <span style={{ fontSize: '0.82rem', fontWeight: '800', color: toAcc?.color && toAcc.color !== '#34d399' ? toAcc.color : '#047857' }}>
                            {toAcc?.name || 'الخزينة الافتراضية'}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.82rem', fontWeight: '800', color: fromAcc?.color && fromAcc.color !== '#f87171' ? fromAcc.color : '#b91c1c' }}>
                            {fromAcc?.name || 'الخزينة الافتراضية'}
                          </span>
                        )}
                      </td>

                      <td>
                        <div style={{ fontSize: '0.88rem', color: '#2C1810', fontWeight: '800', lineHeight: 1.5 }}>
                          {tx.description}
                        </div>
                      </td>

                      <td style={{ whiteSpace: 'nowrap' }}>
                        <strong
                          style={{
                            fontSize: '0.98rem',
                            fontWeight: '900',
                            color: isDeposit ? '#047857' : isWithdrawal ? '#b91c1c' : '#0284c7'
                          }}
                        >
                          {isDeposit ? `+${Number(tx.amount).toLocaleString()}` : isWithdrawal ? `-${Number(tx.amount).toLocaleString()}` : Number(tx.amount).toLocaleString()} ج.م
                        </strong>
                      </td>

                      <td style={{ fontSize: '0.82rem', color: '#4A3220', fontWeight: '700' }}>
                        {tx.performedBy || 'الكاشير'}
                      </td>

                      <td style={{ textAlign: 'center' }}>
                        {/* If invoice linked, allow view invoice */}
                        {tx.invoiceId && (
                          <button
                            onClick={() => openInvoiceModal(tx.invoiceId)}
                            className="btn-icon"
                            style={{ width: '28px', height: '28px', color: '#96663B', background: 'rgba(150, 102, 59, 0.15)', display: 'inline-flex' }}
                            title="عرض الفاتورة"
                          >
                            <ExternalLink size={13} />
                          </button>
                        )}
                        {/* Allow delete manual transactions */}
                        {!tx.invoiceId && !tx.purchaseId && !tx.expenseId && (
                          <button
                            onClick={async () => {
                              const ok = await confirmDialog({
                                title: 'حذف حركة الخزينة',
                                message: 'هل أنت متأكد من حذف هذه الحركة اليدوية من الخزينة؟',
                                details: `المبلغ: ${tx.amount?.toLocaleString()} ج.م • البيان: ${tx.description || tx.categoryLabel}`,
                                confirmText: 'نعم، حذف الحركة',
                                cancelText: 'إلغاء',
                                type: 'danger'
                              });
                              if (ok) {
                                deleteTreasuryTransaction(tx.id);
                              }
                            }}
                            className="btn-icon"
                            style={{ width: '28px', height: '28px', color: '#b91c1c', background: 'rgba(220, 38, 38, 0.12)', display: 'inline-flex' }}
                            title="حذف الحركة"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredTransactions.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: '#6B4A2E', fontWeight: '700' }}>
                لا توجد حركات مالية مسجلة تطابق خيارات التصفية الحالية.
              </div>
            )}
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: ACCOUNTS & DRAWERS GRID */}
      {/* ========================================================= */}
      {activeSubTab === 'accounts' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '16px' }}>
            
            {treasuryAccounts.map((acc) => {
              const balance = getTreasuryAccountBalance(acc.id);
              const isCash = acc.type === 'cash';
              const isInstapay = acc.type === 'instapay';
              const isWallet = acc.type === 'wallet';

              return (
                <div
                  key={acc.id}
                  style={{
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    background: '#FFFDF9',
                    border: '1.5px solid #EDD9BD',
                    borderRadius: '18px',
                    boxShadow: '0 8px 24px rgba(74, 50, 32, 0.08)',
                    transition: 'all 200ms ease',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = acc.color || '#96663B'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = '#EDD9BD'}
                >
                  <div>
                    {/* Top Row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '12px',
                            background: isCash ? 'rgba(5, 150, 105, 0.15)' : isInstapay ? 'rgba(234, 88, 12, 0.15)' : 'rgba(2, 132, 199, 0.15)',
                            border: `1px solid ${isCash ? 'rgba(5, 150, 105, 0.35)' : isInstapay ? 'rgba(234, 88, 12, 0.35)' : 'rgba(2, 132, 199, 0.35)'}`,
                            color: isCash ? '#15803d' : isInstapay ? '#ea580c' : '#0284c7',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {isCash ? <Banknote size={22} /> : isInstapay ? <Zap size={22} /> : isWallet ? <Smartphone size={22} /> : <Building2 size={22} />}
                        </div>
                        <div>
                          <h4 style={{ fontSize: '1rem', fontWeight: '800', color: '#4A3220' }}>
                            {acc.name}
                          </h4>
                          <span
                            className="badge"
                            style={{
                              fontSize: '0.7rem',
                              marginTop: '2px',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              background: isCash ? 'rgba(5, 150, 105, 0.15)' : isInstapay ? 'rgba(234, 88, 12, 0.15)' : 'rgba(2, 132, 199, 0.15)',
                              color: isCash ? '#34d399' : isInstapay ? '#fb923c' : '#38bdf8',
                              border: `1px solid ${isCash ? 'rgba(5, 150, 105, 0.3)' : isInstapay ? 'rgba(234, 88, 12, 0.3)' : 'rgba(2, 132, 199, 0.3)'}`
                            }}
                          >
                            {isCash ? '💵 خزينة نقدية (كاش)' : isInstapay ? '⚡ إنستاباي (InstaPay)' : isWallet ? '📱 محفظة ذكية' : '🏦 حساب بنكي'}
                          </span>
                        </div>
                      </div>

                      {/* Edit / Delete actions for custom accounts */}
                      {!acc.isDefault && (
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button
                            onClick={() => openEditAccount(acc)}
                            className="btn-icon"
                            style={{ width: '28px', height: '28px', color: '#d4a373', background: 'rgba(255, 255, 255, 0.06)' }}
                            title="تعديل الحساب"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={async () => {
                              const ok = await confirmDialog({
                                title: 'حذف الحساب المالي',
                                message: `هل أنت متأكد من حذف الحساب "${acc.name}"؟`,
                                details: 'سيتم حذف الحساب من قائمة الحسابات المالية.',
                                confirmText: 'نعم، حذف الحساب',
                                cancelText: 'إلغاء',
                                type: 'danger'
                              });
                              if (ok) {
                                deleteTreasuryAccount(acc.id);
                              }
                            }}
                            className="btn-icon"
                            style={{ width: '28px', height: '28px', color: '#f87171', background: 'rgba(239, 68, 68, 0.15)' }}
                            title="حذف الحساب"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Account Details */}
                    {acc.accountNumber && (
                      <div style={{ fontSize: '0.82rem', color: '#c4b0a1', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>المعرف / الرقم:</span>
                        <strong dir="ltr" style={{ color: '#fbbf24', background: 'rgba(10, 4, 2, 0.75)', border: '1px solid rgba(212, 163, 115, 0.25)', padding: '2px 8px', borderRadius: '6px', fontWeight: '700' }}>
                          {acc.accountNumber}
                        </strong>
                      </div>
                    )}

                    {acc.notes && (
                      <div style={{ fontSize: '0.78rem', color: '#c4b0a1', marginBottom: '14px' }}>
                        {acc.notes}
                      </div>
                    )}
                  </div>

                  {/* Balance & Actions */}
                  <div>
                    <div style={{ background: 'rgba(12, 5, 2, 0.75)', padding: '12px 14px', borderRadius: '14px', border: '1.5px solid rgba(212, 163, 115, 0.25)', marginBottom: '12px' }}>
                      <div style={{ fontSize: '0.76rem', color: '#c4b0a1' }}>الرصيد الفعلي المتاح حالياً:</div>
                      <div style={{ fontSize: '1.45rem', fontWeight: '900', color: balance >= 0 ? (isInstapay ? '#fb923c' : isCash ? '#34d399' : '#fbbf24') : '#ef4444', marginTop: '2px' }}>
                        {balance.toLocaleString()} <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#d4a373' }}>ج.م</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        onClick={() => {
                          setTransferType('transfer');
                          setTransferForm(prev => ({ ...prev, fromAccountId: acc.id }));
                          setIsTransferModalOpen(true);
                        }}
                        style={{
                          flex: 1,
                          padding: '8px 10px',
                          fontSize: '0.8rem',
                          fontWeight: '800',
                          background: '#FFF8EE',
                          border: '1.5px solid #EDD9BD',
                          borderRadius: '8px',
                          color: '#4A3220',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#F5E6D0'; e.currentTarget.style.borderColor = '#C49A5C'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#FFF8EE'; e.currentTarget.style.borderColor = '#EDD9BD'; }}
                      >
                        <ArrowRightLeft size={14} color="#96663B" />
                        <span>تحويل منه</span>
                      </button>

                      <button
                        onClick={() => {
                          setTransferType('deposit');
                          setTransferForm(prev => ({ ...prev, toAccountId: acc.id }));
                          setIsTransferModalOpen(true);
                        }}
                        style={{
                          flex: 1,
                          padding: '8px 10px',
                          fontSize: '0.8rem',
                          fontWeight: '700',
                          background: 'rgba(217, 119, 6, 0.15)',
                          border: '1px solid rgba(217, 119, 6, 0.4)',
                          borderRadius: '8px',
                          color: '#fbbf24',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(217, 119, 6, 0.3)'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(217, 119, 6, 0.15)'; }}
                      >
                        <Plus size={14} color="#fbbf24" />
                        <span>إيداع</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Add New Account Card Button */}
            <div
              onClick={() => {
                setEditingAccount(null);
                setAccountForm({
                  name: '',
                  type: 'instapay',
                  accountNumber: '',
                  openingBalance: '',
                  notes: '',
                  color: '#ea580c'
                });
                setIsAddAccountModalOpen(true);
              }}
              style={{
                borderRadius: '18px',
                border: '2px dashed rgba(212, 163, 115, 0.35)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                cursor: 'pointer',
                background: 'linear-gradient(135deg, rgba(32, 14, 7, 0.6) 0%, rgba(18, 7, 3, 0.8) 100%)',
                transition: 'all 200ms ease',
                minHeight: '220px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#f59e0b';
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(46, 20, 10, 0.85) 0%, rgba(28, 12, 5, 0.95) 100%)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'rgba(212, 163, 115, 0.35)';
                e.currentTarget.style.background = 'linear-gradient(135deg, rgba(32, 14, 7, 0.6) 0%, rgba(18, 7, 3, 0.8) 100%)';
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: 'rgba(217, 119, 6, 0.2)',
                  border: '1.5px solid rgba(217, 119, 6, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fbbf24',
                  marginBottom: '10px'
                }}
              >
                <Plus size={24} />
              </div>
              <strong style={{ fontSize: '0.98rem', color: '#ffffff', fontWeight: '800' }}>إضافة حساب جديد</strong>
              <span style={{ fontSize: '0.78rem', color: '#c4b0a1', marginTop: '4px' }}>
                محفظة إلكترونية، كاش، أو بنك
              </span>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 1: ADD / EDIT ACCOUNT MODAL */}
      {/* ========================================================= */}
      {isAddAccountModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddAccountModalOpen(false)}>
          <div
            className="modal-content"
            style={{
              maxWidth: '500px',
              padding: '24px',
              background: 'linear-gradient(135deg, #241108 0%, #150803 100%)',
              border: '1.5px solid rgba(212, 163, 115, 0.35)',
              borderRadius: '20px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.85)',
              color: '#f5ebe1'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(212, 163, 115, 0.2)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#ffffff' }}>
                {editingAccount ? 'تعديل الحساب / المحفظة' : 'إضافة حساب أو محفظة جديدة'}
              </h3>
              <button onClick={() => setIsAddAccountModalOpen(false)} className="btn-icon" style={{ width: '30px', height: '30px', color: '#c4b0a1', background: 'rgba(255, 255, 255, 0.06)' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAccountSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#d4a373', marginBottom: '6px' }}>اسم الحساب أو المحفظة *</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: إنستاباي - بنك مصر / محفظة فودافون كاش 2 / خزينة فرع 2"
                  value={accountForm.name}
                  onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: '#120502',
                    border: '1.5px solid rgba(212, 163, 115, 0.3)',
                    color: '#ffffff',
                    outline: 'none',
                    fontSize: '0.88rem'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#d4a373', marginBottom: '6px' }}>نوع الحساب *</label>
                  <select
                    value={accountForm.type}
                    onChange={(e) => setAccountForm({ ...accountForm, type: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: '#120502',
                      border: '1.5px solid rgba(212, 163, 115, 0.3)',
                      color: '#ffffff',
                      outline: 'none',
                      fontSize: '0.88rem'
                    }}
                  >
                    <option value="instapay" style={{ background: '#FFFDF9', color: '#4A3220' }}>⚡ إنستاباي (InstaPay)</option>
                    <option value="wallet" style={{ background: '#FFFDF9', color: '#4A3220' }}>📱 محفظة ذكية (فودافون / أورانج)</option>
                    <option value="cash" style={{ background: '#FFFDF9', color: '#4A3220' }}>💵 خزينة نقدية (درج كاش)</option>
                    <option value="bank" style={{ background: '#FFFDF9', color: '#4A3220' }}>🏦 حساب بنكي</option>
                    <option value="other" style={{ background: '#FFFDF9', color: '#4A3220' }}>💼 حساب آخر</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#d4a373', marginBottom: '6px' }}>رقم الحساب / الموبايل / المعرف</label>
                  <input
                    type="text"
                    placeholder="مثال: store@instapay أو 010XXXX"
                    value={accountForm.accountNumber}
                    onChange={(e) => setAccountForm({ ...accountForm, accountNumber: e.target.value })}
                    dir="ltr"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: '#120502',
                      border: '1.5px solid rgba(212, 163, 115, 0.3)',
                      color: '#ffffff',
                      outline: 'none',
                      fontSize: '0.88rem'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#d4a373', marginBottom: '6px' }}>الرصيد الافتتاحي (ج.م)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0"
                  value={accountForm.openingBalance}
                  onChange={(e) => setAccountForm({ ...accountForm, openingBalance: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: '#120502',
                    border: '1.5px solid rgba(212, 163, 115, 0.3)',
                    color: '#ffffff',
                    outline: 'none',
                    fontSize: '0.88rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#d4a373', marginBottom: '6px' }}>ملاحظات أو وصف إضافي</label>
                <input
                  type="text"
                  placeholder="مثال: مخصص لمبيعات الأونلاين أو عهدة المشتروات"
                  value={accountForm.notes}
                  onChange={(e) => setAccountForm({ ...accountForm, notes: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: '#120502',
                    border: '1.5px solid rgba(212, 163, 115, 0.3)',
                    color: '#ffffff',
                    outline: 'none',
                    fontSize: '0.88rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddAccountModalOpen(false)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(212, 163, 115, 0.25)',
                    color: '#c4b0a1',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '9px 22px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                    border: '1.5px solid #f59e0b',
                    color: '#ffffff',
                    fontWeight: '800',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(217, 119, 6, 0.35)'
                  }}
                >
                  {editingAccount ? 'حفظ التعديلات' : 'إضافة الحساب'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: TRANSFER / DEPOSIT / WITHDRAWAL MODAL */}
      {/* ========================================================= */}
      {isTransferModalOpen && (
        <div className="modal-overlay" onClick={() => setIsTransferModalOpen(false)}>
          <div
            className="modal-content"
            style={{
              maxWidth: '520px',
              padding: '24px',
              background: 'linear-gradient(135deg, #241108 0%, #150803 100%)',
              border: '1.5px solid rgba(212, 163, 115, 0.35)',
              borderRadius: '20px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.85)',
              color: '#f5ebe1'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(212, 163, 115, 0.2)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#ffffff' }}>
                {transferType === 'transfer' ? 'تحويل مالي بين الخزائن والمحافظ' : transferType === 'deposit' ? 'إيداع نقدية في حساب' : 'سحب نقدية من حساب'}
              </h3>
              <button onClick={() => setIsTransferModalOpen(false)} className="btn-icon" style={{ width: '30px', height: '30px', color: '#c4b0a1', background: 'rgba(255, 255, 255, 0.06)' }}>
                <X size={16} />
              </button>
            </div>

            {/* Type selector tabs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => setTransferType('transfer')}
                style={{
                  padding: '9px 6px',
                  borderRadius: '10px',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  border: transferType === 'transfer' ? '1.5px solid #0284c7' : '1px solid rgba(212, 163, 115, 0.2)',
                  background: transferType === 'transfer' ? 'rgba(2, 132, 199, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                  color: transferType === 'transfer' ? '#38bdf8' : '#c4b0a1'
                }}
              >
                ⇄ تحويل بين الخزن
              </button>
              <button
                type="button"
                onClick={() => setTransferType('deposit')}
                style={{
                  padding: '9px 6px',
                  borderRadius: '10px',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  border: transferType === 'deposit' ? '1.5px solid #059669' : '1px solid rgba(212, 163, 115, 0.2)',
                  background: transferType === 'deposit' ? 'rgba(5, 150, 105, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                  color: transferType === 'deposit' ? '#34d399' : '#c4b0a1'
                }}
              >
                📥 إيداع نقدي
              </button>
              <button
                type="button"
                onClick={() => setTransferType('withdrawal')}
                style={{
                  padding: '9px 6px',
                  borderRadius: '10px',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  border: transferType === 'withdrawal' ? '1.5px solid #dc2626' : '1px solid rgba(212, 163, 115, 0.2)',
                  background: transferType === 'withdrawal' ? 'rgba(220, 38, 38, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                  color: transferType === 'withdrawal' ? '#f87171' : '#c4b0a1'
                }}
              >
                📤 سحب نقدية
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* From Account */}
              {(transferType === 'transfer' || transferType === 'withdrawal') && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#d4a373', marginBottom: '6px' }}>من حساب (الخصم من) *</label>
                  <select
                    value={transferForm.fromAccountId}
                    onChange={(e) => setTransferForm({ ...transferForm, fromAccountId: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: '#120502',
                      border: '1.5px solid rgba(212, 163, 115, 0.3)',
                      color: '#ffffff',
                      outline: 'none',
                      fontSize: '0.88rem'
                    }}
                  >
                    {treasuryAccounts.map(acc => (
                      <option key={acc.id} value={acc.id} style={{ background: '#FFFDF9', color: '#4A3220' }}>
                        {acc.name} (الرصيد المتاح: {getTreasuryAccountBalance(acc.id).toLocaleString()} ج.م)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* To Account */}
              {(transferType === 'transfer' || transferType === 'deposit') && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#d4a373', marginBottom: '6px' }}>إلى حساب (الإيداع في) *</label>
                  <select
                    value={transferForm.toAccountId}
                    onChange={(e) => setTransferForm({ ...transferForm, toAccountId: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '10px',
                      background: '#120502',
                      border: '1.5px solid rgba(212, 163, 115, 0.3)',
                      color: '#ffffff',
                      outline: 'none',
                      fontSize: '0.88rem'
                    }}
                  >
                    {treasuryAccounts.map(acc => (
                      <option key={acc.id} value={acc.id} style={{ background: '#FFFDF9', color: '#4A3220' }}>
                        {acc.name} (الرصيد المتاح: {getTreasuryAccountBalance(acc.id).toLocaleString()} ج.م)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Amount */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#d4a373', marginBottom: '6px' }}>المبلغ المطلوب (ج.م) *</label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  placeholder="0"
                  value={transferForm.amount}
                  onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: '#120502',
                    border: '1.5px solid rgba(212, 163, 115, 0.3)',
                    color: '#ffffff',
                    outline: 'none',
                    fontSize: '1.1rem',
                    fontWeight: '800'
                  }}
                />
              </div>

              {/* Description */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: '700', color: '#d4a373', marginBottom: '6px' }}>البيان / سبب الحركة</label>
                <input
                  type="text"
                  placeholder="مثال: توريد نقدية من درج الكاش إلى البنك أو عهدة يومية"
                  value={transferForm.description}
                  onChange={(e) => setTransferForm({ ...transferForm, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    background: '#120502',
                    border: '1.5px solid rgba(212, 163, 115, 0.3)',
                    color: '#ffffff',
                    outline: 'none',
                    fontSize: '0.88rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(212, 163, 115, 0.25)',
                    color: '#c4b0a1',
                    fontWeight: '700',
                    cursor: 'pointer'
                  }}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '9px 22px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
                    border: '1.5px solid #f59e0b',
                    color: '#ffffff',
                    fontWeight: '800',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(217, 119, 6, 0.35)'
                  }}
                >
                  تنفيذ الحركة وحفظ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
