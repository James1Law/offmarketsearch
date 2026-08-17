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
  MAX_SENDER_PHONE_CHARS: 30,
  MAX_SENDER_EMAIL_CHARS: 100,
} as const

export const TEMPLATE_IDS = {
  FRIENDLY_HOME_MOVER: "friendly-home-mover",
} as const

export const MAP_DEFAULTS = {
  CENTER_LNG: -1.5,
  CENTER_LAT: 52.5,
  ZOOM: 6,
  MAX_ADDRESSES_PER_DRAW: 50,
  // Zoom level at which address pins load automatically for the viewport.
  PIN_ZOOM: 16,
  VIEWPORT_DEBOUNCE_MS: 500,
} as const

// Past this age, a saved campaign is confirmed with the user on return rather
// than silently restored. A day covers "I came back after lunch"; anything
// older is likely a different search, or a different person's phone.
export const CAMPAIGN_STALE_MS = 24 * 60 * 60 * 1000

export const AREA_SELECT = {
  DEFAULT_RADIUS_M: 1000,
  MIN_RADIUS_M: 250,
  // A 5km circle over a city matches thousands of homes, far more than the
  // 50-letter campaign cap. That is fine because results are ranked by distance
  // from the centre before the cap applies, so a wide radius means "the closest
  // 50 to where I tapped" rather than an arbitrary 50.
  MAX_RADIUS_M: 5000,
  RADIUS_STEP_M: 250,
  // Vertices used to approximate the circle. 64 looks smooth at every zoom
  // the map allows without bloating the Overpass query.
  CIRCLE_STEPS: 64,
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
