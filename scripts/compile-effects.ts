/**
 * Clause -> ops pattern compiler, step 2 of the per-set checklist:
 *   npm run compile-effects -- OP03            # emit src/data/op03/effects.draft.ts
 *   npm run compile-effects -- OP03 --dry-run  # compare against the authored defs
 *
 * AUTHORING-TIME SCAFFOLDING ONLY: standard clauses compile into draft
 * EffectDefs; anything unmatched becomes a TODO for hand-authoring. Drafts are
 * gated by review, the coverage test, the def linter, and the fleet - card
 * text is never parsed at runtime.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import type { CardData } from '@/engine/types'
import type { Cond, EffectDef, EffectOp, EffectTiming, SelectFilter, StaticDef } from '@/engine/effects/ast'
import { getAllCards, getCardsBySet } from '@/data/cardService'
import { SET_MODULES } from '@/data/sets'

const AUTHORED: Record<string, Record<string, EffectDef[]>> = Object.fromEntries(
  SET_MODULES.map((s) => [s.code, s.effects]),
)

// ─── Vocabulary from the card DB (plus the target set, which may not be
// registered in the manifest yet when scaffolding) ──────────────────────────

const ALL_TYPES = new Set(getAllCards().flatMap((c) => c.attribute))
const ALL_NAMES = new Set(getAllCards().map((c) => c.name))
const COLORS = ['Red', 'Green', 'Blue', 'Purple', 'Black', 'Yellow']

// ─── Result shape ────────────────────────────────────────────────────────────

export interface CompiledCard {
  id: string
  defs: EffectDef[]
  statics: StaticDef[]
  keywordOnly: boolean
  todos: string[]
  notes: string[]
}

// ─── Text utilities ──────────────────────────────────────────────────────────

const KEYWORDS = ['Rush', 'Blocker', 'Double Attack', 'Banish']
const TIMING_TOKENS: Record<string, EffectTiming> = {
  'On Play': 'onPlay',
  'When Attacking': 'whenAttacking',
  'On K.O.': 'onKo',
  'On Block': 'onBlock',
  'Activate:Main': 'activateMain',
  'Activate: Main': 'activateMain',
  Main: 'main',
  Counter: 'counter',
  'End of Your Turn': 'endOfTurn',
}

/** Strip reminder text: parens that FOLLOW a keyword or cost marker. */
function stripReminders(text: string): string {
  return text
    .replace(/\((This card|After your opponent|When this card deals damage)[^)]*\)/g, '')
    .replace(/\(You may (rest|return) the specified[^)]*\)/g, '¶') // keep as cost marker
    .replace(/this card's \[Main\] effect/g, "this card's «Main» effect") // a mention, not a header
    .replace(/activate (a |the )?\[Blocker\]/gi, 'activate $1«Blocker»')
    .replace(/gains? \[(Rush|Blocker|Double Attack|Banish)\]/g, 'gains «$1»')
    .replace(/\s+/g, ' ')
    .trim()
}

interface Segment {
  timing?: EffectTiming
  donRequired?: number
  oncePerTurn?: boolean
  yourTurn?: boolean
  opponentsTurn?: boolean
  body: string
}

/** Split an effect text into ability segments keyed by timing headers. */
function segment(text: string): { segments: Segment[]; printedKeywords: string[] } {
  const printedKeywords: string[] = []
  const tokenRe = /\[([^\]]+)\]/g
  const tokens: { name: string; start: number; end: number }[] = []
  let m: RegExpExecArray | null
  while ((m = tokenRe.exec(text))) tokens.push({ name: m[1], start: m.index, end: tokenRe.lastIndex })

  const segments: Segment[] = []
  let pending: Partial<Segment> = {}
  let openSegment: Segment | null = null
  let cursor = 0

  const flushBody = (upTo: number) => {
    const body = text.slice(cursor, upTo).trim()
    if (openSegment) {
      openSegment.body = (openSegment.body + ' ' + body).trim()
    } else if (body) {
      // Text with modifiers but no event timing: a static/continuous candidate
      segments.push({ ...pending, body } as Segment)
      pending = {}
    }
  }

  for (const t of tokens) {
    const donMatch = t.name.match(/^DON!!\s*x(\d+)$/)
    const isTiming = t.name in TIMING_TOKENS
    const isKeyword = KEYWORDS.includes(t.name)
    if (!isTiming && !isKeyword && !donMatch && !['Once Per Turn', 'Your Turn', "Opponent's Turn"].includes(t.name)) {
      continue // a name/type mention inside a clause, not a header
    }
    // Keyword tokens only count at ability-opener position (mention shapes are
    // sentinel-replaced above; this is the safety net). Timing headers may
    // legitimately follow a previous ability's text.
    if (isKeyword && text.slice(cursor, t.start).trim() !== '') continue
    flushBody(t.start)
    cursor = t.end
    if (openSegment && (isTiming || donMatch || isKeyword)) {
      segments.push(openSegment)
      openSegment = null
    }
    // A modifier right after a timing header ("[Activate:Main] [Once Per
    // Turn] ...") belongs to the OPEN segment, not the next one
    const modTarget = openSegment && openSegment.body === '' ? openSegment : pending
    if (isKeyword) {
      printedKeywords.push(t.name)
    } else if (donMatch) {
      modTarget.donRequired = Number(donMatch[1])
    } else if (t.name === 'Once Per Turn') {
      modTarget.oncePerTurn = true
    } else if (t.name === 'Your Turn') {
      modTarget.yourTurn = true
    } else if (t.name === "Opponent's Turn") {
      modTarget.opponentsTurn = true
    } else if (isTiming) {
      openSegment = { ...pending, timing: TIMING_TOKENS[t.name], body: '' }
      pending = {}
    }
  }
  flushBody(text.length)
  if (openSegment) segments.push(openSegment)
  const cleaned = segments
    .map((s) => ({ ...s, body: s.body.replace(/^\/\s*/, '').trim() }))
    .filter((s) => s.body || s.timing)
  // Dual timings share one body: "[Main] / [Counter] <text>"
  for (let i = 0; i < cleaned.length - 1; i++) {
    if (cleaned[i].timing && !cleaned[i].body && cleaned[i + 1].body) {
      cleaned[i].body = cleaned[i + 1].body
    }
  }
  return { segments: cleaned, printedKeywords }
}

