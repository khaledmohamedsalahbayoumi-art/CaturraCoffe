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
  Settings
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
    pendingOrdersCount
  } = useApp();

  // Navigation Items
  const navItems = [
    {
      id: 'products',
      label: 'المنتجات',
      icon: Package,
      badge: null
    },
    {
      id: 'pos',
      label: 'نقطة البيع (POS)',
      icon: ShoppingCart,
      badge: 'مباشر'
    },
    {
      id: 'invoices',
      label: 'الفواتير والطلبات',
      icon: FileText,
      badge: pendingOrdersCount > 0 ? `${pendingOrdersCount} معلق` : null,
      badgeType: 'warning'
    },
    {
      id: 'customers',
      label: 'العملاء والمديونيات',
      icon: Users,
      badge: customers.filter(c => c.debt > 0).length ? `${customers.filter(c => c.debt > 0).length} آجل` : null,
      badgeType: 'warning'
    },
    {
      id: 'purchases',
      label: 'المشتريات والتوريد',
      icon: ShoppingBag,
      badge: null
    },
    {
      id: 'sales',
      label: 'المبيعات والتنبيهات',
      icon: TrendingUp,
      badge: (lowStockAlerts.length + nearExpiryBatches.length) > 0 ? (lowStockAlerts.length + nearExpiryBatches.length) : null,
      badgeType: 'danger'
    },
    {
      id: 'warehouse',
      label: 'المخزن والمستودع',
      icon: Warehouse,
      badge: nearExpiryBatches.length > 0 ? `${nearExpiryBatches.length} صلاحية` : null,
      badgeType: 'warning'
    },
    {
      id: 'accounts',
      label: 'الحسابات والمالية',
      icon: Calculator,
      badge: null
    },
    {
      id: 'academy',
      label: 'أكاديمية القهوة',
      icon: GraduationCap,
      badge: 'محتوى تعليمي'
    },
    {
      id: 'settings',
      label: 'بيانات التواصل والمتجر',
      icon: Settings,
      badge: 'جديد'
    },
    {
      id: 'users',
      label: 'الصلاحيات والمستخدمين',
      icon: ShieldCheck,
      badge: null
    }
  ];

  // Filter items based strictly on current user permissions
  const visibleNavItems = navItems.filter(item => {
    if (currentUser?.isOwner) return true;
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
        className={`sidebar no-print ${sidebarCollapsed ? 'mobile-collapsed' : 'mobile-open'}`}
        style={{
          width: sidebarCollapsed ? '82px' : '270px',
          backgroundColor: '#ffffff',
          borderLeft: '1px solid var(--border-light)',
          height: '100vh',
          position: 'sticky',
          top: 0,
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 250ms cubic-bezier(0.4, 0, 0.2, 1)',
          zIndex: 50,
          boxShadow: '0 4px 20px rgba(5, 150, 105, 0.05)',
          overflow: 'hidden'
        }}
      >
      {/* Brand Header */}
      <div
        style={{
          padding: sidebarCollapsed ? '18px 12px' : '20px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarCollapsed ? 'center' : 'space-between',
          borderBottom: '2px solid var(--mint-200)',
          background: 'linear-gradient(180deg, #ffffff 0%, var(--mint-100) 100%)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
          <img
            src="/caturra_logo.jpg"
            alt="Caturra"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              objectFit: 'cover',
              border: '2px solid var(--mint-400)',
              flexShrink: 0
            }}
          />
          {!sidebarCollapsed && (
            <div style={{ whiteSpace: 'nowrap' }}>
              <div style={{ fontWeight: '800', fontSize: '1.15rem', color: 'var(--mint-900)', lineHeight: '1.2' }}>
                كاتورا
              </div>
              <div style={{ fontSize: '0.74rem', color: 'var(--mint-700)', fontWeight: '600' }}>
                Caturra Specialty Coffee
              </div>
            </div>
          )}
        </div>

        {/* Collapse / Expand Toggle Button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="btn-icon"
          style={{
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            border: '1px solid var(--mint-300)',
            color: 'var(--mint-700)',
            cursor: 'pointer',
            display: sidebarCollapsed ? 'none' : 'flex'
          }}
          title={sidebarCollapsed ? 'توسيع القائمة' : 'تصغير القائمة'}
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Button to expand if currently collapsed */}
      {sidebarCollapsed && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="btn-icon"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              backgroundColor: 'var(--mint-100)',
              color: 'var(--mint-800)',
              border: '1px solid var(--mint-300)'
            }}
            title="توسيع القائمة"
          >
            <ChevronLeft size={18} />
          </button>
        </div>
      )}

      {/* Navigation List */}
      <nav
        style={{
          flex: 1,
          padding: sidebarCollapsed ? '12px 8px' : '14px 12px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '5px'
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
          style={{
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
            gap: '12px',
            padding: '10px 14px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--mint-100) 0%, var(--mint-50) 100%)',
            border: '1.5px dashed var(--mint-400)',
            color: 'var(--mint-900)',
            fontWeight: '700',
            fontSize: '0.88rem',
            cursor: 'pointer',
            marginBottom: '8px',
            transition: 'all 200ms ease'
          }}
          title="الانتقال إلى متجر العملاء الإلكتروني"
        >
          <Store size={20} color="var(--mint-700)" />
          {!sidebarCollapsed && (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <span>متجر العملاء</span>
              <span className="badge badge-mint" style={{ fontSize: '0.7rem' }}>زيارة 🛍️</span>
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
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'var(--mint-50)'; }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'; }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                gap: '12px',
                padding: sidebarCollapsed ? '12px 0' : '11px 14px',
                borderRadius: '12px',
                border: 'none',
                background: isActive ? 'linear-gradient(135deg, var(--mint-500) 0%, var(--mint-700) 100%)' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: isActive ? '800' : '600',
                fontSize: '0.92rem',
                cursor: 'pointer',
                transition: 'all 180ms ease',
                position: 'relative',
                boxShadow: isActive ? '0 4px 16px rgba(4, 136, 75, 0.38)' : 'none'
              }}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <Icon size={20} color={isActive ? '#ffffff' : 'var(--mint-700)'} style={{ flexShrink: 0 }} />
              
              {!sidebarCollapsed && (
                <span style={{ flex: 1, textAlign: 'right', whiteSpace: 'nowrap' }}>
                  {item.label}
                </span>
              )}

              {!sidebarCollapsed && item.badge && (
                <span
                  className={`badge ${item.badgeType === 'danger' ? 'badge-danger' : item.badgeType === 'warning' ? 'badge-warning' : 'badge-mint'}`}
                  style={{
                    fontSize: '0.72rem',
                    padding: '2px 8px',
                    color: isActive ? '#ffffff' : undefined,
                    backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : undefined,
                    borderColor: isActive ? 'rgba(255,255,255,0.3)' : undefined
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
                    left: '12px',
                    width: '8px',
                    height: '8px',
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
        style={{
          padding: sidebarCollapsed ? '12px 8px' : '14px 16px',
          borderTop: '2px solid var(--mint-200)',
          background: 'linear-gradient(180deg, var(--mint-50) 0%, #ffffff 100%)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
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
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'var(--mint-100)',
              border: '2px solid var(--mint-500)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
              flexShrink: 0
            }}
          >
            {currentUser?.avatar || '☕'}
          </div>

          {!sidebarCollapsed && (
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ fontWeight: '700', fontSize: '0.88rem', color: 'var(--text-main)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {currentUser?.fullName}
              </div>
              <div style={{ fontSize: '0.74rem', color: currentUser?.isOwner ? '#b45309' : 'var(--mint-700)', fontWeight: '600' }}>
                {currentUser?.isOwner ? '👑 المالك الأساسي' : currentUser?.roleLabel}
              </div>
            </div>
          )}
        </div>

        {/* Logout Action Button */}
        <button
          onClick={logout}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
            gap: '10px',
            padding: '8px 12px',
            borderRadius: '8px',
            border: '1px solid #fee2e2',
            background: '#fff5f5',
            color: '#dc2626',
            fontSize: '0.84rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'background 150ms ease'
          }}
          title="تسجيل الخروج"
        >
          <LogOut size={16} />
          {!sidebarCollapsed && <span>تسجيل الخروج</span>}
        </button>
      </div>
    </aside>
    </>
  );
};
