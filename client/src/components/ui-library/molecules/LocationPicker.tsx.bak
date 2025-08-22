import React, { useState } from 'react';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';

export interface LocationPickerProps {
  label?: string;
  value?: string;
  onChange: (value: string) => void;
  options?: string[];
  mapApiKey?: string;
}

const defaultOptions = [
  'Seattle, WA',
  'San Francisco, CA',
  'New York, NY',
  'Austin, TX',
  'London, UK',
  'Munich, Germany',
];

const LocationPicker: React.FC<LocationPickerProps> = ({ label = 'Location', value = '', onChange, options = defaultOptions, mapApiKey }) => {
  const [inputValue, setInputValue] = useState(value);
  const mapSrc = inputValue
    ? `https://www.google.com/maps/embed/v1/place?key=${mapApiKey || 'AIzaSyD-EXAMPLE'}&q=${encodeURIComponent(inputValue)}`
    : '';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Autocomplete
        freeSolo
        options={options}
        value={inputValue}
        onInputChange={(_, newValue) => {
          setInputValue(newValue);
          onChange(newValue);
        }}
        renderInput={(params) => (
          <TextField {...params} label={label} variant="outlined" fullWidth aria-label={label} />
        )}
      />
      {inputValue && mapApiKey && (
        <Box sx={{ width: '100%', height: 250, borderRadius: 2, overflow: 'hidden', boxShadow: 1 }}>
          <iframe
            title="Map Preview"
            width="100%"
            height="250"
            frameBorder="0"
            style={{ border: 0 }}
            src={mapSrc}
            allowFullScreen
            aria-label="Map Preview"
          />
        </Box>
      )}
    </Box>
  );
};

export default LocationPicker; 