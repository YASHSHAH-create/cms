import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import { createAuthenticatedHandler, requireAdminOrExecutive } from '@/lib/middleware/auth';
import Faq from '@/lib/models/Faq';

// GET /api/faqs - Get all FAQs
async function getFaqs(request: NextRequest, user: any) {
  try {
    await connectMongo();
    
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || '';
    const search = searchParams.get('search') || '';

    let filter = {};
    
    if (category) {
      filter = { category: new RegExp(category, 'i') };
    }
    
    if (search) {
      const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter = {
        ...filter,
        $or: [
          { question: searchRegex },
          { answer: searchRegex },
          { category: searchRegex }
        ]
      };
    }

    const faqs = await Faq.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      faqs: faqs.map(faq => ({
        _id: faq._id.toString(),
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        createdAt: faq.createdAt,
        updatedAt: faq.updatedAt
      }))
    });

  } catch (error) {
    console.error('FAQs fetch error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to fetch FAQs' 
    }, { status: 500 });
  }
}

// POST /api/faqs - Create new FAQ
async function createFaq(request: NextRequest, user: any) {
  try {
    await connectMongo();
    
    const { question, answer, category } = await request.json();

    if (!question || !answer) {
      return NextResponse.json({ 
        success: false, 
        message: 'Question and answer are required' 
      }, { status: 400 });
    }

    const faq = new Faq({
      question: question.trim(),
      answer: answer.trim(),
      category: category?.trim() || ''
    });

    await faq.save();

    return NextResponse.json({
      success: true,
      faq: {
        _id: faq._id.toString(),
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        createdAt: faq.createdAt,
        updatedAt: faq.updatedAt
      }
    }, { status: 201 });

  } catch (error) {
    console.error('FAQ creation error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to create FAQ' 
    }, { status: 500 });
  }
}

export const GET = createAuthenticatedHandler(getFaqs, requireAdminOrExecutive);
export const POST = createAuthenticatedHandler(createFaq, requireAdminOrExecutive);
