import { cn } from '../../lib/cn';

/**
 * Shimmer skeleton block - used in place of spinners per the design spec.
 * Compose shapes with className, e.g.:
 *   <Skeleton className="h-48 w-full rounded-card" />   // image placeholder
 *   <Skeleton className="h-4 w-3/4 rounded" />            // text line
 */
const Skeleton = ({ className }) => {
  return <div className={cn('skeleton rounded-control', className)} aria-hidden="true" />;
};

export default Skeleton;
