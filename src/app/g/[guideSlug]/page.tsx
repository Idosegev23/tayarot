import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { ChatInterface } from './ChatInterface';
import { Metadata } from 'next';
import { getAppUrl } from '@/lib/env';

interface PageProps {
  params: Promise<{ guideSlug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { guideSlug } = await params;
  const supabase = await createClient();
  
  const { data: guide } = await supabase
    .from('guides')
    .select('display_name')
    .eq('slug', guideSlug)
    .single();
  
  if (!guide) {
    return {
      title: 'Guide Not Found',
    };
  }
  
  const baseUrl = getAppUrl();
  const title = `Chat with Mary - ${guide.display_name}'s Group`;
  const description = `Join ${guide.display_name}'s Holy Land journey. Share your moments, get AI-powered biblical insights, and create beautiful posts.`;
  
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${baseUrl}/g/${guideSlug}`,
      type: 'website',
      images: [
        {
          url: '/Logo.png',
          width: 1200,
          height: 630,
          alt: 'Agent Mary',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/Logo.png'],
    },
  };
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
