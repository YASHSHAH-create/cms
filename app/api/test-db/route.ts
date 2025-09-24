import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 GET /api/test-db - Testing database connection');
    
    // Test MongoDB connection with timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database connection timeout')), 15000);
    });
    
    const dbPromise = async () => {
      await connectMongo();
      return { connected: true, timestamp: new Date().toISOString() };
    };
    
    const result = await Promise.race([dbPromise(), timeoutPromise]);
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      ...result
    });

  } catch (error: any) {
    console.error('❌ Database test error:', error);
    return NextResponse.json({
      success: false,
      message: 'Database connection failed',
      error: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
