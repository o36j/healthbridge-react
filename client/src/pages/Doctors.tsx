import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, InputGroup } from 'react-bootstrap';
import { FaStar, FaSearch, FaFilter, FaMapMarkerAlt, FaCalendarAlt, FaVideo } from 'react-icons/fa';
import LinkButton from '../components/common/LinkButton';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import createLogger from '../utils/logger';

const logger = createLogger('DoctorsPage');

// Import doctor images for fallback
import drSmithImage from '../assets/doctor_images/Dr. John Smith.png';
import drJohnsonImage from '../assets/doctor_images/Dr. Sarah Johnson.png';
import drChenImage from '../assets/doctor_images/Dr. Michael Chen.png';
import drWilsonImage from '../assets/doctor_images/Dr. Emily Wilson.png';
import drDavisImage from '../assets/doctor_images/Dr. Robert Davis.png';
import drKimImage from '../assets/doctor_images/Dr. Jessica Kim.png';

// Default fallback images for doctors without photos
const fallbackImages = [
  drSmithImage,
  drJohnsonImage,
  drChenImage,
  drWilsonImage,
  drDavisImage,
  drKimImage
];

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

// Pagination interface
interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

const Doctors: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedAvailability, setSelectedAvailability] = useState('');
  const [telehealthOnly, setTelehealthOnly] = useState(false);
  const [acceptingNewPatientsOnly, setAcceptingNewPatientsOnly] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  
  // Pagination state
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasMore: false
  });
  
  // Fetch doctors on component mount
  useEffect(() => {
    fetchDoctors();
  }, []);
  
  // Fetch doctors with pagination
  const fetchDoctors = async (page = 1, reset = true) => {
    try {
      if (reset) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      
      // Include search term in query if provided
      const params: Record<string, string> = {
        page: page.toString(),
        limit: '10'
      };
      
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      logger.info(`Fetching doctors (page ${page})`, { 
        searchTerm, 
        reset, 
        params 
      });
      
      const response = await axios.get(`${API_URL}/users/public/doctors`, { params });
      
      logger.debug('Doctors fetch response', { 
        count: response.data.users.length,
        total: response.data.pagination.total,
        page: response.data.pagination.page
      });
      
      if (reset) {
        // Replace current doctors list
        setDoctors(response.data.users);
      } else {
        // Append to current doctors list
        setDoctors(prev => [...prev, ...response.data.users]);
      }
      
      // Update pagination info
      setPagination(response.data.pagination);
    } catch (err) {
      logger.error('Failed to fetch doctors', err);
      setError('Failed to load doctors. Please try again later.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };
  
  // Handle load more button click
  const handleLoadMore = () => {
    fetchDoctors(pagination.page + 1, false);
  };
  
  // Handle search submission
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDoctors(1, true);
  };

  // Filter doctors based on search and filter criteria
  const filteredDoctors = doctors.filter(doctor => {
    // Only log filter details in debug mode to reduce noise
    logger.debug('Filtering doctor', { 
      name: `${doctor.firstName} ${doctor.lastName}`,
      department: doctor.department,
      selectedSpecialty,
      location: doctor.location,
      selectedLocation,
      telehealth: doctor.telehealth,
      telehealthOnly,
      acceptsNewPatients: doctor.acceptsNewPatients,
      acceptingNewPatientsOnly
    });
    
    const fullName = `${doctor.firstName} ${doctor.lastName}`;
    const matchesSearch = fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (doctor.department || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (doctor.specialization || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    // Department/specialty filter
    const matchesSpecialty = selectedSpecialty === '' || 
                           (doctor.department && doctor.department.toLowerCase() === selectedSpecialty.toLowerCase());
    
    // Location filter - case insensitive comparison
    const matchesLocation = selectedLocation === '' || 
                          (doctor.location && doctor.location.toLowerCase() === selectedLocation.toLowerCase());
    
    // Availability filter
    const getDayOfWeek = (offset = 0) => {
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const today = new Date();
      today.setDate(today.getDate() + offset);
      return days[today.getDay()];
    };
    
    let matchesAvailability = false;
    if (selectedAvailability === '') {
      matchesAvailability = true;
    } else {
      // Handle availability if it's a string (stringified JSON)
      let availabilityObj: Record<string, string> | undefined;
      
      if (typeof doctor.availability === 'string') {
        try {
          // Try to parse it as JSON
          availabilityObj = JSON.parse(doctor.availability);
        } catch (e) {
          logger.error(`Error parsing availability for doctor ${doctor._id}`, e);
          return false; // Skip this doctor if we can't parse availability
        }
      } else {
        availabilityObj = doctor.availability as Record<string, string> | undefined;
      }
      
      if (availabilityObj) {
        if (selectedAvailability === 'Available Today') {
          const today = getDayOfWeek();
          matchesAvailability = !!(availabilityObj[today] && 
                              availabilityObj[today] !== 'Not Available');
        } else if (selectedAvailability === 'Available Tomorrow') {
          const tomorrow = getDayOfWeek(1);
          matchesAvailability = !!(availabilityObj[tomorrow] && 
                              availabilityObj[tomorrow] !== 'Not Available');
        } else if (selectedAvailability === 'Available Next Week') {
          const nextWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
          matchesAvailability = !!nextWeek.some(day => 
                                availabilityObj![day] && 
                                availabilityObj![day] !== 'Not Available');
        }
      }
    }
    
    // Telehealth filter
    const matchesTelehealth = !telehealthOnly || doctor.telehealth === true;
    
    // Accepting new patients filter
    const matchesNewPatients = !acceptingNewPatientsOnly || doctor.acceptsNewPatients === true;
    
    return matchesSearch && matchesSpecialty && matchesLocation && 
           matchesAvailability && matchesTelehealth && matchesNewPatients;
  });
  
  // Get unique values for filter options
  const specialties = [...new Set(doctors.filter(d => d.department).map(doctor => doctor.department))];
  const locations = [...new Set(doctors.filter(d => d.location).map(doctor => doctor.location))];
  const availabilityOptions = ['Available Today', 'Available Tomorrow', 'Available Next Week'];
  
  // Render star ratings
  const renderStarRating = (rating: number = 0) => {
    const stars = [];
    for (let i = 0; i < 5; i++) {
      stars.push(
        <FaStar 
          key={i} 
          className={i < Math.floor(rating) ? 'text-warning' : 'text-muted'} 
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

  // Get doctor availability text
  const getDoctorAvailability = (doctor: Doctor) => {
    if (!doctor.availability) return 'Available by appointment';
    
    // Handle availability if it's a string (stringified JSON)
    if (typeof doctor.availability === 'string') {
      try {
        // Try to parse it as JSON
        const availabilityObj = JSON.parse(doctor.availability);
        doctor.availability = availabilityObj;
      } catch (e) {
        console.error('Error parsing availability string:', e);
        return 'Available by appointment';
      }
    }
    
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const today = days[new Date().getDay()];
    
    // Now availability is definitely an object
    const availabilityObj = doctor.availability as Record<string, string>;
    
    if (availabilityObj[today] && 
        availabilityObj[today] !== 'Not Available') {
      return 'Available Today';
    }
    
    // Check if available tomorrow
    const tomorrowIndex = (new Date().getDay() + 1) % 7;
    const tomorrow = days[tomorrowIndex];
    
    if (availabilityObj[tomorrow] && 
        availabilityObj[tomorrow] !== 'Not Available') {
      return 'Available Tomorrow';
    }
    
    // Check if available in the next week
    const availableDays = days.filter(day => 
      availabilityObj[day] && 
      availabilityObj[day] !== 'Not Available'
    );
    
    if (availableDays.length > 0) {
      return 'Available Next Week';
    }
    
    return 'Available by appointment';
  };

  // Get doctor image
  const getDoctorImage = (doctor: Doctor) => {
    if (doctor.profilePhoto) {
      return getProfileImageUrl(doctor.profilePhoto);
    }
    
    // If no profile photo, use a hash of the doctor's name to select a consistent fallback image
    const hash = doctor.firstName.charCodeAt(0) + doctor.lastName.charCodeAt(0);
    return fallbackImages[hash % fallbackImages.length];
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

  // Handle booking appointment with a specific doctor
  const handleBookAppointment = (doctor: Doctor) => {
    navigate('/appointments/book', { state: { selectedDoctor: doctor } });
  };

  // Handle filter changes
  const handleFilterChange = () => {
    // Reset to page 1 when any filter changes
    fetchDoctors(1, true);
  };
  
  // Update all onChange handlers for filters
  const handleSpecialtyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSpecialty(e.target.value);
    handleFilterChange();
  };
  
  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedLocation(e.target.value);
    handleFilterChange();
  };
  
  const handleAvailabilityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedAvailability(e.target.value);
    handleFilterChange();
  };
  
  const handleTelehealthChange = () => {
    setTelehealthOnly(!telehealthOnly);
    handleFilterChange();
  };
  
  const handleNewPatientsChange = () => {
    setAcceptingNewPatientsOnly(!acceptingNewPatientsOnly);
    handleFilterChange();
  };
  
  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedSpecialty('');
    setSelectedLocation('');
    setSelectedAvailability('');
    setTelehealthOnly(false);
    setAcceptingNewPatientsOnly(false);
    handleFilterChange();
  };

  return (
    <div className="doctors-page">
      {/* Hero Section */}
      <section className="bg-primary text-white py-5">
        <Container className="py-5">
          <Row className="justify-content-center text-center">
            <Col lg={8}>
              <h1 className="display-4 fw-bold mb-4">Find a Doctor</h1>
              <p className="lead mb-4">
                Connect with the best healthcare professionals. Browse our network of qualified doctors and find the right one for your needs.
              </p>
              <Form onSubmit={handleSearch}>
                <InputGroup className="mb-3 shadow">
                  <Form.Control
                    placeholder="Search by name, specialty, or department"
                    aria-label="Search doctors"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <Button variant="light" type="submit">
                    <FaSearch className="text-primary" />
                  </Button>
                </InputGroup>
              </Form>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Doctors Listing */}
      <section className="py-5">
        <Container className="py-4">
          <Row>
            {/* Filters sidebar */}
            <Col lg={3} className="mb-4 mb-lg-0">
              <Card className="border-0 shadow-sm">
                <Card.Body>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h4 className="fw-bold mb-0">
                      <FaFilter className="me-2 text-primary" />
                      Filters
                    </h4>
                    <Button 
                      variant="link" 
                      className="p-0 text-decoration-none" 
                      onClick={resetFilters}
                    >
                      Clear All
                    </Button>
                  </div>
                  
                  <Form>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-medium">Specialty</Form.Label>
                      <Form.Select 
                        value={selectedSpecialty}
                        onChange={handleSpecialtyChange}
                      >
                        <option value="">All Specialties</option>
                        {specialties.map(specialty => (
                          <option key={specialty} value={specialty}>{specialty}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-medium">Location</Form.Label>
                      <Form.Select 
                        value={selectedLocation}
                        onChange={handleLocationChange}
                      >
                        <option value="">All Locations</option>
                        {locations.map(location => (
                          <option key={location} value={location}>{location}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-medium">Availability</Form.Label>
                      <Form.Select 
                        value={selectedAvailability}
                        onChange={handleAvailabilityChange}
                      >
                        <option value="">Any Availability</option>
                        {availabilityOptions.map(option => (
                          <option key={option} value={option}>{option}</option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                    
                    <hr className="my-3" />
                    
                    <Form.Group className="mb-3">
                      <Form.Check 
                        type="checkbox"
                        id="telehealthOnly"
                        label="Virtual Visits Available"
                        checked={telehealthOnly}
                        onChange={handleTelehealthChange}
                      />
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Check 
                        type="checkbox"
                        id="acceptingNewPatients"
                        label="Accepting New Patients"
                        checked={acceptingNewPatientsOnly}
                        onChange={handleNewPatientsChange}
                      />
                    </Form.Group>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
            
            {/* Doctors list */}
            <Col lg={9}>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold mb-0">
                  {loading ? 'Loading Doctors...' : 
                   `${filteredDoctors.length} ${filteredDoctors.length === 1 ? 'Doctor' : 'Doctors'} Available`}
                  </h2>
                <div className="d-flex align-items-center">
                  <span className="text-muted me-2">Sort by:</span>
                  <Form.Select 
                    className="w-auto" 
                    aria-label="Sort doctors by" 
                    title="Sort doctors by">
                    <option>Relevance</option>
                    <option>Rating: High to Low</option>
                    <option>Name: A-Z</option>
                  </Form.Select>
                </div>
              </div>
              
              {loading ? (
                <Card className="border-0 shadow-sm">
                  <Card.Body className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3">Loading doctors...</p>
                  </Card.Body>
                </Card>
              ) : error ? (
                <Card className="border-0 shadow-sm">
                  <Card.Body className="text-center py-5">
                    <h4 className="fw-bold mb-3">Error loading doctors</h4>
                    <p className="text-muted mb-3">{error}</p>
                    <Button variant="primary" onClick={() => window.location.reload()}>
                      Try Again
                    </Button>
                  </Card.Body>
                </Card>
              ) : filteredDoctors.length === 0 ? (
                <Card className="border-0 shadow-sm">
                  <Card.Body className="text-center py-5">
                    <h4 className="fw-bold mb-3">No doctors match your criteria</h4>
                    <p className="text-muted mb-3">Try adjusting your filters or search terms.</p>
                    <Button variant="primary" onClick={resetFilters}>
                      Clear All Filters
                    </Button>
                  </Card.Body>
                </Card>
              ) : (
                <div className="doctor-list">
                  {filteredDoctors.map(doctor => (
                    <Card key={doctor._id} className="border-0 shadow-sm mb-4 hover-scale transition">
                      <Card.Body className="p-0">
                        <Row className="g-0">
                          <Col md={3}>
                            <div className="position-relative h-100">
                              <img src={getDoctorImage(doctor)} alt={getDoctorName(doctor)} className="doctor-img" />
                              <div className="doctor-speciality">{doctor.department || doctor.specialization || 'General Medicine'}</div>
                          </div>
                          </Col>
                          <Col md={9}>
                            <div className="p-4">
                              <div className="d-flex justify-content-between align-items-start">
                                <div>
                                    <h3 className="fw-bold mb-1">{getDoctorName(doctor)}</h3>
                                    <p className="text-muted mb-2">{getExperienceText(doctor)} experience</p>
                                    <div className="d-flex align-items-center mb-3">
                                      <div className="me-2">
                                        {renderStarRating(doctor.rating || 0)}
                                      </div>
                                      <span className="text-primary fw-bold">{doctor.rating?.toFixed(1) || '0.0'}</span>
                                      <span className="text-muted ms-1">({doctor.ratingCount || 0} reviews)</span>
                                    </div>
                                  </div>
                                  <span className="badge bg-primary-subtle text-primary">{getDoctorAvailability(doctor)}</span>
                                </div>
                                
                                <p className="mb-3">
                                  <strong>Education:</strong> {doctor.education && doctor.education.length > 0 
                                                             ? doctor.education[0] 
                                                             : 'Medical Professional'}
                                </p>
                                
                                <div className="d-flex flex-wrap mb-3">
                                  <div className="d-flex align-items-center me-4 mb-2">
                                    <FaMapMarkerAlt className="text-primary me-2" />
                                    <span>{doctor.location || 'Multiple Locations'}</span>
                                </div>
                                  <div className="d-flex align-items-center me-4 mb-2">
                                    <FaCalendarAlt className="text-primary me-2" />
                                    <span>{doctor.acceptsNewPatients !== false ? 'Accepting new patients' : 'Not accepting new patients'}</span>
                                </div>
                                  {doctor.telehealth !== false && (
                                    <div className="d-flex align-items-center mb-2">
                                      <FaVideo className="text-primary me-2" />
                                      <span>Virtual Visits Available</span>
                                </div>
                              )}
                                </div>
                                
                                <p className="text-muted mb-3">
                                  {generateDoctorSummary(doctor)}
                                </p>
                                
                                <div className="d-flex flex-wrap">
                                  <Button 
                                    variant="primary" 
                                    className="me-2 mb-2 mb-sm-0" 
                                    onClick={() => handleBookAppointment(doctor)}
                                  >
                                    Book Appointment
                                  </Button>
                                  <LinkButton to={`/doctors/${doctor._id}`} variant="outline-primary" className="me-2 mb-2 mb-sm-0">
                                    View Profile
                                  </LinkButton>
                                </div>
                              </div>
                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                )}
                
                {filteredDoctors.length > 0 && pagination.hasMore && (
                  <div className="d-flex justify-content-center mt-4">
                    <Button 
                      variant="outline-primary" 
                      size="lg" 
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                    >
                      {loadingMore ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Loading...
                        </>
                      ) : 'Load More Doctors'}
                    </Button>
                  </div>
                )}
              </Col>
            </Row>
          </Container>
        </section>
    </div>
  );
};

export default Doctors; 