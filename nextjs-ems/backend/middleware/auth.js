// backend/middleware/auth.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Verify Bearer token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, payload) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = payload;
    next();
  });
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

const requireAdminOrExecutive = (req, res, next) => {
  if (!['admin', 'sales-executive', 'customer-executive', 'executive'].includes(req.user?.role)) {
    return res.status(403).json({ message: 'Admin or Executive access required' });
  }
  next();
};

// New middleware for role-based data filtering
const requireExecutiveOrAdmin = (req, res, next) => {
  if (!['admin', 'sales-executive', 'customer-executive', 'executive'].includes(req.user?.role)) {
    return res.status(403).json({ message: 'Admin or Executive access required' });
  }
  next();
};

// NEW: Middleware for sales executives only
const requireSalesExecutive = (req, res, next) => {
  if (!['admin', 'sales-executive'].includes(req.user?.role)) {
    return res.status(403).json({ message: 'Sales Executive access required' });
  }
  next();
};

// NEW: Middleware for customer executives only
const requireCustomerExecutive = (req, res, next) => {
  if (!['admin', 'customer-executive'].includes(req.user?.role)) {
    return res.status(403).json({ message: 'Customer Executive access required' });
  }
  next();
};

// Enhanced middleware to add user context for filtering (UPDATED)
const addUserContext = (req, res, next) => {
  req.userContext = {
    isAdmin: req.user?.role === 'admin',
    isExecutive: ['executive', 'sales-executive', 'customer-executive'].includes(req.user?.role),
    isSalesExecutive: req.user?.role === 'sales-executive',
    isCustomerExecutive: req.user?.role === 'customer-executive',
    userId: req.user?.userId || req.user?.id, // Handle both userId and id
    userName: req.user?.name || req.user?.username,
    userRole: req.user?.role
  };
  next();
};

// Enhanced middleware for executive data access control (UPDATED)
const enforceExecutiveAccess = (req, res, next) => {
  if (req.user?.role === 'sales-executive') {
    // Sales executives only see assigned visitors & enquiries
    req.userContext.canAccessAll = false;
    req.userContext.dataFilter = {
      $or: [
        { salesExecutiveName: req.user?.name || req.user?.username },
        { salesExecutive: req.user?.userId || req.user?.id }
      ]
    };
  } else if (['customer-executive', 'executive'].includes(req.user?.role)) {
    // Customer executives and legacy executives see all data
    req.userContext.canAccessAll = true;
    req.userContext.dataFilter = {}; // No filtering - they see all data
  } else if (req.user?.role === 'admin') {
    // Admin sees all data
    req.userContext.canAccessAll = true;
    req.userContext.dataFilter = {}; // No filtering for admin
  }
  next();
};

module.exports = { 
  authenticateToken, 
  requireAdmin, 
  requireAdminOrExecutive, 
  requireExecutiveOrAdmin,
  requireSalesExecutive, // NEW
  requireCustomerExecutive, // NEW
  addUserContext,
  enforceExecutiveAccess,
  JWT_SECRET 
};
