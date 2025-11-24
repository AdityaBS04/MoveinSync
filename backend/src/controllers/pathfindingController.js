const floorPlanModel = require('../models/floorPlanModel');
const PathfindingService = require('../services/pathfindingService');

const pathfindingController = {
  // Find path between two rooms
  findPath: (req, res) => {
    try {
      const { floorPlanId, startRoomId, endRoomId } = req.body;

      if (!floorPlanId || !startRoomId || !endRoomId) {
        return res.status(400).json({
          success: false,
          message: 'Floor plan ID, start room ID, and end room ID are required'
        });
      }

      // Get floor plan
      const floorPlan = floorPlanModel.findById(floorPlanId);
      if (!floorPlan) {
        return res.status(404).json({
          success: false,
          message: 'Floor plan not found'
        });
      }

      // Create pathfinding service
      const pathfinder = new PathfindingService(floorPlan);

      // Find path
      const result = pathfinder.findPath(startRoomId, endRoomId);

      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Pathfinding error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
};

module.exports = pathfindingController;
