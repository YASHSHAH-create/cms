import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import User from '@/lib/models/User';
import { corsHeaders } from '@/lib/cors';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 GET /api/dynamic-sales-executives - Fetching sales executives from database only');
    
    // ONLY database - NO HARDCODED DATA, NO FALLBACKS
    await connectMongo();
    console.log('✅ Connected to MongoDB');

    // Get all active sales executives from database
    const salesExecutives = await User.find({
      role: 'sales-executive',
      isActive: true,
      isApproved: true
    }).select('name username email role department region').lean();

    console.log(`✅ Found ${salesExecutives.length} dynamic sales executives from database`);

    const transformedSalesExecutives = salesExecutives.map(exec => ({
      _id: exec._id.toString(),
      id: exec._id.toString(),
      name: exec.name,
      username: exec.username,
      email: exec.email,
      role: exec.role,
      department: exec.department,
      region: exec.region,
      displayName: `${exec.name} (Sales Executive)`
    }));

    const response = NextResponse.json({
      success: true,
      salesExecutives: transformedSalesExecutives,
      count: transformedSalesExecutives.length,
      message: 'Dynamic sales executives fetched from database successfully'
    });
    
    // Add CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;

  } catch (error) {
    console.error('❌ Dynamic sales executives API error:', error);
    
    const response = NextResponse.json({
      success: false,
      message: 'Failed to fetch dynamic sales executives',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
    
    // Add CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  }
}
