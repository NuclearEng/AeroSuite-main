import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  FormControlLabel,
  Switch,
  Grid,
  Button,
  Chip,
  Avatar,
  Paper } from
'@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Notifications as NotificationsIcon,
  FilterAlt as FilterIcon,
  Save as SaveIcon,
  BuildCircle as BuildIcon } from
'@mui/icons-material';
import DataTable, { HeadCell, DataTableAction } from '../../../components/common/DataTable';

// Demo data
interface SupplierData {
  id: number;
  name: string;
  contact: string;
  email: string;
  phone: string;
  rating: number;
  status: 'active' | 'pending' | 'inactive';
  lastOrderDate: string;
  ordersCount: number;
  location: string;
  category: string;
  notes?: string;
}

const demoData: SupplierData[] = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  name: `Supplier ${i + 1}`,
  contact: `Contact Person ${i + 1}`,
  email: `supplier${i + 1}@example.com`,
  phone: `+1 555-${String(i).padStart(3, '0')}-${String(i * 3).padStart(4, '0')}`,
  rating: Math.floor(Math.random() * 5) + 1,
  status: ['active', 'pending', 'inactive'][Math.floor(Math.random() * 3)] as any,
  lastOrderDate: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString().split('T')[0],
  ordersCount: Math.floor(Math.random() * 100),
  location: ['New York', 'Chicago', 'Los Angeles', 'Houston', 'Miami'][Math.floor(Math.random() * 5)],
  category: ['Hardware', 'Software', 'Services', 'Consulting', 'Manufacturing'][Math.floor(Math.random() * 5)],
  notes: Math.random() > 0.5 ? `Additional notes for supplier ${i + 1}` : undefined
}));

