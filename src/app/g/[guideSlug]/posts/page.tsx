'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { AppHeader } from '@/components/ui/AppHeader';
import { Card } from '@/components/ui/Card';
import { StatusChip } from '@/components/ui/Chip';
import { SecondaryButton } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { getTouristSessionId } from '@/lib/touristSession';
import { formatDate } from '@/lib/utils';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { Post } from '@/lib/types';

interface PageProps {
  params: Promise<{ guideSlug: string }>;
}

export default function MyPostsPage({ params }: PageProps) {
  const { guideSlug } = use(params);
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      const sessionId = getTouristSessionId();
      if (!sessionId) {
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const { data } = await supabase
        .from('posts')
        .select('*, guide:guides(*)')
        .eq('tourist_session_id', sessionId)
        .order('created_at', { ascending: false });

      if (data) setPosts(data);
      setLoading(false);
    }
    fetchPosts();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader showBadge />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <button
          onClick={() => router.push(`/g/${guideSlug}`)}
          className="flex items-center gap-1 text-secondary hover:text-primary transition-colors text-sm"
        >
          <ArrowLeft size={16} />
          <span>Back to chat</span>
        </button>

        <h1 className="text-xl font-bold text-gray-900">My Posts</h1>

        {loading && (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        )}

        {!loading && posts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">You haven&apos;t created any posts yet.</p>
            <SecondaryButton onClick={() => router.push(`/g/${guideSlug}/create`)}>
              Share Your Experience
            </SecondaryButton>
          </div>
        )}

        {!loading && posts.length > 0 && (
          <div className="space-y-3">
            {posts.map((post) => (
              <Link key={post.id} href={`/g/${guideSlug}/post/${post.id}`}>
                <Card className="flex gap-3 hover:shadow-md transition-shadow">
                  {post.images[0] && (
                    <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                      {post.images[0].startsWith('data:') ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={post.images[0]}
                          alt={post.location_label}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Image
                          src={post.images[0]}
                          alt={post.location_label}
                          fill
                          className="object-cover"
                        />
                      )}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {post.location_label}
                      </span>
                      <StatusChip status={post.status} />
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-1">{post.experience_text}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(post.created_at)}</p>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
