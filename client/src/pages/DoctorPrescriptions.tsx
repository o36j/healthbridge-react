import { useState, useEffect } from 'react';
import { Container, Card, Alert, Spinner, ListGroup, Button, Form, Row, Col } from 'react-bootstrap';
import { FaSearch, FaClipboardList, FaPrescriptionBottleAlt } from 'react-icons/fa';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Types
interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePhoto?: string;
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
  patient: Patient;
  visitDate: string;
  diagnosis: string;
  prescriptions: Prescription[];
  createdAt: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const DoctorPrescriptions = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [prescriptionRecords, setPrescriptionRecords] = useState<PatientHistoryRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<PatientHistoryRecord[]>([]);
  
  // Fetch prescription data
  useEffect(() => {
    const fetchPrescriptions = async () => {
      try {
        setLoading(true);
        setError('');
        
        const response = await axios.get(`${API_URL}/patient-history`);
        
        // Filter only records that have prescriptions
        const recordsWithPrescriptions = response.data.patientHistory.filter(
          (record: PatientHistoryRecord) => record.prescriptions && record.prescriptions.length > 0
        );
        
        setPrescriptionRecords(recordsWithPrescriptions);
        setFilteredRecords(recordsWithPrescriptions);
      } catch (err) {
        console.error(err);
        setError('Failed to load prescription data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPrescriptions();
  }, []);
  
  // Filter records based on search term
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredRecords(prescriptionRecords);
      return;
    }
    
    const searchLower = searchTerm.toLowerCase();
    
    // Search in patient name, medication name, diagnosis
    const filtered = prescriptionRecords.filter(record => {
      const patientName = `${record.patient.firstName} ${record.patient.lastName}`.toLowerCase();
      const diagnosisLower = record.diagnosis.toLowerCase();
      
      // Check if search term matches patient name or diagnosis
      if (patientName.includes(searchLower) || diagnosisLower.includes(searchLower)) {
        return true;
      }
      
      // Check if search term matches any medication
      return record.prescriptions.some(prescription => 
        prescription.medication.toLowerCase().includes(searchLower) ||
        prescription.dosage.toLowerCase().includes(searchLower)
      );
    });
    
    setFilteredRecords(filtered);
  }, [searchTerm, prescriptionRecords]);
  
  // Navigate to patient record
  const handleViewPatientRecord = (patientId: string) => {
    navigate(`/doctor/patient-records/${patientId}`);
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  return (
    <Container className="py-4">
      <h2 className="mb-4 fw-bold">Prescriptions</h2>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-white py-3">
          <Row className="align-items-center">
            <Col>
              <h4 className="mb-0 fw-bold d-flex align-items-center">
                <FaPrescriptionBottleAlt className="me-2 text-primary" />
                Prescription Management
              </h4>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-0">
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <FaSearch className="text-muted" />
                  </span>
                  <Form.Control
                    type="search"
                    placeholder="Search patient, medication..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border-start-0 bg-light"
                  />
                </div>
              </Form.Group>
            </Col>
          </Row>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Loading prescriptions...</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <Alert variant="info">
              {searchTerm 
                ? 'No prescriptions found matching your search criteria.' 
                : 'No prescriptions have been created yet.'}
            </Alert>
          ) : (
            <ListGroup>
              {filteredRecords.map(record => (
                <ListGroup.Item key={record._id} className="mb-3 border rounded">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h5 className="mb-0 fw-bold">
                      {record.patient.firstName} {record.patient.lastName}
                    </h5>
                    <div>
                      <small className="text-muted me-3">
                        Visit: {formatDate(record.visitDate)}
                      </small>
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={() => handleViewPatientRecord(record.patient._id)}
                      >
                        <FaClipboardList className="me-1" />
                        View Record
                      </Button>
                    </div>
                  </div>
                  
                  <p className="mb-2"><strong>Diagnosis:</strong> {record.diagnosis}</p>
                  
                  <h6 className="mb-2 mt-3 fw-bold text-primary">Prescribed Medications:</h6>
                  <ListGroup variant="flush">
                    {record.prescriptions.map((prescription, index) => (
                      <ListGroup.Item key={index} className="px-0 py-2">
                        <Row>
                          <Col md={3}>
                            <strong>{prescription.medication}</strong>
                          </Col>
                          <Col md={2}>
                            {prescription.dosage}
                          </Col>
                          <Col md={3}>
                            {prescription.frequency}
                          </Col>
                          <Col md={2}>
                            {prescription.duration}
                          </Col>
                          <Col md={2} className="text-muted">
                            {prescription.notes && (
                              <small>{prescription.notes}</small>
                            )}
                          </Col>
                        </Row>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default DoctorPrescriptions; 