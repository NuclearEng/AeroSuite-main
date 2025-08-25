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
  Badge,
  TablePagination,
  Stepper,
  Step,
  StepLabel,
  Fab
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
  Payment as PaymentIcon,
  Receipt as ReceiptIcon
} from '@mui/icons-material';
import { PageHeader } from '../../components/common';
import { format } from 'date-fns';

interface CustomerOrder {
  id: string;
  orderNumber: string;
  date: string;
  requestedDate: string;
  status: 'quote-requested' | 'quoted' | 'confirmed' | 'in-production' | 'quality-check' | 'shipped' | 'delivered' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  totalValue: number;
  currency: string;
  items: CustomerOrderItem[];
  notes?: string;
  trackingNumber?: string;
  estimatedDelivery?: string;
  actualDelivery?: string;
  progress: number;
  paymentStatus: 'pending' | 'partial' | 'paid' | 'overdue';
  invoiceNumber?: string;
}

interface CustomerOrderItem {
  id: string;
  partNumber: string;
  description: string;
  specification: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: 'pending' | 'quoted' | 'confirmed' | 'in-production' | 'quality-check' | 'ready' | 'shipped' | 'delivered';
  supplier?: string;
  leadTime?: number;
}

const CustomerOrders: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null);
  const [createOrderOpen, setCreateOrderOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock customer data
  const customer = {
    id: '1',
    name: 'Skyline Aerospace Corp.',
    code: 'SAC001',
    contact: 'Sarah Williams',
    email: 'procurement@skyline-aerospace.com',
    phone: '+1 (555) 987-6543',
    paymentTerms: 'Net 30',
    creditLimit: 500000
  };

  // Mock customer orders data
  const [orders, setOrders] = useState<CustomerOrder[]>([
    {
      id: '1',
      orderNumber: 'SAC-2024-001',
      date: '2024-01-10',
      requestedDate: '2024-02-20',
      status: 'in-production',
      priority: 'high',
      totalValue: 125000,
      currency: 'USD',
      progress: 75,
      paymentStatus: 'partial',
      trackingNumber: 'SHIP-SAC-001',
      estimatedDelivery: '2024-02-18',
      invoiceNumber: 'INV-2024-001',
      items: [
        {
          id: '1',
          partNumber: 'SAC-ENG-001',
          description: 'Aircraft Engine Component',
          specification: 'Titanium alloy, high-temperature resistant',
          quantity: 2,
          unitPrice: 45000,
          totalPrice: 90000,
          status: 'in-production',
          supplier: 'Aerospace Components Ltd.',
          leadTime: 30
        },
        {
          id: '2',
          partNumber: 'SAC-CTL-002',
          description: 'Flight Control System',
          specification: 'Digital autopilot module',
          quantity: 1,
          unitPrice: 35000,
          totalPrice: 35000,
          status: 'quality-check',
          supplier: 'Avionics Systems Inc.',
          leadTime: 25
        }
      ],
      notes: 'High-priority order for new aircraft model. Quality documentation required.'
    },
    {
      id: '2',
      orderNumber: 'SAC-2024-002',
      date: '2024-01-15',
      requestedDate: '2024-03-15',
      status: 'quoted',
      priority: 'medium',
      totalValue: 75000,
      currency: 'USD',
      progress: 15,
      paymentStatus: 'pending',
      items: [
        {
          id: '3',
          partNumber: 'SAC-LND-003',
          description: 'Landing Gear Assembly',
          specification: 'Hydraulic system, 50,000 cycle rating',
          quantity: 4,
          unitPrice: 15000,
          totalPrice: 60000,
          status: 'quoted',
          supplier: 'Precision Landing Systems',
          leadTime: 45
        },
        {
          id: '4',
          partNumber: 'SAC-WHL-004',
          description: 'Aircraft Wheels',
          specification: 'Carbon fiber reinforced',
          quantity: 8,
          unitPrice: 1875,
          totalPrice: 15000,
          status: 'quoted',
          supplier: 'Advanced Wheel Tech',
          leadTime: 20
        }
      ]
    },
    {
      id: '3',
      orderNumber: 'SAC-2024-003',
      date: '2024-01-20',
      requestedDate: '2024-02-05',
      status: 'completed',
      priority: 'urgent',
      totalValue: 85000,
      currency: 'USD',
      progress: 100,
      paymentStatus: 'paid',
      trackingNumber: 'SHIP-SAC-003',
      actualDelivery: '2024-02-03',
      invoiceNumber: 'INV-2024-003',
      items: [
        {
          id: '5',
          partNumber: 'SAC-NAV-005',
          description: 'Navigation System',
          specification: 'GPS-enabled with backup inertial',
          quantity: 1,
          unitPrice: 85000,
          totalPrice: 85000,
          status: 'delivered',
          supplier: 'Navigation Solutions Ltd.',
          leadTime: 15
        }
      ],
      notes: 'Rush order completed ahead of schedule'
    }
  ]);

  useEffect(() => {
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
      case 'in-production':
      case 'quality-check': return 'warning';
      case 'quoted':
      case 'confirmed': return 'primary';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'success';
      case 'partial': return 'warning';
      case 'overdue': return 'error';
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
    'Quote Requested',
    'Quoted',
    'Confirmed',
    'In Production',
    'Quality Check',
    'Shipped',
    'Delivered',
    'Completed'
  ];

  const getActiveStep = (status: string) => {
    const statusMap: Record<string, number> = {
      'quote-requested': 0,
      'quoted': 1,
      'confirmed': 2,
      'in-production': 3,
      'quality-check': 4,
      'shipped': 5,
      'delivered': 6,
      'completed': 7
    };
    return statusMap[status] || 0;
  };

  const handleViewOrder = (order: CustomerOrder) => {
    setSelectedOrder(order);
    setOrderDialogOpen(true);
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
                  <MenuItem value="quote-requested">Quote Requested</MenuItem>
                  <MenuItem value="quoted">Quoted</MenuItem>
                  <MenuItem value="confirmed">Confirmed</MenuItem>
                  <MenuItem value="in-production">In Production</MenuItem>
                  <MenuItem value="quality-check">Quality Check</MenuItem>
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
            Customer Orders ({filteredOrders.length})
          </Typography>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Order #</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Requested Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Progress</TableCell>
                  <TableCell>Payment</TableCell>
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
                    <TableCell>{format(new Date(order.requestedDate), 'MMM dd, yyyy')}</TableCell>
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
                      <Chip
                        label={order.paymentStatus}
                        color={getPaymentStatusColor(order.paymentStatus) as any}
                        size="small"
                        sx={{ textTransform: 'capitalize' }}
                      />
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
                        <ReceiptIcon />
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
                Avg Order Value
              </Typography>
              <Typography variant="h4">
                ${(orders.reduce((sum, order) => sum + order.totalValue, 0) / orders.length).toLocaleString()}
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
                94.2%
              </Typography>
              <Typography color="textSecondary">
                Last 6 months
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Order Status Distribution
              </Typography>
              <Grid container spacing={2}>
                {['quote-requested', 'quoted', 'confirmed', 'in-production', 'quality-check', 'shipped', 'delivered', 'completed'].map((status) => {
                  const count = orders.filter(o => o.status === status).length;
                  const percentage = orders.length > 0 ? (count / orders.length) * 100 : 0;
                  return (
                    <Grid item xs={6} sm={4} md={3} key={status}>
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

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Payment Status
              </Typography>
              <Grid container spacing={2}>
                {['pending', 'partial', 'paid', 'overdue'].map((status) => {
                  const count = orders.filter(o => o.paymentStatus === status).length;
                  const percentage = orders.length > 0 ? (count / orders.length) * 100 : 0;
                  return (
                    <Grid item xs={6} sm={3} key={status}>
                      <Box textAlign="center">
                        <Typography variant="h6">{count}</Typography>
                        <Typography variant="caption" sx={{ textTransform: 'capitalize' }}>
                          {status}
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={percentage}
                          color={getPaymentStatusColor(status) as any}
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
        <Typography>Loading customer orders...</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title={`${customer.name} - Orders Management`}
        subtitle="Track and manage all orders for this customer"
        actions={
          <Button
            variant="outlined"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate(`/customers/${id}`)}
          >
            Back to Customer
          </Button>
        }
      />

      {/* Customer Info */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3} alignItems="center">
            <Grid item>
              <Avatar sx={{ width: 50, height: 50, bgcolor: theme.palette.primary.main }}>
                {customer.name.split(' ').map(n => n[0]).join('')}
              </Avatar>
            </Grid>
            <Grid item xs>
              <Typography variant="h6">
                {customer.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Contact: {customer.contact} | {customer.email} | {customer.phone}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Payment Terms: {customer.paymentTerms} | Credit Limit: ${customer.creditLimit.toLocaleString()}
              </Typography>
            </Grid>
            <Grid item>
              <Badge badgeContent={orders.filter(o => o.status === 'quote-requested').length} color="warning">
                <Chip label="Quote Requests" variant="outlined" />
              </Badge>
            </Grid>
            <Grid item>
              <Badge badgeContent={orders.filter(o => o.paymentStatus === 'overdue').length} color="error">
                <Chip label="Overdue Payments" variant="outlined" />
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
      {tabValue === 0 && renderOrdersTab()}
      {tabValue === 1 && renderAnalyticsTab()}

      {/* Order Details Dialog */}
      <Dialog 
        open={orderDialogOpen} 
        onClose={() => setOrderDialogOpen(false)} 
        maxWidth="lg" 
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
                          <TableCell>Specification</TableCell>
                          <TableCell>Qty</TableCell>
                          <TableCell>Unit Price</TableCell>
                          <TableCell>Total</TableCell>
                          <TableCell>Supplier</TableCell>
                          <TableCell>Lead Time</TableCell>
                          <TableCell>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedOrder.items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.partNumber}</TableCell>
                            <TableCell>{item.description}</TableCell>
                            <TableCell>{item.specification}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>${item.unitPrice.toLocaleString()}</TableCell>
                            <TableCell>${item.totalPrice.toLocaleString()}</TableCell>
                            <TableCell>{item.supplier}</TableCell>
                            <TableCell>{item.leadTime} days</TableCell>
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
                          <strong>Requested Date:</strong> {format(new Date(selectedOrder.requestedDate), 'PPP')}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Priority:</strong> {selectedOrder.priority}
                        </Typography>
                        <Typography variant="body2">
                          <strong>Total Value:</strong> {selectedOrder.currency} {selectedOrder.totalValue.toLocaleString()}
                        </Typography>
                        {selectedOrder.invoiceNumber && (
                          <Typography variant="body2">
                            <strong>Invoice:</strong> {selectedOrder.invoiceNumber}
                          </Typography>
                        )}
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
                        Delivery & Payment
                      </Typography>
                      <Box sx={{ '& > div': { mb: 1 } }}>
                        <Typography variant="body2">
                          <strong>Payment Status:</strong> 
                          <Chip
                            label={selectedOrder.paymentStatus}
                            color={getPaymentStatusColor(selectedOrder.paymentStatus) as any}
                            size="small"
                            sx={{ ml: 1, textTransform: 'capitalize' }}
                          />
                        </Typography>
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
          <Button variant="outlined" startIcon={<PaymentIcon />}>
            Process Payment
          </Button>
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

export default CustomerOrders;
