/**
 * Set-ingestion harness, step 1 of the per-set checklist:
 *   npm run ingest -- OP-02
 * Fetches a set from optcgapi.com, converts rows to our CardData shape, and
 * writes src/data/<set>/cards.json + battleAttributes.json. Effect defs are
 * NOT generated here - they are authored against the printed text and gated
 * by the set's coverage test.
 *
 * Known API quirks handled below: names carry "(NNN)"/"(Parallel)" suffixes,
 * parallel arts duplicate rows, colors and type lists are space-joined
 * (types need a vocabulary to split multi-word names), [Trigger] text is
 * embedded in card_text, leaders have null cost.
 */
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs'
import type { CardData } from '@/engine/types'

interface ApiRow {
  card_set_id: string
  card_name: string
  card_type: string
  card_color: string | null
  card_cost: string | null
  card_power: string | null
  counter_amount: number | null
  life: string | null
  sub_types: string | null
  attribute: string | null
  card_text: string | null
  rarity: string
}

/** Multi-word type names the space-joined sub_types field can't self-segment.
 * OP01's list is derived from its (verified) cards.json; add new multi-word
 * names here as sets introduce them - the report flags any string that fails
 * to segment. */
const SEED_TYPES = [
  'Black Cat Pirates',
  'Alvida Pirates',
  'The Franky Family',
  'World Government',
  'The Sun Pirates',
  'Krieg Pirates',
  'Big Mom Pirates',
  'Former Baroque Works',
  'Neo Navy',
  'Golden Lion Pirates',
  'The Pirates Fest',
  'World Pirates',
  'Jailer Beast',
  'The Akazaya Nine',
  'Animal',
  'Minks',
  'FILM',
  'Film',
  'SMILE',
  'Smile',
  'Whitebeard Pirates Allies',
  'Whitebeard Pirates',
  'Former Whitebeard Pirates',
  'Former Navy',
  'Former Roger Pirates',
  'Roger Pirates',
  'Impel Down',
  'Kouzuki Clan',
  'Kozuki Clan',
  'Revolutionary Army',
  'Kuja Pirates',
  'Amazon Lily',
  'Spade Pirates',
  'On-Air Pirates',
  'Barto Club',
  'Kid Pirates',
  'Heart Pirates',
  'Big Mom Pirates',
  'Sky Island',
  'Mink Tribe',
  'The Four Emperors',
  'Giant',
  'Merfolk',
  'Navy',
  'Alabasta',
  'Botanist',
  'Punk Hazard',
  'Whole Cake Island',
  'East Blue',
  'Buggy Pirates',
  'Bellamy Pirates',
  'Donquixote Pirates',
  'Drum Kingdom',
  'Vinsmoke Family',
  'Water Seven',
  'Galley-La Company',
  'CP9',
  'Foolshout Island',
  'Goa Kingdom',
  'Windmill Village',
  'Bonney Pirates',
  'Fallen Monk Pirates',
  'Hawkins Pirates',
  'Beautiful Pirates',
  'Caribou Pirates',
  'Fire Tank Pirates',
  'Sun Pirates',
  'New Fish-Man Pirates',
  'Fish-Man',
  'The Flying Fish Riders',
  'Frost Moon Village',
  'Mountain Bandits',
  'Red-Haired Pirates',
  'Rumbar Pirates',
  'Thriller Bark Pirates',
  'The Vinsmoke Family',
  'Egghead',
  'Jaya',
  'Shandian Warrior',
  'Sniper Island',
  'The House of Lambs',
  'Long Ring Long Land',
]

/** The API is inconsistent about casing on a few type names; card text uses
 * the canonical form, and type checks are exact-string. */
const TYPE_ALIASES: Record<string, string> = {
  Film: 'FILM',
  Smile: 'SMILE',
}

function knownTypes(): string[] {
  const fromOp01 = new Set<string>()
  try {
    const op01 = JSON.parse(
      readFileSync('src/data/op01/cards.json', 'utf8'),
    ) as CardData[]
    for (const c of op01) for (const t of c.attribute) fromOp01.add(t)
  } catch {
    // first run without op01 data: seed list only
  }
  const all = [...new Set([...fromOp01, ...SEED_TYPES])]
  return all.sort((a, b) => b.length - a.length)
}

/** Segment a space-joined type string into known type names (longest-first
 * backtracking). Returns null when no full segmentation exists. */
function splitTypes(joined: string, vocab: string[]): string[] | null {
  if (!joined) return []
  const attempt = (rest: string): string[] | null => {
    if (rest === '') return []
    for (const t of vocab) {
      if (rest === t) return [t]
      if (rest.startsWith(t + ' ')) {
        const tail = attempt(rest.slice(t.length + 1))
        if (tail) return [t, ...tail]
      }
    }
    // A single unknown word is a new one-word type; anything longer is
    // ambiguous and must be flagged, then added to SEED_TYPES by hand
    return rest.includes(' ') ? null : [rest]
  }
  return attempt(joined.trim())
}

