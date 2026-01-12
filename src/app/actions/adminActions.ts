'use server';

import { createClient } from '@/lib/supabase/server';
import { generateAccessKey } from '@/lib/utils';
import { BIBLICAL_VERSES } from '@/lib/constants';
import type { AccessRole } from '@/lib/types';

// Guide Actions
export async function createGuide(slug: string, displayName: string) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('guides')
      .insert({ slug, display_name: displayName })
      .select()
      .single();

    if (error) {
      console.error('Create guide error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, guide: data };
  } catch (error) {
    console.error('Create guide error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function updateGuide(id: string, displayName: string) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('guides')
      .update({ display_name: displayName })
      .eq('id', id);

    if (error) {
      console.error('Update guide error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Update guide error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// Access Key Actions
export async function createAccessKey(role: AccessRole, guideId: string | null, label: string) {
  try {
    const supabase = await createClient();
    const key = generateAccessKey();

    const { data, error } = await supabase
      .from('access_keys')
      .insert({
        key,
        role,
        guide_id: guideId,
        label,
        active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Create access key error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, accessKey: data };
  } catch (error) {
    console.error('Create access key error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function toggleKeyActive(id: string, active: boolean) {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('access_keys')
      .update({ active })
      .eq('id', id);

    if (error) {
      console.error('Toggle key active error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Toggle key active error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// Settings Actions
export async function updateSettings(
  hashtags: string[],
  verseModeEnabled: boolean,
  maxImagesPerPost: number,
  demoBannerText: string
) {
  try {
    const supabase = await createClient();

    // Get existing settings
    const { data: existing } = await supabase
      .from('app_settings')
      .select('id')
      .limit(1)
      .single();

    if (!existing) {
      return { success: false, error: 'Settings not found' };
    }

    const { error } = await supabase
      .from('app_settings')
      .update({
        hashtags,
        verse_mode_enabled: verseModeEnabled,
        max_images_per_post: maxImagesPerPost,
        demo_banner_text: demoBannerText,
      })
      .eq('id', existing.id);

    if (error) {
      console.error('Update settings error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Update settings error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// Seed Data Action
export async function seedDemoData() {
  try {
    const supabase = await createClient();

    // Create guides
    const guides = [
      { slug: 'sarah', display_name: 'Sarah Cohen' },
      { slug: 'david', display_name: 'David Levi' },
    ];

    const { data: createdGuides, error: guidesError } = await supabase
      .from('guides')
      .upsert(guides, { onConflict: 'slug' })
      .select();

    if (guidesError) {
      return { success: false, error: guidesError.message };
    }

    // Create access keys
    const keys = [
      { key: generateAccessKey(), role: 'guide' as const, guide_id: createdGuides![0].id, label: 'Sarah Guide Access', active: true },
      { key: generateAccessKey(), role: 'guide' as const, guide_id: createdGuides![1].id, label: 'David Guide Access', active: true },
      { key: generateAccessKey(), role: 'tourism' as const, guide_id: null, label: 'Tourism Dashboard', active: true },
      { key: generateAccessKey(), role: 'admin' as const, guide_id: null, label: 'Admin Dashboard', active: true },
    ];

    const { error: keysError } = await supabase
      .from('access_keys')
      .upsert(keys, { onConflict: 'key' });

    if (keysError) {
      return { success: false, error: keysError.message };
    }

    // Create sample posts
    const samplePosts = [
      {
        guide_id: createdGuides![0].id,
        tourist_name: 'John Smith',
        location_label: 'Jerusalem',
        experience_text: 'Walking through the Old City was a profound experience. The history here is tangible in every stone.',
        style: 'holy_land' as const,
        images: ['https://images.unsplash.com/photo-1543762477-077f61d0fe11?w=800'],
        status: 'published' as const,
        verse_text: BIBLICAL_VERSES.jerusalem,
      },
      {
        guide_id: createdGuides![0].id,
        tourist_name: 'Emma Johnson',
        location_label: 'Dead Sea',
        experience_text: 'Floating in the Dead Sea was surreal! The mineral-rich waters and the stunning desert landscape made it unforgettable.',
        style: 'regular' as const,
        images: ['https://images.unsplash.com/photo-1570939274717-7eda259b50ed?w=800'],
        status: 'approved' as const,
      },
      {
        guide_id: createdGuides![1].id,
        tourist_name: 'Michael Chen',
        location_label: 'Tel Aviv',
        experience_text: 'The vibrant energy of Tel Aviv is incredible. From the beaches to the food scene, every moment was amazing.',
        style: 'regular' as const,
        images: ['https://images.unsplash.com/photo-1590856029826-c7a73142bbf1?w=800'],
        status: 'published' as const,
      },
      {
        guide_id: createdGuides![1].id,
        tourist_name: 'Sophie Martin',
        location_label: 'Galilee',
        experience_text: 'The Sea of Galilee is breathtaking. Such a peaceful and spiritual place with incredible natural beauty.',
        style: 'holy_land' as const,
        images: ['https://images.unsplash.com/photo-1596542823503-5239a2b90a1f?w=800'],
        status: 'draft' as const,
        verse_text: BIBLICAL_VERSES.galilee,
      },
    ];

    const { error: postsError } = await supabase
      .from('posts')
      .insert(samplePosts);

    if (postsError) {
      return { success: false, error: postsError.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Seed data error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function clearAllData() {
  try {
    const supabase = await createClient();

    // Delete in order: posts, access_keys, guides
    await supabase.from('posts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('access_keys').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('guides').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    return { success: true };
  } catch (error) {
    console.error('Clear data error:', error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}
