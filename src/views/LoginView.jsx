import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  LogIn,
  AlertCircle,
  Store,
  Phone,
  ShieldCheck,
  UserPlus,
  Globe
} from 'lucide-react';
import { toLatinDigits } from '../utils/numberEnforcer';

export const LoginView = () => {
  const {
    login,
    setViewMode,
    users = [],
    addUser,
    language,
    toggleLanguage,
    isRtl,
    loginPreselectedUsername,
    setLoginPreselectedUsername
  } = useApp();

  const isFirstSetup = (!users || users.length === 0);

  const passwordInputRef = useRef(null);

  // Regular Login state
  const [username, setUsername] = useState(() => loginPreselectedUsername || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Synchronize and auto-focus password when user is selected from dropdown
  useEffect(() => {
    if (loginPreselectedUsername) {
      setUsername(loginPreselectedUsername);
      setPassword('');
      setErrorMessage('');
      const timer = setTimeout(() => {
        if (passwordInputRef.current) {
          passwordInputRef.current.focus();
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [loginPreselectedUsername]);

  const preselectedUser = users.find(u =>
    (u.username && u.username.toLowerCase() === String(username || '').toLowerCase()) ||
    (u.email && u.email.toLowerCase() === String(username || '').toLowerCase())
  );

  // Initial Setup state (when 0 users exist)
  const [setupFullName, setSetupFullName] = useState('');
  const [setupUsername, setSetupUsername] = useState('');
  const [setupPhone, setSetupPhone] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [setupConfirmPassword, setSetupConfirmPassword] = useState('');
  const [showSetupPassword, setShowSetupPassword] = useState(false);

  // Brute-force protection state
  const [failedAttempts, setFailedAttempts] = useState(() => {
    try {
      return Number(localStorage.getItem('caturra_login_fails') || 0);
    } catch {
      return 0;
    }
  });
  const [lockoutUntil, setLockoutUntil] = useState(() => {
    try {
      return Number(localStorage.getItem('caturra_login_lockout') || 0);
    } catch {
      return 0;
    }
  });

  const isLockedOut = lockoutUntil > Date.now();
  const remainingLockoutMinutes = Math.max(1, Math.ceil((lockoutUntil - Date.now()) / (1000 * 60)));

  const performLogin = (uName, uPass) => {
    if (isLockedOut) {
      setErrorMessage(`تم قفل محاولات الدخول مؤقتاً لحماية الحساب بعد تكرار المحاولات الخاطئة. يرجى الانتظار (${remainingLockoutMinutes} دقائق) والمحاولة مجدداً.`);
      return;
    }

    setErrorMessage('');
    setIsLoading(true);

    const cleanU = toLatinDigits(String(uName || '').trim());
    const cleanP = toLatinDigits(String(uPass || '').trim());

    setTimeout(() => {
      const res = login(cleanU, cleanP);
      if (!res.success) {
        const nextFails = failedAttempts + 1;
        setFailedAttempts(nextFails);
        try {
          localStorage.setItem('caturra_login_fails', String(nextFails));
        } catch {}

        if (nextFails >= 5) {
          const lockTime = Date.now() + 3 * 60 * 1000; // 3 minutes lock
          setLockoutUntil(lockTime);
          try {
            localStorage.setItem('caturra_login_lockout', String(lockTime));
          } catch {}
          setErrorMessage('تم قفل تسجيل الدخول مؤقتاً لمدة 3 دقائق بعد 5 محاولات خاطئة لحماية النظام من هجمات التخمين.');
        } else {
          setErrorMessage((res.message || 'بيانات الدخول غير صحيحة.') + ` (المحاولة ${nextFails} من 5)`);
        }
        setIsLoading(false);
      } else {
        try {
          localStorage.removeItem('caturra_login_fails');
          localStorage.removeItem('caturra_login_lockout');
        } catch {}
      }
    }, 250);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isLockedOut) {
      setErrorMessage(`تم قفل محاولات الدخول مؤقتاً. يرجى الانتظار (${remainingLockoutMinutes} دقائق) والمحاولة مجدداً.`);
      return;
    }
    if (!username.trim() || !password) {
      setErrorMessage('يرجى إدخال اسم المستخدم وكلمة المرور');
      return;
    }
    performLogin(username, password);
  };

  const handleSetupSubmit = (e) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanUser = toLatinDigits(String(setupUsername || '').trim());
    const cleanPass = toLatinDigits(String(setupPassword || '').trim());
    const cleanConfirm = toLatinDigits(String(setupConfirmPassword || '').trim());

    if (!cleanUser) {
      setErrorMessage('يرجى تحديد اسم مستخدم لحساب الإدارة الأول');
      return;
    }

    if (!cleanPass || cleanPass.length < 4) {
      setErrorMessage('يرجى إدخال كلمة مرور مكونة من 4 خانات على الأقل');
      return;
    }

    if (cleanPass !== cleanConfirm) {
      setErrorMessage('كلمة المرور وتأكيد كلمة المرور غير متطابقين!');
      return;
    }

    setIsLoading(true);

    try {
      addUser({
        fullName: setupFullName.trim() || 'المالك والمشرف العام',
        username: cleanUser,
        phone: toLatinDigits(String(setupPhone || '').trim()),
        password: cleanPass,
        isOwner: true,
        role: 'owner'
      });

      setTimeout(() => {
        const res = login(cleanUser, cleanPass);
        if (!res.success) {
          setErrorMessage(res.message || 'حدث خطأ أثناء تفعيل الجلسة، يرجى تسجيل الدخول.');
        }
        setIsLoading(false);
      }, 300);
    } catch {
      setErrorMessage('حدث خطأ أثناء إنشاء الحساب، يرجى المحاولة ثانية.');
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at 50% 15%, #FAF7F2 0%, #F5E6D0 55%, #EBD5BC 100%)',
        padding: '32px 16px',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'inherit'
      }}
    >
      {/* Decorative ambient coffee glows */}
      <div
        style={{
          position: 'absolute',
          top: '-15%',
          right: '-10%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(196, 154, 92, 0.22) 0%, transparent 70%)',
          filter: 'blur(60px)',
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
          background: 'radial-gradient(circle, rgba(150, 102, 59, 0.16) 0%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none'
        }}
      />

      {/* Main Glassmorphic Container (Warm Cream & Signature Coffee Theme) */}
      <div
        style={{
          width: '100%',
          maxWidth: isFirstSetup ? '520px' : '490px',
          background: '#FFFDF9',
          borderRadius: '24px',
          boxShadow: '0 25px 50px -12px rgba(45, 24, 16, 0.14), 0 8px 24px rgba(111, 78, 55, 0.08)',
          border: '1.5px solid #EDD9BD',
          padding: '36px 30px',
          zIndex: 10,
          position: 'relative',
          color: '#2D1810'
        }}
      >
        {/* Language Switcher in Login View Top Corner */}
        <button
          type="button"
          onClick={toggleLanguage}
          style={{
            position: 'absolute',
            top: '20px',
            left: isRtl ? '20px' : 'auto',
            right: !isRtl ? '20px' : 'auto',
            background: '#FAF7F2',
            border: '1.5px solid #EDD9BD',
            color: '#6F4E37',
            borderRadius: '9999px',
            padding: '5px 12px',
            fontSize: '0.78rem',
            fontWeight: '800',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            transition: 'all 0.2s ease',
            zIndex: 20
          }}
          title={language === 'ar' ? 'Switch to English 🇬🇧' : 'التحويل إلى العربية 🇪🇬'}
        >
          <Globe size={14} color="#8B5E34" />
          <span>{language === 'ar' ? 'EN' : 'عربي'}</span>
        </button>

        {/* Header with Centered Logo */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          {/* Centered Logo with Ambient Glow */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ position: 'relative', display: 'inline-flex' }}>
              <div
                style={{
                  position: 'absolute',
                  inset: '-6px',
                  borderRadius: '26px',
                  background: 'linear-gradient(135deg, rgba(196, 154, 92, 0.35) 0%, rgba(150, 102, 59, 0.2) 100%)',
                  filter: 'blur(8px)'
                }}
              />
              <img
                src="/caturra_logo.jpg"
                alt="Caturra Coffee"
                style={{
                  width: '84px',
                  height: '84px',
                  borderRadius: '22px',
                  objectFit: 'cover',
                  position: 'relative',
                  border: '2px solid #EDD9BD',
                  boxShadow: '0 8px 20px rgba(45, 24, 16, 0.12)',
                  background: '#ffffff'
                }}
              />
            </div>
          </div>

          <h1
            style={{
              fontSize: '1.65rem',
              fontWeight: '900',
              color: '#2D1810',
              margin: '0 0 6px',
              letterSpacing: '-0.3px'
            }}
          >
            {language === 'en' ? 'Caturra Specialty Coffee' : 'كاتورا للقهوة المختصة'}
          </h1>

          {isFirstSetup ? (
            <div style={{ marginTop: '10px' }}>
              <span style={{
                background: '#FEF3C7',
                border: '1px solid #FCD34D',
                color: '#92400E',
                padding: '4px 12px',
                borderRadius: '20px',
                fontSize: '0.8rem',
                fontWeight: '800',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <ShieldCheck size={14} />
                <span>تأسيس حساب المالك الأول • تشفير Salted SHA-256</span>
              </span>
              <p style={{
                fontSize: '0.82rem',
                color: '#6F4E37',
                margin: '8px 0 0',
                fontWeight: '600',
                lineHeight: 1.5
              }}>
                لا توجد حسابات مسجلة حالياً. يرجى إنشاء حساب المالك لتفعيل المنظومة والبدء.
              </p>
            </div>
          ) : (
            <p
              style={{
                fontSize: '0.88rem',
                color: '#6F4E37',
                margin: 0,
                fontWeight: '700',
                lineHeight: 1.5
              }}
            >
              {language === 'en' ? 'ERP, Inventory & Cloud Point of Sale (POS)' : 'تسجيل دخول الإدارة، المخازن، ونقاط البيع السحابية'}
            </p>
          )}
        </div>

        {/* Credentials Form */}
        <div>
          {/* Error Alert Banner */}
          {errorMessage && (
            <div
              style={{
                padding: '12px 16px',
                borderRadius: '14px',
                background: '#FEF2F2',
                border: '1.5px solid #FECACA',
                color: '#DC2626',
                fontSize: '0.86rem',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '20px'
              }}
            >
              <AlertCircle size={20} style={{ flexShrink: 0, color: '#dc2626' }} />
              <span style={{ fontWeight: '700' }}>{errorMessage}</span>
            </div>
          )}

          {isFirstSetup ? (
            /* Setup Wizard for First Owner */
            <form onSubmit={handleSetupSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Full Name */}
              <div>
                <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '800', color: '#2D1810', marginBottom: '6px' }}>
                  الاسم الكامل للمالك
                </label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: '#8B5E34' }} />
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="مثال: خالد (المالك)"
                    value={setupFullName}
                    onChange={(e) => setSetupFullName(e.target.value)}
                    style={{
                      width: '100%',
                      height: '44px',
                      background: '#FAF7F2',
                      border: '1.5px solid #D6C7B8',
                      borderRadius: '12px',
                      padding: '0 44px 0 14px',
                      color: '#2D1810',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#8B5E34';
                      e.target.style.boxShadow = '0 0 0 3px rgba(139, 94, 52, 0.15)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#D6C7B8';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>

              {/* Username & Phone Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '800', color: '#2D1810', marginBottom: '6px' }}>
                    اسم الدخول (Username) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="khaled أو caturra"
                    value={setupUsername}
                    onChange={(e) => setSetupUsername(e.target.value)}
                    style={{
                      width: '100%',
                      height: '44px',
                      background: '#FAF7F2',
                      border: '1.5px solid #D6C7B8',
                      borderRadius: '12px',
                      padding: '0 12px',
                      color: '#2D1810',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#8B5E34';
                      e.target.style.boxShadow = '0 0 0 3px rgba(139, 94, 52, 0.15)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#D6C7B8';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '800', color: '#2D1810', marginBottom: '6px' }}>
                    رقم الهاتف
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#8B5E34' }} />
                    <input
                      type="tel"
                      placeholder="01XXXXXXXXX"
                      value={setupPhone}
                      onChange={(e) => setSetupPhone(e.target.value)}
                      style={{
                        width: '100%',
                        height: '44px',
                        background: '#FAF7F2',
                        border: '1.5px solid #D6C7B8',
                        borderRadius: '12px',
                        padding: '0 38px 0 12px',
                        color: '#2D1810',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#8B5E34';
                        e.target.style.boxShadow = '0 0 0 3px rgba(139, 94, 52, 0.15)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#D6C7B8';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Password & Confirm Password Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '800', color: '#2D1810', marginBottom: '6px' }}>
                    كلمة المرور *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#8B5E34' }} />
                    <input
                      type={showSetupPassword ? 'text' : 'password'}
                      required
                      placeholder="4 خانات فأكثر"
                      value={setupPassword}
                      onChange={(e) => setSetupPassword(e.target.value)}
                      style={{
                        width: '100%',
                        height: '44px',
                        background: '#FAF7F2',
                        border: '1.5px solid #D6C7B8',
                        borderRadius: '12px',
                        padding: '0 38px',
                        color: '#2D1810',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#8B5E34';
                        e.target.style.boxShadow = '0 0 0 3px rgba(139, 94, 52, 0.15)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#D6C7B8';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowSetupPassword(!showSetupPassword)}
                      style={{
                        position: 'absolute',
                        left: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#8B5E34',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '2px'
                      }}
                    >
                      {showSetupPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: '800', color: '#2D1810', marginBottom: '6px' }}>
                    تأكيد كلمة المرور *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#8B5E34' }} />
                    <input
                      type={showSetupPassword ? 'text' : 'password'}
                      required
                      placeholder="أعد كتابتها"
                      value={setupConfirmPassword}
                      onChange={(e) => setSetupConfirmPassword(e.target.value)}
                      style={{
                        width: '100%',
                        height: '44px',
                        background: '#FAF7F2',
                        border: '1.5px solid #D6C7B8',
                        borderRadius: '12px',
                        padding: '0 38px 0 12px',
                        color: '#2D1810',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#8B5E34';
                        e.target.style.boxShadow = '0 0 0 3px rgba(139, 94, 52, 0.15)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#D6C7B8';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Submit Setup Button */}
              <button
                type="submit"
                disabled={isLoading}
                style={{
                  height: '50px',
                  fontSize: '1rem',
                  fontWeight: '900',
                  borderRadius: '14px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #8B5E34 0%, #6F4E37 100%)',
                  color: '#ffffff',
                  cursor: isLoading ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  boxShadow: '0 8px 24px rgba(111, 78, 55, 0.35)',
                  transition: 'all 0.2s ease',
                  marginTop: '8px'
                }}
              >
                {isLoading ? (
                  <span>جاري التأسيس والتشفير...</span>
                ) : (
                  <>
                    <UserPlus size={19} />
                    <span>تأسيس حساب المالك ودخول لوحة التحكم 🚀</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Regular Login Form */
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Preselected User Switch Banner */}
              {loginPreselectedUsername && preselectedUser && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    background: 'linear-gradient(135deg, #FFF8EE 0%, #FAF0E4 100%)',
                    border: '1.5px solid #EDD9BD',
                    borderRadius: '12px',
                    marginBottom: '4px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.3rem' }}>{preselectedUser.avatar || '👤'}</span>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: '800', color: '#4A3220' }}>
                        {preselectedUser.fullName} {preselectedUser.isOwner && '👑'}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#8B5E34', fontWeight: '600' }}>
                        يرجى إدخال كلمة المرور لتأكيد الدخول
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginPreselectedUsername('');
                      setUsername('');
                      setPassword('');
                    }}
                    style={{
                      background: '#ffffff',
                      border: '1px solid #D6C7B8',
                      borderRadius: '8px',
                      padding: '4px 10px',
                      fontSize: '0.74rem',
                      fontWeight: '800',
                      color: '#8B5E34',
                      cursor: 'pointer'
                    }}
                  >
                    تغيير الحساب
                  </button>
                </div>
              )}

              {/* Username Input */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.86rem',
                    fontWeight: '800',
                    color: '#2D1810',
                    marginBottom: '6px'
                  }}
                >
                  {language === 'en' ? 'Username or Email' : 'اسم المستخدم أو البريد الإلكتروني'}
                </label>
                <div style={{ position: 'relative' }}>
                  <User
                    size={18}
                    style={{
                      position: 'absolute',
                      right: '14px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: '#8B5E34'
                    }}
                  />
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder={language === 'en' ? 'Username or email' : 'اسم المستخدم أو البريد'}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={{
                      width: '100%',
                      height: '46px',
                      background: '#FAF7F2',
                      border: '1.5px solid #D6C7B8',
                      borderRadius: '12px',
                      padding: '0 44px 0 14px',
                      color: '#2D1810',
                      fontSize: '0.92rem',
                      fontWeight: '600',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s, box-shadow 0.2s'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#8B5E34';
                      e.target.style.boxShadow = '0 0 0 3px rgba(139, 94, 52, 0.15)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#D6C7B8';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <div style={{ marginBottom: '6px' }}>
                  <label
                    style={{
                      fontSize: '0.86rem',
                      fontWeight: '800',
                      color: '#2D1810',
                      margin: 0
                    }}
                  >
                    {language === 'en' ? 'Password' : 'كلمة المرور'}
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
                      color: '#8B5E34'
                    }}
                  />
                  <input
                    ref={passwordInputRef}
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      height: '46px',
                      background: '#FAF7F2',
                      border: '1.5px solid #D6C7B8',
                      borderRadius: '12px',
                      padding: '0 44px',
                      color: '#2D1810',
                      fontSize: '0.92rem',
                      fontWeight: '600',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s, box-shadow 0.2s'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#8B5E34';
                      e.target.style.boxShadow = '0 0 0 3px rgba(139, 94, 52, 0.15)';
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#D6C7B8';
                      e.target.style.boxShadow = 'none';
                    }}
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
                      color: '#8B5E34',
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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', fontSize: '0.84rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#4A3220', fontWeight: '700' }}>
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    style={{ accentColor: '#8B5E34', cursor: 'pointer', width: '16px', height: '16px' }}
                  />
                  <span>{language === 'en' ? 'Remember me on this device' : 'تذكر تسجيل دخولي على هذا الجهاز'}</span>
                </label>
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
                  background: 'linear-gradient(135deg, #8B5E34 0%, #6F4E37 100%)',
                  color: '#ffffff',
                  cursor: isLoading ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  boxShadow: '0 8px 24px rgba(111, 78, 55, 0.35)',
                  transition: 'all 0.2s ease',
                  marginTop: '4px'
                }}
                onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.08)')}
                onMouseLeave={(e) => (e.currentTarget.style.filter = 'none')}
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
                    <span>{language === 'en' ? 'Authenticating...' : 'جاري التحقق وتطبيق الصلاحيات...'}</span>
                  </div>
                ) : (
                  <>
                    <LogIn size={20} />
                    <span>{language === 'en' ? 'Sign In to ERP Dashboard 🚀' : 'دخول لوحة الإدارة ونقاط البيع 🚀'}</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Bottom Navigation: Return to Client Store */}
        <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid #F0E6DD', textAlign: 'center' }}>
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
              background: '#FAF7F2',
              border: '1.5px solid #E8D5C4',
              borderRadius: '12px',
              padding: '10px 20px',
              color: '#6F4E37',
              fontSize: '0.88rem',
              fontWeight: '800',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#F0E6DD';
              e.currentTarget.style.color = '#2D1810';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#FAF7F2';
              e.currentTarget.style.color = '#6F4E37';
            }}
          >
            <Store size={18} color="#8B5E34" />
            <span>{language === 'en' ? 'Return to Client Store 🛍️' : 'العودة لمتجر العملاء الإلكتروني 🛍️'}</span>
          </a>
        </div>

        {/* Micro Status Bar */}
        <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '0.76rem', color: '#8C7A6B' }}>
          <span>{language === 'en' ? 'Caturra Roastery & Distribution System v2.8' : 'نظام كاتورا للتحميص والتوزيع v2.8'}</span>
        </div>
      </div>
    </div>
  );
};
