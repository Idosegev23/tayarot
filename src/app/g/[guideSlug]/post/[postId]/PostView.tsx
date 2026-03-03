'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/ui/AppHeader';
import { Card } from '@/components/ui/Card';
import { PrimaryButton, SecondaryButton } from '@/components/ui/Button';
import { PostPreview } from '@/components/PostPreview';
import { toast } from '@/components/ui/Toast';
import { deletePost } from '@/app/actions/deletePost';
import { getTouristSessionId } from '@/lib/touristSession';
import { Trash2, Pencil } from 'lucide-react';
import type { Post } from '@/lib/types';

interface PostViewProps {
  post: Post;
  hashtags: readonly string[] | string[];
  guideSlug: string;
}

export function PostView({ post, hashtags, guideSlug }: PostViewProps) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const isDraft = post.status === 'draft';

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const sessionId = getTouristSessionId();
      const result = await deletePost(post.id, sessionId);
      if (result.success) {
        toast.success('Post deleted');
        router.push(`/g/${guideSlug}`);
      } else {
        toast.error(result.error || 'Failed to delete post');
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

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
              This post has been published to the guide&apos;s page
            </p>
          )}
        </div>

        {/* Draft actions: Edit & Delete */}
        {isDraft && (
          <div className="mt-4 flex gap-3">
            <SecondaryButton
              onClick={() => router.push(`/g/${guideSlug}/post/${post.id}/edit`)}
              fullWidth
              className="gap-2"
            >
              <Pencil size={16} />
              Edit Post
            </SecondaryButton>
            <SecondaryButton
              onClick={() => setConfirmDelete(true)}
              fullWidth
              className="gap-2 border-red-300 text-red-600 hover:bg-red-50"
            >
              <Trash2 size={16} />
              Delete
            </SecondaryButton>
          </div>
        )}

        {/* Delete Confirmation */}
        {confirmDelete && (
          <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-4 text-center space-y-3">
            <p className="text-red-700 text-sm font-medium">Are you sure you want to delete this post?</p>
            <div className="flex gap-3">
              <PrimaryButton
                onClick={handleDelete}
                disabled={deleting}
                fullWidth
                className="bg-red-600 hover:bg-red-700"
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </PrimaryButton>
              <SecondaryButton onClick={() => setConfirmDelete(false)} fullWidth>
                Cancel
              </SecondaryButton>
            </div>
          </div>
        )}

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
