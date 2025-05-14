/**
 * Main Layout Component
 * 
 * This component provides the primary layout structure for the application,
 * including the top navigation bar, footer, and content area.
 * 
 * Features:
 * - Responsive navigation with mobile support
 * - Dynamic navigation based on user authentication status and role
 * - User profile dropdown with role-specific actions
 * - Consistent branding and layout structure
 * - Contextual page titles
 */

import React, { ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Container, Row, Col, Navbar, Nav, Button, Dropdown } from 'react-bootstrap';
import { useAuth, UserRole } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  FaCalendarAlt,
  FaUserMd,
  FaHospital,
  FaMobileAlt,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaLinkedinIn,
  FaRegClock,
  FaUser,
  FaCog,
  FaSignOutAlt,
  FaUserInjured,
  FaClipboardList,
  FaUsers,
  FaHistory,
  FaTachometerAlt,
  FaFileAlt,
  FaChartLine,
  FaMoon,
  FaSun,
  FaPills,
  FaChartBar
} from 'react-icons/fa';
import LinkButton from '../common/LinkButton';
import NavLinkRouter from '../common/NavLinkRouter';
import ChatButton from '../common/ChatButton';

// Import application logo
import healthBridgeLogo from '../../assets/HealthBridge_logo.png';
// Import CSS module
import styles from './MainLayout.module.css';

/**
 * Props for the MainLayout component
 */
interface MainLayoutProps {
  children: ReactNode; // Content to be rendered within the layout
}

/**
 * MainLayout Component
 * 
 * Provides the main layout structure for the public-facing parts of the application
 * and authenticated user areas.
 * 
 * @param children - Content to render within the layout
 */
