const Visitor = require('../models/Visitor');
const Enquiry = require('../models/Enquiry');
const ChatMessage = require('../models/ChatMessage');
const ExecutiveService = require('../models/ExecutiveService');

class DataSyncService {
  /**
   * Create or update visitor and enquiry data simultaneously
   * This ensures data consistency across all dashboard sections
   */
  static async syncVisitorAndEnquiry(data, source = 'chatbot') {
    try {
      const { name, email, phone, organization, service, enquiryDetails, enquiryType = 'chatbot' } = data;
      
      // Check if visitor already exists by email first (primary key)
      let visitor = null;
      if (email) {
        visitor = await Visitor.findOne({ email: email.toLowerCase() });
      }
      
      // If no email match, check by phone
      if (!visitor && phone) {
        visitor = await Visitor.findOne({ phone: phone });
      }

      if (!visitor) {
        // Create new visitor
        visitor = new Visitor({
          name,
          email: email?.toLowerCase(),
          phone,
          organization,
          service,
          source: enquiryType,
          enquiryDetails,
          status: 'enquiry_required',
          lastInteractionAt: new Date()
        });
        await visitor.save();
        console.log(`✅ Created new visitor: ${name} (${email})`);
      } else {
        // Update existing visitor - prioritize email as primary identifier
        if (email && email.toLowerCase() !== visitor.email) {
          visitor.email = email.toLowerCase();
        }
        visitor.name = name || visitor.name;
        visitor.phone = phone || visitor.phone;
        visitor.organization = organization || visitor.organization;
        visitor.service = service || visitor.service;
        visitor.enquiryDetails = enquiryDetails || visitor.enquiryDetails;
        visitor.lastInteractionAt = new Date();
        visitor.source = enquiryType;
        
        if (visitor.status === 'enquiry_required') {
          visitor.status = 'contact_initiated';
        }
        
        await visitor.save();
        console.log(`✅ Updated existing visitor: ${visitor.name} (${visitor.email})`);
      }

      // Check if enquiry already exists for this visitor and type
      let enquiry = await Enquiry.findOne({ 
        visitorId: visitor._id,
        enquiryType: enquiryType 
      });
      
      if (!enquiry) {
        // Create new enquiry only if one doesn't exist for this visitor and type
        enquiry = new Enquiry({
          visitorName: visitor.name,
          email: visitor.email,
          phoneNumber: visitor.phone,
          enquiryType: enquiryType,
          enquiryDetails: enquiryDetails || visitor.enquiryDetails || `New visitor ${visitor.name} started a conversation`,
          organization: visitor.organization,
          status: 'new',
          priority: 'medium',
          visitorId: visitor._id
        });
        await enquiry.save();
        console.log(`✅ Created new enquiry for visitor: ${visitor.name} (${enquiryType})`);
      } else {
        // Update existing enquiry
        enquiry.enquiryDetails = enquiryDetails || enquiry.enquiryDetails || `Updated enquiry for ${visitor.name}`;
        enquiry.lastContactDate = new Date();
        enquiry.status = 'new'; // Reset status to new for updated enquiries
        await enquiry.save();
        console.log(`✅ Updated existing enquiry for visitor: ${visitor.name} (${enquiryType})`);
      }

      return {
        visitor,
        enquiry,
        isNew: !visitor.createdAt || (new Date() - visitor.createdAt) < 60000 // Within 1 minute
      };
    } catch (error) {
      console.error('❌ Error syncing visitor and enquiry:', error);
      throw error;
    }
  }

