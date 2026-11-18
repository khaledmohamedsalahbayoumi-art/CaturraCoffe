import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  Plus,
  Search,
  Tag,
  Package,
  Edit2,
  Trash2,
  DollarSign,
  Coffee,
  X,
  Maximize2,
  Scale,
  Upload,
  Download,
  Image as ImageIcon,
  Check,
  Link as LinkIcon,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { toLatinDigits } from '../utils/numberEnforcer';
import { CoffeeBagMockup, getCountryMeta } from '../components/CoffeeBagMockup';
import { exportInventoryTemplate } from '../utils/exportUtils';
import {
  processInventoryUploadFile,
  InventoryImportSuccessBanner,
  InventoryImportModal
} from '../components/InventoryImportModal';
import BagStudioModal from '../components/BagStudioModal';
import { resolveProductImage, isToolProduct } from '../utils/productImages';

// Helper to save newly typed values into localStorage for future suggestions
export const saveOptionToStorage = (key, val) => {
  if (!val || typeof val !== 'string' || !val.trim() || !key) return;
  const trimmed = val.trim();
  try {
    const raw = localStorage.getItem(key);
    const list = raw ? JSON.parse(raw) : [];
    if (!list.includes(trimmed)) {
      list.unshift(trimmed);
      localStorage.setItem(key, JSON.stringify(list.slice(0, 50)));
    }
  } catch (e) {
    console.warn(e);
  }
};

