import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  initialCategories,
  initialProducts,
  initialCustomers,
  initialInvoices,
  initialPurchases,
  initialBatches,
  initialExpenses,
  initialAcademyArticles,
  initialContactInfo,
  initialTreasuryAccounts,
  initialTreasuryTransactions,
  initialSuppliers,
  initialUsers,
  initialB2BRequests,
  initialB2BStandingOrders,
  initialBrewingGuides
} from '../data/initialData';
import { hashPasswordSync, verifyPasswordSync } from '../utils/crypto';
import { dispatchStoreAlert, playNotificationSound, vibratePhone } from '../utils/notifications';
import {
  savePdfToStorage,
  getPdfFromStorage,
  deletePdfFromStorage
} from '../utils/pdfStorage';
import { normalizeArabic, normalizePhone, toLatinDigits } from '../utils/numberEnforcer';
import {
  getTranslation,
  getLocalizedName,
  getLocalizedNotes,
  getLocalizedOrigin,
  getLocalizedRoast,
  getLocalizedCategory,
  getLocalizedProcess,
  getLocalizedBrewMethod,
  formatPrice
} from '../utils/translations';

// URL Routing helper to distinguish between Customer Storefront (/) and Admin ERP Dashboard (/caturra or /admin)
const getRouteFromUrl = () => {
  if (typeof window === 'undefined') return 'client';

  try {
    const rawPath = window.location.pathname.toLowerCase();
    const path = rawPath.replace(/\/+$/, '') || '/';
    const hash = (window.location.hash || '').toLowerCase();
    const search = new URLSearchParams(window.location.search);

    // Automatically rewrite legacy /admin to canonical /caturra
    if (path.endsWith('/admin') || path === '/admin' || hash === '#admin' || hash === '#/admin') {
      try {
        const basePath = window.location.pathname.replace(/\/admin\/?$/i, '');
        window.history.replaceState({ mode: 'admin' }, '', `${basePath}/caturra`);
      } catch { }
      return 'admin';
    }

    // Canonical admin route is strictly /caturra
    const isAdminPath =
      path.endsWith('/caturra') ||
      path === '/caturra' ||
      path.endsWith('/dashboard') ||
      path === '/dashboard';

    const isAdminHash =
      hash === '#caturra' ||
      hash === '#/caturra' ||
      hash === '#dashboard' ||
      hash === '#/dashboard' ||
      hash === '#login' ||
      hash === '#/login';

    const isAdminSearch =
      search.get('mode') === 'admin' ||
      search.get('mode') === 'caturra' ||
      search.has('caturra') ||
      search.has('login');

    if (isAdminPath || isAdminHash || isAdminSearch) {
      return 'admin';
    }

    // Direct check for explicit store route (/store, /client, #store)
    const isClientPath =
      path.endsWith('/store') ||
      path === '/store' ||
      path.endsWith('/client') ||
      path === '/client';

    const isClientHash =
      hash === '#store' ||
      hash === '#/store' ||
      hash === '#client' ||
      hash === '#/client';

    const isClientSearch =
      search.get('mode') === 'client' ||
      search.has('store');

    if (isClientPath || isClientHash || isClientSearch) {
      return 'client';
    }

  } catch {
    // ignore
  }

  return 'client';
};

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // One-time clean slate migration: purge all mock demo data from browser localStorage and server DB so production data can be added cleanly
  if (typeof window !== 'undefined') {
    try {
      if (!localStorage.getItem('caturra_eg_clean_slate_production_v2')) {
        const keysToWipe = [
          'products',
          'customers',
          'invoices',
          'purchases',
          'suppliers',
          'batches',
          'expenses',
          'b2b_requests',
          'b2b_standing_orders',
          'treasury_transactions',
          'treasury_accounts',
          'read_alerts'
        ];
        keysToWipe.forEach(k => localStorage.removeItem(`caturra_eg_${k}`));
        localStorage.setItem('caturra_eg_clean_slate_production_v2', 'true');

        // Immediately notify server DB to wipe demo invoices across all clients
        if (typeof fetch !== 'undefined') {
          fetch('/api/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-caturra-erp-auth': 'caturra_sec_token_v2'
            },
            body: JSON.stringify({ wipeInvoices: true, invoices: [] })
          }).catch(() => { });
        }
      }

      // Targeted Financial Reset Migration: Wipe transactions, invoices, purchases, expenses and zero treasury opening balances
      if (!localStorage.getItem('caturra_eg_wipe_financials_20261104')) {
        const financialKeys = [
          'invoices',
          'purchases',
          'expenses',
          'treasury_transactions'
        ];
        financialKeys.forEach(k => {
          localStorage.removeItem(`caturra_eg_${k}`);
          localStorage.setItem(`caturra_eg_${k}`, JSON.stringify([]));
        });

        // Zero out treasury accounts openingBalance
        try {
          const rawAccs = localStorage.getItem('caturra_eg_treasury_accounts');
          if (rawAccs) {
            const parsedAccs = JSON.parse(rawAccs);
            if (Array.isArray(parsedAccs)) {
              const zeroed = parsedAccs.map(a => ({ ...a, openingBalance: 0 }));
              localStorage.setItem('caturra_eg_treasury_accounts', JSON.stringify(zeroed));
            }
          }
        } catch { }

        // Reset customer debt & spent
        try {
          const rawCusts = localStorage.getItem('caturra_eg_customers');
          if (rawCusts) {
            const parsedCusts = JSON.parse(rawCusts);
            if (Array.isArray(parsedCusts)) {
              const zeroedCusts = parsedCusts.map(c => ({
                ...c,
                debt: 0,
                totalOrders: 0,
                totalSpent: 0,
                openingDebt: 0
              }));
              localStorage.setItem('caturra_eg_customers', JSON.stringify(zeroedCusts));
            }
          }
        } catch { }

        // Reset supplier debt & purchases
        try {
          const rawSups = localStorage.getItem('caturra_eg_suppliers');
          if (rawSups) {
            const parsedSups = JSON.parse(rawSups);
            if (Array.isArray(parsedSups)) {
              const zeroedSups = parsedSups.map(s => ({
                ...s,
                debt: 0,
                totalPurchases: 0,
                openingDebt: 0
              }));
              localStorage.setItem('caturra_eg_suppliers', JSON.stringify(zeroedSups));
            }
          }
        } catch { }

        localStorage.setItem('caturra_eg_wipe_financials_20261104', 'true');

        if (typeof fetch !== 'undefined') {
          fetch('/api/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-caturra-erp-auth': 'caturra_sec_token_v2'
            },
            body: JSON.stringify({
              wipeInvoices: true,
              invoices: [],
              expenses: [],
              purchases: [],
              treasuryTransactions: []
            })
          }).catch(() => { });
        }
      }
    } catch {
      // ignore
    }
  }

  // Load from localStorage or fallback
  const loadState = (key, fallback) => {
    try {
      const saved = localStorage.getItem(`caturra_eg_${key}`);
      return saved ? JSON.parse(saved) : fallback;
    } catch {
      return fallback;
    }
  };

  // Bilingual Language Support (Arabic & English)
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem('caturra_language');
      return saved === 'en' ? 'en' : 'ar';
    } catch {
      return 'ar';
    }
  });

  const setLanguage = useCallback((lang) => {
    const nextLang = lang === 'en' ? 'en' : 'ar';
    setLanguageState(nextLang);
    try {
      localStorage.setItem('caturra_language', nextLang);
    } catch { }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = nextLang;
      document.documentElement.dir = nextLang === 'ar' ? 'rtl' : 'ltr';
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  }, [language, setLanguage]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
      document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    }
  }, [language]);

  const t = useCallback((key) => getTranslation(key, language), [language]);

  const hasFetchedServerSyncRef = useRef(false);
  const skipNextProductSyncRef = useRef(false);

  const [categories, setCategories] = useState(() => {
    const migrationKey = 'caturra_categories_v15_clean_coffee_strict';
    const hasMigrated = typeof window !== 'undefined' && localStorage.getItem(migrationKey);
    if (!hasMigrated) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(migrationKey, 'true');
        saveState('categories', initialCategories);
        try {
          localStorage.setItem('caturra_eg_categories', JSON.stringify(initialCategories));
        } catch { }
      }
      return initialCategories;
    }

    const loaded = loadState('categories', initialCategories);
    // Strict deduplication by ID, keeping unique categories
    const seenIds = new Set();
    const result = [];

    // Prioritize standard initialCategories first for clean ordering
    for (const initCat of initialCategories) {
      seenIds.add(initCat.id);
      result.push(initCat);
    }

    // Append any extra user-created custom categories (excluding deprecated/duplicate subcategories)
    const excludedIds = new Set(['syrups', 'espresso', 'filter', 'coffee', 'classic_blends', 'specialty', 'beans', 'fermented']);
    for (const c of (loaded || [])) {
      if (!c || !c.id) continue;
      if (excludedIds.has(c.id)) continue;
      if (!seenIds.has(c.id)) {
        seenIds.add(c.id);
        result.push(c);
      }
    }

    const isTool = id => id === 'tools' || id === 'accessories' || id === 'boxes' || id === 'gifts';
    const finalSorted = result.sort((a, b) => {
      if (a.id === 'all') return -1;
      if (b.id === 'all') return 1;
      if (!isTool(a.id) && isTool(b.id)) return -1;
      if (isTool(a.id) && !isTool(b.id)) return 1;
      return 0;
    });

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('caturra_eg_categories', JSON.stringify(finalSorted));
      } catch { }
    }
    return finalSorted;
  });

  const [products, setProducts] = useState(() => {
    const loaded = loadState('products', initialProducts);
    const loadedMap = new Map((loaded || []).map(p => [p.id, p]));

    const result = [];
    const processedIds = new Set();

    // 1. First ensure all initial products exist with full specs and accurate coffee bag images
    for (const initP of initialProducts) {
      processedIds.add(initP.id);
      const userP = loadedMap.get(initP.id);
      const isCoffee = initP.unitType === 'weight' || initP.category === 'specialty' || initP.category === 'classic_blends' || initP.category === 'espresso' || initP.category === 'filter' || initP.category === 'coffee';

      let finalImage = initP.image;
      let finalBagVariant = initP.bagVariant;

      const isClassicBlend = initP.category === 'classic_blends' || initP.category === 'coffee' || (userP && (userP.category === 'classic_blends' || userP.category === 'coffee'));

      if (isClassicBlend) {
        finalImage = '/bags/bag_classic_blends.jpg';
        finalBagVariant = 'vertical';
      } else if (isCoffee) {
        finalImage = '/bags/bag_espresso_landscape.jpg';
        finalBagVariant = 'landscape';
      }

      if (userP) {
        let userCat = userP.category;
        let userSubCat = userP.subCategory;
        if (userCat === 'espresso') {
          userCat = 'specialty';
          if (!userSubCat) userSubCat = 'espresso';
        } else if (userCat === 'filter') {
          userCat = 'specialty';
          if (!userSubCat) userSubCat = 'filter';
        } else if (userCat === 'coffee') {
          userCat = 'classic_blends';
          if (!userSubCat) userSubCat = 'classic';
        }

        if (userCat === 'classic_blends' || userCat === 'coffee') {
          finalImage = '/bags/bag_classic_blends.jpg';
          finalBagVariant = 'vertical';
        }

        result.push({
          ...initP,
          ...userP,
          category: userCat || initP.category,
          subCategory: userSubCat || initP.subCategory,
          image: finalImage,
          bagVariant: finalBagVariant,
          coffeeOrigin: userP.coffeeOrigin || initP.coffeeOrigin,
          sensoryProfile: userP.sensoryProfile || initP.sensoryProfile,
          espressoRecipe: userP.espressoRecipe || initP.espressoRecipe,
          roastingProfile: userP.roastingProfile || initP.roastingProfile,
          recommendedFor: userP.recommendedFor || initP.recommendedFor
        });
      } else {
        result.push({
          ...initP,
          image: finalImage,
          bagVariant: finalBagVariant
        });
      }
    }

    // 2. Append any custom products added by the user
    for (const p of (loaded || [])) {
      if (!processedIds.has(p.id)) {
        let pCat = p.category;
        let pSubCat = p.subCategory;
        if (pCat === 'espresso') {
          pCat = 'specialty';
          if (!pSubCat) pSubCat = 'espresso';
        } else if (pCat === 'filter') {
          pCat = 'specialty';
          if (!pSubCat) pSubCat = 'filter';
        } else if (pCat === 'coffee') {
          pCat = 'classic_blends';
          if (!pSubCat) pSubCat = 'classic';
        }

        const isCoffee = p.unitType === 'weight' || pCat === 'specialty' || pCat === 'classic_blends' || pCat === 'filter' || pCat === 'espresso' || pCat === 'coffee';
        const isCustomClassic = pCat === 'classic_blends' || pCat === 'coffee';
        let finalImage = p.image;
        let finalBagVariant = p.bagVariant;
        if (isCustomClassic) {
          finalImage = '/bags/bag_classic_blends.jpg';
          finalBagVariant = 'vertical';
        } else if (isCoffee) {
          finalImage = '/bags/bag_espresso_landscape.jpg';
          finalBagVariant = 'landscape';
        }
        result.push({
          ...p,
          category: pCat,
          subCategory: pSubCat,
          image: finalImage,
          bagVariant: finalBagVariant
        });
      }
    }

    return result;
  });
  const [invoices, setInvoices] = useState(() => {
    const rawInvoices = loadState('invoices', initialInvoices);
    const rawCustomers = loadState('customers', initialCustomers);

    // Auto-link customerId to existing online test orders and clean any fake mock SVG receipts
    return (rawInvoices || []).map(inv => {
      const updated = { ...inv };
      if (!updated.customerId && rawCustomers) {
        const match = rawCustomers.find(c =>
          (c.phone && updated.customerPhone === c.phone && c.phone !== '') ||
          (c.name && updated.customerName && updated.customerName.trim().toLowerCase() === c.name.trim().toLowerCase() && c.name !== 'عميل صالة نقدي')
        );
        if (match) {
          updated.customerId = match.id;
        }
      }
      // Purge any fake/mock SVG receipt so only REAL customer-uploaded screenshots appear
      if (updated.transferReceipt && (
        updated.transferReceipt.includes('IP-2026-98124') ||
        updated.transferReceipt.includes('data:image/svg+xml') ||
        updated.transferReceipt.includes('إشعار تحويل إنستاباي')
      )) {
        updated.transferReceipt = null;
      }
      return updated;
    });
  });

  const [customers, setCustomers] = useState(() => {
    const rawCustomers = loadState('customers', initialCustomers);
    const rawInvoices = loadState('invoices', initialInvoices);

    // Self-healing: accurately compute customer debt, total spent, and total orders from active non-cancelled invoices
    return (rawCustomers || []).filter(Boolean).map(cust => {
      const custInvoices = (rawInvoices || []).filter(inv =>
        inv.status !== 'cancelled' &&
        inv.status !== 'returned' &&
        inv.trackingStatus !== 'cancelled' &&
        ((inv.customerId && (inv.customerId === cust?.id || String(inv.customerId) === String(cust?.id))) ||
          (cust?.phone && normalizePhone(inv.customerPhone) === normalizePhone(cust.phone) && cust.phone !== '') ||
          (cust?.name && normalizeArabic(inv.customerName) === normalizeArabic(cust.name) && normalizeArabic(cust.name) !== normalizeArabic('عميل صالة نقدي')))
      );

      const invDebt = custInvoices.reduce((sum, inv) => sum + (Number(inv.remainingDebt) || 0), 0);
      const invSpent = custInvoices.reduce((sum, inv) => sum + (Number(inv.finalTotal || inv.total) || 0), 0);
      const invOrders = custInvoices.length;

      const baseDebt = Number(cust?.openingDebt || 0);
      const baseSpent = Number(cust?.openingSpent || 0);
      const baseOrders = Number(cust?.openingOrders || 0);

      const effectiveDebt = Math.max(0, baseDebt + invDebt);
      const effectiveSpent = Math.max(0, baseSpent + invSpent);
      const effectiveOrders = Math.max(0, baseOrders + invOrders);

      return {
        ...cust,
        debt: effectiveDebt,
        totalSpent: effectiveSpent,
        totalOrders: effectiveOrders
      };
    });
  });
  const [purchases, setPurchases] = useState(() => {
    const loaded = loadState('purchases', initialPurchases);
    return loaded.map(pur => ({
      ...pur,
      items: pur.items?.map(it => {
        const initP = initialProducts.find(ip => ip.id === it.productId);
        if (initP && (it.image === '/ethiopia_coffee.jpg' || !it.image)) {
          return { ...it, image: initP.image };
        }
        return it;
      })
    }));
  });
  const [batches, setBatches] = useState(() => loadState('batches', initialBatches));
  const [expenses, setExpenses] = useState(() => {
    const loaded = loadState('expenses', initialExpenses);
    const defaultAcc = initialTreasuryAccounts[0] || { id: 'acc-cash-main', name: 'الخزينة الرئيسية (درج الكاش)' };
    return (loaded || []).map(exp => {
      const isWaste = exp.category === 'هالك وتالف مخزون' ||
        exp.category === 'عجز جرد مخزني' ||
        exp.category === 'هالك ومخزون' ||
        exp.referenceType === 'stock_waste' ||
        exp.referenceType === 'inventory_audit_deficit' ||
        exp.accountId === 'none';

      if (!exp.accountId && !isWaste) {
        const fallbackAccId = exp.category === 'تسويق' ? 'acc-instapay-main' : defaultAcc.id;
        const targetAcc = initialTreasuryAccounts.find(a => a.id === fallbackAccId) || defaultAcc;
        return {
          ...exp,
          accountId: targetAcc.id,
          accountName: targetAcc.name
        };
      }
      return exp;
    });
  });
  const [users, setUsers] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        if (!localStorage.getItem('caturra_eg_wipe_all_users_v4')) {
          localStorage.removeItem('caturra_eg_users');
          localStorage.setItem('caturra_eg_wipe_all_users_v4', 'true');
          return [];
        }
      } catch {
        // ignore
      }
    }
    const loaded = loadState('users', []);
    if (!Array.isArray(loaded)) return [];
    return loaded.map(u => {
      const sanitized = { ...u };
      if (sanitized.password) {
        if (!sanitized.passwordHash) {
          sanitized.passwordHash = hashPasswordSync(sanitized.password);
        }
        delete sanitized.password;
      }
      return sanitized;
    });
  });
  const [academyArticles, setAcademyArticles] = useState(() => {
    const loaded = loadState('academy', initialAcademyArticles);
    return loaded.map(art => {
      const initArt = initialAcademyArticles.find(ia => ia.id === art.id);
      if (initArt) {
        return {
          ...initArt,
          ...art,
          pdfFile: art.pdfFile || initArt.pdfFile,
          titleEn: art.titleEn || initArt.titleEn,
          summaryEn: art.summaryEn || initArt.summaryEn,
          contentEn: art.contentEn || initArt.contentEn,
          levelEn: art.levelEn || initArt.levelEn,
          readTimeEn: art.readTimeEn || initArt.readTimeEn,
          authorEn: art.authorEn || initArt.authorEn
        };
      }
      return art;
    });
  });

  const [contactInfo, setContactInfo] = useState(() => {
    const migrationBannerKey = 'caturra_banner_default_disabled_v1';
    const hasBannerMigrated = typeof window !== 'undefined' && localStorage.getItem(migrationBannerKey);
    const loaded = loadState('contact_info', initialContactInfo);

    let isBannerActive = loaded?.bannerEnabled;
    if (!hasBannerMigrated) {
      isBannerActive = false;
      if (typeof window !== 'undefined') {
        localStorage.setItem(migrationBannerKey, 'true');
        saveState('contact_info', { ...(loaded || {}), bannerEnabled: false });
      }
    }

    return {
      ...initialContactInfo,
      ...loaded,
      bannerEnabled: isBannerActive !== undefined ? isBannerActive : false,
      phone: (!loaded?.phone || loaded.phone === '01012345678') ? '01033144498' : loaded.phone,
      whatsapp: (!loaded?.whatsapp || loaded.whatsapp === '01000000000' || loaded.whatsapp === '201000000000') ? '01033144498' : loaded.whatsapp,
      instapayPhone: loaded?.instapayPhone || initialContactInfo?.instapayPhone || '01033144498',
      vodafoneCash: loaded?.vodafoneCash || initialContactInfo?.vodafoneCash || '01033144498',
      brandNameEn: (!loaded?.brandNameEn || loaded.brandNameEn.includes('SPECIALTY')) ? 'CATURRA COFFEE & ROASTER' : loaded.brandNameEn
    };
  });
  const [treasuryAccounts, setTreasuryAccounts] = useState(() => loadState('treasury_accounts', initialTreasuryAccounts));
  const [treasuryTransactions, setTreasuryTransactions] = useState(() => loadState('treasury_transactions', initialTreasuryTransactions));
  const [suppliers, setSuppliers] = useState(() => loadState('suppliers', initialSuppliers));
  const [b2bRequests, setB2bRequests] = useState(() => loadState('b2b_requests', initialB2BRequests));
  const [b2bStandingOrders, setB2bStandingOrders] = useState(() => loadState('b2b_standing_orders', initialB2BStandingOrders));
  const [brewingGuides, setBrewingGuides] = useState(() => loadState('brewing_guides', initialBrewingGuides));

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(() => loadState('current_user_id', null));
  const [loginPreselectedUsername, setLoginPreselectedUsername] = useState('');

  // Purge any legacy persistent auth flag so user is always prompted for login
  useEffect(() => {
    try {
      localStorage.removeItem('caturra_eg_auth');
    } catch {
      // ignore
    }
  }, []);

  // App UI State: Default is determined by current URL path/hash
  const [activeTab, setActiveTab] = useState('pos');
  const [posPreselectedCustomer, setPosPreselectedCustomer] = useState(null);
  const [viewMode, setViewModeState] = useState(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('caturra_view_mode');
      } catch {
        // ignore
      }
    }
    return getRouteFromUrl();
  });

  // Navigate helper that synchronizes React state with the browser address bar
  const navigateTo = useCallback((mode, pushHistory = true) => {
    setViewModeState(mode);

    if (typeof window === 'undefined') return;

    try {
      if (mode === 'admin') {
        sessionStorage.setItem('caturra_view_mode', 'admin');
      } else {
        sessionStorage.removeItem('caturra_view_mode');
      }
      localStorage.removeItem('caturra_view_mode');
    } catch {
      // ignore
    }

    if (pushHistory) {
      try {
        const currentPath = window.location.pathname;
        let basePath = '';
        if (
          currentPath.endsWith('/caturra') ||
          currentPath.endsWith('/admin') ||
          currentPath.endsWith('/dashboard') ||
          currentPath.endsWith('/store') ||
          currentPath.endsWith('/client')
        ) {
          basePath = currentPath.replace(/\/(caturra|admin|dashboard|store|client)\/?$/, '');
        } else {
          basePath = currentPath === '/' ? '' : currentPath.replace(/\/+$/, '');
        }

        const targetPath = mode === 'admin' ? `${basePath}/caturra` : (basePath ? `${basePath}/` : '/');

        if (window.location.pathname !== targetPath) {
          window.history.pushState({ mode }, '', targetPath);
        }
      } catch (err) {
        console.warn('Navigation history error:', err);
      }
    }
  }, []);

  // setViewMode wrapper supporting both string values and updater functions
  const setViewMode = useCallback((modeOrFn, pushHistory = true) => {
    if (typeof modeOrFn === 'function') {
      setViewModeState(prev => {
        const next = modeOrFn(prev);
        navigateTo(next, pushHistory);
        return next;
      });
    } else {
      navigateTo(modeOrFn, pushHistory);
    }
  }, [navigateTo]);

  // Sync with browser back/forward buttons, hash changes, and rewrite legacy /admin to /caturra
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Gracefully rewrite legacy /admin path to /caturra in the address bar
    try {
      const curPath = window.location.pathname.toLowerCase();
      if (curPath.endsWith('/admin') || curPath === '/admin') {
        const basePath = window.location.pathname.replace(/\/admin\/?$/i, '');
        window.history.replaceState({ mode: 'admin' }, '', `${basePath}/caturra`);
      }
    } catch {
      // ignore
    }

    const handleLocationChange = () => {
      const targetMode = getRouteFromUrl();
      setViewModeState(targetMode);
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeInvoiceForModal, setActiveInvoiceForModal] = useState(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isNotificationSettingsOpen, setIsNotificationSettingsOpen] = useState(false);
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      return !!p.get('track');
    }
    return false;
  });
  const [trackingInvoiceNumber, setTrackingInvoiceNumber] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      return p.get('track') || p.get('invoice') || '';
    }
    return '';
  });

  const openTrackingModal = (invNumber = '') => {
    setTrackingInvoiceNumber(invNumber);
    setIsTrackingModalOpen(true);
  };

  const closeTrackingModal = () => {
    setIsTrackingModalOpen(false);
    setTrackingInvoiceNumber('');
  };

  // 🌟 Global In-Page Dialog & Confirm Modal System (نافذة مخصصة بديلة للبرمبت والمتصفح) 🌟
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    title: 'تأكيد الإجراء',
    message: '',
    details: '',
    type: 'danger', // 'danger' | 'warning' | 'success' | 'info'
    confirmText: 'تأكيد',
    cancelText: 'إلغاء',
    isAlertOnly: false,
    resolve: null
  });

  const confirmDialog = useCallback(({
    title = 'تأكيد الإجراء',
    message = 'هل أنت متأكد من المتابعة؟',
    details = '',
    type = 'danger',
    confirmText = 'تأكيد',
    cancelText = 'إلغاء'
  }) => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        title,
        message,
        details,
        type,
        confirmText,
        cancelText,
        isAlertOnly: false,
        resolve
      });
    });
  }, []);

  const alertDialog = useCallback(({
    title = 'تنبيه',
    message = '',
    details = '',
    type = 'info',
    confirmText = 'حسناً'
  }) => {
    return new Promise((resolve) => {
      setDialogState({
        isOpen: true,
        title,
        message,
        details,
        type,
        confirmText,
        cancelText: '',
        isAlertOnly: true,
        resolve
      });
    });
  }, []);

  const closeDialog = useCallback((result = false) => {
    setDialogState(prev => {
      if (prev.resolve) {
        prev.resolve(result);
      }
      return { ...prev, isOpen: false, resolve: null };
    });
  }, []);

  // Intercept native window.alert and window.confirm to automatically use our sleek luxury in-page dialog modal
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const originalAlert = window.alert;
      const originalConfirm = window.confirm;

      window.alert = (msg) => {
        alertDialog({
          title: 'تنبيه النظام',
          message: String(msg || ''),
          type: 'info',
          confirmText: 'حسناً'
        });
      };

      window.confirm = (msg) => {
        confirmDialog({
          title: 'تأكيد الإجراء',
          message: String(msg || ''),
          type: 'warning',
          confirmText: 'تأكيد',
          cancelText: 'إلغاء'
        });
        return false;
      };

      return () => {
        window.alert = originalAlert;
        window.confirm = originalConfirm;
      };
    }
  }, [alertDialog, confirmDialog]);

  // Handle scanned QR code invoice preview (?invoice=...) or direct WhatsApp invoice link
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      const invoiceParam = p.get('invoice');
      if (invoiceParam) {
        const found = invoices.find(i => i.invoiceNumber === invoiceParam || i.id === invoiceParam);
        if (found) {
          setActiveInvoiceForModal(found);
          setIsInvoiceModalOpen(true);
        } else {
          // If not yet in local state, fetch from server DB so any external device/phone can preview it immediately!
          fetch(`/api/invoice?id=${encodeURIComponent(invoiceParam)}`)
            .then(res => res.ok ? res.json() : null)
            .then(data => {
              if (data && data.invoice) {
                setActiveInvoiceForModal(data.invoice);
                setIsInvoiceModalOpen(true);
              }
            })
            .catch(() => { });
        }
      }
    }
  }, [invoices]);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('caturra_eg_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('caturra_eg_products', JSON.stringify(products));
    if (!hasFetchedServerSyncRef.current) return;
    if (skipNextProductSyncRef.current) {
      skipNextProductSyncRef.current = false;
      return;
    }
    if (typeof fetch !== 'undefined') {
      const timer = setTimeout(() => {
        fetch('/api/sync', {
          method: 'POST',
          keepalive: true,
          headers: {
            'Content-Type': 'application/json',
            'x-caturra-erp-auth': 'caturra_sec_token_v2'
          },
          body: JSON.stringify({ products })
        }).catch(() => { });
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [products]);

  useEffect(() => {
    localStorage.setItem('caturra_eg_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('caturra_eg_invoices', JSON.stringify(invoices));
  }, [invoices]);

  // Automatic reconciliation: keep customer debt and statistics in sync with invoices in real-time
  useEffect(() => {
    setCustomers(prevCustomers => {
      let hasChanges = false;
      const updated = (prevCustomers || []).filter(Boolean).map(cust => {
        const custInvoices = (invoices || []).filter(inv =>
          inv.status !== 'cancelled' &&
          inv.status !== 'returned' &&
          inv.trackingStatus !== 'cancelled' &&
          ((inv.customerId && (inv.customerId === cust?.id || String(inv.customerId) === String(cust?.id))) ||
            (cust?.phone && normalizePhone(inv.customerPhone) === normalizePhone(cust.phone) && cust.phone !== '') ||
            (cust?.name && normalizeArabic(inv.customerName) === normalizeArabic(cust.name) && normalizeArabic(cust.name) !== normalizeArabic('عميل صالة نقدي')))
        );

        const invDebt = custInvoices.reduce((sum, inv) => sum + (Number(inv.remainingDebt) || 0), 0);
        const invSpent = custInvoices.reduce((sum, inv) => sum + (Number(inv.finalTotal || inv.total) || 0), 0);
        const invOrders = custInvoices.length;

        const baseDebt = Number(cust?.openingDebt || 0);
        const baseSpent = Number(cust?.openingSpent || 0);
        const baseOrders = Number(cust?.openingOrders || 0);

        const targetDebt = Math.max(0, baseDebt + invDebt);
        const targetSpent = Math.max(0, baseSpent + invSpent);
        const targetOrders = Math.max(0, baseOrders + invOrders);

        if (targetDebt !== cust?.debt || targetSpent !== cust?.totalSpent || targetOrders !== cust?.totalOrders) {
          hasChanges = true;
          return {
            ...cust,
            debt: targetDebt,
            totalSpent: targetSpent,
            totalOrders: targetOrders
          };
        }
        return cust;
      });

      if (hasChanges) {
        try {
          localStorage.setItem('caturra_eg_customers', JSON.stringify(updated));
        } catch (e) { }
      }

      return hasChanges ? updated : prevCustomers;
    });
  }, [invoices]);

  const isFirstInvoiceSyncRef = useRef(true);

  // Real-time Cross-Tab & Cross-Device Sync for Invoices and Incoming Orders
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncInvoices = async () => {
      // 1. Fetch from server DB for true multi-device / network sync
      try {
        const res = await fetch('/api/sync');
        if (res.ok) {
          const serverData = await res.json();
          if (serverData && Array.isArray(serverData.invoices)) {
            if (serverData.invoices.length === 0) {
              setInvoices(currentInvoices => {
                if (currentInvoices && currentInvoices.length > 0) {
                  try {
                    localStorage.setItem('caturra_eg_invoices', JSON.stringify([]));
                  } catch { }
                  return [];
                }
                return currentInvoices;
              });
            } else {
              setInvoices(currentInvoices => {
                const currentMap = new Map((currentInvoices || []).map(i => [String(i.invoiceNumber || i.id), i]));
                let hasChanges = false;
                const newlyArrivedPending = [];

                serverData.invoices.forEach(serverInv => {
                  if (!serverInv) return;
                  const key = String(serverInv.invoiceNumber || serverInv.id);
                  if (!key || key === 'undefined') return;

                  const localInv = currentMap.get(key);
                  if (!localInv) {
                    hasChanges = true;
                    currentMap.set(key, serverInv);
                    if (serverInv.status === 'pending') {
                      newlyArrivedPending.push(serverInv);
                    }
                  } else if (
                    localInv.status !== serverInv.status ||
                    localInv.paidAmount !== serverInv.paidAmount ||
                    localInv.trackingStatus !== serverInv.trackingStatus ||
                    localInv.transferReceipt !== serverInv.transferReceipt
                  ) {
                    hasChanges = true;
                    currentMap.set(key, { ...localInv, ...serverInv });
                  }
                });

                if (hasChanges) {
                  // Keep sorted by date descending (newest first)
                  const updatedList = Array.from(currentMap.values()).sort((a, b) => {
                    const dateA = new Date(a.createdAt || a.date || 0).getTime();
                    const dateB = new Date(b.createdAt || b.date || 0).getTime();
                    return dateB - dateA;
                  });

                  if (newlyArrivedPending.length > 0 && !isFirstInvoiceSyncRef.current) {
                    playNotificationSound();
                    vibratePhone([300, 150, 300, 150, 400]);
                    const newest = newlyArrivedPending[0];
                    dispatchStoreAlert({
                      type: 'order',
                      title: `🛍️ وصل طلب أونلاين جديد! #${newest.invoiceNumber || ''}`,
                      body: `العميل: ${newest.customerName || 'عميل جديد'} • الإجمالي: ${newest.total || 0} ج.م`,
                      details: (newest.items || []).map(it => `${it.name} (${it.qty}x)`).join(' - ')
                    });
                  }

                  try {
                    localStorage.setItem('caturra_eg_invoices', JSON.stringify(updatedList));
                  } catch { }
                  return updatedList;
                }

                return currentInvoices;
              });
            }
          }
        }
      } catch {
        // Fallback or offline
      } finally {
        isFirstInvoiceSyncRef.current = false;
      }
    };

    // Run immediately on component mount
    syncInvoices();

    // 8-second heartbeat poll for instantaneous incoming orders
    const pollInterval = setInterval(syncInvoices, 8000);

    const handleStorageChange = (e) => {
      if (e.key === 'caturra_eg_invoices') {
        syncInvoices();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(pollInterval);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('caturra_eg_purchases', JSON.stringify(purchases));
  }, [purchases]);

  useEffect(() => {
    localStorage.setItem('caturra_eg_batches', JSON.stringify(batches));
  }, [batches]);

  useEffect(() => {
    localStorage.setItem('caturra_eg_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    const cleanUsers = (users || [])
      .filter(u => {
        const uName = String(u.username || '').toLowerCase();
        const uId = String(u.id || '');
        return uName !== 'admin' && uName !== 'owner' && uId !== 'usr-owner' && uId !== 'usr-owner-alt';
      })
      .map(u => {
        const copy = { ...u };
        delete copy.password;
        return copy;
      });

    localStorage.setItem('caturra_eg_users', JSON.stringify(cleanUsers));
    if (typeof fetch !== 'undefined') {
      const timer = setTimeout(() => {
        fetch('/api/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-caturra-erp-auth': 'caturra_sec_token_v2'
          },
          body: JSON.stringify({ users: cleanUsers })
        }).catch(() => { });
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [users]);

  // Synchronize users and data across all devices on the local network (PC & mobile)
  useEffect(() => {
    let isMounted = true;
    const fetchServerState = async () => {
      try {
        const res = await fetch('/api/sync', {
          headers: { 'x-caturra-erp-auth': 'caturra_sec_token_v2' }
        });
        if (!res.ok) return;
        const serverData = await res.json();
        if (serverData && typeof serverData === 'object' && Object.keys(serverData).length > 0) {
          if (isMounted && Array.isArray(serverData.users) && serverData.users.length > 0) {
            setUsers(prev => {
              const currentMap = new Map(
                prev
                  .filter(u => {
                    const uName = String(u.username || '').toLowerCase();
                    const uId = String(u.id || '');
                    return uName !== 'admin' && uName !== 'owner' && uId !== 'usr-owner' && uId !== 'usr-owner-alt';
                  })
                  .map(u => [String(u.id || u.username).toLowerCase(), u])
              );
              serverData.users.forEach(su => {
                const uName = String(su.username || '').toLowerCase();
                const uId = String(su.id || '');
                if (uName !== 'admin' && uName !== 'owner' && uId !== 'usr-owner' && uId !== 'usr-owner-alt') {
                  const key = String(su.id || su.username).toLowerCase();
                  const merged = { ...currentMap.get(key), ...su };
                  delete merged.password;
                  currentMap.set(key, merged);
                }
              });
              return Array.from(currentMap.values());
            });
          }

          if (isMounted && Array.isArray(serverData.invoices)) {
            if (serverData.invoices.length === 0) {
              setInvoices([]);
            } else {
              setInvoices(prev => {
                const currentMap = new Map(prev.map(i => [String(i.invoiceNumber || i.id), i]));
                serverData.invoices.forEach(si => {
                  const key = String(si.invoiceNumber || si.id);
                  if (!currentMap.has(key)) {
                    currentMap.set(key, si);
                  }
                });
                return Array.from(currentMap.values());
              });
            }
          }

          if (isMounted && Array.isArray(serverData.customers) && serverData.customers.length > 0) {
            setCustomers(prev => {
              const currentMap = new Map((prev || []).map(c => [String(c.id || c.phone), c]));
              serverData.customers.forEach(sc => {
                const key = String(sc.id || sc.phone);
                currentMap.set(key, { ...currentMap.get(key), ...sc });
              });
              const updated = Array.from(currentMap.values());
              try {
                localStorage.setItem('caturra_eg_customers', JSON.stringify(updated));
              } catch { }
              return updated;
            });
          }

          if (isMounted && Array.isArray(serverData.b2bRequests) && serverData.b2bRequests.length > 0) {
            setB2bRequests(prev => {
              const currentMap = new Map((prev || []).map(l => [String(l.id || l.refCode), l]));
              serverData.b2bRequests.forEach(sl => {
                const key = String(sl.id || sl.refCode);
                currentMap.set(key, { ...currentMap.get(key), ...sl });
              });
              const updated = Array.from(currentMap.values());
              try {
                localStorage.setItem('caturra_eg_b2b_requests', JSON.stringify(updated));
              } catch { }
              return updated;
            });
          }

          if (isMounted && Array.isArray(serverData.products)) {
            skipNextProductSyncRef.current = true;
            setProducts(serverData.products);
            try {
              localStorage.setItem('caturra_eg_products', JSON.stringify(serverData.products));
            } catch { }

            if (Array.isArray(serverData.batches)) {
              setBatches(serverData.batches);
              try {
                localStorage.setItem('caturra_eg_batches', JSON.stringify(serverData.batches));
              } catch { }
            }

            // Sync server categories if explicitly provided
            if (Array.isArray(serverData.categories) && serverData.categories.length > 0) {
              setCategories(serverData.categories);
              try {
                localStorage.setItem('caturra_eg_categories', JSON.stringify(serverData.categories));
              } catch { }
            } else {
              // Auto-register any true custom categories present on synced products (strictly excluding coffee subcategories)
              setCategories(prevCats => {
                const excludedSubcats = new Set(['espresso', 'filter', 'coffee', 'beans', 'syrups', 'specialty', 'classic_blends', 'fermented']);
                const existingIds = new Set((prevCats || []).map(c => c.id));
                const additions = [];
                (serverData.products || []).forEach(sp => {
                  if (sp.category && !existingIds.has(sp.category) && !excludedSubcats.has(sp.category)) {
                    existingIds.add(sp.category);
                    additions.push({ id: sp.category, name: sp.categoryName || sp.category });
                  }
                });
                if (additions.length === 0) return prevCats;
                const next = [...(prevCats || []), ...additions];
                const isTool = id => id === 'tools' || id === 'accessories' || id === 'boxes' || id === 'gifts';
                return next.sort((a, b) => {
                  if (a.id === 'all') return -1;
                  if (b.id === 'all') return 1;
                  if (!isTool(a.id) && isTool(b.id)) return -1;
                  if (isTool(a.id) && !isTool(b.id)) return 1;
                  return 0;
                });
              });
            }
          }
        }
      } catch {
        // Silent fallback
      } finally {
        hasFetchedServerSyncRef.current = true;
      }
    };
    fetchServerState();
    return () => { isMounted = false; };
  }, []);

  // Sync invoices to server
  useEffect(() => {
    if (typeof fetch !== 'undefined' && invoices.length > 0) {
      const timer = setTimeout(() => {
        fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ invoices: invoices.slice(0, 100) })
        }).catch(() => { });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [invoices]);


  useEffect(() => {
    localStorage.setItem('caturra_eg_current_user_id', JSON.stringify(currentUserId));
  }, [currentUserId]);

  useEffect(() => {
    localStorage.setItem('caturra_eg_contact_info', JSON.stringify(contactInfo));
  }, [contactInfo]);

  useEffect(() => {
    localStorage.setItem('caturra_eg_treasury_accounts', JSON.stringify(treasuryAccounts));
  }, [treasuryAccounts]);

  useEffect(() => {
    localStorage.setItem('caturra_eg_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem('caturra_eg_treasury_transactions', JSON.stringify(treasuryTransactions));
  }, [treasuryTransactions]);

  useEffect(() => {
    try {
      localStorage.setItem('caturra_eg_b2b_requests', JSON.stringify(b2bRequests));
    } catch (e) {
      console.warn('Failed to save b2b_requests to localStorage', e);
    }
  }, [b2bRequests]);

  // Synchronize B2B requests across different browser windows / tabs in real-time
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleStorageChange = (e) => {
      if (e.key === 'caturra_eg_b2b_requests' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setB2bRequests(parsed);
          }
        } catch (_) { }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('caturra_eg_b2b_standing_orders', JSON.stringify(b2bStandingOrders));
    } catch (e) {
      console.warn('Failed to save b2b_standing_orders to localStorage', e);
    }
  }, [b2bStandingOrders]);

  // Synchronize B2B Standing Orders across tabs
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleStorageChange = (e) => {
      if (e.key === 'caturra_eg_b2b_standing_orders' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setB2bStandingOrders(parsed);
          }
        } catch (_) { }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('caturra_eg_brewing_guides', JSON.stringify(brewingGuides));
    } catch (e) {
      console.warn('Failed to save brewing_guides to localStorage', e);
    }
  }, [brewingGuides]);

  // Synchronize Brewing Guides across tabs
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleStorageChange = (e) => {
      if (e.key === 'caturra_eg_brewing_guides' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed && typeof parsed === 'object') {
            setBrewingGuides(parsed);
          }
        } catch (_) { }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Hydrate large PDFs from IndexedDB if stripped from localStorage
  useEffect(() => {
    let isMounted = true;
    const hydratePdfs = async () => {
      const needsHydration = academyArticles.some(a => a.pdfFile && a.pdfFile.id && !a.pdfFile.data && !a.pdfFile.url);
      if (!needsHydration) return;

      const updated = await Promise.all(
        academyArticles.map(async (art) => {
          if (art.pdfFile && art.pdfFile.id && !art.pdfFile.data && !art.pdfFile.url) {
            const stored = await getPdfFromStorage(art.pdfFile.id);
            if (stored && stored.data) {
              return { ...art, pdfFile: { ...art.pdfFile, data: stored.data } };
            }
          }
          return art;
        })
      );
      if (isMounted) {
        setAcademyArticles(updated);
      }
    };
    hydratePdfs();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('caturra_eg_academy', JSON.stringify(academyArticles));
    } catch (err) {
      console.warn('LocalStorage quota reached for academy articles, saving lightweight version while IndexedDB retains full files', err);
      try {
        const lightweight = academyArticles.map(art => {
          if (art.pdfFile && art.pdfFile.data && art.pdfFile.data.length > 20000) {
            return {
              ...art,
              pdfFile: {
                ...art.pdfFile,
                data: '' // stripped from localStorage, persistent in IndexedDB
              }
            };
          }
          return art;
        });
        localStorage.setItem('caturra_eg_academy', JSON.stringify(lightweight));
      } catch (innerErr) {
        console.error('Failed to save academy to localStorage:', innerErr);
      }
    }
  }, [academyArticles]);

  // Current active user object
  const currentUser = users.find(u => u.id === currentUserId) || (users.length > 0 ? users[0] : null);

  // System Setup Check: Setup is disabled, standard login is always used
  const isSetupRequired = false;

  // Initial Admin Setup Method (First Launch)
  const setupInitialAdmin = ({ username, password, fullName, email, phone }) => {
    const cleanUser = String(username || '').trim().toLowerCase();
    const cleanPass = String(password || '').trim();
    const cleanFullName = String(fullName || '').trim() || 'المالك الرئيسي';

    if (!cleanUser || cleanPass.length < 4) {
      return { success: false, message: 'يرجى كتابة اسم مستخدم وكلمة مرور لا تقل عن 4 خانات' };
    }

    const pHash = hashPasswordSync(cleanPass);
    const ownerUser = {
      id: `usr-owner-${Date.now()}`,
      username: cleanUser,
      passwordHash: pHash,
      fullName: cleanFullName,
      role: 'owner',
      roleLabel: 'المالك والمشرف العام',
      phone: phone ? String(phone).trim() : '',
      email: email ? String(email).trim().toLowerCase() : '',
      isOwner: true,
      status: 'active',
      avatar: '👑',
      permissions: {
        products: true,
        pos: true,
        invoices: true,
        customers: true,
        purchases: true,
        sales: true,
        warehouse: true,
        accounts: true,
        treasury: true,
        academy: true,
        settings: true,
        users: true
      }
    };

    const newUsers = [ownerUser];
    setUsers(newUsers);
    setCurrentUserId(ownerUser.id);
    setIsAuthenticated(true);
    setViewMode('admin');
    setActiveTab('pos');

    try {
      localStorage.setItem('caturra_eg_users', JSON.stringify(newUsers));
      localStorage.setItem('caturra_eg_current_user_id', JSON.stringify(ownerUser.id));
      sessionStorage.setItem('caturra_view_mode', 'admin');
    } catch (err) {
      console.error('Storage error:', err);
    }

    return { success: true, user: ownerUser };
  };

  // Helper: Open invoice printable modal
  const openInvoiceModal = (invoice) => {
    let resolved = invoice;
    if (typeof invoice === 'string') {
      resolved = invoices.find(inv => inv.id === invoice || inv.invoiceNumber === invoice);
    }
    setActiveInvoiceForModal(resolved);
    setIsInvoiceModalOpen(true);
  };

  const closeInvoiceModal = () => {
    setIsInvoiceModalOpen(false);
    setActiveInvoiceForModal(null);
  };

  // 1. AUTHENTICATION & PERMISSIONS (Strict Salted SHA-256 - Zero Plaintext Passwords)
  const login = (username, password) => {
    const rawUser = String(username || '').trim();
    const cleanUser = toLatinDigits(rawUser);
    const rawPass = String(password || '').trim();
    const cleanPass = toLatinDigits(rawPass);

    if (!cleanUser || !cleanPass) {
      return { success: false, message: 'يرجى إدخال اسم المستخدم وكلمة المرور' };
    }

    const candidateHash = hashPasswordSync(cleanPass);
    const candidateRawHash = hashPasswordSync(rawPass);

    // Look for matching user: Strictly Case-Sensitive (a !== A)
    const found = users.find(u => {
      const uName = toLatinDigits(String(u.username || '').trim());
      const uEmail = toLatinDigits(String(u.email || '').trim());

      // Strict case-sensitive check: exact match letter-for-letter and case-for-case
      const matchUser = (
        uName === cleanUser ||
        (uEmail && uEmail === cleanUser)
      );
      if (!matchUser) return false;

      // Pure cryptographic SHA-256 salted hash verification
      return !!u.passwordHash && (
        u.passwordHash === candidateHash ||
        u.passwordHash === candidateRawHash
      );
    });

    if (found) {
      if (found.status === 'inactive') {
        return { success: false, message: 'هذا الحساب موقوف حالياً من قِبل إدارة النظام.' };
      }
      setLoginPreselectedUsername('');
      setCurrentUserId(found.id);
      setIsAuthenticated(true);
      setViewMode('admin');

      // Auto route to first allowed tab
      const perms = found.permissions || {};
      if (perms.pos) setActiveTab('pos');
      else if (perms.products) setActiveTab('products');
      else if (perms.warehouse) setActiveTab('warehouse');
      else if (perms.purchases) setActiveTab('purchases');
      else if (perms.invoices) setActiveTab('invoices');
      else if (perms.customers) setActiveTab('customers');
      else if (perms.sales) setActiveTab('sales');
      else if (perms.accounts) setActiveTab('accounts');
      else if (perms.treasury) setActiveTab('treasury');
      else if (perms.settings) setActiveTab('settings');
      else if (perms.users) setActiveTab('users');
      else setActiveTab('pos');

      return { success: true, user: found };
    }

    return { success: false, message: 'اسم المستخدم أو كلمة المرور غير صحيحة.' };
  };

  const logout = () => {
    setIsAuthenticated(false);
    setLoginPreselectedUsername('');
    try {
      localStorage.removeItem('caturra_eg_auth');
      sessionStorage.removeItem('caturra_view_mode');
      localStorage.removeItem('caturra_view_mode');
    } catch {
      // ignore
    }
  };

  const logoutAndSwitchUser = (targetUsername) => {
    setIsAuthenticated(false);
    setLoginPreselectedUsername(targetUsername || '');
    setViewMode('admin');
    try {
      localStorage.removeItem('caturra_eg_auth');
      sessionStorage.removeItem('caturra_view_mode');
      localStorage.removeItem('caturra_view_mode');
    } catch {
      // ignore
    }
  };

  const loginAsUser = (userId) => {
    const target = users.find(u => u.id === userId);
    if (target) {
      setCurrentUserId(target.id);
      setIsAuthenticated(true);
      setViewMode('admin');
      try {
        localStorage.removeItem('caturra_eg_auth');
        localStorage.setItem('caturra_eg_current_user_id', JSON.stringify(target.id));
      } catch {
        // ignore
      }
      return true;
    }
    return false;
  };

  const resetAdminAccount = () => {
    const withoutOwner = users.filter(u => !u.isOwner);
    setUsers(withoutOwner);
    setCurrentUserId(null);
    setIsAuthenticated(false);
    try {
      localStorage.setItem('caturra_eg_users', JSON.stringify(withoutOwner));
      localStorage.removeItem('caturra_eg_current_user_id');
      localStorage.removeItem('caturra_eg_auth');
      sessionStorage.removeItem('caturra_view_mode');
    } catch (err) {
      console.warn('Error resetting admin:', err);
    }
    return { success: true };
  };

  // 2. PRODUCTS MANAGEMENT (Weight in Grams vs Pieces)
  const addProduct = (prodData) => {
    const isWeight = prodData.unitType === 'weight';
    const stockVal = Number(prodData.stock || 0);
    const stockGram = isWeight ? (Number(prodData.stockGram) || stockVal * 1000) : 0;
    const pricePerKg = Number(prodData.pricePerKg || (Number(prodData.sellingPrice || 0) * 4));
    const costPerKg = Number(prodData.costPerKg || (Number(prodData.costPrice || 0) * 4));

    const newProduct = {
      id: `prod-${Date.now()}`,
      salesCount: 0,
      unitType: prodData.unitType || 'piece',
      pricePerKg: isWeight ? pricePerKg : undefined,
      costPerKg: isWeight ? costPerKg : undefined,
      stockGram: isWeight ? stockGram : 0,
      stock: isWeight ? (stockGram / 1000) : stockVal,
      costPrice: Number(prodData.costPrice || (isWeight ? costPerKg / 4 : 0)),
      sellingPrice: Number(prodData.sellingPrice || (isWeight ? pricePerKg / 4 : 0)),
      minStockAlert: prodData.minStockAlert || 5,
      sku: prodData.sku || `CAT-${Math.floor(1000 + Math.random() * 9000)}`,
      barcode: prodData.barcode || `${Math.floor(622100000000 + Math.random() * 999999)}`,
      image: prodData.image || '/caturra_ethiopia.jpg',
      ...prodData
    };

    setProducts(prev => [newProduct, ...prev]);

    // If initial stock provided, add an initial batch in warehouse
    if (newProduct.stock > 0) {
      const newBatch = {
        id: `bat-${Date.now()}`,
        productId: newProduct.id,
        productName: newProduct.name,
        batchCode: `BAT-${Math.floor(100 + Math.random() * 900)}`,
        unitType: newProduct.unitType,
        entryDate: newProduct.entryDate || new Date().toISOString().split('T')[0],
        expiryDate: newProduct.expiryDate || '2028-01-01',
        quantity: newProduct.stock,
        quantityGram: isWeight ? stockGram : 0,
        costPrice: isWeight ? newProduct.costPerKg : newProduct.costPrice,
        status: 'good'
      };
      setBatches(prev => [newBatch, ...prev]);
    }
    return newProduct;
  };

  const updateProduct = (id, updatedFields) => {
    let targetUpdated = null;
    setProducts(prev => {
      const next = prev.map(p => {
        if (p.id === id) {
          const isWeight = (updatedFields.unitType || p.unitType) === 'weight';
          let stock = updatedFields.stock !== undefined ? Number(updatedFields.stock) : p.stock;
          let stockGram = p.stockGram || (stock * 1000);

          if (isWeight && updatedFields.stock !== undefined) {
            stockGram = stock * 1000;
          }

          const updated = {
            ...p,
            ...updatedFields,
            unitType: isWeight ? 'weight' : 'piece',
            stockGram: isWeight ? stockGram : 0,
            stock: stock,
            pricePerKg: updatedFields.pricePerKg !== undefined ? Number(updatedFields.pricePerKg) : p.pricePerKg,
            costPerKg: updatedFields.costPerKg !== undefined ? Number(updatedFields.costPerKg) : p.costPerKg,
            costPrice: updatedFields.costPrice !== undefined ? Number(updatedFields.costPrice) : p.costPrice,
            sellingPrice: updatedFields.sellingPrice !== undefined ? Number(updatedFields.sellingPrice) : p.sellingPrice
          };
          targetUpdated = updated;
          return updated;
        }
        return p;
      });
      try {
        localStorage.setItem('caturra_eg_products', JSON.stringify(next));
      } catch { }
      return next;
    });

    // Immediate server sync for real-time visibility across all clients and storefront
    if (typeof fetch !== 'undefined') {
      fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-caturra-erp-auth': 'caturra_sec_token_v2'
        },
        body: JSON.stringify({
          updatedProduct: {
            id,
            ...updatedFields
          }
        })
      }).catch(() => { });
    }
  };

  const deleteProduct = (id) => {
    const nextProducts = (products || []).filter(p => p.id !== id);
    const nextBatches = (batches || []).filter(b => b.productId !== id);
    skipNextProductSyncRef.current = true;
    setProducts(nextProducts);
    setBatches(nextBatches);
    try {
      localStorage.setItem('caturra_eg_products', JSON.stringify(nextProducts));
      localStorage.setItem('caturra_eg_batches', JSON.stringify(nextBatches));
    } catch { }
    if (typeof fetch !== 'undefined') {
      fetch('/api/sync', {
        method: 'POST',
        keepalive: true,
        headers: {
          'Content-Type': 'application/json',
          'x-caturra-erp-auth': 'caturra_sec_token_v2'
        },
        body: JSON.stringify({ products: nextProducts, batches: nextBatches })
      }).catch(() => { });
    }
  };

  const addCategory = (name) => {
    const id = `cat-${Date.now()}`;
    const newCat = { id, name };
    setCategories(prev => [...prev, newCat]);
    return newCat;
  };

  // 3. PURCHASES MANAGEMENT (Linked to Products, Batches & Accounts)
  const addPurchaseInvoice = (purchaseData) => {
    const totalAmount = purchaseData.items.reduce((sum, item) => sum + (Number(item.costPrice) * Number(item.qty)), 0);
    const paidAmount = Number(purchaseData.paidAmount || totalAmount);
    const remainingAmount = Math.max(0, totalAmount - paidAmount);
    const paymentStatus = remainingAmount === 0 ? 'paid' : (paidAmount > 0 ? 'partial' : 'unpaid');

    const paymentEntry = paidAmount > 0 ? [{
      id: `pay-${Date.now()}`,
      date: purchaseData.date || new Date().toISOString().split('T')[0],
      amount: paidAmount,
      paymentMethod: purchaseData.paymentMethod || 'cash',
      notes: paymentStatus === 'paid' ? 'سداد كامل الفاتورة' : 'سداد دفعة أولى'
    }] : [];

    const newPurchase = {
      id: `pur-${Date.now()}`,
      invoiceNumber: purchaseData.invoiceNumber || `PUR-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      supplierName: purchaseData.supplierName || 'مورد بن عام',
      date: purchaseData.date || new Date().toISOString().split('T')[0],
      items: purchaseData.items,
      totalAmount,
      paidAmount,
      remainingAmount,
      paymentStatus,
      paymentMethod: purchaseData.paymentMethod || 'cash',
      treasuryAccountId: purchaseData.treasuryAccountId || null,
      payments: paymentEntry,
      notes: purchaseData.notes || ''
    };

    setPurchases(prev => [newPurchase, ...prev]);

    // Automatically record withdrawal in Treasury if paidAmount > 0
    if (paidAmount > 0) {
      const pMethod = purchaseData.paymentMethod || 'cash';
      const targetAccountId = purchaseData.treasuryAccountId || (pMethod === 'instapay' ? 'acc-instapay-main' : (pMethod === 'wallet' ? 'acc-wallet-vodafone' : 'acc-cash-main'));
      const targetAccount = treasuryAccounts.find(a => a.id === targetAccountId) || treasuryAccounts[0];
      const now = new Date();
      const formattedDate = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      const purchaseTx = {
        id: `tx-pur-${newPurchase.id}`,
        date: formattedDate,
        type: 'withdrawal',
        fromAccountId: targetAccountId,
        toAccountId: null,
        amount: paidAmount,
        category: 'مشتريات وتوريدات',
        description: `سداد مشتريات: فاتورة توريد #${newPurchase.invoiceNumber} - المورد: ${newPurchase.supplierName} (${paymentStatus === 'paid' ? 'سداد كامل' : 'دفعة مقدمة'})`,
        performedBy: currentUser?.fullName || 'مسؤول المشتريات',
        purchaseId: newPurchase.id
      };
      setTreasuryTransactions(prev => [purchaseTx, ...prev]);
    }

    // Auto sync supplier if not in suppliers list
    if (purchaseData.supplierName) {
      const nameTrimmed = purchaseData.supplierName.trim();
      setSuppliers(prev => {
        if (!prev.some(s => s.name.trim().toLowerCase() === nameTrimmed.toLowerCase())) {
          return [
            {
              id: `sup-${Date.now()}`,
              name: nameTrimmed,
              contactPerson: purchaseData.contactPerson || '',
              phone: purchaseData.supplierPhone || '',
              city: 'القاهرة',
              address: '',
              category: 'مورد عام',
              taxNumber: '',
              notes: 'أضيف تلقائياً مع فاتورة مشتريات'
            },
            ...prev
          ];
        }
        return prev;
      });
    }

    // Update each product & create inventory batch
    purchaseData.items.forEach(item => {
      let productId = item.productId;
      const isWeight = item.unitType === 'weight';
      const itemCost = Number(item.costPrice);
      const itemSelling = Number(item.suggestedSellingPrice || itemCost * 1.5);
      const itemQty = Number(item.qty); // in kg if weight, or pieces if piece
      const itemWeightGram = isWeight ? (item.weightGram || itemQty * 1000) : 0;

      const existingProduct = products.find(p => p.id === productId || p.name.trim().toLowerCase() === item.name.trim().toLowerCase());

      if (existingProduct) {
        productId = existingProduct.id;
        const newStock = existingProduct.stock + itemQty;
        const newStockGram = (existingProduct.stockGram || (existingProduct.stock * 1000)) + itemWeightGram;

        updateProduct(productId, {
          costPrice: itemCost,
          sellingPrice: itemSelling,
          stock: newStock,
          stockGram: isWeight ? newStockGram : 0,
          pricePerKg: isWeight ? (item.pricePerKg || itemSelling * 4) : undefined,
          costPerKg: isWeight ? (item.costPerKg || itemCost * 4) : undefined,
          expiryDate: item.expiryDate || existingProduct.expiryDate,
          image: item.image || existingProduct.image
        });
      } else {
        const createdProd = addProduct({
          name: item.name,
          category: item.category || 'specialty',
          unitType: isWeight ? 'weight' : 'piece',
          costPrice: itemCost,
          sellingPrice: itemSelling,
          pricePerKg: isWeight ? (item.pricePerKg || itemSelling * 4) : undefined,
          costPerKg: isWeight ? (item.costPerKg || itemCost * 4) : undefined,
          stock: itemQty,
          stockGram: itemWeightGram,
          expiryDate: item.expiryDate || '2027-12-31',
          entryDate: item.entryDate || newPurchase.date,
          image: item.image || '/caturra_ethiopia.jpg',
          minStockAlert: 5
        });
        productId = createdProd.id;
      }

      // Add to inventory batches
      const newBatch = {
        id: `bat-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        productId: productId,
        productName: item.name,
        batchCode: `BAT-${newPurchase.invoiceNumber.slice(-4)}-${Math.floor(10 + Math.random() * 90)}`,
        unitType: isWeight ? 'weight' : 'piece',
        entryDate: item.entryDate || newPurchase.date,
        expiryDate: item.expiryDate || '2027-12-31',
        quantity: itemQty,
        quantityGram: isWeight ? itemWeightGram : 0,
        costPrice: itemCost,
        status: 'good'
      };
      setBatches(prev => [newBatch, ...prev]);
    });

    return newPurchase;
  };

  // 3.1 SUPPLIERS MANAGEMENT & PARTIAL INVOICE SETTLEMENT
  const addSupplier = (supplierData) => {
    const newSupplier = {
      id: `sup-${Date.now()}`,
      name: supplierData.name.trim(),
      contactPerson: supplierData.contactPerson || '',
      phone: supplierData.phone || '',
      email: supplierData.email || '',
      city: supplierData.city || 'القاهرة',
      address: supplierData.address || '',
      category: supplierData.category || 'بن ومحاصيل',
      taxNumber: supplierData.taxNumber || '',
      suppliedProducts: supplierData.suppliedProducts || [],
      notes: supplierData.notes || '',
      createdAt: new Date().toISOString()
    };
    setSuppliers(prev => [newSupplier, ...prev]);
    return newSupplier;
  };

  const updateSupplier = (id, updatedData) => {
    setSuppliers(prev => prev.map(s => s.id === id ? { ...s, ...updatedData } : s));
  };

  const deleteSupplier = (id) => {
    setSuppliers(prev => prev.filter(s => s.id !== id));
  };

  const paySupplierInvoice = (invoiceId, paymentAmount, paymentMethod = 'cash', notes = '', treasuryAccountId = null) => {
    const amountNum = Number(paymentAmount);
    if (isNaN(amountNum) || amountNum <= 0) return false;

    let targetPurObj = null;

    setPurchases(prevPurchases => {
      return prevPurchases.map(pur => {
        if (pur.id === invoiceId || pur.invoiceNumber === invoiceId) {
          targetPurObj = pur;
          const currentPaid = Number(pur.paidAmount || 0);
          const total = Number(pur.totalAmount || 0);
          const newPaid = Math.min(total, currentPaid + amountNum);
          const newRemaining = Math.max(0, total - newPaid);
          const newStatus = newRemaining === 0 ? 'paid' : (newPaid > 0 ? 'partial' : 'unpaid');

          const paymentEntry = {
            id: `pay-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            date: new Date().toISOString().split('T')[0] + ' ' + new Date().toTimeString().slice(0, 5),
            amount: amountNum,
            paymentMethod,
            treasuryAccountId: treasuryAccountId || null,
            notes: notes || 'سداد دفعة للمورد'
          };

          const existingPayments = pur.payments || [];

          return {
            ...pur,
            paidAmount: newPaid,
            remainingAmount: newRemaining,
            paymentStatus: newStatus,
            payments: [...existingPayments, paymentEntry]
          };
        }
        return pur;
      });
    });

    // Record withdrawal from Treasury
    const resolvedPur = targetPurObj || purchases.find(p => p.id === invoiceId || p.invoiceNumber === invoiceId);
    const supName = resolvedPur?.supplierName || 'المورد';
    const invNo = resolvedPur?.invoiceNumber || invoiceId;
    const targetAccountId = treasuryAccountId || (paymentMethod === 'instapay' ? 'acc-instapay-main' : (paymentMethod === 'wallet' ? 'acc-wallet-vodafone' : 'acc-cash-main'));

    const now = new Date();
    const formattedDate = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const supPayTx = {
      id: `tx-sup-pay-${Date.now()}`,
      date: formattedDate,
      type: 'withdrawal',
      fromAccountId: targetAccountId,
      toAccountId: null,
      amount: amountNum,
      category: 'سداد مديونية مورد',
      description: `سداد دفعة للمورد: ${supName} - فاتورة #${invNo}${notes ? ` (${notes})` : ''}`,
      performedBy: currentUser?.fullName || 'مسؤول الخزينة',
      purchaseId: invoiceId
    };
    setTreasuryTransactions(prev => [supPayTx, ...prev]);

    return true;
  };

  // 4. POS & SALES MANAGEMENT (Weight Deduction vs Piece Deduction)
  const createSale = (saleData) => {
    const {
      items,
      customerId,
      customerName,
      customerPhone,
      customerAddress,
      discount = 0,
      paymentMethod = 'cash',
      paidAmount: inputPaidAmount,
      splitPayment,
      source = 'pos'
    } = saleData;

    const subtotal = items.reduce((sum, item) => sum + (Number(item.price) * Number(item.qty || 1)), 0);
    const total = Math.max(0, subtotal - Number(discount));

    // Payment status calculation
    const isOnlineOrder = source === 'online' || saleData.status === 'pending';
    let paidAmount = total;
    if (isOnlineOrder) {
      paidAmount = paymentMethod === 'cash' ? 0 : (inputPaidAmount !== undefined ? Number(inputPaidAmount) : total);
    } else if (paymentMethod === 'deferred') {
      paidAmount = inputPaidAmount !== undefined ? Number(inputPaidAmount) : 0;
    } else if (paymentMethod === 'split') {
      paidAmount = splitPayment
        ? (Number(splitPayment.cash || 0) + Number(splitPayment.instapay || 0))
        : (inputPaidAmount !== undefined ? Number(inputPaidAmount) : total);
    } else if (inputPaidAmount !== undefined) {
      paidAmount = Math.min(total, Number(inputPaidAmount));
    }
    const remainingDebt = Math.max(0, total - paidAmount);
    const status = isOnlineOrder ? 'pending' : (remainingDebt === 0 ? 'paid' : (paidAmount > 0 ? 'partial' : 'unpaid'));

    // Customer handling: robust lookup & atomic update without race condition
    let finalCustId = customerId;
    let finalCustName = customerName || 'عميل صالة نقدي';
    let finalCustPhone = customerPhone || '';

    if (finalCustName && finalCustName.trim() !== 'عميل صالة نقدي') {
      // Find matching customer in current state to preserve exact ID and details
      const existingInState = customers.find(c =>
        (finalCustId && c.id === finalCustId) ||
        (finalCustPhone && c.phone && c.phone === finalCustPhone) ||
        (c.name && c.name.trim().toLowerCase() === finalCustName.trim().toLowerCase())
      );

      if (existingInState) {
        finalCustId = existingInState.id;
        finalCustName = existingInState.name;
        finalCustPhone = existingInState.phone || finalCustPhone;
      } else if (!finalCustId) {
        finalCustId = `cust-${Date.now()}`;
      }

      setCustomers(prev => {
        const matchIndex = prev.findIndex(c =>
          c.id === finalCustId ||
          (finalCustPhone && c.phone && c.phone === finalCustPhone) ||
          (c.name && c.name.trim().toLowerCase() === finalCustName.trim().toLowerCase())
        );

        if (matchIndex !== -1) {
          const existing = prev[matchIndex];
          const updated = [...prev];
          updated[matchIndex] = {
            ...existing,
            totalOrders: (Number(existing.totalOrders) || 0) + 1,
            totalSpent: (Number(existing.totalSpent) || 0) + total,
            debt: Math.max(0, (Number(existing.debt) || 0) + remainingDebt)
          };
          return updated;
        } else {
          const newCust = {
            id: finalCustId,
            name: finalCustName,
            phone: finalCustPhone || '',
            city: 'القاهرة',
            address: customerAddress || '',
            totalOrders: 1,
            totalSpent: total,
            debt: remainingDebt,
            notes: `تم تسجيله عبر ${source === 'pos' ? 'نقطة البيع (الكاشير)' : 'المتجر الإلكتروني'}`,
            createdAt: new Date().toISOString().split('T')[0]
          };
          return [newCust, ...prev];
        }
      });
    }

    // Deduct stock accurately: by weight (in grams) or by pieces!
    items.forEach(saleItem => {
      const isWeight = saleItem.unitType === 'weight' && saleItem.weightGram;

      if (isWeight) {
        const totalGramsSold = Number(saleItem.weightGram) * Number(saleItem.qty || 1);

        // 1. Deduct from product stockGram
        setProducts(prev =>
          prev.map(p => {
            if (p.id === saleItem.productId) {
              const currentGrams = p.stockGram !== undefined ? p.stockGram : (p.stock * 1000);
              const newGrams = Math.max(0, currentGrams - totalGramsSold);
              return {
                ...p,
                stockGram: newGrams,
                stock: Math.round((newGrams / 1000) * 10) / 10,
                salesCount: (p.salesCount || 0) + (saleItem.qty || 1)
              };
            }
            return p;
          })
        );

        // 2. FIFO Batch deduction in grams
        let gramsLeftToDeduct = totalGramsSold;
        setBatches(prev => {
          return prev.map(batch => {
            if (batch.productId === saleItem.productId && gramsLeftToDeduct > 0) {
              const currentBatchGrams = batch.quantityGram !== undefined ? batch.quantityGram : (batch.quantity * 1000);
              if (currentBatchGrams > 0) {
                const deduct = Math.min(currentBatchGrams, gramsLeftToDeduct);
                gramsLeftToDeduct -= deduct;
                const remGrams = currentBatchGrams - deduct;
                return {
                  ...batch,
                  quantityGram: remGrams,
                  quantity: Math.round((remGrams / 1000) * 10) / 10,
                  status: remGrams <= 0 ? 'depleted' : batch.status
                };
              }
            }
            return batch;
          });
        });

      } else {
        // Standard piece deduction
        setProducts(prev =>
          prev.map(p => {
            if (p.id === saleItem.productId) {
              return {
                ...p,
                stock: Math.max(0, p.stock - saleItem.qty),
                salesCount: (p.salesCount || 0) + saleItem.qty
              };
            }
            return p;
          })
        );

        let qtyToDeduct = saleItem.qty;
        setBatches(prev => {
          return prev.map(batch => {
            if (batch.productId === saleItem.productId && qtyToDeduct > 0 && batch.quantity > 0) {
              const deduct = Math.min(batch.quantity, qtyToDeduct);
              qtyToDeduct -= deduct;
              return {
                ...batch,
                quantity: batch.quantity - deduct,
                status: (batch.quantity - deduct) <= 0 ? 'depleted' : batch.status
              };
            }
            return batch;
          });
        });
      }
    });

    const now = new Date();
    const formattedDate = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      date: formattedDate,
      customerId: finalCustId,
      customerName: finalCustName,
      customerPhone: finalCustPhone,
      customerAddress: customerAddress || '',
      items,
      subtotal,
      tax: 0,
      discount: Number(discount),
      total,
      paidAmount,
      downPayment: (paymentMethod === 'deferred' || paymentMethod === 'credit') ? Number(paidAmount || 0) : 0,
      initialPaidAmount: Number(paidAmount || 0),
      remainingDebt,
      paymentMethod,
      splitPayment: splitPayment || null,
      transferReceipt: saleData.transferReceipt || null,
      transferSenderPhone: saleData.transferSenderPhone || '',
      transferReceiptFileName: saleData.transferReceiptFileName || '',
      transferReceiptHostedUrl: saleData.transferReceiptHostedUrl || '',
      paymentDetails: saleData.paymentDetails || null,
      status, // 'pending' if online order
      trackingStatus: isOnlineOrder ? 'received' : 'delivered',
      trackingHistory: [
        {
          status: isOnlineOrder ? 'received' : 'delivered',
          time: formattedDate,
          note: isOnlineOrder ? 'تم استلام وتأكيد الطلب عبر المتجر الإلكتروني' : 'تم البيع والتسليم المباشر في المحل (POS)'
        }
      ],
      source: source || 'pos',
      isB2B: Boolean(saleData.isB2B || source === 'b2b'),
      standingOrderId: saleData.standingOrderId || null,
      b2bRefCode: saleData.b2bRefCode || null,
      cashierName: source === 'online' ? 'المتجر الإلكتروني (Online Order)' : (source === 'b2b' ? (currentUser?.fullName || 'مسؤول الجملة B2B') : currentUser.fullName),
      orderNotes: saleData.notes || '',
      createdAt: now.toISOString()
    };

    setInvoices(prev => [newInvoice, ...prev]);

    // Immediately sync new order to server DB for instant visibility across all devices
    if (typeof fetch !== 'undefined') {
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoices: [newInvoice] })
      }).catch(() => { });
    }
    if (Number(paidAmount || 0) > 0) {
      if (paymentMethod === 'split' && splitPayment) {
        const splitCash = Number(splitPayment.cash || 0);
        const splitInsta = Number(splitPayment.instapay || 0);
        const newTxs = [];
        if (splitCash > 0) {
          newTxs.push({
            id: `tx-inv-${newInvoice.id}-cash`,
            date: formattedDate,
            type: 'deposit',
            fromAccountId: null,
            toAccountId: 'acc-cash-main',
            amount: splitCash,
            category: 'مبيعات نقطة البيع (كاش)',
            description: `مبيعات فاتورة #${newInvoice.invoiceNumber} (جزء كاش) - العميل: ${finalCustName}`,
            performedBy: currentUser?.fullName || 'الكاشير',
            invoiceId: newInvoice.id,
            customerId: finalCustId
          });
        }
        if (splitInsta > 0) {
          newTxs.push({
            id: `tx-inv-${newInvoice.id}-insta`,
            date: formattedDate,
            type: 'deposit',
            fromAccountId: null,
            toAccountId: 'acc-instapay-main',
            amount: splitInsta,
            category: 'مبيعات إنستاباي',
            description: `مبيعات فاتورة #${newInvoice.invoiceNumber} (جزء إنستاباي) - العميل: ${finalCustName}`,
            performedBy: currentUser?.fullName || 'الكاشير',
            invoiceId: newInvoice.id,
            customerId: finalCustId
          });
        }
        if (newTxs.length > 0) {
          setTreasuryTransactions(prev => [...newTxs, ...prev]);
        }
      } else {
        const isDeferred = paymentMethod === 'deferred' || paymentMethod === 'credit';
        const depositAmt = isDeferred ? Number(newInvoice.downPayment || newInvoice.paidAmount) : Number(newInvoice.paidAmount);
        const targetAcc = paymentMethod === 'instapay'
          ? 'acc-instapay-main'
          : (paymentMethod === 'wallet' ? 'acc-wallet-vodafone' : 'acc-cash-main');

        if (depositAmt > 0) {
          const invTx = {
            id: `tx-inv-${newInvoice.id}`,
            date: formattedDate,
            type: 'deposit',
            fromAccountId: null,
            toAccountId: targetAcc,
            amount: depositAmt,
            category: isDeferred ? 'دفعة مقدمة - فاتورة آجلة' : (paymentMethod === 'instapay' ? 'مبيعات إنستاباي' : paymentMethod === 'wallet' ? 'مبيعات محفظة إلكترونية' : 'مبيعات نقطة البيع (كاش)'),
            description: isDeferred
              ? `دفعة مقدمة لفاتورة آجلة #${newInvoice.invoiceNumber} - العميل: ${finalCustName}`
              : `مبيعات فاتورة #${newInvoice.invoiceNumber} - العميل: ${finalCustName}`,
            performedBy: currentUser?.fullName || 'الكاشير',
            invoiceId: newInvoice.id,
            customerId: finalCustId
          };
          setTreasuryTransactions(prev => [invTx, ...prev]);
        }
      }
    }
    try {
      const itemsSummary = (items || []).map(it => `${it.name} (${it.qty}x)`).join(' - ');
      const isOnline = source === 'online' || saleData.status === 'pending';
      const alertTitle = isOnline
        ? `🛍️ طلب أونلاين جديد #${newInvoice.invoiceNumber}`
        : `🧾 فاتورة مبيعات جديدة #${newInvoice.invoiceNumber}`;
      const alertBody = `العميل: ${finalCustName} • الإجمالي: ${total} ج.م`;

      dispatchStoreAlert({
        type: 'order',
        title: alertTitle,
        body: alertBody,
        details: itemsSummary
      });
    } catch (e) {
      console.warn('Alert dispatch failed:', e);
    }

    return newInvoice;
  };

  // Confirm pending online order
  const confirmPendingOrder = (invoiceId) => {
    const target = invoices.find(inv => inv.id === invoiceId || inv.invoiceNumber === invoiceId);
    const updatedInv = target ? {
      ...target,
      status: 'paid',
      paidAmount: target.total,
      remainingDebt: 0,
      confirmedAt: new Date().toISOString()
    } : null;

    setInvoices(prev =>
      prev.map(inv => {
        if (inv.id === invoiceId || inv.invoiceNumber === invoiceId) {
          return {
            ...inv,
            status: 'paid',
            paidAmount: inv.total,
            remainingDebt: 0,
            confirmedAt: new Date().toISOString()
          };
        }
        return inv;
      })
    );

    if (typeof fetch !== 'undefined') {
      const payload = updatedInv || { id: invoiceId, status: 'paid' };
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoices: [payload] })
      }).catch(() => { });
    }
  };

  // Unified Invoice / Order Cancellation (Restores stock, zeroes remaining debt, and removes treasury impact)
  const cancelInvoice = (invoiceId) => {
    const targetInvoice = invoices.find(inv => inv.id === invoiceId);
    if (!targetInvoice || targetInvoice.status === 'cancelled') return;

    // 1. Restore inventory stock to products
    if (Array.isArray(targetInvoice.items)) {
      targetInvoice.items.forEach(saleItem => {
        const isWeight = saleItem.unitType === 'weight' && saleItem.weightGram;
        if (isWeight) {
          const gramsToRestore = Number(saleItem.weightGram) * Number(saleItem.qty || 1);
          setProducts(prev =>
            prev.map(p => {
              if (p.id === saleItem.productId) {
                const currentGrams = p.stockGram !== undefined ? p.stockGram : (p.stock * 1000);
                const newGrams = currentGrams + gramsToRestore;
                return {
                  ...p,
                  stockGram: newGrams,
                  stock: Math.round((newGrams / 1000) * 10) / 10
                };
              }
              return p;
            })
          );
        } else {
          const qtyToRestore = Number(saleItem.qty || 1);
          setProducts(prev =>
            prev.map(p => {
              if (p.id === saleItem.productId) {
                return {
                  ...p,
                  stock: p.stock + qtyToRestore
                };
              }
              return p;
            })
          );
        }
      });
    }

    // 2. Mark invoice as cancelled and zero out remaining debt & financial impact
    const now = new Date();
    const formattedDate = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    setInvoices(prev =>
      prev.map(inv => {
        if (inv.id === invoiceId) {
          const history = inv.trackingHistory || [];
          return {
            ...inv,
            status: 'cancelled',
            trackingStatus: 'cancelled',
            remainingDebt: 0,
            cancelledAt: formattedDate,
            trackingHistory: [
              ...history,
              {
                status: 'cancelled',
                time: formattedDate,
                note: 'تم إلغاء الفاتورة/الطلب من الإدارة وتصفير مديونيتها واسترجاع المخزون والخزينة'
              }
            ]
          };
        }
        return inv;
      })
    );

    // 3. Purge all transactions related to this invoice from Treasury (so it NEVER affects safe/cash balances)
    setTreasuryTransactions(prevTx =>
      prevTx.filter(tx => tx.invoiceId !== invoiceId && !tx.id.startsWith(`tx-inv-${invoiceId}`))
    );

    // 4. Clean customer debt, totalSpent, and totalOrders immediately
    const custId = targetInvoice.customerId;
    const custPhone = targetInvoice.customerPhone;
    const custName = targetInvoice.customerName;

    setCustomers(prev => {
      const updated = (prev || []).map(c => {
        const isMatch =
          (custId && (c.id === custId || String(c.id) === String(custId))) ||
          (custPhone && c.phone && normalizePhone(c.phone) === normalizePhone(custPhone) && custPhone !== '') ||
          (custName && c.name && normalizeArabic(c.name) === normalizeArabic(custName) && normalizeArabic(c.name) !== normalizeArabic('عميل صالة نقدي'));

        if (isMatch) {
          const remainingInvoices = (invoices || []).filter(inv =>
            inv.id !== invoiceId &&
            inv.status !== 'cancelled' &&
            inv.status !== 'returned' &&
            inv.trackingStatus !== 'cancelled' &&
            ((inv.customerId && (inv.customerId === c.id || String(inv.customerId) === String(c.id))) ||
              (c.phone && normalizePhone(inv.customerPhone) === normalizePhone(c.phone) && c.phone !== '') ||
              (c.name && normalizeArabic(inv.customerName) === normalizeArabic(c.name) && normalizeArabic(c.name) !== normalizeArabic('عميل صالة نقدي')))
          );

          const newInvDebt = remainingInvoices.reduce((sum, inv) => sum + (Number(inv.remainingDebt) || 0), 0);
          const newInvSpent = remainingInvoices.reduce((sum, inv) => sum + (Number(inv.finalTotal || inv.total) || 0), 0);
          const newOrders = remainingInvoices.length;

          const baseDebt = Number(c.openingDebt || 0);
          const baseSpent = Number(c.openingSpent || 0);
          const baseOrders = Number(c.openingOrders || 0);

          return {
            ...c,
            debt: Math.max(0, baseDebt + newInvDebt),
            totalSpent: Math.max(0, baseSpent + newInvSpent),
            totalOrders: Math.max(0, baseOrders + newOrders)
          };
        }
        return c;
      });

      try {
        localStorage.setItem('caturra_eg_customers', JSON.stringify(updated));
      } catch (e) { }
      return updated;
    });

    if (typeof fetch !== 'undefined') {
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoices: [{ ...targetInvoice, status: 'cancelled' }] })
      }).catch(() => { });
    }
  };

  const cancelPendingOrder = cancelInvoice;

  // 5. CUSTOMER MANAGEMENT
  const addCustomer = (customerData) => {
    const openingDebt = Number(customerData.debt || 0);
    const company = customerData.companyName ? String(customerData.companyName).trim() : '';
    const contact = customerData.contactName || customerData.name || '';
    const isB2B = Boolean(customerData.isB2B);
    const b2bRefCode = customerData.b2bRefCode || (isB2B ? `B2B-${Math.floor(1000 + Math.random() * 9000)}` : null);

    const displayName = isB2B
      ? (company ? (contact ? `${company} (${contact})` : company) : contact)
      : (customerData.name || 'عميل جديد');

    const newCustomer = {
      id: `cust-${Date.now()}`,
      totalOrders: 0,
      totalSpent: 0,
      createdAt: new Date().toISOString().split('T')[0],
      ...customerData,
      name: displayName,
      companyName: company,
      contactName: contact,
      isB2B,
      b2bRefCode,
      debt: openingDebt,
      openingDebt: openingDebt
    };

    setCustomers(prev => [newCustomer, ...prev]);

    // If B2B, automatically register in B2B database
    if (isB2B) {
      const b2bLead = {
        id: `lead-${Date.now()}`,
        refCode: b2bRefCode,
        companyName: company || displayName,
        contactName: contact || '',
        phone: normalizePhone(customerData.phone || ''),
        email: customerData.email || '',
        city: customerData.city || 'القاهرة',
        branch: customerData.address || '',
        businessType: customerData.businessType || 'specialty_cafe',
        monthlyVolume: customerData.monthlyVolume || '25 - 50 كجم شهرياً',
        status: 'contracted',
        isRead: true,
        notes: customerData.notes || '',
        preferredProducts: customerData.preferredProducts || [],
        convertedCustomerId: newCustomer.id,
        createdAt: new Date().toISOString().split('T')[0],
        internalNotes: [
          {
            id: `note-${Date.now()}`,
            text: 'تمت إضافة المنشأة واعتمادها كعميل جملة وشراكة B2B عبر سجل العملاء.',
            author: 'الإدارة',
            date: new Date().toISOString().split('T')[0]
          }
        ]
      };
      setB2bRequests(prev => [b2bLead, ...(prev || [])]);

      if (typeof fetch !== 'undefined') {
        fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customers: [newCustomer],
            b2bRequests: [b2bLead]
          })
        }).catch(() => { });
      }
    } else {
      if (typeof fetch !== 'undefined') {
        fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customers: [newCustomer]
          })
        }).catch(() => { });
      }
    }

    return newCustomer;
  };

  const updateCustomer = (id, updatedFields) => {
    let updatedCust = null;
    setCustomers(prev =>
      prev.map(c => {
        if (c.id === id) {
          const isB2B = updatedFields.isB2B !== undefined ? Boolean(updatedFields.isB2B) : Boolean(c.isB2B);
          const company = updatedFields.companyName !== undefined ? updatedFields.companyName : (c.companyName || '');
          const contact = updatedFields.contactName !== undefined ? updatedFields.contactName : (c.contactName || c.name || '');

          let computedName = updatedFields.name !== undefined ? updatedFields.name : c.name;
          if (isB2B && (company || contact)) {
            computedName = company ? (contact ? `${company} (${contact})` : company) : contact;
          }

          updatedCust = {
            ...c,
            ...updatedFields,
            name: computedName,
            companyName: company,
            contactName: contact,
            isB2B
          };
          return updatedCust;
        }
        return c;
      })
    );

    // If B2B, ensure lead in b2bRequests is also updated
    if (updatedFields.isB2B || updatedCust?.isB2B) {
      setB2bRequests(prev => {
        const existing = (prev || []).find(l => l.convertedCustomerId === id || (l.refCode && l.refCode === updatedCust?.b2bRefCode) || (l.phone && l.phone === updatedCust?.phone));
        if (existing) {
          return prev.map(l => (l.id === existing.id ? {
            ...l,
            companyName: updatedCust?.companyName || updatedCust?.name || l.companyName,
            contactName: updatedCust?.contactName || updatedCust?.name || l.contactName,
            phone: updatedCust?.phone || l.phone,
            email: updatedCust?.email || l.email,
            city: updatedCust?.city || l.city,
            branch: updatedCust?.address || l.branch,
            notes: updatedCust?.notes || l.notes,
            preferredProducts: updatedCust?.preferredProducts || l.preferredProducts || []
          } : l));
        } else if (updatedFields.isB2B) {
          const newLead = {
            id: `lead-${Date.now()}`,
            refCode: updatedCust?.b2bRefCode || `B2B-${Math.floor(1000 + Math.random() * 9000)}`,
            companyName: updatedCust?.companyName || updatedCust?.name || 'منشأة جديدة',
            contactName: updatedCust?.contactName || updatedCust?.name || '',
            phone: normalizePhone(updatedCust?.phone || ''),
            email: updatedCust?.email || '',
            city: updatedCust?.city || 'القاهرة',
            branch: updatedCust?.address || '',
            businessType: updatedCust?.businessType || 'specialty_cafe',
            monthlyVolume: updatedCust?.monthlyVolume || '25 - 50 كجم شهرياً',
            status: 'contracted',
            isRead: true,
            notes: updatedCust?.notes || '',
            preferredProducts: updatedCust?.preferredProducts || [],
            convertedCustomerId: id,
            createdAt: new Date().toISOString().split('T')[0]
          };
          return [newLead, ...(prev || [])];
        }
        return prev;
      });
    }

    if (typeof fetch !== 'undefined' && updatedCust) {
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customers: [updatedCust] })
      }).catch(() => { });
    }

    return updatedCust;
  };

  const deleteCustomer = (id) => {
    setCustomers(prev => {
      const filtered = (prev || []).filter(c => c.id !== id && String(c.id) !== String(id));
      try {
        localStorage.setItem('caturra_eg_customers', JSON.stringify(filtered));
      } catch (e) { }
      return filtered;
    });

    // Also remove or unlink corresponding B2B lead if converted
    setB2bRequests(prev => (prev || []).filter(l => l.convertedCustomerId !== id && String(l.convertedCustomerId) !== String(id)));

    if (typeof fetch !== 'undefined') {
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deletedCustomerId: id })
      }).catch(() => { });
    }

    return true;
  };

  const settleCustomerDebt = (customerId, amountPaid, paymentMethod = 'cash', notes = '', invoiceId = null, accountId = null) => {
    const paid = Number(amountPaid);
    if (paid <= 0) return;

    // 1. Locate target invoice if invoiceId provided
    const targetInvoice = invoiceId
      ? (invoices || []).find(inv => String(inv.id) === String(invoiceId) || String(inv.invoiceNumber) === String(invoiceId))
      : null;

    // 2. Identify target customer through all available identifiers
    const targetCustomer = (customers || []).find(c => {
      if (customerId && (c.id === customerId || String(c.id) === String(customerId))) return true;
      if (targetInvoice?.customerId && (c.id === targetInvoice.customerId || String(c.id) === String(targetInvoice.customerId))) return true;
      if (c.phone) {
        const normCPhone = normalizePhone(c.phone);
        if (targetInvoice?.customerPhone && normCPhone === normalizePhone(targetInvoice.customerPhone)) return true;
      }
      if (c.name) {
        const normCName = normalizeArabic(c.name);
        if (targetInvoice?.customerName && normCName === normalizeArabic(targetInvoice.customerName) && normCName !== normalizeArabic('عميل صالة نقدي')) return true;
      }
      return false;
    });

    const resolvedCustomerId = targetCustomer?.id || targetInvoice?.customerId || (customerId && !String(customerId).startsWith('cust-temp') ? customerId : null);
    const custName = targetCustomer?.name || targetInvoice?.customerName || 'العميل';
    const custPhone = targetCustomer?.phone || targetInvoice?.customerPhone || '';

    // 3. Update Customer: deduct paid amount from debt immediately
    setCustomers(prev => {
      let customerFound = false;
      const updated = prev.map(c => {
        const isMatch =
          (resolvedCustomerId && (c.id === resolvedCustomerId || String(c.id) === String(resolvedCustomerId))) ||
          (custPhone && normalizePhone(c.phone) === normalizePhone(custPhone) && custPhone !== '') ||
          (custName && normalizeArabic(c.name) === normalizeArabic(custName) && normalizeArabic(custName) !== normalizeArabic('عميل صالة نقدي'));

        if (isMatch) {
          customerFound = true;
          const currentDebt = Number(c.debt) || 0;
          const newDebt = Math.max(0, Math.round((currentDebt - paid) * 100) / 100);
          return {
            ...c,
            debt: newDebt
          };
        }
        return c;
      });

      if (!customerFound && custName && custName !== 'عميل صالة نقدي') {
        const newCust = {
          id: resolvedCustomerId || `cust-${Date.now()}`,
          name: custName,
          phone: custPhone,
          email: '',
          city: 'القاهرة',
          address: '',
          notes: 'تم إنشاؤه تلقائياً عند سداد مديونية فاتورة',
          debt: 0,
          totalSpent: Number(targetInvoice?.total || paid),
          totalOrders: 1,
          createdAt: new Date().toISOString().split('T')[0]
        };
        const finalCusts = [newCust, ...updated];
        try {
          localStorage.setItem('caturra_eg_customers', JSON.stringify(finalCusts));
        } catch (e) { }
        return finalCusts;
      }

      try {
        localStorage.setItem('caturra_eg_customers', JSON.stringify(updated));
      } catch (e) { }
      return updated;
    });

    // 4. Update Invoices: Settle target invoice first, then distribute remainder to other unpaid invoices of this customer
    // IMPORTANT: remainingToSettle is declared strictly INSIDE the setInvoices updater to avoid React StrictMode double-execution reset
    setInvoices(prev => {
      let remainingToSettle = paid;

      // Step A: settle direct target invoice if specified
      const stepAInvoices = prev.map(inv => {
        const isDirect = (invoiceId && (String(inv.id) === String(invoiceId) || String(inv.invoiceNumber) === String(invoiceId))) ||
          (targetInvoice && (String(inv.id) === String(targetInvoice.id) || String(inv.invoiceNumber) === String(targetInvoice.invoiceNumber)));

        const curRemaining = (inv.remainingDebt !== undefined && inv.remainingDebt !== null)
          ? Number(inv.remainingDebt)
          : Math.max(0, Number(inv.total || 0) - Number(inv.paidAmount || 0));

        if (isDirect && curRemaining > 0 && remainingToSettle > 0) {
          const settlement = Math.min(curRemaining, remainingToSettle);
          remainingToSettle -= settlement;
          const newRemaining = Math.max(0, Math.round((curRemaining - settlement) * 100) / 100);
          const newPaid = Math.round((Number(inv.paidAmount || 0) + settlement) * 100) / 100;
          return {
            ...inv,
            customerId: inv.customerId || resolvedCustomerId || inv.customerId,
            paidAmount: newPaid,
            remainingDebt: newRemaining,
            status: newRemaining === 0 ? 'paid' : (newPaid > 0 ? 'partial' : inv.status)
          };
        }
        return inv;
      });

      // Step B: if money remains or no direct invoiceId was passed, settle other invoices for this customer
      let finalInvoices = stepAInvoices;
      if (remainingToSettle > 0) {
        finalInvoices = stepAInvoices.map(inv => {
          const isDirect = (invoiceId && (String(inv.id) === String(invoiceId) || String(inv.invoiceNumber) === String(invoiceId))) ||
            (targetInvoice && (String(inv.id) === String(targetInvoice.id) || String(inv.invoiceNumber) === String(targetInvoice.invoiceNumber)));
          if (isDirect) return inv;

          const belongsToCust =
            (resolvedCustomerId && (String(inv.customerId) === String(resolvedCustomerId))) ||
            (custPhone && normalizePhone(inv.customerPhone) === normalizePhone(custPhone) && custPhone !== '') ||
            (custName && normalizeArabic(inv.customerName) === normalizeArabic(custName) && normalizeArabic(custName) !== normalizeArabic('عميل صالة نقدي'));

          const curRemaining = (inv.remainingDebt !== undefined && inv.remainingDebt !== null)
            ? Number(inv.remainingDebt)
            : Math.max(0, Number(inv.total || 0) - Number(inv.paidAmount || 0));

          if (belongsToCust && curRemaining > 0 && remainingToSettle > 0) {
            const settlement = Math.min(curRemaining, remainingToSettle);
            remainingToSettle -= settlement;
            const newRemaining = Math.max(0, Math.round((curRemaining - settlement) * 100) / 100);
            const newPaid = Math.round((Number(inv.paidAmount || 0) + settlement) * 100) / 100;
            return {
              ...inv,
              customerId: inv.customerId || resolvedCustomerId || inv.customerId,
              paidAmount: newPaid,
              remainingDebt: newRemaining,
              status: newRemaining === 0 ? 'paid' : (newPaid > 0 ? 'partial' : inv.status)
            };
          }
          return inv;
        });
      }

      try {
        localStorage.setItem('caturra_eg_invoices', JSON.stringify(finalInvoices));
      } catch (e) {
        console.warn('Failed to save invoices to localStorage synchronously:', e);
      }
      return finalInvoices;
    });

    // 4.1. Also keep activeInvoiceForModal in sync if currently open
    setActiveInvoiceForModal(prevModal => {
      if (!prevModal) return null;
      const isMatch = (invoiceId && (String(prevModal.id) === String(invoiceId) || String(prevModal.invoiceNumber) === String(invoiceId))) ||
        (targetInvoice && (String(prevModal.id) === String(targetInvoice.id) || String(prevModal.invoiceNumber) === String(targetInvoice.invoiceNumber)));
      if (isMatch) {
        const curRemaining = (prevModal.remainingDebt !== undefined && prevModal.remainingDebt !== null)
          ? Number(prevModal.remainingDebt)
          : Math.max(0, Number(prevModal.total || 0) - Number(prevModal.paidAmount || 0));
        const settlement = Math.min(curRemaining, paid);
        const newRemaining = Math.max(0, Math.round((curRemaining - settlement) * 100) / 100);
        const newPaid = Math.round((Number(prevModal.paidAmount || 0) + settlement) * 100) / 100;
        return {
          ...prevModal,
          paidAmount: newPaid,
          remainingDebt: newRemaining,
          status: newRemaining === 0 ? 'paid' : (newPaid > 0 ? 'partial' : prevModal.status)
        };
      }
      return prevModal;
    });

    // 5. Deposit into Treasury Account
    let targetAccountId = accountId;
    if (!targetAccountId || !treasuryAccounts.some(a => a.id === targetAccountId)) {
      if (paymentMethod === 'instapay') {
        targetAccountId = treasuryAccounts.find(a => a.type === 'instapay')?.id || 'acc-instapay-main';
      } else if (paymentMethod === 'wallet') {
        targetAccountId = treasuryAccounts.find(a => a.type === 'wallet')?.id || 'acc-wallet-vodafone';
      } else if (paymentMethod === 'bank') {
        targetAccountId = treasuryAccounts.find(a => a.type === 'bank')?.id || treasuryAccounts[0]?.id || 'acc-cash-main';
      } else {
        targetAccountId = treasuryAccounts.find(a => a.type === 'cash')?.id || 'acc-cash-main';
      }
    }

    const now = new Date();
    const formattedDate = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const invNumberLabel = targetInvoice?.invoiceNumber || (invoiceId ? String(invoiceId) : '');

    const debtTx = {
      id: `tx-cust-debt-${Date.now()}`,
      date: formattedDate,
      type: 'deposit',
      fromAccountId: null,
      toAccountId: targetAccountId,
      amount: paid,
      category: 'تحصيل مديونية عميل',
      description: `تحصيل مديونية عميل: ${custName}${invNumberLabel ? ` (فاتورة #${invNumberLabel})` : ''}${notes ? ` - ${notes}` : ''}`,
      performedBy: currentUser?.fullName || 'مسؤول الخزينة',
      customerId: resolvedCustomerId,
      invoiceId: targetInvoice?.id || invoiceId || null
    };

    setTreasuryTransactions(prev => [debtTx, ...prev]);
  };

  // 6. EXPENSES MANAGEMENT
  const addExpense = (expenseData) => {
    const targetAccountId = expenseData.accountId || (treasuryAccounts[0]?.id || 'acc-cash-main');
    const targetAccount = treasuryAccounts.find(a => a.id === targetAccountId);

    const newExpense = {
      id: `exp-${Date.now()}`,
      date: expenseData.date || new Date().toISOString().split('T')[0],
      ...expenseData,
      accountId: targetAccountId,
      accountName: targetAccount ? targetAccount.name : '',
      amount: Number(expenseData.amount)
    };
    setExpenses(prev => [newExpense, ...prev]);

    // Automatically create a withdrawal transaction in treasury to deduct the balance
    if (targetAccountId && targetAccountId !== 'none') {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      const newTx = {
        id: `tx-exp-${newExpense.id}`,
        date: `${newExpense.date} ${timeStr}`,
        type: 'withdrawal',
        fromAccountId: targetAccountId,
        toAccountId: null,
        amount: Number(newExpense.amount),
        description: `مصروف تشغيلي (${newExpense.category}): ${newExpense.title}`,
        performedBy: currentUser?.fullName || 'مسؤول الحسابات',
        expenseId: newExpense.id
      };
      setTreasuryTransactions(prev => [newTx, ...prev]);
    }

    return newExpense;
  };

  const deleteExpense = (id) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    // Automatically delete associated treasury transaction so balance is restored
    setTreasuryTransactions(prev => prev.filter(tx => tx.expenseId !== id && tx.id !== `tx-exp-${id}`));
  };

  const updateExpense = (id, updatedFields) => {
    setExpenses(prev => {
      const updated = prev.map(e => (e.id === id ? { ...e, ...updatedFields } : e));
      try {
        localStorage.setItem('caturra_eg_expenses', JSON.stringify(updated));
      } catch (err) { }
      return updated;
    });

    if (updatedFields.accountId !== undefined) {
      setTreasuryTransactions(prev => {
        const newAccId = updatedFields.accountId === 'none' ? null : updatedFields.accountId;
        const exists = prev.some(tx => tx.expenseId === id || tx.id === `tx-exp-${id}`);
        if (exists) {
          return prev.map(tx => {
            if (tx.expenseId === id || tx.id === `tx-exp-${id}`) {
              return {
                ...tx,
                fromAccountId: newAccId
              };
            }
            return tx;
          });
        }
        return prev;
      });
    }
  };

  // 6.5 TREASURY & WALLETS MANAGEMENT
  const addTreasuryAccount = (accountData) => {
    const newAcc = {
      id: `acc-${Date.now()}`,
      openingBalance: Number(accountData.openingBalance || 0),
      isDefault: false,
      color: accountData.color || (accountData.type === 'cash' ? '#059669' : accountData.type === 'instapay' ? '#ea580c' : '#0284c7'),
      ...accountData
    };
    setTreasuryAccounts(prev => [...prev, newAcc]);
    return newAcc;
  };

  const updateTreasuryAccount = (id, updatedData) => {
    setTreasuryAccounts(prev =>
      prev.map(acc => (acc.id === id ? { ...acc, ...updatedData, openingBalance: updatedData.openingBalance !== undefined ? Number(updatedData.openingBalance) : acc.openingBalance } : acc))
    );
  };

  const deleteTreasuryAccount = (id) => {
    setTreasuryAccounts(prev => prev.filter(acc => acc.id !== id));
  };

  const addTreasuryTransaction = (txData) => {
    const now = new Date();
    const formattedDate = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newTx = {
      id: `tx-${Date.now()}`,
      date: formattedDate,
      performedBy: currentUser?.fullName || 'مسؤول الخزينة',
      ...txData,
      amount: Number(txData.amount || 0)
    };
    setTreasuryTransactions(prev => [newTx, ...prev]);
    return newTx;
  };

  const deleteTreasuryTransaction = (id) => {
    setTreasuryTransactions(prev => prev.filter(tx => tx.id !== id));
  };

  // Auto-sync existing purchases and invoices to treasury transactions so all cash movements are unified in the ledger
  useEffect(() => {
    setTreasuryTransactions(prevTx => {
      let updated = [...prevTx];
      let hasChanges = false;

      // 0. Purge any transactions belonging to cancelled invoices
      const cancelledInvoiceIds = new Set(
        invoices.filter(i => i.status === 'cancelled' || i.trackingStatus === 'cancelled').map(i => i.id)
      );
      const beforeLen = updated.length;
      updated = updated.filter(tx => !tx.invoiceId || !cancelledInvoiceIds.has(tx.invoiceId));
      if (updated.length !== beforeLen) {
        hasChanges = true;
      }

      // 1. Sync Purchases
      purchases.forEach(pur => {
        const paid = Number(pur.paidAmount || 0);
        if (paid > 0) {
          const hasTx = updated.some(tx => tx.purchaseId === pur.id || tx.id === `tx-pur-${pur.id}`);
          if (!hasTx) {
            hasChanges = true;
            updated.push({
              id: `tx-pur-${pur.id}`,
              date: pur.date ? `${pur.date} 10:00` : '2026-10-01 10:00',
              type: 'withdrawal',
              fromAccountId: pur.paymentMethod === 'instapay' ? 'acc-instapay-main' : (pur.paymentMethod === 'wallet' ? 'acc-wallet-vodafone' : 'acc-cash-main'),
              toAccountId: null,
              amount: paid,
              category: 'مشتريات وتوريدات',
              description: `سداد مشتريات: فاتورة توريد #${pur.invoiceNumber} - المورد: ${pur.supplierName}`,
              performedBy: 'مسؤول المشتريات',
              purchaseId: pur.id
            });
          }
        }
      });

      // 2. Sync Invoices (Sales & Down Payments)
      invoices.forEach(inv => {
        if (inv.status === 'cancelled') return;
        const paid = Number(inv.paidAmount || 0);
        if (paid <= 0) return;

        if (inv.paymentMethod === 'split' && inv.splitPayment) {
          const splitCash = Number(inv.splitPayment.cash || 0);
          const splitInsta = Number(inv.splitPayment.instapay || 0);
          if (splitCash > 0 && !updated.some(tx => tx.id === `tx-inv-${inv.id}-cash`)) {
            hasChanges = true;
            updated.push({
              id: `tx-inv-${inv.id}-cash`,
              date: inv.date || '2026-10-01 12:00',
              type: 'deposit',
              fromAccountId: null,
              toAccountId: 'acc-cash-main',
              amount: splitCash,
              category: 'مبيعات نقطة البيع (كاش)',
              description: `مبيعات فاتورة #${inv.invoiceNumber} (جزء كاش) - العميل: ${inv.customerName || 'عميل نقدي'}`,
              performedBy: inv.cashierName || 'الكاشير',
              invoiceId: inv.id,
              customerId: inv.customerId
            });
          }
          if (splitInsta > 0 && !updated.some(tx => tx.id === `tx-inv-${inv.id}-insta`)) {
            hasChanges = true;
            updated.push({
              id: `tx-inv-${inv.id}-insta`,
              date: inv.date || '2026-10-01 12:00',
              type: 'deposit',
              fromAccountId: null,
              toAccountId: 'acc-instapay-main',
              amount: splitInsta,
              category: 'مبيعات إنستاباي',
              description: `مبيعات فاتورة #${inv.invoiceNumber} (جزء إنستاباي) - العميل: ${inv.customerName || 'عميل نقدي'}`,
              performedBy: inv.cashierName || 'الكاشير',
              invoiceId: inv.id,
              customerId: inv.customerId
            });
          }
        } else {
          const hasTx = updated.some(tx => tx.invoiceId === inv.id || tx.id === `tx-inv-${inv.id}` || tx.id === `tx-inv-down-${inv.id}`);
          if (!hasTx) {
            hasChanges = true;
            const isDeferred = inv.paymentMethod === 'deferred' || inv.paymentMethod === 'credit';
            const depositAmt = isDeferred ? Number(inv.downPayment !== undefined ? inv.downPayment : (inv.initialPaidAmount || paid)) : paid;
            const targetAcc = inv.paymentMethod === 'instapay'
              ? 'acc-instapay-main'
              : (inv.paymentMethod === 'wallet' ? 'acc-wallet-vodafone' : 'acc-cash-main');

            if (depositAmt > 0) {
              updated.push({
                id: `tx-inv-${inv.id}`,
                date: inv.date || '2026-10-01 12:00',
                type: 'deposit',
                fromAccountId: null,
                toAccountId: targetAcc,
                amount: depositAmt,
                category: isDeferred ? 'دفعة مقدمة - فاتورة آجلة' : (inv.paymentMethod === 'instapay' ? 'مبيعات إنستاباي' : inv.paymentMethod === 'wallet' ? 'مبيعات محفظة إلكترونية' : 'مبيعات نقطة البيع (كاش)'),
                description: isDeferred
                  ? `دفعة مقدمة لفاتورة آجلة #${inv.invoiceNumber} - العميل: ${inv.customerName || 'عميل نقدي'}`
                  : `مبيعات فاتورة #${inv.invoiceNumber} - العميل: ${inv.customerName || 'عميل نقدي'}`,
                performedBy: inv.cashierName || 'الكاشير',
                invoiceId: inv.id,
                customerId: inv.customerId
              });
            }
          }
        }
      });

      // 3. Sync Operating Expenses (Non-waste expenses with actual cash withdrawals)
      expenses.forEach(exp => {
        const amt = Number(exp.amount || 0);
        if (amt <= 0) return;
        const isLoss = exp.category === 'هالك وتالف مخزون' ||
          exp.category === 'عجز جرد مخزني' ||
          exp.category === 'هالك ومخزون' ||
          exp.referenceType === 'stock_waste' ||
          exp.referenceType === 'inventory_audit_deficit' ||
          exp.accountId === 'none';
        if (isLoss) return; // Do not withdraw cash for book inventory loss

        const hasTx = updated.some(tx => tx.expenseId === exp.id || tx.id === `tx-exp-${exp.id}`);
        if (!hasTx) {
          hasChanges = true;
          const fromAcc = exp.accountId || (exp.category === 'تسويق' ? 'acc-instapay-main' : (treasuryAccounts[0]?.id || 'acc-cash-main'));
          updated.push({
            id: `tx-exp-${exp.id}`,
            date: exp.date ? `${exp.date} 11:00` : '2026-10-01 11:00',
            type: 'withdrawal',
            fromAccountId: fromAcc,
            toAccountId: null,
            amount: amt,
            category: `مصروف تشغيلي (${exp.category})`,
            description: `مصروف تشغيلي (${exp.category}): ${exp.title}`,
            performedBy: 'مسؤول الحسابات',
            expenseId: exp.id
          });
        }
      });

      return hasChanges ? updated : prevTx;
    });
  }, [purchases, invoices, expenses, treasuryAccounts]);

  // Helper: Real-time Account Balance Calculation (Pure & Unified)
  const getTreasuryAccountBalance = useCallback((accountId) => {
    const acc = treasuryAccounts.find(a => a.id === accountId);
    if (!acc) return 0;
    const opening = Number(acc.openingBalance || 0);

    // Sum all deposits and incoming transfers (excluding any duplicate mock opening deposits)
    const txIn = treasuryTransactions
      .filter(tx => tx.toAccountId === acc.id && (tx.type === 'deposit' || tx.type === 'transfer') && tx.id !== 'tx-1' && tx.id !== 'tx-2' && tx.category !== 'رصيد افتتاحي')
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

    // Sum all withdrawals and outgoing transfers
    const txOut = treasuryTransactions
      .filter(tx => tx.fromAccountId === acc.id && (tx.type === 'withdrawal' || tx.type === 'transfer'))
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

    return opening + txIn - txOut;
  }, [treasuryAccounts, treasuryTransactions]);

  // 7. USERS & ROLES MANAGEMENT
  const addUser = (userData) => {
    const rawPass = userData.password ? String(userData.password).trim() : '';
    const passwordHash = rawPass ? hashPasswordSync(rawPass) : (userData.passwordHash || '');

    const isFirstUser = users.length === 0;
    const isOwner = userData.isOwner || isFirstUser;

    const fullPermissions = {
      products: true,
      pos: true,
      invoices: true,
      customers: true,
      purchases: true,
      suppliers: true,
      sales: true,
      warehouse: true,
      accounts: true,
      treasury: true,
      academy: true,
      settings: true,
      users: true
    };

    const newUser = {
      id: `usr-${Date.now()}`,
      isOwner: isOwner,
      role: isOwner ? 'owner' : (userData.role || 'كاشير مبيعات'),
      roleLabel: isOwner ? 'المالك والمشرف العام' : (userData.roleLabel || userData.role || 'كاشير مبيعات'),
      status: 'active',
      passwordHash: passwordHash,
      avatar: isOwner ? '👑' : (userData.avatar || (userData.role?.includes('مدير') || userData.role === 'manager' ? '👨‍💼' : '🧑‍💻')),
      permissions: isOwner ? fullPermissions : {
        products: true,
        pos: true,
        invoices: true,
        customers: true,
        purchases: false,
        suppliers: false,
        sales: false,
        warehouse: false,
        accounts: false,
        treasury: false,
        academy: false,
        settings: false,
        users: false,
        ...(userData.permissions || {})
      },
      ...userData
    };
    delete newUser.password;

    setUsers(prev => [...prev, newUser]);
    return newUser;
  };

  const updateUser = (id, updatedFields) => {
    setUsers(prev =>
      prev.map(u => {
        if (u.id === id) {
          const updated = { ...u, ...updatedFields };
          if (updatedFields.password && updatedFields.password.trim() !== '' && updatedFields.password !== '••••••••') {
            updated.passwordHash = hashPasswordSync(updatedFields.password.trim());
          }
          if (updatedFields.role && !updatedFields.roleLabel) {
            updated.roleLabel = updatedFields.role;
          }

          if (u.isOwner) {
            return {
              ...updated,
              isOwner: true,
              role: 'owner'
            };
          }
          return updated;
        }
        return u;
      })
    );
  };

  const deleteUser = (id) => {
    const targetUser = users.find(u => u.id === id);
    const ownersCount = users.filter(u => u.isOwner).length;
    if (targetUser?.isOwner && ownersCount <= 1) {
      alert('عذراً، يجب أن يتبقى مالك رئيسي واحد على الأقل في المنظومة!');
      return false;
    }
    setUsers(prev => prev.filter(u => u.id !== id));
    return true;
  };

  // 8. PROMO & INVENTORY ALERTS
  const applyPromoDiscount = (productId, discountPercent) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id === productId) {
          const discountVal = (p.sellingPrice * (discountPercent / 100));
          const newPrice = Math.round(p.sellingPrice - discountVal);
          return {
            ...p,
            sellingPrice: newPrice,
            hasPromo: true,
            promoDiscount: discountPercent
          };
        }
        return p;
      })
    );
  };

  const recordStockWaste = (batchId, quantity, reason) => {
    const qty = Number(quantity);
    if (!qty || qty <= 0) return;

    let targetBatch = null;
    setBatches(prev =>
      prev.map(b => {
        if (b.id === batchId) {
          targetBatch = b;
          const newQty = Math.max(0, Number((b.quantity - qty).toFixed(2)));
          const isWeight = b.unitType === 'weight';
          const newGram = isWeight
            ? Math.max(0, (b.quantityGram !== undefined ? b.quantityGram : b.quantity * 1000) - (qty * 1000))
            : undefined;

          // Also reduce product stock
          setProducts(prods =>
            prods.map(p => {
              if (p.id === b.productId) {
                const newStock = Math.max(0, Number((p.stock - qty).toFixed(2)));
                return {
                  ...p,
                  stock: newStock,
                  stockGram: isWeight ? Math.max(0, (p.stockGram !== undefined ? p.stockGram : p.stock * 1000) - (qty * 1000)) : undefined
                };
              }
              return p;
            })
          );

          return {
            ...b,
            quantity: newQty,
            quantityGram: newGram,
            status: newQty <= 0 ? 'depleted' : b.status,
            wasteReason: reason,
            lastWasteDate: new Date().toISOString().split('T')[0]
          };
        }
        return b;
      })
    );

    // Record financial loss in operating expenses (non-cash ledger entry)
    const currentBatch = batches.find(b => b.id === batchId) || targetBatch;
    if (currentBatch) {
      const prod = products.find(p => p.id === currentBatch.productId);
      const unitCost = Number(currentBatch.costPrice || prod?.costPrice || (prod?.unitType === 'weight' ? prod?.costPerKg : 0) || 0);
      const wasteValue = Math.round(qty * unitCost);

      if (wasteValue > 0) {
        const wasteExpense = {
          id: `exp-waste-${Date.now()}`,
          title: `هالك وتالف مخزون: ${currentBatch.productName} (${qty} ${currentBatch.unitType === 'weight' ? 'كجم' : 'وحدة'})`,
          category: 'هالك وتالف مخزون',
          amount: wasteValue,
          accountId: 'none', // قيد دفتري بدون سحب كاش إضافي من الخزينة
          accountName: 'قيد خسائر مخزنية (دفتري)',
          date: new Date().toISOString().split('T')[0],
          notes: `تشغيلة: ${currentBatch.batchCode} | السبب: ${reason || 'غير محدد'} | تكلفة الوحدة: ${unitCost.toLocaleString()} ج.م`,
          referenceId: currentBatch.id,
          referenceType: 'stock_waste'
        };
        setExpenses(prev => [wasteExpense, ...prev]);
      }
    }
  };

  const reconcileInventoryAudit = (auditItems, meta = {}) => {
    if (!Array.isArray(auditItems) || auditItems.length === 0) return;

    // 1. Update product stock levels
    setProducts(prevProducts =>
      prevProducts.map(p => {
        const item = auditItems.find(a => a.id === p.id);
        if (item && item.actualStock !== undefined && item.actualStock !== null) {
          const newQty = Math.max(0, Number(item.actualStock));
          const isWeight = p.unitType === 'weight';
          return {
            ...p,
            stock: newQty,
            stockGram: isWeight ? newQty * 1000 : undefined
          };
        }
        return p;
      })
    );

    // 2. Synchronize single batches for updated products
    setBatches(prevBatches =>
      prevBatches.map(b => {
        const item = auditItems.find(a => a.id === b.productId);
        if (item && item.actualStock !== undefined && item.actualStock !== null) {
          const productBatches = prevBatches.filter(pb => pb.productId === b.productId);
          if (productBatches.length === 1) {
            const newQty = Math.max(0, Number(item.actualStock));
            const isWeight = b.unitType === 'weight';
            return {
              ...b,
              quantity: newQty,
              quantityGram: isWeight ? newQty * 1000 : undefined,
              status: newQty <= 0 ? 'depleted' : b.status
            };
          }
        }
        return b;
      })
    );

    // 3. Post audit deficit losses to expenses
    const deficitItems = auditItems.filter(i => (Number(i.diff) || 0) < 0 && (Number(i.diffValue) || 0) !== 0);
    const totalDeficitLoss = Math.abs(deficitItems.reduce((sum, i) => sum + (Number(i.diffValue) || 0), 0));

    if (totalDeficitLoss > 0) {
      const summaryNotes = deficitItems
        .map(i => `${i.name}: عجز ${Math.abs(i.diff)} (${Math.abs(i.diffValue).toLocaleString()} ج.م)`)
        .slice(0, 4)
        .join(' | ');

      const auditExpense = {
        id: `exp-audit-${Date.now()}`,
        title: `عجز جرد مخزني (${deficitItems.length} صنف عجز)`,
        category: 'عجز جرد مخزني',
        amount: Math.round(totalDeficitLoss),
        accountId: 'none', // قيد دفتري
        accountName: 'تسوية عجز جرد (دفتري)',
        date: new Date().toISOString().split('T')[0],
        notes: `المسؤول: ${meta.auditorName || currentUser?.fullName || 'مسؤول الجرد'} | ${summaryNotes}${deficitItems.length > 4 ? ` (وإجمالي ${deficitItems.length} صنف)` : ''}`,
        referenceType: 'inventory_audit_deficit'
      };
      setExpenses(prev => [auditExpense, ...prev]);
    }
  };

  const importInventoryBatch = (items, options = {}) => {
    const { removeMissing = true } = options;
    if (!Array.isArray(items) || items.length === 0) return { updatedCount: 0, addedCount: 0, removedCount: 0, total: 0 };

    const existing = [...(products || [])];
    const currentCats = [...(categories || [])];
    const extraCats = [];

    const resolveCategory = (rawCat, rawCatLabel, isWeightItem) => {
      const candidate = (rawCat || '').trim();
      const label = (rawCatLabel || candidate).trim();
      if (!candidate && !label) {
        return { id: isWeightItem ? 'specialty' : 'tools', name: '' };
      }

      const normCandidate = normalizeArabic(candidate || label);
      const foundExisting = [...currentCats, ...extraCats].find(
        c => c.id === candidate || normalizeArabic(c.name) === normCandidate
      );
      if (foundExisting) {
        return { id: foundExisting.id, name: foundExisting.name };
      }

      // Known standard aliases
      const stdIds = new Set(['specialty', 'classic_blends', 'fermented', 'tools', 'accessories', 'boxes']);
      if (stdIds.has(candidate)) {
        return { id: candidate, name: label || candidate };
      }

      // Genuine custom category from uploaded sheet: auto-register so Storefront & Admin display it
      const newCatId = `cat-import-${Date.now()}-${extraCats.length}`;
      extraCats.push({ id: newCatId, name: label || candidate });
      return { id: newCatId, name: label || candidate };
    };

    const findMatch = (it, list) => {
      if (it.sku) {
        const cleanSku = String(it.sku).trim().toLowerCase();
        const m = list.find(p => p.sku && String(p.sku).trim().toLowerCase() === cleanSku);
        if (m) return m;
      }
      if (it.name) {
        const normItName = normalizeArabic(it.name);
        const m = list.find(p => p.name && normalizeArabic(p.name) === normItName);
        if (m) return m;
      }
      if (it.nameEn) {
        const cleanEn = String(it.nameEn).trim().toLowerCase();
        const m = list.find(p => p.nameEn && String(p.nameEn).trim().toLowerCase() === cleanEn);
        if (m) return m;
      }
      return null;
    };

    let updatedCount = 0;
    let addedCount = 0;
    const addedProducts = [];
    const updatedMap = new Map();
    const batchSeen = [];

    items.forEach((it, idx) => {
      const match = findMatch(it, existing) || findMatch(it, batchSeen);
      const isWeight = match
        ? ((it.unitType && it.unitType === 'piece') ? false : (match.unitType === 'weight' || it.unitType === 'weight'))
        : (it.unitType !== 'piece');

      const stockVal = it.stock !== undefined ? Number(it.stock) : (match?.stock || 0);
      const hasInputCost = it.costPrice !== undefined && it.costPrice > 0;
      const hasInputPrice = it.sellingPrice !== undefined && it.sellingPrice > 0;
      const hasInputWholesale = it.wholesalePrice !== undefined && it.wholesalePrice > 0;

      const costVal = hasInputCost
        ? Number(it.costPrice)
        : (isWeight ? (match?.costPerKg || (match?.costPrice ? match.costPrice * 4 : 0)) : (match?.costPrice || 0)) || 0;
      const priceVal = hasInputPrice
        ? Number(it.sellingPrice)
        : (isWeight ? (match?.pricePerKg || (match?.sellingPrice ? match.sellingPrice * 4 : 0)) : (match?.sellingPrice || 0)) || 0;
      const wholesaleVal = hasInputWholesale
        ? Number(it.wholesalePrice)
        : (isWeight
          ? (match?.wholesalePricePerKg || Math.round(priceVal * 0.8))
          : (match?.wholesalePrice || Math.round(priceVal * 0.85))) || Math.round(priceVal * 0.8);

      if (match) {
        const prevTarget = updatedMap.get(match.id) || match;
        if (!updatedMap.has(match.id) && existing.some(e => e.id === match.id)) {
          updatedCount++;
        }
        const matchIsClassic = prevTarget.category === 'classic_blends' || prevTarget.category === 'coffee';
        const mergedProd = {
          ...prevTarget,
          sku: it.sku || prevTarget.sku,
          name: it.name || prevTarget.name,
          nameEn: it.nameEn || prevTarget.nameEn,
          unitType: isWeight ? 'weight' : 'piece',
          stock: stockVal,
          stockGram: isWeight ? stockVal * 1000 : 0,
          costPrice: isWeight ? Math.round(costVal / 4) : costVal,
          costPerKg: isWeight ? costVal : undefined,
          sellingPrice: isWeight ? Math.round(priceVal / 4) : priceVal,
          pricePerKg: isWeight ? priceVal : undefined,
          wholesalePrice: !isWeight ? wholesaleVal : undefined,
          wholesalePricePerKg: isWeight ? wholesaleVal : undefined,
          minStockAlert: it.minAlert || prevTarget.minStockAlert || 5,
          coffeeOrigin: it.origin ? { ...(prevTarget.coffeeOrigin || {}), country: it.origin } : prevTarget.coffeeOrigin,
          country: it.origin || prevTarget.country,
          origin: it.origin || prevTarget.origin,
          bagVariant: prevTarget.bagVariant || (matchIsClassic ? 'vertical' : 'landscape'),
          image: prevTarget.image || (matchIsClassic
            ? '/bags/bag_classic_blends.jpg'
            : (isWeight ? '/bags/bag_espresso_landscape.jpg' : '/caturra_ethiopia.jpg')),
          showInStore: prevTarget.showInStore !== false
        };
        updatedMap.set(match.id, mergedProd);
      } else {
        addedCount++;
        const resolvedCat = resolveCategory(it.category, it.rawCategory, isWeight);
        const isClassic = resolvedCat.id === 'classic_blends';
        const newProdId = `prod-import-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`;
        const newProduct = {
          id: newProdId,
          sku: it.sku || `CAT-${Math.floor(1000 + Math.random() * 9000)}`,
          barcode: `${Math.floor(622100000000 + Math.random() * 999999)}`,
          name: it.name || it.nameEn || 'صنف جديد',
          nameEn: it.nameEn || it.name || '',
          category: resolvedCat.id,
          categoryName: resolvedCat.name || undefined,
          unitType: isWeight ? 'weight' : 'piece',
          stock: stockVal,
          stockGram: isWeight ? stockVal * 1000 : 0,
          costPrice: isWeight ? Math.round(costVal / 4) : costVal,
          costPerKg: isWeight ? costVal : undefined,
          sellingPrice: isWeight ? Math.round(priceVal / 4) : priceVal,
          pricePerKg: isWeight ? priceVal : undefined,
          wholesalePrice: !isWeight ? wholesaleVal : undefined,
          wholesalePricePerKg: isWeight ? wholesaleVal : undefined,
          minStockAlert: it.minAlert || 5,
          salesCount: 0,
          notes: it.notes || '',
          flavorNotes: it.notes || '',
          country: it.origin || '',
          origin: it.origin || '',
          coffeeOrigin: it.origin ? { country: it.origin } : undefined,
          bagVariant: isClassic ? 'vertical' : 'landscape',
          image: isClassic
            ? '/bags/bag_classic_blends.jpg'
            : (isWeight ? '/bags/bag_espresso_landscape.jpg' : '/caturra_ethiopia.jpg'),
          showInStore: true,
          isImported: true
        };
        addedProducts.push(newProduct);
        batchSeen.push(newProduct);
        updatedMap.set(newProdId, newProduct);
      }
    });

    // Place newly added products cleanly in catalog; remove existing products missing from sheet if enabled
    const removedIds = new Set(
      removeMissing ? existing.filter(p => !updatedMap.has(p.id)).map(p => p.id) : []
    );
    const removedCount = removedIds.size;
    const mergedExisting = removeMissing
      ? existing.filter(p => updatedMap.has(p.id)).map(p => updatedMap.get(p.id))
      : existing.map(p => updatedMap.get(p.id) || p);
    const result = [...addedProducts.map(ap => updatedMap.get(ap.id) || ap), ...mergedExisting];

    if (extraCats.length > 0) {
      setCategories(prevCats => {
        const nextCats = [...(prevCats || []), ...extraCats];
        try {
          localStorage.setItem('caturra_eg_categories', JSON.stringify(nextCats));
        } catch { }
        return nextCats;
      });
    }

    setProducts(result);
    try {
      localStorage.setItem('caturra_eg_products', JSON.stringify(result));
    } catch { }

    // Update existing batches, drop batches of deleted products, and create batches for products without one
    const todayStr = new Date().toISOString().split('T')[0];
    const updatedBatches = (batches || [])
      .filter(b => !(removeMissing && b.productId && removedIds.has(b.productId)))
      .map(b => {
        const matchedProd = result.find(p =>
          p.id === b.productId ||
          (p.sku && b.sku && String(p.sku).trim().toLowerCase() === String(b.sku).trim().toLowerCase()) ||
          (p.name && b.productName && normalizeArabic(p.name) === normalizeArabic(b.productName))
        );
        if (matchedProd) {
          const isWeight = matchedProd.unitType === 'weight';
          const qty = Number(matchedProd.stock || 0);
          return {
            ...b,
            productId: matchedProd.id,
            productName: matchedProd.name,
            sku: matchedProd.sku || b.sku,
            unitType: matchedProd.unitType,
            quantity: qty,
            quantityGram: isWeight ? qty * 1000 : 0,
            costPrice: isWeight ? Number(matchedProd.costPerKg || 0) : Number(matchedProd.costPrice || 0),
            status: qty <= 0 ? 'depleted' : 'good'
          };
        }
        return b;
      });

    const batchProdIds = new Set(updatedBatches.map(b => b.productId).filter(Boolean));
    const batchProdNames = new Set(updatedBatches.map(b => b.productName ? normalizeArabic(b.productName) : '').filter(Boolean));
    const newBatches = result
      .filter(p => !batchProdIds.has(p.id) && !(p.name && batchProdNames.has(normalizeArabic(p.name))))
      .map((p, i) => {
        const isWeight = p.unitType === 'weight';
        const qty = Number(p.stock || 0);
        return {
          id: `bat-import-${Date.now()}-${i}`,
          productId: p.id,
          productName: p.name,
          sku: p.sku || '',
          batchCode: `BAT-${String(i + 1).padStart(3, '0')}-${Math.floor(100 + Math.random() * 900)}`,
          unitType: p.unitType || 'piece',
          entryDate: todayStr,
          expiryDate: p.expiryDate || '2028-01-01',
          quantity: qty,
          quantityGram: isWeight ? qty * 1000 : 0,
          costPrice: isWeight ? Number(p.costPerKg || 0) : Number(p.costPrice || 0),
          status: qty <= 0 ? 'depleted' : 'good'
        };
      });

    const nextBatches = [...newBatches, ...updatedBatches];
    setBatches(nextBatches);
    try {
      localStorage.setItem('caturra_eg_batches', JSON.stringify(nextBatches));
    } catch { }

    if (typeof fetch !== 'undefined') {
      fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-caturra-erp-auth': 'caturra_sec_token_v2'
        },
        body: JSON.stringify({ products: result, batches: nextBatches })
      }).catch(() => { });
    }

    return { updatedCount, addedCount, removedCount, total: items.length };
  };

  const updateContactInfo = (newInfo) => {
    setContactInfo(prev => ({ ...prev, ...newInfo }));
  };

  const resetContactInfo = () => {
    setContactInfo(initialContactInfo);
  };

  // Order & Shipping Tracking Status Actions
  const updateInvoiceTrackingStatus = (invoiceId, newStatus, note = '') => {
    if (newStatus === 'cancelled') {
      cancelInvoice(invoiceId);
      return;
    }

    const now = new Date();
    const formattedDate = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    let syncedInv = null;
    setInvoices(prev =>
      prev.map(inv => {
        if (inv.id === invoiceId) {
          const history = inv.trackingHistory || [
            {
              status: inv.trackingStatus || (inv.status === 'paid' ? 'delivered' : 'received'),
              time: inv.date,
              note: 'تم تسجيل الطلب في النظام'
            }
          ];

          const defaultNotes = {
            received: 'تم استلام وتأكيد الطلب في نظام المحمصة',
            processing: 'جاري فرز وتحميص حبوب البن والتغليف المفرغ من الهواء',
            shipped: 'تم تسليم الشحنة لشركة الشحن ومندوب التوصيل',
            delivered: 'تم توصيل الطلب بنجاح للعميل',
            cancelled: 'تم إلغاء الطلب من قبل الإدارة'
          };

          syncedInv = {
            ...inv,
            trackingStatus: newStatus,
            trackingHistory: [
              ...history,
              {
                status: newStatus,
                time: formattedDate,
                note: note || defaultNotes[newStatus] || 'تحديث حالة الشحنة'
              }
            ]
          };
          return syncedInv;
        }
        return inv;
      })
    );

    if (syncedInv && typeof fetch !== 'undefined') {
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoices: [syncedInv] })
      }).catch(() => { });
    }
  };

  // Direct Invoice Receipt Attachment / Replacement
  const updateInvoiceReceipt = (invoiceId, receiptDataUrl, fileName = '', senderPhone = null) => {
    let syncedInv = null;
    setInvoices(prev =>
      prev.map(inv => {
        if (inv.id === invoiceId) {
          syncedInv = {
            ...inv,
            transferReceipt: receiptDataUrl,
            transferReceiptFileName: fileName || inv.transferReceiptFileName,
            transferSenderPhone: senderPhone !== null ? senderPhone : inv.transferSenderPhone
          };
          return syncedInv;
        }
        return inv;
      })
    );

    if (syncedInv && typeof fetch !== 'undefined') {
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoices: [syncedInv] })
      }).catch(() => { });
    }
  };

  // Computed Smart Alerts
  const lowStockAlerts = products.filter(p => p.stock <= p.minStockAlert);

  const today = new Date();
  const nearExpiryBatches = batches.filter(b => {
    if (b.quantity <= 0) return false;
    const expiry = new Date(b.expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 75;
  });

  const pendingOrders = invoices.filter(inv => inv.status === 'pending');
  const pendingOrdersCount = pendingOrders.length;

  // Read Alerts Management (Persisted in localStorage)
  const [readAlertIds, setReadAlertIds] = useState(() => {
    try {
      const saved = localStorage.getItem('caturra_eg_read_alerts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('caturra_eg_read_alerts', JSON.stringify(readAlertIds));
    } catch {
      // ignore
    }
  }, [readAlertIds]);

  const markAllAlertsAsRead = useCallback(() => {
    const allIds = [
      ...lowStockAlerts.map(p => `stock-${p.id}`),
      ...nearExpiryBatches.map(b => `expiry-${b.id}`),
      ...pendingOrders.map(o => `order-${o.id}`),
      ...(b2bRequests || []).map(l => `b2b-${l.id}`)
    ];
    setReadAlertIds(prev => Array.from(new Set([...prev, ...allIds])));
  }, [lowStockAlerts, nearExpiryBatches, pendingOrders, b2bRequests]);

  const markAlertAsRead = useCallback((alertId) => {
    setReadAlertIds(prev => Array.from(new Set([...prev, alertId])));
  }, []);

  const unreadLowStockAlerts = lowStockAlerts.filter(p => !readAlertIds.includes(`stock-${p.id}`));
  const unreadNearExpiryBatches = batches.filter(b => {
    if (b.quantity <= 0) return false;
    const expiry = new Date(b.expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 75;
  }).filter(b => !readAlertIds.includes(`expiry-${b.id}`));
  const unreadPendingOrders = pendingOrders.filter(o => !readAlertIds.includes(`order-${o.id}`));
  const unreadB2BRequests = (b2bRequests || []).filter(l => (l.status === 'new' || !l.isRead) && !readAlertIds.includes(`b2b-${l.id}`));
  const unreadB2BCount = unreadB2BRequests.length;

  // Standing Recurring Orders Due (مستحقة اليوم أو متأخرة)
  const todayStrDate = new Date().toISOString().split('T')[0];
  const dueStandingOrders = (b2bStandingOrders || []).filter(order =>
    order.status === 'active' && order.nextDeliveryDate && order.nextDeliveryDate <= todayStrDate
  );
  const dueStandingOrdersCount = dueStandingOrders.length;

  const unreadAlertsCount = unreadLowStockAlerts.length + unreadNearExpiryBatches.length + unreadPendingOrders.length + unreadB2BCount + dueStandingOrdersCount;

  // B2B Wholesale & Cafe Partnership Actions
  const addB2BRequest = useCallback((data) => {
    const now = new Date();
    const formattedDate = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const refCode = data.refCode || `CAT-B2B-${Math.floor(1000 + Math.random() * 9000)}`;

    const newLead = {
      id: `b2b-req-${Date.now()}`,
      refCode,
      companyName: data.companyName ? String(data.companyName).trim() : 'منشأة جديدة',
      contactName: data.contactName ? String(data.contactName).trim() : '',
      phone: normalizePhone(data.phone || ''),
      email: data.email ? String(data.email).trim() : '',
      city: data.city || 'القاهرة',
      businessType: data.businessType || 'specialty_cafe',
      monthlyVolume: data.monthlyVolume || '25-50',
      privateLabel: Boolean(data.privateLabel),
      monthlyContract: Boolean(data.monthlyContract),
      extractionSupport: Boolean(data.extractionSupport),
      notes: data.notes ? String(data.notes).trim() : '',
      status: 'new',
      isRead: false,
      quotedAmount: Number(data.quotedAmount || 0),
      internalNotes: [
        {
          id: `note-${Date.now()}`,
          text: 'تم تسجيل طلب الشراكة والتوريد بنجاح عبر المتجر الإلكتروني.',
          author: 'النظام الآلي',
          date: formattedDate
        }
      ],
      createdAt: formattedDate
    };

    setB2bRequests(prev => [newLead, ...(prev || [])]);

    // Instant alert sound, vibration, and push notification in ERP
    try {
      playNotificationSound();
      vibratePhone([300, 150, 300, 150, 400]);
      dispatchStoreAlert({
        type: 'b2b',
        title: `☕ طلب توريد وشراكة كافيه جديد (B2B) #${refCode}`,
        body: `${newLead.companyName} (${newLead.city}) • هاتف: ${newLead.phone}`,
        details: `الاستهلاك التقديري: ${newLead.monthlyVolume} كجم شهرياً | النشاط: ${newLead.businessType}`
      });
    } catch (_) { }

    return newLead;
  }, []);

  const updateB2BStatus = useCallback((id, newStatus) => {
    setB2bRequests(prev =>
      (prev || []).map(lead => (lead.id === id ? { ...lead, status: newStatus, isRead: true } : lead))
    );
  }, []);

  const updateB2BLead = useCallback((id, updatedFields) => {
    setB2bRequests(prev =>
      (prev || []).map(lead => (lead.id === id ? { ...lead, ...updatedFields } : lead))
    );
  }, []);

  const addB2BInternalNote = useCallback((id, noteText) => {
    if (!noteText || !noteText.trim()) return;
    const now = new Date();
    const formattedDate = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const newNoteObj = {
      id: `note-${Date.now()}`,
      text: noteText.trim(),
      author: currentUser?.fullName || 'مسؤول المبيعات',
      date: formattedDate
    };
    setB2bRequests(prev =>
      (prev || []).map(lead => {
        if (lead.id === id) {
          return {
            ...lead,
            internalNotes: [...(lead.internalNotes || []), newNoteObj]
          };
        }
        return lead;
      })
    );
  }, [currentUser]);

  const deleteB2BRequest = useCallback((id) => {
    setB2bRequests(prev => (prev || []).filter(lead => lead.id !== id));
  }, []);

  const convertB2BToCustomer = useCallback((b2bId) => {
    const lead = (b2bRequests || []).find(l => l.id === b2bId);
    if (!lead) return null;

    // Check if customer already exists by phone or name
    const existingCust = (customers || []).find(c =>
      (c.phone && normalizePhone(c.phone) === normalizePhone(lead.phone) && lead.phone) ||
      (c.name && normalizeArabic(c.name) === normalizeArabic(lead.companyName))
    );

    let targetCustomer = existingCust;
    if (!existingCust) {
      const newCust = {
        id: `cust-${Date.now()}`,
        name: `${lead.companyName}${lead.contactName ? ` (${lead.contactName})` : ''}`,
        phone: lead.phone || '',
        email: lead.email || '',
        city: lead.city || 'القاهرة',
        address: `${lead.city || ''} - عميل جملة B2B (${lead.refCode})`,
        totalOrders: 0,
        totalSpent: 0,
        debt: 0,
        isB2B: true,
        businessType: lead.businessType,
        b2bRefCode: lead.refCode,
        preferredProducts: lead.preferredProducts || [],
        notes: `عميل جملة محوّل من B2B (${lead.refCode}) | استهلاك شهري: ${lead.monthlyVolume} كجم | متطلبات: ${lead.notes || 'توريد بن كافيهات'}`,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setCustomers(prev => [newCust, ...(prev || [])]);
      targetCustomer = newCust;
    } else {
      setCustomers(prev =>
        (prev || []).map(c => (c.id === existingCust.id ? {
          ...c,
          isB2B: true,
          b2bRefCode: lead.refCode,
          preferredProducts: (c.preferredProducts && c.preferredProducts.length > 0) ? c.preferredProducts : (lead.preferredProducts || [])
        } : c))
      );
    }

    const now = new Date();
    const formattedDate = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const conversionNote = {
      id: `note-${Date.now()}`,
      text: `تم تحويل المنشأة بنجاح إلى عميل جملة معتمد في قاعدة بيانات الـ ERP (العميل: ${targetCustomer.name}).`,
      author: currentUser?.fullName || 'الإدارة',
      date: formattedDate
    };

    setB2bRequests(prev =>
      (prev || []).map(l => {
        if (l.id === b2bId) {
          return {
            ...l,
            status: 'contracted',
            isRead: true,
            convertedCustomerId: targetCustomer.id,
            internalNotes: [...(l.internalNotes || []), conversionNote]
          };
        }
        return l;
      })
    );

    return targetCustomer;
  }, [b2bRequests, customers, currentUser]);

  const markB2BAsRead = useCallback((id) => {
    setB2bRequests(prev =>
      (prev || []).map(l => (l.id === id ? { ...l, isRead: true } : l))
    );
  }, []);

  const markAllB2BAsRead = useCallback(() => {
    setB2bRequests(prev =>
      (prev || []).map(l => ({ ...l, isRead: true }))
    );
  }, []);

  // Helper to advance standing order delivery date
  const advanceStandingOrderDate = (frequency, customDays, baseDateStr) => {
    const base = baseDateStr ? new Date(baseDateStr) : new Date();
    let daysToAdd = 7;
    if (frequency === 'biweekly') daysToAdd = 14;
    else if (frequency === 'monthly') daysToAdd = 30;
    else if (frequency === 'weekly') daysToAdd = 7;
    else if (frequency === 'custom' && Number(customDays) > 0) daysToAdd = Number(customDays);

    const next = new Date(base.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    return next.toISOString().split('T')[0];
  };

  const addB2BStandingOrder = useCallback((data) => {
    const today = new Date().toISOString().split('T')[0];
    const refCode = data.refCode || `ST-CAT-${Math.floor(100 + Math.random() * 900)}`;
    const newOrder = {
      id: `standing-${Date.now()}`,
      refCode,
      leadId: data.leadId || null,
      companyName: data.companyName ? String(data.companyName).trim() : 'منشأة جديدة',
      contactName: data.contactName ? String(data.contactName).trim() : '',
      phone: normalizePhone(data.phone || ''),
      city: data.city || 'القاهرة',
      address: data.address || '',
      frequency: data.frequency || 'weekly',
      customDays: Number(data.customDays || 7),
      startDate: data.startDate || today,
      nextDeliveryDate: data.nextDeliveryDate || data.startDate || today,
      status: 'active',
      items: Array.isArray(data.items) ? data.items : [],
      totalAmount: Number(data.totalAmount || 0),
      preferredPaymentMethod: data.preferredPaymentMethod || 'deferred',
      defaultDownPayment: Number(data.defaultDownPayment || 0),
      notes: data.notes ? String(data.notes).trim() : '',
      history: [],
      createdAt: `${today} ${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`
    };

    setB2bStandingOrders(prev => [newOrder, ...(prev || [])]);
    return newOrder;
  }, []);

  const updateB2BStandingOrder = useCallback((id, updatedFields) => {
    setB2bStandingOrders(prev =>
      (prev || []).map(order => (order.id === id ? { ...order, ...updatedFields } : order))
    );
  }, []);

  const deleteB2BStandingOrder = useCallback((id) => {
    setB2bStandingOrders(prev => (prev || []).filter(order => order.id !== id));
  }, []);

  // Fulfill / Dispatch Standing Order (Creates official B2B sale, deducts stock, deposits to treasury, advances schedule)
  const fulfillB2BStandingOrder = useCallback((orderId, executionOverride = {}) => {
    const order = (b2bStandingOrders || []).find(o => o.id === orderId);
    if (!order) return null;

    const deliveryItems = (executionOverride.items && executionOverride.items.length > 0)
      ? executionOverride.items
      : order.items.map(item => ({
        productId: item.productId,
        name: `${item.productName || 'بن مختص'} - (${item.qty} ${item.unitType === 'weight' ? 'كجم' : 'قطعة'})`,
        unitType: item.unitType || 'weight',
        weightGram: item.unitType === 'weight' ? (item.weightGram || 1000) * Number(item.qty || 1) : undefined,
        price: Number(item.total || (item.unitPrice * item.qty)),
        qty: 1
      }));

    const totalAmount = deliveryItems.reduce((sum, it) => sum + Number(it.price || 0), 0);
    const paymentMethod = executionOverride.paymentMethod || order.preferredPaymentMethod || 'deferred';
    const inputPaidAmount = executionOverride.paidAmount !== undefined
      ? Number(executionOverride.paidAmount)
      : Number(order.defaultDownPayment || 0);

    const salePayload = {
      items: deliveryItems,
      customerName: order.companyName,
      customerPhone: order.phone,
      customerAddress: order.address,
      discount: Number(executionOverride.discount || 0),
      paymentMethod,
      paidAmount: inputPaidAmount,
      source: 'b2b',
      isB2B: true,
      standingOrderId: order.id,
      b2bRefCode: order.refCode,
      notes: executionOverride.notes || `توريد دوري منتظم #${order.refCode} - ${order.companyName} (${order.frequency === 'weekly' ? 'أسبوعي' : order.frequency === 'biweekly' ? 'نصف شهري' : 'شهري'})`
    };

    // 1. Create Sale (Deducts stock accurately in grams & batches, deposits cash into treasury, records remaining debt on customer)
    const newInvoice = createSale(salePayload);

    // 2. Advance next delivery date and append to standing order history
    const today = new Date().toISOString().split('T')[0];
    const nextDate = advanceStandingOrderDate(order.frequency, order.customDays, order.nextDeliveryDate || today);

    const newHistoryEntry = {
      id: `hist-${Date.now()}`,
      deliveryDate: today,
      invoiceNumber: newInvoice.invoiceNumber,
      invoiceId: newInvoice.id,
      amount: newInvoice.total,
      paidAmount: newInvoice.paidAmount,
      remainingDebt: newInvoice.remainingDebt,
      status: 'delivered',
      note: executionOverride.note || `تم توريد الشحنة الدورية وخصم المخزون بنجاح (فاتورة #${newInvoice.invoiceNumber})`
    };

    setB2bStandingOrders(prev =>
      (prev || []).map(o => {
        if (o.id === orderId) {
          return {
            ...o,
            nextDeliveryDate: nextDate,
            history: [newHistoryEntry, ...(o.history || [])]
          };
        }
        return o;
      })
    );

    try {
      playNotificationSound();
      vibratePhone([300, 100, 300]);
      dispatchStoreAlert({
        type: 'b2b',
        title: `🚀 تم تنفيذ التوريد الدوري للكافيه #${order.refCode}`,
        body: `${order.companyName} • فاتورة #${newInvoice.invoiceNumber} بقيمة ${newInvoice.total.toLocaleString()} ج.م`,
        details: `الموعد القادم للتوريد: ${nextDate}`
      });
    } catch (_) { }

    return newInvoice;
  }, [b2bStandingOrders, createSale]);

  // Create Direct B2B Invoice (Manual wholesale invoice with downpayment / debt & inventory deduction)
  const createB2BDirectInvoice = useCallback((salePayload) => {
    return createSale({
      ...salePayload,
      source: 'b2b',
      isB2B: true
    });
  }, [createSale]);

  // 🔄 Return Invoice Items (Partial or Full Return)
  // Restores product stock in inventory & batches, updates customer debt or creates treasury cash withdrawal refund
  const returnInvoiceItems = useCallback((invoiceId, returnReason = '', refundOptions = {}, customItemsToReturn = null) => {
    const targetInvoice = (invoices || []).find(inv => inv.id === invoiceId || inv.invoiceNumber === invoiceId);
    if (!targetInvoice || targetInvoice.status === 'cancelled') {
      return false;
    }

    const now = new Date();
    const formattedDate = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const invoiceItems = Array.isArray(targetInvoice.items) ? targetInvoice.items : [];
    if (invoiceItems.length === 0) {
      return false;
    }

    // Determine which items to return and how much
    let itemsToProcess = [];
    if (Array.isArray(customItemsToReturn) && customItemsToReturn.length > 0) {
      itemsToProcess = customItemsToReturn.filter(it => Number(it.qtyToReturn || 0) > 0);
    } else {
      // Default: Return all remaining quantities for all items
      itemsToProcess = invoiceItems.map(it => {
        const remainingQty = Math.max(0, Number(it.qty || 1) - Number(it.returnedQty || 0));
        return {
          productId: it.productId,
          name: it.name,
          unitType: it.unitType,
          weightGram: it.weightGram,
          unitPrice: Number(it.unitPrice || it.price || (Number(it.total || 0) / Number(it.qty || 1)) || 0),
          qtyToReturn: remainingQty
        };
      }).filter(it => it.qtyToReturn > 0);
    }

    if (itemsToProcess.length === 0) {
      return false;
    }

    // Calculate total refund value of returned items
    const totalRefundAmount = itemsToProcess.reduce((sum, it) => {
      const price = Number(it.unitPrice || 0);
      const qty = Number(it.qtyToReturn || 0);
      return sum + (price * qty);
    }, 0);

    // 1. Restore stock to inventory (products & batches)
    itemsToProcess.forEach(returnItem => {
      const qty = Number(returnItem.qtyToReturn || 0);
      const isWeight = returnItem.unitType === 'weight' && returnItem.weightGram;

      if (isWeight) {
        const gramsToRestore = Number(returnItem.weightGram) * qty;
        setProducts(prev =>
          prev.map(p => {
            if (p.id === returnItem.productId) {
              const currentGrams = p.stockGram !== undefined ? p.stockGram : (p.stock * 1000);
              const newGrams = currentGrams + gramsToRestore;
              return {
                ...p,
                stockGram: newGrams,
                stock: Math.round((newGrams / 1000) * 10) / 10,
                salesCount: Math.max(0, (p.salesCount || 0) - qty)
              };
            }
            return p;
          })
        );

        // Batches restore
        setBatches(prev => {
          let restored = false;
          return prev.map(batch => {
            if (batch.productId === returnItem.productId && !restored) {
              restored = true;
              const currentBatchGrams = batch.quantityGram !== undefined ? batch.quantityGram : (batch.quantity * 1000);
              const newBatchGrams = currentBatchGrams + gramsToRestore;
              return {
                ...batch,
                quantityGram: newBatchGrams,
                quantity: Math.round((newBatchGrams / 1000) * 10) / 10,
                status: 'active'
              };
            }
            return batch;
          });
        });
      } else {
        setProducts(prev =>
          prev.map(p => {
            if (p.id === returnItem.productId) {
              return {
                ...p,
                stock: p.stock + qty,
                salesCount: Math.max(0, (p.salesCount || 0) - qty)
              };
            }
            return p;
          })
        );

        // Batches restore
        setBatches(prev => {
          let restored = false;
          return prev.map(batch => {
            if (batch.productId === returnItem.productId && !restored) {
              restored = true;
              return {
                ...batch,
                quantity: batch.quantity + qty,
                status: 'active'
              };
            }
            return batch;
          });
        });
      }
    });

    // 2. Financial calculation: Debt reduction vs Cash refund
    const currentDebt = Number(targetInvoice.remainingDebt || 0);
    const settlementMode = refundOptions?.settlementMode || (currentDebt > 0 ? 'debt_first' : 'cash');

    let debtDeduction = 0;
    let cashRefund = 0;

    if (settlementMode === 'debt_first') {
      debtDeduction = Math.min(totalRefundAmount, currentDebt);
      const remainingRefund = totalRefundAmount - debtDeduction;
      if (remainingRefund > 0) {
        cashRefund = remainingRefund;
      }
    } else if (settlementMode === 'cash') {
      cashRefund = totalRefundAmount;
      debtDeduction = 0;
    }

    // 3. Customer Debt Adjustment
    const targetCustId = targetInvoice.customerId;
    if (debtDeduction > 0 && targetCustId) {
      setCustomers(prev =>
        prev.map(c => {
          if (c.id === targetCustId || (c.phone && normalizePhone(c.phone) === normalizePhone(targetInvoice.customerPhone))) {
            return {
              ...c,
              debt: Math.max(0, (Number(c.debt) || 0) - debtDeduction)
            };
          }
          return c;
        })
      );
    }

    // 4. Treasury Cash Refund (Withdrawal)
    if (cashRefund > 0) {
      const refundAccountId = refundOptions?.accountId || 'acc-cash-main';
      const itemsSummary = itemsToProcess.map(it => `${it.name} (${it.qtyToReturn})`).join('، ');
      const refundTx = {
        id: `tx-ret-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
        date: formattedDate,
        type: 'withdrawal',
        fromAccountId: refundAccountId,
        toAccountId: null,
        amount: cashRefund,
        category: targetInvoice.isB2B ? 'مرتجع مبيعات جملة (B2B)' : 'مرتجع مبيعات',
        description: `رد مالي لمرتجع فاتورة #${targetInvoice.invoiceNumber} - العميل: ${targetInvoice.customerName} [${itemsSummary}] | السبب: ${returnReason || 'مرتجع صنف'}`,
        performedBy: currentUser?.fullName || 'الإدارة',
        invoiceId: targetInvoice.id,
        customerId: targetInvoice.customerId
      };
      setTreasuryTransactions(prev => [refundTx, ...prev]);
    }

    // 5. Update Invoice Items & Status
    setInvoices(prev =>
      prev.map(inv => {
        if (inv.id === targetInvoice.id) {
          // Update items returnedQty
          const updatedItems = (inv.items || []).map(origItem => {
            const returnedMatch = itemsToProcess.find(it => it.productId === origItem.productId);
            if (returnedMatch) {
              const prevReturned = Number(origItem.returnedQty || 0);
              return {
                ...origItem,
                returnedQty: prevReturned + Number(returnedMatch.qtyToReturn)
              };
            }
            return origItem;
          });

          // Check if all items in the invoice are now returned
          const isAllReturned = updatedItems.every(it => Number(it.returnedQty || 0) >= Number(it.qty || 1));
          const newStatus = isAllReturned ? 'returned' : 'partially_returned';
          const newTracking = isAllReturned ? 'returned' : 'partially_returned';

          const itemsSummary = itemsToProcess.map(it => `${it.name} (عدد ${it.qtyToReturn})`).join('، ');
          const history = inv.trackingHistory || [];
          const prevReturnLogs = inv.returnLogs || [];

          return {
            ...inv,
            items: updatedItems,
            status: newStatus,
            trackingStatus: newTracking,
            returnedAt: formattedDate,
            returnReason: returnReason || 'مرتجع بضاعة',
            remainingDebt: Math.max(0, currentDebt - debtDeduction),
            returnedAmount: (Number(inv.returnedAmount) || 0) + totalRefundAmount,
            refundedCashAmount: (Number(inv.refundedCashAmount) || 0) + cashRefund,
            returnLogs: [
              ...prevReturnLogs,
              {
                id: `ret-op-${Date.now()}`,
                date: formattedDate,
                items: itemsToProcess,
                totalRefundAmount,
                debtDeduction,
                cashRefund,
                reason: returnReason,
                performedBy: currentUser?.fullName || 'الإدارة'
              }
            ],
            trackingHistory: [
              ...history,
              {
                status: newStatus,
                time: formattedDate,
                note: `تم تسجيل مرتجع [${itemsSummary}] بقيمة ${totalRefundAmount.toLocaleString()} ج.م وإعادة الكميات للمخزن (${returnReason || 'مرتجع'})`
              }
            ]
          };
        }
        return inv;
      })
    );

    // Sync updated invoice
    if (typeof fetch !== 'undefined') {
      fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoices: [{
            ...targetInvoice,
            status: 'partially_returned',
            remainingDebt: Math.max(0, currentDebt - debtDeduction)
          }]
        })
      }).catch(() => { });
    }

    try {
      playNotificationSound();
      vibratePhone([200, 100, 200]);
      dispatchStoreAlert({
        type: targetInvoice.isB2B ? 'b2b' : 'inventory',
        title: `🔄 تم تسجيل مرتجع فاتورة #${targetInvoice.invoiceNumber}`,
        body: `تم إرجاع المنتجات للمخزن وتسوية المالية بمبلغ ${totalRefundAmount.toLocaleString()} ج.م`,
        details: `السبب: ${returnReason || 'مرتجع بضاعة'}`
      });
    } catch (_) { }

    return true;
  }, [invoices, currentUser, playNotificationSound, vibratePhone]);

  // Backward compatibility alias for existing B2B calls
  const returnB2BInvoice = useCallback((invoiceId, returnReason = '', refundOptions = {}, itemsToReturn = null) => {
    return returnInvoiceItems(invoiceId, returnReason, refundOptions, itemsToReturn);
  }, [returnInvoiceItems]);

  // Academy Actions
  const addAcademyArticle = async (articleData) => {
    const newArticle = {
      id: `acad-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      readTime: '4 دقائق',
      level: 'جميع المستويات',
      image: '/v60_set.jpg',
      author: currentUser?.fullName || 'أكاديمية كاتورا',
      featured: false,
      ...articleData
    };

    if (newArticle.pdfFile?.id && newArticle.pdfFile?.data) {
      await savePdfToStorage(newArticle.pdfFile.id, newArticle.pdfFile);
    }

    setAcademyArticles(prev => [newArticle, ...prev]);
    dispatchStoreAlert({
      title: 'أكاديمية كاتورا للقهوة المختصة',
      body: `تم نشر درس تعليمي جديد: ${newArticle.title}`,
      sound: true
    });
    return newArticle;
  };

  const updateAcademyArticle = async (id, updatedData) => {
    if (updatedData.pdfFile?.id && updatedData.pdfFile?.data) {
      await savePdfToStorage(updatedData.pdfFile.id, updatedData.pdfFile);
    }
    setAcademyArticles(prev => prev.map(a => a.id === id ? { ...a, ...updatedData } : a));
  };

  const deleteAcademyArticle = async (id) => {
    const target = academyArticles.find(a => a.id === id);
    if (target?.pdfFile?.id) {
      await deletePdfFromStorage(target.pdfFile.id);
    }
    setAcademyArticles(prev => prev.filter(a => a.id !== id));
  };

  // Brewing Recipes & Grind Guides Management
  const updateBrewingGuide = useCallback((guideId, updatedGuide) => {
    setBrewingGuides(prev => ({
      ...prev,
      [guideId]: {
        ...(prev[guideId] || {}),
        ...updatedGuide
      }
    }));
  }, []);

  const resetBrewingGuides = useCallback(() => {
    setBrewingGuides(initialBrewingGuides);
    try {
      localStorage.setItem('caturra_eg_brewing_guides', JSON.stringify(initialBrewingGuides));
    } catch (_) { }
  }, []);

  const resetAllFinancials = useCallback(() => {
    // 1. Reset state
    setInvoices([]);
    setPurchases([]);
    setExpenses([]);
    setTreasuryTransactions([]);
    setTreasuryAccounts(prev => prev.map(a => ({ ...a, openingBalance: 0 })));
    setCustomers(prev => (prev || []).map(c => ({ ...c, debt: 0, totalOrders: 0, totalSpent: 0, openingDebt: 0 })));
    setSuppliers(prev => (prev || []).map(s => ({ ...s, debt: 0, totalPurchases: 0, openingDebt: 0 })));

    // 2. Clear localStorage
    try {
      localStorage.setItem('caturra_eg_invoices', JSON.stringify([]));
      localStorage.setItem('caturra_eg_purchases', JSON.stringify([]));
      localStorage.setItem('caturra_eg_expenses', JSON.stringify([]));
      localStorage.setItem('caturra_eg_treasury_transactions', JSON.stringify([]));

      const zeroedAccs = treasuryAccounts.map(a => ({ ...a, openingBalance: 0 }));
      localStorage.setItem('caturra_eg_treasury_accounts', JSON.stringify(zeroedAccs));

      const zeroedCusts = (customers || []).map(c => ({ ...c, debt: 0, totalOrders: 0, totalSpent: 0, openingDebt: 0 }));
      localStorage.setItem('caturra_eg_customers', JSON.stringify(zeroedCusts));

      const zeroedSups = (suppliers || []).map(s => ({ ...s, debt: 0, totalPurchases: 0, openingDebt: 0 }));
      localStorage.setItem('caturra_eg_suppliers', JSON.stringify(zeroedSups));

      localStorage.setItem('caturra_eg_wipe_financials_20261104', 'true');
    } catch (e) {
      console.warn('LocalStorage reset error', e);
    }

    // 3. Post to server
    if (typeof fetch !== 'undefined') {
      fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-caturra-erp-auth': 'caturra_sec_token_v2'
        },
        body: JSON.stringify({
          wipeInvoices: true,
          invoices: [],
          expenses: [],
          purchases: [],
          treasuryTransactions: [],
          treasuryAccounts: treasuryAccounts.map(a => ({ ...a, openingBalance: 0 })),
          customers: (customers || []).map(c => ({ ...c, debt: 0, totalOrders: 0, totalSpent: 0, openingDebt: 0 })),
          suppliers: (suppliers || []).map(s => ({ ...s, debt: 0, totalPurchases: 0, openingDebt: 0 }))
        })
      }).catch(() => { });
    }
  }, [treasuryAccounts, customers, suppliers]);

  return (
    <AppContext.Provider
      value={{
        resetAllFinancials,
        brewingGuides,
        updateBrewingGuide,
        resetBrewingGuides,
        categories,
        products,
        customers,
        invoices,
        purchases,
        batches,
        expenses,
        users,
        currentUser,
        isAuthenticated,
        isSetupRequired,
        setupInitialAdmin,
        resetAdminAccount,
        login,
        logout,
        logoutAndSwitchUser,
        loginPreselectedUsername,
        setLoginPreselectedUsername,
        loginAsUser,
        activeTab,
        setActiveTab,
        posPreselectedCustomer,
        setPosPreselectedCustomer,
        viewMode,
        setViewMode,
        navigateTo,
        sidebarCollapsed,
        setSidebarCollapsed,
        openInvoiceModal,
        closeInvoiceModal,
        isInvoiceModalOpen,
        activeInvoiceForModal,
        // Actions
        addProduct,
        updateProduct,
        deleteProduct,
        addCategory,
        addPurchaseInvoice,
        // Suppliers Management
        suppliers,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        paySupplierInvoice,
        createSale,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        settleCustomerDebt,
        addExpense,
        updateExpense,
        deleteExpense,
        // Treasury & Wallets
        treasuryAccounts,
        addTreasuryAccount,
        updateTreasuryAccount,
        deleteTreasuryAccount,
        treasuryTransactions,
        addTreasuryTransaction,
        deleteTreasuryTransaction,
        getTreasuryAccountBalance,
        addUser,
        updateUser,
        deleteUser,
        applyPromoDiscount,
        recordStockWaste,
        reconcileInventoryAudit,
        importInventoryBatch,
        // Academy Educational Actions
        academyArticles,
        addAcademyArticle,
        updateAcademyArticle,
        deleteAcademyArticle,
        // B2B Wholesale & Cafe Partnerships Actions
        b2bRequests,
        unreadB2BRequests,
        unreadB2BCount,
        addB2BRequest,
        updateB2BStatus,
        updateB2BLead,
        addB2BInternalNote,
        deleteB2BRequest,
        convertB2BToCustomer,
        markB2BAsRead,
        markAllB2BAsRead,
        // B2B Standing Orders & Recurring Contracts
        b2bStandingOrders,
        dueStandingOrders,
        dueStandingOrdersCount,
        addB2BStandingOrder,
        updateB2BStandingOrder,
        deleteB2BStandingOrder,
        fulfillB2BStandingOrder,
        createB2BDirectInvoice,
        returnB2BInvoice,
        returnInvoiceItems,
        // Alerts, Notifications & Pending Orders
        lowStockAlerts,
        nearExpiryBatches,
        pendingOrders,
        pendingOrdersCount,
        unreadPendingOrders,
        readAlertIds,
        markAllAlertsAsRead,
        markAlertAsRead,
        unreadAlertsCount,
        confirmPendingOrder,
        cancelInvoice,
        cancelPendingOrder,
        // Mobile & Device Notification Settings
        isNotificationSettingsOpen,
        setIsNotificationSettingsOpen,
        openNotificationSettings: () => setIsNotificationSettingsOpen(true),
        closeNotificationSettings: () => setIsNotificationSettingsOpen(false),
        dispatchStoreAlert,
        // Store Contact & Brand Settings
        contactInfo,
        updateContactInfo,
        resetContactInfo,
        // Order Tracking & Shipping Actions
        isTrackingModalOpen,
        trackingInvoiceNumber,
        openTrackingModal,
        closeTrackingModal,
        updateInvoiceTrackingStatus,
        updateInvoiceReceipt,
        // Global In-Page Dialog & Confirm Modal
        dialogState,
        confirmDialog,
        alertDialog,
        closeDialog,
        // Bilingual Language Support
        language,
        setLanguage,
        toggleLanguage,
        t,
        isRtl: language === 'ar',
        getLocalizedName: (item) => getLocalizedName(item, language),
        getLocalizedNotes: (item) => getLocalizedNotes(item, language),
        getLocalizedOrigin: (orig) => getLocalizedOrigin(orig, language),
        getLocalizedRoast: (roast) => getLocalizedRoast(roast, language),
        getLocalizedProcess: (proc) => getLocalizedProcess(proc, language),
        getLocalizedBrewMethod: (method) => getLocalizedBrewMethod(method, language),
        getLocalizedCategory: (cat) => getLocalizedCategory(cat, language),
        formatPrice: (amount) => formatPrice(amount, language)
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
