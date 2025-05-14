import React, { useState, useRef, useEffect } from 'react';
import { Card, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { BsSend, BsX, BsExclamationTriangle } from 'react-icons/bs';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

// Configure server API URL
const API_BASE_URL = 'http://localhost:5000'; // Server address

interface ChatWindowProps {
  onClose: () => void;
}

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: 'Hello! I\'m your HealthBridge Assistant. I can help you schedule appointments, learn about our services, or answer questions about our healthcare platform. How can I assist you today?',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [apiHealth, setApiHealth] = useState<'unknown' | 'ok' | 'error'>('unknown');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Check API health on load
  useEffect(() => {
    const checkApiHealth = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/chatbot/health`);
        if (response.data.hasApiKey) {
          setApiHealth('ok');
        } else {
          setApiHealth('error');
          setErrorMessage('The AI assistant is not properly configured');
        }
      } catch (error) {
        setApiHealth('error');
        console.error('API health check failed:', error);
      }
    };
    
    checkApiHealth();
  }, []);
  
  // Scroll to bottom of messages when new messages are added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Fallback responses in case the API call fails
  const fallbackResponses = [
    "I can help you schedule an appointment with a doctor through our easy-to-use booking system.",
    "HealthBridge makes it simple to view your medical history and upcoming appointments in one place.",
    "Our platform connects you with healthcare professionals across various specialties including general medicine, cardiology, pediatrics, and more.",
    "Would you like me to help you find a healthcare professional who meets your needs?",
    "HealthBridge is designed to make healthcare more accessible and convenient for you.",
    "I'm here to assist with any questions about our healthcare platform and services."
  ];
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newMessage.trim() === '') return;
    
    // Add user message
    const userMessage: Message = {
      id: messages.length + 1,
      text: newMessage,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setNewMessage('');
    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      // Filter out the initial greeting to keep chat history focused
      const chatHistory = messages.length > 1 
        ? messages.map(msg => ({ text: msg.text, sender: msg.sender }))
        : [];
      
      // Select the appropriate endpoint based on authentication status
      const endpoint = user 
        ? `${API_BASE_URL}/api/chatbot/generate`       // For authenticated users
        : `${API_BASE_URL}/api/chatbot/public/generate`; // For public users
      
      console.log(`Calling ${endpoint} with ${chatHistory.length} history items`);
      
      // Call the API to get a response from Gemini
      const response = await axios.post(endpoint, {
        message: newMessage,
        chat_history: chatHistory
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true,
        timeout: 15000 // 15 second timeout
      });
      
      // Check if we got a valid response
      if (response.data && response.data.response) {
        const botMessage: Message = {
          id: messages.length + 2,
          text: response.data.response,
          sender: 'bot',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, botMessage]);
      } else {
        throw new Error('Invalid response format from server');
      }
    } catch (error: any) {
      console.error('Error getting AI response:', error);
      
      // Get more detailed error information
      const errorDetails = error.response?.data?.details || error.message || 'Unknown error';
      setErrorMessage(`Sorry, I couldn't connect to my AI brain. Error: ${errorDetails}`);
      
      // Use fallback response if API call fails
      const fallbackMessage: Message = {
        id: messages.length + 2,
        text: fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)],
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card 
      className="position-absolute shadow"
      style={{ 
        width: '360px', 
        height: '500px',
        bottom: '70px', 
        right: '0',
        borderRadius: '0.75rem',
        zIndex: 1051
      }}
    >
      {/* Header */}
      <Card.Header className="d-flex justify-content-between align-items-center bg-primary text-white" style={{ height: '60px' }}>
        <div className="fw-bold d-flex align-items-center">
          HealthBridge Assistant
          {apiHealth === 'error' && (
            <span className="ms-2 text-warning" title="AI connection issues detected">
              <BsExclamationTriangle />
            </span>
          )}
        </div>
        <Button 
          variant="link" 
          className="text-white p-0" 
          onClick={onClose}
          aria-label="Close chat"
        >
          <BsX size={24} />
        </Button>
      </Card.Header>
      
      {/* Messages Area */}
      <Card.Body className="p-3 overflow-auto d-flex flex-column" style={{ height: 'calc(500px - 120px)' }}>
        {apiHealth === 'error' && (
          <Alert variant="warning" className="mb-3 py-2 px-3 small">
            <BsExclamationTriangle className="me-2" />
            AI assistant may have connection issues. Responses might be limited.
          </Alert>
        )}
        
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`mb-3 ${message.sender === 'user' ? 'align-self-end' : 'align-self-start'}`}
          >
            <div 
              className={`p-3 rounded-3 ${
                message.sender === 'user' 
                  ? 'bg-primary text-white' 
                  : 'bg-light'
              }`}
              style={{ maxWidth: '80%' }}
            >
              {message.text}
            </div>
            <div 
              className={`text-muted small mt-1 ${
                message.sender === 'user' ? 'text-end' : ''
              }`}
            >
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="align-self-start mb-3">
            <div className="p-3 rounded-3 bg-light d-flex align-items-center">
              <Spinner animation="border" size="sm" role="status" className="me-2" />
              <span>Thinking...</span>
            </div>
          </div>
        )}
        {errorMessage && (
          <div className="align-self-center mb-3 text-center">
            <div className="p-2 rounded-3 bg-light-subtle text-muted small">
              {errorMessage}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </Card.Body>
      
      {/* Input Area */}
      <Card.Footer className="bg-white p-2" style={{ height: '60px' }}>
        <Form onSubmit={handleSubmit} className="d-flex">
          <Form.Control
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="me-2 border-0 bg-light"
            style={{ borderRadius: '1.5rem' }}
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            variant="primary" 
            className="rounded-circle d-flex align-items-center justify-content-center"
            style={{ width: '40px', height: '40px' }}
            disabled={newMessage.trim() === '' || isLoading}
            aria-label="Send message"
          >
            {isLoading ? <Spinner animation="border" size="sm" /> : <BsSend />}
          </Button>
        </Form>
      </Card.Footer>
    </Card>
  );
};

export default ChatWindow; 