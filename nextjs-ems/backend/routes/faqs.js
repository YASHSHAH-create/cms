const express = require('express');
const { connectMongo } = require('../config/mongo');
const Faq = require('../models/Faq');
const { authenticateToken, requireAdminOrExecutive } = require('../middleware/auth');

const router = express.Router();

/**
 * Public: list FAQs (optional category)
 */
router.get('/', async (req, res) => {
  try {
    await connectMongo();
    const { category } = req.query;
    const filter = category ? { category } : {};
    const items = await Faq.find(filter).sort({ createdAt: -1 }).lean();
    res.json(items);
  } catch (e) {
    console.error('List FAQs error:', e);
    res.status(500).json({ message: 'Failed to load FAQs' });
  }
});

/**
 * Admin/Executive: create FAQ
 */
router.post('/', authenticateToken, requireAdminOrExecutive, async (req, res) => {
  try {
    await connectMongo();
    const { question, answer, category } = req.body || {};
    if (!question || !answer) return res.status(400).json({ message: 'question and answer are required' });
    const doc = await Faq.create({ question, answer, category });
    res.status(201).json({ id: String(doc._id) });
  } catch (e) {
    console.error('Create FAQ error:', e);
    res.status(500).json({ message: 'Failed to create FAQ' });
  }
});

/**
 * Admin/Executive: update FAQ
 */
router.put('/:id', authenticateToken, requireAdminOrExecutive, async (req, res) => {
  try {
    await connectMongo();
    const updated = await Faq.findByIdAndUpdate(req.params.id, { $set: req.body || {} }, { new: true }).lean();
    if (!updated) return res.status(404).json({ message: 'FAQ not found' });
    res.json(updated);
  } catch (e) {
    console.error('Update FAQ error:', e);
    res.status(500).json({ message: 'Failed to update FAQ' });
  }
});

/**
 * Admin/Executive: delete FAQ
 */
router.delete('/:id', authenticateToken, requireAdminOrExecutive, async (req, res) => {
  try {
    await connectMongo();
    const del = await Faq.findByIdAndDelete(req.params.id).lean();
    if (!del) return res.status(404).json({ message: 'FAQ not found' });
    res.json({ ok: true });
  } catch (e) {
    console.error('Delete FAQ error:', e);
    res.status(500).json({ message: 'Failed to delete FAQ' });
  }
});

module.exports = router;
