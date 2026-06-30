import { forwardRef, useId } from 'react';
import { cn } from '../../lib/cn';

/**
 * Standard text input with built-in label + error message handling.
 * Designed to plug directly into react-hook-form's register():
 *   <Input label="Email" {...register('email')} error={errors.email?.message} />
 */
const Input = forwardRef(
  ({ label, error, icon: Icon, className, type = 'text', id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-ink-700 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <Icon
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-300"
              aria-hidden="true"
            />
          )}
          <input
            ref={ref}
            id={inputId}
            type={type}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : undefined}
            className={cn(
              'w-full h-11 rounded-control border bg-paper-50 px-3.5 text-[15px] text-ink-900',
              'placeholder:text-ink-300 transition-colors duration-150',
              'focus-visible:outline-2 focus-visible:outline-teal-500 focus-visible:outline-offset-1',
              error ? 'border-danger-500' : 'border-paper-300 hover:border-ink-300',
              Icon && 'pl-10',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p id={`${inputId}-error`} className="mt-1.5 text-sm text-danger-500">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
