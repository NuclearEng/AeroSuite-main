import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Button,
  CircularProgress } from
'@mui/material';
import {
  Visibility as ViewIcon,
  Assignment as AssignmentIcon,
  Delete as DeleteIcon } from
'@mui/icons-material';
import MockDataService from '../services/mockDataService';
import type { Inspection } from '../services/mockDataService';

// Status component
const StatusChip = ({ status }: {status: string;}) => {
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
      size="small" />);


};

// Result chip
const ResultChip = ({ result }: {result: string;}) => {
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
      size="small" />);


};

// Format date for display
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString();
};

const InspectionList = () => {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);

  // Initialize mock data service and load data
  useEffect(() => {
    MockDataService.initialize();
    loadInspections();
  }, []);

  // Load inspections from the mock service
  const loadInspections = () => {
    setLoading(true);

    // Simulate network delay
    setTimeout(() => {
      const data = MockDataService.getInspections();
      setInspections(data);
      setLoading(false);
    }, 1000);
  };

  const handleViewInspection = (inspection: Inspection) => {
    setSelectedInspection(inspection);
  };

  const handleConductInspection = (inspection: Inspection) => {
    // In a real app, we'd navigate to the conduct page
    alert(`Conducting inspection: ${inspection.inspectionNumber}`);
  };

  const handleDeleteInspection = (id: string) => {
    if (confirm('Are you sure you want to delete this inspection?')) {
      const deleted = MockDataService.deleteInspection(id);

      if (deleted) {
        loadInspections();
        if (selectedInspection?._id === id) {
          setSelectedInspection(null);
        }
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">
          Inspections
        </Typography>
        <Button
          variant="contained"
          onClick={() => MockDataService.resetData()}>

          Reset Data
        </Button>
      </Box>

      <Box display="flex" gap={3}>
        
        <TableContainer component={Paper} sx={{ flexGrow: 1, maxWidth: '60%' }}>
          {loading ?
          <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box> :

          <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Inspection #</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Customer</TableCell>
                  <TableCell>Supplier</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Result</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {inspections.map((inspection) =>
              <TableRow
                key={inspection._id}
                hover
                selected={selectedInspection?._id === inspection._id}
                onClick={() => handleViewInspection(inspection)}
                sx={{ cursor: 'pointer' }}>

                    <TableCell>{inspection.inspectionNumber}</TableCell>
                    <TableCell>{inspection.title}</TableCell>
                    <TableCell>{inspection.customer.name}</TableCell>
                    <TableCell>{inspection.supplier.name}</TableCell>
                    <TableCell>{formatDate(inspection.scheduledDate)}</TableCell>
                    <TableCell>
                      <StatusChip status={inspection.status} />
                    </TableCell>
                    <TableCell>
                      <ResultChip result={inspection.result} />
                    </TableCell>
                    <TableCell>
                      <Box display="flex">
                        <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewInspection(inspection);
                      }}>

                          <ViewIcon fontSize="small" />
                        </IconButton>
                        
                        {['scheduled', 'in-progress'].includes(inspection.status) &&
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConductInspection(inspection);
                      }}>

                            <AssignmentIcon fontSize="small" />
                          </IconButton>
                    }
                        
                        {inspection.status === 'scheduled' &&
                    <IconButton
                      size="small"
                      color="error"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteInspection(inspection._id);
                      }}>

                            <DeleteIcon fontSize="small" />
                          </IconButton>
                    }
                      </Box>
                    </TableCell>
                  </TableRow>
              )}
              </TableBody>
            </Table>
          }
        </TableContainer>

        
        <Paper sx={{ p: 2, flexGrow: 1, maxWidth: '40%' }}>
          {selectedInspection ?
          <Box>
              <Typography variant="h5" gutterBottom>
                {selectedInspection.title}
              </Typography>
              
              <Box display="flex" gap={1} mb={2}>
                <Chip label={selectedInspection.inspectionNumber} color="primary" />
                <StatusChip status={selectedInspection.status} />
                <ResultChip result={selectedInspection.result} />
              </Box>
              
              <Typography variant="body1" paragraph>
                {selectedInspection.description}
              </Typography>
              
              <Box mb={2}>
                <Typography variant="subtitle1">Customer</Typography>
                <Typography variant="body2">{selectedInspection.customer.name}</Typography>
              </Box>
              
              <Box mb={2}>
                <Typography variant="subtitle1">Supplier</Typography>
                <Typography variant="body2">{selectedInspection.supplier.name}</Typography>
              </Box>
              
              <Box mb={2}>
                <Typography variant="subtitle1">Timeline</Typography>
                <Typography variant="body2">
                  Scheduled: {formatDate(selectedInspection.scheduledDate)}
                </Typography>
                {selectedInspection.startDate &&
              <Typography variant="body2">
                    Started: {formatDate(selectedInspection.startDate)}
                  </Typography>
              }
                {selectedInspection.completionDate &&
              <Typography variant="body2">
                    Completed: {formatDate(selectedInspection.completionDate)}
                  </Typography>
              }
              </Box>
              
              {selectedInspection.checklistItems.length > 0 &&
            <Box mb={2}>
                  <Typography variant="subtitle1" gutterBottom>Checklist Items</Typography>
                  {selectedInspection.checklistItems.map((item) =>
              <Box key={item.id} mb={1}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2" fontWeight="bold">
                          {item.description}
                        </Typography>
                        <Chip
                    label={item.result.toUpperCase()}
                    color={
                    item.result === 'pass' ? 'success' :
                    item.result === 'fail' ? 'error' :
                    'default'
                    }
                    size="small" />

                      </Box>
                      {item.notes &&
                <Typography variant="body2" color="text.secondary">
                          Notes: {item.notes}
                        </Typography>
                }
                    </Box>
              )}
                </Box>
            }
              
              <Box>
                <Typography variant="subtitle1">Notes</Typography>
                <Typography variant="body2">
                  {selectedInspection.notes || 'No notes available'}
                </Typography>
              </Box>
            </Box> :

          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
              <Typography color="text.secondary">
                Select an inspection to view details
              </Typography>
            </Box>
          }
        </Paper>
      </Box>
    </Box>);

};

export default InspectionList;