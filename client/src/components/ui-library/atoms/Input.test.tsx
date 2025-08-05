import React from 'react';
import renderer from 'react-test-renderer';
import Input from './Input';
import { ThemeProvider } from '@mui/material/styles';
import { createTheme } from '@mui/material/styles';

// Create a test theme to ensure consistent snapshots
const testTheme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

describe('Input Component', () => {
  it('renders correctly with default props', () => {
    const tree = renderer
      .create(
        <ThemeProvider theme={testTheme}>
          <Input placeholder="Enter text" />
        </ThemeProvider>
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('renders correctly with label', () => {
    const tree = renderer
      .create(
        <ThemeProvider theme={testTheme}>
          <Input label="Username" placeholder="Enter username" />
        </ThemeProvider>
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('renders correctly with error state', () => {
    const tree = renderer
      .create(
        <ThemeProvider theme={testTheme}>
          <Input 
            error 
            helperText="This field is required" 
            label="Email" 
            placeholder="Enter email" 
          />
        </ThemeProvider>
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('renders correctly when disabled', () => {
    const tree = renderer
      .create(
        <ThemeProvider theme={testTheme}>
          <Input 
            disabled 
            label="Disabled Field" 
            placeholder="Cannot edit this field" 
          />
        </ThemeProvider>
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('renders correctly with different variants', () => {
    const tree = renderer
      .create(
        <ThemeProvider theme={testTheme}>
          <div>
            <Input variant="outlined" label="Outlined" />
            <Input variant="filled" label="Filled" />
            <Input variant="standard" label="Standard" />
          </div>
        </ThemeProvider>
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
}); 