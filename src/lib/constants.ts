export const PRICING = {
  PER_LETTER_PENCE: 250,
  PACKS: [
    { quantity: 5, pricePence: 1499, label: "5 letters" },
    { quantity: 10, pricePence: 2499, label: "10 letters" },
    { quantity: 25, pricePence: 4999, label: "25 letters" },
  ],
} as const

export const LIMITS = {
  MAX_LETTERS_PER_CAMPAIGN: 50,
  MAX_SENDER_NAME_CHARS: 100,
  MAX_SENDER_ADDRESS_CHARS: 300,
  MAX_PERSONAL_MESSAGE_CHARS: 600,
} as const

export const TEMPLATE_IDS = {
  FRIENDLY_HOME_MOVER: "friendly-home-mover",
} as const

export const MAP_DEFAULTS = {
  CENTER_LNG: -1.5,
  CENTER_LAT: 52.5,
  ZOOM: 6,
  MAX_ADDRESSES_PER_DRAW: 50,
} as const

export function formatPence(pence: number): string {
  return `£${(pence / 100).toFixed(2)}`
}

export function calcTotalPence(letterCount: number): number {
  const sorted = [...PRICING.PACKS].sort((a, b) => b.quantity - a.quantity)
  for (const pack of sorted) {
    if (letterCount >= pack.quantity) {
      const packs = Math.floor(letterCount / pack.quantity)
      const remainder = letterCount % pack.quantity
      return packs * pack.pricePence + remainder * PRICING.PER_LETTER_PENCE
    }
  }
  return letterCount * PRICING.PER_LETTER_PENCE
}
