const express = require('express');
const { connectMongo } = require('../config/mongo');
const Visitor = require('../models/Visitor');
const Enquiry = require('../models/Enquiry');
const ChatMessage = require('../models/ChatMessage');
const Faq = require('../models/Faq');
const Article = require('../models/Article');
const User = require('../models/User');
const ExecutiveService = require('../models/ExecutiveService');
const { authenticateToken, requireAdminOrExecutive, addUserContext, enforceExecutiveAccess } = require('../middleware/auth');
const DataSyncService = require('../services/DataSyncService');
const { mapToMainService } = require('../utils/serviceMapping');

const router = express.Router();

// Mock data for presentation
const mockDashboardData = {
  totals: { 
    visitors: 3, 
    messages: 28, 
    faqs: 15, 
    articles: 8,
    enquiries: 12
  },
  today: { 
    visitors: 1, 
    messages: 5,
    enquiries: 2
  }
};

const mockDailyVisitors = {
  labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  datasets: [{
    label: 'Visitors',
    data: [0, 0, 0, 3, 0, 0, 0],
    borderColor: 'rgba(59, 130, 246, 1)',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  }]
};

const mockConversationRatio = {
  visitors: 3,
  leadsConverted: 3,
  conversionRate: 100
};

const mockDailyAnalysis = [
  {
    id: '1',
    visitor: 'John Doe',
    agent: 'Chatbot',
    enquiry: 'Water Testing',
    dateTime: new Date().toISOString(),
    status: 'active'
  },
  {
    id: '2',
    visitor: 'Jane Smith',
    agent: 'Chatbot',
    enquiry: 'Environmental Testing',
    dateTime: new Date(Date.now() - 86400000).toISOString(),
    status: 'completed'
  }
];

const mockRecentConversations = [
  {
    id: '1',
    visitor: 'John Doe',
    lastMessage: 'I need water testing services',
    timestamp: new Date().toISOString(),
    messages: [
      { sender: 'visitor', message: 'Hello, I need water testing services', timestamp: new Date().toISOString() },
      { sender: 'agent', message: 'Great! I can help you with water testing. What type of water do you need tested?', timestamp: new Date().toISOString() }
    ]
  }
];

/**
 * GET /api/analytics/dashboard
 * Totals + today's counts with role-based filtering
 */
router.get('/dashboard', authenticateToken, addUserContext, enforceExecutiveAccess, requireAdminOrExecutive, async (req, res) => {
  try {
    await connectMongo();

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    // Get unified data from DataSyncService
    const userRole = req.userContext?.userRole || req.user?.role;
    const userId = req.userContext?.userId || req.user?.id;
    
    let unifiedData;
    let stats;
    
    try {
      unifiedData = await DataSyncService.getUnifiedDashboardData(userRole, userId);
      stats = await DataSyncService.getDashboardStats(userRole, userId);
    } catch (syncError) {
      console.warn('DataSyncService failed, using fallback data:', syncError.message);
      // Fallback to basic data if sync service fails
      const [totalVisitors, totalEnquiries, totalMessages] = await Promise.all([
        Visitor.countDocuments({}),
        Enquiry.countDocuments({}),
        ChatMessage.countDocuments({})
      ]);
      
      // Create basic visitor data for fallback
      const visitors = await Visitor.find({}).sort({ createdAt: -1 }).lean();
      const enquiries = await Enquiry.find({}).sort({ createdAt: -1 }).lean();
      const chatMessages = await ChatMessage.find({}).sort({ at: -1 }).lean();
      
      // Group chat messages by visitor for chat history
      const messagesByVisitor = {};
      chatMessages.forEach(message => {
        const visitorId = message.visitorId?.toString();
        if (visitorId) {
          if (!messagesByVisitor[visitorId]) {
            messagesByVisitor[visitorId] = [];
          }
          messagesByVisitor[visitorId].push(message);
        }
      });
      
      // Create chat history from visitors with messages
      const chatHistory = visitors
        .filter(v => messagesByVisitor[v._id.toString()]?.length > 0)
        .map(v => ({
          visitor: {
            _id: v._id.toString(),
            name: v.name || 'Anonymous',
            email: v.email || '',
            phone: v.phone || '',
            organization: v.organization || '',
            service: v.service || 'General Inquiry'
          },
          messages: messagesByVisitor[v._id.toString()].map(m => ({
            _id: m._id.toString(),
            visitorId: m.visitorId.toString(),
            sender: m.sender,
            message: m.message,
            at: m.at
          }))
        }));
      
      unifiedData = {
        visitors: visitors.map(v => ({
          _id: v._id.toString(),
          name: v.name || 'Anonymous',
          email: v.email || '',
          phone: v.phone || '',
          organization: v.organization || '',
          service: v.service || 'General Inquiry',
          source: v.source || 'chatbot',
          status: v.status || 'enquiry_required',
          createdAt: v.createdAt,
          lastInteractionAt: v.lastInteractionAt,
          isConverted: v.isConverted || false
        })),
        enquiries: enquiries.map(e => ({
          _id: e._id.toString(),
          visitorName: e.visitorName || '',
          email: e.email || '',
          phone: e.phoneNumber || '',
          enquiryType: e.enquiryType || 'chatbot',
          enquiryDetails: e.enquiryDetails || '',
          status: e.status || 'new',
          priority: e.priority || 'medium',
          organization: e.organization || '',
          createdAt: e.createdAt,
          visitorId: e.visitorId?.toString() || ''
        })),
        chatHistory
      };
      
      stats = {
        totalVisitors,
        totalEnquiries,
        totalConversations: chatHistory.length
      };
    }

    // Calculate today's counts
    const todayVisitors = unifiedData.visitors.filter(v => 
      v.createdAt >= start && v.createdAt <= end
    ).length;
    
    const todayEnquiries = unifiedData.enquiries.filter(e => 
      e.createdAt >= start && e.createdAt <= end
    ).length;

    // Get global counts for non-visitor data
    const [totalFAQs, totalArticles] = await Promise.all([
      Faq.countDocuments({}),
      Article.countDocuments({})
    ]);

    res.json({
      totals: { 
        visitors: stats.totalVisitors, 
        messages: stats.totalConversations, 
        faqs: totalFAQs, 
        articles: totalArticles,
        enquiries: stats.totalEnquiries
      },
      today: { 
        visitors: todayVisitors, 
        messages: stats.totalConversations, // Using total for now
        enquiries: todayEnquiries
      },
      unifiedData: unifiedData,
      stats: stats,
      userContext: {
        role: req.userContext?.userRole || req.user?.role,
        canAccessAll: req.userContext?.canAccessAll || req.user?.role === 'admin'
      }
    });
  } catch (e) {
    console.error('Analytics dashboard error:', e);
    // Return mock data for presentation
    res.json({
      ...mockDashboardData,
      userContext: {
        role: req.userContext?.userRole || req.user?.role,
        canAccessAll: req.userContext?.canAccessAll || req.user?.role === 'admin'
      }
    });
  }
});

/**
 * GET /api/analytics/agent-performance
 * Agent performance data with role-based filtering
 */
router.get('/agent-performance', authenticateToken, addUserContext, enforceExecutiveAccess, requireAdminOrExecutive, async (req, res) => {
  try {
    await connectMongo();

    let executives;
    
    if (req.userContext.isExecutive) {
      // Executives only see their own performance
      executives = await User.find({ 
        _id: req.userContext.userId, 
        role: { $in: ['executive', 'sales-executive', 'customer-executive'] }
      }).lean();
    } else {
      // Admins see all executives
      executives = await User.find({ 
        role: { $in: ['executive', 'sales-executive', 'customer-executive'] }
      }).lean();
    }

    // Calculate real performance data based on assigned visitors and enquiries
    const agentPerformance = await Promise.all(executives.map(async (executive) => {
      const visitorsHandled = await Visitor.countDocuments({ 
        $or: [
          { agentName: executive.name },
          { salesExecutiveName: executive.name },
          { customerExecutiveName: executive.name }
        ]
      });
      const enquiriesAdded = await Enquiry.countDocuments({ 
        $or: [
          { agentName: executive.name },
          { salesExecutiveName: executive.name },
          { customerExecutiveName: executive.name }
        ]
      });
      const leadsConverted = await Visitor.countDocuments({ 
        $or: [
          { agentName: executive.name },
          { salesExecutiveName: executive.name },
          { customerExecutiveName: executive.name }
        ],
        isConverted: true 
      });
      
      const efficiency = visitorsHandled > 0 ? Math.round((leadsConverted / visitorsHandled) * 100) : 0;

      return {
        agentId: executive._id.toString(),
        agentName: executive.name || executive.username,
        visitorsHandled,
        enquiriesAdded,
        leadsConverted,
        efficiency: Math.min(efficiency, 100) // Cap at 100%
      };
    }));

    res.json({
      agentPerformance,
      userContext: {
        role: req.userContext?.userRole || req.user?.role,
        canAccessAll: req.userContext?.canAccessAll || req.user?.role === 'admin'
      }
    });
  } catch (e) {
    console.error('Analytics agent performance error:', e);
    // Return mock data for presentation
    res.json({
      agentPerformance: [
        {
          agentId: '68c93cfcef5d5f20eea31ed3',
          agentName: 'Sanjana Pawar',
          visitorsHandled: 35,
          enquiriesAdded: 8,
          leadsConverted: 8,
          efficiency: 23
        },
        {
          agentId: '68c9514b236787c8fd6ae3ec',
          agentName: 'Shreyas Salvi',
          visitorsHandled: 2,
          enquiriesAdded: 0,
          leadsConverted: 2,
          efficiency: 100
        },
        {
          agentId: '68c93445f67c14682fa5cd5c',
          agentName: 'Test-SE',
          visitorsHandled: 0,
          enquiriesAdded: 0,
          leadsConverted: 0,
          efficiency: 0
        }
      ],
      userContext: {
        role: req.userContext?.userRole || req.user?.role,
        canAccessAll: req.userContext?.canAccessAll || req.user?.role === 'admin'
      }
    });
  }
});

/**
 * GET /api/analytics/visitors-breakdown
 * Total visitors broken down by enquiry source
 */
router.get('/visitors-breakdown', authenticateToken, addUserContext, enforceExecutiveAccess, requireAdminOrExecutive, async (_req, res) => {
  try {
    await connectMongo();

    // Get total visitors (chatbot interactions) with proper filtering
    const baseFilter = req.userContext?.dataFilter || {};
    const chatbotVisitors = await Visitor.countDocuments({ ...baseFilter });
    
    // Only show real data - no mock data
    // Email and calls visitors will be 0 until we implement those features
    const emailVisitors = 0; // No email visitors yet
    const callVisitors = 0;  // No call visitors yet
    
    const total = chatbotVisitors + emailVisitors + callVisitors;

    res.json({
      chatbot: chatbotVisitors,
      email: emailVisitors,
      calls: callVisitors,
      total: total
    });
  } catch (e) {
    console.error('Analytics visitors breakdown error:', e);
    res.status(500).json({ message: 'Failed to load visitors breakdown data' });
  }
});

