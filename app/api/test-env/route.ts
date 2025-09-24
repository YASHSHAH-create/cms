import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    mongodb_uri_exists: !!process.env.MONGODB_URI,
    jwt_secret_exists: !!process.env.JWT_SECRET,
    node_env: process.env.NODE_ENV,
    all_env_keys: Object.keys(process.env).filter(key => key.includes('MONGODB') || key.includes('JWT')),
    mongodb_uri_preview: process.env.MONGODB_URI ? process.env.MONGODB_URI.substring(0, 20) + '...' : 'undefined'
  });
}
