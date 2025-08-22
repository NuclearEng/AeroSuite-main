import React from 'react';

export type AlertSeverity = 'success' | 'error' | 'warning' | 'info';

export interface AlertProps {
  severity?: AlertSeverity;
  message: string;
  onClose?: () => void;
  dismissible?: boolean;
}

/**
 * Best-in-class Alert component supporting different severities, dismissible, and accessible.
 */
const Alert: React.FC<AlertProps> = ({
  severity = 'info',
  message,
  onClose,
  dismissible = false,
}) => {
  const colors: Record<AlertSeverity, string> = {
    success: '#4caf50',
    error: '#f44336',
    warning: '#ff9800',
    info: '#2196f3',
  };

  return (
    <div
      role="alert"
      style={{
        background: colors[severity],
        color: '#fff',
        padding: '12px 20px',
        borderRadius: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        fontSize: 16,
        margin: '8px 0',
      }}
    >
      <span>{message}</span>
      {dismissible && (
        <button
          onClick={onClose}
          aria-label="Close alert"
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
      )}
    </div>
  );
};

export default Alert; 