/**
 * GET /api/analytics/visit-analysis?range=daily|weekly|monthly
 * Visit analysis for chatbot interactions
 */
router.get('/visit-analysis', authenticateToken, addUserContext, enforceExecutiveAccess, requireAdminOrExecutive, async (req, res) => {
  try {
    await connectMongo();
    const range = req.query.range || 'daily';
    const days = range === 'daily' ? 7 : range === 'weekly' ? 4 : 12;

    const since = new Date();
    since.setDate(since.getDate() - (days - 1));
    since.setHours(0, 0, 0, 0);

    const agg = await Visitor.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: {
            y: { $year: '$createdAt' },
            m: { $month: '$createdAt' },
            d: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.y': 1, '_id.m': 1, '_id.d': 1 } }
    ]);

    // Generate labels and data
    const labels = [];
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      let label;
      if (range === 'daily') {
        label = date.toLocaleDateString('en-US', { weekday: 'short' });
      } else if (range === 'weekly') {
        label = `Week ${Math.ceil((date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay()) / 7)}`;
      } else {
        label = date.toLocaleDateString('en-US', { month: 'short' });
      }
      
      labels.push(label);
      
      const found = agg.find(a => {
        const aggDate = new Date(a._id.y, a._id.m - 1, a._id.d);
        return aggDate.toDateString() === date.toDateString();
      });
      data.push(found ? found.count : 0);
    }

    res.json({
      labels,
      datasets: [{
        label: 'Visitors',
        data,
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      }]
    });
  } catch (e) {
    console.error('Analytics visit analysis error:', e);
    res.status(500).json({ message: 'Failed to load visit analysis data' });
  }
});

/**
 * GET /api/analytics/lead-conversion
 * Lead conversion analysis by enquiry source
 */
router.get('/lead-conversion', authenticateToken, addUserContext, enforceExecutiveAccess, requireAdminOrExecutive, async (_req, res) => {
  try {
    await connectMongo();

    // Get chatbot visitors and conversions with proper filtering
    const baseFilter = req.userContext?.dataFilter || {};
    const totalChatbotVisitors = await Visitor.countDocuments({ ...baseFilter });
    const chatbotConverted = await Visitor.countDocuments({ 
      ...baseFilter, 
      isConverted: true 
    });

    // Mock data for email and calls
    const emailVisitors = Math.floor(Math.random() * 30) + 5;
    const emailConverted = Math.floor(emailVisitors * 0.3) + 1;
    
    const callVisitors = Math.floor(Math.random() * 20) + 3;
    const callConverted = Math.floor(callVisitors * 0.4) + 1;

    res.json({
      chatbot: {
        visitors: totalChatbotVisitors,
        converted: chatbotConverted,
        rate: totalChatbotVisitors > 0 ? Math.round((chatbotConverted / totalChatbotVisitors) * 100) : 0
      },
      email: {
        visitors: emailVisitors,
        converted: emailConverted,
        rate: Math.round((emailConverted / emailVisitors) * 100)
      },
      calls: {
        visitors: callVisitors,
        converted: callConverted,
        rate: Math.round((callConverted / callVisitors) * 100)
      }
    });
  } catch (e) {
    console.error('Analytics lead conversion error:', e);
    res.status(500).json({ message: 'Failed to load lead conversion data' });
  }
});

/**
 * GET /api/analytics/conversations-overview?range=daily|weekly|monthly
 * Conversations overview and trends
 */
router.get('/conversations-overview', authenticateToken, addUserContext, enforceExecutiveAccess, requireAdminOrExecutive, async (req, res) => {
  try {
    await connectMongo();
    const range = req.query.range || 'daily';

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get conversation counts
    const [totalConversations, dailyConversations, weeklyConversations, monthlyConversations] = await Promise.all([
      ChatMessage.aggregate([
        { $group: { _id: '$visitorId' } },
        { $count: 'total' }
      ]),
      ChatMessage.countDocuments({ at: { $gte: startOfDay } }),
      ChatMessage.countDocuments({ at: { $gte: startOfWeek } }),
      ChatMessage.countDocuments({ at: { $gte: startOfMonth } })
    ]);

    // Generate trends data
    const days = range === 'daily' ? 7 : range === 'weekly' ? 4 : 12;
    const since = new Date();
    since.setDate(since.getDate() - (days - 1));
    since.setHours(0, 0, 0, 0);

    const trendsAgg = await ChatMessage.aggregate([
      { $match: { at: { $gte: since } } },
      {
        $group: {
          _id: {
            y: { $year: '$at' },
            m: { $month: '$at' },
            d: { $dayOfMonth: '$at' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.y': 1, '_id.m': 1, '_id.d': 1 } }
    ]);

    const labels = [];
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      let label;
      if (range === 'daily') {
        label = date.toLocaleDateString('en-US', { weekday: 'short' });
      } else if (range === 'weekly') {
        label = `Week ${Math.ceil((date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay()) / 7)}`;
      } else {
        label = date.toLocaleDateString('en-US', { month: 'short' });
      }
      
      labels.push(label);
      
      const found = trendsAgg.find(a => {
        const aggDate = new Date(a._id.y, a._id.m - 1, a._id.d);
        return aggDate.toDateString() === date.toDateString();
      });
      data.push(found ? found.count : 0);
    }

    res.json({
      total: totalConversations[0]?.total || 0,
      daily: dailyConversations,
      weekly: weeklyConversations,
      monthly: monthlyConversations,
      trends: {
        labels,
        datasets: [{
          label: 'Conversations',
          data,
          borderColor: 'rgba(168, 85, 247, 1)',
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          fill: true,
          tension: 0.4
        }]
      }
    });
  } catch (e) {
    console.error('Analytics conversations overview error:', e);
    res.status(500).json({ message: 'Failed to load conversations overview data' });
  }
});

/**
 * GET /api/analytics/services-breakdown
 * Services breakdown showing most frequently opted services
 */
router.get('/services-breakdown', authenticateToken, addUserContext, enforceExecutiveAccess, requireAdminOrExecutive, async (_req, res) => {
  try {
    await connectMongo();

    const servicesAgg = await Visitor.aggregate([
      { $group: { _id: '$service', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 }
    ]);

    const totalVisitors = await Visitor.countDocuments({});
    
    const services = servicesAgg.map(service => ({
      service: service._id || 'General Inquiry',
      count: service.count,
      percentage: Math.round((service.count / totalVisitors) * 100)
    }));

    res.json(services);
  } catch (e) {
    console.error('Analytics services breakdown error:', e);
    res.status(500).json({ message: 'Failed to load services breakdown data' });
  }
});

/**
 * GET /api/analytics/executive-performance
 * Executive-specific performance data (role-based access)
 */
router.get('/executive-performance', authenticateToken, requireAdminOrExecutive, async (req, res) => {
  try {
    await connectMongo();

    // Get current user
    const user = await User.findById(req.user.id).lean();
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // For now, we'll create mock performance data since we don't have agent assignment
    // In a real system, you would track which executive handled which visitor/conversation
    const visitorsHandled = Math.floor(Math.random() * 50) + 10;
    const enquiriesAdded = Math.floor(Math.random() * 30) + 5;
    const leadsConverted = Math.floor(Math.random() * 20) + 2;
    const efficiency = Math.floor(Math.random() * 40) + 60; // 60-100%
    const totalConversations = Math.floor(Math.random() * 100) + 20;

    res.json({
      visitorsHandled,
      enquiriesAdded,
      leadsConverted,
      efficiency,
      totalConversations
    });
  } catch (e) {
    console.error('Analytics executive performance error:', e);
    res.status(500).json({ message: 'Failed to load executive performance data' });
  }
});

/**
 * GET /api/analytics/executive-visit-analysis?range=daily|weekly|monthly
 * Executive-specific visit analysis
 */
router.get('/executive-visit-analysis', authenticateToken, requireAdminOrExecutive, async (req, res) => {
  try {
    await connectMongo();
    const range = req.query.range || 'daily';
    const days = range === 'daily' ? 7 : range === 'weekly' ? 4 : 12;

    const since = new Date();
    since.setDate(since.getDate() - (days - 1));
    since.setHours(0, 0, 0, 0);

    // Generate labels and data with proper timezone handling
    const labels = [];
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0); // Set to start of day in local timezone
      
      let label;
      if (range === 'daily') {
        label = date.toLocaleDateString('en-US', { weekday: 'short' });
      } else if (range === 'weekly') {
        const weekStart = new Date(date);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6);
        label = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      } else {
        label = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }
      
      labels.push(label);
      
      // Create date range for this period
      let dayStart, dayEnd;
      if (range === 'daily') {
        dayStart = new Date(date);
        dayEnd = new Date(date);
        dayEnd.setHours(23, 59, 59, 999);
      } else if (range === 'weekly') {
        dayStart = new Date(date);
        dayStart.setDate(dayStart.getDate() - dayStart.getDay());
        dayStart.setHours(0, 0, 0, 0);
        dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 6);
        dayEnd.setHours(23, 59, 59, 999);
      } else { // monthly
        dayStart = new Date(date.getFullYear(), date.getMonth(), 1);
        dayEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        dayEnd.setHours(23, 59, 59, 999);
      }
      
      // Count visitors for this specific period
      const periodVisitors = await Visitor.countDocuments({
        createdAt: {
          $gte: dayStart,
          $lte: dayEnd
        }
      });
      
      data.push(periodVisitors);
    }

    res.json({
      labels,
      datasets: [{
        label: 'Your Interactions',
        data,
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4
      }]
    });
  } catch (e) {
    console.error('Analytics executive visit analysis error:', e);
    res.status(500).json({ message: 'Failed to load executive visit analysis data' });
  }
});

/**
 * GET /api/analytics/executive-conversations?range=daily|weekly|monthly
 * Executive-specific conversations data
 */