  /**
   * Get unified data for dashboard sections
   * This ensures all sections show the same data
   */
  static async getUnifiedDashboardData(userRole = 'executive', userId = null) {
    try {
      // Get all visitors first
      let visitors = await Visitor.find({}).sort({ createdAt: -1 }).lean();
      
      // For executives, filter visitors by assigned services OR assigned agents
      if (userRole === 'executive' && userId) {
        // First check if this executive is assigned as an agent to any visitors
        const assignedAsAgent = await Visitor.find({
          assignedAgent: userId
        }).select('_id');
        
        if (assignedAsAgent.length > 0) {
          // If assigned as agent, show ALL visitors (not filtered by service)
          console.log(`Executive ${userId} is assigned as agent to ${assignedAsAgent.length} visitors - showing all visitors`);
        } else {
          // If not assigned as agent, filter by assigned services
          const assignedServices = await ExecutiveService.find({
            executiveId: userId,
            isActive: true
          }).select('serviceName');
          
          if (assignedServices.length > 0) {
            const serviceNames = assignedServices.map(s => s.serviceName);
            visitors = visitors.filter(visitor => 
              serviceNames.includes(visitor.service)
            );
            console.log(`Executive ${userId} filtered by services: ${serviceNames.join(', ')}`);
          } else {
            // If no services assigned, show no visitors
            visitors = [];
            console.log(`Executive ${userId} has no assigned services - showing no visitors`);
          }
        }
      }
      
      // Get enquiries and chat messages separately to avoid aggregation issues
      const visitorIds = visitors.map(v => v._id);
      
      let enquiries = [];
      let chatMessages = [];
      
      try {
        [enquiries, chatMessages] = await Promise.all([
          Enquiry.find({ visitorId: { $in: visitorIds } }).lean(),
          ChatMessage.find({ visitorId: { $in: visitorIds } }).lean()
        ]);
      } catch (queryError) {
        console.warn('Warning: Could not fetch enquiries or chat messages:', queryError.message);
        // Continue with empty arrays if queries fail
      }
      
      // Don't auto-create enquiries - only show existing ones
      // This prevents duplicate entries in the dashboard
      console.log(`📊 Found ${visitors.length} visitors and ${enquiries.length} enquiries`);
      
      // For admin users, show all data
      // For executive users, filter by assigned data (when agent assignment is implemented)
      let filteredVisitors = visitors;
      let filteredEnquiries = enquiries;
      let filteredChatMessages = chatMessages;
      
      if (userRole === 'executive' && userId) {
        // In the future, filter by assignedAgent
        // For now, executives see all data
        filteredVisitors = visitors;
        filteredEnquiries = enquiries;
        filteredChatMessages = chatMessages;
      }
      
      // Group enquiries and messages by visitor
      const enquiriesByVisitor = {};
      const messagesByVisitor = {};
      
      enquiries.forEach(enquiry => {
        const visitorId = enquiry.visitorId?.toString();
        if (visitorId) {
          if (!enquiriesByVisitor[visitorId]) {
            enquiriesByVisitor[visitorId] = [];
          }
          enquiriesByVisitor[visitorId].push(enquiry);
        }
      });
      
      chatMessages.forEach(message => {
        const visitorId = message.visitorId?.toString();
        if (visitorId) {
          if (!messagesByVisitor[visitorId]) {
            messagesByVisitor[visitorId] = [];
          }
          messagesByVisitor[visitorId].push(message);
        }
      });
      
      // Enhance visitors with their data
      const enhancedVisitors = visitors.map(visitor => {
        const visitorId = visitor._id.toString();
        const visitorEnquiries = enquiriesByVisitor[visitorId] || [];
        const visitorMessages = messagesByVisitor[visitorId] || [];
        
        return {
          ...visitor,
          enquiries: visitorEnquiries,
          messages: visitorMessages,
          enquiryCount: visitorEnquiries.length,
          messageCount: visitorMessages.length,
          lastMessage: visitorMessages[visitorMessages.length - 1] || null,
          latestEnquiry: visitorEnquiries[visitorEnquiries.length - 1] || null
        };
      });

      // Filter data based on user role
      let finalVisitors = enhancedVisitors;
      if (userRole === 'executive' && userId) {
        // For executives, show all visitors (in a real system, you might filter by assignment)
        finalVisitors = enhancedVisitors;
      }

      // Transform data for consistent format across all dashboard sections
      const unifiedData = {
        visitors: finalVisitors.map(v => ({
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
          isConverted: v.isConverted || false,
          enquiryCount: v.enquiryCount || 0,
          messageCount: v.messageCount || 0,
          lastMessage: v.lastMessage,
          latestEnquiry: v.latestEnquiry,
          agent: v.agent || '',
          agentName: v.agentName || '',
          assignedAgent: v.assignedAgent || null
        })),
        
        enquiries: finalVisitors
          .filter(v => v.enquiries && v.enquiries.length > 0)
          .flatMap(v => v.enquiries.map(e => ({
            _id: e._id.toString(),
            visitorName: v.name || 'Anonymous',
            email: v.email || '',
            phone: v.phone || '',
            enquiryType: e.enquiryType || 'chatbot',
            enquiryDetails: e.enquiryDetails || '',
            status: e.status || 'new',
            priority: e.priority || 'medium',
            organization: v.organization || '',
            createdAt: e.createdAt,
            visitorId: v._id.toString()
          }))),
        
        chatHistory: finalVisitors
          .filter(v => v.messages && v.messages.length > 0)
          .map(v => ({
            visitor: {
              _id: v._id.toString(),
              name: v.name || 'Anonymous',
              email: v.email || '',
              phone: v.phone || '',
              organization: v.organization || '',
              service: v.service || 'General Inquiry'
            },
            messages: v.messages.map(m => ({
              _id: m._id.toString(),
              visitorId: m.visitorId.toString(),
              sender: m.sender,
              message: m.message,
              at: m.at
            }))
          }))
      };

      return unifiedData;
    } catch (error) {
      console.error('❌ Error getting unified dashboard data:', error);
      throw error;
    }
  }

