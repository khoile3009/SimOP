import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'success' | 'gold' | 'danger' | 'ghost' | 'subtle'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
}

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-info-blue text-white hover:brightness-110 shadow-lg shadow-info-blue/20',
  success: 'bg-action-green text-ocean-950 hover:brightness-110 shadow-lg shadow-action-green/20',
  gold: 'bg-don-gold text-ocean-950 hover:brightness-110 shadow-lg shadow-don-gold/25',
  danger: 'bg-life-red text-white hover:brightness-110 shadow-lg shadow-life-red/20',
  ghost: 'bg-transparent text-text-secondary hover:bg-ocean-800 hover:text-text-primary',
  subtle: 'bg-ocean-800 text-text-primary hover:bg-ocean-700 border border-glass-border',
}

const SIZES: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

export default function Button({
  variant = 'subtle',
  size = 'md',
  className = '',
  ...rest
}: ButtonProps) {
  return (
    <button
      className={`rounded-lg font-semibold transition-all duration-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-info-blue active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...rest}
    />
  )
}
