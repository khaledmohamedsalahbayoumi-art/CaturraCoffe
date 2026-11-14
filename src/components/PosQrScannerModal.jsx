import React, { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';
import {
  QrCode,
  X,
  Camera,
  RefreshCw,
  Zap,
  ZapOff,
  CheckCircle,
  AlertCircle,
  Upload,
  Volume2,
  VolumeX,
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';

/**
 * Plays a clean, instant cashier POS beep using the Web Audio API.
 */
export const playScanBeep = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1100, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1550, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.25, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch (e) {
    // AudioContext permission or unsupported
  }
};

/**
 * Resolves a product from any scanned QR text, URL, SKU, or Barcode.
 */
export const findProductByScannedCode = (scannedCode, products = []) => {
  if (!scannedCode || !products || !products.length) return null;
  const clean = String(scannedCode).trim();

  // 1. Exact match on ID, Barcode, or SKU
  let match = products.find(p => 
    String(p.id).toLowerCase() === clean.toLowerCase() ||
    String(p.barcode || '') === clean ||
    String(p.sku || '').toLowerCase() === clean.toLowerCase()
  );
  if (match) return match;

  // 2. URL parsing (e.g. ?product=prod-1 or ?prod=CAT-ETH-01)
  try {
    if (clean.includes('?') || clean.includes('http')) {
      const url = new URL(clean.startsWith('http') ? clean : `http://dummy.com/${clean}`);
      const paramVal = url.searchParams.get('product') || url.searchParams.get('prod') || url.searchParams.get('p');
      if (paramVal) {
        match = products.find(p => 
          String(p.id).toLowerCase() === paramVal.toLowerCase() ||
          String(p.sku || '').toLowerCase() === paramVal.toLowerCase() ||
          String(p.barcode || '') === paramVal
        );
        if (match) return match;
      }
    }
  } catch (e) {
    // Ignore URL parse error
  }

  // 3. SKU pattern extract (e.g., CAT-ETH-01)
  const skuMatch = clean.match(/CAT-[A-Za-z0-9-]+/i);
  if (skuMatch) {
    const extractedSku = skuMatch[0].toUpperCase();
    match = products.find(p => String(p.sku || '').toUpperCase() === extractedSku);
    if (match) return match;
  }

  // 4. Barcode numeric extract (8 to 14 digits)
  const numMatch = clean.match(/\b\d{8,14}\b/);
  if (numMatch) {
    const extractedBarcode = numMatch[0];
    match = products.find(p => String(p.barcode || '') === extractedBarcode);
    if (match) return match;
  }

  return null;
};

export const PosQrScannerModal = ({
  isOpen,
  onClose,
  products = [],
  onProductScanned, // Callback when a product is matched
  onGenericCodeScanned // Fallback callback when non-product code is scanned
}) => {
  const [cameraError, setCameraError] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' (back) | 'user' (front)
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [continuousScan, setContinuousScan] = useState(true); // default true for cashier convenience
  const [manualCode, setManualCode] = useState('');
  const [lastScannedResult, setLastScannedResult] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const scanLoopRef = useRef(null);
  const lastScannedTimeRef = useRef(0);
  const lastScannedContentRef = useRef('');

  // Stop camera media stream
  const stopCamera = useCallback(() => {
    if (scanLoopRef.current) {
      cancelAnimationFrame(scanLoopRef.current);
      scanLoopRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch (e) {}
      });
      streamRef.current = null;
    }
    setIsCameraActive(false);
    setIsTorchOn(false);
  }, []);

  // Handle successful decode of QR or Barcode
  const handleDecodedContent = useCallback((codeText) => {
    if (!codeText) return;
    const now = Date.now();

    // Prevent duplicate rapid scans of the same code within 2 seconds
    if (codeText === lastScannedContentRef.current && (now - lastScannedTimeRef.current) < 2200) {
      return;
    }

    lastScannedTimeRef.current = now;
    lastScannedContentRef.current = codeText;

    if (soundEnabled) {
      playScanBeep();
    }
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate([80]);
      } catch (e) {}
    }

    const matchedProd = findProductByScannedCode(codeText, products);

    if (matchedProd) {
      setLastScannedResult({
        success: true,
        product: matchedProd,
        rawCode: codeText,
        time: new Date().toLocaleTimeString('ar-EG-u-nu-latn')
      });
      setScanHistory(prev => [
        { product: matchedProd, time: new Date().toLocaleTimeString('ar-EG-u-nu-latn'), id: Date.now() },
        ...prev.slice(0, 7)
      ]);

      if (onProductScanned) {
        onProductScanned(matchedProd, codeText);
      }

      if (!continuousScan) {
        stopCamera();
        onClose();
      }
    } else {
      setLastScannedResult({
        success: false,
        rawCode: codeText,
        time: new Date().toLocaleTimeString('ar-EG-u-nu-latn')
      });
      if (onGenericCodeScanned) {
        onGenericCodeScanned(codeText);
      }
    }
  }, [products, soundEnabled, continuousScan, onProductScanned, onGenericCodeScanned, stopCamera, onClose]);

  // Frame processing loop with native BarcodeDetector + jsQR fallback
  const startScanningLoop = useCallback(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    let nativeDetector = null;
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        nativeDetector = new window.BarcodeDetector({
          formats: ['qr_code', 'ean_13', 'code_128', 'ean_8', 'upc_a']
        });
      } catch (e) {
        nativeDetector = null;
      }
    }

    let frameCount = 0;

    const tick = async () => {
      const video = videoRef.current;
      if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
        scanLoopRef.current = requestAnimationFrame(tick);
        return;
      }

      frameCount++;
      // Process every 2nd frame to keep CPU cool and smooth at ~30 FPS
      if (frameCount % 2 === 0) {
        let detected = false;

        // Try fast native BarcodeDetector first
        if (nativeDetector) {
          try {
            const barcodes = await nativeDetector.detect(video);
            if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
              detected = true;
              handleDecodedContent(barcodes[0].rawValue);
            }
          } catch (err) {
            // Native detector failure, ignore and fallback to jsQR
          }
        }

        // Fallback to jsQR
        if (!detected && ctx) {
          const w = video.videoWidth;
          const h = video.videoHeight;
          if (w > 0 && h > 0) {
            if (canvas.width !== w || canvas.height !== h) {
              canvas.width = w;
              canvas.height = h;
            }
            ctx.drawImage(video, 0, 0, w, h);
            try {
              const imageData = ctx.getImageData(0, 0, w, h);
              const qr = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: 'dontInvert'
              });
              if (qr && qr.data) {
                handleDecodedContent(qr.data);
              }
            } catch (e) {
              // Canvas security or context error
            }
          }
        }
      }

      scanLoopRef.current = requestAnimationFrame(tick);
    };

    scanLoopRef.current = requestAnimationFrame(tick);
  }, [handleDecodedContent]);

  // Start Camera Stream
  const startCamera = useCallback(async () => {
    setCameraError('');
    stopCamera();

    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        setCameraError('المتصفح أو الجهاز الحالي لا يدعم الوصول للكاميرا مباشرة.');
        return;
      }

      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      // Check if torch/flashlight is supported
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        const capabilities = videoTrack.getCapabilities ? videoTrack.getCapabilities() : {};
        if (capabilities.torch) {
          setHasTorch(true);
        } else {
          setHasTorch(false);
        }
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsCameraActive(true);
        startScanningLoop();
      }
    } catch (err) {
      console.error('Camera access error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('تم رفض إذن الوصول للكاميرا. يرجى تفعيل إذن الكاميرا في المتصفح.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('لم يتم العثور على كاميرا متصلة بالجهاز.');
      } else {
        setCameraError('تعذر فتح الكاميرا: ' + (err.message || 'خطأ غير معروف'));
      }
      setIsCameraActive(false);
    }
  }, [facingMode, stopCamera, startScanningLoop]);

  // Toggle Torch
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && hasTorch) {
      try {
        const nextState = !isTorchOn;
        await track.applyConstraints({
          advanced: [{ torch: nextState }]
        });
        setIsTorchOn(nextState);
      } catch (e) {
        console.warn('Torch constraint error:', e);
      }
    }
  };

  // Flip Camera (Front / Rear)
  const handleFlipCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  // Handle Image File Upload containing QR Code
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, img.width, img.height);
        const qr = jsQR(imageData.data, imageData.width, imageData.height);
        if (qr && qr.data) {
          handleDecodedContent(qr.data);
        } else {
          alert('لم يتم العثور على رمز QR واضح في الصورة المرفوعة.');
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Manual code submit
  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleDecodedContent(manualCode.trim());
    setManualCode('');
  };

  // Lifecycle when open/close
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setLastScannedResult(null);
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={() => {
        stopCamera();
        onClose();
      }}
      style={{
        zIndex: 110,
        backgroundColor: 'rgba(5, 18, 12, 0.88)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px'
      }}
    >
      <div
        className="modal-content pos-qr-scanner-modal"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '540px',
          maxHeight: '94vh',
          overflowY: 'auto',
          backgroundColor: '#0a1a12',
          border: '1.5px solid rgba(16, 185, 129, 0.35)',
          borderRadius: '24px',
          color: '#ffffff',
          padding: '0',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(16, 185, 129, 0.15)',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Top Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            background: 'linear-gradient(135deg, rgba(6, 46, 29, 0.9) 0%, rgba(2, 24, 15, 0.9) 100%)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.2)',
                border: '1px solid rgba(52, 211, 153, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6ee7b7'
              }}
            >
              <QrCode size={22} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '900', color: '#ffffff' }}>
                قارئ الـ QR والباركود الذكي (POS)
              </h3>
              <p style={{ margin: 0, fontSize: '0.72rem', color: '#94a3b8' }}>
                امسح كود المنتج لإضافته فوراً للسلة
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="btn-icon"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '50%',
              width: '34px',
              height: '34px',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Scanner Viewfinder Box */}
        <div style={{ padding: '16px 20px 10px' }}>
          
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '290px',
              backgroundColor: '#000000',
              borderRadius: '18px',
              overflow: 'hidden',
              border: '2px solid rgba(52, 211, 153, 0.4)',
              boxShadow: 'inset 0 0 30px rgba(0, 0, 0, 0.8), 0 8px 24px rgba(0,0,0,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {/* The Live Video Element */}
            <video
              ref={videoRef}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
            />

            {/* Viewfinder Target Frame with Glowing Laser */}
            {isCameraActive && (
              <div
                style={{
                  position: 'absolute',
                  width: '210px',
                  height: '210px',
                  pointerEvents: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {/* 4 Corner Markers */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: '26px', height: '26px', borderTop: '4px solid #34d399', borderLeft: '4px solid #34d399', borderRadius: '4px 0 0 0' }} />
                <div style={{ position: 'absolute', top: 0, right: 0, width: '26px', height: '26px', borderTop: '4px solid #34d399', borderRight: '4px solid #34d399', borderRadius: '0 4px 0 0' }} />
                <div style={{ position: 'absolute', bottom: 0, left: 0, width: '26px', height: '26px', borderBottom: '4px solid #34d399', borderLeft: '4px solid #34d399', borderRadius: '0 0 0 4px' }} />
                <div style={{ position: 'absolute', bottom: 0, right: 0, width: '26px', height: '26px', borderBottom: '4px solid #34d399', borderRight: '4px solid #34d399', borderRadius: '0 0 4px 0' }} />

                {/* Animated Red Scanning Laser Line */}
                <div
                  className="scanner-laser-line"
                  style={{
                    position: 'absolute',
                    left: '8px',
                    right: '8px',
                    height: '2.5px',
                    background: 'linear-gradient(90deg, transparent 0%, #10b981 50%, transparent 100%)',
                    boxShadow: '0 0 12px #34d399, 0 0 4px #86efac',
                    animation: 'scannerLaserMove 2s infinite ease-in-out'
                  }}
                />

                <span
                  style={{
                    position: 'absolute',
                    bottom: '8px',
                    fontSize: '0.66rem',
                    color: '#6ee7b7',
                    background: 'rgba(0, 0, 0, 0.65)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: '700'
                  }}
                >
                  وجّه الكود هنا
                </span>
              </div>
            )}

            {/* Camera Error Message Overlay */}
            {cameraError && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(15, 23, 42, 0.94)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '20px',
                  textAlign: 'center',
                  color: '#ffffff',
                  gap: '12px'
                }}
              >
                <AlertCircle size={40} color="#f87171" />
                <p style={{ margin: 0, fontSize: '0.84rem', color: '#fca5a5', maxWidth: '320px', lineHeight: '1.5' }}>
                  {cameraError}
                </p>
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={startCamera}
                    className="btn"
                    style={{
                      background: 'var(--mint-600)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '6px 14px',
                      borderRadius: '8px',
                      fontSize: '0.78rem',
                      fontWeight: '800',
                      cursor: 'pointer'
                    }}
                  >
                    إعادة المحاولة 🔄
                  </button>
                </div>
              </div>
            )}

            {/* On-Camera Quick Action Overlay Bar */}
            <div
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                left: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                pointerEvents: 'auto'
              }}
            >
              <div
                style={{
                  background: isCameraActive ? 'rgba(6, 95, 70, 0.85)' : 'rgba(239, 68, 68, 0.85)',
                  padding: '3px 10px',
                  borderRadius: '20px',
                  fontSize: '0.68rem',
                  fontWeight: '800',
                  color: '#ffffff',
                  backdropFilter: 'blur(4px)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <span
                  style={{
                    width: '7px',
                    height: '7px',
                    borderRadius: '50%',
                    background: isCameraActive ? '#4ade80' : '#f87171',
                    display: 'inline-block'
                  }}
                />
                <span>{isCameraActive ? 'الكاميرا نشطة' : 'متوقفة'}</span>
              </div>

              <div style={{ display: 'flex', gap: '6px' }}>
                {hasTorch && (
                  <button
                    type="button"
                    onClick={toggleTorch}
                    style={{
                      background: isTorchOn ? '#f59e0b' : 'rgba(0,0,0,0.6)',
                      color: '#ffffff',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '8px',
                      padding: '5px 8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="تشغيل الفلاش"
                  >
                    {isTorchOn ? <Zap size={15} /> : <ZapOff size={15} />}
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleFlipCamera}
                  style={{
                    background: 'rgba(0,0,0,0.6)',
                    color: '#ffffff',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    padding: '5px 8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  title="تبديل الكاميرا (أمامية / خلفية)"
                >
                  <RefreshCw size={15} />
                </button>
              </div>
            </div>

          </div>

          {/* Controls Strip (Sound toggle, Continuous mode, Image Upload) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              marginTop: '12px',
              padding: '8px 12px',
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}
          >
            {/* Continuous Scan Toggle */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                fontSize: '0.74rem',
                fontWeight: '700',
                color: continuousScan ? '#86efac' : '#94a3b8'
              }}
              title="يبقي النافذة مفتوحة لتمرير عدة أصناف متتالية بسرعة"
            >
              <input
                type="checkbox"
                checked={continuousScan}
                onChange={(e) => setContinuousScan(e.target.checked)}
                style={{ accentColor: '#10b981', cursor: 'pointer' }}
              />
              <span>المسح السريع المتتابع ⚡</span>
            </label>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Sound Beep Toggle */}
              <button
                type="button"
                onClick={() => setSoundEnabled(prev => !prev)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: soundEnabled ? '#6ee7b7' : '#64748b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.72rem',
                  fontWeight: '700'
                }}
                title={soundEnabled ? 'صوت المسح مفعل' : 'صوت المسح مكتوم'}
              >
                {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                <span>{soundEnabled ? 'صوت Beep' : 'مكتوم'}</span>
              </button>

              {/* Upload QR Image File */}
              <label
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  color: '#e2e8f0',
                  padding: '4px 9px',
                  borderRadius: '8px',
                  fontSize: '0.72rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="مسح من ملف صورة مخزنة بالجهاز"
              >
                <Upload size={13} />
                <span>رفع صورة كود</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>

          {/* Last Scanned Result Banner */}
          {lastScannedResult && (
            <div
              style={{
                marginTop: '10px',
                padding: '10px 14px',
                borderRadius: '12px',
                background: lastScannedResult.success
                  ? 'linear-gradient(135deg, rgba(6, 78, 59, 0.8) 0%, rgba(4, 47, 31, 0.9) 100%)'
                  : 'rgba(153, 27, 27, 0.4)',
                border: lastScannedResult.success ? '1.5px solid #10b981' : '1px solid #ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                animation: 'scaleIn 180ms ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {lastScannedResult.success ? (
                  <CheckCircle size={22} color="#34d399" />
                ) : (
                  <AlertCircle size={22} color="#f87171" />
                )}
                <div>
                  {lastScannedResult.success ? (
                    <>
                      <div style={{ fontSize: '0.86rem', fontWeight: '900', color: '#ffffff' }}>
                        تمت الإضافة: {lastScannedResult.product.name}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#a7f3d0' }}>
                        الكود: {lastScannedResult.product.sku || lastScannedResult.product.id} • {lastScannedResult.product.sellingPrice} ج.م
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ fontSize: '0.82rem', fontWeight: '800', color: '#fca5a5' }}>
                        لم يتم العثور على صنف مطابق لهذا الكود
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                        {lastScannedResult.rawCode.slice(0, 32)}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <span style={{ fontSize: '0.68rem', color: '#cbd5e1' }}>
                {lastScannedResult.time}
              </span>
            </div>
          )}

          {/* Recent Scans Strip in Continuous Mode */}
          {scanHistory.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <div style={{ fontSize: '0.72rem', fontWeight: '800', color: '#6ee7b7', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Layers size={13} />
                <span>سجل الأصناف الممسوحة في هذه الجلسة ({scanHistory.length}):</span>
              </div>
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                {scanHistory.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      background: 'rgba(255, 255, 255, 0.06)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
                      borderRadius: '8px',
                      padding: '4px 8px',
                      fontSize: '0.7rem',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}
                  >
                    <span style={{ color: '#ffffff', fontWeight: '700' }}>{item.product.name}</span>
                    <span style={{ color: '#34d399', fontWeight: '800' }}>{item.product.sellingPrice}ج.م</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Manual Input Fallback */}
          <form
            onSubmit={handleManualSubmit}
            style={{
              marginTop: '12px',
              display: 'flex',
              gap: '8px'
            }}
          >
            <input
              type="text"
              placeholder="أو أدخل كود الصنف / الباركود يدوياً..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="form-input"
              style={{
                flex: 1,
                height: '38px',
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#ffffff',
                borderRadius: '10px',
                fontSize: '0.82rem',
                padding: '0 12px'
              }}
            />
            <button
              type="submit"
              className="btn btn-primary"
              style={{
                height: '38px',
                padding: '0 14px',
                borderRadius: '10px',
                fontSize: '0.78rem',
                fontWeight: '800',
                background: 'var(--mint-600)',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              بحث وإضافة
            </button>
          </form>

        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(0, 0, 0, 0.25)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 'auto'
          }}
        >
          <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
            💡 يدعم أيضاً أجهزة قارئ الباركود اليدوية (Scanner Guns) تلقائياً
          </div>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="btn btn-outline"
            style={{
              padding: '6px 14px',
              fontSize: '0.78rem',
              color: '#ffffff',
              borderColor: 'rgba(255,255,255,0.2)',
              borderRadius: '8px'
            }}
          >
            إغلاق
          </button>
        </div>

      </div>

      <style>{`
        @keyframes scannerLaserMove {
          0% { top: 10px; opacity: 0.9; }
          50% { top: 190px; opacity: 1; }
          100% { top: 10px; opacity: 0.9; }
        }
      `}</style>
    </div>
  );
};