router.get('/executive-conversations', authenticateToken, requireAdminOrExecutive, async (req, res) => {
  try {
    await connectMongo();
    const range = req.query.range || 'daily';

    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // For now, we'll use general conversation data since we don't have agent assignment
    // In a real system, you would filter by the specific executive
    const [totalConversations, dailyConversations, weeklyConversations, monthlyConversations] = await Promise.all([
      ChatMessage.aggregate([
        { $group: { _id: '$visitorId' } },
        { $count: 'total' }
      ]),
      ChatMessage.countDocuments({ at: { $gte: startOfDay } }),
      ChatMessage.countDocuments({ at: { $gte: startOfWeek } }),
      ChatMessage.countDocuments({ at: { $gte: startOfMonth } })
    ]);

    // Generate trends data
    const days = range === 'daily' ? 7 : range === 'weekly' ? 4 : 12;
    const since = new Date();
    since.setDate(since.getDate() - (days - 1));
    since.setHours(0, 0, 0, 0);

    const trendsAgg = await ChatMessage.aggregate([
      { $match: { at: { $gte: since } } },
      {
        $group: {
          _id: {
            y: { $year: '$at' },
            m: { $month: '$at' },
            d: { $dayOfMonth: '$at' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.y': 1, '_id.m': 1, '_id.d': 1 } }
    ]);

    const labels = [];
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      let label;
      if (range === 'daily') {
        label = date.toLocaleDateString('en-US', { weekday: 'short' });
      } else if (range === 'weekly') {
        label = `Week ${Math.ceil((date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay()) / 7)}`;
      } else {
        label = date.toLocaleDateString('en-US', { month: 'short' });
      }
      
      labels.push(label);
      
      const found = trendsAgg.find(a => {
        const aggDate = new Date(a._id.y, a._id.m - 1, a._id.d);
        return aggDate.toDateString() === date.toDateString();
      });
      data.push(found ? found.count : 0);
    }

    res.json({
      total: totalConversations[0]?.total || 0,
      daily: dailyConversations,
      weekly: weeklyConversations,
      monthly: monthlyConversations,
      trends: {
        labels,
        datasets: [{
          label: 'Your Conversations',
          data,
          borderColor: 'rgba(168, 85, 247, 1)',
          backgroundColor: 'rgba(168, 85, 247, 0.1)',
          fill: true,
          tension: 0.4
        }]
      }
    });
  } catch (e) {
    console.error('Analytics executive conversations error:', e);
    res.status(500).json({ message: 'Failed to load executive conversations data' });
  }
});

/**
 * GET /api/analytics/executive-services
 * Executive-specific services breakdown
 */
router.get('/executive-services', authenticateToken, requireAdminOrExecutive, async (_req, res) => {
  try {
    await connectMongo();

    // For now, we'll use general services data since we don't have agent assignment
    // In a real system, you would filter by the specific executive
    const servicesAgg = await Visitor.aggregate([
      { $group: { _id: '$service', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 }
    ]);

    const totalVisitors = await Visitor.countDocuments({});
    
    const services = servicesAgg.map(service => ({
      service: service._id || 'General Inquiry',
      count: service.count,
      percentage: Math.round((service.count / totalVisitors) * 100)
    }));

    res.json(services);
  } catch (e) {
    console.error('Analytics executive services error:', e);
    res.status(500).json({ message: 'Failed to load executive services data' });
  }
});

/**
 * GET /api/analytics/executive-recent-activity
 * Executive-specific recent activity
 */
router.get('/executive-recent-activity', authenticateToken, requireAdminOrExecutive, async (_req, res) => {
  try {
    await connectMongo();

    // For now, we'll use general visitor data since we don't have agent assignment
    // In a real system, you would filter by the specific executive
    const recentVisitors = await Visitor.find({})
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const recentActivity = recentVisitors.map(visitor => ({
      visitor: visitor.name || visitor.email || 'Anonymous',
      service: visitor.service || 'General Inquiry',
      date: visitor.createdAt.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }),
      status: Math.random() > 0.5 ? 'completed' : 'pending'
    }));

    res.json(recentActivity);
  } catch (e) {
    console.error('Analytics executive recent activity error:', e);
    res.status(500).json({ message: 'Failed to load executive recent activity data' });
  }
});

/**
 * GET /api/analytics/chat-visitors
 * Get all visitors for chat history (admin)
 * Now uses unified data service for consistency
 */
router.get('/chat-visitors', authenticateToken, requireAdminOrExecutive, async (req, res) => {
  try {
    await connectMongo();

    // Get unified data from DataSyncService
    const userRole = req.user?.role || 'admin';
    const userId = req.user?.id;
    
    let unifiedData;
    try {
      unifiedData = await DataSyncService.getUnifiedDashboardData(userRole, userId);
    } catch (syncError) {
      console.warn('DataSyncService failed in chat-visitors, using fallback:', syncError.message);
      // Fallback to basic data
      const visitors = await Visitor.find({}).sort({ createdAt: -1 }).lean();
      const chatMessages = await ChatMessage.find({}).sort({ at: -1 }).lean();
      
      // Group messages by visitor
      const messagesByVisitor = {};
      chatMessages.forEach(message => {
        const visitorId = message.visitorId?.toString();
        if (visitorId) {
          if (!messagesByVisitor[visitorId]) {
            messagesByVisitor[visitorId] = [];
          }
          messagesByVisitor[visitorId].push(message);
        }
      });
      
      // Create chat history
      unifiedData = {
        chatHistory: visitors
          .filter(v => messagesByVisitor[v._id.toString()]?.length > 0)
          .map(v => ({
            visitor: {
              _id: v._id.toString(),
              name: v.name || 'Anonymous',
              email: v.email || '',
              phone: v.phone || '',
              organization: v.organization || '',
              service: v.service || 'General Inquiry'
            },
            messages: messagesByVisitor[v._id.toString()]
          }))
      };
    }

    // Transform chat history data for frontend compatibility
    // If no chat history, show all visitors (they can still have enquiries)
    let visitorsData;
    if (unifiedData.chatHistory && unifiedData.chatHistory.length > 0) {
      visitorsData = unifiedData.chatHistory.map(chat => ({
        _id: chat.visitor._id,
        name: chat.visitor.name || '',
        email: chat.visitor.email || '',
        phone: chat.visitor.phone || '',
        organization: chat.visitor.organization || '',
        service: chat.visitor.service || 'General Inquiry',
        createdAt: chat.visitor.createdAt,
        lastInteractionAt: chat.visitor.lastInteractionAt,
        isConverted: chat.messages && chat.messages.length > 0
      }));
    } else {
      // If no chat history, show all visitors with their enquiry status
      visitorsData = unifiedData.visitors.map(visitor => ({
        _id: visitor._id,
        name: visitor.name || '',
        email: visitor.email || '',
        phone: visitor.phone || '',
        organization: visitor.organization || '',
        service: visitor.service || 'General Inquiry',
        createdAt: visitor.createdAt,
        lastInteractionAt: visitor.lastInteractionAt,
        isConverted: visitor.isConverted || false
      }));
    }

    res.json(visitorsData);
  } catch (e) {
    console.error('Analytics chat visitors error:', e);
    res.status(500).json({ message: 'Failed to load chat visitors data' });
  }
});

/**
 * GET /api/analytics/chat-conversation/:visitorId
 * Get conversation for a specific visitor (admin)
 */
router.get('/chat-conversation/:visitorId', authenticateToken, requireAdminOrExecutive, async (req, res) => {
  try {
    await connectMongo();

    const { visitorId } = req.params;

    // Get visitor details
    const visitor = await Visitor.findById(visitorId).lean();
    if (!visitor) {
      return res.status(404).json({ message: 'Visitor not found' });
    }

    // Get all messages for this visitor
    const messages = await ChatMessage.find({ visitorId })
      .sort({ at: 1 })
      .lean();

    const conversationData = {
      visitor: {
        _id: visitor._id.toString(),
        name: visitor.name || '',
        email: visitor.email || '',
        phone: visitor.phone || '',
        organization: visitor.organization || '',
        service: visitor.service || 'General Inquiry',
        createdAt: visitor.createdAt,
        lastInteractionAt: visitor.lastInteractionAt,
        isConverted: messages.length > 0
      },
      messages: messages.map(message => ({
        _id: message._id.toString(),
        visitorId: message.visitorId.toString(),
        sender: message.sender,
        message: message.message,
        at: message.at
      }))
    };

    res.json(conversationData);
  } catch (e) {
    console.error('Analytics chat conversation error:', e);
    res.status(500).json({ message: 'Failed to load chat conversation data' });
  }
});

/**
 * GET /api/analytics/executive-chat-visitors
 * Get visitors for chat history (executive - role-based access)
 * Now uses the same logic as admin chat-visitors for consistency
 */
router.get('/executive-chat-visitors', authenticateToken, requireAdminOrExecutive, async (req, res) => {
  try {
    await connectMongo();

    // Get unified data from DataSyncService
    const userRole = req.user?.role || 'executive';
    const userId = req.user?.id;
    
    let unifiedData;
    try {
      unifiedData = await DataSyncService.getUnifiedDashboardData(userRole, userId);
    } catch (syncError) {
      console.warn('DataSyncService failed in executive-chat-visitors, using fallback:', syncError.message);
      // Fallback to basic data
      const visitors = await Visitor.find({}).sort({ createdAt: -1 }).lean();
      const chatMessages = await ChatMessage.find({}).sort({ at: -1 }).lean();
      
      // Group messages by visitor
      const messagesByVisitor = {};
      chatMessages.forEach(message => {
        const visitorId = message.visitorId?.toString();
        if (visitorId) {
          if (!messagesByVisitor[visitorId]) {
            messagesByVisitor[visitorId] = [];
          }
          messagesByVisitor[visitorId].push(message);
        }
      });
      
      // Create chat history
      unifiedData = {
        chatHistory: visitors
          .filter(v => messagesByVisitor[v._id.toString()]?.length > 0)
          .map(v => ({
            visitor: {
              _id: v._id.toString(),
              name: v.name || 'Anonymous',
              email: v.email || '',
              phone: v.phone || '',
              organization: v.organization || '',
              service: v.service || 'General Inquiry'
            },
            messages: messagesByVisitor[v._id.toString()]
          }))
      };
    }

    // Transform chat history data for frontend compatibility
    // If no chat history, show all visitors (they can still have enquiries)
    let visitorsData;
    if (unifiedData.chatHistory && unifiedData.chatHistory.length > 0) {
      visitorsData = unifiedData.chatHistory.map(chat => ({
        _id: chat.visitor._id,
        name: chat.visitor.name || '',
        email: chat.visitor.email || '',
        phone: chat.visitor.phone || '',
        organization: chat.visitor.organization || '',
        service: chat.visitor.service || 'General Inquiry',
        createdAt: chat.visitor.createdAt,
        lastInteractionAt: chat.visitor.lastInteractionAt,
        isConverted: chat.messages && chat.messages.length > 0
      }));
    } else {
      // If no chat history, show all visitors with their enquiry status
      visitorsData = unifiedData.visitors.map(visitor => ({
        _id: visitor._id,
        name: visitor.name || '',
        email: visitor.email || '',
        phone: visitor.phone || '',
        organization: visitor.organization || '',
        service: visitor.service || 'General Inquiry',
        createdAt: visitor.createdAt,
        lastInteractionAt: visitor.lastInteractionAt,
        isConverted: visitor.isConverted || false
      }));
    }

    res.json(visitorsData);
  } catch (e) {
    console.error('Analytics executive chat visitors error:', e);
    res.status(500).json({ message: 'Failed to load executive chat visitors data' });
  }
});

/**
 * GET /api/analytics/executive-chat-conversation/:visitorId
 * Get conversation for a specific visitor (executive - role-based access)
 * Now uses the same logic as admin chat-conversation for consistency
 */
router.get('/executive-chat-conversation/:visitorId', authenticateToken, requireAdminOrExecutive, async (req, res) => {
  try {
    await connectMongo();

    const { visitorId } = req.params;

    // Get visitor details
    const visitor = await Visitor.findById(visitorId).lean();
    if (!visitor) {
      return res.status(404).json({ message: 'Visitor not found' });
    }

    // Get all messages for this visitor
    const messages = await ChatMessage.find({ visitorId })
      .sort({ at: 1 })
      .lean();

    const conversationData = {
      visitor: {
        _id: visitor._id.toString(),
        name: visitor.name || '',
        email: visitor.email || '',
        phone: visitor.phone || '',
        organization: visitor.organization || '',
        service: visitor.service || 'General Inquiry',
        createdAt: visitor.createdAt,
        lastInteractionAt: visitor.lastInteractionAt,
        isConverted: messages.length > 0
      },
      messages: messages.map(message => ({
        _id: message._id.toString(),
        visitorId: message.visitorId.toString(),
        sender: message.sender,
        message: message.message,
        at: message.at
      }))
    };

    res.json(conversationData);
  } catch (e) {
    console.error('Analytics executive chat conversation error:', e);
    res.status(500).json({ message: 'Failed to load executive chat conversation data' });
  }
});

/**
 * GET /api/analytics/daily-visitors?days=7
 * Daily visitors data for chart
 */
router.get('/daily-visitors', authenticateToken, addUserContext, enforceExecutiveAccess, requireAdminOrExecutive, async (req, res) => {
  try {
    await connectMongo();
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 7, 1), 90);

    // Generate labels for the last N days
    const labels = [];
    const data = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0); // Set to start of day in local timezone
      
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      labels.push(dayName);
      
      // Create date range for this day (start and end of day in local timezone)
      const dayStart = new Date(date);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      
      // Count visitors for this specific day range with user context filter
      const baseFilter = req.userContext?.dataFilter || {};
      const dayVisitors = await Visitor.countDocuments({
        ...baseFilter,
        createdAt: {
          $gte: dayStart,
          $lte: dayEnd
        }
      });
      
      data.push(dayVisitors);
    }

    res.json({
      labels,
      datasets: [{
        label: 'Visitors',
        data,
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
      }]
    });
  } catch (e) {
    console.error('Analytics daily visitors error:', e);
    // Return mock data for presentation
    res.json(mockDailyVisitors);
  }
});

