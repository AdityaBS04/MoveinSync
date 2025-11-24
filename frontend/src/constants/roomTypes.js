// Pre-defined room types with fixed dimensions and colors
export const ROOM_TYPES = {
  meeting_room: {
    width: 150,
    height: 100,
    color: '#4CAF50',
    label: 'Meeting Room',
    icon: '🏢',
    capacity: 10
  },
  conference_room: {
    width: 200,
    height: 150,
    color: '#2196F3',
    label: 'Conference Room',
    icon: '👥',
    capacity: 25
  },
  washroom: {
    width: 80,
    height: 80,
    color: '#9C27B0',
    label: 'Washroom',
    icon: '🚻'
  },
  stairs: {
    width: 100,
    height: 60,
    color: '#FF9800',
    label: 'Stairs',
    icon: '🪜'
  },
  elevator: {
    width: 80,
    height: 80,
    color: '#607D8B',
    label: 'Elevator',
    icon: '🛗'
  },
  staff_room: {
    width: 120,
    height: 100,
    color: '#E91E63',
    label: 'Staff Room',
    icon: '👔'
  },
  pantry: {
    width: 100,
    height: 80,
    color: '#FF5722',
    label: 'Pantry',
    icon: '🍽️'
  },
  storage: {
    width: 90,
    height: 90,
    color: '#795548',
    label: 'Storage',
    icon: '📦'
  }
};

export const CANVAS_CONFIG = {
  width: 1200,
  height: 800,
  backgroundColor: '#f5f5f5',
  gridSize: 20
};
