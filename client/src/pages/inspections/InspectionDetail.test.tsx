import React from 'react';
import { screen } from '@testing-library/react';
import InspectionDetail from './InspectionDetail';
import { renderWithRouterAndTheme } from '../../test-utils/combined-wrapper';

// Task: DEV004 - Fix component tests for React Router
describe('InspectionDetail', () => {
  it('renders without crashing', () => {
    // Use renderWithRouterAndTheme instead of render to provide both Router and Theme contexts
    renderWithRouterAndTheme(<InspectionDetail />, {
      path: '/inspections/:id',
      route: '/inspections/123',
      initialEntries: ['/inspections/123']
    });
    
    // The test expectation may need to be adjusted based on what the component actually renders
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
  // TODO: Add best-in-class tests for error boundaries, keyboard nav, a11y, etc.
});
