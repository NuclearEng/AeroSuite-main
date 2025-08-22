import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DeleteConfirmationModal from '../components/common/DeleteConfirmationModal';

describe('DeleteConfirmationModal', () => {
  it('renders default title and message, triggers onClose and onConfirm', async () => {
    const onClose = jest.fn();
    const onConfirm = jest.fn();

    render(
      <DeleteConfirmationModal
        open
        onClose={onClose}
        onConfirm={onConfirm}
        itemName="Sample"
      />
    );

    expect(screen.getByText(/confirm deletion/i)).toBeInTheDocument();
    expect(screen.getByText(/are you sure you want to delete/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});

