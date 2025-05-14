import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Container, Row, Col, Card, Nav, Tab, Alert, Spinner, Form, Button } from 'react-bootstrap';
import { 
  FaUser, 
  FaIdCard, 
  FaShieldAlt, 
  FaBell, 
  FaHistory, 
  FaCog, 
  FaArrowLeft, 
  FaSignInAlt, 
  FaUserEdit, 
  FaKey, 
  FaExclamationTriangle, 
  FaCheckCircle, 
  FaInfoCircle, 
  FaExclamationCircle, 
  FaTimesCircle 
} from 'react-icons/fa';
import EditProfileForm from '../components/profile/EditProfileForm';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SERVER_URL = API_URL.replace('/api', '');

// Helper for handling profile image URLs consistently
const getProfileImageUrl = (photoPath?: string): string => {
  if (!photoPath) return '';
  // If it's already a blob URL or an absolute URL, return it
  if (photoPath.startsWith('blob:') || photoPath.startsWith('http')) {
    return photoPath;
  }
  // Otherwise, prepend the server URL to make it absolute
  return `${SERVER_URL}${photoPath}`;
};

interface UserData {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  profilePhoto?: string;
  dateOfBirth?: Date;
  medicalRecordNumber?: string;
}

// Activity history interface
interface ActivityLogItem {
  _id: string;
  action: string;
  performedBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  details?: string;
  ip?: string;
  userAgent?: string;
  createdAt: string;
}

