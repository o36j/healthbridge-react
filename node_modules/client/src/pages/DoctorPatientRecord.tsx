import { useState, useEffect } from 'react';
import { Container, Card, Alert, Spinner, ListGroup, Button, Row, Col, Badge, Modal } from 'react-bootstrap';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import PatientRecordForm from '../components/doctors/PatientRecordForm';
import { format } from 'date-fns';
import { FaClipboardList, FaPlus, FaUser, FaCalendarAlt } from 'react-icons/fa';

// Types
interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth?: string;
  gender?: string;
  bloodType?: string;
  allergies?: string[];
  profilePhoto?: string;
  medicalRecordNumber?: string;
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
  _id: string;
  patient: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  doctor: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  visitDate: string;
  diagnosis: string;
  symptoms: string[];
  notes: string;
  vitals?: Vitals;
  prescriptions: Prescription[];
  followUpDate?: string;
  createdAt: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const DoctorPatientRecord = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [records, setRecords] = useState<PatientHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showNewRecordForm, setShowNewRecordForm] = useState(false);
  const [showEditRecordForm, setShowEditRecordForm] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<PatientHistoryRecord | null>(null);
  
  // Fetch patient data and history
  useEffect(() => {
    const fetchPatientData = async () => {
      if (!patientId) return;
      
      try {
        setLoading(true);
        setError('');
        
        // Fetch patient info
        const patientResponse = await axios.get(`${API_URL}/users/${patientId}`);
        setPatient(patientResponse.data.user);
        
        // Fetch patient records
        const recordsResponse = await axios.get(`${API_URL}/patient-history?patient=${patientId}`);
        setRecords(recordsResponse.data.patientHistory);
        
      } catch (err) {
        console.error(err);
        setError('Failed to load patient data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPatientData();
  }, [patientId]);
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };
  
  // Handle creating a new record
  const handleNewRecord = () => {
    setShowNewRecordForm(true);
  };
  
  // Handle editing an existing record
  const handleEditRecord = (record: PatientHistoryRecord) => {
    setSelectedRecord(record);
    setShowEditRecordForm(true);
  };
  
  // Handle record form save
  const handleRecordSave = () => {
    // Refresh data
    if (!patientId) return;
    
    setLoading(true);
    
    axios.get(`${API_URL}/patient-history?patient=${patientId}`)
      .then(response => {
        setRecords(response.data.patientHistory);
        setShowNewRecordForm(false);
        setShowEditRecordForm(false);
        setSelectedRecord(null);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to refresh patient records');
      })
      .finally(() => {
        setLoading(false);
      });
  };
  
  // Handle record form cancel
  const handleRecordCancel = () => {
    setShowNewRecordForm(false);
    setShowEditRecordForm(false);
    setSelectedRecord(null);
  };
  
  if (loading && !patient) {
    return (
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading patient data...</p>
      </Container>
    );
  }
  
  return (
    <Container className="py-4">
      <h2 className="mb-4 fw-bold">Patient Records</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      {patient && (
        <Card className="shadow-sm mb-4">
          <Card.Header className="bg-white py-3">
            <div className="d-flex justify-content-between align-items-center">
              <h4 className="mb-0 fw-bold d-flex align-items-center">
                <FaUser className="me-2 text-primary" />
                {patient.firstName} {patient.lastName}
              </h4>
              <Button 
                variant="primary" 
                size="sm" 
                className="d-flex align-items-center"
                onClick={handleNewRecord}
              >
                <FaPlus className="me-1" /> New Record
              </Button>
            </div>
          </Card.Header>
          <Card.Body>
            <Row className="mb-4">
              <Col md={6}>
                <p className="mb-1"><strong>Email:</strong> {patient.email}</p>
                <p className="mb-1"><strong>Medical Record #:</strong> {patient.medicalRecordNumber || 'Not assigned'}</p>
                <p className="mb-1"><strong>Date of Birth:</strong> {patient.dateOfBirth ? formatDate(patient.dateOfBirth) : 'Not provided'}</p>
              </Col>
              <Col md={6}>
                <p className="mb-1"><strong>Gender:</strong> {patient.gender || 'Not provided'}</p>
                <p className="mb-1"><strong>Blood Type:</strong> {patient.bloodType || 'Not provided'}</p>
                <p className="mb-1"><strong>Allergies:</strong> {patient.allergies?.join(', ') || 'None recorded'}</p>
              </Col>
            </Row>
            
            <h5 className="mb-3 fw-bold d-flex align-items-center">
              <FaClipboardList className="me-2 text-primary" />
              Medical History
            </h5>
            
            {records.length === 0 ? (
              <Alert variant="info">
                No medical records found for this patient. Click 'New Record' to create one.
              </Alert>
            ) : (
              <ListGroup>
                {records.map(record => (
                  <ListGroup.Item key={record._id} className="mb-2 border rounded">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="d-flex align-items-center">
                        <FaCalendarAlt className="me-2 text-primary" />
                        <h6 className="mb-0 fw-bold">{formatDate(record.visitDate)}</h6>
                      </div>
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={() => handleEditRecord(record)}
                      >
                        View/Edit
                      </Button>
                    </div>
                    
                    <p className="mb-1"><strong>Diagnosis:</strong> {record.diagnosis}</p>
                    
                    {record.symptoms.length > 0 && (
                      <p className="mb-1">
                        <strong>Symptoms:</strong> {record.symptoms.join(', ')}
                      </p>
                    )}
                    
                    {record.prescriptions.length > 0 && (
                      <div className="mb-1">
                        <strong>Prescriptions:</strong>{' '}
                        {record.prescriptions.map((prescription, index) => (
                          <Badge 
                            bg="light" 
                            text="dark" 
                            className="me-1 mb-1" 
                            key={index}
                          >
                            {prescription.medication} {prescription.dosage}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {record.followUpDate && (
                      <p className="mb-0 text-muted">
                        <strong>Follow-up:</strong> {formatDate(record.followUpDate)}
                      </p>
                    )}
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </Card.Body>
        </Card>
      )}
      
      {/* New Record Modal */}
      <Modal 
        show={showNewRecordForm} 
        onHide={handleRecordCancel}
        size="lg"
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>New Patient Record</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {patientId && (
            <PatientRecordForm 
              patientId={patientId}
              onSave={handleRecordSave}
              onCancel={handleRecordCancel}
            />
          )}
        </Modal.Body>
      </Modal>
      
      {/* Edit Record Modal */}
      <Modal 
        show={showEditRecordForm} 
        onHide={handleRecordCancel}
        size="lg"
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>Edit Patient Record</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {patientId && selectedRecord && (
            <PatientRecordForm 
              patientId={patientId}
              existingRecord={{
                _id: selectedRecord._id,
                patient: patientId,
                doctor: user?.id || '',
                visitDate: new Date(selectedRecord.visitDate).toISOString().split('T')[0],
                diagnosis: selectedRecord.diagnosis,
                symptoms: selectedRecord.symptoms,
                notes: selectedRecord.notes,
                vitals: selectedRecord.vitals,
                prescriptions: selectedRecord.prescriptions,
                followUpDate: selectedRecord.followUpDate ? 
                  new Date(selectedRecord.followUpDate).toISOString().split('T')[0] : 
                  undefined
              }}
              onSave={handleRecordSave}
              onCancel={handleRecordCancel}
            />
          )}
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default DoctorPatientRecord; 