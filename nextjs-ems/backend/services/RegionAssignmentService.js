const User = require('../models/User');
const Visitor = require('../models/Visitor');

/**
 * Service for managing region-based sales executive assignments
 */
class RegionAssignmentService {
  constructor() {
    this.isRunning = false;
  }

  /**
   * Assign sales executive to visitor based on region
   * @param {Object} visitor - Visitor object
   * @returns {Promise<Object>} - Updated visitor with sales executive assignment
   */
  async assignSalesExecutiveByRegion(visitor) {
    try {
      if (!visitor.region) {
        console.log(`⚠️ Visitor ${visitor._id} has no region specified`);
        return visitor;
      }

      // Find sales executives assigned to this region
      const salesExecutives = await User.find({ 
        role: 'executive',
        region: visitor.region 
      });

      if (salesExecutives.length === 0) {
        console.log(`⚠️ No sales executives found for region: ${visitor.region}`);
        return visitor;
      }

      // Use round-robin assignment based on visitor ID for consistency
      const executiveIndex = visitor._id.toString().charCodeAt(0) % salesExecutives.length;
      const assignedExecutive = salesExecutives[executiveIndex];

      // Update visitor with sales executive assignment
      const updatedVisitor = await Visitor.findByIdAndUpdate(
        visitor._id,
        {
          salesExecutive: assignedExecutive._id,
          salesExecutiveName: assignedExecutive.name
        },
        { new: true }
      );

      console.log(`✅ Assigned visitor ${visitor._id} to sales executive ${assignedExecutive.name} for region ${visitor.region}`);
      return updatedVisitor;

    } catch (error) {
      console.error('❌ Error assigning sales executive by region:', error);
      return visitor;
    }
  }

  /**
   * Assign sales executives to all unassigned visitors
   */
  async assignSalesExecutivesToUnassignedVisitors() {
    try {
      if (this.isRunning) {
        console.log('⏳ Region assignment already in progress, skipping...');
        return;
      }

      this.isRunning = true;
      console.log('🔄 Starting region-based sales executive assignment...');

      // Get all visitors without sales executive assignment
      const unassignedVisitors = await Visitor.find({
        $or: [
          { salesExecutive: { $exists: false } },
          { salesExecutive: null }
        ],
        region: { $exists: true, $ne: null, $ne: '' }
      });

      console.log(`📋 Found ${unassignedVisitors.length} visitors without sales executive assignment`);

      let assignedCount = 0;
      let skippedCount = 0;

      for (const visitor of unassignedVisitors) {
        const updatedVisitor = await this.assignSalesExecutiveByRegion(visitor);
        if (updatedVisitor.salesExecutive) {
          assignedCount++;
        } else {
          skippedCount++;
        }
      }

      console.log(`✅ Region assignment complete: ${assignedCount} assigned, ${skippedCount} skipped`);
      return { assigned: assignedCount, skipped: skippedCount };

    } catch (error) {
      console.error('❌ Error in region-based assignment:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Get sales executives by region
   * @param {string} region - Region name
   * @returns {Promise<Array>} - Array of sales executives
   */
  async getSalesExecutivesByRegion(region) {
    try {
      return await User.find({ 
        role: 'executive',
        region: region 
      }).select('_id name email region');
    } catch (error) {
      console.error('❌ Error fetching sales executives by region:', error);
      return [];
    }
  }

  /**
   * Get all regions with their assigned sales executives
   * @returns {Promise<Object>} - Object with regions as keys and executives as values
   */
  async getRegionAssignments() {
    try {
      const executives = await User.find({ 
        role: 'executive',
        region: { $exists: true, $ne: null, $ne: '' }
      }).select('_id name email region');

      const regionAssignments = {};
      executives.forEach(executive => {
        if (!regionAssignments[executive.region]) {
          regionAssignments[executive.region] = [];
        }
        regionAssignments[executive.region].push({
          _id: executive._id,
          name: executive.name,
          email: executive.email
        });
      });

      return regionAssignments;
    } catch (error) {
      console.error('❌ Error fetching region assignments:', error);
      return {};
    }
  }

  /**
   * Update sales executive region assignment
   * @param {string} executiveId - Executive ID
   * @param {string} region - Region name
   * @returns {Promise<Object>} - Updated executive
   */
  async updateExecutiveRegion(executiveId, region) {
    try {
      const executive = await User.findByIdAndUpdate(
        executiveId,
        { region: region },
        { new: true }
      );

      if (!executive) {
        throw new Error('Executive not found');
      }

      console.log(`✅ Updated executive ${executive.name} region to ${region}`);
      return executive;
    } catch (error) {
      console.error('❌ Error updating executive region:', error);
      throw error;
    }
  }

  /**
   * Reassign all visitors when region assignments change
   */
  async reassignAllVisitorsByRegion() {
    try {
      console.log('🔄 Reassigning all visitors by region...');
      
      // Get all visitors with regions
      const visitors = await Visitor.find({
        region: { $exists: true, $ne: null, $ne: '' }
      });

      let reassignedCount = 0;

      for (const visitor of visitors) {
        const updatedVisitor = await this.assignSalesExecutiveByRegion(visitor);
        if (updatedVisitor.salesExecutive) {
          reassignedCount++;
        }
      }

      console.log(`✅ Reassigned ${reassignedCount} visitors by region`);
      return { reassigned: reassignedCount };
    } catch (error) {
      console.error('❌ Error reassigning visitors by region:', error);
      throw error;
    }
  }
}

module.exports = new RegionAssignmentService();
