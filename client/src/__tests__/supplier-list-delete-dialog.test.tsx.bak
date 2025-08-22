import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import SupplierList from '../pages/suppliers/SupplierList';

jest.mock('../services/supplier.service', () => ({
  __esModule: true,
  default: {
    getSuppliers: jest.fn().mockResolvedValue({ suppliers: [{ _id: 's1', name: 'Acme', code: 'ACM', industry: 'Aerospace', status: 'active', primaryContactName: 'John', primaryContactEmail: 'j@acme.com' }], total: 1 }),
    deleteSupplier: jest.fn().mockResolvedValue({ success: true })
  }
}));

jest.mock('../components/common/DataTable', () => ({
  __esModule: true,
  DataTable: ({ rows, actions }: any) => (
    <div>
      <div>MockTableRow:{rows[0]?.name}</div>
      <button onClick={() => actions?.[1]?.onClick([{ _id: rows[0]._id }])}>Trigger Delete</button>
    </div>
  )
}));

jest.mock('../components/common', () => {
  const actual = jest.requireActual('../components/common');
  return {
    ...actual,
    ConfirmationDialog: ({ open, onClose, onConfirm, title }: any) =>
      open ? (
        <div>
          <div>{title}</div>
          <button onClick={onClose}>Cancel</button>
          <button onClick={onConfirm}>Confirm</button>
        </div>
      ) : null,
  };
});

describe('SupplierList delete dialog', () => {
  it('opens and confirms delete', async () => {
    render(
      <MemoryRouter>
        <SupplierList />
      </MemoryRouter>
    );

    // trigger delete via mocked DataTable action
    fireEvent.click(screen.getByText('Trigger Delete'));
    expect(screen.getByText(/delete supplier/i)).toBeInTheDocument();

    fireEvent.click(screen.getByText('Confirm'));

    await waitFor(() => {
      // snackbar success message or dialog closed implies flow executed
      expect(screen.queryByText(/delete supplier/i)).not.toBeInTheDocument();
    });
  });
});
