import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectMongo } from '@/lib/mongo';
import User from '@/lib/models/User';
import { corsHeaders } from '@/lib/cors';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 POST /api/auth/dynamic-login - Dynamic login with auto-user creation');
    
    const { username, password, role = 'customer-executive' } = await request.json();
    
    if (!username || !password) {
      return NextResponse.json({ 
        success: false, 
        message: 'Username and password are required' 
      }, { status: 400 });
    }

    try {
      await connectMongo();
      console.log('✅ Connected to MongoDB');

      // Try to find existing user
      let user = await User.findOne({ 
        $or: [
          { username: username.toLowerCase() },
          { email: username.toLowerCase() }
        ]
      });

      // If user doesn't exist, create one dynamically
      if (!user) {
        console.log(`👤 User '${username}' not found, creating new user`);
        
        const hashedPassword = await bcrypt.hash(password, 10);
        user = new User({
          username: username.toLowerCase(),
          email: `${username}@envirocarelabs.com`,
          password: hashedPassword,
          name: username.charAt(0).toUpperCase() + username.slice(1), // Dynamic name
          role: role,
          isApproved: true,
          isActive: true,
          department: role === 'admin' ? 'Administration' : 'Customer Service',
          region: 'All Regions'
        });
        
        await user.save();
        console.log(`✅ Created new user: ${user.name} (${user.role})`);
      } else {
        // Verify password for existing user
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
          return NextResponse.json({ 
            success: false, 
            message: 'Invalid credentials' 
          }, { status: 401 });
        }
        
        console.log(`✅ Existing user login: ${user.name} (${user.role})`);
      }

      // Update last login
      await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });

      // Create JWT token with dynamic user data
      const token = jwt.sign(
        { 
          userId: user._id.toString(), 
          username: user.username, 
          name: user.name,
          role: user.role 
        },
        process.env.JWT_SECRET || 'your-secret-key-here',
        { expiresIn: '24h' }
      );

      const response = NextResponse.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: user._id.toString(),
          username: user.username,
          name: user.name,
          role: user.role,
          email: user.email
        }
      });
      
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      
      return response;

    } catch (mongoError) {
      console.error('❌ MongoDB error:', mongoError);
      return NextResponse.json({
        success: false,
        message: 'Database connection failed. Please try again.',
        error: mongoError instanceof Error ? mongoError.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Dynamic login error:', error);
    
    const response = NextResponse.json({
      success: false,
      message: 'Login failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
    
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  }
}
