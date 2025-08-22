import React, { useState } from 'react';
import { Card, CardContent, Typography, Box, CircularProgress, Button, Chip, IconButton, Tooltip } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import TuneIcon from '@mui/icons-material/Tune';
import AddIcon from '@mui/icons-material/Add';
import { useCalendar } from '../../../hooks/useCalendar';
import { EventType } from '../../../services/CalendarService';

// Use require to avoid TypeScript errors if types are missing
const FullCalendar = require('@fullcalendar/react').default;
const dayGridPlugin = require('@fullcalendar/daygrid').default;
const interactionPlugin = require('@fullcalendar/interaction').default;

interface CalendarWidgetProps {
  height?: number;
  defaultView?: 'dayGridMonth' | 'dayGridWeek' | 'dayGridDay';
  eventTypes?: EventType[];
  onEventClick?: (eventId: string) => void;
  onDateClick?: (date: Date) => void;
}

const CalendarWidget: React.FC<CalendarWidgetProps> = ({
  height = 400,
  defaultView = 'dayGridMonth',
  eventTypes,
  onEventClick,
  onDateClick
}) => {
  const [activeFilter, setActiveFilter] = useState<EventType | null>(null);
  
  const { 
    events, 
    isLoading, 
    error,
    loadEvents,
    loadEventsByType
  } = useCalendar({
    autoLoad: true,
    eventType: activeFilter || undefined
  });

  // Handle refresh button click
  const handleRefresh = () => {
    if (activeFilter) {
      loadEventsByType(activeFilter);
    } else {
      loadEvents();
    }
  };

  // Handle filter click
  const handleFilterClick = (type: EventType | null) => {
    setActiveFilter(type);
    
    if (type) {
      loadEventsByType(type);
    } else {
      loadEvents();
    }
  };

  // Handle event click
  const handleEventClick = (info: any) => {
    if (onEventClick) {
      onEventClick(info.event.id);
    }
  };

  // Handle date click
  const handleDateClick = (info: any) => {
    if (onDateClick) {
      onDateClick(info.date);
    }
  };

  // Filter options
  const filterOptions: { label: string; value: EventType | null }[] = [
    { label: 'All', value: null },
    { label: 'Inspections', value: 'inspection' },
    { label: 'Audits', value: 'audit' },
    { label: 'Meetings', value: 'meeting' },
    { label: 'Deadlines', value: 'deadline' },
    { label: 'Reminders', value: 'reminder' }
  ];

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Calendar</Typography>
          <Box>
            <Tooltip title="Add Event">
              <IconButton size="small" sx={{ mr: 1 }}>
                <AddIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Filter">
              <IconButton size="small" sx={{ mr: 1 }}>
                <TuneIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Refresh">
              <IconButton size="small" onClick={handleRefresh}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
        
        <Box display="flex" flexWrap="wrap" gap={1} mb={2}>
          {filterOptions.map(option => (
            <Chip
              key={option.value || 'all'}
              label={option.label}
              clickable
              color={activeFilter === option.value ? 'primary' : 'default'}
              onClick={() => handleFilterClick(option.value)}
              size="small"
            />
          ))}
        </Box>
        
        {isLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height={height}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box display="flex" flexDirection="column" alignItems="center" height={height} justifyContent="center">
            <Typography color="error" gutterBottom>
              Error loading calendar events
            </Typography>
            <Button variant="outlined" color="primary" onClick={handleRefresh}>
              Retry
            </Button>
          </Box>
        ) : (
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView={defaultView}
            events={events}
            height={height}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,dayGridWeek,dayGridDay'
            }}
            eventClick={handleEventClick}
            dateClick={handleDateClick}
            eventTimeFormat={{
              hour: '2-digit',
              minute: '2-digit',
              meridiem: false,
              hour12: false
            }}
            eventDisplay="block"
            eventBackgroundColor="#1976d2"
            eventBorderColor="#1976d2"
            eventTextColor="#ffffff"
            nowIndicator={true}
            weekends={true}
            eventContent={(eventInfo) => {
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
                    }}
                  >
                    {eventInfo.timeText && <span style={{ marginRight: '4px' }}>{eventInfo.timeText}</span>}
                    <span>{eventInfo.event.title}</span>
                  </Box>
                </Tooltip>
              );
            }}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default CalendarWidget; 