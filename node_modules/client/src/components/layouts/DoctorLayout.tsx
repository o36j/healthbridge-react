import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  FaCalendarAlt,
  FaClipboardList,
  FaUserMd,
  FaUser,
  FaCog,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaUserInjured,
  FaUsers,
  FaBell,
  FaSearch,
  FaHome,
  FaRegClock,
  FaFileAlt,
  FaChevronDown,
  FaCalendarCheck,
  FaTachometerAlt,
  FaPrescriptionBottleAlt,
  FaHospital,
  FaMoon,
  FaSun,
  FaPills
} from 'react-icons/fa';
import { NavLink } from 'react-router-dom';
import { Container, Row, Col, Navbar, Nav, Button, Dropdown, Badge } from 'react-bootstrap';

// Import application logo
import healthBridgeLogo from '../../assets/HealthBridge_logo.png';

interface DoctorLayoutProps {
  children: ReactNode;
}

const DoctorLayout = ({ children }: DoctorLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Navigation items for doctor role
  const getNavItems = () => {
    return [
      { label: 'Dashboard', path: '/doctor', icon: <FaTachometerAlt className="me-2" /> },
      { label: 'Appointments', path: '/doctor/appointments', icon: <FaCalendarAlt className="me-2" /> },
      { label: 'Calendar', path: '/doctor/calendar', icon: <FaRegClock className="me-2" /> },
      { label: 'Patients', path: '/doctor/patients', icon: <FaUserInjured className="me-2" /> },
      { label: 'Prescriptions', path: '/doctor/prescriptions', icon: <FaPrescriptionBottleAlt className="me-2" /> },
      { label: 'Medications', path: '/doctor/medications', icon: <FaPills className="me-2" /> },
      { label: 'Profile', path: '/doctor/profile', icon: <FaUser className="me-2" /> },
      { label: 'Settings', path: '/doctor/settings', icon: <FaCog className="me-2" /> },
    ];
  };

  // Get the page title based on the current location
  const getPageTitle = () => {
    if (location.pathname === '/doctor') return 'Dashboard';
    if (location.pathname.includes('/doctor/appointments')) return 'Appointments';
    if (location.pathname.includes('/doctor/calendar')) return 'Calendar';
    if (location.pathname.includes('/doctor/patients')) return 'Patients';
    if (location.pathname.includes('/doctor/prescriptions')) return 'Prescriptions';
    if (location.pathname.includes('/doctor/medications')) return 'Medications';
    if (location.pathname.includes('/doctor/patient-records')) return 'Patient Records';
    if (location.pathname.includes('/doctor/profile')) return 'Profile';
    if (location.pathname.includes('/doctor/settings')) return 'Settings';
    return 'Doctor Portal';
  };

  return (
    <div className="doctor-layout d-flex flex-column min-vh-100 bg-light">
      {/* Header */}
      <header className="header bg-primary text-white shadow-sm">
        <Navbar expand="lg" variant="dark" className="py-2">
          <Container fluid>
            {/* Mobile sidebar toggle */}
            <Button
              variant="link"
              className="d-lg-none navbar-toggler border-0 shadow-none text-white"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <FaTimes /> : <FaBars />}
            </Button>

            {/* Logo */}
            <Navbar.Brand as={Link} to="/doctor" className="me-auto me-lg-4">
              <div className="d-flex align-items-center">
                <img
                  src={healthBridgeLogo}
                  alt="HealthBridge"
                  height="40"
                  className="me-2"
                  onError={(e) => {
                    e.currentTarget.src = 'https://placehold.co/40x40/ffffff/0284c7?text=HB';
                  }}
                  style={{ filter: 'brightness(0) invert(1)' }}
                />
                <span className="fw-bold d-none d-sm-inline">
                  HealthBridge MD
                </span>
              </div>
            </Navbar.Brand>

            {/* Page title - visible on all screen sizes */}
            <div className="d-flex align-items-center">
              <h5 className="mb-0 fw-bold me-3 d-none d-md-block">{getPageTitle()}</h5>
              <div className="d-lg-none mx-auto">
                <h5 className="mb-0 fw-bold d-md-none">{getPageTitle()}</h5>
              </div>
            </div>

            {/* Right side menu */}
            <div className="d-flex align-items-center">
              {/* Theme Toggle */}
              <Button 
                variant="link" 
                className="text-white me-2 px-2 border-0" 
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {theme === 'dark' ? <FaSun /> : <FaMoon />}
              </Button>
            
              {/* User Profile */}
              <Dropdown align="end">
                <Dropdown.Toggle as="div" className="cursor-pointer d-flex align-items-center" id="user-dropdown">
                  <div className="bg-white rounded-circle p-1 me-2 d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                    {user?.profilePhoto ? (
                      <img
                        src={user.profilePhoto}
                        alt={`${user.firstName} ${user.lastName}`}
                        className="rounded-circle w-100 h-100 object-fit-cover"
                      />
                    ) : (
                      <FaUserMd className="text-primary" />
                    )}
                  </div>
                  <div className="d-none d-md-block text-white">
                    <div className="fw-medium">Dr. {user?.firstName} {user?.lastName}</div>
                    <div className="small opacity-75">{user?.specialization || user?.department || ''}</div>
                  </div>
                </Dropdown.Toggle>

                <Dropdown.Menu>
                  <Dropdown.Item as={Link} to="/doctor/profile">
                    <FaUser className="me-2" /> Profile
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/doctor/settings">
                    <FaCog className="me-2" /> Settings
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={handleLogout}>
                    <FaSignOutAlt className="me-2" /> Log Out
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </Container>
        </Navbar>
      </header>

      <div className="d-flex flex-grow-1">
        {/* Sidebar */}
        <aside
          className={`sidebar bg-white border-end ${sidebarOpen ? 'show' : ''}`}
          style={{
            width: '240px',
            zIndex: 1040,
            position: 'fixed',
            height: '100%',
            top: 0,
            left: 0,
            paddingTop: '70px',
            transition: 'transform 0.3s ease',
            transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          }}
        >
          <div className="sidebar-sticky p-3">
            <div className="mb-4">
              <div className="user-info text-center">
                <div className="rounded-circle bg-primary p-1 mx-auto mb-3" style={{ width: '64px', height: '64px' }}>
                  {user?.profilePhoto ? (
                    <img
                      src={user.profilePhoto}
                      alt={`${user.firstName} ${user.lastName}`}
                      className="rounded-circle w-100 h-100 object-fit-cover"
                    />
                  ) : (
                    <div className="w-100 h-100 rounded-circle bg-white d-flex align-items-center justify-content-center">
                      <FaUserMd className="text-primary" size={30} />
                    </div>
                  )}
                </div>
                <h6 className="fw-bold mb-1">Dr. {user?.firstName} {user?.lastName}</h6>
                <p className="text-muted small">{user?.specialization || user?.department || ''}</p>
              </div>
            </div>

            <Nav as="ul" className="flex-column">
              {getNavItems().map((item, index) => (
                <Nav.Item key={index} as="li">
                  <Nav.Link
                    as={Link}
                    to={item.path}
                    className={`px-3 py-2 rounded-3 mb-2 d-flex align-items-center ${location.pathname === item.path
                        ? 'bg-primary bg-opacity-10 text-primary fw-semibold'
                        : 'text-secondary'
                      }`}
                  >
                    {item.icon} {item.label}
                  </Nav.Link>
                </Nav.Item>
              ))}
            </Nav>

            <div className="mt-auto pt-4">
              <Button
                variant="outline-danger"
                className="w-100 d-flex align-items-center justify-content-center"
                onClick={handleLogout}
              >
                <FaSignOutAlt className="me-2" /> Logout
              </Button>
            </div>
          </div>
        </aside>

        {/* Backdrop for mobile */}
        {sidebarOpen && (
          <div
            className="position-fixed top-0 left-0 w-100 h-100 bg-dark"
            style={{ opacity: 0.5, zIndex: 1030 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main className="flex-grow-1 py-4" style={{ marginLeft: '240px' }}>
          <Container fluid className="px-4">
            <div className="d-none d-lg-block mb-4">
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to="/doctor">Dashboard</Link>
                  </li>
                  {getPageTitle() !== 'Dashboard' && (
                    <li className="breadcrumb-item active" aria-current="page">
                      {getPageTitle()}
                    </li>
                  )}
                </ol>
              </nav>
            </div>

            {children}
          </Container>
        </main>
      </div>
    </div>
  );
};

export default DoctorLayout; 