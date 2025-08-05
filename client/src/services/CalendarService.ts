import axios from 'axios';
import { format, addDays, subDays } from 'date-fns';

// Define event types
export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO date string
  end?: string; // ISO date string
  allDay?: boolean;
  location?: string;
  description?: string;
  url?: string;
  color?: string;
  type: EventType;
  sourceId?: string; // ID from external source
  meta?: Record<string, any>; // Additional metadata
}

export type EventType = 'inspection' | 'audit' | 'meeting' | 'deadline' | 'reminder' | 'other';

export type CalendarSource = 'internal' | 'google' | 'outlook' | 'ical';

export interface CalendarIntegration {
  id: string;
  name: string;
  type: CalendarSource;
  isConnected: boolean;
  lastSync?: string;
}

class CalendarService {
  private baseUrl = '/api/v1/calendar';
  private cachedEvents: Map<string, CalendarEvent[]> = new Map();
  private integrations: CalendarIntegration[] = [];

  /**
   * Get all calendar events from all sources
   */
  public async getEvents(start?: Date, end?: Date): Promise<CalendarEvent[]> {
    try {
      // Format dates for API request
      const startDate = start ? format(start, 'yyyy-MM-dd') : format(subDays(new Date(), 30), 'yyyy-MM-dd');
      const endDate = end ? format(end, 'yyyy-MM-dd') : format(addDays(new Date(), 60), 'yyyy-MM-dd');
      
      // Cache key based on date range
      const cacheKey = `${startDate}_${endDate}`;
      
      // Check cache first
      if (this.cachedEvents.has(cacheKey)) {
        return this.cachedEvents.get(cacheKey) || [];
      }
      
      // In a real implementation, we would fetch from API
      // const response = await axios.get(`${this.baseUrl}/events`, {
      //   params: { start: startDate, end: endDate }
      // });
      // const events = response.data;
      
      // For now, generate mock data
      const events = this.getMockEvents(start, end);
      
      // Cache the results
      this.cachedEvents.set(cacheKey, events);
      
      return events;
    } catch (_error) {
      console.error('Error fetching calendar events:', error);
      return [];
    }
  }

  /**
   * Get events of a specific type
   */
  public async getEventsByType(type: EventType, start?: Date, end?: Date): Promise<CalendarEvent[]> {
    const allEvents = await this.getEvents(start, end);
    return allEvents.filter(event => event.type === type);
  }

