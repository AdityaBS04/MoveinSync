import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import bookingService from '../services/bookingService';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [allBookings, setAllBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [bookingsError, setBookingsError] = useState(null);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadAllBookings();
    }
  }, [user]);

  const loadAllBookings = async () => {
    setLoadingBookings(true);
    setBookingsError(null);
    try {
      const response = await bookingService.getAll();
      if (response.success) {
        setAllBookings(response.bookings || []);
      }
    } catch (err) {
      setBookingsError(err.response?.data?.message || 'Failed to load bookings');
    } finally {
      setLoadingBookings(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'confirmed': return 'status-confirmed';
      case 'cancelled': return 'status-cancelled';
      case 'completed': return 'status-completed';
      default: return 'status-pending';
    }
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
              <h3>Admin Dashboard</h3>
              <div className="admin-buttons">
                <button
                  onClick={() => navigate('/floor-plans')}
                  className="btn-view-floor-plans"
                >
                  📋 Manage Floor Plans
                </button>
                <button
                  onClick={() => navigate('/activity-logs')}
                  className="btn-activity-logs"
                >
                  📊 Activity Logs
                </button>
              </div>

              {/* All Bookings Section */}
              <div className="all-bookings-section">
                <div className="bookings-header">
                  <h3>📅 All Bookings</h3>
                  {allBookings.length > 0 && (
                    <div className="booking-stats-inline">
                      <span className="stat">Total: <strong>{allBookings.length}</strong></span>
                      <span className="stat">Active: <strong>{allBookings.filter(b => b.status === 'confirmed').length}</strong></span>
                      <span className="stat">Cancelled: <strong>{allBookings.filter(b => b.status === 'cancelled').length}</strong></span>
                    </div>
                  )}
                </div>

                {loadingBookings ? (
                  <div className="bookings-loading">Loading bookings...</div>
                ) : bookingsError ? (
                  <div className="bookings-error">{bookingsError}</div>
                ) : allBookings.length === 0 ? (
                  <div className="bookings-empty">
                    <p>No bookings found in the system</p>
                  </div>
                ) : (
                  <div className="bookings-grid">
                    {allBookings.map((booking) => (
                      <div key={booking.id} className={`booking-card-dashboard ${booking.status}`}>
                        <div className="booking-card-header">
                          <h4>{booking.title}</h4>
                          <span className={`booking-status-badge ${getStatusBadgeClass(booking.status)}`}>
                            {booking.status}
                          </span>
                        </div>
                        <div className="booking-card-body">
                          <div className="booking-info">
                            <span className="info-icon">🚪</span>
                            <span>{booking.room_name}</span>
                          </div>
                          <div className="booking-info">
                            <span className="info-icon">👤</span>
                            <span>{booking.user_name || 'Unknown'}</span>
                          </div>
                          <div className="booking-info">
                            <span className="info-icon">⏰</span>
                            <span>{formatDate(booking.start_time)}</span>
                          </div>
                          {booking.description && (
                            <div className="booking-description">
                              {booking.description}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
