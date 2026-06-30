import { cn } from '../../lib/cn';

const variantStyles = {
  coral: 'bg-coral-50 text-coral-700',
  teal: 'bg-teal-50 text-teal-600',
  neutral: 'bg-paper-200 text-ink-700',
  success: 'bg-green-50 text-success-500',
};

/**
 * Small pill used for distance ("1.2 km"), role badges ("Owner"), and
 * amenity tags. `mono` switches to the tabular-numeral mono font - use
 * this specifically for the distance figure, the app's signature element.
 */
const Badge = ({ children, variant = 'neutral', mono = false, className }) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-pill px-2.5 py-1 text-xs font-medium',
        mono && 'distance-figure',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
};

export default Badge;
