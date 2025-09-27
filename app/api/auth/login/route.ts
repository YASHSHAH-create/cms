import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectMongo } from '@/lib/mongo';
import User from '@/lib/models/User';

export async function POST(request: NextRequest) {
  try {
    console.log('🔐 POST /api/auth/login - Login attempt');
    
    const { username, password } = await request.json();
    
    if (!username || !password) {
      return NextResponse.json({ 
        success: false, 
        message: 'Username and password are required' 
      }, { status: 400 });
    }

    console.log(`👤 Login attempt for: ${username}`);

    // Try MongoDB connection first, fallback to mock if it fails
    try {
      await connectMongo();
      console.log('✅ MongoDB connected, using real authentication');

      // Find user by username (case-insensitive)
      const user = await User.findOne({ username: username.toLowerCase() });
      
      if (!user) {
        console.log(`❌ User not found: ${username}`);
        return NextResponse.json({ 
          success: false, 
          message: 'Invalid credentials' 
        }, { status: 401 });
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      
      if (!isPasswordValid) {
        console.log(`❌ Invalid password for: ${username}`);
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

      console.log(`✅ Real login successful: ${user.name} (${user.role})`);

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

    } catch (mongoError) {
      console.log('⚠️ MongoDB connection failed, using mock authentication');
      console.error('MongoDB error:', mongoError.message);

      // FALLBACK: Mock users for local development when MongoDB is unavailable
      const mockUsers = [
        {
          _id: '507f1f77bcf86cd799439011',
          username: 'admin',
          email: 'admin@envirocarelabs.com',
          name: 'Administrator',
          password: 'admin123',
          role: 'admin',
          department: 'Administration',
          region: 'All Regions',
          isApproved: true,
          isActive: true
        },
        {
          _id: '507f1f77bcf86cd799439012',
          username: 'sanjana',
          email: 'sanjana@envirocarelabs.com',
          name: 'Sanjana Pawar',
          password: 'sanjana123',
          role: 'customer-executive',
          department: 'Customer Service',
          region: 'North',
          isApproved: true,
          isActive: true
        }
      ];

      // Find user in mock data
      const user = mockUsers.find(u => 
        u.username.toLowerCase() === username.toLowerCase() || 
        u.email.toLowerCase() === username.toLowerCase()
      );

      if (!user) {
        console.log(`❌ Mock user not found: ${username}`);
        return NextResponse.json({ 
          success: false, 
          message: 'Invalid credentials' 
        }, { status: 401 });
      }

      // Check password (plain text for mock)
      if (user.password !== password) {
        console.log(`❌ Mock password invalid for: ${username}`);
        return NextResponse.json({ 
          success: false, 
          message: 'Invalid credentials' 
        }, { status: 401 });
      }

      console.log(`✅ Mock login successful: ${user.name} (${user.role})`);

      // Create JWT token
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
        message: 'Login successful (Fallback Mode)',
        token,
        user: {
          id: user._id,
          username: user.username,
          name: user.name,
          role: user.role,
          email: user.email,
          department: user.department,
          region: user.region,
          isApproved: user.isApproved,
          isActive: user.isActive
        }
      });
    }

  } catch (error) {
    console.error('❌ Login error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Server error during login' 
    }, { status: 500 });
  }
}
