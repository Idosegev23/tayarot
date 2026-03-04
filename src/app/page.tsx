import { createClient } from '@/lib/supabase/server';
import { validateAccess } from '@/lib/supabase/access';
import { UnifiedDashboard } from './UnifiedDashboard';
import { Card } from '@/components/ui/Card';
import { Shield } from 'lucide-react';

interface PageProps {
  searchParams: Promise<{ k?: string }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const { k: accessKey } = await searchParams;

  // No key — show access key input
  if (!accessKey) {
    return <AccessKeyForm />;
  }

  // Validate key (admin or tourism)
  const accessResult = await validateAccess(accessKey, ['admin', 'tourism']);

  if (!accessResult.valid) {
    return <AccessKeyForm error={accessResult.error || 'Invalid or inactive access key'} />;
  }

  const role = accessResult.role as 'admin' | 'tourism';
  const isAdmin = role === 'admin';
  const supabase = await createClient();

  // Fetch data in parallel
  const [guidesRes, groupsRes, postsCountRes, publishedRes, keysRes, settingsRes] = await Promise.all([
    // Guides with post counts
    supabase.from('guides').select('*, posts(count)').order('created_at', { ascending: false }),
    // Groups with counts
    supabase.from('groups').select('*, guide:guides(id, slug, display_name), posts(count), group_participants(count), group_itinerary_days(count)').order('created_at', { ascending: false }),
    // Total posts
    supabase.from('posts').select('id', { count: 'exact', head: true }),
    // Published this week
    supabase.from('posts').select('id', { count: 'exact', head: true }).eq('status', 'published').gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    // Access keys (admin only)
    isAdmin ? supabase.from('access_keys').select('*, guide:guides(slug, display_name)').order('created_at', { ascending: false }) : Promise.resolve({ data: null }),
    // Settings (admin only)
    isAdmin ? supabase.from('app_settings').select('*').limit(1).single() : Promise.resolve({ data: null }),
  ]);

  // Build groups data
  const allGroups = (groupsRes.data || []).map(g => ({
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
    guide: g.guide as { id: string; slug: string; display_name: string } | undefined,
    postsCount: Array.isArray(g.posts) && g.posts[0] ? (g.posts[0] as { count: number }).count : 0,
    participantsCount: Array.isArray(g.group_participants) && g.group_participants[0] ? (g.group_participants[0] as { count: number }).count : 0,
    daysCount: Array.isArray(g.group_itinerary_days) && g.group_itinerary_days[0] ? (g.group_itinerary_days[0] as { count: number }).count : 0,
  }));

  // Build guides with nested groups
  const guidesWithGroups = (guidesRes.data || []).map(guide => {
    const postCount = Array.isArray(guide.posts) && guide.posts[0]
      ? (guide.posts[0] as { count: number }).count
      : 0;

    return {
      id: guide.id,
      slug: guide.slug,
      display_name: guide.display_name,
      email: guide.email || undefined,
      totalPosts: postCount,
      groups: allGroups.filter(g => g.guide_id === guide.id),
    };
  });

  return (
    <UnifiedDashboard
      accessKey={accessKey}
      role={role}
      guides={guidesWithGroups}
      groups={allGroups}
      accessKeys={keysRes.data || undefined}
      settings={settingsRes.data || undefined}
      totalPosts={postsCountRes.count || 0}
      publishedThisWeek={publishedRes.count || 0}
    />
  );
}

function AccessKeyForm({ error }: { error?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary/95 to-secondary/70 p-4">
      <Card className="w-full max-w-md p-6 animate-fade-in-up">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield size={28} className="text-primary" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">Agent Mary</h1>
          <p className="text-sm text-gray-500">Enter your access key to continue</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            {error}
          </div>
        )}

        <form action="/" method="GET" className="space-y-4">
          <input
            type="text"
            name="k"
            placeholder="Access key"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none text-gray-900 placeholder:text-gray-400 font-mono text-center"
            autoFocus
          />
          <button
            type="submit"
            className="w-full px-4 py-3 bg-primary text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            Enter Dashboard
          </button>
        </form>

        <p className="text-xs text-gray-400 text-center mt-4">
          Contact your administrator for access
        </p>
      </Card>
    </div>
  );
}
