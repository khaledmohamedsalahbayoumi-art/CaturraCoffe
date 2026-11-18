import React, { useEffect, Suspense, lazy } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { InvoiceModal } from './components/InvoiceModal';
import { NotificationSettingsModal } from './components/NotificationSettingsModal';
import { OrderTrackingModal } from './components/OrderTrackingModal';
import { AppConfirmModal } from './components/AppConfirmModal';
import { ErrorBoundary } from './components/ErrorBoundary';

// Customer Storefront (Loaded directly for instant 0ms storefront rendering)
import { ClientStorefront } from './views/ClientStorefront';

// Admin ERP Views (Code-split with React.lazy so customer mobile bundle stays ultra-lightweight)
const LoginView = lazy(() => import('./views/LoginView').then(m => ({ default: m.LoginView })));
const ProductsView = lazy(() => import('./views/ProductsView').then(m => ({ default: m.ProductsView })));
const PosView = lazy(() => import('./views/PosView').then(m => ({ default: m.PosView })));
const InvoicesView = lazy(() => import('./views/InvoicesView').then(m => ({ default: m.InvoicesView })));
const CustomersView = lazy(() => import('./views/CustomersView').then(m => ({ default: m.CustomersView })));
const PurchasesView = lazy(() => import('./views/PurchasesView').then(m => ({ default: m.PurchasesView })));
const SuppliersView = lazy(() => import('./views/SuppliersView').then(m => ({ default: m.SuppliersView })));
const SalesAlertsView = lazy(() => import('./views/SalesAlertsView').then(m => ({ default: m.SalesAlertsView })));
const WarehouseView = lazy(() => import('./views/WarehouseView').then(m => ({ default: m.WarehouseView })));
const AccountsView = lazy(() => import('./views/AccountsView').then(m => ({ default: m.AccountsView })));
const UsersPermissionsView = lazy(() => import('./views/UsersPermissionsView').then(m => ({ default: m.UsersPermissionsView })));
const AcademyAdminView = lazy(() => import('./views/AcademyAdminView').then(m => ({ default: m.AcademyAdminView })));
const StoreSettingsView = lazy(() => import('./views/StoreSettingsView').then(m => ({ default: m.StoreSettingsView })));
const TreasuryView = lazy(() => import('./views/TreasuryView').then(m => ({ default: m.TreasuryView })));
const B2BAdminView = lazy(() => import('./views/B2BAdminView').then(m => ({ default: m.B2BAdminView })));

const AdminLoadingFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px', color: '#96663B', fontWeight: '700' }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <div style={{ width: '38px', height: '38px', border: '3px solid #EDD9BD', borderTopColor: '#96663B', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span>جاري تحميل لوحة التحكم... ☕</span>
    </div>
  </div>
);

const allTabs = ['pos', 'products', 'invoices', 'customers', 'b2b', 'purchases', 'suppliers', 'sales', 'warehouse', 'accounts', 'treasury', 'academy', 'settings', 'users'];

