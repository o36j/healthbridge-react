import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';
import { Form, Card, Row, Col, Button, Spinner, Alert } from 'react-bootstrap';
import { FaCalendarAlt, FaUserMd, FaNotesMedical, FaClock, FaHospital, FaStethoscope } from 'react-icons/fa';
import { useLocation } from 'react-router-dom';

interface Doctor {
  _id: string;
  firstName: string;
  lastName: string;
  department: string;
  specialization: string;
  profilePhoto?: string;
  rating?: number;
  education?: string[];
  acceptsNewPatients?: boolean;
  experience?: number;
  location?: string;
  telehealth?: boolean;
  availability?: {
    monday: string;
    tuesday: string;
    wednesday: string;
    thursday: string;
    friday: string;
    saturday: string;
    sunday: string;
  };
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SERVER_URL = API_URL.replace('/api', '');

// Helper function to safely format profile image URLs
const getProfileImageUrl = (photoPath?: string): string => {
  if (!photoPath) return '';
  
  // If it's already a blob URL, return it
  if (photoPath.startsWith('blob:')) {
    return photoPath;
  }

  // If it starts with http, it's an absolute URL
  if (photoPath.startsWith('http')) {
    return photoPath;
  }

  // Otherwise, it's a relative path, so prepend the server URL
  return `${SERVER_URL}${photoPath}`;
};

interface BookAppointmentFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const BookAppointmentForm = ({ onSuccess, onCancel }: BookAppointmentFormProps) => {
  const { user } = useAuth();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  
  const [form, setForm] = useState({
    doctor: '',
    date: '',
    startTime: '',
    endTime: '',
    reason: '',
    notes: '',
    isVirtual: false,
  });

  // Filter doctors by specialization
  const [specializations, setSpecializations] = useState<string[]>([]);
  const [selectedSpecialization, setSelectedSpecialization] = useState('');

  // Add state variables for the new filters
  const [locations, setLocations] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState('');
  const [telehealthOnly, setTelehealthOnly] = useState(false);
  const [newPatientsOnly, setNewPatientsOnly] = useState(false);

  // Check if a doctor was selected from another page
  useEffect(() => {
    if (location.state?.selectedDoctor) {
      const doctor = location.state.selectedDoctor;
      setSelectedDoctor(doctor);
      setForm(prev => ({
        ...prev,
        doctor: doctor._id
      }));
    }
  }, [location.state]);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchAvailableSlots = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/appointments/available-slots?doctor=${form.doctor}&date=${form.date}`
      );
      setAvailableSlots(response.data.availableSlots || []);
      
      // Set the endTime based on the selected startTime
      if (form.startTime) {
        const startTimeIndex = response.data.availableSlots.indexOf(form.startTime);
        if (startTimeIndex >= 0 && startTimeIndex < response.data.availableSlots.length - 1) {
          setForm(prev => ({
            ...prev,
            endTime: response.data.availableSlots[startTimeIndex + 1]
          }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [form.doctor, form.date, form.startTime]);

  useEffect(() => {
    if (form.doctor && form.date) {
      fetchAvailableSlots();
    }
  }, [form.doctor, form.date, fetchAvailableSlots]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/users/public/doctors`);
      setDoctors(response.data.users);
      
      // Extract unique specializations
      const uniqueSpecializations = [...new Set(response.data.users.map((doc: Doctor) => doc.specialization))] as string[];
      setSpecializations(uniqueSpecializations);
      
      // Extract unique locations for filtering
      const uniqueLocations = [...new Set(response.data.users
        .filter((doc: Doctor) => doc.location)
        .map((doc: Doctor) => doc.location))] as string[];
      
