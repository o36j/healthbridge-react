import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Form, Button, Alert, InputGroup, Spinner, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaSyringe, FaSearch, FaCheck, FaTimes, FaClock, FaUserInjured, FaCheckCircle } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
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
}

interface PatientHistoryRecord {
  _id: string;
  patient: Patient;
  doctor: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  visitDate: string;
  diagnosis: string;
  prescriptions: Prescription[];
  createdAt: string;
}

interface Medication {
  _id: string;
  patient: Patient;
  medicationName: string;
  dosage: string;
  route: string;
  frequency: string;
  prescribedBy: string;
  prescribedDate: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'discontinued';
  notes: string;
  patientHistoryId: string;
  lastAdministered?: string;
}

interface MedicationAdministration {
  _id: string;
  medication: Medication;
  administeredBy: string;
  administeredDate: string;
  status: 'scheduled' | 'administered' | 'missed' | 'refused';
  notes: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const NurseMedications: React.FC = () => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [administrations, setAdministrations] = useState<MedicationAdministration[]>([]);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [loading, setLoading] = useState(false);
  const [adminLoading, setAdminLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'administered' | 'missed' | 'refused'>('administered');
  const { user } = useAuth();

  useEffect(() => {
    fetchMedications();
    
    // Load saved administrations from localStorage
    const savedAdministrations = localStorage.getItem('medicationAdministrations');
    if (savedAdministrations) {
      try {
        setAdministrations(JSON.parse(savedAdministrations));
      } catch (err) {
        console.error('Error parsing saved administrations:', err);
      }
    }
  }, []);
  
  // Save administrations to localStorage whenever they change
  useEffect(() => {
    if (administrations.length > 0) {
      localStorage.setItem('medicationAdministrations', JSON.stringify(administrations));
    }
  }, [administrations]);

  const fetchMedications = async () => {
    setLoading(true);
    setError(null);
    try {
      // Get all patient history records with prescriptions
      const response = await axios.get(`${API_URL}/patient-history`);
      
      if (!response.data || !response.data.patientHistory) {
        throw new Error('Invalid response from server');
      }

      // Convert PatientHistoryRecord prescriptions to Medication format
      const medicationsFromHistory: Medication[] = [];
      
      response.data.patientHistory.forEach((record: PatientHistoryRecord) => {
        // Skip if patient or doctor information is missing
        if (!record.patient || !record.doctor) {
          console.warn('Skipping record with missing patient or doctor data:', record._id);
          return;
        }
        
        if (record.prescriptions && record.prescriptions.length > 0) {
          record.prescriptions.forEach(prescription => {
            // Skip if medication name or dosage is missing
            if (!prescription.medication || !prescription.dosage) {
              console.warn('Skipping prescription with missing medication data in record:', record._id);
              return;
            }
            
            // Only include active medications by checking if the prescription would still be active
            const startDate = new Date(record.visitDate);
            const now = new Date();
            
            // Determine end date based on duration (assuming duration is in format like "7 days", "2 weeks", etc.)
            let endDate: Date | null = null;
            if (prescription.duration) {
              const durationParts = prescription.duration.split(' ');
              if (durationParts.length >= 2) {
                const amount = parseInt(durationParts[0], 10);
                const unit = durationParts[1].toLowerCase();
                
                if (!isNaN(amount)) {
                  endDate = new Date(startDate);
                  if (unit.includes('day')) {
                    endDate.setDate(endDate.getDate() + amount);
                  } else if (unit.includes('week')) {
                    endDate.setDate(endDate.getDate() + amount * 7);
                  } else if (unit.includes('month')) {
                    endDate.setMonth(endDate.getMonth() + amount);
                  }
                }
              }
            }
            
            // If no end date could be determined or medication is still active
            const isActive = !endDate || endDate >= now;
            
            if (isActive) {
              medicationsFromHistory.push({
                _id: `${record._id}-${prescription.medication}`,
                patient: record.patient,
                medicationName: prescription.medication,
                dosage: prescription.dosage,
                route: prescription.dosage.includes('injection') ? 'Injection' : 
                       prescription.dosage.includes('IV') ? 'Intravenous' : 'Oral', // Try to infer route from dosage
                frequency: prescription.frequency,
                prescribedBy: `Dr. ${record.doctor.firstName} ${record.doctor.lastName}`,
                prescribedDate: record.visitDate,
                startDate: record.visitDate,
                endDate: endDate ? endDate.toISOString() : '',
                status: 'active',
                notes: prescription.notes || '',
                patientHistoryId: record._id
              });
            }
          });
        }
      });
      
      setMedications(medicationsFromHistory);
      
      // Get administrations if available, otherwise use empty array
      // In a real app, you would have an endpoint for this
      try {
        const adminResponse = await axios.get(`${API_URL}/medication-administrations`);
        setAdministrations(adminResponse.data.administrations || []);
      } catch (adminErr) {
        console.error('Error fetching administrations:', adminErr);
        // Use empty array if endpoint doesn't exist yet
        setAdministrations([]);
      }

    } catch (err) {
      console.error('Error fetching medications:', err);
      setError('Failed to load medications. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdministerMedication = async (medication: Medication) => {
    setSelectedMedication(medication);
    setNotes('');
    setSelectedStatus('administered');
  };

  const handleSubmitAdministration = async () => {
    if (!selectedMedication) return;
    
    setAdminLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Create a new administration
      const newAdministration: MedicationAdministration = {
        _id: `a${Date.now()}`,
        medication: selectedMedication,
        administeredBy: user?.firstName ? `${user.firstName} ${user.lastName}` : 'Current Nurse',
        administeredDate: new Date().toISOString(),
        status: selectedStatus,
        notes
      };
      
      // In a production app, we would send this to an API endpoint
      // const response = await axios.post(`${API_URL}/medication-administrations`, {
      //   medicationId: selectedMedication._id,
      //   patientId: selectedMedication.patient._id,
      //   status: selectedStatus,
      //   notes
      // });
      
      // For now, just update the state (localStorage persistence handled by useEffect)
      setAdministrations(prev => [newAdministration, ...prev]);
      
      // If this is an 'administered' status, we might want to update the medication status
      // This would typically be handled by the backend, but we're simulating it here
      if (selectedStatus === 'administered') {
        // Create a copy of medications with updated status for the administered one
        // In a real app, this would be an API call to update the medication status
        setMedications(prevMeds => 
          prevMeds.map(med => 
            med._id === selectedMedication._id
              ? { ...med, lastAdministered: new Date().toISOString() }
              : med
          )
        );
      }
      
      setSuccess(`Medication ${selectedStatus} successfully!`);
      setSelectedMedication(null);
    } catch (err) {
      console.error('Error recording administration:', err);
      setError('Failed to record medication administration. Please try again.');
    } finally {
      setAdminLoading(false);
    }
  };

  const cancelAdministration = () => {
    setSelectedMedication(null);
    setNotes('');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'administered':
        return <Badge bg="success">Administered</Badge>;
      case 'missed':
        return <Badge bg="warning">Missed</Badge>;
      case 'refused':
        return <Badge bg="danger">Refused</Badge>;
      case 'scheduled':
        return <Badge bg="primary">Scheduled</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  // Filter medications based on search term
  const filteredMedications = medications.filter(med => {
    const patientName = `${med.patient.firstName} ${med.patient.lastName}`.toLowerCase();
    const medicationName = med.medicationName.toLowerCase();
    const dosage = med.dosage.toLowerCase();
    const frequency = med.frequency.toLowerCase();
    return patientName.includes(searchTerm.toLowerCase()) || 
           medicationName.includes(searchTerm.toLowerCase()) ||
           dosage.includes(searchTerm.toLowerCase()) ||
           frequency.includes(searchTerm.toLowerCase());
  });

  // Get today's due medications
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const dueMedications = filteredMedications.filter(med => {
    const startDate = new Date(med.startDate);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = med.endDate ? new Date(med.endDate) : null;
    if (endDate) endDate.setHours(0, 0, 0, 0);
    
    return med.status === 'active' && 
           startDate <= today && 
           (!endDate || endDate >= today);
  });

  // Function to clear administration history (for testing)
  const clearAdministrationHistory = () => {
    if (window.confirm('Are you sure you want to clear all administration history? This cannot be undone.')) {
      setAdministrations([]);
      localStorage.removeItem('medicationAdministrations');
      setSuccess('Administration history cleared successfully.');
    }
  };

  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <div className="d-flex align-items-center mb-4">
            <FaSyringe className="text-primary me-3" style={{ fontSize: '2rem' }} />
            <div>
              <h2 className="mb-0">Medication Administration</h2>
              <p className="text-muted">Administer and track patient medications</p>
            </div>
          </div>
        </Col>
      </Row>

      {error && (
        <Row className="mb-4">
          <Col>
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              <Alert.Heading>Error Loading Medications</Alert.Heading>
              <p>{error}</p>
              <div className="d-flex justify-content-end">
                <Button variant="outline-danger" size="sm" onClick={() => fetchMedications()}>
                  Try Again
                </Button>
              </div>
            </Alert>
          </Col>
        </Row>
      )}

      {success && (
        <Row className="mb-4">
          <Col>
            <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
              {success}
            </Alert>
          </Col>
        </Row>
      )}

      {selectedMedication ? (
        <Row className="mb-4">
          <Col>
            <Card className="shadow-sm">
              <Card.Header className="bg-white">
                <h5 className="mb-0">Administer Medication</h5>
              </Card.Header>
              <Card.Body>
                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}
                
                <div className="alert alert-info mb-4">
                  <div className="d-flex align-items-center">
                    <FaUserInjured className="me-2" />
                    <strong className="me-2">Patient:</strong> 
                    {selectedMedication.patient.firstName} {selectedMedication.patient.lastName}
                  </div>
                  <div className="mt-2">
                    <strong className="me-2">Medication:</strong> 
                    {selectedMedication.medicationName} - {selectedMedication.dosage} ({selectedMedication.route})
                  </div>
                  <div className="mt-2">
                    <strong className="me-2">Frequency:</strong> 
                    {selectedMedication.frequency}
                  </div>
                </div>
                
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label>Administration Status</Form.Label>
                    <div>
                      <Form.Check
                        inline
                        type="radio"
                        id="status-administered"
                        label="Administered"
                        name="status"
                        checked={selectedStatus === 'administered'}
                        onChange={() => setSelectedStatus('administered')}
                      />
                      <Form.Check
                        inline
                        type="radio"
                        id="status-missed"
                        label="Missed"
                        name="status"
                        checked={selectedStatus === 'missed'}
                        onChange={() => setSelectedStatus('missed')}
                      />
                      <Form.Check
                        inline
                        type="radio"
                        id="status-refused"
                        label="Refused"
                        name="status"
                        checked={selectedStatus === 'refused'}
                        onChange={() => setSelectedStatus('refused')}
                      />
                    </div>
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Notes</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Enter any notes about this administration"
                    />
                  </Form.Group>
                  
                  <div className="d-flex justify-content-end">
                    <Button
                      variant="outline-secondary"
                      className="me-2"
                      onClick={cancelAdministration}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="primary"
                      onClick={handleSubmitAdministration}
                      disabled={adminLoading}
                    >
                      {adminLoading ? (
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                            className="me-2"
                          />
                          Recording...
                        </>
                      ) : (
                        <>
                          <FaCheckCircle className="me-2" />
                          Record {selectedStatus.charAt(0).toUpperCase() + selectedStatus.slice(1)}
                        </>
                      )}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      ) : (
        <>
          {/* Due Medications */}
          <Row className="mb-4">
            <Col>
              <Card className="shadow-sm">
                <Card.Header className="bg-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Due Medications</h5>
                    <InputGroup style={{ width: '300px' }}>
                      <InputGroup.Text>
                        <FaSearch />
                      </InputGroup.Text>
                      <Form.Control
                        type="text"
                        placeholder="Search patient or medication..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        aria-label="Search medications"
                      />
                    </InputGroup>
                  </div>
                </Card.Header>
                <Card.Body>
                  <div className="table-responsive">
                    <Table hover>
                      <thead>
                        <tr>
                          <th>Patient</th>
                          <th>Medication</th>
                          <th>Dosage</th>
                          <th>Route</th>
                          <th>Frequency</th>
                          <th>Prescribed</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr>
                            <td colSpan={7} className="text-center py-4">
                              <Spinner animation="border" role="status">
                                <span className="visually-hidden">Loading...</span>
                              </Spinner>
                            </td>
                          </tr>
                        ) : dueMedications.length > 0 ? (
                          dueMedications.map((med) => (
                            <tr key={med._id}>
                              <td>
                                <div className="d-flex align-items-center">
                                  <div className="me-2 bg-light rounded-circle d-flex align-items-center justify-content-center" style={{ width: '30px', height: '30px' }}>
                                    <span>{med.patient.firstName.charAt(0)}{med.patient.lastName.charAt(0)}</span>
                                  </div>
                                  <div>{med.patient.firstName} {med.patient.lastName}</div>
                                </div>
                              </td>
                              <td>
                                <strong>{med.medicationName}</strong>
                                {med.notes && <div className="small text-muted">{med.notes}</div>}
                              </td>
                              <td>{med.dosage}</td>
                              <td>{med.route}</td>
                              <td>{med.frequency}</td>
                              <td>{new Date(med.prescribedDate).toLocaleDateString()}</td>
                              <td>
                                <Button 
                                  variant="primary" 
                                  size="sm"
                                  onClick={() => handleAdministerMedication(med)}
                                >
                                  Administer
                                </Button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={7} className="text-center py-4">
                              {searchTerm ? (
                                <>No medications matching "{searchTerm}" found.</>
                              ) : (
                                <>No medications due at this time.</>
                              )}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Recent Administrations */}
          <Row className="mb-4">
            <Col>
              <Card className="shadow-sm">
                <Card.Header className="bg-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">Recent Administrations</h5>
                    {administrations.length > 0 && (
                      <Button
                        variant="outline-danger"
                        size="sm"
                        onClick={clearAdministrationHistory}
                      >
                        Clear History
                      </Button>
                    )}
                  </div>
                </Card.Header>
                <Card.Body>
                  <div className="table-responsive">
                    <Table hover>
                      <thead>
                        <tr>
                          <th>Patient</th>
                          <th>Medication</th>
                          <th>Date/Time</th>
                          <th>Status</th>
                          <th>Administered By</th>
                          <th>Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr>
                            <td colSpan={6} className="text-center py-4">
                              <Spinner animation="border" role="status">
                                <span className="visually-hidden">Loading...</span>
                              </Spinner>
                            </td>
                          </tr>
                        ) : administrations.length > 0 ? (
                          administrations.map((admin) => (
                            <tr key={admin._id}>
                              <td>
                                <div className="d-flex align-items-center">
                                  <div className="me-2 bg-light rounded-circle d-flex align-items-center justify-content-center" style={{ width: '30px', height: '30px' }}>
                                    <span>{admin.medication.patient.firstName.charAt(0)}{admin.medication.patient.lastName.charAt(0)}</span>
                                  </div>
                                  <div>{admin.medication.patient.firstName} {admin.medication.patient.lastName}</div>
                                </div>
                              </td>
                              <td>{admin.medication.medicationName}</td>
                              <td>{new Date(admin.administeredDate).toLocaleString()}</td>
                              <td>{getStatusBadge(admin.status)}</td>
                              <td>{admin.administeredBy}</td>
                              <td>{admin.notes}</td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={6} className="text-center py-4">
                              No recent medication administrations.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </Table>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </Container>
  );
};

export default NurseMedications; 