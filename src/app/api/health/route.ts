/**
 * Health Check Endpoint
 * 
 * GET /api/health
 * 
 * Returns 200 if all systems operational, 503 if any critical service is down.
 * Used for monitoring, load balancers, and uptime checks.
 */

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  message?: string;
  responseTime?: number;
}

interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: HealthCheck[];
  uptime: number;
}

/**
 * Check Supabase database connectivity
 */
async function checkDatabase(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('app_settings').select('id').limit(1);
    
    if (error) {
      return {
        service: 'database',
        status: 'unhealthy',
        message: `Database error: ${error.message}`,
        responseTime: Date.now() - start,
      };
    }
    
    return {
      service: 'database',
      status: 'healthy',
      responseTime: Date.now() - start,
    };
  } catch (error) {
    return {
      service: 'database',
      status: 'unhealthy',
      message: `Failed to connect: ${error}`,
      responseTime: Date.now() - start,
    };
  }
}

/**
 * Check Supabase Storage connectivity
 */
async function checkStorage(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.storage.from('agent-mary').list('', { limit: 1 });

    if (error) {
      return {
        service: 'storage',
        status: 'unhealthy',
        message: `Storage error: ${error.message}`,
        responseTime: Date.now() - start,
      };
    }
    
    return {
      service: 'storage',
      status: 'healthy',
      responseTime: Date.now() - start,
    };
  } catch (error) {
    return {
      service: 'storage',
      status: 'unhealthy',
      message: `Storage check failed: ${error}`,
      responseTime: Date.now() - start,
    };
  }
}

/**
 * Check environment variables
 */
function checkEnvironment(): HealthCheck {
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'GEMINI_API_KEY',
  ];
  
  const missing = requiredVars.filter(v => !process.env[v]);
  
  if (missing.length > 0) {
    return {
      service: 'environment',
      status: 'unhealthy',
      message: `Missing env vars: ${missing.join(', ')}`,
    };
  }
  
  return {
    service: 'environment',
    status: 'healthy',
  };
}

/**
 * Check Gemini API connectivity (lightweight)
 */
async function checkGemini(): Promise<HealthCheck> {
  const start = Date.now();
  try {
    if (!process.env.GEMINI_API_KEY) {
      return {
        service: 'gemini',
        status: 'unhealthy',
        message: 'API key not configured',
      };
    }
    
    // Lightweight check - just verify API key and endpoint
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5 second timeout
      }
    );
    
    if (!response.ok) {
      return {
        service: 'gemini',
        status: 'degraded',
        message: `API returned ${response.status}`,
        responseTime: Date.now() - start,
      };
    }
    
    return {
      service: 'gemini',
      status: 'healthy',
      responseTime: Date.now() - start,
    };
  } catch (error) {
    return {
      service: 'gemini',
      status: 'degraded',
      message: `Check failed: ${error}`,
      responseTime: Date.now() - start,
    };
  }
}

export async function GET() {
  const startTime = Date.now();
  
  // Run all checks in parallel
  const [database, storage, environment, gemini] = await Promise.all([
    checkDatabase(),
    checkStorage(),
    checkEnvironment(),
    checkGemini(),
  ]);

  const checks = [database, storage, environment, gemini];
  
  // Determine overall status
  const hasUnhealthy = checks.some(c => c.status === 'unhealthy');
  const hasDegraded = checks.some(c => c.status === 'degraded');
  
  let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
  if (hasUnhealthy) {
    overallStatus = 'unhealthy';
  } else if (hasDegraded) {
    overallStatus = 'degraded';
  } else {
    overallStatus = 'healthy';
  }
  
  const response: HealthResponse = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    checks,
    uptime: process.uptime(),
  };
  
  // Return appropriate status code
  const statusCode = overallStatus === 'healthy' ? 200 : overallStatus === 'degraded' ? 200 : 503;
  
  return NextResponse.json(response, { status: statusCode });
}
