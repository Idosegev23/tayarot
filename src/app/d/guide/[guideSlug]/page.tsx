import { createClient } from '@/lib/supabase/server';
import { validateAccess } from '@/lib/supabase/access';
import { notFound, redirect } from 'next/navigation';
import { GuideDashboard } from './GuideDashboard';

interface PageProps {
  params: Promise<{ guideSlug: string }>;
  searchParams: Promise<{ k?: string }>;
}

export default async function GuideDashboardPage({ params, searchParams }: PageProps) {
  const { guideSlug } = await params;
  const { k: accessKey } = await searchParams;

  // Validate access
  const accessResult = await validateAccess(accessKey || null, 'guide', guideSlug);

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

  // Fetch guide
  const supabase = await createClient();
  const { data: guide } = await supabase
    .from('guides')
    .select('*')
    .eq('slug', guideSlug)
    .single();

  if (!guide) {
    notFound();
  }

  // Fetch posts
  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('guide_id', guide.id)
    .order('created_at', { ascending: false });

  return <GuideDashboard guide={guide} posts={posts || []} />;
}