  /**
   * Create a new calendar event
   */
  public async createEvent(event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent | null> {
    try {
      // In a real implementation, we would post to API
      // const response = await axios.post(`${this.baseUrl}/events`, event);
      // return response.data;
      
      // Mock implementation
      const newEvent = {
        ...event,
        id: `event_${Date.now()}_${Math.floor(Math.random() * 1000)}`
      } as CalendarEvent;
      
      // Clear cache to force refresh on next get
      this.cachedEvents.clear();
      
      return newEvent;
    } catch (_error) {
      console.error('Error creating calendar event:', error);
      return null;
    }
  }

  /**
   * Update an existing calendar event
   */
  public async updateEvent(id: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent | null> {
    try {
      // In a real implementation, we would put to API
      // const response = await axios.put(`${this.baseUrl}/events/${id}`, updates);
      // return response.data;
      
      // Clear cache to force refresh on next get
      this.cachedEvents.clear();
      
      // Mock implementation - in real code this would come from the API
      return {
        id,
        title: updates.title || 'Updated Event',
        start: updates.start || new Date().toISOString(),
        type: updates.type || 'other',
        ...updates
      };
    } catch (_error) {
      console.error('Error updating calendar event:', error);
      return null;
    }
  }

  /**
   * Delete a calendar event
   */
  public async deleteEvent(id: string): Promise<boolean> {
    try {
      // In a real implementation, we would delete via API
      // await axios.delete(`${this.baseUrl}/events/${id}`);
      
      // Clear cache to force refresh on next get
      this.cachedEvents.clear();
      
      return true;
    } catch (_error) {
      console.error('Error deleting calendar event:', error);
      return false;
    }
  }

  /**
   * Get available calendar integrations
   */
  public async getIntegrations(): Promise<CalendarIntegration[]> {
    try {
      // In a real implementation, we would fetch from API
      // const response = await axios.get(`${this.baseUrl}/integrations`);
      // return response.data;
      
      // Mock implementation
      if (this.integrations.length === 0) {
        this.integrations = [
          {
            id: 'internal',
            name: 'AeroSuite Calendar',
            type: 'internal',
            isConnected: true
          },
          {
            id: 'google',
            name: 'Google Calendar',
            type: 'google',
            isConnected: false
          },
          {
            id: 'outlook',
            name: 'Microsoft Outlook',
            type: 'outlook',
            isConnected: false
          }
        ];
      }
      
      return this.integrations;
    } catch (_error) {
      console.error('Error fetching calendar integrations:', error);
      return [];
    }
  }

  /**
   * Connect to an external calendar
   */
  public async connectCalendar(type: CalendarSource): Promise<boolean> {
    try {
      // In a real implementation, we would initiate OAuth flow
      // const response = await axios.post(`${this.baseUrl}/integrations/${type}/connect`);
      
      // Mock implementation
      const integration = this.integrations.find(i => i.type === type);
      if (integration) {
        integration.isConnected = true;
        integration.lastSync = new Date().toISOString();
      }
      
      return true;
    } catch (_error) {
      console.error(`Error connecting to ${type} calendar:`, error);
      return false;
    }
  }

  /**
   * Disconnect from an external calendar
   */
  public async disconnectCalendar(type: CalendarSource): Promise<boolean> {
    try {
      // In a real implementation, we would revoke access
      // await axios.post(`${this.baseUrl}/integrations/${type}/disconnect`);
      
      // Mock implementation
      const integration = this.integrations.find(i => i.type === type);
      if (integration) {
        integration.isConnected = false;
        delete integration.lastSync;
      }
      
      return true;
    } catch (_error) {
      console.error(`Error disconnecting from ${type} calendar:`, error);
      return false;
    }
  }

  /**
   * Sync with external calendars
   */
  public async syncCalendars(): Promise<boolean> {
    try {
      // In a real implementation, we would trigger sync
      // await axios.post(`${this.baseUrl}/sync`);
      
      // Clear cache to force refresh on next get
      this.cachedEvents.clear();
      
      // Update last sync time for connected integrations
      this.integrations.forEach(integration => {
        if (integration.isConnected) {
          integration.lastSync = new Date().toISOString();
        }
      });
      
      return true;
    } catch (_error) {
      console.error('Error syncing calendars:', error);
      return false;
    }
  }

  /**
   * Generate mock events for development
   */
  private getMockEvents(start?: Date, end?: Date): CalendarEvent[] {
    const startDate = start || subDays(new Date(), 30);
    const endDate = end || addDays(new Date(), 60);
    const today = new Date();
    
    const events: CalendarEvent[] = [
      // Inspections
      {
        id: 'insp_001',
        title: 'Quality Inspection - Aerospace Parts',
        start: addDays(today, 2).toISOString(),
        end: addDays(today, 2).toISOString(),
        allDay: true,
        type: 'inspection',
        location: 'Building A, Room 101',
        description: 'Regular quality inspection of aerospace parts from supplier XYZ',
        color: '#4CAF50'
      },
      {
        id: 'insp_002',
        title: 'Final Article Inspection - Engine Components',
        start: addDays(today, 8).toISOString(),
        end: addDays(today, 8).toISOString(),
        allDay: true,
        type: 'inspection',
        location: 'Quality Lab',
        description: 'Final inspection before shipping to customer',
        color: '#4CAF50'
      },
      
      // Audits
      {
        id: 'audit_001',
        title: 'Supplier Audit - Global Aviation',
        start: addDays(today, 5).toISOString(),
        end: addDays(today, 6).toISOString(),
        allDay: true,
        type: 'audit',
        location: 'Global Aviation HQ',
        description: 'Annual supplier audit',
        color: '#FF9800'
      },
      
      // Meetings
      {
        id: 'meeting_001',
        title: 'Quality Team Weekly Meeting',
        start: `${format(addDays(today, 1), 'yyyy-MM-dd')}T10:00:00`,
        end: `${format(addDays(today, 1), 'yyyy-MM-dd')}T11:00:00`,
        allDay: false,
        type: 'meeting',
        location: 'Conference Room B',
        description: 'Weekly team meeting to discuss quality metrics',
        color: '#2196F3'
      },
      
      // Deadlines
      {
        id: 'deadline_001',
        title: 'Monthly Quality Report Due',
        start: `${format(addDays(today, 10), 'yyyy-MM-dd')}T17:00:00`,
        allDay: false,
        type: 'deadline',
        description: 'Submit monthly quality metrics report to management',
        color: '#F44336'
      },
      
      // Reminders
      {
        id: 'reminder_001',
        title: 'Calibrate Testing Equipment',
        start: addDays(today, 3).toISOString(),
        allDay: true,
        type: 'reminder',
        description: 'Quarterly calibration of all testing equipment',
        color: '#9C27B0'
      }
    ];
    
    // Add some events in the past
    events.push({
      id: 'insp_past_001',
      title: 'Previous Inspection - Aircraft Components',
      start: subDays(today, 10).toISOString(),
      end: subDays(today, 10).toISOString(),
      allDay: true,
      type: 'inspection',
      location: 'Building B, Room 203',
      description: 'Completed inspection of aircraft components',
      color: '#4CAF50'
    });
    
    // Add some future events
    events.push({
      id: 'audit_future_001',
      title: 'ISO 9001 Certification Audit',
      start: addDays(today, 45).toISOString(),
      end: addDays(today, 47).toISOString(),
      allDay: true,
      type: 'audit',
      location: 'Main Facility',
      description: 'Annual ISO 9001 certification audit',
      color: '#FF9800'
    });
    
    return events;
  }
}

export default new CalendarService(); 