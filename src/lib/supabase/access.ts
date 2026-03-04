import { createClient } from './server';
import type { AccessRole } from '../types';

interface AccessValidationResult {
  valid: boolean;
  role?: AccessRole;
  guideId?: string;
  error?: string;
}

export async function validateAccess(
  key: string | null,
  requiredRole?: AccessRole | AccessRole[],
  requiredGuideSlug?: string
): Promise<AccessValidationResult> {
  if (!key) {
    return { valid: false, error: 'Access key is required' };
  }

  const supabase = await createClient();

  // Query access_keys table
  const { data: accessKey, error } = await supabase
    .from('access_keys')
    .select('*, guide:guides(slug)')
    .eq('key', key)
    .eq('active', true)
    .single();

  if (error || !accessKey) {
    return { valid: false, error: 'Invalid or inactive access key' };
  }

  // Check role match if required (supports single role or array)
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(accessKey.role)) {
      return { valid: false, error: 'Insufficient permissions' };
    }
  }

  // Check guide match if required
  if (requiredGuideSlug && accessKey.role === 'guide') {
    if (!accessKey.guide || accessKey.guide.slug !== requiredGuideSlug) {
      return { valid: false, error: 'Access denied for this guide' };
    }
  }

  return {
    valid: true,
    role: accessKey.role,
    guideId: accessKey.guide_id || undefined,
  };
}
