'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Chip, StatusChip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/EmptyState';
import { toast } from '@/components/ui/Toast';
import { updatePostStatus } from '@/app/actions/updatePostStatus';
import { formatDate } from '@/lib/utils';
import { FileText, Eye, Check, Send } from 'lucide-react';
import type { Guide, Post, PostStatus } from '@/lib/types';

interface GuideDashboardProps {
  guide: Guide;
  posts: Post[];
}

export function GuideDashboard({ guide, posts: initialPosts }: GuideDashboardProps) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);
  const [statusFilter, setStatusFilter] = useState<PostStatus | 'all'>('all');

  const stats = {
    total: posts.length,
    draft: posts.filter((p) => p.status === 'draft').length,
    approved: posts.filter((p) => p.status === 'approved').length,
    published: posts.filter((p) => p.status === 'published').length,
  };

  const filteredPosts = statusFilter === 'all' ? posts : posts.filter((p) => p.status === statusFilter);

  const handleStatusUpdate = async (postId: string, newStatus: PostStatus) => {
    try {
      const result = await updatePostStatus(postId, newStatus);

      if (result.success) {
        setPosts(posts.map((p) => (p.id === postId ? { ...p, status: newStatus } : p)));
        toast.success(`Post ${newStatus}`);
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Status update error:', error);
      toast.error('An unexpected error occurred');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Banner */}
      <div className="bg-primary text-white px-4 py-3">
        <div className="max-w-6xl mx-auto">
          <p className="text-sm font-medium">Demo Access: Guide - {guide.display_name}</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="text-center">
              <p className="text-3xl font-bold text-primary">{stats.total}</p>
              <p className="text-sm text-gray-600 mt-1">Total Posts</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center">
              <p className="text-3xl font-bold text-gray-600">{stats.draft}</p>
              <p className="text-sm text-gray-600 mt-1">Drafts</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center">
              <p className="text-3xl font-bold text-secondary">{stats.approved}</p>
              <p className="text-sm text-gray-600 mt-1">Approved</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center">
              <p className="text-3xl font-bold text-green-600">{stats.published}</p>
              <p className="text-sm text-gray-600 mt-1">Published</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Posts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Chip
                variant={statusFilter === 'all' ? 'primary' : 'default'}
                onClick={() => setStatusFilter('all')}
              >
                All ({stats.total})
              </Chip>
              <Chip
                variant={statusFilter === 'draft' ? 'primary' : 'default'}
                onClick={() => setStatusFilter('draft')}
              >
                Draft ({stats.draft})
              </Chip>
              <Chip
                variant={statusFilter === 'approved' ? 'primary' : 'default'}
                onClick={() => setStatusFilter('approved')}
              >
                Approved ({stats.approved})
              </Chip>
              <Chip
                variant={statusFilter === 'published' ? 'primary' : 'default'}
                onClick={() => setStatusFilter('published')}
              >
                Published ({stats.published})
              </Chip>
            </div>
          </CardContent>
        </Card>

        {/* Posts List */}
        {filteredPosts.length === 0 ? (
          <EmptyState
            icon={<FileText size={48} />}
            title="No posts found"
            description="No posts match the selected filter"
          />
        ) : (
          <div className="space-y-4">
            {filteredPosts.map((post) => (
              <Card key={post.id}>
                <div className="flex gap-4">
                  {/* Thumbnail */}
                  {post.images[0] && (
                    <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                      <Image
                        src={post.images[0]}
                        alt="Post thumbnail"
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      {post.tourist_name && (
                        <span className="font-medium text-gray-900">{post.tourist_name}</span>
                      )}
                      <Chip size="sm">{post.location_label}</Chip>
                      <StatusChip status={post.status} />
                      {post.style === 'holy_land' && <Chip variant="warm" size="sm">Holy Land</Chip>}
                    </div>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">{post.experience_text}</p>
                    <p className="text-xs text-gray-500">{formatDate(post.created_at)}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {post.status === 'draft' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleStatusUpdate(post.id, 'approved')}
                        className="gap-1"
                      >
                        <Check size={16} />
                        Approve
                      </Button>
                    )}
                    {post.status === 'approved' && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleStatusUpdate(post.id, 'published')}
                        className="gap-1"
                      >
                        <Send size={16} />
                        Publish
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => router.push(`/g/${guide.slug}/post/${post.id}`)}
                      className="gap-1"
                    >
                      <Eye size={16} />
                      View
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
