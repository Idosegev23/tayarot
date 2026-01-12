'use server';

import { createClient } from '@/lib/supabase/server';
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
  try {
    const supabase = await createClient();

    // Get guide by slug
    const { data: guide, error: guideError } = await supabase
      .from('guides')
      .select('id')
      .eq('slug', data.guideSlug)
      .single();

    if (guideError || !guide) {
      return { success: false, error: 'Guide not found' };
    }

    // Insert post
    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert({
        guide_id: guide.id,
        tourist_name: data.touristName || null,
        location_label: data.location,
        experience_text: data.experienceText,
        style: data.style,
        images: data.images,
        status: 'draft',
        biblical_verse: data.biblicalVerse || null,
        verse_reference: data.verseReference || null,
      })
      .select()
      .single();

    if (postError || !post) {
      console.error('Post creation error:', postError);
      return { success: false, error: 'Failed to create post' };
    }

    return { success: true, postId: post.id };
  } catch (error) {
    console.error('Create post error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
