import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import User from '@/lib/models/User';
import { createAuthenticatedHandler, requireAdmin } from '@/lib/middleware/auth';

async function getExecutives(request: NextRequest, user: any) {
  try {
    console.log('🔄 GET /api/auth/executives - Fetching approved executives');
    
    await connectMongo();
    console.log('✅ Connected to MongoDB');

    // Fetch all approved executives
    const executives = await User.find({ 
      isApproved: true,
      role: { $in: ['sales-executive', 'customer-executive', 'executive'] }
    }).select('-password').lean();
    
    console.log(`👥 Found ${executives.length} approved executives`);

    // Transform executives data
    const transformedExecutives = executives.map(executive => ({
      _id: executive._id.toString(),
      username: executive.username,
      email: executive.email,
      name: executive.name,
      phone: executive.phone || '',
      role: executive.role,
      department: executive.department || 'Customer Service',
      region: executive.region || '',
      isApproved: executive.isApproved,
      isActive: executive.isActive || true,
      createdAt: executive.createdAt,
      lastLoginAt: executive.lastLoginAt,
      approvedAt: executive.approvedAt
    }));

    return NextResponse.json({
      success: true,
      executives: transformedExecutives,
      count: executives.length
    });

  } catch (error) {
    console.error('❌ Executives API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch executives',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export const GET = createAuthenticatedHandler(getExecutives, requireAdmin);
