import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { render } from '@testing-library/react';

/**
 * Renders a component wrapped in a MemoryRouter for testing
 * This is necessary for components that use React Router hooks like useNavigate, useParams, etc.
 * 
 * @param ui - The component to render
 * @param options - Options for the router and render function
 * @returns The result of the render function
 */
export function renderWithRouter(
  ui: React.ReactElement,
  {
    initialEntries = ['/'],
    initialIndex = 0,
    path = '/',
    route = '/',
    ...renderOptions
  } = {}
) {
  return render(
    <MemoryRouter initialEntries={initialEntries} initialIndex={initialIndex}>
      <Routes>
        <Route path={path} element={ui} />
      </Routes>
    </MemoryRouter>,
    renderOptions
  );
}

/**
 * Provides a wrapper component for components that use React Router hooks
 * Useful for testing components that need a Router context
 */
export const RouterWrapper: React.FC<{
  children: React.ReactNode;
  initialEntries?: string[];
  initialIndex?: number;
}> = ({ children, initialEntries = ['/'], initialIndex = 0 }) => {
  return (
    <MemoryRouter initialEntries={initialEntries} initialIndex={initialIndex}>
      {children}
    </MemoryRouter>
  );
};

export default RouterWrapper; 