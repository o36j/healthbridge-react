/**
 * Authentication Context
 * 
 * This module provides authentication functionality for the HealthBridge application,
 * managing user authentication state, login/logout operations, and user profile data.
 * 
 * It serves as a central point for:
 * - Managing user authentication state
 * - API communication for auth operations
 * - User session persistence
 * - Role-based access control
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axios from 'axios';
import createLogger from '../utils/logger';

const logger = createLogger('Auth');

// API configuration
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const SERVER_URL = API_URL.replace('/api', '');

// Configure axios defaults for cross-domain requests with credentials
axios.defaults.withCredentials = true;
axios.defaults.headers.common['Accept'] = 'application/json';
axios.defaults.xsrfCookieName = 'XSRF-TOKEN';
axios.defaults.xsrfHeaderName = 'X-XSRF-TOKEN';

/**
 * Axios request interceptor for logging and debugging API requests
 */
axios.interceptors.request.use(
  (config) => {
    logger.debug(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    logger.error('Request error', error);
    return Promise.reject(error);
  }
);

/**
 * Axios response interceptor for logging and debugging API responses
 */
axios.interceptors.response.use(
  (response) => {
    logger.debug(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    logger.error(`Response error: ${error.response?.status || 'Unknown'} ${error.config?.url}`, error.response?.data);
    return Promise.reject(error);
  }
);

/**
 * User roles enumeration - must match the roles defined in the backend
 */
export enum UserRole {
  PATIENT = 'patient',
  DOCTOR = 'doctor',
  NURSE = 'nurse',
  ADMIN = 'admin',
}

/**
 * Helper function to ensure profile photo URLs are complete absolute URLs
 * Converts relative URLs to absolute URLs using the server base URL
 */
const ensureCompletePhotoUrl = (photoUrl?: string): string | undefined => {
  if (!photoUrl) return undefined;
  return photoUrl.startsWith('http') ? photoUrl : `${SERVER_URL}${photoUrl}`;
};

/**
 * User interface representing authenticated user data
 */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  profilePhoto?: string;
  phone?: string;
  address?: string;
}

/**
 * Authentication context interface defining available methods and properties
 */
export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  updateUserContext: (updatedUser: User) => void;
}

/**
 * User registration data interface
 */
interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRole;
}

/**
 * Props for the Auth Provider component
 */
interface AuthProviderProps {
  children: ReactNode;
}

// Create the authentication context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Authentication Provider Component
 * 
 * Manages authentication state and provides auth-related methods
 * to all child components via React Context
 */
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Debug function to check authentication state and cookies
   * Used during development to troubleshoot auth issues
   */
  const debugAuthState = () => {
    logger.debug('Auth State Debug', {
      user: user,
      withCredentials: axios.defaults.withCredentials,
      cookies: document.cookie,
      hasTokenCookie: document.cookie.includes('token=')
    });
  };

  /**
   * Check if user is logged in on initial load by validating the token with the server
   */
  useEffect(() => {
    // Call debug function in development
    debugAuthState();
    
    const checkAuth = async () => {
      try {
        setLoading(true);
        logger.info('Checking authentication status');
        
        const response = await axios.get(`${API_URL}/auth/me`);
        
        if (response.data && response.data.user) {
          // Ensure profile photo URL is complete
          const userData = response.data.user;
          logger.info('User authenticated successfully', { email: userData.email, role: userData.role });
          
          if (userData.profilePhoto) {
            userData.profilePhoto = ensureCompletePhotoUrl(userData.profilePhoto);
          }
          setUser(userData);
        } else {
          logger.debug('No user data in response');
          setUser(null);
        }
      } catch (err) {
        logger.error('Authentication check failed', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    // Run the auth check
    checkAuth();
  }, []);

  /**
   * Register a new user
   * @param userData - Registration data including email, password, first name, last name, and role
   */
  const register = async (userData: RegisterData) => {
    try {
      setLoading(true);
      setError(null);
      
      logger.info('Registering new user', { email: userData.email, role: userData.role });
      
      const response = await axios.post(`${API_URL}/auth/register`, userData);
      
      // Ensure profile photo URL is complete
      const user = response.data.user;
      if (user.profilePhoto) {
        user.profilePhoto = ensureCompletePhotoUrl(user.profilePhoto);
      }
      
      setUser(user);
      logger.info('User registered successfully', { email: user.email, role: user.role });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Registration failed';
      logger.error(`Registration failed: ${errorMessage}`, err.response?.data);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Log in an existing user
   * @param email - User's email
   * @param password - User's password
   */
  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      logger.info('Attempting login', { email });
      
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      const userData = response.data.user;
      
      // Ensure profile photo URL is complete
      if (userData.profilePhoto) {
        userData.profilePhoto = ensureCompletePhotoUrl(userData.profilePhoto);
      }
      
      setUser(userData);
      logger.info('Login successful', { email: userData.email, role: userData.role });
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Login failed';
      logger.error(`Login failed: ${errorMessage}`, err.response?.data);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Log out the current user
   */
  const logout = async () => {
    try {
      setLoading(true);
      
      if (user) {
        logger.info('Logging out user', { email: user.email, role: user.role });
      }
      
      let apiError = null;
      
      try {
        const response = await axios.post(`${API_URL}/auth/logout`);
        logger.debug('Logout API response', response.data);
      } catch (err) {
        apiError = err;
        logger.warn('Logout API error', err);
      }
      
      // Clear local state regardless of API success
      setUser(null);
      
      // Clear stored data
      localStorage.removeItem('healthbridge-user');
      sessionStorage.removeItem('healthbridge-auth');
      
      logger.debug('Cookies after logout', document.cookie);
      
      // If there was an API error but we managed to clear local state, consider it successful
      logger.info('Logout successful');
      
    } catch (err) {
      logger.error('Logout error', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clear any authentication errors
   */
  const clearError = () => {
    setError(null);
  };

  /**
   * Update the user context with new user data (e.g., after profile updates)
   * @param updatedUser - The updated user data to set in context
   */
  const updateUserContext = (updatedUser: User) => {
    logger.debug('Updating user context', { 
      id: updatedUser.id,
      email: updatedUser.email,
      role: updatedUser.role
    });
    
    // Ensure profile photo URL is complete
    if (updatedUser.profilePhoto) {
      updatedUser.profilePhoto = ensureCompletePhotoUrl(updatedUser.profilePhoto);
    }
    
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        loading,
        error,
        clearError,
        updateUserContext,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to use the auth context
 * @returns The authentication context
 * @throws Error if used outside of an AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 