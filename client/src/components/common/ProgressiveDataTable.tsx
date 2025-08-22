import React, { useState, useEffect, ReactNode } from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Box,
  Typography,
  CircularProgress,
  Skeleton } from
'@mui/material';
import { useIntersectionProgressiveLoading } from '../../utils/progressiveLoading';

interface Column {
  id: string;
  label: string;
  minWidth?: number;
  align?: 'right' | 'left' | 'center';
  format?: (value: any) => ReactNode;
}

interface ProgressiveDataTableProps<T> {
  columns: Column[];
  data: T[];
  initialBatchSize?: number;
  batchSize?: number;
  height?: string | number;
  loading?: boolean;
  emptyMessage?: string;
  getRowId?: (row: T, index: number) => string | number;
}

/**
 * A data table component that progressively loads rows as the user scrolls
 * to improve performance with large datasets.
 */
export function ProgressiveDataTable<T>({
  columns,
  data,
  initialBatchSize = 20,
  batchSize = 10,
  height = 400,
  loading = false,
  emptyMessage = 'No data available',
  getRowId
}: ProgressiveDataTableProps<T>) {
  // Use our progressive loading hook with intersection observer
  const {
    data: visibleData,
    isLoading,
    loadedAll,
    progress,
    loadedCount,
    totalCount,
    sentinelRef
  } = useIntersectionProgressiveLoading(data, {
    initialBatchSize,
    batchSize,
    onLoadComplete: () => console.log('All data loaded')
  });

  // Function to get cell value by column id
  const getCellValue = (row: T, columnId: string): any => {
    return row[columnId as keyof T];
  };

  // Generate row ID
  const generateRowId = (row: T, index: number): string | number => {
    if (getRowId) {
      return getRowId(row, index);
    }
    return index;
  };

  // Show loading state if data is being loaded initially
  if (loading) {
    return (
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: height }}>
          <Table stickyHeader aria-label="progressive data table">
            <TableHead>
              <TableRow>
                {columns.map((column: any) =>
                <TableCell
                  key={column.id}
                  align={column.align}
                  style={{ minWidth: column.minWidth }}>

                    {column.label}
                  </TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.from(new Array(5)).map((_, index: any) =>
              <TableRow hover tabIndex={-1} key={index}>
                  {columns.map((column: any) =>
                <TableCell key={column.id} align={column.align}>
                      <Skeleton animation="wave" />
                    </TableCell>
                )}
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>);

  }

  // Show empty state if no data
  if (data.length === 0) {
    return (
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: height,
            flexDirection: 'column',
            p: 3
          }}>

          <Typography variant="body1" color="text.secondary">
            {emptyMessage}
          </Typography>
        </Box>
      </Paper>);

  }

  return (
    <Paper sx={{ width: '100%', overflow: 'hidden' }}>
      
      {!loadedAll &&
      <Box sx={{ width: '100%', mb: 1 }}>
          <LinearProgress
          variant="determinate"
          value={progress * 100}
          sx={{ height: 4 }} />

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              {loadedCount} of {totalCount} rows
            </Typography>
          </Box>
        </Box>
      }
      
      <TableContainer sx={{ maxHeight: height }}>
        <Table stickyHeader aria-label="progressive data table">
          <TableHead>
            <TableRow>
              {columns.map((column: any) =>
              <TableCell
                key={column.id}
                align={column.align}
                style={{ minWidth: column.minWidth }}>

                  {column.label}
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleData.map((row, index: any) => {
              const rowId = generateRowId(row, index);

              return (
                <TableRow hover tabIndex={-1} key={rowId}>
                  {columns.map((column: any) => {
                    const value = getCellValue(row, column.id);
                    return (
                      <TableCell key={column.id} align={column.align}>
                        {column.format ? column.format(value) : String(value)}
                      </TableCell>);

                  })}
                </TableRow>);

            })}
            
            
            {!loadedAll &&
            <TableRow ref={sentinelRef as React.RefObject<HTMLTableRowElement>}>
                <TableCell
                colSpan={columns.length}
                align="center"
                sx={{ py: 2 }}>

                  <CircularProgress size={24} sx={{ my: 1 }} />
                </TableCell>
              </TableRow>
            }
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>);

}

export default ProgressiveDataTable;