import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { getAppUrl } from '@/lib/env';
import { truncateText } from '@/lib/utils';
import { AppHeader } from '@/components/ui/AppHeader';
import { Chip } from '@/components/ui/Chip';
import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import type { Post, Guide } from '@/lib/types';

interface PageProps {
  params: Promise<{ guideSlug: string }>;
}

async function getGuide(slug: string): Promise<Guide | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('guides')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) return null;
  return data as Guide;
}

async function getPublishedPosts(guideId: string): Promise<Post[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('posts')
    .select('*, guide:guides(*)')
    .eq('guide_id', guideId)
    .eq('status', 'published')
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data as Post[];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { guideSlug } = await params;
  const guide = await getGuide(guideSlug);

  if (!guide) {
    return { title: 'Guide Not Found' };
  }

  const baseUrl = getAppUrl();
  const title = `Gallery — ${guide.display_name} | Agent Mary`;
  const description = `Browse published travel moments from ${guide.display_name}'s Holy Land tours. Photos, stories, and biblical insights from real tourists.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${baseUrl}/g/${guideSlug}/gallery`,
      type: 'website',
      images: [
        {
          url: '/Logo.png',
          width: 1200,
          height: 630,
          alt: 'Agent Mary Gallery',
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

export default async function GalleryPage({ params }: PageProps) {
  const { guideSlug } = await params;
  const guide = await getGuide(guideSlug);

  if (!guide) {
    notFound();
  }

  const posts = await getPublishedPosts(guide.id);

  return (
    <div className="min-h-screen bg-gradient-to-b from-light to-white">
      <AppHeader guideName={guide.display_name} showBadge />

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Navigation and title */}
        <div className="mb-6 animate-fade-in-up">
          <Link
            href={`/g/${guideSlug}`}
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline mb-3"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5" />
              <path d="m12 19-7-7 7-7" />
            </svg>
            Back to chat
          </Link>
          <h1 className="text-2xl font-bold text-foreground">
            Gallery
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {posts.length} published {posts.length === 1 ? 'moment' : 'moments'}
          </p>
        </div>

        {/* Empty state */}
        {posts.length === 0 && (
          <div className="text-center py-16 animate-fade-in-up">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-primary/50"
              >
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-700 mb-1">
              No posts yet
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Published travel moments will appear here.
            </p>
            <Link
              href={`/g/${guideSlug}`}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-primary to-secondary text-white px-5 py-2.5 rounded-full text-sm font-medium hover:shadow-lg hover:shadow-primary/25 transition-all"
            >
              Share your experience
            </Link>
          </div>
        )}

        {/* Post grid — Instagram style */}
        {posts.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-1 md:gap-1.5">
            {posts.map((post, index) => (
              <GalleryCard key={post.id} post={post} guideSlug={guideSlug} index={index} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function GalleryCard({ post, guideSlug, index }: { post: Post; guideSlug: string; index: number }) {
  const thumbnail = post.images?.[0];
  const isBase64 = thumbnail?.startsWith('data:');
  const isUrl = thumbnail?.startsWith('http');
  const hasImage = thumbnail && (isBase64 || isUrl);
  const staggerClass = index < 6 ? `stagger-${Math.min(index + 1, 6)}` : '';

  return (
    <Link
      href={`/g/${guideSlug}/post/${post.id}`}
      className={`group block overflow-hidden bg-gray-100 relative animate-fade-in ${staggerClass}`}
    >
      {/* Square thumbnail */}
      <div className="relative w-full aspect-square">
        {hasImage ? (
          isBase64 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={thumbnail}
              alt={post.location_label}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <Image
              src={thumbnail}
              alt={post.location_label}
              fill
              sizes="(max-width: 768px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          )
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-100">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
            </svg>
          </div>
        )}

        {/* Hover overlay — Instagram style */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <div className="text-white text-center px-2">
            <p className="text-sm font-semibold drop-shadow-md">{post.location_label}</p>
            {post.experience_text && (
              <p className="text-xs mt-1 line-clamp-2 drop-shadow-md opacity-90">
                {truncateText(post.experience_text, 60)}
              </p>
            )}
          </div>
        </div>

        {/* Style badge */}
        {post.style === 'holy_land' && (
          <div className="absolute top-2 left-2">
            <Chip variant="warm" size="sm">
              Holy Land
            </Chip>
          </div>
        )}
      </div>
    </Link>
  );
}