/** Split a body into clauses on sentence ends and "Then," joins. */
function clauses(body: string): string[] {
  return body
    .replace(/K\.O\./g, 'K∘O∘') // protect the dots from the sentence splitter
    .split(/(?<=\.)\s+|(?:^|\s)Then,\s+/)
    .map((c) =>
      c
        .replace(/K∘O∘/g, 'K.O.')
        .trim()
        .replace(/^(and|Then,)\s+/i, '')
        .replace(/^,\s*/, ''),
    )
    .filter(Boolean)
}

// ─── Filter parsing ──────────────────────────────────────────────────────────

/** Words allowed to remain in a filter description once every recognized
 * fragment is consumed. Anything else means the description carries semantics
 * we did NOT parse - refuse, so it becomes a TODO instead of a mis-compile. */
const FILTER_GLUE = new Set(['', 'with', 'a', 'an', 'card', 'cards', 'type', 'that', 'has'])

function parseFilter(desc: string): Partial<SelectFilter> | null {
  const f: Partial<SelectFilter> = {}
  // Normalize "a type including \"X\"" to the {X} type shape so X reads as a
  // type even when a card NAME collides with it (the Whitebeard Pirates event)
  let rest = ` ${desc} `.replace(/(?:a )?type including ["[{]([^\]}"]+)[\]}"]/g, '{$1} type')

  // "[Trigger]" is a property, not a name reference - consume it before the
  // generic bracket handling below can eat it
  const trig = rest.match(/(?:and |with )?a \[?Trigger\]?/)
  if (trig) {
    f.hasTrigger = true
    rest = rest.replace(trig[0], ' ')
  }

  // Bracket/quote references FIRST, so a color word inside a name or type
  // ([East Blue]) is not chewed up by the color matcher below
  const other = rest.match(/other than \[([^\]]+)\]/)
  if (other) {
    f.nameNot = other[1]
    rest = rest.replace(other[0], ' ')
  }
  const typed = [...rest.matchAll(/[[{"“]([^\]}"”]+)[\]}"”]\s*(type)?/g)].filter(
    (t) => t[1] !== 'Trigger',
  )
  const typeNames: string[] = []
  for (const t of typed) {
    const val = t[1]
    if (t[2] === 'type' || (ALL_TYPES.has(val) && !ALL_NAMES.has(val))) {
      if (ALL_TYPES.has(val)) typeNames.push(val)
      else if (!f.typeContains) f.typeContains = val // the "CP" family
      else return null
    } else if (ALL_NAMES.has(val)) f.nameIs = val
    else if (ALL_TYPES.has(val)) typeNames.push(val)
    else return null // unknown reference: refuse rather than guess
  }
  const sawOr = /[\]}"] or [[{"]/.test(rest)
  rest = rest.replace(/[[{"“]([^\]}"”]+)[\]}"”]\s*(type)?/g, ' ').replace(/ or /, sawOr ? ' ' : ' or ')
  if (typeNames.length === 1) f.typeIncludes = typeNames[0]
  else if (typeNames.length === 2 && sawOr) f.typeIncludesAny = typeNames
  else if (typeNames.length > 1) return null

  const colorRe = new RegExp(`\\b(${COLORS.join('|')})\\b`, 'i')
  const color = rest.match(colorRe)
  if (color) {
    f.colorIncludes = color[1][0].toUpperCase() + color[1].slice(1).toLowerCase()
    rest = rest.replace(colorRe, ' ')
  }

  if (/\bEvent( cards?)?\b/.test(rest)) f.cardType = 'Event'
  else if (/\bStage( cards?)?\b/.test(rest)) f.cardType = 'Stage'
  else if (/\bCharacter( cards?)?\b/.test(rest)) f.cardType = 'Character'
  rest = rest.replace(/\b(Event|Stage|Character)s?\b/g, ' ')

  const cost = rest.match(/(?:with )?a cost of (\d+) or less/)
  if (cost) {
    f.costAtMost = Number(cost[1])
    rest = rest.replace(cost[0], ' ')
  } else {
    const costIs = rest.match(/(?:with )?a cost of (\d+)\b/)
    if (costIs) {
      f.costIs = Number(costIs[1])
      rest = rest.replace(costIs[0], ' ')
    }
  }
  const power = rest.match(/(?:with )?(\d+) power or (less|more)/)
  if (power) {
    if (power[2] === 'less') f.powerAtMost = Number(power[1])
    else f.powerAtLeast = Number(power[1])
    rest = rest.replace(power[0], ' ')
  }

  if (/rested /.test(rest)) {
    f.rested = true
    rest = rest.replace(/rested /, ' ')
  }
  if (/(?:and )?(?:with )?no base effect/.test(rest)) {
    f.noBaseEffect = true
    rest = rest.replace(/(?:and )?(?:with )?no base effect/, ' ')
  }

  // Anything meaningful left over means unparsed semantics: refuse
  const leftovers = rest.split(/[^A-Za-z']+/).filter((w) => !FILTER_GLUE.has(w.toLowerCase()))
  if (leftovers.length > 0) return null

  return f
}


/** Field zones already imply Character; drop the redundant cardType. */
function fieldFilter(f: Partial<SelectFilter> | null): Partial<SelectFilter> | null {
  if (f && f.cardType === 'Character') {
    const rest = { ...f }
    delete rest.cardType
    return rest
  }
  return f
}

// ─── Clause compilers ────────────────────────────────────────────────────────

let bindCounter = 0
const freshBind = () => `b${++bindCounter}`
/** Whole-segment context for clause rules that look across sentences. */
let currentSegmentBody = ''
/** SIMPLIFIED-deviation notes collected while compiling the current card. */
let currentCardNotes: string[] = []

type ClauseResult = { ops: EffectOp[]; cond?: Cond } | { cond: Cond; ops?: undefined } | null

function compileClause(clause: string, timing: EffectTiming): ClauseResult {
  const c = clause.replace(/K∘O∘/g, 'K.O.').replace(/\.$/, '')

  // "If <cond>, <rest>": peel the condition, compile the remainder
  const condSplit = c.match(/^([Ii]f [^,]+), (.+)$/)
  if (condSplit) {
    const condOnly = compileClause(condSplit[1], timing)
    if (condOnly && 'cond' in condOnly && condOnly.cond && !condOnly.ops) {
      const rest = compileClause(condSplit[2], timing)
      if (rest && rest.ops) return { cond: condOnly.cond, ops: rest.ops }
      return null
    }
  }

  // "<X>, and (you may) <Y>": compile each half; safe because BOTH halves
  // must compile cleanly or the whole clause stays a TODO
  for (const andSplit of c.matchAll(/,? and ((?:you may )?[a-z].*)$/g)) {
    const idx = c.lastIndexOf(andSplit[0])
    const a = compileClause(c.slice(0, idx), timing)
    const b = compileClause(andSplit[1].replace(/^you may /, ''), timing)
    if (a?.ops && b?.ops && !a.cond && !b.cond) return { ops: [...a.ops, ...b.ops] }
  }
  const duration = /during this battle/.test(c) ? 'battle' : /until the start of your next turn/.test(c) ? 'untilYourNextTurn' : 'turn'

  // Leading conditions
  let cm = c.match(/^[Ii]f your Leader is \[([^\]]+)\]$/)
  if (cm) return { cond: { leaderNameIs: cm[1] } }
  cm = c.match(/^[Ii]f you have (\d+) or more DON!! cards? on your field$/)
  if (cm) return { cond: { minDonField: Number(cm[1]) } }
  cm = c.match(/^If your Leader(?:'s type includes?| has the) ["[{]([^\]}"]+)[\]}"](?: type)?/)
  if (cm) return { cond: ALL_TYPES.has(cm[1]) ? { leaderTypeIncludes: cm[1] } : { leaderTypeContains: cm[1] } }
  cm = c.match(/^If you have (\d+) or less Life cards?/)
  if (cm) return { cond: { maxLifeSelf: Number(cm[1]) } }
  cm = c.match(/^If you have (\d+) or less cards? in your hand/)
  if (cm) return { cond: { maxHandSelf: Number(cm[1]) } }
  cm = c.match(/^If you have (\d+) or less Characters/)
  if (cm) return { cond: { maxSelfCharacters: Number(cm[1]) } }
  cm = c.match(/^If you have (\d+) or less cards? in your deck/)
  if (cm) return { cond: { maxDeckSelf: Number(cm[1]) } }
  cm = c.match(/^If you have \[([^\]]+)\]/)
  if (cm) return { cond: { hasCharacterNamed: cm[1] } }
  cm = c.match(/^If you have less Life cards than your opponent/)
  if (cm) return { cond: { lessLifeThanOpp: true } }
  cm = c.match(/^If your opponent has (\d+) or more Life/)
  if (cm) return { cond: { minLifeOpp: Number(cm[1]) } }
  cm = c.match(/^If your opponent has (\d+) or more cards in their hand/)
  if (cm) return { cond: { minHandOpp: Number(cm[1]) } }

  // K.O. / debuff / rest / bounce / bottom-deck on opponent targets
  cm = c.match(/^K\.?O\.? up to (\d+) of your opponent's (.*?Characters?[^,]*?)(?: and up to|$)/i)
  if (cm) {
    const filter = fieldFilter(parseFilter(cm[2]))
    if (!filter) return null
    const ops: EffectOp[] = []
    // "K.O. up to 1 X and up to 1 Y" - split double-KO clauses
    const parts = c.split(/ and up to /)
    for (const part of parts) {
      const pm = part.match(/(?:K\.?O\.? up to )?(\d+) of your opponent's (.*)/i)
      if (!pm) return null
      const pf = fieldFilter(parseFilter(pm[2]))
      if (!pf) return null
      const bind = freshBind()
      ops.push(
        { op: 'select', bind, filter: { owner: 'opponent', zone: 'characters', ...pf }, min: 0, max: Number(pm[1]), prompt: `K.O. up to ${pm[1]}` },
        { op: 'ko', ref: bind },
      )
    }
    return { ops }
  }

  cm = c.match(/^[Gg]ive (?:up to (\d+)|all) of your opponent's (Leader or Character cards?|Characters?)(.*?) (-?\d+)(0{3}) power during this (turn|battle)$/)
  if (cm) {
    const filter = fieldFilter(parseFilter(cm[3] ?? ''))
    if (!filter) return null
    const bind = freshBind()
    return {
      ops: [
        { op: 'select', bind, filter: { owner: 'opponent', zone: cm[2].startsWith('Leader') ? 'leaderOrCharacters' : 'characters', ...filter }, min: 0, max: Number(cm[1] ?? 9), prompt: `Give ${cm[4]}000 power` },
        { op: 'powerMod', ref: bind, amount: Number(cm[4] + cm[5]), duration: cm[6] as 'turn' | 'battle' },
      ],
    }
  }

  cm = c.match(/^Give up to (\d+) of your opponent's Characters(.*?) (-\d+) cost during this turn/)
  if (cm) {
    const filter = fieldFilter(parseFilter(cm[2] ?? ''))
    if (!filter) return null
    const bind = freshBind()
    return {
      ops: [
        { op: 'select', bind, filter: { owner: 'opponent', zone: 'characters', ...filter }, min: 0, max: Number(cm[1]), prompt: `Give ${cm[3]} cost` },
        { op: 'costMod', ref: bind, amount: Number(cm[3]), duration: 'turn' },
      ],
    }
  }

  cm = c.match(/^[Rr]est (?:up to (\d+)|this Character and up to (\d+)) of your opponent's (Leader or Character cards?|Characters?)(.*)/)
  if (cm) {
    const filter = fieldFilter(parseFilter(cm[4] ?? ''))
    if (!filter) return null
    const bind = freshBind()
    const ops: EffectOp[] = []
    if (cm[2]) ops.push({ op: 'rest', ref: 'self' })
    ops.push(
      { op: 'select', bind, filter: { owner: 'opponent', zone: cm[3].startsWith('Leader') ? 'leaderOrCharacters' : 'characters', rested: false, ...filter }, min: 0, max: Number(cm[1] ?? cm[2]), prompt: 'Rest' },
      { op: 'rest', ref: bind },
    )
    return { ops }
  }

  cm = c.match(/^Return up to (\d+) (?:of your opponent's )?Characters? (.*?)to the owner's hand$/)
  if (cm) {
    if (!/of your opponent's/.test(c)) {
      currentCardNotes.push('bounce targets the opponent side only (rules allow either)')
    }
    const filter = fieldFilter(parseFilter(cm[2]))
    if (!filter) return null
    const bind = freshBind()
    return {
      ops: [
        { op: 'select', bind, filter: { owner: 'opponent', zone: 'characters', ...filter }, min: 0, max: Number(cm[1]), prompt: 'Return to hand' },
        { op: 'returnToHand', ref: bind },
      ],
    }
  }

  cm = c.match(/^Place up to (\d+) (?:of your opponent's )?Characters? (.*?)at the bottom of the owner's deck$/)
  if (cm) {
    if (!/of your opponent's/.test(c)) {
      currentCardNotes.push('bottom-deck targets the opponent side only (rules allow either)')
    }
    const filter = fieldFilter(parseFilter(cm[2]))
    if (!filter) return null
    const bind = freshBind()
    return {
      ops: [
        { op: 'select', bind, filter: { owner: 'opponent', zone: 'characters', ...filter }, min: 0, max: Number(cm[1]), prompt: 'Bottom-deck' },
        { op: 'bottomDeckFromField', ref: bind },
      ],
    }
  }

  // Self-side pumps
  cm = c.match(/^(?:[Uu]p to (\d+) of y|Y)our (Leader or Character cards?|Leader|Characters?)( .*?)?gains? \+(\d+) power (?:during this (turn|battle)|until the start of your next turn)/)
  if (cm) {
    const zone = cm[2] === 'Leader' ? 'leader' : cm[2].startsWith('Leader or') ? 'leaderOrCharacters' : 'characters'
    const filter = fieldFilter(parseFilter(cm[3] ?? ''))
    if (!filter) return null
    const bind = freshBind()
    return {
      ops: [
        { op: 'select', bind, filter: { owner: 'self', zone, ...filter }, min: cm[1] ? 0 : 1, max: Number(cm[1] ?? 1), prompt: `+${cm[4]} power` },
        { op: 'powerMod', ref: bind, amount: Number(cm[4]), duration },
      ],
    }
  }

  cm = c.match(/^[Tt]his (?:Character|Leader) gains \+(\d+) power(?: during this (turn|battle))?$/)
  if (cm) return { ops: [{ op: 'powerMod', ref: 'self', amount: Number(cm[1]), duration: (cm[2] as 'turn' | 'battle') ?? 'turn' }] }

  cm = c.match(/^[Tt]his (?:Character|Leader) gains [«[]([^»\]]+)[»\]](?: during this (turn|battle))?$/)
  if (cm && KEYWORDS.includes(cm[1])) return { ops: [{ op: 'grantKeyword', ref: 'self', keyword: cm[1], duration: (cm[2] as 'turn' | 'battle') ?? 'turn' }] }

  if (/^This card has been officially errata'd$/.test(c)) return { ops: [] }

  // Draw / mill / life
  cm = c.match(/^[Dd]raw (\d+) cards?$/)
  if (cm) return { ops: [{ op: 'draw', count: Number(cm[1]) }] }
  cm = c.match(/^(?:[Yy]ou may )?trash (\d+) cards? from the top of your deck/)
  if (cm) return { ops: [{ op: 'millSelf', count: Number(cm[1]) }] }
  cm = c.match(/^[Aa]dd (?:up to )?(\d+) cards? from the top of your Life cards? to your hand/)
  if (cm) return { ops: [{ op: 'lifeTopToHand', count: Number(cm[1]) }] }
  cm = c.match(/^[Aa]dd up to (\d+) cards? from the top of your deck to the top of your Life/)
  if (cm) return { ops: [{ op: 'deckTopToLife', count: Number(cm[1]) }] }
  cm = c.match(/^trash up to (\d+) cards? from the top of your opponent's Life/)
  if (cm) return { ops: [{ op: 'trashLifeTop', owner: 'opponent', count: Number(cm[1]) }] }

  // Mandatory hand trash
  cm = c.match(/^trash (\d+) cards? from your hand$/)
  if (cm) {
    const bind = freshBind()
    return {
      ops: [
        { op: 'select', bind, filter: { owner: 'self', zone: 'hand' }, min: Number(cm[1]), max: Number(cm[1]), prompt: `Trash ${cm[1]}` },
        { op: 'trashCards', ref: bind },
      ],
    }
  }
  cm = c.match(/^trash up to (\d+) cards? from your hand$/)
  if (cm) {
    const bind = freshBind()
    return {
      ops: [
        { op: 'select', bind, filter: { owner: 'self', zone: 'hand' }, min: 0, max: Number(cm[1]), prompt: `Trash up to ${cm[1]}` },
        { op: 'trashCards', ref: bind },
      ],
    }
  }

  // Search
  cm = c.match(/^Look at (?:up to )?(\d+) cards? from the top of your deck; reveal up to (\d+) (.*?) and add (?:it|them) to your hand/)
  if (cm) {
    const filter = parseFilter(cm[3].replace(/ cards?$/, ''))
    if (!filter) return null
    const restTo = /trash the rest/i.test(currentSegmentBody) ? ('trash' as const) : undefined
    delete filter.rested
    // "[Name] or {Type} type card" is an OR, not an AND
    if (filter.nameIs && (filter.typeIncludes || filter.typeIncludesAny) && /\] or /.test(cm[3])) {
      ;(filter as Record<string, unknown>).orNameIs = filter.nameIs
      delete filter.nameIs
    }
    return { ops: [{ op: 'searchTop', count: Number(cm[1]), filter, upTo: Number(cm[2]), to: 'hand', ...(restTo ? { restTo } : {}) }] }
  }
  if (/^(place the rest at the bottom of your deck in any order|trash the rest)$/i.test(c)) return { ops: [] }

  // Play from hand
  cm = c.match(/^Play up to (\d+) (.*?)(?:Character cards?|Characters?)(.*?) from your hand/)
  if (cm) {
    const filter = parseFilter(cm[2] + ' ' + cm[3])
    if (!filter) return null
    const bind = freshBind()
    return {
      ops: [
        { op: 'select', bind, filter: { owner: 'self', zone: 'hand', cardType: 'Character', ...filter }, min: 0, max: Number(cm[1]), prompt: 'Play from hand' },
        { op: 'playCards', ref: bind },
      ],
    }
  }
  if (/^Play this card$/.test(c)) return { ops: [{ op: 'playSelf' }] }
  if (/^Activate this card's [«[]?Main[»\]]? effect$/.test(c)) return { ops: [{ op: 'activateTiming', timing: 'main' }] }

  // Scheduled self-trash (Thatch)
  if (/^trash this Character at the end of this turn$/.test(c)) {
    return { ops: [{ op: 'grantFlag', ref: 'self', flag: 'trashAtTurnEnd', duration: 'turn' }] }
  }

  // Draw + optional deck-top mill (Nami's tempo events)
  cm = c.match(/^[Dd]raw (\d+) cards? and you may trash (\d+) cards? from the top of your deck$/)
  if (cm) return { ops: [{ op: 'draw', count: Number(cm[1]) }, { op: 'millSelf', count: Number(cm[2]) }] }

  // Compound draw-and-trash
  cm = c.match(/^[Dd]raw (\d+) cards? and trash (\d+) cards? from your hand$/)
  if (cm) {
    const bind = freshBind()
    return {
      ops: [
        { op: 'draw', count: Number(cm[1]) },
        { op: 'select', bind, filter: { owner: 'self', zone: 'hand' }, min: Number(cm[2]), max: Number(cm[2]), prompt: `Trash ${cm[2]}` },
        { op: 'trashCards', ref: bind },
      ],
    }
  }

  // DON
  cm = c.match(/^[Aa]dd up to (\d+) DON!! cards? from your DON!! deck and (set it as active|rest it)/)
  if (cm) return { ops: [{ op: 'addDon', count: Number(cm[1]), rested: cm[2] === 'rest it' }] }
  cm = c.match(/^[Ss]et up to (\d+) of your DON!! cards? as active/)
  if (cm) {
    const bind = freshBind()
    return {
      ops: [
        { op: 'select', bind, filter: { owner: 'self', zone: 'don', rested: true }, min: 0, max: Number(cm[1]), prompt: 'Set DON!! active' },
        { op: 'setActive', ref: bind },
      ],
    }
  }
  cm = c.match(/^[Yy]our opponent returns (\d+) DON!! cards? from their field to their DON!! deck/)
  if (cm) return { ops: [{ op: 'oppReturnDon', count: Number(cm[1]) }] }

  if (/^[Ss]et this (Character|Leader) as active$/.test(c)) return { ops: [{ op: 'setActive', ref: 'self' }] }

  return null
}

/** Cost prefixes at the start of a def body. Returns remaining body. */
function compileCosts(
  body: string,
  timing: EffectTiming,
  def: EffectDef,
  todos: string[],
): string {
  let rest = body
  for (;;) {
    let m = rest.match(/^\((\d+)\)\s*¶?\s*:?\s*/)
    if (m) {
      if (timing === 'activateMain') def.cost = { ...def.cost, restDon: Number(m[1]) }
      else {
        const bind = freshBind()
        def.ops.push(
          { op: 'select', bind, filter: { owner: 'self', zone: 'don', rested: false }, min: 0, max: Number(m[1]), exact: true, prompt: `You may rest ${m[1]} DON!!` },
          { op: 'abortIfEmpty', ref: bind },
          { op: 'rest', ref: bind },
        )
      }
      rest = rest.slice(m[0].length)
      continue
    }
    m = rest.match(/^DON!!\s*-(\d+)\s*¶?\s*:?\s*/)
    if (m) {
      if (timing === 'activateMain') def.cost = { ...def.cost, returnDon: Number(m[1]) }
      else {
        const bind = freshBind()
        def.ops.push(
          { op: 'select', bind, filter: { owner: 'self', zone: 'don' }, min: 0, max: Number(m[1]), exact: true, prompt: `You may return ${m[1]} DON!!` },
          { op: 'abortIfEmpty', ref: bind },
          { op: 'returnDon', ref: bind },
        )
        currentCardNotes.push('DON!!-X pays from the cost area only (attached DON need the class picker)')
      }
      rest = rest.slice(m[0].length)
      continue
    }
    m = rest.match(/^You may rest (\d+) of your (.*?) Characters?\s*:\s*/)
    if (m) {
      const filter = parseFilter(m[2])
      if (!filter) return rest
      const bind = freshBind()
      def.ops.push(
        { op: 'select', bind, filter: { owner: 'self', zone: 'characters', rested: false, ...filter }, min: 0, max: Number(m[1]), ...(Number(m[1]) > 1 ? { exact: true } : {}), prompt: `You may rest ${m[1]}` },
        { op: 'abortIfEmpty', ref: bind },
        { op: 'rest', ref: bind },
      )
      rest = rest.slice(m[0].length)
      continue
    }
    m = rest.match(/^You may rest this (Character|Stage|Leader)\s*:?\s*/)
    if (m) {
      if (timing === 'activateMain') def.cost = { ...def.cost, restSelf: true }
      else todos.push(`cost: rest self on ${timing}`)
      rest = rest.slice(m[0].length)
      continue
    }
    m = rest.match(/^You may trash (\d+) of your (.*?) Characters?([^:]*?)\s*:\s*/)
    if (m) {
      const filter = fieldFilter(parseFilter(`${m[2]} ${m[3]}`))
      if (!filter) return rest
      const bind = freshBind()
      def.ops.push(
        { op: 'select', bind, filter: { owner: 'self', zone: 'characters', ...filter }, min: 0, max: Number(m[1]), prompt: `You may trash ${m[1]} of your Characters` },
        { op: 'abortIfEmpty', ref: bind },
        { op: 'trashFromField', ref: bind },
      )
      rest = rest.slice(m[0].length)
      continue
    }
    m = rest.match(/^You may place (\d+) cards? (.*?) from your trash at the bottom of your deck(?: in any order)?\s*:\s*/)
    if (m) {
      const filter = parseFilter(m[2])
      if (!filter) return rest
      const bind = freshBind()
      def.ops.push(
        { op: 'select', bind, filter: { owner: 'self', zone: 'trash', ...filter }, min: 0, max: Number(m[1]), ...(Number(m[1]) > 1 ? { exact: true } : {}), prompt: `You may bottom-deck ${m[1]} from your trash` },
        { op: 'abortIfEmpty', ref: bind },
        { op: 'trashToDeckBottom', ref: bind },
      )
      rest = rest.slice(m[0].length)
      continue
    }
    m = rest.match(/^You may trash (\d+) (.*?) from your hand\s*:\s*/)
    if (m) {
      const filter = parseFilter(m[2].replace(/^cards?$/, ''))
      if (!filter) return rest
      const bind = freshBind()
      def.ops.push(
        { op: 'select', bind, filter: { owner: 'self', zone: 'hand', ...filter }, min: 0, max: Number(m[1]), ...(Number(m[1]) > 1 ? { exact: true } : {}), prompt: `You may trash ${m[1]}` },
        { op: 'abortIfEmpty', ref: bind },
        { op: 'trashCards', ref: bind },
      )
      rest = rest.slice(m[0].length)
      continue
    }
    return rest
  }
}

// ─── Card compiler ───────────────────────────────────────────────────────────

export function compileCard(card: CardData): CompiledCard {
  bindCounter = 0
  currentCardNotes = []
  const out: CompiledCard = { id: card.id, defs: [], statics: [], keywordOnly: false, todos: [], notes: [] }

  const compileText = (text: string, forcedTiming?: EffectTiming) => {
    const cleaned = stripReminders(text)
    const { segments, printedKeywords } = segment(cleaned)
    if (segments.length === 0 && printedKeywords.length > 0 && !forcedTiming) out.keywordOnly = true

    for (const seg of segments) {
      const timing = forcedTiming ?? seg.timing
      if (!timing) {
        // Continuous text: an auto-event pattern first, then the static shapes
        const auto = compileAutoEvent(seg)
        if (auto) {
          out.defs.push(auto)
          continue
        }
        const st = compileStatic(seg)
        if (st) out.statics.push(st)
        else out.todos.push(`static: ${seg.body}`)
        continue
      }
      const def: EffectDef = { timing, ops: [] }
      if (seg.donRequired) def.donRequired = seg.donRequired
      if (seg.oncePerTurn) def.oncePerTurn = true
      if (seg.yourTurn) def.condition = { ...def.condition, yourTurn: true }
      if (seg.opponentsTurn) def.condition = { ...def.condition, opponentsTurn: true }

      currentSegmentBody = seg.body
      const body = compileCosts(seg.body, timing, def, out.todos)
      let failed = false
      const parts = clauses(body)
      parts.forEach((cl, i) => {
        const r = compileClause(cl, timing)
        if (!r) {
          out.todos.push(`${timing}: ${cl}`)
          failed = true
        } else {
          if (r.cond) {
            if (i === 0 && def.ops.length === 0) def.condition = { ...def.condition, ...r.cond }
            else def.ops.push({ op: 'requireCond', cond: r.cond })
          }
          if (r.ops) def.ops.push(...r.ops)
        }
      })
      if (!failed || def.ops.length > 0) out.defs.push(def)
      if (failed && def.ops.length > 0) out.todos.push(`${timing}: PARTIAL - review op order`)
    }
  }

  if (card.effectText) compileText(card.effectText)
  if (card.triggerText) compileText(card.triggerText, 'trigger')
  out.notes = [...new Set(currentCardNotes)]
  return out
}

/** No-timing auto effects: "When this Character's attack deals damage..." */
function compileAutoEvent(seg: Segment): EffectDef | null {
  const m = seg.body.match(
    /^When this (?:Character|Leader)'s attack deals damage to your opponent's Life, you may trash (\d+) cards? from the top of your deck\.?$/,
  )
  if (!m) return null
  const def: EffectDef = {
    timing: 'onEvent',
    on: { kind: 'lifeDamageDealt', who: 'self', sourceIsSelf: true },
    ops: [{ op: 'millSelf', count: Number(m[1]) }],
  }
  if (seg.donRequired) def.donRequired = seg.donRequired
  if (seg.oncePerTurn) def.oncePerTurn = true
  return def
}

function compileStatic(seg: Segment): StaticDef | null {
  const cond: Cond = {}
  if (seg.yourTurn) cond.yourTurn = true
  if (seg.opponentsTurn) cond.opponentsTurn = true

  // Leading condition peels
  let body = seg.body
  let m = body.match(/^If you have (\d+) or less cards in your deck, (.*)$/)
  if (m) {
    cond.maxDeckSelf = Number(m[1])
    body = m[2][0].toUpperCase() + m[2].slice(1)
  }
  m = body.match(/^If you have \[([^\]]+)\], (.*)$/)
  if (m) {
    cond.hasCharacterNamed = m[1]
    body = m[2][0].toUpperCase() + m[2].slice(1)
  }
  m = body.match(/^If you have less Life cards than your opponent, (.*)$/)
  if (m) {
    cond.lessLifeThanOpp = true
    body = m[1][0].toUpperCase() + m[1].slice(1)
  }
  m = body.match(/^If you have (\d+) or less cards in your hand, (.*)$/)
  if (m) {
    cond.maxHandSelf = Number(m[1])
    body = m[2][0].toUpperCase() + m[2].slice(1)
  }

  const base: StaticDef = { target: { scope: 'self' } }
  if (seg.donRequired) base.donRequired = seg.donRequired
  if (Object.keys(cond).length) base.condition = cond

  if (/can also attack your opponent's active Characters/.test(body)) return { ...base, flag: 'canAttackActive' }
  m = body.match(/^This Character cannot be K\.?O\.?'?d in battle by ["[]([^\]"]+)[\]"] attribute/)
  if (m) return { ...base, flag: `noBattleKoBy${m[1]}` as StaticDef['flag'] }
  if (/^This Character cannot be K\.?O\.?'?d in battle\.?$/.test(body)) return { ...base, flag: 'noBattleKo' }
  if (/^This Character cannot be K\.?O\.?'?d by effects\.?$/.test(body)) return { ...base, flag: 'noEffectKo' }
  if (/^This Leader cannot attack\.?$/.test(body)) return { ...base, flag: 'cannotAttack' }
  if (/^This Character cannot attack a Leader on the turn in which it is played\.?$/.test(body)) {
    return { ...base, flag: 'noLeaderAttackTurnPlayed' }
  }
  m = body.match(/^This Character gains [«[]([^»\]]+)[»\]]\.?$/)
  if (m && KEYWORDS.includes(m[1])) return { ...base, keyword: m[1] }
  m = body.match(/^This Character gains \+(\d+) power\.?$/)
  if (m) return { ...base, power: Number(m[1]) }
  m = body.match(/^All of your Characters(?: with a type including ["[{]([^\]}"]+)[\]}"])? gain \+(\d+) power\.?$/)
  if (m) return { ...base, target: { scope: 'myCharacters', ...(m[1] ? { typeIncludes: m[1] } : {}) }, power: Number(m[2]) }
  return null
}

// ─── Dry-run comparison ──────────────────────────────────────────────────────

function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical)
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([k, v]) => v !== undefined && k !== 'prompt')
      .sort(([a], [b]) => a.localeCompare(b))
    return Object.fromEntries(entries.map(([k, v]) => [k, canonical(v)]))
  }
  return value
}

/** Rename binds to b1,b2,... in op order so authored and compiled defs align. */
function renameBinds(defs: EffectDef[]): EffectDef[] {
  return defs.map((def) => {
    const map = new Map<string, string>([['self', 'self']])
    let n = 0
    const ops = def.ops.map((op) => {
      const o = { ...op } as Record<string, unknown>
      if (typeof o.bind === 'string') {
        map.set(o.bind as string, `b${++n}`)
        o.bind = map.get(o.bind as string)
      }
      for (const key of ['ref', 'toRef', 'countRef']) {
        if (typeof o[key] === 'string' && o[key] !== 'self') o[key] = map.get(o[key] as string) ?? o[key]
      }
      return o as unknown as EffectOp
    })
    return { ...def, ops }
  })
}

const sig = (defs: EffectDef[]) => JSON.stringify(canonical(renameBinds(defs)))

async function main() {
  const setCode = (process.argv[2] ?? '').toUpperCase()
  const dryRun = process.argv.includes('--dry-run')
  if (!setCode) {
    console.error('usage: npm run compile-effects -- <SET> [--dry-run]')
    process.exit(1)
  }
  const registered = getCardsBySet(setCode)
  const fromDisk =
    registered.length > 0
      ? registered
      : (JSON.parse(
          readFileSync(`src/data/${setCode.toLowerCase()}/cards.json`, 'utf8'),
        ) as CardData[])
  for (const c of fromDisk) {
    ALL_NAMES.add(c.name)
    for (const t of c.attribute) ALL_TYPES.add(t)
  }
  const pool = fromDisk.filter((c) => c.effectText || c.triggerText)
  const compiled = pool.map(compileCard)

  const dbgIdx = process.argv.indexOf('--debug')
  if (dbgIdx >= 0) {
    for (const id of process.argv.slice(dbgIdx + 1)) {
      const c = compiled.find((x) => x.id === id)
      console.log(`=== ${id}`, JSON.stringify(c, null, 1))
    }
    return
  }

  const full = compiled.filter((c) => c.todos.length === 0 && (c.defs.length || c.statics.length || c.keywordOnly))
  const partial = compiled.filter((c) => c.todos.length > 0 && (c.defs.length || c.statics.length))
  const missed = compiled.filter((c) => c.todos.length > 0 && !c.defs.length && !c.statics.length)
  console.log(`${setCode}: ${pool.length} carded texts`)
  console.log(`  fully compiled : ${full.length} (${Math.round((100 * full.length) / pool.length)}%)`)
  console.log(`  partial drafts : ${partial.length}`)
  console.log(`  hand-work only : ${missed.length}`)

  if (dryRun) {
    const authored = AUTHORED[setCode]
    if (!authored) throw new Error(`no authored defs for ${setCode}`)
    let exact = 0
    const diffs: string[] = []
    for (const c of full) {
      const hand = authored[c.id]
      if (!hand && c.defs.length === 0) {
        exact++ // keyword-only / statics agreement checked loosely
        continue
      }
      if (hand && sig(hand) === sig(c.defs)) exact++
      else diffs.push(c.id)
    }
    console.log(`\nDRY RUN vs authored defs:`)
    console.log(`  exact matches (ops-identical): ${exact}/${full.length} fully-compiled cards`)
    console.log(`  differing: ${diffs.join(', ') || 'none'}`)
    // What the grammar misses most, to guide pattern growth
    const todoCounts = new Map<string, number>()
    for (const c of [...partial, ...missed]) {
      for (const t of c.todos) {
        const key = t.replace(/\d+/g, 'N').slice(0, 70)
        todoCounts.set(key, (todoCounts.get(key) ?? 0) + 1)
      }
    }
    const top = [...todoCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20)
    console.log('\ntop unmatched clause shapes:')
    for (const [k, n] of top) console.log(`  ${String(n).padStart(2)}x ${k}`)
    for (const id of diffs.slice(0, 6)) {
      const c = compiled.find((x) => x.id === id)!
      console.log(`\n--- ${id} compiled:`)
      console.log(JSON.stringify(canonical(renameBinds(c.defs)), null, 1).slice(0, 900))
      console.log(`--- ${id} authored:`)
      console.log(JSON.stringify(canonical(renameBinds(authored[id] ?? [])), null, 1).slice(0, 900))
    }
    return
  }

  // Scaffold / draft emission
  const setLower = setCode.toLowerCase()
  const scaffold = process.argv.includes('--scaffold')
  const { existsSync } = await import('node:fs')
  const target = `src/data/${setLower}/effects.ts`
  const out = scaffold && !existsSync(target) ? target : `src/data/${setLower}/effects.draft.ts`

  const pretty = (v: unknown) =>
    JSON.stringify(v)
      .replace(/"([a-zA-Z_$][a-zA-Z0-9_$]*)":/g, '$1: ')
      .replace(/,(?=["a-z{[])/g, ', ')

  const lines: string[] = [
    `import type { EffectDef, StaticDef } from '@/engine/effects/ast'`,
    ``,
    `/**`,
    ` * ${setCode} effect definitions as DSL data, keyed by card ID. Compiled`,
    ` * entries were drafted by scripts/compile-effects.ts and must be reviewed;`,
    ` * TODO comments carry the clauses the grammar refused to guess at.`,
    ` */`,
    `export const ${setCode}_EFFECTS: Record<string, EffectDef[]> = {`,
  ]
  for (const c of compiled) {
    for (const t of c.todos) lines.push(`  // TODO ${c.id} ${t}`)
    if (c.defs.length > 0) {
      lines.push(`  '${c.id}': [`)
      for (const d of c.defs) lines.push(`    ${pretty(d)},`)
      lines.push(`  ],`)
    }
  }
  lines.push(`}`, ``, `/** Continuous effects (auras), applied at read time. */`)
  lines.push(`export const ${setCode}_STATICS: Record<string, StaticDef[]> = {`)
  for (const c of compiled) {
    if (c.statics.length > 0) {
      lines.push(`  '${c.id}': [`)
      for (const s of c.statics) lines.push(`    ${pretty(s)},`)
      lines.push(`  ],`)
    }
  }
  lines.push(`}`, ``)
  const kw = compiled.filter((c) => c.keywordOnly && c.todos.length === 0 && c.defs.length === 0 && c.statics.length === 0).map((c) => c.id)
  lines.push(`/** Cards fully handled by the keyword parser and/or the rules layer. */`)
  lines.push(`export const KEYWORD_ONLY_${setCode}: string[] = ${pretty(kw)}`, ``)
  lines.push(`/** The coverage ledger: every deviation from the printed text, with the reason. */`)
  lines.push(`export const COVERAGE_NOTES_${setCode}: Record<string, string> = {`)
  for (const c of compiled) {
    for (const n of c.notes) lines.push(`  '${c.id}': 'SIMPLIFIED: ${n.replace(/'/g, "\\'")}',`)
  }
  lines.push(`}`, ``)
  writeFileSync(out, lines.join('\n'))
  console.log(`\nwrote ${out}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
