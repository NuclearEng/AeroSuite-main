import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../../theme/theme';
import StatusBadge, { StatusType } from '../../components/common/StatusBadge';

describe('StatusBadge Component', () => {
  const renderWithTheme = (ui: React.ReactElement) => {
    return render(
      <ThemeProvider theme={theme}>
        {ui}
      </ThemeProvider>
    );
  };

  test('renders with default status label', () => {
    renderWithTheme(<StatusBadge status="pending" />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  test('renders with custom label', () => {
    renderWithTheme(<StatusBadge status="in-progress" label="Custom Label" />);
    expect(screen.getByText('Custom Label')).toBeInTheDocument();
  });

  test('renders with correct class for different statuses', () => {
    const statuses: StatusType[] = [
      'scheduled', 
      'in-progress', 
      'completed', 
      'cancelled', 
      'pending', 
      'active', 
      'expired', 
      'success', 
      'warning', 
      'error', 
      'info'
    ];

    statuses.forEach(status => {
      const { container, unmount } = renderWithTheme(<StatusBadge status={status} />);
      
      // Check text is capitalized
      const displayText = status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ');
      expect(screen.getByText(displayText)).toBeInTheDocument();
      
      // Chip should have MuiChip-colorSuccess, MuiChip-colorError, etc.
      let expectedColorClass;
      if (['scheduled', 'pending', 'info'].includes(status)) {
        expectedColorClass = 'MuiChip-colorInfo';
      } else if (['in-progress', 'warning'].includes(status)) {
        expectedColorClass = 'MuiChip-colorWarning';
      } else if (['completed', 'active', 'success'].includes(status)) {
        expectedColorClass = 'MuiChip-colorSuccess';
      } else if (['cancelled', 'expired', 'error'].includes(status)) {
        expectedColorClass = 'MuiChip-colorError';
      }
      
      if (expectedColorClass) {
        expect(container.firstChild).toHaveClass(expectedColorClass);
      }
      
      unmount();
    });
  });

  test('renders with default config for unknown status', () => {
    const { container } = renderWithTheme(<StatusBadge status="unknown-status" />);
    expect(screen.getByText('Unknown status')).toBeInTheDocument();
    expect(container.firstChild).toHaveClass('MuiChip-outlined');
    expect(container.firstChild).toHaveClass('MuiChip-colorDefault');
  });

  test('applies custom styles', () => {
    const { container } = renderWithTheme(
      <StatusBadge 
        status="success" 
        sx={{ backgroundColor: 'purple' }}
      />
    );
    expect(container.firstChild).toHaveStyle('background-color: purple');
  });
}); 