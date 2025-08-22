import React from 'react';
import { screen } from '@testing-library/react';
import InspectionList from './InspectionList';
import { renderWithRouterAndTheme } from '../../test-utils/combined-wrapper';

// Task: DEV004 - Fix component tests for React Router
// Mock the API service
jest.mock('../../services/inspection.service', () => ({
  getInspections: jest.fn().mockResolvedValue({ inspections: [] })
}));

describe('InspectionList', () => {
  it('renders without crashing', () => {
    // Use renderWithRouterAndTheme instead of render to provide both Router and Theme contexts
    renderWithRouterAndTheme(<InspectionList />, {
      path: '/inspections',
      route: '/inspections',
      initialEntries: ['/inspections']
    });
    
    // The test expectation may need to be adjusted based on what the component actually renders
    expect(screen.getByText(/inspections/i)).toBeInTheDocument();
  });
  // TODO: Add best-in-class tests for error boundaries, keyboard nav, a11y, etc.
});
