import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  ShoppingBag,
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Coffee,
  CheckCircle,
  Shield,
  ArrowRight,
  Store,
  Sparkles,
  Phone,
  MapPin,
  MessageSquare,
  Printer,
  ChevronLeft,
  Scale,
  Home,
  X,
  Bot,
  Bell,
  Mail,
  Clock,
  Award,
  MessageCircle,
  ExternalLink,
  CreditCard,
  Lock,
  GraduationCap,
  BookOpen,
  FileText,
  Download,
  Truck,
  UploadCloud,
  Smartphone,
  Zap,
  Check,
  Copy,
  Image,
  Eye,
  Flame,
  Tag,
  Info,
  ChevronDown,
  Heart,
  User,
  Send,
  Compass,
  ArrowUp,
  SlidersHorizontal,
  Filter,
  Globe,
  RotateCcw,
  Maximize2
} from 'lucide-react';
import { CoffeeBagMockup, RoastDots, getCountryMeta } from '../components/CoffeeBagMockup';
import { getLocalizedProcess, getLocalizedBrewMethod } from '../utils/translations';
import { StoreAiAssistant } from '../components/StoreAiAssistant';
import { StoreB2BView } from '../components/StoreB2BView';
import { TvOffersTicker } from '../components/TvOffersTicker';
import {
  STORE_WHATSAPP_NUMBER,
  generateWhatsAppOrderUrl,
  formatWhatsAppNumber
} from '../utils/whatsapp';
import { downloadPdfFile } from '../utils/pdfStorage';
import { PdfReaderModal } from '../components/PdfReaderModal';
import { initialBrewingGuides } from '../data/initialData';
import {
  exportSingleInvoicePdf,
  downloadInvoicePdf,
  sendInvoicePdfToWhatsApp
} from '../utils/exportUtils';
import { calculateStoreStats } from '../utils/storeStats';
import { resolveProductImage, isToolProduct } from '../utils/productImages';

const GoogleDriveIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 87.3 78" fill="none" style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle' }}>
    <path d="M6.6 66.85l3.85 6.65c.8 1.4 1.9 2.5 3.2 3.3L27.1 53 13.65 29.7H0l1.9 3.3 4.7 33.85z" fill="#0066DA" />
    <path d="M43.65 25L29.9 1.25C28.6.45 27.1 0 25.5 0h24c-1.6 0-3.1.45-4.4 1.25L43.65 25z" fill="#00AC47" />
    <path d="M73.55 76.8c1.3-.8 2.4-1.9 3.2-3.3l10.55-18.3 1.9-3.3-13.65-23.7H43.65L57.15 52l16.4 24.8z" fill="#EA4335" />
    <path d="M43.65 25L57.15 52H27.1L13.65 28.2 27.1 4.7c1.3-.8 2.8-1.2 4.4-1.2h24.3c1.6 0 3.1.4 4.4 1.2L73.65 25H43.65z" fill="#00832D" />
    <path d="M57.15 52H27.1L13.65 75.5c1.3.8 2.8 1.3 4.4 1.3h51.2c1.6 0 3.1-.5 4.4-1.3L57.15 52z" fill="#2684FC" />
    <path d="M87.3 55.2l-10.55 18.3c-.8 1.4-1.9 2.5-3.2 3.3L57.15 52H27.1l16.55-27h30l13.65 23.7-13.65 6.5z" fill="#FFBA00" />
  </svg>
);

const copyImageToClipboard = async (file) => {
  try {
    if (navigator?.clipboard?.write && window.ClipboardItem && file) {
      await navigator.clipboard.write([
        new window.ClipboardItem({ [file.type]: file })
      ]);
    }
  } catch (e) {
    console.debug('Clipboard write not allowed or supported', e);
  }
};

const uploadReceiptToCloud = async (_file) => {
  return '';
};



