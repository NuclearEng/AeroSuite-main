import React, { useState } from 'react';
import { Box, Typography, Paper, Grid, Button, Divider } from '@mui/material';
import {
  PageHeader,
  DataTable,
  FiltersToolbar,
  StatusBadge,
  ConfirmationDialog,
} from '../components/common';

const ComponentsDemo: React.FC = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState<any>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Demo data for DataTable
  const mockData = [
    { id: 1, name: 'Aerospace Parts Inc.', status: 'active', rating: 4.5, location: 'Seattle, WA' },
    { id: 2, name: 'Global Aviation Technologies', status: 'active', rating: 4.2, location: 'Phoenix, AZ' },
    { id: 3, name: 'Precision Manufacturing Ltd', status: 'inactive', rating: 3.8, location: 'Dallas, TX' },
    { id: 4, name: 'Electronic Components Co.', status: 'active', rating: 4.0, location: 'San Jose, CA' },
    { id: 5, name: 'MetalWorks Industries', status: 'pending', rating: 3.5, location: 'Pittsburgh, PA' },
  ];
  
  // Filter definitions for FiltersToolbar
  const filterDefinitions = [
    {
      id: 'status',
      label: 'Status',
      type: 'select' as const,
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' },
        { value: 'pending', label: 'Pending' },
      ],
      showClearButton: true,
    },
    {
      id: 'rating',
      label: 'Min Rating',
      type: 'select' as const,
      options: [
        { value: '4', label: '4+ Stars' },
        { value: '3', label: '3+ Stars' },
        { value: '2', label: '2+ Stars' },
      ],
      showClearButton: true,
    },
  ];
  
  // Column definitions for DataTable
  const columns = [
    { id: 'id', label: 'ID', numeric: false },
    { id: 'name', label: 'Name', numeric: false },
    { 
      id: 'status', 
      label: 'Status', 
      numeric: false,
      format: (value: string) => {
        const statusMap: Record<string, { color: string, label: string }> = {
          active: { color: 'success', label: 'Active' },
          inactive: { color: 'error', label: 'Inactive' },
          pending: { color: 'warning', label: 'Pending' },
        };
        
        const status = statusMap[value] || { color: 'default', label: value };
        
        return (
          <StatusBadge 
            status={status.color as any} 
            label={status.label} 
          />
        );
      } 
    },
    { id: 'rating', label: 'Rating', numeric: true },
    { id: 'location', label: 'Location', numeric: false },
  ];
  
  // Handle filter changes
  const handleFilterChange = (filters: any[]) => {
    setActiveFilters(filters);
  };
  
  // Handle search changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };
  
  return (
    <Box>
      <PageHeader
        title="Components Demo"
        subtitle="Showcase of reusable UI components"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Components Demo' },
        ]}
      />
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Status Badges
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <StatusBadge status="success" label="Success" />
          <StatusBadge status="warning" label="Warning" />
          <StatusBadge status="error" label="Error" />
          <StatusBadge status="info" label="Info" />
          <StatusBadge status="default" label="Default" />
        </Box>
      </Paper>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Confirmation Dialog
        </Typography>
        <Button 
          variant="outlined" 
          color="primary" 
          onClick={() => setDialogOpen(true)}
        >
          Open Dialog
        </Button>
        
        <ConfirmationDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onConfirm={() => {
            // Demo action
            setDialogOpen(false);
          }}
          title="Confirm Action"
          message="Are you sure you want to perform this action? This cannot be undone."
          confirmButtonText="Confirm"
          type="confirm"
        />
      </Paper>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Filters Toolbar
        </Typography>
        <FiltersToolbar
          filters={filterDefinitions}
          activeFilters={activeFilters}
          onFilterChange={handleFilterChange}
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          showSearch
          showActiveFilters
          showFilterButton
          collapsible
        />
      </Paper>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Data Table
        </Typography>
        <DataTable
          rows={mockData}
          headCells={columns}
          defaultSortBy="name"
          pagination
          onRowClick={() => {}}
          emptyStateMessage="No data found"
        />
      </Paper>
    </Box>
  );
};

export default ComponentsDemo; 