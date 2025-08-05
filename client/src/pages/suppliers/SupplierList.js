import React, { useState, useEffect } from 'react';
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
  Chip,
  TextField,
  InputAdornment,
  Button,
  IconButton,
  Tooltip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Card,
  CardContent,
  Grid,
  Container
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useNavigate, Link } from 'react-router-dom';

// Mock data for suppliers
const mockSuppliers = [
  { 
    id: 's001', 
    name: 'Aerospace Components Inc.', 
    code: 'ACI-001', 
    type: 'Manufacturer', 
    status: 'active',
    location: 'Seattle, WA',
    createdAt: '2023-01-15'
  },
  { 
    id: 's002', 
    name: 'Global Aviation Parts', 
    code: 'GAP-002', 
    type: 'Distributor', 
    status: 'active',
    location: 'Los Angeles, CA',
    createdAt: '2023-02-10'
  },
  { 
    id: 's003', 
    name: 'Precision Engineering Ltd', 
    code: 'PEL-003', 
    type: 'Manufacturer', 
    status: 'pending',
    location: 'Chicago, IL',
    createdAt: '2023-03-05'
  },
  { 
    id: 's004', 
    name: 'Avionics Solutions', 
    code: 'AVS-004', 
    type: 'Service Provider', 
    status: 'active',
    location: 'Dallas, TX',
    createdAt: '2023-01-20'
  },
  { 
    id: 's005', 
    name: 'JetTech Materials', 
    code: 'JTM-005', 
    type: 'Distributor', 
    status: 'blacklisted',
    location: 'Miami, FL',
    createdAt: '2023-02-25'
  },
  { 
    id: 's006', 
    name: 'Skyway Components', 
    code: 'SKC-006', 
    type: 'Manufacturer', 
    status: 'active',
    location: 'Denver, CO',
    createdAt: '2023-03-15'
  },
  { 
    id: 's007', 
    name: 'Altitude Technologies', 
    code: 'ALT-007', 
    type: 'Service Provider', 
    status: 'pending',
    location: 'Phoenix, AZ',
    createdAt: '2023-04-01'
  },
  { 
    id: 's008', 
    name: 'Turbine Specialists', 
    code: 'TBS-008', 
    type: 'Manufacturer', 
    status: 'active',
    location: 'Atlanta, GA',
    createdAt: '2023-03-10'
  },
];

const SupplierList = () => {
  const navigate = useNavigate();
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setSuppliers(mockSuppliers);
      setFilteredSuppliers(mockSuppliers);
      setLoading(false);
    }, 800);
  }, []);

  useEffect(() => {
    // Apply filters
    let filtered = [...suppliers];
    
    if (searchTerm) {
      filtered = filtered.filter(supplier => 
        supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        supplier.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(supplier => supplier.status === statusFilter);
    }
    
    if (typeFilter !== 'all') {
      filtered = filtered.filter(supplier => supplier.type === typeFilter);
    }
    
    setFilteredSuppliers(filtered);
    setPage(0);
  }, [searchTerm, statusFilter, typeFilter, suppliers]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleStatusFilterChange = (event) => {
    setStatusFilter(event.target.value);
  };

  const handleTypeFilterChange = (event) => {
    setTypeFilter(event.target.value);
  };

  const handleRefresh = () => {
    setLoading(true);
    // Simulate refresh
    setTimeout(() => {
      setSuppliers(mockSuppliers);
      setFilteredSuppliers(mockSuppliers);
      setLoading(false);
    }, 800);
  };

  const handleViewSupplier = (id) => {
    navigate(`/suppliers/${id}`);
  };

  const getStatusChipColor = (status) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'pending':
        return 'warning';
      case 'blacklisted':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Container>
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Suppliers
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            component={Link}
            to="/suppliers/new"
          >
            Add Supplier
          </Button>
        </Box>
        
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Search suppliers..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            variant="outlined"
          />
        </Box>
        
        <TableContainer component={Paper}>
          <Table aria-label="suppliers table">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Rating</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {suppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell component="th" scope="row">
                    {supplier.name}
                  </TableCell>
                  <TableCell>{supplier.location}</TableCell>
                  <TableCell>{supplier.rating}</TableCell>
                  <TableCell>{supplier.status}</TableCell>
                  <TableCell>
                    <Button 
                      variant="outlined" 
                      size="small" 
                      component={Link}
                      to={`/suppliers/${supplier.id}`}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </Container>
  );
};

export default SupplierList; 