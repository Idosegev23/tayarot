'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/ui/AppHeader';
import { Card } from '@/components/ui/Card';
import { PrimaryButton, SecondaryButton } from '@/components/ui/Button';
import { toast } from '@/components/ui/Toast';
import { LOCATIONS } from '@/lib/constants';
import { updatePost } from '@/app/actions/updatePost';
import { createClient } from '@/lib/supabase/client';
import { getTouristSessionId } from '@/lib/touristSession';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import type { Post } from '@/lib/types';

interface PageProps {
  params: Promise<{ guideSlug: string; postId: string }>;
}

export default function EditPostPage({ params }: PageProps) {
  const { guideSlug, postId } = use(params);
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [location, setLocation] = useState('');
  const [experienceText, setExperienceText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchPost() {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('posts')
        .select('*, guide:guides(*)')
        .eq('id', postId)
        .single();

      if (error || !data) {
        toast.error('Post not found');
        router.back();
        return;
      }

      if (data.status !== 'draft') {
        toast.error('Only draft posts can be edited');
        router.back();
        return;
      }

      setPost(data);
      setLocation(data.location_label);
      setExperienceText(data.experience_text);
      setLoading(false);
    }
    fetchPost();
  }, [postId, router]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const result = await updatePost({
        postId,
        touristSessionId: getTouristSessionId(),
        location: location.trim(),
        experienceText: experienceText.trim(),
      });

      if (result.success) {
        toast.success('Post updated!');
        router.push(`/g/${guideSlug}/post/${postId}`);
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to update post');
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <AppHeader guideName={post?.guide?.display_name} showBadge />

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-secondary hover:text-primary transition-colors text-sm"
        >
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>

        <h1 className="text-xl font-bold text-gray-900">Edit Post</h1>

        <Card className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg focus:border-primary focus:outline-none"
            >
              <option value="">Select a location</option>
              {LOCATIONS.map((loc) => (
                <option key={loc.id} value={loc.name}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your Experience</label>
            <div className="relative">
              <textarea
                value={experienceText}
                onChange={(e) => setExperienceText(e.target.value)}
                maxLength={500}
                rows={4}
                className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-200 rounded-lg focus:border-primary focus:outline-none resize-none"
              />
              <span className="absolute bottom-2 right-3 text-xs text-gray-500">
                {experienceText.length}/500
              </span>
            </div>
          </div>
        </Card>

        <div className="space-y-2">
          <PrimaryButton
            onClick={handleSave}
            disabled={saving || !location || !experienceText.trim()}
            fullWidth
            size="lg"
            className="gap-2"
          >
            {saving ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save size={18} />
                Save Changes
              </>
            )}
          </PrimaryButton>
          <SecondaryButton onClick={() => router.back()} fullWidth>
            Cancel
          </SecondaryButton>
        </div>
      </div>
    </div>
  );
}
