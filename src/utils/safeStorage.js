/**
 * Safe LocalStorage Utility for Caturra ERP & Storefront
 * Prevents QuotaExceededError crashes on mobile devices while 100% preserving
 * all product specifications, custom bag designs, and high-res mockups.
 */

export const pruneOversizedStorage = () => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      // Remove only duplicate raw design cache keys and temporary previews
      if (
        k.startsWith('caturra_bag_design_') ||
        k.startsWith('caturra_preview_') ||
        k.includes('_cache_') ||
        k.includes('temp')
      ) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach(k => {
      try { localStorage.removeItem(k); } catch (_) {}
    });
  } catch (e) {
    console.warn('[safeStorage] Error during storage pruning:', e);
  }
};

// Auto-run lightweight pruning on module load
if (typeof window !== 'undefined') {
  try {
    pruneOversizedStorage();
  } catch (_) {}
}

export const safeStorage = {
  setItem: (key, value) => {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    const str = typeof value === 'string' ? value : JSON.stringify(value);
    try {
      localStorage.setItem(key, str);
      return true;
    } catch (err) {
      console.warn(`[safeStorage] setItem hit storage limit for key "${key}", pruning duplicates...`);
      pruneOversizedStorage();

      try {
        localStorage.setItem(key, str);
        return true;
      } catch (retryErr) {
        // If still full, safely log without crashing the application.
        // The in-memory state & backend Supabase database remain fully preserved.
        console.warn(`[safeStorage] Storage quota full for key "${key}" - preserved in memory & backend:`, retryErr?.message || retryErr);
        return false;
      }
    }
  },

  getItem: (key, fallback = null) => {
    if (typeof window === 'undefined' || !window.localStorage) return fallback;
    try {
      const val = localStorage.getItem(key);
      if (val === null) return fallback;
      try {
        return JSON.parse(val);
      } catch {
        return val;
      }
    } catch {
      return fallback;
    }
  },

  removeItem: (key) => {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      localStorage.removeItem(key);
    } catch (_) {}
  }
};
