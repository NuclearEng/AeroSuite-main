import { renderHook, act, waitFor } from '@testing-library/react';
import usePagination from '../../hooks/usePagination';

// Define item type to match what the hook will return
interface MockItem {
  id: number;
  name: string;
}

// Mock data for testing
const mockItems: MockItem[] = Array.from({ length: 100 }, (_, i) => ({ 
  id: i + 1, 
  name: `Item ${i + 1}` 
}));

// Mock AbortController for tests
class MockAbortController {
  signal = { aborted: false };
  abort() {
    this.signal.aborted = true;
  }
}

// Set up global mock for AbortController
global.AbortController = MockAbortController as any;

// Clear any previous mock implementations
beforeEach(() => {
  jest.clearAllMocks();
});

describe('usePagination Hook', () => {
  // Setup mock implementation before each test
  beforeEach(() => {
    // Create a fresh mock implementation for each test
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('initializes with default values', async () => {
    // Set up mock implementation specifically for this test
    const mockFetchItems = jest.fn().mockResolvedValue({
      data: mockItems.slice(0, 10),
      total: mockItems.length,
      page: 1,
      pageSize: 10,
      totalPages: Math.ceil(mockItems.length / 10)
    });

    const { result } = renderHook(() => usePagination<MockItem>({ fetchItems: mockFetchItems }));

    // Wait for the initial fetch to complete
    await waitFor(() => {
      return expect(result.current.loading).toBe(false);
    }, { timeout: 5000 });
    
    expect(result.current.page).toBe(1);
    expect(result.current.pageSize).toBe(10);
    expect(result.current.items).toHaveLength(10); // First page of data
    expect(result.current.total).toBe(100); // Total count of items
    expect(result.current.totalPages).toBe(10); // Total pages (100/10)
    expect(mockFetchItems).toHaveBeenCalledWith(1, 10, undefined);
  });

  test('changes page correctly', async () => {
    // Set up mock implementation for this test
    const mockFetchItems = jest.fn()
      // First call returns first page
      .mockResolvedValueOnce({
        data: mockItems.slice(0, 10),
        total: mockItems.length,
        page: 1,
        pageSize: 10,
        totalPages: Math.ceil(mockItems.length / 10)
      })
      // Second call returns second page
      .mockResolvedValueOnce({
        data: mockItems.slice(10, 20),
        total: mockItems.length,
        page: 2,
        pageSize: 10,
        totalPages: Math.ceil(mockItems.length / 10)
      });

    const { result } = renderHook(() => usePagination<MockItem>({ fetchItems: mockFetchItems }));

    // Wait for the initial fetch to complete
    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 5000 });

    // Change page
    act(() => {
      result.current.setPage(2);
    });

    // Wait for the fetch to complete after page change
    await waitFor(() => {
      return expect(result.current.loading).toBe(false);
    }, { timeout: 5000 });

    // Should have second page data
    expect(result.current.page).toBe(2);
    expect(result.current.items[0].id).toBe(11); // First item of second page
    expect(mockFetchItems).toHaveBeenCalledWith(2, 10, undefined);
  });

  test('changes page size correctly', async () => {
    // Set up mock implementation for this test
    const mockFetchItems = jest.fn()
      // First call returns with default page size
      .mockResolvedValueOnce({
        data: mockItems.slice(0, 10),
        total: mockItems.length,
        page: 1,
        pageSize: 10,
        totalPages: Math.ceil(mockItems.length / 10)
      })
      // Second call returns with new page size
      .mockResolvedValueOnce({
        data: mockItems.slice(0, 20),
        total: mockItems.length,
        page: 1,
        pageSize: 20,
        totalPages: Math.ceil(mockItems.length / 20)
      });

    const { result } = renderHook(() => usePagination<MockItem>({ fetchItems: mockFetchItems }));

    // Wait for the initial fetch to complete
    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 5000 });

    // Change page size
    act(() => {
      result.current.setPageSize(20);
    });

    // Wait for the fetch to complete after page size change
    await waitFor(() => {
      return expect(result.current.loading).toBe(false);
    }, { timeout: 5000 });

    // Should have 20 items per page
    expect(result.current.pageSize).toBe(20);
    expect(result.current.items).toHaveLength(20);
    expect(result.current.totalPages).toBe(5); // 100/20
    expect(mockFetchItems).toHaveBeenCalledWith(1, 20, undefined);
  });

  test('applies filters correctly', async () => {
    // Set up mock implementation for this test
    const mockFetchItems = jest.fn()
      // First call returns without filters
      .mockResolvedValueOnce({
        data: mockItems.slice(0, 10),
        total: mockItems.length,
        page: 1,
        pageSize: 10,
        totalPages: Math.ceil(mockItems.length / 10)
      })
      // Second call returns with filters applied
      .mockResolvedValueOnce({
        data: mockItems.slice(0, 10),
        total: mockItems.length,
        page: 1,
        pageSize: 10,
        totalPages: Math.ceil(mockItems.length / 10)
      });

    const { result } = renderHook(() => usePagination<MockItem>({ 
      fetchItems: mockFetchItems,
      debounceTime: 0 // Set debounce time to 0 for testing
    }));

    // Wait for the initial fetch to complete
    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 5000 });

    // Apply filters
    act(() => {
      result.current.setFilters({ status: 'active' });
    });
    
    // Should be loading again
    await waitFor(() => expect(mockFetchItems).toHaveBeenCalledWith(1, 10, { status: 'active' }), { timeout: 5000 });
    
    // Wait for fetch to complete
    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 5000 });

    // Should have filtered data
    expect(result.current.filters).toEqual({ status: 'active' });
    expect(result.current.page).toBe(1); // Should reset to first page
    expect(mockFetchItems).toHaveBeenCalledWith(1, 10, { status: 'active' });
  });

  test('handles refresh correctly', async () => {
    // Set up mock implementation for this test
    const mockFetchItems = jest.fn().mockResolvedValue({
      data: mockItems.slice(0, 10),
      total: mockItems.length,
      page: 1,
      pageSize: 10,
      totalPages: Math.ceil(mockItems.length / 10)
    });

    const { result } = renderHook(() => 
      usePagination<MockItem>({ fetchItems: mockFetchItems })
    );
    
    // Wait for initial fetch to complete
    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 5000 });
    
    // Clear mock to test refresh
    mockFetchItems.mockClear();
    
    // Call refresh
    act(() => {
      result.current.refresh();
    });
    
    // Should be loading again
    expect(result.current.loading).toBe(true);
    
    // Wait for fetch to complete
    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 5000 });
    
    // Should have fetched with same parameters
    expect(mockFetchItems).toHaveBeenCalledTimes(1);
    expect(mockFetchItems).toHaveBeenCalledWith(1, 10, undefined);
  });

  test('initializes with custom values', async () => {
    // Set up mock implementation for this test
    const mockFetchItems = jest.fn().mockResolvedValue({
      data: mockItems.slice(30, 45),
      total: mockItems.length,
      page: 3,
      pageSize: 15,
      totalPages: Math.ceil(mockItems.length / 15)
    });

    const { result } = renderHook(() => 
      usePagination<MockItem>({
        fetchItems: mockFetchItems,
        initialPage: 3,
        initialPageSize: 15,
        initialFilters: { name: 'Item 5' }
      })
    );
    
    // Wait for initial fetch to complete
    await waitFor(() => expect(result.current.loading).toBe(false), { timeout: 5000 });
    
    // Should use custom initial values
    expect(result.current.page).toBe(3);
    expect(result.current.pageSize).toBe(15);
    expect(mockFetchItems).toHaveBeenCalledWith(3, 15, { name: 'Item 5' });
  });
}); 