const EnhancedDataTableDemo: React.FC = () => {
  // State for demo configuration
  const [resizableColumns, setResizableColumns] = useState(true);
  const [columnFiltering, setColumnFiltering] = useState(true);
  const [exportable, setExportable] = useState(true);
  const [zebra, setZebra] = useState(true);
  const [dense, setDense] = useState(false);
  const [rowExpandable, setRowExpandable] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<any>(undefined);

  // Define columns
  const columns: HeadCell<SupplierData>[] = [
  {
    id: 'id',
    label: 'ID',
    numeric: true,
    sortable: true,
    width: 80,
    minWidth: 60,
    align: 'left'
  },
  {
    id: 'name',
    label: 'Name',
    numeric: false,
    sortable: true,
    filterable: true,
    minWidth: 150,
    format: (value) =>
    <Box sx={{ fontWeight: 'bold' }}>{value}</Box>

  },
  {
    id: 'category',
    label: 'Category',
    numeric: false,
    sortable: true,
    filterable: true,
    filterOptions: [
    { label: 'Hardware', value: 'Hardware' },
    { label: 'Software', value: 'Software' },
    { label: 'Services', value: 'Services' },
    { label: 'Consulting', value: 'Consulting' },
    { label: 'Manufacturing', value: 'Manufacturing' }],

    width: 140
  },
  {
    id: 'status',
    label: 'Status',
    numeric: false,
    sortable: true,
    filterable: true,
    filterOptions: [
    { label: 'Active', value: 'active' },
    { label: 'Pending', value: 'pending' },
    { label: 'Inactive', value: 'inactive' }],

    width: 120,
    format: (value) => {
      let color: 'success' | 'warning' | 'error' = 'success';
      if (value === 'pending') color = 'warning';
      if (value === 'inactive') color = 'error';

      return <Chip size="small" color={color} label={value} />;
    }
  },
  {
    id: 'rating',
    label: 'Rating',
    numeric: true,
    sortable: true,
    width: 120,
    format: (value) => {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {Array.from({ length: 5 }, (_, i) =>
          <Box
            key={i}
            component="span"
            sx={{
              color: i < value ? 'gold' : 'text.disabled',
              mr: 0.2
            }}>

                ★
              </Box>
          )}
          </Box>);

    }
  },
  {
    id: 'location',
    label: 'Location',
    numeric: false,
    sortable: true,
    filterable: true,
    width: 140
  },
  {
    id: 'ordersCount',
    label: 'Orders',
    numeric: true,
    sortable: true,
    width: 100
  },
  {
    id: 'lastOrderDate',
    label: 'Last Order',
    numeric: false,
    sortable: true,
    width: 130
  },
  {
    id: 'email',
    label: 'Email',
    numeric: false,
    sortable: true,
    filterable: true,
    width: 220
  }];


  // Define actions
  const actions: DataTableAction<SupplierData>[] = [
  {
    label: 'Export',
    icon: <SaveIcon fontSize="small" />,
    onClick: (selectedRows) => {
      console.log('Export:', selectedRows);
    },
    color: 'primary',
    tooltip: 'Export selected suppliers',
    showOnlyWhenSelected: true
  },
  {
    label: 'Delete',
    icon: <DeleteIcon fontSize="small" />,
    onClick: (selectedRows) => {
      console.log('Delete:', selectedRows);
    },
    color: 'error',
    tooltip: 'Delete selected suppliers',
    showOnlyWhenSelected: true
  }];


  // Handle edit
  const handleEdit = (row: SupplierData) => {
    console.log('Edit:', row);
  };

  // Handle row click
  const handleRowClick = (row: SupplierData) => {
    console.log('Row clicked:', row);
  };

  // Handle refresh
  const handleRefresh = () => {
    setLoading(true);
    setError(undefined);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
    }, 1500);
  };

  // Handle simulated error
  const handleSimulateError = () => {
    setError('Failed to load suppliers. Please try again.');
  };

  // Render expanded row
  const RenderExpandedRow = (row: SupplierData) =>
  <Box>
      <Typography variant="subtitle2" gutterBottom>
        Additional Information
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <Typography variant="body2">
            <strong>Contact:</strong> {row.contact}
          </Typography>
          <Typography variant="body2">
            <strong>Phone:</strong> {row.phone}
          </Typography>
          <Typography variant="body2">
            <strong>Email:</strong> {row.email}
          </Typography>
        </Grid>
        <Grid item xs={12} md={6}>
          <Typography variant="body2">
            <strong>Notes:</strong> {row.notes || 'No additional notes'}
          </Typography>
        </Grid>
      </Grid>
    </Box>;


  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h5" gutterBottom>
        Enhanced Data Table Demo (TS103)
      </Typography>
      
      <Typography variant="body2" color="text.secondary" paragraph>
        This component demonstrates the enhanced data table with improved UX features such as
        column filtering, column resizing, row expansion, export options, and more.
      </Typography>
      
      <Card sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Configure Demo Features
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={4} md={3}>
              <FormControlLabel
                control={<Switch checked={resizableColumns} onChange={(e) => setResizableColumns(e.target.checked)} />}
                label="Resizable Columns" />

            </Grid>
            <Grid item xs={6} sm={4} md={3}>
              <FormControlLabel
                control={<Switch checked={columnFiltering} onChange={(e) => setColumnFiltering(e.target.checked)} />}
                label="Column Filtering" />

            </Grid>
            <Grid item xs={6} sm={4} md={3}>
              <FormControlLabel
                control={<Switch checked={exportable} onChange={(e) => setExportable(e.target.checked)} />}
                label="Export Options" />

            </Grid>
            <Grid item xs={6} sm={4} md={3}>
              <FormControlLabel
                control={<Switch checked={zebra} onChange={(e) => setZebra(e.target.checked)} />}
                label="Zebra Stripes" />

            </Grid>
            <Grid item xs={6} sm={4} md={3}>
              <FormControlLabel
                control={<Switch checked={dense} onChange={(e) => setDense(e.target.checked)} />}
                label="Dense Layout" />

            </Grid>
            <Grid item xs={6} sm={4} md={3}>
              <FormControlLabel
                control={<Switch checked={rowExpandable} onChange={(e) => setRowExpandable(e.target.checked)} />}
                label="Expandable Rows" />

            </Grid>
          </Grid>
          
          <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
            <Button variant="outlined" size="small" onClick={handleRefresh}>
              Simulate Loading
            </Button>
            <Button variant="outlined" size="small" color="error" onClick={handleSimulateError}>
              Simulate Error
            </Button>
          </Stack>
        </CardContent>
      </Card>
      
      <Box>
        <DataTable<SupplierData>
          title="Suppliers"
          rows={demoData}
          headCells={columns}
          keyField="id"
          defaultSortBy="name"
          defaultOrder="asc"
          selectable
          searchable
          searchPlaceholder="Search suppliers..."
          onRowClick={handleRowClick}
          onEdit={handleEdit}
          actions={actions}
          loading={loading}
          error={error}
          refetch={handleRefresh}
          resizableColumns={resizableColumns}
          columnFiltering={columnFiltering}
          exportable={exportable}
          exportFileName="suppliers-data"
          rowsExpandable={rowExpandable}
          renderExpandedRow={rowExpandable ? RenderExpandedRow : undefined}
          dense={dense}
          zebra={zebra}
          highlightOnHover
          showRowDividers
          verticalAlignMiddle
          stickyHeader
          maxHeight={650}
          headerContent={
          <Typography variant="body2" color="text.secondary">
              Total suppliers: {demoData.length}
            </Typography>
          } />

      </Box>
    </Paper>);

};

export default EnhancedDataTableDemo;