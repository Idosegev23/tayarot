'use client';

import { useEffect } from 'react';
import { PrimaryButton } from '@/components/ui/Button';
import { AlertCircle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <AlertCircle size={64} className="mx-auto text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
        <p className="text-gray-600 mb-6">
          An unexpected error occurred. Please try again.
        </p>
        <div className="flex gap-3 justify-center">
          <PrimaryButton onClick={reset}>Try Again</PrimaryButton>
          <PrimaryButton onClick={() => window.location.href = '/'}>
            Go Home
          </PrimaryButton>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <details className="mt-6 text-left bg-gray-100 p-4 rounded-xl">
            <summary className="cursor-pointer text-sm font-medium text-gray-700">
              Error Details
            </summary>
            <pre className="mt-2 text-xs text-gray-600 overflow-auto">
              {error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
