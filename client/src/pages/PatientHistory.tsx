import { useState, useEffect } from 'react';
import { useAuth, UserRole } from '../contexts/AuthContext';
import axios from 'axios';
import { FaFileAlt, FaSearch, FaCalendarAlt, FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';
import { useLocation } from 'react-router-dom';
import { 
  Container, 
  Row, 
  Col, 
  Card, 
  Form, 
  Button, 
  Alert, 
  Spinner, 
  Badge, 
  ListGroup, 
  InputGroup 
} from 'react-bootstrap';

interface Doctor {
  _id: string;
  firstName: string;
  lastName: string;
  specialization?: string;
}

interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: string;
  bloodType?: string;
  allergies?: string[];
  medicalRecordNumber?: string;
  emergencyContact?: string;
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
  medicationId?: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes?: string;
  warnings?: string[];
  sideEffects?: string[];
  showWarningsToPatient?: boolean;
}

interface PatientHistoryRecord {
  _id: string;
  patient: Patient;
  doctor: Doctor;
  visitDate: string;
  diagnosis: string;
  symptoms: string[];
  notes: string;
  vitals?: Vitals;
  prescriptions: Prescription[];
  attachments?: string[];
  followUpDate?: string;
  createdAt: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const PatientHistory = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [patientHistory, setPatientHistory] = useState<PatientHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [showDetail, setShowDetail] = useState<string | null>(null);
  
  useEffect(() => {
    if (user?.role === UserRole.PATIENT) {
      fetchPatientHistory(user.id);
    } else if (user?.role === UserRole.DOCTOR || user?.role === UserRole.NURSE || user?.role === UserRole.ADMIN) {
      fetchPatients();
      
      // Check for patientId in URL query parameters
      const queryParams = new URLSearchParams(location.search);
      const patientIdParam = queryParams.get('patientId');
      
      if (patientIdParam) {
        fetchPatientHistory(patientIdParam);
      }
    }
  }, [user, location.search]);
  
  const fetchPatients = async () => {
    try {
      setLoadingPatients(true);
      const response = await axios.get(`${API_URL}/users?role=patient`);
      setPatients(response.data.users);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPatients(false);
    }
  };
  
