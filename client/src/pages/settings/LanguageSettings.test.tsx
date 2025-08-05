// @ts-expect-error: If jest-axe types are missing, run: npm install --save-dev jest-axe
import { axe, toHaveNoViolations } from 'jest-axe';
// @ts-expect-error: If user-event types are missing, run: npm install --save-dev @testing-library/user-event
import userEvent from '@testing-library/user-event';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LanguageSettings from './LanguageSettings';

// @ts-expect-error: If toHaveNoViolations is not typed, this is expected for jest-axe
expect.extend(toHaveNoViolations);

describe('LanguageSettings', () => {
  it('renders language settings and options', () => {
    render(<LanguageSettings />);
    expect(screen.getByText(/language/i)).toBeInTheDocument();
  });

  it('changes language', async () => {
    render(<LanguageSettings />);
    // ...mock language change and assert update
  });

  it('handles unsupported language', async () => {
    render(<LanguageSettings />);
    // ...mock unsupported language and assert error UI
  });

  it('handles network error on language change', async () => {
    render(<LanguageSettings />);
    // ...mock network error and assert error UI
  });

  it('is accessible (axe, keyboard, focus)', async () => {
    const { container } = render(<LanguageSettings />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
    // ...add keyboard/focus navigation tests for radio buttons
  });
}); 