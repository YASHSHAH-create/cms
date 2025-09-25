import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import User from '@/lib/models/User';
import { createAuthenticatedHandler, requireAdmin } from '@/lib/middleware/auth';

async function approveUser(request: NextRequest, user: any, { params }: { params: { userId: string } }) {
  try {
    console.log('🔄 POST /api/auth/approve-user - Approving user:', params.userId);
    
    await connectMongo();
    console.log('✅ Connected to MongoDB');

    const { userId } = params;

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
    userToApprove.approvedBy = user._id;
    userToApprove.approvedAt = new Date();
    
    await userToApprove.save();
    
    console.log(`✅ User approved successfully: ${userToApprove.name} (${userToApprove.email})`);

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
