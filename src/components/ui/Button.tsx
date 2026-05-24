import { cn } from '@/lib/utils'
import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'tang' | 'ghost-inv'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'focus-ring inline-flex items-center justify-center rounded-lg font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50',
          {
            'bg-[var(--plum)] text-white shadow-[0_8px_18px_rgba(45,27,105,0.18)] hover:bg-[var(--plum-mid)] hover:-translate-y-px': variant === 'primary',
            'bg-[var(--cream-mid)] text-[var(--ink)] hover:bg-[var(--cream-deep)]': variant === 'secondary',
            'border border-[var(--g200)] bg-[var(--surface)] text-[var(--g800)] hover:border-[var(--plum)] hover:text-[var(--plum)]': variant === 'outline',
            'text-[var(--g600)] hover:bg-[var(--cream-mid)] hover:text-[var(--ink)]': variant === 'ghost',
            'bg-red-600 text-white hover:bg-red-700': variant === 'danger',
            'bg-[var(--tang)] text-white shadow-[0_8px_18px_rgba(233,95,47,0.20)] hover:bg-[var(--tang-mid)] hover:-translate-y-px': variant === 'tang',
            'border border-white/25 text-white hover:bg-white/10': variant === 'ghost-inv',
          },
          {
            'px-3 py-1.5 text-xs': size === 'sm',
            'px-4 py-2.5 text-sm': size === 'md',
            'px-5 py-3 text-sm': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {loading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
export default Button
