/**
 * Smart Product Image Resolver & Asset Mapping Utility
 * Ensures tools, accessories, and coffee products always display their proper, high-resolution visual assets
 * and prevents spreadsheet/CSV imports from corrupting product images or assigning coffee bags to tools.
 */

export const isToolProduct = (p) => {
  if (!p) return false;
  const cat = String(p.category || '').toLowerCase();
  const subCat = String(p.subCategory || '').toLowerCase();
  const unit = String(p.unitType || '').toLowerCase();
  if (cat === 'tools' || cat === 'accessories' || cat === 'boxes' || cat === 'gifts' || subCat === 'tools' || subCat === 'accessories') {
    return true;
  }
  if (unit === 'piece' && cat !== 'specialty' && cat !== 'classic_blends' && cat !== 'coffee' && cat !== 'fermented' && cat !== 'espresso' && cat !== 'filter') {
    return true;
  }
  return false;
};

export const TOOL_IMAGE_RULES = [
  { match: /ميزان|scale/i, image: '/tools/tool_coffee_scale.png' },
  { match: /غلاية.*كهربائ|electric.*kettle|gooseneck.*electric/i, image: '/tools/tool_gooseneck_electric.png' },
  { match: /غلاية|kettle/i, image: '/tools/tool_kettle_matte_black.png' },
  { match: /فرشاة خشبية|تنظيف المطاحن|cleaning.*brush/i, image: '/tools/tool_cleaning_brush.png' },
  { match: /عنبر|amber/i, image: '/tools/tool_manual_grinder_amber.png' },
  { match: /مطحنة|grinder/i, image: '/tools/tool_coffee_grinder_manual.png' },
  { match: /مكبس.*خشب|tamper.*wood/i, image: '/tools/tool_tamper_wood.png' },
  { match: /مكبس|تامبر|tamper/i, image: '/tools/tool_espresso_tamper.png' },
  { match: /بتشر|pitcher|لاتيه/i, image: '/tools/tool_milk_pitcher.png' },
  { match: /فرنش برس|french press/i, image: '/tools/tool_french_press.png' },
  { match: /بورتافلتر|portafilter/i, image: '/tools/tool_portafilter.png' },
  { match: /نوك بوكس|تفريغ|knock box/i, image: '/tools/tool_knock_box.png' },
  { match: /مقلب|موزع.*wdt|wdt/i, image: '/tools/tool_coffee_stirrer.png' },
  { match: /دوزينج|dosing|حلقة توزيع|فنل/i, image: '/tools/tool_dosing_funnel.png' },
  { match: /برطمان|jar|خيزران/i, image: '/tools/tool_storage_jar.png' },
  { match: /كوب|mug|cup/i, image: '/tools/tool_ceramic_mug.png' },
  { match: /سيرفر|server/i, image: '/tools/tool_glass_server.png' },
  { match: /قمع|dripper/i, image: '/tools/tool_glass_dripper.png' },
  { match: /فلتر|فلاتر|filter/i, image: '/tools/tool_paper_filters.png' },
  { match: /فرشاة|brush/i, image: '/tools/tool_cleaning_brush.png' },
  { match: /سيروب|syrup/i, image: '/caturra_syrup.jpg' },
  { match: /بوكس|box|هدية|gift/i, image: '/caturra_gift_box.jpg' }
];

/**
 * Resolves the proper image URL for any product.
 * If the product is a tool or piece item and has an accidental coffee bag image from a sheet import,
 * it automatically heals and replaces it with the accurate tool photo.
 */
