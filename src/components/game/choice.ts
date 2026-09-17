/** Board-anchored effect choice: eligible cards light up, chosen ones fill in */
export interface ChoiceHighlight {
  options: string[]
  selected: string[]
}

export type CardChoiceState = 'chosen' | 'eligible' | 'excluded'

export function choiceStateFor(
  choice: ChoiceHighlight | undefined,
  instanceId: string,
): CardChoiceState | undefined {
  if (!choice) return undefined
  if (choice.selected.includes(instanceId)) return 'chosen'
  if (choice.options.includes(instanceId)) return 'eligible'
  return 'excluded'
}

export function choiceRing(state: CardChoiceState | undefined): string {
  if (state === 'chosen') return 'ring-2 ring-action-green scale-105'
  if (state === 'eligible') return 'ring-2 ring-action-green/50'
  if (state === 'excluded') return 'opacity-40'
  return ''
}
