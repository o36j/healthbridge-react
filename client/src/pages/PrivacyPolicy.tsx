import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="privacy-page">
      {/* Hero Section */}
      <section className="bg-primary text-white py-5">
        <Container className="py-5">
          <Row className="justify-content-center text-center">
            <Col lg={8}>
              <h1 className="display-4 fw-bold mb-4">Privacy Policy</h1>
              <p className="lead mb-0">
                We value your privacy and are committed to protecting your personal and health information.
              </p>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Privacy Content */}
      <section className="py-5">
        <Container>
          <Row className="justify-content-center">
            <Col lg={10}>
              <Card className="border-0 shadow-sm p-4 p-md-5">
                <Card.Body>
                  <div className="mb-5">
                    <h2 className="fw-bold mb-4">1. Introduction</h2>
                    <p>
                      HealthBridge ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our website and mobile application (collectively, the "Service").
                    </p>
                    <p>
                      Please read this Privacy Policy carefully. By using the Service, you agree to the collection and use of information in accordance with this policy. If you do not agree with our policies and practices, do not use our Service.
                    </p>
                  </div>

                  <div className="mb-5">
                    <h2 className="fw-bold mb-4">2. Information We Collect</h2>
                    <p className="fw-bold">Personal Information</p>
                    <p>
                      We may collect personally identifiable information that you provide to us when registering for an account, including:
                    </p>
                    <ul>
                      <li>Name, email address, phone number, and address</li>
                      <li>Date of birth and gender</li>
                      <li>Insurance information</li>
                      <li>Emergency contact information</li>
                      <li>Profile pictures (if uploaded)</li>
                    </ul>

                    <p className="fw-bold mt-4">Health Information</p>
                    <p>
                      As a healthcare platform, we may collect and process health-related information, such as:
                    </p>
                    <ul>
                      <li>Medical history and conditions</li>
                      <li>Medications and allergies</li>
                      <li>Appointment details and doctor notes</li>
                      <li>Test results and medical records</li>
                      <li>Any other health information you choose to provide</li>
                    </ul>

                    <p className="fw-bold mt-4">Automatically Collected Information</p>
                    <p>
                      When you access our Service, we may automatically collect certain information, including:
                    </p>
                    <ul>
                      <li>Device information (e.g., device type, operating system)</li>
                      <li>IP address and browser type</li>
                      <li>Usage patterns and interactions with our Service</li>
                      <li>Cookies and similar tracking technologies</li>
                    </ul>
                  </div>

                  <div className="mb-5">
                    <h2 className="fw-bold mb-4">3. How We Use Your Information</h2>
                    <p>
                      We use the information we collect for various purposes, including:
                    </p>
                    <ul>
                      <li>Providing and maintaining our Service</li>
                      <li>Creating and managing your account</li>
                      <li>Facilitating healthcare appointments and communications</li>
                      <li>Processing payments and transactions</li>
                      <li>Sending administrative information, such as updates and security alerts</li>
                      <li>Personalizing your experience and offering relevant content</li>
                      <li>Analyzing usage patterns to improve our Service</li>
                      <li>Ensuring the security and integrity of our platform</li>
                      <li>Complying with legal obligations</li>
                    </ul>
                  </div>

                  <div className="mb-5">
                    <h2 className="fw-bold mb-4">4. HIPAA Compliance</h2>
                    <p>
                      HealthBridge is committed to complying with the Health Insurance Portability and Accountability Act (HIPAA) where applicable. As such:
                    </p>
                    <ul>
                      <li>We implement appropriate technical, administrative, and physical safeguards to protect the privacy and security of protected health information (PHI)</li>
                      <li>We limit the use and disclosure of PHI to the minimum necessary to accomplish the intended purpose</li>
                      <li>We maintain business associate agreements with third parties that process PHI on our behalf</li>
                      <li>We provide individuals with certain rights regarding their PHI as required by law</li>
                    </ul>
                  </div>

                  <div className="mb-5">
                    <h2 className="fw-bold mb-4">5. Information Sharing and Disclosure</h2>
                    <p>
                      We may share your information in the following circumstances:
                    </p>
                    <ul>
                      <li><strong>Healthcare Providers:</strong> With healthcare providers involved in your care, as authorized by you or as permitted by law</li>
                      <li><strong>Service Providers:</strong> With third-party vendors who provide services on our behalf (e.g., payment processing, data analysis, email delivery)</li>
                      <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets, where your information may be transferred as a business asset</li>
                      <li><strong>Legal Requirements:</strong> When required to do so by law, such as in response to a subpoena or court order</li>
                      <li><strong>Protection of Rights:</strong> To protect our rights, property, or safety, or the rights, property, or safety of others</li>
                    </ul>
                    <p>
                      We will not sell your personal information to third parties.
                    </p>
                  </div>

                  <div className="mb-5">
                    <h2 className="fw-bold mb-4">6. Data Security</h2>
                    <p>
                      We implement appropriate security measures to protect your information from unauthorized access, alteration, disclosure, or destruction. These measures include:
                    </p>
                    <ul>
                      <li>Encryption of sensitive data in transit and at rest</li>
                      <li>Regular security assessments and penetration testing</li>
                      <li>Access controls and authentication mechanisms</li>
                      <li>Employee training on privacy and security practices</li>
                      <li>Incident response procedures</li>
                    </ul>
                    <p>
                      However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security.
                    </p>
                  </div>

                  <div className="mb-5">
                    <h2 className="fw-bold mb-4">7. Your Privacy Rights</h2>
                    <p>
                      Depending on your location, you may have certain rights regarding your personal information, including:
                    </p>
                    <ul>
                      <li>The right to access the personal information we hold about you</li>
                      <li>The right to request correction of inaccurate information</li>
                      <li>The right to request deletion of your information (subject to certain exceptions)</li>
                      <li>The right to restrict or object to processing of your information</li>
                      <li>The right to data portability</li>
                      <li>The right to withdraw consent (where processing is based on consent)</li>
                    </ul>
                    <p>
                      To exercise these rights, please contact us using the details provided in the "Contact Us" section.
                    </p>
                  </div>

                  <div className="mb-5">
                    <h2 className="fw-bold mb-4">8. Children's Privacy</h2>
                    <p>
                      Our Service is not intended for children under 13 years of age, and we do not knowingly collect personal information from children under 13. If we learn we have collected or received personal information from a child under 13 without verification of parental consent, we will delete that information. If you believe we might have any information from or about a child under 13, please contact us.
                    </p>
                  </div>

                  <div className="mb-5">
                    <h2 className="fw-bold mb-4">9. Changes to This Privacy Policy</h2>
                    <p>
                      We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
                    </p>
                    <p>
                      You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
                    </p>
                  </div>

                  <div>
                    <h2 className="fw-bold mb-4">10. Contact Us</h2>
                    <p>
                      If you have any questions about this Privacy Policy or our privacy practices, please contact us at:
                    </p>
                    <ul className="list-unstyled">
                      <li><strong>Email:</strong> privacy@healthbridge.com</li>
                      <li><strong>Phone:</strong> (123) 456-7890</li>
                      <li><strong>Address:</strong> 123 Health Street, New York, NY 10001</li>
                    </ul>
                    <p className="mt-3">
                      For urgent privacy concerns or to report a potential data breach, please contact our Privacy Officer directly at privacy-officer@healthbridge.com.
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-top">
                    <p className="text-muted">
                      Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default PrivacyPolicy; 