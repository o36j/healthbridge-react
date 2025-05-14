import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { FaStethoscope, FaUsers, FaChartLine, FaHistory, FaLightbulb, FaHandshake } from 'react-icons/fa';

const About: React.FC = () => {
  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="bg-primary text-white py-5">
        <Container className="py-5">
          <Row className="justify-content-center text-center">
            <Col lg={8}>
              <h1 className="display-4 fw-bold mb-4">About HealthBridge</h1>
              <p className="lead mb-0">
                HealthBridge is a leading healthcare management platform dedicated to transforming the healthcare experience 
                for patients and providers alike. Our mission is to bridge the gap between patients and quality healthcare.
              </p>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Our Story */}
      <section className="py-5">
        <Container className="py-5">
          <Row className="align-items-center">
            <Col lg={6} className="mb-4 mb-lg-0">
              <img 
                src="/assets/Our Story.jpg" 
                alt="HealthBridge Story" 
                className="img-fluid rounded-4 shadow"
              />
            </Col>
            <Col lg={6}>
              <h2 className="fw-bold mb-4">Our Story</h2>
              <p className="mb-4">
                Founded in 2025, HealthBridge began with a vision to revolutionize healthcare management. The complexity of healthcare
                processes for both patients and providers inspired our founder to create a solution that would streamline the entire
                healthcare journey.
              </p>
              <p>
                What began as an ambitious graduation project has evolved into a comprehensive healthcare management 
                platform designed to serve patients and healthcare providers everywhere. HealthBridge 
                represents the future of healthcare technology, constantly adapting to meet the 
                ever-changing needs of the healthcare landscape.
              </p>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Our Mission & Vision */}
      <section className="py-5 bg-light">
        <Container className="py-5">
          <Row className="justify-content-center text-center mb-5">
            <Col lg={8}>
              <h2 className="fw-bold mb-4">Our Mission & Vision</h2>
              <p className="lead">
                We're on a mission to make healthcare more accessible, efficient, and personalized for everyone.
              </p>
            </Col>
          </Row>
          <Row className="g-4">
            <Col md={6}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="p-4 p-lg-5">
                  <h3 className="fw-bold mb-3">Our Mission</h3>
                  <p className="mb-0">
                    To transform healthcare delivery by connecting patients with the right healthcare providers and services 
                    through innovative technology, making quality healthcare accessible to all.
                  </p>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="p-4 p-lg-5">
                  <h3 className="fw-bold mb-3">Our Vision</h3>
                  <p className="mb-0">
                    To create a world where everyone has easy access to personalized healthcare, where patient-provider 
                    relationships are strengthened through technology, and where health outcomes are improved through 
                    efficient coordination of care.
                  </p>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Core Values */}
      <section className="py-5">
        <Container className="py-5">
          <Row className="justify-content-center text-center mb-5">
            <Col lg={8}>
              <h2 className="fw-bold mb-4">Our Core Values</h2>
              <p className="lead">
                These principles guide our decisions, shape our culture, and define how we serve our users.
              </p>
            </Col>
          </Row>
          <Row className="g-4">
            <Col md={6} lg={3}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="text-center p-4">
                  <div className="rounded-circle bg-primary bg-opacity-10 p-3 d-inline-flex mb-3">
                    <FaUsers className="text-primary fs-3" />
                  </div>
                  <Card.Title className="fw-bold">Patient-Centered</Card.Title>
                  <Card.Text>
                    We put patients at the center of everything we do, ensuring our solutions meet their needs and improve their healthcare experience.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6} lg={3}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="text-center p-4">
                  <div className="rounded-circle bg-primary bg-opacity-10 p-3 d-inline-flex mb-3">
                    <FaStethoscope className="text-primary fs-3" />
                  </div>
                  <Card.Title className="fw-bold">Clinical Excellence</Card.Title>
                  <Card.Text>
                    We uphold the highest standards of clinical excellence, partnering with top healthcare providers to deliver quality care.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6} lg={3}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="text-center p-4">
                  <div className="rounded-circle bg-primary bg-opacity-10 p-3 d-inline-flex mb-3">
                    <FaChartLine className="text-primary fs-3" />
                  </div>
                  <Card.Title className="fw-bold">Innovation</Card.Title>
                  <Card.Text>
                    We continuously innovate to develop solutions that address the evolving challenges in healthcare delivery.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6} lg={3}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="text-center p-4">
                  <div className="rounded-circle bg-primary bg-opacity-10 p-3 d-inline-flex mb-3">
                    <FaHistory className="text-primary fs-3" />
                  </div>
                  <Card.Title className="fw-bold">Integrity</Card.Title>
                  <Card.Text>
                    We operate with transparency, honesty, and ethical principles, earning the trust of our users and partners.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Team Section */}
      <section className="py-5 bg-light">
        <Container className="py-5">
          <h2 className="fw-bold text-center mb-5">Our Team</h2>
          <Row className="g-4">
            <Col md={6}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Img variant="top" src="https://placehold.co/600x400/0284c7/white?text=Founder" />
                <Card.Body className="text-center p-4">
                  <Card.Title className="fw-bold">Founder & CEO</Card.Title>
                  <p className="text-muted mb-3">Visionary & Lead Developer</p>
                  <Card.Text>
                    The driving force behind HealthBridge, bringing together healthcare expertise and technological innovation to create a platform that transforms healthcare management.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="h-100 border-0 shadow-sm">
                <Card.Img variant="top" src="https://placehold.co/600x400/0284c7/white?text=Contributor" />
                <Card.Body className="text-center p-4">
                  <Card.Title className="fw-bold">Co-Founder</Card.Title>
                  <p className="text-muted mb-3">Technical Contributor</p>
                  <Card.Text>
                    Collaborated on the early development phases of HealthBridge, providing technical support to help bring the vision to reality.
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Journey Illustration */}
      <section className="py-5">
        <Container className="py-5">
          <Row className="justify-content-center text-center mb-5">
            <Col lg={8}>
              <h2 className="fw-bold mb-4">Our Journey</h2>
              <p className="lead">
                From graduation project to healthcare innovation
              </p>
            </Col>
          </Row>
          <Row className="align-items-center mb-5">
            <Col lg={5} className="mb-4 mb-lg-0">
              <img 
                src="/assets/Journey Timeline.png" 
                alt="HealthBridge Journey" 
                className="img-fluid rounded-4 shadow"
              />
            </Col>
            <Col lg={7}>
              <div className="timeline">
                <div className="timeline-item mb-4 d-flex align-items-center">
                  <div className="timeline-icon bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', minWidth: '40px' }}>
                    <FaLightbulb />
                  </div>
                  <div className="ms-3">
                    <h5 className="fw-bold">The Inception</h5>
                    <p>Born as a graduation project with a vision to simplify healthcare management</p>
                  </div>
                </div>
                <div className="timeline-item mb-4 d-flex align-items-center">
                  <div className="timeline-icon bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', minWidth: '40px' }}>
                    <FaChartLine />
                  </div>
                  <div className="ms-3">
                    <h5 className="fw-bold">Development & Growth</h5>
                    <p>Evolving from concept to a fully functional healthcare platform</p>
                  </div>
                </div>
                <div className="timeline-item d-flex align-items-center">
                  <div className="timeline-icon bg-primary text-white rounded-circle d-flex align-items-center justify-content-center" style={{ width: '40px', height: '40px', minWidth: '40px' }}>
                    <FaHandshake />
                  </div>
                  <div className="ms-3">
                    <h5 className="fw-bold">Future Vision</h5>
                    <p>Expanding capabilities to become the ultimate healthcare management solution</p>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
          
          {/* Additional journey illustrations */}
          <Row className="mt-5 pt-4">
            <Col md={4} className="mb-4 mb-md-0">
              <Card className="h-100 border-0 shadow-sm overflow-hidden">
                <Card.Img variant="top" src="/assets/Healthcare Technology.jpg" />
                <Card.Body className="p-4">
                  <Card.Title className="fw-bold">Advanced Technology</Card.Title>
                  <Card.Text>
                    Leveraging cutting-edge technology to create intuitive healthcare management solutions
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={4} className="mb-4 mb-md-0">
              <Card className="h-100 border-0 shadow-sm overflow-hidden">
                <Card.Img variant="top" src="/assets/Patient Experience.jpg" />
                <Card.Body className="p-4">
                  <Card.Title className="fw-bold">Patient Experience</Card.Title>
                  <Card.Text>
                    Designed with patients in mind to provide a seamless and supportive healthcare journey
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            
            <Col md={4}>
              <Card className="h-100 border-0 shadow-sm overflow-hidden">
                <Card.Img variant="top" src="/assets/Provider Solution.jpg" />
                <Card.Body className="p-4">
                  <Card.Title className="fw-bold">Provider Solutions</Card.Title>
                  <Card.Text>
                    Empowering healthcare providers with tools to deliver efficient, high-quality care
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default About; 