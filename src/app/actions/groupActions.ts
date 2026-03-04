'use server';

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { getAuthenticatedGuide } from './guideAuth';
import type { Group } from '@/lib/types';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
}

async function requireGuide() {
  const guide = await getAuthenticatedGuide();
  if (!guide || !guide.id) {
    return { guide: null, error: 'Not authenticated' };
  }
  return { guide, error: null };
}

export async function createGroup(data: {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}) {
  try {
    const { guide, error: authError } = await requireGuide();
    if (!guide) return { success: false, error: authError };

    const supabase = await createClient();
    const slug = slugify(data.name);

    const { data: group, error } = await supabase
      .from('groups')
      .insert({
        guide_id: guide.id,
        name: data.name,
        slug,
        description: data.description || null,
        start_date: data.startDate || null,
        end_date: data.endDate || null,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'A group with this name already exists' };
      }
      logger.error('createGroup error', undefined, { error: error.message });
      return { success: false, error: error.message };
    }

    logger.info('Group created', { groupId: group.id, guideId: guide.id });
    return { success: true, group };
  } catch (error) {
    logger.error('createGroup error', error as Error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function updateGroup(
  groupId: string,
  data: {
    name?: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    status?: 'active' | 'completed' | 'archived';
  }
) {
  try {
    const { guide, error: authError } = await requireGuide();
    if (!guide) return { success: false, error: authError };

    const supabase = await createClient();

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (data.name !== undefined) {
      updateData.name = data.name;
      updateData.slug = slugify(data.name);
    }
    if (data.description !== undefined) updateData.description = data.description || null;
    if (data.startDate !== undefined) updateData.start_date = data.startDate || null;
    if (data.endDate !== undefined) updateData.end_date = data.endDate || null;
    if (data.status !== undefined) updateData.status = data.status;

    const { error } = await supabase
      .from('groups')
      .update(updateData)
      .eq('id', groupId)
      .eq('guide_id', guide.id);

    if (error) {
      logger.error('updateGroup error', undefined, { error: error.message });
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    logger.error('updateGroup error', error as Error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function deleteGroup(groupId: string) {
  try {
    const { guide, error: authError } = await requireGuide();
    if (!guide) return { success: false, error: authError };

    const supabase = await createClient();

    const { error } = await supabase
      .from('groups')
      .delete()
      .eq('id', groupId)
      .eq('guide_id', guide.id);

    if (error) {
      logger.error('deleteGroup error', undefined, { error: error.message });
      return { success: false, error: error.message };
    }

    logger.info('Group deleted', { groupId, guideId: guide.id });
    return { success: true };
  } catch (error) {
    logger.error('deleteGroup error', error as Error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function getGroupWithItinerary(groupId: string): Promise<{
  group: Group | null;
  days: Array<{
    id: string;
    day_number: number;
    date: string | null;
    title: string | null;
    description: string | null;
    stops: Array<{
      id: string;
      order_index: number;
      time: string | null;
      location_name: string;
      lat: number | null;
      lng: number | null;
      description: string | null;
      fun_facts: string | null;
      duration_minutes: number | null;
    }>;
  }>;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('*, guide:guides(*)')
      .eq('id', groupId)
      .single();

    if (groupError || !group) {
      return { group: null, days: [], error: 'Group not found' };
    }

    const { data: days } = await supabase
      .from('group_itinerary_days')
      .select('*')
      .eq('group_id', groupId)
      .order('day_number');

    const dayIds = (days || []).map(d => d.id);

    let stops: Record<string, typeof stopsData> = {};
    let stopsData: Array<{
      id: string;
      day_id: string;
      order_index: number;
      time: string | null;
      location_name: string;
      lat: number | null;
      lng: number | null;
      description: string | null;
      fun_facts: string | null;
      duration_minutes: number | null;
    }> = [];

    if (dayIds.length > 0) {
      const { data: allStops } = await supabase
        .from('group_itinerary_stops')
        .select('*')
        .in('day_id', dayIds)
        .order('order_index');

      stopsData = allStops || [];
      for (const stop of stopsData) {
        if (!stops[stop.day_id]) stops[stop.day_id] = [];
        stops[stop.day_id].push(stop);
      }
    }

    const daysWithStops = (days || []).map(day => ({
      ...day,
      stops: stops[day.id] || [],
    }));

    return { group: group as Group, days: daysWithStops };
  } catch (error) {
    logger.error('getGroupWithItinerary error', error as Error);
    return { group: null, days: [], error: 'An unexpected error occurred' };
  }
}

export async function getGroupBySlug(guideSlug: string, groupSlug: string) {
  try {
    const supabase = await createClient();

    // Find guide by slug
    const { data: guide } = await supabase
      .from('guides')
      .select('id, slug, display_name')
      .eq('slug', guideSlug)
      .single();

    if (!guide) return { group: null, guide: null, error: 'Guide not found' };

    // Find group by slug within this guide
    const { data: group } = await supabase
      .from('groups')
      .select('*')
      .eq('guide_id', guide.id)
      .eq('slug', groupSlug)
      .eq('status', 'active')
      .single();

    if (!group) return { group: null, guide, error: 'Group not found' };

    return { group: group as Group, guide };
  } catch (error) {
    logger.error('getGroupBySlug error', error as Error);
    return { group: null, guide: null, error: 'An unexpected error occurred' };
  }
}
