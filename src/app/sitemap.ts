import { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getAppUrl } from '@/lib/env';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getAppUrl();
  const supabase = await createClient();

  // Fetch all guides
  const { data: guides } = await supabase
    .from('guides')
    .select('slug, created_at')
    .order('created_at', { ascending: false });

  // Fetch recent published posts with guides
  const { data: posts } = await supabase
    .from('posts')
    .select(`
      id,
      guide_id,
      created_at,
      guides!inner(slug)
    `)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(100);

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 1,
    },
  ];

  // Guide pages (tourist-facing)
  const guidePages: MetadataRoute.Sitemap = (guides || []).map((guide) => ({
    url: `${baseUrl}/g/${guide.slug}`,
    lastModified: new Date(guide.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // Published post pages
  const postPages: MetadataRoute.Sitemap = (posts || [])
    .filter((post): post is typeof post & { guides: { slug: string } } => {
      return post.guides !== null && typeof post.guides === 'object' && 'slug' in post.guides;
    })
    .map((post) => ({
      url: `${baseUrl}/g/${post.guides.slug}/post/${post.id}`,
      lastModified: new Date(post.created_at),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));

  return [...staticPages, ...guidePages, ...postPages];
}
