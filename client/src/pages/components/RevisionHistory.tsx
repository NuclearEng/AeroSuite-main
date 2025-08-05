import React, { useState } from 'react';
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
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Divider,
  Tooltip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  CompareArrows as CompareIcon,
  Visibility as ViewIcon,
  History as HistoryIcon,
  CheckCircle as ActiveIcon,
  Archive as ArchiveIcon,
  Warning as DeprecatedIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import useComponentRevisions, { ComponentRevision } from '../../hooks/useComponentRevisions';

interface RevisionHistoryProps {
  componentId: string;
}

const RevisionHistory: React.FC<RevisionHistoryProps> = ({ componentId }) => {
  const {
    loading,
    error,
    revisions,
    currentRevision,
    createRevision,
    updateRevisionStatus
  } = useComponentRevisions(componentId);

  const [openNewDialog, setOpenNewDialog] = useState(false);
  const [openCompareDialog, setOpenCompareDialog] = useState(false);
  const [formData, setFormData] = useState({
    version: '',
    changes: '',
    changedBy: '',
    status: 'active' as 'active' | 'deprecated' | 'archived'
  });
  const [compareRevisions, setCompareRevisions] = useState<{ a?: string; b?: string }>({});

  // Status rendering helpers
  const getStatusChip = (status: string) => {
    switch (status) {
      case 'active':
        return <Chip icon={<ActiveIcon />} label="Active" color="success" size="small" />;
      case 'deprecated':
        return <Chip icon={<DeprecatedIcon />} label="Deprecated" color="warning" size="small" />;
      case 'archived':
        return <Chip icon={<ArchiveIcon />} label="Archived" color="default" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
  };

  // Handle form changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle new revision submission
  const handleCreateRevision = async () => {
    const success = await createRevision({
      componentId,
      version: formData.version,
      changes: formData.changes,
      changedBy: formData.changedBy,
      status: formData.status,
      changeDate: new Date().toISOString()
    });

    if (success) {
      setOpenNewDialog(false);
      setFormData({
        version: '',
        changes: '',
        changedBy: '',
        status: 'active'
      });
    }
  };

  // Handle status change
  const handleStatusChange = async (revisionId: string, newStatus: 'active' | 'deprecated' | 'archived') => {
    await updateRevisionStatus(revisionId, newStatus);
  };

  // Handle compare selection
  const handleCompareSelect = (revisionId: string, position: 'a' | 'b') => {
    setCompareRevisions(prev => ({
      ...prev,
      [position]: revisionId
    }));
  };

  // Get revision by ID
  const getRevisionById = (id?: string): ComponentRevision | undefined => {
    if (!id) return undefined;
    return revisions.find(rev => rev._id === id);
  };

  if (loading && revisions.length === 0) {
    return (
      <Box display="flex" justifyContent="center" p={3}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" component="h2">
          <HistoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Revision History
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenNewDialog(true)}
          size="small"
        >
          New Revision
        </Button>
      </Box>

      {revisions.length === 0 ? (
        <Alert severity="info">
          No revision history available for this component. Create the first revision.
        </Alert>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Version</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Changed By</TableCell>
                <TableCell>Changes</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {revisions.map((revision) => (
                <TableRow 
                  key={revision._id}
                  sx={{ 
                    bgcolor: revision._id === currentRevision?._id ? 'action.selected' : 'inherit'
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      {revision.version}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {format(new Date(revision.changeDate), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>{revision.changedBy}</TableCell>
                  <TableCell sx={{ maxWidth: 250 }}>
                    <Typography variant="body2" noWrap>
                      {revision.changes}
                    </Typography>
                  </TableCell>
                  <TableCell>{getStatusChip(revision.status)}</TableCell>
                  <TableCell align="right">
                    <Tooltip title="View Details">
                      <IconButton size="small">
                        <ViewIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Compare">
                      <IconButton 
                        size="small"
                        onClick={() => handleCompareSelect(revision._id, 
                          !compareRevisions.a ? 'a' : 'b'
                        )}
                        color={
                          compareRevisions.a === revision._id || compareRevisions.b === revision._id
                            ? 'primary'
                            : 'default'
                        }
                      >
                        <CompareIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {revision._id !== currentRevision?._id && revision.status !== 'active' && (
                      <Tooltip title="Set as Active">
                        <IconButton 
                          size="small" 
                          onClick={() => handleStatusChange(revision._id, 'active')}
                          color="success"
                        >
                          <ActiveIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {revision.status !== 'deprecated' && (
                      <Tooltip title="Mark as Deprecated">
                        <IconButton 
                          size="small"
                          onClick={() => handleStatusChange(revision._id, 'deprecated')}
                          color="warning"
                        >
                          <DeprecatedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    {revision.status !== 'archived' && (
                      <Tooltip title="Archive">
                        <IconButton 
                          size="small"
                          onClick={() => handleStatusChange(revision._id, 'archived')}
                        >
                          <ArchiveIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {Object.values(compareRevisions).filter(Boolean).length === 2 && (
        <Box mt={2} display="flex" justifyContent="center">
          <Button 
            variant="outlined"
            startIcon={<CompareIcon />}
            onClick={() => setOpenCompareDialog(true)}
          >
            Compare Revisions
          </Button>
        </Box>
      )}

      {/* New Revision Dialog */}
      <Dialog open={openNewDialog} onClose={() => setOpenNewDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Revision</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                label="Version"
                name="version"
                value={formData.version}
                onChange={handleInputChange}
                fullWidth
                required
                placeholder="e.g. 1.2.0"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                label="Changed By"
                name="changedBy"
                value={formData.changedBy}
                onChange={handleInputChange}
                fullWidth
                required
                placeholder="Your name"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Changes"
                name="changes"
                value={formData.changes}
                onChange={handleInputChange}
                fullWidth
                required
                multiline
                rows={4}
                placeholder="Describe the changes made in this revision"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                label="Status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                fullWidth
                required
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="deprecated">Deprecated</MenuItem>
                <MenuItem value="archived">Archived</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenNewDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateRevision} 
            variant="contained"
            disabled={!formData.version || !formData.changes || !formData.changedBy}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Compare Revisions Dialog */}
      <Dialog 
        open={openCompareDialog} 
        onClose={() => setOpenCompareDialog(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>Compare Revisions</DialogTitle>
        <DialogContent>
          {compareRevisions.a && compareRevisions.b && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Version: {getRevisionById(compareRevisions.a)?.version}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {format(new Date(getRevisionById(compareRevisions.a)?.changeDate || ''), 'MMM dd, yyyy')}
                  {' by '}
                  {getRevisionById(compareRevisions.a)?.changedBy}
                </Typography>
                <Box bgcolor="grey.100" p={2} borderRadius={1} mt={1}>
                  <Typography variant="body2">
                    {getRevisionById(compareRevisions.a)?.changes}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle1" gutterBottom>
                  Version: {getRevisionById(compareRevisions.b)?.version}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {format(new Date(getRevisionById(compareRevisions.b)?.changeDate || ''), 'MMM dd, yyyy')}
                  {' by '}
                  {getRevisionById(compareRevisions.b)?.changedBy}
                </Typography>
                <Box bgcolor="grey.100" p={2} borderRadius={1} mt={1}>
                  <Typography variant="body2">
                    {getRevisionById(compareRevisions.b)?.changes}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompareRevisions({})}>Clear Selection</Button>
          <Button onClick={() => setOpenCompareDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RevisionHistory; 