export const ClientStorefront = () => {
  const {
    products,
    categories,
    invoices = [],
    batches = [],
    createSale,
    openInvoiceModal,
    setViewMode,
    openNotificationSettings,
    isAuthenticated,
    academyArticles = [],
    contactInfo,
    openTrackingModal,
    language,
    toggleLanguage,
    t,
    isRtl,
    getLocalizedName,
    getLocalizedNotes,
    getLocalizedOrigin,
    getLocalizedRoast,
    getLocalizedCategory,
    formatPrice,
    brewingGuides = {}
  } = useApp();

  const activeWhatsApp = contactInfo?.whatsapp || STORE_WHATSAPP_NUMBER;
  const cleanStoreWhatsApp = formatWhatsAppNumber(activeWhatsApp);
  const activePhone = contactInfo?.phone || '01033144498';
  const activeEmail = contactInfo?.email || 'contact@caturracoffee.com';
  const activeAddress = (language === 'en')
    ? (contactInfo?.addressEn || (contactInfo?.address?.includes('قريباً') ? 'Coming Soon - Cairo & Egypt' : contactInfo?.address || 'Cairo, Heliopolis - Al-Thawra St., near Al-Ahram Station'))
    : (contactInfo?.address || 'القاهرة، مصر الجديدة - شارع الثورة، بالقرب من محطة الأهرام');
  const activeHours = (language === 'en')
    ? (contactInfo?.workingHoursEn || (contactInfo?.workingHours?.includes('يومياً') ? 'Daily: 8:00 AM – 12:00 Midnight' : contactInfo?.workingHours || 'Daily: 8:00 AM – 12:00 Midnight'))
    : (contactInfo?.workingHours || 'يومياً من 8:00 صباحاً حتى 12:00 منتصف الليل');
  const activeShipping = (language === 'en')
    ? (contactInfo?.shippingInfoEn || (contactInfo?.shippingInfo?.includes('شحن') ? 'Express shipping across all Egypt in 24-48 hours 🚚' : contactInfo?.shippingInfo || 'Express shipping across all Egypt in 24-48 hours 🚚'))
    : (contactInfo?.shippingInfo || 'شحن لجميع المحافظات خلال 24-48 ساعة 🚚');
  const activeAboutUs = contactInfo?.aboutUs || (language === 'en' ? 'Caturra is a 100% Egyptian specialty coffee roastery. We believe every coffee seed tells an extraordinary tale. We handpick fine green lots from Ethiopia, Colombia, and Brazil, roasting them with unwavering precision.' : 'كاتورا (Caturra) محمصة ومتجر قهوة مختصة مصري 100%. نؤمن بأن كل حبة بن تروي قصة فريدة. ننتقي بعناية أفضل المحاصيل الخضراء من مزارع إثيوبيا، كولومبيا، والبرازيل، ونحمصها بدرجات متوازنة لإبراز النكهات العطرية والإيحاءات الفاكهية والزهرية الفاخرة بدون أي إضافات صناعية.');
  const activeInstagram = contactInfo?.instagram || 'https://instagram.com';
  const activeFacebook = contactInfo?.facebook || 'https://facebook.com';
  const activeTiktok = contactInfo?.tiktok || 'https://tiktok.com';

  // 📊 Live Dynamic Roastery & Storefront Statistics (Sales, Cups, Lots, Experience)
  const storeStats = useMemo(() => {
    return calculateStoreStats({
      products,
      invoices,
      contactInfo,
      academyArticles
    });
  }, [products, invoices, contactInfo, academyArticles]);

  const [hasEnteredStore, setHasEnteredStore] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      if (p.get('entered') === 'true' || p.get('store') === 'true' || p.get('article') || p.get('invoice')) return true;
    }
    return false; // شاشة البداية الافتتاحية والترحيبية هي أول شاشة تظهر عند فتح الموقع
  });
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedOrigin, setSelectedOrigin] = useState('all_origins');
  const [isCategoryFilterOpen, setIsCategoryFilterOpen] = useState(true);
  const [isOriginFilterOpen, setIsOriginFilterOpen] = useState(true);
  const [isMobileFilterDrawerOpen, setIsMobileFilterDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileScreen, setIsMobileScreen] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 768 : false));

  useEffect(() => {
    const handleResize = () => {
      setIsMobileScreen(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 🏷️ Sticky Top Bar & ScrollSpy Category Tracker
  const [activeScrollCategory, setActiveScrollCategory] = useState('all');
  const activeScrollCategoryRef = useRef('all');
  const categoryTabsScrollRef = useRef(null);
  const categoryBarSentinelRef = useRef(null);
  const [isCategoryBarPinned, setIsCategoryBarPinned] = useState(false);
  const isAutoScrollingRef = useRef(false);

  const isToolCategory = (catId) => {
    return catId === 'tools' || catId === 'accessories' || catId === 'boxes' || catId === 'gifts';
  };

  const isToolProduct = (p) => {
    if (!p) return false;
    return p.category === 'tools' || p.category === 'accessories' || p.category === 'boxes' || p.category === 'gifts' || p.unitType === 'piece';
  };

  const productMatchesCategory = (p, catId) => {
    if (!p) return false;
    if (catId === 'all') return true;
    if (catId === 'fermented') {
      return p.category === 'fermented' || p.subCategory === 'fermented' || (p.nameEn && p.nameEn.toLowerCase().includes('fermented')) || (p.name && p.name.includes('مخمر'));
    }
    if (catId === 'specialty') {
      const isFermented = p.category === 'fermented' || p.subCategory === 'fermented' || (p.nameEn && p.nameEn.toLowerCase().includes('fermented')) || (p.name && p.name.includes('مخمر'));
      return !isFermented && (p.category === 'specialty' || p.category === 'espresso' || p.category === 'filter' || p.category === 'beans');
    }
    if (catId === 'classic_blends') {
      return p.category === 'classic_blends' || p.category === 'coffee';
    }
    if (catId === 'tools') return p.category === 'tools';
    if (catId === 'accessories') return p.category === 'accessories';
    if (catId === 'boxes') return p.category === 'boxes' || p.category === 'gifts';
    return p.category === catId;
  };

  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [isAcademyPageOpen, setIsAcademyPageOpen] = useState(false);
  const [academySearchQuery, setAcademySearchQuery] = useState('');
  const [selectedAcademyArticle, setSelectedAcademyArticle] = useState(null);
  const [academyCategoryFilter, setAcademyCategoryFilter] = useState('all');
  const [viewingAcademyPdf, setViewingAcademyPdf] = useState(null);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const [activeNav, setActiveNav] = useState(() => (hasEnteredStore ? 'store' : 'home'));
  const [aboutAnimKey, setAboutAnimKey] = useState(0);
  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('caturra_client_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isWishlistModalOpen, setIsWishlistModalOpen] = useState(false);
  const [isHeaderSearchOpen, setIsHeaderSearchOpen] = useState(false);
  // Product Details Modal State
  const [selectedProductDetails, setSelectedProductDetails] = useState(null);
  const [detailsWeight, setDetailsWeight] = useState(250); // grams
  const [detailsCustomWeight, setDetailsCustomWeight] = useState('');
  const [detailsGrind, setDetailsGrind] = useState('حبوب كاملة');
  const [detailsQty, setDetailsQty] = useState(1);
  const [bagVisualMode, setBagVisualMode] = useState('photo'); // 'photo' | 'mockup'
  const [isBagZoomed, setIsBagZoomed] = useState(false);
  const [bagPreviewVariant, setBagPreviewVariant] = useState('landscape'); // 'landscape' | 'vertical'
  const [activeBagSide, setActiveBagSide] = useState('front'); // 'front' | 'back' (interactive bag flip)
  const [legalModalType, setLegalModalType] = useState(null); // 'returns' | 'privacy' | 'terms' | null

  // Live synchronization of open product details modal when products or specs update
  useEffect(() => {
    if (!selectedProductDetails) return;
    const fresh = (products || []).find(p => p.id === selectedProductDetails.id);
    if (fresh) {
      setSelectedProductDetails(prev => (prev ? { ...prev, ...fresh } : fresh));
    }
  }, [products]);

  const [showScrollTop, setShowScrollTop] = useState(false);

  const centerCategoryPill = (catId) => {
    const pill = document.getElementById(`pill-cat-${catId}`);
    const container = categoryTabsScrollRef.current;
    if (!pill || !container) return;

    const pillLeft = pill.offsetLeft;
    const pillWidth = pill.offsetWidth;
    const containerWidth = container.offsetWidth;
    const targetScrollLeft = pillLeft - (containerWidth / 2) + (pillWidth / 2);

    container.scrollTo({
      left: Math.max(0, targetScrollLeft),
      behavior: 'smooth'
    });
  };

  // 🏷️ Sticky Top Bar & ScrollSpy: Smoothly and cleanly track category without vertical jitter
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let ticking = false;

    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);

      // 📌 100% Reliable Sticky Category Bar Pinning (Mobile & Desktop)
      if (categoryBarSentinelRef.current) {
        const sentinelRect = categoryBarSentinelRef.current.getBoundingClientRect();
        setIsCategoryBarPinned(sentinelRect.top <= 0);
      }

      if (isAutoScrollingRef.current) return;

      if (!ticking) {
        window.requestAnimationFrame(() => {
          const sections = document.querySelectorAll('.store-category-section');
          if (sections && sections.length > 0) {
            const threshold = 180;
            let currentActiveId = null;

            sections.forEach((sec) => {
              const rect = sec.getBoundingClientRect();
              if (rect.top <= threshold + 40 && rect.bottom > threshold) {
                currentActiveId = sec.getAttribute('data-category-id');
              }
            });

            // If we are above the first category section, highlight 'all'
            const firstSec = sections[0];
            if (firstSec && firstSec.getBoundingClientRect().top > threshold + 80) {
              currentActiveId = 'all';
            }

            if (currentActiveId && currentActiveId !== activeScrollCategoryRef.current) {
              activeScrollCategoryRef.current = currentActiveId;
              setActiveScrollCategory(currentActiveId);
              centerCategoryPill(currentActiveId);
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCategoryTabClick = (catId) => {
    if (activeScrollCategoryRef.current === catId && catId !== 'all') return;

    setActiveScrollCategory(catId);
    activeScrollCategoryRef.current = catId;
    isAutoScrollingRef.current = true;
    centerCategoryPill(catId);

    if (catId === 'all') {
      setSelectedCategory('all');
      const target = document.querySelector('.store-top-filter-bar-container') || document.getElementById('products-section');
      if (target) {
        const top = target.getBoundingClientRect().top + window.pageYOffset - 90;
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      }
    } else {
      setSelectedCategory('all');
      const sec = document.getElementById(`cat-sec-${catId}`);
      if (sec) {
        const top = sec.getBoundingClientRect().top + window.pageYOffset - 120;
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
      }
    }

    setTimeout(() => {
      isAutoScrollingRef.current = false;
    }, 950);
  };

  // 🔒 Lock background scrolling when any reader or storefront modal is open
  useEffect(() => {
    const isAnyModalOpen = !!(
      selectedAcademyArticle ||
      selectedProductDetails ||
      isWishlistModalOpen ||
      isCartOpen ||
      isCheckoutOpen ||
      completedOrder ||
      viewingAcademyPdf
    );
    if (isAnyModalOpen) {
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          if (viewingAcademyPdf) setViewingAcademyPdf(null);
          else if (selectedAcademyArticle) setSelectedAcademyArticle(null);
          else if (selectedProductDetails) setSelectedProductDetails(null);
          else if (isWishlistModalOpen) setIsWishlistModalOpen(false);
          else if (isCartOpen) setIsCartOpen(false);
          else if (isCheckoutOpen) setIsCheckoutOpen(false);
          else if (completedOrder) setCompletedOrder(null);
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = prevOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [
    selectedAcademyArticle,
    selectedProductDetails,
    isWishlistModalOpen,
    isCartOpen,
    isCheckoutOpen,
    completedOrder,
    viewingAcademyPdf
  ]);

  // 📝 Contact Form State (نموذج تواصل معنا)
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [contactFormSent, setContactFormSent] = useState(false);

  const handleContactFormChange = (e) => {
    const { name, value } = e.target;
    setContactForm(prev => ({ ...prev, [name]: value }));
  };

  const handleContactFormSubmit = (e) => {
    e.preventDefault();
    if (!contactForm.name.trim()) {
      alert('يرجى كتابة الاسم الكريم أولاً');
      return;
    }
    if (!contactForm.message.trim()) {
      alert('يرجى كتابة تفاصيل الرسالة أو الاستفسار');
      return;
    }

    // Format WhatsApp message dispatch
    const waText = `مرحباً محمصة كاتورا للقهوة المختصة ☕\nلدي استفسار جديد عبر الموقع:\n• الاسم: ${contactForm.name}\n• البريد: ${contactForm.email || 'غير محدد'}\n• الهاتف: ${contactForm.phone || 'غير محدد'}\n• الموضوع: ${contactForm.subject || 'استفسار عام'}\n• الرسالة:\n${contactForm.message}`;
    const waUrl = `https://wa.me/${cleanStoreWhatsApp}?text=${encodeURIComponent(waText)}`;
    window.open(waUrl, '_blank');

    setContactFormSent(true);
    setContactForm({ name: '', email: '', phone: '', subject: '', message: '' });
    setTimeout(() => setContactFormSent(false), 7000);
  };

  // 🔍 Dynamic Document Title for SEO and Browser Tabs
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (selectedProductDetails) {
      const pName = (language === 'en' && selectedProductDetails.nameEn) ? selectedProductDetails.nameEn : selectedProductDetails.name;
      document.title = `${pName} | محمصة كاتورا للقهوة المختصة (Caturra)`;
    } else if (selectedAcademyArticle) {
      const aTitle = (language === 'en' && selectedAcademyArticle.titleEn) ? selectedAcademyArticle.titleEn : selectedAcademyArticle.title;
      document.title = `${aTitle} | مدونة كاتورا للقهوة`;
    } else if (activeNav === 'b2b') {
      document.title = language === 'en' ? 'B2B Wholesale Specialty Coffee Cairo | Caturra Coffee' : 'شراكات وتوريد القهوة المختصة B2B للمقاهي والشركات | كاتورا';
    } else if (activeNav === 'academy') {
      document.title = language === 'en' ? 'Coffee Blog & Brewing Guides | Caturra Roastery' : 'مدونة ووصفات تحضير القهوة المختصة | محمصة كاتورا';
    } else if (activeNav === 'store') {
      document.title = language === 'en' ? 'Shop Specialty Coffee Beans | Caturra Coffee Roaster' : 'تسوق أرقى محاصيل القهوة المختصة | محمصة كاتورا';
    } else {
      document.title = language === 'en'
        ? 'Caturra Specialty Coffee | Roastery in Cairo & Heliopolis'
        : 'كاتورا للقهوة المختصة | بن مختص وتحميص محلي بالقاهرة ومصر الجديدة (Caturra)';
    }
  }, [selectedProductDetails, selectedAcademyArticle, activeNav, language]);

  const toggleWishlist = (productId) => {
    setWishlist(prev => {
      const exists = prev.includes(productId);
      const next = exists ? prev.filter(id => id !== productId) : [...prev, productId];
      try {
        localStorage.setItem('caturra_client_wishlist', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const isWishlisted = (productId) => wishlist.includes(productId);

  const handleNavClick = (id) => {
    setActiveNav(id);
    if (id === 'home') {
      setIsAcademyPageOpen(false);
      setHasEnteredStore(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (id === 'about') {
      setHasEnteredStore(true);
      setIsAcademyPageOpen(false);
      setActiveNav('about');
      setAboutAnimKey(k => k + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (id === 'store') {
      setHasEnteredStore(true);
      setIsAcademyPageOpen(false);
      setActiveNav('store');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (id === 'blog') {
      setHasEnteredStore(true);
      setIsAcademyPageOpen(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (id === 'b2b') {
      setHasEnteredStore(true);
      setIsAcademyPageOpen(false);
      setActiveNav('b2b');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (id === 'contact') {
      setHasEnteredStore(true);
      setIsAcademyPageOpen(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const navigateToStoreFromAcademy = (article = null) => {
    setSelectedAcademyArticle(null);
    setIsAcademyPageOpen(false);
    setHasEnteredStore(true);
    setActiveNav('store');

    if (article && article.category === 'tools') {
      setSelectedCategory('tools');
    } else if (article && (article.category === 'brewing' || article.category === 'beans')) {
      setSelectedCategory('specialty');
    } else {
      setSelectedCategory('all');
    }
    setSelectedOrigin('all_origins');
    setSearchQuery('');

    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }

    setTimeout(() => {
      const el = document.getElementById('products-section') || document.querySelector('.store-catalog-wrapper');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 120);
  };

  // Collapsible Footer Sections (Dropdowns) - all closed by default so all data is hidden
  const [openFooterSections, setOpenFooterSections] = useState({});

  const toggleFooterSection = (key) => {
    setOpenFooterSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };


  const handleOpenProductDetails = (product) => {
    setSelectedProductDetails(product);
    setDetailsWeight(250);
    setDetailsCustomWeight('');
    setDetailsGrind('حبوب كاملة');
    setDetailsQty(1);
    setBagVisualMode((product?.image?.startsWith('data:') && !product?.bagVariant) ? 'photo' : 'mockup');
    setBagPreviewVariant(product?.bagVariant || (
      product?.subCategory === 'filter' ||
        (product?.recommendedFor && (product.recommendedFor.includes('فلتر') || product.recommendedFor.toLowerCase().includes('filter') || product.recommendedFor.includes('V60')))
        ? 'vertical'
        : 'landscape'
    ));
    setActiveBagSide('front');
    setIsBagZoomed(false);
  };

  const handleProductSelectFromAi = (product) => {
    setHasEnteredStore(true);
    setActiveNav('store');
    handleOpenProductDetails(product);
  };

  // ☕ Brewing Recipe Guide Modal State (دليل ووصفة التحضير للباريستا)
  const [activeBrewingGuide, setActiveBrewingGuide] = useState(null);
  const [isBrewingGuideModalOpen, setIsBrewingGuideModalOpen] = useState(false);

  const mapGrindToRecipeKey = (grindId) => {
    if (!grindId) return 'v60';
    if (grindId.includes('V60') || grindId.includes('فلتر') || grindId.toLowerCase().includes('v60')) return 'v60';
    if (grindId.includes('إسبريسو') || grindId.toLowerCase().includes('espresso')) return 'espresso';
    if (grindId.includes('فرنش') || grindId.includes('كولد برو') || grindId.toLowerCase().includes('french')) return 'french_press';
    if (grindId.includes('حبوب') || grindId.toLowerCase().includes('whole')) return 'whole_beans';
    return 'v60';
  };

  const handleSelectGrind = (grindId, autoOpenModal = true) => {
    setDetailsGrind(grindId);
    const key = mapGrindToRecipeKey(grindId);
    const guide = selectedProductDetails?.customBrewingRecipe?.[key] || brewingGuides?.[key] || initialBrewingGuides?.[key];
    if (guide && autoOpenModal) {
      setActiveBrewingGuide({
        ...guide,
        productName: getLocalizedName(selectedProductDetails),
        productOrigin: getLocalizedOrigin(selectedProductDetails),
        productRoast: getLocalizedRoast(selectedProductDetails),
        productNotes: getLocalizedNotes(selectedProductDetails)
      });
      setIsBrewingGuideModalOpen(true);
    }
  };

  const handleOpenBrewingGuide = (grindId) => {
    const key = mapGrindToRecipeKey(grindId || detailsGrind);
    const guide = selectedProductDetails?.customBrewingRecipe?.[key] || brewingGuides?.[key] || initialBrewingGuides?.[key];
    if (guide) {
      setActiveBrewingGuide({
        ...guide,
        productName: getLocalizedName(selectedProductDetails),
        productOrigin: getLocalizedOrigin(selectedProductDetails),
        productRoast: getLocalizedRoast(selectedProductDetails),
        productNotes: getLocalizedNotes(selectedProductDetails)
      });
      setIsBrewingGuideModalOpen(true);
    }
  };

  // Customer Checkout Form
  // Customer Checkout Form (InstaPay, Mobile Wallet, Cash)
  const [custForm, setCustForm] = useState({
    name: '',
    phone: '',
    city: 'القاهرة',
    address: '',
    notes: '',
    paymentMethod: 'instapay', // Default to InstaPay
    transferReceipt: null, // Base64 image data
    transferReceiptFileName: '',
    transferSenderPhone: '',
    transferReceiptFile: null,
    transferReceiptHostedUrl: ''
  });

  const [receiptError, setReceiptError] = useState('');
  const [isSendingPdf, setIsSendingPdf] = useState(false);
  const [copiedPaymentKey, setCopiedPaymentKey] = useState('');

  // 🏷️ Promo Code / Discount Offer State
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState('');

  const handleCopyPaymentInfo = (text, key) => {
    try {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
        setCopiedPaymentKey(key);
        setTimeout(() => setCopiedPaymentKey(''), 2000);
      }
    } catch {
      // ignore
    }
  };

  const handleReceiptUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setReceiptError('يرجى اختيار ملف صورة صالح (JPG أو PNG)');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setReceiptError('حجم الصورة كبير جداً، يرجى اختيار صورة أقل من 8 ميجابايت');
      return;
    }

    setReceiptError('');
    const reader = new FileReader();
    reader.onload = (event) => {
      const rawBase64 = event.target.result;

      // 1. Immediately store the exact user-uploaded screenshot so it is guaranteed and never delayed
      setCustForm(prev => ({
        ...prev,
        transferReceipt: rawBase64,
        transferReceiptFileName: file.name,
        transferReceiptFile: file,
        transferReceiptHostedUrl: ''
      }));

      // 2. Compress via canvas so it saves lightweight and fast
      const img = new window.Image();
      img.onload = () => {
        try {
          const maxDim = 1200;
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
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.85);

          setCustForm(prev => ({
            ...prev,
            transferReceipt: compressedBase64
          }));
        } catch {
          // Keep rawBase64 if compression fails
        }
      };
      img.src = rawBase64;

      // Automatically copy to clipboard immediately so it's ready to paste
      copyImageToClipboard(file);

      // Background cloud upload to get a direct preview link for WhatsApp
      uploadReceiptToCloud(file).then(hostedUrl => {
        if (hostedUrl) {
          setCustForm(prev => ({ ...prev, transferReceiptHostedUrl: hostedUrl }));
        }
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveReceipt = () => {
    setCustForm(prev => ({
      ...prev,
      transferReceipt: null,
      transferReceiptFileName: '',
      transferReceiptFile: null,
      transferReceiptHostedUrl: ''
    }));
    setReceiptError('');
  };

  // Coffee origins matching roastery categories
  const coffeeOriginsList = [
    { id: 'all_origins', label: language === 'en' ? 'All Coffee Origins' : 'كل سلالات القهوة', query: '' },
    { id: 'colombian', label: language === 'en' ? 'Colombian' : 'كولومبي', query: 'كولومب' },
    { id: 'ethiopian', label: language === 'en' ? 'Ethiopian' : 'إثيوبي', query: 'إثيوب' },
    { id: 'brazilian', label: language === 'en' ? 'Brazilian' : 'برازيلي', query: 'برازيل' },
    { id: 'blend', label: language === 'en' ? 'Signature Blend' : 'بليند', query: 'بليند' },
    { id: 'indonesian', label: language === 'en' ? 'Indonesian' : 'إندونيسي', query: 'إندونيس' },
    { id: 'yemeni', label: language === 'en' ? 'Yemeni' : 'يمني', query: 'يمن' },
    { id: 'guatemalan', label: language === 'en' ? 'Guatemalan' : 'جواتيمالا', query: 'جواتيمال' },
    { id: 'ugandan', label: language === 'en' ? 'Ugandan' : 'أوغندي', query: 'أوغند' },
    { id: 'salvadoran', label: language === 'en' ? 'Salvadoran' : 'سلفادور', query: 'سلفادور' }
  ];

  const getCategoryCount = (catId) => {
    if (catId === 'all') return products.length;
    return products.filter(p => productMatchesCategory(p, catId)).length;
  };

  // 🌟 Clean, strictly ordered visible categories (Coffee first, Tools last, subcategories excluded, deduplicated) 🌟
  const visibleCategories = useMemo(() => {
    const list = (categories || [])
      .filter(cat => cat && cat.id)
      .filter(cat => !['espresso', 'filter', 'coffee', 'beans', 'syrups'].includes(cat.id))
      .filter(cat => cat.id === 'all' || getCategoryCount(cat.id) > 0);

    // Deduplicate by category ID and localized label so duplicate tabs never appear
    const seenIds = new Set();
    const seenTitles = new Set();
    const deduped = [];
    for (const c of list) {
      const title = getLocalizedCategory(c, language);
      if (!seenIds.has(c.id) && !seenTitles.has(title)) {
        seenIds.add(c.id);
        seenTitles.add(title);
        deduped.push(c);
      }
    }

    return deduped.sort((a, b) => {
      if (a.id === 'all') return -1;
      if (b.id === 'all') return 1;
      const aIsTool = isToolCategory(a.id);
      const bIsTool = isToolCategory(b.id);
      if (!aIsTool && bIsTool) return -1;
      if (aIsTool && !bIsTool) return 1;
      return 0;
    });
  }, [categories, products, language, getLocalizedCategory]);

  const getOriginCount = (query) => {
    if (!query) return products.filter(p => p.category === 'specialty' || p.category === 'classic_blends' || p.category === 'coffee' || p.category === 'espresso' || p.category === 'filter').length;
    return products.filter(p => {
      const origStr = `${p.country || ''} ${p.coffeeOrigin?.country || ''} ${p.origin || ''} ${p.name || ''} ${p.notes || ''} ${p.flavorNotes || ''}`;
      return origStr.toLowerCase().includes(query.toLowerCase());
    }).length;
  };

  const getCategoryEmoji = (catId) => {
    switch (catId) {
      case 'all': return '✨';
      case 'specialty': return '☕';
      case 'classic_blends': return '🫘';
      case 'fermented': return '🍇';
      case 'tools': return '⚗️';
      case 'accessories': return '🥛';
      case 'boxes': return '🎁';
      default: return '☕';
    }
  };

  // Filter products by category, origin, and search query (Always Coffee first, Tools at the end)
  const filteredProducts = products.filter(p => {
    let matchesCat = true;
    if (selectedCategory && selectedCategory !== 'all') {
      matchesCat = productMatchesCategory(p, selectedCategory);
    }

    let matchesOrigin = true;
    if (selectedOrigin && selectedOrigin !== 'all_origins') {
      const oObj = coffeeOriginsList.find(o => o.id === selectedOrigin);
      if (oObj && oObj.query) {
        const pText = `${p.country || ''} ${p.coffeeOrigin?.country || ''} ${p.origin || ''} ${p.name || ''} ${p.notes || ''} ${p.flavorNotes || ''} ${p.description || ''}`.toLowerCase();
        matchesOrigin = pText.includes(oObj.query.toLowerCase());
      }
    }

    const matchesQuery = !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.notes && p.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.flavorNotes && p.flavorNotes.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.country && p.country.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.coffeeOrigin?.country && p.coffeeOrigin.country.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.origin && p.origin.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCat && matchesOrigin && matchesQuery;
  }).sort((a, b) => {
    const aIsTool = isToolProduct(a);
    const bIsTool = isToolProduct(b);
    if (!aIsTool && bIsTool) return -1;
    if (aIsTool && !bIsTool) return 1;
    return 0;
  });

  // Open product details modal for customer
  const handleProductCardAction = (product) => {
    handleOpenProductDetails(product);
  };

  const addPieceToCart = (product) => {
    const cartItemId = `cart-pc-${product.id}`;
    setCart(prev => {
      const existing = prev.find(item => item.cartItemId === cartItemId);
      if (existing) {
        if (existing.qty >= product.stock) {
          alert('وصلت لأقصى كمية متوفرة في المخزن لهذا المنتج.');
          return prev;
        }
        return prev.map(item =>
          item.cartItemId === cartItemId ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [
        ...prev,
        {
          cartItemId,
          productId: product.id,
          name: product.name,
          unitType: 'piece',
          price: product.sellingPrice,
          costPrice: product.costPrice,
          image: product.image,
          qty: 1,
          stock: product.stock
        }
      ];
    });
    setIsCartOpen(true);
  };

  // Add product to cart directly from the Product Details Modal
  const handleAddFromDetailsModal = () => {
    if (!selectedProductDetails) return;
    const prod = selectedProductDetails;

    if (prod.stock <= 0) {
      alert('عذراً، هذا المنتج نفذت كميته مؤقتاً.');
      return;
    }

    const isWeight = prod.unitType === 'weight' || prod.category === 'specialty' || prod.category === 'classic_blends' || prod.category === 'espresso' || prod.category === 'filter' || prod.category === 'coffee';
    if (isWeight) {
      const grams = Number(detailsCustomWeight) > 0 ? Number(detailsCustomWeight) : Number(detailsWeight);
      if (grams <= 0) {
        alert('يرجى اختيار وزن صحيح');
        return;
      }

      const pricePerKg = Number(prod.pricePerKg) || (Number(prod.sellingPrice || 0) * 4);
      const costPerKg = Number(prod.costPerKg) || (Number(prod.costPrice || 0) * 4);
      const packagePrice = Math.round(pricePerKg * (grams / 1000));
      const packageCost = Math.round(costPerKg * (grams / 1000));
      const weightLabel = grams >= 1000 ? `${grams / 1000} كجم` : `${grams} جرام`;
      const cartItemId = `cart-wt-${prod.id}-${grams}-${detailsGrind}`;

      setCart(prev => {
        const existing = prev.find(item => item.cartItemId === cartItemId);
        if (existing) {
          return prev.map(item =>
            item.cartItemId === cartItemId ? { ...item, qty: item.qty + detailsQty } : item
          );
        }
        return [
          ...prev,
          {
            cartItemId,
            productId: prod.id,
            name: prod.name,
            unitType: 'weight',
            weightGram: grams,
            weightLabel: weightLabel,
            grind: detailsGrind,
            price: packagePrice,
            costPrice: packageCost,
            image: prod.image,
            qty: detailsQty,
            stock: prod.stock
          }
        ];
      });
    } else {
      // Piece product
      const cartItemId = `cart-pc-${prod.id}`;
      setCart(prev => {
        const existing = prev.find(item => item.cartItemId === cartItemId);
        if (existing) {
          if (existing.qty + detailsQty > prod.stock) {
            alert('وصلت لأقصى كمية متوفرة في المخزن لهذا المنتج.');
            return prev;
          }
          return prev.map(item =>
            item.cartItemId === cartItemId ? { ...item, qty: item.qty + detailsQty } : item
          );
        }
        return [
          ...prev,
          {
            cartItemId,
            productId: prod.id,
            name: prod.name,
            unitType: 'piece',
            price: prod.sellingPrice,
            costPrice: prod.costPrice,
            image: prod.image,
            qty: detailsQty,
            stock: prod.stock
          }
        ];
      });
    }

    setSelectedProductDetails(null);
    setIsCartOpen(true);
  };

  const updateCartQty = (cartItemId, delta) => {
    setCart(prev =>
      prev
        .map(item => {
          if (item.cartItemId === cartItemId) {
            const newQty = item.qty + delta;
            return { ...item, qty: newQty };
          }
          return item;
        })
        .filter(item => item.qty > 0)
    );
  };

  const removeFromCart = (cartItemId) => {
    setCart(prev => prev.filter(item => item.cartItemId !== cartItemId));
  };

  const cartSubtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const promoDiscountAmount = appliedPromo
    ? Math.round(cartSubtotal * (Number(appliedPromo.percent || 10) / 100))
    : 0;
  const cartTotal = Math.max(0, cartSubtotal - promoDiscountAmount);
  const totalCartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  // 🏷️ Apply & Remove Promo Code Handlers
  const handleApplyPromo = () => {
    if (!promoCodeInput.trim()) {
      setPromoError(t('promoEmptyError') || 'يرجى إدخال كود الخصم أولاً');
      return;
    }

    const cleanInput = promoCodeInput.trim().toUpperCase();
    const activeCode = (contactInfo?.promoCode || 'CATURRA10').trim().toUpperCase();
    const activePercent = Number(contactInfo?.promoDiscountPercent || 10);

    if (cleanInput === activeCode || cleanInput === 'CATURRA10') {
      const discount = Math.round(cartSubtotal * (activePercent / 100));
      setAppliedPromo({
        code: cleanInput,
        percent: activePercent,
        discountAmount: discount
      });
      setPromoError('');
      playNotificationSound();
      vibratePhone([80, 50, 80]);
    } else {
      setPromoError(t('promoInvalidError') || 'كود الخصم غير صحيح أو غير مفعل حالياً');
      vibratePhone([150]);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCodeInput('');
    setPromoError('');
  };

  // Submit Order (Creates pending order in Website DB and dispatches to WhatsApp simultaneously)
  const handleCheckoutSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!custForm.name || !custForm.phone) {
      alert('يرجى كتابة الاسم ورقم الموبايل لتوصيل الطلب');
      return;
    }

    // Required Sender Phone & Receipt Validation for InstaPay & Mobile Wallets
    if (custForm.paymentMethod === 'instapay' || custForm.paymentMethod === 'wallet') {
      if (!custForm.transferSenderPhone || !custForm.transferSenderPhone.trim()) {
        alert('⚠️ خطوة إلزامية: يرجى إدخال رقم الموبايل المحول منه لتأكيد ومطابقة عملية التحويل.');
        return;
      }
      if (!custForm.transferReceipt) {
        setReceiptError('⚠️ خطوة إلزامية: يرجى رفع صورة إشعار التحويل (الاسكرين شوت) أولاً لتأكيد وإرسال الطلب');
        alert('⚠️ يرجى إرفاق صورة إشعار التحويل (الاسكرين شوت) أولاً قبل إرسال الطلب لتأكيد الدفع.');
        return;
      }
    }

    const salePayload = {
      items: cart.map(it => ({
        productId: it.productId,
        name: it.name,
        unitType: it.unitType || 'piece',
        weightGram: it.weightGram,
        weightLabel: it.weightLabel,
        grind: it.grind,
        price: it.price,
        costPrice: it.costPrice,
        qty: it.qty,
        total: it.price * it.qty
      })),
      customerName: custForm.name,
      customerPhone: custForm.phone,
      customerAddress: `${custForm.city} - ${custForm.address}`,
      paymentMethod: custForm.paymentMethod,
      discount: promoDiscountAmount,
      promoCode: appliedPromo ? appliedPromo.code : '',
      paidAmount: (custForm.paymentMethod === 'instapay' || custForm.paymentMethod === 'wallet') ? cartTotal : 0,
      transferReceipt: custForm.transferReceipt || null,
      transferSenderPhone: custForm.transferSenderPhone || '',
      transferReceiptFileName: custForm.transferReceiptFileName || '',
      transferReceiptHostedUrl: custForm.transferReceiptHostedUrl || '',
      paymentDetails: {
        methodName: custForm.paymentMethod === 'instapay'
          ? 'إنستاباي (InstaPay)'
          : custForm.paymentMethod === 'wallet'
            ? 'محفظة إلكترونية (فودافون كاش ومحافظ المحمول)'
            : 'الدفع عند الاستلام (كاش)',
        hasReceipt: !!custForm.transferReceipt,
        senderPhone: custForm.transferSenderPhone || ''
      },
      source: 'online',
      status: 'pending' // Enters Admin ERP as a pending order until approved
    };

    const newInvoice = createSale(salePayload);
    setCart([]);
    setAppliedPromo(null);
    setPromoCodeInput('');
    setPromoError('');
    setIsCheckoutOpen(false);
    setCompletedOrder(newInvoice);

    // 1. Immediately & automatically dispatch the genuine PDF invoice file to WhatsApp quickly ("وبسرعه")
    setIsSendingPdf(true);
    sendInvoicePdfToWhatsApp(newInvoice, contactInfo, activeWhatsApp)
      .catch(err => {
        console.error('WhatsApp PDF dispatch error:', err);
      })
      .finally(() => {
        setIsSendingPdf(false);
      });
  };

  // Preset weights
  const presetWeights = [
    { label: language === 'en' ? '250g (Quarter Kg)' : '250 جرام (ربع كيلو)', grams: 250 },
    { label: language === 'en' ? '1000g (1 Kg)' : '1000 جرام (1 كجم)', grams: 1000 }
  ];

  const grindOptions = [
    { id: 'حبوب كاملة', label: language === 'en' ? 'Whole Beans (No Grind)' : 'حبوب كاملة (بدون طحن)' },
    { id: 'إسبريسو', label: language === 'en' ? 'Fine Espresso' : 'إسبريسو ناعم' },
    { id: 'V60 / فلتر', label: language === 'en' ? 'V60 Pour-over / Filter' : 'تقطير V60 / فلتر' },
    { id: 'فرنش برس', label: language === 'en' ? 'French Press / Cold Brew' : 'فرنش برس / كولد برو' }
  ];

  // ☕ LUXURY FLOATING CAPSULE NAVBAR (ESPRESSO & LATTE - هيدر الكبسولة الفاخر الموحد لجميع الصفحات) ☕
  const renderStoreNavbar = () => (
    <header
      className="store-navbar-header"
      style={{
        position: 'relative',
        zIndex: 90,
        width: '100%',
        padding: '12px 16px 0',
        boxSizing: 'border-box'
      }}
    >
      <div
        className="store-navbar-capsule"
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '7px 20px',
          background: 'rgba(35, 16, 9, 0.94)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1.5px solid rgba(212, 163, 115, 0.35)',
          borderRadius: '9999px',
          boxShadow: '0 10px 32px rgba(0, 0, 0, 0.55), 0 0 16px rgba(212, 163, 115, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          pointerEvents: 'auto',
          transition: 'all 0.3s ease'
        }}
      >
        {/* 1. BRAND LOGO (TEXT ONLY - نص حصراً بدون صورة كما طُلب) */}
        <div
          onClick={() => handleNavClick('home')}
          className="store-navbar-logo"
          style={{
            display: 'flex',
            flexDirection: 'column',
            textAlign: 'right',
            cursor: 'pointer',
            userSelect: 'none',
            flexShrink: 0,
            padding: '2px 8px'
          }}
          title="الرئيسية • محمصة كاتورا للقهوة المختصة"
        >
          <span
            className="store-brand-title"
            style={{
              fontSize: '1.35rem',
              fontWeight: '900',
              color: '#f5ebe1',
              lineHeight: '1.15',
              letterSpacing: '-0.3px',
              fontFamily: "'Outfit', 'Cairo', sans-serif"
            }}
          >
            {language === 'en' ? 'Caturra Roastery' : 'محمصة كاتورا'}
          </span>
          <span
            className="store-brand-sub"
            style={{
              fontSize: '0.62rem',
              fontWeight: '800',
              color: '#C49A5C',
              letterSpacing: '1.2px',
              lineHeight: '1.2',
              textTransform: 'uppercase',
              marginTop: '2px'
            }}
          >
            CATURRA COFFEE & ROASTER
          </span>
        </div>

        {/* 2. CENTER NAVIGATION LINKS (داخل كبسولة وسطية أنيقة بنظام الـ Pills) */}
        <nav
          className="store-center-nav"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'rgba(25, 10, 5, 0.65)',
            padding: '4px 6px',
            borderRadius: '9999px',
            border: '1px solid rgba(212, 163, 115, 0.22)',
            backdropFilter: 'blur(8px)',
            margin: '0 auto'
          }}
        >
          {[
            { id: 'home', label: t('navHome') },
            { id: 'about', label: t('navAbout') },
            { id: 'store', label: t('navStore') },
            { id: 'b2b', label: t('navB2B') },
            { id: 'blog', label: t('navAcademy') },
            { id: 'contact', label: t('navContact') }
          ].map(item => {
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                style={{
                  background: isActive
                    ? 'linear-gradient(135deg, rgba(212, 163, 115, 0.28) 0%, rgba(194, 123, 56, 0.22) 100%)'
                    : 'transparent',
                  border: isActive
                    ? '1.5px solid rgba(212, 163, 115, 0.55)'
                    : '1.5px solid transparent',
                  color: isActive ? '#f5ebe1' : '#c4b0a1',
                  fontSize: '0.9rem',
                  fontWeight: isActive ? '800' : '600',
                  padding: '5px 16px',
                  borderRadius: '9999px',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  whiteSpace: 'nowrap',
                  boxShadow: isActive ? '0 2px 8px rgba(0, 0, 0, 0.35)' : 'none'
                }}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.color = '#f5ebe1';
                    e.currentTarget.style.background = 'rgba(212, 163, 115, 0.12)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.color = '#c4b0a1';
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* 3. LEFT ICONS (أزرار دائرية أنيقة بنفس الأدوات والوظائف) */}
        <div className="store-navbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {/* Language Switcher Button (أيقونة التبديل بين اللغتين العربي والإنجليزي) */}
          <button
            type="button"
            className="store-navbar-action-btn store-lang-switch-btn"
            style={{
              height: '38px',
              padding: '0 11px',
              borderRadius: '9999px',
              background: 'rgba(43, 20, 12, 0.75)',
              border: '1.5px solid rgba(212, 163, 115, 0.38)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer',
              color: '#f5ebe1',
              fontSize: '0.78rem',
              fontWeight: '800',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              userSelect: 'none'
            }}
            onClick={toggleLanguage}
            title={language === 'ar' ? 'Switch to English 🇬🇧' : 'التحويل إلى اللغة العربية 🇪🇬'}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#FFF8EE';
              e.currentTarget.style.borderColor = '#96663B';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = '#FFFDF9';
              e.currentTarget.style.borderColor = '#EDD9BD';
            }}
          >
            <Globe size={16} strokeWidth={2.2} style={{ color: '#96663B' }} />
            <span style={{ letterSpacing: '0.6px', fontWeight: '900' }}>
              {language === 'ar' ? 'EN' : 'عربي'}
            </span>
          </button>

          {/* Search Button */}
          <button
            type="button"
            className="store-navbar-action-btn"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: isHeaderSearchOpen ? '#FFF8EE' : '#FFFDF9',
              border: isHeaderSearchOpen ? '1.5px solid #96663B' : '1px solid #EDD9BD',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#4A3220',
              transition: 'all 0.2s ease'
            }}
            onClick={() => {
              setIsHeaderSearchOpen(prev => !prev);
              if (!isHeaderSearchOpen) {
                setTimeout(() => document.getElementById('store-navbar-search-input')?.focus(), 100);
              }
            }}
            title={t('navSearch')}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(56, 29, 18, 0.9)'}
            onMouseLeave={e => e.currentTarget.style.background = isHeaderSearchOpen ? 'rgba(212, 163, 115, 0.25)' : 'rgba(43, 20, 12, 0.65)'}
          >
            <Search size={18} strokeWidth={2} />
          </button>



          {/* Wishlist Heart with Counter Badge */}
          <button
            type="button"
            className="store-navbar-action-btn"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'rgba(43, 20, 12, 0.65)',
              border: '1px solid rgba(212, 163, 115, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative',
              color: '#f5ebe1',
              transition: 'all 0.2s ease'
            }}
            onClick={() => { setHasEnteredStore(true); setIsWishlistModalOpen(true); }}
            title={t('navWishlist') || (language === 'en' ? 'Wishlist' : 'قائمة المفضلة')}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(56, 29, 18, 0.9)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(43, 20, 12, 0.65)'}
          >
            <Heart size={18} strokeWidth={2} />
            {wishlist.length > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-3px',
                  left: '-3px',
                  background: '#96663B',
                  color: '#ffffff',
                  fontSize: '0.62rem',
                  fontWeight: '900',
                  minWidth: '17px',
                  height: '17px',
                  padding: '0 4px',
                  borderRadius: '9999px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1.5px solid #FFFDF9',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.4)'
                }}
              >
                {wishlist.length}
              </span>
            )}
          </button>

          {/* Shopping Bag (Cart) with Counter Badge - كبسولة أنيقة تطابق الصورة المرجعية */}
          <button
            type="button"
            className="store-navbar-action-btn"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(212, 163, 115, 0.22) 0%, rgba(194, 123, 56, 0.16) 100%)',
              border: '1.5px solid rgba(212, 163, 115, 0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative',
              color: '#f5ebe1',
              transition: 'all 0.2s ease',
              boxShadow: '0 2px 8px rgba(0,0,0,0.25)'
            }}
            onClick={() => { setHasEnteredStore(true); setIsCartOpen(true); }}
            title={t('navCart')}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(212, 163, 115, 0.3)'}
            onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(135deg, rgba(212, 163, 115, 0.22) 0%, rgba(194, 123, 56, 0.16) 100%)'}
          >
            <ShoppingBag size={18} strokeWidth={2} />
            {totalCartCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-3px',
                  left: '-3px',
                  background: 'linear-gradient(135deg, #96663B 0%, #7A5230 100%)',
                  color: '#ffffff',
                  fontSize: '0.62rem',
                  fontWeight: '900',
                  minWidth: '17px',
                  height: '17px',
                  padding: '0 4px',
                  borderRadius: '9999px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1.5px solid #FFFDF9',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.4)'
                }}
              >
                {totalCartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 4. MOBILE SECONDARY NAVIGATION (بكامل تفاصيل صفحات وأقسام الكمبيوتر) */}
      <div className="store-mobile-subnav" style={{ pointerEvents: 'auto' }}>
        {[
          { id: 'home', label: t('navHome'), icon: '🏠' },
          { id: 'store', label: t('navStore'), icon: '☕' },
          { id: 'b2b', label: t('navB2B'), icon: '🤝' },
          { id: 'about', label: t('navAbout'), icon: '✨' },
          { id: 'blog', label: t('navAcademy'), icon: '📚' },
          { id: 'contact', label: t('navContact'), icon: '📞' }
        ].map(item => {
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleNavClick(item.id)}
              className={`store-mobile-nav-pill ${isActive ? 'active' : ''}`}
              title={item.label}
            >
              <span className="pill-icon">{item.icon}</span>
              <span className="pill-text">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Expandable Floating Search Pill underneath navbar */}
      {isHeaderSearchOpen && (
        <div
          style={{
            maxWidth: '680px',
            margin: '8px auto 0',
            padding: '6px 16px',
            background: 'rgba(35, 16, 9, 0.96)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1.5px solid rgba(212, 163, 115, 0.4)',
            borderRadius: '9999px',
            boxShadow: '0 12px 35px rgba(0, 0, 0, 0.65)',
            animation: 'fadeIn 0.2s ease',
            pointerEvents: 'auto',
            position: 'relative'
          }}
        >
          <input
            id="store-navbar-search-input"
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              if (!hasEnteredStore) setHasEnteredStore(true);
              if (activeNav !== 'store') setActiveNav('store');
              if (isAcademyPageOpen) setIsAcademyPageOpen(false);
            }}
            className="form-input"
            style={{
              height: '38px',
              borderRadius: '9999px',
              paddingRight: '36px',
              background: '#FFFDF9',
              border: '1.5px solid #EDD9BD',
              color: '#4A3220',
              fontSize: '0.88rem'
            }}
          />
          <Search size={17} color="#96663B" style={{ position: 'absolute', right: '28px', top: '16px' }} />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              style={{
                position: 'absolute',
                left: '28px',
                top: '16px',
                background: 'none',
                border: 'none',
                color: '#c4b0a1',
                cursor: 'pointer',
                padding: '2px',
                display: 'flex'
              }}
              title="مسح البحث"
            >
              <X size={15} />
            </button>
          )}
        </div>
      )}
    </header>
  );

  // =========================================================================
  // 🌟 FULL HOME PAGE RENDERER (STRUCTURE MATCHING BONALQAHERA.COM/EG) 🌟
  // =========================================================================
  const renderHomePage = () => {
    // Helper: only genuine coffee crops (exclude machines, tools, accessories, pieces)
    const isCoffeeCrop = (p) => {
      if (!p) return false;
      if (p.category === 'tools' || p.category === 'accessories' || p.category === 'equipment') return false;
      if (p.unitType === 'piece') return false;
      return true;
    };

    const isAvailableInStock = (p) => {
      if (!p) return false;
      const stockKg = Number(p.stock) || 0;
      const stockG = Number(p.stockGram) || 0;
      if (stockKg > 0 || stockG > 0) return true;
      return batches.some(b => b.productId === p.id && b.status === 'good' && ((Number(b.quantity) || 0) > 0 || (Number(b.quantityGram) || 0) > 0));
    };

    // Calculate dynamic live sales volume from all non-cancelled website invoices + salesCount
    const salesVolumeMap = {};
    (invoices || []).forEach(inv => {
      if (inv && inv.status !== 'cancelled') {
        const items = inv.items || inv.cart || [];
        items.forEach(it => {
          const pId = it.productId || it.id;
          if (pId) {
            salesVolumeMap[pId] = (salesVolumeMap[pId] || 0) + (Number(it.qty || it.quantity || 1));
          }
        });
      }
    });

    const curatedPopularityPriority = {
      'prod-colombia-supremo': 100,
      'prod-french-coffee': 95,
      'prod-colombia-fermented-strawberry': 90,
      'prod-colombia-fermented-cantaloupe': 85,
      'prod-brazil-santos': 80,
      'prod-ethiopia-yirgacheffe': 75,
      'prod-espresso-house-blend': 70,
      'prod-colombia-fermented-citrus': 65
    };

    const curatedNewHarvestPriority = {
      'prod-colombia-fermented-strawberry': 100,
      'prod-colombia-fermented-citrus': 95,
      'prod-colombia-fermented-cantaloupe': 90,
      'prod-colombia-supremo': 85,
      'prod-colombia-fermented-banana': 80,
      'prod-ethiopia-guji': 75,
      'prod-brazil-cerrado': 70,
      'prod-brazil-santos': 65
    };

    // 1. 🌟 NEW HARVEST CROPS (محاصيلنا الجديدة) - Dynamically calculated from newest roast/batch arrivals & inventory
    const getProductNewnessTimestamp = (p) => {
      const productBatches = batches.filter(b => b.productId === p.id && (b.status === 'good' || !b.status));
      if (productBatches.length > 0) {
        const timestamps = productBatches
          .map(b => b.entryDate || b.createdAt)
          .filter(Boolean)
          .map(d => new Date(d).getTime())
          .filter(t => !isNaN(t));
        if (timestamps.length > 0) return Math.max(...timestamps);
      }
      if (p.entryDate) {
        const t = new Date(p.entryDate).getTime();
        if (!isNaN(t)) return t;
      }
      if (p.harvestDate) {
        const t = new Date(p.harvestDate).getTime();
        if (!isNaN(t)) return t;
      }
      if (p.createdAt) {
        const t = new Date(p.createdAt).getTime();
        if (!isNaN(t)) return t;
      }
      return 0;
    };

    const coffeeCrops = (products || []).filter(isCoffeeCrop);
    const inStockCoffeeCrops = coffeeCrops.filter(isAvailableInStock);

    const sortedNewHarvests = [...(inStockCoffeeCrops.length >= 4 ? inStockCoffeeCrops : coffeeCrops)]
      .sort((a, b) => {
        const timeDiff = getProductNewnessTimestamp(b) - getProductNewnessTimestamp(a);
        if (timeDiff !== 0) return timeDiff;
        const prioA = curatedNewHarvestPriority[a.id] || 0;
        const prioB = curatedNewHarvestPriority[b.id] || 0;
        if (prioB !== prioA) return prioB - prioA;
        return (Number(b.stock) || 0) - (Number(a.stock) || 0);
      });
    const newHarvests = sortedNewHarvests.slice(0, 4);

    // 2. 🌟 BEST SELLERS (الأكثر مبيعاً) - Dynamically calculated from live store transactions & sales volume
    const sortedBestSellers = [...coffeeCrops]
      .sort((a, b) => {
        const salesA = (salesVolumeMap[a.id] || 0) + (Number(a.salesCount) || 0);
        const salesB = (salesVolumeMap[b.id] || 0) + (Number(b.salesCount) || 0);
        if (salesB !== salesA) return salesB - salesA;
        const prioA = curatedPopularityPriority[a.id] || 0;
        const prioB = curatedPopularityPriority[b.id] || 0;
        return prioB - prioA;
      });
    const bestSellers = sortedBestSellers.slice(0, 4);

    return (
      <div className="caturra-home-page-view" style={{ width: '100%', overflow: 'hidden' }}>

        {/* ======================================================== */}
        {/* 1. HERO BANNER SECTION (صورة الهيدر النقية مع الشعار الفلسفي) */}
        {/* ======================================================== */}
        <section
          className="home-hero-section"
          style={{
            position: 'relative',
            width: '100%',
            minHeight: '82vh',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            overflow: 'hidden',
            backgroundColor: '#2C1810',
            color: '#FFF8EE',
            padding: '120px 20px 80px'
          }}
        >
          {/* Ambient Video Background on Desktop / High-Performance Instant Image on Mobile */}
          {isMobileScreen ? (
            <img
              src="/caturra_b2b_hero.jpg"
              alt="محمصة ومتجر كاتورا للقهوة المختصة"
              fetchPriority="high"
              decoding="async"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: isRtl ? '20% center' : '80% center',
                zIndex: 0,
                pointerEvents: 'none'
              }}
            />
          ) : (
            <video
              autoPlay
              loop
              muted
              playsInline
              preload="metadata"
              poster="/caturra_b2b_hero.jpg"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: isRtl ? '20% center' : '80% center',
                zIndex: 0,
                pointerEvents: 'none'
              }}
            >
              <source src="/caturra_b2b_video.mp4" type="video/mp4" />
            </video>
          )}

          {/* Hero Content Box (Text and Button Only) */}
          <div
            style={{
              position: 'relative',
              zIndex: 2,
              width: '100%',
              maxWidth: '1420px',
              margin: 'auto 0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              textAlign: isRtl ? 'right' : 'left',
              gap: '24px'
            }}
          >
            {/* Headline exactly as requested */}
            <h1
              style={{
                fontSize: 'clamp(2.4rem, 5.5vw, 4.4rem)',
                fontWeight: '900',
                lineHeight: '1.3',
                color: '#ffffff',
                margin: 0,
                textShadow: '0 4px 20px rgba(0, 0, 0, 0.95), 0 2px 8px rgba(0,0,0,0.9)'
              }}
            >
              {language === 'en' ? 'Every cup has a story' : 'كل فنجان له قصة'}
              <br />
              {language === 'en' ? 'And every harvest has a character' : 'وكل محصول له شخصية'}
            </h1>

            {/* Action Button: اكتشف القهوة */}
            <div style={{ marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  setHasEnteredStore(true);
                  setActiveNav('store');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="btn"
                style={{
                  padding: '16px 36px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #96663B 0%, #7A5230 100%)',
                  border: '1.5px solid #C49A5C',
                  color: '#ffffff',
                  fontSize: '1.12rem',
                  fontWeight: '900',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '10px',
                  boxShadow: '0 8px 24px rgba(150, 102, 59, 0.35)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <span>{language === 'en' ? 'Discover Coffee' : 'اكتشف القهوة'}</span>
              </button>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* 2. SECTION: قهوة تناسب طريقتك (Coffee By Brewing Method) */}
        {/* ======================================================== */}
        <section
          id="brewing-methods-section"
          style={{
            padding: '90px 24px',
            maxWidth: '1420px',
            margin: '0 auto',
            width: '100%'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '52px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 20px',
                borderRadius: '9999px',
                background: '#FFF8EE',
                border: '1.5px solid #EDD9BD',
                color: '#96663B',
                fontSize: '0.96rem',
                fontWeight: '800',
                marginBottom: '14px'
              }}
            >
              <Compass size={17} />
              <span>{language === 'en' ? 'BREWING GUIDE' : 'طرق التحضير والتقطير'}</span>
            </span>
            <h2
              style={{
                fontSize: 'clamp(2.3rem, 4.2vw, 3.2rem)',
                fontWeight: '900',
                color: '#4A3220',
                margin: '0 0 14px'
              }}
            >
              {language === 'en' ? 'Coffee That Fits Your Method' : 'قهوة تناسب طريقتك'}
            </h2>
            <p
              style={{
                fontSize: '1.2rem',
                color: '#5C3D2E',
                margin: '0 auto',
                maxWidth: '720px',
                lineHeight: '1.65'
              }}
            >
              {language === 'en'
                ? 'Choose the method closest to your taste, and we will lead you to the perfect coffee.'
                : 'اختار الطريقة الأقرب ليك، وإحنا نوصّلك للقهوة المناسبة.'}
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: '28px'
            }}
          >
            {/* Method 1: Filter */}
            <div
              style={{
                background: '#FFFDF9',
                border: '1.5px solid #EDD9BD',
                borderRadius: '24px',
                padding: '36px 30px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 8px 24px rgba(74, 50, 32, 0.08)',
                transition: 'all 0.25s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#C49A5C'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#EDD9BD'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: '#FFF8EE', border: '1.5px solid #EDD9BD', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#96663B' }}>
                    <Coffee size={32} />
                  </div>
                  <span style={{ fontSize: '0.86rem', fontWeight: '800', background: '#FFF8EE', color: '#96663B', padding: '6px 14px', borderRadius: '10px', border: '1px solid #EDD9BD' }}>
                    V60 • Chemex • Kalita
                  </span>
                </div>
                <h3 style={{ fontSize: '1.55rem', fontWeight: '900', color: '#4A3220', margin: '0 0 12px' }}>
                  {language === 'en' ? 'Filter & Pour-over Drinks' : 'مشروبات الفلتر والتقطير'}
                </h3>
                <p style={{ fontSize: '1.05rem', color: '#5C3D2E', lineHeight: '1.75', margin: '0 0 22px' }}>
                  {language === 'en'
                    ? 'Pure, layered extraction highlighting floral aromatics, delicate stone fruits, and balanced, vibrant acidity.'
                    : 'استخلاص نقي وانسيابي يبرز الإيحاءات العطرية والزهور ولمسات الفواكه الناعمة والحمضيات المنعشة.'}
                </p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '26px' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: '700', background: '#FFF8EE', color: '#96663B', padding: '6px 14px', borderRadius: '10px', border: '1px solid #EDD9BD' }}>
                    {language === 'en' ? 'Ethiopia Yirgacheffe' : 'إثيوبيا يرجاشيفي'}
                  </span>
                  <span style={{ fontSize: '0.88rem', fontWeight: '700', background: '#FFF8EE', color: '#96663B', padding: '6px 14px', borderRadius: '10px', border: '1px solid #EDD9BD' }}>
                    {language === 'en' ? 'Colombia Huila' : 'كولومبيا هويلا (Huila)'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('specialty');
                  setSearchQuery(language === 'en' ? 'filter' : 'فلتر');
                  setHasEnteredStore(true);
                  setActiveNav('store');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '14px',
                  background: '#FFF8EE',
                  border: '1.5px solid #EDD9BD',
                  color: '#96663B',
                  fontSize: '1.05rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#96663B'; e.currentTarget.style.color = '#ffffff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#FFF8EE'; e.currentTarget.style.color = '#96663B'; }}
              >
                <span>{language === 'en' ? 'Explore Filter Coffees' : 'تصفح محاصيل الفلتر'}</span>
              </button>
            </div>

            {/* Method 2: Espresso & Milk */}
            <div
              style={{
                background: '#FFFDF9',
                border: '1.5px solid #EDD9BD',
                borderRadius: '24px',
                padding: '36px 30px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 8px 24px rgba(74, 50, 32, 0.08)',
                transition: 'all 0.25s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#C49A5C'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#EDD9BD'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: '#FFF8EE', border: '1.5px solid #EDD9BD', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#96663B' }}>
                    <Zap size={32} />
                  </div>
                  <span style={{ fontSize: '0.86rem', fontWeight: '800', background: '#FFF8EE', color: '#96663B', padding: '6px 14px', borderRadius: '10px', border: '1px solid #EDD9BD' }}>
                    Espresso • Latte • Cortado
                  </span>
                </div>
                <h3 style={{ fontSize: '1.55rem', fontWeight: '900', color: '#4A3220', margin: '0 0 12px' }}>
                  {language === 'en' ? 'Espresso & Milk-based' : 'مناسب للإسبريسو ومشروبات الحليب'}
                </h3>
                <p style={{ fontSize: '1.05rem', color: '#5C3D2E', lineHeight: '1.75', margin: '0 0 22px' }}>
                  {language === 'en'
                    ? 'A velvety, dense espresso shot pairing seamlessly with steamed milk for decadent lattes, flat whites, and cortados.'
                    : 'شوت إسبريسو غني القوام وثقيل الكريما يمتزج بروعة مع الحليب المبخر في اللاتيه، الفلات وايت، والكورتادو.'}
                </p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '26px' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: '700', background: '#FFF8EE', color: '#96663B', padding: '6px 14px', borderRadius: '10px', border: '1px solid #EDD9BD' }}>
                    {language === 'en' ? '☕ Caturra House Blend' : '☕ كاتورا هاوس بليند'}
                  </span>
                  <span style={{ fontSize: '0.88rem', fontWeight: '700', background: '#FFF8EE', color: '#96663B', padding: '6px 14px', borderRadius: '10px', border: '1px solid #EDD9BD' }}>
                    {language === 'en' ? '🇧🇷 Brazil Cerrado' : '🇧🇷 برازيل سيرادو'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('specialty');
                  setSearchQuery(language === 'en' ? 'espresso' : 'إسبريسو');
                  setHasEnteredStore(true);
                  setActiveNav('store');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '14px',
                  background: '#FFF8EE',
                  border: '1.5px solid #EDD9BD',
                  color: '#96663B',
                  fontSize: '1.05rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#96663B'; e.currentTarget.style.color = '#ffffff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#FFF8EE'; e.currentTarget.style.color = '#96663B'; }}
              >
                <span>{language === 'en' ? 'Explore Espresso Coffees' : 'تصفح محاصيل الإسبريسو'}</span>
              </button>
            </div>

            {/* Method 3: Omni Roast */}
            <div
              style={{
                background: '#FFFDF9',
                border: '1.5px solid #EDD9BD',
                borderRadius: '24px',
                padding: '36px 30px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 8px 24px rgba(74, 50, 32, 0.08)',
                transition: 'all 0.25s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#C49A5C'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#EDD9BD'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '22px' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: '#FFF8EE', border: '1.5px solid #EDD9BD', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#96663B' }}>
                    <Sparkles size={32} />
                  </div>
                  <span style={{ fontSize: '0.86rem', fontWeight: '800', background: '#FFF8EE', color: '#96663B', padding: '6px 14px', borderRadius: '10px', border: '1px solid #EDD9BD' }}>
                    Filter & Espresso • Omni
                  </span>
                </div>
                <h3 style={{ fontSize: '1.55rem', fontWeight: '900', color: '#4A3220', margin: '0 0 12px' }}>
                  {language === 'en' ? 'Filter & Espresso (Omni-Roast)' : 'مناسب للفلتر والإسبريسو معاً'}
                </h3>
                <p style={{ fontSize: '1.05rem', color: '#5C3D2E', lineHeight: '1.75', margin: '0 0 22px' }}>
                  {language === 'en'
                    ? 'Masterfully balanced roast profile that excels equally whether brewed as a pour-over or extracted on an espresso machine.'
                    : 'تحميص متوازن ومدروس يمنحك أفضل النتائج سواء فضلته فنجان تقطير نقي أو شوت إسبريسو مزدوج.'}
                </p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '26px' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: '700', background: '#FFF8EE', color: '#96663B', padding: '6px 14px', borderRadius: '10px', border: '1px solid #EDD9BD' }}>
                    {language === 'en' ? 'Colombia Huila' : 'كولومبيا هويلا (Huila)'}
                  </span>
                  <span style={{ fontSize: '0.88rem', fontWeight: '700', background: '#FFF8EE', color: '#96663B', padding: '6px 14px', borderRadius: '10px', border: '1px solid #EDD9BD' }}>
                    {language === 'en' ? '🎁 Caturra Tasting Box' : '🎁 بوكس تذوق كاتورا'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('specialty');
                  setSearchQuery('');
                  setHasEnteredStore(true);
                  setActiveNav('store');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                style={{
                  width: '100%',
                  padding: '14px',
                  borderRadius: '14px',
                  background: '#FFF8EE',
                  border: '1.5px solid #EDD9BD',
                  color: '#96663B',
                  fontSize: '1.05rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#96663B'; e.currentTarget.style.color = '#ffffff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#FFF8EE'; e.currentTarget.style.color = '#96663B'; }}
              >
                <span>{language === 'en' ? 'Explore Omni Coffees' : 'تصفح المحاصيل المتوازنة'}</span>
              </button>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* 3. SECTION: محاصيلنا الجديدة (New Harvests)               */}
        {/* ======================================================== */}
        <section
          style={{
            padding: '80px 24px',
            maxWidth: '1420px',
            margin: '0 auto',
            width: '100%'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '38px', flexWrap: 'wrap', gap: '18px' }}>
            <div>
              <span style={{ fontSize: '0.98rem', fontWeight: '800', color: '#7A4B24', display: 'inline-block', marginBottom: '8px' }}>
                ✦ {language === 'en' ? 'FRESH LOTS' : 'محاصيل حديثة التحميص'}
              </span>
              <h2 style={{ fontSize: 'clamp(2.2rem, 4vw, 3.1rem)', fontWeight: '900', color: '#4A3220', margin: '0 0 10px' }}>
                {language === 'en' ? 'New Harvests' : 'محاصيلنا الجديدة'}
              </h2>
              <p style={{ fontSize: '1.18rem', color: '#5C3D2E', margin: 0, lineHeight: '1.6' }}>
                {language === 'en' ? 'Direct trade fresh green coffee arriving straight from the Golden Coffee Belt, freshly roasted in Cairo.' : 'أحدث حبوب البن الأخضر الواصلة لمحمستنا مباشرة من مزارع الحزام الذهبي ونحمصها محلياً بحرفية.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setHasEnteredStore(true);
                setActiveNav('store');
                setSelectedCategory('specialty');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              style={{
                padding: '12px 26px',
                borderRadius: '14px',
                background: '#FFF8EE',
                border: '1.5px solid #EDD9BD',
                color: '#96663B',
                fontSize: '1.05rem',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#96663B'; e.currentTarget.style.color = '#ffffff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#FFF8EE'; e.currentTarget.style.color = '#96663B'; }}
            >
              <span>{language === 'en' ? 'View Collection' : 'عرض المجموعة'}</span>
            </button>
          </div>

          <div className="caturra-home-products-grid">
            {newHarvests.map(prod => {
              const localizedName = getLocalizedName(prod, language);
              const localizedOrigin = getLocalizedOrigin(prod.country || prod.coffeeOrigin?.country || prod.origin, language);
              const localizedNotes = getLocalizedNotes(prod.sensoryProfile?.flavorNotes || prod.flavorNotes || prod.notes || prod, language);
              const priceVal = Number(prod.sellingPrice ?? prod.price ?? prod.sellPrice ?? 0);
              const oldPriceVal = prod.compareAtPrice && Number(prod.compareAtPrice) > priceVal ? Number(prod.compareAtPrice) : 0;
              const hasRealDiscount = oldPriceVal > priceVal;
              const discountPercent = hasRealDiscount ? Math.round(((oldPriceVal - priceVal) / oldPriceVal) * 100) : 0;
              return (
                <div
                  key={prod.id}
                  className="caturra-home-product-card"
                  onClick={() => handleOpenProductDetails(prod)}
                >
                  {/* Image Container */}
                  <div className="store-product-img-wrap" style={{ background: '#FAF6EE' }}>
                    <img
                      src={resolveProductImage(prod)}
                      alt={localizedName}
                      className="store-product-img"
                      style={{
                        objectFit: 'contain',
                        padding: (prod.unitType === 'piece' || prod.category === 'tools' || prod.category === 'accessories') ? '8px' : '4px'
                      }}
                    />
                    {/* Badges */}
                    <div className="store-badges-container">
                      <span className="store-badge store-badge-new">
                        {language === 'en' ? 'New Crop' : 'محصول جديد'}
                      </span>
                      {hasRealDiscount && (
                        <span className="store-badge store-badge-discount">
                          {language === 'en' ? `${discountPercent}% OFF` : `خصم ${discountPercent}%`}
                        </span>
                      )}
                    </div>
                    {/* Wishlist toggle */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(prod.id);
                      }}
                      className="store-wishlist-btn"
                      title={isWishlisted(prod.id) ? (language === 'en' ? 'Remove from wishlist' : 'إزالة من المفضلة') : (language === 'en' ? 'Add to wishlist' : 'أضف للمفضلة')}
                    >
                      <Heart size={16} fill={isWishlisted(prod.id) ? '#C0392B' : 'none'} />
                    </button>
                  </div>

                  {/* Details */}
                  <div className="store-product-body">
                    <div>
                      {localizedOrigin && (
                        <div className="store-product-origin">
                          📍 {localizedOrigin}
                        </div>
                      )}
                      <h3 className="store-product-title">
                        {localizedName}
                      </h3>
                      {localizedNotes && (
                        <div className="store-product-notes">
                          <span style={{ fontWeight: '800', color: '#7A5230' }}>{language === 'en' ? 'Notes: ' : 'الإيحاءات: '}</span>
                          {localizedNotes}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="store-product-price-row">
                        <div>
                          <span className="store-product-price-val">
                            {priceVal > 0 ? priceVal : (language === 'en' ? 'Custom' : 'حسب الاختيار')}
                          </span>
                          <span className="store-product-price-unit">
                            {language === 'en' ? 'EGP / 250g' : 'ج.م / 250g'}
                          </span>
                        </div>
                        {oldPriceVal > priceVal && (
                          <span className="store-product-old-price">
                            {oldPriceVal} {language === 'en' ? 'EGP' : 'ج.م'}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenProductDetails(prod);
                        }}
                        className="store-product-btn"
                      >
                        <ShoppingCart size={16} />
                        <span>{language === 'en' ? 'Add to Cart' : 'أضف للسلة'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ======================================================== */}
        {/* 4. SECTION: الأكثر مبيعاً (Best Sellers)                   */}
        {/* ======================================================== */}
        <section
          style={{
            padding: '80px 24px',
            maxWidth: '1420px',
            margin: '0 auto',
            width: '100%'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '38px', flexWrap: 'wrap', gap: '18px' }}>
            <div>
              <span style={{ fontSize: '0.98rem', fontWeight: '800', color: '#7A4B24', display: 'inline-block', marginBottom: '8px' }}>
                🔥 {language === 'en' ? 'BEST SELLERS' : 'المفضلة لدى العملاء'}
              </span>
              <h2 style={{ fontSize: 'clamp(2.2rem, 4vw, 3.1rem)', fontWeight: '900', color: '#4A3220', margin: '0 0 10px' }}>
                {language === 'en' ? 'Best Sellers' : 'الأكثر مبيعاً'}
              </h2>
              <p style={{ fontSize: '1.18rem', color: '#5C3D2E', margin: 0, lineHeight: '1.6' }}>
                {language === 'en' ? 'Highest rated and most requested coffees by our Cairo community.' : 'المحاصيل الأعلى تقييماً وطلباً من مجتمع عشاق القهوة في كاتورا.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setHasEnteredStore(true);
                setActiveNav('store');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              style={{
                padding: '12px 26px',
                borderRadius: '14px',
                background: '#FFF8EE',
                border: '1.5px solid #EDD9BD',
                color: '#96663B',
                fontSize: '1.05rem',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#96663B'; e.currentTarget.style.color = '#ffffff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#FFF8EE'; e.currentTarget.style.color = '#96663B'; }}
            >
              <span>{language === 'en' ? 'View All' : 'عرض كل المحاصيل'}</span>
            </button>
          </div>

          <div className="caturra-home-products-grid">
            {bestSellers.map(prod => {
              const localizedName = getLocalizedName(prod, language);
              const localizedOrigin = getLocalizedOrigin(prod.country || prod.coffeeOrigin?.country || prod.origin, language);
              const localizedNotes = getLocalizedNotes(prod.sensoryProfile?.flavorNotes || prod.flavorNotes || prod.notes || prod, language);
              const priceVal = Number(prod.sellingPrice ?? prod.price ?? prod.sellPrice ?? 0);
              const oldPriceVal = prod.compareAtPrice && Number(prod.compareAtPrice) > priceVal ? Number(prod.compareAtPrice) : 0;
              return (
                <div
                  key={prod.id}
                  className="caturra-home-product-card"
                  onClick={() => handleOpenProductDetails(prod)}
                >
                  {/* Image */}
                  <div className="store-product-img-wrap" style={{ background: '#FAF6EE' }}>
                    <img
                      src={resolveProductImage(prod)}
                      alt={localizedName}
                      className="store-product-img"
                      style={{
                        objectFit: 'contain',
                        padding: (prod.unitType === 'piece' || prod.category === 'tools' || prod.category === 'accessories') ? '8px' : '4px'
                      }}
                    />
                    <div className="store-badges-container">
                      <span className="store-badge store-badge-new">
                        {language === 'en' ? 'Bestseller 🔥' : 'الأكثر مبيعاً 🔥'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist(prod.id);
                      }}
                      className="store-wishlist-btn"
                      title={isWishlisted(prod.id) ? (language === 'en' ? 'Remove from wishlist' : 'إزالة من المفضلة') : (language === 'en' ? 'Add to wishlist' : 'أضف للمفضلة')}
                    >
                      <Heart size={16} fill={isWishlisted(prod.id) ? '#C0392B' : 'none'} />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="store-product-body">
                    <div>
                      {(() => {
                        const hash = String(prod.id || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
                        const rScore = prod.rating || (4.8 + (hash % 3) * 0.1).toFixed(1);
                        const rCount = prod.reviewCount || (38 + (hash % 94));
                        return (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#8C5B28', fontSize: '0.85rem', fontWeight: '800', marginBottom: '4px' }}>
                            <span style={{ fontSize: '0.95rem', color: '#C49A5C' }}>★★★★★</span>
                            <span style={{ color: '#5C3D2E' }}>{language === 'en' ? `${rScore} (${rCount}+ reviews)` : `${rScore} (${rCount}+ تقييم)`}</span>
                          </div>
                        );
                      })()}
                      <h3 className="store-product-title">
                        {localizedName}
                      </h3>
                      {localizedNotes && (
                        <div className="store-product-notes">
                          {localizedNotes}
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="store-product-price-row">
                        <div>
                          <span className="store-product-price-val">
                            {priceVal > 0 ? priceVal : (language === 'en' ? 'Custom' : 'حسب الاختيار')}
                          </span>
                          <span className="store-product-price-unit">
                            {language === 'en' ? 'EGP' : 'ج.م'}
                          </span>
                          {oldPriceVal > priceVal && (
                            <span className="store-product-old-price">
                              {oldPriceVal} {language === 'en' ? 'EGP' : 'ج.م'}
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.74rem', color: '#5B8C5A', fontWeight: '800' }}>
                          {language === 'en' ? 'Fresh ✓' : 'طحن طازج ✓'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenProductDetails(prod);
                        }}
                        className="store-product-btn"
                      >
                        <ShoppingCart size={16} />
                        <span>{language === 'en' ? 'Add to Cart' : 'أضف للسلة'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ======================================================== */}
        {/* 5. SECTION: القهوة والناس (Community, Barista & Story)    */}
        {/* ======================================================== */}
        <section
          style={{
            padding: '90px 24px',
            maxWidth: '1420px',
            margin: '0 auto',
            width: '100%'
          }}
        >
          {/* Big Quote Banner */}
          <div
            style={{
              background: '#2C1810',
              border: '1.5px solid rgba(196, 154, 92, 0.35)',
              borderRadius: '26px',
              padding: '50px 36px',
              textAlign: 'center',
              boxShadow: '0 16px 40px rgba(74, 50, 32, 0.15)',
              marginBottom: '42px'
            }}
          >
            <span style={{ fontSize: '0.96rem', fontWeight: '800', color: '#C49A5C', letterSpacing: '1px' }}>
              ✦ {language === 'en' ? 'THE COFFEE & THE PEOPLE' : 'القهوة والناس'} ✦
            </span>
            <h2
              style={{
                fontSize: 'clamp(2rem, 3.6vw, 2.9rem)',
                fontWeight: '900',
                color: '#FFF8EE',
                margin: '16px 0',
                lineHeight: '1.4'
              }}
            >
              {language === 'en'
                ? '"Coffee isn\'t just a drink... it\'s an experience and a craft."'
                : '"القهوة مش مجرد مشروب.. القهوة تجربة وتفاصيل"'}
            </h2>
            <p
              style={{
                fontSize: '1.2rem',
                color: '#EDD9BD',
                margin: '0 auto',
                maxWidth: '820px',
                lineHeight: '1.8'
              }}
            >
              {language === 'en'
                ? 'We select the finest coffee origins and roast them with precision, delivering a unique tasting journey in every sip.'
                : 'ننتقي أفضل المحاصيل ونحمّصها بإتقان لتعيش تجربة تذوق فريدة في كل رشفة، مع الاهتمام بكل مرحلة من لحظة القطف وحتى فنجانك.'}
            </p>
          </div>

          {/* 3 Community & Barista Cards */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
              gap: '28px'
            }}
          >
            {/* Card 1: Roaster Craft */}
            <div
              style={{
                background: '#FFFDF9',
                border: '1.5px solid #EDD9BD',
                borderRadius: '24px',
                padding: '32px 28px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 8px 24px rgba(74, 50, 32, 0.08)'
              }}
            >
              <div>
                <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#FFF8EE', border: '1.5px solid #EDD9BD', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#96663B', marginBottom: '18px' }}>
                  <Flame size={28} />
                </div>
                <h3 style={{ fontSize: '1.45rem', fontWeight: '900', color: '#4A3220', margin: '0 0 12px' }}>
                  {language === 'en' ? 'Artisan Roasting Craft' : 'فلسفة التحميص الحرفي'}
                </h3>
                <p style={{ fontSize: '1.04rem', color: '#5C3D2E', lineHeight: '1.75', margin: 0 }}>
                  {language === 'en'
                    ? 'Roasting for us is not just time and heat, but a calculated science to release rich aromatics and natural sweetness without scorching.'
                    : 'التحميص عندنا مش مجرد حرارة ووقت، ده علم ودقة محسوبة بالثانية لتفجير الإيحاءات العطرية والسكريات الطبيعية دون حرق الحبة.'}
                </p>
              </div>
              <div style={{ marginTop: '24px', fontSize: '0.92rem', color: '#96663B', fontWeight: '800' }}>
                {language === 'en' ? '#CaturraRoastery • Freshly Roasted Weekly' : '#CaturraRoastery • تحميص طازج أسبوعياً'}
              </div>
            </div>

            {/* Card 2: Real Customer Testimonials */}
            <div
              style={{
                background: '#FFFDF9',
                border: '1.5px solid #EDD9BD',
                borderRadius: '24px',
                padding: '32px 28px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 8px 24px rgba(74, 50, 32, 0.08)'
              }}
            >
              <div>
                <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#FFF8EE', border: '1.5px solid #EDD9BD', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#96663B', marginBottom: '18px' }}>
                  <MessageSquare size={28} />
                </div>
                <h3 style={{ fontSize: '1.45rem', fontWeight: '900', color: '#4A3220', margin: '0 0 12px' }}>
                  {language === 'en' ? 'Customer Stories & Reviews' : 'آراء وتجارب العملاء'}
                </h3>
                <p style={{ fontSize: '1.02rem', color: '#5C3D2E', lineHeight: '1.7', fontStyle: 'italic', margin: '0 0 10px' }}>
                  {language === 'en'
                    ? '"The Ethiopia Yirgacheffe took my V60 brewing to a whole new level! Incredibly clean notes and shipped in under 24 hours."'
                    : '"إثيوبيا يرجاشيفي نقلت تجربة الـ V60 عندي لمستوى تاني خالص! النكهات نقية جداً والشحن وصل في أقل من 24 ساعة."'}
                </p>
              </div>
              <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #EDD9BD', paddingTop: '12px' }}>
                <span style={{ fontSize: '0.92rem', fontWeight: '800', color: '#8A654C' }}>
                  {language === 'en' ? '— Eng. Ahmed El-Shennawy (Cairo)' : '— م. أحمد الشناوي (القاهرة)'}
                </span>
                <span style={{ color: '#C49A5C', fontSize: '0.92rem' }}>★★★★★</span>
              </div>
            </div>

            {/* Card 3: Academy & Calculator */}
            <div
              style={{
                background: '#FFFDF9',
                border: '1.5px solid #EDD9BD',
                borderRadius: '24px',
                padding: '32px 28px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 8px 24px rgba(74, 50, 32, 0.08)'
              }}
            >
              <div>
                <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#FFF8EE', border: '1.5px solid #EDD9BD', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#96663B', marginBottom: '18px' }}>
                  <BookOpen size={28} />
                </div>
                <h3 style={{ fontSize: '1.45rem', fontWeight: '900', color: '#4A3220', margin: '0 0 12px' }}>
                  {language === 'en' ? 'Caturra Coffee Blog' : 'مدونة كاتورا للقهوة'}
                </h3>
                <p style={{ fontSize: '1.04rem', color: '#5C3D2E', lineHeight: '1.75', margin: 0 }}>
                  {language === 'en'
                    ? 'Your definitive guide to mastering brew ratios, grind sizes, and water temperatures for every tool.'
                    : 'دليلك الشامل لتعلم نسب الاستخلاص المثالية، درجات الطحن، ودرجات حرارة الماء لكل أداة تحضير.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setHasEnteredStore(true);
                  setIsAcademyPageOpen(true);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                style={{
                  marginTop: '24px',
                  width: '100%',
                  padding: '13px',
                  borderRadius: '12px',
                  background: '#FFF8EE',
                  border: '1.5px solid #EDD9BD',
                  color: '#96663B',
                  fontSize: '1.02rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#96663B'; e.currentTarget.style.color = '#ffffff'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#FFF8EE'; e.currentTarget.style.color = '#96663B'; }}
              >
                <BookOpen size={17} />
                <span>{language === 'en' ? 'Explore Blog Articles' : 'تصفح مقالات المدونة'}</span>
              </button>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* 6. SECTION: عن محمصة كاتورا (About Roastery Story)        */}
        {/* ======================================================== */}
        <section
          style={{
            padding: '50px 24px 90px',
            maxWidth: '1420px',
            margin: '0 auto',
            width: '100%'
          }}
        >
          <div
            style={{
              background: '#2C1810',
              border: '1.5px solid rgba(196, 154, 92, 0.35)',
              borderRadius: '26px',
              padding: '48px 36px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              boxShadow: '0 16px 40px rgba(74, 50, 32, 0.15)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <img
                src="/caturra_logo.jpg"
                alt="Caturra"
                style={{ width: '56px', height: '56px', borderRadius: '50%', border: '2px solid rgba(196, 154, 92, 0.4)' }}
              />
              <div>
                <h3 style={{ fontSize: '1.65rem', fontWeight: '900', color: '#FFF8EE', margin: 0 }}>
                  {language === 'en' ? 'About Caturra Specialty Coffee' : 'عن محمصة كاتورا للقهوة المختصة'}
                </h3>
                <span style={{ fontSize: '0.88rem', color: '#C49A5C', fontWeight: '700' }}>
                  CATURRA COFFEE ROASTERY • CAIRO, EGYPT
                </span>
              </div>
            </div>
            <p style={{ fontSize: '1.15rem', color: '#FFF8EE', lineHeight: '1.9', margin: 0, whiteSpace: 'pre-line' }}>
              {contactInfo?.aboutUs || (language === 'en'
                ? 'Caturra was founded in Cairo out of a genuine passion for 100% pure specialty coffee. Inspired by the legendary Caturra varietal known for its exceptional balance and rich cup profile, we handpick green beans from Ethiopia, Colombia, and Brazil, roasting locally with zero artificial additives to ensure an honest, exceptional cup in every sip.'
                : 'تأسست كاتورا (Caturra) في قلب القاهرة كشغف حقيقي بالقهوة المختصة النقية 100%. استلهمنا اسمنا من سلالة "كاتورا" العريقة، أحد أشهر سلالات البن التي تميزت بالتوازن الاستثنائي والنكهات الغنية. ننتقي حبوب البن الخضراء بعناية من مزارع إثيوبيا، كولومبيا، والبرازيل، ونحمصها محلياً في القاهرة بدون أي إضافات أو نكهات صناعية لنضمن لك فنجاناً صادقاً وفاخراً في كل رشفة.')}
            </p>
            <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginTop: '8px' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: '700', background: 'rgba(196, 154, 92, 0.15)', color: '#C49A5C', padding: '7px 16px', borderRadius: '10px', border: '1px solid rgba(196, 154, 92, 0.3)' }}>
                {language === 'en' ? '☕ 100% Specialty Coffee' : '☕ بن مختص 100%'}
              </span>
              <span style={{ fontSize: '0.95rem', fontWeight: '700', background: 'rgba(91, 140, 90, 0.15)', color: '#5B8C5A', padding: '7px 16px', borderRadius: '10px', border: '1px solid rgba(91, 140, 90, 0.3)' }}>
                {language === 'en' ? '🇪🇬 100% Egyptian Roastery' : '🇪🇬 علامة ومحمصة مصرية 100%'}
              </span>
              <span style={{ fontSize: '0.95rem', fontWeight: '700', background: 'rgba(196, 154, 92, 0.15)', color: '#C49A5C', padding: '7px 16px', borderRadius: '10px', border: '1px solid rgba(196, 154, 92, 0.3)' }}>
                {language === 'en' ? '🚚 Express Nationwide Delivery' : '🚚 شحن سريع لكافة المحافظات'}
              </span>
            </div>
          </div>
        </section>

      </div>
    );
  };

  const renderCatalogProductCard = (prod) => {
    const isOutOfStock = prod.stock <= 0;
    const isWeight = prod.unitType === 'weight' || prod.category === 'specialty' || prod.category === 'classic_blends' || prod.category === 'espresso' || prod.category === 'filter' || prod.category === 'coffee';
    const localizedName = getLocalizedName(prod, language);
    const localizedOrigin = getLocalizedOrigin(prod.country || prod.coffeeOrigin?.country || prod.origin, language);
    const localizedNotes = getLocalizedNotes(prod.sensoryProfile?.flavorNotes || prod.flavorNotes || prod.notes || prod, language);

    return (
      <div
        key={prod.id}
        className="card store-product-card"
        onClick={() => handleOpenProductDetails(prod)}
        style={{ cursor: 'pointer', background: '#FFFDF9', border: '1.5px solid #EDD9BD' }}
        title={language === 'en' ? 'Click to preview specs and details' : 'اضغط لمعاينة كافة مواصفات وبيانات المنتج'}
      >
        {/* Image - Scaled proportionally */}
        <div className="store-product-img-wrap" style={{ background: '#FAF6EE' }}>
          <img
            src={resolveProductImage(prod)}
            alt={localizedName}
            className="store-product-img"
            style={{
              objectFit: 'contain',
              padding: (prod.unitType === 'piece' || prod.category === 'tools' || prod.category === 'accessories') ? '8px' : '4px'
            }}
          />

          {/* Weight / Piece badge */}
          <span
            className="store-badge"
            style={{
              position: 'absolute',
              top: '8px',
              [isRtl ? 'right' : 'left']: '8px',
              background: isWeight ? 'rgba(150, 102, 59, 0.92)' : 'rgba(74, 50, 32, 0.88)',
              backdropFilter: 'blur(6px)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              zIndex: 2
            }}
          >
            {isWeight ? <Scale size={11} /> : <Coffee size={11} />}
            <span>{isWeight ? t('customGramWeight') : t('perPiece')}</span>
          </span>

          {/* Wishlist Button */}
          <button
            type="button"
            className="store-wishlist-btn"
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(prod.id);
            }}
            title={isWishlisted(prod.id) ? t('removeFromWishlist') : t('addToWishlist')}
          >
            <Heart size={15} fill={isWishlisted(prod.id) ? '#C0392B' : 'none'} strokeWidth={2} />
          </button>

          {isOutOfStock && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(44, 24, 16, 0.85)',
                backdropFilter: 'blur(3px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFF8EE',
                fontWeight: '800',
                fontSize: '0.95rem',
                zIndex: 4
              }}
            >
              {t('outOfStock')}
            </div>
          )}
        </div>

        {/* Info & Price Body */}
        <div className="store-product-body">
          <div>
            {localizedOrigin && (
              <div className="store-product-origin">
                📍 {localizedOrigin}
              </div>
            )}
            <h3 className="store-product-title">
              {localizedName}
            </h3>
            {localizedNotes && (
              <div className="store-product-notes">
                {t('notes')} {localizedNotes}
              </div>
            )}
          </div>

          <div>
            <div className="store-product-price-row">
              <div style={{ flex: 1 }}>
                {isWeight ? (
                  <>
                    <div className="store-product-price-val">
                      {formatPrice(prod.pricePerKg || (prod.sellingPrice * 4), language)} <span className="store-product-price-unit">/ {t('perKg')}</span>
                    </div>
                    <span style={{ fontSize: '0.68rem', color: '#8A654C', display: 'block', marginTop: '2px' }}>
                      {t('startsFrom')} {formatPrice(prod.sellingPrice, language)}
                    </span>
                  </>
                ) : (
                  <div className="store-product-price-val">
                    {formatPrice(prod.sellingPrice, language)}
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleOpenProductDetails(prod);
              }}
              disabled={isOutOfStock}
              className="store-product-btn"
              style={{ opacity: isOutOfStock ? 0.5 : 1 }}
            >
              <ShoppingCart size={15} />
              <span>{language === 'ar' ? 'أضف للسلة' : 'Add to Cart'}</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="storefront-page">

      {/* ☕ LUXURY FLOATING CAPSULE NAVBAR (ESPRESSO & LATTE - مطابقة للاستايل المرجعي) ☕ */}
      {renderStoreNavbar()}

      {/* 🌟 DEDICATED LUXURY CONTACT US VIEW (تواصل معنا - مطابق للصورة تماماً) 🌟 */}
      {!isAcademyPageOpen && activeNav === 'contact' && (
        <section className="store-contact-page" id="store-contact-section">
          <div className="store-contact-container">

            {/* 1. TOP ROW OF 4 CONTACT CARDS */}
            <div className="store-contact-top-cards">

              {/* Card 1: WhatsApp (واتساب) */}
              <a
                href={`https://wa.me/${cleanStoreWhatsApp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="store-contact-card-item"
                title={t('directWhatsappChat')}
              >
                <div>
                  <div style={{ fontSize: '0.82rem', color: '#8A654C', fontWeight: '600', marginBottom: '4px' }}>
                    {t('contactCardWhatsapp')}
                  </div>
                  <div style={{ fontSize: '0.94rem', fontWeight: '800', color: '#4A3220', direction: 'ltr', textAlign: isRtl ? 'right' : 'left' }}>
                    {cleanStoreWhatsApp}
                  </div>
                  {activePhone && activePhone !== cleanStoreWhatsApp && (
                    <div style={{ fontSize: '0.86rem', fontWeight: '700', color: '#6B4A2E', direction: 'ltr', textAlign: isRtl ? 'right' : 'left', marginTop: '2px' }}>
                      {activePhone}
                    </div>
                  )}
                </div>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    background: '#FFF8EE',
                    color: '#96663B',
                    border: '1px solid #EDD9BD',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <MessageCircle size={24} />
                </div>
              </a>

              {/* Card 2: Phone (اتصل بنا) */}
              <a
                href={`tel:${activePhone}`}
                className="store-contact-card-item"
                title={t('directPhoneCall')}
              >
                <div>
                  <div style={{ fontSize: '0.82rem', color: '#8A654C', fontWeight: '600', marginBottom: '4px' }}>
                    {t('contactCardCall')}
                  </div>
                  <div style={{ fontSize: '0.94rem', fontWeight: '800', color: '#4A3220', direction: 'ltr', textAlign: isRtl ? 'right' : 'left' }}>
                    {activePhone}
                  </div>
                  {cleanStoreWhatsApp && cleanStoreWhatsApp !== activePhone && (
                    <div style={{ fontSize: '0.86rem', fontWeight: '700', color: '#6B4A2E', direction: 'ltr', textAlign: isRtl ? 'right' : 'left', marginTop: '2px' }}>
                      {cleanStoreWhatsApp}
                    </div>
                  )}
                </div>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    background: '#FFF8EE',
                    color: '#96663B',
                    border: '1px solid #EDD9BD',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Phone size={22} />
                </div>
              </a>

              {/* Card 3: Email (البريد الإلكتروني الرسمي) */}
              <a
                href={`mailto:${activeEmail}`}
                className="store-contact-card-item"
                title={t('emailUsDirectly')}
              >
                <div>
                  <div style={{ fontSize: '0.82rem', color: '#8A654C', fontWeight: '600', marginBottom: '4px' }}>
                    {t('contactCardEmail')}
                  </div>
                  <div style={{ fontSize: '0.86rem', fontWeight: '800', color: '#4A3220', direction: 'ltr', textAlign: isRtl ? 'right' : 'left' }}>
                    {activeEmail}
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: '700', color: '#6B4A2E', direction: 'ltr', textAlign: isRtl ? 'right' : 'left', marginTop: '2px' }}>
                    info@caturracoffee.com
                  </div>
                </div>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    background: '#FFF8EE',
                    color: '#96663B',
                    border: '1px solid #EDD9BD',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Mail size={22} />
                </div>
              </a>

              {/* Card 4: Address (العنوان) */}
              <div
                className="store-contact-card-item"
                onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(activeAddress)}`, '_blank')}
                style={{ cursor: 'pointer' }}
                title={t('viewOnMap')}
              >
                <div>
                  <div style={{ fontSize: '0.82rem', color: '#8A654C', fontWeight: '600', marginBottom: '4px' }}>
                    {t('contactCardAddress')}
                  </div>
                  <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#4A3220', lineHeight: '1.4' }}>
                    {activeAddress}
                  </div>
                </div>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '14px',
                    background: '#FFF8EE',
                    color: '#96663B',
                    border: '1px solid #EDD9BD',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <MapPin size={22} />
                </div>
              </div>
            </div>

            {/* 2. THE MAIN TWO-COLUMN CONTACT CARD */}
            <div className="contact-main-card">

              {/* RIGHT COLUMN: Dark Forest Green Panel (الجانب الأخضر الداكن) */}
              <div className="contact-green-panel">
                {/* Organic decorative translucent curves */}
                <div
                  style={{
                    position: 'absolute',
                    top: '-15%',
                    right: '-20%',
                    width: '280px',
                    height: '280px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.04)',
                    transform: 'scaleX(1.4) rotate(-25deg)',
                    pointerEvents: 'none'
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-25%',
                    left: '-20%',
                    width: '320px',
                    height: '320px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.04)',
                    transform: 'scaleX(1.3) rotate(35deg)',
                    pointerEvents: 'none'
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: '35%',
                    left: '10%',
                    width: '200px',
                    height: '200px',
                    borderRadius: '50%',
                    background: 'rgba(255, 255, 255, 0.03)',
                    transform: 'scaleX(1.2)',
                    pointerEvents: 'none'
                  }}
                />

                <div style={{ position: 'relative', zIndex: 2 }}>
                  <span
                    style={{
                      display: 'inline-block',
                      fontSize: '0.85rem',
                      fontWeight: '700',
                      color: '#e08354',
                      marginBottom: '8px'
                    }}
                  >
                    {t('contactFormTag')}
                  </span>
                  <h2
                    style={{
                      fontSize: '2.4rem',
                      fontWeight: '900',
                      margin: '0 0 6px',
                      color: '#ffffff',
                      lineHeight: '1.2'
                    }}
                  >
                    {t('contactFormTitle')}
                  </h2>
                  <div
                    style={{
                      fontSize: '0.88rem',
                      fontWeight: '700',
                      color: 'rgba(255, 255, 255, 0.75)',
                      letterSpacing: '1px',
                      marginBottom: '32px'
                    }}
                  >
                    {contactInfo?.brandNameEn || 'CATURRA COFFEE & ROASTER'}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <a
                      href={`tel:${activePhone}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        color: '#ffffff',
                        textDecoration: 'none',
                        fontSize: '0.98rem',
                        fontWeight: '600'
                      }}
                    >
                      <Phone size={18} color="#e6b87d" />
                      <span style={{ direction: 'ltr' }}>{activePhone}</span>
                    </a>

                    <a
                      href={`https://wa.me/${cleanStoreWhatsApp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        color: '#ffffff',
                        textDecoration: 'none',
                        fontSize: '0.98rem',
                        fontWeight: '600'
                      }}
                    >
                      <MessageCircle size={18} color="#e6b87d" />
                      <span style={{ direction: 'ltr' }}>{cleanStoreWhatsApp}</span>
                    </a>

                    <a
                      href={`mailto:${activeEmail}`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        color: '#ffffff',
                        textDecoration: 'none',
                        fontSize: '0.95rem',
                        fontWeight: '600'
                      }}
                    >
                      <Mail size={18} color="#e6b87d" />
                      <span>{activeEmail}</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* LEFT COLUMN: Contact Form (استمارة التواصل) */}
              <div className="contact-form-panel">
                <span
                  style={{
                    display: 'inline-block',
                    fontSize: '0.85rem',
                    fontWeight: '700',
                    color: '#96663B',
                    marginBottom: '6px'
                  }}
                >
                  {t('contactFormTag')}
                </span>
                <h2
                  style={{
                    fontSize: '2rem',
                    fontWeight: '900',
                    color: '#4A3220',
                    margin: '0 0 28px'
                  }}
                >
                  {t('contactFormTitle')}
                </h2>

                {contactFormSent && (
                  <div
                    style={{
                      background: '#FFF8EE',
                      border: '1.5px solid #EDD9BD',
                      color: '#4A3220',
                      borderRadius: '12px',
                      padding: '14px 18px',
                      marginBottom: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontSize: '0.92rem',
                      fontWeight: '700'
                    }}
                  >
                    <CheckCircle size={20} color="#5B8C5A" />
                    <span>{t('contactFormSentSuccess')}</span>
                  </div>
                )}

                <form onSubmit={handleContactFormSubmit}>
                  {/* Row 1: Name + Email */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '16px',
                      marginBottom: '16px'
                    }}
                  >
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '0.78rem',
                          fontWeight: '700',
                          color: '#64748b',
                          marginBottom: '6px',
                          textAlign: isRtl ? 'right' : 'left'
                        }}
                      >
                        {t('contactFormName')}
                      </label>
                      <input
                        type="text"
                        name="name"
                        required
                        placeholder={t('contactFormName')}
                        value={contactForm.name}
                        onChange={handleContactFormChange}
                        className="contact-input-sand"
                        style={{ height: '46px', textAlign: isRtl ? 'right' : 'left' }}
                      />
                    </div>

                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '0.78rem',
                          fontWeight: '700',
                          color: '#64748b',
                          marginBottom: '6px',
                          textAlign: isRtl ? 'right' : 'left'
                        }}
                      >
                        {t('contactFormEmail')}
                      </label>
                      <input
                        type="email"
                        name="email"
                        placeholder={t('contactFormEmail')}
                        value={contactForm.email}
                        onChange={handleContactFormChange}
                        className="contact-input-sand"
                        style={{ height: '46px', textAlign: isRtl ? 'right' : 'left' }}
                      />
                    </div>
                  </div>

                  {/* Row 2: Phone + Subject */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '16px',
                      marginBottom: '16px'
                    }}
                  >
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '0.78rem',
                          fontWeight: '700',
                          color: '#64748b',
                          marginBottom: '6px',
                          textAlign: isRtl ? 'right' : 'left'
                        }}
                      >
                        {t('contactFormPhone')}
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        placeholder={t('contactFormPhone')}
                        value={contactForm.phone}
                        onChange={handleContactFormChange}
                        className="contact-input-sand"
                        style={{ height: '46px', textAlign: isRtl ? 'right' : 'left' }}
                      />
                    </div>

                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontSize: '0.78rem',
                          fontWeight: '700',
                          color: '#64748b',
                          marginBottom: '6px',
                          textAlign: isRtl ? 'right' : 'left'
                        }}
                      >
                        {t('contactFormSubject')}
                      </label>
                      <input
                        type="text"
                        name="subject"
                        placeholder={t('contactFormSubject')}
                        value={contactForm.subject}
                        onChange={handleContactFormChange}
                        className="contact-input-sand"
                        style={{ height: '46px', textAlign: isRtl ? 'right' : 'left' }}
                      />
                    </div>
                  </div>

                  {/* Row 3: Message Textarea */}
                  <div style={{ marginBottom: '22px' }}>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.78rem',
                        fontWeight: '700',
                        color: '#64748b',
                        marginBottom: '6px',
                        textAlign: isRtl ? 'right' : 'left'
                      }}
                    >
                      {t('contactFormMsg')}
                    </label>
                    <textarea
                      name="message"
                      required
                      rows={5}
                      placeholder={t('contactFormMsg')}
                      value={contactForm.message}
                      onChange={handleContactFormChange}
                      className="contact-input-sand"
                      style={{ resize: 'vertical', textAlign: isRtl ? 'right' : 'left' }}
                    />
                  </div>

                  {/* Submit Button */}
                  <div>
                    <button
                      type="submit"
                      style={{
                        background: '#96663B',
                        color: '#FFFDF9',
                        border: 'none',
                        borderRadius: '30px',
                        padding: '12px 36px',
                        fontSize: '0.96rem',
                        fontWeight: '800',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '10px',
                        boxShadow: '0 4px 16px rgba(150, 102, 59, 0.35)',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.background = '#7A5230';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.background = '#96663B';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      <span>{t('sendNow')}</span>
                      <Send size={16} />
                    </button>
                  </div>
                </form>
              </div>
            </div>

          </div>
        </section>
      )}

      {/* ☕ DEDICATED LUXURY ABOUT US VIEW (من نحن - مطابق للصورة تماماً مع هوية كاتورا) ☕ */}
      {!isAcademyPageOpen && activeNav === 'about' && (
        <section className="store-about-page" id="store-about-view" key={`about-view-${aboutAnimKey}`}>

          {/* 1. TOP HERO BANNER (رأس الصفحة الفاخر) */}
          <div className="about-hero-section">
            <div className="about-hero-overlay" />
            <div className="about-hero-content">
              <span className="about-hero-pill anim-hero-pill">
                <span>{t('aboutCaturraPill')}</span>
              </span>
              <h1 className="about-hero-title anim-hero-title">{t('navAbout')}</h1>
            </div>
          </div>

          {/* 2. SECTION 1: OUR STORY (قصتنا وحكايتنا) */}
          <div className="about-story-section">
            <div className="about-story-grid">

              {/* Image */}
              <div className="about-story-photo-wrapper anim-about-photo">
                <img
                  src="/caturra_about_barista.jpg"
                  alt="محمصة كاتورا للقهوة المختصة"
                />
                <div className="about-story-badge anim-about-badge">
                  <Coffee size={18} color="#e6b87d" />
                  <span>CATURRA • {language === 'en' ? 'Specialty Coffee' : 'قهوة مختصة'}</span>
                </div>
              </div>

              {/* Narrative Story Text */}
              <div className="about-story-text-container" style={{ textAlign: isRtl ? 'right' : 'left' }}>
                <span className="about-story-tag anim-stagger-1">
                  {contactInfo?.storyTag || t('ourStoryTag')}
                </span>

                <h2 className="about-story-title anim-stagger-2">
                  {contactInfo?.brandNameEn || 'CATURRA'}
                </h2>

                <div className="about-story-subtitle anim-stagger-3">
                  {contactInfo?.storySubtitle || contactInfo?.brandNameAr || t('roasterySubtitle')}
                </div>

                <p className="about-story-p1 anim-stagger-4" style={{ whiteSpace: 'pre-line' }}>
                  {contactInfo?.aboutStoryP1 || contactInfo?.aboutUs || t('aboutStoryP1')}
                </p>

                {(contactInfo?.aboutStoryP2 || (!contactInfo?.aboutStoryP1 && !contactInfo?.aboutUs)) && (
                  <p className="about-story-p2 anim-stagger-5" style={{ whiteSpace: 'pre-line' }}>
                    {contactInfo?.aboutStoryP2 || t('aboutStoryP2')}
                  </p>
                )}

                {/* Bullet highlights with individual stagger animations */}
                <div className="about-story-bullets">
                  <div className="about-story-bullet-item anim-stagger-6">
                    <div className="about-story-bullet-icon">✓</div>
                    <span>{t('aboutBullet1')}</span>
                  </div>
                  <div className="about-story-bullet-item anim-stagger-7">
                    <div className="about-story-bullet-icon">✓</div>
                    <span>{t('aboutBullet2')}</span>
                  </div>
                  <div className="about-story-bullet-item anim-stagger-8">
                    <div className="about-story-bullet-icon">✓</div>
                    <span>{t('aboutBullet3')}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>

          {/* 3. SECTION 2: NUMBERS & ACHIEVEMENTS STRIP */}
          <div className="about-stats-strip">
            <div
              style={{
                position: 'absolute',
                top: '-50%',
                right: '-10%',
                width: '380px',
                height: '380px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.03)',
                pointerEvents: 'none'
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: '-50%',
                left: '-10%',
                width: '380px',
                height: '380px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.03)',
                pointerEvents: 'none'
              }}
            />

            <div className="about-stats-grid">

              <div className="about-stat-item anim-stat-1" title={`${storeStats.raw.lots} محصول وسلالة قهوة مختصة متوفرة`}>
                <span className="about-stat-number">{storeStats.displayLots}</span>
                <span className="about-stat-label">{t('aboutStatLots')}</span>
              </div>

              <div className="about-stat-item anim-stat-2" title={`تأسست المحمصة عام ${contactInfo?.foundingYear || 2021}`}>
                <span className="about-stat-number">{storeStats.displayYears}</span>
                <span className="about-stat-label">{t('aboutStatYears')}</span>
              </div>

              <div className="about-stat-item anim-stat-3" title="شهادات اعتماد الجودة وتحكيم القهوة المختصة">
                <span className="about-stat-number">{storeStats.displayCerts}</span>
                <span className="about-stat-label">{t('aboutStatCerts')}</span>
              </div>

              <div className="about-stat-item anim-stat-4" title="فروع ومقرات لخدمتكم المباشرة وتذوق القهوة">
                <span className="about-stat-number">{storeStats.displayBranches}</span>
                <span className="about-stat-label">{t('aboutStatBranches')}</span>
              </div>

              <div className="about-stat-item anim-stat-5" title="أكاديمية وبرامج تدريب باريستا وتحميص معتمدة">
                <span className="about-stat-number">{storeStats.displayAcademy}</span>
                <span className="about-stat-label">{t('aboutStatAcademy')}</span>
              </div>

              <div className="about-stat-item anim-stat-6" title="100% حبوب أرابيكا مختصة نقية من أفضل المزارع العالمية">
                <span className="about-stat-number">{storeStats.displayArabica}</span>
                <span className="about-stat-label">{t('aboutStatArabica')}</span>
              </div>

              <div className="about-stat-item anim-stat-7" title={`${storeStats.raw.totalCups.toLocaleString('ar-EG')} فنجان قهوة قُدم وحُضّر بحرفية وشغف من مبيعات المحمصة`}>
                <span className="about-stat-number">{storeStats.displayCups}</span>
                <span className="about-stat-label">{t('aboutStatCups')}</span>
              </div>

            </div>
          </div>

          {/* 4. SECTION 3: CORE VALUES & PILLARS */}
          <div className="about-values-section">
            <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 46px' }}>
              <span style={{
                display: 'inline-block',
                padding: '4px 18px',
                borderRadius: '9999px',
                background: '#fef3c7',
                color: '#b45309',
                fontSize: '0.8rem',
                fontWeight: '800',
                marginBottom: '10px',
                border: '1px solid #fde68a'
              }}>
                {t('aboutVisionBadge')}
              </span>
              <h2 style={{
                fontSize: '2.3rem',
                fontWeight: '900',
                color: '#4A3220',
                margin: '0 0 10px'
              }}>
                {t('navAbout')}
              </h2>
              <p style={{
                fontSize: '0.94rem',
                color: '#5C3D2E',
                margin: 0,
                lineHeight: '1.6'
              }}>
                {t('aboutParagraph2')}
              </p>
            </div>

            <div className="about-values-grid">

              {/* Card 1: رؤيتنا */}
              <div className="about-value-card anim-card-1">
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: '#FFF8EE',
                  color: '#96663B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                  border: '1.5px solid #EDD9BD'
                }}>
                  <Compass size={28} />
                </div>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '800',
                  color: '#4A3220',
                  margin: '0 0 12px'
                }}>
                  {t('aboutVisionTitle')}
                </h3>
                <p style={{
                  fontSize: '0.88rem',
                  color: '#5C3D2E',
                  lineHeight: '1.8',
                  margin: 0
                }}>
                  {t('aboutVisionDesc')}
                </p>
              </div>

              {/* Card 2: رسالتنا */}
              <div className="about-value-card anim-card-2">
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: '#FFF8EE',
                  color: '#96663B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                  border: '1.5px solid #EDD9BD'
                }}>
                  <Coffee size={28} />
                </div>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '800',
                  color: '#4A3220',
                  margin: '0 0 12px'
                }}>
                  {t('aboutMissionTitle')}
                </h3>
                <p style={{
                  fontSize: '0.88rem',
                  color: '#5C3D2E',
                  lineHeight: '1.8',
                  margin: 0
                }}>
                  {t('aboutMissionDesc')}
                </p>
              </div>

              {/* Card 3: قيمنا */}
              <div className="about-value-card anim-card-3">
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: '#FFF8EE',
                  color: '#96663B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '20px',
                  border: '1.5px solid #EDD9BD'
                }}>
                  <Award size={28} />
                </div>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: '800',
                  color: '#4A3220',
                  margin: '0 0 12px'
                }}>
                  {t('aboutValuesTitle')}
                </h3>
                <p style={{
                  fontSize: '0.88rem',
                  color: '#5C3D2E',
                  lineHeight: '1.8',
                  margin: 0
                }}>
                  {t('aboutValuesDesc')}
                </p>
              </div>

            </div>
          </div>

          {/* 5. SECTION 4: CALL TO ACTION BANNER */}
          <div style={{
            background: 'linear-gradient(135deg, #2C1810 0%, #4A3220 100%)',
            color: '#FFF8EE',
            padding: '50px 24px',
            textAlign: 'center',
            borderTop: '1px solid #EDD9BD'
          }}>
            <div style={{ maxWidth: '720px', margin: '0 auto' }}>
              <h3 style={{ fontSize: '1.8rem', fontWeight: '900', margin: '0 0 12px', color: '#FFF8EE', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <span>{t('tasteDifferenceTitle')}</span>
                <Coffee size={26} color="#C49A5C" />
              </h3>
              <p style={{ fontSize: '0.94rem', color: '#EDD9BD', margin: '0 0 24px', lineHeight: '1.7' }}>
                {t('tasteDifferenceDesc')}
              </p>
              <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => handleNavClick('store')}
                  style={{
                    background: 'linear-gradient(135deg, #96663B 0%, #7A5230 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '30px',
                    padding: '12px 32px',
                    fontSize: '0.96rem',
                    fontWeight: '800',
                    cursor: 'pointer',
                    boxShadow: '0 4px 16px rgba(150, 102, 59, 0.35)',
                    transition: 'transform 0.2s',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <span>{t('shopLotsNow')}</span>
                  <Coffee size={18} color="#ffffff" />
                </button>
                <button
                  type="button"
                  onClick={() => handleNavClick('contact')}
                  style={{
                    background: 'transparent',
                    color: '#FFF8EE',
                    border: '1.5px solid #EDD9BD',
                    borderRadius: '30px',
                    padding: '12px 28px',
                    fontSize: '0.96rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {t('contactUsEmoji')}
                </button>
              </div>
            </div>
          </div>

        </section>
      )}

      {/* 🤝 DEDICATED B2B & WHOLESALE VIEW (الجملة وتوريد الكافيهات) 🤝 */}
      {!isAcademyPageOpen && activeNav === 'b2b' && (
        <StoreB2BView onNavigateToStore={() => handleNavClick('store')} />
      )}

      {/* 🏠 FULL LUXURY HOME PAGE (الهوم بيج بتصميم وهيكل بن القاهرة مع هوية وبيانات كاتورا) 🏠 */}
      {!isAcademyPageOpen && (activeNav === 'home' || !hasEnteredStore) && renderHomePage()}

      {/* 🛒 STORE & CATALOG VIEW (الكتالوج والمتجر) 🛒 */}
      {!isAcademyPageOpen && activeNav === 'store' && hasEnteredStore && (
        <>
          {/* HERO BANNER (Full-width cinematic background video with overlay text) */}
          <section
            className="store-hero-banner"
            style={{
              position: 'relative',
              width: '100%',
              minHeight: 'clamp(540px, 62vh, 700px)',
              display: 'flex',
              alignItems: 'center',
              overflow: 'hidden',
              backgroundColor: '#1b0d07',
              color: '#ffffff',
              boxSizing: 'border-box'
            }}
          >
            {/* Ambient Background Video on Desktop / Lightweight Poster on Mobile */}
            {isMobileScreen ? (
              <img
                src="/caturra_store_video.jpg"
                alt="محمصة كاتورا للقهوة المختصة"
                loading="lazy"
                decoding="async"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center',
                  zIndex: 0,
                  pointerEvents: 'none'
                }}
              />
            ) : (
              <video
                autoPlay
                loop
                muted
                playsInline
                preload="none"
                poster="/caturra_store_video.jpg"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  objectPosition: 'center',
                  zIndex: 0,
                  pointerEvents: 'none'
                }}
              >
                <source src="/hero_video.mp4" type="video/mp4" />
                <source src="/caturra_store_video.mp4" type="video/mp4" />
              </video>
            )}

            {/* Clear, Minimal Gradient Overlay (Maximizes video clarity & brightness while preserving text readability) */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                background: isRtl
                  ? 'linear-gradient(to left, rgba(16, 8, 4, 0.82) 0%, rgba(16, 8, 4, 0.52) 45%, rgba(16, 8, 4, 0.18) 80%, rgba(16, 8, 4, 0.28) 100%)'
                  : 'linear-gradient(to right, rgba(16, 8, 4, 0.82) 0%, rgba(16, 8, 4, 0.52) 45%, rgba(16, 8, 4, 0.18) 80%, rgba(16, 8, 4, 0.28) 100%)',
                zIndex: 1,
                pointerEvents: 'none'
              }}
            />

            <div className="store-hero-content-container">
              <div className="store-hero-text-block">

                {/* Badge */}
                <span className="store-hero-badge">
                  <Sparkles size={14} color="#e6b87d" />
                  <span>{t('heroBadge')}</span>
                </span>

                {/* Title */}
                <h1 className="store-hero-title">
                  {t('heroTitlePrefix')}{' '}
                  <span
                    style={{
                      color: '#ffffff',
                      display: 'inline-block',
                      fontWeight: '900',
                      textShadow: '0 2px 14px rgba(0, 0, 0, 0.95)'
                    }}
                  >
                    {t('caturraWord')}
                  </span>
                </h1>

                {/* Paragraph */}
                <p className="store-hero-desc">
                  {t('heroDesc')}
                </p>

                {/* Action Buttons */}
                <div className="store-hero-actions">
                  <a
                    href="#products-section"
                    className="btn btn-primary store-hero-cta"
                  >
                    <span>{t('browseLotsAndTools')}</span>
                    <span style={{ fontSize: '1rem' }}>↓</span>
                  </a>

                  <div className="store-hero-perk">
                    <Shield size={16} color="#e6b87d" />
                    <span>{t('fastShippingAllEgypt')}</span>
                  </div>
                </div>

              </div>
            </div>
          </section>

          {/* ☕ MAIN CATALOG WITH LUXURY TOP BAR FILTER & SCROLLSPY ☕ */}
          <main id="products-section" className="store-catalog-wrapper">

            {/* 📢 شريط العروض التلفزيوني المتحرك (TV OFFERS TICKER) 📢 */}
            {!isBannerDismissed && (
              <TvOffersTicker
                contactInfo={contactInfo}
                language={language}
                onActionClick={() => {
                  const el = document.querySelector('.store-catalog-main') || document.getElementById('products-section');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                onDismiss={() => setIsBannerDismissed(true)}
              />
            )}

            {/* 🏷️ STICKY TOP FILTER BAR CONTAINER (Converted from Sidebar) 🏷️ */}
            <div className="store-top-filter-bar-container">

              {/* Row 1: Search & Coffee Origins Filter Chips */}
              <div className="store-top-search-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
                  <div className="store-top-search-input-wrap">
                    <Search size={18} color="#8A654C" className="store-top-search-icon" />
                    <input
                      type="text"
                      placeholder={t('storeSearchInputPlaceholder')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="store-top-search-input"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="store-top-search-clear"
                        title={t('clearSearch')}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      style={{
                        background: '#F4ECE1',
                        border: '1px solid #EDD9BD',
                        borderRadius: '12px',
                        padding: '8px 12px',
                        fontSize: '0.78rem',
                        color: '#7A5230',
                        fontWeight: '800',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        whiteSpace: 'nowrap',
                        flexShrink: 0
                      }}
                      title={t('resetAllFilters')}
                    >
                      <RotateCcw size={14} />
                      <span>{t('filterReset')}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 📌 Sentinel Anchor for Sticky/Fixed Pinning */}
            <div ref={categoryBarSentinelRef} style={{ height: 0, width: '100%', margin: 0, padding: 0 }} />

            {/* Row 2: Sticky Category Navigation Tabs with Automatic ScrollSpy */}
            <div
              className={`store-sticky-category-tabs ${isCategoryBarPinned ? 'is-pinned-top' : ''}`}
              style={isCategoryBarPinned ? {
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                width: '100%',
                maxWidth: '100%',
                zIndex: 99999,
                borderRadius: 0,
                borderTop: 'none',
                borderLeft: 'none',
                borderRight: 'none',
                borderBottom: '1.5px solid #EDD9BD',
                boxShadow: '0 6px 22px rgba(44, 24, 16, 0.18)',
                background: 'rgba(245, 230, 208, 0.98)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                padding: '8px 16px',
                margin: 0
              } : {}}
            >
              <div
                className="store-category-tabs-scroll"
                ref={categoryTabsScrollRef}
                style={isCategoryBarPinned ? { maxWidth: '1780px', margin: '0 auto' } : {}}
              >
                {visibleCategories.map((cat) => {
                  const isCurrent = activeScrollCategory === cat.id;
                  const count = getCategoryCount(cat.id);
                  const emoji = getCategoryEmoji(cat.id);
                  return (
                    <button
                      key={cat.id}
                      id={`pill-cat-${cat.id}`}
                      type="button"
                      onClick={() => handleCategoryTabClick(cat.id)}
                      className={`store-category-tab-pill ${isCurrent ? 'active' : ''}`}
                    >
                      <span className="store-tab-emoji">{emoji}</span>
                      <span className="store-tab-title">{getLocalizedCategory(cat, language)}</span>
                      <span className="store-tab-count">{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Spacer when pinned so catalog products layout does not jump */}
            {isCategoryBarPinned && (
              <div style={{ height: '56px', width: '100%', pointerEvents: 'none' }} />
            )}

            {/* 🌟 CATALOG PRODUCTS (MAIN VIEW) 🌟 */}
            <div className="store-catalog-main" style={{ width: '100%', maxWidth: '100%' }}>

              {/* Case 1: Filtered / Search Active Mode */}
              {searchQuery.trim() !== '' ? (
                <div>
                  <div className="store-catalog-header-bar" style={{ marginBottom: '18px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                      <h2 style={{ fontSize: '1.2rem', fontWeight: '900', color: '#2C1810', margin: 0 }}>
                        {language === 'ar' ? 'نتائج البحث عن:' : 'Search results for:'} "{searchQuery}"
                      </h2>
                      <span style={{ fontSize: '0.84rem', color: '#64748b', fontWeight: '700' }}>
                        ({filteredProducts.length} {t('availableCount')})
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      style={{
                        background: 'none',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        padding: '4px 10px',
                        fontSize: '0.78rem',
                        color: '#64748b',
                        cursor: 'pointer',
                        fontWeight: '700'
                      }}
                    >
                      {t('filterReset')}
                    </button>
                  </div>

                  {filteredProducts.length === 0 ? (
                    <div className="store-catalog-empty">
                      <Coffee size={46} color="#94a3b8" style={{ margin: '0 auto 12px' }} />
                      <h3 style={{ fontSize: '1.15rem', color: '#1e293b', margin: '0 0 6px', fontWeight: '800' }}>
                        {t('noProductsFound')}
                      </h3>
                      <p style={{ fontSize: '0.86rem', color: '#64748b', margin: '0 0 16px' }}>
                        {t('noProductsFoundSub')}
                      </p>
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="btn btn-primary"
                        style={{ padding: '8px 20px', fontSize: '0.86rem' }}
                      >
                        {t('viewAllProducts')}
                      </button>
                    </div>
                  ) : (
                    <div className="store-products-grid">
                      {filteredProducts.map(renderCatalogProductCard)}
                    </div>
                  )}
                </div>
              ) : (
                /* Case 2: Standard Browsing Mode (Organized by Category Sections for ScrollSpy - Strictly Coffee first, Tools last) */
                <div className="store-catalog-sections-flow">
                  {visibleCategories.filter(c => c.id !== 'all').map((cat) => {
                    const catProducts = products
                      .filter(p => productMatchesCategory(p, cat.id))
                      .sort((a, b) => {
                        const aIsTool = isToolProduct(a);
                        const bIsTool = isToolProduct(b);
                        if (!aIsTool && bIsTool) return -1;
                        if (aIsTool && !bIsTool) return 1;
                        return 0;
                      });
                    if (catProducts.length === 0) return null;

                    const emoji = getCategoryEmoji(cat.id);

                    return (
                      <section
                        key={cat.id}
                        id={`cat-sec-${cat.id}`}
                        data-category-id={cat.id}
                        className="store-category-section"
                      >
                        <div className="store-category-section-header">
                          <h2 className="store-category-section-title">
                            <span>{emoji}</span>
                            <span>{getLocalizedCategory(cat, language)}</span>
                          </h2>
                          <span className="store-category-section-count">
                            {catProducts.length} {t('availableCount')}
                          </span>
                        </div>

                        <div className="store-products-grid">
                          {catProducts.map(renderCatalogProductCard)}
                        </div>
                      </section>
                    );
                  })}
                </div>
              )}

            </div>
          </main>
        </>
      )}

      {/* 🎓 DEDICATED ACADEMY FULL PAGE (صفحة الأكاديمية المستقلة) 🎓 */}
      {isAcademyPageOpen && (
        <div className="store-academy-standalone-page">

          {/* Academy Hero Section with Pure Natural Image (No Filter) */}
          <section
            className="academy-standalone-hero"
            style={{
              position: 'relative',
              width: '100%',
              minHeight: 'clamp(580px, 75vh, 760px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              backgroundImage: "url('/caturra_academy_hero.jpg?v=2')",
              backgroundSize: 'cover',
              backgroundPosition: 'center 38%',
              backgroundRepeat: 'no-repeat',
              color: '#ffffff',
              padding: '90px 24px 80px',
              borderBottom: '4px solid #d97706',
              boxSizing: 'border-box'
            }}
          >
            {/* Ambient vignette overlay for cinematic depth & readability */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(to bottom, rgba(12, 5, 2, 0.45) 0%, rgba(12, 5, 2, 0.15) 35%, rgba(12, 5, 2, 0.25) 65%, rgba(12, 5, 2, 0.65) 100%)',
                pointerEvents: 'none',
                zIndex: 1
              }}
            />

            <div style={{
              maxWidth: '920px',
              width: '100%',
              margin: '0 auto',
              textAlign: 'center',
              position: 'relative',
              zIndex: 2,
              background: 'rgba(15, 8, 4, 0.24)',
              backdropFilter: 'blur(2px)',
              WebkitBackdropFilter: 'blur(2px)',
              padding: '38px 32px',
              borderRadius: '26px',
              border: '1.2px solid rgba(212, 163, 115, 0.25)',
              boxShadow: '0 16px 40px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
            }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(217, 119, 6, 0.25)',
                color: '#fbbf24',
                border: '1px solid rgba(251, 191, 36, 0.4)',
                padding: '6px 18px',
                borderRadius: '9999px',
                fontSize: '0.86rem',
                fontWeight: '800',
                marginBottom: '16px'
              }}>
                <GraduationCap size={20} />
                <span>{t('academyBadge')}</span>
              </div>

              <h1 style={{ color: '#ffffff', fontSize: '2.4rem', fontWeight: '900', margin: '0 0 14px', lineHeight: '1.25', textShadow: '0 3px 14px rgba(0,0,0,0.9)' }}>
                {t('academyHeroTitle')}
              </h1>

              <p style={{ fontSize: '1.02rem', color: '#e2e8f0', maxWidth: '720px', margin: '0 auto 28px', lineHeight: '1.7', textShadow: '0 2px 8px rgba(0,0,0,0.7)' }}>
                {t('academyHeroDesc')}
              </p>

              {/* Academy Search (Enlarged & Centered without return button) */}
              <div style={{ maxWidth: '780px', width: '100%', margin: '0 auto' }}>
                <div style={{ position: 'relative', width: '100%' }}>
                  <Search
                    size={22}
                    style={{
                      position: 'absolute',
                      [isRtl ? 'right' : 'left']: '18px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#e6b87d',
                      pointerEvents: 'none'
                    }}
                  />
                  <input
                    type="text"
                    placeholder={t('academySearchPlaceholder')}
                    value={academySearchQuery}
                    onChange={e => setAcademySearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: isRtl ? '16px 54px 16px 48px' : '16px 48px 16px 54px',
                      borderRadius: '16px',
                      border: '1.5px solid rgba(212, 163, 115, 0.35)',
                      background: 'rgba(25, 10, 5, 0.75)',
                      color: '#ffffff',
                      fontSize: '1.08rem',
                      fontWeight: '600',
                      outline: 'none',
                      boxSizing: 'border-box',
                      boxShadow: '0 8px 30px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                      transition: 'all 0.25s ease'
                    }}
                    onFocus={e => {
                      e.target.style.borderColor = 'rgba(212, 163, 115, 0.75)';
                      e.target.style.boxShadow = '0 10px 36px rgba(0, 0, 0, 0.6), 0 0 18px rgba(212, 163, 115, 0.25)';
                    }}
                    onBlur={e => {
                      e.target.style.borderColor = 'rgba(212, 163, 115, 0.35)';
                      e.target.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.08)';
                    }}
                  />
                  {academySearchQuery && (
                    <button
                      onClick={() => setAcademySearchQuery('')}
                      style={{
                        position: 'absolute',
                        [isRtl ? 'left' : 'right']: '16px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'rgba(212, 163, 115, 0.2)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '30px',
                        height: '30px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#f5ebe1',
                        cursor: 'pointer'
                      }}
                      title={t('clearSearch')}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Academy Main Content Body */}
          <main style={{ maxWidth: '1240px', margin: '0 auto', padding: '40px 20px 70px' }}>

            {/* Category Filter Pills */}
            <div className="store-academy-filters" style={{ marginBottom: '32px' }}>
              {[
                { id: 'all', label: t('academyCatAll') },
                { id: 'brewing', label: t('academyCatBrewing') },
                { id: 'grind', label: t('academyCatGrind') },
                { id: 'beans', label: t('academyCatBeans') },
                { id: 'barista', label: t('academyCatBarista') }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setAcademyCategoryFilter(cat.id)}
                  className={`store-academy-filter-btn ${academyCategoryFilter === cat.id ? 'active' : ''}`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Articles Grid */}
            {(() => {
              const filtered = (academyArticles || []).filter(art => {
                const matchCategory = academyCategoryFilter === 'all' || art.category === academyCategoryFilter;
                const artTitle = (language === 'en' && art.titleEn) ? art.titleEn : art.title;
                const artSummary = (language === 'en' && art.summaryEn) ? art.summaryEn : (art.summary || '');
                const artContent = (language === 'en' && art.contentEn) ? art.contentEn : (art.content || '');
                const matchQuery = !academySearchQuery.trim() ||
                  artTitle.toLowerCase().includes(academySearchQuery.toLowerCase()) ||
                  artSummary.toLowerCase().includes(academySearchQuery.toLowerCase()) ||
                  artContent.toLowerCase().includes(academySearchQuery.toLowerCase());
                return matchCategory && matchQuery;
              });

              if (filtered.length === 0) {
                return (
                  <div style={{ textAlign: 'center', padding: '60px 20px', background: '#FFFDF9', borderRadius: '16px', border: '1px solid #EDD9BD', margin: '20px 0', boxShadow: 'var(--h-shadow-sm)' }}>
                    <BookOpen size={48} style={{ color: '#96663B', marginBottom: '12px' }} />
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#4A3220', margin: '0 0 6px' }}>{t('academyNoArticlesTitle')}</h3>
                    <p style={{ color: '#8A654C', fontSize: '0.9rem', margin: '0 0 16px' }}>{t('academyNoArticlesDesc')}</p>
                    <button
                      onClick={() => { setAcademySearchQuery(''); setAcademyCategoryFilter('all'); }}
                      className="btn btn-outline"
                      style={{ fontSize: '0.85rem', background: '#FFF8EE', border: '1px solid #EDD9BD', color: '#4A3220' }}
                    >
                      {t('academyResetFilters')}
                    </button>
                  </div>
                );
              }

              return (
                <div className="store-academy-grid">
                  {filtered.map(article => {
                    const displayTitle = (language === 'en' && article.titleEn) ? article.titleEn : article.title;
                    const displaySummary = (language === 'en' && article.summaryEn) ? article.summaryEn : article.summary;
                    const displayLevel = (language === 'en' && article.levelEn) ? article.levelEn : (language === 'en' ? 'All Levels' : (article.level || 'لجميع المستويات'));
                    const displayAuthor = (language === 'en' && article.authorEn) ? article.authorEn : (language === 'en' ? 'Caturra Specialists' : (article.author || 'خبراء كاتورا'));
                    const displayReadTime = (language === 'en' && article.readTimeEn) ? article.readTimeEn : (language === 'en' ? (article.readTime?.replace('دقائق قراءة', 'min read')?.replace('دقائق', 'mins') || '4 min read') : (article.readTime || '4 دقائق قراءة'));

                    return (
                      <article
                        key={article.id}
                        className="academy-card"
                        onClick={() => setSelectedAcademyArticle(article)}
                      >
                        <div className="academy-card-img-wrap">
                          <img
                            src={article.image || '/caturra_espresso_bag_1791023273322.jpg'}
                            alt={displayTitle}
                            className="academy-card-img"
                            loading="lazy"
                          />
                          <span className="academy-card-level-badge">
                            {displayLevel}
                          </span>
                          <span className="academy-card-cat-badge">
                            {article.category === 'brewing' ? t('catBrewing') :
                              article.category === 'grind' ? t('catGrind') :
                                article.category === 'beans' ? t('catBeans') : t('catBaristaSkills')}
                          </span>
                          {article.pdfFile && (
                            <span style={{
                              position: 'absolute',
                              bottom: '10px',
                              left: '10px',
                              background: article.pdfFile.isDrive ? 'rgba(37, 99, 235, 0.94)' : 'rgba(220, 38, 38, 0.94)',
                              color: '#ffffff',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '0.72rem',
                              fontWeight: '800',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                              zIndex: 2
                            }}>
                              {article.pdfFile.isDrive ? <GoogleDriveIcon size={12} /> : <FileText size={12} />}
                              <span>{article.pdfFile.isDrive ? 'Google Drive' : t('academyPdfSampleBooklet')}</span>
                            </span>
                          )}
                        </div>

                        <div className="academy-card-body">
                          <div className="academy-card-meta">
                            <span className="academy-meta-item">
                              <Clock size={13} />
                              <span>{displayReadTime}</span>
                            </span>
                            <span className="academy-meta-item">
                              <Award size={13} />
                              <span>{displayAuthor}</span>
                            </span>
                          </div>

                          <h3 className="academy-card-title">{displayTitle}</h3>
                          <p className="academy-card-summary">{displaySummary}</p>

                          <div className="academy-card-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span className="academy-read-more-btn">
                              <span>{t('academyReadGuideBtn')}</span>
                              <ChevronLeft size={16} style={{ transform: isRtl ? 'none' : 'rotate(180deg)' }} />
                            </span>
                            {article.pdfFile && (
                              <span style={{
                                fontSize: '0.75rem',
                                fontWeight: '800',
                                color: '#dc2626',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                <FileText size={13} />
                                <span>{t('academyPdfAvailable')}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              );
            })()}

            {/* Quick Shop Callout Banner */}
            <div className="academy-cta-banner">
              <div className="academy-cta-content">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontWeight: '800', marginBottom: '6px' }}>
                  <Sparkles size={18} />
                  <span>{t('academyCtaPreTitle')}</span>
                </div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '900', color: '#ffffff' }}>
                  {t('academyCtaTitle')}
                </h3>
                <p style={{ margin: '6px 0 0', color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem' }}>
                  {t('academyCtaDesc')}
                </p>
              </div>
              <button
                onClick={() => navigateToStoreFromAcademy()}
                className="academy-cta-btn"
              >
                <Coffee size={18} />
                <span>{t('academyCtaBackToStore')}</span>
              </button>
            </div>

          </main>
        </div>
      )}

      {/* 🌟 LUXURY STORE FOOTER (من نحن - العنوان - تواصل معنا - السوشيال ميديا) 🌟 */}
      <footer className="store-footer" id="store-footer">
        <div className="store-footer-container">

          {/* Brand & Trust Header Strip */}
          <div className="store-footer-brand-strip">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <img
                src="/caturra_logo.jpg"
                alt="Caturra Logo"
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  border: '2px solid #EDD9BD',
                  padding: '2px',
                  background: '#FFFDF9'
                }}
              />
              <div>
                <h2 style={{ fontSize: '1.35rem', fontWeight: '900', color: '#2C1810', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span>{t('footerBrandTitle')}</span>
                  <span style={{ fontSize: '0.78rem', background: '#FFFDF9', color: '#96663B', padding: '3px 10px', borderRadius: '12px', border: '1px solid #EDD9BD', fontWeight: '800', boxShadow: '0 1px 4px rgba(74, 50, 32, 0.05)' }}>
                    {t('footerBrandSub')}
                  </span>
                </h2>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.86rem', color: '#6B4A2E', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
                  <span>{contactInfo?.aboutUs || t('footerBrandDesc')}</span>
                  <Coffee size={16} color="#96663B" strokeWidth={2.2} />
                </p>
              </div>
            </div>

            {/* Trust Pills */}
            <div className="store-footer-trust-pills">
              <span className="trust-pill"><Award size={15} color="#96663B" /> {t('footerTrustArabica')}</span>
              <span className="trust-pill"><Sparkles size={15} color="#C49A5C" /> {t('footerTrustRoast')}</span>
              <span className="trust-pill"><Shield size={15} color="#96663B" /> {t('footerTrustQuality')}</span>
            </div>
          </div>

          {/* Main Footer 4-Column Professional Luxury Cards Grid */}
          <div className="store-footer-grid">

            {/* Column 1: تواصل معنا (Contact Us) */}
            <div
              className="store-footer-card"
              style={{
                background: '#FFFDF9',
                border: '1.5px solid #EDD9BD',
                borderRadius: '20px',
                padding: '22px',
                boxShadow: '0 8px 24px rgba(74, 50, 32, 0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '12px', borderBottom: '1.5px solid #F0E0CC' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '11px',
                    background: '#FFF8EE',
                    border: '1.5px solid #EDD9BD',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Phone size={18} color="#96663B" strokeWidth={2.2} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '900', color: '#2C1810' }}>{t('footerContactTitle')}</h3>
                  <span style={{ fontSize: '0.74rem', color: '#96663B', fontWeight: '700' }}>{t('footerContactSub')}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {/* Direct Call */}
                <a
                  href={`tel:${activePhone}`}
                  className="store-footer-action-link"
                >
                  <div className="store-footer-icon-wrap" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#2563eb' }}>
                    <Phone size={16} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.72rem', color: '#8A654C', fontWeight: '600' }}>{t('footerCallDirect')}</div>
                    <div style={{ fontWeight: '800', color: '#2C1810', fontSize: '0.92rem', direction: 'ltr', textAlign: isRtl ? 'right' : 'left' }}>{activePhone}</div>
                  </div>
                </a>

                {/* Direct WhatsApp */}
                <a
                  href={`https://wa.me/${cleanStoreWhatsApp}?text=${encodeURIComponent(language === 'en' ? 'Hello Caturra Specialty Coffee, I would like to inquire about your coffee lots and orders.' : 'مرحباً كاتورا للقهوة المختصة، أود الاستفسار عن منتجاتكم وطلبات القهوة.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="store-footer-action-link"
                >
                  <div className="store-footer-icon-wrap" style={{ background: 'rgba(37, 211, 102, 0.15)', color: '#16a34a' }}>
                    <MessageCircle size={16} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.72rem', color: '#8A654C', fontWeight: '600' }}>{t('footerWhatsappChat')}</div>
                    <div style={{ fontWeight: '800', color: '#16a34a', fontSize: '0.88rem' }}>{t('footerWhatsappAction')}</div>
                  </div>
                </a>

                {/* Email */}
                <a
                  href={`mailto:${activeEmail}`}
                  className="store-footer-action-link"
                >
                  <div className="store-footer-icon-wrap" style={{ background: 'rgba(196, 154, 92, 0.18)', color: '#96663B' }}>
                    <Mail size={16} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.72rem', color: '#8A654C', fontWeight: '600' }}>{t('footerEmailDirect')}</div>
                    <div style={{ fontWeight: '700', color: '#2C1810', fontSize: '0.82rem', wordBreak: 'break-all' }}>{activeEmail}</div>
                  </div>
                </a>
              </div>
            </div>

            {/* Column 2: العنوان ومواعيد العمل (Address & Hours) */}
            <div
              className="store-footer-card"
              style={{
                background: '#FFFDF9',
                border: '1.5px solid #EDD9BD',
                borderRadius: '20px',
                padding: '22px',
                boxShadow: '0 8px 24px rgba(74, 50, 32, 0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '12px', borderBottom: '1.5px solid #F0E0CC' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '11px',
                    background: '#FFF8EE',
                    border: '1.5px solid #EDD9BD',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <MapPin size={18} color="#96663B" strokeWidth={2.2} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '900', color: '#2C1810' }}>{t('footerHoursTitle')}</h3>
                  <span style={{ fontSize: '0.74rem', color: '#96663B', fontWeight: '700' }}>{t('footerHoursSub')}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div className="store-footer-info-item">
                  <div className="store-footer-icon-wrap" style={{ background: '#FFF8EE', border: '1px solid #EDD9BD', color: '#96663B' }}>
                    <MapPin size={16} />
                  </div>
                  <div>
                    <div style={{ fontWeight: '800', color: '#2C1810', fontSize: '0.86rem' }}>{t('footerHqLabel')}</div>
                    <div style={{ color: '#5C3D2E', fontSize: '0.82rem', marginTop: '3px', lineHeight: '1.5', fontWeight: '500' }}>
                      {activeAddress}
                    </div>
                  </div>
                </div>

                <div className="store-footer-info-item">
                  <div className="store-footer-icon-wrap" style={{ background: '#FFF8EE', border: '1px solid #EDD9BD', color: '#96663B' }}>
                    <Clock size={16} />
                  </div>
                  <div>
                    <div style={{ fontWeight: '800', color: '#2C1810', fontSize: '0.86rem' }}>{t('footerServiceHoursLabel')}</div>
                    <div style={{ color: '#5C3D2E', fontSize: '0.82rem', marginTop: '3px', lineHeight: '1.5', fontWeight: '500' }}>
                      {activeHours}
                    </div>
                  </div>
                </div>

                <div className="store-footer-info-item">
                  <div className="store-footer-icon-wrap" style={{ background: '#FFF8EE', border: '1px solid #EDD9BD', color: '#96663B' }}>
                    <Truck size={16} />
                  </div>
                  <div>
                    <div style={{ fontWeight: '800', color: '#2C1810', fontSize: '0.86rem' }}>{t('footerShippingLabel')}</div>
                    <div style={{ color: '#5C3D2E', fontSize: '0.82rem', marginTop: '3px', lineHeight: '1.5', fontWeight: '500' }}>
                      {activeShipping}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Column 3: أكاديمية كاتورا (Coffee Academy) */}
            <div
              className="store-footer-card"
              style={{
                background: '#FFFDF9',
                border: '1.5px solid #EDD9BD',
                borderRadius: '20px',
                padding: '22px',
                boxShadow: '0 8px 24px rgba(74, 50, 32, 0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '12px', borderBottom: '1.5px solid #F0E0CC' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '11px',
                    background: '#FFF8EE',
                    border: '1.5px solid #EDD9BD',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <BookOpen size={18} color="#96663B" strokeWidth={2.2} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '900', color: '#2C1810' }}>{t('footerAcademyTitle')}</h3>
                  <span style={{ fontSize: '0.74rem', color: '#96663B', fontWeight: '700' }}>{t('footerAcademySub')}</span>
                </div>
              </div>

              <p style={{ fontSize: '0.84rem', lineHeight: '1.75', color: '#5C3D2E', margin: 0, fontWeight: '500' }}>
                {t('footerAcademyDesc')}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '10px', background: '#FFF8EE', border: '1px solid #EDD9BD', fontSize: '0.8rem', color: '#4A3220', fontWeight: '700' }}>
                  <Award size={15} color="#96663B" />
                  <span>{t('footerAcademyCupping')}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '10px', background: '#FFF8EE', border: '1px solid #EDD9BD', fontSize: '0.8rem', color: '#4A3220', fontWeight: '700' }}>
                  <Scale size={15} color="#96663B" />
                  <span>{t('footerAcademyEspresso')}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '10px', background: '#FFF8EE', border: '1px solid #EDD9BD', fontSize: '0.8rem', color: '#4A3220', fontWeight: '700' }}>
                  <Coffee size={15} color="#96663B" />
                  <span>{t('footerAcademyV60')}</span>
                </div>
              </div>
            </div>

            {/* Column 4: تابعنا على السوشيال ميديا (Social Media) */}
            <div
              className="store-footer-card"
              style={{
                background: '#FFFDF9',
                border: '1.5px solid #EDD9BD',
                borderRadius: '20px',
                padding: '22px',
                boxShadow: '0 8px 24px rgba(74, 50, 32, 0.06)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                transition: 'all 0.3s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingBottom: '12px', borderBottom: '1.5px solid #F0E0CC' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '11px',
                    background: '#FFF8EE',
                    border: '1.5px solid #EDD9BD',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}
                >
                  <Sparkles size={18} color="#96663B" strokeWidth={2.2} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: '900', color: '#2C1810' }}>{t('socialFollowTitle')}</h3>
                  <span style={{ fontSize: '0.74rem', color: '#96663B', fontWeight: '700' }}>{t('socialOffersSub')}</span>
                </div>
              </div>

              <p style={{ fontSize: '0.84rem', color: '#5C3D2E', margin: 0, lineHeight: '1.6', fontWeight: '500' }}>
                {t('socialFollowText')}
              </p>

              {/* Social Icons Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: 'auto' }}>
                <a
                  href={activeInstagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="store-footer-social-card"
                  style={{ '--hover-color': '#e1306c' }}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                  </svg>
                  <span>{t('socialInstagram')}</span>
                </a>

                <a
                  href={activeFacebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="store-footer-social-card"
                  style={{ '--hover-color': '#1877f2' }}
                >
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  </svg>
                  <span>{t('socialFacebook')}</span>
                </a>

                <a
                  href={activeTiktok}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="store-footer-social-card"
                  style={{ '--hover-color': '#111827' }}
                >
                  <span style={{ fontWeight: '900', fontSize: '0.95rem', lineHeight: '1' }}>♪</span>
                  <span>{t('socialTiktok')}</span>
                </a>

                <a
                  href={`https://wa.me/${cleanStoreWhatsApp}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="store-footer-social-card"
                  style={{ '--hover-color': '#25d366' }}
                >
                  <MessageSquare size={17} />
                  <span>{t('socialWhatsapp')}</span>
                </a>
              </div>
            </div>

          </div>

          {/* Footer Bottom Bar */}
          <div className="store-footer-bottom">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ fontSize: '0.84rem', color: '#6B4A2E', fontWeight: '600' }}>
                {t('footerCopyright')} • {t('madeWithLove')}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', fontSize: '0.82rem' }}>
                <button
                  type="button"
                  onClick={() => setLegalModalType('returns')}
                  style={{ background: 'none', border: 'none', padding: 0, color: '#7A4B24', cursor: 'pointer', textDecoration: 'underline', fontWeight: '700' }}
                >
                  {language === 'en' ? 'Quality Guarantee & Returns' : 'سياسة الاسترجاع والضمان'}
                </button>
                <span style={{ color: '#EDD9BD' }}>•</span>
                <button
                  type="button"
                  onClick={() => setLegalModalType('privacy')}
                  style={{ background: 'none', border: 'none', padding: 0, color: '#7A4B24', cursor: 'pointer', textDecoration: 'underline', fontWeight: '700' }}
                >
                  {language === 'en' ? 'Privacy Policy' : 'سياسة الخصوصية'}
                </button>
                <span style={{ color: '#EDD9BD' }}>•</span>
                <button
                  type="button"
                  onClick={() => setLegalModalType('terms')}
                  style={{ background: 'none', border: 'none', padding: 0, color: '#7A4B24', cursor: 'pointer', textDecoration: 'underline', fontWeight: '700' }}
                >
                  {language === 'en' ? 'Terms & Conditions' : 'الشروط والأحكام'}
                </button>
              </div>
            </div>

            {/* Accepted Payment Badges & Track Order */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => openTrackingModal()}
                style={{
                  background: '#FFFDF9',
                  border: '1.2px solid #EDD9BD',
                  color: '#4A3220',
                  padding: '6px 14px',
                  borderRadius: '10px',
                  fontSize: '0.8rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  transition: 'all 180ms ease',
                  boxShadow: '0 2px 6px rgba(74, 50, 32, 0.04)'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#96663B';
                  e.currentTarget.style.color = '#FFF8EE';
                  e.currentTarget.style.borderColor = '#96663B';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = '#FFFDF9';
                  e.currentTarget.style.color = '#4A3220';
                  e.currentTarget.style.borderColor = '#EDD9BD';
                }}
                title={t('trackOrderBtn')}
              >
                <Truck size={15} />
                <span>{t('trackOrderBtn')}</span>
              </button>

              <span style={{ fontSize: '0.78rem', color: '#8A654C', fontWeight: '700' }}>{t('paymentMethodsLabel')}</span>
              <span className="payment-chip">{t('instapayName')}</span>
              <span className="payment-chip">{t('vodafoneCashName')}</span>
              <span className="payment-chip">{t('codName')}</span>
            </div>
          </div>

        </div>
      </footer>

      {/* 🌟 LUXURY PRODUCT DETAILS MODAL (نافذة بيانات وتفاصيل المنتج) 🌟 */}
      {selectedProductDetails && (
        <div className="modal-overlay" onClick={() => setSelectedProductDetails(null)}>
          <div
            className="modal-content store-product-details-modal"
            style={{
              maxWidth: '840px',
              width: '94%',
              maxHeight: '92vh',
              overflowY: 'auto',
              padding: '0',
              borderRadius: '24px',
              background: '#FFFDF9',
              border: '1.5px solid #EDD9BD',
              boxShadow: '0 25px 65px rgba(74, 50, 32, 0.16)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px 24px',
              background: 'linear-gradient(135deg, #2C1810 0%, #4A3220 100%)',
              borderBottom: '1px solid #EDD9BD'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Coffee size={20} color="#C49A5C" />
                <span style={{ fontWeight: '800', fontSize: '0.95rem', color: '#FFF8EE' }}>
                  {t('productDetails')}
                </span>
                <span style={{
                  fontSize: '0.72rem',
                  background: 'rgba(196, 154, 92, 0.18)',
                  color: '#C49A5C',
                  border: '1px solid #C49A5C',
                  padding: '2px 8px',
                  borderRadius: '20px',
                  fontWeight: '700'
                }}>
                  {getLocalizedCategory(selectedProductDetails.category, language) || (language === 'en' ? 'Caturra Product' : 'منتج كاتورا')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProductDetails(null)}
                className="btn-icon"
                style={{ width: '34px', height: '34px', background: '#2C1810', border: '1px solid #EDD9BD', color: '#FFF8EE' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Main Body Grid */}
            <div
              className="store-product-details-body"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))',
                gap: '24px',
                padding: '24px',
                boxSizing: 'border-box',
                width: '100%'
              }}
            >

              {/* Visuals, Origin & Technical Specs */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Product Bag / Image Container */}
                <div style={{
                  position: 'relative',
                  width: '100%',
                  minHeight: '260px',
                  maxHeight: '340px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  background: 'radial-gradient(circle at center, #FFFDF9 0%, #FAF4E8 100%)',
                  border: '1.5px solid #EDD9BD',
                  boxShadow: '0 8px 24px rgba(74, 50, 32, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '14px'
                }}>
                  <img
                    src={(activeBagSide === 'back' && selectedProductDetails.backImage) ? selectedProductDetails.backImage : resolveProductImage(selectedProductDetails)}
                    alt={getLocalizedName(selectedProductDetails, language)}
                    style={{
                      width: '100%',
                      height: '100%',
                      maxHeight: '300px',
                      objectFit: 'contain',
                      transition: 'transform 0.3s ease'
                    }}
                  />

                  {/* 🔄 Interactive Bag Flip Toggle (Front / Back) */}
                  {selectedProductDetails.backImage && (
                    <div style={{ position: 'absolute', bottom: '10px', zIndex: 10, display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setActiveBagSide('front')}
                        style={{
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '0.74rem',
                          fontWeight: '800',
                          cursor: 'pointer',
                          border: 'none',
                          background: activeBagSide === 'front' ? '#2C1810' : 'rgba(255,255,255,0.9)',
                          color: activeBagSide === 'front' ? '#FFFFFF' : '#2C1810',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                        }}
                      >
                        ☕ {language === 'en' ? 'Front Bag' : 'وجه الكيس'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveBagSide('back')}
                        style={{
                          padding: '4px 12px',
                          borderRadius: '20px',
                          fontSize: '0.74rem',
                          fontWeight: '800',
                          cursor: 'pointer',
                          border: 'none',
                          background: activeBagSide === 'back' ? '#2C1810' : 'rgba(255,255,255,0.9)',
                          color: activeBagSide === 'back' ? '#FFFFFF' : '#2C1810',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                        }}
                      >
                        🔄 {language === 'en' ? 'Back & Recipe' : 'ظهر الكيس والوصفة'}
                      </button>
                    </div>
                  )}

                  {/* Stock Availability Badge */}
                  <span style={{
                    position: 'absolute',
                    top: '12px',
                    [isRtl ? 'right' : 'left']: '12px',
                    background: selectedProductDetails.stock > 0 ? '#1E6B38' : '#B91C1C',
                    color: '#ffffff',
                    padding: '5px 12px',
                    borderRadius: '20px',
                    fontSize: '0.74rem',
                    fontWeight: '800',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
                    zIndex: 5
                  }}>
                    {selectedProductDetails.stock > 0 ? (
                      <>
                        <CheckCircle size={13} />
                        <span>{t('inStockReady')}</span>
                      </>
                    ) : (
                      <span>{t('outOfStockTemp')}</span>
                    )}
                  </span>
                </div>

                {/* Symmetrical Luxury Specifications Card */}
                <div style={{
                  background: '#FFFDF9',
                  border: '1.5px solid #EDD9BD',
                  borderRadius: '16px',
                  padding: '16px',
                  boxShadow: '0 4px 16px rgba(74, 50, 32, 0.05)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px'
                }}>
                  {/* Card Header */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingBottom: '10px',
                    marginBottom: '4px',
                    borderBottom: '1.5px solid #F0E2D0'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.1rem' }}>📜</span>
                      <h3 style={{ margin: 0, fontSize: '0.94rem', fontWeight: '900', color: '#3A2012' }}>
                        {language === 'en' ? 'Certified Coffee Specifications' : 'بطاقة مواصفات المحصول المعتمدة'}
                      </h3>
                    </div>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: '900',
                      color: '#8B5E34',
                      background: '#FAF3E8',
                      border: '1px solid #E8D5C4',
                      padding: '3px 8px',
                      borderRadius: '12px',
                      letterSpacing: '0.5px'
                    }}>
                      CATURRA CERTIFIED
                    </span>
                  </div>

                  {/* Specification Symmetrical Rows (Priority to Custom Studio Edits & Live Bag Design) */}
                  {(() => {
                    const customDesign = selectedProductDetails.customBagDesign || {};
                    const crop = customDesign.crop || {};
                    const frontDesign = customDesign.front || {};
                    const backDesign = customDesign.back || {};
                    const recipe = backDesign.recipe || {};

                    const countryVal = crop.country || frontDesign.country || selectedProductDetails.country || selectedProductDetails.coffeeOrigin?.country || selectedProductDetails.origin;
                    const regionVal = crop.region || selectedProductDetails.coffeeOrigin?.region || selectedProductDetails.region;
                    const farmVal = crop.farm || selectedProductDetails.coffeeOrigin?.farm || selectedProductDetails.farm;
                    const altitudeVal = crop.altitude || selectedProductDetails.altitude || selectedProductDetails.coffeeOrigin?.altitude;
                    const varietyVal = crop.variety || selectedProductDetails.variety || selectedProductDetails.coffeeOrigin?.variety;
                    const processVal = crop.process || frontDesign.process || selectedProductDetails.process || selectedProductDetails.coffeeOrigin?.process;
                    const rawNotes = (crop.notes && Array.isArray(crop.notes) ? crop.notes.join(' / ') : crop.notes) || selectedProductDetails.flavorNotes || selectedProductDetails.notes || selectedProductDetails.sensoryProfile?.flavorNotes;
                    const brewVal = recipe.brew || recipe.method || selectedProductDetails.recommendedFor;
                    const roastVal = crop.roast || frontDesign.roast || selectedProductDetails.roastLevel;

                    return (
                      <>
                        {/* 1. Country / Origin */}
                        {countryVal && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '9px 12px',
                            borderRadius: '8px',
                            background: '#FAF6F0',
                            fontSize: '0.84rem'
                          }}>
                            <span style={{ color: '#7A5230', fontWeight: '700', flex: '0 0 44%', textAlign: isRtl ? 'right' : 'left' }}>
                              {language === 'en' ? 'Origin Country:' : 'بلد المنشأ:'}
                            </span>
                            <strong style={{
                              color: '#96663B',
                              flex: 1,
                              display: 'flex',
                              justifyContent: 'flex-end',
                              alignItems: 'center',
                              gap: '6px',
                              fontWeight: '800',
                              textAlign: isRtl ? 'left' : 'right'
                            }}>
                              <span>{getCountryMeta(countryVal).flag}</span>
                              <span>{getLocalizedOrigin(countryVal, language)}</span>
                            </strong>
                          </div>
                        )}

                        {/* 2. Region & Farm */}
                        {(regionVal || farmVal) && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '9px 12px',
                            borderRadius: '8px',
                            background: '#FFFDF9',
                            fontSize: '0.84rem'
                          }}>
                            <span style={{ color: '#7A5230', fontWeight: '700', flex: '0 0 44%', textAlign: isRtl ? 'right' : 'left' }}>
                              {language === 'en' ? 'Region / Farm:' : 'المنطقة والمزرعة:'}
                            </span>
                            <strong style={{
                              color: '#4A3220',
                              flex: 1,
                              textAlign: isRtl ? 'left' : 'right',
                              fontWeight: '800'
                            }}>
                              {regionVal}
                              {farmVal && farmVal !== regionVal ? ` (${farmVal})` : ''}
                            </strong>
                          </div>
                        )}

                        {/* 3. Altitude */}
                        {altitudeVal && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '9px 12px',
                            borderRadius: '8px',
                            background: '#FAF6F0',
                            fontSize: '0.84rem'
                          }}>
                            <span style={{ color: '#7A5230', fontWeight: '700', flex: '0 0 44%', textAlign: isRtl ? 'right' : 'left' }}>
                              {language === 'en' ? 'Altitude:' : 'الارتفاع فوق سطح البحر:'}
                            </span>
                            <strong style={{
                              color: '#4A3220',
                              flex: 1,
                              textAlign: isRtl ? 'left' : 'right',
                              fontWeight: '800'
                            }}>
                              <span dir="ltr">
                                {String(altitudeVal).replace('≈', '≈ ').trim()}
                              </span>
                            </strong>
                          </div>
                        )}

                        {/* 4. Variety */}
                        {varietyVal && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '9px 12px',
                            borderRadius: '8px',
                            background: '#FFFDF9',
                            fontSize: '0.84rem'
                          }}>
                            <span style={{ color: '#7A5230', fontWeight: '700', flex: '0 0 44%', textAlign: isRtl ? 'right' : 'left' }}>
                              {language === 'en' ? 'Variety:' : 'السلالة النباتية:'}
                            </span>
                            <strong style={{
                              color: '#1B382B',
                              flex: 1,
                              textAlign: isRtl ? 'left' : 'right',
                              fontWeight: '800'
                            }}>
                              {varietyVal}
                            </strong>
                          </div>
                        )}

                        {/* 5. Processing Method */}
                        {processVal && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '9px 12px',
                            borderRadius: '8px',
                            background: '#FAF6F0',
                            fontSize: '0.84rem'
                          }}>
                            <span style={{ color: '#7A5230', fontWeight: '700', flex: '0 0 44%', textAlign: isRtl ? 'right' : 'left' }}>
                              {language === 'en' ? 'Processing Method:' : 'طريقة المعالجة:'}
                            </span>
                            <span style={{
                              flex: 1,
                              display: 'flex',
                              justifyContent: 'flex-end',
                              alignItems: 'center'
                            }}>
                              <span style={{
                                color: '#92400E',
                                fontWeight: '800',
                                background: '#FEF3C7',
                                border: '1px solid #FDE68A',
                                padding: '3px 10px',
                                borderRadius: '12px',
                                fontSize: '0.78rem'
                              }}>
                                {getLocalizedProcess(processVal, language)}
                              </span>
                            </span>
                          </div>
                        )}

                        {/* 6. Tasting Notes */}
                        {rawNotes && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '9px 12px',
                            borderRadius: '8px',
                            background: '#FFFDF9',
                            fontSize: '0.84rem'
                          }}>
                            <span style={{ color: '#7A5230', fontWeight: '700', flex: '0 0 44%', textAlign: isRtl ? 'right' : 'left' }}>
                              {language === 'en' ? 'Tasting Notes:' : 'إيحاءات التذوق:'}
                            </span>
                            <strong style={{
                              color: '#8B5E34',
                              flex: 1,
                              textAlign: isRtl ? 'left' : 'right',
                              fontWeight: '800'
                            }}>
                              {getLocalizedNotes(rawNotes, language)}
                            </strong>
                          </div>
                        )}

                        {/* 7. Recommended Brew Method */}
                        {brewVal && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '9px 12px',
                            borderRadius: '8px',
                            background: '#FAF6F0',
                            fontSize: '0.84rem'
                          }}>
                            <span style={{ color: '#7A5230', fontWeight: '700', flex: '0 0 44%', textAlign: isRtl ? 'right' : 'left' }}>
                              {language === 'en' ? 'Recommended Brew:' : 'طريقة التحضير الموصى بها:'}
                            </span>
                            <strong style={{
                              color: '#153825',
                              flex: 1,
                              textAlign: isRtl ? 'left' : 'right',
                              fontWeight: '800'
                            }}>
                              {getLocalizedBrewMethod(brewVal, language)}
                            </strong>
                          </div>
                        )}

                        {/* 8. Roast Profile */}
                        {roastVal && (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '9px 12px',
                            borderRadius: '8px',
                            background: '#FFFDF9',
                            fontSize: '0.84rem'
                          }}>
                            <span style={{ color: '#7A5230', fontWeight: '700', flex: '0 0 44%', textAlign: isRtl ? 'right' : 'left' }}>
                              {language === 'en' ? 'Roast Profile:' : 'درجة التحميص:'}
                            </span>
                            <div style={{
                              flex: 1,
                              display: 'flex',
                              justifyContent: 'flex-end',
                              alignItems: 'center',
                              gap: '6px'
                            }}>
                              <strong style={{ color: '#4A3220', fontWeight: '800' }}>
                                {getLocalizedRoast(roastVal, language)}
                              </strong>
                              <RoastDots level={roastVal} />
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}

                  {/* 9. Bag Weight */}
                  {selectedProductDetails.weight && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      background: '#FAF6F0',
                      fontSize: '0.84rem'
                    }}>
                      <span style={{ color: '#7A5230', fontWeight: '700', flex: '0 0 44%', textAlign: isRtl ? 'right' : 'left' }}>
                        {language === 'en' ? 'Net Weight / Size:' : 'حجم العبوة:'}
                      </span>
                      <strong style={{
                        color: '#4A3220',
                        flex: 1,
                        textAlign: isRtl ? 'left' : 'right',
                        fontWeight: '800'
                      }}>
                        {selectedProductDetails.weight} ({language === 'en' ? 'Net Wt.' : 'وزن صافي'})
                      </strong>
                    </div>
                  )}

                  {/* 10. SKU */}
                  {selectedProductDetails.sku && (
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '9px 12px',
                      borderRadius: '8px',
                      background: '#FFFDF9',
                      fontSize: '0.84rem'
                    }}>
                      <span style={{ color: '#7A5230', fontWeight: '700', flex: '0 0 44%', textAlign: isRtl ? 'right' : 'left' }}>
                        {language === 'en' ? 'Product Code (SKU):' : 'كود الصنف (SKU):'}
                      </span>
                      <span style={{
                        fontFamily: 'monospace',
                        fontWeight: '800',
                        color: '#96663B',
                        flex: 1,
                        textAlign: isRtl ? 'left' : 'right'
                      }}>
                        {selectedProductDetails.sku}
                      </span>
                    </div>
                  )}

                  {/* 11. Expiry / Freshness */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    background: '#FAF6F0',
                    fontSize: '0.84rem'
                  }}>
                    <span style={{ color: '#7A5230', fontWeight: '700', flex: '0 0 44%', textAlign: isRtl ? 'right' : 'left' }}>
                      {language === 'en' ? 'Freshness & Shelf Life:' : 'الصلاحية والجودة:'}
                    </span>
                    <strong style={{
                      color: '#15803D',
                      flex: 1,
                      textAlign: isRtl ? 'left' : 'right',
                      fontWeight: '800'
                    }}>
                      {selectedProductDetails.expiryDate
                        ? `${language === 'en' ? 'Valid until' : 'صالح حتى'} ${selectedProductDetails.expiryDate}`
                        : (language === 'en' ? '100% Certified Fresh Roast' : 'حمص طازج 100% معتمد')}
                    </strong>
                  </div>
                </div>

                {/* ☕ Barista Recipe Dial-in Box */}
                {(selectedProductDetails.espressoRecipe || selectedProductDetails.unitType === 'weight') && (
                  <div style={{
                    background: 'linear-gradient(135deg, #24140D 0%, #170C08 100%)',
                    borderRadius: '16px',
                    padding: '14px 16px',
                    color: '#FFF8EE',
                    border: '1px solid #3E2417',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.15)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '0.82rem', fontWeight: '900', color: '#D4AF37', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Coffee size={14} color="#D4AF37" />
                        <span>{language === 'en' ? 'Caturra Barista Dial-in Guide' : 'معايرة ووصفة الاستخلاص المعتمدة'}</span>
                      </span>
                      <span style={{ fontSize: '0.68rem', background: '#3D2214', color: '#E4CAA2', padding: '2px 6px', borderRadius: '4px' }}>
                        1:2 RATIO
                      </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', textAlign: 'center' }}>
                      <div style={{ background: '#311B10', borderRadius: '8px', padding: '6px 4px' }}>
                        <div style={{ fontSize: '0.65rem', color: '#A89284' }}>{language === 'en' ? 'Dose' : 'جرعة البن'}</div>
                        <div style={{ fontSize: '0.88rem', fontWeight: '900', color: '#FFF8EE', marginTop: '2px' }}>
                          {selectedProductDetails.customBagDesign?.back?.recipe?.dose || selectedProductDetails.espressoRecipe?.dose || '18g'}
                        </div>
                      </div>

                      <div style={{ background: '#311B10', borderRadius: '8px', padding: '6px 4px' }}>
                        <div style={{ fontSize: '0.65rem', color: '#A89284' }}>{language === 'en' ? 'Yield' : 'الاستخلاص'}</div>
                        <div style={{ fontSize: '0.88rem', fontWeight: '900', color: '#FCD34D', marginTop: '2px' }}>
                          {selectedProductDetails.customBagDesign?.back?.recipe?.yield || selectedProductDetails.espressoRecipe?.yield || '36g'}
                        </div>
                      </div>

                      <div style={{ background: '#311B10', borderRadius: '8px', padding: '6px 4px' }}>
                        <div style={{ fontSize: '0.65rem', color: '#A89284' }}>{language === 'en' ? 'Time' : 'الزمن'}</div>
                        <div style={{ fontSize: '0.88rem', fontWeight: '900', color: '#6EE7B7', marginTop: '2px' }}>
                          {selectedProductDetails.customBagDesign?.back?.recipe?.time || selectedProductDetails.espressoRecipe?.time || '28s'}
                        </div>
                      </div>

                      <div style={{ background: '#311B10', borderRadius: '8px', padding: '6px 4px' }}>
                        <div style={{ fontSize: '0.65rem', color: '#A89284' }}>{language === 'en' ? 'Temp' : 'الحرارة'}</div>
                        <div style={{ fontSize: '0.88rem', fontWeight: '900', color: '#93C5FD', marginTop: '2px' }}>
                          {selectedProductDetails.customBagDesign?.back?.recipe?.temp || selectedProductDetails.espressoRecipe?.temp || '92°C'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Title, Notes, Description & Purchasing Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: isRtl ? 'right' : 'left' }}>

                {/* Product Title */}
                <div>
                  <h2 style={{ fontSize: '1.45rem', fontWeight: '900', color: '#4A3220', margin: '0 0 4px', lineHeight: '1.3' }}>
                    {getLocalizedName(selectedProductDetails, language)}
                  </h2>
                  {selectedProductDetails.nameEn && language === 'ar' && (
                    <div style={{ fontSize: '0.86rem', color: '#8A654C', fontFamily: 'sans-serif', direction: 'ltr', textAlign: 'right' }}>
                      {selectedProductDetails.nameEn}
                    </div>
                  )}
                </div>

                {/* Flavor Notes */}
                {((selectedProductDetails.customBagDesign?.crop?.notes && (Array.isArray(selectedProductDetails.customBagDesign.crop.notes) ? selectedProductDetails.customBagDesign.crop.notes.length > 0 : selectedProductDetails.customBagDesign.crop.notes)) || selectedProductDetails.flavorNotes || selectedProductDetails.notes) && (
                  <div style={{
                    background: 'rgba(196, 154, 92, 0.12)',
                    border: '1px solid #EDD9BD',
                    borderRadius: '12px',
                    padding: '10px 14px'
                  }}>
                    <span style={{ fontSize: '0.76rem', fontWeight: '800', color: '#96663B', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
                      <Sparkles size={14} color="#96663B" />
                      <span>{t('flavorProfile')}</span>
                    </span>
                    <p style={{ margin: 0, fontSize: '0.94rem', fontWeight: '800', color: '#4A3220', lineHeight: '1.5' }}>
                      {getLocalizedNotes((Array.isArray(selectedProductDetails.customBagDesign?.crop?.notes) ? selectedProductDetails.customBagDesign.crop.notes.join(' / ') : selectedProductDetails.customBagDesign?.crop?.notes) || selectedProductDetails.flavorNotes || selectedProductDetails.notes, language)}
                    </p>
                  </div>
                )}

                {/* Description & Story */}
                {selectedProductDetails.description && (
                  <div>
                    <span style={{ fontSize: '0.8rem', fontWeight: '800', color: '#96663B', display: 'block', marginBottom: '6px' }}>
                      {t('lotStory')}
                    </span>
                    <p style={{
                      fontSize: '0.86rem',
                      lineHeight: '1.65',
                      color: '#5C3D2E',
                      background: '#FFF8EE',
                      border: '1px solid #EDD9BD',
                      borderRadius: '12px',
                      padding: '12px 16px',
                      margin: 0
                    }}>
                      {selectedProductDetails.description}
                    </p>
                  </div>
                )}

                {/* Interactive Customization: Weight & Grind OR Quantity */}
                {(selectedProductDetails.unitType === 'weight' || selectedProductDetails.category === 'specialty' || selectedProductDetails.category === 'classic_blends' || selectedProductDetails.category === 'espresso' || selectedProductDetails.category === 'filter' || selectedProductDetails.category === 'coffee') ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', borderTop: '1px solid #EDD9BD', paddingTop: '12px' }}>
                    {/* Weight Selection */}
                    <div>
                      <label style={{ fontSize: '0.82rem', fontWeight: '800', color: '#4A3220', marginBottom: '6px', display: 'block' }}>
                        {t('selectWeight')}
                      </label>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px' }}>
                        {presetWeights.map(w => {
                          const isSelected = detailsWeight === w.grams && !detailsCustomWeight;
                          const pricePerKg = Number(selectedProductDetails.pricePerKg) || (Number(selectedProductDetails.sellingPrice || 0) * 4);
                          const calcPrice = Math.round(pricePerKg * (w.grams / 1000));
                          return (
                            <button
                              key={w.grams}
                              type="button"
                              onClick={() => {
                                setDetailsWeight(w.grams);
                                setDetailsCustomWeight('');
                              }}
                              style={{
                                padding: '10px 8px',
                                borderRadius: '10px',
                                border: isSelected ? '2px solid #96663B' : '1px solid #EDD9BD',
                                background: isSelected ? '#FFF8EE' : '#FFFDF9',
                                color: isSelected ? '#4A3220' : '#8A654C',
                                fontWeight: isSelected ? '800' : '600',
                                fontSize: '0.8rem',
                                cursor: 'pointer',
                                textAlign: 'center',
                                transition: 'all 0.2s ease',
                                boxShadow: isSelected ? '0 4px 12px rgba(150, 102, 59, 0.2)' : 'none'
                              }}
                            >
                              <div style={{ color: isSelected ? '#96663B' : '#4A3220', fontWeight: '800' }}>{w.label}</div>
                              <div style={{ fontSize: '0.74rem', color: isSelected ? '#7A5230' : '#8A654C', marginTop: '3px' }}>
                                {formatPrice(calcPrice, language)}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Custom Weight Input */}
                    <div style={{ background: '#FFF8EE', padding: '10px 14px', borderRadius: '12px', border: '1px solid #EDD9BD' }}>
                      <span style={{ fontSize: '0.76rem', fontWeight: '700', color: '#8A654C', display: 'block', marginBottom: '6px' }}>
                        {t('customWeight')}
                      </span>
                      <div style={{ position: 'relative' }}>
                        <input
                          type="number"
                          min="50"
                          step="10"
                          placeholder={t('gramsPlaceholder')}
                          value={detailsCustomWeight}
                          onChange={(e) => setDetailsCustomWeight(e.target.value)}
                          className="form-input"
                          style={{
                            height: '38px',
                            borderRadius: '8px',
                            textAlign: 'center',
                            fontWeight: '700',
                            fontSize: '0.88rem',
                            background: '#FFFDF9',
                            border: '1px solid #EDD9BD',
                            color: '#4A3220'
                          }}
                        />
                        <span style={{ position: 'absolute', [isRtl ? 'left' : 'right']: '12px', top: '9px', fontSize: '0.78rem', color: '#96663B', fontWeight: '700' }}>
                          {t('gramsUnit')}
                        </span>
                      </div>
                    </div>

                    {/* Grind Selection */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                        <label style={{ fontSize: '0.82rem', fontWeight: '800', color: '#4A3220', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span>{t('selectGrind')}</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => handleOpenBrewingGuide(detailsGrind)}
                          style={{
                            background: '#FFF8EE',
                            border: '1px solid #C49A5C',
                            color: '#96663B',
                            borderRadius: '20px',
                            padding: '3px 12px',
                            fontSize: '0.74rem',
                            fontWeight: '800',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            transition: 'all 0.2s ease',
                            boxShadow: '0 2px 8px rgba(196, 154, 92, 0.15)'
                          }}
                          title={language === 'en' ? 'View recommended brew guide for this grind' : 'عرض دليل وطريقة التحضير الموصى بها لدرجة الطحن هذه'}
                        >
                          <BookOpen size={12} />
                          <span>{t('viewBrewRecipe')}</span>
                        </button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                        {grindOptions.map(g => (
                          <button
                            key={g.id}
                            type="button"
                            onClick={() => handleSelectGrind(g.id, true)}
                            style={{
                              padding: '8px 10px',
                              borderRadius: '8px',
                              border: detailsGrind === g.id ? '2px solid #96663B' : '1px solid #EDD9BD',
                              background: detailsGrind === g.id ? '#FFF8EE' : '#FFFDF9',
                              color: detailsGrind === g.id ? '#4A3220' : '#8A654C',
                              fontWeight: detailsGrind === g.id ? '800' : '600',
                              fontSize: '0.78rem',
                              cursor: 'pointer',
                              textAlign: isRtl ? 'right' : 'left',
                              transition: 'all 0.2s ease',
                              boxShadow: detailsGrind === g.id ? '0 4px 12px rgba(150, 102, 59, 0.2)' : 'none',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '4px'
                            }}
                          >
                            <span>{g.label}</span>
                            {detailsGrind === g.id && (
                              <span style={{ fontSize: '0.68rem', color: '#96663B', background: 'rgba(196, 154, 92, 0.25)', borderRadius: '10px', padding: '1px 6px', fontWeight: '800' }}>
                                {language === 'en' ? 'Recipe 📖' : 'وصفة 📖'}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Piece Quantity Selector */
                  <div style={{ borderTop: '1px solid #EDD9BD', paddingTop: '12px' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: '800', color: '#4A3220', marginBottom: '6px', display: 'block' }}>
                      {t('quantity')}
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => setDetailsQty(prev => Math.max(1, prev - 1))}
                        className="btn-icon"
                        style={{ width: '34px', height: '34px', background: '#FFF8EE', border: '1px solid #EDD9BD', color: '#4A3220' }}
                      >
                        <Minus size={14} />
                      </button>
                      <span style={{ fontWeight: '900', fontSize: '1.1rem', minWidth: '30px', textAlign: 'center', color: '#96663B' }}>
                        {detailsQty}
                      </span>
                      <button
                        type="button"
                        onClick={() => setDetailsQty(prev => prev + 1)}
                        className="btn-icon"
                        style={{ width: '34px', height: '34px', background: '#FFF8EE', border: '1px solid #EDD9BD', color: '#4A3220' }}
                      >
                        <Plus size={14} />
                      </button>
                      <span style={{ fontSize: '0.82rem', color: '#8A654C' }}>
                        {t('perPiece')} ({formatPrice(selectedProductDetails.sellingPrice, language)} / {t('perPiece')})
                      </span>
                    </div>
                  </div>
                )}

                {/* Package Counter for Coffee */}
                {(selectedProductDetails.unitType === 'weight' || selectedProductDetails.category === 'specialty' || selectedProductDetails.category === 'classic_blends' || selectedProductDetails.category === 'espresso' || selectedProductDetails.category === 'filter' || selectedProductDetails.category === 'coffee') && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: '#FFF8EE',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1px solid #EDD9BD'
                  }}>
                    <span style={{ fontSize: '0.82rem', fontWeight: '700', color: '#4A3220' }}>{t('packagesCount')}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setDetailsQty(prev => Math.max(1, prev - 1))}
                        className="btn-icon"
                        style={{ width: '30px', height: '30px', background: '#FFFDF9', border: '1px solid #EDD9BD', color: '#4A3220' }}
                      >
                        <Minus size={13} />
                      </button>
                      <span style={{ fontWeight: '800', minWidth: '28px', textAlign: 'center', color: '#96663B', fontSize: '0.95rem' }}>{detailsQty}</span>
                      <button
                        type="button"
                        onClick={() => setDetailsQty(prev => prev + 1)}
                        className="btn-icon"
                        style={{ width: '30px', height: '30px', background: '#FFFDF9', border: '1px solid #EDD9BD', color: '#4A3220' }}
                      >
                        <Plus size={13} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Price Breakdown & Add to Cart Action */}
                <div style={{
                  background: '#FFF8EE',
                  border: '1.5px solid #EDD9BD',
                  borderRadius: '14px',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 'auto',
                  gap: '12px'
                }}>
                  <div>
                    <span style={{ fontSize: '0.76rem', color: '#8A654C', display: 'block' }}>
                      {t('finalTotal')}
                    </span>
                    <strong style={{ fontSize: '1.35rem', fontWeight: '900', color: '#96663B' }}>
                      {(() => {
                        const isWeight = selectedProductDetails.unitType === 'weight' || selectedProductDetails.category === 'specialty' || selectedProductDetails.category === 'classic_blends' || selectedProductDetails.category === 'espresso' || selectedProductDetails.category === 'filter' || selectedProductDetails.category === 'coffee';
                        let calcAmount = 0;
                        if (isWeight) {
                          const grams = Number(detailsCustomWeight) > 0 ? Number(detailsCustomWeight) : Number(detailsWeight);
                          const pricePerKg = Number(selectedProductDetails.pricePerKg) || (Number(selectedProductDetails.sellingPrice || 0) * 4);
                          calcAmount = Math.round(pricePerKg * (grams / 1000)) * detailsQty;
                        } else {
                          calcAmount = Number(selectedProductDetails.sellingPrice || 0) * detailsQty;
                        }
                        return formatPrice(calcAmount, language);
                      })()}
                    </strong>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddFromDetailsModal}
                    disabled={selectedProductDetails.stock <= 0}
                    className="btn btn-primary"
                    style={{
                      padding: '12px 22px',
                      fontWeight: '800',
                      fontSize: '0.92rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #96663B 0%, #7A5230 100%)',
                      color: '#ffffff',
                      border: 'none',
                      boxShadow: '0 4px 14px rgba(150, 102, 59, 0.4)'
                    }}
                  >
                    <ShoppingBag size={18} />
                    <span>{t('addToCartModalBtn')}</span>
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🔍 High-Resolution Coffee Bag Zoom Modal */}
      {isBagZoomed && selectedProductDetails && (
        <div
          onClick={() => setIsBagZoomed(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(20, 10, 6, 0.9)',
            backdropFilter: 'blur(10px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#FAF6ED',
              borderRadius: '24px',
              border: '2px solid #EDD9BD',
              boxShadow: '0 25px 60px rgba(0,0,0,0.55)',
              padding: '24px',
              maxWidth: '92vw',
              maxHeight: '94vh',
              overflow: 'auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative'
            }}
          >
            <button
              type="button"
              onClick={() => setIsBagZoomed(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: isRtl ? 'auto' : '16px',
                left: isRtl ? '16px' : 'auto',
                background: '#2C1810',
                color: '#FFF8EE',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10
              }}
            >
              <X size={20} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#96663B', textTransform: 'uppercase', letterSpacing: '1px' }}>
                CATURRA SPECIALTY COFFEE ROASTERS
              </div>
              <h3 style={{ fontSize: '1.45rem', fontWeight: '900', color: '#2C1810', margin: '4px 0' }}>
                {getLocalizedName(selectedProductDetails, language)}
              </h3>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setBagPreviewVariant('landscape')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '0.82rem',
                    fontWeight: '800',
                    border: bagPreviewVariant === 'landscape' ? '2px solid #2E5A36' : '1px solid #D6C8B5',
                    background: bagPreviewVariant === 'landscape' ? '#EBF5EE' : '#FFFDF9',
                    color: bagPreviewVariant === 'landscape' ? '#1B382B' : '#7A5230',
                    cursor: 'pointer'
                  }}
                >
                  ☕ {language === 'en' ? 'Landscape (Espresso)' : 'كيس عرضي (إسبريسو)'}
                </button>
                <button
                  type="button"
                  onClick={() => setBagPreviewVariant('vertical')}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    fontSize: '0.82rem',
                    fontWeight: '800',
                    border: bagPreviewVariant === 'vertical' ? '2px solid #2E5A36' : '1px solid #D6C8B5',
                    background: bagPreviewVariant === 'vertical' ? '#EBF5EE' : '#FFFDF9',
                    color: bagPreviewVariant === 'vertical' ? '#1B382B' : '#7A5230',
                    cursor: 'pointer'
                  }}
                >
                  ⚖️ {language === 'en' ? 'Standing (Filter V60)' : 'كيس طولي (فلتر V60)'}
                </button>
              </div>
            </div>

            <div style={{ padding: '12px', background: '#FAF6ED', borderRadius: '16px' }}>
              <CoffeeBagMockup
                product={selectedProductDetails}
                forceVariant={bagPreviewVariant}
                size="lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* ☕ LUXURY BREWING RECIPE & GUIDE POPUP MODAL (نافذة طريقة ووصفة التحضير للباريستا) ☕ */}
      {isBrewingGuideModalOpen && activeBrewingGuide && (
        <div
          className="modal-overlay"
          style={{
            zIndex: 1100,
            background: 'rgba(10, 4, 2, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setIsBrewingGuideModalOpen(false)}
        >
          <div
            className="modal-content"
            style={{
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '0',
              borderRadius: '24px',
              background: '#FFFDF9',
              border: '1.5px solid #EDD9BD',
              boxShadow: '0 25px 65px rgba(74, 50, 32, 0.16)',
              position: 'relative',
              animation: 'scaleIn 0.22s ease-out',
              color: '#4A3220'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '18px 24px',
              background: 'linear-gradient(135deg, #2C1810 0%, #4A3220 100%)',
              borderBottom: '1.5px solid #EDD9BD'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #96663B 0%, #7A5230 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  boxShadow: '0 4px 14px rgba(150, 102, 59, 0.35)',
                  flexShrink: 0
                }}>
                  <Coffee size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '900', color: '#FFF8EE' }}>
                    {language === 'en' ? (activeBrewingGuide.methodNameEn || activeBrewingGuide.methodName) : activeBrewingGuide.methodName}
                  </h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.76rem', color: '#EDD9BD' }}>
                      {t('brewingGuideSubtitle')}
                    </span>
                    {activeBrewingGuide.productName && (
                      <span style={{
                        background: 'rgba(196, 154, 92, 0.2)',
                        color: '#C49A5C',
                        border: '1px solid #C49A5C',
                        padding: '1px 8px',
                        borderRadius: '12px',
                        fontSize: '0.72rem',
                        fontWeight: '800'
                      }}>
                        {activeBrewingGuide.productName}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsBrewingGuideModalOpen(false)}
                className="btn-icon"
                style={{
                  width: '34px',
                  height: '34px',
                  background: '#2C1810',
                  border: '1px solid #EDD9BD',
                  color: '#FFF8EE',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>

              {/* Parameters Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
                <div style={{
                  background: '#FFF8EE',
                  border: '1px solid #EDD9BD',
                  borderRadius: '12px',
                  padding: '12px',
                  textAlign: 'center',
                  boxShadow: '0 2px 6px rgba(74, 50, 32, 0.05)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#8A654C', fontSize: '0.74rem', marginBottom: '4px' }}>
                    <Scale size={13} color="#96663B" />
                    <span>{t('ratioLabel')}</span>
                  </div>
                  <strong style={{ fontSize: '1.05rem', color: '#96663B', fontWeight: '900' }}>
                    {activeBrewingGuide.ratio || '1:15'}
                  </strong>
                </div>

                <div style={{
                  background: '#FFF8EE',
                  border: '1px solid #EDD9BD',
                  borderRadius: '12px',
                  padding: '12px',
                  textAlign: 'center',
                  boxShadow: '0 2px 6px rgba(74, 50, 32, 0.05)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#8A654C', fontSize: '0.74rem', marginBottom: '4px' }}>
                    <Zap size={13} color="#96663B" />
                    <span>{t('tempLabel')}</span>
                  </div>
                  <strong style={{ fontSize: '1.05rem', color: '#96663B', fontWeight: '900' }}>
                    {activeBrewingGuide.waterTemp || '92°C'}
                  </strong>
                </div>

                <div style={{
                  background: '#FFF8EE',
                  border: '1px solid #EDD9BD',
                  borderRadius: '12px',
                  padding: '12px',
                  textAlign: 'center',
                  boxShadow: '0 2px 6px rgba(74, 50, 32, 0.05)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#8A654C', fontSize: '0.74rem', marginBottom: '4px' }}>
                    <Clock size={13} color="#96663B" />
                    <span>{t('timeLabel')}</span>
                  </div>
                  <strong style={{ fontSize: '1.05rem', color: '#96663B', fontWeight: '900' }}>
                    {activeBrewingGuide.brewTime || '2:30 دقيقة'}
                  </strong>
                </div>

                <div style={{
                  background: '#FFF8EE',
                  border: '1px solid #EDD9BD',
                  borderRadius: '12px',
                  padding: '12px',
                  textAlign: 'center',
                  boxShadow: '0 2px 6px rgba(74, 50, 32, 0.05)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: '#8A654C', fontSize: '0.74rem', marginBottom: '4px' }}>
                    <Coffee size={13} color="#96663B" />
                    <span>{t('doseLabel')}</span>
                  </div>
                  <strong style={{ fontSize: '0.92rem', color: '#96663B', fontWeight: '900' }}>
                    {activeBrewingGuide.coffeeDose || '20 جم'}
                  </strong>
                </div>
              </div>

              {/* Grind Size Texture Description */}
              {activeBrewingGuide.grindSizeLabel && (
                <div style={{
                  background: '#FFF8EE',
                  border: '1px solid #EDD9BD',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(196, 154, 92, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#96663B',
                    flexShrink: 0
                  }}>
                    <SlidersHorizontal size={16} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: '0.74rem', color: '#8A654C', display: 'block', fontWeight: '700' }}>
                      {t('grindSizeLabel')}
                    </span>
                    <strong style={{ fontSize: '0.86rem', color: '#4A3220' }}>
                      {activeBrewingGuide.grindSizeLabel}
                    </strong>
                  </div>
                </div>
              )}

              {/* Step by Step Guide */}
              {activeBrewingGuide.steps && activeBrewingGuide.steps.length > 0 && (
                <div>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '0.92rem', fontWeight: '800', color: '#4A3220' }}>
                    {t('brewingStepsTitle')}
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {activeBrewingGuide.steps.map((stepItem, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: '#FFF8EE',
                          borderRadius: '12px',
                          border: '1px solid #EDD9BD',
                          padding: '12px 14px',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '12px'
                        }}
                      >
                        <div style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #96663B 0%, #7A5230 100%)',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '900',
                          fontSize: '0.84rem',
                          flexShrink: 0,
                          marginTop: '2px',
                          boxShadow: '0 2px 6px rgba(150, 102, 59, 0.4)'
                        }}>
                          {stepItem.step || idx + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <strong style={{ display: 'block', fontSize: '0.88rem', color: '#4A3220', marginBottom: '3px' }}>
                            {stepItem.title}
                          </strong>
                          <p style={{ margin: 0, fontSize: '0.82rem', color: '#5C3D2E', lineHeight: '1.5' }}>
                            {stepItem.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Barista Pro Tip */}
              {activeBrewingGuide.baristaTip && (
                <div style={{
                  background: 'rgba(196, 154, 92, 0.12)',
                  border: '1.5px solid #EDD9BD',
                  borderRadius: '14px',
                  padding: '14px 16px',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'flex-start'
                }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'rgba(196, 154, 92, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#96663B',
                    flexShrink: 0
                  }}>
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.84rem', color: '#4A3220', marginBottom: '3px' }}>
                      {t('baristaTipLabel')}
                    </strong>
                    <p style={{ margin: 0, fontSize: '0.82rem', color: '#5C3D2E', lineHeight: '1.55' }}>
                      {activeBrewingGuide.baristaTip}
                    </p>
                  </div>
                </div>
              )}

              {/* Close & Continue Action */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setIsBrewingGuideModalOpen(false)}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '14px',
                    fontWeight: '900',
                    fontSize: '0.94rem',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #96663B 0%, #7A5230 100%)',
                    color: '#ffffff',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 16px rgba(150, 102, 59, 0.45)',
                    cursor: 'pointer'
                  }}
                >
                  <Check size={18} />
                  <span>{t('understoodContinue')}</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* SHOPPING CART DRAWER */}
      {isCartOpen && (
        <div className="modal-overlay" onClick={() => setIsCartOpen(false)}>
          <div
            className="modal-content"
            style={{
              position: 'fixed',
              left: 0,
              top: 0,
              bottom: 0,
              width: '420px',
              maxWidth: '100%',
              borderRadius: '0',
              height: '100vh',
              maxHeight: '100vh',
              display: 'flex',
              flexDirection: 'column',
              padding: '0',
              margin: '0',
              background: '#FFFDF9',
              borderLeft: isRtl ? 'none' : '1.5px solid #EDD9BD',
              borderRight: isRtl ? '1.5px solid #EDD9BD' : 'none',
              boxShadow: '0 0 35px rgba(74, 50, 32, 0.15)',
              animation: 'slideUp 200ms ease'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{ padding: '20px', borderBottom: '1px solid #EDD9BD', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #2C1810 0%, #4A3220 100%)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingCart size={22} color="#C49A5C" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#FFF8EE', margin: 0 }}>
                  {t('cartTitle')} ({cart.length})
                </h3>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="btn-icon" style={{ width: '32px', height: '32px', background: '#2C1810', border: '1px solid #EDD9BD', color: '#FFF8EE' }}>
                <X size={18} />
              </button>
            </div>

            {/* Cart Items */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', background: '#FFFDF9' }}>
              {cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 0', color: '#8A654C' }}>
                  <ShoppingBag size={48} color="#96663B" style={{ margin: '0 auto 12px' }} />
                  <p style={{ fontWeight: '700', color: '#4A3220' }}>{t('cartEmpty')}</p>
                  <p style={{ fontSize: '0.82rem', marginTop: '4px', color: '#8A654C' }}>{t('cartEmptySub')}</p>
                </div>
              ) : (
                cart.map(item => (
                  <div
                    key={item.cartItemId}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px',
                      background: '#FFF8EE',
                      borderRadius: '12px',
                      border: '1px solid #EDD9BD'
                    }}
                  >
                    <img
                      src={item.image || '/caturra_ethiopia.jpg'}
                      alt={getLocalizedName(item, language)}
                      style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #EDD9BD' }}
                    />
                    <div style={{ flex: 1, overflow: 'hidden', textAlign: isRtl ? 'right' : 'left' }}>
                      <div style={{ fontWeight: '700', fontSize: '0.88rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', color: '#4A3220' }}>
                        {getLocalizedName(item, language)}
                      </div>

                      {item.unitType === 'weight' && (
                        <div style={{ fontSize: '0.74rem', color: '#96663B', fontWeight: '600' }}>
                          ⚖️ {item.weightLabel || `${item.weightGram} ${t('gramsUnit')}`} {item.grind ? `• ${getLocalizedNotes(item.grind, language)}` : ''}
                        </div>
                      )}

                      <div style={{ fontSize: '0.8rem', color: '#4A3220', fontWeight: '700', marginTop: '2px' }}>
                        {formatPrice(item.price, language)} × {item.qty} = {formatPrice(item.price * item.qty, language)}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <button onClick={() => updateCartQty(item.cartItemId, -1)} className="btn-icon" style={{ width: '26px', height: '26px', background: '#FFFDF9', border: '1px solid #EDD9BD', color: '#4A3220' }}>
                        <Minus size={12} />
                      </button>
                      <span style={{ fontWeight: '800', minWidth: '18px', textAlign: 'center', color: '#96663B' }}>{item.qty}</span>
                      <button onClick={() => updateCartQty(item.cartItemId, 1)} className="btn-icon" style={{ width: '26px', height: '26px', background: '#FFFDF9', border: '1px solid #EDD9BD', color: '#4A3220' }}>
                        <Plus size={12} />
                      </button>
                      <button onClick={() => removeFromCart(item.cartItemId)} style={{ background: 'none', border: 'none', color: '#C0392B', cursor: 'pointer', padding: '4px' }}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer & Checkout */}
            {cart.length > 0 && (
              <div style={{ borderTop: '1px solid #EDD9BD', padding: '20px', background: '#FFF8EE' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: '900', color: '#4A3220', marginBottom: '14px' }}>
                  <span>{t('total')}</span>
                  <span style={{ color: '#96663B' }}>{formatPrice(cartTotal, language)}</span>
                </div>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    setIsCheckoutOpen(true);
                  }}
                  className="btn btn-primary"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '1rem',
                    fontWeight: '800',
                    background: 'linear-gradient(135deg, #96663B 0%, #7A5230 100%)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 14px rgba(150, 102, 59, 0.4)'
                  }}
                >
                  {t('checkoutButton')}
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* CHECKOUT MODAL */}
      {isCheckoutOpen && (
        <div className="modal-overlay" onClick={() => setIsCheckoutOpen(false)}>
          <div className="modal-content store-checkout-modal" style={{ maxWidth: '520px', padding: '22px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: 'var(--mint-900)' }}>
                {t('checkoutTitleDetailed')}
              </h3>
              <button onClick={() => setIsCheckoutOpen(false)} className="btn-icon" style={{ width: '30px', height: '30px' }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCheckoutSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">{t('custFullNameLabel')}</label>
                <input
                  type="text"
                  required
                  placeholder={t('custFullNamePlaceholder')}
                  value={custForm.name}
                  onChange={e => setCustForm({ ...custForm, name: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="store-checkout-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">{t('custPhoneLabel')}</label>
                  <input
                    type="tel"
                    required
                    placeholder={t('custPhonePlaceholder')}
                    value={custForm.phone}
                    onChange={e => setCustForm({ ...custForm, phone: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group" style={{ margin: 0 }}>
                  <label className="form-label">{t('custCityLabel')}</label>
                  <input
                    type="text"
                    required
                    list="checkout-cities-datalist"
                    placeholder={language === 'en' ? 'e.g. Cairo, Giza, Alexandria...' : 'اكتب اسم المحافظة أو المدينة...'}
                    value={custForm.city}
                    onChange={e => setCustForm({ ...custForm, city: e.target.value })}
                    className="form-input"
                  />
                  <datalist id="checkout-cities-datalist">
                    <option value="القاهرة">{t('cityCairo')}</option>
                    <option value="الجيزة">{t('cityGiza')}</option>
                    <option value="الإسكندرية">{t('cityAlex')}</option>
                    <option value="القليوبية">{t('cityQalyubia')}</option>
                    <option value="الشرقية">{t('citySharqia')}</option>
                    <option value="الدقهلية">{t('cityDakahlia')}</option>
                    <option value="المنوفية">المنوفية</option>
                    <option value="الغربية">الغربية</option>
                    <option value="البحيرة">البحيرة</option>
                    <option value="كفر الشيخ">كفر الشيخ</option>
                    <option value="دمياط">دمياط</option>
                    <option value="بورسعيد">بورسعيد</option>
                    <option value="الإسماعيلية">الإسماعيلية</option>
                    <option value="السويس">السويس</option>
                    <option value="بني سويف">بني سويف</option>
                    <option value="الفيوم">الفيوم</option>
                    <option value="المنيا">المنيا</option>
                    <option value="أسيوط">أسيوط</option>
                    <option value="سوهاج">سوهاج</option>
                    <option value="قنا">قنا</option>
                    <option value="الأقصر">الأقصر</option>
                    <option value="أسوان">أسوان</option>
                    <option value="البحر الأحمر">البحر الأحمر</option>
                    <option value="جنوب سيناء">جنوب سيناء</option>
                    <option value="شمال سيناء">شمال سيناء</option>
                    <option value="مطروح">مطروح</option>
                    <option value="الوادي الجديد">الوادي الجديد</option>
                  </datalist>
                </div>
              </div>

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">{t('custAddressLabel')}</label>
                <input
                  type="text"
                  placeholder={t('custAddressPlaceholder')}
                  value={custForm.address}
                  onChange={e => setCustForm({ ...custForm, address: e.target.value })}
                  className="form-input"
                />
              </div>

              {/* 🏷️ PROMO DISCOUNT CODE (يظهر فقط عند تفعيل العروض من الإدارة) 🏷️ */}
              {contactInfo?.bannerEnabled !== false && (
                <div
                  style={{
                    background: '#FFF8EE',
                    border: appliedPromo ? '1.5px solid #5B8C5A' : '1.5px solid #EDD9BD',
                    borderRadius: '14px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    transition: 'all 200ms ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <label style={{
                      fontSize: '0.84rem',
                      fontWeight: '800',
                      color: '#4A3220',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <Tag size={15} color="#96663B" />
                      <span>{t('promoCodeLabel')}</span>
                    </label>
                    {appliedPromo && (
                      <span style={{
                        fontSize: '0.74rem',
                        background: 'rgba(91, 140, 90, 0.15)',
                        color: '#3d6a3c',
                        border: '1px solid #5B8C5A',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        fontWeight: '800',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        <CheckCircle size={12} />
                        {t('promoAppliedSuccess')} ({appliedPromo.percent}%)
                      </span>
                    )}
                  </div>

                  {!appliedPromo ? (
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder={t('promoCodePlaceholder')}
                        value={promoCodeInput}
                        onChange={(e) => {
                          setPromoCodeInput(e.target.value.toUpperCase());
                          if (promoError) setPromoError('');
                        }}
                        className="form-input"
                        style={{
                          flex: 1,
                          margin: 0,
                          textTransform: 'uppercase',
                          fontWeight: '700',
                          letterSpacing: '1px',
                          fontSize: '0.88rem',
                          padding: '8px 12px',
                          background: '#FFFDF9',
                          borderColor: promoError ? '#C0392B' : '#EDD9BD',
                          color: '#4A3220'
                        }}
                      />
                      <button
                        type="button"
                        onClick={handleApplyPromo}
                        className="btn btn-primary"
                        style={{
                          padding: '8px 16px',
                          fontSize: '0.84rem',
                          fontWeight: '800',
                          borderRadius: '10px',
                          flexShrink: 0,
                          background: 'linear-gradient(135deg, #96663B 0%, #7A5230 100%)',
                          border: 'none',
                          color: '#ffffff',
                          cursor: 'pointer'
                        }}
                      >
                        {t('applyPromoBtn')}
                      </button>
                    </div>
                  ) : (
                    <div style={{
                      background: 'rgba(91, 140, 90, 0.12)',
                      border: '1px dashed #5B8C5A',
                      borderRadius: '10px',
                      padding: '10px 12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Sparkles size={16} color="#5B8C5A" />
                        <div>
                          <div style={{ fontSize: '0.86rem', fontWeight: '900', color: '#3d6a3c' }}>
                            {appliedPromo.code} (-{formatPrice(promoDiscountAmount, language)})
                          </div>
                          <div style={{ fontSize: '0.72rem', color: '#5B8C5A' }}>
                            {language === 'en' ? `Discount of ${appliedPromo.percent}% applied` : `تم تطبيق خصم ${appliedPromo.percent}% على إجمالي الفاتورة`}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemovePromo}
                        style={{
                          background: 'rgba(192, 57, 43, 0.15)',
                          border: '1px solid #C0392B',
                          color: '#C0392B',
                          borderRadius: '8px',
                          padding: '5px 10px',
                          fontSize: '0.74rem',
                          fontWeight: '800',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Trash2 size={13} />
                        <span>{t('removePromoBtn')}</span>
                      </button>
                    </div>
                  )}

                  {promoError && (
                    <div style={{
                      fontSize: '0.76rem',
                      color: '#C0392B',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      <span>⚠️ {promoError}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label" style={{ fontWeight: '800', marginBottom: '8px', display: 'block', color: '#4A3220' }}>
                  {t('paymentMethodChoiceLabel')}
                </label>
                <div className="store-payment-methods" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                  {/* InstaPay */}
                  <label
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      border: custForm.paymentMethod === 'instapay' ? '2px solid #96663B' : '1px solid #EDD9BD',
                      background: custForm.paymentMethod === 'instapay' ? '#FFF8EE' : '#FFFDF9',
                      cursor: 'pointer',
                      transition: 'all 150ms ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="instapay"
                        checked={custForm.paymentMethod === 'instapay'}
                        onChange={() => setCustForm({ ...custForm, paymentMethod: 'instapay' })}
                      />
                      <span style={{ fontWeight: '800', fontSize: '0.86rem', color: '#4A3220', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Zap size={14} color="#96663B" />
                        {t('instapayBadgeTitle')}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#8A654C', paddingRight: '20px' }}>{t('instapayBadgeSub')}</span>
                  </label>

                  {/* Mobile Wallet */}
                  <label
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      border: custForm.paymentMethod === 'wallet' ? '2px solid #96663B' : '1px solid #EDD9BD',
                      background: custForm.paymentMethod === 'wallet' ? '#FFF8EE' : '#FFFDF9',
                      cursor: 'pointer',
                      transition: 'all 150ms ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="wallet"
                        checked={custForm.paymentMethod === 'wallet'}
                        onChange={() => setCustForm({ ...custForm, paymentMethod: 'wallet' })}
                      />
                      <span style={{ fontWeight: '800', fontSize: '0.86rem', color: '#4A3220', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Smartphone size={14} color="#96663B" />
                        {t('walletBadgeTitle')}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#8A654C', paddingRight: '20px' }}>{t('walletBadgeSub')}</span>
                  </label>

                  {/* Cash on Delivery */}
                  <label
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      padding: '10px 12px',
                      borderRadius: '12px',
                      border: custForm.paymentMethod === 'cash' ? '2px solid #96663B' : '1px solid #EDD9BD',
                      background: custForm.paymentMethod === 'cash' ? '#FFF8EE' : '#FFFDF9',
                      cursor: 'pointer',
                      transition: 'all 150ms ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cash"
                        checked={custForm.paymentMethod === 'cash'}
                        onChange={() => setCustForm({ ...custForm, paymentMethod: 'cash' })}
                      />
                      <span style={{ fontWeight: '800', fontSize: '0.86rem', color: '#4A3220' }}>
                        {t('cashBadgeTitle')}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: '#8A654C', paddingRight: '20px' }}>{t('cashBadgeSub')}</span>
                  </label>
                </div>
              </div>

              {/* ⚡ INSTAPAY / MOBILE WALLET TRANSFER BOX & MANDATORY SCREENSHOT UPLOAD ⚡ */}
              {(custForm.paymentMethod === 'instapay' || custForm.paymentMethod === 'wallet') && (
                <div
                  style={{
                    background: '#FFF8EE',
                    border: '1.5px solid #EDD9BD',
                    borderRadius: '16px',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    animation: 'fadeIn 250ms ease'
                  }}
                >
                  {/* Transfer Account Details Card */}
                  <div style={{
                    background: '#FFFDF9',
                    borderRadius: '12px',
                    padding: '12px 14px',
                    border: '1px solid #EDD9BD',
                    boxShadow: '0 2px 8px rgba(74, 50, 32, 0.05)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{
                        fontSize: '0.84rem',
                        fontWeight: '800',
                        color: '#4A3220',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        {custForm.paymentMethod === 'instapay' ? <Zap size={16} color="#96663B" /> : <Smartphone size={16} color="#96663B" />}
                        <span>
                          {custForm.paymentMethod === 'instapay'
                            ? t('transferDetailsInstapay')
                            : t('transferDetailsWallet')}
                        </span>
                      </span>
                      <span style={{
                        fontSize: '0.74rem',
                        fontWeight: '800',
                        background: 'rgba(196, 154, 92, 0.2)',
                        color: '#96663B',
                        border: '1px solid #EDD9BD',
                        padding: '2px 8px',
                        borderRadius: '6px'
                      }}>
                        {t('amountLabel')} {formatPrice(cartTotal, language)}
                      </span>
                    </div>

                    {/* Account Handle / Phone to Copy */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      background: '#FFF8EE',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px dashed #EDD9BD',
                      marginTop: '4px'
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.74rem', color: '#8A654C', fontWeight: '700' }}>
                          {custForm.paymentMethod === 'instapay' ? t('transferAccountTitleInstapay') : t('transferAccountTitleWallet')}
                        </span>
                        <strong style={{ fontSize: '1.08rem', color: '#4A3220', direction: 'ltr', textAlign: 'left', fontFamily: 'monospace', letterSpacing: '0.5px', marginTop: '2px' }}>
                          {contactInfo?.instapayPhone || contactInfo?.vodafoneCash || '01033144498'}
                        </strong>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyPaymentInfo(
                          contactInfo?.instapayPhone || contactInfo?.vodafoneCash || '01033144498',
                          custForm.paymentMethod
                        )}
                        style={{
                          background: copiedPaymentKey === custForm.paymentMethod ? '#5B8C5A' : '#96663B',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '7px 14px',
                          fontSize: '0.78rem',
                          fontWeight: '800',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '5px',
                          transition: 'background 150ms ease'
                        }}
                      >
                        {copiedPaymentKey === custForm.paymentMethod ? <Check size={14} /> : <Copy size={14} />}
                        <span>{copiedPaymentKey === custForm.paymentMethod ? t('copiedSuccess') : t('copyAccountBtn')}</span>
                      </button>
                    </div>

                    <div style={{ fontSize: '0.76rem', color: '#8A654C', marginTop: '6px', lineHeight: '1.45', fontWeight: '500' }}>
                      {t('transferStepGuidePrefix')} <strong style={{ color: '#96663B' }}>{formatPrice(cartTotal, language)}</strong> {t('transferStepGuideSuffix')}
                    </div>
                  </div>

                  {/* Sender Phone (Strictly Mandatory) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label style={{ fontSize: '0.82rem', fontWeight: '800', color: '#4A3220', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>
                        {t('senderPhoneHeader')} <span style={{ color: '#C0392B' }}>{t('mandatoryVerificationNote')}</span>:
                      </span>
                      {custForm.transferSenderPhone?.trim() ? (
                        <span style={{ fontSize: '0.72rem', color: '#5B8C5A', fontWeight: '700' }}>{t('enteredCheck')}</span>
                      ) : (
                        <span style={{ fontSize: '0.72rem', color: '#C0392B', fontWeight: '800' }}>{t('requiredField')}</span>
                      )}
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder={t('senderPhonePlaceholder')}
                      value={custForm.transferSenderPhone}
                      onChange={e => setCustForm({ ...custForm, transferSenderPhone: e.target.value })}
                      className="form-input"
                      style={{
                        fontSize: '0.88rem',
                        padding: '8px 12px',
                        direction: 'ltr',
                        textAlign: 'left',
                        fontWeight: '700',
                        borderColor: (!custForm.transferSenderPhone?.trim()) ? '#C0392B' : '#EDD9BD',
                        backgroundColor: (!custForm.transferSenderPhone?.trim()) ? '#FFF0F0' : '#FFFDF9',
                        color: '#4A3220'
                      }}
                    />
                    {!custForm.transferSenderPhone?.trim() && (
                      <div style={{ fontSize: '0.72rem', color: '#C0392B', fontWeight: '700' }}>
                        {t('senderPhoneMandatoryWarning')}
                      </div>
                    )}
                  </div>

                  {/* 📸 MANDATORY SCREENSHOT UPLOAD SECTION 📸 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{
                        fontSize: '0.84rem',
                        fontWeight: '900',
                        color: custForm.transferReceipt ? '#5B8C5A' : '#C0392B',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <span>{t('screenshotHeader')}</span>
                        <span style={{
                          fontSize: '0.68rem',
                          background: custForm.transferReceipt ? 'rgba(91, 140, 90, 0.15)' : 'rgba(192, 57, 43, 0.15)',
                          color: custForm.transferReceipt ? '#3d6a3c' : '#C0392B',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontWeight: '800'
                        }}>
                          {custForm.transferReceipt ? t('uploadedSuccessfully') : t('mandatoryForOrder')}
                        </span>
                      </label>
                    </div>

                    {!custForm.transferReceipt ? (
                      <label
                        style={{
                          border: receiptError ? '2px dashed #C0392B' : '2px dashed #96663B',
                          borderRadius: '12px',
                          padding: '18px 14px',
                          background: '#FFFDF9',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          cursor: 'pointer',
                          transition: 'all 180ms ease',
                          textAlign: 'center'
                        }}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleReceiptUpload}
                          style={{ display: 'none' }}
                        />
                        <div style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '50%',
                          background: '#FFF8EE',
                          color: '#96663B',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <UploadCloud size={24} />
                        </div>
                        <div>
                          <span style={{ fontWeight: '800', fontSize: '0.88rem', color: '#4A3220', display: 'block' }}>
                            {t('uploadPromptTitle')}
                          </span>
                          <span style={{ fontSize: '0.74rem', color: '#8A654C', display: 'block', marginTop: '2px' }}>
                            {t('uploadPromptSub')}
                          </span>
                        </div>
                      </label>
                    ) : (
                      /* Uploaded Screenshot Preview Box */
                      <div style={{
                        background: '#FFFDF9',
                        border: '1.5px solid #EDD9BD',
                        borderRadius: '12px',
                        padding: '10px 12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '12px',
                        boxShadow: '0 2px 8px rgba(74, 50, 32, 0.08)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                          <img
                            src={custForm.transferReceipt}
                            alt="Receipt Preview"
                            style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '8px',
                              objectFit: 'cover',
                              border: '1px solid #EDD9BD',
                              flexShrink: 0
                            }}
                          />
                          <div style={{ overflow: 'hidden' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#5B8C5A', fontWeight: '800', fontSize: '0.82rem' }}>
                              <CheckCircle size={14} color="#5B8C5A" />
                              <span>{t('receiptAttachedConfirm')}</span>
                            </div>
                            <span style={{
                              fontSize: '0.72rem',
                              color: 'var(--text-muted)',
                              display: 'block',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              maxWidth: '180px'
                            }}>
                              {custForm.transferReceiptFileName || 'receipt_screenshot.png'}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <label
                            style={{
                              background: '#FFF8EE',
                              border: '1px solid #EDD9BD',
                              color: '#4A3220',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              fontSize: '0.74rem',
                              fontWeight: '700',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleReceiptUpload}
                              style={{ display: 'none' }}
                            />
                            <span>{t('changeBtn')}</span>
                          </label>
                          <button
                            type="button"
                            onClick={handleRemoveReceipt}
                            style={{
                              background: 'rgba(192, 57, 43, 0.15)',
                              color: '#C0392B',
                              border: '1px solid #C0392B',
                              padding: '5px 8px',
                              borderRadius: '6px',
                              fontSize: '0.74rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            title={t('deleteBtn')}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    )}

                    {receiptError && (
                      <div style={{
                        background: 'rgba(192, 57, 43, 0.15)',
                        border: '1px solid #C0392B',
                        color: '#C0392B',
                        padding: '6px 10px',
                        borderRadius: '8px',
                        fontSize: '0.76rem',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}>
                        <span>⚠️ {receiptError}</span>
                      </div>
                    )}

                    {!custForm.transferReceipt && (
                      <div style={{ fontSize: '0.72rem', color: '#C0392B', fontWeight: '700', marginTop: '2px' }}>
                        {t('uploadScreenshotWarning')}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ⚠️ WhatsApp Transfer Screenshot Notice Above Order Total ⚠️ */}
              <div style={{
                background: '#FFF8EE',
                border: '1.5px solid #EDD9BD',
                borderRadius: '12px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: '0 2px 8px rgba(74, 50, 32, 0.05)',
                transition: 'all 200ms ease'
              }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: '#96663B',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <MessageCircle size={20} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', flex: 1 }}>
                  <div style={{ fontSize: '0.86rem', fontWeight: '800', color: '#4A3220', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{(custForm.paymentMethod === 'instapay' || custForm.paymentMethod === 'wallet') ? t('whatsappImportantNoticeTitle') : t('deliveryNoticeTitle')}</span>
                    <span style={{ fontSize: '0.7rem', background: '#96663B', color: '#fff', padding: '1px 7px', borderRadius: '4px', fontWeight: '800' }}>
                      {(custForm.paymentMethod === 'instapay' || custForm.paymentMethod === 'wallet') ? t('urgentBadge') : t('noteBadge')}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#5C3D2E', lineHeight: '1.45', fontWeight: '600' }}>
                    {(custForm.paymentMethod === 'instapay' || custForm.paymentMethod === 'wallet') ? (
                      <>
                        {t('whatsappTransferScreenshotNoticeP1')}{' '}
                        <strong style={{ margin: '0 4px', direction: 'ltr', display: 'inline-block', fontFamily: 'monospace', color: '#4A3220', fontSize: '0.92rem' }}>
                          {cleanStoreWhatsApp || '01000000000'}
                        </strong>{' '}
                        {t('whatsappTransferScreenshotNoticeP2')}
                      </>
                    ) : (
                      <>
                        {t('codPhoneNotice')}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {appliedPromo && promoDiscountAmount > 0 ? (
                <div style={{ background: '#FFF8EE', border: '1px solid #EDD9BD', padding: '14px', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', color: '#8A654C', fontWeight: '700' }}>
                    <span>{t('subtotalLabel')}</span>
                    <span>{formatPrice(cartSubtotal, language)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem', color: '#5B8C5A', fontWeight: '800' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Tag size={13} />
                      <span>{t('discountLabel')} ({appliedPromo.code} - {appliedPromo.percent}%):</span>
                    </span>
                    <span>-{formatPrice(promoDiscountAmount, language)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px dashed #EDD9BD', fontWeight: '900' }}>
                    <span style={{ color: '#4A3220', fontSize: '0.94rem' }}>{t('finalTotalLabel')}</span>
                    <span style={{ color: '#96663B', fontSize: '1.25rem' }}>{formatPrice(cartTotal, language)}</span>
                  </div>
                </div>
              ) : (
                <div style={{ background: '#FFF8EE', border: '1px solid #EDD9BD', padding: '12px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', fontWeight: '800' }}>
                  <span style={{ color: '#8A654C' }}>{t('orderTotalLabel')}</span>
                  <span style={{ color: '#96663B', fontSize: '1.1rem' }}>{formatPrice(cartTotal, language)}</span>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setIsCheckoutOpen(false)}
                    className="btn btn-outline"
                    style={{ flex: 1, padding: '12px', fontWeight: '700' }}
                  >
                    {t('cancelButton')}
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{
                      flex: 2.2,
                      padding: '12px 14px',
                      fontWeight: '800',
                      fontSize: '0.94rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      background: ((custForm.paymentMethod === 'instapay' || custForm.paymentMethod === 'wallet') && (!custForm.transferReceipt || !custForm.transferSenderPhone?.trim()))
                        ? 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)'
                        : 'linear-gradient(135deg, #96663B 0%, #7A5230 100%)',
                      borderColor: 'transparent',
                      boxShadow: ((custForm.paymentMethod === 'instapay' || custForm.paymentMethod === 'wallet') && (!custForm.transferReceipt || !custForm.transferSenderPhone?.trim()))
                        ? 'none'
                        : '0 4px 14px rgba(150, 102, 59, 0.35)',
                      cursor: 'pointer'
                    }}
                  >
                    {((custForm.paymentMethod === 'instapay' || custForm.paymentMethod === 'wallet') && !custForm.transferSenderPhone?.trim()) ? (
                      <span>{t('enterSenderPhoneWarningBtn')}</span>
                    ) : ((custForm.paymentMethod === 'instapay' || custForm.paymentMethod === 'wallet') && !custForm.transferReceipt) ? (
                      <span>{t('uploadReceiptWarningBtn')}</span>
                    ) : (
                      <>
                        <MessageSquare size={18} />
                        <span>{t('confirmAndSubmitOrderBtn')}</span>
                      </>
                    )}
                  </button>
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '2px' }}>
                  {t('systemPendingNotice')}
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* COMPLETED ORDER MODAL */}
      {completedOrder && (
        <div className="modal-overlay" onClick={() => setCompletedOrder(null)}>
          <div className="modal-content" style={{ maxWidth: '480px', padding: '28px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
            <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--mint-100)', color: 'var(--mint-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <CheckCircle size={36} />
            </div>

            <h3 style={{ fontSize: '1.4rem', fontWeight: '900', color: 'var(--mint-950)', margin: '0 0 8px' }}>
              {t('orderSuccessTitle')}
            </h3>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#fef3c7',
              color: '#92400e',
              border: '1px solid #fde68a',
              padding: '5px 14px',
              borderRadius: '9999px',
              fontSize: '0.8rem',
              fontWeight: '800',
              margin: '0 auto 14px'
            }}>
              <span>⏳ {t('orderSuccessPending')}</span>
            </div>

            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6', margin: '0 0 16px' }}>
              {t('orderSuccessDesc')} <strong>{completedOrder.invoiceNumber}</strong>. {t('orderSuccessDescSuffix')}
            </p>

            {/* Transfer Receipt Preview */}
            {completedOrder.transferReceipt && (
              <div style={{
                background: '#FFF8EE',
                border: '1.5px solid #EDD9BD',
                borderRadius: '12px',
                padding: '12px',
                marginBottom: '14px',
                textAlign: isRtl ? 'right' : 'left'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: '800', color: '#4A3220', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle size={15} color="#5B8C5A" />
                    {t('transferReceiptAttached')}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img
                    src={completedOrder.transferReceipt}
                    alt="Receipt"
                    style={{ width: '52px', height: '52px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #EDD9BD', flexShrink: 0 }}
                  />
                  <div style={{ fontSize: '0.78rem', color: '#5C3D2E', lineHeight: '1.55' }}>
                    {t('transferReceiptSuccess')}
                  </div>
                </div>
              </div>
            )}

            {/* Primary Action: Send Real PDF Document to WhatsApp directly */}
            <button
              disabled={isSendingPdf}
              onClick={async () => {
                setIsSendingPdf(true);
                try {
                  await sendInvoicePdfToWhatsApp(completedOrder, contactInfo, activeWhatsApp);
                } catch (err) {
                  console.error('Share PDF error:', err);
                } finally {
                  setIsSendingPdf(false);
                }
              }}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #5B8C5A 0%, #3d6a3c 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '13px',
                padding: '14px',
                fontWeight: '900',
                fontSize: '0.98rem',
                cursor: isSendingPdf ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '9px',
                marginBottom: '6px',
                boxShadow: '0 4px 18px rgba(91, 140, 90, 0.4)',
                opacity: isSendingPdf ? 0.75 : 1
              }}
            >
              <MessageSquare size={20} />
              <span>{isSendingPdf ? t('preparingInvoiceWhatsapp') : t('openRoasteryWhatsapp')}</span>
            </button>

            <div style={{ fontSize: '0.78rem', color: '#5B8C5A', textAlign: 'center', marginBottom: '12px', fontWeight: '800' }}>
              📎 {t('whatsappNoticePdf')} ({activeWhatsApp})
            </div>

            {/* Secondary Action: Download PDF Invoice File directly */}
            <button
              onClick={() => downloadInvoicePdf(completedOrder, contactInfo)}
              style={{
                width: '100%',
                background: 'linear-gradient(135deg, #96663B 0%, #7A5230 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '12px',
                fontWeight: '800',
                fontSize: '0.92rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '14px',
                boxShadow: '0 4px 14px rgba(150, 102, 59, 0.35)'
              }}
            >
              <FileText size={18} />
              <span>{t('downloadPdfInvoice')}</span>
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  const inv = completedOrder;
                  setCompletedOrder(null);
                  openInvoiceModal(inv);
                }}
                style={{
                  height: '42px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  background: '#FFF8EE',
                  border: '1.5px solid #EDD9BD',
                  borderRadius: '12px',
                  color: '#4A3220',
                  fontWeight: '800',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#96663B';
                  e.currentTarget.style.background = '#FFFDF9';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#EDD9BD';
                  e.currentTarget.style.background = '#FFF8EE';
                }}
              >
                <Printer size={16} color="#96663B" />
                <span>{t('viewInvoiceBtn')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const orderNum = completedOrder.invoiceNumber;
                  setCompletedOrder(null);
                  openTrackingModal(orderNum);
                }}
                style={{
                  height: '42px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  background: '#FFF8EE',
                  border: '1.5px solid #EDD9BD',
                  borderRadius: '12px',
                  color: '#4A3220',
                  fontWeight: '800',
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = '#96663B';
                  e.currentTarget.style.background = '#FFFDF9';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = '#EDD9BD';
                  e.currentTarget.style.background = '#FFF8EE';
                }}
              >
                <Truck size={16} color="#96663B" />
                <span>{t('trackOrderModalBtn')}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setCompletedOrder(null)}
              style={{
                width: '100%',
                height: '42px',
                fontWeight: '800',
                background: 'linear-gradient(135deg, #2C1810 0%, #4A3220 100%)',
                border: '1.2px solid #EDD9BD',
                color: '#FFF8EE',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = '#C49A5C';
                e.currentTarget.style.background = '#4A3220';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = '#EDD9BD';
                e.currentTarget.style.background = 'linear-gradient(135deg, #2C1810 0%, #4A3220 100%)';
              }}
            >
              {t('returnToStoreBtn')}
            </button>
          </div>
        </div>
      )}

      {/* 📖 ACADEMY ARTICLE READING MODAL (مودال قراءة مقالات الأكاديمية للعميل) 📖 */}
      {selectedAcademyArticle && (
        <div
          className="modal-overlay academy-reader-overlay"
          onClick={() => setSelectedAcademyArticle(null)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            inset: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 99999,
            background: 'rgba(44, 24, 16, 0.75)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div
            className="modal-content academy-reader-modal"
            onClick={e => e.stopPropagation()}
            style={{
              maxWidth: '820px',
              width: '95%',
              maxHeight: '90vh',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              padding: 0,
              borderRadius: '24px',
              background: '#FFFDF9',
              border: '1.5px solid #EDD9BD',
              boxShadow: '0 25px 65px rgba(44, 24, 16, 0.35)',
              position: 'relative',
              animation: 'modalPop 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 22px',
                borderBottom: '1px solid #EDD9BD',
                background: 'linear-gradient(135deg, #2C1810 0%, #4A3220 100%)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  background: 'rgba(196, 154, 92, 0.2)',
                  color: '#C49A5C',
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(196, 154, 92, 0.35)'
                }}>
                  <GraduationCap size={20} />
                </div>
                <div>
                  <div style={{ fontWeight: '900', fontSize: '1.05rem', color: '#FFFDF9' }}>
                    {t('academyArticleModalTitle')}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#EDD9BD' }}>
                    {t('academyArticleModalSub')}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedAcademyArticle(null)}
                className="btn btn-outline"
                style={{ width: '36px', height: '36px', padding: 0, borderRadius: '50%', color: '#FFFDF9', background: 'rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.25)' }}
                aria-label={t('closeModal')}
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
              {/* Cover Hero Image */}
              <div style={{
                position: 'relative',
                borderRadius: '16px',
                overflow: 'hidden',
                height: '240px',
                marginBottom: '20px',
                boxShadow: '0 8px 24px rgba(74, 50, 32, 0.12)'
              }}>
                <img
                  src={selectedAcademyArticle.image}
                  alt={selectedAcademyArticle.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(44, 24, 16, 0.9) 0%, rgba(44, 24, 16, 0.3) 60%, transparent 100%)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  padding: '20px'
                }}>
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <span style={{
                      background: 'rgba(196, 154, 92, 0.9)',
                      color: '#ffffff',
                      padding: '3px 10px',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: '800'
                    }}>
                      {(language === 'en' && selectedAcademyArticle.levelEn) ? selectedAcademyArticle.levelEn : (language === 'en' ? 'All Levels' : (selectedAcademyArticle.level || 'لجميع المستويات'))}
                    </span>
                    <span style={{
                      background: 'rgba(150, 102, 59, 0.95)',
                      border: '1px solid rgba(237, 217, 189, 0.5)',
                      color: '#ffffff',
                      padding: '3px 10px',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: '800'
                    }}>
                      {selectedAcademyArticle.category === 'brewing' ? t('catBrewing') :
                        selectedAcademyArticle.category === 'grind' ? t('catGrind') :
                          selectedAcademyArticle.category === 'beans' ? t('catBeans') : t('catBaristaSkills')}
                    </span>
                  </div>

                  <h1 style={{ color: '#ffffff', fontSize: '1.45rem', fontWeight: '900', margin: '0 0 8px', lineHeight: '1.3' }}>
                    {(language === 'en' && selectedAcademyArticle.titleEn) ? selectedAcademyArticle.titleEn : selectedAcademyArticle.title}
                  </h1>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', color: 'rgba(255,255,255,0.88)', fontSize: '0.8rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Clock size={14} />
                      {(language === 'en' && selectedAcademyArticle.readTimeEn) ? selectedAcademyArticle.readTimeEn : (language === 'en' ? (selectedAcademyArticle.readTime?.replace('دقائق قراءة', 'min read')?.replace('دقائق', 'mins') || '4 min read') : (selectedAcademyArticle.readTime || '4 دقائق قراءة'))}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <Award size={14} />
                      {(language === 'en' && selectedAcademyArticle.authorEn) ? selectedAcademyArticle.authorEn : (language === 'en' ? 'Caturra Specialists' : (selectedAcademyArticle.author || 'خبراء كاتورا'))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Summary lead */}
              <div style={{
                background: '#FFF8EE',
                border: '1px solid #EDD9BD',
                borderRight: isRtl ? '4px solid #96663B' : 'none',
                borderLeft: isRtl ? 'none' : '4px solid #96663B',
                padding: '14px 18px',
                borderRadius: '8px',
                fontSize: '0.98rem',
                color: '#4A3220',
                lineHeight: '1.6',
                fontWeight: '600',
                marginBottom: '20px'
              }}>
                {(language === 'en' && selectedAcademyArticle.summaryEn) ? selectedAcademyArticle.summaryEn : selectedAcademyArticle.summary}
              </div>

              {/* 📄 ATTACHED PDF / DRIVE SECTION 📄 */}
              {selectedAcademyArticle.pdfFile && (
                <div style={{
                  background: '#FFF8EE',
                  border: '1.5px solid #EDD9BD',
                  borderRadius: '16px',
                  padding: '18px 20px',
                  marginBottom: '24px',
                  boxShadow: 'var(--h-shadow-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', minWidth: '240px' }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      borderRadius: '12px',
                      background: selectedAcademyArticle.pdfFile.isDrive ? '#1e3a8a' : '#96663B',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid #EDD9BD',
                      boxShadow: '0 4px 12px rgba(74, 50, 32, 0.15)',
                      flexShrink: 0
                    }}>
                      {selectedAcademyArticle.pdfFile.isDrive ? <GoogleDriveIcon size={24} /> : <FileText size={26} />}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                        <span style={{
                          fontSize: '0.7rem',
                          background: selectedAcademyArticle.pdfFile.isDrive ? '#1e3a8a' : '#96663B',
                          color: '#fff',
                          padding: '2px 7px',
                          borderRadius: '4px',
                          fontWeight: '900'
                        }}>
                          {selectedAcademyArticle.pdfFile.isDrive ? 'Google Drive' : 'PDF'}
                        </span>
                        <h4 style={{ margin: 0, fontSize: '0.96rem', fontWeight: '800', color: '#4A3220' }}>
                          {selectedAcademyArticle.pdfFile.name}
                        </h4>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.8rem', color: '#8A654C' }}>
                        {selectedAcademyArticle.pdfFile.isDrive
                          ? t('academyDriveDocSub')
                          : `${t('academyPdfDocSub')} ${selectedAcademyArticle.pdfFile.size ? `(${selectedAcademyArticle.pdfFile.size})` : ''}`}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => setViewingAcademyPdf({ pdf: selectedAcademyArticle.pdfFile, title: (language === 'en' && selectedAcademyArticle.titleEn) ? selectedAcademyArticle.titleEn : selectedAcademyArticle.title })}
                      style={{
                        background: 'linear-gradient(135deg, #96663B 0%, #7A5230 100%)',
                        color: '#ffffff',
                        border: 'none',
                        padding: '10px 18px',
                        borderRadius: '10px',
                        fontWeight: '800',
                        fontSize: '0.86rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 10px rgba(150, 102, 59, 0.25)',
                        transition: 'all 0.2s'
                      }}
                    >
                      <BookOpen size={16} />
                      <span>{selectedAcademyArticle.pdfFile.isDrive ? t('readAndBrowseDoc') : t('readAndBrowsePdf')}</span>
                    </button>

                    {selectedAcademyArticle.pdfFile.isDrive ? (
                      <button
                        type="button"
                        onClick={() => window.open(selectedAcademyArticle.pdfFile.url, '_blank')}
                        style={{
                          background: '#FFFDF9',
                          color: '#4A3220',
                          border: '1.5px solid #EDD9BD',
                          padding: '10px 16px',
                          borderRadius: '10px',
                          fontWeight: '800',
                          fontSize: '0.86rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        <ExternalLink size={16} />
                        <span>{t('openInDrive')}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => downloadPdfFile(selectedAcademyArticle.pdfFile)}
                        style={{
                          background: '#FFFDF9',
                          color: '#4A3220',
                          border: '1.5px solid #EDD9BD',
                          padding: '10px 16px',
                          borderRadius: '10px',
                          fontWeight: '800',
                          fontSize: '0.86rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        <Download size={16} />
                        <span>{t('directDownload')}</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* Content Formatted */}
              <div className="academy-modal-content" style={{ fontSize: '0.96rem', lineHeight: '1.8', color: '#5C3D2E' }}>
                {(((language === 'en' && selectedAcademyArticle.contentEn) ? selectedAcademyArticle.contentEn : selectedAcademyArticle.content) || '').split('\n\n').map((block, i) => {
                  if (block.startsWith('### ')) {
                    return (
                      <h3 key={i} style={{ color: '#4A3220', fontWeight: '800', fontSize: '1.18rem', margin: '22px 0 10px', borderBottom: '1px solid #EDD9BD', paddingBottom: '6px' }}>
                        {block.replace('### ', '')}
                      </h3>
                    );
                  } else if (block.startsWith('## ')) {
                    return (
                      <h2 key={i} style={{ color: '#4A3220', fontWeight: '900', fontSize: '1.3rem', margin: '26px 0 12px' }}>
                        {block.replace('## ', '')}
                      </h2>
                    );
                  } else if (block.startsWith('💡') || block.startsWith('📌') || block.startsWith('⚠️')) {
                    return (
                      <div key={i} style={{
                        background: '#FFF8EE',
                        border: '1px solid #EDD9BD',
                        borderRadius: '12px',
                        padding: '14px 16px',
                        margin: '16px 0',
                        color: '#96663B',
                        fontWeight: '700'
                      }}>
                        {block}
                      </div>
                    );
                  } else {
                    return (
                      <p key={i} style={{ margin: '0 0 14px', whiteSpace: 'pre-line', color: '#5C3D2E' }}>
                        {block}
                      </p>
                    );
                  }
                })}
              </div>
            </div>

            {/* Modal Actions */}
            <div
              style={{
                display: 'flex',
                gap: '12px',
                padding: '16px 24px',
                borderTop: '1px solid #EDD9BD',
                background: '#FFFDF9'
              }}
            >
              <button
                onClick={() => navigateToStoreFromAcademy(selectedAcademyArticle)}
                className="btn btn-primary"
                style={{ flex: 1, padding: '12px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', background: 'linear-gradient(135deg, #96663B 0%, #7A5230 100%)', color: '#ffffff', border: 'none', borderRadius: '12px', boxShadow: '0 4px 14px rgba(150, 102, 59, 0.25)' }}
              >
                <Coffee size={18} />
                <span>{t('shopBeansForPrep')}</span>
              </button>

              <button
                onClick={() => setSelectedAcademyArticle(null)}
                className="btn btn-outline"
                style={{ padding: '12px 24px', fontWeight: '700', background: '#FFF8EE', border: '1px solid #EDD9BD', color: '#4A3220', borderRadius: '12px' }}
              >
                {t('closeModal')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🛒 FLOATING MOBILE CART BAR (شريط سلة المشتريات العائم ع الموبايل) 🛒 */}
      {totalCartCount > 0 && !isCartOpen && !isCheckoutOpen && (
        <div
          className="store-mobile-cart-bar"
          onClick={() => setIsCartOpen(true)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              background: 'linear-gradient(135deg, #96663B 0%, #7A5230 100%)',
              color: '#ffffff',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '900',
              fontSize: '0.84rem',
              boxShadow: '0 2px 8px rgba(150, 102, 59, 0.4)'
            }}>
              {totalCartCount}
            </div>
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: '800' }}>{t('mobileCartBarTitle')}</div>
              <div style={{ fontSize: '0.74rem', color: '#e6b87d' }}>{formatPrice(cartTotal, language)}</div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.86rem', fontWeight: '800', color: '#e6b87d' }}>
            <span>{t('mobileCartBarAction')}</span>
            <ArrowRight size={16} style={{ transform: isRtl ? 'rotate(180deg)' : 'none' }} />
          </div>
        </div>
      )}

      {/* 🌟 AI BARISTA ASSISTANT BOT WIDGET 🌟 */}
      <StoreAiAssistant
        products={products}
        onSelectProduct={handleProductSelectFromAi}
        isOpen={isAiAssistantOpen}
        setIsOpen={setIsAiAssistantOpen}
        hasCart={totalCartCount > 0}
      />

      {/* 📄 Dedicated In-App PDF Reader Modal for Customers 📄 */}
      <PdfReaderModal
        isOpen={!!viewingAcademyPdf}
        onClose={() => setViewingAcademyPdf(null)}
        pdf={viewingAcademyPdf?.pdf}
        title={viewingAcademyPdf?.title}
      />

      {/* 💖 WISHLIST MODAL (المفضلة) 💖 */}
      {isWishlistModalOpen && (
        <div
          className="modal-overlay"
          style={{
            zIndex: 9999,
            background: 'rgba(5, 15, 10, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setIsWishlistModalOpen(false)}
        >
          <div
            className="modal-content"
            style={{
              width: '100%',
              maxWidth: '640px',
              maxHeight: '85vh',
              borderRadius: '20px',
              padding: '24px',
              background: '#FFFDF9',
              border: '1.5px solid #EDD9BD',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(74, 50, 32, 0.25)'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #EDD9BD', paddingBottom: '14px', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  color: '#ef4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Heart size={20} fill="#ef4444" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: '#4A3220' }}>
                    {t('wishlistTitle')} ({wishlist.length})
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: '#8A654C' }}>
                    {t('wishlistSubtitle')}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWishlistModalOpen(false)}
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '50%',
                  background: '#FFF8EE',
                  border: '1px solid #EDD9BD',
                  color: '#4A3220',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Items List */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {wishlist.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#8A654C' }}>
                  <Heart size={44} style={{ color: '#EDD9BD', margin: '0 auto 12px' }} />
                  <h4 style={{ margin: '0 0 6px', fontSize: '1.05rem', color: '#4A3220' }}>{t('wishlistEmptyTitle')}</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem' }}>
                    {t('wishlistEmptyText')}
                  </p>
                </div>
              ) : (
                products.filter(p => wishlist.includes(p.id)).map(prod => (
                  <div
                    key={prod.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      padding: '10px 14px',
                      background: '#FFF8EE',
                      borderRadius: '12px',
                      border: '1px solid #EDD9BD'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                      <img
                        src={resolveProductImage(prod)}
                        alt={prod.name}
                        style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'contain', background: '#F9F6F0', border: '1px solid #EDD9BD' }}
                      />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: '800', fontSize: '0.92rem', color: '#4A3220', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {prod.name}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#96663B', fontWeight: '900', marginTop: '2px' }}>
                          {prod.sellPrice} {t('currency')}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setIsWishlistModalOpen(false);
                          handleOpenProductDetails(prod);
                        }}
                        className="btn btn-primary"
                        style={{ padding: '7px 14px', fontSize: '0.78rem', whiteSpace: 'nowrap', background: 'linear-gradient(135deg, #96663B 0%, #7A5230 100%)', color: '#ffffff', border: 'none', borderRadius: '8px' }}
                      >
                        {t('viewAndAddCart')}
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleWishlist(prod.id)}
                        className="btn btn-outline"
                        style={{ padding: '6px 10px', color: '#dc2626', borderColor: '#fca5a5', background: '#FFFDF9' }}
                        title={t('removeWishlist')}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 📜 STORE LEGAL & POLICIES MODAL (سياسة الاسترجاع والضمان، الخصوصية، والشروط) 📜 */}
      {legalModalType && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(44, 24, 16, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
            animation: 'fadeIn 0.2s ease'
          }}
          onClick={() => setLegalModalType(null)}
        >
          <div
            style={{
              background: '#FFFDF9',
              border: '2px solid #EDD9BD',
              borderRadius: '24px',
              maxWidth: '620px',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
              padding: '32px 28px',
              boxShadow: '0 25px 65px rgba(44, 24, 16, 0.35)',
              position: 'relative'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1.5px solid #EDD9BD', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Shield size={24} color="#96663B" />
                <h3 style={{ fontSize: '1.35rem', fontWeight: '900', color: '#4A3220', margin: 0 }}>
                  {legalModalType === 'returns' && (language === 'en' ? 'Quality Guarantee & Returns Policy' : 'سياسة الاسترجاع والضمان الذهبي')}
                  {legalModalType === 'privacy' && (language === 'en' ? 'Privacy Policy' : 'سياسة الخصوصية وحماية البيانات')}
                  {legalModalType === 'terms' && (language === 'en' ? 'Terms & Conditions' : 'الشروط والأحكام')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setLegalModalType(null)}
                style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#FFF8EE', border: '1px solid #EDD9BD', color: '#4A3220', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ fontSize: '0.98rem', color: '#4A3220', lineHeight: '1.9' }}>
              {legalModalType === 'returns' && (
                <div>
                  <h4 style={{ color: '#96663B', marginBottom: '6px' }}>ضمان الجودة والطزاجة:</h4>
                  <p>في محمصة كاتورا للقهوة المختصة، نضمن لك وصول حبوب بن فاخرة، منتقاة بعناية ومحمصة طازجاً بأعلى معايير الجمعية التخصصية للقهوة (SCA).</p>
                  
                  <h4 style={{ color: '#96663B', marginBottom: '6px', marginTop: '16px' }}>شروط الاسترجاع والاستبدال:</h4>
                  <ul>
                    <li>يحق للعميل طلب استبدال أو استرجاع أي عبوة خلال <strong>14 يوماً</strong> من تاريخ استلام الشحنة في حال وجود تلف أو خطأ في المحصول أو درجة الطحن.</li>
                    <li>يتم استرداد المبلغ بالكامل دون أي رسوم إضافية عبر محفظة فودافون كاش أو حساب إنستاباي في غضون 24-48 ساعة عمل.</li>
                  </ul>
                  
                  <h4 style={{ color: '#96663B', marginBottom: '6px', marginTop: '16px' }}>كيفية طلب الاسترجاع:</h4>
                  <p>تواصل مباشرة مع فريق خدمة العملاء عبر واتساب <strong>01033144498</strong> مع تزويدنا برقم الفاتورة وصورة العبوة لتنفيذ طلبك فوراً.</p>
                </div>
              )}

              {legalModalType === 'privacy' && (
                <div>
                  <h4 style={{ color: '#96663B', marginBottom: '6px' }}>أمان وسرية بياناتك:</h4>
                  <p>نحن نحترم خصوصيتك التامة. نجمع فقط البيانات الأساسية اللازمة لمعالجة وشحن طلبك (الاسم، الهاتف، العنوان، والبريد الإلكتروني).</p>
                  
                  <h4 style={{ color: '#96663B', marginBottom: '6px', marginTop: '16px' }}>عدم مشاركة البيانات:</h4>
                  <p>لا نقوم ببيع، تأجير، أو مشاركة أي بيانات شخصية مع أي جهة خارجية أو أطراف إعلانية على الإطلاق. تُستخدم بياناتك حصرياً لتوصيل طلباتك والتواصل بشأن الشحنة.</p>
                </div>
              )}

              {legalModalType === 'terms' && (
                <div>
                  <h4 style={{ color: '#96663B', marginBottom: '6px' }}>نطاق الخدمة والشحن:</h4>
                  <p>تخدم محمصة كاتورا عملاء التجزئة والشركات والمقاهي (B2B) داخل جمهورية مصر العربية مع شحن سريع لجميع المحافظات خلال 24–48 ساعة عمل.</p>
                  
                  <h4 style={{ color: '#96663B', marginBottom: '6px', marginTop: '16px' }}>الأسعار والدفع:</h4>
                  <p>كافة الأسعار المعروضة بالجنيه المصري (EGP). نوفر الدفع الفوري الآمن عبر إنستاباي، المحافظ الإلكترونية (فودافون كاش)، أو الدفع نقداً عند الاستلام.</p>
                </div>
              )}
            </div>

            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => setLegalModalType(null)}
                style={{ padding: '10px 28px', background: '#96663B', color: '#fff', border: 'none', borderRadius: '12px', fontWeight: '800', cursor: 'pointer' }}
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔝 FLOATING SCROLL TO TOP BUTTON (زر الصعود للأعلى الدائري الفاخر) 🔝 */}
      {showScrollTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="store-scroll-to-top-btn"
          style={{
            position: 'fixed',
            bottom: totalCartCount > 0 ? '76px' : '20px',
            right: '18px',
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #2C1810 0%, #4A3220 100%)',
            color: '#C49A5C',
            border: '1.5px solid #EDD9BD',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 6px 20px rgba(44, 24, 16, 0.3), 0 0 12px rgba(196, 154, 92, 0.25)',
            zIndex: 89,
            transition: 'all 0.25s ease',
            animation: 'fadeIn 0.25s ease'
          }}
          title={t('scrollToTop')}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.borderColor = '#C49A5C';
            e.currentTarget.style.color = '#ffffff';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.borderColor = '#EDD9BD';
            e.currentTarget.style.color = '#C49A5C';
          }}
        >
          <ArrowUp size={20} />
        </button>
      )}

    </div>
  );
};
