import { redirect } from 'next/navigation';
import { getAuthenticatedGuide } from '@/app/actions/guideAuth';
import { CreateGroupForm } from './CreateGroupForm';

export const metadata = {
  title: 'Create Group',
};

export default async function CreateGroupPage() {
  const guide = await getAuthenticatedGuide();
  if (!guide || !guide.id) redirect('/guide/login');

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-xl font-bold text-gray-900">Create New Group</h1>
        </div>
      </header>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <CreateGroupForm />
      </div>
    </div>
  );
}
