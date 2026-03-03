'use server';

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export async function deletePost(
  postId: string,
  touristSessionId: string
): Promise<{ success: boolean; error?: string }> {
  logger.info('Deleting post', { postId });

  try {
    if (!postId || typeof postId !== 'string' || postId.trim() === '') {
      return { success: false, error: 'Post ID is required' };
    }

    if (!touristSessionId || typeof touristSessionId !== 'string') {
      return { success: false, error: 'Session ID is required' };
    }

    const supabase = await createClient();

    // Fetch the post to verify it exists, is a draft, and belongs to this tourist
    const { data: post, error: fetchError } = await supabase
      .from('posts')
      .select('id, status, tourist_session_id')
      .eq('id', postId)
      .single();

    if (fetchError || !post) {
      logger.error('Post not found for deletion', fetchError || new Error('Unknown error'), { postId });
      return { success: false, error: 'Post not found' };
    }

    if (post.status !== 'draft') {
      logger.warn('Attempted to delete non-draft post', { postId, status: post.status });
      return { success: false, error: 'Only draft posts can be deleted' };
    }

    // Verify ownership
    if (post.tourist_session_id !== touristSessionId) {
      logger.warn('Unauthorized delete attempt', { postId, providedSession: touristSessionId });
      return { success: false, error: 'Unauthorized: you can only delete your own posts' };
    }

    // Delete the post
    const { error: deleteError } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId);

    if (deleteError) {
      logger.error('Failed to delete post', deleteError, { postId });
      return { success: false, error: 'Failed to delete post' };
    }

    logger.info('Post deleted successfully', { postId });
    return { success: true };
  } catch (error) {
    logger.error('Unexpected error deleting post', error as Error, { postId });
    return { success: false, error: 'An unexpected error occurred' };
  }
}
