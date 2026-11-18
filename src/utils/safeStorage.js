/**
 * Safe LocalStorage Utility for Caturra ERP & Storefront
 * Prevents QuotaExceededError crashes on mobile devices (iOS Safari 5MB limit).
 */

export const pruneOversizedStorage = () => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      // Strip oversized bag designs, temporary caches, and old previews
      if (
        k.startsWith('caturra_bag_design_') ||
        k.startsWith('caturra_spec_') ||
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

    // Strip heavy base64 images from cached caturra_eg_products
    const prodsStr = localStorage.getItem('caturra_eg_products');
    if (prodsStr && prodsStr.length > 500000) { // > 500KB
      try {
        const prods = JSON.parse(prodsStr);
        if (Array.isArray(prods)) {
          const lean = prods.map(p => {
            const copy = { ...p };
            if (copy.image && copy.image.startsWith('data:') && copy.image.length > 30000) {
              copy.image = '/caturra_colombia.jpg';
            }
            if (copy.backImage && copy.backImage.startsWith('data:')) {
              delete copy.backImage;
            }
            delete copy.customBagDesign;
            return copy;
          });
          localStorage.setItem('caturra_eg_products', JSON.stringify(lean));
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
    const str = typeof value === 'string' ? value : JSON.stringify(value);
    try {
      localStorage.setItem(key, str);
      return true;
    } catch (err) {
      console.warn(`[safeStorage] setItem failed for key "${key}", attempting pruning:`, err?.message || err);
      pruneOversizedStorage();

      try {
        // If it's caturra_eg_products, try saving lean version immediately
        if (key === 'caturra_eg_products' && (Array.isArray(value) || typeof value === 'object')) {
          const arr = Array.isArray(value) ? value : (JSON.parse(str) || []);
          const lean = arr.map(p => {
            const copy = { ...p };
            if (copy.image && copy.image.startsWith('data:') && copy.image.length > 30000) {
              copy.image = '/caturra_colombia.jpg';
            }
            if (copy.backImage && copy.backImage.startsWith('data:')) {
              delete copy.backImage;
            }
            delete copy.customBagDesign;
            return copy;
          });
          localStorage.setItem(key, JSON.stringify(lean));
          return true;
        }

        // Retry setting standard key
        localStorage.setItem(key, str);
        return true;
      } catch (retryErr) {
        console.warn(`[safeStorage] Retry failed for key "${key}" - silently ignored to prevent crash:`, retryErr?.message || retryErr);
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
