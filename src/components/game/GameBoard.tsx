import { useCallback, useEffect, useRef, useState } from 'react'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent, DragMoveEvent, DragStartEvent } from '@dnd-kit/core'
import type { PlayerId, CardData, GameCard } from '@/engine/types'
import { getCardById } from '@/data/cardService'
import { getCardImageUrl } from '@/utils/images'
import { useGameStore } from '@/stores/gameStore'
import { getOpponent } from '@/engine'
import type { DragCardData } from '@/hooks/useDragCard'
import type { CardActions } from './CardActionPopup'
import PlayerSide from './PlayerSide'
import HandZone from './HandZone'
import PhaseBar from './PhaseBar'
import ControlsBar from './ControlsBar'
import CardDetail from '@/components/cards/CardDetail'
import AttackArrow from './AttackArrow'

export default function GameBoard() {
  const {
    gameState,
    selectedTarget,
    donAttachCount,
    error,
    dispatch,
    select,
    clearSelection,
    incrementDonAttach,
    resetDonAttach,
  } = useGameStore()

  const [inspecting, setInspecting] = useState<CardData | null>(null)
  const [attackingFrom, setAttackingFrom] = useState<string | null>(null)
  const [draggingCard, setDraggingCard] = useState<GameCard | null>(null)
  const [attackArrowSource, setAttackArrowSource] = useState<{ x: number; y: number } | null>(null)
  const [counterSelection, setCounterSelection] = useState<string[]>([])


  const arrowLineRef = useRef<SVGLineElement | null>(null)
  const attackStartPointerRef = useRef<{ x: number; y: number } | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const current = gameState?.currentPlayer ?? 'player1'
  const opponent = gameState ? getOpponent(current) : 'player2'

  const selectedId = selectedTarget?.type === 'card' ? selectedTarget.instanceId : null

  // Handle card selection on own side
  const handleSelectCard = useCallback(
    (instanceId: string, zone: 'leader' | 'character' | 'hand') => {
      if (attackingFrom) {
        dispatch(
          { type: 'DECLARE_ATTACK', attackerId: attackingFrom, targetId: instanceId },
          current,
        )
        setAttackingFrom(null)
        return
      }
      select({ type: 'card', instanceId, zone })
    },
    [attackingFrom, current, dispatch, select],
  )

  // Handle opponent card click (for attack targeting)
  const handleSelectOpponentCard = useCallback(
    (instanceId: string) => {
      if (attackingFrom) {
        dispatch(
          { type: 'DECLARE_ATTACK', attackerId: attackingFrom, targetId: instanceId },
          current,
        )
        setAttackingFrom(null)
      }
    },
    [attackingFrom, current, dispatch],
  )

  // Card action handlers (used by popup on each card)
  const handlePlayCard = useCallback(
    (instanceId: string) => {
      dispatch({ type: 'PLAY_CARD', cardInstanceId: instanceId }, current)
    },
    [current, dispatch],
  )

  const handleAttackFrom = useCallback(
    (instanceId: string) => {
      setAttackingFrom(instanceId)
      clearSelection()
    },
    [clearSelection],
  )

  const handleInspectCard = useCallback(
    (instanceId: string) => {
      if (!gameState) return
      const p = gameState.players[current]
      const card = [p.leader, ...p.characters, ...p.hand].find((c) => c.instanceId === instanceId)
      if (card) {
        const data = getCardById(card.cardId)
        if (data) setInspecting(data)
      }
    },
    [gameState, current],
  )

  const handleDeselect = useCallback(() => {
    clearSelection()
    setAttackingFrom(null)
    resetDonAttach()
  }, [clearSelection, resetDonAttach])

  const handleDonClick = useCallback(() => {
    if (!gameState || gameState.currentPlayer !== current) return
    const activeDon = gameState.players[current].donArea.filter((d) => !d.isRested).length
    if (activeDon === 0 || donAttachCount >= activeDon) return
    if (donAttachCount === 0) {
      select({ type: 'don' })
    }
    incrementDonAttach()
  }, [current, gameState, donAttachCount, select, incrementDonAttach])

  // Counter handlers
  const handleToggleCounter = useCallback((instanceId: string) => {
    setCounterSelection((prev) =>
      prev.includes(instanceId) ? prev.filter((id) => id !== instanceId) : [...prev, instanceId],
    )
  }, [])

  const handleUseCounter = useCallback(() => {
    if (!gameState?.battle || counterSelection.length === 0) return
    dispatch(
      { type: 'USE_COUNTER', cardInstanceIds: counterSelection },
      gameState.battle.defenderPlayer,
    )
    setCounterSelection([])
  }, [gameState, counterSelection, dispatch])

  const handlePassCounter = useCallback(() => {
    if (!gameState?.battle) return
    dispatch({ type: 'PASS_COUNTER' }, gameState.battle.defenderPlayer)
    setCounterSelection([])
  }, [gameState, dispatch])

  // Drag-and-drop handlers
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const data = event.active.data.current as DragCardData | undefined
      if (!data) return

      if (data.zone === 'hand') {
        setDraggingCard(data.card)
      } else if (data.zone === 'character') {
        clearSelection()
        const activator = event.activatorEvent as PointerEvent
        // Store initial pointer for computing position in onDragMove
        attackStartPointerRef.current = { x: activator.clientX, y: activator.clientY }
        // Get card center for arrow source
        const target = activator.target as HTMLElement
        const rect = target.getBoundingClientRect()
        setAttackArrowSource({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        })
      }
    },
    [clearSelection],
  )

  const handleDragMove = useCallback((event: DragMoveEvent) => {
    if (arrowLineRef.current && attackStartPointerRef.current) {
      const currentX = attackStartPointerRef.current.x + event.delta.x
      const currentY = attackStartPointerRef.current.y + event.delta.y
      arrowLineRef.current.setAttribute('x2', String(currentX))
      arrowLineRef.current.setAttribute('y2', String(currentY))
    }
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setDraggingCard(null)
      setAttackArrowSource(null)
      attackStartPointerRef.current = null

      const { active, over } = event
      const data = active.data.current as DragCardData | undefined
      if (!over || !data) return

      // Hand card → character zone = play card
      if (data.zone === 'hand' && over.id === 'character-zone') {
        dispatch({ type: 'PLAY_CARD', cardInstanceId: data.card.instanceId }, current)
        return
      }

      // Character/Leader → attack target = declare attack
      if (data.zone === 'character' && typeof over.id === 'string' && over.id.startsWith('attack-target-')) {
        const targetId = (over.id as string).slice('attack-target-'.length)
        dispatch(
          { type: 'DECLARE_ATTACK', attackerId: data.card.instanceId, targetId },
          current,
        )
      }
    },
    [current, dispatch],
  )

  const handleDragCancel = useCallback(() => {
    setDraggingCard(null)
    setAttackArrowSource(null)
    attackStartPointerRef.current = null
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleDeselect()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleDeselect])

  if (!gameState) return null

  // Mulligan UI
  if (gameState.phase === 'SETUP') {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6">
        <h2 className="text-xl font-bold">Mulligan Phase</h2>
        {(['player1', 'player2'] as PlayerId[]).map((pid) => (
          <div key={pid} className="glass-panel flex flex-col items-center gap-3 p-4">
            <p className="text-sm font-medium">{pid === 'player1' ? 'Player 1' : 'Player 2'}</p>
            <div className="flex items-center gap-1.5">
              {gameState.players[pid].hand.map((card) => {
                const data = getCardById(card.cardId)
                return (
                  <div key={card.instanceId} className="w-16 overflow-hidden rounded">
                    <img
                      src={getCardImageUrl(card.cardId)}
                      alt={data?.name ?? ''}
                      className="w-full"
                      draggable={false}
                    />
                  </div>
                )
              })}
            </div>
            {gameState.mulliganState[pid] === 'pending' ? (
              <div className="flex gap-2">
                <button
                  onClick={() => dispatch({ type: 'MULLIGAN', accept: true }, pid)}
                  className="rounded bg-action-green px-4 py-1.5 text-sm font-medium text-white hover:bg-green-600"
                >
                  Keep Hand
                </button>
                <button
                  onClick={() => dispatch({ type: 'MULLIGAN', accept: false }, pid)}
                  className="rounded bg-ocean-700 px-4 py-1.5 text-sm font-medium hover:bg-ocean-600"
                >
                  Mulligan
                </button>
              </div>
            ) : (
              <p className="text-sm text-text-muted">
                {gameState.mulliganState[pid] === 'accepted' ? 'Kept hand' : 'Mulliganed'}
              </p>
            )}
          </div>
        ))}
      </div>
    )
  }

  // Counter mode: determine which hand should show counter selection
  const isCounterStep = !!gameState.battle && gameState.battle.step === 'COUNTER'
  const defenderPlayer = gameState.battle?.defenderPlayer
  const counterTotal = counterSelection.reduce((sum, id) => {
    const defHand = defenderPlayer ? gameState.players[defenderPlayer].hand : []
    const card = defHand.find((c) => c.instanceId === id)
    if (!card) return sum
    const data = getCardById(card.cardId)
    return sum + (data?.counter ?? 0)
  }, 0)

  const cardActions: CardActions = {
    onPlay: handlePlayCard,
    onAttack: handleAttackFrom,
    onInspect: handleInspectCard,
    onDeselect: handleDeselect,
    isMainPhase: gameState.phase === 'MAIN' && gameState.currentPlayer === current,
    activeDon: gameState.players[current].donArea.filter((d) => !d.isRested).length,
    isInBattle: !!gameState.battle,
    turnNumber: gameState.turnNumber,
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
    <div className="flex flex-1 flex-col gap-1 overflow-hidden p-2">
      {/* Opponent hand */}
      <HandZone
        cards={gameState.players[opponent].hand}
        flipped
        selectedId={null}
        onSelect={() => {}}
        counterMode={isCounterStep && defenderPlayer === opponent ? {
          selectedIds: counterSelection,
          onToggle: handleToggleCounter,
        } : undefined}
      />

      {/* Opponent side */}
      <PlayerSide
        player={gameState.players[opponent]}
        isActive={false}
        selectedId={null}
        donAttachCount={0}
        onSelectCard={(id) => handleSelectOpponentCard(id)}
        onClickDon={() => {}}
        attackTargets
      />

      {/* Phase bar */}
      <div className="flex items-center gap-3" style={{ minHeight: 40 }}>
        <PhaseBar
          phase={gameState.phase}
          turnNumber={gameState.turnNumber}
          currentPlayer={current}
        />
        {attackingFrom && (
          <span className="rounded bg-life-red/20 px-3 py-1 text-xs font-medium text-life-red">
            Select target...
          </span>
        )}
        {error && <span className="text-xs text-life-red">{error}</span>}
      </div>

      {/* Current player side */}
      <PlayerSide
        player={gameState.players[current]}
        isActive={true}
        selectedId={selectedId}
        donAttachCount={donAttachCount}
        onSelectCard={(id, zone) => handleSelectCard(id, zone)}
        onClickDon={handleDonClick}
        cardActions={cardActions}
      />

      {/* Current player hand */}
      <HandZone
        cards={gameState.players[current].hand}
        selectedId={selectedId}
        onSelect={(id) => handleSelectCard(id, 'hand')}
        cardActions={cardActions}
        counterMode={isCounterStep && defenderPlayer === current ? {
          selectedIds: counterSelection,
          onToggle: handleToggleCounter,
        } : undefined}
      />

      {/* Controls */}
      <ControlsBar
        gameState={gameState}
        onEndTurn={() => dispatch({ type: 'END_TURN' }, current)}
        onDeclineBlock={() => dispatch({ type: 'DECLINE_BLOCK' }, gameState.battle?.defenderPlayer ?? opponent)}
        onPassCounter={handlePassCounter}
        onUseCounter={handleUseCounter}
        counterTotal={counterTotal}
        counterCount={counterSelection.length}
      />

      {/* Card inspect modal */}
      {inspecting && <CardDetail card={inspecting} onClose={() => setInspecting(null)} />}

      {/* Game over */}
      {gameState.winner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="glass-panel p-8 text-center">
            <h2 className="mb-2 text-2xl font-bold text-don-gold">
              {gameState.winner === 'player1' ? 'Player 1' : 'Player 2'} Wins!
            </h2>
            <p className="text-text-secondary">
              Turn {gameState.turnNumber}
            </p>
          </div>
        </div>
      )}
    </div>

    {/* Attack arrow overlay */}
    {attackArrowSource && (
      <AttackArrow sourceX={attackArrowSource.x} sourceY={attackArrowSource.y} lineRef={arrowLineRef} />
    )}

    <DragOverlay dropAnimation={null}>
      {draggingCard ? (
        <img
          src={getCardImageUrl(draggingCard.cardId)}
          alt=""
          className="w-14 rounded opacity-80 shadow-lg"
          draggable={false}
        />
      ) : null}
    </DragOverlay>
    </DndContext>
  )
}
