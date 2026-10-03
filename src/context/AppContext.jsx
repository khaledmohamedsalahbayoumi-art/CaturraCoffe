import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  initialCategories,
  initialProducts,
  initialCustomers,
  initialInvoices,
  initialPurchases,
  initialBatches,
  initialExpenses,
  initialUsers,
  initialAcademyArticles
} from '../data/initialData';
import { dispatchStoreAlert } from '../utils/notifications';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  // Load from localStorage or fallback
  const loadState = (key, fallback) => {
    try {
      const saved = localStorage.getItem(`caturra_eg_${key}`);
      return saved ? JSON.parse(saved) : fallback;
    } catch {
      return fallback;
    }
  };

  const [categories, setCategories] = useState(() => loadState('categories', initialCategories));
  const [products, setProducts] = useState(() => {
    const loaded = loadState('products', initialProducts);
    return loaded.map(p => {
      const initP = initialProducts.find(ip => ip.id === p.id);
      if (initP && (p.image === '/ethiopia_coffee.jpg' || !p.image)) {
        return { ...p, image: initP.image };
      }
      return p;
    });
  });
  const [customers, setCustomers] = useState(() => loadState('customers', initialCustomers));
  const [invoices, setInvoices] = useState(() => loadState('invoices', initialInvoices));
  const [purchases, setPurchases] = useState(() => {
    const loaded = loadState('purchases', initialPurchases);
    return loaded.map(pur => ({
      ...pur,
      items: pur.items?.map(it => {
        const initP = initialProducts.find(ip => ip.id === it.productId);
        if (initP && (it.image === '/ethiopia_coffee.jpg' || !it.image)) {
          return { ...it, image: initP.image };
        }
        return it;
      })
    }));
  });
  const [batches, setBatches] = useState(() => loadState('batches', initialBatches));
  const [expenses, setExpenses] = useState(() => loadState('expenses', initialExpenses));
  const [users, setUsers] = useState(() => loadState('users', initialUsers));
  const [academyArticles, setAcademyArticles] = useState(() => loadState('academy', initialAcademyArticles));

  // Authentication & Session
  const [isAuthenticated, setIsAuthenticated] = useState(() => loadState('auth', true));
  const [currentUserId, setCurrentUserId] = useState(() => loadState('current_user_id', initialUsers[0].id));

  // App UI State
  const [activeTab, setActiveTab] = useState('pos');
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      if (p.get('mode') === 'client' || p.get('mode') === 'admin') return p.get('mode');
      const saved = localStorage.getItem('caturra_view_mode');
      if (saved) return saved;
    }
    return 'client';
  });
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeInvoiceForModal, setActiveInvoiceForModal] = useState(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isNotificationSettingsOpen, setIsNotificationSettingsOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('caturra_view_mode', viewMode);
  }, [viewMode]);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('caturra_eg_categories', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('caturra_eg_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('caturra_eg_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('caturra_eg_invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('caturra_eg_purchases', JSON.stringify(purchases));
  }, [purchases]);

  useEffect(() => {
    localStorage.setItem('caturra_eg_batches', JSON.stringify(batches));
  }, [batches]);

  useEffect(() => {
    localStorage.setItem('caturra_eg_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('caturra_eg_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('caturra_eg_auth', JSON.stringify(isAuthenticated));
  }, [isAuthenticated]);

  useEffect(() => {
    localStorage.setItem('caturra_eg_current_user_id', JSON.stringify(currentUserId));
  }, [currentUserId]);

  useEffect(() => {
    localStorage.setItem('caturra_eg_academy', JSON.stringify(academyArticles));
  }, [academyArticles]);

  // Current active user object
  const currentUser = users.find(u => u.id === currentUserId) || users[0];

  // Helper: Open invoice printable modal
  const openInvoiceModal = (invoice) => {
    setActiveInvoiceForModal(invoice);
    setIsInvoiceModalOpen(true);
  };

  const closeInvoiceModal = () => {
    setIsInvoiceModalOpen(false);
    setActiveInvoiceForModal(null);
  };

  // 1. AUTHENTICATION & PERMISSIONS
  const login = (username, password) => {
    const cleanUser = String(username || '').trim().toLowerCase();
    const cleanPass = String(password || '').trim();

    // 1. Check in current users state
    let found = users.find(u => {
      const uName = String(u.username || '').trim().toLowerCase();
      const uFull = String(u.fullName || '').trim().toLowerCase();
      const uEmail = String(u.email || '').trim().toLowerCase();
      const uPhone = String(u.phone || '').trim();

      const matchUser = (uName === cleanUser || uFull === cleanUser || uEmail === cleanUser || uPhone === cleanUser);
      if (!matchUser) return false;

      const userPass = String(u.password || '').trim();
      const matchPass = (
        userPass === cleanPass ||
        cleanPass === '123' ||
        cleanPass === '123456' ||
        userPass === '••••••••' ||
        !userPass
      );
      return matchPass;
    });

    // 2. If not found in users state, check initialUsers (in case edited directly in code)
    if (!found) {
      const initialFound = initialUsers.find(u => {
        const uName = String(u.username || '').trim().toLowerCase();
        const uFull = String(u.fullName || '').trim().toLowerCase();
        const uEmail = String(u.email || '').trim().toLowerCase();
        const uPhone = String(u.phone || '').trim();

        const matchUser = (uName === cleanUser || uFull === cleanUser || uEmail === cleanUser || uPhone === cleanUser);
        if (!matchUser) return false;

        const userPass = String(u.password || '').trim();
        return (userPass === cleanPass || cleanPass === '123' || cleanPass === '123456');
      });

      if (initialFound) {
        found = initialFound;
        setUsers(prev => {
          const idx = prev.findIndex(p => p.id === initialFound.id);
          if (idx !== -1) {
            const next = [...prev];
            next[idx] = { ...next[idx], ...initialFound };
            return next;
          }
          return [...prev, initialFound];
        });
      }
    }

    // 3. Fallback: If username exists but custom password didn't match, allow master password '123'
    if (!found) {
      const userByName = users.find(u => {
        const uName = String(u.username || '').trim().toLowerCase();
        const uFull = String(u.fullName || '').trim().toLowerCase();
        return uName === cleanUser || uFull === cleanUser;
      }) || initialUsers.find(u => {
        const uName = String(u.username || '').trim().toLowerCase();
        const uFull = String(u.fullName || '').trim().toLowerCase();
        return uName === cleanUser || uFull === cleanUser;
      });

      if (userByName && (cleanPass === '123' || cleanPass === '123456')) {
        found = userByName;
      }
    }

    if (found) {
      if (found.status === 'inactive') {
        return { success: false, message: 'هذا الحساب موقوف حالياً من قِبل إدارة النظام.' };
      }
      setCurrentUserId(found.id);
      setIsAuthenticated(true);

      // Auto route to first allowed tab
      const perms = found.permissions || {};
      if (perms.pos) setActiveTab('pos');
      else if (perms.products) setActiveTab('products');
      else if (perms.warehouse) setActiveTab('warehouse');
      else if (perms.purchases) setActiveTab('purchases');
      else if (perms.invoices) setActiveTab('invoices');
      else if (perms.customers) setActiveTab('customers');
      else if (perms.sales) setActiveTab('sales');
      else if (perms.accounts) setActiveTab('accounts');
      else if (perms.users) setActiveTab('users');

      return { success: true, user: found };
    }

    return { 
      success: false, 
      message: 'اسم المستخدم أو كلمة المرور غير صحيحة. يمكنك دائماً استخدام الرمز 123 كرمز طوارئ.' 
    };
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  // 2. PRODUCTS MANAGEMENT (Weight in Grams vs Pieces)
  const addProduct = (prodData) => {
    const isWeight = prodData.unitType === 'weight';
    const stockVal = Number(prodData.stock || 0);
    const stockGram = isWeight ? (Number(prodData.stockGram) || stockVal * 1000) : 0;
    const pricePerKg = Number(prodData.pricePerKg || (Number(prodData.sellingPrice || 0) * 4));
    const costPerKg = Number(prodData.costPerKg || (Number(prodData.costPrice || 0) * 4));

    const newProduct = {
      id: `prod-${Date.now()}`,
      salesCount: 0,
      unitType: prodData.unitType || 'piece',
      pricePerKg: isWeight ? pricePerKg : undefined,
      costPerKg: isWeight ? costPerKg : undefined,
      stockGram: isWeight ? stockGram : 0,
      stock: isWeight ? (stockGram / 1000) : stockVal,
      costPrice: Number(prodData.costPrice || (isWeight ? costPerKg / 4 : 0)),
      sellingPrice: Number(prodData.sellingPrice || (isWeight ? pricePerKg / 4 : 0)),
      minStockAlert: prodData.minStockAlert || 5,
      sku: prodData.sku || `CAT-${Math.floor(1000 + Math.random() * 9000)}`,
      barcode: prodData.barcode || `${Math.floor(622100000000 + Math.random() * 999999)}`,
      image: prodData.image || '/caturra_ethiopia.jpg',
      ...prodData
    };

    setProducts(prev => [newProduct, ...prev]);

    // If initial stock provided, add an initial batch in warehouse
    if (newProduct.stock > 0) {
      const newBatch = {
        id: `bat-${Date.now()}`,
        productId: newProduct.id,
        productName: newProduct.name,
        batchCode: `BAT-${Math.floor(100 + Math.random() * 900)}`,
        unitType: newProduct.unitType,
        entryDate: newProduct.entryDate || new Date().toISOString().split('T')[0],
        expiryDate: newProduct.expiryDate || '2028-01-01',
        quantity: newProduct.stock,
        quantityGram: isWeight ? stockGram : 0,
        costPrice: isWeight ? newProduct.costPerKg : newProduct.costPrice,
        status: 'good'
      };
      setBatches(prev => [newBatch, ...prev]);
    }
    return newProduct;
  };

  const updateProduct = (id, updatedFields) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id === id) {
          const isWeight = (updatedFields.unitType || p.unitType) === 'weight';
          let stock = updatedFields.stock !== undefined ? Number(updatedFields.stock) : p.stock;
          let stockGram = p.stockGram || (stock * 1000);

          if (isWeight && updatedFields.stock !== undefined) {
            stockGram = stock * 1000;
          }

          return {
            ...p,
            ...updatedFields,
            unitType: isWeight ? 'weight' : 'piece',
            stockGram: isWeight ? stockGram : 0,
            stock: stock,
            pricePerKg: updatedFields.pricePerKg !== undefined ? Number(updatedFields.pricePerKg) : p.pricePerKg,
            costPerKg: updatedFields.costPerKg !== undefined ? Number(updatedFields.costPerKg) : p.costPerKg,
            costPrice: updatedFields.costPrice !== undefined ? Number(updatedFields.costPrice) : p.costPrice,
            sellingPrice: updatedFields.sellingPrice !== undefined ? Number(updatedFields.sellingPrice) : p.sellingPrice
          };
        }
        return p;
      })
    );
  };

  const deleteProduct = (id) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    setBatches(prev => prev.filter(b => b.productId !== id));
  };

  const addCategory = (name) => {
    const id = `cat-${Date.now()}`;
    const newCat = { id, name };
    setCategories(prev => [...prev, newCat]);
    return newCat;
  };

  // 3. PURCHASES MANAGEMENT (Linked to Products, Batches & Accounts)
  const addPurchaseInvoice = (purchaseData) => {
    const totalAmount = purchaseData.items.reduce((sum, item) => sum + (Number(item.costPrice) * Number(item.qty)), 0);
    const paidAmount = Number(purchaseData.paidAmount || totalAmount);
    const remainingAmount = Math.max(0, totalAmount - paidAmount);
    const paymentStatus = remainingAmount === 0 ? 'paid' : (paidAmount > 0 ? 'partial' : 'unpaid');

    const newPurchase = {
      id: `pur-${Date.now()}`,
      invoiceNumber: purchaseData.invoiceNumber || `PUR-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      supplierName: purchaseData.supplierName || 'مورد بن عام',
      date: purchaseData.date || new Date().toISOString().split('T')[0],
      items: purchaseData.items,
      totalAmount,
      paidAmount,
      remainingAmount,
      paymentStatus,
      notes: purchaseData.notes || ''
    };

    setPurchases(prev => [newPurchase, ...prev]);

    // Update each product & create inventory batch
    purchaseData.items.forEach(item => {
      let productId = item.productId;
      const isWeight = item.unitType === 'weight';
      const itemCost = Number(item.costPrice);
      const itemSelling = Number(item.suggestedSellingPrice || itemCost * 1.5);
      const itemQty = Number(item.qty); // in kg if weight, or pieces if piece
      const itemWeightGram = isWeight ? (item.weightGram || itemQty * 1000) : 0;

      const existingProduct = products.find(p => p.id === productId || p.name.trim().toLowerCase() === item.name.trim().toLowerCase());

      if (existingProduct) {
        productId = existingProduct.id;
        const newStock = existingProduct.stock + itemQty;
        const newStockGram = (existingProduct.stockGram || (existingProduct.stock * 1000)) + itemWeightGram;

        updateProduct(productId, {
          costPrice: itemCost,
          sellingPrice: itemSelling,
          stock: newStock,
          stockGram: isWeight ? newStockGram : 0,
          pricePerKg: isWeight ? (item.pricePerKg || itemSelling * 4) : undefined,
          costPerKg: isWeight ? (item.costPerKg || itemCost * 4) : undefined,
          expiryDate: item.expiryDate || existingProduct.expiryDate,
          image: item.image || existingProduct.image
        });
      } else {
        const createdProd = addProduct({
          name: item.name,
          category: item.category || 'coffee',
          unitType: isWeight ? 'weight' : 'piece',
          costPrice: itemCost,
          sellingPrice: itemSelling,
          pricePerKg: isWeight ? (item.pricePerKg || itemSelling * 4) : undefined,
          costPerKg: isWeight ? (item.costPerKg || itemCost * 4) : undefined,
          stock: itemQty,
          stockGram: itemWeightGram,
          expiryDate: item.expiryDate || '2027-12-31',
          entryDate: item.entryDate || newPurchase.date,
          image: item.image || '/caturra_ethiopia.jpg',
          minStockAlert: 5
        });
        productId = createdProd.id;
      }

      // Add to inventory batches
      const newBatch = {
        id: `bat-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        productId: productId,
        productName: item.name,
        batchCode: `BAT-${newPurchase.invoiceNumber.slice(-4)}-${Math.floor(10 + Math.random() * 90)}`,
        unitType: isWeight ? 'weight' : 'piece',
        entryDate: item.entryDate || newPurchase.date,
        expiryDate: item.expiryDate || '2027-12-31',
        quantity: itemQty,
        quantityGram: isWeight ? itemWeightGram : 0,
        costPrice: itemCost,
        status: 'good'
      };
      setBatches(prev => [newBatch, ...prev]);
    });

    return newPurchase;
  };

  // 4. POS & SALES MANAGEMENT (Weight Deduction vs Piece Deduction)
  const createSale = (saleData) => {
    const {
      items,
      customerId,
      customerName,
      customerPhone,
      customerAddress,
      discount = 0,
      paymentMethod = 'cash',
      paidAmount: inputPaidAmount,
      source = 'pos'
    } = saleData;

    const subtotal = items.reduce((sum, item) => sum + (Number(item.price) * Number(item.qty || 1)), 0);
    const total = Math.max(0, subtotal - Number(discount));
    
    // Payment status calculation
    const isOnlineOrder = source === 'online' || saleData.status === 'pending';
    let paidAmount = total;
    if (isOnlineOrder) {
      paidAmount = paymentMethod === 'cash' ? 0 : (inputPaidAmount !== undefined ? Number(inputPaidAmount) : total);
    } else if (paymentMethod === 'deferred') {
      paidAmount = inputPaidAmount !== undefined ? Number(inputPaidAmount) : 0;
    } else if (inputPaidAmount !== undefined) {
      paidAmount = Math.min(total, Number(inputPaidAmount));
    }
    const remainingDebt = Math.max(0, total - paidAmount);
    const status = isOnlineOrder ? 'pending' : (remainingDebt === 0 ? 'paid' : (paidAmount > 0 ? 'partial' : 'unpaid'));

    // Customer handling
    let finalCustId = customerId;
    let finalCustName = customerName || 'عميل صالة نقدي';
    let finalCustPhone = customerPhone || '';

    if (finalCustId) {
      const existingCust = customers.find(c => c.id === finalCustId);
      if (existingCust) {
        finalCustName = existingCust.name;
        finalCustPhone = existingCust.phone;
        // update customer debt & stats
        setCustomers(prev =>
          prev.map(c => {
            if (c.id === finalCustId) {
              return {
                ...c,
                totalOrders: c.totalOrders + 1,
                totalSpent: c.totalSpent + total,
                debt: c.debt + remainingDebt
              };
            }
            return c;
          })
        );
      }
    } else if (customerName && customerName.trim() !== 'عميل صالة نقدي') {
      const newCust = {
        id: `cust-${Date.now()}`,
        name: customerName,
        phone: customerPhone || '',
        city: 'القاهرة',
        address: customerAddress || '',
        totalOrders: 1,
        totalSpent: total,
        debt: remainingDebt,
        notes: `تم تسجيله عبر ${source === 'pos' ? 'نقطة البيع (الكاشير)' : 'المتجر الإلكتروني'}`,
        createdAt: new Date().toISOString().split('T')[0]
      };
      setCustomers(prev => [newCust, ...prev]);
      finalCustId = newCust.id;
    }

    // Deduct stock accurately: by weight (in grams) or by pieces!
    items.forEach(saleItem => {
      const isWeight = saleItem.unitType === 'weight' && saleItem.weightGram;

      if (isWeight) {
        const totalGramsSold = Number(saleItem.weightGram) * Number(saleItem.qty || 1);

        // 1. Deduct from product stockGram
        setProducts(prev =>
          prev.map(p => {
            if (p.id === saleItem.productId) {
              const currentGrams = p.stockGram !== undefined ? p.stockGram : (p.stock * 1000);
              const newGrams = Math.max(0, currentGrams - totalGramsSold);
              return {
                ...p,
                stockGram: newGrams,
                stock: Math.round((newGrams / 1000) * 10) / 10,
                salesCount: (p.salesCount || 0) + (saleItem.qty || 1)
              };
            }
            return p;
          })
        );

        // 2. FIFO Batch deduction in grams
        let gramsLeftToDeduct = totalGramsSold;
        setBatches(prev => {
          return prev.map(batch => {
            if (batch.productId === saleItem.productId && gramsLeftToDeduct > 0) {
              const currentBatchGrams = batch.quantityGram !== undefined ? batch.quantityGram : (batch.quantity * 1000);
              if (currentBatchGrams > 0) {
                const deduct = Math.min(currentBatchGrams, gramsLeftToDeduct);
                gramsLeftToDeduct -= deduct;
                const remGrams = currentBatchGrams - deduct;
                return {
                  ...batch,
                  quantityGram: remGrams,
                  quantity: Math.round((remGrams / 1000) * 10) / 10,
                  status: remGrams <= 0 ? 'depleted' : batch.status
                };
              }
            }
            return batch;
          });
        });

      } else {
        // Standard piece deduction
        setProducts(prev =>
          prev.map(p => {
            if (p.id === saleItem.productId) {
              return {
                ...p,
                stock: Math.max(0, p.stock - saleItem.qty),
                salesCount: (p.salesCount || 0) + saleItem.qty
              };
            }
            return p;
          })
        );

        let qtyToDeduct = saleItem.qty;
        setBatches(prev => {
          return prev.map(batch => {
            if (batch.productId === saleItem.productId && qtyToDeduct > 0 && batch.quantity > 0) {
              const deduct = Math.min(batch.quantity, qtyToDeduct);
              qtyToDeduct -= deduct;
              return {
                ...batch,
                quantity: batch.quantity - deduct,
                status: (batch.quantity - deduct) <= 0 ? 'depleted' : batch.status
              };
            }
            return batch;
          });
        });
      }
    });

    const now = new Date();
    const formattedDate = `${now.toISOString().split('T')[0]} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newInvoice = {
      id: `inv-${Date.now()}`,
      invoiceNumber: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      date: formattedDate,
      customerId: finalCustId,
      customerName: finalCustName,
      customerPhone: finalCustPhone,
      customerAddress: customerAddress || '',
      items,
      subtotal,
      tax: 0,
      discount: Number(discount),
      total,
      paidAmount,
      remainingDebt,
      paymentMethod,
      status, // 'pending' if online order
      source: source || 'pos',
      cashierName: source === 'online' ? 'المتجر الإلكتروني (Online Order)' : currentUser.fullName,
      orderNotes: saleData.notes || '',
      createdAt: now.toISOString()
    };

    setInvoices(prev => [newInvoice, ...prev]);

    // Dispatch Phone & Device Alert (Push, Sound, Vibration, Telegram)
    try {
      const itemsSummary = (items || []).map(it => `${it.name} (${it.qty}x)`).join(' - ');
      const isOnline = source === 'online' || saleData.status === 'pending';
      const alertTitle = isOnline 
        ? `☕ طلب أونلاين جديد #${newInvoice.invoiceNumber}` 
        : `🧾 فاتورة مبيعات جديدة #${newInvoice.invoiceNumber}`;
      const alertBody = `العميل: ${finalCustName} • الإجمالي: ${total} ج.م`;

      dispatchStoreAlert({
        type: 'order',
        title: alertTitle,
        body: alertBody,
        details: itemsSummary
      });
    } catch (e) {
      console.warn('Alert dispatch failed:', e);
    }

    return newInvoice;
  };

  // Confirm pending online order
  const confirmPendingOrder = (invoiceId) => {
    setInvoices(prev =>
      prev.map(inv => {
        if (inv.id === invoiceId) {
          return {
            ...inv,
            status: 'paid',
            paidAmount: inv.total,
            remainingDebt: 0,
            confirmedAt: new Date().toISOString()
          };
        }
        return inv;
      })
    );
  };

  // Cancel pending online order and restore stock
  const cancelPendingOrder = (invoiceId) => {
    const targetInvoice = invoices.find(inv => inv.id === invoiceId);
    if (!targetInvoice) return;

    targetInvoice.items.forEach(saleItem => {
      const isWeight = saleItem.unitType === 'weight' && saleItem.weightGram;
      if (isWeight) {
        const gramsToRestore = Number(saleItem.weightGram) * Number(saleItem.qty || 1);
        setProducts(prev =>
          prev.map(p => {
            if (p.id === saleItem.productId) {
              const currentGrams = p.stockGram !== undefined ? p.stockGram : (p.stock * 1000);
              const newGrams = currentGrams + gramsToRestore;
              return {
                ...p,
                stockGram: newGrams,
                stock: Math.round((newGrams / 1000) * 10) / 10
              };
            }
            return p;
          })
        );
      } else {
        const qtyToRestore = Number(saleItem.qty || 1);
        setProducts(prev =>
          prev.map(p => {
            if (p.id === saleItem.productId) {
              return {
                ...p,
                stock: p.stock + qtyToRestore
              };
            }
            return p;
          })
        );
      }
    });

    setInvoices(prev =>
      prev.map(inv => (inv.id === invoiceId ? { ...inv, status: 'cancelled' } : inv))
    );
  };

  // 5. CUSTOMER MANAGEMENT
  const addCustomer = (customerData) => {
    const newCustomer = {
      id: `cust-${Date.now()}`,
      totalOrders: 0,
      totalSpent: 0,
      debt: Number(customerData.debt || 0),
      createdAt: new Date().toISOString().split('T')[0],
      ...customerData
    };
    setCustomers(prev => [newCustomer, ...prev]);
    return newCustomer;
  };

  const updateCustomer = (id, updatedFields) => {
    setCustomers(prev =>
      prev.map(c => (c.id === id ? { ...c, ...updatedFields } : c))
    );
  };

  const settleCustomerDebt = (customerId, amountPaid) => {
    const paid = Number(amountPaid);
    if (paid <= 0) return;

    setCustomers(prev =>
      prev.map(c => {
        if (c.id === customerId) {
          const newDebt = Math.max(0, c.debt - paid);
          return { ...c, debt: newDebt };
        }
        return c;
      })
    );

    let remainingToSettle = paid;
    setInvoices(prev =>
      prev.map(inv => {
        if (inv.customerId === customerId && inv.remainingDebt > 0 && remainingToSettle > 0) {
          const settlement = Math.min(inv.remainingDebt, remainingToSettle);
          remainingToSettle -= settlement;
          const newRemaining = inv.remainingDebt - settlement;
          const newPaid = inv.paidAmount + settlement;
          return {
            ...inv,
            paidAmount: newPaid,
            remainingDebt: newRemaining,
            status: newRemaining === 0 ? 'paid' : 'partial'
          };
        }
        return inv;
      })
    );
  };

  // 6. EXPENSES MANAGEMENT
  const addExpense = (expenseData) => {
    const newExpense = {
      id: `exp-${Date.now()}`,
      date: expenseData.date || new Date().toISOString().split('T')[0],
      ...expenseData,
      amount: Number(expenseData.amount)
    };
    setExpenses(prev => [newExpense, ...prev]);
    return newExpense;
  };

  const deleteExpense = (id) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  // 7. USERS & ROLES MANAGEMENT
  const addUser = (userData) => {
    const newUser = {
      id: `usr-${Date.now()}`,
      isOwner: false,
      status: 'active',
      password: userData.password || '123',
      avatar: userData.role === 'manager' ? '👨‍💼' : userData.role === 'cashier' ? '🧑‍💻' : '📦',
      permissions: {
        products: true,
        pos: true,
        invoices: true,
        customers: true,
        purchases: false,
        sales: false,
        warehouse: false,
        accounts: false,
        users: false,
        ...(userData.permissions || {})
      },
      ...userData
    };
    setUsers(prev => [...prev, newUser]);
    return newUser;
  };

  const updateUser = (id, updatedFields) => {
    setUsers(prev =>
      prev.map(u => {
        if (u.id === id) {
          if (u.isOwner) {
            return {
              ...u,
              ...updatedFields,
              isOwner: true,
              role: 'owner'
            };
          }
          return { ...u, ...updatedFields };
        }
        return u;
      })
    );
  };

  const deleteUser = (id) => {
    const targetUser = users.find(u => u.id === id);
    if (targetUser && targetUser.isOwner) {
      alert('عذراً، لا يمكن حذف حساب المالك (Owner) تحت أي ظرف!');
      return false;
    }
    setUsers(prev => prev.filter(u => u.id !== id));
    return true;
  };

  // 8. PROMO & INVENTORY ALERTS
  const applyPromoDiscount = (productId, discountPercent) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id === productId) {
          const discountVal = (p.sellingPrice * (discountPercent / 100));
          const newPrice = Math.round(p.sellingPrice - discountVal);
          return {
            ...p,
            sellingPrice: newPrice,
            hasPromo: true,
            promoDiscount: discountPercent
          };
        }
        return p;
      })
    );
  };

  const recordStockWaste = (batchId, quantity, reason) => {
    const qty = Number(quantity);
    setBatches(prev =>
      prev.map(b => {
        if (b.id === batchId) {
          const newQty = Math.max(0, b.quantity - qty);
          setProducts(prods =>
            prods.map(p => (p.id === b.productId ? { ...p, stock: Math.max(0, p.stock - qty) } : p))
          );
          return { ...b, quantity: newQty, wasteReason: reason };
        }
        return b;
      })
    );
  };

  // Computed Smart Alerts
  const lowStockAlerts = products.filter(p => p.stock <= p.minStockAlert);
  
  const today = new Date();
  const nearExpiryBatches = batches.filter(b => {
    if (b.quantity <= 0) return false;
    const expiry = new Date(b.expiryDate);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 75;
  });

  const pendingOrders = invoices.filter(inv => inv.status === 'pending');
  const pendingOrdersCount = pendingOrders.length;

  // Academy Actions
  const addAcademyArticle = (articleData) => {
    const newArticle = {
      id: `acad-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      readTime: '4 دقائق',
      level: 'جميع المستويات',
      image: '/v60_set.jpg',
      author: currentUser?.fullName || 'أكاديمية كاتورا',
      featured: false,
      ...articleData
    };
    setAcademyArticles(prev => [newArticle, ...prev]);
    dispatchStoreAlert({
      title: 'أكاديمية كاتورا للقهوة المختصة',
      body: `تم نشر درس تعليمي جديد: ${newArticle.title}`,
      sound: true
    });
    return newArticle;
  };

  const updateAcademyArticle = (id, updatedData) => {
    setAcademyArticles(prev => prev.map(a => a.id === id ? { ...a, ...updatedData } : a));
  };

  const deleteAcademyArticle = (id) => {
    setAcademyArticles(prev => prev.filter(a => a.id !== id));
  };

  return (
    <AppContext.Provider
      value={{
        categories,
        products,
        customers,
        invoices,
        purchases,
        batches,
        expenses,
        users,
        currentUser,
        isAuthenticated,
        login,
        logout,
        activeTab,
        setActiveTab,
        viewMode,
        setViewMode,
        sidebarCollapsed,
        setSidebarCollapsed,
        openInvoiceModal,
        closeInvoiceModal,
        isInvoiceModalOpen,
        activeInvoiceForModal,
        // Actions
        addProduct,
        updateProduct,
        deleteProduct,
        addCategory,
        addPurchaseInvoice,
        createSale,
        addCustomer,
        updateCustomer,
        settleCustomerDebt,
        addExpense,
        deleteExpense,
        addUser,
        updateUser,
        deleteUser,
        applyPromoDiscount,
        recordStockWaste,
        // Academy Educational Actions
        academyArticles,
        addAcademyArticle,
        updateAcademyArticle,
        deleteAcademyArticle,
        // Alerts, Notifications & Pending Orders
        lowStockAlerts,
        nearExpiryBatches,
        pendingOrders,
        pendingOrdersCount,
        confirmPendingOrder,
        cancelPendingOrder,
        // Mobile & Device Notification Settings
        isNotificationSettingsOpen,
        setIsNotificationSettingsOpen,
        openNotificationSettings: () => setIsNotificationSettingsOpen(true),
        closeNotificationSettings: () => setIsNotificationSettingsOpen(false),
        dispatchStoreAlert
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
