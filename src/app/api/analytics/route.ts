import { NextRequest, NextResponse } from 'next/server';
import { analyticsService } from '@/lib/analytics';
import { validateRequest, analyticsQuerySchema } from '@/lib/validation';
import { authRateLimit, createRateLimitMiddleware } from '@/lib/rate-limit';

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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const query = {
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      teamIds: searchParams.get('teamIds')?.split(',').filter(Boolean),
      projectIds: searchParams.get('projectIds')?.split(',').filter(Boolean),
      userIds: searchParams.get('userIds')?.split(',').filter(Boolean),
      metrics: searchParams.get('metrics')?.split(',').filter(Boolean) as any[],
      groupBy: searchParams.get('groupBy') as any || undefined,
      format: searchParams.get('format') as any || 'json'
    };

    // Validate query parameters
    const validation = validateRequest(analyticsQuerySchema, query);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Get analytics data
    const dashboard = await analyticsService.getDashboard(validation.data);

    // Return response with rate limit headers
    return NextResponse.json({
      success: true,
      data: dashboard,
      meta: {
        generatedAt: new Date().toISOString(),
        filters: validation.data
      }
    }, {
      headers: rateLimitResult.headers
    });

  } catch (error: any) {
    console.error('Analytics API error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch analytics data',
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

    const body = await request.json();

    // Validate request body
    const validation = validateRequest(analyticsQuerySchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Get analytics data with custom filters
    const dashboard = await analyticsService.getDashboard(validation.data);

    return NextResponse.json({
      success: true,
      data: dashboard,
      meta: {
        generatedAt: new Date().toISOString(),
        filters: validation.data
      }
    }, {
      headers: rateLimitResult.headers
    });

  } catch (error: any) {
    console.error('Analytics POST API error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to generate analytics report',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}