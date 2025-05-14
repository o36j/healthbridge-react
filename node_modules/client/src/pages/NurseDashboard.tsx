import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Table, Badge, Button, Spinner, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { 
  FaCalendarDay, FaUsers, FaChartLine, FaBell, FaUserNurse, 
  FaStethoscope, FaClipboardCheck, FaSyringe, FaNotesMedical,
  FaCalendarAlt, FaFileAlt, FaUserMd
} from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface VitalRecord {
  _id: string;
  patientName: string;
  time: string;
  type: string;
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
  todayPatients: number;
  pendingVitals: number;
  totalVitalChecks: number;
  medicationAdministrations: number;
  assistedProcedures: number;
  pendingTasks: number;
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

const NurseDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [todayVitals, setTodayVitals] = useState<VitalRecord[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debug log to verify user data
  console.log('NurseDashboard - Current user:', user);
  console.log('NurseDashboard - API URL:', API_URL);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) {
        console.error('No user found in auth context');
        setError('Authentication required');
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        console.log(`Fetching appointments for user ID: ${user.id}`);
        // Fetch vitals to be recorded today
        const appointmentsUrl = `${API_URL}/appointments/user/${user.id}`;
        console.log('Appointments URL:', appointmentsUrl);
        
        try {
          const resp = await axios.get(appointmentsUrl);
          console.log('Appointments response:', resp.data);
          
          // Debug: Log the specific structure of the first appointment to help troubleshoot
          if (resp.data && resp.data.appointments && resp.data.appointments.length > 0) {
            console.log('First appointment structure:', JSON.stringify(resp.data.appointments[0], null, 2));
          } else {
            console.log('No appointments returned in the response');
          }
          
          const appts: any[] = resp.data.appointments || [];
          
          // Today's date at midnight
          const today = new Date(); 
          today.setHours(0,0,0,0);
          
          // Filter today's appointments to create vitals records
          const todaysAppts = appts.filter(a => a && a.date && new Date(a.date).toDateString() === today.toDateString());
          const vitalRecords = todaysAppts
            .filter(a => a && a._id && a.patient && a.patient.firstName && a.patient.lastName && a.startTime)
            .map(a => ({
              _id: a._id,
              patientName: `${a.patient.firstName} ${a.patient.lastName}`,
              time: formatTime(a.startTime),
              type: 'Blood Pressure & Temperature'
            }));
          
          // Calculate statistics - adding null checks
          const uniquePatients = new Set(appts.filter(a => a && a.patient && a.patient._id).map(a => a.patient._id));
          const pendingVitalsCount = vitalRecords.length;
          // These would be real metrics in a production app
          const totalVitalChecksCount = 24;
          const medicationAdministrationsCount = 18;
          const assistedProceduresCount = 5;
          const pendingTasksCount = 8;
          
          // Set computed stats and vitals
          setStats({
            todayPatients: todaysAppts.length,
            pendingVitals: pendingVitalsCount,
            totalVitalChecks: totalVitalChecksCount,
            medicationAdministrations: medicationAdministrationsCount,
            assistedProcedures: assistedProceduresCount,
            pendingTasks: pendingTasksCount
          });
          setTodayVitals(vitalRecords);
        } catch (appointmentErr: any) {
          console.error('Error fetching appointments:', appointmentErr);
          console.error('Error details:', appointmentErr.response?.data || appointmentErr.message);
          throw new Error(`Failed to fetch appointments: ${appointmentErr.response?.data?.message || appointmentErr.message}`);
        }
        
        // Fetch notifications
        console.log('Fetching notifications');
        const notificationsUrl = `${API_URL}/notifications`;
        console.log('Notifications URL:', notificationsUrl);
        
        try {
          const notifResp = await axios.get(notificationsUrl, { params: { unreadOnly: false } });
          console.log('Notifications response:', notifResp.data);
          setNotifications(notifResp.data.notifications);
          setUnreadCount(notifResp.data.unreadCount);
        } catch (notifErr: any) {
          console.error('Error fetching notifications:', notifErr);
          console.error('Error details:', notifErr.response?.data || notifErr.message);
          throw new Error(`Failed to fetch notifications: ${notifErr.response?.data?.message || notifErr.message}`);
        }
      } catch (err: any) {
        console.error('Dashboard data loading error:', err);
        setError(`Failed to load dashboard data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [user]);
  
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
  
  // Handler functions for quick navigation
  const handleMedicalRecordClick = () => {
    navigate('/nurse/medical-records');
  };

  const handleAppointmentsClick = () => {
    navigate('/nurse/appointments');
  };

  return (
    <Container fluid className="py-4">
      <Row className="mb-4">
        <Col>
          <div className="d-flex align-items-center">
            <FaUserNurse className="text-primary me-3" style={{ fontSize: '2rem' }} />
            <div>
              <h1 className="mb-0">Nurse Dashboard</h1>
              <p className="text-muted mb-0">Welcome back, Nurse {user?.firstName} {user?.lastName}</p>
              <p className="text-muted mb-0">General Care</p>
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
                <FaUsers className="text-primary" style={{ fontSize: '1.5rem' }} />
              </div>
              <div>
                <h6 className="text-muted mb-1">Today's Patients</h6>
                <h2 className="mb-0">{stats?.todayPatients}</h2>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col sm={6} md={4} lg={3} className="mb-3">
          <Card className="h-100 shadow-sm">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-warning bg-opacity-10 p-3 me-3">
                <FaStethoscope className="text-warning" style={{ fontSize: '1.5rem' }} />
              </div>
              <div>
                <h6 className="text-muted mb-1">Pending Vitals</h6>
                <h2 className="mb-0">{stats?.pendingVitals}</h2>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col sm={6} md={4} lg={3} className="mb-3">
          <Card className="h-100 shadow-sm">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-success bg-opacity-10 p-3 me-3">
                <FaClipboardCheck className="text-success" style={{ fontSize: '1.5rem' }} />
              </div>
              <div>
                <h6 className="text-muted mb-1">Vital Checks Today</h6>
                <h2 className="mb-0">{stats?.totalVitalChecks}</h2>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col sm={6} md={4} lg={3} className="mb-3">
          <Card className="h-100 shadow-sm">
            <Card.Body className="d-flex align-items-center">
              <div className="rounded-circle bg-info bg-opacity-10 p-3 me-3">
                <FaSyringe className="text-info" style={{ fontSize: '1.5rem' }} />
              </div>
              <div>
                <h6 className="text-muted mb-1">Medications Given</h6>
                <h2 className="mb-0">{stats?.medicationAdministrations}</h2>
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
                <h6 className="text-muted mb-1">Pending Tasks</h6>
                <h2 className="mb-0">{stats?.pendingTasks}</h2>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row>
        {/* Today's Vitals */}
        <Col lg={8} className="mb-4">
          <Card className="shadow-sm h-100">
            <Card.Header className="bg-white">
              <h5 className="mb-0">Pending Vital Checks</h5>
            </Card.Header>
            <Card.Body>
              <div className="table-responsive">
                <Table hover>
                  <thead>
                    <tr>
                      <th>Patient</th>
                      <th>Time</th>
                      <th>Type</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todayVitals.length > 0 ? (
                      todayVitals.map((vital) => (
                        <tr key={vital._id}>
                          <td>{vital.patientName}</td>
                          <td>{vital.time}</td>
                          <td>{vital.type}</td>
                          <td className="text-end">
                            <Link to={`/nurse/vitals/record/${vital._id}`}>
                              <Button size="sm" variant="outline-primary">
                                Record Vitals
                              </Button>
                            </Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="text-center py-4">
                          No vital checks scheduled for today.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
              <div className="text-end mt-3">
                <Link to="/nurse/vitals">
                  <Button variant="outline-primary">View All Vitals</Button>
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
              <Link to="/nurse/notifications" className="text-decoration-none d-block text-center">
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
                <Col sm={6} md={3} className="mb-3 mb-md-0">
                  <Link to="/nurse/vitals/new" className="text-decoration-none">
                    <Card className="text-center h-100 border-0 shadow-sm">
                      <Card.Body>
                        <div className="rounded-circle bg-primary bg-opacity-10 mx-auto p-3 mb-3" style={{ width: 'fit-content' }}>
                          <FaStethoscope className="text-primary" style={{ fontSize: '2rem' }} />
                        </div>
                        <h5>Record Vitals</h5>
                      </Card.Body>
                    </Card>
                  </Link>
                </Col>
                
                <Col sm={6} md={3} className="mb-3 mb-md-0">
                  <div onClick={handleMedicalRecordClick} className="text-decoration-none" style={{ cursor: 'pointer' }}>
                    <Card className="text-center h-100 border-0 shadow-sm">
                      <Card.Body>
                        <div className="rounded-circle bg-success bg-opacity-10 mx-auto p-3 mb-3" style={{ width: 'fit-content' }}>
                          <FaNotesMedical className="text-success" style={{ fontSize: '2rem' }} />
                        </div>
                        <h5>Medical Records</h5>
                      </Card.Body>
                    </Card>
                  </div>
                </Col>
                
                <Col sm={6} md={3} className="mb-3 mb-md-0">
                  <div onClick={handleAppointmentsClick} className="text-decoration-none" style={{ cursor: 'pointer' }}>
                    <Card className="text-center h-100 border-0 shadow-sm">
                      <Card.Body>
                        <div className="rounded-circle bg-warning bg-opacity-10 mx-auto p-3 mb-3" style={{ width: 'fit-content' }}>
                          <FaCalendarAlt className="text-warning" style={{ fontSize: '2rem' }} />
                        </div>
                        <h5>Appointments</h5>
                      </Card.Body>
                    </Card>
                  </div>
                </Col>
                
                <Col sm={6} md={3}>
                  <Link to="/nurse/medications" className="text-decoration-none">
                    <Card className="text-center h-100 border-0 shadow-sm">
                      <Card.Body>
                        <div className="rounded-circle bg-danger bg-opacity-10 mx-auto p-3 mb-3" style={{ width: 'fit-content' }}>
                          <FaSyringe className="text-danger" style={{ fontSize: '2rem' }} />
                        </div>
                        <h5>Medications</h5>
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

export default NurseDashboard; 