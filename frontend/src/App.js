import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate as RouterNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import FloorPlanEditor from './pages/FloorPlanEditor';
import FloorPlanList from './pages/FloorPlanList';
import MyBookings from './pages/MyBookings';
import NavigatePage from './pages/Navigate';
import ActivityLogs from './pages/ActivityLogs';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider } from './context/AuthContext';
import { NetworkProvider } from './context/NetworkContext';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <NetworkProvider>
        <Router>
          <div className="App">
            <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/dashboard"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/floor-plans"
              element={
                <PrivateRoute>
                  <FloorPlanList />
                </PrivateRoute>
              }
            />
            <Route
              path="/floor-plan/new"
              element={
                <PrivateRoute>
                  <FloorPlanEditor />
                </PrivateRoute>
              }
            />
            <Route
              path="/floor-plan/:id"
              element={
                <PrivateRoute>
                  <FloorPlanEditor />
                </PrivateRoute>
              }
            />
            <Route
              path="/floor-plan/:id/view"
              element={
                <PrivateRoute>
                  <FloorPlanEditor viewOnly={true} />
                </PrivateRoute>
              }
            />
            <Route
              path="/bookings"
              element={
                <PrivateRoute>
                  <MyBookings />
                </PrivateRoute>
              }
            />
            <Route
              path="/navigate"
              element={
                <PrivateRoute>
                  <NavigatePage />
                </PrivateRoute>
              }
            />
            <Route
              path="/activity-logs"
              element={
                <PrivateRoute>
                  <ActivityLogs />
                </PrivateRoute>
              }
            />
            <Route path="/" element={<RouterNavigate to="/login" replace />} />
          </Routes>
        </div>
      </Router>
      </NetworkProvider>
    </AuthProvider>
  );
}

export default App;
