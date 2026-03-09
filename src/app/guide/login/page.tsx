import { GuideLoginForm } from './GuideLoginForm';

export const metadata = {
  title: 'Guide Login',
};

export default function GuideLoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-green-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Guide Portal</h1>
          <p className="text-gray-600 mt-2">Sign in to manage your groups and tourists</p>
          <p className="text-sm text-gray-400 mt-1">Enter the email your admin registered for you</p>
        </div>
        <GuideLoginForm />
      </div>
    </div>
  );
}
