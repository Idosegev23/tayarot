'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Chip, StatusChip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/EmptyState';
import { PostPreview } from '@/components/PostPreview';
import { formatDate } from '@/lib/utils';
import { LOCATIONS, APP_CONFIG } from '@/lib/constants';
import { FileText, X } from 'lucide-react';
import type { Post, Guide, PostStatus } from '@/lib/types';

interface TourismDashboardProps {
  posts: Post[];
  guides: Guide[];
}

export function TourismDashboard({ posts, guides }: TourismDashboardProps) {
  const [selectedGuide, setSelectedGuide] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<PostStatus | 'all'>('all');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  // Calculate stats
  const totalPosts = posts.length;
  const totalGuides = guides.length;
  const [oneWeekAgo] = useState(() => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
  const publishedThisWeek = posts.filter(
    (p) => p.status === 'published' && new Date(p.created_at) > oneWeekAgo
  ).length;

  // Filter posts
  let filteredPosts = posts;
  if (selectedGuide !== 'all') {
    filteredPosts = filteredPosts.filter((p) => p.guide?.slug === selectedGuide);
  }
  if (selectedLocation !== 'all') {
    filteredPosts = filteredPosts.filter((p) => p.location_label === selectedLocation);
  }
  if (selectedStatus !== 'all') {
    filteredPosts = filteredPosts.filter((p) => p.status === selectedStatus);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Banner */}
      <div className="bg-accent text-white px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <p className="text-sm font-medium">Demo Access: Ministry of Tourism</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="text-center">
              <p className="text-4xl font-bold text-primary">{totalPosts}</p>
              <p className="text-sm text-gray-600 mt-1">Total Posts</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center">
              <p className="text-4xl font-bold text-secondary">{totalGuides}</p>
              <p className="text-sm text-gray-600 mt-1">Active Guides</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center">
              <p className="text-4xl font-bold text-green-600">{publishedThisWeek}</p>
              <p className="text-sm text-gray-600 mt-1">Published This Week</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Guide Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Guide
              </label>
              <select
                value={selectedGuide}
                onChange={(e) => setSelectedGuide(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none"
              >
                <option value="all">All Guides</option>
                {guides.map((guide) => (
                  <option key={guide.id} value={guide.slug}>
                    {guide.display_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Location Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <select
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none"
              >
                <option value="all">All Locations</option>
                {LOCATIONS.map((loc) => (
                  <option key={loc.id} value={loc.name}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Chips */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <div className="flex flex-wrap gap-2">
                <Chip
                  variant={selectedStatus === 'all' ? 'primary' : 'default'}
                  onClick={() => setSelectedStatus('all')}
                >
                  All
                </Chip>
                <Chip
                  variant={selectedStatus === 'draft' ? 'primary' : 'default'}
                  onClick={() => setSelectedStatus('draft')}
                >
                  Draft
                </Chip>
                <Chip
                  variant={selectedStatus === 'approved' ? 'primary' : 'default'}
                  onClick={() => setSelectedStatus('approved')}
                >
                  Approved
                </Chip>
                <Chip
                  variant={selectedStatus === 'published' ? 'primary' : 'default'}
                  onClick={() => setSelectedStatus('published')}
                >
                  Published
                </Chip>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gallery */}
        {filteredPosts.length === 0 ? (
          <EmptyState
            icon={<FileText size={48} />}
            title="No posts found"
            description="No posts match the selected filters"
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredPosts.map((post) => (
              <Card
                key={post.id}
                onClick={() => setSelectedPost(post)}
                className="cursor-pointer hover:shadow-xl transition-shadow"
              >
                {/* Image */}
                {post.images[0] && (
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 mb-3">
                    <Image
                      src={post.images[0]}
                      alt={post.location_label}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}

                {/* Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Chip size="sm">{post.location_label}</Chip>
                    <StatusChip status={post.status} />
                  </div>
                  {post.guide && (
                    <p className="text-sm font-medium text-gray-700">{post.guide.display_name}</p>
                  )}
                  <p className="text-xs text-gray-500">{formatDate(post.created_at)}</p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Post Detail Modal */}
      {selectedPost && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full my-8"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white rounded-t-2xl">
              <div>
                <h2 className="text-lg font-semibold">Post Details</h2>
                {selectedPost.guide && (
                  <p className="text-sm text-gray-600">{selectedPost.guide.display_name}</p>
                )}
              </div>
              <button
                onClick={() => setSelectedPost(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              <PostPreview post={selectedPost} hashtags={APP_CONFIG.defaultHashtags} showActions={false} />
              
              {/* Metadata */}
              <div className="mt-6 pt-6 border-t space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Status</span>
                  <StatusChip status={selectedPost.status} />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Created</span>
                  <span className="text-gray-900">{formatDate(selectedPost.created_at)}</span>
                </div>
                {selectedPost.tourist_name && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Tourist</span>
                    <span className="text-gray-900">{selectedPost.tourist_name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
