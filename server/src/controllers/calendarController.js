/**
 * Calendar Controller
 * 
 * Handles calendar events and integrations with external calendar services
 * Task: TS366 - Calendar integration implementation
 */

const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const logger = require('../utils/logger');
const CalendarEvent = require('../models/CalendarEvent');
const CalendarIntegration = require('../models/CalendarIntegration');
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
const axios = require('axios');

/**
 * Get all calendar events within a date range
 */
exports.getEvents = async (req, res) => {
  try {
    const { start, end, type } = req.query;
    
    // Build query
    const query = {};
    
    // Add date range filter
    if (start || end) {
      query.start = {};
      if (start) query.start.$gte = new Date(start);
      if (end) query.start.$lte = new Date(end);
    }
    
    // Add type filter
    if (type) {
      query.type = type;
    }
    
    // Add user filter (only show events for the current user or public events)
    query.$or = [
      { userId: req.user._id },
      { isPublic: true }
    ];
    
    // Get events
    const events = await CalendarEvent.find(query).sort({ start: 1 }).limit(500);
    
    // Get external events if needed
    let externalEvents = [];
    if (!type || type === 'all') {
      externalEvents = await getExternalEvents(req.user._id, start, end);
    }
    
    // Combine and return events
    res.status(200).json([...events, ...externalEvents]);
  } catch (error) {
    logger.error('Error getting calendar events:', error);
    res.status(500).json({ message: 'Error getting calendar events', error: error.message });
  }
};

/**
 * Create a new calendar event
 */
exports.createEvent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { title, start, end, allDay, location, description, type, isPublic } = req.body;
    
    // Create event
    const event = new CalendarEvent({
      title,
      start: new Date(start),
      end: end ? new Date(end) : undefined,
      allDay: allDay || false,
      location,
      description,
      type: type || 'other',
      isPublic: isPublic || false,
      userId: req.user._id,
      createdBy: req.user._id
    });
    
    // Save event
    await event.save();
    
    res.status(201).json(event);
  } catch (error) {
    logger.error('Error creating calendar event:', error);
    res.status(500).json({ message: 'Error creating calendar event', error: error.message });
  }
};

/**
 * Update an existing calendar event
 */
exports.updateEvent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const { id } = req.params;
    const { title, start, end, allDay, location, description, type, isPublic } = req.body;
    
    // Find event
    const event = await CalendarEvent.findById(id);
    
    // Check if event exists
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check if user has permission to update
    if (event.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You do not have permission to update this event' });
    }
    
    // Update event
    event.title = title || event.title;
    event.start = start ? new Date(start) : event.start;
    event.end = end ? new Date(end) : event.end;
    event.allDay = allDay !== undefined ? allDay : event.allDay;
    event.location = location !== undefined ? location : event.location;
    event.description = description !== undefined ? description : event.description;
    event.type = type || event.type;
    event.isPublic = isPublic !== undefined ? isPublic : event.isPublic;
    event.updatedAt = new Date();
    
    // Save event
    await event.save();
    
    res.status(200).json(event);
  } catch (error) {
    logger.error('Error updating calendar event:', error);
    res.status(500).json({ message: 'Error updating calendar event', error: error.message });
  }
};

/**
 * Delete a calendar event
 */
exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find event
    const event = await CalendarEvent.findById(id);
    
    // Check if event exists
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check if user has permission to delete
    if (event.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You do not have permission to delete this event' });
    }
    
    // Delete event
    await event.remove();
    
    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    logger.error('Error deleting calendar event:', error);
    res.status(500).json({ message: 'Error deleting calendar event', error: error.message });
  }
};

/**
 * Get calendar integrations for the current user
 */
exports.getIntegrations = async (req, res) => {
  try {
    // Get integrations
    const integrations = await CalendarIntegration.find({ userId: req.user._id });
    
    // Always include internal calendar
    const hasInternal = integrations.some(i => i.type === 'internal');
    
    if (!hasInternal) {
      integrations.unshift({
        type: 'internal',
        name: 'AeroSuite Calendar',
        isConnected: true,
        userId: req.user._id
      });
    }
    
    res.status(200).json(integrations);
  } catch (error) {
    logger.error('Error getting calendar integrations:', error);
    res.status(500).json({ message: 'Error getting calendar integrations', error: error.message });
  }
};

/**
 * Connect to Google Calendar
 */
exports.connectGoogle = async (req, res) => {
  try {
    // In a real implementation, we would handle OAuth flow
    // For now, we'll just create a mock integration
    
    // Check if integration already exists
    let integration = await CalendarIntegration.findOne({ 
      userId: req.user._id,
      type: 'google'
    });
    
    if (!integration) {
      // Create new integration
      integration = new CalendarIntegration({
        type: 'google',
        name: 'Google Calendar',
        isConnected: true,
        accessToken: 'mock-token',
        refreshToken: 'mock-refresh-token',
        expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
        userId: req.user._id
      });
    } else {
      // Update existing integration
      integration.isConnected = true;
      integration.accessToken = 'mock-token';
      integration.refreshToken = 'mock-refresh-token';
      integration.expiresAt = new Date(Date.now() + 3600000); // 1 hour from now
    }
    
    // Save integration
    await integration.save();
    
    res.status(200).json({ message: 'Connected to Google Calendar', integration });
  } catch (error) {
    logger.error('Error connecting to Google Calendar:', error);
    res.status(500).json({ message: 'Error connecting to Google Calendar', error: error.message });
  }
};

