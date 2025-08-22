import React, { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

interface VirtualizedListProps<T> {
  // Array of items to render
  items: T[];
  // Function to render each item
  renderItem: (item: T, index: number) => React.ReactNode;
  // Height of each item in pixels
  itemHeight: number;
  // Total height of the list container
  containerHeight: number;
  // Optional loading state
  loading?: boolean;
  // Optional error state
  error?: Error | null;
  // Optional empty state message
  emptyMessage?: string;
  // Optional error message
  errorMessage?: string;
  // Optional function to get a unique key for each item
  getItemKey?: (item: T, index: number) => string | number;
  // Optional class name for the container
  className?: string;
  // Optional onScroll handler
  onScroll?: (scrollTop: number) => void;
  // Optional buffer size (how many items to render above/below visible area)
  buffer?: number;
  // Optional loading more state
  loadingMore?: boolean;
  // Optional function to load more items when scrolling to bottom
  onLoadMore?: () => void;
  // Optional threshold percentage from bottom to trigger load more
  loadMoreThreshold?: number;
  // Optional aria label for accessibility
  ariaLabel?: string;
}

/**
 * A memory-efficient virtualized list component that only renders
 * items that are visible in the viewport plus a buffer.
 */
function VirtualizedList<T>({
  items,
  renderItem,
  itemHeight,
  containerHeight,
  loading = false,
  error = null,
  emptyMessage = 'No items to display',
  errorMessage = 'Error loading items',
  getItemKey = (_, index) => index,
  className = '',
  onScroll,
  buffer = 5,
  loadingMore = false,
  onLoadMore,
  loadMoreThreshold = 90,
  ariaLabel = 'Virtualized list'
}: VirtualizedListProps<T>) {
  // References for the scroll container
  const containerRef = useRef<HTMLDivElement>(null);

  // Current scroll position
  const [scrollTop, setScrollTop] = useState(0);

  // Calculate total height of all items
  const totalHeight = items.length * itemHeight;

  // Calculate which items should be visible with memoization
  const { startIndex, endIndex, visibleItems } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - buffer);
    const end = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + buffer
    );

    return {
      startIndex: start,
      endIndex: end,
      visibleItems: items.slice(start, end + 1)
    };
  }, [items, scrollTop, itemHeight, containerHeight, buffer]);

  // Handle scroll events
  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      const newScrollTop = containerRef.current.scrollTop;
      setScrollTop(newScrollTop);

      // Call onScroll callback if provided
      if (onScroll) {
        onScroll(newScrollTop);
      }

      // Check if we need to load more items
      if (onLoadMore && !loadingMore) {
        const scrollPosition = newScrollTop + containerHeight;
        const scrollThreshold = totalHeight * loadMoreThreshold / 100;

        if (scrollPosition >= scrollThreshold) {
          onLoadMore();
        }
      }
    }
  }, [containerHeight, onScroll, onLoadMore, loadingMore, totalHeight, loadMoreThreshold]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const currentScrollTop = container.scrollTop;

    switch (e.key) {
      case 'ArrowDown':
        container.scrollTop = currentScrollTop + itemHeight;
        e.preventDefault();
        break;
      case 'ArrowUp':
        container.scrollTop = currentScrollTop - itemHeight;
        e.preventDefault();
        break;
      case 'PageDown':
        container.scrollTop = currentScrollTop + containerHeight;
        e.preventDefault();
        break;
      case 'PageUp':
        container.scrollTop = currentScrollTop - containerHeight;
        e.preventDefault();
        break;
      case 'Home':
        container.scrollTop = 0;
        e.preventDefault();
        break;
      case 'End':
        container.scrollTop = totalHeight - containerHeight;
        e.preventDefault();
        break;
    }
  }, [itemHeight, containerHeight, totalHeight]);

  // Set up scroll listener
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => {
        container.removeEventListener('scroll', handleScroll);
      };
    }
  }, [handleScroll]);

  // Determine what to render based on state
  let content;

  if (loading && items.length === 0) {
    // Show loading state if no items yet
    content =
    <Box
      sx={{
        height: containerHeight,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
      }}
      role="status"
      aria-live="polite">

        <CircularProgress />
        <Typography sx={{ mt: 2 }}>Loading items...</Typography>
      </Box>;

  } else if (error) {
    // Show error state
    content =
    <Box
      sx={{
        height: containerHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'error.main'
      }}
      role="alert">

        <Typography color="error">{errorMessage}: {error.message}</Typography>
      </Box>;

  } else if (items.length === 0) {
    // Show empty state
    content =
    <Box
      sx={{
        height: containerHeight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      role="status">

        <Typography color="text.secondary">{emptyMessage}</Typography>
      </Box>;

  } else {
    // Render virtualized list
    content =
    <div
      ref={containerRef}
      style={{
        height: containerHeight,
        overflow: 'auto',
        position: 'relative',
        willChange: 'transform', // Optimize rendering
        outline: 'none' // Remove focus outline but keep focusable
      }}
      className={className}
      role="list"
      aria-label={ariaLabel}
      tabIndex={0}
      onKeyDown={handleKeyDown}>

        <div
        style={{
          height: totalHeight,
          position: 'relative'
        }}>

          {visibleItems.map((item, localIndex) => {
          const index = startIndex + localIndex;
          const key = getItemKey(item, index);

          return (
            <div
              key={key}
              style={{
                position: 'absolute',
                top: index * itemHeight,
                left: 0,
                right: 0,
                height: itemHeight
              }}
              role="listitem"
              aria-posinset={index + 1}
              aria-setsize={items.length}>

                {renderItem(item, index)}
              </div>);

        })}
        </div>
        
        
        {loadingMore &&
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'center',
          padding: 2
        }}
        role="status"
        aria-live="polite">

            <CircularProgress size={24} />
          </Box>
      }
      </div>;

  }

  return content;
}

// Add custom comparison function for memoization
function areEqual<T>(prevProps: VirtualizedListProps<T>, nextProps: VirtualizedListProps<T>): boolean {
  return (
    prevProps.items === nextProps.items &&
    prevProps.loading === nextProps.loading &&
    prevProps.error === nextProps.error &&
    prevProps.loadingMore === nextProps.loadingMore &&
    prevProps.containerHeight === nextProps.containerHeight);

}

export default memo(VirtualizedList, areEqual) as typeof VirtualizedList;