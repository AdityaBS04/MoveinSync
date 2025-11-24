import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import FloorPlanCanvas from '../components/floorplan/FloorPlanCanvas';
import './FloorPlanEditor.css';

const VersionPreview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [versionData, setVersionData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load version data from sessionStorage
    const storedData = sessionStorage.getItem('versionPreview');
    if (storedData) {
      try {
        const data = JSON.parse(storedData);
        setVersionData(data);

        // Parse rooms if they're stored as string
        const parsedRooms = typeof data.rooms === 'string'
          ? JSON.parse(data.rooms)
          : data.rooms || [];

        setRooms(parsedRooms);
      } catch (error) {
        console.error('Error parsing version data:', error);
        alert('Failed to load version preview');
        navigate('/floor-plans');
      }
    } else {
      alert('No version data found');
      navigate('/floor-plans');
    }
    setLoading(false);
  }, [id, navigate]);

  const handleBack = () => {
    // Clear sessionStorage and go back
    sessionStorage.removeItem('versionPreview');
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="floor-plan-editor">
        <div className="loading-state">Loading version preview...</div>
      </div>
    );
  }

  if (!versionData) {
    return null;
  }

  return (
    <div className="floor-plan-editor">
      {/* Version Info Banner */}
      <div className="sync-status-banner info persistent">
        📋 Version Preview - Created by {versionData.created_by} on {new Date(versionData.created_at).toLocaleString()}
      </div>

      <div className="editor-container">
        <div className="canvas-wrapper view-only">
          <div className="canvas-header">
            <h2>{versionData.floorPlanName || 'Floor Plan'} - Version {versionData.version_number}</h2>
            <div className="view-only-actions">
              <button onClick={handleBack} className="btn-back-list">
                ← Back
              </button>
            </div>
          </div>

          <FloorPlanCanvas
            rooms={rooms}
            setRooms={() => {}}
            selectedRoomType={null}
            viewOnly={true}
          />

          <div className="canvas-footer">
            <p>
              <strong>Version Details:</strong> {rooms.length} room(s) •
              Status: {versionData.status} •
              {versionData.notes && ` Notes: ${versionData.notes}`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VersionPreview;