const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  /**
   * Handle user logout
   * Calls the logout function from AuthContext
   */
  const handleLogout = async () => {
    await logout();
  };

  /**
   * Generate navigation items based on user role
   * Different user roles have access to different application features
   * 
   * @returns Array of navigation items with labels, paths, and icons
   */
  const getAuthenticatedNavItems = () => {
    if (!user) return [];

    // Common navigation items for all authenticated users
    const commonItems = [
      { label: 'Profile', path: '/profile', icon: <FaUser className="me-2" /> },
    ];

    // Role-specific navigation items
    switch (user.role) {
      case UserRole.PATIENT:
        return [
          ...commonItems,
          { label: 'Appointments', path: '/appointments', icon: <FaCalendarAlt className="me-2" /> },
          { label: 'Medical History', path: '/history', icon: <FaHistory className="me-2" /> },
        ];
      case UserRole.DOCTOR:
        return [
          ...commonItems,
          { label: 'Dashboard', path: '/doctor', icon: <FaTachometerAlt className="me-2" /> },
          { label: 'Appointments', path: '/doctor/appointments', icon: <FaCalendarAlt className="me-2" /> },
          { label: 'Calendar', path: '/doctor/calendar', icon: <FaRegClock className="me-2" /> },
          { label: 'Patients', path: '/doctor/patients', icon: <FaUserInjured className="me-2" /> },
          { label: 'Prescriptions', path: '/doctor/prescriptions', icon: <FaFileAlt className="me-2" /> },
        ];
      case UserRole.NURSE:
        return [
          ...commonItems,
          { label: 'Appointments', path: '/appointments', icon: <FaCalendarAlt className="me-2" /> },
          { label: 'Patients', path: '/patients', icon: <FaUserInjured className="me-2" /> },
          { label: 'Records', path: '/records', icon: <FaClipboardList className="me-2" /> },
        ];
      case UserRole.ADMIN:
        return [
          ...commonItems,
          { label: 'Dashboard', path: '/', icon: <FaTachometerAlt className="me-2" /> },
          { label: 'Users', path: '/users', icon: <FaUsers className="me-2" /> },
          { label: 'Doctors', path: '/doctors', icon: <FaUserMd className="me-2" /> },
          { label: 'Appointments', path: '/appointments', icon: <FaCalendarAlt className="me-2" /> },
          { label: 'Medical Records', path: '/history', icon: <FaHistory className="me-2" /> },
          { label: 'Doctor Availability', path: '/availability-management', icon: <FaRegClock className="me-2" /> },
          { label: 'Medications', path: '/medications', icon: <FaPills className="me-2" /> },
          { label: 'Statistics', path: '/statistics', icon: <FaChartBar className="me-2" /> },
          { label: 'Audit Logs', path: '/audit-logs', icon: <FaClipboardList className="me-2" /> },
        ];
      default:
        return commonItems;
    }
  };

  /**
   * Determine the page title based on the current URL path
   * Used for setting context-aware headings and titles
   * 
   * @returns The page title string
   */
  const getPageTitle = () => {
    if (location.pathname.includes('/profile')) return 'Profile';
    if (location.pathname.includes('/settings')) return 'Settings';
    if (location.pathname.includes('/appointments')) return 'Appointments';
    if (location.pathname.includes('/history')) return 'Medical History';
    if (location.pathname.includes('/patients')) return 'Patients';
    if (location.pathname.includes('/doctors')) return 'Doctors';
    if (location.pathname.includes('/users')) return 'Users';
    if (location.pathname.includes('/records')) return 'Patient Records';
    if (location.pathname.includes('/audit-logs')) return 'Audit Logs';
    if (location.pathname.includes('/statistics')) return 'Statistics Dashboard';
    return 'HealthBridge';
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Pre-header with contact information and social media links */}
      <div className="bg-primary text-white py-2">
        <Container>
          <div className="d-flex justify-content-between align-items-center flex-wrap">
            <div className="d-flex align-items-center">
              <FaPhone className="me-1" />
              <span className="me-3 small">(123) 456-7890</span>
              <FaEnvelope className="me-1" />
              <span className="small">info@healthbridge.com</span>
            </div>
            <div className="d-flex align-items-center">
              <div className="me-3">
                <Button 
                  variant="link" 
                  className="text-white p-0 border-0 theme-toggle-btn" 
                  onClick={toggleTheme}
                  title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                  style={{ boxShadow: 'none' }}
                >
                  {theme === 'dark' ? <FaSun /> : <FaMoon />}
                </Button>
              </div>
              <div className="d-flex">
                <a href="#" className="text-white me-2"><FaFacebookF /></a>
                <a href="#" className="text-white me-2"><FaTwitter /></a>
                <a href="#" className="text-white me-2"><FaInstagram /></a>
                <a href="#" className="text-white"><FaLinkedinIn /></a>
              </div>
            </div>
          </div>
        </Container>
      </div>

      {/* Main navigation bar */}
      <Navbar bg="white" expand="lg" className="shadow-sm py-3 sticky-top">
        <Container>
          {/* Brand logo and name */}
          <Navbar.Brand as={Link} to="/" className="ms-0">
            <div className="d-flex align-items-center">
              <img
                src={healthBridgeLogo}
                alt="HealthBridge Logo"
                height={user?.role === UserRole.ADMIN ? "40" : "60"}
                className="d-inline-block me-2"
                onError={(e) => {
                  e.currentTarget.src = 'https://placehold.co/60x60/0284c7/white?text=HB';
                }}
              />
              <span className={`brand-text ${user?.role === UserRole.ADMIN ? "fs-4" : "fs-3"}`}>
                HealthBridge{user?.role === UserRole.ADMIN ? " Admin" : ""}
              </span>
            </div>
          </Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            {/* Main navigation links */}
            <Nav className={user?.role === UserRole.ADMIN ? "mx-auto" : "ms-3 me-auto"}>
              {/* Show these links only for non-admin users or when not logged in */}
              {(!user || user.role !== UserRole.ADMIN) && (
                <>
                  <NavLinkRouter to="/about" className="mx-2">About</NavLinkRouter>
                  <NavLinkRouter to="/services" className="mx-2">Services</NavLinkRouter>
                  <NavLinkRouter to="/doctors" className="mx-2">Doctors</NavLinkRouter>
                  <NavLinkRouter to="/contact" className="mx-2">Contact</NavLinkRouter>
                </>
              )}

              {/* Admin Navigation - Grouped into dropdowns */}
              {user?.role === UserRole.ADMIN && (
                <div className="d-flex justify-content-center align-items-center w-100">
                  {/* Dashboard */}
                  <Dropdown as={Nav.Item} className="mx-2">
                    <Dropdown.Toggle as={Nav.Link} className="bg-transparent border-0 p-0 d-flex align-items-center">
                      <FaTachometerAlt className="me-2" />
                      <span className="d-none d-lg-inline">Dashboard</span>
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item as={Link} to="/">Admin Dashboard</Dropdown.Item>
                      <Dropdown.Item as={Link} to="/profile">Profile</Dropdown.Item>
                      <Dropdown.Item as={Link} to="/settings">Settings</Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                  
                  {/* User Management Dropdown */}
                  <Dropdown as={Nav.Item} className="mx-2">
                    <Dropdown.Toggle as={Nav.Link} className="bg-transparent border-0 p-0 d-flex align-items-center">
                      <FaUsers className="me-2" />
                      <span className="d-none d-lg-inline">Users</span>
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item as={Link} to="/users">All Users</Dropdown.Item>
                      <Dropdown.Item as={Link} to="/doctors">Doctors</Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                  
                  {/* Appointments Dropdown */}
                  <Dropdown as={Nav.Item} className="mx-2">
                    <Dropdown.Toggle as={Nav.Link} className="bg-transparent border-0 p-0 d-flex align-items-center">
                      <FaCalendarAlt className="me-2" />
                      <span className="d-none d-lg-inline">Appointments</span>
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item as={Link} to="/appointments">Appointments</Dropdown.Item>
                      <Dropdown.Item as={Link} to="/availability-management">Doctor Availability</Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                  
                  {/* Medical Records Dropdown */}
                  <Dropdown as={Nav.Item} className="mx-2">
                    <Dropdown.Toggle as={Nav.Link} className="bg-transparent border-0 p-0 d-flex align-items-center">
                      <FaClipboardList className="me-2" />
                      <span className="d-none d-lg-inline">Medical Data</span>
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item as={Link} to="/history">Medical Records</Dropdown.Item>
                      <Dropdown.Item as={Link} to="/medications">Medications</Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                  
                  {/* Analytics Dropdown */}
                  <Dropdown as={Nav.Item} className="mx-2">
                    <Dropdown.Toggle as={Nav.Link} className="bg-transparent border-0 p-0 d-flex align-items-center">
                      <FaChartBar className="me-2" />
                      <span className="d-none d-lg-inline">Analytics</span>
                    </Dropdown.Toggle>
                    <Dropdown.Menu>
                      <Dropdown.Item as={Link} to="/statistics">Statistics</Dropdown.Item>
                      <Dropdown.Item as={Link} to="/audit-logs">Audit Logs</Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                </div>
              )}

              {/* Dynamic navigation items for non-admin users */}
              {user && user.role !== UserRole.ADMIN && getAuthenticatedNavItems().map((item, index) => (
                <NavLinkRouter key={index} to={item.path} className="mx-2">
                  <span className="d-none d-lg-inline">{item.label}</span>
                </NavLinkRouter>
              ))}
            </Nav>

            {/* User profile section - shows login/register buttons or user dropdown */}
            <Nav>
              {user ? (
                // User dropdown menu when authenticated
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

                  {/* User dropdown menu items */}
                  <Dropdown.Menu>
                    <Dropdown.Item as={Link} to="/profile">
                      <FaUser className="me-2" /> Profile
                    </Dropdown.Item>
                    <Dropdown.Item as={Link} to="/settings">
                      <FaCog className="me-2" /> Settings
                    </Dropdown.Item>
                    {/* Admin-specific menu items */}
                    {user?.role === UserRole.ADMIN && (
                      <>
                        <Dropdown.Item as={Link} to="/users">
                          <FaUsers className="me-2" /> User Management
                        </Dropdown.Item>
                        <Dropdown.Item as={Link} to="/statistics">
                          <FaChartLine className="me-2" /> Statistics
                        </Dropdown.Item>
                        <Dropdown.Item as={Link} to="/availability-management">
                          <FaCalendarAlt className="me-2" /> Doctor Availability
                        </Dropdown.Item>
                        <Dropdown.Item as={Link} to="/audit-logs">
                          <FaFileAlt className="me-2" /> Audit Logs
                        </Dropdown.Item>
                      </>
                    )}
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={handleLogout}>
                      <FaSignOutAlt className="me-2" /> Log Out
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              ) : (
                // Login and register buttons for unauthenticated users
                <div className="d-flex align-items-center">
                  <LinkButton to="/login" variant="outline-primary" size="sm" className="me-2 rounded-pill">
                    Log In
                  </LinkButton>
                  <LinkButton to="/register" variant="primary" size="sm" className="rounded-pill high-contrast">
                    Register
                  </LinkButton>
                </div>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Main content area */}
      <main className="flex-grow-1 py-4">
        {children}
      </main>

      {/* Footer section */}
      <footer className={`${styles.bgGradientPrimary} bg-gradient-primary text-light py-3 mt-auto`}>
        <Container fluid="lg">
          <Row className="gy-3 py-2">
            {/* Company info and description */}
            <Col lg={3} md={6} sm={6} className="mb-2 mb-md-0">
              <div className="d-flex align-items-center mb-2">
                <img src={healthBridgeLogo} alt="HealthBridge" height="30" className="me-2" style={{ filter: 'brightness(0) invert(1)' }} />
                <h6 className="mb-0 fw-bold">HealthBridge</h6>
              </div>
              <p className="mb-2 small opacity-75">
                Providing high-quality healthcare services to our community.
              </p>
              <div className="d-flex gap-2">
                <a href="#" className={`btn btn-sm rounded-circle p-1 ${styles.socialIcon} social-icon`} aria-label="Facebook">
                  <FaFacebookF size={14} />
                </a>
                <a href="#" className={`btn btn-sm rounded-circle p-1 ${styles.socialIcon} social-icon`} aria-label="Twitter">
                  <FaTwitter size={14} />
                </a>
                <a href="#" className={`btn btn-sm rounded-circle p-1 ${styles.socialIcon} social-icon`} aria-label="Instagram">
                  <FaInstagram size={14} />
                </a>
                <a href="#" className={`btn btn-sm rounded-circle p-1 ${styles.socialIcon} social-icon`} aria-label="LinkedIn">
                  <FaLinkedinIn size={14} />
                </a>
              </div>
            </Col>

            {/* Sitemap Section */}
            <Col lg={3} md={6} sm={6} className="mb-2 mb-md-0">
              <h6 className="mb-2 fw-bold">Quick Links</h6>
              <div className="d-flex flex-column">
                <Link to="/" className={`text-light text-decoration-none small ${styles.footerLink} footer-link`}>
                  Home
                </Link>
                {(!user || user.role !== UserRole.ADMIN) && (
                  <>
                    <Link to="/about" className={`text-light text-decoration-none small ${styles.footerLink} footer-link`}>
                      About Us
                    </Link>
                    <Link to="/services" className={`text-light text-decoration-none small ${styles.footerLink} footer-link`}>
                      Services
                    </Link>
                    <Link to="/doctors" className={`text-light text-decoration-none small ${styles.footerLink} footer-link`}>
                      Our Doctors
                    </Link>
                    <Link to="/contact" className={`text-light text-decoration-none small ${styles.footerLink} footer-link`}>
                      Contact
                    </Link>
                  </>
                )}
              </div>
            </Col>

            {/* Contact information */}
            <Col lg={3} md={6} sm={6} className="mb-2 mb-md-0">
              <h6 className="mb-2 fw-bold">Contact Us</h6>
              <ul className="list-unstyled mb-0 small">
                <li className="d-flex align-items-center mb-2">
                  <FaMapMarkerAlt className="me-2" />
                  <div>123 Healthcare St, Medical City, MC 12345</div>
                </li>
                <li className="d-flex align-items-center mb-2">
                  <FaPhone className="me-2" />
                  <div>(123) 456-7890</div>
                </li>
                <li className="d-flex align-items-center">
                  <FaEnvelope className="me-2" />
                  <div>info@healthbridge.com</div>
                </li>
              </ul>
            </Col>

            {/* Newsletter signup */}
            <Col lg={3} md={6} sm={6}>
              <h6 className="mb-2 fw-bold">Stay Updated</h6>
              <p className="opacity-75 mb-2 small">Subscribe for health tips and updates.</p>
              <form className="mb-2">
                <div className="input-group input-group-sm">
                  <input
                    type="email"
                    className={`form-control ${styles.newsletterInput} newsletter-input`}
                    placeholder="Your email"
                    aria-label="Your email"
                  />
                  <button className={`btn ${styles.footerButton} footer-button`} type="submit">
                    Subscribe
                  </button>
                </div>
              </form>
            </Col>
          </Row>

          <hr className="my-2 opacity-25" />

          {/* Bottom footer with copyright and additional links */}
          <Row className="align-items-center py-2">
            <Col md={6} className="text-center text-md-start">
              <p className="mb-md-0 opacity-75 small">&copy; {new Date().getFullYear()} HealthBridge. All rights reserved.</p>
            </Col>
            <Col md={6}>
              <ul className="list-inline mb-0 text-center text-md-end">
                <li className="list-inline-item me-2">
                  <Link to="/terms" className={`text-light text-decoration-none small ${styles.hoverOpacity}`}>Terms</Link>
                </li>
                <li className="list-inline-item me-2">
                  <Link to="/privacy" className={`text-light text-decoration-none small ${styles.hoverOpacity}`}>Privacy</Link>
                </li>
                <li className="list-inline-item">
                  <Link to="/sitemap" className={`text-light text-decoration-none small ${styles.hoverOpacity}`}>Sitemap</Link>
                </li>
              </ul>
            </Col>
          </Row>
        </Container>
      </footer>

      {/* Chat Button */}
      <ChatButton />
    </div>
  );
};

export default MainLayout; 