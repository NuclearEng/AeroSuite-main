import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Menu,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Alert,
  LinearProgress,
  Grid
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Assignment as AssignmentIcon,
  Schedule as ScheduleIcon,
  Business as BusinessIcon,
  Factory as FactoryIcon,
  MoreVert as MoreVertIcon,
  Close as CloseIcon,
  Sort as SortIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import MockDataService from '../../services/mockDataService';
import type { Inspection, Customer, Supplier } from '../../services/mockDataService';

interface FilterState {
  search: string;
  status: string;
  customer: string;
  supplier: string;
  dateRange: string;
}

// Status chip component
const StatusChip = ({ status }: { status: string }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'scheduled':
        return { color: 'info', label: 'Scheduled' };
      case 'in-progress':
        return { color: 'warning', label: 'In Progress' };
      case 'completed':
        return { color: 'success', label: 'Completed' };
      case 'cancelled':
        return { color: 'error', label: 'Cancelled' };
      default:
        return { color: 'default', label: status };
    }
  };

  const config = getStatusConfig(status);
  return (
    <Chip
      label={config.label}
      color={config.color as 'info' | 'warning' | 'success' | 'error' | 'default'}
      size="small"
    />
  );
};

// Result chip
const ResultChip = ({ result }: { result: string }) => {
  const getResultConfig = (result: string) => {
    switch (result) {
      case 'pass':
        return { color: 'success', label: 'Pass' };
      case 'fail':
        return { color: 'error', label: 'Fail' };
      case 'conditional':
        return { color: 'warning', label: 'Conditional' };
      case 'pending':
        return { color: 'default', label: 'Pending' };
      default:
        return { color: 'default', label: result };
    }
  };

  const config = getResultConfig(result);
  return (
    <Chip
      label={config.label}
      color={config.color as 'success' | 'error' | 'warning' | 'default'}
      size="small"
    />
  );
};

// Priority chip
const PriorityChip = ({ priority }: { priority?: string }) => {
  if (!priority) return null;
  
  const getPriorityConfig = (priority: string) => {
    switch (priority) {
      case 'high':
        return { color: 'error', label: 'High' };
      case 'medium':
        return { color: 'warning', label: 'Medium' };
      case 'low':
        return { color: 'success', label: 'Low' };
      default:
        return { color: 'default', label: priority };
    }
  };

  const config = getPriorityConfig(priority);
  return (
    <Chip
      label={config.label}
      color={config.color as 'success' | 'error' | 'warning' | 'default'}
      size="small"
    />
  );
};

// Format date for display
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString();
};

