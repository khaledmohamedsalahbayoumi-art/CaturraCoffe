import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const { invoiceNumber, imageData, invoice } = data;

    let safeName = 'INV-receipt';
    if (invoiceNumber) {
      safeName = String(invoiceNumber).replace(/[^a-zA-Z0-9_-]/g, '_');
    }

    let publicUrl = `/invoices/${safeName}.jpg`;
    const supabase = getSupabaseClient();

    if (imageData && typeof imageData === 'string') {
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
      const fileBuffer = Buffer.from(base64Data, 'base64');

      if (supabase) {
        // Upload to Supabase Storage
        const filePath = `${safeName}.jpg`;
        const { error: uploadError } = await supabase.storage
          .from('invoices')
          .upload(filePath, fileBuffer, {
            contentType: 'image/jpeg',
            upsert: true
          });

        if (uploadError) {
          console.error('Supabase storage upload error:', uploadError);
        } else {
          const { data: urlData } = supabase.storage
            .from('invoices')
            .getPublicUrl(filePath);
          if (urlData && urlData.publicUrl) {
            publicUrl = urlData.publicUrl;
          }
        }
      } else {
        // Local fallback
        const invoicesDir = path.resolve(process.cwd(), 'public', 'invoices');
        if (!fs.existsSync(invoicesDir)) fs.mkdirSync(invoicesDir, { recursive: true });
        fs.writeFileSync(path.resolve(invoicesDir, `${safeName}.jpg`), fileBuffer);
      }
    }

    // Persist invoice in state
    if (invoice && (invoice.invoiceNumber || invoice.id)) {
      const cleanInvoice = { ...invoice };
      cleanInvoice.transferReceipt = publicUrl;

      if (supabase) {
        const { data: curState } = await supabase
          .from('caturra_state')
          .select('data')
          .eq('id', 'main')
          .single();

        let current = curState && curState.data ? curState.data : {};
        const existing = Array.isArray(current.invoices) ? current.invoices : [];
        const filtered = existing.filter(i => i.invoiceNumber !== cleanInvoice.invoiceNumber && i.id !== cleanInvoice.id);
        current.invoices = [cleanInvoice, ...filtered];

        await supabase
          .from('caturra_state')
          .upsert({
            id: 'main',
            data: current,
            updated_at: new Date().toISOString()
          });
      } else {
        const dbFile = path.resolve(process.cwd(), 'data', 'server_db.json');
        let current = {};
        if (fs.existsSync(dbFile)) {
          try { current = JSON.parse(fs.readFileSync(dbFile, 'utf8') || '{}'); } catch {}
        }
        const existing = Array.isArray(current.invoices) ? current.invoices : [];
        const filtered = existing.filter(i => i.invoiceNumber !== cleanInvoice.invoiceNumber && i.id !== cleanInvoice.id);
        current.invoices = [cleanInvoice, ...filtered];
        fs.writeFileSync(dbFile, JSON.stringify(current, null, 2), 'utf8');
      }
    }

    return res.status(200).json({
      success: true,
      imageUrl: publicUrl,
      invoiceNumber
    });
  } catch (err) {
    console.error('API /api/upload-invoice error:', err);
    return res.status(500).json({ error: err.message });
  }
}
