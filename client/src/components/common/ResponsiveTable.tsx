import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Card,
  Box,
  Typography,
  Collapse,
  IconButton,
  useTheme,
  styled,
  alpha,
  Skeleton,
  Pagination,
  TableSortLabel,
  TablePaginationProps } from
'@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import useResponsive from '../../hooks/useResponsive';

// Types for column definitions
export interface TableColumn<T = any> {
  id: string;
  label: React.ReactNode;
  accessor?: (row: T, index: number) => React.ReactNode;
  align?: 'inherit' | 'left' | 'center' | 'right' | 'justify';
  width?: string | number;
  minWidth?: string | number;
  maxWidth?: string | number;
  sortable?: boolean;
  hideMobile?: boolean;
  hideTablet?: boolean;
  format?: (value: any, row: T, index: number) => React.ReactNode;
  cellProps?: React.ComponentProps<typeof TableCell>;
  headerCellProps?: React.ComponentProps<typeof TableCell>;
}

// Types for table props
export interface ResponsiveTableProps<T = any> {
  columns: TableColumn<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string | number;
  onRowClick?: (row: T, index: number) => void;
  loading?: boolean;
  loadingRows?: number;
  emptyMessage?: React.ReactNode;
  stickyHeader?: boolean;
  maxHeight?: string | number;
  hideHeaderOnMobile?: boolean;
  expandable?: boolean;
  renderExpandedRow?: (row: T, index: number) => React.ReactNode;
  initialExpandedRows?: Record<string | number, boolean>;
  cardMode?: boolean;
  pagination?: {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
  sortable?: boolean;
  initialSort?: {field: string;direction: 'asc' | 'desc';};
  onSort?: (field: string, direction: 'asc' | 'desc') => void;
  customRowProps?: (row: T, index: number) => React.ComponentProps<typeof TableRow>;
  zebra?: boolean;
  condensed?: boolean;
  hover?: boolean;
}

// Styled components
const StyledTableContainer = styled(TableContainer)<{maxHeight?: string | number;}>(
  ({ theme, maxHeight }) => ({
    maxHeight: maxHeight || 'none',
    borderRadius: theme.shape.borderRadius,
    boxShadow: 'none'
  })
);

const StyledTable = styled(Table)<{condensed?: boolean;}>(({ theme, condensed }) => ({
  '& .MuiTableCell-root': {
    padding: condensed ? theme.spacing(1, 2) : theme.spacing(1.5, 2)
  }
}));

const MobileCard = styled(Card)(({ theme }) => ({
  marginBottom: theme.spacing(2),
  boxShadow: theme.shadows[1],
  '&:hover': {
    boxShadow: theme.shadows[2]
  }
}));

const MobileCardHeader = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  backgroundColor: alpha(theme.palette.primary.main, 0.05),
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`
}));

const MobileCardBody = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2)
}));

const MobileRow = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  padding: theme.spacing(0.75, 0),
  borderBottom: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
  '&:last-child': {
    borderBottom: 'none'
  }
}));

const MobileLabel = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.secondary,
  fontWeight: 500,
  marginRight: theme.spacing(2),
  minWidth: '120px',
  flexShrink: 0
}));

const MobileValue = styled(Typography)(({ theme }) => ({
  color: theme.palette.text.primary,
  textAlign: 'right',
  wordBreak: 'break-word',
  flex: 1
}));

/**
 * A responsive table component that adapts to different screen sizes.
 * It automatically switches to a card-based layout on mobile devices.
 */
function ResponsiveTable<T extends Record<string, any> = any>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  loading = false,
  loadingRows = 5,
  emptyMessage = 'No data available',
  stickyHeader = false,
  maxHeight,
  hideHeaderOnMobile = false,
  expandable = false,
  renderExpandedRow,
  initialExpandedRows = {},
  cardMode = true,
  pagination,
  sortable = false,
  initialSort,
  onSort,
  customRowProps,
  zebra = true,
  condensed = false,
  hover = true
}: ResponsiveTableProps<T>) {
  const theme = useTheme();
  const { isMobile, isTablet } = useResponsive();
  const [expandedRows, setExpandedRows] = useState<Record<string | number, boolean>>(initialExpandedRows);
  const [sort, setSort] = useState<{field: string;direction: 'asc' | 'desc';} | undefined>(initialSort);

  // Reset expanded rows when data changes
  useEffect(() => {
    if (expandable && data.length > 0) {
      // Keep existing expanded state if the row still exists
      const newExpandedRows: Record<string | number, boolean> = {};
      data.forEach((row, index) => {
        const key = keyExtractor(row, index);
        if (expandedRows[key]) {
          newExpandedRows[key] = true;
        }
      });
      setExpandedRows(newExpandedRows);
    }
  }, [data, expandable, keyExtractor]);

  // Handle row expansion toggle
  const handleExpandRow = (key: string | number) => {
    setExpandedRows((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Handle sort change
  const handleSort = (field: string) => {
    const newDirection =
    sort?.field === field ?
    sort.direction === 'asc' ? 'desc' : 'asc' :
    'asc';

    const newSort = { field, direction: newDirection as 'asc' | 'desc' };
    setSort(newSort);

    if (onSort) {
      onSort(field, newDirection as 'asc' | 'desc');
    }
  };

  // Filter columns based on screen size
  const visibleColumns = columns.filter((column) =>
  !(isMobile && column.hideMobile) &&
  !(isTablet && column.hideTablet)
  );

  // Render loading skeleton
  if (loading) {
    if (isMobile && cardMode) {
      return (
        <Box>
          {Array.from(new Array(loadingRows)).map((_, index) =>
          <MobileCard key={index}>
              <MobileCardHeader>
                <Skeleton variant="text" width="60%" height={24} />
              </MobileCardHeader>
              <MobileCardBody>
                {Array.from(new Array(3)).map((_, i) =>
              <MobileRow key={i}>
                    <Skeleton variant="text" width={100} />
                    <Skeleton variant="text" width={120} />
                  </MobileRow>
              )}
              </MobileCardBody>
            </MobileCard>
          )}
        </Box>);

    }

    return (
      <StyledTableContainer component={Paper} maxHeight={maxHeight}>
        <StyledTable stickyHeader={stickyHeader} condensed={condensed}>
          <TableHead>
            <TableRow>
              {expandable && <TableCell style={{ width: 40 }} />}
              {visibleColumns.map((column) =>
              <TableCell
                key={column.id}
                align={column.align || 'left'}
                style={{
                  width: column.width,
                  minWidth: column.minWidth,
                  maxWidth: column.maxWidth
                }}
                {...column.headerCellProps}>

                  {column.label}
                </TableCell>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from(new Array(loadingRows)).map((_, index) =>
            <TableRow key={index}>
                {expandable &&
              <TableCell>
                    <Skeleton variant="circular" width={24} height={24} />
                  </TableCell>
              }
                {visibleColumns.map((column) =>
              <TableCell key={column.id} align={column.align || 'left'}>
                    <Skeleton variant="text" />
                  </TableCell>
              )}
              </TableRow>
            )}
          </TableBody>
        </StyledTable>
      </StyledTableContainer>);

  }

  // Render empty state
  if (data.length === 0) {
    return (
      <Box sx={{
        textAlign: 'center',
        py: 4,
        bgcolor: 'background.paper',
        borderRadius: 1,
        boxShadow: 1
      }}>
        {typeof emptyMessage === 'string' ?
        <Typography variant="body1" color="text.secondary">
            {emptyMessage}
          </Typography> :

        emptyMessage
        }
      </Box>);

  }

  // Mobile card-based layout
  if (isMobile && cardMode) {
    return (
      <Box>
        {data.map((row, rowIndex) => {
          const rowKey = keyExtractor(row, rowIndex);
          const isExpanded = !!expandedRows[rowKey];

          // Prepare onClick handler if provided
          const handleRowClick = onRowClick ?
          () => onRowClick(row, rowIndex) :
          undefined;

          return (
            <MobileCard
              key={rowKey}
              onClick={handleRowClick}
              sx={{
                cursor: handleRowClick ? 'pointer' : 'default',
                mb: 2
              }}>

              
              {columns[0] &&
              <MobileCardHeader>
                  <Typography variant="subtitle1" component="div">
                    {columns[0].accessor ?
                  columns[0].accessor(row, rowIndex) :
                  String(row[columns[0].id])}
                  </Typography>
                </MobileCardHeader>
              }

              <MobileCardBody>
                
                {visibleColumns.slice(1).map((column) =>
                <MobileRow key={column.id}>
                    <MobileLabel variant="body2">
                      {column.label}
                    </MobileLabel>
                    <MobileValue variant="body2">
                      {column.accessor ?
                    column.accessor(row, rowIndex) :
                    column.format ?
                    column.format(row[column.id], row, rowIndex) :
                    String(row[column.id] ?? '')}
                    </MobileValue>
                  </MobileRow>
                )}

                
                {expandable && renderExpandedRow &&
                <>
                    <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'center',
                      mt: 1,
                      borderTop: 1,
                      borderColor: 'divider',
                      pt: 1
                    }}>

                      <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExpandRow(rowKey);
                      }}>

                        {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                      </IconButton>
                    </Box>
                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                      <Box sx={{ mt: 2 }}>
                        {renderExpandedRow(row, rowIndex)}
                      </Box>
                    </Collapse>
                  </>
                }
              </MobileCardBody>
            </MobileCard>);

        })}

        
        {pagination &&
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Pagination
            count={pagination.totalPages}
            page={pagination.page}
            onChange={(_, page) => pagination.onPageChange(page)}
            color="primary"
            size="small" />

          </Box>
        }
      </Box>);

  }

  // Standard table layout for desktop and tablet
  return (
    <Box>
      <StyledTableContainer component={Paper as any} maxHeight={maxHeight}>
        <StyledTable
          stickyHeader={stickyHeader}
          size={condensed ? 'small' : 'medium'}
          condensed={condensed}>

          {(!isMobile || !hideHeaderOnMobile) &&
          <TableHead>
              <TableRow>
                {expandable && <TableCell style={{ width: 40 }} />}
                {visibleColumns.map((column) =>
              <TableCell
                key={column.id}
                align={column.align || 'left'}
                style={{
                  width: column.width,
                  minWidth: column.minWidth,
                  maxWidth: column.maxWidth
                }}
                sortDirection={sort?.field === column.id ? sort.direction : false}
                {...column.headerCellProps}>

                    {sortable && column.sortable !== false ?
                <TableSortLabel
                  active={sort?.field === column.id}
                  direction={sort?.field === column.id ? sort.direction : 'asc'}
                  onClick={() => handleSort(column.id)}>

                        {column.label}
                      </TableSortLabel> :

                column.label
                }
                  </TableCell>
              )}
              </TableRow>
            </TableHead>
          }
          <TableBody>
            {data.map((row, rowIndex) => {
              const rowKey = keyExtractor(row, rowIndex);
              const isExpanded = !!expandedRows[rowKey];

              // Custom row props
              const rowProps = customRowProps ? customRowProps(row, rowIndex) : {};

              // Background color for zebra striping
              const backgroundColor = zebra && rowIndex % 2 === 1 ?
              alpha(theme.palette.background.default, 0.6) :
              undefined;

              return (
                <React.Fragment key={rowKey}>
                  <TableRow
                    hover={hover}
                    onClick={onRowClick ? () => onRowClick(row, rowIndex) : undefined}
                    sx={{
                      cursor: onRowClick ? 'pointer' : 'inherit',
                      backgroundColor,
                      '&.MuiTableRow-hover:hover': {
                        backgroundColor: hover ?
                        alpha(theme.palette.primary.main, 0.08) :
                        undefined
                      },
                      ...rowProps?.sx
                    }}
                    {...rowProps}>

                    {expandable &&
                    <TableCell>
                        <IconButton
                        aria-label="expand row"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExpandRow(rowKey);
                        }}>

                          {isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                        </IconButton>
                      </TableCell>
                    }
                    
                    {visibleColumns.map((column) =>
                    <TableCell
                      key={column.id}
                      align={column.align || 'left'}
                      {...column.cellProps}>

                        {column.accessor ?
                      column.accessor(row, rowIndex) :
                      column.format ?
                      column.format(row[column.id], row, rowIndex) :
                      String(row[column.id] ?? '')}
                      </TableCell>
                    )}
                  </TableRow>
                  
                  {expandable && renderExpandedRow &&
                  <TableRow>
                      <TableCell
                      style={{ paddingBottom: 0, paddingTop: 0 }}
                      colSpan={visibleColumns.length + 1}>

                        <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                          <Box sx={{ py: 2 }}>
                            {renderExpandedRow(row, rowIndex)}
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  }
                </React.Fragment>);

            })}
          </TableBody>
        </StyledTable>
      </StyledTableContainer>
      
      
      {pagination &&
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
          <Pagination
          count={pagination.totalPages}
          page={pagination.page}
          onChange={(_, page) => pagination.onPageChange(page)}
          color="primary"
          size={isMobile ? 'small' : 'medium'} />

        </Box>
      }
    </Box>);

}

export default ResponsiveTable;