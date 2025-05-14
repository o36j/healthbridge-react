import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner, Alert, Button, Modal, Form } from 'react-bootstrap';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Link } from 'react-router-dom';
import { FaCalendarPlus, FaEye, FaTrash, FaEdit, FaInfoCircle } from 'react-icons/fa';
import { useTheme } from '../contexts/ThemeContext';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const localizer = momentLocalizer(moment);
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Appointment {
  _id: string;
  title: string;
  start: Date;
  end: Date;
  patientId: string;
  patientName: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  reason?: string;
  color?: string;
}

const DoctorCalendar: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showAppointmentDetails, setShowAppointmentDetails] = useState(false);
  const { theme } = useTheme();
  const { user } = useAuth();

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/appointments/user/${user.id}`);
      
      if (response.data && response.data.appointments) {
        const formattedAppointments = response.data.appointments.map((appt: any) => {
          // Parse the date strings into Date objects
          const startDate = new Date(appt.date);
          const [startHours, startMinutes] = appt.startTime.split(':').map(Number);
          startDate.setHours(startHours, startMinutes, 0);
          
          const endDate = new Date(startDate);
          // Assuming appointments are 30 minutes by default if no endTime
          if (appt.endTime) {
            const [endHours, endMinutes] = appt.endTime.split(':').map(Number);
            endDate.setHours(endHours, endMinutes, 0);
          } else {
            endDate.setMinutes(endDate.getMinutes() + 30);
          }
          
          // Determine color based on status
          const statusColors = {
            pending: '#f59e0b', // amber
            confirmed: '#10b981', // green
            completed: '#3b82f6', // blue
            cancelled: '#ef4444'  // red
          };
          
          const patientName = appt.patient ? 
            `${appt.patient.firstName} ${appt.patient.lastName}` : 
            'Unknown Patient';
            
          return {
            _id: appt._id,
            title: `${patientName} - ${appt.reason || 'Appointment'}`,
            start: startDate,
            end: endDate,
            patientId: appt.patient?._id || '',
            patientName,
            status: appt.status,
            reason: appt.reason,
            color: statusColors[appt.status as keyof typeof statusColors]
          };
        });
        
        setAppointments(formattedAppointments);
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError('Failed to fetch appointments. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowAppointmentDetails(true);
  };

  const getStatusBadgeColor = (status: string) => {
    switch(status) {
      case 'pending': return 'warning';
      case 'confirmed': return 'success';
      case 'completed': return 'primary';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  };

  // Custom event styling for the calendar
  const eventStyleGetter = (event: Appointment) => {
    return {
      style: {
        backgroundColor: event.color,
        borderRadius: '5px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block',
        fontWeight: 'bold'
      }
    };
  };

  if (loading) {
    return (
      <Container className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <div className="d-flex flex-wrap justify-content-between align-items-center">
            <div>
              <h2 className="fw-bold">Appointment Calendar</h2>
              <p className="text-muted">View and manage all your scheduled appointments</p>
            </div>
            <Link to="/doctor/appointments/new">
              <Button variant="primary" className="d-flex align-items-center">
                <FaCalendarPlus className="me-2" /> New Appointment
              </Button>
            </Link>
          </div>
        </Col>
      </Row>
      
      <Card className="shadow-sm border-0 mb-4">
        <Card.Body className="p-0 p-md-3">
          <div style={{ height: '600px' }} className={theme === 'dark' ? 'calendar-dark-mode' : ''}>
            <Calendar
              localizer={localizer}
              events={appointments}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%' }}
              views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
              defaultView={Views.WEEK}
              eventPropGetter={eventStyleGetter}
              onSelectEvent={handleSelectAppointment}
              step={30}
              timeslots={2}
              toolbar={true}
            />
          </div>
        </Card.Body>
      </Card>

      {/* Appointment Details Modal */}
      <Modal 
        show={showAppointmentDetails} 
        onHide={() => setShowAppointmentDetails(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Appointment Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedAppointment && (
            <div>
              <p className="mb-2">
                <strong>Patient:</strong> {selectedAppointment.patientName}
              </p>
              <p className="mb-2">
                <strong>Date:</strong> {moment(selectedAppointment.start).format('MMMM D, YYYY')}
              </p>
              <p className="mb-2">
                <strong>Time:</strong> {moment(selectedAppointment.start).format('h:mm A')} - {moment(selectedAppointment.end).format('h:mm A')}
              </p>
              <p className="mb-2">
                <strong>Status:</strong> <span className={`badge bg-${getStatusBadgeColor(selectedAppointment.status)}`}>{selectedAppointment.status.charAt(0).toUpperCase() + selectedAppointment.status.slice(1)}</span>
              </p>
              <p className="mb-2">
                <strong>Reason:</strong> {selectedAppointment.reason || 'N/A'}
              </p>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          {selectedAppointment && selectedAppointment.status !== 'cancelled' && (
            <>
              <Link to={`/doctor/appointments/${selectedAppointment._id}`}>
                <Button variant="outline-primary" size="sm" className="me-2">
                  <FaEye className="me-1" /> View Details
                </Button>
              </Link>
              {selectedAppointment.status !== 'completed' && (
                <Link to={`/doctor/appointments/${selectedAppointment._id}/reschedule`}>
                  <Button variant="outline-warning" size="sm">
                    <FaEdit className="me-1" /> Reschedule
                  </Button>
                </Link>
              )}
            </>
          )}
          <Button variant="secondary" size="sm" onClick={() => setShowAppointmentDetails(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default DoctorCalendar; 