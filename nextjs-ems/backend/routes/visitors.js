const express = require('express');
const { connectMongo } = require('../config/mongo');
const Visitor = require('../models/Visitor');
const { authenticateToken, requireAdminOrExecutive, requireAdmin } = require('../middleware/auth');
const DataSyncService = require('../services/DataSyncService');

const router = express.Router();

/**
 * POST /api/visitors
 * Create-or-get a visitor from the initial chatbot form.
 * If email exists -> update & return existing; else if phone exists -> update & return existing; else create.
 * Response: { ok: true, visitorId, created: boolean }
 */
router.post('/', async (req, res) => {
  try {
    console.log('🔄 POST /api/visitors - Creating/updating visitor');
    console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
    
    await connectMongo();

    const {
      name = '',
      email = '',
      phone = '',
      organization = '',
      service = '',
      subservice = '',
      source = 'chatbot',
      location = '',
      meta = {}
    } = req.body || {};

    const payload = {
      name,
      email: email ? String(email).toLowerCase() : '',
      phone,
      organization,
      service,
      subservice,
      source,
      location,
      meta: (meta && typeof meta === 'object') ? meta : {},
      lastInteractionAt: new Date(),
      // Set default values to match existing data format
      isConverted: false,
      status: 'enquiry_required',
      leadScore: 0,
      priority: 'medium',
      pipelineHistory: []
    };

    console.log('📦 Processed payload:', JSON.stringify(payload, null, 2));

    let doc, created = false;

    if (payload.email) {
      console.log(`🔍 Searching for existing visitor by email: ${payload.email}`);
      // Email is primary key - use findOneAndUpdate with upsert
      doc = await Visitor.findOneAndUpdate(
        { email: payload.email },
        { $set: payload },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
      // created if it didn't exist before:
      created = doc.createdAt && Math.abs(Date.now() - doc.createdAt.getTime()) < 5000;
      console.log(`✅ Visitor ${created ? 'created' : 'updated'} by email: ${doc._id}`);
    } else if (payload.phone) {
      console.log(`🔍 Searching for existing visitor by phone: ${payload.phone}`);
      // If no email, check by phone
      doc = await Visitor.findOneAndUpdate(
        { phone: payload.phone },
        { $set: payload },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
      created = doc.createdAt && Math.abs(Date.now() - doc.createdAt.getTime()) < 5000;
      console.log(`✅ Visitor ${created ? 'created' : 'updated'} by phone: ${doc._id}`);
    } else {
      console.log('🆕 Creating new visitor (no email or phone provided)');
      // No email or phone - create new visitor
      doc = await Visitor.create(payload);
      created = true;
      console.log(`✅ New visitor created: ${doc._id}`);
    }

    // Verify the document was saved to MongoDB
    const savedDoc = await Visitor.findById(doc._id);
    if (!savedDoc) {
      console.error('❌ CRITICAL: Visitor was not saved to MongoDB!');
      return res.status(500).json({ ok: false, message: 'Failed to save visitor to database' });
    }
    console.log('✅ Verified visitor saved to MongoDB:', savedDoc._id);

    // Sync data to ensure consistency across all dashboard sections
    try {
      await DataSyncService.syncVisitorAndEnquiry({
        name: doc.name,
        email: doc.email,
        phone: doc.phone,
        organization: doc.organization,
        service: doc.service,
        enquiryDetails: doc.enquiryDetails || `New visitor ${doc.name} started a conversation`,
        enquiryType: doc.source || 'chatbot'
      }, doc.source || 'chatbot');
      console.log('✅ Data sync completed successfully');
    } catch (syncError) {
      console.warn('⚠️ Data sync warning (non-critical):', syncError);
    }

    // Get total count for verification
    const totalVisitors = await Visitor.countDocuments();
    console.log(`📊 Total visitors in database: ${totalVisitors}`);

    return res.status(created ? 201 : 200).json({ 
      ok: true, 
      visitorId: String(doc._id), 
      created,
      totalVisitors 
    });
  } catch (e) {
    console.error('❌ Visitor upsert error:', e);
    console.error('❌ Error details:', {
      name: e.name,
      message: e.message,
      stack: e.stack
    });
    const message = e.name === 'ValidationError' ? e.message : 'Failed to save visitor';
    return res.status(400).json({ ok: false, message });
  }
});

/**
 * Admin/Executive — list & read (optional, for dashboard/views)
 */
router.get('/', authenticateToken, requireAdminOrExecutive, async (req, res) => {
  try {
    console.log('🔄 GET /api/visitors - Fetching visitors list');
    console.log('📝 Query parameters:', req.query);
    
    await connectMongo();
    const { page = 1, limit = 20, q = '' } = req.query;
    const n = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 200);
    const p = Math.max(parseInt(page, 10) || 1, 1);
    let filter = {};
    
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter = { 
        $or: [
          { name: rx }, 
          { email: rx }, 
          { phone: rx }, 
          { organization: rx },
          { region: rx },
          { service: rx },
          { subservice: rx },
          { agentName: rx },
          { salesExecutiveName: rx },
          { status: rx },
          { enquiryDetails: rx },
          { comments: rx },
          { source: rx }
        ] 
      };
      console.log('🔍 Search filter applied:', filter);
    }
    
    console.log('📊 Fetching visitors with filter:', filter);
    const [items, total] = await Promise.all([
      Visitor.find(filter).sort({ createdAt: -1 }).skip((p - 1) * n).limit(n).lean(),
      Visitor.countDocuments(filter)
    ]);
    
    console.log(`✅ Found ${items.length} visitors (page ${p}/${Math.ceil(total / n)})`);
    console.log(`📊 Total visitors in database: ${total}`);
    
    res.json({ total, page: p, pageSize: n, items });
  } catch (e) {
    console.error('❌ Visitors list error:', e);
    console.error('❌ Error details:', {
      name: e.name,
      message: e.message,
      stack: e.stack
    });
    res.status(500).json({ ok: false, message: 'Failed to list visitors' });
  }
});

