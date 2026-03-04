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
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary/95 to-secondary/70">
      <div className="min-h-screen py-12 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Hero */}
          <div className="text-center mb-12 animate-fade-in-up">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <img src="/Logo.png" alt="Agent Mary" className="w-14 h-14 object-contain" />
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-3">
              Agent Mary
            </h1>
            <p className="text-xl text-white/90 mb-1">
              Empowering tourism through authentic content creation
            </p>
            <p className="text-sm text-white/50 mt-2">
              Demo Mode — All features accessible for testing
            </p>
          </div>

          {/* Tourist Experience */}
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 animate-fade-in-up stagger-2">
              <MessageCircle size={20} />
              Tourist Experience
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {guides.length > 0 ? guides.map((guide, i) => (
                <Card key={guide.id} variant="glass" className={`hover:shadow-xl hover:-translate-y-1 animate-fade-in-up stagger-${Math.min(i + 3, 6)}`}>
                  <div className="h-1 -mx-4 -mt-4 mb-3 rounded-t-2xl bg-gradient-to-r from-primary to-secondary" />
                  <h3 className="font-semibold text-gray-900 mb-1">{guide.display_name}</h3>
                  <p className="text-xs text-gray-500 mb-3">/{guide.slug}</p>
                  <div className="space-y-2">
                    <Link
                      href={`/g/${guide.slug}`}
                      className="flex items-center justify-center gap-2 w-full px-3 py-2.5 bg-gradient-to-r from-primary to-primary/90 text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-primary/25 transition-all"
                    >
                      <MessageCircle size={16} />
                      Chat with Mary
                    </Link>
                    <Link
                      href={`/g/${guide.slug}/create`}
                      className="flex items-center justify-center gap-2 w-full px-3 py-2.5 bg-gradient-to-r from-warm to-accent text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-warm/25 transition-all"
                    >
                      <Camera size={16} />
                      Create Post
                    </Link>
                    <Link
                      href={`/g/${guide.slug}/gallery`}
                      className="flex items-center justify-center gap-2 w-full px-3 py-2.5 bg-white/60 text-gray-700 rounded-xl text-sm font-medium hover:bg-white/80 transition-all border border-white/40"
                    >
                      <Image size={16} />
                      Gallery
                    </Link>
                  </div>
                </Card>
              )) : (
                <Card variant="glass" className="sm:col-span-2 lg:col-span-3 text-center py-8">
                  <p className="text-gray-500 mb-2">No guides configured yet</p>
                  <p className="text-sm text-gray-400">Use the Admin Dashboard to seed demo data</p>
                </Card>
              )}
            </div>
          </section>

          {/* Dashboards */}
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 animate-fade-in-up">
              <Building2 size={20} />
              Dashboards
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Guide Dashboards */}
              {guides.map((guide, i) => {
                const guideKey = guideKeys.find(k => k.guide_id === guide.id)?.key;
                return (
                  <Card key={`dash-${guide.id}`} variant="glass" className={`hover:shadow-xl hover:-translate-y-1 animate-fade-in-up stagger-${Math.min(i + 1, 6)}`}>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="bg-gradient-to-br from-primary/20 to-primary/10 w-10 h-10 rounded-full flex items-center justify-center">
                        <Users size={18} className="text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">{guide.display_name}</h3>
                        <p className="text-xs text-gray-500">Guide Dashboard</p>
                      </div>
                    </div>
                    {guideKey ? (
                      <Link
                        href={`/d/guide/${guide.slug}?k=${guideKey}`}
                        className="flex items-center justify-center gap-2 w-full px-3 py-2.5 bg-gradient-to-r from-primary to-primary/90 text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-primary/25 transition-all"
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
              <Card variant="glass" className="hover:shadow-xl hover:-translate-y-1 animate-fade-in-up stagger-3">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-gradient-to-br from-accent/20 to-accent/10 w-10 h-10 rounded-full flex items-center justify-center">
                    <Building2 size={18} className="text-accent" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Tourism Ministry</h3>
                    <p className="text-xs text-gray-500">All content across guides</p>
                  </div>
                </div>
                {tourismKey ? (
                  <Link
                    href={`/d/tourism?k=${tourismKey}`}
                    className="flex items-center justify-center gap-2 w-full px-3 py-2.5 bg-gradient-to-r from-accent to-warm text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-accent/25 transition-all"
                  >
                    <ExternalLink size={14} />
                    Open Dashboard
                  </Link>
                ) : (
                  <p className="text-xs text-gray-400 text-center py-2">No access key — seed demo data first</p>
                )}
              </Card>

              {/* Admin Dashboard */}
              <Card variant="glass" className="hover:shadow-xl hover:-translate-y-1 animate-fade-in-up stagger-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-gradient-to-br from-warm/20 to-warm/10 w-10 h-10 rounded-full flex items-center justify-center">
                    <Shield size={18} className="text-warm" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Admin Panel</h3>
                    <p className="text-xs text-gray-500">Configure system & data</p>
                  </div>
                </div>
                {adminKey ? (
                  <Link
                    href={`/d/admin?k=${adminKey}`}
                    className="flex items-center justify-center gap-2 w-full px-3 py-2.5 bg-gradient-to-r from-warm to-warm/90 text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-warm/25 transition-all"
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
          <Card variant="glass" className="animate-fade-in-up stagger-5">
            <div className="text-center">
              <p className="text-sm text-gray-700">
                This is a <strong>demo environment</strong> — all dashboards and features are accessible for testing.
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Access keys are pre-filled in links. In production, keys would be distributed privately.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
