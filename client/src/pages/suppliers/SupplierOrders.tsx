import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  useTheme,
  Alert,
  Divider,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Fab,
  Tooltip,
  Badge,
  TablePagination
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Visibility as ViewIcon,
  LocalShipping as ShippingIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CompleteIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  Download as DownloadIcon,
  Filter as FilterIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { PageHeader } from '../../components/common';
import { format } from 'date-fns';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

interface Order {
  id: string;
  orderNumber: string;
  date: string;
  dueDate: string;
  status: 'pending' | 'confirmed' | 'in-production' | 'shipped' | 'delivered' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  totalValue: number;
  currency: string;
  items: OrderItem[];
  notes?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  progress: number;
}

interface OrderItem {
  id: string;
  partNumber: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'in-production' | 'ready' | 'shipped' | 'delivered';
}

interface OrderStatusHistoryItem {
  status: string;
  date: string;
  notes?: string;
  user: string;
}

const SupplierOrders: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [createOrderOpen, setCreateOrderOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock supplier data
  const supplier = {
    id: '1',
    name: 'Aerospace Components Ltd.',
    code: 'ACL001',
    contact: 'Michael Johnson',
    email: 'orders@aerospace-components.com',
    phone: '+1 (555) 123-4567'
  };

  // Mock orders data
  const [orders, setOrders] = useState<Order[]>([
    {
      id: '1',
      orderNumber: 'PO-2024-001',
      date: '2024-01-15',
      dueDate: '2024-02-15',
      status: 'in-production',
      priority: 'high',
      totalValue: 45000,
      currency: 'USD',
      progress: 65,
      trackingNumber: 'TRK-001-2024',
      estimatedDelivery: '2024-02-10',
      items: [
        {
          id: '1',
          partNumber: 'ACL-TRB-001',
          description: 'Turbine Blade Assembly',
          quantity: 10,
          unitPrice: 3500,
          totalPrice: 35000,
          status: 'in-production'
        },
        {
          id: '2',
          partNumber: 'ACL-GSK-002',
          description: 'Gasket Set',
          quantity: 50,
          unitPrice: 200,
          totalPrice: 10000,
          status: 'ready'
        }
      ],
      notes: 'High priority order for Project Phoenix'
    },
    {
      id: '2',
      orderNumber: 'PO-2024-002',
      date: '2024-01-20',
      dueDate: '2024-03-01',
      status: 'confirmed',
      priority: 'medium',
      totalValue: 28500,
      currency: 'USD',
      progress: 25,
      items: [
        {
          id: '3',
          partNumber: 'ACL-FLG-003',
          description: 'Flange Connector',
          quantity: 25,
          unitPrice: 450,
          totalPrice: 11250,
          status: 'confirmed'
        },
        {
          id: '4',
          partNumber: 'ACL-BLT-004',
          description: 'High-Strength Bolts',
          quantity: 500,
          unitPrice: 34.5,
          totalPrice: 17250,
          status: 'confirmed'
        }
      ]
    },
    {
      id: '3',
      orderNumber: 'PO-2024-003',
      date: '2024-01-25',
      dueDate: '2024-01-30',
      status: 'delivered',
      priority: 'urgent',
      totalValue: 12000,
      currency: 'USD',
      progress: 100,
      trackingNumber: 'TRK-003-2024',
      actualDelivery: '2024-01-28',
      items: [
        {
          id: '5',
          partNumber: 'ACL-SCP-005',
          description: 'Scope Mount',
          quantity: 15,
          unitPrice: 800,
          totalPrice: 12000,
          status: 'delivered'
        }
      ],
      notes: 'Rush order completed successfully'
    }
  ]);

  // Mock order status history
  const orderStatusHistory: Record<string, OrderStatusHistoryItem[]> = {
    '1': [
      { status: 'pending', date: '2024-01-15', user: 'System', notes: 'Order created' },
      { status: 'confirmed', date: '2024-01-16', user: 'Michael Johnson', notes: 'Order confirmed by supplier' },
      { status: 'in-production', date: '2024-01-18', user: 'Production Team', notes: 'Production started' }
    ]
  };

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'delivered': return 'success';
      case 'shipped': return 'info';
      case 'in-production': return 'warning';
      case 'confirmed': return 'primary';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return theme.palette.error.main;
      case 'high': return theme.palette.warning.main;
      case 'medium': return theme.palette.info.main;
      case 'low': return theme.palette.success.main;
      default: return theme.palette.grey[500];
    }
  };

  const getStatusSteps = () => [
    'Pending',
    'Confirmed',
    'In Production',
    'Shipped',
    'Delivered',
    'Completed'
  ];

  const getActiveStep = (status: string) => {
    const steps = getStatusSteps();
    const statusMap: Record<string, number> = {
      'pending': 0,
      'confirmed': 1,
      'in-production': 2,
      'shipped': 3,
      'delivered': 4,
      'completed': 5
    };
    return statusMap[status] || 0;
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setOrderDialogOpen(true);
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: string) => {
    setOrders(prev => 
      prev.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus as any, progress: getProgressFromStatus(newStatus) }
          : order
      )
    );
  };

  const getProgressFromStatus = (status: string): number => {
    const progressMap: Record<string, number> = {
      'pending': 0,
      'confirmed': 20,
      'in-production': 50,
      'shipped': 80,
      'delivered': 90,
      'completed': 100
    };
    return progressMap[status] || 0;
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.items.some(item => 
                           item.partNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.description.toLowerCase().includes(searchTerm.toLowerCase())
                         );
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const paginatedOrders = filteredOrders.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const renderOrdersTab = () => (
    <Box sx={{ mt: 3 }}>
      {/* Filters and Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                placeholder="Search orders, parts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
                }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Status Filter</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  label="Status Filter"
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="confirmed">Confirmed</MenuItem>
                  <MenuItem value="in-production">In Production</MenuItem>
                  <MenuItem value="shipped">Shipped</MenuItem>
                  <MenuItem value="delivered">Delivered</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={5}>
              <Box display="flex" gap={1} justifyContent="flex-end">
                <Button variant="outlined" startIcon={<RefreshIcon />}>
                  Refresh
                </Button>
                <Button variant="outlined" startIcon={<DownloadIcon />}>
                  Export
                </Button>
                <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOrderOpen(true)}>
                  New Order
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Orders ({filteredOrders.length})
          </Typography>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order #</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Progress</TableCell>
                  <TableCell>Total Value</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedOrders.map((order) => (
                  <TableRow key={order.id} hover>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {order.orderNumber}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {order.items.length} item(s)
                      </Typography>
                    </TableCell>
                    <TableCell>{format(new Date(order.date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{format(new Date(order.dueDate), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>
                      <Chip
                        label={order.status.replace('-', ' ')}
                        color={getStatusColor(order.status) as any}
                        size="small"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={order.priority}
                        size="small"
                        sx={{
                          backgroundColor: getPriorityColor(order.priority),
                          color: 'white',
                          textTransform: 'capitalize'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <LinearProgress
                          variant="determinate"
                          value={order.progress}
                          sx={{ width: 60, height: 6, borderRadius: 3 }}
                        />
                        <Typography variant="caption">
                          {order.progress}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2">
                        {order.currency} {order.totalValue.toLocaleString()}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleViewOrder(order)} size="small">
                        <ViewIcon />
                      </IconButton>
                      <IconButton size="small">
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small">
                        <MoreVertIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={filteredOrders.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
            }}
          />
        </CardContent>
      </Card>
    </Box>
  );

  const renderAnalyticsTab = () => (
    <Box sx={{ mt: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Orders
              </Typography>
              <Typography variant="h4">
                {orders.length}
              </Typography>
              <Typography color="textSecondary">
                This year
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Value
              </Typography>
              <Typography variant="h4">
                ${orders.reduce((sum, order) => sum + order.totalValue, 0).toLocaleString()}
              </Typography>
              <Typography color="textSecondary">
                USD
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                On-Time Delivery
              </Typography>
              <Typography variant="h4" color="success.main">
                96.5%
              </Typography>
              <Typography color="textSecondary">
                Last 6 months
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Avg Lead Time
              </Typography>
              <Typography variant="h4">
                14.2
              </Typography>
              <Typography color="textSecondary">
                Days
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Order Status Distribution
              </Typography>
              <Grid container spacing={2}>
                {['pending', 'confirmed', 'in-production', 'shipped', 'delivered', 'completed'].map((status) => {
                  const count = orders.filter(o => o.status === status).length;
                  const percentage = (count / orders.length) * 100;
                  return (
                    <Grid item xs={6} sm={4} md={2} key={status}>
                      <Box textAlign="center">
                        <Typography variant="h6">{count}</Typography>
                        <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>
                          {status.replace('-', ' ')}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={percentage}
                          sx={{ mt: 1, height: 4, borderRadius: 2 }}
                        />
                      </Box>
                    </Grid>
                  );
                })}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <Typography>Loading supplier orders...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title={`${supplier.name} - Orders Management`}
        subtitle="Track and manage all orders with this supplier"
        actions={
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(`/suppliers/${id}`)}
          >
            Back to Supplier
          </Button>
        }
      />

      {/* Supplier Contact Info */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item>
              <Avatar sx={{ width: 50, height: 50, bgcolor: theme.palette.primary.main }}>
                {supplier.name.split(' ').map(n => n[0]).join('')}
              </Avatar>
            </Grid>
            <Grid item xs>
              <Typography variant="h6">
                {supplier.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Contact: {supplier.contact} | {supplier.email} | {supplier.phone}
              </Typography>
            </Grid>
            <Grid item>
              <Badge badgeContent={orders.filter(o => o.status === 'pending').length} color="warning">
                <Chip label="Pending Orders" variant="outlined" />
              </Badge>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Orders Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Orders" />
          <Tab label="Analytics" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {tabValue === 0 && (
        <DndProvider backend={HTML5Backend}>
          {renderOrdersTab()}
        </DndProvider>
      )}
      {tabValue === 1 && renderAnalyticsTab()}

      {/* Order Details Dialog */}
      <Dialog 
        open={orderDialogOpen} 
        onClose={() => setOrderDialogOpen(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          Order Details - {selectedOrder?.orderNumber}
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Box sx={{ mt: 2 }}>
              {/* Order Status Stepper */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Order Progress
                  </Typography>
                  <Stepper activeStep={getActiveStep(selectedOrder.status)} orientation="horizontal">
                    {getStatusSteps().map((label) => (
                      <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                      </Step>
                    ))}
                  </Stepper>
                </CardContent>
              </Card>

              {/* Order Items */}
              <Card sx={{ mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Order Items
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Part Number</TableCell>
                          <TableCell>Description</TableCell>
                          <TableCell>Quantity</TableCell>
                          <TableCell>Unit Price</TableCell>
                          <TableCell>Total</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedOrder.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.partNumber}</TableCell>
                            <TableCell>{item.description}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>${item.unitPrice}</TableCell>
                            <TableCell>${item.totalPrice}</TableCell>
                            <TableCell>
                              <Chip
                                label={item.status}
                                size="small"
                                color={getStatusColor(item.status) as any}
                                sx={{ textTransform: 'capitalize' }}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>

              {/* Order Information */}
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Order Information
                      </Typography>
                      <Box sx={{ '& > div': { mb: 1 } }}>
                        <Typography variant="body2">
                          <strong>Order Date:</strong> {format(new Date(selectedOrder.date), 'PPP')}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Due Date:</strong> {format(new Date(selectedOrder.dueDate), 'PPP')}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Priority:</strong> {selectedOrder.priority}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Total Value:</strong> {selectedOrder.currency} {selectedOrder.totalValue.toLocaleString()}
                        </Typography>
                        {selectedOrder.trackingNumber && (
                          <Typography variant="body2">
                            <strong>Tracking:</strong> {selectedOrder.trackingNumber}
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Delivery Information
                      </Typography>
                      <Box sx={{ '& > div': { mb: 1 } }}>
                        {selectedOrder.estimatedDelivery && (
                          <Typography variant="body2">
                            <strong>Estimated Delivery:</strong> {format(new Date(selectedOrder.estimatedDelivery), 'PPP')}
                          </Typography>
                        )}
                        {selectedOrder.actualDelivery && (
                          <Typography variant="body2">
                            <strong>Actual Delivery:</strong> {format(new Date(selectedOrder.actualDelivery), 'PPP')}
                          </Typography>
                        )}
                        {selectedOrder.notes && (
                          <Typography variant="body2">
                            <strong>Notes:</strong> {selectedOrder.notes}
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOrderDialogOpen(false)}>Close</Button>
          <Button variant="contained" startIcon={<EditIcon />}>
            Edit Order
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => setCreateOrderOpen(true)}
      >
        <AddIcon />
      </Fab>
    </Box>
  );
};

export default SupplierOrders;
