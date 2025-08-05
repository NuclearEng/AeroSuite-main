import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon,
  LocalShipping as ShippingIcon,
  Receipt as ReceiptIcon,
  AttachMoney as PaymentIcon
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import customerService from '../../../services/customer.service';

interface CustomerOrderListProps {
  customerId?: string;
  limit?: number;
  showHeader?: boolean;
  showActions?: boolean;
  onOrderCreated?: () => void;
  onOrderUpdated?: () => void;
}

interface Order {
  _id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  totalAmount: number;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
  }>;
  createdAt: string;
  updatedAt: string;
  paymentStatus: 'pending' | 'paid' | 'overdue' | 'refunded';
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

const CustomerOrderList: React.FC<CustomerOrderListProps> = ({
  customerId,
  limit = 10,
  showHeader = true,
  showActions = true,
  onOrderCreated,
  onOrderUpdated
}) => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Load orders
  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // If customerId is provided, get orders for that customer only
      // Otherwise get all orders
      const response = customerId 
        ? await customerService.getCustomerOrders(customerId) 
        : await customerService.getAllOrders();
      
      setOrders(response.orders || []);
    } catch (err: any) {
      console.error('Error loading orders:', err);
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  // Load orders on component mount
  useEffect(() => {
    loadOrders();
  }, [customerId]);

  // Handle view order
  const handleViewOrder = (id: string) => {
    navigate(`/orders/${id}`);
  };

  // Handle create order
  const handleCreateOrder = () => {
    navigate(`/orders/new${customerId ? `?customerId=${customerId}` : ''}`);
  };

  // Handle edit order
  const handleEditOrder = (order: Order) => {
    navigate(`/orders/edit/${order._id}`);
  };

  // Handle delete order
  const handleDeleteOrder = (order: Order) => {
    setSelectedOrder(order);
    setDeleteDialogOpen(true);
  };

  // Confirm delete order
  const confirmDeleteOrder = async () => {
    if (!selectedOrder) return;
    
    try {
      setLoading(true);
      await customerService.deleteOrder(selectedOrder._id);
      loadOrders();
      if (onOrderUpdated) onOrderUpdated();
    } catch (error: any) {
      console.error('Error deleting order:', error);
      setError(error.message || 'Failed to delete order');
    } finally {
      setDeleteDialogOpen(false);
      setSelectedOrder(null);
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // DataGrid columns
  const columns: GridColDef[] = [
    {
      field: 'orderNumber',
      headerName: 'Order #',
      width: 150
    },
    {
      field: 'customerName',
      headerName: 'Customer',
      width: 200,
      flex: customerId ? 0 : 1
    },
    {
      field: 'createdAt',
      headerName: 'Date',
      width: 120,
      valueFormatter: (params) => formatDate(params.value as string)
    },
    {
      field: 'totalAmount',
      headerName: 'Total',
      width: 120,
      valueFormatter: (params) => formatCurrency(params.value as number)
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => {
        const status = params.value as string;
        let color;
        switch (status) {
          case 'pending':
            color = 'warning';
            break;
          case 'processing':
            color = 'info';
            break;
          case 'shipped':
            color = 'primary';
            break;
          case 'delivered':
            color = 'success';
            break;
          case 'cancelled':
            color = 'error';
            break;
          default:
            color = 'default';
        }
        
        return (
          <Chip 
            label={status.charAt(0).toUpperCase() + status.slice(1)} 
            color={color as any}
            size="small"
          />
        );
      }
    },
    {
      field: 'paymentStatus',
      headerName: 'Payment',
      width: 120,
      renderCell: (params) => {
        const status = params.value as string;
        let color;
        switch (status) {
          case 'paid':
            color = 'success';
            break;
          case 'pending':
            color = 'warning';
            break;
          case 'overdue':
            color = 'error';
            break;
          case 'refunded':
            color = 'info';
            break;
          default:
            color = 'default';
        }
        
        return (
          <Chip 
            label={status.charAt(0).toUpperCase() + status.slice(1)} 
            color={color as any}
            size="small"
            icon={<PaymentIcon />}
            variant="outlined"
          />
        );
      }
    }
  ];

  // Add actions column if showActions is true
  if (showActions) {
    columns.push({
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      sortable: false,
      renderCell: (params) => (
        <Box>
          <Tooltip title="View Order">
            <IconButton
              size="small"
              onClick={() => handleViewOrder(params.row._id)}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit Order">
            <IconButton
              size="small"
              onClick={() => handleEditOrder(params.row)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Order">
            <IconButton
              size="small"
              onClick={() => handleDeleteOrder(params.row)}
              color="error"
            >
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )
    });
  }

  return (
    <Box>
      {showHeader && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h5" component="h2">
            {customerId ? 'Customer Orders' : 'All Orders'}
          </Typography>
          <Box>
            <Button
              variant="outlined"
              color="primary"
              startIcon={<RefreshIcon />}
              onClick={loadOrders}
              sx={{ mr: 2 }}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleCreateOrder}
            >
              New Order
            </Button>
          </Box>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Box sx={{ height: 500, width: '100%', position: 'relative' }}>
            {loading && (
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
                }}
              >
                <CircularProgress />
              </Box>
            )}
            <DataGrid
              rows={orders}
              columns={columns}
              loading={loading}
              getRowId={(row) => row._id}
              pageSizeOptions={[5, 10, 25, 50]}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: limit }
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
              }}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete order #{selectedOrder?.orderNumber}? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={confirmDeleteOrder} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerOrderList; 