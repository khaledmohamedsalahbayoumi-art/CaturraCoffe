/**
 * Source Code & Asset Protection Utility
 * Prevents right-click context menu ("عرض مصدر الصفحة" / "فحص"),
 * blocks devtools keyboard shortcuts (F12, Ctrl+U, Ctrl+Shift+I/J/C, Ctrl+S),
 * and prevents dragging images, while keeping input & form fields fully functional.
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
    },
    { capture: true }
  );

  // 3. Disable Dragging Images onto desktop
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

  // 4. Subtle security notice in console if opened via menu
  try {
    const titleStyle = 'color: #8B5E34; font-size: 18px; font-weight: 900;';
    const warningStyle = 'color: #DC2626; font-size: 13px; font-weight: bold;';
    console.log('%cمحمصة ومتجر كاتورا للقهوة المختصة (Caturra Coffee Roaster)', titleStyle);
    console.log('%c🔒 تنبيه: كافة حقوق التصميم والبرمجة والمحتوى محفوظة لمحمصة كاتورا. يمنع نسخ أو إعادة استخدام الأكواد.', warningStyle);
  } catch (_) {}
}
