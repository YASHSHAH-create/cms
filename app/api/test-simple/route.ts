import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 GET /api/test-simple - Testing basic API');
    
    return NextResponse.json({
      success: true,
      message: 'Simple API is working',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV
    });

  } catch (error: any) {
    console.error('❌ Simple API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Simple API failed',
      error: error.message
    }, { status: 500 });
  }
}
