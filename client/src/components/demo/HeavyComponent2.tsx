import React, { ChangeEvent, useState } from 'react';
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
  Chip
} from '@mui/material';
import { green, orange, red } from '@mui/material/colors';

// Mock data generator for a large table
const generateMockData = () => {
  return Array.from({ length: 100 }, (_, index) => ({
    id: index + 1001,
    name: `Project ${String.fromCharCode(65 + (index % 26))}${index}`,
    status: ['Active', 'Pending', 'Completed', 'Cancelled'][Math.floor(Math.random() * 4)],
    progress: Math.floor(Math.random() * 101),
    date: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0],
    priority: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)]
  }));
};

// Heavy component that simulates a data table with pagination
const HeavyComponent2: React.FC = () => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Generate mock data
  const tableData = generateMockData();
  
  // Handle pagination
  const handleChangePage = (event: any, newPage: number) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // Status chip with color based on status
  const StatusChip = ({ status }: { status: string }) => {
    let color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' = 'default';
    let bgColor = '';
    
    switch (status) {
      case 'Active':
        color = 'success';
        bgColor = green[50];
        break;
      case 'Pending':
        color = 'warning';
        bgColor = orange[50];
        break;
      case 'Completed':
        color = 'info';
        bgColor = '#e3f2fd';
        break;
      case 'Cancelled':
        color = 'error';
        bgColor = red[50];
        break;
    }
    
    return (
      <Chip 
        label={status} 
        size="small" 
        color={color} 
        sx={{ 
          minWidth: 80,
          backgroundColor: bgColor
        }}
      />
    );
  };
  
  return (
    <Box width="100%">
      <Typography variant="h5" gutterBottom color="secondary">
        Data Table Component
      </Typography>
      <Typography variant="body2" paragraph>
        This component simulates a heavy data table that would be expensive to load upfront.
        It's dynamically imported only when needed.
      </Typography>
      
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Project Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Progress</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Priority</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {tableData
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row: any) => (
                <TableRow key={row.id} hover>
                  <TableCell component="th" scope="row">
                    #{row.id}
                  </TableCell>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>
                    <StatusChip status={row.status} />
                  </TableCell>
                  <TableCell align="right">{row.progress}%</TableCell>
                  <TableCell>{row.date}</TableCell>
                  <TableCell>{row.priority}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePagination
        component="div"
        count={tableData.length}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25]}
      />
      
      <Paper 
        sx={{ 
          p: 2, 
          mt: 3, 
          backgroundColor: 'rgba(156, 39, 176, 0.05)',
          border: '1px solid rgba(156, 39, 176, 0.2)',
        }}
      >
        <Typography variant="subtitle1" gutterBottom>
          Component Size Metrics
        </Typography>
        <Typography variant="body2">
          • Bundle Size: ~65KB (when built)<br />
          • Data: 100 rows with pagination<br />
          • Dependencies: MUI Table components, state management<br />
          • Time Saved: ~220ms on initial page load
        </Typography>
      </Paper>
    </Box>
  );
};

export default HeavyComponent2; 