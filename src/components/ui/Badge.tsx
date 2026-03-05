import { ReactNode } from 'react';

type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'A+'
  | 'A-'
  | 'B+'
  | 'B-'
  | 'AB+'
  | 'AB-'
  | 'O+'
  | 'O-';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-800 border-gray-300',
  success: 'bg-green-100 text-green-800 border-green-300',
  warning: 'bg-orange-100 text-orange-800 border-orange-300',
  danger: 'bg-red-100 text-red-800 border-red-300',
  info: 'bg-blue-100 text-blue-800 border-blue-300',
  'A+': 'bg-red-100 text-red-800 border-red-400',
  'A-': 'bg-red-50 text-red-700 border-red-300',
  'B+': 'bg-orange-100 text-orange-800 border-orange-400',
  'B-': 'bg-orange-50 text-orange-700 border-orange-300',
  'AB+': 'bg-purple-100 text-purple-800 border-purple-400',
  'AB-': 'bg-purple-50 text-purple-700 border-purple-300',
  'O+': 'bg-green-100 text-green-800 border-green-400',
  'O-': 'bg-green-50 text-green-700 border-green-300',
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
};

export function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = ''
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center justify-center font-medium rounded-full border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
}
