'use client';

import { useState } from 'react';
import { DashboardTab } from '@/components/dashboard/DashboardTab';
import { GuidesTab } from '@/components/dashboard/GuidesTab';
import { GroupsTab } from '@/components/dashboard/GroupsTab';
import { GroupDetailPanel } from '@/components/dashboard/GroupDetailPanel';
import { LayoutDashboard, Users, Layers, Shield, Building2 } from 'lucide-react';
import type { AccessKey, AppSettings, GroupStatus } from '@/lib/types';

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
  guide_id: string;
  description?: string;
  created_at: string;
  updated_at: string;
  guide?: { id: string; slug: string; display_name: string };
}

interface GuideData {
  id: string;
  slug: string;
  display_name: string;
  email?: string;
  totalPosts: number;
  groups: GuideGroup[];
}

interface UnifiedDashboardProps {
  accessKey: string;
  role: 'admin' | 'tourism';
  guides: GuideData[];
  groups: GuideGroup[];
  accessKeys?: AccessKey[];
  settings?: AppSettings;
  totalPosts: number;
  publishedThisWeek: number;
}

type Tab = 'dashboard' | 'guides' | 'groups';

export function UnifiedDashboard({
  accessKey,
  role,
  guides,
  groups,
  accessKeys,
  settings,
  totalPosts,
  publishedThisWeek,
}: UnifiedDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const isAdmin = role === 'admin';

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'guides', label: 'Guides', icon: <Users size={18} /> },
    { id: 'groups', label: 'Groups', icon: <Layers size={18} /> },
  ];

  const guidesList = guides.map(g => ({ id: g.id, slug: g.slug, display_name: g.display_name }));

  const handleGroupClick = (groupId: string) => {
    setSelectedGroupId(groupId);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className={`${isAdmin ? 'bg-gradient-to-r from-warm to-warm/90' : 'bg-gradient-to-r from-accent to-secondary/80'} text-white px-4 py-4 shadow-md`}>
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            {isAdmin ? <Shield size={20} /> : <Building2 size={20} />}
          </div>
          <div>
            <h1 className="text-lg font-bold">Agent Mary</h1>
            <p className="text-xs opacity-80">
              {isAdmin ? 'Admin Dashboard' : 'Tourism Ministry Dashboard'}
            </p>
          </div>
        </div>
      </header>

      {/* Tab Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? 'text-primary border-primary'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {activeTab === 'dashboard' && (
          <DashboardTab
            role={role}
            accessKey={accessKey}
            totalGuides={guides.length}
            totalGroups={groups.length}
            totalPosts={totalPosts}
            publishedThisWeek={publishedThisWeek}
            accessKeys={isAdmin ? accessKeys : undefined}
            settings={isAdmin ? settings : undefined}
            guides={guidesList}
          />
        )}

        {activeTab === 'guides' && (
          <GuidesTab
            role={role}
            accessKey={accessKey}
            guides={guides}
            onGroupClick={handleGroupClick}
          />
        )}

        {activeTab === 'groups' && (
          <GroupsTab
            role={role}
            accessKey={accessKey}
            groups={groups}
            guides={guidesList}
          />
        )}
      </div>

      {/* Group Detail Panel (from guide card clicks) */}
      {selectedGroupId && activeTab === 'guides' && (
        <GroupDetailPanel
          groupId={selectedGroupId}
          accessKey={accessKey}
          role={role}
          onClose={() => setSelectedGroupId(null)}
        />
      )}
    </div>
  );
}
