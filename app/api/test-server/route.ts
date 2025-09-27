import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 GET /api/test-server - Testing server health');
    
    return NextResponse.json({
      success: true,
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    console.error('❌ Test server error:', error);
    return NextResponse.json({
      success: false,
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 POST /api/test-server - Testing server with data');
    
    const body = await request.json();
    console.log('📝 Request body:', body);
    
    return NextResponse.json({
      success: true,
      message: 'Server processed request successfully',
      receivedData: body,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Test server POST error:', error);
    return NextResponse.json({
      success: false,
      message: 'Server error processing request',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
