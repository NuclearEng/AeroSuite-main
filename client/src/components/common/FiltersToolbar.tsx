import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Button,
  TextField,
  MenuItem,
  Menu,
  Divider,
  Typography,
  Collapse,
  useTheme,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Popover,
  Slider,
  RadioGroup,
  Radio,
  FormControlLabel,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  FilterList as FilterIcon,
  Search as SearchIcon,
  Clear as ClearIcon,
  Add as AddIcon,
  Close as CloseIcon,
  KeyboardArrowDown as ArrowDownIcon,
  KeyboardArrowUp as ArrowUpIcon,
} from '@mui/icons-material';
import { animations } from '../../theme/theme';

// Types for filter options
export type FilterType =
  | 'text'
  | 'select'
  | 'multiSelect'
  | 'boolean'
  | 'date'
  | 'dateRange'
  | 'number'
  | 'numberRange'
  | 'radio'
  | 'toggle';

export interface FilterOption {
  value: string | number | boolean;
  label: string;
  color?: string;
}

export interface FilterDefinition {
  id: string;
  label: string;
  type: FilterType;
  options?: FilterOption[];
  defaultValue?: any;
  minValue?: number;
  maxValue?: number;
  step?: number;
  multiple?: boolean;
  icon?: React.ReactNode;
  showClearButton?: boolean;
}

export interface FilterState {
  id: string;
  value: any;
}

export interface FiltersToolbarProps {
  filters: FilterDefinition[];
  activeFilters?: FilterState[];
  onFilterChange: (filters: FilterState[]) => void;
  onSearchChange?: (searchTerm: string) => void;
  searchTerm?: string;
  searchPlaceholder?: string;
  showSearch?: boolean;
  loading?: boolean;
  showActiveFilters?: boolean;
  showFilterButton?: boolean;
  maxShownFilters?: number;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  variant?: 'outlined' | 'elevation' | 'none';
  elevation?: number;
  size?: 'small' | 'medium';
}