/**
 * GET /api/visitors/count
 * Get total count of visitors for quick dashboard stats
 */
router.get('/count', authenticateToken, requireAdminOrExecutive, async (req, res) => {
  try {
    console.log('🔄 GET /api/visitors/count - Getting visitor count');
    
    await connectMongo();
    
    const totalCount = await Visitor.countDocuments();
    console.log(`📊 Total visitors count: ${totalCount}`);
    
    res.json({ 
      ok: true, 
      count: totalCount,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    console.error('❌ Visitor count error:', e);
    res.status(500).json({ ok: false, message: 'Failed to get visitor count' });
  }
});

/**
 * PATCH /api/visitors/:id/enquiry-details
 * Update enquiry details when customer elaborates
 */
router.patch('/:id/enquiry-details', async (req, res) => {
  try {
    console.log('🔄 PATCH /api/visitors/:id/enquiry-details - Updating enquiry details');
    console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
    
    await connectMongo();
    
    const { id } = req.params;
    const { enquiryDetails } = req.body;
    
    if (!enquiryDetails || enquiryDetails.trim() === '') {
      return res.status(400).json({ 
        ok: false, 
        message: 'Enquiry details are required' 
      });
    }
    
    console.log(`🔍 Updating enquiry details for visitor: ${id}`);
    console.log(`📝 New enquiry details: ${enquiryDetails}`);
    
    // Update the visitor's enquiry details
    const updatedVisitor = await Visitor.findByIdAndUpdate(
      id,
      { 
        enquiryDetails: enquiryDetails.trim(),
        lastInteractionAt: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    );
    
    if (!updatedVisitor) {
      console.log(`❌ Visitor not found: ${id}`);
      return res.status(404).json({ 
        ok: false, 
        message: 'Visitor not found' 
      });
    }
    
    console.log(`✅ Updated enquiry details for visitor: ${updatedVisitor.name} (${updatedVisitor.email})`);
    console.log(`📝 New enquiry details: ${updatedVisitor.enquiryDetails}`);
    
    // Also update the corresponding enquiry if it exists
    try {
      const Enquiry = require('../models/Enquiry');
      await Enquiry.findOneAndUpdate(
        { visitorId: id },
        { 
          enquiryDetails: enquiryDetails.trim(),
          lastContactDate: new Date()
        },
        { new: true }
      );
      console.log('✅ Updated corresponding enquiry record');
    } catch (enquiryError) {
      console.warn('⚠️ Could not update enquiry record (non-critical):', enquiryError.message);
    }
    
    res.json({
      ok: true,
      message: 'Enquiry details updated successfully',
      visitor: {
        _id: updatedVisitor._id,
        name: updatedVisitor.name,
        email: updatedVisitor.email,
        enquiryDetails: updatedVisitor.enquiryDetails,
        lastInteractionAt: updatedVisitor.lastInteractionAt
      }
    });
    
  } catch (error) {
    console.error('❌ Error updating enquiry details:', error);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      ok: false, 
      message: 'Failed to update enquiry details' 
    });
  }
});

/**
 * Assign agent to visitor
 */
router.patch('/:id/assign-agent', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await connectMongo();
    
    const { id } = req.params;
    const { agentId, agentName } = req.body;
    
    console.log('🔍 Assigning agent:', { visitorId: id, agentId, agentName });
    
    if (!agentId || !agentName) {
      console.log('❌ Missing required fields:', { agentId, agentName });
      return res.status(400).json({ 
        error: 'agentId and agentName are required',
        received: { agentId, agentName }
      });
    }
    
    // Check if visitor exists
    const visitorBefore = await Visitor.findById(id).lean();
    if (!visitorBefore) {
      return res.status(404).json({ error: 'Visitor not found' });
    }

    // Convert agentId to ObjectId if it's a string
    const mongoose = require('mongoose');
    let agentObjectId;
    
    try {
      if (mongoose.Types.ObjectId.isValid(agentId)) {
        agentObjectId = new mongoose.Types.ObjectId(agentId);
      } else {
        console.log('❌ Invalid ObjectId format:', agentId);
        return res.status(400).json({ error: 'Invalid agent ID format' });
      }
    } catch (idError) {
      console.log('❌ Error converting agentId to ObjectId:', idError);
      return res.status(400).json({ error: 'Invalid agent ID format' });
    }
    
    
    let visitor;
    try {
      visitor = await Visitor.findByIdAndUpdate(
        id,
        { 
          agent: agentName,  // Store the agent name as string
          agentName: agentName,
          assignedAgent: agentObjectId  // Store the agent ID as ObjectId
      },
      { new: true }
    );
    } catch (updateError) {
      console.log('❌ Database update error:', updateError);
      return res.status(500).json({ 
        error: 'Failed to update visitor in database',
        details: updateError.message 
      });
    }
    
    if (!visitor) {
      return res.status(404).json({ error: 'Visitor not found' });
    }
    
    console.log('✅ Agent assigned successfully:', { 
      visitorId: visitor._id, 
      agent: visitor.agent, 
      agentName: visitor.agentName, 
      assignedAgent: visitor.assignedAgent 
    });
    
    res.json({ message: 'Agent assigned successfully', visitor });
  } catch (error) {
    console.error('❌ Error assigning agent:', error);
    console.error('❌ Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      error: 'Failed to assign agent',
      details: error.message,
      type: error.name
    });
  }
});


