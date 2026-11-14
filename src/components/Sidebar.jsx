import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Package,
  ShoppingCart,
  FileText,
  Users,
  ShoppingBag,
  TrendingUp,
  Warehouse,
  Calculator,
  ShieldCheck,
  LogOut,
  ChevronRight,
  ChevronLeft,
  Coffee,
  Sparkles,
  ExternalLink,
  Store,
  GraduationCap,
  Settings,
  Wallet,
  Truck,
  Handshake
} from 'lucide-react';

export const Sidebar = () => {
  const {
    activeTab,
    setActiveTab,
    sidebarCollapsed,
    setSidebarCollapsed,
    currentUser,
    logout,
    viewMode,
    setViewMode,
    lowStockAlerts,
    nearExpiryBatches,
    customers,
    pendingOrdersCount,
    unreadB2BCount = 0,
    dueStandingOrdersCount = 0,
    suppliers = [],
    purchases = [],
    language,
    isRtl
  } = useApp();

  const suppliersWithDebt = (suppliers || []).filter(s => {
    const sPurchases = (purchases || []).filter(p => (p.supplierName || '').trim().toLowerCase() === s.name.trim().toLowerCase());
    return sPurchases.some(p => (Number(p.remainingAmount) || 0) > 0);
  }).length;

  // Navigation Items
  const navItems = [
    {
      id: 'products',
      label: language === 'en' ? 'Products' : 'المنتجات',
      icon: Package,
      badge: null
    },
    {
      id: 'pos',
      label: language === 'en' ? 'Point of Sale (POS)' : 'نقطة البيع (POS)',
      icon: ShoppingCart,
      badge: language === 'en' ? 'Live' : 'مباشر'
    },
    {
      id: 'invoices',
      label: language === 'en' ? 'Invoices & Orders' : 'الفواتير والطلبات',
      icon: FileText,
      badge: pendingOrdersCount > 0 ? (language === 'en' ? `${pendingOrdersCount} Pending` : `${pendingOrdersCount} معلق`) : null,
      badgeType: 'warning'
    },
    {
      id: 'customers',
      label: language === 'en' ? 'Customers & Debts' : 'العملاء والمديونيات',
      icon: Users,
      badge: (customers || []).filter(c => Number(c?.debt) > 0).length ? (language === 'en' ? `${(customers || []).filter(c => Number(c?.debt) > 0).length} Credit` : `${(customers || []).filter(c => Number(c?.debt) > 0).length} آجل`) : null,
      badgeType: 'warning'
    },
    {
      id: 'b2b',
      label: language === 'en' ? 'B2B Wholesale & Cafes' : 'مبيعات الجملة (B2B)',
      icon: Handshake,
      badge: dueStandingOrdersCount > 0
        ? (language === 'en' ? `${dueStandingOrdersCount} Due ⏰` : `${dueStandingOrdersCount} توريد مستحق ⏰`)
        : (unreadB2BCount > 0 ? (language === 'en' ? `${unreadB2BCount} New` : `${unreadB2BCount} جديد`) : null),
      badgeType: dueStandingOrdersCount > 0 ? 'danger' : 'warning'
    },
    {
      id: 'purchases',
      label: language === 'en' ? 'Purchases & Supply' : 'المشتريات والتوريد',
      icon: ShoppingBag,
      badge: null
    },
    {
      id: 'suppliers',
      label: language === 'en' ? 'Suppliers' : 'الموردين',
      icon: Truck,
      badge: suppliersWithDebt > 0 ? (language === 'en' ? `${suppliersWithDebt} Credit` : `${suppliersWithDebt} آجل`) : null,
      badgeType: 'warning'
    },
    {
      id: 'sales',
      label: language === 'en' ? 'Sales & Alerts' : 'المبيعات والتنبيهات',
      icon: TrendingUp,
      badge: (lowStockAlerts.length + nearExpiryBatches.length) > 0 ? (lowStockAlerts.length + nearExpiryBatches.length) : null,
      badgeType: 'danger'
    },
    {
      id: 'warehouse',
      label: language === 'en' ? 'Warehouse & Stock' : 'المخزن والمستودع',
      icon: Warehouse,
      badge: nearExpiryBatches.length > 0 ? (language === 'en' ? `${nearExpiryBatches.length} Expiry` : `${nearExpiryBatches.length} صلاحية`) : null,
      badgeType: 'warning'
    },
    {
      id: 'accounts',
      label: language === 'en' ? 'Accounts & Finance' : 'الحسابات والمالية',
      icon: Calculator,
      badge: null
    },
    {
      id: 'treasury',
      label: language === 'en' ? 'Treasury & Wallets' : 'الخزينة والمحافظ',
      icon: Wallet,
      badge: language === 'en' ? 'New' : 'جديد'
    },
    {
      id: 'academy',
      label: language === 'en' ? 'Coffee Academy' : 'أكاديمية القهوة',
      icon: GraduationCap,
      badge: language === 'en' ? 'Learn' : 'محتوى تعليمي'
    },
    {
      id: 'settings',
      label: language === 'en' ? 'Store & Contact Info' : 'بيانات التواصل والمتجر',
      icon: Settings,
      badge: language === 'en' ? 'New' : 'جديد'
    },
    {
      id: 'users',
      label: language === 'en' ? 'Users & Permissions' : 'الصلاحيات والمستخدمين',
      icon: ShieldCheck,
      badge: null
    }
  ];

  // Filter items based strictly on current user permissions
  const visibleNavItems = navItems.filter(item => {
    if (currentUser?.isOwner) return true;
    if (item.id === 'b2b') return currentUser?.isOwner || currentUser?.role === 'owner' || currentUser?.role === 'admin' || (currentUser?.permissions?.b2b ?? currentUser?.permissions?.customers ?? currentUser?.permissions?.sales ?? true);
    if (item.id === 'suppliers') return currentUser?.isOwner || currentUser?.role === 'owner' || currentUser?.role === 'admin' || (currentUser?.permissions?.suppliers ?? currentUser?.permissions?.purchases ?? true);
    if (item.id === 'treasury') return currentUser?.isOwner || currentUser?.role === 'owner' || currentUser?.role === 'admin' || (currentUser?.permissions?.treasury ?? currentUser?.permissions?.accounts ?? true);
    if (item.id === 'academy') return currentUser?.permissions?.academy ?? true;
    if (item.id === 'settings') return currentUser?.isOwner || currentUser?.role === 'owner' || currentUser?.role === 'admin' || (currentUser?.permissions?.settings ?? true);
    return Boolean(currentUser?.permissions && currentUser.permissions[item.id]);
  });

  return (
    <>
      {/* Mobile Drawer Backdrop */}
      {!sidebarCollapsed && (
        <div
          className="sidebar-mobile-backdrop"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      <aside
        className={`sidebar no-print ${sidebarCollapsed ? 'mobile-collapsed' : 'mobile-open'} ${activeTab !== 'pos' ? 'sidebar-coffee' : 'sidebar-mint'}`}
        style={{
          width: sidebarCollapsed ? '68px' : '240px',
          backgroundColor: '#ffffff',
          borderLeft: isRtl ? '1px solid var(--border-light)' : 'none',
          borderRight: !isRtl ? '1px solid var(--border-light)' : 'none',
          height: '100vh',
          position: 'sticky',
          top: 0,
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 250ms cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 50,
          boxShadow: '0 4px 20px rgba(5, 150, 105, 0.05)',
          overflow: 'hidden',
          flexShrink: 0
        }}
      >
        {/* Brand Header */}
        <div
          className="sidebar-brand-header"
          style={{
            padding: sidebarCollapsed ? '14px 8px' : '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: sidebarCollapsed ? 'center' : 'space-between',
            borderBottom: '2px solid var(--mint-200)',
            background: 'linear-gradient(180deg, #ffffff 0%, var(--mint-100) 100%)',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
            <img
              src="/caturra_logo.jpg"
              alt="Caturra"
              className="sidebar-brand-logo"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '9px',
                objectFit: 'cover',
                border: '2px solid var(--mint-400)',
                flexShrink: 0
              }}
            />
            {!sidebarCollapsed && (
              <div style={{ whiteSpace: 'nowrap', overflow: 'hidden' }}>
                <div className="sidebar-brand-title" style={{ fontWeight: '800', fontSize: '1.05rem', color: 'var(--mint-900)', lineHeight: '1.2' }}>
                  {language === 'en' ? 'Caturra' : 'كاتورا'}
                </div>
                <div className="sidebar-brand-sub" style={{ fontSize: '0.68rem', color: 'var(--mint-700)', fontWeight: '600' }}>
                  Caturra Coffee & Roaster
                </div>
              </div>
            )}
          </div>

          {/* Collapse / Expand Toggle Button */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="btn-icon sidebar-toggle-btn"
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              backgroundColor: '#ffffff',
              border: '1px solid var(--mint-300)',
              color: 'var(--mint-700)',
              cursor: 'pointer',
              display: sidebarCollapsed ? 'none' : 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
            title={sidebarCollapsed ? (language === 'en' ? 'Expand Menu' : 'توسيع القائمة') : (language === 'en' ? 'Collapse Menu' : 'تصغير القائمة')}
          >
            {isRtl ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        </div>

        {/* Button to expand if currently collapsed */}
        {sidebarCollapsed && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="btn-icon"
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                backgroundColor: 'var(--mint-100)',
                color: 'var(--mint-800)',
                border: '1px solid var(--mint-300)'
              }}
              title={language === 'en' ? 'Expand Menu' : 'توسيع القائمة'}
            >
              {isRtl ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>
          </div>
        )}

        {/* Navigation List */}
        <nav
          className="sidebar-nav"
          style={{
            flex: '1 1 0',
            minHeight: 0,
            padding: sidebarCollapsed ? '10px 6px' : '10px 10px',
            overflowY: 'auto',
            overflowX: 'hidden',
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}
        >
          {/* Switch to Client Storefront Link */}
          <a
            href="/"
            onClick={(e) => {
              if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
                e.preventDefault();
                setViewMode('client');
              }
            }}
            className="sidebar-store-link"
            style={{
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              gap: '10px',
              padding: '8px 12px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, var(--mint-100) 0%, var(--mint-50) 100%)',
              border: '1.5px dashed var(--mint-400)',
              color: 'var(--mint-900)',
              fontWeight: '700',
              fontSize: '0.84rem',
              cursor: 'pointer',
              marginBottom: '6px',
              transition: 'all 200ms ease',
              flexShrink: 0
            }}
            title={language === 'en' ? 'Go to Client Storefront' : 'الانتقال إلى متجر العملاء الإلكتروني'}
          >
            <Store size={18} color="var(--mint-700)" style={{ flexShrink: 0 }} />
            {!sidebarCollapsed && (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span style={{ whiteSpace: 'nowrap' }}>{language === 'en' ? 'Client Store' : 'متجر العملاء'}</span>
                <span className="badge badge-mint" style={{ fontSize: '0.68rem', padding: '2px 8px', flexShrink: 0 }}>{language === 'en' ? 'Visit 🛍️' : 'زيارة 🛍️'}</span>
              </span>
            )}
          </a>

          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  if (viewMode !== 'admin') setViewMode('admin');
                  if (typeof window !== 'undefined' && window.innerWidth <= 768) {
                    setSidebarCollapsed(true);
                  }
                }}
                className={`sidebar-nav-btn ${isActive ? 'active' : ''}`}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'var(--mint-50)'; }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                  gap: '10px',
                  padding: sidebarCollapsed ? '10px 0' : '8px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isActive ? 'linear-gradient(135deg, var(--mint-500) 0%, var(--mint-700) 100%)' : 'transparent',
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  fontWeight: isActive ? '800' : '600',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 180ms ease',
                  position: 'relative',
                  boxShadow: isActive ? '0 4px 14px rgba(4, 136, 75, 0.35)' : 'none',
                  flexShrink: 0
                }}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon size={17} color={isActive ? '#ffffff' : 'var(--mint-700)'} style={{ flexShrink: 0 }} />

                {!sidebarCollapsed && (
                  <span style={{ flex: 1, textAlign: isRtl ? 'right' : 'left', whiteSpace: 'nowrap' }}>
                    {item.label}
                  </span>
                )}

                {!sidebarCollapsed && item.badge && (
                  <span
                    className={`badge ${item.badgeType === 'danger' ? 'badge-danger' : item.badgeType === 'warning' ? 'badge-warning' : 'badge-mint'}`}
                    style={{
                      fontSize: '0.68rem',
                      padding: '2px 7px',
                      color: isActive ? '#ffffff' : undefined,
                      backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : undefined,
                      borderColor: isActive ? 'rgba(255,255,255,0.3)' : undefined,
                      flexShrink: 0
                    }}
                  >
                    {item.badge}
                  </span>
                )}

                {/* Indicator dot on collapsed mode if alerts */}
                {sidebarCollapsed && item.badge && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '8px',
                      left: '10px',
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      backgroundColor: item.badgeType === 'danger' ? '#ef4444' : '#f59e0b'
                    }}
                  />
                )}
              </button>
            );
          })}
        </nav>

        {/* User Footer Profile & Logout */}
        <div
          className="sidebar-footer"
          style={{
            padding: sidebarCollapsed ? '10px 8px' : '12px 14px',
            borderTop: '2px solid var(--mint-200)',
            background: 'linear-gradient(180deg, var(--mint-50) 0%, #ffffff 100%)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            flexShrink: 0
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              gap: '10px',
              overflow: 'hidden'
            }}
          >
            <div
              className="sidebar-user-avatar"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--mint-100)',
                border: '2px solid var(--mint-500)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                flexShrink: 0
              }}
            >
              {currentUser?.avatar && currentUser.avatar !== '☕' ? currentUser.avatar : <Coffee size={16} color="#d4a373" />}
            </div>

            {!sidebarCollapsed && (
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <div className="sidebar-user-name" style={{ fontWeight: '700', fontSize: '0.84rem', color: 'var(--text-main)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                  {currentUser?.fullName}
                </div>
                <div className="sidebar-user-role" style={{ fontSize: '0.70rem', color: currentUser?.isOwner ? '#b45309' : 'var(--mint-700)', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {currentUser?.isOwner ? (language === 'en' ? '👑 Primary Owner' : '👑 المالك الأساسي') : currentUser?.roleLabel}
                </div>
              </div>
            )}
          </div>

          {/* Logout Action Button */}
          <button
            onClick={logout}
            className="sidebar-logout-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
              gap: '8px',
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid #fee2e2',
              background: '#fff5f5',
              color: '#dc2626',
              fontSize: '0.78rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'background 150ms ease'
            }}
            title={language === 'en' ? 'Log Out' : 'تسجيل الخروج'}
          >
            <LogOut size={14} />
            {!sidebarCollapsed && <span>{language === 'en' ? 'Log Out' : 'تسجيل الخروج'}</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
