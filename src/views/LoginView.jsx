import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  LogIn,
  ShieldCheck,
  AlertCircle,
  Store,
  Shield
} from 'lucide-react';

export const LoginView = () => {
  const { login, users, setViewMode } = useApp();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const performLogin = (uName, uPass) => {
    setErrorMessage('');
    setIsLoading(true);

    setTimeout(() => {
      const res = login(uName, uPass);
      if (!res.success) {
        setErrorMessage(res.message || 'بيانات الدخول غير صحيحة');
        setIsLoading(false);
      }
    }, 300);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setErrorMessage('يرجى إدخال اسم المستخدم وكلمة المرور');
      return;
    }
    performLogin(username, password);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at 50% 20%, #063820 0%, #021a10 50%, #010d08 100%)',
        padding: '24px 16px',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'inherit'
      }}
    >
      {/* Decorative ambient lights & coffee rings */}
      <div
        style={{
          position: 'absolute',
          top: '-15%',
          right: '-10%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(34, 203, 124, 0.18) 0%, transparent 70%)',
          filter: 'blur(50px)',
          pointerEvents: 'none'
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-15%',
          left: '-10%',
          width: '550px',
          height: '550px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(217, 119, 6, 0.12) 0%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none'
        }}
      />

      {/* Main Glassmorphic Container */}
      <div
        style={{
          width: '100%',
          maxWidth: '520px',
          background: 'rgba(10, 31, 21, 0.88)',
          backdropFilter: 'blur(20px)',
          borderRadius: '28px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          border: '1px solid rgba(52, 211, 153, 0.25)',
          padding: '38px 32px',
          zIndex: 10,
          position: 'relative',
          color: '#ffffff'
        }}
      >
        {/* Top Floating Badge */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '30px',
              background: 'rgba(34, 203, 124, 0.12)',
              border: '1px solid rgba(34, 203, 124, 0.3)',
              color: '#6ee7b7',
              fontSize: '0.8rem',
              fontWeight: '800',
              marginBottom: '16px'
            }}
          >
            <ShieldCheck size={16} color="#34d399" />
            <span>بوابة الإدارة السحابية الموحدة • ERP & POS</span>
          </div>

          {/* Logo with Ambient Glow */}
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: '14px' }}>
            <div
              style={{
                position: 'absolute',
                inset: '-4px',
                borderRadius: '24px',
                background: 'linear-gradient(135deg, #10b981 0%, #d97706 100%)',
                opacity: 0.6,
                filter: 'blur(8px)'
              }}
            />
            <img
              src="/caturra_logo.jpg"
              alt="Caturra Coffee"
              style={{
                width: '74px',
                height: '74px',
                borderRadius: '20px',
                objectFit: 'cover',
                position: 'relative',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
                background: '#ffffff'
              }}
            />
          </div>

          <h1
            style={{
              fontSize: '1.65rem',
              fontWeight: '900',
              color: '#ffffff',
              margin: '0 0 6px',
              letterSpacing: '-0.3px'
            }}
          >
            كاتورا للقهوة المختصة
          </h1>
          <p
            style={{
              fontSize: '0.86rem',
              color: '#a7f3d0',
              margin: 0,
              fontWeight: '600'
            }}
          >
            Caturra Specialty Coffee Management System
          </p>
        </div>

        {/* Error Alert Banner */}
        {errorMessage && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '14px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1.5px solid rgba(239, 68, 68, 0.4)',
              color: '#fca5a5',
              fontSize: '0.86rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '20px',
              animation: 'shake 0.3s ease'
            }}
          >
            <AlertCircle size={20} style={{ flexShrink: 0, color: '#ef4444' }} />
            <span style={{ fontWeight: '700' }}>{errorMessage}</span>
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Username Input */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.84rem',
                fontWeight: '800',
                color: '#d1fae5',
                marginBottom: '6px'
              }}
            >
              اسم المستخدم أو البريد الإلكتروني
            </label>
            <div style={{ position: 'relative' }}>
              <User
                size={18}
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#6ee7b7'
                }}
              />
              <input
                type="text"
                required
                autoFocus
                placeholder="owner, manager, cashier..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  width: '100%',
                  height: '46px',
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1.5px solid rgba(52, 211, 153, 0.3)',
                  borderRadius: '12px',
                  padding: '0 44px 0 14px',
                  color: '#ffffff',
                  fontSize: '0.92rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => (e.target.style.borderColor = '#10b981')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(52, 211, 153, 0.3)')}
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <div style={{ marginBottom: '6px' }}>
              <label
                style={{
                  fontSize: '0.84rem',
                  fontWeight: '800',
                  color: '#d1fae5',
                  margin: 0
                }}
              >
                كلمة المرور
              </label>
            </div>

            <div style={{ position: 'relative' }}>
              <Lock
                size={18}
                style={{
                  position: 'absolute',
                  right: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#6ee7b7'
                }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  height: '46px',
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1.5px solid rgba(52, 211, 153, 0.3)',
                  borderRadius: '12px',
                  padding: '0 44px',
                  color: '#ffffff',
                  fontSize: '0.92rem',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.2s'
                }}
                onFocus={(e) => (e.target.style.borderColor = '#10b981')}
                onBlur={(e) => (e.target.style.borderColor = 'rgba(52, 211, 153, 0.3)')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px'
                }}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#cbd5e1' }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ accentColor: '#10b981', cursor: 'pointer', width: '16px', height: '16px' }}
              />
              <span>تذكر تسجيل دخولي على هذا الجهاز</span>
            </label>

            <span style={{ color: '#34d399', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Shield size={13} />
              <span>جلسة مؤمنة SSL</span>
            </span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              height: '50px',
              fontSize: '1.02rem',
              fontWeight: '900',
              borderRadius: '14px',
              border: 'none',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              cursor: isLoading ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
              transition: 'all 0.2s ease',
              marginTop: '4px'
            }}
          >
            {isLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '18px',
                    height: '18px',
                    border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#ffffff',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite'
                  }}
                />
                <span>جاري التحقق وتطبيق الصلاحيات...</span>
              </div>
            ) : (
              <>
                <LogIn size={20} />
                <span>دخول لوحة الإدارة ونقاط البيع 🚀</span>
              </>
            )}
          </button>
        </form>

        {/* Bottom Navigation: Return to Client Store */}
        <div style={{ marginTop: '26px', paddingTop: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', textAlign: 'center' }}>
          <a
            href="/"
            onClick={(e) => {
              if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
                e.preventDefault();
                setViewMode('client');
              }
            }}
            style={{
              textDecoration: 'none',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '12px',
              padding: '10px 20px',
              color: '#a7f3d0',
              fontSize: '0.88rem',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
              e.currentTarget.style.color = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
              e.currentTarget.style.color = '#a7f3d0';
            }}
          >
            <Store size={18} color="#34d399" />
            <span>العودة لمتجر العملاء الإلكتروني 🛍️</span>
          </a>
        </div>

        {/* Micro Status Bar */}
        <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '0.74rem', color: '#64748b' }}>
          <span>نظام كاتورا للتحميص والتوزيع v2.4 • مشفر ومحمي بنظام الصلاحيات المتقدم</span>
        </div>
      </div>
    </div>
  );
};
