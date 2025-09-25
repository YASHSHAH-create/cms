import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import User from '@/lib/models/User';
import { createAuthenticatedHandler, requireAdmin } from '@/lib/middleware/auth';

async function rejectUser(request: NextRequest, user: any, { params }: { params: { userId: string } }) {
  try {
    console.log('🔄 DELETE /api/auth/reject-user - Rejecting user:', params.userId);
    
    await connectMongo();
    console.log('✅ Connected to MongoDB');

    const { userId } = params;
    const body = await request.json().catch(() => ({}));
    const { reason } = body;

    // Find the user to reject
    const userToReject = await User.findById(userId);
    
    if (!userToReject) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    const rejectedUserInfo = {
      name: userToReject.name,
      email: userToReject.email,
      role: userToReject.role
    };

    // Delete the user (reject registration)
    await User.findByIdAndDelete(userId);
    
    console.log(`✅ User rejected and deleted: ${rejectedUserInfo.name} (${rejectedUserInfo.email})`);
    console.log(`📝 Rejection reason: ${reason || 'No reason provided'}`);

    return NextResponse.json({
      success: true,
      message: `User ${rejectedUserInfo.name}'s registration has been rejected and removed from the system`,
      rejectedUser: rejectedUserInfo,
      reason: reason || 'No reason provided'
    });

  } catch (error) {
    console.error('❌ Reject user API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to reject user',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export const DELETE = createAuthenticatedHandler(rejectUser, requireAdmin);
