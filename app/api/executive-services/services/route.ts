import { NextRequest, NextResponse } from 'next/server';
import { createAuthenticatedHandler, requireAdminOrExecutive } from '@/lib/middleware/auth';
import { getMainServices } from '@/lib/utils/serviceMapping';

// GET /api/executive-services/services - Get all available services
async function getServices(request: NextRequest, user: any) {
  try {
    // Use the main services from service mapping utility
    const services = getMainServices();
    
    return NextResponse.json({ 
      services: services.sort() 
    });

  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch services' 
    }, { status: 500 });
  }
}

export const GET = createAuthenticatedHandler(getServices, requireAdminOrExecutive);
