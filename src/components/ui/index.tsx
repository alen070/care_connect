/**
 * ============================================
 * SHARED UI COMPONENTS
 * ============================================
 * Reusable, styled components used throughout the app.
 */

import { type ReactNode, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes, type ButtonHTMLAttributes, forwardRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/utils/cn';

/* ─── Button ─── */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, className, children, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer';
    const variants = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-sm shadow-blue-200',
      secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-400',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
      success: 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500',
      ghost: 'text-gray-600 hover:bg-gray-100 focus:ring-gray-400',
      outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500',
    };
    const sizes = {
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-5 py-2.5 text-sm gap-2',
      lg: 'px-7 py-3 text-base gap-2.5',
    };

    return (
      <button ref={ref} className={cn(base, variants[variant], sizes[size], className)} disabled={loading || props.disabled} {...props}>
        {loading ? (
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
        ) : null}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

/* ─── Input ─── */
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <input
        ref={ref}
        className={cn(
          'w-full px-4 py-2.5 rounded-xl border bg-white text-gray-900 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          'placeholder:text-gray-400',
          error ? 'border-red-400 focus:ring-red-500' : 'border-gray-200',
          className
        )}
        {...props}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
);
Input.displayName = 'Input';

/* ─── Textarea ─── */
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <textarea
        ref={ref}
        className={cn(
          'w-full px-4 py-2.5 rounded-xl border bg-white text-gray-900 transition-colors resize-none',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          'placeholder:text-gray-400',
          error ? 'border-red-400 focus:ring-red-500' : 'border-gray-200',
          className
        )}
        rows={4}
        {...props}
      />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
);
Textarea.displayName = 'Textarea';

/* ─── Select ─── */
interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className, ...props }, ref) => (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <select
        ref={ref}
        className={cn(
          'w-full px-4 py-2.5 rounded-xl border bg-white text-gray-900 transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
          error ? 'border-red-400 focus:ring-red-500' : 'border-gray-200',
          className
        )}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
);
Select.displayName = 'Select';

/* ─── Card ─── */
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}
export function Card({ children, className, ...props }: CardProps) {
  return (
    <div className={cn('bg-white rounded-2xl border border-gray-100 shadow-sm', className)} {...props}>
      {children}
    </div>
  );
}

/* ─── Badge ─── */
interface BadgeProps {
  children: ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'danger' | 'neutral';
  className?: string;
}

export function Badge({ children, variant = 'neutral', className }: BadgeProps) {
  const variants = {
    info: 'bg-blue-50 text-blue-700 ring-blue-600/20',
    success: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    warning: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    danger: 'bg-red-50 text-red-700 ring-red-600/20',
    neutral: 'bg-gray-50 text-gray-700 ring-gray-600/20',
  };

  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ring-1 ring-inset',
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
}

/* ─── Modal ─── */
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  const modalContent = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative bg-white rounded-2xl shadow-xl w-full max-h-[90vh] flex flex-col', sizes[size])}>
        <div className="shrink-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} type="button" className="p-1 rounded-lg hover:bg-gray-100 cursor-pointer">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}

/* ─── Stats Card ─── */
export function StatsCard({ icon, label, value, color }: {
  icon: ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-4">
        <div className={cn('p-3 rounded-xl', color)}>
          {icon}
        </div>
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </Card>
  );
}

/* ─── Empty State ─── */
export function EmptyState({ icon, title, description }: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="p-4 bg-gray-50 rounded-2xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">{title}</h3>
      <p className="text-sm text-gray-500 max-w-sm">{description}</p>
    </div>
  );
}

/* ─── Tabs ─── */
export function Tabs({ tabs, activeTab, onChange }: {
  tabs: { id: string; label: string; icon?: ReactNode }[];
  activeTab: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer',
            activeTab === tab.id
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          )}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  );
}

/* ─── Loading Spinner ─── */
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className="flex justify-center py-8">
      <div className={cn('animate-spin rounded-full border-2 border-gray-200 border-t-blue-600', sizes[size])} />
    </div>
  );
}

/* ─── Progress Bar ─── */
export function ProgressBar({ value, max = 100, color = 'blue' }: {
  value: number;
  max?: number;
  color?: 'blue' | 'green' | 'red' | 'amber';
}) {
  const percentage = Math.min(100, (value / max) * 100);
  const colors = {
    blue: 'bg-blue-500',
    green: 'bg-emerald-500',
    red: 'bg-red-500',
    amber: 'bg-amber-500',
  };

  return (
    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
      <div
        className={cn('h-full rounded-full transition-all duration-500', colors[color])}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

/* ─── Star Rating ─── */
export function StarRating({ rating, onRate, onChange, readonly = false, size = 'md' }: {
  rating: number;
  onRate?: (r: number) => void;
  onChange?: (r: number) => void; // alias for onRate
  readonly?: boolean;
  size?: 'sm' | 'md' | 'lg';
}) {
  const sizes = { sm: 'text-sm', md: 'text-lg', lg: 'text-2xl' };
  const handleRate = (r: number) => {
    if (onRate) onRate(r);
    if (onChange) onChange(r);
  };
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => !readonly && handleRate(star)}
          disabled={readonly}
          className={cn(
            'transition-colors',
            sizes[size],
            readonly ? '' : 'cursor-pointer hover:scale-110',
            star <= rating ? 'text-amber-400' : 'text-gray-200'
          )}
        >
          ★
        </button>
      ))}
    </div>
  );
}

/* ─── Re-export Image Viewer Modal ─── */
export { ImageViewerModal } from './ImageViewerModal';
