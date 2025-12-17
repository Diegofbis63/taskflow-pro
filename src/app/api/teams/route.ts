import { NextRequest, NextResponse } from 'next/server';
import { teamManagementService } from '@/lib/team-management';
import { validateRequest, teamSchema } from '@/lib/validation';
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

    // Get user's teams
    const teams = await teamManagementService.getUserTeams(payload.userId);

    return NextResponse.json({
      success: true,
      data: teams,
      meta: {
        count: teams.length,
        userId: payload.userId
      }
    }, {
      headers: rateLimitResult.headers
    });

  } catch (error: any) {
    console.error('Teams GET API error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch teams',
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
    const validation = validateRequest(teamSchema, body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Create team
    const team = await teamManagementService.createTeam({
      ...validation.data,
      createdBy: payload.userId
    });

    return NextResponse.json({
      success: true,
      data: team,
      message: 'Team created successfully'
    }, {
      status: 201,
      headers: rateLimitResult.headers
    });

  } catch (error: any) {
    console.error('Teams POST API error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to create team',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}