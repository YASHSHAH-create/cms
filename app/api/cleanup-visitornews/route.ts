import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import mongoose from 'mongoose';

export async function DELETE(request: NextRequest) {
  try {
    console.log('🔄 DELETE /api/cleanup-visitornews - Deleting visitornews collection');
    
    await connectMongo();
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Get count before deletion
    const visitornewsCount = await db.collection('visitornews').countDocuments();
    console.log(`📊 Found ${visitornewsCount} records in visitornews collection`);

    if (visitornewsCount === 0) {
      return NextResponse.json({
        success: true,
        message: 'visitornews collection is already empty',
        deletedCount: 0
      });
    }

    // Drop the visitornews collection
    await db.collection('visitornews').drop();
    console.log('✅ visitornews collection dropped successfully');

    return NextResponse.json({
      success: true,
      message: 'visitornews collection deleted successfully',
      deletedCount: visitornewsCount
    });

  } catch (error) {
    console.error('❌ Cleanup error:', error);
    return NextResponse.json({
      success: false,
      message: 'Cleanup failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint to check if visitornews collection exists
export async function GET(request: NextRequest) {
  try {
    console.log('🔄 GET /api/cleanup-visitornews - Checking visitornews collection status');
    
    await connectMongo();
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Check if visitornews collection exists
    const collections = await db.listCollections().toArray();
    const visitornewsExists = collections.some(col => col.name === 'visitornews');
    
    let count = 0;
    if (visitornewsExists) {
      count = await db.collection('visitornews').countDocuments();
    }

    return NextResponse.json({
      success: true,
      message: 'visitornews collection status check',
      data: {
        exists: visitornewsExists,
        count: count,
        canDelete: visitornewsExists && count > 0
      }
    });

  } catch (error) {
    console.error('❌ Status check error:', error);
    return NextResponse.json({
      success: false,
      message: 'Status check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
