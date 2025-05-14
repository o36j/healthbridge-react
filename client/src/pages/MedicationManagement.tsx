import { useState, useEffect } from 'react';
import {
  Container,
  Card,
  Table,
  Button,
  Form,
  Row,
  Col,
  Alert,
  Spinner,
  Badge,
  Modal,
  ListGroup,
  Dropdown,
  ButtonGroup
} from 'react-bootstrap';
import { FaPills, FaPlus, FaSearch, FaExclamationTriangle, FaChevronDown, FaFilter, FaCog, FaEllipsisV } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface Medication {
  _id: string;
  name: string;
  description?: string;
  warnings?: string[];
  sideEffects?: string[];
  dosageForm?: string;
  strength?: string;
  manufacturer?: string;
  createdAt: string;
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const MedicationManagement = () => {
  const { user } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingMedication, setEditingMedication] = useState<Medication | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    warnings: '',
    sideEffects: '',
    dosageForm: '',
    strength: '',
    manufacturer: ''
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalMedications, setTotalMedications] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [activeFilter, setActiveFilter] = useState('all');
  const [pageSize, setPageSize] = useState(10);
  const [initialLoad, setInitialLoad] = useState(true);

  // Fetch medications on component mount, page change, or filter change
  useEffect(() => {
    fetchMedications();
  }, [currentPage, activeFilter, searchTerm, pageSize]);

  // Fetch medications from API
  const fetchMedications = async () => {
    try {
      setLoading(true);
      setError('');
      
      const queryParams = new URLSearchParams();
      
      // Add search and filter params
      if (searchTerm) queryParams.append('search', searchTerm);
      if (activeFilter !== 'all') queryParams.append('filter', activeFilter);
      
      // Add pagination params
      queryParams.append('page', currentPage.toString());
      queryParams.append('limit', pageSize.toString());
      
      const response = await axios.get(`${API_URL}/medications?${queryParams.toString()}`);
      
      // If loading more, append to existing medications, otherwise replace them
      if (currentPage > 1 && !initialLoad) {
        setMedications(prev => [...prev, ...response.data.medications]);
      } else {
        setMedications(response.data.medications);
      }
      
      // Update pagination information
      setTotalMedications(response.data.pagination.total);
      setTotalPages(response.data.pagination.pages);
      setInitialLoad(false);
    } catch (err) {
      console.error('Error fetching medications:', err);
      setError('Failed to load medications');
    } finally {
      setLoading(false);
    }
  };

  // Handle search form submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1); // Reset to first page when searching
    setInitialLoad(true);
  };

  // Load more medications
  const handleLoadMore = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prevPage => prevPage + 1);
    }
  };

  // Change filter
  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    setCurrentPage(1); // Reset to first page when changing filter
    setInitialLoad(true);
  };

  // Open modal for creating new medication
  const handleAddNew = () => {
    setEditingMedication(null);
    setFormData({
      name: '',
      description: '',
      warnings: '',
      sideEffects: '',
      dosageForm: '',
      strength: '',
      manufacturer: ''
    });
    setFormError('');
    setFormSuccess('');
    setShowModal(true);
  };

  // Open modal for editing medication
  const handleEdit = (medication: Medication) => {
    setEditingMedication(medication);
    setFormData({
      name: medication.name,
      description: medication.description || '',
      warnings: medication.warnings?.join('\n') || '',
      sideEffects: medication.sideEffects?.join('\n') || '',
      dosageForm: medication.dosageForm || '',
      strength: medication.strength || '',
      manufacturer: medication.manufacturer || ''
    });
    setFormError('');
    setFormSuccess('');
    setShowModal(true);
  };

  // Handle viewing medication details
  const handleViewDetails = (medication: Medication) => {
    setSelectedMedication(medication);
    setShowDetailsModal(true);
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    
    if (!formData.name.trim()) {
      setFormError('Medication name is required');
      return;
    }
    
    try {
      // Prepare data for API
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        warnings: formData.warnings ? formData.warnings.split('\n').map(w => w.trim()).filter(Boolean) : [],
        sideEffects: formData.sideEffects ? formData.sideEffects.split('\n').map(s => s.trim()).filter(Boolean) : [],
        dosageForm: formData.dosageForm.trim() || undefined,
        strength: formData.strength.trim() || undefined,
        manufacturer: formData.manufacturer.trim() || undefined
      };
      
      let response;
      
      if (editingMedication) {
        // Update existing medication
        response = await axios.put(`${API_URL}/medications/${editingMedication._id}`, payload);
        setFormSuccess('Medication updated successfully');
      } else {
        // Create new medication
        response = await axios.post(`${API_URL}/medications`, payload);
        setFormSuccess('Medication created successfully');
      }
      
      // Reset pagination and reload medications
      setCurrentPage(1);
      setInitialLoad(true);
      fetchMedications();
      
      // Close modal after a delay
      setTimeout(() => {
        setShowModal(false);
      }, 1500);
    } catch (err) {
      console.error('Error saving medication:', err);
      if (axios.isAxiosError(err) && err.response) {
        setFormError(err.response.data.message || 'Failed to save medication');
      } else {
        setFormError('Failed to save medication');
      }
    }
  };

  // Handle medication deletion
  const handleDelete = async (medicationId: string) => {
    if (!window.confirm('Are you sure you want to delete this medication? This action cannot be undone.')) {
      return;
    }
    
    try {
      await axios.delete(`${API_URL}/medications/${medicationId}`);
      
      // Reset pagination and reload
      setCurrentPage(1);
      setInitialLoad(true);
      fetchMedications();
    } catch (err) {
      console.error('Error deleting medication:', err);
      setError('Failed to delete medication');
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Get filter display name
  const getFilterName = (filter: string) => {
    switch(filter) {
      case 'all': return 'All Medications';
      case 'recent': return 'Recently Added';
      case 'warnings': return 'With Warnings';
      default: return 'All Medications';
    }
  };

  return (
    <Container className="py-4">
      <Card className="mb-4 shadow-sm">
        <Card.Header className="bg-white py-3">
          <div className="d-flex flex-wrap justify-content-between align-items-center">
            <h3 className="mb-0 fw-bold d-flex align-items-center">
              <FaPills className="me-2 text-primary" />
              Medication Management
            </h3>
            
            <div className="d-flex align-items-center gap-2 mt-2 mt-md-0">
              <Dropdown as={ButtonGroup} align="end">
                <Button variant="outline-secondary" size="sm" onClick={() => handleFilterChange('all')}>
                  <FaFilter className="me-1" /> {getFilterName(activeFilter)}
                </Button>
                <Dropdown.Toggle split variant="outline-secondary" size="sm" id="filter-dropdown" />
                <Dropdown.Menu>
                  <Dropdown.Item active={activeFilter === 'all'} onClick={() => handleFilterChange('all')}>All Medications</Dropdown.Item>
                  <Dropdown.Item active={activeFilter === 'recent'} onClick={() => handleFilterChange('recent')}>Recently Added</Dropdown.Item>
                  <Dropdown.Item active={activeFilter === 'warnings'} onClick={() => handleFilterChange('warnings')}>With Warnings</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
              
              <Button 
                variant="primary" 
                onClick={handleAddNew} 
                className="d-flex align-items-center"
                size="sm"
              >
                <FaPlus className="me-1" /> Add Medication
              </Button>
            </div>
          </div>
        </Card.Header>
        
        <Card.Body>
          {/* Search Form */}
          <Form onSubmit={handleSearch} className="mb-4">
            <Row>
              <Col md={9} lg={10}>
                <Form.Control
                  type="text"
                  placeholder="Search medications by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </Col>
              <Col md={3} lg={2}>
                <Button 
                  type="submit" 
                  variant="outline-primary" 
                  className="w-100 d-flex align-items-center justify-content-center"
                >
                  <FaSearch className="me-1" /> Search
                </Button>
              </Col>
            </Row>
          </Form>
          
          {/* Error Alert */}
          {error && <Alert variant="danger">{error}</Alert>}
          
          {/* Medications Table */}
          {initialLoad && loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Loading medications...</p>
            </div>
          ) : medications.length === 0 ? (
            <Alert variant="info">
              {searchTerm 
                ? 'No medications found matching your search criteria.' 
                : 'No medications have been added yet.'}
            </Alert>
          ) : (
            <>
              <div className="table-responsive">
                <Table hover bordered className="align-middle">
                  <thead className="bg-light">
                    <tr>
                      <th>Name</th>
                      <th>Dosage Form</th>
                      <th>Strength</th>
                      <th>Warnings</th>
                      <th style={{ width: '120px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {medications.map(medication => (
                      <tr key={medication._id}>
                        <td>
                          <div className="fw-bold">{medication.name}</div>
                          {medication.manufacturer && (
                            <small className="text-muted">By: {medication.manufacturer}</small>
                          )}
                        </td>
                        <td>{medication.dosageForm || '-'}</td>
                        <td>{medication.strength || '-'}</td>
                        <td>
                          {medication.warnings && medication.warnings.length > 0 ? (
                            <Badge bg="warning" text="dark" className="d-flex align-items-center">
                              <FaExclamationTriangle className="me-1" /> 
                              {medication.warnings.length} warning(s)
                            </Badge>
                          ) : (
                            <span className="text-muted">None</span>
                          )}
                        </td>
                        <td>
                          <Dropdown align="end">
                            <Dropdown.Toggle variant="light" size="sm" id={`action-dropdown-${medication._id}`} className="border">
                              <FaEllipsisV />
                            </Dropdown.Toggle>
                            <Dropdown.Menu>
                              <Dropdown.Item onClick={() => handleViewDetails(medication)}>
                                Details
                              </Dropdown.Item>
                              <Dropdown.Item onClick={() => handleEdit(medication)}>
                                Edit
                              </Dropdown.Item>
                              <Dropdown.Divider />
                              <Dropdown.Item 
                                className="text-danger" 
                                onClick={() => handleDelete(medication._id)}
                              >
                                Delete
                              </Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
              
              {/* Load More Button */}
              {!loading && currentPage < totalPages && (
                <div className="text-center mt-3">
                  <Button 
                    variant="outline-secondary" 
                    onClick={handleLoadMore}
                    className="d-flex align-items-center mx-auto"
                  >
                    Load More <FaChevronDown className="ms-1" />
                  </Button>
                  <p className="text-muted mt-2 small">
                    Showing {medications.length} of {totalMedications} medications
                  </p>
                </div>
              )}
              
              {/* Loading indicator when loading more */}
              {!initialLoad && loading && (
                <div className="text-center mt-3">
                  <Spinner animation="border" size="sm" className="me-2" />
                  Loading more...
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>

      {/* Add/Edit Medication Modal */}
      <Modal show={showModal} onHide={() => !formSuccess && setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {editingMedication ? 'Edit Medication' : 'Add New Medication'}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {formError && <Alert variant="danger">{formError}</Alert>}
          {formSuccess && <Alert variant="success">{formSuccess}</Alert>}
          
          <Form onSubmit={handleSubmit}>
            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Medication Name *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </Form.Group>
              </Col>
              
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Manufacturer</Form.Label>
                  <Form.Control
                    type="text"
                    name="manufacturer"
                    value={formData.manufacturer}
                    onChange={handleInputChange}
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Dosage Form</Form.Label>
                  <Form.Control
                    type="text"
                    name="dosageForm"
                    value={formData.dosageForm}
                    onChange={handleInputChange}
                    placeholder="e.g., Tablet, Capsule, Liquid"
                  />
                </Form.Group>
              </Col>
              
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Strength</Form.Label>
                  <Form.Control
                    type="text"
                    name="strength"
                    value={formData.strength}
                    onChange={handleInputChange}
                    placeholder="e.g., 10mg, 500mg, 5ml"
                  />
                </Form.Group>
              </Col>
            </Row>
            
            <Form.Group className="mb-3">
              <Form.Label>Description</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                name="description"
                value={formData.description}
                onChange={handleInputChange}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Warnings</Form.Label>
              <Form.Text className="text-muted d-block mb-1">
                Enter each warning on a new line
              </Form.Text>
              <Form.Control
                as="textarea"
                rows={3}
                name="warnings"
                value={formData.warnings}
                onChange={handleInputChange}
                placeholder="e.g., Do not use if pregnant&#10;Avoid alcohol while taking this medication"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Side Effects</Form.Label>
              <Form.Text className="text-muted d-block mb-1">
                Enter each side effect on a new line
              </Form.Text>
              <Form.Control
                as="textarea"
                rows={3}
                name="sideEffects"
                value={formData.sideEffects}
                onChange={handleInputChange}
                placeholder="e.g., Dizziness&#10;Nausea&#10;Headache"
              />
            </Form.Group>
            
            <div className="d-flex justify-content-end mt-3">
              <Button 
                variant="secondary" 
                onClick={() => setShowModal(false)} 
                className="me-2"
                disabled={!!formSuccess}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="primary"
                disabled={!!formSuccess}
              >
                {editingMedication ? 'Update Medication' : 'Add Medication'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Medication Details Modal */}
      <Modal show={showDetailsModal} onHide={() => setShowDetailsModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Medication Details</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedMedication && (
            <div>
              <h4>{selectedMedication.name}</h4>
              
              {selectedMedication.manufacturer && (
                <p className="text-muted">Manufacturer: {selectedMedication.manufacturer}</p>
              )}
              
              <Row className="mb-3">
                <Col sm={6}>
                  <strong>Dosage Form:</strong> {selectedMedication.dosageForm || 'Not specified'}
                </Col>
                <Col sm={6}>
                  <strong>Strength:</strong> {selectedMedication.strength || 'Not specified'}
                </Col>
              </Row>
              
              {selectedMedication.description && (
                <div className="mb-3">
                  <h5>Description</h5>
                  <p>{selectedMedication.description}</p>
                </div>
              )}
              
              <h5>Warnings</h5>
              {selectedMedication.warnings && selectedMedication.warnings.length > 0 ? (
                <ListGroup variant="flush" className="mb-3">
                  {selectedMedication.warnings.map((warning, index) => (
                    <ListGroup.Item key={index} className="d-flex align-items-center">
                      <FaExclamationTriangle className="text-warning me-2" />
                      {warning}
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <p className="text-muted">No warnings specified</p>
              )}
              
              <h5>Side Effects</h5>
              {selectedMedication.sideEffects && selectedMedication.sideEffects.length > 0 ? (
                <ListGroup variant="flush">
                  {selectedMedication.sideEffects.map((effect, index) => (
                    <ListGroup.Item key={index}>{effect}</ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <p className="text-muted">No side effects specified</p>
              )}
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
            Close
          </Button>
          {selectedMedication && (
            <Button variant="primary" onClick={() => {
              setShowDetailsModal(false);
              handleEdit(selectedMedication);
            }}>
              Edit Medication
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default MedicationManagement; 