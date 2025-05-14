import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaCalendarDay, FaUsers, FaChartLine, FaBell, FaUserMd } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface AppointmentSummary {
  _id: string;
  patientName: string;
  time: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'no-show';
}

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

interface DashboardStats {
  todayAppointments: number;
  upcomingAppointments: number;
  totalPatients: number;
  completedToday: number;
  cancelledToday: number;
  pendingRequests: number;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper to format time slots to 12-hour format
const formatTime = (timeSlot: string) => {
  const [hours, minutes] = timeSlot.split(':');
  let hourNum = parseInt(hours, 10);
  const ampm = hourNum >= 12 ? 'PM' : 'AM';
  hourNum = hourNum % 12 === 0 ? 12 : hourNum % 12;
  return `${hourNum}:${minutes} ${ampm}`;
};

const DoctorDashboard: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [todayAppointments, setTodayAppointments] = useState<AppointmentSummary[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        // Fetch this doctor's appointments
        const resp = await axios.get(`${API_URL}/appointments/user/${user.id}`);
        const appts: any[] = resp.data.appointments;
        // Normalize status mapping
        const mapStatus = (status: string): AppointmentSummary['status'] => {
          if (status === 'completed') return 'completed';
          if (status === 'cancelled') return 'cancelled';
          return 'scheduled';
        };
        // Today's date at midnight
        const today = new Date(); today.setHours(0,0,0,0);
        // Filter today's appointments
        const todaysAppts = appts.filter(a => new Date(a.date).toDateString() === today.toDateString());
        const todaySummaries = todaysAppts.map(a => ({
          _id: a._id,
          patientName: `${a.patient.firstName} ${a.patient.lastName}`,
          time: formatTime(a.startTime),
          status: mapStatus(a.status)
        }));
        // Compute stats
        const uniquePatients = new Set(appts.map(a => a.patient._id));
        const upcomingCount = appts.filter(a => mapStatus(a.status) === 'scheduled' && new Date(a.date) > today).length;
        const completedTodayCount = todaySummaries.filter(a => a.status === 'completed').length;
        const cancelledTodayCount = todaySummaries.filter(a => a.status === 'cancelled').length;
        const pendingRequestsCount = appts.filter(a => a.status === 'pending').length;
        // Fetch notifications
        const notifResp = await axios.get(`${API_URL}/notifications`, { params: { unreadOnly: false } });
        setNotifications(notifResp.data.notifications);
        setUnreadCount(notifResp.data.unreadCount);
        // Set computed stats and appointments
        setStats({
          todayAppointments: todaysAppts.length,
          upcomingAppointments: upcomingCount,
          totalPatients: uniquePatients.size,
          completedToday: completedTodayCount,
          cancelledToday: cancelledTodayCount,
          pendingRequests: pendingRequestsCount
        });
        setTodayAppointments(todaySummaries);
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [user]);

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'scheduled': return 'primary';
      case 'completed': return 'success';
      case 'cancelled': return 'danger';
      case 'no-show': return 'warning';
      default: return 'secondary';
    }
  };
  
  if (loading) {
    return (
      <Container className="d-flex justify-content-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger">{error}</Alert>
      </Container>
    );
  }
  
  // Get the doctor's specialty to display
  const doctorSpecialty = user?.specialization || user?.department || 'Physician';
  
  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex align-items-center">
            <FaUserMd className="text-primary me-3" style={{ fontSize: '2rem' }} />
            <div>
              <h1 className="mb-0">Doctor Dashboard</h1>
              <p className="text-muted mb-0">Welcome back, Dr. {user?.firstName} {user?.lastName}</p>
              <p className="text-muted mb-0">{doctorSpecialty}</p>
            </div>
          </div>
        </Col>
      </Row>

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col sm={6} md={4} lg={3} className="mb-3">
          <Card className="h-100 shadow-sm">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-primary bg-opacity-10 p-3 me-3">
                <FaCalendarDay className="text-primary" style={{ fontSize: '1.5rem' }} />
              </div>
              <div>
                <h6 className="text-muted mb-1">Today's Appointments</h6>
                <h2 className="mb-0">{stats?.todayAppointments}</h2>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col sm={6} md={4} lg={3} className="mb-3">
          <Card className="h-100 shadow-sm">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-success bg-opacity-10 p-3 me-3">
                <FaCalendarDay className="text-success" style={{ fontSize: '1.5rem' }} />
              </div>
              <div>
                <h6 className="text-muted mb-1">Upcoming Appointments</h6>
                <h2 className="mb-0">{stats?.upcomingAppointments}</h2>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col sm={6} md={4} lg={3} className="mb-3">
          <Card className="h-100 shadow-sm">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-info bg-opacity-10 p-3 me-3">
                <FaUsers className="text-info" style={{ fontSize: '1.5rem' }} />
              </div>
              <div>
                <h6 className="text-muted mb-1">Total Patients</h6>
                <h2 className="mb-0">{stats?.totalPatients}</h2>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col sm={6} md={4} lg={3} className="mb-3">
          <Card className="h-100 shadow-sm">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-warning bg-opacity-10 p-3 me-3">
                <FaChartLine className="text-warning" style={{ fontSize: '1.5rem' }} />
              </div>
              <div>
                <h6 className="text-muted mb-1">Completed Today</h6>
                <h2 className="mb-0">{stats?.completedToday}</h2>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col sm={6} md={4} lg={3} className="mb-3">
          <Card className="h-100 shadow-sm">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-danger bg-opacity-10 p-3 me-3">
                <FaBell className="text-danger" style={{ fontSize: '1.5rem' }} />
              </div>
              <div>
                <h6 className="text-muted mb-1">Pending Requests</h6>
                <h2 className="mb-0">{stats?.pendingRequests}</h2>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row>
        {/* Today's Appointments */}
        <Col lg={8} className="mb-4">
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Today's Appointments</h5>
            </Card.Header>
        <Card.Body>
            <div className="table-responsive">
                <Table hover>
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Time</th>
                    <th>Status</th>
                      <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                    {todayAppointments.length > 0 ? (
                      todayAppointments.map((appointment) => (
                    <tr key={appointment._id}>
                          <td>{appointment.patientName}</td>
                          <td>{appointment.time}</td>
                      <td>
                        <Badge bg={getStatusBadgeVariant(appointment.status)}>
                              {appointment.status}
                        </Badge>
                      </td>
                          <td className="text-end">
                            <Link to={`/doctor/appointments/${appointment._id}`}>
                              <Button size="sm" variant="outline-primary">
                                View Details
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="text-center py-4">
                          No appointments scheduled for today.
                      </td>
                    </tr>
                    )}
                </tbody>
              </Table>
            </div>
              <div className="text-end mt-3">
                <Link to="/doctor/appointments">
                  <Button variant="outline-primary">View All Appointments</Button>
                </Link>
              </div>
        </Card.Body>
      </Card>
        </Col>

        {/* Notifications */}
        <Col lg={4} className="mb-4">
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Notifications</h5>
              <Badge bg="danger" pill>{unreadCount}</Badge>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="list-group list-group-flush">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div
                      key={notif._id}
                      className="list-group-item border-start-0 border-end-0 d-flex align-items-center py-3"
                    >
                      <div className="rounded-circle bg-primary bg-opacity-10 p-2 me-3">
                        <FaBell className="text-primary" />
                      </div>
                      <div>
                        <p className="mb-0">{notif.title}: {notif.message}</p>
                        <small className="text-muted">{new Date(notif.createdAt).toLocaleString()}</small>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="list-group-item text-center py-4">
                    No notifications.
                  </div>
                )}
              </div>
            </Card.Body>
            <Card.Footer className="bg-white">
              <Link to="/doctor/notifications" className="text-decoration-none d-block text-center">
                View all notifications
              </Link>
            </Card.Footer>
          </Card>
        </Col>
      </Row>

      {/* Quick Access */}
      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Quick Access</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col sm={6} md={4} className="mb-3 mb-md-0">
                  <Link to="/doctor/appointments/new" className="text-decoration-none">
                    <Card className="text-center h-100 border-0 shadow-sm">
                      <Card.Body>
                        <div className="rounded-circle bg-primary bg-opacity-10 mx-auto p-3 mb-3" style={{ width: 'fit-content' }}>
                          <FaCalendarDay className="text-primary" style={{ fontSize: '2rem' }} />
                        </div>
                        <h5>New Appointment</h5>
                      </Card.Body>
                    </Card>
                  </Link>
                </Col>
                <Col sm={6} md={4} className="mb-3 mb-md-0">
                  <Link to="/doctor/patients" className="text-decoration-none">
                    <Card className="text-center h-100 border-0 shadow-sm">
                      <Card.Body>
                        <div className="rounded-circle bg-info bg-opacity-10 mx-auto p-3 mb-3" style={{ width: 'fit-content' }}>
                          <FaUsers className="text-info" style={{ fontSize: '2rem' }} />
                        </div>
                        <h5>Patient Records</h5>
                      </Card.Body>
                    </Card>
                  </Link>
                </Col>
                <Col sm={6} md={4}>
                  <Link to="/doctor/profile" className="text-decoration-none">
                    <Card className="text-center h-100 border-0 shadow-sm">
                      <Card.Body>
                        <div className="rounded-circle bg-warning bg-opacity-10 mx-auto p-3 mb-3" style={{ width: 'fit-content' }}>
                          <FaUserMd className="text-warning" style={{ fontSize: '2rem' }} />
                        </div>
                        <h5>My Profile</h5>
                      </Card.Body>
                    </Card>
                  </Link>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default DoctorDashboard; 