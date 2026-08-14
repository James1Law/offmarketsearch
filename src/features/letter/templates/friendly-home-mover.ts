import type {
  BuyerPosition,
  FundingType,
  LetterContent,
  Motivation,
  RefineFilters,
  SelectedAddress,
  Timescale,
} from "@/types"
import { PROPERTY_TYPE_LABELS, isDefaultFilters } from "@/features/refine/filters"

export const TEMPLATE_ID = "friendly-home-mover"

export const TEMPLATE_LABEL = "Friendly home mover"

export type TextFieldKey = "senderName" | "senderAddress" | "senderPhone" | "senderEmail"

export const FIELD_LABELS: Record<TextFieldKey, string> = {
  senderName: "Your name",
  senderAddress: "Your current address",
  senderPhone: "Your phone number",
  senderEmail: "Your email address",
}

export const FIELD_HINTS: Record<TextFieldKey, string> = {
  senderName: "Appears in your letter's sign-off",
  senderAddress: "Shown at the top of your letter",
  senderPhone: "Optional — so the homeowner can call or text you",
  senderEmail: "Optional — so the homeowner can email you",
}

export const FIELD_PLACEHOLDERS: Record<TextFieldKey, string> = {
  senderName: "James & Sarah Law",
  senderAddress: "14 Maple Avenue, London NW3 2AB",
  senderPhone: "07700 900123",
  senderEmail: "james@example.com",
}

// Dropdown options — the letter is composed from these instead of free text,
// so there's nothing for a sender to misuse.

export const POSITION_OPTIONS: Array<{ value: BuyerPosition; label: string }> = [
  { value: "nothing-to-sell", label: "Nothing to sell" },
  { value: "sstc", label: "Currently SSTC" },
  { value: "on-market", label: "On the market" },
  { value: "not-on-market-yet", label: "Not on the market yet" },
]

export const FUNDING_OPTIONS: Array<{ value: FundingType; label: string }> = [
  { value: "cash", label: "Cash buyer" },
  { value: "mortgage", label: "Mortgage" },
]

export const TIMESCALE_OPTIONS: Array<{ value: Timescale; label: string }> = [
  { value: "2-3-months", label: "2–3 months" },
  { value: "3-6-months", label: "3–6 months" },
  { value: "relaxed", label: "Relaxed — to suit the homeowner" },
]

export const MOTIVATION_OPTIONS: Array<{ value: Motivation; label: string }> = [
  { value: "first-time-buyer", label: "First-time buyer" },
  { value: "upsizing", label: "Upsizing" },
  { value: "downsizing", label: "Downsizing" },
  { value: "relocation", label: "Relocation" },
  { value: "second-home", label: "Second home" },
  { value: "investment", label: "Investment property" },
  { value: "development", label: "Development opportunity" },
]

const MOTIVATION_SENTENCES: Record<Motivation, string> = {
  downsizing: "I am looking to downsize.",
  upsizing: "I am looking to upsize to a larger home.",
  "second-home": "I am searching for a second home.",
  investment: "I am looking for an investment property.",
  development: "I am looking for a development opportunity.",
  relocation: "I am relocating to the area.",
  "first-time-buyer": "I am a first-time buyer.",
}

const POSITION_SENTENCES: Record<BuyerPosition, string> = {
  "nothing-to-sell": "I have nothing to sell, so there would be no onward chain.",
  sstc: "My current home is sold subject to contract.",
  "on-market": "My current home is already on the market.",
  "not-on-market-yet": "My own home is not on the market yet.",
}

const FUNDING_SENTENCES: Record<FundingType, string> = {
  cash: "I would be a cash buyer.",
  mortgage: "I would be buying with a mortgage.",
}

const TIMESCALE_SENTENCES: Record<Timescale, string> = {
  "2-3-months": "Ideally I am hoping to move within 2–3 months.",
  "3-6-months": "Ideally I am hoping to move within 3–6 months.",
  relaxed: "My timescale is relaxed — I am happy to move at a pace that suits you.",
}

export const OUTRO_TEXT =
  "This letter was sent to you by Offline.homes, on behalf of a customer. If you're thinking about selling, and you're wondering how an off-market sale would work, just visit us at Offline.homes/sell."

export const DISCLAIMER_TEXT =
  "If you do not wish to receive further marketing from Offline.homes, please write to hello@offline.homes quoting your address and we will add it to our do-not-contact list."

function joinList(items: string[], conjunction: string): string {
  if (items.length <= 1) return items.join("")
  return `${items.slice(0, -1).join(", ")} ${conjunction} ${items[items.length - 1]}`
}

