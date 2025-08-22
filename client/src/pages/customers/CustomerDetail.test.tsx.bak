import React from 'react';
import { render, screen } from '@testing-library/react';
import CustomerDetail from './CustomerDetail';
import { renderWithRouter } from '../../test-utils/router-wrapper';

// Task: DEV004 - Fix component tests for React Router
describe('CustomerDetail', () => {
  it('renders without crashing', () => {
    // Use renderWithRouter instead of render to provide a Router context
    renderWithRouter(<CustomerDetail />, {
      path: '/customers/:id',
      route: '/customers/123',
      initialEntries: ['/customers/123']
    });
    
    // The test expectation may need to be adjusted based on what the component actually renders
    // when it has a valid ID parameter
    expect(screen.getByText(/loading/i, { exact: false })).toBeInTheDocument();
  });
  // TODO: Add best-in-class tests for error boundaries, keyboard nav, a11y, etc.
});
