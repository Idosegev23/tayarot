'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/ui/AppHeader';
import { Card } from '@/components/ui/Card';
import { SecondaryButton } from '@/components/ui/Button';
import { PostPreview } from '@/components/PostPreview';
import { LoadingState } from '@/components/LoadingState';
import { toast } from '@/components/ui/Toast';
import { createClient } from '@/lib/supabase/client';
import { APP_CONFIG } from '@/lib/constants';
import type { Post } from '@/lib/types';

interface PageProps {
  params: Promise<{ guideSlug: string; postId: string }>;
}

export default function PostPreviewPage({ params }: PageProps) {
  const { postId } = use(params);
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPost();
  }, [postId]);

  const fetchPost = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('posts')
        .select('*, guide:guides(*)')
        .eq('id', postId)
        .single();

      if (error || !data) {
        toast.error('Post not found');
        return;
      }

      setPost(data);
    } catch (error) {
      console.error('Fetch post error:', error);
      toast.error('Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader showBadge />
        <LoadingState text="Loading post..." />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader showBadge />
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Post Not Found</h2>
          <p className="text-gray-600 mb-6">The post you're looking for doesn't exist.</p>
          <SecondaryButton onClick={() => router.back()}>
            Go Back
          </SecondaryButton>
        </div>
      </div>
    );
  }

  const caption = post.experience_text;
  const hashtags = APP_CONFIG.defaultHashtags;

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <AppHeader guideName={post.guide?.display_name} showBadge />

      <div className="max-w-2xl mx-auto px-4 py-6">
        <Card>
          <PostPreview post={post} hashtags={hashtags} />
        </Card>

        {/* Status Info */}
        <div className="mt-4 bg-blue-50 border-2 border-blue-200 rounded-xl p-4 text-center">
          <p className="text-blue-700 text-sm">
            Post Status: <span className="font-semibold capitalize">{post.status}</span>
          </p>
          {post.status === 'published' && (
            <p className="text-blue-600 text-xs mt-1">
              This post has been published to the guide's page
            </p>
          )}
        </div>

        {/* Back Button */}
        <div className="mt-6">
          <SecondaryButton onClick={() => router.back()} fullWidth>
            Go Back
          </SecondaryButton>
        </div>
      </div>
    </div>
  );
}
