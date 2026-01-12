import { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'font-medium rounded-xl transition-all active:scale-95',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100',
        // Variants
        variant === 'primary' && 'bg-primary text-white hover:bg-opacity-90 shadow-md',
        variant === 'secondary' && 'bg-secondary text-white hover:bg-opacity-90 shadow-md',
        variant === 'outline' && 'border-2 border-secondary text-secondary hover:bg-secondary hover:text-white',
        variant === 'ghost' && 'text-accent hover:bg-light/30',
        // Sizes
        size === 'sm' && 'px-4 py-2 text-sm min-h-[40px]',
        size === 'md' && 'px-6 py-3 text-base min-h-[48px]',
        size === 'lg' && 'px-8 py-4 text-lg min-h-[56px]',
        // Full width
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}

export function PrimaryButton(props: Omit<ButtonProps, 'variant'>) {
  return <Button variant="primary" {...props} />;
}

export function SecondaryButton(props: Omit<ButtonProps, 'variant'>) {
  return <Button variant="secondary" {...props} />;
}
