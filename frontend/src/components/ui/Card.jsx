import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/cn';

/**
 * Base card surface. `interactive` adds the lift+shadow-growth hover effect
 * the spec calls for on listing cards - pass it only for clickable cards,
 * not for static content containers (e.g. a form section).
 */
const Card = forwardRef(({ children, className, interactive = false, ...props }, ref) => {
  const Comp = interactive ? motion.div : 'div';
  const motionProps = interactive
    ? {
        whileHover: { y: -4 },
        transition: { duration: 0.2, ease: 'easeOut' },
      }
    : {};

  return (
    <Comp
      ref={ref}
      className={cn(
        'bg-paper-50 rounded-card border border-paper-200',
        'shadow-card',
        interactive && 'cursor-pointer hover:shadow-card-hover transition-shadow duration-200',
        className
      )}
      {...motionProps}
      {...props}
    >
      {children}
    </Comp>
  );
});

Card.displayName = 'Card';

export default Card;
