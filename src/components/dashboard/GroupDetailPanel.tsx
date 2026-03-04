'use client';

import { useState, useEffect } from 'react';
import { getGroupFullDetail, addParticipantAdmin, removeParticipantAdmin } from '@/app/actions/adminActions';
import { updatePostStatus } from '@/app/actions/updatePostStatus';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { TouristLink } from '@/components/TouristLink';
import { ParticipantsManager } from './ParticipantsManager';
import { X, MapPin, Calendar, Users, FileText, Loader2, Clock } from 'lucide-react';
import type { Post, GroupParticipant } from '@/lib/types';

interface GroupDetailPanelProps {
  groupId: string;
  accessKey: string;
  role: 'admin' | 'tourism';
  onClose: () => void;
}

export function GroupDetailPanel({ groupId, accessKey, role, onClose }: GroupDetailPanelProps) {
  const isAdmin = role === 'admin';
  const [loading, setLoading] = useState(true);
  const [group, setGroup] = useState<Record<string, unknown> | null>(null);
  const [days, setDays] = useState<Array<Record<string, unknown>>>([]);
  const [participants, setParticipants] = useState<GroupParticipant[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'itinerary' | 'participants' | 'posts'>('overview');

  useEffect(() => {
    loadData();
  }, [groupId]);

  const loadData = async () => {
    setLoading(true);
    const result = await getGroupFullDetail(accessKey, groupId);
    if (result.success) {
      setGroup(result.group as Record<string, unknown>);
      setDays((result.days || []) as Array<Record<string, unknown>>);
      setParticipants((result.participants || []) as GroupParticipant[]);
      setPosts((result.posts || []) as Post[]);
    }
    setLoading(false);
  };

  const handleAddParticipant = async (firstName: string, lastName: string) => {
    return addParticipantAdmin(accessKey, groupId, firstName, lastName);
  };

  const handleRemoveParticipant = async (participantId: string) => {
    return removeParticipantAdmin(accessKey, participantId);
  };

  const handlePublish = async (postId: string) => {
    const result = await updatePostStatus(postId, 'published' as const, accessKey);
    if (result.success) {
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, status: 'published' as const } : p));
    }
  };

  const tabs = [
    { id: 'overview' as const, label: 'Overview', icon: <MapPin size={14} /> },
    { id: 'itinerary' as const, label: `Itinerary (${days.length})`, icon: <Calendar size={14} /> },
    { id: 'participants' as const, label: `Participants (${participants.length})`, icon: <Users size={14} /> },
    { id: 'posts' as const, label: `Posts (${posts.length})`, icon: <FileText size={14} /> },
  ];

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
        <div className="bg-white rounded-2xl p-8" onClick={e => e.stopPropagation()}>
          <Loader2 size={32} className="animate-spin text-primary mx-auto" />
          <p className="text-sm text-gray-500 mt-2">Loading group details...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
        <div className="bg-white rounded-2xl p-8 text-center" onClick={e => e.stopPropagation()}>
          <p className="text-red-600">Group not found</p>
          <button onClick={onClose} className="mt-3 text-sm text-primary hover:underline">Close</button>
        </div>
      </div>
    );
  }

  const guide = group.guide as { slug: string; display_name: string } | undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end bg-black/30" onClick={onClose}>
      <div
        className="w-full max-w-2xl bg-white shadow-2xl overflow-y-auto animate-slide-in-right"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 z-10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{group.name as string}</h2>
              {guide && <p className="text-xs text-gray-500">Guide: {guide.display_name}</p>}
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
            >
              <X size={20} />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-3 overflow-x-auto -mb-px">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors border-b-2 ${
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

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <Card><CardContent className="py-3 text-center"><div className="text-xl font-bold text-primary">{days.length}</div><div className="text-xs text-gray-500">Days</div></CardContent></Card>
                <Card><CardContent className="py-3 text-center"><div className="text-xl font-bold text-secondary">{participants.length}</div><div className="text-xs text-gray-500">Participants</div></CardContent></Card>
                <Card><CardContent className="py-3 text-center"><div className="text-xl font-bold text-warm">{posts.length}</div><div className="text-xs text-gray-500">Posts</div></CardContent></Card>
              </div>

              {!!group.description && (
                <Card><CardContent className="pt-4"><p className="text-sm text-gray-700">{group.description as string}</p></CardContent></Card>
              )}

              {!!(group.start_date || group.end_date) && (
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar size={16} />
                      {group.start_date ? new Date(group.start_date as string).toLocaleDateString() : ''}
                      {group.end_date ? ` — ${new Date(group.end_date as string).toLocaleDateString()}` : ''}
                    </div>
                  </CardContent>
                </Card>
              )}

              {guide && (
                <Card>
                  <CardHeader><CardTitle>Tourist Link</CardTitle></CardHeader>
                  <CardContent>
                    <TouristLink guideSlug={guide.slug} groupSlug={group.slug as string} />
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Itinerary */}
          {activeTab === 'itinerary' && (
            <div className="space-y-3">
              {days.length === 0 ? (
                <Card><CardContent className="py-8 text-center"><Calendar size={32} className="mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-500">No itinerary configured</p></CardContent></Card>
              ) : (
                days.map((day) => {
                  const stops = (day.stops as Array<Record<string, unknown>>) || [];
                  return (
                    <Card key={day.id as string}>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="bg-primary text-white w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold">
                            {day.day_number as number}
                          </span>
                          <span className="font-medium text-gray-900 text-sm">{(day.title as string) || `Day ${day.day_number as number}`}</span>
                          {!!day.date && <span className="text-xs text-gray-400">{new Date(day.date as string).toLocaleDateString()}</span>}
                        </div>
                        {stops.length === 0 ? (
                          <p className="text-xs text-gray-500">No stops</p>
                        ) : (
                          <div className="space-y-2">
                            {stops.map((stop, i) => (
                              <div key={stop.id as string} className="flex gap-2 text-xs">
                                <div className="flex flex-col items-center">
                                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1" />
                                  {i < stops.length - 1 && <div className="w-0.5 flex-1 bg-gray-200 mt-0.5" />}
                                </div>
                                <div className="flex-1 pb-2">
                                  <div className="font-medium text-gray-900">{stop.location_name as string}</div>
                                  <div className="text-gray-500 flex items-center gap-2">
                                    {!!stop.time && <span className="flex items-center gap-0.5"><Clock size={10} />{stop.time as string}</span>}
                                    {!!stop.duration_minutes && <span>({stop.duration_minutes as number} min)</span>}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          )}

          {/* Participants */}
          {activeTab === 'participants' && (
            <ParticipantsManager
              groupId={groupId}
              participants={participants}
              readOnly={!isAdmin}
              onAdd={handleAddParticipant}
              onRemove={handleRemoveParticipant}
            />
          )}

          {/* Posts */}
          {activeTab === 'posts' && (
            <div className="space-y-3">
              {posts.length === 0 ? (
                <Card><CardContent className="py-8 text-center"><FileText size={32} className="mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-500">No posts yet</p></CardContent></Card>
              ) : (
                posts.map(post => (
                  <Card key={post.id}>
                    <CardContent className="py-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900 text-sm">{post.tourist_name || 'Tourist'}</span>
                            <Chip size="sm" variant={
                              post.status === 'published' ? 'success' :
                              post.status === 'approved' ? 'primary' :
                              post.status === 'pending' ? 'warning' : 'default'
                            }>
                              {post.status}
                            </Chip>
                          </div>
                          <p className="text-xs text-gray-600">{post.location_label}</p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{post.experience_text}</p>
                          <p className="text-xs text-gray-400 mt-1">{new Date(post.created_at).toLocaleString()}</p>
                        </div>
                        {post.images?.[0] && (
                          <img
                            src={post.images[0]}
                            alt=""
                            className="w-14 h-14 rounded-lg object-cover ml-3 flex-shrink-0"
                          />
                        )}
                      </div>
                      {/* Tourism can publish approved posts */}
                      {(post.status === 'approved' || post.status === 'pending') && (
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() => handlePublish(post.id)}
                            className="px-3 py-1 bg-secondary text-white rounded-lg text-xs font-medium hover:opacity-90"
                          >
                            Publish
                          </button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
