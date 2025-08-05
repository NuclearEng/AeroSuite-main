import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useNavigate, useParams, useLocation, useSearchParams } from 'react-router-dom';
import { useQueryParams, StringParam, NumberParam } from 'use-query-params';
import { renderWithAdvancedRouter, useAuthContext } from './advanced-router-wrapper';

// Example protected component that uses various router features
const ProtectedDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [queryParams, setQueryParams] = useQueryParams({
    tab: StringParam,
    page: NumberParam,
  });
  const authContext = useAuthContext();

  const handleNavigate = () => {
    navigate('/profile');
  };

  const handleChangeTab = (tab: string) => {
    setQueryParams({ tab });
  };

  return (
    <div>
      <h1>Protected Dashboard</h1>
      <p data-testid="user-info">
        User: {authContext.user?.name} (ID: {id})
      </p>
      <p data-testid="role-info">
        Roles: {authContext.user?.roles.join(', ')}
      </p>
      <p data-testid="query-info">
        Tab: {queryParams.tab || 'default'}, Page: {queryParams.page || 1}
      </p>
      <p data-testid="search-params">
        Filter: {searchParams.get('filter') || 'none'}
      </p>
      <button onClick={handleNavigate} data-testid="profile-button">
        Go to Profile
      </button>
      <div>
        <button onClick={() => handleChangeTab('overview')} data-testid="tab-overview">
          Overview
        </button>
        <button onClick={() => handleChangeTab('settings')} data-testid="tab-settings">
          Settings
        </button>
      </div>
    </div>
  );
};

describe('Advanced Router Testing', () => {
  it('renders a component with route parameters', async () => {
    renderWithAdvancedRouter(<ProtectedDashboard />, {
      path: '/dashboard/:id',
      route: '/dashboard/123',
      initialEntries: ['/dashboard/123'],
    });

    expect(screen.getByTestId('user-info')).toHaveTextContent('User: Test User (ID: 123)');
  });

  it('handles query parameters', async () => {
    renderWithAdvancedRouter(<ProtectedDashboard />, {
      path: '/dashboard/:id',
      route: '/dashboard/123',
      initialEntries: ['/dashboard/123'],
      queryParams: { tab: 'overview', page: 2, filter: 'active' },
    });

    expect(screen.getByTestId('query-info')).toHaveTextContent('Tab: overview, Page: 2');
    expect(screen.getByTestId('search-params')).toHaveTextContent('Filter: active');
  });

  it('redirects unauthenticated users', async () => {
    renderWithAdvancedRouter(<ProtectedDashboard />, {
      path: '/dashboard/:id',
      route: '/dashboard/123',
      initialEntries: ['/dashboard/123'],
      isAuthenticated: false,
    });

    // Should redirect to login page
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Dashboard')).not.toBeInTheDocument();
  });

  it('enforces role-based access control', async () => {
    renderWithAdvancedRouter(<ProtectedDashboard />, {
      path: '/dashboard/:id',
      route: '/dashboard/123',
      initialEntries: ['/dashboard/123'],
      roles: ['user'],
      requiredRole: 'admin',
    });

    // Should redirect to login page due to missing required role
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
    expect(screen.queryByText('Protected Dashboard')).not.toBeInTheDocument();
  });

  it('allows access with proper role', async () => {
    renderWithAdvancedRouter(<ProtectedDashboard />, {
      path: '/dashboard/:id',
      route: '/dashboard/123',
      initialEntries: ['/dashboard/123'],
      roles: ['user', 'admin'],
      requiredRole: 'admin',
    });

    // Should allow access
    expect(screen.getByText('Protected Dashboard')).toBeInTheDocument();
    expect(screen.getByTestId('role-info')).toHaveTextContent('Roles: user, admin');
  });

  it('handles navigation', async () => {
    const user = userEvent.setup();
    const { getNavigationHistory } = renderWithAdvancedRouter(<ProtectedDashboard />, {
      path: '/dashboard/:id',
      route: '/dashboard/123',
      initialEntries: ['/dashboard/123'],
    });

    // Click the profile button
    await user.click(screen.getByTestId('profile-button'));

    // Verify navigation
    await waitFor(() => {
      expect(screen.getByTestId('not-found')).toBeInTheDocument();
    });
  });

  it('handles query parameter changes', async () => {
    const user = userEvent.setup();
    renderWithAdvancedRouter(<ProtectedDashboard />, {
      path: '/dashboard/:id',
      route: '/dashboard/123',
      initialEntries: ['/dashboard/123'],
    });

    // Initial state
    expect(screen.getByTestId('query-info')).toHaveTextContent('Tab: default');

    // Click the settings tab
    await user.click(screen.getByTestId('tab-settings'));

    // Verify query param change
    await waitFor(() => {
      expect(screen.getByTestId('query-info')).toHaveTextContent('Tab: settings');
    });
  });
}); 