'use client';

import { useState } from 'react';
import { createGuideWithAuth } from '@/app/actions/guideAuth';
import { Card, CardContent } from '@/components/ui/Card';
import { PrimaryButton } from '@/components/ui/Button';
import { GuideCard } from './GuideCard';
import { UserPlus, Mail, Loader2 } from 'lucide-react';
import type { GroupStatus } from '@/lib/types';

interface GuideGroup {
  id: string;
  name: string;
  slug: string;
  status: GroupStatus;
  start_date?: string;
  end_date?: string;
  postsCount: number;
  participantsCount: number;
  daysCount: number;
}

interface GuideData {
  id: string;
  slug: string;
  display_name: string;
  email?: string;
  totalPosts: number;
  groups: GuideGroup[];
}

interface GuidesTabProps {
  role: 'admin' | 'tourism';
  accessKey: string;
  guides: GuideData[];
  onGroupClick?: (groupId: string) => void;
}

export function GuidesTab({ role, accessKey, guides, onGroupClick }: GuidesTabProps) {
  const isAdmin = role === 'admin';
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [slug, setSlug] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim() || !displayName.trim() || !slug.trim()) {
      setError('All fields are required');
      return;
    }

    setCreating(true);
    const result = await createGuideWithAuth(accessKey, email.trim(), displayName.trim(), slug.trim());
    setCreating(false);

    if (result.success) {
      setSuccess(`Guide created! Magic link sent to ${email}`);
      setEmail('');
      setDisplayName('');
      setSlug('');
      setShowForm(false);
      setTimeout(() => setSuccess(''), 5000);
    } else {
      setError(result.error || 'Failed to create guide');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900">Guides ({guides.length})</h2>
        {isAdmin && (
          <PrimaryButton size="sm" onClick={() => setShowForm(!showForm)}>
            <UserPlus size={14} />
            Create Guide
          </PrimaryButton>
        )}
      </div>

      {/* Messages */}
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-sm text-green-700">{success}</div>
      )}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>
      )}

      {/* Create form */}
      {isAdmin && showForm && (
        <Card>
          <CardContent className="pt-4">
            <form onSubmit={handleCreate} className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                <Mail size={16} className="text-primary" />
                <span className="text-sm font-medium text-gray-700">Create Guide with Auth (magic link)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Email"
                  className="px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-primary focus:outline-none"
                  disabled={creating}
                />
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Display Name"
                  className="px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-primary focus:outline-none"
                  disabled={creating}
                />
                <input
                  type="text"
                  value={slug}
                  onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  placeholder="slug"
                  className="px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-primary focus:outline-none font-mono"
                  disabled={creating}
                />
              </div>
              <PrimaryButton type="submit" size="sm" disabled={creating}>
                {creating ? (
                  <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" />Creating...</span>
                ) : 'Create & Send Magic Link'}
              </PrimaryButton>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Guide cards */}
      {guides.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-gray-500 mb-2">No guides configured</p>
            {isAdmin && <p className="text-sm text-gray-400">Create your first guide above</p>}
          </CardContent>
        </Card>
      ) : (
        guides.map(guide => (
          <GuideCard key={guide.id} guide={guide} onGroupClick={onGroupClick} />
        ))
      )}
    </div>
  );
}
