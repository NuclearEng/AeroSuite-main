import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../test-utils';
import Modal from '../../components/common/Modal';

describe('Modal Component', () => {
  test('renders modal when open', () => {
    renderWithProviders(
      <Modal
        open={true}
        onClose={() => {}}
        title="Test Modal"
      >
        <div>Modal Content</div>
      </Modal>
    );
    
    // Check that modal title and content are rendered
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal Content')).toBeInTheDocument();
  });

  test('does not render modal when closed', () => {
    renderWithProviders(
      <Modal
        open={false}
        onClose={() => {}}
        title="Test Modal"
      >
        <div>Modal Content</div>
      </Modal>
    );
    
    // Check that modal title and content are not rendered
    expect(screen.queryByText('Test Modal')).not.toBeInTheDocument();
    expect(screen.queryByText('Modal Content')).not.toBeInTheDocument();
  });

  test('calls onClose when close button is clicked', () => {
    const handleClose = jest.fn();
    
    renderWithProviders(
      <Modal
        open={true}
        onClose={handleClose}
        title="Test Modal"
      >
        <div>Modal Content</div>
      </Modal>
    );
    
    // Find and click the close button
    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);
    
    // Check that onClose was called
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  test('calls onClose when backdrop is clicked', () => {
    const handleClose = jest.fn();
    
    renderWithProviders(
      <Modal
        open={true}
        onClose={handleClose}
        title="Test Modal"
      >
        <div>Modal Content</div>
      </Modal>
    );
    
    // Find and click the backdrop
    // Note: We need to find the backdrop element and simulate a click
    const backdrop = document.querySelector('.MuiBackdrop-root');
    if (backdrop) {
      fireEvent.click(backdrop);
      
      // Check that onClose was called
      expect(handleClose).toHaveBeenCalledTimes(1);
    }
  });

  test('renders modal with custom width', () => {
    renderWithProviders(
      <Modal
        open={true}
        onClose={() => {}}
        title="Custom Width Modal"
        maxWidth="xs"
      >
        <div>Modal Content</div>
      </Modal>
    );
    
    // Check that modal has the correct max-width class
    const modalPaper = document.querySelector('.MuiDialog-paperWidthXs');
    expect(modalPaper).toBeInTheDocument();
  });

  test('renders modal with fullScreen prop', () => {
    renderWithProviders(
      <Modal
        open={true}
        onClose={() => {}}
        title="Full Screen Modal"
        fullScreen={true}
      >
        <div>Modal Content</div>
      </Modal>
    );
    
    // Check that modal has fullScreen class
    const modalPaper = document.querySelector('.MuiDialog-paperFullScreen');
    expect(modalPaper).toBeInTheDocument();
  });

  test('renders modal with custom actions', () => {
    const handleAction = jest.fn();
    
    renderWithProviders(
      <Modal
        open={true}
        onClose={() => {}}
        title="Modal with Actions"
        actions={
          <>
            <button onClick={handleAction}>Custom Action</button>
            <button>Another Action</button>
          </>
        }
      >
        <div>Modal Content</div>
      </Modal>
    );
    
    // Check that custom action buttons are rendered
    expect(screen.getByRole('button', { name: /custom action/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /another action/i })).toBeInTheDocument();
    
    // Click the custom action button
    fireEvent.click(screen.getByRole('button', { name: /custom action/i }));
    
    // Check that the action callback was called
    expect(handleAction).toHaveBeenCalledTimes(1);
  });

  test('applies custom styles', () => {
    const { container } = renderWithProviders(
      <Modal
        open={true}
        onClose={() => {}}
        title="Styled Modal"
        sx={{ '& .MuiDialog-paper': { backgroundColor: 'rgb(240, 240, 240)' } }}
      >
        <div>Modal Content</div>
      </Modal>
    );
    
    // Check that custom styles are applied
    const modalPaper = container.querySelector('.MuiDialog-paper');
    expect(modalPaper).toHaveStyle('background-color: rgb(240, 240, 240)');
  });

  test('renders modal with custom dividers settings', () => {
    renderWithProviders(
      <Modal
        open={true}
        onClose={() => {}}
        title="Modal Without Dividers"
        dividers={false}
      >
        <div>Modal Content</div>
      </Modal>
    );
    
    // Check that dividers are not present
    const contentDivider = document.querySelector('.MuiDialogContent-dividers');
    expect(contentDivider).not.toBeInTheDocument();
  });
}); 