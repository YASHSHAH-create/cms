import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Test the visitors API internally
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.NETLIFY_URL 
      ? `https://${process.env.NETLIFY_URL}` 
      : 'http://localhost:3000';
    
    const visitorsUrl = `${baseUrl}/api/visitors?limit=5`;
    
    console.log('🔍 Testing visitors API:', visitorsUrl);
    
    const response = await fetch(visitorsUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      return NextResponse.json({
        success: false,
        message: `Visitors API failed: ${response.status} ${response.statusText}`,
        url: visitorsUrl
      }, { status: 500 });
    }
    
    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      message: 'Visitors API is working',
      data: {
        total: data.total,
        items: data.items?.length || 0,
        firstVisitor: data.items?.[0]?.name || 'No visitors'
      }
    });
    
  } catch (error: any) {
    console.error('❌ Test visitors API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Test failed',
      error: error.message
    }, { status: 500 });
  }
}
