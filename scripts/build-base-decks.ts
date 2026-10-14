/* Build the base deck pool (BOT_PLAN 4.5 + the deck picker's "Base decks").
 * Curated cores follow the OP16-era meta archetypes (onepiece.gg tier list,
 * Oct 2026), with ST-set staples substituted since starter decks are not in
 * the ingested pool. The remainder of each list is a deterministic fill:
 * color-legal cards matching the archetype's types, preferring counters until
 * the deck holds 16 counter cards, then stat efficiency on a low curve.
 *
 * Output is FROZEN at src/data/baseDecks.json - rerun deliberately on a meta
 * change and note it in BOT_PLAN.md.
 *
 * Run: vite-node scripts/build-base-decks.ts
 */
import { writeFileSync } from 'node:fs'
import { getAllCards, getCardById } from '@/data/cardService'

interface Spec {
  id: string
  name: string
  archetype: string
  leader: string
  core: [string, number][]
  fillTypes: string[]
}

const SPECS: Spec[] = [
  {
    id: 'base-enel',
    name: 'Purple Enel',
    archetype: '6-DON tempo ramp (OP16 meta tier 1)',
    leader: 'OP15-058',
    core: [
      ['OP15-060', 4], ['OP15-118', 4], ['OP15-061', 4], ['OP15-066', 4],
      ['OP15-067', 4], ['OP15-068', 4], ['OP15-065', 4], ['OP15-059', 4],
      ['OP15-063', 4], ['OP15-077', 4], ['OP15-078', 4], ['OP15-075', 3],
      ['OP15-074', 3],
    ],
    fillTypes: ['Sky Island'],
  },
  {
    id: 'base-luffy-bg',
    name: 'Blue-Green Luffy',
    archetype: 'Impel Down midrange (OP16 meta tier 1)',
    leader: 'OP16-022',
    core: [
      ['OP16-034', 4], ['OP16-054', 4], ['OP16-055', 4], ['OP16-056', 4],
      ['OP16-045', 4], ['OP16-026', 4], ['OP16-048', 4], ['OP16-042', 4],
      ['OP16-038', 4],
    ],
    fillTypes: ['Impel Down', 'Baroque Works'],
  },
  {
    id: 'base-rosinante',
    name: 'Purple-Yellow Rosinante',
    archetype: 'Navy admiral ramp (OP16 meta tier 1)',
    leader: 'OP12-061',
    core: [
      ['EB04-038', 4], ['EB04-058', 4], ['OP16-064', 4], ['OP16-067', 4],
      ['OP16-065', 3],
    ],
    fillTypes: ['Navy', 'Donquixote Pirates'],
  },
  {
    id: 'base-teach',
    name: 'Black-Yellow Teach',
    archetype: 'Blackbeard control (OP16 meta tier 2)',
    leader: 'OP16-080',
    core: [
      ['OP16-110', 4], ['OP16-103', 4], ['OP16-106', 4], ['OP16-119', 2],
      ['OP09-093', 2],
    ],
    fillTypes: ['Blackbeard Pirates'],
  },
  {
    id: 'base-lucy',
    name: 'Red-Blue Lucy',
    archetype: 'Dressrosa events (OP16 meta tier 2)',
    leader: 'OP15-002',
    core: [
      ['OP15-046', 4], ['OP15-021', 4], ['OP15-020', 2], ['OP09-118', 2],
      ['OP06-058', 2], ['OP15-040', 4], ['OP15-045', 4], ['OP15-042', 4],
      ['OP15-055', 3], ['OP15-054', 3],
    ],
    fillTypes: ['Dressrosa'],
  },
  {
    id: 'base-yamato',
    name: 'Black Yamato',
    archetype: 'Wano cost control (OP16 meta tier 2)',
    leader: 'OP16-079',
    core: [['OP16-096', 4], ['OP16-098', 4], ['OP16-082', 4]],
    fillTypes: ['Land of Wano'],
  },
  {
    id: 'base-kalgara',
    name: 'Yellow Kalgara',
    archetype: 'Shandian life tempo (OP16 meta dark horse)',
    leader: 'OP08-098',
    core: [
      ['OP15-101', 4], ['OP15-119', 4], ['OP15-114', 4], ['OP15-108', 4],
      ['OP15-110', 4], ['OP15-112', 4], ['OP15-111', 4], ['OP15-117', 4],
      ['OP16-119', 2],
    ],
    fillTypes: ['Sky Island', 'Shandian Warrior'],
  },
  {
    id: 'base-ace-red',
    name: 'Red Whitebeard Ace',
    archetype: 'Moby Dick aggro (OP16 meta tier 3)',
    leader: 'OP16-001',
    core: [['OP16-021', 4], ['OP16-014', 4], ['OP16-003', 3]],
    fillTypes: ['Whitebeard Pirates'],
  },
]

