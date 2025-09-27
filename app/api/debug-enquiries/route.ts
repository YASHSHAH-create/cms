import { NextRequest, NextResponse } from 'next/server';
import MemoryStorage from '@/lib/memoryStorage';

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 GET /api/debug-enquiries - Debugging enquiries data');
    
    const memoryStorage = MemoryStorage.getInstance();
    const { enquiries, count } = memoryStorage.getEnquiries({}, 1, 100);
    
    console.log('📊 Memory storage enquiries:', enquiries);
    console.log('📊 Memory storage count:', count);
    
    return NextResponse.json({
      success: true,
      message: 'Debug data retrieved',
      data: {
        enquiries: enquiries,
        count: count,
        rawData: enquiries.map(enquiry => ({
          id: enquiry._id,
          name: enquiry.name,
          email: enquiry.email,
          phone: enquiry.phone,
          enquiryDetails: enquiry.enquiryDetails,
          source: enquiry.source,
          status: enquiry.status,
          createdAt: enquiry.createdAt
        }))
      }
    });
  } catch (error) {
    console.error('❌ Debug enquiries error:', error);
    return NextResponse.json({
      success: false,
      message: 'Debug failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 POST /api/debug-enquiries - Adding test enquiry');
    
    const body = await request.json();
    const { visitorName, phoneNumber, email, enquiryType, enquiryDetails } = body;
    
    const memoryStorage = MemoryStorage.getInstance();
    
    const enquiryData = {
      name: visitorName,
      phone: phoneNumber?.trim() || '',
      email: email?.trim() || '',
      enquiryDetails: enquiryDetails,
      source: enquiryType || 'chatbot',
      status: 'enquiry_required',
      service: 'General Inquiry',
      subservice: '',
      organization: '',
      region: '',
      agentName: '',
      salesExecutiveName: '',
      comments: '',
      amount: 0,
      isConverted: false,
      priority: 'medium',
      lastModifiedBy: 'admin',
      lastModifiedAt: new Date()
    };
    
    const savedEnquiry = memoryStorage.addEnquiry(enquiryData);
    console.log('✅ Test enquiry added to memory storage:', savedEnquiry);
    
    return NextResponse.json({
      success: true,
      message: 'Test enquiry added successfully',
      enquiry: savedEnquiry
    });
  } catch (error) {
    console.error('❌ Debug add enquiry error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to add test enquiry',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
