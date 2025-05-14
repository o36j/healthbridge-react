import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { FaCalendarAlt, FaClock, FaArrowLeft, FaSave } from 'react-icons/fa';
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
  doctor: string | { _id: string };
  date: string;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  reason: string;
  reasonForVisit: string;
  notes?: string;
  status: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const DoctorAppointmentReschedule: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  
  const [form, setForm] = useState({
    date: '',
    startTime: '',
    endTime: '',
    notes: ''
  });
  
  // Fetch appointment details
  useEffect(() => {
    const fetchAppointment = async () => {
      if (!user || !id) return;
      
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/appointments/${id}`);
        
        // Map the appointment data
        const appt = response.data.appointment;
        setAppointment({
          ...appt,
          appointmentDate: appt.date?.split('T')[0] || '',
          reasonForVisit: appt.reason
        });
        
        // Initialize the form with existing data
        setForm({
          date: appt.date?.split('T')[0] || '',
          startTime: appt.startTime || '',
          endTime: appt.endTime || '',
          notes: appt.notes || ''
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
  
  // Fetch available time slots
  const fetchAvailableSlots = useCallback(async () => {
    if (!appointment || !form.date) return;
    
    try {
      setLoading(true);
      // Extract doctor ID correctly regardless of whether it's a string or object
      const doctorId = typeof appointment.doctor === 'string' 
        ? appointment.doctor 
        : appointment.doctor._id;
        
      const response = await axios.get(
        `${API_URL}/appointments/available-slots?doctor=${doctorId}&date=${form.date}`
      );
      
      setAvailableSlots(response.data.availableSlots || []);
      
      // If current appointment is on the same day, add its time slot to available options
      if (form.date === appointment.appointmentDate) {
        setAvailableSlots(prev => {
          if (!prev.includes(appointment.startTime)) {
            return [...prev, appointment.startTime].sort();
          }
          return prev;
        });
      }
    } catch (err) {
      console.error('Error fetching available slots:', err);
      setError('Failed to load available time slots.');
    } finally {
      setLoading(false);
    }
  }, [appointment, form.date]);
  
  useEffect(() => {
    if (appointment && form.date) {
      fetchAvailableSlots();
    }
  }, [appointment, form.date, fetchAvailableSlots]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Reset startTime when date changes
    if (name === 'date') {
      setForm(prev => ({
        ...prev,
        startTime: '',
        endTime: ''
      }));
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !appointment) return;
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Calculate endTime based on startTime (assuming 30 min increments)
      const startTimeIndex = availableSlots.indexOf(form.startTime);
      const endTime = availableSlots[startTimeIndex + 1] || '';
      
      if (!endTime) {
        setError('Invalid time slot selected');
        setSubmitting(false);
        return;
      }
      
      // Extract doctor ID correctly if needed
      const doctorId = typeof appointment.doctor === 'string'
        ? appointment.doctor
        : appointment.doctor._id;
      
      const appointmentData = {
        doctorId: doctorId,
        date: form.date,
        startTime: form.startTime,
        endTime,
        notes: form.notes,
      };
      
      await axios.put(`${API_URL}/appointments/${id}`, appointmentData);
      
      // Navigate back to appointment details
      navigate(`/doctor/appointments/${id}`);
    } catch (err) {
      console.error('Error rescheduling appointment:', err);
      setError('Failed to reschedule appointment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };
  
  if (loading && !appointment) {
    return (
      <Container className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }
  
  if (error && !appointment) {
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
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <Link to={`/doctor/appointments/${id}`} className="btn btn-outline-primary mb-3">
            <FaArrowLeft className="me-2" />
            Back to Appointment
          </Link>
          <h1>Reschedule Appointment</h1>
          <p className="text-muted">
            Patient: {appointment.patient.firstName} {appointment.patient.lastName}
          </p>
        </Col>
      </Row>

      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-white py-3">
          <h4 className="mb-0">
            <FaCalendarAlt className="me-2 text-primary" />
            Current Appointment: {formatDate(appointment.appointmentDate)} at {appointment.startTime}
          </h4>
        </Card.Header>
        
        <Card.Body className="p-4">
          {error && (
            <Alert variant="danger" className="mb-4">
              {error}
            </Alert>
          )}
          
          <Form onSubmit={handleSubmit}>
            <Row className="mb-4">
              <Col md={6}>
                <Form.Group controlId="appointmentDate">
                  <Form.Label className="fw-medium d-flex align-items-center">
                    <FaCalendarAlt className="text-primary me-2" />
                    New Appointment Date
                  </Form.Label>
                  <Form.Control
                    type="date"
                    name="date"
                    value={form.date}
                    onChange={handleInputChange}
                    min={new Date().toISOString().split('T')[0]}
                    required
                    disabled={submitting}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            {/* Available Time Slots */}
            {form.date && (
              <Form.Group className="mb-4">
                <Form.Label className="fw-medium d-flex align-items-center">
                  <FaClock className="text-primary me-2" />
                  Available Time Slots
                </Form.Label>
                {loading ? (
                  <div className="text-center py-3">
                    <Spinner animation="border" variant="primary" size="sm" />
                    <span className="ms-2">Loading available slots...</span>
                  </div>
                ) : availableSlots.length > 0 ? (
                  <div className="time-slots">
                    <Row className="g-2">
                      {availableSlots.map((slot, index) => (
                        <Col xs={6} sm={4} md={3} lg={2} key={slot}>
                          {index < availableSlots.length - 1 && (
                            <Button
                              variant={form.startTime === slot ? "primary" : "outline-secondary"}
                              className="w-100"
                              onClick={() => {
                                setForm(prev => ({
                                  ...prev,
                                  startTime: slot,
                                  endTime: availableSlots[index + 1]
                                }));
                              }}
                              disabled={submitting}
                            >
                              {slot}
                            </Button>
                          )}
                        </Col>
                      ))}
                    </Row>
                  </div>
                ) : (
                  <Alert variant="warning">
                    No available slots for the selected date. Please try another date.
                  </Alert>
                )}
              </Form.Group>
            )}

            <Form.Group className="mb-4">
              <Form.Label className="fw-medium">Additional Notes</Form.Label>
              <Form.Control
                as="textarea"
                name="notes"
                rows={3}
                value={form.notes}
                onChange={handleInputChange}
                placeholder="Add any notes about this reschedule"
                disabled={submitting}
              />
            </Form.Group>
            
            <div className="d-flex justify-content-end gap-2">
              <Link to={`/doctor/appointments/${id}`}>
                <Button variant="outline-secondary">
                  Cancel
                </Button>
              </Link>
              <Button 
                type="submit" 
                variant="primary"
                disabled={submitting || !form.date || !form.startTime}
              >
                {submitting ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <FaSave className="me-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default DoctorAppointmentReschedule; 