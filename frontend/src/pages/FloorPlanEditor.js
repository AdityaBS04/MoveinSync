import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import RoomPalette from '../components/floorplan/RoomPalette';
import FloorPlanCanvas from '../components/floorplan/FloorPlanCanvas';
import Toolbar from '../components/floorplan/Toolbar';
import floorPlanService from '../services/floorPlanService';
import indexedDBService from '../services/indexedDBService';
import syncService from '../services/syncService';
import { useNetwork } from '../context/NetworkContext';
import './FloorPlanEditor.css';

const FloorPlanEditor = ({ viewOnly = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isOnline } = useNetwork();
  const [rooms, setRooms] = useState([]);
  const [selectedRoomType, setSelectedRoomType] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [floorPlanName, setFloorPlanName] = useState('');
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null); // 'syncing', 'synced', 'offline', 'failed'
  const [hasLocalChanges, setHasLocalChanges] = useState(false);
  const [floorPlanStatus, setFloorPlanStatus] = useState('draft'); // 'draft' or 'published'
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Track changes to rooms
  useEffect(() => {
    if (rooms.length > 0) {
      setHasUnsavedChanges(true);
    }
  }, [rooms]);

  // Load floor plan if editing existing one
  useEffect(() => {
    if (id) {
      loadFloorPlan();
    }
  }, [id]);

  // Listen to online status changes and trigger sync
  useEffect(() => {
    if (isOnline && id) {
      // When coming back online, trigger sync
      const timer = setTimeout(() => {
        syncService.syncAll();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, id]);

  // Listen to sync events
  useEffect(() => {
    const handleSyncEvent = (event) => {
      if (event.type === 'sync_started') {
        setSyncStatus('syncing');
      } else if (event.type === 'sync_completed') {
        setSyncStatus('synced');
        setTimeout(() => setSyncStatus(null), 3000); // Hide after 3 seconds
        if (id) {
          // Reload to get synced version
          loadFloorPlan();
        }
      } else if (event.type === 'sync_error') {
        setSyncStatus('failed');
      }
    };

    syncService.addListener(handleSyncEvent);
    return () => syncService.removeListener(handleSyncEvent);
  }, [id]);

  const loadFloorPlan = async () => {
    try {
      // Try loading from server first if online
      if (isOnline) {
        const response = await floorPlanService.getById(id);
        if (response.success) {
          setRooms(response.plan.rooms);
          setFloorPlanName(response.plan.name);
          setFloorPlanStatus(response.plan.status || 'draft');

          // Save to IndexedDB for offline access
          await indexedDBService.saveFloorPlan(response.plan, false);
          setHasLocalChanges(false);
        }
      } else {
        // Load from IndexedDB when offline
        const cached = await indexedDBService.getFloorPlan(id);
        if (cached) {
          setRooms(cached.data.rooms);
          setFloorPlanName(cached.data.name);
          setHasLocalChanges(cached.hasLocalChanges);
        } else {
          alert('Floor plan not available offline');
        }
      }
    } catch (error) {
      console.error('Error loading floor plan:', error);

      // Try loading from IndexedDB as fallback
      const cached = await indexedDBService.getFloorPlan(id);
      if (cached) {
        setRooms(cached.data.rooms);
        setFloorPlanName(cached.data.name);
        setHasLocalChanges(cached.hasLocalChanges);
      } else {
        alert('Failed to load floor plan');
      }
    }
  };

  const handleRoomSelect = (roomType) => {
    console.log('Room type selected:', roomType);
    setSelectedRoomType(roomType);
  };

  const handleSave = () => {
    if (!floorPlanName.trim()) {
      setShowNameDialog(true);
    } else {
      saveFloorPlan();
    }
  };

  const saveFloorPlan = async () => {
    setIsSaving(true);
    try {
      const planData = {
        name: floorPlanName,
        rooms: rooms
      };

      if (isOnline) {
        // ONLINE: Save to server
        let response;
        if (id) {
          // Update existing floor plan
          response = await floorPlanService.update(id, planData);
        } else {
          // Create new floor plan
          response = await floorPlanService.create(planData);
        }

        if (response.success) {
          // Check if a version was created (published floor plan)
          if (response.versionCreated) {
            alert('Changes submitted for review! Head user will review and merge your changes.');
            setShowNameDialog(false);
            setHasUnsavedChanges(false); // Reset unsaved changes flag
            navigate('/floor-plans');
            return;
          }

          // Save to IndexedDB as well
          await indexedDBService.saveFloorPlan(response.plan, false);
          setHasLocalChanges(false);
          setHasUnsavedChanges(false); // Reset unsaved changes flag
          setSyncStatus('synced');
          setTimeout(() => setSyncStatus(null), 3000);

          alert('Floor plan saved successfully!');
          setShowNameDialog(false);
          // Redirect to floor plans dashboard after successful save
          navigate('/floor-plans');
        }
      } else {
        // OFFLINE: Save to IndexedDB only
        if (!id) {
          alert('Cannot create new floor plans while offline. Please connect to the internet.');
          setIsSaving(false);
          return;
        }

        // Create floor plan object for offline storage
        const floorPlan = {
          id,
          name: floorPlanName,
          rooms: rooms,
          updated_at: new Date().toISOString()
        };

        // Save to IndexedDB with hasLocalChanges = true
        await indexedDBService.saveFloorPlan(floorPlan, true);
        setHasLocalChanges(true);
        setSyncStatus('offline');

        alert('Floor plan saved locally. Changes will sync when you\'re back online.');
        setShowNameDialog(false);
      }
    } catch (error) {
      console.error('Error saving floor plan:', error);

      // If online save failed, try saving offline as fallback
      if (id && isOnline) {
        try {
          const floorPlan = {
            id,
            name: floorPlanName,
            rooms: rooms,
            updated_at: new Date().toISOString()
          };
          await indexedDBService.saveFloorPlan(floorPlan, true);
          setHasLocalChanges(true);
          alert('Server error. Floor plan saved locally and will sync later.');
        } catch (offlineError) {
          alert(error.response?.data?.message || 'Failed to save floor plan');
        }
      } else {
        alert(error.response?.data?.message || 'Failed to save floor plan');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    if (window.confirm('Are you sure you want to clear all rooms? This cannot be undone.')) {
      setRooms([]);
      setSelectedRoomType(null);
    }
  };

  const handleBack = () => {
    if (hasUnsavedChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        navigate('/floor-plans');
      }
    } else {
      navigate('/floor-plans');
    }
  };

  return (
    <div className="floor-plan-editor">
      {/* Published Floor Plan Info Banner */}
      {!viewOnly && floorPlanStatus === 'published' && id && (
        <div className="sync-status-banner info persistent">
          ℹ️ This is a published floor plan. Your changes will be submitted for review by the head user.
        </div>
      )}

      {/* Network Status Banner */}
      {!viewOnly && syncStatus && (
        <div className={`sync-status-banner ${syncStatus}`}>
          {syncStatus === 'syncing' && '🔄 Syncing changes to server...'}
          {syncStatus === 'synced' && '✓ Changes synced to server'}
          {syncStatus === 'offline' && '🟠 Offline - Changes saved locally'}
          {syncStatus === 'failed' && '❌ Sync failed - Will retry automatically'}
        </div>
      )}
      {!viewOnly && !isOnline && !syncStatus && (
        <div className="sync-status-banner offline persistent">
          🟠 You are offline - Changes will be saved locally
        </div>
      )}
      {!viewOnly && hasLocalChanges && isOnline && (
        <div className="sync-status-banner warning persistent">
          ⚠️ You have unsynced changes
        </div>
      )}

      {!viewOnly && (
        <Toolbar
          onSave={handleSave}
          onClear={handleClear}
          onBack={handleBack}
          isSaving={isSaving}
          roomCount={rooms.length}
          selectedRoomType={selectedRoomType}
        />
      )}

      <div className="editor-container">
        {!viewOnly && <RoomPalette onRoomSelect={handleRoomSelect} />}

        <div className={`canvas-wrapper ${viewOnly ? 'view-only' : ''}`}>
          <div className="canvas-header">
            <h2>{floorPlanName || 'Floor Plan'}</h2>
            {viewOnly ? (
              <div className="view-only-actions">
                <button onClick={() => navigate('/floor-plans')} className="btn-back-list">
                  ← Back to Floor Plans
                </button>
              </div>
            ) : (
              <p className="canvas-instructions">
                {selectedRoomType
                  ? 'Click on the canvas to place the selected room'
                  : 'Select a room type from the palette, then click on the canvas to place it'}
              </p>
            )}
          </div>

          <FloorPlanCanvas
            rooms={rooms}
            setRooms={viewOnly ? () => {} : setRooms}
            selectedRoomType={viewOnly ? null : selectedRoomType}
            viewOnly={viewOnly}
          />

          {!viewOnly && (
            <div className="canvas-footer">
              <p>💡 <strong>Tips:</strong> Drag rooms to move them • Click a room to select it • Click the Delete button or press Delete/Backspace to remove selected room</p>
            </div>
          )}
        </div>
      </div>

      {/* Name Dialog */}
      {showNameDialog && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Save Floor Plan</h3>
            <p>Please enter a name for this floor plan:</p>
            <input
              type="text"
              value={floorPlanName}
              onChange={(e) => setFloorPlanName(e.target.value)}
              placeholder="e.g., Building A - Floor 1"
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter' && floorPlanName.trim()) {
                  saveFloorPlan();
                }
              }}
            />
            <div className="modal-actions">
              <button onClick={() => setShowNameDialog(false)} className="btn-cancel">
                Cancel
              </button>
              <button
                onClick={saveFloorPlan}
                className="btn-confirm"
                disabled={!floorPlanName.trim() || isSaving}
              >
                {isSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloorPlanEditor;