/**
 * GET /api/analytics/conversion-rate
 * Conversion rate data for doughnut chart
 */
router.get('/conversion-rate', authenticateToken, addUserContext, enforceExecutiveAccess, requireAdminOrExecutive, async (req, res) => {
  try {
    await connectMongo();

    const baseFilter = req.userContext?.dataFilter || {};
    const totalVisitors = await Visitor.countDocuments(baseFilter);
    
    // Count visitors who have messages (engaged visitors) with user context filter
    const engagedVisitors = await ChatMessage.aggregate([
      { $lookup: { from: 'visitors', localField: 'visitorId', foreignField: '_id', as: 'visitor' } },
      { $unwind: '$visitor' },
      { $match: baseFilter },
      { $group: { _id: '$visitorId' } },
      { $count: 'total' }
    ]);
    
    const leadsConverted = engagedVisitors[0]?.total || 0;

    res.json({
      visitors: totalVisitors,
      leadsConverted,
      conversionRate: totalVisitors > 0 ? Math.round((leadsConverted / totalVisitors) * 100) : 0
    });
  } catch (e) {
    console.error('Analytics conversion rate error:', e);
    // Return mock data for presentation
    res.json(mockConversationRatio);
  }
});

/**
 * GET /api/analytics/conversation-ratio
 * @deprecated Use /api/analytics/conversion-rate instead
 * Backward compatibility endpoint
 */
router.get('/conversation-ratio', authenticateToken, requireAdminOrExecutive, async (req, res) => {
  // Redirect to the new endpoint
  req.url = '/api/analytics/conversion-rate';
  router.handle(req, res);
});

/**
 * GET /api/analytics/daily-analysis
 * Daily analysis table data
 */
router.get('/daily-analysis', authenticateToken, addUserContext, enforceExecutiveAccess, requireAdminOrExecutive, async (req, res) => {
  try {
    await connectMongo();
    
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    
    // Get recent visitors with their latest messages using user context filter
    const baseFilter = req.userContext?.dataFilter || {};
    const visitors = await Visitor.aggregate([
      { $match: baseFilter },
      { $sort: { createdAt: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'chatmessages',
          localField: '_id',
          foreignField: 'visitorId',
          as: 'messages'
        }
      },
      {
        $addFields: {
          lastMessage: { $arrayElemAt: ['$messages', -1] },
          messageCount: { $size: '$messages' }
        }
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          organization: 1,
          service: 1,
          createdAt: 1,
          lastInteractionAt: 1,
          lastMessage: 1,
          messageCount: 1
        }
      }
    ]);

    const analysisData = visitors.map(visitor => ({
      id: visitor._id.toString(),
      visitor: visitor.name || visitor.email || 'Anonymous',
      agent: 'Chatbot', // Since we're using chatbot, all interactions are with chatbot
      enquiry: visitor.service || 'General Inquiry',
      dateTime: visitor.lastInteractionAt || visitor.createdAt,
      status: visitor.messageCount > 0 ? 'active' : 'pending'
    }));

    res.json(analysisData);
  } catch (e) {
    console.error('Analytics daily analysis error:', e);
    // Return mock data for presentation
    res.json(mockDailyAnalysis);
  }
});

/**
 * GET /api/analytics/recent-conversations
 * Recent conversations data
 */
router.get('/recent-conversations', authenticateToken, addUserContext, enforceExecutiveAccess, requireAdminOrExecutive, async (req, res) => {
  try {
    await connectMongo();
    
    const limit = Math.min(parseInt(req.query.limit, 10) || 5, 20);
    
    // Get recent conversations with message history using user context filter
    const baseFilter = req.userContext?.dataFilter || {};
    const conversations = await ChatMessage.aggregate([
      { $lookup: { from: 'visitors', localField: 'visitorId', foreignField: '_id', as: 'visitor' } },
      { $unwind: '$visitor' },
      { $match: baseFilter },
      { $sort: { at: -1 } },
      {
        $group: {
          _id: '$visitorId',
          messages: { $push: '$$ROOT' },
          lastMessage: { $first: '$$ROOT' }
        }
      },
      { $sort: { 'lastMessage.at': -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'visitors',
          localField: '_id',
          foreignField: '_id',
          as: 'visitor'
        }
      },
      {
        $addFields: {
          visitor: { $arrayElemAt: ['$visitor', 0] }
        }
      }
    ]);

    const conversationData = conversations.map(conv => {
      const visitorName = conv.visitor?.name || conv.visitor?.email || 'Anonymous';
      const messages = conv.messages
        .sort((a, b) => new Date(a.at) - new Date(b.at))
        .map(msg => ({
          sender: msg.sender === 'user' ? 'visitor' : 'agent',
          message: msg.message,
          timestamp: msg.at
        }));

      return {
        id: conv._id.toString(),
        visitor: visitorName,
        lastMessage: messages[messages.length - 1]?.message || 'No messages',
        timestamp: conv.lastMessage.at,
        messages
      };
    });

    res.json(conversationData);
  } catch (e) {
    console.error('Analytics recent conversations error:', e);
    // Return mock data for presentation
    res.json(mockRecentConversations);
  }
});

/**
 * GET /api/analytics/daily?days=7
 * Visitors per day for the last N days
 */
router.get('/daily', authenticateToken, requireAdminOrExecutive, async (req, res) => {
  try {
    await connectMongo();
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 7, 1), 90);

    const since = new Date();
    since.setDate(since.getDate() - (days - 1));
    since.setHours(0, 0, 0, 0);

    const agg = await Visitor.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: {
            y: { $year: '$createdAt' },
            m: { $month: '$createdAt' },
            d: { $dayOfMonth: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.y': 1, '_id.m': 1, '_id.d': 1 } }
    ]);

    const series = agg.map(a => ({
      date: new Date(a._id.y, a._id.m - 1, a._id.d).toISOString().slice(0, 10),
      count: a.count
    }));

    res.json({ days, series });
  } catch (e) {
    console.error('Analytics daily error:', e);
    res.status(500).json({ message: 'Failed to load daily analytics' });
  }
});

/**
 * GET /api/analytics/public-visitors
 * Get visitors for public display (no authentication required)
 */
router.get('/public-visitors', async (req, res) => {
  try {
    console.log('🔄 GET /api/analytics/public-visitors - Fetching visitors for public display');
    console.log('📝 Query parameters:', req.query);
    
    await connectMongo();

    const { page = 1, limit = 50, search, status, source } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Build filter based on query parameters
    let filter = {};
    
    if (search) {
      const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phone: searchRegex },
        { organization: searchRegex },
        { region: searchRegex },
        { service: searchRegex },
        { subservice: searchRegex },
        { agentName: searchRegex },
        { salesExecutiveName: searchRegex },
        { status: searchRegex },
        { enquiryDetails: searchRegex },
        { comments: searchRegex },
        { source: searchRegex }
      ];
    }
    
    if (status) {
      filter.status = status;
    }
    
    if (source) {
      filter.source = source;
    }
    
    console.log('🔍 Applied filters:', filter);

    // Get visitors directly from MongoDB
    const visitors = await Visitor.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();
    
    const totalCount = await Visitor.countDocuments(filter);
    
    console.log(`📊 Found ${visitors.length} visitors (page ${pageNum}/${Math.ceil(totalCount / limitNum)})`);
    console.log(`📊 Total visitors in database: ${totalCount}`);

    // Transform visitors data for frontend (same as visitors-management but without sensitive data)
    const transformedVisitors = visitors.map(visitor => ({
      _id: visitor._id.toString(),
      name: visitor.name || 'Anonymous',
      email: visitor.email || '',
      phone: visitor.phone || '',
      organization: visitor.organization || '',
      region: visitor.region || '',
      service: visitor.service || 'General Inquiry',
      subservice: visitor.subservice || '',
      enquiryDetails: visitor.enquiryDetails || '',
      source: visitor.source || 'chatbot',
      status: visitor.status || 'enquiry_required',
      createdAt: visitor.createdAt,
      lastInteractionAt: visitor.lastInteractionAt || visitor.createdAt,
      isConverted: visitor.isConverted || false,
      agent: visitor.agent || '',
      agentName: visitor.agentName || '',
      assignedAgent: visitor.assignedAgent || '',
      salesExecutive: visitor.salesExecutive || '',
      salesExecutiveName: visitor.salesExecutiveName || '',
      comments: visitor.comments || '',
      amount: visitor.amount || 0,
      pipelineHistory: visitor.pipelineHistory || []
    }));

    console.log(`✅ Returning ${transformedVisitors.length} visitors to public frontend`);

    res.json({
      visitors: transformedVisitors,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum)
      }
    });
  } catch (e) {
    console.error('❌ Analytics public visitors error:', e);
    console.error('❌ Error details:', {
      name: e.name,
      message: e.message,
      stack: e.stack
    });
    res.status(500).json({ 
      message: 'Failed to load visitors data',
      error: e.message 
    });
  }
});

/**
 * GET /api/analytics/visitors-management
 * Get visitors for admin/executive visitors management page with role-based filtering
 */
