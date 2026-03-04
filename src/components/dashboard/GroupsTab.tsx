'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { GroupDetailPanel } from './GroupDetailPanel';
import { Layers, Users, FileText, Calendar, Filter } from 'lucide-react';
import type { GroupStatus, Guide } from '@/lib/types';

interface GroupData {
  id: string;
  guide_id: string;
  name: string;
  slug: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  status: GroupStatus;
  created_at: string;
  guide?: { id: string; slug: string; display_name: string };
  postsCount: number;
  participantsCount: number;
  daysCount: number;
}

interface GroupsTabProps {
  role: 'admin' | 'tourism';
  accessKey: string;
  groups: GroupData[];
  guides: Array<{ id: string; slug: string; display_name: string }>;
}

export function GroupsTab({ role, accessKey, groups, guides }: GroupsTabProps) {
  const [filterGuide, setFilterGuide] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const filtered = groups.filter(g => {
    if (filterGuide && g.guide_id !== filterGuide) return false;
    if (filterStatus && g.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 text-sm text-gray-500">
          <Filter size={14} />
          <span>Filter:</span>
        </div>
        <select
          value={filterGuide}
          onChange={e => setFilterGuide(e.target.value)}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:border-primary focus:outline-none bg-white"
        >
          <option value="">All Guides</option>
          {guides.map(g => (
            <option key={g.id} value={g.id}>{g.display_name}</option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:border-primary focus:outline-none bg-white"
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </select>
        <span className="text-xs text-gray-400">{filtered.length} groups</span>
      </div>

      {/* Group cards */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Layers size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500">No groups found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(group => (
            <Card
              key={group.id}
              className="cursor-pointer hover:shadow-md hover:border-primary/20 transition-all"
              onClick={() => setSelectedGroupId(group.id)}
            >
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-gray-900 text-sm">{group.name}</span>
                      <Chip size="sm" variant={group.status === 'active' ? 'success' : group.status === 'completed' ? 'primary' : 'default'}>
                        {group.status}
                      </Chip>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      {group.guide && <span className="text-primary">{group.guide.display_name}</span>}
                      {group.start_date && (
                        <span className="flex items-center gap-1">
                          <Calendar size={10} />
                          {new Date(group.start_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 ml-3">
                    <span className="flex items-center gap-1" title="Participants"><Users size={13} />{group.participantsCount}</span>
                    <span className="flex items-center gap-1" title="Itinerary Days"><Layers size={13} />{group.daysCount}d</span>
                    <span className="flex items-center gap-1" title="Posts"><FileText size={13} />{group.postsCount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Panel */}
      {selectedGroupId && (
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
