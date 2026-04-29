import type { LetterContent } from "@/types"

export const TEMPLATE_ID = "friendly-home-mover"

export const TEMPLATE_LABEL = "Friendly home mover"

export const FIELD_LABELS: Record<keyof Omit<LetterContent, "templateId">, string> = {
  senderName: "Your name",
  senderAddress: "Your current address",
  personalMessage: "Your personal message",
}

export const FIELD_HINTS: Record<keyof Omit<LetterContent, "templateId">, string> = {
  senderName: "E.g. James & Sarah Law",
  senderAddress: "So the homeowner knows where you currently live",
  personalMessage:
    "Tell them what you love about the area or why their home caught your eye. Warm, personal letters get better responses.",
}

export function renderTemplate(content: LetterContent): string {
  const { senderName, senderAddress, personalMessage } = content
  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })

  return `${senderAddress}

${today}

Dear Homeowner,

My name is ${senderName}, and I am writing to you from ${senderAddress}.

I am looking to buy a property on or near your street, and your home is exactly the sort of place I have been searching for. Rather than wait for it to appear on Rightmove, I wanted to write to you directly in case you have ever considered a sale — or might know someone nearby who has.

${personalMessage}

I appreciate that this may come out of the blue, and of course there is no obligation at all. If you are not currently considering a move, I completely understand. But if you are — or if you ever are in the future — I would love to have a conversation.

You can reach me by replying to this letter at the address above.

Thank you so much for taking the time to read this.

Yours sincerely,

${senderName}
`
}
