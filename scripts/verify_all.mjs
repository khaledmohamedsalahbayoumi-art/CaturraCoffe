import fs from 'fs';
import path from 'path';
import http from 'http';

let passed = 0;
let failed = 0;

function check(title, condition) {
  if (condition) {
    console.log(`  ✅ [PASS] ${title}`);
    passed++;
  } else {
    console.error(`  ❌ [FAIL] ${title}`);
    failed++;
  }
}

async function fetchHttp(urlPath) {
  return new Promise((resolve) => {
    http.get({
      host: '127.0.0.1',
      port: 5174,
      path: urlPath,
      timeout: 3000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, length: data.length }));
    }).on('error', (err) => {
      resolve({ status: 500, error: err.message });
    });
  });
}

async function runAllTests() {
  console.log('================================================================');
  console.log('🚀 CATURRA COFFEE ERP & STORE - SYSTEM-WIDE HEALTH AUDIT');
  console.log('================================================================\n');

  // 1. FILE & DATABASE INTEGRITY
  console.log('📁 1. Checking Database & File Integrity:');
  const dbPath = path.resolve('data/server_db.json');
  check('Database file exists (data/server_db.json)', fs.existsSync(dbPath));
  
  const rawDb = fs.readFileSync(dbPath, 'utf8');
  let parsedDb = null;
  try {
    parsedDb = JSON.parse(rawDb);
    check('Database JSON parses without syntax error', true);
  } catch (e) {
    check(`Database JSON parses: ${e.message}`, false);
  }

  if (parsedDb) {
    check(`Products table has items (${parsedDb.products?.length || 0})`, Array.isArray(parsedDb.products) && parsedDb.products.length > 0);
    check(`Invoices table exists (${parsedDb.invoices?.length || 0})`, Array.isArray(parsedDb.invoices));
    check(`Treasury accounts exist (${parsedDb.treasuryAccounts?.length || 0})`, Array.isArray(parsedDb.treasuryAccounts) && parsedDb.treasuryAccounts.length > 0);
    check(`Customers table exists (${parsedDb.customers?.length || 0})`, Array.isArray(parsedDb.customers));
    check(`Users table exists (${parsedDb.users?.length || 0})`, Array.isArray(parsedDb.users));
  }

  // 2. HERO VIDEO & MEDIA
  console.log('\n🎥 2. Checking Media Assets & New Video:');
  const heroVideoPath = path.resolve('public/hero_video.mp4');
  check('hero_video.mp4 exists in public/', fs.existsSync(heroVideoPath));
  if (fs.existsSync(heroVideoPath)) {
    const stats = fs.statSync(heroVideoPath);
    check(`hero_video.mp4 has valid size (${(stats.size / 1024 / 1024).toFixed(2)} MB)`, stats.size > 1000000);
  }

  const posterPath = path.resolve('public/caturra_store_video.jpg');
  check('caturra_store_video.jpg poster exists in public/', fs.existsSync(posterPath));

  // 3. CODE MODIFICATIONS VERIFICATION
  console.log('\n🔍 3. Checking Code Fixes & Recent Updates:');
  const storefrontCode = fs.readFileSync('src/views/ClientStorefront.jsx', 'utf8');
  check('Word "كاتورا" is styled with color #ffffff', storefrontCode.includes("color: '#ffffff'"));
  check('Visa chip removed from store footer', !storefrontCode.includes("{t('visaName')}"));
  check('Hero banner uses hero_video.mp4', storefrontCode.includes('hero_video.mp4'));
  check('Fake 12% OFF hardcoded discount removed from Home', !storefrontCode.includes('Math.round(priceVal * 1.14)'));

  // 4. SERVER & API ENDPOINTS HTTP AUDIT
  console.log('\n🌐 4. Probing Live HTTP Endpoints (Port 5174):');
  const resRoot = await fetchHttp('/');
  check(`Storefront (GET /) responds with 200 OK (got ${resRoot.status})`, resRoot.status === 200);

  const resCaturra = await fetchHttp('/caturra');
  check(`ERP Route (GET /caturra) responds with 200 OK (got ${resCaturra.status})`, resCaturra.status === 200);

  const resApiSync = await fetchHttp('/api/sync');
  check(`Database API (GET /api/sync) responds with 200 OK (got ${resApiSync.status})`, resApiSync.status === 200);

  const resVideo = await fetchHttp('/hero_video.mp4');
  check(`Video Streaming (GET /hero_video.mp4) responds with 200 OK (got ${resVideo.status})`, resVideo.status === 200);

  const resPoster = await fetchHttp('/caturra_store_video.jpg');
  check(`Poster Image (GET /caturra_store_video.jpg) responds with 200 OK (got ${resPoster.status})`, resPoster.status === 200);

  // 5. PRODUCTION BUNDLE INTEGRITY
  console.log('\n📦 5. Checking Production Bundle (dist/):');
  const distHtml = path.resolve('dist/index.html');
  check('dist/index.html exists', fs.existsSync(distHtml));
  const distAssets = fs.readdirSync(path.resolve('dist/assets'));
  check('Compiled CSS asset exists in dist/assets', distAssets.some(f => f.endsWith('.css')));
  check('Compiled JS bundle exists in dist/assets', distAssets.some(f => f.endsWith('.js')));

  console.log('\n================================================================');
  console.log(`🏁 AUDIT SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log('🎯 ALL SYSTEMS OPERATIONAL - ZERO ERRORS DETECTED!\n');
    process.exit(0);
  }
}

runAllTests();

