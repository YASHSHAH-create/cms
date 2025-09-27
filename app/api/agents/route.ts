import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import User from '@/lib/models/User';
import { corsHeaders } from '@/lib/cors';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 GET /api/agents - Fetching real agents/customer executives');
    
    await connectMongo();
    console.log('✅ Connected to MongoDB');

    // Fetch all customer executives and executives
    const agents = await User.find({
      role: { $in: ['customer-executive', 'executive'] },
      isActive: true
    }).select('_id username name email role').lean();

    console.log(`📊 Found ${agents.length} active agents/customer executives`);

    // Transform agents data for frontend
    const transformedAgents = agents.map((agent: any) => ({
      _id: agent._id.toString(),
      name: agent.name || agent.username,
      username: agent.username,
      email: agent.email,
      role: agent.role,
      displayName: `${agent.name || agent.username} (${agent.role === 'customer-executive' ? 'Customer Executive' : 'Executive'})`
    }));

    const response = NextResponse.json({
      success: true,
      agents: transformedAgents,
      count: transformedAgents.length,
      message: 'Real agents fetched successfully'
    });
    
    // Add CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;

  } catch (error) {
    console.error('❌ Agents API error:', error);
    
    // Fallback to mock data if database fails
    const fallbackAgents = [
      {
        _id: 'fallback_1',
        name: 'Sanjana Pawar',
        username: 'sanjana',
        email: 'sanjana@envirocarelabs.com',
        role: 'customer-executive',
        displayName: 'Sanjana Pawar (Customer Executive)'
      }
    ];

    const response = NextResponse.json({
      success: true,
      agents: fallbackAgents,
      count: fallbackAgents.length,
      message: 'Fallback data - Database unavailable'
    });
    
    // Add CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  }
}
