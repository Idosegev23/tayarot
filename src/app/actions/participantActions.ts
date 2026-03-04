'use server';

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { getAuthenticatedGuide } from './guideAuth';
import type { GroupParticipant } from '@/lib/types';

async function requireGuide() {
  const guide = await getAuthenticatedGuide();
  if (!guide || !guide.id) {
    return { guide: null, error: 'Not authenticated' };
  }
  return { guide, error: null };
}

async function verifyGuideOwnsGroup(guideId: string, groupId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from('groups')
    .select('id')
    .eq('id', groupId)
    .eq('guide_id', guideId)
    .single();
  return !!data;
}

export async function addParticipant(
  groupId: string,
  firstName: string,
  lastName: string
): Promise<{ success: boolean; participant?: GroupParticipant; error?: string }> {
  try {
    const { guide, error: authError } = await requireGuide();
    if (!guide) return { success: false, error: authError || 'Not authenticated' };

    const owns = await verifyGuideOwnsGroup(guide.id, groupId);
    if (!owns) return { success: false, error: 'Not authorized for this group' };

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('group_participants')
      .insert({
        group_id: groupId,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'Participant already exists in this group' };
      }
      logger.error('addParticipant error', undefined, { error: error.message });
      return { success: false, error: error.message };
    }

    return { success: true, participant: data as GroupParticipant };
  } catch (error) {
    logger.error('addParticipant error', error as Error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function removeParticipant(
  participantId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { guide, error: authError } = await requireGuide();
    if (!guide) return { success: false, error: authError || 'Not authenticated' };

    const supabase = await createClient();

    // Verify ownership via join
    const { data: participant } = await supabase
      .from('group_participants')
      .select('id, group_id, group:groups!inner(guide_id)')
      .eq('id', participantId)
      .single();

    if (!participant) return { success: false, error: 'Participant not found' };

    const group = participant.group as unknown as { guide_id: string };
    if (group.guide_id !== guide.id) {
      return { success: false, error: 'Not authorized' };
    }

    const { error } = await supabase
      .from('group_participants')
      .delete()
      .eq('id', participantId);

    if (error) {
      logger.error('removeParticipant error', undefined, { error: error.message });
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    logger.error('removeParticipant error', error as Error);
    return { success: false, error: 'An unexpected error occurred' };
  }
}

export async function addParticipantsBulk(
  groupId: string,
  participants: Array<{ firstName: string; lastName: string }>
): Promise<{ success: boolean; added: number; error?: string }> {
  try {
    const { guide, error: authError } = await requireGuide();
    if (!guide) return { success: false, added: 0, error: authError || 'Not authenticated' };

    const owns = await verifyGuideOwnsGroup(guide.id, groupId);
    if (!owns) return { success: false, added: 0, error: 'Not authorized for this group' };

    const supabase = await createClient();
    const rows = participants
      .filter(p => p.firstName.trim() && p.lastName.trim())
      .map(p => ({
        group_id: groupId,
        first_name: p.firstName.trim(),
        last_name: p.lastName.trim(),
      }));

    if (rows.length === 0) return { success: true, added: 0 };

    const { data, error } = await supabase
      .from('group_participants')
      .upsert(rows, { onConflict: 'group_id,first_name,last_name', ignoreDuplicates: true })
      .select();

    if (error) {
      logger.error('addParticipantsBulk error', undefined, { error: error.message });
      return { success: false, added: 0, error: error.message };
    }

    return { success: true, added: data?.length || 0 };
  } catch (error) {
    logger.error('addParticipantsBulk error', error as Error);
    return { success: false, added: 0, error: 'An unexpected error occurred' };
  }
}

export async function getParticipants(
  groupId: string
): Promise<{ participants: GroupParticipant[]; error?: string }> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('group_participants')
      .select('*')
      .eq('group_id', groupId)
      .order('last_name')
      .order('first_name');

    if (error) {
      return { participants: [], error: error.message };
    }

    return { participants: (data || []) as GroupParticipant[] };
  } catch (error) {
    logger.error('getParticipants error', error as Error);
    return { participants: [], error: 'An unexpected error occurred' };
  }
}

export async function validateTouristName(
  groupId: string,
  firstName: string,
  lastName: string
): Promise<{ valid: boolean; participantId?: string }> {
  try {
    const supabase = await createClient();

    const { data } = await supabase
      .from('group_participants')
      .select('id')
      .eq('group_id', groupId)
      .ilike('first_name', firstName.trim())
      .ilike('last_name', lastName.trim())
      .limit(1)
      .single();

    if (data) {
      return { valid: true, participantId: data.id };
    }

    return { valid: false };
  } catch {
    return { valid: false };
  }
}
