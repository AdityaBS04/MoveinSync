import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ROOM_TYPES } from '../constants/roomTypes';
import './MyBookings.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const MyBookings = () => {
  const [bookings, setBookings] = useState([]);
  const [floorPlans, setFloorPlans] = useState([]);
  const [selectedFloorPlan, setSelectedFloorPlan] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availableRooms, setAvailableRooms] = useState([]);
  const navigate = useNavigate();

  // Booking form state
  const [bookingData, setBookingData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    attendees: 1
  });

  useEffect(() => {
    fetchMyBookings();
    fetchFloorPlans();
  }, []);

  const fetchMyBookings = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/bookings/my-bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBookings(response.data.bookings || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setLoading(false);
    }
  };

  const fetchFloorPlans = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/floor-plans`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFloorPlans(response.data.plans || []);
    } catch (error) {
      console.error('Error fetching floor plans:', error);
    }
  };

  const checkRoomAvailability = async () => {
    if (!selectedFloorPlan || !bookingData.startTime || !bookingData.endTime || !bookingData.attendees) {
      return;
    }

    const attendees = parseInt(bookingData.attendees);

    // Validate capacity limits
    if (attendees > 25) {
      alert('Maximum capacity is 25 people. Please book 2 separate rooms if you need more space.');
      return;
    }

    setCheckingAvailability(true);

    try {
      const token = localStorage.getItem('token');

      // Use the new recommendation API
      const response = await axios.get(
        `${API_URL}/bookings/recommended-rooms`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            floorPlanId: selectedFloorPlan,
            attendees: attendees,
            startTime: new Date(bookingData.startTime).toISOString(),
            endTime: new Date(bookingData.endTime).toISOString()
          }
        }
      );

      const recommendedRooms = response.data.recommendedRooms || [];

      if (recommendedRooms.length === 0) {
        alert(`No rooms available for ${attendees} attendees at the selected time. Meeting Rooms hold up to 10 people, Conference Rooms hold up to 25 people.`);
        setAvailableRooms([]);
        setCheckingAvailability(false);
        return;
      }

      setAvailableRooms(recommendedRooms);
      setCheckingAvailability(false);
    } catch (error) {
      console.error('Error checking availability:', error);
      setCheckingAvailability(false);
      alert('Failed to check room availability');
    }
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();

    if (!selectedFloorPlan || !selectedRoom) {
      alert('Please select a floor plan and room');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const room = availableRooms.find(r => r.id === selectedRoom);

      const payload = {
        floorPlanId: selectedFloorPlan,
        roomId: selectedRoom,
        roomName: room.name,
        title: bookingData.title,
        description: bookingData.description,
        startTime: new Date(bookingData.startTime).toISOString(),
        endTime: new Date(bookingData.endTime).toISOString(),
        attendees: parseInt(bookingData.attendees)
      };

      await axios.post(`${API_URL}/bookings`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Booking created successfully!');
      setShowBookingForm(false);
      resetForm();
      fetchMyBookings();
    } catch (error) {
      console.error('Error creating booking:', error);
      alert(error.response?.data?.message || 'Failed to create booking');
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_URL}/bookings/${bookingId}/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Booking cancelled successfully!');
      fetchMyBookings();
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert(error.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const resetForm = () => {
    setBookingData({
      title: '',
      description: '',
      startTime: '',
      endTime: '',
      attendees: 1
    });
    setSelectedFloorPlan('');
    setSelectedRoom('');
    setAvailableRooms([]);
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRoomCapacity = (roomType) => {
    const roomConfig = ROOM_TYPES[roomType];
    return roomConfig ? roomConfig.capacity : 'N/A';
  };

  const canCheckAvailability = selectedFloorPlan && bookingData.startTime && bookingData.endTime && bookingData.attendees >= 1;

  return (
    <div className="my-bookings">
      <div className="bookings-header">
        <h1>📅 My Bookings</h1>
        <div className="header-actions">
          <button
            className="btn-new-booking"
            onClick={() => setShowBookingForm(!showBookingForm)}
          >
            {showBookingForm ? '❌ Cancel' : '➕ New Booking'}
          </button>
          <button
            className="btn-back"
            onClick={() => navigate('/dashboard')}
          >
            🏠 Dashboard
          </button>
        </div>
      </div>

      {showBookingForm && (
        <div className="booking-form-container">
          <h2>Create New Booking</h2>
          <form onSubmit={handleCreateBooking}>
            {/* Step 1: Select Floor Plan */}
            <div className="form-section">
              <h3>Step 1: Select Floor Plan</h3>
              <div className="form-group">
                <label>Floor Plan *</label>
                <select
                  value={selectedFloorPlan}
                  onChange={(e) => {
                    setSelectedFloorPlan(e.target.value);
                    setSelectedRoom('');
                    setAvailableRooms([]);
                  }}
                  required
                >
                  <option value="">Select a floor plan</option>
                  {floorPlans.map(fp => (
                    <option key={fp.id} value={fp.id}>
                      {fp.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Step 2: Date, Time, Attendees */}
            {selectedFloorPlan && (
              <div className="form-section">
                <h3>Step 2: Select Date, Time & Attendees</h3>

                <div className="form-row">
                  <div className="form-group">
                    <label>Start Time *</label>
                    <input
                      type="datetime-local"
                      value={bookingData.startTime}
                      onChange={(e) => {
                        setBookingData({...bookingData, startTime: e.target.value});
                        setAvailableRooms([]);
                        setSelectedRoom('');
                      }}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>End Time *</label>
                    <input
                      type="datetime-local"
                      value={bookingData.endTime}
                      min={bookingData.startTime}
                      onChange={(e) => {
                        setBookingData({...bookingData, endTime: e.target.value});
                        setAvailableRooms([]);
                        setSelectedRoom('');
                      }}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Number of Attendees * (Max: 25)</label>
                  <input
                    type="number"
                    min="1"
                    max="25"
                    value={bookingData.attendees}
                    onChange={(e) => {
                      setBookingData({...bookingData, attendees: e.target.value});
                      setAvailableRooms([]);
                      setSelectedRoom('');
                    }}
                    required
                  />
                  <p className="help-text">
                    Meeting Rooms: up to 10 people | Conference Rooms: up to 25 people
                  </p>
                </div>

                <button
                  type="button"
                  className="btn-check-availability"
                  onClick={checkRoomAvailability}
                  disabled={!canCheckAvailability || checkingAvailability}
                >
                  {checkingAvailability ? '🔍 Checking...' : '🔍 Check Available Rooms'}
                </button>
              </div>
            )}

            {/* Step 3: Select Room */}
            {availableRooms.length > 0 && (
              <div className="form-section">
                <h3>✨ Step 3: Recommended Rooms ({availableRooms.length} available)</h3>
                <p className="recommendation-subtitle">Rooms are ranked by best match based on capacity, your preferences, and proximity</p>
                <div className="available-rooms-grid">
                  {availableRooms.map((room, index) => {
                    const roomConfig = ROOM_TYPES[room.type];
                    const isTopRecommendation = index === 0;
                    return (
                      <div
                        key={room.id}
                        className={`room-option ${selectedRoom === room.id ? 'selected' : ''} ${isTopRecommendation ? 'top-recommendation' : ''}`}
                        onClick={() => setSelectedRoom(room.id)}
                      >
                        {isTopRecommendation && (
                          <div className="best-match-badge">⭐ Best Match</div>
                        )}
                        <div className="room-icon">{roomConfig?.icon}</div>
                        <div className="room-name">{room.name}</div>
                        <div className="room-type">{roomConfig?.label}</div>
                        <div className="room-capacity">
                          👥 {room.capacity} people ({room.capacityUtilization}% utilized)
                        </div>
                        {room.recommendation && (
                          <div className="recommendation-reason">
                            💡 {room.recommendation}
                          </div>
                        )}
                        {room.bookingCount > 0 && (
                          <div className="booking-history">
                            🔖 You've booked this {room.bookingCount}x before
                          </div>
                        )}
                        <div className="match-score">Match: {Math.round((room.score / 100) * 100)}%</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 4: Booking Details */}
            {selectedRoom && (
              <div className="form-section">
                <h3>Step 4: Booking Details</h3>

                <div className="form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    value={bookingData.title}
                    onChange={(e) => setBookingData({...bookingData, title: e.target.value})}
                    placeholder="e.g., Team Meeting"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={bookingData.description}
                    onChange={(e) => setBookingData({...bookingData, description: e.target.value})}
                    placeholder="Meeting agenda or notes..."
                    rows="3"
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-submit">
                    Create Booking
                  </button>
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => {
                      setShowBookingForm(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      )}

      <div className="bookings-list">
        <h2>Your Bookings</h2>
        {loading ? (
          <p className="loading">Loading bookings...</p>
        ) : bookings.length === 0 ? (
          <div className="no-bookings">
            <p>📭 No bookings yet</p>
            <p>Click "New Booking" to create your first booking!</p>
          </div>
        ) : (
          <div className="bookings-grid">
            {bookings.map(booking => (
              <div key={booking.id} className={`booking-card ${booking.status}`}>
                <div className="booking-header">
                  <h3>{booking.title}</h3>
                  <span className={`status-badge ${booking.status}`}>
                    {booking.status}
                  </span>
                </div>

                <div className="booking-details">
                  <p className="room-info">
                    <strong>🏢 Room:</strong> {booking.room_name}
                  </p>
                  <p className="time-info">
                    <strong>🕐 Start:</strong> {formatDateTime(booking.start_time)}
                  </p>
                  <p className="time-info">
                    <strong>🕐 End:</strong> {formatDateTime(booking.end_time)}
                  </p>
                  {booking.description && (
                    <p className="description">
                      <strong>📝 Description:</strong> {booking.description}
                    </p>
                  )}
                  {booking.attendees && (
                    <p className="attendees">
                      <strong>👥 Attendees:</strong> {booking.attendees}
                    </p>
                  )}
                </div>

                {booking.status === 'confirmed' && (
                  <div className="booking-actions">
                    <button
                      className="btn-cancel-booking"
                      onClick={() => handleCancelBooking(booking.id)}
                    >
                      Cancel Booking
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyBookings;
