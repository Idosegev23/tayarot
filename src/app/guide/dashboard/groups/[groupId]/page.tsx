import { redirect, notFound } from 'next/navigation';
import { getAuthenticatedGuide } from '@/app/actions/guideAuth';
import { getGroupWithItinerary } from '@/app/actions/groupActions';
import { createClient } from '@/lib/supabase/server';
import { GroupDetail } from './GroupDetail';

export const metadata = {
  title: 'Group Details',
};

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const guide = await getAuthenticatedGuide();
  if (!guide || !guide.id) redirect('/guide/login');

  const { group, days, error } = await getGroupWithItinerary(groupId);

  if (!group || error) notFound();

  // Verify ownership
  if (group.guide_id !== guide.id) notFound();

  // Fetch group posts and participants in parallel
  const supabase = await createClient();
  const [postsRes, participantsRes] = await Promise.all([
    supabase
      .from('posts')
      .select('*', { count: 'exact' })
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('group_participants')
      .select('*')
      .eq('group_id', groupId)
      .order('last_name')
      .order('first_name'),
  ]);

  return (
    <GroupDetail
      group={group}
      guide={guide}
      days={days}
      posts={postsRes.data || []}
      postsCount={postsRes.count || 0}
      participants={participantsRes.data || []}
    />
  );
}
