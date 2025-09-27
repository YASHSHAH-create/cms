import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import User from '@/lib/models/User';
import jwt from 'jsonwebtoken';
import { corsHeaders } from '@/lib/cors';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 GET /api/auth/dynamic-validate-session - 100% dynamic session validation');
    
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({
        success: false,
        message: 'No token provided'
      }, { status: 401 });
    }

    // ONLY database validation - NO FALLBACKS, NO HARDCODED DATA
    await connectMongo();
    console.log('✅ Connected to MongoDB');

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-here') as any;
    console.log('✅ JWT token verified:', { userId: decoded.userId, role: decoded.role });

    // Get user from database
    const user = await User.findById(decoded.userId).lean();
    if (!user) {
      return NextResponse.json({
        success: false,
        message: 'User not found in database'
      }, { status: 404 });
    }

    console.log('✅ Dynamic user validation successful:', { name: user.name, role: user.role });

    const response = NextResponse.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        role: user.role,
        email: user.email,
        username: user.username,
        department: user.department,
        region: user.region,
        isActive: user.isActive,
        isApproved: user.isApproved,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      },
      message: 'Dynamic session validated successfully'
    });
    
    // Add CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;

  } catch (error) {
    console.error('❌ Dynamic session validation error:', error);
    
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
