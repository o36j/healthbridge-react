# HealthBridge - Hospital Appointment Management System

HealthBridge is a modern hospital appointment management system built with the MERN stack (MongoDB, Express.js, React, Node.js). The system provides a comprehensive platform for patients, doctors, nurses, and administrators to manage appointments, patient records, and healthcare services.

## Features

### Authentication & Role-Based Access
- Register/Login with Email & Password (JWT + HTTP-only cookie)
- Role-based access control (Patient, Doctor, Nurse, Admin)
- Protected routes based on user roles

### User Profiles
- Upload profile photos
- Detailed user information based on role
- Admin can manage all user data

### Appointments
- Patients can search doctors by department and availability
- Book, reschedule, and cancel appointments
- Doctors and nurses can view, accept, reject, and manage appointments
- Admins can oversee all appointments and assign staff

### Patient History (EHR)
- Electronic Health Records for patients
- Medical staff can add/edit patient records
- Includes diagnoses, vitals, notes, prescriptions, and attachments
- Patients can view their own medical history

### Dashboard
- Role-specific dashboards
- Profile management
- Appointment tracking
- Patient history access based on role
- System settings and configurations

### Messaging & Notifications
- Internal messaging system between users
- Automated notifications for appointment updates
- Email notifications for important events

### Chatbot
- AI-powered chatbot for basic inquiries and assistance

## Tech Stack

### Frontend
- React 18 + Vite 6
- TypeScript 5.7+
- Bootstrap 5.3 with React-Bootstrap
- React Router v6
- Axios for API requests
- Framer Motion for animations
- React Big Calendar for appointment scheduling
- Chart.js and Recharts for data visualization
- Date-fns for date manipulation
- JWT token handling with HTTP-only cookies

### Backend
- Node.js 18+ with Express 5
- TypeScript 5.8+
- MongoDB 8+ with Mongoose ODM
- JWT Authentication with refresh tokens
- Role-based authorization middleware
- File upload support with Multer
- Email services with Nodemailer
- Rate limiting and security features with Helmet
- Cloudinary for image storage
- Zod for data validation

## Project Structure

```
├── client/                          # Frontend React application
│   ├── public/                      # Static files and assets
│   ├── src/                         # Source files
│   │   ├── assets/                  # Images, icons, and other static assets
│   │   ├── components/              # Reusable UI components
│   │   │   ├── admin/               # Admin-specific components
│   │   │   ├── appointments/        # Appointment management components
│   │   │   ├── common/              # Shared components used across the app
│   │   │   ├── doctors/             # Doctor-specific components
│   │   │   ├── layouts/             # Layout components (headers, footers, etc.)
│   │   │   ├── profile/             # User profile components
│   │   │   ├── ui/                  # Basic UI components (buttons, cards, etc.)
│   │   │   └── PrivateRoute.tsx     # Route wrapper for authentication
│   │   ├── contexts/                # React context providers
│   │   │   ├── AuthContext.tsx      # Authentication state management
│   │   │   └── NotificationContext.tsx # Notifications state management
│   │   ├── pages/                   # Page components
│   │   │   ├── Landing.tsx          # Homepage/landing page
│   │   │   ├── Login.tsx            # User login page
│   │   │   ├── Register.tsx         # User registration page
│   │   │   ├── Profile.tsx          # User profile page
│   │   │   ├── Appointments.tsx     # Appointment management page
│   │   │   ├── Doctors.tsx          # Doctors listing page
│   │   │   ├── DoctorDetail.tsx     # Doctor detail page
│   │   │   ├── PatientHistory.tsx   # Patient medical history page
│   │   │   ├── Messages.tsx         # Messaging system page
│   │   │   ├── Notifications.tsx    # Notifications page
│   │   │   ├── Settings.tsx         # User settings page
│   │   │   └── Admin/*.tsx          # Admin-specific pages
│   │   ├── styles/                  # CSS and styling files
│   │   │   └── index.css            # Global CSS styles
│   │   ├── utils/                   # Utility functions
│   │   │   ├── api.ts               # API request functions
│   │   │   ├── auth.ts              # Authentication utility functions
│   │   │   ├── date.ts              # Date formatting utilities
│   │   │   └── validation.ts        # Form validation utilities
│   │   ├── App.tsx                  # Main application component with routes
│   │   ├── App.css                  # App-specific styles
│   │   └── main.tsx                 # Application entry point
│   ├── index.html                   # HTML template
│   ├── vite.config.ts               # Vite configuration
│   ├── tsconfig.json                # TypeScript configuration
│   └── package.json                 # Frontend dependencies
│
├── server/                          # Backend Node.js application
│   ├── src/                         # Source files
│   │   ├── config/                  # Configuration files
│   │   │   ├── database.ts          # MongoDB connection setup
│   │   │   ├── email.ts             # Email service configuration
│   │   │   └── cloudinary.ts        # Cloudinary image storage config
│   │   ├── controllers/             # Route controllers
│   │   │   ├── auth.controller.ts   # Authentication controllers
│   │   │   ├── user.controller.ts   # User management controllers
│   │   │   ├── appointment.controller.ts # Appointment controllers
│   │   │   ├── patientHistory.controller.ts # Patient history controllers
│   │   │   ├── message.controller.ts # Messaging controllers
│   │   │   └── chatbot.controller.ts # Chatbot integration controllers
│   │   ├── middlewares/             # Express middlewares
│   │   │   ├── auth.middleware.ts   # Authentication middleware
│   │   │   ├── upload.middleware.ts # File upload middleware
│   │   │   ├── validation.middleware.ts # Data validation middleware
│   │   │   └── errorHandler.middleware.ts # Error handling middleware
│   │   ├── models/                  # Mongoose data models
│   │   │   ├── user.model.ts        # User data model
│   │   │   ├── appointment.model.ts # Appointment data model
│   │   │   ├── patientHistory.model.ts # Patient history data model
│   │   │   ├── message.model.ts     # Message data model
│   │   │   ├── notification.model.ts # Notification data model
│   │   │   ├── userPreferences.model.ts # User preferences model
│   │   │   └── auditLog.model.ts    # Audit logging model
│   │   ├── routes/                  # API routes
│   │   │   ├── auth.routes.ts       # Authentication routes
│   │   │   ├── user.routes.ts       # User management routes
│   │   │   ├── appointment.routes.ts # Appointment routes
│   │   │   ├── patientHistory.routes.ts # Patient history routes
│   │   │   ├── message.routes.ts    # Messaging routes
│   │   │   ├── notification.routes.ts # Notification routes
│   │   │   ├── admin.routes.ts      # Admin-specific routes
│   │   │   └── chatbot.routes.ts    # Chatbot integration routes
│   │   ├── types/                   # TypeScript type definitions
│   │   │   ├── user.types.ts        # User-related type definitions
│   │   │   ├── appointment.types.ts # Appointment-related type definitions
│   │   │   └── request.types.ts     # Express request extensions
│   │   ├── utils/                   # Utility functions
│   │   │   ├── jwt.ts               # JWT token management utilities
│   │   │   ├── email.ts             # Email sending utilities
│   │   │   ├── logger.ts            # Logging utilities
│   │   │   └── validation.ts        # Data validation utilities
│   │   ├── validations/             # Data validation schemas
│   │   │   ├── user.validation.ts   # User data validation schemas
│   │   │   ├── appointment.validation.ts # Appointment validation schemas
│   │   │   └── patientHistory.validation.ts # Patient history validation
│   │   └── index.ts                 # Server entry point
│   ├── uploads/                     # Uploaded files storage
│   │   ├── profiles/                # User profile photos
│   │   └── medical/                 # Medical record attachments
│   ├── tsconfig.json                # TypeScript configuration
│   └── package.json                 # Backend dependencies
│
└── docs/                            # Documentation files
    ├── api.md                       # API documentation
    ├── setup.md                     # Setup instructions
    └── deployment.md                # Deployment guidelines
```

