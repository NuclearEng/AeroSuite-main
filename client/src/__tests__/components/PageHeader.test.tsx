import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import Button from '@mui/material/Button';
import { createTheme } from '@mui/material/styles';
import { createThemeOptions } from '../../theme/themeConfig';
const theme = createTheme(createThemeOptions('light', 'blue'));
import PageHeader from '../../components/common/PageHeader';

describe('PageHeader Component', () => {
  const renderWithTheme = (ui: React.ReactElement) => {
    return render(
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          {ui}
        </ThemeProvider>
      </BrowserRouter>
    );
  };

  test('renders title correctly', () => {
    renderWithTheme(<PageHeader title="Test Title" />);
    expect(screen.getByRole('heading', { name: /test title/i })).toBeInTheDocument();
  });

  test('renders subtitle when provided', () => {
    renderWithTheme(<PageHeader title="Test Title" subtitle="Test Subtitle" />);
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument();
  });

  test('does not render breadcrumbs when not provided', () => {
    renderWithTheme(<PageHeader title="Test Title" />);
    expect(screen.queryByLabelText('breadcrumb')).not.toBeInTheDocument();
  });

  test('renders breadcrumbs when provided', () => {
    const breadcrumbs = [
      { label: 'Home', href: '/' },
      { label: 'Section', href: '/section' },
      { label: 'Current Page' }
    ];
    
    renderWithTheme(<PageHeader title="Test Title" breadcrumbs={breadcrumbs} />);
    
    const breadcrumbsElement = screen.getByLabelText('breadcrumb');
    expect(breadcrumbsElement).toBeInTheDocument();
    
    // Check all breadcrumb items are rendered
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Section')).toBeInTheDocument();
    expect(screen.getByText('Current Page')).toBeInTheDocument();
    
    // Check that links are rendered correctly
    const homeLink = screen.getByRole('link', { name: /home/i });
    expect(homeLink).toHaveAttribute('href', '/');
    
    const sectionLink = screen.getByRole('link', { name: /section/i });
    expect(sectionLink).toHaveAttribute('href', '/section');
    
    // Last item should not be a link
    expect(screen.queryByRole('link', { name: /current page/i })).not.toBeInTheDocument();
  });

  test('renders actions when provided', () => {
    const actions = (
      <>
        <Button variant="contained">Primary Action</Button>
        <Button variant="outlined">Secondary Action</Button>
      </>
    );
    
    renderWithTheme(<PageHeader title="Test Title" actions={actions} />);
    
    expect(screen.getByRole('button', { name: /primary action/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /secondary action/i })).toBeInTheDocument();
  });

  test('applies custom styles', () => {
    const { container } = renderWithTheme(
      <PageHeader 
        title="Test Title" 
        sx={{ paddingTop: '20px' }}
      />
    );
    expect(container.firstChild).toHaveStyle('padding-top: 20px');
  });
}); 