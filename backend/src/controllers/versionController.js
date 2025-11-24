const floorPlanModel = require('../models/floorPlanModel');
const floorPlanVersionModel = require('../models/floorPlanVersionModel');
const conflictAnalyzer = require('../services/conflictAnalyzer');
const logger = require('../utils/logger');

const versionController = {
  // Get all versions for a floor plan
  getVersions: (req, res) => {
    try {
      const { id } = req.params;

      const versions = floorPlanVersionModel.findByFloorPlanId(id);

      res.json({
        success: true,
        versions
      });
    } catch (error) {
      console.error('Get versions error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  },

  // Get pending (unmerged) versions for a floor plan
  getPendingVersions: (req, res) => {
    try {
      const { id } = req.params;

      const versions = floorPlanVersionModel.getPendingVersions(id);

      res.json({
        success: true,
        count: versions.length,
        versions
      });
    } catch (error) {
      console.error('Get pending versions error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  },

  // Analyze conflicts between pending versions
  analyzeConflicts: (req, res) => {
    try {
      const { id } = req.params;

      const baseFloorPlan = floorPlanModel.findById(id);
      if (!baseFloorPlan) {
        return res.status(404).json({
          success: false,
          message: 'Floor plan not found'
        });
      }

      const pendingVersions = floorPlanVersionModel.getPendingVersions(id);

      if (pendingVersions.length === 0) {
        return res.json({
          success: true,
          message: 'No pending versions to analyze',
          analysis: null
        });
      }

      const analysis = conflictAnalyzer.analyzeVersions(baseFloorPlan, pendingVersions);
      const report = conflictAnalyzer.generateConflictReport(analysis);

      res.json({
        success: true,
        analysis: report
      });
    } catch (error) {
      console.error('Analyze conflicts error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  },

  // Auto-merge all pending versions
  autoMerge: (req, res) => {
    try {
      const { id } = req.params;

      // Only head user or admin can merge
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only admins can merge versions'
        });
      }

      const baseFloorPlan = floorPlanModel.findById(id);
      if (!baseFloorPlan) {
        return res.status(404).json({
          success: false,
          message: 'Floor plan not found'
        });
      }

      const pendingVersions = floorPlanVersionModel.getPendingVersions(id);

      if (pendingVersions.length === 0) {
        return res.json({
          success: false,
          message: 'No pending versions to merge'
        });
      }

      const mergeResult = conflictAnalyzer.autoMerge(baseFloorPlan, pendingVersions);

      if (!mergeResult.success) {
        return res.status(409).json({
          success: false,
          message: mergeResult.message,
          conflicts: mergeResult.conflicts
        });
      }

      // Apply merged floor plan
      const updated = floorPlanModel.update(id, {
        rooms: mergeResult.mergedFloorPlan.rooms,
        name: mergeResult.mergedFloorPlan.name
      });

      // Mark all pending versions as merged
      pendingVersions.forEach(version => {
        floorPlanVersionModel.merge(version.id, req.user.userId);
        // Log each auto-merged version
        logger.logVersion(req.user, 'auto_merge', version, baseFloorPlan, req, {
          mergedVersionCount: mergeResult.mergedVersionCount,
          appliedChanges: mergeResult.appliedChanges.length
        });
      });

      res.json({
        success: true,
        message: `Successfully auto-merged ${mergeResult.mergedVersionCount} versions`,
        floorPlan: updated,
        details: {
          appliedChanges: mergeResult.appliedChanges.length,
          mergedVersions: mergeResult.mergedVersionCount
        }
      });
    } catch (error) {
      console.error('Auto-merge error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  },

  // Merge a specific version (head user only)
  mergeVersion: (req, res) => {
    try {
      const { versionId } = req.params;

      // Check if head user (priority 1) or admin
      if (req.user.priority !== 1 && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only head user can manually merge versions'
        });
      }

      const version = floorPlanVersionModel.findById(versionId);
      if (!version) {
        return res.status(404).json({
          success: false,
          message: 'Version not found'
        });
      }

      if (version.status !== 'draft' && version.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: `Version is already ${version.status}`
        });
      }

      const floorPlan = floorPlanModel.findById(version.floor_plan_id);

      // Apply version to floor plan
      const updated = floorPlanModel.update(floorPlan.id, {
        rooms: version.rooms,
        name: version.name
      });

      // Mark version as merged
      floorPlanVersionModel.merge(versionId, req.user.userId);

      // Log version merge
      logger.logVersion(req.user, 'merge', version, floorPlan, req);

      res.json({
        success: true,
        message: 'Version merged successfully',
        floorPlan: updated
      });
    } catch (error) {
      console.error('Merge version error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  },

  // Reject a version (head user only)
  rejectVersion: (req, res) => {
    try {
      const { versionId } = req.params;
      const { reason } = req.body;

      // Check if head user (priority 1) or admin
      if (req.user.priority !== 1 && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only head user can reject versions'
        });
      }

      const version = floorPlanVersionModel.findById(versionId);
      if (!version) {
        return res.status(404).json({
          success: false,
          message: 'Version not found'
        });
      }

      if (version.status !== 'draft' && version.status !== 'pending') {
        return res.status(400).json({
          success: false,
          message: `Version is already ${version.status}`
        });
      }

      // Mark version as rejected
      floorPlanVersionModel.reject(versionId, req.user.userId);

      // Log version rejection
      const floorPlan = floorPlanModel.findById(version.floor_plan_id);
      logger.logVersion(req.user, 'reject', version, floorPlan, req, { reason });

      res.json({
        success: true,
        message: 'Version rejected successfully'
      });
    } catch (error) {
      console.error('Reject version error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  },

  // Compare two versions side-by-side
  compareVersions: (req, res) => {
    try {
      const { versionId1, versionId2 } = req.query;

      if (!versionId1 || !versionId2) {
        return res.status(400).json({
          success: false,
          message: 'Please provide both versionId1 and versionId2'
        });
      }

      const version1 = floorPlanVersionModel.findById(versionId1);
      const version2 = floorPlanVersionModel.findById(versionId2);

      if (!version1 || !version2) {
        return res.status(404).json({
          success: false,
          message: 'One or both versions not found'
        });
      }

      // Analyze differences
      const added1 = version1.rooms.filter(r1 => !version2.rooms.some(r2 => r2.id === r1.id));
      const added2 = version2.rooms.filter(r2 => !version1.rooms.some(r1 => r1.id === r2.id));
      const modified = [];

      version1.rooms.forEach(r1 => {
        const r2 = version2.rooms.find(r => r.id === r1.id);
        if (r2) {
          const differences = [];
          if (r1.x !== r2.x || r1.y !== r2.y) differences.push('position');
          if (r1.name !== r2.name) differences.push('name');
          if (r1.type !== r2.type) differences.push('type');

          if (differences.length > 0) {
            modified.push({
              roomId: r1.id,
              version1: r1,
              version2: r2,
              differences
            });
          }
        }
      });

      res.json({
        success: true,
        comparison: {
          version1: {
            id: version1.id,
            creator: version1.creator_name,
            priority: version1.creator_priority,
            created_at: version1.created_at,
            addedRooms: added1,
            totalRooms: version1.rooms.length
          },
          version2: {
            id: version2.id,
            creator: version2.creator_name,
            priority: version2.creator_priority,
            created_at: version2.created_at,
            addedRooms: added2,
            totalRooms: version2.rooms.length
          },
          differences: {
            addedInVersion1: added1.length,
            addedInVersion2: added2.length,
            modified: modified.length,
            modifiedRooms: modified
          }
        }
      });
    } catch (error) {
      console.error('Compare versions error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }
};

module.exports = versionController;
