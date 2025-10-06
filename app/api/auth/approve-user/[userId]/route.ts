import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import User from '@/lib/models/User';
import { createAuthenticatedHandler, requireAdmin } from '@/lib/middleware/auth';

async function approveUser(request: NextRequest, user: any, context?: { params: Promise<{ userId: string }> }) {
  try {
    await connectMongo();
    console.log('✅ Connected to MongoDB');

    const params = await context?.params;
    if (!params?.userId) {
      return NextResponse.json({
        success: false,
        message: 'User ID is required'
      }, { status: 400 });
    }

    const { userId } = params;
    console.log('🔄 POST /api/auth/approve-user - Approving user:', userId);

    // Find the user to approve
    const userToApprove = await User.findById(userId);
    
    if (!userToApprove) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    // Update user approval status
    userToApprove.isApproved = true;
    userToApprove.isActive = true;
    userToApprove.approvedBy = user.userId; // Use userId from authenticated user
    userToApprove.approvedAt = new Date();
    
    await userToApprove.save();
    
    console.log(`✅ User approved successfully: ${userToApprove.name} (${userToApprove.email})`);
    console.log(`📝 isApproved: ${userToApprove.isApproved}, isActive: ${userToApprove.isActive}`);

    return NextResponse.json({
      success: true,
      message: `User ${userToApprove.name} has been approved successfully`,
      user: {
        _id: userToApprove._id,
        name: userToApprove.name,
        email: userToApprove.email,
        role: userToApprove.role,
        isApproved: userToApprove.isApproved,
        approvedAt: userToApprove.approvedAt
      }
    });

  } catch (error) {
    console.error('❌ Approve user API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to approve user',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export const POST = createAuthenticatedHandler(approveUser, requireAdmin);
