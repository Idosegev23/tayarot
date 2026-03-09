'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';
import type { GuideWithAuth } from '@/lib/types';

/**
 * Get the currently authenticated guide (from Supabase Auth session).
 * Returns null if not authenticated or no linked guide.
 */
export async function getAuthenticatedGuide(): Promise<GuideWithAuth | null> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: guide } = await supabase
      .from('guides')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();

    if (!guide) {
      // User is authenticated but no guide row linked yet
      // Return minimal info so setup page can complete profile
      return {
        id: '',
        slug: '',
        display_name: '',
        created_at: '',
        auth_user_id: user.id,
        email: user.email,
      };
    }

    return guide as GuideWithAuth;
  } catch (error) {
    logger.error('getAuthenticatedGuide error', error as Error);
    return null;
  }
}

/**
 * Admin action: Create a new guide with Supabase Auth.
 * Sends a magic link email to the guide.
 */
export async function createGuideWithAuth(
  adminAccessKey: string,
  email: string,
  displayName: string,
  slug: string
) {
  try {
    // Validate admin access via existing key system
    const { validateAccess } = await import('@/lib/supabase/access');
    const auth = await validateAccess(adminAccessKey, 'admin');
    if (!auth.valid) {
      return { success: false, error: 'Unauthorized' };
    }

    const adminClient = createAdminClient();

    // 1. Create auth user with Supabase Auth (password set for testing)
    const GUIDE_PASSWORD = 'guide123';
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email,
      password: GUIDE_PASSWORD,
      email_confirm: true,
    });

    if (authError) {
      logger.error('Failed to create auth user', undefined, { error: authError.message, email });
      return { success: false, error: authError.message };
    }

    // 2. Create guide row linked to auth user
    const supabase = await createClient();
    const { data: guide, error: guideError } = await supabase
      .from('guides')
      .insert({
        slug,
        display_name: displayName,
        email,
        auth_user_id: authData.user.id,
      })
      .select()
      .single();

    if (guideError) {
      // Rollback: delete the auth user we just created
      await adminClient.auth.admin.deleteUser(authData.user.id);
      logger.error('Failed to create guide row', undefined, { error: guideError.message });
      return { success: false, error: guideError.message };
    }

    // 3. Send OTP login email to the new guide
    const loginClient = await createClient();
    const { error: otpError } = await loginClient.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });

    if (otpError) {
      logger.warn('Guide created but login email failed', { error: otpError.message });
      // Don't rollback — guide is created, admin can resend later
    }

    logger.info('Guide created with auth', { guideId: guide.id, email, slug });
    return { success: true, guide };
  } catch (error) {
    logger.error('createGuideWithAuth error', error as Error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Complete guide profile setup (first-time login).
 * Links the auth user to an existing guide row or updates profile.
 */
export async function completeGuideSetup(data: {
  displayName: string;
  phone?: string;
}) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'Not authenticated' };
    }

    // Find guide linked to this auth user
    const { data: guide } = await supabase
      .from('guides')
      .select('*')
      .eq('auth_user_id', user.id)
      .single();

    if (!guide) {
      return { success: false, error: 'No guide account found for this email' };
    }

    // Update profile
    const { error } = await supabase
      .from('guides')
      .update({
        display_name: data.displayName,
        phone: data.phone || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', guide.id);

    if (error) {
      logger.error('completeGuideSetup update error', undefined, { error: error.message });
      return { success: false, error: error.message };
    }

    logger.info('Guide setup completed', { guideId: guide.id });
    return { success: true };
  } catch (error) {
    logger.error('completeGuideSetup error', error as Error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Send OTP login email to a guide.
 */
export async function sendGuideLoginOTP(email: string) {
  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false, // Only existing users can log in
      },
    });

    if (error) {
      logger.warn('Guide login OTP failed', { error: error.message, email });
      // Generic error to avoid email enumeration
      return { success: false, error: 'If this email is registered, you will receive a login link.' };
    }

    return { success: true };
  } catch (error) {
    logger.error('sendGuideLoginOTP error', error as Error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Verify OTP code for guide login.
 */
export async function verifyGuideOTP(email: string, token: string) {
  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });

    if (error) {
      logger.warn('Guide OTP verification failed', { error: error.message });
      return { success: false, error: 'Invalid or expired code' };
    }

    return { success: true };
  } catch (error) {
    logger.error('verifyGuideOTP error', error as Error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Login guide with email + password (for testing without OTP emails).
 */
export async function loginGuideWithPassword(email: string, password: string) {
  try {
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      logger.warn('Guide password login failed', { error: error.message });
      return { success: false, error: 'Invalid email or password' };
    }

    return { success: true };
  } catch (error) {
    logger.error('loginGuideWithPassword error', error as Error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

/**
 * Sign out the current guide.
 */
export async function signOutGuide() {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
    return { success: true };
  } catch (error) {
    logger.error('signOutGuide error', error as Error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
