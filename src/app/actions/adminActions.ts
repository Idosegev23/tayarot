'use server';

import { createClient } from '@/lib/supabase/server';
import { validateAccess } from '@/lib/supabase/access';
import { generateAccessKey } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { BIBLICAL_VERSES } from '@/lib/constants';
import type { AccessRole } from '@/lib/types';

async function requireAdmin(accessKey: string): Promise<{ valid: boolean; error?: string }> {
  if (!accessKey) return { valid: false, error: 'Access key is required' };
  const result = await validateAccess(accessKey, 'admin');
  if (!result.valid) {
    logger.warn('Unauthorized admin action attempt', { error: result.error });
    return { valid: false, error: 'Unauthorized' };
  }
  return { valid: true };
}

async function requireAdminOrTourism(accessKey: string): Promise<{ valid: boolean; role?: AccessRole; error?: string }> {
  if (!accessKey) return { valid: false, error: 'Access key is required' };
  const result = await validateAccess(accessKey, ['admin', 'tourism']);
  if (!result.valid) {
    return { valid: false, error: 'Unauthorized' };
  }
  return { valid: true, role: result.role };
}

// ==========================================
// DATA FETCHING (admin + tourism)
// ==========================================

export async function getGuidesWithGroupsAndCounts(accessKey: string) {
  try {
    const auth = await requireAdminOrTourism(accessKey);
    if (!auth.valid) return { success: false, error: auth.error, guides: [] };

    const supabase = await createClient();

    // Fetch guides with post counts
    const { data: guides, error: guidesError } = await supabase
      .from('guides')
      .select('*, posts(count)')
      .order('created_at', { ascending: false });

    if (guidesError) return { success: false, error: guidesError.message, guides: [] };

    // Fetch all groups with counts
    const { data: groups } = await supabase
      .from('groups')
      .select('*, posts(count), group_participants(count), group_itinerary_days(count)')
      .order('created_at', { ascending: false });

    // Nest groups inside guides
    const guidesWithGroups = (guides || []).map(guide => {
      const guideGroups = (groups || []).filter(g => g.guide_id === guide.id);
      const postCount = Array.isArray(guide.posts) && guide.posts[0]
        ? (guide.posts[0] as { count: number }).count
        : 0;

      return {
        ...guide,
        posts: undefined,
        totalPosts: postCount,
        groups: guideGroups.map(g => ({
          id: g.id,
          guide_id: g.guide_id,
          name: g.name,
          slug: g.slug,
          description: g.description,
          start_date: g.start_date,
          end_date: g.end_date,
          status: g.status,
          created_at: g.created_at,
          updated_at: g.updated_at,
          postsCount: Array.isArray(g.posts) && g.posts[0] ? (g.posts[0] as { count: number }).count : 0,
          participantsCount: Array.isArray(g.group_participants) && g.group_participants[0] ? (g.group_participants[0] as { count: number }).count : 0,
          daysCount: Array.isArray(g.group_itinerary_days) && g.group_itinerary_days[0] ? (g.group_itinerary_days[0] as { count: number }).count : 0,
        })),
      };
    });

    return { success: true, guides: guidesWithGroups };
  } catch (error) {
    logger.error('getGuidesWithGroupsAndCounts error', error as Error);
    return { success: false, error: 'An unexpected error occurred', guides: [] };
  }
}

