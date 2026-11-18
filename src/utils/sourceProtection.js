/**
 * Comprehensive Source Code, Media & Brand Protection Utility
 * - Blocks right-click context menu ("عرض مصدر الصفحة" / "فحص")
 * - Blocks devtools & inspect shortcuts (F12, Ctrl+U, Ctrl+Shift+I/J/C, Ctrl+S, Ctrl+P)
 * - Prevents media dragging & long-press download popups
 * - Enforces anti-debugging and console traps in production
 * - Preserves full usability of customer input forms & checkout
 */

if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  // 1. Disable Right-Click Context Menu (except inside inputs/textareas)
  document.addEventListener(
    'contextmenu',
    (e) => {
      const target = e.target;
      const tag = target?.tagName ? target.tagName.toLowerCase() : '';
      const isInput = tag === 'input' || tag === 'textarea' || target?.isContentEditable;
      if (!isInput) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    },
    { capture: true }
  );

  // 2. Block View-Source & DevTools keyboard shortcuts
  document.addEventListener(
    'keydown',
    (e) => {
      const isMac = (navigator?.platform || '').toUpperCase().indexOf('MAC') >= 0;
      const ctrlOrCmd = isMac ? e.metaKey : e.ctrlKey;
      const key = (e.key || '').toLowerCase();
      const code = e.keyCode || e.which;

      // F12 (Inspect / DevTools)
      if (key === 'f12' || code === 123) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl + U (View Source / عرض المصدر)
      if (ctrlOrCmd && (key === 'u' || code === 85)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl + Shift + I / J / C (DevTools, Console, Element Picker)
      if (
        ctrlOrCmd &&
        e.shiftKey &&
        (key === 'i' || key === 'j' || key === 'c' || code === 73 || code === 74 || code === 67)
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl + S (Save Page / حفظ الصفحة)
      if (ctrlOrCmd && (key === 's' || code === 83)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl + P (Print Page / طباعة الصفحة مباشرة - إلا لو كان داخل نافذة طباعة مخصصة)
      if (ctrlOrCmd && (key === 'p' || code === 80)) {
        const isPrintModalOpen = document.querySelector('.printable-invoice-modal, .pos-receipt-print');
        if (!isPrintModalOpen) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }
    },
    { capture: true }
  );

  // 3. Disable Dragging Images & Videos onto desktop
  document.addEventListener(
    'dragstart',
    (e) => {
      const tag = e.target?.tagName ? e.target.tagName.toLowerCase() : '';
      if (tag === 'img' || tag === 'video') {
        e.preventDefault();
        return false;
      }
    },
    { capture: true }
  );

  // 4. Anti-DevTools & Console Clearing (Production Only)
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.PROD) {
    try {
      let devtoolsOpen = false;
      const detector = new Image();
      Object.defineProperty(detector, 'id', {
        get: function () {
          devtoolsOpen = true;
        }
      });

      setInterval(() => {
        try {
          devtoolsOpen = false;
          console.dir(detector);
          if (devtoolsOpen) {
            console.clear();
            console.log('%c🔒 محمصة كاتورا للقهوة المختصة (Caturra Coffee Roaster)', 'color: #8B5E34; font-size: 16px; font-weight: 900;');
            console.log('%c⚠️ تنبيه: كافة حقوق الملكية والتصميم والبرمجة محمية قانونياً.', 'color: #DC2626; font-size: 13px; font-weight: bold;');
          }
        } catch (_) {}
      }, 2000);
    } catch (_) {}
  }

  // 5. Security Watermark Notice
  try {
    const titleStyle = 'color: #8B5E34; font-size: 18px; font-weight: 900;';
    const warningStyle = 'color: #DC2626; font-size: 13px; font-weight: bold;';
    console.log('%cمحمصة ومتجر كاتورا للقهوة المختصة (Caturra Coffee Roaster)', titleStyle);
    console.log('%c🔒 تنبيه: كافة حقوق التصميم والبرمجة والمحتوى محفوظة لمحمصة كاتورا. يمنع نسخ أو إعادة استخدام الأكواد.', warningStyle);
  } catch (_) {}
}
