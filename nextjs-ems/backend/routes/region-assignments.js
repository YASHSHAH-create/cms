const express = require('express');
const { connectMongo } = require('../config/mongo');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const RegionAssignmentService = require('../services/RegionAssignmentService');
const User = require('../models/User');

const router = express.Router();

/**
 * GET /api/region-assignments
 * Get all region assignments with their sales executives
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    await connectMongo();
    
    const regionAssignments = await RegionAssignmentService.getRegionAssignments();
    
    res.json({
      success: true,
      data: regionAssignments
    });
  } catch (error) {
    console.error('❌ Error fetching region assignments:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch region assignments',
      details: error.message
    });
  }
});

/**
 * GET /api/region-assignments/:region
 * Get sales executives for a specific region
 */
router.get('/:region', authenticateToken, async (req, res) => {
  try {
    await connectMongo();
    
    const { region } = req.params;
    const executives = await RegionAssignmentService.getSalesExecutivesByRegion(region);
    
    res.json({
      success: true,
      data: executives
    });
  } catch (error) {
    console.error('❌ Error fetching executives for region:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch executives for region',
      details: error.message
    });
  }
});

/**
 * PUT /api/region-assignments/executive/:executiveId
 * Update sales executive region assignment (Admin only)
 */
router.put('/executive/:executiveId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await connectMongo();
    
    const { executiveId } = req.params;
    const { region } = req.body;
    
    if (!region) {
      return res.status(400).json({
        success: false,
        error: 'Region is required'
      });
    }
    
    const executive = await RegionAssignmentService.updateExecutiveRegion(executiveId, region);
    
    res.json({
      success: true,
      message: 'Executive region updated successfully',
      data: executive
    });
  } catch (error) {
    console.error('❌ Error updating executive region:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update executive region',
      details: error.message
    });
  }
});

/**
 * POST /api/region-assignments/assign
 * Manually trigger region-based assignment for unassigned visitors (Admin only)
 */
router.post('/assign', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await connectMongo();
    
    const result = await RegionAssignmentService.assignSalesExecutivesToUnassignedVisitors();
    
    res.json({
      success: true,
      message: 'Region-based assignment completed',
      data: result
    });
  } catch (error) {
    console.error('❌ Error in region-based assignment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to perform region-based assignment',
      details: error.message
    });
  }
});

/**
 * POST /api/region-assignments/reassign
 * Reassign all visitors by region (Admin only)
 */
router.post('/reassign', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await connectMongo();
    
    const result = await RegionAssignmentService.reassignAllVisitorsByRegion();
    
    res.json({
      success: true,
      message: 'All visitors reassigned by region',
      data: result
    });
  } catch (error) {
    console.error('❌ Error reassigning visitors by region:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reassign visitors by region',
      details: error.message
    });
  }
});

/**
 * GET /api/region-assignments/executives/all
 * Get all executives with their region assignments
 */
router.get('/executives/all', authenticateToken, async (req, res) => {
  try {
    await connectMongo();
    
    const executives = await User.find({ role: 'executive' })
      .select('_id name email region')
      .sort({ name: 1 });
    
    res.json({
      success: true,
      data: executives
    });
  } catch (error) {
    console.error('❌ Error fetching all executives:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch executives',
      details: error.message
    });
  }
});

module.exports = router;
