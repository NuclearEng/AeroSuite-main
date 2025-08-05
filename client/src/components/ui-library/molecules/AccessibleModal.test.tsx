import React, { useRef } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AccessibleModal from './AccessibleModal';
import { Button } from '@mui/material';
import '@testing-library/jest-dom';

// Mock the Material-UI components that might cause issues in tests
jest.mock('@mui/material/Dialog', () => {
  const Dialog = ({ children, open, ...props }: { children: React.ReactNode; open: boolean; [key: string]: any }) => {
    if (!open) return null;
    return (
      <div role="dialog" {...props}>
        {children}
      </div>
    );
  };
  return Dialog;
});

jest.mock('@mui/material/DialogTitle', () => {
  const DialogTitle = ({ children, ...props }: { children: React.ReactNode; [key: string]: any }) => (
    <div {...props}>{children}</div>
  );
  return DialogTitle;
});

jest.mock('@mui/material/DialogContent', () => {
  const DialogContent = ({ children, ...props }: { children: React.ReactNode; [key: string]: any }) => (
    <div {...props}>{children}</div>
  );
  return DialogContent;
});

jest.mock('@mui/material/DialogActions', () => {
  const DialogActions = ({ children, ...props }: { children: React.ReactNode; [key: string]: any }) => (
    <div {...props}>{children}</div>
  );
  return DialogActions;
});

jest.mock('@mui/material/IconButton', () => {
  const IconButton = ({ children, onClick, ...props }: { children: React.ReactNode; onClick?: () => void; [key: string]: any }) => (
    <button onClick={onClick} {...props}>
      {children}
    </button>
  );
  return IconButton;
});

jest.mock('@mui/icons-material/Close', () => {
  const CloseIcon = () => <span data-testid="close-icon">X</span>;
  return CloseIcon;
});

// Mock the useFocusTrap hook
jest.mock('../../../hooks/useFocusTrap', () => {
  // Use a mock function that returns an object with current property
  return jest.fn().mockReturnValue({ current: null });
});

describe('AccessibleModal', () => {
  const mockOnClose = jest.fn();
  
  beforeEach(() => {
    mockOnClose.mockClear();
    // Mock body style manipulation
    Object.defineProperty(document.body.style, 'overflow', {
      configurable: true,
      value: '',
      writable: true
    });
  });

  it('renders with correct title and content', () => {
    render(
      <AccessibleModal
        open={true}
        onClose={mockOnClose}
        title="Test Modal"
      >
        <div data-testid="modal-content">Modal Content</div>
      </AccessibleModal>
    );
    
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByTestId('modal-content')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <AccessibleModal
        open={false}
        onClose={mockOnClose}
        title="Test Modal"
      >
        <div data-testid="modal-content">Modal Content</div>
      </AccessibleModal>
    );
    
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
    expect(screen.queryByTestId('modal-content')).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <AccessibleModal
        open={true}
        onClose={mockOnClose}
        title="Test Modal"
      >
        <div>Modal Content</div>
      </AccessibleModal>
    );
    
    const closeButton = screen.getByLabelText('close');
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('renders action buttons when provided', () => {
    const actions = (
      <>
        <button data-testid="cancel-button">Cancel</button>
        <button data-testid="confirm-button">Confirm</button>
      </>
    );
    
    render(
      <AccessibleModal
        open={true}
        onClose={mockOnClose}
        title="Test Modal"
        actions={actions}
      >
        <div>Modal Content</div>
      </AccessibleModal>
    );
    
    expect(screen.getByTestId('cancel-button')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-button')).toBeInTheDocument();
  });

  it('sets proper ARIA attributes', () => {
    render(
      <AccessibleModal
        open={true}
        onClose={mockOnClose}
        title="Test Modal"
        ariaDescribedBy="test-description"
      >
        <div id="test-description">Modal Content</div>
      </AccessibleModal>
    );
    
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-labelledby', 'accessible-modal-title');
    expect(dialog).toHaveAttribute('aria-describedby', 'test-description');
  });

  it('prevents body scrolling when open', () => {
    const { unmount } = render(
      <AccessibleModal
        open={true}
        onClose={mockOnClose}
        title="Test Modal"
      >
        <div>Modal Content</div>
      </AccessibleModal>
    );
    
    expect(document.body.style.overflow).toBe('hidden');
    
    unmount();
    
    expect(document.body.style.overflow).toBe('');
  });

  it('restores body scrolling when closed', () => {
    const { rerender } = render(
      <AccessibleModal
        open={true}
        onClose={mockOnClose}
        title="Test Modal"
      >
        <div>Modal Content</div>
      </AccessibleModal>
    );
    
    expect(document.body.style.overflow).toBe('hidden');
    
    rerender(
      <AccessibleModal
        open={false}
        onClose={mockOnClose}
        title="Test Modal"
      >
        <div>Modal Content</div>
      </AccessibleModal>
    );
    
    expect(document.body.style.overflow).toBe('');
  });

  it('respects disableBackdropClick prop', () => {
    render(
      <AccessibleModal
        open={true}
        onClose={mockOnClose}
        title="Test Modal"
        disableBackdropClick={true}
      >
        <div>Modal Content</div>
      </AccessibleModal>
    );
    
    // Simulate backdrop click
    const dialog = screen.getByRole('dialog');
    fireEvent.click(dialog.parentElement as HTMLElement);
    
    // onClose should not be called when disableBackdropClick is true
    expect(mockOnClose).not.toHaveBeenCalled();
  });
}); 