import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import User from '@/lib/models/User';

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}

// Temporarily disable authentication for testing
export const GET = async (request: NextRequest) => {
  try {
    console.log('🔄 GET /api/auth/users - Fetching users list');
    
    await connectMongo();
    console.log('✅ Connected to MongoDB');

    // Fetch all users
    const users = await User.find({}).select('-password').lean();
    console.log(`📊 Found ${users.length} users`);

    return NextResponse.json({
      success: true,
      users: users,
      count: users.length
    }, {
      headers: {
        'Cache-Control': 'public, max-age=300',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });

  } catch (error) {
    console.error('❌ Users API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch users',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};

// Create new user
export const POST = async (request: NextRequest) => {
  try {
    console.log('🔄 POST /api/auth/users - Creating new user');
    
    const body = await request.json();
    const { name, email, phone, role, department, password } = body;

    // Validate required fields
    if (!name || !email || !role) {
      return NextResponse.json({
        success: false,
        message: 'Name, email, and role are required'
      }, { status: 400 });
    }

    await connectMongo();
    console.log('✅ Connected to MongoDB');

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username: email }] 
    });

    if (existingUser) {
      return NextResponse.json({
        success: false,
        message: 'User with this email already exists'
      }, { status: 409 });
    }

    // Create new user
    const newUser = new User({
      username: email,
      email,
      name,
      phone: phone || '',
      role: role || 'executive',
      department: department || 'Customer Service',
      password: password || 'defaultpassword123',
      isApproved: true,
      isActive: true
    });

    await newUser.save();
    console.log('✅ User created successfully:', newUser._id);

    // Return user without password
    const userResponse = {
      _id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      name: newUser.name,
      phone: newUser.phone,
      role: newUser.role,
      department: newUser.department,
      isApproved: newUser.isApproved,
      isActive: newUser.isActive,
      createdAt: newUser.createdAt
    };

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: userResponse
    });

  } catch (error) {
    console.error('❌ Create user API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to create user',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};
