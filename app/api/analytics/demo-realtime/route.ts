import { NextRequest, NextResponse } from 'next/server';
import { realtimeAnalytics } from '@/lib/utils/realtimeAnalytics';

// Demo endpoint to simulate real-time updates
export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json();
    
    console.log(`🎯 Demo Real-time Update: ${action}`);
    
    switch (action) {
      case 'visitor_added':
        await realtimeAnalytics.onVisitorAdded(data);
        break;
      case 'enquiry_added':
        await realtimeAnalytics.onEnquiryAdded(data);
        break;
      case 'message_added':
        await realtimeAnalytics.onMessageAdded(data);
        break;
      case 'conversion_updated':
        await realtimeAnalytics.onConversionUpdated(data);
        break;
      default:
        await realtimeAnalytics.forceUpdate();
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Real-time update triggered: ${action}`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Demo real-time update error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to trigger real-time update' 
    }, { status: 500 });
  }
}
