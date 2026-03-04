'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { updateSettings, seedDemoData, clearAllData } from '@/app/actions/adminActions';
import { AccessKeysManager } from './AccessKeysManager';
import { Users, Layers, FileText, Globe, Settings, Database, AlertTriangle } from 'lucide-react';
import type { AccessKey, AppSettings } from '@/lib/types';

interface DashboardTabProps {
  role: 'admin' | 'tourism';
  accessKey: string;
  totalGuides: number;
  totalGroups: number;
  totalPosts: number;
  publishedThisWeek: number;
  accessKeys?: AccessKey[];
  settings?: AppSettings;
  guides: Array<{ id: string; slug: string; display_name: string }>;
}

export function DashboardTab({
  role,
  accessKey,
  totalGuides,
  totalGroups,
  totalPosts,
  publishedThisWeek,
  accessKeys,
  settings,
  guides,
}: DashboardTabProps) {
  const isAdmin = role === 'admin';

  // Settings form
  const [settingsForm, setSettingsForm] = useState({
    hashtags: settings?.hashtags?.join(', ') || '',
    verseModeEnabled: settings?.verse_mode_enabled ?? true,
    maxImagesPerPost: settings?.max_images_per_post ?? 5,
    demoBannerText: settings?.demo_banner_text || '',
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [clearing, setClearing] = useState(false);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    await updateSettings(
      accessKey,
      settingsForm.hashtags.split(',').map(h => h.trim()).filter(Boolean),
      settingsForm.verseModeEnabled,
      settingsForm.maxImagesPerPost,
      settingsForm.demoBannerText
    );
    setSavingSettings(false);
  };

  const handleSeed = async () => {
    if (!confirm('Seed demo data? This will add sample guides, keys, and posts.')) return;
    setSeeding(true);
    await seedDemoData(accessKey);
    setSeeding(false);
    window.location.reload();
  };

  const handleClear = async () => {
    if (!confirm('DELETE ALL DATA? This cannot be undone!')) return;
    setClearing(true);
    await clearAllData(accessKey);
    setClearing(false);
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Guides', value: totalGuides, icon: <Users size={18} />, color: 'text-primary' },
          { label: 'Groups', value: totalGroups, icon: <Layers size={18} />, color: 'text-secondary' },
          { label: 'Total Posts', value: totalPosts, icon: <FileText size={18} />, color: 'text-warm' },
          { label: 'Published (7d)', value: publishedThisWeek, icon: <Globe size={18} />, color: 'text-accent' },
        ].map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="py-4">
              <div className="flex items-center gap-2 mb-1">
                <span className={kpi.color}>{kpi.icon}</span>
                <span className="text-xs text-gray-500">{kpi.label}</span>
              </div>
              <div className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Admin-only sections */}
      {isAdmin && accessKeys && (
        <AccessKeysManager accessKey={accessKey} keys={accessKeys} guides={guides} />
      )}

      {isAdmin && settings && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings size={18} />
              App Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hashtags (comma-separated)</label>
              <input
                type="text"
                value={settingsForm.hashtags}
                onChange={e => setSettingsForm(s => ({ ...s, hashtags: e.target.value }))}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">Verse Mode</label>
              <button
                onClick={() => setSettingsForm(s => ({ ...s, verseModeEnabled: !s.verseModeEnabled }))}
                className={`w-10 h-6 rounded-full transition-colors ${settingsForm.verseModeEnabled ? 'bg-primary' : 'bg-gray-300'}`}
              >
                <div className={`w-4 h-4 bg-white rounded-full transition-transform mx-1 ${settingsForm.verseModeEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
              </button>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Images per Post</label>
              <input
                type="number"
                value={settingsForm.maxImagesPerPost}
                onChange={e => setSettingsForm(s => ({ ...s, maxImagesPerPost: parseInt(e.target.value) || 1 }))}
                min={1}
                max={10}
                className="w-24 px-3 py-2 border-2 border-gray-200 rounded-xl text-sm text-center focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Demo Banner Text</label>
              <input
                type="text"
                value={settingsForm.demoBannerText}
                onChange={e => setSettingsForm(s => ({ ...s, demoBannerText: e.target.value }))}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <button
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="px-6 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {savingSettings ? 'Saving...' : 'Save Settings'}
            </button>
          </CardContent>
        </Card>
      )}

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database size={18} />
              Data Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <button
                onClick={handleSeed}
                disabled={seeding}
                className="px-4 py-2 bg-secondary text-white rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {seeding ? 'Seeding...' : 'Seed Demo Data'}
              </button>
              <button
                onClick={handleClear}
                disabled={clearing}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                <AlertTriangle size={14} />
                {clearing ? 'Clearing...' : 'Clear All Data'}
              </button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
