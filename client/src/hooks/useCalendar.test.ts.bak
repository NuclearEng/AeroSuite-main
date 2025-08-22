import { renderHook, act, waitFor } from '@testing-library/react';
import { useCalendar } from './useCalendar';
describe('useCalendar', () => {
  it('loads events and handles errors', async () => {
    const { result } = renderHook(() => useCalendar());
    await waitFor(() => expect(Array.isArray(result.current.events)).toBe(true));
    // Simulate error
    // ...mock error and test error state
  });
  it('creates, updates, deletes events', async () => {
    const { result } = renderHook(() => useCalendar());
    // ...mock and test CRUD
  });
  it('prevents overlapping events', async () => {
    const { result } = renderHook(() => useCalendar());
    // ...mock adding overlapping events and assert error
  });
  it('handles invalid date ranges', async () => {
    const { result } = renderHook(() => useCalendar());
    // ...mock invalid date and assert error
  });
  it('handles sync errors', async () => {
    const { result } = renderHook(() => useCalendar());
    // ...mock sync error and assert error state
  });
  // Add edge case tests (overlap, invalid dates, sync errors)
}); 