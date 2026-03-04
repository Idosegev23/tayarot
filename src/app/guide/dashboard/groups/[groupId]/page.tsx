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

  // Fetch group posts
  const supabase = await createClient();
  const { data: posts, count: postsCount } = await supabase
    .from('posts')
    .select('*', { count: 'exact' })
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <GroupDetail
      group={group}
      guide={guide}
      days={days}
      posts={posts || []}
      postsCount={postsCount || 0}
    />
  );
}
