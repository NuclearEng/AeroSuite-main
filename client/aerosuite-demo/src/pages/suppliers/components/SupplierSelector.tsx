// Component for selecting suppliers
import React from 'react';
import {
  Autocomplete,
  TextField,
  Box,
  Typography,
  Chip
} from '@mui/material';
import { LocationOn as LocationIcon } from '@mui/icons-material';
import type { SupplierSelectorProps } from '../types';

const SupplierSelector: React.FC<SupplierSelectorProps> = ({
  suppliers,
  selectedSupplier,
  onSupplierChange
}) => {
  return (
    <Autocomplete
      options={suppliers}
      getOptionLabel={(option) => `${option.name} (${option.code})`}
      value={selectedSupplier}
      onChange={onSupplierChange}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Select Supplier"
          fullWidth
          required
        />
      )}
      ListboxProps={{
        style: { maxHeight: '250px' }
      }}
      renderOption={(props, option) => (
        <li {...props}>
          <Box sx={{ display: 'flex', flexDirection: 'column', py: 1, width: '100%' }}>
            <Typography variant="body1">{option.name}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">{option.code}</Typography>
              {(option as any).tier && (
                <Chip 
                  label={(option as any).tier === 'tier1' ? 'Tier 1' : 
                        (option as any).tier === 'tier2' ? 'Tier 2' : 'Tier 3'} 
                  size="small" 
                  color="primary"
                />
              )}
              {option.location && (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocationIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">{option.location}</Typography>
                </Box>
              )}
            </Box>
          </Box>
        </li>
      )}
      slotProps={{
        popper: {
          style: { width: 'fit-content', minWidth: '350px' }
        }
      }}
    />
  );
};

export default SupplierSelector; 