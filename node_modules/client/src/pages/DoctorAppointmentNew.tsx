import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Form, InputGroup, Button, Spinner, Alert } from 'react-bootstrap';
import { FaCalendarAlt, FaClock, FaArrowLeft, FaUserAlt, FaNotesMedical, FaVideo } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  profilePhoto?: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const DoctorAppointmentNew: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [telehealthEnabled, setTelehealthEnabled] = useState<boolean>(false);
  
  const [form, setForm] = useState({
    patientId: '',
    date: '',
    startTime: '',
    endTime: '',
    reason: '',
    notes: '',
    isVirtual: false
  });
  
  // Fetch patients
  useEffect(() => {
    const fetchPatients = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        // Get appointments first, then extract unique patients from them
        const response = await axios.get(`${API_URL}/appointments/user/${user.id}`);
        const appointments = response.data.appointments;
        
        // Extract unique patients from appointments
        const patientsMap = new Map<string, Patient>();
        appointments.forEach((appt: any) => {
          const p = appt.patient;
          if (p && !patientsMap.has(p._id)) {
            patientsMap.set(p._id, {
              _id: p._id,
              firstName: p.firstName,
              lastName: p.lastName,
              email: p.email || '',
              profilePhoto: p.profilePhoto
            });
          }
        });
        
        const fetchedPatients = Array.from(patientsMap.values());
        setPatients(fetchedPatients);
        setFilteredPatients(fetchedPatients);
      } catch (err) {
        console.error('Error fetching patients:', err);
        setError('Failed to load patients. You may need to see a patient first before scheduling them.');
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [user]);
  
  // Filter patients based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredPatients(patients);
      return;
    }
    
    const searchTermLower = searchTerm.toLowerCase();
    const filtered = patients.filter(patient => 
      `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchTermLower) ||
      patient.email?.toLowerCase().includes(searchTermLower)
    );
    
    setFilteredPatients(filtered);
  }, [searchTerm, patients]);
  
  // Fetch available time slots
  const fetchAvailableSlots = useCallback(async () => {
    if (!user || !form.date) return;
    
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/appointments/available-slots?doctor=${user.id}&date=${form.date}`
      );
      
      setAvailableSlots(response.data.availableSlots || []);
    } catch (err) {
      console.error('Error fetching available slots:', err);
      setError('Failed to load available time slots.');
    } finally {
      setLoading(false);
    }
  }, [user, form.date]);
  
  useEffect(() => {
    if (user && form.date) {
      fetchAvailableSlots();
    }
  }, [user, form.date, fetchAvailableSlots]);
  
  // Check if the doctor has telehealth enabled in their profile
  useEffect(() => {
    const checkTelehealthStatus = async () => {
      if (!user) return;
      
      try {
        // Fetch the doctor's profile
        const response = await axios.get(`${API_URL}/users/${user.id}`);
        const doctorData = response.data.user;
        
        // Check if telehealth is enabled
        const isTelehealthEnabled = doctorData.professionalProfile?.telehealth || false;
        setTelehealthEnabled(isTelehealthEnabled);
        
      } catch (err) {
        console.error('Error checking telehealth status:', err);
        // Don't show an error to the user, just disable telehealth option
        setTelehealthEnabled(false);
      }
    };
    
    checkTelehealthStatus();
  }, [user]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    if (type === 'checkbox') {
      setForm(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked
      }));
    } else {
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
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
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
      
      const appointmentData = {
        doctorId: user.id,
        patientId: form.patientId,
        date: form.date,
        startTime: form.startTime,
        endTime,
        reason: form.reason,
        notes: form.notes,
        isVirtual: form.isVirtual
      };
      
      const response = await axios.post(`${API_URL}/appointments`, appointmentData);
      
      // Navigate back to appointments list
      navigate(`/doctor/appointments`);
    } catch (err) {
      console.error('Error creating appointment:', err);
      setError('Failed to create appointment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };
  
  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <Link to="/doctor/appointments" className="btn btn-outline-primary mb-3">
            <FaArrowLeft className="me-2" />
            Back to Appointments
          </Link>
          <h1>Add New Appointment</h1>
        </Col>
      </Row>

      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-white py-3">
          <h4 className="mb-0">
            <FaCalendarAlt className="me-2 text-primary" />
            Schedule a New Appointment
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
              <Col md={12}>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium d-flex align-items-center">
                    <FaUserAlt className="text-primary me-2" />
                    Select Patient
                  </Form.Label>
                  <InputGroup className="mb-3">
                    <Form.Control
                      placeholder="Search for a patient..."
                      aria-label="Search for a patient"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </InputGroup>
                  <Form.Select
                    name="patientId"
                    value={form.patientId}
                    onChange={handleInputChange}
                    required
                    disabled={submitting}
                    title="Select a patient"
                    aria-label="Select a patient"
                  >
                    <option value="">Select a patient</option>
                    {filteredPatients.map(patient => (
                      <option key={patient._id} value={patient._id}>
                        {patient.firstName} {patient.lastName}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium d-flex align-items-center">
                    <FaCalendarAlt className="text-primary me-2" />
                    Appointment Date
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

            {/* Telehealth Option */}
            <Form.Group className="mb-4">
              <div className="d-flex align-items-center">
                <Form.Check 
                  type="switch"
                  id="isVirtualSwitch"
                  name="isVirtual"
                  checked={form.isVirtual}
                  onChange={handleInputChange}
                  disabled={!telehealthEnabled || submitting}
                  label={
                    <span className="ms-2 d-flex align-items-center">
                      <FaVideo className={telehealthEnabled ? "text-primary me-2" : "text-muted me-2"} /> 
                      Telehealth Appointment
                    </span>
                  }
                />
              </div>
              <Form.Text className="text-muted ms-4 ps-2">
                {!telehealthEnabled ? (
                  "You need to enable telehealth in your profile settings before offering virtual appointments."
                ) : form.isVirtual ? (
                  "This will be a virtual appointment. You'll need to provide a meeting link after confirming the appointment."
                ) : (
                  "Toggle on to make this a virtual appointment."
                )}
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="fw-medium d-flex align-items-center">
                <FaNotesMedical className="text-primary me-2" />
                Reason for Visit
              </Form.Label>
              <Form.Control
                as="textarea"
                name="reason"
                rows={3}
                value={form.reason}
                onChange={handleInputChange}
                placeholder="Describe the reason for this appointment"
                required
                disabled={submitting}
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="fw-medium">Additional Notes</Form.Label>
              <Form.Control
                as="textarea"
                name="notes"
                rows={3}
                value={form.notes}
                onChange={handleInputChange}
                placeholder="Add any additional notes (optional)"
                disabled={submitting}
              />
            </Form.Group>
            
            <div className="d-flex justify-content-end gap-2">
              <Link to={`/doctor/appointments`}>
                <Button variant="outline-secondary">
                  Cancel
                </Button>
              </Link>
              <Button 
                type="submit" 
                variant="primary"
                disabled={submitting || !form.patientId || !form.date || !form.startTime || !form.reason}
              >
                {submitting ? (
                  <>
                    <Spinner animation="border" size="sm" className="me-2" />
                    Creating...
                  </>
                ) : (
                  <>
                    <FaCalendarAlt className="me-2" />
                    Create Appointment
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

export default DoctorAppointmentNew; 