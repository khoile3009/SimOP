import { useMemo } from 'react'
import type { Deck } from '@/engine/types'
import { getAllLeaders, getCardById } from '@/data/cardService'
import { encodeChoice, decodeChoice, type DeckChoice } from './deckChoice'
import { BASE_DECKS, getBaseDeck } from '@/sim/baseDecks'

export default function DeckSelect({
  label,
  value,
  onChange,
  savedDecks,
  allowMirror = false,
}: {
  label: string
  value: DeckChoice
  onChange: (c: DeckChoice) => void
  savedDecks: Deck[]
  allowMirror?: boolean
}) {
  const leadersBySet = useMemo(() => {
    const groups = new Map<string, { id: string; name: string; colors: string }[]>()
    for (const l of getAllLeaders()) {
      const list = groups.get(l.set) ?? []
      list.push({ id: l.id, name: l.name, colors: l.color.join('/') })
      groups.set(l.set, list)
    }
    return [...groups.entries()]
  }, [])

  const resolvedLeader =
    value.kind === 'saved'
      ? getCardById(savedDecks.find((d) => d.id === value.id)?.leader ?? '')
      : value.kind === 'auto'
        ? getCardById(value.leaderId)
        : value.kind === 'base'
          ? getCardById(getBaseDeck(value.id)?.leader ?? '')
          : null

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <span className="ui-label">{label}</span>
      <select
        className="glass-panel w-full px-3 py-2.5 text-sm text-text-primary"
        value={encodeChoice(value)}
        onChange={(e) => onChange(decodeChoice(e.target.value))}
      >
        {allowMirror && <option value="mirror">Mirror the other deck</option>}
        <optgroup label="Base decks (OP16 meta archetypes)">
          {BASE_DECKS.map((d) => (
            <option key={d.id} value={`base:${d.id}`}>
              {d.name} · {getCardById(d.leader)?.name ?? d.leader}
            </option>
          ))}
        </optgroup>
        {savedDecks.length > 0 && (
          <optgroup label="Your saved decks">
            {savedDecks.map((d) => (
              <option key={d.id} value={`saved:${d.id}`}>
                {d.name} · {getCardById(d.leader)?.name ?? d.leader}
              </option>
            ))}
          </optgroup>
        )}
        {leadersBySet.map(([set, leaders]) => (
          <optgroup key={set} label={`${set} auto decks`}>
            {leaders.map((l) => (
              <option key={l.id} value={`auto:${l.id}`}>
                {l.name} ({l.colors}) · {l.id}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      <span className="truncate text-xs text-text-muted">
        {value.kind === 'mirror'
          ? 'Plays whatever the other seat runs.'
          : value.kind === 'base'
            ? (getBaseDeck(value.id)?.archetype ?? 'Pick a deck')
            : resolvedLeader
              ? `${resolvedLeader.name} · ${resolvedLeader.color.join('/')}${value.kind === 'auto' ? ' · auto-built 50' : ''}`
              : 'Pick a deck'}
      </span>
    </div>
  )
}
