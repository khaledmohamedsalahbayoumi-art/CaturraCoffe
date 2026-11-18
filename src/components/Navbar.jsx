import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { playNotificationSound, vibratePhone } from '../utils/notifications';
import {
  Bell,
  Store,
  ChevronDown,
  AlertTriangle,
  Clock,
  Package,
  Menu,
  Smartphone,
  LogOut,
  CheckCheck,
  Check,
  Coffee,
  Globe,
  Handshake
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
    logout,
    logoutAndSwitchUser,
    lowStockAlerts,
    nearExpiryBatches,
    pendingOrders,
    pendingOrdersCount,
    unreadPendingOrders = [],
    b2bRequests = [],
    unreadB2BCount = 0,
    readAlertIds = [],
    markAllAlertsAsRead,
    markAlertAsRead,
    unreadAlertsCount = 0,
    openNotificationSettings,
    language,
    toggleLanguage,
    t
  } = useApp();

  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);
  const [newOrderToast, setNewOrderToast] = useState(null);
  const prevPendingOrdersCountRef = useRef(pendingOrdersCount);
  const prevB2BCountRef = useRef(b2bRequests?.length || 0);

  // Instant notification sound & toast banner whenever an incoming order arrives
  useEffect(() => {
    if (pendingOrdersCount > prevPendingOrdersCountRef.current) {
      playNotificationSound();
      vibratePhone([300, 150, 300, 150, 400]);
      const latestOrder = pendingOrders?.[0];
      setNewOrderToast({
        title: '🚨 تنبيه فوري: وصل طلب أونلاين جديد!',
        customerName: latestOrder?.customerName || 'عميل جديد',
        total: latestOrder?.total || 0,
        invoiceNumber: latestOrder?.invoiceNumber || ''
      });
      const timer = setTimeout(() => {
        setNewOrderToast(null);
      }, 9000);
      return () => clearTimeout(timer);
    }
    prevPendingOrdersCountRef.current = pendingOrdersCount;
  }, [pendingOrdersCount, pendingOrders]);

  // Instant alert when a new B2B Wholesale inquiry arrives
  useEffect(() => {
    if ((b2bRequests?.length || 0) > prevB2BCountRef.current) {
      playNotificationSound();
      vibratePhone([300, 150, 300, 150, 400]);
      const latestB2B = b2bRequests?.[0];
      setNewOrderToast({
        title: '☕ تنبيه فوري: استفسار جملة وشراكة كافيه جديد (B2B)!',
        customerName: `${latestB2B?.companyName || 'منشأة جديدة'} (${latestB2B?.city || ''})`,
        total: latestB2B?.monthlyVolume ? `${latestB2B.monthlyVolume} كجم/شهر` : 'توريد جملة',
        invoiceNumber: latestB2B?.refCode || ''
      });
      const timer = setTimeout(() => {
        setNewOrderToast(null);
      }, 9000);
      return () => clearTimeout(timer);
    }
    prevB2BCountRef.current = b2bRequests?.length || 0;
  }, [b2bRequests]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Tab Titles
  const tabTitles = {
    products: {
      title: language === 'en' ? 'Product & Inventory Management' : 'إدارة المنتجات والأصناف',
      desc: language === 'en' ? 'Manage specialty coffee beans, brew gear, and prices' : 'إدارة البن المختص، أدوات الترشيح، والأسعار'
    },
    pos: {
      title: language === 'en' ? 'Point of Sale (POS)' : 'نقطة البيع السريعة (POS)',
      desc: language === 'en' ? 'Instant invoice generation linked to warehouse and customers' : 'إصدار الفواتير الفورية وربطها بالمخزن والعملاء'
    },
    invoices: {
      title: language === 'en' ? 'Invoices & Orders Log' : 'سجل الفواتير والمبيعات',
      desc: language === 'en' ? 'Preview invoices, print receipts, and share via WhatsApp' : 'معاينة الفواتير، الطباعة، والإرسال عبر واتساب'
    },
    customers: {
      title: language === 'en' ? 'Customers & Debts Directory' : 'دليل العملاء والمديونيات',
      desc: language === 'en' ? 'Customer records, order history, and credit balance' : 'بيانات العملاء، سجل مشترياتهم، وحسابات الآجل'
    },
    b2b: {
      title: language === 'en' ? 'B2B Wholesale Partnerships' : 'مبيعات الجملة والشركات (B2B)',
      desc: language === 'en' ? 'Wholesale inquiries, private label roasting, and supply contracts' : 'إدارة طلبات التوريد، عروض الأسعار، عقود التوريد، والـ Private Label'
    },
    purchases: {
      title: language === 'en' ? 'Purchases & Supplies Invoices' : 'فواتير المشتريات والتوريد',
      desc: language === 'en' ? 'Supplier invoices and direct inventory stock intake' : 'إدخال فواتير الموردين وترحيلها المباشر للمخزن'
    },
    suppliers: {
      title: language === 'en' ? 'Suppliers & Payables' : 'إدارة الموردين والمديونيات',
      desc: language === 'en' ? 'Suppliers directory, supply bills, and PDF account statements' : 'سجل الموردين، فواتير التوريد، سداد الدفعات الجزئية، وتصدير كشوف الحساب PDF'
    },
    sales: {
      title: language === 'en' ? 'Sales Reports & Smart Alerts' : 'تقارير المبيعات والتنبيهات الذكية',
      desc: language === 'en' ? 'Best-sellers, inventory turnover, and deadstock alerts' : 'الأصناف الأكثر مبيعاً وتنبيهات الركود والهالك'
    },
    warehouse: {
      title: language === 'en' ? 'Warehouse & Expiry Batch Control' : 'إدارة المخزن وتشغيل الدفعات',
      desc: language === 'en' ? 'Track lots with expiry dates and low-stock alarms' : 'متابعة الدفعات بتواريخ الصلاحية وتنبيهات النقص'
    },
    accounts: {
      title: language === 'en' ? 'Accounts & Financial Reports' : 'الحسابات والمصروفات والربحية',
      desc: language === 'en' ? 'Sales vs expenses comparisons and net profit analysis' : 'مقارنات المبيعات والمصروفات والأرباح الصافية'
    },
    treasury: {
      title: language === 'en' ? 'Treasury & Cash Wallets' : 'الخزينة والمحافظ النقدية',
      desc: language === 'en' ? 'Manage cash in drawer, InstaPay, and bank balances' : 'إدارة أرصدة النقدية، إنستاباي، والتحويلات'
    },
    academy: {
      title: language === 'en' ? 'Coffee Academy & Guides' : 'أكاديمية القهوة والمدونة',
      desc: language === 'en' ? 'Publish coffee guides, extraction recipes, and articles' : 'إدارة المقالات وأدلة التحضير'
    },
    users: {
      title: language === 'en' ? 'Users & Permissions' : 'إدارة المستخدمين والصلاحيات',
      desc: language === 'en' ? 'Admin accounts, cashier permissions, and owner access' : 'حسابات الإدارة، صلاحيات الكاشير، وحساب المالك'
    },
    storeSettings: {
      title: language === 'en' ? 'Store & Contact Settings' : 'بيانات التواصل وإعدادات المتجر',
      desc: language === 'en' ? 'Phone numbers, WhatsApp, addresses, and banner ticker' : 'أرقام الهواتف، الواتساب، العناوين، وشريط الإعلانات الترويجية'
    },
    settings: {
      title: language === 'en' ? 'Store & Contact Settings' : 'بيانات التواصل وإعدادات المتجر',
      desc: language === 'en' ? 'Phone numbers, WhatsApp, addresses, and banner ticker' : 'أرقام الهواتف، الواتساب، العناوين، وشريط الإعلانات الترويجية'
    }
  };

  const totalAlerts = lowStockAlerts.length + nearExpiryBatches.length + (pendingOrdersCount || 0) + (unreadB2BCount || 0);

  return (
    <header
      className={`navbar no-print ${activeTab !== 'pos' ? 'navbar-coffee' : 'navbar-mint'}`}
      style={{
        height: isMobile ? '46px' : '42px',
        backgroundColor: '#ffffff',
        borderTop: '2px solid var(--mint-600)',
        borderBottom: '1.5px solid var(--mint-200)',
        padding: isMobile ? '0 8px' : '0 12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        boxShadow: '0 2px 10px rgba(4, 136, 75, 0.06)',
        gap: isMobile ? '6px' : '8px'
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
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '8px', minWidth: 0, flex: '1 1 auto', overflow: 'hidden' }}>
        {/* Mobile Hamburger Toggle for Sidebar */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="btn-icon mobile-menu-btn"
          style={{
            width: isMobile ? '28px' : '28px',
            height: isMobile ? '28px' : '28px',
            borderRadius: '6px',
            background: 'var(--mint-50)',
            border: '1px solid var(--mint-300)',
            color: 'var(--mint-800)',
            flexShrink: 0,
            cursor: 'pointer'
          }}
          title="فتح القائمة الرئيسية"
        >
          <Menu size={isMobile ? 15 : 15} />
        </button>

        {!isMobile && (
          <div
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'var(--mint-500)',
              boxShadow: '0 0 6px var(--mint-400)',
              flexShrink: 0
            }}
          />
        )}
        <div style={{ minWidth: 0, overflow: 'hidden' }}>
          <h1 className="navbar-title" style={{ fontSize: isMobile ? '0.80rem' : '0.88rem', fontWeight: '800', color: 'var(--mint-950)', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {tabTitles[activeTab]?.title || 'لوحة التحكم'}
          </h1>
          {!isMobile && (
            <p className="navbar-subtitle" style={{ fontSize: '0.62rem', color: 'var(--mint-700)', margin: 0, fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {tabTitles[activeTab]?.desc || 'منظومة كاتورا المتكاملة لإدارة محامص ومتاجر القهوة المختصة'}
            </p>
          )}
        </div>
      </div>

      {/* Right Actions & Utilities */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '6px' : '10px', flexShrink: 0 }}>
        
        {/* Language Switcher (تبديل اللغة) */}
        <button
          type="button"
          onClick={toggleLanguage}
          className="btn-icon navbar-lang-btn"
          style={{
            height: isMobile ? '28px' : '28px',
            padding: isMobile ? '0 6px' : '0 8px',
            borderRadius: '6px',
            background: 'var(--mint-50)',
            border: '1px solid var(--mint-300)',
            color: 'var(--mint-900)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            cursor: 'pointer',
            fontSize: isMobile ? '0.70rem' : '0.74rem',
            fontWeight: '800',
            boxShadow: '0 1px 4px rgba(4, 136, 75, 0.08)',
            userSelect: 'none'
          }}
          title={language === 'ar' ? 'Switch to English 🇬🇧' : 'التحويل إلى اللغة العربية 🇪🇬'}
        >
          <Globe size={13} color="var(--mint-700)" />
          <span style={{ fontWeight: '900' }}>{language === 'ar' ? 'EN' : 'عربي'}</span>
        </button>

        {/* Direct Link to Customer Storefront */}
        <a
          href="/"
          onClick={(e) => {
            if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
              e.preventDefault();
              setViewMode('client');
            }
          }}
          className="btn navbar-store-btn"
          style={{
            textDecoration: 'none',
            fontSize: isMobile ? '0.70rem' : '0.74rem',
            padding: isMobile ? '3px 6px' : '3px 10px',
            borderRadius: '6px',
            border: '1.2px solid var(--mint-400)',
            background: 'var(--mint-100)',
            color: 'var(--mint-950)',
            fontWeight: '800',
            boxShadow: '0 1px 6px rgba(4, 136, 75, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            flexShrink: 0,
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
          title={language === 'en' ? 'Go to Customer Store' : 'الانتقال إلى متجر العملاء الإلكتروني'}
        >
          <Store size={13} color="var(--mint-700)" />
          <span>{isMobile ? (language === 'en' ? 'Store' : 'المتجر') : (language === 'en' ? 'Store 🛍️' : 'متجر العملاء 🛍️')}</span>
        </a>

        {/* Smart Alerts Bell Notification */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={() => {
              setShowAlertsDropdown(!showAlertsDropdown);
              setShowUserDropdown(false);
            }}
            className="btn-icon navbar-bell-btn"
            style={{
              position: 'relative',
              width: isMobile ? '28px' : '28px',
              height: isMobile ? '28px' : '28px',
              borderRadius: '6px',
              background: (pendingOrdersCount > 0 || unreadPendingOrders.length > 0) ? '#281107' : 'var(--mint-50)',
              border: (pendingOrdersCount > 0 || unreadPendingOrders.length > 0)
                ? '1.5px solid #f59e0b'
                : (unreadAlertsCount > 0 ? '1.5px solid #ef4444' : '1px solid var(--mint-200)'),
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: (pendingOrdersCount > 0 || unreadPendingOrders.length > 0)
                ? '0 0 10px rgba(245, 158, 11, 0.55)'
                : 'none',
              animation: (pendingOrdersCount > 0 || unreadPendingOrders.length > 0)
                ? 'pulse 2s infinite'
                : 'none'
            }}
            title={pendingOrdersCount > 0 ? (language === 'en' ? `${pendingOrdersCount} new pending online orders!` : `يوجد (${pendingOrdersCount}) طلبات جديدة معلقة!`) : (language === 'en' ? 'Smart alerts & stock warnings' : 'التنبيهات الذكية ونواقص المخزون')}
          >
            <Bell
              size={isMobile ? 14 : 14}
              color={(pendingOrdersCount > 0 || unreadPendingOrders.length > 0) ? '#fbbf24' : (unreadAlertsCount > 0 ? '#ef4444' : 'var(--mint-800)')}
            />
            {unreadAlertsCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: isMobile ? '-4px' : '2px',
                  right: isMobile ? '-4px' : '2px',
                  minWidth: isMobile ? '16px' : '20px',
                  height: isMobile ? '16px' : '20px',
                  padding: '0 4px',
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  fontSize: isMobile ? '0.64rem' : '0.72rem',
                  fontWeight: '900',
                  borderRadius: '9999px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '2px solid #1b0d07',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.5)'
                }}
              >
                {unreadAlertsCount}
              </span>
            )}
          </button>

          {/* Alerts Dropdown Modal (Espresso Background & White Typography) */}
          {showAlertsDropdown && (
            <div
              className="navbar-alerts-dropdown"
              style={{
                position: isMobile ? 'fixed' : 'absolute',
                top: isMobile ? '52px' : '48px',
                left: isMobile ? '10px' : 0,
                right: isMobile ? '10px' : 'auto',
                width: isMobile ? 'auto' : '360px',
                maxWidth: isMobile ? 'calc(100vw - 20px)' : '360px',
                backgroundColor: '#FFFDF9',
                borderRadius: '16px',
                boxShadow: '0 18px 48px rgba(74, 50, 32, 0.22)',
                border: '1.5px solid #EDD9BD',
                padding: isMobile ? '14px' : '18px',
                zIndex: 100,
                animation: 'slideUp 200ms ease',
                color: '#4A3220'
              }}
            >
              {/* Dropdown Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #EDD9BD', paddingBottom: '12px', marginBottom: '14px', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontWeight: '900', fontSize: '0.96rem', color: '#4A3220' }}>
                    🔔 مركز التنبيهات الذكية ({unreadAlertsCount})
                  </span>
                  <span style={{
                    fontSize: '0.7rem',
                    background: '#96663B',
                    color: '#FFFDF9',
                    fontWeight: '900',
                    padding: '2px 8px',
                    borderRadius: '20px'
                  }}>فوري</span>
                </div>

                {/* Read All Button */}
                {unreadAlertsCount > 0 ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      markAllAlertsAsRead();
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: '#FFF8EE',
                      border: '1.5px solid #EDD9BD',
                      color: '#96663B',
                      borderRadius: '8px',
                      padding: '4px 10px',
                      fontSize: '0.74rem',
                      fontWeight: '800',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#96663B';
                      e.currentTarget.style.color = '#FFFDF9';
                      e.currentTarget.style.borderColor = '#7A5230';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#FFF8EE';
                      e.currentTarget.style.color = '#96663B';
                      e.currentTarget.style.borderColor = '#EDD9BD';
                    }}
                    title="تحديد كافة التنبيهات كمقروءة (Read All)"
                  >
                    <CheckCheck size={14} color="#96663B" />
                    <span>تحديد الكل كمقروء</span>
                  </button>
                ) : (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'rgba(91, 140, 90, 0.15)',
                      border: '1px solid #5B8C5A',
                      color: '#3d6a3c',
                      borderRadius: '8px',
                      padding: '3px 8px',
                      fontSize: '0.72rem',
                      fontWeight: '800'
                    }}
                  >
                    <CheckCheck size={13} color="#3d6a3c" />
                    <span>الكل مقروء ✓</span>
                  </span>
                )}
              </div>

              {totalAlerts === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#6B4A2E', fontSize: '0.9rem', fontWeight: '600' }}>
                  🎉 لا توجد تنبيهات حالية، المخزون والطلبات والصلاحيات بحالة ممتازة!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '360px', overflowY: 'auto' }}>
                  
                  {/* Pending Online Orders Alerts - Highest Priority */}
                  {pendingOrders && pendingOrders.map(order => {
                    const isRead = readAlertIds?.includes(`order-${order.id}`);

                    return (
                      <div
                        key={order.id}
                        onClick={() => {
                          setActiveTab('invoices');
                          setShowAlertsDropdown(false);
                        }}
                        style={{
                          padding: '12px 14px',
                          background: isRead ? '#FFFDF9' : '#FFF8EE',
                          border: isRead ? '1.5px solid #EDD9BD' : '2px solid #C49A5C',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          boxShadow: isRead ? 'none' : '0 4px 18px rgba(196, 154, 92, 0.2)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4A3220', fontWeight: '900', fontSize: '0.86rem' }}>
                            <Package size={16} color="#96663B" />
                            <span>طلب أونلاين جديد معلق!</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {isRead ? (
                              <span style={{ fontSize: '0.7rem', color: '#3d6a3c', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                                <Check size={13} /> مقروء ✓
                              </span>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAlertAsRead(`order-${order.id}`);
                                }}
                                style={{
                                  background: '#FFFDF9',
                                  border: '1px solid #EDD9BD',
                                  borderRadius: '6px',
                                  padding: '2px 7px',
                                  fontSize: '0.7rem',
                                  color: '#4A3220',
                                  fontWeight: '800',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '2px'
                                }}
                                title="تحديد كمقروء"
                              >
                                <Check size={11} color="#96663B" />
                                <span>مقروء</span>
                              </button>
                            )}
                            <span style={{ fontSize: '0.72rem', background: isRead ? '#EDD9BD' : '#96663B', color: isRead ? '#4A3220' : '#FFFDF9', padding: '2px 8px', borderRadius: '9999px', fontWeight: '900' }}>
                              بانتظار التأكيد
                            </span>
                          </div>
                        </div>

                        <div style={{ fontSize: '0.92rem', color: '#4A3220', marginTop: '6px', fontWeight: '900' }}>
                          {order.customerName} <span style={{ color: '#96663B' }}>({order.total} ج.م)</span>
                        </div>

                        <div style={{ fontSize: '0.78rem', color: '#6B4A2E', marginTop: '3px', fontWeight: '600' }}>
                          رقم الفاتورة: <span style={{ color: '#96663B', fontWeight: '800' }}>#{order.invoiceNumber}</span> • {order.items?.length || 0} أصناف
                        </div>

                        {order.customerAddress && (
                          <div style={{ fontSize: '0.76rem', color: '#6B4A2E', marginTop: '3px' }}>
                            📍 {order.customerAddress}
                          </div>
                        )}

                        <div style={{ fontSize: '0.8rem', color: '#96663B', marginTop: '6px', fontWeight: '800', textDecoration: 'underline' }}>
                          مراجعة واعتماد الطلب في الفواتير ←
                        </div>
                      </div>
                    );
                  })}

                  {/* B2B Wholesale Partnership Inquiries */}
                  {b2bRequests && b2bRequests.filter(l => l.status === 'new' || !l.isRead).map(lead => {
                    const isRead = readAlertIds?.includes(`b2b-${lead.id}`) || lead.isRead;

                    return (
                      <div
                        key={lead.id}
                        onClick={() => {
                          setActiveTab('b2b');
                          setShowAlertsDropdown(false);
                        }}
                        style={{
                          padding: '12px 14px',
                          background: isRead ? '#FFFDF9' : '#FFF8EE',
                          border: isRead ? '1.5px solid #EDD9BD' : '2px solid #C49A5C',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          boxShadow: isRead ? 'none' : '0 4px 18px rgba(196, 154, 92, 0.2)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4A3220', fontWeight: '900', fontSize: '0.86rem' }}>
                            <Handshake size={16} color="#96663B" />
                            <span>طلب شراكة وتوريد كافيه (B2B)!</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {isRead ? (
                              <span style={{ fontSize: '0.7rem', color: '#3d6a3c', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                                <Check size={13} /> مقروء ✓
                              </span>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAlertAsRead(`b2b-${lead.id}`);
                                }}
                                style={{
                                  background: '#FFFDF9',
                                  border: '1px solid #EDD9BD',
                                  borderRadius: '6px',
                                  padding: '2px 7px',
                                  fontSize: '0.7rem',
                                  color: '#4A3220',
                                  fontWeight: '800',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '2px'
                                }}
                                title="تحديد كمقروء"
                              >
                                <Check size={11} color="#96663B" />
                                <span>مقروء</span>
                              </button>
                            )}
                            <span style={{ fontSize: '0.72rem', background: isRead ? '#EDD9BD' : '#96663B', color: isRead ? '#4A3220' : '#FFFDF9', padding: '2px 8px', borderRadius: '9999px', fontWeight: '900' }}>
                              جديد
                            </span>
                          </div>
                        </div>

                        <div style={{ fontSize: '0.92rem', color: '#4A3220', marginTop: '6px', fontWeight: '900' }}>
                          {lead.companyName} <span style={{ color: '#96663B' }}>({lead.monthlyVolume || '25-50'} كجم/شهر)</span>
                        </div>

                        <div style={{ fontSize: '0.78rem', color: '#6B4A2E', opacity: 0.95, marginTop: '3px', fontWeight: '600' }}>
                          كود الطلب: <span style={{ color: '#96663B', fontWeight: '800' }}>#{lead.refCode}</span> • المسؤول: {lead.contactName || 'غير محدد'} • {lead.city}
                        </div>

                        {lead.notes && (
                          <div style={{ fontSize: '0.76rem', color: '#6B4A2E', marginTop: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            💬 {lead.notes}
                          </div>
                        )}

                        <div style={{ fontSize: '0.8rem', color: '#96663B', marginTop: '6px', fontWeight: '800', textDecoration: 'underline' }}>
                          فتح ملف الشريك والرد عبر واتساب ←
                        </div>
                      </div>
                    );
                  })}

                  {/* Low stock alerts */}
                  {lowStockAlerts.map(prod => {
                    const isRead = readAlertIds?.includes(`stock-${prod.id}`);

                    return (
                      <div
                        key={prod.id}
                        onClick={() => {
                          setActiveTab('purchases');
                          setShowAlertsDropdown(false);
                        }}
                        style={{
                          padding: '12px 14px',
                          background: isRead ? '#FFFDF9' : '#FFF8EE',
                          border: isRead ? '1.5px solid #EDD9BD' : '2px solid #ef4444',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          boxShadow: isRead ? 'none' : '0 4px 14px rgba(239, 68, 68, 0.15)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4A3220', fontWeight: '900', fontSize: '0.86rem' }}>
                            <AlertTriangle size={16} color="#ef4444" />
                            <span>نقص مخزون حرج!</span>
                          </div>
                          {isRead ? (
                            <span style={{ fontSize: '0.7rem', color: '#3d6a3c', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                              <Check size={13} /> مقروء ✓
                            </span>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAlertAsRead(`stock-${prod.id}`);
                              }}
                              style={{
                                background: '#FFFDF9',
                                border: '1px solid #EDD9BD',
                                borderRadius: '6px',
                                padding: '2px 7px',
                                fontSize: '0.7rem',
                                color: '#4A3220',
                                fontWeight: '800',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '2px'
                              }}
                              title="تحديد كمقروء"
                            >
                              <Check size={11} color="#96663B" />
                              <span>مقروء</span>
                            </button>
                          )}
                        </div>

                        <div style={{ fontSize: '0.9rem', color: '#4A3220', marginTop: '6px', fontWeight: '900' }}>
                          {prod.name}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#6B4A2E', marginTop: '5px' }}>
                          <span>المتبقي: <strong style={{ color: '#dc2626', fontWeight: '900' }}>{prod.stock} قطع</strong></span>
                          <span style={{ color: '#96663B', textDecoration: 'underline', fontWeight: '800' }}>طلب توريد ←</span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Near expiry alerts */}
                  {nearExpiryBatches.map(b => {
                    const isRead = readAlertIds?.includes(`expiry-${b.id}`);

                    return (
                      <div
                        key={b.id}
                        onClick={() => {
                          setActiveTab('sales');
                          setShowAlertsDropdown(false);
                        }}
                        style={{
                          padding: '12px 14px',
                          background: isRead ? '#FFFDF9' : '#FFF8EE',
                          border: isRead ? '1.5px solid #EDD9BD' : '2px solid #C49A5C',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          boxShadow: isRead ? 'none' : '0 4px 14px rgba(196, 154, 92, 0.2)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#4A3220', fontWeight: '900', fontSize: '0.86rem' }}>
                            <Clock size={16} color="#96663B" />
                            <span>دفعة تقترب من انتهاء الصلاحية</span>
                          </div>
                          {isRead ? (
                            <span style={{ fontSize: '0.7rem', color: '#3d6a3c', fontWeight: '800', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                              <Check size={13} /> مقروء ✓
                            </span>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAlertAsRead(`expiry-${b.id}`);
                              }}
                              style={{
                                background: '#FFFDF9',
                                border: '1px solid #EDD9BD',
                                borderRadius: '6px',
                                padding: '2px 7px',
                                fontSize: '0.7rem',
                                color: '#4A3220',
                                fontWeight: '800',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '2px'
                              }}
                              title="تحديد كمقروء"
                            >
                              <Check size={11} color="#96663B" />
                              <span>مقروء</span>
                            </button>
                          )}
                        </div>

                        <div style={{ fontSize: '0.9rem', color: '#4A3220', marginTop: '6px', fontWeight: '900' }}>
                          {b.productName} <span style={{ color: '#96663B', fontSize: '0.8rem', fontWeight: '700' }}>({b.batchCode})</span>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: '#6B4A2E', marginTop: '5px' }}>
                          <span>الكمية: <strong style={{ color: '#4A3220' }}>{b.quantity}</strong> | الصلاحية: <strong style={{ color: '#96663B' }}>{b.expiryDate}</strong></span>
                          <span style={{ color: '#96663B', textDecoration: 'underline', fontWeight: '800' }}>عمل عرض تخفيض ←</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Phone Notifications Settings Link */}
              <div style={{ marginTop: '14px', borderTop: '1px solid #EDD9BD', paddingTop: '12px' }}>
                <button
                  onClick={() => {
                    openNotificationSettings();
                    setShowAlertsDropdown(false);
                  }}
                  className="btn btn-outline"
                  style={{
                    width: '100%',
                    fontSize: '0.84rem',
                    padding: '9px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    background: '#FFF8EE',
                    borderColor: '#EDD9BD',
                    color: '#96663B',
                    fontWeight: '800',
                    borderRadius: '10px',
                    cursor: 'pointer'
                  }}
                >
                  <Smartphone size={15} color="#96663B" />
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
            className="navbar-user-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: isMobile ? '3px' : '6px',
              padding: isMobile ? '2px 5px' : '3px 8px',
              borderRadius: '6px',
              background: 'var(--mint-50)',
              border: '1px solid var(--mint-200)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
            title={currentUser?.fullName}
          >
            <div
              style={{
                width: isMobile ? '22px' : '24px',
                height: isMobile ? '22px' : '24px',
                borderRadius: '50%',
                background: 'var(--mint-200)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: isMobile ? '0.78rem' : '0.82rem',
                flexShrink: 0
              }}
            >
              {currentUser?.avatar && currentUser.avatar !== '☕' ? currentUser.avatar : <Coffee size={13} color="#d4a373" />}
            </div>
            {!isMobile && (
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.74rem', fontWeight: '800', color: 'var(--mint-950)' }}>
                  {currentUser?.fullName}
                </div>
                <div style={{ fontSize: '0.60rem', color: 'var(--mint-700)', fontWeight: '600' }}>
                  {currentUser?.isOwner ? 'المالك' : currentUser?.roleLabel}
                </div>
              </div>
            )}
            <ChevronDown size={11} color="var(--text-muted)" />
          </button>

          {/* Quick User Switcher Menu */}
          {showUserDropdown && (
            <div
              className="navbar-user-dropdown"
              style={{
                position: isMobile ? 'fixed' : 'absolute',
                top: isMobile ? '48px' : '44px',
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
                تبديل المستخدم (تسجيل الدخول بحساب آخر):
              </div>
              {users.map(u => (
                <div
                  key={u.id}
                  onClick={() => {
                    logoutAndSwitchUser(u.username);
                    setShowUserDropdown(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: u.id === currentUser?.id ? 'var(--mint-50)' : 'transparent',
                    color: u.id === currentUser?.id ? 'var(--mint-800)' : 'var(--text-main)',
                    fontSize: '0.85rem',
                    fontWeight: u.id === currentUser?.id ? '700' : '500',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (u.id !== currentUser?.id) e.currentTarget.style.backgroundColor = '#f8fafc';
                  }}
                  onMouseLeave={(e) => {
                    if (u.id !== currentUser?.id) e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  title={`تسجيل الدخول بحساب ${u.fullName}`}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{u.avatar || '👤'}</span>
                    <span>{u.fullName}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {u.isOwner && <span style={{ fontSize: '0.7rem', color: '#b45309' }}>👑</span>}
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', opacity: 0.75 }}>🔒</span>
                  </div>
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

      {/* Floating Instant Toast Banner for New Incoming Orders */}
      {newOrderToast && (
        <div
          style={{
            position: 'fixed',
            top: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            background: 'linear-gradient(135deg, #2e1408 0%, #190903 100%)',
            border: '2px solid #f59e0b',
            boxShadow: '0 12px 35px rgba(0, 0, 0, 0.7), 0 0 25px rgba(245, 158, 11, 0.4)',
            borderRadius: '14px',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            animation: 'slideDown 0.3s ease',
            color: '#ffffff',
            maxWidth: '92vw'
          }}
        >
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Package size={22} color="#1b0d07" />
          </div>
          <div>
            <div style={{ fontWeight: '900', fontSize: '0.94rem', color: '#fbbf24' }}>
              {newOrderToast.title}
            </div>
            <div style={{ fontSize: '0.82rem', color: '#ffffff', marginTop: '2px', fontWeight: '700' }}>
              العميل: {newOrderToast.customerName} • المبلغ: {newOrderToast.total} ج.م • فاتورة #{newOrderToast.invoiceNumber}
            </div>
          </div>
          <button
            onClick={() => {
              setActiveTab('invoices');
              setNewOrderToast(null);
            }}
            style={{
              background: '#f59e0b',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 12px',
              color: '#1b0d07',
              fontWeight: '900',
              fontSize: '0.82rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              marginRight: 'auto'
            }}
          >
            معاينة واعتماد الطلب ←
          </button>
          <button
            onClick={() => setNewOrderToast(null)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              opacity: 0.7,
              cursor: 'pointer',
              fontSize: '1.1rem',
              padding: '0 4px'
            }}
          >
            ✕
          </button>
        </div>
      )}
    </header>
  );
};
