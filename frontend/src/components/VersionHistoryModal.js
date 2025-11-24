import React, { useState, useEffect } from 'react';
import versionService from '../services/versionService';
import './VersionHistoryModal.css';

const VersionHistoryModal = ({ floorPlan, isOpen, onClose, onVersionMerged, currentUser }) => {
  const [versions, setVersions] = useState([]);
  const [pendingVersions, setPendingVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoMerging, setAutoMerging] = useState(false);
  const [conflictAnalysis, setConflictAnalysis] = useState(null);

  const isHeadUser = currentUser?.priority === 1;

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
      setVersions(versionsData.versions || []);

      // Load pending versions
      const pendingData = await versionService.getPendingVersions(floorPlan.id);
      setPendingVersions(pendingData.versions || []);

      // Analyze conflicts if there are pending versions
      if (pendingData.versions && pendingData.versions.length > 0) {
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
