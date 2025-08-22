import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import Box from '@mui/material/Box';

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay?: boolean;
}

interface CalendarProps {
  events?: CalendarEvent[];
  initialView?: string;
  onDateClick?: (arg: any) => void;
  onEventClick?: (arg: any) => void;
}

const Calendar: React.FC<CalendarProps> = ({
  events = [],
  initialView = 'dayGridMonth',
  onDateClick,
  onEventClick,
}) => {
  return (
    <Box sx={{ width: '100%', overflowX: 'auto', backgroundColor: 'background.paper', borderRadius: 2, p: 2 }}>
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
        initialView={initialView}
        events={events}
        dateClick={onDateClick}
        eventClick={onEventClick}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek',
        }}
        height="auto"
        selectable
        editable={false}
        eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
        aria-label="Calendar"
      />
    </Box>
  );
};

export default Calendar; 