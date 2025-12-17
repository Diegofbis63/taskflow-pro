import { NextRequest, NextResponse } from 'next/server';
import { exportService } from '@/lib/export-service';
import { authRateLimit, createRateLimitMiddleware } from '@/lib/rate-limit';
import { verifyToken } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Get export request
    const exportRequest = await exportService.getExport(id);
    
    if (!exportRequest) {
      return NextResponse.json(
        { error: 'Export not found' },
        { status: 404 }
      );
    }

    // Check if user owns this export
    if (exportRequest.requestedBy !== payload.userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if export is ready
    if (exportRequest.status !== 'completed') {
      return NextResponse.json(
        { 
          error: 'Export not ready',
          status: exportRequest.status,
          message: `Export is currently ${exportRequest.status}`
        },
        { status: 400 }
      );
    }

    // Check if export has expired
    if (exportRequest.expiresAt && exportRequest.expiresAt < new Date()) {
      return NextResponse.json(
        { error: 'Export has expired' },
        { status: 410 }
      );
    }

    // For now, return a placeholder response
    // In a real implementation, you would serve the actual file
    return NextResponse.json({
      success: true,
      data: {
        downloadUrl: exportRequest.downloadUrl,
        filename: `export_${exportRequest.id}.${exportRequest.format}`,
        size: 'N/A', // Would be actual file size
        expiresAt: exportRequest.expiresAt
      },
      message: 'Export ready for download'
    }, {
      headers: rateLimitResult.headers
    });

  } catch (error: any) {
    console.error('Export download API error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to download export',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}