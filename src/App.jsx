import React, { useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Navbar } from './components/Navbar';
import { InvoiceModal } from './components/InvoiceModal';
import { NotificationSettingsModal } from './components/NotificationSettingsModal';

// Views
import { LoginView } from './views/LoginView';
import { ProductsView } from './views/ProductsView';
import { PosView } from './views/PosView';
import { InvoicesView } from './views/InvoicesView';
import { CustomersView } from './views/CustomersView';
import { PurchasesView } from './views/PurchasesView';
import { SalesAlertsView } from './views/SalesAlertsView';
import { WarehouseView } from './views/WarehouseView';
import { AccountsView } from './views/AccountsView';
import { UsersPermissionsView } from './views/UsersPermissionsView';
import { ClientStorefront } from './views/ClientStorefront';

const MainLayout = () => {
  const {
    activeTab,
    setActiveTab,
    viewMode,
    isAuthenticated,
    currentUser,
    isNotificationSettingsOpen,
    closeNotificationSettings
  } = useApp();

  // Enforce permissions: if current tab is not allowed for this user, switch to the first allowed tab
  const allTabs = ['pos', 'products', 'invoices', 'customers', 'purchases', 'sales', 'warehouse', 'accounts', 'users'];
  const hasAccess = currentUser?.isOwner || (currentUser?.permissions && currentUser.permissions[activeTab]);

  useEffect(() => {
    if (isAuthenticated && !hasAccess && currentUser?.permissions) {
      const firstAllowed = allTabs.find(t => currentUser.permissions[t]);
      if (firstAllowed) {
        setActiveTab(firstAllowed);
      }
    }
  }, [isAuthenticated, activeTab, hasAccess, currentUser]);

  // If customer storefront is active
  if (viewMode === 'client') {
    return (
      <>
        <ClientStorefront />
        <InvoiceModal />
        <NotificationSettingsModal
          isOpen={isNotificationSettingsOpen}
          onClose={closeNotificationSettings}
        />
      </>
    );
  }

  // If not logged in in admin view, show LoginView
  if (!isAuthenticated) {
    return <LoginView />;
  }

  // Admin ERP Layout
  return (
    <div className="app-container">
      {/* Collapsible Sidebar */}
      <Sidebar />

      {/* Main Panel */}
      <div className="main-content">
        <Navbar />

        <main className="content-body">
          {activeTab === 'products' && (currentUser?.isOwner || currentUser?.permissions?.products) && <ProductsView />}
          {activeTab === 'pos' && (currentUser?.isOwner || currentUser?.permissions?.pos) && <PosView />}
          {activeTab === 'invoices' && (currentUser?.isOwner || currentUser?.permissions?.invoices) && <InvoicesView />}
          {activeTab === 'customers' && (currentUser?.isOwner || currentUser?.permissions?.customers) && <CustomersView />}
          {activeTab === 'purchases' && (currentUser?.isOwner || currentUser?.permissions?.purchases) && <PurchasesView />}
          {activeTab === 'sales' && (currentUser?.isOwner || currentUser?.permissions?.sales) && <SalesAlertsView />}
          {activeTab === 'warehouse' && (currentUser?.isOwner || currentUser?.permissions?.warehouse) && <WarehouseView />}
          {activeTab === 'accounts' && (currentUser?.isOwner || currentUser?.permissions?.accounts) && <AccountsView />}
          {activeTab === 'users' && (currentUser?.isOwner || currentUser?.permissions?.users) && <UsersPermissionsView />}
        </main>
      </div>

      {/* Global Printable Invoice Modal */}
      <InvoiceModal />

      {/* Global Mobile & Push Notification Settings Modal */}
      <NotificationSettingsModal
        isOpen={isNotificationSettingsOpen}
        onClose={closeNotificationSettings}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}