// Endpoint to manually assign all unassigned visitors
router.post('/assign-all-unassigned', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await connectMongo();
    
    console.log('🔄 Manually assigning ALL unassigned visitors...');
    
    // Get all unassigned visitors
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
    
    console.log(`🔍 Found ${unassignedVisitors.length} unassigned visitors`);
    
    if (unassignedVisitors.length === 0) {
      return res.json({
        success: true,
        message: 'No unassigned visitors found',
        assigned: 0
      });
    }
    
    // Get all available executives
    const executives = await User.find({ role: 'executive' });
    console.log(`🔍 Found ${executives.length} available executives`);
    
    if (executives.length === 0) {
      return res.status(400).json({
        error: 'No executives available for assignment',
        message: 'Please create executive users first'
      });
    }
    
    // Assign each unassigned visitor to an executive
    let assignedCount = 0;
    for (let i = 0; i < unassignedVisitors.length; i++) {
      const visitor = unassignedVisitors[i];
      const executive = executives[i % executives.length]; // Round-robin assignment
      
      try {
        await Visitor.findByIdAndUpdate(visitor._id, {
          assignedAgent: executive._id,
          agent: executive.name || executive.username,
          agentName: executive.name || executive.username
        });
        
        assignedCount++;
        console.log(`✅ Assigned ${visitor.name || visitor.email} to ${executive.name || executive.username}`);
      } catch (updateError) {
        console.error(`❌ Failed to assign ${visitor.name || visitor.email}:`, updateError);
      }
    }
    
    res.json({
      success: true,
      message: `Successfully assigned ${assignedCount} visitors`,
      assigned: assignedCount,
      total: unassignedVisitors.length
    });
  } catch (error) {
    console.error('❌ Error assigning visitors:', error);
    res.status(500).json({ 
      error: 'Failed to assign visitors',
      details: error.message 
    });
  }
});

