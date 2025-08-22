import React from 'react';
import { screen } from '@testing-library/react';
import SupplierDetail from './SupplierDetail';
import { renderWithRouterAndTheme } from '../../test-utils/combined-wrapper';

// Task: DEV004 - Fix component tests for React Router
describe('SupplierDetail', () => {
  it('renders without crashing', () => {
    // Use renderWithRouterAndTheme instead of render to provide both Router and Theme contexts
    renderWithRouterAndTheme(<SupplierDetail />, {
      path: '/suppliers/:id',
      route: '/suppliers/123',
      initialEntries: ['/suppliers/123']
    });
    
    // The test expectation may need to be adjusted based on what the component actually renders
    // when it has a valid ID parameter
    expect(screen.getByText(/loading/i, { exact: false })).toBeInTheDocument();
  });
  // TODO: Add best-in-class tests for error boundaries, keyboard nav, a11y, etc.
});
