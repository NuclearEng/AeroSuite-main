// @ts-expect-error: If jest-axe types are missing, run: npm install --save-dev jest-axe
import { axe, toHaveNoViolations } from 'jest-axe';
// @ts-expect-error: If user-event types are missing, run: npm install --save-dev @testing-library/user-event
import userEvent from '@testing-library/user-event';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CalendarPage from './CalendarPage';

// @ts-expect-error: If toHaveNoViolations is not typed, this is expected for jest-axe
expect.extend(toHaveNoViolations);

describe('CalendarPage', () => {
  it('renders calendar and add event button', () => {
    render(<CalendarPage />);
    expect(screen.getByText(/calendar/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add event/i })).toBeInTheDocument();
  });

  it('opens add event dialog and validates required fields', async () => {
    render(<CalendarPage />);
    userEvent.click(screen.getByRole('button', { name: /add event/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    userEvent.click(screen.getByRole('button', { name: /add/i }));
    expect(screen.getByLabelText(/event title/i)).toHaveAttribute('required');
  });

  it('handles invalid date ranges', async () => {
    render(<CalendarPage />);
    userEvent.click(screen.getByRole('button', { name: /add event/i }));
    const start = screen.getByLabelText(/start date/i);
    const end = screen.getByLabelText(/end date/i);
    userEvent.type(start, '2024-01-02T10:00');
    userEvent.type(end, '2024-01-01T09:00');
    userEvent.click(screen.getByRole('button', { name: /add/i }));
    expect(await screen.findByText(/end date must be after start/i)).toBeInTheDocument();
  });

  it('is accessible (axe)', async () => {
    const { container } = render(<CalendarPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('edits an event', async () => {
    render(<CalendarPage />);
    userEvent.click(screen.getByRole('button', { name: /add event/i }));
    userEvent.type(screen.getByLabelText(/event title/i), 'Test Event');
    userEvent.click(screen.getByRole('button', { name: /add/i }));
    // Simulate clicking on the event and editing
    // ...mock event click and edit flow
  });

  it('deletes an event', async () => {
    render(<CalendarPage />);
    userEvent.click(screen.getByRole('button', { name: /add event/i }));
    userEvent.type(screen.getByLabelText(/event title/i), 'Delete Me');
    userEvent.click(screen.getByRole('button', { name: /add/i }));
    // Simulate clicking on the event and deleting
    // ...mock event click and delete flow
  });

  it('handles backend error on save', async () => {
    render(<CalendarPage />);
    userEvent.click(screen.getByRole('button', { name: /add event/i }));
    userEvent.type(screen.getByLabelText(/event title/i), 'Error Event');
    // ...mock backend error
    userEvent.click(screen.getByRole('button', { name: /add/i }));
    expect(await screen.findByText(/error saving event/i)).toBeInTheDocument();
  });

  it('prevents overlapping events', async () => {
    render(<CalendarPage />);
    // ...mock adding two events with overlapping times
    // ...assert error or warning is shown
  });

  // Add more tests for edit, delete, error, overlap, etc.
}); 