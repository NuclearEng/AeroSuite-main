import React from 'react';
import renderer from 'react-test-renderer';
import Button from './Button';
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

describe('Button Component', () => {
  it('renders correctly with default props', () => {
    const tree = renderer
      .create(
        <ThemeProvider theme={testTheme}>
          <Button>Click me</Button>
        </ThemeProvider>
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('renders correctly when disabled', () => {
    const tree = renderer
      .create(
        <ThemeProvider theme={testTheme}>
          <Button disabled>Click me</Button>
        </ThemeProvider>
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('renders correctly when loading', () => {
    const tree = renderer
      .create(
        <ThemeProvider theme={testTheme}>
          <Button isLoading>Click me</Button>
        </ThemeProvider>
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('renders correctly with custom loading text', () => {
    const tree = renderer
      .create(
        <ThemeProvider theme={testTheme}>
          <Button isLoading loadingText="Please wait...">Click me</Button>
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
            <Button variant="contained" color="primary">Contained</Button>
            <Button variant="outlined" color="secondary">Outlined</Button>
            <Button variant="text">Text</Button>
          </div>
        </ThemeProvider>
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
}); 