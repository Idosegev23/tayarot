import { cn } from '@/lib/utils';

interface LoadingStateProps {
  text?: string;
  className?: string;
}

export function LoadingState({ text = 'Loading...', className }: LoadingStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12', className)}>
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-light border-t-primary"></div>
      <p className="mt-4 text-gray-600">{text}</p>
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl shadow-md p-4 animate-pulse">
      <div className="flex gap-4">
        <div className="w-20 h-20 bg-gray-200 rounded-lg"></div>
        <div className="flex-1 space-y-3">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="aspect-square bg-gray-200 rounded-xl animate-pulse"></div>
      ))}
    </div>
  );
}
