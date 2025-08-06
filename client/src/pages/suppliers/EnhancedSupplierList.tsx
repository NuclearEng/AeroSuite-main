import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TableSortLabel,
  Toolbar,
  Typography,
  IconButton,
  Tooltip,
  TextField,
  InputAdornment,
  Chip,
  Button,
  Skeleton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Checkbox,
  FormControlLabel,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  GetApp as DownloadIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  CheckBox as CheckBoxIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useSuppliers, useDeleteSupplier, useBulkDeleteSuppliers, usePrefetchSupplier } from '../../hooks/useSupplierData';
import { useDebounce, VirtualList, withPerformance } from '../../components/common/PerformanceWrapper';
import { exportToExcel, exportToPDF } from '../../utils/exportUtils';
import { a11y } from '../../utils/enhance-application';

interface Column {
  id: string;
  label: string;
  align?: 'left' | 'right' | 'center';
  format?: (value: any) => string;
  sortable?: boolean;
}

const columns: Column[] = [
  { id: 'code', label: 'Code', sortable: true },
  { id: 'name', label: 'Name', sortable: true },
  { id: 'industry', label: 'Industry', sortable: true },
  { id: 'primaryContactName', label: 'Contact', sortable: true },
  { id: 'primaryContactEmail', label: 'Email', sortable: true },
  { 
    id: 'status', 
    label: 'Status', 
    sortable: true,
    format: (value) => value.charAt(0).toUpperCase() + value.slice(1),
  },
  { 
    id: 'createdAt', 
    label: 'Created', 
    sortable: true,
    format: (value) => new Date(value).toLocaleDateString(),
  },
];

