// backend/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { connectMongo } = require('../config/mongo');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Simple login endpoint
router.post('/login', async (req, res) => {
  try {
    await connectMongo();
    
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username and password are required' 
      });
    }

    // Find user by username (case-insensitive)
    const user = await User.findOne({ username: username.toLowerCase() });
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
    }

    // Check if user is approved (for non-admin users)
    // Legacy executives (role: 'executive') are automatically approved
    if (user.role !== 'admin' && user.role !== 'executive' && !user.isApproved) {
      return res.status(403).json({ 
        success: false, 
        message: 'Your account is pending admin approval. Please contact the administrator.' 
      });
    }

    // Check if account is active (legacy executives are always active)
    if (user.role !== 'executive' && !user.isActive) {
      return res.status(403).json({ 
        success: false, 
        message: 'Your account has been deactivated. Please contact the administrator.' 
      });
    }

    // Update last login time
    await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });

    // Create enhanced token with name for filtering
    const token = jwt.sign(
      { 
        userId: user._id, 
        username: user.username, 
        name: user.name,
        role: user.role 
      },
      process.env.JWT_SECRET || 'your-secret-key-here',
      { expiresIn: '24h' }
    );

    // Return user data and token
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during login' 
    });
  }
});

// Enhanced register endpoint for multi-executive system
router.post('/register', async (req, res) => {
  try {
    await connectMongo();
    
    const { 
      username, 
      password, 
      name, 
      email, 
      phone,
      role = 'customer-executive',
      region,
      specializations = []
    } = req.body;
    
    // Validate required fields
    if (!username || !password || !name || !email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username, password, name, and email are required' 
      });
    }

    // Validate role
    const validRoles = ['sales-executive', 'customer-executive'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid role. Must be sales-executive or customer-executive' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [
        { username: username.toLowerCase() },
        { email: email.toLowerCase() }
      ]
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username or email already exists' 
      });
    }

    // Create new user with approval workflow
    const newUser = new User({
      username: username.toLowerCase(),
      password, // Will be hashed by pre-save hook
      name,
      email: email.toLowerCase(),
      phone: phone || null,
      role,
      region: region || null,
      specializations: Array.isArray(specializations) ? specializations : [],
      isActive: true,
      isApproved: false, // Requires admin approval
      lastLoginAt: null
    });

    await newUser.save();

    // Log registration for admin notification
    console.log(`📝 New ${role} registration: ${name} (${email}) - Pending approval`);

    res.status(201).json({
      success: true,
      message: 'Registration successful! Your account is pending admin approval. You will be notified via email once approved.',
      user: {
        id: newUser._id,
        username: newUser.username,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        isApproved: newUser.isApproved
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during registration' 
    });
  }
});

// Get all users (admin only)
router.get('/users', async (req, res) => {
  try {
    await connectMongo();
    
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    const token = authHeader.substring(7);
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-here');
    
    // Check if user is admin
    if (decoded.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin access required' 
      });
    }

    // Fetch all users, excluding Customer Executive 1 and 2
    const users = await User.find({
      $and: [
        { name: { $not: { $regex: /Customer Experience Executive 1/i } } },
        { name: { $not: { $regex: /Customer Experience Executive 2/i } } },
        { email: { $not: { $regex: /executive1@envirocarelabs.com/i } } },
        { email: { $not: { $regex: /executive2@envirocarelabs.com/i } } }
      ]
    }).select('-password').lean();
    
    res.json(users.map(user => ({
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      name: user.name,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    })));

  } catch (error) {
    console.error('Get users error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching users' 
    });
  }
});

// Create new user (admin only)
router.post('/users', async (req, res) => {
  try {
    await connectMongo();
    
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    const token = authHeader.substring(7);
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-here');
    
    // Check if user is admin
    if (decoded.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin access required' 
      });
    }

    const { name, email, phone, role, department, password } = req.body;
    
    if (!name || !email || !role) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, email, and role are required' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [
        { email: email.toLowerCase() },
        { username: email.split('@')[0].toLowerCase() }
      ]
    });
    
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
    }

    // Generate username from email
    const username = email.split('@')[0].toLowerCase();
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password || 'temp123', 10);

    // Create new user
    const newUser = new User({
      username,
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      role: role === 'admin' ? 'admin' : 'executive',
      phone: phone || '',
      department: department || 'Customer Service'
    });

    await newUser.save();

    // Return user data without password
    res.status(201).json({
      _id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      name: newUser.name,
      phone: newUser.phone,
      department: newUser.department,
      createdAt: newUser.createdAt
    });

  } catch (error) {
    console.error('Create user error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        success: false, 
        message: error.message 
      });
    }
    res.status(500).json({ 
      success: false, 
      message: 'Server error while creating user' 
    });
  }
});

