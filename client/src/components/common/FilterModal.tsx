import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  IconButton,
  Divider,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  TextField,
  Slider,
  InputAdornment,
  Chip,
  MenuItem,
  Select,
  Grid,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
  useMediaQuery,
  OutlinedInput,
  Tooltip } from
'@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import {
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  FilterList as FilterIcon,
  RestartAlt as ResetIcon,
  CalendarMonth as CalendarIcon,
  Search as SearchIcon,
  Clear as ClearIcon } from
'@mui/icons-material';
// Date formatting will be handled by the date picker component

// Types for filter options
export type FilterOptionValue = string | number | boolean | Date | null | string[];

export interface FilterOption {
  id: string;
  label: string;
  type: 'checkbox' | 'radio' | 'select' | 'multiselect' | 'date' | 'dateRange' | 'text' | 'range' | 'boolean';
  options?: Array<{value: string | number;label: string;}>;
  defaultValue?: FilterOptionValue;
  minValue?: number;
  maxValue?: number;
  step?: number;
  unit?: string;
  section?: string;
}

export interface FilterValues {
  [key: string]: FilterOptionValue;
}

interface FilterModalProps {
  open: boolean;
  onClose: () => void;
  onApply: (filters: FilterValues) => void;
  filterOptions: FilterOption[];
  initialValues?: FilterValues;
  title?: string;
  showSearch?: boolean;
  onSearch?: (searchTerm: string) => void;
}

