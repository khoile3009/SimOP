import { Link } from 'react-router-dom'

export default function PlayPage() {
  return (
    <div className="flex flex-1 flex-col p-6">
      <div className="mb-6 flex items-center gap-4">
        <Link to="/" className="text-text-secondary hover:text-text-primary">
          &larr; Home
        </Link>
        <h1 className="text-2xl font-bold">Play</h1>
      </div>
      <div className="glass-panel flex flex-1 items-center justify-center">
        <p className="text-text-muted">Game board coming soon...</p>
      </div>
    </div>
  )
}
