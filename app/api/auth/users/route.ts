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

// Users API with MongoDB fallback to mock data
export const GET = async (request: NextRequest) => {
  try {
    console.log('🔄 GET /api/auth/users - Fetching users list');
    
    // Try MongoDB connection first, fallback to mock if it fails
    try {
      await connectMongo();
      console.log('✅ MongoDB connected, fetching real users');

      // Fetch all users
      const users = await User.find({}).select('-password').lean();
      console.log(`📊 Found ${users.length} real users`);

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

    } catch (mongoError) {
      console.log('⚠️ MongoDB connection failed, using mock users data');
      console.error('MongoDB error:', mongoError.message);

      // FALLBACK: Mock users data for local development when MongoDB is unavailable
      const mockUsers = [
        {
          _id: '507f1f77bcf86cd799439011',
          username: 'admin',
          email: 'admin@envirocarelabs.com',
          name: 'Administrator',
          role: 'admin',
          department: 'Administration',
          region: 'All Regions',
          phone: '+1-555-0001',
          isApproved: true,
          isActive: true,
          createdAt: new Date('2024-01-01'),
          lastLoginAt: new Date()
        },
        {
          _id: '507f1f77bcf86cd799439012',
          username: 'sanjana',
          email: 'sanjana@envirocarelabs.com',
          name: 'Customer Executive',
          role: 'customer-executive',
          department: 'Customer Service',
          region: 'North',
          phone: '+1-555-0002',
          isApproved: true,
          isActive: true,
          createdAt: new Date('2024-01-01'),
          lastLoginAt: new Date()
        },
        {
          _id: '507f1f77bcf86cd799439013',
          username: 'john.doe',
          email: 'john.doe@envirocarelabs.com',
          name: 'John Doe',
          role: 'sales-executive',
          department: 'Sales',
          region: 'South',
          phone: '+1-555-0003',
          isApproved: true,
          isActive: true,
          createdAt: new Date('2024-01-01'),
          lastLoginAt: new Date()
        }
      ];

      console.log(`📊 Fallback data: Found ${mockUsers.length} mock users`);

      return NextResponse.json({
        success: true,
        users: mockUsers,
        count: mockUsers.length,
        message: 'Fallback data - MongoDB unavailable'
      }, {
        headers: {
          'Cache-Control': 'public, max-age=300',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      });
    }

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
