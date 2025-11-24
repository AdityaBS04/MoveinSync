import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import floorPlanService from '../services/floorPlanService';
import indexedDBService from '../services/indexedDBService';
import syncService from '../services/syncService';
import VersionHistoryModal from '../components/VersionHistoryModal';
import './FloorPlanList.css';

const FloorPlanList = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [floorPlans, setFloorPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unsyncedIds, setUnsyncedIds] = useState(new Set());
  const [versionModalOpen, setVersionModalOpen] = useState(false);
  const [selectedFloorPlan, setSelectedFloorPlan] = useState(null);

  useEffect(() => {
    loadFloorPlans();
    loadUnsyncedStatus();
  }, []);

  // Listen to sync events to update unsynced status
  useEffect(() => {
    const handleSyncEvent = (event) => {
      if (event.type === 'sync_completed' || event.type === 'sync_progress') {
        loadUnsyncedStatus();
      }
    };

    syncService.addListener(handleSyncEvent);
    return () => syncService.removeListener(handleSyncEvent);
  }, []);

  const loadUnsyncedStatus = async () => {
    const unsynced = await indexedDBService.getUnsyncedFloorPlans();
    const ids = new Set(unsynced.map(plan => plan.id));
    setUnsyncedIds(ids);
  };

  const loadFloorPlans = async () => {
    try {
      const response = await floorPlanService.getAll();
      if (response.success) {
        setFloorPlans(response.plans);
      }
    } catch (error) {
      console.error('Error loading floor plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this floor plan?')) {
      try {
        await floorPlanService.delete(id);
        loadFloorPlans(); // Reload list
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to delete floor plan');
      }
    }
  };

  const handlePublish = async (id) => {
    try {
      await floorPlanService.publish(id);
      loadFloorPlans(); // Reload list
      alert('Floor plan published successfully!');
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to publish floor plan');
    }
  };

  const handleUnpublish = async (id) => {
    if (window.confirm('Are you sure you want to unpublish this floor plan? It will no longer be visible to regular users.')) {
      try {
        await floorPlanService.unpublish(id);
        loadFloorPlans(); // Reload list
        alert('Floor plan unpublished successfully!');
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to unpublish floor plan');
      }
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleViewVersions = (plan) => {
    setSelectedFloorPlan(plan);
    setVersionModalOpen(true);
  };

  const handleVersionMerged = () => {
    loadFloorPlans(); // Reload to get updated pending counts
  };

  if (loading) {
    return <div className="loading">Loading floor plans...</div>;
  }

  return (
    <div className="floor-plan-list-page">
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
          <h1>Floor Plans</h1>
          {user?.role === 'admin' && (
            <button
              onClick={() => navigate('/floor-plan/new')}
              className="btn-create"
            >
              + Create New Floor Plan
            </button>
          )}
        </div>

        {floorPlans.length === 0 ? (
          <div className="empty-state">
            <h3>No floor plans yet</h3>
            <p>Create your first floor plan to get started</p>
            {user?.role === 'admin' && (
              <button
                onClick={() => navigate('/floor-plan/new')}
                className="btn-create-large"
              >
                Create Floor Plan
              </button>
            )}
          </div>
        ) : (
          <div className="floor-plans-grid">
            {floorPlans.map((plan) => (
              <div key={plan.id} className="floor-plan-card">
                <div className="card-header">
                  <h3>{plan.name}</h3>
                  <div className="header-badges">
                    <span className={`status-badge ${plan.status || 'draft'}`}>
                      {plan.status === 'published' ? '✓ Published' : '📝 Draft'}
                    </span>
                    {unsyncedIds.has(plan.id) && (
                      <span className="status-badge unsynced">
                        🟠 Unsynced
                      </span>
                    )}
                    {plan.has_pending_versions && user?.role === 'admin' && (
                      <span className="status-badge pending-versions">
                        ⚠️ {plan.pending_versions_count} Pending
                      </span>
                    )}
                    <span className="room-count">{plan.rooms?.length || 0} rooms</span>
                  </div>
                </div>

                <div className="card-info">
                  {plan.building_name && (
                    <div className="info-item">
                      <span className="label">Building:</span>
                      <span className="value">{plan.building_name}</span>
                    </div>
                  )}
                  {plan.floor_number && (
                    <div className="info-item">
                      <span className="label">Floor:</span>
                      <span className="value">{plan.floor_number}</span>
                    </div>
                  )}
                  <div className="info-item">
                    <span className="label">Created:</span>
                    <span className="value">
                      {new Date(plan.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div className="card-actions">
                  {user?.role === 'admin' ? (
                    <>
                      <button
                        onClick={() => navigate(`/floor-plan/${plan.id}`)}
                        className="btn-edit"
                      >
                        ✏️ Edit
                      </button>
                      {plan.status === 'published' && (
                        <button
                          onClick={() => handleViewVersions(plan)}
                          className="btn-versions"
                        >
                          📋 Versions
                        </button>
                      )}
                      {plan.status === 'draft' ? (
                        <button
                          onClick={() => handlePublish(plan.id)}
                          className="btn-publish"
                        >
                          📤 Publish
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUnpublish(plan.id)}
                          className="btn-unpublish"
                        >
                          📥 Unpublish
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(plan.id)}
                        className="btn-delete-card"
                      >
                        🗑️ Delete
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => navigate(`/floor-plan/${plan.id}/view`)}
                      className="btn-view"
                    >
                      👁️ View
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Version History Modal */}
      {versionModalOpen && selectedFloorPlan && (
        <VersionHistoryModal
          floorPlan={selectedFloorPlan}
          isOpen={versionModalOpen}
          onClose={() => {
            setVersionModalOpen(false);
            setSelectedFloorPlan(null);
          }}
          onVersionMerged={handleVersionMerged}
          currentUser={user}
        />
      )}
    </div>
  );
};

export default FloorPlanList;
