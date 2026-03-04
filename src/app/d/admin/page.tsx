import { redirect } from 'next/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{ k?: string }>;
}

export default async function AdminDashboardPage({ searchParams }: PageProps) {
  const { k: accessKey } = await searchParams;
  redirect(accessKey ? `/?k=${accessKey}` : '/');
}
