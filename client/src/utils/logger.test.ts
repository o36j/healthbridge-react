/**
 * Client Logger Test Script
 * 
 * Simple script to verify that the client-side logging system works correctly.
 * You can copy and paste this code into your browser console to test it.
 */

import createLogger from './logger';

// Create loggers for different components
const authLogger = createLogger('Auth');
const apiLogger = createLogger('API');
const uiLogger = createLogger('UI');

// Test all log levels
console.log('\n===== CLIENT LOGGER TEST =====\n');

// Auth logger tests
authLogger.debug('User session check', { source: 'sessionStorage' });
authLogger.info('User logged in', { email: 'patient@example.com', role: 'patient' });
authLogger.warn('Session expiring soon', { timeLeft: '5 minutes' });
authLogger.error('Login failed', { reason: 'Invalid credentials' });

// API logger tests
apiLogger.debug('Preparing API request');
apiLogger.apiRequest('GET', '/api/appointments');
apiLogger.apiResponse(200, '/api/appointments');
apiLogger.apiError(404, '/api/users/999', { message: 'User not found' });

// UI logger tests
uiLogger.debug('Component mounted', { component: 'AppointmentList' });
uiLogger.info('Form submitted', { formData: { appointmentDate: '2023-05-15' } });
uiLogger.warn('Form validation warning', { field: 'email', value: 'invalid-email' });
uiLogger.error('Rendering error', new Error('Cannot read property of undefined'));

console.log('\n===== TEST COMPLETE =====\n'); 