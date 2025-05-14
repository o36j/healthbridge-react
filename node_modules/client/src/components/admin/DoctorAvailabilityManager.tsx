import { useState, useEffect } from 'react';
import { Card, Form, Button, Row, Col, Alert, Spinner, Container } from 'react-bootstrap';
import { FaCalendarAlt, FaSave, FaTimes, FaUserMd } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

interface Doctor {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

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

const DoctorAvailabilityManager = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [loadingDoctors, setLoadingDoctors] = useState(true);

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

  // Load all doctors
  useEffect(() => {
    fetchDoctors();
  }, []);

  // Extract the fetchDoctors function outside useEffect so we can call it manually
  const fetchDoctors = async () => {
    try {
      setLoadingDoctors(true);
      setError('');
      console.log('Fetching doctors with role=DOCTOR...');

      // Debug: Log auth context user
      console.log('Current user from auth context:', user);

      try {
        // First try the admin endpoint
        const response = await axios.get(`${API_URL}/users?role=DOCTOR`);
        console.log('Doctor API response:', response.data);

        if (response.data && response.data.users && response.data.users.length > 0) {
          console.log('Setting doctors state with:', response.data.users);
          setDoctors(response.data.users);
          return;
        }
      } catch (adminError) {
        console.error('Admin endpoint error:', adminError);

        if (axios.isAxiosError(adminError)) {
          console.error('Admin API error details:', {
            status: adminError.response?.status,
            message: adminError.response?.data?.message
          });

          if (adminError.response?.status === 403) {
            console.log('Permission denied on admin endpoint, trying public endpoint...');
          }
        }
      }

      // If we get here, the admin endpoint failed or returned no results
      // Try the public endpoint
      try {
        console.log('Trying public doctors endpoint...');
        const publicResponse = await axios.get(`${API_URL}/users/public/doctors`);
        console.log('Public doctors response:', publicResponse.data);

        if (publicResponse.data && publicResponse.data.users && publicResponse.data.users.length > 0) {
          console.log('Successfully loaded doctors from public endpoint');
          setDoctors(publicResponse.data.users);
          return;
        } else {
          console.error('No doctors found in public endpoint');
        }
      } catch (publicError) {
        console.error('Public endpoint error:', publicError);
      }

      // If we get here, both endpoints failed or returned no results
      // Try a generic users endpoint and filter for doctors
      try {
        console.log('Trying to fetch all users and filter for doctors...');
        const allUsersResponse = await axios.get(`${API_URL}/users`);
        console.log('All users response:', allUsersResponse.data);

        if (allUsersResponse.data && allUsersResponse.data.users) {
          const doctorsList = allUsersResponse.data.users.filter(
            (user: any) => user.role === 'doctor' || user.role === 'DOCTOR'
          );

          console.log('Filtered doctors from all users:', doctorsList);

          if (doctorsList.length > 0) {
            setDoctors(doctorsList);
            return;
          }
        }
      } catch (allUsersError) {
        console.error('All users endpoint error:', allUsersError);
      }

      // If we get here, we couldn't find any doctors with any method
      setError('No doctors found. Please check that there are doctors in the system and you have proper permissions.');

    } catch (err) {
      console.error('Unhandled error in fetchDoctors:', err);
      setError('Failed to load doctors. Please try again later.');
    } finally {
      setLoadingDoctors(false);
    }
  };