export async function getAllGroupsWithCounts(
  accessKey: string,
  filters?: { guideId?: string; status?: string }
) {
  try {
    const auth = await requireAdminOrTourism(accessKey);
    if (!auth.valid) return { success: false, error: auth.error, groups: [] };

    const supabase = await createClient();

    let query = supabase
      .from('groups')
      .select('*, guide:guides(id, slug, display_name), posts(count), group_participants(count), group_itinerary_days(count)')
      .order('created_at', { ascending: false });

    if (filters?.guideId) {
      query = query.eq('guide_id', filters.guideId);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;

    if (error) return { success: false, error: error.message, groups: [] };

    const groups = (data || []).map(g => ({
      id: g.id,
      guide_id: g.guide_id,
      name: g.name,
      slug: g.slug,
      description: g.description,
      start_date: g.start_date,
      end_date: g.end_date,
      status: g.status,
      created_at: g.created_at,
      updated_at: g.updated_at,
      guide: g.guide,
      postsCount: Array.isArray(g.posts) && g.posts[0] ? (g.posts[0] as { count: number }).count : 0,
      participantsCount: Array.isArray(g.group_participants) && g.group_participants[0] ? (g.group_participants[0] as { count: number }).count : 0,
      daysCount: Array.isArray(g.group_itinerary_days) && g.group_itinerary_days[0] ? (g.group_itinerary_days[0] as { count: number }).count : 0,
    }));

    return { success: true, groups };
  } catch (error) {
    logger.error('getAllGroupsWithCounts error', error as Error);
    return { success: false, error: 'An unexpected error occurred', groups: [] };
  }
}

export async function getGroupFullDetail(accessKey: string, groupId: string) {
  try {
    const auth = await requireAdminOrTourism(accessKey);
    if (!auth.valid) return { success: false, error: auth.error };

    const supabase = await createClient();

    // Fetch group with guide
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('*, guide:guides(id, slug, display_name)')
      .eq('id', groupId)
      .single();

    if (groupError || !group) return { success: false, error: 'Group not found' };

    // Fetch itinerary, participants, posts in parallel
    const [daysRes, participantsRes, postsRes] = await Promise.all([
      supabase.from('group_itinerary_days').select('*').eq('group_id', groupId).order('day_number'),
      supabase.from('group_participants').select('*').eq('group_id', groupId).order('last_name').order('first_name'),
      supabase.from('posts').select('*').eq('group_id', groupId).order('created_at', { ascending: false }),
    ]);

    // Fetch stops for days
    const dayIds = (daysRes.data || []).map(d => d.id);
    let stopsMap: Record<string, Array<Record<string, unknown>>> = {};
    if (dayIds.length > 0) {
      const { data: stops } = await supabase
        .from('group_itinerary_stops')
        .select('*')
        .in('day_id', dayIds)
        .order('order_index');

      for (const stop of stops || []) {
        if (!stopsMap[stop.day_id]) stopsMap[stop.day_id] = [];
        stopsMap[stop.day_id].push(stop);
      }
    }

    const days = (daysRes.data || []).map(day => ({
      ...day,
      stops: stopsMap[day.id] || [],
    }));

    return {
      success: true,
      group,
      days,
      participants: participantsRes.data || [],
      posts: postsRes.data || [],
    };
  } catch (error) {
    logger.error('getGroupFullDetail error', error as Error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function addParticipantAdmin(
  accessKey: string,
  groupId: string,
  firstName: string,
  lastName: string
) {
  try {
    const auth = await requireAdmin(accessKey);
    if (!auth.valid) return { success: false, error: auth.error };

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('group_participants')
      .insert({ group_id: groupId, first_name: firstName.trim(), last_name: lastName.trim() })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return { success: false, error: 'Participant already exists' };
      return { success: false, error: error.message };
    }
    return { success: true, participant: data };
  } catch (error) {
    logger.error('addParticipantAdmin error', error as Error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function removeParticipantAdmin(accessKey: string, participantId: string) {
  try {
    const auth = await requireAdmin(accessKey);
    if (!auth.valid) return { success: false, error: auth.error };

    const supabase = await createClient();
    const { error } = await supabase
      .from('group_participants')
      .delete()
      .eq('id', participantId);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (error) {
    logger.error('removeParticipantAdmin error', error as Error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

// ==========================================
// GUIDE CRUD (admin only)
// ==========================================

export async function updateGuide(accessKey: string, id: string, displayName: string) {
  try {
    const auth = await requireAdmin(accessKey);
    if (!auth.valid) return { success: false, error: auth.error };

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
export async function createAccessKey(accessKey: string, role: AccessRole, guideId: string | null, label: string) {
  try {
    const auth = await requireAdmin(accessKey);
    if (!auth.valid) return { success: false, error: auth.error };

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

export async function toggleKeyActive(accessKey: string, id: string, active: boolean) {
  try {
    const auth = await requireAdmin(accessKey);
    if (!auth.valid) return { success: false, error: auth.error };

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
  accessKey: string,
  hashtags: string[],
  verseModeEnabled: boolean,
  maxImagesPerPost: number,
  demoBannerText: string
) {
  try {
    const auth = await requireAdmin(accessKey);
    if (!auth.valid) return { success: false, error: auth.error };

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
export async function seedDemoData(accessKey: string) {
  try {
    const auth = await requireAdmin(accessKey);
    if (!auth.valid) return { success: false, error: auth.error };

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

export async function clearAllData(accessKey: string) {
  try {
    const auth = await requireAdmin(accessKey);
    if (!auth.valid) return { success: false, error: auth.error };

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
