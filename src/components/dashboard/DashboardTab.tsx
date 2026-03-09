'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { updateSettings, seedDemoData, clearAllData } from '@/app/actions/adminActions';
import { AccessKeysManager } from './AccessKeysManager';
import { Users, Layers, FileText, Globe, Settings, Database, AlertTriangle, Copy, Link, CheckCircle } from 'lucide-react';
import type { AccessKey, AppSettings, GroupStatus } from '@/lib/types';

interface TestGroup {
  slug: string;
  name: string;
  guideSlug: string;
  participantsCount: number;
}

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
  groups: TestGroup[];
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
  groups,
}: DashboardTabProps) {
  const isAdmin = role === 'admin';
  const [copied, setCopied] = useState<string | null>(null);

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
      {/* Test URLs — show when data exists */}
      {guides.length > 0 && (
        <TestUrlsCard
          guides={guides}
          groups={groups}
          copied={copied}
          onCopy={(key, text) => {
            navigator.clipboard.writeText(text);
            setCopied(key);
            setTimeout(() => setCopied(null), 2000);
          }}
        />
      )}
    </div>
  );
}

function TestUrlsCard({
  guides,
  groups,
  copied,
  onCopy,
}: {
  guides: Array<{ slug: string; display_name: string }>;
  groups: TestGroup[];
  copied: string | null;
  onCopy: (key: string, text: string) => void;
}) {
  const base = typeof window !== 'undefined' ? window.location.origin : '';

  const allText = [
    '=== Agent Mary Test URLs ===',
    '',
    'Admin Dashboard:',
    `  ${base}/?p=123456&r=admin`,
    '',
    'Tourist (general chat):',
    ...guides.map(g => `  ${base}/g/${g.slug}`),
    '',
    'Tourist (group, name-gated):',
    ...groups.map(g => [
      `  ${base}/t/${g.guideSlug}/${g.slug}`,
      `    Test names: see participant list in group`,
    ]).flat(),
    '',
    'Guide Login:',
    `  ${base}/guide/login`,
    '  Password: guide123',
  ].join('\n');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Link size={18} />
            Test URLs
          </span>
          <button
            onClick={() => onCopy('all', allText)}
            className="flex items-center gap-1 px-3 py-1 text-xs bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
          >
            {copied === 'all' ? <CheckCircle size={12} /> : <Copy size={12} />}
            {copied === 'all' ? 'Copied!' : 'Copy All'}
          </button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <UrlSection
          label="Admin Dashboard"
          urls={[{ url: `${base}/?p=123456&r=admin`, hint: 'Password: 123456' }]}
          copied={copied}
          onCopy={onCopy}
        />

        <UrlSection
          label="Tourist (general chat)"
          urls={guides.map(g => ({ url: `${base}/g/${g.slug}`, hint: g.display_name }))}
          copied={copied}
          onCopy={onCopy}
        />

        {groups.length > 0 && (
          <UrlSection
            label="Tourist (group, name-gated)"
            urls={groups.map(g => ({
              url: `${base}/t/${g.guideSlug}/${g.slug}`,
              hint: g.name,
            }))}
            copied={copied}
            onCopy={onCopy}
          />
        )}

        <UrlSection
          label="Guide Login"
          urls={[{ url: `${base}/guide/login`, hint: 'Password: guide123' }]}
          copied={copied}
          onCopy={onCopy}
        />
      </CardContent>
    </Card>
  );
}

function UrlSection({
  label,
  urls,
  copied,
  onCopy,
}: {
  label: string;
  urls: { url: string; hint?: string }[];
  copied: string | null;
  onCopy: (key: string, text: string) => void;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{label}</p>
      <div className="space-y-1">
        {urls.map(({ url, hint }) => (
          <div key={url} className="flex items-center gap-2 group">
            <code className="flex-1 text-xs bg-gray-50 px-2 py-1.5 rounded-lg text-gray-700 truncate">{url}</code>
            {hint && <span className="text-xs text-gray-400 hidden sm:block">{hint}</span>}
            <button
              onClick={() => onCopy(url, url)}
              className="p-1 text-gray-400 hover:text-primary transition-colors"
              title="Copy URL"
            >
              {copied === url ? <CheckCircle size={14} className="text-green-500" /> : <Copy size={14} />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
