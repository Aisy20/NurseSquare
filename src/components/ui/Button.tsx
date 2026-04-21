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
          'inline-flex items-center justify-center font-semibold rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed tracking-tight',
          {
            'bg-[var(--plum)] text-white hover:bg-[var(--plum-mid)] focus:ring-[var(--plum)] hover:-translate-y-px': variant === 'primary',
            'bg-[var(--cream-mid)] text-[var(--ink)] hover:bg-[var(--cream-deep)] focus:ring-[var(--g400)]': variant === 'secondary',
            'border border-[var(--g200)] bg-white text-[var(--g800)] hover:border-[var(--plum)] hover:text-[var(--plum)] focus:ring-[var(--plum)]': variant === 'outline',
            'text-[var(--g600)] hover:bg-[var(--cream-mid)] focus:ring-[var(--g400)]': variant === 'ghost',
            'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500': variant === 'danger',
            'bg-[var(--tang)] text-white hover:opacity-90 focus:ring-[var(--tang)] hover:-translate-y-px': variant === 'tang',
            'border border-white/25 text-white hover:bg-white/10 focus:ring-white/30': variant === 'ghost-inv',
          },
          {
            'px-3 py-1.5 text-sm': size === 'sm',
            'px-4 py-2 text-sm': size === 'md',
            'px-6 py-3 text-base': size === 'lg',
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
