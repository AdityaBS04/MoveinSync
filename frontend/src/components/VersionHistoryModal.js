import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import versionService from '../services/versionService';
import './VersionHistoryModal.css';

const VersionHistoryModal = ({ floorPlan, isOpen, onClose, onVersionMerged, currentUser }) => {
  const navigate = useNavigate();
  const [versions, setVersions] = useState([]);
  const [pendingVersions, setPendingVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isHeadUser = currentUser?.priority === 1 || currentUser?.role === 'admin';

  // Handle version preview by storing in sessionStorage and navigating
  const handlePreviewVersion = (version) => {
    // Store version data in sessionStorage
    sessionStorage.setItem('versionPreview', JSON.stringify({
      ...version,
      floorPlanName: floorPlan.name
    }));
    // Navigate to a special preview route
    navigate(`/floor-plan/version-preview/${version.id}`);
  };

  useEffect(() => {
    if (isOpen && floorPlan) {
      loadVersions();
    }
  }, [isOpen, floorPlan]);

  const loadVersions = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load all versions
      const versionsData = await versionService.getVersions(floorPlan.id);

      // Parse rooms data if it's a string
      const parsedVersions = (versionsData.versions || []).map(version => ({
        ...version,
        rooms: typeof version.rooms === 'string' ? JSON.parse(version.rooms) : version.rooms
      }));
      setVersions(parsedVersions);

      // Load pending versions
      const pendingData = await versionService.getPendingVersions(floorPlan.id);

      // Parse rooms data for pending versions
      const parsedPendingVersions = (pendingData.versions || []).map(version => ({
        ...version,
        rooms: typeof version.rooms === 'string' ? JSON.parse(version.rooms) : version.rooms
      }));
      setPendingVersions(parsedPendingVersions);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load versions');
    } finally {
      setLoading(false);
    }
  };

  const handleMergeVersion = async (versionId) => {
    if (!window.confirm('Apply this version to the main floor plan? This will replace the current floor plan with this version\'s layout.')) {
      return;
    }

    try {
      const result = await versionService.mergeVersion(versionId);
      if (result.success) {
        alert('Version applied successfully! The main floor plan has been updated.');
        await loadVersions();
        if (onVersionMerged) onVersionMerged();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to apply version');
    }
  };

  const handleRejectVersion = async (versionId) => {
    if (!window.confirm('Reject this version? This action cannot be undone.')) {
      return;
    }

    try {
      const result = await versionService.rejectVersion(versionId);
      if (result.success) {
        alert('Version rejected successfully');
        await loadVersions();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject version');
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
      case 'pending': return 'status-pending';
      case 'merged': return 'status-merged';
      case 'rejected': return 'status-rejected';
      default: return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="version-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Version History - {floorPlan.name}</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        {loading ? (
          <div className="modal-loading">Loading versions...</div>
        ) : error ? (
          <div className="modal-error">{error}</div>
        ) : (
          <div className="modal-content">
            {/* Pending Versions Info */}
            {pendingVersions.length > 0 && (
              <div className="conflict-summary">
                <h3>📋 Pending Versions</h3>
                <p style={{margin: '10px 0', color: '#666'}}>
                  There {pendingVersions.length === 1 ? 'is' : 'are'} <strong>{pendingVersions.length}</strong> pending version{pendingVersions.length !== 1 ? 's' : ''} waiting for review.
                  Preview each version and choose which one to apply to the main floor plan.
                </p>
              </div>
            )}

            {/* Pending Versions Section */}
            {pendingVersions.length > 0 && (
              <div className="versions-section">
                <h3 className="section-title">
                  Pending Versions ({pendingVersions.length})
                </h3>
                <div className="versions-list">
                  {pendingVersions.map((version) => (
                    <div key={version.id} className="version-card pending">
                      <div className="version-header">
                        <div className="version-info">
                          <span className="version-number">v{version.version}</span>
                          <span className={`version-status ${getStatusBadgeClass(version.status)}`}>
                            {version.status}
                          </span>
                        </div>
                        <div className="version-meta">
                          <span className="version-priority">Priority: {version.priority || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="version-body">
                        <div className="version-detail">
                          <strong>Created by:</strong> {version.created_by_email || 'Unknown'}
                        </div>
                        <div className="version-detail">
                          <strong>Created:</strong> {formatDate(version.created_at)}
                        </div>
                        {version.change_description && (
                          <div className="version-detail">
                            <strong>Changes:</strong> {version.change_description}
                          </div>
                        )}
                        <div className="version-detail">
                          <strong>Rooms:</strong> {version.rooms?.length || 0} rooms
                        </div>

                        {/* Visual Preview of Floor Plan */}
                        {version.rooms && version.rooms.length > 0 && (
                          <div className="version-preview" style={{marginTop: '10px'}}>
                            <button
                              className="btn-preview-version"
                              onClick={() => handlePreviewVersion(version)}
                              style={{
                                padding: '8px 16px',
                                backgroundColor: '#2196F3',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '14px'
                              }}
                            >
                              🔍 View Full Floor Plan
                            </button>
                          </div>
                        )}
                      </div>

                      {isHeadUser && (
                        <div className="version-actions">
                          <button
                            className="btn-merge"
                            onClick={() => handleMergeVersion(version.id)}
                          >
                            ✓ Apply This Version
                          </button>
                          <button
                            className="btn-reject"
                            onClick={() => handleRejectVersion(version.id)}
                          >
                            × Reject
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* All Versions Section */}
            <div className="versions-section">
              <h3 className="section-title">
                All Versions ({versions.length})
              </h3>
              <div className="versions-list">
                {versions.length === 0 ? (
                  <div className="empty-state">No version history available</div>
                ) : (
                  versions.map((version) => (
                    <div key={version.id} className={`version-card ${version.status}`}>
                      <div className="version-header">
                        <div className="version-info">
                          <span className="version-number">v{version.version}</span>
                          <span className={`version-status ${getStatusBadgeClass(version.status)}`}>
                            {version.status}
                          </span>
                        </div>
                        <div className="version-meta">
                          <span className="version-priority">Priority: {version.priority || 'N/A'}</span>
                        </div>
                      </div>

                      <div className="version-body">
                        <div className="version-detail">
                          <strong>Created by:</strong> {version.created_by_email || 'Unknown'}
                        </div>
                        <div className="version-detail">
                          <strong>Created:</strong> {formatDate(version.created_at)}
                        </div>
                        {version.change_description && (
                          <div className="version-detail">
                            <strong>Changes:</strong> {version.change_description}
                          </div>
                        )}
                        {version.merged_by && (
                          <div className="version-detail">
                            <strong>Merged by:</strong> {version.merged_by_email} on {formatDate(version.merged_at)}
                          </div>
                        )}
                        {version.rejected_by && (
                          <div className="version-detail">
                            <strong>Rejected by:</strong> {version.rejected_by_email} on {formatDate(version.rejected_at)}
                          </div>
                        )}

                        {/* Visual Preview of Floor Plan for all versions */}
                        {version.rooms && version.rooms.length > 0 && (
                          <div className="version-preview" style={{marginTop: '10px'}}>
                            <button
                              className="btn-preview-version"
                              onClick={() => handlePreviewVersion(version)}
                              style={{
                                padding: '8px 16px',
                                backgroundColor: '#2196F3',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '14px'
                              }}
                            >
                              🔍 View Full Floor Plan
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        <div className="modal-footer">
          <button className="btn-close-footer" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default VersionHistoryModal;
