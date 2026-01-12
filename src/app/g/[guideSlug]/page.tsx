import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { ChatInterface } from './ChatInterface';

interface PageProps {
  params: Promise<{ guideSlug: string }>;
}

export default async function GuideLandingPage({ params }: PageProps) {
  const { guideSlug } = await params;
  const supabase = await createClient();

  // Fetch guide
  const { data: guide } = await supabase
    .from('guides')
    .select('*')
    .eq('slug', guideSlug)
    .single();

  if (!guide) {
    notFound();
  }

  return <ChatInterface guideSlug={guide.slug} guideName={guide.display_name} />;
}
