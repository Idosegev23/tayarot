import { redirect } from 'next/navigation';
import { getAuthenticatedGuide } from '@/app/actions/guideAuth';
import { createClient } from '@/lib/supabase/server';
import { GuideAuthDashboard } from './GuideAuthDashboard';

export const metadata = {
  title: 'Guide Dashboard',
};

export default async function GuideDashboardPage() {
  const guide = await getAuthenticatedGuide();

  if (!guide || !guide.id) {
    redirect('/guide/login');
  }

  // If guide hasn't completed setup (no slug), redirect to setup
  if (!guide.slug) {
    redirect('/guide/setup');
  }

  // Fetch guide's groups
  const supabase = await createClient();
  const { data: groups } = await supabase
    .from('groups')
    .select('*')
    .eq('guide_id', guide.id)
    .order('created_at', { ascending: false });

  // Fetch guide's posts count
  const { count: postsCount } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('guide_id', guide.id);

  return (
    <GuideAuthDashboard
      guide={guide}
      groups={groups || []}
      postsCount={postsCount || 0}
    />
  );
}
