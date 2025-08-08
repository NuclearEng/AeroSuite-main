import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import CustomerList from '../pages/customers/CustomerList';

jest.mock('../services/customer.service', () => ({
  __esModule: true,
  default: {
    getCustomers: jest.fn().mockResolvedValue({ customers: [{ _id: 'c1', name: 'Beta Corp', code: 'BET', industry: 'Aerospace', status: 'active' }]}),
    deleteCustomer: jest.fn().mockResolvedValue({ success: true })
  }
}));

describe('CustomerList delete dialog', () => {
  it('opens dialog and confirms delete', async () => {
    render(
      <MemoryRouter>
        <CustomerList />
      </MemoryRouter>
    );

    // Wait for the grid row to render
    await screen.findByText('Beta Corp');

    // Click delete icon by test id we added
    const deleteBtn = screen.getByTestId('delete-c1');
    fireEvent.click(deleteBtn);

    expect(screen.getByText(/confirm delete/i)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('confirm-delete'));

    await waitFor(() => expect(screen.queryByText(/confirm delete/i)).not.toBeInTheDocument());
  });
});
