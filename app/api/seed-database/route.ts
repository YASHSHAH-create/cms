import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';
import { corsHeaders } from '@/lib/cors';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🌱 POST /api/seed-database - Seeding database with dynamic users');
    
    await connectMongo();
    console.log('✅ Connected to MongoDB');

    // Clear existing users
    await User.deleteMany({});
    console.log('🗑️ Cleared existing users');

    // Create dynamic users
    const users = [
      {
        username: 'admin',
        email: 'admin@envirocarelabs.com',
        password: await bcrypt.hash('admin123', 10),
        name: 'Administrator',
        role: 'admin',
        department: 'Administration',
        region: 'All Regions',
        isApproved: true,
        isActive: true
      },
      {
        username: 'sanjana',
        email: 'sanjana@envirocarelabs.com',
        password: await bcrypt.hash('sanjana123', 10),
        name: 'Sanjana Pawar',
        role: 'customer-executive',
        department: 'Customer Service',
        region: 'North',
        isApproved: true,
        isActive: true
      },
      {
        username: 'vishal',
        email: 'vishal@envirocarelabs.com',
        password: await bcrypt.hash('vishal123', 10),
        name: 'Vishal',
        role: 'sales-executive',
        department: 'Sales',
        region: 'South',
        isApproved: true,
        isActive: true
      },
      {
        username: 'yug',
        email: 'yug@envirocarelabs.com',
        password: await bcrypt.hash('yug123', 10),
        name: 'Yug',
        role: 'sales-executive',
        department: 'Sales',
        region: 'West',
        isApproved: true,
        isActive: true
      }
    ];

    const createdUsers = await User.insertMany(users);
    console.log(`✅ Created ${createdUsers.length} dynamic users in database`);

    const response = NextResponse.json({
      success: true,
      message: `Database seeded with ${createdUsers.length} dynamic users`,
      users: createdUsers.map(user => ({
        id: user._id.toString(),
        username: user.username,
        name: user.name,
        role: user.role,
        email: user.email,
        department: user.department,
        region: user.region
      }))
    });
    
    // Add CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;

  } catch (error) {
    console.error('❌ Database seeding error:', error);
    
    const response = NextResponse.json({
      success: false,
      message: 'Failed to seed database',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
    
    // Add CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  }
}
