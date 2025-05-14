import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { FaEnvelope, FaPaperPlane, FaArrowLeft } from 'react-icons/fa';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    try {
      setIsLoading(true);
      // In a real application, this would make an API call to send a password reset email
      // For this demo, we'll just simulate a successful request
      setTimeout(() => {
        setSuccess(true);
        setIsLoading(false);
      }, 1500);
    } catch (error: any) {
      setError(error.message || 'An error occurred. Please try again.');
      setIsLoading(false);
    }
  };
  
  return (
    <div className="auth-page bg-light py-5">
      <Container>
        <Row className="justify-content-center">
          <Col md={8} lg={6} xl={5}>
            <Card className="border-0 shadow-sm rounded-3 overflow-hidden">
              {/* Card header */}
              <div className="bg-primary text-white text-center py-4">
                <h3 className="fw-bold mb-0">Reset Your Password</h3>
        </div>
        
              <Card.Body className="p-4 p-lg-5">
                {/* Error message alert */}
        {error && (
                  <Alert variant="danger" className="mb-4">
            {error}
                  </Alert>
        )}
        
                {/* Success state */}
        {success ? (
                  <div className="text-center">
                    <div className="mb-4">
                      <div className="bg-success text-white rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px' }}>
                        <FaPaperPlane size={36} />
            </div>
                    </div>
                    <Alert variant="success">
                      <h5 className="alert-heading mb-2">Email Sent Successfully!</h5>
                      <p>Check your email for a link to reset your password. If it doesn't appear within a few minutes, check your spam folder.</p>
                    </Alert>
                    <Button 
                      as={Link} 
                      to="/login" 
                      variant="primary" 
                      className="mt-3"
                    >
                      <FaArrowLeft className="me-2" /> Return to Login
                    </Button>
          </div>
        ) : (
                  <>
                    {/* Instruction text */}
                    <p className="text-center text-muted mb-4">
                      Enter your email address and we'll send you a link to reset your password.
                    </p>
                    
                    {/* Password reset form */}
                    <Form onSubmit={handleSubmit}>
                      <Form.Group className="mb-4">
                        <Form.Label>Email Address</Form.Label>
                        <div className="input-group">
                          <span className="input-group-text bg-light">
                            <FaEnvelope className="text-primary" />
                          </span>
                          <Form.Control
                type="email"
                            placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                            required
                            className="py-2"
              />
            </div>
                      </Form.Group>
            
            <Button
                        variant="primary"
              type="submit"
                        className="w-100 py-2 mb-4"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Sending...
                          </>
                        ) : (
                          <>
                            <FaPaperPlane className="me-2" /> Send Reset Link
                          </>
                        )}
            </Button>
            
            <div className="text-center">
                        <Link to="/login" className="text-primary">
                          <FaArrowLeft className="me-1" /> Back to Login
                        </Link>
                      </div>
                    </Form>
                  </>
                )}
              </Card.Body>
            </Card>
            
            {/* Back to home link */}
            <div className="text-center mt-4">
              <Link to="/" className="text-muted">
                &larr; Back to Home
              </Link>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default ForgotPassword; 