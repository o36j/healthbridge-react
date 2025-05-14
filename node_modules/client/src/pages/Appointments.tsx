import { useState, useEffect } from 'react';
import { useAuth, UserRole } from '../contexts/AuthContext';
import axios from 'axios';
import { FaCalendarPlus, FaCalendarAlt, FaFilter, FaSearch, FaTrash, FaVideo, FaExternalLinkAlt } from 'react-icons/fa';
import BookAppointmentForm from '../components/appointments/BookAppointmentForm';
import { Container, Row, Col, Card, Button, Form, Table, Badge, Spinner, Alert, InputGroup, Modal } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';

interface Doctor {
  _id: string;
  firstName: string;
  lastName: string;
  department: string;
  specialization: string;
  profilePhoto?: string;
}

interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  profilePhoto?: string;
}

interface Appointment {
  _id: string;
  patient: Patient;
  doctor: Doctor;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  reason: string;
  notes?: string;
  isVirtual?: boolean;
  meetingLink?: string;
  createdAt: string;
}

interface RescheduleData {
  date: string;
  startTime: string;
  endTime: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Appointments = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showBookForm, setShowBookForm] = useState(false);
  
  // Filtering
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  
  // State for reschedule functionality
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [rescheduleData, setRescheduleData] = useState<RescheduleData>({
    date: '',
    startTime: '',
    endTime: ''
  });
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [rescheduleError, setRescheduleError] = useState('');
  
  useEffect(() => {
    fetchAppointments();
    // Check if we're on the booking route
    if (location.pathname === '/appointments/book') {
      setShowBookForm(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, location.pathname]);
  
  const fetchAppointments = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      let url = '';
      if (user.role === UserRole.PATIENT) {
        url = `${API_URL}/appointments/user/${user.id}`;
      } else if (user.role === UserRole.DOCTOR) {
        url = `${API_URL}/appointments/user/${user.id}`;
      } else {
        // Admin or nurse can see all appointments
        url = `${API_URL}/appointments`;
      }
      
      const response = await axios.get(url);
      setAppointments(response.data.appointments);
    } catch (err) {
      setError('Failed to load appointments');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleShowBookForm = () => {
    setShowBookForm(true);
    // BookAppointmentForm will handle fetching doctors internally with appropriate permissions
  };
  
  const fetchDoctors = async () => {
    try {
      const response = await axios.get(`${API_URL}/users/public/doctors`);
      // BookAppointmentForm component handles the doctors data internally
    } catch (err) {
      console.error(err);
      if (axios.isAxiosError(err) && err.response?.status === 403) {
        setError('You do not have permission to view the list of doctors. Please contact an administrator.');
      } else {
        setError('Failed to load doctors. Please try again later.');
      }
      
      // Close the book form since we can't proceed without doctors
      setShowBookForm(false);
    }
  };
  
  const handleUpdateStatus = async (appointmentId: string, newStatus: string) => {
    try {
      setError(''); // Clear any previous errors
      const response = await axios.patch(`${API_URL}/appointments/status/${appointmentId}`, {
        status: newStatus,
      });
      
      // Update local state
      setAppointments((prevAppointments) =>
        prevAppointments.map((appointment) =>
          appointment._id === appointmentId
            ? { ...appointment, status: newStatus }
            : appointment
        )
      );
    } catch (err) {
      console.error('Error updating appointment status:', err);
      if (axios.isAxiosError(err) && err.response) {
        // Handle specific error messages from the server
        if (err.response.status === 400 && err.response.data.message) {
          setError(err.response.data.message);
        } else if (err.response.status === 403) {
          setError('You are not authorized to update this appointment');
        } else if (err.response.status === 404) {
          setError('This appointment no longer exists');
          // Refresh appointments list to remove the deleted appointment
          fetchAppointments();
        } else {
          setError('Failed to update appointment status: ' + (err.response.data.message || 'Unknown error'));
        }
      } else {
        setError('Failed to update appointment status. Please try again.');
      }
    }
  };
  
  const handleDeleteAppointment = async (appointmentId: string) => {
    if (!window.confirm('Are you sure you want to delete this appointment?')) {
      return;
    }
    
    try {
      setError(''); // Clear any previous errors
      await axios.delete(`${API_URL}/appointments/${appointmentId}`);
      
      // Update local state by removing the deleted appointment
      setAppointments((prevAppointments) =>
        prevAppointments.filter((appointment) => appointment._id !== appointmentId)
      );
    } catch (err) {
      console.error('Error deleting appointment:', err);
      if (axios.isAxiosError(err) && err.response) {
        if (err.response.status === 403) {
          setError('You are not authorized to delete this appointment');
        } else if (err.response.status === 404) {
          setError('This appointment no longer exists');
          // Refresh appointments list
          fetchAppointments();
        } else {
          setError('Failed to delete appointment: ' + (err.response.data.message || 'Unknown error'));
        }
      } else {
        setError('Failed to delete appointment. Please try again.');
      }
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  // Filter appointments based on selected filters
  const filteredAppointments = appointments.filter((appointment) => {
    // Filter by status
    if (statusFilter !== 'all' && appointment.status !== statusFilter) {
      return false;
    }
    
    // Filter by date
    if (dateFilter && new Date(appointment.date).toISOString().split('T')[0] !== dateFilter) {
      return false;
    }
    
    // Search filter
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      const doctorName = `${appointment.doctor.firstName} ${appointment.doctor.lastName}`.toLowerCase();
      const patientName = `${appointment.patient.firstName} ${appointment.patient.lastName}`.toLowerCase();
      const reason = appointment.reason.toLowerCase();
      
      return (
        doctorName.includes(searchTermLower) ||
        patientName.includes(searchTermLower) ||
        reason.includes(searchTermLower)
      );
    }
    
    return true;
  });
  
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'cancelled': return 'danger';
      case 'completed': return 'primary';
      case 'rescheduled': return 'info';
      default: return 'secondary';
    }
  };
  
  const handleBookingSuccess = () => {
    setShowBookForm(false);
    fetchAppointments();
    // Navigate back to the main appointments page
    if (location.pathname === '/appointments/book') {
      navigate('/appointments');
    }
  };

  const handleBookingCancel = () => {
    setShowBookForm(false);
    // Navigate back to the main appointments page
    if (location.pathname === '/appointments/book') {
      navigate('/appointments');
    }
  };
  
  // Function to ensure profile photo URLs are complete
  const getPhotoUrl = (photoPath?: string) => {
    if (!photoPath) return '';
    
    // If the path already includes http(s), it's a complete URL
    if (photoPath.startsWith('http://') || photoPath.startsWith('https://')) {
      return photoPath;
    }
    
    // If the path is just a filename, prepend the base API URL without the /api part
    const baseUrl = API_URL.replace('/api', '');
    
    // If the path already starts with /uploads, just prepend the base URL
    if (photoPath.startsWith('/uploads/')) {
      return `${baseUrl}${photoPath}`;
    }
    
    // Otherwise assume it's just a filename and construct the full path
    return `${baseUrl}/uploads/${photoPath}`;
  };
  
  // Open reschedule modal
  const handleOpenRescheduleModal = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setRescheduleData({
      date: new Date(appointment.date).toISOString().split('T')[0],
      startTime: appointment.startTime,
      endTime: appointment.endTime
    });
    setShowRescheduleModal(true);
    setRescheduleError('');
  };
  
  // Close reschedule modal
  const handleCloseRescheduleModal = () => {
    setShowRescheduleModal(false);
    setSelectedAppointment(null);
    setRescheduleError('');
  };
  
  // Handle reschedule form input changes
  const handleRescheduleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRescheduleData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Submit reschedule form
  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAppointment) return;
    
    try {
      setRescheduleLoading(true);
      setRescheduleError('');
      
      // Basic validation
      if (!rescheduleData.date || !rescheduleData.startTime || !rescheduleData.endTime) {
        setRescheduleError('All fields are required');
        setRescheduleLoading(false);
        return;
      }
      
      // Check if end time is after start time
      if (rescheduleData.startTime >= rescheduleData.endTime) {
        setRescheduleError('End time must be after start time');
        setRescheduleLoading(false);
        return;
      }
      
      // Call API to update appointment with new date and time
      await axios.patch(`${API_URL}/appointments/${selectedAppointment._id}`, {
        date: rescheduleData.date,
        startTime: rescheduleData.startTime,
        endTime: rescheduleData.endTime,
      });
      
      // Update local state
      setAppointments(prev => 
        prev.map(appt => 
          appt._id === selectedAppointment._id 
            ? { 
                ...appt, 
                date: rescheduleData.date,
                startTime: rescheduleData.startTime,
                endTime: rescheduleData.endTime,
                status: 'rescheduled' 
              } 
            : appt
        )
      );
      
      setError('Appointment rescheduled successfully');
      setTimeout(() => setError(''), 3000);
      
      // Close modal
      handleCloseRescheduleModal();
    } catch (err) {
      console.error(err);
      if (axios.isAxiosError(err) && err.response) {
        setRescheduleError(err.response.data.message || 'Failed to reschedule appointment');
      } else {
        setRescheduleError('Failed to reschedule appointment');
      }
      setRescheduleLoading(false);
    }
  };
  
  // Function to copy meeting link to clipboard
  const copyMeetingLink = (link: string) => {
    navigator.clipboard.writeText(link)
      .then(() => {
        // You could show a temp success message here
        alert('Meeting link copied to clipboard');
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
      });
  };

  // Join telehealth meeting
  const joinMeeting = (link: string) => {
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  // Check if an appointment is upcoming (within 15 minutes of start time)
  const isUpcomingAppointment = (appointment: Appointment) => {
    if (appointment.status !== 'confirmed') return false;
    
    const appointmentDate = new Date(appointment.date);
    const now = new Date();
    
    // Same day check
    if (appointmentDate.toDateString() !== now.toDateString()) return false;
    
    // Parse time strings (assumes format like "14:30")
    const [hours, minutes] = appointment.startTime.split(':').map(Number);
    
    // Set appointment time
    const appointmentTime = new Date(appointmentDate);
    appointmentTime.setHours(hours, minutes, 0, 0);
    
    // Calculate time difference in minutes
    const diffMs = appointmentTime.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    // Return true if appointment is within 15 minutes before or 30 minutes after start time
    return diffMins >= -30 && diffMins <= 15;
  };
  
  return (
    <Container className="py-4">
      {/* Header */}
      <Row className="mb-4 align-items-center">
        <Col>
          <h1 className="display-6 mb-0">Appointments</h1>
          <p className="text-muted mb-0">Manage your scheduled appointments</p>
        </Col>
        <Col xs="auto">
          {user?.role === UserRole.PATIENT && (
            <Button variant="primary" onClick={handleShowBookForm} className="d-flex align-items-center">
              <FaCalendarPlus className="me-2" /> Book Appointment
            </Button>
          )}
        </Col>
      </Row>
      
      {/* Error message */}
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}
      
      {/* Book Appointment Form Modal */}
      {showBookForm && (
        <Card className="mb-4 border-0 shadow-sm">
          <Card.Body>
            <BookAppointmentForm
              onSuccess={handleBookingSuccess}
              onCancel={handleBookingCancel}
            />
          </Card.Body>
        </Card>
      )}
      
      {/* Filters */}
      <Card className="mb-4 shadow-sm">
        <Card.Body>
          <Row className="g-3">
            <Col md={3}>
              <Form.Group>
                <Form.Label className="d-flex align-items-center">
                  <FaFilter className="text-primary me-2" /> Status
                </Form.Label>
                <Form.Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="form-select-sm"
                  aria-label="Filter appointments by status"
                  title="Filter by status"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="rescheduled">Rescheduled</option>
                </Form.Select>
              </Form.Group>
            </Col>
            
            <Col md={3}>
              <Form.Group>
                <Form.Label className="d-flex align-items-center">
                  <FaCalendarAlt className="text-primary me-2" /> Date
                </Form.Label>
                <Form.Control
                  type="date"
                  size="sm"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                />
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group>
                <Form.Label className="d-flex align-items-center">
                  <FaSearch className="text-primary me-2" /> Search
                </Form.Label>
                <InputGroup size="sm">
                  <Form.Control
                    placeholder="Search by name or reason..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  {searchTerm && (
                    <Button 
                      variant="outline-secondary" 
                      onClick={() => setSearchTerm('')}
                    >
                      Clear
                    </Button>
                  )}
                </InputGroup>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>
      
      {/* Appointments List */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2 text-muted">Loading appointments...</p>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <Card className="text-center p-5 shadow-sm">
          <Card.Body>
            <FaCalendarAlt className="display-1 text-muted mb-3" />
            <h3>No appointments found</h3>
            <p className="text-muted">
              {statusFilter !== 'all' || dateFilter || searchTerm
                ? 'Try changing your filters'
                : 'Book an appointment to get started'}
            </p>
            {user?.role === UserRole.PATIENT && !showBookForm && (
              <Button variant="primary" onClick={handleShowBookForm} className="mt-3">
                Book Appointment
              </Button>
            )}
          </Card.Body>
        </Card>
      ) : (
        <Card className="shadow-sm">
          <Card.Body className="p-0">
            <div className="table-responsive">
              <Table hover className="mb-0">
                <thead className="bg-light">
                  <tr>
                    {(user?.role === UserRole.ADMIN || user?.role === UserRole.NURSE) && (
                      <th>Patient</th>
                    )}
                    {(user?.role === UserRole.ADMIN || user?.role === UserRole.NURSE || user?.role === UserRole.PATIENT) && (
                      <th>Doctor</th>
                    )}
                    <th>Date & Time</th>
                    <th>Reason</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map((appointment) => (
                    <tr key={appointment._id}>
                      {(user?.role === UserRole.ADMIN || user?.role === UserRole.NURSE) && (
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="flex-shrink-0">
                              {appointment.patient && appointment.patient.profilePhoto ? (
                                <img
                                  className="rounded-circle"
                                  src={getPhotoUrl(appointment.patient.profilePhoto)}
                                  alt="Patient"
                                  width="40"
                                  height="40"
                                />
                              ) : (
                                <div className="rounded-circle bg-light d-flex align-items-center justify-content-center text-secondary" style={{ width: 40, height: 40 }}>
                                  {appointment.patient && appointment.patient.firstName ? appointment.patient.firstName.charAt(0) : '?'}
                                  {appointment.patient && appointment.patient.lastName ? appointment.patient.lastName.charAt(0) : ''}
                                </div>
                              )}
                            </div>
                            <div className="ms-3">
                              <div className="fw-medium">
                                {appointment.patient ? `${appointment.patient.firstName} ${appointment.patient.lastName}` : 'Unknown Patient'}
                              </div>
                            </div>
                          </div>
                        </td>
                      )}
                      
                      {(user?.role === UserRole.ADMIN || user?.role === UserRole.NURSE || user?.role === UserRole.PATIENT) && (
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="flex-shrink-0">
                              {appointment.doctor && appointment.doctor.profilePhoto ? (
                                <img
                                  className="rounded-circle"
                                  src={getPhotoUrl(appointment.doctor.profilePhoto)}
                                  alt="Doctor"
                                  width="40"
                                  height="40"
                                />
                              ) : (
                                <div className="rounded-circle bg-light d-flex align-items-center justify-content-center text-secondary" style={{ width: 40, height: 40 }}>
                                  {appointment.doctor && appointment.doctor.firstName ? appointment.doctor.firstName.charAt(0) : '?'}
                                  {appointment.doctor && appointment.doctor.lastName ? appointment.doctor.lastName.charAt(0) : ''}
                                </div>
                              )}
                            </div>
                            <div className="ms-3">
                              <div className="fw-medium">
                                {appointment.doctor ? `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}` : 'Unknown Doctor'}
                              </div>
                              <div className="text-muted small">
                                {appointment.doctor ? appointment.doctor.specialization : ''}
                              </div>
                            </div>
                          </div>
                        </td>
                      )}
                      
                      <td>
                        <div>{formatDate(appointment.date)}</div>
                        <div className="text-muted small">
                          {appointment.startTime} - {appointment.endTime}
                        </div>
                        {appointment.isVirtual && (
                          <div className="mt-1">
                            <Badge bg="info" className="d-flex align-items-center" style={{ width: 'fit-content' }}>
                              <FaVideo className="me-1" /> Telehealth
                              {appointment.status === 'confirmed' && !appointment.meetingLink && user?.role === UserRole.DOCTOR && (
                                <span className="ms-2 badge bg-warning text-dark" style={{ fontSize: '0.65rem' }}>
                                  Needs Meeting Link
                                </span>
                              )}
                            </Badge>
                          </div>
                        )}
                      </td>
                      
                      <td>
                        <div className="text-truncate" style={{ maxWidth: '200px' }}>
                          {appointment.reason}
                        </div>
                      </td>
                      
                      <td>
                        <Badge bg={getStatusBadgeVariant(appointment.status)} pill>
                          {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                        </Badge>
                      </td>
                      
                      <td className="text-end">
                        <div className="d-flex justify-content-end gap-2">
                          {/* Telehealth meeting link for confirmed virtual appointments */}
                          {appointment.isVirtual && 
                           appointment.status === 'confirmed' && 
                           appointment.meetingLink && (
                             <>
                               {isUpcomingAppointment(appointment) ? (
                                 <Button
                                   size="sm"
                                   variant="success"
                                   onClick={() => joinMeeting(appointment.meetingLink!)}
                                   title="Join telehealth meeting"
                                 >
                                   <FaVideo className="me-1" /> Join
                                 </Button>
                               ) : (
                                 <Button
                                   size="sm"
                                   variant="outline-info"
                                   onClick={() => copyMeetingLink(appointment.meetingLink!)}
                                   title="Copy meeting link"
                                 >
                                   <FaExternalLinkAlt className="me-1" /> Link
                                 </Button>
                               )}
                             </>
                           )}
                          
                          {/* Different actions based on role and appointment status */}
                          {user?.role === UserRole.DOCTOR && appointment.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="success"
                                onClick={() => handleUpdateStatus(appointment._id, 'confirmed')}
                                title="Accept appointment"
                              >
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                variant="outline-danger"
                                onClick={() => handleUpdateStatus(appointment._id, 'cancelled')}
                                title="Reject appointment"
                                className="ms-2"
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          
                          {user?.role === UserRole.DOCTOR && appointment.status === 'confirmed' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline-primary"
                                onClick={() => handleOpenRescheduleModal(appointment)}
                                title="Reschedule appointment"
                                className="me-2"
                              >
                                <FaCalendarAlt />
                              </Button>
                              <Button
                                size="sm"
                                variant="info"
                                onClick={() => handleUpdateStatus(appointment._id, 'completed')}
                                title="Mark as completed"
                                disabled={new Date(appointment.date) > new Date()}
                              >
                                Complete
                              </Button>
                            </>
                          )}
                          
                          {user?.role === UserRole.PATIENT && appointment.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline-danger"
                              onClick={() => handleUpdateStatus(appointment._id, 'cancelled')}
                            >
                              Cancel
                            </Button>
                          )}
                          
                          {(user?.role === UserRole.ADMIN || user?.role === UserRole.NURSE) && (
                            <div className="d-flex align-items-center gap-2">
                              <Form.Select
                                size="sm"
                                style={{ width: 'auto' }}
                                value={appointment.status}
                                onChange={(e) => handleUpdateStatus(appointment._id, e.target.value)}
                                aria-label="Update appointment status"
                                title="Update appointment status"
                              >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="cancelled">Cancelled</option>
                                <option value="completed">Completed</option>
                                <option value="rescheduled">Rescheduled</option>
                              </Form.Select>
                              
                              {user?.role === UserRole.ADMIN && (
                                <Button
                                  size="sm"
                                  variant="outline-danger"
                                  onClick={() => handleDeleteAppointment(appointment._id)}
                                  title="Delete appointment"
                                  className="ms-1"
                                >
                                  <FaTrash />
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      )}
      
      {/* Reschedule Modal */}
      <Modal show={showRescheduleModal} onHide={handleCloseRescheduleModal}>
        <Modal.Header closeButton>
          <Modal.Title>Reschedule Appointment</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {rescheduleError && <Alert variant="danger">{rescheduleError}</Alert>}
          
          <Form onSubmit={handleRescheduleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>New Date</Form.Label>
              <Form.Control 
                type="date" 
                name="date"
                value={rescheduleData.date}
                onChange={handleRescheduleInputChange}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>New Start Time</Form.Label>
              <Form.Control 
                type="time" 
                name="startTime"
                value={rescheduleData.startTime}
                onChange={handleRescheduleInputChange}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>New End Time</Form.Label>
              <Form.Control 
                type="time" 
                name="endTime"
                value={rescheduleData.endTime}
                onChange={handleRescheduleInputChange}
                required
              />
            </Form.Group>
            
            <div className="d-flex justify-content-end gap-2">
              <Button variant="secondary" onClick={handleCloseRescheduleModal}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={rescheduleLoading}>
                {rescheduleLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default Appointments; 