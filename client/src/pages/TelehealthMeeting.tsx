import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Alert, Spinner } from 'react-bootstrap';
import { FaVideo, FaMicrophone, FaMicrophoneSlash, FaVideoSlash, FaPhone, FaComment, FaUser } from 'react-icons/fa';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

interface Appointment {
  _id: string;
  patient: {
    _id: string;
    firstName: string;
    lastName: string;
    profilePhoto?: string;
  };
  doctor: {
    _id: string;
    firstName: string;
    lastName: string;
    department?: string;
    specialization?: string;
    profilePhoto?: string;
  };
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  isVirtual: boolean;
  meetingLink: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const TelehealthMeeting: React.FC = () => {
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  
  // Video call controls
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [showChat, setShowChat] = useState(false);
  
  // Video elements
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
  // Fetch appointment by meeting ID
  useEffect(() => {
    const fetchAppointmentByMeetingId = async () => {
      if (!meetingId || !user) return;
      
      try {
        setLoading(true);
        
        // In a real implementation, you would have an API endpoint to fetch appointment by meeting ID
        // For this example, we'll simulate it by fetching user's appointments and finding the matching one
        const response = await axios.get(`${API_URL}/appointments/user/${user.id}`);
        
        // Find the appointment with this meeting ID
        // Assuming meetingId format is "doctorId-appointmentId-timestamp" as generated in the server
        const appointmentId = meetingId.split('-')[1]; // Extract the appointment ID part
        
        const matchingAppointment = response.data.appointments.find(
          (appt: any) => appt._id.includes(appointmentId) && appt.isVirtual
        );
        
        if (!matchingAppointment) {
          setError('Cannot find a telehealth appointment with this meeting ID');
          setLoading(false);
          return;
        }
        
        setAppointment(matchingAppointment);
        
        // In a real implementation, you would initialize WebRTC here
        // For this demo, we'll just simulate a video stream with the user's camera
        initializeCamera();
        
      } catch (err) {
        console.error('Error fetching appointment:', err);
        setError('Failed to load telehealth meeting details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchAppointmentByMeetingId();
  }, [meetingId, user]);
  
  // Initialize the camera for local video preview
  const initializeCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // In a real implementation, this is where you would set up WebRTC
      // For demo purposes, we'll just display a placeholder in the remote video
      
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Failed to access camera and microphone. Please ensure you have granted permission.');
    }
  };
  
  // Toggle video
  const toggleVideo = () => {
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      const videoTracks = stream.getVideoTracks();
      
      videoTracks.forEach(track => {
        track.enabled = !videoEnabled;
      });
      
      setVideoEnabled(!videoEnabled);
    }
  };
  
  // Toggle audio
  const toggleAudio = () => {
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      const audioTracks = stream.getAudioTracks();
      
      audioTracks.forEach(track => {
        track.enabled = !audioEnabled;
      });
      
      setAudioEnabled(!audioEnabled);
    }
  };
  
  // End call
  const endCall = () => {
    // Clean up resources
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const stream = localVideoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    
    // Return to appointments
    navigate('/appointments');
  };
  
