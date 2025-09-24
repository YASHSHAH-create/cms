import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import User from '@/lib/models/User';
import { createAuthenticatedHandler, requireAdminOrExecutive } from '@/lib/middleware/auth';

async function getSalesExecutives(request: NextRequest, user: any) {
  try {
    console.log('🔄 GET /api/auth/sales-executives - Fetching sales executives list');
    
    await connectMongo();
    console.log('✅ Connected to MongoDB');

    // Fetch all users with sales-executive role
    const salesExecutives = await User.find({ 
      role: 'sales-executive' 
    }).select('-password').lean();
    
    console.log(`💼 Found ${salesExecutives.length} sales executives`);

    // Transform sales executives data
    const transformedSalesExecutives = salesExecutives.map(executive => ({
      _id: executive._id.toString(),
      username: executive.username,
      email: executive.email,
      name: executive.name,
      phone: executive.phone || '',
      role: executive.role,
      department: executive.department || 'Sales',
      isApproved: executive.isApproved || false,
      isActive: executive.isActive || true,
      createdAt: executive.createdAt,
      lastActiveAt: executive.lastActiveAt
    }));

    return NextResponse.json({
      success: true,
      salesExecutives: transformedSalesExecutives,
      count: salesExecutives.length
    });

  } catch (error) {
    console.error('❌ Sales executives API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch sales executives',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export const GET = createAuthenticatedHandler(getSalesExecutives, requireAdminOrExecutive);
