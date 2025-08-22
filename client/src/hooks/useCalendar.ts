import { useState, useEffect, useCallback } from 'react';
import CalendarService, { 
  CalendarEvent, 
  EventType, 
  CalendarSource,
  CalendarIntegration
} from '../services/CalendarService';

interface UseCalendarOptions {
  autoLoad?: boolean;
  eventType?: EventType;
  startDate?: Date;
  endDate?: Date;
}

interface UseCalendarResult {
  events: CalendarEvent[];
  isLoading: boolean;
  error: Error | null;
  integrations: CalendarIntegration[];
  loadEvents: (start?: Date, end?: Date) => Promise<void>;
  loadEventsByType: (type: EventType, start?: Date, end?: Date) => Promise<void>;
  createEvent: (event: Omit<CalendarEvent, 'id'>) => Promise<CalendarEvent | null>;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => Promise<CalendarEvent | null>;
  deleteEvent: (id: string) => Promise<boolean>;
  loadIntegrations: () => Promise<void>;
  connectCalendar: (type: CalendarSource) => Promise<boolean>;
  disconnectCalendar: (type: CalendarSource) => Promise<boolean>;
  syncCalendars: () => Promise<boolean>;
}

export function useCalendar(options: UseCalendarOptions = {}): UseCalendarResult {
  const { autoLoad = true, eventType, startDate, endDate } = options;
  
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [integrations, setIntegrations] = useState<CalendarIntegration[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Load events based on date range
  const loadEvents = useCallback(async (start?: Date, end?: Date) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const fetchedEvents = await CalendarService.getEvents(start || startDate, end || endDate);
      setEvents(fetchedEvents);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load calendar events'));
      console.error('Error loading calendar events:', err);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  // Load events filtered by type
  const loadEventsByType = useCallback(async (type: EventType, start?: Date, end?: Date) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const fetchedEvents = await CalendarService.getEventsByType(type, start || startDate, end || endDate);
      setEvents(fetchedEvents);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(`Failed to load ${type} events`));
      console.error(`Error loading ${type} events:`, err);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate]);

  // Create a new event
  const createEvent = useCallback(async (event: Omit<CalendarEvent, 'id'>) => {
    try {
      setError(null);
      
      const newEvent = await CalendarService.createEvent(event);
      
      if (newEvent) {
        // Update local state
        setEvents(prev => [...prev, newEvent]);
      }
      
      return newEvent;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create event'));
      console.error('Error creating event:', err);
      return null;
    }
  }, []);

  // Update an existing event
  const updateEvent = useCallback(async (id: string, updates: Partial<CalendarEvent>) => {
    try {
      setError(null);
      
      const updatedEvent = await CalendarService.updateEvent(id, updates);
      
      if (updatedEvent) {
        // Update local state
        setEvents(prev => 
          prev.map(event => event.id === id ? { ...event, ...updatedEvent } : event)
        );
      }
      
      return updatedEvent;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to update event'));
      console.error('Error updating event:', err);
      return null;
    }
  }, []);

  // Delete an event
  const deleteEvent = useCallback(async (id: string) => {
    try {
      setError(null);
      
      const success = await CalendarService.deleteEvent(id);
      
      if (success) {
        // Update local state
        setEvents(prev => prev.filter(event => event.id !== id));
      }
      
      return success;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to delete event'));
      console.error('Error deleting event:', err);
      return false;
    }
  }, []);

  // Load calendar integrations
  const loadIntegrations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const fetchedIntegrations = await CalendarService.getIntegrations();
      setIntegrations(fetchedIntegrations);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load calendar integrations'));
      console.error('Error loading calendar integrations:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Connect to an external calendar
  const connectCalendar = useCallback(async (type: CalendarSource) => {
    try {
      setError(null);
      
      const success = await CalendarService.connectCalendar(type);
      
      if (success) {
        // Refresh integrations
        await loadIntegrations();
      }
      
      return success;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(`Failed to connect to ${type} calendar`));
      console.error(`Error connecting to ${type} calendar:`, err);
      return false;
    }
  }, [loadIntegrations]);

  // Disconnect from an external calendar
  const disconnectCalendar = useCallback(async (type: CalendarSource) => {
    try {
      setError(null);
      
      const success = await CalendarService.disconnectCalendar(type);
      
      if (success) {
        // Refresh integrations
        await loadIntegrations();
      }
      
      return success;
    } catch (err) {
      setError(err instanceof Error ? err : new Error(`Failed to disconnect from ${type} calendar`));
      console.error(`Error disconnecting from ${type} calendar:`, err);
      return false;
    }
  }, [loadIntegrations]);

  // Sync with external calendars
  const syncCalendars = useCallback(async () => {
    try {
      setError(null);
      
      const success = await CalendarService.syncCalendars();
      
      if (success) {
        // Refresh events and integrations
        await Promise.all([
          loadEvents(),
          loadIntegrations()
        ]);
      }
      
      return success;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to sync calendars'));
      console.error('Error syncing calendars:', err);
      return false;
    }
  }, [loadEvents, loadIntegrations]);

  // Initial data loading
  useEffect(() => {
    if (autoLoad) {
      if (eventType) {
        loadEventsByType(eventType);
      } else {
        loadEvents();
      }
      loadIntegrations();
    }
  }, [autoLoad, eventType, loadEvents, loadEventsByType, loadIntegrations]);

  return {
    events,
    isLoading,
    error,
    integrations,
    loadEvents,
    loadEventsByType,
    createEvent,
    updateEvent,
    deleteEvent,
    loadIntegrations,
    connectCalendar,
    disconnectCalendar,
    syncCalendars
  };
} 