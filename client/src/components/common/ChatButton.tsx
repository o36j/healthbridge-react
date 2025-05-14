import React, { useState } from 'react';
import { Button } from 'react-bootstrap';
import { BsChatDots, BsX } from 'react-icons/bs';
import ChatWindow from './ChatWindow';
import { useAuth, UserRole } from '../../contexts/AuthContext';
import { useLocation } from 'react-router-dom';

const ChatButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();
  
  // Show chat button on more pages to make the AI assistant more accessible
  const shouldShowChat = () => {
    const path = location.pathname;
    
    // For public users (no user logged in)
    if (!user) {
      // Show on landing page and other public pages
      return path === '/' || 
             path.startsWith('/about') || 
             path.startsWith('/services') || 
             path.startsWith('/contact');
    }
    
    // For authenticated patients
    if (user && user.role === UserRole.PATIENT) {
      // Show on patient landing and patient-related pages
      return true; // Make available throughout the patient experience
    }
    
    // For authenticated doctors - let's help them too
    if (user && user.role === UserRole.DOCTOR) {
      return true;
    }
    
    // For other authenticated users like admins and nurses
    return false;
  };
  
  // If chat should not be shown, return null
  if (!shouldShowChat()) {
    return null;
  }
  
  return (
    <div className="position-fixed" style={{ right: '24px', bottom: '24px', zIndex: 1050 }}>
      {isOpen && (
        <ChatWindow onClose={() => setIsOpen(false)} />
      )}
      
      <Button 
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-circle shadow d-flex align-items-center justify-content-center"
        variant="primary"
        style={{ 
          width: '56px', 
          height: '56px', 
          fontSize: '1.5rem' 
        }}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? <BsX /> : <BsChatDots />}
      </Button>
    </div>
  );
};

export default ChatButton; 