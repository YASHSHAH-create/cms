import { NextRequest, NextResponse } from 'next/server';
import { corsHeaders } from '@/lib/cors';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('✅ GET /api/test-enquiries - Testing enquiries API');
    
    // Return mock data for testing
    const mockEnquiries = [
      {
        _id: 'test_1',
        name: 'Test Visitor 1',
        email: 'test1@example.com',
        phone: '+1234567890',
        enquiryDetails: 'Test enquiry details',
        status: 'new',
        createdAt: new Date().toISOString(),
        enquiryType: 'chatbot'
      },
      {
        _id: 'test_2', 
        name: 'Test Visitor 2',
        email: 'test2@example.com',
        phone: '+1234567891',
        enquiryDetails: 'Another test enquiry',
        status: 'in_progress',
        createdAt: new Date().toISOString(),
        enquiryType: 'email'
      }
    ];

    const response = NextResponse.json({
      success: true,
      enquiries: mockEnquiries,
      count: mockEnquiries.length,
      message: 'Test enquiries data'
    });
    
    // Add CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  } catch (error) {
    console.error('❌ Test enquiries API error:', error);
    const response = NextResponse.json({
      success: false,
      message: 'Test enquiries API failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
    
    // Add CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  }
}
