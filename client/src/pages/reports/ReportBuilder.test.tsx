// @ts-expect-error: If jest-axe types are missing, run: npm install --save-dev jest-axe
import { axe, toHaveNoViolations } from 'jest-axe';
// @ts-expect-error: If user-event types are missing, run: npm install --save-dev @testing-library/user-event
import userEvent from '@testing-library/user-event';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReportBuilder from './ReportBuilder';

// @ts-expect-error: If toHaveNoViolations is not typed, this is expected for jest-axe
expect.extend(toHaveNoViolations);

describe('ReportBuilder', () => {
  it('renders report builder and template list', () => {
    render(<ReportBuilder />);
    expect(screen.getByText(/report/i)).toBeInTheDocument();
  });

  it('creates a new template', async () => {
    render(<ReportBuilder />);
    // ...mock create and assert new template
  });

  it('edits a template', async () => {
    render(<ReportBuilder />);
    // ...mock edit and assert changes
  });

  it('deletes a template', async () => {
    render(<ReportBuilder />);
    // ...mock delete and assert removal
  });

  it('duplicates a template', async () => {
    render(<ReportBuilder />);
    // ...mock duplicate and assert new template
  });

  it('previews a template', async () => {
    render(<ReportBuilder />);
    // ...mock preview and assert preview dialog
  });

  it('downloads a template', async () => {
    render(<ReportBuilder />);
    // ...mock download and assert download action
  });

  it('exports a template to Excel', async () => {
    render(<ReportBuilder />);
    // ...mock export and assert export action
  });

  it('handles fetch/save/delete/export errors', async () => {
    render(<ReportBuilder />);
    // ...mock error and assert error UI
  });

  it('handles empty state', () => {
    render(<ReportBuilder />);
    // ...mock no templates and assert empty message
  });

  it('handles large template set (performance)', () => {
    render(<ReportBuilder />);
    // ...mock large number of templates and assert performance/UX
  });

  it('handles duplicate template name', async () => {
    render(<ReportBuilder />);
    // ...mock duplicate name and assert error UI
  });

  it('handles cancel edit flow', async () => {
    render(<ReportBuilder />);
    // ...mock cancel edit and assert no changes
  });

  it('is accessible (axe, keyboard, focus)', async () => {
    const { container } = render(<ReportBuilder />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
    // ...add keyboard/focus navigation tests for tabs, dialogs, and buttons
  });
}); 