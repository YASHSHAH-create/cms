import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import User from '@/lib/models/User';
import { createAuthenticatedHandler, requireAdminOrExecutive } from '@/lib/middleware/auth';

async function getAgents(request: NextRequest, user: any) {
  try {
    console.log('🔄 GET /api/auth/agents - Fetching agents list');
    
    await connectMongo();
    console.log('✅ Connected to MongoDB');

    // Fetch all users with executive role (agents)
    const agents = await User.find({ 
      role: { $in: ['executive', 'customer-executive', 'sales-executive'] } 
    }).select('-password').lean();
    
    console.log(`👥 Found ${agents.length} agents`);

    // Transform agents data
    const transformedAgents = agents.map(agent => ({
      _id: agent._id.toString(),
      username: agent.username,
      email: agent.email,
      name: agent.name,
      phone: agent.phone || '',
      role: agent.role,
      department: agent.department || 'Customer Service',
      isApproved: agent.isApproved || false,
      isActive: agent.isActive || true,
      createdAt: agent.createdAt,
      lastActiveAt: agent.lastActiveAt
    }));

    return NextResponse.json({
      success: true,
      agents: transformedAgents,
      count: agents.length
    });

  } catch (error) {
    console.error('❌ Agents API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch agents',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export const GET = createAuthenticatedHandler(getAgents, requireAdminOrExecutive);