// Verify token endpoint
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-here');
    
    res.json({
      success: true,
      message: 'Token is valid',
      user: decoded
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ 
      success: false, 
      message: 'Invalid token' 
    });
  }
});

// Get user profile endpoint
router.get('/profile', async (req, res) => {
  try {
    await connectMongo();
    
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: 'No token provided' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-here');
    
    // Get user details from database
    const user = await User.findById(decoded.userId).select('-password').lean();
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    res.json({
      username: user.username,
      role: user.role,
      name: user.name,
      email: user.email
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token' 
      });
    }
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching profile' 
    });
  }
});

// NEW ENDPOINTS FOR MULTI-EXECUTIVE SYSTEM

// Get pending registrations (admin only)
router.get('/pending-registrations', async (req, res) => {
  try {
    await connectMongo();
    
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-here');
    
    // Check if user is admin
    if (decoded.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin access required' 
      });
    }

    // Fetch pending registrations
    const pendingUsers = await User.find({ isApproved: false })
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();
    
    res.json({
      success: true,
      pendingUsers: pendingUsers.map(user => ({
        _id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        region: user.region,
        specializations: user.specializations,
        createdAt: user.createdAt,
        isActive: user.isActive
      }))
    });

  } catch (error) {
    console.error('Pending registrations fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching pending registrations' 
    });
  }
});

// Approve user registration (admin only)
router.post('/approve-user/:userId', async (req, res) => {
  try {
    await connectMongo();
    
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-here');
    
    // Check if user is admin
    if (decoded.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin access required' 
      });
    }

    const { userId } = req.params;
    const adminUser = await User.findById(decoded.userId);

    // Update user approval status
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        isApproved: true,
        approvedBy: decoded.userId,
        approvedAt: new Date()
      },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log(`✅ User approved: ${updatedUser.name} (${updatedUser.role}) by ${adminUser?.name}`);

    res.json({
      success: true,
      message: `${updatedUser.role} ${updatedUser.name} has been approved successfully`,
      user: {
        _id: updatedUser._id,
        username: updatedUser.username,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isApproved: updatedUser.isApproved,
        approvedAt: updatedUser.approvedAt
      }
    });

  } catch (error) {
    console.error('User approval error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during user approval' 
    });
  }
});

// Reject user registration (admin only)
router.delete('/reject-user/:userId', async (req, res) => {
  try {
    await connectMongo();
    
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-here');
    
    // Check if user is admin
    if (decoded.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin access required' 
      });
    }

    const { userId } = req.params;
    const { reason = 'Registration rejected by admin' } = req.body;

    // Delete the user registration
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    console.log(`❌ User registration rejected: ${deletedUser.name} (${deletedUser.role}) - Reason: ${reason}`);

    res.json({
      success: true,
      message: `Registration for ${deletedUser.name} has been rejected`,
      rejectedUser: {
        name: deletedUser.name,
        email: deletedUser.email,
        role: deletedUser.role,
        reason
      }
    });

  } catch (error) {
    console.error('User rejection error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during user rejection' 
    });
  }
});

