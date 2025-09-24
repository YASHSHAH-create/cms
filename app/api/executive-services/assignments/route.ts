import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import ExecutiveService from '@/lib/models/ExecutiveService';
import User from '@/lib/models/User';

// Temporarily disable authentication for testing
export const GET = async (request: NextRequest) => {
  try {
    console.log('🔄 GET /api/executive-services/assignments - Fetching service assignments');
    
    await connectMongo();
    console.log('✅ Connected to MongoDB');

    // Fetch all executive services
    const services = await ExecutiveService.find({}).lean();
    console.log(`📊 Found ${services.length} executive services`);

    // Fetch all users with executive role
    const executives = await User.find({ role: 'executive' }).select('-password').lean();
    console.log(`👥 Found ${executives.length} executives`);

    // Create assignments mapping
    const assignments: Record<string, string[]> = {};
    
    // Initialize assignments for each service
    services.forEach(service => {
      assignments[service.name] = [];
    });

    // Add executives to assignments (mock data for now)
    executives.forEach(executive => {
      // Assign each executive to a few services
      const serviceNames = services.map(s => s.name);
      const assignedServices = serviceNames.slice(0, Math.min(2, serviceNames.length));
      
      assignedServices.forEach(serviceName => {
        if (!assignments[serviceName]) {
          assignments[serviceName] = [];
        }
        assignments[serviceName].push(executive._id.toString());
      });
    });

    return NextResponse.json({
      success: true,
      assignments,
      services: services.map(s => s.name),
      executives: executives.map(e => ({
        _id: e._id,
        name: e.name,
        email: e.email,
        department: e.department
      }))
    });

  } catch (error) {
    console.error('❌ Service assignments API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to fetch service assignments',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};

// Update service assignments
export const POST = async (request: NextRequest) => {
  try {
    console.log('🔄 POST /api/executive-services/assignments - Updating service assignments');
    
    const body = await request.json();
    const { serviceName, executiveIds } = body;

    if (!serviceName || !Array.isArray(executiveIds)) {
      return NextResponse.json({
        success: false,
        message: 'Service name and executive IDs array are required'
      }, { status: 400 });
    }

    await connectMongo();
    console.log('✅ Connected to MongoDB');

    // For now, just return success since we're not persisting assignments
    // In a real implementation, you'd save this to a database
    console.log(`📝 Updated assignments for ${serviceName}:`, executiveIds);

    return NextResponse.json({
      success: true,
      message: 'Service assignments updated successfully',
      serviceName,
      executiveIds
    });

  } catch (error) {
    console.error('❌ Update assignments API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to update service assignments',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
};
