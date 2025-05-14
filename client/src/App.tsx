/**
 * Main Application Component
 * 
 * This component defines the routing structure of the application, managing:
 * - Public routes accessible to all users
 * - Protected routes requiring authentication
 * - Role-based access control for specific features
 * 
 * The application uses React Router for navigation and conditional rendering
 * based on user authentication status and role.
 */

import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { UserRole, useAuth } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import MainLayout from './components/layouts/MainLayout';
import DoctorLayout from './components/layouts/DoctorLayout';
import NurseLayout from './components/layouts/NurseLayout';

// Public pages - accessible to all users
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Landing from './pages/Landing';
import About from './pages/About';
import Services from './pages/Services';
import Contact from './pages/Contact';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Sitemap from './pages/Sitemap';

// Feature pages - require authentication with specific role permissions
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Appointments from './pages/Appointments';
import PatientHistory from './pages/PatientHistory';
import Patients from './pages/Patients';
import Users from './pages/Users';
import Doctors from './pages/Doctors';
import DoctorDetail from './pages/DoctorDetail';
import AuditLogs from './pages/AuditLogs';
import AdminStatistics from './pages/AdminStatistics';
import DoctorDashboard from './pages/DoctorDashboard';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';
import AdminAvailabilityManagement from './pages/AdminAvailabilityManagement';
import MedicationManagement from './pages/MedicationManagement';

// New Doctor Pages
import DoctorHome from './pages/DoctorHome';
import DoctorCalendar from './pages/DoctorCalendar';
import DoctorPrescriptions from './pages/DoctorPrescriptions';
import DoctorPatientRecord from './pages/DoctorPatientRecord';
import DoctorAppointments from './pages/DoctorAppointments';
import DoctorPatients from './pages/DoctorPatients';
import DoctorAppointmentDetail from './pages/DoctorAppointmentDetail';
import DoctorAppointmentReschedule from './pages/DoctorAppointmentReschedule';
import DoctorAppointmentNew from './pages/DoctorAppointmentNew';
import DoctorPrescriptionNew from './pages/DoctorPrescriptionNew';

// Nurse Pages
import NurseDashboard from './pages/NurseDashboard';
import NurseHome from './pages/NurseHome';
import NurseVitals from './pages/NurseVitals';
import NurseMedications from './pages/NurseMedications';
import NursePatientRecords from './pages/NursePatientRecords';

// New Telehealth Meeting Page
import TelehealthMeeting from './pages/TelehealthMeeting';
import TelehealthGuide from './pages/TelehealthGuide';

/**
 * App Component
 * 
 * Defines the application's route structure and access control rules
 * using React Router's declarative routing approach.
 */
