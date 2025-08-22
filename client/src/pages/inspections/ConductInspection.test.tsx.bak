import React from 'react';
import { screen } from '@testing-library/react';
import ConductInspection from './ConductInspection';
import { renderWithRouterAndTheme } from '../../test-utils/combined-wrapper';

// Task: DEV004 - Fix component tests for React Router
// Mock the useResponsive hook
jest.mock('../../hooks/useResponsive', () => ({
  useResponsive: () => ({
    width: 1200,
    height: 800,
    orientation: 'landscape',
    breakpoints: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920
    },
    isMobile: false,
    isTablet: false,
    isMobileOrTablet: false,
    isDesktop: true,
    matchesQuery: jest.fn().mockReturnValue(false),
    getGridColumns: jest.fn().mockReturnValue(12),
    getCurrentBreakpoint: jest.fn().mockReturnValue('lg'),
    viewportUnits: {
      vh: jest.fn().mockImplementation(percentage => (800 * percentage) / 100),
      vw: jest.fn().mockImplementation(percentage => (1200 * percentage) / 100)
    },
    getResponsiveStyles: jest.fn().mockImplementation(baseStyles => baseStyles),
    getSpacing: jest.fn().mockImplementation(defaultValue => defaultValue)
  })
}));

// Mock the API service
jest.mock('../../services/inspection.service', () => ({
  getInspection: jest.fn().mockResolvedValue({ 
    id: '123',
    inspectionType: 'quality_audit',
    checklistItems: []
  })
}));

describe('ConductInspection', () => {
  it('renders without crashing', () => {
    // Use renderWithRouterAndTheme instead of render to provide both Router and Theme contexts
    renderWithRouterAndTheme(<ConductInspection />, {
      path: '/inspections/:id/conduct',
      route: '/inspections/123/conduct',
      initialEntries: ['/inspections/123/conduct']
    });
    
    // Check for a loading indicator
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
  // TODO: Add best-in-class tests for error boundaries, keyboard nav, a11y, etc.
});
