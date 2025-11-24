// A* Pathfinding Algorithm for floor plan navigation

class PathfindingService {
  constructor(floorPlan) {
    this.floorPlan = floorPlan;
    this.rooms = floorPlan.rooms || [];
    this.gridSize = 20; // Grid cell size for pathfinding
    this.canvasWidth = floorPlan.canvas_width || 1200;
    this.canvasHeight = floorPlan.canvas_height || 800;
  }

  // Find path between two rooms
  findPath(startRoomId, endRoomId) {
    const startRoom = this.rooms.find(r => r.id === startRoomId);
    const endRoom = this.rooms.find(r => r.id === endRoomId);

    if (!startRoom || !endRoom) {
      return { success: false, message: 'Room not found' };
    }

    // Get center points of rooms
    const start = this.getRoomCenter(startRoom);
    const end = this.getRoomCenter(endRoom);

    // Run A* algorithm
    const path = this.aStar(start, end);

    if (!path) {
      return { success: false, message: 'No path found' };
    }

    // Calculate distance and estimated time
    const distance = this.calculatePathDistance(path);
    const estimatedTime = Math.ceil(distance / 50); // Assuming 50 pixels per second walking speed

    return {
      success: true,
      path,
      distance: Math.round(distance),
      estimatedTime, // in seconds
      startRoom: {
        id: startRoom.id,
        name: startRoom.name,
        position: start
      },
      endRoom: {
        id: endRoom.id,
        name: endRoom.name,
        position: end
      }
    };
  }

  // Get center point of a room
  getRoomCenter(room) {
    const ROOM_TYPES = {
      meeting_room: { width: 150, height: 100 },
      conference_room: { width: 200, height: 150 },
      washroom: { width: 80, height: 80 },
      stairs: { width: 100, height: 60 },
      elevator: { width: 80, height: 80 },
      staff_room: { width: 120, height: 100 },
      pantry: { width: 100, height: 80 },
      storage: { width: 90, height: 90 }
    };

    const config = ROOM_TYPES[room.type] || { width: 100, height: 100 };
    return {
      x: room.x + config.width / 2,
      y: room.y + config.height / 2
    };
  }

  // A* Algorithm implementation
  aStar(start, end) {
    const openSet = [{ ...start, g: 0, h: this.heuristic(start, end), f: this.heuristic(start, end), parent: null }];
    const closedSet = [];
    const visited = new Set();

    while (openSet.length > 0) {
      // Get node with lowest f score
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift();

      // Check if we reached the goal
      if (this.distance(current, end) < this.gridSize) {
        return this.reconstructPath(current);
      }

      const key = `${Math.round(current.x)},${Math.round(current.y)}`;
      if (visited.has(key)) continue;
      visited.add(key);

      closedSet.push(current);

      // Get neighbors
      const neighbors = this.getNeighbors(current);

      for (const neighbor of neighbors) {
        const neighborKey = `${Math.round(neighbor.x)},${Math.round(neighbor.y)}`;
        if (visited.has(neighborKey)) continue;

        // Check if neighbor collides with a room
        if (this.collidesWithRoom(neighbor)) continue;

        const g = current.g + this.distance(current, neighbor);
        const h = this.heuristic(neighbor, end);
        const f = g + h;

        const existingNode = openSet.find(n =>
          Math.abs(n.x - neighbor.x) < 1 && Math.abs(n.y - neighbor.y) < 1
        );

        if (!existingNode || g < existingNode.g) {
          if (existingNode) {
            existingNode.g = g;
            existingNode.h = h;
            existingNode.f = f;
            existingNode.parent = current;
          } else {
            openSet.push({ ...neighbor, g, h, f, parent: current });
          }
        }
      }
    }

    // No path found, return straight line
    return [start, end];
  }

  // Get neighboring points (only North, South, East, West - no diagonals)
  getNeighbors(point) {
    const step = this.gridSize;
    return [
      { x: point.x + step, y: point.y },      // Right (East)
      { x: point.x - step, y: point.y },      // Left (West)
      { x: point.x, y: point.y + step },      // Down (South)
      { x: point.x, y: point.y - step }       // Up (North)
    ].filter(p =>
      p.x >= 0 && p.x <= this.canvasWidth &&
      p.y >= 0 && p.y <= this.canvasHeight
    );
  }

  // Check if point collides with any room (except start and end)
  collidesWithRoom(point) {
    const ROOM_TYPES = {
      meeting_room: { width: 150, height: 100 },
      conference_room: { width: 200, height: 150 },
      washroom: { width: 80, height: 80 },
      stairs: { width: 100, height: 60 },
      elevator: { width: 80, height: 80 },
      staff_room: { width: 120, height: 100 },
      pantry: { width: 100, height: 80 },
      storage: { width: 90, height: 90 }
    };

    for (const room of this.rooms) {
      const config = ROOM_TYPES[room.type] || { width: 100, height: 100 };
      // Add small padding around rooms
      const padding = 10;
      if (
        point.x > room.x - padding &&
        point.x < room.x + config.width + padding &&
        point.y > room.y - padding &&
        point.y < room.y + config.height + padding
      ) {
        // Check if point is inside room center (allowed)
        const centerX = room.x + config.width / 2;
        const centerY = room.y + config.height / 2;
        const distToCenter = Math.sqrt(
          Math.pow(point.x - centerX, 2) + Math.pow(point.y - centerY, 2)
        );
        if (distToCenter < Math.min(config.width, config.height) / 3) {
          return false; // Inside room center, allowed
        }
        return true; // Collides with room
      }
    }
    return false;
  }

  // Heuristic function (Manhattan distance for grid-based pathfinding)
  heuristic(a, b) {
    return Math.abs(b.x - a.x) + Math.abs(b.y - a.y);
  }

  // Calculate distance between two points (for actual path distance)
  distance(a, b) {
    return Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
  }

  // Reconstruct path from A* result
  reconstructPath(node) {
    const path = [];
    let current = node;
    while (current) {
      path.unshift({ x: current.x, y: current.y });
      current = current.parent;
    }
    return path;
  }

  // Calculate total path distance
  calculatePathDistance(path) {
    let total = 0;
    for (let i = 0; i < path.length - 1; i++) {
      total += this.distance(path[i], path[i + 1]);
    }
    return total;
  }
}

module.exports = PathfindingService;
