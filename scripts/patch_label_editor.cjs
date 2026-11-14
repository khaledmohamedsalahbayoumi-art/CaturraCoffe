const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'public', 'label-studio.html');
let html = fs.readFileSync(targetPath, 'utf8');

// 1. Add return buttons to header
const headerTarget = '<button id="btnLoad" class="ghost">فتح ملف</button>';
const headerRepl = `<button id="btnLoad" class="ghost">فتح ملف</button>
  <a href="/admin" class="btn" style="text-decoration:none;display:inline-flex;align-items:center;gap:5px;background:#2C1810;color:#FFF8EE;border-color:#2C1810;font-weight:800;font-size:12px">⬅️ لوحة التحكم</a>
  <a href="/store" class="btn" style="text-decoration:none;display:inline-flex;align-items:center;gap:5px;background:#FFF8EE;color:#2C1810;border-color:#8B5E34;font-weight:700;font-size:12px">☕ متجر كاتورا</a>`;

if (html.includes(headerTarget) && !html.includes('href="/admin"')) {
  html = html.replace(headerTarget, headerRepl);
}

// 2. Add URLSearchParams handling before </script>
const tailTarget = 'libLoad().then(() => buildForm());';
const tailRepl = `libLoad().then(() => buildForm());
try {
  const q = new URLSearchParams(window.location.search);
  if (q.has("nameAr") || q.has("nameEn") || q.has("country") || q.has("crop")) {
    if (!S) S = stateFor('S:8', '250g', DATA);
    if (q.get("nameAr")) S.front.nameAr = q.get("nameAr");
    if (q.get("nameEn")) S.front.nameEn = q.get("nameEn");
    if (q.get("country")) {
      S.crop.country = q.get("country");
      const cLow = q.get("country").toLowerCase();
      if (typeof THEMES !== 'undefined' && THEMES[cLow]) S.theme = cLow;
    }
    if (q.get("region")) S.crop.region = q.get("region");
    if (q.get("variety")) S.crop.variety = q.get("variety");
    if (q.get("process")) S.crop.process = q.get("process");
    if (q.get("altitude")) S.crop.altitude = q.get("altitude");
    if (q.get("roast")) S.front.roast = q.get("roast");
    if (q.get("notes")) {
      S.front.notesEn = q.get("notes");
      S.front.notesAr = q.get("notesAr") || q.get("notes");
    }
    if (q.get("acidity")) S.front.acidity = q.get("acidity");
    if (q.get("weight")) S.front.weight = q.get("weight");
    if (q.get("size") && typeof BAG !== 'undefined' && BAG[q.get("size")]) S.size = q.get("size");
    try { applyTheme(S); } catch (e) {}
    buildForm();
    drawPreview();
  }
} catch (err) { console.warn("URL params init error:", err); }
`;

if (html.includes(tailTarget) && !html.includes('new URLSearchParams(window.location.search)')) {
  html = html.replace(tailTarget, tailRepl);
}

fs.writeFileSync(targetPath, html, 'utf8');
console.log('Successfully patched public/label-studio.html');
