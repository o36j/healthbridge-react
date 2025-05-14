import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Badge, Button, Spinner, Alert, Modal, Form } from 'react-bootstrap';
import { FaCalendarAlt, FaClock, FaUser, FaNotesMedical, FaArrowLeft, FaEdit, FaCheck, FaTimes, FaPrescriptionBottleAlt, FaVideo, FaCopy, FaExternalLinkAlt, FaLink } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

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
  appointmentDate: string;
  date: string;
  startTime: string;
  endTime: string;
  timeSlot: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show' | 'rescheduled' | 'confirmed';
  reasonForVisit: string;
  reason: string;
  notes?: string;
  isVirtual?: boolean;
  meetingLink?: string;
  createdAt: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const DoctorAppointmentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showVideoCall, setShowVideoCall] = useState<boolean>(false);
  
  // State for meeting link form
  const [showMeetingLinkForm, setShowMeetingLinkForm] = useState<boolean>(false);
  const [meetingLink, setMeetingLink] = useState<string>('');
  const [meetingLinkError, setMeetingLinkError] = useState<string>('');
  const [submittingLink, setSubmittingLink] = useState<boolean>(false);

  useEffect(() => {
    const fetchAppointment = async () => {
      if (!user || !id) return;
      
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/appointments/${id}`);
        
        // Map the appointment data to our interface
        const appt = response.data.appointment;
        setAppointment({
          ...appt,
          appointmentDate: appt.date?.split('T')[0] || '',
          timeSlot: appt.startTime,
          reasonForVisit: appt.reason,
        });
      } catch (err) {
        console.error('Error fetching appointment:', err);
        setError('Failed to load appointment details.');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointment();
  }, [id, user]);

  const handleStatusChange = async (newStatus: Appointment['status']) => {
    if (!appointment || !user) return;
    
    try {
      setLoading(true);
      await axios.patch(`${API_URL}/appointments/status/${appointment._id}`, {
        status: newStatus
      });
      
      // Update the appointment in the state
      setAppointment(prev => prev ? { ...prev, status: newStatus } : null);
      
    } catch (err) {
      console.error('Error updating appointment status:', err);
      setError('Failed to update appointment status.');
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Format time for display
  const formatTime = (timeSlot: string) => {
    const [hours, minutes] = timeSlot.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'scheduled': return 'primary';
      case 'completed': return 'success';
      case 'cancelled': return 'danger';
      case 'no-show': return 'warning';
      case 'rescheduled': return 'info';
      case 'confirmed': return 'success';
      default: return 'secondary';
    }
  };

  // Copy meeting link to clipboard
  const copyMeetingLink = () => {
    if (!appointment?.meetingLink) return;
    
    navigator.clipboard.writeText(appointment.meetingLink)
      .then(() => {
        alert('Meeting link copied to clipboard');
      })
      .catch(err => {
        console.error('Failed to copy:', err);
        // Fallback for browsers that don't support clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = appointment.meetingLink!;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Meeting link copied to clipboard');
      });
  };

  // Open meeting in new tab
  const openMeetingLink = () => {
    if (!appointment?.meetingLink) return;
    window.open(appointment.meetingLink, '_blank', 'noopener,noreferrer');
  };

  // Check if this is an upcoming appointment (within 15 minutes before or after start)
  const isUpcomingAppointment = () => {
    if (!appointment || appointment.status !== 'scheduled') return false;
    
    const appointmentDate = new Date(appointment.date);
    const now = new Date();
    
    // Same day check
    if (appointmentDate.toDateString() !== now.toDateString()) return false;
    
    // Parse time
    const [hours, minutes] = appointment.startTime.split(':').map(Number);
    
    // Set appointment time
    const appointmentTime = new Date(appointmentDate);
    appointmentTime.setHours(hours, minutes, 0, 0);
    
    // Calculate difference in minutes
    const diffMs = appointmentTime.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    // Return true if within window
    return diffMins >= -30 && diffMins <= 15;
  };

  // Submit meeting link
  const handleMeetingLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!meetingLink.trim()) {
      setMeetingLinkError('Please enter a valid meeting link');
      return;
    }
    
    // Simple URL validation
    if (!meetingLink.startsWith('http://') && !meetingLink.startsWith('https://')) {
      setMeetingLinkError('Please enter a valid URL starting with http:// or https://');
      return;
    }
    
    try {
      setSubmittingLink(true);
      setMeetingLinkError('');
      
      await axios.patch(`${API_URL}/appointments/meeting-link/${id}`, {
        meetingLink
      });
      
      // Update appointment in state
      setAppointment(prev => prev ? { ...prev, meetingLink } : null);
      
      // Close form
      setShowMeetingLinkForm(false);
      
    } catch (err) {
      console.error('Error updating meeting link:', err);
      setMeetingLinkError('Failed to update meeting link. Please try again.');
    } finally {
      setSubmittingLink(false);
    }
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

  if (!appointment) {
    return (
      <Container className="my-5">
        <Alert variant="warning">Appointment not found.</Alert>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row className="mb-4 align-items-center">
        <Col>
          <Link to="/doctor/appointments" className="btn btn-sm btn-outline-secondary mb-3">
            <FaArrowLeft className="me-2" />
            Back to Appointments
          </Link>
          <h2 className="mb-1">Appointment Details</h2>
          <div className="d-flex align-items-center">
            <Badge bg={getStatusBadgeVariant(appointment.status)} className="me-2">
              {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
            </Badge>
            {appointment.isVirtual && (
              <Badge bg="info">
                <FaVideo className="me-1" />
                Telehealth
              </Badge>
            )}
          </div>
        </Col>
        
        {appointment.isVirtual && appointment.status === 'confirmed' && (
          <Col xs="auto">
            <div className="d-flex gap-2">
              {appointment.meetingLink ? (
                <>
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={copyMeetingLink}
                    title="Copy meeting link"
                  >
                    <FaCopy className="me-1" />
                    Copy Link
                  </Button>
                  
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={openMeetingLink}
                    title="Open meeting in new tab"
                  >
                    <FaExternalLinkAlt className="me-1" />
                    Open Link
                  </Button>
                  
                  <Button 
                    variant="outline-secondary" 
                    size="sm"
                    onClick={() => {
                      setMeetingLink(appointment.meetingLink || '');
                      setShowMeetingLinkForm(true);
                    }}
                    title="Edit meeting link"
                  >
                    <FaEdit className="me-1" />
                    Edit Link
                  </Button>
                  
                  {isUpcomingAppointment() && (
                    <Button 
                      variant="success" 
                      size="sm"
                      onClick={() => setShowVideoCall(true)}
                      title="Start video call"
                    >
                      <FaVideo className="me-1" />
                      Start Video Call
                    </Button>
                  )}
                </>
              ) : (
                <Button 
                  variant="primary" 
                  size="sm"
                  onClick={() => setShowMeetingLinkForm(true)}
                  title="Add meeting link"
                >
                  <FaLink className="me-1" />
                  Add Meeting Link
                </Button>
              )}
            </div>
          </Col>
        )}
      </Row>

      <Card className="shadow-sm border-0 mb-4">
        <Card.Body className="p-4">
          <Row className="mb-4">
            <Col md={6} className="mb-3 mb-md-0">
              <Card className="h-100 border-0 bg-light">
                <Card.Body>
                  <h5 className="card-title mb-3">
                    <FaUser className="text-primary me-2" />
                    Patient Information
                  </h5>
                  <p className="mb-1">
                    <strong>Name:</strong> {appointment.patient.firstName} {appointment.patient.lastName}
                  </p>
                  <p className="mb-1">
                    <strong>Email:</strong> {appointment.patient.email}
                  </p>
                  <Link to={`/doctor/patient-records/${appointment.patient._id}`} className="btn btn-sm btn-outline-primary mt-3">
                    View Patient Record
                  </Link>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={6}>
              <Card className="h-100 border-0 bg-light">
                <Card.Body>
                  <h5 className="card-title mb-3">
                    <FaCalendarAlt className="text-primary me-2" />
                    Appointment Details
                  </h5>
                  <p className="mb-1">
                    <strong>Date:</strong> {formatDate(appointment.appointmentDate)}
                  </p>
                  <p className="mb-1">
                    <strong>Time:</strong> <FaClock className="text-muted me-1" /> 
                    {formatTime(appointment.startTime)} - {formatTime(appointment.endTime || appointment.timeSlot)}
                  </p>
                  <p className="mb-1">
                    <strong>Status:</strong> {appointment.status}
                  </p>
                  {appointment.isVirtual && (
                    <p className="mb-1">
                      <strong>Type:</strong> <FaVideo className="text-info me-1" /> Virtual Appointment
                    </p>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          <Card className="border-0 bg-light mb-4">
            <Card.Body>
              <h5 className="card-title mb-3">
                <FaNotesMedical className="text-primary me-2" />
                Reason for Visit
              </h5>
              <p className="mb-0">{appointment.reasonForVisit || appointment.reason}</p>
            </Card.Body>
          </Card>
          
          {appointment.notes && (
            <Card className="border-0 bg-light mb-4">
              <Card.Body>
                <h5 className="card-title mb-3">
                  <FaNotesMedical className="text-primary me-2" />
                  Notes
                </h5>
                <p className="mb-0">{appointment.notes}</p>
              </Card.Body>
            </Card>
          )}
          
          {appointment.status === 'scheduled' && (
            <Row className="mt-4">
              <Col>
                <div className="d-flex gap-2 justify-content-end">
                  <Link to={`/doctor/appointments/${appointment._id}/reschedule`}>
                    <Button variant="primary">
                      <FaEdit className="me-2" />
                      Reschedule Appointment
                    </Button>
                  </Link>
                  
                  <Button 
                    variant="success" 
                    onClick={() => handleStatusChange('completed')}
                  >
                    <FaCheck className="me-2" />
                    Mark Completed
                  </Button>
                  
                  <Button 
                    variant="danger" 
                    onClick={() => handleStatusChange('cancelled')}
                  >
                    <FaTimes className="me-2" />
                    Cancel Appointment
                  </Button>
                </div>
              </Col>
            </Row>
          )}
        </Card.Body>
      </Card>
      
      {/* Meeting Link Form Modal */}
      <Modal 
        show={showMeetingLinkForm} 
        onHide={() => setShowMeetingLinkForm(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {appointment.meetingLink ? 'Update Meeting Link' : 'Add Meeting Link'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {meetingLinkError && (
            <Alert variant="danger">{meetingLinkError}</Alert>
          )}
          
          <Form onSubmit={handleMeetingLinkSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Video Meeting Link</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={meetingLink}
                onChange={e => setMeetingLink(e.target.value)}
                placeholder="Enter your video meeting link (e.g., https://zoom.us/j/1234567890)"
                disabled={submittingLink}
              />
              <Form.Text className="text-muted">
                Provide the complete URL for the patient to join the telehealth appointment.
              </Form.Text>
            </Form.Group>
            
            <div className="d-flex justify-content-end gap-2">
              <Button 
                variant="secondary" 
                onClick={() => setShowMeetingLinkForm(false)}
                disabled={submittingLink}
              >
                Cancel
              </Button>
              <Button 
                variant="primary" 
                type="submit"
                disabled={submittingLink}
              >
                {submittingLink ? (
                  <>
                    <Spinner size="sm" animation="border" className="me-1" />
                    Saving...
                  </>
                ) : (
                  'Save Meeting Link'
                )}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>
      
      {/* Video Call Modal */}
      <Modal 
        show={showVideoCall} 
        onHide={() => setShowVideoCall(false)}
        fullscreen
        dialogClassName="video-call-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Telehealth Call with {appointment.patient.firstName} {appointment.patient.lastName}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-0">
          {appointment.meetingLink ? (
            <iframe 
              src={appointment.meetingLink}
              style={{ width: "100%", height: "calc(100vh - 60px)", border: "none" }}
              allow="camera; microphone; fullscreen; display-capture; autoplay"
              title="Telehealth video call"
            />
          ) : (
            <div className="text-center p-5">
              <Alert variant="warning">
                <h4>Meeting link not available</h4>
                <p>Please add a meeting link for this telehealth appointment first.</p>
              </Alert>
            </div>
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default DoctorAppointmentDetail; 