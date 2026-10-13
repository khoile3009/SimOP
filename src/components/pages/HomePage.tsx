import { Link } from 'react-router-dom'
import { SET_MODULES } from '@/data/sets'
import { getAllCards } from '@/data/cardService'
import { Wordmark } from '@/components/common/PageShell'

const MODES = [
  {
    to: '/play',
    title: 'Play',
    desc: 'Face the AI at three strengths, or run a hotseat match.',
    accent: 'border-action-green/40 hover:border-action-green',
    glow: 'group-hover:text-action-green',
  },
  {
    to: '/deck-builder',
    title: 'Deck Builder',
    desc: 'Build 50-card decks around any of the leaders in the pool.',
    accent: 'border-don-gold/40 hover:border-don-gold',
    glow: 'group-hover:text-don-gold',
  },
  {
    to: '/cards',
    title: 'Card Library',
    desc: 'Browse every card with full text, filters and search.',
    accent: 'border-info-blue/40 hover:border-info-blue',
    glow: 'group-hover:text-info-blue',
  },
  {
    to: '/watch',
    title: 'Watch Bots',
    desc: 'Spectate AI matches with a live win-probability bar.',
    accent: 'border-life-red/40 hover:border-life-red',
    glow: 'group-hover:text-life-red',
  },
]

export default function HomePage() {
  const cardCount = getAllCards().length
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-12 p-8">
      <div className="flex flex-col items-center gap-4 text-center">
        <p className="ui-label">One Piece Trading Card Game Simulator</p>
        <h1 className="text-7xl text-text-primary">
          <Wordmark />
        </h1>
        <p className="max-w-lg text-text-secondary">
          A full-fidelity engine for deck building, self-play and analysis — every main set, every
          effect, automated.
        </p>
      </div>

      <div className="grid w-full max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {MODES.map((m) => (
          <Link
            key={m.to}
            to={m.to}
            className={`glass-panel group flex flex-col gap-2 border p-5 transition-all hover:-translate-y-0.5 ${m.accent}`}
          >
            <span
              className={`font-display text-xl font-bold tracking-wide text-text-primary transition-colors ${m.glow}`}
            >
              {m.title}
            </span>
            <span className="text-sm leading-relaxed text-text-secondary">{m.desc}</span>
            <span className="mt-auto pt-2 text-sm text-text-muted transition-transform group-hover:translate-x-1">
              →
            </span>
          </Link>
        ))}
      </div>

      <div className="flex items-center gap-6 text-sm text-text-muted">
        <span>
          <span className="font-semibold text-text-secondary">{SET_MODULES.length}</span> sets
        </span>
        <span className="h-1 w-1 rounded-full bg-ocean-700" />
        <span>
          <span className="font-semibold text-text-secondary">{cardCount.toLocaleString()}</span>{' '}
          cards
        </span>
        <span className="h-1 w-1 rounded-full bg-ocean-700" />
        <span>Greedy · Planner · MCTS opponents</span>
      </div>
    </div>
  )
}