  // Handle when component unmounts
  useEffect(() => {
    return () => {
      // Clean up camera/mic when component unmounts
      if (localVideoRef.current && localVideoRef.current.srcObject) {
        const stream = localVideoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  if (loading) {
    return (
      <Container className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3">Setting up your telehealth appointment...</p>
      </Container>
    );
  }
  
  if (error) {
    return (
      <Container className="my-5">
        <Alert variant="danger">{error}</Alert>
        <div className="text-center mt-3">
          <Button variant="primary" onClick={() => navigate('/appointments')}>
            Back to Appointments
          </Button>
        </div>
      </Container>
    );
  }
  
  if (!appointment) {
    return (
      <Container className="my-5">
        <Alert variant="warning">Appointment not found or isn't a telehealth appointment</Alert>
        <div className="text-center mt-3">
          <Button variant="primary" onClick={() => navigate('/appointments')}>
            Back to Appointments
          </Button>
        </div>
      </Container>
    );
  }
  
  // Determine if current user is the doctor or patient
  const isDoctor = user?.role === 'DOCTOR';
  const otherParticipant = isDoctor ? appointment.patient : appointment.doctor;
  
  return (
    <Container fluid className="vh-100 d-flex flex-column p-0">
      {/* Meeting Header */}
      <div className="bg-dark text-white py-2 px-3">
        <Row className="align-items-center">
          <Col>
            <h5 className="mb-0">Telehealth Appointment</h5>
            <div className="small">
              {isDoctor 
                ? `With ${appointment.patient.firstName} ${appointment.patient.lastName}`
                : `With Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`
              }
            </div>
          </Col>
          <Col xs="auto">
            <Button 
              variant="danger" 
              size="sm" 
              onClick={endCall}
              title="End call"
            >
              End Call
            </Button>
          </Col>
        </Row>
      </div>
      
      {/* Meeting Content */}
      <Row className="flex-grow-1 g-0">
        {/* Video area */}
        <Col md={showChat ? 8 : 12} className="h-100 position-relative">
          {/* Remote video (other participant) - full size */}
          <div className="bg-black h-100 d-flex align-items-center justify-content-center">
            {/* This would be a real video stream in production */}
            <div className="text-center text-white">
              <FaUser className="display-1 mb-3" />
              <h5>Waiting for {otherParticipant.firstName} to join...</h5>
            </div>
            <video 
              ref={remoteVideoRef}
              autoPlay 
              playsInline
              className="w-100 h-100 d-none" // Hidden in demo
              style={{ objectFit: 'cover' }}
            />
          </div>
          
          {/* Local video (self view) - small overlay */}
          <div 
            className="position-absolute"
            style={{ 
              bottom: '20px', 
              right: '20px', 
              width: '200px', 
              height: '150px',
              boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
              borderRadius: '8px',
              overflow: 'hidden'
            }}
          >
            <video 
              ref={localVideoRef}
              autoPlay 
              playsInline 
              muted
              className="w-100 h-100"
              style={{ objectFit: 'cover' }}
            />
            
            {!videoEnabled && (
              <div 
                className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark"
              >
                <FaVideoSlash className="text-white fs-1" />
              </div>
            )}
          </div>
          
          {/* Video controls */}
          <div 
            className="position-absolute bottom-0 start-0 w-100 d-flex justify-content-center pb-3"
          >
            <div className="bg-dark bg-opacity-75 rounded-pill px-3 py-2 d-flex gap-3">
              <Button 
                variant={audioEnabled ? "light" : "danger"} 
                className="rounded-circle p-2" 
                onClick={toggleAudio}
                title={audioEnabled ? "Mute microphone" : "Unmute microphone"}
              >
                {audioEnabled ? <FaMicrophone /> : <FaMicrophoneSlash />}
              </Button>
              
              <Button 
                variant={videoEnabled ? "light" : "danger"} 
                className="rounded-circle p-2" 
                onClick={toggleVideo}
                title={videoEnabled ? "Turn off camera" : "Turn on camera"}
              >
                {videoEnabled ? <FaVideo /> : <FaVideoSlash />}
              </Button>
              
              <Button 
                variant="danger" 
                className="rounded-circle p-2" 
                onClick={endCall}
                title="End call"
              >
                <FaPhone style={{ transform: 'rotate(135deg)' }} />
              </Button>
              
              <Button 
                variant={showChat ? "primary" : "light"} 
                className="rounded-circle p-2" 
                onClick={() => setShowChat(!showChat)}
                title={showChat ? "Hide chat" : "Show chat"}
              >
                <FaComment />
              </Button>
            </div>
          </div>
        </Col>
        
        {/* Chat sidebar */}
        {showChat && (
          <Col md={4} className="h-100 border-start">
            <Card className="h-100 border-0 rounded-0">
              <Card.Header className="bg-light">
                <h5 className="mb-0">Chat</h5>
              </Card.Header>
              <Card.Body className="p-0 d-flex flex-column">
                <div className="flex-grow-1 p-3">
                  <div className="text-center text-muted my-5">
                    <p>Chat functionality would be implemented here.</p>
                    <p>Messages would appear in this area.</p>
                  </div>
                </div>
                <div className="p-2 border-top">
                  <div className="input-group">
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Type a message..." 
                      disabled
                    />
                    <Button variant="primary" disabled>Send</Button>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>
    </Container>
  );
};

export default TelehealthMeeting; 