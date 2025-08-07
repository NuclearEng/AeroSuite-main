// @ts-expect-error: If jest-axe types are missing, run: npm install --save-dev jest-axe
import { axe, toHaveNoViolations } from 'jest-axe';
// @ts-expect-error: If user-event types are missing, run: npm install --save-dev @testing-library/user-event
import userEvent from '@testing-library/user-event';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProfilePage from './ProfilePage';

// @ts-expect-error: If toHaveNoViolations is not typed, this is expected for jest-axe
expect.extend(toHaveNoViolations);

describe('ProfilePage', () => {
  it('renders profile page', () => {
    render(<ProfilePage />);
    expect(screen.getByText(/user profile/i)).toBeInTheDocument();
  });

  it('edits profile info', async () => {
    render(<ProfilePage />);
    // ...mock profile edit and assert update
  });

  it('verifies phone via SMS', async () => {
    render(<ProfilePage />);
    // ...mock SMS verification and assert update
  });

  it('handles invalid phone number', async () => {
    render(<ProfilePage />);
    // ...mock invalid phone and assert error UI
  });

  it('handles SMS delivery failure', async () => {
    render(<ProfilePage />);
    // ...mock SMS failure and assert error UI
  });

  it('handles network error on profile update', async () => {
    render(<ProfilePage />);
    // ...mock network error and assert error UI
  });

  it('is accessible (axe)', async () => {
    const { container } = render(<ProfilePage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
}); 