import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import User from '@/lib/models/User';
import ChatMessage from '@/lib/models/ChatMessage';
import Visitor from '@/lib/models/Visitor';

// Temporarily disable authentication for testing
export const GET = async (request: NextRequest) => {
  try {
    console.log('🔄 GET /api/analytics/agent-performance - Fetching agent performance data');
    
    await connectMongo();
    console.log('✅ Connected to MongoDB');

    // Fetch all executives/agents
    const agents = await User.find({ role: 'executive' }).select('-password').lean();
    console.log(`👥 Found ${agents.length} agents`);

    // Fetch chat messages to calculate performance metrics
    const messages = await ChatMessage.find({}).lean();
    console.log(`💬 Found ${messages.length} chat messages`);

    // Fetch visitors to calculate conversion metrics
    const visitors = await Visitor.find({}).lean();
    console.log(`👤 Found ${visitors.length} visitors`);

    // Calculate performance metrics for each agent
    const agentPerformance = agents.map(agent => {
      // Count messages sent by this agent
      const agentMessages = messages.filter(msg => 
        msg.sender === 'bot' && msg.visitorId // Assuming bot messages are from agents
      );

      // Count unique visitors this agent has interacted with
      const uniqueVisitors = new Set(
        agentMessages.map(msg => msg.visitorId)
      ).size;

      // Calculate response time (mock data for now)
      const avgResponseTime = Math.floor(Math.random() * 300) + 60; // 1-5 minutes

      // Calculate conversion rate (mock data for now)
      const conversionRate = Math.floor(Math.random() * 30) + 10; // 10-40%

      // Calculate satisfaction score (mock data for now)
      const satisfactionScore = Math.floor(Math.random() * 2) + 4; // 4-5 stars

      return {
        agentId: agent._id.toString(),
        agentName: agent.name,
        agentEmail: agent.email,
        department: agent.department,
        totalMessages: agentMessages.length,
        uniqueVisitors: uniqueVisitors,
        avgResponseTime: avgResponseTime,
        conversionRate: conversionRate,
        satisfactionScore: satisfactionScore,
        isActive: agent.isActive || true,
        lastActive: agent.lastActiveAt || new Date().toISOString()
      };
    });

    console.log(`📊 Generated performance data for ${agentPerformance.length} agents`);

    return NextResponse.json({
      success: true,
      agentPerformance,
      totalAgents: agents.length,
      activeAgents: agentPerformance.filter(a => a.isActive).length
    });

  } catch (error) {
    console.error('❌ Agent performance API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch agent performance data',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};
