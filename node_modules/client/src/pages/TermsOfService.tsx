import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';

const TermsOfService: React.FC = () => {
  return (
    <div className="terms-page">
      {/* Hero Section */}
      <section className="bg-primary text-white py-5">
        <Container className="py-5">
          <Row className="justify-content-center text-center">
            <Col lg={8}>
              <h1 className="display-4 fw-bold mb-4">Terms of Service</h1>
              <p className="lead mb-0">
                Please read these terms and conditions carefully before using the HealthBridge platform.
              </p>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Terms Content */}
      <section className="py-5">
        <Container>
          <Row className="justify-content-center">
            <Col lg={10}>
              <Card className="border-0 shadow-sm p-4 p-md-5">
                <Card.Body>
                  <div className="mb-5">
                    <h2 className="fw-bold mb-4">1. Introduction</h2>
                    <p>
                      Welcome to HealthBridge ("Company", "we", "our", "us")! These Terms of Service ("Terms", "Terms of Service") govern your use of our website and mobile application (collectively, the "Service") operated by HealthBridge.
                    </p>
                    <p>
                      By accessing or using the Service, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the Service.
                    </p>
                  </div>

                  <div className="mb-5">
                    <h2 className="fw-bold mb-4">2. User Accounts</h2>
                    <p>
                      When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
                    </p>
                    <p>
                      You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password, whether your password is with our Service or a third-party service.
                    </p>
                    <p>
                      You agree not to disclose your password to any third party. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.
                    </p>
                  </div>

                  <div className="mb-5">
                    <h2 className="fw-bold mb-4">3. Healthcare Disclaimer</h2>
                    <p>
                      The HealthBridge platform is designed to facilitate healthcare management and communication but is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
                    </p>
                    <p>
                      The content provided through our Service is for informational purposes only. HealthBridge does not provide medical advice, diagnoses, or treatment recommendations.
                    </p>
                  </div>

                  <div className="mb-5">
                    <h2 className="fw-bold mb-4">4. Intellectual Property</h2>
                    <p>
                      The Service and its original content, features, and functionality are and will remain the exclusive property of HealthBridge and its licensors. The Service is protected by copyright, trademark, and other laws of both the United States and foreign countries.
                    </p>
                    <p>
                      Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of HealthBridge.
                    </p>
                  </div>

                  <div className="mb-5">
                    <h2 className="fw-bold mb-4">5. User Content</h2>
                    <p>
                      Our Service allows you to post, link, store, share, and otherwise make available certain information, text, graphics, videos, or other material ("Content"). You are responsible for the Content that you post on or through the Service, including its legality, reliability, and appropriateness.
                    </p>
                    <p>
                      By posting Content on or through the Service, you represent and warrant that: (i) the Content is yours (you own it) or you have the right to use it and grant us the rights and license as provided in these Terms, and (ii) the posting of your Content on or through the Service does not violate the privacy rights, publicity rights, copyrights, contract rights, or any other rights of any person.
                    </p>
                  </div>

                  <div className="mb-5">
                    <h2 className="fw-bold mb-4">6. Privacy</h2>
                    <p>
                      Your privacy is important to us. Our Privacy Policy describes how we collect, use, and disclose information about you when you use our Service. By using the Service, you agree to the collection and use of information in accordance with our Privacy Policy.
                    </p>
                    <p>
                      We comply with all applicable healthcare privacy laws, including the Health Insurance Portability and Accountability Act (HIPAA) where applicable.
                    </p>
                  </div>

                  <div className="mb-5">
                    <h2 className="fw-bold mb-4">7. Termination</h2>
                    <p>
                      We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
                    </p>
                    <p>
                      Upon termination, your right to use the Service will immediately cease. If you wish to terminate your account, you may simply discontinue using the Service or contact us to request account deletion.
                    </p>
                  </div>

                  <div className="mb-5">
                    <h2 className="fw-bold mb-4">8. Limitation of Liability</h2>
                    <p>
                      In no event shall HealthBridge, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from (i) your access to or use of or inability to access or use the Service; (ii) any conduct or content of any third party on the Service; (iii) any content obtained from the Service; and (iv) unauthorized access, use, or alteration of your transmissions or content, whether based on warranty, contract, tort (including negligence), or any other legal theory, whether or not we have been informed of the possibility of such damage.
                    </p>
                  </div>

                  <div className="mb-5">
                    <h2 className="fw-bold mb-4">9. Changes to Terms</h2>
                    <p>
                      We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
                    </p>
                    <p>
                      By continuing to access or use our Service after those revisions become effective, you agree to be bound by the revised terms. If you do not agree to the new terms, please stop using the Service.
                    </p>
                  </div>

                  <div>
                    <h2 className="fw-bold mb-4">10. Contact Us</h2>
                    <p>
                      If you have any questions about these Terms, please contact us at:
                    </p>
                    <ul className="list-unstyled">
                      <li><strong>Email:</strong> legal@healthbridge.com</li>
                      <li><strong>Phone:</strong> (123) 456-7890</li>
                      <li><strong>Address:</strong> 123 Health Street, New York, NY 10001</li>
                    </ul>
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

export default TermsOfService; 