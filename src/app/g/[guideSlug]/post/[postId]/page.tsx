import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { APP_CONFIG } from '@/lib/constants';
import { PostView } from './PostView';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ guideSlug: string; postId: string }>;
}

async function getPost(postId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('posts')
    .select('*, guide:guides(*)')
    .eq('id', postId)
    .single();

  if (error || !data) return null;
  return data;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { postId } = await params;
  const post = await getPost(postId);

  if (!post) {
    return { title: 'Post Not Found' };
  }

  const title = `${post.location_label} — ${post.guide?.display_name || 'Agent Mary'}`;
  const description = post.experience_text?.slice(0, 160) || 'A travel experience shared via Agent Mary';

  // Use generated image URL if available (not base64)
  const ogImage = post.images?.[0]?.startsWith('http') ? post.images[0] : undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      ...(ogImage && { images: [{ url: ogImage, width: 1080, height: 1080 }] }),
    },
    twitter: {
      card: ogImage ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(ogImage && { images: [ogImage] }),
    },
  };
}

export default async function PostPreviewPage({ params }: PageProps) {
  const { guideSlug, postId } = await params;
  const post = await getPost(postId);

  if (!post) {
    notFound();
  }

  const hashtags = APP_CONFIG.defaultHashtags;

  return <PostView post={post} hashtags={hashtags} guideSlug={guideSlug} />;
}