// Smart Combobox with persistent local history, instant suggestions, and live filtering
const SmartSpecCombobox = ({
  label,
  value = '',
  onChange,
  placeholder = '',
  storageKey,
  defaultOptions = [],
  existingProducts = [],
  extractField,
  listId,
  dir = 'auto'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = React.useRef(null);

  // Load custom saved history from localStorage
  const [historyOptions, setHistoryOptions] = useState(() => {
    if (!storageKey) return [];
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // Extract values from existing products in state
  const fromProducts = useMemo(() => {
    if (!existingProducts || !extractField) return [];
    const values = existingProducts
      .map(p => extractField(p))
      .filter(v => typeof v === 'string' && v.trim().length > 0)
      .map(v => v.trim());
    return Array.from(new Set(values));
  }, [existingProducts, extractField]);

  // Combine unique options: (History + Existing Products + Default Presets)
  const allOptions = useMemo(() => {
    const set = new Set();
    historyOptions.forEach(opt => opt && set.add(opt.trim()));
    fromProducts.forEach(opt => opt && set.add(opt.trim()));
    defaultOptions.forEach(opt => opt && set.add(opt.trim()));
    return Array.from(set);
  }, [historyOptions, fromProducts, defaultOptions]);

  // Filter options based on typed input
  const filteredOptions = useMemo(() => {
    const q = (value || '').toLowerCase().trim();
    if (!q) return allOptions;
    return allOptions.filter(opt => opt.toLowerCase().includes(q));
  }, [allOptions, value]);

  // Save a new value to history
  const handleSaveToHistory = (val) => {
    if (!val || typeof val !== 'string' || !val.trim() || !storageKey) return;
    const trimmed = val.trim();
    setHistoryOptions(prev => {
      if (prev.includes(trimmed)) return prev;
      const updated = [trimmed, ...prev].slice(0, 50);
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });
  };

  // Remove an item from history (e.g. if user made a typo)
  const removeFromHistory = (e, optToRemove) => {
    e.stopPropagation();
    setHistoryOptions(prev => {
      const updated = prev.filter(item => item !== optToRemove);
      try {
        localStorage.setItem(storageKey, JSON.stringify(updated));
      } catch (e) {
        console.warn(e);
      }
      return updated;
    });
  };

  // Close dropdown on outside click
  React.useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      {label && <label className="form-label" style={{ fontWeight: '800', color: '#2D1810', marginBottom: '4px' }}>{label}</label>}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          type="text"
          list={listId}
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => {
            if (value && value.trim()) {
              handleSaveToHistory(value);
            }
          }}
          className="form-input"
          style={{ width: '100%', paddingLeft: '30px' }}
          autoComplete="off"
          dir={dir}
        />
        {/* Dropdown chevron toggle */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          style={{
            position: 'absolute',
            left: '6px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            color: '#8B5E34',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px'
          }}
          title="عرض الخيارات السابقة المنسدلة"
          tabIndex={-1}
        >
          <ChevronDown size={14} style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s ease' }} />
        </button>

        {listId && (
          <datalist id={listId}>
            {allOptions.map(opt => (
              <option key={opt} value={opt} />
            ))}
          </datalist>
        )}
      </div>

      {/* Floating Suggestions List */}
      {isOpen && filteredOptions.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 3px)',
            left: 0,
            right: 0,
            background: '#FFFDF9',
            border: '1.5px solid #E8D5C4',
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(74, 50, 32, 0.16)',
            maxHeight: '190px',
            overflowY: 'auto',
            zIndex: 1300,
            padding: '4px'
          }}
        >
          <div style={{ padding: '4px 8px', fontSize: '0.68rem', color: '#8B5E34', fontWeight: '800', borderBottom: '1px solid #F3E8DC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>قائمة الخيارات السابقة ({filteredOptions.length})</span>
            <span style={{ fontSize: '0.62rem', color: '#9CA3AF' }}>اضغط للاختيار السريع</span>
          </div>
          {filteredOptions.map((opt) => {
            const isHistory = historyOptions.includes(opt);
            const isCurrent = (value || '').toLowerCase().trim() === opt.toLowerCase().trim();
            return (
              <div
                key={opt}
                onClick={() => {
                  onChange(opt);
                  handleSaveToHistory(opt);
                  setIsOpen(false);
                }}
                style={{
                  padding: '7px 10px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: isCurrent ? '800' : '600',
                  color: isCurrent ? '#92400E' : '#2D1810',
                  background: isCurrent ? '#FEF3C7' : 'transparent',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'background 0.12s ease'
                }}
                onMouseEnter={(e) => {
                  if (!isCurrent) e.currentTarget.style.background = '#FAF5ED';
                }}
                onMouseLeave={(e) => {
                  if (!isCurrent) e.currentTarget.style.background = 'transparent';
                }}
              >
                <span>{opt}</span>
                {isHistory && (
                  <button
                    type="button"
                    onClick={(e) => removeFromHistory(e, opt)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#9CA3AF',
                      cursor: 'pointer',
                      padding: '2px 5px',
                      fontSize: '0.75rem',
                      lineHeight: 1
                    }}
                    title="حذف هذا الخيار من السجل"
                  >
                    ×
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const ProductsView = () => {
  const {
    products,
    categories,
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    confirmDialog,
    importInventoryBatch
  } = useApp();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isAddCategoryOpen, setIsAddCategoryOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');

  // Excel / CSV Product & Stock Import State
  const [importPreviewData, setImportPreviewData] = useState(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importSuccessAlert, setImportSuccessAlert] = useState(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const preview = await processInventoryUploadFile(file, products);
      if (!preview) {
        alert('تعذر قراءة بيانات من الملف. يرجى التأكد من أن الملف بصيغة Excel (.xlsx / .xls) أو CSV ومحتوٍ على صف العناوين وبيانات الأصناف.');
        return;
      }
      setImportPreviewData(preview);
      setIsImportModalOpen(true);
    } catch (err) {
      console.error('Import file parse error:', err);
      alert('حدث خطأ أثناء قراءة الملف: ' + err.message);
    }
  };

  const handleConfirmImport = (removeMissing = true) => {
    if (!importPreviewData || !importPreviewData.items) return;
    const res = importInventoryBatch(importPreviewData.items, { removeMissing });
    setIsImportModalOpen(false);
    setImportSuccessAlert({
      updated: res.updatedCount,
      added: res.addedCount,
      removed: res.removedCount,
      total: res.total
    });
    setImportPreviewData(null);
    setTimeout(() => setImportSuccessAlert(null), 8000);
  };

  // Safeguard: strictly deduplicate categories by both id and name
  const uniqueCategories = useMemo(() => {
    const seen = new Set();
    return (categories || []).filter(c => {
      if (!c || !c.id || seen.has(c.id) || seen.has(c.name)) return false;
      seen.add(c.id);
      seen.add(c.name);
      return true;
    });
  }, [categories]);

  // 🔍 Bag Preview Modal State
  const [zoomBagProduct, setZoomBagProduct] = useState(null);
  const [previewBagVariant, setPreviewBagVariant] = useState(null);

  // 🎨 Dedicated Bag & Label Packaging Studio Modal State
  const [activeBagStudioProduct, setActiveBagStudioProduct] = useState(null);

  // ⚡ Quick Pricing & Stock Edit Modal State
  const [quickEditProduct, setQuickEditProduct] = useState(null);
  const [quickPriceData, setQuickPriceData] = useState({
    pricePerKg: '',
    costPerKg: '',
    sellingPrice: '',
    costPrice: '',
    stock: '',
    wholesalePricePerKg: ''
  });

  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isDraggingImage, setIsDraggingImage] = useState(false);

  // Official Caturra product bag and item image presets
  const productImgPresets = [
    { label: 'كيس إسبريسو عرضي', path: '/bags/bag_espresso_landscape.jpg', icon: '☕' },
    { label: 'كيس فلتر طولي', path: '/bags/bag_filter_vertical.jpg', icon: '🌱' },
    { label: 'كيس بلند كلاسيكي', path: '/bags/bag_classic_blends.jpg', icon: '✨' },
    { label: 'أدوات ومعدات V60', path: '/v60_set.jpg', icon: '⚙️' },
    { label: 'سيروب وضيافة', path: '/caturra_syrup.jpg', icon: '🍯' }
  ];

  // Process and compress image file for fast local & cloud storage
  const handleImageFileChange = (file) => {
    if (!file) return;
    if (!file.type || !file.type.startsWith('image/')) {
      alert('يرجى اختيار ملف صورة صالح (JPG, PNG, WEBP)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const rawBase64 = e.target.result;
      const img = new window.Image();
      img.onload = () => {
        try {
          const maxDim = 1000;
          let width = img.width;
          let height = img.height;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.86);
          setFormData(prev => ({ ...prev, image: compressed }));
        } catch {
          setFormData(prev => ({ ...prev, image: rawBase64 }));
        }
      };
      img.onerror = () => {
        setFormData(prev => ({ ...prev, image: rawBase64 }));
      };
      img.src = rawBase64;
    };
    reader.readAsDataURL(file);
  };

  // Form State for Full Add / Edit Modal
  const [formData, setFormData] = useState({
    name: '',
    nameEn: '',
    category: 'specialty',
    subCategory: 'espresso',
    bagVariant: 'landscape',
    unitType: 'weight', // 'weight' (جرام / كجم) | 'piece' (قطعة)
    pricePerKg: 1400,
    costPerKg: 840,
    costPrice: 210,
    sellingPrice: 350,
    wholesalePricePerKg: 1100,
    stock: 40,
    stockGram: 40000,
    minStockAlert: 5,
    image: '/bags/bag_espresso_landscape.jpg',
    roastLevel: 'Medium',
    notes: '',
    notesAr: '',
    weight: '250g',
    description: '',
    expiryDate: '2027-12-31',
    barcode: '',
    country: '',
    region: '',
    farm: '',
    altitude: '',
    variety: '',
    process: '',
    harvestSeason: '',
    flavorNotes: '',
    recommendedFor: 'Espresso Machine — Milk Drinks',
    espressoRecipe: {
      dose: '18 g',
      yield: '36 g',
      time: '28 sec',
      temp: '92 °C',
      grind: 'As Dialed In'
    }
  });

  // Filter products
  const filteredProducts = products.filter(p => {
    let matchesCategory = true;
    if (selectedCategory === 'specialty') {
      matchesCategory = p.category === 'specialty' || p.category === 'espresso' || p.category === 'filter';
    } else if (selectedCategory === 'classic_blends') {
      matchesCategory = p.category === 'classic_blends' || p.category === 'coffee';
    } else if (selectedCategory === 'espresso') {
      matchesCategory = p.category === 'espresso' || p.subCategory === 'espresso';
    } else if (selectedCategory === 'filter') {
      matchesCategory = p.category === 'filter' || p.subCategory === 'filter';
    } else if (selectedCategory === 'fermented') {
      matchesCategory = p.category === 'fermented' || p.subCategory === 'fermented' || (p.nameEn && p.nameEn.toLowerCase().includes('fermented'));
    } else if (selectedCategory !== 'all') {
      matchesCategory = p.category === selectedCategory;
    }

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      p.name.toLowerCase().includes(q) ||
      (p.nameEn && p.nameEn.toLowerCase().includes(q)) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (p.barcode && p.barcode.includes(q)) ||
      (p.coffeeOrigin?.country && p.coffeeOrigin.country.toLowerCase().includes(q)) ||
      (p.notes && p.notes.toLowerCase().includes(q));

    return matchesCategory && matchesSearch;
  }).sort((a, b) => {
    const aIsTool = a.category === 'tools' || a.category === 'accessories';
    const bIsTool = b.category === 'tools' || b.category === 'accessories';
    if (!aIsTool && bIsTool) return -1;
    if (aIsTool && !bIsTool) return 1;
    return 0;
  });

  // Open full modal for new product
  const handleOpenAdd = () => {
    setEditingProduct(null);
    setShowUrlInput(false);
    setIsDraggingImage(false);
    setFormData({
      name: '',
      nameEn: '',
      category: 'specialty',
      subCategory: 'espresso',
      bagVariant: 'landscape',
      unitType: 'weight',
      pricePerKg: 1400,
      costPerKg: 840,
      costPrice: 210,
      sellingPrice: 350,
      wholesalePricePerKg: 1100,
      stock: 35,
      stockGram: 35000,
      minStockAlert: 5,
      image: '/bags/bag_espresso_landscape.jpg',
      roastLevel: 'Medium',
      notes: '',
      notesAr: '',
      weight: '250g',
      description: '',
      expiryDate: '2027-12-31',
      barcode: `${Math.floor(622100000000 + Math.random() * 999999)}`,
      country: 'Colombia',
      region: 'Huila',
      farm: 'Various Producers',
      altitude: '1,600 — 1,900 masl',
      variety: 'Caturra',
      process: 'Washed',
      harvestSeason: 'April — July',
      flavorNotes: 'Caramel / Citrus / Chocolate',
      recommendedFor: 'Espresso Machine — Milk Drinks',
      espressoRecipe: {
        dose: '18 g',
        yield: '36 g',
        time: '28 sec',
        temp: '92 °C',
        grind: 'As Dialed In'
      }
    });
    setIsAddModalOpen(true);
  };

  // Open full modal for edit product
  const handleOpenEdit = (prod) => {
    setEditingProduct(prod);
    setShowUrlInput(false);
    setIsDraggingImage(false);
    const isWeight = prod.unitType === 'weight' || prod.category === 'specialty' || prod.category === 'classic_blends' || prod.category === 'coffee' || prod.category === 'espresso' || prod.category === 'filter';
    setFormData({
      ...prod,
      image: prod.image || '/bags/bag_espresso_landscape.jpg',
      category: (prod.category === 'espresso' || prod.category === 'filter') ? 'specialty' : prod.category === 'coffee' ? 'classic_blends' : prod.category,
      subCategory: prod.subCategory || (prod.category === 'espresso' ? 'espresso' : prod.category === 'filter' ? 'filter' : ''),
      unitType: isWeight ? 'weight' : 'piece',
      bagVariant: prod.bagVariant || (prod.category === 'espresso' ? 'landscape' : 'vertical'),
      pricePerKg: prod.pricePerKg || (prod.sellingPrice * 4),
      costPerKg: prod.costPerKg || (prod.costPrice * 4),
      costPrice: prod.costPrice,
      sellingPrice: prod.sellingPrice,
      wholesalePricePerKg: prod.wholesalePricePerKg || Math.round((prod.pricePerKg || prod.sellingPrice * 4) * 0.8),
      stock: prod.stock,
      stockGram: prod.stockGram || (prod.stock * 1000),
      country: prod.coffeeOrigin?.country || prod.country || '',
      region: prod.coffeeOrigin?.region || prod.region || '',
      farm: prod.coffeeOrigin?.farm || prod.farm || '',
      altitude: prod.coffeeOrigin?.altitude || prod.altitude || '',
      variety: prod.coffeeOrigin?.variety || prod.variety || '',
      process: prod.coffeeOrigin?.process || prod.process || '',
      flavorNotes: prod.sensoryProfile?.flavorNotes || prod.notes || ''
    });
    setIsAddModalOpen(true);
  };

  // Open Quick Pricing & Stock Edit Modal
  const handleOpenQuickEdit = (prod) => {
    setQuickEditProduct(prod);
    const isWeight = prod.unitType === 'weight' || prod.category === 'specialty' || prod.category === 'classic_blends' || prod.category === 'espresso' || prod.category === 'filter' || prod.category === 'coffee';
    const sPrice = prod.sellingPrice ?? (isWeight ? Math.round((prod.pricePerKg || 0) / 4) : 0);
    const cPrice = prod.costPrice ?? (isWeight ? Math.round((prod.costPerKg || 0) / 4) : 0);
    setQuickPriceData({
      pricePerKg: isWeight ? (prod.pricePerKg || (sPrice * 4)) : sPrice,
      costPerKg: isWeight ? (prod.costPerKg || (cPrice * 4)) : cPrice,
      sellingPrice: sPrice,
      costPrice: cPrice,
      stock: prod.stock,
      wholesalePricePerKg: prod.wholesalePricePerKg || Math.round((isWeight ? (prod.pricePerKg || sPrice * 4) : sPrice) * 0.8)
    });
  };

  // Submit Quick Pricing & Stock Edit
  const handleQuickEditSubmit = (e) => {
    e.preventDefault();
    if (!quickEditProduct) return;

    const isWeight = quickEditProduct.unitType === 'weight' || quickEditProduct.category === 'specialty' || quickEditProduct.category === 'classic_blends' || quickEditProduct.category === 'espresso' || quickEditProduct.category === 'filter' || quickEditProduct.category === 'coffee';
    const pKg = Number(quickPriceData.pricePerKg) || 0;
    const cKg = Number(quickPriceData.costPerKg) || 0;
    const stVal = Number(quickPriceData.stock) || 0;
    const wsKg = Number(quickPriceData.wholesalePricePerKg) || Math.round((isWeight ? pKg : pKg) * 0.8);

    const updates = {
      pricePerKg: isWeight ? pKg : undefined,
      costPerKg: isWeight ? cKg : undefined,
      sellingPrice: isWeight ? Math.round(pKg / 4) : pKg,
      costPrice: isWeight ? Math.round(cKg / 4) : cKg,
      wholesalePricePerKg: wsKg,
      stock: stVal,
      stockGram: isWeight ? stVal * 1000 : 0
    };

    updateProduct(quickEditProduct.id, updates);
    setQuickEditProduct(null);
  };

  // Submit Full Product Modal
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name) {
      alert('يرجى كتابة اسم المنتج');
      return;
    }

    const isWeight = formData.unitType === 'weight';
    const targetCountry = formData.country || formData.coffeeOrigin?.country || formData.origin || '';
    const targetRegion = formData.region || formData.coffeeOrigin?.region || '';
    const targetFarm = formData.farm || formData.coffeeOrigin?.farm || '';
    const targetAltitude = formData.altitude || formData.coffeeOrigin?.altitude || '';
    const targetVariety = formData.variety || formData.coffeeOrigin?.variety || '';
    const targetProcess = formData.process || formData.coffeeOrigin?.process || '';
    const targetNotes = formData.flavorNotes || formData.notes || '';

    let payload = {
      ...formData,
      country: targetCountry,
      origin: targetCountry,
      region: targetRegion,
      farm: targetFarm,
      altitude: targetAltitude,
      variety: targetVariety,
      process: targetProcess,
      notes: targetNotes,
      flavorNotes: targetNotes,
      coffeeOrigin: {
        country: targetCountry,
        region: targetRegion,
        farm: targetFarm,
        altitude: targetAltitude,
        variety: targetVariety,
        process: targetProcess,
        harvestSeason: formData.harvestSeason || formData.coffeeOrigin?.harvestSeason || ''
      },
      sensoryProfile: {
        flavorNotes: targetNotes,
        aroma: formData.sensoryProfile?.aroma || 4,
        acidity: formData.sensoryProfile?.acidity || 3,
        sweetness: formData.sensoryProfile?.sweetness || 4,
        body: formData.sensoryProfile?.body || 3,
        aftertaste: formData.sensoryProfile?.aftertaste || 3
      }
    };

    if (isWeight) {
      const pKg = Number(formData.pricePerKg) || 0;
      const cKg = Number(formData.costPerKg) || 0;
      const stKg = Number(formData.stock) || 0;
      payload = {
        ...payload,
        unitType: 'weight',
        pricePerKg: pKg,
        costPerKg: cKg,
        sellingPrice: Math.round(pKg / 4), // 250g default package
        costPrice: Math.round(cKg / 4),
        wholesalePricePerKg: Number(formData.wholesalePricePerKg) || Math.round(pKg * 0.8),
        stock: stKg,
        stockGram: stKg * 1000
      };
    } else {
      payload = {
        ...payload,
        unitType: 'piece',
        pricePerKg: undefined,
        costPerKg: undefined,
        sellingPrice: Number(formData.sellingPrice) || 0,
        costPrice: Number(formData.costPrice) || 0,
        wholesalePricePerKg: Number(formData.wholesalePricePerKg) || 0,
        stock: Number(formData.stock) || 0,
        stockGram: 0
      };
    }

    if (editingProduct) {
      updateProduct(editingProduct.id, payload);
    } else {
      addProduct(payload);
    }

    // Persist specification inputs to local history for future dropdown suggestions
    if (payload.coffeeOrigin?.country) saveOptionToStorage('caturra_spec_country', payload.coffeeOrigin.country);
    if (payload.coffeeOrigin?.region) saveOptionToStorage('caturra_spec_region', payload.coffeeOrigin.region);
    if (payload.coffeeOrigin?.variety) saveOptionToStorage('caturra_spec_variety', payload.coffeeOrigin.variety);
    if (payload.coffeeOrigin?.process) saveOptionToStorage('caturra_spec_process', payload.coffeeOrigin.process);
    if (formData.flavorNotes || formData.notes) saveOptionToStorage('caturra_spec_notes', formData.flavorNotes || formData.notes);

    setIsAddModalOpen(false);
  };

  // Add new category
  const handleAddCategorySubmit = (e) => {
    e.preventDefault();
    if (newCatName.trim()) {
      addCategory(newCatName.trim());
      setNewCatName('');
      setIsAddCategoryOpen(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      
      {/* Top Action Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', right: '12px', top: '12px' }} />
            <input
              type="text"
              placeholder="بحث باسم القهوة، السلالة، المنشأ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="form-input"
              style={{ paddingRight: '38px', height: '42px', borderRadius: '10px' }}
            />
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            إجمالي الأصناف: <strong>{products.length}</strong> صنف فاخر
          </span>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => exportInventoryTemplate(products, categories)}
            className="btn btn-outline"
            style={{ height: '42px', gap: '6px', borderColor: '#15803d', color: '#15803d', background: '#f0fdf4', fontWeight: '700' }}
            title="تنزيل شيت إكسيل/CSV جاهز بأسماء المنتجات الحالية لإضافة الكميات أو منتجات جديدة"
          >
            <Download size={16} />
            <span>تحميل نموذج الشيت</span>
          </button>

          <label
            className="btn btn-outline"
            style={{
              height: '42px',
              gap: '6px',
              borderColor: '#2563eb',
              color: '#2563eb',
              background: '#eff6ff',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              margin: 0
            }}
            title="رفع شيت إكسيل (.xlsx / .csv) لتحديث المخزون أو إضافة أصناف جديدة تلقائياً"
          >
            <Upload size={16} />
            <span>رفع شيت منتجات ومخزون</span>
            <input
              type="file"
              accept=".xlsx,.xls,.csv,.txt,.tsv"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              value=""
            />
          </label>

          <button
            onClick={() => setIsAddCategoryOpen(true)}
            className="btn btn-outline"
            style={{ height: '42px' }}
          >
            <Tag size={16} />
            <span>+ إضافة تصنيف</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="btn btn-primary"
            style={{ height: '42px', gap: '6px' }}
          >
            <Plus size={18} />
            <span>إضافة صنف قهوة جديد</span>
          </button>
        </div>
      </div>

      <InventoryImportSuccessBanner
        alertData={importSuccessAlert}
        onClose={() => setImportSuccessAlert(null)}
      />

      {/* Category Pills Filter */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {uniqueCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`btn ${selectedCategory === cat.id ? 'btn-primary' : 'btn-outline'}`}
            style={{
              padding: '6px 16px',
              fontSize: '0.88rem',
              borderRadius: '20px',
              whiteSpace: 'nowrap',
              fontWeight: selectedCategory === cat.id ? '800' : '600'
            }}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Products Grid Display */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '22px'
        }}
      >
        {filteredProducts.map((prod) => {
          const isOutOfStock = prod.stock <= 0;
          const isLowStock = prod.stock <= (prod.minStockAlert || 5);
          const isWeight = prod.unitType === 'weight' || prod.category === 'specialty' || prod.category === 'classic_blends' || prod.category === 'espresso' || prod.category === 'filter' || prod.category === 'coffee';
          
          const profit = prod.sellingPrice - prod.costPrice;
          const profitPercent = prod.costPrice > 0 ? Math.round((profit / prod.costPrice) * 100) : 0;
          const isTool = isToolProduct(prod);
          const isCoffee = !isTool && (prod.category === 'specialty' || prod.category === 'classic_blends' || prod.category === 'espresso' || prod.category === 'filter' || prod.category === 'coffee' || prod.category === 'fermented');
          const isClassic = !isTool && (prod.category === 'classic_blends' || prod.category === 'coffee');

          return (
            <div
              key={prod.id}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                position: 'relative',
                borderRadius: '16px',
                padding: '16px',
                background: '#ffffff',
                border: '1.5px solid #EAE0D5',
                boxShadow: '0 8px 24px rgba(45, 24, 16, 0.06)',
                transition: 'transform 180ms ease, box-shadow 180ms ease'
              }}
            >
              {/* Product Visual Container */}
              <div
                style={{
                  width: '100%',
                  height: '240px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  position: 'relative',
                  backgroundColor: '#F9F6F0',
                  border: '1px solid #EFE6DA',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '10px'
                }}
              >
                {isTool ? (
                  <div
                    style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <img
                      src={resolveProductImage(prod)}
                      alt={prod.name}
                      style={{
                        maxHeight: '92%',
                        maxWidth: '92%',
                        objectFit: 'contain',
                        borderRadius: '8px',
                        transition: 'transform 0.25s ease'
                      }}
                    />
                  </div>
                ) : prod.image && prod.image.startsWith('data:') ? (
                  <div
                    onClick={() => {
                      setZoomBagProduct(prod);
                      setPreviewBagVariant('landscape');
                    }}
                    style={{ cursor: 'pointer', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="اضغط لتكبير ومعاينة صورة المنتج"
                  >
                    <img
                      src={prod.image}
                      alt={prod.name}
                      style={{
                        maxHeight: '100%',
                        maxWidth: '100%',
                        objectFit: 'contain',
                        borderRadius: '8px',
                        transition: 'transform 0.25s ease'
                      }}
                    />
                  </div>
                ) : isClassic ? (
                  <div
                    onClick={() => {
                      setZoomBagProduct(prod);
                      setPreviewBagVariant('vertical');
                    }}
                    style={{ cursor: 'pointer', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="اضغط لتكبير ومعاينة الكيس الفاخر"
                  >
                    <img
                      src={prod.image || '/bags/bag_classic_blends.jpg'}
                      alt={prod.name}
                      style={{
                        maxHeight: '100%',
                        maxWidth: '100%',
                        objectFit: 'contain',
                        borderRadius: '8px',
                        transition: 'transform 0.25s ease'
                      }}
                    />
                  </div>
                ) : isCoffee ? (
                  <div
                    onClick={() => {
                      setZoomBagProduct(prod);
                      setPreviewBagVariant('landscape');
                    }}
                    style={{ cursor: 'pointer', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="اضغط لتكبير ومعاينة الكيس الفاخر"
                  >
                    <img
                      src={prod.image || '/bags/bag_espresso_landscape.jpg'}
                      alt={prod.name}
                      style={{
                        maxHeight: '100%',
                        maxWidth: '100%',
                        objectFit: 'contain',
                        borderRadius: '8px',
                        transition: 'transform 0.25s ease'
                      }}
                    />
                  </div>
                ) : (
                  <img
                    src={resolveProductImage(prod)}
                    alt={prod.name}
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                )}

                {/* Stock Badge */}
                <div style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10 }}>
                  {isOutOfStock ? (
                    <span className="badge badge-danger">نفذ من المخزن!</span>
                  ) : isLowStock ? (
                    <span className="badge badge-warning" style={{ fontWeight: '800' }}>
                      مخزون منخفض ({prod.stock} {isWeight ? 'كجم' : 'ق'})
                    </span>
                  ) : (
                    <span className="badge badge-mint" style={{ fontWeight: '800' }}>
                      {isWeight
                        ? `${prod.stock} كجم (${(prod.stockGram || prod.stock * 1000).toLocaleString()} جم)`
                        : `${prod.stock} قطعة متوفرة`}
                    </span>
                  )}
                </div>

                {/* Zoom / Bag Preview Icon Overlay (Coffee bags only) */}
                {isCoffee && !isTool && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setZoomBagProduct(prod);
                      setPreviewBagVariant('landscape');
                    }}
                    style={{
                      position: 'absolute',
                      bottom: '10px',
                      left: '10px',
                      background: 'rgba(21, 56, 37, 0.9)',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '4px 8px',
                      fontSize: '0.72rem',
                      fontWeight: '800',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      backdropFilter: 'blur(4px)',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                      zIndex: 10
                    }}
                    title="تكبير ومعاينة شكل الكيس"
                  >
                    <Maximize2 size={13} />
                    <span>معاينة الكيس</span>
                  </button>
                )}

                {/* Product Category Badge */}
                {isTool ? (
                  <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 10 }}>
                    <span
                      style={{
                        background: 'rgba(51, 65, 85, 0.92)',
                        backdropFilter: 'blur(4px)',
                        color: '#ffffff',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.7rem',
                        fontWeight: '800',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span>🛠️ أدوات تحضير وإكسسوارات</span>
                    </span>
                  </div>
                ) : isCoffee ? (
                  <div style={{ position: 'absolute', top: '10px', left: '10px', zIndex: 10 }}>
                    <span
                      style={{
                        background: (prod.category === 'classic_blends' || prod.category === 'coffee')
                          ? 'rgba(113, 63, 18, 0.95)'
                          : (prod.subCategory === 'espresso' || prod.category === 'espresso')
                          ? 'rgba(139, 94, 52, 0.95)'
                          : (prod.subCategory === 'filter' || prod.category === 'filter')
                          ? 'rgba(16, 107, 61, 0.95)'
                          : 'rgba(74, 34, 18, 0.95)',
                        backdropFilter: 'blur(4px)',
                        color: '#ffffff',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        fontSize: '0.7rem',
                        fontWeight: '800',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <span>
                        {(prod.category === 'classic_blends' || prod.category === 'coffee')
                          ? '✨ بن وتوليفات كلاسيكية'
                          : (prod.subCategory === 'espresso' || prod.category === 'espresso')
                          ? '☕ بن مختص (إسبريسو)'
                          : (prod.subCategory === 'filter' || prod.category === 'filter')
                          ? '💧 بن مختص (فلتر)'
                          : '☕ بن مختص'}
                      </span>
                    </span>
                  </div>
                ) : null}
              </div>

              {/* Title & Specs */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: '0.74rem', color: '#8C7A6B', fontFamily: 'monospace' }}>
                    {prod.sku || `CAT-${prod.id.slice(-4)}`}
                  </span>
                  {prod.coffeeOrigin?.country && (
                    <span style={{ fontSize: '0.76rem', color: '#153825', fontWeight: '800' }}>
                      {getCountryMeta(prod.coffeeOrigin.country).flag} {prod.coffeeOrigin.country}
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: '1.05rem', fontWeight: '900', color: '#2D1810', marginTop: '3px', lineHeight: '1.3' }}>
                  {prod.name}
                </h3>
                {prod.nameEn && prod.nameEn !== prod.name && (
                  <div style={{ fontSize: '0.78rem', color: '#6F4E37', fontWeight: '700' }}>
                    {prod.nameEn}
                  </div>
                )}

                {/* Flavor Notes / Specs snippet */}
                {prod.notes && (
                  <div style={{ fontSize: '0.78rem', color: '#451A03', marginTop: '4px', background: '#FEF9EE', border: '1px solid #FDE68A', padding: '4px 8px', borderRadius: '6px', fontWeight: '600' }}>
                    ✨ {prod.notes}
                  </div>
                )}
              </div>

              {/* Financial Box: Cost vs Selling vs Profit */}
              <div
                style={{
                  background: '#FDFBF7',
                  border: '1.5px solid #E8D5C4',
                  borderRadius: '10px',
                  padding: '10px 12px',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '6px',
                  textAlign: 'center'
                }}
              >
                <div>
                  <div style={{ fontSize: '0.7rem', color: '#8C7A6B', fontWeight: '700' }}>
                    {isWeight ? 'سعر التكلفة (كجم)' : 'سعر التكلفة'}
                  </div>
                  <div style={{ fontSize: '0.92rem', fontWeight: '800', color: '#6B7280' }}>
                    {isWeight ? (prod.costPerKg || prod.costPrice * 4) : prod.costPrice} ج.م
                  </div>
                  {isWeight && (
                    <div style={{ fontSize: '0.68rem', color: '#9CA3AF' }}>
                      ({prod.costPrice} ج.م / 250جم)
                    </div>
                  )}
                </div>

                <div style={{ borderRight: '1px solid #E8D5C4', borderLeft: '1px solid #E8D5C4' }}>
                  <div style={{ fontSize: '0.7rem', color: '#166534', fontWeight: '800' }}>
                    {isWeight ? 'سعر البيع (كجم)' : 'سعر البيع'}
                  </div>
                  <div style={{ fontSize: '1.02rem', fontWeight: '900', color: '#059669' }}>
                    {isWeight ? (prod.pricePerKg || prod.sellingPrice * 4) : prod.sellingPrice} ج.م
                  </div>
                  {isWeight && (
                    <div style={{ fontSize: '0.72rem', color: '#166534', fontWeight: '800' }}>
                      ({prod.sellingPrice} ج.م / 250جم)
                    </div>
                  )}
                </div>

                <div>
                  <div style={{ fontSize: '0.7rem', color: '#92400E', fontWeight: '700' }}>سعر جملة B2B</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#B45309' }}>
                    {prod.wholesalePricePerKg || Math.round((prod.pricePerKg || prod.sellingPrice * 4) * 0.8)} ج.م
                  </div>
                  <div style={{ fontSize: '0.68rem', color: '#16A34A', fontWeight: '700' }}>
                    ربح: +{profit} ({profitPercent}%)
                  </div>
                </div>
              </div>

              {/* 🎨 Bag Studio Direct Trigger for Coffee Products */}
              {isCoffee && (
                <button
                  type="button"
                  onClick={() => setActiveBagStudioProduct(prod)}
                  style={{
                    width: '100%',
                    padding: '7px 12px',
                    fontSize: '0.82rem',
                    fontWeight: '800',
                    color: '#ffffff',
                    background: 'linear-gradient(135deg, #78350F, #92400E)',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 6px rgba(120, 53, 15, 0.22)',
                    marginTop: '8px',
                    transition: 'all 0.15s ease'
                  }}
                  title="تصميم وضبط كيس هذا المنتج بواسطة الاستوديو وتطبيقه على المتجر"
                >
                  <Sparkles size={14} color="#FDE68A" />
                  <span>🎨 تصميم وضبط كيس المنتج</span>
                </button>
              )}

              {/* Actions Footer */}
              <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '4px' }}>
                {/* Quick Pricing & Stock Edit Button */}
                <button
                  type="button"
                  onClick={() => handleOpenQuickEdit(prod)}
                  className="btn btn-outline"
                  style={{
                    flex: 1.3,
                    padding: '8px 10px',
                    fontSize: '0.82rem',
                    fontWeight: '800',
                    color: '#6F4E37',
                    borderColor: '#8B5E34',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px'
                  }}
                  title="تعديل سريع لسعر التكلفة وسعر البيع والكمية"
                >
                  <DollarSign size={14} color="#8B5E34" />
                  <span>تعديل الأسعار والمخزون</span>
                </button>

                {/* Full Edit Button */}
                <button
                  type="button"
                  onClick={() => handleOpenEdit(prod)}
                  className="btn btn-outline"
                  style={{ padding: '8px 12px', fontSize: '0.82rem' }}
                  title="تعديل كافة تفاصيل الصنف والمعايرة"
                >
                  <Edit2 size={14} />
                  <span>تفاصيل</span>
                </button>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await confirmDialog({
                      title: 'حذف الصنف',
                      message: `هل أنت متأكد من حذف الصنف "${prod.name}"؟`,
                      details: 'سيتم حذف هذا الصنف من قائمة المنتجات وقاعدة البيانات.',
                      confirmText: 'نعم، حذف الصنف',
                      cancelText: 'إلغاء',
                      type: 'danger'
                    });
                    if (ok) {
                      deleteProduct(prod.id);
                    }
                  }}
                  className="btn btn-danger"
                  style={{ padding: '8px 10px', fontSize: '0.82rem' }}
                  title="حذف الصنف"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', background: '#ffffff', borderRadius: '16px', border: '1.5px dashed #E8D5C4' }}>
          <Package size={48} color="#A89080" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: '1.1rem', color: '#2D1810', fontWeight: '800' }}>لم يتم العثور على أي أصناف مطابقة</h3>
          <p style={{ fontSize: '0.85rem', color: '#8C7A6B', marginTop: '4px' }}>
            جرب تغيير معيار البحث أو أضف صنفاً جديداً الآن.
          </p>
          <button onClick={handleOpenAdd} className="btn btn-primary" style={{ marginTop: '14px' }}>
            <Plus size={16} />
            <span>إضافة صنف جديد</span>
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ⚡ MODAL 1: QUICK PRICING & STOCK EDIT MODAL ⚡                          */}
      {/* ========================================================================= */}
      {quickEditProduct && (
        <div className="modal-overlay" onClick={() => setQuickEditProduct(null)} style={{ zIndex: 1100 }}>
          <div
            className="modal-content"
            style={{
              maxWidth: '520px',
              padding: '24px',
              borderRadius: '16px',
              background: '#ffffff',
              border: '1.5px solid #E8D5C4',
              boxShadow: '0 20px 45px rgba(45, 24, 16, 0.25)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1.5px solid #F0E6DD', paddingBottom: '12px', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '0.78rem', background: '#FEF3C7', color: '#92400E', padding: '2px 8px', borderRadius: '12px', fontWeight: '800' }}>
                  تحديث مالي ومخزني سريع ⚡
                </span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#2D1810', margin: '4px 0 0 0' }}>
                  {quickEditProduct.name}
                </h3>
              </div>
              <button onClick={() => setQuickEditProduct(null)} className="btn-icon" style={{ width: '32px', height: '32px' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleQuickEditSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {(() => {
                const isQuickWeight = quickEditProduct.unitType === 'weight' || quickEditProduct.category === 'specialty' || quickEditProduct.category === 'classic_blends' || quickEditProduct.category === 'espresso' || quickEditProduct.category === 'filter' || quickEditProduct.category === 'coffee';
                return (
                  <div style={{ background: '#FAF7F2', padding: '14px', borderRadius: '12px', border: '1.5px solid #E8D5C4' }}>
                    <div style={{ fontSize: '0.84rem', fontWeight: '800', color: '#2D1810', marginBottom: '10px' }}>
                      {isQuickWeight ? 'تحديد أسعار التكلفة والبيع والمخزون بالكيلوجرام:' : 'تحديد أسعار التكلفة والبيع والمخزون بالقطعة:'}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      {/* Cost Price */}
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontWeight: '800', color: '#6B7280' }}>
                          {isQuickWeight ? 'سعر تكلفة الكيلو (ج.م) *' : 'سعر تكلفة القطعة (ج.م) *'}
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          dir="ltr"
                          required
                          value={quickPriceData.costPerKg}
                          onChange={(e) => {
                            const val = toLatinDigits(e.target.value);
                            if (val === '' || /^\d*\.?\d*$/.test(val)) {
                              setQuickPriceData({ ...quickPriceData, costPerKg: val });
                            }
                          }}
                          className="form-input"
                          style={{ fontWeight: '800', fontSize: '1rem', background: '#ffffff' }}
                        />
                        <span style={{ fontSize: '0.72rem', color: '#8C7A6B' }}>
                          {isQuickWeight ? (
                            <>تكلفة كيس 250جم: <strong>{Math.round((Number(quickPriceData.costPerKg) || 0) / 4)} ج.م</strong></>
                          ) : (
                            'تكلفة شراء وتوريد القطعة الواحدة'
                          )}
                        </span>
                      </div>

                      {/* Selling Price */}
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontWeight: '800', color: '#166534' }}>
                          {isQuickWeight ? 'سعر بيع الكيلو (ج.م) *' : 'سعر بيع القطعة للجمهور (ج.م) *'}
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          dir="ltr"
                          required
                          value={quickPriceData.pricePerKg}
                          onChange={(e) => {
                            const val = toLatinDigits(e.target.value);
                            if (val === '' || /^\d*\.?\d*$/.test(val)) {
                              setQuickPriceData({ ...quickPriceData, pricePerKg: val });
                            }
                          }}
                          className="form-input"
                          style={{ fontWeight: '800', fontSize: '1rem', color: '#059669', borderColor: '#10B981', background: '#ffffff' }}
                        />
                        <span style={{ fontSize: '0.72rem', color: '#166534', fontWeight: '700' }}>
                          {isQuickWeight ? (
                            <>سعر بيع كيس 250جم: <strong>{Math.round((Number(quickPriceData.pricePerKg) || 0) / 4)} ج.م</strong></>
                          ) : (
                            'سعر البيع المعروض بالمتجر والكاشير'
                          )}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px' }}>
                      {/* Stock Quantity */}
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontWeight: '800', color: '#2D1810' }}>
                          {isQuickWeight ? 'الكمية بالمخزن (بالـ كجم) *' : 'الكمية المتوفرة بالمخزن (بالقطعة) *'}
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          dir="ltr"
                          required
                          value={quickPriceData.stock}
                          onChange={(e) => {
                            const val = toLatinDigits(e.target.value);
                            if (val === '' || /^\d*\.?\d*$/.test(val)) {
                              setQuickPriceData({ ...quickPriceData, stock: val });
                            }
                          }}
                          className="form-input"
                          style={{ fontWeight: '800', fontSize: '1rem', background: '#ffffff' }}
                        />
                        <span style={{ fontSize: '0.72rem', color: '#8C7A6B' }}>
                          {isQuickWeight ? (
                            <>تعادل: <strong>{((Number(quickPriceData.stock) || 0) * 1000).toLocaleString()} جرام</strong> ({Math.floor((Number(quickPriceData.stock) || 0) * 4)} كيس 250جم)</>
                          ) : (
                            'إجمالي عدد القطع المتوفرة للبيع'
                          )}
                        </span>
                      </div>

                      {/* B2B Wholesale Price */}
                      <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label" style={{ fontWeight: '800', color: '#92400E' }}>
                          {isQuickWeight ? 'سعر جملة الكيلو للـ B2B (ج.م)' : 'سعر جملة القطعة للـ B2B (ج.م)'}
                        </label>
                        <input
                          type="text"
                          inputMode="decimal"
                          dir="ltr"
                          value={quickPriceData.wholesalePricePerKg}
                          onChange={(e) => {
                            const val = toLatinDigits(e.target.value);
                            if (val === '' || /^\d*\.?\d*$/.test(val)) {
                              setQuickPriceData({ ...quickPriceData, wholesalePricePerKg: val });
                            }
                          }}
                          className="form-input"
                          style={{ fontWeight: '800', fontSize: '1rem', color: '#B45309', background: '#ffffff' }}
                        />
                        <span style={{ fontSize: '0.72rem', color: '#92400E' }}>
                          مخصص للمقاهي والشركات
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Profit Preview */}
              {(() => {
                const isQuickWeight = quickEditProduct.unitType === 'weight' || quickEditProduct.category === 'specialty' || quickEditProduct.category === 'classic_blends' || quickEditProduct.category === 'espresso' || quickEditProduct.category === 'filter' || quickEditProduct.category === 'coffee';
                const pVal = Number(quickPriceData.pricePerKg) || 0;
                const cVal = Number(quickPriceData.costPerKg) || 0;
                return (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '10px 14px', borderRadius: '10px' }}>
                    <span style={{ fontSize: '0.84rem', fontWeight: '800', color: '#065F46' }}>
                      {isQuickWeight ? 'هامش الربح المتوقع لكل كيلو:' : 'هامش الربح المتوقع لكل قطعة:'}
                    </span>
                    <strong style={{ fontSize: '1.05rem', color: '#059669', fontWeight: '900' }}>
                      +{Math.max(0, pVal - cVal)} ج.م / {isQuickWeight ? 'كجم' : 'قطعة'}
                    </strong>
                  </div>
                );
              })()}

              <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setQuickEditProduct(null)}
                  className="btn btn-outline"
                  style={{ flex: 1, height: '42px', borderRadius: '10px' }}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    flex: 2,
                    height: '42px',
                    fontWeight: '800',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #059669, #047857)',
                    borderColor: '#059669'
                  }}
                >
                  حفظ وتحديث الأسعار
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🔍 MODAL 2: HIGH-RES COFFEE BAG PREVIEW MODAL 🔍                         */}
      {/* ========================================================================= */}
      {zoomBagProduct && (
        <div className="modal-overlay" onClick={() => setZoomBagProduct(null)} style={{ zIndex: 1200 }}>
          <div
            className="modal-content"
            style={{
              maxWidth: '680px',
              padding: '24px',
              borderRadius: '20px',
              background: '#FAF6ED',
              border: '2px solid #E0D3C1',
              boxShadow: '0 25px 60px rgba(35, 24, 21, 0.35)',
              maxHeight: '92vh',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1.5px solid #EBDDCB', paddingBottom: '12px', marginBottom: '16px' }}>
              <div>
                <span style={{ fontSize: '0.78rem', background: '#E8F5E9', color: '#2E7D32', padding: '2px 8px', borderRadius: '10px', fontWeight: '800' }}>
                  معاينة وتصميم كيس القهوة الفاخر ☕
                </span>
                <h3 style={{ fontSize: '1.35rem', fontWeight: '900', color: '#2D1810', margin: '4px 0 0 0' }}>
                  {zoomBagProduct.name}
                </h3>
              </div>
              <button onClick={() => setZoomBagProduct(null)} className="btn-icon" style={{ width: '32px', height: '32px' }}>
                <X size={18} />
              </button>
            </div>

            {/* Bag Variant Label */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
              <span
                style={{
                  padding: '6px 18px',
                  borderRadius: '20px',
                  border: '1.5px solid #8B5E34',
                  background: '#FEF3C7',
                  color: '#92400E',
                  fontWeight: '800',
                  fontSize: '0.82rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {(zoomBagProduct.category === 'classic_blends' || zoomBagProduct.category === 'coffee')
                  ? '☕ كيس كاتورا القائم (Stand-up Pouch) • 250 جم'
                  : '☕ كيس كاتورا المعتمد (العريض) • 250 جم'}
              </span>
            </div>

            {/* Large Bag Mockup Display */}
            <div style={{ padding: '16px 0', display: 'flex', justifyContent: 'center' }}>
              {zoomBagProduct.image && zoomBagProduct.image.startsWith('data:') ? (
                <img
                  src={zoomBagProduct.image}
                  alt={zoomBagProduct.name}
                  style={{
                    maxHeight: '460px',
                    maxWidth: '100%',
                    borderRadius: '16px',
                    boxShadow: '0 16px 36px rgba(45, 24, 16, 0.22)',
                    objectFit: 'contain'
                  }}
                />
              ) : (zoomBagProduct.category === 'classic_blends' || zoomBagProduct.category === 'coffee') ? (
                <img
                  src={zoomBagProduct.image || '/bags/bag_classic_blends.jpg'}
                  alt={zoomBagProduct.name}
                  style={{
                    maxHeight: '460px',
                    maxWidth: '100%',
                    borderRadius: '16px',
                    boxShadow: '0 16px 36px rgba(45, 24, 16, 0.22)',
                    objectFit: 'contain'
                  }}
                />
              ) : (
                <img
                  src={zoomBagProduct.image || '/bags/bag_espresso_landscape.jpg'}
                  alt={zoomBagProduct.name}
                  style={{
                    maxHeight: '460px',
                    maxWidth: '100%',
                    borderRadius: '16px',
                    boxShadow: '0 16px 36px rgba(45, 24, 16, 0.22)',
                    objectFit: 'contain'
                  }}
                />
              )}
            </div>

            {/* Direct Studio Launch Button */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '6px', marginBottom: '14px' }}>
              <button
                type="button"
                onClick={() => {
                  const p = zoomBagProduct;
                  setZoomBagProduct(null);
                  setActiveBagStudioProduct(p);
                }}
                style={{
                  background: 'linear-gradient(135deg, #15803D, #166534)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '24px',
                  padding: '9px 24px',
                  fontSize: '0.88rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(21, 128, 61, 0.35)'
                }}
              >
                <Sparkles size={16} color="#BBF7D0" />
                <span>تعديل وضبط تصميم الكيس في الاستوديو 🎨</span>
              </button>
            </div>

            {/* Sensory & Origin Specs Details */}
            <div
              style={{
                marginTop: '16px',
                background: '#ffffff',
                border: '1.5px solid #E8D5C4',
                borderRadius: '12px',
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', borderBottom: '1px solid #F0E6DD', paddingBottom: '8px' }}>
                <strong style={{ color: '#2D1810', fontSize: '0.92rem' }}>
                  معلومات المحصول وبطاقة التذوق (Sensory Profile):
                </strong>
                <span style={{ fontSize: '0.8rem', color: '#6F4E37', fontWeight: '800' }}>
                  {zoomBagProduct.coffeeOrigin?.altitude ? `الارتفاع: ${zoomBagProduct.coffeeOrigin.altitude}` : ''}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', fontSize: '0.82rem' }}>
                <div>
                  <span style={{ color: '#8C7A6B' }}>بلد المنشأ:</span>
                  <div style={{ fontWeight: '800', color: '#2D1810' }}>
                    {getCountryMeta(zoomBagProduct.coffeeOrigin?.country).flag} {zoomBagProduct.coffeeOrigin?.country || zoomBagProduct.country || 'كولومبيا'}
                  </div>
                </div>
                <div>
                  <span style={{ color: '#8C7A6B' }}>السلالة:</span>
                  <div style={{ fontWeight: '800', color: '#2D1810' }}>
                    {zoomBagProduct.coffeeOrigin?.variety || 'Caturra'}
                  </div>
                </div>
                <div>
                  <span style={{ color: '#8C7A6B' }}>طريقة المعالجة:</span>
                  <div style={{ fontWeight: '800', color: '#153825' }}>
                    {zoomBagProduct.coffeeOrigin?.process || 'Washed'}
                  </div>
                </div>
                <div>
                  <span style={{ color: '#8C7A6B' }}>درجة التحميص:</span>
                  <div style={{ fontWeight: '800', color: '#8B5E34' }}>
                    {zoomBagProduct.roastingProfile?.roastLevel || zoomBagProduct.roastLevel || 'Medium'}
                  </div>
                </div>
              </div>

              {/* Recipe Info */}
              {zoomBagProduct.espressoRecipe && (
                <div style={{ background: '#FAF7F2', padding: '10px 12px', borderRadius: '8px', marginTop: '4px', border: '1px dashed #D6C7B8' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: '800', color: '#6F4E37', marginBottom: '4px' }}>
                    معادلة الاستخلاص الموصى بها (Brewing Recipe):
                  </div>
                  <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', fontSize: '0.8rem', color: '#2D1810', fontWeight: '700' }}>
                    <span>جرام البن: {zoomBagProduct.espressoRecipe.dose}</span>
                    <span>•</span>
                    <span>الاستخلاص: {zoomBagProduct.espressoRecipe.yield}</span>
                    <span>•</span>
                    <span>الوقت: {zoomBagProduct.espressoRecipe.time}</span>
                    <span>•</span>
                    <span>الحرارة: {zoomBagProduct.espressoRecipe.temp}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  const target = zoomBagProduct;
                  setZoomBagProduct(null);
                  handleOpenQuickEdit(target);
                }}
                className="btn btn-outline"
                style={{
                  padding: '8px 16px',
                  borderRadius: '10px',
                  borderColor: '#8B5E34',
                  color: '#8B5E34',
                  fontWeight: '800',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <DollarSign size={15} />
                <span>تعديل سعر وتكلفة ومخزون هذا الصنف</span>
              </button>

              <button
                type="button"
                onClick={() => setZoomBagProduct(null)}
                className="btn btn-primary"
                style={{ padding: '8px 24px', borderRadius: '10px' }}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ⚙️ MODAL 3: FULL ADD / EDIT PRODUCT MODAL ⚙️                               */}
      {/* ========================================================================= */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: '680px', padding: '24px', maxHeight: '92vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-light)', paddingBottom: '14px', marginBottom: '18px' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--mint-900)' }}>
                {editingProduct 
                  ? ((formData.unitType === 'piece' || formData.category === 'tools') ? 'تعديل بيانات الأداة والأسعار والمخزون' : 'تعديل بيانات المحصول والأسعار والمعايرة') 
                  : 'إضافة منتج جديد للمنظومة'}
              </h2>
              <button onClick={() => setIsAddModalOpen(false)} className="btn-icon" style={{ width: '32px', height: '32px' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Product Category & Brewing Type Choice */}
              <div style={{ background: '#FAF7F2', padding: '14px', borderRadius: '12px', border: '1.5px solid #E8D5C4' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: (formData.category === 'specialty' || formData.category === 'espresso' || formData.category === 'filter') ? '12px' : '0' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: '800', color: '#2D1810' }}>التصنيف الرئيسي *</label>
                    <select
                      value={formData.category}
                      onChange={(e) => {
                        const newCat = e.target.value;
                        const isWeightCat = newCat === 'specialty' || newCat === 'classic_blends' || newCat === 'fermented';
                        setFormData({
                          ...formData,
                          category: newCat,
                          unitType: isWeightCat ? 'weight' : 'piece'
                        });
                      }}
                      className="form-select"
                    >
                      {uniqueCategories.filter(c => c.id !== 'all').map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: '800', color: '#2D1810' }}>وحدة القياس *</label>
                    <select
                      value={formData.unitType || 'weight'}
                      onChange={(e) => setFormData({ ...formData, unitType: e.target.value })}
                      className="form-select"
                    >
                      <option value="weight">بالوزن (كيلوجرام / جرام)</option>
                      <option value="piece">بالقطعة (أدوات وإكسسوارات)</option>
                    </select>
                  </div>
                </div>

                {/* Subcategory choice if Specialty Coffee */}
                {(formData.category === 'specialty' || formData.category === 'espresso' || formData.category === 'filter') && (
                  <div>
                    <label className="form-label" style={{ fontWeight: '800', color: '#2D1810', marginBottom: '8px', display: 'block', fontSize: '0.82rem' }}>
                      طريقة التحضير ومعايرة الاستخلاص الموصى بها داخل "بن مختص":
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, bagVariant: 'landscape', category: 'specialty', subCategory: 'espresso', recommendedFor: 'Espresso Machine — Milk Drinks' })}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '10px',
                          border: (formData.subCategory === 'espresso' || formData.category === 'espresso') ? '2px solid #8B5E34' : '1px solid #D6C7B8',
                          background: (formData.subCategory === 'espresso' || formData.category === 'espresso') ? '#FEF3C7' : '#ffffff',
                          color: (formData.subCategory === 'espresso' || formData.category === 'espresso') ? '#92400E' : '#4B5563',
                          fontWeight: '800',
                          fontSize: '0.86rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          textAlign: 'right'
                        }}
                      >
                        <Coffee size={20} color="#8B5E34" />
                        <div>
                          <div>قهوة إسبريسو</div>
                          <div style={{ fontSize: '0.72rem', color: '#92400E', fontWeight: '700' }}>موصى به للإسبريسو ومشروبات الحليب (كيس عرضي)</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, bagVariant: 'landscape', category: 'specialty', subCategory: 'filter', recommendedFor: 'Filter / Pour-Over (V60)' })}
                        style={{
                          padding: '10px 14px',
                          borderRadius: '10px',
                          border: (formData.subCategory === 'filter' || formData.category === 'filter') ? '2px solid #059669' : '1px solid #D6C7B8',
                          background: (formData.subCategory === 'filter' || formData.category === 'filter') ? '#ECFDF5' : '#ffffff',
                          color: (formData.subCategory === 'filter' || formData.category === 'filter') ? '#065F46' : '#4B5563',
                          fontWeight: '800',
                          fontSize: '0.86rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          textAlign: 'right'
                        }}
                      >
                        <Scale size={20} color="#059669" />
                        <div>
                          <div>قهوة فلتر وبور أوفر</div>
                          <div style={{ fontSize: '0.72rem', color: '#065F46', fontWeight: '700' }}>موصى به لقهوة V60 والتقطير والتجارب (كيس طولي)</div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 📸 PRODUCT IMAGE UPLOADER & PREVIEW 📸 */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingImage(true);
                }}
                onDragLeave={() => setIsDraggingImage(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingImage(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) handleImageFileChange(file);
                }}
                style={{
                  background: isDraggingImage ? '#FEF3C7' : '#FAF7F2',
                  padding: '14px 16px',
                  borderRadius: '12px',
                  border: isDraggingImage ? '2px dashed #D97706' : '1.5px solid #E8D5C4',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" style={{ fontWeight: '800', color: '#2D1810', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <ImageIcon size={17} color="#8B5E34" />
                    <span>صورة المنتج أو كيس القهوة</span>
                    <span style={{ fontSize: '0.74rem', color: '#92400E', fontWeight: '700' }}>(تظهر بالمتجر والفواتير ونقاط البيع)</span>
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setActiveBagStudioProduct(editingProduct || { ...formData, id: 'prod-new' })}
                      style={{
                        background: 'linear-gradient(135deg, #15803D, #166534)',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        fontSize: '0.78rem',
                        fontWeight: '800',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        boxShadow: '0 2px 6px rgba(21, 128, 61, 0.25)'
                      }}
                    >
                      <Sparkles size={13} color="#BBF7D0" />
                      <span>🎨 تصميم كيس مخصص لهذا المنتج</span>
                    </button>
                    {formData.image && (
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, image: '' }))}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#dc2626',
                        fontSize: '0.74rem',
                        fontWeight: '700',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '2px 6px'
                      }}
                      title="إزالة الصورة"
                    >
                      <Trash2 size={13} />
                      <span>حذف الصورة</span>
                    </button>
                  )}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* Image Preview Box */}
                  <div
                    style={{
                      width: '90px',
                      height: '90px',
                      borderRadius: '10px',
                      border: '2px dashed #D6C7B8',
                      background: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      position: 'relative',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      flexShrink: 0
                    }}
                  >
                    {formData.image ? (
                      <img
                        src={formData.image}
                        alt="Product Preview"
                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '6px' }}>
                        <ImageIcon size={26} color="#D1D5DB" />
                        <div style={{ fontSize: '0.66rem', marginTop: '2px', fontWeight: '700' }}>لا توجد صورة</div>
                      </div>
                    )}
                  </div>

                  {/* Upload Actions & Drag-Drop Trigger */}
                  <div style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <label
                        style={{
                          background: 'linear-gradient(135deg, #8B5E34 0%, #6F4E37 100%)',
                          color: '#ffffff',
                          padding: '8px 16px',
                          borderRadius: '8px',
                          fontSize: '0.82rem',
                          fontWeight: '800',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 6px rgba(111, 78, 55, 0.25)',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <Upload size={15} />
                        <span>ارفع صورة من جهازك</span>
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleImageFileChange(file);
                            e.target.value = '';
                          }}
                        />
                      </label>

                      <button
                        type="button"
                        onClick={() => setShowUrlInput(!showUrlInput)}
                        style={{
                          background: '#ffffff',
                          color: '#4B5563',
                          border: '1px solid #D1D5DB',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          fontSize: '0.78rem',
                          fontWeight: '700',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px'
                        }}
                      >
                        <LinkIcon size={14} />
                        <span>رابط صورة خارجي</span>
                      </button>
                    </div>

                    <div style={{ fontSize: '0.73rem', color: '#6B7280' }}>
                      يمكنك سحب وإفلات صورة هنا أو اختيارها من جهازك (JPG, PNG, WEBP)
                    </div>

                    {showUrlInput && (
                      <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
                        <input
                          type="text"
                          placeholder="https://example.com/coffee-bag.jpg أو /bags/..."
                          value={formData.image || ''}
                          onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                          className="form-input"
                          style={{ height: '34px', fontSize: '0.8rem', flex: 1 }}
                          dir="ltr"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Presets of Official Caturra Coffee Bags */}
                <div>
                  <div style={{ fontSize: '0.73rem', fontWeight: '800', color: '#6F4E37', marginBottom: '6px' }}>
                    أو اختر قالباً معتمداً لأكياس ومعدات كاتورا بضغطة واحدة:
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {productImgPresets.map((preset) => {
                      const isSelected = formData.image === preset.path;
                      return (
                        <button
                          key={preset.path}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, image: preset.path }))}
                          style={{
                            background: isSelected ? '#FEF3C7' : '#ffffff',
                            color: isSelected ? '#92400E' : '#374151',
                            border: isSelected ? '1.5px solid #D97706' : '1px solid #E5E7EB',
                            borderRadius: '20px',
                            padding: '4px 10px',
                            fontSize: '0.72rem',
                            fontWeight: isSelected ? '800' : '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span style={{ fontSize: '0.85rem' }}>{preset.icon}</span>
                          <span>{preset.label}</span>
                          {isSelected && <Check size={12} color="#D97706" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Names */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: '800' }}>
                    {(formData.unitType === 'piece' || formData.category === 'tools') ? 'اسم الأداة / الصنف (بالعربية) *' : 'اسم المحصول (بالعربية) *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={(formData.unitType === 'piece' || formData.category === 'tools') ? 'مثال: غلاية ترشيح عنق الإوزة' : 'مثال: كولومبيا بينك'}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: '800' }}>
                    {(formData.unitType === 'piece' || formData.category === 'tools') ? 'الاسم بالإنجليزية *' : 'الاسم بالإنجليزية (يظهر على الكيس) *'}
                  </label>
                  <input
                    type="text"
                    placeholder={(formData.unitType === 'piece' || formData.category === 'tools') ? 'مثال: Electric Gooseneck Kettle' : 'مثال: Colombia Pink'}
                    value={formData.nameEn}
                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                    className="form-input"
                  />
                </div>
              </div>

              {/* Pricing & Stock (Cost, Selling, Stock, Wholesale) */}
              {!(formData.unitType === 'piece' || formData.category === 'tools') ? (
                <div style={{ background: '#FAF7F2', padding: '14px', borderRadius: '12px', border: '1.5px solid #E8D5C4' }}>
                  <div style={{ fontSize: '0.86rem', fontWeight: '800', color: '#2D1810', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <DollarSign size={16} />
                    <span>تحديد أسعار التكلفة والبيع والمخزون بالكيلوجرام:</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ color: '#6B7280', fontWeight: '700' }}>سعر تكلفة الكيلو *</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        dir="ltr"
                        required
                        placeholder="840"
                        value={formData.costPerKg}
                        onChange={(e) => {
                          const val = toLatinDigits(e.target.value);
                          if (val === '' || /^\d*\.?\d*$/.test(val)) {
                            setFormData({ ...formData, costPerKg: val });
                          }
                        }}
                        className="form-input"
                        style={{ fontWeight: '800' }}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ color: '#166534', fontWeight: '800' }}>سعر بيع الكيلو *</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        dir="ltr"
                        required
                        placeholder="1400"
                        value={formData.pricePerKg}
                        onChange={(e) => {
                          const val = toLatinDigits(e.target.value);
                          if (val === '' || /^\d*\.?\d*$/.test(val)) {
                            setFormData({ ...formData, pricePerKg: val });
                          }
                        }}
                        className="form-input"
                        style={{ borderColor: '#10B981', fontWeight: '800' }}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ color: '#92400E', fontWeight: '800' }}>جملة B2B للكيلو</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        dir="ltr"
                        placeholder="1100"
                        value={formData.wholesalePricePerKg}
                        onChange={(e) => {
                          const val = toLatinDigits(e.target.value);
                          if (val === '' || /^\d*\.?\d*$/.test(val)) {
                            setFormData({ ...formData, wholesalePricePerKg: val });
                          }
                        }}
                        className="form-input"
                        style={{ fontWeight: '800' }}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontWeight: '800' }}>المخزن (كجم) *</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        dir="ltr"
                        required
                        placeholder="40"
                        value={formData.stock}
                        onChange={(e) => {
                          const val = toLatinDigits(e.target.value);
                          if (val === '' || /^\d*\.?\d*$/.test(val)) {
                            setFormData({ ...formData, stock: val });
                          }
                        }}
                        className="form-input"
                        style={{ fontWeight: '800' }}
                      />
                    </div>
                  </div>

                  {/* Auto Calculated Price for 250g bag */}
                  <div style={{ marginTop: '8px', fontSize: '0.76rem', color: '#6F4E37', fontWeight: '700' }}>
                    💡 سعر بيع كيس الـ 250جم: <strong>{Math.round(Number(formData.pricePerKg || 0) / 4)} ج.م</strong> | تكلفة كيس 250جم: <strong>{Math.round(Number(formData.costPerKg || 0) / 4)} ج.م</strong>
                  </div>
                </div>
              ) : (
                <div style={{ background: '#FAF7F2', padding: '14px', borderRadius: '12px', border: '1.5px solid #E8D5C4' }}>
                  <div style={{ fontSize: '0.86rem', fontWeight: '800', color: '#2D1810', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <DollarSign size={16} />
                    <span>تحديد أسعار التكلفة والبيع والمخزون بالقطعة:</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ color: '#6B7280', fontWeight: '700' }}>سعر تكلفة القطعة *</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        dir="ltr"
                        required
                        placeholder="250"
                        value={formData.costPrice ?? ''}
                        onChange={(e) => {
                          const val = toLatinDigits(e.target.value);
                          if (val === '' || /^\d*\.?\d*$/.test(val)) {
                            setFormData({ ...formData, costPrice: val });
                          }
                        }}
                        className="form-input"
                        style={{ fontWeight: '800' }}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ color: '#166534', fontWeight: '800' }}>سعر بيع القطعة *</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        dir="ltr"
                        required
                        placeholder="450"
                        value={formData.sellingPrice ?? ''}
                        onChange={(e) => {
                          const val = toLatinDigits(e.target.value);
                          if (val === '' || /^\d*\.?\d*$/.test(val)) {
                            setFormData({ ...formData, sellingPrice: val });
                          }
                        }}
                        className="form-input"
                        style={{ borderColor: '#10B981', fontWeight: '800' }}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ color: '#92400E', fontWeight: '800' }}>سعر جملة B2B</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        dir="ltr"
                        placeholder="350"
                        value={formData.wholesalePricePerKg ?? ''}
                        onChange={(e) => {
                          const val = toLatinDigits(e.target.value);
                          if (val === '' || /^\d*\.?\d*$/.test(val)) {
                            setFormData({ ...formData, wholesalePricePerKg: val });
                          }
                        }}
                        className="form-input"
                        style={{ fontWeight: '800' }}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label" style={{ fontWeight: '800' }}>المخزن (قطع) *</label>
                      <input
                        type="text"
                        inputMode="decimal"
                        dir="ltr"
                        required
                        placeholder="10"
                        value={formData.stock ?? ''}
                        onChange={(e) => {
                          const val = toLatinDigits(e.target.value);
                          if (val === '' || /^\d*\.?\d*$/.test(val)) {
                            setFormData({ ...formData, stock: val });
                          }
                        }}
                        className="form-input"
                        style={{ fontWeight: '800' }}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: '8px', fontSize: '0.76rem', color: '#059669', fontWeight: '800' }}>
                    ✨ ربح القطعة الواحدة: <strong>{Math.max(0, (Number(formData.sellingPrice) || 0) - (Number(formData.costPrice) || 0))} ج.م</strong>
                  </div>
                </div>
              )}

              {/* Origin Specs for Coffee OR Notes for Tools */}
              {!(formData.unitType === 'piece' || formData.category === 'tools') ? (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <SmartSpecCombobox
                        label="بلد المنشأ"
                        value={formData.country}
                        onChange={(val) => setFormData(prev => ({ ...prev, country: val }))}
                        placeholder="Colombia, Brazil..."
                        storageKey="caturra_spec_country"
                        existingProducts={products}
                        extractField={(p) => p.coffeeOrigin?.country || p.country}
                        listId="list-countries"
                        defaultOptions={[
                          'Colombia', 'Ethiopia', 'Brazil', 'Kenya', 'Guatemala',
                          'Costa Rica', 'Panama', 'Jamaica', 'Indonesia', 'Rwanda',
                          'Peru', 'Yemen', 'El Salvador', 'Honduras', 'Nicaragua', 'Mexico',
                          'كولومبيا', 'إثيوبيا', 'البرازيل', 'كينيا', 'جواتيمالا', 'كوستاريكا', 'بنما', 'اليمن'
                        ]}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <SmartSpecCombobox
                        label="المنطقة والارتفاع"
                        value={formData.region}
                        onChange={(val) => setFormData(prev => ({ ...prev, region: val }))}
                        placeholder="Huila, 1800m..."
                        storageKey="caturra_spec_region"
                        existingProducts={products}
                        extractField={(p) => p.coffeeOrigin?.region || p.region}
                        listId="list-regions"
                        defaultOptions={[
                          'Huila (1,600 — 1,900 masl)', 'Huila',
                          'Guji (1,800 — 2,200 masl)', 'Guji',
                          'Yirgacheffe (1,900 — 2,200 masl)', 'Yirgacheffe',
                          'Cerrado Mineiro (1,100 masl)', 'Cerrado',
                          'Antioquia', 'Cauca', 'Nariño', 'Sidamo',
                          'Tarrazú', 'Boquete', 'Blue Mountain',
                          'هويلا', 'قوجي', 'يرجاشيفي', 'سيرادو', 'تارازو'
                        ]}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <SmartSpecCombobox
                        label="السلالة (Variety)"
                        value={formData.variety}
                        onChange={(val) => setFormData(prev => ({ ...prev, variety: val }))}
                        placeholder="Caturra, Typica..."
                        storageKey="caturra_spec_variety"
                        existingProducts={products}
                        extractField={(p) => p.coffeeOrigin?.variety || p.variety}
                        listId="list-varieties"
                        defaultOptions={[
                          'Caturra', 'Castillo', 'Heirloom', 'Bourbon', 'Yellow Bourbon',
                          'Geisha', 'Typica', 'SL28 / SL34', 'Catuaí', 'Mundo Novo',
                          'Catimor', 'Pacamara', 'Maragogipe', 'Sidra', 'Pink Bourbon',
                          'كاتورا', 'كاستيلو', 'إيرلوم', 'بوربون', 'قيشا', 'تيبيكا'
                        ]}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <SmartSpecCombobox
                        label="المعالجة (Process)"
                        value={formData.process}
                        onChange={(val) => setFormData(prev => ({ ...prev, process: val }))}
                        placeholder="Washed, Natural..."
                        storageKey="caturra_spec_process"
                        existingProducts={products}
                        extractField={(p) => p.coffeeOrigin?.process || p.process}
                        listId="list-processes"
                        defaultOptions={[
                          'Washed', 'Natural', 'Honey', 'Anaerobic', 'Carbonic Maceration',
                          'Fermented', 'Lactic Fermentation', 'Wet-Hulled',
                          'مغسولة (Washed)', 'مجففة (Natural)', 'عسلية (Honey)',
                          'تخمير لاهوائي (Anaerobic)', 'مخمرة (Fermented)'
                        ]}
                      />
                    </div>
                  </div>

                  {/* Flavor notes & Roast Level */}
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                      <SmartSpecCombobox
                        label="إيحاءات التذوق (تظهر على الكيس)"
                        value={formData.flavorNotes}
                        onChange={(val) => setFormData(prev => ({ ...prev, flavorNotes: val, notes: val }))}
                        placeholder="Red Apple / Citrus / Raw Sugar"
                        storageKey="caturra_spec_notes"
                        existingProducts={products}
                        extractField={(p) => p.sensoryProfile?.flavorNotes || p.notes}
                        listId="list-notes"
                        defaultOptions={[
                          'Caramel / Peach / Nutty Chocolate',
                          'Red Apple / Citrus / Raw Sugar',
                          'Cantaloupe / Pineapple / Green Apple',
                          'Citrus / Brown Sugar / Caramel / Balanced',
                          'Blueberry / Floral / Lemon Tea',
                          'Blackcurrant / Grapefruit / Brown Sugar',
                          'Chocolate / Hazelnut / Caramel',
                          'Jasmine / Bergamot / Peach',
                          'Honey / Dried Fruits / Dark Chocolate',
                          'Vanilla / Milk Chocolate / Roasted Almonds',
                          'كراميل / خوخ / شوكولاتة بالمكسرات',
                          'تفاح أحمر / حمضيات / سكر خام',
                          'توت / ياسمين / شاي ليمون'
                        ]}
                      />
                    </div>

                    <div className="form-group" style={{ margin: 0 }}>
                      <label className="form-label">درجة التحميص</label>
                      <select
                        value={formData.roastLevel}
                        onChange={(e) => setFormData({ ...formData, roastLevel: e.target.value })}
                        className="form-select"
                      >
                        <option value="Light">Light (خفيف)</option>
                        <option value="Light to Medium">Light to Medium (خفيف إلى متوسط)</option>
                        <option value="Medium">Medium (متوسط)</option>
                        <option value="Medium to Dark">Medium to Dark (متوسط إلى داكن)</option>
                      </select>
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label">وصف ومميزات الأداة</label>
                    <textarea
                      rows={2}
                      placeholder="وصف تفصيلي لأداة التحضير ومميزاتها واستخداماتها..."
                      value={formData.description || formData.notesAr || formData.notes || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value, notesAr: e.target.value })}
                      className="form-input"
                      style={{ height: '70px', resize: 'vertical' }}
                    />
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn btn-outline"
                  style={{ flex: 1, height: '44px' }}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 2, height: '44px', fontWeight: '800' }}
                >
                  {editingProduct ? 'حفظ كافة التعديلات' : 'إضافة الصنف للنظام والمخازن'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD CATEGORY */}
      {isAddCategoryOpen && (
        <div className="modal-overlay" onClick={() => setIsAddCategoryOpen(false)}>
          <div
            className="modal-content"
            style={{ maxWidth: '420px', padding: '24px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: 'var(--mint-900)', margin: 0 }}>
                إضافة تصنيف جديد
              </h3>
              <button onClick={() => setIsAddCategoryOpen(false)} className="btn-icon">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleAddCategorySubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">اسم التصنيف الجديد</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: مشروبات باردة، كبسولات..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="form-input"
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddCategoryOpen(false)}
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                >
                  إلغاء
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  حفظ التصنيف
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <InventoryImportModal
        isOpen={isImportModalOpen}
        previewData={importPreviewData}
        onClose={() => setIsImportModalOpen(false)}
        onConfirm={handleConfirmImport}
      />

      {/* 🎨 Caturra Packaging Studio v6 Modal */}
      <BagStudioModal
        product={activeBagStudioProduct}
        isOpen={!!activeBagStudioProduct}
        onClose={() => setActiveBagStudioProduct(null)}
        onSaveSuccess={(productId, updates) => {
          if (editingProduct && editingProduct.id === productId) {
            setFormData(prev => ({ ...prev, ...updates }));
          }
        }}
      />
    </div>
  );
};
