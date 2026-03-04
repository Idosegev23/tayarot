'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { completeGuideSetup } from '@/app/actions/guideAuth';

interface GuideSetupFormProps {
  email: string;
  currentName: string;
}

export function GuideSetupForm({ email, currentName }: GuideSetupFormProps) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(currentName || '');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;

    setLoading(true);
    setError('');

    const result = await completeGuideSetup({
      displayName: displayName.trim(),
      phone: phone.trim() || undefined,
    });

    setLoading(false);

    if (result.success) {
      router.push('/guide/dashboard');
      router.refresh();
    } else {
      setError(result.error || 'Failed to complete setup');
    }
  };

  return (
    <div className="glass rounded-2xl p-8 shadow-lg">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <input
            type="email"
            value={email}
            disabled
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-500"
          />
        </div>

        <div>
          <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
            Display Name <span className="text-red-500">*</span>
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g., Sarah Cohen"
            required
            autoFocus
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none text-lg"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number <span className="text-gray-400">(optional)</span>
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+972-50-1234567"
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none text-lg"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !displayName.trim()}
          className="w-full py-3 bg-primary text-white rounded-xl font-semibold text-lg hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Complete Setup'}
        </button>
      </form>
    </div>
  );
}
