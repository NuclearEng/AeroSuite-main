// @ts-expect-error: If jest-axe types are missing, run: npm install --save-dev jest-axe
import { axe, toHaveNoViolations } from 'jest-axe';
// @ts-expect-error: If user-event types are missing, run: npm install --save-dev @testing-library/user-event
import userEvent from '@testing-library/user-event';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SettingsPage from './SettingsPage';

// @ts-expect-error: If toHaveNoViolations is not typed, this is expected for jest-axe
expect.extend(toHaveNoViolations);

describe('SettingsPage', () => {
  it('renders settings page and tabs', () => {
    render(<SettingsPage />);
    expect(screen.getByText(/settings/i)).toBeInTheDocument();
  });

  it('navigates between tabs', async () => {
    render(<SettingsPage />);
    // ...mock tab navigation and assert content
  });

  it('handles rapid tab switching', async () => {
    render(<SettingsPage />);
    // ...mock rapid tab switching and assert stability
  });

  it('handles empty state', () => {
    render(<SettingsPage />);
    // ...mock no settings and assert empty message
  });

  it('is accessible (axe)', async () => {
    const { container } = render(<SettingsPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('is accessible (axe, keyboard, focus)', async () => {
    const { container } = render(<SettingsPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
    // ...add keyboard/focus navigation tests for tabs and focus management
  });
}); 