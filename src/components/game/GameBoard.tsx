import { useCallback, useEffect, useRef, useState } from 'react'
import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent, DragMoveEvent, DragStartEvent } from '@dnd-kit/core'
import type { PlayerId, CardData, GameCard } from '@/engine/types'
import { getCardById } from '@/data/cardService'
import { getCardImageUrl } from '@/utils/images'
import { useGameStore } from '@/stores/gameStore'
import { legalActions } from '@/engine/legalActions'
import type { DragCardData } from '@/hooks/useDragCard'
import type { CardActions } from './CardActionPopup'
import PlayerSide from './PlayerSide'
import HandZone from './HandZone'
import PhaseBar from './PhaseBar'
import ControlsBar from './ControlsBar'
import CardDetail from '@/components/cards/CardDetail'
import AttackArrow from './AttackArrow'
import ChoicePrompt from './ChoicePrompt'
import TriggerPrompt from './TriggerPrompt'
import type { GameState, PendingChoice } from '@/engine/types'

/**
 * Where a pending choice's options live decides its picker surface:
 * on the board -> click the cards directly; in a hand -> hand-row toggles;
 * anywhere hidden (deck, trash, life, DON piles) -> the bottom sheet.
 */
function classifyChoice(
  state: GameState,
  choice: PendingChoice,
): { kind: 'board' } | { kind: 'hand'; owner: PlayerId } | { kind: 'sheet' } {
  const boardIds = new Set<string>()
  for (const pid of ['player1', 'player2'] as PlayerId[]) {
    const p = state.players[pid]
    boardIds.add(p.leader.instanceId)
    for (const c of p.characters) boardIds.add(c.instanceId)
  }
  if (choice.options.every((id) => boardIds.has(id))) return { kind: 'board' }
  for (const pid of ['player1', 'player2'] as PlayerId[]) {
    const hand = new Set(state.players[pid].hand.map((c) => c.instanceId))
    if (choice.options.every((id) => hand.has(id))) return { kind: 'hand', owner: pid }
  }
  return { kind: 'sheet' }
}

