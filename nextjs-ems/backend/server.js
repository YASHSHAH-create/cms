// backend/server.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') }); // load env once

const express = require('express');
const cors = require('cors');

const { connectMongo } = require('./config/mongo');
const User = require('./models/User');
const assignmentService = require('./services/AssignmentService');

// Use bcryptjs and expose a safe global fallback so any module that forgot to import it won't crash.
const bcrypt = require('bcryptjs');
global.bcrypt = bcrypt;

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/visitors', require('./routes/visitors'));   // NEW
app.use('/api/chat', require('./routes/chat'));           // NEW
app.use('/api/faqs', require('./routes/faqs'));           // NEW
app.use('/api/articles', require('./routes/articles'));   // NEW
app.use('/api/analytics', require('./routes/analytics')); // NEW
app.use('/api/executive-services', require('./routes/executive-services')); // NEW
app.use('/api/region-assignments', require('./routes/region-assignments')); // NEW


// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, ts: new Date().toISOString() });
});

// Centralized error handler
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err && err.stack ? err.stack : err);
  res.status(500).json({ message: 'Internal server error' });
});

/** Seed admin + executive accounts exactly once (idempotent). */
async function seedUsersOnce() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@envirocarelabs.com';
  const adminPass = process.env.ADMIN_PASSWORD || 'admin123';
  const execPass  = process.env.EXEC_PASSWORD  || 'exec123';

  // Admin
  const admin = await User.findOne({ username: 'admin' });
  if (!admin) {
    const hashed = await bcrypt.hash(adminPass, 10);
    await User.create({
      username: 'admin',
      email: adminEmail,
      password: hashed,
      role: 'admin',
      name: 'System Administrator',
    });
    console.log('✅ Seeded admin account');
  }

  // Executives
  const execs = [
    { username: 'executive1', email: process.env.EXEC1_EMAIL || 'executive1@envirocarelabs.com', name: 'Customer Experience Executive 1' },
    { username: 'executive2', email: process.env.EXEC2_EMAIL || 'executive2@envirocarelabs.com', name: 'Customer Experience Executive 2' },
  ];
  for (const e of execs) {
    const exists = await User.findOne({ username: e.username });
    if (!exists) {
      const hashed = await bcrypt.hash(execPass, 10);
      await User.create({ username: e.username, email: e.email, password: hashed, role: 'executive', name: e.name });
      console.log(`✅ Seeded ${e.username}`);
    }
  }
}

async function start() {
  // Start HTTP server first so health checks and basic routes respond even if DB is down
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server listening on port ${PORT} at ${new Date().toISOString()}`);
  });

  const tryConnect = async () => {
    try {
      await connectMongo();
      await seedUsersOnce();
      console.log('✅ Database connected and users seeded.');
      
// Start the assignment service
assignmentService.start();
console.log('✅ Assignment service started - all visitors will be auto-assigned');
      console.log('✅ Assignment service started.');
      
      return true;
    } catch (err) {
      console.error('Mongo connection/seed error. Will retry:', err && err.message ? err.message : err);
      return false;
    }
  };

  // initial attempt
  let ok = await tryConnect();
  if (!ok) {
    // retry every 10s without crashing the server
    const intervalMs = 10000;
    const timer = setInterval(async () => {
      const done = await tryConnect();
      if (done) clearInterval(timer);
    }, intervalMs);
  }
}

start();
