import { notFound } from 'next/navigation';
import { getGroupBySlug } from '@/app/actions/groupActions';
import { TouristGate } from './TouristGate';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ guideSlug: string; groupSlug: string }>;
}) {
  const { guideSlug, groupSlug } = await params;
  const { group, guide } = await getGroupBySlug(guideSlug, groupSlug);

  if (!group || !guide) return { title: 'Not Found' };

  return {
    title: `${guide.display_name} - ${group.name}`,
    description: group.description || `Chat with your tour guide ${guide.display_name}`,
  };
}

export default async function TouristGroupPage({
  params,
}: {
  params: Promise<{ guideSlug: string; groupSlug: string }>;
}) {
  const { guideSlug, groupSlug } = await params;
  const { group, guide, error } = await getGroupBySlug(guideSlug, groupSlug);

  if (!group || !guide || error) {
    notFound();
  }

  return (
    <TouristGate
      guideSlug={guideSlug}
      guideName={guide.display_name}
      guideId={guide.id}
      groupId={group.id}
      groupName={group.name}
      groupSlug={groupSlug}
    />
  );
}
