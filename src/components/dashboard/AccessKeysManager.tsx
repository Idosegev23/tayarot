'use client';

import { useState } from 'react';
import { createAccessKey, toggleKeyActive } from '@/app/actions/adminActions';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { PrimaryButton } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Key, Copy, Check, Plus } from 'lucide-react';
import type { AccessKey, AccessRole, Guide } from '@/lib/types';

interface AccessKeysManagerProps {
  accessKey: string;
  keys: AccessKey[];
  guides: Array<{ id: string; slug: string; display_name: string }>;
}

export function AccessKeysManager({ accessKey, keys, guides }: AccessKeysManagerProps) {
  const [keyList, setKeyList] = useState<AccessKey[]>(keys);
  const [showForm, setShowForm] = useState(false);
  const [formRole, setFormRole] = useState<AccessRole>('guide');
  const [formGuideId, setFormGuideId] = useState('');
  const [formLabel, setFormLabel] = useState('');
  const [creating, setCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!formLabel.trim()) return;
    if (formRole === 'guide' && !formGuideId) return;

    setCreating(true);
    const result = await createAccessKey(
      accessKey,
      formRole,
      formRole === 'guide' ? formGuideId : null,
      formLabel.trim()
    );
    setCreating(false);

    if (result.success && result.accessKey) {
      setKeyList(prev => [result.accessKey!, ...prev]);
      setFormLabel('');
      setFormGuideId('');
      setShowForm(false);
    }
  };

  const handleToggle = async (id: string, active: boolean) => {
    const result = await toggleKeyActive(accessKey, id, active);
    if (result.success) {
      setKeyList(prev => prev.map(k => k.id === id ? { ...k, active } : k));
    }
  };

  const copyLink = (key: AccessKey) => {
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    let url = `${base}/?k=${key.key}`;
    if (key.role === 'guide' && key.guide) {
      url = `${base}/d/guide/${key.guide.slug}?k=${key.key}`;
    }
    navigator.clipboard.writeText(url);
    setCopiedId(key.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Key size={18} />
            Access Keys ({keyList.length})
          </CardTitle>
          <PrimaryButton size="sm" onClick={() => setShowForm(!showForm)}>
            <Plus size={14} />
            New Key
          </PrimaryButton>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {showForm && (
          <div className="p-3 bg-gray-50 rounded-xl space-y-3 border border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={formRole}
                onChange={e => setFormRole(e.target.value as AccessRole)}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-primary focus:outline-none"
              >
                <option value="guide">Guide</option>
                <option value="tourism">Tourism</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {formRole === 'guide' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Guide</label>
                <select
                  value={formGuideId}
                  onChange={e => setFormGuideId(e.target.value)}
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-primary focus:outline-none"
                >
                  <option value="">Select guide...</option>
                  {guides.map(g => (
                    <option key={g.id} value={g.id}>{g.display_name}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
              <input
                type="text"
                value={formLabel}
                onChange={e => setFormLabel(e.target.value)}
                placeholder="e.g., Main Admin Key"
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <PrimaryButton size="sm" onClick={handleCreate} disabled={creating}>
              {creating ? 'Creating...' : 'Create Key'}
            </PrimaryButton>
          </div>
        )}

        {keyList.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">No access keys</p>
        ) : (
          <div className="space-y-2">
            {keyList.map(k => (
              <div
                key={k.id}
                className={`flex items-center justify-between p-3 rounded-xl border ${
                  k.active ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-100 opacity-60'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-gray-900 truncate">{k.label}</span>
                    <Chip size="sm" variant={k.role === 'admin' ? 'warm' : k.role === 'tourism' ? 'secondary' : 'primary'}>
                      {k.role}
                    </Chip>
                  </div>
                  <p className="text-xs text-gray-400 font-mono truncate">{k.key}</p>
                </div>
                <div className="flex items-center gap-1 ml-2">
                  <button
                    onClick={() => copyLink(k)}
                    className="p-2 text-gray-400 hover:text-primary transition-colors rounded-lg hover:bg-primary/10"
                    title="Copy dashboard link"
                  >
                    {copiedId === k.id ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                  </button>
                  <button
                    onClick={() => handleToggle(k.id, !k.active)}
                    className={`px-2 py-1 text-xs rounded-lg transition-colors ${
                      k.active
                        ? 'text-red-600 hover:bg-red-50'
                        : 'text-green-600 hover:bg-green-50'
                    }`}
                  >
                    {k.active ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
