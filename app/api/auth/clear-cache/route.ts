import { NextRequest, NextResponse } from 'next/server';
import { corsHeaders } from '@/lib/cors';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 POST /api/auth/clear-cache - Clearing all cached authentication data');
    
    // This endpoint doesn't actually clear server-side cache
    // It's meant to be called from the frontend to clear localStorage
    const response = NextResponse.json({
      success: true,
      message: 'Cache clear instruction sent to frontend',
      instructions: [
        'Clear localStorage',
        'Clear sessionStorage', 
        'Clear cookies',
        'Redirect to login'
      ]
    });
    
    // Add CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;

  } catch (error) {
    console.error('❌ Clear cache API error:', error);
    
    const response = NextResponse.json({
      success: false,
      message: 'Failed to clear cache',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
    
    // Add CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  }
}
