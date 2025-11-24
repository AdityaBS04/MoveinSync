import React, { useState, useRef } from 'react';
import { Stage, Layer, Rect, Text, Group } from 'react-konva';
import { ROOM_TYPES, CANVAS_CONFIG } from '../../constants/roomTypes';
import { v4 as uuidv4 } from 'uuid';

const Room = ({ room, isSelected, onSelect, onDragEnd, onDelete, viewOnly = false }) => {
  const roomConfig = ROOM_TYPES[room.type];

  return (
    <Group
      x={room.x}
      y={room.y}
      draggable={!viewOnly}
      onClick={viewOnly ? undefined : onSelect}
      onTap={viewOnly ? undefined : onSelect}
      onDragEnd={viewOnly ? undefined : (e) => {
        onDragEnd(room.id, {
          x: e.target.x(),
          y: e.target.y()
        });
      }}
    >
      {/* Room Rectangle */}
      <Rect
        width={roomConfig.width}
        height={roomConfig.height}
        fill={roomConfig.color}
        stroke={isSelected ? '#FFD700' : '#333'}
        strokeWidth={isSelected ? 3 : 1}
        shadowBlur={isSelected ? 10 : 5}
        shadowOpacity={0.3}
        cornerRadius={4}
      />

      {/* Room Label */}
      <Text
        text={room.name || roomConfig.label}
        width={roomConfig.width}
        height={roomConfig.height}
        align="center"
        verticalAlign="middle"
        fontSize={14}
        fontStyle="bold"
        fill="white"
        shadowColor="black"
        shadowBlur={4}
        shadowOpacity={0.5}
      />

      {/* Room Icon */}
      <Text
        text={roomConfig.icon}
        x={roomConfig.width - 25}
        y={5}
        fontSize={16}
      />
    </Group>
  );
};

const FloorPlanCanvas = ({ rooms, setRooms, selectedRoomType, viewOnly = false }) => {
  const [selectedId, setSelectedId] = useState(null);
  const stageRef = useRef(null);

  const handleCanvasClick = (e) => {
    if (viewOnly) return; // Don't handle clicks in view-only mode

    // Check if clicked on empty canvas (Stage or background Rect)
    const clickedOnEmpty = e.target === e.target.getStage() ||
                          e.target.name() === 'background' ||
                          e.target.name() === 'grid';

    console.log('Canvas clicked:', {
      clickedOnEmpty,
      targetName: e.target.name(),
      selectedRoomType
    });

    if (clickedOnEmpty) {
      // If a room type is selected, place it on canvas
      if (selectedRoomType) {
        const stage = e.target.getStage();
        const pointerPosition = stage.getPointerPosition();

        const roomConfig = ROOM_TYPES[selectedRoomType];

        // Count existing rooms of this type
        const roomsOfType = rooms.filter(room => room.type === selectedRoomType);
        const roomNumber = roomsOfType.length + 1;

        const newRoom = {
          id: uuidv4(),
          type: selectedRoomType,
          x: pointerPosition.x - roomConfig.width / 2,
          y: pointerPosition.y - roomConfig.height / 2,
          name: `${roomConfig.label} ${roomNumber}`
        };

        console.log('Placing new room:', newRoom);
        setRooms([...rooms, newRoom]);
      } else {
        // Deselect any selected room
        setSelectedId(null);
      }
    }
  };

  const handleRoomDragEnd = (roomId, newPosition) => {
    setRooms(rooms.map(room =>
      room.id === roomId
        ? { ...room, x: newPosition.x, y: newPosition.y }
        : room
    ));
  };

  const handleDeleteSelected = () => {
    if (selectedId) {
      setRooms(rooms.filter(room => room.id !== selectedId));
      setSelectedId(null);
    }
  };

  // Handle keyboard delete
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        e.preventDefault();
        handleDeleteSelected();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedId]);

  const getSelectedRoom = () => {
    return rooms.find(room => room.id === selectedId);
  };

  return (
    <div style={{ position: 'relative', background: '#f5f5f5' }}>
      {!viewOnly && selectedId && (
        <div className="canvas-toolbar">
          <div className="selected-room-info">
            Selected: <strong>{getSelectedRoom()?.name}</strong>
          </div>
          <button onClick={handleDeleteSelected} className="btn-delete">
            🗑️ Delete
          </button>
        </div>
      )}

      <Stage
        width={CANVAS_CONFIG.width}
        height={CANVAS_CONFIG.height}
        ref={stageRef}
        onClick={viewOnly ? undefined : handleCanvasClick}
        onTap={viewOnly ? undefined : handleCanvasClick}
        style={{
          border: '2px solid #ddd',
          cursor: viewOnly ? 'default' : (selectedRoomType ? 'crosshair' : 'default')
        }}
      >
        <Layer>
          {/* Background */}
          <Rect
            name="background"
            x={0}
            y={0}
            width={CANVAS_CONFIG.width}
            height={CANVAS_CONFIG.height}
            fill={CANVAS_CONFIG.backgroundColor}
          />

          {/* Grid lines (optional) */}
          {[...Array(Math.floor(CANVAS_CONFIG.width / CANVAS_CONFIG.gridSize))].map((_, i) => (
            <React.Fragment key={`grid-v-${i}`}>
              <Rect
                name="grid"
                x={i * CANVAS_CONFIG.gridSize}
                y={0}
                width={1}
                height={CANVAS_CONFIG.height}
                fill="#e0e0e0"
                opacity={0.3}
              />
            </React.Fragment>
          ))}
          {[...Array(Math.floor(CANVAS_CONFIG.height / CANVAS_CONFIG.gridSize))].map((_, i) => (
            <React.Fragment key={`grid-h-${i}`}>
              <Rect
                name="grid"
                x={0}
                y={i * CANVAS_CONFIG.gridSize}
                width={CANVAS_CONFIG.width}
                height={1}
                fill="#e0e0e0"
                opacity={0.3}
              />
            </React.Fragment>
          ))}

          {/* Rooms */}
          {rooms.map((room) => (
            <Room
              key={room.id}
              room={room}
              isSelected={room.id === selectedId}
              onSelect={() => setSelectedId(room.id)}
              onDragEnd={handleRoomDragEnd}
              onDelete={handleDeleteSelected}
              viewOnly={viewOnly}
            />
          ))}
        </Layer>
      </Stage>
    </div>
  );
};

export default FloorPlanCanvas;
