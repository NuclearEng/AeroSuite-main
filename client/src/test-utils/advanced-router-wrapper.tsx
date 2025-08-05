import React from 'react';
import { render, RenderOptions, RenderResult } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { createMemoryHistory, History } from 'history';
import { QueryParamProvider } from 'use-query-params';
import { ReactRouter6Adapter } from 'use-query-params/adapters/react-router-6';

// Auth context mock for protected routes
interface AuthContextType {
  isAuthenticated: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    roles: string[];
  } | null;
  login: () => void;
  logout: () => void;
}

const defaultAuthContext: AuthContextType = {
  isAuthenticated: true,
  user: {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    roles: ['user'],
  },
  login: () => {},
  logout: () => {},
};

export const AuthContext = React.createContext<AuthContextType>(defaultAuthContext);

interface ProtectedRouteProps {
  isAuthenticated: boolean;
  authenticationPath: string;
  outlet: React.ReactElement;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  isAuthenticated,
  authenticationPath,
  outlet,
}) => {
  if (isAuthenticated) {
    return outlet;
  } else {
    return <Navigate to={{ pathname: authenticationPath }} />;
  }
};

interface AdvancedRouterOptions {
  path?: string;
  route?: string;
  initialEntries?: string[];
  initialIndex?: number;
  isAuthenticated?: boolean;
  authenticationPath?: string;
  roles?: string[];
  requiredRole?: string;
  queryParams?: Record<string, string | number | boolean | null>;
  history?: History;
}

interface ExtendedRenderResult extends RenderResult {
  history: History;
  getNavigationHistory: () => string[];
  getQueryParams: () => Record<string, string | number | boolean | null>;
  getAuthStatus: () => { isAuthenticated: boolean; roles: string[]; hasRequiredRole: boolean };
}

export const renderWithAdvancedRouter = (
  ui: React.ReactElement,
  {
    path = '/',
    route = '/',
    initialEntries = ['/'],
    initialIndex = 0,
    isAuthenticated = true,
    authenticationPath = '/login',
    roles = ['user'],
    requiredRole = '',
    queryParams = {},
    history = createMemoryHistory({ initialEntries, initialIndex }),
    ...renderOptions
  }: AdvancedRouterOptions & Omit<RenderOptions, 'wrapper'> = {}
): ExtendedRenderResult => {
  // Create custom auth context
  const authContextValue: AuthContextType = {
    ...defaultAuthContext,
    isAuthenticated,
    user: isAuthenticated 
      ? { 
          ...defaultAuthContext.user!, 
          roles 
        } 
      : null,
  };

  // Add query parameters to route if provided
  let routeWithParams = route;
  if (Object.keys(queryParams).length > 0) {
    const searchParams = new URLSearchParams();
    Object.entries(queryParams).forEach(([key, value]) => {
      if (value !== null) {
        searchParams.append(key, String(value));
      }
    });
    routeWithParams = `${route}?${searchParams.toString()}`;
    if (!initialEntries.includes(routeWithParams)) {
      initialEntries = [routeWithParams];
    }
  }

  // Track route changes
  const navigationHistory: string[] = [route];
  const trackRouteChange = (location: string) => {
    navigationHistory.push(location);
  };

  // Determine if component should be protected
  const shouldProtect = requiredRole !== '';
  const hasRequiredRole = roles.includes(requiredRole);
  const canAccess = isAuthenticated && (!shouldProtect || hasRequiredRole);

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthContext.Provider value={authContextValue}>
      <MemoryRouter initialEntries={initialEntries} initialIndex={initialIndex}>
        <QueryParamProvider adapter={ReactRouter6Adapter}>
          <Routes>
            {canAccess ? (
              <Route path={path} element={children} />
            ) : (
              <Route 
                path={path} 
                element={<ProtectedRoute 
                  isAuthenticated={isAuthenticated && hasRequiredRole} 
                  authenticationPath={authenticationPath}
                  outlet={children as React.ReactElement}
                />} 
              />
            )}
            <Route path={authenticationPath} element={<div data-testid="login-page">Login Page</div>} />
            <Route path="*" element={<div data-testid="not-found">Not Found</div>} />
          </Routes>
        </QueryParamProvider>
      </MemoryRouter>
    </AuthContext.Provider>
  );

  const result = render(ui, { wrapper, ...renderOptions });

  return {
    ...result,
    history,
    // Helper functions
    getNavigationHistory: () => navigationHistory,
    getQueryParams: () => queryParams,
    getAuthStatus: () => ({ isAuthenticated, roles, hasRequiredRole }),
  } as ExtendedRenderResult;
};

// Hook for accessing auth context in tests
export const useAuthContext = () => React.useContext(AuthContext);

// Export a combined wrapper with both router and auth
export const AdvancedRouterWrapper: React.FC<AdvancedRouterOptions & { children: React.ReactNode }> = ({
  children,
  ...options
}) => {
  const {
    path = '/',
    route = '/',
    initialEntries = ['/'],
    initialIndex = 0,
    isAuthenticated = true,
    authenticationPath = '/login',
    roles = ['user'],
    requiredRole = '',
  } = options;

  // Create custom auth context
  const authContextValue: AuthContextType = {
    ...defaultAuthContext,
    isAuthenticated,
    user: isAuthenticated 
      ? { 
          ...defaultAuthContext.user!, 
          roles 
        } 
      : null,
  };

  // Determine if component should be protected
  const shouldProtect = requiredRole !== '';
  const hasRequiredRole = roles.includes(requiredRole);
  const canAccess = isAuthenticated && (!shouldProtect || hasRequiredRole);

  return (
    <AuthContext.Provider value={authContextValue}>
      <MemoryRouter initialEntries={initialEntries} initialIndex={initialIndex}>
        <QueryParamProvider adapter={ReactRouter6Adapter}>
          <Routes>
            {canAccess ? (
              <Route path={path} element={children} />
            ) : (
              <Route 
                path={path} 
                element={<ProtectedRoute 
                  isAuthenticated={isAuthenticated && hasRequiredRole} 
                  authenticationPath={authenticationPath}
                  outlet={children as React.ReactElement}
                />} 
              />
            )}
            <Route path={authenticationPath} element={<div data-testid="login-page">Login Page</div>} />
            <Route path="*" element={<div data-testid="not-found">Not Found</div>} />
          </Routes>
        </QueryParamProvider>
      </MemoryRouter>
    </AuthContext.Provider>
  );
}; 