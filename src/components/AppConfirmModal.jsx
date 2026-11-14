import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Info,
  X,
  AlertCircle
} from 'lucide-react';

export const AppConfirmModal = () => {
  const { dialogState, closeDialog } = useApp();

  // Keyboard shortcut support: Esc to cancel, Enter to confirm
  useEffect(() => {
    if (!dialogState?.isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeDialog(false);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        closeDialog(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialogState?.isOpen, closeDialog]);

  if (!dialogState?.isOpen) return null;

  const {
    title = 'تأكيد الإجراء',
    message = '',
    details = '',
    type = 'danger',
    confirmText = 'تأكيد',
    cancelText = 'إلغاء',
    isAlertOnly = false
  } = dialogState;

  // Icon & color theme configuration
  const config = {
    danger: {
      icon: <XCircle size={32} color="#dc2626" />,
      bgIcon: '#fee2e2',
      borderIcon: '#fca5a5',
      confirmBg: '#dc2626',
      confirmHover: '#b91c1c',
      confirmColor: '#ffffff'
    },
    warning: {
      icon: <AlertTriangle size={30} color="#d97706" />,
      bgIcon: '#fef3c7',
      borderIcon: '#fcd34d',
      confirmBg: '#d97706',
      confirmHover: '#b45309',
      confirmColor: '#ffffff'
    },
    success: {
      icon: <CheckCircle2 size={32} color="#16a34a" />,
      bgIcon: '#dcfce7',
      borderIcon: '#86efac',
      confirmBg: '#163926',
      confirmHover: '#0e2619',
      confirmColor: '#ffffff'
    },
    info: {
      icon: <AlertCircle size={30} color="#0284c7" />,
      bgIcon: '#e0f2fe',
      borderIcon: '#7dd3fc',
      confirmBg: '#0284c7',
      confirmHover: '#0369a1',
      confirmColor: '#ffffff'
    }
  }[type] || {
    icon: <Info size={30} color="#163926" />,
    bgIcon: '#e8ede9',
    borderIcon: '#cbd5e1',
    confirmBg: '#163926',
    confirmHover: '#0e2619',
    confirmColor: '#ffffff'
  };

  return (
    <div
      className="modal-backdrop app-dialog-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'rgba(5, 15, 10, 0.72)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease',
        direction: 'rtl'
      }}
      onClick={() => closeDialog(false)}
    >
      <div
        className="modal-card app-dialog-card"
        style={{
          width: '100%',
          maxWidth: '440px',
          background: '#ffffff',
          borderRadius: '24px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          padding: '32px 26px 26px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          animation: 'modalPop 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button Top Corner */}
        <button
          type="button"
          onClick={() => closeDialog(false)}
          style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            background: '#f8fafc',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#64748b',
            transition: 'all 0.2s ease'
          }}
          title="إغلاق"
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#f1f5f9';
            e.currentTarget.style.color = '#0f172a';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#f8fafc';
            e.currentTarget.style.color = '#64748b';
          }}
        >
          <X size={16} />
        </button>

        {/* Central Icon Badge */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: config.bgIcon,
            border: `1.5px solid ${config.borderIcon}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 18px',
            boxShadow: '0 8px 20px -6px rgba(0,0,0,0.08)'
          }}
        >
          {config.icon}
        </div>

        {/* Dialog Title */}
        <h3
          style={{
            fontSize: '1.25rem',
            fontWeight: '900',
            color: '#0f172a',
            margin: '0 0 10px',
            lineHeight: '1.3'
          }}
        >
          {title}
        </h3>

        {/* Dialog Message */}
        <p
          style={{
            fontSize: '0.96rem',
            lineHeight: '1.7',
            color: '#475569',
            margin: '0 0 20px',
            whiteSpace: 'pre-line'
          }}
        >
          {message}
        </p>

        {/* Optional details / warning badge */}
        {details && (
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '12px',
              padding: '10px 14px',
              fontSize: '0.84rem',
              color: '#64748b',
              marginBottom: '22px',
              textAlign: 'right'
            }}
          >
            {details}
          </div>
        )}

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            marginTop: '8px'
          }}
        >
          {/* Confirm Button */}
          <button
            type="button"
            autoFocus
            onClick={() => closeDialog(true)}
            style={{
              flex: 1,
              height: '44px',
              borderRadius: '12px',
              border: 'none',
              background: config.confirmBg,
              color: config.confirmColor,
              fontWeight: '800',
              fontSize: '0.94rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.15)',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = config.confirmHover)}
            onMouseLeave={(e) => (e.currentTarget.style.background = config.confirmBg)}
          >
            {confirmText}
          </button>

          {/* Cancel Button (Hidden for Alert Dialogs) */}
          {!isAlertOnly && (
            <button
              type="button"
              onClick={() => closeDialog(false)}
              style={{
                flex: 1,
                height: '44px',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                background: '#ffffff',
                color: '#475569',
                fontWeight: '700',
                fontSize: '0.94rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.borderColor = '#cbd5e1';
                e.currentTarget.style.color = '#0f172a';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#ffffff';
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.color = '#475569';
              }}
            >
              {cancelText}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