function App() {
  const { user } = useAuth();
  const location = useLocation();

  // Redirect doctor to dashboard if they are trying to access public routes
  if (user?.role === UserRole.DOCTOR && location.pathname === '/') {
    return <Navigate to="/doctor" replace />;
  }
  
  // Redirect nurse to dashboard if they are trying to access public routes
  if (user?.role === UserRole.NURSE && location.pathname === '/') {
    return <Navigate to="/nurse" replace />;
  }
  
  return (
    <Routes>
      {/* Public routes wrapped in the MainLayout */}
      <Route element={<MainLayout><Outlet /></MainLayout>}>
        {/* Landing page and general information routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/about" element={<About />} />
        <Route path="/services" element={<Services />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/doctors" element={<Doctors />} />
        <Route path="/doctors/:id" element={<DoctorDetail />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/sitemap" element={<Sitemap />} />

        {/* Protected routes - require user authentication */}
        <Route element={<PrivateRoute />}>
          {/* Common routes for all authenticated users */}
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/:userId" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />

          {/* Role-specific feature routes */}

          {/* Appointments - accessible to patients, doctors, nurses, and admins */}
          <Route path="/appointments" element={
            <PrivateRoute allowedRoles={[UserRole.PATIENT, UserRole.DOCTOR, UserRole.NURSE, UserRole.ADMIN]} />
          }>
            <Route index element={<Appointments />} />
            <Route path="book" element={<Appointments />} />
          </Route>

          {/* Patient History - accessible to patients, doctors, nurses, and admins */}
          <Route path="/history" element={
            <PrivateRoute allowedRoles={[UserRole.PATIENT, UserRole.DOCTOR, UserRole.NURSE, UserRole.ADMIN]} />
          }>
            <Route index element={<PatientHistory />} />
          </Route>

          {/* Doctor Dashboard - accessible to doctors only */}
          <Route path="/doctor-dashboard" element={
            <PrivateRoute allowedRoles={[UserRole.DOCTOR]} />
          }>
            <Route index element={<DoctorDashboard />} />
          </Route>
          
          {/* Nurse Dashboard - accessible to nurses only */}
          <Route path="/nurse-dashboard" element={
            <PrivateRoute allowedRoles={[UserRole.NURSE]} />
          }>
            <Route index element={<NurseDashboard />} />
          </Route>

          {/* Patients Management - accessible to medical staff and admins */}
          <Route path="/patients" element={
            <PrivateRoute allowedRoles={[UserRole.DOCTOR, UserRole.NURSE]} />
          }>
            <Route index element={<Patients />} />
          </Route>

          {/* User Management - admin only */}
          <Route path="/users" element={
            <PrivateRoute allowedRoles={[UserRole.ADMIN]} />
          }>
            <Route index element={<Users />} />
          </Route>

          {/* Audit Logs - admin only */}
          <Route path="/audit-logs" element={
            <PrivateRoute allowedRoles={[UserRole.ADMIN]} />
          }>
            <Route index element={<AuditLogs />} />
          </Route>

          {/* Admin Statistics - admin only */}
          <Route path="/statistics" element={
            <PrivateRoute allowedRoles={[UserRole.ADMIN]} />
          }>
            <Route index element={<AdminStatistics />} />
          </Route>

          {/* Admin Doctor Availability Management - admin only */}
          <Route path="/availability-management" element={
            <PrivateRoute allowedRoles={[UserRole.ADMIN]} />
          }>
            <Route index element={<AdminAvailabilityManagement />} />
          </Route>

          {/* Medication Management - doctors and admins only */}
          <Route path="/medications" element={
            <PrivateRoute allowedRoles={[UserRole.DOCTOR, UserRole.ADMIN]} />
          }>
            <Route index element={<MedicationManagement />} />
          </Route>

          {/* Messages - accessible to all authenticated users */}
          <Route path="/messages" element={<PrivateRoute />}>
            <Route index element={<Messages />} />
            <Route path=":userId" element={<Messages />} />
          </Route>

          {/* Notifications - accessible to all authenticated users */}
          <Route path="/notifications" element={<PrivateRoute />}>
            <Route index element={<Notifications />} />
          </Route>

          {/* Telehealth Meeting - accessible to all authenticated users */}
          <Route path="/telehealth/meeting/:meetingId" element={<TelehealthMeeting />} />

          {/* Telehealth Guide - accessible to all authenticated users */}
          <Route path="/telehealth/guide" element={<TelehealthGuide />} />
        </Route>
      </Route>

      {/* Doctor routes with custom DoctorLayout */}
      <Route element={<PrivateRoute allowedRoles={[UserRole.DOCTOR]} />}>
        <Route element={<DoctorLayout><Outlet /></DoctorLayout>}>
          <Route path="/doctor" element={<DoctorHome />} />
          <Route path="/doctor/calendar" element={<DoctorCalendar />} />
          <Route path="/doctor/prescriptions" element={<DoctorPrescriptions />} />
          <Route path="/doctor/prescriptions/new/:appointmentId" element={<DoctorPrescriptionNew />} />
          <Route path="/doctor/patient-records/:patientId" element={<DoctorPatientRecord />} />
          <Route path="/doctor/medications" element={<MedicationManagement />} />
          <Route path="/doctor/appointments" element={<DoctorAppointments />} />
          <Route path="/doctor/appointments/new" element={<DoctorAppointmentNew />} />
          <Route path="/doctor/appointments/:id" element={<DoctorAppointmentDetail />} />
          <Route path="/doctor/appointments/:id/reschedule" element={<DoctorAppointmentReschedule />} />
          <Route path="/doctor/patients" element={<DoctorPatients />} />
          <Route path="/doctor/profile" element={<Profile />} />
          <Route path="/doctor/settings" element={<Settings />} />
        </Route>
      </Route>
      
      {/* Nurse routes with custom NurseLayout */}
      <Route element={<PrivateRoute allowedRoles={[UserRole.NURSE]} />}>
        <Route element={<NurseLayout><Outlet /></NurseLayout>}>
          <Route path="/nurse" element={<NurseHome />} />
          <Route path="/nurse/patients" element={<Patients />} />
          <Route path="/nurse/medical-records" element={<NursePatientRecords />} />
          <Route path="/nurse/appointments" element={<Appointments />} />
          <Route path="/nurse/vitals" element={<NurseVitals />} />
          <Route path="/nurse/vitals/record/:appointmentId" element={<NurseVitals />} />
          <Route path="/nurse/vitals/new" element={<NurseVitals />} />
          <Route path="/nurse/medications" element={<NurseMedications />} />
          <Route path="/nurse/profile" element={<Profile />} />
          <Route path="/nurse/settings" element={<Settings />} />
        </Route>
      </Route>

      {/* Fallback route - redirect undefined routes to home page */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
