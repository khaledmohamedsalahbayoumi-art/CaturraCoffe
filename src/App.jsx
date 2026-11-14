import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { InvoiceModal } from './components/InvoiceModal';
import { NotificationSettingsModal } from './components/NotificationSettingsModal';
import { OrderTrackingModal } from './components/OrderTrackingModal';
import { AppConfirmModal } from './components/AppConfirmModal';
import { ErrorBoundary } from './components/ErrorBoundary';

// Views
import { LoginView } from './views/LoginView';
import { ProductsView } from './views/ProductsView';
import { PosView } from './views/PosView';
import { InvoicesView } from './views/InvoicesView';
import { CustomersView } from './views/CustomersView';
import { PurchasesView } from './views/PurchasesView';
import { SuppliersView } from './views/SuppliersView';
import { SalesAlertsView } from './views/SalesAlertsView';
import { WarehouseView } from './views/WarehouseView';
import { AccountsView } from './views/AccountsView';
import { UsersPermissionsView } from './views/UsersPermissionsView';
import { AcademyAdminView } from './views/AcademyAdminView';
import { StoreSettingsView } from './views/StoreSettingsView';
import { TreasuryView } from './views/TreasuryView';
import { B2BAdminView } from './views/B2BAdminView';
import { ClientStorefront } from './views/ClientStorefront';


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
  const allTabs = ['pos', 'products', 'invoices', 'customers', 'b2b', 'purchases', 'suppliers', 'sales', 'warehouse', 'accounts', 'treasury', 'academy', 'settings', 'users'];
  const hasAccess = currentUser?.isOwner || (currentUser?.permissions && currentUser.permissions[activeTab]) || activeTab === 'academy' || activeTab === 'settings' || activeTab === 'b2b';

  useEffect(() => {
    if (isAuthenticated && !hasAccess && currentUser?.permissions) {
      const firstAllowed = allTabs.find(t => currentUser.permissions[t]);
      if (firstAllowed) {
        setActiveTab(firstAllowed);
      }
    }
  }, [isAuthenticated, activeTab, hasAccess, currentUser]);

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
      <>
        <LoginView />
        <AppConfirmModal />
      </>
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

