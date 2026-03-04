'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { ChevronDown, ChevronRight, Users, Layers, FileText, Mail } from 'lucide-react';
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

interface GuideCardProps {
  guide: {
    id: string;
    slug: string;
    display_name: string;
    email?: string;
    totalPosts: number;
    groups: GuideGroup[];
  };
  onGroupClick?: (groupId: string) => void;
}

export function GuideCard({ guide, onGroupClick }: GuideCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
          <Users size={18} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 truncate">{guide.display_name}</h3>
            <span className="text-xs text-gray-400">/{guide.slug}</span>
          </div>
          {guide.email && (
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
              <Mail size={10} />
              {guide.email}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Chip size="sm" variant="primary">{guide.groups.length} groups</Chip>
          <Chip size="sm" variant="default">{guide.totalPosts} posts</Chip>
          {expanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50/50 p-3 space-y-2">
          {guide.groups.length === 0 ? (
            <p className="text-sm text-gray-500 py-2 text-center">No groups yet</p>
          ) : (
            guide.groups.map(group => (
              <button
                key={group.id}
                onClick={() => onGroupClick?.(group.id)}
                className="w-full flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200 hover:border-primary/30 hover:shadow-sm transition-all text-left"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 text-sm truncate">{group.name}</span>
                    <Chip size="sm" variant={group.status === 'active' ? 'success' : group.status === 'completed' ? 'primary' : 'default'}>
                      {group.status}
                    </Chip>
                  </div>
                  {group.start_date && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(group.start_date).toLocaleDateString()}
                      {group.end_date && ` — ${new Date(group.end_date).toLocaleDateString()}`}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 ml-2">
                  <span className="flex items-center gap-1"><Users size={12} />{group.participantsCount}</span>
                  <span className="flex items-center gap-1"><Layers size={12} />{group.daysCount}d</span>
                  <span className="flex items-center gap-1"><FileText size={12} />{group.postsCount}</span>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </Card>
  );
}
