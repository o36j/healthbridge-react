import { useState, useEffect } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import { format, parseISO } from 'date-fns';
import { Card, Badge, Spinner } from 'react-bootstrap';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

// Define the date-fns localizer
const localizer = {
  format: (date: Date, formatStr: string) => format(date, formatStr),
  parse: (str: string) => new Date(str),
  startOfWeek: () => new Date(),
};

// Appointment interface matching the backend model
interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePhoto?: string;
}

interface Appointment {
  _id: string;
  patient: Patient;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  reason: string;
  notes?: string;
  createdAt: string;
}

// Calendar event interface
interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  status: string;
  resource: Appointment;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface AppointmentCalendarProps {
  onSelectAppointment: (appointment: Appointment) => void;
}

const AppointmentCalendar = ({ onSelectAppointment }: AppointmentCalendarProps) => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch appointments
  useEffect(() => {
    const fetchAppointments = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError('');
        
        const response = await axios.get(`${API_URL}/appointments/user/${user.id}`);
        setAppointments(response.data.appointments);
        
        // Transform appointments to calendar events
        const calendarEvents = response.data.appointments.map((appointment: Appointment) => {
          // Parse date and time strings to create Date objects
          const appointmentDate = appointment.date.split('T')[0];
          const startDateTime = new Date(`${appointmentDate}T${appointment.startTime}:00`);
          const endDateTime = new Date(`${appointmentDate}T${appointment.endTime}:00`);
          
          return {
            id: appointment._id,
            title: `${appointment.patient.firstName} ${appointment.patient.lastName}`,
            start: startDateTime,
            end: endDateTime,
            status: appointment.status,
            resource: appointment,
          };
        });
        
        setEvents(calendarEvents);
      } catch (err) {
        console.error(err);
        setError('Failed to load appointments');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAppointments();
  }, [user]);

  // Handle event selection
  const handleEventSelect = (event: CalendarEvent) => {
    onSelectAppointment(event.resource);
  };

  // Custom event styling based on status
  const eventStyleGetter = (event: CalendarEvent) => {
    let backgroundColor = '#3174ad'; // default color
    
    switch (event.status) {
      case 'confirmed':
        backgroundColor = '#28a745'; // green
        break;
      case 'pending':
        backgroundColor = '#ffc107'; // yellow
        break;
      case 'completed':
        backgroundColor = '#6c757d'; // gray
        break;
      case 'cancelled':
        backgroundColor = '#dc3545'; // red
        break;
      case 'rescheduled':
        backgroundColor = '#17a2b8'; // teal
        break;
    }
    
    return {
      style: {
        backgroundColor,
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block',
      },
    };
  };

  return (
    <Card className="shadow-sm mb-4">
      <Card.Header className="bg-white py-3">
        <h4 className="mb-0 fw-bold">Appointment Calendar</h4>
      </Card.Header>
      <Card.Body>
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">Loading calendar...</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : (
          <div style={{ height: '600px' }}>
            <Calendar
              localizer={localizer as any}
              events={events}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              views={['month', 'week', 'day', 'agenda']}
              defaultView={Views.WEEK}
              onSelectEvent={handleEventSelect}
              eventPropGetter={eventStyleGetter}
              popup
              tooltipAccessor={(event) => `${event.title} - ${event.status}`}
            />
          </div>
        )}
      </Card.Body>
      <Card.Footer className="bg-white border-top">
        <div className="d-flex flex-wrap gap-2">
          <Badge bg="success" className="p-2">Confirmed</Badge>
          <Badge bg="warning" className="p-2">Pending</Badge>
          <Badge bg="secondary" className="p-2">Completed</Badge>
          <Badge bg="danger" className="p-2">Cancelled</Badge>
          <Badge bg="info" className="p-2">Rescheduled</Badge>
        </div>
      </Card.Footer>
    </Card>
  );
};

export default AppointmentCalendar; 