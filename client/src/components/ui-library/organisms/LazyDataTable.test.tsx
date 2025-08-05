import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import LazyDataTable from './LazyDataTable';
import { GridColDef, GridRowsProp } from '@mui/x-data-grid';

// Mock the intersection observer
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockImplementation((callback) => {
  return {
    observe: jest.fn((element) => {
      // Simulate the element being visible immediately for testing
      callback([{ isIntersecting: true, target: element }]);
    }),
    unobserve: jest.fn(),
    disconnect: jest.fn(),
  };
});

// Mock the lazy-loaded components
jest.mock('react', () => {
  const originalReact = jest.requireActual('react');
  return {
    ...originalReact,
    lazy: (importFn: () => Promise<any>) => {
      return importFn().then((module: any) => module);
    },
  };
});

// Mock the MUI DataGrid
jest.mock('@mui/x-data-grid', () => ({
  DataGrid: (props: { rows: any[]; columns: any[] }) => (
    <div data-testid="mock-data-grid">
      <div>Rows: {props.rows.length}</div>
      <div>Columns: {props.columns.length}</div>
    </div>
  ),
  GridToolbarContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="mock-toolbar-container">{children}</div>
  ),
  GridToolbarFilterButton: () => <button data-testid="mock-filter-button">Filter</button>,
  GridToolbarExport: () => <button data-testid="mock-export-button">Export</button>,
  GridToolbarDensitySelector: () => <button data-testid="mock-density-button">Density</button>,
}));

describe('LazyDataTable', () => {
  const originalIntersectionObserver = window.IntersectionObserver;

  beforeEach(() => {
    window.IntersectionObserver = mockIntersectionObserver;
  });

  afterEach(() => {
    window.IntersectionObserver = originalIntersectionObserver;
    jest.clearAllMocks();
  });

  const mockRows: GridRowsProp = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
  ];

  const mockColumns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'name', headerName: 'Name', width: 130 },
    { field: 'email', headerName: 'Email', width: 200 },
  ];

  it('renders a skeleton initially when not visible', () => {
    // Override the mock to simulate the element not being visible
    window.IntersectionObserver = jest.fn().mockImplementation((callback) => {
      return {
        observe: jest.fn(),
        unobserve: jest.fn(),
        disconnect: jest.fn(),
      };
    });

    render(
      <LazyDataTable
        rows={mockRows}
        columns={mockColumns}
        title="Test Table"
      />
    );

    // Should find skeleton elements
    expect(screen.getAllByRole('img', { hidden: true })).toHaveLength(6); // 1 header + 5 rows
  });

  it('renders the DataGrid when visible', async () => {
    render(
      <LazyDataTable
        rows={mockRows}
        columns={mockColumns}
        title="Test Table"
      />
    );

    // Check that the title is rendered
    expect(screen.getByText('Test Table')).toBeInTheDocument();

    // Wait for the lazy-loaded component to render
    await waitFor(() => {
      expect(screen.getByTestId('mock-data-grid')).toBeInTheDocument();
    });

    // Check that the data grid received the correct props
    expect(screen.getByText('Rows: 2')).toBeInTheDocument();
    expect(screen.getByText('Columns: 3')).toBeInTheDocument();
  });

  it('renders toolbar components correctly', async () => {
    render(
      <LazyDataTable
        rows={mockRows}
        columns={mockColumns}
      />
    );

    // Wait for the lazy-loaded components to render
    await waitFor(() => {
      expect(screen.getByTestId('mock-filter-button')).toBeInTheDocument();
      expect(screen.getByTestId('mock-export-button')).toBeInTheDocument();
      expect(screen.getByTestId('mock-density-button')).toBeInTheDocument();
    });
  });

  it('respects toolbar disabling props', async () => {
    render(
      <LazyDataTable
        rows={mockRows}
        columns={mockColumns}
        disableColumnFilter={true}
        disableExport={true}
      />
    );

    // Wait for the lazy-loaded components to render
    await waitFor(() => {
      expect(screen.queryByTestId('mock-filter-button')).not.toBeInTheDocument();
      expect(screen.queryByTestId('mock-export-button')).not.toBeInTheDocument();
      expect(screen.getByTestId('mock-density-button')).toBeInTheDocument();
    });
  });

  it('sets up intersection observer with correct threshold', () => {
    render(
      <LazyDataTable
        rows={mockRows}
        columns={mockColumns}
        loadingThreshold={300}
      />
    );

    // Check that IntersectionObserver was called with correct options
    expect(mockIntersectionObserver).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        rootMargin: '300px',
        threshold: 0.1,
      })
    );
  });
}); 