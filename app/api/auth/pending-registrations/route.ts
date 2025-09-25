import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import User from '@/lib/models/User';
import { createAuthenticatedHandler, requireAdmin } from '@/lib/middleware/auth';

async function getPendingRegistrations(request: NextRequest, user: any) {
  try {
    console.log('🔄 GET /api/auth/pending-registrations - Fetching pending registrations');
    
    await connectMongo();
    console.log('✅ Connected to MongoDB');

    // Fetch all users with isApproved: false
    const pendingUsers = await User.find({ 
      isApproved: false,
      role: { $in: ['sales-executive', 'customer-executive', 'executive'] }
    }).select('-password').lean();
    
    console.log(`📋 Found ${pendingUsers.length} pending registrations`);

    // Transform pending users data
    const transformedPendingUsers = pendingUsers.map(pendingUser => ({
      _id: pendingUser._id.toString(),
      username: pendingUser.username,
      email: pendingUser.email,
      name: pendingUser.name,
      phone: pendingUser.phone || '',
      role: pendingUser.role,
      department: pendingUser.department || 'Customer Service',
      region: pendingUser.region || '',
      isApproved: pendingUser.isApproved,
      isActive: pendingUser.isActive || true,
      createdAt: pendingUser.createdAt,
      lastLoginAt: pendingUser.lastLoginAt
    }));

    return NextResponse.json({
      success: true,
      pendingUsers: transformedPendingUsers,
      count: pendingUsers.length
    });

  } catch (error) {
    console.error('❌ Pending registrations API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch pending registrations',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export const GET = createAuthenticatedHandler(getPendingRegistrations, requireAdmin);