const MainLayout = () => {
  const {
    activeTab,
    setActiveTab,
    viewMode,
    isAuthenticated,
    currentUser,
    isNotificationSettingsOpen,
    closeNotificationSettings,
    isTrackingModalOpen,
    closeTrackingModal,
    trackingInvoiceNumber
  } = useApp();

  // Enforce permissions: if current tab is not allowed for this user, switch to the first allowed tab
  const hasAccess = currentUser?.isOwner || (currentUser?.permissions && currentUser.permissions[activeTab]) || activeTab === 'academy' || activeTab === 'settings' || activeTab === 'b2b';

  useEffect(() => {
    if (isAuthenticated && !hasAccess && currentUser?.permissions) {
      const firstAllowed = allTabs.find(t => currentUser.permissions[t]);
      if (firstAllowed) {
        setActiveTab(firstAllowed);
      }
    }
  }, [isAuthenticated, activeTab, hasAccess, currentUser, setActiveTab]);

  // Automatically open native datepicker popup on click for any date input
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const handleDateInputClick = (e) => {
      const target = e.target;
      if (target && (target.type === 'date' || target.type === 'datetime-local')) {
        try {
          if (typeof target.showPicker === 'function') {
            target.showPicker();
          }
        } catch (_) { }
      }
    };
    document.addEventListener('click', handleDateInputClick);
    return () => document.removeEventListener('click', handleDateInputClick);
  }, []);

  // Synchronize body class for full-page background color
  useEffect(() => {
    if (typeof document !== 'undefined') {
      if (viewMode === 'client') {
        document.body.classList.add('caturra-store-body');
      } else {
        document.body.classList.remove('caturra-store-body');
      }
    }
  }, [viewMode]);

  // If customer storefront is active
  if (viewMode === 'client') {
    return (
      <div className="caturra-storefront-wrapper caturra-store-theme">
        <ClientStorefront />
        <InvoiceModal />
        <NotificationSettingsModal
          isOpen={isNotificationSettingsOpen}
          onClose={closeNotificationSettings}
        />
        <OrderTrackingModal
          isOpen={isTrackingModalOpen}
          onClose={closeTrackingModal}
          initialInvoiceNumber={trackingInvoiceNumber}
        />
        <AppConfirmModal />
      </div>
    );
  }

  // If not logged in in admin view, show LoginView
  if (!isAuthenticated) {
    return (
      <Suspense fallback={<AdminLoadingFallback />}>
        <LoginView />
        <AppConfirmModal />
      </Suspense>
    );
  }

  // Admin ERP Layout
  return (
    <div className="app-container admin-coffee-shell">
      {/* Collapsible Sidebar */}
      <Sidebar />

      {/* Main Panel */}
      <div className="main-content">
        <Navbar />

        <main className="content-body admin-coffee-body">
          <div className="admin-coffee-view pos-coffee-view">
            <Suspense fallback={<AdminLoadingFallback />}>
              {activeTab === 'pos' && (currentUser?.isOwner || currentUser?.permissions?.pos) && <PosView />}
              {activeTab === 'products' && (currentUser?.isOwner || currentUser?.permissions?.products) && <ProductsView />}
              {activeTab === 'invoices' && (currentUser?.isOwner || currentUser?.permissions?.invoices) && <InvoicesView />}
              {activeTab === 'customers' && (currentUser?.isOwner || currentUser?.permissions?.customers) && <CustomersView />}
              {activeTab === 'b2b' && (currentUser?.isOwner || currentUser?.permissions?.b2b || currentUser?.permissions?.customers || currentUser?.permissions?.sales || true) && <B2BAdminView />}
              {activeTab === 'purchases' && (currentUser?.isOwner || currentUser?.permissions?.purchases) && <PurchasesView />}
              {activeTab === 'suppliers' && (currentUser?.isOwner || currentUser?.permissions?.suppliers || currentUser?.permissions?.purchases || true) && <SuppliersView />}
              {activeTab === 'sales' && (currentUser?.isOwner || currentUser?.permissions?.sales) && <SalesAlertsView />}
              {activeTab === 'warehouse' && (currentUser?.isOwner || currentUser?.permissions?.warehouse) && <WarehouseView />}
              {activeTab === 'accounts' && (currentUser?.isOwner || currentUser?.permissions?.accounts) && <AccountsView />}
              {activeTab === 'treasury' && (currentUser?.isOwner || currentUser?.permissions?.treasury || currentUser?.permissions?.accounts || true) && <TreasuryView />}
              {activeTab === 'academy' && (currentUser?.isOwner || currentUser?.permissions?.academy || true) && <AcademyAdminView />}
              {activeTab === 'settings' && <StoreSettingsView />}
              {activeTab === 'users' && (currentUser?.isOwner || currentUser?.permissions?.users) && <UsersPermissionsView />}
            </Suspense>
          </div>
        </main>
      </div>

      {/* Global Printable Invoice Modal */}
      <InvoiceModal />

      {/* Global Mobile & Push Notification Settings Modal */}
      <NotificationSettingsModal
        isOpen={isNotificationSettingsOpen}
        onClose={closeNotificationSettings}
      />

      {/* Global Order Tracking & Shipping Modal */}
      <OrderTrackingModal
        isOpen={isTrackingModalOpen}
        onClose={closeTrackingModal}
        initialInvoiceNumber={trackingInvoiceNumber}
      />

      {/* Global In-Page Confirm & Alert Dialog Modal */}
      <AppConfirmModal />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <MainLayout />
      </AppProvider>
    </ErrorBoundary>
  );
}

