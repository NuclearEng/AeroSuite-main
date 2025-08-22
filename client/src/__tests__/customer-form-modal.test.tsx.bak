import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CustomerFormModal from '../pages/customers/components/CustomerFormModal';

jest.mock('../services/customer.service', () => ({
  __esModule: true,
  default: {
    createCustomer: jest.fn().mockResolvedValue({ _id: '1', name: 'Acme', code: 'ACM', industry: 'Aerospace', status: 'active' }),
    updateCustomer: jest.fn(),
    getCustomer: jest.fn()
  }
}));

describe('CustomerFormModal', () => {
  test('shows validation errors for required fields', async () => {
    const onClose = jest.fn();
    const onSave = jest.fn();

    render(
      <CustomerFormModal open onClose={onClose} onSave={onSave} />
    );

    fireEvent.click(screen.getByRole('button', { name: /create supplier|create customer|save|create/i }));

    // At least one required helper text should appear
    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    });
  });

  test('submits when valid', async () => {
    const onClose = jest.fn();
    const onSave = jest.fn();

    render(<CustomerFormModal open onClose={onClose} onSave={onSave} />);

    fireEvent.change(screen.getByLabelText(/customer name/i), { target: { value: 'Acme Corp' } });
    fireEvent.blur(screen.getByLabelText(/customer name/i));
    fireEvent.change(screen.getByLabelText(/customer code/i), { target: { value: 'ACM' } });

    // open selects are MUI; skip selecting industry/status to keep test simple if not required by initial state

    fireEvent.click(screen.getByRole('button', { name: /create|save|update/i }));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalled();
    });
  });
});
