import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectMongo } from '@/lib/mongo';
import User from '@/lib/models/User';
import { corsHeaders } from '@/lib/cors';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 POST /api/auth/fully-dynamic-login - 100% dynamic authentication');
    
    const { username, password } = await request.json();
    
    if (!username || !password) {
      return NextResponse.json({ 
        success: false, 
        message: 'Username and password are required' 
      }, { status: 400 });
    }

    // ONLY database authentication - NO FALLBACKS, NO HARDCODED DATA
    await connectMongo();
    console.log('✅ Connected to MongoDB');

    const user = await User.findOne({ 
      $or: [
        { username: username.toLowerCase() },
        { email: username.toLowerCase() }
      ]
    });

    if (!user) {
      return NextResponse.json({ 
        success: false, 
        message: 'User not found' 
      }, { status: 401 });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid credentials' 
      }, { status: 401 });
    }

    // Update last login
    await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });

    console.log(`✅ Dynamic login successful: ${user.name} (${user.role})`);

    // Create JWT token with dynamic user data
    const token = jwt.sign(
      { 
        userId: user._id.toString(), 
        username: user.username, 
        name: user.name,
        role: user.role,
        email: user.email,
        department: user.department,
        region: user.region
      },
      process.env.JWT_SECRET || 'your-secret-key-here',
      { expiresIn: '24h' }
    );

    const response = NextResponse.json({
      success: true,
      message: 'Dynamic login successful',
      token,
      user: {
        id: user._id.toString(),
        username: user.username,
        name: user.name,
        role: user.role,
        email: user.email,
        department: user.department,
        region: user.region,
        isActive: user.isActive,
        isApproved: user.isApproved,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      }
    });
    
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;

  } catch (error) {
    console.error('❌ Dynamic login error:', error);
    
    const response = NextResponse.json({
      success: false,
      message: 'Database connection failed. Please contact administrator.',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
    
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  }
}
