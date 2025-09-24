import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
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
      username: user.username,
      role: user.role,
      name: user.name,
      email: user.email
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
