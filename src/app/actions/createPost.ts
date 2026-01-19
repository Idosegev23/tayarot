'use server';

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { BIBLICAL_VERSES } from '@/lib/constants';
import type { PostStyle } from '@/lib/types';

interface CreatePostData {
  guideSlug: string;
  touristName?: string;
  location: string;
  experienceText: string;
  style: PostStyle;
  images: string[];
  biblicalVerse?: string;
  verseReference?: string;
}

export async function createPost(data: CreatePostData) {
  logger.info('Creating post', {
    guideSlug: data.guideSlug,
    location: data.location,
    style: data.style,
    imagesCount: data.images.length,
    hasBiblicalVerse: !!data.biblicalVerse,
  });

  try {
    const supabase = await createClient();

    // Get guide by slug
    const { data: guide, error: guideError } = await supabase
      .from('guides')
      .select('id')
      .eq('slug', data.guideSlug)
      .single();

    if (guideError || !guide) {
      logger.error('Guide not found', guideError || new Error('Unknown error'), { guideSlug: data.guideSlug });
      return { success: false, error: 'Guide not found: ' + (guideError?.message || 'Unknown error') };
    }

    logger.debug('Guide found', { guideId: guide.id, guideSlug: data.guideSlug });

    // Insert post
    const postData = {
      guide_id: guide.id,
      tourist_name: data.touristName || null,
      location_label: data.location,
      experience_text: data.experienceText,
      style: data.style,
      images: data.images,
      status: 'draft' as const,
      biblical_verse: data.biblicalVerse || null,
      verse_reference: data.verseReference || null,
    };

    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert(postData)
      .select()
      .single();

    if (postError || !post) {
      logger.error('Post creation failed', postError || new Error('Unknown error'), { guideSlug: data.guideSlug });
      return { success: false, error: 'Failed to create post: ' + (postError?.message || 'Unknown error') };
    }

    logger.info('Post created successfully', { postId: post.id, guideSlug: data.guideSlug, style: data.style });
    return { success: true, postId: post.id };
  } catch (error) {
    logger.error('Unexpected error creating post', error as Error, { guideSlug: data.guideSlug });
    return { 
      success: false, 
      error: 'An unexpected error occurred: ' + (error as Error).message 
    };
  }
}
