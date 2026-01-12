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
  console.log('🔄 createPost action started');
  console.log('📋 Input data:', {
    guideSlug: data.guideSlug,
    location: data.location,
    style: data.style,
    imagesCount: data.images.length,
    hasBiblicalVerse: !!data.biblicalVerse,
  });

  try {
    console.log('🔌 Creating Supabase client...');
    const supabase = await createClient();

    // Get guide by slug
    console.log('👤 Fetching guide:', data.guideSlug);
    const { data: guide, error: guideError } = await supabase
      .from('guides')
      .select('id')
      .eq('slug', data.guideSlug)
      .single();

    if (guideError || !guide) {
      console.error('❌ Guide not found:', guideError);
      return { success: false, error: 'Guide not found: ' + (guideError?.message || 'Unknown error') };
    }

    console.log('✅ Guide found:', guide.id);

    // Insert post
    console.log('💾 Inserting post into database...');
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
    
    console.log('📦 Post data:', postData);

    const { data: post, error: postError } = await supabase
      .from('posts')
      .insert(postData)
      .select()
      .single();

    if (postError || !post) {
      console.error('❌ Post creation error:', postError);
      return { success: false, error: 'Failed to create post: ' + (postError?.message || 'Unknown error') };
    }

    console.log('✅ Post created successfully:', post.id);
    return { success: true, postId: post.id };
  } catch (error) {
    console.error('💥 Create post error:', error);
    return { 
      success: false, 
      error: 'An unexpected error occurred: ' + (error as Error).message 
    };
  }
}
