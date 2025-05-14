import { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Badge, Button, Form, InputGroup, Alert } from 'react-bootstrap';
import { FaBell, FaCheck, FaTrash, FaFilter, FaSearch } from 'react-icons/fa';
import { useAuth } from '../contexts/AuthContext';
import { format as formatDate } from 'date-fns';

// Mock data for notifications
const mockNotifications = [
  {
    id: 1,
    title: 'Appointment Confirmed',
    message: 'Your appointment with Dr. Sarah Johnson has been confirmed for tomorrow at 10:00 AM.',
    date: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    read: false,
    type: 'appointment'
  },
  {
    id: 2,
    title: 'Prescription Refill',
    message: 'Your prescription refill request for Medication X has been approved. You can pick it up from your pharmacy.',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
    read: true,
    type: 'prescription'
  },
  {
    id: 3,
    title: 'Lab Results Available',
    message: 'Your recent lab test results are now available. Please check the Lab Results section for details.',
    date: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
    read: false,
    type: 'lab'
  },
  {
    id: 4,
    title: 'Account Security',
    message: 'Your password was recently changed. If you did not make this change, please contact support immediately.',
    date: new Date(Date.now() - 1000 * 60 * 60 * 72), // 3 days ago
    read: true,
    type: 'security'
  },
  {
    id: 5,
    title: 'Health Tip',
    message: 'Regular exercise can help reduce stress and improve overall mental health. Try to get at least 30 minutes of physical activity daily.',
    date: new Date(Date.now() - 1000 * 60 * 60 * 96), // 4 days ago
    read: true,
    type: 'general'
  }
];

// Type definitions
interface Notification {
  id: number;
  title: string;
  message: string;
  date: Date;
  read: boolean;
  type: string;
}

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch notifications (mock data)
  useEffect(() => {
    // Simulate API call
    const fetchNotifications = async () => {
      try {
        setLoading(true);
        // In a real app, this would be an API call
        await new Promise(resolve => setTimeout(resolve, 800));
        setNotifications(mockNotifications);
        setFilteredNotifications(mockNotifications);
      } catch (err) {
        setError('Failed to load notifications');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, []);

  // Filter notifications based on search, type, and read status
  useEffect(() => {
    let filtered = [...notifications];
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        notification => 
          notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          notification.message.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(notification => notification.type === filterType);
    }
    
    // Filter by read status
    if (showUnreadOnly) {
      filtered = filtered.filter(notification => !notification.read);
    }
    
    setFilteredNotifications(filtered);
  }, [notifications, searchTerm, filterType, showUnreadOnly]);

  // Mark notification as read
  const markAsRead = (id: number) => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
    
    setSuccess('Notification marked as read');
    setTimeout(() => setSuccess(''), 3000);
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications(prevNotifications => 
      prevNotifications.map(notification => ({ ...notification, read: true }))
    );
    
    setSuccess('All notifications marked as read');
    setTimeout(() => setSuccess(''), 3000);
  };

  // Delete notification
  const deleteNotification = (id: number) => {
    setNotifications(prevNotifications => 
      prevNotifications.filter(notification => notification.id !== id)
    );
    
    setSuccess('Notification deleted');
    setTimeout(() => setSuccess(''), 3000);
  };

  // Format date helper
  const formatNotificationDate = (date: Date) => {
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 24) {
      return diffHours === 0 
        ? 'Just now' 
        : (diffHours === 1 ? '1 hour ago' : `${diffHours} hours ago`);
    } else if (diffHours < 48) {
      return 'Yesterday';
    } else {
      return formatDate(date, 'MMM d, yyyy');
    }
  };

  if (!user) {
    return (
      <Container className="py-5 text-center">
        <Alert variant="info">
          Please log in to view your notifications.
        </Alert>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-1">Notifications</h2>
          <p className="text-muted m-0">
            Stay updated with your health information and account activities
          </p>
        </div>
        <div>
          <Button 
            variant="outline-primary" 
            onClick={markAllAsRead}
            disabled={!notifications.some(notification => !notification.read)}
            className="d-flex align-items-center"
          >
            <FaCheck className="me-2" />
            Mark All Read
          </Button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}
      
      {error && (
        <Alert variant="danger" dismissible onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Row>
        {/* Filters and Search */}
        <Col md={4} lg={3} className="mb-4">
          <Card className="border-0 shadow-sm">
            <Card.Body>
              <h5 className="fw-bold mb-3">Filters</h5>
              
              <InputGroup className="mb-4">
                <InputGroup.Text id="search-addon">
                  <FaSearch />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Search notifications"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  aria-label="Search notifications"
                  title="Search notifications"
                />
              </InputGroup>
              
              <Form.Label id="notification-type-label" htmlFor="notification-type-filter" className="fw-bold mb-2">Notification Type</Form.Label>
              <Form.Select 
                id="notification-type-filter"
                aria-labelledby="notification-type-label"
                aria-label="Filter notifications by type"
                title="Notification Type Filter"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="mb-4"
              >
                <option value="all">All Notifications</option>
                <option value="appointment">Appointments</option>
                <option value="prescription">Prescriptions</option>
                <option value="lab">Lab Results</option>
                <option value="security">Security</option>
                <option value="general">General</option>
              </Form.Select>
              
              <Form.Check 
                type="switch"
                id="unread-filter"
                label="Show Unread Only"
                checked={showUnreadOnly}
                onChange={(e) => setShowUnreadOnly(e.target.checked)}
                className="mb-2"
                aria-label="Show unread notifications only"
                title="Show unread notifications only"
              />
            </Card.Body>
          </Card>
        </Col>
        
        {/* Notification List */}
        <Col md={8} lg={9}>
          <Card className="border-0 shadow-sm">
            <Card.Body className="p-0">
              {loading ? (
                <div className="text-center p-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center p-5">
                  <FaBell size={48} className="text-muted mb-3 opacity-50" />
                  <h5 className="fw-bold mb-2">No Notifications</h5>
                  <p className="text-muted">
                    {searchTerm || filterType !== 'all' || showUnreadOnly
                      ? "No notifications match your current filters"
                      : "You don't have any notifications yet"}
                  </p>
                </div>
              ) : (
                <div className="notification-list">
                  {filteredNotifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`notification-item p-4 border-bottom ${!notification.read ? 'bg-light' : ''}`}
                    >
                      <div className="d-flex">
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center mb-2">
                            <h5 className="fw-bold mb-0 me-2">{notification.title}</h5>
                            {!notification.read && (
                              <Badge bg="primary" pill className="px-2">New</Badge>
                            )}
                          </div>
                          <p className="mb-2">{notification.message}</p>
                          <div className="d-flex align-items-center text-muted small">
                            <Badge 
                              bg="light" 
                              text="dark" 
                              className="me-2"
                            >
                              {notification.type.charAt(0).toUpperCase() + notification.type.slice(1)}
                            </Badge>
                            <span>{formatNotificationDate(notification.date)}</span>
                          </div>
                        </div>
                        <div className="notification-actions ms-3 d-flex flex-column">
                          {!notification.read && (
                            <Button 
                              variant="outline-secondary" 
                              size="sm" 
                              onClick={() => markAsRead(notification.id)}
                              className="mb-2"
                              title="Mark as read"
                            >
                              <FaCheck />
                            </Button>
                          )}
                          <Button 
                            variant="outline-danger" 
                            size="sm" 
                            onClick={() => deleteNotification(notification.id)}
                            title="Delete notification"
                          >
                            <FaTrash />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Notifications; 