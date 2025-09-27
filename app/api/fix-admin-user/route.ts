import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';
import { corsHeaders } from '@/lib/cors';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 POST /api/fix-admin-user - Fixing admin user in database');
    
    await connectMongo();
    console.log('✅ Connected to MongoDB');

    // Check if admin user exists
    let adminUser = await User.findOne({ username: 'admin' });
    
    if (!adminUser) {
      console.log('❌ Admin user not found, creating new admin user');
      
      // Create new admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      adminUser = new User({
        username: 'admin',
        email: 'admin@envirocarelabs.com',
        password: hashedPassword,
        name: 'Administrator',
        role: 'admin',
        isApproved: true,
        isActive: true,
        department: 'Administration',
        region: 'All Regions'
      });
      
      await adminUser.save();
      console.log('✅ Created new admin user');
    } else {
      console.log('🔧 Admin user exists, updating to ensure correct data');
      
      // Update admin user to ensure correct data
      adminUser.name = 'Administrator';
      adminUser.role = 'admin';
      adminUser.email = 'admin@envirocarelabs.com';
      adminUser.isApproved = true;
      adminUser.isActive = true;
      adminUser.department = 'Administration';
      adminUser.region = 'All Regions';
      
      await adminUser.save();
      console.log('✅ Updated admin user data');
    }

    // Also check and fix Sanjana user to ensure she's not admin
    const sanjanaUser = await User.findOne({ username: 'sanjana' });
    if (sanjanaUser) {
      console.log('🔧 Fixing Sanjana user to ensure she\'s not admin');
      sanjanaUser.role = 'customer-executive';
      sanjanaUser.name = 'Sanjana Pawar';
      await sanjanaUser.save();
      console.log('✅ Fixed Sanjana user role');
    }

    // Get updated admin user
    const updatedAdminUser = await User.findOne({ username: 'admin' }).lean();
    
    console.log('✅ Admin user fix completed:', updatedAdminUser);

    const response = NextResponse.json({
      success: true,
      message: 'Admin user fixed successfully',
      adminUser: {
        _id: updatedAdminUser?._id.toString(),
        username: updatedAdminUser?.username,
        name: updatedAdminUser?.name,
        role: updatedAdminUser?.role,
        email: updatedAdminUser?.email,
        isActive: updatedAdminUser?.isActive,
        isApproved: updatedAdminUser?.isApproved
      }
    });
    
    // Add CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;

  } catch (error) {
    console.error('❌ Fix admin user error:', error);
    
    const response = NextResponse.json({
      success: false,
      message: 'Failed to fix admin user',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
    
    // Add CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  }
}
