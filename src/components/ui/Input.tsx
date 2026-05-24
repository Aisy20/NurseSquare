import { cn } from '@/lib/utils'
import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="space-y-1">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-[var(--g800)]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'focus-ring block w-full rounded-lg border bg-[var(--surface)] px-3 py-2.5 text-sm text-[var(--ink)] shadow-[var(--shadow-sm)] transition-colors placeholder:text-[var(--g400)]',
            error
              ? 'border-red-300'
              : 'border-[var(--g200)] hover:border-[var(--g400)]',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        {hint && !error && <p className="text-xs text-[var(--g600)]">{hint}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
export default Input
