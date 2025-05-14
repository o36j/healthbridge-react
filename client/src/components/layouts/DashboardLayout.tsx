import { ReactNode, useState } from 'react';
import { Link, useLocation, useNavigate, NavLink as RouterNavLink } from 'react-router-dom';
import { useAuth, UserRole } from '../../contexts/AuthContext';
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
  FaChartLine,
  FaBell,
  FaSearch,
  FaHome,
  FaHospital,
  FaPhone,
  FaEnvelope,
  FaHistory,
  FaTachometerAlt,
  FaInfoCircle,
  FaListAlt,
  FaUserNurse,
  FaEllipsisV,
  FaFileAlt,
  FaUserPlus,
  FaChevronDown,
  FaRegClock,
  FaPills,
  FaChartBar
} from 'react-icons/fa';
import { Container, Row, Col, Navbar, Nav, Button, Dropdown, Badge } from 'react-bootstrap';

interface DashboardLayoutProps {
  children: ReactNode;
}

// Define the props interface for SidebarNavLink component
interface SidebarNavLinkProps {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

// Custom NavLink component for sidebar navigation
const SidebarNavLink: React.FC<SidebarNavLinkProps> = ({ to, icon, children, className = '' }) => {
  return (
    <Nav.Item as="li">
      <RouterNavLink
        to={to}
        className={({ isActive }) => 
          `px-3 py-2 rounded-3 mb-2 d-flex align-items-center ${
            isActive 
              ? 'bg-primary bg-opacity-10 text-primary fw-semibold' 
              : 'text-secondary'
          } ${className}`
        }
      >
        {icon} {children}
      </RouterNavLink>
    </Nav.Item>
  );
};

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Navigation items based on user role
  const getNavItems = () => {
    switch(user?.role) {
      case UserRole.PATIENT:
        return [
          { label: 'Home', path: '/', icon: <FaHome className="me-2" /> },
          { label: 'Appointments', path: '/appointments', icon: <FaCalendarAlt className="me-2" /> },
          { label: 'Medical History', path: '/history', icon: <FaHistory className="me-2" /> },
          { label: 'Profile', path: '/profile', icon: <FaUser className="me-2" /> },
        ];
      case UserRole.DOCTOR:
        return [
          { label: 'Home', path: '/', icon: <FaHome className="me-2" /> },
          { label: 'Appointments', path: '/appointments', icon: <FaCalendarAlt className="me-2" /> },
          { label: 'Patients', path: '/patients', icon: <FaUserInjured className="me-2" /> }, 
          { label: 'Patient Records', path: '/records', icon: <FaClipboardList className="me-2" /> },
          { label: 'Profile', path: '/profile', icon: <FaUser className="me-2" /> },
        ];
      case UserRole.NURSE:
        return [
          { label: 'Home', path: '/', icon: <FaHome className="me-2" /> },
          { label: 'Appointments', path: '/appointments', icon: <FaCalendarAlt className="me-2" /> },
          { label: 'Patients', path: '/patients', icon: <FaUserInjured className="me-2" /> },
          { label: 'Patient Records', path: '/records', icon: <FaClipboardList className="me-2" /> },
          { label: 'Profile', path: '/profile', icon: <FaUser className="me-2" /> },
        ];
      case UserRole.ADMIN:
        return [
          { label: 'Home', path: '/', icon: <FaHome className="me-2" /> },
          { label: 'Users', path: '/users', icon: <FaUsers className="me-2" /> },
          { label: 'Doctors', path: '/doctors', icon: <FaUserMd className="me-2" /> },
          { label: 'Appointments', path: '/appointments', icon: <FaCalendarAlt className="me-2" /> },
          { label: 'Doctor Availability', path: '/availability-management', icon: <FaCalendarAlt className="me-2" /> },
          { label: 'Settings', path: '/settings', icon: <FaCog className="me-2" /> },
          { label: 'Profile', path: '/profile', icon: <FaUser className="me-2" /> },
        ];
      default:
        return [
          { label: 'Home', path: '/', icon: <FaHome className="me-2" /> },
          { label: 'Profile', path: '/profile', icon: <FaUser className="me-2" /> },
        ];
    }
  };

  // Get the page title based on the current location
  const getPageTitle = () => {
    if (location.pathname === '/') return 'Home';
    if (location.pathname.includes('/profile')) return 'Profile';
    if (location.pathname.includes('/settings')) return 'Settings';
    if (location.pathname.includes('/appointments')) return 'Appointments';
    if (location.pathname.includes('/history')) return 'Medical History';
    if (location.pathname.includes('/patients')) return 'Patients';
    if (location.pathname.includes('/doctors')) return 'Doctors';
    if (location.pathname.includes('/users')) return 'Users';
    if (location.pathname.includes('/records')) return 'Patient Records';
    return 'HealthBridge';
  };

