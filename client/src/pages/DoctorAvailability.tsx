import { Container, Card } from 'react-bootstrap';
import AvailabilityManager from '../components/doctors/AvailabilityManager';

const DoctorAvailability = () => {
  return (
    <Container className="py-4">
      <h2 className="mb-4 fw-bold">Availability Management</h2>
      
      <Card className="shadow-sm mb-4">
        <Card.Body className="p-3">
          <p className="mb-3 text-muted">
            Set your regular working hours for each day of the week. This schedule will be visible to patients when they book appointments with you.
          </p>
          
          <AvailabilityManager />
        </Card.Body>
      </Card>
    </Container>
  );
};

export default DoctorAvailability; 