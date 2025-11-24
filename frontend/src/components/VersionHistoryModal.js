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
  const [autoMerging, setAutoMerging] = useState(false);
  const [conflictAnalysis, setConflictAnalysis] = useState(null);

  const isHeadUser = currentUser?.priority === 1;

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

      // Analyze conflicts if there are pending versions
      if (parsedPendingVersions.length > 0) {
        const analysisData = await versionService.analyzeConflicts(floorPlan.id);
        setConflictAnalysis(analysisData);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load versions');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoMerge = async () => {
    if (!window.confirm('Auto-merge all pending versions? Non-conflicting changes will be merged automatically.')) {
      return;
    }

    setAutoMerging(true);
    try {
      const result = await versionService.autoMerge(floorPlan.id);

      if (result.success) {
        alert(`Successfully merged ${result.mergedVersions?.length || 0} versions!`);
        await loadVersions();
        if (onVersionMerged) onVersionMerged();
      } else if (result.hasConflicts) {
        alert(`Auto-merge completed with conflicts:\n${result.conflicts?.length || 0} conflicts require manual review.`);
        await loadVersions();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to auto-merge versions');
    } finally {
      setAutoMerging(false);
    }
  };

  const handleMergeVersion = async (versionId) => {
    if (!window.confirm('Manually merge this version? This will apply all changes from this version.')) {
      return;
    }

    try {
      const result = await versionService.mergeVersion(versionId);
      if (result.success) {
        alert('Version merged successfully!');
        await loadVersions();
        if (onVersionMerged) onVersionMerged();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to merge version');
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
            {/* Conflict Analysis Summary */}
            {conflictAnalysis && pendingVersions.length > 0 && (
              <div className="conflict-summary">
                <h3>Conflict Analysis</h3>
                <div className="conflict-stats">
                  <div className="stat">
                    <span className="stat-label">Pending Versions:</span>
                    <span className="stat-value">{pendingVersions.length}</span>
                  </div>
                  {conflictAnalysis.hasConflicts && (
                    <div className="stat conflict">
                      <span className="stat-label">Conflicts:</span>
                      <span className="stat-value">{conflictAnalysis.conflicts?.length || 0}</span>
                    </div>
                  )}
                  {conflictAnalysis.safeToAutoMerge && (
                    <div className="stat safe">
                      <span className="stat-label">Safe to Auto-Merge:</span>
                      <span className="stat-value">✓ Yes</span>
                    </div>
                  )}
                </div>

                {pendingVersions.length > 0 && (
                  <button
                    className="btn-auto-merge"
                    onClick={handleAutoMerge}
                    disabled={autoMerging}
                  >
                    {autoMerging ? '🔄 Auto-Merging...' : '⚡ Auto-Merge All Pending'}
                  </button>
                )}
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
                            <div
                              className="mini-canvas"
                              style={{marginTop: '5px', cursor: 'pointer', position: 'relative', display: 'none'}}
                              onClick={() => handlePreviewVersion(version)}
                              title="Click to view full size"
                            >
                              <svg width="200" height="150" viewBox="0 0 1200 800" style={{border: '1px solid #ddd', backgroundColor: '#f9f9f9', borderRadius: '4px'}}>
                                {version.rooms.map((room, idx) => (
                                  <g key={idx}>
                                    <rect
                                      x={room.x}
                                      y={room.y}
                                      width={room.width}
                                      height={room.height}
                                      fill={room.color || '#4CAF50'}
                                      stroke="#333"
                                      strokeWidth="2"
                                      opacity="0.7"
                                    />
                                    <text
                                      x={room.x + room.width / 2}
                                      y={room.y + room.height / 2}
                                      textAnchor="middle"
                                      fontSize="24"
                                      fill="#000"
                                      fontWeight="bold"
                                    >
                                      {room.name?.substring(0, 8) || ''}
                                    </text>
                                  </g>
                                ))}
                              </svg>
                              <div style={{
                                position: 'absolute',
                                top: '5px',
                                right: '5px',
                                background: 'rgba(0,0,0,0.6)',
                                color: 'white',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px'
                              }}>
                                🔍 Click to enlarge
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {isHeadUser && (
                        <div className="version-actions">
                          <button
                            className="btn-merge"
                            onClick={() => handleMergeVersion(version.id)}
                          >
                            ✓ Merge
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
                            <div
                              className="mini-canvas"
                              style={{marginTop: '5px', cursor: 'pointer', position: 'relative', display: 'none'}}
                              onClick={() => handlePreviewVersion(version)}
                              title="Click to view full size"
                            >
                              <svg width="200" height="150" viewBox="0 0 1200 800" style={{border: '1px solid #ddd', backgroundColor: '#f9f9f9', borderRadius: '4px'}}>
                                {version.rooms.map((room, idx) => (
                                  <g key={idx}>
                                    <rect
                                      x={room.x}
                                      y={room.y}
                                      width={room.width}
                                      height={room.height}
                                      fill={room.color || '#4CAF50'}
                                      stroke="#333"
                                      strokeWidth="2"
                                      opacity="0.7"
                                    />
                                    <text
                                      x={room.x + room.width / 2}
                                      y={room.y + room.height / 2}
                                      textAnchor="middle"
                                      fontSize="24"
                                      fill="#000"
                                      fontWeight="bold"
                                    >
                                      {room.name?.substring(0, 8) || ''}
                                    </text>
                                  </g>
                                ))}
                              </svg>
                              <div style={{
                                position: 'absolute',
                                top: '5px',
                                right: '5px',
                                background: 'rgba(0,0,0,0.6)',
                                color: 'white',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px'
                              }}>
                                🔍 Click to enlarge
                              </div>
                            </div>
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

      {/* Full-Size Preview Modal */}
      {previewVersion && (
        <div
          className="preview-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            padding: '20px'
          }}
          onClick={() => setPreviewVersion(null)}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '8px',
              padding: '20px',
              maxWidth: '90vw',
              maxHeight: '90vh',
              overflow: 'auto',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div>
                <h3 style={{margin: 0}}>Floor Plan Preview - Version {previewVersion.version}</h3>
                <p style={{margin: '5px 0 0 0', color: '#666'}}>
                  {previewVersion.rooms?.length || 0} rooms • Created by {previewVersion.created_by_email}
                </p>
              </div>
              <button
                onClick={() => setPreviewVersion(null)}
                style={{
                  background: '#f44336',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '8px 16px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                ✕ Close
              </button>
            </div>

            <div style={{
              border: '2px solid #ddd',
              borderRadius: '4px',
              overflow: 'auto',
              backgroundColor: '#f9f9f9'
            }}>
              <svg
                width="1200"
                height="800"
                viewBox="0 0 1200 800"
                style={{display: 'block', maxWidth: '100%', height: 'auto'}}
              >
                {/* Grid background */}
                <defs>
                  <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                    <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#e0e0e0" strokeWidth="1"/>
                  </pattern>
                </defs>
                <rect width="1200" height="800" fill="url(#grid)" />

                {/* Rooms */}
                {previewVersion.rooms && previewVersion.rooms.map((room, idx) => (
                  <g key={idx}>
                    <rect
                      x={room.x}
                      y={room.y}
                      width={room.width}
                      height={room.height}
                      fill={room.color || '#4CAF50'}
                      stroke="#333"
                      strokeWidth="3"
                      opacity="0.8"
                    />
                    <text
                      x={room.x + room.width / 2}
                      y={room.y + room.height / 2 - 10}
                      textAnchor="middle"
                      fontSize="20"
                      fill="#000"
                      fontWeight="bold"
                    >
                      {room.name || 'Room'}
                    </text>
                    <text
                      x={room.x + room.width / 2}
                      y={room.y + room.height / 2 + 15}
                      textAnchor="middle"
                      fontSize="14"
                      fill="#333"
                    >
                      {room.type}
                    </text>
                    <text
                      x={room.x + room.width / 2}
                      y={room.y + room.height / 2 + 32}
                      textAnchor="middle"
                      fontSize="12"
                      fill="#666"
                    >
                      {room.width} × {room.height}
                    </text>
                  </g>
                ))}
              </svg>
            </div>

            <div style={{marginTop: '15px', textAlign: 'center', color: '#666'}}>
              💡 <strong>Tip:</strong> Scroll to zoom and pan around the floor plan
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VersionHistoryModal;
