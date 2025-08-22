import React, { ChangeEvent, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Grid,
  IconButton,
  Tooltip,
  Divider,
  Chip,
  Alert,
  CircularProgress } from
'@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SyncIcon from '@mui/icons-material/Sync';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import LinkIcon from '@mui/icons-material/Link';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import { useCalendar } from '../../hooks/useCalendar';
import { CalendarEvent, EventType, CalendarSource } from '../../services/CalendarService';
import SEO from '../../utils/seo';
import { z } from 'zod';
import type { SelectChangeEvent } from '@mui/material/Select';

// Use require to avoid TypeScript errors if types are missing
const FullCalendar = require('@fullcalendar/react').default;
const dayGridPlugin = require('@fullcalendar/daygrid').default;
const timeGridPlugin = require('@fullcalendar/timegrid').default;
const interactionPlugin = require('@fullcalendar/interaction').default;
const listPlugin = require('@fullcalendar/list').default;

// Event type colors
const eventTypeColors: Record<EventType, string> = {
  inspection: '#4CAF50', // Green
  audit: '#FF9800', // Orange
  meeting: '#2196F3', // Blue
  deadline: '#F44336', // Red
  reminder: '#9C27B0', // Purple
  other: '#757575' // Gray
};

// Event type labels
const eventTypeLabels: Record<EventType, string> = {
  inspection: 'Inspection',
  audit: 'Audit',
  meeting: 'Meeting',
  deadline: 'Deadline',
  reminder: 'Reminder',
  other: 'Other'
};

// Calendar source labels
const calendarSourceLabels: Record<CalendarSource, string> = {
  internal: 'AeroSuite',
  google: 'Google Calendar',
  outlook: 'Microsoft Outlook',
  ical: 'iCalendar'
};

// Zod schema for event validation
const eventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  start: z.string().min(1, 'Start date/time is required'),
  end: z.string().optional(),
  allDay: z.boolean(),
  location: z.string().optional(),
  description: z.string().optional(),
  type: z.string()
}).refine((data: any) => {
  // start must be before end if end is provided
  if (data.end && new Date(data.start) > new Date(data.end)) return false;
  return true;
}, { message: 'End date/time must be after start', path: ['end'] });

