import { axe, toHaveNoViolations } from 'jest-axe';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LanguageSettings from './LanguageSettings';

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