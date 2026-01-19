/**
 * Environment Variables Validation
 * 
 * Validates all required environment variables at application startup.
 * Throws an error if any critical variable is missing (fail-fast approach).
 */

interface EnvVars {
  // Supabase (Public - available on client)
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  
  // AI APIs (Server-only)
  OPENAI_API_KEY: string;
  GEMINI_API_KEY: string;
}

interface OptionalEnvVars {
  // Optional for enhanced features
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
  VERCEL_URL?: string;
  NODE_ENV?: string;
}

class EnvironmentError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvironmentError';
  }
}

/**
 * Validates that a required environment variable is present and non-empty
 */
function validateRequired(key: string, value: string | undefined): string {
  if (!value || value.trim() === '') {
    throw new EnvironmentError(
      `Missing required environment variable: ${key}\n` +
      `Please add it to your .env.local file or Vercel environment variables.`
    );
  }
  return value;
}

/**
 * Validates URL format
 */
function validateUrl(key: string, value: string): string {
  try {
    new URL(value);
    return value;
  } catch {
    throw new EnvironmentError(
      `Invalid URL format for ${key}: ${value}\n` +
      `Expected a valid URL starting with http:// or https://`
    );
  }
}

/**
 * Validates API key format (basic check)
 */
function validateApiKey(key: string, value: string, prefix?: string): string {
  if (prefix && !value.startsWith(prefix)) {
    throw new EnvironmentError(
      `Invalid format for ${key}: Expected to start with "${prefix}"`
    );
  }
  if (value.length < 20) {
    throw new EnvironmentError(
      `Invalid ${key}: Key seems too short (expected at least 20 characters)`
    );
  }
  return value;
}

/**
 * Validates all required environment variables
 * Call this at application startup
 */
export function validateEnv(): EnvVars {
  const env: EnvVars = {
    // Supabase
    NEXT_PUBLIC_SUPABASE_URL: validateUrl(
      'NEXT_PUBLIC_SUPABASE_URL',
      validateRequired('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL)
    ),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: validateApiKey(
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      validateRequired('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      'eyJ' // JWT tokens typically start with this
    ),
    
    // OpenAI
    OPENAI_API_KEY: validateApiKey(
      'OPENAI_API_KEY',
      validateRequired('OPENAI_API_KEY', process.env.OPENAI_API_KEY),
      'sk-'
    ),
    
    // Gemini
    GEMINI_API_KEY: validateApiKey(
      'GEMINI_API_KEY',
      validateRequired('GEMINI_API_KEY', process.env.GEMINI_API_KEY)
    ),
  };

  return env;
}

/**
 * Gets optional environment variables with defaults
 */
export function getOptionalEnv(): OptionalEnvVars {
  return {
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    VERCEL_URL: process.env.VERCEL_URL,
    NODE_ENV: process.env.NODE_ENV || 'development',
  };
}

/**
 * Checks if we're in production environment
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Checks if rate limiting is enabled (requires Redis)
 */
export function isRateLimitingEnabled(): boolean {
  const optional = getOptionalEnv();
  return !!(optional.UPSTASH_REDIS_REST_URL && optional.UPSTASH_REDIS_REST_TOKEN);
}

/**
 * Gets the application URL for absolute URLs
 */
export function getAppUrl(): string {
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:3000';
}

// Validate environment variables at module load time (server-side only)
if (typeof window === 'undefined') {
  try {
    validateEnv();
    console.log('✅ Environment variables validated successfully');
    
    const optional = getOptionalEnv();
    if (!isRateLimitingEnabled()) {
      console.warn('⚠️  Rate limiting is DISABLED (missing Redis configuration)');
      console.warn('   For production, add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN');
    } else {
      console.log('✅ Rate limiting is ENABLED');
    }
    
    console.log(`📍 Environment: ${optional.NODE_ENV}`);
    console.log(`🌐 App URL: ${getAppUrl()}`);
  } catch (error) {
    if (error instanceof EnvironmentError) {
      console.error('\n❌ ENVIRONMENT VALIDATION FAILED\n');
      console.error(error.message);
      console.error('\n💡 Tip: Copy .env.local.example to .env.local and fill in your values\n');
      
      // In production, fail hard. In development, allow startup but warn.
      if (isProduction()) {
        process.exit(1);
      }
    }
    throw error;
  }
}
