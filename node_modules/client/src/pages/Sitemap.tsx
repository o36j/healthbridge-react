import React from 'react';
import { Link } from 'react-router-dom';
import { Container, Row, Col, Card, ListGroup } from 'react-bootstrap';
import { useAuth, UserRole } from '../contexts/AuthContext';

/**
 * Sitemap Component
 * 
 * Displays a structured sitemap of the website, organized by category.
 * Shows all public pages and role-specific pages based on user authentication.
 */
const Sitemap: React.FC = () => {
  const { user } = useAuth();
  
  return (
    <Container className="py-5">
      <h1 className="mb-4 text-center">Sitemap</h1>
      <p className="text-center mb-5">Find your way around the HealthBridge platform with our comprehensive sitemap.</p>
      
      <Row className="g-4">
        {/* Public Pages */}
        <Col lg={4} md={6}>
          <Card className="h-100 shadow-sm">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">Main Pages</h5>
            </Card.Header>
            <ListGroup variant="flush">
              <ListGroup.Item action as={Link} to="/">Home</ListGroup.Item>
              <ListGroup.Item action as={Link} to="/about">About Us</ListGroup.Item>
              <ListGroup.Item action as={Link} to="/services">Services</ListGroup.Item>
              <ListGroup.Item action as={Link} to="/doctors">Our Doctors</ListGroup.Item>
              <ListGroup.Item action as={Link} to="/contact">Contact Us</ListGroup.Item>
            </ListGroup>
          </Card>
        </Col>
        
        {/* Account Pages */}
        <Col lg={4} md={6}>
          <Card className="h-100 shadow-sm">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">Account & Legal</h5>
            </Card.Header>
            <ListGroup variant="flush">
              {!user ? (
                <>
                  <ListGroup.Item action as={Link} to="/login">Login</ListGroup.Item>
                  <ListGroup.Item action as={Link} to="/register">Register</ListGroup.Item>
                  <ListGroup.Item action as={Link} to="/forgot-password">Forgot Password</ListGroup.Item>
                </>
              ) : (
                <ListGroup.Item action as={Link} to="/profile">My Profile</ListGroup.Item>
              )}
              <ListGroup.Item action as={Link} to="/terms">Terms of Service</ListGroup.Item>
              <ListGroup.Item action as={Link} to="/privacy">Privacy Policy</ListGroup.Item>
            </ListGroup>
          </Card>
        </Col>
        
        {/* User Features - Only shown when logged in */}
        {user && (
          <Col lg={4} md={6}>
            <Card className="h-100 shadow-sm">
              <Card.Header className="bg-primary text-white">
                <h5 className="mb-0">User Features</h5>
              </Card.Header>
              <ListGroup variant="flush">
                <ListGroup.Item action as={Link} to="/settings">Settings</ListGroup.Item>
                
                {/* Role-specific pages */}
                {[UserRole.PATIENT, UserRole.DOCTOR, UserRole.NURSE, UserRole.ADMIN].includes(user.role) && (
                  <ListGroup.Item action as={Link} to="/appointments">Appointments</ListGroup.Item>
                )}
                
                {[UserRole.PATIENT, UserRole.DOCTOR, UserRole.NURSE, UserRole.ADMIN].includes(user.role) && (
                  <ListGroup.Item action as={Link} to="/history">Medical History</ListGroup.Item>
                )}
                
                {[UserRole.DOCTOR, UserRole.NURSE, UserRole.ADMIN].includes(user.role) && (
                  <ListGroup.Item action as={Link} to="/patients">Patients</ListGroup.Item>
                )}
                
                {/* Admin-only pages */}
                {user.role === UserRole.ADMIN && (
                  <>
                    <ListGroup.Item action as={Link} to="/users">User Management</ListGroup.Item>
                    <ListGroup.Item action as={Link} to="/audit-logs">Audit Logs</ListGroup.Item>
                  </>
                )}
              </ListGroup>
            </Card>
          </Col>
        )}
      </Row>
      
      <div className="text-center mt-5">
        <p className="text-muted">
          Can't find what you're looking for? <Link to="/contact">Contact us</Link> for assistance.
        </p>
      </div>
    </Container>
  );
};

export default Sitemap; 