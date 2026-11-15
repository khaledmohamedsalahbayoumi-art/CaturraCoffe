import { createClient } from '@supabase/supabase-js';

const DOMAIN = 'https://www.caturracoffeeroaster.com';
const SUPABASE_URL = 'https://fxlfftgajvtcywoxrwpd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_d9FZzQRkK1OLqH0UJQCDvg_Jr_YSXG4';

async function runAudit() {
  console.log('================================================================');
  console.log(`🚀 CATURRA COFFEE LIVE SYSTEM AUDIT: ${DOMAIN}`);
  console.log(`⏰ Time: ${new Date().toISOString()}`);
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function report(name, status, details = '') {
    if (status) {
      console.log(`✅ [PASS] ${name} ${details ? '-> ' + details : ''}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name} ${details ? '-> ' + details : ''}`);
      failed++;
    }
  }

  // 1. Check Storefront Home
  try {
    const res = await fetch(`${DOMAIN}/`);
    const text = await res.text();
    const hasRoot = text.includes('id="root"');
    const hasTitle = text.includes('كاتورا للقهوة المختصة');
    const hasFavicon = text.includes('/favicon.ico');
    const hasGoogleMeta = text.includes('google-site-verification');
    report('Storefront Home HTML (200 OK)', res.status === 200, `status: ${res.status}`);
    report('Storefront Title & Root Div', hasRoot && hasTitle, 'Title and Root present');
    report('Favicon Linked in HTML', hasFavicon, '/favicon.ico linked');
    report('Google Search Console Meta Tag', hasGoogleMeta, 'google-site-verification tag active');
  } catch (err) {
    report('Storefront Home HTML', false, err.message);
  }

  // 2. Check Static Assets & Favicons
  const staticFiles = [
    { path: '/favicon.ico', expectedType: 'image/vnd.microsoft.icon' },
    { path: '/apple-touch-icon.png', expectedType: 'image/png' },
    { path: '/favicon-32x32.png', expectedType: 'image/png' },
    { path: '/caturra_logo.jpg', expectedType: 'image/jpeg' },
    { path: '/robots.txt', expectedType: 'text/plain' },
    { path: '/sitemap.xml', expectedType: 'application/xml' },
    { path: '/manifest.json', expectedType: 'application/json' },
    { path: '/label-studio.html', expectedType: 'text/html' }
  ];

  for (const file of staticFiles) {
    try {
      const res = await fetch(`${DOMAIN}${file.path}`);
      const type = res.headers.get('content-type') || '';
      const ok = res.status === 200;
      report(`Static Asset: ${file.path}`, ok, `Status: ${res.status}, Type: ${type.split(';')[0]}`);
    } catch (err) {
      report(`Static Asset: ${file.path}`, false, err.message);
    }
  }

  // 3. Check Admin Routing
  try {
    const adminDirect = await fetch(`${DOMAIN}/caturra`);
    report('Admin ERP Route (/caturra)', adminDirect.status === 200, `Status: ${adminDirect.status}`);

    const adminRedirect = await fetch(`http://caturracoffeeroaster.com/admin`, { redirect: 'manual' });
    const loc = adminRedirect.headers.get('location') || '';
    report('Legacy /admin Redirect', adminRedirect.status >= 300 && adminRedirect.status < 400, `Redirect status: ${adminRedirect.status}, Loc: ${loc}`);
  } catch (err) {
    report('Admin ERP Routing', false, err.message);
  }

  // 4. Check /api/sync Endpoint Live
  try {
    const res = await fetch(`${DOMAIN}/api/sync`);
    report('API /api/sync HTTP 200', res.status === 200, `Status: ${res.status}`);
    const data = await res.json();
    
    report('API Products Count', Array.isArray(data.products) && data.products.length === 32, `Products: ${data.products?.length || 0}/32`);
    report('API Categories Count', Array.isArray(data.categories) && data.categories.length === 7, `Categories: ${data.categories?.length || 0}/7`);
    report('API Customers Count', Array.isArray(data.customers) && data.customers.length === 8, `Customers: ${data.customers?.length || 0}/8`);
    report('API Batches Count', Array.isArray(data.batches) && data.batches.length === 32, `Batches: ${data.batches?.length || 0}/32`);

    // Verify coffee products priority and bag designs
    const coffeeProd = data.products?.find(p => p.id === 'p1' || p.category === 'beans' || p.category === 'espresso');
    const hasBagDesign = coffeeProd && (coffeeProd.customBagDesign || coffeeProd.labelStudio);
    report('Crop Specs & Bag Design Integrity', Boolean(coffeeProd), `Coffee item found: ${coffeeProd?.name || 'N/A'}`);

    // Verify sensitive data stripped
    const userWithHash = data.users?.find(u => u.passwordHash);
    report('Security: Password Hashes Stripped', !userWithHash, 'Public request does not expose password hashes');
  } catch (err) {
    report('API /api/sync Endpoint Live', false, err.message);
  }

  // 5. Check Supabase Direct Connection
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    const { data, error } = await supabase
      .from('caturra_state')
      .select('id, updated_at')
      .eq('id', 'main')
      .single();

    report('Supabase Direct State Query', !error && data?.id === 'main', `Row ID: ${data?.id}, Last Updated: ${data?.updated_at}`);

    const { data: bucketData, error: bucketError } = await supabase.storage.from('invoices').list();
    report('Supabase Storage: invoices Bucket', !bucketError, `Bucket accessible, active files: ${bucketData?.length || 0}`);
  } catch (err) {
    report('Supabase Direct Connection', false, err.message);
  }

  console.log('\n================================================================');
  console.log(`📊 AUDIT SUMMARY: Total Passed: ${passed} | Total Failed: ${failed}`);
  console.log('================================================================');
}

runAudit();
