import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

const ADMIN_SECRET_HEADER = 'x-caturra-erp-auth';
const ADMIN_SECRET_TOKEN = 'caturra_sec_token_v2';

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-caturra-erp-auth');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabase = getSupabaseClient();

  // 1. GET: Return complete system state
  if (req.method === 'GET') {
    try {
      let stateData = {};

      if (supabase) {
        const { data, error } = await supabase
          .from('caturra_state')
          .select('data')
          .eq('id', 'main')
          .single();

        if (data && data.data) {
          stateData = data.data;
        } else if (error && error.code !== 'PGRST116') { // PGRST116 is row not found
          console.warn('Supabase fetch error, fallback to empty:', error);
        }
      } else {
        // Fallback for local filesystem if Supabase not configured yet
        const dbFile = path.resolve(process.cwd(), 'data', 'server_db.json');
        if (fs.existsSync(dbFile)) {
          stateData = JSON.parse(fs.readFileSync(dbFile, 'utf8') || '{}');
        }
      }

      const isInternalAdmin = req.headers[ADMIN_SECRET_HEADER] === ADMIN_SECRET_TOKEN;
      if (!isInternalAdmin && Array.isArray(stateData.users)) {
        stateData.users = stateData.users.map(u => {
          const { passwordHash, ...safeUser } = u;
          return safeUser;
        });
      }

      return res.status(200).json(stateData);
    } catch (err) {
      console.error('API /api/sync GET error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  // 2. POST: Update and merge state
  if (req.method === 'POST') {
    try {
      const incoming = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
      let current = {};

      if (supabase) {
        const { data } = await supabase
          .from('caturra_state')
          .select('data')
          .eq('id', 'main')
          .single();

        if (data && data.data) {
          current = data.data;
        }
      } else {
        const dbFile = path.resolve(process.cwd(), 'data', 'server_db.json');
        if (fs.existsSync(dbFile)) {
          current = JSON.parse(fs.readFileSync(dbFile, 'utf8') || '{}');
        }
      }

      // Merge invoices safely
      let mergedInvoices = Array.isArray(current.invoices) ? [...current.invoices] : [];
      if (incoming.wipeInvoices || incoming.replaceInvoices) {
        mergedInvoices = Array.isArray(incoming.invoices) ? incoming.invoices : [];
      } else if (Array.isArray(incoming.invoices)) {
        const map = new Map(mergedInvoices.map(i => [String(i.invoiceNumber || i.id), i]));
        incoming.invoices.forEach(inv => {
          if (inv && (inv.invoiceNumber || inv.id)) {
            const key = String(inv.invoiceNumber || inv.id);
            const existing = map.get(key);
            map.set(key, existing ? { ...existing, ...inv } : inv);
          }
        });
        mergedInvoices = Array.from(map.values());
      }

      // Merge users safely
      let mergedUsers = Array.isArray(current.users) ? [...current.users] : [];
      const isAuthorized = req.headers[ADMIN_SECRET_HEADER] === ADMIN_SECRET_TOKEN;

      if (Array.isArray(incoming.users) && isAuthorized) {
        const map = new Map(mergedUsers.map(u => [String(u.id || u.username).toLowerCase(), u]));
        incoming.users.forEach(u => {
          if (u && (u.id || u.username)) {
            const key = String(u.id || u.username).toLowerCase();
            const existing = map.get(key);
            map.set(key, existing ? { ...existing, ...u } : u);
          }
        });
        mergedUsers = Array.from(map.values());
      }

      // Merge single updated product atomically if provided
      let mergedProducts = Array.isArray(incoming.products) ? incoming.products : (Array.isArray(current.products) ? [...current.products] : []);
      if (incoming.updatedProduct && incoming.updatedProduct.id) {
        const idx = mergedProducts.findIndex(p => p.id === incoming.updatedProduct.id);
        if (idx !== -1) {
          mergedProducts[idx] = { ...mergedProducts[idx], ...incoming.updatedProduct };
        } else {
          mergedProducts.push(incoming.updatedProduct);
        }
      }

      const merged = {
        ...current,
        ...incoming,
        products: mergedProducts,
        invoices: mergedInvoices,
        users: mergedUsers
      };

      if (supabase) {
        const { error: upsertErr } = await supabase
          .from('caturra_state')
          .upsert({
            id: 'main',
            data: merged,
            updated_at: new Date().toISOString()
          });

        if (upsertErr) {
          throw upsertErr;
        }
      } else {
        const dbDir = path.resolve(process.cwd(), 'data');
        const dbFile = path.resolve(dbDir, 'server_db.json');
        if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });
        fs.writeFileSync(dbFile, JSON.stringify(merged, null, 2), 'utf8');
      }

      return res.status(200).json({ success: true, timestamp: Date.now() });
    } catch (err) {
      console.error('API /api/sync POST error:', err);
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