const FiltersToolbar: React.FC<FiltersToolbarProps> = ({
  filters = [],
  activeFilters = [],
  onFilterChange,
  onSearchChange,
  searchTerm = '',
  searchPlaceholder = 'Search...',
  showSearch = true,
  loading = false,
  showActiveFilters = true,
  showFilterButton = true,
  maxShownFilters = 5,
  collapsible = false,
  defaultCollapsed = false,
  variant = 'outlined',
  elevation = 0,
  size = 'small',
}) => {
  const theme = useTheme();
  
  // State for filters menu
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedFilter, setSelectedFilter] = useState<FilterDefinition | null>(null);
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  const [collapsed, setCollapsed] = useState(defaultCollapsed && collapsible);
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
  
  // Update local search term when prop changes
  useEffect(() => {
    setLocalSearchTerm(searchTerm);
  }, [searchTerm]);
  
  // Defensive defaults
  const safeFilters = filters || [];
  const safeActiveFilters = activeFilters || [];
  
  // Determine which filters to show in the main toolbar vs "more filters" dropdown
  const visibleFilters = safeActiveFilters.slice(0, maxShownFilters);
  const hiddenFilters = safeActiveFilters.slice(maxShownFilters);
  
  // Get filter definition by ID
  const getFilterById = (id: string): FilterDefinition | undefined => {
    return safeFilters.find((filter) => filter.id === id);
  };
  
  // Get filter value by ID
  const getFilterValueById = (id: string): any => {
    const filter = safeActiveFilters.find((f) => f.id === id);
    return filter ? filter.value : undefined;
  };
  
  // Handle filter button click
  const handleFilterButtonClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  // Handle filter menu close
  const handleFilterMenuClose = () => {
    setAnchorEl(null);
  };
  
  // Handle filter option click
  const handleFilterOptionClick = (filter: FilterDefinition) => {
    setSelectedFilter(filter);
    handleFilterMenuClose();
  };
  
  // Handle filter selector click
  const handleFilterSelectorClick = (event: React.MouseEvent<HTMLElement>, filter: FilterDefinition) => {
    setSelectedFilter(filter);
    setFilterAnchorEl(event.currentTarget);
  };
  
  // Handle filter selector close
  const handleFilterSelectorClose = () => {
    setFilterAnchorEl(null);
    setSelectedFilter(null);
  };
  
  // Handle search change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setLocalSearchTerm(value);
    if (onSearchChange) {
      onSearchChange(value);
    }
  };
  
  // Handle filter value change
  const handleFilterValueChange = (id: string, value: any) => {
    // Get current filters
    const currentFilters = [...safeActiveFilters];
    
    // Check if filter already exists
    const existingFilterIndex = currentFilters.findIndex((f) => f.id === id);
    
    if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
      // Remove filter if value is empty
      if (existingFilterIndex !== -1) {
        currentFilters.splice(existingFilterIndex, 1);
      }
    } else {
      // Update or add filter
      const newFilter: FilterState = { id, value };
      
      if (existingFilterIndex !== -1) {
        currentFilters[existingFilterIndex] = newFilter;
      } else {
        currentFilters.push(newFilter);
      }
    }
    
    // Call onChange handler
    onFilterChange(currentFilters);
  };
  
  // Handle clear filter
  const handleClearFilter = (id: string) => {
    const currentFilters = safeActiveFilters.filter((f) => f.id !== id);
    onFilterChange(currentFilters);
  };
  
  // Handle clear all filters
  const handleClearAllFilters = () => {
    onFilterChange([]);
    if (onSearchChange) {
      onSearchChange('');
    }
    setLocalSearchTerm('');
  };
  
  // Handle clear search
  const handleClearSearch = () => {
    setLocalSearchTerm('');
    if (onSearchChange) {
      onSearchChange('');
    }
  };
  
  // Toggle collapsed state
  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };
  
  // Render filter value as display text
  const renderFilterValueDisplay = (filter: FilterDefinition, value: any): string => {
    if (value === undefined || value === null) {
      return '';
    }
    
    switch (filter.type) {
      case 'select':
      case 'radio':
        const option = filter.options?.find((opt) => opt.value === value);
        return option ? option.label : String(value);
        
      case 'multiSelect':
        if (!Array.isArray(value) || value.length === 0) {
          return '';
        }
        
        const selectedOptions = filter.options
          ?.filter((opt) => value.includes(opt.value))
          .map((opt) => opt.label);
          
        if ((selectedOptions?.length ?? 0) === 1) {
          return selectedOptions?.[0] ?? '';
        }
        
        return `${selectedOptions?.[0] ?? ''} (+${(selectedOptions?.length ?? 0) - 1})`;
        
      case 'boolean':
        return value ? 'Yes' : 'No';
        
      case 'date':
        if (value instanceof Date) {
          return value.toLocaleDateString();
        }
        return String(value);
        
      case 'dateRange':
        if (Array.isArray(value) && value.length === 2) {
          const [start, end] = value;
          if (start instanceof Date && end instanceof Date) {
            return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
          }
        }
        return String(value);
        
      case 'numberRange':
        if (Array.isArray(value) && value.length === 2) {
          return `${value[0]} - ${value[1]}`;
        }
        return String(value);
        
      default:
        return String(value);
    }
  };
  
  // Render filter input based on type
  const renderFilterInput = (filter: FilterDefinition) => {
    const value = getFilterValueById(filter.id);
    
    switch (filter.type) {
      case 'text':
        return (
          <TextField
            fullWidth
            size={size}
            value={value || ''}
            onChange={(e) => handleFilterValueChange(filter.id, e.target.value)}
            placeholder={`Filter by ${filter.label}`}
            variant="outlined"
            InputProps={{
              endAdornment: value ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => handleClearFilter(filter.id)}
                    edge="end"
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
          />
        );
        
      case 'select':
        return (
          <FormControl fullWidth size={size} variant="outlined">
            <InputLabel id={`filter-select-${filter.id}`}>{filter.label}</InputLabel>
            <Select
              labelId={`filter-select-${filter.id}`}
              value={value || ''}
              onChange={(e) => handleFilterValueChange(filter.id, e.target.value)}
              label={filter.label}
              renderValue={(selected) => {
                const option = filter.options?.find((opt) => opt.value === selected);
                return option?.label || selected;
              }}
            >
              {filter.showClearButton && (
                <MenuItem value="">
                  <em>None</em>
                </MenuItem>
              )}
              {filter.options?.map((option) => (
                <MenuItem key={String(option.value)} value={typeof option.value === 'boolean' ? String(option.value) : option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
        
      case 'multiSelect':
        return (
          <FormControl fullWidth size={size} variant="outlined">
            <InputLabel id={`filter-multi-select-${filter.id}`}>{filter.label}</InputLabel>
            <Select
              labelId={`filter-multi-select-${filter.id}`}
              multiple
              value={value || []}
              onChange={(e) => handleFilterValueChange(filter.id, e.target.value)}
              input={<OutlinedInput label={filter.label} />}
              renderValue={(selected) => {
                if (!Array.isArray(selected) || selected.length === 0) {
                  return <em>Select options</em>;
                }
                
                if (selected.length === 1) {
                  const option = filter.options?.find((opt) => opt.value === selected[0]);
                  return option?.label || selected[0];
                }
                
                return `${selected.length} selected`;
              }}
            >
              {filter.options?.map((option) => (
                <MenuItem key={String(option.value)} value={typeof option.value === 'boolean' ? String(option.value) : option.value}>
                  <Checkbox checked={(value || []).indexOf(option.value) > -1} />
                  <ListItemText primary={option.label} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        );
        
      case 'boolean':
        return (
          <FormControl component="fieldset">
            <Typography variant="subtitle2" gutterBottom>
              {filter.label}
            </Typography>
            <ToggleButtonGroup
              size={size}
              value={value}
              exclusive
              onChange={(_, newValue) => {
                if (newValue !== null) {
                  handleFilterValueChange(filter.id, newValue);
                }
              }}
            >
              <ToggleButton value={true}>Yes</ToggleButton>
              <ToggleButton value={false}>No</ToggleButton>
            </ToggleButtonGroup>
          </FormControl>
        );
        
      case 'date':
        return (
          <DatePicker
            label={filter.label}
            value={value || null}
            onChange={(date) => handleFilterValueChange(filter.id, date)}
            slotProps={{
              textField: {
                size,
                fullWidth: true,
                variant: 'outlined',
              },
            }}
          />
        );
        
      case 'dateRange':
        return (
          <Stack spacing={2}>
            <Typography variant="subtitle2">
              {filter.label}
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <DatePicker
                label="From"
                value={Array.isArray(value) ? value[0] : null}
                onChange={(date) => {
                  const currentRange = Array.isArray(value) ? [...value] : [null, null];
                  currentRange[0] = date;
                  handleFilterValueChange(filter.id, currentRange);
                }}
                slotProps={{
                  textField: {
                    size,
                    fullWidth: true,
                    variant: 'outlined',
                  },
                }}
              />
              <DatePicker
                label="To"
                value={Array.isArray(value) ? value[1] : null}
                onChange={(date) => {
                  const currentRange = Array.isArray(value) ? [...value] : [null, null];
                  currentRange[1] = date;
                  handleFilterValueChange(filter.id, currentRange);
                }}
                slotProps={{
                  textField: {
                    size,
                    fullWidth: true,
                    variant: 'outlined',
                  },
                }}
              />
            </Box>
          </Stack>
        );
        
      case 'number':
        return (
          <TextField
            fullWidth
            size={size}
            type="number"
            label={filter.label}
            value={value || ''}
            onChange={(e) => handleFilterValueChange(filter.id, e.target.value ? Number(e.target.value) : '')}
            variant="outlined"
            inputProps={{
              min: filter.minValue,
              max: filter.maxValue,
              step: filter.step || 1,
            }}
          />
        );
        
      case 'numberRange':
        return (
          <Box sx={{ width: '100%', px: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              {filter.label}: {Array.isArray(value) ? `${value[0]} - ${value[1]}` : ''}
            </Typography>
            <Slider
              value={value || [filter.minValue || 0, filter.maxValue || 100]}
              onChange={(_, newValue) => handleFilterValueChange(filter.id, newValue)}
              valueLabelDisplay="auto"
              min={filter.minValue || 0}
              max={filter.maxValue || 100}
              step={filter.step || 1}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Typography variant="caption" color="text.secondary">
                {filter.minValue || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {filter.maxValue || 100}
              </Typography>
            </Box>
          </Box>
        );
        
      case 'radio':
        return (
          <FormControl component="fieldset">
            <Typography variant="subtitle2" gutterBottom>
              {filter.label}
            </Typography>
            <RadioGroup
              value={value || ''}
              onChange={(e) => handleFilterValueChange(filter.id, e.target.value)}
            >
              {filter.options?.map((option) => (
                <FormControlLabel
                  key={String(option.value)}
                  value={option.value}
                  control={<Radio size="small" />}
                  label={option.label}
                />
              ))}
            </RadioGroup>
          </FormControl>
        );
        
      case 'toggle':
        return (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              {filter.label}
            </Typography>
            <ToggleButtonGroup
              size={size}
              value={value || []}
              onChange={(_, newValue) => handleFilterValueChange(filter.id, newValue)}
              aria-label={filter.label}
              sx={{ flexWrap: 'wrap' }}
            >
              {filter.options?.map((option) => (
                <ToggleButton 
                  key={String(option.value)} 
                  value={option.value}
                  sx={{ mb: 0.5 }}
                >
                  {option.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
        );
        
      default:
        return null;
    }
  };
  
  // Determine the container component and props based on variant
  const ContainerComponent: React.ElementType = variant === 'none' ? Box : Paper;
  const containerProps = variant === 'none' 
    ? {} 
    : variant === 'outlined' 
      ? { variant: 'outlined' as const } 
      : { elevation };
  
  return (
    <ContainerComponent 
      {...containerProps}
      sx={{ 
        mb: 3, 
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      {/* Main Toolbar */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 1,
          p: 2,
          borderBottom: collapsible ? `1px solid ${theme.palette.divider}` : 'none',
        }}
      >
        {/* Search Field */}
        {showSearch && (
          <TextField
            placeholder={searchPlaceholder}
            size={size}
            value={localSearchTerm}
            onChange={handleSearchChange}
            disabled={loading}
            variant="outlined"
            sx={{
              flexGrow: 1,
              minWidth: { xs: '100%', sm: 200 },
              maxWidth: { sm: 300 },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
              endAdornment: localSearchTerm ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={handleClearSearch}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
          />
        )}
        
        {/* Visible Filter Chips */}
        {showActiveFilters && visibleFilters.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {visibleFilters.map((filter) => {
              const filterDef = getFilterById(filter.id);
              if (!filterDef) return null;
              
              return (
                <Chip
                  key={filter.id}
                  label={`${filterDef.label}: ${renderFilterValueDisplay(filterDef, filter.value)}`}
                  onDelete={() => handleClearFilter(filter.id)}
                  onClick={(e) => handleFilterSelectorClick(e, filterDef)}
                  size={size}
                  sx={{
                    transition: animations.microInteraction,
                    '&:hover': {
                      backgroundColor: theme.palette.primary.main + '20',
                    },
                  }}
                />
              );
            })}
            
            {/* More Filters Chip */}
            {hiddenFilters.length > 0 && (
              <Chip
                label={`+${hiddenFilters.length} more`}
                onClick={handleFilterButtonClick}
                size={size}
                sx={{
                  transition: animations.microInteraction,
                  '&:hover': {
                    backgroundColor: theme.palette.primary.main + '20',
                  },
                }}
              />
            )}
            
            {/* Clear All Button */}
            {safeActiveFilters.length > 0 && (
              <Button
                size={size}
                variant="outlined"
                color="primary"
                onClick={handleClearAllFilters}
                startIcon={<ClearIcon />}
                sx={{ ml: 1 }}
              >
                Clear All
              </Button>
            )}
          </Box>
        )}
        
        {/* Filter Button */}
        {showFilterButton && (
          <Tooltip title="Add filter">
            <IconButton
              color="primary"
              onClick={handleFilterButtonClick}
              disabled={loading}
              size={size === 'small' ? 'small' : 'medium'}
            >
              <FilterIcon />
            </IconButton>
          </Tooltip>
        )}
        
        {/* Collapse Toggle Button */}
        {collapsible && (
          <Tooltip title={collapsed ? 'Show more filters' : 'Hide filters'}>
            <IconButton
              onClick={toggleCollapsed}
              size={size === 'small' ? 'small' : 'medium'}
            >
              {collapsed ? <ArrowDownIcon /> : <ArrowUpIcon />}
            </IconButton>
          </Tooltip>
        )}
      </Box>
      
      {/* Collapsible Additional Filters */}
      {collapsible && (
        <Collapse in={!collapsed}>
          <Box
            sx={{
              p: 2,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            {safeFilters.map((filter) => (
              <Box
                key={filter.id}
                sx={{
                  minWidth: 200,
                  flexBasis: '22%',
                  flexGrow: 1,
                }}
              >
                {renderFilterInput(filter)}
              </Box>
            ))}
          </Box>
        </Collapse>
      )}
      
      {/* Filter Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleFilterMenuClose}
        PaperProps={{
          elevation: 3,
          sx: {
            minWidth: 200,
            maxHeight: 400,
            overflow: 'auto',
            mt: 1,
            borderRadius: 1,
          },
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{ px: 2, py: 1, fontWeight: 600 }}
        >
          Add Filter
        </Typography>
        <Divider />
        {safeFilters
          .filter((filter) => !safeActiveFilters.some((af) => af.id === filter.id))
          .map((filter) => (
            <MenuItem
              key={filter.id}
              onClick={() => handleFilterOptionClick(filter)}
              sx={{ px: 2, py: 1 }}
            >
              {filter.icon && (
                <Box component="span" sx={{ mr: 1, display: 'flex', alignItems: 'center' }}>
                  {filter.icon}
                </Box>
              )}
              {filter.label}
            </MenuItem>
          ))}
        {safeFilters.length === safeActiveFilters.length && (
          <Typography
            variant="body2"
            sx={{ p: 2, color: 'text.secondary' }}
          >
            All filters are active
          </Typography>
        )}
      </Menu>
      
      {/* Filter Selector Popover */}
      <Popover
        open={Boolean(filterAnchorEl)}
        anchorEl={filterAnchorEl}
        onClose={handleFilterSelectorClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            p: 2,
            width: 300,
            maxWidth: '100%',
            borderRadius: 1,
          },
        }}
      >
        {selectedFilter && (
          <>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1">{selectedFilter.label}</Typography>
              <IconButton size="small" onClick={handleFilterSelectorClose}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
            {renderFilterInput(selectedFilter)}
          </>
        )}
      </Popover>
    </ContainerComponent>
  );
};

export default FiltersToolbar; 