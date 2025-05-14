import { useState, useEffect } from 'react';
import { Form, Button, Card, Row, Col, ListGroup, Badge, Spinner, Alert } from 'react-bootstrap';
import { FaPrescriptionBottleAlt, FaTimes, FaPlus, FaPencilAlt, FaTrash, FaSearch, FaExclamationTriangle } from 'react-icons/fa';
import axios from 'axios';

interface Medication {
  _id: string;
  name: string;
  description?: string;
  warnings?: string[];
  sideEffects?: string[];
  dosageForm?: string;
  strength?: string;
  manufacturer?: string;
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

interface PrescriptionFormProps {
  prescriptions: Prescription[];
  onChange: (prescriptions: Prescription[]) => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const PrescriptionForm = ({ prescriptions, onChange }: PrescriptionFormProps) => {
  const [showForm, setShowForm] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [currentPrescription, setCurrentPrescription] = useState<Prescription>({
    medication: '',
    dosage: '',
    frequency: '',
    duration: '',
    notes: '',
    warnings: [],
    sideEffects: [],
    showWarningsToPatient: true
  });

  // Medication search state
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Medication[]>([]);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  // Reset form to default state
  const resetForm = () => {
    setCurrentPrescription({
      medication: '',
      dosage: '',
      frequency: '',
      duration: '',
      notes: '',
      warnings: [],
      sideEffects: [],
      showWarningsToPatient: true
    });
    setEditIndex(null);
    setShowForm(false);
    setSearchTerm('');
    setSearchResults([]);
    setSelectedMedication(null);
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Search for medications
  const searchMedications = async () => {
    if (!searchTerm.trim()) return;
    
    try {
      setIsSearching(true);
      setSearchError('');
      
      const response = await axios.get(`${API_URL}/medications?search=${searchTerm}`);
      setSearchResults(response.data.medications);
    } catch (error) {
      console.error('Error searching medications:', error);
      setSearchError('Failed to search medications');
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle medication selection
  const handleSelectMedication = (medication: Medication) => {
    setSelectedMedication(medication);
    setCurrentPrescription({
      ...currentPrescription,
      medicationId: medication._id,
      medication: medication.name,
      warnings: medication.warnings || [],
      sideEffects: medication.sideEffects || [],
    });
    setSearchResults([]);
    setSearchTerm('');
  };

  // Handle form field changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentPrescription(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setCurrentPrescription(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  // Add a new prescription or update existing one
  const handleSavePrescription = () => {
    // Validate required fields
    if (!currentPrescription.medication || !currentPrescription.dosage || !currentPrescription.frequency || !currentPrescription.duration) {
      return; // Don't save if required fields are missing
    }

    const updatedPrescriptions = [...prescriptions];
    
    if (editIndex !== null) {
      // Update existing prescription
      updatedPrescriptions[editIndex] = currentPrescription;
    } else {
      // Add new prescription
      updatedPrescriptions.push(currentPrescription);
    }
    
    onChange(updatedPrescriptions);
    resetForm();
  };

  // Edit an existing prescription
  const handleEditPrescription = (index: number) => {
    setCurrentPrescription(prescriptions[index]);
    setEditIndex(index);
    setShowForm(true);
  };

  // Remove a prescription
  const handleRemovePrescription = (index: number) => {
    const updatedPrescriptions = [...prescriptions];
    updatedPrescriptions.splice(index, 1);
    onChange(updatedPrescriptions);
  };

  // Handle search form submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    searchMedications();
  };

  // If a medication is manually entered, clear the selected medication reference
  useEffect(() => {
    if (selectedMedication && currentPrescription.medication !== selectedMedication.name) {
      setSelectedMedication(null);
      setCurrentPrescription(prev => ({
        ...prev,
        medicationId: undefined,
        warnings: [],
        sideEffects: []
      }));
    }
  }, [currentPrescription.medication, selectedMedication]);

  return (
    <Card className="shadow-sm mb-4">
      <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
        <h5 className="mb-0 fw-bold d-flex align-items-center">
          <FaPrescriptionBottleAlt className="me-2 text-primary" />
          Prescriptions
        </h5>
        {!showForm && (
          <Button 
            variant="outline-primary" 
            size="sm" 
            onClick={() => setShowForm(true)}
            className="d-flex align-items-center"
          >
            <FaPlus className="me-1" /> Add Medication
          </Button>
        )}
      </Card.Header>
      
      <Card.Body>
        {showForm ? (
          <Form>
            {/* Medication Search Section */}
            <Form.Group className="mb-3">
              <Form.Label>Search Medication</Form.Label>
              <div className="d-flex">
                <Form.Control
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Type to search medications..."
                  className="me-2"
                />
                <Button 
                  variant="outline-primary" 
                  onClick={searchMedications}
                  disabled={isSearching || !searchTerm.trim()}
                >
                  {isSearching ? <Spinner size="sm" animation="border" /> : <FaSearch />}
                </Button>
              </div>
              <Form.Text className="text-muted">
                Search for a medication or enter a new one below
              </Form.Text>
            </Form.Group>
            
            {searchError && <Alert variant="danger">{searchError}</Alert>}
            
            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mb-3">
                <h6>Search Results</h6>
                <ListGroup className="mb-3">
                  {searchResults.map(med => (
                    <ListGroup.Item 
                      key={med._id} 
                      action 
                      onClick={() => handleSelectMedication(med)}
                      className="d-flex justify-content-between align-items-center"
                    >
                      <div>
                        <div><strong>{med.name}</strong></div>
                        {med.dosageForm && med.strength && (
                          <small className="text-muted">{med.dosageForm}, {med.strength}</small>
                        )}
                      </div>
                      {(med.warnings?.length || med.sideEffects?.length) > 0 && (
                        <Badge bg="warning" text="dark">
                          <FaExclamationTriangle className="me-1" /> Warnings
                        </Badge>
                      )}
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </div>
            )}
            
            {/* Manual Medication Entry */}
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Medication Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="medication"
                    value={currentPrescription.medication}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter medication name"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Dosage *</Form.Label>
                  <Form.Control
                    type="text"
                    name="dosage"
                    value={currentPrescription.dosage}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. 10mg"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Frequency *</Form.Label>
                  <Form.Control
                    type="text"
                    name="frequency"
                    value={currentPrescription.frequency}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. Once daily, Twice daily"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Duration *</Form.Label>
                  <Form.Control
                    type="text"
                    name="duration"
                    value={currentPrescription.duration}
                    onChange={handleInputChange}
                    required
                    placeholder="e.g. 7 days, 2 weeks"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            {/* Warnings and Side Effects Section */}
            {selectedMedication && (
              <>
                {selectedMedication.warnings && selectedMedication.warnings.length > 0 && (
                  <Form.Group className="mb-3">
                    <Form.Label>Warnings</Form.Label>
                    <div className="border rounded p-2 bg-light">
                      {selectedMedication.warnings.map((warning, idx) => (
                        <Badge bg="warning" text="dark" className="me-2 mb-2" key={idx}>
                          {warning}
                        </Badge>
                      ))}
                    </div>
                  </Form.Group>
                )}
                
                {selectedMedication.sideEffects && selectedMedication.sideEffects.length > 0 && (
                  <Form.Group className="mb-3">
                    <Form.Label>Side Effects</Form.Label>
                    <div className="border rounded p-2 bg-light">
                      {selectedMedication.sideEffects.map((effect, idx) => (
                        <Badge bg="info" text="dark" className="me-2 mb-2" key={idx}>
                          {effect}
                        </Badge>
                      ))}
                    </div>
                  </Form.Group>
                )}
                
                <Form.Group className="mb-3">
                  <Form.Check
                    type="checkbox"
                    id="showWarningsToPatient"
                    name="showWarningsToPatient"
                    label="Show warnings and side effects to patient"
                    checked={currentPrescription.showWarningsToPatient}
                    onChange={handleCheckboxChange}
                  />
                </Form.Group>
              </>
            )}
            
            <Form.Group className="mb-3">
              <Form.Label>Notes</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="notes"
                value={currentPrescription.notes || ''}
                onChange={handleInputChange}
                placeholder="Additional instructions or notes"
              />
            </Form.Group>
            
            <div className="d-flex justify-content-end gap-2">
              <Button 
                variant="outline-secondary" 
                onClick={resetForm}
                className="d-flex align-items-center"
              >
                <FaTimes className="me-1" /> Cancel
              </Button>
              <Button 
                variant="primary" 
                onClick={handleSavePrescription}
                className="d-flex align-items-center"
              >
                <FaPlus className="me-1" /> {editIndex !== null ? 'Update' : 'Add'} Medication
              </Button>
            </div>
          </Form>
        ) : (
          <div>
            {prescriptions.length === 0 ? (
              <div className="text-center py-4 text-muted">
                No medications prescribed yet. Click "Add Medication" to begin.
              </div>
            ) : (
              <ListGroup>
                {prescriptions.map((prescription, index) => (
                  <ListGroup.Item key={index} className="border rounded mb-2">
                    <div className="d-flex justify-content-between">
                      <div>
                        <h6 className="fw-bold mb-1">{prescription.medication}</h6>
                        <p className="mb-1 text-muted">
                          <Badge bg="light" text="dark" className="me-2">{prescription.dosage}</Badge>
                          <Badge bg="light" text="dark" className="me-2">{prescription.frequency}</Badge>
                          <Badge bg="light" text="dark">{prescription.duration}</Badge>
                        </p>
                        {(prescription.warnings?.length > 0 || prescription.sideEffects?.length > 0) && prescription.showWarningsToPatient && (
                          <div className="mb-2">
                            <small className="d-flex align-items-center text-warning">
                              <FaExclamationTriangle className="me-1" /> 
                              Patient will see warnings and side effects
                            </small>
                          </div>
                        )}
                        {prescription.notes && (
                          <p className="mb-0 small text-muted">{prescription.notes}</p>
                        )}
                      </div>
                      <div>
                        <Button 
                          variant="outline-secondary" 
                          size="sm" 
                          className="me-1"
                          onClick={() => handleEditPrescription(index)}
                        >
                          <FaPencilAlt />
                        </Button>
                        <Button 
                          variant="outline-danger" 
                          size="sm"
                          onClick={() => handleRemovePrescription(index)}
                        >
                          <FaTrash />
                        </Button>
                      </div>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            )}
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default PrescriptionForm; 