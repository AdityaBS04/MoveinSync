import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="dashboard">
      <nav className="navbar">
        <div className="navbar-brand">
          <h2>Movensync</h2>
        </div>
        <div className="navbar-user">
          <span className="user-info">
            {user?.fullName} ({user?.role})
          </span>
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="welcome-card">
          <h1>Welcome to Movensync!</h1>
          <p>You are logged in as <strong>{user?.role}</strong></p>

          <div className="user-details">
            <h3>User Details:</h3>
            <div className="detail-row">
              <span className="label">Name:</span>
              <span className="value">{user?.fullName}</span>
            </div>
            <div className="detail-row">
              <span className="label">Email:</span>
              <span className="value">{user?.email}</span>
            </div>
            <div className="detail-row">
              <span className="label">Role:</span>
              <span className="value">
                <span className={`role-badge ${user?.role}`}>
                  {user?.role}
                </span>
              </span>
            </div>
            <div className="detail-row">
              <span className="label">User ID:</span>
              <span className="value">{user?.id}</span>
            </div>
          </div>

          {user?.role === 'admin' && (
            <div className="admin-section">
              <h3>Admin Access</h3>
              <p>As an admin, you have access to:</p>
              <ul>
                <li>Floor plan management</li>
                <li>Room configuration</li>
                <li>User management</li>
                <li>Booking oversight</li>
              </ul>
              <div className="admin-buttons">
                <button
                  onClick={() => navigate('/floor-plans')}
                  className="btn-view-floor-plans"
                >
                  📋 View Floor Plans
                </button>
                <button
                  onClick={() => navigate('/floor-plan/new')}
                  className="btn-create-floor-plan"
                >
                  🏗️ Create New Floor Plan
                </button>
                <button
                  onClick={() => navigate('/activity-logs')}
                  className="btn-activity-logs"
                >
                  📊 Activity Logs
                </button>
              </div>
            </div>
          )}

          {user?.role === 'user' && (
            <div className="user-section">
              <h3>User Access</h3>
              <p>As a user, you can:</p>
              <ul>
                <li>View floor plans</li>
                <li>Book meeting rooms</li>
                <li>Navigate between rooms</li>
                <li>Manage your bookings</li>
              </ul>
              <div className="user-buttons">
                <button
                  onClick={() => navigate('/floor-plans')}
                  className="btn-view-floor-plans-user"
                >
                  📋 View Floor Plans
                </button>
                <button
                  onClick={() => navigate('/bookings')}
                  className="btn-bookings"
                >
                  📅 My Bookings
                </button>
                <button
                  onClick={() => navigate('/navigate')}
                  className="btn-navigate"
                >
                  🧭 Navigate
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
