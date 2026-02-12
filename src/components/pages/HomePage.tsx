import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-5xl font-bold tracking-tight text-text-primary">SimPiece</h1>
      <p className="text-lg text-text-secondary">One Piece TCG Simulator</p>

      <div className="flex gap-4">
        <Link
          to="/deck-builder"
          className="glass-panel px-6 py-3 text-don-gold transition-colors hover:text-text-primary"
        >
          Deck Builder
        </Link>
        <Link
          to="/play"
          className="glass-panel px-6 py-3 text-action-green transition-colors hover:text-text-primary"
        >
          Play
        </Link>
        <Link
          to="/cards"
          className="glass-panel px-6 py-3 text-info-blue transition-colors hover:text-text-primary"
        >
          Card Library
        </Link>
      </div>
    </div>
  )
}
