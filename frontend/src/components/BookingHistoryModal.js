import React, { useState, useEffect } from 'react';
import bookingService from '../services/bookingService';
import './BookingHistoryModal.css';

const BookingHistoryModal = ({ floorPlan, isOpen, onClose }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [groupBy, setGroupBy] = useState('room'); // 'room' or 'date'

  useEffect(() => {
    if (isOpen && floorPlan) {
      loadBookings();
    }
  }, [isOpen, floorPlan]);

  const loadBookings = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await bookingService.getByFloorPlan(floorPlan.id);
      if (response.success) {
        setBookings(response.bookings || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
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

  const groupBookingsByRoom = () => {
    const grouped = {};
    bookings.forEach(booking => {
      const roomKey = booking.room_name || booking.room_id;
      if (!grouped[roomKey]) {
        grouped[roomKey] = [];
      }
      grouped[roomKey].push(booking);
    });
    return grouped;
  };

  const groupBookingsByDate = () => {
    const grouped = {};
    bookings.forEach(booking => {
      const dateKey = new Date(booking.start_time).toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(booking);
    });
    return grouped;
  };

  if (!isOpen) return null;

  const groupedBookings = groupBy === 'room' ? groupBookingsByRoom() : groupBookingsByDate();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Booking History - {floorPlan.name}</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        {loading ? (
          <div className="modal-loading">Loading bookings...</div>
        ) : error ? (
          <div className="modal-error">{error}</div>
        ) : (
          <div className="modal-content">
            {/* Controls */}
            <div className="booking-controls">
              <div className="booking-stats">
                <span className="stat">
                  Total Bookings: <strong>{bookings.length}</strong>
                </span>
                <span className="stat">
                  Active: <strong>{bookings.filter(b => b.status === 'confirmed').length}</strong>
                </span>
                <span className="stat">
                  Cancelled: <strong>{bookings.filter(b => b.status === 'cancelled').length}</strong>
                </span>
              </div>
              <div className="group-by-controls">
                <label>Group by:</label>
                <select value={groupBy} onChange={(e) => setGroupBy(e.target.value)}>
                  <option value="room">Room</option>
                  <option value="date">Date</option>
                </select>
              </div>
            </div>

            {bookings.length === 0 ? (
              <div className="empty-state">
                <h3>No bookings yet</h3>
                <p>This floor plan has no booking history</p>
              </div>
            ) : (
              <div className="bookings-section">
                {Object.keys(groupedBookings).map((groupKey) => (
                  <div key={groupKey} className="booking-group">
                    <h3 className="group-title">
                      {groupBy === 'room' ? `🚪 ${groupKey}` : `📅 ${groupKey}`}
                      <span className="group-count">({groupedBookings[groupKey].length} bookings)</span>
                    </h3>
                    <div className="bookings-list">
                      {groupedBookings[groupKey].map((booking) => (
                        <div key={booking.id} className={`booking-card ${booking.status}`}>
                          <div className="booking-header">
                            <div className="booking-title">
                              <h4>{booking.title}</h4>
                              <span className={`booking-status ${getStatusBadgeClass(booking.status)}`}>
                                {booking.status}
                              </span>
                            </div>
                            {groupBy === 'date' && (
                              <span className="booking-room">Room: {booking.room_name}</span>
                            )}
                          </div>
                          <div className="booking-details">
                            <div className="detail-row">
                              <span className="detail-label">👤 Booked by:</span>
                              <span className="detail-value">{booking.user_name || 'Unknown'}</span>
                            </div>
                            <div className="detail-row">
                              <span className="detail-label">⏰ Start:</span>
                              <span className="detail-value">{formatDate(booking.start_time)}</span>
                            </div>
                            <div className="detail-row">
                              <span className="detail-label">⏰ End:</span>
                              <span className="detail-value">{formatDate(booking.end_time)}</span>
                            </div>
                            {booking.description && (
                              <div className="detail-row">
                                <span className="detail-label">📝 Description:</span>
                                <span className="detail-value">{booking.description}</span>
                              </div>
                            )}
                            <div className="detail-row">
                              <span className="detail-label">👥 Attendees:</span>
                              <span className="detail-value">{booking.attendees || 1}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="modal-footer">
          <button className="btn-close-footer" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default BookingHistoryModal;
