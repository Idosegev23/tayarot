import { redirect, notFound } from 'next/navigation';
import { getAuthenticatedGuide } from '@/app/actions/guideAuth';
import { getGroupWithItinerary } from '@/app/actions/groupActions';
import { ItineraryPageClient } from './ItineraryPageClient';

export const metadata = {
  title: 'Edit Itinerary',
};

export default async function ItineraryPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const guide = await getAuthenticatedGuide();
  if (!guide || !guide.id) redirect('/guide/login');

  const { group, days, error } = await getGroupWithItinerary(groupId);

  if (!group || error) notFound();
  if (group.guide_id !== guide.id) notFound();

  // Convert DB data to draft format
  const initialDays = days.map(d => ({
    tempId: d.id,
    day_number: d.day_number,
    date: d.date || undefined,
    title: d.title || undefined,
    stops: d.stops.map(s => ({
      tempId: s.id,
      order_index: s.order_index,
      location_name: s.location_name,
      time: s.time || undefined,
      duration_minutes: s.duration_minutes || undefined,
      description: s.description || undefined,
      fun_facts: s.fun_facts || undefined,
      lat: s.lat || undefined,
      lng: s.lng || undefined,
    })),
  }));

  return (
    <ItineraryPageClient
      groupId={groupId}
      groupName={group.name}
      initialDays={initialDays}
    />
  );
}
