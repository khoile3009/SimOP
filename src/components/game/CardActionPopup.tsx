export interface CardActions {
  onPlay: (instanceId: string) => void
  onAttack: (instanceId: string) => void
  onInspect: (instanceId: string) => void
  onDeselect: () => void
  isMainPhase: boolean
  activeDon: number
  isInBattle: boolean
  turnNumber: number
}

interface Action {
  label: string
  onClick: () => void
  primary?: boolean
  disabled?: boolean
  hint?: string
}

interface CardActionPopupProps {
  actions: Action[]
  onDeselect: () => void
}

export default function CardActionPopup({ actions, onDeselect }: CardActionPopupProps) {
  return (
    <div
      className="absolute bottom-full left-1/2 z-30 mb-2 flex -translate-x-1/2 items-center gap-1 rounded-lg bg-ocean-900/95 px-2 py-1.5 shadow-lg ring-1 ring-info-blue/40"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {actions.map((a) => (
        <button
          key={a.label}
          onClick={a.onClick}
          disabled={a.disabled}
          title={a.hint}
          className={`whitespace-nowrap rounded px-2.5 py-1 text-[11px] font-medium transition-colors ${
            a.primary
              ? 'bg-action-green text-white hover:bg-green-600'
              : a.disabled
                ? 'cursor-not-allowed bg-ocean-800 text-text-muted/50'
                : 'bg-ocean-700 text-text-secondary hover:bg-ocean-600'
          }`}
        >
          {a.label}
        </button>
      ))}
      <button
        onClick={onDeselect}
        className="ml-0.5 rounded px-1.5 py-1 text-[11px] text-text-muted hover:bg-ocean-700 hover:text-text-primary"
        title="Deselect (Esc)"
      >
        ✕
      </button>
    </div>
  )
}
