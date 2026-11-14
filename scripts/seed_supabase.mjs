import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const url = process.argv[2] || process.env.SUPABASE_URL;
const key = process.argv[3] || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('❌ يرجى تمرير رابط ومفتاح Supabase:');
  console.error('node scripts/seed_supabase.mjs <SUPABASE_URL> <SUPABASE_KEY>');
  process.exit(1);
}

const supabase = createClient(url, key);

async function seed() {
  const dbFile = path.resolve(process.cwd(), 'data', 'server_db.json');
  if (!fs.existsSync(dbFile)) {
    console.error('❌ لم يتم العثور على data/server_db.json');
    process.exit(1);
  }

  const rawData = JSON.parse(fs.readFileSync(dbFile, 'utf8') || '{}');
  console.log(`📦 جاري رفع البيانات إلى Supabase...`);
  console.log(`- عدد المنتجات: ${rawData.products?.length || 0}`);
  console.log(`- عدد العملاء: ${rawData.customers?.length || 0}`);
  console.log(`- عدد الدفعات: ${rawData.batches?.length || 0}`);

  const { data, error } = await supabase
    .from('caturra_state')
    .upsert({
      id: 'main',
      data: rawData,
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.error('❌ حدث خطأ أثناء الرفع إلى Supabase:', error);
    process.exit(1);
  }

  console.log('✅ تم ترحيل ورفع جميع بيانات النظام بنجاح إلى Supabase!');
}

seed();
