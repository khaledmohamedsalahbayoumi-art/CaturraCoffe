import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { pruneOversizedStorage } from '../utils/safeStorage';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });

    const errMsg = (error?.message || error?.toString() || '');

    // 1. Automatic recovery for stale chunk errors after deployment
    const isChunkError =
      error?.name === 'ChunkLoadError' ||
      /Failed to fetch dynamically imported module/i.test(errMsg) ||
      /dynamically imported module/i.test(errMsg);

    if (isChunkError && typeof window !== 'undefined') {
      const now = Date.now();
      const lastChunkReload = Number(sessionStorage.getItem('last_chunk_reload') || 0);
      if (now - lastChunkReload > 10000) {
        sessionStorage.setItem('last_chunk_reload', String(now));
        window.location.reload();
        return;
      }
    }

    // 2. Automatic recovery for LocalStorage Quota Exceeded errors on mobile devices
    const isQuotaError =
      error?.name === 'QuotaExceededError' ||
      error?.code === 22 ||
      /quota has been exceeded/i.test(errMsg);

    if (isQuotaError && typeof window !== 'undefined') {
      try {
        pruneOversizedStorage();
      } catch (_) {}
      const now = Date.now();
      const lastQuotaReload = Number(sessionStorage.getItem('last_quota_reload') || 0);
      if (now - lastQuotaReload > 10000) {
        sessionStorage.setItem('last_quota_reload', String(now));
        window.location.reload();
        return;
      }
    }
  }

  handleReload = () => {
    try {
      pruneOversizedStorage();
    } catch (_) {}
    window.location.reload();
  };

  handleResetState = () => {
    try {
      localStorage.removeItem('caturra_view_mode');
      sessionStorage.removeItem('caturra_view_mode');
    } catch {
      // ignore
    }
    window.location.href = window.location.pathname;
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#F5E6D0',
            padding: '24px',
            fontFamily: 'inherit',
            direction: 'rtl',
            color: '#4A3220'
          }}
        >
          <div
            style={{
              maxWidth: '520px',
              width: '100%',
              background: '#FFFDF9',
              borderRadius: '24px',
              padding: '36px 28px',
              border: '1.5px solid #EDD9BD',
              boxShadow: '0 25px 50px -12px rgba(74, 50, 32, 0.15)',
              textAlign: 'center'
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.12)',
                border: '2px solid rgba(239, 68, 68, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
                color: '#ef4444'
              }}
            >
              <AlertTriangle size={32} />
            </div>

            <h2 style={{ fontSize: '1.35rem', fontWeight: '900', color: '#dc2626', margin: '0 0 10px' }}>
              حدث خطأ غير متوقع أثناء تحميل الصفحة
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#6B4A2E', margin: '0 0 24px', lineHeight: '1.6' }}>
              تم حفظ كافة بياناتك بأمان. يمكنك إعادة تحميل الصفحة للمتابعة الفورية.
            </p>

            {this.state.error && (
              <div
                style={{
                  background: '#FFF8EE',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  marginBottom: '24px',
                  textAlign: 'left',
                  direction: 'ltr',
                  fontSize: '0.78rem',
                  color: '#b91c1c',
                  overflowX: 'auto',
                  border: '1px solid #EDD9BD',
                  maxHeight: '120px'
                }}
              >
                <code>{this.state.error?.toString()}</code>
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={this.handleReload}
                style={{
                  background: 'linear-gradient(135deg, #96663B 0%, #7A5230 100%)',
                  color: '#FFFDF9',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  fontSize: '0.92rem',
                  fontWeight: '800',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 6px 16px rgba(150, 102, 59, 0.25)'
                }}
              >
                <RefreshCw size={16} />
                <span>إعادة تحميل الصفحة</span>
              </button>

              <button
                onClick={this.handleResetState}
                style={{
                  background: '#FFF8EE',
                  color: '#4A3220',
                  border: '1.5px solid #EDD9BD',
                  borderRadius: '12px',
                  padding: '12px 20px',
                  fontSize: '0.92rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Home size={16} />
                <span>العودة للرئيسية</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