function build(spec: Spec) {
  const leader = getCardById(spec.leader)
  if (!leader || leader.cardType !== 'Leader') throw new Error(`bad leader ${spec.leader}`)
  const colors = new Set(leader.color)

  const cards: { cardId: string; qty: number }[] = []
  let total = 0
  let counterCards = 0
  for (const [id, qty] of spec.core) {
    const c = getCardById(id)
    if (!c) throw new Error(`${spec.id}: unknown core card ${id}`)
    if (!c.color.some((col) => colors.has(col))) {
      throw new Error(`${spec.id}: ${id} colors ${c.color} illegal for ${leader.color}`)
    }
    cards.push({ cardId: id, qty })
    total += qty
    if ((c.counter ?? 0) >= 1000) counterCards += qty
  }
  if (total > 50) throw new Error(`${spec.id}: core overflows (${total})`)

  const candidates = getAllCards()
    .filter(
      (c) =>
        c.cardType !== 'Leader' &&
        c.color.some((col) => colors.has(col)) &&
        !cards.some((d) => d.cardId === c.id),
    )
    .map((c) => {
      const typeMatch = (c.attribute ?? []).some((t) => spec.fillTypes.includes(t))
      return { c, typeMatch }
    })
    .filter((x) => x.typeMatch) // archetype-pure fill; generic staples stay out

  const score = (c: (typeof candidates)[number]['c'], needCounters: boolean) =>
    (needCounters && (c.counter ?? 0) >= 1000 ? 40 : 0) +
    ((c.counter ?? 0) >= 2000 ? 5 : 0) +
    ((c.power ?? 0) / 1000 - c.cost) * 2 +
    Math.max(0, 5 - c.cost)

  while (total < 50) {
    const needCounters = counterCards < 16
    const ranked = candidates
      .filter((x) => !cards.some((d) => d.cardId === x.c.id))
      .sort(
        (a, b) =>
          score(b.c, needCounters) - score(a.c, needCounters) || a.c.id.localeCompare(b.c.id),
      )
    const pick = ranked[0]
    if (!pick) throw new Error(`${spec.id}: fill pool exhausted at ${total}`)
    const qty = Math.min(4, 50 - total)
    cards.push({ cardId: pick.c.id, qty })
    total += qty
    if ((pick.c.counter ?? 0) >= 1000) counterCards += qty
  }

  return {
    id: spec.id,
    name: spec.name,
    archetype: spec.archetype,
    leader: spec.leader,
    frozen: '2026-10-14',
    cards,
  }
}

const decks = SPECS.map(build)
writeFileSync('src/data/baseDecks.json', JSON.stringify(decks, null, 2) + '\n')
for (const d of decks) {
  const n = d.cards.reduce((s, c) => s + c.qty, 0)
  const counters = d.cards.reduce(
    (s, c) => s + (((getCardById(c.cardId)?.counter ?? 0) >= 1000 ? c.qty : 0) as number),
    0,
  )
  console.log(`${d.id.padEnd(16)} ${String(n)} cards · ${counters} counters · ${d.archetype}`)
}
