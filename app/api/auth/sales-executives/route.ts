import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import User from '@/lib/models/User';
import { corsHeaders } from '@/lib/cors';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 GET /api/auth/sales-executives - Fetching sales executives');
    
    await connectMongo();
    console.log('✅ Connected to MongoDB');

    // Fetch all sales executives
    const salesExecutives = await User.find({
      role: 'sales-executive',
      isActive: true
    }).select('_id username name email role').lean();

    console.log(`📊 Found ${salesExecutives.length} active sales executives`);

    // Transform sales executives data for frontend
    const transformedSalesExecutives = salesExecutives.map((exec: any) => ({
      _id: exec._id.toString(),
      id: exec._id.toString(),
      name: exec.name || exec.username,
      username: exec.username,
      email: exec.email,
      role: exec.role,
      displayName: `${exec.name || exec.username} (Sales Executive)`
    }));

    const response = NextResponse.json({
      success: true,
      users: transformedSalesExecutives,
      salesExecutives: transformedSalesExecutives,
      count: transformedSalesExecutives.length,
      message: 'Real sales executives fetched successfully'
    });
    
    // Add CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;

  } catch (error) {
    console.error('❌ Sales executives API error:', error);
    
    // Fallback to mock data if database fails
    const fallbackSalesExecutives = [
      {
        _id: 'fallback_sales_1',
        id: 'fallback_sales_1',
        name: 'Vishal',
        username: 'vishal',
        email: 'vishal@envirocarelabs.com',
        role: 'sales-executive',
        displayName: 'Vishal (Sales Executive)'
      },
      {
        _id: 'fallback_sales_2',
        id: 'fallback_sales_2',
        name: 'Yug',
        username: 'yug',
        email: 'yug@envirocarelabs.com',
        role: 'sales-executive',
        displayName: 'Yug (Sales Executive)'
      }
    ];

    const response = NextResponse.json({
      success: true,
      users: fallbackSalesExecutives,
      salesExecutives: fallbackSalesExecutives,
      count: fallbackSalesExecutives.length,
      message: 'Fallback data - Database unavailable'
    });
    
    // Add CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  }
}