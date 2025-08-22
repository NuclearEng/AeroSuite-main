import React from 'react';
import { render, screen } from '@testing-library/react';
import EditCustomer from './EditCustomer';
import { renderWithRouter } from '../../test-utils/router-wrapper';

// Task: DEV004 - Fix component tests for React Router
describe('EditCustomer', () => {
  it('renders without crashing', () => {
    // Use renderWithRouter instead of render to provide a Router context
    renderWithRouter(<EditCustomer />, {
      path: '/customers/:id/edit',
      route: '/customers/123/edit',
      initialEntries: ['/customers/123/edit']
    });
    
    // The test expectation may need to be adjusted based on what the component actually renders
    // when it has a valid ID parameter
    expect(screen.getByText(/loading/i, { exact: false })).toBeInTheDocument();
  });
  // TODO: Add best-in-class tests for error boundaries, keyboard nav, a11y, etc.
});
