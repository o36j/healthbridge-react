import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form, Alert, ToggleButton, ButtonGroup } from 'react-bootstrap';
import { FaCog, FaPalette, FaGlobe, FaUserShield, FaExclamationTriangle } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { useLocation } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Settings = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Check if we're in the doctor dashboard
  const isDoctorDashboard = location.pathname.startsWith('/doctor/');

  // Appearance settings
  const [darkMode, setDarkMode] = useState(localStorage.getItem('theme') === 'dark');
  const [fontSize, setFontSize] = useState(localStorage.getItem('fontSize') || 'medium');

  // Privacy settings
  const [visibleProfile, setVisibleProfile] = useState(true);
  const [showEmail, setShowEmail] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [activityTracking, setActivityTracking] = useState(true);
  
  // Language and Region
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'en');
  const [timeFormat, setTimeFormat] = useState(localStorage.getItem('timeFormat') || '12h');
  const [dateFormat, setDateFormat] = useState(localStorage.getItem('dateFormat') || 'MM/DD/YYYY');
  const [timezone, setTimezone] = useState(localStorage.getItem('timezone') || 'UTC');

  // Apply theme on load and when changed
  useEffect(() => {
    applyTheme(darkMode ? 'dark' : 'light');
  }, [darkMode]);

  // Apply font size when changed
  useEffect(() => {
    document.documentElement.style.fontSize = getFontSizeValue(fontSize);
    localStorage.setItem('fontSize', fontSize);
  }, [fontSize]);

  // Apply theme function
  const applyTheme = (theme) => {
    document.documentElement.setAttribute('data-bs-theme', theme);
    localStorage.setItem('theme', theme);
  };

  // Get font size value
  const getFontSizeValue = (size) => {
    switch (size) {
      case 'small': return '0.875rem';
      case 'medium': return '1rem';
      case 'large': return '1.125rem';
      case 'x-large': return '1.25rem';
      default: return '1rem';
    }
  };

  // Get timezones for dropdown
  const getTimezones = () => {
    const timezones = [
      { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
      { value: 'America/New_York', label: 'Eastern Time (ET)' },
      { value: 'America/Chicago', label: 'Central Time (CT)' },
      { value: 'America/Denver', label: 'Mountain Time (MT)' },
      { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
      { value: 'Europe/London', label: 'GMT (Greenwich Mean Time)' },
      { value: 'Europe/Paris', label: 'CET (Central European Time)' },
      { value: 'Asia/Tokyo', label: 'JST (Japan Standard Time)' },
      { value: 'Asia/Shanghai', label: 'CST (China Standard Time)' },
      { value: 'Asia/Kolkata', label: 'IST (India Standard Time)' },
      { value: 'Australia/Sydney', label: 'AEST (Australian Eastern Standard Time)' },
    ];
    return timezones;
  };

  // Save settings
  const handleSaveSettings = async () => {
    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      // Save settings to localStorage for persistence
      localStorage.setItem('theme', darkMode ? 'dark' : 'light');
      localStorage.setItem('fontSize', fontSize);
      localStorage.setItem('language', language);
      localStorage.setItem('timeFormat', timeFormat);
      localStorage.setItem('dateFormat', dateFormat);
      localStorage.setItem('timezone', timezone);
      
      // In a real app, also save to the server
      const settingsData = {
        appearance: {
          darkMode,
          fontSize
        },
        privacy: {
          visibleProfile,
          showEmail,
          showPhone,
          activityTracking
        },
        regionalization: {
          language,
          timeFormat,
          dateFormat,
          timezone
        }
      };
      
      // Simulating API call for demo (would be an actual API call in production)
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setSuccessMessage('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      setErrorMessage('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container className={`${isDoctorDashboard ? 'py-0' : 'py-4'}`}>
      {/* Header */}
      <div className={`${isDoctorDashboard ? 'bg-white rounded-3 shadow-sm p-4 mb-4' : 'bg-primary bg-gradient rounded-3 p-4 mb-4 text-white'}`}>
        <h2 className={`fw-bold mb-1 ${isDoctorDashboard ? 'text-primary' : ''}`}>
          <FaCog className="me-2" />
          Settings
        </h2>
        <p className={`${isDoctorDashboard ? 'text-muted' : 'text-white-50'} mb-0`}>
          Customize your account preferences and settings
        </p>
      </div>

      {/* Success message */}
      {successMessage && (
        <Alert variant="success" dismissible onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}

      {/* Error message */}
      {errorMessage && (
        <Alert variant="danger" dismissible onClose={() => setErrorMessage('')}>
          {errorMessage}
        </Alert>
      )}

      {/* Settings Cards */}
      <Row className="g-4">
        {/* Appearance Settings */}
        <Col lg={6}>
          <Card className={`${isDoctorDashboard ? 'border-0 shadow-sm' : 'h-100'}`}>
            <Card.Header className={`${isDoctorDashboard ? 'bg-white' : 'bg-light'} py-3`}>
              <h4 className="mb-0 d-flex align-items-center">
                <FaPalette className="text-primary me-2" />
                Appearance
              </h4>
            </Card.Header>
            <Card.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium">Theme Mode</Form.Label>
                  <div className="d-flex gap-3 mb-3">
                    <Form.Check
                      type="radio"
                      id="light-mode"
                      name="theme-mode"
                      label="Light Mode"
                      checked={!darkMode}
                      onChange={() => setDarkMode(false)}
                    />
                    <Form.Check
                      type="radio"
                      id="dark-mode"
                      name="theme-mode"
                      label="Dark Mode"
                      checked={darkMode}
                      onChange={() => setDarkMode(true)}
                    />
                  </div>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium">Text Size</Form.Label>
                  <Form.Select 
                    value={fontSize}
                    onChange={(e) => setFontSize(e.target.value)}
                    aria-label="Select text size"
                  >
                    <option value="small">Small</option>
                    <option value="medium">Medium (Default)</option>
                    <option value="large">Large</option>
                    <option value="x-large">Extra Large</option>
                  </Form.Select>
                </Form.Group>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* Privacy Settings */}
        <Col lg={6}>
          <Card className={`${isDoctorDashboard ? 'border-0 shadow-sm' : 'h-100'}`}>
            <Card.Header className={`${isDoctorDashboard ? 'bg-white' : 'bg-light'} py-3`}>
              <h4 className="mb-0 d-flex align-items-center">
                <FaUserShield className="text-primary me-2" />
                Privacy
              </h4>
            </Card.Header>
            <Card.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium">Profile Visibility</Form.Label>
                  <div className="mb-3">
                    <Form.Check 
                      type="switch"
                      id="visible-profile"
                      label="Public Profile"
                      checked={visibleProfile}
                      onChange={() => setVisibleProfile(!visibleProfile)}
                      className="mb-2"
                    />
                    <Form.Check 
                      type="switch"
                      id="show-email"
                      label="Show Email to Others"
                      checked={showEmail}
                      onChange={() => setShowEmail(!showEmail)}
                      className="mb-2"
                    />
                    <Form.Check 
                      type="switch"
                      id="show-phone"
                      label="Show Phone Number to Others"
                      checked={showPhone}
                      onChange={() => setShowPhone(!showPhone)}
                    />
                  </div>
                </Form.Group>
                
                <Form.Group>
                  <Form.Label className="fw-medium">Data & Activity</Form.Label>
                  <div>
                    <Form.Check 
                      type="switch"
                      id="activity-tracking"
                      label="Activity Tracking"
                      checked={activityTracking}
                      onChange={() => setActivityTracking(!activityTracking)}
                      className="mb-2"
                    />
                    <div className="d-grid gap-2 mt-3">
                      <Button variant="outline-danger" size="sm">
                        <FaExclamationTriangle className="me-2" />
                        Request Data Export
                      </Button>
                    </div>
                  </div>
                </Form.Group>
              </Form>
            </Card.Body>
          </Card>
        </Col>

        {/* Regional Settings */}
        <Col lg={6}>
          <Card className={`${isDoctorDashboard ? 'border-0 shadow-sm' : 'h-100'}`}>
            <Card.Header className={`${isDoctorDashboard ? 'bg-white' : 'bg-light'} py-3`}>
              <h4 className="mb-0 d-flex align-items-center">
                <FaGlobe className="text-primary me-2" />
                Language & Region
              </h4>
            </Card.Header>
            <Card.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium">Language</Form.Label>
                  <Form.Select 
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="mb-3"
                    aria-label="Select language"
                  >
                    <option value="en">English</option>
                    <option value="es">Español (Spanish)</option>
                    <option value="fr">Français (French)</option>
                    <option value="de">Deutsch (German)</option>
                    <option value="zh">中文 (Chinese)</option>
                    <option value="ja">日本語 (Japanese)</option>
                    <option value="ar">العربية (Arabic)</option>
                  </Form.Select>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium">Time Format</Form.Label>
                  <Form.Select 
                    value={timeFormat}
                    onChange={(e) => setTimeFormat(e.target.value)}
                    className="mb-3"
                    aria-label="Select time format"
                  >
                    <option value="12h">12-hour (1:30 PM)</option>
                    <option value="24h">24-hour (13:30)</option>
                  </Form.Select>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label className="fw-medium">Date Format</Form.Label>
                  <Form.Select 
                    value={dateFormat}
                    onChange={(e) => setDateFormat(e.target.value)}
                    className="mb-3"
                    aria-label="Select date format"
                  >
                    <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY (Europe)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                  </Form.Select>
                </Form.Group>
                
                <Form.Group>
                  <Form.Label className="fw-medium">Time Zone</Form.Label>
                  <Form.Select 
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    aria-label="Select timezone"
                  >
                    {getTimezones().map(tz => (
                      <option key={tz.value} value={tz.value}>{tz.label}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Save Button */}
      <div className="d-flex justify-content-end mt-4">
        <Button 
          variant="primary" 
          size="lg" 
          onClick={handleSaveSettings}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </Container>
  );
};

export default Settings; 