const Profile = () => {
  const { user } = useAuth();
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [profileUpdated, setProfileUpdated] = useState(false);
  const [activeKey, setActiveKey] = useState('personalInfo');
  const [targetUser, setTargetUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isAdminEditingUser = user?.role === 'admin' && userId && userId !== user.id;
  
  // Check if we're in the doctor dashboard
  const isDoctorDashboard = location.pathname.startsWith('/doctor/');

  // Password change form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);

  // Preferences state
  const [language, setLanguage] = useState('en');
  const [dateFormat, setDateFormat] = useState('mm/dd/yyyy');
  const [timeFormat, setTimeFormat] = useState('12');
  const [theme, setTheme] = useState('light');
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [preferencesSuccess, setPreferencesSuccess] = useState<string | null>(null);
  const [preferencesError, setPreferencesError] = useState<string | null>(null);

  // Activity history state
  const [activityFilter, setActivityFilter] = useState('all');
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);
  const [activityPage, setActivityPage] = useState(1);
  const [hasMoreActivity, setHasMoreActivity] = useState(false);

  // Security settings state
  const [sessionTimeout, setSessionTimeout] = useState('60');

  useEffect(() => {
    if (userId && (isAdminEditingUser || userId === user?.id)) {
      fetchUserData();
    }
  }, [userId, user]);

  // Redirect patients from activity history tab to personal info
  useEffect(() => {
    // We need to handle this after initial render when displayUser is available
    if (user?.role === 'patient' && activeKey === 'activityHistory') {
      setActiveKey('personalInfo');
    }
  }, [user?.role, activeKey]);

  const fetchUserData = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/users/${userId}`);
      setTargetUser(response.data.user);
    } catch (err) {
      setError('Failed to load user data');
      console.error('Error fetching user data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!user && !loading) {
    return (
      <Container className="py-2 text-center">
        <Alert variant="info">
          Please log in to view profile information.
        </Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container className="py-2 text-center">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading profile data...</p>
      </Container>
    );
  }

  // Calculate age from date of birth
  const calculateAge = (dateOfBirth?: Date | string): string => {
    if (!dateOfBirth) return '';
    
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age.toString();
  };

  const displayUser = isAdminEditingUser ? targetUser : user;

  if (!displayUser) {
    return (
      <Container className="py-2 text-center">
        <Alert variant="danger">
          User not found. The requested user may not exist or you don't have permission to view this profile.
        </Alert>
        <div className="mt-4">
          <Link to="/users" className="btn btn-primary">
            <FaArrowLeft className="me-2" />
            Back to Users
          </Link>
        </div>
      </Container>
    );
  }

  // Handle password change form submission
  const handlePasswordChange = async (e: FormEvent) => {
    e.preventDefault();
    
    // Reset status messages
    setPasswordError(null);
    setPasswordSuccess(null);
    
    // Validate passwords
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    try {
      setChangingPassword(true);
      
      const userIdToUpdate = isAdminEditingUser ? userId : user?.id;
      
      const response = await axios.put(`${API_URL}/users/${userIdToUpdate}/password`, {
        currentPassword,
        newPassword
      });
      
      setPasswordSuccess(response.data.message || 'Password updated successfully');
      
      // Clear form fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
    } catch (err: any) {
      console.error('Password change error:', err);
      setPasswordError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setChangingPassword(false);
    }
  };

  // Load user preferences
  const loadUserPreferences = async () => {
    try {
      const userIdToFetch = isAdminEditingUser ? userId : user?.id;
      const response = await axios.get(`${API_URL}/users/${userIdToFetch}/preferences`);
      
      if (response.data.preferences) {
        const prefs = response.data.preferences;
        setLanguage(prefs.language || 'en');
        setDateFormat(prefs.dateFormat || 'mm/dd/yyyy');
        setTimeFormat(prefs.timeFormat || '12');
        setTheme(prefs.theme || 'light');
      }
    } catch (err) {
      // If preferences don't exist yet, that's okay - we'll use defaults
      console.log('No saved preferences found, using defaults');
    }
  };

  // Load user data including preferences
  useEffect(() => {
    if (user && activeKey === 'preferences') {
      loadUserPreferences();
    }
  }, [user, activeKey]);

  // Handle saving preferences
  const handleSavePreferences = async (e: FormEvent) => {
    e.preventDefault();
    
    setPreferencesError(null);
    setPreferencesSuccess(null);
    
    try {
      setSavingPreferences(true);
      
      const userIdToUpdate = isAdminEditingUser ? userId : user?.id;
      
      const preferencesData = {
        language,
        dateFormat,
        timeFormat,
        theme
      };
      
      const response = await axios.put(
        `${API_URL}/users/${userIdToUpdate}/preferences`, 
        preferencesData
      );
      
      setPreferencesSuccess('Preferences saved successfully');
    } catch (err: any) {
      console.error('Save preferences error:', err);
      setPreferencesError(err.response?.data?.message || 'Failed to save preferences');
    } finally {
      setSavingPreferences(false);
    }
  };

  // Load activity history
  const loadActivityHistory = async (page = 1, filter = activityFilter) => {
    try {
      setActivityLoading(true);
      setActivityError(null);
      
      const userIdToFetch = isAdminEditingUser ? userId : user?.id;
      
      // Build query params
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '5'); // Show 5 items at a time
      
      if (filter !== 'all') {
        params.append('type', filter);
      }
      
      const response = await axios.get(
        `${API_URL}/users/${userIdToFetch}/activity?${params.toString()}`
      );
      
      if (page === 1) {
        setActivityLogs(response.data.logs);
      } else {
        setActivityLogs([...activityLogs, ...response.data.logs]);
      }
      
      setHasMoreActivity(response.data.pagination.hasNextPage);
      setActivityPage(page);
    } catch (err: any) {
      console.error('Load activity error:', err);
      setActivityError(err.response?.data?.message || 'Failed to load activity history');
    } finally {
      setActivityLoading(false);
    }
  };

  // Load activity data when tab is selected
  useEffect(() => {
    if (user && activeKey === 'activity') {
      loadActivityHistory(1);
    }
  }, [user, activeKey]);

  // Handle activity filter change
  const handleActivityFilterChange = (filter: string) => {
    setActivityFilter(filter);
    loadActivityHistory(1, filter);
  };

  // Handle loading more activity
  const handleLoadMoreActivity = () => {
    if (!activityLoading && hasMoreActivity) {
      loadActivityHistory(activityPage + 1);
    }
  };

  // Format date for display
  const formatActivityDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    
    // Today
    if (date.toDateString() === now.toDateString()) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Yesterday
    if (date.toDateString() === yesterday.toDateString()) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Other dates
    return date.toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get device name from user agent
  const getDeviceFromUserAgent = (userAgent: string = ''): string => {
    if (!userAgent) return 'Unknown Device';
    
    if (userAgent.includes('Windows')) return 'Windows PC';
    if (userAgent.includes('Macintosh')) return 'Mac';
    if (userAgent.includes('iPhone')) return 'iPhone';
    if (userAgent.includes('iPad')) return 'iPad';
    if (userAgent.includes('Android')) return 'Android Device';
    if (userAgent.includes('Linux')) return 'Linux';
    
    return 'Unknown Device';
  };

  // Get browser name from user agent
  const getBrowserFromUserAgent = (userAgent: string = ''): string => {
    if (!userAgent) return 'Unknown Browser';
    
    if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) return `Chrome`;
    if (userAgent.includes('Firefox')) return `Firefox`;
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return `Safari`;
    if (userAgent.includes('Edg')) return `Edge`;
    if (userAgent.includes('MSIE') || userAgent.includes('Trident')) return `Internet Explorer`;
    
    return 'Unknown Browser';
  };

  // Get icon and color for activity type
  const getActivityAttributes = (action: string): { icon: JSX.Element; color: string; title: string } => {
    switch (action) {
      case 'login_success':
        return { 
          icon: <FaSignInAlt />, 
          color: 'primary',
          title: 'Successful Login'
        };
      case 'login_failed':
        return { 
          icon: <FaExclamationTriangle />, 
          color: 'danger',
          title: 'Failed Login Attempt'
        };
      case 'password_updated':
        return { 
          icon: <FaKey />, 
          color: 'warning',
          title: 'Password Changed'
        };
      case 'user_updated':
      case 'profile_updated':
        return { 
          icon: <FaUserEdit />, 
          color: 'info',
          title: 'Profile Updated'
        };
      case 'logout':
        return { 
          icon: <FaSignInAlt />, 
          color: 'secondary',
          title: 'Logged Out'
        };
      default:
        return { 
          icon: <FaHistory />, 
          color: 'secondary',
          title: action.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
        };
    }
  };

  return (
    <Container className={`${isDoctorDashboard ? 'py-0' : 'py-2'}`}>
      {/* Header with gradient background */}
      <div className={`${isDoctorDashboard ? 'bg-white rounded-3 shadow-sm p-4 mb-3' : 'bg-gradient-to-r from-primary to-primary-subtle rounded-3 p-4 mb-3 text-white'}`}>
        {isAdminEditingUser && (
          <Link to="/users" className="btn btn-sm btn-light mb-3">
            <FaArrowLeft className="me-2" />
            Back to Users
          </Link>
        )}
        <h2 className={`fw-bold mb-1 ${isDoctorDashboard ? 'text-primary' : ''}`}>
          {isAdminEditingUser ? `Edit User: ${displayUser.firstName} ${displayUser.lastName}` : 'My Profile'}
        </h2>
        <p className={`${isDoctorDashboard ? 'text-muted' : 'text-white-50'} mb-0`}>
          {isAdminEditingUser 
            ? `Managing profile for ${displayUser.firstName} ${displayUser.lastName} (${displayUser.role})`
            : 'Manage your personal information and account settings'}
        </p>
      </div>

      {/* Success message after profile update */}
      {profileUpdated && (
        <Alert variant="success" dismissible onClose={() => setProfileUpdated(false)} className="animate-fade-in">
          <FaCog className="me-2" />
          {isAdminEditingUser ? 'User profile has been updated successfully!' : 'Your profile has been updated successfully!'}
        </Alert>
      )}

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* User Profile Card - Moved to top */}
      <Row className="mb-4">
        {/* Left sidebar */}
        <Col lg={3} md={4} className="mb-4 mb-md-0">
          <Card className={`${isDoctorDashboard ? 'border-0 shadow-sm' : ''} h-100`}>
            <Card.Body>
              <div className="text-center mb-3">
                {loading ? (
                  <div className="mb-4 p-3">
                    <Spinner animation="border" variant="primary" />
                  </div>
                ) : (
                  <>
                    <div className="rounded-circle bg-light mx-auto mb-3 position-relative" style={{ width: '120px', height: '120px', overflow: 'hidden' }}>
                      {displayUser?.profilePhoto ? (
                        <img
                          src={getProfileImageUrl(displayUser.profilePhoto)}
                          alt={`${displayUser.firstName} ${displayUser.lastName}`}
                          className="img-fluid rounded-circle"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div className="w-100 h-100 d-flex align-items-center justify-content-center bg-primary bg-opacity-10">
                          <FaUser className="text-primary" style={{ fontSize: '2.5rem' }} />
                        </div>
                      )}
                    </div>
                    <h5 className="fw-bold">{displayUser.firstName} {displayUser.lastName}</h5>
                    <p className="text-muted mb-1">{
                      displayUser.role === 'doctor' 
                        ? `Dr. ${displayUser.firstName} ${displayUser.lastName}`
                        : displayUser.role === 'admin'
                          ? 'Administrator'
                          : displayUser.role === 'nurse'
                            ? 'Nurse'
                            : 'Patient'
                    }</p>
                    {displayUser.role === 'doctor' && (
                      <p className="text-primary small mb-3">
                        {user?.specialization || user?.department || 'Physician'}
                      </p>
                    )}
                  </>
                )}
              </div>

              <Nav variant={isDoctorDashboard ? "pills" : "tabs"} className="flex-column" activeKey={activeKey} onSelect={(k) => k && setActiveKey(k)}>
                <Nav.Item>
                  <Nav.Link eventKey="personalInfo" className={`d-flex align-items-center ${isDoctorDashboard ? 'mb-2 rounded-3' : ''}`}>
                    <FaIdCard className="me-2" /> Personal Info
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="accountSecurity" className={`d-flex align-items-center ${isDoctorDashboard ? 'mb-2 rounded-3' : ''}`}>
                    <FaShieldAlt className="me-2" /> Account & Security
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="preferences" className={`d-flex align-items-center ${isDoctorDashboard ? 'mb-2 rounded-3' : ''}`}>
                    <FaCog className="me-2" /> Preferences
                  </Nav.Link>
                </Nav.Item>
                {/* Only show Activity History for non-patient users */}
                {displayUser.role !== 'patient' && (
                  <Nav.Item>
                    <Nav.Link eventKey="activityHistory" className={`d-flex align-items-center ${isDoctorDashboard ? 'mb-2 rounded-3' : ''}`}>
                      <FaHistory className="me-2" /> Activity History
                    </Nav.Link>
                  </Nav.Item>
                )}
              </Nav>
            </Card.Body>
          </Card>
        </Col>

        {/* Main content area */}
        <Col lg={9} md={8}>
          <Tab.Content>
            <Tab.Pane eventKey="personalInfo" active={activeKey === "personalInfo"}>
              <Card className={`${isDoctorDashboard ? 'border-0 shadow-sm' : ''} h-100`}>
                <Card.Body className="p-4">
                  <EditProfileForm 
                    onUpdateSuccess={() => setProfileUpdated(true)} 
                    userId={isAdminEditingUser ? userId : undefined}
                    isAdminEdit={!!isAdminEditingUser}
                  />
                </Card.Body>
              </Card>
            </Tab.Pane>
            
            <Tab.Pane eventKey="accountSecurity" active={activeKey === "accountSecurity"}>
              <Card className={`${isDoctorDashboard ? 'border-0 shadow-sm' : ''} h-100`}>
                <Card.Body className="p-4">
                  <h4 className="fw-bold mb-4 d-flex align-items-center">
                    <FaShieldAlt className="me-2 text-primary" />
                    Account & Security
                  </h4>
                  
                  <div className="mb-4">
                    <h5 className="fw-semibold mb-3">Change Password</h5>
                    
                    {passwordError && (
                      <Alert variant="danger" dismissible onClose={() => setPasswordError(null)}>
                        {passwordError}
                      </Alert>
                    )}
                    
                    {passwordSuccess && (
                      <Alert variant="success" dismissible onClose={() => setPasswordSuccess(null)}>
                        {passwordSuccess}
                      </Alert>
                    )}
                    
                    <Form onSubmit={handlePasswordChange}>
                      <Form.Group className="mb-3">
                        <Form.Label>Current Password</Form.Label>
                        <Form.Control
                          type="password"
                          placeholder="Enter your current password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          required
                        />
                      </Form.Group>
                      
                      <Form.Group className="mb-3">
                        <Form.Label>New Password</Form.Label>
                        <Form.Control
                          type="password"
                          placeholder="Enter new password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          required
                        />
                        <Form.Text className="text-muted">
                          Password must be at least 6 characters long
                        </Form.Text>
                      </Form.Group>
                      
                      <Form.Group className="mb-4">
                        <Form.Label>Confirm New Password</Form.Label>
                        <Form.Control
                          type="password"
                          placeholder="Confirm new password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          required
                        />
                      </Form.Group>
                      
                      <Button 
                        variant="primary" 
                        type="submit"
                        disabled={changingPassword}
                      >
                        {changingPassword ? (
                          <>
                            <Spinner
                              as="span"
                              animation="border"
                              size="sm"
                              role="status"
                              aria-hidden="true"
                              className="me-2"
                            />
                            Changing Password...
                          </>
                        ) : (
                          'Change Password'
                        )}
                      </Button>
                    </Form>
                  </div>
                  
                  <hr className="my-4" />
                  
                  <div>
                    <h5 className="fw-semibold mb-3">Security Settings</h5>
                    
                    <Form onSubmit={(e) => {
                      e.preventDefault();
                      const userIdToUpdate = isAdminEditingUser ? userId : user?.id;
                      
                      axios.put(`${API_URL}/users/${userIdToUpdate}/security-settings`, {
                        sessionTimeout
                      })
                      .then(() => {
                        setPasswordSuccess('Security settings updated successfully');
                        setTimeout(() => setPasswordSuccess(null), 3000);
                      })
                      .catch((err) => {
                        setPasswordError(err.response?.data?.message || 'Failed to update security settings');
                      });
                    }}>
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <div>
                          <p className="mb-1 fw-medium">Session Timeout</p>
                          <p className="text-muted mb-0 small">Automatically log out after inactivity</p>
                        </div>
                        <Form.Select 
                          style={{ width: "150px" }}
                          value={sessionTimeout}
                          onChange={(e) => setSessionTimeout(e.target.value)}
                        >
                          <option value="15">15 minutes</option>
                          <option value="30">30 minutes</option>
                          <option value="60">1 hour</option>
                          <option value="120">2 hours</option>
                          <option value="240">4 hours</option>
                        </Form.Select>
                      </div>

                      <Button type="submit" variant="primary" className="mt-3">
                        Save Security Settings
                      </Button>
                    </Form>
                  </div>
                </Card.Body>
              </Card>
            </Tab.Pane>
            
            <Tab.Pane eventKey="preferences" active={activeKey === "preferences"}>
              <Card className={`${isDoctorDashboard ? 'border-0 shadow-sm' : ''} h-100`}>
                <Card.Body className="p-4">
                  <h4 className="fw-bold mb-4 d-flex align-items-center">
                    <FaCog className="me-2 text-primary" />
                    Preferences
                  </h4>
                  
                  {preferencesError && (
                    <Alert variant="danger" dismissible onClose={() => setPreferencesError(null)}>
                      {preferencesError}
                    </Alert>
                  )}
                  
                  {preferencesSuccess && (
                    <Alert variant="success" dismissible onClose={() => setPreferencesSuccess(null)}>
                      {preferencesSuccess}
                    </Alert>
                  )}
                  
                  <Form onSubmit={handleSavePreferences}>                    
                    <div>
                      <h5 className="fw-semibold mb-3">Language & Regional</h5>
                      
                      <Form.Group className="mb-3">
                        <Form.Label>Language</Form.Label>
                        <Form.Select 
                          value={language}
                          onChange={(e) => setLanguage(e.target.value)}
                        >
                          <option value="en">English</option>
                          <option value="es">Spanish</option>
                          <option value="fr">French</option>
                          <option value="de">German</option>
                          <option value="zh">Chinese</option>
                        </Form.Select>
                      </Form.Group>
                      
                      <Form.Group className="mb-3">
                        <Form.Label>Date Format</Form.Label>
                        <Form.Select 
                          value={dateFormat}
                          onChange={(e) => setDateFormat(e.target.value)}
                        >
                          <option value="mm/dd/yyyy">MM/DD/YYYY</option>
                          <option value="dd/mm/yyyy">DD/MM/YYYY</option>
                          <option value="yyyy/mm/dd">YYYY/MM/DD</option>
                        </Form.Select>
                      </Form.Group>
                      
                      <Form.Group className="mb-4">
                        <Form.Label>Time Format</Form.Label>
                        <Form.Select 
                          value={timeFormat}
                          onChange={(e) => setTimeFormat(e.target.value)}
                        >
                          <option value="12">12 Hour (AM/PM)</option>
                          <option value="24">24 Hour</option>
                        </Form.Select>
                      </Form.Group>
                      
                      {/* Theme Selection */}
                      <Form.Group className="mb-3">
                        <Form.Label>Theme</Form.Label>
                        <Form.Select 
                          value={theme}
                          onChange={(e) => setTheme(e.target.value)}
                          disabled={savingPreferences}
                        >
                          <option value="light">Light</option>
                          <option value="dark">Dark</option>
                          <option value="system">System</option>
                        </Form.Select>
                      </Form.Group>
                      
                      <Button 
                        variant="primary"
                        type="submit"
                        disabled={savingPreferences}
                      >
                        {savingPreferences ? (
                          <>
                            <Spinner
                              as="span"
                              animation="border"
                              size="sm"
                              role="status"
                              aria-hidden="true"
                              className="me-2"
                            />
                            Saving Preferences...
                          </>
                        ) : (
                          'Save Preferences'
                        )}
                      </Button>
                    </div>
                  </Form>
                </Card.Body>
              </Card>
            </Tab.Pane>
            
            <Tab.Pane eventKey="activityHistory" active={activeKey === "activityHistory"}>
              <Card className={`${isDoctorDashboard ? 'border-0 shadow-sm' : ''} h-100`}>
                <Card.Body className="p-4">
                  <h4 className="fw-bold mb-4 d-flex align-items-center">
                    <FaHistory className="me-2 text-primary" />
                    Activity History
                  </h4>
                  
                  <Nav variant="tabs" className="mb-4">
                    <Nav.Item>
                      <Nav.Link 
                        active={activityFilter === 'all'} 
                        onClick={() => handleActivityFilterChange('all')}
                        className="px-4"
                      >
                        All Activity
                      </Nav.Link>
                    </Nav.Item>
                    <Nav.Item>
                      <Nav.Link 
                        active={activityFilter === 'changes'} 
                        onClick={() => handleActivityFilterChange('changes')}
                        className="px-4"
                      >
                        Changes
                      </Nav.Link>
                    </Nav.Item>
                  </Nav>
                  
                  {activityError && (
                    <Alert variant="danger" dismissible onClose={() => setActivityError(null)}>
                      {activityError}
                    </Alert>
                  )}
                  
                  {activityLoading && activityPage === 1 ? (
                    <div className="text-center py-5">
                      <Spinner animation="border" variant="primary" />
                      <p className="mt-3">Loading activity history...</p>
                    </div>
                  ) : activityLogs.length === 0 ? (
                    <Alert variant="info">
                      No activity history found for this account.
                    </Alert>
                  ) : (
                    <div className="timeline mb-4">
                      {activityLogs.map((log) => {
                        const { icon, color, title } = getActivityAttributes(log.action);
                        
                        return (
                          <div className="timeline-item pb-4" key={log._id}>
                            <div className="d-flex">
                              <div className={`timeline-icon bg-${color} text-white rounded-circle d-flex align-items-center justify-content-center me-3`} style={{ width: '38px', height: '38px', flexShrink: 0 }}>
                                {icon}
                              </div>
                              <div className="flex-grow-1">
                                <div className="d-flex justify-content-between mb-2">
                                  <h6 className="fw-bold mb-0">{title}</h6>
                                  <span className="text-muted small">{formatActivityDate(log.createdAt)}</span>
                                </div>
                                
                                {(log.ip || log.userAgent) && (
                                  <div className="p-3 bg-light-subtle rounded-3 mb-2">
                                    {log.ip && (
                                      <div className="d-flex justify-content-between mb-1">
                                        <span className="text-muted">IP Address</span>
                                        <span>{log.ip}</span>
                                      </div>
                                    )}
                                    
                                    {log.userAgent && (
                                      <>
                                        <div className="d-flex justify-content-between mb-1">
                                          <span className="text-muted">Device</span>
                                          <span>{getDeviceFromUserAgent(log.userAgent)}</span>
                                        </div>
                                        
                                        <div className="d-flex justify-content-between">
                                          <span className="text-muted">Browser</span>
                                          <span>{getBrowserFromUserAgent(log.userAgent)}</span>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                )}
                                
                                <p className={`text-${color} mb-0`}>
                                  {log.details || `Activity logged`}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {hasMoreActivity && (
                    <div className="text-center">
                      <Button 
                        variant="outline-primary"
                        onClick={handleLoadMoreActivity}
                        disabled={activityLoading}
                      >
                        {activityLoading ? (
                          <>
                            <Spinner
                              as="span"
                              animation="border"
                              size="sm"
                              role="status"
                              aria-hidden="true"
                              className="me-2"
                            />
                            Loading...
                          </>
                        ) : (
                          'Load More Activity'
                        )}
                      </Button>
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Tab.Pane>
          </Tab.Content>
        </Col>
      </Row>
    </Container>
  );
};

export default Profile; 