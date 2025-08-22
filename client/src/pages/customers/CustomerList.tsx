import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Card,
  CardContent,
  Grid,
  Chip,
  Avatar,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Snackbar,
  Alert,
  CircularProgress } from
'@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Business as BusinessIcon,
  Refresh as RefreshIcon } from
'@mui/icons-material';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { CustomerFormModal } from './components';
import customerService, { Customer } from '../../services/customer.service';

const CustomerList: React.FC = () => {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<any>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  // Snackbar state
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Load customers
  const loadCustomers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await customerService.getCustomers();
      setCustomers(response.customers || []);
    } catch (err: any) {
      console.error("Error:", error);
      setError(err.message || 'Failed to load customers');
      setSnackbar({
        open: true,
        message: `Failed to load customers: ${err.message || 'Unknown error'}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Load customers on component mount
  useEffect(() => {
    loadCustomers();

    // Set up event listener for customer updates from other parts of the app
    const handleCustomerUpdate = () => {
      loadCustomers();
    };

    // In a real app, this would be subscribing to domain events
    window.addEventListener('customer-updated', handleCustomerUpdate);

    return () => {
      window.removeEventListener('customer-updated', handleCustomerUpdate);
    };
  }, []);

  // Handle create customer
  const handleCreateCustomer = () => {
    setCreateModalOpen(true);
  };

  // Handle edit customer
  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setEditModalOpen(true);
  };

  // Handle delete customer
  const handleDeleteCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDeleteDialogOpen(true);
  };

  // Handle view customer details
  const handleViewCustomer = (id: string) => {
    navigate(`/customers/${id}`);
  };

  // Handle refresh
  const handleRefresh = () => {
    loadCustomers();
  };

  // Confirm delete customer
  const confirmDeleteCustomer = async () => {
    if (!selectedCustomer) return;

    try {
      setLoading(true);
      await customerService.deleteCustomer(selectedCustomer._id);
      setSnackbar({
        open: true,
        message: `Customer "${selectedCustomer.name}" deleted successfully`,
        severity: 'success'
      });
      loadCustomers();
    } catch (error: any) {
      console.error("Error:", error);
      setSnackbar({
        open: true,
        message: `Failed to delete customer: ${error.message || 'Unknown error'}`,
        severity: 'error'
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedCustomer(null);
      setLoading(false);
    }
  };

  // Handle customer creation
  const handleCustomerCreated = (customer: Customer) => {
    setSnackbar({
      open: true,
      message: `Customer "${customer.name}" created successfully`,
      severity: 'success'
    });
    loadCustomers();

    // Dispatch domain event
    const event = new CustomEvent('customer-created', { detail: customer });
    window.dispatchEvent(event);
  };

  // Handle customer update
  const handleCustomerUpdated = (customer: Customer) => {
    setSnackbar({
      open: true,
      message: `Customer "${customer.name}" updated successfully`,
      severity: 'success'
    });
    loadCustomers();

    // Dispatch domain event
    const event = new CustomEvent('customer-updated', { detail: customer });
    window.dispatchEvent(event);
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  // DataGrid columns
  const columns: GridColDef[] = [
  {
    field: 'name',
    headerName: 'Customer',
    flex: 2,
    renderCell: (params) =>
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
            {params.row.name.charAt(0)}
          </Avatar>
          <Typography variant="body1">{params.row.name}</Typography>
        </Box>

  },
  {
    field: 'code',
    headerName: 'Code',
    width: 120
  },
  {
    field: 'industry',
    headerName: 'Industry',
    width: 150
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 120,
    renderCell: (params) =>
    <Chip
      label={params.value}
      color={
      params.value === 'active' ?
      'success' :
      params.value === 'inactive' ?
      'error' :
      'warning'
      }
      size="small" />


  },
  {
    field: 'primaryContactName',
    headerName: 'Primary Contact',
    width: 180
  },
  {
    field: 'actions',
    headerName: 'Actions',
    width: 150,
    sortable: false,
    renderCell: (params) =>
    <Box>
          <IconButton
        size="small"
        onClick={() => handleViewCustomer(params.row._id)}
        title="View Details">

            <BusinessIcon fontSize="small" />
          </IconButton>
          <IconButton
        size="small"
        onClick={() => handleEditCustomer(params.row)}
        title="Edit">

            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
        size="small"
        onClick={() => handleDeleteCustomer(params.row)}
        title="Delete"
        data-testid={`delete-${params.row._id}`}>

            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>

  }];


  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Customers
        </Typography>
        <Box>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            sx={{ mr: 2 }}
            disabled={loading}>

            Refresh
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleCreateCustomer}>

            Add Customer
          </Button>
        </Box>
      </Box>

      {error &&
      <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      }

      <Card>
        <CardContent>
          <Box sx={{ height: 600, width: '100%', position: 'relative' }}>
            {loading &&
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.7)',
                zIndex: 1
              }}>

                <CircularProgress />
              </Box>
            }
            <DataGrid
              rows={customers || []}
              columns={columns}
              loading={loading}
              getRowId={(row) => row._id}
              pageSizeOptions={[10, 25, 50]}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 10 }
                }
              }}
              disableRowSelectionOnClick
              components={{
                Toolbar: GridToolbar
              }}
              componentsProps={{
                toolbar: {
                  showQuickFilter: true,
                  quickFilterProps: { debounceMs: 500 }
                }
              }} />

          </Box>
        </CardContent>
      </Card>

      
      <CustomerFormModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSave={handleCustomerCreated} />


      
      {selectedCustomer &&
      <CustomerFormModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedCustomer(null);
        }}
        onSave={handleCustomerUpdated}
        isEdit
        customerId={selectedCustomer._id}
        initialData={{
          name: selectedCustomer.name,
          code: selectedCustomer.code,
          description: selectedCustomer.description || '',
          industry: selectedCustomer.industry,
          status: selectedCustomer.status,
          website: selectedCustomer.website || '',
          primaryContactName: selectedCustomer.primaryContactName || '',
          primaryContactEmail: selectedCustomer.primaryContactEmail || '',
          phone: selectedCustomer.phone || '',
          serviceLevel: selectedCustomer.serviceLevel || 'standard',
          address: {
            street: selectedCustomer.address?.street || '',
            city: selectedCustomer.address?.city || '',
            state: selectedCustomer.address?.state || '',
            zipCode: selectedCustomer.address?.zipCode || '',
            country: selectedCustomer.address?.country || ''
          },
          tags: selectedCustomer.tags || []
        }} />

      }

      
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}>

        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete customer "{selectedCustomer?.name}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={confirmDeleteCustomer} color="error" variant="contained" disabled={loading} data-testid="confirm-delete">
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>

        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>);

};

export default CustomerList;