// Get all sales executives (for dropdown selection)
router.get('/sales-executives', async (req, res) => {
  try {
    await connectMongo();
    
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-here');
    
    // Check if user is admin or executive
    if (!['admin', 'executive', 'sales-executive', 'customer-executive'].includes(decoded.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    // Fetch all approved sales executives
    const salesExecutives = await User.find({ 
      role: 'sales-executive',
      isApproved: true,
      isActive: true
    })
      .select('_id name username email')
      .sort({ name: 1 })
      .lean();

    res.json({
      success: true,
      salesExecutives: salesExecutives.map(exec => ({
        _id: exec._id,
        name: exec.name,
        username: exec.username,
        email: exec.email
      }))
    });

  } catch (error) {
    console.error('Sales executives fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching sales executives' 
    });
  }
});

// Get all agents (customer executives and executives) for dropdown selection
router.get('/agents', async (req, res) => {
  try {
    await connectMongo();
    
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-here');
    
    // Check if user is admin or executive
    if (!['admin', 'executive', 'sales-executive', 'customer-executive'].includes(decoded.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    // Fetch all customer executives and executives
    const agents = await User.find({ 
      role: { $in: ['customer-executive', 'customer_executive', 'executive'] }
    })
      .select('_id name username email role')
      .sort({ name: 1 })
      .lean();
    
    console.log('🔍 Found agents in database:', agents.length);
    agents.forEach(agent => {
      console.log(`- ${agent.name} (${agent.role})`);
    });

    res.json({
      success: true,
      agents: agents.map(agent => ({
        _id: agent._id,
        name: agent.name,
        username: agent.username,
        email: agent.email,
        role: agent.role
      }))
    });

  } catch (error) {
    console.error('Agents fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching agents' 
    });
  }
});

// Cleanup users endpoint (admin only)
router.post('/cleanup-users', async (req, res) => {
  try {
    await connectMongo();
    
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-here');
    
    // Check if user is admin
    if (decoded.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin access required' 
      });
    }

    console.log('🔍 Starting user cleanup...');
    
    // Define the users we want to keep
    const usersToKeep = [
      { name: 'System Administrator', role: 'admin' },
      { name: 'Sanjana Pawar', role: 'customer-executive' },
      { name: 'Test-SE', role: 'sales-executive' },
      { name: 'Shreyas Salvi', role: 'sales-executive' },
      { name: 'Yug', role: 'sales-executive' }
    ];
    
    // Get all current users
    const allUsers = await User.find({}).select('_id name username email role').lean();
    console.log(`📊 Current users: ${allUsers.length}`);
    
    // Find users to delete
    const usersToDelete = allUsers.filter(user => {
      return !usersToKeep.some(keepUser => 
        keepUser.name === user.name && keepUser.role === user.role
      );
    });
    
    console.log(`🗑️ Users to delete: ${usersToDelete.length}`);
    
    // Delete users
    if (usersToDelete.length > 0) {
      const deleteResult = await User.deleteMany({
        _id: { $in: usersToDelete.map(user => user._id) }
      });
      console.log(`✅ Deleted ${deleteResult.deletedCount} users`);
    }
    
    // Check for missing users and create them
    const existingUsers = await User.find({}).select('name role').lean();
    const existingNames = existingUsers.map(user => user.name);
    
    const missingUsers = usersToKeep.filter(keepUser => 
      !existingNames.includes(keepUser.name)
    );
    
    console.log(`➕ Missing users to create: ${missingUsers.length}`);
    
    for (const user of missingUsers) {
      const newUser = new User({
        name: user.name,
        username: user.name.toLowerCase().replace(/\s+/g, ''),
        email: `${user.name.toLowerCase().replace(/\s+/g, '')}@envirocare.co.in`,
        role: user.role,
        password: 'password123',
        isApproved: true,
        isActive: true
      });
      
      await newUser.save();
      console.log(`✅ Created user: ${user.name} (${user.role})`);
    }
    
    // Get final users
    const finalUsers = await User.find({}).select('_id name username email role').lean();
    
    res.json({
      success: true,
      message: 'User cleanup completed',
      deleted: usersToDelete.length,
      created: missingUsers.length,
      finalUsers: finalUsers.map(user => ({
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role
      }))
    });

  } catch (error) {
    console.error('User cleanup error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error during user cleanup' 
    });
  }
});

// Get all approved executives (admin only)
router.get('/executives', async (req, res) => {
  try {
    await connectMongo();
    
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Access token required' 
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-here');
    
    // Check if user is admin
    if (decoded.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Admin access required' 
      });
    }

    // Fetch all approved executives
    const executives = await User.find({ 
      role: { $in: ['sales-executive', 'customer-executive'] },
      isApproved: true 
    })
      .select('-password')
      .sort({ role: 1, name: 1 })
      .lean();
    
    const salesExecutives = executives.filter(user => user.role === 'sales-executive');
    const customerExecutives = executives.filter(user => user.role === 'customer-executive');

    res.json({
      success: true,
      totalExecutives: executives.length,
      salesExecutives: salesExecutives.length,
      customerExecutives: customerExecutives.length,
      executives: executives.map(user => ({
        _id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        region: user.region,
        specializations: user.specializations,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        createdAt: user.createdAt
      }))
    });

  } catch (error) {
    console.error('Executives fetch error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while fetching executives' 
    });
  }
});