## Getting Started

### Prerequisites
- Node.js (v18.x or later)
- MongoDB (v6.x or later)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/o36j/healthbridge.git
cd healthbridge
```

2. Install backend dependencies
```bash
cd server
npm install
```

3. Configure environment variables
```bash
# Create a .env file in the server directory with the following variables:
PORT=5000
MONGODB_URI=mongodb://localhost:27017/healthbridge
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

4. Install frontend dependencies
```bash
cd ../client
npm install
```

5. Create frontend environment variables
```bash
# Create a .env file in the client directory with:
VITE_API_URL=http://localhost:5000/api
```

6. Start the development servers

Backend:
```bash
cd server
npm run dev
```

Frontend:
```bash
cd client
npm run dev
```

7. Open the application in your browser
```
http://localhost:5173
```

## API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/refresh-token` - Refresh JWT token
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user

### User Endpoints
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user profile
- `POST /api/users/upload-photo/:id` - Upload profile photo
- `PUT /api/users/change-password/:id` - Change password
- `GET /api/users` - Get all users (admin only)
- `PUT /api/users/role/:id` - Update user role (admin only)
- `DELETE /api/users/:id` - Delete user (admin only)

### Appointment Endpoints
- `POST /api/appointments` - Create new appointment
- `GET /api/appointments/:id` - Get appointment by ID
- `GET /api/appointments/user/:userId` - Get user appointments
- `PATCH /api/appointments/status/:id` - Update appointment status
- `PUT /api/appointments/:id` - Update appointment
- `GET /api/appointments` - Get all appointments (admin/nurse only)
- `DELETE /api/appointments/:id` - Delete appointment (admin only)

### Patient History Endpoints
- `POST /api/patient-history` - Create patient history record
- `GET /api/patient-history/:id` - Get patient history by ID
- `GET /api/patient-history/patient/:patientId` - Get patient's history
- `PUT /api/patient-history/:id` - Update patient history
- `GET /api/patient-history` - Get all patient history records (admin/staff only)
- `DELETE /api/patient-history/:id` - Delete patient history (admin only)

### Message & Notification Endpoints
- `POST /api/messages` - Send a new message
- `GET /api/messages` - Get user's messages
- `GET /api/notifications` - Get user's notifications
- `PATCH /api/notifications/:id` - Mark notification as read

### Chatbot Endpoints
- `POST /api/chatbot` - Send message to chatbot

## Contributing

We welcome contributions to HealthBridge! Here's how you can help:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

Please make sure to:
- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Follow the git commit message conventions

## License

This project is licensed under the MIT License.

## Acknowledgments

- Bootstrap for the UI components
- MongoDB for the database
- Express and Node.js for the backend framework
- React for the frontend framework
- All other open-source libraries used in this project 