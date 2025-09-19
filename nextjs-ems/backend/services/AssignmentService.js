/**
 * Assignment Service
 * Handles automatic visitor assignment and background tasks
 */

const Visitor = require('../models/Visitor');
const User = require('../models/User');
const ExecutiveService = require('../models/ExecutiveService');
const RegionAssignmentService = require('./RegionAssignmentService');
const { mapToMainService } = require('../utils/serviceMapping');

class AssignmentService {
  constructor() {
    this.isRunning = false;
    this.intervalId = null;
    this.checkInterval = 30 * 1000; // 30 seconds - check more frequently
  }

  /**
   * Start the background assignment checker
   */
  start() {
    if (this.isRunning) {
      console.log('🔄 Assignment service is already running');
      return;
    }

    console.log('🚀 Starting assignment service...');
    this.isRunning = true;
    
    // Run immediately on start to assign any existing unassigned visitors
    console.log('🔄 Running immediate assignment check...');
    this.checkAndAssignVisitors();
    
    // Also run region-based assignment
    console.log('🔄 Running region-based assignment check...');
    RegionAssignmentService.assignSalesExecutivesToUnassignedVisitors();
    
    // Then run every 30 seconds
    this.intervalId = setInterval(() => {
      this.checkAndAssignVisitors();
      // Also check for region-based assignments
      RegionAssignmentService.assignSalesExecutivesToUnassignedVisitors();
    }, this.checkInterval);
  }

  /**
   * Stop the background assignment checker
   */
  stop() {
    if (!this.isRunning) {
      console.log('⏹️ Assignment service is not running');
      return;
    }

    console.log('⏹️ Stopping assignment service...');
    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Check for unassigned visitors and assign them
   */
  async checkAndAssignVisitors() {
    try {
      console.log('🔍 AssignmentService: Checking for unassigned visitors...');
      
    // Get all visitors that need assignment (including those with empty agent fields)
    const unassignedVisitors = await Visitor.find({ 
      $or: [
        { assignedAgent: { $exists: false } },
        { assignedAgent: null },
        { agent: { $exists: false } },
        { agent: null },
        { agent: '' },
        { agentName: { $exists: false } },
        { agentName: null },
        { agentName: '' }
      ]
    });
    
    console.log(`🔍 AssignmentService: Found ${unassignedVisitors.length} visitors needing assignment`);

      if (unassignedVisitors.length === 0) {
        console.log('✅ No unassigned visitors found');
        return;
      }

      console.log(`👥 Found ${unassignedVisitors.length} unassigned visitors`);

      // Get all active service assignments
      const serviceAssignments = await ExecutiveService.find({ isActive: true });
      
      // Group by service
      const serviceToExecutives = {};
      serviceAssignments.forEach(assignment => {
        if (!serviceToExecutives[assignment.serviceName]) {
          serviceToExecutives[assignment.serviceName] = [];
        }
        serviceToExecutives[assignment.serviceName].push(assignment.executiveId);
      });

      let assignedCount = 0;
      let fallbackAssignedCount = 0;

      // Process each unassigned visitor
      for (const visitor of unassignedVisitors) {
        const mainService = mapToMainService(visitor.service);
        
        // Try to assign based on mapped service
        if (serviceToExecutives[mainService] && serviceToExecutives[mainService].length > 0) {
          const executiveIds = serviceToExecutives[mainService];
          const executiveIndex = assignedCount % executiveIds.length;
          const assignedExecutive = executiveIds[executiveIndex];
          
          const executive = await User.findById(assignedExecutive);
          if (executive) {
            await Visitor.findByIdAndUpdate(visitor._id, {
              assignedAgent: assignedExecutive,
              agent: executive.name,
              agentName: executive.name
            });
            assignedCount++;
            console.log(`✅ Auto-assigned visitor ${visitor._id} to ${executive.name} for ${mainService}`);
          }
        } else {
          // Fallback assignment - assign to any available executive
          const allExecutives = await User.find({ role: 'executive' });
          if (allExecutives.length > 0) {
            const fallbackIndex = fallbackAssignedCount % allExecutives.length;
            const fallbackExecutive = allExecutives[fallbackIndex];
            
            await Visitor.findByIdAndUpdate(visitor._id, {
              assignedAgent: fallbackExecutive._id,
              agent: fallbackExecutive.name || fallbackExecutive.username,
              agentName: fallbackExecutive.name || fallbackExecutive.username
            });
            fallbackAssignedCount++;
            console.log(`🔄 Auto fallback assigned visitor ${visitor._id} to ${fallbackExecutive.name || fallbackExecutive.username} (service: ${mainService})`);
          } else {
            console.log(`❌ No executives available for fallback assignment of visitor ${visitor._id}`);
          }
        }
      }

      console.log(`✅ Auto-assignment complete: ${assignedCount} service-based, ${fallbackAssignedCount} fallback assignments`);
    } catch (error) {
      console.error('❌ Error in background assignment check:', error);
    }
  }

  /**
   * Get assignment statistics
   */
  async getAssignmentStats() {
    try {
      const totalVisitors = await Visitor.countDocuments();
      const assignedVisitors = await Visitor.countDocuments({ 
        $and: [
          { assignedAgent: { $exists: true } },
          { assignedAgent: { $ne: null } }
        ]
      });
      const unassignedVisitors = totalVisitors - assignedVisitors;
      
      const serviceStats = await Visitor.aggregate([
        {
          $group: {
            _id: '$service',
            total: { $sum: 1 },
            assigned: {
              $sum: {
                $cond: [
                  { $and: [
                    { $ne: ['$assignedAgent', null] },
                    { $ne: ['$assignedAgent', undefined] }
                  ]},
                  1,
                  0
                ]
              }
            }
          }
        },
        {
          $addFields: {
            unassigned: { $subtract: ['$total', '$assigned'] }
          }
        }
      ]);

      return {
        totalVisitors,
        assignedVisitors,
        unassignedVisitors,
        serviceStats,
        isRunning: this.isRunning
      };
    } catch (error) {
      console.error('❌ Error getting assignment stats:', error);
      throw error;
    }
  }

  /**
   * Manually trigger assignment check
   */
  async triggerAssignmentCheck() {
    console.log('🔄 Manual assignment check triggered');
    await this.checkAndAssignVisitors();
  }
}

// Create singleton instance
const assignmentService = new AssignmentService();

module.exports = assignmentService;
