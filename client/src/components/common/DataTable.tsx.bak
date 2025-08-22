import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TablePagination,
  Checkbox,
  Paper,
  Typography,
  Toolbar,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  alpha,
  useTheme,
  CircularProgress,
  Skeleton,
  Button,
  Badge,
  Popover,
  FormControl,
  InputLabel,
  Select,
  FormGroup,
  FormControlLabel,
  Switch,
  Collapse,
  SelectChangeEvent,
  ListSubheader,
  Slider,
  Card,
  CardContent,
  Stack } from
'@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  MoreVert as MoreVertIcon,
  Close as ClearIcon,
  Refresh as RefreshIcon,
  CloudDownload as ExportIcon,
  FilterAlt as FilterAltIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  DragHandle as DragHandleIcon,
  ClearAll as ClearAllIcon,
  FileDownload as FileDownloadIcon } from
'@mui/icons-material';
import { visuallyHidden } from '@mui/utils';
import { SkeletonLoader } from './index';
// normalized to MUI transitions; legacy animations removed

// Types
export type Order = 'asc' | 'desc';

export interface HeadCell<T> {
  id: keyof T;
  label: string;
  numeric: boolean;
  disablePadding?: boolean;
  sortable?: boolean;
  width?: string | number;
  format?: (value: any, row?: T) => React.ReactNode;
  align?: 'left' | 'right' | 'center';
  filterable?: boolean;
  filterOptions?: Array<{label: string;value: any;}>;
  resizable?: boolean;
  minWidth?: number;
  maxWidth?: number;
  tooltip?: string;
  cellClassName?: string;
  headerClassName?: string;
}

export interface DataTableProps<T> {
  rows: T[];
  headCells: HeadCell<T>[];
  title?: string;
  loading?: boolean;
  keyField?: keyof T;
  defaultSortBy?: keyof T;
  defaultOrder?: Order;
  selectable?: boolean;
  pagination?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  onRowClick?: (row: T) => void;
  onSelectionChange?: (selectedRows: T[]) => void;
  onDelete?: (selectedRows: T[]) => void;
  onEdit?: (row: T) => void;
  actions?: DataTableAction<T>[];
  emptyStateMessage?: string;
  rowsPerPageOptions?: number[];
  stickyHeader?: boolean;
  maxHeight?: string | number;
  error?: string;
  refetch?: () => void;
  resizableColumns?: boolean;
  columnFiltering?: boolean;
  exportable?: boolean;
  exportFileName?: string;
  exportFormats?: ('csv' | 'excel' | 'json')[];
  onExport?: (format: string, data: T[]) => void;
  rowsExpandable?: boolean;
  renderExpandedRow?: (row: T) => React.ReactNode;
  rowHeight?: 'small' | 'medium' | 'large';
  rowHoverEffect?: boolean;
  rowSelection?: 'single' | 'multiple' | 'none';
  serverSide?: boolean;
  totalCount?: number;
  onPageChange?: (page: number, rowsPerPage: number) => void;
  onSortChange?: (orderBy: keyof T | undefined, order: Order) => void;
  onFilterChange?: (filters: Record<string, any>) => void;
  initialFilters?: Record<string, any>;
  dense?: boolean;
  zebra?: boolean;
  showRowDividers?: boolean;
  highlightOnHover?: boolean;
  verticalAlignMiddle?: boolean;
  wrapHeaderText?: boolean;
  wrapCellText?: boolean;
  footerContent?: React.ReactNode;
  headerContent?: React.ReactNode;
}

export interface DataTableAction<T> {
  label: string;
  icon?: React.ReactNode;
  onClick: (selectedRows: T[]) => void;
  color?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
  showOnlyWhenSelected?: boolean;
  disabled?: boolean;
  tooltip?: string;
}