/**
 * Connect to Microsoft Outlook
 */
exports.connectOutlook = async (req, res) => {
  try {
    // In a real implementation, we would handle OAuth flow
    // For now, we'll just create a mock integration
    
    // Check if integration already exists
    let integration = await CalendarIntegration.findOne({ 
      userId: req.user._id,
      type: 'outlook'
    });
    
    if (!integration) {
      // Create new integration
      integration = new CalendarIntegration({
        type: 'outlook',
        name: 'Microsoft Outlook',
        isConnected: true,
        accessToken: 'mock-token',
        refreshToken: 'mock-refresh-token',
        expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
        userId: req.user._id
      });
    } else {
      // Update existing integration
      integration.isConnected = true;
      integration.accessToken = 'mock-token';
      integration.refreshToken = 'mock-refresh-token';
      integration.expiresAt = new Date(Date.now() + 3600000); // 1 hour from now
    }
    
    // Save integration
    await integration.save();
    
    res.status(200).json({ message: 'Connected to Microsoft Outlook', integration });
  } catch (error) {
    logger.error('Error connecting to Microsoft Outlook:', error);
    res.status(500).json({ message: 'Error connecting to Microsoft Outlook', error: error.message });
  }
};

/**
 * Disconnect from an external calendar
 */
exports.disconnectCalendar = async (req, res) => {
  try {
    const { type } = req.params;
    
    // Check if type is valid
    if (!['google', 'outlook', 'ical'].includes(type)) {
      return res.status(400).json({ message: 'Invalid calendar type' });
    }
    
    // Find integration
    const integration = await CalendarIntegration.findOne({ 
      userId: req.user._id,
      type
    });
    
    // Check if integration exists
    if (!integration) {
      return res.status(404).json({ message: 'Integration not found' });
    }
    
    // Disconnect integration
    integration.isConnected = false;
    
    // Save integration
    await integration.save();
    
    res.status(200).json({ message: `Disconnected from ${type}`, integration });
  } catch (error) {
    logger.error(`Error disconnecting from calendar (${req.params.type}):`, error);
    res.status(500).json({ message: 'Error disconnecting from calendar', error: error.message });
  }
};

/**
 * Sync calendars
 */
exports.syncCalendars = async (req, res) => {
  try {
    // Get user's integrations
    const integrations = await CalendarIntegration.find({ 
      userId: req.user._id,
      isConnected: true
    });
    
    // Sync each integration
    for (const integration of integrations) {
      integration.lastSync = new Date();
      await integration.save();
    }
    
    res.status(200).json({ message: 'Calendars synced successfully', integrations });
  } catch (error) {
    logger.error('Error syncing calendars:', error);
    res.status(500).json({ message: 'Error syncing calendars', error: error.message });
  }
};

/**
 * Helper function to get events from external calendars
 */
async function getExternalEvents(userId, start, end) {
  try {
    // Get user's integrations
    const integrations = await CalendarIntegration.find({ 
      userId,
      isConnected: true
    });
    
    let externalEvents = [];
    
    // Get events from each integration
    for (const integration of integrations) {
      if (integration.type === 'google') {
        const googleEvents = await getGoogleEvents(integration, start, end);
        externalEvents = [...externalEvents, ...googleEvents];
      } else if (integration.type === 'outlook') {
        const outlookEvents = await getOutlookEvents(integration, start, end);
        externalEvents = [...externalEvents, ...outlookEvents];
      }
    }
    
    return externalEvents;
  } catch (error) {
    logger.error('Error getting external events:', error);
    return [];
  }
}

/**
 * Helper function to get events from Google Calendar
 */
async function getGoogleEvents(integration, start, end) {
  // In a real implementation, we would use the Google Calendar API
  // For now, we'll just return mock data
  
  return [
    {
      id: `google:event1`,
      title: 'Google Calendar Event 1',
      start: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
      end: new Date(Date.now() + 90000000).toISOString(),
      allDay: false,
      location: 'Google HQ',
      description: 'This is a mock Google Calendar event',
      type: 'meeting',
      sourceId: 'google:event1',
      color: '#4285F4' // Google blue
    },
    {
      id: `google:event2`,
      title: 'Google Calendar Event 2',
      start: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
      allDay: true,
      type: 'other',
      sourceId: 'google:event2',
      color: '#4285F4' // Google blue
    }
  ];
}

/**
 * Helper function to get events from Microsoft Outlook
 */
async function getOutlookEvents(integration, start, end) {
  // In a real implementation, we would use the Microsoft Graph API
  // For now, we'll just return mock data
  
  return [
    {
      id: `outlook:event1`,
      title: 'Outlook Calendar Event 1',
      start: new Date(Date.now() + 259200000).toISOString(), // 3 days from now
      end: new Date(Date.now() + 262800000).toISOString(),
      allDay: false,
      location: 'Microsoft Office',
      description: 'This is a mock Outlook Calendar event',
      type: 'meeting',
      sourceId: 'outlook:event1',
      color: '#0078D4' // Microsoft blue
    },
    {
      id: `outlook:event2`,
      title: 'Outlook Calendar Event 2',
      start: new Date(Date.now() + 345600000).toISOString(), // 4 days from now
      allDay: true,
      type: 'other',
      sourceId: 'outlook:event2',
      color: '#0078D4' // Microsoft blue
    }
  ];
} 