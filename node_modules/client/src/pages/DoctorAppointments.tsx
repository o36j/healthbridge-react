import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Form, InputGroup, Button, Spinner, Alert, Badge, Tabs, Tab } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaSearch, FaCalendarPlus, FaEye, FaEdit, FaTimes, FaCheck } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
}

interface Appointment {
  _id: string;
  patient: Patient;
  appointmentDate: string;
  timeSlot: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled' | 'no-show';
  reasonForVisit: string;
  notes?: string;
  isVirtual?: boolean;
  meetingLink?: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const DoctorAppointments: React.FC = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('upcoming');

  useEffect(() => {
    const fetchAppointments = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const response = await axios.get(`${API_URL}/appointments/user/${user.id}`);
        const appts = response.data.appointments;
        // Map server appointments to client model
        const mapped: Appointment[] = appts.map((appt: any) => {
          // Use the backend status directly since we've updated our interface
          const status = appt.status;

          return {
            _id: appt._id,
            patient: {
              _id: appt.patient._id,
              firstName: appt.patient.firstName,
              lastName: appt.patient.lastName
            },
            appointmentDate: appt.date?.split('T')[0] || '',
            timeSlot: appt.startTime,
            status,
            reasonForVisit: appt.reason,
            notes: appt.notes,
            isVirtual: appt.isVirtual || false,
            meetingLink: appt.meetingLink
          };
        });
        // Sort appointments
        mapped.sort((a, b) => {
          const d1 = new Date(a.appointmentDate).getTime();
          const d2 = new Date(b.appointmentDate).getTime();
          if (d1 !== d2) return d1 - d2;
          return a.timeSlot.localeCompare(b.timeSlot);
        });
        setAppointments(mapped);
        setFilteredAppointments(filterAppointmentsByTab(mapped, activeTab));
      } catch {
        setError('Failed to fetch appointments');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [user]);

  const filterAppointmentsByTab = (appointmentsList: Appointment[], tab: string): Appointment[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch (tab) {
      case 'upcoming':
        return appointmentsList.filter(app => 
          (app.status === 'pending' || app.status === 'confirmed') && new Date(app.appointmentDate) >= today
        );
      case 'today':
        return appointmentsList.filter(app => 
          new Date(app.appointmentDate).toDateString() === today.toDateString()
        );
      case 'past':
        return appointmentsList.filter(app => 
          app.status === 'completed' || app.status === 'no-show' || 
          (new Date(app.appointmentDate) < today && 
           app.status !== 'cancelled' && 
           app.status !== 'pending' && 
           app.status !== 'confirmed')
        );
      case 'cancelled':
        return appointmentsList.filter(app => app.status === 'cancelled');
      case 'all':
        return appointmentsList;
      default:
        return appointmentsList;
    }
  };

  useEffect(() => {
    // Filter by tab first
    let filtered = filterAppointmentsByTab(appointments, activeTab);
    
    // Then apply search term if any
    if (searchTerm.trim() !== '') {
      const searchTermLower = searchTerm.toLowerCase();
      filtered = filtered.filter(appointment => 
        `${appointment.patient.firstName} ${appointment.patient.lastName}`.toLowerCase().includes(searchTermLower) ||
        appointment.reasonForVisit.toLowerCase().includes(searchTermLower) ||
        appointment.appointmentDate.includes(searchTerm)
      );
    }
    
    setFilteredAppointments(filtered);
  }, [searchTerm, appointments, activeTab]);

  const handleTabChange = (tabKey: string | null) => {
    if (tabKey) {
      setActiveTab(tabKey);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'confirmed': return 'success';
      case 'completed': return 'primary';
      case 'cancelled': return 'danger';
      case 'rescheduled': return 'info';
      case 'no-show': return 'secondary';
      default: return 'secondary';
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Format time for display
  const formatTime = (timeSlot: string) => {
    const [hours, minutes] = timeSlot.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Handle appointment status change
  const handleStatusChange = (appointmentId: string, newStatus: Appointment['status']) => {
    // Make an API call to update the appointment status
    setLoading(true);
    axios.patch(`${API_URL}/appointments/status/${appointmentId}`, { status: newStatus })
      .then(() => {
        // Update local state after successful API call
        setAppointments(prevAppointments => 
          prevAppointments.map(app => 
            app._id === appointmentId 
              ? { ...app, status: newStatus } 
              : app
          )
        );
        // Also update filtered appointments
        setFilteredAppointments(prevFiltered =>
          prevFiltered.map(app =>
            app._id === appointmentId
              ? { ...app, status: newStatus }
              : app
          )
        );
      })
      .catch(err => {
        console.error("Error updating appointment status:", err);
        setError('Failed to update appointment status');
      })
      .finally(() => {
        setLoading(false);
      });
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
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h1>Appointments</h1>
          <p>View and manage your patient appointments</p>
        </Col>
      </Row>

      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Row className="mb-3">
            <Col md={6}>
              <InputGroup>
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search appointments by patient name or reason"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  title="Search appointments"
                />
              </InputGroup>
            </Col>
            <Col md={6} className="text-md-end mt-3 mt-md-0">
              <Link to="/doctor/appointments/new">
                <Button variant="primary">
                  <FaCalendarPlus className="me-2" />
                  New Appointment
                </Button>
              </Link>
            </Col>
          </Row>

          <Tabs 
            activeKey={activeTab} 
            onSelect={handleTabChange} 
            className="mb-4"
            aria-label="Appointment categories"
          >
            <Tab eventKey="upcoming" title="Upcoming">
              {renderAppointmentsTable()}
            </Tab>
            <Tab eventKey="today" title="Today">
              {renderAppointmentsTable()}
            </Tab>
            <Tab eventKey="past" title="Past">
              {renderAppointmentsTable()}
            </Tab>
            <Tab eventKey="cancelled" title="Cancelled">
              {renderAppointmentsTable()}
            </Tab>
            <Tab eventKey="all" title="All">
              {renderAppointmentsTable()}
            </Tab>
          </Tabs>
        </Card.Body>
      </Card>
    </Container>
  );

  function renderAppointmentsTable() {
    return (
      <div className="table-responsive">
        <Table hover>
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Patient</th>
              <th>Reason</th>
              <th>Status</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAppointments.length > 0 ? (
              filteredAppointments.map((appointment) => (
                <tr key={appointment._id}>
                  <td>
                    <div>{formatDate(appointment.appointmentDate)}</div>
                    <small className="text-muted">{formatTime(appointment.timeSlot)}</small>
                  </td>
                  <td>
                    <Link 
                      to={`/doctor/patient-records/${appointment.patient._id}`}
                      className="text-decoration-none"
                    >
                      {appointment.patient.firstName} {appointment.patient.lastName}
                    </Link>
                  </td>
                  <td>{appointment.reasonForVisit}</td>
                  <td>
                    <Badge bg={getStatusBadgeVariant(appointment.status)}>
                      {appointment.status}
                    </Badge>
                  </td>
                  <td className="text-end">
                    <Link to={`/doctor/appointments/${appointment._id}`}>
                      <Button variant="outline-primary" size="sm" className="me-2">
                        <FaEye className="me-1" />
                        View
                      </Button>
                    </Link>
                    
                    {appointment.status === 'pending' && (
                      <>
                        <Button 
                          variant="success" 
                          size="sm" 
                          className="me-2"
                          onClick={() => handleStatusChange(appointment._id, 'confirmed')}
                        >
                          <FaCheck className="me-1" />
                          Confirm
                        </Button>
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          onClick={() => handleStatusChange(appointment._id, 'cancelled')}
                        >
                          <FaTimes className="me-1" />
                          Reject
                        </Button>
                      </>
                    )}
                    
                    {appointment.status === 'confirmed' && (
                      <>
                        <Link to={`/doctor/appointments/${appointment._id}/reschedule`}>
                          <Button variant="outline-secondary" size="sm" className="me-2">
                            <FaEdit className="me-1" />
                            Reschedule
                          </Button>
                        </Link>
                        <Button 
                          variant="outline-success" 
                          size="sm" 
                          className="me-2"
                          onClick={() => handleStatusChange(appointment._id, 'completed')}
                        >
                          <FaCheck className="me-1" />
                          Complete
                        </Button>
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          onClick={() => handleStatusChange(appointment._id, 'cancelled')}
                        >
                          <FaTimes className="me-1" />
                          Cancel
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="text-center py-4">
                  {searchTerm 
                    ? 'No appointments found matching your search.' 
                    : 'No appointments found in this category.'}
                </td>
              </tr>
            )}
          </tbody>
        </Table>
      </div>
    );
  }
};

export default DoctorAppointments; 