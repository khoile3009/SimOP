import type { ReactNode } from 'react'
import { Link, NavLink } from 'react-router-dom'

const NAV = [
  { to: '/play', label: 'Play' },
  { to: '/deck-builder', label: 'Decks' },
  { to: '/cards', label: 'Library' },
  { to: '/watch', label: 'Watch' },
]

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <span className={`font-display font-bold tracking-[0.18em] ${className}`}>
      SIM<span className="text-don-gold">PIECE</span>
    </span>
  )
}

export function AppHeader({ right }: { right?: ReactNode }) {
  return (
    <header className="sticky top-0 z-40 border-b border-glass-border bg-ocean-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-6 px-6">
        <Link to="/" className="text-lg text-text-primary transition-opacity hover:opacity-80">
          <Wordmark />
        </Link>
        <nav className="flex items-center gap-1">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-ocean-800 text-text-primary'
                    : 'text-text-secondary hover:bg-ocean-800/60 hover:text-text-primary'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        {right && <div className="ml-auto flex items-center gap-2">{right}</div>}
      </div>
    </header>
  )
}

interface PageShellProps {
  title?: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
  /** Full-width pages (deck editor) skip the max-width container */
  wide?: boolean
}

export default function PageShell({ title, subtitle, actions, children, wide }: PageShellProps) {
  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <AppHeader />
      <main
        className={`flex w-full flex-1 flex-col gap-5 px-6 py-6 ${wide ? '' : 'mx-auto max-w-7xl'}`}
      >
        {(title || actions) && (
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              {title && <h1 className="font-display text-3xl font-bold tracking-wide">{title}</h1>}
              {subtitle && <p className="mt-1 text-sm text-text-secondary">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-2">{actions}</div>}
          </div>
        )}
        {children}
      </main>
    </div>
  )
}

export function EmptyState({ message, children }: { message: string; children?: ReactNode }) {
  return (
    <div className="glass-panel flex flex-1 flex-col items-center justify-center gap-4 p-12">
      <p className="text-text-muted">{message}</p>
      {children}
    </div>
  )
}
