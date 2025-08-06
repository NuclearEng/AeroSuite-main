import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Card,
  CardContent,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Alert,
  LinearProgress } from
'@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Business as BusinessIcon,
  MoreVert as MoreVertIcon,
  Close as CloseIcon } from
'@mui/icons-material';
import type { Customer } from '../../services/mockDataService';
import MockDataService from '../../services/mockDataService';

const CustomerList: React.FC = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load customers
  useEffect(() => {
    MockDataService.initialize();
    loadCustomers();
  }, []);

  // Load customers from the mock service
  const loadCustomers = () => {
    setLoading(true);
    setError(null);

    try {
      const data = MockDataService.getCustomers();
      setCustomers(data);
      setFilteredCustomers(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load customers. Please try again.');
      setLoading(false);
    }
  };

  // Apply search filter when it changes
  useEffect(() => {
    applyFilters();
  }, [searchQuery, customers]);

  // Filter customers based on current filters
  const applyFilters = () => {
    let filtered = [...customers];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (customer) =>
        customer.name.toLowerCase().includes(query) ||
        customer.code.toLowerCase().includes(query) ||
        customer.industry && customer.industry.toLowerCase().includes(query) ||
        customer.location && customer.location.toLowerCase().includes(query)
      );
    }

    setFilteredCustomers(filtered);
    setPage(0); // Reset to first page when filters change
  };

  // Pagination handlers
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // Search handler
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  // Action menu handlers
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, customerId: string) => {
    event.stopPropagation();
    setActionMenuAnchor(event.currentTarget);
    setSelectedCustomer(customerId);
  };

  const handleMenuClose = () => {
    setActionMenuAnchor(null);
    setSelectedCustomer(null);
  };

  // Handle view customer details
  const handleViewCustomer = (id: string) => {
    navigate(`/customers/${id}`);
  };

  return (
    <Box>
      
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Customers
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/customers/new')}>

          Add Customer
        </Button>
      </Box>

      
      {error &&
      <Alert severity="error" sx={{ mb: 2 }}>
          {error}
          <IconButton
          size="small"
          aria-label="close"
          color="inherit"
          onClick={() => setError(null)}
          sx={{ ml: 2 }}>

            <CloseIcon fontSize="small" />
          </IconButton>
        </Alert>
      }

      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" gap={2}>
            <TextField
              placeholder="Search customers..."
              value={searchQuery}
              onChange={handleSearchChange}
              variant="outlined"
              size="small"
              sx={{ flexGrow: 1 }}
              InputProps={{
                startAdornment:
                <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>,

                endAdornment: searchQuery &&
                <InputAdornment position="end">
                    <IconButton size="small" onClick={handleClearSearch}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>

              }} />

            
            <Tooltip title="Refresh">
              <IconButton onClick={loadCustomers}>
                <BusinessIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </CardContent>
      </Card>

      
      {loading ?
      <LinearProgress sx={{ mb: 2 }} /> :

      <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Customer Code</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Industry</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredCustomers.length > 0 ?
              filteredCustomers.
              slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).
              map((customer) =>
              <TableRow
                key={customer._id}
                hover
                onClick={() => handleViewCustomer(customer._id)}
                sx={{ cursor: 'pointer' }}>

                        <TableCell>
                          <Chip label={customer.code} size="small" />
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <BusinessIcon fontSize="small" sx={{ mr: 1, color: 'primary.main' }} />
                            <Typography fontWeight="medium">{customer.name}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{customer.industry || '-'}</TableCell>
                        <TableCell>{customer.location || '-'}</TableCell>
                        <TableCell>
                          {customer.contact ?
                  <Box>
                              <Typography variant="body2">{customer.contact.name}</Typography>
                              <Typography variant="body2" color="text.secondary">{customer.contact.email}</Typography>
                            </Box> :

                  '-'
                  }
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                    size="small"
                    onClick={(e) => handleMenuClick(e, customer._id)}>

                            <MoreVertIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
              ) :

              <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Box py={3}>
                        <Typography variant="body1" color="textSecondary">
                          No customers found
                        </Typography>
                        <Button
                      variant="text"
                      startIcon={<BusinessIcon />}
                      onClick={loadCustomers}
                      sx={{ mt: 1 }}>

                          Refresh
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
              }
              </TableBody>
            </Table>
          </TableContainer>
          
          <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredCustomers.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage} />

        </>
      }

      
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleMenuClose}>

        <MenuItem onClick={() => {
          if (selectedCustomer) {
            handleViewCustomer(selectedCustomer);
          }
        }}>
          <ListItemIcon>
            <ViewIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>View Details</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        
        <MenuItem onClick={handleMenuClose}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText primaryTypographyProps={{ color: 'error' }}>
            Delete
          </ListItemText>
        </MenuItem>
      </Menu>
    </Box>);

};

export default CustomerList;