const InspectionList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [filteredInspections, setFilteredInspections] = useState<Inspection[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Filtering
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    status: queryParams.get('status') || 'all',
    customer: queryParams.get('customer') || 'all',
    supplier: queryParams.get('supplier') || 'all',
    dateRange: 'all'
  });
  
  // Sorting
  const [sortField, setSortField] = useState<keyof Inspection>('scheduledDate');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    // Initialize mock data service
    MockDataService.initialize();
    
    // Load data
    const allInspections = MockDataService.getInspections();
    setInspections(allInspections);
    setCustomers(MockDataService.getCustomers());
    setSuppliers(MockDataService.getSuppliers());
    
    setLoading(false);
  }, []);

  // Apply filters and sorting whenever data changes
  useEffect(() => {
    let result = [...inspections];
    
    // Apply filters
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        inspection => 
          inspection.title.toLowerCase().includes(searchLower) ||
          inspection.inspectionNumber.toLowerCase().includes(searchLower) ||
          inspection.customer.name.toLowerCase().includes(searchLower) ||
          inspection.supplier.name.toLowerCase().includes(searchLower) ||
          (inspection.partNumber && inspection.partNumber.toLowerCase().includes(searchLower))
      );
    }
    
    if (filters.status !== 'all') {
      result = result.filter(inspection => inspection.status === filters.status);
    }
    
    if (filters.customer !== 'all') {
      result = result.filter(inspection => inspection.customer._id === filters.customer);
    }
    
    if (filters.supplier !== 'all') {
      result = result.filter(inspection => inspection.supplier._id === filters.supplier);
    }
    
    if (filters.dateRange !== 'all') {
      const now = new Date();
      let startDate: Date;
      
      switch (filters.dateRange) {
        case 'today':
          startDate = new Date(now.setHours(0, 0, 0, 0));
          result = result.filter(inspection => new Date(inspection.scheduledDate) >= startDate);
          break;
        case 'week':
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
          result = result.filter(inspection => new Date(inspection.scheduledDate) >= startDate);
          break;
        case 'month':
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 1);
          result = result.filter(inspection => new Date(inspection.scheduledDate) >= startDate);
          break;
        default:
          break;
      }
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let valueA: any;
      let valueB: any;
      
      // Handle nested properties and date conversions
      if (sortField === 'customer') {
        valueA = a.customer.name;
        valueB = b.customer.name;
      } else if (sortField === 'supplier') {
        valueA = a.supplier.name;
        valueB = b.supplier.name;
      } else if (['scheduledDate', 'startDate', 'completionDate'].includes(sortField)) {
        valueA = a[sortField] ? new Date(a[sortField] as string).getTime() : 0;
        valueB = b[sortField] ? new Date(b[sortField] as string).getTime() : 0;
      } else {
        valueA = a[sortField] || '';
        valueB = b[sortField] || '';
      }
      
      if (valueA < valueB) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (valueA > valueB) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });
    
    setFilteredInspections(result);
    
    // Reset to first page when filters change
    setPage(0);
  }, [inspections, filters, sortField, sortDirection]);

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleFilterChange = (name: keyof FilterState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSort = (field: keyof Inspection) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: keyof Inspection) => {
    if (field !== sortField) return null;
    
    return (
      <SortIcon
        fontSize="small"
        sx={{
          ml: 0.5,
          transform: sortDirection === 'desc' ? 'rotate(180deg)' : 'none'
        }}
      />
    );
  };

  return (
    <Box>
      {/* Page header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Inspections
        </Typography>
        <Box>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<TrendingUpIcon />}
            onClick={() => navigate('/inspections/dashboard')}
            sx={{ mr: 2 }}
          >
            View Dashboard
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/inspections/schedule')}
          >
            Schedule Inspection
          </Button>
        </Box>
      </Box>

      {/* Filter and search card */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}>
            <TextField
              fullWidth
              placeholder="Search inspections..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                )
              }}
              size="small"
            />
          </Grid>
          
          <Grid sx={{ gridColumn: { xs: 'span 6', md: 'span 2' } }}>
            <FormControl fullWidth size="small">
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="scheduled">Scheduled</MenuItem>
                <MenuItem value="in-progress">In Progress</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="cancelled">Cancelled</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid sx={{ gridColumn: { xs: 'span 6', md: 'span 2' } }}>
            <FormControl fullWidth size="small">
              <InputLabel id="date-filter-label">Date Range</InputLabel>
              <Select
                labelId="date-filter-label"
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                label="Date Range"
              >
                <MenuItem value="all">All Dates</MenuItem>
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="week">Last 7 Days</MenuItem>
                <MenuItem value="month">Last 30 Days</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid sx={{ gridColumn: { xs: 'span 6', md: 'span 2' } }}>
            <FormControl fullWidth size="small">
              <InputLabel id="customer-filter-label">Customer</InputLabel>
              <Select
                labelId="customer-filter-label"
                value={filters.customer}
                onChange={(e) => handleFilterChange('customer', e.target.value)}
                label="Customer"
              >
                <MenuItem value="all">All Customers</MenuItem>
                {customers.map(customer => (
                  <MenuItem key={customer._id} value={customer._id}>
                    {customer.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid sx={{ gridColumn: { xs: 'span 6', md: 'span 2' } }}>
            <FormControl fullWidth size="small">
              <InputLabel id="supplier-filter-label">Supplier</InputLabel>
              <Select
                labelId="supplier-filter-label"
                value={filters.supplier}
                onChange={(e) => handleFilterChange('supplier', e.target.value)}
                label="Supplier"
              >
                <MenuItem value="all">All Suppliers</MenuItem>
                {suppliers.map(supplier => (
                  <MenuItem key={supplier._id} value={supplier._id}>
                    {supplier.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Inspection Table */}
      <Paper>
        <TableContainer>
          {loading ? (
            <LinearProgress />
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell 
                    onClick={() => handleSort('inspectionNumber')}
                    sx={{ cursor: 'pointer' }}
                  >
                    <Box display="flex" alignItems="center">
                      <AssignmentIcon fontSize="small" sx={{ mr: 1 }} />
                      Number
                      {getSortIcon('inspectionNumber')}
                    </Box>
                  </TableCell>
                  <TableCell 
                    onClick={() => handleSort('title')}
                    sx={{ cursor: 'pointer' }}
                  >
                    <Box display="flex" alignItems="center">
                      Title
                      {getSortIcon('title')}
                    </Box>
                  </TableCell>
                  <TableCell 
                    onClick={() => handleSort('customer')}
                    sx={{ cursor: 'pointer' }}
                  >
                    <Box display="flex" alignItems="center">
                      <BusinessIcon fontSize="small" sx={{ mr: 1 }} />
                      Customer
                      {getSortIcon('customer')}
                    </Box>
                  </TableCell>
                  <TableCell 
                    onClick={() => handleSort('supplier')}
                    sx={{ cursor: 'pointer' }}
                  >
                    <Box display="flex" alignItems="center">
                      <FactoryIcon fontSize="small" sx={{ mr: 1 }} />
                      Supplier
                      {getSortIcon('supplier')}
                    </Box>
                  </TableCell>
                  <TableCell 
                    onClick={() => handleSort('scheduledDate')}
                    sx={{ cursor: 'pointer' }}
                  >
                    <Box display="flex" alignItems="center">
                      <ScheduleIcon fontSize="small" sx={{ mr: 1 }} />
                      Scheduled Date
                      {getSortIcon('scheduledDate')}
                    </Box>
                  </TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Result</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredInspections.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body1" py={3}>
                        No inspections found matching the filter criteria.
                      </Typography>
                      <Button
                        variant="outlined"
                        startIcon={<FilterListIcon />}
                        onClick={() => setFilters({
                          search: '',
                          status: 'all',
                          customer: 'all',
                          supplier: 'all',
                          dateRange: 'all'
                        })}
                        sx={{ mt: 1, mb: 2 }}
                      >
                        Clear Filters
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInspections
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((inspection) => (
                      <TableRow 
                        key={inspection._id}
                        onClick={() => navigate(`/inspections/${inspection._id}`)}
                        hover
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>{inspection.inspectionNumber}</TableCell>
                        <TableCell>{inspection.title}</TableCell>
                        <TableCell>
                          <Tooltip title={`View ${inspection.customer.name}`}>
                            <Box 
                              component="span" 
                              onClick={(e) => {
                                e.stopPropagation(); 
                                navigate(`/customers/${inspection.customer._id}`);
                              }}
                              sx={{ 
                                '&:hover': { 
                                  textDecoration: 'underline',
                                  color: 'primary.main'
                                }
                              }}
                            >
                              {inspection.customer.name}
                            </Box>
                          </Tooltip>
                        </TableCell>
                        <TableCell>
                          <Tooltip title={`View ${inspection.supplier.name}`}>
                            <Box 
                              component="span" 
                              onClick={(e) => {
                                e.stopPropagation(); 
                                navigate(`/suppliers/${inspection.supplier._id}`);
                              }}
                              sx={{ 
                                '&:hover': { 
                                  textDecoration: 'underline',
                                  color: 'secondary.main'
                                }
                              }}
                            >
                              {inspection.supplier.name}
                            </Box>
                          </Tooltip>
                        </TableCell>
                        <TableCell>{formatDate(inspection.scheduledDate)}</TableCell>
                        <TableCell>
                          <StatusChip status={inspection.status} />
                        </TableCell>
                        <TableCell>
                          <ResultChip result={inspection.result} />
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          )}
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredInspections.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Box>
  );
};

export default InspectionList; 