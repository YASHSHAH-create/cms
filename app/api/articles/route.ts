import { NextRequest, NextResponse } from 'next/server';
import { connectMongo } from '@/lib/mongo';
import { createAuthenticatedHandler, requireAdminOrExecutive } from '@/lib/middleware/auth';
import Article from '@/lib/models/Article';

// GET /api/articles - Get all articles
async function getArticles(request: NextRequest, user: any) {
  try {
    await connectMongo();
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const tag = searchParams.get('tag') || '';

    let filter = {};
    
    if (search) {
      const searchRegex = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter = {
        $or: [
          { title: searchRegex },
          { content: searchRegex },
          { author: searchRegex }
        ]
      };
    }
    
    if (tag) {
      filter = {
        ...filter,
        tags: { $in: [new RegExp(tag, 'i')] }
      };
    }

    const articles = await Article.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      articles: articles.map(article => ({
        _id: article._id.toString(),
        title: article.title,
        content: article.content,
        author: article.author,
        tags: article.tags,
        createdAt: article.createdAt,
        updatedAt: article.updatedAt
      }))
    });

  } catch (error) {
    console.error('Articles fetch error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to fetch articles' 
    }, { status: 500 });
  }
}

// POST /api/articles - Create new article
async function createArticle(request: NextRequest, user: any) {
  try {
    await connectMongo();
    
    const { title, content, author, tags } = await request.json();

    if (!title || !content) {
      return NextResponse.json({ 
        success: false, 
        message: 'Title and content are required' 
      }, { status: 400 });
    }

    const article = new Article({
      title: title.trim(),
      content: content.trim(),
      author: author?.trim() || user.name || 'Unknown',
      tags: Array.isArray(tags) ? tags : []
    });

    await article.save();

    return NextResponse.json({
      success: true,
      article: {
        _id: article._id.toString(),
        title: article.title,
        content: article.content,
        author: article.author,
        tags: article.tags,
        createdAt: article.createdAt,
        updatedAt: article.updatedAt
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Article creation error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to create article' 
    }, { status: 500 });
  }
}

export const GET = createAuthenticatedHandler(getArticles, requireAdminOrExecutive);
export const POST = createAuthenticatedHandler(createArticle, requireAdminOrExecutive);
