const express = require('express');
const { connectMongo } = require('../config/mongo');
const Visitor = require('../models/Visitor');
const ChatMessage = require('../models/ChatMessage');
const { authenticateToken, requireAdminOrExecutive } = require('../middleware/auth');
const DataSyncService = require('../services/DataSyncService');

const router = express.Router();

/**
 * POST /api/chat/:visitorId/messages
 * Body: { sender: 'user'|'bot', message: '...' }
 */
router.post('/:visitorId/messages', async (req, res) => {
  try {
    await connectMongo();
    const { visitorId } = req.params;
    const { sender, message } = req.body || {};

    if (!sender || !['user', 'bot'].includes(sender) || !message) {
      return res.status(400).json({ ok: false, message: 'sender and message are required' });
    }

    const visitor = await Visitor.findById(visitorId);
    if (!visitor) return res.status(404).json({ ok: false, message: 'Visitor not found' });

    // Create chat message
    await ChatMessage.create({ visitorId, sender, message, at: new Date() });

    // Update visitor's last interaction
    visitor.lastInteractionAt = new Date();
    await visitor.save();

    // Sync data to ensure consistency across all dashboard sections
    try {
      await DataSyncService.syncVisitorAndEnquiry({
        name: visitor.name,
        email: visitor.email,
        phone: visitor.phone,
        organization: visitor.organization,
        service: visitor.service,
        enquiryDetails: visitor.enquiryDetails,
        enquiryType: visitor.source || 'chatbot'
      }, visitor.source || 'chatbot');
    } catch (syncError) {
      console.warn('Data sync warning (non-critical):', syncError);
    }

    return res.json({ ok: true });
  } catch (e) {
    console.error('Append chat message error:', e);
    return res.status(500).json({ ok: false, message: 'Failed to append message' });
  }
});

/**
 * Public endpoint for chatbot to read its own messages (no authentication required)
 */
router.get('/:visitorId/messages/public', async (req, res) => {
  try {
    await connectMongo();
    const { visitorId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const n = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 500);
    const p = Math.max(parseInt(page, 10) || 1, 1);

    // Verify visitor exists
    const visitor = await Visitor.findById(visitorId);
    if (!visitor) {
      return res.status(404).json({ ok: false, message: 'Visitor not found' });
    }

    const [items, total] = await Promise.all([
      ChatMessage.find({ visitorId }).sort({ at: 1 }).skip((p - 1) * n).limit(n).lean(),
      ChatMessage.countDocuments({ visitorId })
    ]);

    res.json({ 
      ok: true, 
      total, 
      page: p, 
      pageSize: n, 
      messages: items.map(msg => ({
        id: msg._id,
        message: msg.message,
        sender: msg.sender,
        timestamp: msg.at
      }))
    });
  } catch (e) {
    console.error('List public chat messages error:', e);
    res.status(500).json({ ok: false, message: 'Failed to list messages' });
  }
});

/**
 * Admin/Executive — read messages (optional for dashboard)
 */
router.get('/:visitorId/messages', authenticateToken, requireAdminOrExecutive, async (req, res) => {
  try {
    await connectMongo();
    const { visitorId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const n = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 500);
    const p = Math.max(parseInt(page, 10) || 1, 1);

    const [items, total] = await Promise.all([
      ChatMessage.find({ visitorId }).sort({ at: 1 }).skip((p - 1) * n).limit(n).lean(),
      ChatMessage.countDocuments({ visitorId })
    ]);

    res.json({ total, page: p, pageSize: n, items });
  } catch (e) {
    console.error('List chat messages error:', e);
    res.status(500).json({ ok: false, message: 'Failed to list messages' });
  }
});

module.exports = router;
