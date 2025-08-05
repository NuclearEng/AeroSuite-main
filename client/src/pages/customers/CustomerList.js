import React from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Button,
  TextField,
  InputAdornment
} from '@mui/material';
import { Search as SearchIcon, Add as AddIcon } from '@mui/icons-material';
import { Link } from 'react-router-dom';

const CustomerList = () => {
  // Mock data for customers
  const customers = [
    { id: 1, name: 'Global Airlines', industry: 'Commercial Aviation', location: 'Chicago, IL', status: 'Active' },
    { id: 2, name: 'Defense Systems Inc.', industry: 'Defense', location: 'Arlington, VA', status: 'Active' },
    { id: 3, name: 'Space Exploration Technologies', industry: 'Space', location: 'Houston, TX', status: 'Active' },
    { id: 4, name: 'Regional Jets Co.', industry: 'Commercial Aviation', location: 'Atlanta, GA', status: 'Inactive' },
    { id: 5, name: 'Military Aircraft Division', industry: 'Defense', location: 'San Diego, CA', status: 'Under Review' }
  ];

  return (
    <Container>
      <Box sx={{ my: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Customers
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            startIcon={<AddIcon />}
            component={Link}
            to="/customers/new"
          >
            Add Customer
          </Button>
        </Box>
        
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            placeholder="Search customers..."
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
          <Table aria-label="customers table">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Industry</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell component="th" scope="row">
                    {customer.name}
                  </TableCell>
                  <TableCell>{customer.industry}</TableCell>
                  <TableCell>{customer.location}</TableCell>
                  <TableCell>{customer.status}</TableCell>
                  <TableCell>
                    <Button 
                      variant="outlined" 
                      size="small" 
                      component={Link}
                      to={`/customers/${customer.id}`}
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

export default CustomerList; 