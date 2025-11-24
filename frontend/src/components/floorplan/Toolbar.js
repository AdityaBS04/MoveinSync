import React from 'react';
import './Toolbar.css';

const Toolbar = ({ onSave, onClear, onBack, isSaving, roomCount, selectedRoomType }) => {
  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <button onClick={onBack} className="btn-back">
          ← Back to Dashboard
        </button>
        <div className="toolbar-info">
          <span className="room-count">Rooms: {roomCount}</span>
          {selectedRoomType && (
            <span className="selected-room-indicator">
              Selected: {selectedRoomType.replace('_', ' ').toUpperCase()}
            </span>
          )}
        </div>
      </div>

      <div className="toolbar-right">
        <button
          onClick={onClear}
          className="btn-clear"
          disabled={roomCount === 0}
        >
          🗑️ Clear All
        </button>
        <button
          onClick={onSave}
          className="btn-save"
          disabled={isSaving}
        >
          {isSaving ? '💾 Saving...' : '💾 Save Floor Plan'}
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
