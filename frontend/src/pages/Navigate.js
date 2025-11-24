import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Stage, Layer, Rect, Text, Line, Circle } from 'react-konva';
import { ROOM_TYPES } from '../constants/roomTypes';
import './Navigate.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const Navigate = () => {
  const [floorPlans, setFloorPlans] = useState([]);
  const [selectedFloorPlan, setSelectedFloorPlan] = useState(null);
  const [startRoom, setStartRoom] = useState(null);
  const [endRoom, setEndRoom] = useState(null);
  const [path, setPath] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectingStart, setSelectingStart] = useState(false);
  const [selectingEnd, setSelectingEnd] = useState(false);
  const navigate = useNavigate();
  const stageRef = useRef(null);

  useEffect(() => {
    fetchFloorPlans();
  }, []);

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

  const handleFloorPlanChange = (e) => {
    const fpId = e.target.value;
    const fp = floorPlans.find(f => f.id === fpId);
    setSelectedFloorPlan(fp);
    setStartRoom(null);
    setEndRoom(null);
    setPath(null);
  };

  const handleRoomClick = (room) => {
    if (selectingStart) {
      setStartRoom(room);
      setSelectingStart(false);
      setPath(null);
    } else if (selectingEnd) {
      setEndRoom(room);
      setSelectingEnd(false);
      setPath(null);
    }
  };

  const findPath = async () => {
    if (!selectedFloorPlan || !startRoom || !endRoom) {
      alert('Please select floor plan, start room, and end room');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API_URL}/pathfinding/find-path`,
        {
          floorPlanId: selectedFloorPlan.id,
          startRoomId: startRoom.id,
          endRoomId: endRoom.id
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        setPath(response.data);
      } else {
        alert(response.data.message || 'Could not find path');
      }
    } catch (error) {
      console.error('Error finding path:', error);
      alert(error.response?.data?.message || 'Failed to find path');
    } finally {
      setLoading(false);
    }
  };

  const resetNavigation = () => {
    setStartRoom(null);
    setEndRoom(null);
    setPath(null);
    setSelectingStart(false);
    setSelectingEnd(false);
  };

  const getRoomColor = (room) => {
    const roomType = ROOM_TYPES[room.type];
    return roomType ? roomType.color : '#cccccc';
  };

  const isRoomSelected = (room) => {
    return (startRoom && startRoom.id === room.id) || (endRoom && endRoom.id === room.id);
  };

  const getPathPoints = () => {
    if (!path || !path.path) return [];

    // Flatten path array to [x1, y1, x2, y2, ...]
    const points = [];
    path.path.forEach(point => {
      points.push(point.x, point.y);
    });
    return points;
  };

  return (
    <div className="navigate-page">
      <div className="navigate-header">
        <h1>🧭 Navigation</h1>
        <button className="btn-back" onClick={() => navigate('/dashboard')}>
          🏠 Dashboard
        </button>
      </div>

      <div className="navigate-container">
        {/* Control Panel */}
        <div className="control-panel">
          <div className="section">
            <h3>1. Select Floor Plan</h3>
            <select
              value={selectedFloorPlan?.id || ''}
              onChange={handleFloorPlanChange}
              className="floor-plan-select"
            >
              <option value="">Choose a floor plan...</option>
              {floorPlans.map(fp => (
                <option key={fp.id} value={fp.id}>
                  {fp.name}
                </option>
              ))}
            </select>
          </div>

          {selectedFloorPlan && (
            <>
              <div className="section">
                <h3>2. Select Start & End Rooms</h3>

                <button
                  className={`btn-select ${selectingStart ? 'active' : ''}`}
                  onClick={() => {
                    setSelectingStart(true);
                    setSelectingEnd(false);
                  }}
                  disabled={!selectedFloorPlan}
                >
                  {startRoom ? `📍 Start: ${startRoom.name}` : '📍 Select Start Room'}
                </button>

                <button
                  className={`btn-select ${selectingEnd ? 'active' : ''}`}
                  onClick={() => {
                    setSelectingEnd(true);
                    setSelectingStart(false);
                  }}
                  disabled={!selectedFloorPlan}
                >
                  {endRoom ? `🎯 End: ${endRoom.name}` : '🎯 Select End Room'}
                </button>

                {(selectingStart || selectingEnd) && (
                  <p className="instruction">
                    👆 Click on a room in the canvas to select it
                  </p>
                )}
              </div>

              <div className="section">
                <h3>3. Find Path</h3>
                <button
                  className="btn-find-path"
                  onClick={findPath}
                  disabled={!startRoom || !endRoom || loading}
                >
                  {loading ? '🔍 Finding path...' : '🔍 Find Path'}
                </button>

                <button
                  className="btn-reset"
                  onClick={resetNavigation}
                >
                  🔄 Reset
                </button>
              </div>

              {path && (
                <div className="section path-info">
                  <h3>✅ Path Found!</h3>
                  <div className="info-item">
                    <span className="label">Distance:</span>
                    <span className="value">{path.distance} units</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Estimated Time:</span>
                    <span className="value">{path.estimatedTime} seconds</span>
                  </div>
                  <div className="info-item">
                    <span className="label">Steps:</span>
                    <span className="value">{Math.round(path.distance / 10)} steps</span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Canvas */}
        <div className="canvas-container">
          {selectedFloorPlan ? (
            <Stage
              ref={stageRef}
              width={selectedFloorPlan.canvas_width || 800}
              height={selectedFloorPlan.canvas_height || 600}
              style={{
                border: '2px solid #ddd',
                borderRadius: '8px',
                background: 'white'
              }}
            >
              <Layer>
                {/* Background */}
                <Rect
                  x={0}
                  y={0}
                  width={selectedFloorPlan.canvas_width || 800}
                  height={selectedFloorPlan.canvas_height || 600}
                  fill="#f9f9f9"
                />

                {/* Rooms */}
                {selectedFloorPlan.rooms.map(room => {
                  const roomType = ROOM_TYPES[room.type];
                  const isSelected = isRoomSelected(room);

                  return (
                    <React.Fragment key={room.id}>
                      <Rect
                        x={room.x}
                        y={room.y}
                        width={roomType?.width || 100}
                        height={roomType?.height || 100}
                        fill={getRoomColor(room)}
                        stroke={isSelected ? '#000' : '#333'}
                        strokeWidth={isSelected ? 4 : 2}
                        cornerRadius={5}
                        onClick={() => handleRoomClick(room)}
                        onTap={() => handleRoomClick(room)}
                        opacity={isSelected ? 1 : 0.8}
                        shadowBlur={isSelected ? 10 : 0}
                        shadowColor="black"
                      />
                      <Text
                        x={room.x}
                        y={room.y + (roomType?.height || 100) / 2 - 25}
                        width={roomType?.width || 100}
                        height={50}
                        text={`${roomType?.icon || ''}\n${room.name}`}
                        fontSize={14}
                        fontStyle="bold"
                        fill="#fff"
                        align="center"
                        verticalAlign="middle"
                        onClick={() => handleRoomClick(room)}
                        onTap={() => handleRoomClick(room)}
                      />
                    </React.Fragment>
                  );
                })}

                {/* Path Line */}
                {path && path.path && (
                  <>
                    <Line
                      points={getPathPoints()}
                      stroke="#FF6B6B"
                      strokeWidth={4}
                      lineCap="round"
                      lineJoin="round"
                      dash={[10, 5]}
                    />

                    {/* Path points as circles */}
                    {path.path.map((point, index) => (
                      <Circle
                        key={index}
                        x={point.x}
                        y={point.y}
                        radius={4}
                        fill="#FF6B6B"
                      />
                    ))}

                    {/* Start marker */}
                    {path.startRoom && (
                      <Circle
                        x={path.startRoom.position.x}
                        y={path.startRoom.position.y}
                        radius={15}
                        fill="#4CAF50"
                        stroke="#fff"
                        strokeWidth={3}
                      />
                    )}

                    {/* End marker */}
                    {path.endRoom && (
                      <Circle
                        x={path.endRoom.position.x}
                        y={path.endRoom.position.y}
                        radius={15}
                        fill="#2196F3"
                        stroke="#fff"
                        strokeWidth={3}
                      />
                    )}
                  </>
                )}
              </Layer>
            </Stage>
          ) : (
            <div className="empty-canvas">
              <p>📋 Select a floor plan to start navigation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navigate;
