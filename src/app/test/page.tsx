import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { TestBotLinks } from './TestBotLinks';
import { Shield, Users, MessageCircle, Camera } from 'lucide-react';

export const metadata = {
  title: 'Agent Mary — Test Guide',
};

export default async function TestPage() {
  const supabase = await createClient();

  // Fetch guides + groups + participants
  const { data: guides } = await supabase
    .from('guides')
    .select('slug, display_name, email')
    .order('created_at');

  const { data: groups } = await supabase
    .from('groups')
    .select('slug, name, status, guide:guides(slug, display_name), group_participants(first_name, last_name)')
    .eq('status', 'active')
    .order('created_at');

  const hasData = (guides?.length || 0) > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Agent Mary</h1>
          <p className="text-gray-600">
            AI-powered tourism content platform. Tourists share travel experiences,
            guides manage groups, and AI generates styled content.
          </p>
        </div>

        {!hasData ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-gray-500 mb-2 text-lg">No test data configured yet</p>
              <p className="text-sm text-gray-400">
                Ask the admin to log in and click &quot;Seed Demo Data&quot; on the dashboard.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* How to test as Admin */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-warm">
                  <Shield size={20} />
                  Test as Admin
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-gray-600">
                  The admin dashboard lets you manage guides, groups, access keys, and settings.
                </p>
                <TestBotLinks
                  items={[{ path: '/?p=123456&r=admin', label: 'Admin Dashboard', hint: 'Password: 123456' }]}
                />
              </CardContent>
            </Card>

            {/* How to test as Tourist */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-secondary">
                  <Camera size={20} />
                  Test as Tourist
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600">
                  Tourists can chat with the AI assistant, share photos, and create styled posts.
                </p>

                {/* General chat */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">General Chat (no login needed)</p>
                  <TestBotLinks
                    items={(guides || []).map(g => ({
                      path: `/g/${g.slug}`,
                      label: g.display_name,
                    }))}
                  />
                </div>

                {/* Group chat (name-gated) */}
                {(groups?.length || 0) > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Group Chat (name validation required)</p>
                    <TestBotLinks
                      items={(groups || []).map(g => {
                        const guide = g.guide as unknown as { slug: string; display_name: string } | null;
                        const participants = (g.group_participants as unknown as { first_name: string; last_name: string }[]) || [];
                        const names = participants.slice(0, 3).map(p => `${p.first_name} ${p.last_name}`).join(', ');
                        return {
                          path: `/t/${guide?.slug || ''}/${g.slug}`,
                          label: g.name,
                          hint: names ? `Enter as: ${names}` : undefined,
                        };
                      })}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* How to test as Guide */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Users size={20} />
                  Test as Guide
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-gray-600">
                  Guides manage their groups, add participants, build itineraries, and approve tourist posts.
                </p>
                <TestBotLinks
                  items={[{ path: '/guide/login', label: 'Guide Login', hint: 'Password: guide123' }]}
                />
                {(guides || []).filter(g => g.email).length > 0 && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-xl">
                    <p className="text-xs font-semibold text-gray-500 mb-1">Guide accounts:</p>
                    {(guides || []).filter(g => g.email).map(g => (
                      <p key={g.slug} className="text-sm text-gray-700">{g.display_name} — {g.email}</p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* What to test */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle size={20} />
                  What to Test
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold mt-0.5">1.</span>
                    <span>Open a tourist chat link and talk to Mary about Israel</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold mt-0.5">2.</span>
                    <span>Tap the camera button to create a post with a photo</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold mt-0.5">3.</span>
                    <span>Try the group chat — enter a participant name to verify the gate</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold mt-0.5">4.</span>
                    <span>Log in as admin and explore the dashboard tabs</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-bold mt-0.5">5.</span>
                    <span>Check the gallery page for published posts</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
