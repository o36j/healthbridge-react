import { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { FaCalendarAlt, FaSave, FaTimes } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

interface Availability {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const AvailabilityManager = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  
  // Default availability object
  const defaultAvailability: Availability = {
    monday: '9:00 AM - 5:00 PM',
    tuesday: '9:00 AM - 5:00 PM',
    wednesday: '9:00 AM - 5:00 PM',
    thursday: '9:00 AM - 5:00 PM',
    friday: '9:00 AM - 5:00 PM',
    saturday: 'Not Available',
    sunday: 'Not Available'
  };
  
  const [availability, setAvailability] = useState<Availability>(defaultAvailability);
  const [originalAvailability, setOriginalAvailability] = useState<Availability>(defaultAvailability);
  
  // Common time slot options
  const timeSlotOptions = [
    'Not Available',
    '9:00 AM - 5:00 PM',
    '9:00 AM - 1:00 PM',
    '1:00 PM - 5:00 PM',
    '9:00 AM - 12:00 PM',
    '12:00 PM - 4:00 PM',
    '4:00 PM - 8:00 PM',
    '8:00 AM - 12:00 PM',
    'Custom'
  ];
  
  // Load doctor's availability
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        setError('');
        
        const response = await axios.get(`${API_URL}/users/${user.id}`);
        
        if (response.data.user?.professionalProfile?.availability) {
          let userAvailability = response.data.user.professionalProfile.availability;
          
          // Handle if availability is a string (JSON string)
          if (typeof userAvailability === 'string') {
            try {
              userAvailability = JSON.parse(userAvailability);
            } catch (e) {
              console.error('Error parsing availability string:', e);
              userAvailability = defaultAvailability;
            }
          }
          
          setAvailability(userAvailability);
          setOriginalAvailability(userAvailability);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load availability settings');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAvailability();
  }, [user]);
  
  // Handle input changes
  const handleAvailabilityChange = (day: keyof Availability, value: string) => {
    setAvailability(prev => ({
      ...prev,
      [day]: value
    }));
  };
  
  // Custom time input change
  const handleCustomTimeChange = (e: React.ChangeEvent<HTMLInputElement>, day: keyof Availability) => {
    const { value } = e.target;
    setAvailability(prev => ({
      ...prev,
      [day]: value
    }));
  };
  
  // Save availability
  const handleSaveAvailability = async () => {
    if (!user) return;
    
    try {
      setSaving(true);
      setError('');
      
      // Convert availability to JSON string to match backend expectations
      const availabilityString = JSON.stringify(availability);
      
      const response = await axios.patch(`${API_URL}/users/professional-profile`, {
        availability: availabilityString
      });
      
      setSuccess('Availability schedule updated successfully');
      setOriginalAvailability(availability);
      setIsEditing(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.message || 'Failed to update availability');
      } else {
        setError('Failed to update availability');
      }
    } finally {
      setSaving(false);
    }
  };
  
  // Cancel editing
  const handleCancelEdit = () => {
    setAvailability(originalAvailability);
    setIsEditing(false);
  };
  
  // Days of the week array
  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  
  return (
    <Card className="shadow-sm mb-4">
      <Card.Header className="bg-white py-3 d-flex justify-content-between align-items-center">
        <h4 className="mb-0 fw-bold d-flex align-items-center">
          <FaCalendarAlt className="me-2 text-primary" />
          Availability Schedule
        </h4>
        {!isEditing ? (
          <Button 
            variant="outline-primary" 
            size="sm" 
            onClick={() => setIsEditing(true)}
          >
            Edit Schedule
          </Button>
        ) : (
          <div className="d-flex gap-2">
            <Button 
              variant="outline-secondary" 
              size="sm" 
              onClick={handleCancelEdit}
              disabled={saving}
              className="d-flex align-items-center"
            >
              <FaTimes className="me-1" /> Cancel
            </Button>
            <Button 
              variant="primary" 
              size="sm" 
              onClick={handleSaveAvailability}
              disabled={saving}
              className="d-flex align-items-center"
            >
              {saving ? (
                <>
                  <Spinner animation="border" size="sm" className="me-1" />
                  Saving...
                </>
              ) : (
                <>
                  <FaSave className="me-1" /> Save Schedule
                </>
              )}
            </Button>
          </div>
        )}
      </Card.Header>
      
      <Card.Body>
        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Loading your availability schedule...</p>
          </div>
        ) : (
          <>
            {error && <Alert variant="danger">{error}</Alert>}
            {success && <Alert variant="success">{success}</Alert>}
            
            <div className="mb-3">
              <p className="text-muted">
                Set your regular weekly availability. Patients will be able to book appointments during these hours.
              </p>
            </div>
            
            <Row>
              {daysOfWeek.map(day => (
                <Col md={6} key={day} className="mb-3">
                  <Form.Group>
                    <Form.Label className="text-capitalize fw-medium">{day}</Form.Label>
                    {isEditing ? (
                      <div>
                        <Form.Select
                          value={availability[day as keyof Availability] === availability[day as keyof Availability] ? availability[day as keyof Availability] : 'Custom'}
                          onChange={(e) => handleAvailabilityChange(day as keyof Availability, e.target.value)}
                          disabled={!isEditing}
                          className="mb-2"
                        >
                          {timeSlotOptions.map(option => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </Form.Select>
                        
                        {availability[day as keyof Availability] === 'Custom' && (
                          <Form.Control
                            type="text"
                            placeholder="e.g. 10:00 AM - 2:00 PM"
                            value={availability[day as keyof Availability] === 'Custom' ? '' : availability[day as keyof Availability]}
                            onChange={(e) => handleCustomTimeChange(e, day as keyof Availability)}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="py-2 px-3 bg-light rounded">
                        {availability[day as keyof Availability]}
                      </div>
                    )}
                  </Form.Group>
                </Col>
              ))}
            </Row>
            
            {isEditing && (
              <div className="mt-3 p-3 bg-light rounded">
                <h6 className="mb-2 fw-bold">Tips:</h6>
                <ul className="small text-muted mb-0">
                  <li>Set "Not Available" for days you don't work</li>
                  <li>Choose "Custom" to enter specific hours</li>
                  <li>Your availability will be visible to patients when they book appointments</li>
                  <li>Appointments already booked won't be affected by changes to your availability</li>
                </ul>
              </div>
            )}
          </>
        )}
      </Card.Body>
    </Card>
  );
};

export default AvailabilityManager; 