  // Load doctor's availability when a doctor is selected
  useEffect(() => {
    const fetchAvailability = async () => {
      if (!selectedDoctorId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');

        const response = await axios.get(`${API_URL}/users/${selectedDoctorId}`);

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
        } else {
          // Reset to default if no availability found
          setAvailability(defaultAvailability);
          setOriginalAvailability(defaultAvailability);
        }
      } catch (err) {
        console.error(err);
        setError('Failed to load availability settings');
      } finally {
        setLoading(false);
      }
    };

    fetchAvailability();
  }, [selectedDoctorId]);

  // Handle input changes
  const handleAvailabilityChange = (day: keyof Availability, value: string) => {
    setAvailability(prev => ({
      ...prev,
      [day]: value
    }));
  };

  // Custom time input change
  const handleCustomTimeChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, day: keyof Availability) => {
    const { value } = e.target;
    setAvailability(prev => ({
      ...prev,
      [day]: value
    }));
  };

  // Save availability
  const handleSaveAvailability = async () => {
    if (!selectedDoctorId) return;

    try {
      setSaving(true);
      setError('');

      // Add debug log
      console.log('Saving availability for doctor ID:', selectedDoctorId);
      console.log('Availability data being sent:', availability);

      // Convert availability to JSON string to match backend expectations
      const availabilityString = JSON.stringify(availability);

      // Use the user update endpoint instead with a professional profile field
      // The "/:id" endpoint exists in the API and is used for general profile updates
      const response = await axios.put(`${API_URL}/users/${selectedDoctorId}`, {
        professionalProfile: {
          availability: availabilityString
        }
      });

      console.log('Update response:', response.data);

      setSuccess('Availability schedule updated successfully');
      setOriginalAvailability(availability);
      setIsEditing(false);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error updating availability:', err);
      if (axios.isAxiosError(err) && err.response) {
        console.error('API error details:', {
          status: err.response.status,
          statusText: err.response.statusText,
          message: err.response.data.message,
          data: err.response.data
        });
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

  // Handle doctor selection
  const handleDoctorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDoctorId(e.target.value);
    setIsEditing(false);
  };

  // Days of the week array
  const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  // Debug: Log current state
  console.log("Render state:", {
    doctorsCount: doctors.length,
    loadingDoctors,
    error,
    selectedDoctorId
  });

  return (
    <Card className="shadow-sm mb-4">
      <Card.Header className="bg-white py-3">
        <h4 className="mb-0 fw-bold d-flex align-items-center">
          <FaCalendarAlt className="me-2 text-primary" />
          Doctor Availability Management
        </h4>
      </Card.Header>

      <Card.Body>
        {loadingDoctors ? (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Loading doctors...</p>
          </div>
        ) : (
          <>
            {error && (
              <Alert variant="danger" className="mb-4">
                <strong>Error:</strong> {error}
              </Alert>
            )}

            {!error && doctors.length === 0 ? (
              <Alert variant="info" className="mb-4">
                <div>
                  <strong>No doctors found.</strong> There are no doctors available in the system.
                </div>
                <div className="mt-2">
                  <p>Possible reasons:</p>
                  <ul>
                    <li>No doctors have been added to the system yet</li>
                    <li>You may not have proper permissions to view the admin list</li>
                    <li>There might be a network or server issue</li>
                  </ul>
                </div>
                <div className="mt-2">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={fetchDoctors}
                    disabled={loadingDoctors}
                  >
                    {loadingDoctors ? 'Trying all available methods...' : 'Try Again (Will Try Multiple Methods)'}
                  </Button>
                </div>
              </Alert>
            ) : (
              <Form.Group className="mb-4">
                <Form.Label htmlFor="doctor-select" className="fw-medium">Select Doctor</Form.Label>
                <Form.Select
                  id="doctor-select"
                  value={selectedDoctorId}
                  onChange={handleDoctorChange}
                  disabled={isEditing || doctors.length === 0}
                  aria-label="Select a doctor"
                >
                  <option value="">-- Select a doctor --</option>
                  {doctors.map(doctor => (
                    <option key={doctor._id} value={doctor._id}>
                      Dr. {doctor.firstName} {doctor.lastName}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            )}

            {selectedDoctorId && (
              <>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0">Availability Schedule</h5>
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
                </div>

                {loading ? (
                  <div className="text-center py-4">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-2">Loading availability schedule...</p>
                  </div>
                ) : (
                  <>
                    {error && <Alert variant="danger">{error}</Alert>}
                    {success && <Alert variant="success">{success}</Alert>}

                    <div className="mb-3">
                      <p className="text-muted">
                        Set the doctor's regular weekly availability. Patients will be able to book appointments during these hours.
                      </p>
                    </div>

                    <Row>
                      {daysOfWeek.map(day => (
                        <Col md={6} key={day} className="mb-3">
                          <Form.Group>
                            <Form.Label htmlFor={`availability-${day}`} className="text-capitalize fw-medium">{day}</Form.Label>
                            {isEditing ? (
                              <div>
                                <Form.Select
                                  id={`availability-${day}`}
                                  value={availability[day as keyof Availability] === availability[day as keyof Availability] ? availability[day as keyof Availability] : 'Custom'}
                                  onChange={(e) => handleAvailabilityChange(day as keyof Availability, e.target.value)}
                                  disabled={!isEditing}
                                  className="mb-2"
                                  aria-label={`${day} availability selection`}
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
                          <li>Set "Not Available" for days the doctor doesn't work</li>
                          <li>Choose "Custom" to enter specific hours</li>
                          <li>This availability will be visible to patients when they book appointments</li>
                          <li>Appointments already booked won't be affected by changes to availability</li>
                        </ul>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </>
        )}
      </Card.Body>
    </Card>
  );
};

export default DoctorAvailabilityManager;
