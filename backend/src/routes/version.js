const express = require('express');
const router = express.Router();
const versionController = require('../controllers/versionController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Get all versions for a floor plan
router.get('/floor-plan/:id/versions', versionController.getVersions);

// Get pending versions for a floor plan
router.get('/floor-plan/:id/pending', versionController.getPendingVersions);

// Analyze conflicts for a floor plan
router.get('/floor-plan/:id/analyze', versionController.analyzeConflicts);

// Auto-merge all pending versions for a floor plan
router.post('/floor-plan/:id/auto-merge', versionController.autoMerge);

// Compare two versions
router.get('/compare', versionController.compareVersions);

// Merge a specific version (head user only)
router.post('/:versionId/merge', versionController.mergeVersion);

// Reject a version (head user only)
router.post('/:versionId/reject', versionController.rejectVersion);

module.exports = router;
