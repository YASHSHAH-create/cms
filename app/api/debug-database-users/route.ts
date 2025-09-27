import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import User from '@/lib/models/User';
import { corsHeaders } from '@/lib/cors';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 GET /api/debug-database-users - Checking database users');
    
    await connectMongo();
    console.log('✅ Connected to MongoDB');

    // Get all users from database
    const users = await User.find({}).select('username name role email isActive isApproved').lean();
    
    console.log('📊 Database users found:', users.length);
    users.forEach(user => {
      console.log(`- ${user.username} (${user.role}) - ${user.name} - Active: ${user.isActive} - Approved: ${user.isApproved}`);
    });

    // Check specifically for admin and sanjana users
    const adminUser = users.find(u => u.username === 'admin');
    const sanjanaUser = users.find(u => u.username === 'sanjana');
    
    console.log('🔍 Admin user:', adminUser);
    console.log('🔍 Sanjana user:', sanjanaUser);

    const response = NextResponse.json({
      success: true,
      message: 'Database users retrieved successfully',
      totalUsers: users.length,
      users: users,
      adminUser: adminUser,
      sanjanaUser: sanjanaUser,
      analysis: {
        hasAdmin: !!adminUser,
        hasSanjana: !!sanjanaUser,
        adminName: adminUser?.name,
        sanjanaName: sanjanaUser?.name,
        adminRole: adminUser?.role,
        sanjanaRole: sanjanaUser?.role
      }
    });
    
    // Add CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;

  } catch (error) {
    console.error('❌ Database users debug error:', error);
    
    const response = NextResponse.json({
      success: false,
      message: 'Failed to retrieve database users',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
    
    // Add CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  }
}