  const fetchPatientHistory = async (patientId: string) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await axios.get(`${API_URL}/patient-history/patient/${patientId}`);
      setPatientHistory(response.data.patientHistory);
      setSelectedPatient(patientId);
    } catch (err) {
      setError('Failed to load patient history');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handlePatientChange = (patientId: string) => {
    setSelectedPatient(patientId);
    fetchPatientHistory(patientId);
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  // Filter patient history records based on search and date
  const filteredRecords = patientHistory.filter((record) => {
    // Date filter
    if (dateFilter) {
      const recordDate = new Date(record.visitDate).toISOString().split('T')[0];
      if (recordDate !== dateFilter) {
        return false;
      }
    }
    
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        record.diagnosis.toLowerCase().includes(searchLower) ||
        record.symptoms.some(s => s.toLowerCase().includes(searchLower)) ||
        record.notes.toLowerCase().includes(searchLower) ||
        `${record.doctor.firstName} ${record.doctor.lastName}`.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });
  
  const toggleDetailView = (recordId: string) => {
    setShowDetail(showDetail === recordId ? null : recordId);
  };
  
  return (
    <Container>
      <h1 className="my-4">Patient Medical Records</h1>
      
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}
      
      {/* Patient Selection for Staff */}
      {user?.role !== UserRole.PATIENT && (
        <Card className="mb-4">
          <Card.Body>
            <Card.Title as="h5">Select Patient</Card.Title>
            
            <Row>
              <Col md={8}>
                <Form.Group controlId="patientSelect">
                  <Form.Label>Patient:</Form.Label>
                  <Form.Select
                    value={selectedPatient || ''}
                    onChange={(e) => handlePatientChange(e.target.value)}
                    aria-label="Select patient"
                    disabled={loadingPatients}
                  >
                    <option value="">Select a patient</option>
                    {patients.map((patient) => (
                      <option key={patient._id} value={patient._id}>
                        {patient.firstName} {patient.lastName} {patient.medicalRecordNumber ? `(MRN: ${patient.medicalRecordNumber})` : ''}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
              
              {user?.role === UserRole.DOCTOR && selectedPatient && (
                <Col md={4} className="d-flex align-items-end">
                  <Button variant="primary" onClick={() => alert('Create new record feature to be implemented')}>
                    New Medical Record
                  </Button>
                </Col>
              )}
            </Row>

            {selectedPatient && patients.length > 0 && (
              <div className="mt-3 p-3 bg-light rounded">
                <h6 className="mb-2">Patient Information</h6>
                <Row className="g-3">
                  {(() => {
                    const patient = patients.find(p => p._id === selectedPatient);
                    if (!patient) return null;
                    
                    // Calculate age
                    const calculateAge = (dateOfBirth?: string): string => {
                      if (!dateOfBirth) return 'N/A';
                      
                      const birthDate = new Date(dateOfBirth);
                      const today = new Date();
                      let age = today.getFullYear() - birthDate.getFullYear();
                      const m = today.getMonth() - birthDate.getMonth();
                      
                      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                        age--;
                      }
                      
                      return age.toString();
                    };
                    
                    return (
                      <>
                        <Col md={3}>
                          <small className="d-block text-muted">Name</small>
                          <span>{patient.firstName} {patient.lastName}</span>
                        </Col>
                        {patient.medicalRecordNumber && (
                          <Col md={3}>
                            <small className="d-block text-muted">Medical Record #</small>
                            <span>{patient.medicalRecordNumber}</span>
                          </Col>
                        )}
                        {patient.dateOfBirth && (
                          <Col md={2}>
                            <small className="d-block text-muted">Age</small>
                            <span>{calculateAge(patient.dateOfBirth)}</span>
                          </Col>
                        )}
                        {patient.gender && (
                          <Col md={2}>
                            <small className="d-block text-muted">Gender</small>
                            <span className="capitalize">{patient.gender}</span>
                          </Col>
                        )}
                        {patient.bloodType && (
                          <Col md={2}>
                            <small className="d-block text-muted">Blood Type</small>
                            <span>{patient.bloodType}</span>
                          </Col>
                        )}
                        {patient.allergies && patient.allergies.length > 0 && (
                          <Col md={6}>
                            <small className="d-block text-muted">Allergies</small>
                            <span>{patient.allergies.join(', ')}</span>
                          </Col>
                        )}
                        {patient.emergencyContact && (
                          <Col md={6}>
                            <small className="d-block text-muted">Emergency Contact</small>
                            <span>{patient.emergencyContact}</span>
                          </Col>
                        )}
                      </>
                    );
                  })()}
                </Row>
              </div>
            )}
          </Card.Body>
        </Card>
      )}
      
      {/* Filters */}
      {(user?.role === UserRole.PATIENT || selectedPatient) && (
        <Card className="mb-4">
          <Card.Body>
            <Row className="align-items-center">
              <Col md={4}>
                <Form.Group controlId="dateFilter">
                  <InputGroup>
                    <InputGroup.Text>
                      <FaCalendarAlt />
                    </InputGroup.Text>
                    <Form.Control
                      type="date"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                    />
                  </InputGroup>
                </Form.Group>
              </Col>
              
              <Col md={8}>
                <InputGroup>
                  <InputGroup.Text>
                    <FaSearch />
                  </InputGroup.Text>
                  <Form.Control
                    type="text"
                    placeholder="Search diagnosis, symptoms, etc..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </InputGroup>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      )}
      
      {/* Records List */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" role="status" variant="primary">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      ) : filteredRecords.length === 0 ? (
        <Card className="text-center p-5">
          <div className="my-4">
            <FaFileAlt size={48} className="text-muted mb-3" />
            <h3>No medical records found</h3>
            <p className="text-muted">
              {searchTerm || dateFilter
                ? 'Try changing your search filters'
                : user?.role === UserRole.PATIENT
                ? 'Your medical records will appear here after appointments'
                : 'Select a patient to view their medical records'}
            </p>
          </div>
        </Card>
      ) : (
        <div>
          {filteredRecords.map((record) => (
            <Card key={record._id} className="mb-3">
              <Card.Header 
                as="div" 
                onClick={() => toggleDetailView(record._id)}
                className="cursor-pointer"
                style={{ cursor: 'pointer' }}
              >
                <Row>
                  <Col>
                    <h5 className="mb-0">{record.diagnosis}</h5>
                    <small className="text-muted">
                      Dr. {record.doctor.firstName} {record.doctor.lastName}
                      {record.doctor.specialization && ` - ${record.doctor.specialization}`}
                    </small>
                  </Col>
                  <Col xs="auto" className="text-end">
                    <div>{formatDate(record.visitDate)}</div>
                    {record.followUpDate && (
                      <small className="text-muted">
                        Follow-up: {formatDate(record.followUpDate)}
                      </small>
                    )}
                  </Col>
                </Row>
                <div className="mt-2">
                  <small>
                    <strong>Symptoms:</strong>{' '}
                    {record.symptoms.join(', ') || 'None recorded'}
                  </small>
                </div>
              </Card.Header>
              
              {/* Expanded Detail View */}
              {showDetail === record._id && (
                <Card.Body>
                  {/* Vitals Section */}
                  {record.vitals && Object.values(record.vitals).some(val => val !== undefined) && (
                    <div className="mb-4">
                      <h5 className="mb-3">Vitals</h5>
                      <Row>
                        {record.vitals.bloodPressure && (
                          <Col md={3} sm={6} className="mb-3">
                            <Card className="h-100 bg-light">
                              <Card.Body className="p-3">
                                <Card.Title as="h6" className="mb-1">Blood Pressure</Card.Title>
                                <div>{record.vitals.bloodPressure}</div>
                              </Card.Body>
                            </Card>
                          </Col>
                        )}
                        {record.vitals.heartRate && (
                          <Col md={3} sm={6} className="mb-3">
                            <Card className="h-100 bg-light">
                              <Card.Body className="p-3">
                                <Card.Title as="h6" className="mb-1">Heart Rate</Card.Title>
                                <div>{record.vitals.heartRate} bpm</div>
                              </Card.Body>
                            </Card>
                          </Col>
                        )}
                        {record.vitals.temperature && (
                          <Col md={3} sm={6} className="mb-3">
                            <Card className="h-100 bg-light">
                              <Card.Body className="p-3">
                                <Card.Title as="h6" className="mb-1">Temperature</Card.Title>
                                <div>{record.vitals.temperature} °F</div>
                              </Card.Body>
                            </Card>
                          </Col>
                        )}
                        {record.vitals.respiratoryRate && (
                          <Col md={3} sm={6} className="mb-3">
                            <Card className="h-100 bg-light">
                              <Card.Body className="p-3">
                                <Card.Title as="h6" className="mb-1">Respiratory Rate</Card.Title>
                                <div>{record.vitals.respiratoryRate} breaths/min</div>
                              </Card.Body>
                            </Card>
                          </Col>
                        )}
                        {record.vitals.oxygenSaturation && (
                          <Col md={3} sm={6} className="mb-3">
                            <Card className="h-100 bg-light">
                              <Card.Body className="p-3">
                                <Card.Title as="h6" className="mb-1">Oxygen Saturation</Card.Title>
                                <div>{record.vitals.oxygenSaturation}%</div>
                              </Card.Body>
                            </Card>
                          </Col>
                        )}
                        {record.vitals.height && (
                          <Col md={3} sm={6} className="mb-3">
                            <Card className="h-100 bg-light">
                              <Card.Body className="p-3">
                                <Card.Title as="h6" className="mb-1">Height</Card.Title>
                                <div>{record.vitals.height} cm</div>
                              </Card.Body>
                            </Card>
                          </Col>
                        )}
                        {record.vitals.weight && (
                          <Col md={3} sm={6} className="mb-3">
                            <Card className="h-100 bg-light">
                              <Card.Body className="p-3">
                                <Card.Title as="h6" className="mb-1">Weight</Card.Title>
                                <div>{record.vitals.weight} kg</div>
                              </Card.Body>
                            </Card>
                          </Col>
                        )}
                      </Row>
                    </div>
                  )}
                  
                  {/* Notes Section */}
                  <div className="mb-4">
                    <h5 className="mb-3">Notes</h5>
                    <Card body className="bg-light">
                      <p className="mb-0 white-space-pre-line" style={{ whiteSpace: 'pre-line' }}>
                        {record.notes}
                      </p>
                    </Card>
                  </div>
                  
                  {/* Prescriptions Section */}
                  {record.prescriptions.length > 0 && (
                    <div className="mb-4">
                      <h5 className="mb-3">Prescriptions</h5>
                      <ListGroup>
                        {record.prescriptions.map((prescription, index) => (
                          <ListGroup.Item key={index}>
                            <Row>
                              <Col>
                                <div className="d-flex justify-content-between">
                                  <strong>{prescription.medication}</strong>
                                  <span>{prescription.dosage}</span>
                                </div>
                                <div className="text-muted mt-1">
                                  {prescription.frequency} for {prescription.duration}
                                </div>
                                
                                {/* Display warnings and side effects if set to show to patient */}
                                {prescription.showWarningsToPatient && (
                                  <>
                                    {prescription.warnings && prescription.warnings.length > 0 && (
                                      <div className="mt-2">
                                        <strong className="text-warning d-flex align-items-center">
                                          <FaExclamationTriangle className="me-1" /> Warnings:
                                        </strong>
                                        <ul className="mb-2 small">
                                          {prescription.warnings.map((warning, idx) => (
                                            <li key={idx}>{warning}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                    
                                    {prescription.sideEffects && prescription.sideEffects.length > 0 && (
                                      <div className="mt-2">
                                        <strong className="text-info d-flex align-items-center">
                                          <FaInfoCircle className="me-1" /> Possible Side Effects:
                                        </strong>
                                        <ul className="mb-2 small">
                                          {prescription.sideEffects.map((effect, idx) => (
                                            <li key={idx}>{effect}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </>
                                )}
                                
                                {prescription.notes && (
                                  <div className="mt-2 fst-italic">{prescription.notes}</div>
                                )}
                              </Col>
                            </Row>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    </div>
                  )}
                  
                  {/* Attachments Section */}
                  {record.attachments && record.attachments.length > 0 && (
                    <div>
                      <h5 className="mb-3">Attachments</h5>
                      <div className="d-flex flex-wrap gap-2">
                        {record.attachments.map((attachment, index) => (
                          <Button
                            key={index}
                            href={attachment}
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="outline-primary"
                            size="sm"
                            className="d-flex align-items-center"
                          >
                            <FaFileAlt className="me-1" />
                            Attachment {index + 1}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </Card.Body>
              )}
            </Card>
          ))}
        </div>
      )}
    </Container>
  );
};

export default PatientHistory; 