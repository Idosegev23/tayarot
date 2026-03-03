import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { createClient } from '@/lib/supabase/server';
import { Users, Building2, Shield, MessageCircle, Camera, Image, ExternalLink } from 'lucide-react';

export default async function HomePage() {
  const supabase = await createClient();

  // Fetch guides and access keys for demo access
  const [guidesRes, keysRes] = await Promise.all([
    supabase.from('guides').select('id, slug, display_name').order('display_name'),
    supabase.from('access_keys').select('key, role, guide_id, label, active').eq('active', true).order('role'),
  ]);

  const guides = guidesRes.data || [];
  const keys = keysRes.data || [];

  // Map keys by role
  const adminKey = keys.find(k => k.role === 'admin')?.key;
  const tourismKey = keys.find(k => k.role === 'tourism')?.key;
  const guideKeys = keys.filter(k => k.role === 'guide');

  return (
    <div className="min-h-screen bg-primary">
      <div className="min-h-screen bg-black/5 py-12 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-10">
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-3">
              Agent Mary
            </h1>
            <p className="text-xl text-white/90 mb-1">
              Empowering tourism through authentic content creation
            </p>
            <p className="text-sm text-white/60">
              Demo Mode — All features accessible for testing
            </p>
          </div>

          {/* Tourist Experience */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <MessageCircle size={20} />
              Tourist Experience
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {guides.length > 0 ? guides.map(guide => (
                <Card key={guide.id} className="hover:shadow-lg transition-shadow">
                  <h3 className="font-semibold text-gray-900 mb-1">{guide.display_name}</h3>
                  <p className="text-xs text-gray-500 mb-3">/{guide.slug}</p>
                  <div className="space-y-2">
                    <Link
                      href={`/g/${guide.slug}`}
                      className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                    >
                      <MessageCircle size={16} />
                      Chat with Mary
                    </Link>
                    <Link
                      href={`/g/${guide.slug}/create`}
                      className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
                    >
                      <Camera size={16} />
                      Create Post
                    </Link>
                    <Link
                      href={`/g/${guide.slug}/gallery`}
                      className="flex items-center justify-center gap-2 w-full px-3 py-2 border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      <Image size={16} />
                      Gallery
                    </Link>
                  </div>
                </Card>
              )) : (
                <Card className="sm:col-span-2 lg:col-span-3 text-center py-8">
                  <p className="text-gray-500 mb-2">No guides configured yet</p>
                  <p className="text-sm text-gray-400">Use the Admin Dashboard to seed demo data</p>
                </Card>
              )}
            </div>
          </section>

          {/* Dashboards */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Building2 size={20} />
              Dashboards
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Guide Dashboards */}
              {guides.map(guide => {
                const guideKey = guideKeys.find(k => k.guide_id === guide.id)?.key;
                return (
                  <Card key={`dash-${guide.id}`} className="hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="bg-primary/10 w-8 h-8 rounded-full flex items-center justify-center">
                        <Users size={16} className="text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">{guide.display_name}</h3>
                        <p className="text-xs text-gray-500">Guide Dashboard</p>
                      </div>
                    </div>
                    {guideKey ? (
                      <Link
                        href={`/d/guide/${guide.slug}?k=${guideKey}`}
                        className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                      >
                        <ExternalLink size={14} />
                        Open Dashboard
                      </Link>
                    ) : (
                      <p className="text-xs text-gray-400 text-center py-2">No access key found</p>
                    )}
                  </Card>
                );
              })}

              {/* Tourism Dashboard */}
              <Card className="hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-accent/10 w-8 h-8 rounded-full flex items-center justify-center">
                    <Building2 size={16} className="text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Tourism Ministry</h3>
                    <p className="text-xs text-gray-500">All content across guides</p>
                  </div>
                </div>
                {tourismKey ? (
                  <Link
                    href={`/d/tourism?k=${tourismKey}`}
                    className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-accent text-white rounded-lg text-sm font-medium hover:bg-accent/90 transition-colors"
                  >
                    <ExternalLink size={14} />
                    Open Dashboard
                  </Link>
                ) : (
                  <p className="text-xs text-gray-400 text-center py-2">No access key — seed demo data first</p>
                )}
              </Card>

              {/* Admin Dashboard */}
              <Card className="hover:shadow-lg transition-shadow">
                <div className="flex items-center gap-2 mb-2">
                  <div className="bg-warm/10 w-8 h-8 rounded-full flex items-center justify-center">
                    <Shield size={16} className="text-warm" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Admin Panel</h3>
                    <p className="text-xs text-gray-500">Configure system & data</p>
                  </div>
                </div>
                {adminKey ? (
                  <Link
                    href={`/d/admin?k=${adminKey}`}
                    className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-warm text-white rounded-lg text-sm font-medium hover:bg-warm/90 transition-colors"
                  >
                    <ExternalLink size={14} />
                    Open Dashboard
                  </Link>
                ) : (
                  <p className="text-xs text-gray-400 text-center py-2">No admin key found</p>
                )}
              </Card>
            </div>
          </section>

          {/* Info Banner */}
          <Card className="bg-white/95">
            <div className="text-center">
              <p className="text-sm text-gray-600">
                This is a <strong>demo environment</strong> — all dashboards and features are accessible for testing.
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Access keys are pre-filled in links. In production, keys would be distributed privately.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
