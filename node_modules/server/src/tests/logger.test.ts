/**
 * Logger Test Script
 * 
 * Simple script to verify that our logging system works correctly.
 * Run with: npx ts-node src/tests/logger.test.ts
 */

import createLogger from '../utils/logger';

// Create loggers for different components
const authLogger = createLogger('Auth');
const apiLogger = createLogger('API');
const dbLogger = createLogger('Database');

// Test all log levels
console.log('\n===== LOGGER TEST =====\n');

// Auth logger tests
authLogger.debug('Checking authentication token', { user: 'test@example.com' });
authLogger.info('User authenticated successfully');
authLogger.warn('Invalid login attempt', { ip: '192.168.1.1' });
authLogger.error('Authentication failed', new Error('Invalid token'));

// API logger tests
apiLogger.debug('Processing API request', { method: 'GET', path: '/api/users' });
apiLogger.info('API request completed', { status: 200, duration: '120ms' });
apiLogger.warn('Rate limit approaching', { user: 'test@example.com', count: 98 });
apiLogger.error('API request failed', { status: 500, error: 'Database connection failed' });

// Database logger tests
dbLogger.debug('Executing query', { collection: 'users', filter: { active: true } });
dbLogger.info('Database connection established', { host: 'mongodb://localhost:27017' });
dbLogger.warn('Slow query detected', { duration: '2500ms', query: 'find users' });
dbLogger.error('Database query failed', new Error('Timeout'));

console.log('\n===== TEST COMPLETE =====\n'); 