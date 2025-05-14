import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { FaArrowLeft, FaPrescriptionBottleAlt, FaPlus, FaTrash, FaUser, FaNotesMedical } from 'react-icons/fa';
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
  reason: string;
  reasonForVisit: string;
  notes?: string;
}

interface Prescription {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes?: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const DoctorPrescriptionNew: React.FC = () => {
  const { appointmentId } = useParams<{ appointmentId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  
  // Form state
  const [diagnosis, setDiagnosis] = useState<string>('');
  const [symptoms, setSymptoms] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [followUpDate, setFollowUpDate] = useState<string>('');
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([{
    medication: '',
    dosage: '',
    frequency: '',
    duration: '',
    notes: ''
  }]);

  // Load appointment details
  useEffect(() => {
    const fetchAppointment = async () => {
      if (!user || !appointmentId) return;
      
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/appointments/${appointmentId}`);
        
        // Map the appointment data to our interface
        const appt = response.data.appointment;
        setAppointment({
          _id: appt._id,
          patient: appt.patient,
          appointmentDate: appt.date?.split('T')[0] || '',
          reasonForVisit: appt.reason,
          reason: appt.reason,
          notes: appt.notes
        });
        
        // Initialize notes with appointment reason
        setNotes(appt.notes || '');
      } catch (err) {
        console.error('Error fetching appointment:', err);
        setError('Failed to load appointment details.');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointment();
  }, [appointmentId, user]);

  // Add a new prescription field
  const addPrescription = () => {
    setPrescriptions([
      ...prescriptions,
      {
        medication: '',
        dosage: '',
        frequency: '',
        duration: '',
        notes: ''
      }
    ]);
  };

  // Remove a prescription field
  const removePrescription = (index: number) => {
    const updatedPrescriptions = [...prescriptions];
    updatedPrescriptions.splice(index, 1);
    setPrescriptions(updatedPrescriptions);
  };

  // Handle prescription field changes
  const handlePrescriptionChange = (index: number, field: keyof Prescription, value: string) => {
    const updatedPrescriptions = [...prescriptions];
    updatedPrescriptions[index] = {
      ...updatedPrescriptions[index],
      [field]: value
    };
    setPrescriptions(updatedPrescriptions);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !appointment) return;
    
    // Validate form
    if (!diagnosis.trim()) {
      setError('Diagnosis is required');
      return;
    }
    
    if (!notes.trim()) {
      setError('Notes are required');
      return;
    }
    
    // Validate prescriptions
    const validPrescriptions = prescriptions.filter(p => 
      p.medication.trim() && p.dosage.trim() && p.frequency.trim() && p.duration.trim()
    );
    
    if (validPrescriptions.length === 0) {
      setError('At least one complete prescription is required');
      return;
    }
    
    try {
      setSubmitting(true);
      setError(null);
      
      // Format symptoms as array
      const symptomsArray = symptoms
        .split(',')
        .map(symptom => symptom.trim())
        .filter(symptom => symptom);
      
      // Create patient history record with prescriptions using field names expected by the API
      const historyData = {
        patientId: appointment.patient._id,
        doctorId: user.id,
        visitDate: appointment.appointmentDate,
        diagnosis,
        symptoms: symptomsArray,
        notes,
        prescriptions: validPrescriptions,
        followUpDate: followUpDate || undefined
      };
      
      await axios.post(`${API_URL}/patient-history`, historyData);
      
      // Redirect to patient records
      navigate(`/doctor/patient-records/${appointment.patient._id}`);
    } catch (err) {
      console.error('Error creating prescription:', err);
      setError('Failed to save prescription. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
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
          <Link to={`/doctor/appointments/${appointmentId}`} className="btn btn-outline-primary mb-3">
            <FaArrowLeft className="me-2" />
            Back to Appointment
          </Link>
          <h1>Create Prescription</h1>
          <p className="text-muted">
            Patient: {appointment.patient.firstName} {appointment.patient.lastName}
          </p>
        </Col>
      </Row>

      <Form onSubmit={handleSubmit}>
        <Row>
          <Col lg={8}>
            <Card className="shadow-sm mb-4">
              <Card.Header className="bg-white py-3">
                <h4 className="mb-0 d-flex align-items-center">
                  <FaPrescriptionBottleAlt className="text-primary me-2" />
                  Prescription Details
                </h4>
              </Card.Header>
              
              <Card.Body className="p-4">
                {error && (
                  <Alert variant="danger" className="mb-4">
                    {error}
                  </Alert>
                )}
                
                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold">Diagnosis</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    placeholder="Enter diagnosis"
                    required
                  />
                </Form.Group>
                
                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold">Symptoms</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    placeholder="Enter symptoms (comma separated)"
                  />
                  <Form.Text className="text-muted">
                    Enter symptoms separated by commas (e.g., Fever, Cough, Headache)
                  </Form.Text>
                </Form.Group>
                
                <hr className="my-4" />
                
                <h5 className="mb-3">Medications</h5>
                
                {prescriptions.map((prescription, index) => (
                  <Card key={index} className="mb-3 border-light">
                    <Card.Body>
                      <div className="d-flex justify-content-between mb-3">
                        <h6 className="mb-0">Medication #{index + 1}</h6>
                        {prescriptions.length > 1 && (
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => removePrescription(index)}
                          >
                            <FaTrash />
                          </Button>
                        )}
                      </div>
                      
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Medication Name</Form.Label>
                            <Form.Control
                              type="text"
                              value={prescription.medication}
                              onChange={(e) => handlePrescriptionChange(index, 'medication', e.target.value)}
                              placeholder="Enter medication name"
                              required
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Dosage</Form.Label>
                            <Form.Control
                              type="text"
                              value={prescription.dosage}
                              onChange={(e) => handlePrescriptionChange(index, 'dosage', e.target.value)}
                              placeholder="e.g., 500mg, 5ml"
                              required
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                      
                      <Row>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Frequency</Form.Label>
                            <Form.Control
                              type="text"
                              value={prescription.frequency}
                              onChange={(e) => handlePrescriptionChange(index, 'frequency', e.target.value)}
                              placeholder="e.g., 3 times a day, every 8 hours"
                              required
                            />
                          </Form.Group>
                        </Col>
                        <Col md={6}>
                          <Form.Group className="mb-3">
                            <Form.Label>Duration</Form.Label>
                            <Form.Control
                              type="text"
                              value={prescription.duration}
                              onChange={(e) => handlePrescriptionChange(index, 'duration', e.target.value)}
                              placeholder="e.g., 7 days, 2 weeks"
                              required
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                      
                      <Form.Group>
                        <Form.Label>Special Instructions</Form.Label>
                        <Form.Control
                          as="textarea"
                          rows={2}
                          value={prescription.notes || ''}
                          onChange={(e) => handlePrescriptionChange(index, 'notes', e.target.value)}
                          placeholder="Any special instructions (optional)"
                        />
                      </Form.Group>
                    </Card.Body>
                  </Card>
                ))}
                
                <div className="d-flex justify-content-center my-3">
                  <Button
                    variant="outline-primary"
                    onClick={addPrescription}
                    className="px-4"
                  >
                    <FaPlus className="me-2" />
                    Add Another Medication
                  </Button>
                </div>
                
                <hr className="my-4" />
                
                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold">Follow-up Date (Optional)</Form.Label>
                  <Form.Control
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </Form.Group>
                
                <Form.Group className="mb-4">
                  <Form.Label className="fw-bold">Additional Notes</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any additional notes or instructions for the patient"
                  />
                </Form.Group>
              </Card.Body>
            </Card>
          </Col>
          
          <Col lg={4}>
            <Card className="sticky-top shadow-sm" style={{ top: '1rem' }}>
              <Card.Header className="bg-white py-3">
                <h5 className="mb-0">
                  <FaUser className="text-primary me-2" />
                  Patient Information
                </h5>
              </Card.Header>
              
              <Card.Body>
                <p className="mb-2">
                  <strong>Name:</strong> {appointment.patient.firstName} {appointment.patient.lastName}
                </p>
                <p className="mb-2">
                  <strong>Email:</strong> {appointment.patient.email}
                </p>
                <p className="mb-2">
                  <strong>Visit Date:</strong> {formatDate(appointment.appointmentDate)}
                </p>
                <p className="mb-2">
                  <strong>Reason for Visit:</strong>
                </p>
                <p className="bg-light p-2 rounded">{appointment.reasonForVisit || appointment.reason}</p>
                
                <Link 
                  to={`/doctor/patient-records/${appointment.patient._id}`}
                  className="btn btn-outline-primary btn-sm w-100 mt-3"
                >
                  <FaNotesMedical className="me-2" />
                  View Patient Record
                </Link>
              </Card.Body>
              
              <Card.Footer className="bg-white border-top">
                <div className="d-grid gap-2">
                  <Button
                    variant="primary"
                    type="submit"
                    disabled={submitting}
                    className="py-2"
                  >
                    {submitting ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <FaPrescriptionBottleAlt className="me-2" />
                        Save Prescription
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline-secondary"
                    as={Link}
                    to={`/doctor/appointments/${appointmentId}`}
                    className="py-2"
                  >
                    Cancel
                  </Button>
                </div>
              </Card.Footer>
            </Card>
          </Col>
        </Row>
      </Form>
    </Container>
  );
};

export default DoctorPrescriptionNew; 