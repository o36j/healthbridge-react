/**
 * Login Page Component
 * 
 * This component provides the user authentication interface allowing users to:
 * - Sign in with email and password
 * - Navigate to registration page for new accounts
 * - Reset forgotten passwords
 * 
 * It handles form validation, submission, error states, and successful login redirection.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { FaUser, FaLock, FaSignInAlt } from 'react-icons/fa';

/**
 * Login Component
 * 
 * Renders the login form and manages login submission state
 */
const Login = () => {
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Hooks
  const { login } = useAuth();
  const navigate = useNavigate();
  
  /**
   * Handle form submission
   * Validates input fields and attempts to log in the user
   * 
   * @param e - Form submission event
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    // Validate form inputs
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    try {
      setIsLoading(true);
      // Call the login function from AuthContext
      await login(email, password);
      
      // Show success message
      setSuccessMessage(`Welcome back! Redirecting to home page...`);
      
      // Add a delay before redirecting to ensure auth state is properly set
      setTimeout(() => {
        // Redirect to home page after login
        navigate('/');
        setIsLoading(false);
      }, 2000); // 2 seconds to show the success message
      
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };
  
  return (
    <div className="auth-page bg-light py-5">
      <Container>
        <Row className="justify-content-center">
          <Col md={8} lg={6} xl={5}>
            {/* Login card with shadow effect */}
            <Card className="border-0 shadow-sm rounded-3 overflow-hidden">
              {/* Card header */}
              <div className="bg-primary text-white text-center py-4">
                <h3 className="fw-bold mb-0">Sign In to HealthBridge</h3>
              </div>
              
              {/* Card body containing the login form */}
              <Card.Body className="p-4 p-lg-5">
                {/* Error message alert */}
                {error && (
                  <Alert variant="danger" className="mb-4">
                    {error}
                  </Alert>
                )}
                
                {/* Success message alert */}
                {successMessage && (
                  <Alert variant="success" className="mb-4">
                    {successMessage}
                  </Alert>
                )}
                
                {/* Login form */}
                <Form onSubmit={handleSubmit}>
                  {/* Email input field */}
                  <Form.Group className="mb-4">
                    <Form.Label>Email Address</Form.Label>
                    <div className="input-group">
                      <span className="input-group-text bg-light">
                        <FaUser className="text-primary" />
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
                  
                  {/* Password input field with forgot password link */}
                  <Form.Group className="mb-4">
                    <div className="d-flex justify-content-between align-items-center">
                      <Form.Label>Password</Form.Label>
                      <Link to="/forgot-password" className="text-primary small">
                        Forgot Password?
                      </Link>
                    </div>
                    <div className="input-group">
                      <span className="input-group-text bg-light">
                        <FaLock className="text-primary" />
                      </span>
                      <Form.Control
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="py-2"
                      />
                    </div>
                  </Form.Group>
                  
                  {/* Remember me checkbox */}
                  <Form.Group className="mb-4">
                    <Form.Check
                      type="checkbox"
                      id="remember-me"
                      label="Remember me"
                    />
                  </Form.Group>
                  
                  {/* Submit button with loading state */}
                  <Button 
                    variant="primary"
                    type="submit"
                    className="w-100 py-2 mb-4"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Signing in...
                      </>
                    ) : (
                      <>
                        <FaSignInAlt className="me-2" /> Sign In
                      </>
                    )}
                  </Button>
                  
                  {/* Link to registration page */}
                  <div className="text-center">
                    <p className="mb-0">
                      Don't have an account?{' '}
                      <Link to="/register" className="text-primary fw-medium">
                        Create an Account
                      </Link>
                    </p>
                  </div>
                </Form>
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

export default Login; 