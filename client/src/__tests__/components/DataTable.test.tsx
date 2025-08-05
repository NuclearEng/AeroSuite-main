import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { renderWithProviders } from '../test-utils';
import DataTable from '../../components/common/DataTable';
import type { HeadCell } from '../../components/common/DataTable';

describe('DataTable Component', () => {
  const mockData = [
    { id: 1, name: 'Test Item 1', status: 'active', createdAt: '2023-01-01' },
    { id: 2, name: 'Test Item 2', status: 'inactive', createdAt: '2023-01-02' },
    { id: 3, name: 'Test Item 3', status: 'pending', createdAt: '2023-01-03' },
  ];

  const mockHeadCells: HeadCell<{ id: number; name: string; status: string; createdAt: string; }>[] = [
    { id: 'id', label: 'ID', numeric: true },
    { id: 'name', label: 'Name', numeric: false },
    { id: 'status', label: 'Status', numeric: false },
    { id: 'createdAt', label: 'Created At', numeric: false, format: (value) => new Date(value).toLocaleDateString() },
  ];

  test('renders with data and columns', () => {
    renderWithProviders(
      <DataTable 
        rows={mockData} 
        headCells={mockHeadCells}
        title="Test Table"
      />
    );
    
    // Check title is rendered
    expect(screen.getByText('Test Table')).toBeInTheDocument();
    
    // Check column headers are rendered
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Created At')).toBeInTheDocument();
    
    // Check data is rendered in the table
    expect(screen.getByText('Test Item 1')).toBeInTheDocument();
    expect(screen.getByText('Test Item 2')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
    expect(screen.getByText('inactive')).toBeInTheDocument();
  });

  test('handles empty data state', () => {
    renderWithProviders(
      <DataTable 
        rows={[]} 
        headCells={mockHeadCells}
        title="Empty Table"
        emptyStateMessage="No data available"
      />
    );
    
    expect(screen.getByText('No data available')).toBeInTheDocument();
  });

  test('handles loading state', () => {
    renderWithProviders(
      <DataTable 
        rows={[]} 
        headCells={mockHeadCells}
        title="Loading Table"
        loading={true}
      />
    );
    
    // Should show loading indicator
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('handles row selection', () => {
    const onSelectionChange = jest.fn();
    
    renderWithProviders(
      <DataTable 
        rows={mockData} 
        headCells={mockHeadCells}
        title="Selectable Table"
        selectable={true}
        onSelectionChange={onSelectionChange}
      />
    );
    
    // Find checkboxes
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes.length).toBeGreaterThan(1); // Header + rows
    
    // Select a row
    fireEvent.click(checkboxes[1]); // First row checkbox
    
    // Check that selection handler was called
    expect(onSelectionChange).toHaveBeenCalled();
  });

  test('handles pagination', () => {
    // Create more data to test pagination
    const paginatedData = Array.from({ length: 25 }, (_, i) => ({
      id: i + 1,
      name: `Test Item ${i + 1}`,
      status: i % 2 === 0 ? 'active' : 'inactive',
      createdAt: `2023-01-${(i + 1).toString().padStart(2, '0')}`
    }));
    
    renderWithProviders(
      <DataTable 
        rows={paginatedData} 
        headCells={mockHeadCells}
        title="Paginated Table"
        pagination={true}
      />
    );
    
    // Check pagination controls exist
    const pagination = screen.getByRole('navigation');
    expect(pagination).toBeInTheDocument();
    
    // Should show first 10 items
    expect(screen.getByText('Test Item 1')).toBeInTheDocument();
    expect(screen.getByText('Test Item 10')).toBeInTheDocument();
    expect(screen.queryByText('Test Item 11')).not.toBeInTheDocument();
    
    // Go to next page
    const nextPageButton = within(pagination).getByRole('button', { name: /next page/i });
    fireEvent.click(nextPageButton);
    
    // Now should show items 11-20
    expect(screen.queryByText('Test Item 1')).not.toBeInTheDocument();
    expect(screen.getByText('Test Item 11')).toBeInTheDocument();
    expect(screen.getByText('Test Item 20')).toBeInTheDocument();
  });

  test('handles search functionality', () => {
    renderWithProviders(
      <DataTable 
        rows={mockData} 
        headCells={mockHeadCells}
        title="Searchable Table"
        searchable={true}
      />
    );
    
    // Find search input
    const searchInput = screen.getByPlaceholderText(/search/i);
    expect(searchInput).toBeInTheDocument();
    
    // Search for a specific item
    fireEvent.change(searchInput, { target: { value: 'Test Item 2' } });
    
    // Should filter to show only matching rows
    expect(screen.getByText('Test Item 2')).toBeInTheDocument();
    expect(screen.queryByText('Test Item 1')).not.toBeInTheDocument();
    expect(screen.queryByText('Test Item 3')).not.toBeInTheDocument();
  });

  test('handles custom actions', () => {
    const onActionClick = jest.fn();
    
    renderWithProviders(
      <DataTable 
        rows={mockData} 
        headCells={mockHeadCells}
        title="Table with Actions"
        actions={[
          { 
            label: 'Add',
            icon: 'add', 
            tooltip: 'Add Item',
            onClick: onActionClick
          }
        ]}
      />
    );
    
    // Find action button
    const actionButton = screen.getByTitle('Add Item');
    expect(actionButton).toBeInTheDocument();
    
    // Click action button
    fireEvent.click(actionButton);
    
    // Check handler was called
    expect(onActionClick).toHaveBeenCalled();
  });

  test('handles column sorting', () => {
    renderWithProviders(
      <DataTable 
        rows={mockData} 
        headCells={mockHeadCells}
        title="Sortable Table"
      />
    );
    // Find column headers
    const nameHeader = screen.getByText('Name');
    // Click to sort by name
    fireEvent.click(nameHeader);
    // Check that column header shows sort indicator (aria-sort)
    const headerCell = nameHeader.closest('th');
    expect(headerCell).toHaveAttribute('aria-sort', 'ascending');
  });

  test('applies custom styles', () => {
    renderWithProviders(
      <DataTable 
        rows={mockData} 
        headCells={mockHeadCells}
        title="Styled Table"
        maxHeight="500px"
      />
    );
    const tableContainer = screen.getByTestId('data-table-container');
    expect(tableContainer).toHaveStyle('max-height: 500px');
  });
}); 