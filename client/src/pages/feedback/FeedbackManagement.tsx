import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  Chip,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Divider,
  CircularProgress,
  useTheme,
  Alert } from
'@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Refresh as RefreshIcon,
  Close as CloseIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as AssignmentIcon,
  CheckCircle as CheckCircleIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Visibility as VisibilityIcon,
  SentimentSatisfied as SentimentSatisfiedIcon,
  SentimentDissatisfied as SentimentDissatisfiedIcon,
  SentimentNeutral as SentimentNeutralIcon,
  SentimentVeryDissatisfied as SentimentVeryDissatisfiedIcon } from
'@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  feedbackService,
  Feedback,
  FeedbackFilterOptions,
  FeedbackStatistics } from
'../../services/feedback.service';
import DataTable from '../../components/common/DataTable';
import FeedbackDetail from './components/FeedbackDetail';
import { z } from 'zod';

const FeedbackManagement: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  // State
  const [loading, setLoading] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [statistics, setStatistics] = useState<FeedbackStatistics | null>(null);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(10);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [tabValue, setTabValue] = useState<number>(0);
  const [filterDialogOpen, setFilterDialogOpen] = useState<boolean>(false);
  const [filters, setFilters] = useState<FeedbackFilterOptions>({});
  const [detailDialogOpen, setDetailDialogOpen] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load feedback data
  useEffect(() => {
    fetchFeedback();
    fetchStatistics();
  }, [page, rowsPerPage, filters]);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const response = await feedbackService.getAllFeedback({
        page: page + 1,
        limit: rowsPerPage,
        sort: '-createdAt',
        ...filters
      });

      setFeedback(response.data);
      setTotalItems(response.pagination.total);
    } catch (_error) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const stats = await feedbackService.getFeedbackStatistics(filters);
      setStatistics(stats);
    } catch (_error) {
      console.error("Error:", err);
    }
  };

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle page change
  const handlePageChange = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  // Handle filter change
  const handleFilterChange = (name: string, value: any) => {
    setFilters((prev: FeedbackFilterOptions) => ({
      ...prev,
      [name]: value
    }));
  };

  // Apply filters
  const applyFilters = () => {
    setPage(0);
    setFilterDialogOpen(false);
    fetchFeedback();
    fetchStatistics();
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({});
    setPage(0);
    setFilterDialogOpen(false);
    fetchFeedback();
    fetchStatistics();
  };

  // Handle row click
  const handleRowClick = (row: any) => {
    setSelectedFeedback(row as Feedback);
    setDetailDialogOpen(true);
  };

  // Zod schema for feedback update validation
  const feedbackUpdateSchema = z.object({
    status: z.string().min(1, 'Status is required').optional(),
    comment: z.string().optional()
    // Add other fields as needed
  });

  // Handle feedback update
  const handleFeedbackUpdate = async (id: string, data: any) => {
    // Zod validation
    const result = feedbackUpdateSchema.safeParse(data);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        if (e.path[0]) errors[e.path[0] as string] = e.message;
      });
      setFormErrors(errors);
      setErrorMessage('Validation error');
      return;
    }
    setFormErrors({});
    setErrorMessage(null);
    try {
      await feedbackService.updateFeedback(id, data);
      fetchFeedback();
      if (selectedFeedback && selectedFeedback._id === id) {
        const updatedFeedback = await feedbackService.getFeedback(id);
        setSelectedFeedback(updatedFeedback);
      }
    } catch (error: any) {
      setErrorMessage(error?.message || 'Error updating feedback');
      console.error("Error:", err);
    }
  };

  // Handle feedback deletion
  const handleFeedbackDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this feedback?')) {
      try {
        await feedbackService.deleteFeedback(id);
        fetchFeedback();
        fetchStatistics();
        if (selectedFeedback && selectedFeedback._id === id) {
          setDetailDialogOpen(false);
          setSelectedFeedback(null);
        }
      } catch (error: any) {
        setErrorMessage(error?.message || 'Error deleting feedback');
        console.error("Error:", err);
      }
    }
  };

  // Get sentiment icon
  const GetSentimentIcon = (sentiment?: {label: string;}) => {
    if (!sentiment) return <SentimentNeutralIcon />;

    switch (sentiment.label) {
      case 'positive':
        return <SentimentSatisfiedIcon style={{ color: theme.palette.success.main }} />;
      case 'negative':
        return <SentimentDissatisfiedIcon style={{ color: theme.palette.error.main }} />;
      case 'mixed':
        return <SentimentVeryDissatisfiedIcon style={{ color: theme.palette.warning.main }} />;
      default:
        return <SentimentNeutralIcon style={{ color: theme.palette.text.secondary }} />;
    }
  };

  // Prepare chart data
  const prepareChartData = () => {
    if (!statistics) return { pieData: [], lineData: [] };

    // Prepare pie chart data for feedback types
    const pieData = statistics.byType.map((item) => ({
      name: item._id || '',
      value: item.count
    }));

    // Prepare line chart data for recent trends
    const lineData = statistics.recentTrend.map((item) => ({
      date: item._id,
      count: item.count,
      avgRating: item.avgRating || 0
    }));

    return { pieData, lineData };
  };

  const { pieData, lineData } = prepareChartData();

  // Table columns
  const columns = [
  {
    id: 'sentiment',
    label: '',
    format: (row: Feedback) => GetSentimentIcon(row.sentiment),
    numeric: false
  },
  {
    id: 'title',
    label: 'Title',
    format: (row: Feedback) => row.title || row.content.substring(0, 30) + '...',
    numeric: false
  },
  {
    id: 'feedbackType',
    label: 'Type',
    format: (row: Feedback) =>
    <Chip
      label={row.feedbackType === 'bug' ? 'Bug' :
      row.feedbackType === 'feature' ? 'Feature' :
      row.feedbackType === 'suggestion' ? 'Suggestion' :
      'Support'}
      size="small"
      color={
      row.feedbackType === 'bug' ? 'error' :
      row.feedbackType === 'feature' ? 'primary' :
      row.feedbackType === 'suggestion' ? 'success' :
      'default'
      } />,


    numeric: false
  },
  {
    id: 'rating',
    label: 'Rating',
    format: (row: Feedback) => row.rating || '-',
    numeric: false
  },
  {
    id: 'source',
    label: 'Source',
    format: (row: Feedback) => row.source === 'app' ? 'App' :
    row.source === 'website' ? 'Website' :
    row.source === 'email' ? 'Email' :
    row.source === 'support' ? 'Support' :
    row.source === 'survey' ? 'Survey' :
    'Other',
    numeric: false
  },
  {
    id: 'status',
    label: 'Status',
    format: (row: Feedback) =>
    <Chip
      label={row.status === 'new' ? 'New' :
      row.status === 'in_progress' ? 'In Progress' :
      row.status === 'resolved' ? 'Resolved' :
      row.status === 'closed' ? 'Closed' :
      'Other'}
      size="small"
      color={
      row.status === 'new' ? 'info' :
      row.status === 'in_progress' ? 'warning' :
      row.status === 'resolved' ? 'success' :
      row.status === 'closed' ? 'default' :
      'primary'
      } />,


    numeric: false
  },
  {
    id: 'createdAt',
    label: 'Created At',
    format: (row: Feedback) => format(new Date(row.createdAt), 'MMM dd, yyyy'),
    numeric: false
  },
  {
    id: 'actions',
    label: 'Actions',
    format: (row: Feedback) =>
    <Box>
          <Tooltip title="View">
            <IconButton size="small" onClick={() => handleRowClick(row)}>
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            handleRowClick(row);
          }}>

              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            handleFeedbackDelete(row._id);
          }}>

              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>,

    numeric: false
  }];


  // Render dashboard tab
  const RenderDashboardTab = () => {
    if (!statistics) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>);

    }

    const totalCount = statistics.totalCount[0]?.count || 0;
    const avgRating = statistics.averageRating[0]?.avg || 0;

    return (
      <Box sx={{ p: 2 }}>
        <Grid container spacing={3}>
          
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Total Feedback
                </Typography>
                <Typography variant="h3">
                  {totalCount}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Avg Rating
                </Typography>
                <Typography variant="h3">
                  {avgRating.toFixed(1)}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  New Feedback
                </Typography>
                <Typography variant="h3">
                  {statistics.byStatus.find((s) => s._id === 'new')?.count || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Resolved Feedback
                </Typography>
                <Typography variant="h3">
                  {statistics.byStatus.find((s) => s._id === 'resolved')?.count || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Feedback By Type
                </Typography>
                <Box sx={{ height: 300 }}>
                  
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Recent Trends
                </Typography>
                <Box sx={{ height: 300 }}>
                  
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Status Breakdown
                </Typography>
                <Grid container spacing={2}>
                  {statistics.byStatus.map((status) =>
                  <Grid item xs={6} sm={3} md={2} key={status._id}>
                      <Paper
                      elevation={1}
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        borderLeft: '4px solid',
                        borderColor:
                        status._id === 'new' ? 'info.main' :
                        status._id === 'in_progress' ? 'warning.main' :
                        status._id === 'resolved' ? 'success.main' :
                        status._id === 'closed' ? 'text.disabled' :
                        'primary.main'
                      }}>

                        <Typography variant="body2" color="textSecondary">
                          {status._id === 'new' ? 'New' :
                        status._id === 'in_progress' ? 'In Progress' :
                        status._id === 'resolved' ? 'Resolved' :
                        status._id === 'closed' ? 'Closed' :
                        'Other'}
                        </Typography>
                        <Typography variant="h6">
                          {status.count}
                        </Typography>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>);

  };

  // Render feedback list tab
  const RenderFeedbackListTab = () => {
    return (
      <Box sx={{ p: 2 }}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
          <TextField
            placeholder="Search"
            variant="outlined"
            size="small"
            value={filters.search || ''}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            InputProps={{
              startAdornment:
              <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>

            }}
            sx={{ width: 300 }} />

          <Box>
            <Button
              variant="outlined"
              startIcon={<FilterIcon />}
              onClick={() => setFilterDialogOpen(true)}
              sx={{ mr: 1 }}>

              Filters
            </Button>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={() => {
                fetchFeedback();
                fetchStatistics();
              }}>

              Refresh
            </Button>
          </Box>
        </Box>
        
        <DataTable
          headCells={columns}
          data={feedback}
          loading={loading}
          totalItems={totalItems}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
          onRowClick={handleRowClick} />

      </Box>);

  };

  // Add zod schema for feedback submission
  const feedbackSubmissionSchema = z.object({
    feedbackType: z.string().min(1, 'Type is required'),
    content: z.string().min(1, 'Content is required'),
    source: z.string().min(1, 'Source is required'),
    title: z.string().optional(),
    rating: z.number().optional()
    // ...other fields as needed
  });

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Feedback Management
      </Typography>
      
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary">

          <Tab label="Dashboard" />
          <Tab label="Feedback List" />
        </Tabs>
        
        <Divider />
        
        {tabValue === 0 && RenderDashboardTab()}
        {tabValue === 1 && RenderFeedbackListTab()}
      </Paper>
      
      
      <Dialog
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        maxWidth="sm"
        fullWidth>

        <DialogTitle>
          Filters
          <IconButton
            aria-label="close"
            onClick={() => setFilterDialogOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}>

            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Type</InputLabel>
                <Select
                  value={filters.feedbackType || ''}
                  onChange={(e) => handleFilterChange('feedbackType', e.target.value)}
                  label="Type">

                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="general">General</MenuItem>
                  <MenuItem value="feature">Feature</MenuItem>
                  <MenuItem value="bug">Bug</MenuItem>
                  <MenuItem value="suggestion">Suggestion</MenuItem>
                  <MenuItem value="support">Support</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  label="Status">

                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="new">New</MenuItem>
                  <MenuItem value="reviewed">Reviewed</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="resolved">Resolved</MenuItem>
                  <MenuItem value="closed">Closed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small">
                <InputLabel>Source</InputLabel>
                <Select
                  value={filters.source || ''}
                  onChange={(e) => handleFilterChange('source', e.target.value)}
                  label="Source">

                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="app">App</MenuItem>
                  <MenuItem value="website">Website</MenuItem>
                  <MenuItem value="email">Email</MenuItem>
                  <MenuItem value="support">Support</MenuItem>
                  <MenuItem value="survey">Survey</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Min Rating"
                type="number"
                size="small"
                InputProps={{ inputProps: { min: 1, max: 5 } }}
                value={filters.minRating || ''}
                onChange={(e) => handleFilterChange('minRating', e.target.value)} />

            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                size="small"
                InputLabelProps={{ shrink: true }}
                value={filters.startDate || ''}
                onChange={(e) => handleFilterChange('startDate', e.target.value)} />

            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="End Date"
                type="date"
                size="small"
                InputLabelProps={{ shrink: true }}
                value={filters.endDate || ''}
                onChange={(e) => handleFilterChange('endDate', e.target.value)} />

            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={resetFilters} color="inherit">
            Reset
          </Button>
          <Button onClick={applyFilters} color="primary" variant="contained">
            Apply
          </Button>
        </DialogActions>
      </Dialog>
      
      
      {selectedFeedback &&
      <FeedbackDetail
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
        feedback={selectedFeedback}
        onUpdate={handleFeedbackUpdate}
        onDelete={handleFeedbackDelete} />

      }
      
      
      {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
    </Box>);

};

export default FeedbackManagement;

// Contract/performance test hooks can be added here for automation frameworks