'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Chip, StatusChip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/EmptyState';
import { toast } from '@/components/ui/Toast';
import { updatePostStatus } from '@/app/actions/updatePostStatus';
import { formatDate } from '@/lib/utils';
import { FileText, Eye, Check, Send, Facebook, RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Guide, Post, PostStatus } from '@/lib/types';

interface GuideDashboardProps {
  guide: Guide;
  posts: Post[];
  accessKey: string;
}

export function GuideDashboard({ guide, posts: initialPosts, accessKey }: GuideDashboardProps) {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);
  const [statusFilter, setStatusFilter] = useState<PostStatus | 'all'>('all');
  const [newPostsAvailable, setNewPostsAvailable] = useState(false);

  const fetchLatestPosts = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data } = await supabase
        .from('posts')
        .select('*, guide:guides(*)')
        .eq('guide_id', guide.id)
        .order('created_at', { ascending: false });

      if (data && data.length !== posts.length) {
        setNewPostsAvailable(true);
      }
      if (data) {
        setPosts(data);
        setNewPostsAvailable(false);
      }
    } catch {
      // Silently fail — don't disrupt the dashboard
    }
  }, [guide.id, posts.length]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(fetchLatestPosts, 30_000);
    return () => clearInterval(interval);
  }, [fetchLatestPosts]);

  const handleShareToFacebook = (post: Post) => {
    const postUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/g/${guide.slug}/post/${post.id}`;
    const encodedUrl = encodeURIComponent(postUrl);
    const caption = `${post.experience_text}\n\n📍 ${post.location_label}\n#VisitIsrael #HolyLand`;
    const encodedCaption = encodeURIComponent(caption);
    
    // Facebook Share Dialog - works for both personal pages and guide pages
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedCaption}`;
    window.open(facebookUrl, '_blank', 'width=600,height=400');
    
    toast.success('Opening Facebook to share...');
  };

  const stats = {
    total: posts.length,
    draft: posts.filter((p) => p.status === 'draft').length,
    approved: posts.filter((p) => p.status === 'approved').length,
    published: posts.filter((p) => p.status === 'published').length,
  };

  const filteredPosts = statusFilter === 'all' ? posts : posts.filter((p) => p.status === statusFilter);

  const handleStatusUpdate = async (postId: string, newStatus: PostStatus) => {
    try {
      const result = await updatePostStatus(postId, newStatus, accessKey);

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
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-primary to-primary/80 text-white px-4 py-4 shadow-md">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">{guide.display_name}</p>
            <p className="text-xs text-white/70">Guide Dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-white/60">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-status-pulse" />
              Auto-refresh
            </span>
            <button
              onClick={fetchLatestPosts}
              className="flex items-center gap-1.5 text-xs text-white/80 hover:text-white transition-colors bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white/20"
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Posts', value: stats.total, color: 'from-primary to-secondary', textColor: 'text-primary' },
            { label: 'Drafts', value: stats.draft, color: 'from-gray-400 to-gray-500', textColor: 'text-gray-600' },
            { label: 'Approved', value: stats.approved, color: 'from-secondary to-green-500', textColor: 'text-secondary' },
            { label: 'Published', value: stats.published, color: 'from-green-500 to-green-600', textColor: 'text-green-600' },
          ].map((kpi, i) => (
            <Card key={kpi.label} className={`overflow-hidden animate-fade-in-up stagger-${i + 1}`}>
              <div className={`h-1 -mx-4 -mt-4 mb-3 bg-gradient-to-r ${kpi.color}`} />
              <CardContent className="text-center">
                <p className={`text-3xl font-bold ${kpi.textColor}`}>{kpi.value}</p>
                <p className="text-sm text-gray-500 mt-1">{kpi.label}</p>
              </CardContent>
            </Card>
          ))}
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
            {filteredPosts.map((post, i) => (
              <Card key={post.id} className={`hover:-translate-y-0.5 transition-all animate-fade-in-up ${i < 6 ? `stagger-${i + 1}` : ''}`}>
                <div className="flex gap-4">
                  {/* Thumbnail */}
                  {post.images[0] && (
                    <div className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100">
                      {post.images[0].startsWith('data:') ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={post.images[0]}
                          alt="Post thumbnail"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Image
                          src={post.images[0]}
                          alt="Post thumbnail"
                          fill
                          className="object-cover"
                        />
                      )}
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
                    {post.status === 'published' && (
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleShareToFacebook(post)}
                        className="gap-1 bg-[#1877f2] hover:bg-[#1877f2]/90"
                      >
                        <Facebook size={16} />
                        Share to Facebook
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
