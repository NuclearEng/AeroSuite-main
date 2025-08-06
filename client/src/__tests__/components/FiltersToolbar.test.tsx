import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../test-utils';
import FiltersToolbar from '../../components/common/FiltersToolbar';
import { FilterDefinition, FilterType } from '../../components/common/FiltersToolbar';

describe('FiltersToolbar Component', () => {
  const mockFilters: FilterDefinition[] = [
    {
      id: 'status',
      label: 'Status',
      type: 'select' as FilterType,
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'pending', label: 'Pending' }
      ]
    },
    {
      id: 'category',
      label: 'Category',
      type: 'multiselect' as FilterType,
      options: [
        { value: 'category1', label: 'Category 1' },
        { value: 'category2', label: 'Category 2' },
        { value: 'category3', label: 'Category 3' }
      ]
    },
    {
      id: 'dateRange',
      label: 'Date Range',
      type: 'daterange' as FilterType
    },
    {
      id: 'search',
      label: 'Search',
      type: 'text' as FilterType,
      },
    {
      id: 'isVerified',
      label: 'Verified',
      type: 'boolean' as FilterType
    }
  ];

  test('renders filters correctly', () => {
    renderWithProviders(
      <FiltersToolbar filters={mockFilters}
        onFilterChange={() = as any> {}}
      />
    );
    
    // Check that all filter labels are rendered
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Date Range')).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.getByText('Verified')).toBeInTheDocument();
    
    // Check that filter inputs are rendered
    expect(screen.getByLabelText('Status')).toBeInTheDocument();
    expect(screen.getByLabelText('Category')).toBeInTheDocument();
    expect(screen.getByLabelText('Search')).toBeInTheDocument();
    expect(screen.getByLabelText('Verified')).toBeInTheDocument();
  });

  test('handles text filter change', async () => {
    const handleFilterChange = jest.fn();
    
    renderWithProviders(
      <FiltersToolbar filters={mockFilters}
        onFilterChange={handleFilterChange}
      / as any>
    );
    
    // Find and change the text filter
    const searchInput = screen.getByLabelText('Search');
    fireEvent.change(searchInput, { target: { value: 'Test Query' } });
    
    // Check that onFilterChange was called with the correct filter value
    await waitFor(() => {
      expect(handleFilterChange).toHaveBeenCalledWith(expect.objectContaining({
        search: 'Test Query'
      }));
    });
  });

  test('handles select filter change', async () => {
    const handleFilterChange = jest.fn();
    
    renderWithProviders(
      <FiltersToolbar filters={mockFilters}
        onFilterChange={handleFilterChange}
      / as any>
    );
    
    // Find and open the select dropdown
    const statusSelect = screen.getByLabelText('Status');
    fireEvent.mouseDown(statusSelect);
    
    // Select an option
    const activeOption = await screen.findByText('Active');
    fireEvent.click(activeOption);
    
    // Check that onFilterChange was called with the correct filter value
    await waitFor(() => {
      expect(handleFilterChange).toHaveBeenCalledWith(expect.objectContaining({
        status: 'active'
      }));
    });
  });

  test('handles multiselect filter change', async () => {
    const handleFilterChange = jest.fn();
    
    renderWithProviders(
      <FiltersToolbar filters={mockFilters}
        onFilterChange={handleFilterChange}
      / as any>
    );
    
    // Find and open the multiselect dropdown
    const categorySelect = screen.getByLabelText('Category');
    fireEvent.mouseDown(categorySelect);
    
    // Select multiple options
    const option1 = await screen.findByText('Category 1');
    fireEvent.click(option1);
    
    const option3 = await screen.findByText('Category 3');
    fireEvent.click(option3);
    
    // Check that onFilterChange was called with the correct filter values
    await waitFor(() => {
      expect(handleFilterChange).toHaveBeenCalledWith(expect.objectContaining({
        category: expect.arrayContaining(['category1', 'category3'])
      }));
    });
  });

  test('handles boolean filter change', async () => {
    const handleFilterChange = jest.fn();
    
    renderWithProviders(
      <FiltersToolbar filters={mockFilters}
        onFilterChange={handleFilterChange}
      / as any>
    );
    
    // Find and click the boolean filter
    const verifiedCheckbox = screen.getByLabelText('Verified');
    fireEvent.click(verifiedCheckbox);
    
    // Check that onFilterChange was called with the correct filter value
    await waitFor(() => {
      expect(handleFilterChange).toHaveBeenCalledWith(expect.objectContaining({
        isVerified: true
      }));
    });
    
    // Click again to toggle off
    fireEvent.click(verifiedCheckbox);
    
    // Check that onFilterChange was called with the updated filter value
    await waitFor(() => {
      expect(handleFilterChange).toHaveBeenCalledWith(expect.objectContaining({
        isVerified: false
      }));
    });
  });

  test('handles filter clear', async () => {
    const handleFilterChange = jest.fn();
    
    renderWithProviders(
      <FiltersToolbar filters={mockFilters}
        onFilterChange={handleFilterChange}
        showFilterButton={true}
      / as any>
    );
    
    // Set some filters first
    const searchInput = screen.getByLabelText('Search');
    fireEvent.change(searchInput, { target: { value: 'Test Query' } });
    
    // Find and click the clear button
    const clearButton = screen.getByRole('button', { name: /clear/i });
    expect(clearButton).toBeInTheDocument();
    
    fireEvent.click(clearButton);
    
    // Check that onFilterChange was called with empty filters
    await waitFor(() => {
      expect(handleFilterChange).toHaveBeenCalledWith({});
    });
  });

  test('handles initial filter values', async () => {
    const initialFilters = {
      status: 'active',
      search: 'Initial Query',
      isVerified: true
    };
    
    renderWithProviders(
      <FiltersToolbar filters={mockFilters}
        initialValues={initialFilters}
        onFilterChange={() = as any> {}}
      />
    );
    
    // Check that initial values are set correctly
    const statusSelect = screen.getByLabelText('Status');
    expect(statusSelect).toHaveTextContent('Active');
    
    const searchInput = screen.getByLabelText('Search');
    expect(searchInput).toHaveValue('Initial Query');
    
    const verifiedCheckbox = screen.getByLabelText('Verified');
    expect(verifiedCheckbox).toBeChecked();
  });

  test('displays active filter count', () => {
    const initialFilters = {
      status: 'active',
      category: ['category1', 'category2'],
      isVerified: true
    };
    
    renderWithProviders(
      <FiltersToolbar filters={mockFilters}
        initialValues={initialFilters}
        onFilterChange={() = as any> {}}
        showFilterCount={true}
      />
    );
    
    // Check that active filter count is displayed (3 active filters)
    expect(screen.getByText('3 active filters')).toBeInTheDocument();
  });

  test('renders in compact mode', () => {
    const { container } = renderWithProviders(
      <FiltersToolbar filters={mockFilters}
        onFilterChange={() = as any> {}}
        compact={true}
      />
    );
    
    // In compact mode, filters are typically shown in a dropdown or collapsed view
    const filtersButton = screen.getByRole('button', { name: /filters/i });
    expect(filtersButton).toBeInTheDocument();
    
    // Filters should not be visible until expanded
    expect(screen.queryByLabelText('Status')).not.toBeInTheDocument();
    
    // Click to expand filters
    fireEvent.click(filtersButton);
    
    // Now filters should be visible
    expect(screen.getByLabelText('Status')).toBeInTheDocument();
  });

  test('applies custom styles', () => {
    const { container } = renderWithProviders(
      <FiltersToolbar filters={mockFilters}
        onFilterChange={() = as any> {}}
        sx={{ backgroundColor: 'rgb(240, 240, 240)', padding: '16px' }}
      />
    );
    
    // Check that custom styles are applied
    expect(container.firstChild).toHaveStyle('background-color: rgb(240, 240, 240)');
    expect(container.firstChild).toHaveStyle('padding: 16px');
  });
}); 