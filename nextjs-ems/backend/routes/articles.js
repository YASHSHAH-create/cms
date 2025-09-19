const express = require('express');
const { connectMongo } = require('../config/mongo');
const Article = require('../models/Article');
const { authenticateToken, requireAdminOrExecutive } = require('../middleware/auth');

const router = express.Router();

/**
 * Public: list with pagination & search
 */
router.get('/', async (req, res) => {
  try {
    await connectMongo();
    const { page = 1, limit = 10, search = '' } = req.query;

    const n = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 200);
    const p = Math.max(parseInt(page, 10) || 1, 1);

    let filter = {};
    if (search) filter = { $text: { $search: search } };

    const [items, total] = await Promise.all([
      Article.find(filter).sort({ createdAt: -1 }).skip((p - 1) * n).limit(n).lean(),
      Article.countDocuments(filter)
    ]);

    res.json({ total, page: p, pageSize: n, items });
  } catch (e) {
    console.error('List Articles error:', e);
    res.status(500).json({ message: 'Failed to load articles' });
  }
});

/**
 * Admin/Executive: create article
 */
router.post('/', authenticateToken, requireAdminOrExecutive, async (req, res) => {
  try {
    await connectMongo();
    const { title, content, author, tags = [] } = req.body || {};
    if (!title || !content) return res.status(400).json({ message: 'title and content are required' });
    const doc = await Article.create({ title, content, author, tags });
    res.status(201).json({ id: String(doc._id) });
  } catch (e) {
    console.error('Create Article error:', e);
    res.status(500).json({ message: 'Failed to create article' });
  }
});

/**
 * Admin/Executive: update article
 */
router.put('/:id', authenticateToken, requireAdminOrExecutive, async (req, res) => {
  try {
    await connectMongo();
    const updated = await Article.findByIdAndUpdate(req.params.id, { $set: req.body || {} }, { new: true }).lean();
    if (!updated) return res.status(404).json({ message: 'Article not found' });
    res.json(updated);
  } catch (e) {
    console.error('Update Article error:', e);
    res.status(500).json({ message: 'Failed to update article' });
  }
});

/**
 * Admin/Executive: delete article
 */
router.delete('/:id', authenticateToken, requireAdminOrExecutive, async (req, res) => {
  try {
    await connectMongo();
    const del = await Article.findByIdAndDelete(req.params.id).lean();
    if (!del) return res.status(404).json({ message: 'Article not found' });
    res.json({ ok: true });
  } catch (e) {
    console.error('Delete Article error:', e);
    res.status(500).json({ message: 'Failed to delete article' });
  }
});

module.exports = router;
