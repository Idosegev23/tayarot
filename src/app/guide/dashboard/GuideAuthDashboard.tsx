'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signOutGuide } from '@/app/actions/guideAuth';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { LogOut, Users, FileText, Plus } from 'lucide-react';
import type { GuideWithAuth, Group } from '@/lib/types';

interface GuideAuthDashboardProps {
  guide: GuideWithAuth;
  groups: Group[];
  postsCount: number;
}

export function GuideAuthDashboard({ guide, groups, postsCount }: GuideAuthDashboardProps) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const handleSignOut = async () => {
    setSigningOut(true);
    await signOutGuide();
    router.push('/guide/login');
    router.refresh();
  };

  const activeGroups = groups.filter(g => g.status === 'active');
  const completedGroups = groups.filter(g => g.status !== 'active');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{guide.display_name}</h1>
            <p className="text-sm text-gray-500">{guide.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors text-sm"
          >
            <LogOut size={18} />
            {signingOut ? 'Signing out...' : 'Sign Out'}
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="text-center py-4">
              <div className="text-3xl font-bold text-primary">{groups.length}</div>
              <div className="text-sm text-gray-600 mt-1">Groups</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center py-4">
              <div className="text-3xl font-bold text-secondary">{activeGroups.length}</div>
              <div className="text-sm text-gray-600 mt-1">Active</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="text-center py-4">
              <div className="text-3xl font-bold text-warm">{postsCount}</div>
              <div className="text-sm text-gray-600 mt-1">Posts</div>
            </CardContent>
          </Card>
        </div>

        {/* Active Groups */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">Active Groups</h2>
            <button
              onClick={() => router.push('/guide/dashboard/groups/create')}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-medium text-sm hover:opacity-90 transition-opacity"
            >
              <Plus size={18} />
              New Group
            </button>
          </div>

          {activeGroups.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Users size={48} className="mx-auto text-gray-300 mb-3" />
                <p className="text-gray-500 mb-4">No active groups yet</p>
                <button
                  onClick={() => router.push('/guide/dashboard/groups/create')}
                  className="px-6 py-2 bg-primary text-white rounded-xl font-medium text-sm hover:opacity-90 transition-opacity"
                >
                  Create Your First Group
                </button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {activeGroups.map((group) => (
                <Card
                  key={group.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => router.push(`/guide/dashboard/groups/${group.id}`)}
                >
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{group.name}</h3>
                        {group.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-1">{group.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          {group.start_date && (
                            <span>{new Date(group.start_date).toLocaleDateString()}</span>
                          )}
                          {group.end_date && (
                            <>
                              <span>-</span>
                              <span>{new Date(group.end_date).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <Chip size="sm" variant="success">Active</Chip>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Completed Groups */}
        {completedGroups.length > 0 && (
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Past Groups</h2>
            <div className="space-y-3">
              {completedGroups.map((group) => (
                <Card
                  key={group.id}
                  className="cursor-pointer hover:shadow-md transition-shadow opacity-75"
                  onClick={() => router.push(`/guide/dashboard/groups/${group.id}`)}
                >
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{group.name}</h3>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          {group.start_date && (
                            <span>{new Date(group.start_date).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <Chip size="sm" variant={group.status === 'completed' ? 'default' : 'warning'}>
                        {group.status}
                      </Chip>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <a
              href={`/g/${guide.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <FileText size={20} className="text-primary" />
              <div>
                <div className="font-medium text-gray-900">Tourist Page</div>
                <div className="text-xs text-gray-500">/g/{guide.slug}</div>
              </div>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
