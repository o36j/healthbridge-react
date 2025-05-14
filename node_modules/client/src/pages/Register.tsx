import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import { FaUser, FaLock, FaEnvelope, FaUserPlus, FaUserMd, FaUserNurse } from 'react-icons/fa';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: UserRole.PATIENT,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const { register } = useAuth();
  const navigate = useNavigate();
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    
    const { firstName, lastName, email, password, confirmPassword, role } = formData;
    
    // Validate form
    if (!firstName || !lastName || !email || !password) {
      setError('Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    
    try {
      setIsLoading(true);
      await register({
        firstName,
        lastName,
        email,
        password,
        role: role as UserRole,
      });
      
      // Show success message
      setSuccessMessage(`Account created successfully! Welcome to HealthBridge, ${firstName}. Redirecting to home page...`);
      
      // Add a delay before redirecting
      setTimeout(() => {
        // Redirect to home page after registration
        navigate('/');
      }, 2000); // 2 second delay to show success message
      
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    }
  };
  
  return (
    <div className="auth-page bg-light py-5">
      <Container>
        <Row className="justify-content-center">
          <Col md={10} lg={8} xl={7}>
            <Card className="border-0 shadow-sm rounded-3 overflow-hidden">
              <div className="bg-primary text-white text-center py-4">
                <h3 className="fw-bold mb-0">Create Your HealthBridge Account</h3>
              </div>
              
              <Card.Body className="p-4 p-lg-5">
                {error && (
                  <Alert variant="danger" className="mb-4">
                    {error}
                  </Alert>
                )}
                
                {successMessage && (
                  <Alert variant="success" className="mb-4">
                    {successMessage}
                  </Alert>
                )}
                
                <Form onSubmit={handleSubmit}>
                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>First Name</Form.Label>
                        <Form.Control
                          type="text"
                          name="firstName"
                          placeholder="Enter your first name"
                          value={formData.firstName}
                          onChange={handleChange}
                          required
                          className="py-2"
                        />
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Last Name</Form.Label>
                        <Form.Control
                          type="text"
                          name="lastName"
                          placeholder="Enter your last name"
                          value={formData.lastName}
                          onChange={handleChange}
                          required
                          className="py-2"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Email Address</Form.Label>
                    <div className="input-group">
                      <span className="input-group-text bg-light">
                        <FaEnvelope className="text-primary" />
                      </span>
                      <Form.Control
                        type="email"
                        name="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="py-2"
                      />
                    </div>
                  </Form.Group>
                  
                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Password</Form.Label>
                        <div className="input-group">
                          <span className="input-group-text bg-light">
                            <FaLock className="text-primary" />
                          </span>
                          <Form.Control
                            type="password"
                            name="password"
                            placeholder="Create a password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className="py-2"
                          />
                        </div>
                        <Form.Text className="text-muted">
                          Must be at least 6 characters long.
                        </Form.Text>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Confirm Password</Form.Label>
                        <Form.Control
                          type="password"
                          name="confirmPassword"
                          placeholder="Confirm your password"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          required
                          className="py-2"
                        />
                      </Form.Group>
                    </Col>
                  </Row>
                  
                  <Form.Group className="mb-4">
                    <Form.Label>Register as</Form.Label>
                    <div className="d-flex flex-wrap gap-3">
                      <Form.Check
                        type="radio"
                        id="role-patient"
                        name="role"
                        value={UserRole.PATIENT}
                        label={
                          <span className="d-flex align-items-center">
                            <FaUser className="me-2 text-primary" /> Patient
                          </span>
                        }
                        checked={formData.role === UserRole.PATIENT}
                        onChange={handleChange}
                        className="p-2 border rounded cursor-pointer bg-light"
                      />
                      <Form.Check
                        type="radio"
                        id="role-doctor"
                        name="role"
                        value={UserRole.DOCTOR}
                        label={
                          <span className="d-flex align-items-center">
                            <FaUserMd className="me-2 text-primary" /> Doctor
                          </span>
                        }
                        checked={formData.role === UserRole.DOCTOR}
                        onChange={handleChange}
                        className="p-2 border rounded cursor-pointer bg-light"
                      />
                      <Form.Check
                        type="radio"
                        id="role-nurse"
                        name="role"
                        value={UserRole.NURSE}
                        label={
                          <span className="d-flex align-items-center">
                            <FaUserNurse className="me-2 text-primary" /> Nurse
                          </span>
                        }
                        checked={formData.role === UserRole.NURSE}
                        onChange={handleChange}
                        className="p-2 border rounded cursor-pointer bg-light"
                      />
                    </div>
                  </Form.Group>
                  
                  <Form.Group className="mb-4">
                    <Form.Check
                      type="checkbox"
                      id="terms"
                      label={
                        <span>
                          I agree to the{' '}
                          <Link to="/terms" className="text-primary">
                            Terms of Service
                          </Link>{' '}
                          and{' '}
                          <Link to="/privacy" className="text-primary">
                            Privacy Policy
                          </Link>
                        </span>
                      }
                      required
                    />
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
                        Creating Account...
                      </>
                    ) : (
                      <>
                        <FaUserPlus className="me-2" /> Create Account
                      </>
                    )}
                  </Button>
                  
                  <div className="text-center">
                    <p className="mb-0">
                      Already have an account?{' '}
                      <Link to="/login" className="text-primary fw-medium">
                        Sign In
                      </Link>
                    </p>
                  </div>
                </Form>
              </Card.Body>
            </Card>
            
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

export default Register; 