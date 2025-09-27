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

    // Get all active agents from database
    const agents = await User.find({
      role: { $in: ['customer-executive', 'executive', 'sales-executive'] },
      isActive: true,
      isApproved: true
    }).select('name username email role department region').lean();

    console.log(`✅ Found ${agents.length} dynamic agents from database`);

    const transformedAgents = agents.map(agent => ({
      _id: agent._id.toString(),
      id: agent._id.toString(),
      name: agent.name,
      username: agent.username,
      email: agent.email,
      role: agent.role,
      department: agent.department,
      region: agent.region,
      displayName: `${agent.name} (${agent.role.replace('-', ' ').split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')})`
    }));

    const response = NextResponse.json({
      success: true,
      agents: transformedAgents,
      count: transformedAgents.length,
      message: 'Dynamic agents fetched from database successfully'
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
