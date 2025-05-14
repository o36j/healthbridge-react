import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Container, Row, Col, Card, ListGroup, Button, Badge, Spinner, Alert } from 'react-bootstrap';
import { FaStar, FaMapMarkerAlt, FaCalendarAlt, FaVideo, FaUserMd, FaGraduationCap, FaBriefcase, FaPhoneAlt, FaEnvelope } from 'react-icons/fa';
import LinkButton from '../components/common/LinkButton';

// API base URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SERVER_URL = API_URL.replace('/api', '');

// Helper function to safely format profile image URLs
const getProfileImageUrl = (photoPath?: string): string => {
  if (!photoPath) return '';
  
  // If it's already a blob URL, return it
  if (photoPath.startsWith('blob:')) {
    return photoPath;
  }

  // If it starts with http, it's an absolute URL
  if (photoPath.startsWith('http')) {
    return photoPath;
  }

  // Otherwise, it's a relative path, so prepend the server URL
  return `${SERVER_URL}${photoPath}`;
};

// Default fallback image for doctors without photos
import defaultDoctorImage from '../assets/doctor_images/Dr. John Smith.png';

// Type definition for Doctor from API
interface Doctor {
  _id: string;
  firstName: string;
  lastName: string;
  email?: string;
  role: string;
  profilePhoto?: string;
  department?: string;
  specialization?: string;
  rating?: number;
  ratingCount?: number;
  createdAt: string;
  lastLogin?: string;
  active: boolean;
  education?: string[];
  acceptsNewPatients?: boolean;
  experience?: number;
  location?: string;
  telehealth?: boolean;
  phone?: string;
  bio?: string;
  availability?: string | {
    monday?: string;
    tuesday?: string;
    wednesday?: string;
    thursday?: string;
    friday?: string;
    saturday?: string;
    sunday?: string;
  };
}

const DoctorDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Fetch doctor data on component mount
  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/users/public/doctors`);
        
        // Find the doctor with matching ID
        const foundDoctor = response.data.users.find((doc: Doctor) => doc._id === id);
        
        if (foundDoctor) {
          setDoctor(foundDoctor);
        } else {
          setError('Doctor not found');
        }
      } catch (err) {
        console.error('Failed to fetch doctor details:', err);
        setError('Failed to load doctor details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDoctor();
    } else {
      setError('Doctor ID is missing');
      setLoading(false);
    }
  }, [id]);

  // Render star ratings
  const renderStarRating = (rating: number = 0) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <FaStar 
          key={i} 
          className={i < Math.floor(rating) ? 'text-warning' : 'text-muted'} 
          size={20}
        />
      );
    }
    return stars;
  };

  // Format doctor name
  const getDoctorName = (doctor: Doctor) => {
    return `Dr. ${doctor.firstName} ${doctor.lastName}`;
  };

  // Get experience text
  const getExperienceText = (doctor: Doctor) => {
    return doctor.experience ? `${doctor.experience}+ years` : 'Experienced';
  };

  // Get doctor image
  const getDoctorImage = (doctor: Doctor) => {
    if (doctor.profilePhoto) {
      return getProfileImageUrl(doctor.profilePhoto);
    }
    return defaultDoctorImage;
  };

  // Helper function to format availability
  const formatAvailability = (availability: any) => {
    if (!availability) return 'Contact for availability';
    
    if (typeof availability === 'string') {
      try {
        availability = JSON.parse(availability);
      } catch (e) {
        return availability;
      }
    }
    
    return (
      <ListGroup variant="flush">
        {Object.entries(availability).map(([day, hours]) => (
          <ListGroup.Item key={day} className="d-flex justify-content-between align-items-center border-0 px-0 py-2">
            <span className="text-capitalize">{day}:</span>
            <span>{hours}</span>
          </ListGroup.Item>
        ))}
      </ListGroup>
    );
  };

  // Generate a summary of the doctor's profile
  const generateDoctorSummary = (doctor: Doctor) => {
    const items = [];
    
    if (doctor.experience) {
      items.push(`${doctor.experience}+ years of experience`);
    }
    
    if (doctor.department || doctor.specialization) {
      items.push(`Specialized in ${doctor.specialization || doctor.department}`);
    }
    
    if (doctor.education && doctor.education.length > 0) {
      items.push(`Educated at ${doctor.education[0]}`);
    }
    
    if (doctor.acceptsNewPatients !== false) {
      items.push('Currently accepting new patients');
    }
    
    if (doctor.telehealth !== false) {
      items.push('Offers virtual visits');
    }
    
    return items.join('. ');
  };

  // Handle booking appointment
  const handleBookAppointment = () => {
    navigate('/appointments/book', { state: { selectedDoctor: doctor } });
  };

  if (loading) {
    return (
      <Container className="py-5">
        <div className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Loading doctor profile...</p>
        </div>
      </Container>
    );
  }

  if (error || !doctor) {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <Alert.Heading>Error</Alert.Heading>
          <p>{error || 'Could not find doctor'}</p>
          <div className="d-flex justify-content-end">
            <Button variant="outline-danger" onClick={() => navigate('/doctors')}>
              Back to Doctors
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row>
        <Col lg={4} className="mb-4 mb-lg-0">
          <Card className="border-0 shadow-sm">
            <Card.Body className="text-center">
              <div className="doctor-avatar mb-3">
                <img 
                  src={getDoctorImage(doctor)} 
                  alt={getDoctorName(doctor)}
                  className="img-fluid rounded-circle mx-auto d-block"
                  style={{ width: '200px', height: '200px', objectFit: 'cover' }}
                />
              </div>
              <h2 className="fw-bold mb-1">{getDoctorName(doctor)}</h2>
              <p className="text-muted mb-3">{doctor.specialization || doctor.department || 'Medical Professional'}</p>
              
              <div className="d-flex justify-content-center align-items-center mb-3">
                <div className="me-2">
                  {renderStarRating(doctor.rating || 0)}
                </div>
                <span className="text-primary fw-bold">{doctor.rating?.toFixed(1) || '0.0'}</span>
                <span className="text-muted ms-1">({doctor.ratingCount || 0} reviews)</span>
              </div>
              
              <p className="mb-4">{doctor.bio || generateDoctorSummary(doctor)}</p>
              
              <Button 
                variant="primary" 
                className="w-100 mb-2"
                onClick={handleBookAppointment}
              >
                Book Appointment
              </Button>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={8}>
          <Card className="border-0 shadow-sm mb-4">
            <Card.Header className="bg-white py-3">
              <h3 className="fw-bold mb-0">Doctor Information</h3>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6} className="mb-4">
                  <h4 className="fw-bold mb-3">
                    <FaUserMd className="text-primary me-2" />
                    Specialization
                  </h4>
                  <p>{doctor.specialization || doctor.department || 'General Medicine'}</p>
                  
                  <h4 className="fw-bold mb-3 mt-4">
                    <FaBriefcase className="text-primary me-2" />
                    Experience
                  </h4>
                  <p>{getExperienceText(doctor)} of experience in medical practice</p>
                  
                  <h4 className="fw-bold mb-3 mt-4">
                    <FaGraduationCap className="text-primary me-2" />
                    Education
                  </h4>
                  {doctor.education && doctor.education.length > 0 ? (
                    <ul className="list-unstyled">
                      {doctor.education.map((edu, index) => (
                        <li key={index} className="mb-2">{edu}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>Medical Professional</p>
                  )}
                </Col>
                
                <Col md={6}>
                  <h4 className="fw-bold mb-3">
                    <FaMapMarkerAlt className="text-primary me-2" />
                    Location
                  </h4>
                  <p>{doctor.location || 'Multiple Locations'}</p>
                  
                  <h4 className="fw-bold mb-3 mt-4">
                    <FaCalendarAlt className="text-primary me-2" />
                    Accepting New Patients
                  </h4>
                  <p>
                    {doctor.acceptsNewPatients !== false ? (
                      <Badge bg="success">Yes</Badge>
                    ) : (
                      <Badge bg="danger">No</Badge>
                    )}
                  </p>
                  
                  <h4 className="fw-bold mb-3 mt-4">
                    <FaVideo className="text-primary me-2" />
                    Virtual Visits
                  </h4>
                  <p>
                    {doctor.telehealth !== false ? (
                      <Badge bg="success">Available</Badge>
                    ) : (
                      <Badge bg="danger">Not Available</Badge>
                    )}
                  </p>
                  
                  {doctor.phone && (
                    <>
                      <h4 className="fw-bold mb-3 mt-4">
                        <FaPhoneAlt className="text-primary me-2" />
                        Contact
                      </h4>
                      <p>{doctor.phone}</p>
                    </>
                  )}
                </Col>
              </Row>
            </Card.Body>
          </Card>
          
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white py-3">
              <h3 className="fw-bold mb-0">Availability Schedule</h3>
            </Card.Header>
            <Card.Body>
              {formatAvailability(doctor.availability)}
              
              <div className="d-flex justify-content-center mt-4">
                <Button 
                  variant="primary"
                  size="lg"
                  onClick={handleBookAppointment}
                >
                  Book an Appointment
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default DoctorDetail; 