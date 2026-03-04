'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button, PrimaryButton, SecondaryButton } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { toast } from '@/components/ui/Toast';
import { EmptyState } from '@/components/EmptyState';
import {
  updateGuide,
  createAccessKey,
  toggleKeyActive,
  updateSettings,
  seedDemoData,
  clearAllData,
} from '@/app/actions/adminActions';
import { createGuideWithAuth } from '@/app/actions/guideAuth';
import { formatDate } from '@/lib/utils';
import { Plus, Edit, Copy, Database, Trash2, Settings as SettingsIcon, Mail } from 'lucide-react';
import type { Guide, AccessKey, AppSettings, AccessRole } from '@/lib/types';

interface AdminDashboardProps {
  accessKey: string;
  guides: (Guide & { posts?: { count: number }[] })[];
  accessKeys: AccessKey[];
  settings: AppSettings;
}

type Tab = 'guides' | 'keys' | 'settings' | 'seed';

export function AdminDashboard({ accessKey, guides: initialGuides, accessKeys: initialKeys, settings: initialSettings }: AdminDashboardProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('guides');
  const [guides, setGuides] = useState(initialGuides);
  const [keys, setKeys] = useState(initialKeys);

  // Guide form state
  const [showGuideForm, setShowGuideForm] = useState(false);
  const [guideFormData, setGuideFormData] = useState({ id: '', slug: '', displayName: '' });

  // Auth guide form state
  const [showAuthGuideForm, setShowAuthGuideForm] = useState(false);
  const [authGuideData, setAuthGuideData] = useState({ email: '', displayName: '', slug: '' });

  // Key form state
  const [showKeyForm, setShowKeyForm] = useState(false);
  const [keyFormData, setKeyFormData] = useState({ role: 'guide' as AccessRole, guideId: '', label: '' });

  // Settings form state
  const [settingsData, setSettingsData] = useState({
    hashtags: initialSettings.hashtags.join(', '),
    verseModeEnabled: initialSettings.verse_mode_enabled,
    maxImagesPerPost: initialSettings.max_images_per_post,
    demoBannerText: initialSettings.demo_banner_text,
  });

  // Guide Actions
  const handleSaveGuide = async () => {
    if (!guideFormData.slug || !guideFormData.displayName) {
      toast.error('Please fill all fields');
      return;
    }

    if (!guideFormData.id) {
      toast.error('Use "Create with Auth" to create new guides');
      return;
    }
    const result = await updateGuide(accessKey, guideFormData.id, guideFormData.displayName);

    if (result.success) {
      toast.success(guideFormData.id ? 'Guide updated!' : 'Guide created!');
      setShowGuideForm(false);
      setGuideFormData({ id: '', slug: '', displayName: '' });
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to save guide');
    }
  };

  // Auth Guide Actions
  const handleCreateAuthGuide = async () => {
    if (!authGuideData.email || !authGuideData.displayName || !authGuideData.slug) {
      toast.error('Please fill all fields');
      return;
    }

    const toastId = toast.loading('Creating guide with auth...');
    const result = await createGuideWithAuth(
      accessKey,
      authGuideData.email,
      authGuideData.displayName,
      authGuideData.slug
    );
    toast.dismiss(toastId);

    if (result.success) {
      toast.success('Guide created! Magic link sent to their email.');
      setShowAuthGuideForm(false);
      setAuthGuideData({ email: '', displayName: '', slug: '' });
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to create guide');
    }
  };

  // Key Actions
  const handleCreateKey = async () => {
    if (!keyFormData.label) {
      toast.error('Please fill all fields');
      return;
    }

    if (keyFormData.role === 'guide' && !keyFormData.guideId) {
      toast.error('Please select a guide');
      return;
    }

    const result = await createAccessKey(
      accessKey,
      keyFormData.role,
      keyFormData.role === 'guide' ? keyFormData.guideId : null,
      keyFormData.label
    );

    if (result.success) {
      toast.success('Access key created!');
      setShowKeyForm(false);
      setKeyFormData({ role: 'guide', guideId: '', label: '' });
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to create key');
    }
  };

  const handleCopyLink = (key: AccessKey) => {
    let url = '';
    if (key.role === 'guide' && key.guide) {
      url = `${window.location.origin}/d/guide/${key.guide.slug}?k=${key.key}`;
    } else if (key.role === 'tourism') {
      url = `${window.location.origin}/d/tourism?k=${key.key}`;
    } else if (key.role === 'admin') {
      url = `${window.location.origin}/d/admin?k=${key.key}`;
    }
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard!');
  };

  const handleToggleKey = async (id: string, active: boolean) => {
    const result = await toggleKeyActive(accessKey, id, !active);
    if (result.success) {
      toast.success(`Key ${!active ? 'activated' : 'deactivated'}`);
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to toggle key');
    }
  };

  // Settings Actions
  const handleSaveSettings = async () => {
    const hashtagsArray = settingsData.hashtags
      .split(',')
      .map((h) => h.trim())
      .filter((h) => h.length > 0);

    const result = await updateSettings(
      accessKey,
      hashtagsArray,
      settingsData.verseModeEnabled,
      settingsData.maxImagesPerPost,
      settingsData.demoBannerText
    );

    if (result.success) {
      toast.success('Settings updated!');
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to update settings');
    }
  };

  // Seed Actions
  const handleSeedData = async () => {
    const toastId = toast.loading('Seeding demo data...');
    const result = await seedDemoData(accessKey);
    toast.dismiss(toastId);

    if (result.success) {
      toast.success('Demo data seeded successfully!');
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to seed data');
    }
  };

  const handleClearData = async () => {
    if (!confirm('Are you sure you want to delete ALL data? This cannot be undone.')) {
      return;
    }

    const toastId = toast.loading('Clearing all data...');
    const result = await clearAllData(accessKey);
    toast.dismiss(toastId);

    if (result.success) {
      toast.success('All data cleared!');
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to clear data');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Banner */}
      <div className="bg-red-600 text-white px-4 py-3">
        <div className="max-w-7xl mx-auto">
          <p className="text-sm font-medium">Demo Access: Super Admin</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tabs */}
        <Card className="mb-6">
          <div className="flex border-b overflow-x-auto">
            {[
              { id: 'guides' as const, label: 'Guides' },
              { id: 'keys' as const, label: 'Access Keys' },
              { id: 'settings' as const, label: 'Settings' },
              { id: 'seed' as const, label: 'Seed Data' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </Card>

        {/* Tab Content */}
        {activeTab === 'guides' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Guides</h2>
              <div className="flex gap-2">
                <Button onClick={() => setShowAuthGuideForm(true)} className="gap-2">
                  <Mail size={20} />
                  Create with Auth
                </Button>
                <Button onClick={() => setShowGuideForm(true)} className="gap-2">
                  <Plus size={20} />
                  Add Guide
                </Button>
              </div>
            </div>

            {/* Auth Guide Form */}
            {showAuthGuideForm && (
              <Card>
                <CardHeader>
                  <CardTitle>Create Guide with Authentication</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-gray-600">
                    Creates a guide account with Supabase Auth. The guide will receive a magic link email to set up their account.
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={authGuideData.email}
                      onChange={(e) => setAuthGuideData({ ...authGuideData, email: e.target.value })}
                      placeholder="guide@example.com"
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Display Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={authGuideData.displayName}
                      onChange={(e) => setAuthGuideData({ ...authGuideData, displayName: e.target.value })}
                      placeholder="Sarah Cohen"
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Slug <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={authGuideData.slug}
                      onChange={(e) => setAuthGuideData({ ...authGuideData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                      placeholder="sarah-cohen"
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <PrimaryButton onClick={handleCreateAuthGuide}>Create & Send Invite</PrimaryButton>
                    <SecondaryButton onClick={() => {
                      setShowAuthGuideForm(false);
                      setAuthGuideData({ email: '', displayName: '', slug: '' });
                    }}>
                      Cancel
                    </SecondaryButton>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Guide Form */}
            {showGuideForm && (
              <Card>
                <CardHeader>
                  <CardTitle>{guideFormData.id ? 'Edit Guide' : 'New Guide'}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Slug {!guideFormData.id && <span className="text-red-500">*</span>}
                    </label>
                    <input
                      type="text"
                      value={guideFormData.slug}
                      onChange={(e) => setGuideFormData({ ...guideFormData, slug: e.target.value })}
                      disabled={!!guideFormData.id}
                      placeholder="sarah-cohen"
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Display Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={guideFormData.displayName}
                      onChange={(e) => setGuideFormData({ ...guideFormData, displayName: e.target.value })}
                      placeholder="Sarah Cohen"
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <PrimaryButton onClick={handleSaveGuide}>Save</PrimaryButton>
                    <SecondaryButton onClick={() => {
                      setShowGuideForm(false);
                      setGuideFormData({ id: '', slug: '', displayName: '' });
                    }}>
                      Cancel
                    </SecondaryButton>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Guides List */}
            {guides.length === 0 ? (
              <EmptyState title="No guides yet" description="Create your first guide to get started" />
            ) : (
              <div className="space-y-3">
                {guides.map((guide) => (
                  <Card key={guide.id}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">{guide.display_name}</h3>
                        <p className="text-sm text-gray-600">/{guide.slug}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {guide.posts?.[0]?.count || 0} posts • Created {formatDate(guide.created_at)}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setGuideFormData({ id: guide.id, slug: guide.slug, displayName: guide.display_name });
                          setShowGuideForm(true);
                        }}
                        className="gap-1"
                      >
                        <Edit size={16} />
                        Edit
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'keys' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Access Keys</h2>
              <Button onClick={() => setShowKeyForm(true)} className="gap-2">
                <Plus size={20} />
                Generate Key
              </Button>
            </div>

            {/* Key Form */}
            {showKeyForm && (
              <Card>
                <CardHeader>
                  <CardTitle>Generate Access Key</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={keyFormData.role}
                      onChange={(e) => setKeyFormData({ ...keyFormData, role: e.target.value as AccessRole })}
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none"
                    >
                      <option value="guide">Guide</option>
                      <option value="tourism">Tourism</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  {keyFormData.role === 'guide' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Guide <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={keyFormData.guideId}
                        onChange={(e) => setKeyFormData({ ...keyFormData, guideId: e.target.value })}
                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none"
                      >
                        <option value="">Select a guide</option>
                        {guides.map((guide) => (
                          <option key={guide.id} value={guide.id}>
                            {guide.display_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Label <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={keyFormData.label}
                      onChange={(e) => setKeyFormData({ ...keyFormData, label: e.target.value })}
                      placeholder="Sarah's Dashboard Access"
                      className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <PrimaryButton onClick={handleCreateKey}>Generate</PrimaryButton>
                    <SecondaryButton onClick={() => {
                      setShowKeyForm(false);
                      setKeyFormData({ role: 'guide', guideId: '', label: '' });
                    }}>
                      Cancel
                    </SecondaryButton>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Keys List */}
            {keys.length === 0 ? (
              <EmptyState title="No access keys yet" description="Generate your first access key to get started" />
            ) : (
              <div className="space-y-3">
                {keys.map((key) => (
                  <Card key={key.id}>
                    <div className="space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{key.label}</h3>
                            <Chip size="sm" variant={key.role === 'admin' ? 'warning' : key.role === 'tourism' ? 'secondary' : 'primary'}>
                              {key.role}
                            </Chip>
                            <Chip size="sm" variant={key.active ? 'success' : 'default'}>
                              {key.active ? 'Active' : 'Inactive'}
                            </Chip>
                          </div>
                          {key.guide && (
                            <p className="text-sm text-gray-600">Guide: {key.guide.display_name}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">Created {formatDate(key.created_at)}</p>
                          <p className="text-xs font-mono text-gray-400 mt-2 truncate">
                            {key.key.substring(0, 20)}...
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => handleCopyLink(key)} className="gap-1">
                          <Copy size={16} />
                          Copy Link
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleToggleKey(key.id, key.active)}
                        >
                          {key.active ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">App Settings</h2>
            <Card>
              <CardContent className="space-y-4 pt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hashtags (comma-separated)
                  </label>
                  <textarea
                    value={settingsData.hashtags}
                    onChange={(e) => setSettingsData({ ...settingsData, hashtags: e.target.value })}
                    placeholder="#VisitIsrael, #HolyLand"
                    rows={2}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none resize-none"
                  />
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="verseMode"
                    checked={settingsData.verseModeEnabled}
                    onChange={(e) => setSettingsData({ ...settingsData, verseModeEnabled: e.target.checked })}
                    className="w-5 h-5"
                  />
                  <label htmlFor="verseMode" className="text-sm font-medium text-gray-700">
                    Enable Verse Mode (Holy Land Edition)
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Images Per Post
                  </label>
                  <input
                    type="number"
                    value={settingsData.maxImagesPerPost}
                    onChange={(e) => setSettingsData({ ...settingsData, maxImagesPerPost: parseInt(e.target.value) })}
                    min={1}
                    max={10}
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Demo Banner Text
                  </label>
                  <input
                    type="text"
                    value={settingsData.demoBannerText}
                    onChange={(e) => setSettingsData({ ...settingsData, demoBannerText: e.target.value })}
                    placeholder="This is a demonstration system"
                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none"
                  />
                </div>
                <PrimaryButton onClick={handleSaveSettings} className="gap-2">
                  <SettingsIcon size={20} />
                  Save Settings
                </PrimaryButton>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'seed' && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold">Seed Demo Data</h2>
            <Card>
              <CardContent className="space-y-4 pt-4">
                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4">
                  <h3 className="font-semibold text-blue-900 mb-2">Seed Demo Data</h3>
                  <p className="text-sm text-blue-700 mb-4">
                    This will create sample guides, access keys, and posts to demonstrate the system.
                  </p>
                  <PrimaryButton onClick={handleSeedData} className="gap-2">
                    <Database size={20} />
                    Seed Demo Data
                  </PrimaryButton>
                </div>

                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
                  <h3 className="font-semibold text-red-900 mb-2">Clear All Data</h3>
                  <p className="text-sm text-red-700 mb-4">
                    Warning: This will permanently delete all guides, posts, and access keys. This action cannot be undone.
                  </p>
                  <Button
                    onClick={handleClearData}
                    className="gap-2 bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Trash2 size={20} />
                    Clear All Data
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
