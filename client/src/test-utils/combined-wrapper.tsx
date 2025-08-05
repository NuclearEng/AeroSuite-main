import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import theme from '../theme';

/**
 * Renders a component wrapped in both Router and Theme providers for testing
 * This is necessary for components that use both React Router hooks and Material-UI theme
 * 
 * @param ui - The component to render
 * @param options - Options for the router and render function
 * @returns The result of the render function
 */
export function renderWithRouterAndTheme(
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
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={initialEntries} initialIndex={initialIndex}>
        <Routes>
          <Route path={path} element={ui} />
        </Routes>
      </MemoryRouter>
    </ThemeProvider>,
    renderOptions
  );
}

/**
 * Provides a wrapper component for components that need both Router and Theme contexts
 * Useful for testing components that use both React Router hooks and Material-UI theme
 */
export const CombinedWrapper: React.FC<{
  children: React.ReactNode;
  initialEntries?: string[];
  initialIndex?: number;
}> = ({ children, initialEntries = ['/'], initialIndex = 0 }) => {
  return (
    <ThemeProvider theme={theme}>
      <MemoryRouter initialEntries={initialEntries} initialIndex={initialIndex}>
        {children}
      </MemoryRouter>
    </ThemeProvider>
  );
};

export default CombinedWrapper; 