function findTriggerSection(text: string): number {
  let idx = text.indexOf('[Trigger]')
  while (idx >= 0) {
    const before = text.slice(0, idx).trimEnd()
    if (before === '' || /[.)!]$/.test(before)) return idx
    idx = text.indexOf('[Trigger]', idx + 1)
  }
  return -1
}

function cleanName(raw: string): string {
  return raw
    .replace(/\s*\(Parallel\)\s*/g, '')
    .replace(/\s*\(\d+\)\s*$/g, '')
    .trim()
}

function toInt(v: string | number | null): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

async function main() {
  const apiSetId = process.argv[2]
  if (!apiSetId) {
    console.error('usage: npm run ingest -- <API set id, e.g. OP-02>')
    process.exit(1)
  }
  const setCode = apiSetId.replace('-', '') // OP-02 -> OP02
  const dir = `src/data/${setCode.toLowerCase()}`

  const res = await fetch(`https://optcgapi.com/api/sets/${apiSetId}/`)
  if (!res.ok) throw new Error(`API ${res.status} for set ${apiSetId}`)
  const rows = (await res.json()) as ApiRow[]
  if (!Array.isArray(rows)) throw new Error(`Unexpected payload: ${JSON.stringify(rows).slice(0, 120)}`)

  // Dedupe parallel arts (prefer the non-Parallel row) and drop alt-art
  // reprints of OTHER sets' cards that the API lists inside this set
  const byId = new Map<string, ApiRow>()
  for (const row of rows) {
    if (!row.card_set_id.startsWith(setCode + '-')) continue
    const existing = byId.get(row.card_set_id)
    const isParallel = (row.card_name ?? '').includes('(Parallel)')
    if (!existing || ((existing.card_name ?? '').includes('(Parallel)') && !isParallel)) {
      byId.set(row.card_set_id, row)
    }
  }

  const vocab = knownTypes()
  const cards: CardData[] = []
  const battleAttrs: Record<string, string> = {}
  const problems: string[] = []

  for (const row of [...byId.values()].sort((a, b) => a.card_set_id.localeCompare(b.card_set_id))) {
    const raw = (row.card_text ?? '').trim()
    const text = raw === 'NULL' ? '' : raw // the API spells "no effect" as literal NULL
    // A trigger SECTION's [Trigger] sits at the start or after sentence-ending
    // punctuation; "a [Trigger] from your hand" mid-sentence is a keyword
    // MENTION, not a section break.
    const trigIdx = findTriggerSection(text)
    const effectText = (trigIdx >= 0 ? text.slice(0, trigIdx) : text).trim()
    const triggerText = trigIdx >= 0 ? text.slice(trigIdx + '[Trigger]'.length).trim() : null

    const rawTypes = row.sub_types === 'NULL' ? '' : (row.sub_types ?? '')
    const types = splitTypes(rawTypes, vocab)?.map((t) => TYPE_ALIASES[t] ?? t) ?? null
    if (types === null) problems.push(`${row.card_set_id}: cannot segment types "${row.sub_types}"`)

    const cardType = row.card_type as CardData['cardType']
    if (!['Leader', 'Character', 'Event', 'Stage'].includes(cardType)) {
      problems.push(`${row.card_set_id}: unknown card type "${row.card_type}"`)
      continue
    }

    if ((cardType === 'Character' || cardType === 'Leader') && row.attribute) {
      battleAttrs[row.card_set_id] = row.attribute
    } else if (cardType === 'Character' || cardType === 'Leader') {
      problems.push(`${row.card_set_id}: missing battle attribute`)
    }

    cards.push({
      id: row.card_set_id,
      name: cleanName(row.card_name),
      cardType,
      color: (row.card_color ?? '').split(' ').filter(Boolean) as CardData['color'],
      cost: toInt(row.card_cost) ?? 0,
      power: toInt(row.card_power),
      counter: toInt(row.counter_amount),
      life: toInt(row.life),
      attribute: types ?? [row.sub_types ?? ''],
      effectText,
      triggerText: triggerText || null,
      rarity: row.rarity as CardData['rarity'],
      set: setCode,
      imageUrl: '',
    })
  }

  mkdirSync(dir, { recursive: true })
  writeFileSync(`${dir}/cards.json`, JSON.stringify(cards, null, 2) + '\n')
  writeFileSync(`${dir}/battleAttributes.json`, JSON.stringify(battleAttrs, null, 2) + '\n')

  const byType = cards.reduce<Record<string, number>>((acc, c) => {
    acc[c.cardType] = (acc[c.cardType] ?? 0) + 1
    return acc
  }, {})
  console.log(`${setCode}: ${cards.length} cards ->`, byType)
  console.log(`battle attributes: ${Object.keys(battleAttrs).length}`)
  console.log(`with effect text: ${cards.filter((c) => c.effectText).length}, with trigger: ${cards.filter((c) => c.triggerText).length}`)
  if (problems.length > 0) {
    console.log(`\n⚠ ${problems.length} problems to resolve by hand:`)
    for (const p of problems) console.log('  ' + p)
    process.exitCode = 1
  } else {
    console.log('\n✓ clean ingest')
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
