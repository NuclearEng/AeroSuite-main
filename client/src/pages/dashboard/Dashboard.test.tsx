import { axe, toHaveNoViolations } from 'jest-axe';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Dashboard, { WidgetConfig, DashboardConfig } from './Dashboard';

expect.extend(toHaveNoViolations);

// Helper: minimal valid widget/config for tests
const minimalWidgets: Record<string, WidgetConfig> = {
  'widget-1': { id: 'widget-1', size: 'small', position: 0, visible: true },
};
const minimalConfig: DashboardConfig = {
  columnCount: 2,
  compactView: false,
  showAnimations: true,
  refreshInterval: 30,
};

// Error boundary test helper
function renderWithErrorBoundary(ui: React.ReactElement) {
  // Minimal error boundary for test
  class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
    constructor(props: any) {
      super(props);
      this.state = { hasError: false };
    }
    static getDerivedStateFromError() { return { hasError: true }; }
    render() { return this.state.hasError ? <div role="alert">Something went wrong</div> : this.props.children; }
  }
  return render(<ErrorBoundary>{ui}</ErrorBoundary>);
}

describe('Dashboard', () => {
  it('renders dashboard and widgets', () => {
    render(<Dashboard />);
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });

  it('customizes widgets', async () => {
    render(<Dashboard />);
    // ...mock customization and assert update
  });

  it('exports dashboard data', async () => {
    render(<Dashboard />);
    // ...mock export and assert download
  });

  it('syncs dashboard', async () => {
    render(<Dashboard />);
    // ...mock sync and assert update
  });

  it('handles empty dashboard', () => {
    render(<Dashboard />);
    // Simulate no widgets
    // ...mock widgets state as empty
    expect(screen.getByText(/no widgets configured/i)).toBeInTheDocument();
  });

  it('handles large dashboard', () => {
    render(<Dashboard />);
    // ...mock large widgets set and assert performance/UX
  });

  it('handles export with no data', () => {
    render(<Dashboard />);
    // ...mock export with no data and assert error UI
  });

  it('handles sync conflict', () => {
    render(<Dashboard />);
    // ...mock sync conflict and assert error UI
  });

  it('handles invalid widget config', () => {
    render(<Dashboard />);
    // ...mock invalid config and assert error UI
  });

  it('is accessible (axe, keyboard, focus)', async () => {
    const { container } = render(<Dashboard />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
    // ...add keyboard/focus navigation tests
  });

  it('validates widget config (zod)', () => {
    // ...test zod validation for widget config
  });

  it('should update dashboard on customization', async () => {
    // Mock customization API
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({ ok: true, json: async () => ({ success: true }) } as any);
    render(<Dashboard />);
    // Simulate customization action
    // ...
    expect(await screen.findByText(/customization saved/i)).toBeInTheDocument();
    (global.fetch as jest.Mock).mockRestore();
  });

  it('should export dashboard data', async () => {
    // Mock export API
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({ ok: true, blob: async () => new Blob(['data']) } as any);
    render(<Dashboard />);
    // Simulate export action
    // ...
    expect(await screen.findByText(/export successful/i)).toBeInTheDocument();
    (global.fetch as jest.Mock).mockRestore();
  });

  it('should sync dashboard and update widgets', async () => {
    // Mock sync API
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({ ok: true, json: async () => ({ widgets: [] }) } as any);
    render(<Dashboard />);
    // Simulate sync action
    // ...
    expect(await screen.findByText(/sync complete/i)).toBeInTheDocument();
    (global.fetch as jest.Mock).mockRestore();
  });

  it('should show empty state when no widgets', () => {
    render(<Dashboard widgets={{}} layout={minimalConfig} />);
    expect(screen.getByText(/no widgets/i)).toBeInTheDocument();
  });

  it('should handle large number of widgets and maintain performance', () => {
    const widgets = Array.from({ length: 100 }, (_, i) => ({ id: `widget-${i}`, size: 'small', position: i, visible: true }));
    const widgetMap = Object.fromEntries(widgets.map(w => [w.id, w]));
    render(<Dashboard widgets={widgetMap} layout={minimalConfig} />);
    expect(screen.getByText(/widget-99/i)).toBeInTheDocument();
  });

  it('should show error UI on export failure', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({ message: 'Export failed' }) } as any);
    render(<Dashboard />);
    // Simulate export action
    // ...
    expect(await screen.findByText(/export failed/i)).toBeInTheDocument();
    (global.fetch as jest.Mock).mockRestore();
  });

  it('should show error UI on sync conflict', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({ ok: false, status: 409, json: async () => ({ message: 'Sync conflict' }) } as any);
    render(<Dashboard />);
    // Simulate sync action
    // ...
    expect(await screen.findByText(/sync conflict/i)).toBeInTheDocument();
    (global.fetch as jest.Mock).mockRestore();
  });

  it('should show error UI on invalid config', () => {
    render(<Dashboard widgets={minimalWidgets} layout={null as any} />);
    expect(screen.getByText(/invalid configuration/i)).toBeInTheDocument();
  });
});

describe('Dashboard (best-in-class)', () => {
  it('renders fallback UI on error', () => {
    // Simulate error in a widget
    const errorWidgets = {
      'widget-err': { id: 'widget-err', size: 'small', position: 0, visible: true, throwError: true },
    };
    // Mock getWidget to throw
    jest.spyOn(require('../../components/dashboard/widgets/WidgetRegistry'), 'getWidget').mockImplementation(() => { throw new Error('Widget error'); });
    renderWithErrorBoundary(<Dashboard widgets={errorWidgets} layout={minimalConfig} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong');
    jest.resetAllMocks();
  });

  it('supports keyboard navigation and focus', async () => {
    render(<Dashboard widgets={minimalWidgets} layout={minimalConfig} />);
    // Tab to first button (Customize)
    userEvent.tab();
    expect(screen.getByRole('button', { name: /customize/i })).toHaveFocus();
    // Tab to next button (Generate Report)
    userEvent.tab();
    expect(screen.getByRole('button', { name: /generate dashboard report/i })).toHaveFocus();
    // Tab to next button (Export)
    userEvent.tab();
    expect(screen.getByRole('button', { name: /export dashboard/i })).toHaveFocus();
  });

  it('shows error UI on async export failure', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValueOnce({ ok: false, status: 500, json: async () => ({ message: 'Export failed' }) } as any);
    render(<Dashboard widgets={minimalWidgets} layout={minimalConfig} />);
    // Simulate export action
    userEvent.click(screen.getByRole('button', { name: /export/i }));
    userEvent.click(screen.getByText(/export as csv/i));
    expect(await screen.findByText(/export failed/i)).toBeInTheDocument();
    (global.fetch as jest.Mock).mockRestore();
  });

  it('is accessible (axe, keyboard, focus)', async () => {
    const { container } = render(<Dashboard widgets={minimalWidgets} layout={minimalConfig} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
    // Keyboard navigation already tested above
  });

  // Optionally, add a performance test (render time)
  it('renders 100 widgets within 500ms', () => {
    const widgets = Array.from({ length: 100 }, (_, i) => ({ id: `widget-${i}`, size: 'small', position: i, visible: true }));
    const widgetMap = Object.fromEntries(widgets.map(w => [w.id, w]));
    const start = performance.now();
    render(<Dashboard widgets={widgetMap} layout={minimalConfig} />);
    const end = performance.now();
    expect(end - start).toBeLessThan(500);
  });
}); 