'use server';

import { createClient } from '@/lib/supabase/server';
import { validateAccess } from '@/lib/supabase/access';
import { logger } from '@/lib/logger';
import type { PostStatus } from '@/lib/types';

export async function updatePostStatus(postId: string, status: PostStatus, accessKey: string) {
  try {
    if (!postId || typeof postId !== 'string') {
      return { success: false, error: 'Post ID is required' };
    }

    if (!accessKey) {
      return { success: false, error: 'Access key is required' };
    }

    // Validate access — must be guide or admin
    const accessResult = await validateAccess(accessKey);
    if (!accessResult.valid) {
      logger.warn('Unauthorized updatePostStatus attempt', { postId, error: accessResult.error });
      return { success: false, error: 'Unauthorized' };
    }

    const supabase = await createClient();

    // If guide role, verify the post belongs to this guide
    if (accessResult.role === 'guide' && accessResult.guideId) {
      const { data: post, error: fetchError } = await supabase
        .from('posts')
        .select('guide_id')
        .eq('id', postId)
        .single();

      if (fetchError || !post) {
        return { success: false, error: 'Post not found' };
      }

      if (post.guide_id !== accessResult.guideId) {
        logger.warn('Guide attempted to update post from another guide', {
          postId,
          guideId: accessResult.guideId,
          postGuideId: post.guide_id,
        });
        return { success: false, error: 'Unauthorized: post belongs to another guide' };
      }
    }

    const { error } = await supabase
      .from('posts')
      .update({ status })
      .eq('id', postId);

    if (error) {
      logger.error('Update post status error', error, { postId });
      return { success: false, error: 'Failed to update post status' };
    }

    logger.info('Post status updated', { postId, status });
    return { success: true };
  } catch (error) {
    logger.error('Update post status error', error as Error, { postId });
    return { success: false, error: 'An unexpected error occurred' };
  }
}
