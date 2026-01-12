import Link from 'next/link';
import { PrimaryButton } from '@/components/ui/Button';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center">
        <FileQuestion size={64} className="mx-auto text-gray-400 mb-4" />
        <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link href="/">
          <PrimaryButton>Go Home</PrimaryButton>
        </Link>
      </div>
    </div>
  );
}
