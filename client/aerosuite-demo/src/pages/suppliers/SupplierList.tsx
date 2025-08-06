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
  LinearProgress,
  Grid,
  CardActionArea,
  CardActions } from
'@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Visibility as ViewIcon,
  Factory as FactoryIcon,
  MoreVert as MoreVertIcon,
  Close as CloseIcon,
  Assessment as AnalyticsIcon,
  Security as RiskIcon,
  Map as MapIcon } from
'@mui/icons-material';
import type { Supplier } from '../../services/mockDataService';
import MockDataService from '../../services/mockDataService';

const SupplierList: React.FC = () => {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionMenuAnchor, setActionMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedSupplier, setSelectedSupplier] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load suppliers
  useEffect(() => {
    MockDataService.initialize();
    loadSuppliers();
  }, []);

  // Load suppliers from the mock service
  const loadSuppliers = () => {
    setLoading(true);
    setError(null);

    try {
      const data = MockDataService.getSuppliers();
      setSuppliers(data);
      setFilteredSuppliers(data);
      setLoading(false);
    } catch (err) {
      setError('Failed to load suppliers. Please try again.');
      setLoading(false);
    }
  };

  // Apply search filter when it changes
  useEffect(() => {
    applyFilters();
  }, [searchQuery, suppliers]);

  // Filter suppliers based on current filters
  const applyFilters = () => {
    let filtered = [...suppliers];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (supplier) =>
        supplier.name.toLowerCase().includes(query) ||
        supplier.code.toLowerCase().includes(query) ||
        supplier.industry && supplier.industry.toLowerCase().includes(query) ||
        supplier.location && supplier.location.toLowerCase().includes(query) ||
        supplier.qualification && supplier.qualification.toLowerCase().includes(query)
      );
    }

    setFilteredSuppliers(filtered);
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
  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, supplierId: string) => {
    event.stopPropagation();
    setActionMenuAnchor(event.currentTarget);
    setSelectedSupplier(supplierId);
  };

  const handleMenuClose = () => {
    setActionMenuAnchor(null);
    setSelectedSupplier(null);
  };

  // Handle view supplier details
  const handleViewSupplier = (id: string) => {
    navigate(`/suppliers/${id}`);
  };

  return (
    <Box>
      
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" component="h1">
          Suppliers
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/suppliers/add')}>

          Add Supplier
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
              placeholder="Search suppliers..."
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
              <IconButton onClick={loadSuppliers}>
                <FactoryIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </CardContent>
      </Card>

      
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}>
          <Card variant="outlined">
            <CardActionArea onClick={() => navigate('/suppliers/network')}>
              <CardContent>
                <Box display="flex" flexDirection="column" alignItems="center" p={2}>
                  <MapIcon sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
                  <Typography variant="h6" align="center">Supplier Network</Typography>
                  <Typography variant="body2" color="text.secondary" align="center">
                    View geographical distribution of suppliers and their relationships
                  </Typography>
                </Box>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
        
        <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}>
          <Card variant="outlined">
            <CardActionArea onClick={() => navigate('/suppliers/analytics')}>
              <CardContent>
                <Box display="flex" flexDirection="column" alignItems="center" p={2}>
                  <AnalyticsIcon sx={{ fontSize: 48, color: 'secondary.main', mb: 1 }} />
                  <Typography variant="h6" align="center">Supplier Analytics</Typography>
                  <Typography variant="body2" color="text.secondary" align="center">
                    Performance metrics, trends, and insights for your suppliers
                  </Typography>
                </Box>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
        
        <Grid sx={{ gridColumn: { xs: 'span 12', md: 'span 4' } }}>
          <Card variant="outlined">
            <CardActionArea onClick={() => navigate('/suppliers/risk-assessment')}>
              <CardContent>
                <Box display="flex" flexDirection="column" alignItems="center" p={2}>
                  <RiskIcon sx={{ fontSize: 48, color: 'error.main', mb: 1 }} />
                  <Typography variant="h6" align="center">Risk Assessment</Typography>
                  <Typography variant="body2" color="text.secondary" align="center">
                    Evaluate and mitigate supply chain risks across multiple factors
                  </Typography>
                </Box>
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      </Grid>

      
      {loading ?
      <LinearProgress sx={{ mb: 2 }} /> :

      <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Supplier Code</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Industry</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>Qualification</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredSuppliers.length > 0 ?
              filteredSuppliers.
              slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).
              map((supplier) =>
              <TableRow
                key={supplier._id}
                hover
                onClick={() => handleViewSupplier(supplier._id)}
                sx={{ cursor: 'pointer' }}>

                        <TableCell>
                          <Chip label={supplier.code} size="small" />
                        </TableCell>
                        <TableCell>
                          <Box display="flex" alignItems="center">
                            <FactoryIcon fontSize="small" sx={{ mr: 1, color: 'secondary.main' }} />
                            <Typography fontWeight="medium">{supplier.name}</Typography>
                          </Box>
                        </TableCell>
                        <TableCell>{supplier.industry || '-'}</TableCell>
                        <TableCell>{supplier.location || '-'}</TableCell>
                        <TableCell>{supplier.qualification || '-'}</TableCell>
                        <TableCell>
                          {supplier.contact ?
                  <Box>
                              <Typography variant="body2">{supplier.contact.name}</Typography>
                              <Typography variant="body2" color="text.secondary">{supplier.contact.email}</Typography>
                            </Box> :

                  '-'
                  }
                        </TableCell>
                        <TableCell align="right">
                          <IconButton
                    size="small"
                    onClick={(e) => handleMenuClick(e, supplier._id)}>

                            <MoreVertIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
              ) :

              <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Box py={3}>
                        <Typography variant="body1" color="textSecondary">
                          No suppliers found
                        </Typography>
                        <Button
                      variant="text"
                      startIcon={<FactoryIcon />}
                      onClick={loadSuppliers}
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
          count={filteredSuppliers.length}
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
          if (selectedSupplier) {
            handleViewSupplier(selectedSupplier);
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

export default SupplierList;