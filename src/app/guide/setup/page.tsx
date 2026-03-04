import { redirect } from 'next/navigation';
import { getAuthenticatedGuide } from '@/app/actions/guideAuth';
import { GuideSetupForm } from './GuideSetupForm';

export const metadata = {
  title: 'Complete Your Profile',
};

export default async function GuideSetupPage() {
  const guide = await getAuthenticatedGuide();

  if (!guide) {
    redirect('/guide/login');
  }

  // If guide already has a slug (profile completed), go to dashboard
  if (guide.slug) {
    redirect('/guide/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome!</h1>
          <p className="text-gray-600 mt-2">Complete your guide profile to get started</p>
        </div>
        <GuideSetupForm email={guide.email || ''} currentName={guide.display_name} />
      </div>
    </div>
  );
}
