'use client';

import { useState, useEffect } from 'react';
import { validateTouristName } from '@/app/actions/participantActions';
import { Card } from '@/components/ui/Card';
import { PrimaryButton } from '@/components/ui/Button';
import { ChatInterface } from '@/app/g/[guideSlug]/ChatInterface';
import { Loader2, UserCheck, AlertCircle } from 'lucide-react';

interface TouristGateProps {
  guideSlug: string;
  guideName: string;
  guideId: string;
  groupId: string;
  groupName: string;
  groupSlug: string;
}

const STORAGE_PREFIX = 'tourist_validated_';

function getStoredSession(groupId: string): { firstName: string; lastName: string } | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${groupId}`);
    if (!raw) return null;
    const data = JSON.parse(raw);
    // Session valid for 7 days
    if (data.validatedAt && Date.now() - data.validatedAt < 7 * 24 * 60 * 60 * 1000) {
      return { firstName: data.firstName, lastName: data.lastName };
    }
    localStorage.removeItem(`${STORAGE_PREFIX}${groupId}`);
    return null;
  } catch {
    return null;
  }
}

function storeSession(groupId: string, firstName: string, lastName: string) {
  try {
    localStorage.setItem(
      `${STORAGE_PREFIX}${groupId}`,
      JSON.stringify({ firstName, lastName, validatedAt: Date.now() })
    );
  } catch {}
}

export function TouristGate({
  guideSlug,
  guideName,
  guideId,
  groupId,
  groupName,
  groupSlug,
}: TouristGateProps) {
  const [validated, setValidated] = useState(false);
  const [touristName, setTouristName] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState('');

  // Check stored session on mount
  useEffect(() => {
    const stored = getStoredSession(groupId);
    if (stored) {
      setTouristName(`${stored.firstName} ${stored.lastName}`);
      setValidated(true);
    }
    setLoading(false);
  }, [groupId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const fn = firstName.trim();
    const ln = lastName.trim();
    if (!fn || !ln) {
      setError('Please enter both first and last name');
      return;
    }

    setValidating(true);

    try {
      const result = await validateTouristName(groupId, fn, ln);
      if (result.valid) {
        storeSession(groupId, fn, ln);
        setTouristName(`${fn} ${ln}`);
        setValidated(true);
      } else {
        setError('Your name is not on the participant list. Please contact your guide.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setValidating(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-light/30 to-white">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  // Validated — show chat
  if (validated) {
    return (
      <ChatInterface
        guideSlug={guideSlug}
        guideName={guideName}
        guideId={guideId}
        groupId={groupId}
        groupName={groupName}
        groupSlug={groupSlug}
        touristName={touristName}
      />
    );
  }

  // Name gate form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary/95 to-secondary/70 p-4">
      <Card className="w-full max-w-md p-6 animate-fade-in-up">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
            <UserCheck size={28} className="text-primary" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-1">
            Welcome to {groupName}
          </h1>
          <p className="text-sm text-gray-500">
            with {guideName}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            Please enter your name as it appears on the participant list
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name
            </label>
            <input
              type="text"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              placeholder="Enter your first name"
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none text-gray-900 placeholder:text-gray-400"
              disabled={validating}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name
            </label>
            <input
              type="text"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              placeholder="Enter your last name"
              className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-xl focus:border-primary focus:outline-none text-gray-900 placeholder:text-gray-400"
              disabled={validating}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <div className="flex items-center gap-2">
                <AlertCircle size={16} className="flex-shrink-0" />
                <span>{error}</span>
              </div>
              <p className="text-xs text-red-500 mt-1 ml-6">
                Check the exact spelling with your guide. Names are not case-sensitive.
              </p>
            </div>
          )}

          <PrimaryButton
            type="submit"
            fullWidth
            disabled={validating || !firstName.trim() || !lastName.trim()}
          >
            {validating ? (
              <span className="flex items-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Verifying...
              </span>
            ) : (
              'Enter Chat'
            )}
          </PrimaryButton>
        </form>
      </Card>
    </div>
  );
}
