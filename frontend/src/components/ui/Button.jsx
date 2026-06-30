import { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/cn';

const variantStyles = {
  primary: 'bg-teal-500 text-paper-50 hover:bg-teal-600 active:bg-teal-700',
  secondary: 'bg-paper-50 text-ink-900 border border-paper-300 hover:border-teal-300 hover:bg-paper-50',
  ghost: 'bg-transparent text-ink-700 hover:bg-paper-200',
  danger: 'bg-danger-500 text-paper-50 hover:bg-red-700',
  coral: 'bg-coral-500 text-paper-50 hover:bg-coral-600 active:bg-coral-700',
};

const sizeStyles = {
  sm: 'h-9 px-3.5 text-sm gap-1.5',
  md: 'h-11 px-5 text-[15px] gap-2',
  lg: 'h-13 px-7 text-base gap-2.5',
};

/**
 * Base button used everywhere in the app. Wraps framer-motion for a
 * consistent, subtle press feedback (scale down slightly on tap) rather
 * than each call site reinventing micro-interactions.
 *
 * Usage: <Button variant="primary" size="md" onClick={...}>Search rooms</Button>
 */
const Button = forwardRef(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      className,
      disabled,
      type = 'button',
      icon: Icon,
      iconPosition = 'left',
      ...props
    },
    ref
  ) => {
    return (
      <motion.button
        ref={ref}
        type={type}
        disabled={disabled}
        whileTap={disabled ? {} : { scale: 0.97 }}
        transition={{ duration: 0.1 }}
        className={cn(
          'inline-flex items-center justify-center rounded-control font-medium',
          'transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed',
          'focus-visible:outline-2 focus-visible:outline-teal-500 focus-visible:outline-offset-2',
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {Icon && iconPosition === 'left' && <Icon size={size === 'sm' ? 16 : 18} aria-hidden="true" />}
        {children}
        {Icon && iconPosition === 'right' && <Icon size={size === 'sm' ? 16 : 18} aria-hidden="true" />}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
