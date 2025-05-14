import { FaVideo, FaGlobe, FaLock, FaWrench, FaCog } from 'react-icons/fa';
import { useState } from 'react';
import { Container, Row, Col, Card, Nav, Form, Button, Alert } from 'react-bootstrap';
import React from 'react';

// Type for FormControlElement from react-bootstrap
type FormControlElement = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Add Telehealth Settings
  const [telehealthSettings, setTelehealthSettings] = useState({
    enableTelehealth: true,
    telehealthProvider: 'internal', // 'internal', 'zoom', 'webrtc'
    maxCallDuration: 60, // minutes
    securityLevel: 'high',
    allowRecording: false,
    autoGenerateLinks: true,
    reminderTimeBefore: 15, // minutes
  });
  
  // ... existing useEffects and functions ...
  
  // Handle telehealth settings changes
  const handleTelehealthChange = (e: React.ChangeEvent<FormControlElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    
    setTelehealthSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' 
        ? (e.target as HTMLInputElement).checked 
        : name === 'maxCallDuration' || name === 'reminderTimeBefore'
          ? parseInt(value)
          : value
    }));
  };
  
  // Save telehealth settings
  const saveTelehealthSettings = async () => {
    // In a real implementation, this would make an API call to save settings
    // For this demo, we'll just simulate success
    try {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setSuccessMessage('Telehealth settings updated successfully');
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      setError('Failed to update telehealth settings');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Container className="py-4">
      <h1 className="mb-4">System Settings</h1>
      
      {error && <Alert variant="danger">{error}</Alert>}
      {successMessage && <Alert variant="success">{successMessage}</Alert>}
      
      <Row>
        <Col lg={3}>
          <Nav variant="pills" className="flex-column sticky-top" style={{ top: '20px' }}>
            <Nav.Item>
              <Nav.Link active={activeTab === 'general'} onClick={() => setActiveTab('general')}>
                <FaCog className="me-2" /> General
              </Nav.Link>
            </Nav.Item>
            {/* ... other tabs ... */}
            <Nav.Item>
              <Nav.Link active={activeTab === 'telehealth'} onClick={() => setActiveTab('telehealth')}>
                <FaVideo className="me-2" /> Telehealth
              </Nav.Link>
            </Nav.Item>
            {/* ... other tabs ... */}
          </Nav>
        </Col>
        
        <Col lg={9}>
          <Card className="shadow-sm">
            <Card.Body>
              {/* General Settings Tab */}
              {activeTab === 'general' && (
                <>
                  <h3 className="mb-4">General Settings</h3>
                  <p>Configure general system settings here.</p>
                </>
              )}
              
              {/* Telehealth Settings Tab */}
              {activeTab === 'telehealth' && (
                <>
                  <h3 className="mb-4">Telehealth Settings</h3>
                  <Form>
                    <Row className="mb-4">
                      <Col md={6}>
                        <Card className="border-0 bg-light">
                          <Card.Body>
                            <h5 className="card-title mb-3">
                              <FaGlobe className="text-primary me-2" />
                              General Telehealth Settings
                            </h5>
                            
                            <Form.Group className="mb-3">
                              <Form.Check
                                type="switch"
                                id="enableTelehealth"
                                name="enableTelehealth"
                                label="Enable Telehealth Services"
                                checked={telehealthSettings.enableTelehealth}
                                onChange={handleTelehealthChange}
                              />
                              <div className="text-muted small mt-1">
                                Allow doctors to conduct virtual appointments
                              </div>
                            </Form.Group>
                            
                            <Form.Group className="mb-3">
                              <Form.Label>Telehealth Provider</Form.Label>
                              <Form.Select
                                name="telehealthProvider"
                                value={telehealthSettings.telehealthProvider}
                                onChange={handleTelehealthChange}
                                disabled={!telehealthSettings.enableTelehealth}
                              >
                                <option value="internal">Internal (Built-in)</option>
                                <option value="zoom">Zoom Integration</option>
                                <option value="webrtc">WebRTC (Advanced)</option>
                              </Form.Select>
                              <div className="text-muted small mt-1">
                                The service provider for video calls
                              </div>
                            </Form.Group>
                            
                            <Form.Group className="mb-3">
                              <Form.Label>Maximum Call Duration (minutes)</Form.Label>
                              <Form.Control
                                type="number"
                                name="maxCallDuration"
                                value={telehealthSettings.maxCallDuration}
                                onChange={handleTelehealthChange}
                                min={15}
                                max={180}
                                disabled={!telehealthSettings.enableTelehealth}
                              />
                              <div className="text-muted small mt-1">
                                Maximum length of virtual appointments
                              </div>
                            </Form.Group>
                          </Card.Body>
                        </Card>
                      </Col>
                      
                      <Col md={6}>
                        <Card className="border-0 bg-light">
                          <Card.Body>
                            <h5 className="card-title mb-3">
                              <FaLock className="text-primary me-2" />
                              Security & Notifications
                            </h5>
                            
                            <Form.Group className="mb-3">
                              <Form.Label>Security Level</Form.Label>
                              <Form.Select
                                name="securityLevel"
                                value={telehealthSettings.securityLevel}
                                onChange={handleTelehealthChange}
                                disabled={!telehealthSettings.enableTelehealth}
                              >
                                <option value="standard">Standard</option>
                                <option value="high">High</option>
                                <option value="maximum">Maximum (HIPAA)</option>
                              </Form.Select>
                              <div className="text-muted small mt-1">
                                Level of encryption and security features
                              </div>
                            </Form.Group>
                            
                            <Form.Group className="mb-3">
                              <Form.Check
                                type="switch"
                                id="allowRecording"
                                name="allowRecording"
                                label="Allow Session Recording"
                                checked={telehealthSettings.allowRecording}
                                onChange={handleTelehealthChange}
                                disabled={!telehealthSettings.enableTelehealth}
                              />
                              <div className="text-muted small mt-1">
                                Enable doctors to record telehealth sessions with patient consent
                              </div>
                            </Form.Group>
                            
                            <Form.Group className="mb-3">
                              <Form.Check
                                type="switch"
                                id="autoGenerateLinks"
                                name="autoGenerateLinks"
                                label="Auto-generate Meeting Links"
                                checked={telehealthSettings.autoGenerateLinks}
                                onChange={handleTelehealthChange}
                                disabled={!telehealthSettings.enableTelehealth}
                              />
                              <div className="text-muted small mt-1">
                                Automatically create secure meeting links when appointments are confirmed
                              </div>
                            </Form.Group>
                            
                            <Form.Group className="mb-3">
                              <Form.Label>Send Reminder (minutes before)</Form.Label>
                              <Form.Control
                                type="number"
                                name="reminderTimeBefore"
                                value={telehealthSettings.reminderTimeBefore}
                                onChange={handleTelehealthChange}
                                min={5}
                                max={60}
                                disabled={!telehealthSettings.enableTelehealth}
                              />
                              <div className="text-muted small mt-1">
                                Time before appointment to send telehealth reminder
                              </div>
                            </Form.Group>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>
                    
                    <div className="d-flex justify-content-end">
                      <Button 
                        variant="primary" 
                        onClick={saveTelehealthSettings}
                        disabled={loading || !telehealthSettings.enableTelehealth}
                      >
                        {loading ? 'Saving...' : 'Save Telehealth Settings'}
                      </Button>
                    </div>
                  </Form>
                </>
              )}
              
              {/* ... other tabs ... */}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminSettings; 