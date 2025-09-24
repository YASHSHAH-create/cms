import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';

export async function GET(request: NextRequest) {
  try {
    await connectMongo();
    
    // Check if admin user exists
    const admin = await User.findOne({ username: 'admin' });
    console.log('Admin user:', admin ? 'EXISTS' : 'NOT FOUND');
    
    // Check if sanjana user exists
    const sanjana = await User.findOne({ username: 'sanjana' });
    console.log('Sanjana user:', sanjana ? 'EXISTS' : 'NOT FOUND');
    
    // Create sanjana user if not exists
    if (!sanjana) {
      const hashedPassword = await bcrypt.hash('sanjana123', 10);
      const newUser = new User({
        username: 'sanjana',
        email: 'sanjana@envirocare.com',
        password: hashedPassword,
        name: 'Sanjana Pawar',
        role: 'executive',
        isApproved: true,
        isActive: true
      });
      await newUser.save();
      console.log('✅ Created Sanjana user');
    }
    
    // Get all users
    const users = await User.find({});
    
    return NextResponse.json({
      success: true,
      message: 'Login test completed',
      users: users.map(u => ({
        username: u.username,
        name: u.name,
        role: u.role,
        isActive: u.isActive,
        isApproved: u.isApproved
      }))
    });
    
  } catch (error: any) {
    console.error('❌ Login test error:', error);
    return NextResponse.json({
      success: false,
      message: 'Login test failed',
      error: error.message
    }, { status: 500 });
  }
}
