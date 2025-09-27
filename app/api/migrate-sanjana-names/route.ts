import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import User from '@/lib/models/User';
import Visitor from '@/lib/models/Visitor';
import Enquiry from '@/lib/models/Enquiry';
import { corsHeaders } from '@/lib/cors';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 POST /api/migrate-sanjana-names - Standardizing Sanjana names');
    
    await connectMongo();
    console.log('✅ Connected to MongoDB');

    let migrationResults = {
      usersUpdated: 0,
      visitorsUpdated: 0,
      enquiriesUpdated: 0,
      details: [] as any[]
    };

    // Update User collection - standardize Sanjana name
    const userUpdates = await User.updateMany(
      { 
        $or: [
          { username: 'sanjana' },
          { name: { $in: ['Sanjana', 'Customer Executive'] } }
        ]
      },
      { 
        $set: { 
          name: 'Sanjana Pawar',
          lastModifiedAt: new Date()
        } 
      }
    );
    
    migrationResults.usersUpdated = userUpdates.modifiedCount;
    console.log(`✅ Updated ${userUpdates.modifiedCount} users`);

    // Update Visitor collection - standardize agent names
    const visitorUpdates = await Visitor.updateMany(
      { 
        $or: [
          { agentName: 'Sanjana' },
          { agentName: 'Customer Executive' },
          { salesExecutiveName: 'Sanjana' },
          { salesExecutiveName: 'Customer Executive' }
        ]
      },
      [
        {
          $set: {
            agentName: {
              $cond: {
                if: { $in: ['$agentName', ['Sanjana', 'Customer Executive']] },
                then: 'Sanjana Pawar',
                else: '$agentName'
              }
            },
            salesExecutiveName: {
              $cond: {
                if: { $in: ['$salesExecutiveName', ['Sanjana', 'Customer Executive']] },
                then: 'Sanjana Pawar',
                else: '$salesExecutiveName'
              }
            },
            lastModifiedAt: new Date()
          }
        }
      ]
    );
    
    migrationResults.visitorsUpdated = visitorUpdates.modifiedCount;
    console.log(`✅ Updated ${visitorUpdates.modifiedCount} visitors`);

    // Update Enquiry collection - standardize agent names
    const enquiryUpdates = await Enquiry.updateMany(
      { 
        $or: [
          { agentName: 'Sanjana' },
          { agentName: 'Customer Executive' }
        ]
      },
      { 
        $set: { 
          agentName: 'Sanjana Pawar',
          lastModifiedAt: new Date()
        } 
      }
    );
    
    migrationResults.enquiriesUpdated = enquiryUpdates.modifiedCount;
    console.log(`✅ Updated ${enquiryUpdates.modifiedCount} enquiries`);

    // Get details of what was updated
    const updatedUsers = await User.find({ name: 'Sanjana Pawar' }).select('username name role').lean();
    const updatedVisitors = await Visitor.find({ 
      $or: [
        { agentName: 'Sanjana Pawar' },
        { salesExecutiveName: 'Sanjana Pawar' }
      ]
    }).select('name agentName salesExecutiveName').limit(10).lean();
    const updatedEnquiries = await Enquiry.find({ agentName: 'Sanjana Pawar' })
      .select('visitorName agentName').limit(10).lean();

    migrationResults.details = [
      { collection: 'Users', count: updatedUsers.length, samples: updatedUsers },
      { collection: 'Visitors', count: updatedVisitors.length, samples: updatedVisitors },
      { collection: 'Enquiries', count: updatedEnquiries.length, samples: updatedEnquiries }
    ];

    console.log(`✅ Migration completed: ${migrationResults.usersUpdated} users, ${migrationResults.visitorsUpdated} visitors, ${migrationResults.enquiriesUpdated} enquiries`);

    const response = NextResponse.json({
      success: true,
      message: 'Sanjana name standardization completed',
      results: migrationResults
    });
    
    // Add CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;

  } catch (error) {
    console.error('❌ Sanjana name migration error:', error);
    
    const response = NextResponse.json({
      success: false,
      message: 'Failed to standardize Sanjana names',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
    
    // Add CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔄 GET /api/migrate-sanjana-names - Checking Sanjana name consistency');
    
    await connectMongo();
    console.log('✅ Connected to MongoDB');

    // Check for inconsistent Sanjana names
    const inconsistentUsers = await User.find({
      $or: [
        { name: 'Sanjana' },
        { name: 'Customer Executive' },
        { username: 'sanjana', name: { $ne: 'Sanjana Pawar' } }
      ]
    }).select('username name role').lean();

    const inconsistentVisitors = await Visitor.find({
      $or: [
        { agentName: { $in: ['Sanjana', 'Customer Executive'] } },
        { salesExecutiveName: { $in: ['Sanjana', 'Customer Executive'] } }
      ]
    }).select('name agentName salesExecutiveName').limit(10).lean();

    const inconsistentEnquiries = await Enquiry.find({
      agentName: { $in: ['Sanjana', 'Customer Executive'] }
    }).select('visitorName agentName').limit(10).lean();

    const response = NextResponse.json({
      success: true,
      message: 'Sanjana name consistency check completed',
      inconsistentUsers: inconsistentUsers.length,
      inconsistentVisitors: inconsistentVisitors.length,
      inconsistentEnquiries: inconsistentEnquiries.length,
      totalInconsistent: inconsistentUsers.length + inconsistentVisitors.length + inconsistentEnquiries.length,
      details: {
        users: inconsistentUsers,
        visitors: inconsistentVisitors,
        enquiries: inconsistentEnquiries
      }
    });
    
    // Add CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;

  } catch (error) {
    console.error('❌ Sanjana name consistency check error:', error);
    
    const response = NextResponse.json({
      success: false,
      message: 'Failed to check Sanjana name consistency',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
    
    // Add CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    return response;
  }
}
