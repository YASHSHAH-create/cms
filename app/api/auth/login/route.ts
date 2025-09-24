import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectMongo } from '@/lib/mongo';
import User from '@/lib/models/User';

export async function POST(request: NextRequest) {
  try {
    await connectMongo();
    
    const { username, password } = await request.json();
    
    if (!username || !password) {
      return NextResponse.json({ 
        success: false, 
        message: 'Username and password are required' 
      }, { status: 400 });
    }

    // Find user by username (case-insensitive)
    const user = await User.findOne({ username: username.toLowerCase() });
    
    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid credentials' 
      }, { status: 401 });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid credentials' 
      }, { status: 401 });
    }

    // Check if user is approved (for non-admin users)
    if (user.role !== 'admin' && user.role !== 'executive' && !user.isApproved) {
      return NextResponse.json({ 
        success: false, 
        message: 'Your account is pending admin approval. Please contact the administrator.' 
      }, { status: 403 });
    }

    // Check if account is active
    if (user.role !== 'executive' && !user.isActive) {
      return NextResponse.json({ 
        success: false, 
        message: 'Your account has been deactivated. Please contact the administrator.' 
      }, { status: 403 });
    }

    // Update last login time
    await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });

    // Create enhanced token with name for filtering
    const token = jwt.sign(
      { 
        userId: user._id, 
        username: user.username, 
        name: user.name,
        role: user.role 
      },
      process.env.JWT_SECRET || 'your-secret-key-here',
      { expiresIn: '24h' }
    );

    // Return user data and token
    return NextResponse.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Server error during login' 
    }, { status: 500 });
  }
}
