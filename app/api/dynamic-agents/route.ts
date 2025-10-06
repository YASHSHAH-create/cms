import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import User from '@/lib/models/User';
import { corsHeaders } from '@/lib/cors';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 GET /api/dynamic-agents - Fetching agents from database only');
    
    // ONLY database - NO HARDCODED DATA, NO FALLBACKS
    await connectMongo();
    console.log('✅ Connected to MongoDB');

    // Get all active agents from database (only customer-executive and executive, NOT sales-executive)
    const agents = await User.find({
      role: { $in: ['customer-executive', 'executive'] },
      isActive: true,
      isApproved: true
    }).select('name username email role department region').lean();

    console.log(`✅ Found ${agents.length} dynamic agents (customer-executive & executive) from database`);

    const transformedAgents = agents.map(agent => ({
      _id: agent._id.toString(),
      id: agent._id.toString(),
      name: agent.name,
      username: agent.username,
      email: agent.email,
      role: agent.role,
      department: agent.department,
      region: agent.region,
      displayName: agent.role === 'customer-executive' 
        ? `${agent.name} (Customer Executive)` 
        : `${agent.name} (Executive)`
    }));

    const response = NextResponse.json({
      success: true,
      agents: transformedAgents,
      count: transformedAgents.length,
      message: 'Customer executives and executives fetched successfully'
    });
    
    // Add CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;

  } catch (error) {
    console.error('❌ Dynamic agents API error:', error);
    
    const response = NextResponse.json({
      success: false,
      message: 'Failed to fetch dynamic agents',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
    
    // Add CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  }
}