const CalendarPage: React.FC = () => {
  // State for event dialog
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isNewEvent, setIsNewEvent] = useState(true);

  // State for integration dialog
  const [isIntegrationDialogOpen, setIsIntegrationDialogOpen] = useState(false);

  // State for event form
  const [eventForm, setEventForm] = useState<any> & {id?: string;}>({
    title: '',
    start: '',
    end: '',
    allDay: true,
    location: '',
    description: '',
    type: 'other'
  });

  // State for event details dialog
  const [isEventDetailsDialogOpen, setIsEventDetailsDialogOpen] = useState(false);

  // State for delete confirmation dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // State for sync status
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<any>(null);

  // State for form errors
  const [formErrors, setFormErrors] = useState<any>>({});

  // Get calendar data and functions from hook
  const {
    events,
    isLoading,
    error,
    integrations,
    loadEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    connectCalendar,
    disconnectCalendar,
    syncCalendars
  } = useCalendar();

  // Handle opening the event dialog for a new event
  const handleAddEvent = () => {
    setIsNewEvent(true);
    setSelectedEvent(null);

    // Initialize form with current date
    const now = new Date();
    const localISOString = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    setEventForm({
      title: '',
      start: localISOString,
      end: localISOString,
      allDay: true,
      location: '',
      description: '',
      type: 'other'
    });

    setIsEventDialogOpen(true);
  };

  // Handle opening the event dialog for an existing event
  const handleEditEvent = (event: CalendarEvent) => {
    setIsNewEvent(false);
    setSelectedEvent(event);

    // Convert ISO strings to local datetime-local format
    const startLocal = event.start ? new Date(event.start).toISOString().slice(0, 16) : '';
    const endLocal = event.end ? new Date(event.end).toISOString().slice(0, 16) : startLocal;

    setEventForm({
      id: event.id,
      title: event.title,
      start: startLocal,
      end: endLocal,
      allDay: event.allDay || false,
      location: event.location || '',
      description: event.description || '',
      type: event.type
    });

    setIsEventDialogOpen(true);
  };

  // Handle event click on calendar
  const handleEventClick = (info: any) => {
    const eventId = info.event.id;
    const event = events.find((e) => e.id === eventId);

    if (event) {
      setSelectedEvent(event);
      setIsEventDetailsDialogOpen(true);
    }
  };

  // Handle date click on calendar
  const handleDateClick = (info: any) => {
    setIsNewEvent(true);
    setSelectedEvent(null);

    // Initialize form with clicked date
    const clickedDate = new Date(info.date);
    const localISOString = new Date(clickedDate.getTime() - clickedDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    setEventForm({
      title: '',
      start: localISOString,
      end: localISOString,
      allDay: true,
      location: '',
      description: '',
      type: 'other'
    });

    setIsEventDialogOpen(true);
  };

  // Handle form input changes
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEventForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle select changes
  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setEventForm((prev) => ({ ...prev, [name as string]: value }));
  };

  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setEventForm((prev) => ({ ...prev, [name]: checked }));
  };

  // Handle form submission
  const handleSubmitEvent = async () => {
    // Zod validation
    const result = eventSchema.safeParse(eventForm);
    if (!result.success) {
      const errors: Record<string, string> = {};
      result.error.errors.forEach((e) => {
        if (e.path[0]) errors[e.path[0] as string] = e.message;
      });
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    try {
      if (isNewEvent) {
        // Create new event
        await createEvent({
          title: eventForm.title,
          start: new Date(eventForm.start).toISOString(),
          end: eventForm.end ? new Date(eventForm.end).toISOString() : undefined,
          allDay: eventForm.allDay,
          location: eventForm.location,
          description: eventForm.description,
          type: eventForm.type,
          color: eventTypeColors[eventForm.type]
        });
      } else if (selectedEvent && eventForm.id) {
        // Update existing event
        await updateEvent(eventForm.id, {
          title: eventForm.title,
          start: new Date(eventForm.start).toISOString(),
          end: eventForm.end ? new Date(eventForm.end).toISOString() : undefined,
          allDay: eventForm.allDay,
          location: eventForm.location,
          description: eventForm.description,
          type: eventForm.type,
          color: eventTypeColors[eventForm.type]
        });
      }

      // Check for overlap and large set
      const overlapping = events.some((e: CalendarEvent) =>
      e.id !== eventForm.id &&
      new Date(eventForm.start) < new Date(e.end || e.start) && new Date(eventForm.end || eventForm.start) > new Date(e.start)
      );
      if (overlapping) {
        setFormErrors({ general: 'Event overlaps with another event.' });
        return;
      }
      if (events.length > 1000) {
        setFormErrors({ general: 'Too many events. Please delete old events.' });
        return;
      }

      setIsEventDialogOpen(false);
    } catch (err: any) {
      // Surface backend validation errors
      setFormErrors({ general: err?.message || 'Error saving event' });
      console.error("Error:", error);
    }
  };

  // Handle delete button click
  const handleDeleteClick = () => {
    setIsDeleteDialogOpen(true);
  };

  // Handle confirm delete
  const handleConfirmDelete = async () => {
    if (selectedEvent) {
      await deleteEvent(selectedEvent.id);
      setIsDeleteDialogOpen(false);
      setIsEventDetailsDialogOpen(false);
      setIsEventDialogOpen(false);
    }
  };

  // Handle connect calendar
  const handleConnectCalendar = async (type: CalendarSource) => {
    try {
      await connectCalendar(type);
      setSyncMessage({ type: 'success', message: `Connected to ${calendarSourceLabels[type]}` });
    } catch (_err) {
      setSyncMessage({ type: 'error', message: `Failed to connect to ${calendarSourceLabels[type]}` });
    }
  };

  // Handle disconnect calendar
  const handleDisconnectCalendar = async (type: CalendarSource) => {
    try {
      await disconnectCalendar(type);
      setSyncMessage({ type: 'success', message: `Disconnected from ${calendarSourceLabels[type]}` });
    } catch (_err) {
      setSyncMessage({ type: 'error', message: `Failed to disconnect from ${calendarSourceLabels[type]}` });
    }
  };

  // Handle sync calendars
  const handleSyncCalendars = async () => {
    try {
      setIsSyncing(true);
      setSyncMessage(null);

      const success = await syncCalendars();

      if (success) {
        setSyncMessage({ type: 'success', message: 'Calendars synchronized successfully' });
      } else {
        setSyncMessage({ type: 'error', message: 'Failed to synchronize calendars' });
      }
    } catch (_err) {
      setSyncMessage({ type: 'error', message: 'Error synchronizing calendars' });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Container maxWidth="xl">
      <SEO
        title="Calendar - AeroSuite"
        description="Manage and view your schedule with AeroSuite's integrated calendar" />

      
      <Box sx={{ mt: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4">Calendar</Typography>
          <Box>
            <Button
              variant="outlined"
              startIcon={<LinkIcon />}
              onClick={() => setIsIntegrationDialogOpen(true)}
              sx={{ mr: 1 }}>

              Integrations
            </Button>
            <Button
              variant="outlined"
              startIcon={<SyncIcon />}
              onClick={handleSyncCalendars}
              disabled={isSyncing}
              sx={{ mr: 1 }}>

              {isSyncing ? 'Syncing...' : 'Sync'}
            </Button>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleAddEvent}>

              Add Event
            </Button>
          </Box>
        </Box>
        
        {syncMessage &&
        <Alert
          severity={syncMessage.type}
          sx={{ mb: 2 }}
          onClose={() => setSyncMessage(null)}>

            {syncMessage.message}
          </Alert>
        }
        
        <Paper elevation={2} sx={{ p: 2 }}>
          {isLoading ?
          <Box display="flex" justifyContent="center" alignItems="center" height={600}>
              <CircularProgress />
            </Box> :
          error ?
          <Box display="flex" flexDirection="column" alignItems="center" p={4}>
              <Typography color="error" gutterBottom>
                Error loading calendar events
              </Typography>
              <Button variant="outlined" color="primary" onClick={() => loadEvents()}>
                Retry
              </Button>
            </Box> :

          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
            }}
            events={events}
            eventClick={handleEventClick}
            dateClick={handleDateClick}
            height="auto"
            aspectRatio={1.8}
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              meridiem: false,
              hour12: false
            }}
            nowIndicator={true}
            businessHours={{
              daysOfWeek: [1, 2, 3, 4, 5],
              startTime: '08:00',
              endTime: '18:00'
            }}
            weekends={true}
            eventContent={(eventInfo: any) => {
              return (
                <Tooltip title={eventInfo.event.extendedProps.description || eventInfo.event.title}>
                    <Box
                    sx={{
                      backgroundColor: eventInfo.event.backgroundColor || eventInfo.event.extendedProps.color || '#1976d2',
                      color: '#fff',
                      padding: '2px 4px',
                      borderRadius: '2px',
                      fontSize: '0.85em',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      width: '100%'
                    }}>

                      {eventInfo.timeText && <span style={{ marginRight: '4px' }}>{eventInfo.timeText}</span>}
                      <span>{eventInfo.event.title}</span>
                    </Box>
                  </Tooltip>);

            }} />

          }
        </Paper>
      </Box>
      
      
      <Dialog
        open={isEventDialogOpen}
        onClose={() => setIsEventDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        aria-labelledby="event-dialog-title">

        <DialogTitle id="event-dialog-title">{isNewEvent ? 'Add Event' : 'Edit Event'}</DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ mt: 1 }}>
            {formErrors.general && <Alert severity="error">{formErrors.general}</Alert>}
            <TextField
              margin="normal"
              required
              fullWidth
              id="title"
              label="Event Title"
              name="title"
              value={eventForm.title}
              onChange={handleFormChange}
              autoFocus
              error={!!formErrors.title}
              helperText={formErrors.title}
              inputProps={{ 'aria-required': true }} />

            
            <FormControl fullWidth margin="normal">
              <InputLabel id="event-type-label">Event Type</InputLabel>
              <Select
                labelId="event-type-label"
                id="type"
                name="type"
                value={eventForm.type}
                onChange={handleSelectChange}
                label="Event Type">

                {Object.entries(eventTypeLabels).map(([value, label]: any) =>
                <MenuItem key={value} value={value}>
                    <Box display="flex" alignItems="center">
                      <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: eventTypeColors[value as EventType],
                        mr: 1
                      }} />

                      {label}
                    </Box>
                  </MenuItem>
                )}
              </Select>
            </FormControl>
            
            <FormControlLabel
              control={
              <Checkbox
                checked={eventForm.allDay}
                onChange={handleCheckboxChange}
                name="allDay"
                color="primary" />

              }
              label="All Day"
              sx={{ mt: 1, mb: 1 }} />

            
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="start"
                  label="Start Date/Time"
                  name="start"
                  type={eventForm.allDay ? "date" : "datetime-local"}
                  value={eventForm.start}
                  onChange={handleFormChange}
                  InputLabelProps={{ shrink: true }}
                  error={!!formErrors.start}
                  helperText={formErrors.start} />

              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  margin="normal"
                  fullWidth
                  id="end"
                  label="End Date/Time"
                  name="end"
                  type={eventForm.allDay ? "date" : "datetime-local"}
                  value={eventForm.end}
                  onChange={handleFormChange}
                  InputLabelProps={{ shrink: true }}
                  error={!!formErrors.end}
                  helperText={formErrors.end} />

              </Grid>
            </Grid>
            
            <TextField
              margin="normal"
              fullWidth
              id="location"
              label="Location"
              name="location"
              value={eventForm.location}
              onChange={handleFormChange}
              error={!!formErrors.location}
              helperText={formErrors.location} />

            
            <TextField
              margin="normal"
              fullWidth
              id="description"
              label="Description"
              name="description"
              value={eventForm.description}
              onChange={handleFormChange}
              multiline
              rows={3}
              error={!!formErrors.description}
              helperText={formErrors.description} />

          </Box>
        </DialogContent>
        <DialogActions>
          {!isNewEvent &&
          <Button onClick={handleDeleteClick} color="error" startIcon={<DeleteIcon />}>
              Delete
            </Button>
          }
          <Button onClick={() => setIsEventDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmitEvent} variant="contained" color="primary">
            {isNewEvent ? 'Add' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
      
      
      <Dialog open={isEventDetailsDialogOpen} onClose={() => setIsEventDetailsDialogOpen(false)} maxWidth="sm" fullWidth>
        {selectedEvent &&
        <>
            <DialogTitle>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="h6">{selectedEvent.title}</Typography>
                <Box>
                  <Tooltip title="Edit">
                    <IconButton
                    size="small"
                    onClick={() => {
                      setIsEventDetailsDialogOpen(false);
                      handleEditEvent(selectedEvent);
                    }}>

                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ mb: 2 }}>
                <Chip
                label={eventTypeLabels[selectedEvent.type]}
                size="small"
                sx={{
                  backgroundColor: selectedEvent.color || eventTypeColors[selectedEvent.type],
                  color: '#fff'
                }} />

              </Box>
              
              <Typography variant="subtitle1" gutterBottom>
                {selectedEvent.allDay ?
              <>
                    {new Date(selectedEvent.start).toLocaleDateString()}
                    {selectedEvent.end && ` - ${new Date(selectedEvent.end).toLocaleDateString()}`}
                    {' (All day)'}
                  </> :

              <>
                    {new Date(selectedEvent.start).toLocaleString()}
                    {selectedEvent.end && ` - ${new Date(selectedEvent.end).toLocaleString()}`}
                  </>
              }
              </Typography>
              
              {selectedEvent.location &&
            <Typography variant="body2" gutterBottom>
                  <strong>Location:</strong> {selectedEvent.location}
                </Typography>
            }
              
              <Divider sx={{ my: 2 }} />
              
              {selectedEvent.description ?
            <Typography variant="body1">{selectedEvent.description}</Typography> :

            <Typography variant="body2" color="textSecondary">No description provided</Typography>
            }
              
              {selectedEvent.sourceId &&
            <Box sx={{ mt: 2 }}>
                  <Chip
                label={`Synced from ${selectedEvent.sourceId.split(':')[0]}`}
                size="small"
                variant="outlined" />

                </Box>
            }
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setIsEventDetailsDialogOpen(false)}>Close</Button>
            </DialogActions>
          </>
        }
      </Dialog>
      
      
      <Dialog open={isDeleteDialogOpen} onClose={() => setIsDeleteDialogOpen(false)}>
        <DialogTitle>Delete Event</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this event? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      
      <Dialog open={isIntegrationDialogOpen} onClose={() => setIsIntegrationDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Calendar Integrations</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" paragraph>
            Connect to external calendar services to sync your events.
          </Typography>
          
          {integrations.map((integration: any) =>
          <Paper key={integration.id} variant="outlined" sx={{ p: 2, mb: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="subtitle1">{integration.name}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {integration.isConnected ?
                  <>
                        Connected
                        {integration.lastSync && ` · Last sync: ${new Date(integration.lastSync).toLocaleString()}`}
                      </> :

                  'Not connected'
                  }
                  </Typography>
                </Box>
                <Box>
                  {integration.type !== 'internal' && (
                integration.isConnected ?
                <Button
                  startIcon={<LinkOffIcon />}
                  color="error"
                  variant="outlined"
                  size="small"
                  onClick={() => handleDisconnectCalendar(integration.type)}>

                        Disconnect
                      </Button> :

                <Button
                  startIcon={<LinkIcon />}
                  color="primary"
                  variant="outlined"
                  size="small"
                  onClick={() => handleConnectCalendar(integration.type)}>

                        Connect
                      </Button>)

                }
                </Box>
              </Box>
            </Paper>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsIntegrationDialogOpen(false)}>Close</Button>
          <Button
            onClick={handleSyncCalendars}
            variant="contained"
            color="primary"
            startIcon={<SyncIcon />}
            disabled={isSyncing}>

            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>);

};

export default CalendarPage;

// Contract/performance test hooks can be added here for automation frameworks