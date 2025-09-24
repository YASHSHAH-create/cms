import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import { createAuthenticatedHandler, requireAdmin } from '@/lib/middleware/auth';
import User from '@/lib/models/User';

// GET /api/region-assignments/[region] - Get sales executives for specific region
async function getSalesExecutivesByRegion(
  request: NextRequest,
  user: any,
  { params }: { params: { region: string } }
) {
  try {
    await connectMongo();
    
    const { region } = params;
    
    // Get sales executives for the specific region
    const executives = await User.find({
      role: 'sales-executive',
      region: region,
      isActive: true,
      isApproved: true
    }).select('_id name email region').lean();

    return NextResponse.json({
      success: true,
      data: executives.map(executive => ({
        _id: executive._id.toString(),
        name: executive.name,
        email: executive.email,
        region: executive.region
      }))
    });

  } catch (error) {
    console.error('❌ Error fetching executives for region:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch executives for region',
      details: error.message
    }, { status: 500 });
  }
}

export const GET = createAuthenticatedHandler(getSalesExecutivesByRegion, requireAdmin);
