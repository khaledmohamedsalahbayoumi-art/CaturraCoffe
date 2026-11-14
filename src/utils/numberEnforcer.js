// ============================================================================
// GLOBAL NUMBER & DIGIT ENFORCER - CATURRA COFFEE ERP
// Ensures 100% of numbers across the entire system use English / Western Arabic digits (0-9)
// ============================================================================

const ARABIC_INDIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
const PERSIAN_INDIC_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

const DIGIT_MAP = {
  '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
  '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9',
  '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4',
  '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9',
  '٫': '.', '،': ','
};

/**
 * Convert any string with Eastern Arabic numerals (٠-٩) into Western English digits (0-9)
 */
export const toLatinDigits = (val) => {
  if (val === null || val === undefined) return '';
  return String(val).replace(/[٠-٩۰-۹٫]/g, ch => DIGIT_MAP[ch] || ch);
};

/**
 * Format any number into English digits with thousand separators
 */
export const formatEnglishNumber = (num, minDecimals = 0, maxDecimals = 2) => {
  const n = Number(num || 0);
  if (isNaN(n)) return '0';
  return n.toLocaleString('en-US', {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals
  });
};

/**
 * Robust Arabic text normalizer for search and record matching
 * Normalizes Alef variations (أ إ آ -> ا), Ta Marbuta (ة -> ه), Alef Maksura (ى -> ي) and collapses spaces
 */
export const normalizeArabic = (str) => {
  if (!str) return '';
  return String(str)
    .trim()
    .toLowerCase()
    .replace(/[إأآا]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ');
};

/**
 * Robust phone normalizer: removes all non-digits and standardizes Egyptian prefixes
 */
export const normalizePhone = (phone) => {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('20') && digits.length === 12) {
    return '0' + digits.substring(2);
  }
  return digits;
};

// ----------------------------------------------------------------------------
// 1. Monkey-Patch Number.prototype.toLocaleString
// ----------------------------------------------------------------------------
if (typeof Number !== 'undefined' && Number.prototype) {
  const originalNumberToLocaleString = Number.prototype.toLocaleString;

  Number.prototype.toLocaleString = function (locales, options) {
    // If no locale, or Arabic locale without latn numbering system, force en-US
    if (!locales || (typeof locales === 'string' && locales.startsWith('ar'))) {
      return originalNumberToLocaleString.call(this, 'en-US', options);
    }
    const safeOptions = options ? { ...options, numberingSystem: 'latn' } : { numberingSystem: 'latn' };
    return originalNumberToLocaleString.call(this, locales, safeOptions);
  };
}

// ----------------------------------------------------------------------------
// 2. Monkey-Patch BigInt.prototype.toLocaleString
// ----------------------------------------------------------------------------
if (typeof BigInt !== 'undefined' && BigInt.prototype) {
  const originalBigIntToLocaleString = BigInt.prototype.toLocaleString;

  BigInt.prototype.toLocaleString = function (locales, options) {
    if (!locales || (typeof locales === 'string' && locales.startsWith('ar'))) {
      return originalBigIntToLocaleString.call(this, 'en-US', options);
    }
    const safeOptions = options ? { ...options, numberingSystem: 'latn' } : { numberingSystem: 'latn' };
    return originalBigIntToLocaleString.call(this, locales, safeOptions);
  };
}

// ----------------------------------------------------------------------------
// 3. Monkey-Patch Date.prototype to always use English digits
// ----------------------------------------------------------------------------
if (typeof Date !== 'undefined' && Date.prototype) {
  const originalDateToLocaleString = Date.prototype.toLocaleString;
  const originalDateToLocaleDateString = Date.prototype.toLocaleDateString;
  const originalDateToLocaleTimeString = Date.prototype.toLocaleTimeString;

  const fixDateLocale = (locales, options) => {
    const opts = { ...(options || {}), numberingSystem: 'latn' };
    let target = locales || 'ar-EG-u-nu-latn';
    if (typeof target === 'string' && target.startsWith('ar') && !target.includes('nu-')) {
      target = `${target}-u-nu-latn`;
    }
    return { target, opts };
  };

  Date.prototype.toLocaleString = function (locales, options) {
    const { target, opts } = fixDateLocale(locales, options);
    return originalDateToLocaleString.call(this, target, opts);
  };

  Date.prototype.toLocaleDateString = function (locales, options) {
    const { target, opts } = fixDateLocale(locales, options);
    return originalDateToLocaleDateString.call(this, target, opts);
  };

  Date.prototype.toLocaleTimeString = function (locales, options) {
    const { target, opts } = fixDateLocale(locales, options);
    return originalDateToLocaleTimeString.call(this, target, opts);
  };
}

// ----------------------------------------------------------------------------
// 4. Monkey-Patch Intl.NumberFormat and Intl.DateTimeFormat
// ----------------------------------------------------------------------------
if (typeof Intl !== 'undefined') {
  if (Intl.NumberFormat) {
    const OriginalNumberFormat = Intl.NumberFormat;
    const PatchedNumberFormat = function (locales, options = {}) {
      const opts = { ...options, numberingSystem: 'latn' };
      const target = (!locales || (typeof locales === 'string' && locales.startsWith('ar'))) ? 'en-US' : locales;
      return new OriginalNumberFormat(target, opts);
    };
    PatchedNumberFormat.prototype = OriginalNumberFormat.prototype;
    PatchedNumberFormat.supportedLocalesOf = OriginalNumberFormat.supportedLocalesOf;
    Intl.NumberFormat = PatchedNumberFormat;
  }

  if (Intl.DateTimeFormat) {
    const OriginalDateTimeFormat = Intl.DateTimeFormat;
    const PatchedDateTimeFormat = function (locales, options = {}) {
      const opts = { ...options, numberingSystem: 'latn' };
      let target = locales || 'ar-EG-u-nu-latn';
      if (typeof target === 'string' && target.startsWith('ar') && !target.includes('nu-')) {
        target = `${target}-u-nu-latn`;
      }
      return new OriginalDateTimeFormat(target, opts);
    };
    PatchedDateTimeFormat.prototype = OriginalDateTimeFormat.prototype;
    PatchedDateTimeFormat.supportedLocalesOf = OriginalDateTimeFormat.supportedLocalesOf;
    Intl.DateTimeFormat = PatchedDateTimeFormat;
  }
}

// ----------------------------------------------------------------------------
// 5. Automatic Input Sanitization for Arabic Numerals
// Converts typed Eastern Arabic digits into 0-9 in all form inputs automatically
// ----------------------------------------------------------------------------
if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  document.addEventListener('input', (e) => {
    const target = e.target;
    if (!target) return;
    const tagName = target.tagName;
    if (tagName === 'INPUT' || tagName === 'TEXTAREA') {
      const val = target.value;
      if (typeof val === 'string' && /[٠-٩۰-۹٫]/.test(val)) {
        const start = target.selectionStart;
        const end = target.selectionEnd;
        target.value = toLatinDigits(val);
        if (start !== null && end !== null && target.type !== 'number') {
          try {
            target.setSelectionRange(start, end);
          } catch {
            // Some input types don't support setSelectionRange
          }
        }
      }
    }
  }, true);
}
