import { useState, useEffect } from 'react';
import { Form, Button, Card, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { FaUserMd, FaNotesMedical, FaWeight, FaRulerVertical, FaHeartbeat, FaThermometerHalf } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import PrescriptionForm from './PrescriptionForm';

interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth?: string;
  gender?: string;
  bloodType?: string;
  allergies?: string[];
  emergencyContact?: string;
  medicalRecordNumber?: string;
  profilePhoto?: string;
}

interface Vitals {
  bloodPressure?: string;
  heartRate?: number;
  respiratoryRate?: number;
  temperature?: number;
  height?: number;
  weight?: number;
  oxygenSaturation?: number;
}

interface Prescription {
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes?: string;
}

interface PatientHistoryRecord {
  _id?: string;
  patient: string;
  doctor: string;
  visitDate: string;
  diagnosis: string;
  symptoms: string[];
  notes: string;
  vitals?: Vitals;
  prescriptions: Prescription[];
  followUpDate?: string;
}

interface PatientRecordFormProps {
  patientId: string;
  existingRecord?: PatientHistoryRecord;
  onSave: () => void;
  onCancel: () => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const PatientRecordForm = ({ patientId, existingRecord, onSave, onCancel }: PatientRecordFormProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [patient, setPatient] = useState<Patient | null>(null);
  const [patientLoading, setPatientLoading] = useState(true);
  
  // Form state
  const [formData, setFormData] = useState<PatientHistoryRecord>({
    patient: patientId,
    doctor: user?.id || '',
    visitDate: new Date().toISOString().split('T')[0],
    diagnosis: '',
    symptoms: [],
    notes: '',
    vitals: {
      bloodPressure: '',
      heartRate: 0,
      respiratoryRate: 0,
      temperature: 0,
      height: 0,
      weight: 0,
      oxygenSaturation: 0
    },
    prescriptions: []
  });
  
  // Load patient info
  useEffect(() => {
    const fetchPatient = async () => {
      try {
        setPatientLoading(true);
        const response = await axios.get(`${API_URL}/users/${patientId}`);
        setPatient(response.data.user);
      } catch (err) {
        console.error(err);
        setError('Failed to load patient information');
      } finally {
        setPatientLoading(false);
      }
    };
    
    fetchPatient();
  }, [patientId]);
  
  // Load existing record if provided
  useEffect(() => {
    if (existingRecord) {
      setFormData(existingRecord);
    }
  }, [existingRecord]);
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle symptoms list input
  const handleSymptomsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const symptoms = e.target.value.split(',').map(s => s.trim());
    setFormData(prev => ({
      ...prev,
      symptoms
    }));
  };
  
