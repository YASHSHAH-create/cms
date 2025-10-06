import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import User from '@/lib/models/User';
import { corsHeaders } from '@/lib/cors';

// Handle CORS preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    await connectMongo();
    
    const { 
      username, 
      password, 
      name, 
      email, 
      phone,
      role = 'customer-executive',
      region,
      specializations = []
    } = await request.json();
    
    // Validate required fields
    if (!username || !password || !name || !email) {
      return NextResponse.json({ 
        success: false, 
        message: 'Username, password, name, and email are required' 
      }, { status: 400, headers: corsHeaders });
    }

    // Validate role
    const validRoles = ['sales-executive', 'customer-executive'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Invalid role. Must be sales-executive or customer-executive' 
      }, { status: 400, headers: corsHeaders });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [
        { username: username.toLowerCase() },
        { email: email.toLowerCase() }
      ]
    });
    
    if (existingUser) {
      return NextResponse.json({ 
        success: false, 
        message: 'Username or email already exists' 
      }, { status: 400, headers: corsHeaders });
    }

    // Create new user with approval workflow
    const newUser = new User({
      username: username.toLowerCase(),
      password, // Will be hashed by pre-save hook
      name,
      email: email.toLowerCase(),
      phone: phone || null,
      role,
      region: region || null,
      specializations: Array.isArray(specializations) ? specializations : [],
      isActive: true,
      isApproved: false, // Requires admin approval
      lastLoginAt: null
    });

    await newUser.save();

    // Log registration for admin notification
    console.log(`📝 New ${role} registration: ${name} (${email}) - Pending approval`);

    return NextResponse.json({
      success: true,
      message: 'Registration successful! Your account is pending admin approval. You will be notified via email once approved.',
      user: {
        id: newUser._id,
        username: newUser.username,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        isApproved: newUser.isApproved
      }
    }, { status: 201, headers: corsHeaders });

  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Server error during registration' 
    }, { status: 500, headers: corsHeaders });
  }
}
