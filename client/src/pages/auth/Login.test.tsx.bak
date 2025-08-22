import { axe, toHaveNoViolations } from 'jest-axe';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from './Login';

expect.extend(toHaveNoViolations);

describe('Login', () => {
  it('renders login form', () => {
    render(<Login />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  it('shows error on empty submit', async () => {
    render(<Login />);
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(await screen.findByText(/password is required/i)).toBeInTheDocument();
  });

  it('shows error on invalid credentials', async () => {
    render(<Login />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'wrong@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();
  });

  it('handles 2FA required', async () => {
    render(<Login />);
    // ...mock 2FA required and assert 2FA UI
  });

  it('handles unverified email', async () => {
    render(<Login />);
    // ...mock unverified email and assert resend UI
  });

  it('focuses first invalid field on error', async () => {
    render(<Login />);
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    await waitFor(() => {
      expect(document.activeElement).toBe(screen.getByLabelText(/email/i));
    });
  });

  it('is accessible (axe, keyboard, focus)', async () => {
    const { container } = render(<Login />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
    // ...add keyboard/focus navigation tests
  });
}); 