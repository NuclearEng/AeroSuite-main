import React, { ChangeEvent } from 'react';
import {
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Button
} from '@mui/material';

export const activityTypeOptions = [
  { value: '', label: 'All Activities' },
  { value: 'inspection_scheduled', label: 'Inspection Scheduled' },
  { value: 'inspection_completed', label: 'Inspection Completed' },
  { value: 'document_added', label: 'Document Added' },
  { value: 'document_updated', label: 'Document Updated' },
  { value: 'communication', label: 'Communication' },
  { value: 'status_change', label: 'Status Change' },
  { value: 'supplier_added', label: 'Supplier Added' },
  { value: 'supplier_removed', label: 'Supplier Removed' },
  { value: 'note_added', label: 'Note Added' },
  { value: 'contract_updated', label: 'Contract Updated' },
  { value: 'user_assigned', label: 'User Assigned' }
];

interface ActivityFiltersProps {
  activityType: string;
  onActivityTypeChange: (event: SelectChangeEvent) => void;
  onClearFilters: () => void;
}

const ActivityFilters: React.FC<ActivityFiltersProps> = ({
  activityType,
  onActivityTypeChange,
  onClearFilters
}) => {
  return (
    <Box sx={{ px: 2, py: 1, bgcolor: 'background.default' }}>
      <FormControl size="small" sx={{ minWidth: 200 }}>
        <InputLabel id="activity-type-label">Activity Type</InputLabel>
        <Select
          labelId="activity-type-label"
          id="activity-type"
          value={activityType}
          onChange={onActivityTypeChange}
          label="Activity Type"
        >
          {activityTypeOptions.map(option => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      
      <Button 
        variant="outlined" 
        size="small" 
        onClick={onClearFilters}
        sx={{ ml: 2 }}
      >
        Clear Filters
      </Button>
    </Box>
  );
};

export default ActivityFilters; 