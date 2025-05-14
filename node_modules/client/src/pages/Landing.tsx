import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Carousel, Accordion } from 'react-bootstrap';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { 
  FaCalendarAlt, 
  FaUserMd, 
  FaHospital, 
  FaFileAlt, 
  FaPhone,
  FaUserInjured,
  FaUsers,
  FaHistory,
  FaClock,
  FaArrowRight,
  FaClipboardCheck,
  FaHeartbeat,
  FaChartLine,
  FaMedkit,
  FaQuestionCircle,
  FaRegLightbulb,
  FaRegNewspaper,
  FaChartBar,
  FaStethoscope,
  FaRegClock,
  FaShieldAlt,
  FaRegSmile
} from 'react-icons/fa';

const Landing = () => {
  const { user } = useAuth();

  // User Dashboard Section - shown only to logged in users
  const renderUserDashboard = () => {
    if (!user) return null;

    const getQuickActions = () => {
      const commonActions = [
        {
          title: 'Profile',
          icon: <FaUserMd className="fs-2 text-primary mb-3" />,
          description: 'Update your personal information',
          link: '/profile'
        }
      ];

      switch (user.role) {
        case UserRole.PATIENT:
          return [
            ...commonActions,
            {
              title: 'Book Appointment',
              icon: <FaCalendarAlt className="fs-2 text-primary mb-3" />,
              description: 'Schedule a visit with your doctor',
              link: '/appointments'
            },
            {
              title: 'Medical History',
              icon: <FaHistory className="fs-2 text-primary mb-3" />,
              description: 'View your past appointments and diagnoses',
              link: '/history'
            }
          ];
        case UserRole.DOCTOR:
          return [
            ...commonActions,
            {
              title: 'Appointments',
              icon: <FaCalendarAlt className="fs-2 text-primary mb-3" />,
              description: 'View your upcoming appointments',
              link: '/appointments'
            },
            {
              title: 'Patients',
              icon: <FaUserInjured className="fs-2 text-primary mb-3" />,
              description: 'Manage and access patient information',
              link: '/patients'
            }
          ];
        case UserRole.NURSE:
          return [
            ...commonActions,
            {
              title: 'Appointments',
              icon: <FaCalendarAlt className="fs-2 text-primary mb-3" />,
              description: 'View clinic schedule',
              link: '/appointments'
            },
            {
              title: 'Patients',
              icon: <FaUserInjured className="fs-2 text-primary mb-3" />,
              description: 'View patient records',
              link: '/patients'
            }
          ];
        case UserRole.ADMIN:
          return [
            ...commonActions,
            {
              title: 'User Management',
              icon: <FaUsers className="fs-2 text-primary mb-3" />,
              description: 'Manage system users',
              link: '/users'
            },
            {
              title: 'Doctor Directory',
              icon: <FaUserMd className="fs-2 text-primary mb-3" />,
              description: 'Manage healthcare providers',
              link: '/doctors'
            }
          ];
        default:
          return commonActions;
      }
    };
  
  return (
      <section className="py-5 bg-light rounded mb-5">
        <Container>
          <Row className="mb-4">
            <Col>
              <h2 className="fw-bold">Welcome back, {user.firstName}!</h2>
              <p className="text-muted">Here's a quick overview of your HealthBridge account</p>
            </Col>
          </Row>
          <Row className="g-4">
            {getQuickActions().map((action, index) => (
              <Col md={4} key={index}>
                <Card className="h-100 border-0 shadow-sm hover-shadow">
                  <Card.Body className="text-center p-4">
                    {action.icon}
                    <Card.Title className="fw-bold mb-2">{action.title}</Card.Title>
                    <Card.Text className="text-muted mb-3">{action.description}</Card.Text>
                    <Link to={action.link} className="btn btn-outline-primary">
                      Go to {action.title} <FaArrowRight className="ms-1" />
                    </Link>
                </Card.Body>
              </Card>
            </Col>
            ))}
          </Row>
        </Container>
      </section>
    );
  };

  // Public Landing Content - shown to all users
  return (
    <>
      {/* User Dashboard Section - only for logged in users */}
      {renderUserDashboard()}
      
      {/* Hero Section */}
      <section className="hero-section">
        <Carousel fade indicators={true} pause="hover" className="mb-0">
          <Carousel.Item>
            <div 
              className="d-flex flex-column justify-content-center align-items-start text-white p-5" 
              style={{ 
                minHeight: '650px',
                backgroundImage: 'linear-gradient(rgba(0, 32, 63, 0.8), rgba(0, 32, 63, 0.8)), url("/assets/Healthcare Technology.jpg")',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <Container>
                <Row className="align-items-center">
                  <Col lg={6} className="text-lg-start text-center">
                    <div className="animate-in-up" style={{ animationDelay: '0.2s' }}>
                      <h1 className="display-3 fw-bold mb-3">Your Health is Our Priority</h1>
                      <p className="lead fs-4 mb-4">HealthBridge connects you with the care you need, when you need it.</p>
                      
                      <div className="d-flex flex-wrap gap-3 justify-content-lg-start justify-content-center">
                        {!user && (
                          <>
                            <Link to="/register" className="btn btn-primary btn-lg pulse-button">
                              <span className="d-flex align-items-center">
                                Create Account <FaArrowRight className="ms-2" />
                              </span>
                            </Link>
                            <Link to="/services" className="btn btn-outline-light btn-lg">
                              Explore Services
                            </Link>
                          </>
                        )}
                        {user && (
                          <Link to="/appointments" className="btn btn-primary btn-lg">
                            <span className="d-flex align-items-center">
                              Book Appointment <FaCalendarAlt className="ms-2" />
                            </span>
                          </Link>
                        )}
                      </div>
                    </div>
                  </Col>
                  <Col lg={6} className="d-none d-lg-block">
                    <div className="animate-in-right text-center" style={{ animationDelay: '0.4s' }}>
                      <div className="position-relative">
                        <div className="hero-floating-stats bg-white text-dark p-3 rounded-3 shadow-lg position-absolute" style={{ top: '10%', left: '-5%' }}>
                          <div className="d-flex align-items-center">
                            <FaUserMd className="text-primary fs-1 me-2" />
                            <div>
                              <div className="fw-bold fs-4">100+</div>
                              <div className="text-muted">Doctors</div>
                            </div>
                          </div>
                        </div>
                        <div className="hero-floating-stats bg-white text-dark p-3 rounded-3 shadow-lg position-absolute" style={{ bottom: '15%', right: '-5%' }}>
                          <div className="d-flex align-items-center">
                            <FaRegSmile className="text-primary fs-1 me-2" />
                            <div>
                              <div className="fw-bold fs-4">10k+</div>
                              <div className="text-muted">Patients</div>
                            </div>
                          </div>
                        </div>
                        <img 
                          src="/assets/Patient Experience.jpg" 
                          alt="Patient Experience" 
                          className="img-fluid rounded-4 shadow-lg hero-image" 
                          style={{ maxHeight: '400px', objectFit: 'cover' }}
                        />
                      </div>
                    </div>
                  </Col>
                </Row>
              </Container>
            </div>
          </Carousel.Item>

          <Carousel.Item>
            <div 
              className="d-flex flex-column justify-content-center align-items-start text-white p-5" 
              style={{ 
                minHeight: '650px',
                backgroundImage: 'linear-gradient(rgba(22, 101, 52, 0.8), rgba(22, 101, 52, 0.8)), url("/assets/Provider Solution.jpg")',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            >
              <Container>
                <Row className="align-items-center">
                  <Col lg={6} className="order-lg-2 text-lg-end text-center">
                    <div className="animate-in-up" style={{ animationDelay: '0.2s' }}>
                      <h1 className="display-3 fw-bold mb-3">Streamlined Healthcare Management</h1>
                      <p className="lead fs-4 mb-4">Access records, schedule appointments, and connect with healthcare providers - all in one place.</p>
                      
                      <div className="d-flex flex-wrap gap-3 justify-content-lg-end justify-content-center">
                        {!user && (
                          <Link to="/about" className="btn btn-light text-success btn-lg">
                            <span className="d-flex align-items-center">
                              Learn How It Works <FaRegLightbulb className="ms-2" />
                            </span>
                          </Link>
                        )}
                        {user && (
                          <Link to="/services" className="btn btn-light text-success btn-lg">
                            <span className="d-flex align-items-center">
                              Explore Features <FaArrowRight className="ms-2" />
                            </span>
                          </Link>
                        )}
                      </div>
                    </div>
                  </Col>
                  <Col lg={6} className="order-lg-1 d-none d-lg-block">
                    <div className="animate-in-left text-center" style={{ animationDelay: '0.4s' }}>
                      <div className="position-relative">
                        <div className="hero-floating-stats bg-white text-dark p-3 rounded-3 shadow-lg position-absolute" style={{ top: '15%', right: '0' }}>
                          <div className="d-flex align-items-center">
                            <FaCalendarAlt className="text-success fs-1 me-2" />
                            <div>
                              <div className="fw-bold fs-4">24/7</div>
                              <div className="text-muted">Scheduling</div>
                            </div>
                          </div>
                        </div>
                        <div className="hero-floating-stats bg-white text-dark p-3 rounded-3 shadow-lg position-absolute" style={{ bottom: '10%', left: '5%' }}>
                          <div className="d-flex align-items-center">
                            <FaShieldAlt className="text-success fs-1 me-2" />
                            <div>
                              <div className="fw-bold fs-4">Secure</div>
                              <div className="text-muted">HIPAA Compliant</div>
                            </div>
                          </div>
                        </div>
                        <img 
                          src="/assets/landing page image illustration.jpg" 
                          alt="Healthcare Platform" 
                          className="img-fluid rounded-4 shadow-lg hero-image" 
                          style={{ maxHeight: '400px', objectFit: 'cover' }}
                        />
                      </div>
                    </div>
                  </Col>
                </Row>
              </Container>
            </div>
          </Carousel.Item>
        </Carousel>
        
        {/* Wave Divider */}
        <div className="wave-divider">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 100">
            <path 
              fill="#ffffff" 
              fillOpacity="1" 
              d="M0,64L80,58.7C160,53,320,43,480,48C640,53,800,75,960,80C1120,85,1280,75,1360,69.3L1440,64L1440,100L1360,100C1280,100,1120,100,960,100C800,100,640,100,480,100C320,100,160,100,80,100L0,100Z"
            ></path>
          </svg>
        </div>
      </section>
      
      {/* Services Section */}
      <section className="services-section py-5">
        <Container>
          <div className="text-center mb-5">
            <h2 className="fw-bold">Our Services</h2>
            <p className="lead text-muted">Comprehensive healthcare management for patients and providers</p>
          </div>
          
          <Row className="g-4">
            <Col md={6} lg={3}>
              <Card className="h-100 border-0 shadow-sm text-center p-4">
                <Card.Body>
                  <div className="rounded-circle bg-primary bg-opacity-10 p-3 d-inline-flex mb-4">
                    <FaCalendarAlt className="text-primary fs-2" />
                  </div>
                  <Card.Title className="fw-bold">Appointment Scheduling</Card.Title>
                  <Card.Text>
                    Book, reschedule, or cancel appointments with your healthcare provider.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={6} lg={3}>
              <Card className="h-100 border-0 shadow-sm text-center p-4">
                <Card.Body>
                  <div className="rounded-circle bg-primary bg-opacity-10 p-3 d-inline-flex mb-4">
                    <FaFileAlt className="text-primary fs-2" />
                  </div>
                  <Card.Title className="fw-bold">Health Records</Card.Title>
                  <Card.Text>
                    Access your medical history, test results, and treatment plans.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={6} lg={3}>
              <Card className="h-100 border-0 shadow-sm text-center p-4">
                <Card.Body>
                  <div className="rounded-circle bg-primary bg-opacity-10 p-3 d-inline-flex mb-4">
                    <FaUserMd className="text-primary fs-2" />
                  </div>
                  <Card.Title className="fw-bold">Provider Directory</Card.Title>
                  <Card.Text>
                    Find and connect with healthcare professionals across specialties.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={6} lg={3}>
              <Card className="h-100 border-0 shadow-sm text-center p-4">
                <Card.Body>
                  <div className="rounded-circle bg-primary bg-opacity-10 p-3 d-inline-flex mb-4">
                    <FaHospital className="text-primary fs-2" />
                  </div>
                  <Card.Title className="fw-bold">Facility Management</Card.Title>
                  <Card.Text>
                    Efficiently manage healthcare facilities, staff, and resources.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
            
            <div className="text-center mt-5">
            <Link to="/services" className="btn btn-outline-primary btn-lg">
              View All Services
            </Link>
            </div>
        </Container>
      </section>

      {/* Patient Testimonials */}
      <section className="testimonials-section py-5 bg-light">
        <Container>
          <div className="text-center mb-5">
            <h2 className="fw-bold">What Our Users Say</h2>
            <p className="lead text-muted">Real experiences from HealthBridge users</p>
          </div>
          
          <Row className="g-4">
            <Col md={4}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="p-4">
                  <div className="d-flex mb-4">
                    <div className="flex-shrink-0">
                      <img 
                        src="https://randomuser.me/api/portraits/women/12.jpg" 
                        alt="Sarah Johnson" 
                        className="rounded-circle" 
                        width="60" 
                      />
                    </div>
                    <div className="ms-3">
                      <h5 className="fw-bold mb-1">Sarah Johnson</h5>
                      <p className="text-muted small mb-0">Patient</p>
                    </div>
                  </div>
                  <Card.Text>
                    "HealthBridge has transformed how I manage my healthcare. I can easily book appointments 
                    and access my records all in one place. The interface is intuitive and user-friendly."
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={4}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="p-4">
                  <div className="d-flex mb-4">
                    <div className="flex-shrink-0">
                      <img 
                        src="https://randomuser.me/api/portraits/men/32.jpg" 
                        alt="Michael Chen" 
                        className="rounded-circle" 
                        width="60" 
                      />
                    </div>
                    <div className="ms-3">
                      <h5 className="fw-bold mb-1">Michael Chen</h5>
                      <p className="text-muted small mb-0">Doctor</p>
                    </div>
                  </div>
                  <Card.Text>
                    "As a healthcare provider, HealthBridge helps me stay organized and connected with my patients. 
                    It streamlines administrative tasks so I can focus more on patient care."
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={4}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="p-4">
                  <div className="d-flex mb-4">
                    <div className="flex-shrink-0">
                      <img 
                        src="https://randomuser.me/api/portraits/women/45.jpg" 
                        alt="Emily Rodriguez" 
                        className="rounded-circle" 
                        width="60" 
                      />
                    </div>
                    <div className="ms-3">
                      <h5 className="fw-bold mb-1">Emily Rodriguez</h5>
                      <p className="text-muted small mb-0">Nurse</p>
                    </div>
                  </div>
                  <Card.Text>
                    "The patient tracking feature in HealthBridge has made our clinic operations much more 
                    efficient. The real-time updates and communication tools have improved our workflow significantly."
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Call to Action */}
      <section className="cta-section py-5">
        <Container>
          <Row className="justify-content-center">
            <Col lg={10}>
              <Card className="border-0 bg-primary text-white shadow">
                <Card.Body className="p-5 text-center">
                  <h2 className="fw-bold mb-3">Ready to Take Control of Your Healthcare?</h2>
                  <p className="lead mb-4">Join thousands of patients and providers who use HealthBridge to simplify healthcare management.</p>
                  {!user && (
                    <Link to="/register" className="btn btn-light btn-lg px-4">
                      Create Your Free Account
                    </Link>
                  )}
                  {user && (
                    <Link to="/appointments" className="btn btn-light btn-lg px-4">
                      Schedule an Appointment
                    </Link>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* How It Works Section */}
      <section className="how-it-works-section py-5 bg-light">
        <Container>
          <div className="text-center mb-5">
            <h2 className="fw-bold">How HealthBridge Works</h2>
            <p className="lead text-muted">Simple steps to better healthcare management</p>
          </div>
          
          <Row className="g-4">
            <Col md={3}>
              <Card className="h-100 border-0 shadow-sm text-center py-4">
                <Card.Body>
                  <div className="rounded-circle bg-primary text-white d-inline-flex p-3 mb-4" style={{ width: "80px", height: "80px", justifyContent: "center", alignItems: "center" }}>
                    <span className="fs-2 fw-bold">1</span>
                  </div>
                  <Card.Title className="fw-bold">Create Account</Card.Title>
                  <Card.Text>
                    Sign up for free and set up your personal health profile with your medical information.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={3}>
              <Card className="h-100 border-0 shadow-sm text-center py-4">
                <Card.Body>
                  <div className="rounded-circle bg-primary text-white d-inline-flex p-3 mb-4" style={{ width: "80px", height: "80px", justifyContent: "center", alignItems: "center" }}>
                    <span className="fs-2 fw-bold">2</span>
                  </div>
                  <Card.Title className="fw-bold">Find Provider</Card.Title>
                  <Card.Text>
                    Browse our directory of qualified healthcare professionals and facilities.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={3}>
              <Card className="h-100 border-0 shadow-sm text-center py-4">
                <Card.Body>
                  <div className="rounded-circle bg-primary text-white d-inline-flex p-3 mb-4" style={{ width: "80px", height: "80px", justifyContent: "center", alignItems: "center" }}>
                    <span className="fs-2 fw-bold">3</span>
                  </div>
                  <Card.Title className="fw-bold">Book Appointment</Card.Title>
                  <Card.Text>
                    Schedule appointments directly through our platform at your convenience.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={3}>
              <Card className="h-100 border-0 shadow-sm text-center py-4">
                <Card.Body>
                  <div className="rounded-circle bg-primary text-white d-inline-flex p-3 mb-4" style={{ width: "80px", height: "80px", justifyContent: "center", alignItems: "center" }}>
                    <span className="fs-2 fw-bold">4</span>
                  </div>
                  <Card.Title className="fw-bold">Manage Care</Card.Title>
                  <Card.Text>
                    Access your records, receive reminders, and stay on top of your health journey.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Statistics Section */}
      <section className="statistics-section py-5">
        <Container>
          <div className="text-center mb-5">
            <h2 className="fw-bold">HealthBridge Impact</h2>
            <p className="lead text-muted">Making a difference in healthcare delivery</p>
          </div>
          
          <Row className="g-4 text-center">
            <Col md={3}>
              <div className="py-4">
                <FaUsers className="text-primary fs-1 mb-3" />
                <h2 className="fw-bold">10,000+</h2>
                <p className="text-muted">Registered Users</p>
              </div>
            </Col>
            
            <Col md={3}>
              <div className="py-4">
                <FaUserMd className="text-primary fs-1 mb-3" />
                <h2 className="fw-bold">500+</h2>
                <p className="text-muted">Healthcare Providers</p>
              </div>
            </Col>
            
            <Col md={3}>
              <div className="py-4">
                <FaCalendarAlt className="text-primary fs-1 mb-3" />
                <h2 className="fw-bold">25,000+</h2>
                <p className="text-muted">Appointments Booked</p>
              </div>
            </Col>
            
            <Col md={3}>
              <div className="py-4">
                <FaHospital className="text-primary fs-1 mb-3" />
                <h2 className="fw-bold">100+</h2>
                <p className="text-muted">Partner Facilities</p>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Blog/News Section */}
      <section className="blog-section py-5 bg-light">
        <Container>
          <div className="d-flex justify-content-between align-items-center mb-5">
            <div>
              <h2 className="fw-bold">Latest Health Insights</h2>
              <p className="text-muted mb-0">Stay informed with our health articles and updates</p>
            </div>
            <Link to="/blog" className="btn btn-outline-primary">View All Articles</Link>
          </div>
          
          <Row className="g-4">
            <Col md={4}>
              <Card className="h-100 border-0 shadow-sm">
                <div style={{ height: '200px', overflow: 'hidden' }}>
                  <Card.Img variant="top" src="https://images.unsplash.com/photo-1505751172876-fa1923c5c528?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80" alt="Health article" />
                </div>
                <Card.Body className="p-4">
                  <small className="text-muted">June 15, 2025</small>
                  <Card.Title className="fw-bold mt-2">5 Ways to Improve Your Mental Health Today</Card.Title>
                  <Card.Text>
                    Discover simple but effective strategies to enhance your mental wellbeing in your daily routine.
                  </Card.Text>
                  <Link to="/blog/mental-health-tips" className="btn btn-link text-primary p-0">Read More <FaArrowRight className="ms-1" /></Link>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={4}>
              <Card className="h-100 border-0 shadow-sm">
                <div style={{ height: '200px', overflow: 'hidden' }}>
                  <Card.Img variant="top" src="https://images.unsplash.com/photo-1498837167922-ddd27525d352?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=870&q=80" alt="Health article" />
                </div>
                <Card.Body className="p-4">
                  <small className="text-muted">June 2, 2025</small>
                  <Card.Title className="fw-bold mt-2">The Importance of Preventive Healthcare</Card.Title>
                  <Card.Text>
                    Learn why regular check-ups and screenings are crucial for maintaining long-term health.
                  </Card.Text>
                  <Link to="/blog/preventive-healthcare" className="btn btn-link text-primary p-0">Read More <FaArrowRight className="ms-1" /></Link>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={4}>
              <Card className="h-100 border-0 shadow-sm">
                <div style={{ height: '200px', overflow: 'hidden' }}>
                  <Card.Img variant="top" src="https://images.unsplash.com/photo-1511688878353-3a2f5be94cd7?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=687&q=80" alt="Health article" />
                </div>
                <Card.Body className="p-4">
                  <small className="text-muted">May 24, 2025</small>
                  <Card.Title className="fw-bold mt-2">Telehealth: The Future of Medical Consultations</Card.Title>
                  <Card.Text>
                    Explore how virtual healthcare is transforming patient care and improving accessibility.
                  </Card.Text>
                  <Link to="/blog/telehealth-future" className="btn btn-link text-primary p-0">Read More <FaArrowRight className="ms-1" /></Link>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* FAQ Section */}
      <section className="faq-section py-5">
        <Container>
          <div className="text-center mb-5">
            <h2 className="fw-bold">Frequently Asked Questions</h2>
            <p className="lead text-muted">Find answers to common questions about HealthBridge</p>
          </div>
          
          <Row className="justify-content-center">
            <Col lg={10}>
              <Accordion flush>
                <Accordion.Item eventKey="0">
                  <Accordion.Header>How do I schedule an appointment?</Accordion.Header>
                  <Accordion.Body>
                    Once you've created an account, you can schedule an appointment by navigating to the Appointments 
                    section. Select your preferred healthcare provider, choose an available date and time, and confirm 
                    your booking. You'll receive a confirmation email with all the details.
                  </Accordion.Body>
                </Accordion.Item>
                
                <Accordion.Item eventKey="1">
                  <Accordion.Header>Can I access my medical records through HealthBridge?</Accordion.Header>
                  <Accordion.Body>
                    Yes! HealthBridge provides secure access to your medical records, test results, and treatment 
                    plans. All information is encrypted and complies with healthcare privacy regulations. You can 
                    view your records by going to the Medical History section in your account.
                  </Accordion.Body>
                </Accordion.Item>
                
                <Accordion.Item eventKey="2">
                  <Accordion.Header>Is my personal health information secure?</Accordion.Header>
                  <Accordion.Body>
                    Absolutely. HealthBridge employs industry-leading security measures to protect your personal health 
                    information. Our platform is fully HIPAA-compliant, using encryption, secure servers, and strict 
                    access controls to ensure your data remains private.
                  </Accordion.Body>
                </Accordion.Item>
                
                <Accordion.Item eventKey="3">
                  <Accordion.Header>How do I find the right doctor for my needs?</Accordion.Header>
                  <Accordion.Body>
                    Our Provider Directory allows you to search for healthcare professionals by specialty, location, 
                    and availability. You can read profiles, view credentials, and see patient ratings to help you 
                    make an informed decision. You can also filter results based on insurance acceptance and languages spoken.
                  </Accordion.Body>
                </Accordion.Item>
                
                <Accordion.Item eventKey="4">
                  <Accordion.Header>Can I use HealthBridge if I'm a healthcare provider?</Accordion.Header>
                  <Accordion.Body>
                    Yes! HealthBridge offers specialized accounts for doctors, nurses, and healthcare administrators. 
                    These accounts include tools for managing appointments, accessing patient records, and streamlining 
                    administrative tasks. Contact our team for more information on provider accounts.
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
            </Col>
          </Row>
          
          <div className="text-center mt-4">
            <Link to="/contact#faq-section" className="btn btn-outline-primary">View All FAQs</Link>
          </div>
        </Container>
      </section>
    </>
  );
};

export default Landing; 