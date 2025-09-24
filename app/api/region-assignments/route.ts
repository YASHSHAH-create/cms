import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import { createAuthenticatedHandler, requireAdmin } from '@/lib/middleware/auth';
import User from '@/lib/models/User';

// GET /api/region-assignments - Get all region assignments
async function getRegionAssignments(request: NextRequest, user: any) {
  try {
    await connectMongo();
    
    // Get all sales executives with their regions
    const salesExecutives = await User.find({
      role: 'sales-executive',
      isActive: true,
      isApproved: true
    }).select('_id name email region').lean();

    // Group executives by region
    const regionAssignments: { [key: string]: any[] } = {};
    
    salesExecutives.forEach(executive => {
      const region = executive.region || 'Unassigned';
      if (!regionAssignments[region]) {
        regionAssignments[region] = [];
      }
      regionAssignments[region].push({
        _id: executive._id.toString(),
        name: executive.name,
        email: executive.email,
        region: executive.region
      });
    });

    // Convert to array format
    const assignments = Object.entries(regionAssignments).map(([region, executives]) => ({
      region,
      executives,
      count: executives.length
    }));

    return NextResponse.json({
      success: true,
      data: assignments
    });

  } catch (error) {
    console.error('❌ Error fetching region assignments:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch region assignments',
      details: error.message
    }, { status: 500 });
  }
}

export const GET = createAuthenticatedHandler(getRegionAssignments, requireAdmin);
