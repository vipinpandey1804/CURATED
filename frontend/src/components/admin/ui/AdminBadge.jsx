import { cva } from 'class-variance-authority';
import { cn } from '../../../lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-gray-100 text-gray-800',
        success: 'bg-emerald-100 text-emerald-800',
        warning: 'bg-amber-100 text-amber-800',
        destructive: 'bg-red-100 text-red-800',
        info: 'bg-blue-100 text-blue-800',
        purple: 'bg-purple-100 text-purple-800',
        outline: 'border border-gray-300 text-gray-700',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export function AdminBadge({ className, variant, ...props }) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}

/** Maps common status strings to badge variants */
export function statusVariant(status) {
  const map = {
    // Order status
    PENDING: 'warning',
    CONFIRMED: 'info',
    PROCESSING: 'info',
    SHIPPED: 'purple',
    DELIVERED: 'success',
    CANCELLED: 'destructive',
    // Payment
    PAID: 'success',
    UNPAID: 'warning',
    PARTIALLY_REFUNDED: 'warning',
    FULLY_REFUNDED: 'info',
    FAILED: 'destructive',
    // Fulfillment
    UNFULFILLED: 'warning',
    PARTIALLY_FULFILLED: 'info',
    FULFILLED: 'success',
    // Returns
    REQUESTED: 'warning',
    APPROVED: 'success',
    REJECTED: 'destructive',
    RECEIVED: 'info',
    REFUNDED: 'purple',
    // Generic
    active: 'success',
    inactive: 'default',
    true: 'success',
    false: 'default',
  };
  return map[status] || 'default';
}
