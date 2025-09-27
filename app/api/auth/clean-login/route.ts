import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectMongo } from '@/lib/mongo';
import User from '@/lib/models/User';
import { corsHeaders } from '@/lib/cors';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🧹 POST /api/auth/clean-login - CLEAN login with NO hardcoded data');
    
    const { username, password } = await request.json();
    
    if (!username || !password) {
      return NextResponse.json({ 
        success: false, 
        message: 'Username and password are required' 
      }, { status: 400 });
    }

    let user = null;
    let authSource = '';

    // ONLY try database authentication - NO FALLBACKS
    try {
      await connectMongo();
      console.log('✅ Connected to MongoDB');

      user = await User.findOne({ 
        $or: [
          { username: username.toLowerCase() },
          { email: username.toLowerCase() }
        ]
      });

      if (user) {
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (isPasswordValid) {
          authSource = 'database';
          console.log(`✅ Database authentication successful: ${user.name} (${user.role})`);
        } else {
          return NextResponse.json({ 
            success: false, 
            message: 'Invalid credentials' 
          }, { status: 401 });
        }
      } else {
        return NextResponse.json({ 
          success: false, 
          message: 'User not found' 
        }, { status: 401 });
      }
    } catch (mongoError) {
      console.error('❌ Database connection failed:', mongoError);
      return NextResponse.json({
        success: false,
        message: 'Database connection failed. Please contact administrator.',
        error: mongoError instanceof Error ? mongoError.message : 'Unknown error'
      }, { status: 500 });
    }

    // Update last login
    await User.findByIdAndUpdate(user._id, { lastLoginAt: new Date() });

    // Create JWT token
    const token = jwt.sign(
      { 
        userId: user._id.toString(), 
        username: user.username, 
        name: user.name,
        role: user.role,
        authSource: authSource
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
        email: user.email,
        authSource: authSource
      }
    });
    
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;

  } catch (error) {
    console.error('❌ Clean login error:', error);
    
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
