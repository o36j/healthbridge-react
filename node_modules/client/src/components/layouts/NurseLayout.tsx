import { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, UserRole } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  FaCalendarAlt,
  FaClipboardList,
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
  FaHospital,
  FaMoon,
  FaSun,
  FaNotesMedical,
  FaUserNurse,
  FaSyringe,
  FaStethoscope,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa';
import { NavLink } from 'react-router-dom';
import { Container, Row, Col, Navbar, Nav, Button, Dropdown, Badge } from 'react-bootstrap';

// Import application logo
import healthBridgeLogo from '../../assets/HealthBridge_logo.png';

interface NurseLayoutProps {
  children: ReactNode;
}

const NurseLayout = ({ children }: NurseLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 992);
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  // Handle window resize to determine if we're on mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 992);
      if (window.innerWidth < 992) {
        setSidebarCollapsed(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    if (isMobile) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  // Navigation items for nurse role
  const getNavItems = () => {
    return [
      { label: 'Dashboard', path: '/nurse', icon: <FaTachometerAlt className="me-2" /> },
      { label: 'Patients', path: '/nurse/patients', icon: <FaUserInjured className="me-2" /> },
      { label: 'Medical Records', path: '/nurse/medical-records', icon: <FaNotesMedical className="me-2" /> },
      { label: 'Appointments', path: '/nurse/appointments', icon: <FaCalendarAlt className="me-2" /> },
      { label: 'Vitals', path: '/nurse/vitals', icon: <FaStethoscope className="me-2" /> },
      { label: 'Medications', path: '/nurse/medications', icon: <FaSyringe className="me-2" /> },
      { label: 'Profile', path: '/nurse/profile', icon: <FaUser className="me-2" /> },
      { label: 'Settings', path: '/nurse/settings', icon: <FaCog className="me-2" /> },
    ];
  };

  // Get the page title based on the current location
  const getPageTitle = () => {
    if (location.pathname === '/nurse') return 'Dashboard';
    if (location.pathname.includes('/nurse/patients')) return 'Patients';
    if (location.pathname.includes('/nurse/medical-records')) return 'Medical Records';
    if (location.pathname.includes('/nurse/appointments')) return 'Appointments';
    if (location.pathname.includes('/nurse/vitals')) return 'Vitals';
    if (location.pathname.includes('/nurse/medications')) return 'Medications';
    if (location.pathname.includes('/nurse/profile')) return 'Profile';
    if (location.pathname.includes('/nurse/settings')) return 'Settings';
    return 'Nurse Portal';
  };

  // Determine sidebar width based on state
  const sidebarWidth = sidebarCollapsed ? 70 : 240;

  return (
    <div className="nurse-layout d-flex flex-column min-vh-100 bg-light">
      {/* Header */}
      <header className="header bg-primary text-white shadow-sm position-fixed w-100" style={{ zIndex: 1050 }}>
        <Navbar expand="lg" variant="dark" className="py-2">
          <Container fluid>
            {/* Mobile sidebar toggle */}
            <Button
              variant="link"
              className="d-lg-none navbar-toggler border-0 shadow-none text-white"
              onClick={toggleSidebar}
            >
              {sidebarOpen ? <FaTimes /> : <FaBars />}
            </Button>

            {/* Logo */}
            <Navbar.Brand as={Link} to="/nurse" className="me-auto me-lg-4">
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
                  HealthBridge Nurse
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
              {/* Desktop Sidebar Toggle */}
              <Button
                variant="link"
                className="d-none d-lg-flex text-white me-2 p-0 border-0"
                onClick={toggleSidebar}
                title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
              >
                {sidebarCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
              </Button>
              
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
                      <FaUserNurse className="text-primary" />
                    )}
                  </div>
                  <div className="d-none d-md-block text-white">
                    <div className="fw-medium">Nurse {user?.firstName} {user?.lastName}</div>
                    <div className="small opacity-75">{user?.department || ''}</div>
                  </div>
                </Dropdown.Toggle>

                <Dropdown.Menu>
                  <Dropdown.Item as={Link} to="/nurse/profile">
                    <FaUser className="me-2" /> Profile
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/nurse/settings">
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

      <div className="d-flex flex-grow-1" style={{ paddingTop: '56px' }}>
        {/* Sidebar */}
        <aside
          className={`sidebar bg-white border-end ${sidebarOpen ? 'show' : ''}`}
          style={{
            width: `${sidebarWidth}px`,
            zIndex: 1040,
            position: 'fixed',
            height: '100%',
            top: 0,
            left: 0,
            paddingTop: '70px',
            transition: 'all 0.3s ease',
            transform: isMobile ? (sidebarOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
          }}
        >
          <div className="sidebar-sticky p-3">
            {!sidebarCollapsed && (
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
                        <FaUserNurse className="text-primary" size={30} />
                      </div>
                    )}
                  </div>
                  <h6 className="fw-bold mb-1">Nurse {user?.firstName} {user?.lastName}</h6>
                  <p className="text-muted small">{user?.department || ''}</p>
                </div>
              </div>
            )}

            <Nav as="ul" className="flex-column">
              {getNavItems().map((item, index) => (
                <Nav.Item key={index} as="li">
                  <Nav.Link
                    as={Link}
                    to={item.path}
                    className={`px-3 py-2 rounded-3 mb-2 d-flex align-items-center ${
                      location.pathname === item.path
                        ? 'bg-primary bg-opacity-10 text-primary fw-semibold'
                        : 'text-secondary'
                    }`}
                    title={sidebarCollapsed ? item.label : ''}
                  >
                    <div className={sidebarCollapsed ? 'mx-auto' : ''}>
                      {item.icon.props.children}
                    </div>
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </Nav.Link>
                </Nav.Item>
              ))}
            </Nav>

            {!sidebarCollapsed && (
              <div className="mt-auto pt-4">
                <Button
                  variant="outline-danger"
                  className="w-100 d-flex align-items-center justify-content-center"
                  onClick={handleLogout}
                >
                  <FaSignOutAlt className="me-2" /> Logout
                </Button>
              </div>
            )}
          </div>
        </aside>

        {/* Backdrop for mobile */}
        {isMobile && sidebarOpen && (
          <div
            className="position-fixed top-0 left-0 w-100 h-100 bg-dark"
            style={{ opacity: 0.5, zIndex: 1030 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main content */}
        <main 
          className="flex-grow-1 py-4" 
          style={{ 
            marginLeft: isMobile ? '0' : `${sidebarWidth}px`,
            transition: 'margin-left 0.3s ease',
            minHeight: '100vh'
          }}
        >
          <Container fluid className="px-4">
            <div className="d-none d-lg-block mb-4">
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to="/nurse">Dashboard</Link>
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

export default NurseLayout; 