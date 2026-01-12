'use server';

import { createClient } from '@/lib/supabase/server';
import type { PostStatus } from '@/lib/types';

export async function updatePostStatus(postId: string, status: PostStatus) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('posts')
      .update({ status })
      .eq('id', postId);

    if (error) {
      console.error('Update post status error:', error);
      return { success: false, error: 'Failed to update post status' };
    }

    return { success: true };
  } catch (error) {
    console.error('Update post status error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
