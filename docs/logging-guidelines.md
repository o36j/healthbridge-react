# HealthBridge Logging Guidelines

This document outlines the logging approach implemented in the HealthBridge application to improve debugging and monitoring capabilities.

## Logging Utilities

We have implemented structured logging utilities for both server and client:

- **Server**: `server/src/utils/logger.ts`
- **Client**: `client/src/utils/logger.ts`

## Log Levels

The logging system supports four log levels:

1. **DEBUG**: Detailed information useful during development and debugging. Only appears in development mode.
2. **INFO**: Important application events and milestones under normal operation.
3. **WARN**: Potentially problematic situations that don't cause the application to fail.
4. **ERROR**: Error conditions that need attention, accompanied by error details.

## Usage Guidelines

### Creating a Logger

Create a logger instance at the top of your file:

```typescript
import createLogger from '../utils/logger';

const logger = createLogger('ComponentName');
```

### Using the Logger

```typescript
// Debug logs (development only)
logger.debug('Detailed information for debugging', { optionalData });

// Info logs
logger.info('Important event occurred', { optionalData });

// Warning logs
logger.warn('Something is not quite right', { optionalData });

// Error logs
logger.error('Something failed', error);
```

### API Logging

For client-side API interaction, use:

```typescript
// Logging API requests
logger.apiRequest('GET', '/api/endpoint');

// Logging API responses
logger.apiResponse(200, '/api/endpoint');

// Logging API errors
logger.apiError(500, '/api/endpoint', errorData);
```

## Best Practices

1. **Be Specific**: Include relevant context in log messages
2. **Structured Data**: Use the optional data parameter to include structured information
3. **Privacy**: Don't log sensitive data (passwords, tokens, etc.)
4. **Performance**: Use debug level for verbose logs that shouldn't appear in production
5. **Consistency**: Use the same logger format across similar components

## Common Logging Scenarios

### Authentication Events

```typescript
logger.info('User logged in', { userId, role });
logger.warn('Failed login attempt', { email, attempts });
```

### API Interactions

```typescript
logger.debug('Fetching data', { endpoint, params });
logger.error('API request failed', error);
```

### State Changes

```typescript
logger.debug('State updated', { prevState, newState });
```

### Error Handling

```typescript
try {
  // Operation
} catch (error) {
  logger.error('Operation failed', error);
}
```

## Production vs Development

- **Development**: All log levels are displayed, including DEBUG
- **Production**: Only INFO, WARN, and ERROR logs are displayed

## Formatting

- **Server**: `[timestamp] [LEVEL] [module] message`
- **Client**: `[LEVEL] [module] message` (with color)
