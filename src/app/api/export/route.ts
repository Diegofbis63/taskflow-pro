import { NextRequest, NextResponse } from 'next/server';
import { exportService } from '@/lib/export-service';
import { validateRequest, exportRequestSchema } from '@/lib/validation';
import { authRateLimit, createRateLimitMiddleware } from '@/lib/rate-limit';
import { verifyToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await createRateLimitMiddleware(authRateLimit)(request);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: rateLimitResult.error },
        { 
          status: 429,
          headers: rateLimitResult.headers
        }
      );
    }

    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    // Get user's export requests
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    
    const exports = await exportService.getUserExports(payload.userId, limit);

    return NextResponse.json({
      success: true,
      data: exports,
      meta: {
        count: exports.length,
        userId: payload.userId
      }
    }, {
      headers: rateLimitResult.headers
    });

  } catch (error: any) {
    console.error('Export GET API error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch exports',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await createRateLimitMiddleware(authRateLimit)(request);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: rateLimitResult.error },
        { 
          status: 429,
          headers: rateLimitResult.headers
        }
      );
    }

    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);
    
    if (!payload) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate request body
    const validation = validateRequest(exportRequestSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Generate export
    const exportRequest = await exportService.generateExport({
      ...validation.data,
      requestedBy: payload.userId
    });

    return NextResponse.json({
      success: true,
      data: exportRequest,
      message: 'Export request created successfully'
    }, {
      status: 201,
      headers: rateLimitResult.headers
    });

  } catch (error: any) {
    console.error('Export POST API error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create export',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}