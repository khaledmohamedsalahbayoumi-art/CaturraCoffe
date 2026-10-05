import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Bell,
  Search,
  Store,
  ChevronDown,
  AlertTriangle,
  Clock,
  Sparkles,
  Shield,
  Layers,
  ShoppingBag,
  Plus,
  Package,
  Menu,
  Smartphone,
  LogOut
} from 'lucide-react';

export const Navbar = () => {
  const {
    activeTab,
    setActiveTab,
    viewMode,
    setViewMode,
    sidebarCollapsed,
    setSidebarCollapsed,
    currentUser,
    users,
    loginAsUser,
    logout,
    lowStockAlerts,
    nearExpiryBatches,
    pendingOrders,
    pendingOrdersCount,
    openNotificationSettings
  } = useApp();

  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Tab Titles
  const tabTitles = {
    products: { title: 'إدارة المنتجات والأصناف', desc: 'إدارة البن المختص، أدوات الترشيح، والأسعار' },
    pos: { title: 'نقطة البيع السريعة (POS)', desc: 'إصدار الفواتير الفورية وربطها بالمخزن والعملاء' },
    invoices: { title: 'سجل الفواتير والمبيعات', desc: 'معاينة الفواتير، الطباعة، والإرسال عبر واتساب' },
    customers: { title: 'دليل العملاء والمديونيات', desc: 'بيانات العملاء، سجل مشترياتهم، وحسابات الآجل' },
    purchases: { title: 'فواتير المشتريات والتوريد', desc: 'إدخال فواتير الموردين وترحيلها المباشر للمخزن' },
    sales: { title: 'تقارير المبيعات والتنبيهات الذكية', desc: 'الأصناف الأكثر مبيعاً وتنبيهات الركود والهالك' },
    warehouse: { title: 'إدارة المخزن وتشغيل الدفعات', desc: 'متابعة الدفعات بتواريخ الصلاحية وتنبيهات النقص' },
    accounts: { title: 'الحسابات والمصروفات والربحية', desc: 'مقارنات المبيعات والمصروفات والأرباح الصافية' },
    users: { title: 'إدارة المستخدمين والصلاحيات', desc: 'حسابات الإدارة، صلاحيات الكاشير، وحساب المالك' },
    storeSettings: { title: 'بيانات التواصل وإعدادات المتجر', desc: 'أرقام الهواتف، الواتساب، العناوين، وشريط الإعلانات الترويجية' }
  };

  const totalAlerts = lowStockAlerts.length + nearExpiryBatches.length + (pendingOrdersCount || 0);

  return (
    <header
      className="navbar no-print"
      style={{
        height: isMobile ? '56px' : '74px',
        backgroundColor: '#ffffff',
        borderTop: '3px solid var(--mint-600)',
        borderBottom: '2px solid var(--mint-200)',
        padding: isMobile ? '0 10px' : '0 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        boxShadow: '0 4px 16px rgba(4, 136, 75, 0.08)',
        gap: isMobile ? '6px' : '14px'
      }}
    >
      {/* Dropdown Outside Click Backdrop */}
      {(showAlertsDropdown || showUserDropdown) && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 90,
            background: isMobile ? 'rgba(0, 0, 0, 0.2)' : 'transparent'
          }}
          onClick={() => {
            setShowAlertsDropdown(false);
            setShowUserDropdown(false);
          }}
        />
      )}

      {/* Title & Mobile Hamburger Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '10px', minWidth: 0, flex: '1 1 auto', overflow: 'hidden' }}>
        {/* Mobile Hamburger Toggle for Sidebar */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="btn-icon mobile-menu-btn"
          style={{
            width: isMobile ? '34px' : '36px',
            height: isMobile ? '34px' : '36px',
            borderRadius: '9px',
            background: 'var(--mint-50)',
            border: '1.5px solid var(--mint-300)',
            color: 'var(--mint-800)',
            flexShrink: 0,
            cursor: 'pointer'
          }}
          title="فتح القائمة الرئيسية"
        >
          <Menu size={isMobile ? 18 : 19} />
        </button>

        {!isMobile && (
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: 'var(--mint-500)',
              boxShadow: '0 0 10px var(--mint-400)',
              flexShrink: 0
            }}
          />
        )}
        <div style={{ minWidth: 0, overflow: 'hidden' }}>
          <h1 style={{ fontSize: isMobile ? '0.88rem' : 'clamp(1rem, 2vw, 1.25rem)', fontWeight: '800', color: 'var(--mint-950)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {tabTitles[activeTab]?.title || 'لوحة التحكم'}
          </h1>
          {!isMobile && (
            <p style={{ fontSize: '0.78rem', color: 'var(--mint-700)', margin: 0, fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {tabTitles[activeTab]?.desc || 'منظومة كاتورا المتكاملة لإدارة محامص ومتاجر القهوة المختصة'}
            </p>
          )}
        </div>
      </div>

      {/* Right Actions & Utilities */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '12px', flexShrink: 0 }}>
        
        {/* Toggle to Client Store */}
        <button
          onClick={() => setViewMode(viewMode === 'admin' ? 'client' : 'admin')}
          className="btn"
          style={{
            fontSize: isMobile ? '0.76rem' : '0.86rem',
            padding: isMobile ? '6px 8px' : '8px 16px',
            borderRadius: '10px',
            border: '1.5px solid var(--mint-400)',
            background: 'var(--mint-100)',
            color: 'var(--mint-950)',
            fontWeight: '800',
            boxShadow: '0 2px 8px rgba(4, 136, 75, 0.12)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            flexShrink: 0,
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
          title="معاينة واجهة المتجر كما يراها العميل"
        >
          <Store size={isMobile ? 15 : 18} color="var(--mint-700)" />
          <span>{isMobile ? 'المتجر' : 'واجهة المتجر للعملاء'}</span>
        </button>

        {/* Smart Alerts Bell Notification */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={() => {
              setShowAlertsDropdown(!showAlertsDropdown);
              setShowUserDropdown(false);
            }}
            className="btn-icon"
            style={{
              position: 'relative',
              width: isMobile ? '34px' : '42px',
              height: isMobile ? '34px' : '42px',
              borderRadius: '10px',
              background: 'var(--mint-50)',
              border: '1.5px solid var(--mint-200)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="التنبيهات الذكية ونواقص المخزون"
          >
            <Bell size={isMobile ? 17 : 20} color="var(--mint-800)" />
            {totalAlerts > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: isMobile ? '-3px' : '6px',
                  right: isMobile ? '-3px' : '6px',
                  width: isMobile ? '16px' : '18px',
                  height: isMobile ? '16px' : '18px',
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  fontSize: isMobile ? '0.64rem' : '0.7rem',
                  fontWeight: '800',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #ffffff'
                }}
              >
                {totalAlerts}
              </span>
            )}
          </button>

          {/* Alerts Dropdown Modal */}
          {showAlertsDropdown && (
            <div
              style={{
                position: isMobile ? 'fixed' : 'absolute',
                top: isMobile ? '60px' : '50px',
                left: isMobile ? '10px' : 0,
                right: isMobile ? '10px' : 'auto',
                width: isMobile ? 'auto' : '340px',
                maxWidth: isMobile ? 'calc(100vw - 20px)' : '340px',
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                boxShadow: '0 12px 35px rgba(0,0,0,0.18)',
                border: '1.5px solid var(--border-mint)',
                padding: isMobile ? '12px' : '16px',
                zIndex: 100,
                animation: 'slideUp 200ms ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px', marginBottom: '12px' }}>
                <span style={{ fontWeight: '700', fontSize: '0.95rem', color: 'var(--mint-900)' }}>
                  🔔 مركز التنبيهات الذكية ({totalAlerts})
                </span>
                <span className="badge badge-mint" style={{ fontSize: '0.72rem' }}>فوري</span>
              </div>

              {totalAlerts === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  🎉 لا توجد تنبيهات حالية، المخزون والصلاحيات بحالة ممتازة!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '340px', overflowY: 'auto' }}>
                  
                  {/* Pending Online Orders Alerts */}
                  {pendingOrders && pendingOrders.map(order => (
                    <div
                      key={order.id}
                      onClick={() => {
                        setActiveTab('invoices');
                        setShowAlertsDropdown(false);
                      }}
                      style={{
                        padding: '12px',
                        background: '#fffbeb',
                        border: '1.5px solid #fde68a',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(245, 158, 11, 0.15)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#b45309', fontWeight: '800', fontSize: '0.84rem' }}>
                          <Package size={15} />
                          <span>طلب أونلاين جديد معلق!</span>
                        </div>
                        <span style={{ fontSize: '0.72rem', background: '#f59e0b', color: '#ffffff', padding: '2px 8px', borderRadius: '9999px', fontWeight: '800' }}>
                          بانتظار التأكيد
                        </span>
                      </div>
                      <div style={{ fontSize: '0.86rem', color: '#1e293b', marginTop: '6px', fontWeight: '800' }}>
                        {order.customerName} ({order.total} ج.م)
                      </div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        رقم الفاتورة: {order.invoiceNumber} • {order.items.length} أصناف
                      </div>
                      {order.customerAddress && (
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                          📍 {order.customerAddress}
                        </div>
                      )}
                      <div style={{ fontSize: '0.76rem', color: '#b45309', marginTop: '6px', fontWeight: '700', textDecoration: 'underline' }}>
                        مراجعة واعتماد الطلب في الفواتير ←
                      </div>
                    </div>
                  ))}

                  {/* Low stock alerts */}
                  {lowStockAlerts.map(prod => (
                    <div
                      key={prod.id}
                      onClick={() => {
                        setActiveTab('purchases');
                        setShowAlertsDropdown(false);
                      }}
                      style={{
                        padding: '10px',
                        background: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '10px',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#991b1b', fontWeight: '700', fontSize: '0.84rem' }}>
                        <AlertTriangle size={15} />
                        <span>نقص مخزون حرج!</span>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#1e293b', marginTop: '4px', fontWeight: '600' }}>
                        {prod.name}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: '#dc2626', marginTop: '4px' }}>
                        <span>المتبقي: {prod.stock} قطع</span>
                        <span style={{ textDecoration: 'underline' }}>طلب توريد ←</span>
                      </div>
                    </div>
                  ))}

                  {/* Near expiry alerts */}
                  {nearExpiryBatches.map(b => (
                    <div
                      key={b.id}
                      onClick={() => {
                        setActiveTab('sales');
                        setShowAlertsDropdown(false);
                      }}
                      style={{
                        padding: '10px',
                        background: '#fffbeb',
                        border: '1px solid #fde68a',
                        borderRadius: '10px',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#92400e', fontWeight: '700', fontSize: '0.84rem' }}>
                        <Clock size={15} />
                        <span>دفعة تقترب من انتهاء الصلاحية</span>
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#1e293b', marginTop: '4px', fontWeight: '600' }}>
                        {b.productName} ({b.batchCode})
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.76rem', color: '#b45309', marginTop: '4px' }}>
                        <span>الكمية: {b.quantity} | الصلاحية: {b.expiryDate}</span>
                        <span style={{ textDecoration: 'underline' }}>عمل عرض تخفيض ←</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Phone Notifications Settings Link */}
              <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-light)', paddingTop: '10px' }}>
                <button
                  onClick={() => {
                    openNotificationSettings();
                    setShowAlertsDropdown(false);
                  }}
                  className="btn btn-outline"
                  style={{
                    width: '100%',
                    fontSize: '0.82rem',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    background: 'var(--mint-50)',
                    borderColor: 'var(--mint-300)',
                    color: 'var(--mint-900)',
                    fontWeight: '800',
                    borderRadius: '10px'
                  }}
                >
                  <Smartphone size={15} color="var(--mint-700)" />
                  <span>تفعيل وضبط إشعارات الموبايل وتلجرام 📱</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Switcher */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={() => {
              setShowUserDropdown(!showUserDropdown);
              setShowAlertsDropdown(false);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '3px' : '10px',
              padding: isMobile ? '4px 6px' : '6px 14px',
              borderRadius: '10px',
              background: 'var(--mint-50)',
              border: '1.5px solid var(--mint-200)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
            title={currentUser?.fullName}
          >
            <div
              style={{
                width: isMobile ? '28px' : '32px',
                height: isMobile ? '28px' : '32px',
                borderRadius: '50%',
                background: 'var(--mint-200)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: isMobile ? '0.9rem' : '1rem',
                flexShrink: 0
              }}
            >
              {currentUser?.avatar || '☕'}
            </div>
            {!isMobile && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: '800', color: 'var(--mint-950)' }}>
                  {currentUser?.fullName}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--mint-700)', fontWeight: '600' }}>
                  {currentUser?.isOwner ? 'المالك (Owner)' : currentUser?.roleLabel}
                </div>
              </div>
            )}
            <ChevronDown size={isMobile ? 12 : 14} color="var(--text-muted)" />
          </button>

          {/* Quick User Switcher Menu */}
          {showUserDropdown && (
            <div
              style={{
                position: isMobile ? 'fixed' : 'absolute',
                top: isMobile ? '60px' : '50px',
                left: isMobile ? '10px' : 0,
                right: isMobile ? '10px' : 'auto',
                width: isMobile ? 'auto' : '260px',
                maxWidth: isMobile ? 'calc(100vw - 20px)' : '260px',
                backgroundColor: '#ffffff',
                borderRadius: '14px',
                boxShadow: '0 12px 35px rgba(0,0,0,0.18)',
                border: '1.5px solid var(--border-light)',
                padding: '12px',
                zIndex: 100,
                animation: 'slideUp 200ms ease'
              }}
            >
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', padding: '6px 10px', borderBottom: '1px solid var(--border-light)' }}>
                تبديل المستخدم الحالي (لتجربة الصلاحيات):
              </div>
              {users.map(u => (
                <div
                  key={u.id}
                  onClick={() => {
                    loginAsUser(u.id);
                    setShowUserDropdown(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: u.id === currentUser.id ? 'var(--mint-50)' : 'transparent',
                    color: u.id === currentUser.id ? 'var(--mint-800)' : 'var(--text-main)',
                    fontSize: '0.85rem',
                    fontWeight: u.id === currentUser.id ? '700' : '500'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{u.avatar}</span>
                    <span>{u.fullName}</span>
                  </div>
                  {u.isOwner && <span style={{ fontSize: '0.7rem', color: '#b45309' }}>👑</span>}
                </div>
              ))}

              {/* Logout Option */}
              <div
                onClick={() => {
                  logout();
                  setShowUserDropdown(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 10px',
                  marginTop: '6px',
                  borderTop: '1px solid var(--border-light)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  color: '#dc2626',
                  fontSize: '0.84rem',
                  fontWeight: '700',
                  transition: 'background 150ms ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2'; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
              >
                <LogOut size={15} />
                <span>تسجيل الخروج من النظام</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
