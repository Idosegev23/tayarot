import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ChipProps {
  children: ReactNode;
  variant?: 'default' | 'primary' | 'secondary' | 'warm' | 'success' | 'warning';
  size?: 'sm' | 'md';
  className?: string;
  onClick?: () => void;
}

export function Chip({
  children,
  variant = 'default',
  size = 'md',
  className,
  onClick,
}: ChipProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium transition-all',
        // Variants
        variant === 'default' && 'bg-gray-100 text-gray-700',
        variant === 'primary' && 'bg-primary/10 text-primary',
        variant === 'secondary' && 'bg-secondary/10 text-secondary',
        variant === 'warm' && 'bg-warm/10 text-warm border border-warm/30',
        variant === 'success' && 'bg-green-100 text-green-700',
        variant === 'warning' && 'bg-yellow-100 text-yellow-700',
        // Sizes
        size === 'sm' && 'px-2 py-0.5 text-xs',
        size === 'md' && 'px-3 py-1 text-sm',
        // Clickable
        onClick && 'cursor-pointer hover:opacity-80',
        className
      )}
      onClick={onClick}
    >
      {children}
    </span>
  );
}

interface StatusChipProps {
  status: 'draft' | 'pending' | 'approved' | 'published' | 'rejected';
}

export function StatusChip({ status }: StatusChipProps) {
  const variants: Record<string, { variant: 'default' | 'secondary' | 'success' | 'warning'; label: string }> = {
    draft: { variant: 'default', label: 'Draft' },
    pending: { variant: 'warning', label: 'Pending' },
    approved: { variant: 'secondary', label: 'Approved' },
    published: { variant: 'success', label: 'Published' },
    rejected: { variant: 'default', label: 'Rejected' },
  };

  const { variant, label } = variants[status] || { variant: 'default' as const, label: status };

  return <Chip variant={variant}>{label}</Chip>;
}
