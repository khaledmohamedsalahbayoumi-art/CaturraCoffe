import fs from 'fs'
import path from 'path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

function serverDbPlugin() {
  const dbDir = path.resolve(process.cwd(), 'data')
  const dbFile = path.resolve(dbDir, 'server_db.json')

  const invoicesDir = path.resolve(process.cwd(), 'public', 'invoices')

  function setupMiddlewares(server) {
    const MAX_BODY_BYTES = 10 * 1024 * 1024; // 10MB limit
    const ADMIN_SECRET_HEADER = 'x-caturra-erp-auth';
    const ADMIN_SECRET_TOKEN = 'caturra_sec_token_v2';

    // 0. Redirect legacy /admin to canonical /caturra
    server.middlewares.use((req, res, next) => {
      const urlPath = req.url ? req.url.split('?')[0] : '';
      if (urlPath === '/admin' || urlPath === '/admin/') {
        const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
        res.statusCode = 301;
        res.setHeader('Location', `/caturra${query}`);
        res.end();
        return;
      }
      next();
    });

    // 1. Upload Invoice Image (JPG) and persist invoice data
      server.middlewares.use('/api/upload-invoice', (req, res, next) => {
        if (req.method === 'POST') {
          let body = ''
          let totalBytes = 0
          let isAborted = false

          req.on('data', chunk => {
            if (isAborted) return;
            totalBytes += chunk.length;
            if (totalBytes > MAX_BODY_BYTES) {
              isAborted = true;
              res.statusCode = 413;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'حجم الملف كبير جداً (أقصى حد 10 ميجابايت)' }));
              req.destroy();
              return;
            }
            body += chunk
          })
          req.on('end', () => {
            if (isAborted) return;
            try {
              if (!fs.existsSync(invoicesDir)) {
                fs.mkdirSync(invoicesDir, { recursive: true })
              }
              const data = JSON.parse(body || '{}')
              const { invoiceNumber, imageData, invoice } = data
              
              let safeName = 'INV-receipt'
              if (invoiceNumber) {
                safeName = String(invoiceNumber).replace(/[^a-zA-Z0-9_-]/g, '_')
              }

              if (imageData && typeof imageData === 'string') {
                const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '')
                const filePath = path.resolve(invoicesDir, `${safeName}.jpg`)
                fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'))
                const distInvoicesDir = path.resolve(process.cwd(), 'dist', 'invoices')
                if (!fs.existsSync(distInvoicesDir)) fs.mkdirSync(distInvoicesDir, { recursive: true })
                fs.writeFileSync(path.resolve(distInvoicesDir, `${safeName}.jpg`), Buffer.from(base64Data, 'base64'))
              }

              // Also persist invoice in server_db.json (strip heavy base64 to keep network blazing fast)
              if (invoice && (invoice.invoiceNumber || invoice.id)) {
                if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true })
                let current = {}
                if (fs.existsSync(dbFile)) {
                  try { current = JSON.parse(fs.readFileSync(dbFile, 'utf8') || '{}') } catch {}
                }
                const cleanInvoice = { ...invoice }
                if (cleanInvoice.transferReceipt && cleanInvoice.transferReceipt.startsWith('data:image')) {
                  cleanInvoice.transferReceipt = `/invoices/${safeName}.jpg`
                }
                const existing = Array.isArray(current.invoices) ? current.invoices : []
                const filtered = existing.filter(i => i.invoiceNumber !== cleanInvoice.invoiceNumber && i.id !== cleanInvoice.id)
                current.invoices = [cleanInvoice, ...filtered]
                fs.writeFileSync(dbFile, JSON.stringify(current, null, 2), 'utf8')
              }

              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({
                success: true,
                imageUrl: `/invoices/${safeName}.jpg`,
                invoiceNumber
              }))
            } catch (err) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: err.message }))
            }
          })
          return
        }
        next()
      })

      // 2. Retrieve Invoice Data by ID / InvoiceNumber
      server.middlewares.use('/api/invoice', (req, res, next) => {
        if (req.method === 'GET') {
          const urlObj = new URL(req.url, 'http://localhost')
          const id = urlObj.searchParams.get('id') || urlObj.searchParams.get('number')
          res.setHeader('Content-Type', 'application/json')
          if (id && fs.existsSync(dbFile)) {
            try {
              const current = JSON.parse(fs.readFileSync(dbFile, 'utf8') || '{}')
              const invoices = Array.isArray(current.invoices) ? current.invoices : []
              const found = invoices.find(i => i.invoiceNumber === id || i.id === id)
              if (found) {
                res.end(JSON.stringify({ success: true, invoice: found }))
                return
              }
            } catch (err) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: err.message }))
              return
            }
          }
          res.statusCode = 404
          res.end(JSON.stringify({ error: 'Invoice not found' }))
          return
        }
        next()
      })

      // 3. Database Sync Endpoint (Protected against DoS and unauthorized user account modifications)
      server.middlewares.use('/api/sync', (req, res, next) => {
        if (req.method === 'GET') {
          res.setHeader('Content-Type', 'application/json')
          if (fs.existsSync(dbFile)) {
            try {
              const raw = fs.readFileSync(dbFile, 'utf8')
              const data = JSON.parse(raw || '{}')
              const isInternalAdmin = req.headers[ADMIN_SECRET_HEADER] === ADMIN_SECRET_TOKEN

              // Security: Strip sensitive passwordHash for public unauthenticated requests
              if (!isInternalAdmin && Array.isArray(data.users)) {
                data.users = data.users.map(u => {
                  const { passwordHash, ...safeUser } = u
                  return safeUser
                })
              }

              res.end(JSON.stringify(data))
              return
            } catch (err) {
              res.end(JSON.stringify({ error: err.message }))
              return
            }
          }
          res.end(JSON.stringify({}))
          return
        }

        if (req.method === 'POST') {
          let body = ''
          let totalBytes = 0
          let isAborted = false

          req.on('data', chunk => {
            if (isAborted) return;
            totalBytes += chunk.length;
            if (totalBytes > MAX_BODY_BYTES) {
              isAborted = true;
              res.statusCode = 413;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'حجم البيانات يتجاوز الحد المسموح به' }));
              req.destroy();
              return;
            }
            body += chunk
          })
          req.on('end', () => {
            if (isAborted) return;
            try {
              if (!fs.existsSync(dbDir)) {
                fs.mkdirSync(dbDir, { recursive: true })
              }
              const incoming = JSON.parse(body || '{}')
              let current = {}
              if (fs.existsSync(dbFile)) {
                try {
                  current = JSON.parse(fs.readFileSync(dbFile, 'utf8') || '{}')
                } catch {
                  current = {}
                }
              }

              // Merge invoices safely without dropping existing ones
              let mergedInvoices = Array.isArray(current.invoices) ? [...current.invoices] : []
              if (incoming.wipeInvoices || incoming.replaceInvoices) {
                mergedInvoices = Array.isArray(incoming.invoices) ? incoming.invoices : []
              } else if (Array.isArray(incoming.invoices)) {
                const map = new Map(mergedInvoices.map(i => [String(i.invoiceNumber || i.id), i]))
                incoming.invoices.forEach(inv => {
                  if (inv && (inv.invoiceNumber || inv.id)) {
                    const key = String(inv.invoiceNumber || inv.id)
                    const existing = map.get(key)
                    map.set(key, existing ? { ...existing, ...inv } : inv)
                  }
                })
                mergedInvoices = Array.from(map.values())
              }

              // Merge users safely with admin auth protection
              let mergedUsers = Array.isArray(current.users) ? [...current.users] : []
              const isAuthorized = req.headers[ADMIN_SECRET_HEADER] === ADMIN_SECRET_TOKEN

              if (Array.isArray(incoming.users)) {
                // If caller is NOT authorized admin, disallow modifying owner/admin accounts or password hashes
                if (isAuthorized) {
                  const map = new Map(mergedUsers.map(u => [String(u.id || u.username).toLowerCase(), u]))
                  incoming.users.forEach(u => {
                    if (u && (u.id || u.username)) {
                      const key = String(u.id || u.username).toLowerCase()
                      const existing = map.get(key)
                      map.set(key, existing ? { ...existing, ...u } : u)
                    }
                  })
                  mergedUsers = Array.from(map.values())
                }
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
              }
              fs.writeFileSync(dbFile, JSON.stringify(merged, null, 2), 'utf8')
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ success: true, timestamp: Date.now() }))
            } catch (err) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: err.message }))
            }
          })
          return
        }

        next()
      })
  }

  return {
    name: 'server-db-plugin',
    configureServer(server) {
      setupMiddlewares(server)
    },
    configurePreviewServer(server) {
      setupMiddlewares(server)
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), serverDbPlugin()],
  server: {
    host: true,
    port: 5174,
    allowedHosts: true,
    watch: {
      ignored: ['**/data/server_db.json', '**/*.exe']
    }
  },
  preview: {
    host: true,
    port: 5174,
    allowedHosts: true
  }
})
