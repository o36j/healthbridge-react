/**
 * Private Route Component
 * 
 * This component implements route protection and role-based access control.
 * It wraps protected routes and:
 * 1. Redirects unauthenticated users to the login page
 * 2. Restricts access based on user roles
 * 3. Handles loading states during authentication checks
 * 4. Provides error handling for authentication issues
 * 
 * Used with React Router's nested routes to protect sections of the application.
 */

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, UserRole } from '../contexts/AuthContext';
import LoadingSpinner from './ui/LoadingSpinner';
import ErrorBoundary from './common/ErrorBoundary';

/**
 * Props for the PrivateRoute component
 */
interface PrivateRouteProps {
  allowedRoles?: UserRole[];  // Optional array of roles that can access this route
  redirectPath?: string;      // Where to redirect unauthorized users (defaults to login)
}

/**
 * PrivateRoute Component
 * 
 * Implements authentication and authorization protection for routes.
 * Uses the AuthContext to check user authentication status and role.
 * 
 * @param allowedRoles - Optional array of roles allowed to access the route
 * @param redirectPath - Where to redirect unauthorized users, defaults to '/login'
 * @returns The protected route content or a redirect
 */
const PrivateRoute = ({ allowedRoles, redirectPath = '/login' }: PrivateRouteProps) => {
  const { user, loading, error } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return <LoadingSpinner />;
  }

  // Handle authentication errors
  if (error) {
    return (
      <div className="alert alert-danger">
        Authentication error: {error.message}
      </div>
    );
  }

  // If user is not authenticated, redirect to login with return path
  if (!user) {
    // Pass the current location to redirect back after login
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  // If roles are specified, check if user has required role
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to home page if user doesn't have required role
    return <Navigate to="/" replace />;
  }

  // If user is authenticated and has required role, render the protected route
  return (
    <ErrorBoundary>
      <Outlet />
    </ErrorBoundary>
  );
};

export default PrivateRoute;