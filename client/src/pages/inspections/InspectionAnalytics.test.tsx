import React from 'react';
import { screen } from '@testing-library/react';
import InspectionAnalytics from './InspectionAnalytics';
import { renderWithRouterAndTheme } from '../../test-utils/combined-wrapper';

// Task: DEV004 - Fix component tests for React Router
// Mock the API service
jest.mock('../../services/api', () => ({
  get: jest.fn().mockResolvedValue({ data: {} })
}));

describe('InspectionAnalytics', () => {
  it('renders without crashing', () => {
    // Use renderWithRouterAndTheme instead of render to provide both Router and Theme contexts
    renderWithRouterAndTheme(<InspectionAnalytics />, {
      path: '/inspections/analytics',
      route: '/inspections/analytics',
      initialEntries: ['/inspections/analytics']
    });
    
    // Use a more specific selector to find the heading
    const heading = screen.getByRole('heading', { name: 'Inspection Analytics', level: 4 });
    expect(heading).toBeInTheDocument();
  });
  // TODO: Add best-in-class tests for error boundaries, keyboard nav, a11y, etc.
});
