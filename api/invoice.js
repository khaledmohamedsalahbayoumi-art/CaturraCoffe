import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id, number } = req.query;
    const targetId = id || number;

    if (!targetId) {
      return res.status(400).json({ error: 'Missing invoice id or number' });
    }

    const supabase = getSupabaseClient();
    let invoices = [];

    if (supabase) {
      const { data } = await supabase
        .from('caturra_state')
        .select('data')
        .eq('id', 'main')
        .single();
      if (data && data.data && Array.isArray(data.data.invoices)) {
        invoices = data.data.invoices;
      }
    } else {
      const dbFile = path.resolve(process.cwd(), 'data', 'server_db.json');
      if (fs.existsSync(dbFile)) {
        try {
          const current = JSON.parse(fs.readFileSync(dbFile, 'utf8') || '{}');
          if (Array.isArray(current.invoices)) invoices = current.invoices;
        } catch {}
      }
    }

    const found = invoices.find(i => i.invoiceNumber === targetId || i.id === targetId);
    if (found) {
      return res.status(200).json({ success: true, invoice: found });
    }

    return res.status(404).json({ error: 'Invoice not found' });
  } catch (err) {
    console.error('API /api/invoice error:', err);
    return res.status(500).json({ error: err.message });
  }
}
