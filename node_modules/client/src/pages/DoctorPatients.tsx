import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Form, InputGroup, Button, Spinner, Alert, Pagination } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface Patient {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  lastVisit?: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const DoctorPatients: React.FC = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [patientsPerPage] = useState<number>(10);

  useEffect(() => {
    const fetchPatients = async () => {
      if (!user) return; // wait for user context
      setLoading(true);
      try {
        const response = await axios.get(`${API_URL}/appointments/user/${user.id}`);
        const appointments = response.data.appointments;
        // Extract unique patients from appointments
        const patientsMap = new Map<string, Patient>();
        appointments.forEach((appt: any) => {
          const p = appt.patient;
          if (p && !patientsMap.has(p._id)) {
            patientsMap.set(p._id, {
              _id: p._id,
              firstName: p.firstName,
              lastName: p.lastName,
              email: p.email,
              phone: p.phone || '',
              dateOfBirth: p.dateOfBirth || '',
              lastVisit: appt.date ? new Date(appt.date).toISOString() : undefined
            });
          }
        });
        const fetchedPatients = Array.from(patientsMap.values());
        setPatients(fetchedPatients);
        setFilteredPatients(fetchedPatients);
      } catch (err) {
        setError('Failed to fetch patients');
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [user]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredPatients(patients);
    } else {
      const searchTermLower = searchTerm.toLowerCase();
      const filtered = patients.filter(patient => 
        patient.firstName.toLowerCase().includes(searchTermLower) ||
        patient.lastName.toLowerCase().includes(searchTermLower) ||
        patient.email.toLowerCase().includes(searchTermLower) ||
        patient.phone.includes(searchTerm)
      );
      setFilteredPatients(filtered);
    }
    setCurrentPage(1);
  }, [searchTerm, patients]);

  // Get current patients for pagination
  const indexOfLastPatient = currentPage * patientsPerPage;
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
  const currentPatients = filteredPatients.slice(indexOfFirstPatient, indexOfLastPatient);

  // Calculate age from date of birth
  const calculateAge = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  // Change page
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <Container className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <h1>Patient Management</h1>
          <p>View and manage your patients</p>
        </Col>
      </Row>

      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Row className="mb-3">
            <Col>
              <InputGroup>
                <InputGroup.Text>
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search patients by name, email, or phone"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
          </Row>

          <div className="table-responsive">
            <Table hover>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Age</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Last Visit</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentPatients.length > 0 ? (
                  currentPatients.map((patient) => (
                    <tr key={patient._id}>
                      <td>
                        <Link 
                          to={`/doctor/patient-records/${patient._id}`}
                          className="text-decoration-none"
                        >
                          {patient.firstName} {patient.lastName}
                        </Link>
                      </td>
                      <td>{calculateAge(patient.dateOfBirth)}</td>
                      <td>{patient.email}</td>
                      <td>{patient.phone}</td>
                      <td>{formatDate(patient.lastVisit)}</td>
                      <td className="text-end">
                        <Link to={`/doctor/patient-records/${patient._id}`}>
                          <Button variant="outline-primary" size="sm" className="me-2">
                            View Records
                          </Button>
                        </Link>
                        <Link to={`/doctor/appointments/new?patientId=${patient._id}`}>
                          <Button variant="outline-success" size="sm">
                            Schedule
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-4">
                      {searchTerm ? 'No patients found matching your search.' : 'No patients found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>

          {filteredPatients.length > patientsPerPage && (
            <div className="d-flex justify-content-center mt-4">
              <Pagination>
                <Pagination.Prev 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                />
                
                {Array.from({ length: Math.ceil(filteredPatients.length / patientsPerPage) }).map((_, index) => (
                  <Pagination.Item 
                    key={index + 1}
                    active={index + 1 === currentPage}
                    onClick={() => paginate(index + 1)}
                  >
                    {index + 1}
                  </Pagination.Item>
                ))}
                
                <Pagination.Next 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredPatients.length / patientsPerPage)))}
                  disabled={currentPage === Math.ceil(filteredPatients.length / patientsPerPage)}
                />
              </Pagination>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default DoctorPatients; 