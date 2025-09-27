import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import Visitor from '@/lib/models/Visitor';
import Enquiry from '@/lib/models/Enquiry';
import mongoose from 'mongoose';

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 POST /api/migrate-visitornews - Starting migration from visitornews to visitors/enquiries');
    
    await connectMongo();
    console.log('✅ Connected to MongoDB');

    // Get the visitornews collection directly
    const db = mongoose.connection.db;
    const visitornewsCollection = db.collection('visitornews');
    
    // Get all data from visitornews
    const visitornewsData = await visitornewsCollection.find({}).toArray();
    console.log(`📊 Found ${visitornewsData.length} records in visitornews collection`);

    if (visitornewsData.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No data found in visitornews collection',
        migrated: 0,
        skipped: 0,
        errors: 0
      });
    }

    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const record of visitornewsData) {
      try {
        console.log(`🔄 Processing record: ${record._id} - ${record.name}`);
        
        // Check if visitor already exists (by phone or email)
        let existingVisitor = null;
        if (record.phone) {
          existingVisitor = await Visitor.findOne({ phone: record.phone });
        }
        if (!existingVisitor && record.email) {
          existingVisitor = await Visitor.findOne({ email: record.email });
        }

        let visitor;
        if (existingVisitor) {
          // Update existing visitor
          console.log(`📝 Updating existing visitor: ${existingVisitor._id}`);
          existingVisitor.name = record.name || existingVisitor.name;
          existingVisitor.email = record.email || existingVisitor.email;
          existingVisitor.phone = record.phone || existingVisitor.phone;
          existingVisitor.organization = record.organization || existingVisitor.organization;
          existingVisitor.service = record.service || existingVisitor.service;
          existingVisitor.subservice = record.subservice || existingVisitor.subservice;
          existingVisitor.source = record.source || existingVisitor.source;
          existingVisitor.status = record.status || existingVisitor.status;
          existingVisitor.isConverted = record.isConverted || existingVisitor.isConverted;
          existingVisitor.lastInteractionAt = record.lastInteractionAt || new Date();
          existingVisitor.leadScore = record.leadScore || 0;
          existingVisitor.priority = record.priority || 'medium';
          existingVisitor.agentName = record.agentName || existingVisitor.agentName;
          existingVisitor.salesExecutiveName = record.salesExecutiveName || existingVisitor.salesExecutiveName;
          existingVisitor.comments = record.comments || existingVisitor.comments;
          existingVisitor.amount = record.amount || existingVisitor.amount;
          
          await existingVisitor.save();
          visitor = existingVisitor;
          console.log(`✅ Updated existing visitor: ${visitor._id}`);
        } else {
          // Create new visitor
          const visitorData = {
            name: record.name || '',
            email: record.email || '',
            phone: record.phone || '',
            organization: record.organization || '',
            service: record.service || 'General Inquiry',
            subservice: record.subservice || '',
            source: record.source || 'chatbot',
            location: record.location || '',
            meta: record.meta || {},
            lastInteractionAt: record.lastInteractionAt || record.createdAt || new Date(),
            isConverted: record.isConverted || false,
            status: record.status || 'enquiry_required',
            leadScore: record.leadScore || 0,
            priority: record.priority || 'medium',
            agentName: record.agentName || '',
            salesExecutiveName: record.salesExecutiveName || '',
            comments: record.comments || '',
            amount: record.amount || 0,
            pipelineHistory: record.pipelineHistory || []
          };
          
          visitor = new Visitor(visitorData);
          await visitor.save();
          console.log(`✅ Created new visitor: ${visitor._id}`);
        }

        // Create enquiry record if enquiryDetails exists
        if (record.enquiryDetails && record.enquiryDetails.trim()) {
          // Check if enquiry already exists for this visitor
          const existingEnquiry = await Enquiry.findOne({ 
            visitorId: visitor._id,
            enquiryDetails: record.enquiryDetails 
          });

          if (!existingEnquiry) {
            const enquiryData = {
              visitorId: visitor._id,
              visitorName: record.name || '',
              phoneNumber: record.phone || '',
              email: record.email || '',
              enquiryType: record.source || 'chatbot',
              enquiryDetails: record.enquiryDetails,
              status: record.status === 'enquiry_required' ? 'new' : (record.status || 'new'),
              priority: record.priority || 'medium',
              assignedAgent: record.assignedAgent || null,
              organization: record.organization || '',
              location: record.location || '',
              comments: record.comments || '',
              amount: record.amount || 0
            };

            const enquiry = new Enquiry(enquiryData);
            await enquiry.save();
            console.log(`✅ Created enquiry: ${enquiry._id} for visitor: ${visitor._id}`);
          } else {
            console.log(`⚠️ Enquiry already exists for visitor: ${visitor._id}`);
          }
        }

        migratedCount++;
        console.log(`✅ Successfully migrated record: ${record._id}`);

      } catch (error) {
        errorCount++;
        const errorMsg = `Error processing record ${record._id}: ${error instanceof Error ? error.message : 'Unknown error'}`;
        console.error(`❌ ${errorMsg}`);
        errors.push(errorMsg);
      }
    }

    // Get final counts
    const finalVisitorCount = await Visitor.countDocuments();
    const finalEnquiryCount = await Enquiry.countDocuments();

    console.log('📊 Migration completed:', {
      totalRecords: visitornewsData.length,
      migrated: migratedCount,
      skipped: skippedCount,
      errors: errorCount,
      finalVisitors: finalVisitorCount,
      finalEnquiries: finalEnquiryCount
    });

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
      stats: {
        totalRecords: visitornewsData.length,
        migrated: migratedCount,
        skipped: skippedCount,
        errors: errorCount,
        finalVisitors: finalVisitorCount,
        finalEnquiries: finalEnquiryCount
      },
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('❌ Migration error:', error);
    return NextResponse.json({
      success: false,
      message: 'Migration failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint to check migration status
export async function GET(request: NextRequest) {
  try {
    console.log('🔄 GET /api/migrate-visitornews - Checking migration status');
    
    await connectMongo();
    console.log('✅ Connected to MongoDB');

    // Get counts from all collections
    const db = mongoose.connection.db;
    const visitornewsCount = await db.collection('visitornews').countDocuments();
    const visitorCount = await Visitor.countDocuments();
    const enquiryCount = await Enquiry.countDocuments();

    // Get sample data from each collection
    const visitornewsSample = await db.collection('visitornews').find({}).limit(3).toArray();
    const visitorSample = await Visitor.find({}).limit(3).select('name email phone createdAt').lean();
    const enquirySample = await Enquiry.find({}).limit(3).select('visitorName email phoneNumber enquiryDetails createdAt').lean();

    return NextResponse.json({
      success: true,
      message: 'Migration status check',
      data: {
        collections: {
          visitornews: {
            count: visitornewsCount,
            sample: visitornewsSample.map(r => ({
              _id: r._id,
              name: r.name,
              email: r.email,
              phone: r.phone,
              enquiryDetails: r.enquiryDetails?.substring(0, 50) + '...'
            }))
          },
          visitors: {
            count: visitorCount,
            sample: visitorSample
          },
          enquiries: {
            count: enquiryCount,
            sample: enquirySample
          }
        }
      }
    });

  } catch (error) {
    console.error('❌ Migration status check error:', error);
    return NextResponse.json({
      success: false,
      message: 'Migration status check failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
