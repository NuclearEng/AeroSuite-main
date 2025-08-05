import React, { useEffect } from 'react';

export type NotificationSeverity = 'success' | 'error' | 'warning' | 'info';

export interface NotificationProps {
  message: string;
  severity?: NotificationSeverity;
  open: boolean;
  autoHideDuration?: number;
  onClose?: () => void;
}

/**
 * Best-in-class Notification component for toast/snackbar messages, with auto-dismiss and accessibility.
 */
const Notification: React.FC<NotificationProps> = ({
  message,
  severity = 'info',
  open,
  autoHideDuration = 3000,
  onClose,
}) => {
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      onClose?.();
    }, autoHideDuration);
    return () => clearTimeout(timer);
  }, [open, autoHideDuration, onClose]);

  if (!open) return null;

  const colors: Record<NotificationSeverity, string> = {
    success: '#4caf50',
    error: '#f44336',
    warning: '#ff9800',
    info: '#2196f3',
  };

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 32,
        left: '50%',
        transform: 'translateX(-50%)',
        background: colors[severity],
        color: '#fff',
        padding: '12px 24px',
        borderRadius: 4,
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        zIndex: 1400,
        display: 'flex',
        alignItems: 'center',
        minWidth: 200,
      }}
    >
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={onClose}
        aria-label="Close notification"
        style={{
          background: 'transparent',
          border: 'none',
          color: '#fff',
          fontSize: 20,
          cursor: 'pointer',
          marginLeft: 16,
        }}
      >
        ×
      </button>
    </div>
  );
};

export default Notification; 