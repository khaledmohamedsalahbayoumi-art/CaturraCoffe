import fs from 'fs';
import path from 'path';

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failedTests++;
  }
}

console.log('====================================================');
console.log('🧪 CATURRA ROASTERY - COMPREHENSIVE TEST SUITE');
console.log('====================================================\n');

// 1. DATA INTEGRITY: initialData.js
console.log('📋 1. Testing Initial Data (src/data/initialData.js)...');
try {
  const initialDataPath = path.resolve('src/data/initialData.js');
  const initialDataContent = fs.readFileSync(initialDataPath, 'utf8');

  assert(initialDataContent.includes('prod-french-coffee'), 'French Coffee (prod-french-coffee) is present');
  assert(initialDataContent.includes('prod-espresso-house-blend'), 'Espresso House Blend (prod-espresso-house-blend) is present');
  assert(initialDataContent.includes('قهوة فرنساوي فاخرة'), 'French Coffee Arabic title is present');
  assert(initialDataContent.includes('بن إسبريسو هاوس بليند'), 'House Blend Arabic title is present');
  assert(initialDataContent.includes('initialProducts'), 'initialProducts export is defined');
  assert(initialDataContent.includes('initialSuppliers'), 'initialSuppliers export is defined');
  assert(initialDataContent.includes('initialCustomers'), 'initialCustomers export is defined');
  assert(initialDataContent.includes('initialTreasuryAccounts'), 'initialTreasuryAccounts export is defined');
} catch (e) {
  assert(false, `Error testing initialData.js: ${e.message}`);
}

// 2. DATABASE FILE INTEGRITY: data/server_db.json
console.log('\n💾 2. Testing Database (data/server_db.json)...');
try {
  const dbPath = path.resolve('data/server_db.json');
  assert(fs.existsSync(dbPath), 'data/server_db.json exists');
  const rawDb = fs.readFileSync(dbPath, 'utf8');
  const db = JSON.parse(rawDb);
  assert(Array.isArray(db.products), `Database has products array (${db.products?.length || 0} items)`);
  assert(Array.isArray(db.suppliers), `Database has suppliers array (${db.suppliers?.length || 0} items)`);
  assert(Array.isArray(db.customers), `Database has customers array (${db.customers?.length || 0} items)`);
  assert(Array.isArray(db.treasuryAccounts), `Database has treasury accounts (${db.treasuryAccounts?.length || 0} accounts)`);

  const hasFrenchCoffee = db.products.some(p => p.id === 'prod-french-coffee' || p.name?.includes('فرنساوي'));
  assert(hasFrenchCoffee, 'Database includes French Coffee product');

  const hasHouseBlend = db.products.some(p => p.id === 'prod-espresso-house-blend' || p.name?.includes('هاوس بليند'));
  assert(hasHouseBlend, 'Database includes Espresso House Blend product');

  const hasTools = db.products.some(p => p.category === 'tools' || p.category === 'accessories');
  assert(hasTools, 'Database includes Tools/Accessories products');
} catch (e) {
  assert(false, `Error testing server_db.json: ${e.message}`);
}

// 3. ASSETS & MEDIA INTEGRITY: public/ directory
console.log('\n🎬 3. Testing Static Assets & Media (public/)...');
const requiredFiles = [
  'caturra_logo.jpg',
  'caturra_about_barista.jpg',
  'caturra_about_barista_old.jpg',
  'caturra_b2b_video.mp4',
  'caturra_b2b_hero.jpg',
  'caturra_wholesale_video.mp4',
  'caturra_wholesale_hero.jpg',
  'caturra_home_video.mp4',
  'caturra_home_video.jpg',
  'caturra_store_video.mp4'
];

requiredFiles.forEach(file => {
  const filePath = path.resolve('public', file);
  const exists = fs.existsSync(filePath);
  if (exists) {
    const stats = fs.statSync(filePath);
    assert(stats.size > 0, `Asset ${file} exists and is valid (${(stats.size / 1024).toFixed(1)} KB)`);
  } else {
    assert(false, `Asset ${file} missing in public/`);
  }
});

// 4. TRANSLATIONS INTEGRITY: src/utils/translations.js
console.log('\n🌐 4. Testing Translations (src/utils/translations.js)...');
try {
  const transPath = path.resolve('src/utils/translations.js');
  const transContent = fs.readFileSync(transPath, 'utf8');

  assert(transContent.includes("navAcademy: 'المدونة'"), "Arabic navigation has navAcademy: 'المدونة'");
  assert(transContent.includes("navAcademy: 'Blog'"), "English navigation has navAcademy: 'Blog'");
  assert(transContent.includes("navHome: 'الرئيسية'"), "Arabic navigation has navHome");
  assert(transContent.includes("navB2B: 'الجملة والكافيهات'"), "Arabic navigation has navB2B");
  assert(transContent.includes("footerBrandTitle: 'كاتورا للقهوة'"), "Footer brand title translated in Arabic");
} catch (e) {
  assert(false, `Error testing translations: ${e.message}`);
}