      setLocations(uniqueLocations);
    } catch (err) {
      setError('Failed to load doctors');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'doctor') {
      const doctor = doctors.find(d => d._id === value);
      setSelectedDoctor(doctor || null);
      
      // Reset isVirtual if doctor doesn't support telehealth
      if (doctor && !doctor.telehealth && form.isVirtual) {
        setForm(prev => ({
          ...prev,
          isVirtual: false
        }));
      }
    }
    
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

  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      setLoading(true);
      setError('');
      
      // Calculate endTime based on startTime (assuming 30 min increments)
      const startTimeIndex = availableSlots.indexOf(form.startTime);
      const endTime = availableSlots[startTimeIndex + 1];
      
      const appointmentData = {
        doctorId: form.doctor,
        patientId: user.id,
        date: form.date,
        startTime: form.startTime,
        endTime,
        reason: form.reason,
        notes: form.notes,
        isVirtual: form.isVirtual,
        createdBy: user.id
      };
      
      await axios.post(`${API_URL}/appointments`, appointmentData);
      
      onSuccess();
    } catch (err) {
      setError('Failed to book appointment. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Update the filtered doctors to include the new filters
  const filteredDoctors = doctors.filter(doctor => {
    // Filter by specialization if selected
    if (selectedSpecialization && doctor.specialization !== selectedSpecialization) {
      return false;
    }
    
    // Filter by location if selected
    if (selectedLocation && doctor.location !== selectedLocation) {
      return false;
    }
    
    // Filter by telehealth if selected
    if (telehealthOnly && !doctor.telehealth) {
      return false;
    }
    
    // Filter by accepting new patients if selected
    if (newPatientsOnly && !doctor.acceptsNewPatients) {
      return false;
    }
    
    return true;
  });

  return (
    <Card className="border-0 shadow">
      <Card.Header className="bg-primary bg-gradient text-white py-3">
        <div className="d-flex align-items-center">
          <FaCalendarAlt className="me-2 fs-4" />
          <h3 className="mb-0 fw-bold">Book New Appointment</h3>
        </div>
      </Card.Header>
      
      <Card.Body className="p-4">
        {error && (
          <Alert variant="danger" className="mb-4">
            {error}
          </Alert>
        )}
        
        <Form onSubmit={handleSubmit}>
          <Row className="mb-4">
            <Col xs={12}>
              <Card className="border-light bg-light">
                <Card.Body className="py-3">
                  <h5 className="card-title mb-3 d-flex align-items-center">
                    <FaStethoscope className="text-primary me-2" />
                    Filter Doctors
                  </h5>
                  
                  <Row>
                    <Col md={6} lg={3} className="mb-3">
                      <Form.Group controlId="specializationSelect">
                        <Form.Label>Specialization</Form.Label>
                        <Form.Select
                          value={selectedSpecialization}
                          onChange={(e) => setSelectedSpecialization(e.target.value)}
                          aria-label="Filter doctors by specialization"
                          title="Filter doctors by specialization"
                        >
                          <option value="">All Specializations</option>
                          {specializations.map((specialization) => (
                            <option key={specialization} value={specialization}>
                              {specialization}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    
                    {locations.length > 0 && (
                      <Col md={6} lg={3} className="mb-3">
                        <Form.Group controlId="locationSelect">
                          <Form.Label>Location</Form.Label>
                          <Form.Select
                            value={selectedLocation}
                            onChange={(e) => setSelectedLocation(e.target.value)}
                            aria-label="Filter doctors by location"
                            title="Filter by location"
                          >
                            <option value="">All Locations</option>
                            {locations.map((location) => (
                              <option key={location} value={location}>
                                {location}
                              </option>
                            ))}
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    )}
                    
                    <Col md={6} lg={3} className="mb-3">
                      <Form.Group className="mt-md-4">
                        <Form.Check 
                          type="switch"
                          id="telehealthSwitch"
                          label="Telehealth Available"
                          checked={telehealthOnly}
                          onChange={() => setTelehealthOnly(!telehealthOnly)}
                          className="mt-2"
                        />
                      </Form.Group>
                    </Col>
                    
                    <Col md={6} lg={3} className="mb-3">
                      <Form.Group className="mt-md-4">
                        <Form.Check 
                          type="switch"
                          id="newPatientsSwitch"
                          label="Accepting New Patients"
                          checked={newPatientsOnly}
                          onChange={() => setNewPatientsOnly(!newPatientsOnly)}
                          className="mt-2"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          <Row className="mb-4">
            <Col md={6} className="mb-3 mb-md-0">
              <Form.Group controlId="doctorSelect">
                <Form.Label className="fw-medium d-flex align-items-center">
                  <FaUserMd className="text-primary me-2" />
                  Select Doctor
                </Form.Label>
                <Form.Select
                  name="doctor"
                  value={form.doctor}
                  onChange={handleInputChange}
                  required
                  aria-label="Select doctor"
                  title="Select doctor"
                >
                  <option value="">Select a doctor</option>
                  {filteredDoctors.map((doctor) => (
                    <option key={doctor._id} value={doctor._id}>
                      Dr. {doctor.firstName} {doctor.lastName} - {doctor.specialization}
                      {doctor.location ? ` (${doctor.location})` : ''}
                      {doctor.telehealth ? ' ✓ Telehealth' : ''}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group controlId="appointmentDate">
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
                  aria-label="Select appointment date"
                  disabled={loading}
                  title="Select appointment date"
                />
              </Form.Group>
            </Col>
          </Row>
          
          {/* Telehealth Option - only display if selected doctor supports telehealth */}
          {selectedDoctor && selectedDoctor.telehealth && (
            <Row className="mb-4">
              <Col xs={12}>
                <Card className="border-0 bg-light">
                  <Card.Body>
                    <Form.Check 
                      type="switch"
                      id="virtualAppointmentSwitch"
                      name="isVirtual"
                      label={
                        <div className="d-flex align-items-center">
                          <span className="fs-5 me-2">Schedule as Telehealth Visit</span>
                          <span className="badge bg-success">
                            <i className="fa fa-video me-1"></i> Virtual
                          </span>
                        </div>
                      }
                      checked={form.isVirtual}
                      onChange={handleCheckboxChange}
                      className="mb-2"
                    />
                    <p className="text-muted small mb-0">
                      {form.isVirtual 
                        ? "You'll receive a secure video meeting link once your appointment is confirmed." 
                        : "Switch to telehealth to have your appointment from home via secure video call."}
                    </p>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}
          
          {/* Selected Doctor Card */}
          {selectedDoctor && (
            <Card className="border-0 bg-light mb-4">
              <Card.Body>
                <Row>
                  <Col xs="auto">
                    <div className="doctor-avatar rounded-circle bg-primary bg-opacity-10 p-2 d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                      {selectedDoctor.profilePhoto ? (
                        <img
                          src={getProfileImageUrl(selectedDoctor.profilePhoto)}
                          alt={`Dr. ${selectedDoctor.firstName} ${selectedDoctor.lastName}`}
                          className="img-fluid rounded-circle"
                        />
                      ) : (
                        <FaUserMd className="text-primary fs-3" />
                      )}
                    </div>
                  </Col>
                  <Col>
                    <h5 className="text-primary mb-1">
                      Dr. {selectedDoctor.firstName} {selectedDoctor.lastName}
                      {selectedDoctor.rating && (
                        <span className="ms-2 text-warning">
                          {[...Array(Math.floor(selectedDoctor.rating))].map((_, i) => (
                            <i key={i} className="fa fa-star me-1"></i>
                          ))}
                          {selectedDoctor.rating % 1 >= 0.5 && <i className="fa fa-star-half-alt me-1"></i>}
                          <small className="text-muted ms-1">({selectedDoctor.rating.toFixed(1)})</small>
                        </span>
                      )}
                    </h5>
                    <div className="d-flex align-items-center text-muted mb-2 flex-wrap">
                      <FaStethoscope className="me-1" />
                      <span className="me-2">{selectedDoctor.specialization}</span>
                      <FaHospital className="me-1" />
                      <span className="me-2">{selectedDoctor.department}</span>
                      
                      {selectedDoctor.location && (
                        <>
                          <i className="fa fa-map-marker-alt me-1"></i>
                          <span className="me-2">{selectedDoctor.location}</span>
                        </>
                      )}
                      
                      {selectedDoctor.experience && selectedDoctor.experience > 0 && (
                        <>
                          <i className="fa fa-clock me-1"></i>
                          <span className="me-2">{selectedDoctor.experience} years exp.</span>
                        </>
                      )}
                      
                      {selectedDoctor.telehealth && (
                        <span className="badge bg-success me-2">
                          <i className="fa fa-video me-1"></i> Telehealth
                        </span>
                      )}
                      
                      {selectedDoctor.acceptsNewPatients && (
                        <span className="badge bg-primary">
                          <i className="fa fa-user-plus me-1"></i> Accepting Patients
                        </span>
                      )}
                    </div>
                    
                    {selectedDoctor.education && selectedDoctor.education.length > 0 && (
                      <div className="small text-muted mt-1">
                        <strong>Education:</strong> {selectedDoctor.education.join(', ')}
                      </div>
                    )}
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}
          
          {/* Available Time Slots */}
          {form.date && form.doctor && (
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
                        <Button
                          variant={form.startTime === slot ? "primary" : "outline-secondary"}
                          className="w-100"
                          onClick={() => {
                            setForm(prev => ({
                              ...prev,
                              startTime: slot,
                              endTime: index < availableSlots.length - 1 ? availableSlots[index + 1] : ''
                            }));
                          }}
                          disabled={index === availableSlots.length - 1 || loading}
                          aria-label={`Select time slot: ${slot}`}
                        >
                          {slot}
                        </Button>
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
          
          <Row className="mb-4">
            <Col xs={12}>
              <Form.Group controlId="appointmentReason">
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
                  placeholder="Briefly describe your symptoms or reason for visit"
                  required
                  disabled={loading}
                />
              </Form.Group>
            </Col>
          </Row>
          
          <Row className="mb-4">
            <Col xs={12}>
              <Form.Group controlId="appointmentNotes">
                <Form.Label className="fw-medium">
                  Additional Notes (Optional)
                </Form.Label>
                <Form.Control
                  as="textarea"
                  name="notes"
                  rows={2}
                  value={form.notes}
                  onChange={handleInputChange}
                  placeholder="Any additional information you'd like to provide"
                  disabled={loading}
                />
              </Form.Group>
            </Col>
          </Row>
          
          <div className="d-flex justify-content-end gap-2 mt-4">
            <Button
              variant="outline-secondary"
              onClick={onCancel}
              disabled={loading}
              aria-label="Cancel appointment booking"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading || !form.doctor || !form.date || !form.startTime || !form.reason}
              aria-label="Submit appointment booking"
            >
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Booking...
                </>
              ) : (
                'Book Appointment'
              )}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default BookAppointmentForm; 