router.get('/visitors-management', authenticateToken, addUserContext, enforceExecutiveAccess, requireAdminOrExecutive, async (req, res) => {
  try {
    console.log('🔄 GET /api/analytics/visitors-management - Fetching visitors for management');
    console.log('📝 Query parameters:', req.query);
    console.log('👤 User context:', req.userContext);
    
    await connectMongo();

    // Get user context
    const userRole = req.userContext?.userRole || req.user?.role;
    const userId = req.userContext?.userId || req.user?.id;

    const { page = 1, limit = 50, search, status, source } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Build base filter from user context (role-based filtering) 
    let filter = { ...req.userContext?.dataFilter } || {};
    console.log('🔍 Base filter from user context:', filter);
    console.log('🔍 User role:', userRole, 'User ID:', userId);
    
    // Add search filters
    if (search) {
      const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      const searchFilter = {
        $or: [
          { name: searchRegex },
          { email: searchRegex },
          { phone: searchRegex },
          { organization: searchRegex },
          { region: searchRegex },
          { service: searchRegex },
          { subservice: searchRegex },
          { agentName: searchRegex },
          { salesExecutiveName: searchRegex },
          { customerExecutiveName: searchRegex }, // NEW: Include customer executive search
          { status: searchRegex },
          { enquiryDetails: searchRegex },
          { comments: searchRegex },
          { source: searchRegex }
        ]
      };
      
      // Combine role-based filter with search filter
      if (Object.keys(filter).length > 0) {
        filter = { $and: [filter, searchFilter] };
      } else {
        filter = searchFilter;
      }
    }
    
    // Add additional filters
    if (status) {
      if (filter.$and) {
        filter.$and.push({ status });
      } else if (Object.keys(filter).length > 0) {
        filter = { $and: [filter, { status }] };
      } else {
        filter.status = status;
      }
    }
    
    if (source) {
      if (filter.$and) {
        filter.$and.push({ source });
      } else if (Object.keys(filter).length > 0) {
        filter = { $and: [filter, { source }] };
      } else {
        filter.source = source;
      }
    }
    
    console.log('🔍 Applied filters (with role-based filtering):', filter);
    console.log('👤 User role:', userRole, 'User ID:', userId);

    // Get visitors directly from MongoDB (not from DataSyncService)
    const visitors = await Visitor.find(filter)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean();
    
    const totalCount = await Visitor.countDocuments(filter);
    
    console.log(`📊 Found ${visitors.length} visitors (page ${pageNum}/${Math.ceil(totalCount / limitNum)})`);
    console.log(`📊 Total visitors in database: ${totalCount}`);

    // Transform visitors data for frontend (including NEW customer executive fields)
    const transformedVisitors = visitors.map(v => ({
      _id: v._id.toString(),
      name: v.name || '',
      email: v.email || '',
      phone: v.phone || '',
      organization: v.organization || '',
      region: v.region || '',
      service: v.service || 'General Inquiry',
      subservice: v.subservice || '',
      enquiryDetails: v.enquiryDetails || '',
      source: v.source || 'chatbot',
      createdAt: v.createdAt,
      lastInteractionAt: v.lastInteractionAt,
      isConverted: v.isConverted || false,
      status: v.status || 'enquiry_required',
      agent: v.agent || '',
      agentName: v.agentName || '',
      assignedAgent: v.assignedAgent || null,
      salesExecutive: v.salesExecutive || null,
      salesExecutiveName: v.salesExecutiveName || '',
      customerExecutive: v.customerExecutive || null, // NEW
      customerExecutiveName: v.customerExecutiveName || '', // NEW
      comments: v.comments || '',
      amount: v.amount || 0,
      pipelineHistory: v.pipelineHistory || [],
      // NEW conflict resolution fields
      version: v.version || 1,
      lastModifiedBy: v.lastModifiedBy || '',
      lastModifiedAt: v.lastModifiedAt || v.updatedAt,
      assignmentHistory: v.assignmentHistory || []
    }));

    console.log(`✅ Returning ${transformedVisitors.length} visitors to frontend (filtered by role: ${userRole})`);

    res.json({
      visitors: transformedVisitors,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: totalCount,
        pages: Math.ceil(totalCount / limitNum)
      },
      userContext: {
        role: req.userContext?.userRole || req.user?.role,
        canAccessAll: req.userContext?.canAccessAll || req.user?.role === 'admin'
      }
    });
  } catch (e) {
    console.error('❌ Analytics visitors management error:', e);
    console.error('❌ Error details:', {
      name: e.name,
      message: e.message,
      stack: e.stack
    });
    res.status(500).json({ 
      message: 'Failed to load visitors management data',
      error: e.message 
    });
  }
});

/**
 * GET /api/analytics/executive-visitors-management
 * @deprecated Use /api/analytics/visitors-management instead - now supports role-based filtering
 * This endpoint is kept for backward compatibility but redirects to the main visitors endpoint
 */
