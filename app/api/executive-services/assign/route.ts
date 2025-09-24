import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import { createAuthenticatedHandler, requireAdmin } from '@/lib/middleware/auth';
import ExecutiveService from '@/lib/models/ExecutiveService';

// POST /api/executive-services/assign - Assign services to executive
async function assignServices(request: NextRequest, user: any) {
  try {
    await connectMongo();
    
    const { executiveId, services } = await request.json();
    const assignedBy = user.userId || user.id;

    if (!executiveId || !services) {
      return NextResponse.json({ 
        error: 'executiveId and services are required' 
      }, { status: 400 });
    }

    if (!Array.isArray(services) || services.length === 0) {
      return NextResponse.json({ 
        error: 'services must be a non-empty array' 
      }, { status: 400 });
    }

    console.log('🔍 Assignment request received:', { executiveId, services });
    console.log('🔍 User info:', user);

    // Remove existing assignments for this executive
    await ExecutiveService.deleteMany({ executiveId });

    // Create new assignments
    const assignments = services.map(serviceName => ({
      executiveId,
      serviceName,
      assignedBy,
      isActive: true
    }));

    const createdAssignments = await ExecutiveService.insertMany(assignments);

    console.log(`✅ Assigned ${services.length} services to executive ${executiveId}`);

    return NextResponse.json({
      success: true,
      message: `Successfully assigned ${services.length} services`,
      assignments: createdAssignments.map(assignment => ({
        _id: assignment._id.toString(),
        executiveId: assignment.executiveId.toString(),
        serviceName: assignment.serviceName,
        assignedAt: assignment.assignedAt,
        isActive: assignment.isActive
      }))
    });

  } catch (error) {
    console.error('Error assigning services:', error);
    return NextResponse.json({ 
      error: 'Failed to assign services',
      details: error.message 
    }, { status: 500 });
  }
}

export const POST = createAuthenticatedHandler(assignServices, requireAdmin);
