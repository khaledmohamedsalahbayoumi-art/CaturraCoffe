import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Building2, User, Phone, MapPin, Coffee, Check, Search, ChevronDown, X } from 'lucide-react';
import { normalizeArabic, normalizePhone } from '../../utils/numberEnforcer';

/**
 * 🏢 B2BCustomerAutocomplete
 * Floating autocomplete suggestions component for B2B Clients & Cafes.
 * Allows quick-selecting existing B2B customers or typing new custom place names.
 */
export const B2BCustomerAutocomplete = ({
  value = '',
  onChange = () => {},
  onSelectCustomer = () => {},
  customers = [],
  b2bRequests = [],
  placeholder = 'مثال: إكسير كافيه أو Doba Bear',
  required = true,
  theme = 'dark', // 'dark' | 'light'
  inputStyle = {}
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // 1. Build unified, deduplicated list of B2B partners/clients
  const b2bClients = useMemo(() => {
    const list = [];
    const seenKeys = new Set();

    // From customers list (B2B only)
    (customers || []).forEach(c => {
      const isB2B = Boolean(c.isB2B || c.b2bRefCode || (c.companyName && c.companyName.trim() !== ''));
      if (!isB2B) return;

      const compName = (c.companyName || c.name || '').trim();
      const phone = normalizePhone(c.phone || '');
      const key = `${compName.toLowerCase()}_${phone}`;

      if (!seenKeys.has(key) && compName) {
        seenKeys.add(key);
        list.push({
          id: c.id,
          source: 'customer',
          companyName: compName,
          contactName: c.contactName || (c.name !== compName ? c.name : ''),
          phone: c.phone || '',
          email: c.email || '',
          city: c.city || 'القاهرة',
          address: c.address || '',
          businessType: c.businessType || 'كافيه مختص (Specialty)',
          monthlyVolume: c.monthlyVolume || '25 - 50 كجم شهرياً',
          preferredProducts: c.preferredProducts || [],
          refCode: c.b2bRefCode || c.id,
          notes: c.notes || ''
        });
      }
    });

    // From B2B partnership requests / leads
    (b2bRequests || []).forEach(l => {
      const compName = (l.companyName || '').trim();
      const phone = normalizePhone(l.phone || '');
      const key = `${compName.toLowerCase()}_${phone}`;

      if (!seenKeys.has(key) && compName) {
        seenKeys.add(key);
        list.push({
          id: l.id,
          source: 'b2bLead',
          companyName: compName,
          contactName: l.contactName || '',
          phone: l.phone || '',
          email: l.email || '',
          city: l.city || 'القاهرة',
          address: l.branch || l.address || '',
          businessType: l.businessType || 'كافيه مختص (Specialty)',
          monthlyVolume: l.monthlyVolume || '25 - 50 كجم شهرياً',
          preferredProducts: l.preferredProducts || [],
          refCode: l.refCode || l.id,
          notes: l.notes || ''
        });
      }
    });

    return list;
  }, [customers, b2bRequests]);

  // 2. Filter B2B candidates based on user input query
  const filteredSuggestions = useMemo(() => {
    const q = (value || '').trim().toLowerCase();
    if (!q) {
      // Show first 10 B2B clients when query is empty
      return b2bClients.slice(0, 10);
    }
    const qNorm = normalizeArabic(q);

    return b2bClients.filter(c => {
      const matchComp = normalizeArabic(c.companyName.toLowerCase()).includes(qNorm);
      const matchContact = c.contactName && normalizeArabic(c.contactName.toLowerCase()).includes(qNorm);
      const matchPhone = c.phone && normalizePhone(c.phone).includes(normalizePhone(q));
      const matchCity = c.city && normalizeArabic(c.city.toLowerCase()).includes(qNorm);
      return matchComp || matchContact || matchPhone || matchCity;
    });
  }, [b2bClients, value]);

  // 3. Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (cust) => {
    onChange(cust.companyName);
    onSelectCustomer(cust);
    setIsOpen(false);
  };

  const isDark = theme === 'dark';

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          ref={inputRef}
          type="text"
          required={required}
          placeholder={placeholder}
          value={value}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            onChange(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setIsOpen(false);
          }}
          style={{
            width: '100%',
            padding: isDark ? '10px 38px 10px 12px' : '10px 36px 10px 12px',
            background: isDark ? '#2C1810' : '#FAF7F2',
            border: isDark ? '1.5px solid #EDD9BD' : '1.5px solid #D6C7B8',
            borderRadius: '10px',
            color: isDark ? '#ffffff' : '#2D1810',
            fontSize: '0.88rem',
            fontWeight: '700',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.2s',
            ...inputStyle
          }}
        />

        {/* Icon Inside Input (Building Icon or Clear) */}
        <div
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            pointerEvents: 'none'
          }}
        >
          <Building2 size={16} color={isDark ? '#fbbf24' : '#8B5E34'} />
        </div>

        {/* Quick clear button if text exists */}
        {value && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
              inputRef.current?.focus();
            }}
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: isDark ? '#a88a74' : '#8C7A6B',
              padding: '2px',
              display: 'flex',
              alignItems: 'center'
            }}
            title="مسح"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* 🚀 Floating Autocomplete Suggestions Dropdown 🚀 */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 99999,
            background: isDark
              ? 'linear-gradient(165deg, #241109 0%, #170702 100%)'
              : '#FFFDF9',
            border: isDark ? '2px solid #d97706' : '1.5px solid #EDD9BD',
            borderRadius: '14px',
            boxShadow: isDark
              ? '0 16px 40px rgba(0,0,0,0.85), 0 0 20px rgba(217, 119, 6, 0.25)'
              : '0 16px 36px rgba(45, 24, 16, 0.16), 0 4px 12px rgba(111, 78, 55, 0.08)',
            maxHeight: '280px',
            overflowY: 'auto',
            padding: '6px',
            direction: 'rtl'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '6px 10px 8px',
              borderBottom: isDark ? '1px solid rgba(212, 163, 115, 0.2)' : '1px solid #F0E6DD',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.74rem',
              fontWeight: '800',
              color: isDark ? '#fbbf24' : '#8B5E34'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Building2 size={13} />
              <span>عملاء وشراكات B2B المسجلة ({b2bClients.length})</span>
            </span>
            <span style={{ fontSize: '0.7rem', color: isDark ? '#a88a74' : '#8C7A6B' }}>
              اختر لتعبئة البيانات تلقائياً
            </span>
          </div>

          {/* List items */}
          {filteredSuggestions.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
              {filteredSuggestions.map((cust) => {
                const prodCount = (cust.preferredProducts || []).length;
                const isCurrent = value.trim() === cust.companyName.trim();

                return (
                  <div
                    key={`${cust.id}-${cust.phone}`}
                    onClick={() => handleSelect(cust)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      cursor: 'pointer',
                      background: isCurrent
                        ? (isDark ? 'rgba(217, 119, 6, 0.25)' : '#FEF3C7')
                        : 'transparent',
                      border: isCurrent
                        ? (isDark ? '1px solid #d97706' : '1px solid #FCD34D')
                        : '1px solid transparent',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px'
                    }}
                    onMouseEnter={(e) => {
                      if (!isCurrent) {
                        e.currentTarget.style.background = isDark
                          ? 'rgba(255, 255, 255, 0.08)'
                          : '#FAF7F2';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isCurrent) {
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontWeight: '900',
                          fontSize: '0.92rem',
                          color: isDark ? '#ffffff' : '#2D1810',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span>🏢 {cust.companyName}</span>
                        {cust.refCode && (
                          <span
                            style={{
                              fontSize: '0.68rem',
                              background: isDark ? 'rgba(217,119,6,0.3)' : '#F5E6D0',
                              color: isDark ? '#fde68a' : '#8B5E34',
                              padding: '1px 6px',
                              borderRadius: '6px',
                              fontWeight: '700'
                            }}
                          >
                            #{cust.refCode}
                          </span>
                        )}
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          fontSize: '0.76rem',
                          color: isDark ? '#d4a373' : '#6F4E37',
                          marginTop: '3px',
                          flexWrap: 'wrap'
                        }}
                      >
                        {cust.contactName && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <User size={12} />
                            {cust.contactName}
                          </span>
                        )}
                        {cust.phone && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', direction: 'ltr' }}>
                            <Phone size={11} />
                            {cust.phone}
                          </span>
                        )}
                        {cust.city && (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                            <MapPin size={11} />
                            {cust.city} {cust.address ? `(${cust.address})` : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Preferred Products count badge if any */}
                    <div style={{ textAlign: 'left', flexShrink: 0 }}>
                      {prodCount > 0 ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: isDark ? 'rgba(16, 185, 129, 0.2)' : '#ECFDF5',
                            color: isDark ? '#6ee7b7' : '#065F46',
                            border: isDark ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid #A7F3D0',
                            padding: '3px 8px',
                            borderRadius: '12px',
                            fontSize: '0.72rem',
                            fontWeight: '800'
                          }}
                        >
                          <Coffee size={12} />
                          <span>{prodCount} أصناف</span>
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            color: isDark ? '#9ca3af' : '#9CA3AF'
                          }}
                        >
                          شريك B2B
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              style={{
                padding: '14px',
                textAlign: 'center',
                fontSize: '0.82rem',
                color: isDark ? '#d4a373' : '#8C7A6B'
              }}
            >
              <div>لم يتم العثور على عميل مسجل بهذا الاسم.</div>
              <div style={{ fontSize: '0.75rem', marginTop: '4px', color: isDark ? '#a88a74' : '#A89080' }}>
                يمكنك الاستمرار بكتابة الاسم لتسجيل كافيه / منشأة جديدة.
              </div>
            </div>
          )}

          {/* Option to create brand new custom name */}
          {value.trim() && (
            <div
              onClick={() => setIsOpen(false)}
              style={{
                marginTop: '6px',
                borderTop: isDark ? '1px dashed rgba(212, 163, 115, 0.25)' : '1px dashed #E8D5C4',
                padding: '8px 10px',
                fontSize: '0.78rem',
                fontWeight: '800',
                color: isDark ? '#fbbf24' : '#8B5E34',
                cursor: 'pointer',
                borderRadius: '8px',
                textAlign: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : '#FAF7F2';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              ✍️ استخدام "{value.trim()}" كاسم منشأة جديدة
            </div>
          )}
        </div>
      )}
    </div>
  );
};