function DataTable<T extends {[key: string]: any;}>(props: DataTableProps<T>) {
  const {
    rows,
    headCells,
    title = '',
    loading = false,
    keyField = 'id' as keyof T,
    defaultSortBy,
    defaultOrder = 'asc',
    selectable = false,
    pagination = true,
    searchable = true,
    searchPlaceholder = 'Search...',
    onRowClick,
    onSelectionChange,
    onDelete,
    onEdit,
    actions = [],
    emptyStateMessage = 'No data to display',
    rowsPerPageOptions = [10, 25, 50, 100],
    stickyHeader = false,
    maxHeight,
    error,
    refetch,
    resizableColumns = false,
    columnFiltering = false,
    exportable = false,
    exportFileName = 'data-export',
    exportFormats = ['csv', 'excel', 'json'],
    onExport,
    rowsExpandable = false,
    renderExpandedRow,
    rowHeight = 'medium',
    rowHoverEffect = true,
    rowSelection = selectable ? 'multiple' : 'none',
    serverSide = false,
    totalCount,
    onPageChange,
    onSortChange,
    onFilterChange,
    initialFilters = {},
    dense = false,
    zebra = false,
    showRowDividers = false,
    highlightOnHover = true,
    verticalAlignMiddle = true,
    wrapHeaderText = false,
    wrapCellText = false,
    footerContent,
    headerContent
  } = props;

  const theme = useTheme();

  // States
  const [orderBy, setOrderBy] = useState<keyof T | undefined>(defaultSortBy);
  const [order, setOrder] = useState<Order>(defaultOrder);
  const [selected, setSelected] = useState<T[]>([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(rowsPerPageOptions[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [moreActionsRow, setMoreActionsRow] = useState<T | null>(null);

  // New states for enhanced features
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const [filters, setFilters] = useState<Record<string, any>>(initialFilters || {});
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [filterColumn, setFilterColumn] = useState<keyof T | null>(null);
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null);

  // Reset selection when rows change
  useEffect(() => {
    setSelected([]);
  }, [rows]);

  // Update onSortChange callback
  useEffect(() => {
    if (onSortChange && (orderBy !== defaultSortBy || order !== defaultOrder)) {
      onSortChange(orderBy, order);
    }
  }, [orderBy, order, onSortChange]);

  // Update onFilterChange callback
  useEffect(() => {
    if (onFilterChange && Object.keys(filters).length > 0) {
      onFilterChange(filters);
    }
  }, [filters, onFilterChange]);

  // Defensive defaults for rows and headCells
  const safeRows = rows || [];
  const safeHeadCells = headCells || [];

  // Filter rows based on search term and column filters
  const filteredRows = useMemo(() => {
    if (!searchTerm && Object.keys(filters).length === 0) return safeRows;
    return safeRows.filter((row) => {
      // First apply search term filter
      const matchesSearchTerm = !searchTerm || Object.keys(row).some((key) => {
        const value = row[key];
        if (value === null || value === undefined) return false;

        return String(value).toLowerCase().includes(searchTerm.toLowerCase());
      });

      if (!matchesSearchTerm) return false;

      // Then apply column-specific filters
      if (Object.keys(filters).length === 0) return true;

      return Object.entries(filters).every(([key, filterValue]) => {
        const columnKey = key as keyof T;
        const value = row[columnKey];

        if (value === undefined || value === null) return false;

        // Handle different filter types
        if (Array.isArray(filterValue)) {
          // Multi-select filter
          return filterValue.length === 0 || filterValue.includes(value);
        } else if (typeof filterValue === 'object' && filterValue !== null) {
          // Range filter (for numbers or dates)
          const { min, max } = filterValue as {min?: number | string;max?: number | string;};

          if (typeof value === 'number') {
            return (min === undefined || value >= Number(min)) && (
            max === undefined || value <= Number(max));
          } else {
            // Check if value is a date
            const isDate = (val: any): val is Date => Object.prototype.toString.call(val) === '[object Date]';
            const isValidDateString = (val: any): boolean =>
            typeof val === 'string' && !isNaN(Date.parse(val));

            if (isDate(value) || isValidDateString(value)) {
              const dateValue = isDate(value) ? value.getTime() : new Date(value as string).getTime();
              const minDate = min ? new Date(min).getTime() : undefined;
              const maxDate = max ? new Date(max).getTime() : undefined;

              return (minDate === undefined || dateValue >= minDate) && (
              maxDate === undefined || dateValue <= maxDate);
            }
          }

          return false;
        } else {
          // Simple string/value match
          return String(value).toLowerCase().includes(String(filterValue).toLowerCase());
        }
      });
    });
  }, [safeRows, searchTerm, filters]);

  // Sort rows
  const sortedRows = useMemo(() => {
    if (!orderBy) return filteredRows;
    return [...filteredRows].sort((a, b) => {
      const aValue = a[orderBy];
      const bValue = b[orderBy];

      if (aValue === bValue) return 0;

      if (bValue === null || bValue === undefined) return order === 'asc' ? -1 : 1;
      if (aValue === null || aValue === undefined) return order === 'asc' ? 1 : -1;

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return order === 'asc' ?
        aValue.localeCompare(bValue) :
        bValue.localeCompare(aValue);
      }

      return order === 'asc' ?
      aValue < bValue ? -1 : 1 :
      aValue < bValue ? 1 : -1;
    });
  }, [filteredRows, order, orderBy]);

  // Paginate rows
  const paginatedRows = useMemo(() => {
    if (!pagination) return sortedRows;
    return sortedRows.slice(
      page * rowsPerPage,
      page * rowsPerPage + rowsPerPage
    );
  }, [sortedRows, page, rowsPerPage, pagination]);

  // Handle sort request
  const handleRequestSort = (property: keyof T) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  // Handle row selection
  const handleSelect = (row: T) => {
    const selectedIndex = selected.findIndex(
      (r) => r[keyField] === row[keyField]
    );

    let newSelected: T[] = [];

    if (selectedIndex === -1) {
      newSelected = [...selected, row];
    } else {
      newSelected = [
      ...selected.slice(0, selectedIndex),
      ...selected.slice(selectedIndex + 1)];

    }

    setSelected(newSelected);
    if (onSelectionChange) {
      onSelectionChange(newSelected);
    }
  };

  // Handle select all
  const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelected(paginatedRows);
      if (onSelectionChange) {
        onSelectionChange(paginatedRows);
      }
      return;
    }
    setSelected([]);
    if (onSelectionChange) {
      onSelectionChange([]);
    }
  };

  // Handle page change
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Handle search
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchTerm('');
  };

  // Handle row click
  const handleRowClick = (event: React.MouseEvent<HTMLTableRowElement>, row: T) => {
    if (selectable) {
      handleSelect(row);
    } else if (onRowClick) {
      onRowClick(row);
    }
  };

  // Check if row is selected
  const isSelected = (row: T) => {
    return selected.findIndex((r) => r[keyField] === row[keyField]) !== -1;
  };

  // Handle menu open for row actions
  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>, row: T) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setMoreActionsRow(row);
  };

  // Handle menu close
  const handleMenuClose = () => {
    setAnchorEl(null);
    setMoreActionsRow(null);
  };

  // Handle edit action
  const handleEdit = (event: React.MouseEvent<HTMLLIElement>, row: T) => {
    event.stopPropagation();
    if (onEdit) {
      onEdit(row);
    }
    handleMenuClose();
  };

  // Handle delete action
  const handleDelete = () => {
    if (onDelete && selected.length > 0) {
      onDelete(selected);
      setSelected([]);
    }
  };

  // Handle custom action
  const handleAction = (action: DataTableAction<T>) => {
    if (action.onClick) {
      action.onClick(selected);
    }
    handleMenuClose();
  };

  // Handle column resize
  const handleColumnResize = (columnId: keyof T, newWidth: number) => {
    setColumnWidths((prevWidths) => ({
      ...prevWidths,
      [String(columnId)]: Math.max(
        headCells.find((h) => h.id === columnId)?.minWidth || 100,
        Math.min(
          headCells.find((h) => h.id === columnId)?.maxWidth || 500,
          newWidth
        )
      )
    }));
  };

  // Handle column filter open
  const handleFilterOpen = (event: React.MouseEvent<HTMLButtonElement>, columnId: keyof T) => {
    event.stopPropagation();
    setFilterAnchorEl(event.currentTarget);
    setFilterColumn(columnId);
  };

  // Handle column filter close
  const handleFilterClose = () => {
    setFilterAnchorEl(null);
    setFilterColumn(null);
  };

  // Handle column filter apply
  const handleFilterApply = (columnId: keyof T, value: any) => {
    if (value === undefined || value === '' || value === null) {
      const newFilters = { ...filters };
      delete newFilters[String(columnId)];
      setFilters(newFilters);
    } else {
      setFilters((prevFilters) => ({
        ...prevFilters,
        [String(columnId)]: value
      }));
    }

    handleFilterClose();
    setPage(0);
  };

  // Handle filter clear
  const handleFilterClear = (columnId: keyof T) => {
    const newFilters = { ...filters };
    delete newFilters[String(columnId)];
    setFilters(newFilters);
    handleFilterClose();
  };

  // Handle clear all filters
  const handleClearAllFilters = () => {
    setFilters({});
    setPage(0);
  };

  // Handle row expansion toggle
  const handleRowExpand = (rowKey: string) => {
    setExpandedRows((prev) => ({
      ...prev,
      [rowKey]: !prev[rowKey]
    }));
  };

  // Handle export menu open
  const handleExportOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setExportAnchorEl(event.currentTarget);
  };

  // Handle export menu close
  const handleExportClose = () => {
    setExportAnchorEl(null);
  };

  // Handle export
  const handleExport = (format: 'csv' | 'excel' | 'json') => {
    if (onExport) {
      onExport(format, sortedRows);
    } else {
      // Default export implementation
      let content: string = '';
      const fileName = `${exportFileName}.${format === 'excel' ? 'xlsx' : format}`;

      if (format === 'csv') {
        // Generate CSV
        const headers = headCells.map((cell) => cell.label).join(',');
        const rows = sortedRows.map((row) =>
        headCells.map((cell) => {
          const value = row[cell.id];
          return typeof value === 'string' && value.includes(',') ?
          `"${value}"` :
          String(value);
        }).join(',')
        ).join('\n');

        content = `${headers}\n${rows}`;

        // Download file
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else if (format === 'json') {
        // Generate JSON
        content = JSON.stringify(sortedRows, null, 2);

        // Download file
        const blob = new Blob([content], { type: 'application/json' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }

    handleExportClose();
  };

  // Empty rows for pagination
  const emptyRows = pagination ?
  Math.max(0, (1 + page) * rowsPerPage - filteredRows.length) :
  0;

  // Check if no data available
  const noData = !loading && safeRows.length === 0;
  const noResults = !loading && safeRows.length > 0 && filteredRows.length === 0;

  // Export menu
  const exportMenuId = 'data-table-export-menu';

  // Column filter menu
  const filterMenuId = 'data-table-filter-menu';

  return (
    <Paper
      elevation={0}
      sx={{
        width: '100%',
        mb: 2,
        borderRadius: 2,
        overflow: 'hidden',
        border: theme.palette.mode === 'light' ? '1px solid rgba(0,0,0,0.05)' : '1px solid rgba(255,255,255,0.05)'
      }}>

      
      <Toolbar
        sx={{
          pl: { sm: 2 },
          pr: { xs: 1, sm: 1 },
          ...(selected.length > 0 && {
            bgcolor: (theme) =>
            alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.1 : 0.2)
          }),
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>

        
        {selected.length > 0 ?
        <Typography
          sx={{ flex: '1 1 100%' }}
          color="inherit"
          variant="subtitle1"
          component="div">

            {selected.length} selected
          </Typography> :

        <>
            
            {title &&
          <Typography
            sx={{ flex: '1 1 100%', display: { xs: 'none', sm: 'block' } }}
            variant="subtitle1"
            component="div"
            fontWeight={600}>

                {title}
              </Typography>
          }
            
            
            {searchable &&
          <Box sx={{ flex: { xs: '1 1 100%', sm: title ? '0 1 auto' : '1 1 100%' } }}>
                <TextField
              size="small"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={handleSearchChange}
              sx={{
                maxWidth: { xs: '100%', sm: 300 },
                backgroundColor: 'background.paper',
                transition: (theme) => theme.transitions.create(['background-color', 'box-shadow', 'transform'], {
                  duration: theme.transitions.duration.short,
                  easing: theme.transitions.easing.easeInOut,
                }),
                '& .MuiOutlinedInput-root': {
                  borderRadius: 8
                }
              }}
              InputProps={{
                startAdornment:
                <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>,

                endAdornment: searchTerm ?
                <InputAdornment position="end">
                        <IconButton
                    size="small"
                    onClick={handleClearSearch}
                    edge="end"
                    aria-label="clear search">

                          <ClearIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment> :
                null
              }} />

              </Box>
          }
          </>
        }
        
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          
          {columnFiltering && Object.keys(filters).length > 0 &&
          <Tooltip title="Clear all filters">
              <Chip
              label={`${Object.keys(filters).length} filter${Object.keys(filters).length > 1 ? 's' : ''}`}
              size="small"
              onDelete={handleClearAllFilters}
              deleteIcon={<ClearAllIcon />}
              color="primary"
              variant="outlined"
              sx={{ mr: 1 }} />

            </Tooltip>
          }
          
          
          {exportable &&
          <Tooltip title="Export data">
              <IconButton
              size="small"
              aria-controls={exportMenuId}
              aria-haspopup="true"
              onClick={handleExportOpen}>

                <FileDownloadIcon />
              </IconButton>
            </Tooltip>
          }
          
          
          {refetch &&
          <Tooltip title="Refresh">
              <IconButton onClick={refetch} size="small">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          }
          
          
          {selected.length > 0 && onDelete &&
          <Tooltip title="Delete">
              <IconButton onClick={handleDelete} size="small">
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          }
          
          
          {actions.
          filter((action) => !action.showOnlyWhenSelected || selected.length > 0).
          map((action, index) =>
          <Tooltip key={index} title={action.tooltip || action.label}>
                <span>
                  <IconButton
                onClick={() => handleAction(action)}
                size="small"
                disabled={action.disabled}
                color={action.color || 'default'}
                title={action.tooltip || action.label}>

                    {action.icon || <MoreVertIcon />}
                  </IconButton>
                </span>
              </Tooltip>
          )}
        </Box>
      </Toolbar>
      
      
      {headerContent &&
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          {headerContent}
        </Box>
      }
      
      
      {loading &&
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          <CircularProgress role="progressbar" />
        </Box>
      }
      
      
      <TableContainer data-testid="data-table-container" sx={{ maxHeight }}>
        <Table
          stickyHeader={stickyHeader}
          size="medium"
          aria-labelledby="tableTitle">

          
          <TableHead>
            <TableRow>
              
              {selectable &&
              <TableCell padding="checkbox">
                  <Checkbox
                  color="primary"
                  indeterminate={selected.length > 0 && selected.length < paginatedRows.length}
                  checked={paginatedRows.length > 0 && selected.length === paginatedRows.length}
                  onChange={handleSelectAllClick}
                  inputProps={{
                    'aria-label': 'select all'
                  }} />

                </TableCell>
              }
              
              
              {safeHeadCells.map((headCell) => {
                const isFiltered = filters[String(headCell.id)] !== undefined;
                const width = columnWidths[String(headCell.id)] || headCell.width;

                return (
                  <TableCell
                    key={String(headCell.id)}
                    align={headCell.align || (headCell.numeric ? 'right' : 'left')}
                    padding={headCell.disablePadding ? 'none' : 'normal'}
                    sortDirection={orderBy === headCell.id ? order : false}
                    sx={{
                      fontWeight: 600,
                      width: width,
                      minWidth: headCell.minWidth || 100,
                      maxWidth: headCell.maxWidth,
                      whiteSpace: wrapHeaderText ? 'normal' : 'nowrap',
                      position: 'relative',
                      ...(headCell.headerClassName && { className: headCell.headerClassName })
                    }}>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: headCell.align === 'right' ? 'flex-end' : 'flex-start' }}>
                      
                      <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                        {headCell.sortable !== false ?
                        <TableSortLabel
                          active={orderBy === headCell.id}
                          direction={orderBy === headCell.id ? order : 'asc'}
                          onClick={() => handleRequestSort(headCell.id)}>

                            {headCell.tooltip ?
                          <Tooltip title={headCell.tooltip}>
                                <span>{headCell.label}</span>
                              </Tooltip> :

                          <span>{headCell.label}</span>
                          }
                            {orderBy === headCell.id ?
                          <Box component="span" sx={visuallyHidden}>
                                {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                              </Box> :
                          null}
                          </TableSortLabel> :

                        headCell.tooltip ?
                        <Tooltip title={headCell.tooltip}>
                              <span>{headCell.label}</span>
                            </Tooltip> :

                        <span>{headCell.label}</span>

                        }
                      </Box>
                      
                      
                      {columnFiltering && headCell.filterable !== false &&
                      <Tooltip title={isFiltered ? "Filtered" : "Filter"}>
                          <IconButton
                          size="small"
                          onClick={(e) => handleFilterOpen(e, headCell.id)}
                          sx={{ ml: 1 }}
                          color={isFiltered ? "primary" : "default"}>

                            <Badge
                            variant="dot"
                            color="primary"
                            invisible={!isFiltered}>

                              <FilterAltIcon fontSize="small" />
                            </Badge>
                          </IconButton>
                        </Tooltip>
                      }
                    </Box>
                    
                    
                    {resizableColumns && headCell.resizable !== false &&
                    <Box
                      sx={{
                        position: 'absolute',
                        right: 0,
                        top: 0,
                        bottom: 0,
                        width: 8,
                        cursor: 'col-resize',
                        zIndex: 1,
                        '&:hover': {
                          backgroundColor: theme.palette.action.hover
                        },
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onMouseDown={(e) => {
                        const startX = e.clientX;
                        const startWidth = columnWidths[String(headCell.id)] || headCell.width || 150;

                        const handleMouseMove = (moveEvent: MouseEvent) => {
                          const newWidth = Number(startWidth) + moveEvent.clientX - startX;
                          handleColumnResize(headCell.id, newWidth);
                        };

                        const handleMouseUp = () => {
                          document.removeEventListener('mousemove', handleMouseMove);
                          document.removeEventListener('mouseup', handleMouseUp);
                        };

                        document.addEventListener('mousemove', handleMouseMove);
                        document.addEventListener('mouseup', handleMouseUp);
                      }}>

                        <DragHandleIcon
                        fontSize="small"
                        sx={{
                          fontSize: 16,
                          opacity: 0.3,
                          transition: 'opacity 0.2s',
                          ':hover': {
                            opacity: 0.8
                          }
                        }} />

                      </Box>
                    }
                  </TableCell>);

              })}
              
              
              {(onEdit || actions.length > 0) &&
              <TableCell align="right" sx={{ width: 60 }}>
                  Actions
                </TableCell>
              }
            </TableRow>
          </TableHead>
          
          
          <TableBody>
            
            {loading ?
            Array.from({ length: rowsPerPage }).map((_, index) =>
            <TableRow key={index}>
                  {selectable &&
              <TableCell padding="checkbox">
                      <Skeleton variant="rectangular" width={24} height={24} />
                    </TableCell>
              }
                  {safeHeadCells.map((_, cellIndex) =>
              <TableCell key={cellIndex}>
                      <SkeletonLoader width="100%" />
                    </TableCell>
              )}
                  {(onEdit || actions.length > 0) &&
              <TableCell align="right">
                      <Skeleton variant="circular" width={32} height={32} />
                    </TableCell>
              }
                </TableRow>
            ) :

            <>
                
                {error ?
              <TableRow style={{ height: 53 }}>
                    <TableCell
                  colSpan={
                  safeHeadCells.length + (
                  selectable ? 1 : 0) + (
                  onEdit || actions.length > 0 ? 1 : 0)
                  }
                  align="center">

                      <Typography color="error" sx={{ my: 2 }}>
                        {error}
                      </Typography>
                      {refetch &&
                  <Tooltip title="Retry">
                          <IconButton onClick={refetch} size="small">
                            <RefreshIcon />
                          </IconButton>
                        </Tooltip>
                  }
                    </TableCell>
                  </TableRow> :

              <>
                    
                    {noData ?
                <TableRow style={{ height: 53 }}>
                        <TableCell
                    colSpan={
                    safeHeadCells.length + (
                    selectable ? 1 : 0) + (
                    onEdit || actions.length > 0 ? 1 : 0)
                    }
                    align="center">

                          <Typography color="text.secondary" sx={{ my: 2 }}>
                            {emptyStateMessage}
                          </Typography>
                        </TableCell>
                      </TableRow> :
                noResults ?
                <TableRow style={{ height: 53 }}>
                        <TableCell
                    colSpan={
                    safeHeadCells.length + (
                    selectable ? 1 : 0) + (
                    onEdit || actions.length > 0 ? 1 : 0)
                    }
                    align="center">

                          <Typography color="text.secondary" sx={{ my: 2 }}>
                            No results found for "{searchTerm}"
                          </Typography>
                          <Chip
                      label="Clear search"
                      size="small"
                      onClick={handleClearSearch}
                      onDelete={handleClearSearch}
                      deleteIcon={<ClearIcon />}
                      sx={{ mt: 1 }} />

                        </TableCell>
                      </TableRow> :

                <>
                        
                        {paginatedRows.map((row, index) => {
                    const isItemSelected = isSelected(row);
                    const labelId = `enhanced-table-checkbox-${index}`;
                    const rowKey = row[keyField] ? String(row[keyField]) : `row-${index}`;
                    const isExpanded = rowsExpandable && expandedRows[rowKey];

                    return (
                      <React.Fragment key={rowKey}>
                              <TableRow
                          hover={rowHoverEffect}
                          onClick={(event) => handleRowClick(event, row)}
                          role={selectable || rowSelection !== 'none' ? 'checkbox' : undefined}
                          aria-checked={isItemSelected}
                          tabIndex={-1}
                          selected={isItemSelected}
                          sx={{
                            cursor: onRowClick || selectable || rowSelection !== 'none' ? 'pointer' : 'default',
                            transition: (theme) => theme.transitions.create(['opacity', 'transform'], {
                              duration: theme.transitions.duration.shorter,
                              easing: theme.transitions.easing.easeInOut,
                            }),
                            ...(zebra && {
                              '&:nth-of-type(odd)': {
                                bgcolor: theme.palette.mode === 'light' ?
                                'rgba(0, 0, 0, 0.02)' :
                                'rgba(255, 255, 255, 0.02)'
                              }
                            }),
                            ...(highlightOnHover && {
                              '&:hover': {
                                bgcolor: theme.palette.mode === 'light' ?
                                'rgba(0, 0, 0, 0.04)' :
                                'rgba(255, 255, 255, 0.04)'
                              }
                            }),
                            ...(dense && {
                              height: 48
                            }),
                            ...(showRowDividers && {
                              borderBottom: '1px solid',
                              borderColor: 'divider'
                            }),
                            ...(verticalAlignMiddle && {
                              '& .MuiTableCell-root': {
                                verticalAlign: 'middle'
                              }
                            }),
                            ...(wrapCellText && {
                              '& .MuiTableCell-root': {
                                whiteSpace: 'normal',
                                wordWrap: 'break-word'
                              }
                            }),
                            height: rowHeight === 'small' ? 48 : rowHeight === 'large' ? 72 : 'auto'
                          }}>

                                
                                {selectable &&
                          <TableCell padding="checkbox">
                                    <Checkbox
                              color="primary"
                              checked={isItemSelected}
                              inputProps={{
                                'aria-labelledby': labelId
                              }}
                              onClick={(e) => e.stopPropagation()}
                              onChange={() => handleSelect(row)} />

                                  </TableCell>
                          }
                                
                                
                                {safeHeadCells.map((headCell, cellIndex) => {
                            const value = row[headCell.id];
                            const cellContent = headCell.format ?
                            headCell.format(value, row) :
                            value;

                            return (
                              <TableCell
                                key={`${String(headCell.id)}-${cellIndex}`}
                                align={headCell.align || (headCell.numeric ? 'right' : 'left')}
                                padding={headCell.disablePadding ? 'none' : 'normal'}
                                className={headCell.cellClassName}
                                sx={{
                                  ...(wrapCellText && { whiteSpace: 'normal', wordWrap: 'break-word' })
                                }}>

                                      {cellContent}
                                      
                                      
                                      {rowsExpandable && cellIndex === 0 && renderExpandedRow &&
                                <IconButton
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRowExpand(rowKey);
                                  }}
                                  sx={{ ml: 1 }}>

                                          {isExpanded ?
                                  <KeyboardArrowUpIcon fontSize="small" /> :

                                  <KeyboardArrowDownIcon fontSize="small" />
                                  }
                                        </IconButton>
                                }
                                    </TableCell>);

                          })}
                                
                                
                                {(onEdit || actions.length > 0) &&
                          <TableCell align="right">
                                    <IconButton
                              size="small"
                              onClick={(e) => handleMenuOpen(e, row)}
                              sx={{
                                opacity: 0.7,
                                transition: (theme) => theme.transitions.create(['opacity', 'transform'], {
                                  duration: theme.transitions.duration.shorter,
                                  easing: theme.transitions.easing.easeInOut,
                                }),
                                '&:hover': {
                                  opacity: 1
                                }
                              }}>

                                      <MoreVertIcon fontSize="small" />
                                    </IconButton>
                                  </TableCell>
                          }
                              </TableRow>
                              
                              
                              {rowsExpandable && isExpanded && renderExpandedRow &&
                        <TableRow>
                                  <TableCell
                            colSpan={
                            safeHeadCells.length + (
                            selectable ? 1 : 0) + (
                            onEdit || actions.length > 0 ? 1 : 0)
                            }
                            sx={{
                              py: 0,
                              border: 0,
                              backgroundColor: alpha(theme.palette.primary.main, 0.04)
                            }}>

                                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                      <Box sx={{ py: 2, px: 3 }}>
                                        {renderExpandedRow(row)}
                                      </Box>
                                    </Collapse>
                                  </TableCell>
                                </TableRow>
                        }
                            </React.Fragment>);

                  })}
                        
                        
                        {emptyRows > 0 &&
                  <TableRow style={{ height: 53 * emptyRows }}>
                            <TableCell
                      colSpan={
                      safeHeadCells.length + (
                      selectable ? 1 : 0) + (
                      onEdit || actions.length > 0 ? 1 : 0)
                      } />

                          </TableRow>
                  }
                      </>
                }
                  </>
              }
              </>
            }
          </TableBody>
        </Table>
      </TableContainer>
      
      
      {pagination &&
      <nav role="navigation">
          <TablePagination
          rowsPerPageOptions={rowsPerPageOptions}
          component="div"
          count={filteredRows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage} />

        </nav>
      }
      
      
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: 2,
          sx: {
            minWidth: 150,
            maxWidth: 250,
            borderRadius: 2,
            mt: 1
          }
        }}>

        {onEdit && moreActionsRow &&
        <MenuItem onClick={(e) => handleEdit(e, moreActionsRow)}>
            <ListItemIcon>
              <EditIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Edit</ListItemText>
          </MenuItem>
        }
        
        {actions.length > 0 && onEdit && <Divider />}
        
        {actions.map((action, index) =>
        <MenuItem
          key={index}
          onClick={() => {
            if (moreActionsRow) {
              action.onClick([moreActionsRow]);
            }
            handleMenuClose();
          }}
          disabled={action.disabled}>

            {action.icon && <ListItemIcon>{action.icon}</ListItemIcon>}
            <ListItemText>{action.label}</ListItemText>
          </MenuItem>
        )}
      </Menu>
      
      
      <Menu
        id={exportMenuId}
        anchorEl={exportAnchorEl}
        keepMounted
        open={Boolean(exportAnchorEl)}
        onClose={handleExportClose}
        PaperProps={{
          elevation: 2,
          sx: {
            minWidth: 150,
            maxWidth: 250,
            borderRadius: 2,
            mt: 1
          }
        }}>

        <ListSubheader>Export As</ListSubheader>
        {exportFormats.includes('csv') &&
        <MenuItem onClick={() => handleExport('csv')}>
            <ListItemIcon>
              <FileDownloadIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>CSV</ListItemText>
          </MenuItem>
        }
        {exportFormats.includes('excel') &&
        <MenuItem onClick={() => handleExport('excel')}>
            <ListItemIcon>
              <FileDownloadIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Excel</ListItemText>
          </MenuItem>
        }
        {exportFormats.includes('json') &&
        <MenuItem onClick={() => handleExport('json')}>
            <ListItemIcon>
              <FileDownloadIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>JSON</ListItemText>
          </MenuItem>
        }
      </Menu>
      
      
      <Popover
        id={filterMenuId}
        anchorEl={filterAnchorEl}
        keepMounted
        open={Boolean(filterAnchorEl) && filterColumn !== null}
        onClose={handleFilterClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left'
        }}
        PaperProps={{
          elevation: 2,
          sx: {
            minWidth: 250,
            maxWidth: 350,
            p: 2,
            borderRadius: 2,
            mt: 1
          }
        }}>

        {filterColumn &&
        <Box>
            <Typography variant="subtitle2" sx={{ mb: 2 }}>
              Filter by {safeHeadCells.find((h) => h.id === filterColumn)?.label}
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              {(() => {
              // Get column definition
              const column = safeHeadCells.find((h) => h.id === filterColumn);

              if (!column) return null;

              // Get current filter value
              const filterValue = filters[String(filterColumn)];

              // Check for predefined filter options
              if (column.filterOptions) {
                // Show predefined options as checkbox list or select
                return (
                  <FormControl fullWidth size="small">
                      <InputLabel>Select option(s)</InputLabel>
                      <Select
                      multiple
                      value={Array.isArray(filterValue) ? filterValue : filterValue ? [filterValue] : []}
                      onChange={(e: SelectChangeEvent<any>) => {
                        handleFilterApply(filterColumn, e.target.value);
                      }}
                      renderValue={(selected) =>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {(selected as any[]).map((value) => {
                          const option = column.filterOptions?.find((o) => o.value === value);
                          return (
                            <Chip key={String(value)} label={option?.label || value} size="small" />);

                        })}
                          </Box>
                      }>

                        {column.filterOptions.map((option) =>
                      <MenuItem key={String(option.value)} value={option.value}>
                            {option.label}
                          </MenuItem>
                      )}
                      </Select>
                    </FormControl>);

              }

              // Default text filter
              return (
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Filter value..."
                  value={filterValue || ''}
                  onChange={(e) => {
                    // Debounce filter apply
                    if (e.target.value === '') {
                      handleFilterClear(filterColumn);
                    } else {
                      handleFilterApply(filterColumn, e.target.value);
                    }
                  }} />);


            })()}
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mt: 2 }}>
              <Button
              size="small"
              onClick={() => handleFilterClear(filterColumn)}
              disabled={!filters[String(filterColumn)]}>

                Clear
              </Button>
              <Button
              size="small"
              onClick={handleFilterClose}
              variant="contained">

                Close
              </Button>
            </Box>
          </Box>
        }
      </Popover>
      
      
      {footerContent &&
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          {footerContent}
        </Box>
      }
    </Paper>);

}

export default DataTable;