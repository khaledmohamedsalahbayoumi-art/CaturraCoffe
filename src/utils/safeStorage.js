/**
 * Safe LocalStorage Utility for Caturra ERP & Storefront
 * Prevents QuotaExceededError crashes on mobile devices (especially Safari iOS 5MB limit).
 * 
 * KEY RULE: Base64 image strings are NEVER stored in localStorage.
 * They are only kept in Supabase/server and in React in-memory state.
 */

/**
 * Strip Base64 images from a product before storing it in localStorage.
 * Keeps only URL references (strings starting with / or http).
 */
export const stripBase64FromProduct = (product) => {
  if (!product || typeof product !== 'object') return product;
  const copy = { ...product };

  // Strip image if it's a Base64 data URI (can be 300-600KB each!)
  if (copy.image && typeof copy.image === 'string' && copy.image.startsWith('data:')) {
    // Keep a placeholder so the UI falls back to category image
    delete copy.image;
  }
  // Strip backImage entirely — always Base64, never needed in localStorage
  if (copy.backImage) delete copy.backImage;
  // Strip customBagDesign — large JSON object, server has it
  if (copy.customBagDesign) delete copy.customBagDesign;

  return copy;
};

/**
 * Strip Base64 images from an array of products before localStorage save.
 */
export const stripBase64FromProducts = (products) => {
  if (!Array.isArray(products)) return products;
  return products.map(stripBase64FromProduct);
};

export const pruneOversizedStorage = () => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      // Remove raw design cache keys and temporary previews
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

    // Also scan all keys and strip any Base64 that slipped through
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || keysToRemove.includes(k)) continue;
      try {
        const raw = localStorage.getItem(k);
        if (!raw) continue;
        // If it's a products array, strip base64
        if (k === 'caturra_eg_products' || k.includes('products')) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const cleaned = stripBase64FromProducts(parsed);
            const cleanedStr = JSON.stringify(cleaned);
            if (cleanedStr.length < raw.length) {
              localStorage.setItem(k, cleanedStr);
            }
          }
        }
      } catch (_) {}
    }
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

    // Auto-strip Base64 from products to prevent QuotaExceededError
    let sanitized = value;
    if (key === 'caturra_eg_products' && Array.isArray(value)) {
      sanitized = stripBase64FromProducts(value);
    } else if (key === 'caturra_eg_products' && typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) {
          sanitized = JSON.stringify(stripBase64FromProducts(parsed));
        }
      } catch (_) {}
    }

    const str = typeof sanitized === 'string' ? sanitized : JSON.stringify(sanitized);
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
