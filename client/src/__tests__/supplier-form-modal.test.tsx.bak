import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SupplierFormModal from '../pages/suppliers/components/SupplierFormModal';

jest.mock('../services/supplier.service', () => ({
  __esModule: true,
  default: {
    createSupplier: jest.fn().mockResolvedValue({ _id: 's1', name: 'Widget Co', code: 'WCO', status: 'active' }),
    updateSupplier: jest.fn(),
    getSupplier: jest.fn()
  }
}));

describe('SupplierFormModal', () => {
  test('shows required field errors', async () => {
    render(<SupplierFormModal open onClose={() => {}} onSave={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: /create|save|update/i }));

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });
  });

  test('submits when valid', async () => {
    const onSave = jest.fn();
    render(<SupplierFormModal open onClose={() => {}} onSave={onSave} />);

    fireEvent.change(screen.getByLabelText(/supplier name/i), { target: { value: 'Widget Co' } });
    fireEvent.blur(screen.getByLabelText(/supplier name/i));
    fireEvent.change(screen.getByLabelText(/supplier code/i), { target: { value: 'WCO' } });

    fireEvent.click(screen.getByRole('button', { name: /create|save|update/i }));

    await waitFor(() => expect(onSave).toHaveBeenCalled());
  });
});
