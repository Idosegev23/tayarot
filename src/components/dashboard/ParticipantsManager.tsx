'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { PrimaryButton, SecondaryButton } from '@/components/ui/Button';
import { UserPlus, Trash2, Upload, Users } from 'lucide-react';
import type { GroupParticipant } from '@/lib/types';

interface ParticipantsManagerProps {
  groupId: string;
  participants: GroupParticipant[];
  readOnly?: boolean;
  onAdd: (firstName: string, lastName: string) => Promise<{ success: boolean; error?: string }>;
  onRemove: (participantId: string) => Promise<{ success: boolean; error?: string }>;
  onBulkAdd?: (participants: Array<{ firstName: string; lastName: string }>) => Promise<{ success: boolean; added?: number; error?: string }>;
}

export function ParticipantsManager({
  groupId,
  participants,
  readOnly = false,
  onAdd,
  onRemove,
  onBulkAdd,
}: ParticipantsManagerProps) {
  const [list, setList] = useState<GroupParticipant[]>(participants);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [showBulk, setShowBulk] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const fn = firstName.trim();
    const ln = lastName.trim();
    if (!fn || !ln) return;

    setLoading(true);
    const result = await onAdd(fn, ln);
    setLoading(false);

    if (result.success) {
      setList(prev => [...prev, {
        id: crypto.randomUUID(),
        group_id: groupId,
        first_name: fn,
        last_name: ln,
        created_at: new Date().toISOString(),
      }]);
      setFirstName('');
      setLastName('');
      setSuccess('Participant added');
      setTimeout(() => setSuccess(''), 2000);
    } else {
      setError(result.error || 'Failed to add participant');
    }
  };

  const handleRemove = async (participantId: string) => {
    setError('');
    const result = await onRemove(participantId);
    if (result.success) {
      setList(prev => prev.filter(p => p.id !== participantId));
    } else {
      setError(result.error || 'Failed to remove participant');
    }
  };

  const handleBulkAdd = async () => {
    if (!onBulkAdd || !bulkText.trim()) return;
    setError('');
    setSuccess('');
    setLoading(true);

    const lines = bulkText.split('\n').filter(l => l.trim());
    const parsed = lines.map(line => {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 2) {
        return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
      }
      return null;
    }).filter(Boolean) as Array<{ firstName: string; lastName: string }>;

    if (parsed.length === 0) {
      setError('No valid names found. Use format: FirstName LastName (one per line)');
      setLoading(false);
      return;
    }

    const result = await onBulkAdd(parsed);
    setLoading(false);

    if (result.success) {
      // Refresh — add parsed entries to local list (approximate, won't have real IDs)
      const newEntries = parsed.map(p => ({
        id: crypto.randomUUID(),
        group_id: groupId,
        first_name: p.firstName,
        last_name: p.lastName,
        created_at: new Date().toISOString(),
      }));
      setList(prev => [...prev, ...newEntries]);
      setBulkText('');
      setShowBulk(false);
      setSuccess(`Added ${result.added || parsed.length} participants`);
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(result.error || 'Bulk add failed');
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users size={18} className="text-primary" />
          <h3 className="font-semibold text-gray-900">
            Participants ({list.length})
          </h3>
        </div>
        {!readOnly && onBulkAdd && (
          <SecondaryButton
            size="sm"
            onClick={() => setShowBulk(!showBulk)}
          >
            <Upload size={14} />
            {showBulk ? 'Single Add' : 'Bulk Add'}
          </SecondaryButton>
        )}
      </div>

      {/* Add form */}
      {!readOnly && !showBulk && (
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            type="text"
            value={firstName}
            onChange={e => setFirstName(e.target.value)}
            placeholder="First name"
            className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-primary focus:outline-none"
            disabled={loading}
          />
          <input
            type="text"
            value={lastName}
            onChange={e => setLastName(e.target.value)}
            placeholder="Last name"
            className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-primary focus:outline-none"
            disabled={loading}
          />
          <PrimaryButton type="submit" size="sm" disabled={loading || !firstName.trim() || !lastName.trim()}>
            <UserPlus size={16} />
          </PrimaryButton>
        </form>
      )}

      {/* Bulk add */}
      {!readOnly && showBulk && (
        <div className="space-y-2">
          <textarea
            value={bulkText}
            onChange={e => setBulkText(e.target.value)}
            placeholder="Paste names, one per line:&#10;John Smith&#10;Jane Doe&#10;Mike Johnson"
            className="w-full px-3 py-2 border-2 border-gray-200 rounded-xl text-sm focus:border-primary focus:outline-none resize-none"
            rows={5}
            disabled={loading}
          />
          <PrimaryButton
            size="sm"
            onClick={handleBulkAdd}
            disabled={loading || !bulkText.trim()}
          >
            Add All
          </PrimaryButton>
        </div>
      )}

      {/* Messages */}
      {error && (
        <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="p-2 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">{success}</div>
      )}

      {/* Participant list */}
      {list.length === 0 ? (
        <Card className="p-6 text-center">
          <Users size={24} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">No participants added yet</p>
          {!readOnly && (
            <p className="text-xs text-gray-400 mt-1">Add participants to restrict tourist access</p>
          )}
        </Card>
      ) : (
        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-gray-600">Name</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600 hidden sm:table-cell">Added</th>
                {!readOnly && <th className="w-10"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {list.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-gray-900">
                    {p.first_name} {p.last_name}
                  </td>
                  <td className="px-3 py-2 text-gray-400 text-xs hidden sm:table-cell">
                    {new Date(p.created_at).toLocaleDateString()}
                  </td>
                  {!readOnly && (
                    <td className="px-2 py-1">
                      <button
                        onClick={() => handleRemove(p.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                        title="Remove"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
