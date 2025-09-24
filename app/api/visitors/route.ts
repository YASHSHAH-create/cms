import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import Visitor from '@/lib/models/Visitor';

// POST /api/visitors - Create visitor
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 POST /api/visitors - Creating/updating visitor');
    
    await connectMongo();

    const {
      name = '',
      email = '',
      phone = '',
      organization = '',
      service = '',
      subservice = '',
      source = 'chatbot',
      location = '',
      meta = {}
    } = await request.json();

    const payload = {
      name,
      email: email ? String(email).toLowerCase() : '',
      phone,
      organization,
      service,
      subservice,
      source,
      location,
      meta: (meta && typeof meta === 'object') ? meta : {},
      lastInteractionAt: new Date(),
      isConverted: false,
      status: 'enquiry_required',
      leadScore: 0,
      priority: 'medium',
      pipelineHistory: []
    };

    let doc, created = false;

    if (payload.email) {
      console.log(`🔍 Searching for existing visitor by email: ${payload.email}`);
      doc = await Visitor.findOneAndUpdate(
        { email: payload.email },
        { $set: payload },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
      created = doc.createdAt && Math.abs(Date.now() - doc.createdAt.getTime()) < 5000;
      console.log(`✅ Visitor ${created ? 'created' : 'updated'} by email: ${doc._id}`);
    } else if (payload.phone) {
      console.log(`🔍 Searching for existing visitor by phone: ${payload.phone}`);
      doc = await Visitor.findOneAndUpdate(
        { phone: payload.phone },
        { $set: payload },
        { new: true, upsert: true, setDefaultsOnInsert: true }
      );
      created = doc.createdAt && Math.abs(Date.now() - doc.createdAt.getTime()) < 5000;
      console.log(`✅ Visitor ${created ? 'created' : 'updated'} by phone: ${doc._id}`);
    } else {
      console.log('🆕 Creating new visitor (no email or phone provided)');
      doc = await Visitor.create(payload);
      created = true;
      console.log(`✅ New visitor created: ${doc._id}`);
    }

    // Verify the document was saved
    const savedDoc = await Visitor.findById(doc._id);
    if (!savedDoc) {
      console.error('❌ CRITICAL: Visitor was not saved to MongoDB!');
      return NextResponse.json({ ok: false, message: 'Failed to save visitor to database' }, { status: 500 });
    }
    console.log('✅ Verified visitor saved to MongoDB:', savedDoc._id);

    // Get total count for verification
    const totalVisitors = await Visitor.countDocuments();
    console.log(`📊 Total visitors in database: ${totalVisitors}`);

    return NextResponse.json({ 
      ok: true, 
      visitorId: String(doc._id), 
      created,
      totalVisitors 
    }, { status: created ? 201 : 200 });

  } catch (error: any) {
    console.error('❌ Visitor upsert error:', error);
    const message = error.name === 'ValidationError' ? error.message : 'Failed to save visitor';
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}

// GET /api/visitors - Get visitors (optimized for serverless)
export async function GET(request: NextRequest) {
  try {
    console.log('🔄 GET /api/visitors - Fetching visitors list');
    
    // Set timeout for the entire operation
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 25000); // 25 second timeout
    });
    
    const operationPromise = async () => {
      await connectMongo();
      
      const { searchParams } = new URL(request.url);
      const page = parseInt(searchParams.get('page') || '1');
      const limit = parseInt(searchParams.get('limit') || '10'); // Reduced default limit
      const q = searchParams.get('q') || '';
      
      const n = Math.min(Math.max(limit, 1), 50); // Reduced max limit
      const p = Math.max(page, 1);
      let filter = {};
      
      if (q) {
        const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
        filter = { 
          $or: [
            { name: rx }, 
            { email: rx }, 
            { phone: rx }, 
            { organization: rx },
            { service: rx },
            { status: rx }
          ] 
        };
        console.log('🔍 Search filter applied:', filter);
      }
      
      console.log('📊 Fetching visitors with filter:', filter);
      
      // Optimize query with projection and limit
      const items = await Visitor.find(filter)
        .select('name email phone organization service status createdAt agentName')
        .sort({ createdAt: -1 })
        .skip((p - 1) * n)
        .limit(n)
        .lean()
        .maxTimeMS(10000); // 10 second query timeout
      
      // Get total count with timeout
      const total = await Visitor.countDocuments(filter).maxTimeMS(5000);
      
      console.log(`✅ Found ${items.length} visitors (page ${p}/${Math.ceil(total / n)})`);
      console.log(`📊 Total visitors in database: ${total}`);
      
      return { total, page: p, pageSize: n, items };
    };
    
    const result = await Promise.race([operationPromise(), timeoutPromise]);
    return NextResponse.json(result);

  } catch (error: any) {
    console.error('❌ Visitors list error:', error);
    
    // Return empty result instead of error for better UX
    return NextResponse.json({ 
      total: 0, 
      page: 1, 
      pageSize: 10, 
      items: [],
      error: 'Database connection timeout. Please try again.' 
    });
  }
}
