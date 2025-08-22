/**
 * Progressive Table Component
 * 
 * This component implements progressive loading for tables, showing data in stages:
 * 1. Skeleton loading state
 * 2. Low-fidelity data (limited columns, placeholder images)
 * 3. Full-fidelity data (all columns, full images)
 * 
 * Implementation of RF036 - Implement progressive loading strategies
 */

import React, { useState, useEffect } from 'react';
import { Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Box, Typography, LinearProgress } from '@mui/material';
import { useProgressiveLoading } from '../../../utils/progressiveLoading';

// Types
export interface ProgressiveTableColumn<T> {
  id: string;
  label: string;
  render: (row: T) => React.ReactNode;
  priority: 'high' | 'medium' | 'low';
  width?: string | number;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
}

export interface ProgressiveTableProps<T> {
  data: T[];
  columns: ProgressiveTableColumn<T>[];
  isLoading?: boolean;
  error?: Error | null;
  rowsPerPage?: number;
  initialLoadDelay?: number;
  lowFidelityDuration?: number;
  fullFidelityDelay?: number;
  emptyMessage?: string;
  keyExtractor: (item: T) => string | number;
  onRowClick?: (item: T) => void;
  progressiveLoadingEnabled?: boolean;
}

/**
 * Progressive Table Component
 */
export function ProgressiveTable<T>({
  data,
  columns,
  isLoading = false,
  error = null,
  rowsPerPage = 10,
  initialLoadDelay = 0,
  lowFidelityDuration = 500,
  fullFidelityDelay = 200,
  emptyMessage = 'No data available',
  keyExtractor,
  onRowClick,
  progressiveLoadingEnabled = true
}: ProgressiveTableProps<T>) {
  // Sort columns by priority
  const sortedColumns = [...columns].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
  
  // Get high priority columns for low-fidelity view
  const highPriorityColumns = sortedColumns.filter(col => col.priority === 'high');
  
  // Create render functions for each stage
  const renderers = {
    // Skeleton loader
    skeleton: () => (
      <TableContainer component={Paper} sx={{ width: '100%', overflow: 'hidden' }}>
        <LinearProgress />
        <Table>
          <TableHead>
            <TableRow>
              {sortedColumns.map(column => (
                <TableCell key={column.id} align={column.align || 'left'} width={column.width}>
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from({ length: rowsPerPage }).map((_, index: any) => (
              <TableRow key={`skeleton-row-${index}`} hover>
                {sortedColumns.map(column => (
                  <TableCell key={`skeleton-cell-${column.id}-${index}`}>
                    <Skeleton animation="wave" height={24} />
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    ),
    
    // Low-fidelity view (only high priority columns)
    'low-fidelity': () => (
      <TableContainer component={Paper} sx={{ width: '100%', overflow: 'hidden' }}>
        <LinearProgress variant="determinate" value={50} />
        <Table>
          <TableHead>
            <TableRow>
              {highPriorityColumns.map(column => (
                <TableCell key={column.id} align={column.align || 'left'} width={column.width}>
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.length > 0 ? (
              data.slice(0, rowsPerPage).map(row => (
                <TableRow
                  key={keyExtractor(row)}
                  hover
                  onClick={() => onRowClick && onRowClick(row)}
                  sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
                >
                  {highPriorityColumns.map(column => (
                    <TableCell key={`${keyExtractor(row)}-${column.id}`} align={column.align || 'left'}>
                      {column.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={highPriorityColumns.length} align="center">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    ),
    
    // Full-fidelity view (all columns)
    full: () => (
      <TableContainer component={Paper} sx={{ width: '100%', overflow: 'hidden' }}>
        {isLoading && <LinearProgress />}
        <Table>
          <TableHead>
            <TableRow>
              {sortedColumns.map(column => (
                <TableCell key={column.id} align={column.align || 'left'} width={column.width}>
                  {column.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.length > 0 ? (
              data.slice(0, rowsPerPage).map(row => (
                <TableRow
                  key={keyExtractor(row)}
                  hover
                  onClick={() => onRowClick && onRowClick(row)}
                  sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
                >
                  {sortedColumns.map(column => (
                    <TableCell key={`${keyExtractor(row)}-${column.id}`} align={column.align || 'left'}>
                      {column.render(row)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={sortedColumns.length} align="center">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    )
  };
  
  // Use progressive loading if enabled and data is loading
  if (progressiveLoadingEnabled && isLoading) {
    const [stage, renderContent, loadingState] = useProgressiveLoading(renderers, {
      initialDelay: initialLoadDelay,
      minStageDuration: {
        skeleton: 300,
        'low-fidelity': lowFidelityDuration
      },
      stageDelays: {
        'low-fidelity': 0,
        full: fullFidelityDelay
      }
    });
    
    return (
      <Box sx={{ width: '100%' }}>
        {renderContent({})}
        {stage !== 'full' && (
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <Box sx={{ width: '100%', mr: 1 }}>
              <LinearProgress variant="determinate" value={loadingState.progress} />
            </Box>
            <Box sx={{ minWidth: 35 }}>
              <Typography variant="body2" color="text.secondary">{`${Math.round(loadingState.progress)}%`}</Typography>
            </Box>
          </Box>
        )}
      </Box>
    );
  }
  
  // If progressive loading is disabled or there's an error, render the full table directly
  if (error) {
    return (
      <Box sx={{ width: '100%', p: 2, textAlign: 'center' }}>
        <Typography color="error">Error loading data: {error.message}</Typography>
      </Box>
    );
  }
  
  // If not loading, show full table
  return renderers.full({});
}

export default ProgressiveTable; 