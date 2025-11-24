# Movensync - Floor Plan Management System

A full-stack web application for intelligent floor plan management and meeting room booking with role-based access control.

## Features

- **User Authentication**: Login and signup with JWT token-based authentication
- **Role-Based Access Control**: Admin and User roles with different permissions
- **Secure Backend**: Express.js API with bcrypt password hashing
- **Modern Frontend**: React-based UI with React Router and Context API
- **Protected Routes**: Dashboard accessible only to authenticated users

## Tech Stack

### Backend
- Node.js
- Express.js
- bcryptjs (password hashing)
- jsonwebtoken (JWT authentication)
- CORS enabled

### Frontend
- React 18
- React Router DOM
- Axios (HTTP client)
- Context API (state management)

## Project Structure

```
Movensync/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   └── authController.js
│   │   ├── middleware/
│   │   │   └── authMiddleware.js
│   │   ├── models/
│   │   │   └── userModel.js
│   │   ├── routes/
│   │   │   └── auth.js
│   │   └── server.js
│   ├── .env
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   └── PrivateRoute.js
    │   ├── context/
    │   │   └── AuthContext.js
    │   ├── pages/
    │   │   ├── Login.js
    │   │   ├── Signup.js
    │   │   ├── Dashboard.js
    │   │   ├── Auth.css
    │   │   └── Dashboard.css
    │   ├── services/
    │   │   └── api.js
    │   ├── App.js
    │   ├── index.js
    │   └── index.css
    └── package.json
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

#### 1. Clone the repository (or navigate to the project)
```bash
cd /Users/aditya/Documents/Projects/Movensync
```

#### 2. Setup Backend
```bash
cd backend
npm install
```

The `.env` file is already created with default values:
```
PORT=5000
JWT_SECRET=movensync-super-secret-jwt-key-2024
NODE_ENV=development
```

#### 3. Setup Frontend
```bash
cd ../frontend
npm install
```

### Running the Application

#### Start Backend Server
```bash
cd backend
npm run dev
# or
npm start
```
Backend will run on `http://localhost:5000`

#### Start Frontend (in a new terminal)
```bash
cd frontend
npm start
```
Frontend will run on `http://localhost:3000`

## Usage

### Demo Credentials

**Admin Account:**
- Email: `admin@movensync.com`
- Password: `admin123`

### User Roles

#### Admin
- Can access all features
- Floor plan management
- Room configuration
- User management
- Booking oversight

#### User
- Can view floor plans
- Book meeting rooms
- Manage their own bookings
- View room availability

### Creating a New Account

1. Navigate to `http://localhost:3000`
2. Click "Sign up" link
3. Fill in the registration form:
   - Full Name
   - Email
   - Password (minimum 6 characters)
   - Confirm Password
   - Select Role (User or Admin)
4. Click "Sign Up"
5. You'll be automatically logged in and redirected to the dashboard

### Login

1. Navigate to `http://localhost:3000/login`
2. Enter email and password
3. Click "Login"
4. You'll be redirected to the dashboard

## API Endpoints

### Authentication

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "John Doe",
  "role": "user" // or "admin"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Get Current User (Protected)
```http
GET /api/auth/me
Authorization: Bearer <token>
```

## Security Features

- Passwords hashed with bcrypt (10 salt rounds)
- JWT tokens with 24-hour expiration
- Protected routes with authentication middleware
- CORS enabled for cross-origin requests
- Automatic token refresh handling
- Secure HTTP-only authentication flow

## Current Implementation

This is a **basic version** with:
- In-memory user storage (users stored in array)
- Pre-seeded admin user
- Basic authentication and authorization
- Role-based access control

## Future Enhancements

According to the technical specification, the full system will include:
- PostgreSQL database for relational data
- MongoDB for floor plan layouts and event sourcing
- Redis for caching and real-time features
- Real-time collaborative floor plan editing
- Offline support with Service Workers
- Intelligent room booking system
- Pathfinding and navigation
- Complete audit trail

## License

ISC

## Author

Movensync Development Team
# MoveinSync
