import { redirect } from 'next/navigation';

interface PageProps {
  searchParams: Promise<{ k?: string }>;
}

export default async function TourismDashboardPage({ searchParams }: PageProps) {
  const { k: accessKey } = await searchParams;
  redirect(accessKey ? `/?k=${accessKey}` : '/');
}
