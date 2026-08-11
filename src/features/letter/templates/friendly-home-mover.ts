import type { LetterContent } from "@/types"

export const TEMPLATE_ID = "friendly-home-mover"

export const TEMPLATE_LABEL = "Friendly home mover"

type FieldKey = keyof Omit<LetterContent, "templateId">

export const FIELD_LABELS: Record<FieldKey, string> = {
  senderName: "Your name",
  senderAddress: "Your current address",
  senderPhone: "Your phone number",
  senderEmail: "Your email address",
  personalMessage: "Your personal message",
}

export const FIELD_HINTS: Record<FieldKey, string> = {
  senderName: "Appears in your letter's sign-off",
  senderAddress: "So the homeowner knows where you currently live",
  senderPhone: "Optional — so the homeowner can call or text you",
  senderEmail: "Optional — so the homeowner can email you",
  personalMessage:
    "Tell them what you love about the area or why their home caught your eye. Warm, personal letters get better responses.",
}

export const FIELD_PLACEHOLDERS: Record<FieldKey, string> = {
  senderName: "James & Sarah Law",
  senderAddress: "14 Maple Avenue, London NW3 2AB",
  senderPhone: "07700 900123",
  senderEmail: "james@example.com",
  personalMessage:
    "We've admired your street for years and would love to raise our family here…",
}

export function renderTemplate(content: LetterContent): string {
  const { senderName, senderAddress, personalMessage } = content
  const senderPhone = content.senderPhone?.trim() ?? ""
  const senderEmail = content.senderEmail?.trim() ?? ""
  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  const contactMethods = [
    senderPhone ? `call or text me on ${senderPhone}` : null,
    senderEmail ? `email me at ${senderEmail}` : null,
  ].filter((m): m is string => m !== null)

  const reachMe =
    contactMethods.length > 0
      ? `You can ${contactMethods.join(", ")}, or reply to this letter at the address above.`
      : "You can reach me by replying to this letter at the address above."

  const signatureContactLines = [senderPhone, senderEmail].filter(Boolean).join("\n")

  return `${senderAddress}

${today}

Dear Homeowner,

My name is ${senderName}, and I am writing to you from ${senderAddress}.

I am looking to buy a property on or near your street, and your home is exactly the sort of place I have been searching for. Rather than wait for it to appear on Rightmove, I wanted to write to you directly in case you have ever considered a sale — or might know someone nearby who has.

${personalMessage}

I appreciate that this may come out of the blue, and of course there is no obligation at all. If you are not currently considering a move, I completely understand. But if you are — or if you ever are in the future — I would love to have a conversation.

${reachMe}

Thank you so much for taking the time to read this.

Yours sincerely,

${senderName}${signatureContactLines ? `\n${signatureContactLines}` : ""}
`
}
