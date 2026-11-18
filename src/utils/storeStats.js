/**
 * Utility for dynamically computing live roastery and storefront statistics
 * Based on real catalog data, sales invoices, and store configuration.
 */

export const formatStatNumber = (num, plus = true) => {
  const n = Number(num) || 0;
  const p = plus ? '+' : '';
  if (n >= 1000000) {
    return `${p}${(n / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (n >= 1000) {
    return `${p}${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return `${p}${n}`;
};

export const calculateTotalCupsFromInvoices = (invoices = [], baseCups = 20000) => {
  let soldCups = 0;
  const base = Number(baseCups) || 0;

  if (Array.isArray(invoices)) {
    for (const inv of invoices) {
      if (!inv || inv.status === 'cancelled') continue;
      const items = inv.items || [];
      for (const it of items) {
        if (!it) continue;
        const q = Math.max(1, Number(it.qty || it.quantity || 1) || 1);
        let grams = Number(it.weightGram || it.weight || 0);

        if (!grams && it.name) {
          const kgMatch = String(it.name).match(/(\d+(?:\.\d+)?)\s*(كجم|كيلو|kg)/i);
          const gMatch = String(it.name).match(/(\d+)\s*(جرام|جم|g)/i);
          if (kgMatch) grams = parseFloat(kgMatch[1]) * 1000;
          else if (gMatch) grams = parseFloat(gMatch[1]);
        }

        if (grams > 0) {
          // Standard specialty coffee cup uses ~18g beans
          soldCups += Math.round((grams / 18) * q);
        } else if (it.unitType === 'weight' || (it.category && it.category !== 'tools' && it.category !== 'accessories')) {
          // Default standard retail coffee bag (250g) yields ~14 cups
          soldCups += 14 * q;
        } else if (it.category === 'drinks' || it.category === 'beverages' || it.isBeverage) {
          soldCups += 1 * q;
        }
      }
    }
  }

  return {
    soldCups,
    baseCups: base,
    totalCups: base + soldCups
  };
};

export const calculateStoreStats = ({
  products = [],
  invoices = [],
  contactInfo = {},
  academyArticles = []
} = {}) => {
  const autoCalc = contactInfo?.statsAutoCalc !== false;

  // 1. Lots & Origins
  const coffeeProducts = (products || []).filter(p => {
    if (!p) return false;
    const cat = (p.category || '').toLowerCase();
    if (cat === 'tools' || cat === 'accessories' || cat === 'boxes' || cat === 'gifts') return false;
    return (
      cat === 'coffee' ||
      cat === 'specialty' ||
      cat === 'espresso' ||
      cat === 'filter' ||
      cat === 'fermented' ||
      cat === 'classic_blends' ||
      cat === 'beans' ||
      Boolean(p.isBlend) ||
      Boolean(p.coffeeOrigin)
    );
  });
  const rawLots = coffeeProducts.length > 0 ? coffeeProducts.length : 12;
  const displayLots = contactInfo?.customStatLots?.trim()
    ? contactInfo.customStatLots.trim()
    : (autoCalc ? `+${rawLots}` : '+12');

  // 2. Years of Experience / Craft
  const foundingYear = Number(contactInfo?.foundingYear) || 2021;
  const currentYear = new Date().getFullYear();
  const rawYears = Math.max(5, currentYear - foundingYear);
  const displayYears = contactInfo?.customStatYears?.trim()
    ? contactInfo.customStatYears.trim()
    : `+${rawYears}`;

  // 3. International Quality Certifications
  const rawCerts = Number(contactInfo?.statsCerts ?? 3);
  const displayCerts = contactInfo?.customStatCerts?.trim()
    ? contactInfo.customStatCerts.trim()
    : `+${rawCerts}`;

  // 4. Locations & Branches
  const rawBranches = Number(contactInfo?.statsBranches ?? 2);
  const displayBranches = contactInfo?.customStatBranches?.trim()
    ? contactInfo.customStatBranches.trim()
    : `+${rawBranches}`;

  // 5. Training Academy
  const rawAcademy = Number(contactInfo?.statsAcademy ?? 1);
  const displayAcademy = contactInfo?.customStatAcademy?.trim()
    ? contactInfo.customStatAcademy.trim()
    : `+${rawAcademy}`;

  // 6. Specialty Arabica
  const displayArabica = contactInfo?.customStatArabica?.trim()
    ? contactInfo.customStatArabica.trim()
    : '100%';

  // 7. Cups Served with Passion
  const baseCups = Number(contactInfo?.statsBaseCups ?? 20000);
  const { soldCups, totalCups } = calculateTotalCupsFromInvoices(invoices, baseCups);
  const displayCups = contactInfo?.customStatCups?.trim()
    ? contactInfo.customStatCups.trim()
    : (autoCalc ? formatStatNumber(totalCups) : `+${(baseCups / 1000).toFixed(0)}k`);

  return {
    autoCalc,
    displayLots,
    displayYears,
    displayCerts,
    displayBranches,
    displayAcademy,
    displayArabica,
    displayCups,
    raw: {
      lots: rawLots,
      years: rawYears,
      certs: rawCerts,
      branches: rawBranches,
      academy: rawAcademy,
      baseCups,
      soldCups,
      totalCups
    }
  };
};
