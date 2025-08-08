import React from 'react';
import { render, screen } from '@testing-library/react';
import Suppliers from './Suppliers';

describe('Suppliers', () => {
  it('renders without crashing', () => {
    render(<Suppliers />);
    expect(screen.getByText(/Suppliers/i)).toBeInTheDocument();
  });
  // TODO: Add best-in-class tests for error boundaries, keyboard nav, a11y, etc.
});
