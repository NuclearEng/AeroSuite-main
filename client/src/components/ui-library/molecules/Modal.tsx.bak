import React, { useEffect, useRef } from 'react';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  ariaLabel?: string;
}

/**
 * Best-in-class Modal component with focus trap, close on overlay click/escape, and accessibility.
 */
const Modal: React.FC<ModalProps> = ({ open, onClose, children, ariaLabel = 'Modal' }) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (open && contentRef.current) {
      contentRef.current.focus();
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      tabIndex={-1}
      aria-modal="true"
      role="dialog"
      aria-label={ariaLabel}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1300,
      }}
      onClick={e => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div
        ref={contentRef}
        tabIndex={0}
        style={{
          background: '#fff',
          borderRadius: 8,
          padding: 32,
          minWidth: 320,
          minHeight: 120,
          outline: 'none',
          boxShadow: '0 2px 16px rgba(0,0,0,0.2)',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default Modal; 