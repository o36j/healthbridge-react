import React from 'react';
import { Container, Row, Col, Card, Accordion, ListGroup, Badge } from 'react-bootstrap';
import { FaVideo, FaCalendarCheck, FaLaptopMedical, FaMicrophone, FaHeadset, FaWifi, FaLightbulb, FaUser, FaKey } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import { useAuth, UserRole } from '../contexts/AuthContext';

const TelehealthGuide: React.FC = () => {
  const { user } = useAuth();
  const isDoctor = user?.role === UserRole.DOCTOR;
  
  return (
    <Container className="py-5">
      <Row className="mb-5">
        <Col>
          <h1 className="display-5 mb-4">
            <FaVideo className="text-primary me-2" /> 
            Telehealth Guide
          </h1>
          <p className="lead">
            Everything you need to know about virtual appointments on HealthBridge
          </p>
        </Col>
      </Row>
      
      {/* Quick Start Guide */}
      <Row className="mb-5">
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-4">
              <h2 className="mb-4">Quick Start Guide</h2>
              
              <Row>
                <Col md={4} className="mb-4 mb-md-0">
                  <div className="text-center">
                    <div className="bg-light rounded-circle d-inline-flex p-3 mb-3">
                      <FaCalendarCheck className="text-primary fs-1" />
                    </div>
                    <h5>Book Your Appointment</h5>
                    <p className="small text-muted">
                      {isDoctor 
                        ? "Your patients can schedule telehealth appointments with you" 
                        : "Schedule with doctors who offer telehealth services"}
                    </p>
                  </div>
                </Col>
                
                <Col md={4} className="mb-4 mb-md-0">
                  <div className="text-center">
                    <div className="bg-light rounded-circle d-inline-flex p-3 mb-3">
                      <FaLaptopMedical className="text-primary fs-1" />
                    </div>
                    <h5>Prepare Your Setup</h5>
                    <p className="small text-muted">
                      Ensure your camera, microphone, and internet connection are working
                    </p>
                  </div>
                </Col>
                
                <Col md={4}>
                  <div className="text-center">
                    <div className="bg-light rounded-circle d-inline-flex p-3 mb-3">
                      <FaVideo className="text-primary fs-1" />
                    </div>
                    <h5>Join Your Meeting</h5>
                    <p className="small text-muted">
                      Click the join button when it's time for your appointment
                    </p>
                  </div>
                </Col>
              </Row>
              
              <div className="text-center mt-4">
                <Link to="/appointments" className="btn btn-primary">
                  Go to My Appointments
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Patient or Doctor Specific Guide */}
      <Row className="mb-5">
        <Col lg={6} className="mb-4 mb-lg-0">
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-primary text-white">
              <h3 className="mb-0">
                <FaUser className="me-2" />
                {isDoctor ? "Doctor Guide" : "Patient Guide"}
              </h3>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                <ListGroup.Item className="d-flex align-items-start py-3 px-0 border-bottom">
                  <Badge bg="primary" className="mt-1 me-3">1</Badge>
                  <div>
                    <h5>{isDoctor ? "Enable Telehealth in Your Profile" : "Find Doctors Offering Telehealth"}</h5>
                    <p className="text-muted mb-0">
                      {isDoctor 
                        ? "Make sure you've enabled telehealth in your profile settings to allow patients to book virtual appointments with you." 
                        : "When booking appointments, use the telehealth filter to find doctors who offer virtual visits."}
                    </p>
                  </div>
                </ListGroup.Item>
                
                <ListGroup.Item className="d-flex align-items-start py-3 px-0 border-bottom">
                  <Badge bg="primary" className="mt-1 me-3">2</Badge>
                  <div>
                    <h5>{isDoctor ? "Review Upcoming Telehealth Appointments" : "Book a Telehealth Appointment"}</h5>
                    <p className="text-muted mb-0">
                      {isDoctor 
                        ? "Check your appointment schedule for upcoming telehealth visits and ensure you have the necessary patient information." 
                        : "When booking, select 'Schedule as Telehealth Visit' after choosing a doctor who offers virtual appointments."}
                    </p>
                  </div>
                </ListGroup.Item>
                
                <ListGroup.Item className="d-flex align-items-start py-3 px-0 border-bottom">
                  <Badge bg="primary" className="mt-1 me-3">3</Badge>
                  <div>
                    <h5>Prepare Your Environment</h5>
                    <p className="text-muted mb-0">
                      Find a quiet, well-lit space with a reliable internet connection. Test your camera and microphone before the appointment.
                    </p>
                  </div>
                </ListGroup.Item>
                
                <ListGroup.Item className="d-flex align-items-start py-3 px-0 border-bottom">
                  <Badge bg="primary" className="mt-1 me-3">4</Badge>
                  <div>
                    <h5>Join the Virtual Meeting</h5>
                    <p className="text-muted mb-0">
                      When it's time for your appointment, go to the appointment details and click the "Join" button to enter the virtual meeting room.
                    </p>
                  </div>
                </ListGroup.Item>
                
                <ListGroup.Item className="d-flex align-items-start py-3 px-0">
                  <Badge bg="primary" className="mt-1 me-3">5</Badge>
                  <div>
                    <h5>{isDoctor ? "Document the Visit" : "Follow Up After the Visit"}</h5>
                    <p className="text-muted mb-0">
                      {isDoctor 
                        ? "After the appointment, complete any necessary documentation in the patient's record." 
                        : "After your appointment, you can view any prescriptions or follow-up instructions in your health record."}
                    </p>
                  </div>
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={6}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-info text-white">
              <h3 className="mb-0">
                <FaKey className="me-2" />
                Technical Requirements
              </h3>
            </Card.Header>
            <Card.Body>
              <ListGroup variant="flush">
                <ListGroup.Item className="d-flex align-items-center py-3 px-0 border-bottom">
                  <div className="bg-light rounded-circle p-2 me-3">
                    <FaLaptopMedical className="text-primary" />
                  </div>
                  <div>
                    <h5>Device Requirements</h5>
                    <p className="text-muted mb-0">
                      Computer, tablet, or smartphone with a camera and microphone
                    </p>
                  </div>
                </ListGroup.Item>
                
                <ListGroup.Item className="d-flex align-items-center py-3 px-0 border-bottom">
                  <div className="bg-light rounded-circle p-2 me-3">
                    <FaWifi className="text-primary" />
                  </div>
                  <div>
                    <h5>Internet Connection</h5>
                    <p className="text-muted mb-0">
                      Stable internet connection (minimum 1 Mbps upload/download)
                    </p>
                  </div>
                </ListGroup.Item>
                
                <ListGroup.Item className="d-flex align-items-center py-3 px-0 border-bottom">
                  <div className="bg-light rounded-circle p-2 me-3">
                    <FaHeadset className="text-primary" />
                  </div>
                  <div>
                    <h5>Audio</h5>
                    <p className="text-muted mb-0">
                      Working microphone and speakers or headphones
                    </p>
                  </div>
                </ListGroup.Item>
                
                <ListGroup.Item className="d-flex align-items-center py-3 px-0">
                  <div className="bg-light rounded-circle p-2 me-3">
                    <FaVideo className="text-primary" />
                  </div>
                  <div>
                    <h5>Video</h5>
                    <p className="text-muted mb-0">
                      Working camera (built-in or external)
                    </p>
                  </div>
                </ListGroup.Item>
              </ListGroup>
            </Card.Body>
          </Card>
          
          <Card className="border-0 shadow-sm mt-4">
            <Card.Header className="bg-warning text-dark">
              <h3 className="mb-0">
                <FaLightbulb className="me-2" />
                Tips for a Great Experience
              </h3>
            </Card.Header>
            <Card.Body>
              <ul className="mb-0">
                <li className="mb-2">Join from a quiet, private location</li>
                <li className="mb-2">Ensure you have good lighting on your face</li>
                <li className="mb-2">Position your camera at eye level</li>
                <li className="mb-2">Close other applications using your camera or microphone</li>
                <li className="mb-2">Use headphones if possible to reduce echo</li>
                <li className="mb-2">Have a backup device ready just in case</li>
                <li>Join 5 minutes early to test your setup</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* FAQ Section */}
      <Row>
        <Col>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-light">
              <h3 className="mb-0">Frequently Asked Questions</h3>
            </Card.Header>
            <Card.Body>
              <Accordion>
                <Accordion.Item eventKey="0">
                  <Accordion.Header>What if I have technical issues during my appointment?</Accordion.Header>
                  <Accordion.Body>
                    If you experience technical difficulties, try refreshing your browser first. If problems persist, you can call our technical support line at (555) 123-4567. If the video call cannot be established, your doctor may call you on the phone number in your profile or reschedule the appointment.
                  </Accordion.Body>
                </Accordion.Item>
                
                <Accordion.Item eventKey="1">
                  <Accordion.Header>How secure is the telehealth platform?</Accordion.Header>
                  <Accordion.Body>
                    Our telehealth platform uses end-to-end encryption and is fully HIPAA-compliant to ensure the privacy and security of your medical information. We never record or store video sessions without explicit consent from both parties.
                  </Accordion.Body>
                </Accordion.Item>
                
                <Accordion.Item eventKey="2">
                  <Accordion.Header>What browsers are supported for telehealth visits?</Accordion.Header>
                  <Accordion.Body>
                    Our telehealth platform works best on recent versions of Chrome, Firefox, Safari, and Edge. We recommend updating your browser to the latest version for the best experience.
                  </Accordion.Body>
                </Accordion.Item>
                
                <Accordion.Item eventKey="3">
                  <Accordion.Header>Can I share documents during a telehealth appointment?</Accordion.Header>
                  <Accordion.Body>
                    Yes, both patients and doctors can share documents during the telehealth appointment. Click on the "Share" button in the telehealth interface to upload and share documents securely.
                  </Accordion.Body>
                </Accordion.Item>
                
                <Accordion.Item eventKey="4">
                  <Accordion.Header>How long before my appointment can I join the meeting?</Accordion.Header>
                  <Accordion.Body>
                    The "Join" button becomes active 15 minutes before your scheduled appointment time. We recommend joining 5-10 minutes early to test your audio and video setup.
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default TelehealthGuide; 