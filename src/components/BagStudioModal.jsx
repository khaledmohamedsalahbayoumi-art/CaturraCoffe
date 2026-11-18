import React, { useEffect, useRef, useState } from 'react';
import { X, ExternalLink, Sparkles, CheckCircle2, Maximize2, Minimize2 } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function BagStudioModal({ product, isOpen, onClose, onSaveSuccess }) {
  const { updateProduct } = useApp();
  const iframeRef = useRef(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  useEffect(() => {
    if (!isOpen || !product) return;

    const handleMessage = (event) => {
      // Validate origin or event structure
      if (!event.data || typeof event.data !== 'object') return;

      if (event.data.type === 'CATURRA_STUDIO_READY') {
        // Send the product data into the iframe editor
        if (iframeRef.current && iframeRef.current.contentWindow) {
          iframeRef.current.contentWindow.postMessage({
            type: 'CATURRA_LOAD_PRODUCT',
            product: product
          }, '*');
        }
      }

      if (event.data.type === 'CATURRA_SAVE_BAG_DESIGN') {
        const { frontImage, backImage, customBagDesign, bagVariant, updatedFields } = event.data;
        const targetId = event.data.productId || product.id;

        const crop = customBagDesign?.crop || {};
        const frontDesign = customBagDesign?.front || {};
        const backDesign = customBagDesign?.back || {};
        const recipe = backDesign?.recipe || {};
        const notesStr = Array.isArray(crop.notes) ? crop.notes.join(' / ') : (crop.notes || '');

        const rows = frontDesign.rows || [];
        const findRow = (lbl) => (rows.find(r => r.en === lbl || r.ar === lbl)?.ve || '');
        const varietyVal = crop.variety || findRow('Variety') || updatedFields?.variety || '';
        const altitudeVal = crop.altitude || findRow('Altitude') || updatedFields?.altitude || '';
        const processVal = crop.process || frontDesign.process || findRow('Process') || updatedFields?.process || '';
        const regionVal = crop.region || findRow('Region') || updatedFields?.region || '';
        const farmVal = crop.farm || findRow('Farm') || updatedFields?.farm || '';
        const countryVal = crop.country || frontDesign.country || updatedFields?.country || '';
        const roastVal = crop.roast || frontDesign.roast || findRow('Roast') || updatedFields?.roastLevel || '';

        const updates = {
          image: frontImage,
          backImage: backImage || null,
          customBagDesign: customBagDesign,
          bagVariant: bagVariant || (customBagDesign?.format === 'wide' ? 'landscape' : 'vertical'),
          country: countryVal,
          origin: countryVal,
          region: regionVal,
          farm: farmVal,
          altitude: altitudeVal,
          variety: varietyVal,
          process: processVal,
          flavorNotes: notesStr,
          notes: notesStr,
          roastLevel: roastVal,
          recommendedFor: recipe.brew || recipe.method || (customBagDesign?.format === 'wide' ? 'espresso' : 'v60'),
          espressoRecipe: {
            dose: recipe.dose || '18g',
            yield: recipe.yield || '36g',
            time: recipe.time || '28s',
            temp: recipe.temp || '92°C'
          },
          coffeeOrigin: {
            country: countryVal,
            region: regionVal,
            farm: farmVal,
            altitude: altitudeVal,
            variety: varietyVal,
            process: processVal
          },
          ...(updatedFields || {}),
          lastDesignUpdate: new Date().toISOString()
        };

        // Update product in AppContext (which automatically updates localStorage & syncs to server)
        updateProduct(targetId, updates);

        setSaveSuccessMsg(`تم تطبيق وحفظ تصميم الكيس الجديد للمنتج: "${product.name}" بنجاح! يظهر الآن للعملاء في المتجر ☕✨`);
        setTimeout(() => setSaveSuccessMsg(''), 6000);

        if (onSaveSuccess) {
          onSaveSuccess(targetId, updates);
        }
      }

      if (event.data.type === 'CATURRA_CLOSE_STUDIO') {
        onClose();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isOpen, product, updateProduct, onClose, onSaveSuccess]);

  if (!isOpen || !product) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(26, 16, 12, 0.82)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isFullScreen ? '0' : '14px',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: isFullScreen ? '100vw' : '96vw',
          height: isFullScreen ? '100vh' : '94vh',
          maxWidth: isFullScreen ? '100vw' : '1600px',
          background: '#181512',
          borderRadius: isFullScreen ? '0' : '18px',
          border: isFullScreen ? 'none' : '1.5px solid #4a3424',
          boxShadow: '0 25px 65px rgba(0, 0, 0, 0.6)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '10px 18px',
            background: 'linear-gradient(90deg, #231913, #2d2018)',
            borderBottom: '1.5px solid #3d2b1f',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap'
          }}
        >
          {/* Title & Product Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '1.4rem' }}>🎨</span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '900', color: '#f3e8dc' }}>
                  استوديو تصميم وطباعة أكياس كاتورا · Packaging Studio v6
                </h3>
                <span
                  style={{
                    background: '#2e7d32',
                    color: '#e8f5e9',
                    fontSize: '0.72rem',
                    fontWeight: '800',
                    padding: '2px 8px',
                    borderRadius: '10px'
                  }}
                >
                  مرتبط بالمتجر
                </span>
              </div>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#c4a482' }}>
                أنت الآن تعدل تصميم كيس: <strong style={{ color: '#fff' }}>{product.name}</strong> {product.sku ? `(SKU: ${product.sku})` : ''}
              </p>
            </div>
          </div>

          {/* Toast Notification Banner */}
          {saveSuccessMsg && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: '#14532d',
                color: '#bbf7d0',
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: '700',
                border: '1px solid #22c55e',
                animation: 'bounceIn 0.3s ease'
              }}
            >
              <CheckCircle2 size={16} color="#4ade80" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => window.open(`/label-studio.html?productId=${encodeURIComponent(product.id)}`, '_blank')}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#e2d5c5',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.78rem',
                fontWeight: '700',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px'
              }}
              title="فتح الاستوديو في تبويب جديد مستقل"
            >
              <ExternalLink size={13} />
              <span>فتح في تبويب مستقل</span>
            </button>

            <button
              type="button"
              onClick={() => setIsFullScreen(prev => !prev)}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#e2d5c5',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                padding: '6px 10px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
              title={isFullScreen ? 'تصغير النافذة' : 'تكبير ملء الشاشة'}
            >
              {isFullScreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: '#dc2626',
                color: '#fff',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '0.82rem',
                fontWeight: '800',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="إغلاق الاستوديو"
            >
              <X size={15} />
              <span>إغلاق</span>
            </button>
          </div>
        </div>

        {/* Modal Body / Embedded Editor */}
        <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%', background: '#0e0c0a' }}>
          <iframe
            ref={iframeRef}
            src={`/label-studio.html?productId=${encodeURIComponent(product.id)}&v=6`}
            onLoad={() => {
              if (iframeRef.current && iframeRef.current.contentWindow) {
                iframeRef.current.contentWindow.postMessage({
                  type: 'CATURRA_LOAD_PRODUCT',
                  product: product
                }, '*');
              }
            }}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              display: 'block'
            }}
            title="Caturra Label Editor"
          />
        </div>
      </div>
    </div>
  );
}