  /**
   * Update visitor status and create enquiry when status changes
   */
  static async updateVisitorStatus(visitorId, newStatus, notes = '', changedBy = 'system') {
    try {
      const visitor = await Visitor.findById(visitorId);
      if (!visitor) {
        throw new Error('Visitor not found');
      }

      visitor.status = newStatus;
      visitor.lastContactDate = new Date();
      
      // Add to pipeline history
      if (!visitor.pipelineHistory) {
        visitor.pipelineHistory = [];
      }
      visitor.pipelineHistory.push({
        status: newStatus,
        changedAt: new Date(),
        changedBy,
        notes
      });

      await visitor.save();

      // If status indicates conversion, create/update enquiry
      if (['converted', 'payment_received', 'report_generated'].includes(newStatus)) {
        await this.syncVisitorAndEnquiry({
          name: visitor.name,
          email: visitor.email,
          phone: visitor.phone,
          organization: visitor.organization,
          service: visitor.service,
          enquiryDetails: visitor.enquiryDetails
        }, visitor.source);
      }

      return visitor;
    } catch (error) {
      console.error('❌ Error updating visitor status:', error);
      throw error;
    }
  }

  /**
   * Get real-time counts for dashboard stats
   */
  static async getDashboardStats(userRole = 'executive', userId = null) {
    try {
      const unifiedData = await this.getUnifiedDashboardData(userRole, userId);
      
      const stats = {
        totalVisitors: unifiedData.visitors.length,
        totalEnquiries: unifiedData.enquiries.length,
        totalConversations: unifiedData.chatHistory.length,
        newVisitors: unifiedData.visitors.filter(v => 
          (new Date() - v.createdAt) < (24 * 60 * 60 * 1000) // Last 24 hours
        ).length,
        convertedLeads: unifiedData.visitors.filter(v => v.isConverted).length,
        activeEnquiries: unifiedData.enquiries.filter(e => 
          ['new', 'in_progress'].includes(e.status)
        ).length
      };

      return stats;
    } catch (error) {
      console.error('❌ Error getting dashboard stats:', error);
      throw error;
    }
  }
}

module.exports = DataSyncService;
