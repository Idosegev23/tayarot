import { createClient } from '@/lib/supabase/server';
import { validateAccess } from '@/lib/supabase/access';
import { TourismDashboard } from './TourismDashboard';

interface PageProps {
  searchParams: Promise<{ k?: string }>;
}

export default async function TourismDashboardPage({ searchParams }: PageProps) {
  const { k: accessKey } = await searchParams;

  // Validate access
  const accessResult = await validateAccess(accessKey || null, 'tourism');

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

  // Fetch posts with guide info
  const { data: posts } = await supabase
    .from('posts')
    .select('*, guide:guides(*)')
    .order('created_at', { ascending: false });

  // Fetch guides
  const { data: guides } = await supabase
    .from('guides')
    .select('*')
    .order('display_name');

  return <TourismDashboard posts={posts || []} guides={guides || []} />;
}
