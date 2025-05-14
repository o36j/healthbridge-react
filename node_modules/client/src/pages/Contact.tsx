import React, { useState, useRef } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Accordion, Spinner } from 'react-bootstrap';
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaClock, FaQuestionCircle, FaBullhorn, FaHeadset, FaHandshake } from 'react-icons/fa';
import emailjs from '@emailjs/browser';
import { useNavigate } from 'react-router-dom';

// EmailJS configuration
// Replace these with your own EmailJS service, template and user IDs
const EMAILJS_SERVICE_ID = 'service_g6qfa56'; // Your EmailJS service ID
const EMAILJS_TEMPLATE_ID = 'template_u5h9cyf'; // Your EmailJS template ID
const EMAILJS_PUBLIC_KEY = 'xKbZOR2L9QacdY5ef'; // Your EmailJS public key

const Contact: React.FC = () => {
  const formRef = useRef<HTMLFormElement>(null);
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    if (!formData.name || !formData.email || !formData.message) {
      setFormError('Please fill in all required fields.');
      return;
    }
    
    setIsSubmitting(true);
    setFormError('');
    
    try {
      // Send email using EmailJS
      const templateParams = {
        from_name: formData.name,
        reply_to: formData.email,
        phone_number: formData.phone || 'Not provided',
        subject: formData.subject || 'General Inquiry',
        message: formData.message
      };
      
      const response = await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        templateParams,
        EMAILJS_PUBLIC_KEY
      );
      
      console.log('Email successfully sent!', response);
      
      // Reset form on success
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
      
      setFormSubmitted(true);
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        setFormSubmitted(false);
      }, 5000);
    } catch (error) {
      console.error('Email sending failed:', error);
      setFormError('Failed to send your message. Please try again later or contact us directly.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Helper function for scrolling to sections
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  return (
    <div className="contact-page">
      {/* Hero Section */}
      <section className="bg-primary text-white py-5">
        <Container className="py-5">
          <Row className="justify-content-center text-center">
            <Col lg={8}>
              <h1 className="display-4 fw-bold mb-4">Contact Us</h1>
              <p className="lead mb-0">
                Have questions or need assistance? Our team is here to help you with anything related to HealthBridge.
              </p>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Contact Information */}
      <section className="py-5" id="contact-information-section">
        <Container className="py-5">
          <Row className="g-4">
            <Col md={6} lg={3}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="text-center p-4">
                  <div className="rounded-circle bg-primary bg-opacity-10 p-3 d-inline-flex mb-3">
                    <FaMapMarkerAlt className="text-primary fs-3" />
                  </div>
                  <Card.Title className="fw-bold">Visit Us</Card.Title>
                  <Card.Text>
                    123 Health Street<br />
                    Ankara, 06000<br />
                    Turkey
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={6} lg={3}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="text-center p-4">
                  <div className="rounded-circle bg-primary bg-opacity-10 p-3 d-inline-flex mb-3">
                    <FaPhone className="text-primary fs-3" />
                  </div>
                  <Card.Title className="fw-bold">Call Us</Card.Title>
                  <Card.Text>
                    Main: (123) 456-7890<br />
                    Support: (123) 456-7891<br />
                    Toll-free: 1-800-HEALTH
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={6} lg={3}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="text-center p-4">
                  <div className="rounded-circle bg-primary bg-opacity-10 p-3 d-inline-flex mb-3">
                    <FaEnvelope className="text-primary fs-3" />
                  </div>
                  <Card.Title className="fw-bold">Email Us</Card.Title>
                  <Card.Text>
                    General: info@healthbridge.com<br />
                    Support: support@healthbridge.com<br />
                    Careers: careers@healthbridge.com
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={6} lg={3}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="text-center p-4">
                  <div className="rounded-circle bg-primary bg-opacity-10 p-3 d-inline-flex mb-3">
                    <FaClock className="text-primary fs-3" />
                  </div>
                  <Card.Title className="fw-bold">Hours</Card.Title>
                  <Card.Text>
                    Monday - Friday: 8am - 8pm<br />
                    Saturday: 9am - 5pm<br />
                    Sunday: Closed
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Map & Contact Form */}
      <section className="py-5 bg-light" id="contact-form-section">
        <Container className="py-5">
          <Row className="g-5">
            <Col lg={6}>
              <h2 className="fw-bold mb-4">Our Location</h2>
              <div className="ratio ratio-4x3 rounded overflow-hidden shadow-sm">
                {/* Placeholder for a map - in a real application, you would use Google Maps or similar */}
                <iframe 
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d195884.99067392955!2d32.62280035!3d39.9035248!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14d347d520732db1%3A0xbdc57b0c0842b8d!2sAnkara%2C%20Turkey!5e0!3m2!1sen!2sus!4v1649962655995!5m2!1sen!2sus" 
                  style={{ border: 0 }} 
                  allowFullScreen 
                  loading="lazy"
                  title="HealthBridge Location"
                ></iframe>
              </div>
              
              <div className="mt-4">
                <h4 className="fw-bold mb-3">Getting Here</h4>
                <p className="mb-3">
                  Our headquarters is conveniently located in Ankara, easily accessible by public transportation and with ample parking nearby.
                </p>
                <ul className="list-unstyled">
                  <li className="mb-2"><strong>By Metro:</strong> Take Ankara Metro to Kızılay Station</li>
                  <li className="mb-2"><strong>By Bus:</strong> Routes 125, 140, 230 all stop within one block</li>
                  <li><strong>Parking:</strong> Public parking available at Kızılay Square</li>
                </ul>
              </div>
            </Col>
            
            <Col lg={6}>
              <Card className="border-0 shadow-sm">
                <Card.Body className="p-4 p-lg-5">
                  <h2 className="fw-bold mb-4">Send Us a Message</h2>
                  
                  {formSubmitted && (
                    <Alert variant="success" className="mb-4">
                      Your message has been sent successfully! We'll get back to you shortly.
                    </Alert>
                  )}
                  
                  {formError && (
                    <Alert variant="danger" className="mb-4">
                      {formError}
                    </Alert>
                  )}
                  
                  <Form ref={formRef} onSubmit={handleSubmit}>
                    <Row className="g-3">
                      <Col md={6}>
                        <Form.Group controlId="contactName">
                          <Form.Label>Your Name *</Form.Label>
                          <Form.Control 
                            type="text" 
                            name="name" 
                            value={formData.name} 
                            onChange={handleChange} 
                            placeholder="Enter your name" 
                            required 
                            disabled={isSubmitting}
                          />
                        </Form.Group>
                      </Col>
                      
                      <Col md={6}>
                        <Form.Group controlId="contactEmail">
                          <Form.Label>Your Email *</Form.Label>
                          <Form.Control 
                            type="email" 
                            name="email" 
                            value={formData.email} 
                            onChange={handleChange} 
                            placeholder="Enter your email" 
                            required 
                            disabled={isSubmitting}
                          />
                        </Form.Group>
                      </Col>
                      
                      <Col md={6}>
                        <Form.Group controlId="contactPhone">
                          <Form.Label>Phone Number</Form.Label>
                          <Form.Control 
                            type="tel" 
                            name="phone" 
                            value={formData.phone} 
                            onChange={handleChange} 
                            placeholder="Enter your phone number" 
                            disabled={isSubmitting}
                          />
                        </Form.Group>
                      </Col>
                      
                      <Col md={6}>
                        <Form.Group controlId="contactSubject">
                          <Form.Label>Subject</Form.Label>
                          <Form.Select 
                            name="subject" 
                            value={formData.subject} 
                            onChange={handleChange}
                            aria-label="Select subject"
                            title="Select a subject for your inquiry"
                            disabled={isSubmitting}
                          >
                            <option value="">Select a subject</option>
                            <option value="general">General Inquiry</option>
                            <option value="support">Technical Support</option>
                            <option value="billing">Billing Question</option>
                            <option value="feedback">Feedback</option>
                            <option value="partnership">Partnership Opportunity</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                      
                      <Col xs={12}>
                        <Form.Group controlId="contactMessage">
                          <Form.Label>Message *</Form.Label>
                          <Form.Control 
                            as="textarea" 
                            name="message" 
                            rows={5} 
                            value={formData.message} 
                            onChange={handleChange} 
                            placeholder="Enter your message" 
                            required 
                            disabled={isSubmitting}
                          />
                        </Form.Group>
                      </Col>
                      
                      <Col xs={12}>
                        <Button 
                          variant="primary" 
                          type="submit" 
                          size="lg" 
                          className="px-4"
                          disabled={isSubmitting}
                        >
                          {isSubmitting ? (
                            <>
                              <Spinner
                                as="span"
                                animation="border"
                                size="sm"
                                role="status"
                                aria-hidden="true"
                                className="me-2"
                              />
                              Sending...
                            </>
                          ) : (
                            'Send Message'
                          )}
                        </Button>
                      </Col>
                    </Row>
                  </Form>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Help Categories */}
      <section className="py-5" id="help-categories-section">
        <Container className="py-5">
          <h2 className="fw-bold text-center mb-5">How Can We Help You?</h2>
          <Row className="g-4">
            <Col md={6} lg={3}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="p-4">
                  <div className="d-flex align-items-center mb-3">
                    <div className="rounded-circle bg-primary text-white p-2 me-3">
                      <FaQuestionCircle />
                    </div>
                    <h4 className="fw-bold mb-0 h5">General Inquiries</h4>
                  </div>
                  <p className="mb-3">
                    Have questions about HealthBridge and how it works? Our team can provide general information about our services.
                  </p>
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={() => navigate('/about')}
                  >
                    Learn More
                  </Button>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={6} lg={3}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="p-4">
                  <div className="d-flex align-items-center mb-3">
                    <div className="rounded-circle bg-primary text-white p-2 me-3">
                      <FaHeadset />
                    </div>
                    <h4 className="fw-bold mb-0 h5">Technical Support</h4>
                  </div>
                  <p className="mb-3">
                    Experiencing issues with the platform? Our technical support team is ready to assist with any problems.
                  </p>
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={() => scrollToSection('contact-information-section')}
                  >
                    Get Support
                  </Button>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={6} lg={3}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="p-4">
                  <div className="d-flex align-items-center mb-3">
                    <div className="rounded-circle bg-primary text-white p-2 me-3">
                      <FaBullhorn />
                    </div>
                    <h4 className="fw-bold mb-0 h5">Media Inquiries</h4>
                  </div>
                  <p className="mb-3">
                    Journalists and media professionals can reach out for press releases, interviews, and media resources.
                  </p>
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={() => scrollToSection('contact-information-section')}
                  >
                    Press Kit
                  </Button>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={6} lg={3}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="p-4">
                  <div className="d-flex align-items-center mb-3">
                    <div className="rounded-circle bg-primary text-white p-2 me-3">
                      <FaHandshake />
                    </div>
                    <h4 className="fw-bold mb-0 h5">Partnerships</h4>
                  </div>
                  <p className="mb-3">
                    Interested in partnering with HealthBridge? Explore opportunities for collaborations and integrations.
                  </p>
                  <Button 
                    variant="outline-primary" 
                    size="sm"
                    onClick={() => scrollToSection('contact-information-section')}
                  >
                    Partner With Us
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* FAQ Section */}
      <section className="py-5 bg-light" id="faq-section">
        <Container className="py-5">
          <Row className="justify-content-center">
            <Col lg={8} className="text-center mb-5">
              <h2 className="fw-bold mb-4">Frequently Asked Questions</h2>
              <p className="lead text-muted">
                Find quick answers to common questions about HealthBridge.
              </p>
            </Col>
          </Row>
          
          <Row className="justify-content-center">
            <Col lg={10}>
              <Accordion defaultActiveKey="0">
                <Accordion.Item eventKey="0" className="border-0 mb-3 shadow-sm">
                  <Accordion.Header className="fw-bold">How do I create an account?</Accordion.Header>
                  <Accordion.Body>
                    Creating an account is simple! Click on the "Register" button at the top of the page, fill out your information, and follow the verification steps. Once verified, you'll have immediate access to our platform.
                  </Accordion.Body>
                </Accordion.Item>
                
                <Accordion.Item eventKey="1" className="border-0 mb-3 shadow-sm">
                  <Accordion.Header className="fw-bold">Is my health information secure?</Accordion.Header>
                  <Accordion.Body>
                    Absolutely. We take security very seriously. All your health information is encrypted, and our platform complies with HIPAA regulations. We implement multiple layers of security to ensure your data remains private and protected.
                  </Accordion.Body>
                </Accordion.Item>
                
                <Accordion.Item eventKey="2" className="border-0 mb-3 shadow-sm">
                  <Accordion.Header className="fw-bold">How do I schedule an appointment?</Accordion.Header>
                  <Accordion.Body>
                    After logging in, navigate to the "Appointments" section. You can search for a doctor by specialty, name, or availability. Select your preferred doctor, choose an available time slot, provide a reason for your visit, and confirm your appointment.
                  </Accordion.Body>
                </Accordion.Item>
                
                <Accordion.Item eventKey="3" className="border-0 mb-3 shadow-sm">
                  <Accordion.Header className="fw-bold">Can I cancel or reschedule my appointment?</Accordion.Header>
                  <Accordion.Body>
                    Yes, you can cancel or reschedule an appointment up to 24 hours before the scheduled time without any penalty. Simply go to the "Appointments" section, find the appointment you want to modify, and select "Cancel" or "Reschedule."
                  </Accordion.Body>
                </Accordion.Item>
                
                <Accordion.Item eventKey="4" className="border-0 mb-3 shadow-sm">
                  <Accordion.Header className="fw-bold">How can I access my medical records?</Accordion.Header>
                  <Accordion.Body>
                    Your medical records are available in the "Medical Records" section of your dashboard. You can view, download, and share these records with healthcare providers. Records are organized by date and type for easy access.
                  </Accordion.Body>
                </Accordion.Item>

                {/* Additional FAQs from Landing Page */}
                <Accordion.Item eventKey="5" className="border-0 mb-3 shadow-sm">
                  <Accordion.Header className="fw-bold">Can I access my medical records through HealthBridge?</Accordion.Header>
                  <Accordion.Body>
                    Yes! HealthBridge provides secure access to your medical records, test results, and treatment 
                    plans. All information is encrypted and complies with healthcare privacy regulations. You can 
                    view your records by going to the Medical History section in your account.
                  </Accordion.Body>
                </Accordion.Item>

                <Accordion.Item eventKey="6" className="border-0 mb-3 shadow-sm">
                  <Accordion.Header className="fw-bold">How do I find the right doctor for my needs?</Accordion.Header>
                  <Accordion.Body>
                    Our Provider Directory allows you to search for healthcare professionals by specialty, location, 
                    and availability. You can read profiles, view credentials, and see patient ratings to help you 
                    make an informed decision. You can also filter results based on insurance acceptance and languages spoken.
                  </Accordion.Body>
                </Accordion.Item>

                <Accordion.Item eventKey="7" className="border-0 shadow-sm">
                  <Accordion.Header className="fw-bold">Can I use HealthBridge if I'm a healthcare provider?</Accordion.Header>
                  <Accordion.Body>
                    Yes! HealthBridge offers specialized accounts for doctors, nurses, and healthcare administrators. 
                    These accounts include tools for managing appointments, accessing patient records, and streamlining 
                    administrative tasks. Contact our team for more information on provider accounts.
                  </Accordion.Body>
                </Accordion.Item>
              </Accordion>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default Contact; 