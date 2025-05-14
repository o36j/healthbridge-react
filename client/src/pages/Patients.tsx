import { useState, useEffect } from 'react';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import axios from 'axios';
import { FaSearch, FaFileMedical, FaUserPlus, FaFilter, FaSort, FaUserInjured } from 'react-icons/fa';
import { 
  Container, Row, Col, Card, Table, Badge, 
  Form, InputGroup, Dropdown, Tabs, Tab, 
  Alert, Spinner, Pagination
} from 'react-bootstrap';

interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodType?: string;
  allergies?: string[];
  emergencyContact?: string;
  profilePhoto?: string;
  createdAt: string;
  medicalRecordNumber?: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Patients = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterField, setFilterField] = useState('name');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [patientsPerPage] = useState(10);
  
  useEffect(() => {
    fetchPatients();
  }, []);
  
  const fetchPatients = async () => {
    try {
      setLoading(true);
      // Use the appropriate endpoint based on user role
      const endpoint = user?.role === UserRole.ADMIN 
        ? `${API_URL}/users?role=patient` 
        : `${API_URL}/users/patients/list`;
      
      const response = await axios.get(endpoint);
      setPatients(response.data.users);
    } catch (err) {
      setError('Failed to load patients');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Not provided';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };
  
  // Calculate age from date of birth
  const calculateAge = (dateOfBirth: string | undefined) => {
    if (!dateOfBirth) return 'N/A';
    
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };
  
  // Filter patients based on search term and filter field
  const filteredPatients = patients.filter((patient) => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    switch (filterField) {
      case 'name':
        return `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(searchLower);
      case 'email':
        return patient.email.toLowerCase().includes(searchLower);
      case 'phone':
        return patient.phone?.toLowerCase().includes(searchLower) || false;
      case 'bloodType':
        return patient.bloodType?.toLowerCase().includes(searchLower) || false;
      default:
        return true;
    }
  });

  // Get current patients for pagination
  const indexOfLastPatient = currentPage * patientsPerPage;
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
  const currentPatients = filteredPatients.slice(indexOfFirstPatient, indexOfLastPatient);
  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage);

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  
  // Pagination component
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    const items = [];
    for (let number = 1; number <= totalPages; number++) {
      items.push(
        <Pagination.Item key={number} active={number === currentPage} onClick={() => paginate(number)}>
          {number}
        </Pagination.Item>
      );
    }
    
    return (
      <Pagination className="justify-content-center mt-4">
        <Pagination.Prev 
          onClick={() => paginate(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
        />
        {items}
        <Pagination.Next 
          onClick={() => paginate(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
        />
      </Pagination>
    );
  };

  // Render blood type with appropriate badge
  const renderBloodType = (bloodType: string | undefined) => {
    if (!bloodType) return <span className="text-muted">Not specified</span>;
    
    const badgeVariant = 
      bloodType.includes('+') ? 'danger' : 
      bloodType.includes('-') ? 'primary' : 
      'secondary';
    
    return <Badge bg={badgeVariant}>{bloodType}</Badge>;
  };

  // Function to get the correct medical records URL based on user role
  const getMedicalRecordsUrl = (patientId: string) => {
    if (user?.role === UserRole.NURSE) {
      return '/nurse/medical-records'; // Nurse-specific route without patient ID (will be selected in the page)
    }
    return `/patient-history/${patientId}`;
  };

  return (
    <Container fluid className="py-4">
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Row className="align-items-center mb-3">
            <Col>
              <h1 className="h3 mb-0">
                <FaUserInjured className="me-2 text-primary" />
                Patient Management
              </h1>
            </Col>
            <Col xs="auto">
              {(user?.role === UserRole.ADMIN || user?.role === UserRole.NURSE) && (
                <Link to="/register">
                  <Button variant="primary">
                    <FaUserPlus className="me-2" /> Add New Patient
                  </Button>
                </Link>
              )}
            </Col>
          </Row>

          {error && (
            <Alert variant="danger" className="mb-4">
              {error}
            </Alert>
          )}

          <Row className="mb-4">
            <Col md={6} lg={8}>
              <InputGroup>
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search patients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Form.Label htmlFor="filterField" className="visually-hidden">Filter by field</Form.Label>
                <Form.Select
                  id="filterField"
                  value={filterField}
                  onChange={(e) => setFilterField(e.target.value)}
                  style={{ maxWidth: '150px' }}
                  aria-label="Filter by field"
                  title="Filter patients by field"
                >
                  <option value="name">Name</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone</option>
                  <option value="bloodType">Blood Type</option>
                </Form.Select>
              </InputGroup>
            </Col>
            <Col md={6} lg={4} className="d-flex justify-content-end align-items-center">
              <div className="btn-group">
                <Button 
                  variant={viewMode === 'table' ? 'primary' : 'outline'} 
                  size="sm"
                  onClick={() => setViewMode('table')}
                >
                  Table View
                </Button>
                <Button 
                  variant={viewMode === 'grid' ? 'primary' : 'outline'} 
                  size="sm"
                  onClick={() => setViewMode('grid')}
                >
                  Grid View
                </Button>
              </div>
            </Col>
          </Row>

          {/* Patient List View */}
          {loading ? (
            <div className="text-center p-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Loading patients...</p>
            </div>
          ) : filteredPatients.length === 0 ? (
            <Card className="text-center p-5 bg-light">
              <Card.Body>
                <FaFileMedical className="mb-3 text-muted" style={{ fontSize: '3rem' }} />
                <h3>No patients found</h3>
                <p className="text-muted">
                  {searchTerm
                    ? 'Try adjusting your search criteria'
                    : 'No patients have been registered yet'}
                </p>
              </Card.Body>
            </Card>
          ) : viewMode === 'table' ? (
            <div className="table-responsive">
              <Table hover className="align-middle">
                <thead className="bg-light">
                  <tr>
                    <th>Patient</th>
                    <th>Contact Info</th>
                    <th>Demographics</th>
                    <th>Medical Info</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentPatients.map((patient) => (
                    <tr key={patient._id}>
                      <td>
                        <div className="d-flex align-items-center">
                          <div style={{ width: '40px', height: '40px' }} className="me-3">
                            {patient.profilePhoto ? (
                              <img
                                className="rounded-circle w-100 h-100 object-fit-cover"
                                src={patient.profilePhoto}
                                alt={`${patient.firstName} ${patient.lastName}`}
                              />
                            ) : (
                              <div className="rounded-circle w-100 h-100 bg-light d-flex align-items-center justify-content-center">
                                <span className="text-secondary">
                                  {patient.firstName.charAt(0)}
                                  {patient.lastName.charAt(0)}
                                </span>
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="fw-bold">{patient.firstName} {patient.lastName}</div>
                            <div className="small text-muted d-flex align-items-center">
                              <span className="me-2">Registered: {new Date(patient.createdAt).toLocaleDateString()}</span>
                              {patient.medicalRecordNumber && (
                                <Badge bg="light" text="dark" pill>
                                  ID: {patient.medicalRecordNumber}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div>{patient.email}</div>
                        <div className="small text-muted">{patient.phone || 'No phone number'}</div>
                        {patient.emergencyContact && (
                          <div className="small text-danger mt-1">
                            <span className="fw-bold">Emergency:</span> {patient.emergencyContact}
                          </div>
                        )}
                      </td>
                      <td>
                        <div className="d-flex flex-column">
                          <div className="mb-1">
                            <span className="fw-semibold me-1">Age:</span>
                            {calculateAge(patient.dateOfBirth)}
                          </div>
                          <div>
                            <span className="fw-semibold me-1">Gender:</span>
                            <span className="text-capitalize">{patient.gender || 'Not specified'}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex flex-column">
                          <div className="mb-1">
                            <span className="fw-semibold me-1">Blood Type:</span>
                            {renderBloodType(patient.bloodType)}
                          </div>
                          <div>
                            <span className="fw-semibold me-1">Allergies:</span>
                            <span>
                              {patient.allergies && patient.allergies.length > 0
                                ? (
                                  <span className="text-danger">
                                    {patient.allergies.join(', ')}
                                  </span>
                                )
                                : <span className="text-success">None</span>}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex justify-content-end">
                          <Link to={getMedicalRecordsUrl(patient._id)}>
                            <Button size="sm">
                              Medical Records
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          ) : (
            <Row xs={1} md={2} lg={3} className="g-4">
              {currentPatients.map((patient) => (
                <Col key={patient._id}>
                  <Card className="h-100 shadow-sm">
                    <Card.Body className="d-flex flex-column">
                      <div className="d-flex align-items-center mb-3">
                        <div style={{ width: '60px', height: '60px' }} className="me-3">
                          {patient.profilePhoto ? (
                            <img
                              className="rounded-circle w-100 h-100 object-fit-cover"
                              src={patient.profilePhoto}
                              alt={`${patient.firstName} ${patient.lastName}`}
                            />
                          ) : (
                            <div className="rounded-circle w-100 h-100 bg-light d-flex align-items-center justify-content-center">
                              <span className="text-secondary fs-4">
                                {patient.firstName.charAt(0)}
                                {patient.lastName.charAt(0)}
                              </span>
                            </div>
                          )}
                        </div>
                        <div>
                          <h5 className="mb-0">{patient.firstName} {patient.lastName}</h5>
                          <div>
                            <Badge bg="info" pill className="me-1">
                              {calculateAge(patient.dateOfBirth)} years
                            </Badge>
                            <Badge bg="secondary" pill className="text-capitalize">
                              {patient.gender || 'No gender'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <Table size="sm" borderless className="mb-0">
                        <tbody>
                          <tr>
                            <td className="fw-semibold" style={{ width: '120px' }}>Email</td>
                            <td>{patient.email}</td>
                          </tr>
                          <tr>
                            <td className="fw-semibold">Phone</td>
                            <td>{patient.phone || 'Not provided'}</td>
                          </tr>
                          <tr>
                            <td className="fw-semibold">Blood Type</td>
                            <td>{renderBloodType(patient.bloodType)}</td>
                          </tr>
                          <tr>
                            <td className="fw-semibold">Allergies</td>
                            <td>
                              {patient.allergies && patient.allergies.length > 0
                                ? <span className="text-danger">{patient.allergies.join(', ')}</span>
                                : <span className="text-success">None</span>}
                            </td>
                          </tr>
                        </tbody>
                      </Table>
                      
                      <div className="mt-auto pt-3 d-flex justify-content-center">
                        <Link to={getMedicalRecordsUrl(patient._id)}>
                          <Button size="sm">
                            Medical Records
                          </Button>
                        </Link>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
          
          {renderPagination()}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Patients; 