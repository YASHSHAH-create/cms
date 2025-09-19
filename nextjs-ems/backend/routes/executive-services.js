const express = require('express');
const router = express.Router();
const ExecutiveService = require('../models/ExecutiveService');
const User = require('../models/User');
const Visitor = require('../models/Visitor');
const { authenticateToken, requireAdmin, requireAdminOrExecutive } = require('../middleware/auth');
const { mapToMainService, getMainServices } = require('../utils/serviceMapping');
const assignmentService = require('../services/AssignmentService');

// Get all unique services from visitors
router.get('/services', authenticateToken, requireAdminOrExecutive, async (req, res) => {
  try {
    // Use the main services from service mapping utility
    const services = getMainServices();
    res.json({ services: services.sort() });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// Get services assigned to a specific executive
router.get('/executive/:executiveId', authenticateToken, requireAdminOrExecutive, async (req, res) => {
  try {
    const { executiveId } = req.params;
    
    const assignedServices = await ExecutiveService.find({
      executiveId,
      isActive: true
    }).select('serviceName assignedAt');
    
    res.json({ assignedServices });
  } catch (error) {
    console.error('Error fetching executive services:', error);
    res.status(500).json({ error: 'Failed to fetch executive services' });
  }
});

// Assign services to an executive
router.post('/assign', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('🔍 Assignment request received:', req.body);
    console.log('🔍 User info:', req.user);
    
    const { executiveId, services } = req.body;
    const assignedBy = req.user.userId || req.user.id;

    if (!executiveId || !services) {
      return res.status(400).json({ error: 'executiveId and services are required' });
    }

    // Validate executive exists and is an executive
    const executive = await User.findById(executiveId);
    if (!executive || executive.role !== 'executive') {
      return res.status(400).json({ error: 'Invalid executive' });
    }

    console.log('🔍 Executive found:', executive.name);

    // Remove existing assignments for this executive
    await ExecutiveService.updateMany(
      { executiveId },
      { isActive: false }
    );

    // Create new assignments
    const assignments = services.map(serviceName => ({
      executiveId,
      serviceName,
      assignedBy,
      isActive: true
    }));

    console.log('🔍 Creating assignments:', assignments);
    await ExecutiveService.insertMany(assignments);
    console.log('🔍 Assignments created successfully');

    // Update visitors with round-robin assignment
    await updateVisitorAssignments();
    console.log('🔍 Visitor assignments updated');

    res.json({ message: 'Services assigned successfully' });
  } catch (error) {
    console.error('❌ Error assigning services:', error);
    res.status(500).json({ error: 'Failed to assign services', details: error.message });
  }
});

// Get all executives with their assigned services
router.get('/all-assignments', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const executives = await User.find({ role: 'executive' }).select('_id name email');
    
    const assignments = await Promise.all(
      executives.map(async (executive) => {
        const services = await ExecutiveService.find({
          executiveId: executive._id,
          isActive: true
        }).select('serviceName');
        
        return {
          executiveId: executive._id,
          executiveName: executive.name,
          executiveEmail: executive.email,
          assignedServices: services.map(s => s.serviceName)
        };
      })
    );

    res.json({ assignments });
  } catch (error) {
    console.error('Error fetching all assignments:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// Helper function to update visitor assignments using round-robin with service mapping
async function updateVisitorAssignments() {
  try {
    console.log('🔄 Starting visitor assignment process...');
    
    // Get all active service assignments
    const serviceAssignments = await ExecutiveService.find({ isActive: true });
    console.log(`📋 Found ${serviceAssignments.length} active service assignments`);
    
    // Group by service
    const serviceToExecutives = {};
    serviceAssignments.forEach(assignment => {
      if (!serviceToExecutives[assignment.serviceName]) {
        serviceToExecutives[assignment.serviceName] = [];
      }
      serviceToExecutives[assignment.serviceName].push(assignment.executiveId);
    });

    // Get all unassigned visitors
    const unassignedVisitors = await Visitor.find({ 
      $or: [
        { assignedAgent: { $exists: false } },
        { assignedAgent: null }
      ]
    });
    console.log(`👥 Found ${unassignedVisitors.length} unassigned visitors`);

    let assignedCount = 0;
    let fallbackAssignedCount = 0;

    // Process each unassigned visitor
    for (const visitor of unassignedVisitors) {
      const mainService = mapToMainService(visitor.service);
      console.log(`🔍 Visitor ${visitor._id}: "${visitor.service}" -> "${mainService}"`);
      
      // Try to assign based on mapped service
      if (serviceToExecutives[mainService] && serviceToExecutives[mainService].length > 0) {
        const executiveIds = serviceToExecutives[mainService];
        const executiveIndex = assignedCount % executiveIds.length;
        const assignedExecutive = executiveIds[executiveIndex];
        
        const executive = await User.findById(assignedExecutive);
        if (executive) {
          await Visitor.findByIdAndUpdate(visitor._id, {
            assignedAgent: assignedExecutive,
            agent: executive.name
          });
          assignedCount++;
          console.log(`✅ Assigned visitor ${visitor._id} to ${executive.name} for ${mainService}`);
        }
      } else {
        // Fallback assignment - assign to any available executive
        const allExecutives = await User.find({ role: 'executive' });
        if (allExecutives.length > 0) {
          const fallbackIndex = fallbackAssignedCount % allExecutives.length;
          const fallbackExecutive = allExecutives[fallbackIndex];
          
          await Visitor.findByIdAndUpdate(visitor._id, {
            assignedAgent: fallbackExecutive._id,
            agent: fallbackExecutive.name
          });
          fallbackAssignedCount++;
          console.log(`🔄 Fallback assigned visitor ${visitor._id} to ${fallbackExecutive.name} (service: ${mainService})`);
        }
      }
    }

    console.log(`✅ Assignment complete: ${assignedCount} service-based, ${fallbackAssignedCount} fallback assignments`);
  } catch (error) {
    console.error('❌ Error updating visitor assignments:', error);
  }
}

// Admin endpoint to manually trigger visitor reassignment
router.post('/reassign-visitors', authenticateToken, requireAdmin, async (req, res) => {
  try {
    console.log('🔄 Manual visitor reassignment triggered by admin');
    await assignmentService.triggerAssignmentCheck();
    res.json({ message: 'Visitor reassignment completed successfully' });
  } catch (error) {
    console.error('❌ Error in manual reassignment:', error);
    res.status(500).json({ error: 'Failed to reassign visitors', details: error.message });
  }
});

// Admin endpoint to get assignment statistics
router.get('/assignment-stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const stats = await assignmentService.getAssignmentStats();
    res.json(stats);
  } catch (error) {
    console.error('❌ Error fetching assignment stats:', error);
    res.status(500).json({ error: 'Failed to fetch assignment statistics' });
  }
});

// Admin endpoint to control assignment service
router.post('/assignment-service/:action', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { action } = req.params;
    
    switch (action) {
      case 'start':
        assignmentService.start();
        res.json({ message: 'Assignment service started' });
        break;
      case 'stop':
        assignmentService.stop();
        res.json({ message: 'Assignment service stopped' });
        break;
      case 'status':
        const stats = await assignmentService.getAssignmentStats();
        res.json({ 
          isRunning: assignmentService.isRunning,
          ...stats
        });
        break;
      default:
        res.status(400).json({ error: 'Invalid action. Use: start, stop, or status' });
    }
  } catch (error) {
    console.error('❌ Error controlling assignment service:', error);
    res.status(500).json({ error: 'Failed to control assignment service' });
  }
});

module.exports = router;
