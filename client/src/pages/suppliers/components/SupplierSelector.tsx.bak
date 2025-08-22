import React from 'react';
import {
  Autocomplete,
  TextField,
  Box,
  Typography,
  Avatar,
  Chip
} from '@mui/material';
import { Supplier } from '../../../services/supplier.service';

interface SupplierSelectorProps {
  suppliers: Supplier[];
  selectedSupplier: Supplier | null;
  onSupplierChange: (supplier: Supplier | null) => void;
  disabled?: boolean;
}

const SupplierSelector: React.FC<SupplierSelectorProps> = ({
  suppliers,
  selectedSupplier,
  onSupplierChange,
  disabled = false
}) => {
  // Generate supplier initials for the avatar
  const getSupplierInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Generate avatar background color based on supplier name
  const getAvatarColor = (name: string) => {
    const colors = [
      '#1976d2', // blue
      '#388e3c', // green
      '#d32f2f', // red
      '#f57c00', // orange
      '#7b1fa2', // purple
      '#00796b', // teal
      '#c2185b', // pink
      '#455a64'  // blueGrey
    ];
    
    // Simple hash function to generate consistent color
    const hash = name.split('').reduce((acc, char) => {
      return acc + char.charCodeAt(0);
    }, 0);
    
    return colors[hash % colors.length];
  };

  return (
    <Autocomplete
      id="supplier-selector"
      options={suppliers}
      getOptionLabel={(option) => option.name}
      value={selectedSupplier}
      onChange={(_, newValue) => onSupplierChange(newValue)}
      disabled={disabled}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Select Supplier"
          placeholder="Search suppliers..."
          variant="outlined"
          fullWidth
          required
        />
      )}
      renderOption={(props, option) => (
        <Box component="li" {...props}>
          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            <Avatar
              sx={{
                bgcolor: getAvatarColor(option.name),
                width: 32,
                height: 32,
                mr: 2,
                fontSize: '0.9rem'
              }}
            >
              {getSupplierInitials(option.name)}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body1">{option.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {option.code} {option.industry ? `• ${option.industry}` : ''}
              </Typography>
            </Box>
            <Chip
              size="small"
              label={option.status.toUpperCase()}
              color={option.status === 'active' ? 'success' : 
                    option.status === 'inactive' ? 'error' : 'default'}
              variant="outlined"
            />
          </Box>
        </Box>
      )}
    />
  );
};

export default SupplierSelector; 