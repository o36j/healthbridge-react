import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge, ListGroup, Spinner, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { 
  FaCalendarAlt, 
  FaUserInjured, 
  FaChartLine, 
  FaClipboardList, 
  FaCalendarCheck,
  FaPrescriptionBottleAlt,
  FaStethoscope,
  FaFileMedical,
  FaHospital,
  FaUserMd,
  FaBell,
  FaArrowRight
} from 'react-icons/fa';
import moment from 'moment';

interface Appointment {
  _id: string;
  patientName: string;
  patientId: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  reason: string;
}

interface Stats {
  totalPatients: number;
  todayAppointments: number;
  pendingAppointments: number;
  completedAppointments: number;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const DoctorHome: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalPatients: 0,
    todayAppointments: 0,
    pendingAppointments: 0,
    completedAppointments: 0
  });
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const resp = await axios.get(`${API_URL}/appointments/user/${user.id}`);
        const appts: any[] = resp.data.appointments;
        // Today's date at midnight
        const today = new Date(); 
        today.setHours(0, 0, 0, 0);
        
        // Compute stats
        const totalPatients = new Set(appts.map(a => a.patient._id)).size;
        const todayCount = appts.filter(a => new Date(a.date).toDateString() === today.toDateString()).length;
        const pendingCount = appts.filter(a => a.status === 'pending').length;
        const completedCount = appts.filter(a => a.status === 'completed').length;
        
        // Today's appointments list
        const todayList: Appointment[] = appts
          .filter(a => new Date(a.date).toDateString() === today.toDateString())
          .map(a => ({
            _id: a._id,
            patientName: `${a.patient.firstName} ${a.patient.lastName}`,
            patientId: a.patient._id,
            date: a.date.split('T')[0],
            time: a.startTime,
            status: a.status,
            reason: a.reason
          }))
          .sort((a, b) => a.time.localeCompare(b.time));
        
        // Upcoming appointments list (future dates excluding today)
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const upcomingList: Appointment[] = appts
          .filter(a => {
            const apptDate = new Date(a.date);
            return apptDate >= tomorrow;
          })
          .map(a => ({
            _id: a._id,
            patientName: `${a.patient.firstName} ${a.patient.lastName}`,
            patientId: a.patient._id,
            date: a.date.split('T')[0],
            time: a.startTime,
            status: a.status,
            reason: a.reason
          }))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(0, 5); // Limit to next 5 upcoming appointments
        
        setStats({
          totalPatients,
          todayAppointments: todayCount,
          pendingAppointments: pendingCount,
          completedAppointments: completedCount
        });
        
        setTodayAppointments(todayList);
        setUpcomingAppointments(upcomingList);
      } catch (err) {
        console.error('DoctorHome fetch error:', err);
        setError('Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

  if (loading) {
    return (
      <Container className="text-center my-5">
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

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'confirmed': return 'success';
      case 'pending': return 'warning';
      case 'completed': return 'info';
      case 'cancelled': return 'danger';
      default: return 'secondary';
    }
  };

  return (
    <div className="doctor-dashboard">
      {/* Welcome Banner */}
      <Row className="mb-4">
        <Col>
          <Card className="border-0 bg-primary text-white shadow">
            <Card.Body className="py-4">
              <Row className="align-items-center">
                <Col md={8}>
                  <h2 className="fw-bold mb-1">Welcome back, Dr. {user?.firstName}</h2>
                  <p className="lead mb-0 opacity-75">Your patients are waiting for you today</p>
                </Col>
                <Col md={4} className="text-md-end mt-3 mt-md-0">
                  <div className="d-flex justify-content-md-end gap-2">
                    <Link to="/doctor/appointments/new">
                      <Button variant="light" className="text-primary fw-semibold">
                        <FaCalendarAlt className="me-2" />
                        New Appointment
                      </Button>
                    </Link>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col sm={6} lg={3} className="mb-3 mb-lg-0">
          <Card className="border-0 h-100 shadow-sm">
            <Card.Body className="p-3">
              <div className="d-flex align-items-center">
                <div className="rounded-circle bg-primary bg-opacity-10 p-3 me-3">
                  <FaCalendarAlt className="text-primary" style={{ fontSize: '1.5rem' }} />
                </div>
                <div>
                  <h3 className="fw-bold mb-0">{stats.todayAppointments}</h3>
                  <p className="text-muted mb-0">Today's Appointments</p>
                </div>
              </div>
              <div className="mt-3 text-end">
                <Link to="/doctor/appointments" className="btn btn-sm btn-link text-decoration-none p-0">
                  View All <i className="fas fa-arrow-right ms-1"></i>
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col sm={6} lg={3} className="mb-3 mb-lg-0">
          <Card className="border-0 h-100 shadow-sm">
            <Card.Body className="p-3">
              <div className="d-flex align-items-center">
                <div className="rounded-circle bg-success bg-opacity-10 p-3 me-3">
                  <FaUserInjured className="text-success" style={{ fontSize: '1.5rem' }} />
                </div>
                <div>
                  <h3 className="fw-bold mb-0">{stats.totalPatients}</h3>
                  <p className="text-muted mb-0">Total Patients</p>
                </div>
              </div>
              <div className="mt-3 text-end">
                <Link to="/doctor/patients" className="btn btn-sm btn-link text-decoration-none p-0">
                  Manage Patients <i className="fas fa-arrow-right ms-1"></i>
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col sm={6} lg={3} className="mb-3 mb-lg-0">
          <Card className="border-0 h-100 shadow-sm">
            <Card.Body className="p-3">
              <div className="d-flex align-items-center">
                <div className="rounded-circle bg-warning bg-opacity-10 p-3 me-3">
                  <FaBell className="text-warning" style={{ fontSize: '1.5rem' }} />
                </div>
                <div>
                  <h3 className="fw-bold mb-0">{stats.pendingAppointments}</h3>
                  <p className="text-muted mb-0">Pending Requests</p>
                </div>
              </div>
              <div className="mt-3 text-end">
                <Link to="/doctor/appointments" className="btn btn-sm btn-link text-decoration-none p-0">
                  Review <i className="fas fa-arrow-right ms-1"></i>
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col sm={6} lg={3} className="mb-3 mb-lg-0">
          <Card className="border-0 h-100 shadow-sm">
            <Card.Body className="p-3">
              <div className="d-flex align-items-center">
                <div className="rounded-circle bg-info bg-opacity-10 p-3 me-3">
                  <FaChartLine className="text-info" style={{ fontSize: '1.5rem' }} />
                </div>
                <div>
                  <h3 className="fw-bold mb-0">{stats.completedAppointments}</h3>
                  <p className="text-muted mb-0">Completed</p>
                </div>
              </div>
              <div className="mt-3 text-end">
                <Link to="/doctor/appointments" className="btn btn-sm btn-link text-decoration-none p-0">
                  View History <i className="fas fa-arrow-right ms-1"></i>
                </Link>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        {/* Today's Schedule */}
        <Col xl={8} className="mb-4">
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white py-3 border-0">
              <div className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0 fw-bold">Today's Schedule</h5>
                <Link to="/doctor/calendar">
                  <Button variant="outline-primary" size="sm">View Calendar</Button>
                </Link>
              </div>
            </Card.Header>
            <Card.Body className="p-0">
              {todayAppointments.length > 0 ? (
                <ListGroup variant="flush">
                  {todayAppointments.map((appt) => (
                    <ListGroup.Item key={appt._id} className="border-0 border-bottom px-4 py-3" action as={Link} to={`/doctor/appointments/${appt._id}`}>
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex align-items-center">
                          <div className="rounded-circle bg-primary bg-opacity-10 p-2 me-3">
                            <FaUserInjured className="text-primary" />
                          </div>
                          <div>
                            <h6 className="mb-0 fw-semibold">{appt.patientName}</h6>
                            <p className="mb-0 small text-muted">{appt.reason}</p>
                          </div>
                        </div>
                        <div className="d-flex align-items-center">
                          <div className="text-end me-3">
                            <p className="mb-0 fw-medium">{appt.time}</p>
                            <Badge bg={getStatusColor(appt.status)} className="rounded-pill">
                              {appt.status}
                            </Badge>
                          </div>
                          <FaArrowRight className="text-muted" />
                        </div>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <div className="text-center py-5">
                  <FaCalendarCheck className="text-muted mb-3" style={{ fontSize: '2rem' }} />
                  <h5>No appointments scheduled for today</h5>
                  <p className="text-muted">You're all caught up!</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        {/* Upcoming Appointments */}
        <Col xl={4} className="mb-4">
          <Card className="border-0 shadow-sm h-100">
            <Card.Header className="bg-white py-3 border-0">
              <h5 className="mb-0 fw-bold">Upcoming Appointments</h5>
            </Card.Header>
            <Card.Body className="p-0">
              {upcomingAppointments.length > 0 ? (
                <ListGroup variant="flush">
                  {upcomingAppointments.map((appt) => (
                    <ListGroup.Item key={appt._id} className="border-0 border-bottom px-4 py-3">
                      <div className="d-flex justify-content-between align-items-start">
                        <div>
                          <h6 className="mb-0 fw-semibold">{appt.patientName}</h6>
                          <p className="mb-1 small text-muted">{appt.reason}</p>
                          <div className="d-flex align-items-center">
                            <FaCalendarAlt className="text-primary me-1" style={{ fontSize: '0.75rem' }} />
                            <span className="small">{moment(appt.date).format('MMM DD, YYYY')} - {appt.time}</span>
                          </div>
                        </div>
                        <Badge bg={getStatusColor(appt.status)} className="rounded-pill align-self-start">
                          {appt.status}
                        </Badge>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              ) : (
                <div className="text-center py-5">
                  <FaCalendarCheck className="text-muted mb-3" style={{ fontSize: '2rem' }} />
                  <h5>No upcoming appointments</h5>
                  <p className="text-muted">Your schedule is clear!</p>
                </div>
              )}
            </Card.Body>
            <Card.Footer className="bg-white border-0 text-center py-3">
              <Link to="/doctor/calendar" className="btn btn-outline-primary">
                <FaCalendarAlt className="me-2" />
                Full Calendar
              </Link>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DoctorHome; 