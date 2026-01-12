'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/ui/AppHeader';
import { Card } from '@/components/ui/Card';
import { PrimaryButton, SecondaryButton } from '@/components/ui/Button';
import { PostPreview } from '@/components/PostPreview';
import { ShareModal } from '@/components/ShareModal';
import { LoadingState } from '@/components/LoadingState';
import { toast } from '@/components/ui/Toast';
import { createClient } from '@/lib/supabase/client';
import { updatePostStatus } from '@/app/actions/updatePostStatus';
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
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);

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

  const handlePublish = async () => {
    if (!post) return;

    setPublishing(true);

    try {
      const result = await updatePostStatus(post.id, 'published');

      if (result.success) {
        toast.success('Published successfully!');
        setPost({ ...post, status: 'published' });
      } else {
        toast.error(result.error || 'Failed to publish');
      }
    } catch (error) {
      console.error('Publish error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setPublishing(false);
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
    <div className="min-h-screen bg-gray-50 pb-24">
      <AppHeader guideName={post.guide?.display_name} showBadge />

      <div className="max-w-2xl mx-auto px-4 py-6">
        <Card>
          <PostPreview post={post} hashtags={hashtags} />
        </Card>

        {/* Success Message for Published Posts */}
        {post.status === 'published' && (
          <div className="mt-4 bg-green-50 border-2 border-green-200 rounded-xl p-4 text-center">
            <p className="text-green-700 font-medium">
              Post has been published to the guide's page!
            </p>
          </div>
        )}
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
        <div className="max-w-2xl mx-auto space-y-3">
          {post.status !== 'published' && (
            <PrimaryButton
              onClick={handlePublish}
              disabled={publishing}
              fullWidth
              size="lg"
            >
              {publishing ? 'Publishing...' : 'Publish to Guide Page'}
            </PrimaryButton>
          )}
          <SecondaryButton
            onClick={() => setShareModalOpen(true)}
            fullWidth
            size="lg"
          >
            Share on My Page
          </SecondaryButton>
        </div>
      </div>

      {/* Share Modal */}
      <ShareModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        caption={caption}
        hashtags={hashtags}
      />
    </div>
  );
}
