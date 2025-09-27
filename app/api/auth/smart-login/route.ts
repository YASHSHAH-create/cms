import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectMongo } from '@/lib/mongo';
import User from '@/lib/models/User';
import { getUserConfig } from '@/lib/config/users';
import { corsHeaders } from '@/lib/cors';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 POST /api/auth/smart-login - Smart login with intelligent fallbacks');
    
    const { username, password } = await request.json();
    
    if (!username || !password) {
      return NextResponse.json({ 
        success: false, 
        message: 'Username and password are required' 
      }, { status: 400 });
    }

    // Try database first
    try {
      await connectMongo();
      console.log('✅ Connected to MongoDB');

      const user = await User.findOne({ 
        $or: [
          { username: username.toLowerCase() },
          { email: username.toLowerCase() }
        ]
      });

      if (user) {
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (isPasswordValid) {
          console.log(`✅ Database login successful: ${user.name} (${user.role})`);
          
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
            message: 'Database login successful',
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
        }
      }
    } catch (mongoError) {
      console.log('⚠️ Database unavailable, using smart fallback');
    }

    // Smart fallback: Use environment-based config
    console.log('🔄 Using smart fallback authentication');
    const fallbackUsers = getUserConfig();
    
    const user = fallbackUsers.find(u => 
      u.username.toLowerCase() === username.toLowerCase() || 
      u.email.toLowerCase() === username.toLowerCase()
    );

    if (!user || user.password !== password) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid credentials' 
      }, { status: 401 });
    }

    console.log(`✅ Fallback login successful: ${user.name} (${user.role})`);

    // Create JWT token with fallback user data
    const token = jwt.sign(
      { 
        userId: `fallback_${user.username}`, 
        username: user.username, 
        name: user.name,
        role: user.role 
      },
      process.env.JWT_SECRET || 'your-secret-key-here',
      { expiresIn: '24h' }
    );

    const response = NextResponse.json({
      success: true,
      message: 'Fallback login successful',
      token,
      user: {
        id: `fallback_${user.username}`,
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

  } catch (error) {
    console.error('❌ Smart login error:', error);
    
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