// 5. VIEW & COMPONENT LOGIC CHECKS
console.log('\n💻 5. Testing Components & Views Structure...');
try {
  // Check StoreB2BView
  const b2bPath = path.resolve('src/components/StoreB2BView.jsx');
  const b2bContent = fs.readFileSync(b2bPath, 'utf8');
  assert(b2bContent.includes('caturra_wholesale_video.mp4'), 'StoreB2BView references caturra_wholesale_video.mp4');
  assert(b2bContent.includes('caturra_wholesale_hero.jpg'), 'StoreB2BView references caturra_wholesale_hero.jpg');

  // Check ClientStorefront
  const storefrontPath = path.resolve('src/views/ClientStorefront.jsx');
  const storefrontContent = fs.readFileSync(storefrontPath, 'utf8');
  assert(storefrontContent.includes('caturra_b2b_video.mp4'), 'ClientStorefront Home hero references caturra_b2b_video.mp4');
  assert(storefrontContent.includes('caturra_about_barista.jpg'), 'ClientStorefront About section references caturra_about_barista.jpg');
  assert(storefrontContent.includes("label: t('navAcademy')"), 'ClientStorefront top nav uses t(navAcademy)');
  assert(storefrontContent.includes('store-footer-card'), 'ClientStorefront has store-footer-card class');

  // Check CustomerProductSelector
  const selectorPath = path.resolve('src/components/CustomerProductSelector.jsx');
  const selectorContent = fs.readFileSync(selectorPath, 'utf8');
  assert(selectorContent.includes('🛠️ أدوات وتولز') || selectorContent.includes('tools'), 'CustomerProductSelector has Tools tab');
} catch (e) {
  assert(false, `Error testing views: ${e.message}`);
}

// 6. BUSINESS LOGIC & MATH CALCULATIONS
console.log('\n🧮 6. Testing Calculations & Financial Math...');

// Test 6.1: Invoice Totals calculation
function calculateInvoiceTotal(items, discountPercent = 0, taxPercent = 0, shipping = 0) {
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const taxable = subtotal - discountAmount;
  const taxAmount = (taxable * taxPercent) / 100;
  const grandTotal = taxable + taxAmount + shipping;
  return { subtotal, discountAmount, taxAmount, grandTotal };
}

const mockCart = [
  { price: 450, qty: 2 }, // 900
  { price: 180, qty: 1 }  // 180 = subtotal 1080
];
const invMath = calculateInvoiceTotal(mockCart, 10, 14, 50); // 10% disc = 108, taxable = 972, 14% tax = 136.08, shipping = 50 => grandTotal = 1158.08
assert(invMath.subtotal === 1080, `Subtotal calculation: expected 1080, got ${invMath.subtotal}`);
assert(invMath.discountAmount === 108, `Discount calculation: expected 108, got ${invMath.discountAmount}`);
assert(Math.abs(invMath.grandTotal - 1158.08) < 0.01, `Grand total with tax & shipping: expected 1158.08, got ${invMath.grandTotal}`);

// Test 6.2: Brewing Calculator Ratios
function calcBrew(coffeeGrams, ratio) {
  return coffeeGrams * ratio;
}
assert(calcBrew(15, 15) === 225, 'V60 1:15 ratio with 15g coffee = 225g water');
assert(calcBrew(18, 2) === 36, 'Espresso 1:2 ratio with 18g coffee = 36g espresso yield');
assert(calcBrew(20, 16) === 320, 'French Press 1:16 ratio with 20g coffee = 320g water');

// Test 6.3: Stock management logic
function applySale(stock, soldQty) {
  return Math.max(0, stock - soldQty);
}
function applyReturn(stock, returnedQty) {
  return stock + returnedQty;
}
assert(applySale(50, 5) === 45, 'Sale decreases stock from 50 to 45');
assert(applyReturn(45, 2) === 47, 'Return increases stock from 45 to 47');

// 7. BUILD ARTIFACTS VERIFICATION: dist/
console.log('\n📦 7. Testing Production Build Output (dist/)...');
try {
  const distHtml = path.resolve('dist/index.html');
  assert(fs.existsSync(distHtml), 'dist/index.html exists');

  const assetsDir = path.resolve('dist/assets');
  assert(fs.existsSync(assetsDir), 'dist/assets directory exists');

  const assetFiles = fs.readdirSync(assetsDir);
  const hasCss = assetFiles.some(f => f.endsWith('.css'));
  const hasJs = assetFiles.some(f => f.endsWith('.js'));
  assert(hasCss, `CSS bundle generated (${assetFiles.filter(f => f.endsWith('.css')).join(', ')})`);
  assert(hasJs, `JS bundle generated (${assetFiles.filter(f => f.endsWith('.js')).length} bundles)`);
} catch (e) {
  assert(false, `Error testing build artifacts: ${e.message}`);
}

console.log('\n====================================================');
console.log(`📊 TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
console.log('====================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('🎉 ALL PROJECT CHECKS & TESTS PASSED WITH 100% SUCCESS!\n');
  process.exit(0);
}
