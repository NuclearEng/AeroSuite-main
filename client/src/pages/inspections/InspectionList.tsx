import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Card,
  CardContent,
  Chip,
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
  Visibility as VisibilityIcon,
  Refresh as RefreshIcon } from
'@mui/icons-material';
import { DataGrid, GridColDef, GridToolbar } from '@mui/x-data-grid';
import { InspectionFormModal } from './components';
import inspectionService, { Inspection } from '../../services/inspection.service';

const InspectionList: React.FC = () => {
  const navigate = useNavigate();
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);

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

  // Load inspections
  const loadInspections = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await inspectionService.getInspections();
      setInspections(response.inspections || []);
    } catch (err: any) {
      console.error('Error loading inspections:', err);
      setError(err.message || 'Failed to load inspections');
      setSnackbar({
        open: true,
        message: `Failed to load inspections: ${err.message || 'Unknown error'}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Load inspections on component mount
  useEffect(() => {
    loadInspections();

    // Set up event listeners for inspection updates from other parts of the app
    const handleInspectionUpdate = () => {
      loadInspections();
    };

    // In a real app, this would be subscribing to domain events
    window.addEventListener('inspection-updated', handleInspectionUpdate);
    window.addEventListener('inspection-status-changed', handleInspectionUpdate);
    window.addEventListener('customer-updated', handleInspectionUpdate);
    window.addEventListener('supplier-updated', handleInspectionUpdate);

    return () => {
      window.removeEventListener('inspection-updated', handleInspectionUpdate);
      window.removeEventListener('inspection-status-changed', handleInspectionUpdate);
      window.removeEventListener('customer-updated', handleInspectionUpdate);
      window.removeEventListener('supplier-updated', handleInspectionUpdate);
    };
  }, []);

  // Handle create inspection
  const handleCreateInspection = () => {
    setCreateModalOpen(true);
  };

  // Handle edit inspection
  const handleEditInspection = (inspection: Inspection) => {
    setSelectedInspection(inspection);
    setEditModalOpen(true);
  };

  // Handle delete inspection
  const handleDeleteInspection = (inspection: Inspection) => {
    setSelectedInspection(inspection);
    setDeleteDialogOpen(true);
  };

  // Handle view inspection details
  const handleViewInspection = (id: string) => {
    navigate(`/inspections/${id}`);
  };

  // Handle refresh
  const handleRefresh = () => {
    loadInspections();
  };

  // Confirm delete inspection
  const confirmDeleteInspection = async () => {
    if (!selectedInspection) return;

    try {
      setLoading(true);
      await inspectionService.deleteInspection(selectedInspection._id);
      setSnackbar({
        open: true,
        message: `Inspection "${selectedInspection.title}" deleted successfully`,
        severity: 'success'
      });
      loadInspections();

      // Dispatch domain event
      const event = new CustomEvent('inspection-deleted', { detail: selectedInspection });
      window.dispatchEvent(event);
    } catch (error: any) {
      console.error('Error deleting inspection:', error);
      setSnackbar({
        open: true,
        message: `Failed to delete inspection: ${error.message || 'Unknown error'}`,
        severity: 'error'
      });
    } finally {
      setDeleteDialogOpen(false);
      setSelectedInspection(null);
      setLoading(false);
    }
  };

  // Handle inspection creation
  const handleInspectionCreated = (inspection: Inspection) => {
    setSnackbar({
      open: true,
      message: `Inspection "${inspection.title}" scheduled successfully`,
      severity: 'success'
    });
    loadInspections();

    // Dispatch domain event
    const event = new CustomEvent('inspection-created', { detail: inspection });
    window.dispatchEvent(event);
  };

  // Handle inspection update
  const handleInspectionUpdated = (inspection: Inspection) => {
    setSnackbar({
      open: true,
      message: `Inspection "${inspection.title}" updated successfully`,
      severity: 'success'
    });
    loadInspections();

    // Dispatch domain event
    const event = new CustomEvent('inspection-updated', { detail: inspection });
    window.dispatchEvent(event);
  };

  // Close snackbar
  const handleCloseSnackbar = () => {
    setSnackbar({
      ...snackbar,
      open: false
    });
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // DataGrid columns
  const columns: GridColDef[] = [
  {
    field: 'title',
    headerName: 'Inspection',
    flex: 2
  },
  {
    field: 'type',
    headerName: 'Type',
    width: 150,
    valueFormatter: ({ value }) => value.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
  },
  {
    field: 'status',
    headerName: 'Status',
    width: 130,
    renderCell: (params) =>
    <Chip
      label={params.value}
      color={
      params.value === 'completed' ?
      'success' :
      params.value === 'in-progress' ?
      'primary' :
      params.value === 'scheduled' ?
      'info' :
      'error'
      }
      size="small" />


  },
  {
    field: 'priority',
    headerName: 'Priority',
    width: 120,
    renderCell: (params) =>
    <Chip
      label={params.value}
      color={
      params.value === 'critical' ?
      'error' :
      params.value === 'high' ?
      'warning' :
      params.value === 'medium' ?
      'info' :
      'success'
      }
      size="small" />


  },
  {
    field: 'scheduledDate',
    headerName: 'Scheduled Date',
    width: 180,
    valueFormatter: ({ value }) => formatDate(value)
  },
  {
    field: 'customerName',
    headerName: 'Customer',
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
        onClick={() => handleViewInspection(params.row._id)}
        title="View Details">

            <VisibilityIcon fontSize="small" />
          </IconButton>
          <IconButton
        size="small"
        onClick={() => handleEditInspection(params.row)}
        title="Edit">

            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
        size="small"
        onClick={() => handleDeleteInspection(params.row)}
        title="Delete">

            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>

  }];


  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" component="h1">
          Inspections
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
            onClick={handleCreateInspection}>

            Schedule Inspection
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
              rows={inspections || []}
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

      
      <InspectionFormModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSave={handleInspectionCreated} />


      
      {selectedInspection &&
      <InspectionFormModal
        open={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedInspection(null);
        }}
        onSave={handleInspectionUpdated}
        isEdit
        inspectionId={selectedInspection._id}
        initialData={{
          title: selectedInspection.title,
          type: selectedInspection.type,
          status: selectedInspection.status,
          priority: selectedInspection.priority,
          scheduledDate: selectedInspection.scheduledDate ? new Date(selectedInspection.scheduledDate) : null,
          customerId: selectedInspection.customerId,
          supplierId: selectedInspection.supplierId,
          location: selectedInspection.location,
          description: selectedInspection.description || '',
          notes: selectedInspection.notes || '',
          tags: selectedInspection.tags || []
        }} />

      }

      
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}>

        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete inspection "{selectedInspection?.title}"? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={confirmDeleteInspection} color="error" variant="contained" disabled={loading}>
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

export default InspectionList;