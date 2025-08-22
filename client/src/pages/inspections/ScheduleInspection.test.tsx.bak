import React from 'react';
import { screen } from '@testing-library/react';
import ScheduleInspection from './ScheduleInspection';
import { renderWithRouterAndTheme } from '../../test-utils/combined-wrapper';

// Task: DEV004 - Fix component tests for React Router
describe('ScheduleInspection', () => {
  it('renders without crashing', () => {
    // Use renderWithRouterAndTheme instead of render to provide both Router and Theme contexts
    renderWithRouterAndTheme(<ScheduleInspection />, {
      path: '/inspections/schedule',
      route: '/inspections/schedule',
      initialEntries: ['/inspections/schedule']
    });
    
    // Use a more specific selector to find the heading
    const heading = screen.getByRole('heading', { name: 'Schedule Inspection', level: 1 });
    expect(heading).toBeInTheDocument();
  });
  // TODO: Add best-in-class tests for error boundaries, keyboard nav, a11y, etc.
});
