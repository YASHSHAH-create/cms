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

// GET /api/visitors - Get visitors (with authentication)
export async function GET(request: NextRequest) {
  try {
    console.log('🔄 GET /api/visitors - Fetching visitors list');
    
    await connectMongo();
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const q = searchParams.get('q') || '';
    
    const n = Math.min(Math.max(limit, 1), 200);
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
          { region: rx },
          { service: rx },
          { subservice: rx },
          { agentName: rx },
          { salesExecutiveName: rx },
          { status: rx },
          { enquiryDetails: rx },
          { comments: rx },
          { source: rx }
        ] 
      };
      console.log('🔍 Search filter applied:', filter);
    }
    
    console.log('📊 Fetching visitors with filter:', filter);
    const [items, total] = await Promise.all([
      Visitor.find(filter).sort({ createdAt: -1 }).skip((p - 1) * n).limit(n).lean(),
      Visitor.countDocuments(filter)
    ]);
    
    console.log(`✅ Found ${items.length} visitors (page ${p}/${Math.ceil(total / n)})`);
    console.log(`📊 Total visitors in database: ${total}`);
    
    return NextResponse.json({ total, page: p, pageSize: n, items });

  } catch (error: any) {
    console.error('❌ Visitors list error:', error);
    return NextResponse.json({ ok: false, message: 'Failed to list visitors' }, { status: 500 });
  }
}