  // Get quick actions based on user role
  const getQuickActions = () => {
    if (user?.role === UserRole.ADMIN) {
      return [
        { label: 'Add User', path: '/users/create', icon: <FaUserPlus className="me-2" /> },
        { label: 'Add Doctor', path: '/doctors/create', icon: <FaUserMd className="me-2" /> },
        { label: 'Manage Availability', path: '/availability-management', icon: <FaCalendarAlt className="me-2" /> },
        { label: 'Audit Logs', path: '/audit-logs', icon: <FaFileAlt className="me-2" /> },
      ];
    }
    return [];
  };

  return (
    <div className="dashboard-layout d-flex flex-column min-vh-100 bg-light">
      {/* Header */}
      <header className="header bg-white shadow-sm">
        <Navbar expand="lg">
          <Container fluid>
            {/* Mobile sidebar toggle */}
            <Button 
              variant="link" 
              className="d-lg-none navbar-toggler border-0 shadow-none"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <FaTimes /> : <FaBars />}
            </Button>
            
            {/* Logo */}
            <Navbar.Brand 
              as={Link} 
              to="/" 
              className={user?.role === UserRole.ADMIN ? "ms-0 me-0 me-lg-2" : "me-auto me-lg-4"}
              style={user?.role === UserRole.ADMIN ? { maxWidth: 'fit-content' } : {}}
            >
              <div className="d-flex align-items-center">
                <img 
                  src="/logo-placeholder.png" 
                  alt="HealthBridge" 
                  height={user?.role === UserRole.ADMIN ? "30" : "36"}
                  className="me-2"
                  onError={(e) => {
                    e.currentTarget.src = 'https://placehold.co/36x36/0284c7/white?text=HB';
                  }}
                />
                <span 
                  className={`fw-bold d-none d-sm-inline ${user?.role === UserRole.ADMIN ? "fs-5" : ""}`} 
                  style={{
                    background: 'linear-gradient(90deg, #0284c7 0%, #0ea5e9 100%)', 
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  HealthBridge{user?.role === UserRole.ADMIN ? " Admin" : ""}
                </span>
              </div>
            </Navbar.Brand>
            
            {/* Page title - visible on all screen sizes */}
            <div className={`d-flex align-items-center ${user?.role === UserRole.ADMIN ? "ms-1" : ""}`}>
              <h5 className="mb-0 fw-bold me-3 d-none d-md-block">{getPageTitle()}</h5>
              <div className="d-lg-none mx-auto">
                <h5 className="mb-0 fw-bold d-md-none">{getPageTitle()}</h5>
              </div>
            </div>
            
            {/* Right side menu */}
            <div className="d-flex align-items-center">
              {/* Search */}
              <div className="position-relative d-none d-md-block me-2">
                <div className="input-group input-group-sm">
                  <span className="input-group-text bg-light border-0">
                    <FaSearch className="text-muted" />
                  </span>
                  <input 
                    type="text" 
                    className="form-control form-control-sm bg-light border-0" 
                    placeholder="Search..." 
                    style={{ maxWidth: '150px' }}
                  />
                </div>
              </div>
              
              {/* Quick Actions - Only for Admin */}
              {user?.role === UserRole.ADMIN && getQuickActions().length > 0 && (
                <Dropdown align="end" className="me-2">
                  <Dropdown.Toggle variant="light" size="sm" className="rounded-pill">
                    <span className="d-none d-md-inline">Quick Actions</span>
                    <FaChevronDown className="ms-1" />
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    {getQuickActions().map((action, index) => (
                      <Dropdown.Item key={index} as={Link} to={action.path}>
                        {action.icon} {action.label}
                      </Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
              )}
              
              {/* Notifications */}
              <Dropdown align="end" className="me-2">
                <Dropdown.Toggle as={Button} variant="light" size="sm" className="rounded-circle p-1 position-relative">
                  <FaBell />
                  <Badge 
                    pill 
                    bg="danger" 
                    className="position-absolute top-0 start-100 translate-middle"
                    style={{ fontSize: '0.5rem' }}
                  >
                    3
                  </Badge>
                </Dropdown.Toggle>
                <Dropdown.Menu className="dropdown-menu-end" style={{ minWidth: '20rem' }}>
                  <div className="p-2 border-bottom">
                    <h6 className="mb-0">Notifications</h6>
                  </div>
                  <Dropdown.Item className="px-3 py-2 border-bottom">
                    <div className="d-flex align-items-center">
                      <div className="flex-shrink-0">
                        <div className="bg-primary bg-opacity-10 rounded-circle p-2">
                          <FaCalendarAlt className="text-primary" />
                        </div>
                      </div>
                      <div className="flex-grow-1 ms-3">
                        <p className="mb-0 fw-semibold">New appointment request</p>
                        <small className="text-muted">10 minutes ago</small>
                      </div>
                    </div>
                  </Dropdown.Item>
                  <Dropdown.Item className="text-center p-2">
                    <small className="text-primary">View all notifications</small>
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>

              {/* User Profile */}
              <Dropdown align="end">
                <Dropdown.Toggle as="div" className="cursor-pointer d-flex align-items-center" id="user-dropdown">
                  <div className="bg-primary rounded-circle p-1 me-2 d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px' }}>
                    {user?.profilePhoto ? (
                      <img
                        src={user.profilePhoto}
                        alt={`${user.firstName} ${user.lastName}`}
                        className="rounded-circle w-100 h-100 object-fit-cover"
                      />
                    ) : (
                      <FaUser className="text-white" />
                    )}
                  </div>
                  <div className="d-none d-md-block">
                    <div className="fw-medium text-dark">{user?.firstName} {user?.lastName}</div>
                    <div className="small text-muted">{user?.role}</div>
                  </div>
                </Dropdown.Toggle>
                
                <Dropdown.Menu>
                  <Dropdown.Item as={Link} to="/profile">
                    <FaUser className="me-2" /> Profile
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/settings">
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
            width: '260px', 
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
                      <FaUser className="text-primary" size={30} />
                    </div>
                  )}
                </div>
                <h6 className="fw-bold mb-1">{user?.firstName} {user?.lastName}</h6>
                <p className="text-muted small">{user?.role}</p>
              </div>
            </div>

            <Nav as="ul" className="flex-column">
              {user?.role === UserRole.ADMIN ? (
                // Admin navigation with grouping
                <>
                  {/* Dashboard */}
                  <SidebarNavLink to="/" icon={<FaTachometerAlt className="me-2" />}>
                    Dashboard
                  </SidebarNavLink>

                  {/* Users Group */}
                  <div className="sidebar-heading px-3 py-2 text-muted small text-uppercase">
                    User Management
                  </div>
                  <SidebarNavLink to="/users" icon={<FaUsers className="me-2" />}>
                    All Users
                  </SidebarNavLink>
                  <SidebarNavLink to="/doctors" icon={<FaUserMd className="me-2" />} className="mb-3">
                    Doctors
                  </SidebarNavLink>

                  {/* Appointments Group */}
                  <div className="sidebar-heading px-3 py-2 text-muted small text-uppercase">
                    Scheduling
                  </div>
                  <SidebarNavLink to="/appointments" icon={<FaCalendarAlt className="me-2" />}>
                    Appointments
                  </SidebarNavLink>
                  <SidebarNavLink to="/availability-management" icon={<FaRegClock className="me-2" />} className="mb-3">
                    Doctor Availability
                  </SidebarNavLink>

                  {/* Medical Data Group */}
                  <div className="sidebar-heading px-3 py-2 text-muted small text-uppercase">
                    Medical Data
                  </div>
                  <SidebarNavLink to="/history" icon={<FaHistory className="me-2" />}>
                    Medical Records
                  </SidebarNavLink>
                  <SidebarNavLink to="/medications" icon={<FaPills className="me-2" />} className="mb-3">
                    Medications
                  </SidebarNavLink>

                  {/* Analytics Group */}
                  <div className="sidebar-heading px-3 py-2 text-muted small text-uppercase">
                    Analytics
                  </div>
                  <SidebarNavLink to="/statistics" icon={<FaChartBar className="me-2" />}>
                    Statistics
                  </SidebarNavLink>
                  <SidebarNavLink to="/audit-logs" icon={<FaFileAlt className="me-2" />} className="mb-3">
                    Audit Logs
                  </SidebarNavLink>

                  {/* User Account Group */}
                  <div className="sidebar-heading px-3 py-2 text-muted small text-uppercase">
                    Account
                  </div>
                  <SidebarNavLink to="/profile" icon={<FaUser className="me-2" />}>
                    Profile
                  </SidebarNavLink>
                  <SidebarNavLink to="/settings" icon={<FaCog className="me-2" />} className="mb-3">
                    Settings
                  </SidebarNavLink>
                </>
              ) : (
                // Standard navigation for non-admin users
                getNavItems().map((item, index) => (
                  <SidebarNavLink key={index} to={item.path} icon={item.icon}>
                    {item.label}
                  </SidebarNavLink>
                ))
              )}
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
        <main className="flex-grow-1 py-4" style={{ marginLeft: sidebarOpen ? '260px' : '0' }}>
          <Container fluid className="px-4">
            <div className="d-none d-lg-block mb-4">
              <nav aria-label="breadcrumb">
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to="/">Home</Link>
                  </li>
                  <li className="breadcrumb-item active" aria-current="page">
                    {getPageTitle()}
                  </li>
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

export default DashboardLayout; 