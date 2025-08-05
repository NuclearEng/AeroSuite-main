import React from 'react';
import { render, screen } from '@testing-library/react';
import CustomerList from './CustomerList';
import { renderWithRouter } from '../../test-utils/router-wrapper';

// Task: DEV004 - Fix component tests for React Router
describe('CustomerList', () => {
  it('renders without crashing', () => {
    // Use renderWithRouter instead of render to provide a Router context
    renderWithRouter(<CustomerList />, {
      path: '/customers',
      route: '/customers',
      initialEntries: ['/customers']
    });
    
    // The test expectation may need to be adjusted based on what the component actually renders
    expect(screen.getByText(/customers/i, { exact: false })).toBeInTheDocument();
  });
  // TODO: Add best-in-class tests for error boundaries, keyboard nav, a11y, etc.
});
