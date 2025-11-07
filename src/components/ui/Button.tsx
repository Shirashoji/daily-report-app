// src/components/ui/Button.tsx
import { ButtonHTMLAttributes, ReactNode, ReactElement } from 'react';
import clsx from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: ReactNode;
  isLoading?: boolean;
}

/**
 * A reusable button component with variants and sizes.
 * @component
 */
export function Button({
  variant = 'primary',
  size = 'md',
  children,
  isLoading = false,
  className,
  disabled,
  ...props
}: ButtonProps): ReactElement {
  return (
    <button
      className={clsx(
        'font-bold rounded transition-colors',
        {
          'bg-blue-500 hover:bg-blue-700 text-white': variant === 'primary',
          'bg-gray-500 hover:bg-gray-700 text-white': variant === 'secondary',
          'bg-red-500 hover:bg-red-700 text-white': variant === 'danger',
          'py-1 px-2 text-sm': size === 'sm',
          'py-2 px-4 text-base': size === 'md',
          'py-3 px-6 text-lg': size === 'lg',
          'opacity-50 cursor-not-allowed': disabled || isLoading,
        },
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? 'Loading...' : children}
    </button>
  );
}