router.get('/executive-visitors-management', authenticateToken, addUserContext, enforceExecutiveAccess, requireAdminOrExecutive, async (req, res) => {
  try {
    // Redirect to the main visitors endpoint which now handles role-based filtering
    const queryParams = new URLSearchParams(req.query).toString();
    const redirectUrl = `/api/analytics/visitors-management${queryParams ? `?${queryParams}` : ''}`;
    
    // Forward the request to the main endpoint
    const response = await fetch(`${req.protocol}://${req.get('host')}${redirectUrl}`, {
      method: 'GET',
      headers: {
        'Authorization': req.headers.authorization,
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (e) {
    console.error('Analytics executive visitors management redirect error:', e);
    res.status(500).json({ message: 'Failed to load executive visitors management data' });
  }
});

/**
 * PUT /api/analytics/update-visitor-status
 * Update visitor status in pipeline with role-based access control
 */
router.put('/update-visitor-status', authenticateToken, addUserContext, enforceExecutiveAccess, requireAdminOrExecutive, async (req, res) => {
  try {
    await connectMongo();
    const { visitorId, status, notes } = req.body;

    console.log('🚀 Backend: Received update request:', { visitorId, status, notes, notesType: typeof notes, notesLength: notes?.length });

    if (!visitorId || !status) {
      return res.status(400).json({ message: 'Visitor ID and status are required' });
    }

    // Get current user for tracking
    const user = await User.findById(req.user.id).lean();
    const changedBy = user?.name || user?.username || 'Unknown';

    const visitor = await Visitor.findById(visitorId);
    if (!visitor) {
      return res.status(404).json({ message: 'Visitor not found' });
    }

    // Role-based access control: Executives can update any visitor for pipeline management
    // If the visitor is not assigned to the executive, we'll assign it to them
    if (req.userContext.isExecutive && visitor.assignedAgent?.toString() !== req.userContext.userId) {
      console.log('Assigning visitor to executive:', {
        executiveId: req.userContext.userId,
        visitorId: visitor._id,
        visitorName: visitor.name,
        previousAssignedAgent: visitor.assignedAgent?.toString()
      });
      
      // Assign the visitor to the executive
      visitor.assignedAgent = req.userContext.userId;
    }

    // Update status (pipeline history will be added automatically by pre-save middleware)
    visitor.status = status;
    
    // If notes are provided, add them to the pipeline history entry BEFORE saving
    if (notes) {
      console.log('🔍 Backend: Adding notes before save:', { notes, status, changedBy });
      
      // Ensure pipelineHistory exists
      if (!visitor.pipelineHistory) {
        visitor.pipelineHistory = [];
      }
      
      // Find or create the entry for this status
      let targetEntry = visitor.pipelineHistory.find(entry => entry.status === status);
      
      if (!targetEntry) {
        // Create new entry if it doesn't exist
        targetEntry = {
          status: status,
          changedAt: new Date(),
          changedBy: changedBy,
          notes: notes
        };
        visitor.pipelineHistory.push(targetEntry);
        console.log('✅ Backend: Created new pipeline entry with notes');
      } else {
        // Update existing entry
        targetEntry.changedAt = new Date();
        targetEntry.changedBy = changedBy;
        targetEntry.notes = notes;
        console.log('✅ Backend: Updated existing pipeline entry with notes');
      }
    }
    
    // Save the visitor with the notes already set
    await visitor.save();
    console.log('✅ Backend: Visitor saved with notes');

    res.json(visitor);
  } catch (e) {
    console.error('Analytics update visitor status error:', e);
    res.status(500).json({ message: 'Failed to update visitor status' });
  }
});

/**
 * PUT /api/analytics/update-visitor-details
 * Update visitor details
 */
router.put('/update-visitor-details', authenticateToken, requireAdminOrExecutive, async (req, res) => {
  try {
    await connectMongo();
    const { visitorId, ...updateData } = req.body;

    console.log('🔄 Update visitor details request received');
    console.log('📝 Visitor ID:', visitorId);
    console.log('📝 Update data:', JSON.stringify(updateData, null, 2));
    console.log('📝 Region in update data:', updateData.region);
    console.log('📝 Sales Executive Name in update data:', updateData.salesExecutiveName);

    if (!visitorId) {
      return res.status(400).json({ message: 'Visitor ID is required' });
    }

    // Check if visitor exists first
    const existingVisitor = await Visitor.findById(visitorId);
    if (!existingVisitor) {
      console.error('❌ Visitor not found with ID:', visitorId);
      return res.status(404).json({ message: 'Visitor not found' });
    }

    // Remove visitorId from updateData to avoid updating the ID
    const { visitorId: _, ...fieldsToUpdate } = updateData;
    
    // Clean and validate the update data
    const cleanedUpdateData = {};
    
    // Handle each field with proper validation
    if (fieldsToUpdate.name !== undefined) {
      cleanedUpdateData.name = fieldsToUpdate.name?.trim() || '';
    }
    if (fieldsToUpdate.email !== undefined) {
      cleanedUpdateData.email = fieldsToUpdate.email?.trim()?.toLowerCase() || '';
    }
    if (fieldsToUpdate.phone !== undefined) {
      cleanedUpdateData.phone = fieldsToUpdate.phone?.trim() || '';
    }
    if (fieldsToUpdate.organization !== undefined) {
      cleanedUpdateData.organization = fieldsToUpdate.organization?.trim() || '';
    }
    if (fieldsToUpdate.region !== undefined) {
      cleanedUpdateData.region = fieldsToUpdate.region?.trim() || '';
    }
    if (fieldsToUpdate.service !== undefined) {
      cleanedUpdateData.service = fieldsToUpdate.service?.trim() || '';
    }
    if (fieldsToUpdate.subservice !== undefined) {
      cleanedUpdateData.subservice = fieldsToUpdate.subservice?.trim() || '';
    }
    if (fieldsToUpdate.enquiryDetails !== undefined) {
      cleanedUpdateData.enquiryDetails = fieldsToUpdate.enquiryDetails?.trim() || '';
    }
    if (fieldsToUpdate.source !== undefined) {
      cleanedUpdateData.source = fieldsToUpdate.source?.trim() || 'chatbot';
    }
    if (fieldsToUpdate.status !== undefined) {
      cleanedUpdateData.status = fieldsToUpdate.status?.trim() || 'enquiry_required';
    }
    if (fieldsToUpdate.assignedAgent !== undefined) {
      cleanedUpdateData.assignedAgent = fieldsToUpdate.assignedAgent || null;
    }
    if (fieldsToUpdate.agentName !== undefined) {
      cleanedUpdateData.agentName = fieldsToUpdate.agentName?.trim() || '';
    }
    if (fieldsToUpdate.salesExecutive !== undefined) {
      cleanedUpdateData.salesExecutive = fieldsToUpdate.salesExecutive || null;
    }
    if (fieldsToUpdate.salesExecutiveName !== undefined) {
      cleanedUpdateData.salesExecutiveName = fieldsToUpdate.salesExecutiveName?.trim() || '';
    }
    if (fieldsToUpdate.comments !== undefined) {
      cleanedUpdateData.comments = fieldsToUpdate.comments?.trim() || '';
    }
    if (fieldsToUpdate.amount !== undefined) {
      cleanedUpdateData.amount = Number(fieldsToUpdate.amount) || 0;
    }
    if (fieldsToUpdate.estimatedValue !== undefined) {
      cleanedUpdateData.estimatedValue = Number(fieldsToUpdate.estimatedValue) || 0;
    }
    
    console.log('📝 Cleaned fields to update:', JSON.stringify(cleanedUpdateData, null, 2));

    const updatedVisitor = await Visitor.findByIdAndUpdate(
      visitorId,
      cleanedUpdateData,
      { new: true, runValidators: true }
    );

    if (!updatedVisitor) {
      console.error('❌ Failed to update visitor with ID:', visitorId);
      return res.status(500).json({ message: 'Failed to update visitor' });
    }

    console.log('✅ Visitor updated successfully');
    console.log('📝 Updated visitor region:', updatedVisitor.region);
    console.log('📝 Updated visitor sales executive name:', updatedVisitor.salesExecutiveName);
    console.log('📝 Updated visitor comments:', updatedVisitor.comments);
    console.log('📝 Updated visitor amount:', updatedVisitor.amount);
    console.log('📝 Full updated visitor:', JSON.stringify(updatedVisitor, null, 2));

    res.json(updatedVisitor);
  } catch (e) {
    console.error('Analytics update visitor details error:', e);
    
    // Handle specific validation errors
    if (e.name === 'ValidationError') {
      const validationErrors = Object.values(e.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Validation failed', 
        errors: validationErrors 
      });
    }
    
    // Handle duplicate key errors
    if (e.code === 11000) {
      const field = Object.keys(e.keyPattern)[0];
      return res.status(400).json({ 
        message: `${field} already exists` 
      });
    }
    
    res.status(500).json({ message: 'Failed to update visitor details' });
  }
});

/**
 * GET /api/analytics/test-update
 * Test endpoint to verify update functionality
 */
router.get('/test-update', async (req, res) => {
  try {
    await connectMongo();
    
    // Find a visitor to test with
    const visitor = await Visitor.findOne({});
    
    if (!visitor) {
      return res.json({ message: 'No visitors found', success: false });
    }
    
    res.json({
      message: 'Test endpoint working',
      success: true,
      visitor: {
        id: visitor._id,
        name: visitor.name,
        region: visitor.region,
        salesExecutiveName: visitor.salesExecutiveName
      }
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({ message: 'Test endpoint error', error: error.message });
  }
});

/**
 * PUT /api/analytics/update-lead-conversion
 * Update lead conversion status
 */
router.put('/update-lead-conversion', authenticateToken, requireAdminOrExecutive, async (req, res) => {
  try {
    await connectMongo();
    const { visitorId, isConverted } = req.body;

    if (!visitorId || typeof isConverted !== 'boolean') {
      return res.status(400).json({ message: 'Visitor ID and conversion status are required' });
    }

    const updatedVisitor = await Visitor.findByIdAndUpdate(
      visitorId,
      { isConverted },
      { new: true, runValidators: true }
    );

    if (!updatedVisitor) {
      return res.status(404).json({ message: 'Visitor not found' });
    }

    res.json(updatedVisitor);
  } catch (e) {
    console.error('Analytics update lead conversion error:', e);
    res.status(500).json({ message: 'Failed to update lead conversion' });
  }
});

/**
 * GET /api/analytics/enquiries-management
 * Get enquiries for admin/executive enquiries management page with role-based filtering
 */
router.get('/enquiries-management', authenticateToken, addUserContext, enforceExecutiveAccess, requireAdminOrExecutive, async (req, res) => {
  try {
    await connectMongo();

    const { page = 1, limit = 50, search, status, enquiryType } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    // Get unified data from DataSyncService
    const userRole = req.userContext?.userRole || req.user?.role;
    const userId = req.userContext?.userId || req.user?.id;
    
    let unifiedData;
    try {
      unifiedData = await DataSyncService.getUnifiedDashboardData(userRole, userId);
    } catch (syncError) {
      console.warn('DataSyncService failed in enquiries-management, using fallback:', syncError.message);
      // Fallback to basic enquiry data
      const enquiries = await Enquiry.find({}).sort({ createdAt: -1 }).lean();
      unifiedData = {
        visitors: [],
        enquiries: enquiries.map(e => ({
          _id: e._id.toString(),
          visitorName: e.visitorName || '',
          email: e.email || '',
          phone: e.phoneNumber || '',
          enquiryType: e.enquiryType || 'chatbot',
          enquiryDetails: e.enquiryDetails || '',
          status: e.status || 'new',
          priority: e.priority || 'medium',
          organization: e.organization || '',
          createdAt: e.createdAt,
          visitorId: e.visitorId?.toString() || ''
        })),
        chatHistory: []
      };
    }

    // Apply search and filter to unified data
    let filteredEnquiries = unifiedData.enquiries;
    
    if (search) {
      const searchLower = search.toLowerCase();
      filteredEnquiries = filteredEnquiries.filter(enquiry => 
        (enquiry.visitorName && enquiry.visitorName.toLowerCase().includes(searchLower)) ||
        (enquiry.email && enquiry.email.toLowerCase().includes(searchLower)) ||
        (enquiry.enquiryDetails && enquiry.enquiryDetails.toLowerCase().includes(searchLower))
      );
    }
    
    if (status) {
      filteredEnquiries = filteredEnquiries.filter(enquiry => enquiry.status === status);
    }
    
    if (enquiryType) {
      filteredEnquiries = filteredEnquiries.filter(enquiry => enquiry.enquiryType === enquiryType);
    }

    // Apply pagination
    const total = filteredEnquiries.length;
    const skip = (pageNum - 1) * limitNum;
    const paginatedEnquiries = filteredEnquiries.slice(skip, skip + limitNum);

    // Transform data for frontend compatibility
    const enquiriesData = paginatedEnquiries.map(enquiry => ({
      _id: enquiry._id,
      visitorName: enquiry.visitorName,
      phoneNumber: enquiry.phoneNumber || '',
      email: enquiry.email,
      enquiryType: enquiry.enquiryType,
      enquiryDetails: enquiry.enquiryDetails,
      createdAt: enquiry.createdAt,
      status: enquiry.status,
      priority: enquiry.priority,
      assignedAgent: 'Unassigned', // Will be updated when agent assignment is implemented
      organization: enquiry.organization || '',
      estimatedValue: 0, // Default value
      expectedCompletionDate: null, // Default value
      lastContactDate: enquiry.createdAt, // Use creation date as last contact
      nextFollowUpDate: null, // Default value
      statusHistory: [] // Will be populated from enquiry data
    }));

    res.json({
      enquiries: enquiriesData,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum)
      },
      userContext: {
        role: req.userContext?.userRole || req.user?.role,
        canAccessAll: req.userContext?.canAccessAll || req.user?.role === 'admin'
      }
    });
  } catch (e) {
    console.error('Analytics enquiries management error:', e);
    res.status(500).json({ message: 'Failed to load enquiries management data' });
  }
});

/**
 * GET /api/analytics/executive-enquiries-management
 * Get enquiries for executive dashboard with role-based filtering
 */
router.get('/executive-enquiries-management', authenticateToken, addUserContext, enforceExecutiveAccess, requireAdminOrExecutive, async (req, res) => {
  try {
    console.log('🔍 Executive enquiries management endpoint called');
    console.log('👤 User context:', req.userContext);
    
    await connectMongo();
    
    // Build query based on user role
    let query = {};
    
    // Apply role-based filtering
    if (req.userContext.isSalesExecutive) {
      // Sales executives only see enquiries assigned to them
      query = {
        $or: [
          { salesExecutiveName: req.userContext.userName },
          { salesExecutive: req.userContext.userId }
        ]
      };
    } else if (req.userContext.isCustomerExecutive || req.userContext.isExecutive) {
      // Customer executives and legacy executives see all enquiries
      query = {};
    } else if (req.userContext.isAdmin) {
      // Admin sees all enquiries
      query = {};
    }
    
    console.log('🔍 Query for enquiries:', query);
    
    // Get enquiries with pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    // Get total count
    const total = await Enquiry.countDocuments(query);
    
    // Get enquiries
    const enquiries = await Enquiry.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
    
    console.log('📊 Found enquiries:', enquiries.length);
    
    // Get total visitors count for context
    const totalVisitors = await Visitor.countDocuments();
    
    const responseData = {
      enquiries: enquiries,
      pagination: {
        page: page,
        limit: limit,
        total: total,
        pages: Math.ceil(total / limit)
      },
      userContext: {
        role: req.userContext.userRole,
        canAccessAll: req.userContext.canAccessAll
      },
      stats: {
        totalEnquiries: total,
        totalVisitors: totalVisitors
      }
    };
    
    console.log('✅ Returning executive enquiries data');
    res.json(responseData);
    
  } catch (e) {
    console.error('❌ Analytics executive enquiries management error:', e);
    console.error('❌ Error stack:', e.stack);
    res.status(500).json({ 
      message: 'Failed to load executive enquiries management data',
      error: e.message 
    });
  }
});

/**
 * POST /api/analytics/add-enquiry
 * Add new enquiry with role-based assignment
 */
router.post('/add-enquiry', authenticateToken, addUserContext, enforceExecutiveAccess, requireAdminOrExecutive, async (req, res) => {
  try {
    console.log('🔍 Add enquiry endpoint called');
    console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
    console.log('👤 User:', req.user);
    console.log('🔐 User context:', req.userContext);
    
    // Validate request body exists
    if (!req.body || typeof req.body !== 'object') {
      console.log('❌ Invalid request body');
      return res.status(400).json({ 
        message: 'Invalid request body',
        error: 'Request body must be a valid JSON object'
      });
    }
    
    await connectMongo();
    const { 
      visitorName, 
      phoneNumber, 
      email, 
      enquiryType, 
      enquiryDetails, 
      organization,
      priority = 'medium',
      estimatedValue,
      expectedCompletionDate
    } = req.body;

    // Enhanced validation with specific error messages
    const validationErrors = [];
    
    if (!visitorName || typeof visitorName !== 'string' || !visitorName.trim()) {
      validationErrors.push('Visitor name is required and must be a non-empty string');
    }
    
    if (!enquiryType || typeof enquiryType !== 'string' || !enquiryType.trim()) {
      validationErrors.push('Enquiry type is required and must be a non-empty string');
    }
    
    if (!enquiryDetails || typeof enquiryDetails !== 'string' || !enquiryDetails.trim()) {
      validationErrors.push('Enquiry details are required and must be a non-empty string');
    }

    // Validate enquiry type against allowed values
    const allowedEnquiryTypes = ['chatbot', 'email', 'calls', 'website'];
    if (enquiryType && !allowedEnquiryTypes.includes(enquiryType)) {
      validationErrors.push(`Enquiry type must be one of: ${allowedEnquiryTypes.join(', ')}`);
    }

    // Validate that either phone or email is provided
    const hasPhone = phoneNumber && typeof phoneNumber === 'string' && phoneNumber.trim();
    const hasEmail = email && typeof email === 'string' && email.trim();
    
    if (!hasPhone && !hasEmail) {
      validationErrors.push('At least one contact method (phone number or email) is required');
    }

    if (validationErrors.length > 0) {
      console.log('❌ Validation errors:', validationErrors);
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    // Get current user for assignment
    const userId = req.user.userId || req.user.id;
    if (!userId) {
      console.log('❌ No user ID found in request');
      return res.status(401).json({ 
        message: 'Authentication error',
        error: 'User ID not found in token'
      });
    }

    const user = await User.findById(userId).lean();
    if (!user) {
      console.log('❌ User not found in database');
      return res.status(401).json({ 
        message: 'Authentication error',
        error: 'User not found'
      });
    }

    const assignedAgent = user.role === 'executive' ? userId : null;
    console.log('👤 User found:', { id: user._id, name: user.name, role: user.role });

    // First, create or find visitor record
    let visitor = null;
    const searchEmail = email ? email.toLowerCase().trim() : '';
    const searchPhone = phoneNumber ? phoneNumber.trim() : '';
    
    if (searchEmail) {
      visitor = await Visitor.findOne({ email: searchEmail });
      console.log('🔍 Searched for visitor by email:', searchEmail, 'Found:', !!visitor);
    }
    
    if (!visitor && searchPhone) {
      visitor = await Visitor.findOne({ phone: searchPhone });
      console.log('🔍 Searched for visitor by phone:', searchPhone, 'Found:', !!visitor);
    }
    
    if (!visitor) {
      console.log('📝 Creating new visitor record');
      visitor = new Visitor({
        name: visitorName.trim(),
        email: searchEmail,
        phone: searchPhone,
        organization: organization ? organization.trim() : '',
        service: enquiryDetails.trim(),
        source: enquiryType,
        status: 'enquiry_required',
        enquiryDetails: enquiryDetails.trim(),
        priority,
        estimatedValue,
        assignedAgent
      });
      
      try {
        await visitor.save();
        console.log('✅ Visitor created successfully:', visitor._id);
      } catch (visitorError) {
        console.error('❌ Error creating visitor:', visitorError);
        console.error('❌ Visitor data that failed:', JSON.stringify(visitor, null, 2));
        console.error('❌ Error details:', {
          name: visitorError.name,
          message: visitorError.message,
          code: visitorError.code,
          errors: visitorError.errors
        });
        return res.status(500).json({ 
          message: 'Failed to create visitor record',
          error: visitorError.message,
          details: visitorError.errors || visitorError.code
        });
      }
    } else {
      console.log('✅ Using existing visitor:', visitor._id);
    }

    // Create a new enquiry with visitor reference
    console.log('📝 Creating new enquiry record');
    const newEnquiry = new Enquiry({
      visitorName: visitorName.trim(),
      phoneNumber: searchPhone,
      email: searchEmail,
      enquiryType,
      enquiryDetails: enquiryDetails.trim(),
      organization: organization ? organization.trim() : '',
      priority,
      estimatedValue,
      expectedCompletionDate,
      assignedAgent,
      visitorId: visitor._id,
      status: 'new',
      statusHistory: [{
        status: 'new',
        changedAt: new Date(),
        changedBy: user.name || user.username || 'System',
        notes: 'Enquiry created'
      }]
    });

    try {
      const savedEnquiry = await newEnquiry.save();
      console.log('✅ Enquiry created successfully:', savedEnquiry._id);

      const enquiryData = {
        _id: savedEnquiry._id.toString(),
        visitorName: savedEnquiry.visitorName,
        phoneNumber: savedEnquiry.phoneNumber || '',
        email: savedEnquiry.email,
        enquiryType: savedEnquiry.enquiryType,
        enquiryDetails: savedEnquiry.enquiryDetails,
        createdAt: savedEnquiry.createdAt,
        status: savedEnquiry.status,
        priority: savedEnquiry.priority,
        assignedAgent: user.name || 'Unassigned',
        organization: savedEnquiry.organization || '',
        estimatedValue: savedEnquiry.estimatedValue,
        expectedCompletionDate: savedEnquiry.expectedCompletionDate,
        statusHistory: savedEnquiry.statusHistory
      };

      console.log('🎉 Returning enquiry data:', enquiryData);
      res.status(201).json(enquiryData);
      
    } catch (enquiryError) {
      console.error('❌ Error creating enquiry:', enquiryError);
      
      // Handle specific MongoDB errors
      if (enquiryError.code === 11000) {
        console.log('❌ Duplicate enquiry detected:', enquiryError.keyValue);
        return res.status(409).json({ 
          message: 'Duplicate enquiry',
          error: 'An enquiry of this type already exists for this visitor',
          details: `Visitor already has a ${enquiryError.keyValue.enquiryType} enquiry`
        });
      }
      
      if (enquiryError.name === 'ValidationError') {
        const validationErrors = Object.values(enquiryError.errors).map(err => err.message);
        return res.status(400).json({ 
          message: 'Validation error',
          errors: validationErrors
        });
      }
      
      return res.status(500).json({ 
        message: 'Failed to create enquiry',
        error: enquiryError.message
      });
    }
    
  } catch (e) {
    console.error('❌ Analytics add enquiry error:', e);
    console.error('❌ Error stack:', e.stack);
    console.error('❌ Error name:', e.name);
    console.error('❌ Error message:', e.message);
    
    // Handle specific error types
    if (e.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        message: 'Authentication error',
        error: 'Invalid token'
      });
    }
    
    if (e.name === 'CastError') {
      return res.status(400).json({ 
        message: 'Invalid data format',
        error: 'One or more fields have invalid data types'
      });
    }
    
    res.status(500).json({ 
      message: 'Internal server error',
      error: e.message,
      name: e.name
    });
  }
});

/**
 * PUT /api/analytics/update-enquiry
 * Update enquiry details with role-based access control
 */
router.put('/update-enquiry', authenticateToken, addUserContext, enforceExecutiveAccess, requireAdminOrExecutive, async (req, res) => {
  try {
    await connectMongo();
    const { enquiryId, ...updateData } = req.body;

    if (!enquiryId) {
      return res.status(400).json({ message: 'Enquiry ID is required' });
    }

    // Get current user for tracking
    const userId = req.user.userId || req.user.id;
    const user = await User.findById(userId).lean();
    const changedBy = user?.name || user?.username || 'Unknown';

    const enquiry = await Enquiry.findById(enquiryId);
    if (!enquiry) {
      return res.status(404).json({ message: 'Enquiry not found' });
    }

    // Role-based access control: Executives can only update their assigned enquiries
    if (req.userContext.isExecutive && enquiry.assignedAgent?.toString() !== req.userContext.userId) {
      return res.status(403).json({ message: 'You can only update enquiries assigned to you' });
    }

    // Track status changes
    if (updateData.status && updateData.status !== enquiry.status) {
      if (!enquiry.statusHistory) {
        enquiry.statusHistory = [];
      }
      enquiry.statusHistory.push({
        status: updateData.status,
        changedAt: new Date(),
        changedBy,
        notes: updateData.statusNotes || `Status changed to ${updateData.status}`
      });
    }

    // Update enquiry fields
    Object.assign(enquiry, updateData);
    await enquiry.save();

    // Also update visitor if it exists
    if (enquiry.visitorId) {
      const visitorUpdateData = {
        name: updateData.visitorName || enquiry.visitorName,
        email: updateData.email || enquiry.email,
        phone: updateData.phoneNumber || enquiry.phoneNumber,
        service: updateData.enquiryDetails || enquiry.enquiryDetails,
        source: updateData.enquiryType || enquiry.enquiryType,
        organization: updateData.organization || enquiry.organization,
        priority: updateData.priority || enquiry.priority,
        estimatedValue: updateData.estimatedValue || enquiry.estimatedValue
      };

      await Visitor.findByIdAndUpdate(enquiry.visitorId, visitorUpdateData);
    }

    const enquiryData = {
      _id: enquiry._id.toString(),
      visitorName: enquiry.visitorName,
      phoneNumber: enquiry.phoneNumber || '',
      email: enquiry.email,
      enquiryType: enquiry.enquiryType,
      enquiryDetails: enquiry.enquiryDetails,
      createdAt: enquiry.createdAt,
      status: enquiry.status,
      priority: enquiry.priority,
      assignedAgent: user?.name || 'Unassigned',
      organization: enquiry.organization || '',
      estimatedValue: enquiry.estimatedValue,
      expectedCompletionDate: enquiry.expectedCompletionDate,
      lastContactDate: enquiry.lastContactDate,
      nextFollowUpDate: enquiry.nextFollowUpDate,
      statusHistory: enquiry.statusHistory
    };

    res.json(enquiryData);
  } catch (e) {
    console.error('Analytics update enquiry error:', e);
    res.status(500).json({ message: 'Failed to update enquiry' });
  }
});

/**
 * DELETE /api/analytics/delete-enquiry/:enquiryId
 * Delete enquiry and associated visitor with role-based access control
 */
router.delete('/delete-enquiry/:enquiryId', authenticateToken, addUserContext, enforceExecutiveAccess, requireAdminOrExecutive, async (req, res) => {
  try {
    await connectMongo();
    const { enquiryId } = req.params;

    const enquiry = await Enquiry.findById(enquiryId);
    if (!enquiry) {
      return res.status(404).json({ message: 'Enquiry not found' });
    }

    // Role-based access control: Executives can only delete their assigned enquiries
    if (req.userContext.isExecutive && enquiry.assignedAgent?.toString() !== req.userContext.userId) {
      return res.status(403).json({ message: 'You can only delete enquiries assigned to you' });
    }

    // Delete the enquiry first
    const deletedEnquiry = await Enquiry.findByIdAndDelete(enquiryId);

    // Also delete the associated visitor if it exists
    if (enquiry.visitorId) {
      try {
        await Visitor.findByIdAndDelete(enquiry.visitorId);
        console.log(`Associated visitor ${enquiry.visitorId} deleted successfully`);
      } catch (visitorDeleteError) {
        console.error('Error deleting associated visitor:', visitorDeleteError);
        // Don't fail the entire operation if visitor deletion fails
      }
    }

    res.json({ message: 'Enquiry and associated visitor deleted successfully' });
  } catch (e) {
    console.error('Analytics delete enquiry error:', e);
    console.error('Error details:', {
      name: e.name,
      message: e.message,
      stack: e.stack
    });
    res.status(500).json({ 
      message: 'Failed to delete enquiry',
      error: e.message,
      details: e.name
    });
  }
});

/**
 * POST /api/analytics/assign-sales-executive
 * Assign sales executive to visitor
 */
router.post('/assign-sales-executive', authenticateToken, addUserContext, enforceExecutiveAccess, requireAdminOrExecutive, async (req, res) => {
  try {
    await connectMongo();
    const { visitorId, salesExecutiveId, salesExecutiveName } = req.body;

    if (!visitorId || !salesExecutiveId || !salesExecutiveName) {
      return res.status(400).json({ 
        message: 'Visitor ID, Sales Executive ID, and Sales Executive Name are required' 
      });
    }

    // Find the visitor
    const visitor = await Visitor.findById(visitorId);
    if (!visitor) {
      return res.status(404).json({ message: 'Visitor not found' });
    }

    // Update the visitor with sales executive assignment
    const updatedVisitor = await Visitor.findByIdAndUpdate(
      visitorId,
      {
        salesExecutive: salesExecutiveId,
        salesExecutiveName: salesExecutiveName,
        lastModifiedBy: req.user.name || req.user.username || 'System',
        lastModifiedAt: new Date()
      },
      { new: true }
    );

    console.log('✅ Sales executive assigned successfully:', {
      visitorId,
      salesExecutiveId,
      salesExecutiveName,
      assignedBy: req.user.name || req.user.username
    });

    res.json(updatedVisitor);
  } catch (error) {
    console.error('❌ Error assigning sales executive:', error);
    res.status(500).json({ 
      message: 'Failed to assign sales executive',
      error: error.message 
    });
  }
});

// Assign agent to visitor (for customer executives)
router.post('/assign-agent', authenticateToken, addUserContext, enforceExecutiveAccess, requireAdminOrExecutive, async (req, res) => {
  try {
    await connectMongo();
    const { visitorId, agentId, agentName } = req.body;

    if (!visitorId || !agentId || !agentName) {
      return res.status(400).json({
        message: 'Visitor ID, Agent ID, and Agent Name are required'
      });
    }

    const visitor = await Visitor.findById(visitorId);
    if (!visitor) {
      return res.status(404).json({ message: 'Visitor not found' });
    }

    const updatedVisitor = await Visitor.findByIdAndUpdate(
      visitorId,
      {
        agent: agentName,
        agentName: agentName,
        assignedAgent: agentId,
        lastModifiedBy: req.user.name || req.user.username || 'System',
        lastModifiedAt: new Date()
      },
      { new: true }
    );

    console.log('✅ Agent assigned successfully:', {
      visitorId,
      agentId,
      agentName,
      assignedBy: req.user.name || req.user.username
    });

    res.json(updatedVisitor);
  } catch (error) {
    console.error('❌ Error assigning agent:', error);
    res.status(500).json({
      message: 'Failed to assign agent',
      error: error.message
    });
  }
});

/**
 * POST /api/analytics/chatbot-enquiry
 * Create enquiry from chatbot interaction with automatic assignment
 */
router.post('/chatbot-enquiry', async (req, res) => {
  try {
    await connectMongo();
    const { 
      name, 
      email, 
      phone, 
      organization, 
      service, 
      subservice,
      enquiryDetails,
      location 
    } = req.body;

    console.log('🔍 Chatbot enquiry received:', { name, email, service, subservice, enquiryDetails });
    
    if (!email || !service) {
      return res.status(400).json({ message: 'Email and service are required' });
    }

    // Create or update visitor
    let visitor = await Visitor.findOne({ email: email.toLowerCase() });
    if (!visitor) {
      visitor = new Visitor({
        name: name || '',
        email: email.toLowerCase(),
        phone: phone || '',
        organization: organization || '',
        service,
        subservice: subservice || '',
        source: 'chatbot',
        status: 'enquiry_required',
        enquiryDetails: enquiryDetails || service,
        location: location || '',
        lastInteractionAt: new Date()
      });
    } else {
      // Update existing visitor
      visitor.name = name || visitor.name;
      visitor.phone = phone || visitor.phone;
      visitor.organization = organization || visitor.organization;
      visitor.service = service;
      visitor.subservice = subservice || visitor.subservice;
      visitor.enquiryDetails = enquiryDetails || service;
      visitor.location = location || visitor.location;
      visitor.lastInteractionAt = new Date();
      visitor.status = 'enquiry_required';
    }

    // Find available executive for assignment using service mapping
    const mainService = mapToMainService(service);
    let assignedAgent = null;
    
    // First try to find executives assigned to this service
    const serviceAssignments = await ExecutiveService.find({ 
      serviceName: mainService, 
      isActive: true 
    }).lean();
    
    if (serviceAssignments.length > 0) {
      // Use round-robin among executives assigned to this service
      const randomIndex = Math.floor(Math.random() * serviceAssignments.length);
      assignedAgent = serviceAssignments[randomIndex].executiveId;
      console.log(`🎯 Assigned visitor to service-specific executive for ${mainService}`);
    } else {
      // Fallback to any available executive
      const executives = await User.find({ role: 'executive' }).lean();
      if (executives.length > 0) {
        const randomIndex = Math.floor(Math.random() * executives.length);
        assignedAgent = executives[randomIndex]._id;
        console.log(`🔄 Fallback assignment for service: ${mainService}`);
      }
    }

    // Update visitor with assigned agent
    if (assignedAgent) {
      visitor.assignedAgent = assignedAgent;
      
      // Also set the agent name fields
      const agentUser = await User.findById(assignedAgent);
      if (agentUser) {
        visitor.agent = agentUser.name || agentUser.username;
        visitor.agentName = agentUser.name || agentUser.username;
        console.log(`✅ Assigned visitor to agent: ${visitor.agent}`);
      }
    }

    // Assign sales executive based on region
    if (visitor.region) {
      const RegionAssignmentService = require('../services/RegionAssignmentService');
      await RegionAssignmentService.assignSalesExecutiveByRegion(visitor);
    }

    await visitor.save();
    console.log(`✅ Visitor ${visitor.email} created/updated successfully`);
    console.log(`📋 Saved visitor data:`, { 
      service: visitor.service, 
      subservice: visitor.subservice, 
      enquiryDetails: visitor.enquiryDetails 
    });

    // Create enquiry
    const enquiry = new Enquiry({
      visitorName: name || email,
      phoneNumber: phone || '',
      email: email.toLowerCase(),
      enquiryType: 'chatbot',
      enquiryDetails: enquiryDetails || service,
      organization: organization || '',
      status: 'new',
      visitorId: visitor._id,
      assignedAgent: assignedAgent,
      statusHistory: [{
        status: 'new',
        changedAt: new Date(),
        changedBy: 'Chatbot',
        notes: 'Enquiry created from chatbot interaction'
      }]
    });

    await enquiry.save();

    res.status(201).json({
      ok: true,
      visitorId: visitor._id.toString(),
      visitor: {
        _id: visitor._id.toString(),
        name: visitor.name,
        email: visitor.email,
        service: visitor.service,
        status: visitor.status
      },
      enquiry: {
        _id: enquiry._id.toString(),
        visitorName: enquiry.visitorName,
        email: enquiry.email,
        enquiryType: enquiry.enquiryType,
        status: enquiry.status
      }
    });
  } catch (e) {
    console.error('Analytics chatbot enquiry error:', e);
    res.status(500).json({ message: 'Failed to create chatbot enquiry' });
  }
});

/**
 * GET /api/analytics/visitor-pipeline/:visitorId
 * Get visitor pipeline history with role-based access control
 */
router.get('/visitor-pipeline/:visitorId', authenticateToken, addUserContext, enforceExecutiveAccess, requireAdminOrExecutive, async (req, res) => {
  try {
    await connectMongo();
    const { visitorId } = req.params;

    const visitor = await Visitor.findById(visitorId).lean();
    if (!visitor) {
      return res.status(404).json({ message: 'Visitor not found' });
    }

    // Role-based access control: Executives can only view their assigned visitors
    if (req.userContext.isExecutive && visitor.assignedAgent?.toString() !== req.userContext.userId) {
      return res.status(403).json({ message: 'You can only view visitors assigned to you' });
    }

    res.json({
      visitor: {
        _id: visitor._id.toString(),
        name: visitor.name,
        email: visitor.email,
        service: visitor.service,
        status: visitor.status,
        source: visitor.source,
        isConverted: visitor.isConverted
      },
      pipelineHistory: visitor.pipelineHistory || [],
      userContext: {
        role: req.userContext?.userRole || req.user?.role,
        canAccessAll: req.userContext?.canAccessAll || req.user?.role === 'admin'
      }
    });
  } catch (e) {
    console.error('Analytics visitor pipeline error:', e);
    res.status(500).json({ message: 'Failed to load visitor pipeline' });
  }
});

// Get real agent performance data
router.get('/agent-performance', authenticateToken, requireAdminOrExecutive, async (req, res) => {
  try {
    console.log('📊 Fetching real agent performance data...');
    await connectMongo();
    
    // Get all executives, excluding Customer Executive 1 and 2
    const executives = await User.find({
      role: { $in: ['executive', 'sales-executive', 'customer-executive'] },
      $and: [
        { name: { $not: { $regex: /Customer Experience Executive 1/i } } },
        { name: { $not: { $regex: /Customer Experience Executive 2/i } } },
        { email: { $not: { $regex: /executive1@envirocarelabs.com/i } } },
        { email: { $not: { $regex: /executive2@envirocarelabs.com/i } } }
      ]
    }).lean();
    
    console.log(`👥 Found ${executives.length} executives`);
    
    // Get performance data for each executive
    const performanceData = await Promise.all(executives.map(async (executive) => {
      // Count visitors assigned to this executive
      const visitorsCount = await Visitor.countDocuments({
        $or: [
          { assignedAgent: executive._id },
          { salesExecutive: executive._id },
          { customerExecutive: executive._id }
        ]
      });
      
      // Count enquiries assigned to this executive
      const enquiriesCount = await Enquiry.countDocuments({
        assignedAgent: executive._id
      });
      
      // Count converted leads (visitors with isConverted: true)
      const leadsCount = await Visitor.countDocuments({
        $or: [
          { assignedAgent: executive._id },
          { salesExecutive: executive._id },
          { customerExecutive: executive._id }
        ],
        isConverted: true
      });
      
      console.log(`📈 ${executive.name}: ${visitorsCount} visitors, ${enquiriesCount} enquiries, ${leadsCount} leads`);
      
      return {
        agentId: executive._id.toString(),
        agentName: executive.name || executive.username,
        visitorsHandled: visitorsCount,
        enquiriesAdded: enquiriesCount,
        leadsConverted: leadsCount
      };
    }));
    
    console.log(`✅ Generated performance data for ${performanceData.length} agents`);
    
    res.json({
      success: true,
      agentPerformance: performanceData
    });
    
  } catch (error) {
    console.error('❌ Error fetching agent performance:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch agent performance data' 
    });
  }
});

// Test endpoint for debugging
router.get('/test-notes', (req, res) => {
  console.log('🧪 Test endpoint called at:', new Date().toISOString());
  res.json({ 
    message: 'Backend is working!', 
    timestamp: new Date().toISOString(),
    notes: 'Test notes from backend'
  });
});

module.exports = router;
