import { Container, Card } from 'react-bootstrap';
import DoctorAvailabilityManager from '../components/admin/DoctorAvailabilityManager';

const AdminAvailabilityManagement = () => {
  return (
    <Container fluid className="py-4">
      <h2 className="mb-4 fw-bold">Manage Doctor Availability</h2>
      
      <Card className="shadow-sm mb-4">
        <Card.Body className="p-4">
          <p className="mb-4 text-muted">
            As an administrator, you can manage the regular working hours for each doctor. 
            These schedules determine when doctors are available to see patients and are used by the appointment booking system.
          </p>
          
          <DoctorAvailabilityManager />
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AdminAvailabilityManagement; 