const FilterModal: React.FC<FilterModalProps> = ({
  open,
  onClose,
  onApply,
  filterOptions,
  initialValues = {},
  title = 'Filters',
  showSearch = false,
  onSearch
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [values, setValues] = useState<FilterValues>(initialValues);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  // Reset filters to initial values
  const resetFilters = () => {
    setValues(initialValues);
    setSearchTerm('');
  };

  // When modal opens, reset to initialValues
  useEffect(() => {
    if (open) {
      setValues(initialValues);

      // Expand all sections by default
      const sections = filterOptions.
      map((option) => option.section).
      filter((section): section is string => !!section).
      filter((value, index, self) => self.indexOf(value) === index);

      setExpandedSections(sections);
    }
  }, [open, initialValues, filterOptions]);

  // Handle checkbox change
  const handleCheckboxChange = (id: string, value: string | number) => {
    setValues((prev) => {
      const currentValues = prev[id] as string[] || [];
      const valueExists = currentValues.includes(value.toString());

      if (valueExists) {
        return {
          ...prev,
          [id]: currentValues.filter((v) => v !== value.toString())
        };
      } else {
        return {
          ...prev,
          [id]: [...currentValues, value.toString()]
        };
      }
    });
  };

  // Handle radio change
  const handleRadioChange = (id: string, value: string | number) => {
    setValues((prev) => ({
      ...prev,
      [id]: value
    }));
  };

  // Handle select change
  const handleSelectChange = (id: string, value: string | number | string[]) => {
    setValues((prev) => ({
      ...prev,
      [id]: value
    }));
  };

  // Handle date change
  const handleDateChange = (id: string, value: Date | null) => {
    setValues((prev) => ({
      ...prev,
      [id]: value
    }));
  };

  // Handle date range change
  const handleDateRangeChange = (id: string, index: number, value: Date | null) => {
    setValues((prev) => {
      const currentRange = prev[id] as (Date | null)[] || [null, null];
      const newRange = [...currentRange];
      newRange[index] = value;
      return {
        ...prev,
        [id]: newRange
      };
    });
  };

  // Handle text input change
  const handleTextChange = (id: string, value: string) => {
    setValues((prev) => ({
      ...prev,
      [id]: value
    }));
  };

  // Handle range change
  const handleRangeChange = (id: string, value: number | number[]) => {
    setValues((prev) => ({
      ...prev,
      [id]: value
    }));
  };

  // Handle boolean toggle
  const handleBooleanChange = (id: string) => {
    setValues((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Handle search input
  const handleSearchInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  // Handle search submit
  const handleSearchSubmit = () => {
    if (onSearch && searchTerm.trim()) {
      onSearch(searchTerm);
    }
  };

  // Handle search key press
  const handleSearchKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && onSearch && searchTerm.trim()) {
      onSearch(searchTerm);
    }
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearchTerm('');
    if (onSearch) {
      onSearch('');
    }
  };

  // Handle section toggle
  const handleSectionToggle = (section: string) => {
    setExpandedSections((prev) =>
    prev.includes(section) ?
    prev.filter((s) => s !== section) :
    [...prev, section]
    );
  };

  // Group options by section
  const getFiltersBySections = () => {
    const sections: {[key: string]: FilterOption[];} = {};

    // Add options without section to "General" section
    const generalOptions = filterOptions.filter((option) => !option.section);
    if (generalOptions.length > 0) {
      sections['General'] = generalOptions;
    }

    // Group options by section
    filterOptions.
    filter((option) => option.section).
    forEach((option) => {
      const section = option.section as string;
      if (!sections[section]) {
        sections[section] = [];
      }
      sections[section].push(option);
    });

    return sections;
  };

  // Count active filters
  const countActiveFilters = () => {
    return Object.keys(values).filter((key) => {
      const value = values[key];
      if (value === null || value === undefined) return false;
      if (Array.isArray(value) && value.length === 0) return false;
      if (value === '') return false;
      return true;
    }).length;
  };

  // Render filter option based on type
  const RenderFilterOption = (option: FilterOption) => {
    const { id, label, type, options = [], minValue, maxValue, step, unit } = option;
    const value = values[id] !== undefined ? values[id] : option.defaultValue;

    switch (type) {
      case 'checkbox':
        return (
          <FormControl component="fieldset" fullWidth margin="normal">
            <FormLabel component="legend">{label}</FormLabel>
            <FormGroup>
              {options.map((opt) =>
              <FormControlLabel
                key={`${id}-${opt.value}`}
                control={
                <Checkbox
                  checked={Array.isArray(value) && value.includes(opt.value.toString())}
                  onChange={() => handleCheckboxChange(id, opt.value)} />

                }
                label={opt.label} />

              )}
            </FormGroup>
          </FormControl>);


      case 'radio':
        return (
          <FormControl component="fieldset" fullWidth margin="normal">
            <FormLabel component="legend">{label}</FormLabel>
            <RadioGroup
              value={value || ''}
              onChange={(e) => handleRadioChange(id, e.target.value)}>

              {options.map((opt) =>
              <FormControlLabel
                key={`${id}-${opt.value}`}
                value={opt.value}
                control={<Radio />}
                label={opt.label} />

              )}
            </RadioGroup>
          </FormControl>);


      case 'select':
        return (
          <FormControl fullWidth margin="normal">
            <FormLabel htmlFor={id} sx={{ mb: 1 }}>{label}</FormLabel>
            <Select
              id={id}
              value={value || ''}
              onChange={(e) => handleSelectChange(id, e.target.value)}
              displayEmpty>

              <MenuItem value="">
                <em>All</em>
              </MenuItem>
              {options.map((opt) =>
              <MenuItem key={`${id}-${opt.value}`} value={opt.value}>
                  {opt.label}
                </MenuItem>
              )}
            </Select>
          </FormControl>);


      case 'multiselect':
        return (
          <FormControl fullWidth margin="normal">
            <FormLabel htmlFor={id} sx={{ mb: 1 }}>{label}</FormLabel>
            <Select
              id={id}
              multiple
              value={Array.isArray(value) ? value : []}
              onChange={(e) => handleSelectChange(id, e.target.value as string[])}
              input={<OutlinedInput />}
              renderValue={(selected) =>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(selected as string[]).map((value) => {
                  const opt = options.find((o) => o.value.toString() === value);
                  return (
                    <Chip
                      key={value}
                      label={opt ? opt.label : value}
                      size="small" />);


                })}
                </Box>
              }>

              {options.map((opt) =>
              <MenuItem key={`${id}-${opt.value}`} value={opt.value.toString()}>
                  {opt.label}
                </MenuItem>
              )}
            </Select>
          </FormControl>);


      case 'date':
        return (
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <FormControl fullWidth margin="normal">
              <FormLabel htmlFor={id} sx={{ mb: 1 }}>{label}</FormLabel>
              <DatePicker
                value={value as Date | null}
                onChange={(date) => handleDateChange(id, date)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    variant: 'outlined',
                    InputProps: {
                      startAdornment:
                      <InputAdornment position="start">
                          <CalendarIcon />
                        </InputAdornment>

                    }
                  }
                }} />

            </FormControl>
          </LocalizationProvider>);


      case 'dateRange':
        const dateRange = value as (Date | null)[] || [null, null];
        return (
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <FormControl fullWidth margin="normal">
              <FormLabel component="legend">{label}</FormLabel>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <DatePicker
                    label="From"
                    value={dateRange[0]}
                    onChange={(date) => handleDateRangeChange(id, 0, date)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        variant: 'outlined',
                        size: 'small',
                        margin: 'normal'
                      }
                    }} />

                </Grid>
                <Grid item xs={6}>
                  <DatePicker
                    label="To"
                    value={dateRange[1]}
                    onChange={(date) => handleDateRangeChange(id, 1, date)}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        variant: 'outlined',
                        size: 'small',
                        margin: 'normal'
                      }
                    }} />

                </Grid>
              </Grid>
            </FormControl>
          </LocalizationProvider>);


      case 'text':
        return (
          <FormControl fullWidth margin="normal">
            <TextField
              label={label}
              value={value || ''}
              onChange={(e) => handleTextChange(id, e.target.value)}
              fullWidth
              variant="outlined" />

          </FormControl>);


      case 'range':
        return (
          <FormControl fullWidth margin="normal">
            <FormLabel component="legend">
              {label}
              {value !== undefined && value !== null &&
              <Typography variant="body2" color="text.secondary">
                  {Array.isArray(value) ?
                `${value[0]}${unit || ''} - ${value[1]}${unit || ''}` :
                `${value}${unit || ''}`}
                </Typography>
              }
            </FormLabel>
            <Box sx={{ px: 1, mt: 2 }}>
              <Slider
                value={value as number || 0}
                onChange={(_, newValue) => handleRangeChange(id, newValue)}
                min={minValue || 0}
                max={maxValue || 100}
                step={step || 1}
                marks
                valueLabelDisplay="auto"
                valueLabelFormat={(value) => `${value}${unit || ''}`} />

            </Box>
          </FormControl>);


      case 'boolean':
        return (
          <FormControl fullWidth margin="normal">
            <FormControlLabel
              control={
              <Checkbox
                checked={Boolean(value)}
                onChange={() => handleBooleanChange(id)} />

              }
              label={label} />

          </FormControl>);


      default:
        return null;
    }
  };

  const filterSections = getFiltersBySections();
  const activeFilterCount = countActiveFilters();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      scroll="paper">

      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center">
            <FilterIcon sx={{ mr: 1 }} />
            <Typography variant="h6" component="span">
              {title}
              {activeFilterCount > 0 &&
              <Chip
                label={activeFilterCount}
                size="small"
                color="primary"
                sx={{ ml: 1 }} />

              }
            </Typography>
          </Box>
          <IconButton edge="end" color="inherit" onClick={onClose} aria-label="close">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      {showSearch &&
      <Box sx={{ px: 3, pb: 2, pt: 0 }}>
          <TextField
          fullWidth
          placeholder="Search..."
          value={searchTerm}
          onChange={handleSearchInput}
          onKeyPress={handleSearchKeyPress}
          InputProps={{
            startAdornment:
            <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>,

            endAdornment: searchTerm &&
            <InputAdornment position="end">
                  <IconButton size="small" onClick={handleClearSearch}>
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>

          }}
          sx={{ mb: 1 }} />

          <Button
          variant="outlined"
          size="small"
          startIcon={<SearchIcon />}
          onClick={handleSearchSubmit}
          disabled={!searchTerm.trim()}>

            Search
          </Button>
        </Box>
      }

      <DialogContent dividers>
        {Object.entries(filterSections).map(([section, options]) =>
        <Box key={section} sx={{ mb: 2 }}>
            <Accordion
            expanded={expandedSections.includes(section)}
            onChange={() => handleSectionToggle(section)}
            disableGutters
            elevation={0}
            sx={{
              border: `1px solid ${theme.palette.divider}`,
              '&:before': {
                display: 'none'
              }
            }}>

              <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              aria-controls={`${section}-content`}
              id={`${section}-header`}>

                <Typography variant="subtitle1">{section}</Typography>
              </AccordionSummary>
              <AccordionDetails sx={{ pt: 0 }}>
                {options.map((option) =>
              <Box key={option.id}>
                    {RenderFilterOption(option)}
                  </Box>
              )}
              </AccordionDetails>
            </Accordion>
          </Box>
        )}

        {activeFilterCount === 0 &&
        <Alert severity="info" sx={{ mt: 2 }}>
            No filters applied. Configure filters above and click Apply to filter results.
          </Alert>
        }
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          startIcon={<ResetIcon />}
          onClick={resetFilters}
          disabled={activeFilterCount === 0}>

          Reset
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={() => onApply(values)}
          disabled={
          JSON.stringify(values) === JSON.stringify(initialValues) &&
          searchTerm === ''
          }>

          Apply Filters
        </Button>
      </DialogActions>
    </Dialog>);

};

export default FilterModal;