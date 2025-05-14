/**
 * HealthBridge Client Application Entry Point
 * 
 * This file serves as the entry point for the React client application.
 * It sets up the root React component, wraps it with necessary providers,
 * and renders it to the DOM.
 */

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import 'bootstrap/dist/css/bootstrap.min.css' // Import Bootstrap CSS for styling
import { BrowserRouter } from 'react-router-dom' // For client-side routing
import { AuthProvider } from './contexts/AuthContext.tsx' // Authentication context provider
import { ThemeProvider } from './contexts/ThemeContext.tsx' // Theme context provider for dark mode

// Create and render the React application to the DOM
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode> {/* Enable additional checks and warnings during development */}
    <BrowserRouter> {/* Enable client-side routing */}
      <AuthProvider> {/* Provide authentication context to the entire app */}
        <ThemeProvider> {/* Provide theme context for dark mode */}
          <App /> {/* Main application component */}
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
