import React from 'react';
import { TextField, TextFieldProps } from '@mui/material';

const Input: React.FC<TextFieldProps> = ({
  helperText,
  error = false,
  ...rest
}) => {
  return (
    <TextField
      variant="outlined"
      fullWidth
      error={error}
      helperText={helperText}
      {...rest}
    />
  );
};

export default Input; 