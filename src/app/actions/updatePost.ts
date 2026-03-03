'use server';

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

interface UpdatePostData {
  postId: string;
  touristSessionId: string;
  location?: string;
  experienceText?: string;
}

export async function updatePost(data: UpdatePostData) {
  logger.info('Updating post', {
    postId: data.postId,
    hasLocation: !!data.location,
    hasExperienceText: !!data.experienceText,
  });

  try {
    // Validate postId
    if (!data.postId || typeof data.postId !== 'string' || data.postId.trim() === '') {
      return { success: false, error: 'Post ID is required' };
    }

    // Validate session ID
    if (!data.touristSessionId || typeof data.touristSessionId !== 'string') {
      return { success: false, error: 'Session ID is required' };
    }

    // Validate that at least one field is provided
    if (!data.location && !data.experienceText) {
      return { success: false, error: 'At least one field to update must be provided' };
    }

    // Validate non-empty strings for provided fields
    if (data.location !== undefined && (typeof data.location !== 'string' || data.location.trim() === '')) {
      return { success: false, error: 'Location must be a non-empty string' };
    }

    if (data.experienceText !== undefined && (typeof data.experienceText !== 'string' || data.experienceText.trim() === '')) {
      return { success: false, error: 'Experience text must be a non-empty string' };
    }

    if (data.experienceText && data.experienceText.trim().length > 500) {
      return { success: false, error: 'Experience text must be 500 characters or less' };
    }

    const supabase = await createClient();

    // Fetch post to verify it exists, is a draft, and belongs to this tourist
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('id, status, tourist_session_id')
      .eq('id', data.postId)
      .single();

    if (fetchError || !post) {
      logger.error('Post not found', fetchError || new Error('Unknown error'), { postId: data.postId });
      return { success: false, error: 'Post not found' };
    }

    if (post.status !== 'draft') {
      logger.warn('Attempted to update non-draft post', { postId: data.postId, status: post.status });
      return { success: false, error: 'Only draft posts can be updated' };
    }

    // Verify ownership
    if (post.tourist_session_id !== data.touristSessionId) {
      logger.warn('Unauthorized update attempt', { postId: data.postId });
      return { success: false, error: 'Unauthorized: you can only edit your own posts' };
    }

    // Build update payload
    const updatePayload: Record<string, string> = {};

    if (data.location) {
      updatePayload.location_label = data.location.trim();
    }

    if (data.experienceText) {
      updatePayload.experience_text = data.experienceText.trim();
    }

    // Perform update
    const { error: updateError } = await supabase
      .from('posts')
      .update(updatePayload)
      .eq('id', data.postId);

    if (updateError) {
      logger.error('Post update failed', updateError, { postId: data.postId });
      return { success: false, error: 'Failed to update post: ' + updateError.message };
    }

    logger.info('Post updated successfully', { postId: data.postId, updatedFields: Object.keys(updatePayload) });
    return { success: true };
  } catch (error) {
    logger.error('Unexpected error updating post', error as Error, { postId: data.postId });
    return {
      success: false,
      error: 'An unexpected error occurred: ' + (error as Error).message,
    };
  }
}