  // Handle vitals input
  const handleVitalsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      vitals: {
        ...prev.vitals,
        [name]: value
      }
    }));
  };
  
  // Handle prescription changes from PrescriptionForm
  const handlePrescriptionsChange = (updatedPrescriptions: Prescription[]) => {
    setFormData(prev => ({
      ...prev,
      prescriptions: updatedPrescriptions
    }));
  };
  
  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError('');
      
      // Ensure all required fields are present
      if (!formData.patient || !formData.doctor || !formData.diagnosis.trim() || !formData.notes.trim()) {
        setError('Please fill in all required fields: Patient, Doctor, Diagnosis, and Notes');
        setLoading(false);
        return;
      }
      
      // Prepare payload with explicit field names to match the backend requirements
      const payload = {
        patientId: formData.patient,
        doctorId: formData.doctor,
        visitDate: new Date(formData.visitDate).toISOString(),
        diagnosis: formData.diagnosis,
        symptoms: formData.symptoms,
        notes: formData.notes,
        vitals: formData.vitals,
        prescriptions: formData.prescriptions,
        followUpDate: formData.followUpDate ? new Date(formData.followUpDate).toISOString() : undefined
      };
      
      let response;
      
      if (existingRecord?._id) {
        // Update existing record
        response = await axios.put(`${API_URL}/patient-history/${existingRecord._id}`, payload);
      } else {
        // Create new record
        response = await axios.post(`${API_URL}/patient-history`, payload);
      }
      
      setSuccess('Patient record saved successfully');
      
      // Notify parent component
      setTimeout(() => {
        onSave();
      }, 1500);
      
    } catch (err) {
      console.error(err);
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.message || 'Failed to save patient record');
      } else {
        setError('Failed to save patient record');
      }
    } finally {
      setLoading(false);
    }
  };
  
  if (patientLoading) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" variant="primary" />
        <p className="mt-2">Loading patient information...</p>
      </div>
    );
  }
  
  return (
    <Card className="shadow-sm">
      <Card.Header className="bg-white py-3">
        <h4 className="mb-0 fw-bold d-flex align-items-center">
          <FaNotesMedical className="me-2 text-primary" />
          {existingRecord?._id ? 'Update Patient Record' : 'Create New Patient Record'}
        </h4>
      </Card.Header>
      
      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}
        
        {patient && (
          <div className="mb-4 p-3 bg-light rounded">
            <h5 className="d-flex align-items-center">
              <FaUserMd className="me-2 text-primary" />
              Patient Information
            </h5>
            <Row className="mt-3">
              <Col md={6}>
                <p className="mb-1"><strong>Name:</strong> {patient.firstName} {patient.lastName}</p>
                <p className="mb-1"><strong>Medical Record #:</strong> {patient.medicalRecordNumber || 'Not assigned'}</p>
                <p className="mb-1"><strong>Date of Birth:</strong> {patient.dateOfBirth || 'Not provided'}</p>
              </Col>
              <Col md={6}>
                <p className="mb-1"><strong>Gender:</strong> {patient.gender || 'Not provided'}</p>
                <p className="mb-1"><strong>Blood Type:</strong> {patient.bloodType || 'Not provided'}</p>
                <p className="mb-1"><strong>Allergies:</strong> {patient.allergies?.join(', ') || 'None recorded'}</p>
              </Col>
            </Row>
          </div>
        )}
        
        <Form onSubmit={handleSubmit}>
          <Row className="mb-3">
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Visit Date</Form.Label>
                <Form.Control
                  type="date"
                  name="visitDate"
                  value={formData.visitDate}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Follow-up Date</Form.Label>
                <Form.Control
                  type="date"
                  name="followUpDate"
                  value={formData.followUpDate || ''}
                  onChange={handleInputChange}
                />
              </Form.Group>
            </Col>
          </Row>
          
          <Form.Group className="mb-3">
            <Form.Label>Diagnosis</Form.Label>
            <Form.Control
              type="text"
              name="diagnosis"
              value={formData.diagnosis}
              onChange={handleInputChange}
              required
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Symptoms (comma-separated)</Form.Label>
            <Form.Control
              type="text"
              name="symptoms"
              value={formData.symptoms.join(', ')}
              onChange={handleSymptomsChange}
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Notes</Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              required
            />
          </Form.Group>
          
          <Card className="mb-4">
            <Card.Header className="bg-light">
              <h5 className="mb-0 fw-bold">Vitals</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="d-flex align-items-center">
                      <FaHeartbeat className="me-2 text-danger" />
                      Blood Pressure
                    </Form.Label>
                    <Form.Control
                      type="text"
                      name="bloodPressure"
                      value={formData.vitals?.bloodPressure || ''}
                      onChange={handleVitalsChange}
                      placeholder="e.g. 120/80"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Heart Rate (bpm)</Form.Label>
                    <Form.Control
                      type="number"
                      name="heartRate"
                      value={formData.vitals?.heartRate || ''}
                      onChange={handleVitalsChange}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label className="d-flex align-items-center">
                      <FaThermometerHalf className="me-2 text-warning" />
                      Temperature (°F)
                    </Form.Label>
                    <Form.Control
                      type="number"
                      step="0.1"
                      name="temperature"
                      value={formData.vitals?.temperature || ''}
                      onChange={handleVitalsChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Respiratory Rate (breaths/min)</Form.Label>
                    <Form.Control
                      type="number"
                      name="respiratoryRate"
                      value={formData.vitals?.respiratoryRate || ''}
                      onChange={handleVitalsChange}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label className="d-flex align-items-center">
                      <FaRulerVertical className="me-2 text-info" />
                      Height (cm)
                    </Form.Label>
                    <Form.Control
                      type="number"
                      name="height"
                      value={formData.vitals?.height || ''}
                      onChange={handleVitalsChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label className="d-flex align-items-center">
                      <FaWeight className="me-2 text-secondary" />
                      Weight (kg)
                    </Form.Label>
                    <Form.Control
                      type="number"
                      step="0.1"
                      name="weight"
                      value={formData.vitals?.weight || ''}
                      onChange={handleVitalsChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Oxygen Saturation (%)</Form.Label>
                    <Form.Control
                      type="number"
                      name="oxygenSaturation"
                      value={formData.vitals?.oxygenSaturation || ''}
                      onChange={handleVitalsChange}
                    />
                  </Form.Group>
                </Col>
              </Row>
            </Card.Body>
          </Card>
          
          {/* Prescriptions section */}
          <PrescriptionForm 
            prescriptions={formData.prescriptions || []} 
            onChange={handlePrescriptionsChange} 
          />
          
          <div className="d-flex justify-content-end gap-2">
            <Button variant="secondary" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Saving...
                </>
              ) : (
                'Save Record'
              )}
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default PatientRecordForm; 