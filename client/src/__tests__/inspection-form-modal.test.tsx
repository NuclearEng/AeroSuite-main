import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import InspectionFormModal from '../pages/inspections/components/InspectionFormModal';

jest.mock('../services/inspection.service', () => ({
  __esModule: true,
  default: {
    createInspection: jest.fn().mockResolvedValue({ _id: 'i1', title: 'Test Inspection' }),
    updateInspection: jest.fn(),
    getInspection: jest.fn(),
  }
}));

jest.mock('../services/customer.service', () => ({
  __esModule: true,
  default: {
    getCustomers: jest.fn().mockResolvedValue({ customers: [] })
  }
}));

jest.mock('../services/supplier.service', () => ({
  __esModule: true,
  default: {
    getSuppliers: jest.fn().mockResolvedValue({ suppliers: [] })
  }
}));

describe('InspectionFormModal', () => {
  test('shows required field errors when submitting empty form', async () => {
    render(<InspectionFormModal open onClose={() => {}} onSave={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: /schedule inspection|update inspection|save/i }));

    await waitFor(() => expect(screen.getByText(/title is required/i)).toBeInTheDocument());
  });

  test('submits with minimal valid data', async () => {
    const onSave = jest.fn();
    render(<InspectionFormModal open onClose={() => {}} onSave={onSave} />);

    fireEvent.change(screen.getByLabelText(/inspection title/i), { target: { value: 'QA Audit' } });
    fireEvent.change(screen.getByLabelText(/location/i), { target: { value: 'Hangar 2' } });

    fireEvent.click(screen.getByRole('button', { name: /schedule inspection|update inspection|save/i }));

    await waitFor(() => expect(onSave).toHaveBeenCalled());
  });
});
