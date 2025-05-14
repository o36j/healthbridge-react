import React, { useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { 
  FaCalendarCheck, 
  FaUserMd, 
  FaNotesMedical, 
  FaFileMedical, 
  FaVideo, 
  FaPrescriptionBottleAlt,
  FaMobile,
  FaLock,
  FaClock,
  FaHeartbeat,
  FaHospital,
  FaStethoscope,
  FaXRay,
  FaTeeth,
  FaBrain,
  FaChild,
  FaHeart,
  FaAllergies,
  FaBone,
  FaEye,
  FaChevronLeft,
  FaChevronRight,
  FaArrowRight
} from 'react-icons/fa';
import LinkButton from '../components/common/LinkButton';

const Services: React.FC = () => {
  // Reference to the scrolling container
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // Reference to the animation frame request
  const animationRef = useRef<number | null>(null);
  
  // Auto-scroll effect
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;
    
    let scrollAmount = 1; // Pixels to scroll per frame
    let isHovering = false;
    
    // Animation function
    const scroll = () => {
      if (scrollContainer && !isHovering) {
        // When reaching the end, reset to the beginning
        if (scrollContainer.scrollLeft + scrollContainer.clientWidth >= scrollContainer.scrollWidth) {
          scrollContainer.scrollLeft = 0;
        } else {
          scrollContainer.scrollLeft += scrollAmount;
        }
      }
      animationRef.current = requestAnimationFrame(scroll);
    };
    
    // Start auto-scrolling
    animationRef.current = requestAnimationFrame(scroll);
    
    // Pause scrolling when hovering
    const handleMouseEnter = () => {
      isHovering = true;
    };
    
    const handleMouseLeave = () => {
      isHovering = false;
    };
    
    scrollContainer.addEventListener('mouseenter', handleMouseEnter);
    scrollContainer.addEventListener('mouseleave', handleMouseLeave);
    
    // Cleanup function
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      if (scrollContainer) {
        scrollContainer.removeEventListener('mouseenter', handleMouseEnter);
        scrollContainer.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, []);

  return (
    <div className="services-page">
      {/* Hero Section */}
      <section 
        className="position-relative overflow-hidden" 
        style={{ 
          backgroundImage: 'linear-gradient(rgba(0, 32, 63, 0.8), rgba(0, 32, 63, 0.8)), url("/assets/Healthcare Technology.jpg")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '500px'
        }}
      >
        <div className="position-absolute start-0 top-0 w-100 h-100 d-flex align-items-center">
          <Container>
            <Row className="align-items-center py-5">
              <Col lg={6} className="text-white py-5">
                <div className="animate-in-up" style={{ animationDelay: '0.2s' }}>
                  <h1 className="display-4 fw-bold mb-4">Our Services</h1>
                  <p className="lead mb-4 fs-4">
                    HealthBridge offers a comprehensive suite of healthcare management services designed to streamline the healthcare experience for both patients and providers.
                  </p>
                  <div className="d-flex flex-wrap gap-3">
                    <Link to="/register" className="btn btn-primary btn-lg">
                      Get Started
                    </Link>
                    <a href="#core-services" className="btn btn-outline-light btn-lg">
                      See Details
                    </a>
                  </div>
                </div>
              </Col>
              <Col lg={6} className="d-none d-lg-block">
                <div className="p-4 rounded-4 bg-white shadow-lg animate-in-right" style={{ animationDelay: '0.4s' }}>
                  <Row className="g-4">
                    <Col xs={6}>
                      <div className="text-center p-3 rounded-3 bg-light">
                        <FaCalendarCheck className="text-primary fs-1 mb-2" />
                        <h5 className="fw-bold">Scheduling</h5>
                      </div>
                    </Col>
                    <Col xs={6}>
                      <div className="text-center p-3 rounded-3 bg-light">
                        <FaUserMd className="text-primary fs-1 mb-2" />
                        <h5 className="fw-bold">Specialists</h5>
                      </div>
                    </Col>
                    <Col xs={6}>
                      <div className="text-center p-3 rounded-3 bg-light">
                        <FaNotesMedical className="text-primary fs-1 mb-2" />
                        <h5 className="fw-bold">Records</h5>
                      </div>
                    </Col>
                    <Col xs={6}>
                      <div className="text-center p-3 rounded-3 bg-light">
                        <FaVideo className="text-primary fs-1 mb-2" />
                        <h5 className="fw-bold">Telehealth</h5>
                      </div>
                    </Col>
                  </Row>
                </div>
              </Col>
            </Row>
          </Container>
        </div>
        
        {/* Wave Divider */}
        <div className="wave-divider position-absolute bottom-0 start-0 w-100">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 100">
            <path 
              fill="#ffffff" 
              fillOpacity="1" 
              d="M0,64L80,58.7C160,53,320,43,480,48C640,53,800,75,960,80C1120,85,1280,75,1360,69.3L1440,64L1440,100L1360,100C1280,100,1120,100,960,100C800,100,640,100,480,100C320,100,160,100,80,100L0,100Z"
            ></path>
          </svg>
        </div>
      </section>

      {/* Main Services */}
      <section className="py-5" id="core-services">
        <Container className="py-5">
          <Row className="justify-content-center text-center mb-5">
            <Col lg={8}>
              <h2 className="fw-bold mb-4">Core Services</h2>
              <p className="lead text-muted">
                Our platform provides essential healthcare management features to help you take control of your health.
              </p>
            </Col>
          </Row>
          
          {/* Split view services with images */}
          <div className="mb-5">
            {/* Appointment Scheduling with image */}
            <Row className="align-items-center mb-5 g-4">
              <Col lg={6}>
                <h3 className="fw-bold mb-3">Appointment Scheduling</h3>
                <p className="mb-4">
                  Book appointments with your preferred healthcare providers at your convenience. 
                  Choose from available time slots and receive confirmation instantly.
                </p>
                <ul className="list-unstyled">
                  <li className="mb-2">
                    <div className="d-flex">
                      <div className="me-2 text-primary">✓</div>
                      <div>24/7 online scheduling</div>
                    </div>
                  </li>
                  <li className="mb-2">
                    <div className="d-flex">
                      <div className="me-2 text-primary">✓</div>
                      <div>SMS and email reminders</div>
                    </div>
                  </li>
                  <li className="mb-2">
                    <div className="d-flex">
                      <div className="me-2 text-primary">✓</div>
                      <div>Easy rescheduling options</div>
                    </div>
                  </li>
                </ul>
                <Link to="/appointments" className="btn btn-outline-primary">
                  Try Scheduling <FaArrowRight className="ms-2" />
                </Link>
              </Col>
              <Col lg={6}>
                <div className="rounded-4 overflow-hidden shadow-lg">
                  <img 
                    src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" 
                    alt="Doctor appointment scheduling" 
                    className="img-fluid w-100 hover-scale"
                    style={{ objectFit: 'cover', height: '350px' }}
                  />
                </div>
              </Col>
            </Row>
            
            {/* Medical Records with image */}
            <Row className="align-items-center mb-5 g-4 flex-lg-row-reverse">
              <Col lg={6}>
                <h3 className="fw-bold mb-3">Medical Records</h3>
                <p className="mb-4">
                  Securely store and access your complete medical history in one place. 
                  Share records with your healthcare providers as needed for coordinated care.
                </p>
                <ul className="list-unstyled">
                  <li className="mb-2">
                    <div className="d-flex">
                      <div className="me-2 text-primary">✓</div>
                      <div>Centralized health information</div>
                    </div>
                  </li>
                  <li className="mb-2">
                    <div className="d-flex">
                      <div className="me-2 text-primary">✓</div>
                      <div>HIPAA-compliant security</div>
                    </div>
                  </li>
                  <li className="mb-2">
                    <div className="d-flex">
                      <div className="me-2 text-primary">✓</div>
                      <div>Controlled sharing permissions</div>
                    </div>
                  </li>
                </ul>
                <Link to="/history" className="btn btn-outline-primary">
                  View Records Demo <FaArrowRight className="ms-2" />
                </Link>
              </Col>
              <Col lg={6}>
                <div className="rounded-4 overflow-hidden shadow-lg">
                  <img 
                    src="https://images.unsplash.com/photo-1587370560942-ad2a04eabb6d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" 
                    alt="Electronic medical records" 
                    className="img-fluid w-100 hover-scale"
                    style={{ objectFit: 'cover', height: '350px' }}
                  />
                </div>
              </Col>
            </Row>
          </div>
          
          {/* Remaining services in card format */}
          <Row className="g-4">
            <Col md={6} lg={4}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="p-4 text-center">
                  <div className="rounded-circle bg-primary bg-opacity-10 p-3 d-inline-flex mb-3">
                    <FaUserMd className="text-primary fs-3" />
                  </div>
                  <Card.Title className="fw-bold">Doctor Network</Card.Title>
                  <Card.Text>
                    Access our extensive network of qualified healthcare professionals across various specialties. Read reviews, check credentials, and find the right doctor for your needs.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={6} lg={4}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="p-4 text-center">
                  <div className="rounded-circle bg-primary bg-opacity-10 p-3 d-inline-flex mb-3">
                    <FaVideo className="text-primary fs-3" />
                  </div>
                  <Card.Title className="fw-bold">Virtual Consultations</Card.Title>
                  <Card.Text>
                    Connect with healthcare providers remotely through secure video consultations. Get medical advice, follow-ups, and prescriptions without leaving your home.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={6} lg={4}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="p-4 text-center">
                  <div className="rounded-circle bg-primary bg-opacity-10 p-3 d-inline-flex mb-3">
                    <FaPrescriptionBottleAlt className="text-primary fs-3" />
                  </div>
                  <Card.Title className="fw-bold">Medication Management</Card.Title>
                  <Card.Text>
                    Keep track of your medications, receive reminders for refills and doses, and access your prescription history whenever needed.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Special Features */}
      <section className="py-5 bg-light">
        <Container className="py-5">
          <Row className="justify-content-center text-center mb-5">
            <Col lg={8}>
              <h2 className="fw-bold mb-4">Special Features</h2>
              <p className="lead text-muted">
                What makes HealthBridge different from other healthcare platforms.
              </p>
            </Col>
          </Row>
          
          <Row className="g-4">
            <Col md={6}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="p-4">
                  <div className="d-flex align-items-center mb-4">
                    <div className="rounded-circle bg-primary text-white p-3 me-3">
                      <FaMobile />
                    </div>
                    <h4 className="fw-bold mb-0">Mobile App Access</h4>
                  </div>
                  <p className="mb-0">
                    Access all HealthBridge features on the go with our user-friendly mobile app. Available for iOS and Android devices.
                  </p>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={6}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="p-4">
                  <div className="d-flex align-items-center mb-4">
                    <div className="rounded-circle bg-primary text-white p-3 me-3">
                      <FaLock />
                    </div>
                    <h4 className="fw-bold mb-0">Enhanced Security</h4>
                  </div>
                  <p className="mb-0">
                    Your health data is protected with enterprise-grade security measures, including encryption and strict access controls.
                  </p>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={6}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="p-4">
                  <div className="d-flex align-items-center mb-4">
                    <div className="rounded-circle bg-primary text-white p-3 me-3">
                      <FaClock />
                    </div>
                    <h4 className="fw-bold mb-0">24/7 Availability</h4>
                  </div>
                  <p className="mb-0">
                    Our platform is available around the clock, allowing you to manage your healthcare at any time that's convenient for you.
                  </p>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={6}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="p-4">
                  <div className="d-flex align-items-center mb-4">
                    <div className="rounded-circle bg-primary text-white p-3 me-3">
                      <FaHeartbeat />
                    </div>
                    <h4 className="fw-bold mb-0">Personalized Care</h4>
                  </div>
                  <p className="mb-0">
                    Receive personalized health recommendations and care plans based on your unique health profile and needs.
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>
      
      {/* Testimonials Section */}
      <section className="py-5">
        <Container className="py-5">
          <Row className="justify-content-center text-center mb-5">
            <Col lg={8}>
              <h2 className="fw-bold mb-4">What Our Users Say</h2>
              <p className="lead text-muted">
                Real experiences from patients and healthcare providers using HealthBridge
              </p>
            </Col>
          </Row>
          
          <Row className="g-4">
            <Col md={4}>
              <Card className="h-100 border-0 shadow-sm testimonial-card">
                <div className="position-relative">
                  <img 
                    src="https://images.unsplash.com/photo-1559839734-2b71ea197ec2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80" 
                    alt="Patient consultation" 
                    className="card-img-top"
                    style={{ height: '200px', objectFit: 'cover' }}
                  />
                  <div className="position-absolute bottom-0 start-0 w-100 bg-gradient-dark text-white p-3">
                    <h5 className="fw-bold mb-0">Sarah Johnson</h5>
                    <p className="small mb-0">Patient</p>
                  </div>
                </div>
                <Card.Body className="p-4">
                  <div className="mb-3 text-warning">
                    ★★★★★
                  </div>
                  <Card.Text>
                    "HealthBridge has transformed how I manage my healthcare. Scheduling appointments is now a breeze, and having all my records in one place has made coordination between specialists so much easier."
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={4}>
              <Card className="h-100 border-0 shadow-sm testimonial-card">
                <div className="position-relative">
                  <img 
                    src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1964&q=80" 
                    alt="Doctor using tablet" 
                    className="card-img-top"
                    style={{ height: '200px', objectFit: 'cover' }}
                  />
                  <div className="position-absolute bottom-0 start-0 w-100 bg-gradient-dark text-white p-3">
                    <h5 className="fw-bold mb-0">Dr. Michael Chen</h5>
                    <p className="small mb-0">Cardiologist</p>
                  </div>
                </div>
                <Card.Body className="p-4">
                  <div className="mb-3 text-warning">
                    ★★★★★
                  </div>
                  <Card.Text>
                    "As a healthcare provider, HealthBridge has streamlined my practice. The scheduling system reduced no-shows by 60%, and the secure messaging has improved patient communication dramatically."
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={4}>
              <Card className="h-100 border-0 shadow-sm testimonial-card">
                <div className="position-relative">
                  <img 
                    src="https://images.unsplash.com/photo-1590650153855-d9e808231d41?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80" 
                    alt="Hospital administrator" 
                    className="card-img-top"
                    style={{ height: '200px', objectFit: 'cover' }}
                  />
                  <div className="position-absolute bottom-0 start-0 w-100 bg-gradient-dark text-white p-3">
                    <h5 className="fw-bold mb-0">Emily Rodriguez</h5>
                    <p className="small mb-0">Hospital Administrator</p>
                  </div>
                </div>
                <Card.Body className="p-4">
                  <div className="mb-3 text-warning">
                    ★★★★★
                  </div>
                  <Card.Text>
                    "Implementing HealthBridge at our facility has increased operational efficiency by 40%. The dashboard analytics provide valuable insights that help us improve patient care continuously."
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>
      
      {/* Healthcare Journey Visualization */}
      <section className="py-5 bg-light">
        <Container className="py-5">
          <Row className="justify-content-center text-center mb-5">
            <Col lg={8}>
              <h2 className="fw-bold mb-4">Your HealthBridge Journey</h2>
              <p className="lead text-muted">
                Experience seamless healthcare management from start to finish
              </p>
            </Col>
          </Row>
          
          <Row className="align-items-center">
            <Col lg={6} className="mb-4 mb-lg-0">
              <div className="position-relative">
                <img 
                  src="/assets/Journey Timeline.png" 
                  alt="Healthcare Journey Timeline" 
                  className="img-fluid rounded-4 shadow-lg"
                />
                {/* Interactive Hotspots - would be implemented with JavaScript in a real implementation */}
                <div className="position-absolute" style={{ top: '15%', left: '20%' }}>
                  <div className="bg-primary rounded-circle pulse-circle" style={{ width: '20px', height: '20px' }}></div>
                </div>
                <div className="position-absolute" style={{ top: '40%', right: '30%' }}>
                  <div className="bg-primary rounded-circle pulse-circle" style={{ width: '20px', height: '20px' }}></div>
                </div>
                <div className="position-absolute" style={{ bottom: '25%', left: '40%' }}>
                  <div className="bg-primary rounded-circle pulse-circle" style={{ width: '20px', height: '20px' }}></div>
                </div>
              </div>
            </Col>
            <Col lg={6}>
              <div className="p-4">
                <Row className="g-4">
                  <Col md={12}>
                    <Card className="border-0 shadow-sm mb-4">
                      <Card.Body className="p-4">
                        <div className="d-flex">
                          <div className="rounded-circle bg-primary text-white p-3 me-3 flex-shrink-0" style={{ width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            1
                          </div>
                          <div>
                            <h4 className="fw-bold">Sign Up & Profile Setup</h4>
                            <p className="mb-0">Create your account and add your medical history, insurance information, and preferences.</p>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={12}>
                    <Card className="border-0 shadow-sm mb-4">
                      <Card.Body className="p-4">
                        <div className="d-flex">
                          <div className="rounded-circle bg-primary text-white p-3 me-3 flex-shrink-0" style={{ width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            2
                          </div>
                          <div>
                            <h4 className="fw-bold">Connect With Providers</h4>
                            <p className="mb-0">Find and connect with healthcare professionals based on specialty, location, and availability.</p>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                  <Col md={12}>
                    <Card className="border-0 shadow-sm">
                      <Card.Body className="p-4">
                        <div className="d-flex">
                          <div className="rounded-circle bg-primary text-white p-3 me-3 flex-shrink-0" style={{ width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            3
                          </div>
                          <div>
                            <h4 className="fw-bold">Ongoing Care Management</h4>
                            <p className="mb-0">Schedule appointments, receive reminders, track medications, and manage your health in one place.</p>
                          </div>
                        </div>
                      </Card.Body>
                    </Card>
                  </Col>
                </Row>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Specialized Medical Services */}
      <section className="py-5">
        <Container className="py-5">
          <Row className="justify-content-center text-center mb-5">
            <Col lg={8}>
              <h2 className="fw-bold mb-4">Specialized Medical Services</h2>
              <p className="lead text-muted">
                Our hospital offers a comprehensive range of medical specialties to address all your healthcare needs.
              </p>
            </Col>
          </Row>
          
          {/* Horizontal scrolling container */}
          <div className="position-relative mb-5">
            <div 
              ref={scrollContainerRef}
              className="d-flex overflow-auto pb-3 specialties-scroll" 
              style={{ 
                scrollBehavior: 'smooth',
                msOverflowStyle: 'none', /* for Internet Explorer */
                scrollbarWidth: 'none' /* for Firefox */
              }}
            >
              {/* Cardiology */}
              <div className="flex-shrink-0 me-4" style={{ width: '280px' }}>
                <Card className="h-100 border-0 shadow-sm text-center hover-scale">
                  <Card.Body className="p-4">
                    <div className="rounded-circle bg-primary bg-opacity-10 p-3 d-inline-flex mb-3">
                      <FaHeart className="text-primary fs-3" />
                    </div>
                    <h5 className="fw-bold mb-2">Cardiology</h5>
                    <p className="small text-muted mb-3">
                      Comprehensive heart care including diagnostics, treatment, and cardiac rehabilitation.
                    </p>
                    <Link to="/doctors?specialty=cardiology" className="text-primary stretched-link">
                      Find a Cardiologist →
                    </Link>
                  </Card.Body>
                </Card>
              </div>
              
              {/* Neurology */}
              <div className="flex-shrink-0 me-4" style={{ width: '280px' }}>
                <Card className="h-100 border-0 shadow-sm text-center hover-scale">
                  <Card.Body className="p-4">
                    <div className="rounded-circle bg-primary bg-opacity-10 p-3 d-inline-flex mb-3">
                      <FaBrain className="text-primary fs-3" />
                    </div>
                    <h5 className="fw-bold mb-2">Neurology</h5>
                    <p className="small text-muted mb-3">
                      Expert care for disorders of the brain, spinal cord, and nervous system.
                    </p>
                    <Link to="/doctors?specialty=neurology" className="text-primary stretched-link">
                      Find a Neurologist →
                    </Link>
                  </Card.Body>
                </Card>
              </div>
              
              {/* Orthopedics */}
              <div className="flex-shrink-0 me-4" style={{ width: '280px' }}>
                <Card className="h-100 border-0 shadow-sm text-center hover-scale">
                  <Card.Body className="p-4">
                    <div className="rounded-circle bg-primary bg-opacity-10 p-3 d-inline-flex mb-3">
                      <FaBone className="text-primary fs-3" />
                    </div>
                    <h5 className="fw-bold mb-2">Orthopedics</h5>
                    <p className="small text-muted mb-3">
                      Treatment for bone and joint problems, including sports injuries and rehabilitation.
                    </p>
                    <Link to="/doctors?specialty=orthopedics" className="text-primary stretched-link">
                      Find an Orthopedist →
                    </Link>
                  </Card.Body>
                </Card>
              </div>
              
              {/* Pediatrics */}
              <div className="flex-shrink-0 me-4" style={{ width: '280px' }}>
                <Card className="h-100 border-0 shadow-sm text-center hover-scale">
                  <Card.Body className="p-4">
                    <div className="rounded-circle bg-primary bg-opacity-10 p-3 d-inline-flex mb-3">
                      <FaChild className="text-primary fs-3" />
                    </div>
                    <h5 className="fw-bold mb-2">Pediatrics</h5>
                    <p className="small text-muted mb-3">
                      Specialized healthcare for infants, children, and adolescents.
                    </p>
                    <Link to="/doctors?specialty=pediatrics" className="text-primary stretched-link">
                      Find a Pediatrician →
                    </Link>
                  </Card.Body>
                </Card>
              </div>
              
              {/* Internal Medicine */}
              <div className="flex-shrink-0 me-4" style={{ width: '280px' }}>
                <Card className="h-100 border-0 shadow-sm text-center hover-scale">
                  <Card.Body className="p-4">
                    <div className="rounded-circle bg-primary bg-opacity-10 p-3 d-inline-flex mb-3">
                      <FaStethoscope className="text-primary fs-3" />
                    </div>
                    <h5 className="fw-bold mb-2">Internal Medicine</h5>
                    <p className="small text-muted mb-3">
                      Comprehensive primary care for adults, focusing on prevention and chronic disease management.
                    </p>
                    <Link to="/doctors?specialty=internal-medicine" className="text-primary stretched-link">
                      Find an Internist →
                    </Link>
                  </Card.Body>
                </Card>
              </div>
              
              {/* Ophthalmology */}
              <div className="flex-shrink-0 me-4" style={{ width: '280px' }}>
                <Card className="h-100 border-0 shadow-sm text-center hover-scale">
                  <Card.Body className="p-4">
                    <div className="rounded-circle bg-primary bg-opacity-10 p-3 d-inline-flex mb-3">
                      <FaEye className="text-primary fs-3" />
                    </div>
                    <h5 className="fw-bold mb-2">Ophthalmology</h5>
                    <p className="small text-muted mb-3">
                      Comprehensive eye care, including surgery, treatment for eye diseases, and vision correction.
                    </p>
                    <Link to="/doctors?specialty=ophthalmology" className="text-primary stretched-link">
                      Find an Ophthalmologist →
                    </Link>
                  </Card.Body>
                </Card>
              </div>
              
              {/* Dental Care */}
              <div className="flex-shrink-0 me-4" style={{ width: '280px' }}>
                <Card className="h-100 border-0 shadow-sm text-center hover-scale">
                  <Card.Body className="p-4">
                    <div className="rounded-circle bg-primary bg-opacity-10 p-3 d-inline-flex mb-3">
                      <FaTeeth className="text-primary fs-3" />
                    </div>
                    <h5 className="fw-bold mb-2">Dental Care</h5>
                    <p className="small text-muted mb-3">
                      Complete dental services from routine check-ups to advanced procedures and emergency care.
                    </p>
                    <Link to="/doctors?specialty=dental" className="text-primary stretched-link">
                      Find a Dentist →
                    </Link>
                  </Card.Body>
                </Card>
              </div>
              
              {/* Diagnostic Services */}
              <div className="flex-shrink-0" style={{ width: '280px' }}>
                <Card className="h-100 border-0 shadow-sm text-center hover-scale">
                  <Card.Body className="p-4">
                    <div className="rounded-circle bg-primary bg-opacity-10 p-3 d-inline-flex mb-3">
                      <FaXRay className="text-primary fs-3" />
                    </div>
                    <h5 className="fw-bold mb-2">Diagnostic Services</h5>
                    <p className="small text-muted mb-3">
                      Advanced imaging, laboratory tests, and diagnostic procedures for accurate diagnosis.
                    </p>
                    <Link to="/services/diagnostics" className="text-primary stretched-link">
                      Learn More →
                    </Link>
                  </Card.Body>
                </Card>
              </div>
            </div>

            {/* Navigation arrows */}
            <button 
              className="position-absolute top-50 start-0 translate-middle-y bg-white rounded-circle border-0 shadow-sm" 
              style={{ width: '40px', height: '40px', zIndex: 1 }}
              onClick={() => {
                const container = scrollContainerRef.current;
                if (container) {
                  container.scrollLeft -= 300;
                }
              }}
              title="Scroll left"
              aria-label="Scroll left"
            >
              <FaChevronLeft />
            </button>
            <button 
              className="position-absolute top-50 end-0 translate-middle-y bg-white rounded-circle border-0 shadow-sm" 
              style={{ width: '40px', height: '40px', zIndex: 1 }}
              onClick={() => {
                const container = scrollContainerRef.current;
                if (container) {
                  container.scrollLeft += 300;
                }
              }}
              title="Scroll right"
              aria-label="Scroll right"
            >
              <FaChevronRight />
            </button>
          </div>

          {/* Hide scrollbar */}
          <style>{`
            .specialties-scroll::-webkit-scrollbar {
              display: none;
            }
            
            /* Pulse circle animation */
            .pulse-circle {
              animation: pulse-animation 2s infinite;
            }
            
            @keyframes pulse-animation {
              0% {
                box-shadow: 0 0 0 0 rgba(2, 132, 199, 0.7);
              }
              70% {
                box-shadow: 0 0 0 10px rgba(2, 132, 199, 0);
              }
              100% {
                box-shadow: 0 0 0 0 rgba(2, 132, 199, 0);
              }
            }
            
            /* Background gradient for testimonial cards */
            .bg-gradient-dark {
              background: linear-gradient(to top, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0));
            }
          `}</style>
          
          {/* CTA button */}
          <div className="text-center mt-5">
            <LinkButton to="/doctors" variant="primary" size="lg" className="px-4">
              <FaUserMd className="me-2" /> Find a Specialist
            </LinkButton>
          </div>
        </Container>
      </section>

      {/* Visual Comparison Section */}
      <section className="py-5 bg-light">
        <Container className="py-5">
          <Row className="justify-content-center text-center mb-5">
            <Col lg={8}>
              <h2 className="fw-bold mb-4">HealthBridge vs. Traditional Healthcare</h2>
              <p className="lead text-muted">
                See how our platform transforms your healthcare experience
              </p>
            </Col>
          </Row>
          
          <Row className="g-4">
            <Col md={6}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Header className="bg-primary text-white text-center py-3">
                  <h4 className="fw-bold mb-0">With HealthBridge</h4>
                </Card.Header>
                <Card.Body className="p-4">
                  <div className="text-center mb-4">
                    <img 
                      src="/assets/Patient Experience.jpg" 
                      alt="Modern Healthcare Experience" 
                      className="img-fluid rounded-4 mb-4"
                      style={{ height: '200px', objectFit: 'cover' }}
                    />
                  </div>
                  <ul className="list-unstyled">
                    <li className="py-2 border-bottom">
                      <div className="d-flex align-items-center">
                        <div className="rounded-circle bg-success text-white p-1 me-3" style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</div>
                        <span>Book appointments 24/7 online</span>
                      </div>
                    </li>
                    <li className="py-2 border-bottom">
                      <div className="d-flex align-items-center">
                        <div className="rounded-circle bg-success text-white p-1 me-3" style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</div>
                        <span>Access records from any device</span>
                      </div>
                    </li>
                    <li className="py-2 border-bottom">
                      <div className="d-flex align-items-center">
                        <div className="rounded-circle bg-success text-white p-1 me-3" style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</div>
                        <span>Receive automatic reminders</span>
                      </div>
                    </li>
                    <li className="py-2 border-bottom">
                      <div className="d-flex align-items-center">
                        <div className="rounded-circle bg-success text-white p-1 me-3" style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</div>
                        <span>Consult doctors remotely</span>
                      </div>
                    </li>
                    <li className="py-2">
                      <div className="d-flex align-items-center">
                        <div className="rounded-circle bg-success text-white p-1 me-3" style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</div>
                        <span>Coordinate care between providers</span>
                      </div>
                    </li>
                  </ul>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={6}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Header className="bg-secondary text-white text-center py-3">
                  <h4 className="fw-bold mb-0">Traditional Healthcare</h4>
                </Card.Header>
                <Card.Body className="p-4">
                  <div className="text-center mb-4">
                    <img 
                      src="https://images.unsplash.com/photo-1516549655169-df83a0774514?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80" 
                      alt="Traditional Healthcare Experience" 
                      className="img-fluid rounded-4 mb-4"
                      style={{ height: '200px', objectFit: 'cover' }}
                    />
                  </div>
                  <ul className="list-unstyled">
                    <li className="py-2 border-bottom">
                      <div className="d-flex align-items-center">
                        <div className="rounded-circle bg-danger text-white p-1 me-3" style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✗</div>
                        <span>Phone calls during office hours only</span>
                      </div>
                    </li>
                    <li className="py-2 border-bottom">
                      <div className="d-flex align-items-center">
                        <div className="rounded-circle bg-danger text-white p-1 me-3" style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✗</div>
                        <span>Paper records or multiple portals</span>
                      </div>
                    </li>
                    <li className="py-2 border-bottom">
                      <div className="d-flex align-items-center">
                        <div className="rounded-circle bg-danger text-white p-1 me-3" style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✗</div>
                        <span>Manual tracking and follow-ups</span>
                      </div>
                    </li>
                    <li className="py-2 border-bottom">
                      <div className="d-flex align-items-center">
                        <div className="rounded-circle bg-danger text-white p-1 me-3" style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✗</div>
                        <span>In-person visits only</span>
                      </div>
                    </li>
                    <li className="py-2">
                      <div className="d-flex align-items-center">
                        <div className="rounded-circle bg-danger text-white p-1 me-3" style={{ width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✗</div>
                        <span>Fragmented care coordination</span>
                      </div>
                    </li>
                  </ul>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* CTA Section */}
      <section 
        className="position-relative py-5 text-white" 
        style={{ 
          background: 'linear-gradient(135deg, rgba(2, 132, 199, 1) 0%, rgba(3, 105, 161, 1) 100%)',
        }}
      >
        <Container className="py-5 text-center position-relative">
          <div className="animate-in-up" style={{ animationDelay: '0.2s' }}>
            <h2 className="display-4 fw-bold mb-4">Ready to experience better healthcare?</h2>
            <p className="lead fs-4 mb-4">
              Join thousands of satisfied users who have transformed their healthcare experience with HealthBridge.
            </p>
            <div className="d-flex gap-3 justify-content-center flex-wrap">
              <LinkButton 
                to="/register" 
                variant="light" 
                size="lg" 
                className="fw-medium px-4 pulse-button"
              >
                Get Started Now
              </LinkButton>
              <LinkButton 
                to="/contact" 
                variant="outline-light" 
                size="lg" 
                className="fw-medium px-4"
              >
                Contact Us
              </LinkButton>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
};

export default Services; 