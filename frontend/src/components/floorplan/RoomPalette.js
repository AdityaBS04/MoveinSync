import React from 'react';
import { ROOM_TYPES } from '../../constants/roomTypes';
import './RoomPalette.css';

const RoomPalette = ({ onRoomSelect }) => {
  return (
    <div className="room-palette">
      <h3>Room Types</h3>
      <p className="palette-hint">Click to select, then click on canvas to place</p>

      <div className="room-list">
        {Object.entries(ROOM_TYPES).map(([type, config]) => (
          <div
            key={type}
            className="room-type-item"
            onClick={() => onRoomSelect(type)}
          >
            <div
              className="room-preview"
              style={{
                backgroundColor: config.color,
                width: '60px',
                height: `${(config.height / config.width) * 60}px`
              }}
            >
              <span className="room-icon">{config.icon}</span>
            </div>
            <div className="room-info">
              <div className="room-label">{config.label}</div>
              <div className="room-size">
                {config.width} × {config.height}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoomPalette;
