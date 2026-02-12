const LIMITLESS_CDN = 'https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/one-piece'

export function getCardImageUrl(cardId: string): string {
  const set = cardId.split('-')[0] // "OP01" from "OP01-001"
  return `${LIMITLESS_CDN}/${set}/${cardId}_EN.webp`
}

export function getCardBackUrl(): string {
  return '/assets/card-back.svg'
}
