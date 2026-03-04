import { createClient } from '@/lib/supabase/server';
import { UnifiedDashboard } from './UnifiedDashboard';
import { Card } from '@/components/ui/Card';
import { Shield } from 'lucide-react';

const DASHBOARD_PASSWORD = '123456';

interface PageProps {
  searchParams: Promise<{ p?: string; r?: string }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const { p: password, r: roleParam } = await searchParams;

  // No password — show login form
  if (!password) {
    return <LoginForm />;
  }

  // Validate password
  if (password !== DASHBOARD_PASSWORD) {
    return <LoginForm error="Incorrect password" />;
  }

  const role: 'admin' | 'tourism' = roleParam === 'tourism' ? 'tourism' : 'admin';
  const isAdmin = role === 'admin';
  const supabase = await createClient();

  // Find or create an access key for this role (needed by dashboard actions)
  let accessKey = '';
  const { data: existingKey } = await supabase
    .from('access_keys')
    .select('key')
    .eq('role', role)
    .eq('active', true)
    .limit(1)
    .single();

  if (existingKey) {
    accessKey = existingKey.key;
  } else {
    // Auto-create an access key for this role
    const generatedKey = `${role}_${crypto.randomUUID().slice(0, 12)}`;
    const { data: newKey } = await supabase
      .from('access_keys')
      .insert({ key: generatedKey, role, active: true, label: `Auto-created ${role} key` })
      .select('key')
      .single();
    accessKey = newKey?.key || generatedKey;
  }

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

function LoginForm({ error }: { error?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary/95 to-secondary/70 p-4">
      <Card className="w-full max-w-md p-6 animate-fade-in-up">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
            <Shield size={28} className="text-primary" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">Agent Mary</h1>
          <p className="text-sm text-gray-500">Enter password to continue</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 text-center">
            {error}
          </div>
        )}

        <form action="/" method="GET" className="space-y-4">
          <input
            type="password"
            name="p"
            placeholder="Password"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none text-gray-900 placeholder:text-gray-400 text-center text-lg"
            autoFocus
          />

          <div className="flex gap-3">
            <button
              type="submit"
              name="r"
              value="admin"
              className="flex-1 px-4 py-3 bg-primary text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              Admin Login
            </button>
            <button
              type="submit"
              name="r"
              value="tourism"
              className="flex-1 px-4 py-3 bg-secondary text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              Tourism Ministry
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