// Transfer executive data endpoint (admin only)
router.post('/transfer-executive-data', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await connectMongo();
    
    console.log('🔄 Starting data transfer process...');

    // Find Sanjana (the target customer executive)
    const sanjana = await User.findOne({ 
      $or: [
        { name: /Sanjana/i },
        { username: /sanjana/i }
      ]
    });

    if (!sanjana) {
      return res.status(404).json({ 
        success: false, 
        message: 'Sanjana not found in database' 
      });
    }

    console.log(`✅ Found Sanjana: ${sanjana.name} (ID: ${sanjana._id})`);

    // Find Customer Executive 1 & 2
    const ce1 = await User.findOne({
      $or: [
        { name: /Customer Experience Executive 1/i },
        { email: /executive1@envirocarelabs.com/i }
      ]
    });

    const ce2 = await User.findOne({
      $or: [
        { name: /Customer Experience Executive 2/i },
        { email: /executive2@enrocarelabs.com/i }
      ]
    });

    console.log(`📋 Found executives to transfer from:`);
    if (ce1) console.log(`  - CE1: ${ce1.name} (ID: ${ce1._id})`);
    if (ce2) console.log(`  - CE2: ${ce2.name} (ID: ${ce2._id})`);

    let totalTransferred = 0;
    const transferResults = {
      ce1: { visitors: 0, enquiries: 0 },
      ce2: { visitors: 0, enquiries: 0 }
    };

    // Import models
    const Visitor = require('../models/Visitor');
    const Enquiry = require('../models/Enquiry');

    // Transfer visitors from CE1
    if (ce1) {
      const ce1Visitors = await Visitor.find({
        $or: [
          { customerExecutive: ce1._id },
          { customerExecutiveName: ce1.name }
        ]
      });

      console.log(`📊 Found ${ce1Visitors.length} visitors from CE1`);

      for (const visitor of ce1Visitors) {
        visitor.customerExecutive = sanjana._id;
        visitor.customerExecutiveName = sanjana.name;
        visitor.assignmentHistory = visitor.assignmentHistory || [];
        visitor.assignmentHistory.push({
          assignedBy: 'System Transfer',
          assignedTo: sanjana.name,
          assignedAt: new Date(),
          reason: 'Data consolidation - CE1 to Sanjana'
        });
        await visitor.save();
        totalTransferred++;
      }

      transferResults.ce1.visitors = ce1Visitors.length;
      console.log(`✅ Transferred ${ce1Visitors.length} visitors from CE1 to Sanjana`);
    }

    // Transfer visitors from CE2
    if (ce2) {
      const ce2Visitors = await Visitor.find({
        $or: [
          { customerExecutive: ce2._id },
          { customerExecutiveName: ce2.name }
        ]
      });

      console.log(`📊 Found ${ce2Visitors.length} visitors from CE2`);

      for (const visitor of ce2Visitors) {
        visitor.customerExecutive = sanjana._id;
        visitor.customerExecutiveName = sanjana.name;
        visitor.assignmentHistory = visitor.assignmentHistory || [];
        visitor.assignmentHistory.push({
          assignedBy: 'System Transfer',
          assignedTo: sanjana.name,
          assignedAt: new Date(),
          reason: 'Data consolidation - CE2 to Sanjana'
        });
        await visitor.save();
        totalTransferred++;
      }

      transferResults.ce2.visitors = ce2Visitors.length;
      console.log(`✅ Transferred ${ce2Visitors.length} visitors from CE2 to Sanjana`);
    }

    // Transfer enquiries from CE1
    if (ce1) {
      const ce1Enquiries = await Enquiry.find({
        $or: [
          { customerExecutive: ce1._id },
          { customerExecutiveName: ce1.name }
        ]
      });

      console.log(`📊 Found ${ce1Enquiries.length} enquiries from CE1`);

      for (const enquiry of ce1Enquiries) {
        enquiry.customerExecutive = sanjana._id;
        enquiry.customerExecutiveName = sanjana.name;
        await enquiry.save();
        totalTransferred++;
      }

      transferResults.ce1.enquiries = ce1Enquiries.length;
      console.log(`✅ Transferred ${ce1Enquiries.length} enquiries from CE1 to Sanjana`);
    }

    // Transfer enquiries from CE2
    if (ce2) {
      const ce2Enquiries = await Enquiry.find({
        $or: [
          { customerExecutive: ce2._id },
          { customerExecutiveName: ce2.name }
        ]
      });

      console.log(`📊 Found ${ce2Enquiries.length} enquiries from CE2`);

      for (const enquiry of ce2Enquiries) {
        enquiry.customerExecutive = sanjana._id;
        enquiry.customerExecutiveName = sanjana.name;
        await enquiry.save();
        totalTransferred++;
      }

      transferResults.ce2.enquiries = ce2Enquiries.length;
      console.log(`✅ Transferred ${ce2Enquiries.length} enquiries from CE2 to Sanjana`);
    }

    // Verify the transfer
    const sanjanaVisitors = await Visitor.countDocuments({
      $or: [
        { customerExecutive: sanjana._id },
        { customerExecutiveName: sanjana.name }
      ]
    });

    const sanjanaEnquiries = await Enquiry.countDocuments({
      $or: [
        { customerExecutive: sanjana._id },
        { customerExecutiveName: sanjana.name }
      ]
    });

    console.log('\n🎉 Transfer completed successfully!');
    console.log(`📊 Total records transferred: ${totalTransferred}`);
    console.log(`👥 Sanjana now has ${sanjanaVisitors} visitors`);
    console.log(`📝 Sanjana now has ${sanjanaEnquiries} enquiries`);

    res.json({
      success: true,
      message: 'Data transfer completed successfully',
      data: {
        totalTransferred,
        sanjana: {
          name: sanjana.name,
          visitors: sanjanaVisitors,
          enquiries: sanjanaEnquiries
        },
        transferResults
      }
    });

  } catch (error) {
    console.error('❌ Error during transfer:', error);
    res.status(500).json({
      success: false,
      message: 'Error during data transfer',
      error: error.message
    });
  }
});

module.exports = router;
