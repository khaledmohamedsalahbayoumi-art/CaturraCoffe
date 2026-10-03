import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  LogIn,
  ShieldCheck,
  Coffee,
  Sparkles,
  AlertCircle,
  Store,
  CheckCircle2
} from 'lucide-react';

export const LoginView = () => {
  const { login, users, setViewMode } = useApp();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!username.trim() || !password) {
      setErrorMessage('يرجى إدخال اسم المستخدم وكلمة المرور');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const res = login(username, password);
      if (!res.success) {
        setErrorMessage(res.message);
        setIsLoading(false);
      }
    }, 250);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at 10% 20%, var(--mint-100) 0%, #ebf8f1 50%, #d8f3e3 100%)',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Decorative background coffee rings */}
      <div
        style={{
          position: 'absolute',
          top: '-10%',
          right: '-5%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(4, 136, 75, 0.16) 0%, rgba(34, 203, 124, 0.05) 100%)',
          pointerEvents: 'none'
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-12%',
          left: '-8%',
          width: '450px',
          height: '450px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(4, 136, 75, 0.12) 0%, rgba(10, 178, 103, 0.03) 100%)',
          pointerEvents: 'none'
        }}
      />

      {/* Main Login Card */}
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          background: '#ffffff',
          borderRadius: '24px',
          boxShadow: '0 20px 40px -15px rgba(4, 136, 75, 0.22), 0 0 1px rgba(0, 0, 0, 0.1)',
          border: '1.5px solid var(--border-mint)',
          borderTop: '5px solid var(--mint-600)',
          padding: '36px 32px',
          zIndex: 10,
          position: 'relative'
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              display: 'inline-flex',
              padding: '6px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, var(--mint-100) 0%, #ffffff 100%)',
              border: '2px solid var(--mint-300)',
              marginBottom: '14px',
              boxShadow: '0 8px 16px rgba(4, 136, 75, 0.18)'
            }}
          >
            <img
              src="/caturra_logo.jpg"
              alt="Caturra"
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                objectFit: 'cover'
              }}
            />
          </div>

          <h1
            style={{
              fontSize: '1.6rem',
              fontWeight: '900',
              color: 'var(--mint-950)',
              margin: '0 0 6px'
            }}
          >
            كاتورا للقهوة المختصة
          </h1>
          <p
            style={{
              fontSize: '0.88rem',
              color: 'var(--mint-700)',
              fontWeight: '600',
              margin: 0
            }}
          >
            بوابة تسجيل الدخول للنظام الإداري ونقاط البيع (ERP)
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '12px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#dc2626',
              fontSize: '0.85rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '20px'
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Username */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontWeight: '700', color: 'var(--mint-900)' }}>
              اسم المستخدم (Username)
            </label>
            <div style={{ position: 'relative' }}>
              <User
                size={18}
                color="var(--mint-600)"
                style={{ position: 'absolute', right: '14px', top: '13px' }}
              />
              <input
                type="text"
                required
                autoFocus
                placeholder="أدخل اسم المستخدم (مثال: owner, cashier)"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="form-input"
                style={{
                  paddingRight: '42px',
                  height: '46px',
                  borderRadius: '12px',
                  fontSize: '0.95rem'
                }}
              />
            </div>
          </div>

          {/* Password */}
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label" style={{ fontWeight: '700', color: 'var(--mint-900)' }}>
              كلمة المرور (Password)
            </label>
            <div style={{ position: 'relative' }}>
              <Lock
                size={18}
                color="var(--mint-600)"
                style={{ position: 'absolute', right: '14px', top: '13px' }}
              />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="form-input"
                style={{
                  paddingRight: '42px',
                  paddingLeft: '42px',
                  height: '46px',
                  borderRadius: '12px',
                  fontSize: '0.95rem'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '12px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)'
                }}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
            style={{
              height: '48px',
              fontSize: '1rem',
              fontWeight: '800',
              borderRadius: '12px',
              marginTop: '6px',
              boxShadow: '0 8px 18px rgba(4, 136, 75, 0.35)'
            }}
          >
            {isLoading ? (
              <span>جاري التحقق والدخول...</span>
            ) : (
              <>
                <LogIn size={20} />
                <span>دخول النظام وتطبيق الصلاحيات</span>
              </>
            )}
          </button>
        </form>

        {/* Back to Client Store Link */}
        <div style={{ marginTop: '22px', textAlign: 'center' }}>
          <button
            type="button"
            onClick={() => setViewMode('client')}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--mint-700)',
              fontSize: '0.85rem',
              fontWeight: '700',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Store size={16} />
            <span>العودة إلى متجر العملاء الإلكتروني</span>
          </button>
        </div>
      </div>
    </div>
  );
};
