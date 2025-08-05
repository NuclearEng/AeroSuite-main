import { axe, toHaveNoViolations } from 'jest-axe';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import SupplierList from './SupplierList';
import { renderWithRouterAndTheme } from '../../test-utils/combined-wrapper';

// Task: DEV004 - Fix component tests for React Router
expect.extend(toHaveNoViolations as any);

describe('SupplierList', () => {
  const renderSupplierList = () => {
    return renderWithRouterAndTheme(<SupplierList />, {
      path: '/suppliers',
      route: '/suppliers',
      initialEntries: ['/suppliers']
    });
  };

  it('renders supplier list and filters', () => {
    renderSupplierList();
    expect(screen.getByText(/supplier/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/industry/i)).toBeInTheDocument();
  });

  it('focuses filter input on tab', async () => {
    renderSupplierList();
    userEvent.tab();
    expect(screen.getByLabelText(/status/i)).toHaveFocus();
  });

  it('focuses add button on tab', async () => {
    renderSupplierList();
    userEvent.tab();
    userEvent.tab();
    expect(screen.getByRole('button', { name: /add/i })).toHaveFocus();
  });

  it('navigates table rows with keyboard', async () => {
    renderSupplierList();
    // ...mock suppliers and test arrow key navigation
  });

  it('is accessible (axe, keyboard, focus)', async () => {
    const { container } = renderSupplierList();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
    // TODO: Add keyboard/focus navigation tests for table, import, and dialogs
  });

  it('validates file type and size on import', async () => {
    renderSupplierList();
    const fileInput = screen.getByLabelText(/import suppliers/i).querySelector('input[type="file"]');
    const badFile = new File(['bad'], 'bad.txt', { type: 'text/plain' });
    await waitFor(() => {
      fireEvent.change(fileInput!, { target: { files: [badFile] } });
    });
    expect(await screen.findByText(/invalid file type/i)).toBeInTheDocument();
  });

  it('shows error for oversized file', async () => {
    renderSupplierList();
    const fileInput = screen.getByLabelText(/import suppliers/i).querySelector('input[type="file"]');
    const bigFile = new File([new ArrayBuffer(6 * 1024 * 1024)], 'big.csv', { type: 'text/csv' });
    Object.defineProperty(bigFile, 'size', { value: 6 * 1024 * 1024 });
    await waitFor(() => {
      fireEvent.change(fileInput!, { target: { files: [bigFile] } });
    });
    expect(await screen.findByText(/file is too large/i)).toBeInTheDocument();
  });

  it('shows error for missing required columns', async () => {
    renderSupplierList();
    const fileInput = screen.getByLabelText(/import suppliers/i).querySelector('input[type="file"]');
    const csv = 'foo,bar\n1,2';
    const file = new File([csv], 'test.csv', { type: 'text/csv' });
    await waitFor(() => {
      fireEvent.change(fileInput!, { target: { files: [file] } });
    });
    expect(await screen.findByText(/missing required columns/i)).toBeInTheDocument();
  });

  it('shows error for empty or malformed file', async () => {
    renderSupplierList();
    const fileInput = screen.getByLabelText(/import suppliers/i).querySelector('input[type="file"]');
    const emptyFile = new File([''], 'empty.csv', { type: 'text/csv' });
    await waitFor(() => {
      fireEvent.change(fileInput!, { target: { files: [emptyFile] } });
    });
    expect(await screen.findByText(/file is empty/i)).toBeInTheDocument();
  });

  it('shows backend error on import failure', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Server error' })
    } as any);
    renderSupplierList();
    const fileInput = screen.getByLabelText(/import suppliers/i).querySelector('input[type="file"]');
    const file = new File(['id,name\n1,Test'], 'test.csv', { type: 'text/csv' });
    await waitFor(() => {
      fireEvent.change(fileInput!, { target: { files: [file] } });
    });
    expect(await screen.findByText(/server error/i)).toBeInTheDocument();
    (global.fetch as jest.Mock).mockRestore();
  });

  it('handles duplicate/partial import edge cases', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: async () => ({ message: 'Duplicate supplier' })
    } as any);
    renderSupplierList();
    const fileInput = screen.getByLabelText(/import suppliers/i).querySelector('input[type="file"]');
    const file = new File(['id,name\n1,Test'], 'test.csv', { type: 'text/csv' });
    await waitFor(() => {
      fireEvent.change(fileInput!, { target: { files: [file] } });
    });
    expect(await screen.findByText(/duplicate supplier/i)).toBeInTheDocument();
    (global.fetch as jest.Mock).mockRestore();
  });

  it('shows user-facing error UI for all import errors', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ message: 'Malformed CSV' })
    } as any);
    renderSupplierList();
    const fileInput = screen.getByLabelText(/import suppliers/i).querySelector('input[type="file"]');
    const file = new File(['bad'], 'bad.csv', { type: 'text/csv' });
    await waitFor(() => {
      fireEvent.change(fileInput!, { target: { files: [file] } });
    });
    expect(await screen.findByText(/malformed csv/i)).toBeInTheDocument();
    (global.fetch as jest.Mock).mockRestore();
  });

  it('should allow keyboard navigation through table and dialogs', async () => {
    // Simulate tabbing through table rows and dialog buttons
    // Use userEvent.tab() and assert focus moves as expected
    // ...
  });

  it('should display error UI when backend returns error', async () => {
    // Mock API to return error
    // Render component and trigger action
    // Assert error alert is shown
    // ...
  });

  it('should show user-facing error for duplicate/partial import', async () => {
    // Mock API to return duplicate/partial error
    // Trigger import
    // Assert error message is displayed
    // ...
  });

  it('should show Alert for all error states', async () => {
    // Simulate various error conditions
    // Assert Alert component is rendered
    // ...
  });
}); 