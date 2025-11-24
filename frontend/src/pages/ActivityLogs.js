import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import activityLogService from '../services/activityLogService';
import './ActivityLogs.css';

const ActivityLogs = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    actionType: '',
    entityType: '',
    limit: 100
  });

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }
    loadLogs();
    loadStats();
  }, [user, navigate]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const cleanFilters = {};
      if (filters.actionType) cleanFilters.actionType = filters.actionType;
      if (filters.entityType) cleanFilters.entityType = filters.entityType;
      if (filters.limit) cleanFilters.limit = filters.limit;

      const response = await activityLogService.getAll(cleanFilters);
      setLogs(response.logs || []);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await activityLogService.getStats();
      setStats(response.stats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    loadLogs();
  };

  const handleClearFilters = () => {
    setFilters({ actionType: '', entityType: '', limit: 100 });
    setTimeout(() => loadLogs(), 0);
  };

  const getActionTypeIcon = (actionType) => {
    if (actionType.startsWith('AUTH_')) return '🔐';
    if (actionType.startsWith('FLOOR_PLAN_')) return '🏢';
    if (actionType.startsWith('BOOKING_')) return '📅';
    if (actionType.startsWith('VERSION_')) return '📋';
    if (actionType.startsWith('SYNC_')) return '🔄';
    return '📝';
  };

  const getActionTypeBadgeClass = (actionType) => {
    if (actionType.startsWith('AUTH_')) return 'badge-auth';
    if (actionType.startsWith('FLOOR_PLAN_')) return 'badge-floor-plan';
    if (actionType.startsWith('BOOKING_')) return 'badge-booking';
    if (actionType.startsWith('VERSION_')) return 'badge-version';
    if (actionType.startsWith('SYNC_')) return 'badge-sync';
    return 'badge-default';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading && logs.length === 0) {
    return <div className="loading">Loading activity logs...</div>;
  }

  return (
    <div className="activity-logs-page">
      <nav className="navbar">
        <div className="navbar-brand">
          <h2>Movensync</h2>
        </div>
        <div className="navbar-user">
          <span className="user-info">
            {user?.fullName} ({user?.role})
          </span>
          <button onClick={() => navigate('/dashboard')} className="btn-dashboard">
            Dashboard
          </button>
          <button onClick={handleLogout} className="btn-logout">
            Logout
          </button>
        </div>
      </nav>

      <div className="content">
        <div className="header">
          <h1>📊 Activity Logs</h1>
          <p className="subtitle">System-wide activity monitoring and audit trail</p>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="stats-grid">
            <div className="stat-card total">
              <div className="stat-icon">📈</div>
              <div className="stat-content">
                <div className="stat-label">Total Activities</div>
                <div className="stat-value">{stats.total}</div>
              </div>
            </div>

            {Object.entries(stats.byActionType || {}).slice(0, 4).map(([type, count]) => (
              <div key={type} className={`stat-card ${getActionTypeBadgeClass(type)}`}>
                <div className="stat-icon">{getActionTypeIcon(type)}</div>
                <div className="stat-content">
                  <div className="stat-label">{type.replace(/_/g, ' ')}</div>
                  <div className="stat-value">{count}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="filters-card">
          <h3>🔍 Filters</h3>
          <div className="filters-grid">
            <div className="filter-group">
              <label>Action Type</label>
              <select
                name="actionType"
                value={filters.actionType}
                onChange={handleFilterChange}
              >
                <option value="">All Actions</option>
                <optgroup label="Authentication">
                  <option value="AUTH_LOGIN">Login</option>
                  <option value="AUTH_SIGNUP">Signup</option>
                  <option value="AUTH_LOGOUT">Logout</option>
                </optgroup>
                <optgroup label="Floor Plans">
                  <option value="FLOOR_PLAN_CREATE">Create</option>
                  <option value="FLOOR_PLAN_UPDATE">Update</option>
                  <option value="FLOOR_PLAN_DELETE">Delete</option>
                  <option value="FLOOR_PLAN_PUBLISH">Publish</option>
                  <option value="FLOOR_PLAN_UNPUBLISH">Unpublish</option>
                </optgroup>
                <optgroup label="Bookings">
                  <option value="BOOKING_CREATE">Create</option>
                  <option value="BOOKING_UPDATE">Update</option>
                  <option value="BOOKING_CANCEL">Cancel</option>
                </optgroup>
                <optgroup label="Versions">
                  <option value="VERSION_CREATE">Create</option>
                  <option value="VERSION_MERGE">Merge</option>
                  <option value="VERSION_REJECT">Reject</option>
                  <option value="VERSION_AUTO_MERGE">Auto Merge</option>
                </optgroup>
                <optgroup label="Sync">
                  <option value="SYNC_OFFLINE_SAVE">Offline Save</option>
                  <option value="SYNC_ONLINE_SYNC">Online Sync</option>
                </optgroup>
              </select>
            </div>

            <div className="filter-group">
              <label>Entity Type</label>
              <select
                name="entityType"
                value={filters.entityType}
                onChange={handleFilterChange}
              >
                <option value="">All Entities</option>
                <option value="user">Users</option>
                <option value="floor_plan">Floor Plans</option>
                <option value="booking">Bookings</option>
                <option value="version">Versions</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Limit</label>
              <select
                name="limit"
                value={filters.limit}
                onChange={handleFilterChange}
              >
                <option value="50">50 records</option>
                <option value="100">100 records</option>
                <option value="200">200 records</option>
                <option value="500">500 records</option>
              </select>
            </div>

            <div className="filter-actions">
              <button onClick={handleApplyFilters} className="btn-apply">
                Apply Filters
              </button>
              <button onClick={handleClearFilters} className="btn-clear">
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Activity Logs Table */}
        <div className="logs-card">
          <h3>📋 Activity History ({logs.length} records)</h3>
          {loading ? (
            <div className="logs-loading">Loading...</div>
          ) : logs.length === 0 ? (
            <div className="empty-state">
              <p>No activity logs found</p>
              <p className="hint">Try adjusting the filters</p>
            </div>
          ) : (
            <div className="logs-table-wrapper">
              <table className="logs-table">
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Description</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td className="time-cell">
                        {formatDate(log.created_at)}
                      </td>
                      <td className="user-cell">
                        <div className="user-info-cell">
                          <div className="user-name">{log.user_name}</div>
                          <div className="user-email">{log.user_email}</div>
                        </div>
                      </td>
                      <td className="action-cell">
                        <span className={`action-badge ${getActionTypeBadgeClass(log.action_type)}`}>
                          {getActionTypeIcon(log.action_type)} {log.action_type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="entity-cell">
                        <div className="entity-info">
                          <div className="entity-type">{log.entity_type}</div>
                          {log.entity_name && (
                            <div className="entity-name">{log.entity_name}</div>
                          )}
                        </div>
                      </td>
                      <td className="description-cell">
                        {log.description}
                      </td>
                      <td className="status-cell">
                        <span className={`status-badge ${log.is_online ? 'online' : 'offline'}`}>
                          {log.is_online ? '🟢 Online' : '🟠 Offline'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityLogs;