/** Turn the refine-step filters into a phrase like
 *  "a detached or semi-detached property with 3+ bedrooms and a garden". */
export function describeCriteria(filters: RefineFilters | null): string | null {
  if (!filters || isDefaultFilters(filters)) return null

  const typePhrase =
    filters.propertyTypes.length > 0
      ? joinList(
          filters.propertyTypes.map((t) => PROPERTY_TYPE_LABELS[t].toLowerCase()),
          "or",
        )
      : null

  const withParts: string[] = []
  if (filters.minBedrooms > 0) withParts.push(`${filters.minBedrooms}+ bedrooms`)
  if (filters.minFloorAreaSqm > 0) withParts.push(`at least ${filters.minFloorAreaSqm} m²`)
  if (filters.mustHaveParking) withParts.push("off-street parking")
  if (filters.mustHaveGarage) withParts.push("a garage")

  let phrase = typePhrase ? `a ${typePhrase} property` : "a property"
  if (withParts.length > 0) phrase += ` with ${joinList(withParts, "and")}`
  return phrase
}

/** Plain-text body of the letter, for compact previews like the basket snippet. */
export function renderLetterText(
  content: LetterContent,
  recipient: SelectedAddress | null,
  filters: RefineFilters | null,
): string {
  const letter = renderLetter(content, recipient, filters)
  return [letter.salutation, ...letter.paragraphs, letter.signOff, letter.signature].join("\n\n")
}

export interface RenderedLetter {
  /** Sender address lines, then phone and email — shown top right. */
  senderLines: string[]
  dateLine: string
  /** Recipient block — shown on the left below the sender block. */
  recipientLines: string[]
  salutation: string
  paragraphs: string[]
  signOff: string
  signature: string
  outro: string
  disclaimer: string
}

function splitAddressLines(address: string): string[] {
  const byNewline = address
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
  if (byNewline.length > 1) return byNewline
  return (byNewline[0] ?? "")
    .split(",")
    .map((l) => l.trim())
    .filter(Boolean)
}

export function renderLetter(
  content: LetterContent,
  recipient: SelectedAddress | null,
  filters: RefineFilters | null,
): RenderedLetter {
  const { senderName, senderAddress } = content
  const senderPhone = content.senderPhone?.trim() ?? ""
  const senderEmail = content.senderEmail?.trim() ?? ""

  const dateLine = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  const senderLines = [
    ...splitAddressLines(senderAddress),
    ...(senderPhone ? [senderPhone] : []),
    ...(senderEmail ? [senderEmail] : []),
  ]

  const recipientLines = [
    "The Homeowner",
    ...(recipient
      ? [recipient.streetAddress, ...(recipient.postcode ? [recipient.postcode] : [])]
      : []),
  ]

  const criteria = describeCriteria(filters)

  const situationSentences = [
    content.motivation ? MOTIVATION_SENTENCES[content.motivation] : null,
    content.position ? POSITION_SENTENCES[content.position] : null,
    content.funding ? FUNDING_SENTENCES[content.funding] : null,
    content.timescale ? TIMESCALE_SENTENCES[content.timescale] : null,
  ].filter((s): s is string => s !== null)

  const contactMethods = [
    senderPhone ? `call or text me on ${senderPhone}` : null,
    senderEmail ? `email me at ${senderEmail}` : null,
  ].filter((m): m is string => m !== null)

  const reachMe =
    contactMethods.length > 0
      ? `You can ${contactMethods.join(", ")}, or reply to this letter at the address above.`
      : "You can reach me by replying to this letter at the address above."

  const paragraphs = [
    `My name is ${senderName}. I am looking to buy ${criteria ?? "a property"} on or near your street, and your home is exactly the sort of place I have been searching for. Rather than wait for it to appear on Rightmove, I wanted to write to you directly in case you have ever considered a sale — or might know someone nearby who has.`,
    ...(situationSentences.length > 0
      ? [`A little about my situation: ${situationSentences.join(" ")}`]
      : []),
    "I appreciate that this may come out of the blue, and of course there is no obligation at all. If you are not currently considering a move, I completely understand. But if you are — or if you ever are in the future — I would love to have a conversation.",
    `${reachMe} Thank you so much for taking the time to read this.`,
  ]

  return {
    senderLines,
    dateLine,
    recipientLines,
    salutation: "Dear Homeowner,",
    paragraphs,
    signOff: "Yours sincerely,",
    signature: senderName,
    outro: OUTRO_TEXT,
    disclaimer: DISCLAIMER_TEXT,
  }
}
