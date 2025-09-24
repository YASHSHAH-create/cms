import { NextRequest, NextResponse } from 'next/server';
import { getMainServices } from '@/lib/utils/serviceMapping';

// GET /api/executive-services/services - Get all available services
export async function GET(request: NextRequest) {
  try {
    console.log('🔄 GET /api/executive-services/services - Fetching services');
    
    // Use the main services from service mapping utility
    const services = getMainServices();
    console.log(`📊 Found ${services.length} services`);
    
    return NextResponse.json({ 
      services: services.sort() 
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    });

  } catch (error) {
    console.error('❌ Services API error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch services' 
    }, { status: 500 });
  }
}

// Handle CORS preflight requests
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
