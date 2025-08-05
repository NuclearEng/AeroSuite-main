import React from 'react';
import renderer from 'react-test-renderer';
import Typography from './Typography';
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

describe('Typography Component', () => {
  it('renders correctly with default props', () => {
    const tree = renderer
      .create(
        <ThemeProvider theme={testTheme}>
          <Typography>Default Text</Typography>
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
            <Typography variant="h1">Heading 1</Typography>
            <Typography variant="h2">Heading 2</Typography>
            <Typography variant="h3">Heading 3</Typography>
            <Typography variant="h4">Heading 4</Typography>
            <Typography variant="h5">Heading 5</Typography>
            <Typography variant="h6">Heading 6</Typography>
            <Typography variant="subtitle1">Subtitle 1</Typography>
            <Typography variant="subtitle2">Subtitle 2</Typography>
            <Typography variant="body1">Body 1</Typography>
            <Typography variant="body2">Body 2</Typography>
            <Typography variant="caption">Caption</Typography>
            <Typography variant="button">Button</Typography>
            <Typography variant="overline">Overline</Typography>
          </div>
        </ThemeProvider>
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('renders correctly with different colors', () => {
    const tree = renderer
      .create(
        <ThemeProvider theme={testTheme}>
          <div>
            <Typography color="primary">Primary Color</Typography>
            <Typography color="secondary">Secondary Color</Typography>
            <Typography color="textPrimary">Text Primary</Typography>
            <Typography color="textSecondary">Text Secondary</Typography>
            <Typography color="error">Error Color</Typography>
          </div>
        </ThemeProvider>
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('renders correctly with different alignments', () => {
    const tree = renderer
      .create(
        <ThemeProvider theme={testTheme}>
          <div>
            <Typography align="left">Left Aligned</Typography>
            <Typography align="center">Center Aligned</Typography>
            <Typography align="right">Right Aligned</Typography>
            <Typography align="justify">Justify Aligned Text that spans multiple lines to demonstrate the justify alignment property</Typography>
          </div>
        </ThemeProvider>
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
}); 