import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ConfirmDialog from '../components/ui-library/molecules/ConfirmDialog';

describe('ConfirmDialog', () => {
  it('renders title and content and triggers callbacks', () => {
    const onClose = jest.fn();
    const onConfirm = jest.fn();

    render(
      <ConfirmDialog
        open
        onClose={onClose}
        onConfirm={onConfirm}
        title="Delete Item"
        content="Are you sure?"
        confirmText="Yes"
        cancelText="No"
      />
    );

    expect(screen.getByText('Delete Item')).toBeInTheDocument();
    expect(screen.getByText('Are you sure?')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /no/i }));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole('button', { name: /yes/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
