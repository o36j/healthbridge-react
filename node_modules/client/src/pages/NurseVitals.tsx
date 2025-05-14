import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Table, InputGroup, Alert, Spinner, Badge } from 'react-bootstrap';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { FaHeartbeat, FaUserPlus, FaSearch, FaArrowLeft, FaInfoCircle } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
}

interface BloodPressure {
  systolic: number;
  diastolic: number;
}

interface VitalSign {
  _id: string;
  patient: Patient;
  recordedBy: string;
  recordedDate: string;
  bloodPressure: BloodPressure;
  heartRate: number;
  respiratoryRate: number;
  temperature: number;
  oxygenSaturation: number;
  painLevel: number;
  notes: string;
  patientHistoryId?: string;
}

interface PatientHistoryVitals {
  bloodPressure?: string;
  heartRate?: number;
  respiratoryRate?: number;
  temperature?: number;
  weight?: number;
  height?: number;
  oxygenSaturation?: number;
  painLevel?: number;
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
  symptoms: string[];
  notes: string;
  vitals?: PatientHistoryVitals;
  createdBy: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}

interface Appointment {
  _id: string;
  patient: Patient;
  appointmentDate: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  reason: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const NurseVitals: React.FC = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [patients, setPatients] = useState<Patient[]>([]);
  const [vitalSigns, setVitalSigns] = useState<VitalSign[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<string>('');
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  
  const [systolic, setSystolic] = useState<number | ''>('');
  const [diastolic, setDiastolic] = useState<number | ''>('');
  const [heartRate, setHeartRate] = useState<number | ''>('');
  const [respiratoryRate, setRespiratoryRate] = useState<number | ''>('');
  const [temperature, setTemperature] = useState<number | ''>('');
  const [oxygenSaturation, setOxygenSaturation] = useState<number | ''>('');
  const [painLevel, setPainLevel] = useState<number | ''>('');
  const [notes, setNotes] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    fetchData();
    
    // Load saved vital signs from localStorage
    const savedVitalSigns = localStorage.getItem('vitalSigns');
    if (savedVitalSigns) {
      try {
        const parsed = JSON.parse(savedVitalSigns);
        setVitalSigns(prev => [...parsed, ...prev]);
      } catch (err) {
        console.error('Error parsing saved vital signs:', err);
      }
    }
  }, [appointmentId]);
  
  // Save vital signs to localStorage whenever they change
  useEffect(() => {
    if (vitalSigns.length > 0) {
      // Only save the locally created vital signs, not the ones from patient history
      const localVitalSigns = vitalSigns.filter(vital => !vital.patientHistoryId);
      if (localVitalSigns.length > 0) {
        localStorage.setItem('vitalSigns', JSON.stringify(localVitalSigns));
      }
    }
  }, [vitalSigns]);
  
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch patients
      const patientsResponse = await axios.get(`${API_URL}/users/patients/list`);
      if (patientsResponse.data && patientsResponse.data.users) {
        setPatients(patientsResponse.data.users);
      }
      
      // Fetch patient history records to extract vitals
      const historyResponse = await axios.get(`${API_URL}/patient-history`);
      if (historyResponse.data && historyResponse.data.patientHistory) {
        // Extract vital signs from patient history records
        const historyRecords: PatientHistoryRecord[] = historyResponse.data.patientHistory;
        const extractedVitals: VitalSign[] = [];
        
        historyRecords.forEach(record => {
          // Skip records with missing patient data
          if (!record.patient || !record.createdBy) {
            console.warn('Skipping record with missing patient or createdBy data:', record._id);
            return;
          }
          
          if (record.vitals && (
              record.vitals.heartRate || 
              record.vitals.bloodPressure || 
              record.vitals.temperature || 
              record.vitals.respiratoryRate || 
              record.vitals.oxygenSaturation)) {
            
            // Parse blood pressure (format: "120/80")
            let systolic = 0;
            let diastolic = 0;
            if (record.vitals.bloodPressure) {
              const bpParts = record.vitals.bloodPressure.split('/');
              if (bpParts.length === 2) {
                systolic = parseInt(bpParts[0].trim(), 10);
                diastolic = parseInt(bpParts[1].trim(), 10);
              }
            }
            
            extractedVitals.push({
              _id: `history-${record._id}`,
              patient: record.patient,
              recordedBy: `${record.createdBy.firstName || ''} ${record.createdBy.lastName || ''}`,
              recordedDate: record.visitDate,
              bloodPressure: {
                systolic: systolic || 0,
                diastolic: diastolic || 0
              },
              heartRate: record.vitals.heartRate || 0,
              respiratoryRate: record.vitals.respiratoryRate || 0,
              temperature: record.vitals.temperature || 0,
              oxygenSaturation: record.vitals.oxygenSaturation || 0,
              painLevel: record.vitals.painLevel || 0,
              notes: record.notes || '',
              patientHistoryId: record._id
            });
          }
        });
        
        // Add these to our vital signs collection
        if (extractedVitals.length > 0) {
          setVitalSigns(prev => [...extractedVitals, ...prev]);
        }
      }
      
      // If appointment ID is provided, fetch appointment details
      if (appointmentId) {
        const appointmentResponse = await axios.get(`${API_URL}/appointments/${appointmentId}`);
        if (appointmentResponse.data && appointmentResponse.data.appointment) {
          setAppointment(appointmentResponse.data.appointment);
          // Pre-select the patient from this appointment
          if (appointmentResponse.data.appointment.patient) {
            setSelectedPatient(appointmentResponse.data.appointment.patient._id);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPatient) {
      setError('Please select a patient');
      return;
    }
    
    if (systolic === '' || diastolic === '' || 
        heartRate === '' || temperature === '') {
      setError('Please fill in all required fields');
      return;
    }
    
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    try {
      // Get patient object
      const patient = patients.find(p => p._id === selectedPatient);
      if (!patient) {
        throw new Error('Patient not found');
      }
      
      // Create new vital sign record
      const newVitalSign: VitalSign = {
        _id: `local-${Date.now()}`,
        patient,
        recordedBy: user?.firstName ? `${user.firstName} ${user.lastName}` : 'Current Nurse',
        recordedDate: new Date().toISOString(),
        bloodPressure: {
          systolic: Number(systolic),
          diastolic: Number(diastolic)
        },
        heartRate: Number(heartRate),
        respiratoryRate: Number(respiratoryRate) || 0,
        temperature: Number(temperature),
        oxygenSaturation: Number(oxygenSaturation) || 0,
        painLevel: Number(painLevel) || 0,
        notes
      };
      
      // In a production environment, we would save this to an API
      // const response = await axios.post(`${API_URL}/vitals`, {
      //   patientId: selectedPatient,
      //   bloodPressure: `${systolic}/${diastolic}`,
      //   heartRate: Number(heartRate),
      //   respiratoryRate: Number(respiratoryRate) || 0,
      //   temperature: Number(temperature),
      //   oxygenSaturation: Number(oxygenSaturation) || 0,
      //   painLevel: Number(painLevel) || 0,
      //   notes
      // });
      
      // Update state with the new vital sign (localStorage persistence handled by useEffect)
      setVitalSigns([newVitalSign, ...vitalSigns]);
      
      setSuccess('Vital signs recorded successfully!');
      
      // Reset form
      setSelectedPatient('');
      setSystolic('');
      setDiastolic('');
      setHeartRate('');
      setRespiratoryRate('');
      setTemperature('');
      setOxygenSaturation('');
      setPainLevel('');
      setNotes('');
      
      // If from appointment, navigate back
      if (appointmentId) {
        setTimeout(() => {
          navigate('/nurse/appointments');
        }, 1500);
      }
    } catch (err) {
      console.error('Error recording vital signs:', err);
      setError('Failed to record vital signs. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  // Function to clear vital sign history (for testing)
  const clearVitalSignHistory = () => {
    if (window.confirm('Are you sure you want to clear locally saved vital signs? This cannot be undone.')) {
      // Only remove the locally created vital signs, not the ones from patient history
      const historyVitalSigns = vitalSigns.filter(vital => vital.patientHistoryId);
      setVitalSigns(historyVitalSigns);
      localStorage.removeItem('vitalSigns');
      setSuccess('Locally saved vital signs cleared successfully.');
    }
  };
  
  // Filter vital signs based on search term
  const filteredVitalSigns = vitalSigns.filter(vital => {
    // Skip records with missing patient data
    if (!vital || !vital.patient) {
      return false;
    }
    
    const patientName = `${vital.patient.firstName || ''} ${vital.patient.lastName || ''}`.toLowerCase();
    const date = vital.recordedDate ? new Date(vital.recordedDate).toLocaleDateString() : '';
    
    return patientName.includes(searchTerm.toLowerCase()) || 
           date.includes(searchTerm.toLowerCase());
  });
  
  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <div className="d-flex align-items-center mb-4">
            {appointmentId && (
              <Button
                variant="outline-primary"
                className="me-3"
                onClick={() => navigate('/nurse/appointments')}
              >
                <FaArrowLeft /> Back to Appointments
              </Button>
            )}
            <FaHeartbeat className="text-primary me-3" style={{ fontSize: '2rem' }} />
            <div>
              <h2 className="mb-0">Patient Vital Signs</h2>
              <p className="text-muted">Record and track patient vital signs</p>
            </div>
          </div>
        </Col>
      </Row>
      
      {error && (
        <Row className="mb-4">
          <Col>
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              <Alert.Heading>Error</Alert.Heading>
              <p>{error}</p>
              <div className="d-flex justify-content-end">
                <Button variant="outline-danger" size="sm" onClick={() => fetchData()}>
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
      
      <Row>
        <Col lg={6} className="mb-4">
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-white">
              <h5 className="mb-0">
                {appointment ? `Record Vital Signs for ${appointment.patient.firstName} ${appointment.patient.lastName}` : 'Record Vital Signs'}
              </h5>
            </Card.Header>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                {!appointment && (
                  <Form.Group className="mb-3">
                    <Form.Label htmlFor="patientSelect">Select Patient</Form.Label>
                    <Form.Select 
                      id="patientSelect"
                      value={selectedPatient}
                      onChange={(e) => setSelectedPatient(e.target.value)}
                      disabled={!!appointment || loading}
                      aria-label="Select patient"
                      title="Select a patient to record vitals for"
                    >
                      <option value="">Select a patient</option>
                      {patients.map(patient => (
                        <option key={patient._id} value={patient._id}>
                          {patient.firstName} {patient.lastName}
                        </option>
                      ))}
                    </Form.Select>
                    {loading && patients.length === 0 && (
                      <div className="text-center mt-2">
                        <Spinner animation="border" size="sm" role="status" />
                        <span className="ms-2">Loading patients...</span>
                      </div>
                    )}
                  </Form.Group>
                )}
                
                <Row className="mb-3">
                  <Col sm={6}>
                    <Form.Group>
                      <Form.Label>Blood Pressure (mmHg) *</Form.Label>
                      <InputGroup>
                        <Form.Control 
                          type="number" 
                          placeholder="Systolic"
                          value={systolic}
                          onChange={(e) => setSystolic(e.target.value ? Number(e.target.value) : '')}
                          required
                          min={60}
                          max={250}
                          aria-label="Systolic blood pressure"
                        />
                        <InputGroup.Text>/</InputGroup.Text>
                        <Form.Control 
                          type="number" 
                          placeholder="Diastolic"
                          value={diastolic}
                          onChange={(e) => setDiastolic(e.target.value ? Number(e.target.value) : '')}
                          required
                          min={40}
                          max={180}
                          aria-label="Diastolic blood pressure"
                        />
                      </InputGroup>
                    </Form.Group>
                  </Col>
                  <Col sm={6}>
                    <Form.Group>
                      <Form.Label>Heart Rate (bpm) *</Form.Label>
                      <Form.Control 
                        type="number" 
                        placeholder="Heart rate"
                        value={heartRate}
                        onChange={(e) => setHeartRate(e.target.value ? Number(e.target.value) : '')}
                        required
                        min={30}
                        max={250}
                        aria-label="Heart rate"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Row className="mb-3">
                  <Col sm={6}>
                    <Form.Group>
                      <Form.Label>Temperature (°F) *</Form.Label>
                      <Form.Control 
                        type="number" 
                        placeholder="Temperature"
                        value={temperature}
                        onChange={(e) => setTemperature(e.target.value ? Number(e.target.value) : '')}
                        required
                        step="0.1"
                        min={95}
                        max={110}
                        aria-label="Temperature"
                      />
                    </Form.Group>
                  </Col>
                  <Col sm={6}>
                    <Form.Group>
                      <Form.Label>Respiratory Rate (breaths/min)</Form.Label>
                      <Form.Control 
                        type="number" 
                        placeholder="Respiratory rate"
                        value={respiratoryRate}
                        onChange={(e) => setRespiratoryRate(e.target.value ? Number(e.target.value) : '')}
                        min={8}
                        max={40}
                        aria-label="Respiratory rate"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Row className="mb-3">
                  <Col sm={6}>
                    <Form.Group>
                      <Form.Label>Oxygen Saturation (%)</Form.Label>
                      <Form.Control 
                        type="number" 
                        placeholder="Oxygen saturation"
                        value={oxygenSaturation}
                        onChange={(e) => setOxygenSaturation(e.target.value ? Number(e.target.value) : '')}
                        min={80}
                        max={100}
                        aria-label="Oxygen saturation"
                      />
                    </Form.Group>
                  </Col>
                  <Col sm={6}>
                    <Form.Group>
                      <Form.Label>Pain Level (0-10)</Form.Label>
                      <Form.Control 
                        type="number" 
                        placeholder="Pain level"
                        value={painLevel}
                        onChange={(e) => setPainLevel(e.target.value ? Number(e.target.value) : '')}
                        min={0}
                        max={10}
                        aria-label="Pain level"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                
                <Form.Group className="mb-3">
                  <Form.Label>Notes</Form.Label>
                  <Form.Control 
                    as="textarea" 
                    rows={3} 
                    placeholder="Enter any additional notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    aria-label="Notes"
                  />
                </Form.Group>
                
                <div className="d-grid">
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={loading}
                  >
                    {loading ? (
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
                      'Record Vital Signs'
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={6} className="mb-4">
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-white">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Recent Vital Signs</h5>
                <div className="d-flex gap-2">
                  <InputGroup style={{ width: '200px' }}>
                    <InputGroup.Text>
                      <FaSearch />
                    </InputGroup.Text>
                    <Form.Control
                      type="text"
                      placeholder="Search patient..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      aria-label="Search patients"
                    />
                  </InputGroup>
                  {vitalSigns.some(vital => !vital.patientHistoryId) && (
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={clearVitalSignHistory}
                      className="whitespace-nowrap"
                    >
                      Clear Local Records
                    </Button>
                  )}
                </div>
              </div>
            </Card.Header>
            <Card.Body>
              <div className="alert alert-info mb-3">
                <FaInfoCircle className="me-2" />
                Showing both vital signs from patient history and recently recorded vitals
              </div>
              <div className="table-responsive">
                <Table hover>
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>BP</th>
                      <th>HR</th>
                      <th>Temp</th>
                      <th>O₂</th>
                      <th>Date</th>
                      <th>Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && filteredVitalSigns.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-4">
                          <Spinner animation="border" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </Spinner>
                        </td>
                      </tr>
                    ) : filteredVitalSigns.length > 0 ? (
                      filteredVitalSigns.map((vital) => (
                        <tr key={vital._id}>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="me-2 bg-light rounded-circle d-flex align-items-center justify-content-center" style={{ width: '30px', height: '30px' }}>
                                <span>{vital.patient?.firstName?.charAt(0) || '?'}{vital.patient?.lastName?.charAt(0) || '?'}</span>
                              </div>
                              <div>{vital.patient?.firstName || 'Unknown'} {vital.patient?.lastName || 'Patient'}</div>
                            </div>
                          </td>
                          <td>
                            {vital.bloodPressure?.systolic || 0}/{vital.bloodPressure?.diastolic || 0}
                            {((vital.bloodPressure?.systolic || 0) > 140 || (vital.bloodPressure?.diastolic || 0) > 90) && 
                              <Badge bg="danger" className="ms-1">High</Badge>
                            }
                            {((vital.bloodPressure?.systolic || 0) < 90 || (vital.bloodPressure?.diastolic || 0) < 60) && 
                              <Badge bg="warning" className="ms-1">Low</Badge>
                            }
                          </td>
                          <td>
                            {vital.heartRate || 0}
                            {(vital.heartRate || 0) > 100 && <Badge bg="danger" className="ms-1">High</Badge>}
                            {(vital.heartRate || 0) < 60 && <Badge bg="warning" className="ms-1">Low</Badge>}
                          </td>
                          <td>
                            {(vital.temperature || 0).toFixed(1)}
                            {(vital.temperature || 0) > 99.5 && <Badge bg="danger" className="ms-1">Fever</Badge>}
                          </td>
                          <td>
                            {vital.oxygenSaturation || 0}%
                            {(vital.oxygenSaturation || 0) < 95 && <Badge bg="warning" className="ms-1">Low</Badge>}
                          </td>
                          <td>{vital.recordedDate ? new Date(vital.recordedDate).toLocaleDateString() : 'Unknown'}</td>
                          <td>
                            {vital.patientHistoryId 
                              ? <Badge bg="info">Medical Record</Badge> 
                              : <Badge bg="success">Nurse Record</Badge>}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="text-center py-4">
                          {searchTerm 
                            ? `No vital sign records found matching "${searchTerm}".` 
                            : 'No vital sign records found.'}
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
    </Container>
  );
};

export default NurseVitals; 