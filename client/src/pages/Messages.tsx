import { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Form, Button, ListGroup, Badge, Alert, Spinner } from 'react-bootstrap';
import { FaUser, FaPaperPlane, FaPaperclip, FaTimes, FaDownload } from 'react-icons/fa';
import { useAuth, UserRole } from '../contexts/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { format, formatDistanceToNow } from 'date-fns';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  profilePhoto?: string;
  role: string;
}

interface Message {
  _id: string;
  sender: User;
  recipient: User;
  content: string;
  status: string;
  attachments?: string[];
  createdAt: string;
}

interface Conversation {
  _id: string;
  userDetails: {
    _id: string;
    firstName: string;
    lastName: string;
    profilePhoto?: string;
    role: string;
  };
  lastMessage: {
    content: string;
    createdAt: string;
  };
  unreadCount: number;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Messages = () => {
  const { user } = useAuth();
  const { userId } = useParams<{ userId?: string }>();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messageText, setMessageText] = useState('');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  // Fetch conversations when component mounts
  useEffect(() => {
    fetchConversations();
  }, [user]);
  
  // Fetch specific conversation if userId is provided
  useEffect(() => {
    if (userId) {
      fetchUserDetails(userId);
      fetchMessages(userId);
    }
  }, [userId]);
  
  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const fetchConversations = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/messages/conversations`);
      setConversations(response.data.conversations);
      
      // If no user selected but conversations exist, select the first one
      if (!userId && !selectedUser && response.data.conversations.length > 0) {
        const firstConversation = response.data.conversations[0];
        setSelectedUser(firstConversation.userDetails);
        fetchMessages(firstConversation._id);
        navigate(`/messages/${firstConversation._id}`);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchUserDetails = async (userId: string) => {
    try {
      const response = await axios.get(`${API_URL}/users/${userId}`);
      setSelectedUser(response.data.user);
    } catch (err) {
      console.error('Error fetching user details:', err);
      setError('Failed to load user details');
    }
  };
  
  const fetchMessages = async (userId: string) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/messages/conversation/${userId}`);
      setMessages(response.data.messages);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };
  
  const handleSelectUser = (conversation: Conversation) => {
    setSelectedUser(conversation.userDetails);
    setError('');
    navigate(`/messages/${conversation._id}`);
    fetchMessages(conversation._id);
  };
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageText.trim() && attachments.length === 0) {
      return;
    }
    
    if (!selectedUser) {
      setError('No recipient selected');
      return;
    }
    
    try {
      setSending(true);
      
      const formData = new FormData();
      formData.append('recipientId', selectedUser._id);
      formData.append('content', messageText);
      
      attachments.forEach(file => {
        formData.append('attachments', file);
      });
      
      const response = await axios.post(`${API_URL}/messages`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // Add the new message to the messages list
      setMessages(prev => [...prev, response.data.data]);
      
      // Clear form
      setMessageText('');
      setAttachments([]);
      
      // Refresh conversations to update latest message
      fetchConversations();
    } catch (err) {
      console.error('Error sending message:', err);
      if (axios.isAxiosError(err) && err.response) {
        setError(err.response.data.message || 'Failed to send message');
      } else {
        setError('Failed to send message');
      }
    } finally {
      setSending(false);
    }
  };
  
  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      
      // Check file size (max 5MB per file)
      const oversizedFiles = newFiles.filter(file => file.size > 5 * 1024 * 1024);
      if (oversizedFiles.length > 0) {
        setError(`Files must be under 5MB: ${oversizedFiles.map(f => f.name).join(', ')}`);
        return;
      }
      
      // Limit to 5 attachments
      if (attachments.length + newFiles.length > 5) {
        setError('Maximum 5 attachments allowed');
        return;
      }
      
      setAttachments(prev => [...prev, ...newFiles]);
      e.target.value = ''; // Reset input
    }
  };
  
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };
  
  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    
    // Check if message is from today
    if (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    ) {
      return format(date, 'h:mm a'); // Display only time for today's messages
    }
    
    // Within last 7 days
    const diffInDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffInDays < 7) {
      return format(date, 'EEEE h:mm a'); // Display day name and time
    }
    
    // Older messages
    return format(date, 'MMM d, yyyy h:mm a'); // Full date and time
  };
  
  const getFileIcon = (filename: string) => {
    const extension = filename.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'xls':
      case 'xlsx':
        return '📊';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return '🖼️';
      default:
        return '📎';
    }
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  return (
    <Container className="py-5">
      <h1 className="mb-4">Messages</h1>
      
      {error && <Alert variant="danger">{error}</Alert>}
      
      <Row>
        {/* Conversations sidebar */}
        <Col md={4} lg={3} className="mb-4">
          <Card className="shadow-sm">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">Conversations</h5>
            </Card.Header>
            <ListGroup variant="flush">
              {loading && conversations.length === 0 ? (
                <div className="text-center p-4">
                  <Spinner animation="border" variant="primary" />
                </div>
              ) : conversations.length === 0 ? (
                <ListGroup.Item className="text-center text-muted py-4">
                  No conversations yet
                </ListGroup.Item>
              ) : (
                conversations.map(conversation => (
                  <ListGroup.Item
                    key={conversation._id}
                    action
                    active={selectedUser?._id === conversation._id}
                    onClick={() => handleSelectUser(conversation)}
                    className="d-flex align-items-center py-3"
                  >
                    <div className="flex-shrink-0">
                      {conversation.userDetails.profilePhoto ? (
                        <img
                          src={`${API_URL}${conversation.userDetails.profilePhoto}`}
                          alt={`${conversation.userDetails.firstName} ${conversation.userDetails.lastName}`}
                          className="rounded-circle"
                          width="40"
                          height="40"
                        />
                      ) : (
                        <div className="bg-light rounded-circle d-flex align-items-center justify-content-center" style={{ width: 40, height: 40 }}>
                          <FaUser />
                        </div>
                      )}
                    </div>
                    <div className="ms-3 flex-grow-1">
                      <div className="d-flex justify-content-between align-items-center">
                        <h6 className="mb-0">
                          {conversation.userDetails.firstName} {conversation.userDetails.lastName}
                        </h6>
                        {conversation.unreadCount > 0 && (
                          <Badge bg="danger" pill>{conversation.unreadCount}</Badge>
                        )}
                      </div>
                      <small className="text-muted">
                        {conversation.lastMessage.content.length > 30
                          ? conversation.lastMessage.content.substring(0, 30) + '...'
                          : conversation.lastMessage.content}
                      </small>
                      <div>
                        <small className="text-muted">
                          {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), { addSuffix: true })}
                        </small>
                      </div>
                    </div>
                  </ListGroup.Item>
                ))
              )}
            </ListGroup>
          </Card>
        </Col>
        
        {/* Messages area */}
        <Col md={8} lg={9}>
          <Card className="shadow-sm h-100 d-flex flex-column">
            {selectedUser ? (
              <>
                <Card.Header className="bg-light">
                  <div className="d-flex align-items-center">
                    {selectedUser.profilePhoto ? (
                      <img
                        src={`${API_URL}${selectedUser.profilePhoto}`}
                        alt={`${selectedUser.firstName} ${selectedUser.lastName}`}
                        className="rounded-circle me-2"
                        width="40"
                        height="40"
                      />
                    ) : (
                      <div className="bg-light rounded-circle d-flex align-items-center justify-content-center me-2" style={{ width: 40, height: 40 }}>
                        <FaUser />
                      </div>
                    )}
                    <div>
                      <h5 className="mb-0">{selectedUser.firstName} {selectedUser.lastName}</h5>
                      <small className="text-muted">{
                        selectedUser.role === UserRole.DOCTOR ? 'Doctor' : 
                        selectedUser.role === UserRole.PATIENT ? 'Patient' : 
                        selectedUser.role === UserRole.NURSE ? 'Nurse' : 
                        selectedUser.role === UserRole.ADMIN ? 'Admin' : 
                        'User'
                      }</small>
                    </div>
                  </div>
                </Card.Header>
                
                <div className="flex-grow-1 overflow-auto" style={{ maxHeight: '500px', minHeight: '400px' }}>
                  {loading ? (
                    <div className="d-flex justify-content-center align-items-center h-100">
                      <Spinner animation="border" variant="primary" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-muted d-flex align-items-center justify-content-center h-100">
                      <div>
                        <FaEnvelope className="mb-3" size={30} />
                        <p>No messages yet. Start the conversation!</p>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3">
                      {messages.map((message, index) => {
                        const isCurrentUser = message.sender._id === user?.id;
                        
                        return (
                          <div 
                            key={message._id}
                            className={`d-flex mb-3 ${isCurrentUser ? 'justify-content-end' : 'justify-content-start'}`}
                          >
                            <div 
                              className={`message-bubble p-3 rounded ${isCurrentUser ? 'bg-primary text-white' : 'bg-light'}`}
                              style={{ maxWidth: '80%' }}
                            >
                              <div className="message-content mb-1">
                                {message.content}
                              </div>
                              
                              {message.attachments && message.attachments.length > 0 && (
                                <div className="attachments mt-2">
                                  {message.attachments.map((attachment, i) => {
                                    const filename = attachment.split('/').pop() || 'file';
                                    
                                    return (
                                      <div 
                                        key={i} 
                                        className={`d-flex align-items-center rounded mb-1 py-1 px-2 ${isCurrentUser ? 'bg-primary-dark' : 'bg-light-dark'}`}
                                        style={{ fontSize: '0.9rem' }}
                                      >
                                        <span className="me-2">{getFileIcon(filename)}</span>
                                        <span className="text-truncate">{filename}</span>
                                        <a 
                                          href={`${API_URL}${attachment}`} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                          className={`ms-2 ${isCurrentUser ? 'text-white' : 'text-primary'}`}
                                          download
                                        >
                                          <FaDownload />
                                        </a>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                              
                              <div className={`message-time text-end ${isCurrentUser ? 'text-white-50' : 'text-muted'}`} style={{ fontSize: '0.75rem' }}>
                                {formatMessageTime(message.createdAt)}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>
                
                <Card.Footer className="bg-white">
                  <Form onSubmit={handleSendMessage}>
                    {attachments.length > 0 && (
                      <div className="selected-files mb-2">
                        {attachments.map((file, index) => (
                          <Badge
                            key={index}
                            bg="light"
                            text="dark"
                            className="me-2 mb-2 p-2 d-inline-flex align-items-center"
                          >
                            <span className="me-1">{getFileIcon(file.name)}</span>
                            <span className="text-truncate" style={{ maxWidth: '150px' }}>
                              {file.name}
                            </span>
                            <span className="ms-1 text-muted">({formatFileSize(file.size)})</span>
                            <Button
                              variant="link"
                              size="sm"
                              className="p-0 ms-2"
                              onClick={() => removeAttachment(index)}
                            >
                              <FaTimes />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <div className="d-flex">
                      <Form.Group className="flex-grow-1 me-2">
                        <Form.Control
                          as="textarea"
                          placeholder="Type your message..."
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          rows={1}
                          disabled={sending}
                        />
                      </Form.Group>
                      
                      <div className="d-flex">
                        <div className="me-2">
                          <input
                            type="file"
                            id="attachmentInput"
                            className="d-none"
                            multiple
                            onChange={handleAttachmentChange}
                            disabled={sending}
                            aria-label="Upload attachments"
                          />
                          <Button
                            variant="outline-secondary"
                            onClick={() => document.getElementById('attachmentInput')?.click()}
                            disabled={sending || attachments.length >= 5}
                            title="Attach files"
                          >
                            <FaPaperclip />
                          </Button>
                        </div>
                        
                        <Button
                          type="submit"
                          variant="primary"
                          disabled={(!messageText.trim() && attachments.length === 0) || sending}
                        >
                          {sending ? (
                            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                          ) : (
                            <FaPaperPlane />
                          )}
                        </Button>
                      </div>
                    </div>
                  </Form>
                </Card.Footer>
              </>
            ) : (
              <div className="d-flex flex-column align-items-center justify-content-center h-100 p-5 text-center text-muted">
                <FaEnvelope size={50} className="mb-3" />
                <h5>Select a conversation</h5>
                <p>Choose a patient or doctor from the list to view your conversation.</p>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Messages; 