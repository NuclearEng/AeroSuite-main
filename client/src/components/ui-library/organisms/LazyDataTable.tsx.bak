import React, { lazy, Suspense, useState, useEffect, useRef } from 'react';
import { Box, Paper, Typography, CircularProgress, Skeleton } from '@mui/material';
import {
  GridColDef,
  GridRowsProp } from
'@mui/x-data-grid';

// Lazy load the DataGrid component which is heavy
const LazyDataGrid = lazy(() =>
import('@mui/x-data-grid').then((module) => ({
  default: module.DataGrid
}))
);

// Lazy load the toolbar components
const LazyToolbar = lazy(() =>
import('@mui/x-data-grid').then((module) => {
  const {
    GridToolbarContainer,
    GridToolbarFilterButton,
    GridToolbarExport,
    GridToolbarDensitySelector
  } = module;

  return {
    default: ({
      disableColumnFilter,
      disableDensitySelector,
      disableExport




    }: {disableColumnFilter?: boolean;disableDensitySelector?: boolean;disableExport?: boolean;}) =>
    <GridToolbarContainer>
          {!disableColumnFilter && <GridToolbarFilterButton />}
          {!disableDensitySelector && <GridToolbarDensitySelector />}
          {!disableExport && <GridToolbarExport />}
        </GridToolbarContainer>

  };
})
);

interface LazyDataTableProps {
  rows: GridRowsProp;
  columns: GridColDef[];
  loading?: boolean;
  pageSize?: number;
  title?: string;
  autoHeight?: boolean;
  disableSelectionOnClick?: boolean;
  disableColumnMenu?: boolean;
  disableColumnFilter?: boolean;
  disableDensitySelector?: boolean;
  disableExport?: boolean;
  height?: number | string;
  onRowClick?: (params: any) => void;
  loadingThreshold?: number; // Threshold in pixels for intersection observer
}

/**
 * LazyDataTable - A performance optimized data table that uses lazy loading
 * and intersection observer to only load when visible in the viewport
 */
const LazyDataTable: React.FC<LazyDataTableProps> = ({
  rows,
  columns,
  loading = false,
  pageSize = 10,
  title,
  autoHeight = true,
  disableSelectionOnClick = true,
  disableColumnMenu = false,
  disableColumnFilter = false,
  disableDensitySelector = false,
  disableExport = false,
  height = 400,
  onRowClick,
  loadingThreshold = 200
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only set up the intersection observer if the component isn't already visible
    if (!isVisible) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          // When the component comes into view
          if (entry.isIntersecting) {
            setIsVisible(true);
            // Once we've determined it's visible, no need to keep observing
            if (containerRef.current) {
              observer.unobserve(containerRef.current);
            }
          }
        },
        {
          // Start loading the component when it's within loadingThreshold pixels of the viewport
          rootMargin: `${loadingThreshold}px`,
          threshold: 0.1
        }
      );

      if (containerRef.current) {
        observer.observe(containerRef.current);
      }

      return () => {
        if (containerRef.current) {
          observer.unobserve(containerRef.current);
        }
      };
    }
    return undefined;
  }, [isVisible, loadingThreshold]);

  // Handle component loaded event
  const handleComponentLoaded = () => {
    setIsLoaded(true);
  };

  // Render a skeleton placeholder while the component is loading
  const RenderSkeleton = () =>
  <Box sx={{ width: '100%' }}>
      <Skeleton variant="rectangular" height={56} animation="wave" />
      {Array.from({ length: Math.min(5, pageSize) }).map((_, i) =>
    <Skeleton key={i} variant="rectangular" height={52} animation="wave" sx={{ mt: 0.5 }} />
    )}
    </Box>;


  return (
    <Paper elevation={1} sx={{ p: 2 }} ref={containerRef}>
      {title &&
      <Box mb={2}>
          <Typography variant="h6">{title}</Typography>
        </Box>
      }
      <Box sx={{ height: autoHeight ? 'auto' : height, width: '100%' }}>
        {!isVisible ?
        // Show skeleton while not in viewport
        RenderSkeleton() :

        <Suspense
          fallback={
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
                <CircularProgress />
              </Box>
          }>

            <LazyDataGrid
            rows={rows}
            columns={columns}
            loading={loading}
            initialState={{
              pagination: {
                paginationModel: { pageSize, page: 0 }
              }
            }}
            pageSizeOptions={[5, 10, 25, 50, 100]}
            disableRowSelectionOnClick={disableSelectionOnClick}
            disableColumnMenu={disableColumnMenu}
            autoHeight={autoHeight}
            slots={{
              toolbar: () =>
              <Suspense fallback={<Box sx={{ height: 40 }} />}>
                    <LazyToolbar
                  disableColumnFilter={disableColumnFilter}
                  disableDensitySelector={disableDensitySelector}
                  disableExport={disableExport} />

                  </Suspense>

            }}
            onRowClick={onRowClick}
            componentsProps={{
              basePopper: {
                sx: {
                  // Ensure popper elements (like filters) have proper z-index
                  zIndex: 1300
                }
              }
            }}
            onStateChange={() => {
              if (!isLoaded) handleComponentLoaded();
            }} />

          </Suspense>
        }
      </Box>
    </Paper>);

};

export default LazyDataTable;