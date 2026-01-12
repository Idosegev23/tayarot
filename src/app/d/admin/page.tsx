import { createClient } from '@/lib/supabase/server';
import { validateAccess } from '@/lib/supabase/access';
import { AdminDashboard } from './AdminDashboard';

interface PageProps {
  searchParams: Promise<{ k?: string }>;
}

export default async function AdminDashboardPage({ searchParams }: PageProps) {
  const { k: accessKey } = await searchParams;

  // Validate access
  const accessResult = await validateAccess(accessKey || null, 'admin');

  if (!accessResult.valid) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Access Denied</h1>
          <p className="text-gray-600">{accessResult.error || 'Invalid access key'}</p>
        </div>
      </div>
    );
  }

  const supabase = await createClient();

  // Fetch all data
  const [guidesRes, keysRes, settingsRes] = await Promise.all([
    supabase.from('guides').select('*, posts(count)').order('created_at', { ascending: false }),
    supabase.from('access_keys').select('*, guide:guides(slug, display_name)').order('created_at', { ascending: false }),
    supabase.from('app_settings').select('*').limit(1).single(),
  ]);

  return (
    <AdminDashboard
      guides={guidesRes.data || []}
      accessKeys={keysRes.data || []}
      settings={settingsRes.data || {
        id: '',
        hashtags: ['#VisitIsrael', '#HolyLand'],
        verse_mode_enabled: true,
        max_images_per_post: 5,
        demo_banner_text: 'This is a demonstration system',
      }}
    />
  );
}
