import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectMongo } from '@/lib/mongo';
import User from '@/lib/models/User';

// Authentication helper
async function authenticateAdmin(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return { error: NextResponse.json({ success: false, message: 'No token provided' }, { status: 401 }) };
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-here') as any;
    
    await connectMongo();
    const user = await User.findById(decoded.userId).select('-password').lean();
    
    if (!user || user.role !== 'admin') {
      return { error: NextResponse.json({ success: false, message: 'Admin access required' }, { status: 403 }) };
    }

    return { user };
  } catch (error) {
    return { error: NextResponse.json({ success: false, message: 'Invalid token' }, { status: 401 }) };
  }
}

// Get specific user by ID
export async function GET(request: NextRequest, { params }: { params: { userId: string } }) {
  const auth = await authenticateAdmin(request);
  if (auth.error) return auth.error;

  try {
    console.log('🔄 GET /api/auth/users/[userId] - Fetching user:', params.userId);
    
    await connectMongo();
    const { userId } = params;

    const targetUser = await User.findById(userId).select('-password').lean();
    
    if (!targetUser) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    const userData = {
      _id: targetUser._id.toString(),
      username: targetUser.username,
      email: targetUser.email,
      name: targetUser.name,
      phone: targetUser.phone || '',
      role: targetUser.role,
      department: targetUser.department || 'Customer Service',
      region: targetUser.region || '',
      isApproved: targetUser.isApproved,
      isActive: targetUser.isActive !== false,
      createdAt: targetUser.createdAt,
      lastLoginAt: targetUser.lastLoginAt,
      approvedAt: targetUser.approvedAt
    };

    return NextResponse.json({
      success: true,
      user: userData
    });

  } catch (error) {
    console.error('❌ Get user API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch user',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Update user by ID (Admin only) - WITHOUT password update to avoid bcrypt issues
export async function PUT(request: NextRequest, { params }: { params: { userId: string } }) {
  const auth = await authenticateAdmin(request);
  if (auth.error) return auth.error;

  try {
    console.log('🔄 PUT /api/auth/users/[userId] - Updating user:', params.userId);
    
    await connectMongo();
    const { userId } = params;
    const body = await request.json();
    
    console.log('📝 Update data received:', body);

    const userToUpdate = await User.findById(userId);
    
    if (!userToUpdate) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    const originalData = {
      name: userToUpdate.name,
      email: userToUpdate.email,
      role: userToUpdate.role
    };

    // Update fields if provided (excluding password for now)
    const allowedFields = [
      'name', 'email', 'phone', 'role', 'department', 'region', 
      'isActive', 'isApproved', 'username'
    ];

    const updateData: any = {};
    
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    // Handle email/username synchronization
    if (body.email && body.email !== userToUpdate.email) {
      const existingUser = await User.findOne({ 
        $and: [
          { $or: [{ email: body.email }, { username: body.email }] },
          { _id: { $ne: userId } }
        ]
      });

      if (existingUser) {
        return NextResponse.json({
          success: false,
          message: 'Email already exists for another user'
        }, { status: 409 });
      }

      updateData.email = body.email;
      if (userToUpdate.username === userToUpdate.email) {
        updateData.username = body.email;
      }
    }

    updateData.updatedAt = new Date();
    updateData.updatedBy = auth.user._id;

    console.log('📝 Fields to update:', Object.keys(updateData));

    const updatedUser = await User.findByIdAndUpdate(
      userId, 
      updateData, 
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return NextResponse.json({
        success: false,
        message: 'Failed to update user'
      }, { status: 500 });
    }

    console.log(`✅ User updated successfully: ${originalData.name} → ${updatedUser.name}`);

    const responseData = {
      _id: updatedUser._id.toString(),
      username: updatedUser.username,
      email: updatedUser.email,
      name: updatedUser.name,
      phone: updatedUser.phone || '',
      role: updatedUser.role,
      department: updatedUser.department || 'Customer Service',
      region: updatedUser.region || '',
      isApproved: updatedUser.isApproved,
      isActive: updatedUser.isActive !== false,
      createdAt: updatedUser.createdAt,
      lastLoginAt: updatedUser.lastLoginAt,
      updatedAt: updatedUser.updatedAt
    };

    return NextResponse.json({
      success: true,
      message: `User ${updatedUser.name} updated successfully`,
      user: responseData,
      changes: Object.keys(updateData).filter(key => key !== 'updatedAt' && key !== 'updatedBy')
    });

  } catch (error) {
    console.error('❌ Update user API error:', error);
    
    if (error.code === 11000) {
      return NextResponse.json({
        success: false,
        message: 'Email or username already exists'
      }, { status: 409 });
    }

    return NextResponse.json({
      success: false,
      message: 'Failed to update user',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Delete user by ID (Admin only)
export async function DELETE(request: NextRequest, { params }: { params: { userId: string } }) {
  const auth = await authenticateAdmin(request);
  if (auth.error) return auth.error;

  try {
    console.log('🔄 DELETE /api/auth/users/[userId] - Deleting user:', params.userId);
    
    await connectMongo();
    const { userId } = params;

    if (userId === auth.user._id.toString()) {
      return NextResponse.json({
        success: false,
        message: 'Cannot delete your own account'
      }, { status: 400 });
    }

    const userToDelete = await User.findById(userId);
    
    if (!userToDelete) {
      return NextResponse.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    const deletedUserInfo = {
      name: userToDelete.name,
      email: userToDelete.email,
      role: userToDelete.role
    };

    await User.findByIdAndDelete(userId);
    
    console.log(`✅ User deleted successfully: ${deletedUserInfo.name} (${deletedUserInfo.email})`);

    return NextResponse.json({
      success: true,
      message: `User ${deletedUserInfo.name} has been deleted successfully`,
      deletedUser: deletedUserInfo
    });

  } catch (error) {
    console.error('❌ Delete user API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to delete user',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