// Direct database update to assign ALL unassigned visitors immediately
router.post('/force-assign-all', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await connectMongo();
    
    console.log('🔥 FORCE ASSIGNING ALL UNASSIGNED VISITORS...');
    
    // Get all visitors that are unassigned
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
    
    console.log(`🔍 Found ${unassignedVisitors.length} unassigned visitors`);
    
    if (unassignedVisitors.length === 0) {
      return res.json({
        success: true,
        message: 'All visitors are already assigned',
        assigned: 0
      });
    }
    
    // Get all executives
    const executives = await User.find({ role: 'executive' });
    console.log(`🔍 Found ${executives.length} executives`);
    
    if (executives.length === 0) {
      return res.status(400).json({
        error: 'No executives found',
        message: 'Please create executive users first'
      });
    }
    
    // Force assign each visitor
    let assignedCount = 0;
    const results = [];
    
    for (let i = 0; i < unassignedVisitors.length; i++) {
      const visitor = unassignedVisitors[i];
      const executive = executives[i % executives.length];
      
      try {
        // Direct database update
        const updateResult = await Visitor.updateOne(
          { _id: visitor._id },
          {
            $set: {
              assignedAgent: executive._id,
              agent: executive.name || executive.username || 'Executive',
              agentName: executive.name || executive.username || 'Executive'
            }
          }
        );
        
        if (updateResult.modifiedCount > 0) {
          assignedCount++;
          results.push({
            visitor: visitor.name || visitor.email,
            assignedTo: executive.name || executive.username || 'Executive',
            success: true
          });
          console.log(`✅ FORCE ASSIGNED: ${visitor.name || visitor.email} → ${executive.name || executive.username}`);
        }
      } catch (error) {
        console.error(`❌ Failed to assign ${visitor.name || visitor.email}:`, error);
        results.push({
          visitor: visitor.name || visitor.email,
          error: error.message,
          success: false
        });
      }
    }
    
    console.log(`🎉 FORCE ASSIGNMENT COMPLETE: ${assignedCount}/${unassignedVisitors.length} visitors assigned`);
    
    res.json({
      success: true,
      message: `Force assigned ${assignedCount} out of ${unassignedVisitors.length} visitors`,
      assigned: assignedCount,
      total: unassignedVisitors.length,
      results: results
    });
  } catch (error) {
    console.error('❌ Force assignment error:', error);
    res.status(500).json({
      error: 'Force assignment failed',
      details: error.message
    });
  }
});

// One-time fix: Update all visitors to have agents
router.post('/fix-all-visitors', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await connectMongo();
    
    console.log('🔧 FIXING ALL VISITORS - ONE TIME UPDATE...');
    
    // Get all visitors
    const allVisitors = await Visitor.find({});
    console.log(`🔍 Found ${allVisitors.length} total visitors`);
    
    // Get all executives
    const executives = await User.find({ role: 'executive' });
    console.log(`🔍 Found ${executives.length} executives`);
    
    if (executives.length === 0) {
      return res.status(400).json({
        error: 'No executives found',
        message: 'Please create executive users first'
      });
    }
    
    let updatedCount = 0;
    
    // Update ALL visitors to have agents
    for (let i = 0; i < allVisitors.length; i++) {
      const visitor = allVisitors[i];
      const executive = executives[i % executives.length];
      
      try {
        await Visitor.updateOne(
          { _id: visitor._id },
          {
            $set: {
              assignedAgent: executive._id,
              agent: executive.name || executive.username || 'Executive',
              agentName: executive.name || executive.username || 'Executive'
            }
          }
        );
        updatedCount++;
        console.log(`✅ FIXED: ${visitor.name || visitor.email} → ${executive.name || executive.username}`);
      } catch (error) {
        console.error(`❌ Failed to fix ${visitor.name || visitor.email}:`, error);
      }
    }
    
    console.log(`🎉 FIX COMPLETE: Updated ${updatedCount}/${allVisitors.length} visitors`);
    
    res.json({
      success: true,
      message: `Fixed ${updatedCount} out of ${allVisitors.length} visitors`,
      updated: updatedCount,
      total: allVisitors.length
    });
  } catch (error) {
    console.error('❌ Fix error:', error);
    res.status(500).json({
      error: 'Fix failed',
      details: error.message
    });
  }
});

module.exports = router;
