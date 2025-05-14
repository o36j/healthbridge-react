import { useState, useEffect } from 'react';
import { Container, Card, Alert, Spinner, Row, Col, Form, InputGroup, Button, Badge, ListGroup } from 'react-bootstrap';
import { FaCalendarAlt, FaSearch, FaFileAlt, FaNotesMedical, FaPrint, FaDownload, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { useAuth, UserRole } from '../contexts/AuthContext';
import axios from 'axios';

// Define interfaces
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

/**
 * NursePatientRecords Component
 * 
 * This component provides a specialized interface for nurses to view and manage patient medical records.
 * It includes functionality to:
 * - Search and filter patient records
 * - View detailed medical history
 * - Record vital signs
 * - Print and export medical record data
 */
const NursePatientRecords = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [records, setRecords] = useState<PatientHistoryRecord[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingPatients, setLoadingPatients] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [showDetail, setShowDetail] = useState<string | null>(null);
  
  // Initial loading of patients for selection
  useEffect(() => {
    fetchPatients();
  }, [user]);
  
  // Load patient history when a patient is selected
  useEffect(() => {
    if (selectedPatient) {
      fetchPatientHistory(selectedPatient);
    } else {
      setRecords([]);
    }
  }, [selectedPatient]);
  
  // Fetch list of patients
  const fetchPatients = async () => {
    try {
      setLoadingPatients(true);
      setError(null);
      
      // Use the working endpoint that we found in Patients.tsx
      const response = await axios.get(`${API_URL}/users/patients/list`);
      console.log('Patients data received:', response.data);
      setPatients(response.data.users || []);
    } catch (err: any) {
      console.error('Error fetching patients:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load patients';
      const statusCode = err.response?.status;
      setError(`Failed to load patients (${statusCode}): ${errorMessage}. Please try again.`);
    } finally {
      setLoadingPatients(false);
    }
  };
  
  // Fetch patient history records
  const fetchPatientHistory = async (patientId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_URL}/patient-history?patient=${patientId}`);
      console.log('Patient history data received:', response.data);
      
      // Check if the response has the expected structure
      if (response.data && Array.isArray(response.data.patientHistory)) {
        setRecords(response.data.patientHistory);
      } else {
        console.warn('Unexpected data structure in patient history response:', response.data);
        setRecords([]);
        // Don't set an error, just show empty records list
      }
    } catch (err: any) {
      console.error('Error fetching patient history:', err);
      const errorMessage = err.response?.data?.message || 'Failed to load records';
      const statusCode = err.response?.status;
      setError(`Failed to load medical records (${statusCode}): ${errorMessage}. Please try again.`);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle patient selection change
  const handlePatientChange = (patientId: string) => {
    setSelectedPatient(patientId);
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Format time for display
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Print patient record
  const handlePrintRecord = (recordId: string) => {
    window.print();
  };
  
  // Export record as PDF (mock functionality)
  const handleExportRecord = (recordId: string) => {
    alert('Export functionality will be implemented soon.');
  };
  
  // Toggle detail view expansion
  const toggleDetailView = (recordId: string) => {
    setShowDetail(showDetail === recordId ? null : recordId);
  };
  
  // Calculate age from date of birth
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
  
  // Filter records based on search term and date filter
  const filteredRecords = records.filter(record => {
    // Date filter
    if (dateFilter) {
      const recordDate = new Date(record.visitDate).toISOString().split('T')[0];
      if (recordDate !== dateFilter) {
        return false;
      }
    }
    
    // Search term filter
    if (searchTerm) {
      const searchTermLower = searchTerm.toLowerCase();
      const diagnosisMatch = record.diagnosis.toLowerCase().includes(searchTermLower);
      const symptomsMatch = record.symptoms.some(symptom => symptom.toLowerCase().includes(searchTermLower));
      const notesMatch = record.notes.toLowerCase().includes(searchTermLower);
      const doctorMatch = `${record.doctor.firstName} ${record.doctor.lastName}`.toLowerCase().includes(searchTermLower);
      
      if (!(diagnosisMatch || symptomsMatch || notesMatch || doctorMatch)) {
        return false;
      }
    }
    
    return true;
  });
  
  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center my-4">
        <h1>Patient Medical Records</h1>
        {selectedPatient && (
          <Button variant="outline-primary" onClick={() => setSelectedPatient(null)}>
            Change Patient
          </Button>
        )}
      </div>
      
      {/* Show error only if no patient is selected, otherwise errors are shown in their respective sections */}
      {!selectedPatient && error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}
      
      {/* Patient Selection */}
      {!selectedPatient ? (
        <Card className="mb-4">
          <Card.Body>
            <Card.Title as="h5">Select Patient</Card.Title>
            
            {loadingPatients ? (
              <div className="text-center py-4">
                <Spinner animation="border" role="status" variant="primary">
                  <span className="visually-hidden">Loading patients...</span>
                </Spinner>
              </div>
            ) : error ? (
              <div>
                <Alert variant="danger">{error}</Alert>
                <div className="mt-3 text-center">
                  <Button variant="primary" onClick={fetchPatients}>
                    Try Again
                  </Button>
                </div>
              </div>
            ) : patients.length === 0 ? (
              <div>
                <Alert variant="info">
                  No patient records found. This could be because no patients are registered in the system yet.
                </Alert>
              </div>
            ) : (
              <Row>
                <Col>
                  <Form.Group controlId="patientSelectDropdown">
                    <Form.Label htmlFor="patientSelectDropdown">Patient:</Form.Label>
                    <Form.Select
                      id="patientSelectDropdown"
                      onChange={(e) => handlePatientChange(e.target.value)}
                      aria-label="Select patient to view medical records"
                      title="Patient selection dropdown"
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
              </Row>
            )}
          </Card.Body>
        </Card>
      ) : (
        <>
          {/* Patient Information Card */}
          <Card className="mb-4">
            <Card.Body>
              <Card.Title as="h5" className="d-flex align-items-center mb-3">
                <FaNotesMedical className="text-primary me-2" />
                Patient Information
              </Card.Title>
              
              {(() => {
                const patient = patients.find(p => p._id === selectedPatient);
                if (!patient) return null;
                
                return (
                  <Row className="g-3">
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
                  </Row>
                );
              })()}
            </Card.Body>
          </Card>
          
          {/* Filters */}
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
          
          {/* Records List */}
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" role="status" variant="primary">
                <span className="visually-hidden">Loading records...</span>
              </Spinner>
            </div>
          ) : error ? (
            <div>
              <Alert variant="danger" className="mb-4">
                {error}
              </Alert>
              <div className="text-center my-4">
                <Button 
                  variant="primary" 
                  onClick={() => fetchPatientHistory(selectedPatient)}
                >
                  Try Again
                </Button>
              </div>
            </div>
          ) : filteredRecords.length === 0 ? (
            <Card className="text-center p-5">
              <div className="my-4">
                <FaFileAlt size={48} className="text-muted mb-3" />
                <h3>No medical records found</h3>
                <p className="text-muted">
                  {searchTerm || dateFilter
                    ? 'Try changing your search filters'
                    : 'This patient has no medical records yet'}
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
                    className="d-flex justify-content-between align-items-center"
                    style={{ cursor: 'pointer' }}
                  >
                    <div>
                      <h5 className="mb-0">{record.diagnosis}</h5>
                      <div className="text-muted small">
                        {formatDate(record.visitDate)} • Dr. {record.doctor.firstName} {record.doctor.lastName}
                        {record.doctor.specialization && ` • ${record.doctor.specialization}`}
                      </div>
                    </div>
                    <div>
                      {showDetail === record._id ? <FaChevronUp /> : <FaChevronDown />}
                    </div>
                  </Card.Header>
                  
                  {showDetail === record._id && (
                    <Card.Body>
                      <Row className="mb-4">
                        <Col md={8}>
                          <h6 className="mb-3">Diagnosis & Treatment</h6>
                          
                          {record.symptoms.length > 0 && (
                            <div className="mb-3">
                              <strong>Symptoms:</strong>
                              <div className="mt-1">
                                {record.symptoms.map((symptom, i) => (
                                  <Badge bg="light" text="dark" className="me-2 mb-2" key={i}>
                                    {symptom}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <div className="mb-3">
                            <strong>Notes:</strong>
                            <p className="mt-1">{record.notes}</p>
                          </div>
                          
                          {record.followUpDate && (
                            <div className="mb-3">
                              <strong>Follow-up Date:</strong>
                              <p className="mt-1">{formatDate(record.followUpDate)}</p>
                            </div>
                          )}
                        </Col>
                        
                        <Col md={4}>
                          {record.vitals && (
                            <div className="mb-4">
                              <h6 className="mb-3">Vital Signs</h6>
                              <ListGroup variant="flush">
                                {record.vitals.temperature && (
                                  <ListGroup.Item className="py-2 px-0 d-flex justify-content-between border-0">
                                    <span>Temperature:</span>
                                    <span>{record.vitals.temperature} °C</span>
                                  </ListGroup.Item>
                                )}
                                {record.vitals.bloodPressure && (
                                  <ListGroup.Item className="py-2 px-0 d-flex justify-content-between border-0">
                                    <span>Blood Pressure:</span>
                                    <span>{record.vitals.bloodPressure}</span>
                                  </ListGroup.Item>
                                )}
                                {record.vitals.heartRate && (
                                  <ListGroup.Item className="py-2 px-0 d-flex justify-content-between border-0">
                                    <span>Heart Rate:</span>
                                    <span>{record.vitals.heartRate} bpm</span>
                                  </ListGroup.Item>
                                )}
                                {record.vitals.respiratoryRate && (
                                  <ListGroup.Item className="py-2 px-0 d-flex justify-content-between border-0">
                                    <span>Respiratory Rate:</span>
                                    <span>{record.vitals.respiratoryRate} brpm</span>
                                  </ListGroup.Item>
                                )}
                                {record.vitals.oxygenSaturation && (
                                  <ListGroup.Item className="py-2 px-0 d-flex justify-content-between border-0">
                                    <span>Oxygen Saturation:</span>
                                    <span>{record.vitals.oxygenSaturation}%</span>
                                  </ListGroup.Item>
                                )}
                                {record.vitals.height && (
                                  <ListGroup.Item className="py-2 px-0 d-flex justify-content-between border-0">
                                    <span>Height:</span>
                                    <span>{record.vitals.height} cm</span>
                                  </ListGroup.Item>
                                )}
                                {record.vitals.weight && (
                                  <ListGroup.Item className="py-2 px-0 d-flex justify-content-between border-0">
                                    <span>Weight:</span>
                                    <span>{record.vitals.weight} kg</span>
                                  </ListGroup.Item>
                                )}
                              </ListGroup>
                            </div>
                          )}
                        </Col>
                      </Row>
                      
                      {record.prescriptions.length > 0 && (
                        <div className="mb-3">
                          <h6 className="mb-3">Prescribed Medications</h6>
                          <div className="table-responsive">
                            <table className="table table-bordered">
                              <thead>
                                <tr>
                                  <th>Medication</th>
                                  <th>Dosage</th>
                                  <th>Frequency</th>
                                  <th>Duration</th>
                                  <th>Notes</th>
                                </tr>
                              </thead>
                              <tbody>
                                {record.prescriptions.map((prescription, index) => (
                                  <tr key={index}>
                                    <td>{prescription.medication}</td>
                                    <td>{prescription.dosage}</td>
                                    <td>{prescription.frequency}</td>
                                    <td>{prescription.duration}</td>
                                    <td>{prescription.notes || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                      
                      <div className="d-flex justify-content-end mt-3">
                        <Button 
                          variant="outline-secondary" 
                          size="sm"
                          className="me-2"
                          onClick={() => handlePrintRecord(record._id)}
                        >
                          <FaPrint className="me-1" /> Print
                        </Button>
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={() => handleExportRecord(record._id)}
                        >
                          <FaDownload className="me-1" /> Export PDF
                        </Button>
                      </div>
                    </Card.Body>
                  )}
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </Container>
  );
};

export default NursePatientRecords; 