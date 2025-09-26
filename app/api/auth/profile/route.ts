import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { connectMongo } from '@/lib/mongo';
import User from '@/lib/models/User';

export async function GET(request: NextRequest) {
  try {
    await connectMongo();
    
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ 
        success: false, 
        message: 'No token provided' 
      }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-here') as any;
    
    // Get user details from database
    const user = await User.findById(decoded.userId).select('-password').lean();
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: 'User not found' 
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        _id: user._id.toString(),
        username: user.username,
        email: user.email,
        name: user.name,
        phone: user.phone || '',
        role: user.role,
        department: user.department || 'Customer Service',
        region: user.region || '',
        isApproved: user.isApproved,
        isActive: user.isActive !== false,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      }
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid token' 
      }, { status: 401 });
    }
    return NextResponse.json({ 
      success: false, 
      message: 'Server error while fetching profile' 
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log('🔄 PUT /api/auth/profile - User updating own profile');
    
    await connectMongo();
    
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ 
        success: false, 
        message: 'No token provided' 
      }, { status: 401 });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-here') as any;
    
    // Get user from database
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: 'User not found' 
      }, { status: 404 });
    }

    const body = await request.json();
    console.log('📝 Profile update data received:', body);

    const originalData = {
      name: user.name,
      email: user.email,
      phone: user.phone
    };

    // Fields that users can update themselves
    const allowedFields = ['name', 'phone', 'email'];
    const updateData: any = {};
    
    // Only update allowed fields that are provided
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    // Handle password update if provided
    if (body.password && body.password.trim() !== '') {
      console.log('🔐 User updating their password');
      updateData.password = await bcrypt.hash(body.password, 10);
    }

    // Handle email/username synchronization
    if (body.email && body.email !== user.email) {
      // Check if new email already exists
      const existingUser = await User.findOne({ 
        $and: [
          { $or: [{ email: body.email }, { username: body.email }] },
          { _id: { $ne: user._id } } // Exclude current user
        ]
      });

      if (existingUser) {
        return NextResponse.json({
          success: false,
          message: 'Email already exists for another user'
        }, { status: 409 });
      }

      updateData.email = body.email;
      // Also update username if it matches email pattern
      if (user.username === user.email) {
        updateData.username = body.email;
      }
    }

    // Add update metadata
    updateData.updatedAt = new Date();

    console.log('📝 Profile fields to update:', Object.keys(updateData));

    // Perform the update
    const updatedUser = await User.findByIdAndUpdate(
      user._id, 
      updateData, 
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      return NextResponse.json({
        success: false,
        message: 'Failed to update profile'
      }, { status: 500 });
    }

    console.log(`✅ Profile updated successfully: ${originalData.name} → ${updatedUser.name}`);
    console.log(`📧 Email: ${originalData.email} → ${updatedUser.email}`);
    console.log(`📱 Phone: ${originalData.phone} → ${updatedUser.phone}`);

    // Return updated user data
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
      message: 'Profile updated successfully',
      user: responseData,
      changes: Object.keys(updateData).filter(key => key !== 'updatedAt' && key !== 'password')
    });

  } catch (error) {
    console.error('❌ Profile update error:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid token' 
      }, { status: 401 });
    }

    // Handle specific MongoDB errors
    if (error.code === 11000) {
      return NextResponse.json({
        success: false,
        message: 'Email already exists'
      }, { status: 409 });
    }

    return NextResponse.json({ 
      success: false, 
      message: 'Server error while updating profile',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