const EnhancedSupplierList: React.FC = () => {
  const navigate = useNavigate();
  const prefetchSupplier = usePrefetchSupplier();
  
  // State
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderBy, setOrderBy] = useState<string>('name');
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<string | null>(null);
  const [filterMenuAnchor, setFilterMenuAnchor] = useState<null | HTMLElement>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Debounced search
  const debouncedSearch = useDebounce(searchQuery, 300);
  
  // Queries and mutations
  const { 
    data, 
    isLoading, 
    error, 
    refetch 
  } = useSuppliers({
    page: page + 1,
    limit: rowsPerPage,
    search: debouncedSearch,
    status: statusFilter === 'all' ? undefined : statusFilter,
  });
  
  const deleteSupplierMutation = useDeleteSupplier();
  const bulkDeleteMutation = useBulkDeleteSuppliers();
  
  // Memoized values
  const suppliers = useMemo(() => data?.suppliers || [], [data]);
  const totalCount = useMemo(() => data?.total || 0, [data]);
  
  // Handlers
  const handleSort = useCallback((property: string) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  }, [orderBy, order]);
  
  const handleSelectAll = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = new Set(suppliers.map(s => s._id));
      setSelected(newSelected);
      a11y.announce(`Selected all ${suppliers.length} suppliers`);
    } else {
      setSelected(new Set());
      a11y.announce('Deselected all suppliers');
    }
  }, [suppliers]);
  
  const handleSelectOne = useCallback((id: string) => {
    const newSelected = new Set(selected);
    if (newSelected.has(id)) {
      newSelected.delete(id);
      a11y.announce('Supplier deselected');
    } else {
      newSelected.add(id);
      a11y.announce('Supplier selected');
    }
    setSelected(newSelected);
  }, [selected]);
  
  const handleChangePage = useCallback((event: unknown, newPage: number) => {
    setPage(newPage);
  }, []);
  
  const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  }, []);
  
  const handleDelete = useCallback(async () => {
    if (supplierToDelete) {
      await deleteSupplierMutation.mutateAsync(supplierToDelete);
      setDeleteDialogOpen(false);
      setSupplierToDelete(null);
      setSelected(new Set());
    }
  }, [supplierToDelete, deleteSupplierMutation]);
  
  const handleBulkDelete = useCallback(async () => {
    const idsToDelete = Array.from(selected);
    await bulkDeleteMutation.mutateAsync(idsToDelete);
    setBulkDeleteDialogOpen(false);
    setSelected(new Set());
  }, [selected, bulkDeleteMutation]);
  
  const handleExport = useCallback((format: 'excel' | 'pdf') => {
    const dataToExport = selected.size > 0 
      ? suppliers.filter(s => selected.has(s._id))
      : suppliers;
      
    if (format === 'excel') {
      exportToExcel(dataToExport, 'suppliers');
    } else {
      exportToPDF(dataToExport, 'suppliers');
    }
    
    a11y.announce(`Exported ${dataToExport.length} suppliers as ${format}`);
  }, [suppliers, selected]);
  
  const handleRowHover = useCallback((id: string) => {
    // Prefetch supplier data on hover for instant navigation
    prefetchSupplier(id);
  }, [prefetchSupplier]);
  
  // Render loading skeleton
  if (isLoading && suppliers.length === 0) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={64} sx={{ mb: 2 }} />
        <Skeleton variant="rectangular" height={400} />
      </Box>
    );
  }
  
  // Render error state
  if (error) {
    return (
      <Alert 
        severity="error" 
        action={
          <Button color="inherit" size="small" onClick={() => refetch()}>
            Retry
          </Button>
        }
      >
        Failed to load suppliers. Please try again.
      </Alert>
    );
  }
  
  return (
    <Box>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Toolbar
          sx={{
            pl: { sm: 2 },
            pr: { xs: 1, sm: 1 },
            ...(selected.size > 0 && {
              bgcolor: 'action.selected',
            }),
          }}
        >
          {selected.size > 0 ? (
            <Typography
              sx={{ flex: '1 1 100%' }}
              color="inherit"
              variant="subtitle1"
              component="div"
            >
              {selected.size} selected
            </Typography>
          ) : (
            <Typography
              sx={{ flex: '1 1 100%' }}
              variant="h6"
              id="tableTitle"
              component="div"
            >
              Suppliers
            </Typography>
          )}
          
          {selected.size > 0 ? (
            <>
              <Tooltip title="Delete selected">
                <IconButton onClick={() => setBulkDeleteDialogOpen(true)}>
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Export selected">
                <IconButton onClick={() => handleExport('excel')}>
                  <DownloadIcon />
                </IconButton>
              </Tooltip>
            </>
          ) : (
            <>
              <TextField
                variant="outlined"
                size="small"
                placeholder="Search suppliers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
                sx={{ mr: 2, minWidth: 200 }}
                inputProps={{
                  'aria-label': 'Search suppliers',
                }}
              />
              
              <Tooltip title="Filter">
                <IconButton
                  onClick={(e) => setFilterMenuAnchor(e.currentTarget)}
                  aria-label="Filter suppliers"
                >
                  <FilterListIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Refresh">
                <IconButton onClick={() => refetch()} aria-label="Refresh supplier list">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Add supplier">
                <IconButton
                  onClick={() => navigate('/suppliers/create')}
                  color="primary"
                  aria-label="Add new supplier"
                >
                  <AddIcon />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Toolbar>
        
        <TableContainer>
          <Table 
            sx={{ minWidth: 750 }} 
            aria-labelledby="tableTitle"
            aria-label="Suppliers table"
          >
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    color="primary"
                    indeterminate={selected.size > 0 && selected.size < suppliers.length}
                    checked={suppliers.length > 0 && selected.size === suppliers.length}
                    onChange={handleSelectAll}
                    inputProps={{
                      'aria-label': 'select all suppliers',
                    }}
                  />
                </TableCell>
                {columns.map((column) => (
                  <TableCell
                    key={column.id}
                    align={column.align || 'left'}
                    sortDirection={orderBy === column.id ? order : false}
                  >
                    {column.sortable ? (
                      <TableSortLabel
                        active={orderBy === column.id}
                        direction={orderBy === column.id ? order : 'asc'}
                        onClick={() => handleSort(column.id)}
                      >
                        {column.label}
                        {orderBy === column.id && (
                          <Box component="span" sx={{ visuallyHidden: true }}>
                            {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                          </Box>
                        )}
                      </TableSortLabel>
                    ) : (
                      column.label
                    )}
                  </TableCell>
                ))}
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {suppliers.map((supplier) => {
                const isItemSelected = selected.has(supplier._id);
                const labelId = `enhanced-table-checkbox-${supplier._id}`;
                
                return (
                  <TableRow
                    hover
                    onMouseEnter={() => handleRowHover(supplier._id)}
                    role="checkbox"
                    aria-checked={isItemSelected}
                    tabIndex={-1}
                    key={supplier._id}
                    selected={isItemSelected}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        color="primary"
                        checked={isItemSelected}
                        onChange={() => handleSelectOne(supplier._id)}
                        inputProps={{
                          'aria-labelledby': labelId,
                        }}
                      />
                    </TableCell>
                    {columns.map((column) => (
                      <TableCell 
                        key={column.id} 
                        align={column.align || 'left'}
                        onClick={() => navigate(`/suppliers/${supplier._id}`)}
                      >
                        {column.id === 'status' ? (
                          <Chip
                            label={column.format ? column.format(supplier[column.id]) : supplier[column.id]}
                            color={supplier.status === 'active' ? 'success' : 'default'}
                            size="small"
                          />
                        ) : (
                          column.format ? column.format(supplier[column.id]) : supplier[column.id]
                        )}
                      </TableCell>
                    ))}
                    <TableCell align="right">
                      <Tooltip title="View">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/suppliers/${supplier._id}`);
                          }}
                          aria-label={`View ${supplier.name}`}
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/suppliers/${supplier._id}/edit`);
                          }}
                          aria-label={`Edit ${supplier.name}`}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSupplierToDelete(supplier._id);
                            setDeleteDialogOpen(true);
                          }}
                          aria-label={`Delete ${supplier.name}`}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
              {suppliers.length === 0 && !isLoading && (
                <TableRow>
                  <TableCell colSpan={columns.length + 2} align="center">
                    <Typography variant="body2" color="textSecondary">
                      No suppliers found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Rows per page:"
          labelDisplayedRows={({ from, to, count }) =>
            `${from}–${to} of ${count !== -1 ? count : `more than ${to}`}`
          }
        />
      </Paper>
      
      {/* Filter Menu */}
      <Menu
        anchorEl={filterMenuAnchor}
        open={Boolean(filterMenuAnchor)}
        onClose={() => setFilterMenuAnchor(null)}
      >
        <MenuItem 
          onClick={() => {
            setStatusFilter('all');
            setFilterMenuAnchor(null);
          }}
          selected={statusFilter === 'all'}
        >
          All Suppliers
        </MenuItem>
        <MenuItem 
          onClick={() => {
            setStatusFilter('active');
            setFilterMenuAnchor(null);
          }}
          selected={statusFilter === 'active'}
        >
          Active Only
        </MenuItem>
        <MenuItem 
          onClick={() => {
            setStatusFilter('inactive');
            setFilterMenuAnchor(null);
          }}
          selected={statusFilter === 'inactive'}
        >
          Inactive Only
        </MenuItem>
      </Menu>
      
      {/* Delete Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Are you sure you want to delete this supplier? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleDelete} 
            color="error" 
            variant="contained"
            disabled={deleteSupplierMutation.isLoading}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Bulk Delete Dialog */}
      <Dialog
        open={bulkDeleteDialogOpen}
        onClose={() => setBulkDeleteDialogOpen(false)}
        aria-labelledby="bulk-delete-dialog-title"
        aria-describedby="bulk-delete-dialog-description"
      >
        <DialogTitle id="bulk-delete-dialog-title">
          Confirm Bulk Delete
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="bulk-delete-dialog-description">
            Are you sure you want to delete {selected.size} suppliers? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDeleteDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleBulkDelete} 
            color="error" 
            variant="contained"
            disabled={bulkDeleteMutation.isLoading}
          >
            Delete {selected.size} Suppliers
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// Export with performance optimizations
export default withPerformance(EnhancedSupplierList, {
  memoize: true,
  lazyRender: false,
});