export default function GameBoard({ spectator = false }: { spectator?: boolean }) {
  const {
    gameState,
    selectedTarget,
    donAttachCount,
    error,
    aiPlayer,
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
  const [choicePicks, setChoicePicks] = useState<string[]>([])

  // Each new pending choice starts with a fresh selection (state adjusted
  // during render, per React's derive-state pattern, to avoid effect cascades)
  const pendingChoiceRef = gameState?.pendingChoice ?? null
  const [prevChoice, setPrevChoice] = useState<PendingChoice | null>(null)
  if (pendingChoiceRef !== prevChoice) {
    setPrevChoice(pendingChoiceRef)
    setChoicePicks([])
  }

  /** During a pending choice, board clicks toggle picks and everything else is inert. */
  const choiceClick = useCallback((instanceId: string): boolean => {
    const s = useGameStore.getState().gameState
    const pc = s?.pendingChoice
    if (!pc) return false
    if (pc.options.includes(instanceId)) {
      setChoicePicks((prev) =>
        prev.includes(instanceId)
          ? prev.filter((x) => x !== instanceId)
          : prev.length < pc.max
            ? [...prev, instanceId]
            : prev,
      )
    }
    return true
  }, [])


  const arrowLineRef = useRef<SVGLineElement | null>(null)
  const attackStartPointerRef = useRef<{ x: number; y: number } | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  // In vs-AI mode the human's seat stays at the bottom regardless of whose turn
  // it is; in hotseat the view follows the turn player.
  const current: PlayerId = aiPlayer
    ? aiPlayer === 'player1'
      ? 'player2'
      : 'player1'
    : (gameState?.currentPlayer ?? 'player1')
  const opponent: PlayerId = current === 'player1' ? 'player2' : 'player1'

  const selectedId = selectedTarget?.type === 'card' ? selectedTarget.instanceId : null

  // Handle card selection on own side
  const handleSelectCard = useCallback(
    (instanceId: string, zone: 'leader' | 'character' | 'hand') => {
      if (choiceClick(instanceId)) return
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
    [attackingFrom, current, dispatch, select, choiceClick],
  )

  // Handle opponent card click (for attack targeting)
  const handleSelectOpponentCard = useCallback(
    (instanceId: string) => {
      if (choiceClick(instanceId)) return
      if (attackingFrom) {
        dispatch(
          { type: 'DECLARE_ATTACK', attackerId: attackingFrom, targetId: instanceId },
          current,
        )
        setAttackingFrom(null)
      }
    },
    [attackingFrom, current, dispatch, choiceClick],
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
            <p className="text-sm font-medium">
              {pid === aiPlayer ? 'AI Opponent' : pid === 'player1' ? 'Player 1' : 'Player 2'}
            </p>
            {pid === aiPlayer ? (
              <p className="text-sm text-text-muted">
                {gameState.mulliganState[pid] === 'pending'
                  ? 'Deciding...'
                  : gameState.mulliganState[pid] === 'accepted'
                    ? 'Kept hand'
                    : 'Mulliganed'}
              </p>
            ) : (
              <>
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
              </>
            )}
          </div>
        ))}
      </div>
    )
  }

  // Counter mode: determine which hand should show counter selection
  const isCounterStep = !!gameState.battle && gameState.battle.step === 'COUNTER'
  const defenderPlayer = gameState.battle?.defenderPlayer

  // Pending decisions the human must resolve (the AI answers its own via its
  // driver; in spectator mode the bots answer everything)
  const humanControls = (pid: PlayerId) => !spectator && (!aiPlayer || pid !== aiPlayer)
  const showChoice = gameState.pendingChoice && humanControls(gameState.pendingChoice.playerId)

  // The board is the picker: field choices highlight cards in place, hand
  // choices reuse the hand-row toggles, and only hidden zones get the sheet
  const pc = gameState.pendingChoice
  const choiceSurface = showChoice && pc ? classifyChoice(gameState, pc) : null
  const choiceHighlight =
    choiceSurface?.kind === 'board' && pc
      ? { options: pc.options, selected: choicePicks }
      : undefined
  const handPickOwner = choiceSurface?.kind === 'hand' ? choiceSurface.owner : null
  const handPick =
    handPickOwner && pc
      ? { eligible: pc.options, selectedIds: choicePicks, onToggle: (id: string) => choiceClick(id) }
      : undefined
  const choiceStrip =
    pc && choiceSurface && choiceSurface.kind !== 'sheet'
      ? {
          prompt: pc.prompt,
          count: choicePicks.length,
          min: pc.min,
          max: pc.max,
          exact: pc.exact,
          onConfirm: () => dispatch({ type: 'CHOOSE', instanceIds: choicePicks }, pc.playerId),
          onSkip:
            pc.min === 0
              ? () => dispatch({ type: 'CHOOSE', instanceIds: [] }, pc.playerId)
              : undefined,
        }
      : undefined
  const showTrigger =
    !gameState.pendingChoice &&
    gameState.pendingTrigger &&
    humanControls(gameState.pendingTrigger.playerId)
  const blockerIds =
    gameState.battle?.step === 'BLOCK' && humanControls(gameState.battle.defenderPlayer)
      ? legalActions(gameState).flatMap((a) => (a.type === 'ACTIVATE_BLOCKER' ? [a.blockerId] : []))
      : []
  const counterEvents =
    isCounterStep && defenderPlayer && humanControls(defenderPlayer)
      ? legalActions(gameState).flatMap((a) => {
          if (a.type !== 'PLAY_COUNTER_EVENT') return []
          const card = gameState.players[defenderPlayer].hand.find(
            (c) => c.instanceId === a.cardInstanceId,
          )
          const data = card ? getCardById(card.cardId) : null
          return [{ cardInstanceId: a.cardInstanceId, name: data?.name ?? 'Event', cost: data?.cost ?? 0 }]
        })
      : []
  const activatables =
    gameState.phase === 'MAIN' &&
    !gameState.battle &&
    gameState.currentPlayer === current &&
    humanControls(current)
      ? legalActions(gameState).flatMap((a) => {
          if (a.type !== 'ACTIVATE_EFFECT') return []
          const p = gameState.players[current]
          const card = [p.leader, ...p.characters].find((c) => c.instanceId === a.cardInstanceId)
          const name = card ? (getCardById(card.cardId)?.name ?? 'Card') : 'Card'
          return [{ cardInstanceId: a.cardInstanceId, effectId: a.effectId, name }]
        })
      : []
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
      {/* Opponent hand (hidden when an AI holds it) */}
      <HandZone
        cards={gameState.players[opponent].hand}
        flipped
        faceDown={opponent === aiPlayer}
        selectedId={null}
        onSelect={() => {}}
        counterMode={isCounterStep && defenderPlayer === opponent && humanControls(opponent) ? {
          selectedIds: counterSelection,
          onToggle: handleToggleCounter,
        } : undefined}
        pickMode={handPickOwner === opponent ? handPick : undefined}
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
        choice={choiceHighlight}
      />

      {/* Phase bar */}
      <div className="flex items-center gap-3" style={{ minHeight: 40 }}>
        <PhaseBar
          phase={gameState.phase}
          turnNumber={gameState.turnNumber}
          currentPlayer={gameState.currentPlayer}
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
        choice={choiceHighlight}
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
        pickMode={handPickOwner === current ? handPick : undefined}
      />

      {/* Controls */}
      <ControlsBar
        gameState={gameState}
        choice={choiceStrip}
        onEndTurn={() => dispatch({ type: 'END_TURN' }, current)}
        onDeclineBlock={() => dispatch({ type: 'DECLINE_BLOCK' }, gameState.battle?.defenderPlayer ?? opponent)}
        onActivateBlocker={(blockerId) =>
          dispatch({ type: 'ACTIVATE_BLOCKER', blockerId }, gameState.battle?.defenderPlayer ?? opponent)
        }
        blockerIds={blockerIds}
        activatables={activatables}
        onActivateEffect={(cardInstanceId, effectId) =>
          dispatch({ type: 'ACTIVATE_EFFECT', cardInstanceId, effectId }, current)
        }
        counterEvents={counterEvents}
        onPlayCounterEvent={(cardInstanceId) =>
          dispatch({ type: 'PLAY_COUNTER_EVENT', cardInstanceId }, gameState.battle!.defenderPlayer)
        }
        onPassCounter={handlePassCounter}
        onUseCounter={handleUseCounter}
        counterTotal={counterTotal}
        counterCount={counterSelection.length}
      />

      {/* Hidden-zone choices get the bottom sheet; board/hand choices pick in place */}
      {showChoice && choiceSurface?.kind === 'sheet' && (
        <ChoicePrompt
          gameState={gameState}
          onChoose={(instanceIds) =>
            dispatch({ type: 'CHOOSE', instanceIds }, gameState.pendingChoice!.playerId)
          }
        />
      )}
      {showTrigger && (
        <TriggerPrompt
          gameState={gameState}
          onResolve={(activate) =>
            dispatch({ type: 'ACTIVATE_TRIGGER', accept: activate }, gameState.pendingTrigger!.playerId)
          }
        />
      )}

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