export const resolveProductImage = (p = {}) => {
  const name = String(p.name || '').trim();
  const nameEn = String(p.nameEn || '').trim();
  const text = `${name} ${nameEn}`.toLowerCase();
  const isTool = isToolProduct(p) || /ميزان|غلاية|مطحنة|مكبس|تامبر|بتشر|فرنش برس|بورتافلتر|نوك بوكس|تفريغ|wdt|مقلب|موزع|دوزينج|فنل|فرشاة|برطمان|كوب|سيرفر|قمع|فلتر|scale|kettle|grinder|tamper|pitcher|portafilter|funnel|brush|mug|server|dripper/i.test(text);

  const rawImg = typeof p.image === 'string' ? p.image.trim() : '';

  // Check if image is an accidental coffee bag fallback
  const isCoffeeBagAsset =
    rawImg.includes('bag_') ||
    rawImg.includes('caturra_ethiopia') ||
    rawImg.includes('caturra_colombia') ||
    rawImg.includes('caturra_espresso') ||
    rawImg.includes('caturra_bag') ||
    rawImg.includes('caturra_classic_blend');

  // If product is a tool and has a valid, non-bag custom image (like a data: URL or dedicated tool image), keep it
  if (isTool) {
    if (rawImg && (!isCoffeeBagAsset || rawImg.startsWith('data:image/'))) {
      return rawImg;
    }
    // Match tool by keywords
    for (const rule of TOOL_IMAGE_RULES) {
      if (rule.match.test(text)) {
        return rule.image;
      }
    }
    return '/tools/tool_coffee_scale.png';
  }

  // Coffee Products
  if (rawImg && (!rawImg.includes('caturra_ethiopia') || text.includes('إثيوبيا') || text.includes('ethiopia'))) {
    return rawImg;
  }

  const cat = String(p.category || '').toLowerCase();
  const isClassic = cat === 'classic_blends' || cat === 'coffee' || /كلاسيك|تركي|فرنساوي|توليف/i.test(text);
  if (isClassic) return '/bags/bag_classic_blends.jpg';

  const origin = `${p.origin || ''} ${p.country || ''} ${(p.coffeeOrigin && p.coffeeOrigin.country) || ''}`.toLowerCase();
  if (origin.includes('إثيوبيا') || origin.includes('اثيوبيا') || origin.includes('ethiopia')) return '/caturra_ethiopia.jpg';
  if (origin.includes('كولومبيا') || origin.includes('colombia')) return '/caturra_colombia.jpg';
  if (text.includes('إسبريسو') || text.includes('اسبريسو') || text.includes('espresso')) return '/caturra_espresso.jpg';

  return '/bags/bag_espresso_landscape.jpg';
};

/**
 * Sanitizes a product during import or catalog sync:
 * - Ensures tools never receive a bagVariant (which tricks the system into rendering a coffee bag)
 * - Automatically assigns the right image
 * - Preserves existing custom images
 */
export const sanitizeProductData = (product, existingProduct = null) => {
  if (!product) return null;
  const isTool = isToolProduct(product) || (existingProduct && isToolProduct(existingProduct));

  const name = String(product.name || product.customBagDesign?.front?.nameAr || existingProduct?.name || 'قهوة كاتورا').trim();
  const nameEn = String(product.nameEn || product.customBagDesign?.front?.nameEn || existingProduct?.nameEn || 'Caturra Coffee').trim();

  // Determine image: preserve user custom image, otherwise resolve cleanly
  let image = product.image || existingProduct?.image;
  const isExistingCorrupted = isTool && (
    !image ||
    image.includes('bag_') ||
    image.includes('caturra_ethiopia') ||
    image.includes('caturra_colombia') ||
    image.includes('caturra_espresso') ||
    image.includes('caturra_bag')
  );

  if (!image || isExistingCorrupted) {
    image = resolveProductImage({ ...existingProduct, ...product, name, nameEn, unitType: isTool ? 'piece' : (product.unitType || 'weight') });
  }

  const cat = String(product.category || existingProduct?.category || '').toLowerCase();
  const isClassic = cat === 'classic_blends' || cat === 'coffee';

  return {
    ...existingProduct,
    ...product,
    name,
    nameEn,
    unitType: isTool ? 'piece' : (product.unitType || existingProduct?.unitType || 'weight'),
    // Tools NEVER have bagVariant; Coffee has 'vertical' for classic or 'landscape' for specialty
    bagVariant: isTool ? undefined : (product.bagVariant || existingProduct?.bagVariant || (isClassic ? 'vertical' : 'landscape')),
    image
  };
};
