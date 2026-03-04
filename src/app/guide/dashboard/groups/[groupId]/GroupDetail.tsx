'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateGroup, deleteGroup } from '@/app/actions/groupActions';
import { addParticipant, removeParticipant, addParticipantsBulk } from '@/app/actions/participantActions';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { TouristLink } from '@/components/TouristLink';
import { ParticipantsManager } from '@/components/dashboard/ParticipantsManager';
import { ArrowLeft, MapPin, Calendar, FileText, Settings, Trash2, Users } from 'lucide-react';
import type { GuideWithAuth, Group, Post, GroupParticipant } from '@/lib/types';

type Tab = 'overview' | 'itinerary' | 'posts' | 'participants' | 'settings';

interface GroupDetailProps {
  group: Group;
  guide: GuideWithAuth;
  days: Array<{
    id: string;
    day_number: number;
    date: string | null;
    title: string | null;
    description: string | null;
    stops: Array<{
      id: string;
      order_index: number;
      time: string | null;
      location_name: string;
      description: string | null;
      duration_minutes: number | null;
    }>;
  }>;
  posts: Post[];
  postsCount: number;
  participants: GroupParticipant[];
}

export function GroupDetail({ group, guide, days, posts, postsCount, participants }: GroupDetailProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [deleting, setDeleting] = useState(false);

  // Settings form
  const [settingsForm, setSettingsForm] = useState({
    name: group.name,
    description: group.description || '',
    startDate: group.start_date || '',
    endDate: group.end_date || '',
    status: group.status,
  });
  const [saving, setSaving] = useState(false);

  const handleSaveSettings = async () => {
    setSaving(true);
    const result = await updateGroup(group.id, {
      name: settingsForm.name,
      description: settingsForm.description,
      startDate: settingsForm.startDate,
      endDate: settingsForm.endDate,
      status: settingsForm.status,
    });
    setSaving(false);

    if (result.success) {
      router.refresh();
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this group? This will also delete all itinerary data. Posts will be kept.')) return;

    setDeleting(true);
    const result = await deleteGroup(group.id);

    if (result.success) {
      router.push('/guide/dashboard');
      router.refresh();
    } else {
      setDeleting(false);
    }
  };

  const handleAddParticipant = async (firstName: string, lastName: string) => {
    return addParticipant(group.id, firstName, lastName);
  };

  const handleRemoveParticipant = async (participantId: string) => {
    return removeParticipant(participantId);
  };

  const handleBulkAdd = async (list: Array<{ firstName: string; lastName: string }>) => {
    return addParticipantsBulk(group.id, list);
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <MapPin size={16} /> },
    { id: 'itinerary', label: 'Itinerary', icon: <Calendar size={16} /> },
    { id: 'participants', label: `Participants (${participants.length})`, icon: <Users size={16} /> },
    { id: 'posts', label: `Posts (${postsCount})`, icon: <FileText size={16} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.push('/guide/dashboard')}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 text-sm mb-2"
          >
            <ArrowLeft size={16} />
            Dashboard
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">{group.name}</h1>
            <Chip size="sm" variant={group.status === 'active' ? 'success' : 'default'}>
              {group.status}
            </Chip>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-4">
        {/* Tabs */}
        <div className="flex gap-1 border-b border-gray-200 mb-6 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
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

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tourist Link</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-3">
                  Share this link with your tourists. They can access the chat and create posts.
                </p>
                <TouristLink guideSlug={guide.slug} groupSlug={group.slug} />
              </CardContent>
            </Card>

            {group.description && (
              <Card>
                <CardContent className="pt-4">
                  <p className="text-gray-700">{group.description}</p>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="py-4 text-center">
                  <div className="text-2xl font-bold text-primary">{days.length}</div>
                  <div className="text-sm text-gray-600">Itinerary Days</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4 text-center">
                  <div className="text-2xl font-bold text-warm">{postsCount}</div>
                  <div className="text-sm text-gray-600">Posts</div>
                </CardContent>
              </Card>
            </div>

            {group.start_date && (
              <Card>
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Calendar size={16} />
                    <span>
                      {new Date(group.start_date).toLocaleDateString()}
                      {group.end_date && ` — ${new Date(group.end_date).toLocaleDateString()}`}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Itinerary Tab */}
        {activeTab === 'itinerary' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Itinerary</h2>
              <button
                onClick={() => router.push(`/guide/dashboard/groups/${group.id}/itinerary`)}
                className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Edit Itinerary
              </button>
            </div>

            {days.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <Calendar size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 mb-4">No itinerary yet</p>
                  <button
                    onClick={() => router.push(`/guide/dashboard/groups/${group.id}/itinerary`)}
                    className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    Build Itinerary
                  </button>
                </CardContent>
              </Card>
            ) : (
              days.map(day => (
                <Card key={day.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <span className="bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold">
                        {day.day_number}
                      </span>
                      <span>{day.title || `Day ${day.day_number}`}</span>
                      {day.date && (
                        <span className="text-sm font-normal text-gray-500">
                          {new Date(day.date).toLocaleDateString()}
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {day.stops.length === 0 ? (
                      <p className="text-sm text-gray-500">No stops added</p>
                    ) : (
                      <div className="space-y-3">
                        {day.stops.map((stop, i) => (
                          <div key={stop.id} className="flex gap-3 text-sm">
                            <div className="flex flex-col items-center">
                              <div className="w-2 h-2 rounded-full bg-primary mt-1.5" />
                              {i < day.stops.length - 1 && (
                                <div className="w-0.5 flex-1 bg-gray-200 mt-1" />
                              )}
                            </div>
                            <div className="flex-1 pb-3">
                              <div className="font-medium text-gray-900">{stop.location_name}</div>
                              {stop.time && (
                                <span className="text-gray-500">{stop.time}</span>
                              )}
                              {stop.duration_minutes && (
                                <span className="text-gray-400 ml-2">({stop.duration_minutes} min)</span>
                              )}
                              {stop.description && (
                                <p className="text-gray-600 mt-1">{stop.description}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Participants Tab */}
        {activeTab === 'participants' && (
          <ParticipantsManager
            groupId={group.id}
            participants={participants}
            onAdd={handleAddParticipant}
            onRemove={handleRemoveParticipant}
            onBulkAdd={handleBulkAdd}
          />
        )}

        {/* Posts Tab */}
        {activeTab === 'posts' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900">Posts ({postsCount})</h2>
            {posts.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <FileText size={48} className="mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500">No posts yet. Share the tourist link for tourists to start creating posts.</p>
                </CardContent>
              </Card>
            ) : (
              posts.map(post => (
                <Card key={post.id}>
                  <CardContent className="py-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900">{post.tourist_name || 'Tourist'}</span>
                          <Chip size="sm" variant={post.status === 'published' ? 'success' : post.status === 'approved' ? 'primary' : 'default'}>
                            {post.status}
                          </Chip>
                        </div>
                        <p className="text-sm text-gray-600">{post.location_label}</p>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{post.experience_text}</p>
                        <p className="text-xs text-gray-400 mt-2">{new Date(post.created_at).toLocaleString()}</p>
                      </div>
                      {post.images?.[0] && (
                        <img
                          src={post.images[0]}
                          alt=""
                          className="w-16 h-16 rounded-lg object-cover ml-3 flex-shrink-0"
                        />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Group Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                  <input
                    type="text"
                    value={settingsForm.name}
                    onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={settingsForm.description}
                    onChange={(e) => setSettingsForm({ ...settingsForm, description: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                    <input
                      type="date"
                      value={settingsForm.startDate}
                      onChange={(e) => setSettingsForm({ ...settingsForm, startDate: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                    <input
                      type="date"
                      value={settingsForm.endDate}
                      onChange={(e) => setSettingsForm({ ...settingsForm, endDate: e.target.value })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={settingsForm.status}
                    onChange={(e) => setSettingsForm({ ...settingsForm, status: e.target.value as Group['status'] })}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none"
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <button
                  onClick={handleSaveSettings}
                  disabled={saving}
                  className="px-6 py-2 bg-primary text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-4">
                <h3 className="font-semibold text-red-700 mb-2">Danger Zone</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Deleting a group removes all itinerary data. Posts will be kept but unlinked.
                </p>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  <Trash2 size={16} />
                  {deleting ? 'Deleting...' : 'Delete Group'}
                </button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
