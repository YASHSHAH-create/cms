import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import User from '@/lib/models/User';
import jwt from 'jsonwebtoken';
import { corsHeaders } from '@/lib/cors';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 GET /api/auth/validate-session - Validating user session');
    
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({
        success: false,
        message: 'No token provided'
      }, { status: 401 });
    }

    try {
      await connectMongo();
      console.log('✅ Connected to MongoDB');

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-here') as any;
      console.log('✅ JWT token verified:', { userId: decoded.userId, role: decoded.role });

      // Try to get user from database first
      try {
        const user = await User.findById(decoded.userId).lean();
        if (user) {
          console.log('✅ User found in database:', { name: user.name, role: user.role });
          
          const response = NextResponse.json({
            success: true,
            user: {
              id: user._id.toString(),
              name: user.name,
              role: user.role,
              email: user.email,
              username: user.username
            },
            message: 'Session validated successfully'
          });
          
          // Add CORS headers
          Object.entries(corsHeaders).forEach(([key, value]) => {
            response.headers.set(key, value);
          });
          
          return response;
        }
      } catch (mongoError) {
        console.log('⚠️ MongoDB connection failed, using fallback validation');
      }

      // Fallback: Use mock users for validation
      const mockUsers = [
        { 
          _id: '507f1f77bcf86cd799439011', 
          username: 'admin', 
          email: 'admin@envirocarelabs.com', 
          name: 'Administrator', 
          role: 'admin' 
        },
        { 
          _id: '507f1f77bcf86cd799439012', 
          username: 'sanjana', 
          email: 'sanjana@envirocarelabs.com', 
          name: 'Sanjana Pawar', 
          role: 'customer-executive' 
        }
      ];

      const user = mockUsers.find(u => u._id === decoded.userId);
      if (!user) {
        return NextResponse.json({
          success: false,
          message: 'User not found'
        }, { status: 404 });
      }

      console.log('✅ User validated from fallback:', { name: user.name, role: user.role });

      const response = NextResponse.json({
        success: true,
        user: {
          id: user._id,
          name: user.name,
          role: user.role,
          email: user.email,
          username: user.username
        },
        message: 'Session validated successfully (fallback)'
      });
      
      // Add CORS headers
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      
      return response;

    } catch (jwtError) {
      console.error('❌ JWT verification failed:', jwtError);
      return NextResponse.json({
        success: false,
        message: 'Invalid token'
      }, { status: 401 });
    }

  } catch (error) {
    console.error('❌ Session validation error:', error);
    
    const response = NextResponse.json({
      success: false,
      message: 'Session validation failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
    
    // Add CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  }
}
