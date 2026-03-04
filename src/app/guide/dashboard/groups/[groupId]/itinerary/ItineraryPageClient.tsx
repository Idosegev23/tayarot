'use client';

import { useRouter } from 'next/navigation';
import { ItineraryBuilder } from '@/components/ItineraryBuilder';
import { ArrowLeft } from 'lucide-react';
import type { ItineraryDayDraft } from '@/lib/types';

interface ItineraryPageClientProps {
  groupId: string;
  groupName: string;
  initialDays: ItineraryDayDraft[];
}

export function ItineraryPageClient({ groupId, groupName, initialDays }: ItineraryPageClientProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.push(`/guide/dashboard/groups/${groupId}`)}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 text-sm mb-2"
          >
            <ArrowLeft size={16} />
            {groupName}
          </button>
          <h1 className="text-xl font-bold text-gray-900">Edit Itinerary</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <ItineraryBuilder
          groupId={groupId}
          initialDays={initialDays}
          onSaved={() => router.push(`/guide/dashboard/groups/${groupId}`)}
        />
      </div>
    </div>
  );
}
