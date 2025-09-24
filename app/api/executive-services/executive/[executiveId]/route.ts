import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import { createAuthenticatedHandler, requireAdminOrExecutive } from '@/lib/middleware/auth';
import ExecutiveService from '@/lib/models/ExecutiveService';

// GET /api/executive-services/executive/[executiveId] - Get services assigned to executive
async function getExecutiveServices(
  request: NextRequest,
  user: any,
  context: { params: { executiveId: string } }
) {
  try {
    await connectMongo();
    
    // Extract executiveId from URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const executiveId = pathParts[pathParts.length - 1];
    
    const assignedServices = await ExecutiveService.find({
      executiveId,
      isActive: true
    }).select('serviceName assignedAt').lean();
    
    return NextResponse.json({ 
      assignedServices: assignedServices.map(service => ({
        _id: service._id.toString(),
        serviceName: service.serviceName,
        assignedAt: service.assignedAt
      }))
    });

  } catch (error) {
    console.error('Error fetching executive services:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch executive services' 
    }, { status: 500 });
  }
}

// Temporarily disable authentication for testing
export const GET = async (request: NextRequest) => {
  try {
    return await getExecutiveServices(request, { userId: 'temp', username: 'admin', name: 'Admin', role: 'admin' }, { params: { executiveId: 'test' } });
  } catch (error) {
    console.error('Executive services API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to load executive services'
    }, { status: 500 });
  }
};
